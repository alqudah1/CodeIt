'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

// ── Powers: the rules, the parser, and the check route ──────────────────────

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://x:y@localhost:1/none';

const { POWERS, POWER_XP, lessonIdFor, passes, powerBySlug, powerStates, readSettings, stepFor, writeSetting } = require('./powers');

const SETTINGS = `
// ── Change these and watch what happens ──
let gameKind   = 'shooter';   // shooter, dodge, catch or runner
let gameTitle  = 'Ship Game';
let playerLook = 'ship';
let enemyLook  = 'rock';
let treasure   = 'gem';
let skyLook    = 'space';   // space, night, ocean, candy, sunset or day
let speed      = 2;   // 1 is calm, 3 is wild
let startLives = 3;
let winAt      = 15;
let twist      = 'none';   // none, faster or waves

// ── Powers: each line wakes up when you learn it ──
let waveSize     = 1;   // Loops: how many bad things each wave
let pointsPer    = 1;   // Score: points for every catch
let speedUpEvery = 0;   // Timers: seconds between speed ups, 0 is never
let soundOn      = false;   // Sound: a blip on every catch and hit
let levelEvery   = 0;   // Levels: points per level, 0 is no levels
let bossAt       = 0;   // Boss: the score where the boss comes, 0 is never
`;

test('twelve powers, numbered 1 to 12, each on a real line of the game, each with two steps and a check', () => {
  assert.equal(POWERS.length, 12);
  assert.deepEqual(POWERS.map((p) => p.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const settings = readSettings(SETTINGS);
  for (const p of POWERS) {
    assert.ok(p.key in settings, `${p.slug} edits ${p.key}, which is not a settings line`);
    assert.equal(p.steps.length, 2, p.slug);
    assert.ok(p.check.say.endsWith('.'), `${p.slug} check copy ends with a full stop`);
    assert.ok(!/!/.test(p.intro + p.check.say + p.steps.map((s) => s.say).join('')), `${p.slug} copy shouts`);
    assert.ok(!/—/.test(p.intro + p.engine), `${p.slug} has an em dash`);
    assert.equal(lessonIdFor(p), 100 + p.n);
  }
  assert.equal(new Set(POWERS.map((p) => p.slug)).size, 12);
});

test('the parser reads every settings line and the writer changes one in place, comments intact', () => {
  const s = readSettings(SETTINGS);
  assert.equal(s.speed, 2);
  assert.equal(s.gameTitle, 'Ship Game');
  assert.equal(s.soundOn, false);
  assert.equal(s.bossAt, 0);
  assert.equal(Object.keys(s).length, 16);
  const changed = writeSetting(SETTINGS, 'speed', 3);
  assert.ok(changed.includes('let speed      = 3;   // 1 is calm, 3 is wild'));
  assert.equal(readSettings(writeSetting(SETTINGS, 'gameTitle', "Rock's Storm")).gameTitle, 'Rocks Storm', 'a quote cannot break the line');
  assert.equal(readSettings(writeSetting(SETTINGS, 'soundOn', true)).soundOn, true);
  assert.equal(readSettings(writeSetting(SETTINGS, 'nothing', 1)).speed, 2, 'an unknown key changes nothing');
  assert.deepEqual(readSettings('let x = ; garbage'), {});
});

test('every power\'s second step passes its own check, and the untouched game passes none', () => {
  for (const p of POWERS) {
    const after = writeSetting(SETTINGS, p.key, p.steps[0].value);
    assert.ok(passes(p, after, SETTINGS), `${p.slug}: step one ${JSON.stringify(p.steps[0].value)} should pass`);
    assert.ok(!passes(p, SETTINGS, SETTINGS), `${p.slug}: nothing changed should not pass`);
  }
  assert.ok(!passes(powerBySlug('numbers'), writeSetting(SETTINGS, 'speed', 99), SETTINGS), 'out of range fails');
  assert.ok(!passes(powerBySlug('looks'), writeSetting(SETTINGS, 'enemyLook', 'dragon'), SETTINGS), 'a look the game does not know fails');
  assert.ok(!passes(powerBySlug('words'), writeSetting(SETTINGS, 'gameTitle', 'Hi'), SETTINGS), 'two letters is not a title');
  assert.ok(!passes(null, SETTINGS, SETTINGS));
  assert.ok(!passes(powerBySlug('loops'), 'let waveSize = "3";', ''), 'a word where a number goes fails');
});

test('a step never asks for the value the game already has', () => {
  const numbers = powerBySlug('numbers');
  assert.deepEqual(stepFor(numbers, 0, 2), { to: 3, say: 'Change the 2 to a 3. Run it.' });
  assert.deepEqual(stepFor(numbers, 0, 3), { to: 4, say: 'Change the 3 to a 4. Run it.' });
  assert.equal(stepFor(powerBySlug('sound'), 0, false).say, 'Flip soundOn to true. Run it and catch something.');
  assert.equal(stepFor(powerBySlug('sound'), 0, true).to, false);
  for (const p of POWERS) {
    for (const i of [0, 1]) {
      assert.notEqual(p.steps[i].value, p.steps[i].alt, `${p.slug} step ${i} alt is the same value`);
      assert.ok(!/\{to\}|\{from\}/.test(stepFor(p, i, p.steps[i].value).say), `${p.slug} leaves a placeholder`);
    }
  }
});

test('the map marks done, one next, and the rest later', () => {
  const states = powerStates(['numbers', 'words']);
  assert.deepEqual(states.slice(0, 4).map((s) => s.state), ['done', 'done', 'next', 'later']);
  assert.equal(states.filter((s) => s.state === 'next').length, 1);
  assert.equal(powerStates([])[0].state, 'next');
  assert.equal(powerStates(POWERS.map((p) => p.slug)).filter((s) => s.state !== 'done').length, 0);
});

// ── The route over a fake progress table ────────────────────────────────────
const progress = [];
const students = { 9: { total_xp: 0 } };
const log = [];
require.cache[require.resolve('./db')] = {
  id: require.resolve('./db'), filename: require.resolve('./db'), loaded: true,
  exports: {
    dialect: 'postgres',
    async query(sql, params = []) {
      log.push(sql.replace(/\s+/g, ' ').trim());
      if (/^SELECT lesson_id FROM Student_Lesson_Progress/.test(sql)) return [progress.filter((r) => r.user_id === params[0] && r.lesson_id > params[1] && r.lesson_id <= params[2])];
      if (/^INSERT INTO Student_Lesson_Progress/.test(sql)) {
        if (progress.some((r) => r.user_id === params[0] && r.lesson_id === params[1])) return [{ affectedRows: 0 }];
        progress.push({ user_id: params[0], lesson_id: params[1], xp_earned: params[2] });
        return [{ affectedRows: 1 }];
      }
      if (/^UPDATE Students SET total_xp/.test(sql)) { students[params[2]].total_xp += params[0]; return [{ affectedRows: 1 }]; }
      throw new Error('unscripted: ' + sql);
    },
  },
};
const analyticsPath = require.resolve('./analytics');
const events = [];
require.cache[analyticsPath] = { id: analyticsPath, filename: analyticsPath, loaded: true, exports: { recordEvent: async (name, data) => { events.push([name, data.meta]); } } };
const router = require('./routes/powers');
const { JWT_SECRET } = require('./config');

let server; let base;
test.before(async () => {
  const app = express(); app.use(express.json()); app.use('/api/powers', router);
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());
const token = jwt.sign({ user_id: 9, role: 'student', name: 'Maya' }, JWT_SECRET);
async function call(method, path, body, auth) {
  const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${auth}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
}

test('a pass is stored once, worth XP once, and the map moves on; a guest gets the verdict only', async () => {
  const after = writeSetting(SETTINGS, 'waveSize', 4);
  const guest = await call('POST', '/api/powers/loops/check', { code: after, before: SETTINGS });
  assert.deepEqual(guest.body, { passed: true, stored: false, xp: 0 });
  assert.equal(progress.length, 0);

  const fail = await call('POST', '/api/powers/loops/check', { code: SETTINGS, before: SETTINGS }, token);
  assert.equal(fail.body.passed, false);
  assert.equal(fail.body.say, 'Make the loop spawn between 2 and 6 bad things a wave.');

  const pass = await call('POST', '/api/powers/loops/check', { code: after, before: SETTINGS }, token);
  assert.equal(pass.body.passed, true);
  assert.equal(pass.body.first, true);
  assert.equal(pass.body.xp, POWER_XP);
  assert.deepEqual(pass.body.done, ['loops']);
  assert.equal(students[9].total_xp, POWER_XP);
  assert.deepEqual(progress, [{ user_id: 9, lesson_id: 108, xp_earned: POWER_XP }]);
  assert.deepEqual(events, [['power_unlocked', 'loops']]);

  const again = await call('POST', '/api/powers/loops/check', { code: after, before: SETTINGS }, token);
  assert.equal(again.body.first, false);
  assert.equal(again.body.xp, 0);
  assert.equal(students[9].total_xp, POWER_XP, 'no XP the second time');

  const list = await call('GET', '/api/powers', null, token);
  assert.equal(list.body.signedIn, true);
  assert.deepEqual(list.body.done, ['loops']);
  assert.equal(list.body.powers.find((p) => p.slug === 'loops').state, 'done');
  assert.equal(list.body.powers.find((p) => p.slug === 'numbers').state, 'next');
  assert.equal((await call('POST', '/api/powers/flying/check', { code: '' })).status, 404);
});
