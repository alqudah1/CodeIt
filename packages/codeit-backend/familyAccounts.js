'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { ready: progressReady } = require('./progressNotifications');
const { planForSubscription } = require('./entitlements');
const {
  FAMILY_NOTICE_VERSION,
  validManagedPassword,
  validateManagedChildInput,
} = require('./familyAccountUtils');

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://codeitlearn.com').replace(/\/+$/, '');
const DEFAULT_EMAIL_FROM = process.env.EMAIL_FROM || 'CodeIt <progress@codeitlearn.com>';
const configuredAddress = DEFAULT_EMAIL_FROM.match(/<([^>]+)>/)?.[1] || DEFAULT_EMAIL_FROM;
const EMAIL_FROM = `CodeIt Family <${configuredAddress}>`;

const ready = db.dialect === 'postgres' ? Promise.resolve(true) : (async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS adult_email_verifications (
      user_id INT NOT NULL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      verified_at TIMESTAMP NULL DEFAULT NULL,
      token_hash CHAR(64) DEFAULT NULL,
      expires_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_adult_verification_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
      INDEX idx_adult_verification_token (token_hash)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS parent_child_links (
      adult_user_id INT NOT NULL,
      child_user_id INT NOT NULL UNIQUE,
      relationship VARCHAR(20) NOT NULL,
      consent_version VARCHAR(30) NOT NULL,
      consented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      public_sharing_allowed TINYINT(1) NOT NULL DEFAULT 0,
      progress_emails_enabled TINYINT(1) NOT NULL DEFAULT 0,
      PRIMARY KEY (adult_user_id, child_user_id),
      CONSTRAINT fk_family_adult
        FOREIGN KEY (adult_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
      CONSTRAINT fk_family_child
        FOREIGN KEY (child_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
      INDEX idx_family_adult (adult_user_id)
    )
  `);
})().catch(error => {
  console.error('Family account tables init error:', error.message);
  throw error;
});

function hashToken(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function getAdult(userId) {
  const [rows] = await db.query(
    'SELECT user_id, name, email, role FROM Users WHERE user_id = ? LIMIT 1',
    [userId]
  );
  const adult = rows[0];
  if (!adult) throw Object.assign(new Error('Account not found.'), { statusCode: 404 });
  if (String(adult.role).toLowerCase() === 'student' || !adult.email) {
    throw Object.assign(new Error('Use a Parent / Educator account for family controls.'), { statusCode: 403 });
  }
  return adult;
}

async function getFamilyStatus(userId) {
  await ready;
  const adult = await getAdult(userId);
  const [verificationRows] = await db.query(
    `SELECT verified_at, email
       FROM adult_email_verifications
      WHERE user_id = ? AND email = ?`,
    [adult.user_id, String(adult.email).toLowerCase()]
  );
  const [children] = await db.query(
    `SELECT u.user_id AS id, u.username, u.dob, u.created_at,
            l.relationship, l.consented_at, l.public_sharing_allowed,
            l.progress_emails_enabled,
            COALESCE(s.total_xp, 0) AS total_xp,
            (SELECT COUNT(*) FROM Student_Lesson_Progress lp WHERE lp.user_id = u.user_id) AS lessons,
            (SELECT COUNT(*) FROM Student_Quiz_Attempt qa WHERE qa.student_id = u.user_id) AS quizzes,
            (SELECT COUNT(*) FROM Student_Puzzle_Progress pp WHERE pp.user_id = u.user_id) AS puzzles,
            (SELECT COUNT(*) FROM ai_projects p WHERE p.user_id = u.user_id) AS projects
       FROM parent_child_links l
       JOIN Users u ON u.user_id = l.child_user_id
       LEFT JOIN Students s ON s.user_id = u.user_id
      WHERE l.adult_user_id = ?
      ORDER BY l.consented_at DESC`,
    [adult.user_id]
  );
  return {
    adultEmail: adult.email,
    emailVerified: Boolean(verificationRows[0]?.verified_at),
    emailConfigured: Boolean(process.env.RESEND_API_KEY),
    noticeVersion: FAMILY_NOTICE_VERSION,
    children: children.map(child => ({
      id: child.id,
      username: child.username,
      dob: child.dob,
      relationship: child.relationship,
      consentedAt: child.consented_at,
      publicSharingAllowed: Boolean(child.public_sharing_allowed),
      progressEmailsEnabled: Boolean(child.progress_emails_enabled),
      totalXP: Number(child.total_xp || 0),
      lessons: Number(child.lessons || 0),
      quizzes: Number(child.quizzes || 0),
      puzzles: Number(child.puzzles || 0),
      projects: Number(child.projects || 0),
    })),
  };
}

async function sendVerificationEmail(adult, token) {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, status: 'not_configured' };
  }
  const verifyUrl = `${SITE_URL}/api/family/verify/${token}`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [adult.email],
      subject: 'Confirm your CodeIt family email',
      text: `Confirm this email before creating a private CodeIt profile for a learner ages 5–12: ${verifyUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#3d302b">
          <div style="font-size:24px;font-weight:800;color:#f87824">CodeIt</div>
          <h1 style="font-size:24px">Confirm your family email</h1>
          <p>Hello ${String(adult.name || 'there').replace(/[<>&"']/g, '')},</p>
          <p>Confirm that you control this adult account before creating a private CodeIt profile for a learner ages 5–12.</p>
          <p>The child profile uses a non-identifying username, birthday, password hash, learning progress, and private projects. Public publishing stays off for managed younger profiles.</p>
          <p><a href="${verifyUrl}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#f87824;color:white;text-decoration:none;font-weight:700">Confirm family email</a></p>
          <p style="font-size:12px;color:#72594d">This link expires in 48 hours. If you did not request it, ignore this email.</p>
          <p style="font-size:12px"><a href="${SITE_URL}/privacy">Read the CodeIt privacy notice</a></p>
        </div>`,
    }),
  });
  if (!response.ok) {
    throw Object.assign(new Error(`Email service returned ${response.status}.`), { statusCode: 502 });
  }
  return { sent: true, status: 'sent' };
}

async function requestAdultVerification(userId) {
  await ready;
  const adult = await getAdult(userId);
  const email = String(adult.email).trim().toLowerCase();
  const [existing] = await db.query(
    'SELECT verified_at, email FROM adult_email_verifications WHERE user_id = ?',
    [adult.user_id]
  );
  if (existing[0]?.verified_at && existing[0].email === email) {
    return { alreadyVerified: true, status: await getFamilyStatus(userId) };
  }

  const token = createToken();
  await db.query(
    `INSERT INTO adult_email_verifications
       (user_id, email, verified_at, token_hash, expires_at)
     VALUES (?, ?, NULL, ?, NOW() + INTERVAL '48 hours')
     ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, verified_at = NULL,
       token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at`,
    [adult.user_id, email, hashToken(token)]
  );
  const delivery = await sendVerificationEmail({ ...adult, email }, token);
  return { alreadyVerified: false, delivery, status: await getFamilyStatus(userId) };
}

async function verifyAdultEmail(rawToken) {
  await ready;
  const [result] = await db.query(
    `UPDATE adult_email_verifications
        SET verified_at = NOW(), token_hash = NULL, expires_at = NULL
      WHERE token_hash = ? AND expires_at > NOW()`,
    [hashToken(rawToken)]
  );
  return result.affectedRows > 0;
}

/**
 * How many managed learners this adult already has.
 *
 * Number() around the value on purpose. Postgres returns COUNT(*) as a STRING
 * through node-postgres, so a bare `rows[0].child_count >= 4` compares a string
 * with a number, and the obvious version of this guard enforces nothing in
 * production while passing on a MySQL dev box.
 */
async function countManagedChildren(adultUserId) {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS child_count FROM parent_child_links WHERE adult_user_id = ?',
    [adultUserId]
  );
  const row = rows[0] || {};
  const raw = row.child_count ?? row.count ?? row['COUNT(*)'] ?? 0;
  const count = Number(raw);
  return Number.isFinite(count) ? count : 0;
}

/**
 * The plan this adult is on, or null when billing cannot be read. Null means
 * "do not enforce".
 */
async function currentPlan(adultUserId) {
  try {
    const billingStore = require('./billingStore');
    const subscription = await billingStore.getSubscriptionByUserId(adultUserId);
    return planForSubscription(subscription);
  } catch (error) {
    console.error('Child-profile allowance check skipped:', error.message);
    return null;
  }
}

async function createManagedChild(adultUserId, input) {
  await ready;
  await progressReady;
  const parsed = validateManagedChildInput(input);
  if (!parsed.ok) throw Object.assign(new Error(parsed.error), { statusCode: 400, field: parsed.field });
  const adult = await getAdult(adultUserId);
  const email = String(adult.email).trim().toLowerCase();
  const [verification] = await db.query(
    `SELECT verified_at FROM adult_email_verifications
      WHERE user_id = ? AND email = ? AND verified_at IS NOT NULL`,
    [adult.user_id, email]
  );
  if (!verification.length) {
    throw Object.assign(new Error('Confirm the adult account email first.'), { statusCode: 403 });
  }

  // ── How many learners this account may hold ──────────────────────────────
  //
  // PLANS carries maxChildProfiles and nothing had ever read it. A free account
  // could add learner profiles without end, which is the paid plan's headline
  // feature given away, and a family could cross a line the pricing page draws
  // without ever being told there was one.
  //
  // Two things this deliberately does NOT do: it does not remove or lock any
  // profile that already exists, and it does not fail closed when billing is
  // unreadable. A family already over the number keeps every child they have
  // and simply cannot add another. Standing between a parent and their own
  // children because Stripe is slow would be the worse mistake.
  const plan = await currentPlan(adultUserId);
  const existing = await countManagedChildren(adultUserId);
  if (plan && existing >= plan.maxChildProfiles) {
    throw Object.assign(
      new Error(
        plan.maxChildProfiles === 1
          ? 'This account holds one learner profile. CodeIt Plus holds up to four.'
          : `This plan holds up to ${plan.maxChildProfiles} learner profiles.`
      ),
      { statusCode: 403, code: 'CHILD_LIMIT_REACHED' }
    );
  }


  const data = parsed.value;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [duplicates] = await connection.query(
      'SELECT user_id FROM Users WHERE username = ? LIMIT 1',
      [data.username]
    );
    if (duplicates.length) {
      await connection.rollback();
      throw Object.assign(new Error('That username is already taken.'), { statusCode: 400, field: 'username' });
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    const [created] = await connection.query(
      `INSERT INTO Users (username, name, password, role, dob, parent_email)
       VALUES (?, ?, ?, 'Student', ?, ?)`,
      [data.username, data.username, passwordHash, data.dob, email]
    );
    await connection.query(
      'INSERT INTO Students (user_id, level_id, total_xp, weekly_xp) VALUES (?, 1, 0, 0)',
      [created.insertId]
    );
    await connection.query(
      `INSERT INTO parent_child_links
         (adult_user_id, child_user_id, relationship, consent_version,
          public_sharing_allowed, progress_emails_enabled)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [adult.user_id, created.insertId, data.relationship, data.noticeVersion, data.progressEmails ? 1 : 0]
    );
    if (data.progressEmails) {
      await connection.query(
        `INSERT INTO parent_notification_preferences (
           user_id, parent_email, verified_at, verification_token_hash,
           verification_expires_at, unsubscribe_token_hash, notify_lessons,
           notify_exercises, notify_projects, notify_publishing, enabled
         ) VALUES (?, ?, NOW(), NULL, NULL, ?, 1, 1, 1, 0, 1)
         ON CONFLICT (user_id) DO UPDATE SET parent_email = EXCLUDED.parent_email,
           verified_at = NOW(), verification_token_hash = NULL,
           verification_expires_at = NULL, unsubscribe_token_hash = EXCLUDED.unsubscribe_token_hash,
           notify_lessons = 1, notify_exercises = 1, notify_projects = 1,
           notify_publishing = 0, enabled = 1`,
        [created.insertId, email, hashToken(createToken())]
      );
    }
    await connection.commit();
    return { id: created.insertId, username: data.username, dob: data.dob, relationship: data.relationship };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function setManagedProgressEmails(adultUserId, childUserId, enabled) {
  await ready;
  await progressReady;
  const adult = await getAdult(adultUserId);
  const email = String(adult.email).trim().toLowerCase();
  const [verification] = await db.query(
    `SELECT verified_at FROM adult_email_verifications
      WHERE user_id = ? AND email = ? AND verified_at IS NOT NULL`,
    [adult.user_id, email]
  );
  if (!verification.length) {
    throw Object.assign(new Error('Confirm the adult account email first.'), { statusCode: 403 });
  }
  const [links] = await db.query(
    'SELECT child_user_id FROM parent_child_links WHERE adult_user_id = ? AND child_user_id = ? LIMIT 1',
    [adultUserId, childUserId]
  );
  if (!links.length) {
    throw Object.assign(new Error('Managed profile not found.'), { statusCode: 404 });
  }
  await db.query(
    'UPDATE parent_child_links SET progress_emails_enabled = ? WHERE adult_user_id = ? AND child_user_id = ?',
    [enabled ? 1 : 0, adultUserId, childUserId]
  );
  if (enabled) {
    await db.query(
      `INSERT INTO parent_notification_preferences (
         user_id, parent_email, verified_at, verification_token_hash,
         verification_expires_at, unsubscribe_token_hash, notify_lessons,
         notify_exercises, notify_projects, notify_publishing, enabled
       ) VALUES (?, ?, NOW(), NULL, NULL, ?, 1, 1, 1, 0, 1)
       ON CONFLICT (user_id) DO UPDATE SET parent_email = EXCLUDED.parent_email,
         verified_at = NOW(), verification_token_hash = NULL,
         verification_expires_at = NULL, unsubscribe_token_hash = EXCLUDED.unsubscribe_token_hash,
         notify_lessons = 1, notify_exercises = 1, notify_projects = 1,
         notify_publishing = 0, enabled = 1`,
      [childUserId, email, hashToken(createToken())]
    );
  } else {
    await db.query(
      'UPDATE parent_notification_preferences SET enabled = 0 WHERE user_id = ?',
      [childUserId]
    );
  }
  return true;
}

async function deleteManagedChild(adultUserId, childUserId) {
  await ready;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [links] = await connection.query(
      'SELECT child_user_id FROM parent_child_links WHERE adult_user_id = ? AND child_user_id = ? FOR UPDATE',
      [adultUserId, childUserId]
    );
    if (!links.length) {
      await connection.rollback();
      throw Object.assign(new Error('Managed profile not found.'), { statusCode: 404 });
    }
    await connection.query('DELETE FROM Student_Lesson_Progress WHERE user_id = ?', [childUserId]);
    await connection.query('DELETE FROM Student_Puzzle_Progress WHERE user_id = ?', [childUserId]);
    await connection.query('DELETE FROM Student_Quiz_Attempt WHERE student_id = ?', [childUserId]);
    await connection.query('DELETE FROM rewards WHERE student_id = ?', [childUserId]);
    await connection.query('DELETE FROM ai_project_likes WHERE user_id = ?', [childUserId]);
    await connection.query('DELETE FROM analytics_events WHERE user_id = ?', [childUserId]);
    await connection.query('DELETE FROM founding_family_leads WHERE user_id = ?', [childUserId]);
    await connection.query('DELETE FROM Users WHERE user_id = ?', [childUserId]);
    await connection.commit();
    return true;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function resetManagedChildPassword(adultUserId, childUserId, password) {
  await ready;
  if (!validManagedPassword(password)) {
    throw Object.assign(new Error('Use at least 10 characters.'), { statusCode: 400 });
  }
  const [links] = await db.query(
    'SELECT child_user_id FROM parent_child_links WHERE adult_user_id = ? AND child_user_id = ? LIMIT 1',
    [adultUserId, childUserId]
  );
  if (!links.length) {
    throw Object.assign(new Error('Managed profile not found.'), { statusCode: 404 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await db.query('UPDATE Users SET password = ? WHERE user_id = ?', [passwordHash, childUserId]);
  return true;
}

/**
 * The evidence a parent is actually paying for.
 *
 * getFamilyStatus counts things — 4 projects, 12 lessons — and counts are
 * what every learning product shows because counts are cheap. What a parent
 * wants to know is the question GOAL.md wrote down: "the computer made it,
 * so what did my child actually do?" The honest answer lives in the child's
 * own files, and the studio already knows how to read it (codeConcepts.js
 * finds every concept with the line number and the child's own line).
 *
 * This hands the parent's browser the raw material for that answer: the
 * child's newest projects and finished lessons — nothing invented, nothing
 * summarised server-side. The frontend runs the same concept reader the
 * child's own code tab uses, so parent and child are shown the same truth.
 *
 * Permission is the parent-child link and nothing else. A signed-in stranger
 * with a child's id gets a 404 that does not confirm the child exists.
 */
async function getChildEvidence(adultUserId, childUserId) {
  await ready;
  const [links] = await db.query(
    'SELECT child_user_id FROM parent_child_links WHERE adult_user_id = ? AND child_user_id = ?',
    [adultUserId, childUserId]
  );
  if (!links.length) {
    const missing = new Error('No such learner in this family.');
    missing.statusCode = 404;
    throw missing;
  }

  const [projects] = await db.query(
    `SELECT id, title, prompt, project_type, generated_code, created_at, updated_at
       FROM ai_projects
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 3`,
    [childUserId]
  );
  const [lessons] = await db.query(
    `SELECT lp.lesson_id, l.title
       FROM Student_Lesson_Progress lp
       JOIN lessons l ON l.id = lp.lesson_id
      WHERE lp.user_id = ?
      ORDER BY lp.lesson_id`,
    [childUserId]
  );

  // What this child has EXPLAINED, not just built. This is the half of the
  // evidence no competitor has, and until these rows existed it lived in one
  // browser's localStorage where no parent's phone could see it.
  const [understood] = await db.query(
    `SELECT project_key, project_title, skills, created_at, updated_at
       FROM understanding_records
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 60`,
    [childUserId]
  );

  return {
    projects: projects.map(project => ({
      id: project.id,
      title: project.title,
      prompt: project.prompt,
      projectType: project.project_type,
      code: project.generated_code,
      updatedAt: project.updated_at,
    })),
    lessonsDone: lessons.map(lesson => ({ id: lesson.lesson_id, title: lesson.title })),
    understood: understood.map(row => {
      let skills = [];
      if (Array.isArray(row.skills)) skills = row.skills;
      else { try { skills = JSON.parse(row.skills) || []; } catch { skills = []; } }
      return {
        projectTitle: row.project_title,
        skills,
        at: row.updated_at || row.created_at,
      };
    }),
  };
}

module.exports = {
  getChildEvidence,
  countManagedChildren,
  createManagedChild,
  deleteManagedChild,
  getFamilyStatus,
  ready,
  requestAdultVerification,
  resetManagedChildPassword,
  setManagedProgressEmails,
  verifyAdultEmail,
};
