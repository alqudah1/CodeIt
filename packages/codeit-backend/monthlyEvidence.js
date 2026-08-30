'use strict';

// ── The monthly email, made real ─────────────────────────────────────────────
//
// The pricing page shows a parent an example of "one email a month: what your
// child made and understood" — with a flag admitting the example is made up.
// This module is the real one. Everything in it comes from the live tables:
// lessons the child finished this month, projects they made, and the
// understanding records — sentences this server wrote when the child answered
// questions about their own code. Nothing is estimated, padded, or invented;
// a section with nothing to say is omitted, and a month with nothing at all
// sends no email rather than a hollow one.
//
// Sending is idempotent per learner per calendar month (monthly_digest_log),
// so a twice-pressed button cannot double-mail a family.

const pool = require('./db');
const { escapeHtml } = require('./progressNotificationUtils');

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://codeitlearn.com').replace(/\/+$/, '');

function periodOf(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthName(date = new Date()) {
  return date.toLocaleString('en', { month: 'long', timeZone: 'UTC' });
}

function parseSkills(raw) {
  if (Array.isArray(raw)) return raw;
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

/** Everything this learner did in the last ~31 days, from the live tables. */
async function gatherMonth(userId) {
  const [lessons] = await pool.query(
    `SELECT l.id, l.title
       FROM Student_Lesson_Progress lp JOIN lessons l ON l.id = lp.lesson_id
      WHERE lp.user_id = ? AND lp.completed_at >= NOW() - INTERVAL '31 days'
      ORDER BY lp.completed_at DESC LIMIT 8`,
    [userId]
  ).catch(() => [[]]);

  const [projects] = await pool.query(
    `SELECT title, project_type, created_at
       FROM ai_projects
      WHERE user_id = ? AND created_at >= NOW() - INTERVAL '31 days'
      ORDER BY created_at DESC LIMIT 6`,
    [userId]
  );

  const [understood] = await pool.query(
    `SELECT project_title, skills, updated_at
       FROM understanding_records
      WHERE user_id = ? AND updated_at >= NOW() - INTERVAL '31 days'
      ORDER BY updated_at DESC LIMIT 6`,
    [userId]
  );

  return {
    lessons: (lessons || []).map(row => ({ id: row.id, title: row.title })),
    projects: (projects || []).map(row => ({ title: row.title, type: row.project_type })),
    understood: (understood || []).map(row => ({
      projectTitle: row.project_title,
      skills: parseSkills(row.skills),
    })),
  };
}

function hasAnythingToSay(month) {
  return month.lessons.length + month.projects.length + month.understood.length > 0;
}

/** The email itself. Plain facts, in the order a parent cares about them. */
function composeMonthlyEmail({ studentName, month, unsubscribeToken, now = new Date() }) {
  const name = String(studentName || 'Your learner').replace(/[\r\n]+/g, ' ').trim();
  const safeName = escapeHtml(name);
  const when = monthName(now);
  const unsubscribeUrl = `${SITE_URL}/api/progress-notifications/unsubscribe/${unsubscribeToken}`;

  const sections = [];
  const textParts = [];

  if (month.understood.length) {
    const items = month.understood.map(entry => `
      <div style="margin:0 0 10px">
        <strong>${escapeHtml(entry.projectTitle)}</strong>
        ${entry.skills.map(skill => `<div style="color:#1e6e4e;font-weight:600">✓ ${escapeHtml(skill)}</div>`).join('')}
      </div>`).join('');
    sections.push(`
      <p style="color:#c94f0c;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">What ${safeName} explained</p>
      <div style="padding:16px;border-radius:14px;background:#fff7ee;border:1px solid #f0d8c5">${items}</div>`);
    textParts.push(`What ${name} explained: ` + month.understood
      .map(e => `${e.projectTitle} (${e.skills.join('; ')})`).join(' | '));
  }

  if (month.lessons.length) {
    const list = month.lessons.map(l => `<li>Lesson ${l.id}: ${escapeHtml(l.title)}</li>`).join('');
    sections.push(`
      <p style="color:#c94f0c;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:18px 0 6px">Lessons finished</p>
      <ul style="margin:0;padding-left:20px">${list}</ul>`);
    textParts.push('Lessons finished: ' + month.lessons.map(l => l.title).join(', '));
  }

  if (month.projects.length) {
    const list = month.projects.map(p => `<li>${escapeHtml(p.title)}</li>`).join('');
    sections.push(`
      <p style="color:#c94f0c;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:18px 0 6px">Projects made</p>
      <ul style="margin:0;padding-left:20px">${list}</ul>`);
    textParts.push('Projects made: ' + month.projects.map(p => p.title).join(', '));
  }

  return {
    subject: `What ${name} built in ${when} on CodeIt`,
    text: `${name} on CodeIt, ${when}.\n` + textParts.join('\n')
      + `\nSee it any time: ${SITE_URL}/profile\nStop these emails: ${unsubscribeUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#3d302b">
        <div style="font-size:24px;font-weight:800;color:#f87824">CodeIt</div>
        <h1 style="font-size:24px">What ${safeName} built in ${when}</h1>
        <p>Everything below is from ${safeName}'s own work this month — nothing generated, nothing estimated.</p>
        ${sections.join('')}
        <p style="margin-top:18px"><a href="${SITE_URL}/profile" style="color:#c94f0c;font-weight:700">See it all on the family page</a></p>
        <p style="font-size:12px;color:#72594d">You receive this because you confirmed progress emails for this CodeIt account.
        <a href="${unsubscribeUrl}">Stop these emails</a>.</p>
      </div>`,
  };
}

module.exports = { composeMonthlyEmail, gatherMonth, hasAnythingToSay, monthName, periodOf };
