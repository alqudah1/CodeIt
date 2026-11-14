/* eslint-disable no-useless-escape -- fallback project templates intentionally preserve escaped HTML/JS */
// Part 1 of what used to be the top of Builder.js: the studio's constants and small helpers.
// See Builder.js for why the studio is in parts.
import { API_BASE_URL } from '../../config/api';
import { BrowserSticker, CabinetSticker, ControllerSticker, QuestionSticker, QuizSticker, ShopSticker } from '../../components/ArcadeArt/ArcadeArt';
import { namedGame } from '../Build/gameWords';

// One hand-drawn sticker per shelf and per ask-for-anything card, in the
// design language itself. Decorative: the words beside them do the talking.
const SHELF_STICKERS = { game: CabinetSticker, quiz: QuizSticker, site: ShopSticker };

const HERO_STICKERS = { game: ControllerSticker, website: BrowserSticker, quiz: QuestionSticker };

// A starter's shelf, in the words the rest of the studio already uses.
const STARTER_TYPES = { game: 'game', quiz: 'quiz', site: 'website' };

const QUICK_STARTS = [
  // Games
  { label: 'Click the target',    category: 'Game',    prompt: 'a click-the-target game where colorful circles pop up randomly and you have to click them before they vanish. With a 30-second timer, score counter, increasing speed each hit, and a game-over screen' },
  { label: 'Quick quiz',          category: 'Game',    prompt: 'a 3-question general knowledge quiz with multiple choice answers, instant correct or wrong feedback, a score counter, and a results screen at the end' },
  { label: 'Memory match',        category: 'Game',    prompt: 'a memory card matching game with emoji pairs on a 4x4 grid. Cards flip with animation, track number of moves, and show a celebration screen when all pairs are found' },
  { label: 'Reaction tester',     category: 'Game',    prompt: 'a reaction time tester where a glowing circle appears after a random delay and you tap it as fast as possible. 5 rounds, shows your average reaction time at the end' },
  // Websites
  { label: 'My portfolio',        category: 'Website', prompt: 'a personal portfolio website with a hero section, animated skills grid, project cards with hover effects, and a contact form that shows a success message. Colorful and modern' },
  { label: 'Pizza shop',          category: 'Website', prompt: 'a pizza restaurant website with sticky nav, menu grid with add-to-order buttons, a live cart showing items and total, and an order confirmation animation' },
  { label: 'Sports fan page',     category: 'Website', prompt: 'a soccer team fan page with a hero section, tab navigation between roster, schedule, and results, player cards with stats, and animated score counters' },
  { label: 'Pet shop',            category: 'Website', prompt: 'a pet shop with product cards for animals and supplies, add-to-cart buttons, a cart panel showing items and running total, and a cute checkout confirmation overlay' },
  // Tools
  { label: 'Calculator',          category: 'Tool',    prompt: 'a calculator with a number display, full keypad (0-9, +, -, ×, ÷, =, AC), keyboard support, and a smooth result animation. Make it look modern and polished' },
  { label: 'Countdown timer',     category: 'Tool',    prompt: 'a countdown timer and stopwatch with large digital display, start/pause/reset buttons, lap recording, red warning color when under 10 seconds, and a finish animation at zero' },
  { label: 'Drawing app',         category: 'Tool',    prompt: 'a canvas drawing app with pencil and eraser tools, a grid of color swatches, adjustable brush size slider, clear canvas button, and save-as-PNG download. Fun and easy to use' },
  { label: 'Flashcards',          category: 'Tool',    prompt: 'a flashcard study app where cards flip with a 3D animation to reveal the answer, previous and next navigation, a progress bar, shuffle button, and a completion screen' },
];

const GAME_MODIFIERS = [
  'Add score counter',
  'Add countdown timer',
  'Make it harder',
  'Add restart button',
  'Add touch controls',
  'Add high score',
  'Add more animation',
  'Add a second level',
];

// A power-up is only offered if the game does not already have it. An
// instant game was offered "Add score counter", "Add restart button" and
// "Add touch controls", all of which it has (28 October, live), and asking
// for one would at best change nothing and at worst add a second score.
const ALREADY_HAS = {
  'Add score counter':   /\bscore/i,
  'Add countdown timer': /countdown|timeLeft|secondsLeft/i,
  'Add restart button':  /restart|play again/i,
  'Add touch controls':  /touchstart|pointerdown/i,
  'Add high score':      /high.?score|best.?score|localStorage/i,
};

// What fills the gaps depends on the game: things that move get arcade
// ideas, and a game of turns (tic tac toe, connect four) gets ideas about
// turns. "Add a golden one" means nothing on a noughts and crosses board.
const MOVING_GAME = /requestAnimationFrame/;

const ARCADE_EXTRAS = [
  'Add a golden one worth 5 points',
  'Add a shield that saves me once',
  'Make it get faster as I play',
];

const TURN_EXTRAS = [
  'Let me play against the computer',
  'Add a sound for every move',
  'Add a celebration when someone wins',
];

export function gameModifiersFor(code) {
  const source = String(code || '');
  const moving = MOVING_GAME.test(source);
  const fresh = GAME_MODIFIERS.filter((m) => {
    if (ALREADY_HAS[m] && ALREADY_HAS[m].test(source)) return false;
    // Taps are clicks already in a game that waits for you.
    if (m === 'Add touch controls' && !moving) return false;
    return true;
  });
  return [...fresh, ...(moving ? ARCADE_EXTRAS : TURN_EXTRAS)].slice(0, GAME_MODIFIERS.length);
}

const WEBSITE_MODIFIERS = [
  'Make the design better',
  'Add button actions',
  'Make it mobile-friendly',
  'Add form feedback',
  'Add smooth animations',
  'Improve the colours',
  'Add a hero section',
  'Add more content',
];

const TOOL_MODIFIERS = [
  'Improve the UI',
  'Add keyboard support',
  'Add input validation',
  'Make it mobile-friendly',
  'Add animations',
  'Add more features',
  'Improve the design',
  'Add a history log',
];

function getBuildSteps(type) {
  if (/game|quiz|clicker|memory|reaction|runner/.test(type)) return [
    'Setting up the game world',
    'Adding player controls',
    'Building the score system',
    'Polishing the animations',
  ];
  if (/website|portfolio|restaurant|shop|sports|blog|landing/.test(type)) return [
    'Designing the layout',
    'Styling each section',
    'Wiring up interactions',
    'Adding the finishing touches',
  ];
  if (/tool|calculator|timer|drawing|flashcard/.test(type)) return [
    'Building the interface',
    'Adding the controls',
    'Wiring up the logic',
    'Polishing the design',
  ];
  return [
    'Analyzing your idea',
    'Building the interface',
    'Adding interactions',
    'Polishing the details',
  ];
}

const HERO_BUILDS = [
  {
    id:    'game',
    title: 'Build a Game',
    sub:   'Click, dodge, race, quiz. Playable in seconds',
    prompt: QUICK_STARTS[0].prompt,
  },
  {
    id:    'website',
    title: 'Build a Website',
    sub:   'A colorful page with working buttons and sections',
    prompt: 'a colorful one-page website with About, Features, and Contact sections, working navigation buttons, and a message form the student can customize',
  },
  {
    id:    'quiz',
    title: 'Build a Quiz',
    sub:   'Multiple choice, scoring, instant feedback',
    prompt: QUICK_STARTS[1].prompt,
  },
];

// ── The tools on the Change page ─────────────────────────────────────────────
//
// There used to be a sixth, "Save", whose panel offered a save button, a
// full-screen link and a duplicate button. Every one of those already existed
// somewhere else on the same screen: saving on the Save page, on the action bar
// and on the phone's bottom bar; full screen on the preview itself; duplicate
// on the project card. It was a fourth button reading "Save" in one viewport,
// and the only thing it added was a decision about which Save to press.
const STUDIO_TOOLS = [
  { id: 'mine',     label: 'Make it mine', desc: 'Changes that happen straight away' },
  { id: 'colors',   label: 'Colours', desc: 'Pick a colour theme' },
  { id: 'text',     label: 'Text',     desc: 'Change writing style' },
  { id: 'effects',  label: 'Effects',  desc: 'Add visual effects' },
  { id: 'gameplay', label: 'Controls', desc: 'Change how it plays, straight away' },
];

// Swatches for a colour setting inside a game. Bright, high-contrast and
// distinguishable from each other for the commonest colour-vision deficiencies
// — a child picking "the green one" should not land on the red one.
const SETTING_COLOURS = [
  '#FFD84D', '#FF7A00', '#FF4D6D', '#A855F7',
  '#3DDC97', '#00C2FF', '#FFFFFF', '#1E1E2E',
];

const PRESET_PALETTES = [
  { name: 'CodeIt', swatches: ['#FF7A00', '#A855F7', '#10B981'],
    vars: { '--primary': '#FF7A00', '--accent': '#A855F7', '--success': '#10B981', '--bg': '#FFF6ED', '--card': '#FFFFFF', '--border': '#FED7AA', '--text': '#38291F', '--muted': '#785B49' } },
  { name: 'Ocean',  swatches: ['#0EA5E9', '#06B6D4', '#22C55E'],
    vars: { '--primary': '#0EA5E9', '--accent': '#06B6D4', '--success': '#22C55E', '--bg': '#E8F4FD', '--card': '#FFFFFF', '--border': '#BAE6FD', '--text': '#0F172A', '--muted': '#64748B' } },
  { name: 'Arcade', swatches: ['#FF6B6B', '#FFE66D', '#00E5FF'],
    vars: { '--primary': '#FF6B6B', '--accent': '#F4B942', '--success': '#00AFC1', '--bg': '#FFF8E7', '--card': '#FFFFFF', '--border': '#FFD6A5', '--text': '#3D302B', '--muted': '#725F55' } },
  { name: 'Forest', swatches: ['#22C55E', '#F59E0B', '#10B981'],
    vars: { '--primary': '#22C55E', '--accent': '#F59E0B', '--success': '#10B981', '--bg': '#F0FDF4', '--card': '#FFFFFF', '--border': '#BBF7D0', '--text': '#14532D', '--muted': '#785B49' } },
  { name: 'Candy',  swatches: ['#EC4899', '#A855F7', '#10B981'],
    vars: { '--primary': '#EC4899', '--accent': '#A855F7', '--success': '#10B981', '--bg': '#FFF0F6', '--card': '#FFFFFF', '--border': '#F9A8D4', '--text': '#38291F', '--muted': '#785B49' } },
  { name: 'Galaxy', swatches: ['#8B5CF6', '#06B6D4', '#F87824'],
    vars: { '--primary': '#8B5CF6', '--accent': '#06B6D4', '--success': '#10B981', '--bg': '#F8F2FF', '--card': '#FFFFFF', '--border': '#DDC9F7', '--text': '#3D302B', '--muted': '#725F55' } },
  // Opened by a chest: the third project the child CHANGED. Shown greyed with
  // what opens it until then, so it is a goal with a route to it. Never sold.
  { name: 'Sunset', swatches: ['#FF6B35', '#F7C948', '#7B2CBF'], unlock: 'sunset', unlockHint: 'Opens when you have changed three projects',
    vars: { '--primary': '#FF6B35', '--accent': '#7B2CBF', '--success': '#2A9D8F', '--bg': '#FFF3E0', '--card': '#FFFFFF', '--border': '#FFD1A6', '--text': '#3D1F00', '--muted': '#8A5A2B' } },
];

const FIRST_CHANGE_THEMES = PRESET_PALETTES.filter(({ name }) => (
  ['CodeIt', 'Arcade', 'Candy'].includes(name)
));

const TEXT_UPGRADES = [
  'Make all text bigger and bolder',
  'Make the writing style fun and casual',
  'Make the writing style clean and professional',
  'Add more helpful labels and descriptions',
  'Simplify all text to short clear phrases',
];

const EFFECT_UPGRADES = [
  'Add smooth hover animations to all buttons',
  'Add a dark mode toggle button',
  'Add animated entrance effects to each section',
  'Add a glowing accent effect to the main button',
  'Add a confetti celebration on success or completion',
  'Add floating particles to the background',
];

// ── Creator missions (per-type pools, 3 picked randomly after build) ──────────
// Switched off in rounds 66 and 67. Flip this only once every project type
// has five hand-written, checkable rungs in challenges.js.
export const MISSIONS_ENABLED = false;

const MISSION_POOLS = {

  // ── Generic game fallback ──
  game: [
    'Add a combo multiplier that triples points on streaks',
    'Add a shield power-up that absorbs one hit',
    'Add a boss enemy that takes 5 hits to defeat',
    'Add animated particle explosions on every score event',
    'Add a speed-boost power-up that lasts 3 seconds',
    'Add a sudden death mode when the timer hits zero',
    'Add a coin magnet power-up that pulls pickups toward you',
    'Add a secret bonus round that triggers at 100 points',
    'Add screen shake on every miss or hit',
    'Add a lives system with 3 hearts displayed on screen',
    'Add a "double score" power-up that lasts 5 seconds',
    'Add a difficulty selector before the game starts',
  ],

  // ── Specific game types ──
  clicker: [
    'Add a golden target worth triple points',
    'Add a bomb target that explodes and ends the game',
    'Add a combo multiplier. 5 hits in a row = 3x score',
    'Add a ghost target that only appears for half a second',
    'Add a shield power-up that freezes the timer for 3 seconds',
    'Add a rage mode when your combo hits 8',
    'Add a boss target that takes 3 hits before it disappears',
    'Add shrinking targets. Smaller targets score more points',
    'Add a giant target that splits into 3 smaller ones when hit',
    'Turn it into a two-zone game: red targets cost points',
  ],

  runner: [
    'Add a double jump power-up that floats you over danger',
    'Add a magnet that auto-collects nearby coins',
    'Add a shield that lets you survive one crash',
    'Add a rocket boost that launches you forward at warp speed',
    'Add spikes on the ceiling as a second deadly hazard',
    'Add animated fire trails behind the character',
    'Add a slow-motion power-up that stretches 3 seconds into 10',
    'Add a checkpoint that saves progress after 500 points',
    'Add moving platforms that slide side to side',
    'Add a boss obstacle. A giant wall with one gap to jump through',
  ],

  platformer: [
    'Add spring pads that launch you to secret upper platforms',
    'Add enemies that patrol back and forth and must be jumped on',
    'Add a double jump so you can leap even higher',
    'Add a coin magnet power-up that lasts 10 seconds',
    'Add moving platforms that shift left and right',
    'Add a hazard zone. Lava at the bottom that resets the level',
    'Add a boss platform at the end with a giant enemy to dodge',
    'Add a ghost mode power-up where you pass through walls briefly',
    'Add animated sparkle effects when coins are collected',
    'Add a teleporter pad that warps you to a secret area',
  ],

  dodge: [
    'Add homing missiles that track your position',
    'Add a shield power-up that blocks one hit',
    'Add explosive obstacles that create a shockwave on impact',
    'Add a slow-motion power-up that freezes everything briefly',
    'Add diagonal-moving obstacles for unpredictable patterns',
    'Add a "close call" bonus. Dodge an obstacle within 5 pixels',
    'Add a warp zone that teleports you to the other side of the screen',
    'Add a second player ghost to race against your own best run',
    'Add screen flash on every near-miss',
    'Add a magnet that pulls score orbs toward you',
  ],

  racing: [
    'Add a nitro boost button that surges you forward',
    'Add an oil slick that makes steering slippery for 3 seconds',
    'Add a shield that absorbs one crash before shattering',
    'Add cop cars that appear at high speeds and must be avoided',
    'Add a lap counter and a personal best time tracker',
    'Add rain weather that reduces your control',
    'Add roadside obstacles: barrels and cones to dodge',
    'Add a ramp that launches your car briefly airborne',
    'Add a rival car that chases you and tries to overtake',
    'Add a speed camera zone where going too fast costs points',
  ],

  typing: [
    'Add bomb words. Type them in time or the game ends',
    'Add a golden word that appears for 2 seconds and scores triple',
    'Add a boss word: one huge 12-letter word worth 50 points',
    'Add a freeze power-up unlocked by typing the word FREEZE',
    'Add a miss counter. 3 typos and the round ends early',
    'Add a turbo rush mode where words fly in for 5 seconds',
    'Add longer words as levels increase to ramp up difficulty',
    'Add a slow-motion power-up unlocked by typing a perfect streak of 5',
    'Add a two-word challenge where both must be typed before timeout',
    'Add an on-screen keyboard highlight for each letter as typed',
  ],

  tower: [
    'Add a freeze tower that slows all enemies passing through',
    'Add a bomb tower with area-of-effect splash damage',
    'Add armored enemy units that take 3 hits to destroy',
    'Add flying enemies that bypass all ground-level towers',
    'Add an air strike power-up that wipes the entire screen',
    'Add a tower upgrade system. Spend gold to double a tower\'s range',
    'Add a repair station that restores 3 lives for 50 gold',
    'Add a boss enemy at wave 5 that has 10 hit points',
    'Add a slow-down button that reduces enemy speed for 5 seconds',
    'Add income towers that generate 2 gold every 5 seconds',
  ],

  maze: [
    'Add a key you must collect before the exit unlocks',
    'Add an enemy that chases you through the corridors',
    'Add a fog of war. Only reveal walls close to the player',
    'Add teleport pads that warp you to a random maze location',
    'Add collectible stars hidden at dead ends for bonus points',
    'Add a countdown timer. Escape before it hits zero',
    'Add moving walls that shift and change the maze layout',
    'Add a torch power-up that temporarily reveals the whole maze',
    'Add multiple exits and a bonus for finding the correct one',
    'Add a "map reveal" item worth collecting for a navigation hint',
  ],

  survival: [
    'Add a temporary shield that repels all enemies on contact',
    'Add an explosion ability that clears the entire screen',
    'Add armored enemies that absorb 2 hits before dying',
    'Add a speed boost power-up to outrun the horde',
    'Add a magnet that automatically pulls health packs to you',
    'Add a scoring multiplier for deliberately getting close to enemies',
    'Add a boss enemy. Giant, fast, and worth 100 points',
    'Add a freeze ability that stops all enemies for 3 seconds',
    'Add enemy waves that announce themselves with a flashing warning',
    'Add a safe zone that appears briefly and restores 1 health',
  ],

  puzzle: [
    'Add a hint button that highlights the correct next tile',
    'Add a countdown timer that challenges you to beat the clock',
    'Add an undo button that rewinds your last 3 moves',
    'Add animated tile sliding with smooth easing',
    'Add a "shuffle again" penalty. Costs 20 points per use',
    'Add a star rating: 3 stars for under 20 moves, 2 for 30, 1 for any win',
    'Add a color-coded guide showing which tiles are in the right place',
    'Add a move counter that turns red when over the ideal limit',
    'Add a celebration animation with confetti when the puzzle is solved',
    'Add a difficulty selector: 3x3, 4x4, or 5x5 grids',
  ],

  basketball: [
    'Add a 3-point line. Shots from far away score triple',
    'Add wind gusts that push the ball left or right mid-flight',
    'Add an arc guide that shows the ball\'s predicted trajectory',
    'Add a layup zone close to the hoop that scores 1 point quickly',
    'Add a fast break mode that awards double points for 10 seconds',
    'Add a shot streak bonus. 3 in a row gives you 5 bonus points',
    'Add backboard bounce detection for a lucky-shot bonus',
    'Add a moving hoop that slides left and right to increase difficulty',
    'Add a buzzer beater round: score in under 2 seconds',
    'Add a crowd noise effect that grows louder with your score',
  ],

  soccer: [
    'Add a goalkeeper that levels up and gets smarter each miss',
    'Add a curve shot. Click a direction for the ball to bend mid-air',
    'Add a wind meter that tilts ball flight left or right',
    'Add a sudden death round: next miss ends the game',
    'Add a corner kick round with a more difficult angle to shoot from',
    'Add a power meter. Hold longer to kick harder',
    'Add a slow-motion replay on every successful goal',
    'Add hat trick celebrations. Score 3 and the crowd goes wild',
    'Add a goalkeeper dive animation with a miss or save sound',
    'Add a training round with a stationary goalkeeper to warm up',
  ],

  cooking: [
    'Add a secret ingredient that secretly doubles the dish\'s value',
    'Add a burned dish penalty when you are too slow',
    'Add a rush hour mode. Complete 3 recipes simultaneously',
    'Add a chef star rating: 1 to 5 stars based on accuracy and speed',
    'Add a wrong ingredient penalty that scrambles the order',
    'Add ingredient substitutions that appear in advanced rounds',
    'Add a time bonus that rewards completing recipes super fast',
    'Add a kitchen disaster: random event that shuffles all ingredients',
    'Add animated cooking effects: steam, sizzle, and fire on the stove',
    'Add a customer order ticket that shows what the dish should look like',
  ],

  memory: [
    'Add a hidden countdown. Match all pairs before time runs out',
    'Add a golden pair worth double points when matched first',
    'Add a peek power-up that briefly flips all cards face-up',
    'Add faster flip-back timing as levels advance',
    'Add a 6x6 expert mode with 18 pairs to find',
    'Add a combo bonus. Match 3 pairs in a row for bonus points',
    'Add confetti and a score multiplier for speed matching',
    'Add a daily challenge with a fixed layout to compare scores',
    'Add themed emoji sets that change each round',
    'Add a distraction: one card spins in place to throw you off',
  ],

  reaction: [
    'Add a fake-out flash that penalizes tapping too early',
    'Add a color challenge. Only tap when the circle turns green',
    'Add a final lightning round with half the normal reaction window',
    'Add a streak bonus: 3 perfect taps doubles your next round score',
    'Add a sound cue before the visual one. React to the beep',
    'Add a two-target round where both must be tapped simultaneously',
    'Add a leaderboard entry for all-time top 3 times',
    'Add a personal best tracker with animated record celebrations',
    'Add a penalty for tapping during the wrong color',
    'Add a score rating: Lightning / Fast / Average / Too Slow per round',
  ],

  // ── Non-game categories ──
  quiz: [
    'Add a 10-second countdown bar per question',
    'Add a streak bonus. 3 correct in a row doubles points',
    'Add a lifeline: skip one question without penalty',
    'Add difficulty levels: Easy, Medium, and Hard',
    'Add a correct-answer explanation that appears after each wrong pick',
    'Add an impossible bonus round at the very end',
    'Add animated correct and wrong answer feedback',
    'Add a final result certificate with your score percentage',
    'Shuffle questions and answer options on every new game',
    'Add a combo multiplier that resets on wrong answers',
  ],

  website: [
    'Add a live search bar that filters content instantly',
    'Add a dark mode toggle that flips the whole page',
    'Add an animated counter that counts up from zero on load',
    'Make every card flip or zoom in on hover',
    'Add a modal popup with an image gallery or special offer',
    'Add a sticky header that shrinks when you scroll down',
    'Add a testimonial slider with left and right arrows',
    'Add a full-screen hero with a parallax scroll effect',
    'Add a shopping cart panel that slides in from the side',
    'Add a newsletter signup bar with a success animation',
    'Add smooth scroll and section highlights on the nav links',
    'Add a floating chat button that pops up a contact form',
  ],

  tool: [
    'Add a history log showing your last 10 results',
    'Add keyboard shortcuts for the most common actions',
    'Add a copy-to-clipboard button with a checkmark animation',
    'Add real-time input validation with color-coded feedback',
    'Add a dark and light theme toggle',
    'Add animated transitions between every state change',
    'Add an export button that downloads results as a text file',
    'Add an undo and redo button for the last 5 actions',
    'Add a share button that generates a shareable summary',
    'Add a compact mode that collapses extra options',
  ],

  simulator: [
    'Add a speed slider that controls how fast time passes',
    'Add a live graph that charts the key stat over time',
    'Add a dramatic event button that injects a sudden change',
    'Add a pause and resume toggle with the spacebar',
    'Add color coding based on density, energy, or population',
    'Add a births vs deaths counter that updates every second',
    'Add a reset button that restores the exact starting state',
    'Add a zoom control to focus on a specific part of the simulation',
  ],
};

async function fetchAiMissions(html, type, title, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/builder/missions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ html, type, title }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data.missions) && data.missions.length >= 3) return data.missions;
    return null;
  } catch (_) {
    return null;
  }
}

function getMissions(type) {
  const t = (type || '').toLowerCase();
  let pool;
  if      (t === 'clicker')    pool = MISSION_POOLS.clicker;
  else if (t === 'runner')     pool = MISSION_POOLS.runner;
  else if (t === 'platformer') pool = MISSION_POOLS.platformer;
  else if (t === 'dodge')      pool = MISSION_POOLS.dodge;
  else if (t === 'racing')     pool = MISSION_POOLS.racing;
  else if (t === 'typing')     pool = MISSION_POOLS.typing;
  else if (t === 'tower')      pool = MISSION_POOLS.tower;
  else if (t === 'maze')       pool = MISSION_POOLS.maze;
  else if (t === 'survival')   pool = MISSION_POOLS.survival;
  else if (t === 'puzzle')     pool = MISSION_POOLS.puzzle;
  else if (t === 'basketball') pool = MISSION_POOLS.basketball;
  else if (t === 'soccer')     pool = MISSION_POOLS.soccer;
  else if (t === 'cooking')    pool = MISSION_POOLS.cooking;
  else if (t === 'memory')     pool = MISSION_POOLS.memory;
  else if (t === 'reaction')   pool = MISSION_POOLS.reaction;
  else if (t === 'quiz')       pool = MISSION_POOLS.quiz;
  else if (t === 'simulator')  pool = MISSION_POOLS.simulator;
  else if (/website|portfolio|restaurant|shop|sports|blog|landing/.test(t)) pool = MISSION_POOLS.website;
  else if (/tool|calculator|timer|drawing|flashcard/.test(t))               pool = MISSION_POOLS.tool;
  else                                                                        pool = MISSION_POOLS.game;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
}

// ── AI Companion tips (rotate every ~15s, no AI calls) ────────────────────────
const COMPANION_TIPS = {
  game:    [
    'Want to add a high score table?',
    'Try making it harder as the score climbs.',
    'A boss level would make this epic.',
    'Players love leaderboards.',
    'Power-ups would really spice this up.',
    'Add lives for extra replay value.',
    'A second level feels amazing.',
    'Try the speed slider in Gameplay.',
  ],
  website: [
    'A dark mode toggle would impress visitors.',
    'Try adding smooth scroll animations.',
    'A contact form makes this feel complete.',
    'Hover effects on cards look great.',
    'A sticky header adds polish.',
    'Make it mobile-friendly for everyone.',
  ],
  quiz:    [
    'A timer adds real excitement.',
    'Try a streak bonus for right answers.',
    'More questions means more replayability.',
    'Show explanations after each answer.',
    'A progress bar helps players stay focused.',
  ],
  tool:    [
    'A history log is super useful here.',
    'Try adding keyboard shortcuts.',
    'A copy-to-clipboard button saves time.',
    'Make it work on mobile too.',
  ],
  default: [
    'Looking good.',
    'Try the Studio tools for instant changes.',
    'Describe a change when you want a bigger update.',
    'Save this before editing more.',
  ],
};

function getProjectGradient(type) {
  const t = (type || '').toLowerCase();
  if (/game|quiz|clicker|memory|reaction|runner/.test(t)) return 'linear-gradient(135deg, #FF7A00 0%, #A855F7 100%)';
  if (/website|portfolio|restaurant|shop|sports|blog|landing/.test(t)) return 'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)';
  if (/tool|calculator|timer|drawing|flashcard/.test(t)) return 'linear-gradient(135deg, #785B49 0%, #10B981 100%)';
  return 'linear-gradient(135deg, #FF7A00 0%, #A855F7 100%)';
}

function detectProjectType(prompt) {
  const p = (prompt || '').toLowerCase();
  if (/quiz|trivia|question|answer|knowledge|multiple.?choice/.test(p)) return 'quiz';
  if (/game|click|catch|dodge|jump|score|play|hit|target|race|puzzle|tap/.test(p)) return 'game';
  // Games children name without saying "game": "tic tac toe" waited under
  // "Building your website..." (round 135).
  if (/tic.?tac.?toe|noughts|connect.?(four|4)|chess|checkers|draughts|sudoku|hangman|bingo|\buno\b|pong|tetris|snake|rock.?paper|\bdice\b|word.?search|crossword/.test(p)) return 'game';
  if (namedGame(p)) return 'game';
  if (/calc|tool|convert|measure|track|counter/.test(p)) return 'tool';
  if (/story|random|generat|pick|maker/.test(p)) return 'story';
  return 'website';
}

export {
  SHELF_STICKERS,
  HERO_STICKERS,
  STARTER_TYPES,
  QUICK_STARTS,
  GAME_MODIFIERS,
  ALREADY_HAS,
  MOVING_GAME,
  ARCADE_EXTRAS,
  TURN_EXTRAS,
  WEBSITE_MODIFIERS,
  TOOL_MODIFIERS,
  getBuildSteps,
  HERO_BUILDS,
  STUDIO_TOOLS,
  SETTING_COLOURS,
  PRESET_PALETTES,
  FIRST_CHANGE_THEMES,
  TEXT_UPGRADES,
  EFFECT_UPGRADES,
  MISSION_POOLS,
  fetchAiMissions,
  getMissions,
  COMPANION_TIPS,
  getProjectGradient,
  detectProjectType,
};
