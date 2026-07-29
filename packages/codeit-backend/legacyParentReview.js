'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { JWT_SECRET } = require('./config');
const { ageOnDate } = require('./studentAge');
const { FAMILY_NOTICE_VERSION } = require('./familyAccountUtils');
const { ready: familyReady } = require('./familyAccounts');
const { maskEmail, validEmail, validLegacyConsent } = require('./legacyParentReviewUtils');

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://codeitlearn.com').replace(/\/+$/, '');
const DEFAULT_EMAIL_FROM = process.env.EMAIL_FROM || 'CodeIt <progress@codeitlearn.com>';
const configuredAddress = DEFAULT_EMAIL_FROM.match(/<([^>]+)>/)?.[1] || DEFAULT_EMAIL_FROM;
const EMAIL_FROM = `CodeIt Family <${configuredAddress}>`;
const REVIEW_SECRET = `${JWT_SECRET}:legacy-parent-review`;
const REVIEW_WINDOW_DAYS = 14;

const ready = (async () => {
  await familyReady;
  await db.query(`
    CREATE TABLE IF NOT EXISTS legacy_parent_reviews (
      child_user_id INT NOT NULL PRIMARY KEY,
      parent_email VARCHAR(255) NOT NULL,
      token_hash CHAR(64) DEFAULT NULL,
      expires_at DATETIME DEFAULT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      claimed_at TIMESTAMP NULL DEFAULT NULL,
      adult_user_id INT DEFAULT NULL,
      CONSTRAINT fk_legacy_review_child
        FOREIGN KEY (child_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
      CONSTRAINT fk_legacy_review_adult
        FOREIGN KEY (adult_user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
      INDEX idx_legacy_review_token (token_hash),
      INDEX idx_legacy_review_status (status)
    )
  `);
  const [privacyUpdate] = await db.query(`
    UPDATE ai_projects p
    JOIN Users child ON child.user_id = p.user_id
    LEFT JOIN parent_child_links family ON family.child_user_id = child.user_id
    LEFT JOIN Users adult ON adult.user_id = family.adult_user_id
    LEFT JOIN adult_email_verifications verification
      ON verification.user_id = adult.user_id
     AND verification.email = LOWER(adult.email)
     AND verification.verified_at IS NOT NULL
       SET p.is_public = 0
     WHERE LOWER(child.role) = 'student'
       AND child.dob IS NOT NULL
       AND TIMESTAMPDIFF(YEAR, child.dob, CURRENT_DATE()) < 13
       AND verification.user_id IS NULL
       AND p.is_public = 1
  `);
  if (privacyUpdate.affectedRows > 0) {
    console.log(`Made ${privacyUpdate.affectedRows} unverified under-13 project(s) private.`);
  }
  await deleteExpiredPendingReviews();
})().catch(error => {
  console.error('Legacy parent review table init error:', error.message);
  throw error;
});

function hashToken(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

async function deleteExpiredPendingReviews() {
  await db.query(
    `DELETE FROM legacy_parent_reviews
      WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at <= NOW()`
  );
}

async function childAccessStatus(userId, dob, role) {
  const age = dob ? ageOnDate(new Date(dob).toISOString().slice(0, 10)) : null;
  const under13 = String(role || '').toLowerCase() === 'student'
    && age !== null
    && age < 13;
  if (!under13) {
    return { under13: false, managedProfile: false, requiresParentReview: false };
  }

  await ready;
  const [[link]] = await db.query(
    `SELECT l.adult_user_id, v.verified_at
       FROM parent_child_links l
       JOIN Users a ON a.user_id = l.adult_user_id
       LEFT JOIN adult_email_verifications v
         ON v.user_id = a.user_id AND v.email = LOWER(a.email)
      WHERE l.child_user_id = ?
      LIMIT 1`,
    [userId]
  );

  const parentVerified = Boolean(link?.adult_user_id && link?.verified_at);
  return {
    under13: true,
    managedProfile: parentVerified,
    requiresParentReview: !parentVerified,
  };
}

function createReviewSession(userId) {
  return jwt.sign(
    { review_user_id: Number(userId), purpose: 'legacy_parent_review' },
    REVIEW_SECRET,
    { expiresIn: '30m' }
  );
}

function verifyReviewSession(token) {
  const payload = jwt.verify(token, REVIEW_SECRET);
  if (payload.purpose !== 'legacy_parent_review' || !Number.isInteger(Number(payload.review_user_id))) {
    throw new Error('Invalid review session.');
  }
  return Number(payload.review_user_id);
}

async function getReviewChild(rawReviewToken) {
  const childUserId = verifyReviewSession(rawReviewToken);
  const [[child]] = await db.query(
    'SELECT user_id, username, name, dob, role, parent_email FROM Users WHERE user_id = ? LIMIT 1',
    [childUserId]
  );
  if (!child) throw Object.assign(new Error('Learner account not found.'), { statusCode: 404 });
  const access = await childAccessStatus(child.user_id, child.dob, child.role);
  if (!access.under13) {
    throw Object.assign(new Error('This account does not need parent review.'), { statusCode: 400 });
  }
  if (!access.requiresParentReview) {
    throw Object.assign(new Error('This learner is already connected to a verified parent account.'), { statusCode: 409 });
  }
  return child;
}

async function sendReviewEmail(child, parentEmail, claimToken) {
  if (!process.env.RESEND_API_KEY) return { sent: false, status: 'not_configured' };
  const claimUrl = `${SITE_URL}/parent-review?claim=${encodeURIComponent(claimToken)}`;
  const privacyUrl = `${SITE_URL}/privacy`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [parentEmail],
      subject: 'Review a learner’s CodeIt account',
      text: [
        'A learner entered this email so a parent or guardian can review an existing CodeIt account.',
        'CodeIt has paused use of the learner account while it waits for your decision.',
        'The account may contain a non-identifying username, birthday, password hash, learning progress, and private projects.',
        'No public publishing is allowed for this learner. If you approve, CodeIt will continue using this information only to provide the private learning experience and family progress controls described in our privacy notice.',
        `Review the account: ${claimUrl}`,
        `Privacy notice: ${privacyUrl}`,
        `If you do not act within ${REVIEW_WINDOW_DAYS} days, this email address and review request will be deleted. You may also decline and request deletion from the review page.`,
      ].join('\n\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#3d302b;line-height:1.55">
          <div style="font-size:24px;font-weight:800;color:#f87824">CodeIt</div>
          <h1 style="font-size:25px">Review a learner's CodeIt account</h1>
          <p>A learner entered this email so a parent or guardian can review an existing CodeIt account.</p>
          <p><strong>CodeIt has paused use of the learner account while it waits for your decision.</strong></p>
          <p>The account may contain a non-identifying username, birthday, password hash, learning progress, and private projects. No public publishing is allowed for this learner.</p>
          <p>If you approve, CodeIt will continue using this information only to provide the private learning experience and family progress controls described in our privacy notice.</p>
          <p><a href="${claimUrl}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#f87824;color:#fff;text-decoration:none;font-weight:700">Review the learner account</a></p>
          <p style="font-size:13px;color:#72594d">If you do not act within ${REVIEW_WINDOW_DAYS} days, this email address and review request will be deleted. You can also decline and request deletion on the review page.</p>
          <p style="font-size:13px"><a href="${privacyUrl}">Read the CodeIt privacy notice</a></p>
        </div>`,
    }),
  });
  if (!response.ok) {
    throw Object.assign(new Error(`Email service returned ${response.status}.`), { statusCode: 502 });
  }
  return { sent: true, status: 'sent' };
}

async function requestLegacyReview(rawReviewToken, suppliedEmail) {
  await ready;
  await deleteExpiredPendingReviews();
  const child = await getReviewChild(rawReviewToken);
  const parentEmail = String(suppliedEmail || '').trim().toLowerCase();
  if (!validEmail(parentEmail)) {
    throw Object.assign(new Error('Enter a valid parent or guardian email.'), { statusCode: 400 });
  }

  const claimToken = createToken();
  await db.query(
    `INSERT INTO legacy_parent_reviews
       (child_user_id, parent_email, token_hash, expires_at, status, requested_at, claimed_at, adult_user_id)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ${REVIEW_WINDOW_DAYS} DAY), 'pending', NOW(), NULL, NULL)
     ON DUPLICATE KEY UPDATE parent_email = VALUES(parent_email),
       token_hash = VALUES(token_hash), expires_at = VALUES(expires_at),
       status = 'pending', requested_at = NOW(), claimed_at = NULL, adult_user_id = NULL`,
    [child.user_id, parentEmail, hashToken(claimToken)]
  );
  const delivery = await sendReviewEmail(child, parentEmail, claimToken);
  return { delivery, maskedParentEmail: maskEmail(parentEmail) };
}

async function getClaimPreview(rawClaimToken) {
  await ready;
  await deleteExpiredPendingReviews();
  const [[review]] = await db.query(
    `SELECT r.child_user_id, r.parent_email, u.username
       FROM legacy_parent_reviews r
       JOIN Users u ON u.user_id = r.child_user_id
      WHERE r.token_hash = ? AND r.status = 'pending' AND r.expires_at > NOW()
      LIMIT 1`,
    [hashToken(rawClaimToken)]
  );
  if (!review) throw Object.assign(new Error('This parent review link is invalid or has expired.'), { statusCode: 400 });
  return {
    learnerLabel: review.username ? `@${review.username}` : 'learner account',
    maskedParentEmail: maskEmail(review.parent_email),
    noticeVersion: FAMILY_NOTICE_VERSION,
  };
}

async function sendClaimConfirmation(adult, child) {
  if (!process.env.RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [adult.email],
      subject: 'Your CodeIt family connection is active',
      text: [
        `You approved the private CodeIt learner account @${child.username}.`,
        'Public publishing remains disabled. You can review progress, change the learner password, disable progress emails, or delete the learner profile from Family controls in your CodeIt profile.',
        `Manage family controls: ${SITE_URL}/profile`,
        `Privacy notice: ${SITE_URL}/privacy`,
      ].join('\n\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#3d302b;line-height:1.55">
          <div style="font-size:24px;font-weight:800;color:#f87824">CodeIt</div>
          <h1 style="font-size:25px">Your family connection is active</h1>
          <p>You approved the private CodeIt learner account <strong>@${escapeHtml(child.username)}</strong>.</p>
          <p>Public publishing remains disabled. You can review progress, change the learner password, disable progress emails, or delete the learner profile from Family controls.</p>
          <p><a href="${SITE_URL}/profile" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#f87824;color:#fff;text-decoration:none;font-weight:700">Manage family controls</a></p>
          <p style="font-size:13px"><a href="${SITE_URL}/privacy">Read the CodeIt privacy notice</a></p>
        </div>`,
    }),
  }).catch(error => console.error('Family confirmation email error:', error.message));
}

async function claimLegacyChild(adultUserId, rawClaimToken, input = {}) {
  await ready;
  const relationship = String(input.relationship || '').trim().toLowerCase();
  if (!validLegacyConsent(input, FAMILY_NOTICE_VERSION)) {
    throw Object.assign(new Error('Review and accept the current family privacy notice.'), { statusCode: 400 });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [[adult]] = await connection.query(
      'SELECT user_id, name, email, role FROM Users WHERE user_id = ? FOR UPDATE',
      [adultUserId]
    );
    if (!adult || String(adult.role).toLowerCase() === 'student' || !adult.email) {
      throw Object.assign(new Error('Sign in with a Parent / Educator account.'), { statusCode: 403 });
    }
    const [[review]] = await connection.query(
      `SELECT r.child_user_id, r.parent_email, u.username, u.dob, u.role
         FROM legacy_parent_reviews r
         JOIN Users u ON u.user_id = r.child_user_id
        WHERE r.token_hash = ? AND r.status = 'pending' AND r.expires_at > NOW()
        FOR UPDATE`,
      [hashToken(rawClaimToken)]
    );
    if (!review) {
      throw Object.assign(new Error('This parent review link is invalid or has expired.'), { statusCode: 400 });
    }
    if (String(adult.email).trim().toLowerCase() !== String(review.parent_email).trim().toLowerCase()) {
      throw Object.assign(new Error('Sign in with the same email address that received the review link.'), { statusCode: 403 });
    }
    const access = await childAccessStatus(review.child_user_id, review.dob, review.role);
    if (!access.under13) {
      throw Object.assign(new Error('This account no longer needs a parent-managed profile.'), { statusCode: 409 });
    }

    await connection.query('DELETE FROM parent_child_links WHERE child_user_id = ?', [review.child_user_id]);
    await connection.query(
      `INSERT INTO parent_child_links
         (adult_user_id, child_user_id, relationship, consent_version,
          public_sharing_allowed, progress_emails_enabled)
       VALUES (?, ?, ?, ?, 0, 0)`,
      [adult.user_id, review.child_user_id, relationship, FAMILY_NOTICE_VERSION]
    );
    await connection.query(
      `INSERT INTO adult_email_verifications (user_id, email, verified_at, token_hash, expires_at)
       VALUES (?, ?, NOW(), NULL, NULL)
       ON DUPLICATE KEY UPDATE email = VALUES(email), verified_at = NOW(),
         token_hash = NULL, expires_at = NULL`,
      [adult.user_id, String(adult.email).trim().toLowerCase()]
    );
    await connection.query(
      'UPDATE Users SET parent_email = ? WHERE user_id = ?',
      [String(adult.email).trim().toLowerCase(), review.child_user_id]
    );
    await connection.query(
      'UPDATE ai_projects SET is_public = 0 WHERE user_id = ?',
      [review.child_user_id]
    );
    await connection.query(
      `UPDATE legacy_parent_reviews
          SET status = 'claimed', token_hash = NULL, expires_at = NULL,
              claimed_at = NOW(), adult_user_id = ?
        WHERE child_user_id = ?`,
      [adult.user_id, review.child_user_id]
    );
    await connection.commit();
    void sendClaimConfirmation(adult, review);
    return { learnerLabel: review.username ? `@${review.username}` : 'learner account' };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

function legacyAccessGuard() {
  return async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (_) {
      return next();
    }
    if (String(payload.role || '').toLowerCase() !== 'student' || !payload.user_id) return next();
    try {
      const [[user]] = await db.query(
        'SELECT user_id, dob, role FROM Users WHERE user_id = ? LIMIT 1',
        [payload.user_id]
      );
      if (!user) return next();
      const access = await childAccessStatus(user.user_id, user.dob, user.role);
      if (!access.requiresParentReview) return next();
      return res.status(403).json({
        code: 'PARENT_REVIEW_REQUIRED',
        error: 'A parent or guardian needs to review this learner account before it can be used.',
        requiresParentReview: true,
        reviewToken: createReviewSession(user.user_id),
      });
    } catch (error) {
      console.error('Legacy account access check error:', error.message);
      return res.status(503).json({ error: 'We could not verify family access. Please try again.' });
    }
  };
}

module.exports = {
  REVIEW_WINDOW_DAYS,
  childAccessStatus,
  claimLegacyChild,
  createReviewSession,
  getClaimPreview,
  legacyAccessGuard,
  ready,
  requestLegacyReview,
};
