// API Configuration for CodeIt E-Learning Platform

// Backend API base URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Robot Puzzle project base URL
export const PUZZLE_BASE_URL = process.env.REACT_APP_PUZZLE_URL || 'http://localhost:3001';

// API endpoints
export const ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
  },
  rewards: {
    progress: `${API_BASE_URL}/api/rewards/progress-percentages`,
  },
  quiz: {
    base: `${API_BASE_URL}/api/quiz`,
  },
};

export default {
  API_BASE_URL,
  PUZZLE_BASE_URL,
  ENDPOINTS,
};

