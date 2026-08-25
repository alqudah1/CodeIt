'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SOURCE = fs.readFileSync(path.join(__dirname, 'routes', 'builder.js'), 'utf8');

// ── The promise the product makes, kept at generation time ───────────────────
//
// CodeIt's central claim is that a child changes their project by dragging and
// adjusting rather than by typing code. That is true of the seven starter games
// because each one is hand-written with a settings block at the top of its
// script, which the studio reads to build real sliders and colour swatches.
//
// It was NOT true of anything the AI generated. The generation prompt never
// asked for that block, so a child who typed their own idea got a project with
// no controls at all: the Controls tool is hidden when there are no settings to
// show, and a canvas game is a single DOM element, so the click-and-drag editor
// has nothing to offer either. The only way left to change it was to ask in
// words and wait for a model.
//
// So the block is now rule zero in the prompt, and these tests hold it there.
// They read the prompt as text rather than calling the model: a test that costs
// money and needs a network is a test that gets skipped.

test('the prompt demands a settings block, in the exact words the studio looks for', () => {
  // gameSettings.js finds the block with /change these/i. If someone reworded
  // the instruction, generated projects would quietly lose their controls and
  // nothing else would fail.
  assert.match(SOURCE, /Change these and watch what happens/);
  assert.match(SOURCE, /YOUR <script> MUST OPEN WITH A SETTINGS BLOCK/);
});

test('the example it shows is one the studio can actually read', () => {
  // The model copies the shape it is shown. If the example drifts into
  // something the parser rejects, every project drifts with it.
  const example = SOURCE.match(/\/\/ ── Change these and watch what happens ──\n([\s\S]{0,400}?)\n\n/);
  assert.ok(example, 'the prompt no longer contains an example block');

  const lines = example[1].split('\n').map(l => l.trim()).filter(Boolean);
  assert.ok(lines.length >= 3, `only ${lines.length} example settings`);

  // The same shape gameSettings.js accepts: one plain literal per line.
  const DECLARATION = /^(?:let|const|var)\s+[A-Za-z_$][\w$]*\s*=\s*(-?\d*\.?\d+|'[^'\n]*'|"[^"\n]*"|true|false)\s*;$/;
  lines.forEach(line => {
    assert.match(line, DECLARATION, `example line is not a plain literal: ${line}`);
  });
});

test('the example includes a colour and a number a child can feel', () => {
  const example = SOURCE.match(/\/\/ ── Change these and watch what happens ──\n([\s\S]{0,400}?)\n\n/)[1];
  assert.match(example, /#[0-9a-f]{6}/i, 'no colour to pick');
  assert.match(example, /Speed|Size|Lives|Shots/i, 'nothing a child would recognise as a knob');
});

test('the prompt refuses the shapes that would break the parser', () => {
  // Each of these produced a block the studio silently ignored.
  assert.match(SOURCE, /No expressions, no\s*\n?\s*function calls, no document\.getElementById/);
  assert.match(SOURCE, /Every one MUST actually be used further down/);
});

test('it says why, not just what', () => {
  // A rule with no reason is the first one dropped when the prompt is next
  // edited for length.
  assert.match(SOURCE, /so a child changes the game by dragging rather than by typing/);
});
