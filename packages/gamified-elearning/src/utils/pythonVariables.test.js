import { assignedNames, boxText, readVariables } from './pythonVariables';

test('the names a program assigns, in order, once each', () => {
  expect(assignedNames('name = "Alex"\nage = 10\nprint(name)\nage = 11')).toEqual(['name', 'age']);
  expect(assignedNames('score += 5\n  lives -= 1\ntotal //= 2')).toEqual(['score', 'lives', 'total']);
  // A comparison is not an assignment, and neither is a keyword argument.
  expect(assignedNames('if score == 10:\n    print("x", end="")')).toEqual([]);
  expect(assignedNames('a=1\nb=2\nc=3\nd=4\ne=5\nf=6\ng=7')).toHaveLength(6);
  expect(assignedNames(undefined)).toEqual([]);
});

test('text keeps its quote marks on the box, numbers do not, long values are cut', () => {
  expect(boxText('str', 'Alex')).toBe('"Alex"');
  expect(boxText('int', '10')).toBe('10');
  expect(boxText('str', 'x'.repeat(40))).toBe(`"${'x'.repeat(27)}…"`);
});

test('Python is asked for the values, only for the names the code assigns', () => {
  const asked = [];
  const py = { runPython: (source) => { asked.push(source); return JSON.stringify([{ name: 'name', type: 'str', value: 'Sam' }, { name: 'age', type: 'int', value: '9' }]); } };
  expect(readVariables(py, 'name = "Sam"\nage = 9\nprint(name)')).toEqual([
    { name: 'name', type: 'str', text: '"Sam"' },
    { name: 'age', type: 'int', text: '9' },
  ]);
  expect(asked[0]).toContain('["name","age"]');
});

test('a list comes back as slots, with the ones that do not fit counted', () => {
  const py = { runPython: () => JSON.stringify([{ name: 'pets', type: 'list', value: "['cat', 7]", items: [['str', 'cat'], ['int', '7']], more: 3 }]) };
  expect(readVariables(py, 'pets = ["cat", 7, 1, 2, 3]')).toEqual([
    { name: 'pets', type: 'list', text: "['cat', 7]", items: ['"cat"', '7'], more: 3 },
  ]);
});

test('a shelf that cannot be read is an empty shelf', () => {
  expect(readVariables({ runPython: () => { throw new Error('boom'); } }, 'a = 1')).toEqual([]);
  expect(readVariables(null, 'a = 1')).toEqual([]);
  expect(readVariables({ runPython: () => '[]' }, 'print("no names")')).toEqual([]);
});
