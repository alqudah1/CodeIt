import { PUZZLE_BASE_URL } from '../../config/api';

const baseUrl = () => PUZZLE_BASE_URL;

export const games = [
  {
    id: '1',
    slug: 'talking-robot',
    title: 'Talking Robot Adventure',
    summary: 'Meet the friendly talking robot and learn basic coding concepts through interactive conversations.',
    difficulty: 'Beginner',
    focus: ['introduction', 'basics'],
    xpReward: 100,
    path: '/puzzle',
    accent: '#5b8def',
    gradient: 'linear-gradient(135deg, #5b8def, #9dd9ff)',
    heroEmoji: '🤖',
  },
  {
    id: '2',
    slug: 'apple-game',
    title: 'Apple Game Challenge',
    summary: 'Collect apples and learn about game mechanics while having fun with interactive gameplay.',
    difficulty: 'Beginner',
    focus: ['game logic', 'interaction'],
    xpReward: 120,
    path: '/apple-game',
    accent: '#ff9f5a',
    gradient: 'linear-gradient(135deg, #ff9f5a, #ffd66b)',
    heroEmoji: '🍎',
  },
  {
    id: '3',
    slug: 'math-game',
    title: 'Math Game Quest',
    summary: 'Solve mathematical puzzles and challenges to level up your coding and problem-solving skills.',
    difficulty: 'Intermediate',
    focus: ['arithmetic', 'logic'],
    xpReward: 150,
    path: '/math-game',
    accent: '#6cd4b9',
    gradient: 'linear-gradient(135deg, #6cd4b9, #a4f2d3)',
    heroEmoji: '🧮',
  },
  {
    id: '4',
    slug: 'condition-game',
    title: 'Condition Game Master',
    summary: 'Master conditional statements and decision-making logic through engaging gameplay scenarios.',
    difficulty: 'Intermediate',
    focus: ['conditionals', 'if-else'],
    xpReward: 180,
    path: '/condition-game',
    accent: '#b983ff',
    gradient: 'linear-gradient(135deg, #b983ff, #ebadff)',
    heroEmoji: '🎯',
  },
  {
    id: '5',
    slug: 'loop-game',
    title: 'Loop Game Challenge',
    summary: 'Learn loops and iteration through exciting challenges that test your pattern recognition skills.',
    difficulty: 'Advanced',
    focus: ['loops', 'iteration'],
    xpReward: 220,
    path: '/loop-game',
    accent: '#ff7a8a',
    gradient: 'linear-gradient(135deg, #ff7a8a, #ffb4c0)',
    heroEmoji: '🔄',
  },
];

export const getGameById = (id) => games.find((game) => game.id === id);

export const getGameLaunchUrl = (game, includeAuth = false) => {
  if (!game) return baseUrl();
  
  const url = `${baseUrl()}${game.path}`;
  
  if (!includeAuth) return url;
  
  // Get auth data from localStorage
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) return url;
  
  // Build URL with auth parameters
  const params = new URLSearchParams();
  params.append('token', token);
  params.append('user', userStr);
  
  return `${url}?${params.toString()}`;
};

