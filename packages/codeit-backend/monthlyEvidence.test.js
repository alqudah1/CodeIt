'use strict';

// The module under test pulls in db.js, whose config insists on real-looking
// secrets. These are test values, present before any require.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-value-at-least-32-chars-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:x@localhost:5432/test';

const test = require('node:test');
const assert = require('node:assert');
const { composeMonthlyEmail, hasAnythingToSay, periodOf } = require('./monthlyEvidence');

const FULL_MONTH = {
  lessons: [{ id: 4, title: 'Making Decisions with If Statements' }],
  projects: [{ title: 'Star Catcher', type: 'game' }],
  understood: [{ projectTitle: 'Star Catcher', skills: ['Worked out how many times a loop repeats'] }],
};

test('the subject is the promise on the pricing page, with a real name and month', () => {
  const email = composeMonthlyEmail({ studentName: 'Maya', month: FULL_MONTH, unsubscribeToken: 't', now: new Date('2026-08-15T00:00:00Z') });
  assert.equal(email.subject, 'What Maya built in August on CodeIt');
});

test('what the child explained comes first, and only server sentences appear', () => {
  const email = composeMonthlyEmail({ studentName: 'Maya', month: FULL_MONTH, unsubscribeToken: 't' });
  assert.ok(email.html.indexOf('What Maya explained') < email.html.indexOf('Lessons finished'));
  assert.match(email.html, /Worked out how many times a loop repeats/);
});

test('a section with nothing to say is omitted, not padded', () => {
  const email = composeMonthlyEmail({
    studentName: 'Maya',
    month: { lessons: [], projects: [{ title: 'Maze', type: 'game' }], understood: [] },
    unsubscribeToken: 't',
  });
  assert.doesNotMatch(email.html, /Lessons finished/);
  assert.doesNotMatch(email.html, /explained/i);
  assert.match(email.html, /Projects made/);
});

test('a month with nothing at all is not worth an email', () => {
  assert.equal(hasAnythingToSay({ lessons: [], projects: [], understood: [] }), false);
  assert.equal(hasAnythingToSay(FULL_MONTH), true);
});

test('no score, percentage, streak or minutes anywhere', () => {
  const email = composeMonthlyEmail({ studentName: 'Maya', month: FULL_MONTH, unsubscribeToken: 't' });
  assert.doesNotMatch(email.html, /%|\bscore\b|\bstreak\b|\bminutes\b|\bpoints\b/i);
});

test('a hostile title cannot inject markup', () => {
  const email = composeMonthlyEmail({
    studentName: '<img src=x>',
    month: { lessons: [], projects: [{ title: '<script>alert(1)</script>', type: 'game' }], understood: [] },
    unsubscribeToken: 't',
  });
  assert.doesNotMatch(email.html, /<script>|<img src=x>/);
});

test('every email carries the unsubscribe link', () => {
  const email = composeMonthlyEmail({ studentName: 'Maya', month: FULL_MONTH, unsubscribeToken: 'tok123' });
  assert.match(email.html, /unsubscribe\/tok123/);
  assert.match(email.text, /unsubscribe\/tok123/);
});

test('periodOf is stable per calendar month', () => {
  assert.equal(periodOf(new Date('2026-08-01T00:00:00Z')), '2026-08');
  assert.equal(periodOf(new Date('2026-08-31T23:59:59Z')), '2026-08');
});
