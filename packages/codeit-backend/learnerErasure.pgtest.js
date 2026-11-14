'use strict';

// ── Does deleting a learner actually delete the learner? ────────────────────
//
// A parent deletes their child's profile; a teacher deletes a child from
// their class. A school asks what that removed. The answer has to be
// "everything", and the only way to know is to put a row in every table that
// names a learner, erase, and count.
//
// This test does not read the erasure list. It reads the database, finds
// every table with a column that identifies a learner, and insists nothing
// survives. A list checked against itself proves nothing.
//
// ── How the first version of this lied ──────────────────────────────────────
//
// It passed while two tables were missing from the erasure list, because on
// that database neither table could be seeded, and a table that could not be
// seeded was skipped. So the rule now is: a table that a cascading foreign key
// clears may be skipped (the schema erases it whatever the code does), but a
// table that nothing but learnerErasure.js clears may never be. Those get a
// hand-written row below, and a new one that cannot be seeded fails the test
// and asks for one.
//
// Needs a real Postgres with this repository's migrations applied, so it runs
// inside ops/checks/run-all.sh rather than the unit suite.

const test = require('node:test');
const assert = require('node:assert');

const pool = require('./db');
const { eraseLearner } = require('./learnerErasure');

const LEARNER_COLUMNS = ['user_id', 'student_id', 'child_user_id'];

// Tables that name a learner but are not a record of one.
const NOT_ABOUT_THE_LEARNER = new Map([
  ['classes', 'owned by the teacher, not the student'],
]);

const today = () => new Date().toISOString().slice(0, 10);
const unique = () => Math.random().toString(36).slice(2, 10);

// A real row for each table nothing but the erasure list clears. Written by
// hand because these are the ones that matter, and a generic guess at their
// columns is what failed before.
const EXPLICIT = {
  // A like on somebody else's game: that game survives, so the like is erased
  // only if the list names it.
  ai_project_likes: async (id, other) => {
    const [result] = await pool.query(
      "INSERT INTO ai_projects (user_id, title, prompt, generated_code, project_type) VALUES (?, 'not theirs', 'p', '<p>x</p>', 'game')",
      [other]
    );
    await pool.query('INSERT INTO ai_project_likes (project_id, user_id) VALUES (?, ?)', [result.insertId, id]);
  },
  ai_project_xp_awards: (id) => pool.query(
    "INSERT INTO ai_project_xp_awards (user_id, project_id, award_type, xp_earned) VALUES (?, ?, 'publish', 10)",
    [id, 100000 + Math.floor(Math.random() * 1e9)]
  ),
  analytics_events: (id) => pool.query("INSERT INTO analytics_events (event_name, user_id) VALUES ('erasure_test', ?)", [id]),
  founding_family_leads: (id) => pool.query('INSERT INTO founding_family_leads (email, user_id) VALUES (?, ?)', [`erasure-${unique()}@example.test`, id]),
  rewards: (id) => pool.query("INSERT INTO rewards (student_id, name) VALUES (?, 'erasure test')", [String(id)]),
  student_lesson_progress: (id) => pool.query('INSERT INTO student_lesson_progress (user_id, lesson_id) VALUES (?, 1)', [id]),
  student_puzzle_progress: (id) => pool.query('INSERT INTO student_puzzle_progress (user_id, puzzle_id) VALUES (?, 1)', [id]),
  student_quiz_attempt: (id) => pool.query('INSERT INTO student_quiz_attempt (student_id, quiz_id) VALUES (?, 1)', [id]),
  user_activity_daily: (id) => pool.query('INSERT INTO user_activity_daily (user_id, activity_date) VALUES (?, ?)', [id, today()]),
};

async function learnerTables() {
  const [rows] = await pool.query(
    `SELECT c.table_name, c.column_name
       FROM information_schema.columns c
       JOIN information_schema.tables t
         ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
        AND c.column_name = ANY($1)
      ORDER BY c.table_name`,
    [LEARNER_COLUMNS]
  );
  return rows.filter(r => r.table_name !== 'users' && !NOT_ABOUT_THE_LEARNER.has(r.table_name));
}

/** Tables a foreign key to Users clears on delete, through any of their columns. */
async function cascadingTables() {
  const [rows] = await pool.query(
    `SELECT DISTINCT kcu.table_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
       JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
       JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users' AND rc.delete_rule = 'CASCADE'`
  );
  return new Set(rows.map(r => r.table_name));
}

/** A best-effort row for a table the schema already clears. */
async function genericRow(table, userId) {
  const [columns] = await pool.query(
    `SELECT column_name, is_nullable, column_default, data_type, character_maximum_length AS len, is_identity
       FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position`,
    [table]
  );
  const needed = columns.filter(c => (c.is_nullable === 'NO' && !c.column_default && c.is_identity !== 'YES')
    || LEARNER_COLUMNS.includes(c.column_name));
  const values = needed.map((c) => {
    if (LEARNER_COLUMNS.includes(c.column_name)) return /char|text/.test(c.data_type) ? String(userId) : userId;
    if (/int|numeric|double|real/.test(c.data_type)) return 100000 + Math.floor(Math.random() * 1e9);
    if (/bool/.test(c.data_type)) return true;
    if (/date|time/.test(c.data_type)) return new Date().toISOString();
    return unique().slice(0, Math.max(1, Math.min(8, c.len || 8)));
  });
  const names = needed.map(c => c.column_name);
  await pool.query(`INSERT INTO ${table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`, values);
}

test('nothing about a learner survives their erasure', async (t) => {
  const userId = 980000 + Math.floor(Math.random() * 9000);
  const otherId = userId + 10000;
  const tables = await learnerTables();
  const cascading = await cascadingTables();
  assert.ok(tables.length > 10, `only found ${tables.length} learner tables; the query is wrong`);

  for (const [id, name] of [[userId, 'Erasure Test'], [otherId, 'Somebody Else']]) {
    await pool.query('DELETE FROM Users WHERE user_id = ?', [id]);
    await pool.query("INSERT INTO Users (user_id, name, password, role) VALUES (?, ?, 'x', 'student')", [id, name]);
  }

  const seeded = new Set();
  const failures = [];
  for (const table of [...new Set(tables.map(r => r.table_name))]) {
    try {
      if (EXPLICIT[table]) await EXPLICIT[table](userId, otherId);
      else await genericRow(table, userId);
      seeded.add(table);
    } catch (error) {
      failures.push({ table, why: error.message.split('\n')[0].slice(0, 70) });
    }
  }
  t.diagnostic(`seeded ${seeded.size} of ${new Set(tables.map(r => r.table_name)).size} learner tables`);

  // The rule the first version broke.
  const unprovable = failures.filter(f => !cascading.has(f.table));
  assert.deepEqual(unprovable.map(f => `${f.table}: ${f.why}`), [],
    'these tables are cleared only by learnerErasure.js and could not be seeded, so this test '
    + 'cannot prove they are erased. Give each a row in EXPLICIT.');
  if (failures.length) t.diagnostic(`skipped, the schema clears them anyway: ${failures.map(f => f.table).join(', ')}`);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await eraseLearner(connection, userId);
    await connection.commit();
  } finally {
    connection.release();
  }

  const survivors = [];
  for (const { table_name: table, column_name: column } of tables) {
    if (!seeded.has(table)) continue;
    const [rows] = await pool.query(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column}::text = ?`, [String(userId)]);
    if (Number(rows[0].n) > 0) survivors.push(`${table}.${column}`);
  }
  assert.deepEqual(survivors, [],
    'these tables still hold rows about a learner who was deleted. Add them to ERASE_BY_NAME in '
    + 'learnerErasure.js, or give them a foreign key to Users with ON DELETE CASCADE.');

  const [left] = await pool.query('SELECT COUNT(*) AS n FROM Users WHERE user_id = ?', [userId]);
  assert.strictEqual(Number(left[0].n), 0, 'the Users row itself survived');
  await pool.query('DELETE FROM Users WHERE user_id = ?', [otherId]);
});
