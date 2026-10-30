'use strict';

// Standard list prices, USD per million tokens, from
// https://platform.claude.com/docs/en/about-claude/pricing (read 30 October
// 2026). Builds run on Sonnet 5 and, for Plus, Opus 5 (modelRouting.js); with
// only Haiku here the admin's "Estimated API cost" went blank the moment a
// Sonnet row appeared, which was the week the account was funded.
const MODEL_PRICING_USD_PER_MTOK = Object.freeze({
  'claude-haiku-4-5': { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
  'claude-sonnet-5':  { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
  'claude-opus-5':    { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 },
});

// A model id is the name, or the name with a release date: claude-haiku-4-5
// or claude-haiku-4-5-20251001. Matched whole, not by prefix, because
// claude-sonnet-5-5 (Sonnet 5.5) starts with claude-sonnet-5 and costs more.
function priceForModel(model) {
  if (typeof model !== 'string') return null;
  const name = model.replace(/-\d{8}$/, '');
  return MODEL_PRICING_USD_PER_MTOK[name] || null;
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
