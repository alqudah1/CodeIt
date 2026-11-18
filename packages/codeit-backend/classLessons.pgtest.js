'use strict';

// ── A teacher sees the Python lessons a class has done, against a real Postgres
// A Head of Computing asked why his classroom showed no progress for the
// Python lessons (18 November 2026). The rows were there; no page read them.

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
const DB_URL = process.env.DATABASE_URL || '';
const HAS_PG = /@(localhost|127\.0\.0\.1)[:/]/.test(DB_URL);

test('the board and a child\'s page show lessons finished, the one in hand and quiz scores, to the teacher only', { skip: !HAS_PG && 'no local Postgres' }, async () => {
  const pool = require('./db');
  const stamp = Date.now().toString(36);
  const person = async (name, role) => {
    const [made] = await pool.query(`INSERT INTO Users (username, name, password, role) VALUES (?, ?, 'x', ?)`, [`${name.toLowerCase()}_${stamp}`, name, role]);
    return made.insertId;
  };
  const teacher = await person('Teacher', 'Student');
  const ada = await person('Ada', 'student');
  const ben = await person('Ben', 'student');
  const cal = await person('Cal', 'student');
  // A code as the board prints them: letters, then two digits.
  const letters = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('');
  const code = `T${letters}${Math.floor(10 + Math.random() * 89)}`;
  const [klass] = await pool.query('INSERT INTO classes (code, name, owner_id) VALUES (?, ?, ?)', [code, 'Year 9', teacher]);
  for (const id of [ada, ben, cal]) await pool.query('INSERT INTO class_members (class_id, user_id) VALUES (?, ?)', [klass.insertId, id]);

  // Ada: lessons 1 and 2 finished, lesson 3 up to its fourth step (the third only
  // explains, so it leaves no row), a power, two goes at quiz 1.
  await pool.query('INSERT INTO Student_Lesson_Progress (user_id, lesson_id, xp_earned) VALUES (?, 1, 50), (?, 2, 50), (?, 101, 40)', [ada, ada, ada]);
  for (const [lesson, step] of [[1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [3, 3]]) await pool.query('INSERT INTO lesson_step_xp (user_id, lesson_id, step_index, xp_earned) VALUES (?, ?, ?, 5)', [ada, lesson, step]);
  await pool.query('INSERT INTO lesson_step_xp (user_id, lesson_id, step_index, xp_earned) VALUES (?, 0, 321, 15)', [ada]);   // a daily quest
  await pool.query('INSERT INTO Student_Quiz_Attempt (student_id, quiz_id, correct_count, total_questions, xp_earned) VALUES (?, 1, 2, 4, 10), (?, 1, 4, 4, 0)', [ada, ada]);
  // Ben: one step into lesson 1, nothing finished. Cal: joined, nothing else.
  await pool.query('INSERT INTO lesson_step_xp (user_id, lesson_id, step_index, xp_earned) VALUES (?, 1, 0, 5)', [ben]);

  const app = express(); app.use(express.json()); app.use('/api/class', require('./routes/class'));
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/class/${code}`;
  const as = (id) => ({ Authorization: `Bearer ${jwt.sign({ user_id: id, role: 'student' }, process.env.JWT_SECRET)}` });
  try {
    const [[{ n: courseLength }]] = await pool.query('SELECT COUNT(*) AS n FROM lessons WHERE id >= 1 AND id <= 100');
    const [[first]] = await pool.query('SELECT title FROM lessons WHERE id = 1');
    const [[third]] = await pool.query('SELECT title FROM lessons WHERE id = 3');

    // The teacher's board.
    const board = await (await fetch(base, { headers: as(teacher) })).json();
    assert.equal(board.owner, true);
    assert.equal(board.lessonsTotal, Number(courseLength));
    const row = (name) => board.members.find((m) => m.name === name);
    assert.equal(row('Ada').lessons.lessons, 2);
    assert.ok(row('Ada').lessons.lastLessonAt);
    assert.deepEqual([row('Ada').lessons.now.id, row('Ada').lessons.now.title, row('Ada').lessons.now.step], [3, third.title, 4]);
    assert.equal(row('Ben').lessons.lessons, 0);
    assert.deepEqual([row('Ben').lessons.now.id, row('Ben').lessons.now.title, row('Ben').lessons.now.step], [1, first.title, 1]);
    assert.deepEqual(row('Cal').lessons, { lessons: 0, lastLessonAt: null, now: null });

    // The room: a child in the class, and someone with no sign-in, see the board as it was.
    for (const headers of [as(ben), {}]) {
      const room = await (await fetch(base, { headers })).json();
      assert.equal(room.owner, false);
      assert.equal('lessonsTotal' in room, false);
      for (const m of room.members) assert.equal('lessons' in m, false, 'how far a child has got is not for the room');
    }

    // Ada's page, for her teacher.
    const page = await (await fetch(`${base}/student/${ada}`, { headers: as(teacher) })).json();
    assert.equal(page.lessons.total, Number(courseLength));
    assert.deepEqual(page.lessons.finished.map((l) => l.id), [1, 2]);
    assert.equal(page.lessons.finished[0].title, first.title);
    assert.ok(page.lessons.finished[0].completedAt);
    assert.deepEqual([page.lessons.now.id, page.lessons.now.step], [3, 4]);
    assert.deepEqual(page.lessons.quizzes.map((q) => [q.quizId, q.right, q.total, q.tries]), [[1, 4, 4, 2]]);
    assert.deepEqual(page.done, ['numbers'], 'the power is still a power, not a lesson');

    // Nobody but the teacher opens a child's page.
    assert.equal((await fetch(`${base}/student/${ada}`, { headers: as(ben) })).status, 403);
  } finally {
    server.close();
    for (const id of [ada, ben, cal]) {
      await pool.query('DELETE FROM Student_Quiz_Attempt WHERE student_id = ?', [id]).catch(() => {});
      await pool.query('DELETE FROM lesson_step_xp WHERE user_id = ?', [id]).catch(() => {});
      await pool.query('DELETE FROM Student_Lesson_Progress WHERE user_id = ?', [id]).catch(() => {});
    }
    await pool.query('DELETE FROM class_members WHERE class_id = ?', [klass.insertId]).catch(() => {});
    await pool.query('DELETE FROM classes WHERE id = ?', [klass.insertId]).catch(() => {});
    for (const id of [ada, ben, cal, teacher]) await pool.query('DELETE FROM Users WHERE user_id = ?', [id]).catch(() => {});
  }
});
