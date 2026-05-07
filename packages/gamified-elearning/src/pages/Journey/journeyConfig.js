// puzzleId scheme: lessonId * 100 + slot (1=A, 2=B, 3=Boss)
// e.g. L1-A=101, L1-B=102, L1-Boss=103, L2-A=201 ...
export const getPuzzleId = (lessonId, slot) => {
  const slotNum = slot === 'a' ? 1 : slot === 'b' ? 2 : 3;
  return lessonId * 100 + slotNum;
};

const LESSON_TITLES = {
  1:  'Hello Python',
  2:  'Variables',
  3:  'Loops & Functions',
  4:  'Conditionals',
  5:  'Lists & Strings',
  6:  'Dictionaries & Sets',
  7:  'File Handling',
  8:  'Exception Handling',
  9:  'Object-Oriented Programming',
  10: 'Modules & Libraries',
};

const WORLD_GRADIENTS = [
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(135deg, #ffd89b 0%, #19b5fe 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
];

// CORRECT ordering per journey flow: lesson → quiz → puzzleA → puzzleB → boss
// NOTE: This file is not currently imported by any component.
// The live journey uses world1.js (JourneyMap) and journeyNext.js + NEXT_STEP (JourneyPuzzle).
export const JOURNEY_WORLDS = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  return {
    lessonId: n,
    title: LESSON_TITLES[n],
    gradient: WORLD_GRADIENTS[i],
    nodes: [
      { id: `l${n}`,    type: 'lesson', label: `Lesson ${n}`,      route: `/lesson/${n}` },
      { id: `q${n}`,    type: 'quiz',   label: `Quiz ${n}`,        route: `/quiz/${n}` },
      { id: `${n}a`,    type: 'puzzle', label: `Puzzle ${n}-A`,    route: `/journey/puzzle/${n}/a`, puzzleId: n * 100 + 1 },
      { id: `${n}b`,    type: 'puzzle', label: `Puzzle ${n}-B`,    route: `/journey/puzzle/${n}/b`, puzzleId: n * 100 + 2 },
      { id: `boss${n}`, type: 'boss',   label: `Boss ${n}`,        route: `/journey/puzzle/${n}/boss`, puzzleId: n * 100 + 3 },
    ],
  };
});

// Compute node state given progress arrays
// Correct flow: lesson → quiz → puzzleA → puzzleB → boss
export function getNodeState(node, lessonId, completedLessons, completedQuizzes, completedPuzzles) {
  const n = lessonId;
  switch (node.type) {
    case 'lesson':
      if (completedLessons.includes(n)) return 'completed';
      if (n === 1 || completedPuzzles.includes((n - 1) * 100 + 3)) return 'available';
      return 'locked';
    case 'quiz':
      if (completedQuizzes.includes(n)) return 'completed';
      if (completedLessons.includes(n)) return 'available';
      return 'locked';
    case 'puzzle': {
      const isB = node.id === `${n}b`;
      if (!isB) {
        if (completedPuzzles.includes(n * 100 + 1)) return 'completed';
        if (completedQuizzes.includes(n)) return 'available';
      } else {
        if (completedPuzzles.includes(n * 100 + 2)) return 'completed';
        if (completedPuzzles.includes(n * 100 + 1)) return 'available';
      }
      return 'locked';
    }
    case 'boss':
      if (completedPuzzles.includes(n * 100 + 3)) return 'completed';
      if (completedPuzzles.includes(n * 100 + 2)) return 'available';
      return 'locked';
    default:
      return 'locked';
  }
}
