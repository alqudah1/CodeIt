import fs from 'fs';
import path from 'path';

// ── Every word readable ─────────────────────────────────────────────────────
//
// The colours come from ds.css itself, so changing a token re-runs the sums.
// The pairs are the ones the pages use: small grey labels on cream, paper
// and the quiet grey; orange as text; white on the deep blocks; ink on the
// bright ones. 4.5:1 is the WCAG AA line for normal-size text.

const css = fs.readFileSync(path.join(__dirname, 'ds.css'), 'utf8');
const token = (name) => {
  const m = css.match(new RegExp(`--ci-${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`no token --ci-${name}`);
  return m[1].trim();
};
const rgba = (v, under = [255, 255, 255]) => {
  let m = /^#([0-9a-f]{6})$/i.exec(v);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = /^rgba?\(([^)]+)\)$/.exec(v);
  const [r, g, b, a = 1] = m[1].split(',').map(Number);
  return [r, g, b].map((c, i) => Math.round(c * a + under[i] * (1 - a)));
};
const lum = ([r, g, b]) => {
  const f = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (fg, bg) => { const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x); return (a + 0.05) / (b + 0.05); };

const cream = rgba(token('cream'));
const paper = rgba(token('paper'));
const quiet = rgba(token('quiet'), cream);
const ink = rgba(token('ink'));
const white = [255, 255, 255];

test.each([
  ['grey labels on cream', rgba(token('ink-soft'), cream), cream],
  ['grey labels on paper', rgba(token('ink-soft'), paper), paper],
  ['grey labels on the quiet grey', rgba(token('ink-soft'), quiet), quiet],
  ['orange text on cream', rgba(token('orange-text')), cream],
  ['orange text on paper', rgba(token('orange-text')), paper],
  ['ink on the orange button', ink, rgba(token('orange'))],
  ['ink on sun', ink, rgba(token('sun'))],
  ['ink on mint', ink, rgba(token('mint'))],
  ['ink on coral', ink, rgba(token('coral'))],
  ['ink on sky', ink, rgba(token('sky'))],
  ['white on violet', white, rgba(token('violet'))],
  ['white on ink', white, ink],
  ['sun on the ink button', rgba(token('sun')), ink],
])('%s reads at 4.5:1 or better', (_, fg, bg) => {
  expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
});

test('the bright blocks really do take ink, not white', () => {
  for (const name of ['coral', 'mint', 'sky']) {
    expect(css).toMatch(new RegExp(`\\.ci-blk--${name} \\{[^}]*color: var\\(--ci-ink\\)`));
  }
  expect(css).toMatch(/\.ci-btn \{[^}]*background: var\(--ci-orange\); color: var\(--ci-ink\)/);
});
