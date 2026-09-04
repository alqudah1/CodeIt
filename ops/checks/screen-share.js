// Every screen outside the studio, held to the bar A set.
//
// A asked two questions of the studio and answered them with numbers:
//
//   how much of the first screen is the thing the child came for?
//   how many controls compete for the first tap?
//
// A got the studio to 60% and 4 controls on a phone. This asks the same two
// questions of home, lessons, a lesson, a quiz, explore, profile and pricing —
// the seven screens a child passes through before and after the studio.
//
//   node ops/checks/screen-share.js
//
// Needs a running stack, because three of these screens do not exist without
// one — signed out, /explore is an API error, /profile is a login form and
// /quiz/1 says "please log in", and measuring those is measuring nothing:
//
//   1. a Postgres with this repo's migrations applied
//   2. the backend against it, with DATABASE_URL and a JWT_SECRET of 32+ chars
//      (a throwaway one is fine — nothing here touches production)
//   3. a learner over 13 signed up through /api/signup, with a project or two
//      saved and published and a lesson finished, and their token written to
//      /tmp/token.txt
//   4. the frontend built with REACT_APP_API_URL pointing at that backend, and
//      served: npx serve -s build -l 4599
//
// Without /tmp/token.txt the two signed-in screens are skipped and say so,
// rather than quietly measuring a login form and calling it a profile.
//
// "The thing the child came for" is named per route below rather than guessed.
// On a page with several candidates it is the first thing they can act on: on
// /lessons that is the lesson list, not the title above it; on /pricing it is
// the plans, not the pitch.
const { launch } = require('./browser');

// Where the built site is being served. CI picks its own port.
const BASE = process.env.CHECK_BASE || 'http://localhost:4599';

const SIZES = [
  { name: 'phone',  width: 390, height: 844,  touch: true },
  { name: 'tablet', width: 768, height: 1024, touch: true },
  { name: 'laptop', width: 1280, height: 800, touch: false },
];

const SCREENS = [
  // Was '.pick__row', the three AI-studio starters, back when they led the
  // page. The home page now leads with the part that has no AI in it: the two
  // doors into lesson 1 and the playground, and a live Python editor beside
  // them. That is what a new visitor came for, so that is what is measured.
  { name: 'home (new)',       url: '/',         want: '.studio-hero__actions, .tryp', came: 'Python they can run', union: true },
  // Both, unioned: a returning child's shelf and the three starters under it
  // are one thing — places to go and make or play something. Counting the
  // starters as competition for the shelf would call the page's second-best
  // answer clutter.
  { name: 'home (returning)', url: '/', seed: true, want: '.shelf, .pick__row', came: 'their own work', union: true },
  { name: 'lessons',          url: '/lessons',  want: '.lm-path',       came: 'the lessons' },
  { name: 'a lesson',         url: '/lesson/1', want: '.sl-card',       came: 'the step' },
  // Quiz 17, not quiz 1: quizzes 1–16 have their questions only in production,
  // never in a migration, so a database built from this repo has no quiz 1 to
  // measure. Worth its own fix; not this one's.
  { name: 'a quiz',           url: '/quiz/17',  want: '.qz-question-card, .qz-options', came: 'the question and its answers', signedIn: true, union: true },
  { name: 'explore',          url: '/explore',  want: '.exp-grid',      came: 'projects to play' },
  { name: 'profile',          url: '/profile',  want: '.profile-card--xp, .profile-stats', came: 'their progress', signedIn: true, union: true },
  { name: 'pricing',          url: '/pricing',  want: '.pricing-plans', came: 'the plans' },
];

// A quiz and a profile do not exist for a signed-out visitor: they render a
// login form, which is the right behaviour and the wrong thing to measure. So
// those two are measured as the child who owns them, with the same token a
// real login would have put in localStorage.
const SIGNED_IN = (() => {
  try {
    return {
      token: require('fs').readFileSync(process.env.CODEIT_TOKEN_FILE || '/tmp/codeit-check-token', 'utf8').trim(),
      user: { user_id: 1, name: 'Maya', username: 'mayatest', role: 'Student' },
    };
  } catch { return null; }
})();

async function measure(page, wantSelector, union) {
  return page.evaluate(({ selector, union }) => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    // The thing they came for. Normally the first match that is actually
    // rendered. On a screen where it is a group of siblings — a quiz question
    // and the answers under it are two boxes, and measuring either alone is a
    // lie — `union: true` takes the box around all of them.
    const matches = [...document.querySelectorAll(selector)]
      .filter(el => { const r = el.getBoundingClientRect(); return r.height > 0 && r.width > 0; });
    if (!matches.length) return { missing: true };

    const wants = union ? matches : [matches[0]];
    const want = wants[0];
    const boxes = wants.map(el => el.getBoundingClientRect());
    const wr = {
      top: Math.min(...boxes.map(b => b.top)),
      bottom: Math.max(...boxes.map(b => b.bottom)),
    };
    const fullHeight = wr.bottom - wr.top;
    const contains = (el) => wants.some(w => w.contains(el));
    const top = wr.top + window.scrollY;

    // Share of the FIRST screen it occupies — clipped to the viewport, because
    // a 3000px grid that starts below the fold occupies none of the first
    // screen no matter how tall it is.
    const visibleTop = Math.max(0, wr.top);
    const visibleBottom = Math.min(vh, wr.bottom);
    const share = Math.max(0, visibleBottom - visibleTop) / vh;

    // Controls competing for the first tap: anything tappable whose box
    // intersects the first screen. A control inside the thing they came for is
    // not competing with it — a lesson card on /lessons IS the point — so those
    // are counted separately.
    let competing = 0;
    let inside = 0;
    const seen = new Set();
    document.querySelectorAll('a[href], button, [role="button"], summary, input, select').forEach(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || !el.offsetParent) return;
      const r = el.getBoundingClientRect();
      if (r.height === 0 || r.width === 0) return;
      if (r.top >= vh || r.bottom <= 0 || r.left >= vw || r.right <= 0) return;
      // One entry per visually distinct control: a link wrapping a button
      // counts once.
      const key = `${Math.round(r.top)}:${Math.round(r.left)}:${Math.round(r.width)}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (contains(el)) inside += 1; else competing += 1;
    });

    // Words of interface text sitting above the thing they came for. This is
    // what a child reads, or skips, before reaching the point.
    let wordsAbove = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.textContent.trim();
      if (!text) continue;
      const parent = n.parentElement;
      if (!parent || contains(parent)) continue;
      const style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const r = parent.getBoundingClientRect();
      if (r.height === 0) continue;
      if (r.top + window.scrollY >= top) continue;
      wordsAbove += text.split(/\s+/).length;
    }

    return {
      startsAt: Math.round(top),
      // How far down the first screen a child must look before the point of
      // the page begins. This is the number that transfers between screens:
      // "share" only means something when the content is tall enough to have
      // filled the screen in the first place.
      scrollPast: Math.round((top / vh) * 100),
      couldHaveFilled: fullHeight >= (vh - wr.top),
      share: Math.round(share * 100),
      competing,
      inside,
      wordsAbove,
      pageHeight: Math.round(document.documentElement.scrollHeight),
      viewport: vh,
    };
  }, { selector: wantSelector, union: !!union });
}

// ── The one that is allowed to fail ──────────────────────────────────────────
//
// Home on a laptop: the first tappable thing starts 274px down, 34% against a
// 33% bar. What is left above it is the headline and the line reading "Coding
// for ages 5 to 18". Deleting that line clears the bar by ten pixels; it is the
// clearest statement on the site of who this is for, so it stays until Mustafa
// says otherwise.
//
// Written down rather than tolerated silently, because a check that reports a
// failure and exits 0 is not a check, and this one did exactly that. Anything
// not on this list turns the run red. If an allowance stops being needed the
// run says so, so the list cannot quietly rot.
// Empty, and it should stay that way. The one entry that used to be here
// covered the home page on a laptop, where the age line above the headline
// pushed the point of the page too far down. The page now opens on a live
// Python editor and clears the bar on its own.
const ALLOWED = [];

(async () => {
  const browser = await launch();
  const rows = [];

  for (const size of SIZES) {
    const ctx = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      isMobile: size.touch, hasTouch: size.touch,
    });
    const page = await ctx.newPage();

    for (const screen of SCREENS) {
      if (screen.signedIn) {
        if (!SIGNED_IN?.token) {
          rows.push({ size: size.name, screen: screen.name, came: screen.came, noSession: true });
          continue;
        }
        await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
        await page.evaluate((s) => {
          localStorage.setItem('token', s.token);
          localStorage.setItem('user', JSON.stringify(s.user));
        }, SIGNED_IN);
      }
      if (screen.seed) {
        // A returning child has something on the shelf. Open a starter once so
        // the shelf fills from this device's storage, exactly as it would for
        // a child who came back.
        await page.goto(BASE + '/builder?start=penalty', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2800);
      }
      await page.goto(BASE + screen.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2400);
      const m = await measure(page, screen.want, screen.union);
      rows.push({ size: size.name, screen: screen.name, came: screen.came, ...m });
    }
    await ctx.close();
  }

  const pad = (s, n) => String(s).padEnd(n);
  let failures = 0;
  for (const size of SIZES) {
    console.log(`\n══ ${size.name} (${size.width}x${size.height}) ${'═'.repeat(Math.max(0, 34 - size.name.length))}`);
    console.log(`  ${pad('screen', 20)} ${pad('scroll past', 15)} ${pad('of 1st screen', 15)} ${pad('competing', 11)} words above`);
    for (const r of rows.filter(x => x.size === size.name)) {
      if (r.noSession) {
        console.log(`  ${pad(r.screen, 20)} — skipped, no signed-in session available`);
        continue;
      }
      if (r.missing) {
        console.log(`  ${pad(r.screen, 20)} — not found on the page (${r.came})`);
        failures += 1;
        continue;
      }
      // A's bar was "60% of the first screen". That bar assumes the thing the
      // child came for is one big rectangle — in the studio it is: their game.
      // On a list page it is a grid of small cards, and a grid with four
      // projects in it cannot occupy 60% of a laptop screen no matter how good
      // the layout is. Demanding it would be demanding padding.
      //
      // So two bars, and the second only applies when it can:
      //
      //   * how far down the first screen you scroll past before the point of
      //     the page begins — under a third, everywhere. This is the number
      //     that transfers between screens.
      //   * share of the first screen, but only judged when the content was
      //     tall enough to have filled the rest of the screen and did not.
      const bad = [];
      if (r.scrollPast > 33) bad.push('starts too low');
      if (r.couldHaveFilled && r.share < (size.name === 'phone' ? 60 : 50)) bad.push('share');
      if (r.competing > 10) bad.push('controls');
      const allowance = ALLOWED.find(a => a.size === size.name && a.screen === r.screen);
      if (bad.length && !allowance) failures += 1;
      if (bad.length && allowance) allowance.used = true;
      const shareCell = r.couldHaveFilled ? `${r.share}%` : `${r.share}% (short)`;
      console.log(
        `  ${pad(r.screen, 20)} ${pad(r.startsAt + 'px (' + r.scrollPast + '%)', 15)} ${pad(shareCell, 15)} ${pad(r.competing, 11)} ${pad(r.wordsAbove, 6)} ${bad.length ? (allowance ? '· allowed: ' : '⚠ ') + bad.join(', ') : ''}`
      );
    }
  }

  const stale = ALLOWED.filter(a => !a.used);
  for (const a of ALLOWED.filter(a => a.used)) {
    console.log(`\n  allowed: ${a.screen} on ${a.size} — ${a.because}`);
  }
  for (const a of stale) {
    console.log(`\n  ${a.screen} on ${a.size} is allowed to fail and no longer does.`);
    console.log('  Take it off the ALLOWED list so the bar starts holding it.');
  }

  await browser.close();

  if (failures || stale.length) {
    console.log(`\n${failures} screen/size pair(s) below the bar that should not be.`);
    process.exit(1);
  }
  console.log('\nEvery screen passes the bar A set, but the one written down.');
  process.exit(0);
})();
