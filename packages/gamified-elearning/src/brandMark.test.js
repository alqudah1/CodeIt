import fs from 'fs';
import path from 'path';

// ── The mark has to work at 32 pixels ────────────────────────────────────────
//
// The favicon and the apple-touch-icon both pointed at codeit-logo-trimmed.png:
// the full wordmark, 984 by 654, with the words "you code" set inside the blob.
// A browser squashed that to 16 or 32 pixels and drew a smudge, and the tab
// icon is the single piece of brand a person sees on every visit, in every tab,
// forever.
//
// There was already a small mark in the repo, unused by anything.
const PUBLIC = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'manifest.json'), 'utf8'));

describe('the brand mark at small sizes', () => {
  test('the tab icon is the mark, not the wordmark', () => {
    const iconTags = [...html.matchAll(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g)].map(m => m[0]);
    expect(iconTags.length).toBeGreaterThanOrEqual(3);
    for (const tag of iconTags) {
      expect(tag).not.toMatch(/codeit-logo-trimmed|LogoForSM|logo-main/);
    }
  });

  test('an SVG icon is offered, so the mark stays crisp at any size', () => {
    expect(html).toMatch(/rel="icon"[^>]*type="image\/svg\+xml"/);
  });

  test('an iPhone home screen gets a real 180px icon', () => {
    expect(html).toMatch(/apple-touch-icon"[^>]*sizes="180x180"/);
    const stat = fs.statSync(path.join(PUBLIC, 'apple-touch-icon.png'));
    expect(stat.size).toBeGreaterThan(1000);
  });

  test('the installed app uses the mark too', () => {
    for (const icon of manifest.icons) {
      expect(icon.src).not.toMatch(/codeit-logo-trimmed/);
    }
    expect(manifest.icons.some(i => i.sizes === '512x512')).toBe(true);
  });

  test('the mark is drawn in the palette the rest of the interface uses', () => {
    const svg = fs.readFileSync(path.join(PUBLIC, 'brand', 'favicon.svg'), 'utf8');
    expect(svg).toContain('#F87824');
    expect(svg).toContain('#35220E');
    expect(svg).toContain('#FED340');
    expect(svg).not.toContain('#FF7959');
  });
});
