// ── Everything a child can open without typing anything ──────────────────────
//
// Three kinds, one list.
//
// Games are canvas, and a canvas cannot be edited element by element. Quizzes
// and websites are made of ordinary elements, so every tool in the studio works
// on every part of them. That difference is the reason all three exist: a child
// who only ever sees the games concludes the editor does not do very much.
//
// `kind` is what the picker groups by. Nothing else in the studio branches on
// it — a starter is a starter, it loads the same way, and the code tab reads it
// the same way.

import { STARTER_GAMES } from './starterGames';
import { STARTER_QUIZZES } from './starterQuizzes';
import { STARTER_SITES } from './starterSites';

const GAMES = STARTER_GAMES.map(game => ({ ...game, kind: 'game' }));

const STARTER_PROJECTS = [...GAMES, ...STARTER_QUIZZES, ...STARTER_SITES];

// ── The shelves, in the order a child meets them ─────────────────────────────
//
// Games first because that is what most of them came for. Websites last because
// it is the one that needs a sentence of explanation before it sounds fun.
const SHELVES = [
  {
    kind: 'game',
    title: 'Games',
    line: 'Play it now, then change how it works.',
    items: GAMES,
  },
  {
    kind: 'quiz',
    title: 'Quizzes',
    line: 'Every question and every button is yours to rewrite.',
    items: STARTER_QUIZZES,
  },
  {
    kind: 'site',
    title: 'Websites that sell something',
    line: 'A real shop page. Change the products, the prices, the colours.',
    items: STARTER_SITES,
  },
];

function starterProjectById(id) {
  return STARTER_PROJECTS.find(project => project.id === id) || null;
}

const STARTER_PROJECT_IDS = STARTER_PROJECTS.map(project => project.id);

export {
  SHELVES,
  STARTER_PROJECTS,
  STARTER_PROJECT_IDS,
  starterProjectById,
};
