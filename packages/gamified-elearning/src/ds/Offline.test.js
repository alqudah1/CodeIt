import { act, fireEvent, render, screen } from '@testing-library/react';
import Offline, { OfflineStrip, Waiting, isUnreachable, useRetry, whyUnreachable } from './Offline';

// What a person reads when CodeIt cannot be reached, and that it tries again
// by itself. The sentence changes with the reason: this device has no
// internet, or the device is fine and CodeIt is not answering.

const setOnline = (on) => Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => on });
afterEach(() => { setOnline(true); jest.useRealTimers(); });

test('a fetch that nothing answered is told apart from an answer that was no', () => {
  expect(isUnreachable(new TypeError('Failed to fetch'))).toBe(true);
  expect(isUnreachable(new TypeError('NetworkError when attempting to fetch resource.'))).toBe(true);
  expect(isUnreachable(new TypeError('Load failed'))).toBe(true);
  expect(isUnreachable(Object.assign(new Error('x'), { name: 'AbortError' }))).toBe(true);
  expect(isUnreachable(null, { status: 502 })).toBe(true);
  expect(isUnreachable(null, { status: 504 })).toBe(true);
  // A wrong code, a bug, a refusal: those are answers, and keep their own words.
  expect(isUnreachable(null, { status: 404 })).toBe(false);
  expect(isUnreachable(null, { status: 503 })).toBe(false);
  expect(isUnreachable(new TypeError("Cannot read properties of null (reading 'x')"))).toBe(false);
  expect(isUnreachable(new Error('No class has that code.'))).toBe(false);
});

test('the reason is the true one: no internet on this device, or CodeIt not answering', () => {
  expect(whyUnreachable()).toBe('CodeIt is not answering right now.');
  setOnline(false);
  expect(whyUnreachable()).toBe('This device is not connected to the internet.');
  render(<Offline />);
  expect(screen.getByText('No internet')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('This device is not connected to the internet. Nothing is lost.');
});

test('the card says nothing is lost and its button tries again', async () => {
  const retry = jest.fn(() => Promise.resolve());
  render(<Offline onRetry={retry} detail="Your classes are safe." />);
  expect(screen.getByRole('heading', { name: 'This cannot load right now.' })).toBeInTheDocument();
  expect(screen.getByText(/Your classes are safe\./)).toBeInTheDocument();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Try again now' })); });
  expect(retry).toHaveBeenCalledTimes(1);
});

test('it tries again by itself every 15 seconds, and the moment the device is back online', () => {
  jest.useFakeTimers();
  const fn = jest.fn();
  function Probe({ on }) { useRetry(fn, on); return null; }
  const { rerender } = render(<Probe on />);
  act(() => { jest.advanceTimersByTime(15000); });
  expect(fn).toHaveBeenCalledTimes(1);
  act(() => { window.dispatchEvent(new Event('online')); });
  expect(fn).toHaveBeenCalledTimes(2);
  rerender(<Probe on={false} />);
  act(() => { jest.advanceTimersByTime(60000); window.dispatchEvent(new Event('online')); });
  expect(fn).toHaveBeenCalledTimes(2);
});

test('a long wait admits it is long', () => {
  jest.useFakeTimers();
  render(<Waiting what="the board" />);
  expect(screen.getByText('Loading the board.')).toBeInTheDocument();
  act(() => { jest.advanceTimersByTime(8000); });
  expect(screen.getByText(/Still waiting for the board\. The connection is slow/)).toBeInTheDocument();
});

test('a page showing old numbers says how old', () => {
  render(<OfflineStrip since="9:41" onRetry={() => {}} />);
  expect(screen.getByRole('status')).toHaveTextContent('Connection lost, showing what was here at 9:41. Trying again.');
});
