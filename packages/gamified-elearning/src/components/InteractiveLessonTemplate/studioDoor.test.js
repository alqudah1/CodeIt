const fs = require('fs');
const path = require('path');

// The lesson-to-studio bridge, guarded.
//
// Production on 1 Sept: 236 learners had finished a lesson, 23 had ever made
// a project. The end of a lesson pointing at the next lesson is the cheapest
// explanation for that gap, so the studio door became the primary button.
//
// This test exists because that is a one-line change to undo by accident. It
// asserts the shape of the decision, not the wording, so copy can still be
// rewritten without a red build.
const SRC = fs.readFileSync(path.join(__dirname, 'InteractiveLessonTemplate.js'), 'utf8');

// Comments are stripped first. A test that passes because the word it wants
// appears in a comment is a test that trains people to ignore tests.
const CODE = SRC
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter(line => !line.trim().startsWith('//'))
  .join('\n');

describe('the studio door at the end of a lesson', () => {
  test('the studio button carries the primary class', () => {
    expect(CODE).toMatch(/sl-completion-card__btn--primary sl-completion-card__btn--studio/);
  });

  test('the quiz / next-lesson button steps down when a studio prompt exists', () => {
    expect(CODE).toMatch(/studioPrompt \? 'sl-completion-card__btn--builder' : 'sl-completion-card__btn--primary'/);
  });

  test('the studio prompt is read once, so every label names the same project', () => {
    const calls = CODE.match(/builderPromptFor\(id\)/g) || [];
    expect(calls).toHaveLength(1);
  });

  test('the journey keeps its own door rather than being sent to the studio', () => {
    expect(CODE).toMatch(/completionData\.fromJourney \? null : lessonPrompt/);
  });

  test('the click is measurable, or the test it belongs to cannot be read', () => {
    expect(CODE).toMatch(/trackEvent\('lesson_to_studio'/);
  });

  test('the studio link says where it came from', () => {
    expect(CODE).toMatch(/from=lesson-\$\{id\}/);
  });
});
