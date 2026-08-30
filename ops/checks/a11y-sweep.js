// Can everyone use it — not just the kids who see and click like we do?
//
// This repo guards everything obsessively: sitemap dates, lesson counts,
// whether words fit their boxes, whether a page can be reached by taps alone.
// Accessibility was the one area with no guard at all, which is why nobody
// could answer the question when a school procurement form asked it. This is
// the answer: axe-core, the same engine behind Lighthouse's accessibility
// audit, run over every main screen, failing the build on any serious or
// critical violation.
//
// It uses the axe.min.js already in node_modules — no new dependency — and
// the same browser harness as every other check in this folder.

const fs = require('node:fs');
const path = require('node:path');
const { launch } = require('./browser');

const BASE = process.env.CHECK_BASE || 'http://localhost:4599';

const AXE_PATHS = [
  path.join(__dirname, '..', '..', 'node_modules', 'axe-core', 'axe.min.js'),
  path.join(__dirname, '..', '..', 'packages', 'gamified-elearning', 'node_modules', 'axe-core', 'axe.min.js'),
];
const axePath = AXE_PATHS.find(p => fs.existsSync(p));

const SCREENS = [
  { name: 'home', url: '/' },
  { name: 'studio', url: '/builder' },
  { name: 'studio, project open', url: '/builder?start=catch-stars' },
  { name: 'explore', url: '/explore' },
  { name: 'lesson map', url: '/lessons' },
  { name: 'lesson 1', url: '/lesson/1' },
  { name: 'pricing', url: '/pricing' },
  { name: 'login', url: '/login' },
  { name: 'register', url: '/register' },
];

// Serious and critical fail the check. Moderate and minor are reported but
// tolerated, so the check can land green and then be tightened, instead of
// starting red and being ignored.
const FAIL_ON = new Set(['serious', 'critical']);

async function run() {
  if (!axePath) {
    console.error('axe-core not found in node_modules — `npm install` first.');
    process.exitCode = 1;
    return;
  }
  const axeSource = fs.readFileSync(axePath, 'utf8');
  const browser = await launch();
  const failures = [];
  const notes = [];

  for (const screen of SCREENS) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    try {
      await page.goto(BASE + screen.url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await page.evaluate(axeSource);
      const results = await page.evaluate(() => window.axe.run(document, {
        // The generated project preview iframe is the kid's own code, judged
        // by its own tools in the studio, not by this sweep.
        exclude: [['iframe']],
      }));
      for (const violation of results.violations) {
        const line = `${screen.name}: [${violation.impact}] ${violation.id} — ${violation.help}`
          + ` (${violation.nodes.length} element${violation.nodes.length === 1 ? '' : 's'};`
          + ` e.g. ${String(violation.nodes[0]?.target?.[0] || '?').slice(0, 70)})`;
        if (FAIL_ON.has(violation.impact)) failures.push(line);
        else notes.push(line);
      }
    } catch (error) {
      failures.push(`${screen.name}: could not check — ${String(error.message).split('\n')[0].slice(0, 80)}`);
    }
    await context.close();
  }

  await browser.close();

  if (notes.length) {
    console.log(`${notes.length} moderate/minor note(s), tolerated for now:`);
    notes.forEach(n => console.log('  · ' + n));
  }
  if (!failures.length) {
    console.log(`No serious or critical accessibility violations across ${SCREENS.length} screens (axe-core).`);
  } else {
    console.log(`${failures.length} serious/critical accessibility violation(s):`);
    failures.forEach(f => console.log('  - ' + f));
  }
  process.exitCode = failures.length ? 1 : 0;
}

run().catch(error => { console.error(error); process.exitCode = 1; });
