// The editor a pupil types into when the coloured one cannot arrive.
//
// 13 November 2026: a school's filter answered 403 to every large script, and
// the coloured editor is 185 KB in one piece. A lesson has to work without it.
import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PlainEditor, { newlineFor, paintPython } from './PlainEditor';

function Held({ start, onApi }) {
  const [code, setCode] = useState(start);
  return <><PlainEditor ref={onApi} value={code} onChange={setCode} /><output data-testid="code">{code}</output></>;
}
const box = () => screen.getByRole('textbox', { name: 'Your code' });
const code = () => screen.getByTestId('code').textContent;
const cursorAt = (at, to = at) => { box().focus(); box().setSelectionRange(at, to); };

test('it shows the code with a number beside every line, because error messages name a line', () => {
  render(<Held start={'name = "Sam"\nprint(name)\nprint("bye")'} />);
  expect(box().value).toBe('name = "Sam"\nprint(name)\nprint("bye")');
  expect(document.querySelector('.plain-editor__numbers').textContent).toBe('123');
});

test('typing changes the code', () => {
  render(<Held start="print(1)" />);
  fireEvent.change(box(), { target: { value: 'print(12)' } });
  expect(code()).toBe('print(12)');
});

test('Tab types four spaces where the cursor is, and stays in the editor', () => {
  render(<Held start={'if x:\nprint(x)'} />);
  cursorAt(6);
  const press = fireEvent.keyDown(box(), { key: 'Tab' });
  expect(press).toBe(false);                           // the browser's own Tab (leave the box) was stopped
  expect(code()).toBe('if x:\n    print(x)');
  expect(box().selectionStart).toBe(10);
});

test('Enter keeps the indent, and adds one after a colon', () => {
  expect(newlineFor('print(1)')).toBe('\n');
  expect(newlineFor('for i in range(3):')).toBe('\n    ');
  expect(newlineFor('for i in range(3):\n    print(i)')).toBe('\n    ');
  expect(newlineFor('    if ok:  # check')).toBe('\n        ');
  render(<Held start="for i in range(3):" />);
  cursorAt(18);
  fireEvent.keyDown(box(), { key: 'Enter' });
  expect(code()).toBe('for i in range(3):\n    ');
  expect(box().selectionStart).toBe(23);
});

test('Backspace takes a whole indent back', () => {
  render(<Held start={'if x:\n        y = 1'} />);
  cursorAt(14);
  fireEvent.keyDown(box(), { key: 'Backspace' });
  expect(code()).toBe('if x:\n    y = 1');
  expect(box().selectionStart).toBe(10);
});

test('Ctrl+Enter is left for the runner: it means Run', () => {
  render(<Held start="print(1)" />);
  cursorAt(8);
  const press = fireEvent.keyDown(box(), { key: 'Enter', ctrlKey: true });
  expect(press).toBe(true);
  expect(code()).toBe('print(1)');
});

test('a symbol key puts its text where the cursor is, replaces a selection, and leaves the cursor after it', () => {
  let api;
  render(<Held start="print(Hi)" onApi={(held) => { api = held; }} />);
  cursorAt(6);
  act(() => { expect(api.typeAtCursor('"')).toBe(true); });
  expect(code()).toBe('print("Hi)');
  expect(box().selectionStart).toBe(7);
  expect(document.activeElement).toBe(box());
  cursorAt(0, 5);
  act(() => { api.typeAtCursor('say'); });
  expect(code()).toBe('say("Hi)');
  expect(box().selectionStart).toBe(3);
});

test('it does not correct or capitalise what a child types', () => {
  render(<Held start="" />);
  expect(box()).toHaveAttribute('spellcheck', 'false');
  expect(box()).toHaveAttribute('autocapitalize', 'off');
  expect(box()).toHaveAttribute('autocorrect', 'off');
});

describe('colour', () => {
  const kinds = (text) => paintPython(text).filter(([kind]) => kind !== 'plain').map(([kind, piece]) => `${kind}:${piece}`);

  test('every letter is still there, in order: the paint is the text', () => {
    for (const text of ['', 'print("Hello!")', 'for i in range(3):\n    print(i)  # count\n', 'name = "Sam\nprint(name)', "x = 'it''s'\n\n\n", 'a = """two\nlines"""\nb = 2.5', 'c = """never closed\nprint(1)']) {
      expect(paintPython(text).map(([, piece]) => piece).join('')).toBe(text);
    }
  });

  test('words Python owns, built-ins being called, strings, numbers and comments each get their colour', () => {
    expect(kinds('for i in range(3):\n    print("frog", i)  # jump')).toEqual(['keyword:for', 'keyword:in', 'builtin:range', 'number:3', 'builtin:print', 'string:"frog"', 'comment:# jump']);
    expect(kinds('score = 10\nif score > 5 and True:\n    return None')).toEqual(['number:10', 'keyword:if', 'number:5', 'keyword:and', 'keyword:True', 'keyword:return', 'keyword:None']);
  });

  test('a name that only contains one of those words is left alone', () => {
    expect(kinds('printer = information\nformat = define')).toEqual([]);
    expect(kinds('print = 3')).toEqual(['number:3']);            // print with no bracket is just a name here
  });

  test('a quote left open colours to the end of its line and no further, so the mistake shows', () => {
    expect(kinds('print("Hello)\nprint(1)')).toEqual(['builtin:print', 'string:"Hello)', 'builtin:print', 'number:1']);
  });

  test('a # inside a string is part of the string', () => {
    expect(kinds('print("# not a comment")')).toEqual(['builtin:print', 'string:"# not a comment"']);
  });

  test('the coloured copy sits under the textarea, hidden from a screen reader; the studio HTML is not coloured as Python', () => {
    const first = render(<PlainEditor value={'print("Hi")'} onChange={() => {}} />);
    const paint = first.container.querySelector('.plain-editor__paint');
    expect(paint).toHaveAttribute('aria-hidden', 'true');
    expect(paint.textContent.startsWith('print("Hi")')).toBe(true);
    expect(paint.querySelector('.pe-string').textContent).toBe('"Hi"');
    expect(screen.getByRole('textbox', { name: 'Your code' }).value).toBe('print("Hi")');
    first.unmount();
    const html = render(<PlainEditor value="<h1>Hi</h1>" onChange={() => {}} language="html" />);
    expect(html.container.querySelector('.plain-editor__paint')).toBeNull();
  });
});
