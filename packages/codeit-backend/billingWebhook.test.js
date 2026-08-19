'use strict';

// These tests exercise the webhook entry point without a Stripe account or a
// database. The point is the security posture: an unverified payload must never
// grant paid access, and a misconfigured deploy must fail closed.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-value-at-least-32-chars-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/codeit_test';

const test = require('node:test');
const assert = require('node:assert');

function freshBilling(env = {}) {
  for (const key of ['BILLING_ENABLED', 'STRIPE_SECRET_KEY', 'STRIPE_PRICE_ID', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_ALLOW_LIVE_MODE']) {
    delete process.env[key];
  }
  Object.assign(process.env, env);
  delete require.cache[require.resolve('./routes/billing')];
  return require('./routes/billing');
}

function fakeRes() {
  const res = { statusCode: 200, body: null, sent: null };
  res.status = code => { res.statusCode = code; return res; };
  res.json = payload => { res.body = payload; return res; };
  res.send = payload => { res.sent = payload; return res; };
  return res;
}

const CONFIGURED = {
  BILLING_ENABLED: 'true',
  STRIPE_SECRET_KEY: 'sk_test_fake_key_for_tests',
  STRIPE_PRICE_ID: 'price_test_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
};

test('billing is off unless every setting is present', () => {
  assert.strictEqual(freshBilling().isBillingConfigured(), false, 'nothing set');
  assert.strictEqual(freshBilling({ BILLING_ENABLED: 'true' }).isBillingConfigured(), false, 'no key');
  assert.strictEqual(
    freshBilling({ BILLING_ENABLED: 'true', STRIPE_SECRET_KEY: 'sk_test_x' }).isBillingConfigured(),
    false, 'no price'
  );
  assert.strictEqual(
    freshBilling({ ...CONFIGURED, BILLING_ENABLED: 'false' }).isBillingConfigured(),
    false, 'flag off'
  );
  assert.strictEqual(freshBilling(CONFIGURED).isBillingConfigured(), true);
});

test('an unconfigured deploy refuses webhooks instead of guessing', async () => {
  const billing = freshBilling();
  const res = fakeRes();
  await billing.handleWebhook({ headers: {}, body: Buffer.from('{}') }, res);
  assert.strictEqual(res.statusCode, 503);
});

test('a payload with no signature is rejected', async () => {
  const billing = freshBilling(CONFIGURED);
  const res = fakeRes();
  await billing.handleWebhook(
    { headers: {}, body: Buffer.from(JSON.stringify({ id: 'evt_1', type: 'customer.subscription.updated' })) },
    res
  );
  assert.strictEqual(res.statusCode, 400);
  assert.match(String(res.sent), /signature/i);
});

test('a forged payload claiming an active subscription is rejected', async () => {
  // The exact attack the "webhook is the source of truth" rule exists to stop:
  // anyone can POST this body, so only the signature may be believed.
  const billing = freshBilling(CONFIGURED);
  const res = fakeRes();
  const forged = JSON.stringify({
    id: 'evt_forged',
    type: 'customer.subscription.updated',
    data: { object: { id: 'sub_x', customer: 'cus_x', status: 'active', client_reference_id: '1' } },
  });
  await billing.handleWebhook(
    { headers: { 'stripe-signature': 't=1,v1=deadbeef' }, body: Buffer.from(forged) },
    res
  );
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body, null, 'nothing was processed');
});

test('a live secret key disables billing entirely rather than taking money', async () => {
  const billing = freshBilling({ ...CONFIGURED, STRIPE_SECRET_KEY: 'sk_live_real_key' });
  assert.strictEqual(billing.isBillingConfigured(), false);

  // Inert, not throwing: no checkout, no webhook processing, no charges.
  const res = fakeRes();
  await billing.handleWebhook({ headers: {}, body: Buffer.from('{}') }, res);
  assert.strictEqual(res.statusCode, 503);
});

test('a live key is accepted once live mode is deliberately switched on', () => {
  const billing = freshBilling({
    ...CONFIGURED, STRIPE_SECRET_KEY: 'sk_live_real_key', STRIPE_ALLOW_LIVE_MODE: 'true',
  });
  assert.strictEqual(billing.isBillingConfigured(), true);
});

test('publishing falls open when billing is switched off', async () => {
  // Turning Stripe off must never strand a family that could publish yesterday.
  const billing = freshBilling();
  assert.deepStrictEqual(await billing.assertCanPublish(1, {}), { allowed: true });
});

// ── Shared-sandbox isolation ─────────────────────────────────────────────────
//
// The Stripe sandbox is shared with another product (LYNQ). Every webhook
// destination in a sandbox receives every event type it subscribes to, so
// CodeIt's endpoint sees the neighbouring app's subscription events too. Both
// apps put their own user id in client_reference_id, so without a discriminator
// a neighbouring checkout for "user 7" would grant CodeIt Plus to CodeIt's
// user 7. The price id is the discriminator.

const OUR_PRICE = CONFIGURED.STRIPE_PRICE_ID;

function stubStore() {
  const store = require('./billingStore');
  const writes = [];
  store.upsertSubscription = async (userId, fields) => { writes.push({ userId, fields }); };
  store.getSubscriptionByCustomerId = async () => null;
  store.claimWebhookEvent = async () => true;
  return writes;
}

function subscriptionEvent(priceId, { type = 'customer.subscription.updated', userId = '7' } = {}) {
  return {
    id: `evt_${priceId}_${userId}`,
    type,
    data: {
      object: {
        id: 'sub_neighbour',
        customer: 'cus_neighbour',
        status: 'active',
        client_reference_id: userId,
        items: { data: [{ price: { id: priceId } }] },
      },
    },
  };
}

test('a subscription to our own price is applied', async () => {
  const writes = stubStore();
  const billing = freshBilling(CONFIGURED);
  await billing.applyEvent(subscriptionEvent(OUR_PRICE));
  assert.strictEqual(writes.length, 1);
  assert.strictEqual(writes[0].userId, 7);
});

test("a neighbouring app's subscription never grants CodeIt access", async () => {
  const writes = stubStore();
  const billing = freshBilling(CONFIGURED);
  // Same shape, same client_reference_id — only the price differs.
  await billing.applyEvent(subscriptionEvent('price_lynq_something_else'));
  assert.strictEqual(writes.length, 0, 'nothing was written for another product');
});

test('a cancellation for another product does not revoke our access', async () => {
  const writes = stubStore();
  const billing = freshBilling(CONFIGURED);
  await billing.applyEvent(
    subscriptionEvent('price_lynq_something_else', { type: 'customer.subscription.deleted' })
  );
  assert.strictEqual(writes.length, 0);
});

test('an unconfigured price id matches nothing rather than everything', async () => {
  const billing = freshBilling({ ...CONFIGURED, STRIPE_PRICE_ID: '' });
  assert.strictEqual(billing.belongsToCodeIt({ priceId: 'price_anything' }), false);
  assert.strictEqual(billing.belongsToCodeIt({ priceId: undefined }), false);
  assert.strictEqual(billing.belongsToCodeIt(null), false);
});
