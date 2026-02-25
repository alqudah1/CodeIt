// API Configuration for CodeIt E-Learning Platform

// Base URL for this deployed site (e.g., http://16.52.76.173)
export const SITE_ORIGIN = window.location.origin;

// Backend API base URL (Apache proxies /api -> 127.0.0.1:8080/api)
export const API_BASE_URL = process.env.REACT_APP_API_URL || SITE_ORIGIN;

// Robot Puzzle project base URL (Apache proxies puzzle/game routes on same origin)
export const PUZZLE_BASE_URL = process.env.REACT_APP_PUZZLE_URL || SITE_ORIGIN;

// API endpoints
export const ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
  },
  rewards: {
    progress:    `${API_BASE_URL}/api/rewards/progress-percentages`,
    leaderboard: `${API_BASE_URL}/api/rewards/leaderboard`,
  },
  quiz: {
    base: `${API_BASE_URL}/api/quiz`,
  },
  leaderboard: {
    base: `${API_BASE_URL}/api/leaderboard`, // we’ll implement backend route
  },
};

export default {
  SITE_ORIGIN,
  API_BASE_URL,
  PUZZLE_BASE_URL,
  ENDPOINTS,
};
