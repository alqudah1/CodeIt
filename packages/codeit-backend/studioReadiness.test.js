'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { studioReadiness, studioReadinessMessage } = require('./studioReadiness');

test('a missing key is not ready, and says which key', () => {
  const r = studioReadiness({});
  assert.equal(r.ready, false);
  assert.deepEqual(r.missing, ['ANTHROPIC_API_KEY']);
});

test('an empty or whitespace key counts as missing', () => {
  assert.equal(studioReadiness({ ANTHROPIC_API_KEY: '' }).ready, false);
  assert.equal(studioReadiness({ ANTHROPIC_API_KEY: '   ' }).ready, false);
});

test('a key present means ready', () => {
  assert.equal(studioReadiness({ ANTHROPIC_API_KEY: 'sk-ant-whatever' }).ready, true);
});

test('the message never contains the value of the key', () => {
  const secret = 'sk-ant-do-not-print-me';
  const msg = studioReadinessMessage(studioReadiness({ ANTHROPIC_API_KEY: secret }));
  assert.ok(!msg.includes(secret));
  const msg2 = studioReadinessMessage(studioReadiness({}));
  assert.ok(!msg2.includes(secret));
});

test('the not-ready message says what a child will actually get', () => {
  const msg = studioReadinessMessage(studioReadiness({}));
  assert.match(msg, /canned starter/);
  assert.match(msg, /ANTHROPIC_API_KEY/);
});

// The fallback path this exists to detect must stay detectable. If the early
// return ever stops recording its reason, the admin funnel can no longer tell
// a missing key from a timeout, and this whole diagnosis becomes guesswork
// again.
test('the builder route still records which fallback reason it used', () => {
  const route = fs.readFileSync(path.join(__dirname, 'routes/builder.js'), 'utf8');
  assert.match(route, /fallbackReason = 'no-api-key'/);
  assert.match(route, /fallbackReason = 'error'/);
  assert.match(route, /generation_complete/);
});

test('email and the scheduled emails say which setting they wait for, and never its value', () => {
  const { familyReadiness } = require('./studioReadiness');
  assert.deepEqual(familyReadiness({}), {
    email: { ready: false, missing: ['RESEND_API_KEY'] },
    scheduledEmails: { ready: false, missing: ['CRON_SECRET', 'RESEND_API_KEY'] },
  });
  const ready = familyReadiness({ RESEND_API_KEY: 're_abc', CRON_SECRET: 'a-long-enough-secret-value' });
  assert.deepEqual(ready, { email: { ready: true, missing: [] }, scheduledEmails: { ready: true, missing: [] } });
  assert.doesNotMatch(JSON.stringify(ready), /re_abc|a-long-enough/);
  assert.equal(familyReadiness({ RESEND_API_KEY: 're_abc', CRON_SECRET: 'short' }).scheduledEmails.missing[0], 'CRON_SECRET');
  assert.equal(familyReadiness({ SMTP_HOST: 'smtp.example.test', CRON_SECRET: 'a-long-enough-secret-value' }).scheduledEmails.ready, true);
});
