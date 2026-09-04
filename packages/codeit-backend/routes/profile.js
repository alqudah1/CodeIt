'use strict';

// ── The avatar, finally saved ────────────────────────────────────────────────
//
// The Avatar Lab has always called GET /api/profile on load and PUT
// /api/profile/character 1.5 seconds after every change. The header and the
// profile page read `stats.totalXP` from the same GET. None of it existed on
// the server: every one of those requests was a 404.
//
// So the avatar a child built was reset to the default on every page load,
// the header never showed a level, and the profile page showed 0 XP to a
// child with four hundred. The user_character table has been in the schema
// since the first migration, waiting.
//
// This is that route. No new tables, no new columns.

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const pool = require('../db');
const { totalXpFor } = require('../xpTotals');

const router = express.Router();

// The lab's own option lists, so a PUT can only store what the lab can draw.
const ALLOWED = Object.freeze({
  gender:     ['female', 'male'],
  skinTone:   ['sunset', 'sand', 'cocoa', 'deep', 'pearl'],
  hairStyle:  ['wave', 'crown', 'bun', 'curls', 'pixie'],
  hairColor:  ['mocha', 'midnight', 'copper', 'gold', 'ocean', 'lavender'],
  outfit:     ['astronaut', 'explorer', 'hacker', 'artist'],
  accent:     ['headphones', 'glasses', 'cape', 'none'],
  expression: ['smile', 'laugh', 'wink'],
});
const DEFAULTS = Object.freeze({
  gender: 'female', skinTone: 'sunset', hairStyle: 'wave', hairColor: 'mocha',
  outfit: 'astronaut', accent: 'headphones', expression: 'smile', nickname: '',
});
const MAX_NICKNAME = 50;
// Control characters and angle brackets have no place in a nickname.
const UNSAFE_NICKNAME = /[\u0000-\u001f<>]/g;

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Sign in first.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

/** Keep only values the lab can draw; anything else falls back to the default. */
function sanitiseCharacter(body) {
  const out = {};
  for (const [key, allowed] of Object.entries(ALLOWED)) {
    const value = typeof body?.[key] === 'string' ? body[key] : '';
    out[key] = allowed.includes(value) ? value : DEFAULTS[key];
  }
  const nick = typeof body?.nickname === 'string' ? body.nickname : '';
  out.nickname = nick.replace(UNSAFE_NICKNAME, '').trim().slice(0, MAX_NICKNAME);
  return out;
}

function rowToCharacter(row) {
  if (!row) return { ...DEFAULTS };
  return {
    gender:     row.gender     || DEFAULTS.gender,
    skinTone:   row.skin_tone  || DEFAULTS.skinTone,
    hairStyle:  row.hair_style || DEFAULTS.hairStyle,
    hairColor:  row.hair_color || DEFAULTS.hairColor,
    outfit:     row.outfit     || DEFAULTS.outfit,
    accent:     row.accent     || DEFAULTS.accent,
    expression: row.expression || DEFAULTS.expression,
    nickname:   row.nickname   ?? '',
  };
}

// GET /api/profile — the saved avatar and the one XP total.
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [rows] = await pool.query('SELECT * FROM user_character WHERE user_id = ?', [userId]);
    const totalXP = await totalXpFor(pool, userId);
    return res.json({ character: rowToCharacter(rows[0]), stats: { totalXP } });
  } catch (err) {
    console.error('Profile read error:', err.message);
    return res.status(500).json({ error: 'Could not load the profile.' });
  }
});

// PUT /api/profile/character — save the avatar. Upsert on the primary key.
router.put('/character', requireAuth, async (req, res) => {
  const userId = req.user.user_id;
  const c = sanitiseCharacter(req.body);
  try {
    await pool.query(
      `INSERT INTO user_character
         (user_id, gender, skin_tone, hair_style, hair_color, outfit, accent, expression, nickname)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET
         gender = EXCLUDED.gender, skin_tone = EXCLUDED.skin_tone,
         hair_style = EXCLUDED.hair_style, hair_color = EXCLUDED.hair_color,
         outfit = EXCLUDED.outfit, accent = EXCLUDED.accent,
         expression = EXCLUDED.expression, nickname = EXCLUDED.nickname,
         updated_at = NOW()`,
      [userId, c.gender, c.skinTone, c.hairStyle, c.hairColor, c.outfit, c.accent, c.expression, c.nickname]
    );
    return res.json({ success: true, character: c });
  } catch (err) {
    console.error('Character save error:', err.message);
    return res.status(500).json({ error: 'Could not save the avatar.' });
  }
});

module.exports = router;
module.exports.sanitiseCharacter = sanitiseCharacter;
module.exports.rowToCharacter = rowToCharacter;
