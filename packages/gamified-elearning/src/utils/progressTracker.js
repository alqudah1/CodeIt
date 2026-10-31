// Progress tracking utilities for the frontend
import axios from 'axios';
import { journeyHeaders } from './journey';

const API_BASE_URL = '';

// Get auth token from localStorage or context
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Create axios instance with auth header
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // The same session journey and campaign code every other request carries
  // (first-use review, 11 September): without them a lesson completion could
  // never be joined to the visit that brought the family here, so the
  // campaign report could count visits and signups but never a finished
  // lesson. Session-scoped, no learner data.
  Object.assign(config.headers, journeyHeaders());
  return config;
});

// Track lesson completion — calls the real backend endpoint
export const trackLessonCompletion = async (lessonId) => {
  try {
    const response = await apiClient.post(`/api/lessons/${lessonId}/complete`);
    return response.data; // { success, alreadyCompleted, xpEarned }
  } catch (error) {
    console.error('Error tracking lesson completion:', error);
    throw error;
  }
};

// Helper function to track lesson completion from static pages
export const trackStaticLessonCompletion = async (lessonNumber) => {
  // Progress is tracked in DB only — no localStorage flags needed
  const result = await trackLessonCompletion(lessonNumber);
  return result; // { success, alreadyCompleted, xpEarned }
};

// Record a completed lesson exercise once. The backend de-duplicates repeated
// runs, so refreshing or retrying an exercise never creates duplicate updates.
// `xp` is a request, not an instruction: the server decides what a step is worth
// and refuses to pay twice for the same one. Returns { xpEarned } so the lesson
// only ever celebrates XP that was really banked.
export const trackExerciseCompletion = async (lessonId, exerciseIndex, title, xp) => {
  const token = getAuthToken();
  if (!token) return { recorded: false, reason: 'guest', xpEarned: 0 };
  const response = await apiClient.post('/api/progress-notifications/exercise-complete', {
    lessonId,
    exerciseIndex,
    title,
    xp,
  });
  return response.data;
};

// Removed on 31 October 2026, with nothing calling them: trackGameCompletion
// (POST /game-complete), getStudentProgress (GET /progress),
// trackPuzzleGameCompletion (PUT /api/profile/game-score),
// autoTrackDailyLogin (POST /api/profile/daily-activity), a toast helper and
// a time tracker. None of those addresses exists on the server;
// codeit-backend/apiContract.test.js now fails on any address that does not.
