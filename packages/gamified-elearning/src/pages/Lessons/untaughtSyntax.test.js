import { LESSONS } from './lessonRegistry';

// ── Syntax a child has never been shown ──────────────────────────────────────
//
// Three defects of the same shape turned up separately: lesson 16 advertising
// methods it never demonstrates, lesson 22 reusing dictionary braces for sets,
// lesson 28 using start=1. Three is a class, so this sweeps for the rest.
//
// The worst was one line, in lesson 28's "A Real Leaderboard", described as
// "Run it. Enumerate does the ranking for you.":
//
//   ranked = sorted(scores.items(), key=lambda pair: pair[1], reverse=True)
//
// Four things the course never teaches anywhere in 31 lessons: sorted() and
// lambda each appeared exactly once in the whole course, both here, both
// unexplained; key= and reverse= are call-site keyword arguments, which no
// lesson from 1 to 27 contains. The next line added nested unpacking, where
// lesson 21 taught only the flat form.
//
// The description was also wrong about what it did. Enumerate does not rank.
// sorted(..., reverse=True) ranks; enumerate only numbers the result.
//
// The site's whole argument is that a child can open the code and understand
// it. A line no reader of lessons 1 to 28 can parse, presented as a routine
// example and told to run it, contradicts that in the easiest place to check.
//
// This test cannot judge whether an explanation is any good, only whether one
// exists. Lesson 22's brace collision does not appear here at all, because
// sets and dictionaries are both introduced in prose. That one needed a person
// noticing that two correct explanations contradict each other.
const CODE_FIELDS = ['code', 'starterCode', 'solution', 'highlight'];
const PROSE_FIELDS = ['body', 'title', 'description', 'explanation', 'hint'];

function collect(lesson, fields) {
  const out = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    for (const [key, value] of Object.entries(node)) {
      if (fields.includes(key) && typeof value === 'string') out.push(value);
      else walk(value);
    }
  };
  walk(lesson);
  return out.join('\n');
}

// Features that must be named somewhere in the course before, or in, the
// lesson whose code first uses them. Deliberately a short list of things a
// child cannot guess, rather than every token: the false-positive rate on a
// generated list is what makes a sweep like this get ignored.
const FEATURES = [
  ['sorted(',   /\bsorted\b/],
  ['lambda',    /\blambda\b/],
  ['min(',      /\bmin\b/],
  ['max(',      /\bmax\b/],
  ['sum(',      /\bsum\b/],
  ['enumerate(',/\benumerate\b/],
  ['zip(',      /\bzip\b/],
  ['start=',    /start=1|naming an argument|keyword argument/],  // lower-cased already
  ['key=',      /\bkey=|\bkey argument/],
  ['reverse=',  /\breverse=/],
];

const CODE = LESSONS.map((entry) => collect(entry.data, CODE_FIELDS));
// Lower-cased before matching. The first version of this test failed on
// lesson 28's own "Zip walks two lists at the same time", because the prose
// capitalises a word at the start of a sentence and the pattern did not. A
// test that fails on correct work is how people learn to ignore tests, so it
// was the test that was wrong, not the lesson. \b still keeps sum from
// matching summary and min from matching minute.
const PROSE = LESSONS.map((entry) => collect(entry.data, PROSE_FIELDS).toLowerCase());

describe('no lesson uses syntax the course never explains', () => {
  test.each(FEATURES)('%s is explained wherever it is used', (token, namedBy) => {
    const offenders = [];
    for (let i = 0; i < CODE.length; i += 1) {
      if (!CODE[i].includes(token)) continue;
      // Named in this lesson's prose, or in any earlier lesson's prose.
      const explained = PROSE.slice(0, i + 1).some((p) => namedBy.test(p));
      if (!explained) offenders.push(i + 1);
    }
    expect({ token, usedButNeverExplainedInLessons: offenders })
      .toEqual({ token, usedButNeverExplainedInLessons: [] });
  });

  test('the leaderboard example uses only what the course has taught', () => {
    const lesson28 = CODE[27];
    expect(lesson28).not.toMatch(/sorted\(/);
    expect(lesson28).not.toMatch(/lambda/);
    expect(lesson28).not.toMatch(/reverse=/);
    expect(lesson28).not.toMatch(/key=lambda/);
  });

  test('nothing in the course claims enumerate does the ranking', () => {
    expect(PROSE.join('\n')).not.toMatch(/Enumerate does the ranking/i);
  });
});
