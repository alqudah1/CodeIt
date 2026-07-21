'use strict';

const MODEL_PRICING_USD_PER_MTOK = Object.freeze({
  'claude-haiku-4-5': {
    input: 1,
    output: 5,
    cacheWrite: 1.25,
    cacheRead: 0.1,
  },
});

function priceForModel(model) {
  if (typeof model !== 'string') return null;
  const key = Object.keys(MODEL_PRICING_USD_PER_MTOK).find((prefix) => model.startsWith(prefix));
  return key ? MODEL_PRICING_USD_PER_MTOK[key] : null;
}

function estimateCostUSD(model, usage = {}) {
  const price = priceForModel(model);
  if (!price) return null;

  const input = Math.max(0, Number(usage.input_tokens) || 0);
  const output = Math.max(0, Number(usage.output_tokens) || 0);
  const cacheWrite = Math.max(0, Number(usage.cache_creation_input_tokens) || 0);
  const cacheRead = Math.max(0, Number(usage.cache_read_input_tokens) || 0);

  return (
    input * price.input
    + output * price.output
    + cacheWrite * price.cacheWrite
    + cacheRead * price.cacheRead
  ) / 1_000_000;
}

module.exports = { estimateCostUSD, priceForModel };
