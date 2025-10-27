// Progress tracking utilities for the robot-puzzle frontend
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/rewards';

// Get auth token from localStorage or sessionStorage
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

// Track game completion
export const trackPuzzleGameCompletion = async (lessonNumber, gameType, score, timeSpent) => {
  try {
    const response = await apiClient.post('/game-complete', {
      lessonId: lessonNumber,
      gameType,
      score,
      isHighScore: true, // Assume high score for puzzle games
      attempts: 1,
      completionTime: timeSpent,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error tracking game completion:', error);
    throw error;
  }
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

// Initialize time tracker for current page
export const initializeTimeTracker = () => {
  return new TimeTracker();
};

export default {
  trackPuzzleGameCompletion,
  showXPNotification,
  TimeTracker,
  initializeTimeTracker,
};









