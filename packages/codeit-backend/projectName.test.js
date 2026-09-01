'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { projectName } = require('./projectName');

// Kept deliberately identical to the browser's projectName.test.js. If one
// side is changed and the other is not, the shared-source guard in the
// browser test fails the build.
//
// These prompts are real. Children typed them in a classroom session on
// 1 September 2026, and the old rule named the first one
// "Game that requires 2 players and".
const CASES = [
  ['build a game that requires 2 players and that shoots each other with guns with an health bar and stamina and make it playable with WASD and arrow buttons with a battleground- so i can play with my friends', 'Game that requires 2 players'],
  ['make a game called rivals where there are guns — multiplayer and make people allowed to play it', 'Rivals'],
  ['make your own story and post it. there is a button that you can press and make a story', 'Your own story'],
  ['build a snowman winter page with bouncing snowmen', 'Snowman winter page'],
  ['a colourful page that greets me by name', 'Colourful page'],
  ['Swemown got rete', 'Swemown got rete'],
  ['build a', 'My Project'],
  ['', 'My Project'],
];

test('projectName produces a readable name for every real prompt', () => {
  for (const [prompt, expected] of CASES) {
    assert.equal(projectName(prompt), expected, `prompt: ${prompt.slice(0, 40)}`);
  }
});

test('a name never ends on a joining word', () => {
  const enders = /\b(and|or|with|that|which|so|then|a|an|the|of|for|to|in|on|at|is|are|it|my|your|but|as|by|from)$/i;
  for (const [prompt] of CASES) {
    assert.ok(!enders.test(projectName(prompt)), `dangling name for: ${prompt.slice(0, 40)}`);
  }
});

test('a name is never empty and never the word Untitled', () => {
  for (const [prompt] of CASES) {
    const name = projectName(prompt);
    assert.ok(name.trim().length > 0);
    assert.notEqual(name, 'Untitled');
  }
});

test('the server never falls back to the word Untitled', () => {
  const src = fs.readFileSync(path.join(__dirname, 'projectName.js'), 'utf8');
  assert.ok(!/'Untitled'/.test(src));
});

test('the old six-word truncation is gone from the builder route', () => {
  const route = fs.readFileSync(path.join(__dirname, 'routes/builder.js'), 'utf8');
  // The exact shapes that produced "Game that requires 2 players and".
  assert.ok(!/slice\(0,\s*6\)/.test(route), 'six-word prompt slice still present');
  assert.ok(!/userPrompt\.slice\(0,\s*40\)/.test(route), '40-char prompt slice still present');
});
