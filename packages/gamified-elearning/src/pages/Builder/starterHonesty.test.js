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
// The studio is in parts now; this reads all of them. See studioSource.js.
const SRC = require('./studioSource').readStudioSource();
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

  test('the interface says plainly that the idea was not built, and how many times it was tried', () => {
    expect(CODE).toMatch(/I tried your idea twice and could not build it/);
    // Round 135: a first attempt may use the whole wait, and then there is
    // no second one to claim.
    expect(CODE).toMatch(/starterRetry\?\.attempts === 1/);
    expect(CODE).toMatch(/Your idea took longer to build than the time I had/);
  });

  // 19 November 2026: the whole site has a ceiling for the day. A starter
  // served because of it is not a build that was tried twice, and trying
  // again in a minute gives the same starter, so there is no button for it.
  test('a starter from the day s ceiling says that, with the hours, and offers no retry', () => {
    expect(CODE).toMatch(/data\.isFallback && data\.rest\?\.hours/);
    expect(CODE).toMatch(/Pixel has built all the new ideas it can for today/);
    expect(CODE).toMatch(/Pixel can build your idea in about \{starterRetry\.rest\} hour/);
    const restNotice = CODE.slice(CODE.indexOf('isStarter && starterRetry?.rest &&'), CODE.indexOf('isStarter && !starterRetry?.rest &&'));
    expect(restNotice.length).toBeGreaterThan(100);
    expect(restNotice).not.toMatch(/<button/);
    expect(restNotice).not.toMatch(/tried your idea/);
  });

  test('a starter is not celebrated as something the child built', () => {
    expect(CODE).toMatch(/if \(!data\.isFallback && !wowShownRef\.current && !quietStudio\)/);
    expect(CODE).not.toMatch(/if \(!wowShownRef\.current && !quietStudio\)/);
  });

  test('a wait of hours is said in hours', () => {
    const { friendlyWait } = require('./studioKit2');
    expect(friendlyWait(45)).toBe('45 seconds');
    expect(friendlyWait(600)).toBe('10 minutes');
    expect(friendlyWait(26220)).toBe('about 8 hours');
    expect(friendlyWait(86400)).toBe('about 24 hours');
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

  test('the browser waits longer than the server\'s whole build budget', () => {
    const m = CODE.match(/buildController\.abort\(\), (\d+)\)/);
    expect(m).not.toBeNull();
    const server = fs.readFileSync(path.join(__dirname, '../../../../codeit-backend/routes/builder.js'), 'utf8');
    const total = Number(server.match(/totalMs:\s*(\d+)/)[1]);
    expect(Number(m[1])).toBeGreaterThan(total);
  });

  test('a long wait is said out loud, and the steps do not finish in three seconds', () => {
    expect(CODE).toMatch(/can take up to three minutes/);
    expect(CODE).not.toMatch(/\[900, 1900, 3100\]/);
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
