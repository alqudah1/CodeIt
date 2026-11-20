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

test('every lesson is linked from the lessons index and from its neighbours', () => {
  // In the copy a crawler reads, /lessons named every lesson and linked none,
  // and lessons 5 and 14 had no inbound link from any page on the site.
  const { renderRouteDocument } = require('./generate-static-seo');
  const TEMPLATE = '<!doctype html><html><head><title>Home</title><meta name="description" content="home" /><link rel="canonical" href="https://codeitlearn.com/" /><meta property="og:url" content="https://codeitlearn.com/" /><meta property="og:title" content="Home" /><meta property="og:description" content="home" /><meta name="twitter:title" content="Home" /><meta name="twitter:description" content="home" /></head><body><div id="root"><main>homepage fallback</main></div></body></html>';
  const html = (route) => renderRouteDocument(TEMPLATE, PAGES.find((p) => p.route === route));
  const index = html('/lessons');
  const lessons = PAGES.filter((p) => /^\/lesson\/\d+$/.test(p.route));
  const missing = [];
  for (const page of lessons) {
    const n = Number(page.route.split('/').pop());
    if (!index.includes(`href="/lesson/${n}"`)) missing.push(`/lessons does not link lesson ${n}`);
    if (n > 1 && !html(`/lesson/${n - 1}`).includes(`href="/lesson/${n}"`)) missing.push(`lesson ${n - 1} does not link lesson ${n}`);
  }
  assert.deepEqual(missing, []);
});

test('the blog index links every post', () => {
  const { renderRouteDocument } = require('./generate-static-seo');
  const TEMPLATE = '<!doctype html><html><head><title>Home</title><meta name="description" content="home" /><link rel="canonical" href="https://codeitlearn.com/" /><meta property="og:url" content="https://codeitlearn.com/" /><meta property="og:title" content="Home" /><meta property="og:description" content="home" /><meta name="twitter:title" content="Home" /><meta name="twitter:description" content="home" /></head><body><div id="root"><main>homepage fallback</main></div></body></html>';
  const index = renderRouteDocument(TEMPLATE, PAGES.find((p) => p.route === '/blog'));
  const posts = PAGES.filter((p) => /^\/blog\/[^/]+$/.test(p.route));
  assert.ok(posts.length > 0);
  for (const post of posts) assert.ok(index.includes(`href="${post.route}"`), `${post.route} is not linked from /blog`);
});
