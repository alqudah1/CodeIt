'use strict';

/**
 * The sitemap's lastmod used to be a date somebody typed.
 *
 * It said 2026-08-25 while the site was being changed on the 26th, and it would
 * have kept saying 2026-08-25 for as long as nobody remembered it existed. A
 * crawler reading that has been told, on every URL, that nothing has changed.
 *
 * It now comes from the commit date, which is fixed for a given commit — so the
 * build stays byte-identical for the same input — and moves without anyone
 * having to notice.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('node:child_process');

const { LAST_MODIFIED } = require('./generate-static-seo.js');

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
    // A build with no git falls back to the pinned date on purpose. Nothing to
    // check here, and failing would mean failing in the one place the fallback
    // exists to serve.
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(committed)) return;

  assert.equal(
    LAST_MODIFIED,
    committed,
    'the sitemap date has drifted from the commit date, which means it is being typed again'
  );
});

test('the date is computed, not assigned from the pinned constant', () => {
  // The comparison above passes today whether or not the date is computed,
  // because the pinned date and the current commit date happen to be the same
  // day. A test that passes for that reason is not protecting anything until
  // the calendar disagrees with it, which is the point at which it is too late.
  //
  // So check the wiring directly: the pinned value is a fallback inside
  // commitDate(), and must not be what LAST_MODIFIED is assigned.
  const source = fs.readFileSync(path.resolve(__dirname, 'generate-static-seo.js'), 'utf8');
  assert.match(
    source,
    /const LAST_MODIFIED = commitDate\(\);/,
    'LAST_MODIFIED is no longer derived from the commit date'
  );
});
