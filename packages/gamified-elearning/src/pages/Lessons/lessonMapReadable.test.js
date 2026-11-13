// The lesson map is the screen a child looks at most, and it is the screen
// that kept failing two checks for a week: 140 pieces of text under the 13px
// floor and the only serious contrast violation axe has ever reported here.
//
// Both came back more than once, because the map is laid out in pixels and
// every new plate, tag and chip was written at whatever size looked tidy in a
// screenshot. These two tests pin the rules instead of the sizes, so the next
// person to add a chip finds out from a failing test rather than from a
// readable-check run ten minutes before a push.

import fs from 'node:fs';
import path from 'node:path';

const css = fs.readFileSync(path.join(__dirname, 'LessonMap.css'), 'utf8');

/** The project's floor: below this a seven-year-old is guessing. */
const FLOOR_PX = 13;
const ROOT_PX = 16;

/** Every font-size this stylesheet declares, in px, with the line it is on. */
function declaredSizes(source) {
  const out = [];
  source.split('\n').forEach((line, i) => {
    // clamp() and vw sizes are measured in the browser by readable-check, not
    // here: this test only judges the fixed ones it can judge honestly.
    if (/font-size:\s*clamp\(/.test(line)) return;
    for (const m of line.matchAll(/font-size:\s*([\d.]+)(rem|px|em)/g)) {
      const value = Number(m[1]);
      out.push({ line: i + 1, px: m[2] === 'px' ? value : value * ROOT_PX, text: line.trim() });
    }
  });
  return out;
}

test('nothing on the lesson map is written below the readable floor', () => {
  const tooSmall = declaredSizes(css).filter(d => d.px < FLOOR_PX);
  expect(tooSmall.map(d => `line ${d.line}: ${d.px}px — ${d.text}`)).toEqual([]);
});

// ── Contrast ───────────────────────────────────────────────────────────────
// The pairs that failed, kept as pairs. Orange is this product's one light and
// it is a background for ink, never a background for white: white on #FF7A00
// is 2.61:1, which axe calls serious and which no child reads in sunlight.

const luminance = (hex) => {
  const parts = hex.replace('#', '').match(/../g).map(h => parseInt(h, 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** The declared value of one property inside one rule, as written. */
function valueIn(selector, property) {
  const rule = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`);
  const body = css.match(rule);
  if (!body) throw new Error(`${selector} is not in LessonMap.css any more`);
  const found = body[1].match(new RegExp(`(?:^|[;\\s])${property}:\\s*([^;]+)`));
  if (!found) throw new Error(`${selector} no longer declares ${property}`);
  return found[1].trim();
}

/** The hex a declaration resolves to, following one var() fallback. */
function hexOf(value) {
  const fallback = value.match(/var\([^,]+,\s*(#[0-9A-Fa-f]{6})\s*\)/);
  const direct = value.match(/#[0-9A-Fa-f]{6}/);
  const hex = fallback ? fallback[1] : direct && direct[0];
  if (!hex) throw new Error(`no colour in "${value}"`);
  return hex;
}

test.each([
  ['.lm-you__flag', 'color', 'background', 'the YOU flag'],
  ['.lm-xp--ahead', 'color', 'background', 'the XP tag on a stop ahead'],
  ['.lm-name--ahead', 'color', 'background', 'the name plate on a stop ahead'],
])('%s clears 4.5:1 (%s)', (selector, fg, bg, _what) => {
  expect(ratio(hexOf(valueIn(selector, fg)), hexOf(valueIn(selector, bg))))
    .toBeGreaterThanOrEqual(4.5);
});

test('the lesson number in the bubble is not set in the brand orange itself', () => {
  // #FF7A00 on paper is 2.56:1. The darker --arc-orange-text exists for text.
  const colour = hexOf(valueIn('.lm-label__num', 'color'));
  expect(ratio(colour, '#FFFDF7')).toBeGreaterThanOrEqual(4.5);
});
