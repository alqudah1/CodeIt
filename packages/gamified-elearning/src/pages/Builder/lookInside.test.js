import { doorway, lookInside } from './lookInside';

const variables = { id: 'variables', label: 'variables', lessonId: 2, lessonTitle: 'Variables', line: 12, count: 9 };
const ifs       = { id: 'if', label: 'if statements', lessonId: 4, lessonTitle: 'If Statements', line: 61, count: 3 };
const functions = { id: 'fn', label: 'functions', lessonId: 9, lessonTitle: 'Functions', line: 30, count: 22 };

describe('which lesson the door opens onto', () => {
  test('the earliest lesson in their file, not the most frequent thing in it', () => {
    // Functions appear 22 times and variables 9. Sending a child to Lesson 9
    // first hands them the hardest idea in their own code as an introduction.
    expect(doorway([variables, ifs, functions]).lessonId).toBe(2);
  });

  test('with nothing found, it says nothing rather than guessing', () => {
    expect(doorway([])).toBeNull();
    expect(doorway(null)).toBeNull();
    expect(lookInside([])).toBeNull();
  });

  test('the same lesson twice picks the better example', () => {
    const thin = { ...variables, count: 1, line: 4 };
    const thick = { ...variables, count: 8, line: 12 };
    expect(doorway([thin, thick]).line).toBe(12);
  });
});

describe('what the screen says once they have changed something', () => {
  test('it names the line in their own file, not just the concept', () => {
    const said = lookInside([variables, ifs, functions]);
    // "your project uses variables" is a claim. The line number is the part a
    // child can go and check, and checking is the whole point.
    expect(said.sentence).toContain('line 12');
    expect(said.sentence).toContain('variables');
    expect(said.lessonId).toBe(2);
    expect(said.lessonLabel).toBe('Learn Variables');
  });

  test('it never says they built it — only that they changed it', () => {
    const said = lookInside([variables]);
    expect(said.sentence).not.toMatch(/you built/i);
    expect(said.sentence).toMatch(/changed/i);
  });

  test('it counts the rest without pretending there are more than there are', () => {
    expect(lookInside([variables]).rest).toBeNull();
    expect(lookInside([variables, ifs]).rest).toBe('and 1 more thing in your code');
    expect(lookInside([variables, ifs, functions]).rest).toBe('and 2 more things in your code');
  });
});

describe('skipping lessons they have already finished', () => {
  test('the door opens on the earliest thing they have not been taught', () => {
    // Variables is the earliest in the file, but they have done Lesson 2.
    expect(doorway([variables, ifs, functions], [1, 2, 3]).lessonId).toBe(4);
    expect(doorway([variables, ifs, functions], [1, 2, 3, 4]).lessonId).toBe(9);
  });

  test('a child with no account has finished none, and gets the earliest', () => {
    expect(doorway([variables, ifs, functions], []).lessonId).toBe(2);
    expect(doorway([variables, ifs, functions], undefined).lessonId).toBe(2);
    expect(doorway([variables, ifs, functions], null).lessonId).toBe(2);
  });

  test('having done every lesson the project touches, it offers one again', () => {
    // Showing nothing would be worse. Going back to a finished lesson is a
    // real offer; a blank space is not.
    const said = lookInside([variables, ifs], [2, 4]);
    expect(said).not.toBeNull();
    expect(said.lessonId).toBe(2);
  });

  test('progress arriving as strings is still progress', () => {
    expect(doorway([variables, ifs], ['2']).lessonId).toBe(4);
  });
});
