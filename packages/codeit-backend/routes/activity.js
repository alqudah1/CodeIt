'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { recordUserActivity } = require('../userActivity');

const router = express.Router();

router.post('/ping', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Sign in to record activity.' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const recorded = await recordUserActivity(payload.user_id, 'visit');
    if (!recorded) return res.status(503).json({ error: 'Activity tracking is temporarily unavailable.' });
    return res.json({ ok: true });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
});

module.exports = router;
