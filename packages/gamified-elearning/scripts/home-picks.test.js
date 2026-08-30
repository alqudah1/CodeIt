'use strict';

/**
 * The homepage named three games in prose, next to a slice() in another file.
 *
 * `HOME_PICKS = STARTER_GAMES.slice(0, 3)` decides what the front page shows.
 * The copy said "three ready-made games" and named them. Changing that slice to
 * four would have left the sentence claiming three and naming the wrong set,
 * with nothing anywhere to notice — the same shape as "sixteen lessons", which
 * was live on three pages against a course of thirty-one while a guard written
 * to catch exactly that reported success.
 *
 * ── Why this file does not contain the obvious tests ──
 *
 * The first version asserted that the sentence names every game the front page
 * shows and states the right number. Both passed. Both also passed after
 * changing the slice to four and after renaming a game, because the sentence is
 * now generated from that same data: the test compared a string against the
 * thing that produced it and reported that they agreed.
 *
 * A tautology that reads as coverage is worse than no test, and this repo has
 * had to delete several. Generating the sentence is what removed the drift, and
 * once it is generated there is nothing about its content left to check.
 *
 * What remains checkable is the wiring, which is what these do.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { HOME_PICKS } = require('./generate-static-seo.js');
const { loadStarterGames } = require('./content-loader');

const RAW = fs.readFileSync(path.resolve(__dirname, 'generate-static-seo.js'), 'utf8');

// Comments quote the old copy in order to explain why it changed, and a naive
// search for that wording finds the explanation and calls it the bug. Strip
// them: the assertions below are about code.
const SOURCE = RAW.split('\n')
  .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
  .join('\n');

test('the front page shows a short list, not every starter game', () => {
  const { HOME_PICKS: fromSource, STARTER_GAMES } = loadStarterGames();

  assert.ok(fromSource.length > 0, 'the front page shows no starter games at all');
  assert.ok(
    STARTER_GAMES.length > fromSource.length,
    'the front page shows every starter game, so the short list is doing nothing'
  );
  assert.deepEqual(
    HOME_PICKS.map((game) => game.id),
    fromSource.map((game) => game.id),
    'the generator and the app disagree about which games the front page shows'
  );
});

test('the sentence is generated from the games, not typed beside them', () => {
  // The only failure this file can still catch: somebody replaces the
  // interpolation with a number and a list of names again. Checking the wiring
  // is the technique the sitemap-date guard had to fall back on for the same
  // reason — the computed value and the correct value are indistinguishable
  // from the output on any day they agree, which is every day until they do not.
  const sentence = /The front page offers \$\{[^}]*HOME_PICK_COUNT[^}]*\} ready-made games/.exec(SOURCE);
  assert.ok(sentence, 'the front-page game count is no longer derived from HOME_PICKS');

  assert.match(
    SOURCE,
    /listSentence\(HOME_PICKS\.map\(\(game\) => game\.label\.toLowerCase\(\)\)\)/,
    'the games are no longer named from their own labels'
  );

  assert.ok(
    !/three ready-made games/.test(SOURCE),
    'the count has been typed back into the copy'
  );
});
