import { hasQuiz, loadQuizIds, resetQuizCache } from './quizAvailability';

beforeEach(() => {
  resetQuizCache();
  global.fetch = jest.fn();
});

// ── The three states, and why the third one exists ──────────────────────────

test('a lesson with a quiz offers it', () => {
  expect(hasQuiz([1, 2, 3, 16], 2)).toBe(true);
});

test('a lesson with no quiz does not', () => {
  // Lessons 17 to 31 are the real case: the curriculum grew, the questions did
  // not, and every one of them ended on a button promising a quiz that did not
  // exist.
  expect(hasQuiz([1, 2, 3, 16], 17)).toBe(false);
  expect(hasQuiz([1, 2, 3, 16], 31)).toBe(false);
});

test('not knowing is not the same as knowing there is none', () => {
  // If a failed request read as "no quiz", one network blip would silently
  // hide the sixteen quizzes that DO exist. Showing an empty quiz is a smaller
  // harm than hiding a real one, so unknown behaves like "probably yes".
  expect(hasQuiz(null, 2)).toBe(true);
  expect(hasQuiz(undefined, 2)).toBe(true);
  expect(hasQuiz('nonsense', 2)).toBe(true);
});

test('a lesson id given as a string still matches', () => {
  // The id comes out of the URL, so it is a string every time.
  expect(hasQuiz([1, 2, 3], '2')).toBe(true);
  expect(hasQuiz([1, 2, 3], '17')).toBe(false);
});

// ── Asking the server ───────────────────────────────────────────────────────

test('it reads the list the server sends', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ quizIds: [1, 2, 16] }) });
  await expect(loadQuizIds()).resolves.toEqual([1, 2, 16]);
});

test('it asks once, however many lessons ask it', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ quizIds: [1] }) });
  await Promise.all([loadQuizIds(), loadQuizIds(), loadQuizIds()]);
  await loadQuizIds();
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('a failure answers "do not know", not "none"', async () => {
  global.fetch.mockRejectedValue(new Error('offline'));
  await expect(loadQuizIds()).resolves.toBeNull();
});

test('a server error answers "do not know" too', async () => {
  global.fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
  await expect(loadQuizIds()).resolves.toBeNull();
});

test('a malformed body answers "do not know"', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ quizIds: 'all of them' }) });
  await expect(loadQuizIds()).resolves.toBeNull();
});

test('an empty database means every lesson just ends, and does not crash', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ quizIds: [] }) });
  const ids = await loadQuizIds();
  expect(ids).toEqual([]);
  expect(hasQuiz(ids, 1)).toBe(false);
});
