import {
  LESSONS,
  TOTAL_LESSONS,
  builderPromptFor,
  getLessonData,
  getLessonEntry,
  lessonExists,
  lessonSummaries,
  lessonUnits,
  seoFor,
} from './lessonRegistry';
import { blankCount, isInteractionStep } from '../../components/InteractiveLessonTemplate/interactionGrading';

// The registry is the thing that makes "adding a lesson is one entry" true.
// These tests are what stop a half-added lesson. routable but unlisted, or
// listed with no project to build afterwards. from reaching a child.

describe('the curriculum is complete', () => {
  test('every lesson has a data file with matching id', () => {
    LESSONS.forEach(entry => {
      expect(entry.data).toBeTruthy();
      expect(typeof entry.data.id).toBe('number');
      expect(entry.data.title).toBeTruthy();
      expect(Array.isArray(entry.data.steps)).toBe(true);
      expect(entry.data.steps.length).toBeGreaterThan(2);
    });
  });

  test('ids are unique and run 1..N with no gaps', () => {
    const ids = LESSONS.map(entry => entry.data.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(Array.from({ length: TOTAL_LESSONS }, (_, i) => i + 1));
  });

  test('lessons 1 to 16 keep the ids students already have progress against', () => {
    // Reordering these would silently reassign somebody's completed lessons.
    expect(LESSONS[0].data.id).toBe(1);
    expect(LESSONS[15].data.id).toBe(16);
    expect(TOTAL_LESSONS).toBeGreaterThanOrEqual(16);
  });

  test('every lesson has a unit, a summary, a builder prompt and page metadata', () => {
    LESSONS.forEach(entry => {
      expect(entry.unit).toBeTruthy();
      expect(entry.summary).toBeTruthy();
      expect(entry.builderPrompt).toBeTruthy();
      expect(entry.seoTitle).toBeTruthy();
      expect(entry.seoDesc).toBeTruthy();
      // Google truncates past roughly this, and a cut-off description reads badly.
      expect(entry.seoDesc.length).toBeLessThan(200);
    });
  });

  test('the course covers the concepts a beginner Python course has to cover', () => {
    const everything = LESSONS.map(e => `${e.summary} ${e.data.title}`).join(' ').toLowerCase();
    [
      'print', 'variable', 'if', 'range', 'list', 'function',
      'while', 'break', 'dictionar', 'tuple', 'set', 'slic',
      'comprehension', 'import', 'random', 'except', 'enumerate',
      'zip', 'class', 'recursion', 'scope',
    ].forEach(concept => {
      expect(everything).toContain(concept);
    });
  });
});

describe('lookups', () => {
  test('finds a lesson by number or by numeric string', () => {
    expect(getLessonData(1).id).toBe(1);
    expect(getLessonData('1').id).toBe(1);
    expect(getLessonEntry(17).unit).toBeTruthy();
  });

  test('an unknown lesson is null rather than a crash', () => {
    expect(getLessonData(999)).toBeNull();
    expect(getLessonData('abc')).toBeNull();
    expect(lessonExists(999)).toBe(false);
    expect(lessonExists(TOTAL_LESSONS)).toBe(true);
  });

  test('a lesson past the end has no page metadata instead of undefined fields', () => {
    expect(seoFor(999)).toEqual({});
    expect(seoFor(1).title).toBeTruthy();
  });

  test('every lesson has somewhere to build afterwards', () => {
    LESSONS.forEach(entry => {
      expect(builderPromptFor(entry.data.id)).toBe(entry.builderPrompt);
    });
    // Even an unknown id gives a usable prompt rather than "undefined".
    expect(builderPromptFor(999)).toMatch(/\w/);
  });
});

describe('derived views stay in step with the list', () => {
  test('the map fallback lists every lesson', () => {
    const summaries = lessonSummaries();
    expect(summaries).toHaveLength(TOTAL_LESSONS);
    summaries.forEach(lesson => {
      expect(lesson.title).toBeTruthy();
      expect(lesson.emoji).toBeTruthy();
      expect(lesson.xp).toBeGreaterThan(0);
    });
  });

  test('units contain every lesson exactly once', () => {
    const grouped = lessonUnits().flatMap(unit => unit.lessons.map(l => l.id));
    expect(grouped.sort((a, b) => a - b)).toEqual(LESSONS.map(e => e.data.id));
  });
});

describe('every step is well formed', () => {
  const steps = LESSONS.flatMap(entry =>
    entry.data.steps.map((step, index) => ({ lesson: entry.data.id, index, step }))
  );

  test('every step has a type and a title', () => {
    steps.forEach(({ lesson, index, step }) => {
      expect(`${lesson}:${index}:${step.type}`).toMatch(
        /:(concept|example|tryit|challenge|predict|fillblank|order)$/
      );
      expect(step.title).toBeTruthy();
    });
  });

  test('every predict step has choices and an answer that points at one of them', () => {
    steps.filter(s => s.step.type === 'predict').forEach(({ lesson, index, step }) => {
      const where = `lesson ${lesson} step ${index}`;
      expect(`${where}: ${step.choices?.length}`).toBe(`${where}: 4`);
      expect(step.correct).toBeGreaterThanOrEqual(0);
      expect(step.correct).toBeLessThan(step.choices.length);
      expect(new Set(step.choices).size).toBe(step.choices.length);
    });
  });

  test('every fill-blank step is solvable from the options offered', () => {
    steps.filter(s => s.step.type === 'fillblank').forEach(({ lesson, index, step }) => {
      const where = `lesson ${lesson} step ${index}`;
      expect(`${where}: ${blankCount(step.template)}`).toBe(`${where}: ${step.answers.length}`);
      step.answers.forEach(answer => expect(step.options).toContain(answer));
      // Offering only the right answers makes it a tap-through, not a question.
      expect(step.options.length).toBeGreaterThan(step.answers.length);
    });
  });

  test('every ordering step starts scrambled', () => {
    steps.filter(s => s.step.type === 'order').forEach(({ lesson, index, step }) => {
      const where = `lesson ${lesson} step ${index}`;
      expect([...step.shuffled].sort()).toEqual([...step.correctOrder].sort());
      expect(`${where}: ${JSON.stringify(step.shuffled) === JSON.stringify(step.correctOrder)}`)
        .toBe(`${where}: false`);
    });
  });

  test('no step passes on output that has nothing to do with it', () => {
    // The old lessons were full of checks like /\S+/, /\w/ and /\d+/, which pass
    // on literally any output. including the untouched starter code, or a
    // single space. A child could be told "correct" without having done
    // anything. Rather than banning one regex by name, this feeds every check
    // some unrelated output and insists it be rejected.
    // No real words, so a legitimately specific check like /apple|banana/ is
    // not flagged just because the probe happened to contain a fruit.
    const UNRELATED = 'zzz qqq 0 zzz';
    const tooEasy = steps
      .filter(({ step }) => {
        const check = step.expectedOutput || step.successPattern;
        return check && check.test(UNRELATED);
      })
      .map(({ lesson, index, step }) =>
        `lesson ${lesson} step ${index}: ${step.expectedOutput || step.successPattern}`);
    expect(tooEasy).toEqual([]);
  });

  test('every code step is checked somehow', () => {
    // A step with no expectedOutput, no expectedKeywords and no successPattern
    // passes the moment anything at all is printed. Open-ended steps are fine,
    // but they still have to check the code uses what the lesson taught.
    const unchecked = steps
      .filter(({ step }) => ['tryit', 'challenge'].includes(step.type))
      .filter(({ step }) => !step.expectedOutput && !step.successPattern && !step.expectedKeywords?.length)
      .map(({ lesson, index, step }) => `lesson ${lesson} step ${index} (${step.title})`);
    expect(unchecked).toEqual([]);
  });

  test('every lesson has at least one step that needs thinking rather than typing', () => {
    LESSONS.forEach(entry => {
      const thinking = entry.data.steps.filter(isInteractionStep);
      expect(`lesson ${entry.data.id}: ${thinking.length > 0}`).toBe(`lesson ${entry.data.id}: true`);
    });
  });

  test('every lesson opens with a reason to care', () => {
    LESSONS.forEach(entry => {
      expect(`lesson ${entry.data.id}: ${!!entry.data.story}`).toBe(`lesson ${entry.data.id}: true`);
    });
  });
});
