import { ICON_NAMES } from '../../components/Icon/Icon';
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
      // Was expect(game.emoji).toBeTruthy(). The cards are drawn icons now,
      // not device emoji, so what has to be true is that the name resolves to
      // something the icon set can actually draw.
      expect(ICON_NAMES).toContain(game.icon);
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
      test('has a world, drawn or built', () => {
        // This used to insist on a canvas, and the rule was a proxy for the
        // thing it actually cared about: the old starters were web pages with
        // buttons, and a canvas was the easiest way to tell a game from a form.
        //
        // The maze broke the proxy without breaking the rule. Its world is made
        // of real page elements on purpose, so the studio's drag editor becomes
        // a level editor and a child moves a wall rather than a score badge.
        // That is more of a game than a canvas, not less.
        //
        // The proxy broke a second time. Whack-a-mole and colour memory are
        // also built from elements, but they need no geometry at all — a mole
        // is up or it is not — so requiring getBoundingClientRect would have
        // failed two real games for not measuring anything.
        //
        // What all three element-built games share is the thing that matters:
        // a #field holding the pieces, read back out of the page at run time,
        // so a piece a child moved is the piece the game plays.
        const drawsOnCanvas = game.code.includes('<canvas') && game.code.includes("getContext('2d')");
        const buildsFromElements = game.code.includes('id="field"')
          && /querySelectorAll\('\.[a-z]+'\)|getBoundingClientRect/.test(game.code);
        expect(drawsOnCanvas || buildsFromElements).toBe(true);
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
        // A canvas has to be told its pixel size; an element world is laid out
        // in percentages and resizes itself. Both must cope with a phone.
        const sizesACanvas = game.code.includes('window.innerWidth')
          && game.code.includes("addEventListener('resize'");
        const laysOutInPercent = /left: \d+%/.test(game.code) && /inset: 0/.test(game.code);
        expect(sizesACanvas || laysOutInPercent).toBe(true);
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
