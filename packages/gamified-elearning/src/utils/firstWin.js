export function isFirstWinState({
  loading,
  completedLessons = 0,
  completedQuizzes = 0,
  completedPuzzles = 0,
  xp = 0,
}) {
  return !loading
    && Number(completedLessons) === 0
    && Number(completedQuizzes) === 0
    && Number(completedPuzzles) === 0
    && Number(xp) === 0;
}
