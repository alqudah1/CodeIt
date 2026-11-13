import { CLOSE_SCRIPT, SHARED_STYLE } from './shared';

// ── 8. Build a maze ──────────────────────────────────────────────────────────
//
// The one where dragging changes the game rather than the decoration.
//
// Every other starter draws its world inside a <canvas>, which is a single DOM
// element. Tapping a falling star selects the whole board, so the studio's
// click-and-drag editor has nothing to offer: a child can recolour the score
// badge and not one thing they actually play with.
//
// Here the level IS the page. Each wall, each coin and the door are ordinary
// divs, so the editor that already exists becomes a level editor for free. Drag
// a wall and the wall moves. Press play and the game reads where everything now
// is. No new editing code, no scene format, no save step.
//
// The game measures the elements every time it starts, rather than storing
// coordinates. That is the whole trick, and it is why a child's drag survives.

const MAZE = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Build a Maze</title>
<style>
${SHARED_STYLE}
  body { background: linear-gradient(#0F172A, #1E293B 60%, #334155); }
  #field { position: absolute; inset: 0; }

  /* Everything below is the level. Move one and the game changes. */
  .wall {
    position: absolute;
    background: #7C3AED;
    border-radius: 8px;
    box-shadow: inset 0 -3px 0 rgba(0,0,0,.25);
  }
  .coin {
    position: absolute;
    width: 26px; height: 26px;
    background: #FFD84D;
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(255,216,77,.7);
  }
  .coin.gone { opacity: 0; }
  #door {
    position: absolute;
    width: 46px; height: 46px;
    background: #3DDC97;
    border-radius: 10px;
  }
  #player {
    position: absolute;
    width: 30px; height: 30px;
    background: #FF7A00;
    border-radius: 9px;
    z-index: 2;
  }
</style>
</head>
<body>

<div class="hud"><span>🪙 <b id="scoreLabel">0</b></span><span id="msgLabel">Get all the coins</span></div>

<div id="field">
  <div class="wall" style="left: 12%; top: 30%; width: 40%; height: 18px;"></div>
  <div class="wall" style="left: 58%; top: 52%; width: 30%; height: 18px;"></div>
  <div class="wall" style="left: 30%; top: 70%; width: 45%; height: 18px;"></div>
  <div class="wall" style="left: 20%; top: 40%; width: 18px; height: 26%;"></div>

  <div class="coin" style="left: 22%; top: 16%;"></div>
  <div class="coin" style="left: 70%; top: 34%;"></div>
  <div class="coin" style="left: 40%; top: 58%;"></div>

  <div id="door" style="left: 84%; top: 80%;"></div>
  <div id="player" style="left: 6%; top: 8%;"></div>
</div>

<p class="tip">Arrow keys or drag. Turn on Edit elements to move the walls</p>

<div class="over" id="gameOver">
  <h2 id="endTitle">You made it!</h2>
  <p>You collected <b id="finalScore">0</b> <span id="finalNoun">coins</span></p>
  <button onclick="startGame()">Play again</button>
</div>

<script>
// ── Change these and watch what happens ──
let playerSpeed = 5;
let playerColour = '#FF7A00';
let wallColour   = '#7C3AED';
let coinsToWin   = 3;

const player = document.getElementById('player');
const door = document.getElementById('door');
const field = document.getElementById('field');

let playerX = 0, playerY = 0;
let score = 0;
let playing = false;
let held = {};
let walls = [];
let coins = [];

// Read the level off the page.
//
// Called every time the game starts, so if a child has dragged a wall since the
// last round, the new position is the one that counts. Nothing about the level
// is stored anywhere else.
function readLevel() {
  const frame = field.getBoundingClientRect();
  walls = [];
  document.querySelectorAll('.wall').forEach(el => {
    const r = el.getBoundingClientRect();
    el.style.background = wallColour;
    walls.push({ x: r.left - frame.left, y: r.top - frame.top, w: r.width, h: r.height });
  });
  coins = [];
  document.querySelectorAll('.coin').forEach(el => {
    const r = el.getBoundingClientRect();
    el.classList.remove('gone');
    coins.push({ el: el, x: r.left - frame.left, y: r.top - frame.top, w: r.width, h: r.height, taken: false });
  });
}

function overlaps(ax, ay, aw, ah, b) {
  return ax < b.x + b.w && ax + aw > b.x && ay < b.y + b.h && ay + ah > b.y;
}

function startGame() {
  readLevel();
  score = 0;
  playing = true;
  playerX = field.clientWidth * 0.06;
  playerY = field.clientHeight * 0.08;
  player.style.background = playerColour;
  // You, in the game: if CodeIt handed us your avatar, the runner is YOU.
  if (window.CODEIT_PLAYER_SPRITE) {
    player.style.background = "url('" + window.CODEIT_PLAYER_SPRITE + "') center / contain no-repeat";
    player.style.borderRadius = '10px';
  }
  document.getElementById('scoreLabel').textContent = score;
  document.getElementById('msgLabel').textContent = 'Get all the coins';
  document.getElementById('gameOver').style.display = 'none';
  step();
}

function endGame(title) {
  playing = false;
  document.getElementById('endTitle').textContent = title;
  document.getElementById('finalScore').textContent = score;
  var finalNoun = document.getElementById('finalNoun');
  if (finalNoun) finalNoun.textContent = score === 1 ? finalNoun.textContent.replace(/s$/, '') : finalNoun.textContent.replace(/([^s])$/, '$1s');
  document.getElementById('gameOver').style.display = 'flex';
}

// Move one axis at a time, so running along a wall slides instead of sticking.
function tryMove(dx, dy) {
  const size = player.offsetWidth;
  let nextX = playerX + dx;
  let blocked = walls.some(w => overlaps(nextX, playerY, size, size, w));
  if (!blocked && nextX >= 0 && nextX + size <= field.clientWidth) playerX = nextX;

  let nextY = playerY + dy;
  blocked = walls.some(w => overlaps(playerX, nextY, size, size, w));
  if (!blocked && nextY >= 0 && nextY + size <= field.clientHeight) playerY = nextY;
}

function step() {
  if (!playing) return;
  const size = player.offsetWidth;

  let dx = 0, dy = 0;
  if (held.ArrowLeft)  dx -= playerSpeed;
  if (held.ArrowRight) dx += playerSpeed;
  if (held.ArrowUp)    dy -= playerSpeed;
  if (held.ArrowDown)  dy += playerSpeed;
  if (dx || dy) tryMove(dx, dy);

  player.style.left = playerX + 'px';
  player.style.top = playerY + 'px';

  coins.forEach(coin => {
    if (coin.taken) return;
    if (overlaps(playerX, playerY, size, size, coin)) {
      coin.taken = true;
      coin.el.classList.add('gone');
      score = score + 1;
      document.getElementById('scoreLabel').textContent = score;
      if (score >= coinsToWin) {
        document.getElementById('msgLabel').textContent = 'Now find the green door';
      }
    }
  });

  const frame = field.getBoundingClientRect();
  const d = door.getBoundingClientRect();
  const doorBox = { x: d.left - frame.left, y: d.top - frame.top, w: d.width, h: d.height };
  if (overlaps(playerX, playerY, size, size, doorBox)) {
    if (score >= coinsToWin) return endGame('You made it!');
    document.getElementById('msgLabel').textContent = 'Coins first, then the door';
  }

  requestAnimationFrame(step);
}

window.addEventListener('keydown', e => {
  if (e.key.indexOf('Arrow') === 0) { e.preventDefault(); held[e.key] = true; }
});
window.addEventListener('keyup', e => { held[e.key] = false; });

// Touch: the player walks towards your finger.
let touching = false;
function towards(x, y) {
  const frame = field.getBoundingClientRect();
  const targetX = x - frame.left - player.offsetWidth / 2;
  const targetY = y - frame.top - player.offsetHeight / 2;
  const dx = Math.max(-playerSpeed, Math.min(playerSpeed, targetX - playerX));
  const dy = Math.max(-playerSpeed, Math.min(playerSpeed, targetY - playerY));
  tryMove(dx, dy);
}
window.addEventListener('pointerdown', e => { touching = true; towards(e.clientX, e.clientY); });
window.addEventListener('pointermove', e => { if (touching) towards(e.clientX, e.clientY); });
window.addEventListener('pointerup', () => { touching = false; });

// Wait until the frame has a size, however many frames that takes.
(function waitForSize() {
  if (window.innerWidth > 0 && window.innerHeight > 0) {
    startGame();
    return;
  }
  requestAnimationFrame(waitForSize);
})();
${CLOSE_SCRIPT}
</body>
</html>`;

export { MAZE };
