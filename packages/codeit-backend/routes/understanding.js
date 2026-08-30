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
  return merged;
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
    const skills = await saveRecord(req.user.user_id, attempt);
    return res.json({ success: true, skills });
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
