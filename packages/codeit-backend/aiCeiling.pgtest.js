'use strict';

// ── Today's spend, read from a real Postgres ────────────────────────────────
// The ceiling is only as good as the figure it compares with. This writes
// calls on both sides of midnight UTC into the table the migrations build and
// reads the day back through the same query the routes use.

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
const DB_URL = process.env.DATABASE_URL || '';
const HAS_PG = /@(localhost|127\.0\.0\.1)[:/]/.test(DB_URL);

test('the day is counted from midnight UTC, in dollars, and an instant game leaves a row', { skip: !HAS_PG && 'no local Postgres' }, async () => {
  const pool = require('./db');
  const { createBudget, startOfDay } = require('./aiBudget');
  const { recordAIUsage } = require('./aiUsage');
  const read = () => createBudget({ query: (sql, params) => pool.query(sql, params), env: { AI_DAILY_CEILING_USD: '1000000' }, log: () => {} }).state();

  const midnight = startOfDay(Date.now());
  const justBefore = new Date(midnight.getTime() - 1000);
  const before = (await read()).spent;
  assert.equal(typeof before, 'number', 'the spend can be read');

  const add = (model, output, at) => pool.query(
    'INSERT INTO ai_usage_events (operation, model, input_tokens, output_tokens, created_at) VALUES (?, ?, 0, ?, ?)',
    ['build_initial', model, output, at]
  );
  await add('claude-sonnet-5', 500000, midnight);        // $5, the first instant of today
  await add('claude-opus-5', 1000000, justBefore);       // $25, yesterday by one second
  await add('claude-model-nobody-priced', 100000, new Date()); // counted as Opus: $2.50

  const after = (await read()).spent;
  assert.ok(Math.abs((after - before) - 7.5) < 1e-9, `today grew by $7.50, not ${after - before}`);

  // The instant game was never written before 19 November 2026.
  const [[countBefore]] = await pool.query("SELECT COUNT(*) AS n FROM ai_usage_events WHERE operation = 'recipe'");
  const wrote = await recordAIUsage('recipe', { model: 'claude-haiku-4-5-20251001', usage: { input_tokens: 400, output_tokens: 200 } });
  assert.equal(wrote, true);
  const [[countAfter]] = await pool.query("SELECT COUNT(*) AS n FROM ai_usage_events WHERE operation = 'recipe'");
  assert.equal(Number(countAfter.n) - Number(countBefore.n), 1);
  const withRecipe = (await read()).spent;
  assert.ok(Math.abs((withRecipe - after) - 0.0014) < 1e-9, 'a 400 in, 200 out Haiku call is $0.0014');

  await pool.end?.();
});
