import { CLOSE_SCRIPT, SHARED_STYLE } from './shared';

// ── 7. Jump the gap ──────────────────────────────────────────────────────────
//
// One button. That is the whole point of it being here: every other starter
// needs a hand that can steer or aim, and this one needs a hand that can tap.
// It is the game a four-year-old plays next to their sister, and the one that
// works on a phone held in one hand on a bus.

const JUMPER = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Jump the Gap</title>
<style>
${SHARED_STYLE}
  body { background: linear-gradient(#FDE68A, #FBBF24 55%, #F59E0B); color: #3B2A05; }
  .hud { text-shadow: none; }
  .hud span { background: rgba(255,255,255,.5); }
  canvas { display: block; }
</style>
</head>
<body>

<div class="hud"><span>🏃 <b id="scoreLabel">0</b></span><span id="livesLabel">❤️❤️❤️</span></div>
<canvas id="screen"></canvas>
<p class="tip">Tap anywhere to jump</p>

<div class="over" id="gameOver">
  <h2>You fell in!</h2>
  <p>You cleared <b id="finalScore">0</b> <span id="finalNoun">gaps</span></p>
  <button onclick="startGame()">Play again</button>
</div>

<script>
// ── Change these and watch what happens ──
let runSpeed    = 4;
let jumpPower   = 13;
let gravity     = 0.7;
let gapWidth    = 120;
let startLives  = 3;
let runnerColour = '#7C3AED';

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
let best = 0;
try { best = Number(localStorage.getItem('bestJump') || 0); } catch (e) { best = 0; }
let groundY = 0;
let runnerY = 0;
let fallSpeed = 0;
let onGround = true;
let gaps = [];
let playing = false;

function startGame() {
  fitScreen();
  groundY = height - 120;
  score = 0;
  lives = startLives;
  runnerY = groundY;
  fallSpeed = 0;
  onGround = true;
  // Far enough out that the child gets a second of just running before the
  // first thing that can kill them.
  gaps = [{ x: width + 380 }];
  playing = true;
  document.getElementById('scoreLabel').textContent = score;
  document.getElementById('livesLabel').textContent = '❤️'.repeat(lives);
  document.getElementById('gameOver').style.display = 'none';
  draw();
}

// The cat: one orange circle, two ears, two eyes.
function drawCat(x, y) {
  pen.fillStyle = '#F59E0B';
  pen.beginPath(); pen.moveTo(x - catSize * 0.5, y - catSize * 0.35);
  pen.lineTo(x - catSize * 0.28, y - catSize * 0.95); pen.lineTo(x - catSize * 0.05, y - catSize * 0.5); pen.fill();
  pen.beginPath(); pen.moveTo(x + catSize * 0.5, y - catSize * 0.35);
  pen.lineTo(x + catSize * 0.28, y - catSize * 0.95); pen.lineTo(x + catSize * 0.05, y - catSize * 0.5); pen.fill();
  pen.beginPath(); pen.arc(x, y, catSize * 0.55, 0, Math.PI * 2); pen.fill();
  pen.fillStyle = '#35220E';
  pen.beginPath(); pen.arc(x - catSize * 0.18, y - catSize * 0.08, 3, 0, Math.PI * 2); pen.fill();
  pen.beginPath(); pen.arc(x + catSize * 0.18, y - catSize * 0.08, 3, 0, Math.PI * 2); pen.fill();
}

// The mouse: a grey circle, one round ear, a thin tail.
function drawMouse(x, y) {
  pen.strokeStyle = '#8b8b9a'; pen.lineWidth = 2;
  pen.beginPath(); pen.moveTo(x + 10, y + 4); pen.quadraticCurveTo(x + 26, y + 10, x + 30, y - 4); pen.stroke();
  pen.fillStyle = '#a9a9b8';
  pen.beginPath(); pen.arc(x - 8, y - 10, 6, 0, Math.PI * 2); pen.fill();
  pen.beginPath(); pen.arc(x, y, 12, 0, Math.PI * 2); pen.fill();
  pen.fillStyle = '#35220E';
  pen.beginPath(); pen.arc(x - 8, y - 2, 2, 0, Math.PI * 2); pen.fill();
}

function endGame() {
  playing = false;
  if (score > best) {
    best = score;
    try { localStorage.setItem('bestJump', best); } catch (e) {}
  }
  document.getElementById('finalScore').textContent = score;
  var finalNoun = document.getElementById('finalNoun');
  if (finalNoun) finalNoun.textContent = score === 1 ? finalNoun.textContent.replace(/s$/, '') : finalNoun.textContent.replace(/([^s])$/, '$1s');
  document.getElementById('gameOver').style.display = 'flex';
}

function jump() {
  if (!playing) return;
  if (onGround) {
    fallSpeed = -jumpPower;
    onGround = false;
  }
}
window.addEventListener('pointerdown', jump);
window.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); }
});

function draw() {
  if (!playing) return;
  pen.clearRect(0, 0, width, height);

  const runnerX = width * 0.28;

  fallSpeed = fallSpeed + gravity;
  runnerY = runnerY + fallSpeed;
  if (runnerY >= groundY) {
    runnerY = groundY;
    fallSpeed = 0;
    onGround = true;
  }

  pen.fillStyle = '#78350F';
  let overAGap = false;
  for (let i = gaps.length - 1; i >= 0; i--) {
    gaps[i].x = gaps[i].x - runSpeed;
    if (runnerX + 14 > gaps[i].x && runnerX - 14 < gaps[i].x + gapWidth) overAGap = true;
    if (gaps[i].x + gapWidth < -40) {
      gaps.splice(i, 1);
      score = score + 1;
      document.getElementById('scoreLabel').textContent = score;
    }
  }
  const last = gaps[gaps.length - 1];
  if (!last || last.x < width - 260 - Math.random() * 200) {
    gaps.push({ x: width + 60 });
  }

  pen.fillRect(0, groundY + 30, width, height);
  pen.fillStyle = '#F59E0B';
  for (let i = 0; i < gaps.length; i++) {
    pen.fillRect(gaps[i].x, groundY + 30, gapWidth, height);
  }

  if (overAGap && onGround) {
    lives = lives - 1;
    document.getElementById('livesLabel').textContent = '❤️'.repeat(Math.max(0, lives));
    if (lives <= 0) return endGame();
    // Clear the ground under them and give the runway back, so the same gap
    // does not take a second life a frame later.
    gaps = [{ x: width + 380 }];
  }

  pen.fillStyle = runnerColour;
  pen.beginPath();
  pen.roundRect(runnerX - 14, runnerY - 28, 28, 30, 8);
  pen.fill();

  requestAnimationFrame(draw);
}

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

export { JUMPER };
