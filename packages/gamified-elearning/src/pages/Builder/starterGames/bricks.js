import { CLOSE_SCRIPT, SHARED_STYLE } from './shared';

// ── 6. Brick breaker ─────────────────────────────────────────────────────────
//
// The one where the screen visibly empties as you play. A child can see how
// much is left without reading a number, which is the cheapest kind of
// progress there is, and the reason this game outlived the machines it was
// written for.
//
// Two rows of bricks rather than eight on purpose: a first game a child never
// finishes teaches them the game is the boss.

const BRICKS = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Brick Breaker</title>
<style>
${SHARED_STYLE}
  body { background: linear-gradient(#1E1B4B, #312E81 60%, #4338CA); }
  canvas { display: block; }
</style>
</head>
<body>

<div class="hud"><span>🧱 <b id="scoreLabel">0</b></span><span id="livesLabel">❤️❤️❤️</span></div>
<canvas id="screen"></canvas>
<p class="tip">Move your finger to bounce the ball</p>

<div class="over" id="gameOver">
  <h2 id="endTitle">Out of balls!</h2>
  <p>You smashed <b id="finalScore">0</b> <span id="finalNoun">bricks</span></p>
  <button onclick="startGame()">Play again</button>
</div>

<script>
// ── Change these and watch what happens ──
let ballSpeed   = 5;
let paddleWide  = 110;
let brickRows   = 3;
let startLives  = 3;
let brickColour = '#FFD84D';

const canvas = document.getElementById('screen');
const pen = canvas.getContext('2d');
let width = 0, height = 0;

function fitScreen() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', fitScreen);
fitScreen();

let score = 0;
let lives = startLives;
let bricks = [];
let paddleX = 0;
let ball = { x: 0, y: 0, dx: 0, dy: 0 };
let playing = false;

function buildWall() {
  bricks = [];
  const columns = Math.max(4, Math.floor(width / 90));
  const brickWide = width / columns;
  for (let row = 0; row < brickRows; row++) {
    for (let col = 0; col < columns; col++) {
      bricks.push({
        x: col * brickWide + 3,
        y: 70 + row * 30,
        w: brickWide - 6,
        h: 22,
        alive: true
      });
    }
  }
}

function serveBall() {
  // Upward, at the bricks. Served downward it fell straight past the paddle
  // three times in about two seconds, so the game was over before the ball had
  // touched a single brick.
  ball = { x: width / 2, y: height * 0.62, dx: ballSpeed * 0.6, dy: -ballSpeed };
}

function startGame() {
  fitScreen();
  score = 0;
  lives = startLives;
  paddleX = width / 2;
  playing = true;
  buildWall();
  serveBall();
  document.getElementById('scoreLabel').textContent = score;
  document.getElementById('livesLabel').textContent = '❤️'.repeat(lives);
  document.getElementById('gameOver').style.display = 'none';
  draw();
}

function endGame(title) {
  playing = false;
  document.getElementById('endTitle').textContent = title;
  document.getElementById('finalScore').textContent = score;
  var finalNoun = document.getElementById('finalNoun');
  if (finalNoun) finalNoun.textContent = score === 1 ? finalNoun.textContent.replace(/s$/, '') : finalNoun.textContent.replace(/([^s])$/, '$1s');
  document.getElementById('gameOver').style.display = 'flex';
}

function loseALife() {
  lives = lives - 1;
  document.getElementById('livesLabel').textContent = '❤️'.repeat(Math.max(0, lives));
  if (lives <= 0) endGame('Out of balls!');
  else serveBall();
}

function draw() {
  if (!playing) return;
  pen.clearRect(0, 0, width, height);

  ball.x = ball.x + ball.dx;
  ball.y = ball.y + ball.dy;

  if (ball.x < 8 || ball.x > width - 8) ball.dx = -ball.dx;
  if (ball.y < 8) ball.dy = -ball.dy;

  const paddleY = height - 50;
  const onPaddle = ball.y > paddleY - 8 && ball.y < paddleY + 18
    && Math.abs(ball.x - paddleX) < paddleWide / 2;
  if (onPaddle) {
    ball.dy = -Math.abs(ball.dy);
    // Where it lands on the paddle decides where it goes. Without this the
    // ball settles into one boring loop and the child is a spectator.
    ball.dx = ((ball.x - paddleX) / (paddleWide / 2)) * ballSpeed;
  }

  if (ball.y > height + 20) loseALife();

  let left = 0;
  for (let i = 0; i < bricks.length; i++) {
    const b = bricks[i];
    if (!b.alive) continue;
    left = left + 1;
    pen.fillStyle = brickColour;
    pen.beginPath();
    pen.roundRect(b.x, b.y, b.w, b.h, 5);
    pen.fill();

    const hit = ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h;
    if (hit) {
      b.alive = false;
      ball.dy = -ball.dy;
      score = score + 1;
      document.getElementById('scoreLabel').textContent = score;
    }
  }
  if (left === 0) return endGame('You cleared it!');

  pen.fillStyle = '#FF7A00';
  pen.beginPath();
  pen.roundRect(paddleX - paddleWide / 2, paddleY, paddleWide, 16, 8);
  pen.fill();

  pen.fillStyle = '#fff';
  pen.beginPath();
  pen.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
  pen.fill();

  requestAnimationFrame(draw);
}

function movePaddle(x) {
  paddleX = Math.max(paddleWide / 2, Math.min(width - paddleWide / 2, x));
}
window.addEventListener('pointermove', e => movePaddle(e.clientX));
window.addEventListener('pointerdown', e => movePaddle(e.clientX));
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  movePaddle(paddleX - 40);
  if (e.key === 'ArrowRight') movePaddle(paddleX + 40);
});

// Wait until the frame has a size, however many frames that takes.
//
// A sandboxed iframe can run this script before the browser has given the
// document a size, and everything then lays itself out against a 0x0 window:
// in the asteroid game that put the ship off the top of the screen and all
// sixty background stars in a single column, so the game ran, scored, and was
// invisible.
//
// One requestAnimationFrame was the first attempt and it was not enough. It
// waits for the next paint, and the next paint can still arrive before the
// frame has been laid out, so the bug came back at maybe one load in six:
// rarer than before, which made it worse, not better. This waits for an actual
// width and keeps waiting, so there is no frequency left to be unlucky at.
(function waitForSize() {
  if (window.innerWidth > 0 && window.innerHeight > 0) {
    fitScreen();
    startGame();
    return;
  }
  requestAnimationFrame(waitForSize);
})();
${CLOSE_SCRIPT}
</body>
</html>`;

export { BRICKS };
