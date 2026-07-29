'use strict';

const pool = require('./db');
const { ACTIVE_USER_DEFINITION, normalizeUserId } = require('./userActivityDefinitions');

const ready = process.env.NODE_ENV === 'test' ? Promise.resolve(true) : pool.query(`
  CREATE TABLE IF NOT EXISTS user_activity_daily (
    user_id INT NOT NULL,
    activity_date DATE NOT NULL,
    first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    login_count INT UNSIGNED NOT NULL DEFAULT 0,
    visit_count INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, activity_date),
    INDEX idx_user_activity_date (activity_date)
  ) ENGINE=InnoDB
`).then(() => true).catch((error) => {
  console.error('User activity table initialization failed:', error.message);
  return false;
});

async function recordUserActivity(value, kind = 'visit') {
  const userId = normalizeUserId(value);
  if (!userId || !['visit', 'login'].includes(kind)) return false;

  try {
    if (!await ready) return false;
    const isLogin = kind === 'login' ? 1 : 0;
    const isVisit = kind === 'visit' ? 1 : 0;
    await pool.query(`
      INSERT INTO user_activity_daily
        (user_id, activity_date, login_count, visit_count)
      VALUES (?, CURRENT_DATE(), ?, ?)
      ON DUPLICATE KEY UPDATE
        last_seen_at = CURRENT_TIMESTAMP,
        login_count = login_count + VALUES(login_count),
        visit_count = visit_count + VALUES(visit_count)
    `, [userId, isLogin, isVisit]);
    return true;
  } catch (error) {
    console.error('User activity write failed:', error.message);
    return false;
  }
}

async function getActivitySummary() {
  if (!await ready) return null;

  const [[totals], [history]] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(DISTINCT CASE
          WHEN activity_date = CURRENT_DATE()
            AND COALESCE(u.is_admin, 0) = 0 AND LOWER(COALESCE(u.role, '')) <> 'admin'
          THEN a.user_id END
        ) AS daily_active_users,
        COUNT(DISTINCT CASE
          WHEN activity_date >= CURRENT_DATE() - INTERVAL 6 DAY
            AND COALESCE(u.is_admin, 0) = 0 AND LOWER(COALESCE(u.role, '')) <> 'admin'
          THEN a.user_id END
        ) AS weekly_active_users,
        COUNT(DISTINCT CASE
          WHEN activity_date >= CURRENT_DATE() - INTERVAL 29 DAY
            AND COALESCE(u.is_admin, 0) = 0 AND LOWER(COALESCE(u.role, '')) <> 'admin'
          THEN a.user_id END
        ) AS monthly_active_users,
        COALESCE(SUM(CASE
          WHEN activity_date = CURRENT_DATE()
            AND COALESCE(u.is_admin, 0) = 0 AND LOWER(COALESCE(u.role, '')) <> 'admin'
          THEN login_count ELSE 0 END
        ), 0) AS logins_today,
        COALESCE(SUM(CASE
          WHEN activity_date >= CURRENT_DATE() - INTERVAL 29 DAY
            AND COALESCE(u.is_admin, 0) = 0 AND LOWER(COALESCE(u.role, '')) <> 'admin'
          THEN login_count ELSE 0 END
        ), 0) AS logins_30_days,
        MIN(activity_date) AS tracking_started_at,
        MAX(last_seen_at) AS latest_activity_at
      FROM user_activity_daily a
      INNER JOIN Users u ON u.user_id = a.user_id
    `),
    pool.query(`
      SELECT
        DATE_FORMAT(activity_date, '%Y-%m-%d') AS day,
        COUNT(DISTINCT a.user_id) AS active_users,
        SUM(a.login_count) AS logins
      FROM user_activity_daily a
      INNER JOIN Users u ON u.user_id = a.user_id
      WHERE activity_date >= CURRENT_DATE() - INTERVAL 29 DAY
        AND COALESCE(u.is_admin, 0) = 0
        AND LOWER(COALESCE(u.role, '')) <> 'admin'
      GROUP BY activity_date
      ORDER BY activity_date ASC
    `),
  ]);

  return {
    ...totals,
    history,
    definition: ACTIVE_USER_DEFINITION,
    measurement_note: 'Tracking begins with this release; historical accounts are not backfilled as active users.',
  };
}

module.exports = {
  ACTIVE_USER_DEFINITION,
  ready,
  normalizeUserId,
  recordUserActivity,
  getActivitySummary,
};
