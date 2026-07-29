'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { ACTIVE_USER_DEFINITION, normalizeUserId } = require('./userActivityDefinitions');

test('accepts only positive integer user identifiers', () => {
  assert.equal(normalizeUserId(12), 12);
  assert.equal(normalizeUserId('12'), 12);
  assert.equal(normalizeUserId(0), null);
  assert.equal(normalizeUserId(-4), null);
  assert.equal(normalizeUserId('student@example.com'), null);
  assert.equal(normalizeUserId(3.2), null);
});

test('defines active users as signed-in product use', () => {
  assert.match(ACTIVE_USER_DEFINITION, /signed-in account/i);
  assert.match(ACTIVE_USER_DEFINITION, /opened or used CodeIt/i);
});
