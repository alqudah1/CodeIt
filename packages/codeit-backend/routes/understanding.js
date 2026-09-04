'use strict';

// ── The comprehension evidence, finally attached to the account ─────────────
//
// understandingRecords.js existed, was tested, and was imported by nothing:
// the one thing no competitor has — proof a child explained their own code —
// lived in a single localStorage key on a single device. These routes give it
// a home that survives a wiped school browser, shows up on a parent's phone,
// and can be counted.
//
// The client posts QUESTION IDS, never sentences (see understandingRecords.js
// for why). The one exception is /import, which migrates a browser's existing
// records on sign-in — and even there, only sentences the server itself wrote
// are accepted, matched word for word against the known set. A forged import
// can claim nothing the studio does not actually ask.

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const pool = require('../db');
const {
  MAX_TITLE,
  SKILL_FOR_QUESTION,
  normaliseAttempt,
  summarise,
} = require('../understandingRecords');
const { UNDERSTANDING_XP } = require('../xpTotals');

const router = express.Router();

const KNOWN_SENTENCES = new Set(Object.values(SKILL_FOR_QUESTION));
const MAX_IMPORT = 40;

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

function parseSkills(raw) {
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Upsert one record, merging skills with whatever the row already holds. */
async function saveRecord(userId, { projectKey, projectTitle, skills }) {
  const [existing] = await pool.query(
    'SELECT id, skills FROM understanding_records WHERE user_id = ? AND project_key = ?',
    [userId, projectKey]
  );
  const already = existing.length ? parseSkills(existing[0].skills) : [];
  const merged = [...new Set([...already, ...skills])].filter(s => KNOWN_SENTENCES.has(s));
  // Only what is NEW in this row earns anything: the same game explained
  // twice is not twice the evidence, and it is not twice the XP either.
  const gained = merged.length - already.filter(s => KNOWN_SENTENCES.has(s)).length;
  if (existing.length) {
    await pool.query(
      'UPDATE understanding_records SET skills = ?, project_title = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(merged), projectTitle, existing[0].id]
    );
  } else {
    await pool.query(
      'INSERT INTO understanding_records (user_id, project_key, project_title, skills) VALUES (?, ?, ?, ?)',
      [userId, projectKey, projectTitle, JSON.stringify(merged)]
    );
  }
  // The total everyone reads is computed from the rows (xpTotals.js), so this
  // column is a cache kept in step the way every other award keeps it. If it
  // fails, the record is still the record and the total is still right.
  if (gained > 0) {
    await pool.query(
      'UPDATE Students SET total_xp = total_xp + ? WHERE user_id = ?',
      [gained * UNDERSTANDING_XP, userId]
    ).catch(error => console.error('Understanding XP cache update failed:', error.message));
  }
  return { merged, xpEarned: Math.max(0, gained) * UNDERSTANDING_XP };
}

async function listRecords(userId) {
  const [rows] = await pool.query(
    `SELECT project_key, project_title, skills, created_at, updated_at
       FROM understanding_records
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 60`,
    [userId]
  );
  return rows.map(row => ({
    projectKey: row.project_key,
    projectTitle: row.project_title,
    skills: parseSkills(row.skills),
    at: row.updated_at || row.created_at,
  }));
}

// POST /api/understanding — record one attempt. Body: { projectKey,
// projectTitle, questionIds }. The server writes the sentences.
router.post('/', requireAuth, async (req, res) => {
  const attempt = normaliseAttempt(req.body);
  if (!attempt) return res.status(400).json({ error: 'Nothing demonstrated, nothing recorded.' });
  try {
    const { merged: skills, xpEarned } = await saveRecord(req.user.user_id, attempt);
    return res.json({ success: true, skills, xpEarned });
  } catch (err) {
    console.error('Record understanding error:', err.message);
    return res.status(500).json({ error: 'Could not save the record.' });
  }
});

// POST /api/understanding/import — one-time migration of a browser's
// localStorage records on sign-in, so no family loses what their child
// already showed. Only server-authored sentences survive the crossing.
router.post('/import', requireAuth, async (req, res) => {
  const incoming = Array.isArray(req.body?.records) ? req.body.records.slice(0, MAX_IMPORT) : [];
  let imported = 0;
  try {
    for (const raw of incoming) {
      const projectKey = typeof raw?.projectId === 'string' ? raw.projectId.trim().slice(0, 80) : '';
      const skills = (Array.isArray(raw?.skills) ? raw.skills : [])
        .filter(s => KNOWN_SENTENCES.has(s)).slice(0, 8);
      if (!projectKey || !skills.length) continue;
      const projectTitle = String(raw?.projectTitle || 'a project').trim().slice(0, MAX_TITLE) || 'a project';
      await saveRecord(req.user.user_id, { projectKey, projectTitle, skills });
      imported += 1;
    }
    return res.json({ success: true, imported });
  } catch (err) {
    console.error('Import understanding error:', err.message);
    return res.status(500).json({ error: 'Could not import the records.' });
  }
});

// ── The sendable page ───────────────────────────────────────────────────────
//
// A certificate proves attendance; these sentences prove understanding. What
// makes them count is a parent being able to SEND them — to a grandparent, a
// teacher, the other parent — as a link that opens on any phone with no
// account. The link carries a signed token scoped to exactly one thing:
// reading one learner's evidence. It deliberately does not contain a
// `user_id` claim, so it can never be replayed as a session token, and the
// reader endpoint refuses anything without the evidence scope, so a stolen
// session token can't be turned into someone's evidence page either.

const SHARE_SCOPE = 'evidence-share';

// Signed with a key DERIVED from the session secret, not the secret itself:
// a share token therefore fails verification everywhere sessions are checked,
// and a stolen session token fails verification here. The two token families
// cannot be confused even in principle.
const SHARE_SECRET = `${JWT_SECRET}.${SHARE_SCOPE}`;

/** First name only — a public page never needs more. */
function firstNameOf(row) {
  const name = String(row?.name || row?.username || 'This learner').trim();
  return name.split(/\s+/)[0] || 'This learner';
}

// POST /api/understanding/share — mint a link for yourself, or (for a linked
// parent) for one of your children. Body: { childId? }.
router.post('/share', requireAuth, async (req, res) => {
  try {
    let learnerId = req.user.user_id;
    const childId = Number(req.body?.childId);
    if (childId && childId !== learnerId) {
      const [links] = await pool.query(
        'SELECT child_user_id FROM parent_child_links WHERE adult_user_id = ? AND child_user_id = ?',
        [learnerId, childId]
      );
      if (!links.length) return res.status(404).json({ error: 'No such learner in this family.' });
      learnerId = childId;
    }
    const token = jwt.sign({ shareScope: SHARE_SCOPE, learner: learnerId }, SHARE_SECRET, { expiresIn: '365d' });
    return res.json({ success: true, path: `/understood/${token}` });
  } catch (err) {
    console.error('Share understanding error:', err.message);
    return res.status(500).json({ error: 'Could not make the link.' });
  }
});

// GET /api/understanding/shared/:token — the public read. No auth: the token
// IS the permission, and it can read exactly one learner's sentences.
router.get('/shared/:token', async (req, res) => {
  let decoded;
  try {
    decoded = jwt.verify(req.params.token, SHARE_SECRET);
  } catch {
    return res.status(404).json({ error: 'This link is not valid any more.' });
  }
  if (decoded?.shareScope !== SHARE_SCOPE || !decoded.learner) {
    return res.status(404).json({ error: 'This link is not valid any more.' });
  }
  try {
    const [users] = await pool.query(
      'SELECT name, username FROM Users WHERE user_id = ?',
      [decoded.learner]
    );
    if (!users.length) return res.status(404).json({ error: 'This link is not valid any more.' });
    const records = await listRecords(decoded.learner);
    return res.json({ success: true, name: firstNameOf(users[0]), records, summary: summarise(records) });
  } catch (err) {
    console.error('Read shared understanding error:', err.message);
    return res.status(500).json({ error: 'Could not load the page.' });
  }
});

// GET /api/understanding — this learner's own records, newest first.
router.get('/', requireAuth, async (req, res) => {
  try {
    const records = await listRecords(req.user.user_id);
    return res.json({ success: true, records, summary: summarise(records) });
  } catch (err) {
    console.error('List understanding error:', err.message);
    return res.status(500).json({ error: 'Could not load the records.' });
  }
});

module.exports = router;
module.exports.listRecords = listRecords;
