'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// ── The avatar is saved, and only what the lab can draw is saved ─────────────
//
// For as long as the Avatar Lab has existed it has PUT to /api/profile/character
// and GET from /api/profile, and neither route existed. Every avatar was reset
// on reload and every level display read an object that never arrived.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://x:y@localhost:1/none';

const { sanitiseCharacter, rowToCharacter } = require('./routes/profile');
const { UNDERSTANDING_XP, TOTAL_XP_SQL, TOTAL_XP_PARAMS } = require('./xpTotals');
const { PROJECT_XP } = (() => { try { return require('./projectRewards'); } catch { return {}; } })();

test('the profile route is mounted', () => {
  const src = require('fs').readFileSync(`${__dirname}/test-quiz.js`, 'utf8');
  assert.match(src, /app\.use\('\/api\/profile', profileRoutes\)/);
});

test('a PUT can only store values the lab can draw', () => {
  const c = sanitiseCharacter({
    gender: 'male', skinTone: 'cocoa', hairStyle: 'nope', hairColor: 'ocean',
    outfit: '<script>', accent: 'cape', expression: 'wink', nickname: '  Zed<b>  ',
  });
  assert.deepEqual(c, {
    gender: 'male', skinTone: 'cocoa', hairStyle: 'wave', hairColor: 'ocean',
    outfit: 'astronaut', accent: 'cape', expression: 'wink', nickname: 'Zedb',
  });
});

test('an empty body is the default avatar, not an error', () => {
  const c = sanitiseCharacter(undefined);
  assert.equal(c.outfit, 'astronaut');
  assert.equal(c.nickname, '');
});

test('a database row comes back in the shape the lab reads', () => {
  const c = rowToCharacter({ gender: 'female', skin_tone: 'deep', hair_style: 'bun', hair_color: 'gold',
    outfit: 'hacker', accent: 'none', expression: 'laugh', nickname: 'Sky' });
  assert.deepEqual(c, { gender: 'female', skinTone: 'deep', hairStyle: 'bun', hairColor: 'gold',
    outfit: 'hacker', accent: 'none', expression: 'laugh', nickname: 'Sky' });
  assert.equal(rowToCharacter(undefined).skinTone, 'sunset');
});

// ── What the numbers say we value ────────────────────────────────────────────
test('explaining a line of your own code, first try, is worth more than anything else a single action pays', () => {
  assert.equal(UNDERSTANDING_XP, 50);
  if (PROJECT_XP) {
    for (const value of Object.values(PROJECT_XP)) assert.ok(value < UNDERSTANDING_XP, `project award ${value} must be visibly smaller`);
  }
  const { MAX_STEP_XP } = require('./stepXp');
  assert.ok(MAX_STEP_XP < UNDERSTANDING_XP);
});

test('the one XP sum includes every source, understanding included, and takes one id per source', () => {
  for (const table of ['Student_Quiz_Attempt', 'Student_Lesson_Progress', 'lesson_step_xp', 'Student_Puzzle_Progress', 'ai_project_xp_awards', 'understanding_records']) {
    assert.ok(TOTAL_XP_SQL.includes(table), `missing ${table}`);
  }
  assert.equal((TOTAL_XP_SQL.match(/\?/g) || []).length, TOTAL_XP_PARAMS);
});

test('the journey map and the leaderboard both read the shared sum', () => {
  const fs = require('fs');
  assert.match(fs.readFileSync(`${__dirname}/routes/journey.js`, 'utf8'), /totalXpFor\(pool, userId\)/);
  assert.match(fs.readFileSync(`${__dirname}/routes/rewards.js`, 'utf8'), /UNDERSTANDING_XP_JOIN/);
  assert.doesNotMatch(fs.readFileSync(`${__dirname}/routes/journey.js`, 'utf8'), /SELECT SUM\(xp_earned\) FROM Student_Quiz_Attempt/);
});
