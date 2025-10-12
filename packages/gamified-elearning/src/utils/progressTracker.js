// Progress tracking utilities for the frontend
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/rewards';

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

// Track lesson completion
export const trackLessonCompletion = async (lessonId, performance = {}) => {
  try {
    const response = await apiClient.post('/lesson-complete', {
      lessonId,
      isFirstAttempt: performance.isFirstAttempt || true,
      isPerfect: performance.isPerfect || false,
      completionTime: performance.completionTime || 0, // in seconds
    });
    
    return response.data;
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

// Track daily login
export const trackDailyLogin = async () => {
  try {
    const response = await apiClient.post('/daily-login');
    return response.data;
  } catch (error) {
    console.error('Error tracking daily login:', error);
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

// Get leaderboard
export const getLeaderboard = async (type = 'all_time', period = null) => {
  try {
    const params = period ? { period } : {};
    const response = await apiClient.get(`/leaderboard/${type}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
};

// Helper function to track lesson completion from static pages
export const trackStaticLessonCompletion = async (lessonNumber, timeSpent) => {
  const lessonId = lessonNumber; // Since lessons are static, use lesson number as ID
  
  // Check if this is first attempt (you might want to store this in localStorage)
  const lessonKey = `lesson_${lessonNumber}_attempted`;
  const isFirstAttempt = !localStorage.getItem(lessonKey);
  
  // Mark as attempted
  localStorage.setItem(lessonKey, 'true');
  
  // Track completion
  const result = await trackLessonCompletion(lessonId, {
    isFirstAttempt,
    isPerfect: true, // Assume perfect for static lessons
    completionTime: timeSpent,
  });
  
  return result;
};

// Helper function to track game completion from puzzle games
export const trackPuzzleGameCompletion = async (lessonNumber, gameType, score, timeSpent) => {
  const lessonId = lessonNumber;
  
  // Check if this is high score (you might want to compare with stored scores)
  const scoreKey = `game_${lessonNumber}_${gameType}_high_score`;
  const currentHighScore = parseInt(localStorage.getItem(scoreKey) || '0');
  const isHighScore = score > currentHighScore;
  
  if (isHighScore) {
    localStorage.setItem(scoreKey, score.toString());
  }
  
  // Track completion
  const result = await trackGameCompletion(lessonId, gameType, {
    score,
    isHighScore,
    attempts: 1, // You might want to track this more accurately
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
    font-family: Arial, sans-serif;
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

// Auto-track daily login on page load
export const autoTrackDailyLogin = async () => {
  const today = new Date().toDateString();
  const lastLogin = localStorage.getItem('last_daily_login');
  
  if (lastLogin !== today) {
    try {
      const result = await trackDailyLogin();
      localStorage.setItem('last_daily_login', today);
      
      if (result.xpEarned > 0) {
        showXPNotification(result.xpEarned, result.xpEarned, 0);
      }
      
      return result;
    } catch (error) {
      console.error('Auto daily login tracking failed:', error);
    }
  }
};

// Initialize time tracker for current page
export const initializeTimeTracker = () => {
  return new TimeTracker();
};

export default {
  trackLessonCompletion,
  trackGameCompletion,
  trackDailyLogin,
  getStudentProgress,
  getLeaderboard,
  trackStaticLessonCompletion,
  trackPuzzleGameCompletion,
  showXPNotification,
  TimeTracker,
  autoTrackDailyLogin,
  initializeTimeTracker,
};

