// What outside checkers found, held in place.
//
// 13 November 2026: the live site was run through PageSpeed Insights (the
// home page and lesson 1, as a phone) and Lighthouse. These are the things
// they reported that were ours to fix.
import fs from 'fs';
import path from 'path';
import React from 'react';
import { render } from '@testing-library/react';
import BrandLogo from './components/BrandLogo/BrandLogo';

const ROOT = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), 'utf8');

test('robots.txt holds only lines a crawler understands', () => {
  // "LLM-Content:" was reported as an unknown directive, which marks the
  // whole file invalid.
  const known = /^(user-agent|allow|disallow|sitemap|crawl-delay|host):/i;
  const odd = read('public', 'robots.txt').split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#') && !known.test(line));
  expect(odd).toEqual([]);
});

test('llms.txt is a Markdown file with a title and links, and so are the guides added to it', () => {
  const text = read('public', 'llms.txt');
  expect(text.startsWith('# ')).toBe(true);
  expect((text.match(/^- \[[^\]]+\]\(https:\/\/codeitlearn\.com\/[^)]*\)/gm) || []).length).toBeGreaterThanOrEqual(10);
  expect(read('scripts', 'generate-static-seo.js')).toContain('`- [${guide.h1}](${SITE}/guide/${guide.slug})'); // eslint-disable-line no-template-curly-in-string
});

test('the logo is sent at the size it is shown, and holds its place before it arrives', () => {
  const { container } = render(<BrandLogo />);
  const img = container.querySelector('img');
  expect(img.getAttribute('src')).toBe('/brand/codeit-logo-512.png');
  expect(img.getAttribute('width')).toBe('512');
  expect(img.getAttribute('height')).toBe('340');
  expect(fs.statSync(path.join(ROOT, 'public', 'brand', 'codeit-logo-512.png')).size).toBeLessThan(20000);
  // The page asks for the same file early; asking for a different one would fetch two.
  expect(read('public', 'index.html')).toContain('rel="preload" as="image" href="%PUBLIC_URL%/brand/codeit-logo-512.png"');
});

test('the Run button is dark ink on orange, not white on orange', () => {
  // White on #ff7624 is 2.66 to 1. The button a child has to find must pass 4.5.
  const css = read('src', 'components', 'CodeRunnerPython.css');
  const rule = /\.cr-btn--run \{([^}]*)\}/.exec(css)[1];
  expect(rule).toMatch(/background: #ff7624/);
  expect(rule).not.toMatch(/color: #fff\b/);
  const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const ink = /(?:^|[\s;])color: (#[0-9a-f]{6})/.exec(rule)[1];
  expect(ratio(ink, '#ff7624')).toBeGreaterThan(4.5);
  const label = /\.cr-output-label \{[^}]*?[\s;]color: (#[0-9a-f]{6})/.exec(css)[1];
  expect(ratio(label, '#fff8f1')).toBeGreaterThan(4.5);
});

test('a lesson has a main landmark, and "Skip to content" has somewhere to go', () => {
  expect(read('src', 'components', 'InteractiveLessonTemplate', 'InteractiveLessonTemplate.js')).toContain('<div className="sl-body" role="main" id="main">');
  const header = read('src', 'pages', 'Header', 'Header.js');
  expect(header).toContain('href="#main"');
  expect(header).toContain("main.id = 'main'");
});

test('the code editors say what they are to a screen reader', () => {
  expect(read('src', 'components', 'PythonEditor.js')).toContain("contentAttributes.of({ 'aria-label': 'Your code' })");
  expect(read('src', 'components', 'PlainEditor.js')).toContain("label = 'Your code'");
});

test('a phone on its side: the guide does not sit on the Run button', () => {
  const css = read('src', 'components', 'InteractiveLessonTemplate', 'LessonStage.css');
  expect(css).toMatch(/@media \(max-height: 480px\) \{[^@]*\.sl-lesson--staged \.lg-wrap \{ display: none; \}/);
});
