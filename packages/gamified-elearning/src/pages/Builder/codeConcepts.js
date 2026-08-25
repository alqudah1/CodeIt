// ── What is actually in the code a child just made ───────────────────────────
//
// The studio already showed a list called "Concepts in this project" and a row
// of lesson chips. Both were produced by `detectLessonIds`, which reads the
// child's PROMPT:
//
//     if (/game|click|target|score|timer/.test(prompt)) return [2, 4, 5, 9];
//
// So a child who typed "a space game" was told their project used variables,
// if statements, for loops and functions — whether or not a single one of those
// appears in the file. It is a keyword match on what they asked for, dressed up
// as a report on what they built. If the model wrote no loop, the chip still
// said loops, and the lesson it opened taught something that was not there.
//
// This module reads the code instead. Every concept it reports is one it found,
// with the line number and the child's own line of code to prove it.
//
// ── Why a JavaScript project links to a Python lesson ─────────────────────────
//
// The studio writes HTML, CSS and JavaScript. Every lesson is Python. That gap
// is real and this module does not hide it: each concept carries a short note
// naming the difference in syntax, because a child who clicks "if statements"
// and lands on `if x > 3:` after writing `if (x > 3) {` deserves to have been
// told, not left to think one of them is wrong.
//
// The idea is the same in both, and the idea is what the lesson teaches.
//
// Pure functions. No React, no network.

/**
 * The code a child wrote, without the code the studio injected.
 *
 * The preview has a storage shim, an editor bridge and an error reporter
 * spliced into it, all of which are full of loops and conditionals. Counting
 * those would tell a seven-year-old they had written a hundred if statements.
 */
function childsScripts(html) {
  const source = typeof html === 'string' ? html : '';
  const scripts = [];
  const pattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const body = match[1];
    if (/__codeit_storage__|__codeit_bridge__|__codeit_errors__|CODEIT_CMD/.test(body)) continue;
    scripts.push({ body, offset: source.slice(0, match.index).split('\n').length });
  }
  return scripts;
}

/** Lines that are code, paired with their line number in the document. */
function codeLines(html) {
  const out = [];
  for (const script of childsScripts(html)) {
    script.body.split('\n').forEach((text, i) => {
      const trimmed = text.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
      out.push({ text, trimmed, number: script.offset + i });
    });
  }
  return out;
}

// Each concept: how to spot it in JavaScript, the lesson that teaches the same
// idea in Python, and the one sentence a child needs about the difference.
//
// Ordered by how early they meet it, so the list reads like a path rather than
// a bag of terms.
const CONCEPTS = [
  {
    id: 'variables',
    label: 'Variables',
    what: 'Boxes that remember a number, a word or a colour.',
    lessonId: 2,
    lessonTitle: 'Variables',
    test: /^(?:let|const|var)\s+[A-Za-z_$][\w$]*\s*=/,
    note: 'Python writes it without let: score = 0.',
  },
  {
    id: 'strings',
    label: 'Text',
    what: 'Words and messages, kept in quotes.',
    lessonId: 3,
    lessonTitle: 'Strings',
    test: /=\s*['"][^'"]*['"]|\.textContent\s*=|\+\s*['"]/,
    note: 'Python uses quotes the same way.',
  },
  {
    id: 'if',
    label: 'If statements',
    what: 'Deciding what happens next.',
    lessonId: 4,
    lessonTitle: 'If Statements',
    test: /\bif\s*\(/,
    note: 'Python writes if lives <= 0: with a colon and no brackets.',
  },
  {
    id: 'forLoops',
    label: 'For loops',
    what: 'Doing something again and again without writing it out.',
    lessonId: 5,
    lessonTitle: 'For Loops',
    test: /\bfor\s*\(|\.forEach\s*\(/,
    note: 'Python writes for i in range(10):.',
  },
  {
    id: 'lists',
    label: 'Lists',
    what: 'Keeping many things in one place.',
    lessonId: 7,
    lessonTitle: 'Lists',
    test: /=\s*\[|\.push\s*\(|\.splice\s*\(|\.length\b/,
    note: 'Python calls them lists and writes stars = [].',
  },
  {
    id: 'functions',
    label: 'Functions',
    what: 'A named job you can ask for by name.',
    lessonId: 9,
    lessonTitle: 'Functions',
    test: /\bfunction\s+[A-Za-z_$]|=>\s*\{|\bfunction\s*\(/,
    note: 'Python writes def startGame():.',
  },
  {
    id: 'maths',
    label: 'Maths',
    what: 'Adding to a score, taking away a life.',
    lessonId: 11,
    lessonTitle: 'Numbers and Arithmetic',
    test: /[\w$)\]]\s*[+\-*/%]\s*[\w$(]|\+\+|--|[+\-*/]=/,
    note: 'Python does the same arithmetic with the same symbols.',
  },
  {
    id: 'comparisons',
    label: 'Comparing things',
    what: 'Bigger, smaller, the same.',
    lessonId: 12,
    lessonTitle: 'Booleans and Comparisons',
    test: /[<>]=?|===|!==|\btrue\b|\bfalse\b/,
    note: 'Python writes True and False with capitals.',
  },
  {
    id: 'logic',
    label: 'And, or, not',
    what: 'Two things at once, or either one.',
    lessonId: 13,
    lessonTitle: 'Logical Operators',
    test: /&&|\|\||![\w$(]/,
    note: 'Python spells them out: and, or, not.',
  },
  {
    id: 'whileLoops',
    label: 'While loops',
    what: 'Keep going until something changes.',
    lessonId: 17,
    lessonTitle: 'While Loops',
    test: /\bwhile\s*\(/,
    note: 'Python writes while playing: with a colon.',
  },
  {
    id: 'random',
    label: 'Random',
    what: 'Making it different every time.',
    lessonId: 19,
    lessonTitle: 'Import and Random',
    test: /Math\.random\s*\(/,
    note: 'Python imports it first: import random.',
  },
  {
    id: 'objects',
    label: 'Objects',
    what: 'One thing with several parts, like a star with an x and a y.',
    lessonId: 20,
    lessonTitle: 'Dictionaries',
    test: /\{\s*[A-Za-z_$][\w$]*\s*:/,
    note: 'Python calls these dictionaries and writes {"x": 10}.',
  },
  {
    id: 'errors',
    label: 'Catching mistakes',
    what: 'Carrying on when something goes wrong.',
    lessonId: 27,
    lessonTitle: 'Try and Except',
    test: /\btry\s*\{|\bcatch\s*\(/,
    note: 'Python writes try: and except:.',
  },
];

const MAX_SNIPPET = 72;

/**
 * Every concept this project really contains, with the child's own line.
 *
 * The line is the point. "Your project uses if statements" is a claim; "your
 * project uses if statements, and here is yours, on line 61" is something they
 * can go and look at, which is the only version that teaches anything.
 */
function conceptsIn(html) {
  const lines = codeLines(html);
  if (!lines.length) return [];

  return CONCEPTS.map(concept => {
    const hits = lines.filter(line => concept.test.test(line.trimmed));
    if (!hits.length) return null;

    // The shortest example, because the clearest one to show a child is almost
    // never the forty-character line with three things happening in it.
    const clearest = hits.reduce((best, line) =>
      (line.trimmed.length < best.trimmed.length ? line : best), hits[0]);

    return {
      id: concept.id,
      label: concept.label,
      what: concept.what,
      lessonId: concept.lessonId,
      lessonTitle: concept.lessonTitle,
      note: concept.note,
      count: hits.length,
      line: clearest.number,
      snippet: clearest.trimmed.slice(0, MAX_SNIPPET),
    };
  }).filter(Boolean);
}

/** "You used 5 things from the lessons in this project." */
function conceptSummary(concepts) {
  const list = Array.isArray(concepts) ? concepts : [];
  if (!list.length) return null;
  const n = list.length;
  return n === 1
    ? 'You used 1 thing from the lessons in this project.'
    : `You used ${n} things from the lessons in this project.`;
}

export { CONCEPTS, conceptSummary, conceptsIn };
