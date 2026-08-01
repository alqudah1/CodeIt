'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { familyEmailFrom, sendFoundingPilotConfirmation } = require('./foundingPilotEmail');

test('sends an immediate, accurately branded family pilot confirmation', async () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.EMAIL_FROM;
  const previousFetch = global.fetch;
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'CodeIt Progress <progress@codeitlearn.com>';
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200 };
  };

  try {
    const result = await sendFoundingPilotConfirmation('parent@example.com');
    const body = JSON.parse(request.options.body);
    assert.deepEqual(result, { sent: true, status: 'sent' });
    assert.equal(request.url, 'https://api.resend.com/emails');
    assert.equal(body.from, 'CodeIt Family <progress@codeitlearn.com>');
    assert.deepEqual(body.to, ['parent@example.com']);
    assert.equal(body.subject, 'Your CodeIt family pilot request');
    assert.match(body.html, /Create a family account/);
    assert.match(body.html, /no charge, card, trial, or subscription/i);
    assert.match(body.html, /opt out at any time/i);
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = previousFrom;
    global.fetch = previousFetch;
  }
});

test('does not claim delivery when email is not configured', async () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFetch = global.fetch;
  delete process.env.RESEND_API_KEY;
  global.fetch = () => { throw new Error('fetch should not run'); };
  try {
    assert.deepEqual(
      await sendFoundingPilotConfirmation('parent@example.com'),
      { sent: false, status: 'not_configured' }
    );
    assert.match(familyEmailFrom(), /^CodeIt Family </);
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    global.fetch = previousFetch;
  }
});
