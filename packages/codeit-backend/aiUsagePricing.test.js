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
