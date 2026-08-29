'use strict';

/**
 * No two guides may chase the same query.
 *
 * Twice tonight the obvious next move was a new page for a question two
 * existing guides already answered — "should kids use AI to code" and "lovable
 * vs v0 vs bolt". Writing either would have split the site against itself:
 * two pages competing for one query rank worse than one page would, and the
 * mistake is invisible unless something checks.
 *
 * targetQueries is authored per guide and was otherwise unused data. This makes
 * it load-bearing.
 */

const test = require('node:test');
const assert = require('node:assert');

const { loadGuidePages } = require('./content-loader');

/** Ignore punctuation and spacing so near-identical phrasings still collide. */
function normalise(query) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

test('every guide declares the queries it is written for', () => {
  const guides = loadGuidePages();
  assert.ok(guides.length > 0, 'no guides loaded; this test examined nothing');

  for (const guide of guides) {
    assert.ok(
      Array.isArray(guide.targetQueries) && guide.targetQueries.length >= 3,
      `/guide/${guide.slug} declares fewer than three target queries, so nothing can check it is not duplicating another page`
    );
  }
});

test('no query is claimed by two guides', () => {
  const owners = new Map();
  for (const guide of loadGuidePages()) {
    for (const query of guide.targetQueries || []) {
      const key = normalise(query);
      const existing = owners.get(key);
      assert.ok(
        !existing,
        `"${query}" is targeted by both /guide/${existing} and /guide/${guide.slug}; ` +
          'two pages chasing one query rank worse than one'
      );
      owners.set(key, guide.slug);
    }
  }
  assert.ok(owners.size > 0, 'no target queries found at all');
});

test('a guide mentions the subject of its own queries', () => {
  // A weak check on purpose: it verifies the page is about what it claims,
  // without pretending to judge whether it ranks. The failure it catches is a
  // page whose queries were copied from another guide and never revisited.
  const STOP = new Set([
    'what', 'when', 'where', 'which', 'who', 'why', 'how', 'is', 'are', 'do',
    'does', 'can', 'should', 'my', 'for', 'the', 'a', 'an', 'to', 'in', 'of',
    'and', 'or', 'it', 'i', 'we', 'you', 'best', 'free', 'kids', 'kid',
    'children', 'child', 'coding', 'code', 'still', 'now', 'after', 'with',
    'without', 'from', 'that', 'this', 'their', 'they', 'them', 'get', 'use',
    'using', 'old', 'year', 'years', 'age', 'ages', 'good', 'better', 'vs',
  ]);

  for (const guide of loadGuidePages()) {
    const haystack = normalise(`${guide.title} ${guide.h1} ${guide.description} ${guide.markdown}`);
    const words = new Set(
      guide.targetQueries.flatMap((q) => normalise(q).split(' ')).filter((w) => w.length > 3 && !STOP.has(w))
    );
    const missing = [...words].filter((word) => !haystack.includes(word));

    assert.ok(
      missing.length <= words.size * 0.25,
      `/guide/${guide.slug} never mentions ${missing.length} of ${words.size} terms from its own target queries: ${missing.slice(0, 8).join(', ')}`
    );
  }
});
