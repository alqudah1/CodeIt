'use strict';

// /learn-python-for-kids carried "16 Interactive Lessons" in its <title> and
// "31 interactive browser lessons" in its description, on the same page, at the
// same time. The curriculum grew and one of the two was updated. The title is
// the line a person reads in a search result, so the stale half was the half
// that mattered, and it advertised half the course.
//
// Counting the files is the only source that cannot go stale, because adding a
// lesson is what changes it.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { PAGES, HOME_PAGE, renderRouteDocument } = require('./generate-static-seo.js');

// The first version of this matched a numeral followed by at most two fixed
// adjectives. It examined four claims and missed two kinds of sentence that
// were live at the same time:
//
//   "Sixteen sequenced lessons take a beginner from a first print statement..."
//   "31 beginner Python lessons, each with an explanation..."
//
// The first is spelled out. The second has words the pattern did not list. The
// spelled-out one sat on /learn-python-for-kids — the page that actually ranks
// — and advertised half the course to every parent who found it, while this
// test reported success. That is the same failure as the build-allowance guard,
// which matched "\d+ assisted project builds" while all nine pages spelled the
// number out, and it was still here after that one was fixed.
// "one" is deliberately absent. It is a pronoun far more often than a count —
// /guide/what-did-my-kid-learn says "one to its lesson" — and no product on
// earth advertises a one-lesson course, so including it bought nothing and cost
// a false positive on ordinary prose.
const NUMBER_WORDS = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  'twenty-five': 25, thirty: 30, 'thirty-one': 31, 'thirty-two': 32, forty: 40, fifty: 50,
};

// A number, then up to three describing words, then "lesson(s)", all on one
// line. The line restriction is what keeps breadcrumbs out: /lesson/24 is
// titled "List Comprehensions. A List in One Line" and the page furniture puts
// "Python lesson 24" on the next line, which a whitespace-tolerant gap reads as
// "One ... lesson" and reports as a claim that the course has one lesson in it.
// A statement about the size of the course is a phrase in a sentence, not
// something that spans a line break.
const CLAIM = new RegExp(
  `\\b(\\d+|${Object.keys(NUMBER_WORDS).join('|')})[^\\S\\n]+((?:[A-Za-z]+[^\\S\\n]+){0,3})lessons?\\b([^\\S\\n]+[A-Za-z]+)?`,
  'gi'
);

/**
 * Words that make the phrase mean something other than "the course has N".
 *
 * They appear on both sides. "the first three lessons" qualifies before the
 * noun; "Six lessons in fifteen lines" — real prose in lesson 31, meaning six
 * lessons' worth of ideas — qualifies after it. Checking only the leading side
 * reported that sentence as a claim that the course contains six lessons.
 */
const NOT_A_TOTAL = /\b(of|in|per|out|worth|first|last|more|other|extra|further|remaining)\b/i;

// The same words, looked for on the LEFT of the number.
//
// This guard was red on main and nobody noticed, because the phrase it tripped
// on is correct English and correct fact: "Puzzles cover the first ten
// lessons". NOT_A_TOTAL only ever looked at the words between the number and
// "lessons" and the word after it, so "first" sitting in front of the number
// was invisible, and the guard read a true sentence as a claim that the course
// has ten lessons in it.
//
// A guard that cries wolf on true copy gets muted, and this one had been
// failing every CI run for long enough that a red tick on main stopped meaning
// anything. That is more expensive than the bug it was written to catch.
const NOT_A_TOTAL_BEFORE = /\b(of|in|per|out|worth|first|last|more|other|extra|further|remaining|through|beyond|after|before|across)\s+$/i;

/**
 * A gap that proves the number is not quantifying "lessons".
 *
 * "31 beginner Python lessons" is a quantity: adjectives only. "CodeIt goes to
 * 18 and the lessons are useful for a late beginner" is an age followed by an
 * unrelated clause, and the giveaway is the function words. Anything with a
 * conjunction, article or preposition between the number and the noun is two
 * separate statements that happen to sit near each other.
 */
const NOT_A_QUANTITY = /\b(and|or|but|so|the|a|an|to|is|are|was|were|that|which|with|for|from|by|at|on)\b/i;

function claimedCount(token) {
  const key = token.toLowerCase();
  return /^\d+$/.test(key) ? Number(key) : NUMBER_WORDS[key];
}

test('every lesson count in rendered copy matches the lesson files', () => {
  const real = fs
    .readdirSync(path.resolve(__dirname, '../src/pages/Lessons/lessonData'))
    .filter((name) => /^lesson\d+\.js$/.test(name)).length;
  assert.ok(real > 0, 'no lesson data files found');

  const template = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
  let checked = 0;

  for (const page of [HOME_PAGE, ...PAGES]) {
    const text = renderRouteDocument(template, page).replace(/<[^>]+>/g, ' ');
    for (const match of text.matchAll(CLAIM)) {
      // "one of 31 lessons" and "the first three lessons" are not claims about
      // the size of the course, and asserting on them would make the guard
      // unusable in ordinary prose.
      if (NOT_A_TOTAL.test(match[2]) || NOT_A_TOTAL.test(match[3] || '')) continue;
      // "the first ten lessons" is a range inside the course, not its size.
      const before = text.slice(Math.max(0, match.index - 20), match.index);
      if (NOT_A_TOTAL_BEFORE.test(before)) continue;
      if (NOT_A_QUANTITY.test(match[2])) continue;

      // Only counts that could plausibly be the size of the course.
      //
      // This scan runs over every rendered page, including sixteen guides and
      // seven blog posts that discuss lessons in ordinary prose: "two lessons
      // and a project", "six lessons in fifteen lines". Those are not claims
      // about how big this course is, and every attempt to exclude them by
      // grammar produced another exception to write.
      //
      // Stated limitation, so nobody trusts this further than it goes: a claim
      // of "nine lessons" would pass unexamined. The failure this exists to
      // catch is a large number left behind by a growing curriculum — it was 16
      // against 31, twice, on two different live pages — and that is always
      // large.
      const claimed = claimedCount(match[1]);
      if (!claimed || claimed < 10) continue;

      checked += 1;
      assert.equal(claimed, real,
        `${page.route || '/'} claims "${match[0].trim()}" but there are ${real} lesson files`);
    }
  }

  // A scan that matches nothing passes, and passing for that reason is worse
  // than failing, because it reads as coverage.
  assert.ok(checked > 0, 'no lesson-count claim was found; this test is not doing anything');
});

// The exclusions above are where a guard like this quietly stops working, in
// both directions: too loose and it fails on true copy until somebody mutes it,
// too tight and it passes while a page advertises half the course. Both have
// already happened here.
test('the scan still catches a stale total, and still ignores a range', () => {
  const claims = (line) => {
    const found = [];
    for (const match of line.matchAll(CLAIM)) {
      if (NOT_A_TOTAL.test(match[2]) || NOT_A_TOTAL.test(match[3] || '')) continue;
      const before = line.slice(Math.max(0, match.index - 20), match.index);
      if (NOT_A_TOTAL_BEFORE.test(before)) continue;
      if (NOT_A_QUANTITY.test(match[2])) continue;
      const claimed = claimedCount(match[1]);
      if (claimed && claimed >= 10) found.push(claimed);
    }
    return found;
  };

  // The failure this file exists for: a number left behind by a growing course.
  assert.deepEqual(claims('16 Interactive Lessons'), [16]);
  assert.deepEqual(claims('Sixteen sequenced lessons take a beginner'), [16]);
  assert.deepEqual(claims('31 beginner Python lessons, each with an explanation'), [31]);

  // Ranges inside the course, which are not claims about its size.
  assert.deepEqual(claims('Puzzles cover the first ten lessons, and completing one'), []);
  assert.deepEqual(claims('In the first ten lessons, passing the quiz also unlocks a puzzle'), []);
  assert.deepEqual(claims('through the first ten lessons in 3 to 4 weeks'), []);
  assert.deepEqual(claims('one of 31 lessons'), []);
});
