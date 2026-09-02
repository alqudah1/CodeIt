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
