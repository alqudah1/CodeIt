import { PUZZLE_BASE_URL } from '../../config/api';

const baseUrl = () => PUZZLE_BASE_URL || window.location.origin;

export const games = [
  // ── Puzzles 1–5: live games ────────────────────────────────────────────────
  {
    id: '1',
    slug: 'talking-robot',
    title: 'Talking Robot Adventure',
    summary: 'Meet the friendly talking robot and learn basic coding concepts through a fun conversation.',
    difficulty: 'Beginner',
    focus: ['introduction', 'basics'],
    xpReward: 100,
    path: '/puzzle',
    accent: '#5b8def',
    gradient: 'linear-gradient(135deg, #5b8def, #9dd9ff)',
    heroEmoji: '🤖',
    comingSoon: false,
  },
  {
    id: '2',
    slug: 'apple-game',
    title: 'Apple Game Challenge',
    summary: 'Collect apples and learn about game mechanics while having fun.',
    difficulty: 'Beginner',
    focus: ['game logic', 'interaction'],
    xpReward: 120,
    path: '/apple-game',
    accent: '#ff9f5a',
    gradient: 'linear-gradient(135deg, #ff9f5a, #ffd66b)',
    heroEmoji: '🍎',
    comingSoon: false,
  },
  {
    id: '3',
    slug: 'math-game',
    title: 'Math Game Quest',
    summary: 'Solve mathematical puzzles and challenges to level up your skills.',
    difficulty: 'Intermediate',
    focus: ['arithmetic', 'logic'],
    xpReward: 150,
    path: '/math-game',
    accent: '#6cd4b9',
    gradient: 'linear-gradient(135deg, #6cd4b9, #a4f2d3)',
    heroEmoji: '🧮',
    comingSoon: false,
  },
  {
    id: '4',
    slug: 'condition-game',
    title: 'Condition Game Master',
    summary: 'Master conditional statements and decision-making logic through challenges.',
    difficulty: 'Intermediate',
    focus: ['conditionals', 'if-else'],
    xpReward: 180,
    path: '/condition-game',
    accent: '#b983ff',
    gradient: 'linear-gradient(135deg, #b983ff, #ebadff)',
    heroEmoji: '🎯',
    comingSoon: false,
  },
  {
    id: '5',
    slug: 'loop-game',
    title: 'Loop Game Challenge',
    summary: 'Learn loops and iteration with engaging coding challenges.',
    difficulty: 'Advanced',
    focus: ['loops', 'iteration'],
    xpReward: 220,
    path: '/loop-game',
    accent: '#ff7a8a',
    gradient: 'linear-gradient(135deg, #ff7a8a, #ffb4c0)',
    heroEmoji: '🔁',
    comingSoon: false,
  },

  // ── Puzzles 6–10: coming soon ──────────────────────────────────────────────
  {
    id: '6',
    slug: 'variable-vault',
    title: 'Variable Vault',
    summary: 'Explore the vault of variables and learn how data gets stored and retrieved in Python.',
    difficulty: 'Beginner',
    focus: ['variables', 'data types'],
    xpReward: 100,
    path: null,
    accent: '#f9a825',
    gradient: 'linear-gradient(135deg, #f9a825, #ffd54f)',
    heroEmoji: '📦',
    comingSoon: true,
  },
  {
    id: '7',
    slug: 'function-factory',
    title: 'Function Factory',
    summary: 'Build and run your own Python functions on an exciting factory assembly line!',
    difficulty: 'Intermediate',
    focus: ['functions', 'return values'],
    xpReward: 150,
    path: null,
    accent: '#546e7a',
    gradient: 'linear-gradient(135deg, #546e7a, #90a4ae)',
    heroEmoji: '⚙️',
    comingSoon: true,
  },
  {
    id: '8',
    slug: 'string-sorcerer',
    title: 'String Sorcerer',
    summary: 'Cast spells with Python strings — slice, join, and transform text like a true wizard!',
    difficulty: 'Beginner',
    focus: ['strings', 'text methods'],
    xpReward: 110,
    path: null,
    accent: '#ab47bc',
    gradient: 'linear-gradient(135deg, #ab47bc, #ce93d8)',
    heroEmoji: '✨',
    comingSoon: true,
  },
  {
    id: '9',
    slug: 'dictionary-detective',
    title: 'Dictionary Detective',
    summary: 'Crack the case using Python dictionaries — find clues hidden in key-value pairs!',
    difficulty: 'Intermediate',
    focus: ['dictionaries', 'keys', 'values'],
    xpReward: 160,
    path: null,
    accent: '#00897b',
    gradient: 'linear-gradient(135deg, #00897b, #80cbc4)',
    heroEmoji: '🔍',
    comingSoon: true,
  },
  {
    id: '10',
    slug: 'module-mission',
    title: 'Module Mission',
    summary: 'Launch into orbit by importing Python modules and using their superpowers!',
    difficulty: 'Advanced',
    focus: ['modules', 'imports', 'libraries'],
    xpReward: 200,
    path: null,
    accent: '#1565c0',
    gradient: 'linear-gradient(135deg, #1565c0, #64b5f6)',
    heroEmoji: '🚀',
    comingSoon: true,
  },
];

export const getGameById = (id) => games.find((game) => game.id === String(id));

/**
 * Returns an ABSOLUTE URL so the browser does a full reload and Apache can proxy it.
 * Returns null for coming-soon games that have no path yet.
 */
export const getGameLaunchUrl = (game, includeAuth = false) => {
  if (!game || !game.path) return null;

  const url = `${baseUrl()}${game.path}`;

  if (!includeAuth) return url;

  const token   = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) return url;

  const params = new URLSearchParams();
  params.append('token', token);
  params.append('user', userStr);

  return `${url}?${params.toString()}`;
};
