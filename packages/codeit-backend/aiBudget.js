'use strict';

// ── The most the whole site may spend on the model in one day ───────────────
//
// Every other limit in this product is about one person: five builds an hour
// for a browser, twenty for an account, a monthly allowance for a free
// account. None of them is about everybody at once. A thousand new visitors
// in an afternoon are a thousand browsers that have each used nothing, so
// every one of them is allowed, and the bill is whatever a thousand builds
// cost. Nothing in the code said stop (19 November 2026: "no global AI cap
// exists" was on the list of things only the owner could watch).
//
// This is the number that says stop. It is read from what was actually spent:
// ai_usage_events already records the tokens of every call, and
// aiUsagePricing.js prices them, so the ceiling is in dollars, not in a count
// of builds that would have to guess what a build costs.
//
// What reaching it does, and does not do:
//   - Somebody who pays is never held by it. They paid for the builds.
//   - Everyone else gets what they get when the model is down: an instant
//     game from the rules on /build, a starter in the studio, and the truth
//     about when to try again. Nobody gets an error page.
//   - It resets at midnight UTC.
//
// AI_DAILY_CEILING_USD sets it. Unset, it is DEFAULT_CEILING_USD. 0 turns it
// off. If the day's spend cannot be read (the database is away), the answer is
// "not reached": a fault here must not be the thing that stops a child
// building, and with the database away there is little left to protect.

const { estimateCostUSD } = require('./aiUsagePricing');

const DEFAULT_CEILING_USD = 60;
const REFRESH_MS = 60 * 1000;
// A child's build never waits longer than this to learn the day's spend. A
// database that is slow to answer is treated like one that did not.
const READ_WAIT_MS = 1500;
// A model this file has no price for is counted at the dearest one it knows,
// so a new model name cannot make the day look free.
const DEAREST_MODEL = 'claude-opus-5';

function ceilingUsd(env = process.env) {
  const raw = env.AI_DAILY_CEILING_USD;
  if (raw == null || String(raw).trim() === '') return DEFAULT_CEILING_USD;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return DEFAULT_CEILING_USD;
  return value;
}

function costOf(model, usage) {
  const known = estimateCostUSD(model, usage);
  return known == null ? estimateCostUSD(DEAREST_MODEL, usage) : known;
}

function startOfDay(nowMs) {
  const d = new Date(nowMs);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const SPENT_SINCE_SQL = `SELECT model,
        SUM(input_tokens) AS input_tokens,
        SUM(output_tokens) AS output_tokens,
        SUM(cache_creation_input_tokens) AS cache_creation_input_tokens,
        SUM(cache_read_input_tokens) AS cache_read_input_tokens
   FROM ai_usage_events
  WHERE created_at >= ?
  GROUP BY model`;

function createBudget({ query, now = Date.now, env = process.env, refreshMs = REFRESH_MS, readWaitMs = READ_WAIT_MS, log = console.error } = {}) {
  let day = 0;          // start of the day the numbers below belong to
  let fromDatabase = null;
  let readAt = 0;
  let sinceRead = 0;    // spent by this process after the last read
  let reading = null;
  let saidSo = 0;

  function turnOver(nowMs) {
    const today = startOfDay(nowMs).getTime();
    if (today === day) return;
    day = today;
    fromDatabase = null;
    readAt = 0;
    sinceRead = 0;
  }

  async function read(nowMs) {
    const forDay = day;
    try {
      let timer;
      const [rows] = await Promise.race([
        query(SPENT_SINCE_SQL, [new Date(forDay)]),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`no answer in ${readWaitMs} ms`)), readWaitMs); }),
      ]).finally(() => clearTimeout(timer));
      if (forDay !== day) return;
      fromDatabase = (rows || []).reduce((sum, row) => sum + costOf(String(row.model || ''), {
        input_tokens: Number(row.input_tokens) || 0,
        output_tokens: Number(row.output_tokens) || 0,
        cache_creation_input_tokens: Number(row.cache_creation_input_tokens) || 0,
        cache_read_input_tokens: Number(row.cache_read_input_tokens) || 0,
      }), 0);
      sinceRead = 0;
      readAt = nowMs;
    } catch (err) {
      // Keep the last figure if there is one, and ask again soon, not on
      // every request: a database that is struggling is not helped by that.
      readAt = nowMs;
      log(`AI ceiling: today's spend could not be read (${err.message})`);
    }
  }

  async function spentToday() {
    const nowMs = now();
    turnOver(nowMs);
    if (!readAt || nowMs - readAt >= refreshMs) {
      if (!reading) reading = read(nowMs).finally(() => { reading = null; });
      await reading;
    }
    return fromDatabase == null ? null : fromDatabase + sinceRead;
  }

  // Called as each call is recorded, so a burst inside one minute is counted
  // as it happens and not at the next read.
  function note(model, usage) {
    turnOver(now());
    sinceRead += costOf(String(model || ''), usage || {}) || 0;
  }

  async function state() {
    const ceiling = ceilingUsd(env);
    const nowMs = now();
    const resetsInSeconds = Math.max(1, Math.ceil((startOfDay(nowMs).getTime() + 86400000 - nowMs) / 1000));
    if (!ceiling) return { on: false, ceiling: 0, spent: null, reached: false, resetsInSeconds };
    const spent = await spentToday();
    const reached = spent != null && spent >= ceiling;
    if (reached && saidSo !== day) {
      saidSo = day;
      log(`AI ceiling reached: $${spent.toFixed(2)} spent today against a ceiling of $${ceiling}. Free builds are starters until midnight UTC. Raise AI_DAILY_CEILING_USD to change it.`);
    }
    return { on: true, ceiling, spent, reached, resetsInSeconds };
  }

  return { note, spentToday, state };
}

// The one the routes share. The database is asked for lazily so that a test
// can put its own in place before the first question.
const shared = createBudget({ query: (sql, params) => require('./db').query(sql, params) });

module.exports = {
  DEFAULT_CEILING_USD,
  SPENT_SINCE_SQL,
  ceilingUsd,
  costOf,
  createBudget,
  startOfDay,
  note: shared.note,
  state: shared.state,
};
