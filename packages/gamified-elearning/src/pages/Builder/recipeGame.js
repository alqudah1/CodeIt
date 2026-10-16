// ── The instant game: a recipe becomes a playable game, in the page, now ─────
//
// The child says what they want. The server answers with a nine-line recipe
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

const CLOSE_SCRIPT = `<${'/'}script>`;

export const RECIPE_KINDS = ['shooter', 'dodge', 'catch', 'runner'];
const SKIES = { space: ['#0B1026', '#1B2A5C'], night: ['#1B1030', '#3B2460'], ocean: ['#042F4A', '#0E7490'], candy: ['#FF5FA2', '#FFB3D1'], day: ['#5FB6F0', '#CFEBFF'] };

const str = (v) => String(v).replace(/\\/g, '').replace(/'/g, '');

/** The settings block: the first code a child changes. Keep it readable. */
export function recipeSettings(r) {
  return [
    `let gameKind   = '${str(r.kind)}';   // shooter, dodge, catch or runner`,
    `let gameTitle  = '${str(r.title)}';`,
    `let playerLook = '${str(r.player)}';`,
    `let enemyLook  = '${str(r.enemy)}';`,
    `let treasure   = '${str(r.treasure)}';`,
    `let skyLook    = '${str(r.sky)}';   // space, night, ocean, candy or day`,
    `let speed      = ${Number(r.speed) || 2};   // 1 is calm, 3 is wild`,
    `let startLives = ${Number(r.lives) || 3};`,
    `let winAt      = ${Number(r.winAt) || 15};`,
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
  body { margin: 0; overflow: hidden; touch-action: none; font-family: system-ui, -apple-system, sans-serif; color: #fff; user-select: none; background: ${c1}; }
  canvas { display: block; width: 100vw; height: 100vh; }
  .hud { position: absolute; top: 0; left: 0; right: 0; z-index: 2; display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; font-weight: 800; font-size: 17px; text-shadow: 0 2px 6px rgba(0,0,0,.45); pointer-events: none; }
  .hud span { background: rgba(0,0,0,.28); border-radius: 99px; padding: 6px 14px; }
  .tip { position: absolute; left: 0; right: 0; bottom: 12px; text-align: center; font-size: 14px; opacity: .85; pointer-events: none; text-shadow: 0 2px 6px rgba(0,0,0,.45); }
  .over { position: absolute; inset: 0; z-index: 3; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: rgba(9,10,25,.82); text-align: center; padding: 24px; }
  .over h2 { margin: 0; font-size: 34px; }
  .over p { margin: 0; font-size: 18px; opacity: .9; }
  .over button { border: 0; border-radius: 14px; padding: 15px 30px; font-size: 19px; font-weight: 800; color: #241704; background: #FFD84D; box-shadow: 0 5px 0 #C9A400; cursor: pointer; }
</style>
</head>
<body>

<div class="hud"><span>⭐ <b id="scoreLabel">0</b></span><span id="titleLabel">${str(r.title)}</span><span id="livesLabel">❤️❤️❤️</span></div>
<canvas id="screen"></canvas>
<p class="tip" id="tip"></p>

<div class="over" id="gameOver">
  <h2 id="overTitle">Game over!</h2>
  <p>Your score: <b id="finalScore">0</b></p>
  <button onclick="startGame()">Play again</button>
</div>

<script>
// ── Change these and watch what happens ──
${recipeSettings(r)}

// You, in the game: if CodeIt handed us your avatar, you are the player.
let playerImg = null;
if (window.CODEIT_PLAYER_SPRITE) {
  playerImg = new Image();
  playerImg.src = window.CODEIT_PLAYER_SPRITE;
}

const SKIES = { space: ['#0B1026', '#1B2A5C'], night: ['#1B1030', '#3B2460'], ocean: ['#042F4A', '#0E7490'], candy: ['#FF5FA2', '#FFB3D1'], day: ['#5FB6F0', '#CFEBFF'] };
const canvas = document.getElementById('screen');
const pen = canvas.getContext('2d');
let width = 0, height = 0;
let score = 0, lives = 3, playing = false;
let playerX = 0, playerY = 0, jumpSpeed = 0;
let things = [], shots = [], ticks = 0, spawnClock = 0;
let pointerX = null;
const keys = {};

function fitScreen() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', fitScreen);
fitScreen();

function tipText() {
  if (gameKind === 'shooter') return 'Move with the mouse or arrows. Space or tap to shoot.';
  if (gameKind === 'runner') return 'Space or tap to jump over ' + enemyLook + '. Collect ' + treasure + '.';
  if (gameKind === 'catch') return 'Catch ' + treasure + '. Do not catch ' + enemyLook + '.';
  return 'Dodge ' + enemyLook + '. Collect ' + treasure + '.';
}

function startGame() {
  score = 0; lives = startLives; playing = true;
  things = []; shots = []; ticks = 0; spawnClock = 0;
  playerX = width / 2; playerY = height - 120; jumpSpeed = 0;
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('titleLabel').textContent = gameTitle;
  document.getElementById('tip').textContent = tipText();
  updateHud();
}

function updateHud() {
  document.getElementById('scoreLabel').textContent = score;
  document.getElementById('livesLabel').textContent = '❤️'.repeat(Math.max(0, lives));
}

function endGame(won) {
  playing = false;
  document.getElementById('overTitle').textContent = won ? 'You win!' : 'Game over!';
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOver').style.display = 'flex';
  if (won && window.parent) window.parent.postMessage({ type: 'CODEIT_WON', score: score }, '*');
}

function shoot() {
  if (!playing || gameKind !== 'shooter') return;
  shots.push({ x: playerX, y: height - 90 });
}

function jump() {
  if (!playing || gameKind !== 'runner') return;
  if (playerY >= height - 120) jumpSpeed = -16;
}

function drawEmoji(e, x, y, size, rotation) {
  pen.save(); pen.translate(x, y); pen.rotate(rotation || 0);
  pen.font = size + 'px serif'; pen.textAlign = 'center'; pen.textBaseline = 'middle';
  pen.fillText(e, 0, 0);
  pen.restore();
}

function drawPlayer(x, y) {
  if (playerImg && playerImg.complete && playerImg.naturalWidth) {
    pen.drawImage(playerImg, x - 30, y - 30, 60, 60);
  } else {
    drawEmoji(playerLook, x, y, 56, gameKind === 'shooter' ? -0.78 : 0);
  }
}

function addThing() {
  const bad = gameKind === 'catch' ? Math.random() < 0.25 : gameKind === 'runner' ? Math.random() < 0.7 : Math.random() < 0.8;
  if (gameKind === 'runner') {
    things.push({ x: width + 40, y: bad ? height - 110 : height - 200 - Math.random() * 60, bad: bad, vy: 0, spin: 0 });
  } else {
    things.push({ x: 60 + Math.random() * (width - 120), y: -40, bad: bad, vy: (2 + speed * 1.2) * (0.7 + Math.random() * 0.6), spin: Math.random() * 6 });
  }
}

function hit(thing) {
  thing.gone = true;
  if (thing.bad) {
    lives -= 1;
    if (lives <= 0) endGame(false);
  } else {
    score += 1;
    if (score >= winAt) endGame(true);
  }
  updateHud();
}

function draw() {
  ticks += 1;
  const sky = SKIES[skyLook] || SKIES.day;
  const grad = pen.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, sky[0]); grad.addColorStop(1, sky[1]);
  pen.fillStyle = grad; pen.fillRect(0, 0, width, height);
  if (skyLook === 'space' || skyLook === 'night') {
    for (let i = 0; i < 40; i += 1) {
      pen.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.sin(ticks / 20 + i) * 0.25) + ')';
      pen.fillRect((i * 97) % width, (i * 53 + ticks * 0.3) % height, 2, 2);
    }
  }
  if (gameKind === 'runner') {
    pen.fillStyle = '#46A302'; pen.fillRect(0, height - 80, width, 80);
    pen.fillStyle = '#58CC02'; pen.fillRect(0, height - 80, width, 14);
  }

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
      playerY = height - 90;
    }
    spawnClock += 1;
    const every = gameKind === 'runner' ? Math.max(50, 120 - speed * 15 - score * 2) : Math.max(18, 60 - speed * 10 - score);
    if (spawnClock > every) { spawnClock = 0; addThing(); }
  }

  for (const thing of things) {
    if (playing) {
      if (gameKind === 'runner') thing.x -= 6 + speed * 2; else thing.y += thing.vy;
    }
    thing.spin += 0.02;
    drawEmoji(thing.bad ? enemyLook : treasure, thing.x, thing.y, 44, gameKind === 'shooter' ? 0 : thing.spin);
    if (playing && !thing.gone) {
      const dx = Math.abs(thing.x - playerX), dy = Math.abs(thing.y - playerY);
      if (dx < 40 && dy < 40) hit(thing);
      if (gameKind === 'shooter' && thing.bad && thing.y > height - 40) { thing.bad = true; hit(thing); }
    }
  }

  for (const shot of shots) {
    shot.y -= 14;
    pen.fillStyle = '#FFD84D'; pen.fillRect(shot.x - 4, shot.y - 14, 8, 24);
    for (const thing of things) {
      if (thing.bad && !thing.gone && Math.abs(thing.x - shot.x) < 32 && Math.abs(thing.y - shot.y) < 32) {
        thing.gone = true; shot.gone = true; score += 1; updateHud();
        if (score >= winAt) endGame(true);
      }
    }
  }
  shots = shots.filter(function(s) { return s.y > -30 && !s.gone; });
  things = things.filter(function(t) { return !t.gone && t.y < height + 60 && t.x > -60; });

  drawPlayer(playerX, playerY);
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
