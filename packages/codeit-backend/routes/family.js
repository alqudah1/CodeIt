'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const {
  createManagedChild,
  deleteManagedChild,
  getFamilyStatus,
  requestAdultVerification,
  resetManagedChildPassword,
  setManagedProgressEmails,
  verifyAdultEmail,
} = require('../familyAccounts');
const { JWT_SECRET } = require('../config');
const { recordEvent } = require('../analytics');
const { normalizeJourneyId } = require('../analyticsEvents');
const {
  claimLegacyChild,
  getClaimPreview,
  requestLegacyReview,
} = require('../legacyParentReview');

const router = express.Router();
const requests = new Map();
const reviewRequests = new Map();

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Please sign in to use family controls.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (_) {
    res.status(403).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

function limited(req, res, next) {
  const now = Date.now();
  const key = `${req.user.user_id}:${req.path}`;
  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return next();
  }
  if (current.count >= 6) {
    return res.status(429).json({ error: 'Please wait before trying that again.' });
  }
  current.count += 1;
  next();
}

function limitedReviewRequest(req, res, next) {
  const now = Date.now();
  const key = `review:${req.ip}`;
  const current = reviewRequests.get(key);
  if (!current || current.resetAt <= now) {
    reviewRequests.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return next();
  }
  if (current.count >= 6) {
    return res.status(429).json({ error: 'Please wait before sending another parent review.' });
  }
  current.count += 1;
  next();
}

router.get('/', requireAuth, async (req, res) => {
  try {
    res.json({ success: true, ...(await getFamilyStatus(req.user.user_id)) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not load family controls.' });
  }
});

router.post('/verification', requireAuth, limited, async (req, res) => {
  try {
    res.json({ success: true, ...(await requestAdultVerification(req.user.user_id)) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not send confirmation.' });
  }
});

router.get('/verify/:token', async (req, res) => {
  try {
    const verified = await verifyAdultEmail(req.params.token);
    const destination = verified ? '/profile?familyVerified=1' : '/profile?familyVerified=0';
    res.redirect(302, destination);
  } catch (_) {
    res.redirect(302, '/profile?familyVerified=0');
  }
});

router.post('/legacy-review/request', limitedReviewRequest, async (req, res) => {
  try {
    const result = await requestLegacyReview(req.body.reviewToken, req.body.parentEmail);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not send the parent review.' });
  }
});

router.post('/legacy-review/preview', async (req, res) => {
  try {
    res.json({ success: true, ...(await getClaimPreview(req.body.claimToken)) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not open the parent review.' });
  }
});

router.post('/legacy-review/claim', requireAuth, limited, async (req, res) => {
  try {
    const result = await claimLegacyChild(req.user.user_id, req.body.claimToken, req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not connect the learner account.' });
  }
});

router.post('/children', requireAuth, limited, async (req, res) => {
  try {
    const child = await createManagedChild(req.user.user_id, req.body);
    void recordEvent('family_child_created', {
      userId: req.user.user_id,
      journeyId: normalizeJourneyId(req.get('X-CodeIt-Journey')),
    });
    res.status(201).json({ success: true, child, status: await getFamilyStatus(req.user.user_id) });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Could not create the managed profile.',
      field: error.field,
    });
  }
});

router.delete('/children/:id', requireAuth, limited, async (req, res) => {
  try {
    await deleteManagedChild(req.user.user_id, Number(req.params.id));
    res.json({ success: true, status: await getFamilyStatus(req.user.user_id) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not delete the managed profile.' });
  }
});

router.put('/children/:id/password', requireAuth, limited, async (req, res) => {
  try {
    await resetManagedChildPassword(req.user.user_id, Number(req.params.id), req.body.password);
    res.json({ success: true });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not update the learner password.' });
  }
});

router.put('/children/:id/progress-emails', requireAuth, limited, async (req, res) => {
  try {
    await setManagedProgressEmails(req.user.user_id, Number(req.params.id), req.body.enabled === true);
    res.json({ success: true, status: await getFamilyStatus(req.user.user_id) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not update progress emails.' });
  }
});

module.exports = router;
