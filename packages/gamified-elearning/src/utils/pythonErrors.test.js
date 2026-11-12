// Every raw message here is real: captured from the Python this site runs
// (Pyodide 0.29, Python 3.13) on 11 November 2026 by running the code shown.

import { explainPythonError, errorOutput } from './pythonErrors';

const compileError = (line, src, caret, last) => [
  'Traceback (most recent call last):',
  '  File "/lib/python313.zip/_pyodide/_base.py", line 597, in eval_code_async',
  '    await CodeRunner(',
  '  File "/lib/python313.zip/_pyodide/_base.py", line 149, in _parse_and_compile_gen',
  '    mod = compile(source, filename, mode, flags | ast.PyCF_ONLY_AST)',
  `  File "<exec>", line ${line}`,
  `    ${src}`,
  `    ${caret}`,
  last,
  '',
].join('\n');
const runError = (line, last) => [
  'Traceback (most recent call last):',
  '  File "/lib/python313.zip/_pyodide/_base.py", line 597, in eval_code_async',
  '    await CodeRunner(',
  '    ...<9 lines>...',
  '    .run_async(globals, locals)',
  '  File "/lib/python313.zip/_pyodide/_base.py", line 411, in run_async',
  '    coroutine = eval(self.code, globals, locals)',
  `  File "<exec>", line ${line}, in <module>`,
  last,
  '',
].join('\n');

const CASES = [
  // print("Hello)
  [compileError(1, 'print("Hello)', '      ^', 'SyntaxError: unterminated string literal (detected at line 1)'),
    'Line 1: a quote mark is missing. Text needs one " at the start and one " at the end.'],
  // print("a") / print("b" / print("c")
  [compileError(2, 'print("b"', '     ^', "SyntaxError: '(' was never closed"),
    'Line 2: a bracket is missing. Every opening bracket ( needs a closing bracket ).'],
  // print(Hello)
  [runError(1, "NameError: name 'Hello' is not defined"),
    'Line 1: Python does not know the word Hello. If it is text, put quote marks around it. If it is a name you made, check the spelling.'],
  // Print("Hello")
  [runError(1, "NameError: name 'Print' is not defined. Did you mean: 'print'?"),
    'Line 1: Python does not know Print. It cares about capital letters. Try print, all in small letters.'],
  // prnt("Hello")
  [runError(1, "NameError: name 'prnt' is not defined. Did you mean: 'print'?"),
    'Line 1: Python does not know the word prnt. Did you mean print?'],
  // age = 9 / print("I am " + age)
  [runError(2, 'TypeError: can only concatenate str (not "int") to str'),
    'Line 2: text and a number cannot be joined with +. Use a comma in print instead, like print("I am", age).'],
  // print(10 / 0)
  [runError(1, 'ZeroDivisionError: division by zero'),
    'Line 1: nothing can be divided by zero. Change the number under the divide sign.'],
  // if 3 > 2
  [compileError(1, 'if 3 > 2', '        ^', "SyntaxError: expected ':'"),
    'Line 1: this line needs a colon : at the end.'],
  // print(Hello there)
  [compileError(1, 'print(Hello there)', '      ^^^^^^^^^^^', 'SyntaxError: invalid syntax. Perhaps you forgot a comma?'),
    'Line 1: Python could not read this line. If those are words to say, put quote marks around them.'],
];

test('the mistakes a beginner makes are each answered with the line and the thing to look for', () => {
  for (const [raw, say] of CASES) expect(explainPythonError(raw).say).toBe(say);
});

test('Python\'s own last line is kept, untouched, under the sentence', () => {
  const raw = CASES[0][0];
  expect(explainPythonError(raw)).toEqual({
    line: 1,
    kind: 'SyntaxError',
    original: 'SyntaxError: unterminated string literal (detected at line 1)',
    say: CASES[0][1],
  });
  expect(errorOutput(raw)).toBe(`${CASES[0][1]}\n\nPython said: SyntaxError: unterminated string literal (detected at line 1)`);
  // None of Pyodide's own file paths reach a child.
  expect(errorOutput(raw)).not.toMatch(/_pyodide|Traceback|\/lib\//);
});

test('an error we do not recognise is not explained: the line, and what Python said', () => {
  const raw = runError(3, 'RecursionError: maximum recursion depth exceeded');
  expect(explainPythonError(raw).say).toBe('Python stopped on line 3.');
  expect(errorOutput(raw)).toBe('Python stopped on line 3.\n\nPython said: RecursionError: maximum recursion depth exceeded');
});

test('something that is not a Python error is shown as it is', () => {
  expect(errorOutput('⏱ Execution timed out (10 s limit)')).toBe('⏱ Execution timed out (10 s limit)');
  expect(explainPythonError('').say).toBe('Python stopped before it finished.');
});

test('the Output still contains "Error:", which the daily quest reads to know a run failed', () => {
  for (const [raw] of CASES) expect(errorOutput(raw)).toMatch(/Error:/);
});
