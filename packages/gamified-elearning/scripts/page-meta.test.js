'use strict';

/**
 * One title and one description per route, in one file.
 *
 * Every page used to write its title and description twice: once in the React
 * page's useSEO call, once in the static generator. Nothing kept them in sync,
 * and on 25 August 2026 eleven of the sixteen pairs disagreed. Two of those
 * were not cosmetic: /pricing quoted a crawler CA$12 a month while inviting a
 * person to a free pilot, and /builder still told a JavaScript crawler that
 * children edit the real code.
 *
 * These tests exist so that cannot come back by hand.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { loadPageMeta } = require('./content-loader');
const { PAGES, HOME_PAGE } = require('./generate-static-seo.js');

const META = loadPageMeta();
const PAGES_DIR = path.resolve(__dirname, '../src/pages');

function jsFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) jsFiles(full, out);
    else if (/\.js$/.test(entry.name) && !/\.test\.js$/.test(entry.name)) out.push(full);
  }
  return out;
}

test('no React page writes its own title or description for a route that has one', () => {
  let checked = 0;
  for (const file of jsFiles(PAGES_DIR)) {
    const source = fs.readFileSync(file, 'utf8');
    const call = /useSEO\(\{([\s\S]*?)\n\s*\}\);/.exec(source);
    if (!call) continue;
    // Both quote styles. The first version of this test matched single quotes
    // only, so it skipped Home.js — which wrote canonical: "/" with double
    // quotes and carried a description saying children "edit, save, and share
    // the code behind" their projects. The homepage was the one page this was
    // most important on, and the test passed.
    const canonical = /canonical:\s*['"]([^'"]+)['"]/.exec(call[1]);
    if (!canonical || !META[canonical[1]]) continue;

    checked += 1;
    const relative = path.relative(PAGES_DIR, file);
    assert.ok(
      !/\btitle:/.test(call[1]),
      `${relative} sets its own title; ${canonical[1]} already has one in src/data/pageMeta.js`
    );
    assert.ok(
      !/\bdescription:/.test(call[1]),
      `${relative} sets its own description; ${canonical[1]} already has one in src/data/pageMeta.js`
    );
  }
  assert.ok(checked > 0, 'no useSEO call was checked; this test is not doing anything');
});

test('every hand-written page has an entry, and every entry is used', () => {
  // Lesson, blog and guide routes build their titles from their own content and
  // are deliberately absent from pageMeta. Everything else should be there.
  const derived = /^\/(lesson|blog|guide)\//;
  for (const page of [HOME_PAGE, ...PAGES]) {
    const route = page.route || '/';
    if (derived.test(route)) continue;
    assert.ok(META[route], `${route} has no entry in src/data/pageMeta.js`);
  }

  // An entry nobody reads is dead weight that still looks authoritative.
  const live = new Set([HOME_PAGE, ...PAGES].map((p) => p.route || '/'));
  const reactCanonicals = new Set();
  for (const file of jsFiles(PAGES_DIR)) {
    const call = /useSEO\(\{([\s\S]*?)\n\s*\}\);/.exec(fs.readFileSync(file, 'utf8'));
    const canonical = call && /canonical:\s*['"]([^'"]+)['"]/.exec(call[1]);
    if (canonical) reactCanonicals.add(canonical[1]);
  }
  for (const route of Object.keys(META)) {
    assert.ok(
      live.has(route) || reactCanonicals.has(route),
      `src/data/pageMeta.js has an entry for ${route}, which no page uses`
    );
  }
});

test('the rendered page shows what pageMeta says', () => {
  const template = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
  const { renderRouteDocument } = require('./generate-static-seo.js');
  for (const route of ['/pricing', '/builder', '/about']) {
    const page = PAGES.find((p) => p.route === route);
    const html = renderRouteDocument(template, page);
    const rendered = /<meta name="description" content="([^"]*)"/.exec(html)[1];
    assert.equal(rendered, META[route].description, `${route} rendered a description pageMeta does not hold`);
  }
});

test('an indexable page does not spend its title on the brand name alone', () => {
  // Found live on 30 August 2026: /about was titled 'About CodeIt'. Twelve
  // characters, one word that is not the brand, on the page an assistant reads
  // when it is asked who makes this thing and where it is from. Nothing caught
  // it, because nothing looked at title quality at all — only at whether the
  // two copies of the title agreed with each other, and they agreed perfectly
  // on saying nothing.
  //
  // Signed-in app pages are exempt: they carry noindex, so a short title is
  // correct there. The sitemap is what decides, because it is the same list
  // that decides what Google is asked to look at.
  const sitemapRoutes = new Set(
    [HOME_PAGE, ...PAGES]
      .filter((page) => page.noindex !== true)
      .map((page) => page.route || '/')
  );

  const offenders = [];
  for (const [route, entry] of Object.entries(META)) {
    if (!sitemapRoutes.has(route)) continue;
    const withoutBrand = entry.title
      .replace(/codeit ?(learn)?/gi, ' ')
      .replace(/[^A-Za-z0-9]+/g, ' ')
      .trim();
    const words = withoutBrand ? withoutBrand.split(/\s+/) : [];
    if (words.length < 2) offenders.push(`${route}: ${JSON.stringify(entry.title)}`);
  }

  assert.deepEqual(offenders, [],
    'these titles say nothing a search for the brand would not already find:\n  ' +
      offenders.join('\n  '));
});
