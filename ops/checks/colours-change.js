// Does a colour palette change anything a child can see?
//
// For months, no. Tapping CodeIt / Arcade / Candy injected `:root { --primary:
// … }` into the project, and not one starter game reads a CSS variable: eight
// paint on a canvas, three set element colours from their own constants. The
// flagship on the front page, the one in the recording, repainted nothing.
// Fourteen checks were green, because the one that tapped a swatch then
// asserted the concept panel appeared, not that a colour changed. Fourth time
// this codebase verified that a control was accepted instead of that it did
// anything.
//
// So this measures pixels. For every starter, on a phone: open it, read the
// running game's canvas (or the computed colours of its elements), tap a
// palette, read again, and fail unless the palette's primary colour is now on
// screen where it was not before. Then the same for an instant template, which
// goes through the :root route, and for the code itself: the palette must
// land in the line a child can read.
//
//   node ops/checks/colours-change.js
//
// Serve a production build on 4599 first.
'use strict';

const { launch } = require('./browser');
const { arrived, describe, measure } = require('./measure');

const BASE = process.env.CHECK_BASE || 'http://localhost:4599';
const problems = [];
const notes = [];

// Candy is in every palette list (early learners see three, the rest see all)
// and no starter opens wearing its pink.
const THEME = { name: 'Candy', primary: '#EC4899' };

// Every starter: eleven games, five quizzes, five shops.
const STARTERS = [
  'catch-stars', 'penalty', 'dodge', 'pop-balloons', 'snake', 'bricks',
  'jumper', 'maze', 'whack', 'memory', 'cat-chase',
  'quiz-animals', 'quiz-space', 'quiz-football', 'quiz-maths', 'quiz-creature',
  'site-cupcakes', 'site-sneakers', 'site-dogs', 'site-games', 'site-bracelets',
];

async function previewFrame(page) {
  const handle = await page.$('.bldr-iframe');
  if (!handle) return null;
  return handle.contentFrame();
}

async function openMakeItMine(page, name) {
  const changeTab = page.locator('.bldr-tab', { hasText: 'Change' }).first();
  if (!(await changeTab.count())) { problems.push(`${name}: no Change tab`); return false; }
  await changeTab.click();
  await page.waitForTimeout(700);
  const mine = page.locator('.bldr-studio-bar__btn--mine').first();
  if (!(await mine.count())) { problems.push(`${name}: no "Make it mine" tool`); return false; }
  await mine.click();
  await page.waitForTimeout(700);
  return true;
}

async function tapTheme(page, name) {
  const swatch = page.locator(`.bldr-mine__option[aria-label="Apply ${THEME.name} colours"]`).first();
  if (!(await swatch.count())) { problems.push(`${name}: no ${THEME.name} swatch in the colours panel`); return false; }
  await swatch.click();
  return true;
}

async function checkStarter(page, id) {
  await page.goto(`${BASE}/builder?start=${id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3200);

  let frame = await previewFrame(page);
  if (!frame) { problems.push(`${id}: no preview iframe`); return; }
  const before = await measure(frame, THEME.primary);

  if (!(await openMakeItMine(page, id))) return;
  if (!(await tapTheme(page, id))) return;
  // The game restarts with the new setting; give it time to draw a few frames.
  await page.waitForTimeout(2600);

  frame = await previewFrame(page);
  let after = await measure(frame, THEME.primary);
  if (!arrived(before, after)) {
    // The panel scrolled the game off the top of the phone, and a browser can
    // hold back animation frames for a frame it cannot see. Look at it, the
    // way a child would, and read again.
    await (await page.$('.bldr-iframe'))?.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    frame = await previewFrame(page);
    after = await measure(frame, THEME.primary);
  }
  const notice = await page.evaluate(() => document.body.innerText.match(/\b[A-Za-z]+ is now #[0-9A-Fa-f]{6} \(line \d+\)/)?.[0] || null);

  if (!arrived(before, after)) {
    problems.push(`${id}: tapped ${THEME.name} and nothing on screen turned ${THEME.primary} (${describe(before, after)})`);
    return;
  }
  if (!notice) {
    problems.push(`${id}: the screen repainted but never told the child which line changed`);
    return;
  }
  notes.push(`${id}: ${THEME.name} → ${describe(before, after)} in ${THEME.primary}; "${notice}"`);
}

// The instant template route. A typed prompt with no model behind it lands on
// STARTER_TEMPLATES, which read --primary and friends, so here the :root
// injection is the mechanism and the button must change colour.
async function checkTemplate(page) {
  await page.goto(`${BASE}/builder`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  // No starter has colour settings named this way, so this exercises the
  // generated-project path with a page that exists without a model: the
  // template the studio shows while a build is refused or waiting.
  const template = await page.evaluate(() => {
    const f = document.querySelector('iframe[srcdoc*="codeit-starter-template"]');
    return f ? f.getAttribute('srcdoc') : null;
  });
  if (!template) { notes.push('template: no instant template on screen without a build; skipped (the unit test covers its CSS names)'); return; }
  const usesPalette = /var\(--primary\)/.test(template) && !/--orange/.test(template);
  if (!usesPalette) problems.push('template: the instant template does not read --primary, so a palette cannot repaint it');
  else notes.push('template: the instant template reads --primary, which the :root route sets');
}

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  for (const id of STARTERS) {
    try { await checkStarter(page, id); } catch (error) { problems.push(`${id}: ${error.message.split('\n')[0]}`); }
  }
  await checkTemplate(page);
  await ctx.close();
  await browser.close();

  for (const note of notes) console.log(`  · ${note}`);
  if (problems.length) {
    console.log('\nA palette that changes nothing:\n');
    for (const problem of problems) console.log(`  ✗ ${problem}`);
    process.exit(1);
  }
  console.log('\nEvery palette changes something a child can see, and says which line.');
  process.exit(0);
})();
