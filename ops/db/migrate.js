#!/usr/bin/env node
'use strict';

// ── Why nothing in supabase/migrations has ever run ──────────────────────────
//
// The folder has looked like a migration system since the first commit, and it
// is not one. Nothing reads it. Every migration in it has been applied, if at
// all, by somebody opening the Supabase SQL editor and pasting a file in — and
// the lessons 17 to 31 migration is the proof: it has sat in the repo since
// August, `git log` says it shipped, and /api/lessons/17 still returns 404. Half
// the curriculum has been unreachable for weeks and the repo looked fine.
//
// A folder that looks like a system and is not one is worse than no folder,
// because it stops anyone asking the question.
//
// ── What this does, and what it refuses to do ────────────────────────────────
//
// It prints a plan and stops. Applying anything needs --apply, typed on
// purpose, by a person who has read the plan.
//
// There is no CI hook here and there should not be one. Migrations run against
// the live database that holds every child's account and progress, and the
// standing rule on this project is that nothing destructive is deployed. An
// automatic runner turns one bad merge into one bad Saturday.
//
// Applied migrations are recorded in supabase_migrations.schema_migrations —
// the same schema and table the Supabase CLI uses, with the same columns — so
// running this and later running `supabase db push` agree about what is done
// rather than fighting about it.
//
// ── Adopting this on a database that already exists ──────────────────────────
//
// The live database was built by hand, so four of the five migrations have
// already been applied and nothing anywhere records that. A tool that starts
// from an empty ledger would conclude all five are pending and try to run
// codeit_initial_schema again: 82 statements, not one of them guarded by IF NOT
// EXISTS, against a database holding real accounts.
//
// So the first run refuses to apply anything and says so. --baseline <version>
// writes the ledger for everything up to and including that version without
// running a line of it, which is how you tell the tool what the database
// already knows. Only then will --apply do anything.

const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', '..', 'supabase', 'migrations');
const APPLY = process.argv.includes('--apply');
const BASELINE = (() => {
  const at = process.argv.indexOf('--baseline');
  return at === -1 ? null : process.argv[at + 1];
})();
// ── The empty database ───────────────────────────────────────────────────────
//
// The refusal above is exactly right for the live database and exactly wrong
// for a database that was created ten seconds ago: there, nothing has been
// applied by hand because nothing has been applied at all, and the tool
// refusing to start means a check run can never build its own stack.
//
// --fresh says "this database is new, run everything". It refuses to do that to
// a database with anything in it, so it cannot be pointed at production by
// accident — the guard is the state of the database, not a promise on the
// command line.
const FRESH = process.argv.includes('--fresh');
const URL = process.env.DATABASE_URL;

/** 20260820100000_curriculum_lessons_17_to_31.sql → version and name. */
function describe(file) {
  const match = /^(\d{14})_(.+)\.sql$/.exec(file);
  if (!match) return null;
  return { file, version: match[1], name: match[2] };
}

function onDisk() {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR).sort().map(describe).filter(Boolean);
}

// ── The safety read ─────────────────────────────────────────────────────────
//
// Not a substitute for reading the SQL. It is the check that catches the one
// mistake nobody survives: a migration that removes data from a live database.
const DESTRUCTIVE = [
  { pattern: /\bdrop\s+(table|column|schema|database)\b/i, what: 'drops something' },
  { pattern: /\btruncate\b/i, what: 'truncates a table' },
  { pattern: /\bdelete\s+from\b/i, what: 'deletes rows' },
  // An UPDATE is not destructive in the way a DROP is, and it is still the
  // category that needs a person. The one waiting to be written rewrites seven
  // lesson descriptions, and a lesson row carries the XP a child was awarded.
  { pattern: /\bupdate\s+public\.\w+\s+set\b/i, what: 'rewrites existing rows' },
];

function withoutComments(sql) {
  return sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
}

function warningsFor(sql) {
  const body = withoutComments(sql);
  return DESTRUCTIVE.filter(rule => rule.pattern.test(body)).map(rule => rule.what);
}

async function main() {
  const migrations = onDisk();
  if (!migrations.length) {
    console.log('No migrations in supabase/migrations.');
    return;
  }

  if (!URL) {
    console.log(`${migrations.length} migration(s) on disk:\n`);
    for (const m of migrations) console.log(`  ${m.version}  ${m.name}`);
    console.log('\nDATABASE_URL is not set, so I cannot say which have been applied.');
    console.log('Set it and run this again, or paste the file into the Supabase SQL editor.');
    process.exitCode = 1;
    return;
  }

  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: URL,
    ssl: URL.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10_000,
  });

  try {
    // Same schema, table and columns the Supabase CLI uses, so the two agree.
    await pool.query('create schema if not exists supabase_migrations');
    await pool.query(`create table if not exists supabase_migrations.schema_migrations (
      version text not null primary key,
      statements text[],
      name text
    )`);

    // ── Baselining, before anything else ──────────────────────────────────
    if (BASELINE) {
      const upTo = migrations.filter(m => m.version <= BASELINE);
      if (!upTo.length) {
        console.log(`No migration on disk at or before ${BASELINE}. Nothing recorded.`);
        process.exitCode = 1;
        return;
      }
      for (const m of upTo) {
        await pool.query(
          'insert into supabase_migrations.schema_migrations (version, name) values ($1, $2) on conflict (version) do nothing',
          [m.version, m.name]
        );
        console.log(`  recorded as already applied: ${m.version}  ${m.name}`);
      }
      console.log(`\n${upTo.length} migration(s) marked applied. Not one of them was run.`);
      console.log('Run this again with no flags to see what is left.');
      return;
    }

    const { rows } = await pool.query('select version from supabase_migrations.schema_migrations');
    const done = new Set(rows.map(row => row.version));
    const pending = migrations.filter(m => !done.has(m.version));

    console.log(`${migrations.length} on disk, ${done.size} already applied, ${pending.length} pending.\n`);

    if (!pending.length) {
      console.log('Nothing to do.');
      return;
    }

    // An empty ledger against a database with migrations on disk means this
    // tool has never run here, not that the database is empty.
    const neverAdopted = done.size === 0;

    for (const m of pending) {
      const sql = fs.readFileSync(path.join(DIR, m.file), 'utf8');
      const warnings = warningsFor(sql);
      const lines = sql.split('\n').length;
      console.log(`  ${m.version}  ${m.name}  (${lines} lines)`);
      for (const warning of warnings) console.log(`      ⚠ this migration ${warning}`);
    }

    const risky = pending.filter(m => warningsFor(fs.readFileSync(path.join(DIR, m.file), 'utf8')).length);

    if (neverAdopted && FRESH) {
      const { rows: [{ count }] } = await pool.query(
        "select count(*)::int as count from information_schema.tables where table_schema = 'public' and table_name <> 'schema_migrations'"
      );
      if (count > 0) {
        console.log(`\n--fresh refused: this database already has ${count} table(s) in it.`);
        console.log('It is not new, so "run everything" is not safe. Use --baseline <version>.');
        process.exitCode = 1;
        return;
      }
      console.log('\n--fresh: this database is empty, so every migration is genuinely pending.');
    } else if (neverAdopted) {
      console.log('\nNothing has ever been recorded here, so this tool cannot tell which of');
      console.log('these have already been applied by hand — and re-running one that has is');
      console.log('how a live database gets broken.');
      console.log('\nSay which ones are already done:');
      console.log('  DATABASE_URL=... node ops/db/migrate.js --baseline <version>');
      console.log('\nThat records everything up to and including <version> without running it.');
      process.exitCode = 1;
      return;
    }

    if (!APPLY) {
      console.log('\nThis was a plan. Nothing has been run.');
      console.log('To apply:  DATABASE_URL=... node ops/db/migrate.js --apply');
      if (risky.length) {
        console.log(`\n${risky.length} of these change or remove existing data. Read them first.`);
      }
      return;
    }

    // Apply up to the first one that needs a person, rather than refusing the
    // lot. Refusing everything would mean one migration awaiting judgement
    // blocks every safe migration written after it — which is how a queue of
    // unapplied work builds up, and this repository already has the scar.
    for (const m of pending) {
      const sql = fs.readFileSync(path.join(DIR, m.file), 'utf8');
      const warnings = warningsFor(sql);
      if (warnings.length) {
        console.log(`\n  stopping before ${m.version} ${m.name}: it ${warnings.join(' and ')}.`);
        console.log('  Run that one by hand, having read it, with a backup you have tested.');
        console.log('  Nothing after it has been run either.');
        process.exitCode = 1;
        return;
      }

      process.stdout.write(`  applying ${m.version} ${m.name} ... `);

      // The migration files carry their own begin/commit. Running them inside
      // another transaction would nest, so each file is trusted to bracket
      // itself and the bookkeeping row goes in immediately after it succeeds.
      const client = await pool.connect();
      try {
        await client.query(sql);
        await client.query(
          'insert into supabase_migrations.schema_migrations (version, name) values ($1, $2) on conflict (version) do nothing',
          [m.version, m.name]
        );
        console.log('done');
      } catch (error) {
        console.log('FAILED');
        console.error(`\n  ${error.message}`);
        console.error('\n  Stopped. Nothing after this one was run.');
        process.exitCode = 1;
        return;
      } finally {
        client.release();
      }
    }

    console.log('\nAll pending migrations applied.');
  } finally {
    await pool.end();
  }
}

// Only run when invoked directly, so the pure parts above can be tested
// without a database and without this file doing anything on require.
if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { describe, onDisk, warningsFor, withoutComments, DESTRUCTIVE };
