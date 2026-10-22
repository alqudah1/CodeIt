'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { streakFrom, questFor, levelFor, QUESTS, LEVELS } = require('./today');

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
  assert.deepEqual(levelFor(0), { n: 1, title: 'Rookie', xp: 0, next: 100, toNext: 100 });
  assert.deepEqual(levelFor(420), { n: 4, title: 'Game Designer', xp: 420, next: 600, toNext: 180 });
  assert.equal(levelFor(5000).n, 7);
  assert.equal(levelFor(5000).next, null);
  assert.equal(levelFor('junk').n, 1);
  assert.equal(LEVELS.length, 7);
});

test('the today route is mounted and asks for nothing that does not exist', () => {
  const src = require('fs').readFileSync(`${__dirname}/test-quiz.js`, 'utf8');
  assert.match(src, /app\.use\('\/api\/today', todayRoutes\)/);
  const route = require('fs').readFileSync(`${__dirname}/routes/today.js`, 'utf8');
  assert.match(route, /FROM ai_projects/);
  assert.doesNotMatch(route, /CREATE TABLE|ALTER TABLE/i);
});
