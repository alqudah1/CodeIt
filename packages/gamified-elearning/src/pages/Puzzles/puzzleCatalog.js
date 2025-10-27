import { PUZZLE_BASE_URL } from '../../config/api';

const baseUrl = () => PUZZLE_BASE_URL;

export const puzzles = [
  {
    id: '1',
    slug: 'robot-maze',
    title: 'Robot Maze Escape',
    summary: 'Guide the friendly robot through a maze using logic, loops, and conditionals.',
    difficulty: 'Beginner',
    focus: ['loops', 'logic'],
    xpReward: 120,
    path: '/puzzle',
    accent: '#5b8def',
    gradient: 'linear-gradient(135deg, #5b8def, #9dd9ff)',
    heroEmoji: '🤖',
  },
  {
    id: '2',
    slug: 'apple-harvest',
    title: 'Apple Orchard Logic',
    summary: 'Use branching to collect the right apples while avoiding pesky bugs.',
    difficulty: 'Beginner',
    focus: ['conditionals'],
    xpReward: 140,
    path: '/apple-game',
    accent: '#ff9f5a',
    gradient: 'linear-gradient(135deg, #ff9f5a, #ffd66b)',
    heroEmoji: '🍎',
  },
  {
    id: '3',
    slug: 'math-matcher',
    title: 'Math Matcher Challenge',
    summary: 'Pair equations and answers to reveal the hidden pattern.',
    difficulty: 'Intermediate',
    focus: ['arithmetic', 'memory'],
    xpReward: 150,
    path: '/math-game',
    accent: '#6cd4b9',
    gradient: 'linear-gradient(135deg, #6cd4b9, #a4f2d3)',
    heroEmoji: '🧠',
  },
  {
    id: '4',
    slug: 'conditional-quest',
    title: 'Conditional Quest',
    summary: 'Decode riddles by crafting perfect if/else statements.',
    difficulty: 'Intermediate',
    focus: ['conditionals', 'debugging'],
    xpReward: 180,
    path: '/condition-game',
    accent: '#b983ff',
    gradient: 'linear-gradient(135deg, #b983ff, #ebadff)',
    heroEmoji: '🪄',
  },
  {
    id: '5',
    slug: 'loop-lab',
    title: 'Loop Lab Builder',
    summary: 'Assemble the right set of loops to power the laboratory machines.',
    difficulty: 'Advanced',
    focus: ['loops', 'optimization'],
    xpReward: 220,
    path: '/loop-game',
    accent: '#ff7a8a',
    gradient: 'linear-gradient(135deg, #ff7a8a, #ffb4c0)',
    heroEmoji: '🧪',
  },
];

export const getPuzzleById = (id) => puzzles.find((puzzle) => puzzle.id === id);

export const getPuzzleLaunchUrl = (puzzle) =>
  puzzle ? `${baseUrl()}${puzzle.path}` : baseUrl();
