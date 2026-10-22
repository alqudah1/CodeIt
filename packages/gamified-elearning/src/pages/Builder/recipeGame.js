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
// Four kinds of game cover most of what a ten-year-old asks for:
//   shooter  you at the bottom, enemies come down, Space or tap shoots
//   dodge    enemies come down, you avoid them and collect treasure
//   catch    treasure falls, you catch it and avoid the bad thing
//   runner   the ground scrolls, you jump over the bad thing, collect treasure
//
// Everything on the canvas is one of our own drawn sprites (sprites.js). The
// settings may still name things as emoji, because that is what the server
// says and what a child might type; the page maps them to sprites itself.
// The game is drawn at the screen's real pixel density, and it has the small
// things that make a game feel like one: a shadow under you, a squash when
// you land, sparks and a floating +1 on a catch, a shake and a red flash on a
// hit, a trail behind every shot, clouds by day and stars at night.

import { spriteTable } from '../Build/sprites';

const CLOSE_SCRIPT = `<${'/'}script>`;

export const RECIPE_KINDS = ['shooter', 'dodge', 'catch', 'runner'];
export const RECIPE_TWISTS = ['none', 'faster', 'waves'];
const SKIES = { space: ['#2A1E5C', '#5B3FD6'], night: ['#1E1B3A', '#35220E'], ocean: ['#042F4A', '#0E7490'], candy: ['#FF6B6B', '#FFD6E0'], day: ['#3EB7F8', '#BFE6FF'], sunset: ['#FF7A00', '#FFC93C'] };

const str = (v) => String(v).replace(/\\/g, '').replace(/'/g, '');
const EMOJI_TO_SPRITE = { '🚀': 'ship', '🛸': 'ship', '🐰': 'hero', '🐇': 'hero', '👽': 'alien', '👾': 'alien', '🤖': 'blob', '🧑': 'hero', '🧒': 'hero', '🐱': 'pink', '🐶': 'hero', '🐸': 'alien', '🐥': 'skyguy', '🦄': 'pink', '🐉': 'blob', '☄️': 'rock', '🪨': 'rock', '🌑': 'rock', '💣': 'bomb', '🔥': 'sun', '☀️': 'sun', '⚡': 'sun', '🧟': 'blob', '👻': 'skyguy', '🦈': 'bomb', '💎': 'gem', '🪙': 'coin', '💰': 'coin', '🥕': 'carrot', '⭐': 'star', '🌟': 'star', '🍎': 'coin', '🍬': 'gem', '🔑': 'coin' };

/** The settings block: the first code a child changes. Keep it readable. */
export function recipeSettings(r) {
  const twist = RECIPE_TWISTS.includes(String(r.twist).toLowerCase()) ? String(r.twist).toLowerCase() : 'none';
  return [
    `let gameKind   = '${str(r.kind)}';   // shooter, dodge, catch or runner`,
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

// You, in the game: if CodeIt handed us your avatar, you are the player.
let playerImg = null;
if (window.CODEIT_PLAYER_SPRITE) {
  playerImg = new Image();
  playerImg.src = window.CODEIT_PLAYER_SPRITE;
}

// ── The drawn things ──
const SPRITES = ${JSON.stringify(spriteTable())};
const EMOJI = ${JSON.stringify(EMOJI_TO_SPRITE)};
const SKIES = ${JSON.stringify(SKIES)};
const MINT = '#17C08B', SUN = '#FFC93C', CORAL = '#FF6B6B';
const imageCache = {};
function spriteFor(look, fallback) {
  const v = String(look || '').trim();
  let name = SPRITES[v] ? v : (EMOJI[v] || EMOJI[Array.from(v)[0]] || null);
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
let pointerX = null;
let level = 1, bossCame = false, audio = null;
const keys = {};

function fitScreen() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  width = window.innerWidth; height = window.innerHeight;
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  pen.imageSmoothingQuality = 'high';
}
window.addEventListener('resize', fitScreen);
fitScreen();

function tipText() {
  if (gameKind === 'shooter') return 'Move with the mouse or arrows. Space or tap to shoot.';
  if (gameKind === 'runner') return 'Space or tap to jump. Collect the treasure.';
  if (gameKind === 'catch') return 'Catch the treasure. Not the bad things.';
  return 'Dodge the bad things. Collect the treasure.';
}

function startGame() {
  score = 0; lives = startLives; playing = true;
  things = []; shots = []; parts = []; pops = []; ticks = 0; spawnClock = 0; shake = 0; flash = 0; squash = 1; level = 1; bossCame = false;
  clouds = [0, 1, 2, 3].map(function(i) { return { x: i * (width / 3) + 40, y: 60 + (i % 2) * 70, s: 0.6 + (i % 3) * 0.25 }; });
  playerX = width / 2; playerY = height - 120; jumpSpeed = 0;
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
  if (!img || !img.complete || !img.naturalWidth) return;
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
    things.push({ x: width / 2, y: -80, bad: true, boss: true, hp: 3, vy: 1.2 + currentSpeed() * 0.4, spin: 0 });
    pops.push({ x: width / 2, y: height / 2 + pops.filter(function(p) { return p.text; }).length * 56, l: 1.4, text: 'Boss!' });
  }
  if (score >= winAt) endGame(true);
}

function hit(thing) {
  thing.gone = true;
  if (thing.bad) {
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
  pen.fillStyle = dark ? '#241A4A' : MINT; pen.fillRect(0, height - 60, width, 60);
  pen.fillStyle = dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.10)'; pen.fillRect(0, height - 60, width, 6);
  if (!dark) { pen.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 24; i += 1) pen.fillRect(((i * 83 + ticks * 0.5) % (width + 40)) - 20, height - 44, 14, 3); }

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
  if (e.key === ' ') { shoot(); jump(); e.preventDefault(); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
});
window.addEventListener('keyup', function(e) { keys[e.key] = false; });
canvas.addEventListener('pointermove', function(e) { pointerX = e.clientX; });
canvas.addEventListener('pointerdown', function(e) { pointerX = e.clientX; shoot(); jump(); });

startGame();
draw();
${CLOSE_SCRIPT}
</body>
</html>`;
}
