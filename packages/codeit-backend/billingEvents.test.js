'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  customerIdFromEvent,
  isHandledEvent,
  subscriptionFields,
  unixToIso,
  userIdFromEvent,
} = require('./billingEvents');

const PERIOD_END_UNIX = 1789776000; // 2026-09-19T00:00:00Z

test('only access-changing events are handled', () => {
  assert.strictEqual(isHandledEvent('checkout.session.completed'), true);
  assert.strictEqual(isHandledEvent('customer.subscription.deleted'), true);
  assert.strictEqual(isHandledEvent('invoice.payment_failed'), true);
  assert.strictEqual(isHandledEvent('charge.succeeded'), false);
  assert.strictEqual(isHandledEvent('payment_intent.created'), false);
  assert.strictEqual(isHandledEvent(undefined), false);
});

test('unix timestamps become ISO strings, and rubbish becomes null', () => {
  assert.strictEqual(unixToIso(PERIOD_END_UNIX), '2026-09-19T00:00:00.000Z');
  assert.strictEqual(unixToIso(0), null);
  assert.strictEqual(unixToIso(-1), null);
  assert.strictEqual(unixToIso('not a number'), null);
  assert.strictEqual(unixToIso(null), null);
  assert.strictEqual(unixToIso(undefined), null);
});

test('a standard subscription payload maps to our columns', () => {
  const fields = subscriptionFields({
    id: 'sub_123',
    customer: 'cus_456',
    status: 'active',
    current_period_end: PERIOD_END_UNIX,
    cancel_at_period_end: false,
    items: { data: [{ price: { id: 'price_789' } }] },
  });

  assert.deepStrictEqual(fields, {
    stripeSubscriptionId: 'sub_123',
    stripeCustomerId: 'cus_456',
    priceId: 'price_789',
    status: 'active',
    currentPeriodEnd: '2026-09-19T00:00:00.000Z',
    cancelAtPeriodEnd: false,
  });
});

test('an expanded customer object is accepted as well as a bare id', () => {
  const fields = subscriptionFields({
    id: 'sub_123',
    customer: { id: 'cus_456', email: 'parent@example.com' },
    status: 'active',
    items: { data: [{ price: { id: 'price_789' } }] },
  });
  assert.strictEqual(fields.stripeCustomerId, 'cus_456');
});

test('the period is read from the item when the subscription omits it', () => {
  // Newer Stripe API versions moved current_period_end onto the item.
  const fields = subscriptionFields({
    id: 'sub_123',
    customer: 'cus_456',
    status: 'active',
    items: { data: [{ price: { id: 'price_789' }, current_period_end: PERIOD_END_UNIX }] },
  });
  assert.strictEqual(fields.currentPeriodEnd, '2026-09-19T00:00:00.000Z');
});

test('cancel_at_period_end survives the mapping', () => {
  const fields = subscriptionFields({
    id: 'sub_1', customer: 'cus_1', status: 'active', cancel_at_period_end: true, items: { data: [] },
  });
  assert.strictEqual(fields.cancelAtPeriodEnd, true);
});

test('an unusable payload returns null instead of throwing', () => {
  // Throwing would make Stripe retry the same broken event indefinitely.
  assert.strictEqual(subscriptionFields(null), null);
  assert.strictEqual(subscriptionFields(undefined), null);
  assert.strictEqual(subscriptionFields('sub_123'), null);
  assert.strictEqual(subscriptionFields({ id: 'sub_1' }), null, 'no status');
  assert.strictEqual(subscriptionFields({ status: 'active' }), null, 'no id');
});

test('a subscription with no items still maps', () => {
  const fields = subscriptionFields({ id: 'sub_1', customer: 'cus_1', status: 'canceled' });
  assert.strictEqual(fields.status, 'canceled');
  assert.strictEqual(fields.priceId, null);
  assert.strictEqual(fields.currentPeriodEnd, null);
});

test('the CodeIt user id is read from checkout', () => {
  assert.strictEqual(
    userIdFromEvent({ data: { object: { client_reference_id: '42' } } }), 42
  );
  assert.strictEqual(
    userIdFromEvent({ data: { object: { metadata: { codeit_user_id: '7' } } } }), 7
  );
});

test('a missing, forged or nonsense user id is rejected', () => {
  assert.strictEqual(userIdFromEvent({ data: { object: {} } }), null);
  assert.strictEqual(userIdFromEvent({}), null);
  assert.strictEqual(userIdFromEvent(null), null);
  assert.strictEqual(userIdFromEvent({ data: { object: { client_reference_id: 'admin' } } }), null);
  assert.strictEqual(userIdFromEvent({ data: { object: { client_reference_id: '0' } } }), null);
  assert.strictEqual(userIdFromEvent({ data: { object: { client_reference_id: '-3' } } }), null);
  assert.strictEqual(userIdFromEvent({ data: { object: { client_reference_id: '1.5' } } }), null);
});

test('the customer id is extracted for events that carry no user id', () => {
  assert.strictEqual(customerIdFromEvent({ data: { object: { customer: 'cus_9' } } }), 'cus_9');
  assert.strictEqual(customerIdFromEvent({ data: { object: { customer: { id: 'cus_9' } } } }), 'cus_9');
  assert.strictEqual(customerIdFromEvent({ data: { object: {} } }), null);
  assert.strictEqual(customerIdFromEvent(null), null);
});
