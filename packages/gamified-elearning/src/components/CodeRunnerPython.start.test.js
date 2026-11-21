// When a lesson fetches Python.
//
// 13 November 2026, PageSpeed Insights on a mid-range phone: a lesson page was
// busy for seven seconds as it opened, because Python (six megabytes) started
// before anybody had touched anything. It now waits for a person, or for a few
// quiet seconds.
import React from 'react';
import { render, act, fireEvent, screen } from '@testing-library/react';
import CodeRunnerPython, { PYTHON_AFTER_MS } from './CodeRunnerPython';
import { getPyodideRuntime } from '../utils/pyodideLoader';

jest.mock('../utils/pyodideLoader', () => ({ getPyodideRuntime: jest.fn() }));
jest.mock('./PythonEditor', () => {
  const ReactInside = require('react');
  return { __esModule: true, default: ReactInside.forwardRef((props, ref) => ReactInside.createElement('div', { ref }, props.value)) };
});

// Python that is on its way and never lands: enough to see when it was asked for.
beforeEach(() => { jest.useFakeTimers(); getPyodideRuntime.mockReset(); getPyodideRuntime.mockImplementation(() => new Promise(() => {})); delete window.pyodide; });
afterEach(() => { jest.useRealTimers(); });

test('opening a lesson does not fetch Python straight away', () => {
  render(<CodeRunnerPython starterCode={'print("Hello!")'} />);
  act(() => { jest.advanceTimersByTime(PYTHON_AFTER_MS - 100); });
  expect(getPyodideRuntime).not.toHaveBeenCalled();
});

test('the first tap anywhere on the page fetches it, once', () => {
  render(<CodeRunnerPython starterCode={'print("Hello!")'} />);
  act(() => { fireEvent.pointerDown(document.body); });
  expect(getPyodideRuntime).toHaveBeenCalledTimes(1);
  act(() => { fireEvent.pointerDown(document.body); fireEvent.keyDown(document.body, { key: 'a' }); jest.advanceTimersByTime(PYTHON_AFTER_MS * 2); });
  expect(getPyodideRuntime).toHaveBeenCalledTimes(1);
});

test('so does the first key, for a child who starts by typing', () => {
  render(<CodeRunnerPython starterCode={'print("Hello!")'} />);
  act(() => { fireEvent.keyDown(document.body, { key: 'Tab' }); });
  expect(getPyodideRuntime).toHaveBeenCalledTimes(1);
});

test('a page nobody touches still fetches it after a few quiet seconds', () => {
  render(<CodeRunnerPython starterCode={'print("Hello!")'} />);
  act(() => { jest.advanceTimersByTime(PYTHON_AFTER_MS + 50); });
  expect(getPyodideRuntime).toHaveBeenCalledTimes(1);
});

test('a page that is left before then never fetches it', () => {
  const { unmount } = render(<CodeRunnerPython starterCode={'print("Hello!")'} />);
  unmount();
  act(() => { fireEvent.pointerDown(document.body); jest.advanceTimersByTime(PYTHON_AFTER_MS * 2); });
  expect(getPyodideRuntime).not.toHaveBeenCalled();
});

test('the home page editor still waits for Run and nothing else', () => {
  render(<CodeRunnerPython starterCode={'print("Hello!")'} loadPython="demand" />);
  act(() => { fireEvent.pointerDown(document.body); jest.advanceTimersByTime(PYTHON_AFTER_MS * 2); });
  expect(getPyodideRuntime).not.toHaveBeenCalled();
});

test('while it is on its way the page says so by name', () => {
  render(<CodeRunnerPython starterCode={'print("Hello!")'} />);
  act(() => { fireEvent.pointerDown(document.body); });
  expect(screen.getAllByText(/Starting Python/).length).toBeGreaterThan(0);
});

test('a Run pressed while Python is on its way is kept, and runs when Python lands', async () => {
  // The first tap on the page is the Run button itself: the tap starts
  // Python, and the same tap is a Run. It must not be lost.
  let land;
  // What the loader hands over is a handle with run(), not Pyodide itself:
  // Python lives in a worker now (utils/pyodideLoader.js).
  const python = { run: jest.fn(() => Promise.resolve({ output: 'Hello!\n', varsJson: '' })) };
  getPyodideRuntime.mockImplementation(() => new Promise((resolve) => { land = () => { window.pyodide = python; resolve(python); }; }));
  const heard = [];
  render(<CodeRunnerPython starterCode={'print("Hello!")'} onOutput={(out) => heard.push(out)} />);
  const run = screen.getByTitle(/Python starts the first time you press Run|Run your Python code/);
  act(() => { fireEvent.pointerDown(run); });
  expect(run).not.toBeDisabled();                      // still pressable while Python starts
  act(() => { fireEvent.click(run); });
  act(() => { fireEvent.click(run); });                // an impatient second press does not queue a second run
  expect(python.run).not.toHaveBeenCalled();
  await act(async () => { land(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
  expect(python.run).toHaveBeenCalledTimes(1);
  expect(python.run).toHaveBeenCalledWith('print("Hello!")', { varsSource: '' });
  expect(heard).toEqual(['Hello!']);
  delete window.pyodide;
});

// 21 November 2026: `while True: pass` locked the tab, because the ten-second
// timer shared a thread with the loop it was meant to stop.
test('code stopped by the time limit says so, in words about loops, and the button comes back', async () => {
  const limit = Object.assign(new Error('⏱ Stopped after 10 seconds. A loop that never ends does this. Check that something inside the loop changes, so the loop can finish.'), { timedOut: true });
  const python = { run: jest.fn(() => Promise.reject(limit)) };
  window.pyodide = python;
  getPyodideRuntime.mockImplementation(() => Promise.resolve(python));
  const heard = [];
  render(<CodeRunnerPython starterCode={'while True:\n    pass'} onOutput={(out, code, info) => heard.push([out, info])} />);
  const run = screen.getByTitle(/Python starts the first time you press Run|Run your Python code/);
  await act(async () => { fireEvent.click(run); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
  expect(screen.getByText(/Stopped after 10 seconds\. A loop that never ends does this\./)).toBeInTheDocument();
  expect(heard[0][1]).toEqual({ success: false, say: 'Your code ran for 10 seconds and was stopped. Is there a loop that never ends?' });
  expect(run).not.toBeDisabled();
  delete window.pyodide;
});
