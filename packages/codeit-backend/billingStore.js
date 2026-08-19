'use strict';

const pool = require('./db');

// ── Persistence for paid access ──────────────────────────────────────────────
//
// Everything in here is written by the Stripe webhook and read by the API.
// The browser never supplies a plan, a status or a period end.

async function getSubscriptionByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT user_id, stripe_customer_id, stripe_subscription_id, price_id, status,
            current_period_end, cancel_at_period_end
       FROM subscriptions
      WHERE user_id = ?`,
    [userId]
  );
  return rows[0] || null;
}

async function getSubscriptionByCustomerId(customerId) {
  const [rows] = await pool.query(
    `SELECT user_id, stripe_customer_id, stripe_subscription_id, price_id, status,
            current_period_end, cancel_at_period_end
       FROM subscriptions
      WHERE stripe_customer_id = ?`,
    [customerId]
  );
  return rows[0] || null;
}

/** Remember the Stripe customer before checkout, so the webhook can find the user. */
async function linkCustomer(userId, customerId) {
  await pool.query(
    `INSERT INTO subscriptions (user_id, stripe_customer_id, status)
     VALUES (?, ?, 'incomplete')
     ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id,
                                         updated_at = now()`,
    [userId, customerId]
  );
}

async function upsertSubscription(userId, fields) {
  await pool.query(
    `INSERT INTO subscriptions
       (user_id, stripe_customer_id, stripe_subscription_id, price_id, status,
        current_period_end, cancel_at_period_end)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET
       stripe_customer_id     = EXCLUDED.stripe_customer_id,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       price_id               = EXCLUDED.price_id,
       status                 = EXCLUDED.status,
       current_period_end     = EXCLUDED.current_period_end,
       cancel_at_period_end   = EXCLUDED.cancel_at_period_end,
       updated_at             = now()`,
    [
      userId,
      fields.stripeCustomerId || null,
      fields.stripeSubscriptionId || null,
      fields.priceId || null,
      fields.status,
      fields.currentPeriodEnd || null,
      Boolean(fields.cancelAtPeriodEnd),
    ]
  );
}

/**
 * Record a webhook event id. Returns false when the event was already handled,
 * so the caller can acknowledge and do nothing.
 */
async function claimWebhookEvent(eventId, eventType) {
  const [result] = await pool.query(
    `INSERT INTO billing_events (event_id, event_type) VALUES (?, ?)
     ON CONFLICT (event_id) DO NOTHING`,
    [eventId, eventType]
  );
  return result.affectedRows > 0;
}

async function recordAiBuild(userId) {
  if (!userId) return;
  await pool.query('INSERT INTO ai_build_usage (user_id) VALUES (?)', [userId]);
}

async function countAiBuildsThisMonth(userId) {
  if (!userId) return 0;
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS build_count
       FROM ai_build_usage
      WHERE user_id = ?
        AND created_at >= date_trunc('month', now())`,
    [userId]
  );
  return Number(rows[0]?.build_count || 0);
}

module.exports = {
  claimWebhookEvent,
  countAiBuildsThisMonth,
  getSubscriptionByCustomerId,
  getSubscriptionByUserId,
  linkCustomer,
  recordAiBuild,
  upsertSubscription,
};
