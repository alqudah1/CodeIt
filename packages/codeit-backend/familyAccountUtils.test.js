'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  FAMILY_NOTICE_VERSION,
  managedChildEligibility,
  validateManagedChildInput,
} = require('./familyAccountUtils');

const TODAY = new Date('2026-07-28T12:00:00Z');

test('accepts only managed learners ages 5 through 12', () => {
  assert.deepEqual(managedChildEligibility('2021-07-28', TODAY), { allowed: true, reason: 'managed', age: 5 });
  assert.deepEqual(managedChildEligibility('2018-07-28', TODAY), { allowed: true, reason: 'managed', age: 8 });
  assert.deepEqual(managedChildEligibility('2013-07-29', TODAY), { allowed: true, reason: 'managed', age: 12 });
  assert.deepEqual(managedChildEligibility('2022-07-29', TODAY), { allowed: false, reason: 'too_young', age: 3 });
  assert.deepEqual(managedChildEligibility('2013-07-28', TODAY), { allowed: false, reason: 'independent_account', age: 13 });
});

test('requires a strong password, adult relationship, and current explicit notice', () => {
  const base = {
    username: 'young_coder',
    password: 'a-long-password',
    dob: '2016-04-20',
    relationship: 'parent',
    consent: true,
    noticeVersion: FAMILY_NOTICE_VERSION,
    progressEmails: true,
  };
  assert.equal(validateManagedChildInput(base, TODAY).value.progressEmails, true);
  assert.equal(validateManagedChildInput({ ...base, password: 'short' }, TODAY).field, 'password');
  assert.equal(validateManagedChildInput({ ...base, relationship: 'teacher' }, TODAY).field, 'relationship');
  assert.equal(validateManagedChildInput({ ...base, consent: false }, TODAY).field, 'consent');
  assert.equal(validateManagedChildInput({ ...base, noticeVersion: 'old' }, TODAY).field, 'consent');
});
