'use strict';

/**
 * A page a crawler can read and a person cannot is not a page.
 *
 * /press shipped in the static generator and the sitemap with no React route.
 * App.js ends its route table with `<Route path="*" element={<Navigate to="/"
 * replace />} />`, so anyone who clicked that URL in a search result was
 * silently redirected to the homepage: the crawlable HTML rendered, React
 * booted, matched nothing, and navigated away from the page they asked for.
 *
 * Google reads that as a soft 404 and it costs the whole domain, not just the
 * one URL. Nothing noticed, because every guard in this repo checks the
 * generated HTML and none of them had ever looked at App.js.
 *
 * This checks the two halves against each other in both directions.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { PAGES, HOME_PAGE } = require('./generate-static-seo.js');

const APP = fs.readFileSync(path.resolve(__dirname, '../src/App.js'), 'utf8');

/** Every path= in App.js, as a matcher. ":id" matches one segment, "*" matches all. */
function reactRoutes() {
  return [...APP.matchAll(/path="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((route) => route !== '*')
    .map((route) => ({
      raw: route,
      matches: new RegExp(`^${route.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*')}$`),
    }));
}

test('App.js still sends unmatched paths somewhere, so this test has a reason to exist', () => {
  // If the catch-all is ever removed or changed to a 404 page, the failure mode
  // described above changes and this file should be reread rather than trusted.
  assert.match(
    APP,
    /path="\*"/,
    'App.js no longer has a catch-all route; re-read routes-reachable.test.js before relying on it'
  );
});

test('every route in the sitemap has a React route to render it', () => {
  const routes = reactRoutes();
  assert.ok(routes.length > 20, `only ${routes.length} React routes were parsed; the parser is wrong`);

  const orphans = [];
  for (const page of [HOME_PAGE, ...PAGES]) {
    const route = page.route || '/';
    if (!routes.some((candidate) => candidate.matches.test(route))) orphans.push(route);
  }

  assert.deepEqual(
    orphans,
    [],
    `${orphans.join(', ')} would be indexed and then redirected to the homepage on arrival`
  );
});

test('the static generator knows about every content route the app renders', () => {
  // The other direction. A page that exists in React and not in the generator
  // is served to a crawler as the shared template with no body of its own,
  // which is how eleven pages were orphaned before.
  //
  // Scoped to content routes: account, admin and interactive pages are
  // deliberately absent from the sitemap and carry X-Robots-Tag noindex.
  const NOT_CONTENT = new RegExp(
    '^/(MainPage|admin|login|register|forgot-password|reset-password|parent-review|' +
      'character|leaderboard|profile|quiz|project|creator-brief|investor-brief|' +
      'journey/puzzle|game/)'
  );

  const generated = new Set([HOME_PAGE, ...PAGES].map((page) => page.route || '/'));
  const missing = reactRoutes()
    .map((route) => route.raw)
    .filter((route) => !route.includes(':') && !NOT_CONTENT.test(route))
    .filter((route) => !generated.has(route));

  assert.deepEqual(
    missing,
    [],
    `${missing.join(', ')} exist in the app but have no crawlable copy and are in no sitemap`
  );
});
