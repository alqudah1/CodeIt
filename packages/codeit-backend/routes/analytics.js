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
  normalizeCampaignCode,
} = require('../analyticsEvents');

const { createAddressLimiter } = require('../addressLimiter');

const router = express.Router();
// A minute's allowance for one browser, and for one address. A school is one
// address: see addressLimiter.js for what the old limit (30 a minute for the
// whole address) did to a class of thirty.
const RATE_WINDOW_MS = 60 * 1000;
const EVENTS_PER_BROWSER = 60;
const EVENTS_PER_ADDRESS = 1200;
const events = createAddressLimiter({ perBrowser: EVENTS_PER_BROWSER, perAddress: EVENTS_PER_ADDRESS, windowMs: RATE_WINDOW_MS });

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
  // The journey id names the browser. A browser that cannot keep one (storage
  // switched off, as some school machines have it) is named by who is signed
  // in, so a class of those is still thirty and not one.
  const journey = normalizeJourneyId(req.get('X-CodeIt-Journey'));
  const allowed = events.allow({
    address: req.ip || req.socket?.remoteAddress || 'unknown',
    browser: journey || (req.user?.user_id ? `user:${req.user.user_id}` : null),
  });
  if (!allowed) return res.status(429).json({ error: 'Too many analytics requests.' });
  return next();
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

router.post('/event', optionalAuth, rateLimit, async (req, res) => {
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
    campaignCode: normalizeCampaignCode(req.get('X-CodeIt-Campaign')),
    meta,
  });

  return res.status(recorded ? 202 : 503).json({ accepted: recorded });
});

module.exports = router;
