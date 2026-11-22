'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { NOTHING, lessonsByChild, lessonsForChild } = require('./classProgress');

// A teacher asked why his classroom showed no progress for the Python
// lessons (18 November 2026). These are the facts the class page now shows.

const TITLES = new Map([[1, 'Hello Python!'], [2, 'Storing Info with Variables'], [3, 'Strings'], [4, 'Making Decisions with If Statements']]);
const at = (minute) => `2026-11-18T13:${String(minute).padStart(2, '0')}:00.000Z`;

test('the board: lessons finished, when the last one was, and the one in hand', () => {
  const done = [
    { user_id: 7, lesson_id: 1, completed_at: at(5) },
    { user_id: 7, lesson_id: 2, completed_at: at(20) },
    { user_id: 8, lesson_id: 1, completed_at: at(9) },
  ];
  const steps = [
    { user_id: 7, lesson_id: 1, furthest: 6, at: at(5) }, // finished: not "in hand"
    { user_id: 7, lesson_id: 3, furthest: 3, at: at(31) },  // step_index 3 is the fourth step
    { user_id: 9, lesson_id: 1, furthest: 0, at: at(12) }, // started, nothing finished yet
  ];
  const by = lessonsByChild(done, steps, TITLES);
  assert.deepEqual(by.get(7), { lessons: 2, lastLessonAt: at(20), now: { id: 3, title: 'Strings', step: 4, at: at(31) } });
  assert.deepEqual(by.get(8), { lessons: 1, lastLessonAt: at(9), now: null });
  assert.deepEqual(by.get(9), { lessons: 0, lastLessonAt: null, now: { id: 1, title: 'Hello Python!', step: 1, at: at(12) } });
  // A child with no rows is not in the map; the route gives them NOTHING.
  assert.equal(by.get(10), undefined);
  assert.deepEqual(NOTHING, { lessons: 0, lastLessonAt: null, now: null });
});

test('powers and the daily quest are not Python lessons', () => {
  const by = lessonsByChild(
    [{ user_id: 7, lesson_id: 101, completed_at: at(1) }, { user_id: 7, lesson_id: 112, completed_at: at(2) }],
    [{ user_id: 7, lesson_id: 0, furthest: 321, at: at(3) }],
    TITLES,
  );
  assert.equal(by.get(7), undefined);
});

test('two lessons started and not finished: the one touched last is the one in hand', () => {
  const by = lessonsByChild([], [{ user_id: 7, lesson_id: 2, furthest: 5, at: at(10) }, { user_id: 7, lesson_id: 4, furthest: 1, at: at(40) }], TITLES);
  assert.deepEqual(by.get(7).now, { id: 4, title: 'Making Decisions with If Statements', step: 2, at: at(40) });
});

test("one child's page: every lesson in order, the one in hand, the best go at each quiz", () => {
  const page = lessonsForChild(
    [{ lesson_id: 2, completed_at: at(20) }, { lesson_id: 1, completed_at: at(5) }, { lesson_id: 103, completed_at: at(21) }],
    [{ lesson_id: 2, furthest: 6, at: at(20) }, { lesson_id: 3, furthest: 2, at: at(31) }],
    [
      { quiz_id: 1, correct_count: 2, total_questions: 4, completed_at: at(6) },
      { quiz_id: 1, correct_count: 4, total_questions: 4, completed_at: at(8) },
      { quiz_id: 1, correct_count: 3, total_questions: 4, completed_at: at(9) },
      { quiz_id: 2, correct_count: 1, total_questions: 4, completed_at: at(22) },
      { quiz_id: 9, correct_count: 0, total_questions: 0, completed_at: at(23) },   // nothing was asked: not a go
    ],
    TITLES,
  );
  assert.deepEqual(page.finished, [
    { id: 1, title: 'Hello Python!', completedAt: at(5) },
    { id: 2, title: 'Storing Info with Variables', completedAt: at(20) },
  ]);
  assert.deepEqual(page.now, { id: 3, title: 'Strings', step: 3, at: at(31) });
  assert.deepEqual(page.quizzes, [
    { quizId: 1, title: 'Hello Python!', right: 4, total: 4, at: at(8), tries: 3 },
    { quizId: 2, title: 'Storing Info with Variables', right: 1, total: 4, at: at(22), tries: 1 },
  ]);
});

test('nothing done: empty lists, not an error', () => {
  assert.deepEqual(lessonsForChild(), { finished: [], now: null, quizzes: [] });
  assert.equal(lessonsByChild().size, 0);
});

test('a row with no time on it is still a finished lesson, with no date invented for it', () => {
  const page = lessonsForChild([{ lesson_id: 1, completed_at: null }], [], [], TITLES);
  assert.deepEqual(page.finished, [{ id: 1, title: 'Hello Python!', completedAt: null }]);
});

// 22 November 2026: on the live site a teacher's page for a pupil said "The
// Python lessons could not be read just now" every time. The one table this
// section reads that nothing else reads the same way is lesson_step_xp.
const { stepRowsFor } = require('./classProgress');

test('the steps are read with their times when the table has them', async () => {
  const asked = [];
  const query = async (sql, values) => { asked.push([sql, values]); return [[{ user_id: 7, lesson_id: 2, furthest: 3, last_step_at: '2026-11-20T10:00:00Z' }]]; };
  const rows = await stepRowsFor(query, [7, 8], () => {});
  assert.deepEqual(rows, [{ user_id: 7, lesson_id: 2, furthest: 3, at: '2026-11-20T10:00:00Z' }]);
  assert.equal(asked.length, 1);
  assert.match(asked[0][0], /MAX\(completed_at\) AS last_step_at/);
  assert.deepEqual(asked[0][1], [7, 8, 1, 100]);
});

test('if the times cannot be read the steps are read without them, and the log says why', async () => {
  const said = [];
  const query = async (sql) => {
    if (/completed_at/.test(sql)) throw new Error('column "completed_at" does not exist');
    return [[{ user_id: 7, lesson_id: 2, furthest: 3 }]];
  };
  const rows = await stepRowsFor(query, [7], (line) => said.push(line));
  assert.deepEqual(rows, [{ user_id: 7, lesson_id: 2, furthest: 3, at: null }]);
  assert.equal(said.length, 1);
  assert.match(said[0], /could not be read with their times \(column "completed_at" does not exist\)/);
  // And what is made of them still names the lesson and the step, with no time.
  const made = lessonsForChild([], rows, [], new Map([[2, 'Variables']]));
  assert.deepEqual(made.now, { id: 2, title: 'Variables', step: 4, at: null });
});

test('if the table cannot be read at all there are no steps, not no lessons', async () => {
  const said = [];
  const query = async () => { throw new Error('relation "lesson_step_xp" does not exist'); };
  const rows = await stepRowsFor(query, [7], (line) => said.push(line));
  assert.deepEqual(rows, []);
  assert.equal(said.length, 2);
  assert.match(said[1], /could not be read at all \(relation "lesson_step_xp" does not exist\)/);
  // A finished lesson is still shown.
  const made = lessonsForChild([{ user_id: 7, lesson_id: 1, completed_at: '2026-11-20T10:00:00Z' }], rows, [], new Map([[1, 'Hello Python!']]));
  assert.equal(made.finished.length, 1);
  assert.equal(made.now, null);
});

test('nobody to ask about means nothing is asked', async () => {
  let asked = 0;
  assert.deepEqual(await stepRowsFor(async () => { asked += 1; return [[]]; }, [], () => {}), []);
  assert.equal(asked, 0);
});
