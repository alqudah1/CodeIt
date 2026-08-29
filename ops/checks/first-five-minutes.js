// What the first five minutes say about who wrote the code.
//
// Real children asked Mustafa "why don't we just use Scratch" and "why is the
// AI writing the code". Asked whether that gets answered in words on the site
// or by what the first five minutes feel like, he chose the five minutes — and
// added that the studio should not claim they built anything until they have
// changed it, and that seeing what is behind their project should send them
// into the lessons.
//
// So this walks those five minutes, in order, and checks three things:
//
//   1. before a child changes anything, the studio claims nothing
//   2. the moment they change something, the screen shows them a concept from
//      their own file, with the line number, and the lesson that teaches it
//   3. the lesson link goes somewhere real
//
//   node ops/checks/first-five-minutes.js
//
// Serve a production build on 4599 first (npx serve -s build -l 4599).
const { launch } = require('./browser');

const BASE = process.env.CHECK_BASE || 'http://localhost:4599';
const problems = [];
const notes = [];

// Element-built starters, because a canvas game has nothing to tap and the
// change has to be one a child could really make with their hands.
const OPENED = [
  { start: 'quiz-animals',  name: 'Animal quiz' },
  { start: 'site-cupcakes', name: 'Cupcake shop' },
  { start: 'maze',          name: 'Build a maze' },
];

async function walk(page, { start, name }) {
  await page.goto(`${BASE}/builder?start=${start}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // ── 1. Before touching anything ────────────────────────────────────────────
  const before = await page.evaluate(() => ({
    banner: document.querySelector('.bldr-success-banner__label')?.textContent?.trim() || null,
    hint: document.querySelector('.bldr-change-hint')?.innerText?.trim() || null,
    behind: !!document.querySelector('.bldr-change-hint--behind'),
    // Every visible word, to catch the claim wherever it is made.
    said: document.body.innerText,
  }));

  if (/you built this/i.test(before.said)) {
    problems.push(`${name}: says "You built this!" before the child has changed anything`);
  } else {
    notes.push(`${name}: claims nothing yet — the banner reads "${before.banner}"`);
  }
  if (before.behind) {
    problems.push(`${name}: shows what is behind the code before they have earned it`);
  }
  if (!before.hint) {
    problems.push(`${name}: nothing invites a first change`);
  }

  // ── 2. Change one thing, the way a child would ─────────────────────────────
  // The Change tab, then the first colour theme. This is the shortest real
  // change in the product and the one the checklist points at.
  const changeTab = page.locator('.bldr-tab', { hasText: 'Change' }).first();
  if (!(await changeTab.count())) { problems.push(`${name}: no Change tab`); return; }
  await changeTab.click();
  await page.waitForTimeout(900);

  // "Make it mine" opens the panel; the first colour theme in it is the change.
  const mine = page.locator('.bldr-studio-bar__btn--mine').first();
  if (!(await mine.count())) { problems.push(`${name}: no "Make it mine" tool on the Change tab`); return; }
  await mine.click();
  await page.waitForTimeout(900);

  const swatch = page.locator('.bldr-mine__options--theme .bldr-mine__option').first();
  if (!(await swatch.count())) { problems.push(`${name}: the colours panel opened with nothing in it`); return; }
  await swatch.click();
  await page.waitForTimeout(1800);

  // ── 3. What the screen says now ────────────────────────────────────────────
  const after = await page.evaluate(() => {
    const el = document.querySelector('.bldr-change-hint--behind');
    const frame = document.querySelector('.bldr-iframe');
    let source = '';
    try { source = frame?.getAttribute('srcdoc') || ''; } catch { source = ''; }
    return {
      present: !!el,
      text: el?.innerText?.replace(/\s+/g, ' ').trim() || null,
      lesson: el?.querySelector('a')?.getAttribute('href') || null,
      lessonWords: el?.querySelector('a')?.textContent?.trim() || null,
      banner: document.querySelector('.bldr-success-banner__label')?.textContent?.trim() || null,
      line: Number(el?.innerText?.match(/line (\d+)/i)?.[1]) || null,
      sourceLines: source ? source.split('\n').length : 0,
      stillClaims: /you built this/i.test(document.body.innerText),
    };
  });

  if (!after.present) {
    problems.push(`${name}: changed something and the screen never showed what is behind it`);
    return;
  }
  if (after.stillClaims) {
    problems.push(`${name}: still says "You built this!" after the change`);
  }
  if (!after.lesson || !/^\/lesson\/\d+$/.test(after.lesson)) {
    problems.push(`${name}: what-is-behind line does not link to a lesson (got ${after.lesson})`);
    return;
  }
  if (!after.line) {
    problems.push(`${name}: names a concept but not the line in their own file — that is a claim, not evidence`);
    return;
  }
  if (after.sourceLines && after.line > after.sourceLines) {
    problems.push(`${name}: points at line ${after.line} of a ${after.sourceLines}-line file`);
    return;
  }

  // ── 4. The lesson it promises has to exist ─────────────────────────────────
  const lessonUrl = BASE + after.lesson;
  await page.goto(lessonUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  const lesson = await page.evaluate(() => ({
    onALesson: !!document.querySelector('.sl-card, .sl-gate-card'),
    where: window.location.pathname,
    heading: document.querySelector('.sl-card__title, .sl-gate-card__title')?.textContent?.trim() || null,
  }));

  if (!lesson.onALesson || lesson.where !== after.lesson) {
    problems.push(`${name}: "${after.lessonWords}" led to ${lesson.where}, not a lesson`);
  } else {
    notes.push(`${name}: changed it → "${after.banner}" → ${after.text.slice(0, 88)}… → ${after.lessonWords} → ${lesson.where}`);
  }
}

// ── The second visit ────────────────────────────────────────────────────────
//
// "Earliest lesson in your code" sends every child to Lesson 2 forever. This
// checks that a child who has finished Lesson 2 is offered something else —
// which is the difference between a door and a wall.
async function secondVisit(browser) {
  let token = null;
  try { token = require('fs').readFileSync(process.env.CODEIT_TOKEN_FILE || '/tmp/codeit-check-token', 'utf8').trim(); } catch { token = null; }
  if (!token) { notes.push('second visit: skipped, no signed-in session available'); return; }

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify({ user_id: 1, name: 'Maya', username: 'mayatest', role: 'Student' }));
  }, token);

  await page.goto(`${BASE}/builder?start=quiz-animals`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3200);
  await page.locator('.bldr-tab', { hasText: 'Change' }).first().click();
  await page.waitForTimeout(900);
  await page.locator('.bldr-studio-bar__btn--mine').first().click();
  await page.waitForTimeout(900);
  await page.locator('.bldr-mine__options--theme .bldr-mine__option').first().click();
  await page.waitForTimeout(2000);

  const offered = await page.evaluate(() => {
    const el = document.querySelector('.bldr-change-hint--behind');
    return {
      lesson: el?.querySelector('a')?.getAttribute('href') || null,
      words: el?.innerText?.replace(/\s+/g, ' ').trim() || null,
    };
  });

  // The seeded learner has finished lessons 1, 2 and 17. Lesson 2 is Variables,
  // which is the earliest thing in every starter — so being offered it again
  // would mean progress was never read.
  if (!offered.lesson) {
    problems.push('second visit: signed in, the screen showed nothing behind the code');
  } else if (offered.lesson === '/lesson/2') {
    problems.push('second visit: offered Lesson 2 again, which this child has already finished');
  } else {
    notes.push(`second visit: Lesson 2 already done, so it offered ${offered.lesson} instead`);
  }
  await ctx.close();
}

(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  for (const opened of OPENED) await walk(page, opened);
  await ctx.close();
  await secondVisit(browser);
  await browser.close();

  for (const note of notes) console.log(`  ✓ ${note}`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const problem of problems) console.log(`  - ${problem}`);
    process.exit(1);
  }
  console.log('\nThe first five minutes answer the question themselves.');
  process.exit(0);
})();
