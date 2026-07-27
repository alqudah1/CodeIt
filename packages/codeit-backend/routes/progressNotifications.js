'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const {
  EVENT_LABELS,
  getProgressSummary,
  getSettings,
  recordMilestoneAndNotify,
  resendVerification,
  unsubscribeParent,
  updateSettings,
  verifyParent,
} = require('../progressNotifications');

const router = express.Router();

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  jwt.verify(token, JWT_SECRET, (error, user) => {
    if (error) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

function resultPage(title, message) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | CodeIt</title><body style="margin:0;background:#fff9f2;color:#3d302b;font-family:Arial,sans-serif"><main style="max-width:560px;margin:12vh auto;padding:36px;background:#fff;border:1px solid #f0d8c5;border-radius:22px;text-align:center"><div style="font-size:28px;font-weight:900;color:#f87824">CodeIt</div><h1>${title}</h1><p style="line-height:1.6">${message}</p><a href="/" style="display:inline-block;margin-top:12px;padding:12px 18px;border-radius:10px;background:#f87824;color:#fff;text-decoration:none;font-weight:700">Go to CodeIt</a></main></body></html>`;
}

router.get('/settings', requireAuth, async (req, res) => {
  try {
    const settings = await getSettings(req.user.user_id);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: 'Could not load parent notification settings' });
  }
});

router.put('/settings', requireAuth, async (req, res) => {
  try {
    const result = await updateSettings(req.user.user_id, req.body || {});
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not save settings' });
  }
});

router.post('/resend-verification', requireAuth, async (req, res) => {
  try {
    const result = await resendVerification(req.user.user_id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not resend confirmation' });
  }
});

router.get('/summary', requireAuth, async (req, res) => {
  try {
    const summary = await getProgressSummary(req.user.user_id);
    res.json({ success: true, ...summary, eventLabels: EVENT_LABELS });
  } catch (error) {
    res.status(500).json({ error: 'Could not load progress summary' });
  }
});

router.post('/exercise-complete', requireAuth, async (req, res) => {
  const { lessonId, exerciseIndex, title } = req.body || {};
  if (!Number.isInteger(Number(lessonId)) || !Number.isInteger(Number(exerciseIndex))) {
    return res.status(400).json({ error: 'lessonId and exerciseIndex are required' });
  }
  try {
    const result = await recordMilestoneAndNotify({
      userId: req.user.user_id,
      eventType: 'exercise_completed',
      eventKey: `${Number(lessonId)}:${Number(exerciseIndex)}`,
      title: String(title || `Lesson ${lessonId} exercise ${Number(exerciseIndex) + 1}`).slice(0, 255),
      detail: `Completed in lesson ${lessonId}`,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Could not record exercise completion' });
  }
});

router.get('/verify/:token', async (req, res) => {
  try {
    const verified = await verifyParent(req.params.token);
    res.status(verified ? 200 : 400).send(resultPage(
      verified ? 'Progress emails confirmed' : 'Confirmation link expired',
      verified
        ? 'You will now receive the student progress updates selected for this account.'
        : 'This link is invalid or has expired. Ask the student to resend it from their profile.'
    ));
  } catch {
    res.status(500).send(resultPage('Something went wrong', 'We could not confirm this email right now.'));
  }
});

router.get('/unsubscribe/:token', async (req, res) => {
  try {
    const unsubscribed = await unsubscribeParent(req.params.token);
    res.status(unsubscribed ? 200 : 400).send(resultPage(
      unsubscribed ? 'Progress emails stopped' : 'Link not recognized',
      unsubscribed
        ? 'CodeIt will no longer send progress emails for this student account.'
        : 'This unsubscribe link is invalid or no longer active.'
    ));
  } catch {
    res.status(500).send(resultPage('Something went wrong', 'We could not update email preferences right now.'));
  }
});

module.exports = router;
