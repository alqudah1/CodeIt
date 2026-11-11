'use strict';

// ── Every build that starts has to end somewhere on the report ─────────────
//
// 'finish' plus a 2xx was the only way a build got a generation_complete row.
// Over the 90 days to 11 November 2026 that left 840 builder_start events
// against 639 generation_complete: about one build in four started, spent a
// model call, and appeared in no outcome at all. Not 'ai', not any fallback.
//
// Dropping those did not make the rate neutral. It made it flattering, because
// a build nobody waited for is exactly the build most likely to have been slow
// or broken, and the rate was computed over the survivors.
//
// These are source assertions on purpose. The listeners fire on a real socket
// closing, which no unit test produces honestly, so what is checked is that
// both listeners exist, that they cannot double count, and that the two new
// outcomes survive ingest.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { normalizeMeta } = require('./analyticsEvents.js');

const ROUTE = fs.readFileSync(path.join(__dirname, 'routes/builder.js'), 'utf8');

test('a build that closes without a 2xx still records an outcome', () => {
  assert.match(ROUTE, /res\.once\('close'/, "nothing listens for the connection closing");
  assert.match(
    ROUTE, /recordOutcome\(res\.writableEnded \? 'unreported' : 'abandoned'\)/,
    'the close path no longer distinguishes a response that went out from one that never did'
  );
});

test('a normal response is counted once, not twice', () => {
  // 'close' fires after 'finish' on every healthy response, so without the
  // guard every successful build would be recorded twice and the rate would
  // read better than it is for a second reason.
  assert.match(ROUTE, /let outcomeRecorded = false;/);
  assert.match(ROUTE, /if \(outcomeRecorded\) return;\s*\n\s*outcomeRecorded = true;/);
  assert.match(ROUTE, /res\.once\('close'[\s\S]{0,160}if \(outcomeRecorded\) return;/);
});

test('the 2xx path still records what it always recorded', () => {
  // The change must not quietly alter the meaning of the existing rows.
  assert.match(ROUTE, /recordOutcome\(generationMode === 'ai' \? 'ai' : `fallback-\$\{fallbackReason\}`\)/);
  assert.match(ROUTE, /res\.statusCode >= 200 && res\.statusCode < 300/);
});

test('an allowance refusal is not counted as a failed build', () => {
  // The 402 has its own event, ai_limit_reached, recorded by the allowance
  // check. Counting it here as well would say a build failed when the product
  // did exactly what it is designed to do.
  assert.match(ROUTE, /ai_limit_reached/);
  const closeBlock = ROUTE.slice(ROUTE.indexOf("res.once('close'"));
  assert.doesNotMatch(closeBlock.slice(0, 400), /402/);
});

test('both new outcomes survive ingest', () => {
  for (const meta of ['abandoned', 'unreported']) {
    assert.equal(
      normalizeMeta('generation_complete', meta), meta,
      `the route can record ${meta} and ingest drops it`
    );
  }
  assert.equal(normalizeMeta('generation_complete', 'vanished'), null);
});
