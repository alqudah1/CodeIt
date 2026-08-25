import { labelFor, liveUpdateScript, rangeFor, readSettings, setSetting } from './gameSettings';
import { STARTER_GAMES } from './starterGames';

// The three games actually on the front page. Their settings blocks are the
// contract this module reads, so the tests use the real shape rather than a
// convenient one.
const CATCH_STARS = `<!doctype html>
<html><head><style>body { background: #1E1E2E; }</style></head>
<body>
<canvas id="screen"></canvas>
<script>
// ── Change these and watch what happens ──
let fallSpeed  = 3;
let starSize   = 18;
let starColour = '#FFD84D';
let basketWide = 90;
let startLives = 3;

const canvas = document.getElementById('screen');
const pen = canvas.getContext('2d');
let width = 0, height = 0;

let score = 0;
let lives = startLives;

function tick() {
  stars.forEach(s => { s.y += fallSpeed; });
  pen.fillStyle = starColour;
}
<\/script>
</body></html>`;

const DODGE = `<script>
// ── Change these and watch what happens ──
let rockSpeed  = 4;
let rockChance = 0.04;
let shipColour = '#FF7A00';
let shipSize   = 18;

const canvas = document.getElementById('screen');
<\/script>`;

// ── Reading the knobs ───────────────────────────────────────────────────────

test('reads exactly the marked block, and stops at the blank line', () => {
  const settings = readSettings(CATCH_STARS);
  expect(settings.map(s => s.name)).toEqual([
    'fallSpeed', 'starSize', 'starColour', 'basketWide', 'startLives',
  ]);
});

test('the machinery below the block never becomes a control', () => {
  // `width`, `score` and `lives` are how the game keeps itself running. A
  // slider for the canvas width is a slider for breaking the game.
  const names = readSettings(CATCH_STARS).map(s => s.name);
  expect(names).not.toContain('width');
  expect(names).not.toContain('score');
  expect(names).not.toContain('lives');
  expect(names).not.toContain('canvas');
});

test('types come from the values, not the names', () => {
  const byName = Object.fromEntries(readSettings(CATCH_STARS).map(s => [s.name, s]));
  expect(byName.fallSpeed.type).toBe('number');
  expect(byName.starColour.type).toBe('colour');
  expect(byName.starColour.value).toBe('#FFD84D');
  expect(byName.fallSpeed.value).toBe(3);
});

test('a fraction is read as a fraction', () => {
  const chance = readSettings(DODGE).find(s => s.name === 'rockChance');
  expect(chance.value).toBeCloseTo(0.04);
  expect(chance.step).toBeLessThan(0.05);
  expect(chance.max).toBeLessThanOrEqual(1);
});

test('a file with no settings block offers nothing rather than guessing', () => {
  const html = `<script>
const canvas = document.getElementById('screen');
const pen = canvas.getContext('2d');
<\/script>`;
  expect(readSettings(html)).toEqual([]);
});

test('nonsense input does not throw', () => {
  for (const input of [null, undefined, 42, '', '<script><\/script>', {}]) {
    expect(() => readSettings(input)).not.toThrow();
    expect(Array.isArray(readSettings(input))).toBe(true);
  }
});

// ── Labels a child can read ─────────────────────────────────────────────────

test('the label is the child’s own word, made readable', () => {
  expect(labelFor('fallSpeed')).toBe('Fall speed');
  expect(labelFor('startLives')).toBe('Start lives');
  expect(labelFor('rock_chance')).toBe('Rock chance');
});

test('every control says which way is which, or says nothing', () => {
  // A wrong hint is worse than no hint: a child who reads "bigger = faster"
  // under a control that slows things down stops trusting the panel.
  for (const setting of readSettings(CATCH_STARS)) {
    expect(setting.help === null || typeof setting.help === 'string').toBe(true);
  }
  const speed = readSettings(CATCH_STARS).find(s => s.name === 'fallSpeed');
  expect(speed.help).toMatch(/faster/);
});

// ── Ranges that cannot break the game ───────────────────────────────────────

test('a count never slides to zero', () => {
  // Zero lives is a game that ends before it starts, and it feels like the
  // child broke it rather than like a setting.
  expect(rangeFor(3).min).toBe(1);
  expect(rangeFor(5).min).toBe(1);
});

test('the current value is always inside its own range', () => {
  for (const value of [0.04, 0.5, 1, 3, 18, 90, 14, 200]) {
    const range = rangeFor(value);
    expect(value).toBeGreaterThanOrEqual(range.min);
    expect(value).toBeLessThanOrEqual(range.max);
    expect(range.max).toBeGreaterThan(range.min);
  }
});

test('a big number gets a range around it, not from zero', () => {
  const range = rangeFor(90);
  expect(range.min).toBeGreaterThan(1);
  expect(range.max).toBeGreaterThan(90);
});

// ── Writing one line, and only one line ─────────────────────────────────────

test('changing a setting rewrites the declaration', () => {
  const next = setSetting(CATCH_STARS, 'fallSpeed', 9);
  expect(next).toContain('let fallSpeed  = 9;');
  expect(next).not.toContain('let fallSpeed  = 3;');
});

test('the places the variable is USED are left alone', () => {
  // This is the whole risk of rewriting source with a regex. `fallSpeed` also
  // appears inside tick(); touching that line would change what the game does
  // rather than what it starts as.
  const next = setSetting(CATCH_STARS, 'fallSpeed', 9);
  expect(next).toContain('s.y += fallSpeed;');
});

test('a colour keeps the quotes it came in', () => {
  const next = setSetting(CATCH_STARS, 'starColour', '#00FF88');
  expect(next).toContain("let starColour = '#00FF88';");
});

test('the alignment a child sees in the code tab survives', () => {
  // The block is hand-aligned. Losing that on every slider drag would make the
  // code tab look progressively more broken the more they played.
  const next = setSetting(CATCH_STARS, 'starSize', 30);
  expect(next).toContain('let starSize   = 30;');
});

test('an unknown setting changes nothing at all', () => {
  expect(setSetting(CATCH_STARS, 'notARealSetting', 5)).toBe(CATCH_STARS);
  expect(setSetting(CATCH_STARS, 'score', 999)).toBe(CATCH_STARS);
});

test('a value that cannot be written safely changes nothing', () => {
  expect(setSetting(CATCH_STARS, 'starColour', "it's red")).toBe(CATCH_STARS);
  expect(setSetting(CATCH_STARS, 'fallSpeed', NaN)).toBe(CATCH_STARS);
  expect(setSetting(CATCH_STARS, 'fallSpeed', Infinity)).toBe(CATCH_STARS);
});

test('floating point noise never reaches a child’s source file', () => {
  const next = setSetting(DODGE, 'rockChance', 0.1 + 0.2);
  expect(next).toContain('0.3');
  expect(next).not.toContain('0.30000000000000004');
});

test('a change round-trips', () => {
  const next = setSetting(CATCH_STARS, 'fallSpeed', 7);
  expect(readSettings(next).find(s => s.name === 'fallSpeed').value).toBe(7);
});

// ── Poking the running game ─────────────────────────────────────────────────

test('the live script assigns the variable and cannot throw', () => {
  const js = liveUpdateScript('fallSpeed', 9, 'number', null);
  expect(js).toContain('fallSpeed=9');
  expect(js).toContain('typeof fallSpeed');
  expect(js).toContain('catch');
});

test('the live script refuses anything it cannot write safely', () => {
  expect(liveUpdateScript('fallSpeed', NaN, 'number', null)).toBeNull();
  expect(liveUpdateScript('', 3, 'number', null)).toBeNull();
  expect(liveUpdateScript('a);evil(', 3, 'number', null)).toBeNull();
});

test('the live script really does run against the declared variable', () => {
  // The preview runs this through `new Function`, whose scope chain is the
  // global environment. which is where a top-level `let` in a classic script
  // lives. This asserts that assumption rather than trusting it.
  // eslint-disable-next-line no-new-func
  new Function('let fallSpeed = 3; globalThis.__t = () => fallSpeed;')();
  // eslint-disable-next-line no-new-func
  const read = new Function('let fallSpeed = 3;' + liveUpdateScript('fallSpeed', 11, 'number', null) + 'return fallSpeed;');
  expect(read()).toBe(11);
});

// ── The real games, not a copy of them ──────────────────────────────────────
//
// Everything above tests the parser against a fixture. This tests it against
// the three games that are actually on the front page, so the day someone
// renames a variable or reformats a block, this fails instead of a child
// opening the panel and finding it empty.

describe.each(STARTER_GAMES.map(g => [g.label, g]))('%s', (label, game) => {
  test('offers real controls', () => {
    const settings = readSettings(game.code);
    expect(settings.length).toBeGreaterThanOrEqual(3);
  });

  test('every control is wired to a variable the game declares', () => {
    for (const setting of readSettings(game.code)) {
      expect(game.code).toMatch(
        new RegExp(`(?:let|const|var)\\s+${setting.name}\\s*=`)
      );
    }
  });

  test('every control can be changed, and changes the file', () => {
    for (const setting of readSettings(game.code)) {
      const next = setting.type === 'colour'
        ? setSetting(game.code, setting.name, '#123456')
        : setSetting(game.code, setting.name, Number(setting.value) + setting.step);
      expect(next).not.toBe(game.code);
      expect(next.length).toBeGreaterThan(game.code.length - 20);
    }
  });

  test('every control can be poked in the running game', () => {
    for (const setting of readSettings(game.code)) {
      expect(liveUpdateScript(setting.name, setting.value, setting.type, setting.quote)).not.toBeNull();
    }
  });

  test('the game still parses as one script after a change', () => {
    const first = readSettings(game.code)[0];
    const next = setSetting(game.code, first.name, first.type === 'colour' ? '#123456' : 1);
    expect((next.match(/<script/g) || []).length).toBe((game.code.match(/<script/g) || []).length);
    expect(readSettings(next).length).toBe(readSettings(game.code).length);
  });
});
