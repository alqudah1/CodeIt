import fs from 'fs';
import path from 'path';

// ── The same sums, for the dark half ────────────────────────────────────────
//
// contrast.test.js covers ds.css, which is the light theme the parent pages
// keep. night.css is a second palette and had no equivalent, so the colours
// every converted child screen is built from were not being checked at all.
//
// That matters now rather than later: Home, the lesson map and the studio are
// converted, and Explore, Arcade, Me, login, register, the certificate and the
// quiz are still to come. A token that reads badly is cheap to change today
// and seven pages wide next week.
//
// Found on the first run: coral on the raised surface came to 4.42:1, just
// under the line, and coral is the colour the design note gives to streaks
// and errors. An error message is exactly the text that has to be readable at
// normal size. #FF708E is one percent lighter at the same hue and saturation
// and clears it at 4.56.
//
// 4.5:1 is the WCAG AA line for normal-size text. The accents are tested as
// text because that is how the design note uses them: XP numbers, "done",
// streak counts, error lines.

const css = fs.readFileSync(path.join(__dirname, 'night.css'), 'utf8');

const token = (name) => {
  const m = css.match(new RegExp(`--n-${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`no token --n-${name}`);
  return m[1].trim();
};

const rgba = (value, under = [0, 0, 0]) => {
  let m = /^#([0-9a-f]{6})$/i.exec(value);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = /^rgba?\(([^)]+)\)$/.exec(value);
  if (!m) throw new Error(`cannot read colour ${value}`);
  const [r, g, b, a = 1] = m[1].split(',').map(Number);
  return [r, g, b].map((c, i) => Math.round(c * a + under[i] * (1 - a)));
};

const lum = ([r, g, b]) => {
  const f = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (fg, bg) => { const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x); return (a + 0.05) / (b + 0.05); };

const bg = rgba(token('bg'));
const bg2 = rgba(token('bg-2'));
const surface = rgba(token('surface'));
const surface2 = rgba(token('surface-2'));
const deep = rgba(token('deep'));

// Every surface a page can put text on, named the way the design note names them.
const SURFACES = [
  ['the base', bg],
  ['the second base', bg2],
  ['a card', surface],
  ['a raised card', surface2],
  ['a deep well', deep],
];

// Every colour the note gives a job that involves reading it.
const INK = [
  ['body text', () => rgba(token('text'))],
  ['muted text', (under) => rgba(token('muted'), under)],
  ['orange', () => rgba(token('orange'))],
  ['sun', () => rgba(token('sun'))],
  ['mint', () => rgba(token('mint'))],
  ['sky', () => rgba(token('sky'))],
  ['coral', () => rgba(token('coral'))],
];

const cases = [];
for (const [surfaceName, surfaceRgb] of SURFACES) {
  for (const [inkName, ink] of INK) {
    cases.push([`${inkName} on ${surfaceName}`, ink(surfaceRgb), surfaceRgb]);
  }
}

test.each(cases)('%s reads at 4.5:1 or better', (_, fg, surfaceRgb) => {
  expect(ratio(fg, surfaceRgb)).toBeGreaterThanOrEqual(4.5);
});

test('the orange button takes dark text, and that pair reads', () => {
  // The one light on the screen, so the one pair that cannot be got wrong.
  const orange = rgba(token('orange'));
  const onOrange = css.match(/--n-on-orange:\s*([^;]+);/);
  const darkText = onOrange ? rgba(onOrange[1].trim()) : [26, 19, 0];
  expect(ratio(darkText, orange)).toBeGreaterThanOrEqual(4.5);
  expect(lum(darkText)).toBeLessThan(lum(orange));
});

test('nothing in the night palette is a pure black or a pure white', () => {
  // Both are what a flat dark theme looks like, and the note asks for an
  // ocean. This is a style rule rather than a legibility one, and it is here
  // because it is the first thing that slips when a new page is added in a
  // hurry.
  for (const name of ['bg', 'bg-2', 'surface', 'surface-2', 'deep', 'text']) {
    const value = token(name);
    expect(value.toLowerCase()).not.toBe('#000000');
    expect(value.toLowerCase()).not.toBe('#ffffff');
  }
});
