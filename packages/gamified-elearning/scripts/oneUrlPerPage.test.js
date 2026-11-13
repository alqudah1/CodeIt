'use strict';

// ── One address per page ────────────────────────────────────────────────────
//
// Search Console showed the same pages indexed twice: /blog/best-coding-
// games-for-kids at position 21 with 490 impressions, and
// /blog/best-coding-games-for-kids/ at position 65 with 121 more. Likewise
// /learn-python-for-kids/, /lesson/11/ and /lesson/13/. Both addresses
// answered 200 with the same article, so Google split one page's standing
// between two URLs, and the weaker one dragged.
//
// The canonical tag already pointed at the version without the slash, and
// that was not enough on its own. trailingSlash: false makes Vercel answer
// the slash version with a 308 to the canonical one, so there is one address
// to rank. These tests keep the site from linking to the version it now
// redirects, which would cost every visitor a hop.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..', '..');

test('Vercel redirects the trailing-slash form of every page', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.strictEqual(config.trailingSlash, false,
    'without trailingSlash: false, /page/ and /page both answer 200 and split ranking');
});

test('the generator never writes a link or canonical with a trailing slash', () => {
  const source = fs.readFileSync(path.join(__dirname, 'generate-static-seo.js'), 'utf8');
  const slashed = [...source.matchAll(/href=\\?["'`](\/[a-z0-9][a-z0-9/-]*\/)["'`\\]/gi)].map(m => m[1]);
  assert.deepEqual(slashed, [], 'an internal link ends in a slash and will cost a redirect');
});

test('the content the generator renders never links with a trailing slash', () => {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const found = [];
  for (const file of fs.readdirSync(dataDir).filter(f => /\.js$/.test(f) && !/\.test\.js$/.test(f))) {
    const text = fs.readFileSync(path.join(dataDir, file), 'utf8');
    for (const m of text.matchAll(/\]\((\/[a-z0-9][a-z0-9/-]*\/)\)/gi)) found.push(`${file}: ${m[1]}`);
  }
  assert.deepEqual(found, [], 'a markdown link points at the slash form of a page');
});
