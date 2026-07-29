'use strict';

const pool = require('./db');
const { normalizeEventName, normalizeMeta, normalizeJourneyId } = require('./analyticsEvents');
const { listFoundingFamilyLeads } = require('./foundingWaitlist');

const tableReady = pool.query(`
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

async function recordEvent(eventName, { userId = null, journeyId = null, meta = null } = {}) {
  const normalizedEvent = normalizeEventName(eventName);
  if (!normalizedEvent) return false;

  const normalizedUserId = Number.isInteger(Number(userId)) && Number(userId) > 0
    ? Number(userId)
    : null;
  const normalizedMeta = normalizeMeta(normalizedEvent, meta);
  const normalizedJourneyId = normalizeJourneyId(journeyId);

  try {
    if (!await tableReady) return false;
    await pool.query(
      'INSERT INTO analytics_events (event_name, user_id, journey_id, meta) VALUES (?, ?, ?, ?)',
      [normalizedEvent, normalizedUserId, normalizedJourneyId, normalizedMeta]
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
    const windowSql = `created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`;
    const [[events], [daily], [breakdown], [sourceFunnel], [studentAgeRows], [accountLeads], directLeads] = await Promise.all([
      pool.query(
        `SELECT event_name, COUNT(*) AS event_count, COUNT(DISTINCT user_id) AS unique_users,
                COUNT(DISTINCT journey_id) AS unique_journeys,
                SUM(journey_id IS NOT NULL) AS attributed_events
         FROM analytics_events WHERE ${windowSql}
         GROUP BY event_name`
      ),
      pool.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, event_name, COUNT(*) AS event_count
         FROM analytics_events WHERE ${windowSql}
         GROUP BY DATE(created_at), event_name
         ORDER BY DATE(created_at) ASC`
      ),
      pool.query(
        `SELECT event_name, meta, COUNT(*) AS event_count
         FROM analytics_events WHERE ${windowSql} AND meta IS NOT NULL
         GROUP BY event_name, meta
         ORDER BY event_name, event_count DESC`
      ),
      pool.query(
        `SELECT source,
                COUNT(*) AS visits,
                SUM(generated_count) AS generated_projects,
                SUM(signup_count) AS completed_signups,
                SUM(save_count) AS saved_projects,
                SUM(publish_count) AS published_projects,
                SUM(remix_count) AS remixed_projects
         FROM (
           SELECT journey_id,
                  MAX(CASE WHEN event_name = 'acquisition_visit' THEN meta END) AS source,
                  MAX(event_name = 'generation_complete') AS generated_count,
                  MAX(event_name = 'signup_complete') AS signup_count,
                  MAX(event_name = 'project_save') AS save_count,
                  MAX(event_name = 'project_publish') AS publish_count,
                  MAX(event_name = 'project_remix') AS remix_count
           FROM analytics_events
           WHERE ${windowSql} AND journey_id IS NOT NULL
           GROUP BY journey_id
         ) journeys
         WHERE source IS NOT NULL
         GROUP BY source
         ORDER BY visits DESC`
      ),
      pool.query(
        `SELECT
           COUNT(*) AS students,
           SUM(dob IS NULL) AS missing_dob,
           SUM(dob IS NOT NULL AND TIMESTAMPDIFF(YEAR, dob, CURDATE()) < 13) AS under_13,
           SUM(dob IS NOT NULL AND TIMESTAMPDIFF(YEAR, dob, CURDATE()) < 13
             AND parent_email IS NOT NULL AND parent_email <> '') AS under_13_with_parent_email,
           SUM(dob IS NOT NULL AND TIMESTAMPDIFF(YEAR, dob, CURDATE()) < 13
             AND (parent_email IS NULL OR parent_email = '')) AS under_13_without_parent_email,
           SUM(dob IS NOT NULL AND TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 13 AND 18) AS age_13_18,
           SUM(dob IS NOT NULL AND TIMESTAMPDIFF(YEAR, dob, CURDATE()) > 18) AS over_18
         FROM Users WHERE LOWER(role) = 'student'`
      ),
      pool.query(
        `SELECT u.user_id, u.name, u.email, MAX(a.created_at) AS interested_at
         FROM analytics_events a
         INNER JOIN Users u ON u.user_id = a.user_id
         WHERE a.event_name = 'pricing_interest'
           AND a.meta = 'founding-family'
           AND a.created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
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
    const foundingLeads = [...leadsByEmail.values()]
      .sort((a, b) => new Date(b.interested_at) - new Date(a.interested_at))
      .slice(0, 100);

    return {
      days,
      events,
      daily,
      breakdown,
      source_funnel: sourceFunnel,
      student_age_audit: studentAgeRows[0] || null,
      founding_leads: foundingLeads,
    };
  } catch (err) {
    console.error('Analytics report failed:', err.message);
    return null;
  }
}

module.exports = { getFunnelReport, recordEvent };
