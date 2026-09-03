import { HOME_PICKS } from '../Builder/starterGames';
import { conceptsIn } from '../Builder/codeConcepts';

// ── The home page shows real lines, or it shows nothing ──────────────────────
//
// The page says "every colour, score and speed on the screen is a line you can
// find and change" and, until now, offered a stranger no way to check it. The
// section that does is read out of the real starter file by the same reader the
// studio uses, so it cannot become a claim: if the game changes, the snippets
// change with it.
//
// This test is what makes that true. A snippet that no longer appears at the
// line it names is a lie printed on the home page, and this fails on it.
const firstGame = HOME_PICKS[0];
const source = firstGame.html || firstGame.code;
const shown = conceptsIn(source).slice(0, 3);

function lineAt(number) {
  // Line numbers are counted in the whole file, not inside the script block:
  // that is what a child sees in the code panel, so it is what the home page
  // has to print. The first version of this test counted inside the script and
  // was off by the length of the markup above it, which is the sort of test
  // that fails on a correct page and gets deleted rather than read.
  return (source.split('\n')[number - 1] || '').trim();
}

describe('the code on the home page is the code in the file', () => {
  test('there is something to show, so an empty section is not a pass', () => {
    expect(shown.length).toBe(3);
    for (const concept of shown) {
      expect(concept.snippet.length).toBeGreaterThan(3);
      expect(concept.line).toBeGreaterThan(0);
    }
  });

  test('every snippet appears in the game it claims to come from', () => {
    for (const concept of shown) {
      expect(source).toContain(concept.snippet);
    }
  });

  test('every snippet is at the line number printed beside it', () => {
    for (const concept of shown) {
      expect(lineAt(concept.line)).toContain(concept.snippet.slice(0, 24));
    }
  });

  test('every lesson it sends a reader to is a lesson that exists', () => {
    for (const concept of shown) {
      expect(concept.lessonId).toBeGreaterThanOrEqual(1);
      expect(concept.lessonId).toBeLessThanOrEqual(31);
      expect(typeof concept.label).toBe('string');
    }
  });
});
