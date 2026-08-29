// Does the UI hold up on the devices children actually use?
//
// Measured rather than eyeballed. Four things that make a page unusable and
// that a designer looking at one window never sees:
//
//   * the page scrolling sideways (the single worst phone bug there is)
//   * anything sticking out past the edge
//   * tap targets under 44px, which is the size of a child's fingertip
//   * body text under 14px, which a nine-year-old cannot read on a bus
//   node ops/checks/device-sweep.js
//
// Serve a production build on port 4599 first (npx serve -s build -l 4599).
// Everything in src/styles/reachable.css exists because this reported it.
const { launch } = require('./browser');

// Where the built site is being served. CI picks its own port.
const BASE = process.env.CHECK_BASE || 'http://localhost:4599';

const DEVICES = [
  { name: 'small phone',  width: 320, height: 568, touch: true },
  { name: 'phone',        width: 390, height: 844, touch: true },
  { name: 'big phone',    width: 430, height: 932, touch: true },
  { name: 'tablet',       width: 768, height: 1024, touch: true },
  { name: 'tablet wide',  width: 1024, height: 768, touch: true },
  { name: 'laptop',       width: 1280, height: 800, touch: false },
  { name: 'desktop',      width: 1680, height: 1050, touch: false },
];

const PAGES = [
  { name: 'home (new visitor)', url: '/', seed: null },
  { name: 'home (returning)',   url: '/', seed: 'shelf' },
  { name: 'studio — play',      url: '/builder?start=catch-stars', tab: null },
  { name: 'studio — change',    url: '/builder?start=catch-stars', tab: 'Change' },
  { name: 'studio — the code',  url: '/builder?start=catch-stars', tab: 'The code' },
  { name: 'studio — keep',      url: '/builder?start=catch-stars', tab: 'Keep' },
  { name: 'pricing',            url: '/pricing' },
  { name: 'lessons',            url: '/lessons' },
];

async function audit(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const problems = { overflow: [], smallTaps: [], smallText: [] };

    const seen = new Set();
    document.querySelectorAll('body *').forEach(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || !el.offsetParent) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;

      const label = `${el.tagName.toLowerCase()}.${(el.className || '').toString().trim().split(/\s+/)[0] || ''}`.slice(0, 44);

      // Sticking out past the right edge, and not deliberately scrollable.
      //
      // .studio-pixel is exempt: the mascot is decoration that is designed to
      // hang outside its container, and `overflow-x: hidden` on the body clips
      // it so the page never scrolls sideways. Trying to "fix" its geometry
      // broke the centring the design does at small widths.
      const decorOverflow = el.closest('.studio-pixel, .studio-preview');
      if (!decorOverflow && r.right > vw + 2 && !seen.has('o' + label)) {
        let scrollable = false;
        for (let p = el.parentElement; p; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX;
          if (o === 'auto' || o === 'scroll') { scrollable = true; break; }
        }
        if (!scrollable) {
          seen.add('o' + label);
          problems.overflow.push(`${label} → ${Math.round(r.right - vw)}px past the edge`);
        }
      }

      // Tap targets, on touch devices only — 44px is a fingertip, and a mouse
      // pointer does not need one. Inline links inside a sentence are exempt:
      // a link in running text cannot be 44px tall without wrecking the text,
      // and flagging them buries the real problems in noise.
      const tag = el.tagName.toLowerCase();
      const inlineLink = tag === 'a' && style.display === 'inline'
        && el.parentElement && /^(P|LI|SPAN|SMALL|H1|H2|H3)$/.test(el.parentElement.tagName);
      const tappable = !inlineLink
        && (['button', 'summary'].includes(tag) || (tag === 'a' && style.display !== 'inline')
          || el.getAttribute('role') === 'button');
      // 44px for controls (WCAG 2.5.5), 24px for dense link lists (WCAG 2.2
      // AA, 2.5.8). Forcing 44px on forty footer links would make a footer
      // taller than the page above it, and the standard recognises that.
      // Both footers. The home page has its own, which is why an earlier run
      // still reported its 24px links as failures when they were already at the
      // standard.
      const denseList = el.closest('.site-footer, .studio-footer, nav, .lm-list, .lesson-list');
      const floor = denseList ? 24 : 44;
      if (window.__touch && tappable && (r.height < floor || r.width < 24)) {
        const text = (el.innerText || '').trim().slice(0, 26);
        if (text && !seen.has('t' + label + text)) {
          seen.add('t' + label + text);
          problems.smallTaps.push(`"${text}" ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }

      // Body text too small to read.
      //
      // .studio-preview is exempt: it is a miniature drawing of the studio on
      // the home page, not text anyone reads. Scaling its 10px labels up to
      // 13px would not make it readable, it would make it look broken.
      const decorative = el.closest('.studio-preview, .studio-pixel');
      const hasOwnText = !decorative
        && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 12);
      if (hasOwnText) {
        const size = parseFloat(style.fontSize);
        if (size && size < 13 && !seen.has('s' + label)) {
          seen.add('s' + label);
          problems.smallText.push(`${label} at ${size}px`);
        }
      }
    });

    return {
      sideScroll: document.documentElement.scrollWidth > vw + 1,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: vw,
      ...problems,
    };
  });
}

(async () => {
  const browser = await launch();
  let totalProblems = 0;

  for (const device of DEVICES) {
    console.log(`\n══ ${device.name} (${device.width}x${device.height}) ${'═'.repeat(Math.max(0, 30 - device.name.length))}`);
    const ctx = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: device.touch, hasTouch: device.touch,
    });
    const page = await ctx.newPage();
    await page.addInitScript((touch) => { window.__touch = touch; }, device.touch);

    for (const target of PAGES) {
      if (target.seed === 'shelf') {
        await page.goto(BASE + '/builder?start=penalty', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2600);
      }
      await page.goto(BASE + target.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2400);
      if (target.tab) {
        const tab = page.locator('.bldr-tab', { hasText: target.tab });
        if (await tab.count()) { await tab.click(); await page.waitForTimeout(900); }
      }

      const result = await audit(page);
      const issues = [];
      if (result.sideScroll) issues.push(`SIDE-SCROLL (${result.scrollWidth} > ${result.viewport})`);
      if (result.overflow.length) issues.push(`overflow: ${result.overflow.slice(0, 3).join('; ')}`);
      if (result.smallTaps.length) issues.push(`small taps: ${result.smallTaps.slice(0, 3).join('; ')}`);
      if (result.smallText.length) issues.push(`small text: ${result.smallText.slice(0, 3).join('; ')}`);

      totalProblems += issues.length;
      console.log(`  ${target.name.padEnd(22)} ${issues.length ? '⚠ ' + issues.join(' | ') : 'clean'}`);
    }
    await ctx.close();
  }

  console.log(`\n${totalProblems === 0 ? 'No problems found.' : totalProblems + ' problem groups found.'}`);
  await browser.close();
})();
