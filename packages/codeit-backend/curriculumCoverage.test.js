'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// ── Does the database know about every lesson the code ships? ────────────────
//
// This is the check that was missing, and it is worth being precise about what
// it would have caught, because it is two different failures with one shape.
//
// Lessons 17 to 31 were written, merged, and unreachable for roughly six days.
// The React files existed, the migration existed, and nothing had ever run it,
// so /api/lessons/17 returned 404 and lesson 18 stayed locked behind it. Half
// the course. Nobody could tell from the repository.
//
// Lessons 1 to 16 were worse and quieter: no migration existed at all. They
// lived as rows somebody had typed into production and nowhere else. Losing
// that project, or standing up a staging environment, would have lost them, and
// the repository would still have looked complete.
//
// Both are the same question — does anything outside the live database know
// this lesson exists? — and neither had anything asking it.
//
// This test asks it. It cannot see the live database, and does not need to: it
// compares what the code ships against what the migrations declare, and every
// lesson must appear in both.

const LESSON_DATA = path.join(__dirname, '..', 'gamified-elearning', 'src', 'pages', 'Lessons', 'lessonData');
const MIGRATIONS = path.join(__dirname, '..', '..', 'supabase', 'migrations');

/** Every lesson id the React app can route to. */
function lessonsInCode() {
  return fs.readdirSync(LESSON_DATA)
    .map(file => /^lesson(\d+)\.js$/.exec(file))
    .filter(Boolean)
    .map(match => Number(match[1]))
    .sort((a, b) => a - b);
}

/** Every lesson id any migration inserts a row for. */
function lessonsInMigrations() {
  const ids = new Set();
  for (const file of fs.readdirSync(MIGRATIONS).filter(name => name.endsWith('.sql'))) {
    const sql = fs.readFileSync(path.join(MIGRATIONS, file), 'utf8');
    // Only look at statements inserting into the lessons table, and only at
    // lines that are not comments — the 1-16 migration discusses lesson ids in
    // its own header at length.
    const statements = sql.split(/insert into public\.lessons\b/i).slice(1);
    for (const statement of statements) {
      const body = statement
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
      const match = /values\s*\(\s*(\d+)/i.exec(body);
      if (match) ids.add(Number(match[1]));
    }
  }
  return [...ids].sort((a, b) => a - b);
}

const inCode = lessonsInCode();
const inMigrations = lessonsInMigrations();

test('the curriculum is what we think it is', () => {
  assert.equal(inCode.length, 31, `found ${inCode.length} lesson files`);
  assert.deepEqual(inCode, Array.from({ length: 31 }, (_, i) => i + 1));
});

test('every lesson the app can open has a row in a migration', () => {
  const missing = inCode.filter(id => !inMigrations.includes(id));
  assert.deepEqual(missing, [],
    missing.length
      ? `lesson${missing.join(', lesson')} exist${missing.length === 1 ? 's' : ''} in `
        + 'src/pages/Lessons/lessonData/ but no migration creates the database row. '
        + 'Finishing one awards no XP and never unlocks the next lesson, and a '
        + 'rebuilt database would not have it at all.'
      : '');
});

test('no migration invents a lesson the app cannot open', () => {
  // The other direction. A row with no lesson file is a card on the map that
  // leads to a blank page.
  const orphans = inMigrations.filter(id => !inCode.includes(id));
  assert.deepEqual(orphans, [],
    `migrations create lesson ${orphans.join(', ')} but there is no lessonData file for it`);
});

test('every lesson row names a title and a description', () => {
  // title and description are NOT NULL in the schema, so a migration missing
  // one fails at 3am against a live database rather than here.
  for (const file of fs.readdirSync(MIGRATIONS).filter(name => name.endsWith('.sql'))) {
    const sql = fs.readFileSync(path.join(MIGRATIONS, file), 'utf8');
    for (const statement of sql.split(/insert into public\.lessons\s*\(/i).slice(1)) {
      const columns = statement.slice(0, statement.indexOf(')')).split(',').map(c => c.trim());
      assert.ok(columns.includes('title'), `${file}: a lessons insert omits title`);
      assert.ok(columns.includes('description'), `${file}: a lessons insert omits description`);
      assert.ok(columns.includes('id'), `${file}: a lessons insert omits id`);
    }
  }
});

test('nothing that creates a lesson can overwrite one that already exists', () => {
  // Every lessons insert must be guarded. These migrations get run against a
  // database holding real progress, and a row silently rewritten there is a
  // child's XP silently rewritten with it.
  for (const file of fs.readdirSync(MIGRATIONS).filter(name => name.endsWith('.sql'))) {
    const sql = fs.readFileSync(path.join(MIGRATIONS, file), 'utf8');
    for (const statement of sql.split(/insert into public\.lessons\b/i).slice(1)) {
      const upTo = statement.slice(0, statement.indexOf(';') + 1);
      assert.match(upTo, /on conflict[\s\S]*do nothing|where not exists/i,
        `${file}: a lessons insert is not guarded against an existing row`);
    }
  }
});
