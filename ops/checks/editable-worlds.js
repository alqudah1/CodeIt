// What can a child actually click on and change?
//
// This is the check behind GOAL.md §3. The studio has a real element editor —
// select, drag, resize, recolour — and for most of the first year of this
// product it could not reach anything a child cared about, because every
// starter drew its world inside a canvas. A canvas is one DOM element, so
// tapping a falling star selected the whole board.
//
// The fix was not to write a new editor. It was to build worlds out of
// elements. This check asks, for every starter that claims to be built that
// way, the only question that matters: click the thing, and does the studio say
// it has selected the thing?
//
// A unit test cannot answer it. It needs the real editor, the real overlay, the
// real iframe and a real mouse.
const { launch } = require('./browser');

const BASE = process.env.CHECK_BASE || 'http://localhost:4599';

// starter id → a selector for one piece of its world, and how many there
// should be. Deliberately written out rather than derived: the point is to
// name the thing a child would reach for.
const WORLDS = [
  { id: 'maze',            piece: '.wall',           least: 3, what: 'a wall' },
  { id: 'whack',           piece: '.hole',           least: 6, what: 'a hole' },
  { id: 'memory',          piece: '.pad',            least: 4, what: 'a pad' },
  { id: 'quiz-animals',    piece: '.answers button', least: 4, what: 'an answer' },
  { id: 'quiz-creature',   piece: '.answers button', least: 4, what: 'an answer' },
  { id: 'site-cupcakes',   piece: '.item',           least: 4, what: 'a product' },
  { id: 'site-bracelets',  piece: '.item',           least: 4, what: 'a product' },
];

const problems = [];
const fail = (where, message) => problems.push(`${where}: ${message}`);

async function openEditor(page) {
  for (const tab of await page.$$('button.bldr-tab')) {
    if (/Change/.test(await tab.innerText())) { await tab.click(); break; }
  }
  await page.waitForTimeout(700);
  // By class, not by label. This searched for the text "Edit elements" and broke
  // the moment that button was renamed to say what it actually does — a check
  // that fails because the product got clearer is a check pinned to the wrong
  // thing.
  const button = await page.$('.bldr-action-btn--livedit');
  if (!button) return false;
  await button.click();
  await page.waitForTimeout(800);
  return true;
}

async function run() {
  const browser = await launch();

  for (const world of WORLDS) {
    const where = world.id;
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    try {
      await page.goto(`${BASE}/builder?start=${world.id}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      const frame = page.frames().find(f => f !== page.mainFrame());
      if (!frame) { fail(where, 'no preview frame'); await context.close(); continue; }

      const count = await frame.evaluate(sel => document.querySelectorAll(sel).length, world.piece);
      if (count < world.least) {
        fail(where, `only ${count} of ${world.piece}, expected at least ${world.least}`);
        await context.close();
        continue;
      }

      if (!await openEditor(page)) { fail(where, "no element-editor control"); await context.close(); continue; }

      // Aim at the second one, so a hit on a wrapper reads as a miss.
      const box = await frame.evaluate(sel => {
        const piece = document.querySelectorAll(sel)[1];
        piece.scrollIntoView({ block: 'center' });
        const r = piece.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
      }, world.piece);
      if (box.w < 4 || box.h < 4) { fail(where, `${world.what} is ${Math.round(box.w)}x${Math.round(box.h)}`); await context.close(); continue; }

      // A coordinate below the fold is a real coordinate the mouse cannot
      // reach, and the click lands on nothing while the code is perfectly fine.
      const iframeEl = await page.$('iframe[srcdoc]');
      await iframeEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const iframeBox = await iframeEl.boundingBox();
      const x = iframeBox.x + box.x;
      const y = iframeBox.y + box.y;
      const size = page.viewportSize();
      if (x < 0 || y < 0 || x > size.width || y > size.height) {
        fail(where, `${world.what} sits outside the window at (${Math.round(x)}, ${Math.round(y)})`);
        await context.close();
        continue;
      }

      await page.mouse.click(x, y);
      await page.waitForTimeout(900);

      const selected = await page.evaluate(() => {
        const title = document.querySelector('.bldr-el-panel__title');
        return title ? title.textContent.trim() : null;
      });

      if (!selected) fail(where, `clicking ${world.what} selected nothing`);
      else if (/canvas/i.test(selected)) fail(where, `clicking ${world.what} selected the canvas: "${selected}"`);
      else if (/<body>|<html>/i.test(selected)) fail(where, `clicking ${world.what} selected the whole page: "${selected}"`);
    } catch (e) {
      fail(where, `check could not finish: ${String(e.message).split('\n')[0].slice(0, 110)}`);
    }

    await context.close();
  }

  await browser.close();
  if (!problems.length) {
    console.log(`All ${WORLDS.length} element-built starters are editable piece by piece.`);
  } else {
    console.log(`${problems.length} problem(s):`);
    problems.forEach(p => console.log('  - ' + p));
  }
  process.exitCode = problems.length ? 1 : 0;
}

run().catch(e => { console.error(e); process.exitCode = 1; });
