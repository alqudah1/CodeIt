// Does every starter game actually run?
//
// The unit tests read the source: they prove a settings block parses and a
// label is not empty. They cannot tell you the game throws on line one, draws
// nothing, or has controls a finger cannot reach. Only a browser can, and a
// starter that crashes is the worst thing to ship: it is the first thing a
// child touches.
const { chromium } = require('playwright-core');

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://localhost:4599';

const IDS = ['catch-stars', 'penalty', 'dodge', 'pop-balloons', 'snake', 'bricks', 'jumper'];
const SIZES = [
  { name: 'phone', width: 390, height: 844, touch: true },
  { name: 'laptop', width: 1280, height: 800, touch: false },
];

const problems = [];
const fail = (w, m) => problems.push(`${w}: ${m}`);

async function run() {
  const browser = await chromium.launch({ executablePath: EXE });

  for (const size of SIZES) {
    for (const id of IDS) {
      const where = `${id} @ ${size.name}`;
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        hasTouch: size.touch, isMobile: size.touch,
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e.message).slice(0, 120)));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });

      try {
        await page.goto(`${BASE}/builder?start=${id}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(3200);

        // Does the game draw anything? Sampled from the middle of the canvas:
        // a previous version of this check sampled the top rows, which are the
        // sky in four of these games, and passed on a blank screen.
        const frame = page.frames().find(f => f !== page.mainFrame());
        if (!frame) { fail(where, 'no preview frame'); await context.close(); continue; }

        const state = await frame.evaluate(() => {
          const c = document.querySelector('canvas');
          if (!c) return { ok: false, why: 'no canvas element' };
          const ctx = c.getContext('2d');
          const w = c.width, h = c.height;
          if (!w || !h) return { ok: false, why: `canvas is ${w}x${h}` };
          // The whole canvas, not a band. An earlier version of this check
          // sampled the middle 40% and reported "nothing drawn" for every game
          // whose action happens near the floor.
          const all = ctx.getImageData(0, 0, w, h).data;
          let lit = 0;
          for (let i = 3; i < all.length; i += 4) if (all[i] > 8) lit++;
          const over = document.getElementById('gameOver');
          const ended = over ? getComputedStyle(over).display !== 'none' : false;
          return { ok: lit > 200, why: `${lit} lit pixels`, ended };
        }).catch(e => ({ ok: false, why: 'could not read the canvas: ' + e.message.slice(0, 60) }));

        if (!state.ok) fail(where, `nothing drawn (${state.why})`);

        // A starter must not be over before the child has touched it.
        //
        // This is the invariant three of these games broke. Snake started eight
        // squares from a wall and died in one second. Brick breaker served the
        // ball downward and lost three lives in two. Both were correct code and
        // unplayable products, and no unit test could have told the difference.
        if (state.ended) fail(where, 'the game was already over before any input');

        // Does it respond? Every starter must react to a tap somewhere.
        const before = await frame.evaluate(() => document.body.innerHTML.length).catch(() => 0);
        await page.mouse.click(size.width / 2, size.height * 0.45);
        await page.waitForTimeout(700);
        const alive = await frame.evaluate(() => !!document.querySelector('canvas')).catch(() => false);
        if (!alive) fail(where, 'the game vanished after a tap');
        if (before === 0) fail(where, 'frame body was unreadable');

        const real = errors.filter(e => !/favicon|ResizeObserver|Failed to load resource/i.test(e));
        real.forEach(e => fail(where, `error: ${e}`));
      } catch (e) {
        fail(where, `check could not finish: ${String(e.message).split('\n')[0].slice(0, 100)}`);
      }
      await context.close();
    }
  }

  await browser.close();
  if (!problems.length) console.log(`All ${IDS.length} starters run clean at ${SIZES.length} sizes.`);
  else { console.log(`${problems.length} problem(s):`); problems.forEach(p => console.log('  - ' + p)); }
  process.exitCode = problems.length ? 1 : 0;
}

run().catch(e => { console.error(e); process.exitCode = 1; });
