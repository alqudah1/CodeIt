'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  PLANS,
  checkAiBuildAllowance,
  checkPublishAllowance,
  entitlementsFor,
  isSubscriptionActive,
  planForSubscription,
} = require('./entitlements');

const NOW = new Date('2026-08-19T12:00:00Z');
const NEXT_MONTH = '2026-09-19T12:00:00Z';
const LAST_MONTH = '2026-07-19T12:00:00Z';

function sub(overrides = {}) {
  return { status: 'active', current_period_end: NEXT_MONTH, cancel_at_period_end: false, ...overrides };
}

test('no subscription means the free plan', () => {
  assert.strictEqual(planForSubscription(null, NOW).id, 'free');
  assert.strictEqual(planForSubscription(undefined, NOW).id, 'free');
  assert.strictEqual(isSubscriptionActive(null, NOW), false);
});

test('active and trialing subscriptions unlock Plus', () => {
  assert.strictEqual(planForSubscription(sub(), NOW).id, 'plus');
  assert.strictEqual(planForSubscription(sub({ status: 'trialing' }), NOW).id, 'plus');
});

test('a failed payment does not immediately lock a family out', () => {
  // Stripe retries past_due for days. Locking a child out of published work on
  // the first failed charge is worse than carrying them through the retries.
  assert.strictEqual(planForSubscription(sub({ status: 'past_due' }), NOW).id, 'plus');
});

test('cancelled, unpaid and incomplete subscriptions fall back to free', () => {
  for (const status of ['canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused']) {
    assert.strictEqual(planForSubscription(sub({ status }), NOW).id, 'free', status);
  }
});

test('access ends when the paid period has elapsed', () => {
  assert.strictEqual(planForSubscription(sub({ current_period_end: LAST_MONTH }), NOW).id, 'free');
});

test('cancel-at-period-end keeps access until the period actually ends', () => {
  const cancelling = sub({ cancel_at_period_end: true });
  assert.strictEqual(planForSubscription(cancelling, NOW).id, 'plus');
  assert.strictEqual(entitlementsFor(cancelling, NOW).willLoseAccessAt, NEXT_MONTH);
});

test('entitlements never leak Stripe identifiers', () => {
  const view = entitlementsFor({ ...sub(), stripe_customer_id: 'cus_123', stripe_subscription_id: 'sub_123' }, NOW);
  assert.strictEqual(JSON.stringify(view).includes('cus_123'), false);
  assert.strictEqual(JSON.stringify(view).includes('sub_123'), false);
  assert.deepStrictEqual(Object.keys(view).sort(), [
    'canPublish', 'cancelAtPeriodEnd', 'currentPeriodEnd', 'maxChildProfiles',
    'monthlyAiBuilds', 'plan', 'planLabel', 'status', 'unlimitedAi', 'willLoseAccessAt',
  ]);
});

test('free plan allows a capped number of AI builds a month', () => {
  const limit = PLANS.free.monthlyAiBuilds;
  assert.deepStrictEqual(checkAiBuildAllowance(null, 0, NOW), { allowed: true, remaining: limit, unlimited: false });
  assert.strictEqual(checkAiBuildAllowance(null, limit - 1, NOW).remaining, 1);

  const blocked = checkAiBuildAllowance(null, limit, NOW);
  assert.strictEqual(blocked.allowed, false);
  assert.strictEqual(blocked.code, 'FREE_AI_LIMIT_REACHED');
  // The message must always point at something that still works.
  assert.match(blocked.message, /studio tools/);
  assert.match(blocked.message, /lesson/);
});

test('a used count above the cap never reports negative remaining', () => {
  assert.strictEqual(checkAiBuildAllowance(null, 999, NOW).remaining, 0);
});

test('a missing or nonsense build count is treated as zero', () => {
  assert.strictEqual(checkAiBuildAllowance(null, undefined, NOW).allowed, true);
  assert.strictEqual(checkAiBuildAllowance(null, NaN, NOW).allowed, true);
  assert.strictEqual(checkAiBuildAllowance(null, -4, NOW).remaining, PLANS.free.monthlyAiBuilds);
});

test('Plus removes the AI build cap entirely', () => {
  const allowance = checkAiBuildAllowance(sub(), 5000, NOW);
  assert.deepStrictEqual(allowance, { allowed: true, remaining: null, unlimited: true });
});

test('publishing does not need a paid plan', () => {
  // It used to. The pricing page had said "Build, edit, save, and publish
  // projects" in the free column the whole time, so the site promised it and
  // the server refused it — and children in a real classroom pressed Share and
  // were shown nothing at all. Publishing also costs nothing to run: it writes
  // a row and hands back a link. The AI generation cap is what Plus is for.
  assert.strictEqual(checkPublishAllowance(null, {}, NOW).allowed, true);
  assert.strictEqual(checkPublishAllowance(sub(), {}, NOW).allowed, true);
});

test('what the free plan actually includes', () => {
  // Read straight off the plan, so this file disagrees loudly with the pricing
  // page rather than quietly, if either ever moves again.
  assert.strictEqual(PLANS.free.canPublish, true);
  assert.strictEqual(PLANS.free.monthlyAiBuilds, 10);
  assert.strictEqual(PLANS.plus.monthlyAiBuilds, Infinity);
});

test('the child-safety rule outranks the billing rule', () => {
  // Paying does not buy the right to publish a under-13 child's work publicly.
  const paidChild = checkPublishAllowance(sub(), { managedProfile: true }, NOW);
  assert.strictEqual(paidChild.allowed, false);
  assert.strictEqual(paidChild.code, 'MANAGED_PROFILE_PRIVATE');

  const paidUnder13 = checkPublishAllowance(sub(), { studentAge: 11 }, NOW);
  assert.strictEqual(paidUnder13.allowed, false);
  assert.strictEqual(paidUnder13.code, 'MANAGED_PROFILE_PRIVATE');

  assert.strictEqual(checkPublishAllowance(sub(), { studentAge: 13 }, NOW).allowed, true);
});

test('an unknown age does not accidentally block a paying teenager', () => {
  assert.strictEqual(checkPublishAllowance(sub(), { studentAge: null }, NOW).allowed, true);
});

test('lessons and manual editing are never gated', () => {
  // Guard against a future edit quietly putting a paywall in the learning path.
  const freePlan = PLANS.free;
  assert.ok(!('lessonsLocked' in freePlan));
  assert.ok(!('editingLocked' in freePlan));
  assert.strictEqual(freePlan.maxChildProfiles >= 1, true);
});
