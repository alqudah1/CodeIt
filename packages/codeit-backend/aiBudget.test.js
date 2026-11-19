'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// ── The most the whole site may spend on the model in a day ──────────────────
//
// Every limit before this one was about one person. A thousand new visitors
// are a thousand people who have each used nothing. These run the budget with
// a clock and a database that the test holds, so each rule is shown, and the
// route's use of it is run for real in builderCeiling.test.js.

const { createBudget, ceilingUsd, costOf, startOfDay, DEFAULT_CEILING_USD } = require('./aiBudget');

const NOON = Date.UTC(2026, 10, 19, 12, 0, 0);
// One million Sonnet 5 output tokens is $10 at the list price.
const tenDollars = [{ model: 'claude-sonnet-5', input_tokens: 0, output_tokens: 1_000_000, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }];

function budgetWith({ rows = tenDollars, env = {}, at = NOON } = {}) {
  const world = { now: at, rows, reads: 0, since: null, fail: false, logs: [] };
  const budget = createBudget({
    now: () => world.now,
    env,
    log: (line) => world.logs.push(line),
    query: async (sql, params) => {
      world.reads += 1;
      world.since = params[0];
      if (world.fail) throw new Error('database away');
      return [world.rows];
    },
  });
  return { budget, world };
}

test('the setting: unset is the default, 0 is off, nonsense is the default', () => {
  assert.equal(ceilingUsd({}), DEFAULT_CEILING_USD);
  assert.equal(ceilingUsd({ AI_DAILY_CEILING_USD: '' }), DEFAULT_CEILING_USD);
  assert.equal(ceilingUsd({ AI_DAILY_CEILING_USD: '25' }), 25);
  assert.equal(ceilingUsd({ AI_DAILY_CEILING_USD: '0' }), 0);
  assert.equal(ceilingUsd({ AI_DAILY_CEILING_USD: 'lots' }), DEFAULT_CEILING_USD);
  assert.equal(ceilingUsd({ AI_DAILY_CEILING_USD: '-5' }), DEFAULT_CEILING_USD);
});

test('under the ceiling the model may be used, and the spend is read from midnight UTC', async () => {
  const { budget, world } = budgetWith({ env: { AI_DAILY_CEILING_USD: '25' } });
  const state = await budget.state();
  assert.equal(state.reached, false);
  assert.equal(state.spent, 10);
  assert.equal(state.ceiling, 25);
  assert.equal(world.since.toISOString(), '2026-11-19T00:00:00.000Z');
  assert.equal(state.resetsInSeconds, 12 * 3600);
});

test('at the ceiling it is reached, and it is said in the log once, not on every request', async () => {
  const { budget, world } = budgetWith({ env: { AI_DAILY_CEILING_USD: '10' } });
  assert.equal((await budget.state()).reached, true);
  assert.equal((await budget.state()).reached, true);
  assert.equal(world.logs.filter((line) => /ceiling reached/.test(line)).length, 1);
  assert.match(world.logs[0], /\$10\.00 spent today/);
});

test('the database is asked once a minute, not once a request', async () => {
  const { budget, world } = budgetWith({ env: { AI_DAILY_CEILING_USD: '25' } });
  await Promise.all([budget.state(), budget.state(), budget.state()]);
  await budget.state();
  assert.equal(world.reads, 1);
  world.now += 61 * 1000;
  await budget.state();
  assert.equal(world.reads, 2);
});

test('a call made since the last read counts at once, so a burst inside a minute is seen', async () => {
  const { budget, world } = budgetWith({ env: { AI_DAILY_CEILING_USD: '12' } });
  assert.equal((await budget.state()).reached, false);
  budget.note('claude-sonnet-5', { output_tokens: 250_000 });   // $2.50
  const state = await budget.state();
  assert.equal(world.reads, 1, 'no new read was needed');
  assert.equal(state.spent, 12.5);
  assert.equal(state.reached, true);
});

test('a new day starts from nothing', async () => {
  const { budget, world } = budgetWith({ env: { AI_DAILY_CEILING_USD: '10' } });
  assert.equal((await budget.state()).reached, true);
  world.now = Date.UTC(2026, 10, 20, 0, 0, 5);
  world.rows = [];
  const state = await budget.state();
  assert.equal(state.reached, false);
  assert.equal(state.spent, 0);
  assert.equal(world.since.toISOString(), '2026-11-20T00:00:00.000Z');
});

test('0 turns it off, and then the database is not asked at all', async () => {
  const { budget, world } = budgetWith({ env: { AI_DAILY_CEILING_USD: '0' } });
  const state = await budget.state();
  assert.deepEqual([state.on, state.reached], [false, false]);
  assert.equal(world.reads, 0);
});

test('if the spend cannot be read, nobody is stopped, and it is not asked again on every request', async () => {
  const { budget, world } = budgetWith({ env: { AI_DAILY_CEILING_USD: '1' } });
  world.fail = true;
  const state = await budget.state();
  assert.equal(state.reached, false);
  assert.equal(state.spent, null);
  await budget.state();
  assert.equal(world.reads, 1);
  // When it answers again, the figure is believed.
  world.fail = false;
  world.now += 61 * 1000;
  assert.equal((await budget.state()).reached, true);
});

test('a database that is slow to answer does not keep a child waiting', async () => {
  const logs = [];
  const budget = createBudget({
    now: () => NOON, env: { AI_DAILY_CEILING_USD: '1' }, readWaitMs: 40, log: (line) => logs.push(line),
    query: () => new Promise((resolve) => setTimeout(() => resolve([tenDollars]), 400)),
  });
  const started = Date.now();
  const state = await budget.state();
  assert.ok(Date.now() - started < 300, 'answered without waiting for the database');
  assert.equal(state.reached, false);
  assert.match(logs[0], /no answer in 40 ms/);
});

test('a model with no price here is counted at the dearest one, never as free', () => {
  const usage = { input_tokens: 1_000_000, output_tokens: 1_000_000 };
  assert.equal(costOf('claude-sonnet-5', usage), 12);
  assert.equal(costOf('claude-something-new-9', usage), costOf('claude-opus-5', usage));
  assert.equal(costOf('claude-opus-5', usage), 30);
});

test('the day is the UTC day', () => {
  assert.equal(startOfDay(Date.UTC(2026, 10, 19, 23, 59, 59)).toISOString(), '2026-11-19T00:00:00.000Z');
});

test('the instant game is recorded like every other call (it was dropped: its name was not on the list)', () => {
  const src = fs.readFileSync(path.join(__dirname, 'aiUsage.js'), 'utf8');
  const list = src.slice(src.indexOf('const OPERATIONS'), src.indexOf(']);'));
  assert.match(list, /'recipe'/);
  const route = fs.readFileSync(path.join(__dirname, 'routes', 'builder.js'), 'utf8');
  // Every operation name the routes use is one the recorder accepts.
  const used = new Set([...route.matchAll(/(?:createTrackedMessage|streamTrackedMessage|attemptOnce)\(\s*(?:attempt === 0 \? )?'([a-z_]+)'/g)].map((m) => m[1]));
  for (const name of used) assert.ok(list.includes(`'${name}'`), `${name} is called but would not be recorded`);
  assert.ok(used.has('recipe') && used.has('build_initial'));
});

test('every route that calls the model asks the ceiling first', () => {
  const route = fs.readFileSync(path.join(__dirname, 'routes', 'builder.js'), 'utf8');
  for (const name of ['edit', 'explain', 'patch', 'missions']) {
    assert.match(route, new RegExp(`router\\.post\\('/${name}', optionalAuth, helperLimiter, siteCeiling,`), name);
  }
  assert.match(route, /fallbackReason = 'site-ceiling'/);
  assert.match(route, /if \(ai === 'up' && await siteRestFor\(req\)\) ai = 'down'/);
});
