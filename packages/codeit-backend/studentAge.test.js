'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ageOnDate, parseDateOnly, studentAgeEligibility } = require('./studentAge');

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

test('requires a parent-managed flow below 13 and an adult account above 18', () => {
  assert.deepEqual(studentAgeEligibility('2014-01-01', TODAY), { allowed: false, reason: 'parent_required', age: 12 });
  assert.deepEqual(studentAgeEligibility('2010-01-01', TODAY), { allowed: true, reason: 'eligible', age: 16 });
  assert.deepEqual(studentAgeEligibility('2000-01-01', TODAY), { allowed: false, reason: 'adult_account', age: 26 });
  assert.deepEqual(studentAgeEligibility('not-a-date', TODAY), { allowed: false, reason: 'invalid', age: null });
});
