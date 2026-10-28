'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

// ── A build that stalls is stopped, and one that cannot finish is not retried ─
//
// Round 135. Live on 24 October 2026, "tic tac toe" waited three minutes and
// got a starter: both attempts hit a timer that walked away from the call
// without stopping it. These run the real route against a fake streaming
// client, with the budget shrunk to milliseconds, so they prove that:
//   - a reply that is still arriving is not cut off at an arbitrary point,
//   - a reply that stops arriving is aborted (it stops costing) and retried,
//   - a retry that has no time to finish is not started at all,
//   - an idea no template fits is built from the child's words, not a clicker.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://x:y@localhost:1/none';
process.env.ANTHROPIC_API_KEY = 'test-key';

require.cache[require.resolve('./db')] = {
  id: require.resolve('./db'), filename: require.resolve('./db'), loaded: true,
  exports: { dialect: 'postgres', query: async () => ({ rows: [] }) },
};

// Each scripted reply: { text, every } streams `text` in 40-character pieces,
// one piece every `every` ms; { stallAfter } sends that much and then nothing;
// { trickle } sends a character every 20 ms for ever.
const calls = [];
const streams = [];
let script = [];

function fakeStream(params) {
  const step = script.shift() || { stallAfter: '' };
  const listeners = { text: [] };
  let aborted = false;
  let timer = null;
  let settle = null;
  const stream = {
    get aborted() { return aborted; },
    currentMessage: { model: params.model, usage: { input_tokens: 5, output_tokens: 1 }, content: [] },
    on(event, fn) { (listeners[event] = listeners[event] || []).push(fn); return stream; },
    abort() {
      aborted = true;
      clearInterval(timer);
      clearTimeout(timer);
      if (settle) settle.reject(Object.assign(new Error('Request was aborted.'), { name: 'APIUserAbortError' }));
    },
    finalMessage() {
      return new Promise((resolve, reject) => {
        settle = { resolve, reject };
        const emit = (piece) => listeners.text.forEach((fn) => fn(piece));
        if (step.trickle) {
          timer = setInterval(() => emit('x'), 20);
        } else if (step.stallAfter !== undefined) {
          if (step.stallAfter) setTimeout(() => !aborted && emit(step.stallAfter), 5);
        } else {
          const pieces = step.text.match(/[\s\S]{1,40}/g);
          let i = 0;
          const next = () => {
            if (aborted) return;
            if (i < pieces.length) { emit(pieces[i++]); timer = setTimeout(next, step.every || 0); return; }
            resolve({ model: params.model, content: [{ type: 'text', text: step.text }], usage: { input_tokens: 5, output_tokens: 9 } });
          };
          next();
        }
      });
    },
  };
  streams.push(stream);
  return stream;
}

class FakeAnthropic {
  constructor() {
    this.messages = {
      create: async () => { throw new Error('the build path must stream'); },
      stream: (params) => { calls.push(params); return fakeStream(params); },
    };
  }
}
const sdkPath = require.resolve('@anthropic-ai/sdk');
require.cache[sdkPath] = { id: sdkPath, filename: sdkPath, loaded: true, exports: FakeAnthropic };

const router = require('./routes/builder');
const { BUILD_BUDGET } = router;
const REAL_BUDGET = { ...BUILD_BUDGET };

const GOOD_GAME = `<META>{"title":"Noughts Duel","type":"custom","summary":"ok","conceptsUsed":["variables"]}</META>
<HTML><!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
body{font-family:sans-serif;margin:0}.screen{display:none}.screen.active{display:block}
button{border-radius:12px;transition:transform .2s}button:hover{transform:scale(1.05)}
@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
</style></head><body>
<div id="start-screen" class="screen active"><button id="start">Play</button></div>
<div id="game-screen" class="screen"><div id="status"></div><div id="score-display">0</div><button id="cell">X</button></div>
<div id="result-screen" class="screen"><div id="final-score"></div><button id="restart">Play again</button></div>
<script>
var score = 0; var timer = null;
function showScreen(id){ document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); }); document.getElementById(id).classList.add('active'); }
function startGame(){ score = 0; document.getElementById('score-display').textContent = score; showScreen('game-screen'); }
document.getElementById('start').addEventListener('click', startGame);
document.getElementById('cell').addEventListener('click', function(){ score += 1; document.getElementById('score-display').textContent = score; timer = setTimeout(function(){ showScreen('result-screen'); }, 300); });
document.getElementById('restart').addEventListener('click', function(){ clearTimeout(timer); startGame(); });
</script></body></html></HTML>`;

let server;
let base;
test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/builder', router);
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { Object.assign(BUILD_BUDGET, REAL_BUDGET); return server && server.close(); });
test.beforeEach(() => {
  calls.length = 0;
  streams.length = 0;
  Object.assign(BUILD_BUDGET, { totalMs: 1500, firstMs: 1000, idleMs: 200, retryMinMs: 400, replyMs: 50 });
});

// A short system prompt goes as a plain string, a long one as a cached block.
function systemText(call) {
  return Array.isArray(call.system) ? call.system.map((block) => block.text).join('\n') : String(call.system);
}

async function build(body) {
  const started = Date.now();
  const res = await fetch(`${base}/api/builder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CodeIt-Journey': require('crypto').randomUUID() },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json(), ms: Date.now() - started };
}

test('a reply that is still arriving is waited for, past the old fixed timer', async () => {
  // 40 pieces, 30 ms apart: about 1.2 s with no gap longer than the idle limit.
  // Under a budget scaled like the old 70 s one (700 ms here) this was cut off.
  Object.assign(BUILD_BUDGET, { totalMs: 3000, firstMs: 2500 });
  script = [{ text: GOOD_GAME, every: 30 }];
  const { status, data } = await build({ prompt: 'tic tac toe' });
  assert.equal(status, 200);
  assert.equal(data.isFallback, undefined, 'the child got their game, not the starter');
  assert.equal(calls.length, 1);
  assert.equal(streams[0].aborted, false);
});

test('a reply that stops arriving is aborted and retried as a fresh build', async () => {
  script = [{ stallAfter: '<META>{"title":"Tic' }, { text: GOOD_GAME }];
  const { status, data } = await build({ prompt: 'tic tac toe' });
  assert.equal(status, 200);
  assert.equal(data.isFallback, undefined);
  assert.equal(calls.length, 2, 'one retry');
  assert.equal(streams[0].aborted, true, 'the stalled call was stopped, so it stopped costing');
  assert.equal(calls[1].messages.length, 1, 'no usable draft, so the retry starts over');
});

test('when the first attempt uses the time, no retry is started that could not finish', async () => {
  Object.assign(BUILD_BUDGET, { totalMs: 1500, firstMs: 1300 });
  script = [{ trickle: true }, { text: GOOD_GAME }];
  const { data, ms } = await build({ prompt: 'tic tac toe' });
  assert.equal(data.isFallback, true, 'the starter goes out');
  assert.equal(calls.length, 1, 'no second call with 150 ms left');
  assert.equal(streams[0].aborted, true, 'the first call was stopped at its limit');
  assert.ok(ms < BUILD_BUDGET.totalMs + 400, `answered inside the budget (${ms} ms)`);
  assert.equal(data.retry.attempts, 1, 'so the card does not claim it tried twice');
});

test('"Try again with more time" gets more time: one attempt with the whole wait', async () => {
  // firstMs is 1000 here; an escalated retry may use 1450 (total less reply).
  script = [{ trickle: true }];
  const { data, ms } = await build({ prompt: 'tic tac toe', escalate: true });
  assert.equal(data.isFallback, true);
  assert.equal(calls.length, 1);
  assert.ok(ms >= 1400, `the attempt ran past the normal first limit (${ms} ms)`);
});

test('a retry gets whatever time is left, not a fixed slice', async () => {
  // Stall at once (200 ms), then a retry that needs about 900 ms: the old
  // fixed 65 s slice, scaled, would have been 650 ms and cut it off.
  Object.assign(BUILD_BUDGET, { totalMs: 2000, firstMs: 1500 });
  script = [{ stallAfter: '' }, { text: GOOD_GAME, every: 22 }];
  const { data } = await build({ prompt: 'tic tac toe' });
  assert.equal(data.isFallback, undefined);
  assert.equal(calls.length, 2);
});

test('tic tac toe is built from the child\'s words, not from the clicker template', async () => {
  script = [{ text: GOOD_GAME }];
  await build({ prompt: 'tic tac toe' });
  const system = systemText(calls[0]);
  assert.match(system, /BUILD THE CHILD'S OWN GAME/);
  assert.match(system, /tic tac toe/, 'board games are named as things to build');
  assert.doesNotMatch(system, /BUILD A CLICKER GAME/);
  assert.doesNotMatch(system, /spawnTarget/, 'no tap-the-targets logic to keep');
  assert.doesNotMatch(system, /keep all logic/);
});

test('a game with a template is told the child\'s idea comes first', async () => {
  script = [{ text: GOOD_GAME }];
  await build({ prompt: 'a game where I click falling stars' });
  const system = systemText(calls[0]);
  assert.match(system, /BUILD A CLICKER GAME/);
  assert.match(system, /The child's idea comes first/);
});
