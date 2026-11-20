'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const crypto = require('crypto');

// ── The instant game is about what the child said ────────────────────────────
// The real /recipe route with a model that answers every sentence with a
// bunny catching carrots. The page and the studio both draw what this route
// sends, so this is where a named thing has to survive.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://x:y@localhost:1/none';
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.AI_DAILY_CEILING_USD = '0';

const dbPath = require.resolve('./db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { dialect: 'postgres', query: async () => [[]] } };

let reply = '';
let calls = 0;
class FakeAnthropic {
  constructor() {
    this.messages = { create: async (params) => { calls += 1; return { model: params.model, content: [{ type: 'text', text: reply }], usage: { input_tokens: 1, output_tokens: 1 } }; } };
  }
}
const sdkPath = require.resolve('@anthropic-ai/sdk');
require.cache[sdkPath] = { id: sdkPath, filename: sdkPath, loaded: true, exports: FakeAnthropic };

const router = require('./routes/builder');
const BUNNY = JSON.stringify({ kind: 'catch', fits: true, title: 'Bunny Catch', player: '🐰', enemy: '🦊', treasure: '🥕', sky: 'night', speed: 2, lives: 3, winAt: 15 });

let server;
let base;
test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/builder', router);
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}/api/builder/recipe`;
});
test.after(() => server && server.close());

async function ask(prompt) {
  const res = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CodeIt-Journey': crypto.randomUUID() }, body: JSON.stringify({ prompt }) });
  return res.json();
}

test('a cat that catches fish is a cat that catches fish, whatever the model answered', async () => {
  reply = BUNNY; calls = 0;
  const data = await ask('a cat that catches falling fish');
  assert.equal(calls, 1, 'the model was asked');
  assert.equal(data.source, 'model');
  assert.equal(data.recipe.player, '🐱');
  assert.equal(data.recipe.treasure, '🐟');
  assert.doesNotMatch(data.recipe.title, /bunny/i);
  // The parts of the model's answer that do not contradict the child stay.
  assert.equal(data.recipe.sky, 'night');
  assert.equal(data.recipe.enemy, '🦊');
});

test('a bunny that catches carrots keeps the model\'s answer whole', async () => {
  reply = BUNNY; calls = 0;
  const data = await ask('a bunny that catches carrots at night');
  assert.equal(data.source, 'model');
  assert.deepEqual([data.recipe.player, data.recipe.treasure, data.recipe.title], ['🐰', '🥕', 'Bunny Catch']);
});

test('every example sentence on the build page survives a model that answers with something else', async () => {
  const { recipeFromIdea } = require('./gameWords');
  const fs = require('fs');
  const path = require('path');
  const local = fs.readFileSync(path.join(__dirname, '../gamified-elearning/src/pages/Build/recipeLocal.js'), 'utf8');
  const ideas = [...local.slice(local.indexOf('export const IDEAS'), local.indexOf('];', local.indexOf('export const IDEAS'))).matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(ideas.length >= 10, 'the list was read');
  for (const idea of ideas) {
    const rules = recipeFromIdea(idea);
    reply = JSON.stringify({ kind: rules.kind, fits: true, title: 'Unicorn Party', player: '🦄', enemy: '🧟', treasure: '🍩', sky: 'candy', speed: 2, lives: 3, winAt: 15 });
    // eslint-disable-next-line no-await-in-loop
    const data = await ask(idea);
    for (const part of ['player', 'enemy', 'treasure']) {
      if (rules.named[part]) assert.equal(data.recipe[part], rules[part], `${idea}: the ${part}`);
    }
  }
});
