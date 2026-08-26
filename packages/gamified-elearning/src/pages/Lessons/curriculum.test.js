import { LESSONS, TOTAL_LESSONS } from './lessonRegistry';
import { blankCount } from '../../components/InteractiveLessonTemplate/interactionGrading';

// ── Is every lesson actually finished? ───────────────────────────────────────
//
// Thirty-one lessons is a number nobody can check by eye, and the ways a lesson
// half-exists are quiet ones: a predict step whose `correct` points past the end
// of its choices, a fill-in-the-blank with two gaps and one answer, an ordering
// step whose shuffled lines are not the same lines as the answer. None of those
// crash. They just tell a child they are wrong when they are right, and there is
// no adult in the room to say otherwise.
//
// This test is the adult in the room.

const INTERACTIVE = ['predict', 'fillblank', 'order'];
const CODE_STEPS = ['example', 'tryit', 'challenge'];
const KNOWN = ['concept', ...INTERACTIVE, ...CODE_STEPS];

const each = LESSONS.map(entry => [`${entry.data.id}. ${entry.data.title}`, entry]);

test('the curriculum is thirty-one lessons, numbered without gaps', () => {
  expect(TOTAL_LESSONS).toBe(31);
  const ids = LESSONS.map(entry => entry.data.id);
  expect(ids).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
});

describe.each(each)('Lesson %s', (label, entry) => {
  const lesson = entry.data;

  test('has everything a child sees before they start', () => {
    expect(typeof lesson.title).toBe('string');
    expect(lesson.title.length).toBeGreaterThan(3);
    expect(typeof lesson.subtitle).toBe('string');
    expect(lesson.subtitle.length).toBeGreaterThan(10);
    expect(typeof lesson.emoji).toBe('string');
    expect(lesson.emoji.length).toBeGreaterThan(0);
    expect(typeof lesson.story).toBe('string');
    expect(lesson.story.length).toBeGreaterThan(20);
    // Lessons 1-16 carry XP on each step; 17-31 carry it on the lesson. Either
    // is fine, nothing at all is not.
    const stepXp = (lesson.steps || []).reduce((sum, step) => sum + (Number(step.xp) || 0), 0);
    expect((Number(lesson.xp) || 0) + stepXp).toBeGreaterThan(0);
  });

  test('is listed on the map with somewhere to go afterwards', () => {
    expect(typeof entry.unit).toBe('string');
    expect(entry.unit.length).toBeGreaterThan(0);
    expect(entry.summary.length).toBeGreaterThan(15);
    expect(entry.builderPrompt.length).toBeGreaterThan(10);
    expect(entry.seoTitle.length).toBeGreaterThan(5);
    // Google truncates around 160 characters, and a cut-off sentence reads as
    // an abandoned page.
    expect(entry.seoDesc.length).toBeGreaterThan(70);
    expect(entry.seoDesc.length).toBeLessThanOrEqual(160);
  });

  test('is more than a wall of reading', () => {
    expect(Array.isArray(lesson.steps)).toBe(true);
    expect(lesson.steps.length).toBeGreaterThanOrEqual(4);

    const types = lesson.steps.map(step => step.type);
    for (const type of types) expect(KNOWN).toContain(type);

    expect(types).toContain('concept');
    expect(types.some(type => INTERACTIVE.includes(type))).toBe(true);
    expect(types.some(type => CODE_STEPS.includes(type))).toBe(true);
  });

  test('every step has an id, and no two are the same', () => {
    const ids = lesson.steps.map(step => step.id);
    for (const id of ids) expect(typeof id).toBe('string');
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every question can actually be answered correctly', () => {
    for (const step of lesson.steps) {
      if (step.type === 'predict') {
        expect(Array.isArray(step.choices)).toBe(true);
        expect(step.choices.length).toBeGreaterThanOrEqual(2);
        expect(Number.isInteger(step.correct)).toBe(true);
        expect(step.correct).toBeGreaterThanOrEqual(0);
        expect(step.correct).toBeLessThan(step.choices.length);
        // Two identical choices make one of them a wrong answer that is right.
        expect(new Set(step.choices).size).toBe(step.choices.length);
      }

      if (step.type === 'fillblank') {
        expect(typeof step.template).toBe('string');
        expect(Array.isArray(step.answers)).toBe(true);
        expect(step.answers.length).toBe(blankCount(step.template));
        expect(step.answers.length).toBeGreaterThan(0);
        for (const answer of step.answers) expect(step.options).toContain(answer);
        // A puzzle with no wrong options is not a puzzle.
        expect(step.options.length).toBeGreaterThan(step.answers.length);
      }

      if (step.type === 'order') {
        expect(Array.isArray(step.shuffled)).toBe(true);
        expect(Array.isArray(step.correctOrder)).toBe(true);
        // The shuffled pile and the answer must be the same lines, or the
        // puzzle is unsolvable however long the child stares at it.
        expect([...step.shuffled].sort()).toEqual([...step.correctOrder].sort());
        // If the pile arrives already in order there is nothing to do.
        expect(step.shuffled).not.toEqual(step.correctOrder);
      }
    }
  });

  test('a child who is stuck is given a way forward', () => {
    for (const step of lesson.steps) {
      if (!INTERACTIVE.includes(step.type)) continue;
      const help = [].concat(step.hints || [], step.hint || [], step.wrongHint || []);
      expect(help.filter(Boolean).length).toBeGreaterThan(0);
    }
  });

  test('running the code is checked for something real', () => {
    for (const step of lesson.steps) {
      if (!CODE_STEPS.includes(step.type)) continue;
      expect(typeof step.code).toBe('string');
      expect(step.code.length).toBeGreaterThan(0);

      // Lessons 1-16 spell it `successPattern`, 17-31 spell it
      // `expectedOutput`. checkCodeStep honours both, so both count here.
      const pattern = step.expectedOutput instanceof RegExp
        ? step.expectedOutput
        : (step.successPattern instanceof RegExp ? step.successPattern : null);
      const checksCode = Array.isArray(step.expectedKeywords) && step.expectedKeywords.length > 0;
      expect(Boolean(pattern) || checksCode).toBe(true);

      // successPattern: /\S+/ was the old "any output at all" check. It passes
      // when a child runs the untouched starter code and changes nothing, which
      // means the lesson congratulates them for pressing one button.
      if (pattern) expect(pattern.source).not.toBe('\\S+');
    }
  });
});
