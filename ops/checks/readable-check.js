// Can a child read every word on the screen?
//
// The owner photographed a classroom monitor showing this:
//
//     ✓ Pla     Chi    Pla   Save
//       eve  2  one 3  it  4 your
//            thi     ag     work
//
// Those are the four steps that tell a child what to do next — "Play
// everything", "Change one thing", "Play it again", "Save your work" — crushed
// into four forced columns and clipped mid-word. It was the least readable
// thing on the screen and it was the instructions.
//
// Every unit test passed. The device sweep passed. Nothing looks at whether
// text actually fits inside the box drawn around it, so nothing could have
// found it. This does.
//
// Two questions per element, both of which only a browser can answer:
//   1. is the text clipped by its own container?
//   2. is it smaller than this project's 13px floor?
const { launch } = require('./browser');

const BASE = process.env.CHECK_BASE || 'http://localhost:4599';

// Real states, not just routes: half of these only exist once a project does.
const SCREENS = [
  { name: 'studio, empty', url: '/builder' },
  { name: 'studio, project open', url: '/builder?start=catch-stars' },
  { name: 'studio, a quiz open', url: '/builder?start=quiz-animals' },
  { name: 'studio, a shop open', url: '/builder?start=site-cupcakes' },
  { name: 'home', url: '/' },
  { name: 'lesson map', url: '/lessons' },
  { name: 'lesson 1', url: '/lesson/1' },
  { name: 'pricing', url: '/pricing' },
];

const SIZES = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
];

const FLOOR = 13;   // px. Below this a seven-year-old is guessing.

const problems = [];

async function inspect(page) {
  return page.evaluate(floor => {
    const found = [];
    const seen = new Set();

    for (const el of document.querySelectorAll('body *')) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;

      const box = el.getBoundingClientRect();
      if (box.width < 4 || box.height < 4) continue;

      // Only elements that own their text, so a wrapper is not blamed for its
      // child's words.
      const text = [...el.childNodes]
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent.trim())
        .join(' ')
        .trim();
      if (!text || text.length < 2) continue;

      const key = text.slice(0, 40) + '|' + el.className;
      if (seen.has(key)) continue;
      seen.add(key);

      const size = parseFloat(style.fontSize);

      // Clipped: the element's own content does not fit the box it was given,
      // and it is not deliberately scrollable or deliberately truncated.
      const scrolls = /auto|scroll/.test(style.overflow + style.overflowX + style.overflowY);
      const ellipsis = style.textOverflow === 'ellipsis';
      const clipped = !scrolls && !ellipsis
        && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
        && style.overflow !== 'visible';

      if (clipped || size < floor) {
        found.push({
          text: text.slice(0, 46),
          cls: String(el.className).split(' ')[0].slice(0, 34),
          size: Math.round(size * 10) / 10,
          clipped,
          tooSmall: size < floor,
        });
      }
    }
    return found;
  }, FLOOR);
}

async function run() {
  const browser = await launch();

  for (const size of SIZES) {
    for (const screen of SCREENS) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        hasTouch: size.name === 'phone',
        isMobile: size.name === 'phone',
      });
      const page = await context.newPage();
      try {
        await page.goto(BASE + screen.url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2600);
        for (const bad of await inspect(page)) {
          const why = bad.clipped
            ? (bad.tooSmall ? `clipped, and ${bad.size}px` : 'clipped by its own box')
            : `${bad.size}px, under the ${FLOOR}px floor`;
          problems.push(`${screen.name} @ ${size.name}: .${bad.cls} — ${why}\n        "${bad.text}"`);
        }
      } catch (error) {
        problems.push(`${screen.name} @ ${size.name}: could not check — ${String(error.message).split('\n')[0].slice(0, 80)}`);
      }
      await context.close();
    }
  }

  await browser.close();

  if (!problems.length) {
    console.log(`Every word fits its box and clears ${FLOOR}px, across ${SCREENS.length} screens at ${SIZES.length} sizes.`);
  } else {
    console.log(`${problems.length} unreadable thing(s):`);
    problems.forEach(p => console.log('  - ' + p));
  }
  process.exitCode = problems.length ? 1 : 0;
}

run().catch(error => { console.error(error); process.exitCode = 1; });
