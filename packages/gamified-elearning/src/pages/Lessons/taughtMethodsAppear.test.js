import { LESSONS } from './lessonRegistry';

// ── A lesson must not advertise what it never shows ──────────────────────────
//
// Lesson 16's opening paragraph named six string methods. Counting every
// occurrence in the whole lesson file:
//
//   .strip()      9 mentions, 5 in runnable code
//   .split()      6 mentions, 3 in runnable code
//   .replace()    4 mentions, 2 in runnable code
//   .join()       3 mentions, 1 in runnable code
//   .find()       1 mention,  0 in runnable code
//   .count()      1 mention,  0 in runnable code
//
// .find() and .count() appeared exactly once each, both inside that sentence.
// A child was told they exist and then never saw one.
//
// The same lesson had the opposite problem: .lower() and .capitalize() were
// used in its own runnable code and never introduced, so a child met
// .capitalize() for the first time inside a worked example with no explanation.
// Puzzle 16-a asks a child to chain .strip().capitalize().
//
// Lesson 19 named math.floor beside math.pi and math.sqrt. Both of those ran.
// math.floor did not.
//
// Swept across the curriculum. This finds the shape rather than the three
// known cases, so a new lesson that advertises something it does not
// demonstrate fails the build.
const CODE_FIELDS = ['code', 'starterCode', 'solution', 'expectedOutput'];

function runnableText(lesson) {
  const out = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    for (const [key, value] of Object.entries(node)) {
      if (CODE_FIELDS.includes(key) && typeof value === 'string') out.push(value);
      else walk(value);
    }
  };
  walk(lesson);
  return out.join('\n');
}

function proseText(lesson) {
  const out = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    for (const [key, value] of Object.entries(node)) {
      if ((key === 'body' || key === 'title') && typeof value === 'string') out.push(value);
      else walk(value);
    }
  };
  walk(lesson);
  return out.join('\n');
}

// Only names written the way a lesson advertises them: .method() or module.name.
const ADVERTISED = /(?:^|[^\w.])(\.[a-z_]{3,}\(|\bmath\.[a-z_]{2,})/g;

describe('lessons demonstrate the tools they name', () => {
  test.each(LESSONS.map((entry, i) => [i + 1, entry]))(
    'lesson %s runs every method its prose advertises',
    (id, entry) => {
      const lesson = entry.data;
      const prose = proseText(lesson);
      const code = runnableText(lesson);
      const named = new Set();
      for (const m of prose.matchAll(ADVERTISED)) {
        named.add(m[1].replace(/\($/, ''));
      }
      const missing = [...named].filter((name) => {
        const needle = name.startsWith('.') ? `${name}(` : name;
        return !code.includes(needle);
      });
      expect({ lesson: id, advertisedButNeverRun: missing }).toEqual({ lesson: id, advertisedButNeverRun: [] });
    },
  );
});
