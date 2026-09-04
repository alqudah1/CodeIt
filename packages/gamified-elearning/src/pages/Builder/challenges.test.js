import { LADDER, MAX_DISMISSALS, challengeDone, conceptSentence, nextChallenge } from './challenges';
import { starterGameById } from './starterGames';

// ── The improvement ladder is checkable, or it is not shipped ────────────────
//
// Every rung names a thing in the child's OWN project, is one change, has a
// concept attached, and has a check that reads the file before and after and
// says whether it happened. The tests below run each rung against a real
// starter and a real edit.

const catchStars = starterGameById('catch-stars').code;

describe('choosing the rung', () => {
  test('the first challenge on a fresh game is to change a number in it, named', () => {
    const c = nextChallenge(catchStars);
    expect(c.id).toBe('change-a-number');
    // catch-stars declares `let fallSpeed = 3`; speed wins over score.
    expect(c.prompt).toBe('Make the speed 6 instead of 3.');
    expect(c.hint).toContain('fallSpeed = 3');
    expect(c.lesson).toBe(2);
  });

  test('a rung that introduces a concept the project already has is skipped', () => {
    // catch-stars has an if statement, so "add a rule" would teach nothing.
    const ids = [];
    let skip = [];
    for (let i = 0; i < LADDER.length; i += 1) {
      const c = nextChallenge(catchStars, { skip });
      if (!c) break;
      ids.push(c.id);
      skip = [...skip, c.id];
    }
    // It has an if, a for loop and a list (stars = []) already, so the three
    // rungs that would introduce those are all skipped.
    expect(ids).toEqual(['change-a-number', 'rename-the-title']);
  });

  test('one at a time, and skipped rungs stay skipped', () => {
    const first = nextChallenge(catchStars);
    const second = nextChallenge(catchStars, { skip: [first.id] });
    expect(second.id).not.toBe(first.id);
  });

  test('nothing to offer is null, not a made-up challenge', () => {
    expect(nextChallenge('<html><body><p>hi</p></body></html>')).toBeNull();
    expect(nextChallenge('')).toBeNull();
  });
});

describe('checking the rung', () => {
  test('changing the named number counts', () => {
    const after = catchStars.replace('let fallSpeed  = 3;', 'let fallSpeed  = 6;');
    expect(after).not.toBe(catchStars);
    expect(challengeDone('change-a-number', catchStars, after)).toBe(true);
    expect(conceptSentence('change-a-number', catchStars)).toMatch(/variable.*fallSpeed/);
  });

  test('changing some other number does not count', () => {
    const after = catchStars.replace('let startLives = 3;', 'let startLives = 5;');
    expect(after).not.toBe(catchStars);
    expect(challengeDone('change-a-number', catchStars, after)).toBe(false);
  });

  test('an unchanged file never counts', () => {
    expect(challengeDone('change-a-number', catchStars, catchStars)).toBe(false);
  });

  test('a new list counts for the list rung, and only a new one', () => {
    const after = catchStars.replace('let score = 0;', 'let score = 0;\nlet lastScores = [];');
    expect(challengeDone('keep-a-list', catchStars, after)).toBe(true);
    expect(challengeDone('keep-a-list', catchStars, catchStars)).toBe(false);
  });

  test('every rung has every part', () => {
    for (const rung of LADDER) {
      for (const key of ['id', 'concept', 'lesson', 'fits', 'prompt', 'hint', 'check', 'thenSay']) {
        expect(rung[key]).toBeDefined();
      }
    }
    expect(MAX_DISMISSALS).toBe(3);
  });
});
