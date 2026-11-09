'use strict';

// ── The daily Python quest, against a real Postgres ─────────────────────────
// The quest is in /api/today, turning it in pays 15 XP once, counts for the
// streak, and shows up as a milestone the parent's email can read.

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
const DB_URL = process.env.DATABASE_URL || '';
const HAS_PG = /@(localhost|127\.0\.0\.1)[:/]/.test(DB_URL);

test('done once, paid once, streak counts it, parent summary lists it', { skip: !HAS_PG && 'no local Postgres' }, async () => {
  const pool = require('./db');
  const { pythonQuestFor } = require('./pythonQuests');
  const { getProgressSummary } = require('./progressNotifications');
  const stamp = Date.now().toString(36);
  const [user] = await pool.query(`INSERT INTO Users (username, name, password, role) VALUES (?, ?, 'x', 'Student')`, [`pq_${stamp}`, 'PQ']);
  await pool.query('INSERT INTO Students (user_id, total_xp) VALUES (?, 0)', [user.insertId]).catch(() => {});
  const token = jwt.sign({ user_id: user.insertId, role: 'Student' }, process.env.JWT_SECRET);
  const app = express(); app.use(express.json()); app.use('/api/today', require('./routes/today'));
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/today`;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  try {
    const quest = pythonQuestFor();
    const before = await (await fetch(base, { headers })).json();
    assert.equal(before.pythonQuest.id, quest.id);
    assert.equal(before.pythonQuest.done, false);
    assert.equal(before.streak, 0);

    // A guest sees the quest too.
    const guest = await (await fetch(base)).json();
    assert.equal(guest.pythonQuest.id, quest.id);

    // Wrong answer: refused, nothing recorded.
    const wrong = await fetch(`${base}/python-quest`, { method: 'POST', headers, body: JSON.stringify({ code: 'print(1)', output: '1' }) });
    assert.equal(wrong.status, 422);

    // The honest answer, by hand for this quest.
    const outputs = {
      'hello-name': 'Hello, Sam!', 'three-movies': 'Inception\nDune\nInterstellar', 'count-to-ten': '1\n2\n3\n4\n5\n6\n7\n8\n9\n10',
      'times-table': '5\n10\n15\n20\n25\n30\n35\n40\n45\n50', 'big-or-small': 'big', 'sum-list': '50', 'stars': '*\n**\n***\n****',
      'even-numbers': '2\n4\n6\n8\n10\n12\n14\n16\n18\n20', 'shout': 'PIZZA', 'countdown': '5\n4\n3\n2\n1\nGo!', 'password': 'Welcome',
      'length': '9', 'squares': '1\n4\n9\n16\n25\n36', 'greet-all': 'Hi Maya\nHi Leo\nHi Sam',
    };
    const first = await (await fetch(`${base}/python-quest`, { method: 'POST', headers, body: JSON.stringify({ code: quest.starter, output: outputs[quest.id] }) })).json();
    assert.deepEqual([first.ok, first.xpEarned, first.alreadyDone, first.streak], [true, 15, false, 1]);
    const again = await (await fetch(`${base}/python-quest`, { method: 'POST', headers, body: JSON.stringify({ code: quest.starter, output: outputs[quest.id] }) })).json();
    assert.deepEqual([again.ok, again.xpEarned, again.alreadyDone], [true, 0, true]);

    const after = await (await fetch(base, { headers })).json();
    assert.equal(after.pythonQuest.done, true);
    assert.equal(after.builtToday, true);
    assert.equal(after.streak, 1);
    assert.equal(after.level.xp, 15, 'the XP is in the one total everything reads');

    const summary = await getProgressSummary(user.insertId);
    assert.equal(summary.recent[0].eventType, 'python_quest');
    assert.equal(require('./progressEmail').EVENT_LABELS.python_quest, 'Daily Python quest done');
  } finally {
    server.close();
  }
});

test("today's three goals each come back on their own", { skip: !HAS_PG && 'no local Postgres' }, async () => {
  const pool = require('./db');
  const stamp = Date.now().toString(36);
  const [user] = await pool.query(`INSERT INTO Users (username, name, password, role) VALUES (?, ?, 'x', 'Student')`, [`gl_${stamp}`, 'GL']);
  const userId = user.insertId;
  await pool.query('INSERT INTO Students (user_id, total_xp) VALUES (?, 0)', [userId]).catch(() => {});
  const token = jwt.sign({ user_id: userId, role: 'Student' }, process.env.JWT_SECRET);
  const app = express(); app.use(express.json()); app.use('/api/today', require('./routes/today'));
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/today`;
  const headers = { Authorization: `Bearer ${token}` };
  try {
    let t = await (await fetch(base, { headers })).json();
    assert.deepEqual([t.gameToday, t.pythonQuest.done, t.lessonToday, t.builtToday], [false, false, false, false]);
    await pool.query('INSERT INTO Student_Lesson_Progress (user_id, lesson_id, xp_earned) VALUES (?, 1, 50)', [userId]);
    t = await (await fetch(base, { headers })).json();
    assert.deepEqual([t.gameToday, t.lessonToday, t.builtToday], [false, true, false]);
  } finally {
    server.close();
    await pool.query('DELETE FROM Student_Lesson_Progress WHERE user_id = ?', [userId]).catch(() => {});
    await pool.query('DELETE FROM Students WHERE user_id = ?', [userId]).catch(() => {});
    await pool.query('DELETE FROM Users WHERE user_id = ?', [userId]).catch(() => {});
  }
});
