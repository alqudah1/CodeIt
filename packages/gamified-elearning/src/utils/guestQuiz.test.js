import { KEEP_FOR_MS, forgetGuestQuiz, rememberGuestQuiz, waitingGuestQuiz } from './guestQuiz';

function box() {
  const data = {};
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, removeItem: (k) => { delete data[k]; } };
}

describe('a quiz a visitor finished', () => {
  test('waits for an account, for that quiz only', () => {
    const s = box();
    rememberGuestQuiz(1, { 11: 'print', 12: 'a string' }, 1000, s);
    expect(waitingGuestQuiz(1, 2000, s)).toEqual({ 11: 'print', 12: 'a string' });
    expect(waitingGuestQuiz('1', 2000, s)).toEqual({ 11: 'print', 12: 'a string' });
    expect(waitingGuestQuiz(2, 2000, s)).toBeNull();
  });

  test('does not wait for ever: the next child at the computer must not inherit it', () => {
    const s = box();
    rememberGuestQuiz(1, { 11: 'print' }, 1000, s);
    expect(waitingGuestQuiz(1, 1000 + KEEP_FOR_MS, s)).not.toBeNull();
    expect(waitingGuestQuiz(1, 1001 + KEEP_FOR_MS, s)).toBeNull();
  });

  test('is gone once it has been handed over', () => {
    const s = box();
    rememberGuestQuiz(1, { 11: 'print' }, 1000, s);
    forgetGuestQuiz(s);
    expect(waitingGuestQuiz(1, 2000, s)).toBeNull();
  });

  test('nonsense is nothing, not an error', () => {
    const s = box();
    rememberGuestQuiz('abc', { 1: 'x' }, 1000, s);
    rememberGuestQuiz(1, null, 1000, s);
    expect(waitingGuestQuiz(1, 2000, s)).toBeNull();
    s.setItem('codeit.guest.quiz', '{broken');
    expect(waitingGuestQuiz(1, 2000, s)).toBeNull();
    s.setItem('codeit.guest.quiz', JSON.stringify({ quizId: 1, answers: { 1: 'x' }, at: 5000 }));
    expect(waitingGuestQuiz(1, 2000, s)).toBeNull();
  });
});
