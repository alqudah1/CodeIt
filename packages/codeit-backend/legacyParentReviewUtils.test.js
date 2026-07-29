'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  maskEmail,
  validEmail,
  validLegacyConsent,
} = require('./legacyParentReviewUtils');

test('accepts a parent email without exposing it back to the learner', () => {
  assert.equal(validEmail('parent@example.com'), true);
  assert.equal(validEmail('not-an-email'), false);
  assert.equal(maskEmail('parent@example.com'), 'p*****@example.com');
});

test('requires an adult relationship and explicit current notice consent', () => {
  const version = '2026-07-28';
  assert.equal(validLegacyConsent({
    relationship: 'parent',
    consent: true,
    noticeVersion: version,
  }, version), true);
  assert.equal(validLegacyConsent({
    relationship: 'sibling',
    consent: true,
    noticeVersion: version,
  }, version), false);
  assert.equal(validLegacyConsent({
    relationship: 'guardian',
    consent: false,
    noticeVersion: version,
  }, version), false);
});
