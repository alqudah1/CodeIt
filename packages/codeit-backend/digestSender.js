'use strict';

// ── Sending the monthly evidence email ───────────────────────────────────────
//
// Orchestration only: who is eligible, one send per learner per calendar
// month, and the delivery log. What the email SAYS lives in
// monthlyEvidence.js; how mail leaves the building lives in
// progressNotifications.js (SMTP, then Resend). Eligibility is the strictest
// signal we have: a parent who confirmed progress emails and has not
// unsubscribed. Nobody else gets mailed.

const pool = require('./db');
const { composeMonthlyEmail, gatherMonth, hasAnythingToSay, periodOf } = require('./monthlyEvidence');
const { createToken, hashToken, sendMail } = require('./progressNotifications');

async function eligibleLearners() {
  const [rows] = await pool.query(
    `SELECT p.user_id, p.parent_email, u.name, u.username
       FROM parent_notification_preferences p
       JOIN Users u ON u.user_id = p.user_id
      WHERE p.enabled = 1 AND p.verified_at IS NOT NULL`
  );
  return rows.map(row => ({
    userId: row.user_id,
    parentEmail: row.parent_email,
    studentName: row.name || row.username || 'Your learner',
  }));
}

async function alreadySent(userId, period) {
  const [rows] = await pool.query(
    'SELECT id FROM monthly_digest_log WHERE user_id = ? AND period = ?',
    [userId, period]
  );
  return rows.length > 0;
}

/**
 * Send this month's evidence email to every eligible family. Idempotent:
 * a learner already logged for this period is skipped, so a twice-pressed
 * button cannot double-mail anyone.
 */
async function sendMonthlyDigests({ dryRun = false } = {}) {
  const period = periodOf();
  const outcome = { period, eligible: 0, sent: 0, skippedAlreadySent: 0, skippedNothingToSay: 0, failed: 0, notConfigured: 0 };

  for (const learner of await eligibleLearners()) {
    outcome.eligible += 1;
    if (await alreadySent(learner.userId, period)) { outcome.skippedAlreadySent += 1; continue; }

    const month = await gatherMonth(learner.userId);
    if (!hasAnythingToSay(month)) { outcome.skippedNothingToSay += 1; continue; }
    if (dryRun) { outcome.sent += 1; continue; }

    // Fresh unsubscribe token per send, same rotation the milestone mails use.
    const unsubscribeToken = createToken();
    await pool.query(
      'UPDATE parent_notification_preferences SET unsubscribe_token_hash = ? WHERE user_id = ?',
      [hashToken(unsubscribeToken), learner.userId]
    );

    const message = composeMonthlyEmail({ studentName: learner.studentName, month, unsubscribeToken });
    const result = await sendMail({ to: learner.parentEmail, ...message });
    if (result.sent) {
      outcome.sent += 1;
      await pool.query(
        'INSERT INTO monthly_digest_log (user_id, period, status) VALUES (?, ?, ?) ON CONFLICT (user_id, period) DO NOTHING',
        [learner.userId, period, 'sent']
      );
    } else if (result.status === 'not_configured') {
      // No mail transport in this environment. Say so, rather than reporting
      // a delivery failure that never happened.
      outcome.notConfigured += 1;
    } else {
      outcome.failed += 1;
    }
  }
  return outcome;
}

/** The rendered email for one learner, for the owner's eyes before any send. */
async function previewMonthlyDigest(userId) {
  const [rows] = await pool.query(
    'SELECT name, username FROM Users WHERE user_id = ?', [userId]
  );
  if (!rows.length) return null;
  const month = await gatherMonth(userId);
  return {
    hasContent: hasAnythingToSay(month),
    month,
    email: composeMonthlyEmail({
      studentName: rows[0].name || rows[0].username,
      month,
      unsubscribeToken: 'preview-token-never-valid',
    }),
  };
}

module.exports = { eligibleLearners, previewMonthlyDigest, sendMonthlyDigests };
