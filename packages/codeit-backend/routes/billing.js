'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../config');
const { entitlementsFor, checkPublishAllowance } = require('../entitlements');
const {
  customerIdFromEvent,
  isHandledEvent,
  subscriptionFields,
  userIdFromEvent,
} = require('../billingEvents');
const store = require('../billingStore');
const { studentAgeEligibility } = require('../studentAge');

const router = express.Router();

// ── Configuration ────────────────────────────────────────────────────────────
//
// Billing stays completely invisible until every one of these is present, so a
// half-configured deploy shows the current free product rather than a broken
// checkout button. Secrets live in Vercel environment variables and are never
// read by, or sent to, the frontend.

const { billingReadiness, readinessMessage } = require('../billingReadiness');

const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || 'https://codeitlearn.com';

function billingConfig() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    priceId: process.env.STRIPE_PRICE_ID || '',
    enabled: process.env.BILLING_ENABLED === 'true',
  };
}

// Refuse to run against live keys until this is deliberately turned off.
function isTestModeOnly() {
  return process.env.STRIPE_ALLOW_LIVE_MODE !== 'true';
}

let warnedAboutLiveKey = false;
let warnedAboutWebhookSecret = false;

function isConfigured() {
  const config = billingConfig();
  if (!config.enabled || !config.secretKey || !config.priceId) return false;

  // The webhook secret is part of being configured, not an extra. See
  // billingReadiness.js for why, and for the rule itself.
  if (!config.webhookSecret) {
    if (!warnedAboutWebhookSecret) {
      warnedAboutWebhookSecret = true;
      console.error(readinessMessage(billingReadiness(process.env)));
    }
    return false;
  }

  if (isTestModeOnly() && !config.secretKey.startsWith('sk_test_')) {
    // Treat a live key as "not configured" rather than throwing. Billing stays
    // completely inert, so a misconfigured deploy cannot charge a real family.
    if (!warnedAboutLiveKey) {
      warnedAboutLiveKey = true;
      console.error(
        'Billing disabled: STRIPE_SECRET_KEY is a live key. '
        + 'Set STRIPE_ALLOW_LIVE_MODE=true once the flow has been tested end to end.'
      );
    }
    return false;
  }
  return true;
}

let stripeClient = null;
function stripe() {
  if (stripeClient) return stripeClient;
  const { secretKey } = billingConfig();
  if (!secretKey) return null;
  if (isTestModeOnly() && !secretKey.startsWith('sk_test_')) {
    // A live key in an untested integration is how real families get charged by
    // accident. Fail loudly instead of quietly taking money.
    throw new Error('STRIPE_SECRET_KEY is not a test key and live mode is not enabled.');
  }
  // Required lazily so the backend still boots when Stripe is not installed or
  // not configured — every other route must keep working.
  const Stripe = require('stripe');
  // Must match the account's API version. Managed Payments does not exist on
  // older versions, and Checkout rejects the session outright rather than
  // degrading: "Managed Payments is not supported on API version 2024-06-20".
  // This is also the version the webhook destination sends, so event payloads
  // and API responses share one shape.
  stripeClient = new Stripe(secretKey, {
    apiVersion: process.env.STRIPE_API_VERSION || '2026-07-29.dahlia',
  });
  return stripeClient;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// ── Public plan info ─────────────────────────────────────────────────────────
//
// Whether subscriptions are open, and what they cost, is not private — it is on
// the pricing page. But /status needs a token, so a signed-out visitor got
// billingEnabled: false and the paid plan vanished from the page entirely. A
// parent comparing CodeIt against Tynker on their phone, not signed in, saw no
// business model at all.
//
// Deliberately returns nothing account-specific: no customer, no subscription,
// no usage. Just what is already printed on the pricing page.

router.get('/plan', (req, res) => {
  res.json({
    billingEnabled: isConfigured(),
    currency: 'CAD',
    amount: 12,
    interval: 'month',
  });
});

// ── Status ───────────────────────────────────────────────────────────────────

// Always answers, configured or not, so the frontend has one place to ask what
// this account may do.
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const subscription = isConfigured()
      ? await store.getSubscriptionByUserId(req.user.user_id)
      : null;
    const buildsThisMonth = await store.countAiBuildsThisMonth(req.user.user_id).catch(() => 0);
    res.json({
      billingEnabled: isConfigured(),
      buildsThisMonth,
      ...entitlementsFor(subscription),
    });
  } catch (error) {
    console.error('Billing status error:', error.message);
    res.status(500).json({ error: 'Could not read your plan right now.' });
  }
});

// ── Checkout ─────────────────────────────────────────────────────────────────

router.post('/checkout', authenticateToken, async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ code: 'BILLING_DISABLED', error: 'Subscriptions are not open yet.' });
  }

  try {
    const userId = req.user.user_id;

    // CodeIt does not sell to children. The payer must be an adult account.
    const [rows] = await pool.query('SELECT email, role, dob FROM Users WHERE user_id = ?', [userId]);
    const account = rows[0];
    if (!account) return res.status(404).json({ error: 'Account not found.' });

    if (req.user.managedProfile) {
      return res.status(403).json({
        code: 'ADULT_REQUIRED',
        error: 'Ask a parent or guardian to set up CodeIt Plus from their own account.',
      });
    }
    if (account.dob) {
      const eligibility = studentAgeEligibility(String(account.dob).slice(0, 10));
      if (eligibility.age !== null && eligibility.age < 18) {
        return res.status(403).json({
          code: 'ADULT_REQUIRED',
          error: 'Ask a parent or guardian to set up CodeIt Plus from their own account.',
        });
      }
    }

    const client = stripe();
    const existing = await store.getSubscriptionByUserId(userId);
    let customerId = existing?.stripe_customer_id || null;

    if (!customerId) {
      const customer = await client.customers.create({
        email: account.email || undefined,
        metadata: { codeit_user_id: String(userId) },
      });
      customerId = customer.id;
      await store.linkCustomer(userId, customerId);
    }

    const session = await client.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: String(userId),
      line_items: [{ price: billingConfig().priceId, quantity: 1 }],
      subscription_data: { metadata: { codeit_user_id: String(userId) } },
      // The success page only says "we are setting this up" — access is granted
      // by the webhook, never by this redirect.
      success_url: `${PUBLIC_SITE_URL}/pricing?checkout=complete`,
      cancel_url: `${PUBLIC_SITE_URL}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (error) {
    // Stripe's own error code is safe to surface and is the difference between
    // "something broke" and a five-second fix. The human-readable message stays
    // generic; the code is for whoever is debugging.
    console.error('Checkout session error:', error.type, error.code, error.message);
    res.status(502).json({
      error: 'Could not open the payment page. Please try again.',
      stripeCode: error.code || error.type || null,
      stripeMessage: process.env.BILLING_DEBUG === 'true' ? error.message : undefined,
    });
  }
});

// ── Billing portal ───────────────────────────────────────────────────────────
//
// Card updates and cancellation happen on Stripe's own pages. CodeIt never sees
// or stores card details.

router.post('/portal', authenticateToken, async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ code: 'BILLING_DISABLED', error: 'Subscriptions are not open yet.' });
  }
  try {
    const subscription = await store.getSubscriptionByUserId(req.user.user_id);
    if (!subscription?.stripe_customer_id) {
      return res.status(404).json({ code: 'NO_SUBSCRIPTION', error: 'This account has no billing set up yet.' });
    }
    const session = await stripe().billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${PUBLIC_SITE_URL}/pricing`,
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('Billing portal error:', error.message);
    res.status(502).json({ error: 'Could not open the billing page. Please try again.' });
  }
});

// ── Webhook: the only thing that grants or removes paid access ───────────────
//
// Mounted separately in test-quiz.js with express.raw, because signature
// verification needs the exact bytes Stripe sent.

async function handleWebhook(req, res) {
  const { webhookSecret } = billingConfig();
  if (!isConfigured() || !webhookSecret) return res.status(503).send('Billing not configured');

  let event;
  try {
    event = stripe().webhooks.constructEvent(req.body, req.headers['stripe-signature'], webhookSecret);
  } catch (error) {
    // An unverified payload is not from Stripe. Never act on it.
    console.error('Stripe signature verification failed:', error.message);
    return res.status(400).send(`Webhook signature verification failed: ${error.message}`);
  }

  // Acknowledge anything we do not act on, so Stripe stops retrying it.
  if (!isHandledEvent(event.type)) return res.json({ received: true, ignored: true });

  try {
    const fresh = await store.claimWebhookEvent(event.id, event.type);
    if (!fresh) return res.json({ received: true, duplicate: true });

    await applyEvent(event);
    res.json({ received: true });
  } catch (error) {
    // A 500 makes Stripe retry, which is what we want for a transient DB fault.
    console.error(`Billing webhook error (${event.type}):`, error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Is this subscription actually for CodeIt Plus?
 *
 * A Stripe sandbox can be shared with another product, and every destination
 * receives every event type it subscribes to — including the other app's. Both
 * apps also use client_reference_id for their own user ids, so a neighbouring
 * checkout for user "7" would otherwise grant CodeIt Plus to CodeIt's user 7.
 * The price id is the only reliable discriminator.
 */
function belongsToCodeIt(fields) {
  const ourPrice = billingConfig().priceId;
  if (!ourPrice) return false;
  return fields?.priceId === ourPrice;
}

async function applyEvent(event) {
  const client = stripe();
  const object = event.data.object;

  // Checkout only tells us a session completed; fetch the real subscription
  // rather than trusting whatever is embedded in the session.
  if (event.type === 'checkout.session.completed') {
    const userId = userIdFromEvent(event);
    const subscriptionId = typeof object.subscription === 'string'
      ? object.subscription
      : object.subscription?.id;
    if (!userId || !subscriptionId) return;
    const subscription = await client.subscriptions.retrieve(subscriptionId);
    const fields = subscriptionFields(subscription);
    if (!fields || !belongsToCodeIt(fields)) return;
    await store.upsertSubscription(userId, fields);
    return;
  }

  if (event.type === 'invoice.payment_failed') {
    const customerId = customerIdFromEvent(event);
    const existing = customerId ? await store.getSubscriptionByCustomerId(customerId) : null;
    if (!existing) return;
    // Stripe will send customer.subscription.updated with the authoritative
    // status; record past_due now so the parent can be told promptly.
    await store.upsertSubscription(existing.user_id, {
      stripeCustomerId: existing.stripe_customer_id,
      stripeSubscriptionId: existing.stripe_subscription_id,
      priceId: existing.price_id,
      status: 'past_due',
      currentPeriodEnd: existing.current_period_end,
      cancelAtPeriodEnd: existing.cancel_at_period_end,
    });
    return;
  }

  // customer.subscription.created / updated / deleted
  const fields = subscriptionFields(object);
  if (!fields || !belongsToCodeIt(fields)) return;

  let userId = userIdFromEvent(event);
  if (!userId && fields.stripeCustomerId) {
    const existing = await store.getSubscriptionByCustomerId(fields.stripeCustomerId);
    userId = existing?.user_id || null;
  }
  if (!userId) return;

  await store.upsertSubscription(userId, {
    ...fields,
    status: event.type === 'customer.subscription.deleted' ? 'canceled' : fields.status,
  });
}

// ── Shared helpers for other routers ─────────────────────────────────────────

/**
 * Paid-plan gate for publishing. Falls open when billing is not configured, so
 * turning Stripe off can never strand a family that could publish yesterday.
 */
async function assertCanPublish(userId, context) {
  if (!isConfigured()) return { allowed: true };
  const subscription = await store.getSubscriptionByUserId(userId);
  return checkPublishAllowance(subscription, context);
}

module.exports = router;
module.exports.assertCanPublish = assertCanPublish;
module.exports.handleWebhook = handleWebhook;
// Exported so the rule that decides whether a family may be charged can be
// tested directly, rather than inferred from an endpoint's response.
module.exports.isConfigured = isConfigured;
module.exports.isBillingConfigured = isConfigured;
// Exported for tests: the shared-sandbox guard is worth asserting directly.
module.exports.applyEvent = applyEvent;
module.exports.belongsToCodeIt = belongsToCodeIt;
