import fs from 'fs';
import path from 'path';

// ── The tab called "The code" must show the code ─────────────────────────────
//
// A person reported: "when he presses on learn the screen is empty". It was.
// The CodePanel block had been pasted INSIDE the header of the concept list,
// so one condition rendered both:
//
//     {onTab('learn') && conceptsFound.length > 0 && (
//       <div className="bldr-lessons-used">
//         ...
//         <span className="bldr-lessons-used__sub">
//           {conceptSummary(conceptsFound)} Tap any one to learn it properly.
//           {onTab('learn') && code && (<CodePanel ... />)}     <-- here
//
// codeConcepts.js reads the child's own code and reports only what it finds, so
// conceptsFound is empty whenever a project uses nothing it recognises. Every
// one of those projects opened a blank tab, and a blank tab teaches a child
// that the button is broken.
//
// The whole product claim is that a child learns the code behind what they
// built. This is the tab where that happens.
const SRC = fs.readFileSync(path.join(__dirname, 'Builder.js'), 'utf8');

// The concepts block, from its condition to the end of its list.
const conceptsStart = SRC.indexOf("{onTab('learn') && conceptsFound.length > 0 && (");
const conceptsEnd = SRC.indexOf("{onTab('learn') && code && conceptsFound.length === 0", conceptsStart);
const conceptsBlock = SRC.slice(conceptsStart, conceptsEnd);

describe('the code tab', () => {
  test('the blocks this test reads still exist', () => {
    expect(conceptsStart).toBeGreaterThan(-1);
    expect(conceptsEnd).toBeGreaterThan(conceptsStart);
  });

  test('the editor is its own block, not nested in the concept list', () => {
    expect(conceptsBlock).not.toContain('<CodePanel');
    expect(SRC).toMatch(/\{onTab\('learn'\) && code && \(\s*\n\s*<CodePanel/);
  });

  test('the editor renders whenever there is code, whatever the concepts say', () => {
    // The editor's condition must not mention conceptsFound at all.
    const editorCondition = SRC.slice(
      SRC.indexOf("{onTab('learn') && code && ("),
      SRC.indexOf('<CodePanel'),
    );
    expect(editorCondition).not.toContain('conceptsFound');
  });

  test('a project that matched no lesson still says something', () => {
    expect(SRC).toContain("{onTab('learn') && code && conceptsFound.length === 0 && (");
    expect(SRC).toContain('Nothing in this project lines up with a lesson yet');
  });

  test('the door to the lesson behind the project is on the banner, not only in a tab', () => {
    // A tab is something you have to know to look for. The claim the product
    // makes deserves a sentence a child can read without hunting for it.
    expect(SRC).toContain('Learn the code behind it');
    expect(SRC).toMatch(/trackEvent\('learn_the_code_behind'/);
    // And it is never offered when the tab it opens would have nothing in it.
    expect(SRC).toMatch(/\{conceptsFound\.length > 0 && \(\s*\n\s*<button/);
  });
});
