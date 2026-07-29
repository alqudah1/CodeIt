'use strict';

const { ageOnDate } = require('./studentAge');

const FAMILY_NOTICE_VERSION = '2026-07-28';
const MIN_MANAGED_AGE = 8;
const MAX_MANAGED_AGE = 12;

function normalizeUsername(value) {
  return String(value || '').trim();
}

function validUsername(value) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(normalizeUsername(value));
}

function validManagedPassword(value) {
  return typeof value === 'string' && value.length >= 10 && value.length <= 128;
}

function managedChildEligibility(dob, now = new Date()) {
  const age = ageOnDate(dob, now);
  if (age === null) return { allowed: false, reason: 'invalid', age: null };
  if (age < MIN_MANAGED_AGE) return { allowed: false, reason: 'too_young', age };
  if (age > MAX_MANAGED_AGE) return { allowed: false, reason: 'independent_account', age };
  return { allowed: true, reason: 'managed', age };
}

function validateManagedChildInput(input = {}, now = new Date()) {
  const username = normalizeUsername(input.username);
  const relationship = String(input.relationship || '').trim().toLowerCase();
  const eligibility = managedChildEligibility(input.dob, now);

  if (!validUsername(username)) {
    return { ok: false, field: 'username', error: 'Use 3–20 letters, numbers, or underscores.' };
  }
  if (!validManagedPassword(input.password)) {
    return { ok: false, field: 'password', error: 'Use at least 10 characters.' };
  }
  if (!eligibility.allowed) {
    const error = eligibility.reason === 'too_young'
      ? 'Managed profiles currently begin at age 8.'
      : eligibility.reason === 'independent_account'
        ? 'Learners 13–18 can create their own student account.'
        : 'Enter a valid birthday.';
    return { ok: false, field: 'dob', error };
  }
  if (!['parent', 'guardian'].includes(relationship)) {
    return { ok: false, field: 'relationship', error: 'Choose parent or guardian.' };
  }
  if (input.consent !== true || input.noticeVersion !== FAMILY_NOTICE_VERSION) {
    return {
      ok: false,
      field: 'consent',
      error: 'Review and accept the current family privacy notice.',
    };
  }

  return {
    ok: true,
    value: {
      username,
      password: input.password,
      dob: input.dob,
      relationship,
      noticeVersion: FAMILY_NOTICE_VERSION,
      age: eligibility.age,
      progressEmails: input.progressEmails === true,
    },
  };
}

module.exports = {
  FAMILY_NOTICE_VERSION,
  MAX_MANAGED_AGE,
  MIN_MANAGED_AGE,
  managedChildEligibility,
  normalizeUsername,
  validManagedPassword,
  validUsername,
  validateManagedChildInput,
};
