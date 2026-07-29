import { isFirstWinState } from './firstWin';

describe('first-session activation state', () => {
  test('shows onboarding only after a verified zero-progress response', () => {
    expect(isFirstWinState({
      loading: false,
      completedLessons: 0,
      completedQuizzes: 0,
      completedPuzzles: 0,
      xp: 0,
    })).toBe(true);
    expect(isFirstWinState({ loading: true })).toBe(false);
  });

  test('does not show onboarding after any meaningful progress', () => {
    expect(isFirstWinState({ loading: false, completedLessons: 1 })).toBe(false);
    expect(isFirstWinState({ loading: false, completedQuizzes: 1 })).toBe(false);
    expect(isFirstWinState({ loading: false, completedPuzzles: 1 })).toBe(false);
    expect(isFirstWinState({ loading: false, xp: 10 })).toBe(false);
  });
});
