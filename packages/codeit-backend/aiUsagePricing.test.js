'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { estimateCostUSD, priceForModel } = require('./aiUsagePricing');

test('uses the Haiku 4.5 standard API token prices', () => {
  assert.deepEqual(priceForModel('claude-haiku-4-5-20251001'), {
    input: 1,
    output: 5,
    cacheWrite: 1.25,
    cacheRead: 0.1,
  });
});

test('estimates usage without storing request or response content', () => {
  assert.equal(estimateCostUSD('claude-haiku-4-5-20251001', {
    input_tokens: 1_000_000,
    output_tokens: 1_000_000,
  }), 6);
});

test('returns null for an unknown model instead of inventing a price', () => {
  assert.equal(estimateCostUSD('future-model', { input_tokens: 100 }), null);
});

test('the models the builds actually run on are priced, and a newer generation is not mistaken for them', () => {
  assert.deepEqual(priceForModel('claude-sonnet-5'), { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 });
  assert.deepEqual(priceForModel('claude-opus-5'), { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 });
  assert.equal(estimateCostUSD('claude-sonnet-5', { input_tokens: 1_000_000, output_tokens: 1_000_000 }), 12);
  // Sonnet 5.5 starts with "claude-sonnet-5" and is not Sonnet 5.
  assert.equal(priceForModel('claude-sonnet-5-5'), null);
  assert.equal(priceForModel('claude-opus-5-5'), null);
  // Every model the router can pick has a price.
  const { TIERS } = require('./modelRouting');
  for (const model of TIERS) assert.ok(priceForModel(model), `${model} has no price`);
});
