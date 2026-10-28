// ── The instant game: a recipe becomes a playable game, in the page, now ─────
//
// The child says what they want. The server answers with a short recipe
// (what kind of game, who you are, who the enemies are, how fast). This file
// turns that recipe into a whole game page in the same shape as the starters
// in starterGames.js: a settings block at the top the child can change, a
// HUD, a game-over card with "Play again", a canvas, and a loop. Because it is
// the same shape, everything the studio already does to a starter (the Change
// tab, The code tab, Save, "Send it to a friend", the Learn panel) works on it
// with no special cases.
//
// Nine kinds of game, because children do not only want to shoot and dodge:
//   catch    treasure falls, you catch it and avoid the bad thing
//   dodge    enemies come down, you avoid them and collect treasure
//   shooter  you at the bottom, enemies come down, Space or tap shoots
//   runner   the ground scrolls, you jump over the bad thing, collect treasure
//   flyer    tap to flap and fly through the gaps
//   racer    three lanes, swap lanes to pass the traffic
//   maze     find the way, collect everything, keep away from what roams
//   pop      things appear, tap the good ones before they go
//   pet      look after a pet: feed it, play with it, shoo the pests
//
// The things in a game are the things the child named. A word we have a
// picture for is drawn as that picture (a samosa is a samosa, a fork is a
// fork); a plain sprite name is one of our own drawn sprites (sprites.js),
// which is what a game uses when the child named nothing for that part.
// The game is drawn at the screen's real pixel density, and it has the small
// things that make a game feel like one: a shadow under you, a squash when
// you land, sparks and a floating +1 on a catch, a shake and a red flash on a
// hit, a trail behind every shot, clouds by day and stars at night.

import { EMOJI_TO_SPRITE, spriteTable } from '../Build/sprites';

const CLOSE_SCRIPT = `<${'/'}script>`;

export const RECIPE_KINDS = ['shooter', 'dodge', 'catch', 'runner', 'flyer', 'racer', 'maze', 'pop', 'pet'];
export const RECIPE_TWISTS = ['none', 'faster', 'waves'];
const SKIES = { space: ['#2A1E5C', '#5B3FD6'], night: ['#1E1B3A', '#35220E'], ocean: ['#042F4A', '#0E7490'], candy: ['#FF6B6B', '#FFD6E0'], day: ['#3EB7F8', '#BFE6FF'], sunset: ['#FF7A00', '#FFC93C'] };

const str = (v) => String(v).replace(/\\/g, '').replace(/'/g, '');
// Only the generic things become our drawn sprites (EMOJI_TO_SPRITE in
// sprites.js). A cat stays a cat.

/** The settings block: the first code a child changes. Keep it readable. */
export function recipeSettings(r) {
  const twist = RECIPE_TWISTS.includes(String(r.twist).toLowerCase()) ? String(r.twist).toLowerCase() : 'none';
  return [
    `let gameKind   = '${RECIPE_KINDS.includes(r.kind) ? r.kind : 'catch'}';   // catch, dodge, shooter, runner, flyer, racer, maze, pop or pet`,
    `let gameTitle  = '${str(r.title)}';`,
    `let playerLook = '${str(r.player)}';`,
    `let enemyLook  = '${str(r.enemy)}';`,
    `let treasure   = '${str(r.treasure)}';`,
    `let skyLook    = '${str(r.sky)}';   // space, night, ocean, candy, sunset or day`,
    `let speed      = ${Number(r.speed) || 2};   // 1 is calm, 3 is wild`,
    `let startLives = ${Number(r.lives) || 3};`,
    `let winAt      = ${Number(r.winAt) || 15};`,
    `let twist      = '${twist}';   // none, faster or waves`,
  ].join('\n');
}

/**
 * The powers block: six more lines, each switched on by a power a child has
 * learned on /powers. Every game carries them so a power page can change the
 * child's own game; a game made before a power is learned simply has the
 * off values.
 */
export const POWER_DEFAULTS = { waveSize: 1, pointsPer: 1, speedUpEvery: 0, soundOn: false, levelEvery: 0, bossAt: 0 };
export function recipePowers(r = {}) {
  const num = (k, max) => Math.max(0, Math.min(max, Math.round(Number(r[k]) || POWER_DEFAULTS[k])));
  return [
    `let waveSize     = ${Math.max(1, num('waveSize', 6))};   // Loops: how many bad things each wave`,
    `let pointsPer    = ${Math.max(1, num('pointsPer', 10))};   // Score: points for every catch`,
    `let speedUpEvery = ${num('speedUpEvery', 60)};   // Timers: seconds between speed ups, 0 is never`,
    `let soundOn      = ${r.soundOn === true || r.soundOn === 'true'};   // Sound: a blip on every catch and hit`,
    `let levelEvery   = ${num('levelEvery', 50)};   // Levels: points per level, 0 is no levels`,
    `let bossAt       = ${num('bossAt', 200)};   // Boss: the score where the boss comes, 0 is never`,
  ].join('\n');
}

export function recipeGame(r) {
  const [c1] = SKIES[r.sky] || SKIES.day;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>${str(r.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; overflow: hidden; touch-action: none; font-family: 'Baloo 2', 'Nunito', system-ui, -apple-system, sans-serif; color: #fff; user-select: none; background: ${c1}; }
  canvas { display: block; width: 100vw; height: 100vh; }
  .hud { position: absolute; top: 0; left: 0; right: 0; z-index: 2; display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 14px; font-weight: 800; pointer-events: none; }
  .hud .score { font-size: 26px; color: #FFC93C; text-shadow: 0 2px 0 rgba(0,0,0,.3); line-height: 1; }
  .hud .score.pop { animation: pop .35s cubic-bezier(.2,1.6,.4,1); }
  @keyframes pop { 40% { transform: scale(1.4); } }
  .hud .title { position: absolute; left: 14px; top: 44px; font-size: 12px; color: rgba(255,255,255,.85); }
  .hud .lives { display: flex; gap: 2px; }
  .hud .lives svg { width: 18px; height: 18px; filter: drop-shadow(0 1px 0 rgba(0,0,0,.3)); animation: beat 1.4s ease-in-out infinite; }
  .hud .lives svg:nth-child(2) { animation-delay: .15s; } .hud .lives svg:nth-child(3) { animation-delay: .3s; }
  @keyframes beat { 0%,100% { transform: scale(1); } 30% { transform: scale(1.18); } }
  .tip { position: absolute; left: 0; right: 0; bottom: 10px; text-align: center; font-size: 13px; opacity: .85; pointer-events: none; text-shadow: 0 1px 4px rgba(0,0,0,.45); font-family: 'Nunito', system-ui, sans-serif; font-weight: 700; }
  .over { position: absolute; inset: 0; z-index: 3; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: rgba(53,34,14,.55); backdrop-filter: blur(6px); text-align: center; padding: 24px; }
  .over h2 { margin: 0; font-size: 34px; font-weight: 800; }
  .over p { margin: 0 0 8px; font-size: 17px; opacity: .9; font-family: 'Nunito', system-ui, sans-serif; font-weight: 700; }
  .over button { border: 0; border-radius: 999px; height: 46px; padding: 0 22px; font-size: 16px; font-weight: 800; color: #35220E; background: #FFFDFA; box-shadow: 0 3px 0 rgba(53,34,14,.25); cursor: pointer; font-family: 'Nunito', system-ui, sans-serif; }
  .over button:active { transform: translateY(3px); box-shadow: none; }
  @media (prefers-reduced-motion: reduce) { .hud .lives svg, .hud .score.pop { animation: none; } }
</style>
</head>
<body>

<div class="hud"><div><span class="score" id="scoreLabel">0</span><span class="title" id="titleLabel">${str(r.title)}</span></div><span class="lives" id="livesLabel"></span></div>
<canvas id="screen"></canvas>
<p class="tip" id="tip"></p>

<div class="over" id="gameOver">
  <h2 id="overTitle">Game over</h2>
  <p>Your score: <b id="finalScore">0</b></p>
  <button onclick="startGame()">Play again</button>
</div>

<script>
// ── Change these and watch what happens ──
${recipeSettings(r)}

// ── Powers: each line wakes up when you learn it ──
${recipePowers(r)}

// You, in the game: if CodeIt handed us your avatar and your idea did not
// name a player, you are the player. A bunny you asked for stays a bunny.
let playerImg = null;
if (window.CODEIT_PLAYER_SPRITE && playerLook === 'hero') {
  playerImg = new Image();
  playerImg.src = window.CODEIT_PLAYER_SPRITE;
}

// ── The drawn things ──
const SPRITES = ${JSON.stringify(spriteTable())};
const EMOJI = ${JSON.stringify(EMOJI_TO_SPRITE)};
const SKIES = ${JSON.stringify(SKIES)};
const MINT = '#17C08B', SUN = '#FFC93C', CORAL = '#FF6B6B';
const imageCache = {};
// A picture the child named, drawn once onto its own little canvas so it
// moves, spins and casts a shadow exactly like our sprites do.
function emojiImage(look) {
  const key = 'emoji:' + look;
  if (imageCache[key]) return imageCache[key];
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '104px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';
  g.fillText(look, 64, 72);
  imageCache[key] = c;
  return c;
}
function spriteFor(look, fallback) {
  const v = String(look || '').trim();
  let name = SPRITES[v] ? v : (EMOJI[v] || null);
  if (!name && /[^\\x00-\\x7F]/.test(v)) return emojiImage(v);
  if (!name) { const low = v.toLowerCase(); name = Object.keys(SPRITES).find(function(n) { return low.indexOf(n) >= 0; }) || fallback; }
  if (!imageCache[name]) { imageCache[name] = new Image(); imageCache[name].src = SPRITES[name]; }
  return imageCache[name];
}

const canvas = document.getElementById('screen');
const pen = canvas.getContext('2d');
let width = 0, height = 0, dpr = 1;
let score = 0, lives = 3, playing = false;
let playerX = 0, playerY = 0, jumpSpeed = 0, squash = 1;
let things = [], shots = [], parts = [], pops = [], clouds = [], ticks = 0, spawnClock = 0, shake = 0, flash = 0;
let pointerX = null, pointerY = null;
let safe = 0;                                   // a moment of safety after a hit
let flyY = 0, flyV = 0;                         // flyer
let lane = 1;                                   // racer
let maze = null, mazeMe = null, mazeGoods = [], mazeFoes = [], wantDir = null, swipe = null;   // maze
let food = 100, fun = 100, petHop = 0, buttons = [];   // pet
let level = 1, bossCame = false, audio = null;
const keys = {};

function fitScreen() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  width = window.innerWidth; height = window.innerHeight;
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  pen.imageSmoothingQuality = 'high';
}
window.addEventListener('resize', function() { fitScreen(); if (gameKind === 'maze' && playing) buildMaze(); });
fitScreen();

function tipText() {
  if (gameKind === 'shooter') return 'Move with the mouse or arrows. Space or tap to shoot.';
  if (gameKind === 'runner') return 'Space or tap to jump. Collect the treasure.';
  if (gameKind === 'catch') return 'Catch the treasure. Not the bad things.';
  if (gameKind === 'flyer') return 'Tap or press space to flap. Fly through the gaps.';
  if (gameKind === 'racer') return 'Tap left or right, or use the arrows, to change lanes.';
  if (gameKind === 'maze') return 'Arrows or swipe to move. Collect everything, keep away from the rest.';
  if (gameKind === 'pop') return 'Tap the treasure before it goes. Not the bad ones.';
  if (gameKind === 'pet') return 'Feed it and play with it. Tap the pests away.';
  return 'Dodge the bad things. Collect the treasure.';
}

function startGame() {
  score = 0; lives = startLives; playing = true;
  things = []; shots = []; parts = []; pops = []; ticks = 0; spawnClock = 0; shake = 0; flash = 0; squash = 1; level = 1; bossCame = false;
  clouds = [0, 1, 2, 3].map(function(i) { return { x: i * (width / 3) + 40, y: 60 + (i % 2) * 70, s: 0.6 + (i % 3) * 0.25 }; });
  playerX = width / 2; playerY = height - 120; jumpSpeed = 0;
  safe = 0; flyY = height / 2; flyV = 0; lane = 1; wantDir = null; food = 100; fun = 100; petHop = 0;
  if (gameKind === 'racer') playerX = laneCenter(1);
  if (gameKind === 'maze') buildMaze();
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('titleLabel').textContent = gameTitle;
  document.getElementById('tip').textContent = tipText();
  updateHud();
}

const HEART = '<svg viewBox="0 0 24 24"><path fill="#FF6B6B" d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z"/></svg>';
function updateHud() {
  const s = document.getElementById('scoreLabel');
  if (s.textContent !== String(score)) { s.textContent = score; s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop'); }
  const t = document.getElementById('titleLabel');
  if (t) t.textContent = levelEvery > 0 ? gameTitle + ' · Level ' + level : gameTitle;
  const n = Math.max(0, lives);
  const l = document.getElementById('livesLabel');
  if (l.children.length !== n) { let h = ''; for (let i = 0; i < n; i += 1) h += HEART; l.innerHTML = h; }
}

function endGame(won) {
  playing = false;
  document.getElementById('overTitle').textContent = won ? 'You win!' : 'Game over';
  document.getElementById('overTitle').style.color = won ? MINT : CORAL;
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOver').style.display = 'flex';
  if (window.parent) window.parent.postMessage({ type: won ? 'CODEIT_WON' : 'CODEIT_LOST', score: score }, '*');
}

function shoot() {
  if (!playing || gameKind !== 'shooter') return;
  shots.push({ x: playerX, y: height - 90 });
}

function jump() {
  if (!playing || gameKind !== 'runner') return;
  if (playerY >= height - 120) { jumpSpeed = -16; squash = 1.3; }
}

function sparks(x, y, colours, n, up) {
  for (let k = 0; k < n; k += 1) parts.push({ x: x, y: y, vx: (Math.random() - 0.5) * 9, vy: up ? -Math.random() * 7 - 1 : (Math.random() - 0.5) * 9, l: 1, c: colours[k % colours.length] });
}

function drawSprite(img, x, y, size, rotation) {
  if (!img) return;
  if (img.tagName !== 'CANVAS' && (!img.complete || !img.naturalWidth)) return;
  pen.save(); pen.translate(x, y); pen.rotate(rotation || 0);
  pen.shadowColor = 'rgba(0,0,0,.25)'; pen.shadowBlur = 10; pen.shadowOffsetY = 6;
  pen.drawImage(img, -size / 2, -size / 2, size, size);
  pen.restore();
}

function drawPlayer(x, y) {
  const air = gameKind === 'runner' ? Math.max(0, (height - 120) - y) : 0;
  pen.fillStyle = 'rgba(0,0,0,.18)'; pen.beginPath(); pen.ellipse(x, height - 62, 30 - air * 0.05, 8 - air * 0.02, 0, 0, 7); pen.fill();
  const bob = (gameKind === 'runner' && y < height - 120) ? 0 : Math.sin(ticks / 9) * 2.5;
  pen.save(); pen.translate(x, y + bob); pen.scale(2 - squash, squash); pen.translate(-x, -(y + bob));
  if (playerImg && playerImg.complete && playerImg.naturalWidth) {
    pen.save(); pen.shadowColor = 'rgba(0,0,0,.25)'; pen.shadowBlur = 10; pen.shadowOffsetY = 6; pen.drawImage(playerImg, x - 32, y + bob - 32, 64, 64); pen.restore();
  } else {
    drawSprite(spriteFor(playerLook, 'hero'), x, y + bob, 72, 0);
  }
  pen.restore();
}

function addThing() {
  const bad = gameKind === 'catch' ? Math.random() < 0.25 : gameKind === 'runner' ? Math.random() < 0.7 : Math.random() < 0.8;
  const burst = Math.max(twist === 'waves' ? 3 : 1, Math.min(6, waveSize | 0));
  for (let k = 0; k < burst; k += 1) {
    if (gameKind === 'runner') {
      things.push({ x: width + 40 + k * 90, y: bad ? height - 110 : height - 200 - Math.random() * 60, bad: bad, vy: 0, spin: 0 });
    } else {
      things.push({ x: 60 + Math.random() * (width - 120), y: -40 - k * 60, bad: bad, vy: (2 + currentSpeed() * 1.2) * (0.7 + Math.random() * 0.6), spin: Math.random() * 6 });
    }
  }
}

function currentSpeed() {
  let s = speed + (twist === 'faster' ? score / 8 : 0);
  if (speedUpEvery > 0) s += Math.floor(ticks / 60 / speedUpEvery) * 0.5;   // Timers: every N seconds, a little faster
  if (levelEvery > 0) s += (level - 1) * 0.4;                                 // Levels: each level is a little faster
  return s;
}

// ── Sound: a tiny blip, made from nothing, only when soundOn is true ──
function blip(good) {
  if (!soundOn) return;
  try {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = good ? 'triangle' : 'square';
    o.frequency.setValueAtTime(good ? 660 : 160, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(good ? 990 : 80, audio.currentTime + 0.12);
    g.gain.setValueAtTime(0.08, audio.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
    o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.2);
  } catch (e) { /* no sound is still a game */ }
}

// ── Score and Levels: every point goes through here ──
function scorePoints() {
  score += Math.max(1, pointsPer | 0);
  if (levelEvery > 0) {
    const next = Math.floor(score / levelEvery) + 1;
    if (next > level) { level = next; flash = 0; pops.push({ x: width / 2, y: height / 2 + pops.filter(function(p) { return p.text; }).length * 56, l: 1.4, text: 'Level ' + level }); }
  }
  if (bossAt > 0 && !bossCame && score >= bossAt) {
    bossCame = true;
    if (gameKind === 'maze') mazeFoes.push(newFoe(true));
    else if (gameKind === 'flyer' || gameKind === 'racer' || gameKind === 'pop' || gameKind === 'pet') things.push({ x: width + 80, y: height * 0.42, bad: true, boss: true, hp: 3, vx: -(1.6 + currentSpeed() * 0.4), spin: 0 });
    else things.push({ x: width / 2, y: -80, bad: true, boss: true, hp: 3, vy: 1.2 + currentSpeed() * 0.4, spin: 0 });
    pops.push({ x: width / 2, y: height / 2 + pops.filter(function(p) { return p.text; }).length * 56, l: 1.4, text: 'Boss!' });
  }
  if (score >= winAt) endGame(true);
}

function hit(thing) {
  if (thing.bad && safe > 0) return;
  thing.gone = true;
  if (thing.bad) {
    if (gameKind === 'flyer' || gameKind === 'racer' || gameKind === 'maze' || gameKind === 'pet') safe = 50;
    lives -= 1; shake = 10; flash = 6; squash = 0.7; blip(false);
    sparks(thing.x, thing.y, [CORAL], 10, false);
    if (lives <= 0) endGame(false);
  } else {
    squash = 1.25; blip(true);
    pops.push({ x: thing.x, y: thing.y, l: 1 });
    sparks(thing.x, thing.y, [SUN, MINT, '#fff'], 12, true);
    scorePoints();
  }
  updateHud();
}

// ── Catch, dodge, shooter and runner: things come at you ──
function stepClassic() {
  if (playing) {
    if (gameKind === 'runner') {
      jumpSpeed += 0.9; playerY += jumpSpeed;
      if (playerY > height - 120) { playerY = height - 120; jumpSpeed = 0; }
      playerX = Math.min(160, width * 0.25);
    } else {
      if (keys.ArrowLeft || keys.a) playerX -= 7 + speed;
      if (keys.ArrowRight || keys.d) playerX += 7 + speed;
      if (pointerX !== null) playerX += (pointerX - playerX) * 0.2;
      playerX = Math.max(40, Math.min(width - 40, playerX));
      playerY = height - 100;
    }
    spawnClock += 1;
    const sp = currentSpeed();
    const every = gameKind === 'runner' ? Math.max(50, 120 - sp * 15 - score * 2) : Math.max(18, 60 - sp * 10 - score);
    if (spawnClock > every) { spawnClock = 0; addThing(); }
  }

  const enemyImg = spriteFor(enemyLook, 'rock'), goodImg = spriteFor(treasure, 'gem');
  for (const thing of things) {
    if (playing) {
      if (gameKind === 'runner') thing.x -= 6 + currentSpeed() * 2; else thing.y += thing.vy;
    }
    thing.spin += 0.02;
    drawSprite(thing.bad ? enemyImg : goodImg, thing.x, thing.y, thing.boss ? 120 : 52, (gameKind === 'shooter' || gameKind === 'runner') ? 0 : thing.spin);
    if (playing && !thing.gone) {
      const near = thing.boss ? 70 : 42;
      const dx = Math.abs(thing.x - playerX), dy = Math.abs(thing.y - playerY);
      if (dx < near && dy < near) hit(thing);
      if (gameKind === 'shooter' && thing.bad && thing.y > height - 40) { thing.bad = true; hit(thing); }
    }
  }

  for (const shot of shots) {
    shot.y -= 14;
    pen.fillStyle = 'rgba(255,201,60,.35)'; pen.beginPath(); pen.roundRect(shot.x - 3, shot.y, 6, 40, 3); pen.fill();
    pen.fillStyle = SUN; pen.beginPath(); pen.roundRect(shot.x - 4, shot.y - 14, 8, 26, 4); pen.fill();
    for (const thing of things) {
      const reach = thing.boss ? 60 : 32;
      if (thing.bad && !thing.gone && Math.abs(thing.x - shot.x) < reach && Math.abs(thing.y - shot.y) < reach) {
        shot.gone = true; blip(true);
        if (thing.boss && thing.hp > 1) { thing.hp -= 1; shake = 6; sparks(thing.x, thing.y, [SUN], 6, false); continue; }
        thing.gone = true; pops.push({ x: thing.x, y: thing.y, l: 1 }); sparks(thing.x, thing.y, [SUN, '#FF7A00', '#fff'], thing.boss ? 30 : 12, false); scorePoints(); updateHud();
      }
    }
  }
  shots = shots.filter(function(s) { return s.y > -30 && !s.gone; });
  things = things.filter(function(t) { return !t.gone && t.y < height + 60 && t.x > -60; });

  squash += (1 - squash) * 0.18;
  drawPlayer(playerX, playerY);
}

// ── A big enemy that drifts across: the boss in the newer kinds ──
function stepDrifter(t, img) {
  if (playing) { t.x += t.vx; t.y = height * 0.42 + Math.sin(ticks / 24) * height * 0.18; }
  drawSprite(img, t.x, t.y, 120, Math.sin(ticks / 15) * 0.1);
  if (playing && !t.gone && gameKind !== 'pop' && Math.abs(t.x - playerX) < 66 && Math.abs(t.y - playerY) < 66) hit({ bad: true, x: playerX, y: playerY });
  if (t.x < -150) t.gone = true;
}

// ── Fly: tap to flap through the gaps ──
function flap() {
  if (!playing || gameKind !== 'flyer') return;
  flyV = -7.2 - speed * 0.3; squash = 1.25; blip(true);
}
function addGate() {
  const ground = height - 60;
  const gap = Math.max(150, 240 - currentSpeed() * 14);
  const middle = 110 + Math.random() * Math.max(40, ground - 220);
  things.push({ gate: true, x: width + 40, top: middle - gap / 2, bottom: middle + gap / 2 });
  const burst = Math.max(twist === 'waves' ? 2 : 1, Math.min(4, waveSize | 0));
  for (let k = 0; k < burst; k += 1) things.push({ x: width + 40 + k * 56, y: middle, bad: false });
}
function stepFlyer() {
  const ground = height - 60;
  playerX = Math.min(180, width * 0.28);
  if (playing) {
    flyV += 0.42; flyY += flyV;
    if (flyY < 30) { flyY = 30; flyV = 0; }
    if (flyY > ground - 34) { flyY = ground - 34; flyV = -6; hit({ bad: true, x: playerX, y: flyY }); }
    spawnClock += 1;
    if (spawnClock > Math.max(64, 128 - currentSpeed() * 12)) { spawnClock = 0; addGate(); }
  }
  playerY = flyY;
  const enemyImg = spriteFor(enemyLook, 'rock'), goodImg = spriteFor(treasure, 'gem');
  for (const t of things) {
    if (t.boss) { stepDrifter(t, enemyImg); continue; }
    if (playing) t.x -= 3 + currentSpeed() * 1.1;
    if (t.gate) {
      for (let y = t.top - 26; y > -30; y -= 50) drawSprite(enemyImg, t.x, y, 50, 0);
      for (let y = t.bottom + 26; y < ground + 10; y += 50) drawSprite(enemyImg, t.x, y, 50, 0);
      if (playing && !t.hurt && Math.abs(t.x - playerX) < 40 && (flyY < t.top + 10 || flyY > t.bottom - 10)) { t.hurt = true; hit({ bad: true, x: playerX, y: flyY }); }
      if (playing && !t.passed && t.x < playerX - 44) { t.passed = true; if (!t.hurt) { scorePoints(); updateHud(); } }
    } else {
      drawSprite(goodImg, t.x, t.y + Math.sin((ticks + t.x) / 14) * 6, 44, 0);
      if (playing && !t.gone && Math.abs(t.x - playerX) < 34 && Math.abs(t.y - flyY) < 34) hit(t);
    }
  }
  things = things.filter(function(t) { return !t.gone && t.x > -90; });
  squash += (1 - squash) * 0.18;
  pen.save(); pen.translate(playerX, flyY); pen.rotate(Math.max(-0.5, Math.min(0.7, flyV / 14))); pen.translate(-playerX, -flyY);
  if (!(safe > 0 && Math.floor(ticks / 4) % 2)) drawLook(playerX, flyY, 68);
  pen.restore();
}

// ── Race: three lanes, swap to pass the traffic ──
function road() { const w = Math.min(width * 0.86, 460); return { left: (width - w) / 2, w: w }; }
function laneCenter(i) { const r = road(); return r.left + r.w * (i + 0.5) / 3; }
function steer(dir) {
  if (!playing || gameKind !== 'racer') return;
  lane = Math.max(0, Math.min(2, lane + dir)); squash = 1.15; blip(true);
}
function stepRacer() {
  const r = road();
  const grass = skyLook === 'space' || skyLook === 'night' ? '#241A4A' : MINT;
  pen.fillStyle = grass; pen.fillRect(-20, -20, width + 40, height + 40);
  pen.fillStyle = 'rgba(53,34,14,.82)'; pen.fillRect(r.left, -20, r.w, height + 40);
  pen.fillStyle = '#FFFDFA'; pen.fillRect(r.left - 6, -20, 6, height + 40); pen.fillRect(r.left + r.w, -20, 6, height + 40);
  const run = playing ? (ticks * (4 + currentSpeed() * 1.6)) % 60 : 0;
  pen.fillStyle = 'rgba(255,201,60,.9)';
  for (let i = 1; i < 3; i += 1) for (let y = -60 + run; y < height; y += 60) pen.fillRect(r.left + r.w * i / 3 - 3, y, 6, 30);
  playerY = height - 110;
  if (playing) {
    playerX += (laneCenter(lane) - playerX) * 0.25;
    spawnClock += 1;
    if (spawnClock > Math.max(26, 66 - currentSpeed() * 8)) {
      spawnClock = 0;
      const lanes = [0, 1, 2].sort(function() { return Math.random() - 0.5; });
      const cars = Math.min(2, Math.max(twist === 'waves' ? 2 : 1, waveSize | 0));
      for (let k = 0; k < cars; k += 1) things.push({ lane: lanes[k], x: laneCenter(lanes[k]), y: -60, bad: true, vy: 4 + currentSpeed() * 1.4 });
      if (Math.random() < 0.45) things.push({ lane: lanes[2], x: laneCenter(lanes[2]), y: -60, bad: false, vy: 4 + currentSpeed() * 1.4 });
    }
  }
  const enemyImg = spriteFor(enemyLook, 'rock'), goodImg = spriteFor(treasure, 'gem');
  for (const t of things) {
    if (t.boss) { stepDrifter(t, enemyImg); continue; }
    if (playing) t.y += t.vy;
    t.x = laneCenter(t.lane);
    drawSprite(t.bad ? enemyImg : goodImg, t.x, t.y, t.bad ? 64 : 46, 0);
    if (playing && !t.gone && Math.abs(t.x - playerX) < 36 && Math.abs(t.y - playerY) < 48) hit(t);
    if (playing && t.bad && !t.gone && !t.passed && t.y > playerY + 50) { t.passed = true; scorePoints(); updateHud(); }
  }
  things = things.filter(function(t) { return !t.gone && t.y < height + 80 && t.x > -160; });
  squash += (1 - squash) * 0.18;
  if (!(safe > 0 && Math.floor(ticks / 4) % 2)) drawLook(playerX, playerY, 70);
}

// ── Maze: find the way, collect everything ──
const STEP = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];   // dx, dy, this wall, the wall opposite
function buildMaze() {
  const top = 72, bottom = 58;
  const cell = Math.max(34, Math.min(64, Math.floor(Math.min((width - 24) / 9, (height - top - bottom) / 11))));
  const cols = Math.max(5, Math.floor((width - 24) / cell)), rows = Math.max(5, Math.floor((height - top - bottom) / cell));
  const walls = []; const seen = [];
  for (let i = 0; i < cols * rows; i += 1) { walls.push(15); seen.push(false); }
  const stack = [0]; seen[0] = true;
  while (stack.length) {
    const at = stack[stack.length - 1], c = at % cols, r = Math.floor(at / cols);
    const open = STEP.filter(function(d) { const nc = c + d[0], nr = r + d[1]; return nc >= 0 && nr >= 0 && nc < cols && nr < rows && !seen[nr * cols + nc]; });
    if (!open.length) { stack.pop(); continue; }
    const d = open[Math.floor(Math.random() * open.length)], next = (r + d[1]) * cols + c + d[0];
    walls[at] &= ~d[2]; walls[next] &= ~d[3]; seen[next] = true; stack.push(next);
  }
  // A few extra openings, so there is more than one way round a monster.
  for (let k = 0; k < Math.floor(cols * rows / 7); k += 1) {
    const at = Math.floor(Math.random() * cols * rows), c = at % cols, r = Math.floor(at / cols);
    const d = STEP[1 + Math.floor(Math.random() * 2)], nc = c + d[0], nr = r + d[1];
    if (nc < cols && nr < rows) { walls[at] &= ~d[2]; walls[nr * cols + nc] &= ~d[3]; }
  }
  maze = { cols: cols, rows: rows, cell: cell, walls: walls, ox: (width - cols * cell) / 2, oy: top + (height - top - bottom - rows * cell) / 2 };
  mazeMe = { c: 0, r: 0, fc: 0, fr: 0, t: 1 };
  mazeGoods = [];
  const want = Math.min(10, 4 + level + Math.max(0, (waveSize | 0) - 1));
  while (mazeGoods.length < want) {
    const c = Math.floor(Math.random() * cols), r = Math.floor(Math.random() * rows);
    if ((c + r > 2) && !mazeGoods.some(function(g) { return g.c === c && g.r === r; })) mazeGoods.push({ c: c, r: r });
  }
  mazeFoes = [];
  const foes = Math.max(1, Math.min(5, Math.round(speed) + Math.max(0, (waveSize | 0) - 1) + (twist === 'waves' ? 1 : 0)));
  for (let k = 0; k < foes; k += 1) mazeFoes.push(newFoe(false));
}
function newFoe(boss) {
  const c = maze.cols - 1 - Math.floor(Math.random() * Math.ceil(maze.cols / 2)), r = maze.rows - 1 - Math.floor(Math.random() * Math.ceil(maze.rows / 2));
  return { c: c, r: r, fc: c, fr: r, t: 1, dir: 0, boss: boss };
}
function cellX(c) { return maze.ox + (c + 0.5) * maze.cell; }
function cellY(r) { return maze.oy + (r + 0.5) * maze.cell; }
function canGo(c, r, d) { return !(maze.walls[r * maze.cols + c] & STEP[d][2]); }
function moveMaker(m, d) { m.fc = m.c; m.fr = m.r; m.c += STEP[d][0]; m.r += STEP[d][1]; m.t = 0; }
function stepMaze() {
  if (!maze) buildMaze();
  const cell = maze.cell, dark = skyLook === 'space' || skyLook === 'night';
  pen.fillStyle = dark ? 'rgba(255,255,255,.06)' : 'rgba(255,253,250,.55)';
  pen.beginPath(); pen.roundRect(maze.ox - 8, maze.oy - 8, maze.cols * cell + 16, maze.rows * cell + 16, 16); pen.fill();
  pen.strokeStyle = dark ? 'rgba(255,255,255,.8)' : 'rgba(53,34,14,.75)'; pen.lineWidth = Math.max(4, cell * 0.12); pen.lineCap = 'round';
  pen.beginPath();
  for (let r = 0; r < maze.rows; r += 1) for (let c = 0; c < maze.cols; c += 1) {
    const w = maze.walls[r * maze.cols + c], x = maze.ox + c * cell, y = maze.oy + r * cell;
    if (w & 1) { pen.moveTo(x, y); pen.lineTo(x + cell, y); }
    if (w & 8) { pen.moveTo(x, y); pen.lineTo(x, y + cell); }
    if (r === maze.rows - 1 && (w & 4)) { pen.moveTo(x, y + cell); pen.lineTo(x + cell, y + cell); }
    if (c === maze.cols - 1 && (w & 2)) { pen.moveTo(x + cell, y); pen.lineTo(x + cell, y + cell); }
  }
  pen.stroke();
  const goodImg = spriteFor(treasure, 'gem'), enemyImg = spriteFor(enemyLook, 'rock');
  for (const g of mazeGoods) drawSprite(goodImg, cellX(g.c), cellY(g.r) + Math.sin((ticks + g.c * 7) / 12) * 3, cell * 0.56, 0);
  const frames = Math.max(5, 12 - speed * 2);
  if (playing) {
    if (mazeMe.t >= 1) {
      const held = keys.ArrowUp || keys.w ? 0 : keys.ArrowRight || keys.d ? 1 : keys.ArrowDown || keys.s ? 2 : keys.ArrowLeft || keys.a ? 3 : null;
      const d = held !== null ? held : wantDir;
      if (d !== null && canGo(mazeMe.c, mazeMe.r, d)) { moveMaker(mazeMe, d); if (held === null) wantDir = null; }
      else if (held === null && d !== null && !canGo(mazeMe.c, mazeMe.r, d)) wantDir = null;
    } else {
      mazeMe.t = Math.min(1, mazeMe.t + 1 / frames);
      if (mazeMe.t >= 1) {
        const at = mazeGoods.findIndex(function(g) { return g.c === mazeMe.c && g.r === mazeMe.r; });
        if (at >= 0) { mazeGoods.splice(at, 1); hit({ bad: false, x: cellX(mazeMe.c), y: cellY(mazeMe.r) }); }
        if (playing && !mazeGoods.length) { pops.push({ x: width / 2, y: height / 2, l: 1.4, text: 'New maze!' }); buildMaze(); }
      }
    }
    for (const f of mazeFoes) {
      if (f.t >= 1) {
        const ways = [0, 1, 2, 3].filter(function(d) { return canGo(f.c, f.r, d); });
        const back = (f.dir + 2) % 4;
        let choice = ways.filter(function(d) { return d !== back; });
        if (!choice.length) choice = ways;
        if (Math.random() < 0.35) {
          const toward = choice.filter(function(d) { return Math.sign(mazeMe.c - f.c) === STEP[d][0] && STEP[d][0] !== 0 || Math.sign(mazeMe.r - f.r) === STEP[d][1] && STEP[d][1] !== 0; });
          if (toward.length) choice = toward;
        }
        f.dir = choice[Math.floor(Math.random() * choice.length)];
        moveMaker(f, f.dir);
      } else f.t = Math.min(1, f.t + 1 / Math.max(8, (f.boss ? 14 : 22) - speed * 2 - level));
    }
  }
  const me = { x: cellX(mazeMe.fc) + (cellX(mazeMe.c) - cellX(mazeMe.fc)) * mazeMe.t, y: cellY(mazeMe.fr) + (cellY(mazeMe.r) - cellY(mazeMe.fr)) * mazeMe.t };
  playerX = me.x; playerY = me.y;
  for (const f of mazeFoes) {
    const fx = cellX(f.fc) + (cellX(f.c) - cellX(f.fc)) * f.t, fy = cellY(f.fr) + (cellY(f.r) - cellY(f.fr)) * f.t;
    drawSprite(enemyImg, fx, fy, cell * (f.boss ? 1.1 : 0.72), 0);
    if (playing && Math.abs(fx - me.x) < cell * 0.55 && Math.abs(fy - me.y) < cell * 0.55 && safe <= 0) {
      hit({ bad: true, x: me.x, y: me.y });
      mazeMe = { c: 0, r: 0, fc: 0, fr: 0, t: 1 }; wantDir = null;
    }
  }
  squash += (1 - squash) * 0.18;
  if (!(safe > 0 && Math.floor(ticks / 4) % 2)) drawLook(me.x, me.y, cell * 0.82);
}

// ── Pop: tap the good things before they go ──
function addPops() {
  const n = Math.max(twist === 'waves' ? 2 : 1, Math.min(4, waveSize | 0));
  for (let k = 0; k < n; k += 1) things.push({ x: 50 + Math.random() * (width - 100), y: 110 + Math.random() * Math.max(60, height - 240), bad: Math.random() < 0.25, age: 0, life: Math.max(55, 150 - currentSpeed() * 22) });
}
function tapAt(x, y) {
  if (!playing || gameKind !== 'pop') return;
  for (let i = things.length - 1; i >= 0; i -= 1) {
    const t = things[i], reach = t.boss ? 70 : 42;
    if (t.gone || Math.abs(t.x - x) > reach || Math.abs(t.y - y) > reach) continue;
    if (t.boss) { t.hp -= 1; shake = 6; sparks(t.x, t.y, [SUN], 10, false); blip(true); if (t.hp <= 0) { t.gone = true; sparks(t.x, t.y, [SUN, '#FF7A00', '#fff'], 30, false); pops.push({ x: t.x, y: t.y, l: 1 }); scorePoints(); updateHud(); } return; }
    hit(t); return;
  }
  sparks(x, y, ['rgba(255,255,255,.7)'], 4, false);
}
function popOldest() {
  const t = things.find(function(x) { return !x.gone && !x.bad && !x.boss; });
  if (t) tapAt(t.x, t.y);
}
function stepPop() {
  if (playing) { spawnClock += 1; if (spawnClock > Math.max(16, 54 - currentSpeed() * 8)) { spawnClock = 0; addPops(); } }
  const enemyImg = spriteFor(enemyLook, 'rock'), goodImg = spriteFor(treasure, 'gem');
  for (const t of things) {
    if (t.boss) { stepDrifter(t, enemyImg); continue; }
    if (playing) t.age += 1;
    const grow = Math.min(1, t.age / 8), fade = t.age > t.life - 12 ? Math.max(0, (t.life - t.age) / 12) : 1;
    drawSprite(t.bad ? enemyImg : goodImg, t.x, t.y, 66 * grow * (0.55 + 0.45 * fade), Math.sin((ticks + t.x) / 12) * 0.15);
    if (t.age > t.life) t.gone = true;
  }
  things = things.filter(function(t) { return !t.gone; });
  if (pointerX !== null && pointerY !== null) { pen.save(); pen.globalAlpha = 0.9; drawSprite(spriteFor(playerLook, 'hero'), pointerX + 18, pointerY + 18, 44, -0.3 + squash - 1); pen.restore(); }
  squash += (1 - squash) * 0.2;
}

// ── Pet: feed it, play with it, shoo the pests ──
function feedPet() { if (!playing || gameKind !== 'pet') return; things.push({ food: true, x: width / 2 + (Math.random() - 0.5) * 60, y: -30, vy: 3 + speed }); blip(true); }
function playPet() { if (!playing || gameKind !== 'pet' || petHop > 0) return; petHop = 40; fun = Math.min(100, fun + 24); scorePoints(); updateHud(); blip(true); sparks(width / 2, height - 210, [SUN, MINT, '#fff'], 14, true); }
function tapPet(x, y) {
  if (!playing || gameKind !== 'pet') return false;
  for (const b of buttons) if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) { b.go(); return true; }
  for (const t of things) {
    const reach = t.boss ? 70 : 44;
    if ((t.pest || t.boss) && !t.gone && Math.abs(t.x - x) < reach && Math.abs(t.y - y) < reach) {
      if (t.boss && t.hp > 1) { t.hp -= 1; shake = 6; sparks(t.x, t.y, [SUN], 8, false); return true; }
      t.gone = true; sparks(t.x, t.y, [SUN, '#fff'], 10, false); pops.push({ x: t.x, y: t.y, l: 1 }); scorePoints(); updateHud(); return true;
    }
  }
  return false;
}
function bar(x, y, w, value, colour, label) {
  pen.fillStyle = 'rgba(53,34,14,.35)'; pen.beginPath(); pen.roundRect(x, y, w, 14, 7); pen.fill();
  pen.fillStyle = value < 25 ? CORAL : colour; pen.beginPath(); pen.roundRect(x, y, Math.max(8, w * value / 100), 14, 7); pen.fill();
  pen.fillStyle = '#fff'; pen.font = '800 13px Nunito, sans-serif'; pen.textAlign = 'left'; pen.fillText(label, x, y - 5);
}
function stepPet() {
  const cx = width / 2, cy = height - 210;
  playerX = cx; playerY = cy;
  if (playing) {
    const drain = 0.6 + currentSpeed() * 0.35;
    food -= 0.045 * drain; fun -= 0.035 * drain;
    if (food <= 0 || fun <= 0) { hit({ bad: true, x: cx, y: cy }); if (food <= 0) food = 50; if (fun <= 0) fun = 50; }
    spawnClock += 1;
    if (spawnClock > Math.max(140, 420 - currentSpeed() * 70)) {
      spawnClock = 0;
      const n = Math.max(1, Math.min(3, waveSize | 0));
      for (let k = 0; k < n; k += 1) { const left = Math.random() < 0.5; things.push({ pest: true, bad: true, x: left ? -30 : width + 30, y: cy - 60 - Math.random() * 120, age: 0 }); }
    }
  }
  const enemyImg = spriteFor(enemyLook, 'rock'), goodImg = spriteFor(treasure, 'gem');
  for (const t of things) {
    if (t.boss) { stepDrifter(t, enemyImg); continue; }
    if (t.food) {
      if (playing) t.y += t.vy;
      drawSprite(goodImg, t.x, t.y, 46, t.y / 40);
      if (!t.gone && t.y > cy - 34) { t.gone = true; food = Math.min(100, food + 26); squash = 1.3; sparks(cx, cy - 30, [SUN, MINT], 10, true); scorePoints(); updateHud(); }
    } else if (t.pest) {
      if (playing) { t.age += 1; t.x += (cx - t.x) * 0.012 + Math.sin(ticks / 6 + t.y) * 1.5; t.y += Math.cos(ticks / 9 + t.x) * 1.2; }
      drawSprite(enemyImg, t.x, t.y, 42, Math.sin(ticks / 5) * 0.2);
      if (playing && !t.gone && t.age > 330) { t.gone = true; hit({ bad: true, x: cx, y: cy }); }
    }
  }
  things = things.filter(function(t) { return !t.gone && t.y < height + 60; });
  bar(16, 82, Math.min(160, width * 0.34), food, MINT, 'Food');
  bar(width - 16 - Math.min(160, width * 0.34), 82, Math.min(160, width * 0.34), fun, SUN, 'Fun');
  if (petHop > 0) petHop -= 1;
  const hop = petHop > 0 ? Math.abs(Math.sin(petHop / 40 * Math.PI * 2)) * 70 : Math.abs(Math.sin(ticks / 30)) * 6;
  squash += (1 - squash) * 0.15;
  pen.fillStyle = 'rgba(0,0,0,.18)'; pen.beginPath(); pen.ellipse(cx, cy + 58, 44 - hop * 0.2, 10, 0, 0, 7); pen.fill();
  pen.save(); pen.translate(cx, cy - hop); pen.rotate(petHop > 0 ? (40 - petHop) / 40 * Math.PI * 2 : 0); pen.scale(2 - squash, squash); pen.translate(-cx, -(cy - hop));
  drawLook(cx, cy - hop, 120);
  pen.restore();
  const bw = Math.min(150, (width - 60) / 2), by = height - 124, bh = 46;
  buttons = [
    { x: width / 2 - bw - 8, y: by, w: bw, h: bh, label: 'Feed', go: feedPet },
    { x: width / 2 + 8, y: by, w: bw, h: bh, label: 'Play', go: playPet },
  ];
  for (const b of buttons) {
    pen.fillStyle = '#FFFDFA'; pen.beginPath(); pen.roundRect(b.x, b.y, b.w, b.h, 22); pen.fill();
    pen.fillStyle = '#35220E'; pen.font = '800 17px Nunito, sans-serif'; pen.textAlign = 'center'; pen.fillText(b.label, b.x + b.w / 2, b.y + 28);
  }
}

// ── The player in the newer kinds: your avatar if CodeIt gave one, else your look ──
function drawLook(x, y, size) {
  if (playerImg && playerImg.complete && playerImg.naturalWidth) { pen.save(); pen.shadowColor = 'rgba(0,0,0,.25)'; pen.shadowBlur = 10; pen.shadowOffsetY = 6; pen.drawImage(playerImg, x - size / 2, y - size / 2, size, size); pen.restore(); }
  else drawSprite(spriteFor(playerLook, 'hero'), x, y, size, 0);
}

function draw() {
  ticks += 1;
  const sx = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0, sy = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0; shake = Math.max(0, shake - 1.2);
  pen.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
  const sky = SKIES[skyLook] || SKIES.day;
  const dark = skyLook === 'space' || skyLook === 'night';
  const grad = pen.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, sky[0]); grad.addColorStop(1, sky[1]);
  pen.fillStyle = grad; pen.fillRect(-20, -20, width + 40, height + 40);
  if (dark) {
    for (let i = 0; i < 40; i += 1) {
      pen.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.sin(ticks / 20 + i) * 0.25) + ')';
      pen.beginPath(); pen.arc((i * 97) % width, (i * 53 + ticks * 0.3) % height, 1.6, 0, 7); pen.fill();
    }
  } else {
    pen.fillStyle = 'rgba(255,255,255,.55)';
    for (const c of clouds) {
      if (playing) c.x -= 0.25 * c.s; if (c.x < -140) c.x = width + 60;
      pen.beginPath(); pen.ellipse(c.x, c.y, 60 * c.s, 22 * c.s, 0, 0, 7); pen.ellipse(c.x + 40 * c.s, c.y - 10 * c.s, 40 * c.s, 26 * c.s, 0, 0, 7); pen.ellipse(c.x - 40 * c.s, c.y - 4 * c.s, 36 * c.s, 20 * c.s, 0, 0, 7); pen.fill();
    }
    if (skyLook === 'sunset') { pen.fillStyle = 'rgba(255,255,255,.35)'; pen.beginPath(); pen.arc(width - 120, 110, 44, 0, 7); pen.fill(); }
  }
  if (gameKind !== 'maze' && gameKind !== 'racer') {
    pen.fillStyle = dark ? '#241A4A' : MINT; pen.fillRect(0, height - 60, width, 60);
    pen.fillStyle = dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.10)'; pen.fillRect(0, height - 60, width, 6);
    if (!dark) { pen.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 24; i += 1) pen.fillRect(((i * 83 + ticks * 0.5) % (width + 40)) - 20, height - 44, 14, 3); }
  }

  if (gameKind === 'flyer') stepFlyer();
  else if (gameKind === 'racer') stepRacer();
  else if (gameKind === 'maze') stepMaze();
  else if (gameKind === 'pop') stepPop();
  else if (gameKind === 'pet') stepPet();
  else stepClassic();
  if (safe > 0) safe -= 1;

  parts = parts.filter(function(p) { return p.l > 0; });
  for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.l -= 0.04; pen.globalAlpha = Math.max(0, p.l); pen.fillStyle = p.c; pen.beginPath(); pen.arc(p.x, p.y, 5, 0, 7); pen.fill(); }
  pen.globalAlpha = 1;
  pops = pops.filter(function(p) { return p.l > 0; });
  for (const p of pops) { p.y -= 1.6; p.l -= 0.03; pen.globalAlpha = Math.max(0, Math.min(1, p.l)); pen.fillStyle = p.text ? SUN : '#fff'; pen.font = '800 ' + (p.text ? 44 : 26) + 'px "Baloo 2", Nunito, sans-serif'; pen.textAlign = 'center'; pen.fillText(p.text || ('+' + Math.max(1, pointsPer | 0)), p.x, p.y - 30); }
  pen.globalAlpha = 1;
  if (flash > 0) { flash -= 1; pen.fillStyle = 'rgba(255,107,107,' + (flash / 14) + ')'; pen.fillRect(-20, -20, width + 40, height + 40); }

  requestAnimationFrame(draw);
}

window.addEventListener('keydown', function(e) {
  keys[e.key] = true;
  if (e.key === ' ') { shoot(); jump(); flap(); popOldest(); feedPet(); e.preventDefault(); }
  if (e.key === 'ArrowUp') { flap(); }
  if (gameKind === 'racer' && (e.key === 'ArrowLeft' || e.key === 'a')) steer(-1);
  if (gameKind === 'racer' && (e.key === 'ArrowRight' || e.key === 'd')) steer(1);
  if (gameKind === 'maze') { const d = { ArrowUp: 0, w: 0, ArrowRight: 1, d: 1, ArrowDown: 2, s: 2, ArrowLeft: 3, a: 3 }[e.key]; if (d !== undefined) wantDir = d; }
  if (gameKind === 'pet' && (e.key === 'p' || e.key === 'Enter')) playPet();
  if (gameKind === 'pet' && e.key === 'f') feedPet();
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
});
window.addEventListener('keyup', function(e) { keys[e.key] = false; });
canvas.addEventListener('pointermove', function(e) { pointerX = e.clientX; pointerY = e.clientY; });
canvas.addEventListener('pointerdown', function(e) {
  pointerX = e.clientX; pointerY = e.clientY;
  shoot(); jump(); flap();
  if (gameKind === 'racer') steer(e.clientX < playerX ? -1 : 1);
  if (gameKind === 'pop') { squash = 1.4; tapAt(e.clientX, e.clientY); }
  if (gameKind === 'pet') tapPet(e.clientX, e.clientY);
  if (gameKind === 'maze') swipe = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointerup', function(e) {
  if (gameKind !== 'maze' || !swipe) return;
  let dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  // A tap, not a swipe: head towards where the finger went down.
  if (Math.abs(dx) < 18 && Math.abs(dy) < 18) { dx = e.clientX - playerX; dy = e.clientY - playerY; }
  wantDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
  swipe = null;
});

startGame();
draw();
${CLOSE_SCRIPT}
</body>
</html>`;
}
