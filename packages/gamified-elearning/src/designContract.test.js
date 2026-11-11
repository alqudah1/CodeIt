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

describe('the design contract: one host', () => {
  // A school in North Yorkshire wrote in on 10 November 2026: the teacher
  // could open the lessons and the pupils could not, because the school's
  // filter allowed codeitlearn.com and not the hosts the page fetched from.
  // Everything the app needs ships with it or is proxied through its own
  // domain: the fonts from the @fontsource packages, Python through the
  // /pyodide rewrite in vercel.json. No stylesheet or script may be loaded
  // from another host.
  test('index.html loads nothing from another host', () => {
    const html = fs.readFileSync(path.join(SRC, '..', 'public', 'index.html'), 'utf8');
    const external = [...html.matchAll(/<(?:link|script)[^>]+(?:href|src)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('https://codeitlearn.com'));
    expect(external).toEqual([]);
  });

  test('Python is fetched from this site before any CDN', () => {
    const loader = fs.readFileSync(path.join(SRC, 'utils', 'pyodideLoader.js'), 'utf8');
    const vercel = JSON.parse(fs.readFileSync(path.join(SRC, '..', '..', '..', 'vercel.json'), 'utf8'));
    expect(loader).toMatch(/\/pyodide\/v\$\{PYODIDE_VERSION\}\/full\//);
    const rewrite = vercel.rewrites.find((r) => r.source === '/pyodide/:path*');
    expect(rewrite?.destination).toBe('https://cdn.jsdelivr.net/pyodide/:path*');
    // The SPA catch-all must come after it, or the rewrite never fires.
    const i = vercel.rewrites.indexOf(rewrite);
    const spa = vercel.rewrites.findIndex((r) => r.destination === '/index.html');
    expect(i).toBeLessThan(spa);
  });

  test('the fonts ship with the app', () => {
    const arcade = fs.readFileSync(path.join(SRC, 'styles', 'arcade.css'), 'utf8');
    expect(arcade).toMatch(/@import '@fontsource\/baloo-2\/800\.css'/);
    expect(arcade).toMatch(/@import '@fontsource\/nunito\/800\.css'/);
  });
});
