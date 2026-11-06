'use strict';

// ── The month's free builds used up: the parent is told, once ────────────────
// A child with a verified parent email asks the studio for an eleventh build
// in a month. The route answers 402 as before, and the grown-up gets one
// email with what Plus gives. A twelfth ask the same month sends nothing.

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
// Billing "configured" with fake test keys: the allowance check only reads the
// database, and no Stripe call is made on this path.
process.env.BILLING_ENABLED = 'true';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_PRICE_ID = 'price_fake';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake';
process.env.RESEND_API_KEY = 're_fake';
const DB_URL = process.env.DATABASE_URL || '';
const HAS_PG = /@(localhost|127\.0\.0\.1)[:/]/.test(DB_URL);

test('eleventh build: 402, one email to the parent, never a second that month', { skip: !HAS_PG && 'no local Postgres' }, async () => {
  const pool = require('./db');
  const stamp = Date.now().toString(36);
  const [user] = await pool.query(`INSERT INTO Users (username, name, password, role) VALUES (?, ?, 'x', 'Student')`, [`lim_${stamp}`, 'Sam']);
  const userId = user.insertId;
  await pool.query('INSERT INTO Students (user_id, total_xp) VALUES (?, 0)', [userId]).catch(() => {});
  await pool.query(
    `INSERT INTO parent_notification_preferences (user_id, parent_email, verified_at, unsubscribe_token_hash, notify_lessons, notify_exercises, notify_projects, notify_publishing, enabled)
     VALUES (?, ?, NOW(), 'h', 1, 1, 1, 0, 1)`,
    [userId, `parent_${stamp}@example.test`]
  );
  for (let i = 0; i < 10; i += 1) await pool.query('INSERT INTO ai_build_usage (user_id) VALUES (?)', [userId]);

  // Capture the one outbound email instead of sending it.
  const sent = [];
  const realFetch = global.fetch;
  global.fetch = async (url, init) => {
    if (String(url).includes('api.resend.com')) { sent.push(JSON.parse(init.body)); return { ok: true, json: async () => ({ id: 'msg_1' }) }; }
    return realFetch(url, init);
  };

  const token = jwt.sign({ user_id: userId, role: 'Student' }, process.env.JWT_SECRET);
  const app = express(); app.use(express.json()); app.use('/api/builder', require('./routes/builder'));
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/builder`;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const ask = () => realFetch(base, { method: 'POST', headers, body: JSON.stringify({ prompt: 'a game where a cat jumps over fences', type: 'game' }) });
  const settle = () => new Promise((r) => setTimeout(r, 400));
  try {
    const first = await ask();
    assert.equal(first.status, 402);
    assert.equal((await first.json()).code, 'FREE_AI_LIMIT_REACHED');
    await settle();
    const [rows] = await pool.query(`SELECT event_key, title, target_url FROM student_milestones WHERE user_id = ? AND event_type = 'ai_limit_reached'`, [userId]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].event_key, new Date().toISOString().slice(0, 7));
    assert.equal(rows[0].title, 'used all 10 free studio builds this month');
    assert.match(rows[0].target_url, /\/pricing\?utm_source=limit-email#codeit-plus$/);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to[0], `parent_${stamp}@example.test`);
    assert.equal(sent[0].subject, 'Sam used every free studio build this month');
    assert.match(sent[0].html, /See CodeIt Plus/);
    const [deliveries] = await pool.query(`SELECT status FROM parent_notification_deliveries WHERE parent_email = ?`, [`parent_${stamp}@example.test`]);
    assert.deepEqual(deliveries.map((d) => d.status), ['sent']);

    // The same month again: refused again, nothing more sent.
    const second = await ask();
    assert.equal(second.status, 402);
    await settle();
    assert.equal(sent.length, 1);
  } finally {
    global.fetch = realFetch;
    server.close();
    await pool.query('DELETE FROM parent_notification_deliveries WHERE parent_email = ?', [`parent_${stamp}@example.test`]).catch(() => {});
    await pool.query('DELETE FROM student_milestones WHERE user_id = ?', [userId]).catch(() => {});
    await pool.query('DELETE FROM ai_build_usage WHERE user_id = ?', [userId]).catch(() => {});
    await pool.query('DELETE FROM parent_notification_preferences WHERE user_id = ?', [userId]).catch(() => {});
    await pool.query('DELETE FROM Students WHERE user_id = ?', [userId]).catch(() => {});
    await pool.query('DELETE FROM Users WHERE user_id = ?', [userId]).catch(() => {});
    await pool.end?.().catch(() => {});
  }
});
