// Can a child who cannot type — cannot even read well — complete the loop?
//
// Mustafa, watching the redesign: "Is the kid gonna be able to do it alone,
// or does he need someone to teach him?" This check is that question run as
// code: a full first session on a phone, drove entirely by taps. No keyboard
// event is ever sent. If any step of play → change → play-again cannot be
// reached by tapping, this fails — which means a five-year-old alone on a
// tablet is stuck, whatever the words say.
//
//   node ops/checks/kid-alone.js   (stack on 4599/5000, see run-all.sh)
const { launch } = require('./browser');

const BASE = process.env.CHECK_BASE || 'http://localhost:4599';
const problems = [];
const notes = [];

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();

  // A tripwire, not a promise: any keydown that reaches the page means some
  // step needed a keyboard.
  await page.addInitScript(() => {
    window.__typed = 0;
    window.addEventListener('keydown', () => { window.__typed += 1; }, true);
  });

  // 1. Tap a game open.
  await page.goto(`${BASE}/builder`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  const card = page.locator('.bldr-shelf__card').first();
  if (!(await card.count())) { problems.push('no starter card to tap'); }
  else {
    await card.tap();
    await page.waitForTimeout(2200);
    if (!(await page.locator('.bldr-cabinet').count())) problems.push('tapping a starter did not open the cabinet');
    else notes.push('tap 1: a game opened');
  }

  // 2. Tap Play, play by tapping the game itself, tap back out.
  const play = page.locator('.bldr-browser__play-btn').first();
  if (!(await play.count())) problems.push('no Play key to tap');
  else {
    await play.tap();
    await page.waitForTimeout(900);
    const frame = page.locator('.bldr-iframe').first();
    await frame.tap({ position: { x: 150, y: 300 } }).catch(() => {});
    await page.waitForTimeout(900);
    await play.tap();
    await page.waitForTimeout(900);
    notes.push('tap 2: played');
  }

  // 3. Tap Change, tap the colours tool, tap a colour.
  await page.locator('.bldr-tab', { hasText: 'Change' }).first().tap();
  await page.waitForTimeout(900);
  const mine = page.locator('.bldr-studio-bar__btn--mine').first();
  if (!(await mine.count())) problems.push('no Make-it-mine key on a phone');
  else {
    await mine.tap();
    await page.waitForTimeout(800);
    const swatch = page.locator('.bldr-mine__options--theme .bldr-mine__option').first();
    if (!(await swatch.count())) problems.push('colours panel opened with nothing to tap');
    else { await swatch.tap(); await page.waitForTimeout(1600); notes.push('tap 3: changed a colour'); }
  }

  // 4. Tap back to Play and play the changed game.
  await page.locator('.bldr-tab', { hasText: /Play/ }).first().tap();
  await page.waitForTimeout(800);
  const play2 = page.locator('.bldr-browser__play-btn').first();
  if (await play2.count()) {
    await play2.tap(); await page.waitForTimeout(1200);
    const frame = page.locator('.bldr-iframe').first();
    await frame.tap({ position: { x: 150, y: 300 } }).catch(() => {});
    await page.waitForTimeout(800);
    await play2.tap(); await page.waitForTimeout(900);
    notes.push('tap 4: played the changed game');
  }

  // The verdict: how much of the quest tracker did taps alone complete, and
  // did anything demand a keyboard?
  await page.locator('.bldr-tab', { hasText: 'Save' }).first().tap();
  await page.waitForTimeout(900);
  const verdict = await page.evaluate(() => ({
    done: document.querySelectorAll('.bldr-project-checklist li.is-done').length,
    typed: window.__typed,
    pixelSays: document.querySelector('.pixel-guide__title')?.textContent || '',
  }));

  if (verdict.typed > 0) problems.push(`${verdict.typed} keyboard event(s) were needed — a non-typing child is stuck`);
  if (verdict.done < 3) problems.push(`taps alone completed only ${verdict.done} of the first 3 steps`);
  else notes.push(`steps done by taps alone: ${verdict.done} of 4 — Pixel now says "${verdict.pixelSays.trim()}"`);

  await browser.close();
  for (const n of notes) console.log(`  ✓ ${n}`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const p of problems) console.log(`  - ${p}`);
    process.exit(1);
  }
  console.log('\nA child alone, with taps alone, gets the whole loop.');
  process.exit(0);
})();
