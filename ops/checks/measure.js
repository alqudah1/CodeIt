'use strict';

// How much of one colour is on screen inside a project frame.
//
// Canvas games: pixels within a short distance of it. Element pages: elements
// whose computed background or text colour is exactly it. A check that wants
// to know whether a palette did anything reads this before and after, and
// compares. The presence of a panel proves nothing; this does.

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

async function measure(frame, hex) {
  return frame.evaluate((rgb) => {
    const [tr, tg, tb] = rgb;
    let pixels = 0;
    for (const canvas of document.querySelectorAll('canvas')) {
      const ctx = canvas.getContext('2d');
      if (!ctx || !canvas.width || !canvas.height) continue;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const d = Math.abs(data[i] - tr) + Math.abs(data[i + 1] - tg) + Math.abs(data[i + 2] - tb);
        if (d <= 36) pixels += 1;
      }
    }
    const want = `rgb(${tr}, ${tg}, ${tb})`;
    let elements = 0;
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.backgroundColor === want || cs.color === want) elements += 1;
    }
    return { pixels, elements, canvases: document.querySelectorAll('canvas').length };
  }, hexToRgb(hex));
}

/** Did the colour arrive on screen between two measurements? */
function arrived(before, after) {
  if (after.canvases) return after.pixels >= before.pixels + 60 && after.pixels >= 3 * Math.max(before.pixels, 1);
  return after.elements > before.elements;
}

function describe(before, after) {
  return after.canvases
    ? `canvas pixels ${before.pixels} → ${after.pixels}`
    : `elements ${before.elements} → ${after.elements}`;
}

module.exports = { arrived, describe, hexToRgb, measure };
