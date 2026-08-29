// ── Something real to play while the model writes ────────────────────────────
//
// "It takes so much time."
//
// An AI build is ten to twenty seconds. During it the studio showed a progress
// card — a title, the child's own sentence in quotes, four steps with a
// spinner, a progress bar — and underneath that, a small generic demo: click
// the star, or a three-question quiz about oceans.
//
// Two things wrong with that. The progress bar is above the playable thing, so
// the first thing a waiting child sees is a bar telling them to wait. And the
// demo is from a set of five generic templates, while twenty finished projects
// sit in this same folder, opened in a real browser at two sizes on every build.
//
// A child who types "a space game where you dodge rocks" should be flying the
// asteroid game within a second. Not a generic click-the-star, and not a bar.
//
// This picks the closest real starter to what they typed.

import { STARTER_PROJECTS } from './starterProjects';

// Words that appear in nearly every request and so separate nothing.
const NOISE = new Set([
  'a', 'an', 'the', 'and', 'or', 'with', 'that', 'this', 'for', 'of', 'to', 'in',
  'on', 'it', 'is', 'my', 'me', 'i', 'you', 'your', 'can', 'make', 'makes', 'made',
  'build', 'builds', 'create', 'creates', 'want', 'wants', 'like', 'where', 'when',
  'some', 'any', 'get', 'gets', 'have', 'has', 'be', 'do', 'does', 'about',
]);

function words(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !NOISE.has(word));
}

/** Everything a starter is describable by, as one bag of words. */
function starterWords(project) {
  return new Set(words(`${project.label} ${project.blurb} ${project.prompt}`));
}

// A word a child uses for a kind of project, mapped to the kind. Typing "shop"
// should not have to literally match the word "shop" in a starter's blurb.
const KIND_WORDS = {
  game: ['game', 'play', 'player', 'score', 'level', 'jump', 'run', 'shoot', 'catch',
         'dodge', 'race', 'maze', 'snake', 'arcade', 'enemy', 'win', 'lose'],
  quiz: ['quiz', 'question', 'questions', 'answer', 'answers', 'test', 'trivia', 'ask'],
  site: ['website', 'site', 'shop', 'store', 'sell', 'selling', 'business', 'page',
         'landing', 'buy', 'price', 'prices', 'product', 'products'],
};

function kindFromPrompt(asked) {
  let best = null;
  for (const [kind, list] of Object.entries(KIND_WORDS)) {
    const hits = list.filter(word => asked.includes(word)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { kind, hits };
  }
  return best ? best.kind : null;
}

/**
 * The starter closest to what a child asked for.
 *
 * Never returns null: something playable is always better than a progress bar,
 * so with no signal at all it falls back to the first game, which is the most
 * legible thing in the set.
 */
function closestStarter(prompt, projects = STARTER_PROJECTS) {
  const asked = words(prompt);
  if (!projects.length) return null;

  const wantedKind = kindFromPrompt(asked);

  let best = null;
  for (const project of projects) {
    const bag = starterWords(project);
    // A word the child used that this starter also uses.
    let score = asked.filter(word => bag.has(word)).length * 3;

    // Right kind of thing matters more than any single word: a child asking for
    // a shop should not be shown a snake game because both mention "score".
    if (wantedKind && project.kind === wantedKind) score += 5;
    if (wantedKind && project.kind !== wantedKind) score -= 4;

    if (!best || score > best.score) best = { project, score };
  }

  // With nothing to go on, the first game. It is the one a stranger understands
  // in a second, which is the whole job of the thing shown during a wait.
  if (!best || best.score <= 0) {
    return projects.find(p => p.kind === 'game') || projects[0];
  }
  return best.project;
}

export { closestStarter, kindFromPrompt, words };
