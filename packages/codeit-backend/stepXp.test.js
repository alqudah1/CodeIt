'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_STEP_XP,
  MAX_STEP_INDEX,
  MAX_STEP_XP,
  MIN_STEP_XP,
  clampStepXp,
  isValidStepIndex,
} = require('./stepXp');

test('a normal step keeps the amount it asked for', () => {
  assert.equal(clampStepXp(5), 5);
  assert.equal(clampStepXp(10), 10);
  assert.equal(clampStepXp(15), 15);
  assert.equal(clampStepXp(20), 20);
});

test('a forged amount is cut down to what a step is really worth', () => {
  // The whole point: a hand-crafted request cannot mint XP.
  assert.equal(clampStepXp(999999), MAX_STEP_XP);
  assert.equal(clampStepXp(21), MAX_STEP_XP);
});

test('a negative or tiny amount cannot drain XP or pay nothing', () => {
  assert.equal(clampStepXp(-500), MIN_STEP_XP);
  assert.equal(clampStepXp(0), MIN_STEP_XP);
});

test('nonsense falls back to the default rather than to NaN', () => {
  assert.equal(clampStepXp(undefined), DEFAULT_STEP_XP);
  assert.equal(clampStepXp(null), DEFAULT_STEP_XP);
  assert.equal(clampStepXp(''), DEFAULT_STEP_XP);
  assert.equal(clampStepXp('twenty'), DEFAULT_STEP_XP);
  assert.equal(clampStepXp({}), DEFAULT_STEP_XP);
  assert.equal(clampStepXp(Infinity), DEFAULT_STEP_XP);
});

test('fractions are rounded, not stored as decimals', () => {
  assert.equal(clampStepXp(10.4), 10);
  assert.equal(clampStepXp(10.6), 11);
});

test('real step indexes are accepted', () => {
  assert.equal(isValidStepIndex(0), true);
  assert.equal(isValidStepIndex(7), true);
  assert.equal(isValidStepIndex(MAX_STEP_INDEX), true);
});

test('an index outside a real lesson is rejected', () => {
  // Otherwise a script could claim step 1..100000 of lesson 1 and be paid for
  // each one, since every index is a distinct row.
  assert.equal(isValidStepIndex(MAX_STEP_INDEX + 1), false);
  assert.equal(isValidStepIndex(-1), false);
  assert.equal(isValidStepIndex(1.5), false);
  assert.equal(isValidStepIndex(null), false);
  assert.equal(isValidStepIndex(undefined), false);
  assert.equal(isValidStepIndex(''), false);
  assert.equal(isValidStepIndex('abc'), false);
});

test('a whole number sent as a string is still a step index', () => {
  // A JSON client may send 3 or "3"; both mean step three.
  assert.equal(isValidStepIndex('3'), true);
});

test('the most a lesson can ever pay is bounded by its step count', () => {
  // 41 possible indexes at 20 XP each is the ceiling for a single lesson, no
  // matter how many requests are sent.
  const ceiling = (MAX_STEP_INDEX + 1) * MAX_STEP_XP;
  assert.equal(ceiling, 820);
});

// ── Where a lesson was left ──────────────────────────────────────────────────
const { stepsDoneFor } = require('./stepXp');

test('the steps a learner has passed come back lowest first, each once', async () => {
  const asked = [];
  const query = async (sql, values) => { asked.push({ sql, values }); return [[{ step_index: 0 }, { step_index: '2' }, { step_index: 2 }, { step_index: 5 }]]; };
  assert.deepEqual(await stepsDoneFor(query, 7, '4'), [0, 2, 5]);
  assert.deepEqual(asked[0].values, [7, 4]);
  assert.match(asked[0].sql, /user_id = \? AND lesson_id = \?/);
});

test('a row that is not a step index is left out', async () => {
  const query = async () => [[{ step_index: -1 }, { step_index: 999 }, { step_index: null }, { step_index: 3 }]];
  assert.deepEqual(await stepsDoneFor(query, 7, 4), [3]);
});

test('something that is not a lesson is not asked about', async () => {
  let asked = 0;
  const query = async () => { asked += 1; return [[]]; };
  assert.deepEqual(await stepsDoneFor(query, 7, 'abc'), []);
  assert.deepEqual(await stepsDoneFor(query, 7, 0), []);
  assert.equal(asked, 0);
});
