'use strict';

// ── A quiz answer comes back with its reason, against a real Postgres ───────
// The schema and the questions here are the ones this repository's migrations
// build, which is as close to production as a test can stand. The route read
// the answer and never the explanation until 17 November 2026.

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
const DB_URL = process.env.DATABASE_URL || '';
const HAS_PG = /@(localhost|127\.0\.0\.1)[:/]/.test(DB_URL);

test('checking an answer says whether it was right, what was right, and why', { skip: !HAS_PG && 'no local Postgres' }, async () => {
  const pool = require('./db');
  const [rows] = await pool.query('SELECT question_id, option_a, option_b, option_c, option_d, correct_option, explanation FROM Quiz_Questions ORDER BY question_id LIMIT 1');
  assert.equal(rows.length, 1, 'the migrations put questions in');
  const q = rows[0];
  const options = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d };
  const right = options[String(q.correct_option).trim().toUpperCase()];
  const wrong = Object.values(options).find((text) => text !== right);
  assert.ok(q.explanation && q.explanation.trim().length > 10, 'the question has an explanation to send');

  const token = jwt.sign({ user_id: 1, role: 'Student' }, process.env.JWT_SECRET);
  const app = express(); app.use(express.json()); app.use('/api/quiz', require('./routes/quiz'));
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/quiz`;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const check = async (answer) => (await fetch(`${base}/check`, { method: 'POST', headers, body: JSON.stringify({ questionId: q.question_id, answer }) })).json();
  try {
    assert.deepEqual(await check(wrong), { correct: false, correctAnswerText: right, explanation: q.explanation.trim() });
    assert.deepEqual(await check(right), { correct: true, correctAnswerText: right, explanation: q.explanation.trim() });
    // Before an answer is given, neither the answer nor the reason is sent.
    const [first] = await pool.query('SELECT quiz_id FROM Quiz_Questions WHERE question_id = ?', [q.question_id]);
    const listed = await (await fetch(`${base}/${first[0].quiz_id}/questions`, { headers })).json();
    assert.ok(Array.isArray(listed) && listed.length > 0);
    for (const item of listed) assert.deepEqual(Object.keys(item).sort(), ['id', 'options', 'question']);
  } finally {
    server.close();
  }
});
