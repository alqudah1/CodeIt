import { STARTER_PROJECTS } from './starterProjects';

// The validator lives in the backend, because that is where a generated project
// is checked before a child ever sees it. It is required rather than imported
// so this one file can hold both halves: the real project HTML, which only
// exists as ES modules here, and the server's own judgement of it.
// eslint-disable-next-line
const { problemsWith, scriptsIn, syntaxErrorIn, willRun } =
  require('../../../../codeit-backend/generatedCode');

// ── The check the server makes, against projects known to work ───────────────
//
// ops/checks/starters-run.js opens all twenty of these in a real browser at two
// sizes on every build, and all twenty play. So if the server's validator
// rejected one of them, the validator would be the thing that is wrong — and it
// would block working projects from reaching children, which is worse than the
// bug it exists to catch.
//
// A first attempt at this test lived in the backend suite and read the HTML out
// of the source files with a regex, blanking the ${...} placeholders. That turns
// `let passMark = ${passMark};` into `let passMark = ;` and reported a starter
// as broken. The projects here are the real strings a child receives.

describe.each(STARTER_PROJECTS.map(p => [`${p.kind}: ${p.label}`, p]))('%s', (label, project) => {
  test('its JavaScript parses', () => {
    expect(syntaxErrorIn(project.code)).toBeNull();
  });

  test('the server would let it through', () => {
    expect(problemsWith(project.code)).toEqual([]);
    expect(willRun(project.code)).toBe(true);
  });

  test('it has code that runs at all', () => {
    expect(scriptsIn(project.code).length).toBeGreaterThan(0);
  });
});

test('every starter passes, so the validator blocks nothing that works', () => {
  const rejected = STARTER_PROJECTS.filter(p => !willRun(p.code));
  expect(rejected.map(p => p.label)).toEqual([]);
  // A floor, not an exact count: the exact number broke the suite the day a
  // twenty-first starter (Cat and mouse chase) was added, without testing
  // anything the line above does not already test better.
  expect(STARTER_PROJECTS.length).toBeGreaterThanOrEqual(20);
});

// ── And it still catches the thing it is for ─────────────────────────────────

test('a starter with one character removed stops passing', () => {
  // The honest way to know a check works: break something known good and watch
  // it fail. Take a real project and delete a closing brace.
  const real = STARTER_PROJECTS.find(p => p.id === 'quiz-animals').code;
  const at = real.lastIndexOf('}');
  const broken = real.slice(0, at) + real.slice(at + 1);

  expect(willRun(real)).toBe(true);
  expect(willRun(broken)).toBe(false);
  expect(problemsWith(broken)[0].kind).toBe('syntax');
});
