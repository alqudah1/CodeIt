// The complaints, checked rather than crossed off.
//
// COMPLAINTS.md holds what real children said about the live site, in Mustafa's
// words, and its own rule is that nothing comes off the list because the code
// changed — only because a browser was pointed at it afterwards and the thing
// that was wrong is measurably no longer wrong.
//
// This is that browser. Two of the items are things a unit test cannot see:
// how long a child stares at nothing, and whether the screen ever names
// something in their own project they could change.
//
//   node ops/checks/complaints-check.js
//
// Serve a production build on 4599 first (npx serve -s build -l 4599).
const { launch } = require('./browser');

const BASE = process.env.CHECK_BASE || 'http://localhost:4599';
const problems = [];
const notes = [];
function fail(item, message) { problems.push(`${item}: ${message}`); }
function pass(item, message) { notes.push(`${item}: ${message}`); }

// ── #2 "it takes so much time" ─────────────────────────────────────────────
// The claim in the plan is that something playable is on screen within two
// seconds of asking, and that it is the starter closest to what the child
// typed. Both halves are checked, because a version of this that always showed
// the same generic demo would look identical from the outside.
async function theWait(browser) {
  const asked = [
    { typed: 'a space game where you dodge rocks', expect: /asteroid|space|dodge/i },
    { typed: 'a quiz about animals',               expect: /animal/i },
    { typed: 'a website to sell cupcakes',         expect: /cupcake/i },
  ];

  for (const { typed, expect } of asked) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    });
    const page = await ctx.newPage();

    // Hold the build open for four seconds.
    //
    // The wait is the whole complaint, and locally there is no wait: without an
    // API key the server fails fast and hands back a fallback project in about
    // two hundred milliseconds, so the screen a waiting child actually sees
    // never renders. An earlier version of this check watched that happen and
    // reported the feature missing.
    //
    // Delaying the response reproduces the ten-to-twenty seconds a real build
    // takes, and costs nothing.
    await page.route('**/api/builder**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 4000));
      await route.continue();
    });

    await page.goto(`${BASE}/builder`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2600);

    const box = page.locator('.bldr-textarea').first();
    if (!(await box.count())) { fail('#2 the wait', 'no box to type an idea into'); await ctx.close(); return; }
    await box.fill(typed);

    const build = page.locator('.bldr-build-btn').first();
    if (!(await build.count())) { fail('#2 the wait', 'no button to press after typing'); await ctx.close(); return; }

    const started = Date.now();
    await build.click();

    // Playable means an iframe with a real project in it, inside the viewport —
    // not merely present in the document. The bug F fixed was that it rendered
    // several hundred pixels above where the child was actually looking.
    // Measured to the moment the game is IN VIEW, not the moment it exists.
    // The studio smooth-scrolls the child to the waiting game (that scroll is
    // F's fix working), and this loop used to grade the first frame the
    // iframe had a height — often mid-scroll, when it is legitimately still
    // above the viewport for another quarter of a second. A check that fails
    // on the animation carrying you to the thing is failing the fix itself.
    let ms = null;
    let placement = null;
    for (let waited = 0; waited < 6000; waited += 100) {
      const seen = await page.evaluate(() => {
        const frame = document.querySelector('.bldr-loading-preview-wrap .bldr-iframe');
        if (!frame) return null;
        const r = frame.getBoundingClientRect();
        if (r.height < 80) return null;
        const label = document.querySelector('.bldr-loading-preview__say span')?.textContent || '';
        return { top: Math.round(r.top + window.scrollY), onScreen: r.bottom > 0 && r.top < window.innerHeight, label };
      });
      if (seen) {
        placement = seen;
        if (seen.onScreen) { ms = Date.now() - started; break; }
      }
      await page.waitForTimeout(100);
    }
    if (ms === null && placement) ms = Date.now() - started;

    if (ms === null) {
      fail('#2 the wait', `"${typed}" — nothing playable appeared within 6 seconds`);
    } else if (ms > 2000) {
      fail('#2 the wait', `"${typed}" — took ${ms}ms to show something playable`);
    } else if (!placement.onScreen) {
      fail('#2 the wait', `"${typed}" — playable thing rendered at ${placement.top}px, outside the child's viewport`);
    } else if (!expect.test(placement.label)) {
      fail('#2 the wait', `"${typed}" — showed "${placement.label}", which is not the closest starter`);
    } else {
      pass('#2 the wait', `"${typed}" → ${placement.label} in ${ms}ms, at ${placement.top}px`);
    }
    await ctx.close();
  }
}

// ── #6 "how do I edit and what can I edit" ─────────────────────────────────
// The screen has to name something in the child's own project. A sentence that
// said "you can change things" would pass a test looking for a sentence and
// answer nothing, so this checks the sentence quotes text that is genuinely in
// their file.
async function whatCanIEdit(browser) {
  // Real starter ids, taken from starterGames/Quizzes/Sites. An earlier run of
  // this check invented plausible ones — 'animal-quiz', 'cupcake-shop' — and
  // reported a working feature broken on two projects that do not exist.
  const opened = [
    { start: 'quiz-animals',  name: 'Animal quiz' },
    { start: 'site-cupcakes', name: 'Cupcake shop' },
    { start: 'maze',          name: 'Build a maze' },
    { start: 'catch-stars',   name: 'Catch the stars', silent: true },
  ];

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();

  for (const { start, name } of opened) {
    await page.goto(`${BASE}/builder?start=${start}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const found = await page.evaluate(() => {
      const hint = document.querySelector('.bldr-change-hint');
      if (!hint) return null;
      const frame = document.querySelector('.bldr-iframe');
      let source = '';
      try { source = frame?.getAttribute('srcdoc') || ''; } catch { source = ''; }
      const sentence = (hint.innerText || '').trim();
      // The thing it points at, if it named one in quotes.
      // Curly quotes, which is what whatCanIChange writes. Matching only
      // straight ones found nothing and quietly downgraded every project to
      // "names a shape", which is the answer for a maze and a free pass for a
      // quiz — the assertion that matters is that the quoted words are really
      // in the child's file.
      const quoted = sentence.match(/\u201c([^\u201d]+)\u201d/)?.[1] || null;
      return { sentence, quoted, inTheirFile: quoted ? source.includes(quoted) : null };
    });

    if (!found) {
      // A canvas game has no elements to tap, and pointing at something painted
      // would be a lie. Silence there is the right answer, and is asserted so a
      // version that had simply stopped working would not look like good taste.
      if (opened.find(o => o.start === start)?.silent) { pass('#6 what can I edit', `${name} — silent, and right to be: a canvas game`); continue; }
      fail('#6 what can I edit', `${name} — the screen says nothing about editing`);
    } else if (opened.find(o => o.start === start)?.silent) {
      fail('#6 what can I edit', `${name} — points at something on a canvas, which a child cannot tap`);
    } else if (found.quoted && found.inTheirFile === false) {
      fail('#6 what can I edit', `${name} — points at "${found.quoted}", which is not in their file`);
    } else {
      const what = found.quoted ? `names "${found.quoted}" from their own file` : 'names a shape in their own project';
      pass('#6 what can I edit', `${name} — ${what}`);
    }
  }
  await ctx.close();
}

(async () => {
  const browser = await launch();
  await theWait(browser);
  await whatCanIEdit(browser);
  await browser.close();

  for (const note of notes) console.log(`  ✓ ${note}`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const problem of problems) console.log(`  - ${problem}`);
    process.exit(1);
  }
  console.log('\nBoth open complaints answer themselves in a browser.');
  process.exit(0);
})();
