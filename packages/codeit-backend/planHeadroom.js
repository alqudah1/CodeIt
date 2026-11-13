'use strict';

// ── Is anybody anywhere near a limit CodeIt Plus removes? ────────────────────
//
// CodeIt Plus sells exactly two things, and pricingClaims.test.js makes sure
// the page says only those two: as many AI-built projects as you want instead
// of ten a month, and up to four children on one adult account instead of one.
//
// The funnel then reported that in ninety days, nobody had ever reached the
// ten-build limit. Not nearly reached it: reached it zero times. And 1,181
// upgrade offers produced two clicks.
//
// Those two facts fit together in a way that is uncomfortable but worth
// saying out loud: a limit nobody touches is not a limit anybody pays to
// remove. Before anyone writes better upgrade copy, the question is whether
// there is anything to write about — which is a question with an answer in
// the database rather than an opinion.
//
// So this counts, for every adult account: how many AI builds they made this
// month, how many they made in their best month ever, and how many children
// are on their account. Buckets rather than rows, because the shape is the
// finding and nobody needs a list of people.
//
// It says nothing about whether the plan is priced right or worth buying. It
// answers one question: how many families are close enough to a wall to feel
// it.

const { PLANS } = require('./entitlements');

/**
 * Sort counts into labelled buckets.
 *
 * Buckets are given as [label, test]. The first test a value passes wins, so
 * order them from smallest, and give the last one a test that always passes.
 */
function bucketize(values, buckets) {
  const counts = buckets.map(([label]) => ({ label, count: 0 }));
  for (const value of values) {
    const index = buckets.findIndex(([, test]) => test(value));
    if (index >= 0) counts[index].count += 1;
  }
  return counts;
}

const AI_BUCKETS = [
  ['none', n => n === 0],
  ['1 to 2', n => n <= 2],
  ['3 to 5', n => n <= 5],
  ['6 to 9', n => n <= 9],
  ['10 or more, the free limit', () => true],
];

const CHILD_BUCKETS = [
  ['no child profile', n => n === 0],
  ['1, the free limit', n => n === 1],
  ['2', n => n === 2],
  ['3', n => n === 3],
  ['4 or more', () => true],
];

/**
 * The shape of the answer, from plain arrays of per-account counts.
 *
 * Kept separate from the queries so it can be tested without a database, and
 * so the thresholds it reports are read from the entitlements module rather
 * than written here a second time.
 */
function headroomFrom({ buildsThisMonth = [], bestMonthEver = [], childrenPerAdult = [] } = {}) {
  const freeBuilds = PLANS.free.monthlyAiBuilds;
  const freeChildren = PLANS.free.maxChildProfiles;
  const max = list => (list.length ? Math.max(...list) : 0);

  return {
    aiBuilds: {
      freeLimit: freeBuilds,
      accounts: buildsThisMonth.length,
      thisMonth: bucketize(buildsThisMonth, AI_BUCKETS),
      mostThisMonth: max(buildsThisMonth),
      mostInAnyMonth: max(bestMonthEver),
      // The number that decides whether this limit is worth selling against.
      everReachedTheLimit: bestMonthEver.filter(n => n >= freeBuilds).length,
      everCameClose: bestMonthEver.filter(n => n >= freeBuilds - 2 && n < freeBuilds).length,
    },
    children: {
      freeLimit: freeChildren,
      adults: childrenPerAdult.length,
      distribution: bucketize(childrenPerAdult, CHILD_BUCKETS),
      most: max(childrenPerAdult),
      atTheLimit: childrenPerAdult.filter(n => n === freeChildren).length,
      overTheLimit: childrenPerAdult.filter(n => n > freeChildren).length,
    },
  };
}

module.exports = { AI_BUCKETS, CHILD_BUCKETS, bucketize, headroomFrom };
