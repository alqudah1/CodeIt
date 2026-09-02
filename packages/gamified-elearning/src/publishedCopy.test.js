import fs from 'fs';
import path from 'path';
import * as parser from '@babel/parser';

// ── No em-dashes in anything a visitor reads ─────────────────────────────────
//
// The owner's note, 2 September 2026: "the website has a lot of dashes that
// sound like AI". A reader who spots the pattern stops reading the argument and
// starts reading the machine that wrote it, and on a site whose whole case is
// "we are honest about what we are", that is expensive.
//
// ── Why this file was rewritten the day after it was written ─────────────────
//
// The first version of this guard blanked comments with string matching: skip
// from `//` to the end of the line, skip from `/*` to `*/`. Both rules are
// wrong inside a markdown template literal.
//
// Every guide line containing a link contains `https://`, and the `//` in it
// made the rest of that line invisible to the scan. The guides are one long
// template literal full of links, so the sweep that used the same logic missed
// 37 em-dashes and this test then reported the file clean. A second reader
// counted them by hand and was right.
//
// So the comments are now located by parsing the file. @babel/parser reports
// every comment's exact character range, including JSX comments, and a `//`
// inside a string is a string, not a comment.
//
// Comments themselves are exempt. They are for whoever maintains this, not for
// a visitor, and the reasoning in them is worth more than the punctuation rule.
const SRC = __dirname;

// Three exceptions, each visible here rather than buried in a config.
//
// 1. Two quotations. Google's own published wording for CS First contains an
//    em-dash. A quotation is reproduced or it is not used; it is never edited
//    to fit our house style. Round 71 edited one of these by accident, which is
//    exactly why they are named here now.
// 2. Anything on a line carrying the marker `allow-em-dash`, with its reason
//    written next to it: today the empty-cell mark in the internal funnel table
//    and the regex in projectName.js that has to MATCH the dashes kids type.
// 3. Tests, which quote old wording on purpose.
const QUOTED_VERBATIM = [
  'CS First is totally free of charge',
  'totally free of charge',
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function commentRanges(text, file) {
  const ast = parser.parse(text, {
    sourceType: 'unambiguous',
    plugins: ['jsx'],
    errorRecovery: true,
    ranges: true,
  });
  if (ast.errors && ast.errors.length) {
    throw new Error(`${file} did not parse cleanly: ${ast.errors[0].reasonCode}`);
  }
  return (ast.comments || []).map(c => [c.start, c.end]);
}

const files = walk(SRC);
const offenders = [];
const allowed = [];

for (const file of files) {
  const rel = path.relative(SRC, file);
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('—')) continue;
  const ranges = commentRanges(text, rel);
  const lines = text.split('\n');

  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== '—') continue;
    if (ranges.some(([a, b]) => i >= a && i < b)) continue;

    const lineNumber = text.slice(0, i).split('\n').length;
    const line = lines[lineNumber - 1] || '';
    // The marker may sit a line or two above: a reason worth writing usually
    // takes more than one line.
    const previous = lines.slice(Math.max(0, lineNumber - 4), lineNumber - 1).join('\n');
    const window = text.slice(Math.max(0, i - 120), i + 120);

    const isQuotation = QUOTED_VERBATIM.some(q => window.includes(q));
    const isMarked = /allow-em-dash/.test(line) || /allow-em-dash/.test(previous);
    if (isQuotation || isMarked) {
      allowed.push(`${rel}:${lineNumber}`);
      continue;
    }
    offenders.push(`${rel}:${lineNumber} ${line.slice(Math.max(0, line.indexOf('—') - 60), line.indexOf('—') + 60).trim()}`);
  }
}

describe('published copy', () => {
  test('the scan reads real files, so an empty result means something', () => {
    expect(files.length).toBeGreaterThan(100);
    expect(files.some(f => f.endsWith('data/guidePages.js'))).toBe(true);
  });

  test('the scan can tell a comment from a link', () => {
    // The bug this whole file exists to prevent: `https://` read as a comment.
    const sample = 'const a = `see https://x.test/y — and more`; // real — comment\n';
    const ranges = commentRanges(sample, 'sample');
    const dash = sample.indexOf('—');
    expect(ranges.some(([a, b]) => dash >= a && dash < b)).toBe(false);
    const second = sample.indexOf('—', dash + 1);
    expect(ranges.some(([a, b]) => second >= a && second < b)).toBe(true);
  });

  test('the exceptions are the ones written down here, and no others', () => {
    // If this count moves, someone added an exception. That should be a
    // decision, not a diff nobody read.
    expect(allowed.sort()).toEqual([
      'data/guidePages.js:1494',
      'data/guidePages.js:1598',
      'pages/Admin/AdminFunnel.js:338',
      'utils/projectName.js:30',
    ]);
  });

  test('contains no em-dashes', () => {
    expect(offenders).toEqual([]);
  });
});
