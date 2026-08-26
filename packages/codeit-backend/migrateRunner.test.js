'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// ── The parts of the migration runner that must not be wrong ─────────────────
//
// The runner talks to a live database holding real accounts, so the pieces that
// decide *whether* to run something are tested here, without one.
//
// The reason it needs a baseline step at all: four of the five migrations in
// this repo were applied by hand months ago and nothing recorded that. A runner
// starting from an empty ledger would call all five pending and try
// codeit_initial_schema again — 383 lines, 82 statements, not one guarded by
// IF NOT EXISTS, against a database with children's accounts in it.

const runner = require(path.join(__dirname, '..', '..', 'ops', 'db', 'migrate.js'));

// ── Reading the folder ──────────────────────────────────────────────────────

test('a migration filename gives up its version and its name', () => {
  const parsed = runner.describe('20260820100000_curriculum_lessons_17_to_31.sql');
  assert.equal(parsed.version, '20260820100000');
  assert.equal(parsed.name, 'curriculum_lessons_17_to_31');
});

test('anything that is not a migration is ignored, not guessed at', () => {
  for (const name of ['README.md', 'notes.sql', '2026_thing.sql', '.DS_Store', 'backup.sql.bak']) {
    assert.equal(runner.describe(name), null, `${name} should not parse as a migration`);
  }
});

test('the real folder parses, and in order', () => {
  const found = runner.onDisk();
  assert.ok(found.length >= 5, `found ${found.length} migrations`);
  const versions = found.map(m => m.version);
  assert.deepEqual(versions, [...versions].sort(), 'migrations must be in version order');
  assert.ok(versions.includes('20260820100000'), 'the 17-31 curriculum migration is missing');
});

// ── The read that stops a bad Saturday ──────────────────────────────────────

test('it notices a migration that removes data', () => {
  assert.deepEqual(runner.warningsFor('drop table public.users;'), ['drops something']);
  assert.deepEqual(runner.warningsFor('truncate public.lessons;'), ['truncates a table']);
  assert.deepEqual(runner.warningsFor('delete from public.projects where id = 1;'), ['deletes rows']);
  assert.deepEqual(runner.warningsFor("update public.lessons set description = 'x' where id = 3;"),
    ['rewrites existing rows']);
});

test('an insert is not an update, however many words it shares with one', () => {
  // The guarded inserts these migrations are built from must not trip it, or
  // the runner refuses every migration in the repository.
  const insert = `insert into public.lessons (id, title, description, xp)
values (3, 'Strings', 'set of characters', 60)
  on conflict (id) do nothing;`;
  assert.deepEqual(runner.warningsFor(insert), []);
});

test('it does not panic at the word "drop" in a sentence', () => {
  // The 17-31 migration describes a lesson as being about "sets that drop
  // duplicates". A runner that refuses to apply it over that is a runner
  // nobody uses.
  const prose = `-- sets that drop duplicates and delete from nothing
insert into public.lessons (id, title) values (22, 'Tuples and Sets')
  on conflict (id) do nothing;`;
  assert.deepEqual(runner.warningsFor(prose), []);
});

test('a comment cannot hide a destructive statement either way round', () => {
  assert.deepEqual(runner.warningsFor('-- drop table users\nselect 1;'), []);
  assert.deepEqual(runner.warningsFor('select 1; -- keep\ndrop table users;'), ['drops something']);
});

// ── The migration this whole thing exists for ───────────────────────────────

test('the curriculum migration reads as safe to apply', () => {
  const fs = require('node:fs');
  const file = path.join(__dirname, '..', '..', 'supabase', 'migrations',
    '20260820100000_curriculum_lessons_17_to_31.sql');
  assert.deepEqual(runner.warningsFor(fs.readFileSync(file, 'utf8')), []);
});

test('the initial schema does NOT, which is the point of the baseline', () => {
  // If this ever comes back clean, either someone made the initial schema
  // idempotent — good — or the check stopped working. Either way, look.
  const fs = require('node:fs');
  const file = path.join(__dirname, '..', '..', 'supabase', 'migrations',
    '20260808170000_codeit_initial_schema.sql');
  const sql = fs.readFileSync(file, 'utf8');
  const guarded = (sql.match(/if not exists/gi) || []).length;
  assert.equal(guarded, 0,
    'the initial schema is now guarded — re-check whether the baseline warning still needs to be so loud');
});
