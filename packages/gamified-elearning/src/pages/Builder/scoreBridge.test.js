import { beatLink, injectScoreBridge, readScoreMessage, scoreToBeat } from './scoreBridge';

test('a score comes only from the messages a game sends, as a whole number in range', () => {
  expect(readScoreMessage({ type: 'CODEIT_LOST', score: 42 })).toBe(42);
  expect(readScoreMessage({ type: 'CODEIT_ROUND_END', score: 7.9 })).toBe(7);
  expect(readScoreMessage({ type: 'CODEIT_SCORE', score: '12' })).toBe(12);
  expect(readScoreMessage({ type: 'CODEIT_STORAGE', score: 5 })).toBeNull();
  expect(readScoreMessage({ type: 'CODEIT_WON', score: -1 })).toBeNull();
  expect(readScoreMessage({ type: 'CODEIT_WON', score: 1e9 })).toBeNull();
  expect(readScoreMessage(null)).toBeNull();
});

test('the score to beat is a plain positive number in the link, or nothing', () => {
  expect(scoreToBeat('?beat=42')).toBe(42);
  expect(scoreToBeat('?utm_source=x&beat=7')).toBe(7);
  expect(scoreToBeat('?beat=0')).toBeNull();
  expect(scoreToBeat('?beat=-3')).toBeNull();
  expect(scoreToBeat('?beat=4e3')).toBeNull();
  expect(scoreToBeat('?beat=<script>')).toBeNull();
  expect(scoreToBeat('')).toBeNull();
});

test('the link carries the score only when there is one', () => {
  expect(beatLink('/project/abc', 'https://codeitlearn.com', 57)).toBe('https://codeitlearn.com/project/abc?utm_source=project-share&beat=57');
  expect(beatLink('/project/abc', 'https://codeitlearn.com', 0)).toBe('https://codeitlearn.com/project/abc?utm_source=project-share');
});

test('the bridge goes in once, before the body closes', () => {
  const once = injectScoreBridge('<html><body><p id="score">0</p></body></html>');
  expect(once.match(/__codeit_score_bridge/g)).toHaveLength(1);
  expect(once.indexOf('__codeit_score_bridge')).toBeLessThan(once.indexOf('</body>'));
  expect(injectScoreBridge(once)).toBe(once);
});
