'use strict';

// /build, /builder and /games were the three thinnest pages on the site and
// named nothing. They now list the powers, the starter games and the
// challenges, read from the app. These fail if a page names one the app does
// not have, or drops one the app does.

const test = require('node:test');
const assert = require('node:assert');
const { PAGES } = require('./generate-static-seo');
const { loadLessonPlans, loadStarterGames, loadPuzzleConfigs } = require('./content-loader');

const text = (route) => JSON.stringify((PAGES.find((p) => p.route === route) || {}).sections || []);

test('/build names every power', () => {
  const t = text('/build');
  for (const p of loadLessonPlans().POWERS) assert.ok(t.includes(`${p.name} (${p.does})`), `${p.name} missing`);
});

test('/builder names every starter game', () => {
  const t = text('/builder');
  for (const g of loadStarterGames().STARTER_GAMES) assert.ok(t.includes(g.label), `${g.label} missing`);
});

test('/games names every challenge', () => {
  const t = text('/games');
  for (const c of Object.values(loadPuzzleConfigs())) assert.ok(t.includes(c.title), `${c.title} missing`);
});
