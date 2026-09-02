'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ageOnDate, learningModeForAge, parseDateOnly, studentAgeEligibility } = require('./studentAge');

const TODAY = new Date('2026-07-21T12:00:00Z');

test('parses only real ISO calendar dates', () => {
  assert.deepEqual(parseDateOnly('2012-02-29'), { year: 2012, month: 2, day: 29 });
  assert.equal(parseDateOnly('2013-02-29'), null);
  assert.equal(parseDateOnly('07/21/2012'), null);
});

test('calculates age at the birthday boundary', () => {
  assert.equal(ageOnDate('2013-07-21', TODAY), 13);
  assert.equal(ageOnDate('2013-07-22', TODAY), 12);
  assert.equal(ageOnDate('2007-07-22', TODAY), 18);
});

test('requires a parent-managed flow below 13 and nothing above it', () => {
  assert.deepEqual(studentAgeEligibility('2014-01-01', TODAY), { allowed: false, reason: 'parent_required', age: 12 });
  assert.deepEqual(studentAgeEligibility('2010-01-01', TODAY), { allowed: true, reason: 'eligible', age: 16 });
  assert.deepEqual(studentAgeEligibility('not-a-date', TODAY), { allowed: false, reason: 'invalid', age: null });
});

// A 23-year-old told us he could not sign up to learn to code: the form offered
// a child account he was too old for and a parent account he had no child for.
// The under-13 rule is the law; there was never a reason for the upper one.
test('an adult may hold their own learner account', () => {
  assert.deepEqual(studentAgeEligibility('2000-01-01', TODAY), { allowed: true, reason: 'eligible', age: 26 });
  assert.deepEqual(studentAgeEligibility('2007-07-22', TODAY), { allowed: true, reason: 'eligible', age: 18 });
  assert.equal(studentAgeEligibility('1960-05-04', TODAY).allowed, true);
});

test('selects instructions that match the learner age', () => {
  assert.equal(learningModeForAge(5), 'early');
  assert.equal(learningModeForAge(7), 'early');
  assert.equal(learningModeForAge(8), 'guided');
  assert.equal(learningModeForAge(12), 'guided');
  assert.equal(learningModeForAge(13), 'independent');
  assert.equal(learningModeForAge(null), 'independent');
});
