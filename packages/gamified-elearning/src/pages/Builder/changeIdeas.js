// ── "Change one thing" — but which thing? ────────────────────────────────────
//
// A real child, Karam, built a football game in the studio, reached the step
// that says "Change one thing — pick new colors or add a fun idea", and asked:
//
//     "What does it mean by the change it"
//
// He is right to ask. "Add a fun idea" is not an instruction, it is a mood. And
// this is the step that gates saving: a project is not finished until you have
// changed something, so a child who does not understand the sentence never
// saves. Of 283 learners, 19 have ever saved a project. This is why.
//
// The fix is the same idea as the questions in proveIt.js — read the child's
// actual code and talk about their actual thing. Not "pick new colors" but
// "make the goalie slower", "start the score at 10 instead of 0", "change the
// title from Goal Rush to your own words". Every suggestion names something
// that really exists in their project, and comes with the exact words to say
// so they never have to invent a prompt.
//
// Same two rules as proveIt: suggest nothing the code does not support, and no
// randomness, so the ideas do not reshuffle under a child mid-read.

import { readProject } from './proveIt';

/** Words a child would recognise for a variable, when we can guess. */
const FRIENDLY = [
  { match: /score|point/i, noun: 'score' },
  { match: /^lives?$|life/i, noun: 'lives' },
  { match: /speed|velocity/i, noun: 'speed' },
  { match: /time|timer|seconds|countdown/i, noun: 'timer' },
  { match: /level|stage|round/i, noun: 'level' },
  // Size before coins: `starSize` is a size, and "start the coins at 36"
  // named a number that is not coins.
  { match: /size|width|height|radius/i, noun: 'size' },
  { match: /coin|gem|star|gold/i, noun: 'coins' },
];

function friendlyName(variable) {
  const known = FRIENDLY.find(entry => entry.match.test(variable));
  return known ? known.noun : variable;
}

/** A number a child would find interesting next to the one they have. */
function suggestNumber(current) {
  const value = Number(current);
  if (!Number.isFinite(value)) return null;
  if (value === 0) return 10;
  if (value === 1) return 3;
  const doubled = Math.round(value * 2);
  return doubled === value ? value + 5 : doubled;
}

// ── The suggestions ──────────────────────────────────────────────────────────
//
// Each returns an idea, or null when the project has nothing of that kind. An
// idea is { id, label, why, prompt } — label is what the button says, why is the
// one line under it, prompt is what gets sent if they tap it.

function numberIdeas(facts) {
  return facts.variables
    .filter(v => /^-?\d+$/.test(v.value))
    .slice(0, 2)
    .map(variable => {
      const next = suggestNumber(variable.value);
      if (next === null || String(next) === variable.value) return null;
      const noun = friendlyName(variable.name);
      return {
        id: `number-${variable.name}`,
        label: `Start the ${noun} at ${next} instead of ${variable.value}`,
        why: `Your project sets ${variable.name} to ${variable.value} when it begins.`,
        prompt: `Change ${variable.name} so it starts at ${next} instead of ${variable.value}.`,
      };
    })
    .filter(Boolean);
}

function colourIdea(facts) {
  const colour = facts.backgrounds[0];
  if (!colour) return null;
  return {
    id: 'colour',
    label: 'Give it a different colour',
    why: `Right now the background is ${colour}. Pick any colour you like better.`,
    prompt: 'Change the background colour to a bright colour I would like.',
  };
}

function titleIdea(facts) {
  const heading = facts.headings.find(text => text.length > 1 && text.length < 60);
  if (!heading) return null;
  return {
    id: 'title',
    label: `Rename it. It says "${heading}" right now`,
    why: 'Give your project a name that is yours.',
    prompt: `Change the main title from "${heading}" to something of my own.`,
  };
}

function speedIdea(facts) {
  // A timer or an interval is the thing that makes a game feel fast or slow,
  // and "make it harder" is the change children reach for first.
  const timing = facts.variables.find(v => /speed|delay|interval|time/i.test(v.name) && /^-?\d+$/.test(v.value));
  if (!timing) return null;
  return {
    id: 'speed',
    label: 'Make it faster or slower',
    why: `Your project uses ${timing.name} to decide the timing.`,
    prompt: `Make the game noticeably harder by changing ${timing.name}.`,
  };
}

function clickIdea(facts) {
  if (!facts.clickHandlers) return null;
  return {
    id: 'click',
    label: 'Make something happen when you click',
    why: 'Your project already reacts to clicks. Give it one more thing to do.',
    prompt: 'When I click, also play a little animation or show a message.',
  };
}

function buttonIdea(facts) {
  if (!facts.buttons) return null;
  return {
    id: 'button',
    label: 'Change what a button says',
    why: `Your project has ${facts.buttons === 1 ? 'a button' : `${facts.buttons} buttons`}.`,
    prompt: 'Change the wording on the buttons to something more fun.',
  };
}

// Last resort. Deliberately still concrete — the failure mode being fixed is
// vagueness, so even the fallback names a thing to do rather than a mood.
const ALWAYS_POSSIBLE = [
  {
    id: 'fallback-colour',
    label: 'Give it a different colour',
    why: 'The quickest change there is, and you see it straight away.',
    prompt: 'Change the colours to a bright colour scheme I would like.',
  },
  {
    id: 'fallback-sound',
    label: 'Add a sound when something happens',
    why: 'Projects feel finished the moment they make a noise.',
    prompt: 'Add a short sound effect when something important happens.',
  },
  {
    id: 'fallback-harder',
    label: 'Make it harder',
    why: 'If it is too easy to win, it stops being fun.',
    prompt: 'Make this noticeably harder to beat.',
  },
];

const GENERATORS = [numberIdeas, speedIdea, titleIdea, colourIdea, clickIdea, buttonIdea];

/**
 * Concrete things this particular child could change, in their own project.
 *
 * Always returns at least a few: unlike a quiz question, a suggestion cannot be
 * wrong, and a child staring at "change one thing" with no examples is exactly
 * the situation this exists to prevent.
 */
function changeIdeasFor(html, { max = 4 } = {}) {
  let facts;
  try {
    facts = readProject(html);
  } catch {
    return ALWAYS_POSSIBLE.slice(0, max);
  }

  const ideas = [];
  for (const generate of GENERATORS) {
    if (ideas.length >= max) break;
    let produced = null;
    try {
      produced = generate(facts);
    } catch {
      produced = null;
    }
    if (!produced) continue;
    (Array.isArray(produced) ? produced : [produced]).forEach(idea => {
      if (ideas.length < max && !ideas.some(existing => existing.id === idea.id)) ideas.push(idea);
    });
  }

  // Top up from the generic list rather than showing one lonely idea.
  for (const idea of ALWAYS_POSSIBLE) {
    if (ideas.length >= Math.min(max, 3)) break;
    if (!ideas.some(existing => existing.label === idea.label)) ideas.push(idea);
  }

  return ideas.slice(0, max);
}

export { changeIdeasFor };
