'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

// ── The model retries before it gives up ─────────────────────────────────────
//
// Rounds 66 and 67: "On a failed build, retry automatically on a stronger
// model before showing any failure at all." These run the real route with a
// fake Anthropic client, so they prove the behaviour rather than grep for it.
// A child's first build failing is the moment they decide whether this thing
// works, and a source-only check has missed shipped failures twice before.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://x:y@localhost:1/none';
process.env.ANTHROPIC_API_KEY = 'test-key';

// No database in this test. Everything the route records is fire-and-forget.
require.cache[require.resolve('./db')] = {
  id: require.resolve('./db'), filename: require.resolve('./db'), loaded: true,
  exports: { dialect: 'postgres', query: async () => ({ rows: [] }) },
};

// The fake client: a queue of scripted replies, and a log of every call.
const calls = [];
let script = [];
class FakeAnthropic {
  constructor() {
    this.messages = {
      create: async (params) => {
        calls.push(params);
        const next = script.shift();
        if (!next) throw new Error('script exhausted');
        if (next.throws) throw new Error(next.throws);
        if (next.hang) return new Promise(() => {});
        return { content: [{ type: 'text', text: next.text }], usage: { input_tokens: 1, output_tokens: 1 } };
      },
    };
  }
}
const sdkPath = require.resolve('@anthropic-ai/sdk');
require.cache[sdkPath] = { id: sdkPath, filename: sdkPath, loaded: true, exports: FakeAnthropic };

const router = require('./routes/builder');
const { modelForBuild, TIERS } = require('./modelRouting');

// A project that passes every check the route runs: parses, has a viewport,
// a style block with the things designEngine looks for, a score, a restart,
// a loop, and listeners.
const GOOD_GAME = `<META>{"title":"Star Catch","type":"clicker","summary":"ok","conceptsUsed":["variables"]}</META>
<HTML><!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
body{font-family:sans-serif;margin:0}.screen{display:none}.screen.active{display:block}
button{border-radius:12px;transition:transform .2s}button:hover{transform:scale(1.05)}
@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
</style></head><body>
<div id="start-screen" class="screen active"><button id="start">Start</button></div>
<div id="game-screen" class="screen"><div id="score">0</div><button id="target">Catch</button></div>
<div id="result-screen" class="screen"><button id="restart">Restart</button></div>
<script>
var score = 0; var correct = 0; var timer = null;
function showScreen(id){ document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); }); document.getElementById(id).classList.add('active'); }
function startGame(){ score = 0; document.getElementById('score').textContent = score; showScreen('game-screen'); timer = setTimeout(function(){ showScreen('result-screen'); }, 20000); }
document.getElementById('start').addEventListener('click', startGame);
document.getElementById('target').addEventListener('click', function(){ score += 1; document.getElementById('score').textContent = score; });
document.getElementById('restart').addEventListener('click', function(){ clearTimeout(timer); startGame(); });
</script></body></html></HTML>`;

const BAD = 'Sorry, here is some text and no project at all.';

let server;
let base;
test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/builder', router);
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server && server.close());

// Each request is its own browser, so the per-journey limiter does not
// count the whole file as one child.
async function build(body) {
  const res = await fetch(`${base}/api/builder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CodeIt-Journey': require('crypto').randomUUID() },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

function tierOf(model) { return TIERS.indexOf(model); }

test('a usable first attempt is one call, on the routed model', async () => {
  calls.length = 0; script = [{ text: GOOD_GAME }];
  const { status, data } = await build({ prompt: 'a game where I click falling stars' });
  assert.equal(status, 200);
  assert.equal(data.isFallback, undefined);
  assert.equal(calls.length, 1);
});

// A quiz routes to the cheapest tier on every plan, so a free account still
// has a tier above it to escalate to. (A clicker on free is already at the
// free ceiling; see the last test.)
const QUIZ = 'a quiz about planets';

test('unusable output is retried once, silently, one tier up, as a correction', async () => {
  calls.length = 0; script = [{ text: BAD }, { text: GOOD_GAME }];
  const { data } = await build({ prompt: QUIZ });
  assert.equal(data.isFallback, undefined, 'the child got a real project, not the starter');
  assert.equal(calls.length, 2, 'exactly one retry');
  assert.ok(tierOf(calls[1].model) > tierOf(calls[0].model), `retry ${calls[1].model} should be a tier above ${calls[0].model}`);
  // A correction, not a fresh start: the first draft and what was wrong with it are in the conversation.
  assert.equal(calls[1].messages.length, 3);
  assert.equal(calls[1].messages[1].role, 'assistant');
  assert.match(calls[1].messages[2].content, /QUALITY CHECK FAILED/);
});

test('a thrown error on the first attempt is retried as a fresh build on the stronger model', async () => {
  calls.length = 0; script = [{ throws: 'overloaded_error' }, { text: GOOD_GAME }];
  const { status, data } = await build({ prompt: QUIZ });
  assert.equal(status, 200);
  assert.equal(data.isFallback, undefined);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].messages.length, 1, 'no draft to correct, so it starts over');
  assert.ok(tierOf(calls[1].model) > tierOf(calls[0].model));
});

test('only after both attempts fail does the starter go out, and it says what a retry would do', async () => {
  calls.length = 0; script = [{ text: BAD }, { text: BAD }];
  const { data } = await build({ prompt: QUIZ });
  assert.equal(data.isFallback, true);
  assert.equal(calls.length, 2);
  assert.equal(data.retry.escalates, true, 'a quiz on free has a tier above haiku, so the button can promise it');
  assert.equal(data.retry.moreTime, true);
});

test('at the plan ceiling the retry still happens, on the same model, and the button does not promise a stronger one', async () => {
  calls.length = 0; script = [{ text: BAD }, { text: BAD }];
  const { data } = await build({ prompt: 'a game where I click falling stars' });
  assert.equal(calls.length, 2, 'the retry is not skipped just because there is no tier above');
  assert.equal(calls[0].model, calls[1].model);
  assert.equal(data.isFallback, true);
  assert.equal(data.retry.escalates, false);
});

test('a retry pressed from the fallback card starts one tier up', async () => {
  calls.length = 0; script = [{ text: GOOD_GAME }];
  const prompt = QUIZ;
  await build({ prompt, escalate: true });
  const type = require('./designEngine').getDesignConfig(prompt).type;
  assert.equal(calls[0].model, modelForBuild(type, 'free', 1).model);
});

test('a retry never runs the same model on the same problem when a tier above exists', () => {
  for (const type of Object.keys(require('./modelRouting').TIER_BY_TYPE)) {
    const first = modelForBuild(type, 'plus', 0);
    const second = modelForBuild(type, 'plus', 1);
    if (first.tier < TIERS.length - 1) assert.ok(second.tier > first.tier, type);
  }
});
