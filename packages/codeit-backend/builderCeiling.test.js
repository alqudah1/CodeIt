'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ── When the whole site has spent its day ────────────────────────────────────
//
// The real routes, a fake model that counts its calls, and a database that
// says $10 has been spent today. With the ceiling at $5 nobody who does not
// pay may reach the model, and nobody is shown an error; with it at $1000
// everything is as it was.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://x:y@localhost:1/none';
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.BILLING_ENABLED = 'true';
process.env.STRIPE_SECRET_KEY = 'sk_test_ceiling';
process.env.STRIPE_PRICE_ID = 'price_ceiling';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_ceiling';

const PAYING = 7;
const FREE = 8;
const dbPath = require.resolve('./db');
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true,
  exports: {
    dialect: 'postgres',
    query: async (sql, params = []) => {
      if (/FROM ai_usage_events/.test(sql) && /GROUP BY model/.test(sql) && /created_at >= \?/.test(sql)) {
        return [[{ model: 'claude-sonnet-5', input_tokens: 0, output_tokens: 1_000_000, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }]];
      }
      if (/FROM subscriptions/.test(sql)) {
        return [params[0] === PAYING ? [{ user_id: PAYING, status: 'active', current_period_end: new Date(Date.now() + 86400000) }] : []];
      }
      if (/FROM ai_build_usage/.test(sql)) return [[{ build_count: 0 }]];
      return [[]];
    },
  },
};

const calls = [];
let reply = '';
class FakeAnthropic {
  constructor() {
    this.messages = {
      create: async (params) => {
        calls.push(params);
        return { model: params.model, content: [{ type: 'text', text: reply }], usage: { input_tokens: 1, output_tokens: 1 } };
      },
    };
  }
}
const sdkPath = require.resolve('@anthropic-ai/sdk');
require.cache[sdkPath] = { id: sdkPath, filename: sdkPath, loaded: true, exports: FakeAnthropic };

const router = require('./routes/builder');

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

let server;
let base;
test.before(async () => {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/builder', router);
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}/api/builder`;
});
test.after(() => server && server.close());

async function post(path, body, userId) {
  const headers = { 'Content-Type': 'application/json', 'X-CodeIt-Journey': crypto.randomUUID() };
  if (userId) headers.Authorization = `Bearer ${jwt.sign({ user_id: userId, role: 'Student' }, process.env.JWT_SECRET)}`;
  const res = await fetch(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: res.status, retryAfter: res.headers.get('retry-after'), data: await res.json() };
}

const IDEA = { prompt: 'a game where I click falling stars' };
const reached = () => { process.env.AI_DAILY_CEILING_USD = '5'; calls.length = 0; reply = GOOD_GAME; };
const roomLeft = () => { process.env.AI_DAILY_CEILING_USD = '1000'; calls.length = 0; reply = GOOD_GAME; };

test('with room left, a visitor gets their idea built by the model', async () => {
  roomLeft();
  const { status, data } = await post('', IDEA);
  assert.equal(status, 200);
  assert.equal(data.isFallback, undefined);
  assert.equal(data.rest, undefined);
  assert.ok(calls.length >= 1);
});

test('at the ceiling, a visitor gets a starter and the hours to wait, and the model is not called', async () => {
  reached();
  const { status, data } = await post('', IDEA);
  assert.equal(status, 200, 'never an error page');
  assert.equal(data.isFallback, true);
  assert.match(data.html, /<html/i);
  assert.ok(Number.isInteger(data.rest.hours) && data.rest.hours >= 1 && data.rest.hours <= 24);
  assert.equal(calls.length, 0);
});

test('at the ceiling, a signed-in free account is held the same way', async () => {
  reached();
  const { data } = await post('', IDEA, FREE);
  assert.equal(data.isFallback, true);
  assert.ok(data.rest.hours >= 1);
  assert.equal(calls.length, 0);
});

test('at the ceiling, someone who pays still gets their idea built', async () => {
  reached();
  const { status, data } = await post('', IDEA, PAYING);
  assert.equal(status, 200);
  assert.equal(data.isFallback, undefined);
  assert.equal(data.rest, undefined);
  assert.ok(calls.length >= 1);
});

test('at the ceiling, the instant game comes from the rules and the page is told the model is down', async () => {
  reached();
  const { status, data } = await post('/recipe', { prompt: 'a cat that catches falling fish' });
  assert.equal(status, 200);
  assert.equal(data.game, true);
  assert.equal(data.source, 'rules');
  assert.equal(data.ai, 'down');
  assert.ok(data.recipe && typeof data.recipe === 'object');
  assert.equal(calls.length, 0);
});

test('with room left, the instant game asks the model', async () => {
  roomLeft();
  reply = '{}';
  const { data } = await post('/recipe', { prompt: 'a cat that catches falling fish' });
  assert.equal(data.game, true);
  assert.equal(data.ai, 'up');
  assert.equal(calls.length, 1);
});

test('at the ceiling, the helpers say to come back later, with the real wait, and do not call the model', async () => {
  reached();
  const code = GOOD_GAME.slice(GOOD_GAME.indexOf('<!doctype'), GOOD_GAME.indexOf('</HTML>'));
  const asks = [
    ['/edit', { currentCode: code, newInstruction: 'make the button blue' }],
    ['/explain', { code }],
    ['/patch', { elementId: 'start', tag: 'button', elementHtml: '<button id="start">Start</button>', instruction: 'make it blue' }],
    ['/missions', { html: code, type: 'game', title: 'Star Catch' }],
  ];
  for (const [path, body] of asks) {
    const { status, data, retryAfter } = await post(path, body);
    assert.equal(status, 429, path);
    assert.equal(data.code, 'AI_LIMIT_REACHED', path);
    assert.ok(Number(retryAfter) >= 1 && Number(retryAfter) <= 86400, path);
    assert.equal(data.retryAfterSeconds, Number(retryAfter), path);
  }
  assert.equal(calls.length, 0);
});

test('at the ceiling, someone who pays can still ask for a change', async () => {
  reached();
  reply = '["Add a shield", "Add a boss", "Add levels", "Add a timer", "Add sound"]';
  const code = GOOD_GAME.slice(GOOD_GAME.indexOf('<!doctype'), GOOD_GAME.indexOf('</HTML>'));
  const { status } = await post('/missions', { html: code, type: 'game', title: 'Star Catch' }, PAYING);
  assert.equal(status, 200);
  assert.equal(calls.length, 1);
});
