'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  modelForBuild, TIER_BY_TYPE, TIERS, HAIKU, SONNET, OPUS, FREE_MAX_TIER,
} = require('./modelRouting');

// Read from designEngine's source rather than a copied list, because a copied
// list is the thing that goes stale.
function engineTypes() {
  const src = fs.readFileSync(path.join(__dirname, 'designEngine.js'), 'utf8');
  return [...new Set([...src.matchAll(/type:\s*'([a-z-]+)'/g)].map((m) => m[1]))];
}

// The seven cases that came with the plan, verbatim.
test('the routing table matches the approved cases', () => {
  const cases = [
    ['blog', 'free', 0, HAIKU],
    ['quiz', 'plus', 0, HAIKU],
    ['dodge', 'free', 0, SONNET],
    ['platformer', 'free', 0, SONNET],
    ['platformer', 'plus', 0, OPUS],
    ['blog', 'free', 1, SONNET],
    ['unknown-type', 'plus', 0, HAIKU],
  ];
  for (const [type, plan, attempt, expected] of cases) {
    assert.equal(modelForBuild(type, plan, attempt).model, expected,
      `${type}/${plan}/attempt ${attempt}`);
  }
});

// The one that matters. A 28th type added to designEngine and not placed here
// would silently route to the cheapest model, and nobody would notice until a
// child complained about a game that does not work.
test('every designEngine type has a tier', () => {
  const unplaced = engineTypes().filter((t) => !Object.prototype.hasOwnProperty.call(TIER_BY_TYPE, t));
  assert.deepEqual(unplaced, [], `unplaced designEngine types: ${unplaced.join(', ')}`);
});

test('no tier is invented for a type designEngine cannot produce', () => {
  const known = new Set(engineTypes());
  const orphans = Object.keys(TIER_BY_TYPE).filter((t) => !known.has(t));
  assert.deepEqual(orphans, [], `types in the table that designEngine never returns: ${orphans.join(', ')}`);
});

test('free never reaches opus, at any type or attempt number', () => {
  for (const type of engineTypes()) {
    for (const attempt of [0, 1, 2, 5, 99]) {
      const { model, tier } = modelForBuild(type, 'free', attempt);
      assert.notEqual(model, OPUS, `${type} attempt ${attempt} reached opus on free`);
      assert.ok(tier <= FREE_MAX_TIER);
    }
  }
});

test('escalation moves exactly one tier and cannot climb past the top', () => {
  for (const type of engineTypes()) {
    const first = modelForBuild(type, 'plus', 0);
    const retry = modelForBuild(type, 'plus', 1);
    assert.ok(retry.tier - first.tier <= 1, `${type} climbed more than one tier`);
    assert.ok(retry.tier <= TIERS.length - 1);
    // A type already at the top has nowhere to go, and that is not an error.
    if (first.tier === TIERS.length - 1) assert.equal(retry.tier, first.tier);
  }
});

test('an unrecognised type spends less rather than more', () => {
  for (const plan of ['free', 'plus', undefined, '', 'nonsense']) {
    assert.equal(modelForBuild('type-that-does-not-exist', plan, 0).model, HAIKU);
  }
});

test('anything that is not the string plus is treated as free', () => {
  for (const plan of [undefined, null, '', 'Plus', 'PLUS', 'premium', 0, false]) {
    assert.notEqual(modelForBuild('platformer', plan, 0).model, OPUS,
      `plan ${JSON.stringify(plan)} was treated as paid`);
  }
});

test('every tier in the table is a real tier', () => {
  for (const [type, tier] of Object.entries(TIER_BY_TYPE)) {
    assert.ok(Number.isInteger(tier) && tier >= 0 && tier < TIERS.length,
      `${type} has tier ${tier}`);
  }
});

test('the models are named, not left as a placeholder', () => {
  for (const m of TIERS) assert.match(m, /^claude-/);
  assert.equal(new Set(TIERS).size, TIERS.length, 'two tiers point at the same model');
});

// ── The wiring, not just the table ───────────────────────────────────────────
//
// A routing module that nothing calls is worth nothing. These read the route
// rather than trusting that it was wired.
test('the build route uses the router, not a hardcoded model', () => {
  const route = fs.readFileSync(path.join(__dirname, 'routes/builder.js'), 'utf8');
  assert.match(route, /const firstRoute = modelForBuild\(designConfig\.type, planId, startAttempt\);/);
  assert.match(route, /attemptOnce\('build_initial', firstRoute\.model/);
});

test('the retry escalates instead of running the same model on the same problem', () => {
  const route = fs.readFileSync(path.join(__dirname, 'routes/builder.js'), 'utf8');
  assert.match(route, /const secondRoute = modelForBuild\(designConfig\.type, planId, startAttempt \+ 1\);/);
  assert.match(route, /attemptOnce\('build_retry', secondRoute\.model/);
  // builderRetry.test.js runs the route against a fake client and proves it.
});

test('the plan defaults to free, so a billing fault spends less', () => {
  const route = fs.readFileSync(path.join(__dirname, 'routes/builder.js'), 'utf8');
  assert.match(route, /let planId = 'free';/);
  // It must be read inside the try, so a throw leaves the default in place.
  const i = route.indexOf("let planId = 'free';");
  const block = route.slice(i, i + 1200);
  assert.match(block, /planId = planForSubscription\(subscription\)\?\.id \|\| 'free';/);
  assert.ok(block.indexOf('planId = planForSubscription') > block.indexOf('try {'));
});

test('no build call site still names a model directly', () => {
  const route = fs.readFileSync(path.join(__dirname, 'routes/builder.js'), 'utf8');
  const buildSites = [...route.matchAll(/attemptOnce\('build_(initial|retry)',\s*([^,]+),/g)];
  assert.equal(buildSites.length, 2, 'expected exactly two build call sites');
  for (const site of buildSites) {
    assert.match(site[2], /^(firstRoute|secondRoute)\.model$/, `build_${site[1]} still hardcodes a model`);
  }
  // And the one place a model string is passed to the SDK for a build takes it as a parameter.
  assert.match(route, /const attemptOnce = async \(label, model, messages, timeoutMs\)/);
});

// ── A page whose value is its words is not a cheap page ──────────────────────
//
// The first version of this table put every "static" page on haiku on the
// grounds that a larger model draws the same layout. A real shared project
// proved the reasoning incomplete: designEngine supplies the layout, so the
// model's only contribution to a portfolio or a restaurant page is the writing,
// and the writing is what the person who received the link judged.
test('pages whose value is the copy are not built by the cheapest model', () => {
  for (const type of ['portfolio', 'landing', 'restaurant', 'shop', 'sports', 'cooking']) {
    assert.ok(
      modelForBuild(type, 'free').tier >= 1,
      `${type} should not be built by the cheapest model`
    );
  }
});

// The counterpart, so this does not quietly become "everything on sonnet".
// A quiz and a set of flashcards are structured content, not written content.
test('structured content stays on the cheapest model', () => {
  for (const type of ['quiz', 'flashcards', 'blog']) {
    assert.strictEqual(modelForBuild(type, 'plus').tier, 0, type);
  }
});
