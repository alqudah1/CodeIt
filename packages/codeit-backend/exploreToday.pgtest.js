'use strict';

// ── Today's build on Explore, against a real Postgres ───────────────────────
// Entries are public projects made today from today's quest sentence. Not a
// different sentence, not yesterday's, not a private one.

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
const DB_URL = process.env.DATABASE_URL || '';
const HAS_PG = /@(localhost|127\.0\.0\.1)[:/]/.test(DB_URL);

test('only public games made today from today\'s sentence are entries', { skip: !HAS_PG && 'no local Postgres' }, async () => {
  const pool = require('./db');
  const { questFor } = require('./today');
  const quest = questFor();
  const stamp = Date.now().toString(36);
  const [user] = await pool.query(`INSERT INTO Users (username, name, password, role) VALUES (?, ?, 'x', 'Student')`, [`q_${stamp}`, 'Q']);
  let n = 0;
  const add = (title, prompt, isPublic, when) => pool.query(
    `INSERT INTO ai_projects (user_id, title, prompt, generated_code, project_type, public_id, is_public, created_at)
     VALUES (?, ?, ?, '<html>g</html>', 'game', ?, ?, ${when})`,
    [user.insertId, title, prompt, `t${stamp}${(n += 1)}`.slice(0, 20), isPublic]
  );
  await add(`Today ${stamp}`, `  ${quest.prompt.toUpperCase()} `, 1, 'NOW()');
  await add(`Private ${stamp}`, quest.prompt, 0, 'NOW()');
  await add(`Other ${stamp}`, 'a different idea', 1, 'NOW()');
  await add(`Yesterday ${stamp}`, quest.prompt, 1, "NOW() - INTERVAL '2 days'");

  const app = express(); app.use('/api/explore', require('./routes/explore'));
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  try {
    const body = await (await fetch(`http://127.0.0.1:${server.address().port}/api/explore`)).json();
    assert.equal(body.today.quest.prompt, quest.prompt);
    const mine = body.today.entries.map((e) => e.title).filter((t) => t.endsWith(stamp));
    assert.deepEqual(mine, [`Today ${stamp}`]);
    assert.ok(body.today.entries.length <= 4);
    assert.ok(body.today.count >= 1, 'the count is a number from the database');
  } finally {
    server.close();
  }
});
