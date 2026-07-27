'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { escapeHtml, isValidEmail, normalizeEmail } = require('./progressNotificationUtils');

test('normalizes and validates parent email addresses', () => {
  assert.equal(normalizeEmail(' Parent@Example.COM '), 'parent@example.com');
  assert.equal(isValidEmail('parent@example.com'), true);
  assert.equal(isValidEmail('not-an-email'), false);
});

test('escapes student-controlled content in email HTML', () => {
  assert.equal(
    escapeHtml('<img src=x onerror="bad()">'),
    '&lt;img src=x onerror=&quot;bad()&quot;&gt;'
  );
});
