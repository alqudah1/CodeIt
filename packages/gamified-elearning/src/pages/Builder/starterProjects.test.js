import { SHELVES, STARTER_PROJECTS, STARTER_PROJECT_IDS, starterProjectById } from './starterProjects';
import { STARTER_GAMES } from './starterGames';
import { conceptsIn } from './codeConcepts';
import { readSettings } from './gameSettings';

// ── One standard for all three kinds ─────────────────────────────────────────
//
// The games earned their checks the hard way: a browser found that the flagship
// one ended before a child could move and another was invisible one load in
// three. The quizzes and the websites are new, so they start with the same bar
// rather than being trusted because they are simpler.

test('every starter has a unique id', () => {
  expect(new Set(STARTER_PROJECT_IDS).size).toBe(STARTER_PROJECT_IDS.length);
});

test('the shelves hold every starter and invent none', () => {
  const shelved = SHELVES.flatMap(shelf => shelf.items);
  expect(shelved).toHaveLength(STARTER_PROJECTS.length);
  expect(new Set(shelved.map(item => item.id)))
    .toEqual(new Set(STARTER_PROJECT_IDS));
});

test('every shelf says what it is for', () => {
  for (const shelf of SHELVES) {
    expect(shelf.title.length).toBeGreaterThan(3);
    expect(shelf.line.length).toBeGreaterThan(20);
    expect(shelf.items.length).toBeGreaterThanOrEqual(3);
    for (const item of shelf.items) expect(item.kind).toBe(shelf.kind);
  }
});

test('a bad id is null, not a crash', () => {
  expect(starterProjectById('does-not-exist')).toBeNull();
  expect(starterProjectById(null)).toBeNull();
  expect(starterProjectById(undefined)).toBeNull();
  expect(starterProjectById('')).toBeNull();
});

test('the games are all still there and still marked as games', () => {
  // starterProjects wraps STARTER_GAMES. If that import ever silently returned
  // nothing, the picker would show quizzes and websites and no games at all.
  const games = STARTER_PROJECTS.filter(project => project.kind === 'game');
  expect(games).toHaveLength(STARTER_GAMES.length);
  expect(games.length).toBeGreaterThanOrEqual(8);
});

describe.each(STARTER_PROJECTS.map(project => [`${project.kind}: ${project.label}`, project]))(
  '%s', (label, project) => {
    test('is described in words a child can choose from', () => {
      expect(project.label.length).toBeGreaterThan(3);
      expect(project.emoji.length).toBeGreaterThan(0);
      expect(project.blurb.length).toBeGreaterThan(15);
      // The blurb sits under the label on a card. Longer than this wraps to
      // three lines on a phone and the row stops being scannable.
      expect(project.blurb.length).toBeLessThanOrEqual(70);
      expect(project.prompt.length).toBeGreaterThan(25);
    });

    test('is a complete, self-contained page', () => {
      expect(project.code).toMatch(/^<!doctype html>/i);
      expect(project.code).toContain('</html>');
      expect(project.code).toContain('<script>');
      // A page with no viewport tag renders at desktop width on a phone and
      // every tap target lands in the wrong place.
      expect(project.code).toContain('name="viewport"');
      // Nothing may reach the network: the preview iframe has no same-origin
      // access and a school firewall would leave holes in the page.
      expect(project.code).not.toMatch(/<script[^>]+src=/i);
      expect(project.code).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
    });

    test('opens with settings a child can change', () => {
      expect(project.code).toContain('// ── Change these and watch what happens ──');
      const settings = readSettings(project.code);
      expect(settings.length).toBeGreaterThanOrEqual(3);
      for (const setting of settings) {
        expect(setting.name).toMatch(/^[a-zA-Z][\w$]*$/);
      }
    });

    test('really contains the ideas the lessons teach', () => {
      // The code tab claims "you used these things". If a starter contains
      // almost nothing, that claim is empty on the first project a child opens.
      const found = conceptsIn(project.code);
      expect(found.length).toBeGreaterThanOrEqual(4);
      for (const concept of found) {
        expect(project.code).toContain(concept.snippet);
      }
    });

    test('never asks a child for card details', () => {
      // The shop pages have a basket. A basket that walks a child through
      // typing a card number, even a pretend one, is a habit worth not
      // building — and it is the exact shape of a phishing page.
      expect(project.code).not.toMatch(/type="password"/i);
      expect(project.code).not.toMatch(/card number|cvv|expiry date|sort code/i);
    });
  },
);

// ── The two element-built kinds, where the editor really works ───────────────

describe.each(STARTER_PROJECTS.filter(p => p.kind !== 'game')
  .map(p => [p.label, p]))('%s is editable element by element', (label, project) => {
    test('has enough real elements for the editor to grab', () => {
      const tags = project.code.match(/<(div|p|h1|h2|button|li|span|section)\b/gi) || [];
      expect(tags.length).toBeGreaterThanOrEqual(10);
    });

    test('does not hide the whole page inside a canvas', () => {
      expect(project.code).not.toContain('<canvas');
    });
  });

// ── The shops, specifically ──────────────────────────────────────────────────

describe('the shop pages', () => {
  const sites = STARTER_PROJECTS.filter(project => project.kind === 'site');

  test('there are five of them', () => {
    expect(sites).toHaveLength(5);
  });

  test('none of them invents a statistic', () => {
    // The home page once carried five made-up usage numbers. A child copying a
    // shop page that says "12,000 happy customers" learns to do the same thing.
    for (const site of sites) {
      expect(site.code).not.toMatch(/\b\d[\d,]*\+? (happy )?(customers|reviews|orders|sold|ratings)\b/i);
      expect(site.code).not.toMatch(/\b\d(\.\d)? out of \d\b/i);
      expect(site.code).not.toMatch(/★|⭐{2,}/);
    }
  });

  test('each one says out loud that it is not a real business', () => {
    for (const site of sites) {
      expect(site.code).toMatch(/made-up|invented/i);
    }
  });

  test('each one has prices, and they are numbers the code can add up', () => {
    for (const site of sites) {
      const prices = [...site.code.matchAll(/price: ([\d.]+)/g)].map(m => Number(m[1]));
      expect(prices.length).toBeGreaterThanOrEqual(4);
      for (const price of prices) expect(price).toBeGreaterThan(0);
    }
  });
});

// ── The quizzes, specifically ────────────────────────────────────────────────

describe('the quiz pages', () => {
  const quizzes = STARTER_PROJECTS.filter(project => project.kind === 'quiz');

  test('there are five of them', () => {
    expect(quizzes).toHaveLength(5);
  });

  test('none of them is a copy of another', () => {
    // The first version of these was built by running .replace() over one
    // finished quiz. When a replacement silently matched nothing, the space
    // quiz shipped full of animal questions and every test still passed.
    const asked = quizzes.map(quiz =>
      new Set([...quiz.code.matchAll(/ask: '([^']+)'/g)].map(m => m[1])));

    // The maths quiz writes its own questions at run time, so it has none in
    // the file. Every quiz that does have written questions must have a full
    // set of them, and no two quizzes may share one.
    const written = asked.filter(set => set.size > 0);
    expect(written.length).toBe(quizzes.length - 1);
    for (let i = 0; i < written.length; i += 1) {
      expect(written[i].size).toBeGreaterThanOrEqual(5);
      for (let j = i + 1; j < written.length; j += 1) {
        const shared = [...written[i]].filter(question => written[j].has(question));
        expect(shared).toEqual([]);
      }
    }
  });

  test('every right answer points at an answer that exists', () => {
    for (const quiz of quizzes) {
      const rows = [...quiz.code.matchAll(/answers: \[([^\]]+)\], right: (\d+)/g)];
      for (const [, answers, right] of rows) {
        const count = answers.split(/',\s*'/).length;
        expect(Number(right)).toBeGreaterThanOrEqual(0);
        expect(Number(right)).toBeLessThan(count);
      }
    }
  });

  test('the right answer is not always in the same place', () => {
    for (const quiz of quizzes) {
      const rights = [...quiz.code.matchAll(/right: (\d+)/g)].map(m => Number(m[1]));
      if (rights.length < 4) continue;   // the maths quiz makes its own
      expect(new Set(rights).size).toBeGreaterThanOrEqual(3);
    }
  });
});
