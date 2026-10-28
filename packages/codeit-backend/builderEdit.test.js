'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

// ── Changing a big game takes seconds and cannot half-apply ─────────────────
//
// Round 136. Live on 28 October 2026, "Make the carrots fall faster" on an
// instant game waited 65 s and came back "AI returned an incomplete
// response": the route asked for the whole 48 KB file back. These run the
// real route against a fake streaming model that answers with edits.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://x:y@localhost:1/none';
process.env.ANTHROPIC_API_KEY = 'test-key';

require.cache[require.resolve('./db')] = {
  id: require.resolve('./db'), filename: require.resolve('./db'), loaded: true,
  exports: { dialect: 'postgres', query: async () => ({ rows: [] }) },
};

const calls = [];
let script = [];
class FakeAnthropic {
  constructor() {
    this.messages = {
      create: async () => { throw new Error('edits must stream'); },
      stream: (params) => {
        calls.push(params);
        const step = script.shift() || { stall: true };
        let reject = null;
        let aborted = false;
        return {
          currentMessage: { model: params.model, usage: { input_tokens: 1, output_tokens: 1 } },
          on() { return this; },
          abort() { aborted = true; if (reject) reject(new Error('Request was aborted.')); },
          finalMessage() {
            return new Promise((resolve, rej) => {
              reject = rej;
              if (step.stall) return;
              setTimeout(() => !aborted && resolve({ model: params.model, content: [{ type: 'text', text: step.text }], usage: { input_tokens: 1, output_tokens: 1 } }), 5);
            });
          },
        };
      },
    };
  }
}
const sdkPath = require.resolve('@anthropic-ai/sdk');
require.cache[sdkPath] = { id: sdkPath, filename: sdkPath, loaded: true, exports: FakeAnthropic };

const router = require('./routes/builder');
const { EDIT_BUDGET } = router;
const REAL = { ...EDIT_BUDGET };

// Shaped like an instant game: a settings block, a long line of picture data,
// and a lot of engine. About 48 KB, like the real one.
const PICTURES = `const SPRITES = {"hero":"data:image/svg+xml;utf8,${'%3Cpath%20d%3D%22M1%201%22%2F%3E'.repeat(400)}"};`;
const ENGINE = Array.from({ length: 900 }, (_, i) => `function step${i}(t) { return t * ${i} + speed; }`).join('\n');
const BIG_GAME = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"><style>body{margin:0}</style></head><body><canvas id="screen"></canvas>
<script>
// ── Change these and watch what happens ──
let speed = 2;
let startLives = 3;
${PICTURES}
${ENGINE}
document.getElementById('screen').addEventListener('click', function () { step1(speed); });
</script></body></html>`;

const edit = (find, replace) => `<EDIT>\n<FIND>\n${find}\n</FIND>\n<REPLACE>\n${replace}\n</REPLACE>\n</EDIT>`;
const FASTER = `${edit('let speed = 2;', 'let speed = 4;')}\n<SUMMARY>We made the carrots fall twice as fast.</SUMMARY>`;

let server;
let base;
test.before(async () => {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use('/api/builder', router);
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { Object.assign(EDIT_BUDGET, REAL); return server && server.close(); });
test.beforeEach(() => {
  calls.length = 0;
  Object.assign(EDIT_BUDGET, { totalMs: 1200, firstMs: 500, idleMs: 300, retryMinMs: 200, replyMs: 50 });
});

async function change(instruction, code = BIG_GAME) {
  const res = await fetch(`${base}/api/builder/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CodeIt-Journey': require('crypto').randomUUID() },
    body: JSON.stringify({ currentCode: code, currentTitle: 'Bunny Catch', promptHistory: ['a bunny that catches carrots'], newInstruction: instruction }),
  });
  return { status: res.status, data: await res.json() };
}

test('a change to a 48 KB game is one small edit, and the rest of the file is untouched', async () => {
  assert.ok(BIG_GAME.length > 45000, `the test game is ${BIG_GAME.length} chars`);
  script = [{ text: FASTER }];
  const { status, data } = await change('Make the carrots fall faster');
  assert.equal(status, 200);
  assert.equal(data.html, BIG_GAME.replace('let speed = 2;', 'let speed = 4;'), 'only the one line changed, pictures included');
  assert.equal(data.summary, 'We made the carrots fall twice as fast.');
  assert.equal(calls.length, 1);
  assert.match(calls[0].model, /haiku/);
  const sent = calls[0].messages[0].content;
  assert.ok(!sent.includes('%3Cpath'), 'the picture data was not sent to the model');
  assert.ok(calls[0].max_tokens <= 4096, 'an answer is edits, not a file');
});

test('an edit whose FIND is not in the file is retried on the stronger model, with the reason', async () => {
  script = [
    { text: `${edit('let speed = 3;', 'let speed = 4;')}<SUMMARY>We sped it up.</SUMMARY>` },
    { text: FASTER },
  ];
  const { status, data } = await change('Make the carrots fall faster');
  assert.equal(status, 200);
  assert.match(data.html, /let speed = 4;/);
  assert.equal(calls.length, 2);
  assert.match(calls[1].model, /sonnet/);
  assert.match(calls[1].messages[2].content, /Edit 1: the FIND is not in the current file/);
});

test('an edit that breaks the JavaScript is never sent back as the child\'s game', async () => {
  const broken = `${edit('let speed = 2;', 'let speed = (2;')}<SUMMARY>We sped it up.</SUMMARY>`;
  script = [{ text: broken }, { text: broken }];
  const { status, data } = await change('Make the carrots fall faster');
  assert.equal(status, 502);
  assert.match(data.error, /your project was not changed/);
  assert.match(calls[1].messages[2].content, /no longer parses/);
});

test('an edit that deletes the pictures is caught', async () => {
  script = [{ text: `${edit('const SPRITES = __KEPT_1__', '')}<SUMMARY>We removed it.</SUMMARY>` }, { text: FASTER }];
  const { status } = await change('Make the carrots fall faster');
  assert.equal(status, 200);
  assert.match(calls[1].messages[2].content, /removed the line holding __KEPT_1__/);
});

test('a model that goes quiet is stopped, and the child is told plainly', async () => {
  script = [{ stall: true }, { stall: true }];
  const started = Date.now();
  const { status, data } = await change('Make the carrots fall faster');
  assert.equal(status, 502);
  assert.match(data.error, /took too long\. Your project was not changed/);
  assert.ok(Date.now() - started < EDIT_BUDGET.totalMs + 400);
});
