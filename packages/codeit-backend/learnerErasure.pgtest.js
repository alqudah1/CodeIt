'use strict';

// ── Does deleting a learner actually delete the learner? ────────────────────
//
// A parent deletes their child's profile. A school asks what that removed.
// The answer has to be "everything", and the only way to know is to put a
// row in every table that names a learner, delete, and count.
//
// This test does not read the erasure list. It reads the database, finds
// every table with a column that identifies a learner, and insists nothing
// survives. A list checked against itself proves nothing; this is checked
// against the schema, so a table added next month that nobody remembers to
// erase fails here rather than quietly keeping a record of a child.
//
// Needs a real Postgres with this repository's migrations applied, which is
// why it is a pgtest and runs inside ops/checks/run-all.sh rather than in
// the unit suite.

const test = require('node:test');
const assert = require('node:assert');

const pool = require('./db');
const { eraseLearner } = require('./learnerErasure');

const LEARNER_COLUMNS = ['user_id', 'student_id', 'child_user_id'];

// Tables that name a learner but are not a record of one, and so are not
// expected to be empty afterwards. Each needs a reason, not just a name.
const NOT_ABOUT_THE_LEARNER = new Map([
  // A teacher's class outlives one student leaving it; the membership row is
  // what gets removed, and it cascades.
  ['classes', 'owned by the teacher, not the student'],
]);

async function learnerTables() {
  const [rows] = await pool.query(
    `SELECT c.table_name, c.column_name
       FROM information_schema.columns c
       JOIN information_schema.tables t
         ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      WHERE c.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.column_name = ANY($1)
      ORDER BY c.table_name`,
    [LEARNER_COLUMNS]
  );
  return rows
    .filter(row => row.table_name !== 'users')
    .filter(row => !NOT_ABOUT_THE_LEARNER.has(row.table_name));
}

/** One row in `table`, about learner `userId`, built from the column types. */
async function seedRow(table, learnerColumn, userId) {
  const [columns] = await pool.query(
    `SELECT column_name, is_nullable, column_default, data_type
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position`,
    [table]
  );
  const needed = columns.filter(c => c.is_nullable === 'NO' && !c.column_default);
  if (!needed.some(c => c.column_name === learnerColumn)) {
    needed.push(columns.find(c => c.column_name === learnerColumn));
  }
  const names = needed.map(c => c.column_name);
  const values = needed.map((c) => {
    if (c.column_name === learnerColumn) return userId;
    if (LEARNER_COLUMNS.includes(c.column_name)) return userId;
    if (/int|numeric|double|real/.test(c.data_type)) return 1;
    if (/bool/.test(c.data_type)) return true;
    if (/date|time/.test(c.data_type)) return new Date().toISOString();
    return 'x';
  });
  await pool.query(
    `INSERT INTO ${table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`,
    values
  );
}

test('nothing about a learner survives their erasure', async (t) => {
  const userId = 990001;
  const tables = await learnerTables();
  assert.ok(tables.length > 10, `only found ${tables.length} learner tables; the query is wrong`);

  await pool.query('DELETE FROM Users WHERE user_id = ?', [userId]);
  await pool.query(
    "INSERT INTO Users (user_id, name, password, role) VALUES (?, 'Erasure Test', 'x', 'student')",
    [userId]
  );

  const seeded = [];
  const unseedable = [];
  for (const { table_name: table, column_name: column } of tables) {
    try {
      await seedRow(table, column, userId);
      seeded.push({ table, column });
    } catch (error) {
      // A table whose other constraints this test cannot satisfy is reported
      // rather than skipped silently, so the coverage is visible.
      unseedable.push(`${table} (${error.message.split('\n')[0].slice(0, 60)})`);
    }
  }
  t.diagnostic(`seeded ${seeded.length} of ${tables.length} learner tables`);
  if (unseedable.length) t.diagnostic(`could not seed: ${unseedable.join('; ')}`);
  assert.ok(seeded.length >= 10, 'too few tables seeded for this to prove anything');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await eraseLearner(connection, userId);
    await connection.commit();
  } finally {
    connection.release();
  }

  const survivors = [];
  for (const { table, column } of seeded) {
    const [rows] = await pool.query(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ?`, [userId]);
    if (Number(rows[0].n) > 0) survivors.push(`${table}.${column}`);
  }

  assert.deepEqual(survivors, [],
    'these tables still hold rows about a learner who was deleted. Add them to '
    + 'ERASE_BY_NAME in learnerErasure.js, or give them a foreign key to Users '
    + 'with ON DELETE CASCADE.');

  const [left] = await pool.query('SELECT COUNT(*) AS n FROM Users WHERE user_id = ?', [userId]);
  assert.strictEqual(Number(left[0].n), 0, 'the Users row itself survived');
});
