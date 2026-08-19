'use strict';

// ── Translating Stripe webhooks into our subscription row ────────────────────
//
// Pure functions, so the mapping can be tested without a Stripe account or a
// database. The webhook route does IO; this file decides what the row means.

// The events that can change paid access. Anything else is acknowledged and
// ignored, because Stripe sends a great deal we do not care about.
const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
]);

function isHandledEvent(type) {
  return HANDLED_EVENTS.has(type);
}

function unixToIso(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return null;
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function idOf(value) {
  // Stripe fields are either a bare id or an expanded object.
  if (!value) return null;
  if (typeof value === 'string') return value;
  return typeof value.id === 'string' ? value.id : null;
}

/**
 * Flatten a Stripe subscription into the columns we store.
 * Returns null when the payload is not usable, so the caller can acknowledge
 * the event rather than throwing and forcing Stripe to retry forever.
 */
function subscriptionFields(subscription) {
  if (!subscription || typeof subscription !== 'object') return null;
  const id = idOf(subscription);
  const status = typeof subscription.status === 'string' ? subscription.status : null;
  if (!id || !status) return null;

  const item = subscription.items?.data?.[0] || null;

  return {
    stripeSubscriptionId: id,
    stripeCustomerId: idOf(subscription.customer),
    priceId: idOf(item?.price) || idOf(subscription.plan),
    status,
    // Newer API versions moved the period onto the subscription item; accept both.
    currentPeriodEnd: unixToIso(subscription.current_period_end ?? item?.current_period_end),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  };
}

/**
 * Work out which CodeIt user an event belongs to.
 * Checkout carries our own user id in client_reference_id / metadata; later
 * subscription events only carry the Stripe customer, so the caller falls back
 * to a lookup by customer id.
 */
function userIdFromEvent(event) {
  const object = event?.data?.object || {};
  const candidates = [
    object.client_reference_id,
    object.metadata?.codeit_user_id,
    object.subscription_details?.metadata?.codeit_user_id,
  ];
  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function customerIdFromEvent(event) {
  return idOf(event?.data?.object?.customer);
}

module.exports = {
  HANDLED_EVENTS,
  customerIdFromEvent,
  isHandledEvent,
  subscriptionFields,
  unixToIso,
  userIdFromEvent,
};
