'use strict';

// The class-account rule, run against the real schema: a child who joined
// with a code is one; a grown-up who joined the same class with their own
// account is not; nobody outside a class is.

const test = require('node:test');
const assert = require('node:assert');
const pool = require('./db');
const { isClassAccountSql } = require('./classAccounts');

test('the class-account SQL agrees with what a class join actually writes', async () => {
  const ids = [990101, 990102, 990103, 990104];
  await pool.query(`DELETE FROM Users WHERE user_id IN (${ids.join(',')})`);
  await pool.query("INSERT INTO Users (user_id, name, password, role, email) VALUES (990101, 'Teacher', 'x', 'parent', 'teacher@example.test')");
  await pool.query("INSERT INTO Users (user_id, name, password, role) VALUES (990102, 'Kid', 'x', 'student')");
  await pool.query("INSERT INTO Users (user_id, name, password, role, email) VALUES (990103, 'Member', 'x', 'parent', 'member@example.test')");
  await pool.query("INSERT INTO Users (user_id, name, password, role) VALUES (990104, 'Nobody', 'x', 'student')");
  await pool.query("INSERT INTO classes (owner_id, name, code) VALUES (990101, 'Room', 'TESTCODE99')");
  const [[klass]] = await pool.query("SELECT id FROM classes WHERE code = 'TESTCODE99'");
  await pool.query('INSERT INTO class_members (class_id, user_id) VALUES (?, ?), (?, ?)', [klass.id, 990102, klass.id, 990103]);

  const [rows] = await pool.query(
    `SELECT u.user_id, ${isClassAccountSql('u.user_id')} AS is_class FROM Users u WHERE u.user_id IN (${ids.join(',')}) ORDER BY u.user_id`
  );
  const verdict = Object.fromEntries(rows.map(r => [r.user_id, Boolean(r.is_class)]));
  assert.deepEqual(verdict, { 990101: false, 990102: true, 990103: false, 990104: false });

  await pool.query(`DELETE FROM Users WHERE user_id IN (${ids.join(',')})`);
});
