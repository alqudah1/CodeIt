'use strict';

// ── The emails that go out on their own ─────────────────────────────────────
//
// The Parent page promises "this page in your inbox every week", and until
// 30 October 2026 the only thing that sent it was a button on the admin
// dashboard that a person had to remember to press. A promise kept by memory
// is a promise that breaks the first busy week.
//
// Vercel calls these on a schedule (vercel.json, "crons"): the weekly email
// on Sunday evening UTC, the monthly one on the 28th. Both senders are
// idempotent, which the docs ask for: each learner's send is logged by
// period, so a repeated or late invocation sends nothing twice.
//
// Vercel sends `Authorization: Bearer <CRON_SECRET>` when that variable is
// set on the project. Without it nothing here runs, and the answer says so,
// because an unguarded URL that emails every family is not something to
// leave lying around.
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs

const crypto = require('crypto');
const express = require('express');

const router = express.Router();

function sameSecret(given, expected) {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(String(expected || ''));
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

function requireCronSecret(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    console.error('cron: CRON_SECRET is not set (or is under 16 characters), so scheduled emails are off');
    return res.status(503).json({ error: 'CRON_SECRET is not set on this project, so scheduled emails are off.' });
  }
  const header = String(req.get('Authorization') || '');
  if (!sameSecret(header, `Bearer ${secret}`)) return res.status(401).json({ error: 'Not authorised.' });
  return next();
}

router.get('/weekly-digest', requireCronSecret, async (req, res) => {
  const { sendWeeklyDigests } = require('../digestSender');
  try {
    const outcome = await sendWeeklyDigests({ dryRun: req.query.dry === '1' });
    console.log(`cron: weekly digest ${JSON.stringify(outcome)}`);
    res.json({ success: true, ...outcome });
  } catch (error) {
    console.error('cron/weekly-digest:', error.message);
    res.status(500).json({ error: 'Could not send the weekly emails.' });
  }
});

router.get('/monthly-digest', requireCronSecret, async (req, res) => {
  const { sendMonthlyDigests } = require('../digestSender');
  try {
    const outcome = await sendMonthlyDigests({ dryRun: req.query.dry === '1' });
    console.log(`cron: monthly digest ${JSON.stringify(outcome)}`);
    res.json({ success: true, ...outcome });
  } catch (error) {
    console.error('cron/monthly-digest:', error.message);
    res.status(500).json({ error: 'Could not send the monthly emails.' });
  }
});

module.exports = router;
