// ── Games a child recognises as games ────────────────────────────────────────
//
// The old starters were web pages with buttons: fifteen onclick handlers, no
// canvas, no animation loop, and the word "score" twice. A ten-year-old who
// asks for a game and gets a page with three buttons on it does not come back,
// and no amount of work on the rest of the studio fixes that.
//
// So these are real games. Every one of them has something that moves on its
// own, a score that goes up, a way to lose, and controls that work with a thumb
// on a phone and with arrow keys on a school laptop. They start instantly —
// nothing here waits for a model to write it — which is the difference between
// "I made a game" and "I waited twenty seconds and got a web page".
//
// ── Written to be read, not just run ─────────────────────────────────────────
//
// Every game opens with a block of plain settings:
//
//     let fallSpeed = 3;
//     let starColour = '#FFD84D';
//     let livesLeft  = 3;
//
// That is not decoration. It is the first code a child will ever change, and
// changing a number and watching the game get harder is the moment the whole
// idea lands. It also feeds the rest of the studio: changeIdeas.js reads those
// declarations to suggest real changes, and proveIt.js builds its questions
// from them — "what does fallSpeed start as?" is only a fair question when the
// project really has a variable called fallSpeed.
//
// So: short names, obvious names, values at the top, no cleverness. A minified
// game would run just as well and teach nothing.

// ── One file per game ────────────────────────────────────────────────────────
//
// The games used to be written out in this file, all eleven of them, which made
// it a 76 KB script that every page asked for. On 13 November 2026 a school's
// web filter was refusing large scripts, so each game now lives in its own
// file under starterGames/ and this file only lists them.
import { CATCH_STARS } from './starterGames/catchStars';
import { PENALTY } from './starterGames/penalty';
import { DODGE } from './starterGames/dodge';
import { POP_BALLOONS } from './starterGames/popBalloons';
import { SNAKE } from './starterGames/snake';
import { BRICKS } from './starterGames/bricks';
import { JUMPER } from './starterGames/jumper';
import { MAZE } from './starterGames/maze';
import { WHACK } from './starterGames/whack';
import { MEMORY } from './starterGames/memory';
import { CAT_CHASE } from './starterGames/catChase';

const STARTER_GAMES = [
  {
    id: 'catch-stars',
    label: 'Catch the falling stars',
    icon: 'star',
    blurb: 'Catch stars in your basket!',
    prompt: 'a game where you catch falling stars in a basket',
    code: CATCH_STARS,
  },
  {
    id: 'penalty',
    label: 'Penalty shootout',
    icon: 'ball',
    blurb: 'Five shots. Score them all!',
    prompt: 'a football penalty shootout game with a moving goalkeeper',
    code: PENALTY,
  },
  {
    id: 'dodge',
    label: 'Dodge the asteroids',
    icon: 'rocket',
    blurb: 'Dodge the rocks. Fly far!',
    prompt: 'a space game where you fly a rocket and dodge asteroids',
    code: DODGE,
  },
  {
    id: 'pop-balloons',
    label: 'Pop the balloons',
    icon: 'balloon',
    blurb: 'Pop them before they fly away!',
    prompt: 'a game where balloons float up the screen and you tap them to pop them before a timer runs out',
    code: POP_BALLOONS,
  },
  {
    id: 'snake',
    label: 'Snake',
    icon: 'snake',
    blurb: 'Eat apples. Grow long. Do not crash!',
    prompt: 'a snake game where you eat apples, grow longer, and lose if you hit the wall or your own tail',
    code: SNAKE,
  },
  {
    id: 'bricks',
    label: 'Brick breaker',
    icon: 'bricks',
    blurb: 'Bounce the ball. Smash every brick!',
    prompt: 'a brick breaker game with a paddle, a bouncing ball, and rows of bricks to smash',
    code: BRICKS,
  },
  {
    id: 'jumper',
    label: 'Jump the gap',
    icon: 'runner',
    blurb: 'Tap to jump. How far can you go?',
    prompt: 'a one-button endless runner where you tap to jump over gaps in the ground',
    code: JUMPER,
  },
  {
    id: 'maze',
    label: 'Build a maze',
    icon: 'puzzle',
    blurb: 'Drag the walls. Make your own maze!',
    prompt: 'a maze game where the walls, coins and door are page elements you can drag to build your own level',
    code: MAZE,
  },
  {
    id: 'whack',
    label: 'Whack a mole',
    icon: 'mallet',
    blurb: 'Move the holes. Whack them all!',
    prompt: 'a whack-a-mole game with a grid of holes, a thirty second timer and a score',
    code: WHACK,
  },
  {
    id: 'memory',
    label: 'Colour memory',
    icon: 'palette',
    blurb: 'Watch the pattern. Copy it back!',
    prompt: 'a colour memory game where the game flashes a pattern that grows by one each round and you repeat it',
    code: MEMORY,
  },
  {
    id: 'cat-chase',
    label: 'Cat and mouse chase',
    icon: 'cat',
    blurb: 'From Scratch? See what is under the blocks!',
    prompt: 'a cat and mouse chase game where the cat follows your finger and catches the mouse',
    code: CAT_CHASE,
  },
];

// ── How many a child is shown, and where ─────────────────────────────────────
//
// Two different problems that used to share one answer.
//
// The front page has to be chosen from in about two seconds by someone who has
// not decided to try this yet. Seven cards there is a menu, and a menu is a
// decision, and a decision is where people leave. Three is a glance.
//
// The studio is the opposite. A child is already in, already had a go, and the
// question is whether there is another one. Running out is what ends the visit,
// so everything is offered there.
//
// So: HOME_PICKS is deliberately short. STARTER_GAMES is deliberately not.
const HOME_PICKS = STARTER_GAMES.slice(0, 3);

const STARTER_IDS = STARTER_GAMES.map(game => game.id);

function starterGameById(id) {
  return STARTER_GAMES.find(game => game.id === id) || null;
}

export {
  HOME_PICKS,
  STARTER_GAMES,
  STARTER_IDS,
  starterGameById,
};
