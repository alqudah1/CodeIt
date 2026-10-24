// ── Twelve lesson plans, one per power ──────────────────────────────────────
//
// A 45 minute class a teacher reads aloud: the sentence to put on the board,
// what to say, when to open the projector, where the power fits, and what to
// look for walking the room. Every plan is built from the power itself, so a
// plan can never describe a lesson the site does not have. Minutes are a
// shape, not a promise; a teacher knows their room.

import { POWERS } from '../Powers/powers';

/** The sentence on the board: a game that shows this power off. */
export const BOARD_SENTENCE = {
  numbers: 'a rocket that dodges comets and goes really fast',
  words: 'a game with a name you made up',
  looks: 'an alien that catches gems in space',
  lives: 'a cat that dodges bombs with one life',
  score: 'a bunny that catches carrots worth 5 points',
  winning: 'a ship that wins at 10 stars',
  ifthen: 'a runner that gets faster the more you score',
  loops: 'a ship that shoots asteroids that come in waves',
  timers: 'a game that speeds up every 5 seconds',
  sound: 'a game that beeps when you catch something',
  levels: 'a dodge game with levels',
  boss: 'a shooter where a boss comes at 10 points',
};

/** What to look for walking the room, in the words a teacher would use. */
export const LOOK_FOR = {
  numbers: 'Children changing the number more than once. The ones who try 10 and laugh have got it.',
  words: 'Quotes. A child who deletes a quote mark sees the game break and fix: that is the lesson.',
  looks: 'Children typing a name the game does not know. Let it fail, then show the list.',
  lives: 'Who sets lives to 1 and plays it. Hard mode is a sign they feel safe.',
  score: 'Ask one child why the score jumps by 5 now. "Because I changed pointsPer" is the answer.',
  winning: 'A child who sets winAt to 1 has found the fastest way to win. Ask what the if is checking.',
  ifthen: "Ask the room when the game is faster. 'Only if twist is faster' is the sentence you want.",
  loops: 'Ask how many bad things one wave brings now, and where the number is written.',
  timers: 'Wait with them. The speed-up is the first thing in the course that happens without a key press.',
  sound: 'Headphones, or the room beeps together. Either is fine; the second is more fun.',
  levels: 'Point at the title. The level number is the score divided by levelEvery, and they can check it.',
  boss: 'Who went back and set bossAt to 3 to see it sooner. That is a child testing their code.',
};

export function planFor(power) {
  const sentence = BOARD_SENTENCE[power.slug];
  return {
    n: power.n,
    slug: power.slug,
    title: `${power.name}. ${power.does.charAt(0).toUpperCase()}${power.does.slice(1)}.`,
    sentence,
    say: power.intro,
    lookFor: LOOK_FOR[power.slug],
    steps: [
      { min: 0, head: 'The code on the board', text: `Put the class code on the projector (Teach, then Projector). Children open codeitlearn.com/join, type the code and a first name. Five minutes, no accounts.` },
      { min: 5, head: 'Say a game', text: `Write on the board: "${sentence}". Everyone types it, or their own version of it, on Build and presses Build it. Walk the room. By minute ten every child has a game playing.` },
      { min: 12, head: 'The projector fills', text: 'Open the projector. Tiles appear as games are published. Press one; it plays on the big screen. Two minutes of this is the reward for the room and the reason the next part works.' },
      { min: 15, head: `The power: ${power.name}`, text: `Everyone opens Powers and presses ${power.name}. Read the first line aloud: "${power.intro}" Step one changes one line and runs it; step two changes it again; the check is them writing it with the highlight gone. Three minutes for most, ten for some.` },
      { min: 30, head: 'Build with it', text: `Back to Build, with the power switched on in their game. Ask for a new sentence that uses it: ${sentence}. Publish. The projector shows the new ones.` },
      { min: 40, head: 'Show two', text: 'Press two tiles on the projector. Ask each child what they changed. The sentence they say back is the assessment.' },
    ],
  };
}

export const PLANS = POWERS.map(planFor);

// The words on the teacher landing and the plans index. The pages render
// them and the static generator writes the crawlable copy from them, so a
// search engine and a teacher read the same sentences.
export const TEACH_LANDING = {
  eyebrow: 'Teach with CodeIt',
  h1: 'Make a class. Read out the code. Watch the games appear.',
  intro: 'Sign in with your own account to make a class. Children join with the code and a first name, nothing else: no email, no password, no age screen.',
};

export const TEACH_STEPS = [
  ['1', 'Make a class', 'Name it, and the code appears in letters the back row can read.'],
  ['2', 'Children type the code', 'At codeitlearn.com/join, with a first name. They are building within the minute.'],
  ['3', 'The projector fills', 'Each published game becomes a tile. Press one and it plays on the big screen.'],
  ['4', 'Then a power', 'Twelve powers, one per lesson, each changing a line in the game they just made.'],
];

export const PLANS_INDEX = {
  eyebrow: 'Teach',
  h1: 'Twelve classes, one per power.',
  intro: 'Each is 45 minutes you read aloud: the sentence for the board, when to open the projector, the power, and what to look for walking the room.',
};

/**
 * One plan's title and description, for the page and for the crawlable copy
 * the static generator writes, so the two can never say different things.
 */
export function planMeta(plan) {
  return {
    title: `${plan.title.split('.')[0]}: a 45 Minute Coding Lesson Plan for Kids | CodeIt`,
    description: `Free coding lesson plan ${plan.n} of ${POWERS.length}. On the board: "${plan.sentence}". Six timed steps to read aloud, and what to look for walking the room.`,
  };
}
