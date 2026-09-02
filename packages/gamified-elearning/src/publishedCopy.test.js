import fs from 'fs';
import path from 'path';

// ── No em-dashes in anything a visitor reads ─────────────────────────────────
//
// The owner's note, 2 September 2026: "the website has a lot of dashes that
// sound like AI". He is right, and it is not a style preference. A reader who
// spots the pattern stops reading the argument and starts reading the machine
// that wrote it, and on a site whose whole case is "we are honest about what we
// are", that is expensive.
//
// 212 of them were replaced by hand-checked commas, colons and full stops. This
// test is what stops the next one arriving: an em-dash inside anything that
// reaches a screen fails the build.
//
// Comments are exempt. They are for whoever maintains this, not for a visitor,
// and the reasoning in them is worth more than the punctuation rule.
//
// projectName.js is exempt for a different reason: its em-dash is inside a
// regular expression that has to MATCH the dashes children type.
const SRC = __dirname;
const EXEMPT = new Set(['utils/projectName.js']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    // Tests are not copy: they quote the old wording on purpose and they
    // contain the pattern this file searches for.
    else if (/\.jsx?$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

// Blank out // and /* */ comments so only code and copy remain.
function withoutComments(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    if (text.startsWith('/*', i)) {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? text.length : end + 2;
    } else if (text.startsWith('//', i)) {
      const end = text.indexOf('\n', i);
      i = end === -1 ? text.length : end;
    } else {
      out += text[i];
      i += 1;
    }
  }
  return out;
}

const offenders = [];
for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file);
  if (EXEMPT.has(rel)) continue;
  const text = withoutComments(fs.readFileSync(file, 'utf8'));
  let index = text.indexOf('—');
  while (index !== -1) {
    // A lone em-dash in a table cell is the standard way to write "no value",
    // not a sentence written by a machine.
    const around = text.slice(Math.max(0, index - 3), index + 4);
    if (!/['"`]—['"`]/.test(around)) {
      offenders.push(`${rel}: ${text.slice(Math.max(0, index - 45), index + 45).replace(/\s+/g, ' ')}`);
    }
    index = text.indexOf('—', index + 1);
  }
}

describe('published copy', () => {
  test('the scan reads real files, so an empty result means something', () => {
    expect(walk(SRC).length).toBeGreaterThan(100);
    expect(walk(SRC).some(f => f.endsWith('data/guidePages.js'))).toBe(true);
  });

  test('contains no em-dashes', () => {
    expect(offenders).toEqual([]);
  });
});
