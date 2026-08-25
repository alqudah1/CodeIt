// ── Grading the non-typing steps ───────────────────────────
//
// Every step in every lesson used to demand the same thing: type Python into an
// editor and press Run. That is a high floor for a seven-year-old and a slow
// one for everybody — and it made "success" hard to check, so the old lessons
// accepted any output at all (successPattern: /\S+/ passes on a single space).
//
// These give a lesson smaller actions: predict what code will print, click the
// missing piece into place, put lines in the right order. The grading logic
// lives here as pure functions so it can be tested without a browser.

const BLANK = '___';

/** Split a template like `print(___)` into text and blank segments. */
function splitTemplate(template) {
  if (typeof template !== 'string' || !template) return [];
  const parts = template.split(BLANK);
  const segments = [];
  parts.forEach((text, index) => {
    if (text) segments.push({ kind: 'text', value: text });
    if (index < parts.length - 1) segments.push({ kind: 'blank', index: segments.filter(s => s.kind === 'blank').length });
  });
  return segments;
}

function blankCount(template) {
  return splitTemplate(template).filter(segment => segment.kind === 'blank').length;
}

/** Fill a template's blanks with the student's picks, for preview and output. */
function renderTemplate(template, filled) {
  let blankIndex = -1;
  return splitTemplate(template)
    .map(segment => {
      if (segment.kind === 'text') return segment.value;
      blankIndex += 1;
      return filled[blankIndex] == null ? BLANK : filled[blankIndex];
    })
    .join('');
}

// ── Grading ──────────────────────────────────────────────────────────────────

function checkPredict(step, choiceIndex) {
  return Number(choiceIndex) === Number(step?.correct);
}

function checkFillBlank(step, filled) {
  const answers = step?.answers || [];
  if (!Array.isArray(filled) || filled.length !== answers.length) return false;
  return answers.every((answer, i) => String(filled[i]).trim() === String(answer).trim());
}

function checkOrder(step, arranged) {
  const correct = step?.correctOrder || [];
  if (!Array.isArray(arranged) || arranged.length !== correct.length) return false;
  return correct.every((line, i) => arranged[i] === line);
}

/**
 * Grading for a code step the student actually types.
 *
 * The old lessons matched a regex against stdout, and the regexes were so loose
 * that running the untouched starter code passed. A real check asks two things:
 * did the program print what it should, and does the code contain the idea the
 * lesson is teaching? Either can be omitted; a step with neither falls back to
 * "it ran and printed something", which is at least honest about being weak.
 */
function checkCodeStep(step, { code = '', output = '' } = {}) {
  const trimmedOutput = String(output).trim();
  if (!trimmedOutput) return { passed: false, reason: 'no-output' };

  if (step?.expectedOutput instanceof RegExp && !step.expectedOutput.test(trimmedOutput)) {
    return { passed: false, reason: 'wrong-output' };
  }

  const keywords = step?.expectedKeywords || [];
  if (keywords.length) {
    const haystack = String(code).toLowerCase();
    const missing = keywords.filter(word => !haystack.includes(String(word).toLowerCase()));
    if (missing.length) return { passed: false, reason: 'missing-concept', missing };
  }

  // Legacy lessons still carry successPattern; honour it so nothing regresses.
  if (step?.successPattern instanceof RegExp && !step.successPattern.test(trimmedOutput)) {
    return { passed: false, reason: 'wrong-output' };
  }

  return { passed: true };
}

/** What to say when a code step fails, in words a child can act on. */
function codeFeedback(result, step) {
  if (!result || result.passed) return '';
  if (result.reason === 'no-output') return 'Nothing was printed yet. Press Run to see what your code does.';
  if (result.reason === 'missing-concept') {
    const missing = (result.missing || []).join(', ');
    return `Close! This one needs ${missing} in your code. Have another go.`;
  }
  return step?.wrongOutputHint || 'Not quite. Look at the output and compare it with what was asked.';
}

const INTERACTION_TYPES = ['predict', 'fillblank', 'order'];

function isInteractionStep(step) {
  return INTERACTION_TYPES.includes(step?.type);
}

export {
  BLANK,
  INTERACTION_TYPES,
  blankCount,
  checkCodeStep,
  checkFillBlank,
  checkOrder,
  checkPredict,
  codeFeedback,
  isInteractionStep,
  renderTemplate,
  splitTemplate,
};
