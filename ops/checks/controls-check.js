// Does a child dragging a slider actually change their game?
//
// The unit tests prove the parser and the rewriter. They cannot prove that the
// control is reachable, that the running game hears the change, or that the
// code the child later reads matches what they did. Only a browser can.
const { launch } = require('./browser');

const BASE = 'http://localhost:4599';

const SIZES = [
  { name: 'small phone', width: 320, height: 568, touch: true },
  { name: 'phone',       width: 390, height: 844, touch: true },
  { name: 'tablet',      width: 768, height: 1024, touch: true },
  { name: 'laptop',      width: 1280, height: 800, touch: false },
];

const problems = [];
function fail(where, what) { problems.push(`${where}: ${what}`); }

async function run() {
  const browser = await launch();

  for (const size of SIZES) {
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      hasTouch: size.touch,
      isMobile: size.touch,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    const where = size.name;
    process.stdout.write(`  checking ${where} (${size.width}px)...\n`);
    try {

    await page.goto(`${BASE}/builder?start=catch-stars`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);

    // Get to the Change page.
    const changeTab = page.locator('button.bldr-tab', { hasText: /Change/ }).first();
    if (!(await changeTab.count())) { fail(where, 'no Change tab'); await context.close(); continue; }
    // Above 1180px the inline studio bar is deliberately replaced by a fixed
    // toolbar down the side. Same tools, different furniture.
    const wide = size.width >= 1180;
    const studioBar = wide ? '.bldr-creator-toolbar' : '.bldr-studio-bar';
    // Retried rather than slept through. If the studio bounces a child back to
    // Play after they have tapped Change, that is a real bug and the retry
    // count is how we would find out — it is reported, not hidden.
    // Always tap Change first. On a wide screen the toolbar is fixed to the
    // side and is visible on every page, so "can I see the tools" is not the
    // same question as "am I on the page where they do anything".
    let attempts = 1;
    await changeTab.click();
    await page.waitForTimeout(700);
    while (attempts < 4 && !(await page.locator(studioBar).isVisible())) {
      attempts += 1;
      await changeTab.click();
      await page.waitForTimeout(700);
    }
    if (attempts > 1) fail(where, `Change tab needed ${attempts} taps before the studio appeared`);
    if (!(await page.locator(studioBar).isVisible())) {
      fail(where, 'the studio tools never appeared on the Change tab');
      await context.close();
      continue;
    }
    await page.waitForTimeout(300);

    // The Controls tool must be offered for a game that has settings.
    const controlsBtn = page
      .locator(wide ? 'button.bldr-creator-tool' : 'button.bldr-studio-bar__btn', { hasText: 'Controls' })
      .first();
    if (!(await controlsBtn.count())) { fail(where, 'Controls tool missing'); await context.close(); continue; }
    await controlsBtn.scrollIntoViewIfNeeded();
    await controlsBtn.click();
    await page.locator('.bldr-controls').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(400);

    // Every setting in the file should have a control.
    const rows = page.locator('.bldr-control');
    const rowCount = await rows.count();
    if (rowCount < 5) fail(where, `only ${rowCount} controls for a 5-setting game`);

    // The variable name is shown next to the friendly label.
    const varNames = await page.locator('.bldr-control__var').allTextContents();
    for (const wanted of ['fallSpeed', 'starColour', 'startLives']) {
      if (!varNames.includes(wanted)) fail(where, `variable name ${wanted} not shown`);
    }

    // Everything must be big enough to hit and readable.
    const tooSmall = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.bldr-control button, .bldr-control input').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.height < 24) out.push(`${el.className} ${Math.round(r.height)}px`);
      });
      return out;
    });
    tooSmall.forEach(t => fail(where, `control too small: ${t}`));

    // Nothing may push the page sideways.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 2) fail(where, `page overflows by ${overflow}px`);

    // ── The actual test: drag the speed slider and see the file change ──
    const before = await readCode(page);
    const slider = page.locator('#ctl-fallSpeed');
    if (!(await slider.count())) { fail(where, 'fallSpeed has no slider'); await context.close(); continue; }

    // Bring it into view before measuring: a bounding box below the fold is a
    // real coordinate the mouse cannot reach, and dragging at it silently does
    // nothing — which is exactly the bug this found in the product.
    await slider.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const box = await slider.boundingBox();
    if (box.y < 0 || box.y + box.height > size.height) {
      fail(where, `the speed slider sits outside the screen (y=${Math.round(box.y)} on a ${size.height}px screen)`);
    }
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.92, box.y + box.height / 2, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(900);

    const after = await readCode(page);
    if (after === null) { fail(where, 'could not read the code tab'); await context.close(); continue; }
    const beforeSpeed = (before || '').match(/let fallSpeed\s*=\s*([\d.]+)/);
    const afterSpeed = after.match(/let fallSpeed\s*=\s*([\d.]+)/);
    if (!afterSpeed) fail(where, 'fallSpeed declaration gone from the code after a drag');
    else if (beforeSpeed && afterSpeed[1] === beforeSpeed[1]) fail(where, `drag did not change the code (still ${afterSpeed[1]})`);

    // The rest of the file must survive: the USE of fallSpeed is what makes
    // the game work, and rewriting it would change behaviour, not settings.
    if (after && !/star\.y = star\.y \+ fallSpeed/.test(after)) fail(where, 'the place fallSpeed is USED was damaged');

    } catch (error) {
      // One size failing must not hide the other six. A check that stops at the
      // first problem reports one problem however many there are.
      fail(where, `check could not finish: ${String(error.message).split('\n')[0]}`);
    }
    await context.close();
  }

  await browser.close();

  if (problems.length === 0) console.log('No problems found.');
  else { console.log(`${problems.length} problem(s):`); problems.forEach(p => console.log('  - ' + p)); }
  // exitCode rather than process.exit(): exit() tears the process down before
  // a piped stdout has flushed, so `node check.js > out.txt` produced an empty
  // file and a passing exit code — a check that reports nothing looks exactly
  // like a check that found nothing.
  process.exitCode = problems.length ? 1 : 0;
}

// Read the code that is actually running.
//
// Not from the code tab: CodeMirror only renders the lines currently on
// screen, so reading it tells you what the child can see, not what their file
// says. The preview iframe's srcdoc is the whole document the browser is
// running — the same string the studio would save.
async function readCode(page) {
  return page.evaluate(() => {
    const frame = document.querySelector('iframe[srcdoc]');
    return frame ? frame.getAttribute('srcdoc') : null;
  });
}

run().catch(e => { console.error(e); process.exitCode = 1; });
