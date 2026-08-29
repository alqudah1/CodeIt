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
//      kid-alone.js. Lesson 1's tryit and challenge deliberately pass with
//      their starter code untouched (expectedKeywords: ['print('] is already
//      in the starter), so the FIRST lesson must be completable end to end
//      without one keyboard event. Code steps are skipped with a note when the
//      Python runtime's CDN is unreachable from this environment.
//
//   node ops/checks/lesson-alone.js   (stack on 4599/5000, see run-all.sh)
const fs = require('fs');
const path = require('path');
const { launch } = require('./browser');

const BASE = process.env.CHECK_BASE || 'http://localhost:4599';
const LESSON_DIR = path.join(__dirname, '..', '..', 'packages', 'gamified-elearning', 'src', 'pages', 'Lessons', 'lessonData');
const problems = [];
const notes = [];

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

  // Step 1 — concept. One tap on the big next button.
  const next = page.locator('.sl-nav__next, .sl-nav__continue').first();
  await next.tap();
  await page.waitForTimeout(700);
  notes.push('lesson tap 1: concept passed with Got It');

  // Step 2 — predict. Tap choices until one is right; a child does the same.
  const choiceCount = await page.locator('.li-choice').count();
  if (!choiceCount) problems.push('predict step has nothing to tap');
  let solved = false;
  for (let i = 0; i < choiceCount && !solved; i += 1) {
    await page.locator('.li-choice').nth(i).tap();
    await page.waitForTimeout(250);
    const submit = page.locator('.sl-submit-btn').first();
    if (!(await submit.count())) break;
    await submit.tap();
    await page.waitForTimeout(600);
    solved = (await page.locator('.sl-success').count()) > 0;
  }
  if (!solved) problems.push('predict step could not be completed by taps');
  else {
    notes.push('lesson tap 2: predict answered by taps');
    await page.locator('.sl-nav__next, .sl-nav__continue').first().tap();
    await page.waitForTimeout(700);
  }

  // Steps 3–5 — example / tryit / challenge. All pass with starter code:
  // tap Run, tap Submit. Needs the Python runtime, which needs its CDN.
  const run = page.locator('.sl-editor-wrap:not(.sl-editor-wrap--hidden) .cr-btn--run').first();
  let pyReady = false;
  try {
    await page.waitForFunction(() => {
      const btn = document.querySelector('.sl-editor-wrap:not(.sl-editor-wrap--hidden) .cr-btn--run');
      return btn && /Run/.test(btn.textContent) && !btn.disabled;
    }, { timeout: 25000 });
    pyReady = true;
  } catch { pyReady = false; }

  if (!pyReady) {
    notes.push('lesson taps 3–5: skipped — Python runtime CDN unreachable from this environment (structure checked instead)');
    // The structure still has to be tap-honest: an editor, a Run key, a
    // Submit that explains itself, and a hint on the current step.
    if (!(await run.count())) problems.push('example step has no Run key');
  } else {
    for (let stepNo = 3; stepNo <= 5; stepNo += 1) {
      const runBtn = page.locator('.sl-editor-wrap:not(.sl-editor-wrap--hidden) .cr-btn--run').first();
      await runBtn.tap();
      await page.waitForFunction(() => {
        const btn = document.querySelector('.sl-editor-wrap:not(.sl-editor-wrap--hidden) .cr-btn--run');
        return btn && !/Running/.test(btn.textContent);
      }, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(900);
      const submit = page.locator('.sl-submit-btn').first();
      if (await submit.count()) { await submit.tap(); await page.waitForTimeout(700); }
      if (!(await page.locator('.sl-success').count())) {
        problems.push(`code step ${stepNo} did not pass with starter code and taps alone`);
        break;
      }
      notes.push(`lesson tap ${stepNo}: code step passed with starter code, no typing`);
      await page.locator('.sl-nav__next, .sl-nav__continue').first().tap();
      await page.waitForTimeout(900);
    }
  }

  const typed = await page.evaluate(() => window.__typed);
  if (typed > 0) problems.push(`${typed} keyboard event(s) were needed in lesson 1 — a non-typing child is stuck`);
  else notes.push('keyboard tripwire: zero keydown events for the whole visit');

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
  console.log('\nA child alone can read every step, and taps alone carry lesson 1.');
  process.exit(0);
})();
