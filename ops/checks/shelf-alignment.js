#!/usr/bin/env node
'use strict';

// ── Every cabinet on a shelf is the same height ──────────────────────────────
//
// Spotted on a phone on 2 September 2026. "Catch the falling stars" wraps to
// two lines and "Penalty shootout" does not, so the two cabinets beside each
// other were different heights and their PLAY buttons sat at different levels.
// Measured before the fix: one row held cards of 199, 180 and 217 pixels.
//
// A shelf of arcade cabinets is a row of equal things. Ragged ones read as a
// mistake and the eye has to hunt for each button. This is the kind of thing
// nobody files a bug about and everybody notices.
//
//   node ops/checks/shelf-alignment.js [baseUrl]
//
// Checked at three widths, because the whole cause was a title wrapping at one
// width and not another.

const BASE = process.argv[2] || 'http://localhost:4599';
const { chromium } = require(require('path').join(__dirname, '../../node_modules/playwright-core'));

const SIZES = [
  ['phone', 390, 844],
  ['tablet', 768, 1024],
  ['classroom', 1366, 768],
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox'],
  });
  let failed = 0;

  for (const [name, width, height] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/builder`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const rows = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.bldr-shelf__row').forEach((row, i) => {
        const top = row.getBoundingClientRect().top;
        out.push({
          row: i,
          heights: [...new Set([...row.querySelectorAll('.bldr-shelf__card')]
            .map(c => Math.round(c.getBoundingClientRect().height)))],
          // The shelf wraps into a grid (rounds 66 and 67: no card cut at the
          // edge), so PLAY lines are compared within each visual row: every
          // button on a row sits on the same line as its neighbours.
          playOffsets: [...new Set([...row.querySelectorAll('.bldr-shelf__card')]
            .map(c => {
              const play = c.querySelector('.bldr-shelf__play');
              const r = c.getBoundingClientRect();
              return play ? `${Math.round(r.top - top)}:${Math.round(play.getBoundingClientRect().bottom - r.top)}` : null;
            })
            .filter(Boolean))]
            // one entry per visual row is the goal; more than one PLAY line
            // on the same row is the failure
            .reduce((acc, key) => { const [row, off] = key.split(':'); acc[row] = acc[row] || []; if (!acc[row].includes(off)) acc[row].push(off); return acc; }, {}),
        });
      });
      return out;
    });

    if (!rows.length) {
      console.error(`FAIL  ${name}: no shelves found. The selector or the page changed.`);
      failed += 1;
    }
    for (const r of rows) {
      if (r.heights.length > 1) {
        console.error(`FAIL  ${name}: shelf ${r.row} has cabinets of ${r.heights.join(', ')} px.`);
        failed += 1;
      } else {
        const uneven = Object.entries(r.playOffsets).filter(([, offs]) => offs.length > 1);
        if (uneven.length) {
          console.error(`FAIL  ${name}: shelf ${r.row} PLAY buttons on one row sit at ${uneven.map(([row, offs]) => `${row}: ${offs.join('/')}`).join('; ')} px.`);
          failed += 1;
        } else {
          console.log(`ok    ${name}: shelf ${r.row}, ${r.heights[0]} px, one PLAY line per row.`);
        }
      }
    }
    await ctx.close();
  }

  await browser.close();
  if (failed) { console.error(`\n${failed} shelf problem(s).`); process.exit(1); }
  console.log('\nEvery shelf is level.');
})().catch(err => { console.error('FAIL ', err.message); process.exit(1); });
