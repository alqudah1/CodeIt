#!/usr/bin/env node
'use strict';

// ── Does the studio actually build what a child asked for? ───────────────────
//
// The check that did not exist on the day it broke.
//
// On 2 September 2026 a signed-in call to POST /api/builder with "a game where
// a dragon breathes fire at knights" returned 200 in 446 ms, isFallback true,
// and no mention of a dragon or a knight anywhere in the output. Every test
// passed. The server was healthy. The page rendered. Children had been getting
// canned starters under headings made from their own words for an unknown
// length of time.
//
// Nothing failed, because nothing was asking this question.
//
//   node ops/checks/builder-really-builds.js [baseUrl]
//
// Exits non-zero when the studio returns a starter instead of a build, and
// says which of the two things went wrong: the key is not configured, or the
// call was made and came back empty of the child's words.
//
// It sends one prompt. It writes nothing, saves nothing, and needs no account.

const BASE = process.argv[2] || process.env.CODEIT_BASE_URL || 'http://localhost:5000';
const PROMPT = 'a game where a dragon breathes fire at knights';
const WORDS = ['dragon', 'knight'];

// A real model call takes seconds. Anything under this did not make one, which
// is the single clearest signal available from outside the server.
const IMPOSSIBLY_FAST_MS = 1500;

function visibleText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase();
}

(async () => {
  const health = await fetch(`${BASE}/api/health`).then(r => r.json()).catch(() => null);
  if (health && health.studio && health.studio.ready === false) {
    console.error(`FAIL  ${health.studio.missing.join(', ')} is not set on ${BASE}.`);
    console.error('      Every build will return a canned starter instead of the child\'s idea.');
    process.exit(1);
  }

  const started = Date.now();
  const res = await fetch(`${BASE}/api/builder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: PROMPT }),
  });
  const elapsed = Date.now() - started;

  if (!res.ok) {
    console.error(`FAIL  POST /api/builder answered ${res.status} in ${elapsed} ms.`);
    process.exit(1);
  }
  const data = await res.json();

  if (data.isFallback) {
    console.error(`FAIL  The studio returned a starter, not a build. ${elapsed} ms.`);
    console.error('      Read generation_complete in /admin/funnel: fallback-no-api-key and');
    console.error('      fallback-error mean the key. timeout, retry-timeout and');
    console.error('      invalid-output mean the call went out and something else broke.');
    process.exit(1);
  }

  const text = visibleText(data.html || data.code);
  const missing = WORDS.filter(w => !text.includes(w));
  if (missing.length === WORDS.length) {
    console.error(`FAIL  Built in ${elapsed} ms but none of the child's words came through.`);
    console.error(`      Asked for: ${PROMPT}`);
    console.error(`      Not found: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (elapsed < IMPOSSIBLY_FAST_MS) {
    console.error(`WARN  Built in ${elapsed} ms, which is faster than a model call.`);
  }
  console.log(`OK    Built in ${elapsed} ms and the words came through (${WORDS.filter(w => text.includes(w)).join(', ')}).`);
})().catch(err => { console.error('FAIL ', err.message); process.exit(1); });
