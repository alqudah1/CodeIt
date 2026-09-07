// The first session of someone who has never been here.
//
// Every other check in this folder runs as the seeded learner, who has already
// finished lessons 1, 2 and 17. Nobody arriving from Google has finished
// anything. That is the state every real first-time user is in, and for months
// nothing measured it. The lesson gate that Rania hit in her first minutes was
// specifically for a signed-in account with nothing completed: strangers were
// let through, the seeded learner had lesson 1 done, and fourteen checks were
// green while the front door was a wall.
//
// So this registers a brand new account over the API on every run, signs the
// browser in as it, and walks the real first session on a phone: open a
// starter, change one thing, then follow every lesson link the project offers.
//
// It asserts that the lesson can be READ, not that the URL resolved:
//
//   - fails on a gate card (.sl-gate-card)
//   - fails on "is locked" or "you need to complete" anywhere in the text
//   - fails if no step card (.sl-card) rendered
//   - fails if the step body is under 40 characters
//   - asserts up front that the new account has zero completed lessons, so the
//     check can never quietly turn into a returning-user check
//
// A check that asserts a destination exists is not a check. Assert that the
// thing a child came to do can be done.
//
//   CHECK_API=http://localhost:5000 node ops/checks/cold-start.js
//
// Each run creates one account (coldstart<timestamp>). Fine against the
// throwaway database run-all.sh builds; do not point it at a real one.
'use strict';

const { launch } = require('./browser');

const BASE = process.env.CHECK_BASE || 'http://localhost:4599';
const API = process.env.CHECK_API || 'http://localhost:5000';
const problems = [];
const notes = [];

const OPENED = [
  { start: 'quiz-animals',  name: 'Animal quiz' },
  { start: 'site-cupcakes', name: 'Cupcake shop' },
  { start: 'maze',          name: 'Build a maze' },
];

async function call(path, { token, ...options } = {}) {
  const response = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text.slice(0, 200); }
  return { status: response.status, body };
}

// A brand new account. Over 13 so the parent-review flow does not intercept
// the first session; that flow has its own screens and is not what this
// measures. Not a secret: it exists only inside a throwaway check database.
async function newcomer() {
  const stamp = Date.now().toString(36);
  const account = {
    accountType: 'student',
    username: `coldstart${stamp}`,
    name: 'Rania',
    password: `Cold-Start-${stamp}-2026`,
    dob: '2011-03-14',
  };
  const signup = await call('/api/signup', { method: 'POST', body: JSON.stringify(account) });
  if (signup.status !== 200 && signup.status !== 201) {
    throw new Error(`signup refused a brand new account: ${signup.status} ${JSON.stringify(signup.body).slice(0, 160)}`);
  }
  const login = await call('/api/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: account.username, password: account.password }),
  });
  if (!login.body?.token || !login.body?.user) {
    throw new Error(`could not sign the new account in: ${login.status} ${JSON.stringify(login.body).slice(0, 160)}`);
  }
  const progress = await call('/api/lessons/progress', { token: login.body.token });
  const done = progress.body?.completedLessons || [];
  if (done.length !== 0) {
    throw new Error(`a brand new account already has lessons ${done.join(', ')} completed; this is not a cold start`);
  }
  notes.push(`new account ${account.username}: 0 lessons completed, as a newcomer should be`);
  return { token: login.body.token, user: login.body.user };
}

async function signIn(page, { token, user }) {
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ t, u }) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify({
      user_id: u.id, name: u.name, username: u.username, role: u.role, learningMode: u.learningMode,
    }));
  }, { t: token, u: user });
}

// What a lesson page looks like to someone reading it, not to a router.
async function readLesson(page) {
  return page.evaluate(() => {
    const text = document.body.innerText || '';
    const card = document.querySelector('.sl-card');
    const title = card?.querySelector('.sl-card__title')?.textContent?.trim() || null;
    const body = card ? card.innerText.replace(/\s+/g, ' ').trim() : '';
    return {
      where: window.location.pathname,
      gate: !!document.querySelector('.sl-gate-card'),
      lockedWords: /is locked|you need to complete/i.test(text),
      hasCard: !!card,
      title,
      bodyLength: body.length,
    };
  });
}

// Every lesson link the project offers after one change, followed one by one.
async function lessonLinksAfterOneChange(page, { start, name }) {
  await page.goto(`${BASE}/builder?start=${start}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const changeTab = page.locator('.bldr-tab', { hasText: 'Change' }).first();
  if (!(await changeTab.count())) { problems.push(`${name}: no Change tab for a new account`); return []; }
  await changeTab.click();
  await page.waitForTimeout(900);
  const mine = page.locator('.bldr-studio-bar__btn--mine').first();
  if (!(await mine.count())) { problems.push(`${name}: no "Make it mine" tool for a new account`); return []; }
  await mine.click();
  await page.waitForTimeout(900);
  const swatch = page.locator('.bldr-mine__options--theme .bldr-mine__option').first();
  if (!(await swatch.count())) { problems.push(`${name}: the colours panel opened with nothing in it`); return []; }
  await swatch.click();
  await page.waitForTimeout(1800);

  const links = await page.evaluate(() => {
    const seen = new Map();
    for (const a of document.querySelectorAll('a[href^="/lesson/"]')) {
      const href = a.getAttribute('href');
      if (/^\/lesson\/\d+$/.test(href) && !seen.has(href)) seen.set(href, a.textContent.replace(/\s+/g, ' ').trim());
    }
    return [...seen].map(([href, words]) => ({ href, words }));
  });
  if (!links.length) problems.push(`${name}: changed something and the project offered no lesson link to a new account`);
  return links;
}

async function walk(page, opened) {
  const links = await lessonLinksAfterOneChange(page, opened);
  for (const { href, words } of links) {
    await page.goto(BASE + href, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2600);
    const lesson = await readLesson(page);
    const label = `${opened.name}: "${words}" → ${href}`;
    if (lesson.where !== href) { problems.push(`${label} bounced to ${lesson.where}`); continue; }
    if (lesson.gate) { problems.push(`${label} is a WALL for a new visitor (gate card).`); continue; }
    if (lesson.lockedWords) { problems.push(`${label} tells a new visitor it is locked.`); continue; }
    if (!lesson.hasCard) { problems.push(`${label} rendered no step card.`); continue; }
    if (lesson.bodyLength < 40) { problems.push(`${label} rendered a step with ${lesson.bodyLength} characters of text.`); continue; }
    notes.push(`${label} opens, "${lesson.title}" (${lesson.bodyLength} chars)`);
  }
}

// Weak on purpose and labelled so: it counts the word "Locked" in the map
// text. It passed on the broken build too, so it is not a second signal, only
// a guard against a future map that says the word out loud.
async function lessonMap(page) {
  await page.goto(`${BASE}/lessons`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const map = await page.evaluate(() => ({
    stops: document.querySelectorAll('.lm-stop').length,
    locked: (document.body.innerText.match(/\bLocked\b/g) || []).length,
    done: document.body.innerText.match(/(\d+) \/ (\d+) done/)?.[1] || null,
  }));
  if (!map.stops) problems.push('lesson map: no stops rendered for a brand new account');
  else if (map.locked) problems.push(`lesson map: ${map.locked} stop(s) marked Locked for a brand new account`);
  else notes.push(`lesson map: ${map.stops} stops, nothing marked Locked for a brand new account (${map.done ?? '?'} done)`);
}

(async () => {
  const account = await newcomer();
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await signIn(page, account);
  for (const opened of OPENED) await walk(page, opened);
  await lessonMap(page);
  await ctx.close();
  await browser.close();

  for (const note of notes) console.log(`  · ${note}`);
  if (problems.length) {
    console.log('\nCold start is broken for someone who has never been here:\n');
    for (const problem of problems) console.log(`  ✗ ${problem}`);
    process.exit(1);
  }
  console.log('\nSomeone who has never been here can do what they came to do.');
  process.exit(0);
})().catch((error) => { console.error(`  ✗ ${error.message}`); process.exit(1); });
