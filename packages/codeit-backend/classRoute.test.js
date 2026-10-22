'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

// ── Class codes, end to end against a fake database ─────────────────────────
//
// The real router, a scripted pool. These prove the flow a classroom relies
// on: a teacher makes a class and gets a readable code, a child joins with
// the code and a first name and gets a real signed-in account, the same name
// comes back to the same account, the board lists the room, and a site whose
// tables are not created yet says so instead of throwing.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://x:y@localhost:1/none';

const { cleanFirstName, isCode, makeCode, normaliseCode, studentUsername, WORDS } = require('./classes');

// ── The fake database ───────────────────────────────────────────────────────
const state = { classes: [], members: [], users: [], students: [], projects: [], ready: true, nextId: 100 };
const log = [];
async function fakeQuery(sql, params = []) {
  log.push(sql);
  const s = sql.replace(/\s+/g, ' ').trim();
  if (!state.ready && /classes|class_members/i.test(s)) {
    const err = new Error('relation "classes" does not exist'); err.code = '42P01'; throw err;
  }
  let m;
  if (/^SELECT id, code, name, owner_id, created_at FROM classes WHERE code = \?/.test(s)) {
    return [state.classes.filter((c) => c.code === params[0])];
  }
  if (/^INSERT INTO classes/.test(s)) {
    const row = { id: state.nextId++, code: params[0], name: params[1], owner_id: params[2], created_at: new Date() };
    state.classes.push(row);
    return [{ insertId: row.id, affectedRows: 1 }];
  }
  if (/FROM classes c WHERE c.owner_id = \?/.test(s)) {
    return [state.classes.filter((c) => c.owner_id === params[0]).map((c) => ({ ...c, members: state.members.filter((mm) => mm.class_id === c.id).length }))];
  }
  if (/^SELECT u.user_id, u.name, m.joined_at/.test(s)) {
    return [state.members.filter((mm) => mm.class_id === params[0]).map((mm) => {
      const u = state.users.find((x) => x.user_id === mm.user_id);
      const ps = state.projects.filter((p) => p.user_id === u.user_id);
      return { user_id: u.user_id, name: u.name, joined_at: mm.joined_at, games: ps.length, plays: ps.reduce((a, p) => a + p.view_count, 0) };
    })];
  }
  if (/^SELECT id, user_id, title, public_id, is_public, project_type, created_at FROM ai_projects/.test(s)) {
    return [state.projects.filter((p) => params.includes(p.user_id)).sort((a, b) => b.created_at - a.created_at)];
  }
  if (/^SELECT id FROM class_members WHERE class_id = \? AND user_id = \?/.test(s)) {
    return [state.members.filter((mm) => mm.class_id === params[0] && mm.user_id === params[1]).map((mm) => ({ id: mm.id }))];
  }
  if (/^SELECT u.user_id, u.name, u.role FROM class_members m JOIN Users u/.test(s)) {
    const rows = state.members.filter((mm) => mm.class_id === params[0]).map((mm) => state.users.find((x) => x.user_id === mm.user_id)).filter((u) => u.name.toLowerCase() === String(params[1]).toLowerCase());
    return [rows.slice(0, 1)];
  }
  if ((m = /^SELECT user_id FROM Users WHERE username = \?/.exec(s))) {
    return [state.users.filter((u) => u.username === params[0]).map((u) => ({ user_id: u.user_id }))];
  }
  if (/^INSERT INTO Users/.test(s)) {
    const row = { user_id: state.nextId++, username: params[0], name: params[1], password: params[2], role: params[3], dob: params[4], parent_email: params[5] };
    state.users.push(row);
    return [{ insertId: row.user_id, affectedRows: 1 }];
  }
  if (/^INSERT INTO Students/.test(s)) { state.students.push({ user_id: params[0] }); return [{ insertId: state.nextId++, affectedRows: 1 }]; }
  if (/^INSERT INTO class_members/.test(s)) {
    const row = { id: state.nextId++, class_id: params[0], user_id: params[1], joined_at: new Date() };
    state.members.push(row);
    return [{ insertId: row.id, affectedRows: 1 }];
  }
  throw new Error(`unscripted query: ${s}`);
}
const fakeDb = {
  dialect: 'postgres',
  query: fakeQuery,
  async getConnection() {
    return { query: fakeQuery, beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {} };
  },
};
require.cache[require.resolve('./db')] = { id: require.resolve('./db'), filename: require.resolve('./db'), loaded: true, exports: fakeDb };
const activityPath = require.resolve('./userActivity');
require.cache[activityPath] = { id: activityPath, filename: activityPath, loaded: true, exports: { recordUserActivity: async () => {} } };

const router = require('./routes/class');
const { JWT_SECRET } = require('./config');

let server; let base;
test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/class', router);
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const teacherToken = jwt.sign({ user_id: 7, role: 'educator', name: 'Mr Q' }, JWT_SECRET);
async function call(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

test('the rules: codes read off a projector, names and usernames are clean', () => {
  for (let i = 0; i < 200; i += 1) {
    const code = makeCode();
    assert.ok(isCode(code), code);
    assert.ok(!/[01]/.test(code.slice(-2)), `${code} has a digit that reads as a letter`);
    assert.ok(WORDS.includes(code.slice(0, -2)));
  }
  assert.equal(normaliseCode(' rocket-42 '), 'ROCKET42');
  assert.equal(normaliseCode('rocket 42'), 'ROCKET42');
  assert.ok(!isCode('ROCKET'));
  assert.equal(cleanFirstName('  maya   QUDAH-smith <b>'), 'Maya Qudah-smith');
  assert.equal(cleanFirstName('zoë'), 'Zoë');
  assert.equal(cleanFirstName('123'), '');
  assert.equal(studentUsername('Zoë', 'ROCKET42'), 'zoe.rocket42');
  assert.equal(studentUsername('Zoë', 'ROCKET42', 1), 'zoe.rocket42.2');
});

test('a teacher makes a class and sees it under mine; a guest cannot', async () => {
  assert.equal((await call('POST', '/api/class', { name: 'Year 5' })).status, 401);
  assert.equal((await call('POST', '/api/class', { name: 'Y' }, teacherToken)).status, 400);
  const made = await call('POST', '/api/class', { name: '  Year  5 ' }, teacherToken);
  assert.equal(made.status, 201);
  assert.ok(isCode(made.body.class.code));
  assert.equal(made.body.class.name, 'Year 5');
  const mine = await call('GET', '/api/class/mine', null, teacherToken);
  assert.equal(mine.status, 200);
  assert.deepEqual(mine.body.classes.map((c) => [c.code, c.members]), [[made.body.class.code, 0]]);
  state.code = made.body.class.code;
});

test('a child joins with the code and a first name and is signed in on a real account', async () => {
  const bad = await call('POST', '/api/class/NOPE99/join', { first_name: 'Maya' });
  assert.equal(bad.status, 404);
  const nameless = await call('POST', `/api/class/${state.code}/join`, { first_name: '' });
  assert.equal(nameless.status, 400);

  const joined = await call('POST', `/api/class/${state.code.toLowerCase()}/join`, { first_name: 'maya' });
  assert.equal(joined.status, 201);
  assert.equal(joined.body.existing, false);
  assert.equal(joined.body.user.name, 'Maya');
  assert.equal(joined.body.user.role, 'student');
  const claims = jwt.verify(joined.body.token, JWT_SECRET);
  assert.equal(claims.user_id, joined.body.user.id);
  assert.equal(claims.learningMode, 'guided');
  const user = state.users.find((u) => u.user_id === joined.body.user.id);
  assert.equal(user.username, `maya.${state.code.toLowerCase()}`);
  assert.equal(user.dob, null);
  assert.ok(user.password.startsWith('$2'), 'a hashed random password, never a plain one');
  assert.ok(state.students.some((s) => s.user_id === user.user_id), 'the Students row every XP route needs');
  state.maya = joined.body.user.id;

  // The same name in the same class comes back to the same account.
  const again = await call('POST', `/api/class/${state.code}/join`, { first_name: 'MAYA' });
  assert.equal(again.status, 200);
  assert.equal(again.body.existing, true);
  assert.equal(again.body.user.id, state.maya);
  assert.equal(state.users.length, 1, 'no second account');

  // A different child gets a different account.
  const leo = await call('POST', `/api/class/${state.code}/join`, { first_name: 'Leo' });
  assert.equal(leo.status, 201);
  assert.notEqual(leo.body.user.id, state.maya);

  // Someone already signed in joins as themselves, with no new account.
  const self = await call('POST', `/api/class/${state.code}/join`, {}, jwt.sign({ user_id: 55, role: 'student', name: 'Sam' }, JWT_SECRET));
  assert.equal(self.status, 200);
  assert.equal(self.body.token, undefined);
  assert.equal(state.members.filter((m) => m.user_id === 55).length, 1);
  await call('POST', `/api/class/${state.code}/join`, {}, jwt.sign({ user_id: 55, role: 'student', name: 'Sam' }, JWT_SECRET));
  assert.equal(state.members.filter((m) => m.user_id === 55).length, 1, 'joining twice is one membership');
});

test('the board lists the room by first name with each child\'s newest game', async () => {
  state.users.push({ user_id: 55, name: 'Sam', username: 'sam', password: 'x', role: 'student' });
  state.projects.push(
    { id: 1, user_id: state.maya, title: 'Old One', public_id: 'oldpub', is_public: 1, project_type: 'game', view_count: 3, created_at: new Date('2026-10-01') },
    { id: 2, user_id: state.maya, title: 'Ship Game', public_id: 'newpub', is_public: 0, project_type: 'game', view_count: 0, created_at: new Date('2026-10-20') }
  );
  const board = await call('GET', `/api/class/${state.code}`);
  assert.equal(board.status, 200);
  assert.equal(board.body.class.code, state.code);
  assert.equal(board.body.owner, false);
  assert.deepEqual(board.body.members.map((m) => m.name), ['Maya', 'Leo', 'Sam']);
  const maya = board.body.members[0];
  assert.equal(maya.games, 2);
  assert.equal(maya.plays, 3);
  assert.equal(maya.newest.title, 'Ship Game');
  assert.equal(maya.newest.publicId, null, 'an unpublished game is named but not linked');
  assert.equal(board.body.members[1].newest, null);
  const asOwner = await call('GET', `/api/class/${state.code}`, null, teacherToken);
  assert.equal(asOwner.body.owner, true);
  assert.equal((await call('GET', '/api/class/ZZZZ22')).status, 404);
  assert.equal((await call('GET', '/api/class/not-a-code')).status, 404);
});

test('before the tables exist every route says not set up instead of failing', async () => {
  state.ready = false;
  for (const [method, path, body, token] of [
    ['POST', '/api/class', { name: 'Year 5' }, teacherToken],
    ['GET', '/api/class/mine', null, teacherToken],
    ['GET', `/api/class/${state.code}`, null, null],
    ['POST', `/api/class/${state.code}/join`, { first_name: 'Maya' }, null],
  ]) {
    const res = await call(method, path, body, token);
    assert.equal(res.status, 503, path);
    assert.equal(res.body.ready, false);
  }
  state.ready = true;
});
