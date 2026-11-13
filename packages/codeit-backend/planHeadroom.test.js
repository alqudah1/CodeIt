'use strict';

// Plus sells two things. This module answers whether anybody is near either
// wall, which is the question that decides whether a better upgrade offer is
// worth writing or whether there is nothing behind it to write about. If it
// counts wrong, the answer is wrong in the direction that feels reassuring,
// so each case below is one that would read as good news if it broke.

const test = require('node:test');
const assert = require('node:assert');
const { bucketize, headroomFrom } = require('./planHeadroom');
const { PLANS } = require('./entitlements');

test('the free limits come from the entitlements module, not from here', () => {
  const out = headroomFrom({});
  assert.strictEqual(out.aiBuilds.freeLimit, PLANS.free.monthlyAiBuilds);
  assert.strictEqual(out.children.freeLimit, PLANS.free.maxChildProfiles);
});

test('an account that built nothing is still an account', () => {
  // The tempting bug: count only accounts with a usage row, so "most families
  // build 3 a month" is measured on the families who built anything at all.
  const out = headroomFrom({ buildsThisMonth: [0, 0, 0, 4], bestMonthEver: [0, 0, 0, 4] });
  assert.strictEqual(out.aiBuilds.accounts, 4);
  assert.strictEqual(out.aiBuilds.thisMonth.find(b => b.label === 'none').count, 3);
});

test('reaching the limit and coming close are different answers', () => {
  const limit = PLANS.free.monthlyAiBuilds;
  const out = headroomFrom({ bestMonthEver: [limit, limit + 5, limit - 1, limit - 2, limit - 3, 0] });
  assert.strictEqual(out.aiBuilds.everReachedTheLimit, 2, 'at or over the limit');
  assert.strictEqual(out.aiBuilds.everCameClose, 2, 'within two of it, but not at it');
  assert.strictEqual(out.aiBuilds.mostInAnyMonth, limit + 5);
});

test('a quiet month does not erase a family that hit the wall earlier', () => {
  const out = headroomFrom({ buildsThisMonth: [0], bestMonthEver: [14] });
  assert.strictEqual(out.aiBuilds.mostThisMonth, 0);
  assert.strictEqual(out.aiBuilds.everReachedTheLimit, 1);
});

test('an adult at the free child limit is not counted as over it', () => {
  const out = headroomFrom({ childrenPerAdult: [0, 1, 1, 2, 4] });
  assert.strictEqual(out.children.atTheLimit, 2);
  assert.strictEqual(out.children.overTheLimit, 2);
  assert.strictEqual(out.children.most, 4);
});

test('every account lands in exactly one bucket', () => {
  const counts = [0, 1, 2, 3, 5, 6, 9, 10, 40];
  const out = headroomFrom({ buildsThisMonth: counts, childrenPerAdult: counts });
  const total = list => list.reduce((sum, b) => sum + b.count, 0);
  assert.strictEqual(total(out.aiBuilds.thisMonth), counts.length);
  assert.strictEqual(total(out.children.distribution), counts.length);
});

test('bucketize gives a value to the first bucket that takes it', () => {
  const out = bucketize([1, 1, 7], [['small', n => n < 5], ['rest', () => true]]);
  assert.deepStrictEqual(out, [{ label: 'small', count: 2 }, { label: 'rest', count: 1 }]);
});

test('nothing measured reads as nothing, not as a maximum', () => {
  const out = headroomFrom();
  assert.strictEqual(out.aiBuilds.mostInAnyMonth, 0);
  assert.strictEqual(out.children.most, 0);
  assert.strictEqual(out.aiBuilds.accounts, 0);
});
