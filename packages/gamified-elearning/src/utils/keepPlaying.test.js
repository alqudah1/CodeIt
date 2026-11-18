import { useCallback, useRef, useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import { REPLAY_AFTER_MS, useKeepPlaying } from './keepPlaying';

// A game nobody is playing starts again by itself; a game the child is in is
// left alone. See keepPlaying.js for where this was seen.

function Watched() {
  const frame = useRef(null);
  const other = useRef(null);
  const [replays, setReplays] = useState(0);
  const replay = useCallback(() => setReplays((n) => n + 1), []);
  useKeepPlaying(frame, replay);
  return (
    <div>
      <iframe ref={frame} title="the game" tabIndex={0} />
      <iframe ref={other} title="another frame" />
      <input aria-label="the code" />
      <output>{replays}</output>
    </div>
  );
}

const says = (title, type) => act(() => {
  window.dispatchEvent(new MessageEvent('message', { data: { type, score: 1 }, source: screen.getByTitle(title).contentWindow }));
});
const replays = () => Number(screen.getByRole('status').textContent);

beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

test('the game ends with nobody in it: it starts again a moment later, once', () => {
  render(<Watched />);
  says('the game', 'CODEIT_LOST');
  expect(replays()).toBe(0);
  act(() => { jest.advanceTimersByTime(REPLAY_AFTER_MS - 1); });
  expect(replays()).toBe(0);
  act(() => { jest.advanceTimersByTime(1); });
  expect(replays()).toBe(1);
  act(() => { jest.advanceTimersByTime(REPLAY_AFTER_MS * 3); });
  expect(replays()).toBe(1);
});

test('a win with nobody in it starts again too', () => {
  render(<Watched />);
  says('the game', 'CODEIT_WON');
  act(() => { jest.advanceTimersByTime(REPLAY_AFTER_MS); });
  expect(replays()).toBe(1);
});

test('the child is in the game: their Game over stays, with their own Play again', () => {
  render(<Watched />);
  act(() => { screen.getByTitle('the game').focus(); });
  expect(document.activeElement).toBe(screen.getByTitle('the game'));
  says('the game', 'CODEIT_LOST');
  act(() => { jest.advanceTimersByTime(REPLAY_AFTER_MS * 2); });
  expect(replays()).toBe(0);
});

test('the child taps into the game in the moment before it would start again: it is left alone', () => {
  render(<Watched />);
  says('the game', 'CODEIT_LOST');
  act(() => { jest.advanceTimersByTime(REPLAY_AFTER_MS / 2); screen.getByTitle('the game').focus(); });
  act(() => { jest.advanceTimersByTime(REPLAY_AFTER_MS); });
  expect(replays()).toBe(0);
});

test('typing in the code is not playing: the game starts again', () => {
  render(<Watched />);
  act(() => { screen.getByLabelText('the code').focus(); });
  says('the game', 'CODEIT_LOST');
  act(() => { jest.advanceTimersByTime(REPLAY_AFTER_MS); });
  expect(replays()).toBe(1);
});

test('another frame ending, or the game only reporting a score, starts nothing', () => {
  render(<Watched />);
  says('another frame', 'CODEIT_LOST');
  says('the game', 'CODEIT_SCORE');
  act(() => { jest.advanceTimersByTime(REPLAY_AFTER_MS * 2); });
  expect(replays()).toBe(0);
});

test('leaving the page forgets a restart that was about to happen', () => {
  const view = render(<Watched />);
  says('the game', 'CODEIT_LOST');
  view.unmount();
  expect(() => act(() => { jest.advanceTimersByTime(REPLAY_AFTER_MS * 2); })).not.toThrow();
});
