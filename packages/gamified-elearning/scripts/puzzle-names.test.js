'use strict';

/**
 * Every puzzle the site names has to be a puzzle that exists.
 *
 * Until 24 October 2026, /python-games-for-kids was built end to end around
 * five puzzles called Talking Robot Adventure, Apple Game Challenge, Loop Game
 * Challenge, Condition Game Master and Math Game Quest. None of them existed.
 * They were the old puzzle system, reachable through src/utils/puzzleNavigation.js,
 * which pointed at /puzzle, /apple-game, /math-game, /condition-game and
 * /loop-game — five routes that are in neither App.js nor vercel.json — and
 * which nothing had imported for a long time.
 *
 * So the landing page for coding games advertised five games that could not be
 * opened, under names the product does not use, said more were "in
 * development", and never mentioned the thirty real ones. Google crawled that
 * page on 8 September and declined to index it.
 *
 * The names are checked against puzzleConfigs.js now, which is the only place
 * a puzzle is really defined.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const CONFIGS = fs.readFileSync(
  path.resolve(__dirname, '../src/pages/Journey/puzzleConfigs.js'),
  'utf8'
);

/** Every title: in puzzleConfigs. */
const REAL = new Set(
  [...CONFIGS.matchAll(/^\s*title:\s*'([^']+)'/gm)].map(match => match[1])
);

/** Files that describe the puzzles to a reader. */
const COPY = [
  '../src/pages/SEO/PythonGamesForKids.js',
  '../src/data/blogPosts.js',
  './generate-static-seo.js',
].map(file => {
  const raw = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
  // Source wraps. "Round\n Counter" is the same name to a reader and a crawler,
  // and matching raw source would have called it missing.
  return { file, text: raw.replace(/\s+/g, ' ') };
});

test('puzzleConfigs still defines the puzzles this test checks against', () => {
  assert.ok(REAL.size >= 30, `expected at least 30 puzzle titles, found ${REAL.size}`);
  for (const title of ['Hello World!', 'Mission Banner', 'Mini Program']) {
    assert.ok(REAL.has(title), `${title} has gone from puzzleConfigs.js`);
  }
});

test('no page names a puzzle that does not exist', () => {
  // The five from the retired system. If any of these comes back into copy it
  // is a page describing something a child cannot open.
  const RETIRED = [
    'Talking Robot Adventure', 'Talking Robot',
    'Apple Game Challenge', 'Apple Game',
    'Loop Game Challenge', 'Loop Game',
    'Condition Game Master', 'Condition Game',
    'Math Game Quest', 'Math Game',
  ];

  for (const { file, text } of COPY) {
    for (const name of RETIRED) {
      assert.ok(
        !text.includes(name),
        `${file} names "${name}", which is not a puzzle in puzzleConfigs.js. `
          + `Real titles include: ${[...REAL].slice(0, 4).join(', ')}.`
      );
    }
  }
});

test('every name in the games page puzzle list is a real puzzle', () => {
  // The denylist above only catches the five names we already know about, and
  // the boss check below only notices a name going missing everywhere. Neither
  // notices an invented name appearing. So the list itself is parsed: each
  // entry names its puzzles after the lesson label, and every one of those has
  // to exist.
  const raw = fs.readFileSync(
    path.resolve(__dirname, '../src/pages/SEO/PythonGamesForKids.js'),
    'utf8'
  ).replace(/\s+/g, ' ');

  const items = [...raw.matchAll(/<li><strong>Lesson [^<]*<\/strong>([^<]+)<\/li>/g)]
    .map(match => match[1]);

  assert.ok(items.length >= 10, `expected the ten lesson entries, parsed ${items.length}`);

  let checked = 0;
  for (const item of items) {
    const names = item
      .replace(/\band the boss\b/gi, '')
      .split(',')
      .map(part => part.trim().replace(/\.$/, ''))
      .filter(Boolean);

    for (const name of names) {
      assert.ok(
        REAL.has(name),
        `the games page lists "${name}", which is not a title in puzzleConfigs.js`
      );
      checked += 1;
    }
  }
  assert.ok(checked >= 30, `expected to check the puzzles by name, checked ${checked}`);
});

test('the games page names every boss', () => {
  const page = COPY.find(entry => entry.file.includes('PythonGamesForKids')).text;

  // A boss is the puzzle a page is most likely to name and a child most likely
  // to go looking for, so each one going missing is worth failing over.
  for (const boss of [
    'Mission Banner', 'Profile Card', 'Message Builder', 'Temperature Report',
    'Round Counter', 'Vowel Counter', 'List Boss', 'Score Counter',
    'Function Boss', 'Mini Program',
  ]) {
    assert.ok(REAL.has(boss), `${boss} has gone from puzzleConfigs.js`);
    assert.ok(page.includes(boss), `the games page no longer names the boss ${boss}`);
  }
});

test('the retired puzzle navigation module stays gone', () => {
  // It pointed at five routes that do not exist and nothing imported it. It is
  // where the wrong names came from, so its return would bring them back.
  assert.ok(
    !fs.existsSync(path.resolve(__dirname, '../src/utils/puzzleNavigation.js')),
    'src/utils/puzzleNavigation.js is back; it routes to pages that do not exist'
  );
});
