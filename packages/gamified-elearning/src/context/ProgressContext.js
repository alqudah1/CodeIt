import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const defaultProgress = {
  lessons: { 1: false, 2: false, 3: false, 4: false, 5: false },
  quizzes: { 1: false, 2: false, 3: false, 4: false, 5: false },
  puzzles: { 1: false, 2: false, 3: false, 4: false, 5: false },
};

const ProgressContext = createContext();

const mergeWithDefaults = (stored) => {
  if (!stored) {
    return defaultProgress;
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      lessons: { ...defaultProgress.lessons, ...(parsed.lessons || {}) },
      quizzes: { ...defaultProgress.quizzes, ...(parsed.quizzes || {}) },
      puzzles: { ...defaultProgress.puzzles, ...(parsed.puzzles || {}) },
    };
  } catch (error) {
    console.warn('Failed to parse progress from storage, resetting.', error);
    return defaultProgress;
  }
};

export const ProgressProvider = ({ children }) => {
  const [progress, setProgress] = useState(() => {
    if (typeof window === 'undefined') return defaultProgress;
    return mergeWithDefaults(localStorage.getItem('progress-tracking'));
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch progress from backend
  const fetchProgressFromBackend = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, using local progress only');
        return;
      }

      const response = await axios.get('http://localhost:8080/api/rewards/progress-status', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const backendProgress = response.data.progress;
        setProgress(backendProgress);
        
        // Update localStorage with backend data
        if (typeof window !== 'undefined') {
          localStorage.setItem('progress-tracking', JSON.stringify(backendProgress));
        }
      }
    } catch (error) {
      console.error('Failed to fetch progress from backend:', error);
      setError('Failed to sync progress with server');
      // Continue with local progress if backend fails
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update progress on backend
  const updateProgressOnBackend = useCallback(async (type, id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, updating local progress only');
        return false;
      }

      const response = await axios.post('http://localhost:8080/api/rewards/update-progress', 
        { type, id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data.success;
    } catch (error) {
      console.error('Failed to update progress on backend:', error);
      return false;
    }
  }, []);

  // Load progress from backend on mount
  useEffect(() => {
    fetchProgressFromBackend();
  }, [fetchProgressFromBackend]);

  const updateSection = useCallback(async (section, id) => {
    setProgress((prev) => {
      if (prev[section][id]) {
        return prev;
      }

      const nextState = {
        ...prev,
        [section]: { ...prev[section], [id]: true },
      };

      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('progress-tracking', JSON.stringify(nextState));
      }

      // Update backend
      const type = section === 'lessons' ? 'lesson' : 
                   section === 'quizzes' ? 'quiz' : 'puzzle';
      updateProgressOnBackend(type, id);

      return nextState;
    });
  }, [updateProgressOnBackend]);

  const markLessonComplete = useCallback((lessonId) => updateSection('lessons', lessonId), [updateSection]);
  const markQuizComplete = useCallback((quizId) => updateSection('quizzes', quizId), [updateSection]);
  const markPuzzleComplete = useCallback((puzzleId) => updateSection('puzzles', puzzleId), [updateSection]);

  const value = useMemo(() => {
    const isLessonComplete = (lessonId) => {
      const completed = !!progress.lessons[lessonId];
      console.log(`🔍 Checking if lesson ${lessonId} is complete:`, completed, 'Progress state:', progress.lessons);
      return completed;
    };
    const isQuizComplete = (quizId) => !!progress.quizzes[quizId];
    const isPuzzleComplete = (puzzleId) => !!progress.puzzles[puzzleId];

    const isQuizUnlocked = (quizId) => {
      const unlocked = isLessonComplete(quizId);
      console.log(`🔓 Quiz ${quizId} unlocked:`, unlocked);
      return unlocked;
    };
    const isPuzzleUnlocked = (puzzleId) => isQuizComplete(puzzleId);

    return {
      progress,
      isLoading,
      error,
      isLessonComplete,
      isQuizComplete,
      isPuzzleComplete,
      isQuizUnlocked,
      isPuzzleUnlocked,
      markLessonComplete,
      markQuizComplete,
      markPuzzleComplete,
      refreshProgress: fetchProgressFromBackend,
    };
  }, [progress, isLoading, error, markLessonComplete, markQuizComplete, markPuzzleComplete, fetchProgressFromBackend]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};