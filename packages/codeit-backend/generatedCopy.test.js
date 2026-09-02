'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// ── The studio must not write the thing we just spent a day removing ─────────
//
// The site's copy was swept clean of em-dashes on 2 September 2026. The studio
// kept producing them: every project a child builds is written by the prompts
// in routes/builder.js, and a published project lives at
// codeitlearn.com/project/<id>. The dash was coming back onto the owner's own
// domain, in his own product's output, the day after it was removed from the
// pages around it.
//
// Two things are checked here, and deliberately not a third.
//
//   1. Every prompt that can write words a person reads carries the rule.
//   2. The offline fallback templates, which are shipped as-is when the AI is
//      unavailable, contain no em-dash in anything they display.
//
// Not checked: the prose of the prompts themselves, which is full of dashes.
// Rewriting sixty lines of generation instructions to chase an unproven
// stylistic effect is how output formatting breaks for no measurable reason.
const SOURCE = fs.readFileSync(path.join(__dirname, 'routes', 'builder.js'), 'utf8');

test('the no-dashes rule is defined once', () => {
  const definitions = SOURCE.match(/const NO_DASHES_RULE =/g) || [];
  assert.strictEqual(definitions.length, 1, 'one definition, or the copies will drift');
  assert.match(SOURCE, /NEVER use an em-dash or an en-dash/);
});

test('every prompt that writes visible words carries it', () => {
  // The build prompt, the edit prompt and the single-element editor. Three
  // uses plus the definition.
  const uses = SOURCE.match(/\$\{NO_DASHES_RULE\}/g) || [];
  assert.strictEqual(uses.length, 3, `expected three prompts to use the rule, found ${uses.length}`);
});

test('nothing a fallback project displays contains an em-dash', () => {
  // Text between > and < on one line is what a browser renders. Prompt prose
  // and code comments are neither, so this finds displayed copy without
  // touching the instructions.
  const offenders = [];
  SOURCE.split('\n').forEach((line, index) => {
    for (const match of line.matchAll(/>([^<>]*—[^<>]*)</g)) {
      // The templates are backtick literals; the model's instruction strings
      // are single-quoted. An odd number of apostrophes before the match means
      // this is inside one of those, and a message to the model is not copy.
      const before = line.slice(0, match.index);
      if ((before.split("'").length - 1) % 2 === 1) continue;
      // Displayed copy is a sentence. Anything carrying code punctuation is a
      // regex or an expression that happens to sit between a > and a <.
      if (/[(){};=]|\.test\b/.test(match[1])) continue;
      offenders.push(`builder.js:${index + 1} ${match[1].trim().slice(0, 70)}`);
    }
  });
  assert.deepStrictEqual(offenders, []);
});

test('no fallback template invents a commercial promise', () => {
  // A child publishing the landing-page starter used to put "30-day money-back
  // guarantee" and "completely free forever" on a codeitlearn.com address.
  // Neither is ours to promise, and the second is a claim CodeIt itself is
  // never allowed to make about its own plan.
  for (const claim of ['money-back guarantee', 'free forever', 'no questions asked']) {
    assert.ok(
      !SOURCE.toLowerCase().includes(claim),
      `a starter template still promises "${claim}"`
    );
  }
});
