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

  // Newer API versions moved the period onto the subscription item; accept both.
  const currentPeriodEnd = unixToIso(subscription.current_period_end ?? item?.current_period_end);
  const cancelAt = unixToIso(subscription.cancel_at);

  return {
    stripeSubscriptionId: id,
    stripeCustomerId: idOf(subscription.customer),
    priceId: idOf(item?.price) || idOf(subscription.plan),
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd: cancelsAtPeriodEnd(subscription, currentPeriodEnd, cancelAt),
  };
}

/**
 * Is this subscription set to stop at the end of the period it is in?
 *
 * Reading `cancel_at_period_end` alone was wrong, and it was wrong silently.
 * A parent cancelled in Stripe's own portal, Stripe recorded "Cancels Sep 25",
 * the event arrived and was stored - and the site went on telling them
 * "Renews on 9/25". The flag was false in the payload because this API version
 * expresses a pending cancellation by setting `cancel_at` to the end of the
 * period instead.
 *
 * So both are accepted. `cancel_at` is only treated as a period-end
 * cancellation when it falls at or before the current period end: a `cancel_at`
 * further out means the subscription really does keep renewing until then, and
 * "renews on" is the true thing to say in the meantime.
 *
 * ISO strings from unixToIso are all UTC and fixed-width, so comparing them as
 * text is the same as comparing the instants.
 */
function cancelsAtPeriodEnd(subscription, currentPeriodEnd, cancelAt) {
  if (subscription.cancel_at_period_end) return true;
  if (!cancelAt) return false;
  if (!currentPeriodEnd) return true;
  return cancelAt <= currentPeriodEnd;
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
