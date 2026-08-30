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
