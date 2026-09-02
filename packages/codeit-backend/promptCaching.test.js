'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// ── Caching that cannot silently do nothing ──────────────────────────────────
//
// Haiku 4.5 will not cache a prompt under 4,096 tokens. Below that the
// cache_control block is IGNORED and no error is returned, so a marked short
// prompt looks configured and saves nothing. That is worse than not marking
// it, because the next person reads the mark and believes it.
//
// The first version of this change marked three prompts. Only one is long
// enough: the build prompt at roughly 6,000 tokens. EDIT_SYSTEM_PROMPT is
// about 540 and POLISH_SYSTEM_PROMPT about 900. Caught by reading the
// published minimum rather than assuming caching applies everywhere.
const SRC = fs.readFileSync(path.join(__dirname, 'routes/builder.js'), 'utf8');

test('the floor is the published Haiku minimum, not a guess', () => {
  assert.match(SRC, /const MIN_CACHEABLE_TOKENS = 4096;/);
});

test('cached() falls back to a plain string below the floor', () => {
  const fn = SRC.slice(SRC.indexOf('function cached('), SRC.indexOf('function cached(') + 600);
  assert.match(fn, /if \(approxTokens < MIN_CACHEABLE_TOKENS\) return text;/);
});

test('only the build prompt is marked for caching', () => {
  const marked = [...SRC.matchAll(/system:\s*cached\(([A-Za-z_]+)\)/g)].map(m => m[1]);
  assert.deepEqual([...new Set(marked)], ['systemPrompt']);
});

test('the two short prompts are plain strings, not marked', () => {
  assert.ok(!/cached\(EDIT_SYSTEM_PROMPT\)/.test(SRC));
  assert.ok(!/cached\(POLISH_SYSTEM_PROMPT\)/.test(SRC));
});

test('the short prompts really are below the floor, so this is not arbitrary', () => {
  for (const name of ['EDIT_SYSTEM_PROMPT', 'POLISH_SYSTEM_PROMPT']) {
    const i = SRC.indexOf(`const ${name}`);
    assert.ok(i > 0, `${name} not found`);
    const a = SRC.indexOf('`', i);
    const b = SRC.indexOf('`;', a + 1);
    const approxTokens = (b - a) / 3.7;
    assert.ok(approxTokens < 4096, `${name} is ~${Math.round(approxTokens)} tokens and could be cached`);
  }
});
