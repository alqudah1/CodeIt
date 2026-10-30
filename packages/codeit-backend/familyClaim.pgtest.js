'use strict';

// ── The child's game follows the child ──────────────────────────────────────
//
// Walked on 30 October 2026 against a local Postgres: a nine-year-old built a
// game as a guest, pressed Save, was told "ask a parent", the parent made the
// account and the profile, and the next day the child signed in to an empty
// Home. The game was on the parent's account. The register page had promised
// "your projects will be waiting".
//
// Run with:  DATABASE_URL=postgres://...@localhost/... node --test familyClaim.pgtest.js
// Skips without a localhost database so `npm test` can never touch a real one.

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
const DB_URL = process.env.DATABASE_URL || '';
const HAS_PG = /@(localhost|127\.0\.0\.1)[:/]/.test(DB_URL);

test('creating a learner with claimProjects moves the adult\'s saved games to the learner', { skip: !HAS_PG && 'no local Postgres' }, async () => {
  const pool = require('./db');
  const { createManagedChild, getFamilyStatus } = require('./familyAccounts');
  const stamp = Date.now().toString(36);
  const email = `claim.${stamp}@example.test`;
  const [adult] = await pool.query(
    `INSERT INTO Users (username, name, email, password, role) VALUES (?, ?, ?, 'x', 'Educator')`,
    [`pat_${stamp}`, 'Pat', email]
  );
  const adultId = adult.insertId;
  await pool.query(
    `INSERT INTO adult_email_verifications (user_id, email, verified_at, token_hash, expires_at) VALUES (?, ?, NOW(), NULL, NULL)`,
    [adultId, email]
  );
  await pool.query(
    `INSERT INTO ai_projects (user_id, title, prompt, generated_code, project_type) VALUES (?, 'Bunny Catch', 'a bunny', '<html>x</html>', 'game'), (?, 'Dog Site', 'my dog', '<html>y</html>', 'website')`,
    [adultId, adultId]
  );

  const before = await getFamilyStatus(adultId);
  assert.deepEqual(before.ownProjects.map((p) => p.title).sort(), ['Bunny Catch', 'Dog Site'], 'the form is told what is on the account');

  const child = await createManagedChild(adultId, {
    username: `sam_${stamp}`, password: 'bunnybunny123', dob: '2017-05-04', relationship: 'parent',
    consent: true, noticeVersion: before.noticeVersion, progressEmails: false, claimProjects: true,
  });
  assert.equal(child.movedProjects, 2);

  const [rows] = await pool.query('SELECT user_id, title FROM ai_projects WHERE user_id IN (?, ?) ORDER BY title', [adultId, child.id]);
  assert.deepEqual(rows.map((r) => [Number(r.user_id), r.title]), [[child.id, 'Bunny Catch'], [child.id, 'Dog Site']]);
  const after = await getFamilyStatus(adultId);
  assert.deepEqual(after.ownProjects, [], 'nothing left on the adult');
  assert.equal(after.children.find((c) => c.id === child.id).projects, 2, 'the learner has them');
});

test('without claimProjects nothing moves', { skip: !HAS_PG && 'no local Postgres' }, async () => {
  const pool = require('./db');
  const { createManagedChild } = require('./familyAccounts');
  const stamp = `${Date.now().toString(36)}b`;
  const email = `keep.${stamp}@example.test`;
  const [adult] = await pool.query(`INSERT INTO Users (username, name, email, password, role) VALUES (?, ?, ?, 'x', 'Educator')`, [`pat_${stamp}`, 'Pat', email]);
  await pool.query(`INSERT INTO adult_email_verifications (user_id, email, verified_at, token_hash, expires_at) VALUES (?, ?, NOW(), NULL, NULL)`, [adult.insertId, email]);
  await pool.query(`INSERT INTO ai_projects (user_id, title, prompt, generated_code, project_type) VALUES (?, 'Demo', 'demo', '<html>d</html>', 'game')`, [adult.insertId]);
  const { FAMILY_NOTICE_VERSION } = require('./familyAccountUtils');
  const child = await createManagedChild(adult.insertId, {
    username: `kid_${stamp}`, password: 'bunnybunny123', dob: '2017-05-04', relationship: 'parent',
    consent: true, noticeVersion: FAMILY_NOTICE_VERSION, progressEmails: false,
  });
  assert.equal(child.movedProjects, 0);
  const [rows] = await pool.query('SELECT user_id FROM ai_projects WHERE user_id = ?', [adult.insertId]);
  assert.equal(rows.length, 1);
});
