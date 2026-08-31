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

test('every blog post points at the guide that answers its question better', () => {
  // The seven posts were written in March and linked to nothing but the shared
  // nav. Each is the older answer to a question a guide now answers more
  // recently, in a category where the facts moved underneath them: Code.org
  // rebranded in June, Common Sense paused in February.
  //
  // This is not a duplication problem and was not treated as one. The worst
  // five-gram overlap between any two of these pages is 4.3%, measured before
  // anything was changed. It is an age problem, and the fix is a route onward
  // rather than a rewrite.
  const posts = PAGES.filter((page) => page.route.startsWith('/blog/'));
  assert.ok(posts.length >= 5, `only ${posts.length} blog posts were examined`);

  for (const post of posts) {
    const document = renderRouteDocument(TEMPLATE, post);
    const guides = [...document.matchAll(/href="\/guide\/([a-z-]+)"/g)].map((m) => m[1]);
    assert.ok(
      guides.length > 0,
      `${post.route} links to no guide, so a reader who lands on it from search has nowhere current to go`
    );
  }
});

test('a contextual guide link names a guide that exists', () => {
  // guideLinksFor silently drops a slug it cannot find, so a typo in the map
  // removes the link with no error and leaves the page exactly as dead-ended as
  // it was before anyone tried to fix it.
  const slugs = new Set(
    PAGES.filter((page) => page.route.startsWith('/guide/'))
      .map((page) => page.route.replace('/guide/', ''))
  );

  const source = fs.readFileSync(path.resolve(__dirname, 'generate-static-seo.js'), 'utf8');
  const map = /const GUIDES_BY_ROUTE = \{([\s\S]*?)\n\};/.exec(source);
  assert.ok(map, 'the contextual guide map could not be found, so this test examined nothing');

  const referenced = [...map[1].matchAll(/'([a-z][a-z0-9-]+)'/g)]
    .map((m) => m[1])
    .filter((name) => !name.startsWith('blog') && !name.includes('/'));

  assert.ok(referenced.length > 10, `only ${referenced.length} guide slugs were examined`);
  for (const slug of new Set(referenced)) {
    assert.ok(slugs.has(slug), `GUIDES_BY_ROUTE points at /guide/${slug}, which does not exist`);
  }
});

test('every lesson page links to guides, and to guides that exist', () => {
  // The count that made this necessary, from 30 August 2026: thirty-one lesson
  // pages, zero guide links between them. Lessons are 31 of the 74 indexable
  // URLs and were four of the six pages Google had actually indexed, so the
  // crawler's live frontier on this site had no route to a guide at all.
  //
  // 'no indexable page is orphaned' above could not see this. It counts links
  // arriving at a page, and the guides each had one from /guide, so they
  // passed. Nothing counted links leaving the pages that were already ranking.
  const slugs = new Set(loadGuidePages().map((guide) => guide.slug));
  const lessons = PAGES.filter((page) => /^\/lesson\/\d+$/.test(page.route || ''));

  assert.ok(lessons.length >= 31, `expected the lesson pages, found ${lessons.length}`);

  const empty = [];
  const unknown = [];
  for (const page of lessons) {
    const html = renderRouteDocument(TEMPLATE, page);
    const linked = [...html.matchAll(/href="\/guide\/([a-z0-9-]+)"/g)].map((m) => m[1]);
    if (!linked.length) empty.push(page.route);
    for (const slug of linked) if (!slugs.has(slug)) unknown.push(`${page.route} -> ${slug}`);
  }

  assert.deepEqual(empty, [], `these lesson pages link to no guide: ${empty.join(', ')}`);
  assert.deepEqual(unknown, [], `these lesson pages link to a guide that does not exist: ${unknown.join(', ')}`);
});
