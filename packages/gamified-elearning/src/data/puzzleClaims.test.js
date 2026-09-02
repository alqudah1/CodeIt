import fs from 'fs';
import path from 'path';

// ── A published sentence must match the code it describes ────────────────────
//
// Found on 2 September 2026. /blog/best-coding-games-for-kids said "coding
// games are the third step in every chapter: lesson, then quiz, then puzzle".
// puzzleConfigs.js covers lessons 1 to 10. Lessons 11 to 31 have no puzzle, so
// the sentence was false for 21 of the 31 lessons.
//
// The claim is now the true one. This test fails if the code and the claim
// drift apart again in either direction: write puzzles for lesson 11 and the
// sentence needs updating too.
const DATA = path.join(__dirname);
const PUZZLES = fs.readFileSync(path.join(DATA, '../pages/Journey/puzzleConfigs.js'), 'utf8');
const POSTS = fs.readFileSync(path.join(DATA, 'blogPosts.js'), 'utf8');

// Keys look like '1-a', '1-b', '1-boss'. The lesson number is the prefix.
const coveredLessons = [...new Set(
  [...PUZZLES.matchAll(/^\s*'(\d+)-[a-z]+'\s*:/gm)].map(m => Number(m[1]))
)];
const highest = Math.max(...coveredLessons);

describe('what we say about puzzles matches what exists', () => {
  test('puzzleConfigs covers a contiguous run starting at lesson 1', () => {
    expect(coveredLessons.length).toBeGreaterThan(0);
    expect(Math.min(...coveredLessons)).toBe(1);
    for (let i = 1; i <= highest; i += 1) expect(coveredLessons).toContain(i);
  });

  test('no published sentence claims a puzzle in every chapter', () => {
    expect(POSTS).not.toMatch(/third step in every chapter/i);
    expect(POSTS).not.toMatch(/lesson, then quiz, then puzzle/i);
    // Matched as whole phrases, not as a loose proximity rule. An earlier
    // version of this test matched "every|each lesson ... has ... puzzle"
    // within a character budget and failed on "Each lesson has examples, and
    // each puzzle", which is a true sentence. A test that fails on correct
    // copy is how people learn to ignore tests.
    expect(POSTS).not.toMatch(
      /(?:every|each)\s+(?:lesson|chapter)[^.]{0,25}(?:has a puzzle|ends with a puzzle|is followed by a puzzle|comes with a puzzle)/i,
    );
  });

  test('the blog names the real number of lessons that have a puzzle', () => {
    const words = { 10: 'ten', 11: 'eleven', 12: 'twelve', 15: 'fifteen', 20: 'twenty', 31: 'thirty-one' };
    const expected = words[highest] || String(highest);
    expect(POSTS).toMatch(new RegExp(`first ${expected} lessons`, 'i'));
  });
});
