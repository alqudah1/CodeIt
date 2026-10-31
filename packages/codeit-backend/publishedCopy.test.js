'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// ── What the server says to people has no em dashes ─────────────────────────
//
// The frontend has had this guard for a long time. The server's own words
// did not: on 31 October 2026 a child picking a taken username was told
// "That username is already taken — try another one", and the Cat and Mouse
// showcase game said "Move your finger — the cat follows it." on screen.
//
// This reads every route and the showcase games, and checks the strings a
// person can see: the `error`, `message`, `summary`, `detail` and `title`
// values the routes send, and the text of the showcase games. Prompts to the
// model and code comments are not copy, so they are not checked here.

const ROOT = __dirname;
const DASH = /—|&mdash;/;

function routeFiles() {
  const dir = path.join(ROOT, 'routes');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.js') && !f.endsWith('.test.js')).map((f) => path.join(dir, f));
}

const SHOWN = /\b(error|message|summary|detail|title)\s*:\s*(['"`])((?:\\.|(?!\2)[^\\\n])*)\2/g;

test('no reply a person can read carries an em dash', () => {
  const offenders = [];
  for (const file of routeFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(SHOWN)) {
      if (DASH.test(match[3])) {
        const line = text.slice(0, match.index).split('\n').length;
        offenders.push(`${path.relative(ROOT, file)}:${line} ${match[0].slice(0, 120)}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test('the showcase games, played on Explore, have none either', () => {
  const { SHOWCASE_PROJECTS } = require('./showcaseProjects');
  assert.ok(SHOWCASE_PROJECTS.length > 3);
  for (const project of SHOWCASE_PROJECTS) {
    assert.doesNotMatch(`${project.title} ${project.prompt} ${project.generated_code}`, DASH, project.title);
  }
});

test('the scan would see one', () => {
  const sample = "res.status(400).json({ error: 'That username is already taken — try another one' });";
  assert.equal([...sample.matchAll(SHOWN)].filter((m) => DASH.test(m[3])).length, 1);
});
