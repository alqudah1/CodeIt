'use strict';

// ── /api/powers ─────────────────────────────────────────────────────────────
//
// GET /          the twelve powers and which this child has done
// POST /:slug/check { code, before }
//                the server runs the same rule the page showed; a pass is
//                stored once per power and worth POWER_XP, through the lesson
//                progress table every XP total already reads, so nothing new
//                is created in the database and a power counts like a lesson
//                in the parent's digest.
//
// A guest can check too: they get the verdict and nothing is stored; the page
// remembers it in the browser until they have an account.

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const pool = require('../db');
const { recordEvent } = require('../analytics');
const { normalizeJourneyId } = require('../analyticsEvents');
const { LESSON_BASE, POWERS, POWER_XP, lessonIdFor, passes, powerByLessonId, powerBySlug, powerStates } = require('../powers');

const router = express.Router();

function optionalAuth(req, _res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) { try { req.user = jwt.verify(token, JWT_SECRET); } catch { req.user = null; } }
  return next();
}

async function doneSlugsFor(userId) {
  const [rows] = await pool.query(
    'SELECT lesson_id FROM Student_Lesson_Progress WHERE user_id = ? AND lesson_id > ? AND lesson_id <= ?',
    [userId, LESSON_BASE, LESSON_BASE + POWERS.length]
  );
  return rows.map((r) => powerByLessonId(r.lesson_id)).filter(Boolean).map((p) => p.slug);
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    const done = req.user?.user_id ? await doneSlugsFor(req.user.user_id) : [];
    return res.json({ signedIn: !!req.user?.user_id, xpEach: POWER_XP, powers: powerStates(done), done });
  } catch (err) {
    console.error('powers/list:', err.message);
    return res.json({ signedIn: !!req.user?.user_id, xpEach: POWER_XP, powers: powerStates([]), done: [], stale: true });
  }
});

router.post('/:slug/check', optionalAuth, async (req, res) => {
  const power = powerBySlug(req.params.slug);
  if (!power) return res.status(404).json({ error: 'No power has that name.' });
  const code = typeof req.body?.code === 'string' ? req.body.code.slice(0, 20000) : '';
  const before = typeof req.body?.before === 'string' ? req.body.before.slice(0, 20000) : '';
  const passed = passes(power, code, before);
  if (!passed) return res.json({ passed: false, say: power.check.say });
  const userId = req.user?.user_id;
  if (!userId) return res.json({ passed: true, stored: false, xp: 0 });
  try {
    const [result] = await pool.query(
      'INSERT INTO Student_Lesson_Progress (user_id, lesson_id, xp_earned) VALUES (?, ?, ?) ON CONFLICT (user_id, lesson_id) DO NOTHING',
      [userId, lessonIdFor(power), POWER_XP]
    );
    const first = (result.affectedRows || 0) > 0;
    if (first) {
      await pool.query('UPDATE Students SET total_xp = total_xp + ?, weekly_xp = weekly_xp + ? WHERE user_id = ?', [POWER_XP, POWER_XP, userId]).catch(() => {});
      void recordEvent('power_unlocked', { userId, journeyId: normalizeJourneyId(req.get('X-CodeIt-Journey')), meta: power.slug }).catch(() => {});
    }
    const done = await doneSlugsFor(userId);
    return res.json({ passed: true, stored: true, first, xp: first ? POWER_XP : 0, done, powers: powerStates(done) });
  } catch (err) {
    console.error('powers/check:', err.message);
    return res.json({ passed: true, stored: false, xp: 0 });
  }
});

module.exports = router;
