/**
 * journeyNext.js
 * Returns the URL of the next step for a given node ID,
 * including ?from=journey&node=<nextNodeId> params.
 * Returns '/journey' when at the end or nodeId not found.
 *
 * Full journey: Lessons 1-10, each with mini quiz + puzzles A/B/Boss.
 * Big Quiz 1 (id=11) after L3, Big Quiz 2 (id=12) after L6, Big Quiz 3 (id=13) after L9.
 */

const EXPLICIT_NEXT = {
  // ── Lesson 1 ──────────────────────────────────────────────────────────────
  'start':    '/lesson/1?from=journey&node=lesson1',
  'lesson1':  '/quiz/1?from=journey&node=quiz1',
  'quiz1':    '/journey/puzzle/1/a?from=journey&node=puzzle1a',
  'puzzle1a': '/journey/puzzle/1/b?from=journey&node=puzzle1b',
  'puzzle1b': '/journey/puzzle/1/boss?from=journey&node=boss1',
  'boss1':    '/lesson/2?from=journey&node=lesson2',
  // ── Lesson 2 ──────────────────────────────────────────────────────────────
  'lesson2':  '/quiz/2?from=journey&node=quiz2',
  'quiz2':    '/journey/puzzle/2/a?from=journey&node=puzzle2a',
  'puzzle2a': '/journey/puzzle/2/b?from=journey&node=puzzle2b',
  'puzzle2b': '/journey/puzzle/2/boss?from=journey&node=boss2',
  'boss2':    '/lesson/3?from=journey&node=lesson3',
  // ── Lesson 3 → Big Quiz 1 ─────────────────────────────────────────────────
  'lesson3':  '/quiz/3?from=journey&node=quiz3',
  'quiz3':    '/journey/puzzle/3/a?from=journey&node=puzzle3a',
  'puzzle3a': '/journey/puzzle/3/b?from=journey&node=puzzle3b',
  'puzzle3b': '/journey/puzzle/3/boss?from=journey&node=boss3',
  'boss3':    '/quiz/11?from=journey&node=bigquiz1',
  'bigquiz1': '/lesson/4?from=journey&node=lesson4',
  // ── Lesson 4 ──────────────────────────────────────────────────────────────
  'lesson4':  '/quiz/4?from=journey&node=quiz4',
  'quiz4':    '/journey/puzzle/4/a?from=journey&node=puzzle4a',
  'puzzle4a': '/journey/puzzle/4/b?from=journey&node=puzzle4b',
  'puzzle4b': '/journey/puzzle/4/boss?from=journey&node=boss4',
  'boss4':    '/lesson/5?from=journey&node=lesson5',
  // ── Lesson 5 ──────────────────────────────────────────────────────────────
  'lesson5':  '/quiz/5?from=journey&node=quiz5',
  'quiz5':    '/journey/puzzle/5/a?from=journey&node=puzzle5a',
  'puzzle5a': '/journey/puzzle/5/b?from=journey&node=puzzle5b',
  'puzzle5b': '/journey/puzzle/5/boss?from=journey&node=boss5',
  'boss5':    '/lesson/6?from=journey&node=lesson6',
  // ── Lesson 6 → Big Quiz 2 ─────────────────────────────────────────────────
  'lesson6':  '/quiz/6?from=journey&node=quiz6',
  'quiz6':    '/journey/puzzle/6/a?from=journey&node=puzzle6a',
  'puzzle6a': '/journey/puzzle/6/b?from=journey&node=puzzle6b',
  'puzzle6b': '/journey/puzzle/6/boss?from=journey&node=boss6',
  'boss6':    '/quiz/12?from=journey&node=bigquiz2',
  'bigquiz2': '/lesson/7?from=journey&node=lesson7',
  // ── Lesson 7 ──────────────────────────────────────────────────────────────
  'lesson7':  '/quiz/7?from=journey&node=quiz7',
  'quiz7':    '/journey/puzzle/7/a?from=journey&node=puzzle7a',
  'puzzle7a': '/journey/puzzle/7/b?from=journey&node=puzzle7b',
  'puzzle7b': '/journey/puzzle/7/boss?from=journey&node=boss7',
  'boss7':    '/lesson/8?from=journey&node=lesson8',
  // ── Lesson 8 ──────────────────────────────────────────────────────────────
  'lesson8':  '/quiz/8?from=journey&node=quiz8',
  'quiz8':    '/journey/puzzle/8/a?from=journey&node=puzzle8a',
  'puzzle8a': '/journey/puzzle/8/b?from=journey&node=puzzle8b',
  'puzzle8b': '/journey/puzzle/8/boss?from=journey&node=boss8',
  'boss8':    '/lesson/9?from=journey&node=lesson9',
  // ── Lesson 9 → Big Quiz 3 ─────────────────────────────────────────────────
  'lesson9':  '/quiz/9?from=journey&node=quiz9',
  'quiz9':    '/journey/puzzle/9/a?from=journey&node=puzzle9a',
  'puzzle9a': '/journey/puzzle/9/b?from=journey&node=puzzle9b',
  'puzzle9b': '/journey/puzzle/9/boss?from=journey&node=boss9',
  'boss9':    '/quiz/13?from=journey&node=bigquiz3',
  'bigquiz3': '/lesson/10?from=journey&node=lesson10',
  // ── Lesson 10 (final) ─────────────────────────────────────────────────────
  'lesson10': '/quiz/10?from=journey&node=quiz10',
  'quiz10':   '/journey/puzzle/10/a?from=journey&node=puzzle10a',
  'puzzle10a':'/journey/puzzle/10/b?from=journey&node=puzzle10b',
  'puzzle10b':'/journey/puzzle/10/boss?from=journey&node=boss10',
  'boss10':   '/journey?complete=1',
};

export function getJourneyNext(nodeId) {
  if (EXPLICIT_NEXT[nodeId] !== undefined) {
    return EXPLICIT_NEXT[nodeId];
  }
  return '/journey';
}
