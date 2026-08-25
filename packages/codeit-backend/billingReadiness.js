'use strict';

// ── Whether a family may be charged at all ───────────────────────────────────
//
// One rule, kept out of the route so it can be tested without a database — the
// same reason stepXp.js keeps its rules separate from its queries.
//
// The rule protects one thing: a family must never be able to start a checkout
// that could not have been honoured.
//
// Three of the four conditions are obvious. The fourth is the one that was
// missing, and it is the one that matters most.
//
// ── Why the webhook secret is not optional ───────────────────────────────────
//
// Access to the paid plan is granted by the Stripe webhook and by nothing else.
// The success redirect deliberately says only "we are setting this up", because
// a redirect can be forged by anyone who can read a URL.
//
// So with no webhook secret, the webhook cannot verify a signature and answers
// 503. Stripe retries into a wall. The card is charged, Stripe shows a
// successful payment, and the family receives nothing — and then has to notice,
// write in, and be refunded by hand. For a product with its first paying
// customers, that is close to the worst failure available.
//
// Without it, billing is simply not offered. Nothing appears on the pricing
// page, no checkout can be started, and nobody is charged for a thing that
// could not be delivered.
//
// ── Why a live key is guarded separately ─────────────────────────────────────
//
// A live key in an untested integration is how real families get charged by
// accident. STRIPE_ALLOW_LIVE_MODE is a deliberate act by a human who has run
// the flow end to end, not a default.

/**
 * @param {object} env  usually process.env
 * @returns {{ready: boolean, missing: string[], live: boolean}}
 *
 * `missing` is returned rather than just a boolean so the caller can say what
 * is wrong in a log, instead of "billing disabled" with no reason.
 */
function billingReadiness(env = {}) {
  const missing = [];

  if (env.BILLING_ENABLED !== 'true') missing.push('BILLING_ENABLED');
  if (!env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
  if (!env.STRIPE_PRICE_ID) missing.push('STRIPE_PRICE_ID');
  if (!env.STRIPE_WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET');

  const key = env.STRIPE_SECRET_KEY || '';
  const testKey = key.startsWith('sk_test_');
  const liveAllowed = env.STRIPE_ALLOW_LIVE_MODE === 'true';

  // A key that is not a test key is treated as live, including a malformed one.
  // Guessing charitably about an unrecognised key is not a risk worth taking
  // when the downside is charging a real card.
  const live = Boolean(key) && !testKey;

  if (live && !liveAllowed) missing.push('STRIPE_ALLOW_LIVE_MODE');

  return { ready: missing.length === 0, missing, live };
}

/** A single line for the log, naming exactly what is missing. */
function readinessMessage(readiness) {
  if (!readiness || readiness.ready) return null;
  if (readiness.missing.includes('STRIPE_WEBHOOK_SECRET')) {
    return 'Billing disabled: STRIPE_WEBHOOK_SECRET is not set. Checkout would take '
      + 'payment and the webhook that grants access would answer 503.';
  }
  if (readiness.missing.includes('STRIPE_ALLOW_LIVE_MODE')) {
    return 'Billing disabled: STRIPE_SECRET_KEY is a live key. '
      + 'Set STRIPE_ALLOW_LIVE_MODE=true once the flow has been tested end to end.';
  }
  return `Billing disabled: missing ${readiness.missing.join(', ')}.`;
}

module.exports = { billingReadiness, readinessMessage };
