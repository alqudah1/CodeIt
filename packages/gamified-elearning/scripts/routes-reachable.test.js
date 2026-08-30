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

/* ── The third source of truth ────────────────────────────────────────────────
   The checks above compare the static generator against App.js. There is a
   third list that has to agree with both and was never checked: the SPA rewrite
   allowlist in vercel.json.

   Vercel serves this site from a static directory with an explicit allowlist and
   no catch-all. A React route that is not in that allowlist, and has no static
   file generated for it, is a hard 404 before React ever boots — not a missing
   page inside the app, a missing page on the internet.

   That is not hypothetical. /understood/:token, the link a parent sends someone
   to show what their child could explain, shipped without being added. Every
   shared link 404'd. Verified live before this was written. It is the same
   failure as /press in the other direction, and neither of the two guards above
   could see it, because both halves they compare were correct. */

const VERCEL = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../vercel.json'), 'utf8')
);

/** The first path segment of every route the SPA rewrite will serve. */
function allowlistedSegments() {
  const spa = VERCEL.rewrites.find((rule) => rule.destination === '/index.html');
  assert.ok(spa, 'vercel.json has no SPA rewrite; this test cannot check anything');

  const group = /\(([^)]*)\)/.exec(spa.source);
  assert.ok(group, `could not read the allowlist out of ${spa.source}`);
  return new Set(group[1].split('|'));
}

/** Path prefixes served by a rewrite of their own, e.g. /project via api/share. */
function otherRewritePrefixes() {
  return VERCEL.rewrites
    .filter((rule) => rule.destination !== '/index.html')
    .map((rule) => /^\/([a-zA-Z0-9_-]+)/.exec(rule.source))
    .filter(Boolean)
    .map((match) => match[1]);
}

test('every route in App.js is actually served by vercel.json', () => {
  const allowed = allowlistedSegments();
  const others = otherRewritePrefixes();
  const generated = new Set([HOME_PAGE, ...PAGES].map((page) => page.route || '/'));

  const unreachable = [];
  for (const route of reactRoutes().map((r) => r.raw)) {
    if (route === '/') continue;
    const segment = route.split('/')[1];
    if (segment.startsWith(':')) continue; // a wildcard at the root, nothing to allow

    if (allowed.has(segment)) continue;
    if (others.includes(segment)) continue;
    if (generated.has(route)) continue; // a real file exists at that path

    unreachable.push(route);
  }

  assert.deepEqual(
    unreachable,
    [],
    `${unreachable.join(', ')} exist in App.js and are not in the vercel.json allowlist, ` +
      'so opening one directly is a 404 before React runs'
  );
});

test('routes that show a person are excluded from search', () => {
  // /understood/:token renders a child's first name and what they explained,
  // from a link a parent may paste anywhere. It must never be indexable, and it
  // was not in the noindex list when it shipped.
  const rule = VERCEL.headers.find((entry) =>
    entry.headers.some((header) => header.key === 'X-Robots-Tag')
  );
  assert.ok(rule, 'nothing in vercel.json sends X-Robots-Tag any more');

  const value = rule.headers.find((header) => header.key === 'X-Robots-Tag').value;
  assert.match(value, /noindex/, `X-Robots-Tag is "${value}"`);

  for (const segment of ['understood', 'profile', 'project', 'admin', 'login', 'quiz']) {
    assert.ok(
      new RegExp(`[(|]${segment}[|)]`).test(rule.source),
      `/${segment} is not covered by the noindex header, and it shows personal data`
    );
  }
});
