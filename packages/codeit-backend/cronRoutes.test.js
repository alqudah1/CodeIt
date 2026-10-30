'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const fs = require('fs');
const path = require('path');

// ── The weekly email goes out without anyone pressing a button ──────────────
//
// Runs the real cron route with a fake sender, and checks the one thing that
// matters about a URL that can email every family: nobody but Vercel, with
// the project's secret, can call it.

const calls = [];
const senderPath = require.resolve('./digestSender');
require.cache[senderPath] = {
  id: senderPath, filename: senderPath, loaded: true,
  exports: {
    sendWeeklyDigests: async (opts) => { calls.push(['weekly', opts]); return { period: '26W44', eligible: 3, sent: 2, skippedAlreadySent: 1, skippedNothingToSay: 0, failed: 0, notConfigured: 0 }; },
    sendMonthlyDigests: async (opts) => { calls.push(['monthly', opts]); return { period: '2026-10', eligible: 3, sent: 3 }; },
  },
};
const router = require('./routes/cron');

let server;
let base;
test.before(async () => {
  const app = express();
  app.use('/api/cron', router);
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server && server.close());
test.beforeEach(() => { calls.length = 0; delete process.env.CRON_SECRET; });

const call = (p, headers = {}) => fetch(`${base}${p}`, { headers });

test('with no secret on the project, nothing runs and the answer says why', async () => {
  const res = await call('/api/cron/weekly-digest');
  assert.equal(res.status, 503);
  assert.match((await res.json()).error, /CRON_SECRET is not set/);
  assert.deepEqual(calls, []);
});

test('a short secret is no secret', async () => {
  process.env.CRON_SECRET = 'short';
  const res = await call('/api/cron/weekly-digest', { Authorization: 'Bearer short' });
  assert.equal(res.status, 503);
  assert.deepEqual(calls, []);
});

test('the wrong bearer, or none, is refused', async () => {
  process.env.CRON_SECRET = 'a-long-enough-secret-value';
  assert.equal((await call('/api/cron/weekly-digest')).status, 401);
  assert.equal((await call('/api/cron/weekly-digest', { Authorization: 'Bearer a-long-enough-secret-valu' })).status, 401);
  assert.equal((await call('/api/cron/monthly-digest', { Authorization: 'a-long-enough-secret-value' })).status, 401);
  assert.deepEqual(calls, []);
});

test('the right bearer sends the weekly email and reports what happened', async () => {
  process.env.CRON_SECRET = 'a-long-enough-secret-value';
  const res = await call('/api/cron/weekly-digest', { Authorization: 'Bearer a-long-enough-secret-value' });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.sent, 2);
  assert.deepEqual(calls, [['weekly', { dryRun: false }]]);
});

test('?dry=1 counts without sending, and the monthly route is its own', async () => {
  process.env.CRON_SECRET = 'a-long-enough-secret-value';
  const res = await call('/api/cron/monthly-digest?dry=1', { Authorization: 'Bearer a-long-enough-secret-value' });
  assert.equal(res.status, 200);
  assert.deepEqual(calls, [['monthly', { dryRun: true }]]);
});

test('vercel.json schedules both, once a week and once a month, on these paths', () => {
  const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../vercel.json'), 'utf8'));
  const crons = Object.fromEntries((config.crons || []).map((c) => [c.path, c.schedule]));
  assert.equal(crons['/api/cron/weekly-digest'], '0 18 * * 0', 'Sunday 18:00 UTC');
  assert.equal(crons['/api/cron/monthly-digest'], '0 16 28 * *', 'the 28th, 16:00 UTC');
  // Hobby plans refuse anything more often than daily, and Vercel does not
  // accept names like SUN or a day-of-month together with a day-of-week.
  for (const schedule of Object.values(crons)) {
    const [minute, hour, dom, , dow] = schedule.split(' ');
    assert.match(minute, /^\d+$/); assert.match(hour, /^\d+$/);
    assert.ok(dom === '*' || dow === '*', 'not both day of month and day of week');
    assert.doesNotMatch(schedule, /[A-Za-z]/);
  }
  // The app mounts the route the schedule names.
  const app = fs.readFileSync(path.join(__dirname, 'test-quiz.js'), 'utf8');
  assert.match(app, /app\.use\('\/api\/cron', require\('\.\/routes\/cron'\)\)/);
});
