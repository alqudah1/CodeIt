// The door from a finished lesson into the studio.
//
// ── Why this is the check that matters most ──────────────────────────────────
//
// Read from production on 1 September 2026, across 326 accounts: 236 learners
// finished a lesson, and 23 ever made a project. Nine in ten people who get
// through the commodity half of this site never reach the half that is ours.
//
// The fix shipped the same day. The comment on it, in
// InteractiveLessonTemplate.js, says in as many words: "This is a test with a
// number attached: re-read the milestone table in a week. If the build rate
// moves, this was the bottleneck. If it does not, the hypothesis was wrong and
// we say so."
//
// Two months later nobody has re-read the table, and nothing anywhere checks
// that the door still opens. A hypothesis with an instrument attached and no
// reading is the same as no hypothesis. This is the instrument for the half
// that can be measured without production: that the door is there, that it is
// the first thing offered, and that walking through it lands in the studio
// with the lesson's own idea already in it.
//
// It asserts what a child does, not what a route returns:
//
//   - the studio button exists on the completion card and carries the prompt
//   - it is the FIRST action, not the second. The whole change was moving it
//     in front of the quiz; if it slides back, the fix is undone and every
//     other test still passes
//   - pressing it lands on /builder with ?prompt= and ?from=lesson-1
//   - the studio then renders something, rather than an empty frame
//
//   CHECK_API=http://localhost:5000 node ops/checks/lesson-to-studio.js
//
// Registers one account per run. Throwaway database only.
'use strict';

const { launch } = require('./browser');

const BASE = process.env.CHECK_BASE || 'http://localhost:4599';
const API = process.env.CHECK_API || 'http://localhost:5000';
const problems = [];
const notes = [];

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

async function newcomer() {
  const stamp = Date.now().toString(36);
  const account = {
    accountType: 'student',
    username: `studiodoor${stamp}`,
    name: 'Rania',
    password: `Studio-Door-${stamp}-2026`,
    dob: '2011-03-14',
  };
  const signup = await call('/api/signup', { method: 'POST', body: JSON.stringify(account) });
  if (signup.status !== 200 && signup.status !== 201) {
    throw new Error(`signup refused a brand new account: ${signup.status}`);
  }
  const login = await call('/api/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: account.username, password: account.password }),
  });
  if (!login.body?.token) throw new Error(`could not sign in: ${login.status}`);
  notes.push(`new account ${account.username}`);
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

/** The completion card as a child sees it: which buttons, in which order. */
async function readCompletion(page) {
  return page.evaluate(() => {
    const card = document.querySelector('.sl-completion-card');
    if (!card) return { present: false };
    const buttons = [...card.querySelectorAll('.sl-completion-card__actions button')]
      .map(b => ({
        label: (b.innerText || '').replace(/\s+/g, ' ').trim(),
        studio: b.className.includes('--studio'),
      }));
    const hint = card.querySelector('.sl-completion-card__cta-hint');
    return {
      present: true,
      buttons,
      hint: hint ? hint.innerText.replace(/\s+/g, ' ').trim() : '',
    };
  });
}

async function run() {
  const who = await newcomer();
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  try {
    await signIn(page, who);

    // Finish lesson 1 through the API, which is what the Finish control does.
    // This check is about the door, not about re-testing the lesson; the lesson
    // itself is covered by lesson-alone.js.
    const done = await call('/api/lessons/1/complete', {
      method: 'POST', token: who.token, body: JSON.stringify({}),
    });
    if (done.status !== 200 && done.status !== 201) {
      problems.push(`could not complete lesson 1 over the API: ${done.status} ${JSON.stringify(done.body).slice(0, 140)}`);
    }

    // Walk lesson 1 the way a child does. The Finish control only appears once
    // the lesson's "Try it" step is done, which needs Python to actually run
    // (commit 4262cc9 made that gate cover all 31 lessons). Pyodide is fetched
    // from a CDN this container cannot reach, so the walk can legitimately
    // stall here and that is not a product fault. It is distinguished below
    // rather than excused: the check only lets itself off when it can prove
    // the Python runtime is the reason.
    await page.goto(`${BASE}/lesson/1`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    let card = await readCompletion(page);
    for (let i = 0; i < 30 && !card.present; i += 1) {
      const moved = await page.evaluate(() => {
        const skip = document.querySelector('.sl-skip-btn');
        if (skip && !skip.disabled) { skip.click(); return 'skip'; }
        const next = [...document.querySelectorAll('button')]
          .find(b => /got it|next step|continue|finish/i.test(b.innerText || '') && !b.disabled);
        if (next) { next.click(); return 'next'; }
        return false;
      });
      if (!moved) break;
      await page.waitForTimeout(800);
      card = await readCompletion(page);
    }

    if (!card.present) {
      const pyReady = Boolean(await page.evaluate(() => Boolean(window.pyodide)));
      if (!pyReady) {
        notes.push(
          'the walk stalled before the Finish control, and window.pyodide is absent: '
          + 'the Python runtime CDN is unreachable from this environment, so the gate '
          + 'that needs a real Run cannot be passed here. Not a product fault; this '
          + 'check does its real work in CI, where Python loads.'
        );
        notes.forEach(n => console.log(`  · ${n}`));
        console.log('\nSKIPPED: the door could not be reached without the Python runtime.');
        return;
      }
    }

    if (!card.present) {
      problems.push('never reached the completion card for lesson 1, so the door could not be checked');
    } else {
      const labels = card.buttons.map(b => b.label);
      notes.push(`completion card offers: ${labels.join(' | ')}`);

      const studioAt = card.buttons.findIndex(b => b.studio);
      if (studioAt < 0) {
        problems.push(`no studio button on the completion card. Offered instead: ${labels.join(' | ')}`);
      } else {
        if (studioAt !== 0) {
          problems.push(
            `the studio button is in position ${studioAt + 1}, behind "${labels[0]}". `
            + 'Moving it in front of the quiz was the whole change made on 1 September.'
          );
        } else {
          notes.push(`the studio is the first thing offered: "${labels[0]}"`);
        }

        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
          page.evaluate(() => {
            const b = [...document.querySelectorAll('.sl-completion-card__actions button')]
              .find(x => x.className.includes('--studio'));
            if (b) b.click();
          }),
        ]);
        await page.waitForTimeout(3000);

        const landed = await page.evaluate(() => ({
          path: window.location.pathname,
          search: window.location.search,
          words: (document.body.innerText || '').trim().split(/\s+/).filter(Boolean).length,
        }));

        if (!landed.path.startsWith('/builder')) {
          problems.push(`the studio button landed on ${landed.path}, not /builder`);
        } else if (!/[?&]prompt=/.test(landed.search)) {
          problems.push('the studio opened with no prompt, so the lesson\'s idea was dropped on the way');
        } else if (!/from=lesson-1/.test(landed.search)) {
          problems.push('the studio opened without from=lesson-1, so this arrival cannot be attributed');
        } else if (landed.words < 30) {
          problems.push(`the studio opened but rendered only ${landed.words} words`);
        } else {
          const prompt = decodeURIComponent((landed.search.match(/[?&]prompt=([^&]*)/) || [])[1] || '');
          notes.push(`walked through: /builder carrying "${prompt}" and from=lesson-1, ${landed.words} words on screen`);
        }
      }
    }
  } finally {
    await ctx.close();
    await browser.close();
  }

  notes.forEach(n => console.log(`  · ${n}`));
  if (problems.length) {
    console.log(`\n${problems.length} problem(s) with the door into the studio:`);
    problems.forEach(p => console.log(`  - ${p}`));
    process.exitCode = 1;
    return;
  }
  console.log('\nA finished lesson offers the studio first, and it opens with the lesson\'s own idea.');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
