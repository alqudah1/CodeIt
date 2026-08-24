// Proves the /explore fix against a real Postgres, because the bug it fixes
// only appeared on Postgres and only for signed-in visitors — which is exactly
// the combination no unit test and no signed-out browser probe could see.
//
// Run with:  DATABASE_URL=postgres://... node --test exploreLikes.pgtest.js
// Skipped automatically when there is no Postgres to talk to.

const test = require('node:test');
const assert = require('node:assert');

// Deliberately localhost-only. This test creates and drops a probe table, and
// `npm test` on a developer machine with a production DATABASE_URL exported
// must never be able to touch a real database.
const DB_URL = process.env.DATABASE_URL || '';
const HAS_PG = /@(localhost|127\.0\.0\.1)[:/]/.test(DB_URL);

test('the liked-projects lookup works on Postgres', { skip: !HAS_PG && 'no local Postgres (set DATABASE_URL to a localhost database)' }, async (t) => {
  const pool = require('./db');

  await pool.query(`DROP TABLE IF EXISTS ai_project_likes_probe`);
  await pool.query(`CREATE TABLE ai_project_likes_probe (
    user_id INTEGER NOT NULL, project_id INTEGER NOT NULL
  )`);
  await pool.query(`INSERT INTO ai_project_likes_probe (user_id, project_id)
    VALUES (7, 101), (7, 103), (9, 101) RETURNING user_id`);

  const ids = [101, 102, 103, 104];

  await t.test('the old mysql2-only form is genuinely broken here', async () => {
    // Kept as a test so nobody "simplifies" the fix back into the bug.
    await assert.rejects(
      () => pool.query(
        'SELECT project_id FROM ai_project_likes_probe WHERE user_id = ? AND project_id IN (?)',
        [7, ids]
      ),
      /./,
      'IN (?) with an array should fail on Postgres — if this passes, the shim changed'
    );
  });

  await t.test('one placeholder per id returns exactly the projects this user liked', async () => {
    const slots = ids.map(() => '?').join(', ');
    const [likes] = await pool.query(
      `SELECT project_id FROM ai_project_likes_probe WHERE user_id = ? AND project_id IN (${slots})`,
      [7, ...ids]
    );
    assert.deepStrictEqual(likes.map(row => row.project_id).sort(), [101, 103]);
  });

  await t.test('another user does not inherit those likes', async () => {
    const slots = ids.map(() => '?').join(', ');
    const [likes] = await pool.query(
      `SELECT project_id FROM ai_project_likes_probe WHERE user_id = ? AND project_id IN (${slots})`,
      [9, ...ids]
    );
    assert.deepStrictEqual(likes.map(row => row.project_id), [101]);
  });

  await t.test('a single id still works, since that is the common case', async () => {
    const [likes] = await pool.query(
      'SELECT project_id FROM ai_project_likes_probe WHERE user_id = ? AND project_id IN (?)',
      [7, 101]
    );
    assert.deepStrictEqual(likes.map(row => row.project_id), [101]);
  });

  await pool.query('DROP TABLE ai_project_likes_probe');
  await pool.end();
});
