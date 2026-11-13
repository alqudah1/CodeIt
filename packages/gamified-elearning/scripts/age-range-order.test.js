'use strict';

/**
 * The age a summariser reads must be the age the product is for.
 *
 * Not to be confused with src/ageRange.test.js, which guards the marketing
 * range itself: that it is written once in config/company.js and that the old
 * "5 to 18" has not come back. This one guards what that test does not look
 * at, which is the managed-profile range appearing on a page without the
 * marketing range, or in front of it.
 *
 * On 24 October 2026 Google's AI Overview described CodeIt as offering
 * "31 free interactive lessons ... for ages 5-12". The product is built for
 * ages 8 to 14. 5 to 12 is the range that needs a parent-managed profile, a
 * sub-case, and it was the only age range the FAQ entry on
 * /learn-python-for-kids gave — an FAQPage answer to the literal question
 * "What ages can use CodeIt?", which is the first sentence any summariser
 * reaches for.
 *
 * Nothing on the page was false. It just never said the real range in the
 * place that gets quoted, and the quotable wrong one won. Being described as
 * a product for five-year-olds undoes the positioning work entirely.
 *
 * So: on every page that states a 5-to-12 range, the 8-to-14 range has to be
 * stated too, and stated first.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { PAGES, renderRouteDocument } = require('./generate-static-seo');
const { loadCompany } = require('./content-loader');

// The marketing range comes from config/company.js, the one place it is
// written. Hardcoding 8 and 14 here would mean this test keeps passing on the
// day somebody changes the constant and leaves every page saying the old
// numbers, which is the whole failure it is here to prevent.
const { AGE_RANGE } = loadCompany();

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

const MANAGED = /5\s*(?:to|\u2013|-)\s*12/;
const REAL = new RegExp(`${AGE_RANGE.from}\\s*(?:to|\\u2013|-)\\s*${AGE_RANGE.to}`);

/**
 * The two pages where 5 to 12 is the whole point.
 *
 * /privacy and /terms describe who may hold which kind of account. There the
 * managed-profile range is the subject, not an incidental mention, and adding
 * a marketing age range would make a legal page less precise rather than more.
 * Nobody summarising "what is CodeIt" quotes the terms of service.
 */
const LEGAL = new Set(['/privacy', '/terms']);

/** Tags stripped, so position means position in what a reader sees. */
function text(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

test('no crawlable page states the managed-profile range at all', () => {
  // This used to check that every page stating "5 to 12" stated "8 to 14"
  // first, and it required at least six such pages. That was a mitigation:
  // the managed range was in the crawlable text of fifteen pages, and the
  // best that could be done was to make sure the real audience came first.
  //
  // It is now in none of them. The sentences say "a managed profile" or
  // "under 13", which are true and are not an audience, so there is nothing
  // for a summariser to quote as one. Rendered documents are checked, so
  // this covers the generator, the guides, the blog and the FAQ at once,
  // legal pages included.
  const offenders = [];
  for (const page of PAGES) {
    const body = text(renderRouteDocument(TEMPLATE, page));
    const at = body.search(MANAGED);
    if (at >= 0) offenders.push(`${page.route}: ...${body.slice(Math.max(0, at - 60), at + 40)}...`);
  }
  assert.deepEqual(offenders, [], 'a crawlable page states the managed-profile range again');
  assert.ok(PAGES.length > 50, `only ${PAGES.length} pages were rendered`);
});

test('the Python landing page answers the age question with the real range', () => {
  // The FAQ lives in the React component and is emitted as FAQPage schema,
  // which is the single most quotable thing on the page.
  const source = fs.readFileSync(
    path.resolve(__dirname, '../src/pages/SEO/LearnPythonForKids.js'),
    'utf8'
  );

  // Single-quoted or a template literal: the answer interpolates
  // AGE_RANGE.statement now, so it is a backtick string.
  const entry = /q:\s*'What ages can use CodeIt\?',\s*\n\s*a:\s*(?:'((?:[^']|\\')*)'|`((?:[^`]|\\`)*)`)/.exec(source);
  assert.ok(entry, 'the "What ages can use CodeIt?" FAQ entry has gone or been renamed');

  // A literal range, or the constant interpolated. Both are the real range.
  const answer = (entry[1] || entry[2]).replace(
    /\$\{AGE_RANGE\.statement\}/g,
    AGE_RANGE.statement
  );
  assert.match(answer, REAL, `the age answer does not state ${AGE_RANGE.short}`);

  const real = answer.search(REAL);
  const managed = answer.search(MANAGED);
  if (managed >= 0) {
    assert.ok(
      real < managed,
      'the age answer states the managed-profile range before the real one'
    );
  }
});
