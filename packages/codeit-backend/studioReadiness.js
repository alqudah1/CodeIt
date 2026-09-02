'use strict';

// ── Whether the studio can actually build a child's idea ─────────────────────
//
// Diagnosed on 2 September 2026, from outside the server. A signed-in call to
// POST /api/builder with "a game where a dragon breathes fire at knights"
// returned 200 in 446 milliseconds with isFallback true, and the word "dragon"
// nowhere in the output.
//
// The timeout guard in routes/builder.js is 75,000 ms. A real model call at
// max_tokens 8192 takes seconds. Nothing that finishes in 446 ms made one.
// There are exactly two paths in that file that can return that fast: the
// early return when ANTHROPIC_API_KEY is absent, and the catch, which is where
// an SDK 401 on a bad key lands. Both are the same setting.
//
// The fallbacks themselves are good engineering. buildGenericGameFallback and
// buildQuizFallback are what a child should get when the model is unreachable.
// They are simply never meant to be the whole product, and there was nothing
// anywhere that noticed when they became it.
//
// That is what this file is for. A missing key is not an outage: the server
// starts, the route answers 200, the page renders, every test passes, and a
// nine-year-old asks for a cat jumping over boxes and is handed a star game.
// It broke silently and silence is the only way it could have lasted.
//
// This does not read the key, validate it, or send it anywhere. It answers one
// question: is the studio configured to do the thing the product is named for.

const AI_KEY = 'ANTHROPIC_API_KEY';

/**
 * @param {object} env usually process.env
 * @returns {{ready: boolean, missing: string[]}}
 *
 * `missing` rather than a bare boolean, so the caller can say which setting,
 * and so a second requirement can be added later without changing the shape.
 */
function studioReadiness(env = {}) {
  const missing = [];
  const key = typeof env[AI_KEY] === 'string' ? env[AI_KEY].trim() : '';
  if (!key) missing.push(AI_KEY);
  return { ready: missing.length === 0, missing };
}

/**
 * Plain words for a log line or an admin screen. Never includes the value.
 */
function studioReadinessMessage(readiness) {
  if (readiness.ready) return 'Studio ready: the builder can call the model.';
  return `Studio NOT ready: ${readiness.missing.join(', ')} is not set. `
    + 'Every build will return a canned starter instead of the child\'s idea.';
}

module.exports = { studioReadiness, studioReadinessMessage, AI_KEY };
