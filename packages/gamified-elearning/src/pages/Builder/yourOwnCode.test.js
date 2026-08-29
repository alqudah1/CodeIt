import { whatIsHere, whereMyCodeStarts } from './yourOwnCode';
import { STARTER_PROJECTS } from './starterProjects';

// ── Opening a file where the child is, not where the file is ─────────────────
//
// The code tab opened at line 1 — <!doctype html>, <html>, <head>, a viewport
// meta tag, and then sixty lines of CSS. Two hundred lines in the file and
// nothing recognisable until past seventy.

test('it opens at the settings block when a project marks one', () => {
  const code = [
    '<!doctype html>',            // 1
    '<html><head><style>',        // 2
    '  body { margin: 0 }',       // 3
    '</style></head><body>',      // 4
    '<script>',                   // 5
    '// ── Change these and watch what happens ──',  // 6
    'let fallSpeed = 3;',         // 7
  ].join('\n');
  expect(whereMyCodeStarts(code)).toBe(6);
});

test('without a marker it opens at the first real line of code', () => {
  const code = [
    '<!doctype html>',        // 1
    '<style>a{}</style>',     // 2
    '<script>',               // 3
    '',                       // 4
    '// a comment',           // 5
    'let score = 0;',         // 6
  ].join('\n');
  expect(whereMyCodeStarts(code)).toBe(6);
});

test('an external script is not the child’s code', () => {
  const code = [
    '<html>',                                        // 1
    '<script src="https://example.com/x.js"></script>', // 2
    '<script>',                                      // 3
    'let a = 1;',                                    // 4
  ].join('\n');
  expect(whereMyCodeStarts(code)).toBe(4);
});

test('a page with no code at all opens at the top', () => {
  expect(whereMyCodeStarts('<html><body><h1>hi</h1></body></html>')).toBe(1);
});

test('nonsense does not throw', () => {
  for (const input of [null, undefined, 42, {}, [], '']) {
    expect(() => whereMyCodeStarts(input)).not.toThrow();
    expect(whereMyCodeStarts(input)).toBe(1);
    expect(() => whatIsHere(input)).not.toThrow();
  }
});

test('it says what it opened at, so the jump is not a mystery', () => {
  expect(whatIsHere('<script>\n// ── Change these and watch what happens ──\nlet a=1;'))
    .toMatch(/settings you can change/);
  expect(whatIsHere('<script>let a = 1;</script>')).toMatch(/starts working/);
  expect(whatIsHere('<h1>no code here</h1>')).toBeNull();
});

// ── The real projects ────────────────────────────────────────────────────────

describe.each(STARTER_PROJECTS.map(p => [`${p.kind}: ${p.label}`, p]))('%s', (label, project) => {
  test('opens past the boilerplate, not at <!doctype html>', () => {
    const at = whereMyCodeStarts(project.code);
    const lines = project.code.split('\n');

    expect(at).toBeGreaterThan(1);
    expect(lines[at - 1]).not.toMatch(/<!doctype|<html|<head|<meta|<title/i);

    // And it must be a real line in the file, not past the end.
    expect(at).toBeLessThanOrEqual(lines.length);
  });

  test('the line it opens at is one a child would recognise', () => {
    const at = whereMyCodeStarts(project.code);
    const line = project.code.split('\n')[at - 1].trim();
    // Either the settings marker, or a line of actual JavaScript.
    expect(line.length).toBeGreaterThan(0);
    expect(line).not.toMatch(/^<(style|link|meta)/i);
  });
});

test('every starter skips a real amount of machinery', () => {
  // If this ever reported 1 for everything, the feature would be doing nothing
  // while looking like it worked.
  const jumps = STARTER_PROJECTS.map(p => whereMyCodeStarts(p.code));
  const median = jumps.slice().sort((a, b) => a - b)[Math.floor(jumps.length / 2)];
  expect(median).toBeGreaterThan(30);
});
