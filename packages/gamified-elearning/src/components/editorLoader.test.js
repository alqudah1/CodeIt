// Which editor a lesson gets: the coloured one if its file arrives, the plain
// one if it does not. A lesson must never be left with no editor.
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import CodeRunnerPython from './CodeRunnerPython';
import { editorNow, fetchEditor, forgetEditor } from './editorLoader';

jest.mock('../utils/pyodideLoader', () => ({ getPyodideRuntime: () => new Promise(() => {}) }));

// The coloured editor's file: stopped on the way until a test lets it through.
let mockArrives = false;
jest.mock('./PythonEditor', () => {
  if (!mockArrives) throw Object.assign(new Error('Loading chunk 579 failed.'), { name: 'ChunkLoadError' });
  const ReactInside = require('react');
  return { __esModule: true, default: ReactInside.forwardRef((props, ref) => ReactInside.createElement('div', { 'data-testid': 'coloured', ref }, props.value)) };
});

const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe('when the coloured editor\'s file is stopped on the way', () => {
  beforeEach(() => { mockArrives = false; forgetEditor(); });

  test('the loader answers with nothing, once, and does not throw', async () => {
    expect(editorNow()).toBeUndefined();
    const asked = fetchEditor();
    await expect(asked).resolves.toBeNull();
    expect(editorNow()).toBeNull();
    expect(fetchEditor()).toBe(asked);
  });

  test('the runner shows the plain editor with the code in it, and the code can be changed', async () => {
    render(<CodeRunnerPython starterCode={'print("Hello!")'} />);
    await flush();
    const box = screen.getByRole('textbox', { name: 'Your code' });
    expect(box.value).toBe('print("Hello!")');
    fireEvent.change(box, { target: { value: 'print("Hi Sam")' } });
    expect(box.value).toBe('print("Hi Sam")');
  });
});

describe('when it arrives', () => {
  beforeEach(() => { mockArrives = true; forgetEditor(); });

  test('the runner uses it, and until then the code is on screen to read', async () => {
    render(<CodeRunnerPython starterCode={'print("Hello!")'} />);
    expect(document.querySelector('.cr-editor-wait').textContent).toBe('print("Hello!")');
    await flush();
    expect(screen.getByTestId('coloured').textContent).toBe('print("Hello!")');
    expect(document.querySelector('.cr-editor-wait')).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Your code' })).toBeNull();
  });
});
