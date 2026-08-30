// ── The design contract, as a test ───────────────────────────────────────────
//
// The walkthrough found the returning-kid home page rendering its headline in
// Georgia serif, because a stylesheet asked for "Arvo" — a font this app has
// never loaded — and the browser fell back through the stack. One hundred and
// fifty declarations named that ghost font. All are gone now, and this test is
// what keeps them gone: the product has exactly two faces, Baloo 2 for display
// and Nunito for body, and no declaration may fall back to a serif.

const fs = require('fs');
const path = require('path');

function cssFiles(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) cssFiles(full, found);
    else if (entry.name.endsWith('.css')) found.push(full);
  }
  return found;
}

const SRC = __dirname;
const files = cssFiles(SRC);

describe('the design contract: type', () => {
  test('the ghost font "Arvo" never returns', () => {
    const offenders = [];
    for (const file of files) {
      const css = fs.readFileSync(file, 'utf8');
      // The one historical comment in HomeStudio.css that EXPLAINS the Arvo
      // removal is allowed; a declaration is not.
      css.split('\n').forEach((line, i) => {
        if (/font(-family)?\s*:[^;]*Arvo/i.test(line)) {
          offenders.push(`${path.relative(SRC, file)}:${i + 1}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  test('no declaration falls back to a serif', () => {
    const offenders = [];
    for (const file of files) {
      const css = fs.readFileSync(file, 'utf8');
      css.split('\n').forEach((line, i) => {
        // "serif" as a standalone fallback; "sans-serif" is fine.
        if (/font(-family)?\s*:[^;]*(?<!sans-)\bserif\b/.test(line) && !/sans-serif\s*[;}]?\s*$/.test(line.trim())) {
          if (!/sans-serif/.test(line) || /,\s*serif/.test(line)) {
            offenders.push(`${path.relative(SRC, file)}:${i + 1}: ${line.trim().slice(0, 80)}`);
          }
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});
