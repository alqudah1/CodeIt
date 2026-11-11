'use strict';

// ── Four words instead of one ───────────────────────────────────────────────
//
// Read from /admin/funnel on 11 November 2026: of 62 studio builds, 10
// produced an AI project and 52 fell back. 42 of those 52 were recorded as
// 'error', which was the outer catch-all. So four in five failures of the
// product's one unique claim arrived as a single word, with no way to tell an
// overloaded model from a rate limit on the account from a bug in
// routes/builder.js. Each of those is a different fix and the dashboard could
// not distinguish them.
//
// The message was always in the Vercel log. Nobody reads a log to find a
// rate, which is the whole reason the funnel page exists.
//
// The classes stay coarse and closed on purpose: analyticsEvents.js allowlists
// every meta value, because an unbounded one is how eleven events were
// silently rejected into a 400 for weeks. No message text, no status code, no
// prompt.

const test = require('node:test');
const assert = require('node:assert');

const { buildFailureClass } = require('./buildFailure');
const { normalizeMeta } = require('./analyticsEvents.js');

test('an overloaded model is not reported as our error', () => {
  // 529 is what the API sends when it is busy. It is the one failure that is
  // nobody's bug, and the one most likely to be most of the 42.
  assert.equal(buildFailureClass({ status: 529 }), 'overloaded');
  assert.equal(buildFailureClass({ error: { type: 'overloaded_error' } }), 'overloaded');
  assert.equal(buildFailureClass({ response: { status: 529 } }), 'overloaded');
});

test('a rate limit is its own class, because the fix is a billing decision', () => {
  assert.equal(buildFailureClass({ status: 429 }), 'rate-limit');
  assert.equal(buildFailureClass({ type: 'rate_limit_error' }), 'rate-limit');
});

test('any other refusal from the API is api, not error', () => {
  for (const status of [400, 401, 403, 500, 503]) {
    assert.equal(buildFailureClass({ status }), 'api', `status ${status}`);
  }
  assert.equal(buildFailureClass({ statusCode: 502 }), 'api');
});

test('error now means what it says: nothing came back from the API, so it is this code', () => {
  assert.equal(buildFailureClass(new TypeError('x is not a function')), 'error');
  assert.equal(buildFailureClass({}), 'error');
  assert.equal(buildFailureClass(null), 'error');
  assert.equal(buildFailureClass(undefined), 'error');
});

test('a status that is not a number does not become one', () => {
  // err.status can be a string from some clients, and Number('') is 0, which
  // is falsy, which is the behaviour wanted: fall through to 'error'.
  assert.equal(buildFailureClass({ status: '' }), 'error');
  assert.equal(buildFailureClass({ status: 'oops' }), 'error');
  assert.equal(buildFailureClass({ status: '429' }), 'rate-limit');
});

test('every class the classifier can return survives ingest', () => {
  // The failure this guards against has happened here: a meta value the ingest
  // route rejected meant the event was never written, and the silence looked
  // like a null result rather than a dropped row. A class that cannot be
  // recorded is worse than no class, because the rate it was meant to explain
  // quietly loses exactly the rows that would have explained it.
  //
  // Asked through normalizeMeta rather than by reading the allowlist, because
  // that is the function the ingest route actually calls.
  const classes = ['overloaded', 'rate-limit', 'api', 'error'];
  for (const name of classes) {
    const meta = `fallback-${name}`;
    assert.equal(
      normalizeMeta('generation_complete', meta), meta,
      `buildFailureClass can return "${name}" and ingest drops ${meta}`
    );
  }

  // And the guard is capable of failing: something not on the list is dropped.
  assert.equal(normalizeMeta('generation_complete', 'fallback-made-up'), null);
});
