'use strict';

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('./db');
const { escapeHtml, isValidEmail, normalizeEmail } = require('./progressNotificationUtils');
const { EVENT_LABELS, milestoneEmail } = require('./progressEmail');

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://codeitlearn.com').replace(/\/+$/, '');
const EMAIL_FROM = process.env.EMAIL_FROM || 'CodeIt <progress@codeitlearn.com>';

const EVENT_PREFERENCE_COLUMNS = Object.freeze({
  lesson_completed: 'notify_lessons',
  exercise_completed: 'notify_exercises',
  puzzle_completed: 'notify_exercises',
  quiz_completed: 'notify_exercises',
  project_created: 'notify_projects',
  project_published: 'notify_publishing',
});

let transporter;

const ready = process.env.SKIP_PROGRESS_DB_INIT === 'true' || pool.dialect === 'postgres'
  ? Promise.resolve(true)
  : (async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parent_notification_preferences (
      user_id INT NOT NULL PRIMARY KEY,
      parent_email VARCHAR(255) NOT NULL,
      verified_at TIMESTAMP NULL DEFAULT NULL,
      verification_token_hash CHAR(64) DEFAULT NULL,
      verification_expires_at DATETIME DEFAULT NULL,
      unsubscribe_token_hash CHAR(64) NOT NULL,
      notify_lessons TINYINT(1) NOT NULL DEFAULT 1,
      notify_exercises TINYINT(1) NOT NULL DEFAULT 1,
      notify_projects TINYINT(1) NOT NULL DEFAULT 1,
      notify_publishing TINYINT(1) NOT NULL DEFAULT 1,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_parent_notifications_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
      INDEX idx_parent_notification_email (parent_email),
      INDEX idx_parent_verification_token (verification_token_hash),
      INDEX idx_parent_unsubscribe_token (unsubscribe_token_hash)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_milestones (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      event_type VARCHAR(40) NOT NULL,
      event_key VARCHAR(160) NOT NULL,
      title VARCHAR(255) NOT NULL,
      detail VARCHAR(500) DEFAULT NULL,
      target_url VARCHAR(500) DEFAULT NULL,
      occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_student_milestone_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
      UNIQUE KEY uq_student_milestone (user_id, event_type, event_key),
      INDEX idx_student_milestone_recent (user_id, occurred_at)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parent_notification_deliveries (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      milestone_id BIGINT NOT NULL,
      parent_email VARCHAR(255) NOT NULL,
      status VARCHAR(30) NOT NULL,
      provider_message_id VARCHAR(255) DEFAULT NULL,
      error_code VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sent_at TIMESTAMP NULL DEFAULT NULL,
      CONSTRAINT fk_parent_delivery_milestone
        FOREIGN KEY (milestone_id) REFERENCES student_milestones(id) ON DELETE CASCADE,
      UNIQUE KEY uq_parent_delivery_milestone (milestone_id)
    )
  `);
})().catch((error) => {
  console.error('Progress notification tables init error:', error.message);
  throw error;
});

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function mailTransport() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  return transporter;
}

async function sendMail(message) {
  const transport = mailTransport();
  try {
    if (transport) {
      const result = await transport.sendMail({ from: EMAIL_FROM, ...message });
      return { sent: true, status: 'sent', messageId: result.messageId || null };
    }

    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: Array.isArray(message.to) ? message.to : [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
      });
      if (!response.ok) {
        throw Object.assign(new Error(`Resend returned ${response.status}`), {
          code: `RESEND_${response.status}`,
        });
      }
      const result = await response.json();
      return { sent: true, status: 'sent', messageId: result.id || null };
    }

    return { sent: false, status: 'not_configured' };
  } catch (error) {
    console.error('Parent progress email failed:', error.code || error.message);
    return { sent: false, status: 'failed', errorCode: String(error.code || 'SEND_FAILED').slice(0, 100) };
  }
}

async function getStudent(userId) {
  const [rows] = await pool.query(
    'SELECT user_id, name, username, role, parent_email FROM Users WHERE user_id = ?',
    [userId]
  );
  return rows[0] || null;
}

async function getSettings(userId) {
  await ready;
  const [rows] = await pool.query(
    `SELECT u.parent_email,
            p.verified_at, p.notify_lessons, p.notify_exercises,
            p.notify_projects, p.notify_publishing, p.enabled
       FROM Users u
       LEFT JOIN parent_notification_preferences p ON p.user_id = u.user_id
      WHERE u.user_id = ?`,
    [userId]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    parentEmail: row.parent_email || '',
    verified: Boolean(row.verified_at),
    enabled: row.enabled === null ? true : Boolean(row.enabled),
    notifyLessons: row.notify_lessons === null ? true : Boolean(row.notify_lessons),
    notifyExercises: row.notify_exercises === null ? true : Boolean(row.notify_exercises),
    notifyProjects: row.notify_projects === null ? true : Boolean(row.notify_projects),
    notifyPublishing: row.notify_publishing === null ? true : Boolean(row.notify_publishing),
    emailConfigured: Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY),
  };
}

async function sendVerification(userId, parentEmail, studentName, verificationToken) {
  const verifyUrl = `${SITE_URL}/api/progress-notifications/verify/${verificationToken}`;
  const safeName = escapeHtml(studentName || 'your learner');
  return sendMail({
    to: parentEmail,
    subject: `Confirm progress updates for ${studentName || 'your learner'}`,
    text: `Confirm that you want CodeIt progress updates for ${studentName || 'your learner'}: ${verifyUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#3d302b">
        <div style="font-size:24px;font-weight:800;color:#f87824">CodeIt</div>
        <h1 style="font-size:24px">Stay connected to ${safeName}'s learning</h1>
        <p>You were added as the parent or guardian contact for a CodeIt student account.</p>
        <p>Confirm below to receive updates when ${safeName} completes lessons and exercises, creates projects, or publishes a website.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#f87824;color:white;text-decoration:none;font-weight:700">Confirm progress emails</a></p>
        <p style="font-size:12px;color:#72594d">If you did not expect this message, you can ignore it. No progress emails will be sent until you confirm.</p>
      </div>`,
  });
}

async function updateSettings(userId, input) {
  await ready;
  const student = await getStudent(userId);
  if (!student) throw Object.assign(new Error('Account not found'), { statusCode: 404 });
  if (String(student.role).toLowerCase() !== 'student') {
    throw Object.assign(new Error('Progress emails are configured from a student account'), { statusCode: 403 });
  }

  const email = normalizeEmail(input.parentEmail);
  if (!isValidEmail(email)) {
    throw Object.assign(new Error('Enter a valid parent or guardian email'), { statusCode: 400 });
  }

  const current = await getSettings(userId);
  const emailChanged = email !== normalizeEmail(current?.parentEmail);
  const verificationToken = emailChanged || !current?.verified ? createToken() : null;
  const unsubscribeToken = createToken();

  await pool.query('UPDATE Users SET parent_email = ? WHERE user_id = ?', [email, userId]);
  await pool.query(
    `INSERT INTO parent_notification_preferences (
       user_id, parent_email, verified_at, verification_token_hash,
       verification_expires_at, unsubscribe_token_hash, notify_lessons,
       notify_exercises, notify_projects, notify_publishing, enabled
     ) VALUES (?, ?, NULL, ?, NOW() + INTERVAL '48 hours', ?, ?, ?, ?, ?, 1)
     ON CONFLICT (user_id) DO UPDATE SET
       parent_email = EXCLUDED.parent_email,
       verified_at = CASE WHEN EXCLUDED.verification_token_hash IS NULL
         THEN parent_notification_preferences.verified_at ELSE NULL END,
       verification_token_hash = COALESCE(EXCLUDED.verification_token_hash, parent_notification_preferences.verification_token_hash),
       verification_expires_at = COALESCE(EXCLUDED.verification_expires_at, parent_notification_preferences.verification_expires_at),
       unsubscribe_token_hash = EXCLUDED.unsubscribe_token_hash,
       notify_lessons = EXCLUDED.notify_lessons,
       notify_exercises = EXCLUDED.notify_exercises,
       notify_projects = EXCLUDED.notify_projects,
       notify_publishing = EXCLUDED.notify_publishing,
       enabled = 1`,
    [
      userId,
      email,
      verificationToken ? hashToken(verificationToken) : null,
      hashToken(unsubscribeToken),
      input.notifyLessons === false ? 0 : 1,
      input.notifyExercises === false ? 0 : 1,
      input.notifyProjects === false ? 0 : 1,
      input.notifyPublishing === false ? 0 : 1,
    ]
  );

  let verificationDelivery = null;
  if (verificationToken) {
    verificationDelivery = await sendVerification(
      userId,
      email,
      student.name || student.username,
      verificationToken
    );
  }
  return { settings: await getSettings(userId), verificationDelivery };
}

async function resendVerification(userId) {
  const settings = await getSettings(userId);
  if (!settings?.parentEmail) {
    throw Object.assign(new Error('Add a parent or guardian email first'), { statusCode: 400 });
  }
  if (settings.verified) return { settings, alreadyVerified: true };
  return updateSettings(userId, settings);
}

async function verifyParent(rawToken) {
  await ready;
  const tokenHash = hashToken(String(rawToken || ''));
  const [result] = await pool.query(
    `UPDATE parent_notification_preferences
        SET verified_at = NOW(), verification_token_hash = NULL,
            verification_expires_at = NULL, enabled = 1
      WHERE verification_token_hash = ?
        AND verification_expires_at > NOW()`,
    [tokenHash]
  );
  return result.affectedRows > 0;
}

async function unsubscribeParent(rawToken) {
  await ready;
  const [result] = await pool.query(
    'UPDATE parent_notification_preferences SET enabled = 0 WHERE unsubscribe_token_hash = ?',
    [hashToken(String(rawToken || ''))]
  );
  return result.affectedRows > 0;
}

async function recordMilestoneAndNotify({ userId, eventType, eventKey, title, detail = null, targetUrl = null }) {
  await ready;
  if (!EVENT_PREFERENCE_COLUMNS[eventType]) throw new Error(`Unsupported milestone type: ${eventType}`);
  const [result] = await pool.query(
    `INSERT INTO student_milestones
       (user_id, event_type, event_key, title, detail, target_url)
     VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (user_id, event_type, event_key) DO NOTHING`,
    [
      userId,
      eventType,
      String(eventKey).slice(0, 160),
      String(title).slice(0, 255),
      detail ? String(detail).slice(0, 500) : null,
      targetUrl ? String(targetUrl).slice(0, 500) : null,
    ]
  );
  if (result.affectedRows === 0) return { recorded: false, reason: 'duplicate' };

  const [rows] = await pool.query(
    `SELECT u.name, u.username, p.parent_email, p.unsubscribe_token_hash,
            p.verified_at, p.enabled, p.${EVENT_PREFERENCE_COLUMNS[eventType]} AS event_enabled
       FROM Users u
       LEFT JOIN parent_notification_preferences p ON p.user_id = u.user_id
      WHERE u.user_id = ?`,
    [userId]
  );
  const recipient = rows[0];
  if (!recipient?.parent_email || !recipient.verified_at || !recipient.enabled || !recipient.event_enabled) {
    return { recorded: true, notified: false, reason: 'not_enabled_or_verified' };
  }

  const unsubscribeToken = createToken();
  await pool.query(
    'UPDATE parent_notification_preferences SET unsubscribe_token_hash = ? WHERE user_id = ?',
    [hashToken(unsubscribeToken), userId]
  );
  const delivery = await sendMail({
    to: recipient.parent_email,
    ...milestoneEmail({
      studentName: recipient.name || recipient.username || 'Your learner',
      eventType,
      title,
      detail,
      targetUrl,
      unsubscribeToken,
    }),
  });
  await pool.query(
    `INSERT INTO parent_notification_deliveries
       (milestone_id, parent_email, status, provider_message_id, error_code, sent_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (milestone_id) DO UPDATE SET status = EXCLUDED.status,
       provider_message_id = EXCLUDED.provider_message_id,
       error_code = EXCLUDED.error_code, sent_at = EXCLUDED.sent_at`,
    [
      result.insertId,
      recipient.parent_email,
      delivery.status,
      delivery.messageId || null,
      delivery.errorCode || null,
      delivery.sent ? new Date() : null,
    ]
  );
  return { recorded: true, notified: delivery.sent, deliveryStatus: delivery.status };
}

async function getProgressSummary(userId) {
  await ready;
  const [counts] = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE event_type = 'lesson_completed') AS lessons,
       COUNT(*) FILTER (WHERE event_type IN ('exercise_completed','puzzle_completed','quiz_completed')) AS exercises,
       COUNT(*) FILTER (WHERE event_type = 'project_created') AS projects,
       COUNT(*) FILTER (WHERE event_type = 'project_published') AS published
     FROM student_milestones WHERE user_id = ?`,
    [userId]
  );
  const [recent] = await pool.query(
    `SELECT event_type AS eventType, title, detail, target_url AS targetUrl,
            occurred_at AS occurredAt
       FROM student_milestones
      WHERE user_id = ? ORDER BY occurred_at DESC LIMIT 8`,
    [userId]
  );
  return {
    counts: {
      lessons: Number(counts[0]?.lessons || 0),
      exercises: Number(counts[0]?.exercises || 0),
      projects: Number(counts[0]?.projects || 0),
      published: Number(counts[0]?.published || 0),
    },
    recent,
  };
}

module.exports = {
  EVENT_LABELS,
  escapeHtml,
  getProgressSummary,
  getSettings,
  isValidEmail,
  normalizeEmail,
  ready,
  recordMilestoneAndNotify,
  resendVerification,
  unsubscribeParent,
  updateSettings,
  verifyParent,
};
