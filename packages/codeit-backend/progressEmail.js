'use strict';

const { escapeHtml } = require('./progressNotificationUtils');

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://codeitlearn.com').replace(/\/+$/, '');

const EVENT_LABELS = Object.freeze({
  lesson_completed: 'Lesson completed',
  exercise_completed: 'Exercise completed',
  puzzle_completed: 'Challenge completed',
  quiz_completed: 'Quiz completed',
  project_created: 'Project created',
  project_published: 'Project published',
});

function milestoneEmail({ studentName, eventType, title, detail, targetUrl, unsubscribeToken }) {
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
    subject: `CodeIt progress: ${subjectName} — ${label}`,
    text: `${studentName} — ${label}: ${title}${detail ? `. ${detail}` : ''}`,
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

module.exports = { EVENT_LABELS, milestoneEmail };
