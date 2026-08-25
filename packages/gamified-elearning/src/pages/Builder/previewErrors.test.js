import {
  ERROR_MESSAGE,
  collapseErrors,
  describeError,
  errorReporterScript,
  injectErrorReporter,
  isErrorMessage,
  lineContext,
} from './previewErrors';
import { injectPreviewStorage, storageShimScript } from './previewStorage';

const PAGE = [
  '<!doctype html>',
  '<html>',
  '<head>',
  '</head>',
  '<body>',
  '<script>boom();<' + '/script>',
  '</body>',
  '</html>',
].join('\n');

describe("the line number has to be the child's own", () => {
  // Chrome reports the line relative to the whole document. Anything CodeIt
  // injects above the child's code shifts every number. and a message pointing
  // at the wrong line is worse than no message at all.

  test('the error watcher adds no lines', () => {
    expect(errorReporterScript()).not.toContain('\n');
  });

  test('the storage shim adds no lines either', () => {
    expect(storageShimScript({ best: '7' })).not.toContain('\n');
  });

  test("injecting the watcher does not move the child's code down", () => {
    expect(injectErrorReporter(PAGE).split('\n').length).toBe(PAGE.split('\n').length);
  });

  test('injecting everything we inject still does not move it', () => {
    const both = injectErrorReporter(injectPreviewStorage(PAGE, { best: '9' }));
    expect(both.split('\n').length).toBe(PAGE.split('\n').length);
  });

  test("the child's code still sits on the line it did", () => {
    const lineOf = (text, needle) => text.split('\n').findIndex(l => l.includes(needle)) + 1;
    expect(lineOf(injectErrorReporter(injectPreviewStorage(PAGE)), 'boom();'))
      .toBe(lineOf(PAGE, 'boom();'));
  });
});

describe('putting the watcher in', () => {
  test('it goes in first, so a project that throws immediately is still caught', () => {
    const page = '<html><head><script>boom();<' + '/script></head><body></body></html>';
    const out = injectErrorReporter(page);
    expect(out.indexOf('__codeit_errors__')).toBeLessThan(out.indexOf('boom();'));
  });

  test('a page with no head still gets it', () => {
    expect(injectErrorReporter('<body><p>hi</p></body>')).toContain('__codeit_errors__');
  });

  test('never twice', () => {
    const once = injectErrorReporter('<html><head></head><body></body></html>');
    expect(injectErrorReporter(once)).toBe(once);
  });

  test('nothing in, nothing out', () => {
    expect(injectErrorReporter('')).toBe('');
    expect(injectErrorReporter(null)).toBe(null);
  });
});

describe('recognising a message from the preview', () => {
  test('the real thing is accepted', () => {
    expect(isErrorMessage({ type: ERROR_MESSAGE, message: 'boom' })).toBe(true);
  });

  test('everything else is not', () => {
    expect(isErrorMessage({ type: 'CODEIT_SYNC', html: '' })).toBe(false);
    expect(isErrorMessage({ type: ERROR_MESSAGE })).toBe(false);
    expect(isErrorMessage(null)).toBe(false);
  });
});

describe('saying what actually went wrong', () => {
  const read = (message, line = 0) => describeError({ message, line });

  test('a misspelled name names the thing that is missing', () => {
    const out = read('Uncaught ReferenceError: scoreboard is not defined');
    expect(out.title).toContain('scoreboard');
    expect(out.recognised).toBe(true);
  });

  test('a missing element points at the id, which is the real cause', () => {
    const out = read("Uncaught TypeError: Cannot read properties of null (reading 'textContent')");
    expect(out.title).toContain('textContent');
    expect(out.fix).toMatch(/getElementById/);
    expect(out.recognised).toBe(true);
  });

  test('calling something that is not a function names it', () => {
    const out = read('Uncaught TypeError: startGame is not a function');
    expect(out.title).toContain('startGame()');
    expect(out.recognised).toBe(true);
  });

  test('a typo is called a typo', () => {
    const out = read("Uncaught SyntaxError: Unexpected token ')'");
    expect(out.title).toMatch(/typo/i);
    expect(out.fix).toMatch(/bracket|quote/i);
  });

  test('a runaway function is explained as one', () => {
    expect(read('Uncaught RangeError: Maximum call stack size exceeded').title)
      .toMatch(/keeps calling itself/);
  });

  test('an error we do not know is shown honestly, not guessed at', () => {
    // Inventing a friendly explanation for an error we do not understand
    // teaches the wrong thing.
    const out = read('Uncaught DOMException: something very unusual');
    expect(out.recognised).toBe(false);
    expect(out.raw).toContain('something very unusual');
  });

  test("the browser's own words are always kept", () => {
    expect(read('Uncaught ReferenceError: x is not defined').raw)
      .toBe('Uncaught ReferenceError: x is not defined');
  });

  test('the line comes through when there is one', () => {
    expect(read('Uncaught ReferenceError: x is not defined', 12).line).toBe(12);
  });

  test('line zero means we do not know, so we say nothing', () => {
    expect(read('Uncaught ReferenceError: x is not defined', 0).line).toBeNull();
  });

  test('an empty error is not worth showing at all', () => {
    expect(describeError({ message: '', line: 3 })).toBeNull();
    expect(describeError({ message: '   ', line: 3 })).toBeNull();
    expect(describeError(null)).toBeNull();
  });

  test('no rule ever throws on a strange message', () => {
    ['', '???', 'Uncaught', 'ReferenceError:', ' '].forEach(message => {
      expect(() => describeError({ message, line: 1 })).not.toThrow();
    });
  });
});

describe('showing the line, because "line 41" means nothing on its own', () => {
  const CODE = 'one\ntwo\nthree\nfour\nfive';

  test('the named line comes back with its neighbours', () => {
    expect(lineContext(CODE, 3)).toEqual([
      { number: 2, text: 'two', isTheOne: false },
      { number: 3, text: 'three', isTheOne: true },
      { number: 4, text: 'four', isTheOne: false },
    ]);
  });

  test('the first line does not reach above the file', () => {
    expect(lineContext(CODE, 1).map(l => l.number)).toEqual([1, 2]);
  });

  test('the last line does not reach past the end', () => {
    expect(lineContext(CODE, 5).map(l => l.number)).toEqual([4, 5]);
  });

  test('a line number past the end shows nothing rather than blank rows', () => {
    expect(lineContext(CODE, 99)).toEqual([]);
  });

  test('no line, no context', () => {
    expect(lineContext(CODE, null)).toEqual([]);
    expect(lineContext(CODE, 0)).toEqual([]);
    expect(lineContext(null, 3)).toEqual([]);
  });
});

describe('a game that throws sixty times a second', () => {
  // An error inside an animation loop repeats every frame. Sixty copies of one
  // problem is how a child learns to ignore the error panel entirely.
  const flood = (n) => Array.from({ length: n }, () =>
    describeError({ message: 'Uncaught ReferenceError: x is not defined', line: 12 }));

  test('one problem is shown once', () => {
    expect(collapseErrors(flood(60))).toHaveLength(1);
  });

  test('and it says how many times it happened', () => {
    expect(collapseErrors(flood(60))[0].count).toBe(60);
  });

  test('different problems stay separate', () => {
    const mixed = [
      describeError({ message: 'Uncaught ReferenceError: x is not defined', line: 12 }),
      describeError({ message: 'Uncaught ReferenceError: y is not defined', line: 20 }),
    ];
    expect(collapseErrors(mixed)).toHaveLength(2);
  });

  test('the same message on two different lines is two problems', () => {
    const twoPlaces = [
      describeError({ message: 'Uncaught ReferenceError: x is not defined', line: 12 }),
      describeError({ message: 'Uncaught ReferenceError: x is not defined', line: 44 }),
    ];
    expect(collapseErrors(twoPlaces)).toHaveLength(2);
  });

  test('never more than a handful on screen', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      describeError({ message: `Uncaught ReferenceError: v${i} is not defined`, line: i + 1 }));
    expect(collapseErrors(many).length).toBeLessThanOrEqual(3);
  });

  test('nothing in, nothing out', () => {
    expect(collapseErrors([])).toEqual([]);
    expect(collapseErrors(null)).toEqual([]);
    expect(collapseErrors([null, undefined])).toEqual([]);
  });
});
