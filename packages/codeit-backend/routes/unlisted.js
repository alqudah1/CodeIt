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
const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://codeitlearn.com').replace(/\/+$/, '');

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

// ── The optional grown-up email ─────────────────────────────────────────────
//
// Asked for AFTER the project is already saved, never before, and never as a
// condition of saving. If it is left blank the save has already happened and
// nothing changes.
//
// It does NOT write to adult_email_verifications. That table is keyed
// user_id NOT NULL PRIMARY KEY REFERENCES Users(user_id), so an anonymous
// save has no row to write; and its meaning is "the adult who owns account N
// confirmed this address", which an address typed by a stranger is not. See
// the migration for the full reasoning and the upgrade path.
//
// Double opt in, because a form that mails any address an anonymous visitor
// types is an abuse vector. One confirmation goes out, and nothing else until
// it is clicked.
router.post('/:publicId/email', rateLimit, async (req, res) => {
  const { publicId } = req.params;
  if (!PUBLIC_ID_RE.test(publicId)) return res.status(404).json({ error: 'Project not found.' });

  const email = String(req.body?.email || '').trim().toLowerCase();
  // Blank is a valid answer: the field is optional and the project is saved
  // either way. Say so plainly rather than returning an error.
  if (!email) return res.json({ success: true, skipped: true });
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'That does not look like an email address.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT public_id FROM unlisted_projects WHERE public_id = ?', [publicId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found.' });

    const confirmToken = crypto.randomBytes(32).toString('hex');
    const confirmHash = crypto.createHash('sha256').update(confirmToken).digest('hex');
    const unsubToken = crypto.randomBytes(32).toString('hex');

    await pool.query(
      `INSERT INTO project_link_emails (email, project_public_id, confirm_token_hash, unsubscribe_token)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (email, project_public_id) DO UPDATE
         SET confirm_token_hash = EXCLUDED.confirm_token_hash`,
      [email, publicId, confirmHash, unsubToken]
    );

    // The confirmation itself is sent by the existing mailer if one is
    // configured. When it is not, the honest answer is that nothing was sent,
    // rather than a claim that it was.
    let delivery = 'not_configured';
    try {
      const { sendMail } = require('../familyAccounts');
      if (typeof sendMail === 'function') {
        await sendMail({
          to: email,
          subject: 'Confirm you want this CodeIt project link',
          text: `Someone saved a project on CodeIt and asked us to send you the link.\n\n`
            + `Confirm to receive it: ${SITE_URL}/api/builder/unlisted/confirm/${confirmToken}\n\n`
            + `If that was not you, ignore this email and nothing further will be sent.`,
        });
        delivery = 'sent';
      }
    } catch (mailError) {
      console.error('unlisted email send:', mailError.message);
      delivery = 'failed';
    }

    return res.json({ success: true, delivery });
  } catch (error) {
    console.error('unlisted email:', error.message);
    return res.status(500).json({ error: 'Could not save that address.' });
  }
});

// GET /api/builder/unlisted/confirm/:token — the second half of the opt in.
router.get('/confirm/:token', async (req, res) => {
  const token = String(req.params.token || '');
  if (!/^[a-f0-9]{64}$/.test(token)) return res.status(404).send('Link not valid.');
  try {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const [result] = await pool.query(
      'UPDATE project_link_emails SET confirmed_at = NOW(), confirm_token_hash = NULL WHERE confirm_token_hash = ?',
      [hash]
    );
    if (!result.affectedRows) return res.status(404).send('That link has already been used.');
    return res.redirect(`${SITE_URL}/?confirmed=1`);
  } catch (error) {
    console.error('unlisted confirm:', error.message);
    return res.status(500).send('Could not confirm just now.');
  }
});

// GET /api/builder/unlisted/unsubscribe/:token — one click, always available.
router.get('/unsubscribe/:token', async (req, res) => {
  const token = String(req.params.token || '');
  if (!/^[a-f0-9]{64}$/.test(token)) return res.status(404).send('Link not valid.');
  try {
    await pool.query(
      'UPDATE project_link_emails SET unsubscribed_at = NOW(), confirmed_at = NULL WHERE unsubscribe_token = ?',
      [token]
    );
    return res.send('You will not receive any more CodeIt project emails.');
  } catch (error) {
    console.error('unlisted unsubscribe:', error.message);
    return res.status(500).send('Could not unsubscribe just now.');
  }
});

module.exports = router;
module.exports.MAX_CODE_BYTES = MAX_CODE_BYTES;
