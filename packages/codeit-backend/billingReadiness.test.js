'use strict';

// The rule that decides whether a family may be charged.
//
// One thing it protects: nobody may start a checkout that could not have been
// honoured. Access is granted by the Stripe webhook and by nothing else, so a
// missing webhook secret means a successful payment grants nothing at all.

const test = require('node:test');
const assert = require('node:assert/strict');
const { billingReadiness, readinessMessage } = require('./billingReadiness');

const TEST_MODE = {
  BILLING_ENABLED: 'true',
  STRIPE_SECRET_KEY: 'sk_test_abc123',
  STRIPE_PRICE_ID: 'price_abc123',
  STRIPE_WEBHOOK_SECRET: 'whsec_abc123',
};

const LIVE_MODE = {
  ...TEST_MODE,
  STRIPE_SECRET_KEY: 'sk_live_realmoney',
  STRIPE_ALLOW_LIVE_MODE: 'true',
};

const without = (env, key) => { const copy = { ...env }; delete copy[key]; return copy; };

test('everything set in test mode: billing is offered', () => {
  assert.equal(billingReadiness(TEST_MODE).ready, true);
});

test('everything set in live mode, deliberately enabled: billing is offered', () => {
  const readiness = billingReadiness(LIVE_MODE);
  assert.equal(readiness.ready, true);
  assert.equal(readiness.live, true);
});

// ── The one this file exists for ────────────────────────────────────────────

test('no webhook secret: billing is NOT offered', () => {
  assert.equal(billingReadiness(without(TEST_MODE, 'STRIPE_WEBHOOK_SECRET')).ready, false);
});

test('no webhook secret in LIVE mode: still not offered', () => {
  // Real money, and no way to grant what it buys. The most dangerous
  // combination available, and the reason this rule exists.
  const readiness = billingReadiness(without(LIVE_MODE, 'STRIPE_WEBHOOK_SECRET'));
  assert.equal(readiness.ready, false);
  assert.ok(readiness.missing.includes('STRIPE_WEBHOOK_SECRET'));
});

test('an empty webhook secret counts as missing', () => {
  assert.equal(billingReadiness({ ...TEST_MODE, STRIPE_WEBHOOK_SECRET: '' }).ready, false);
});

test('the log says which secret is missing, not just "disabled"', () => {
  const message = readinessMessage(billingReadiness(without(LIVE_MODE, 'STRIPE_WEBHOOK_SECRET')));
  assert.match(message, /STRIPE_WEBHOOK_SECRET/);
  assert.match(message, /would answer 503/);
});

// ── Live keys ───────────────────────────────────────────────────────────────

test('a live key without the deliberate flag: not offered', () => {
  const readiness = billingReadiness(without(LIVE_MODE, 'STRIPE_ALLOW_LIVE_MODE'));
  assert.equal(readiness.ready, false);
  assert.ok(readiness.missing.includes('STRIPE_ALLOW_LIVE_MODE'));
});

test('an unrecognised key is treated as live, not waved through', () => {
  // Guessing charitably about an odd key is not worth it when the downside is
  // charging a real card.
  const readiness = billingReadiness({ ...TEST_MODE, STRIPE_SECRET_KEY: 'rk_something_else' });
  assert.equal(readiness.live, true);
  assert.equal(readiness.ready, false);
});

test('a test key is never treated as live, flag or no flag', () => {
  assert.equal(billingReadiness(TEST_MODE).live, false);
  assert.equal(billingReadiness({ ...TEST_MODE, STRIPE_ALLOW_LIVE_MODE: 'true' }).live, false);
});

// ── The rest ────────────────────────────────────────────────────────────────

test('each missing piece is named', () => {
  for (const key of ['BILLING_ENABLED', 'STRIPE_SECRET_KEY', 'STRIPE_PRICE_ID', 'STRIPE_WEBHOOK_SECRET']) {
    const readiness = billingReadiness(without(TEST_MODE, key));
    assert.equal(readiness.ready, false, `${key} missing should not be ready`);
    assert.ok(readiness.missing.includes(key), `${key} should be named as missing`);
  }
});

test('BILLING_ENABLED must be exactly true', () => {
  assert.equal(billingReadiness({ ...TEST_MODE, BILLING_ENABLED: 'yes' }).ready, false);
  assert.equal(billingReadiness({ ...TEST_MODE, BILLING_ENABLED: '1' }).ready, false);
  assert.equal(billingReadiness({ ...TEST_MODE, BILLING_ENABLED: 'TRUE' }).ready, false);
});

test('STRIPE_ALLOW_LIVE_MODE must be exactly true', () => {
  assert.equal(billingReadiness({ ...LIVE_MODE, STRIPE_ALLOW_LIVE_MODE: 'yes' }).ready, false);
});

test('nothing configured at all does not throw', () => {
  assert.doesNotThrow(() => billingReadiness());
  assert.doesNotThrow(() => billingReadiness({}));
  assert.equal(billingReadiness({}).ready, false);
  assert.equal(readinessMessage(billingReadiness(TEST_MODE)), null);
});
