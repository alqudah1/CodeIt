const fs = require('fs');
const path = require('path');

// ── The studio must never present a starter as the child's idea ──────────────
//
// Walked live on 1 September 2026, signed in, three prompts in a row:
//   "a game where a cat jumps over boxes"  ->  "Click the stars before they
//                                               disappear!"  (cat: 0, box: 0)
//   "a website about my dog Rex"           ->  About / Features / Contact
//                                               (Rex: 0, dog: 0)
//   "a quiz about sharks with five questions" -> "3 sample questions"
//                                               (shark: 0, and three not five)
//
// The server serves a canned starter when it cannot reach the model. That is a
// reasonable thing to do. What was not reasonable is that the studio then put
// the child's own words in the heading above it and called it ready.
//
// This test guards the honesty, not the wording.
const SRC = fs.readFileSync(path.join(__dirname, 'Builder.js'), 'utf8');
const CODE = SRC
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');

describe('a starter is never dressed up as the child s project', () => {
  test('the fallback flag is carried into the interface, not swallowed', () => {
    expect(CODE).toMatch(/setIsStarter\(Boolean\(data\.isFallback\)\)/);
  });

  test('a starter does not take the title made from the child s words', () => {
    expect(CODE).toMatch(/setAiTitle\(data\.isFallback \? '' : \(data\.title \|\| ''\)\)/);
  });

  test('the interface says plainly that the idea was not built, and that it was tried twice', () => {
    expect(CODE).toMatch(/I tried your idea twice and could not build it/);
  });

  test('the retry button says what it will do differently, and does it', () => {
    // Rounds 66 and 67: not "press Build again yourself". The server has
    // already tried twice; a third go starts on the next model up and gets
    // more time, and the button says so.
    expect(CODE).toMatch(/Try again on the bigger model/);
    expect(CODE).toMatch(/Try again with more time/);
    expect(CODE).toMatch(/setPrompt\(builtPrompt\); callBuilder\(builtPrompt, \{ escalate: true \}\)/);
    expect(CODE).toMatch(/escalate \? \{ prompt: text, escalate: true \} : \{ prompt: text \}/);
  });

  test('the browser waits long enough for both server attempts', () => {
    const m = CODE.match(/buildController\.abort\(\), (\d+)\)/);
    expect(m).not.toBeNull();
    expect(Number(m[1])).toBeGreaterThanOrEqual(150000);
  });

  test('the starter state resets, so one bad build does not label the next one', () => {
    expect((CODE.match(/setIsStarter\(false\)/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  test('the old line that called a template ready is gone', () => {
    expect(CODE).not.toMatch(/Starter ready\. Add your own details next/);
  });

  // Two smaller findings from the same walkthrough.
  test('Pixel names the colour the build button actually is', () => {
    expect(CODE).not.toMatch(/purple button/i);
    expect(CODE).toMatch(/orange button/i);
  });

  test('starting over clears the box instead of appending to the last idea', () => {
    expect(CODE).toMatch(/setPrompt\(opening \? '' : builtPrompt\)/);
  });
});
