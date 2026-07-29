'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PAGES, renderRouteDocument } = require('./generate-static-seo');

const TEMPLATE = `<!doctype html><html><head>
  <title>Home</title>
  <meta name="description" content="home" />
  <link rel="canonical" href="https://codeitlearn.com/" />
  <meta property="og:url" content="https://codeitlearn.com/" />
  <meta property="og:title" content="Home" />
  <meta property="og:description" content="home" />
  <meta name="twitter:title" content="Home" />
  <meta name="twitter:description" content="home" />
</head><body><div id="root"><main>homepage fallback</main></div></body></html>`;

test('every generated page has a unique route', () => {
  const routes = PAGES.map((page) => page.route);
  assert.equal(new Set(routes).size, routes.length);
});

test('replaces homepage fallback and metadata with route-specific content', () => {
  const page = PAGES.find((item) => item.route === '/coding-for-kids');
  const html = renderRouteDocument(TEMPLATE, page);

  assert.match(html, /A first coding project they’ll want to keep improving/);
  assert.match(html, /private managed profiles for ages 8–12/);
  assert.match(html, /Independent student accounts begin at 13/);
  assert.match(html, /canonical" href="https:\/\/codeitlearn\.com\/coding-for-kids/);
  assert.match(html, /static-route-jsonld/);
  assert.doesNotMatch(html, /homepage fallback/);
});

test('does not leak one route into another route document', () => {
  const builder = renderRouteDocument(TEMPLATE, PAGES.find((item) => item.route === '/builder'));
  const games = renderRouteDocument(TEMPLATE, PAGES.find((item) => item.route === '/python-games-for-kids'));

  assert.match(builder, /Build a website\. Then learn how it works/);
  assert.doesNotMatch(builder, /Python games that make every line matter/);
  assert.match(games, /Python games that make every line matter/);
});

test('every route document has one matching canonical, title, and static marker', () => {
  for (const page of PAGES) {
    const html = renderRouteDocument(TEMPLATE, page);
    const canonicalMatches = html.match(/<link rel="canonical"[^>]*>/g) || [];
    const titleMatches = html.match(/<title>[\s\S]*?<\/title>/g) || [];

    assert.equal(canonicalMatches.length, 1, `${page.route} should have one canonical`);
    assert.match(canonicalMatches[0], new RegExp(`href="https://codeitlearn\\.com${page.route.replaceAll('/', '\\/')}"`));
    assert.equal(titleMatches.length, 1, `${page.route} should have one title`);
    assert.match(html, new RegExp(`data-static-route="${page.route.replaceAll('/', '\\/')}"`));
  }
});

test('the sitemap lists every generated public route on the canonical host', () => {
  const sitemap = fs.readFileSync(path.resolve(__dirname, '../public/sitemap.xml'), 'utf8');

  for (const page of PAGES) {
    assert.match(sitemap, new RegExp(`<loc>https://codeitlearn\\.com${page.route.replaceAll('/', '\\/')}</loc>`));
  }
  assert.doesNotMatch(sitemap, /www\.codeitlearn\.com/);
});

test('legal search documents use trust-specific copy', () => {
  const privacy = renderRouteDocument(TEMPLATE, PAGES.find((item) => item.route === '/privacy'));
  const terms = renderRouteDocument(TEMPLATE, PAGES.find((item) => item.route === '/terms'));

  assert.match(privacy, /Privacy choices and controls/);
  assert.match(privacy, /Read Privacy &amp; Safety/);
  assert.doesNotMatch(privacy, /What you can do on CodeIt/);
  assert.match(terms, /Using CodeIt responsibly/);
  assert.match(terms, /Read the Terms of Use/);
  assert.doesNotMatch(terms, /What you can do on CodeIt/);
});

test('private application pages are crawlable but excluded with X-Robots-Tag', () => {
  const robots = fs.readFileSync(path.resolve(__dirname, '../public/robots.txt'), 'utf8');
  const htaccess = fs.readFileSync(path.resolve(__dirname, '../public/.htaccess'), 'utf8');

  assert.doesNotMatch(robots, /Disallow:\s*\/(login|register|MainPage|admin|character|leaderboard|quiz)/);
  assert.match(htaccess, /X-Robots-Tag "noindex, nofollow"/);

  for (const route of ['login', 'register', 'MainPage', 'admin', 'character', 'leaderboard', 'quiz']) {
    assert.match(htaccess, new RegExp(`\\|${route}\\||\\(${route}\\||\\|${route}\\)`));
  }
});
