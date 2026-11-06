'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EVENT_LABELS, milestoneEmail } = require('./progressEmail');

test('describes every generated format as a project rather than a website', () => {
  assert.equal(EVENT_LABELS.project_created, 'Project created');
  assert.equal(EVENT_LABELS.project_published, 'Project published');

  const email = milestoneEmail({
    studentName: 'creative_coder',
    eventType: 'project_created',
    title: 'Space quiz',
    detail: 'quiz project created',
    targetUrl: null,
    unsubscribeToken: 'safe-token',
  });

  assert.equal(email.subject, 'CodeIt progress: creative_coder, Project created');
  assert.match(email.text, /Space quiz/);
  assert.match(email.html, /quiz project created/);
  assert.doesNotMatch(email.subject, /Website created/);
});

test('escapes student-controlled milestone content and strips header newlines', () => {
  const email = milestoneEmail({
    studentName: 'coder\nBcc: outsider@example.com',
    eventType: 'project_created',
    title: '<script>bad()</script>',
    detail: '<b>unsafe</b>',
    targetUrl: 'https://codeitlearn.com/project/example',
    unsubscribeToken: 'safe-token',
  });

  assert.doesNotMatch(email.subject, /\n/);
  assert.match(email.html, /&lt;script&gt;bad\(\)&lt;\/script&gt;/);
  assert.match(email.html, /&lt;b&gt;unsafe&lt;\/b&gt;/);
  assert.doesNotMatch(email.html, /<script>bad\(\)<\/script>/);
});

test('the limit email is for the grown-up: what happened, what Plus gives, one button', () => {
  assert.equal(EVENT_LABELS.ai_limit_reached, 'Free studio builds used up');
  const email = milestoneEmail({
    studentName: 'Sam',
    eventType: 'ai_limit_reached',
    title: 'used all 10 free studio builds this month',
    detail: '10 games asked for in the studio since the 1st, which is the free plan\'s monthly allowance.',
    targetUrl: 'https://codeitlearn.com/pricing?utm_source=limit-email#codeit-plus',
    unsubscribeToken: 'tok',
  });
  assert.equal(email.subject, 'Sam used every free studio build this month');
  assert.match(email.html, /Sam used all 10 free studio builds this month/);
  assert.match(email.html, /CA\$12 a month plus tax, cancel any time/);
  assert.match(email.html, /href="https:\/\/codeitlearn\.com\/pricing\?utm_source=limit-email#codeit-plus"/);
  assert.match(email.html, /See CodeIt Plus/);
  assert.match(email.html, /unsubscribe\/tok/);
  assert.doesNotMatch(email.html, /—/);
  assert.doesNotMatch(email.text, /—/);
});
