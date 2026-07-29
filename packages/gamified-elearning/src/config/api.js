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
    login: `${API_BASE_URL}/api/login`,
    register: `${API_BASE_URL}/api/signup`,
  },
  analytics: {
    event: `${API_BASE_URL}/api/analytics/event`,
    funnel: (days = 30) => `${API_BASE_URL}/api/analytics/funnel?days=${days}`,
    costs: (days = 30) => `${API_BASE_URL}/api/analytics/costs?days=${days}`,
  },
  foundingWaitlist: {
    join: `${API_BASE_URL}/api/founding-waitlist`,
    status: `${API_BASE_URL}/api/founding-waitlist/status`,
  },
  family: {
    status: `${API_BASE_URL}/api/family`,
    verification: `${API_BASE_URL}/api/family/verification`,
    children: `${API_BASE_URL}/api/family/children`,
    child: (id) => `${API_BASE_URL}/api/family/children/${id}`,
    childPassword: (id) => `${API_BASE_URL}/api/family/children/${id}/password`,
    childProgressEmails: (id) => `${API_BASE_URL}/api/family/children/${id}/progress-emails`,
  },
  rewards: {
    progress:    `${API_BASE_URL}/api/rewards/progress-percentages`,
    leaderboard: `${API_BASE_URL}/api/rewards/leaderboard`,
  },
  quiz: {
    base:     `${API_BASE_URL}/api/quiz`,
    progress: `${API_BASE_URL}/api/quiz/progress`,
  },
  leaderboard: {
    base: `${API_BASE_URL}/api/leaderboard`,
  },
  lessons: {
    list:     `${API_BASE_URL}/api/lessons`,
    progress: `${API_BASE_URL}/api/lessons/progress`,
    complete: (id) => `${API_BASE_URL}/api/lessons/${id}/complete`,
  },
  puzzles: {
    list:     `${API_BASE_URL}/api/puzzles`,
    progress: `${API_BASE_URL}/api/puzzles/progress`,
    complete: (id) => `${API_BASE_URL}/api/puzzles/${id}/complete`,
  },
  profile: {
    get:            `${API_BASE_URL}/api/profile`,
    character:      `${API_BASE_URL}/api/profile/character`,
    dailyActivity:  `${API_BASE_URL}/api/profile/daily-activity`,
    gameScore:      `${API_BASE_URL}/api/profile/game-score`,
    gameScores:     `${API_BASE_URL}/api/profile/game-scores`,
    parentEmail:    `${API_BASE_URL}/api/add-parent-email`,
  },
  admin: {
    overview: `${API_BASE_URL}/api/admin/overview`,
    users:    `${API_BASE_URL}/api/admin/users`,
    user:     (id) => `${API_BASE_URL}/api/admin/users/${id}`,
    progress: `${API_BASE_URL}/api/admin/progress`,
    avatars:  `${API_BASE_URL}/api/admin/avatars`,
    stats:    `${API_BASE_URL}/api/admin/stats`,
  },
};

export default {
  SITE_ORIGIN,
  API_BASE_URL,
  PUZZLE_BASE_URL,
  ENDPOINTS,
};
