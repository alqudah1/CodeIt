'use strict';

/**
 * The h1 a crawler is served and the h1 a person is served must be the same
 * sentence.
 *
 * On 16 October 2026 the h1 on /learn-python-for-kids was rewritten in
 * LearnPythonForKids.js and the live site did not change, because that page's
 * crawlable HTML is written by generate-static-seo.js and not rendered from
 * the component. The build succeeded, every test passed, and Google kept
 * reading the old sentence. The edit was invisible in exactly the way that is
 * hardest to notice: nothing failed.
 *
 * page-meta.test.js already pins titles and descriptions this way. The h1 was
 * the one visible promise on a landing page that nothing held together.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { PAGES } = require('./generate-static-seo.js');

const SEO_DIR = path.resolve(__dirname, '../src/pages/SEO');

/** '/learn-python-for-kids' -> 'LearnPythonForKids' */
function componentNameFor(route) {
  return route
    .replace(/^\//, '')
    .split('-')
    .map(part => (part === 'ai' ? 'AI' : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

/** The first h1's text, whatever className it carries. */
function h1Of(source) {
  const match = /<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/.exec(source);
  return match ? match[1].replace(/\s+/g, ' ').trim() : null;
}

test('every SEO page renders the same h1 the static generator writes', () => {
  let checked = 0;

  for (const page of PAGES) {
    if (!page.h1) continue;
    const file = path.join(SEO_DIR, `${componentNameFor(page.route)}.js`);
    if (!fs.existsSync(file)) continue;

    const rendered = h1Of(fs.readFileSync(file, 'utf8'));
    assert.ok(rendered, `${page.route}: the component has no h1 at all`);
    assert.strictEqual(
      rendered,
      page.h1,
      `${page.route}: the crawler is served "${page.h1}" and a person is served "${rendered}". `
        + 'Change both, in generate-static-seo.js and in the component.'
    );
    checked += 1;
  }

  // A pairing test that pairs nothing passes forever. If the file naming
  // convention changes, this is what says so.
  assert.ok(checked >= 4, `expected at least 4 paired SEO pages, paired ${checked}`);
});

test('the Python landing page says the phrase it is trying to rank for', () => {
  // Search Console, 16 October 2026: position 3.0 to 3.6 on every query
  // containing "free", and 30 to 44 on the same query without it, with zero
  // clicks from any of them. The page was 1,633 words and used the exact
  // phrase twice, never in the h1. This is the floor, not the goal.
  const page = PAGES.find(entry => entry.route === '/learn-python-for-kids');
  assert.ok(page, 'the /learn-python-for-kids entry has gone');
  assert.match(page.h1, /python for kids/i, 'the h1 no longer contains the head term');
});
