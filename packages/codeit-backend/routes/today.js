'use strict';

// ── GET /api/today ──────────────────────────────────────────────────────────
//
// Everything the Home screen shows, in one call: the streak, whether today's
// build is done, the quest of the day, the level, the last three games and
// how many times they have been played. All of it is derived from tables
// that already exist (ai_projects, Students and the XP tables), so there is
// nothing to migrate and nothing to drift. A guest gets the quest and the
// level table only; their streak is computed from the shelf in the browser.

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const pool = require('../db');
const { totalXpFor } = require('../xpTotals');
const { streakFrom, questFor, levelFor, LEVELS } = require('../today');
const { pythonQuestFor, checkPythonQuest, dayNumber } = require('../pythonQuests');
const { recordMilestoneAndNotify } = require('../progressNotifications');

// ── The daily Python quest's bookkeeping ────────────────────────────────────
//
// Done: a student_milestones row (python_quest, keyed by day), which is also
// what the parent's progress email reads. XP: a lesson_step_xp row under
// lesson 0, step = days since 1 January 2026, which totalXpFor already sums.
// Both inserts are unique per user and day, so pressing Run twice pays once.
// No new table: the app's database role cannot create one in production.
const PYTHON_QUEST_LESSON = 0;

async function pythonQuestDays(userId) {
  const [rows] = await pool.query(
    "SELECT event_key FROM student_milestones WHERE user_id = ? AND event_type = 'python_quest' ORDER BY event_key DESC LIMIT 400",
    [userId]
  );
  return rows.map((r) => r.event_key);
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Sign in first.' });
  try { req.user = jwt.verify(token, JWT_SECRET); return next(); } catch { return res.status(403).json({ error: 'Sign in again.' }); }
}

const router = express.Router();

function optionalAuth(req, _res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch { req.user = null; }
  }
  return next();
}

router.get('/', optionalAuth, async (req, res) => {
  const quest = questFor();
  const pythonQuest = pythonQuestFor();
  if (!req.user?.user_id) {
    return res.json({ signedIn: false, quest, pythonQuest: { ...pythonQuest, done: false }, levels: LEVELS });
  }
  const userId = req.user.user_id;
  try {
    const [made] = await pool.query(
      'SELECT created_at FROM ai_projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 400',
      [userId]
    );
    const [games] = await pool.query(
      `SELECT id, title, project_type, public_id, is_public, view_count, created_at
         FROM ai_projects WHERE user_id = ?
        ORDER BY COALESCE(updated_at, created_at) DESC, created_at DESC LIMIT 3`,
      [userId]
    );
    const [[plays]] = await pool.query(
      'SELECT COALESCE(SUM(view_count), 0) AS plays FROM ai_projects WHERE user_id = ?',
      [userId]
    );
    const totalXP = await totalXpFor(pool, userId);
    const [[lessonsRow]] = await pool.query('SELECT COUNT(DISTINCT lesson_id) AS done FROM Student_Lesson_Progress WHERE user_id = ?', [userId]);
    // A day with a Python quest done counts for the streak like a day with a
    // game made: the streak is "did something today", not "built a game".
    const questDays = await pythonQuestDays(userId);
    const { streak, builtToday } = streakFrom([...made.map((row) => row.created_at), ...questDays.map((d) => `${d}T12:00:00Z`)]);
    return res.json({
      signedIn: true,
      quest,
      pythonQuest: { ...pythonQuest, done: questDays.includes(pythonQuest.day) },
      streak,
      builtToday,
      level: levelFor(totalXP),
      lessonsDone: Number(lessonsRow?.done) || 0,
      levels: LEVELS,
      games: games.map((g) => ({ id: g.id, title: g.title, type: g.project_type, publicId: g.is_public ? g.public_id : null, plays: Number(g.view_count) || 0, createdAt: g.created_at })),
      plays: Number(plays?.plays) || 0,
    });
  } catch (err) {
    console.error('Today read error:', err.message);
    return res.status(500).json({ error: 'Could not load today.' });
  }
});

// ── POST /api/today/python-quest ────────────────────────────────────────────
// The child's code and what it printed. Checked here again with the same
// rule the browser used, then recorded and paid once for the day.
router.post('/python-quest', requireAuth, async (req, res) => {
  const quest = pythonQuestFor();
  const code = String(req.body?.code || '').slice(0, 4000);
  const output = String(req.body?.output || '').slice(0, 4000);
  const verdict = checkPythonQuest(quest, code, output);
  if (!verdict.ok) return res.status(422).json({ ok: false, reason: verdict.reason });
  const userId = req.user.user_id;
  try {
    const milestone = await recordMilestoneAndNotify({
      userId,
      eventType: 'python_quest',
      eventKey: quest.day,
      title: quest.title,
      detail: `Today's Python quest: ${quest.task}`,
      targetUrl: '/home',
    });
    let xpEarned = 0;
    if (milestone.recorded) {
      const [result] = await pool.query(
        `INSERT INTO lesson_step_xp (user_id, lesson_id, step_index, xp_earned) VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id, lesson_id, step_index) DO NOTHING`,
        [userId, PYTHON_QUEST_LESSON, dayNumber(), quest.xp]
      );
      if (result.affectedRows > 0) {
        xpEarned = quest.xp;
        await pool.query('UPDATE Students SET total_xp = total_xp + ? WHERE user_id = ?', [quest.xp, userId]).catch(() => {});
      }
    }
    const questDays = await pythonQuestDays(userId);
    const [made] = await pool.query('SELECT created_at FROM ai_projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 400', [userId]);
    const { streak } = streakFrom([...made.map((row) => row.created_at), ...questDays.map((d) => `${d}T12:00:00Z`)]);
    const totalXP = await totalXpFor(pool, userId);
    return res.json({ ok: true, alreadyDone: !milestone.recorded, xpEarned, streak, level: levelFor(totalXP) });
  } catch (err) {
    console.error('Python quest error:', err.message);
    return res.status(500).json({ error: 'Could not save the quest.' });
  }
});

module.exports = router;
