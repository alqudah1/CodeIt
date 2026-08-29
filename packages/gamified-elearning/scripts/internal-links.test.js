'use strict';

/**
 * No page may be reachable only through the sitemap.
 *
 * All twelve guides were orphaned: zero inbound links anywhere in the crawlable
 * HTML, including from /guide, the index whose entire purpose is listing them.
 * It built a heading and a description for each guide and no anchor. A crawler
 * that does not run JavaScript could reach them only via sitemap.xml, which is
 * the weakest signal available, and pages in that state are routinely left
 * unindexed.
 *
 * That is the likeliest explanation for guides written against queries with
 * almost no competition failing to surface at all. Not authority. Not content.
 * Nothing linked to them.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { PAGES, HOME_PAGE, renderRouteDocument } = require('./generate-static-seo.js');
const { loadGuidePages } = require('./content-loader');

const TEMPLATE = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');

/** route -> how many other pages link to it */
function inboundCounts() {
  const counts = new Map();
  for (const page of [HOME_PAGE, ...PAGES]) {
    const from = page.route || '/';
    const html = renderRouteDocument(TEMPLATE, page);
    const targets = new Set([...html.matchAll(/href="(\/[a-z0-9/-]*)"/gi)].map((m) => m[1]));
    for (const target of targets) {
      if (target === from) continue;
      counts.set(target, (counts.get(target) || 0) + 1);
    }
  }
  return counts;
}

test('the guide index links to every guide', () => {
  const index = PAGES.find((page) => page.route === '/guide');
  assert.ok(index, 'there is no /guide page');
  const html = renderRouteDocument(TEMPLATE, index);
  const linked = new Set([...html.matchAll(/href="(\/guide\/[a-z0-9-]+)"/g)].map((m) => m[1]));

  for (const guide of loadGuidePages()) {
    assert.ok(
      linked.has(`/guide/${guide.slug}`),
      `/guide does not link to /guide/${guide.slug}, so nothing on the site does`
    );
  }
});

test('every guide has at least one inbound link from elsewhere on the site', () => {
  const counts = inboundCounts();
  const orphans = loadGuidePages()
    .map((guide) => `/guide/${guide.slug}`)
    .filter((route) => !counts.get(route));

  assert.deepEqual(
    orphans,
    [],
    `these guides are reachable only through the sitemap: ${orphans.join(', ')}`
  );
});

test('no indexable page is orphaned', () => {
  // Lesson and blog pages are excluded: they are linked from their own index
  // pages, which is checked by the sitemap tests, and listing 31 lessons in
  // every nav would be link spam rather than navigation.
  const counts = inboundCounts();
  const skip = /^\/(lesson|blog)\//;
  const orphans = PAGES.map((page) => page.route)
    .filter((route) => route !== '/' && !skip.test(route))
    .filter((route) => !counts.get(route));

  assert.deepEqual(orphans, [], `no page links to: ${orphans.join(', ')}`);
});
