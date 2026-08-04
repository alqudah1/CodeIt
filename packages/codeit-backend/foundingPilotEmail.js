'use strict';

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://codeitlearn.com').replace(/\/+$/, '');

function familyEmailFrom() {
  const configured = process.env.EMAIL_FROM || 'CodeIt <progress@codeitlearn.com>';
  const address = configured.match(/<([^>]+)>/)?.[1] || configured;
  return `CodeIt Family <${address}>`;
}

async function sendFoundingPilotConfirmation(email) {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, status: 'not_configured' };
  }

  const familyAccountUrl = `${SITE_URL}/register?for=family`;
  const builderUrl = `${SITE_URL}/builder`;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: familyEmailFrom(),
        to: [email],
        subject: 'Your CodeIt family pilot request',
        text: `Thanks for requesting a CodeIt family pilot spot. There is no charge or subscription. Start by creating an adult family account at ${familyAccountUrl}, or try a free project at ${builderUrl}. Reply to hello@codeitlearn.com if you want to tell us the learner age range and what they hope to build. You can opt out of pilot updates at any time.`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#3d302b">
            <div style="font-size:24px;font-weight:800;color:#f87824">CodeIt</div>
            <h1 style="font-size:24px">Your family pilot request is saved</h1>
            <p>Thanks for asking to try CodeIt with your family. There is no charge, card, trial, or subscription.</p>
            <p><strong>You can start now:</strong></p>
            <ol style="line-height:1.65">
              <li>Create an adult family account and confirm the adult email.</li>
              <li>Create a private learner profile for ages 5–12, or use an independent learner account for ages 13+.</li>
              <li>Build a first website, game, or quiz together.</li>
            </ol>
            <p><a href="${familyAccountUrl}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#f87824;color:white;text-decoration:none;font-weight:700">Create a family account</a></p>
            <p><a href="${builderUrl}">Or try a free project first</a></p>
            <p>Reply to <a href="mailto:hello@codeitlearn.com">hello@codeitlearn.com</a> if you want to share the learner age range and what they hope to build. That helps us prepare the pilot.</p>
            <p style="font-size:12px;color:#72594d">You asked for CodeIt Founding Family pilot updates. You can opt out at any time by replying “stop” or emailing hello@codeitlearn.com.</p>
          </div>`,
      }),
    });

    if (!response.ok) {
      return { sent: false, status: `resend_${response.status}` };
    }
    return { sent: true, status: 'sent' };
  } catch (error) {
    console.error('Founding family confirmation email failed:', error.message);
    return { sent: false, status: 'failed' };
  }
}

module.exports = { familyEmailFrom, sendFoundingPilotConfirmation };
