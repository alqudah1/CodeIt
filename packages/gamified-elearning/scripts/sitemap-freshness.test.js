'use strict';

/**
 * The sitemap's lastmod used to be a date somebody typed.
 *
 * It said 2026-08-25 while the site was being changed on the 26th, and it would
 * have kept saying it for as long as nobody remembered the constant existed. A
 * crawler reading that has been told, on every URL, that nothing has changed.
 *
 * It now comes from the commit date: fixed for a given commit, so the build
 * stays byte-identical for the same input, and moving without anyone noticing.
 *
 * This file has been deleted once by a merge and the constant reverted with it.
 * If it goes missing again, the sitemap is silently stale.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('node:child_process');

const { LAST_MODIFIED, PAGES, HOME_PAGE, pageLastModified } = require('./generate-static-seo.js');

test('the sitemap date is a real date', () => {
  assert.match(LAST_MODIFIED, /^\d{4}-\d{2}-\d{2}$/, `lastmod is not an ISO date: ${LAST_MODIFIED}`);
  assert.ok(!Number.isNaN(Date.parse(LAST_MODIFIED)), `lastmod does not parse: ${LAST_MODIFIED}`);
});

test('the sitemap date is the commit date, not one somebody typed', () => {
  let committed;
  try {
    committed = execFileSync('git', ['log', '-1', '--format=%cs'], {
      cwd: path.resolve(__dirname),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return; // no git: the fallback exists precisely for this case
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(committed)) return;

  assert.equal(
    LAST_MODIFIED,
    committed,
    'the sitemap date has drifted from the commit date, which means it is being typed again'
  );
});

test('the date is computed, not assigned from the pinned constant', () => {
  // The comparison above passes whether or not the date is computed, on any day
  // the pinned date happens to equal the commit date. A test that passes for
  // that reason protects nothing until the calendar disagrees with it, which is
  // exactly when it is too late. Check the wiring instead.
  const source = fs.readFileSync(path.resolve(__dirname, 'generate-static-seo.js'), 'utf8');
  assert.match(
    source,
    /const LAST_MODIFIED = commitDate\(\);/,
    'LAST_MODIFIED is no longer derived from the commit date'
  );
});

test('a page that carries its own date never announces older than it', () => {
  // Every URL used to share one lastmod, which tells a crawler that all 69
  // pages changed at once — no information at all. Guides carry lastVerified
  // and blog posts carry their own date, both set by whoever checked the facts,
  // and those are better evidence than the build clock.
  //
  // This asserted equality until 31 August 2026, which had the effect of
  // freezing a guide's lastmod at the date its facts were checked however much
  // the page changed afterwards. Eight guides gained a whole
  // question-and-answer section that day and went on announcing 21 August.
  // lastmod does not mean "facts checked on"; it means this URL changed. So
  // the rule is now the later of the two, and the direction is what matters:
  // an authored date must never make a page look staler than its content is.
  const dated = [HOME_PAGE, ...PAGES].filter((page) =>
    /^\d{4}-\d{2}-\d{2}$/.test(page.datePublished || '')
  );
  assert.ok(dated.length > 0, 'no page carries its own date; this test examined nothing');

  for (const page of dated) {
    assert.ok(
      pageLastModified(page) >= page.datePublished,
      `${page.route} announces ${pageLastModified(page)}, older than its own ${page.datePublished}`
    );
  }

  // And a page whose content is newer than its authored date must say so, or
  // the freshest work on the site is the work a crawler is told to ignore.
  const moved = dated.filter((page) => pageLastModified(page) > page.datePublished);
  assert.ok(
    moved.length > 0,
    'no page reports content newer than its authored date; if that is really true, ' +
      'this test is no longer examining the case it was written for'
  );

  const distinct = new Set([HOME_PAGE, ...PAGES].map(pageLastModified));
  assert.ok(
    distinct.size > 1,
    'every URL still shares one sitemap date, so the field carries no signal'
  );
});

test('a page with no date of its own falls back to the commit date', () => {
  assert.equal(pageLastModified({ route: '/nothing' }), LAST_MODIFIED);
  assert.equal(pageLastModified({ route: '/bad', datePublished: 'March 2026' }), LAST_MODIFIED);
});
