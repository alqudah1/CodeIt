// ── The cards on /games name the puzzles they open ──────────────────────────
//
// Every title and summary here has to match the puzzle its journeyRoute
// opens, in src/pages/Journey/puzzleConfigs.js. They did not: card 1 was
// "Talking Robot Adventure", "make the robot speak", and the puzzle behind
// it is Hello World!, which has no robot in it. Those five titles were the
// last live trace of the retired puzzle system, and the whole of
// /python-games-for-kids had been written from them.
//
// puzzle-names.test.js checks the pairing.
export const games = [
  // ── Challenges 1–5: live (route to Journey puzzle system) ──────────────────
  {
    id: '1',
    slug: 'talking-robot',
    title: 'Hello World!',
    summary: 'One print line is done. Add two more and say anything you like.',
    difficulty: 'Beginner',
    focus: ['print', 'strings', 'basics'],
    xpReward: 100,
    journeyRoute: '/journey/puzzle/1/a',
    accent: '#5b8def',
    gradient: 'linear-gradient(135deg, #5b8def, #9dd9ff)',
    comingSoon: false,
  },
  {
    id: '2',
    slug: 'apple-game',
    title: 'Variable Vault',
    summary: 'Three variables hold the access codes. Print each one to unlock the vault.',
    difficulty: 'Beginner',
    focus: ['variables', 'assignment', 'numbers'],
    xpReward: 120,
    journeyRoute: '/journey/puzzle/2/a',
    accent: '#ff9f5a',
    gradient: 'linear-gradient(135deg, #ff9f5a, #ffd66b)',
    comingSoon: false,
  },
  {
    id: '3',
    slug: 'loop-game',
    title: 'String Joiner',
    summary: 'Join a first name and a last name into one full name, using +.',
    difficulty: 'Beginner',
    focus: ['strings', 'concatenation', 'methods'],
    xpReward: 130,
    journeyRoute: '/journey/puzzle/3/a',
    accent: '#ff7a8a',
    gradient: 'linear-gradient(135deg, #ff7a8a, #ffb4c0)',
    comingSoon: false,
  },
  {
    id: '4',
    slug: 'condition-game',
    title: 'Weather Check',
    summary: 'Run it and watch Python pick Hot, Warm or Cold from the temperature.',
    difficulty: 'Intermediate',
    focus: ['conditionals', 'if', 'comparison'],
    xpReward: 180,
    journeyRoute: '/journey/puzzle/4/a',
    accent: '#b983ff',
    gradient: 'linear-gradient(135deg, #b983ff, #ebadff)',
    comingSoon: false,
  },
  {
    id: '5',
    slug: 'loop-challenge',
    title: 'Repeat It',
    summary: 'The loop is ready and the print line is missing. Add print(i) inside it.',
    difficulty: 'Intermediate',
    focus: ['loops', 'for', 'range'],
    xpReward: 160,
    journeyRoute: '/journey/puzzle/5/a',
    accent: '#6cd4b9',
    gradient: 'linear-gradient(135deg, #6cd4b9, #a4f2d3)',
    comingSoon: false,
  },

  // ── Puzzles 6–10: coming soon (aligned with lessons 6–10) ─────────────────
  {
    id: '6',
    slug: 'dictionary-detective',
    title: 'Dictionary Detective',
    summary: 'Look up clues hidden in Python dictionaries. Master key-value pair access.',
    difficulty: 'Intermediate',
    focus: ['dictionaries', 'keys', 'values'],
    xpReward: 160,
    path: null,
    accent: '#00897b',
    gradient: 'linear-gradient(135deg, #00897b, #80cbc4)',
    comingSoon: true,
  },
  {
    id: '7',
    slug: 'file-handling-challenge',
    title: 'File Handling Challenge',
    summary: 'Read and write Python files to save game state. Put open() and with statements to work.',
    difficulty: 'Intermediate',
    focus: ['files', 'open', 'read', 'write'],
    xpReward: 170,
    path: null,
    accent: '#546e7a',
    gradient: 'linear-gradient(135deg, #546e7a, #90a4ae)',
    comingSoon: true,
  },
  {
    id: '8',
    slug: 'exception-handler',
    title: 'Exception Handler',
    summary: 'Wrap risky code in try/except to keep the program running when errors occur.',
    difficulty: 'Intermediate',
    focus: ['try', 'except', 'errors'],
    xpReward: 180,
    path: null,
    accent: '#ab47bc',
    gradient: 'linear-gradient(135deg, #ab47bc, #ce93d8)',
    comingSoon: true,
  },
  {
    id: '9',
    slug: 'oop-builder',
    title: 'OOP Builder',
    summary: 'Design a class blueprint, create objects, and call methods to build your own world.',
    difficulty: 'Advanced',
    focus: ['classes', 'objects', 'methods'],
    xpReward: 200,
    path: null,
    accent: '#f9a825',
    gradient: 'linear-gradient(135deg, #f9a825, #ffd54f)',
    comingSoon: true,
  },
  {
    id: '10',
    slug: 'module-mission',
    title: 'Module Mission',
    summary: 'Import Python modules and use their superpowers to complete the mission.',
    difficulty: 'Advanced',
    focus: ['modules', 'imports', 'libraries'],
    xpReward: 200,
    path: null,
    accent: '#1565c0',
    gradient: 'linear-gradient(135deg, #1565c0, #64b5f6)',
    comingSoon: true,
  },
];

export const getGameById = (id) => games.find((game) => game.id === String(id));

/**
 * Returns the internal React Router route for a live challenge, or null if coming soon.
 * All challenges route through the Journey puzzle system (/journey/puzzle/:id/a).
 */
export const getGameRoute = (game) => {
  if (!game || game.comingSoon) return null;
  return game.journeyRoute || null;
};
