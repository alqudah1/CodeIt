'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeFoundingLead } = require('./foundingWaitlistUtils');

test('normalizes a consented adult waitlist email', () => {
  assert.deepEqual(
    normalizeFoundingLead({
      email: ' Parent@Example.COM ',
      consent: true,
      source: 'homepage',
    }),
    { value: { email: 'parent@example.com', source: 'homepage' } }
  );
});

test('rejects missing adult consent and invalid email addresses', () => {
  assert.equal(normalizeFoundingLead({ email: 'parent@example.com' }).error, 'Adult consent is required.');
  assert.equal(normalizeFoundingLead({ email: 'not-an-email', consent: true }).error, 'Enter a valid email address.');
});

test('does not accept arbitrary source metadata', () => {
  assert.equal(
    normalizeFoundingLead({ email: 'parent@example.com', consent: true, source: 'private-campaign-name' }).value.source,
    'pricing'
  );
});
