import fs from 'fs';
import path from 'path';

// ── The marketing pages wear adult clothes ───────────────────────────────────
//
// The child never sees the home page. They land in the studio or a lesson. The
// home page, /coding-for-kids, /pricing and the guides are read by the adult
// deciding whether to let them, and those pages had been dressed like the
// product: a mascot in the corner, sticker tiles in six colours, drawn browser
// windows holding invented projects, and counts that invite comparisons we
// lose. Inside the studio that is right. On the page where a parent decides
// whether this is a serious thing or a toy, it worked against us.
//
// The studio stays playful. These tests keep the marketing pages adult.
const read = (rel) => fs.readFileSync(path.join(__dirname, rel), 'utf8');
const strip = (src) => src.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const MARKETING = [
  'pages/Home/Home.js',
  'pages/SEO/CodingForKids.js',
  'pages/Pricing/Pricing.js',
  'pages/SEO/LearnPythonForKids.js',
  'pages/SEO/PythonGamesForKids.js',
  'pages/Blog/BlogPost.js',
  'pages/Guide/GuidePage.js',
];

describe('no mascot on a page a parent reads', () => {
  for (const file of MARKETING) {
    test(`${file} does not draw Pixel or the arcade stickers`, () => {
      let src;
      try { src = strip(read(file)); } catch { return; }
      expect(src).not.toMatch(/pixel-mascot|pixel-guide|ArcadeArt|CharacterSpotlight/);
    });
  }
});

describe('no drawn stand-in for a product that exists', () => {
  test('the home page carries no invented project', () => {
    const src = strip(read('pages/Home/Home.js'));
    for (const invented of ['Lightning Tap', 'Mission Control Quiz', 'Maya Makes Things', 'project.js', 'celebrate(score)']) {
      expect(src).not.toContain(invented);
    }
  });

  test('/coding-for-kids carries no invented quiz', () => {
    const src = strip(read('pages/SEO/CodingForKids.js'));
    expect(src).not.toContain('My space quiz');
    expect(src).not.toContain('shortest day');
    // What replaced it can only ever show projects that exist.
    expect(src).toContain('<RecentProjects />');
  });
});

describe('claims, not counts', () => {
  test('the home page does not count its lessons or projects', () => {
    const src = strip(read('pages/Home/Home.js'));
    expect(src).not.toMatch(/TOTAL_LESSONS/);
    expect(src).not.toMatch(/STARTER_PROJECTS\.length/);
    expect(src).toContain('Beginner Python, from');
  });
});

describe('one line per page at display size', () => {
  test('the home page h2s are headings, not posters', () => {
    const css = read('pages/Home/Home.css');
    const block = css.slice(css.indexOf('Marketing pages wear adult clothes'));
    expect(block).toMatch(/\.studio-home \.studio-section-heading h2[\s\S]*?font-size: clamp\(1\.45rem/);
  });
});
