'use strict';

const { escapeHtml } = require('./progressNotificationUtils');

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://codeitlearn.com').replace(/\/+$/, '');

const EVENT_LABELS = Object.freeze({
  lesson_completed: 'Lesson completed',
  exercise_completed: 'Exercise completed',
  puzzle_completed: 'Challenge completed',
  quiz_completed: 'Quiz completed',
  python_quest: 'Daily Python quest done',
  project_created: 'Project created',
  project_published: 'Project published',
  ai_limit_reached: 'Free studio builds used up',
});

// ── The one email that is for the grown-up who pays ─────────────────────────
//
// A child who uses up the month's free AI builds is told, on the page, what
// still works and when the builds come back. Nothing is sold to them. The
// grown-up is the one who can change it, so the grown-up is the one who is
// told: what the child made, and what Plus would give them. Plain, once a
// month at most, with the same unsubscribe link as every other email.
function limitEmail({ studentName, title, detail, targetUrl, unsubscribeToken }) {
  const subjectName = String(studentName || 'Your learner').replace(/[\r\n]+/g, ' ').trim();
  const safeName = escapeHtml(studentName);
  const safeTitle = escapeHtml(title);
  const safeDetail = escapeHtml(detail);
  const plusUrl = escapeHtml(targetUrl || `${SITE_URL}/pricing#codeit-plus`);
  const unsubscribeUrl = `${SITE_URL}/api/progress-notifications/unsubscribe/${unsubscribeToken}`;
  return {
    subject: `${subjectName} used every free studio build this month`,
    text: `${studentName} ${title}. ${detail || ''} CodeIt Plus gives them as many as they want, CA$12 a month plus tax, cancel any time: ${targetUrl || `${SITE_URL}/pricing`}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#3d302b">
        <div style="font-size:24px;font-weight:800;color:#f87824">CodeIt</div>
        <p style="color:#c94f0c;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Free studio builds used up</p>
        <h1 style="font-size:25px">${safeName} ${safeTitle}</h1>
        <div style="padding:18px;border-radius:14px;background:#fff7ee;border:1px solid #f0d8c5">
          ${safeDetail ? `<p style="margin-top:0">${safeDetail}</p>` : ''}
          <p style="margin-bottom:0">Every lesson, puzzle and game they have made stays open, and the free builds come back next month. CodeIt Plus gives them as many studio builds as they want, who played their games, and room for up to four children. CA$12 a month plus tax, cancel any time.</p>
        </div>
        <p><a href="${plusUrl}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#f87824;color:#fff;font-weight:800;text-decoration:none">See CodeIt Plus</a></p>
        <p style="font-size:12px;color:#72594d">You are receiving this because you confirmed progress emails for this CodeIt account. <a href="${unsubscribeUrl}">Stop these emails</a>.</p>
      </div>`,
  };
}

function milestoneEmail({ studentName, eventType, title, detail, targetUrl, unsubscribeToken }) {
  if (eventType === 'ai_limit_reached') return limitEmail({ studentName, title, detail, targetUrl, unsubscribeToken });
  const label = EVENT_LABELS[eventType] || 'New milestone';
  const subjectName = String(studentName || 'Your learner').replace(/[\r\n]+/g, ' ').trim();
  const safeName = escapeHtml(studentName);
  const safeTitle = escapeHtml(title);
  const safeDetail = escapeHtml(detail);
  const action = targetUrl
    ? `<p><a href="${escapeHtml(targetUrl)}" style="color:#c94f0c;font-weight:700">View the project</a></p>`
    : '';
  const unsubscribeUrl = `${SITE_URL}/api/progress-notifications/unsubscribe/${unsubscribeToken}`;
  return {
    subject: `CodeIt progress: ${subjectName}, ${label}`,
    text: `${studentName}, ${label}: ${title}${detail ? `. ${detail}` : ''}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#3d302b">
        <div style="font-size:24px;font-weight:800;color:#f87824">CodeIt</div>
        <p style="color:#c94f0c;font-weight:700;text-transform:uppercase;letter-spacing:.08em">${label}</p>
        <h1 style="font-size:25px">${safeName} completed something new</h1>
        <div style="padding:18px;border-radius:14px;background:#fff7ee;border:1px solid #f0d8c5">
          <strong>${safeTitle}</strong>
          ${safeDetail ? `<p style="margin-bottom:0">${safeDetail}</p>` : ''}
        </div>
        ${action}
        <p style="font-size:12px;color:#72594d">You are receiving this because you confirmed progress emails for this CodeIt account. <a href="${unsubscribeUrl}">Stop these emails</a>.</p>
      </div>`,
  };
}

module.exports = { EVENT_LABELS, milestoneEmail, limitEmail };
