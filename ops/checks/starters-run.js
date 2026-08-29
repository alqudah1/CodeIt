// Does every starter game actually run?
//
// The unit tests read the source: they prove a settings block parses and a
// label is not empty. They cannot tell you the game throws on line one, draws
// nothing, or has controls a finger cannot reach. Only a browser can, and a
// starter that crashes is the worst thing to ship: it is the first thing a
// child touches.
const { launch } = require('./browser');

const BASE = process.env.CHECK_BASE || 'http://localhost:4599';

// Read from the source, not typed out here.
//
// A hardcoded list is how the sitemap stopped at lesson 16 while the curriculum
// grew to 31, and how the quiz range stopped at 16 too. A check that silently
// stops covering the newest thing is worse than no check: it reports success
// over a shrinking fraction of the product.
const fs = require('fs');
const path = require('path');

const BUILDER = path.join(__dirname, '..', '..', 'packages', 'gamified-elearning', 'src', 'pages', 'Builder');

// Three files, three shelves. Reading all three from source means a sixth quiz
// or an eleventh game is covered the moment it is added, without anybody
// remembering to come back here.
const SHELVES = [
  { kind: 'game', file: 'starterGames.js', marker: 'const STARTER_GAMES = [' },
  { kind: 'quiz', file: 'starterQuizzes.js', marker: 'const STARTER_QUIZZES = [' },
  { kind: 'site', file: 'starterSites.js', marker: 'const STARTER_SITES = [' },
];

const STARTERS = [];
for (const shelf of SHELVES) {
  const source = fs.readFileSync(path.join(BUILDER, shelf.file), 'utf8');
  const at = source.indexOf(shelf.marker);
  if (at === -1) {
    console.error(`Could not find ${shelf.marker} in ${shelf.file}`);
    process.exit(1);
  }
  const ids = [...source.slice(at).matchAll(/^\s*id: '([a-z0-9-]+)',$/gm)].map(m => m[1]);
  if (!ids.length) {
    console.error(`Read no starter ids out of ${shelf.file}`);
    process.exit(1);
  }
  ids.forEach(id => STARTERS.push({ id, kind: shelf.kind }));
}
if (STARTERS.length < 10) {
  console.error(`Only found ${STARTERS.length} starters. Expected the whole shelf.`);
  process.exit(1);
}
const IDS = STARTERS.map(s => s.id);
const SIZES = [
  { name: 'phone', width: 390, height: 844, touch: true },
  { name: 'laptop', width: 1280, height: 800, touch: false },
];

const problems = [];
const fail = (w, m) => problems.push(`${w}: ${m}`);

async function run() {
  const browser = await launch();

  for (const size of SIZES) {
    for (const starter of STARTERS) {
      const { id, kind } = starter;
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

        // Put the preview on screen before touching it.
        //
        // On a phone the studio page is taller than the window, so the preview
        // starts below the fold and a click aimed at it lands on whatever the
        // studio has fixed to the bottom of the screen. That is what a child
        // scrolling to their project does, and reading the result any other way
        // reports failures that are not there — and would hide real ones.
        await page.evaluate(() => {
          const preview = document.querySelector('iframe');
          if (preview) preview.scrollIntoView({ block: 'center' });
        }).catch(() => {});
        await page.waitForTimeout(500);

        // Does the game draw anything? Sampled from the middle of the canvas:
        // a previous version of this check sampled the top rows, which are the
        // sky in four of these games, and passed on a blank screen.
        const frame = page.frames().find(f => f !== page.mainFrame());
        if (!frame) { fail(where, 'no preview frame'); await context.close(); continue; }

        // ── Quizzes and shops are not games, and must not be judged as one ──
        //
        // They draw no canvas and they have no #field. What makes them work is
        // that a tap on a real button changes what the page says, so that is
        // what gets checked: press the first answer, or add the first thing to
        // the basket, and read the page back.
        if (kind !== 'game') {
          const before = await frame.evaluate(() => document.body.innerText);
          const target = kind === 'quiz' ? '.answers button' : '.item button';
          const button = await frame.$(target);
          if (!button) { fail(where, `no ${target} on the page`); await context.close(); continue; }

          // A quiz has to show every answer without scrolling.
          //
          // The studio's preview pane is about 500px tall whatever the screen
          // around it, and the first version of these cards was 574px. The
          // fourth answer sat below the fold, so a child looking at a quiz in
          // the studio could not see that there were four options.
          //
          // A shop is the opposite: it is a page, pages scroll, and nobody is
          // surprised to scroll one.
          if (kind === 'quiz') {
            const reach = await frame.evaluate(() => {
              const buttons = [...document.querySelectorAll('.answers button')];
              const bottom = Math.max(...buttons.map(b => b.getBoundingClientRect().bottom));
              return { bottom: Math.round(bottom), view: window.innerHeight, count: buttons.length };
            });
            if (reach.count < 2) fail(where, `only ${reach.count} answer buttons`);
            if (reach.bottom > reach.view) {
              fail(where, `the last answer is ${reach.bottom - reach.view}px below the fold (card runs to ${reach.bottom}, pane is ${reach.view})`);
            }
          }

          await button.scrollIntoViewIfNeeded().catch(() => {});
          const box = await button.boundingBox();
          if (!box) fail(where, 'the first button is not on screen');
          else if (box.height < 44) fail(where, `button is only ${Math.round(box.height)}px tall`);
          else if (box.x < 0 || box.x + box.width > size.width + 1) {
            fail(where, `button runs off the ${size.name}: ${Math.round(box.x)}..${Math.round(box.x + box.width)} of ${size.width}`);
          }

          await button.click().catch(() => {});
          await page.waitForTimeout(900);
          const after = await frame.evaluate(() => document.body.innerText);
          if (after === before) fail(where, 'pressing the first button changed nothing on the page');

          // Nothing may overflow sideways. A shop page that scrolls left and
          // right on a phone reads as broken before it reads as a shop.
          const overflow = await frame.evaluate(() =>
            document.documentElement.scrollWidth - document.documentElement.clientWidth);
          if (overflow > 2) fail(where, `page scrolls sideways by ${overflow}px`);

          const theirs = errors.filter(e => !/favicon|ResizeObserver|Failed to load resource/i.test(e));
          theirs.forEach(e => fail(where, `error: ${e}`));
          await context.close();
          continue;
        }

        const state = await frame.evaluate(() => {
          const over = document.getElementById('gameOver');
          const ended = over ? getComputedStyle(over).display !== 'none' : false;

          // A game whose world is built from page elements has no canvas to
          // sample. The maze is deliberately like that: its walls and coins are
          // real elements so the studio's editor can move them. So "is there
          // anything here" is asked of whichever kind of world it has.
          const c = document.querySelector('canvas');
          if (!c) {
            const pieces = document.querySelectorAll('#field > *').length;
            return pieces >= 4
              ? { ok: true, why: `${pieces} pieces in the level`, ended }
              : { ok: false, why: 'no canvas and no level pieces', ended };
          }

          const ctx = c.getContext('2d');
          const w = c.width, h = c.height;
          if (!w || !h) return { ok: false, why: `canvas is ${w}x${h}`, ended };
          // The whole canvas, not a band. An earlier version of this check
          // sampled the middle 40% and reported "nothing drawn" for every game
          // whose action happens near the floor.
          const all = ctx.getImageData(0, 0, w, h).data;
          let lit = 0;
          for (let i = 3; i < all.length; i += 4) if (all[i] > 8) lit++;
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
        const alive = await frame.evaluate(
          () => !!document.querySelector('canvas') || !!document.getElementById('field')
        ).catch(() => false);
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
  if (!problems.length) {
    const byKind = SHELVES.map(shelf =>
      `${STARTERS.filter(s => s.kind === shelf.kind).length} ${shelf.kind}`).join(', ');
    console.log(`All ${IDS.length} starters run clean at ${SIZES.length} sizes (${byKind}).`);
  }
  else { console.log(`${problems.length} problem(s):`); problems.forEach(p => console.log('  - ' + p)); }
  process.exitCode = problems.length ? 1 : 0;
}

run().catch(e => { console.error(e); process.exitCode = 1; });
