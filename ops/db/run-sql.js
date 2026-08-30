'use strict';

// ── Run one SQL file against the database in DATABASE_URL ───────────────────
//
// Exists because the owner's machine has no psql, and installing one to run
// two reviewed files is friction nobody needs. This is the psql line from the
// comments in those files, in the repo's own tooling:
//
//   DATABASE_URL='postgres://…' node ops/db/run-sql.js ops/db/proposed/fix-lesson-descriptions.sql
//
// It refuses to guess: no file argument, no DATABASE_URL, no run. The file's
// own BEGIN/COMMIT governs the transaction; this runner adds nothing around
// it. Query results (like the look-before-you-commit SELECT in the proposed
// scripts) are printed as a table.

const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Usage: DATABASE_URL=… node ops/db/run-sql.js <path-to-sql-file> [path-to-env-file]');
  process.exit(2);
}

// An optional second argument names an env file (e.g. one written by
// `vercel env pull`). Parsed here rather than `source`d in the shell, because
// a connection string with shell metacharacters in its password survives a
// file read and does not survive the shell. Values may be bare, single- or
// double-quoted.
const envFile = process.argv[3];
if (envFile && !process.env.DATABASE_URL) {
  try {
    for (const line of fs.readFileSync(path.resolve(envFile), 'utf8').split('\n')) {
      const match = line.match(/^DATABASE_URL\s*=\s*(.*)\s*$/);
      if (!match) continue;
      let value = match[1].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env.DATABASE_URL = value;
      break;
    }
  } catch (err) {
    console.error(`Could not read env file ${envFile}: ${err.message}`);
    process.exit(2);
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Set it for this one command only; never commit it.');
  process.exit(2);
}

const sqlPath = path.resolve(file);
let sql;
try {
  sql = fs.readFileSync(sqlPath, 'utf8');
} catch (err) {
  console.error(`Could not read ${sqlPath}: ${err.message}`);
  process.exit(2);
}

const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
  });
  try {
    await client.connect();
  } catch (err) {
    console.error(`Could not connect: ${err.message}`);
    console.error('Check the DATABASE_URL and that your network can reach the database.');
    process.exit(1);
  }
  try {
    const results = await client.query(sql);
    const list = Array.isArray(results) ? results : [results];
    for (const result of list) {
      if (result.command) {
        const rows = typeof result.rowCount === 'number' ? ` (${result.rowCount} row${result.rowCount === 1 ? '' : 's'})` : '';
        console.log(`${result.command}${rows}`);
      }
      if (result.rows && result.rows.length) console.table(result.rows);
    }
    console.log(`\nDone: ${path.basename(sqlPath)} ran to completion.`);
  } catch (err) {
    console.error(`\nFailed: ${err.message}`);
    console.error('If the file wraps itself in BEGIN/COMMIT, nothing was changed.');
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
