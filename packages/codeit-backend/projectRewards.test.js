'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { PROJECT_XP, awardProjectXp } = require('./projectRewards');

function fakePool({ student = true, inserted = true } = {}) {
  const calls = [];
  const connection = {
    beginTransaction: async () => calls.push('begin'),
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    release: () => calls.push('release'),
    query: async (sql, values) => {
      calls.push({ sql, values });
      if (sql.includes('SELECT user_id FROM Students')) return [student ? [{ user_id: values[0] }] : []];
      if (sql.includes('INSERT INTO ai_project_xp_awards')) return [{ affectedRows: inserted ? 1 : 0 }];
      if (sql.includes('UPDATE Students')) return [{ affectedRows: 1 }];
      throw new Error('Unexpected query');
    },
  };
  return { pool: { getConnection: async () => connection }, calls };
}

test('awards persistent XP once for a new student project', async () => {
  const { pool, calls } = fakePool();
  const awarded = await awardProjectXp(pool, Promise.resolve(), 7, 42, 'created');

  assert.equal(awarded, 25);
  const update = calls.find((call) => call.sql?.includes('UPDATE Students'));
  assert.deepEqual(update.values, [25, 25, 7]);
  assert.equal(calls.includes('commit'), true);
  assert.equal(calls.at(-1), 'release');
});

test('does not award XP twice for the same project milestone', async () => {
  const { pool, calls } = fakePool({ inserted: false });
  assert.equal(await awardProjectXp(pool, Promise.resolve(), 7, 42, 'published'), 0);
  assert.equal(calls.some((call) => call.sql?.includes('UPDATE Students')), false);
  assert.equal(calls.includes('rollback'), true);
});

test('does not award competition XP to an adult account', async () => {
  const { pool, calls } = fakePool({ student: false });
  assert.equal(await awardProjectXp(pool, Promise.resolve(), 9, 43, 'created'), 0);
  assert.equal(calls.some((call) => call.sql?.includes('INSERT INTO ai_project_xp_awards')), false);
});

test('uses a small fixed reward vocabulary', () => {
  assert.deepEqual(PROJECT_XP, { created: 25, published: 25 });
});
