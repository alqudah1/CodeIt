'use strict';

const pool = require('./db');

const tableReady = pool.dialect === 'postgres' ? Promise.resolve(true) : pool.query(`
  CREATE TABLE IF NOT EXISTS founding_family_leads (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    user_id INT NULL,
    source VARCHAR(24) NOT NULL DEFAULT 'pricing',
    consented_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_founding_family_email (email),
    INDEX idx_founding_family_joined (consented_at)
  ) ENGINE=InnoDB
`).then(() => true).catch((err) => {
  console.error('Founding family waitlist initialization failed:', err.message);
  return false;
});

async function saveFoundingFamilyLead({ email, source, userId = null }) {
  const normalizedUserId = Number.isInteger(Number(userId)) && Number(userId) > 0
    ? Number(userId)
    : null;

  try {
    if (!await tableReady) return false;
    await pool.query(
      `INSERT INTO founding_family_leads (email, user_id, source)
       VALUES (?, ?, ?)
       ON CONFLICT (email) DO UPDATE SET
         user_id = COALESCE(EXCLUDED.user_id, founding_family_leads.user_id),
         source = EXCLUDED.source,
         consented_at = CURRENT_TIMESTAMP`,
      [email, normalizedUserId, source]
    );
    return true;
  } catch (err) {
    console.error('Founding family waitlist write failed:', err.message);
    return false;
  }
}

async function isFoundingWaitlistReady() {
  return Boolean(await tableReady);
}

async function listFoundingFamilyLeads(days = 30) {
  const safeDays = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;
  try {
    if (!await tableReady) return [];
    const [rows] = await pool.query(
      `SELECT id, user_id, email, source, consented_at AS interested_at
       FROM founding_family_leads
       WHERE consented_at >= DATE_SUB(NOW(), INTERVAL ${safeDays} DAY)
       ORDER BY consented_at DESC
       LIMIT 100`
    );
    return rows;
  } catch (err) {
    console.error('Founding family waitlist read failed:', err.message);
    return [];
  }
}

module.exports = {
  isFoundingWaitlistReady,
  listFoundingFamilyLeads,
  saveFoundingFamilyLead,
};
