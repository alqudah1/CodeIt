'use strict';

// ── The weekly email: the parent page, in the inbox ─────────────────────────
//
// The same four things /parent shows, in the same order, from the same
// tables: what was made this week (the newest game is a link that plays),
// what was learned in plain words (powers by what they let a game do, and
// the ideas the child explained inside their own games), what is next, and
// the link to the page. Nothing estimated, nothing padded; a week with
// nothing at all sends no email rather than a hollow one.
//
// One send per learner per week, through the same log the monthly email
// uses: its period column is seven characters, so a week is written 26W43.

const pool = require('./db');
const { escapeHtml } = require('./progressNotificationUtils');
const { LESSON_BASE, POWERS, powerByLessonId } = require('./powers');

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://codeitlearn.com').replace(/\/+$/, '');

/** ISO week, as a period that fits the digest log: 26W43. */
function weekPeriodOf(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${String(d.getUTCFullYear()).slice(2)}W${String(week).padStart(2, '0')}`;
}

function parseSkills(raw) {
  if (Array.isArray(raw)) return raw;
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

/** Everything this learner did in the last seven days, from the live tables. */
async function gatherWeek(userId) {
  const [projects] = await pool.query(
    `SELECT id, title, prompt, project_type, public_id, is_public, created_at
       FROM ai_projects
      WHERE user_id = ? AND created_at >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC LIMIT 6`,
    [userId]
  );
  const [powerRows] = await pool.query(
    `SELECT lesson_id FROM Student_Lesson_Progress
      WHERE user_id = ? AND lesson_id > ? AND lesson_id <= ? AND completed_at >= NOW() - INTERVAL '7 days'
      ORDER BY completed_at ASC`,
    [userId, LESSON_BASE, LESSON_BASE + POWERS.length]
  ).catch(() => [[]]);
  const [allPowerRows] = await pool.query(
    'SELECT lesson_id FROM Student_Lesson_Progress WHERE user_id = ? AND lesson_id > ? AND lesson_id <= ?',
    [userId, LESSON_BASE, LESSON_BASE + POWERS.length]
  ).catch(() => [[]]);
  const [understood] = await pool.query(
    `SELECT project_title, skills, updated_at
       FROM understanding_records
      WHERE user_id = ? AND updated_at >= NOW() - INTERVAL '7 days'
      ORDER BY updated_at DESC LIMIT 6`,
    [userId]
  ).catch(() => [[]]);

  const doneAll = new Set((allPowerRows || []).map(r => Number(r.lesson_id)));
  const nextPower = POWERS.find(p => !doneAll.has(LESSON_BASE + p.n)) || null;
  return {
    projects: (projects || []).map(row => ({
      title: row.title, prompt: row.prompt, type: row.project_type,
      publicId: row.is_public ? row.public_id : null,
    })),
    powers: (powerRows || []).map(r => powerByLessonId(r.lesson_id)).filter(Boolean).map(p => ({ name: p.name, does: p.does })),
    nextPower: nextPower ? { name: nextPower.name, does: nextPower.does } : null,
    understood: (understood || []).map(row => ({ projectTitle: row.project_title, skills: parseSkills(row.skills) })),
  };
}

function hasAnythingToSay(week) {
  return week.projects.length + week.powers.length + week.understood.length > 0;
}

const EY = 'color:#C45E00;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:.12em;margin:0 0 6px';

/** The email itself: Made, Learned, Next, the page. */
function composeWeeklyEmail({ studentName, week, unsubscribeToken }) {
  const name = String(studentName || 'Your child').replace(/[\r\n]+/g, ' ').trim();
  const safeName = escapeHtml(name);
  const unsubscribeUrl = `${SITE_URL}/api/progress-notifications/unsubscribe/${unsubscribeToken}`;
  const n = week.projects.length;
  const headline = n === 0 ? `${name} has not built this week yet.` : `${name} made ${n} ${n === 1 ? 'game' : 'games'} this week.`;

  const blocks = [];
  const text = [headline];

  if (n) {
    const [first, ...rest] = week.projects;
    const playLink = first.publicId ? `<a href="${SITE_URL}/project/${escapeHtml(first.publicId)}" style="display:inline-block;margin-top:8px;background:#35220E;color:#FFC93C;text-decoration:none;font-weight:800;border-radius:999px;padding:10px 16px">Play ${escapeHtml(first.title)}</a>` : '';
    blocks.push(`
      <div style="padding:18px 20px;border-radius:20px;background:#FFFDFA;border:1px solid #EADBCB;margin:0 0 12px">
        <p style="${EY}">Made</p>
        <div style="font-size:22px;font-weight:800">${escapeHtml(first.title)}</div>
        ${first.prompt ? `<div style="color:#7A6757;margin-top:4px">${safeName} typed: <q>${escapeHtml(first.prompt)}</q></div>` : ''}
        ${playLink}
        ${rest.length ? `<div style="margin-top:10px;font-size:14px">Also: ${rest.map(p => escapeHtml(p.title)).join(', ')}.</div>` : ''}
      </div>`);
    text.push(`Made: ${week.projects.map(p => p.title).join(', ')}` + (first.publicId ? ` (play: ${SITE_URL}/project/${first.publicId})` : ''));
  }

  const learned = [
    ...week.powers.map(p => `${p.name}: ${p.does}`),
    ...week.understood.flatMap(u => u.skills.map(s => `${s} (in ${u.projectTitle})`)),
  ];
  if (learned.length) {
    blocks.push(`
      <div style="padding:18px 20px;border-radius:20px;background:#17C08B;color:#fff;margin:0 0 12px">
        <p style="${EY};color:rgba(255,255,255,.85)">Learned, in plain words</p>
        <ul style="margin:0;padding-left:20px;font-size:16px;line-height:1.5">${learned.map(l => `<li>${escapeHtml(l)}</li>`).join('')}</ul>
      </div>`);
    text.push('Learned: ' + learned.join('; '));
  }

  if (week.nextPower) {
    blocks.push(`<p style="font-size:16px;margin:0 0 16px">Next: <strong>${escapeHtml(week.nextPower.name)}</strong>, ${escapeHtml(week.nextPower.does)}.</p>`);
    text.push(`Next: ${week.nextPower.name}, ${week.nextPower.does}.`);
  }

  return {
    subject: headline,
    text: text.join('\n') + `\nThe full page: ${SITE_URL}/parent\nStop these emails: ${unsubscribeUrl}`,
    html: `
      <div style="font-family:Nunito,Arial,sans-serif;max-width:600px;margin:auto;color:#35220E;background:#FFF6ED;padding:24px;border-radius:24px">
        <div style="font-size:22px;font-weight:800;color:#FF7A00;margin-bottom:12px">CodeIt</div>
        <p style="${EY}">This week</p>
        <h1 style="font-size:26px;line-height:1.1;margin:0 0 16px">${escapeHtml(headline)}</h1>
        ${blocks.join('')}
        <a href="${SITE_URL}/parent" style="color:#C45E00;font-weight:800">See the whole week on the family page</a>
        <p style="font-size:12px;color:#7A6757;margin-top:18px">Everything above is from ${safeName}'s own work. Nothing is ever sold to ${safeName} inside the app.
        You receive this because you confirmed progress emails for this CodeIt account. <a href="${unsubscribeUrl}" style="color:#7A6757">Stop these emails</a>.</p>
      </div>`,
  };
}

module.exports = { composeWeeklyEmail, gatherWeek, hasAnythingToSay, weekPeriodOf };
