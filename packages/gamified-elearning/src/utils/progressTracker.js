// Progress tracking utilities for the frontend
import axios from 'axios';
import { ENDPOINTS } from '../config/api';

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

// Track game completion
export const trackGameCompletion = async (lessonId, gameType, performance = {}) => {
  try {
    const response = await apiClient.post('/game-complete', {
      lessonId,
      gameType,
      score: performance.score || 0,
      isHighScore: performance.isHighScore || false,
      attempts: performance.attempts || 1,
      completionTime: performance.completionTime || 0, // in seconds
    });
    
    return response.data;
  } catch (error) {
    console.error('Error tracking game completion:', error);
    throw error;
  }
};



// Get student progress
export const getStudentProgress = async () => {
  try {
    const response = await apiClient.get('/progress');
    return response.data;
  } catch (error) {
    console.error('Error getting student progress:', error);
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

// Helper function to track game completion from puzzle games
export const trackPuzzleGameCompletion = async (lessonNumber, gameType, score, timeSpent) => {
  const lessonId = lessonNumber;
  const scoreKey = `game_${lessonNumber}_${gameType}`;

  // Save high score to DB (backend uses GREATEST so only updates if higher)
  const token = getAuthToken();
  if (token && typeof score === 'number' && score > 0) {
    try {
      await fetch(ENDPOINTS.profile.gameScore, {
        method:  'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ gameKey: scoreKey, score }),
      });
    } catch {
      // Non-fatal — high score is non-critical; DB will sync on next successful call
    }
  }

  // Track completion — high score comparison handled server-side via GREATEST()
  const result = await trackGameCompletion(lessonId, gameType, {
    score,
    isHighScore: false,
    attempts: 1,
    completionTime: timeSpent,
  });

  return result;
};

// Helper function to show XP notification
export const showXPNotification = (xpEarned, baseXP, bonusXP) => {
  // Create a simple notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4ecca3, #2e9c81);
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: 'Baloo 2', 'Nunito', sans-serif;
    font-weight: bold;
    animation: slideIn 0.3s ease-out;
  `;
  
  let notificationText = `+${xpEarned} XP Earned!`;
  if (bonusXP > 0) {
    notificationText += `\n(Base: ${baseXP}, Bonus: ${bonusXP})`;
  }
  
  notification.textContent = notificationText;
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
};

// Helper function to show a "lesson locked" toast instead of alert()
export const showLessonLockedToast = (lessonNum) => {
  // Remove any existing locked toast to avoid stacking
  const existing = document.getElementById('lesson-locked-toast');
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

  const toast = document.createElement('div');
  toast.id = 'lesson-locked-toast';
  toast.style.cssText = `
    position: fixed;
    top: 22px;
    left: 50%;
    transform: translateX(-50%) translateY(0);
    background: rgba(255, 90, 90, 0.93);
    backdrop-filter: blur(12px);
    color: white;
    padding: 14px 28px;
    border-radius: 999px;
    box-shadow: 0 14px 32px rgba(0,0,0,0.22);
    z-index: 99999;
    font-family: 'Baloo 2', 'Nunito', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    white-space: nowrap;
    animation: llt-in 0.3s ease;
  `;
  toast.textContent = `🔒 Complete this lesson to unlock Quiz ${lessonNum}`;

  if (!document.getElementById('lesson-locked-toast-style')) {
    const style = document.createElement('style');
    style.id = 'lesson-locked-toast-style';
    style.textContent = `
      @keyframes llt-in  { from { opacity:0; transform:translateX(-50%) translateY(-14px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      @keyframes llt-out { from { opacity:1; transform:translateX(-50%) translateY(0); } to { opacity:0; transform:translateX(-50%) translateY(-14px); } }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'llt-out 0.3s ease';
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, 3000);
};

// Helper function to track time spent on pages
export class TimeTracker {
  constructor() {
    this.startTime = Date.now();
    this.isActive = true;
  }
  
  getTimeSpent() {
    return Math.floor((Date.now() - this.startTime) / 1000); // in seconds
  }
  
  pause() {
    this.isActive = false;
  }
  
  resume() {
    this.isActive = true;
  }
  
  reset() {
    this.startTime = Date.now();
  }
}
export const initializeTimeTracker = () => new TimeTracker();

export const autoTrackDailyLogin = async () => {
  // Quick client-side dedup: skip the API call if we already recorded today
  const key = "daily_login_tracked_date";
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(key) === today) return { alreadyTracked: true };

  // Record in DB (updates streak server-side)
  const token = getAuthToken();
  if (token) {
    try {
      const res = await fetch(ENDPOINTS.profile.dailyActivity, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
      });
      if (res.ok) {
        localStorage.setItem(key, today);
        const data = await res.json();
        return { tracked: true, currentStreak: data.currentStreak };
      }
    } catch {
      // Network error — record locally so we don't spam retries all day
      localStorage.setItem(key, today);
    }
  } else {
    // Not logged in — just mark locally
    localStorage.setItem(key, today);
  }

  return { tracked: true };
};
