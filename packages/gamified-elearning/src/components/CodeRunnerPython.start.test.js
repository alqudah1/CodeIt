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
