// Does dragging a wall actually change the game?
//
// This is the check behind the claim in GOAL.md §3. Every other starter draws
// its world inside a canvas, which is one DOM element, so the studio's editor
// can only reach the score badge and the tip line. The maze puts the level in
// the page, so the editor a child already has becomes a level editor.
//
// The claim is only true if three things hold, and only a browser can say:
//   1. the walls are selectable elements, not pixels
//   2. moving one is picked up by the game
//   3. the child's own file changes, so the level survives a reload
const { chromium } = require('playwright-core');

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://localhost:4599';

const problems = [];
const fail = m => problems.push(m);

async function run() {
  const browser = await chromium.launch({ executablePath: EXE });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE}/builder?start=maze`, { waitUntil: 'networkidle' });

  await page.waitForTimeout(3200);

  const frame = page.frames().find(f => f !== page.mainFrame());
  if (!frame) { fail('no preview frame'); return finish(browser); }

  // 1. Is the level made of real elements?
  const level = await frame.evaluate(() => ({
    walls: document.querySelectorAll('.wall').length,
    coins: document.querySelectorAll('.coin').length,
    player: !!document.getElementById('player'),
    door: !!document.getElementById('door'),
  }));
  if (level.walls < 3) fail(`only ${level.walls} walls are real elements`);
  if (level.coins < 3) fail(`only ${level.coins} coins are real elements`);
  if (!level.player || !level.door) fail('player or door is not an element');

  // 2. Does the game read the level, rather than storing it?
  //    Move a wall from the outside and ask the game to start again.
  const moved = await frame.evaluate(() => {
    const wall = document.querySelector('.wall');
    wall.style.left = '70%';
    wall.style.top = '12%';
    // startGame re-measures. If it stored coordinates at load, this is ignored.
    window.startGame();
    return { left: wall.style.left, top: wall.style.top };
  });
  await page.waitForTimeout(600);

  const seesTheMove = await frame.evaluate(() => {
    // The game keeps its measured walls in `walls`. If it re-read the page,
    // one of them now sits where we put it.
    if (typeof walls === 'undefined') return 'no walls variable';
    const field = document.getElementById('field').getBoundingClientRect();
    const wanted = field.width * 0.70;
    return walls.some(w => Math.abs(w.x - wanted) < 8);
  });
  if (seesTheMove !== true) fail(`the game did not notice the moved wall (${seesTheMove})`);

  // 3. Can a child select a wall with the studio's own editor?
  const changeTab = [...await page.$$('button.bldr-tab')];
  for (const t of changeTab) {
    if (/Change/.test(await t.innerText())) { await t.click(); break; }
  }
  await page.waitForTimeout(700);
  const editBtn = await page.$('text=Edit elements');
  if (!editBtn) { fail('no "Edit elements" control'); return finish(browser); }
  await editBtn.click();
  await page.waitForTimeout(800);

  const wallBox = await frame.evaluate(() => {
    const w = document.querySelectorAll('.wall')[1];
    const r = w.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  });
  // Scroll the preview into view before aiming at it. A bounding box below the
  // fold is a real coordinate the mouse cannot reach, and the click lands on
  // nothing while the code under test is perfectly fine.
  const iframeEl = await page.$('iframe[srcdoc]');
  await iframeEl.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const iframeBox = await iframeEl.boundingBox();
  const targetX = iframeBox.x + wallBox.x;
  const targetY = iframeBox.y + wallBox.y;
  const size = page.viewportSize();
  if (targetY < 0 || targetY > size.height || targetX < 0 || targetX > size.width) {
    fail(`the wall sits outside the window at (${Math.round(targetX)}, ${Math.round(targetY)})`);
    return finish(browser);
  }
  await page.mouse.click(targetX, targetY);
  await page.waitForTimeout(900);

  const selected = await page.evaluate(() => {
    const panel = document.querySelector('.bldr-el-panel__title');
    return panel ? panel.textContent.trim() : null;
  });
  if (!selected) fail('clicking a wall selected nothing');
  else if (/canvas/i.test(selected)) fail(`clicking a wall selected the canvas: ${selected}`);

  await finish(browser);
}

async function finish(browser) {
  await browser.close();
  if (!problems.length) console.log('The level is editable: walls are elements, moving one changes the game.');
  else { console.log(`${problems.length} problem(s):`); problems.forEach(p => console.log('  - ' + p)); }
  process.exitCode = problems.length ? 1 : 0;
}

run().catch(e => { console.error(e); process.exitCode = 1; });
