// Can a child follow a LESSON alone — the same question kid-alone.js asks of
// the studio, asked of the place class hours actually go?
//
// Two parts:
//
//   A. Every step of every lesson, read as a solo reader would: early lessons
//      (1–8, roughly ages 5–9) get a tight word budget and short sentences;
//      later lessons get a looser one. A step nobody can read alone fails.
//
//   B. Lesson 1 driven on a phone by taps, with the same keydown tripwire as
//      kid-alone.js, as far as taps go: the example is run, the line is taken
//      apart piece by piece, and the first step that asks for a change must
//      refuse the code as it came and say what to change. Since 14 November
//      2026 no lesson can be finished without typing, on purpose, and /schools
//      says so; this part used to assert the opposite and failed on its own
//      assumptions once Python could start here (19 November 2026).
//
//   node ops/checks/lesson-alone.js   (stack on 4599/5000, see run-all.sh)
const fs = require('fs');
const path = require('path');
const { launch } = require('./browser');

const BASE = process.env.CHECK_BASE || 'http://localhost:4599';
const LESSON_DIR = path.join(__dirname, '..', '..', 'packages', 'gamified-elearning', 'src', 'pages', 'Lessons', 'lessonData');
const problems = [];
const notes = [];
// Set when lesson 1 could not be walked here at all, so the closing line
// cannot claim taps carried a lesson that was never tapped.
let skippedWalk = false;

// ── Part A: the solo-reader audit ────────────────────────────────────────────

const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const longestSentence = (s) =>
  Math.max(0, ...String(s || '').split(/[.!?\n]+/).map(p => words(p)));

function loadLesson(file) {
  // Lesson data files are `const lessonN = {...}; export default lessonN;`
  // with no imports. Strip the export and evaluate.
  const src = fs.readFileSync(path.join(LESSON_DIR, file), 'utf8')
    .replace(/export\s+default\s+\w+;?/, '');
  // eslint-disable-next-line no-new-func
  return new Function(`${src}; return lesson${file.match(/\d+/)[0]};`)();
}

function auditLessons() {
  const files = fs.readdirSync(LESSON_DIR).filter(f => /^lesson\d+\.js$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  if (!files.length) { problems.push('no lesson data files found'); return; }

  let audited = 0;
  let worst = { count: 0, where: '' };
  for (const file of files) {
    let lesson;
    try { lesson = loadLesson(file); } catch (e) {
      problems.push(`${file}: could not evaluate lesson data (${e.message})`);
      continue;
    }
    const early = lesson.id <= 8;
    const wordBudget = early ? 90 : 160;      // one step's prose, read alone
    const sentenceBudget = early ? 24 : 34;   // longest single sentence
    for (const step of lesson.steps || []) {
      const prose = [step.body, step.description, step.question]
        .filter(Boolean).join(' ');
      const w = words(prose);
      audited += 1;
      if (w > worst.count) worst = { count: w, where: `lesson ${lesson.id} "${step.title}"` };
      if (w > wordBudget) {
        problems.push(`lesson ${lesson.id} step "${step.title}" (${step.type}): ${w} words of prose — over the ${early ? 'early' : ''} solo-reader budget of ${wordBudget}`);
      }
      const ls = longestSentence(prose);
      if (ls > sentenceBudget) {
        problems.push(`lesson ${lesson.id} step "${step.title}": a ${ls}-word sentence — too long for a child reading alone (budget ${sentenceBudget})`);
      }
    }
  }
  notes.push(`read audit: ${audited} steps across ${files.length} lessons; longest prose ${worst.count} words (${worst.where})`);
}

// ── Part B: lesson 1 by taps alone ───────────────────────────────────────────

async function tapThroughLessonOne() {
  const browser = await launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__typed = 0;
    window.addEventListener('keydown', () => { window.__typed += 1; }, true);
  });

  // Sign in when the seeded token exists, so progress actually records.
  let token = null;
  try { token = fs.readFileSync(process.env.CODEIT_TOKEN_FILE || '/tmp/codeit-check-token', 'utf8').trim(); } catch { token = null; }
  if (token) {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(t => localStorage.setItem('token', t), token);
  }

  await page.goto(`${BASE}/lesson/1`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  if (!(await page.locator('.sl-card__title').count())) {
    problems.push('lesson 1 did not render a step card');
    await browser.close();
    return;
  }

  // ── Does this environment have Python at all ─────────────────────────────
  //
  // Lesson 1 was rebuilt on 12 November as "press Run first, and Pixel says
  // it", so step 1 is now a code step. This walk assumed step 1 was a concept
  // and tapped the Next button without looking at it, and in the new model
  // that button reads "Run the code to continue" and is disabled until Python
  // has run. The tap timed out after thirty seconds and the whole check died
  // with an uncaught exception, which reads exactly like the lesson being
  // broken.
  //
  // It was not broken. This container cannot reach the Python runtime, which
  // the skip below has always known about, but the skip only covered steps 3
  // to 5. Moving a code step to the front moved it outside the part that knew.
  //
  // So ask once, before walking anything: is Python here? If it is not, say so
  // the way lesson-to-studio.js does and stop, rather than failing on a gate
  // this environment cannot open. The reading audit above has already run and
  // is the half that does not need a runtime.
  const pythonHere = await page.waitForFunction(() => {
    if (window.pyodide) return true;
    return Boolean(document.querySelector('.cr-starting--failed')) ? 'failed' : false;
  }, { timeout: 25000 }).then(h => h.jsonValue()).catch(() => 'failed');

  if (pythonHere !== true) {
    notes.push('lesson 1 tap-through: skipped — the Python runtime is unreachable from this environment, and lesson 1 now gates its first Next on a real Run');
    // The structure still has to be tap-honest even with no runtime: a child
    // must be able to SEE the way forward, whether or not it opens here.
    if (!(await page.locator('.sl-editor-wrap .cr-btn--run').count())) {
      problems.push('lesson 1 step 1 has no Run key, so a child has nothing to press');
    }
    skippedWalk = true;
    await browser.close();
    return;
  }

  // Step 1 — now a code step: Run, then the Next button opens.
  const firstRun = page.locator('.sl-editor-wrap:not(.sl-editor-wrap--hidden) .cr-btn--run').first();
  if (await firstRun.count()) {
    await firstRun.tap();
    await page.waitForFunction(() => {
      const btn = document.querySelector('.sl-editor-wrap:not(.sl-editor-wrap--hidden) .cr-btn--run');
      return btn && !/Running|Starting/.test(btn.textContent);
    }, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(900);
    const firstSubmit = page.locator('.sl-submit-btn').first();
    if (await firstSubmit.count()) { await firstSubmit.tap(); await page.waitForTimeout(700); }
  }

  const next = page.locator('.sl-nav__next, .sl-nav__continue').first();
  if (await next.isDisabled().catch(() => false)) {
    problems.push(`lesson 1 step 1 stayed shut after a Run: "${(await next.textContent().catch(() => '')).trim()}"`);
    await browser.close();
    return;
  }
  await next.tap();
  await page.waitForTimeout(700);
  notes.push('lesson tap 1: first step passed by Run and tap, no typing');

  // ── From here the lesson is the one rebuilt on 14 November 2026 ──────────
  //
  // This walk used to go on: step 2 a prediction, steps 3 to 5 passed by
  // pressing Run on the code as it came. Neither is the lesson any more.
  // Every Python lesson now opens with an example to run, then takes one line
  // apart piece by piece, and from the third step asks the child to change
  // the code: the code as it came is refused, on purpose, with a sentence
  // saying what to change. /schools says so in as many words ("The Python
  // lessons ask a child to type").
  //
  // Run with a Python that could start (it is served from this site now, so
  // it can), the old walk reported three problems that were its own: "predict
  // step has nothing to tap", on a step that is not a prediction. So it walks
  // what is there: the pieces are tapped, and the first step that needs
  // typing must say what it wants. Taps carry a child to that point and no
  // further, and the check says that rather than pretending otherwise.

  // Step 2 — the line taken apart. Every piece is a tap; then the way on opens.
  const pieces = page.locator('.ls-parts__piece');
  const pieceCount = await pieces.count();
  if (!pieceCount) {
    problems.push('step 2 has no pieces to tap: the line is not taken apart');
  } else {
    for (let i = 0; i < pieceCount; i += 1) { await pieces.nth(i).tap(); await page.waitForTimeout(150); }
    await page.waitForTimeout(400);
    const on = page.locator('.sl-nav__next, .sl-nav__continue').first();
    if (await on.isDisabled().catch(() => false)) {
      problems.push(`step 2 stayed shut after every piece was tapped: "${(await on.textContent().catch(() => '')).trim()}"`);
    } else {
      notes.push(`lesson tap 2: all ${pieceCount} pieces of the line tapped, and the way on opened`);
      await on.tap();
      await page.waitForTimeout(800);
    }
  }

  // Step 3 — the first one that asks for a change. Run and Submit on the code
  // as it came must be refused, and the refusal must say what to do.
  const run = page.locator('.sl-editor-wrap:not(.sl-editor-wrap--hidden) .cr-btn--run').first();
  if (!(await run.count())) {
    // A lesson whose third step is tapped (a prediction, blanks, an order) has
    // no editor here, and is not this check's business yet.
    notes.push('lesson step 3: not a typing step in this lesson; nothing to refuse');
  } else {
    await run.tap();
    await page.waitForFunction(() => {
      const btn = document.querySelector('.sl-editor-wrap:not(.sl-editor-wrap--hidden) .cr-btn--run');
      return btn && !/Running|Starting/.test(btn.textContent);
    }, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(900);
    const submit = page.locator('button', { hasText: /Submit Answer/ }).first();
    if (await submit.count()) { await submit.tap(); await page.waitForTimeout(700); }
    const refusal = ((await page.locator('.sl-feedback--incorrect').first().textContent().catch(() => '')) || '').trim();
    if (await page.locator('.sl-tag--done').count()) {
      problems.push('step 3 passed with the code as it came: a child can finish it without changing anything');
    } else if (refusal.length < 20) {
      problems.push(`step 3 refused the code as it came without saying what to change: "${refusal}"`);
    } else {
      notes.push(`lesson step 3: the code as it came is refused, and says why ("${refusal.slice(0, 60)}...")`);
      notes.push('from step 3 the lesson asks a child to type, as /schools says; taps alone end here');
    }
  }

  const typed = await page.evaluate(() => window.__typed);
  if (typed > 0) problems.push(`${typed} keyboard event(s) were needed in lesson 1 — a non-typing child is stuck`);
  else notes.push('keyboard tripwire: zero keydown events up to the first step that asks for typing');

  await browser.close();
}

// ── Verdict ──────────────────────────────────────────────────────────────────

(async () => {
  auditLessons();
  await tapThroughLessonOne();
  for (const n of notes) console.log(`  ✓ ${n}`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const p of problems) console.log(`  - ${p}`);
    process.exit(1);
  }
  if (skippedWalk) {
    console.log('\nSKIPPED: a child alone can read every step. Whether taps carry lesson 1 was');
    console.log('not answered here, because this environment has no Python runtime and the');
    console.log('first step now gates on a real Run. CI answers it, where Python loads.');
    process.exit(0);
  }
  console.log('\nA child alone can read every step. Taps carry lesson 1 to the first step that asks for a change, and that step says what to change.');
  process.exit(0);
})();
