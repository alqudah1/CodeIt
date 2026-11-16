'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { streakFrom, streakMoments, nextLessonFrom, questFor, levelFor, QUESTS, LEVELS } = require('./today');

// 2026-10-21 is a Wednesday.
const WED = '2026-10-21T15:00:00Z';

test('a child who made something today, yesterday and the day before has a three day streak', () => {
  const r = streakFrom(['2026-10-21T09:00:00Z', '2026-10-20T16:00:00Z', '2026-10-19T10:00:00Z'], WED);
  assert.deepEqual(r, { streak: 3, builtToday: true, lastDay: '2026-10-21' });
});

test('nothing yet today keeps yesterday\'s streak alive, and says the build is still to do', () => {
  const r = streakFrom(['2026-10-20T16:00:00Z', '2026-10-19T10:00:00Z'], WED);
  assert.equal(r.streak, 2);
  assert.equal(r.builtToday, false);
});

test('a weekend never breaks a streak: Friday then Monday is two days', () => {
  const mon = '2026-10-19T12:00:00Z';
  assert.equal(streakFrom(['2026-10-16T12:00:00Z', '2026-10-19T09:00:00Z'], mon).streak, 2);
  // and a game made on Saturday counts as a day too
  assert.equal(streakFrom(['2026-10-16T12:00:00Z', '2026-10-17T12:00:00Z', '2026-10-19T09:00:00Z'], mon).streak, 3);
});

test('skipping a Tuesday ends the streak; two publishes in one day are one day', () => {
  assert.equal(streakFrom(['2026-10-21T09:00:00Z', '2026-10-19T10:00:00Z'], WED).streak, 1);
  assert.equal(streakFrom(['2026-10-21T09:00:00Z', '2026-10-21T18:00:00Z'], WED).streak, 1);
  assert.deepEqual(streakFrom([], WED), { streak: 0, builtToday: false, lastDay: null });
  assert.equal(streakFrom(['not a date'], WED).streak, 0);
});

test('the quest of the day is the same for everyone and different from yesterday\'s', () => {
  const a = questFor('2026-10-21T08:00:00Z'), b = questFor('2026-10-21T23:00:00Z'), c = questFor('2026-10-22T08:00:00Z');
  assert.equal(a.text, b.text);
  assert.notEqual(a.text, c.text);
  assert.ok(QUESTS.length >= 14);
  for (const q of QUESTS) { assert.match(q.text, /\.$/); assert.ok(!/[!—–]/.test(q.text)); assert.ok(q.prompt.length > 10); }
});

test('levels cut total XP, and the next threshold is honest', () => {
  assert.deepEqual(levelFor(0), { n: 1, title: 'Beginner', xp: 0, next: 200, toNext: 200 });
  assert.deepEqual(levelFor(420), { n: 2, title: 'Explorer', xp: 420, next: 500, toNext: 80 });
  assert.equal(levelFor(5000).n, 9);
  assert.equal(levelFor(7000).n, 10);
  assert.equal(levelFor(7000).next, null);
  assert.equal(levelFor('junk').n, 1);
  assert.equal(LEVELS.length, 10);
});

test('the today route is mounted and asks for nothing that does not exist', () => {
  const src = require('fs').readFileSync(`${__dirname}/test-quiz.js`, 'utf8');
  assert.match(src, /app\.use\('\/api\/today', todayRoutes\)/);
  const route = require('fs').readFileSync(`${__dirname}/routes/today.js`, 'utf8');
  assert.match(route, /FROM ai_projects/);
  assert.doesNotMatch(route, /CREATE TABLE|ALTER TABLE/i);
});

// ── "Do one and today counts" ───────────────────────────────────────────────
//
// Home offers three things a day: a game, the Python quest, a lesson. Until
// 16 November 2026 the lesson was ticked and the streak did not move.

test('a finished lesson keeps the streak, like a game or a Python quest', () => {
  const lessons = [{ completed_at: '2026-10-21T09:00:00Z' }];
  assert.deepEqual(streakFrom(streakMoments({ lessons }), WED), { streak: 1, builtToday: true, lastDay: '2026-10-21' });
});

test('a game on Monday, a quest on Tuesday and a lesson on Wednesday are three days in a row', () => {
  const moments = streakMoments({
    made: [{ created_at: '2026-10-19T10:00:00Z' }],
    questDays: ['2026-10-20'],
    lessons: [{ completed_at: new Date('2026-10-21T09:00:00Z') }],
  });
  assert.equal(streakFrom(moments, WED).streak, 3);
});

test('a lesson row with no time on it is not a day in 1970', () => {
  const moments = streakMoments({ lessons: [{ completed_at: null }, { completed_at: undefined }] });
  assert.deepEqual(moments, []);
  assert.deepEqual(streakFrom(moments, WED), { streak: 0, builtToday: false, lastDay: null });
});

test('both places that work out a streak count lessons', () => {
  const route = fs.readFileSync(path.join(__dirname, 'routes', 'today.js'), 'utf8');
  assert.equal((route.match(/streakFrom\(streakMoments\(\{ made, questDays, lessons: await lessonMoments\(userId\) \}\)\)/g) || []).length, 2);
  assert.match(route, /SELECT completed_at FROM Student_Lesson_Progress WHERE user_id = \? AND completed_at IS NOT NULL/);
});

test('the next lesson is the first one not finished, with its real title and XP', () => {
  const course = [{ id: 1, title: 'Hello Python!', xp: 50 }, { id: 2, title: 'Variables', xp: 50 }, { id: 3, title: 'Strings', xp: 60 }];
  assert.deepEqual(nextLessonFrom(course, []), { id: 1, title: 'Hello Python!', xp: 50 });
  assert.deepEqual(nextLessonFrom(course, [1, '2']), { id: 3, title: 'Strings', xp: 60 });
  // One done out of order does not move a child past the gap.
  assert.deepEqual(nextLessonFrom(course, [1, 3]), { id: 2, title: 'Variables', xp: 50 });
  // The whole course done: nothing is next.
  assert.equal(nextLessonFrom(course, [1, 2, 3]), null);
});
