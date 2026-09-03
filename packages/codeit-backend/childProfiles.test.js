'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { PLANS, planForSubscription } = require('./entitlements');

// ── The learner-profile limit that nothing enforced ──────────────────────────
//
// PLANS has carried maxChildProfiles since billing shipped and not one line of
// code had ever read it. A free account could add learner profiles without end.
// That is the paid plan's headline feature given away, and worse, a family
// could cross a line the pricing page draws without ever being told the line
// existed.
//
// These tests are mostly about the two ways this guard goes wrong quietly.
// Comments are stripped before scanning. The first version of this file failed
// on the comment inside familyAccounts.js that quotes the bad comparison it is
// warning about, which is the same class of mistake as a guard asserting the
// presence of the line it is meant to forbid.
const SOURCE = fs.readFileSync(path.join(__dirname, 'familyAccounts.js'), 'utf8')
  .split('\n')
  .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
  .join('\n');

test('the plans still carry a limit worth enforcing', () => {
  assert.strictEqual(PLANS.free.maxChildProfiles, 1);
  assert.strictEqual(PLANS.plus.maxChildProfiles, 4);
  assert.ok(PLANS.plus.maxChildProfiles > PLANS.free.maxChildProfiles);
});

test('createManagedChild reads the limit before it creates anything', () => {
  const start = SOURCE.indexOf('async function createManagedChild');
  const body = SOURCE.slice(start, SOURCE.indexOf('\nasync function', start + 10));
  assert.match(body, /maxChildProfiles/, 'the limit is never read');
  assert.match(body, /CHILD_LIMIT_REACHED/);
  // Before the INSERT, not after it.
  assert.ok(
    body.indexOf('maxChildProfiles') < body.indexOf('INSERT INTO parent_child_links'),
    'the limit must be checked before the child is created'
  );
});

// The one that would have shipped broken. node-postgres returns COUNT(*) as a
// string, so `'4' >= 4` in one dialect and `4 >= 4` in another are not the same
// comparison to reason about, and a guard written against a MySQL dev box
// enforces nothing in production.
test('the count is coerced to a number, whatever the driver returns', () => {
  assert.match(SOURCE, /Number\(raw\)/);
  const start = SOURCE.indexOf('async function countManagedChildren');
  const body = SOURCE.slice(start, start + 700);
  assert.match(body, /child_count/);
  assert.ok(!/rows\[0\]\.child_count\s*>=/.test(SOURCE), 'a raw driver value is compared directly');
});

// A family already over the number keeps every child they have. Enforcement
// stops the next one; it never takes one away.
test('nothing in the guard removes or disables an existing profile', () => {
  const start = SOURCE.indexOf('const plan = await currentPlan');
  const guard = SOURCE.slice(start, start + 900);
  assert.ok(!/DELETE|UPDATE|disable/i.test(guard), 'the guard touches existing rows');
});

// A billing fault must not stand between a parent and their own family.
test('an unreadable subscription does not block a parent', () => {
  const start = SOURCE.indexOf('async function currentPlan');
  const body = SOURCE.slice(start, start + 600);
  assert.match(body, /catch/);
  assert.match(body, /return null/);
  assert.match(SOURCE, /if \(plan && existing >= plan\.maxChildProfiles\)/);
});

test('the free and paid limits come from the plan, not from a number typed twice', () => {
  assert.ok(!/>= 4\b/.test(SOURCE.slice(SOURCE.indexOf('const plan = await currentPlan'), SOURCE.indexOf('const data = parsed.value'))));
  assert.strictEqual(planForSubscription(null).maxChildProfiles, PLANS.free.maxChildProfiles);
  assert.strictEqual(
    planForSubscription({ status: 'active', current_period_end: new Date(Date.now() + 8.64e7) }).maxChildProfiles,
    PLANS.plus.maxChildProfiles
  );
});
