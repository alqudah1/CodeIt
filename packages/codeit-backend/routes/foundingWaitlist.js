'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { recordEvent } = require('../analytics');
const { isFoundingWaitlistReady, saveFoundingFamilyLead } = require('../foundingWaitlist');
const { normalizeFoundingLead } = require('../foundingWaitlistUtils');
const { normalizeJourneyId } = require('../analyticsEvents');

const router = express.Router();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const buckets = new Map();

router.get('/status', async (req, res) => {
  res.json({ ready: await isFoundingWaitlistReady() });
});

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) req.user = user;
    next();
  });
}

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
    return res.status(429).json({ error: 'Too many waitlist requests. Please try again later.' });
  } else {
    current.count += 1;
  }

  next();
}

router.post('/', rateLimit, optionalAuth, async (req, res) => {
  // A hidden field gives basic bot protection without collecting extra visitor data.
  if (String(req.body?.company || '').trim()) {
    return res.status(202).json({ saved: true });
  }

  const normalized = normalizeFoundingLead(req.body);
  if (normalized.error) {
    return res.status(400).json({ error: normalized.error });
  }

  const saved = await saveFoundingFamilyLead({
    ...normalized.value,
    userId: req.user?.user_id,
  });
  if (!saved) {
    return res.status(503).json({ error: 'We could not save your interest just now.' });
  }

  await recordEvent('pricing_interest', {
    userId: req.user?.user_id,
    journeyId: normalizeJourneyId(req.get('X-CodeIt-Journey')),
    meta: 'founding-family',
  });

  return res.status(201).json({ saved: true });
});

module.exports = router;
