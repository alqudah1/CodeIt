import React, { createContext, useContext, useMemo, useState } from "react";

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  // Minimal state to satisfy existing imports.
  // You can extend this later to match your real progress system.
  const [progress, setProgress] = useState({
    lessonsCompleted: {},
    quizzesCompleted: {},
    puzzlesCompleted: {},
  });

  const api = useMemo(() => {
    const markLessonComplete = (lessonId) =>
      setProgress((p) => ({
        ...p,
        lessonsCompleted: { ...p.lessonsCompleted, [lessonId]: true },
      }));

    const markQuizComplete = (quizId) =>
      setProgress((p) => ({
        ...p,
        quizzesCompleted: { ...p.quizzesCompleted, [quizId]: true },
      }));

    const markPuzzleComplete = (puzzleId) =>
      setProgress((p) => ({
        ...p,
        puzzlesCompleted: { ...p.puzzlesCompleted, [puzzleId]: true },
      }));

    const isLessonComplete = (lessonId) => !!progress.lessonsCompleted[lessonId];
    const isQuizComplete = (quizId) => !!progress.quizzesCompleted[quizId];
    const isPuzzleComplete = (puzzleId) => !!progress.puzzlesCompleted[puzzleId];

    return {
      progress,
      setProgress,
      markLessonComplete,
      markQuizComplete,
      markPuzzleComplete,
      isLessonComplete,
      isQuizComplete,
      isPuzzleComplete,
    };
  }, [progress]);

  return (
    <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return ctx;
}
