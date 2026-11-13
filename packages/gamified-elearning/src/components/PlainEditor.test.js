// The editor a pupil types into when the coloured one cannot arrive.
//
// 13 November 2026: a school's filter answered 403 to every large script, and
// the coloured editor is 185 KB in one piece. A lesson has to work without it.
import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PlainEditor, { newlineFor } from './PlainEditor';

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
