// The symbol keys: what a phone keyboard hides, as keys a child can hit.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SymbolKeys } from './CodeRunnerPython';

jest.mock('@uiw/react-codemirror', () => ({ __esModule: true, default: () => null, EditorView: { lineWrapping: {} } }));
jest.mock('@codemirror/lang-python', () => ({ python: () => ({}) }));
jest.mock('../utils/pyodideLoader', () => ({ getPyodideRuntime: () => new Promise(() => {}) }));

test('the keys are the symbols Python needs, each named for a screen reader', () => {
  const typed = [];
  render(<SymbolKeys onKey={(text) => typed.push(text)} />);
  for (const name of ['quote mark', 'open bracket', 'close bracket', 'equals', 'colon', 'open square bracket', 'close square bracket', 'comma', 'plus']) fireEvent.click(screen.getByRole('button', { name }));
  fireEvent.click(screen.getByRole('button', { name: 'indent, four spaces' }));
  expect(typed).toEqual(['"', '(', ')', '=', ':', '[', ']', ',', '+', '    ']);
});

test('pressing a key does not take focus from the editor, so the phone keyboard stays up', () => {
  render(<SymbolKeys onKey={() => {}} />);
  const key = screen.getByRole('button', { name: 'quote mark' });
  const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
  key.dispatchEvent(down);
  expect(down.defaultPrevented).toBe(true);
});
