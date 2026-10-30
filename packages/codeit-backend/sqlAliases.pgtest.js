'use strict';

// ── Postgres folds unquoted aliases to lower case ───────────────────────────
//
// "SELECT ... AS maxNum" comes back as row.maxnum on Postgres, which is the
// live database. Two places read the camelCase name and got undefined:
// version saves (NaN, every one failed) and the profile's recent milestones
// (every one labelled "Milestone"). These run the real code on a local
// Postgres. Skipped without one.

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-key';
const DB_URL = process.env.DATABASE_URL || '';
const HAS_PG = /@(localhost|127\.0\.0\.1)[:/]/.test(DB_URL);

test('a saved project gets version 1, then 2, on Postgres', { skip: !HAS_PG && 'no local Postgres' }, async () => {
  const pool = require('./db');
  const router = require('./routes/builder');
  const stamp = Date.now().toString(36);
  const [user] = await pool.query(`INSERT INTO Users (username, name, password, role) VALUES (?, ?, 'x', 'Student')`, [`v_${stamp}`, 'V']);
  const token = jwt.sign({ user_id: user.insertId, role: 'Student' }, process.env.JWT_SECRET);
  const app = express(); app.use(express.json()); app.use('/api/builder', router);
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const code = '<!doctype html><html><body><h1>Bunny Catch</h1><script>let score = 0;</script></body></html>';
    const made = await (await fetch(`${base}/api/builder/projects`, { method: 'POST', headers, body: JSON.stringify({ title: 'Bunny Catch', prompt: 'a bunny', generated_code: code, project_type: 'game' }) })).json();
    assert.equal(made.success, true);
    for (const expected of [1, 2]) {
      const res = await fetch(`${base}/api/builder/projects/${made.project.id}/versions`, { method: 'POST', headers, body: JSON.stringify({ generated_code: code, title: 'Bunny Catch', label: 'Saved changes' }) });
      const body = await res.json();
      assert.equal(res.status, 201, JSON.stringify(body));
      assert.equal(body.version_num, expected);
    }
  } finally {
    server.close();
  }
});

test('recent milestones come back with eventType, so the profile can label them', { skip: !HAS_PG && 'no local Postgres' }, async () => {
  const pool = require('./db');
  const { getProgressSummary, EVENT_LABELS } = require('./progressNotifications');
  const stamp = `${Date.now().toString(36)}m`;
  const [user] = await pool.query(`INSERT INTO Users (username, name, password, role) VALUES (?, ?, 'x', 'Student')`, [`m_${stamp}`, 'M']);
  await pool.query(
    `INSERT INTO student_milestones (user_id, event_type, event_key, title, detail) VALUES (?, 'lesson_completed', 'lesson-1', 'Hello Python', 'lesson 1')`,
    [user.insertId]
  );
  const summary = await getProgressSummary(user.insertId);
  assert.equal(summary.counts.lessons, 1);
  assert.equal(summary.recent[0].eventType, 'lesson_completed');
  assert.ok(EVENT_LABELS[summary.recent[0].eventType], 'the label lookup works');
  assert.equal(summary.recent[0].title, 'Hello Python');
});
