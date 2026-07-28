'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { getFunnelReport, recordEvent } = require('../analytics');
const { getAIUsageReport } = require('../aiUsage');
const {
  CLIENT_REPORTED_EVENTS,
  normalizeEventName,
  eventRequiresMeta,
  normalizeMeta,
  normalizeJourneyId,
} = require('../analyticsEvents');

const router = express.Router();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 30;
const buckets = new Map();

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Admin authentication required.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || String(user?.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    req.user = user;
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
    return res.status(429).json({ error: 'Too many analytics requests.' });
  } else {
    current.count += 1;
  }

  if (buckets.size > 1000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  next();
}

router.get('/funnel', requireAdmin, async (req, res) => {
  const report = await getFunnelReport(req.query.days);
  if (!report) return res.status(503).json({ error: 'Analytics report is unavailable.' });
  return res.json(report);
});

router.get('/costs', requireAdmin, async (req, res) => {
  const report = await getAIUsageReport(req.query.days);
  if (!report) return res.status(503).json({ error: 'AI usage report is unavailable.' });
  return res.json(report);
});

router.post('/event', rateLimit, optionalAuth, async (req, res) => {
  const eventName = normalizeEventName(req.body?.event_name);
  if (!eventName || !CLIENT_REPORTED_EVENTS.has(eventName)) {
    return res.status(400).json({ error: 'Unsupported analytics event.' });
  }

  const meta = normalizeMeta(eventName, req.body?.meta);
  const requiresMeta = eventRequiresMeta(eventName);
  if (requiresMeta && !meta) {
    return res.status(400).json({ error: 'Unsupported analytics metadata.' });
  }

  const recorded = await recordEvent(eventName, {
    userId: req.user?.user_id,
    journeyId: normalizeJourneyId(req.get('X-CodeIt-Journey')),
    meta,
  });

  return res.status(recorded ? 202 : 503).json({ accepted: recorded });
});

module.exports = router;
