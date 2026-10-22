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
  if (!req.user?.user_id) {
    return res.json({ signedIn: false, quest, levels: LEVELS });
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
    const { streak, builtToday } = streakFrom(made.map((row) => row.created_at));
    return res.json({
      signedIn: true,
      quest,
      streak,
      builtToday,
      level: levelFor(totalXP),
      levels: LEVELS,
      games: games.map((g) => ({ id: g.id, title: g.title, type: g.project_type, publicId: g.is_public ? g.public_id : null, plays: Number(g.view_count) || 0, createdAt: g.created_at })),
      plays: Number(plays?.plays) || 0,
    });
  } catch (err) {
    console.error('Today read error:', err.message);
    return res.status(500).json({ error: 'Could not load today.' });
  }
});

module.exports = router;
