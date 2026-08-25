import { HOME_PICKS, STARTER_GAMES, STARTER_IDS, starterGameById } from './starterGames';
import { readProject, questionsFor, isEnoughToProve } from './proveIt';
import { changeIdeasFor } from './changeIdeas';

describe('what a child is offered', () => {
  test('the front page shows few enough to choose between', () => {
    // Someone who has not decided to try this yet gets about two seconds. A
    // menu is a decision, and a decision is where people leave.
    expect(HOME_PICKS.length).toBeGreaterThanOrEqual(3);
    expect(HOME_PICKS.length).toBeLessThanOrEqual(4);
    HOME_PICKS.forEach(pick => expect(STARTER_GAMES).toContain(pick));
  });

  test('the studio has enough that a child does not run out', () => {
    // The opposite problem. They are already in and have already had a go; the
    // only question left is whether there is another one. Three was twenty
    // minutes and then an empty text box.
    expect(STARTER_GAMES.length).toBeGreaterThanOrEqual(6);
  });

  test('no two games are played the same way', () => {
    // Six versions of "move left and right" is one game with six skins. Each
    // starter has to ask the hands for something different, or the second one
    // teaches nothing the first did not.
    const controls = STARTER_GAMES.map(g => {
      const c = g.code;
      if (/pointerdown[\s\S]*?jump|' '\s*\|\|\s*e.key === 'ArrowUp'/.test(c)) return 'tap-to-jump';
      if (/turn\(-1, 0\)|swipe/i.test(c)) return 'steer-four-ways';
      if (/popAt|shootAt|aimAt/.test(c)) return 'aim-and-tap';
      if (/pointermove/.test(c)) return 'slide';
      return 'other';
    });
    expect(new Set(controls).size).toBeGreaterThanOrEqual(3);
  });

  test('every one is named like something you would want, not like a category', () => {
    // "Catch the falling stars" beats "Arcade game".
    STARTER_GAMES.forEach(game => {
      expect(game.label).toBeTruthy();
      expect(game.label).not.toMatch(/game|template|starter|project|demo|example/i);
      expect(game.blurb).toBeTruthy();
      expect(game.emoji).toBeTruthy();
    });
  });

  test('each has a prompt, so asking for changes later lands on the right thing', () => {
    STARTER_GAMES.forEach(game => expect(game.prompt.length).toBeGreaterThan(10));
  });

  test('ids are unique and findable', () => {
    expect(new Set(STARTER_IDS).size).toBe(STARTER_IDS.length);
    STARTER_IDS.forEach(id => expect(starterGameById(id).id).toBe(id));
  });

  test('an unknown id is nothing, not a crash', () => {
    expect(starterGameById('nope')).toBeNull();
    expect(starterGameById(null)).toBeNull();
    expect(starterGameById(undefined)).toBeNull();
  });
});

describe('they have to actually be games', () => {
  // The old starters were web pages with buttons: no canvas, no animation loop,
  // and the word "score" twice. This is the test that stops that coming back.
  STARTER_GAMES.forEach(game => {
    describe(game.label, () => {
      test('draws on a canvas', () => {
        expect(game.code).toContain('<canvas');
        expect(game.code).toContain("getContext('2d')");
      });

      test('has something that moves on its own', () => {
        expect(game.code).toContain('requestAnimationFrame');
      });

      test('keeps a score', () => {
        expect(game.code).toMatch(/let score = \d/);
        expect(game.code).toContain('scoreLabel');
      });

      test('can be lost, and played again', () => {
        expect(game.code).toContain('gameOver');
        expect(game.code).toMatch(/Play again|Fly again|Take them again/);
      });

      test('works with a thumb', () => {
        // Most of these children are on a phone. A game that needs a keyboard
        // is a game they cannot play.
        expect(game.code).toMatch(/pointerdown|pointermove/);
        expect(game.code).toContain('touch-action: none');
      });

      test('fills the screen it is given', () => {
        expect(game.code).toContain('window.innerWidth');
        expect(game.code).toContain("addEventListener('resize'");
      });

      test('is a complete page', () => {
        expect(game.code).toMatch(/^<!doctype html>/i);
        expect(game.code.trim()).toMatch(/<\/html>$/);
        // Every script tag opened is closed.
        const opened = (game.code.match(/<script/g) || []).length;
        const closed = (game.code.match(/<\/script>/g) || []).length;
        expect(closed).toBe(opened);
      });
    });
  });
});

describe('they have to be readable, or none of this teaches anything', () => {
  STARTER_GAMES.forEach(game => {
    describe(game.label, () => {
      test('opens with settings a child can change', () => {
        expect(game.code).toContain('Change these and watch what happens');
      });

      test('those settings are plain declarations the studio can find', () => {
        const facts = readProject(game.code);
        expect(facts.variables.length).toBeGreaterThanOrEqual(4);
      });

      test('at least one is a number, so changing it changes how it plays', () => {
        const numbers = readProject(game.code).variables.filter(v => /^-?\d+(\.\d+)?$/.test(v.value));
        expect(numbers.length).toBeGreaterThanOrEqual(2);
      });

      test('at least one is a colour, so changing it is visible instantly', () => {
        const colours = readProject(game.code).variables.filter(v => /^'#[0-9a-f]{3,8}'$/i.test(v.value));
        expect(colours.length).toBeGreaterThanOrEqual(1);
      });

      test('the studio can ask enough about it to call it understood', () => {
        // proveIt refuses to award understanding on fewer than two questions.
        // A starter it cannot ask about is a starter a child cannot prove.
        expect(isEnoughToProve(questionsFor(game.code))).toBe(true);
      });

      test('the studio can suggest real changes to it', () => {
        expect(changeIdeasFor(game.code, game.prompt).length).toBeGreaterThanOrEqual(3);
      });

      test('no name is a single letter, except a loop counter', () => {
        readProject(game.code).variables.forEach(v => {
          expect(v.name.length).toBeGreaterThan(1);
        });
      });
    });
  });
});
