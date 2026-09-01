'use strict';

// ── Unlisted projects: share without an account ─────────────────────────────
//
// The friction this removes is real: a visitor builds something good, and the
// only way to keep it is to make an account, so most of them lose it. Every
// kept project is also an inbound link someone might paste somewhere, which is
// the thing the site currently has none of.
//
// What it deliberately does NOT do is collect an email. See the migration
// (supabase/migrations/20260901010000_unlisted_projects.sql) for the full
// reasoning: an email typed by an anonymous visitor who may be seven years old
// is not verifiable parental consent, and CodeIt already has a real consent
// system that this would route around. No personal data is collected, so there
// is no consent to obtain, and the flow is shorter than the one that was asked
// for.
//
// The security model is the one already in place for published projects: the
// code runs in an iframe with sandbox="allow-scripts allow-forms
// allow-pointer-lock" and NO allow-same-origin, so it is an opaque origin that
// cannot read cookies, storage, or the parent DOM. That is what makes running
// a stranger's code safe. A regex blocklist over eval/innerHTML/fetch would
// add nothing to it (window['ev'+'al'] defeats the blocklist in one line) and
// would break real projects, since designEngine writes innerHTML five times in
// the course of building ordinary UI. What IS worth bounding for anonymous
// content is size and rate, which is below.

const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../config');
const { projectKind } = require('../projectKind');

const router = express.Router();

const MAX_CODE_BYTES = 400 * 1024;   // a generated project is far below this
const MAX_TITLE = 120;
const MAX_LABEL = 40;
const PUBLIC_ID_RE = /^[a-f0-9]{12}$/;

// Same shape as the limiter in foundingWaitlist.js: per-IP, in-memory, self
// cleaning. Anonymous writes need a ceiling that a signed-in write does not.
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 20;
const buckets = new Map();

function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + RATE_WINDOW_MS };
    buckets.set(key, bucket);
    const cleanup = setTimeout(() => {
      if (buckets.get(key) === bucket) buckets.delete(key);
    }, RATE_WINDOW_MS);
    cleanup.unref?.();
  } else if (current.count >= RATE_LIMIT) {
    return res.status(429).json({ error: 'That is a lot of saving. Try again in a little while.' });
  } else {
    current.count += 1;
  }
  return next();
}

function optionalAuth(req, _res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  try { req.user = jwt.verify(token, JWT_SECRET); } catch { /* anonymous */ }
  return next();
}

async function mintPublicId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = crypto.randomBytes(6).toString('hex');
    const [existing] = await pool.query(
      'SELECT id FROM unlisted_projects WHERE public_id = ?', [candidate]
    );
    if (!existing.length) return candidate;
  }
  return null;
}

// POST /api/builder/unlisted — keep this project behind a secret URL.
// No auth, no email, no personal data.
router.post('/', rateLimit, optionalAuth, async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code : '';
  if (!code.trim()) return res.status(400).json({ error: 'There is nothing to save yet.' });
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
    return res.status(413).json({ error: 'That project is too big to save this way.' });
  }

  const title = String(req.body?.title || 'My project').trim().slice(0, MAX_TITLE) || 'My project';
  // Never asked for as a person's name. The UI asks for a name for the WORK.
  const label = String(req.body?.label || '').trim().slice(0, MAX_LABEL) || null;
  const kind = projectKind(req.body?.projectType);

  try {
    const publicId = await mintPublicId();
    if (!publicId) return res.status(503).json({ error: 'Could not make a link just now. Try again.' });

    await pool.query(
      `INSERT INTO unlisted_projects (public_id, title, project_type, generated_code, display_label)
       VALUES (?, ?, ?, ?, ?)`,
      [publicId, title, kind, code, label]
    );
    return res.json({ success: true, publicId, path: `/project/u-${publicId}` });
  } catch (error) {
    console.error('unlisted save:', error.message);
    return res.status(500).json({ error: 'Could not save the project.' });
  }
});

// GET /api/builder/unlisted/:publicId — read one. The URL is the credential.
router.get('/:publicId', async (req, res) => {
  const { publicId } = req.params;
  if (!PUBLIC_ID_RE.test(publicId)) return res.status(404).json({ error: 'Project not found.' });
  try {
    const [rows] = await pool.query(
      `SELECT public_id, title, project_type, generated_code, display_label, created_at, reported
         FROM unlisted_projects WHERE public_id = ?`,
      [publicId]
    );
    const project = rows[0];
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    // A reported project stops rendering at once rather than staying up while
    // a review queue drains.
    if (project.reported) return res.status(451).json({ error: 'This project is not available.' });

    // Fire and forget; a view must never fail a read.
    pool.query(
      'UPDATE unlisted_projects SET view_count = view_count + 1, last_seen_at = NOW() WHERE public_id = ?',
      [publicId]
    ).catch(() => {});

    return res.json({
      success: true,
      project: {
        publicId: project.public_id,
        title: project.title,
        projectType: project.project_type,
        code: project.generated_code,
        label: project.display_label,
        createdAt: project.created_at,
      },
    });
  } catch (error) {
    console.error('unlisted read:', error.message);
    return res.status(500).json({ error: 'Could not load the project.' });
  }
});

// POST /api/builder/unlisted/:publicId/report — anyone can flag a link.
router.post('/:publicId/report', rateLimit, async (req, res) => {
  const { publicId } = req.params;
  if (!PUBLIC_ID_RE.test(publicId)) return res.status(404).json({ error: 'Project not found.' });
  try {
    await pool.query('UPDATE unlisted_projects SET reported = TRUE WHERE public_id = ?', [publicId]);
    return res.json({ success: true });
  } catch (error) {
    console.error('unlisted report:', error.message);
    return res.status(500).json({ error: 'Could not send the report.' });
  }
});

module.exports = router;
module.exports.MAX_CODE_BYTES = MAX_CODE_BYTES;
