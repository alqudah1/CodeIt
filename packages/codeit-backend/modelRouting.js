'use strict';

// ── Which model builds a child's idea ────────────────────────────────────────
//
// Everything ran on Haiku, including the first build, which is the one a child
// judges the whole product by. Prices read 2 September 2026, per million tokens
// in/out: Haiku 4.5 $1/$5, Sonnet 5 $2/$10, Opus 5 $5/$25. Sonnet 5 is both
// cheaper and newer than Sonnet 4.5, so 4.5 is not a candidate.
//
// The rule is not "better model for everyone". Opus on an unlimited CA$12 plan
// loses money on an ordinary two-child family before any heavy use at all. The
// rule is: spend where the difficulty is, and only for someone who paid.
//
//   haiku    static pages and simple forms. A blog or a quiz does not get
//            better with a larger model; it gets identical.
//   sonnet   one mechanic, one screen, real interaction.
//   opus     several systems at once: physics, levels, collision, state.
//            Paid accounts only.
//
// Free is capped at sonnet by construction. There is no argument to have about
// it later, and no way to reach opus by any combination of type and attempt.

const HAIKU  = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-5';
const OPUS   = 'claude-opus-5';

// Tiers, not model names, so the ladder can be re-pointed at a different model
// in one place when prices or names change.
const TIERS = [HAIKU, SONNET, OPUS];
const FREE_MAX_TIER = 1;   // sonnet
const PLUS_MAX_TIER = 2;   // opus

// ── The table ────────────────────────────────────────────────────────────────
//
// Seven of these came with the plan: blog and quiz on haiku, dodge on sonnet,
// platformer on opus, and the free cap.
//
// THE OTHER TWENTY ARE DERIVED HERE and are the one part of this file worth a
// second opinion. They follow the stated principle, but nobody has approved
// them individually. They are marked so that reviewing them is a single pass
// rather than an archaeology exercise.
const TIER_BY_TYPE = Object.freeze({
  // Given. blog stays at haiku deliberately: a blog is a container for words
  // the child writes themselves, not words the model writes for them.
  blog:        0,
  quiz:        0,
  dodge:       1,
  platformer:  2,

  // Corrected 2 September 2026. These were derived as "static or near-static
  // pages, where a larger model produces the same page more expensively". The
  // layout part of that is true and the conclusion was still wrong: on a page
  // like this the scaffold comes from designEngine, so the ONLY thing the model
  // contributes is the writing, and the writing is the entire thing a person
  // judges.
  //
  // The evidence is a real shared project, u-e61e190fde00, built by a paying
  // customer's friend and sent back with "the result he got is not nice". It
  // classified as portfolio, so it ran on haiku, and it came back headed
  // "Welcome to My World" and "I'm Creative & Awesome" over a hundred lines of
  // working JavaScript. The machinery was fine. The words were filler.
  //
  // So: pages whose value is the copy move to sonnet. flashcards and quiz stay
  // on haiku, because their content is structured rather than written.
  landing:     1,
  portfolio:   1,
  restaurant:  1,
  shop:        1,
  sports:      1,
  cooking:     1,
  flashcards:  0,

  // Derived: one mechanic, one screen, real interaction and state.
  calculator:  1,
  clicker:     1,
  drawing:     1,
  memory:      1,
  reaction:    1,
  timer:       1,
  typing:      1,
  puzzle:      1,
  maze:        1,
  basketball:  1,
  soccer:      1,

  // Derived: several systems at once. Movement plus collision plus levels or
  // an economy, which is where a smaller model starts producing something that
  // runs but is not the game that was asked for.
  racing:      2,
  runner:      2,
  survival:    2,
  tower:       2,
  simulator:   2,
});

/**
 * @param {string} type    a designEngine type
 * @param {string} plan    'plus' or anything else, which is treated as free
 * @param {number} attempt 0 for the first try, 1 for a retry after bad output
 * @returns {{ model: string, tier: number, escalated: boolean }}
 */
function modelForBuild(type, plan, attempt = 0) {
  // An unknown type spends LESS rather than more. A new type added to
  // designEngine and not placed here should cost nothing extra until someone
  // decides where it belongs; the test below is what makes that a decision
  // rather than an accident.
  const base = Object.prototype.hasOwnProperty.call(TIER_BY_TYPE, type)
    ? TIER_BY_TYPE[type]
    : 0;

  // A build that came back unusable is the signal that the request was harder
  // than its type suggested. One tier, once. Escalating costs nothing when the
  // first attempt succeeds, which is the usual case.
  const wanted = base + (attempt > 0 ? 1 : 0);

  const ceiling = plan === 'plus' ? PLUS_MAX_TIER : FREE_MAX_TIER;
  const tier = Math.min(wanted, ceiling, TIERS.length - 1);

  return { model: TIERS[tier], tier, escalated: tier > base };
}

module.exports = {
  modelForBuild,
  TIER_BY_TYPE,
  TIERS,
  HAIKU,
  SONNET,
  OPUS,
  FREE_MAX_TIER,
  PLUS_MAX_TIER,
};
