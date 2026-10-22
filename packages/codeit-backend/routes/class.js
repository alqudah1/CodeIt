'use strict';

// ── /api/class: a code on the projector, a first name, in ───────────────────
//
// A teacher signed in on the site makes a class and reads the code out. A
// child opens /join, types the code and a first name and is building within
// the minute, on an account that is real: their games save and publish like
// anyone else's, and the board on /teach/:code shows them to the room.
//
// The trust model is the classroom's. The code is the secret; the first name
// is the identity. Typing the same name into the same class again signs the
// same child back in, which is how a child on a shared laptop gets back to
// yesterday's game without a password they would only lose. A class account
// has a random password it never sees, no email and no parent email, and the
// teacher who owns the class is the adult on record.
//
// The two tables (classes, class_members) are created by the migration, not
// at startup; until they exist every route here answers 503 { ready: false }
// so the pages can say "not set up yet" instead of breaking.

const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRY } = require('../config');
const pool = require('../db');
const { recordUserActivity } = require('../userActivity');
const { cleanClassName, cleanFirstName, isCode, makeCode, normaliseCode, studentUsername } = require('../classes');

const router = express.Router();

function readUser(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

function optionalAuth(req, _res, next) { req.user = readUser(req); next(); }

function requireAuth(req, res, next) {
  req.user = readUser(req);
  if (!req.user?.user_id) return res.status(401).json({ error: 'Please log in first.' });
  return next();
}

function notSetUp(err) {
  return err && (err.code === '42P01' || /relation .* does not exist|no such table|doesn't exist/i.test(err.message || ''));
}

function notReady(res) {
  return res.status(503).json({ ready: false, error: 'Classes are not set up on this site yet.' });
}

// Joins create accounts, so the number a single address can make in an hour
// is bounded: a classroom of thirty, with room for typos, not a script.
const JOIN_LIMIT = 80;
const joins = new Map();
function joinLimiter(req, res, next) {
  const now = Date.now();
  const entry = joins.get(req.ip);
  if (!entry || entry.resetAt <= now) { joins.set(req.ip, { count: 1, resetAt: now + 3600_000 }); return next(); }
  if (entry.count >= JOIN_LIMIT) return res.status(429).json({ error: 'That is a lot of joins from one place. Try again in a little while.' });
  entry.count += 1;
  if (joins.size > 5000) for (const [k, v] of joins) if (v.resetAt <= now) joins.delete(k);
  return next();
}

async function findClass(code) {
  const [rows] = await pool.query('SELECT id, code, name, owner_id, created_at FROM classes WHERE code = ?', [code]);
  return rows[0] || null;
}

function publicClass(row) {
  return { id: row.id, code: row.code, name: row.name, createdAt: row.created_at };
}

// ── POST /api/class { name } ────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const name = cleanClassName(req.body?.name);
  if (name.length < 2) return res.status(400).json({ error: 'Give the class a name, like "Year 5" or "Tuesday club".' });
  try {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const code = makeCode();
      if (await findClass(code)) continue;
      const [result] = await pool.query(
        'INSERT INTO classes (code, name, owner_id) VALUES (?, ?, ?)',
        [code, name, req.user.user_id]
      );
      return res.status(201).json({ class: { id: result.insertId, code, name, createdAt: new Date().toISOString(), members: 0 } });
    }
    return res.status(500).json({ error: 'Could not find a free code. Try once more.' });
  } catch (err) {
    if (notSetUp(err)) return notReady(res);
    console.error('class/create:', err.message);
    return res.status(500).json({ error: 'Could not make the class.' });
  }
});

// ── GET /api/class/mine ─────────────────────────────────────────────────────
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.code, c.name, c.created_at,
              (SELECT COUNT(*) FROM class_members m WHERE m.class_id = c.id) AS members
         FROM classes c WHERE c.owner_id = ? ORDER BY c.created_at DESC`,
      [req.user.user_id]
    );
    return res.json({ ready: true, classes: rows.map((r) => ({ ...publicClass(r), members: Number(r.members) || 0 })) });
  } catch (err) {
    if (notSetUp(err)) return notReady(res);
    console.error('class/mine:', err.message);
    return res.status(500).json({ error: 'Could not load your classes.' });
  }
});

// ── GET /api/class/:code: the board ─────────────────────────────────────────
//
// First names, how many games each child has made, and their newest game if
// it is published. The code is what the room was shown, so the room can see
// the board; nothing on it is more than a first name and a game title.
router.get('/:code', optionalAuth, async (req, res) => {
  const code = normaliseCode(req.params.code);
  if (!isCode(code)) return res.status(404).json({ error: 'That is not a class code.' });
  try {
    const klass = await findClass(code);
    if (!klass) return res.status(404).json({ error: 'No class has that code. Check it on the board.' });
    const [members] = await pool.query(
      `SELECT u.user_id, u.name, m.joined_at,
              (SELECT COUNT(*) FROM ai_projects p WHERE p.user_id = u.user_id) AS games,
              (SELECT COALESCE(SUM(p.view_count), 0) FROM ai_projects p WHERE p.user_id = u.user_id) AS plays
         FROM class_members m JOIN Users u ON u.user_id = m.user_id
        WHERE m.class_id = ? ORDER BY m.joined_at ASC`,
      [klass.id]
    );
    const ids = members.map((m) => m.user_id);
    let newest = new Map();
    if (ids.length) {
      const [games] = await pool.query(
        `SELECT id, user_id, title, public_id, is_public, project_type, created_at FROM ai_projects
          WHERE user_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at DESC`,
        ids
      );
      for (const g of games) if (!newest.has(g.user_id)) newest.set(g.user_id, g);
    }
    const owner = req.user?.user_id === klass.owner_id;
    return res.json({
      ready: true,
      class: publicClass(klass),
      owner,
      members: members.map((m) => {
        const g = newest.get(m.user_id);
        return {
          id: m.user_id,
          name: m.name,
          joinedAt: m.joined_at,
          games: Number(m.games) || 0,
          plays: Number(m.plays) || 0,
          newest: g ? { id: g.id, title: g.title, type: g.project_type, publicId: g.is_public ? g.public_id : null, createdAt: g.created_at } : null,
        };
      }),
    });
  } catch (err) {
    if (notSetUp(err)) return notReady(res);
    console.error('class/board:', err.message);
    return res.status(500).json({ error: 'Could not load the class.' });
  }
});

// ── POST /api/class/:code/join { first_name } ───────────────────────────────
router.post('/:code/join', joinLimiter, optionalAuth, async (req, res) => {
  const code = normaliseCode(req.params.code);
  if (!isCode(code)) return res.status(404).json({ error: 'That is not a class code.' });
  let connection;
  try {
    const klass = await findClass(code);
    if (!klass) return res.status(404).json({ error: 'No class has that code. Check it on the board.' });

    // Already signed in: this account joins the class, nothing new is made.
    if (req.user?.user_id) {
      const [already] = await pool.query('SELECT id FROM class_members WHERE class_id = ? AND user_id = ?', [klass.id, req.user.user_id]);
      if (!already.length) await pool.query('INSERT INTO class_members (class_id, user_id) VALUES (?, ?)', [klass.id, req.user.user_id]);
      return res.json({ joined: true, existing: true, class: publicClass(klass) });
    }

    const firstName = cleanFirstName(req.body?.first_name);
    if (firstName.length < 2) return res.status(400).json({ error: 'Type your first name so the board knows who you are.' });

    // The same name in the same class is the same child coming back.
    const [back] = await pool.query(
      `SELECT u.user_id, u.name, u.role FROM class_members m JOIN Users u ON u.user_id = m.user_id
        WHERE m.class_id = ? AND LOWER(u.name) = LOWER(?) ORDER BY m.joined_at ASC LIMIT 1`,
      [klass.id, firstName]
    );
    if (back[0]) {
      return res.json({ joined: true, existing: true, class: publicClass(klass), ...signIn(back[0].user_id, back[0].name) });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const password = bcrypt.hashSync(crypto.randomBytes(24).toString('base64url'), 10);
    let userId = null;
    for (let n = 0; n < 20 && userId === null; n += 1) {
      const username = studentUsername(firstName, code, n);
      const [taken] = await connection.query('SELECT user_id FROM Users WHERE username = ?', [username]);
      if (taken.length) continue;
      const [result] = await connection.query(
        'INSERT INTO Users (username, name, password, role, dob, parent_email) VALUES (?, ?, ?, ?, ?, ?)',
        [username, firstName, password, 'student', null, null]
      );
      userId = result.insertId;
    }
    if (userId === null) throw new Error('no free username');
    await connection.query('INSERT INTO Students (user_id, level_id, total_xp, weekly_xp) VALUES (?, 1, 0, 0)', [userId]);
    await connection.query('INSERT INTO class_members (class_id, user_id) VALUES (?, ?)', [klass.id, userId]);
    await connection.commit();
    void recordUserActivity(userId, 'login');
    return res.status(201).json({ joined: true, existing: false, class: publicClass(klass), ...signIn(userId, firstName) });
  } catch (err) {
    if (connection) { try { await connection.rollback(); } catch { /* already gone */ } }
    if (notSetUp(err)) return notReady(res);
    console.error('class/join:', err.message);
    return res.status(500).json({ error: 'Could not join. Try the code once more.' });
  } finally {
    if (connection) connection.release();
  }
});

// The same token a student gets from /api/signup, so every other route treats
// a class account exactly like one made on the register page.
function signIn(userId, name) {
  const learningMode = 'guided';
  const token = jwt.sign({ user_id: userId, role: 'student', name, learningMode }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  return { token, user: { id: userId, name, username: null, email: null, role: 'student', is_admin: 0, learningMode } };
}

module.exports = router;
