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
    const [[events], [daily], [breakdown]] = await Promise.all([
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
    ]);

    return { days, events, daily, breakdown };
  } catch (err) {
    console.error('Analytics report failed:', err.message);
    return null;
  }
}

module.exports = { getFunnelReport, recordEvent };
