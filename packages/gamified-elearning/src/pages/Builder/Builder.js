/* eslint-disable no-useless-escape -- fallback project templates intentionally preserve escaped HTML/JS */
import { useState, useRef, useEffect, useMemo, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import { API_BASE_URL } from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import { useSEO } from '../../hooks/useSEO';
import { trackEvent } from '../../utils/trackEvent';
import { journeyHeaders } from '../../utils/journey';
import {
  clearGuestProjectDraft,
  readGuestProjectDraft,
  saveGuestProjectDraft,
} from '../../utils/guestProjectDraft';
import {
  BACKGROUNDS,
  CORNERS,
  DEFAULT_PREFS,
  FONTS,
  TEXT_SIZES,
  bakeInstantStyle,
  buildInstantCss,
  controlsForGuideLevel,
  optionsForGuideLevel,
  readInstantPrefs,
  readProjectHeading,
  setProjectHeading,
} from './instantStyle';
import './Builder.css';
import { changeIdeasFor } from './changeIdeas';
import {
  injectPreviewStorage,
  isStorageMessage,
  loadPreviewStorage,
  savePreviewStorage,
  stripPreviewScripts,
} from './previewStorage';
import { initialTab, tabAfter, tabsFor } from './builderTabs';
import {
  EMPTY as EMPTY_HISTORY,
  canRedo as historyCanRedo,
  canUndo as historyCanUndo,
  clearHistory,
  redo as historyRedo,
  remember as rememberEdit,
  undo as historyUndo,
  undoLabel as historyUndoLabel,
} from './editHistory';
import {
  GUIDE_LEVELS,
  learnerGuideLevel,
  storeGuideLevelOverride,
  storedGuideLevelOverride,
} from '../../utils/guideLevel';

const QUICK_STARTS = [
  // Games
  { label: 'Click the target',    category: 'Game',    prompt: 'a click-the-target game where colorful circles pop up randomly and you have to click them before they vanish — with a 30-second timer, score counter, increasing speed each hit, and a game-over screen' },
  { label: 'Quick quiz',          category: 'Game',    prompt: 'a 3-question general knowledge quiz with multiple choice answers, instant correct or wrong feedback, a score counter, and a results screen at the end' },
  { label: 'Memory match',        category: 'Game',    prompt: 'a memory card matching game with emoji pairs on a 4x4 grid — cards flip with animation, track number of moves, and show a celebration screen when all pairs are found' },
  { label: 'Reaction tester',     category: 'Game',    prompt: 'a reaction time tester where a glowing circle appears after a random delay and you tap it as fast as possible — 5 rounds, shows your average reaction time at the end' },
  // Websites
  { label: 'My portfolio',        category: 'Website', prompt: 'a personal portfolio website with a hero section, animated skills grid, project cards with hover effects, and a contact form that shows a success message — colorful and modern' },
  { label: 'Pizza shop',          category: 'Website', prompt: 'a pizza restaurant website with sticky nav, menu grid with add-to-order buttons, a live cart showing items and total, and an order confirmation animation' },
  { label: 'Sports fan page',     category: 'Website', prompt: 'a soccer team fan page with a hero section, tab navigation between roster, schedule, and results, player cards with stats, and animated score counters' },
  { label: 'Pet shop',            category: 'Website', prompt: 'a pet shop with product cards for animals and supplies, add-to-cart buttons, a cart panel showing items and running total, and a cute checkout confirmation overlay' },
  // Tools
  { label: 'Calculator',          category: 'Tool',    prompt: 'a calculator with a number display, full keypad (0-9, +, -, ×, ÷, =, AC), keyboard support, and a smooth result animation — make it look modern and polished' },
  { label: 'Countdown timer',     category: 'Tool',    prompt: 'a countdown timer and stopwatch with large digital display, start/pause/reset buttons, lap recording, red warning color when under 10 seconds, and a finish animation at zero' },
  { label: 'Drawing app',         category: 'Tool',    prompt: 'a canvas drawing app with pencil and eraser tools, a grid of color swatches, adjustable brush size slider, clear canvas button, and save-as-PNG download — fun and easy to use' },
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

const WEBSITE_MODIFIERS = [
  'Make the design better',
  'Add button actions',
  'Make it mobile-friendly',
  'Add form feedback',
  'Add smooth animations',
  'Improve the colors',
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

const LESSON_CONCEPTS = [
  { id: 2,  title: 'Variables',     hint: 'Store scores, names, and data'         },
  { id: 3,  title: 'Strings',       hint: 'Work with text and messages'            },
  { id: 4,  title: 'If Statements', hint: 'Decide what happens next'               },
  { id: 5,  title: 'For Loops',     hint: 'Repeat actions automatically'           },
  { id: 7,  title: 'Lists',         hint: 'Store and show multiple items'          },
  { id: 9,  title: 'Functions',     hint: 'Organize actions into reusable blocks'  },
];

const HERO_BUILDS = [
  {
    id:    'game',
    title: 'Build a Game',
    sub:   'Click, dodge, race, quiz — playable in seconds',
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

const STUDIO_TOOLS = [
  { id: 'mine',     label: 'Make it mine', desc: 'Instant changes — no waiting' },
  { id: 'colors',   label: 'Colors',   desc: 'Pick a color theme' },
  { id: 'text',     label: 'Text',     desc: 'Change writing style' },
  { id: 'effects',  label: 'Effects',  desc: 'Add visual effects' },
  { id: 'gameplay', label: 'Gameplay', desc: 'Tune game settings' },
  { id: 'save',     label: 'Save',     desc: 'Save your creation' },
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
    'Add a combo multiplier — 5 hits in a row = 3x score',
    'Add a ghost target that only appears for half a second',
    'Add a shield power-up that freezes the timer for 3 seconds',
    'Add a rage mode when your combo hits 8',
    'Add a boss target that takes 3 hits before it disappears',
    'Add shrinking targets — smaller targets score more points',
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
    'Add a boss obstacle — a giant wall with one gap to jump through',
  ],

  platformer: [
    'Add spring pads that launch you to secret upper platforms',
    'Add enemies that patrol back and forth and must be jumped on',
    'Add a double jump so you can leap even higher',
    'Add a coin magnet power-up that lasts 10 seconds',
    'Add moving platforms that shift left and right',
    'Add a hazard zone — lava at the bottom that resets the level',
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
    'Add a "close call" bonus — dodge an obstacle within 5 pixels',
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
    'Add bomb words — type them in time or the game ends',
    'Add a golden word that appears for 2 seconds and scores triple',
    'Add a boss word: one huge 12-letter word worth 50 points',
    'Add a freeze power-up unlocked by typing the word FREEZE',
    'Add a miss counter — 3 typos and the round ends early',
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
    'Add a tower upgrade system — spend gold to double a tower\'s range',
    'Add a repair station that restores 3 lives for 50 gold',
    'Add a boss enemy at wave 5 that has 10 hit points',
    'Add a slow-down button that reduces enemy speed for 5 seconds',
    'Add income towers that generate 2 gold every 5 seconds',
  ],

  maze: [
    'Add a key you must collect before the exit unlocks',
    'Add an enemy that chases you through the corridors',
    'Add a fog of war — only reveal walls close to the player',
    'Add teleport pads that warp you to a random maze location',
    'Add collectible stars hidden at dead ends for bonus points',
    'Add a countdown timer — escape before it hits zero',
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
    'Add a boss enemy — giant, fast, and worth 100 points',
    'Add a freeze ability that stops all enemies for 3 seconds',
    'Add enemy waves that announce themselves with a flashing warning',
    'Add a safe zone that appears briefly and restores 1 health',
  ],

  puzzle: [
    'Add a hint button that highlights the correct next tile',
    'Add a countdown timer that challenges you to beat the clock',
    'Add an undo button that rewinds your last 3 moves',
    'Add animated tile sliding with smooth easing',
    'Add a "shuffle again" penalty — costs 20 points per use',
    'Add a star rating: 3 stars for under 20 moves, 2 for 30, 1 for any win',
    'Add a color-coded guide showing which tiles are in the right place',
    'Add a move counter that turns red when over the ideal limit',
    'Add a celebration animation with confetti when the puzzle is solved',
    'Add a difficulty selector: 3x3, 4x4, or 5x5 grids',
  ],

  basketball: [
    'Add a 3-point line — shots from far away score triple',
    'Add wind gusts that push the ball left or right mid-flight',
    'Add an arc guide that shows the ball\'s predicted trajectory',
    'Add a layup zone close to the hoop that scores 1 point quickly',
    'Add a fast break mode that awards double points for 10 seconds',
    'Add a shot streak bonus — 3 in a row gives you 5 bonus points',
    'Add backboard bounce detection for a lucky-shot bonus',
    'Add a moving hoop that slides left and right to increase difficulty',
    'Add a buzzer beater round: score in under 2 seconds',
    'Add a crowd noise effect that grows louder with your score',
  ],

  soccer: [
    'Add a goalkeeper that levels up and gets smarter each miss',
    'Add a curve shot — click a direction for the ball to bend mid-air',
    'Add a wind meter that tilts ball flight left or right',
    'Add a sudden death round: next miss ends the game',
    'Add a corner kick round with a more difficult angle to shoot from',
    'Add a power meter — hold longer to kick harder',
    'Add a slow-motion replay on every successful goal',
    'Add hat trick celebrations — score 3 and the crowd goes wild',
    'Add a goalkeeper dive animation with a miss or save sound',
    'Add a training round with a stationary goalkeeper to warm up',
  ],

  cooking: [
    'Add a secret ingredient that secretly doubles the dish\'s value',
    'Add a burned dish penalty when you are too slow',
    'Add a rush hour mode — complete 3 recipes simultaneously',
    'Add a chef star rating: 1 to 5 stars based on accuracy and speed',
    'Add a wrong ingredient penalty that scrambles the order',
    'Add ingredient substitutions that appear in advanced rounds',
    'Add a time bonus that rewards completing recipes super fast',
    'Add a kitchen disaster: random event that shuffles all ingredients',
    'Add animated cooking effects: steam, sizzle, and fire on the stove',
    'Add a customer order ticket that shows what the dish should look like',
  ],

  memory: [
    'Add a hidden countdown — match all pairs before time runs out',
    'Add a golden pair worth double points when matched first',
    'Add a peek power-up that briefly flips all cards face-up',
    'Add faster flip-back timing as levels advance',
    'Add a 6x6 expert mode with 18 pairs to find',
    'Add a combo bonus — match 3 pairs in a row for bonus points',
    'Add confetti and a score multiplier for speed matching',
    'Add a daily challenge with a fixed layout to compare scores',
    'Add themed emoji sets that change each round',
    'Add a distraction: one card spins in place to throw you off',
  ],

  reaction: [
    'Add a fake-out flash that penalizes tapping too early',
    'Add a color challenge — only tap when the circle turns green',
    'Add a final lightning round with half the normal reaction window',
    'Add a streak bonus: 3 perfect taps doubles your next round score',
    'Add a sound cue before the visual one — react to the beep',
    'Add a two-target round where both must be tapped simultaneously',
    'Add a leaderboard entry for all-time top 3 times',
    'Add a personal best tracker with animated record celebrations',
    'Add a penalty for tapping during the wrong color',
    'Add a score rating: Lightning / Fast / Average / Too Slow per round',
  ],

  // ── Non-game categories ──
  quiz: [
    'Add a 10-second countdown bar per question',
    'Add a streak bonus — 3 correct in a row doubles points',
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

function detectLessonIds(prompt) {
  const p = (prompt || '').toLowerCase();
  if (/game|click|target|score|timer|play|hit|miss/.test(p)) return [2, 4, 5, 9];
  if (/quiz|question|answer|multiple|choice/.test(p))        return [4, 7, 9];
  if (/story|random|generator|maker/.test(p))                return [2, 3, 7];
  if (/website|page|fan|about|profile|portfolio/.test(p))    return [3, 4];
  return [2, 4, 9];
}

function detectProjectType(prompt) {
  const p = (prompt || '').toLowerCase();
  if (/quiz|trivia|question|answer|knowledge|multiple.?choice/.test(p)) return 'quiz';
  if (/game|click|catch|dodge|jump|score|play|hit|target|race|puzzle|tap/.test(p)) return 'game';
  if (/calc|tool|convert|measure|track|counter/.test(p)) return 'tool';
  if (/story|random|generat|pick|maker/.test(p)) return 'story';
  return 'website';
}

// ── Instant starter templates shown while AI generates ────────────
const STARTER_TEMPLATES = {
  game: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--orange:#FF7A00;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);min-height:100vh;padding:20px;display:flex;flex-direction:column;align-items:center;gap:12px}h1{font-size:1.9rem;font-weight:800;color:#38291F}.hud{display:flex;gap:22px;font-size:1.1rem;font-weight:700;color:#38291F}.hud b{color:var(--orange)}#ga{position:relative;width:360px;height:320px;background:#fff;border-radius:16px;border:2px solid rgba(255,122,0,.18);box-shadow:0 8px 24px rgba(0,0,0,.08);overflow:hidden}.tgt{position:absolute;width:52px;height:52px;background:var(--orange);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.4rem;user-select:none;transition:transform .1s}.tgt:hover{transform:scale(1.12)}.ov{position:absolute;inset:0;background:rgba(255,246,237,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:10}.ov h2{font-size:1.5rem;font-weight:800;color:#38291F}.ov p{color:#785B49;font-size:.95rem}button{background:var(--orange);color:#fff;border:none;border-radius:var(--r);padding:13px 30px;font-size:1.05rem;font-weight:700;cursor:pointer;transition:opacity .15s}button:hover{opacity:.88}</style></head><body><h1>Click Game</h1><div class="hud"><span>Score: <b id="sc">0</b></span><span>Time: <b id="ti">30</b>s</span></div><div id="ga"><div class="ov" id="ov"><h2>Ready to Play?</h2><p>Click the stars before they disappear!</p><button onclick="startGame()">Start Game</button></div></div><script>let s=0,t=30,on=false,sp,ct;function startGame(){s=0;t=30;on=true;document.getElementById('sc').textContent=0;document.getElementById('ti').textContent=30;document.getElementById('ov').style.display='none';document.querySelectorAll('.tgt').forEach(x=>x.remove());sp=setInterval(spawn,860);ct=setInterval(()=>{t--;document.getElementById('ti').textContent=t;if(t<=0)end();},1000);}function spawn(){if(!on)return;const e=document.createElement('div');e.className='tgt';e.textContent='⭐';e.style.left=Math.random()*290+'px';e.style.top=Math.random()*260+'px';e.onclick=()=>{if(!on)return;s++;document.getElementById('sc').textContent=s;e.remove();};document.getElementById('ga').appendChild(e);setTimeout(()=>e&&e.remove(),1100);}function end(){on=false;clearInterval(sp);clearInterval(ct);document.querySelectorAll('.tgt').forEach(x=>x.remove());const o=document.getElementById('ov');o.style.display='flex';o.innerHTML='<h2>Game Over!</h2><p>Score: <b style="color:#FF7A00">'+s+'</b> — great job!</p><button onclick="startGame()">Play Again</button>';}<\/script></body></html>`,

  quiz: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--orange:#FF7A00;--mint:#10B981;--coral:#FF6B6B;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:#fff;border-radius:20px;padding:28px;max-width:460px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.08)}h1{font-size:1.7rem;font-weight:800;color:#38291F;margin-bottom:6px}.sub{color:#785B49;font-size:.9rem;margin-bottom:20px}#quiz-screen{display:none}#result-screen{display:none;text-align:center}.qnum{font-size:.78rem;font-weight:800;color:var(--orange);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}.qtext{font-size:1.05rem;font-weight:700;color:#38291F;margin-bottom:14px;line-height:1.4}.opts{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}.opt{padding:11px 14px;background:#FFFCF8;border:2px solid #EAD9CB;border-radius:10px;font-size:.95rem;font-weight:600;cursor:pointer;text-align:left;font-family:inherit;transition:all .15s}.opt:hover:not(:disabled){border-color:var(--orange);background:rgba(255,122,0,.06)}.fb{font-weight:700;font-size:.9rem;min-height:1.4rem;margin-bottom:8px}.fb.ok{color:var(--mint)}.fb.no{color:var(--coral)}.btn{background:var(--orange);color:#fff;border:none;border-radius:var(--r);padding:12px 24px;font-size:1rem;font-weight:700;cursor:pointer;width:100%;font-family:inherit}.btn:hover{opacity:.9}#nxt{display:none}.bigs{font-size:2.8rem;font-weight:800;color:var(--orange);margin:10px 0}</style></head><body><div class="card"><div id="start-screen"><h1>Quiz Time!</h1><p class="sub">3 sample questions — can you get them all right?</p><button class="btn" onclick="startQuiz()">Start Quiz</button></div><div id="quiz-screen"><div class="qnum" id="qnum"></div><div class="qtext" id="qtext"></div><div class="opts" id="opts"></div><div class="fb" id="fb"></div><button class="btn" id="nxt" onclick="nextQ()">Next Question</button></div><div id="result-screen"><h1>Done!</h1><div class="bigs" id="fscore">0 / 3</div><p class="sub">Try another round or change the questions.</p><button class="btn" onclick="startQuiz()">Play Again</button></div></div><script>const qs=[{q:'What is 4 × 6?',a:['20','24','26','18'],c:1},{q:'Which is the largest ocean?',a:['Atlantic','Indian','Arctic','Pacific'],c:3},{q:'How many sides does a hexagon have?',a:['5','7','6','8'],c:2}];let cur=0,sc=0;function startQuiz(){cur=0;sc=0;document.getElementById('start-screen').style.display='none';document.getElementById('result-screen').style.display='none';document.getElementById('quiz-screen').style.display='block';showQ();}function showQ(){const q=qs[cur];document.getElementById('qnum').textContent='Question '+(cur+1)+' / '+qs.length;document.getElementById('qtext').textContent=q.q;document.getElementById('fb').textContent='';document.getElementById('fb').className='fb';document.getElementById('nxt').style.display='none';const opts=document.getElementById('opts');opts.innerHTML='';q.a.forEach((a,i)=>{const b=document.createElement('button');b.className='opt';b.textContent=a;b.onclick=()=>check(i);opts.appendChild(b);});}function check(i){const c=qs[cur].c;document.querySelectorAll('.opt').forEach((b,j)=>{b.disabled=true;if(j===c)b.style.background='rgba(16,185,129,.15)';if(j===i&&j!==c)b.style.background='rgba(255,107,107,.15)';});const fb=document.getElementById('fb');if(i===c){sc++;fb.textContent='Correct!';fb.className='fb ok';}else{fb.textContent='Wrong — see green for the answer.';fb.className='fb no';}document.getElementById('nxt').style.display='block';}function nextQ(){cur++;if(cur<qs.length)showQ();else done();}function done(){document.getElementById('quiz-screen').style.display='none';document.getElementById('result-screen').style.display='block';document.getElementById('fscore').textContent=sc+' / '+qs.length;}<\/script></body></html>`,

  website: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--orange:#FF7A00;--mint:#10B981;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);color:#38291F}nav{display:flex;gap:10px;padding:.8rem 1.4rem;background:#fff;border-bottom:1px solid #F4E7DC;position:sticky;top:0;z-index:10}nav a{color:#38291F;font-weight:700;text-decoration:none;padding:6px 10px;border-radius:8px;font-size:.9rem;cursor:pointer;transition:background .15s}nav a:hover{background:rgba(255,122,0,.1);color:var(--orange)}.hero{padding:3.5rem 1.5rem;text-align:center;background:linear-gradient(135deg,rgba(255,122,0,.06),rgba(61,220,151,.05))}.hero h1{font-size:2.2rem;font-weight:800;margin-bottom:8px}.hero p{color:#785B49;margin-bottom:20px;font-size:1rem}.btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.btn{display:inline-block;background:var(--orange);color:#fff;border:none;border-radius:var(--r);padding:12px 24px;font-size:.95rem;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .15s,transform .1s}.btn:hover{opacity:.9;transform:translateY(-1px)}.btn-g{background:transparent;color:var(--orange);border:2px solid var(--orange)}section{padding:2.5rem 1.5rem;max-width:640px;margin:0 auto}h2{font-size:1.4rem;font-weight:800;margin-bottom:12px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}.card{background:#fff;border-radius:14px;padding:16px;box-shadow:0 4px 14px rgba(0,0,0,.07)}.card h3{font-weight:700;margin-bottom:4px;font-size:.95rem}.card p{font-size:.82rem;color:#785B49}.form-row{display:flex;gap:8px;margin-top:12px}.form-row input{flex:1;padding:10px 12px;border:2px solid #EAD9CB;border-radius:10px;font-family:inherit;font-size:.9rem;outline:none}.form-row input:focus{border-color:var(--orange)}#msg{font-weight:700;color:var(--mint);margin-top:8px;min-height:1.2rem;font-size:.9rem}</style></head><body><nav><a onclick="sv('#about')">About</a><a onclick="sv('#features')">Features</a><a onclick="sv('#contact')">Contact</a></nav><div class="hero"><h1>Welcome!</h1><p>Your website is ready — explore it now!</p><div class="btns"><button class="btn" onclick="sv('#features')">Explore</button><button class="btn btn-g" onclick="alert('Hello! Your site is ready to explore.')">Say Hello</button></div></div><section id="about"><h2>About</h2><p style="color:#785B49;line-height:1.6">Click buttons and nav links — everything is interactive and ready for you to customize.</p></section><section id="features"><h2>Features</h2><div class="grid"><div class="card"><h3>Interactive</h3><p>Every button does something</p></div><div class="card"><h3>Colorful</h3><p>Bright and fun design</p></div><div class="card"><h3>Built to edit</h3><p>Change every section</p></div></div></section><section id="contact"><h2>Contact</h2><div class="form-row"><input id="ni" placeholder="Your message..."><button class="btn" onclick="send()">Send</button></div><p id="msg"></p></section><script>function sv(id){document.querySelector(id).scrollIntoView({behavior:'smooth'});}function send(){const v=document.getElementById('ni').value.trim();document.getElementById('msg').textContent=v?'Thanks! Got your message: "'+v+'"':'Please type a message first.';}<\/script></body></html>`,

  tool: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--orange:#FF7A00;--coral:#FF6B6B;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:#fff;border-radius:20px;padding:30px;max-width:380px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.08)}h1{font-size:1.6rem;font-weight:800;color:#38291F;margin-bottom:6px}p{color:#785B49;font-size:.88rem;margin-bottom:18px}label{display:block;font-size:.83rem;font-weight:700;color:#4F392C;margin-bottom:5px}input,select{width:100%;padding:11px 13px;border:2px solid #EAD9CB;border-radius:10px;font-size:.95rem;font-family:inherit;outline:none;margin-bottom:12px;transition:border-color .15s}input:focus,select:focus{border-color:var(--orange)}button{background:var(--orange);color:#fff;border:none;border-radius:var(--r);padding:13px;font-size:1rem;font-weight:700;cursor:pointer;width:100%;font-family:inherit}button:hover{opacity:.9}.res{margin-top:16px;padding:16px;background:rgba(255,122,0,.07);border:2px solid rgba(255,122,0,.18);border-radius:12px;min-height:56px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px}.rv{font-size:2rem;font-weight:800;color:var(--orange)}.rl{font-size:.8rem;color:#785B49;text-align:center}</style></head><body><div class="card"><h1>Calculator</h1><p>Enter numbers and click Calculate</p><label>First number</label><input id="a" type="number" placeholder="e.g. 25"><label>Second number</label><input id="b" type="number" placeholder="e.g. 10"><select id="op"><option value="+">Add (+)</option><option value="-">Subtract (−)</option><option value="*">Multiply (×)</option><option value="/">Divide (÷)</option></select><button onclick="calc()">Calculate</button><div class="res"><div class="rv" id="rv">—</div><div class="rl" id="rl">Enter numbers above</div></div></div><script>function calc(){const a=parseFloat(document.getElementById('a').value),b=parseFloat(document.getElementById('b').value),op=document.getElementById('op').value;if(isNaN(a)||isNaN(b)){document.getElementById('rv').textContent='?';document.getElementById('rv').style.color='#FF6B6B';document.getElementById('rl').textContent='Enter valid numbers';return;}let r,l;if(op==='+'){r=a+b;l=a+' + '+b+' = '+r;}else if(op==='-'){r=a-b;l=a+' − '+b+' = '+r;}else if(op==='*'){r=a*b;l=a+' × '+b+' = '+r;}else{if(b===0){document.getElementById('rv').textContent='∞';document.getElementById('rv').style.color='#FF6B6B';document.getElementById('rl').textContent="Can't divide by zero!";return;}r=Math.round(a/b*100)/100;l=a+' ÷ '+b+' = '+r;}document.getElementById('rv').textContent=r;document.getElementById('rv').style.color='#FF7A00';document.getElementById('rl').textContent=l;}document.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')calc();}));<\/script></body></html>`,

  story: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--orange:#FF7A00;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:#fff;border-radius:20px;padding:32px;max-width:440px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.08);text-align:center}h1{font-size:1.8rem;font-weight:800;color:#38291F;margin-bottom:6px}p.sub{color:#785B49;font-size:.9rem;margin-bottom:20px}button{background:var(--orange);color:#fff;border:none;border-radius:var(--r);padding:14px 28px;font-size:1.1rem;font-weight:700;cursor:pointer;font-family:inherit;transition:transform .12s,opacity .15s;margin-bottom:18px}button:hover{opacity:.9;transform:scale(1.04)}button:active{transform:scale(.97)}.sb{background:rgba(255,122,0,.05);border:2px solid rgba(255,122,0,.18);border-radius:14px;padding:20px;min-height:80px;display:flex;align-items:center;justify-content:center}#st{font-size:1rem;line-height:1.6;color:#38291F;font-weight:600;transition:opacity .25s}</style></head><body><div class="card"><h1>Story Generator</h1><p class="sub">Click the button for a random adventure!</p><button onclick="gen()">Generate Story</button><div class="sb"><p id="st">Press the button to begin your story...</p></div></div><script>const H=['A brave knight','A clever fox','A tiny robot','A singing explorer','A fearless pirate'];const P=['in a magical forest','on the moon','in a giant pizza shop','underwater','in a flying castle'];const M=['found the golden trophy','baked the world\'s best pie','defeated the robot king','discovered a hidden map','made everyone laugh'];function gen(){const s=document.getElementById('st');s.style.opacity=0;setTimeout(()=>{s.textContent=H[~~(Math.random()*H.length)]+' went '+P[~~(Math.random()*P.length)]+' and '+M[~~(Math.random()*M.length)]+'!';s.style.opacity=1;},220);}<\/script></body></html>`,
};

const EDIT_STEPS = [
  'Reading your instruction',
  'Updating the code',
  'Keeping everything intact',
  'Almost done',
];

const EASY_EDIT_IDEAS = {
  game: [
    { icon: '🎨', label: 'Change the colors', instruction: 'Change the game to bright rainbow colors.' },
    { icon: '⭐', label: 'Add a power-up', instruction: 'Add a fun star power-up that helps the player.' },
    { icon: '🏆', label: 'Add a win screen', instruction: 'Add a colorful celebration screen when the player wins.' },
  ],
  website: [
    { icon: '🎨', label: 'Change the colors', instruction: 'Change the website to bright rainbow colors.' },
    { icon: '🖼️', label: 'Add a picture spot', instruction: 'Add a big friendly picture section near the top.' },
    { icon: '✨', label: 'Make buttons move', instruction: 'Add a fun bounce animation when buttons are pressed.' },
  ],
  default: [
    { icon: '🎨', label: 'Change the colors', instruction: 'Change the project to bright rainbow colors.' },
    { icon: '🔤', label: 'Make words bigger', instruction: 'Make the important words bigger and easier to read.' },
    { icon: '✨', label: 'Add movement', instruction: 'Add a fun gentle animation to the main button.' },
  ],
};

function getEasyEditIdeas(type) {
  return /game|quiz|clicker|runner|memory|reaction|soccer/.test(type || '')
    ? EASY_EDIT_IDEAS.game
    : /website|portfolio|restaurant|shop|sports|blog|landing/.test(type || '')
      ? EASY_EDIT_IDEAS.website
      : EASY_EDIT_IDEAS.default;
}

function friendlyWait(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  if (safeSeconds < 60) return `${safeSeconds} second${safeSeconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(safeSeconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

// GUIDE_LEVELS and learnerGuideLevel now live in utils/guideLevel.js, so the
// lesson pages read the same setting this panel writes.

// Bridge script injected into the iframe for live element editing via postMessage
const EDITOR_BRIDGE = `(function(){if(window.self===window.top)return;var em=false,sel=null,hov=null;function eid(el){if(!el.id)el.id='ce-'+Math.random().toString(36).slice(2,8);return el.id;}function isEl(el){return el&&el!==document.body&&el!==document.documentElement&&el.nodeType===1;}function clrHov(){if(hov){hov.style.outline='';hov.style.outlineOffset='';hov=null;}}function onOver(e){clrHov();if(!em||!isEl(e.target))return;hov=e.target;hov.style.outline='2.5px solid #FF7A00';hov.style.outlineOffset='2px';}function onClk(e){if(!em)return;e.preventDefault();e.stopPropagation();if(noClick){noClick=false;return;}var el=e.target;if(!isEl(el))return;if(sel&&sel!==el){sel.style.outline='';}sel=el;sel.style.outline='2.5px solid #A855F7';var r=el.getBoundingClientRect();var cs=window.getComputedStyle(el);var t=el.tagName.toLowerCase();window.parent.postMessage({type:'CODEIT_SELECTED',id:eid(el),tag:t,text:el.textContent.slice(0,300),rect:{top:r.top+window.scrollY,left:r.left,w:r.width,h:r.height},styles:{color:cs.color,bg:cs.backgroundColor,fs:cs.fontSize,fw:cs.fontWeight,br:cs.borderRadius,anim:cs.animationName,pt:cs.paddingTop,pb:cs.paddingBottom,pl:cs.paddingLeft,pr:cs.paddingRight},isText:['p','h1','h2','h3','h4','h5','h6','span','li','a','label','td','th','button'].includes(t),isBtn:['button','a'].includes(t),isImg:t==='img'},'*');}function sync(){setTimeout(function(){window.parent.postMessage({type:'CODEIT_SYNC',html:serialize()},'*');},80);}var dEl=null,dSX=0,dSY=0,dBX=0,dBY=0,dMoved=false,noClick=false;function baseXY(el){var m=/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(el.style.transform||'');return m?[parseFloat(m[1]),parseFloat(m[2])]:[0,0];}function clearOutlines(){var o=[];if(sel){o.push([sel,sel.style.outline]);sel.style.outline='';}if(hov){o.push([hov,hov.style.outline]);hov.style.outline='';}return o;}function restoreOutlines(o){o.forEach(function(p){p[0].style.outline=p[1];});}function serialize(){var o=clearOutlines();var h=document.documentElement.outerHTML;restoreOutlines(o);return h;}function onDown(e){if(!em||!isEl(e.target))return;dEl=e.target;dMoved=false;dSX=e.clientX;dSY=e.clientY;var b=baseXY(dEl);dBX=b[0];dBY=b[1];}function onMove(e){if(!dEl)return;var dx=e.clientX-dSX,dy=e.clientY-dSY;if(!dMoved&&Math.abs(dx)<4&&Math.abs(dy)<4)return;dMoved=true;e.preventDefault();dEl.style.transform='translate('+(dBX+dx)+'px, '+(dBY+dy)+'px)';}function onUp(){if(!dEl)return;var moved=dMoved,el=dEl;dEl=null;dMoved=false;if(!moved)return;noClick=true;el.style.cursor='';window.parent.postMessage({type:'CODEIT_MOVED',html:serialize()},'*');}var played=false;function markPlayed(){if(em||played)return;played=true;window.parent.postMessage({type:'CODEIT_PLAYED'},'*');}document.addEventListener('click',markPlayed,true);document.addEventListener('keydown',markPlayed,true);document.addEventListener('touchstart',markPlayed,true);window.addEventListener('message',function(e){if(e.source!==window.parent||!e.data||e.data.type!=='CODEIT_CMD')return;var d=e.data,p=d.payload||{};if(d.cmd==='ENABLE'){em=true;document.body.style.cursor='move';document.addEventListener('mouseover',onOver,true);document.addEventListener('click',onClk,true);document.addEventListener('pointerdown',onDown,true);document.addEventListener('pointermove',onMove,true);document.addEventListener('pointerup',onUp,true);document.addEventListener('pointercancel',onUp,true);}if(d.cmd==='DISABLE'){em=false;document.body.style.cursor='';clrHov();if(sel){sel.style.outline='';sel=null;}document.removeEventListener('mouseover',onOver,true);document.removeEventListener('click',onClk,true);document.removeEventListener('pointerdown',onDown,true);document.removeEventListener('pointermove',onMove,true);document.removeEventListener('pointerup',onUp,true);document.removeEventListener('pointercancel',onUp,true);window.parent.postMessage({type:'CODEIT_HTML',html:serialize()},'*');}if(d.cmd==='SET_TEXT'){var el=document.getElementById(p.id)||(sel);if(el){el.textContent=p.v;}sync();}if(d.cmd==='SET_STYLE'){var el=document.getElementById(p.id)||(sel);if(el)Object.assign(el.style,p.styles);sync();}if(d.cmd==='SET_PATCH'){var el=document.getElementById(p.id);if(el){var tmp=document.createElement('div');tmp.innerHTML=p.html;var newEl=tmp.firstElementChild||tmp;el.replaceWith(newEl);}sync();}if(d.cmd==='DELETE'){var el=document.getElementById(p.id)||sel;if(el&&el!==document.body){if(el===sel)sel=null;el.remove();}sync();}if(d.cmd==='DUPLICATE'){var el=document.getElementById(p.id)||sel;if(el&&el.parentNode){var c=el.cloneNode(true);c.removeAttribute('id');var kids=c.querySelectorAll('[id]');for(var i=0;i<kids.length;i++){kids[i].removeAttribute('id');}c.style.outline='';var b=baseXY(el);c.style.transform='translate('+(b[0]+16)+'px, '+(b[1]+16)+'px)';el.parentNode.insertBefore(c,el.nextSibling);}sync();}if(d.cmd==='RESIZE'){var el=document.getElementById(p.id)||sel;if(el){var cs=window.getComputedStyle(el);var fs=parseFloat(cs.fontSize)||16;var next=Math.max(8,Math.min(160,fs*(p.factor||1)));el.style.fontSize=next+'px';var w=parseFloat(el.style.width);if(!isNaN(w)){el.style.width=Math.max(16,w*(p.factor||1))+'px';}var h=parseFloat(el.style.height);if(!isNaN(h)){el.style.height=Math.max(16,h*(p.factor||1))+'px';}}sync();}if(d.cmd==='GET_HTML'){window.parent.postMessage({type:'CODEIT_HTML',html:serialize()},'*');}if(d.cmd==='DESELECT'){if(sel){sel.style.outline='';sel=null;}}if(d.cmd==='SET_ROOT_VARS'){var sv=document.getElementById('__ci_vars');if(!sv){sv=document.createElement('style');sv.id='__ci_vars';document.head.appendChild(sv);}var css=':root{';Object.keys(p.vars||{}).forEach(function(k){css+=k+':'+p.vars[k]+';';});css+='}';sv.textContent=css;}if(d.cmd==='RUN_SCRIPT'){try{(new Function(p.js||''))();}catch(e){}}});window.parent.postMessage({type:'CODEIT_READY'},'*');})();`;

const CONFETTI_COLORS = ['#FF7A00', '#A855F7', '#10B981', '#60A5FA', '#F59E0B'];

function isValidHtml(str) {
  return (
    typeof str === 'string' &&
    str.trim().length > 200 &&
    /<[a-z]/i.test(str) &&
    /<body/i.test(str) &&
    /<style/i.test(str)
  );
}

function deriveProjectName(rawPrompt) {
  const clean = rawPrompt.trim().replace(/^(build |make |create |generate |a |an |the )+/gi, '');
  const words = clean.split(/\s+/).slice(0, 6);
  if (!words.length) return rawPrompt;
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '');
}

function extractColors(html) {
  const primary = html.match(/--primary:\s*(#[\da-fA-F]{3,8})/)?.[1] || '#FF7A00';
  const accent  = html.match(/--accent:\s*(#[\da-fA-F]{3,8})/)?.[1]  || '#A855F7';
  return { primary, accent };
}

function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 5)     return 'just now';
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return Math.floor(s / 86400) === 1 ? 'Yesterday' : `${Math.floor(s / 86400)}d ago`;
}

function injectBridge(html) {
  if (!html || html.includes('__codeit_bridge__')) return html;
  const tag = `<script id="__codeit_bridge__">${EDITOR_BRIDGE}<\/script>`;
  return html.includes('</body>') ? html.replace('</body>', tag + '</body>') : html + tag;
}

/**
 * Everything the preview needs wrapped around the child's own code.
 *
 * The storage shim has to go first — a game reads its high score on the line it
 * starts on, and the editor bridge does not run until something is clicked.
 */
function preparePreview(html, seed) {
  return injectBridge(injectPreviewStorage(html, seed));
}

function rgbToHex(rgb) {
  if (!rgb) return '#000000';
  if (rgb.startsWith('#')) return rgb;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#000000';
  return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
}

export default function Builder() {
  useSEO({
    title:       'Coding Project Builder for Kids | Websites, Games & Quizzes | CodeIt',
    description: 'Turn an idea into a working website, game, or quiz, then edit the design and real code in your browser. Beginner-friendly and free to try.',
    canonical:   '/builder',
  });

  const { user, token } = useContext(AuthContext);
  const { awardXP }     = useCharacter();
  const navigate        = useNavigate();
  const location        = useLocation();
  const isNewAccountWelcome = Boolean(user)
    && new URLSearchParams(location.search || '').get('welcome') === '1';

  useEffect(() => {
    if (!isNewAccountWelcome || !token) return;
    const accountKey = user?.id || user?.userId || 'account';
    const storageKey = `codeit_new_account_studio_${accountKey}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, '1');
    void trackEvent('new_account_studio_view', null, token);
  }, [isNewAccountWelcome, token, user?.id, user?.userId]);

  // ── Build state ────────────────────────────────────────────────────────────
  const [prompt, setPrompt]             = useState('');
  const [builtPrompt, setBuiltPrompt]   = useState('');
  const [code, setCode]                 = useState('');
  const [builtSummary, setBuiltSummary] = useState('');
  const [aiTitle, setAiTitle]           = useState('');
  const [projectType, setProjectType]   = useState('website');
  const [conceptsUsed, setConceptsUsed] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [buildStep, setBuildStep]       = useState(0);
  const [error, setError]               = useState('');
  const [buildKey, setBuildKey]         = useState(0);
  const [hasPersonalized, setHasPersonalized] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [hasTestedLatest, setHasTestedLatest] = useState(false);
  const [guestDraftRecovered, setGuestDraftRecovered] = useState(false);
  const [guideLevelOverride, setGuideLevelOverride] = useState(storedGuideLevelOverride);
  const [coachOpen, setCoachOpen] = useState(() => learnerGuideLevel(user) !== 'independent');

  // ── AI memory ──────────────────────────────────────────────────────────────
  const [promptHistory, setPromptHistory] = useState([]);
  const [previousCode, setPreviousCode]   = useState('');

  // Undo for edits made by hand. The AI-edit undo above keeps one snapshot;
  // this keeps a stack, because a child dragging things around makes many small
  // changes in a row and expects to be able to walk back through them.
  const [editHistory, setEditHistory] = useState(EMPTY_HISTORY);

  // Which page of the studio is showing. Karam, a real child using it, asked
  // for pages because sixteen panels stacked down one phone screen is a wall.
  const [workspaceTab, setWorkspaceTab] = useState(initialTab);

  /** Is this panel on the page the child is looking at? */
  const onTab = (id) => workspaceTab === id;
  const codeRef = useRef('');

  // ── Play mode ──────────────────────────────────────────────────────────────
  const [isPlayMode, setIsPlayMode] = useState(false);

  // ── Loading preview ────────────────────────────────────────────────────────
  const [loadingPreviewType, setLoadingPreviewType] = useState('');

  // ── Edit-with-AI panel ─────────────────────────────────────────────────────
  const [showEditPanel, setShowEditPanel]     = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [editing, setEditing]                 = useState(false);
  const [editStep, setEditStep]               = useState(0);
  const [editError, setEditError]             = useState('');
  const [editRetrySeconds, setEditRetrySeconds] = useState(0);

  // ── Explain ────────────────────────────────────────────────────────────────
  const [explanation, setExplanation]   = useState('');
  const [explaining, setExplaining]     = useState(false);
  const [explainError, setExplainError] = useState('');

  // ── Save state ─────────────────────────────────────────────────────────────
  const [isSaved, setIsSaved]               = useState(false);
  const [saveStatus, setSaveStatus]         = useState(null);
  const [saveError, setSaveError]           = useState('');
  const [unsavedWarning, setUnsavedWarning] = useState(false);
  const [resumeAction, setResumeAction]     = useState(null);

  // ── Saved projects ─────────────────────────────────────────────────────────
  const [savedProjects, setSavedProjects]     = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectCardAction, setProjectCardAction] = useState({ id: null, status: null });

  const [projectOpeningId, setProjectOpeningId] = useState(null);
  const [projectOpenError, setProjectOpenError] = useState('');
  // ── Version history ────────────────────────────────────────────────────────
  const [localVersions, setLocalVersions]       = useState([]);   // in-session snapshots
  const [serverVersions, setServerVersions]     = useState([]);   // from DB
  const [showHistory, setShowHistory]           = useState(false);
  const [historyLoading, setHistoryLoading]     = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(false);
  const [savedProjectId, setSavedProjectId]     = useState(null);
  const [activeVersionId, setActiveVersionId]   = useState(null);

  const promptRef  = useRef(null);
  const editRef    = useRef(null);
  const iframeRef  = useRef(null);

  // Which project's saved data the preview should be given.
  //
  // A ref, not state, because it is read by the message handler below and
  // baked into the iframe's srcDoc — making it reactive would reload the frame
  // every time a game saved its score, resetting the game the instant a child
  // beat their record.
  const previewKeyRef = useRef('draft');
  const editModeOnRef = useRef(false);
  const studioRef  = useRef(null);
  const resumeActionStartedRef = useRef(false);
  const queryProjectOpenedRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const personalizationTrackedRef = useRef(false);
  const skipNextGuestDraftPersistRef = useRef(false);

  // ── Live element editor ────────────────────────────────────────────────────
  const [editModeOn, setEditModeOn]     = useState(false);
  const [selectedEl, setSelectedEl]     = useState(null);
  const [showElPanel, setShowElPanel]   = useState(false);
  const [elPanelTab, setElPanelTab]     = useState('text');
  const [elText, setElText]             = useState('');
  const [elColor, setElColor]           = useState('');
  const [elBgColor, setElBgColor]       = useState('');
  const [elPadding, setElPadding]       = useState('0');
  const [elAnim, setElAnim]             = useState('');
  const [aiRefineText, setAiRefineText] = useState('');
  const [patchLoading, setPatchLoading] = useState(false);
  const [patchError, setPatchError]     = useState('');

  // ── Studio state ───────────────────────────────────────────────────────────
  const [studioPanel, setStudioPanel] = useState(null);
  const [deviceView, setDeviceView]   = useState('desktop');
  const [projectDesc, setProjectDesc] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [xpPopup, setXpPopup]         = useState(null);
  const [gameSpeed, setGameSpeed]     = useState(3);
  const [gameDiff, setGameDiff]       = useState('medium');
  const [gameTimer, setGameTimer]     = useState(30);

  // ── Instant color editing ──────────────────────────────────────────────────
  const [customBg, setCustomBg]           = useState('#FFF6ED');
  const [customPrimary, setCustomPrimary] = useState('#FF7A00');
  const [customAccent, setCustomAccent]   = useState('#A855F7');
  const [customText, setCustomText]       = useState('#38291F');

  // ── Instant customization (no AI, no network) ──────────────────────────────
  const [instantPrefs, setInstantPrefs] = useState(DEFAULT_PREFS);
  const [titleDraft, setTitleDraft]     = useState('');
  const [instantNotice, setInstantNotice] = useState('');

  // ── Creator missions ───────────────────────────────────────────────────────
  const [missions, setMissions]           = useState([]);
  const [missionActive, setMissionActive] = useState(null);

  // ── AI Companion ───────────────────────────────────────────────────────────
  const [companionTip, setCompanionTip]       = useState('');
  const [companionVisible, setCompanionVisible] = useState(false);

  // ── Wow moment ─────────────────────────────────────────────────────────────
  const [showWow, setShowWow] = useState(false);
  const [wowType, setWowType] = useState('');
  const wowShownRef           = useRef(false);

  // ── Public sharing ────────────────────────────────────────────────────────
  const [isPublished, setIsPublished]     = useState(false);
  const [publicId, setPublicId]           = useState(null);
  const [publishStatus, setPublishStatus] = useState(null); // null | 'publishing' | 'copied' | 'error'

  // ── My Creations — sort + favorites ───────────────────────────────────────
  const [projectSort, setProjectSort]   = useState('recent');
  const [shareStatus, setShareStatus]   = useState(null); // null | 'copied' | 'shared'
  const [favoriteIds, setFavoriteIds]   = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('codeit_fav_projects') || '[]')); }
    catch { return new Set(); }
  });

  function popXp(amount, reason) {
    const id = Date.now();
    setXpPopup({ amount, reason: reason || null, id });
    setTimeout(() => setXpPopup(v => v?.id === id ? null : v), 2600);
  }

  function trackPersonalizationOnce() {
    setHasPersonalized(true);
    setHasTestedLatest(false);
    // A changed project must be opened again before it can pass the quality
    // check. Leaving play mode makes that next action unambiguous.
    setIsPlayMode(false);
    if (personalizationTrackedRef.current) return;
    personalizationTrackedRef.current = true;
    void trackEvent('project_personalize', null, token);
  }

  function handleTogglePlay() {
    setIsPlayMode(current => {
      const opening = !current;
      if (opening) {
        setHasPlayedOnce(true);
        setHasTestedLatest(true);
      }
      return opening;
    });
  }

  function changeGuideLevel(level) {
    if (!GUIDE_LEVELS.some(option => option.id === level)) return;
    storeGuideLevelOverride(level);
    setGuideLevelOverride(level);
    setCoachOpen(level !== 'independent');
  }

  function showCoachTarget() {
    const target = document.querySelector('[data-codeit-coach="current"]');
    target?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    target?.focus?.({ preventScroll: true });
  }

  function readCoach(text) {
    if (!text || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') return;
    window.speechSynthesis.cancel();
    const message = new window.SpeechSynthesisUtterance(text);
    message.rate = 0.82;
    message.pitch = 1.08;
    window.speechSynthesis.speak(message);
  }

  function applyColorsInstant(vars) {
    sendBridgeCmd('SET_ROOT_VARS', { vars });
  }

  function bakeColorsIntoCode(vars) {
    let updated = code;
    // Patch each var in existing :root blocks
    Object.entries(vars).forEach(([k, v]) => {
      const escaped = k.replace(/-/g, '\\-');
      updated = updated.replace(new RegExp(`(${escaped}\\s*:\\s*)[^;]+`, 'g'), `$1${v}`);
    });
    // Append an override block so new vars always win (last :root wins in CSS cascade)
    const overrideBlock = `/* codeit-color-override */ :root { ${Object.entries(vars).map(([k, v]) => `${k}: ${v}`).join('; ')} }`;
    if (updated.includes('/* codeit-color-override */')) {
      updated = updated.replace(/\/\* codeit-color-override \*\/ :root \{[^}]*\}/, overrideBlock);
    } else {
      updated = updated.replace(/<\/style>(?![\s\S]*<\/style>)/, `${overrideBlock}\n</style>`);
    }
    return updated;
  }

  function handleApplyColors(vars) {
    if (!code) return;
    const newCode = bakeColorsIntoCode(vars);
    setCode(newCode);
    setIsSaved(false);
    setSaveStatus(null);
    pushLocalVersion('Color change', newCode, promptHistory, aiTitle);
    trackPersonalizationOnce();
  }

  // ── Instant customization ──────────────────────────────────────────────────
  // Rewrites the project's own HTML in the browser. No AI call, so this keeps
  // working when generation is unavailable, and lands in well under a second.

  function commitInstantChange(nextCode, versionLabel, noticeText) {
    setCode(nextCode);
    setIsSaved(false);
    setSaveStatus(null);
    pushLocalVersion(versionLabel, nextCode, promptHistory, aiTitle);
    trackPersonalizationOnce();
    setInstantNotice(noticeText);
  }

  function applyInstantChange(change, versionLabel, noticeText) {
    if (!code) return;
    const merged = { ...instantPrefs, ...change };
    setInstantPrefs(merged);
    const nextCode = bakeInstantStyle(code, buildInstantCss(merged));
    if (nextCode === code) return;
    commitInstantChange(nextCode, versionLabel, noticeText);
    popXp(10, 'Made it yours');
  }

  function openInstantPanel() {
    setStudioPanel('mine');
    // The panel is below the preview on phones; bring it into view so "Show me"
    // and the next-step coach point at something the student can actually see.
    setTimeout(() => {
      studioRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function handleRenameProject() {
    const nextTitle = titleDraft.trim();
    if (!code || !nextTitle) return;
    const nextCode = setProjectHeading(code, nextTitle);
    setAiTitle(nextTitle);
    if (nextCode === code) return;
    commitInstantChange(nextCode, `Renamed: ${nextTitle.slice(0, 40)}`, `Your project is now called "${nextTitle}".`);
    popXp(10, 'Named it');
  }

  // Inject JS + CSS into iframe instantly — NO reload, NO AI call
  function applyGameTweakInstant(speed, timer) {
    const spawnDelays = [1300, 950, 680, 460, 290];
    const speeds      = [1.8, 3, 4.5, 6, 9];
    const sd  = spawnDelays[speed - 1] ?? 680;
    const spd = speeds[speed - 1] ?? 4.5;

    const js = `(function(){
      if(typeof spawnDelay!=='undefined')spawnDelay=${sd};
      if(typeof speed!=='undefined')speed=${spd};
      if(typeof gameSpeed!=='undefined')gameSpeed=${spd};
      var s=document.getElementById('__ci_speed');
      if(!s){s=document.createElement('style');s.id='__ci_speed';document.head.appendChild(s);}
      s.textContent=':root{--game-speed:${spd}}@keyframes bldr-game-speed-noop{}';
      ${timer ? `if(typeof timeLeft!=='undefined'&&timeLeft>0){
        timeLeft=Math.min(timeLeft,${timer});
        var td=document.getElementById('timer-display')||document.querySelector('[id*=timer]');
        if(td)td.textContent=timeLeft;
      }` : ''}
    })();`;
    sendBridgeCmd('RUN_SCRIPT', { js });
  }

  // Run a mission: applyEdit + mission XP
  async function handleMissionClick(mission) {
    if (editing || missionActive) return;
    setMissionActive(mission);
    try {
      await applyEdit(
        `MISSION UPGRADE: ${mission}. ` +
        `Implement this fully — add real working JavaScript logic, not a placeholder. ` +
        `Preserve all existing gameplay, scoring, and visual style exactly. ` +
        `The new feature must integrate seamlessly with the current code.`
      );
      setTimeout(() => popXp(10, 'Mission Complete!'), 350);
    } finally {
      setMissionActive(null);
    }
  }

  // ── Version history functions ──────────────────────────────────────────────
  function pushLocalVersion(label, htmlCode, historyArr, titleStr) {
    if (!htmlCode) return;
    const { primary, accent } = extractColors(htmlCode);
    const id = `local-${Date.now()}`;
    setLocalVersions(prev => [{
      id, label,
      title:         titleStr || '',
      code:          htmlCode,
      promptHistory: [...(historyArr || [])],
      primary, accent,
      createdAt:     new Date().toISOString(),
      isLocal:       true,
    }, ...prev].slice(0, 20));
    setActiveVersionId(id);
  }

  async function fetchServerVersions(projectId) {
    if (!projectId || !token) return;
    setHistoryLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/projects/${projectId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setServerVersions(data.versions.map(v => ({
          id:        `server-${v.id}`,
          serverId:  v.id,
          label:     v.label || 'Saved',
          title:     v.title || '',
          primary:   v.primary_color || '#FF7A00',
          accent:    v.accent_color  || '#A855F7',
          createdAt: v.created_at,
          isLocal:   false,
        })));
      }
    } catch (_) {}
    finally { setHistoryLoading(false); }
  }

  async function saveVersionToServer(label) {
    if (!savedProjectId || !token || !code) return;
    const title = aiTitle || deriveProjectName(builtPrompt || '') || 'Untitled';
    try {
      await fetch(`${API_BASE_URL}/api/builder/projects/${savedProjectId}/versions`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ generated_code: code, title, label: label || 'Manual save', prompt_history: promptHistory }),
      });
      await fetchServerVersions(savedProjectId);
    } catch (_) {}
  }

  async function restoreVersion(version) {
    if (restoringVersion) return;
    setRestoringVersion(true);
    try {
      if (version.isLocal) {
        setCode(version.code);
        setAiTitle(version.title || '');
        setPromptHistory(version.promptHistory || []);
        setIsSaved(false);
        setSaveStatus(null);
        setActiveVersionId(version.id);
      } else {
        const res  = await fetch(
          `${API_BASE_URL}/api/builder/projects/${savedProjectId}/versions/${version.serverId}/restore`,
          { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Restore failed');
        const restored = data.code;
        const { primary, accent } = extractColors(restored);
        const localId = `local-${Date.now()}`;
        setLocalVersions(prev => [{
          id:            localId,
          label:         version.label,
          title:         data.title || version.title || '',
          code:          restored,
          promptHistory: (() => { try { return JSON.parse(data.prompt_history || '[]'); } catch { return []; } })(),
          primary, accent,
          createdAt:     version.createdAt || new Date().toISOString(),
          isLocal:       true,
        }, ...prev].slice(0, 20));
        setCode(restored);
        setAiTitle(data.title || version.title || '');
        setActiveVersionId(localId);
        setIsSaved(true);
        setSaveStatus(null);
      }
      setShowHistory(false);
    } catch (err) {
      console.error('Restore failed:', err.message);
    } finally {
      setRestoringVersion(false);
    }
  }

  async function handleForkProject() {
    if (!savedProjectId || !token) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/projects/${savedProjectId}/fork`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSavedProjects(prev => [data.project, ...prev]);
    } catch (_) {}
  }

  // ── Prefill prompt from ?prompt= URL param (sent by lesson "Use in AI Builder") ─
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pre = params.get('prompt');
    if (pre) setPrompt(pre);

    // Auto-load a remixed project (redirected from /project/:publicId after remix)
    const remixId = params.get('remix');
    if (remixId && token) {
      fetch(`${API_BASE_URL}/api/builder/projects/${remixId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          if (!data.success) return;
          const p = data.project;
          setPrompt(p.prompt || '');
          setCode(p.generated_code);
          setBuiltPrompt(p.prompt || '');
          setProjectType(p.project_type || 'website');
          setAiTitle(p.title || '');
          setPromptHistory([p.prompt || '']);
          personalizationTrackedRef.current = true;
          setIsSaved(true);
          setSavedProjectId(p.id);
          setBuildKey(k => k + 1);
          setShowEditPanel(true);
        })
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Restore an account-handoff draft or a fresh device-only guest backup ───
  useEffect(() => {
    const raw = sessionStorage.getItem('codeit_builder_draft');
    if (raw) {
      try {
        const draft = JSON.parse(raw);
        if (!draft.code) return;
        setCode(draft.code);
        setPrompt(draft.prompt || '');
        setBuiltPrompt(draft.builtPrompt || '');
        setProjectType(draft.projectType || 'website');
        setAiTitle(draft.aiTitle || '');
        setBuiltSummary(draft.builtSummary || '');
        setConceptsUsed(draft.conceptsUsed || []);
        setPromptHistory(draft.promptHistory || []);
        const personalized = draft.hasPersonalized === true || (draft.promptHistory || []).length > 1;
        personalizationTrackedRef.current = personalized;
        setHasPersonalized(personalized);
        const draftIsFresh = Number.isFinite(draft.savedAt) && Date.now() - draft.savedAt < 30 * 60 * 1000;
        const requestedAction = ['save', 'publish'].includes(location.state?.resumeBuilderAction)
          ? location.state.resumeBuilderAction
          : location.state?.resumeBuilderSave === true
            ? 'save'
            : null;
        // A fresh account handoff came from the final quality-check button. Keep
        // older handoff drafts working even though they predate these flags.
        const handoffCompleted = Boolean(requestedAction && draftIsFresh);
        setHasPlayedOnce(draft.hasPlayedOnce === true || handoffCompleted);
        setHasTestedLatest(draft.hasTestedLatest === true || handoffCompleted);
        setBuildKey(k => k + 1);
        setResumeAction(draftIsFresh ? requestedAction : null);
        if (!requestedAction || !draftIsFresh) {
          sessionStorage.removeItem('codeit_builder_draft');
        }
        if (requestedAction) {
          navigate('/builder', { replace: true, state: null });
        }
        return;
      } catch (_) {
        sessionStorage.removeItem('codeit_builder_draft');
      }
    }

    if (user) return;
    const draft = readGuestProjectDraft(localStorage);
    if (!draft || !isValidHtml(draft.code)) {
      if (draft) clearGuestProjectDraft(localStorage);
      return;
    }
    skipNextGuestDraftPersistRef.current = true;
    setCode(draft.code);
    setPrompt(draft.prompt || '');
    setBuiltPrompt(draft.builtPrompt || '');
    setProjectType(draft.projectType || 'website');
    setAiTitle(draft.aiTitle || '');
    setBuiltSummary(draft.builtSummary || '');
    setConceptsUsed(draft.conceptsUsed || []);
    setPromptHistory(draft.promptHistory || []);
    const personalized = draft.hasPersonalized === true || (draft.promptHistory || []).length > 1;
    personalizationTrackedRef.current = personalized;
    setHasPersonalized(personalized);
    setHasPlayedOnce(draft.hasPlayedOnce === true || personalized);
    setHasTestedLatest(draft.hasTestedLatest === true || personalized);
    setGuestDraftRecovered(true);
    setBuildKey(k => k + 1);
    void trackEvent('guest_draft_recovered');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep unsaved guest work on this device for seven days. Nothing is uploaded
  // until the creator explicitly continues into an account-backed save.
  useEffect(() => {
    if (user || !code || isSaved) return undefined;
    if (skipNextGuestDraftPersistRef.current) {
      skipNextGuestDraftPersistRef.current = false;
      return undefined;
    }
    const timer = setTimeout(() => {
      saveGuestProjectDraft(localStorage, {
        code,
        prompt,
        builtPrompt,
        projectType,
        aiTitle,
        builtSummary,
        conceptsUsed,
        promptHistory,
        hasPersonalized,
        hasPlayedOnce,
        hasTestedLatest,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [aiTitle, builtPrompt, builtSummary, code, conceptsUsed, hasPersonalized, hasPlayedOnce, hasTestedLatest, isSaved, projectType, prompt, promptHistory, user]);

  // ── Confetti (only on fresh builds, not edits) ─────────────────────────────
  const confettiParticles = useMemo(() => {
    if (buildKey === 0) return [];
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      angle: i * 20 + (i % 2 === 0 ? 7 : -7),
      dist:  48 + (i % 5) * 10,
      color: CONFETTI_COLORS[i % 5],
      delay: (i % 4) * 0.05,
      isCircle: i % 3 === 0,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildKey]);

  // ── Interactivity badges (derived from generated code) ────────────────────
  const interactivityBadges = useMemo(() => {
    if (!code) return [];
    const badges = [];
    const hasScript   = /<script/i.test(code);
    const hasListener = /addEventListener|\.onclick\s*=|\bonclick\s*=|onchange\s*=/i.test(code);
    const isGame      = /game/i.test(projectType);
    const hasGameLogic = /score|restart|start\s*game|gameActive|setInterval/i.test(code);
    if (isGame && hasScript && hasGameLogic) {
      badges.push({ label: 'Playable project', cls: 'play' });
      badges.push({ label: 'Game controls ready', cls: 'game' });
    } else if (hasScript && hasListener) {
      badges.push({ label: 'Buttons work', cls: 'buttons' });
    }
    return badges;
  }, [code, projectType]);

  // ── Loading step advancement ───────────────────────────────────────────────
  useEffect(() => {
    if (!loading) { setBuildStep(0); return; }
    setBuildStep(0);
    const timers = [900, 1900, 3100].map((delay, i) =>
      setTimeout(() => setBuildStep(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  useEffect(() => {
    if (!editing) { setEditStep(0); return; }
    setEditStep(0);
    const timers = [700, 1600, 2600].map((delay, i) =>
      setTimeout(() => setEditStep(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [editing]);

  useEffect(() => {
    if (editRetrySeconds <= 0) return undefined;
    const timer = setTimeout(() => {
      setEditRetrySeconds(seconds => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [editRetrySeconds]);

  // ── Auto-focus edit textarea when panel opens ──────────────────────────────
  useEffect(() => {
    if (showEditPanel) editRef.current?.focus();
  }, [showEditPanel]);

  // ── Extract current CSS colors when Colors panel opens ────────────────────
  useEffect(() => {
    if (studioPanel === 'colors' && code) {
      setCustomBg(code.match(/--bg:\s*(#[\da-fA-F]{3,8})/)?.[1] || '#FFF6ED');
      setCustomPrimary(code.match(/--primary:\s*(#[\da-fA-F]{3,8})/)?.[1] || '#FF7A00');
      setCustomAccent(code.match(/--accent:\s*(#[\da-fA-F]{3,8})/)?.[1] || '#A855F7');
      setCustomText(code.match(/--text:\s*(#[\da-fA-F]{3,8})/)?.[1] || '#38291F');
    }
    if (studioPanel === 'mine' && code) {
      // Read the choices back out of the project so reopening the panel — or
      // loading a saved project — shows what the student actually picked.
      setInstantPrefs(readInstantPrefs(code));
      setTitleDraft(readProjectHeading(code));
      setInstantNotice('');
    }
  }, [studioPanel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Companion tip rotation ─────────────────────────────────────────────────
  useEffect(() => {
    if (!companionVisible) return;
    const t = (projectType || '').toLowerCase();
    const pool =
      /quiz/.test(t)                                                         ? COMPANION_TIPS.quiz :
      /game|clicker|runner|memory|reaction|soccer/.test(t)                   ? COMPANION_TIPS.game :
      /website|portfolio|restaurant|shop|sports|blog|landing/.test(t)        ? COMPANION_TIPS.website :
      /tool|calculator|timer|drawing|flashcard/.test(t)                      ? COMPANION_TIPS.tool :
      COMPANION_TIPS.default;

    let idx = Math.floor(Math.random() * pool.length);
    setCompanionTip(pool[idx]);
    const id = setInterval(() => {
      idx = (idx + 1) % pool.length;
      setCompanionTip(pool[idx]);
    }, 15000);
    return () => clearInterval(id);
  }, [companionVisible, projectType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load saved projects when user logs in ──────────────────────────────────
  useEffect(() => {
    if (!user || !token) { setSavedProjects([]); return; }
    setProjectsLoading(true);
    fetch(`${API_BASE_URL}/api/builder/projects`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setSavedProjects(d.projects); })
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, [user, token]);

  useEffect(() => {
    if (projectsLoading) return undefined;
    if (new URLSearchParams(location.search).get('view') !== 'projects') return undefined;
    const timer = setTimeout(() => {
      document.getElementById('my-creations')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => clearTimeout(timer);
  }, [location.search, projectsLoading, savedProjects.length]);

  useEffect(() => { codeRef.current = code; }, [code]);

  /** Record the page as it is now, so the next hand edit can be undone. */
  const recordHandEdit = (label) => {
    setEditHistory(prev => rememberEdit(prev, codeRef.current, label));
  };

  const undoHandEdit = () => {
    const result = historyUndo(editHistory, codeRef.current);
    if (result.html === null) return;
    setEditHistory(result.history);
    setCode(result.html);
    setIsSaved(false);
    setSaveStatus(null);
  };

  const redoHandEdit = () => {
    const result = historyRedo(editHistory, codeRef.current);
    if (result.html === null) return;
    setEditHistory(result.history);
    setCode(result.html);
    setIsSaved(false);
    setSaveStatus(null);
  };

  /** One selected element, one verb. Each is undoable like any other edit. */
  const elementAction = (cmd, label, payload = {}) => {
    if (!selectedEl) return;
    recordHandEdit(label);
    sendBridgeCmd(cmd, { id: selectedEl.id, ...payload });
    if (cmd === 'DELETE') { setShowElPanel(false); setSelectedEl(null); }
    trackPersonalizationOnce();
  };

  // ── Live element editor — postMessage bridge ───────────────────────────────
  useEffect(() => {
    function handleIframeMessage(e) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const d = e.data;
      if (!d || typeof d.type !== 'string') return;
      if (d.type === 'CODEIT_SELECTED') {
        setSelectedEl(d);
        setElText(d.text || '');
        setElColor(d.styles?.color || '');
        setElBgColor(d.styles?.bg || '');
        setElPadding(parseInt(d.styles?.pt) || 0);
        setElAnim(d.styles?.anim && d.styles.anim !== 'none' ? d.styles.anim : '');
        setElPanelTab(d.isText ? 'text' : 'colors');
        setPatchError('');
        setShowElPanel(true);
      }
      if (d.type === 'CODEIT_HTML') {
        // stripPreviewScripts, here and below: the frame serialises the whole
        // live document, which contains the editor bridge and the storage shim
        // we injected. Saving that would grow the project on every edit and
        // ship one child's high score to everyone who plays their game.
        setCode(stripPreviewScripts(d.html));
        setIsSaved(false);
      }
      if (d.type === 'CODEIT_SYNC') {
        // Text, colour, delete, duplicate and resize all end here. Until now
        // this message was ignored, so those edits only reached the code when
        // the student happened to leave edit mode — and a child who deleted
        // something and pressed Save straight away lost the deletion.
        setCode(stripPreviewScripts(d.html));
        setIsSaved(false);
        setSaveStatus(null);
      }
      if (d.type === 'CODEIT_MOVED') {
        // Snapshot before the move lands, so "Undo" puts it back where it was.
        setEditHistory(prev => rememberEdit(prev, codeRef.current, 'Moved it'));
        // A drag is a real edit, so it lands in the code straight away and
        // counts towards the save gate. Baking it in reloads the iframe, which
        // is why CODEIT_READY re-enables edit mode below — otherwise moving one
        // thing would silently kick the student out of the editor.
        setCode(stripPreviewScripts(d.html));
        setIsSaved(false);
        setSaveStatus(null);
        trackPersonalizationOnce();
        popXp(10, 'Moved it');
      }
      if (d.type === 'CODEIT_READY' && editModeOnRef.current) {
        sendBridgeCmd('ENABLE');
      }
      if (isStorageMessage(d)) {
        // The preview saved something — a high score, a level, a name. It runs
        // on an opaque origin with no storage of its own, so we keep it here,
        // scoped to this one project.
        savePreviewStorage(previewKeyRef.current, d.data);
        return;
      }
      if (d.type === 'CODEIT_PLAYED') {
        // Students naturally test by using the buttons inside their game or
        // website—not by finding a separate CodeIt control.
        setHasPlayedOnce(true);
        setHasTestedLatest(true);
      }
    }
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function sendBridgeCmd(cmd, payload = {}) {
    iframeRef.current?.contentWindow?.postMessage({ type: 'CODEIT_CMD', cmd, payload }, '*');
  }

  function toggleEditMode() {
    const next = !editModeOn;
    editModeOnRef.current = next;
    setEditModeOn(next);
    if (!next) {
      setSelectedEl(null);
      setShowElPanel(false);
      setPatchError('');
      sendBridgeCmd('DISABLE');
    } else {
      setShowEditPanel(false);
      setShowHistory(false);
      sendBridgeCmd('ENABLE');
    }
  }

  function applyElTextChange() {
    if (!selectedEl) return;
    recordHandEdit('Changed the words');
    sendBridgeCmd('SET_TEXT', { id: selectedEl.id, v: elText });
    trackPersonalizationOnce();
  }

  function applyElStyleChange(styles) {
    if (!selectedEl) return;
    recordHandEdit('Changed how it looks');
    sendBridgeCmd('SET_STYLE', { id: selectedEl.id, styles });
    trackPersonalizationOnce();
  }

  async function handleAiRefine() {
    if (!selectedEl || !aiRefineText.trim()) return;
    setPatchLoading(true);
    setPatchError('');
    try {
      const elementHtml = `<${selectedEl.tag} id="${selectedEl.id}">${selectedEl.text}</${selectedEl.tag}>`;
      const res  = await fetch(`${API_BASE_URL}/api/builder/patch`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          elementId:   selectedEl.id,
          tag:         selectedEl.tag,
          elementHtml,
          instruction: aiRefineText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI patch failed');
      sendBridgeCmd('SET_PATCH', { id: selectedEl.id, html: data.patchedHtml });
      setAiRefineText('');
      trackPersonalizationOnce();
    } catch (err) {
      setPatchError(err.message);
    } finally {
      setPatchLoading(false);
    }
  }

  // ── Fresh build ────────────────────────────────────────────────────────────
  const callBuilder = async (text) => {
    personalizationTrackedRef.current = false;
    setHasPersonalized(false);
    setHasPlayedOnce(false);
    setHasTestedLatest(false);
    setCoachOpen(true);
    setGuestDraftRecovered(false);
    const previewType = detectProjectType(text);
    setLoadingPreviewType(previewType);
    setLoading(true);
    setError('');
    setCode('');
    setBuiltSummary('');
    setAiTitle('');
    setProjectType('website');
    setConceptsUsed([]);
    setExplanation('');
    setIsSaved(false);
    setSaveStatus(null);
    setUnsavedWarning(false);
    setPromptHistory([]);
    setPreviousCode('');
    setEditHistory(clearHistory());
    setWorkspaceTab(prev => tabAfter('built', prev));
    setShowEditPanel(false);
    setEditError('');
    const buildController = new AbortController();
    const buildTimeout = setTimeout(() => buildController.abort(), 120000);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder`, {
        method:  'POST',
        signal:  buildController.signal,
        headers: {
          'Content-Type': 'application/json',
          ...journeyHeaders(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body:    JSON.stringify({ prompt: text }),
      });
      clearTimeout(buildTimeout);
      const responseType = res.headers.get('content-type') || '';
      if (!responseType.includes('application/json')) {
        throw new Error('The project studio is temporarily unavailable. Please try again in a moment.');
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      const generatedHtml = data.html || data.code;
      const html = data.isFallback
        ? (STARTER_TEMPLATES[previewType] || generatedHtml)
        : generatedHtml;
      if (!isValidHtml(html)) throw new Error('The builder returned an incomplete page. Please try again.');
      setCode(html);
      setBuiltPrompt(text);
      setBuiltSummary(data.isFallback ? 'Starter ready — add your own details next' : (data.summary || ''));
      setAiTitle(data.title || '');
      setProjectType(data.type || 'website');
      setConceptsUsed(Array.isArray(data.conceptsUsed) ? data.conceptsUsed : []);
      setPromptHistory([text]);
      setBuildKey(k => k + 1);
      setShowEditPanel(false);
      const builtType = data.type || 'website';
      // Let the learner press Play themselves so the guide can teach the action.
      setIsPlayMode(false);
      // Creator missions — show static pool immediately, then upgrade with AI-generated ones
      setMissions(getMissions(builtType));
      fetchAiMissions(html, builtType, data.title || '', token).then(aiMissions => {
        if (aiMissions) setMissions(aiMissions);
      });
      // Companion
      setCompanionVisible(true);
      // Wow moment — once per session, with a short delay so the iframe renders first
      if (!wowShownRef.current) {
        wowShownRef.current = true;
        setWowType(builtType);
        setTimeout(() => {
          setShowWow(true);
          setTimeout(() => setShowWow(false), 3800);
        }, 600);
      }
      pushLocalVersion(`Build: ${text.slice(0, 50)}`, html, [text], data.title || '');
    } catch (err) {
      clearTimeout(buildTimeout);
      setError(err.name === 'AbortError' ? 'Build timed out — please try again.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Edit with AI — modifies existing code, never starts from scratch ───────
  const applyEdit = async (instruction) => {
    if (!code || !instruction.trim() || editing || editRetrySeconds > 0) return;
    setEditing(true);
    setEditError('');
    const snapshot = code; // save fallback before we touch anything
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/edit`, {
        method:  'POST',
        signal:  controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...journeyHeaders(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body:    JSON.stringify({
          currentCode:    code,
          currentTitle:   aiTitle || projectName,
          promptHistory:  promptHistory.slice(-5),
          newInstruction: instruction.trim(),
        }),
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.status === 429) {
        const headerSeconds = Number(res.headers?.get?.('retry-after'));
        setEditRetrySeconds(Number(data.retryAfterSeconds) || headerSeconds || 60);
        setEditError('AI_LIMIT');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Edit failed');
      const html = data.html || data.code;
      if (!isValidHtml(html)) throw new Error('The builder returned invalid code — your project was not changed.');
      // Only touch state after confirmed success
      setPreviousCode(snapshot);
      setCode(html);
      setBuiltSummary(data.summary || builtSummary);
      setPromptHistory(prev => [...prev, instruction.trim()]);
      setIsSaved(false);
      setSaveStatus(null);
      setEditInstruction('');
      setEditRetrySeconds(0);
      pushLocalVersion(`Edit: ${instruction.slice(0, 45)}`, html, [...promptHistory, instruction.trim()], aiTitle);
      trackPersonalizationOnce();
      // Don't rebuildKey — keeps iframe alive; srcdoc update re-renders the content
    } catch (err) {
      clearTimeout(timeoutId);
      // Code unchanged — snapshot was never committed
      const msg = err.name === 'AbortError'
        ? 'Edit timed out — your project is unchanged. Try a simpler instruction.'
        : err.message;
      setEditError(msg);
    } finally {
      setEditing(false);
    }
  };

  const handleUndoEdit = () => {
    if (!previousCode) return;
    setCode(previousCode);
    setPreviousCode('');
    setPromptHistory(prev => prev.slice(0, -1));
    setBuiltSummary('');
    setIsSaved(false);
    setSaveStatus(null);
    setEditError('');
  };

  // ── Modifiers: use edit endpoint when code exists (incremental) ───────────
  const handleModifier = (mod) => {
    if (code) {
      applyEdit(mod);
    } else {
      const updated = `${prompt.trim()} — ${mod}`;
      setPrompt(updated);
      callBuilder(updated);
    }
  };

  const handleBuild = () => {
    if (!prompt.trim()) return;
    callBuilder(prompt.trim());
  };

  const handleQuickStart = (qs) => {
    setPrompt(qs.prompt);
    callBuilder(qs.prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleBuild();
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) applyEdit(editInstruction);
  };

  const handleFullscreen = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  };

  // ── Explain ────────────────────────────────────────────────────────────────
  const handleExplain = async () => {
    if (!code) return;
    setExplaining(true);
    setExplainError('');
    setExplanation('');
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/explain`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setExplanation(data.explanation);
    } catch (err) {
      setExplainError(err.message);
    } finally {
      setExplaining(false);
    }
  };

  const continueAfterAuth = (action) => {
    try {
      sessionStorage.setItem('codeit_builder_draft', JSON.stringify({
        code, prompt, builtPrompt, projectType, aiTitle,
        builtSummary, conceptsUsed, promptHistory, hasPersonalized,
        hasPlayedOnce, hasTestedLatest, savedAt: Date.now(),
      }));
    } catch (_) {}
    void trackEvent('activation_account_gate', action, token);
    navigate(`/register?from=builder&action=${action}`, {
      state: { from: '/builder', resumeBuilderAction: action },
    });
  };

  // ── Save project ───────────────────────────────────────────────────────────
  const handleSaveProject = async () => {
    if (!code) return;
    if (!isPersonalized || !hasTestedLatest) return;
    if (!user || !token) {
      continueAfterAuth('save');
      return;
    }
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setSaveStatus('saving');
    setSaveError('');
    // Prefer the name the student chose over one derived from their prompt.
    const title = projectName || 'My Project';
    try {
      const isUpdating = Boolean(savedProjectId);
      const projectUrl = isUpdating
        ? `${API_BASE_URL}/api/builder/projects/${savedProjectId}`
        : `${API_BASE_URL}/api/builder/projects`;
      const res  = await fetch(projectUrl, {
        method:  isUpdating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...journeyHeaders() },
        body:    JSON.stringify({ title, prompt: builtPrompt, generated_code: code, project_type: projectType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save project.');
      // Older API versions returned only { success: true } for updates.
      const projectRecord = data.project || {
        ...(savedProjects.find(project => project.id === savedProjectId) || {}),
        id: savedProjectId,
        title,
        prompt: builtPrompt,
        project_type: projectType,
        updated_at: new Date().toISOString(),
      };
      setSavedProjects(prev => isUpdating
        ? prev.map(project => project.id === projectRecord.id ? projectRecord : project)
        : [projectRecord, ...prev]);
      setSavedProjectId(projectRecord.id);
      // Keep a restorable snapshot alongside the latest project state.
      const versionRes = await fetch(`${API_BASE_URL}/api/builder/projects/${projectRecord.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          generated_code: code,
          title,
          label: isUpdating ? 'Saved changes' : 'Initial save',
          prompt_history: promptHistory,
        }),
      });
      if (!versionRes.ok && isUpdating && !data.project) {
        throw new Error('Could not save your latest changes. Please try again.');
      }
      setIsSaved(true);
      setSaveStatus('saved');
      sessionStorage.removeItem('codeit_builder_draft');
      clearGuestProjectDraft(localStorage);
      const earnedXp = Number(data.xp_awarded) || 0;
      if (earnedXp > 0) {
        awardXP(earnedXp);
        popXp(earnedXp, 'Project saved');
      }
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err.message);
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      saveInFlightRef.current = false;
    }
  };

  // The save action is also a child-friendly next-step button.  A first draft
  // must be personalised and tested, but the button should never feel broken.
  const handleSaveOrGuide = () => {
    if (!isPersonalized) {
      setShowEditPanel(true);
      setTimeout(() => editRef.current?.focus(), 0);
      return;
    }
    if (!hasTestedLatest) {
      handleTogglePlay();
      return;
    }
    handleSaveProject();
  };

  // ── Load saved project ─────────────────────────────────────────────────────
  const handleLoadProject = async (project) => {
    try {
    setProjectOpeningId(project.id);
    setProjectOpenError('');
      const res  = await fetch(`${API_BASE_URL}/api/builder/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      const p = data.project;
      let latestCode = p.generated_code;
      let latestTitle = p.title || '';
      let latestPromptHistory = [p.prompt];
      try {
        const versionsRes = await fetch(`${API_BASE_URL}/api/builder/projects/${p.id}/versions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const versionsData = await versionsRes.json();
        const latestVersion = versionsData.success && versionsData.versions?.[0];
        if (latestVersion) {
          const versionRes = await fetch(
            `${API_BASE_URL}/api/builder/projects/${p.id}/versions/${latestVersion.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const versionData = await versionRes.json();
          if (versionData.success) {
            latestCode = versionData.version.generated_code || latestCode;
            latestTitle = versionData.version.title || latestTitle;
            try {
              const storedHistory = typeof versionData.version.prompt_history === 'string'
                ? JSON.parse(versionData.version.prompt_history)
                : versionData.version.prompt_history;
              if (Array.isArray(storedHistory) && storedHistory.length) latestPromptHistory = storedHistory;
            } catch (_) {}
          }
        }
      } catch (_) {}
      setPrompt(p.prompt);
      setCode(latestCode);
      setAiTitle(latestTitle);
      setBuiltPrompt(p.prompt);
      setBuiltSummary('');
      setExplanation('');
      setPromptHistory(latestPromptHistory);
      personalizationTrackedRef.current = true;
      setHasPersonalized(latestPromptHistory.length > 1);
      setHasPlayedOnce(true);
      setHasTestedLatest(true);
      setPreviousCode('');
      setEditHistory(clearHistory());
      setWorkspaceTab(prev => tabAfter('saved', prev));
      setIsSaved(true);
      setSaveStatus(null);
      setUnsavedWarning(false);
      setShowEditPanel(false);
      setEditError('');
      setBuildKey(k => k + 1);
      setSavedProjectId(p.id);
      setIsPublished(!!(p.is_public && p.public_id));
      setPublicId(p.public_id || null);
      setPublishStatus(null);
      setLocalVersions([]);
      setServerVersions([]);
      setActiveVersionId(null);
      fetchServerVersions(p.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setProjectOpenError('We could not open that project. Please check your connection and try again.');
    } finally {
      setProjectOpeningId(null);
    }
  };

  // A returning student can resume the exact project offered on the homepage.
  // The project still comes from the authenticated list, so changing the URL
  // cannot open another learner's work.
  useEffect(() => {
    if (projectsLoading || queryProjectOpenedRef.current) return;
    const requestedId = new URLSearchParams(location.search).get('project');
    if (!requestedId) return;
    const project = savedProjects.find(item => String(item.id) === requestedId);
    if (!project) return;
    queryProjectOpenedRef.current = true;
    void handleLoadProject(project);
  }, [location.search, projectsLoading, savedProjects]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delete saved project ───────────────────────────────────────────────────
  const handleDeleteProject = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/builder/projects/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedProjects(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  // ── Publish and share from My Creations ───────────────────────────────────
  // Returning creators should not have to reopen a saved project and hunt for
  // its publishing controls. The server still enforces the under-13 privacy
  // rule; managed learner profiles never receive a public action here.
  const handlePublishSavedProject = async (project) => {
    if (
      !project?.id
      || !token
      || user?.managedProfile
      || ['publishing', 'sharing'].includes(projectCardAction.status)
    ) return;
    setProjectCardAction({ id: project.id, status: 'publishing' });
    void trackEvent('activation_next_step', 'publish', token);

    try {
      const res = await fetch(`${API_BASE_URL}/api/builder/projects/${project.id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, ...journeyHeaders() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');

      const earnedXp = Number(data.xp_awarded) || 0;
      if (earnedXp > 0) {
        awardXP(earnedXp);
        popXp(earnedXp, 'Project published');
      }

      setSavedProjects(prev => prev.map(saved => (
        saved.id === project.id
          ? { ...saved, is_public: 1, public_id: data.public_id }
          : saved
      )));
      if (savedProjectId === project.id) {
        setIsPublished(true);
        setPublicId(data.public_id);
      }
      setProjectCardAction({ id: project.id, status: 'published' });
      setTimeout(() => {
        setProjectCardAction(current => (
          current.id === project.id ? { id: null, status: null } : current
        ));
      }, 2200);
    } catch (_) {
      setProjectCardAction({ id: project.id, status: 'error' });
    }
  };

  const handleShareSavedProject = async (project) => {
    if (!project?.public_id || ['publishing', 'sharing'].includes(projectCardAction.status)) return;
    const shareUrl = new URL(`/project/${project.public_id}`, window.location.origin);
    shareUrl.searchParams.set('utm_source', 'project-share');
    const url = shareUrl.toString();
    const title = project.title || 'My Project';
    const text = `I made "${title}" with CodeIt. Try it, then build your own.`;
    let completed = false;

    setProjectCardAction({ id: project.id, status: 'sharing' });
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        setProjectCardAction({ id: project.id, status: 'shared' });
        completed = true;
      } catch (error) {
        if (error?.name === 'AbortError') {
          setProjectCardAction({ id: null, status: null });
          return;
        }
      }
    }

    if (!completed) {
      try {
        await navigator.clipboard.writeText(url);
        setProjectCardAction({ id: project.id, status: 'copied' });
        completed = true;
      } catch (_) {
        setProjectCardAction({ id: project.id, status: 'error' });
      }
    }

    if (completed) {
      void trackEvent('project_share', 'creator', token);
      setTimeout(() => {
        setProjectCardAction(current => (
          current.id === project.id ? { id: null, status: null } : current
        ));
      }, 2200);
    }
  };

  // ── New build ──────────────────────────────────────────────────────────────
  const handleNewBuild = () => {
    if (code && !isSaved) { setUnsavedWarning(true); return; }
    clearEditor();
  };

  const clearEditor = () => {
    clearGuestProjectDraft(localStorage);
    personalizationTrackedRef.current = false;
    setPrompt('');
    setCode('');
    setBuiltPrompt('');
    setBuiltSummary('');
    setAiTitle('');
    setProjectType('website');
    setConceptsUsed([]);
    setIsPlayMode(false);
    setExplanation('');
    setError('');
    setIsSaved(false);
    setSaveStatus(null);
    setUnsavedWarning(false);
    setPromptHistory([]);
    setPreviousCode('');
    setEditHistory(clearHistory());
    setWorkspaceTab(prev => tabAfter('built', prev));
    setShowEditPanel(false);
    setEditInstruction('');
    setEditError('');
    setLocalVersions([]);
    setServerVersions([]);
    setShowHistory(false);
    setSavedProjectId(null);
    setActiveVersionId(null);
    setRestoringVersion(false);
    setLoadingPreviewType('');
    setIsPublished(false);
    setPublicId(null);
    setPublishStatus(null);
    setStudioPanel(null);
    setDeviceView('desktop');
    setProjectDesc('');
    setEditingDesc(false);
    setGameSpeed(3);
    setGameDiff('medium');
    setGameTimer(30);
    setEditModeOn(false);
    setHasPersonalized(false);
    setHasPlayedOnce(false);
    setHasTestedLatest(false);
    setGuestDraftRecovered(false);
    setSelectedEl(null);
    setShowElPanel(false);
    setPatchError('');
    setAiRefineText('');
    setMissions([]);
    setMissionActive(null);
    setCompanionVisible(false);
    setCompanionTip('');
    setShowWow(false);
    promptRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Share project ──────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!publicId) return;
    const title = projectName || 'My Project';
    const url = `https://codeitlearn.com/project/${publicId}?utm_source=project-share`;
    const text = `I made "${title}" with CodeIt. Try it, then build your own.`;
    let completed = false;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        setShareStatus('shared');
        completed = true;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    if (!completed) {
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus('copied');
        completed = true;
      } catch (_) {}
    }

    if (completed) {
      void trackEvent('project_share', 'creator', token);
      setTimeout(() => setShareStatus(null), 2200);
    }
  };

  // ── Publish project ────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!code) return;
    if (!isPersonalized || !hasTestedLatest) {
      setShowEditPanel(!isPersonalized);
      return;
    }
    if (!user || !token) {
      continueAfterAuth('publish');
      return;
    }
    if (user.managedProfile) {
      setError('This parent-managed learner profile keeps projects private. A parent can still see progress from the family account.');
      return;
    }

    // Save first if not saved
    let projectId = savedProjectId;
    let earnedXp = 0;
    if (!projectId) {
      // Prefer the name the student chose over one derived from their prompt.
      const title = projectName || 'My Project';
      try {
        const res  = await fetch(`${API_BASE_URL}/api/builder/projects`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...journeyHeaders() },
          body:    JSON.stringify({ title, prompt: builtPrompt, generated_code: code, project_type: projectType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Save failed');
        projectId = data.project.id;
        setSavedProjectId(projectId);
        setSavedProjects(prev => [data.project, ...prev]);
        setIsSaved(true);
        earnedXp += Number(data.xp_awarded) || 0;
      } catch (err) {
        setPublishStatus('error');
        setTimeout(() => setPublishStatus(null), 3000);
        return;
      }
    }

    setPublishStatus('publishing');
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/projects/${projectId}/publish`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, ...journeyHeaders() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      earnedXp += Number(data.xp_awarded) || 0;
      if (earnedXp > 0) {
        awardXP(earnedXp);
        popXp(earnedXp, earnedXp >= 50 ? 'Saved and published' : 'Project published');
      }
      setIsPublished(true);
      setPublicId(data.public_id);
      sessionStorage.removeItem('codeit_builder_draft');
      clearGuestProjectDraft(localStorage);
      const url = `https://codeitlearn.com/project/${data.public_id}?utm_source=project-share`;
      try { await navigator.clipboard.writeText(url); } catch (_) {}
      setPublishStatus('copied');
      setTimeout(() => setPublishStatus(null), 3000);
    } catch (_) {
      setPublishStatus('error');
      setTimeout(() => setPublishStatus(null), 3000);
    }
  };

  // Complete the exact action that brought a guest to authentication after
  // their fresh draft has been restored into the builder.
  useEffect(() => {
    if (!resumeAction || !user || !token || !code || resumeActionStartedRef.current) return;
    resumeActionStartedRef.current = true;
    const action = resumeAction;
    setResumeAction(null);
    if (action === 'publish') handlePublish();
    else handleSaveProject();
  }, [resumeAction, user, token, code]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyPublicLink = async () => {
    if (!publicId) return;
    const url = `https://codeitlearn.com/project/${publicId}?utm_source=project-share`;
    let copied = false;
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch (_) {}

    if (copied) {
      void trackEvent('project_share', 'creator', token);
      setPublishStatus('copied');
    } else {
      setPublishStatus('error');
    }
    setTimeout(() => setPublishStatus(null), 2000);
  };

  const handleUnpublish = async () => {
    if (!savedProjectId || !token) return;
    try {
      await fetch(`${API_BASE_URL}/api/builder/projects/${savedProjectId}/unpublish`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsPublished(false);
    } catch (_) {}
  };

  // ── Favorite toggle ────────────────────────────────────────────────────────
  const toggleFavorite = (id) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('codeit_fav_projects', JSON.stringify([...next]));
      return next;
    });
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasResult   = !loading && code;
  const hasError    = !loading && error;
  const earnsProjectXp = String(user?.role || '').toLowerCase() === 'student';
  const activeBuildSteps = getBuildSteps(loadingPreviewType);
  const loadingTitle = loadingPreviewType === 'quiz' ? 'Building your quiz...'
    : loadingPreviewType === 'game' ? 'Building your game...'
    : loadingPreviewType === 'tool' ? 'Building your tool...'
    : 'Building your project...';
  const projectName = aiTitle || (builtPrompt ? deriveProjectName(builtPrompt) : '');
  const editCount   = promptHistory.length > 1 ? promptHistory.length - 1 : 0;
  const isPersonalized = hasPersonalized || editCount > 0;
  const saveActionLabel = isSaved
    ? 'Saved to My Creations'
    : !isPersonalized
      ? 'First: change one thing'
      : !hasTestedLatest
        ? 'Next: test my changes'
        : 'Save project';
  const guideLevel = guideLevelOverride || learnerGuideLevel(user);
  // Same panel for everyone, sized to the learner: ages 5–7 get three big
  // picture choices, teenagers get the full set.
  const instantControls = controlsForGuideLevel(guideLevel);

  // The four pages, and what each one has to say right now.
  const workspaceTabs = tabsFor({
    hasPlayed: hasPlayedOnce,
    hasChanged: isPersonalized,
    hasTested: hasTestedLatest,
    isSaved,
  });
  const activeTab = workspaceTabs.find(tab => tab.id === workspaceTab) || workspaceTabs[0];

  // Concrete things to change in THIS project, for the child who asked what
  // "change one thing" means.
  const ideasForThisProject = code ? changeIdeasFor(code) : [];
  const mineThemes = guideLevel === 'early' ? FIRST_CHANGE_THEMES : PRESET_PALETTES;
  const coachStage = !code
    ? prompt.trim()
      ? { number: 2, icon: '🟣', title: 'Press “Build my project”', detail: 'The big purple button makes your idea.', target: 'build' }
      : { number: 1, icon: '👇', title: 'Pick what you want to make', detail: 'Press Game, Website, or Quiz.', target: 'pick' }
    : !hasPlayedOnce
      ? { number: 2, icon: '▶️', title: 'Press Play', detail: 'Try every button. See what works.', target: 'play' }
      : !isPersonalized
        ? { number: 3, icon: '🎨', title: 'Change one thing', detail: 'Pick new colors or add a fun idea.', target: 'change' }
        : !hasTestedLatest
          ? { number: 4, icon: '🧪', title: 'Play it again', detail: 'Make sure your new change works.', target: 'play' }
          : !isSaved
            ? { number: 5, icon: '💾', title: 'Save your project', detail: 'Keep your work so it is here next time.', target: 'save' }
            : user?.managedProfile
              ? { number: 6, icon: '🙋', title: 'Show your grown-up or teacher', detail: 'Your project is ready for a safe review.', target: 'learn' }
              : !isPublished
                ? { number: 6, icon: '🌟', title: 'Publish when you are proud', detail: 'Your project is tested, saved, and ready to share.', target: 'publish' }
                : { number: 7, icon: '🎉', title: 'Invite someone to play', detail: 'Share your finished project and ask what they think.', target: 'share' };
  const lessonChips = builtPrompt
    ? LESSON_CONCEPTS.filter(l => detectLessonIds(builtPrompt).includes(l.id))
    : [];
  // ── What actually goes into the preview frame ──────────────────────────────
  //
  // Scoped per project, so two games do not fight over one high score, and so a
  // child's saved progress follows the project rather than the browser tab.
  const previewKey = savedProjectId ? `p${savedProjectId}` : publicId ? `x${publicId}` : 'draft';
  previewKeyRef.current = previewKey;
  // Seeded at the moment the frame is built, not in an effect: effects run
  // after the iframe already has its srcDoc, and by then the game has read its
  // high score and found nothing. Re-read on every rebuild so an edit does not
  // roll a child's score back to whatever it was when they opened the page.
  const previewDoc = useMemo(
    () => preparePreview(code, loadPreviewStorage(previewKey)),
    [code, previewKey]
  );

  const allVersions = useMemo(() => [...localVersions, ...serverVersions], [localVersions, serverVersions]);
  const activeModifiers = useMemo(() => {
    const t = (projectType || '').toLowerCase();
    if (['clicker', 'runner', 'memory', 'reaction', 'game', 'soccer'].includes(t)) return GAME_MODIFIERS;
    if (['website', 'portfolio', 'restaurant', 'shop', 'sports', 'blog', 'landing'].includes(t)) return WEBSITE_MODIFIERS;
    if (['calculator', 'timer', 'drawing', 'flashcards', 'tool'].includes(t)) return TOOL_MODIFIERS;
    if (/game|clicker|runner|memory|reaction|quiz|soccer/.test(t)) return GAME_MODIFIERS;
    if (/website|portfolio|restaurant|shop|sports|blog|landing/.test(t)) return WEBSITE_MODIFIERS;
    return GAME_MODIFIERS;
  }, [projectType]);

  const sortedProjects = useMemo(() => {
    let list = [...savedProjects];
    if (projectSort !== 'recent') {
      list = list.filter(p => {
        const t = (p.project_type || '').toLowerCase();
        if (projectSort === 'game')    return /game|clicker|runner|memory|reaction/.test(t);
        if (projectSort === 'website') return /website|portfolio|shop|sports|blog|landing/.test(t);
        if (projectSort === 'quiz')    return /quiz/.test(t);
        if (projectSort === 'tool')    return /tool|calculator|timer|drawing|flashcard/.test(t);
        return true;
      });
    }
    list.sort((a, b) => {
      const aFav = favoriteIds.has(a.id);
      const bFav = favoriteIds.has(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
    });
    return list;
  }, [savedProjects, projectSort, favoriteIds]);


  return (
    <>
      <Header />
      <div className={`bldr-page${hasResult ? ' bldr-studio-mode' : ''}`}>

        {/* ════════════════════════════════════════
            HERO
        ════════════════════════════════════════ */}
        <section className="bldr-hero">
          <div className="bldr-hero__badge">Project studio</div>
          <h1 className="bldr-hero__title">
            Describe it. Build it.<br />
            <span className="bldr-hero__title-accent">Make it yours.</span>
          </h1>
          <p className="bldr-hero__sub">
            Start with a game, quiz, or website. Get a working first version, then play with it,
            change the code, and learn how it works.
          </p>
        </section>

        {isNewAccountWelcome && !code && (
          <aside className="bldr-account-ready" role="status">
            <strong>Your account is ready.</strong>
            <span>Choose a starter below or describe your own idea. Your first saved project will stay in this account.</span>
          </aside>
        )}

        <section className="bldr-help-level" aria-label="Choose how much guidance you want">
          <span className="bldr-help-level__label">How much help do you want?</span>
          <div className="bldr-help-level__options">
            {GUIDE_LEVELS.map(option => (
              <button
                key={option.id}
                type="button"
                className={guideLevel === option.id ? 'is-active' : ''}
                aria-pressed={guideLevel === option.id}
                onClick={() => changeGuideLevel(option.id)}
              >
                <span aria-hidden="true">{option.icon}</span>{option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Once a project exists the pages carry the guidance, and each one
            says what to do on it. Leaving the sticky coach up as well meant two
            voices disagreeing: it read "Press Play" while the child was on the
            Change page. Before a build there are no pages yet, so it stays. */}
        {coachOpen && !code ? (
          <aside className={`bldr-coach bldr-coach--${guideLevel}`} role="status" aria-live="polite">
            <div className="bldr-coach__face" aria-hidden="true">{coachStage.icon}</div>
            <div className="bldr-coach__copy">
              <span className="bldr-coach__step">CodeIt Guide · Step {coachStage.number}</span>
              <strong>{coachStage.title}</strong>
              <p>{coachStage.detail}</p>
            </div>
            <div className="bldr-coach__actions">
              <button type="button" className="bldr-coach__show" onClick={showCoachTarget}>👆 Show me</button>
              <button
                type="button"
                className="bldr-coach__read"
                onClick={() => readCoach(`${coachStage.title}. ${coachStage.detail}`)}
              >
                🔊 Read to me
              </button>
              <button type="button" className="bldr-coach__hide" onClick={() => setCoachOpen(false)} aria-label="Hide CodeIt Guide">×</button>
            </div>
          </aside>
        ) : (
          <button type="button" className="bldr-coach-open" onClick={() => setCoachOpen(true)}>🧭 Open CodeIt Guide</button>
        )}

        {/* Ambient studio particles — paused while editing for performance */}
        {hasResult && !editing && (
          <div className="bldr-studio-particles" aria-hidden="true">
            <span className="bldr-studio-particle" />
            <span className="bldr-studio-particle" />
            <span className="bldr-studio-particle" />
            <span className="bldr-studio-particle" />
          </div>
        )}

        {/* ════════════════════════════════════════
            HERO BUILD PICKS (first-time empty state)
        ════════════════════════════════════════ */}
        {!code && !loading && !error && (
          <div className="bldr-hero-picks" data-codeit-coach={coachStage.target === 'pick' ? 'current' : undefined}>
            <p className="bldr-hero-picks__label">What will you build today?</p>
            <div className="bldr-hero-picks__grid">
              {HERO_BUILDS.map(hb => (
                <button
                  key={hb.id}
                  className={`bldr-hero-pick bldr-hero-pick--${hb.id}`}
                  onClick={() => { setPrompt(hb.prompt); callBuilder(hb.prompt); }}
                >
                  <span className="bldr-hero-pick__title">{hb.title}</span>
                  <span className="bldr-hero-pick__sub">{hb.sub}</span>
                  <span className="bldr-hero-pick__cta">Build now</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            INPUT CARD
        ════════════════════════════════════════ */}
        <div className="bldr-input-card">
          <div className="bldr-textarea-wrap">
            <textarea
              ref={promptRef}
              className="bldr-textarea"
              placeholder="Describe what you want to build..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={loading || editing}
            />
            <div className="bldr-textarea-hint">Ctrl+Enter to build</div>
          </div>
          {code && !loading && (
            <div className="bldr-quickstarts">
              <span className="bldr-quickstarts__label">Try another idea:</span>
              {['Game', 'Website', 'Tool'].map(cat => (
                <div key={cat} className="bldr-quickstarts__group">
                  <span className="bldr-quickstarts__group-label">{cat}s</span>
                  <div className="bldr-quickstarts__chips">
                    {QUICK_STARTS.filter(qs => qs.category === cat).map(qs => (
                      <button key={qs.label} className="bldr-chip" onClick={() => handleQuickStart(qs)}>
                        {qs.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="bldr-build-btn"
            data-codeit-coach={coachStage.target === 'build' ? 'current' : undefined}
            onClick={handleBuild}
            disabled={!prompt.trim() || loading || editing}
          >
            {loading
              ? <><span className="bldr-spinner bldr-spinner--btn" />Building...</>
              : hasResult ? 'Rebuild from scratch' : 'Build my project'}
          </button>
          <p className="bldr-privacy-hint">
            Keep personal details private. Do not enter your full name, email, school, address, or passwords.
          </p>
        </div>

        {/* ════════════════════════════════════════
            LOADING STATE
        ════════════════════════════════════════ */}
        {loading && (
          <>
            <div className="bldr-loading">
              <div className="bldr-loading__header">
                <span className="bldr-spinner" />
                <span className="bldr-loading__title">{loadingTitle}</span>
              </div>
              <p className="bldr-loading__idea">"{prompt}"</p>

              <div className="bldr-loading__steps">
                {activeBuildSteps.map((step, i) => (
                  <div
                    key={i}
                    className={`bldr-loading__step ${
                      buildStep > i ? 'is-done' : buildStep === i ? 'is-active' : 'is-pending'
                    }`}
                  >
                    <span className="bldr-loading__step-icon" aria-hidden="true">
                      {buildStep > i ? '✓' : buildStep === i ? '' : '○'}
                      {buildStep === i && <span className="bldr-loading__step-spinner" />}
                    </span>
                    <span className="bldr-loading__step-text">{step}</span>
                  </div>
                ))}
              </div>

              <div className="bldr-loading__bar-wrap">
                <div
                  className="bldr-loading__bar"
                  style={{ width: `${Math.min(((buildStep) / activeBuildSteps.length) * 100 + 8, 92)}%` }}
                />
              </div>
            </div>

            {/* Live starter preview — play it while AI customizes your version */}
            <div className="bldr-loading-preview-wrap">
              <div className="bldr-browser">
                <div className="bldr-browser__chrome">
                  <div className="bldr-browser__dots">
                    <span className="bldr-browser__dot bldr-browser__dot--red" />
                    <span className="bldr-browser__dot bldr-browser__dot--yellow" />
                    <span className="bldr-browser__dot bldr-browser__dot--green" />
                  </div>
                  <div className="bldr-browser__bar">
                    <span className="bldr-browser__bar-spinner" />
                    CodeIt is building your version...
                  </div>
                </div>
                <div className="bldr-loading-preview__iframe-wrap">
                  <iframe
                    className="bldr-iframe"
                    srcDoc={STARTER_TEMPLATES[loadingPreviewType] || STARTER_TEMPLATES.game}
                    sandbox="allow-scripts allow-forms"
                    title="Building preview — play me while you wait!"
                  />
                  <div className="bldr-loading-preview__status">
                    <span className="bldr-spinner bldr-spinner--sm" />
                    Shaping this starter around your idea...
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════
            ERROR STATE (build)
        ════════════════════════════════════════ */}
        {hasError && (
          <div className="bldr-error-card">
            <div className="bldr-error-card__icon">!</div>
            <div className="bldr-error-card__body">
              <p className="bldr-error-card__title">We couldn't build that yet.</p>
              <p className="bldr-error-card__sub">Try a simpler idea, or rephrase your description.</p>
              <p className="bldr-error-card__detail">{error}</p>
            </div>
            <button className="bldr-action-btn bldr-action-btn--primary bldr-action-btn--sm" onClick={handleBuild}>
              Try again
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════
            RESULT SECTION
        ════════════════════════════════════════ */}
        {hasResult && (
          <div className="bldr-result">

            {/* Unsaved warning */}
            {unsavedWarning && (
              <div className="bldr-unsaved-warning">
                <span className="bldr-unsaved-warning__text">
                  Start a new build? Save this project first if you want to keep it.
                </span>
                <div className="bldr-unsaved-warning__actions">
                  <button className="bldr-action-btn bldr-action-btn--save bldr-action-btn--sm" onClick={handleSaveProject}>
                    Save first
                  </button>
                  <button className="bldr-action-btn bldr-action-btn--sm" onClick={clearEditor}>
                    Start new build anyway
                  </button>
                  <button className="bldr-action-btn bldr-action-btn--sm" onClick={() => setUnsavedWarning(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Success banner */}
            <div className="bldr-success-banner" key={buildKey}>
              <div className="bldr-success-banner__check-wrap">
                <div className="bldr-success-banner__check" aria-hidden="true">✓</div>
                <div className="bldr-confetti-burst" aria-hidden="true">
                  {confettiParticles.map(p => (
                    <span
                      key={p.id}
                      className={`bldr-confetti-dot${p.isCircle ? ' bldr-confetti-dot--circle' : ''}`}
                      style={{ '--angle': `${p.angle}deg`, '--dist': `${p.dist}px`, background: p.color, animationDelay: `${p.delay}s` }}
                    />
                  ))}
                </div>
              </div>
              <div className="bldr-success-banner__copy">
                <span className="bldr-success-banner__label">
                  {editCount > 0
                    ? `${editCount} edit${editCount > 1 ? 's' : ''} applied`
                    : hasPersonalized ? 'Personalized by you' : 'You built this!'}
                </span>
                <h2 className="bldr-success-banner__name">{projectName}</h2>
                <p className="bldr-success-banner__credit">
                  {user
                    ? `by ${user.username || user.name || 'you'} — Made with CodeIt`
                    : 'Made with CodeIt'}
                </p>
                {builtSummary && <p className="bldr-success-banner__summary">{builtSummary}</p>}
              </div>
              {!isSaved && isPersonalized && hasTestedLatest && (
                <button
                  type="button"
                  className="bldr-success-banner__save"
                  onClick={handleSaveProject}
                  disabled={saveStatus === 'saving' || editing}
                  aria-label="Save this project now"
                >
                  <span>{saveStatus === 'saving' ? 'Saving…' : user ? 'Save now' : 'Keep it free'}</span>
                  <small>
                    {user
                      ? earnsProjectXp ? 'Keep it + earn 25 XP' : 'Keep it in your account'
                      : 'Use it on another device'}
                  </small>
                </button>
              )}
            </div>

            {!user && (
              <aside id="guest-project-recovery" className={`bldr-guest-backup${guestDraftRecovered ? ' is-recovered' : ''}`} aria-label="Guest project recovery">
                <div>
                  <strong>
                    {guestDraftRecovered
                      ? 'Welcome back—your project was recovered.'
                      : 'Backed up in this browser.'}
                  </strong>
                  <span>
                    It stays only on this device for up to 7 days. Keep it in a free account to use it on another device.
                  </span>
                </div>
                <button type="button" onClick={handleSaveProject}>
                  Keep it in a free account
                </button>
              </aside>
            )}

            {/* Project description — inline editable */}
            <div className="bldr-project-desc">
              {editingDesc ? (
                <textarea
                  className="bldr-project-desc__input"
                  value={projectDesc}
                  onChange={e => setProjectDesc(e.target.value)}
                  onBlur={() => setEditingDesc(false)}
                  placeholder="Add a description of your project..."
                  rows={2}
                  autoFocus
                />
              ) : (
                <p
                  className={`bldr-project-desc__text${projectDesc ? '' : ' bldr-project-desc__text--empty'}`}
                  onClick={() => setEditingDesc(true)}
                  title="Click to add a description"
                >
                  {projectDesc || 'Add a description...'}
                </p>
              )}
            </div>

            {/* Interactivity badges */}
            {interactivityBadges.length > 0 && (
              <div className="bldr-interact-badges">
                {interactivityBadges.map(b => (
                  <span key={b.label} className={`bldr-interact-badge bldr-interact-badge--${b.cls}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            )}

            {/* Device preview bar */}
            <div className="bldr-device-bar">
              <div className="bldr-device-bar__left">
                <span className="bldr-device-bar__project">{projectName}</span>
                {isSaved && <span className="bldr-device-bar__saved-badge">Saved</span>}
              </div>
              <div className="bldr-device-bar__devices">
                {[
                  { id: 'desktop', label: 'Desktop' },
                  { id: 'tablet',  label: 'Tablet'  },
                  { id: 'mobile',  label: 'Mobile'  },
                ].map(d => (
                  <button
                    key={d.id}
                    className={`bldr-device-btn${deviceView === d.id ? ' bldr-device-btn--active' : ''}`}
                    onClick={() => setDeviceView(d.id)}
                    title={`Preview as ${d.label}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live interactive iframe preview */}
            <div className={`bldr-browser bldr-browser--${deviceView}${isPlayMode ? ' bldr-browser--play' : ''}`}>
              <div className="bldr-browser__chrome">
                <div className="bldr-browser__dots">
                  <span className="bldr-browser__dot bldr-browser__dot--red" />
                  <span className="bldr-browser__dot bldr-browser__dot--yellow" />
                  <span className="bldr-browser__dot bldr-browser__dot--green" />
                </div>
                <div className="bldr-browser__bar">
                  {editing
                    ? <><span className="bldr-browser__bar-spinner" />Applying changes...</>
                    : `CodeIt Studio — ${projectName}`}
                </div>
                <button
                  className="bldr-browser__play-btn"
                  onClick={handleTogglePlay}
                  data-codeit-coach={coachStage.target === 'play' ? 'current' : undefined}
                  title={isPlayMode ? 'Compact view' : 'Expand to play mode'}
                >
                  {isPlayMode ? 'Compact' : 'Play'}
                </button>
                <button
                  className="bldr-browser__fullscreen-btn"
                  onClick={handleFullscreen}
                  title="Open in full screen tab"
                >
                  Full screen
                </button>
              </div>
              {/* sandbox="allow-scripts allow-forms allow-pointer-lock" — enables JS, forms, and pointer lock for games */}
              <iframe
                ref={iframeRef}
                srcDoc={previewDoc}
                className={`bldr-iframe${editing ? ' bldr-iframe--updating' : ''}${isPlayMode ? ' bldr-iframe--play' : ''}${editModeOn ? ' bldr-iframe--editmode' : ''}`}
                title="Project preview"
                sandbox="allow-scripts allow-forms allow-pointer-lock"
              />
            </div>

            {/* Show the finished result before asking the student to change, save, or share it. */}
            {!isSaved && (
              <section className="bldr-activation-card bldr-activation-card--journey" aria-labelledby="bldr-next-step-title">
                <div className="bldr-activation-card__copy">
                  <span className="bldr-activation-card__kicker">Your first version is ready — it is not finished yet</span>
                  <h3 id="bldr-next-step-title">Play it. Change it. Test it. Then save it.</h3>
                  <p>
                    {guideLevel === 'early'
                      ? 'Follow the four picture steps. CodeIt will show you the next button.'
                      : 'A strong project needs your ideas. Make at least one change and test it before you call it finished.'}
                  </p>
                  <ol className="bldr-project-checklist" aria-label="Project quality steps">
                    {/* The four steps and the four pages were two versions of
                        the same journey sitting on top of each other. Now a step
                        is the way to its page: tap "Change one thing" and you
                        land on Change, where the ideas are. */}
                    <li className={hasPlayedOnce ? 'is-done' : 'is-current'}>
                      <button type="button" onClick={() => setWorkspaceTab('play')}>
                        <span>{hasPlayedOnce ? '✓' : '1'}</span>Play everything
                      </button>
                    </li>
                    <li className={isPersonalized ? 'is-done' : hasPlayedOnce ? 'is-current' : ''}>
                      <button type="button" onClick={() => setWorkspaceTab('change')}>
                        <span>{isPersonalized ? '✓' : '2'}</span>Change one thing
                      </button>
                    </li>
                    <li className={isPersonalized && hasTestedLatest ? 'is-done' : isPersonalized ? 'is-current' : ''}>
                      <button type="button" onClick={() => setWorkspaceTab('play')}>
                        <span>{isPersonalized && hasTestedLatest ? '✓' : '3'}</span>Play it again
                      </button>
                    </li>
                    <li className={isPersonalized && hasTestedLatest ? 'is-current' : ''}>
                      <button type="button" onClick={() => setWorkspaceTab('keep')}>
                        <span>4</span>Save your work
                      </button>
                    </li>
                  </ol>
                </div>
                <div className="bldr-activation-card__actions">
                  {!hasPlayedOnce ? (
                    <button className="bldr-activation-card__primary" onClick={handleTogglePlay} data-codeit-coach="current">▶ Play it now</button>
                  ) : !isPersonalized ? (
                    <button
                      className="bldr-activation-card__primary"
                      onClick={openInstantPanel}
                      data-codeit-coach="current"
                      disabled={editing}
                    >
                      🎨 Change my project
                    </button>
                  ) : !hasTestedLatest ? (
                    <button className="bldr-activation-card__primary" onClick={handleTogglePlay} data-codeit-coach="current">▶ Play my changes</button>
                  ) : (
                    <button
                      className="bldr-activation-card__primary"
                      onClick={handleSaveProject}
                      data-codeit-coach="current"
                      disabled={saveStatus === 'saving' || editing}
                    >
                      {saveStatus === 'saving' ? 'Saving…' : user ? '💾 Save my project' : '💾 Keep my project'}
                    </button>
                  )}
                  {hasPlayedOnce && !isPersonalized && guideLevel !== 'early' && (
                    <button
                      className="bldr-activation-card__secondary"
                      type="button"
                      onClick={() => { setShowEditPanel(true); setTimeout(() => editRef.current?.focus(), 0); }}
                      disabled={editing}
                    >
                      💬 Or describe a change in words
                    </button>
                  )}
                  {hasPlayedOnce && !isPersonalized && (
                    <div className="bldr-activation-themes" role="group" aria-label="Quick color choices">
                      <span className="bldr-activation-themes__label">Or pick colors now</span>
                      {FIRST_CHANGE_THEMES.map(theme => (
                        <button
                          key={theme.name}
                          className="bldr-activation-theme"
                          type="button"
                          aria-label={`Apply ${theme.name} theme`}
                          onClick={() => handleApplyColors(theme.vars)}
                          disabled={editing}
                        >
                          <span className="bldr-activation-theme__swatches" aria-hidden="true">
                            {theme.swatches.map(color => <span key={color} style={{ background: color }} />)}
                          </span>
                          <span>{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {onTab('keep') && isSaved && !isPublished && (
              <section className="bldr-activation-card bldr-activation-card--finish" aria-labelledby="bldr-finish-step-title">
                <div className="bldr-activation-card__copy">
                  <span className="bldr-activation-card__kicker">Quality check complete</span>
                  <h3 id="bldr-finish-step-title">
                    {user?.managedProfile
                      ? 'Great work — show your grown-up or teacher.'
                      : 'Now your project is ready to publish.'}
                  </h3>
                  <p>
                    {user?.managedProfile
                      ? 'You played it, improved it, tested it, and saved it. Your family-private project is ready for review.'
                      : 'You played it, made it yours, tested the change, and saved it. Publishing creates a link other people can open.'}
                  </p>
                </div>
                <div className="bldr-activation-card__actions">
                  {user?.managedProfile ? (
                    <button
                      className="bldr-activation-card__primary"
                      onClick={() => {
                        void trackEvent('activation_next_step', 'learn', token);
                        handleExplain();
                      }}
                      data-codeit-coach={coachStage.target === 'learn' ? 'current' : undefined}
                      disabled={explaining || editing}
                    >
                      {explaining ? 'Opening explanation…' : 'Learn how it works'}
                    </button>
                  ) : (
                    <button
                      className="bldr-activation-card__primary"
                      onClick={() => {
                        void trackEvent('activation_next_step', 'publish', token);
                        handlePublish();
                      }}
                      data-codeit-coach={coachStage.target === 'publish' ? 'current' : undefined}
                      disabled={editing || publishStatus === 'publishing'}
                    >
                      {publishStatus === 'publishing' ? 'Publishing…' : 'Publish and get a link'}
                    </button>
                  )}
                  <button
                    className="bldr-activation-card__secondary"
                    onClick={() => {
                      void trackEvent('activation_next_step', 'improve', token);
                      setShowEditPanel(true);
                      setTimeout(() => editRef.current?.focus(), 0);
                    }}
                    disabled={editing}
                  >
                    Keep improving
                  </button>
                </div>
              </section>
            )}

            {onTab('keep') && isSaved && isPublished && (
              <section className="bldr-activation-card bldr-activation-card--live" aria-labelledby="bldr-live-step-title">
                <div className="bldr-activation-card__copy">
                  <span className="bldr-activation-card__kicker">Your project is live</span>
                  <h3 id="bldr-live-step-title">Invite someone to play it.</h3>
                  <p>The link opens your project without an account. Anyone who wants to build can remix a separate copy.</p>
                </div>
                <div className="bldr-activation-card__actions">
                  <button
                    className="bldr-activation-card__primary"
                    onClick={() => {
                      void trackEvent('activation_next_step', 'share', token);
                      handleShare();
                    }}
                    data-codeit-coach={coachStage.target === 'share' ? 'current' : undefined}
                    disabled={editing}
                  >
                    {shareStatus === 'shared' ? 'Shared!'
                      : shareStatus === 'copied' ? 'Link copied!'
                      : 'Share your project'}
                  </button>
                  <button
                    className="bldr-activation-card__secondary"
                    onClick={() => {
                      void trackEvent('activation_next_step', 'improve', token);
                      setShowEditPanel(true);
                      setTimeout(() => editRef.current?.focus(), 0);
                    }}
                    disabled={editing}
                  >
                    Improve it again
                  </button>
                </div>
              </section>
            )}

            {/* ── Pages ────────────────────────────────────────────────
                 One thing at a time. Everything below this bar belongs to
                 whichever page is open; the project preview above it never
                 moves, because it is the point. */}
            {/* The dot is decorative and the hint rides on title. An aria-label
                on the dot became part of the button's accessible name, so the
                Change tab announced itself as "Change something to do here". */}
            <nav className="bldr-tabs" aria-label="Studio pages">
              {workspaceTabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`bldr-tab${workspaceTab === tab.id ? ' bldr-tab--active' : ''}`}
                  onClick={() => setWorkspaceTab(tab.id)}
                  aria-current={workspaceTab === tab.id ? 'page' : undefined}
                  title={tab.hint || tab.blurb}
                >
                  <span className="bldr-tab__icon" aria-hidden="true">{tab.icon}</span>
                  <span className="bldr-tab__label">{tab.label}</span>
                  {tab.attention && workspaceTab !== tab.id && (
                    <span className="bldr-tab__dot" aria-hidden="true" />
                  )}
                </button>
              ))}
            </nav>

            <p className="bldr-tab-blurb">
              {activeTab?.hint || activeTab?.blurb}
            </p>

            {/* ── Creative Studio Toolbar ─────────────────────────────── */}
            {onTab('change') && (
            <div className="bldr-studio-bar" ref={studioRef}>
              <span className="bldr-studio-bar__label">Studio:</span>
              {STUDIO_TOOLS
                .filter(t => t.id !== 'gameplay' || /game|quiz|clicker|runner|memory|reaction|soccer/.test(projectType))
                .map(tool => (
                  <button
                    key={tool.id}
                    className={`bldr-studio-bar__btn bldr-studio-bar__btn--${tool.id}${studioPanel === tool.id ? ' bldr-studio-bar__btn--active' : ''}`}
                    onClick={() => setStudioPanel(sp => sp === tool.id ? null : tool.id)}
                    disabled={editing}
                  >
                    {tool.label}
                  </button>
                ))}
            </div>
            )}

            {/* Studio contextual panel */}
            {onTab('change') && studioPanel && (
              <div className="bldr-studio-panel">
                <div className="bldr-studio-panel__header">
                  <span className="bldr-studio-panel__title">
                    {STUDIO_TOOLS.find(t => t.id === studioPanel)?.label}
                  </span>
                  <button className="bldr-studio-panel__close" onClick={() => setStudioPanel(null)}>×</button>
                </div>

                {studioPanel === 'mine' && (
                  <div className="bldr-studio-panel__body bldr-mine" data-guide-level={guideLevel}>
                    <p className="bldr-mine__intro">
                      <span className="bldr-mine__intro-icon" aria-hidden="true">✨</span>
                      {guideLevel === 'early'
                        ? 'Tap a picture to change your project. It changes right away!'
                        : 'Every change here happens straight away — no waiting, no internet needed.'}
                    </p>

                    {instantControls.includes('theme') && (
                      <fieldset className="bldr-mine__group">
                        <legend className="bldr-mine__legend"><span aria-hidden="true">🎨</span> Colours</legend>
                        <div className="bldr-mine__options bldr-mine__options--theme">
                          {mineThemes.map(theme => (
                            <button
                              key={theme.name}
                              type="button"
                              className="bldr-mine__option"
                              aria-label={`Apply ${theme.name} colours`}
                              disabled={editing}
                              onClick={() => {
                                handleApplyColors(theme.vars);
                                setInstantNotice(`${theme.name} colours applied. Play it again to test your change.`);
                                popXp(10, 'Made it yours');
                              }}
                            >
                              <span className="bldr-mine__swatches" aria-hidden="true">
                                {theme.swatches.map(color => <span key={color} style={{ background: color }} />)}
                              </span>
                              <span className="bldr-mine__option-label">{theme.name}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    {instantControls.includes('textSize') && (
                      <fieldset className="bldr-mine__group">
                        <legend className="bldr-mine__legend"><span aria-hidden="true">🔤</span> Text size</legend>
                        <div className="bldr-mine__options">
                          {optionsForGuideLevel(TEXT_SIZES, guideLevel).map(option => (
                            <button
                              key={option.id}
                              type="button"
                              className={`bldr-mine__option${instantPrefs.textSize === option.id ? ' bldr-mine__option--active' : ''}`}
                              aria-label={`Text size: ${option.label}`}
                              aria-pressed={instantPrefs.textSize === option.id}
                              disabled={editing}
                              onClick={() => applyInstantChange(
                                { textSize: option.id },
                                `Text size: ${option.label}`,
                                `Text is now ${option.label.toLowerCase()}. Play it again to test your change.`
                              )}
                            >
                              <span className="bldr-mine__preview" aria-hidden="true" style={{ fontSize: `${option.scale}rem` }}>Aa</span>
                              <span className="bldr-mine__option-label">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    {instantControls.includes('font') && (
                      <fieldset className="bldr-mine__group">
                        <legend className="bldr-mine__legend"><span aria-hidden="true">✏️</span> Letter style</legend>
                        <div className="bldr-mine__options">
                          {optionsForGuideLevel(FONTS, guideLevel).map(option => (
                            <button
                              key={option.id}
                              type="button"
                              className={`bldr-mine__option${instantPrefs.font === option.id ? ' bldr-mine__option--active' : ''}`}
                              aria-label={`Letter style: ${option.label}`}
                              aria-pressed={instantPrefs.font === option.id}
                              disabled={editing}
                              onClick={() => applyInstantChange(
                                { font: option.id },
                                `Letter style: ${option.label}`,
                                `Letters are now ${option.label.toLowerCase()}. Play it again to test your change.`
                              )}
                            >
                              <span className="bldr-mine__preview" aria-hidden="true" style={{ fontFamily: option.stack || 'inherit' }}>Abc</span>
                              <span className="bldr-mine__option-label">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    {instantControls.includes('background') && (
                      <fieldset className="bldr-mine__group">
                        <legend className="bldr-mine__legend"><span aria-hidden="true">🖼️</span> Background</legend>
                        <div className="bldr-mine__options">
                          {optionsForGuideLevel(BACKGROUNDS, guideLevel).map(option => (
                            <button
                              key={option.id}
                              type="button"
                              className={`bldr-mine__option${instantPrefs.background === option.id ? ' bldr-mine__option--active' : ''}`}
                              aria-label={`Background: ${option.label}`}
                              aria-pressed={instantPrefs.background === option.id}
                              disabled={editing}
                              onClick={() => applyInstantChange(
                                { background: option.id },
                                `Background: ${option.label}`,
                                `Background is now ${option.label.toLowerCase()}. Play it again to test your change.`
                              )}
                            >
                              <span
                                className="bldr-mine__preview bldr-mine__preview--swatch"
                                aria-hidden="true"
                                style={{ backgroundImage: option.swatch, backgroundSize: option.swatchSize || 'auto' }}
                              />
                              <span className="bldr-mine__option-label">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    {instantControls.includes('corners') && (
                      <fieldset className="bldr-mine__group">
                        <legend className="bldr-mine__legend"><span aria-hidden="true">⭐</span> Corners</legend>
                        <div className="bldr-mine__options">
                          {CORNERS.map(option => (
                            <button
                              key={option.id}
                              type="button"
                              className={`bldr-mine__option${instantPrefs.corners === option.id ? ' bldr-mine__option--active' : ''}`}
                              aria-label={`Corners: ${option.label}`}
                              aria-pressed={instantPrefs.corners === option.id}
                              disabled={editing}
                              onClick={() => applyInstantChange(
                                { corners: option.id },
                                `Corners: ${option.label}`,
                                `Corners are now ${option.label.toLowerCase()}. Play it again to test your change.`
                              )}
                            >
                              <span
                                className="bldr-mine__preview bldr-mine__preview--corner"
                                aria-hidden="true"
                                style={{ borderRadius: option.radius || '6px' }}
                              />
                              <span className="bldr-mine__option-label">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    {instantControls.includes('title') && (
                      <fieldset className="bldr-mine__group">
                        <legend className="bldr-mine__legend"><span aria-hidden="true">🏷️</span> Project name</legend>
                        <div className="bldr-mine__rename">
                          <label className="bldr-mine__rename-label" htmlFor="bldr-title-input">
                            {guideLevel === 'early' ? 'What is your project called?' : 'Give your project its own name'}
                          </label>
                          <input
                            id="bldr-title-input"
                            className="bldr-mine__rename-input"
                            type="text"
                            maxLength={80}
                            value={titleDraft}
                            placeholder="My awesome project"
                            onChange={e => setTitleDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleRenameProject(); } }}
                          />
                          <button
                            type="button"
                            className="bldr-studio-panel__apply-btn"
                            disabled={editing || !titleDraft.trim() || titleDraft.trim() === readProjectHeading(code)}
                            onClick={handleRenameProject}
                          >
                            Use this name
                          </button>
                        </div>
                      </fieldset>
                    )}

                    {instantNotice && (
                      <p className="bldr-mine__notice" role="status" aria-live="polite">
                        {instantNotice}
                        <button
                          type="button"
                          className="bldr-mine__notice-btn"
                          onClick={() => { setStudioPanel(null); handleTogglePlay(); }}
                        >
                          ▶ Play my changes
                        </button>
                      </p>
                    )}
                  </div>
                )}

                {studioPanel === 'colors' && (
                  <div className="bldr-studio-panel__body">
                    <p className="bldr-studio-panel__hint">Pick individual colors — updates instantly</p>
                    <div className="bldr-color-pickers">
                      {[
                        { label: 'Background', val: customBg,      set: setCustomBg,      key: '--bg' },
                        { label: 'Primary',    val: customPrimary,  set: setCustomPrimary, key: '--primary' },
                        { label: 'Accent',     val: customAccent,   set: setCustomAccent,  key: '--accent' },
                        { label: 'Text',       val: customText,     set: setCustomText,    key: '--text' },
                      ].map(({ label, val, set, key }) => (
                        <label key={key} className="bldr-color-picker-row">
                          <span className="bldr-color-picker-label">{label}</span>
                          <input
                            type="color"
                            className="bldr-color-picker-input"
                            value={val}
                            onChange={e => { set(e.target.value); applyColorsInstant({ [key]: e.target.value }); }}
                          />
                          <span className="bldr-color-picker-hex">{val}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      className="bldr-studio-panel__apply-btn"
                      disabled={editing}
                      onClick={() => {
                        handleApplyColors({ '--bg': customBg, '--primary': customPrimary, '--accent': customAccent, '--text': customText });
                        popXp(15, 'Color Theme');
                        setStudioPanel(null);
                      }}
                    >
                      Apply Colors
                    </button>
                    <p className="bldr-studio-panel__hint" style={{ marginTop: '0.75rem' }}>Or apply a full preset theme:</p>
                    {PRESET_PALETTES.map(palette => (
                      <button
                        key={palette.name}
                        className="bldr-palette-row"
                        disabled={editing}
                        onClick={() => {
                          applyColorsInstant(palette.vars);
                          setCustomBg(palette.vars['--bg'] || customBg);
                          setCustomPrimary(palette.vars['--primary'] || customPrimary);
                          setCustomAccent(palette.vars['--accent'] || customAccent);
                          setCustomText(palette.vars['--text'] || customText);
                          handleApplyColors(palette.vars);
                          popXp(15, 'Color Theme');
                          setStudioPanel(null);
                        }}
                      >
                        <div className="bldr-palette-swatches">
                          {palette.swatches.map(c => (
                            <span key={c} className="bldr-palette-swatch" style={{ background: c }} />
                          ))}
                        </div>
                        <span className="bldr-palette-name">{palette.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {studioPanel === 'text' && (
                  <div className="bldr-studio-panel__body">
                    <p className="bldr-studio-panel__hint">Pick a text style upgrade</p>
                    {TEXT_UPGRADES.map(opt => (
                      <button
                        key={opt}
                        className="bldr-studio-panel__option"
                        disabled={editing}
                        onClick={() => {
                          applyEdit(opt + '. Keep all layout, colors, and functionality unchanged.');
                          popXp(10, 'Text Upgraded');
                          setStudioPanel(null);
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {studioPanel === 'effects' && (
                  <div className="bldr-studio-panel__body">
                    <p className="bldr-studio-panel__hint">Add a visual effect to your project</p>
                    {EFFECT_UPGRADES.map(fx => (
                      <button
                        key={fx}
                        className="bldr-studio-panel__option"
                        disabled={editing}
                        onClick={() => {
                          applyEdit(fx + '. Keep all existing functionality and content unchanged.');
                          popXp(20, 'Effect Added');
                          setStudioPanel(null);
                        }}
                      >
                        {fx}
                      </button>
                    ))}
                  </div>
                )}

                {studioPanel === 'gameplay' && (
                  <div className="bldr-studio-panel__body">
                    <p className="bldr-studio-panel__hint">Drag to preview instantly — Apply to make it permanent</p>
                    <div className="bldr-studio-slider">
                      <div className="bldr-studio-slider__header">
                        <label className="bldr-studio-slider__label">Speed</label>
                        <span className="bldr-studio-slider__val">{['Very slow','Slow','Normal','Fast','Very fast'][gameSpeed - 1]}</span>
                      </div>
                      <input type="range" min={1} max={5} value={gameSpeed} className="bldr-studio-range"
                        onChange={e => { const v = +e.target.value; setGameSpeed(v); applyGameTweakInstant(v, gameTimer); }} />
                    </div>
                    <div className="bldr-studio-slider">
                      <div className="bldr-studio-slider__header">
                        <label className="bldr-studio-slider__label">Timer</label>
                        <span className="bldr-studio-slider__val">{gameTimer}s</span>
                      </div>
                      <input type="range" min={10} max={90} step={5} value={gameTimer} className="bldr-studio-range"
                        onChange={e => { const v = +e.target.value; setGameTimer(v); applyGameTweakInstant(gameSpeed, v); }} />
                    </div>
                    <div className="bldr-studio-select">
                      <label className="bldr-studio-slider__label">Difficulty</label>
                      <select value={gameDiff} onChange={e => setGameDiff(e.target.value)} className="bldr-studio-dropdown">
                        <option value="easy">Easy — great for beginners</option>
                        <option value="medium">Medium — balanced challenge</option>
                        <option value="hard">Hard — for pros</option>
                        <option value="extreme">Extreme — insanely fast</option>
                      </select>
                    </div>
                    <button
                      className="bldr-studio-panel__apply-btn"
                      disabled={editing}
                      onClick={() => {
                        const speedDesc = ['very slow','slow','normal','fast','very fast'][gameSpeed - 1];
                        applyEdit(`Update these game settings: speed should be ${speedDesc}, the timer should last ${gameTimer} seconds, and difficulty should be ${gameDiff}. Adjust existing speed values, timing intervals, and difficulty accordingly. Keep all design and features unchanged.`);
                        popXp(25, 'Game Tuned');
                        setStudioPanel(null);
                      }}
                    >
                      {editing ? 'Applying...' : 'Apply to Game'}
                    </button>
                  </div>
                )}

                {studioPanel === 'save' && (
                  <div className="bldr-studio-panel__body">
                    <p className="bldr-studio-panel__hint">Save and manage your creation</p>
                    {user ? (
                      <button
                        className="bldr-studio-panel__apply-btn"
                        disabled={saveStatus === 'saving' || isSaved || editing}
                        onClick={() => { handleSaveOrGuide(); setStudioPanel(null); }}
                      >
                        {isSaved ? 'Saved to My Creations' : saveActionLabel}
                      </button>
                    ) : (
                      <button className="bldr-studio-panel__apply-btn" onClick={handleSaveOrGuide}>
                        {!isPersonalized || !hasTestedLatest ? saveActionLabel : 'Log in to save'}
                      </button>
                    )}
                    <button className="bldr-studio-panel__secondary-btn" onClick={handleFullscreen}>
                      Open full screen
                    </button>
                    {isSaved && savedProjectId && (
                      <button className="bldr-studio-panel__secondary-btn" onClick={handleForkProject}>
                        Duplicate project
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Creator Missions ─────────────────────────────── */}
            {onTab('play') && missions.length > 0 && (
              <div className="bldr-missions">
                <span className="bldr-missions__label">Upgrade missions</span>
                <div className="bldr-missions__row">
                  {missions.map(m => (
                    <button
                      key={m}
                      className={`bldr-mission-btn${missionActive === m ? ' bldr-mission-btn--active' : ''}`}
                      onClick={() => handleMissionClick(m)}
                      disabled={editing || !!missionActive}
                    >
                      {missionActive === m
                        ? <><span className="bldr-spinner bldr-spinner--sm" />Upgrading your project...</>
                        : m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* The answer to "what does it mean by the change it" — real
                 things in this child's own project, each with the words to
                 send, so nothing has to be invented. */}
            {onTab('change') && ideasForThisProject.length > 0 && (
              <div className="bldr-ideas">
                <p className="bldr-ideas__label">Not sure what to change? Try one of these.</p>
                <ul className="bldr-ideas__list">
                  {ideasForThisProject.map(idea => (
                    <li key={idea.id}>
                      <button
                        type="button"
                        className="bldr-idea"
                        onClick={() => handleModifier(idea.prompt)}
                        disabled={editing}
                      >
                        <span className="bldr-idea__label">{idea.label}</span>
                        <span className="bldr-idea__why">{idea.why}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* One-click upgrades — visible immediately after preview */}
            {onTab('change') && (
            <div className="bldr-modifiers">
              <span className="bldr-modifiers__label">
                {/game|clicker|runner|memory|reaction|quiz/.test(projectType) ? 'Power-ups:' : 'Upgrades:'}
              </span>
              {activeModifiers.map(m => (
                <button
                  key={m}
                  className="bldr-modifier-btn"
                  onClick={() => handleModifier(m)}
                  disabled={editing}
                >
                  {editing ? <span className="bldr-spinner bldr-spinner--sm" /> : null}
                  {m}
                </button>
              ))}
            </div>
            )}

            {/* Action bar */}
            <div className="bldr-result__footer">
              {onTab('learn') && <button
                className="bldr-action-btn bldr-action-btn--explain-primary"
                onClick={handleExplain}
                disabled={explaining || editing}
              >
                {explaining
                  ? <><span className="bldr-spinner bldr-spinner--sm" />Explaining...</>
                  : 'How does this work?'}
              </button>}

              {onTab('keep') && (isPublished ? (
                <div className="bldr-share-group">
                  <button
                    className="bldr-action-btn bldr-action-btn--publish"
                    onClick={handleShare}
                    disabled={editing}
                  >
                    {shareStatus === 'shared' ? 'Shared!'
                      : shareStatus === 'copied' ? 'Link copied!'
                      : 'Share project'}
                  </button>
                  <button
                    className="bldr-action-btn bldr-action-btn--published"
                    onClick={handleCopyPublicLink}
                    disabled={editing}
                    title={`https://codeitlearn.com/project/${publicId}`}
                  >
                    {publishStatus === 'copied' ? 'Link copied!'
                      : publishStatus === 'error' ? 'Copy failed'
                      : 'Copy link'}
                  </button>
                  <button
                    className="bldr-action-btn bldr-action-btn--unpublish"
                    onClick={handleUnpublish}
                    disabled={editing}
                    title="Make project private"
                  >
                    Unpublish
                  </button>
                </div>
              ) : (
                <button
                  className="bldr-action-btn bldr-action-btn--publish"
                  onClick={handlePublish}
                  disabled={editing || publishStatus === 'publishing' || user?.managedProfile || !isSaved || !isPersonalized || !hasTestedLatest}
                  title={user?.managedProfile ? 'Parent-managed learner projects stay private' : 'Get a public link anyone can open'}
                >
                  {publishStatus === 'publishing'
                    ? <><span className="bldr-spinner bldr-spinner--sm" />Publishing...</>
                    : publishStatus === 'error' ? 'Try again'
                    : user?.managedProfile ? 'Private profile' : 'Share'}
                </button>
              ))}

              {onTab('change') && <button
                className={`bldr-action-btn bldr-action-btn--edit${showEditPanel ? ' bldr-action-btn--edit-active' : ''}`}
                onClick={() => { setShowEditPanel(p => !p); setEditError(''); if (editModeOn) toggleEditMode(); }}
                disabled={editing}
              >
                {showEditPanel ? 'Close changes' : 'Change my project'}
              </button>}

              {onTab('change') && <button
                className={`bldr-action-btn bldr-action-btn--livedit${editModeOn ? ' bldr-action-btn--livedit-active' : ''}`}
                onClick={toggleEditMode}
                disabled={editing}
                title={editModeOn ? 'Exit element editor — saves changes' : 'Click any element in the preview to edit it directly'}
              >
                {editModeOn ? 'Exit element editor' : 'Edit elements'}
              </button>}

              {onTab('keep') && <button
                className={`bldr-action-btn bldr-action-btn--history${showHistory ? ' bldr-action-btn--history-active' : ''}`}
                onClick={() => {
                  const next = !showHistory;
                  setShowHistory(next);
                  if (next) { setShowEditPanel(false); if (savedProjectId) fetchServerVersions(savedProjectId); }
                }}
                disabled={editing || restoringVersion}
              >
                History{allVersions.length > 0 ? ` (${allVersions.length})` : ''}
              </button>}

              {onTab('keep') && (user ? (
                <button
                  className={`bldr-action-btn bldr-action-btn--save${saveStatus === 'saved' ? ' bldr-action-btn--saved' : ''}`}
                  onClick={handleSaveOrGuide}
                  disabled={saveStatus === 'saving' || isSaved || editing}
                  title={saveActionLabel}
                >
                  {saveStatus === 'saving' && <><span className="bldr-spinner bldr-spinner--sm" />Saving...</>}
                  {saveStatus === 'saved'  && 'Saved!'}
                  {saveStatus === 'error'  && 'Try again'}
                  {!saveStatus && (isSaved ? 'Saved' : saveActionLabel)}
                </button>
              ) : (
                <button className="bldr-action-btn bldr-action-btn--login-hint" onClick={handleSaveProject} disabled={!isPersonalized || !hasTestedLatest}>
                  Log in to save
                </button>
              ))}

              <button className="bldr-action-btn bldr-action-btn--new" onClick={handleNewBuild} disabled={editing}>
                New build
              </button>
            </div>

            {onTab('keep') && saveStatus === 'error' && saveError && (
              <p className="bldr-error-inline">{saveError}</p>
            )}

            {/* ── Edit-with-AI panel ─────────────────────────────────────── */}
            {onTab('change') && showEditPanel && (
              <div className="bldr-edit-panel">
                <div className="bldr-edit-panel__header">
                  <span className="bldr-edit-panel__title">What should we change?</span>
                  {promptHistory.length > 0 && (
                    <span className="bldr-edit-panel__badge">We remember {promptHistory.length} change{promptHistory.length > 1 ? 's' : ''}</span>
                  )}
                </div>

                <div className="bldr-edit-panel__guide" role="group" aria-label="How to change your project">
                  <span><b>1</b> Pick an idea</span>
                  <span><b>2</b> Press the purple button</span>
                  <span><b>3</b> Play it again</span>
                </div>

                <div className="bldr-edit-panel__ideas" aria-label="Easy change ideas">
                  {getEasyEditIdeas(projectType).map(idea => (
                    <button
                      key={idea.label}
                      type="button"
                      className="bldr-edit-panel__idea"
                      onClick={() => { setEditInstruction(idea.instruction); setEditError(''); }}
                      disabled={editing}
                    >
                      <span aria-hidden="true">{idea.icon}</span>{idea.label}
                    </button>
                  ))}
                </div>

                <div className="bldr-edit-panel__input-wrap">
                  <label className="bldr-edit-panel__label" htmlFor="codeit-change-box">Or type your own idea</label>
                  <textarea
                    id="codeit-change-box"
                    ref={editRef}
                    className="bldr-edit-panel__textarea"
                    placeholder="Example: Make the game blue and add stars"
                    value={editInstruction}
                    onChange={e => setEditInstruction(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    rows={3}
                    disabled={editing}
                  />
                  <div className="bldr-textarea-hint">Tell CodeIt one change at a time</div>
                </div>

                {editError === 'AI_LIMIT' && (
                  <div className="bldr-edit-panel__pause" role="status">
                    <span className="bldr-edit-panel__pause-icon" aria-hidden="true">🪄</span>
                    <div>
                      <p className="bldr-edit-panel__pause-title">Your project is safe!</p>
                      <p>The magic helper needs a break. Try it again in <strong>{friendlyWait(editRetrySeconds)}</strong>.</p>
                      <p>You can keep playing or change the colors while you wait.</p>
                    </div>
                    <div className="bldr-edit-panel__pause-actions">
                      <button type="button" onClick={() => { setIsPlayMode(true); setHasPlayedOnce(true); setHasTestedLatest(true); setShowEditPanel(false); }}>▶ Play my project</button>
                      <button type="button" onClick={() => { setStudioPanel('colors'); setShowEditPanel(false); }}>🎨 Change colors</button>
                    </div>
                  </div>
                )}

                {editError && editError !== 'AI_LIMIT' && (
                  <div className="bldr-edit-panel__error-block">
                    <p className="bldr-edit-panel__error-main">
                      We could not make that change.{previousCode ? ' Your project is still safe.' : ''}
                    </p>
                    <p className="bldr-edit-panel__error-detail">{editError}</p>
                    {previousCode && (
                      <button className="bldr-edit-panel__restore-btn" onClick={handleUndoEdit} disabled={editing}>
                        Restore last working version
                      </button>
                    )}
                  </div>
                )}

                <div className="bldr-edit-panel__actions">
                  <button
                    className="bldr-edit-panel__apply-btn"
                    onClick={() => applyEdit(editInstruction)}
                    disabled={!editInstruction.trim() || editing || editRetrySeconds > 0}
                  >
                    {editing
                      ? <><span className="bldr-spinner bldr-spinner--btn" />{EDIT_STEPS[editStep] || 'Applying...'}...</>
                      : editRetrySeconds > 0
                        ? `Wait ${friendlyWait(editRetrySeconds)}`
                        : 'Make my change'}
                  </button>

                  {previousCode && !editError && (
                    <button className="bldr-edit-panel__undo-btn" onClick={handleUndoEdit} disabled={editing}>
                      Undo last change
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Version History Panel ──────────────────────────────────────── */}
            {onTab('keep') && showHistory && (
              <div className="bldr-history-panel">
                <div className="bldr-history-panel__header">
                  <span className="bldr-history-panel__title">Version History</span>
                  <div className="bldr-history-panel__header-actions">
                    {savedProjectId && (
                      <button
                        className="bldr-history-save-btn"
                        onClick={() => saveVersionToServer('Manual save')}
                        disabled={historyLoading}
                      >
                        Save snapshot
                      </button>
                    )}
                    {savedProjectId && (
                      <button
                        className="bldr-history-fork-btn"
                        onClick={handleForkProject}
                        title="Duplicate this project"
                      >
                        Duplicate
                      </button>
                    )}
                    {historyLoading && <span className="bldr-spinner bldr-spinner--sm" />}
                  </div>
                </div>

                {allVersions.length === 0 ? (
                  <p className="bldr-history-empty">
                    Versions are auto-saved after each build and edit. Nothing yet.
                  </p>
                ) : (
                  <div className="bldr-history-list">
                    {allVersions.map((version) => {
                      const isCurrent = version.id === activeVersionId;
                      return (
                        <div
                          key={version.id}
                          className={`bldr-version-card${isCurrent ? ' bldr-version-card--current' : ''}`}
                        >
                          <div
                            className="bldr-version-card__swatch"
                            style={{ background: `linear-gradient(135deg, ${version.primary} 0%, ${version.accent} 100%)` }}
                          />
                          <div className="bldr-version-card__body">
                            <div className="bldr-version-card__row">
                              <span className="bldr-version-card__label">{version.label}</span>
                              {isCurrent && (
                                <span className="bldr-version-card__badge">Current</span>
                              )}
                              {!version.isLocal && (
                                <span className="bldr-version-card__badge bldr-version-card__badge--saved">Saved</span>
                              )}
                            </div>
                            <div className="bldr-version-card__meta">
                              {version.title && (
                                <span className="bldr-version-card__name">{version.title}</span>
                              )}
                              <span className="bldr-version-card__time">{timeAgo(version.createdAt)}</span>
                            </div>
                          </div>
                          {!isCurrent && (
                            <button
                              className="bldr-version-card__restore-btn"
                              onClick={() => restoreVersion(version)}
                              disabled={restoringVersion}
                            >
                              {restoringVersion
                                ? <span className="bldr-spinner bldr-spinner--sm" />
                                : 'Restore'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Live Element Editor ──────────────────────────────────────────── */}
            {onTab('change') && editModeOn && (historyCanUndo(editHistory) || historyCanRedo(editHistory)) && (
              <div className="bldr-hand-undo">
                <button
                  className="bldr-hand-undo__btn"
                  onClick={undoHandEdit}
                  disabled={!historyCanUndo(editHistory)}
                  title={historyUndoLabel(editHistory) ? `Undo: ${historyUndoLabel(editHistory)}` : 'Nothing to undo'}
                >
                  ↩ Undo{historyUndoLabel(editHistory) ? ` — ${historyUndoLabel(editHistory)}` : ''}
                </button>
                <button
                  className="bldr-hand-undo__btn bldr-hand-undo__btn--quiet"
                  onClick={redoHandEdit}
                  disabled={!historyCanRedo(editHistory)}
                  title="Redo"
                >
                  ↪ Redo
                </button>
              </div>
            )}

            {onTab('change') && editModeOn && !showElPanel && (
              <div className="bldr-el-hint">
                Click anything in the preview to change it. Drag it to move it.
              </div>
            )}

            {onTab('change') && editModeOn && showElPanel && selectedEl && (
              <div className="bldr-el-panel">
                <div className="bldr-el-panel__header">
                  <span className="bldr-el-panel__title">
                    Editing &lt;{selectedEl.tag}&gt;
                  </span>
                  <button
                    className="bldr-el-panel__close"
                    onClick={() => { setShowElPanel(false); sendBridgeCmd('DESELECT'); }}
                  >
                    ×
                  </button>
                </div>

                <div className="bldr-el-verbs" role="group" aria-label="Change this element">
                  <button
                    className="bldr-el-verb"
                    onClick={() => elementAction('RESIZE', 'Made it bigger', { factor: 1.25 })}
                    title="Make it bigger"
                  >
                    <span aria-hidden="true">＋</span> Bigger
                  </button>
                  <button
                    className="bldr-el-verb"
                    onClick={() => elementAction('RESIZE', 'Made it smaller', { factor: 0.8 })}
                    title="Make it smaller"
                  >
                    <span aria-hidden="true">－</span> Smaller
                  </button>
                  <button
                    className="bldr-el-verb"
                    onClick={() => elementAction('DUPLICATE', 'Made another one')}
                    title="Make another one just like it"
                  >
                    <span aria-hidden="true">⧉</span> Copy
                  </button>
                  <button
                    className="bldr-el-verb bldr-el-verb--danger"
                    onClick={() => elementAction('DELETE', 'Deleted it')}
                    title="Remove it — you can undo this"
                  >
                    <span aria-hidden="true">🗑</span> Delete
                  </button>
                </div>

                <div className="bldr-el-panel__tabs">
                  {selectedEl.isText && (
                    <button
                      className={`bldr-el-tab${elPanelTab === 'text' ? ' bldr-el-tab--active' : ''}`}
                      onClick={() => setElPanelTab('text')}
                    >Text</button>
                  )}
                  <button
                    className={`bldr-el-tab${elPanelTab === 'colors' ? ' bldr-el-tab--active' : ''}`}
                    onClick={() => setElPanelTab('colors')}
                  >Colors</button>
                  <button
                    className={`bldr-el-tab${elPanelTab === 'spacing' ? ' bldr-el-tab--active' : ''}`}
                    onClick={() => setElPanelTab('spacing')}
                  >Spacing</button>
                  <button
                    className={`bldr-el-tab${elPanelTab === 'animation' ? ' bldr-el-tab--active' : ''}`}
                    onClick={() => setElPanelTab('animation')}
                  >Animation</button>
                  <button
                    className={`bldr-el-tab${elPanelTab === 'ai' ? ' bldr-el-tab--active' : ''}`}
                    onClick={() => setElPanelTab('ai')}
                  >Prompt</button>
                </div>

                <div className="bldr-el-panel__body">
                  {elPanelTab === 'text' && selectedEl.isText && (
                    <div className="bldr-el-field">
                      <label className="bldr-el-label">Text content</label>
                      <textarea
                        className="bldr-el-textarea"
                        value={elText}
                        onChange={e => setElText(e.target.value)}
                        rows={3}
                      />
                      <button className="bldr-el-apply-btn" onClick={applyElTextChange}>
                        Apply text
                      </button>
                    </div>
                  )}

                  {elPanelTab === 'colors' && (
                    <div className="bldr-el-field-group">
                      <div className="bldr-el-field">
                        <label className="bldr-el-label">Text color</label>
                        <div className="bldr-el-color-row">
                          <input
                            type="color"
                            className="bldr-el-color-input"
                            value={rgbToHex(elColor)}
                            onChange={e => { setElColor(e.target.value); applyElStyleChange({ color: e.target.value }); }}
                          />
                          <span className="bldr-el-color-val">{elColor}</span>
                        </div>
                      </div>
                      <div className="bldr-el-field">
                        <label className="bldr-el-label">Background color</label>
                        <div className="bldr-el-color-row">
                          <input
                            type="color"
                            className="bldr-el-color-input"
                            value={rgbToHex(elBgColor)}
                            onChange={e => { setElBgColor(e.target.value); applyElStyleChange({ backgroundColor: e.target.value }); }}
                          />
                          <span className="bldr-el-color-val">{elBgColor}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {elPanelTab === 'spacing' && (
                    <div className="bldr-el-field">
                      <label className="bldr-el-label">Padding — {elPadding}px</label>
                      <input
                        type="range"
                        className="bldr-el-range"
                        min={0}
                        max={80}
                        value={elPadding}
                        onChange={e => {
                          setElPadding(e.target.value);
                          applyElStyleChange({ padding: e.target.value + 'px' });
                        }}
                      />
                      <label className="bldr-el-label" style={{ marginTop: 12 }}>Font size — {selectedEl.styles?.fs || '16px'}</label>
                      <input
                        type="range"
                        className="bldr-el-range"
                        min={10}
                        max={72}
                        defaultValue={parseInt(selectedEl.styles?.fs) || 16}
                        onChange={e => applyElStyleChange({ fontSize: e.target.value + 'px' })}
                      />
                    </div>
                  )}

                  {elPanelTab === 'animation' && (
                    <div className="bldr-el-field">
                      <label className="bldr-el-label">Animation preset</label>
                      <div className="bldr-el-anim-grid">
                        {[
                          { label: 'None',   value: '' },
                          { label: 'Pulse',  value: 'pulse 1s infinite' },
                          { label: 'Bounce', value: 'bounce 0.6s infinite' },
                          { label: 'Shake',  value: 'shake 0.5s infinite' },
                          { label: 'Float',  value: 'float 3s ease-in-out infinite' },
                          { label: 'Glow',   value: 'glow 2s infinite' },
                        ].map(a => (
                          <button
                            key={a.value}
                            className={`bldr-el-anim-btn${elAnim === a.value ? ' bldr-el-anim-btn--active' : ''}`}
                            onClick={() => {
                              setElAnim(a.value);
                              applyElStyleChange({ animation: a.value || 'none' });
                            }}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {elPanelTab === 'ai' && (
                    <div className="bldr-el-field">
                      <label className="bldr-el-label">Describe the change for this element</label>
                      <textarea
                        className="bldr-el-textarea"
                        value={aiRefineText}
                        onChange={e => setAiRefineText(e.target.value)}
                        placeholder="e.g. make this button bigger and more colorful, add an emoji, change the wording..."
                        rows={3}
                        disabled={patchLoading}
                      />
                      {patchError && <p className="bldr-el-error">{patchError}</p>}
                      <button
                        className="bldr-el-apply-btn"
                        onClick={handleAiRefine}
                        disabled={!aiRefineText.trim() || patchLoading}
                      >
                        {patchLoading
                          ? <><span className="bldr-spinner bldr-spinner--sm" />Refining...</>
                          : 'Apply described change'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Concepts used by AI */}
            {onTab('learn') && conceptsUsed.length > 0 && (
              <div className="bldr-concepts-used">
                <span className="bldr-concepts-used__label">Concepts in this build:</span>
                <div className="bldr-concepts-used__tags">
                  {conceptsUsed.map(c => (
                    <span key={c} className="bldr-concepts-used__tag">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Lessons used in this build */}
            {onTab('learn') && lessonChips.length > 0 && (
              <div className="bldr-lessons-used">
                <div className="bldr-lessons-used__header">
                  <span className="bldr-lessons-used__title">What you just used</span>
                  <span className="bldr-lessons-used__sub">Each concept below made this build possible — tap to learn how it works</span>
                </div>
                <div className="bldr-lessons-used__chips">
                  {lessonChips.map(lesson => (
                    <div key={lesson.id} className="bldr-lesson-chip">
                      <div className="bldr-lesson-chip__top">
                        <span className="bldr-lesson-chip__num">L{lesson.id}</span>
                        <span className="bldr-lesson-chip__name">{lesson.title}</span>
                      </div>
                      <p className="bldr-lesson-chip__hint">{lesson.hint}</p>
                      <Link to={`/lesson/${lesson.id}`} className="bldr-lesson-chip__learn">
                        Learn this
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            {explainError && <p className="bldr-error-inline">{explainError}</p>}
            {onTab('learn') && explanation && (
              <div className="bldr-explanation">
                <div className="bldr-explanation__label">What this build does</div>
                <p className="bldr-explanation__text">{explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            MOBILE STICKY PLAY BAR
        ════════════════════════════════════════ */}
        {hasResult && (
          <div className="bldr-mobile-play-bar">
            <button
              className="bldr-mobile-play-bar__btn bldr-mobile-play-bar__btn--play"
              onClick={handleTogglePlay}
            >
              {isPlayMode ? 'Compact' : 'Play'}
            </button>
            <button
              className="bldr-mobile-play-bar__btn bldr-mobile-play-bar__btn--edit"
              onClick={() => { setShowEditPanel(p => !p); setEditError(''); if (editModeOn) toggleEditMode(); }}
              disabled={editing}
            >
              Edit
            </button>
            <button
              className="bldr-mobile-play-bar__btn bldr-mobile-play-bar__btn--save"
              onClick={handleSaveOrGuide}
              disabled={saveStatus === 'saving' || isSaved || editing}
              aria-label={user ? 'Save project' : 'Save project to a free account'}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════
            MY SAVED PROJECTS
        ════════════════════════════════════════ */}
        {user && (
          <section id="my-creations" className="bldr-projects" aria-label="My saved projects">
            <div className="bldr-projects__header">
              <h2 className="bldr-projects__title">My Creations</h2>
              {savedProjects.length > 0 && (
                <span className="bldr-projects__count">{savedProjects.length}</span>
              )}
            </div>

            {savedProjects.length > 1 && (
              <div className="bldr-projects__sort">
                {[
                  { id: 'recent',  label: 'All' },
                  { id: 'game',    label: 'Games' },
                  { id: 'website', label: 'Websites' },
                  { id: 'quiz',    label: 'Quizzes' },
                  { id: 'tool',    label: 'Tools' },
                ].map(s => (
                  <button
                    key={s.id}
                    className={`bldr-sort-btn${projectSort === s.id ? ' bldr-sort-btn--active' : ''}`}
                    onClick={() => setProjectSort(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {projectsLoading && (
              <div className="bldr-projects__loading">
                <span className="bldr-spinner" />
                <span>Loading your projects...</span>
              </div>
            )}


            {!projectsLoading && savedProjects.length === 0 && (
              <div className="bldr-projects__loading">
                <span>Your first saved project will appear here. Start above, then save it when you are ready.</span>
              </div>
            )}
            {!projectsLoading && savedProjects.length > 0 && (
              <div className="bldr-projects__grid">
            {projectOpenError && (
              <p className="bldr-error-inline" role="alert">{projectOpenError}</p>
            )}
                {sortedProjects.map(project => (
                  <div key={project.id} className={`bldr-project-card${favoriteIds.has(project.id) ? ' bldr-project-card--fav' : ''}`}>
                    <div
                      className="bldr-project-card__thumb"
                      style={{ background: getProjectGradient(project.project_type) }}
                    >
                      <span className="bldr-project-card__thumb-initials">
                        {project.title.replace(/^(a |an |the )/i, '').slice(0, 2).toUpperCase()}
                      </span>
                      <button
                        className={`bldr-fav-btn${favoriteIds.has(project.id) ? ' bldr-fav-btn--on' : ''}`}
                        onClick={e => { e.stopPropagation(); toggleFavorite(project.id); }}
                        title={favoriteIds.has(project.id) ? 'Remove from favorites' : 'Mark as favorite'}
                        aria-label="Favorite"
                      >
                        {favoriteIds.has(project.id) ? '★' : '☆'}
                      </button>
                    </div>
                    <div className="bldr-project-card__body">
                      <div className="bldr-project-card__type">{project.project_type}</div>
                      <div className="bldr-project-card__name">{project.title}</div>
                      <div className="bldr-project-card__prompt">{project.prompt}</div>
                      <div className="bldr-project-card__date">Updated {timeAgo(project.updated_at || project.created_at)}</div>
                      {project.is_public && project.public_id && (
                        <div className="bldr-project-card__plays">
                          {Number(project.view_count) > 0
                            ? `▶ ${project.view_count} ${Number(project.view_count) === 1 ? 'play' : 'plays'}`
                            : '▶ No plays yet — share your link'}
                          {Number(project.remix_count) > 0 && (
                            <span> · ⤴ {project.remix_count} remixed</span>
                          )}
                        </div>
                      )}
                      <div className={`bldr-project-card__visibility ${
                        project.is_public && project.public_id
                          ? 'bldr-project-card__visibility--live'
                          : 'bldr-project-card__visibility--private'
                      }`}>
                        <span>
                          {project.is_public && project.public_id
                            ? 'Live'
                            : user?.managedProfile ? 'Family private' : 'Private'}
                        </span>
                        <small>
                          {project.is_public && project.public_id
                            ? 'Anyone with the link can play'
                            : user?.managedProfile
                              ? 'Only your family account can open it'
                              : 'Publish when ready · unpublish anytime'}
                        </small>
                      </div>
                    </div>
                    <div className="bldr-project-card__actions">
                      <button
                        className="bldr-project-card__btn bldr-project-card__btn--load"
                        onClick={() => handleLoadProject(project)}
                        disabled={projectOpeningId !== null}
                        aria-busy={projectOpeningId === project.id}
                      >
                        {projectOpeningId === project.id ? 'Opening...' : 'Continue'}
                      </button>
                      {!user?.managedProfile && (
                        <button
                          className={`bldr-project-card__btn ${
                            project.is_public && project.public_id
                              ? 'bldr-project-card__btn--share'
                              : 'bldr-project-card__btn--publish'
                          }`}
                          onClick={() => (
                            project.is_public && project.public_id
                              ? handleShareSavedProject(project)
                              : handlePublishSavedProject(project)
                          )}
                          aria-label={`${
                            project.is_public && project.public_id ? 'Share' : 'Publish'
                          } ${project.title}`}
                          disabled={
                            projectOpeningId !== null
                            || ['publishing', 'sharing'].includes(projectCardAction.status)
                          }
                        >
                          {projectCardAction.id === project.id && projectCardAction.status === 'publishing'
                            ? 'Publishing…'
                            : projectCardAction.id === project.id && projectCardAction.status === 'sharing'
                              ? 'Sharing…'
                              : projectCardAction.id === project.id && projectCardAction.status === 'published'
                                ? 'Published!'
                                : projectCardAction.id === project.id && projectCardAction.status === 'shared'
                                  ? 'Shared!'
                                  : projectCardAction.id === project.id && projectCardAction.status === 'copied'
                                    ? 'Link copied!'
                                    : projectCardAction.id === project.id && projectCardAction.status === 'error'
                                      ? 'Try again'
                                      : project.is_public && project.public_id ? 'Share' : 'Publish'}
                        </button>
                      )}
                      <button
                        className="bldr-project-card__btn bldr-project-card__btn--delete"
                        onClick={() => handleDeleteProject(project.id)}
                        aria-label={`Delete ${project.title}`}
                        disabled={projectOpeningId !== null}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ════════════════════════════════════════
            FIXED DESKTOP CREATOR TOOLBAR
        ════════════════════════════════════════ */}
        {hasResult && !loading && (
          <div className="bldr-creator-toolbar">
            {STUDIO_TOOLS
              .filter(t => t.id !== 'gameplay' || /game|quiz|clicker|runner|memory|reaction/.test(projectType))
              .map(tool => (
                <button
                  key={tool.id}
                  className={`bldr-creator-tool bldr-creator-tool--${tool.id}${studioPanel === tool.id ? ' bldr-creator-tool--active' : ''}`}
                  onClick={() => setStudioPanel(sp => sp === tool.id ? null : tool.id)}
                  disabled={editing}
                  title={tool.desc || tool.label}
                >
                  <span className="bldr-creator-tool__dot" />
                  <span className="bldr-creator-tool__label">{tool.label}</span>
                </button>
              ))}
          </div>
        )}

        {/* XP gain popup */}
        {xpPopup && (
          <div key={xpPopup.id} className="bldr-xp-popup">
            +{xpPopup.amount} XP{xpPopup.reason ? ` — ${xpPopup.reason}` : ''}
          </div>
        )}

        {/* ── AI Companion bubble ───────────────────────────────── */}
        {companionVisible && companionTip && !studioPanel && (
          <div className="bldr-companion">
            <div className="bldr-companion__bubble">
              <p className="bldr-companion__text">{companionTip}</p>
              <button
                className="bldr-companion__close"
                onClick={() => setCompanionVisible(false)}
                aria-label="Dismiss tip"
              >×</button>
            </div>
          </div>
        )}

        {/* ── Wow moment overlay ────────────────────────────────── */}
        {showWow && (
          <div className="bldr-wow-overlay" onClick={() => setShowWow(false)}>
            <div className="bldr-wow-confetti" aria-hidden="true">
              {Array.from({ length: 24 }, (_, i) => (
                <span
                  key={i}
                  className="bldr-wow-particle"
                  style={{
                    left: `${(i * 41 + 7) % 100}%`,
                    animationDelay: `${(i * 0.13) % 1.5}s`,
                    animationDuration: `${1.2 + (i % 5) * 0.28}s`,
                    background: CONFETTI_COLORS[i % 5],
                    width:  `${6 + (i % 4) * 3}px`,
                    height: `${6 + (i % 3) * 3}px`,
                    borderRadius: i % 3 === 0 ? '50%' : '2px',
                  }}
                />
              ))}
            </div>
            <div className="bldr-wow-content">
              <div className="bldr-wow-title">
                {/quiz/.test(wowType)
                  ? 'YOU BUILT A REAL QUIZ'
                  : /game|clicker|runner|memory|reaction/.test(wowType)
                  ? 'YOU BUILT A REAL GAME'
                  : /website|portfolio|restaurant|shop|sports|blog|landing/.test(wowType)
                  ? 'YOU BUILT A REAL WEBSITE'
                  : 'YOU BUILT SOMETHING REAL'}
              </div>
              <p className="bldr-wow-sub">Tap anywhere to continue</p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            PARENT / TRUST STRIP
        ════════════════════════════════════════ */}
        {!code && (
        <section className="bldr-trust" aria-label="About the project studio">
          <div className="bldr-trust__inner">
            <h2 className="bldr-trust__title">
              A guided place to build, change, and understand code
            </h2>
            <p className="bldr-trust__body">
              Start with an idea and get a working first version. Then keep shaping it: change the
              words, colours, layout, and interactions; open the code; save versions; and share only
              when you are ready. Every project runs in an isolated preview.
            </p>
            <div className="bldr-trust__pills">
              {['Beginner-friendly', 'Editable code', 'Private until published', 'Save versions'].map(pill => (
                <span key={pill} className="bldr-trust__pill">{pill}</span>
              ))}
            </div>
          </div>
        </section>
        )}

      </div>
    </>
  );
}
