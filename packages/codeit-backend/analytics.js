'use strict';

const pool = require('./db');
const { normalizeEventName, normalizeMeta } = require('./analyticsEvents');

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

async function recordEvent(eventName, { userId = null, meta = null } = {}) {
  const normalizedEvent = normalizeEventName(eventName);
  if (!normalizedEvent) return false;

  const normalizedUserId = Number.isInteger(Number(userId)) && Number(userId) > 0
    ? Number(userId)
    : null;
  const normalizedMeta = normalizeMeta(normalizedEvent, meta);

  try {
    if (!await tableReady) return false;
    await pool.query(
      'INSERT INTO analytics_events (event_name, user_id, meta) VALUES (?, ?, ?)',
      [normalizedEvent, normalizedUserId, normalizedMeta]
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
    const [[events], [daily], [breakdown], [studentAgeRows], [foundingLeads]] = await Promise.all([
      pool.query(
        `SELECT event_name, COUNT(*) AS event_count, COUNT(DISTINCT user_id) AS unique_users
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
    ]);

    return {
      days,
      events,
      daily,
      breakdown,
      student_age_audit: studentAgeRows[0] || null,
      founding_leads: foundingLeads,
    };
  } catch (err) {
    console.error('Analytics report failed:', err.message);
    return null;
  }
}

module.exports = { getFunnelReport, recordEvent };
