import {
  BLANK,
  blankCount,
  checkCodeStep,
  checkFillBlank,
  checkOrder,
  checkPredict,
  codeFeedback,
  isInteractionStep,
  renderTemplate,
  splitTemplate,
} from './interactionGrading';

describe('splitTemplate', () => {
  test('returns nothing for empty or non-string input', () => {
    expect(splitTemplate('')).toEqual([]);
    expect(splitTemplate(null)).toEqual([]);
    expect(splitTemplate(42)).toEqual([]);
  });

  test('a template with no blank is a single piece of text', () => {
    expect(splitTemplate('print("hi")')).toEqual([{ kind: 'text', value: 'print("hi")' }]);
  });

  test('splits text around one blank', () => {
    expect(splitTemplate(`print(${BLANK})`)).toEqual([
      { kind: 'text', value: 'print(' },
      { kind: 'blank', index: 0 },
      { kind: 'text', value: ')' },
    ]);
  });

  test('numbers multiple blanks in reading order', () => {
    const segments = splitTemplate(`${BLANK} = ${BLANK}`);
    expect(segments.filter(s => s.kind === 'blank').map(s => s.index)).toEqual([0, 1]);
  });

  test('a blank at the very start produces no empty leading text', () => {
    expect(splitTemplate(`${BLANK} = 5`)[0]).toEqual({ kind: 'blank', index: 0 });
  });

  test('counts blanks', () => {
    expect(blankCount('no blanks here')).toBe(0);
    expect(blankCount(`for i in range(${BLANK}):`)).toBe(1);
    expect(blankCount(`${BLANK}.append(${BLANK})`)).toBe(2);
  });
});

describe('renderTemplate', () => {
  test('substitutes the picks in order', () => {
    expect(renderTemplate(`${BLANK} = ${BLANK}`, ['score', '10'])).toBe('score = 10');
  });

  test('leaves unfilled blanks visible so the child can see what is missing', () => {
    expect(renderTemplate(`${BLANK} = ${BLANK}`, ['score'])).toBe(`score = ${BLANK}`);
  });

  test('keeps a literal zero rather than treating it as missing', () => {
    expect(renderTemplate(`x = ${BLANK}`, [0])).toBe('x = 0');
  });
});

describe('checkPredict', () => {
  const step = { type: 'predict', correct: 2 };

  test('accepts the right choice', () => {
    expect(checkPredict(step, 2)).toBe(true);
  });

  test('rejects the others', () => {
    expect(checkPredict(step, 0)).toBe(false);
    expect(checkPredict(step, 3)).toBe(false);
  });

  test('compares numerically, since a click handler may hand over a string', () => {
    expect(checkPredict(step, '2')).toBe(true);
  });

  test('a step with no answer key cannot be passed by guessing undefined', () => {
    expect(checkPredict({}, undefined)).toBe(false);
  });
});

describe('checkFillBlank', () => {
  const step = { type: 'fillblank', answers: ['name', '"Sam"'] };

  test('accepts the right words in the right holes', () => {
    expect(checkFillBlank(step, ['name', '"Sam"'])).toBe(true);
  });

  test('rejects the right words in the wrong holes', () => {
    expect(checkFillBlank(step, ['"Sam"', 'name'])).toBe(false);
  });

  test('rejects a partly filled template', () => {
    expect(checkFillBlank(step, ['name'])).toBe(false);
    expect(checkFillBlank(step, [])).toBe(false);
  });

  test('forgives stray spaces around a pick', () => {
    expect(checkFillBlank(step, [' name ', '"Sam"'])).toBe(true);
  });

  test('rejects a non-array, which is what an uninitialised state looks like', () => {
    expect(checkFillBlank(step, null)).toBe(false);
  });
});

describe('checkOrder', () => {
  const step = { type: 'order', correctOrder: ['a = 1', 'b = 2', 'print(a + b)'] };

  test('accepts the exact order', () => {
    expect(checkOrder(step, ['a = 1', 'b = 2', 'print(a + b)'])).toBe(true);
  });

  test('rejects a swap', () => {
    expect(checkOrder(step, ['b = 2', 'a = 1', 'print(a + b)'])).toBe(false);
  });

  test('rejects a short arrangement rather than passing on a prefix', () => {
    expect(checkOrder(step, ['a = 1', 'b = 2'])).toBe(false);
  });
});

describe('checkCodeStep', () => {
  test('nothing printed is never a pass', () => {
    expect(checkCodeStep({}, { output: '' })).toEqual({ passed: false, reason: 'no-output' });
    expect(checkCodeStep({}, { output: '   ' })).toEqual({ passed: false, reason: 'no-output' });
  });

  test('a step with no expectations passes on any real output', () => {
    expect(checkCodeStep({}, { output: 'anything' }).passed).toBe(true);
  });

  test('checks the printed result against expectedOutput', () => {
    const step = { expectedOutput: /^Hello, world!$/ };
    expect(checkCodeStep(step, { output: 'Hello, world!\n' }).passed).toBe(true);
    expect(checkCodeStep(step, { output: 'Goodbye' })).toEqual({ passed: false, reason: 'wrong-output' });
  });

  test('checks the code contains the idea being taught', () => {
    const step = { expectedKeywords: ['for', 'range'] };
    expect(checkCodeStep(step, { code: 'for i in range(3): print(i)', output: '0' }).passed).toBe(true);
    const missed = checkCodeStep(step, { code: 'print(0)\nprint(1)', output: '0' });
    expect(missed.passed).toBe(false);
    expect(missed.reason).toBe('missing-concept');
    expect(missed.missing).toEqual(['for', 'range']);
  });

  test('keyword matching ignores case', () => {
    expect(checkCodeStep({ expectedKeywords: ['Print'] }, { code: 'print(1)', output: '1' }).passed).toBe(true);
  });

  test('still honours a legacy successPattern so old lessons do not regress', () => {
    const step = { successPattern: /Teen|Kid/ };
    expect(checkCodeStep(step, { output: 'Teen!' }).passed).toBe(true);
    expect(checkCodeStep(step, { output: 'nope' }).passed).toBe(false);
  });

  test('the old catch-all pattern no longer passes on whitespace alone', () => {
    // successPattern: /\S+/ was the old "any output at all" check. A step that
    // prints a single space used to count as a correct answer.
    expect(checkCodeStep({ successPattern: /\S+/ }, { output: ' ' }).passed).toBe(false);
  });
});

describe('codeFeedback', () => {
  test('says nothing when the step passed', () => {
    expect(codeFeedback({ passed: true })).toBe('');
    expect(codeFeedback(null)).toBe('');
  });

  test('points at the Run button when nothing has been run', () => {
    expect(codeFeedback({ passed: false, reason: 'no-output' })).toMatch(/Run/);
  });

  test('names the missing idea instead of just saying wrong', () => {
    const message = codeFeedback({ passed: false, reason: 'missing-concept', missing: ['while'] });
    expect(message).toMatch(/while/);
  });

  test('prefers the lesson author hint for a wrong result', () => {
    const step = { wrongOutputHint: 'Check the spelling inside the quotes.' };
    expect(codeFeedback({ passed: false, reason: 'wrong-output' }, step)).toBe(step.wrongOutputHint);
  });

  test('falls back to a usable message when the author wrote no hint', () => {
    expect(codeFeedback({ passed: false, reason: 'wrong-output' }, {})).toMatch(/output/i);
  });
});

describe('isInteractionStep', () => {
  test('recognises the non-typing step types', () => {
    expect(isInteractionStep({ type: 'predict' })).toBe(true);
    expect(isInteractionStep({ type: 'fillblank' })).toBe(true);
    expect(isInteractionStep({ type: 'order' })).toBe(true);
  });

  test('leaves the existing types alone', () => {
    ['concept', 'example', 'tryit', 'challenge'].forEach(type => {
      expect(isInteractionStep({ type })).toBe(false);
    });
    expect(isInteractionStep(null)).toBe(false);
  });
});
