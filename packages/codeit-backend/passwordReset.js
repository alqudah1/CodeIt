'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://codeitlearn.com').replace(/\/+$/, '');
const EMAIL_FROM = process.env.EMAIL_FROM || 'CodeIt <progress@codeitlearn.com>';
const RESET_TTL_MINUTES = 30;

const ready = (async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
      UNIQUE KEY uq_password_reset_token (token_hash),
      INDEX idx_password_reset_user_created (user_id, created_at),
      INDEX idx_password_reset_expiry (expires_at)
    )
  `);
})().catch((error) => {
  console.error('Password reset table init error:', error.message);
  throw error;
});

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPassword(value) {
  return typeof value === 'string' && value.length >= 10 && value.length <= 128;
}

async function sendResetEmail(email, name, token) {
  if (!process.env.RESEND_API_KEY) {
    console.error('Password reset email is not configured');
    return false;
  }

  const resetUrl = `${SITE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [email],
      subject: 'Reset your CodeIt password',
      text: `Use this secure link to choose a new CodeIt password. It expires in ${RESET_TTL_MINUTES} minutes: ${resetUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#3d302b">
          <div style="font-size:24px;font-weight:800;color:#f87824">CodeIt</div>
          <h1 style="font-size:24px">Choose a new password</h1>
          <p>Hello ${String(name || 'there').replace(/[<>&"']/g, '')},</p>
          <p>Use the button below to choose a new CodeIt password. This link expires in ${RESET_TTL_MINUTES} minutes and works only once.</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#f87824;color:white;text-decoration:none;font-weight:700">Reset my password</a></p>
          <p style="font-size:12px;color:#72594d">If you did not request this, you can ignore this email. Your password will not change.</p>
        </div>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('Password reset email failed:', response.status, detail.slice(0, 200));
    return false;
  }
  return true;
}

async function requestPasswordReset(rawEmail) {
  await ready;
  const email = normalizeEmail(rawEmail);
  if (!validEmail(email)) return;

  const [users] = await db.query(
    'SELECT user_id, name, username FROM Users WHERE LOWER(email) = ? LIMIT 1',
    [email]
  );
  if (!users.length) return;

  const user = users[0];
  const [recent] = await db.query(
    `SELECT id FROM password_reset_tokens
      WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
      LIMIT 1`,
    [user.user_id]
  );
  if (recent.length) return;

  const token = crypto.randomBytes(32).toString('hex');
  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [user.user_id, hashToken(token), RESET_TTL_MINUTES]
  );

  const sent = await sendResetEmail(email, user.name || user.username, token);
  if (!sent) {
    await db.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ?',
      [hashToken(token)]
    );
    throw new Error('Password reset email could not be sent');
  }
}

async function resetPassword(token, newPassword) {
  await ready;
  if (!token || !validPassword(newPassword)) {
    return { ok: false, reason: 'invalid_input' };
  }

  const tokenHash = hashToken(token);
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT id, user_id FROM password_reset_tokens
        WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
        LIMIT 1 FOR UPDATE`,
      [tokenHash]
    );
    if (!rows.length) {
      await connection.rollback();
      return { ok: false, reason: 'invalid_token' };
    }

    const reset = rows[0];
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await connection.query('UPDATE Users SET password = ? WHERE user_id = ?', [
      passwordHash,
      reset.user_id,
    ]);
    await connection.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [reset.user_id]
    );
    await connection.commit();
    return { ok: true };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  requestPasswordReset,
  resetPassword,
  validPassword,
};
