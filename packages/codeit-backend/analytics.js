'use strict';

const pool = require('./db');
const { normalizeEventName, normalizeMeta, normalizeJourneyId, normalizeCampaignCode } = require('./analyticsEvents');
const { listFoundingFamilyLeads } = require('./foundingWaitlist');
const { ready: legacyParentReviewReady } = require('./legacyParentReview');
const ACTIVATION_ENTRY_TRACKING_SINCE = '2026-08-01';

const tableReady = pool.dialect === 'postgres' ? Promise.resolve(true) : pool.query(`
  CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(40) NOT NULL,
    user_id INT NULL,
    meta VARCHAR(40) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_analytics_event_created (event_name, created_at),
    INDEX idx_analytics_user_event (user_id, event_name)
  ) ENGINE=InnoDB
`).then(async () => {
  try {
    const [journeyColumns] = await pool.query(
      "SHOW COLUMNS FROM analytics_events LIKE 'journey_id'"
    );
    if (!journeyColumns.length) {
      await pool.query(
        'ALTER TABLE analytics_events ADD COLUMN journey_id CHAR(36) NULL AFTER user_id, ADD INDEX idx_analytics_journey_event (journey_id, event_name)'
      );
    }
    const [campaignColumns] = await pool.query(
      "SHOW COLUMNS FROM analytics_events LIKE 'campaign_code'"
    );
    if (!campaignColumns.length) {
      await pool.query(
        'ALTER TABLE analytics_events ADD COLUMN campaign_code VARCHAR(24) NULL AFTER journey_id, ADD INDEX idx_analytics_campaign_event (campaign_code, event_name)'
      );
    }
    await pool.query(
      'DELETE FROM analytics_events WHERE created_at < DATE_SUB(NOW(), INTERVAL 13 MONTH)'
    );
  } catch (err) {
    console.error('Analytics retention cleanup failed:', err.message);
  }
  return true;
}).catch((err) => {
  console.error('Analytics table initialization failed:', err.message);
  return false;
});

async function recordEvent(eventName, { userId = null, journeyId = null, campaignCode = null, meta = null } = {}) {
  const normalizedEvent = normalizeEventName(eventName);
  if (!normalizedEvent) return false;

  const normalizedUserId = Number.isInteger(Number(userId)) && Number(userId) > 0
    ? Number(userId)
    : null;
  const normalizedMeta = normalizeMeta(normalizedEvent, meta);
  const normalizedJourneyId = normalizeJourneyId(journeyId);
  const normalizedCampaignCode = normalizedEvent === 'acquisition_visit'
    ? normalizeCampaignCode(campaignCode)
    : null;

  try {
    if (!await tableReady) return false;
    await pool.query(
      'INSERT INTO analytics_events (event_name, user_id, journey_id, campaign_code, meta) VALUES (?, ?, ?, ?, ?)',
      [normalizedEvent, normalizedUserId, normalizedJourneyId, normalizedCampaignCode, normalizedMeta]
    );
    return true;
  } catch (err) {
    console.error('Analytics event write failed:', err.message);
    return false;
  }
}

async function getFunnelReport(requestedDays = 30) {
  const days = [7, 30, 90].includes(Number(requestedDays)) ? Number(requestedDays) : 30;

  try {
    if (!await tableReady) return null;
    await legacyParentReviewReady;
    const windowSql = `created_at >= NOW() - INTERVAL '${days} days'`;
    const [[events], [daily], [breakdown], [sourceFunnel], [campaignFunnel], [homepageFunnelRows], [challengeFunnelRows], [studentAgeRows], [progressDeliveries], [accountLeads], directLeads] = await Promise.all([
      pool.query(
        `SELECT event_name, COUNT(*) AS event_count, COUNT(DISTINCT user_id) AS unique_users,
                COUNT(DISTINCT journey_id) AS unique_journeys,
                COUNT(journey_id) AS attributed_events
         FROM analytics_events WHERE ${windowSql}
         GROUP BY event_name`
      ),
      pool.query(
        // Grouped by the same expression the SELECT uses. MySQL accepted
        // DATE(created_at) here; Postgres refused it, and because this runs
        // inside one Promise.all the refusal took the entire funnel report
        // down: /api/analytics/funnel answered 503 and the admin page showed
        // nothing, for every metric, since the database moved.
        `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, event_name, COUNT(*) AS event_count
         FROM analytics_events WHERE ${windowSql}
         GROUP BY 1, 2
         ORDER BY 1 ASC`
      ),
      pool.query(
        `SELECT event_name, meta, COUNT(*) AS event_count,
                COUNT(DISTINCT journey_id) AS unique_journeys,
                COUNT(DISTINCT CASE WHEN created_at >= '${ACTIVATION_ENTRY_TRACKING_SINCE}' THEN journey_id END) AS activation_cohort_journeys
         FROM analytics_events WHERE ${windowSql} AND meta IS NOT NULL
         GROUP BY event_name, meta
         ORDER BY event_name, event_count DESC`
      ),
      pool.query(
        `SELECT source,
                COUNT(*) AS visits,
                SUM(generated_count) AS generated_projects,
                SUM(signup_count) AS completed_signups,
                SUM(family_profile_count) AS managed_profiles,
                SUM(pilot_count) AS pilot_requests,
                SUM(pilot_confirmation_count) AS setup_emails_sent,
                SUM(save_count) AS saved_projects,
                SUM(publish_count) AS published_projects,
                SUM(remix_count) AS remixed_projects
         FROM (
           SELECT journey_id,
                  MAX(CASE WHEN event_name = 'acquisition_visit' THEN meta END) AS source,
                  MAX(CASE WHEN event_name = 'generation_complete' THEN 1 ELSE 0 END) AS generated_count,
                  MAX(CASE WHEN event_name = 'signup_complete' THEN 1 ELSE 0 END) AS signup_count,
                  MAX(CASE WHEN event_name = 'family_child_created' THEN 1 ELSE 0 END) AS family_profile_count,
                  MAX(CASE WHEN event_name = 'pilot_join' THEN 1 ELSE 0 END) AS pilot_count,
                  MAX(CASE WHEN event_name = 'pilot_confirmation' AND meta = 'sent' THEN 1 ELSE 0 END) AS pilot_confirmation_count,
                  MAX(CASE WHEN event_name = 'project_save' THEN 1 ELSE 0 END) AS save_count,
                  MAX(CASE WHEN event_name = 'project_publish' THEN 1 ELSE 0 END) AS publish_count,
                  MAX(CASE WHEN event_name = 'project_remix' THEN 1 ELSE 0 END) AS remix_count
           FROM analytics_events
           WHERE ${windowSql} AND journey_id IS NOT NULL
           GROUP BY journey_id
         ) journeys
         WHERE source IS NOT NULL
         GROUP BY source
         ORDER BY visits DESC`
      ),
      pool.query(
        `SELECT campaign_code, source,
                COUNT(*) AS visits,
                SUM(generated_count) AS generated_projects,
                SUM(signup_count) AS completed_signups,
                SUM(pilot_count) AS pilot_requests,
                SUM(save_count) AS saved_projects,
                SUM(publish_count) AS published_projects,
                SUM(lesson_count) AS completed_lessons
         FROM (
           SELECT journey_id,
                  MAX(CASE WHEN event_name = 'acquisition_visit' THEN campaign_code END) AS campaign_code,
                  MAX(CASE WHEN event_name = 'acquisition_visit' THEN meta END) AS source,
                  MAX(CASE WHEN event_name = 'generation_complete' THEN 1 ELSE 0 END) AS generated_count,
                  MAX(CASE WHEN event_name = 'signup_complete' THEN 1 ELSE 0 END) AS signup_count,
                  MAX(CASE WHEN event_name = 'pilot_join' THEN 1 ELSE 0 END) AS pilot_count,
                  MAX(CASE WHEN event_name = 'project_save' THEN 1 ELSE 0 END) AS save_count,
                  MAX(CASE WHEN event_name = 'project_publish' THEN 1 ELSE 0 END) AS publish_count,
                  MAX(CASE WHEN event_name = 'lesson_complete' THEN 1 ELSE 0 END) AS lesson_count
           FROM analytics_events
           WHERE ${windowSql} AND journey_id IS NOT NULL
           GROUP BY journey_id
         ) journeys
         WHERE campaign_code IS NOT NULL
         GROUP BY campaign_code, source
         ORDER BY visits DESC, campaign_code ASC`
      ),
      pool.query(
        `SELECT COUNT(*) AS views,
                SUM(clicked_count) AS clicked,
                SUM(generated_count) AS generated_projects,
                SUM(signup_count) AS completed_signups,
                SUM(save_count) AS saved_projects
         FROM (
           SELECT journey_id,
                  MAX(CASE WHEN event_name = 'homepage_view' THEN 1 ELSE 0 END) AS homepage_count,
                  MAX(CASE WHEN event_name = 'landing_cta_click' THEN 1 ELSE 0 END) AS clicked_count,
                  MAX(CASE WHEN event_name = 'generation_complete' THEN 1 ELSE 0 END) AS generated_count,
                  MAX(CASE WHEN event_name = 'signup_complete' THEN 1 ELSE 0 END) AS signup_count,
                  MAX(CASE WHEN event_name = 'project_save' THEN 1 ELSE 0 END) AS save_count
           FROM analytics_events
           WHERE ${windowSql} AND journey_id IS NOT NULL
           GROUP BY journey_id
         ) journeys
         WHERE homepage_count = 1`
      ),
      pool.query(
        `SELECT COUNT(*) AS views,
                SUM(started_count) AS started,
                SUM(generated_count) AS generated_projects,
                SUM(save_count) AS saved_projects
         FROM (
           SELECT journey_id,
                  MAX(CASE WHEN event_name = 'challenge_view' THEN 1 ELSE 0 END) AS challenge_count,
                  MAX(CASE WHEN event_name = 'challenge_start' THEN 1 ELSE 0 END) AS started_count,
                  MAX(CASE WHEN event_name = 'generation_complete' THEN 1 ELSE 0 END) AS generated_count,
                  MAX(CASE WHEN event_name = 'project_save' THEN 1 ELSE 0 END) AS save_count
           FROM analytics_events
           WHERE ${windowSql} AND journey_id IS NOT NULL
           GROUP BY journey_id
         ) journeys
         WHERE challenge_count = 1`
      ),
      pool.query(
        `SELECT
           COUNT(*) AS students,
           COUNT(*) FILTER (WHERE dob IS NULL) AS missing_dob,
           COUNT(*) FILTER (WHERE dob IS NOT NULL AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) < 13) AS under_13,
           COUNT(*) FILTER (WHERE dob IS NOT NULL AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) < 13
             AND parent_email IS NOT NULL AND parent_email <> '') AS under_13_with_parent_email,
           COUNT(*) FILTER (WHERE dob IS NOT NULL AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) < 13
             AND (parent_email IS NULL OR parent_email = '')) AS under_13_without_parent_email,
           COUNT(*) FILTER (WHERE dob IS NOT NULL AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) < 13
             AND EXISTS (
               SELECT 1
                 FROM parent_child_links pcl
                 JOIN Users adult ON adult.user_id = pcl.adult_user_id
                 JOIN adult_email_verifications aev
                   ON aev.user_id = adult.user_id
                  AND aev.email = LOWER(adult.email)
                  AND aev.verified_at IS NOT NULL
                WHERE pcl.child_user_id = Users.user_id
             )) AS under_13_verified_managed,
           COUNT(*) FILTER (WHERE dob IS NOT NULL AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) < 13
             AND EXISTS (
               SELECT 1 FROM legacy_parent_reviews lpr
                WHERE lpr.child_user_id = Users.user_id
                  AND lpr.status = 'pending'
                  AND lpr.expires_at > NOW()
             )) AS under_13_review_sent,
           COUNT(*) FILTER (WHERE dob IS NOT NULL AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) BETWEEN 13 AND 18) AS age_13_18,
           COUNT(*) FILTER (WHERE dob IS NOT NULL AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) > 18) AS over_18
         FROM Users WHERE LOWER(role) = 'student'`
      ),
      pool.query(
        `SELECT status, COUNT(*) AS delivery_count
           FROM parent_notification_deliveries
          WHERE created_at >= NOW() - INTERVAL '${days} days'
          GROUP BY status
          ORDER BY status`
      ),
      pool.query(
        `SELECT u.user_id, u.name, u.email, MAX(a.created_at) AS interested_at
         FROM analytics_events a
         INNER JOIN Users u ON u.user_id = a.user_id
         WHERE a.event_name = 'pricing_interest'
           AND a.meta = 'founding-family'
           AND a.created_at >= NOW() - INTERVAL '${days} days'
           AND u.email IS NOT NULL AND u.email <> ''
         GROUP BY u.user_id, u.name, u.email
         ORDER BY interested_at DESC
         LIMIT 100`
      ),
      listFoundingFamilyLeads(days),
    ]);

    const leadsByEmail = new Map();
    for (const lead of accountLeads) {
      leadsByEmail.set(String(lead.email).toLowerCase(), { ...lead, source: 'account-opt-in' });
    }
    for (const lead of directLeads) {
      const key = String(lead.email).toLowerCase();
      const existing = leadsByEmail.get(key);
      if (!existing || new Date(lead.interested_at) > new Date(existing.interested_at)) {
        leadsByEmail.set(key, { ...lead, name: existing?.name || null });
      }
    }
    // ── How many builds an account actually uses in a month ──────────────
    //
    // The plan sells ten AI builds a month. Nobody had ever counted how many
    // families get anywhere near ten, so "unlimited AI builds" was being
    // priced at CA$12 without knowing whether the limit binds on anyone. If
    // the top of this distribution is four, the plan is selling the wrong
    // thing and the price conversation reopens.
    //
    // Run apart from the batch above and allowed to fail on its own: the
    // billing tables are created by the billing migration, and a deploy
    // without them must still return the rest of this report.
    let aiBuildDistribution = null;
    try {
      const [rows] = await pool.query(
        `SELECT builds, COUNT(*) AS accounts
           FROM (
             SELECT user_id, COUNT(*) AS builds
               FROM ai_build_usage
              WHERE created_at >= date_trunc('month', now())
              GROUP BY user_id
           ) per_account
          GROUP BY builds
          ORDER BY builds`
      );
      aiBuildDistribution = rows;
    } catch (err) {
      console.error('AI build distribution failed:', err.message);
    }

    // ── Did a family actually use it ────────────────────────────────────
    //
    // One row per campaign plus one for every visit, tagged or not. Every
    // count is journeys (sessions), at most one per journey per column:
    // a child who presses Run nine times is one engaged start. Rows are
    // journeys with an acquisition_visit, which fires once per session, so
    // "visits" is sessions that arrived, not page loads.
    //
    //   visits              journeys that arrived in the window
    //   signed_in           journeys that carried an account on any event
    //   engaged_python      first Python Run pressed (activity_start python-run)
    //   engaged_game        first real interaction in a game (activity_start game-play)
    //   engaged_any         either
    //   done_first_run      Lesson 1 example printed (activity_complete python-first-run)
    //   done_change_message the changed message run and submitted
    //   done_game           a game changed, then played
    //   done_lesson         a lesson finished: lesson_complete (accounts) or
    //                       guest_lesson_complete (no account)
    //
    // Identity is the session journey; nothing here can say whether the same
    // child came back another day, and no column pretends to.
    let activityFunnel = [];
    try {
      const perJourney = `
        SELECT journey_id,
               MAX(CASE WHEN event_name = 'acquisition_visit' THEN 1 ELSE 0 END) AS visited,
               MAX(CASE WHEN event_name = 'acquisition_visit' THEN campaign_code END) AS campaign_code,
               MAX(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) AS signed_in,
               MAX(CASE WHEN event_name = 'activity_start' AND meta = 'python-run' THEN 1 ELSE 0 END) AS engaged_python,
               MAX(CASE WHEN event_name = 'activity_start' AND meta = 'game-play' THEN 1 ELSE 0 END) AS engaged_game,
               MAX(CASE WHEN event_name = 'activity_complete' AND meta = 'python-first-run' THEN 1 ELSE 0 END) AS done_first_run,
               MAX(CASE WHEN event_name = 'activity_complete' AND meta = 'python-change-message' THEN 1 ELSE 0 END) AS done_change_message,
               MAX(CASE WHEN event_name = 'activity_complete' AND meta = 'game-changed-tested' THEN 1 ELSE 0 END) AS done_game,
               MAX(CASE WHEN event_name IN ('lesson_complete', 'guest_lesson_complete') THEN 1 ELSE 0 END) AS done_lesson
        FROM analytics_events
        WHERE ${windowSql} AND journey_id IS NOT NULL
        GROUP BY journey_id`;
      const sums = `
        COUNT(*) AS visits,
        SUM(signed_in) AS signed_in,
        SUM(engaged_python) AS engaged_python,
        SUM(engaged_game) AS engaged_game,
        SUM(CASE WHEN engaged_python = 1 OR engaged_game = 1 THEN 1 ELSE 0 END) AS engaged_any,
        SUM(done_first_run) AS done_first_run,
        SUM(done_change_message) AS done_change_message,
        SUM(done_game) AS done_game,
        SUM(done_lesson) AS done_lesson`;
      const [[byCampaign], [everyone]] = await Promise.all([
        pool.query(`SELECT campaign_code, ${sums} FROM (${perJourney}) j WHERE visited = 1 AND campaign_code IS NOT NULL GROUP BY campaign_code ORDER BY visits DESC, campaign_code ASC`),
        pool.query(`SELECT NULL AS campaign_code, ${sums} FROM (${perJourney}) j WHERE visited = 1`),
      ]);
      activityFunnel = [...byCampaign, ...everyone.map((row) => ({ ...row, campaign_code: null }))];
    } catch (err) {
      console.error('Activity funnel failed:', err.message);
    }

    const foundingLeads = [...leadsByEmail.values()]
      .sort((a, b) => new Date(b.interested_at) - new Date(a.interested_at))
      .slice(0, 100);

    return {
      days,
      events,
      daily,
      breakdown,
      source_funnel: sourceFunnel,
      campaign_funnel: campaignFunnel,
      activity_funnel: activityFunnel,
      homepage_funnel: homepageFunnelRows[0] || null,
      challenge_funnel: challengeFunnelRows[0] || null,
      activation_entry_tracking_since: ACTIVATION_ENTRY_TRACKING_SINCE,
      student_age_audit: studentAgeRows[0] || null,
      progress_email_delivery: progressDeliveries,
      founding_leads: foundingLeads,
      ai_build_distribution: aiBuildDistribution,
    };
  } catch (err) {
    console.error('Analytics report failed:', err.message);
    return null;
  }
}

module.exports = { getFunnelReport, recordEvent };
