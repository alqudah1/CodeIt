import { CLOSE_SCRIPT, SHARED_STYLE } from './shared';

// ── 2. Penalty shootout ──────────────────────────────────────────────────────
//
// Football, because it is the thing children ask for most, and because the
// goalkeeper gives a reason to think rather than just react.

const PENALTY = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Penalty Shootout</title>
<style>
${SHARED_STYLE}
  body { background: linear-gradient(#7ec8f0, #4aa3d9 42%, #2e8b3f 42%, #1f6b2e); }
  canvas { display: block; }
</style>
</head>
<body>

<div class="hud"><span>⚽ <b id="scoreLabel">0</b></span><span>Shots left: <b id="shotsLabel">5</b></span></div>
<canvas id="screen"></canvas>
<p class="tip">Tap where you want to shoot</p>

<div class="over" id="gameOver">
  <h2 id="endTitle">Full time!</h2>
  <p>You scored <b id="finalScore">0</b> out of 5</p>
  <button onclick="startGame()">Take them again</button>
</div>

<script>
// ── Change these and watch what happens ──
let totalShots  = 5;
let keeperSpeed = 7;
let ballSpeed   = 14;
let goalColour  = '#ffffff';

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
let shotsLeft = totalShots;
let keeperX = 0;
let keeperWay = 1;
let ball = null;
let message = '';
let messageUntil = 0;

function goalBox() {
  const goalWide = Math.min(340, width * 0.82);
  return { x: (width - goalWide) / 2, y: height * 0.16, w: goalWide, h: height * 0.26 };
}

function startGame() {
  score = 0;
  shotsLeft = totalShots;
  ball = null;
  message = '';
  document.getElementById('scoreLabel').textContent = score;
  document.getElementById('shotsLabel').textContent = shotsLeft;
  document.getElementById('gameOver').style.display = 'none';
  draw();
}

function shootAt(x, y) {
  if (ball || shotsLeft <= 0) return;
  ball = { x: width / 2, y: height - 90, toX: x, toY: y, done: false };
}

function judgeShot() {
  const goal = goalBox();
  const inGoal = ball.toX > goal.x && ball.toX < goal.x + goal.w
    && ball.toY > goal.y && ball.toY < goal.y + goal.h;
  const saved = Math.abs(ball.toX - keeperX) < 52;

  if (inGoal && !saved) {
    score = score + 1;
    message = 'GOAL!';
  } else if (saved) {
    message = 'Saved!';
  } else {
    message = 'Missed!';
  }

  shotsLeft = shotsLeft - 1;
  messageUntil = 40;
  document.getElementById('scoreLabel').textContent = score;
  document.getElementById('shotsLabel').textContent = shotsLeft;
  ball = null;

  if (shotsLeft <= 0) {
    document.getElementById('finalScore').textContent = score;
  var finalNoun = document.getElementById('finalNoun');
  if (finalNoun) finalNoun.textContent = score === 1 ? finalNoun.textContent.replace(/s$/, '') : finalNoun.textContent.replace(/([^s])$/, '$1s');
    document.getElementById('endTitle').textContent = score >= 3 ? 'You win!' : 'Full time!';
    setTimeout(() => { document.getElementById('gameOver').style.display = 'flex'; }, 700);
  }
}

function drawKeeper(x, y) {
  pen.fillStyle = '#FFD84D';
  // arms out, because a keeper with his arms down looks like a bin
  pen.beginPath();
  pen.roundRect(x - 46, y + 16, 92, 13, 7);
  pen.fill();
  pen.beginPath();
  pen.roundRect(x - 20, y + 12, 40, 62, 9);
  pen.fill();
  pen.fillStyle = '#f6b26b';
  pen.beginPath();
  pen.arc(x, y + 2, 13, 0, Math.PI * 2);
  pen.fill();
}

function draw() {
  pen.clearRect(0, 0, width, height);
  const goal = goalBox();

  pen.strokeStyle = goalColour;
  pen.lineWidth = 8;
  pen.strokeRect(goal.x, goal.y, goal.w, goal.h);

  // Markings, so the bottom half is a pitch rather than a green rectangle.
  pen.lineWidth = 4;
  pen.globalAlpha = 0.55;
  pen.strokeRect(goal.x - 40, goal.y + goal.h, goal.w + 80, height * 0.16);
  pen.beginPath();
  pen.arc(width / 2, height - 90, 62, Math.PI, 0);
  pen.stroke();
  pen.globalAlpha = 1;
  pen.fillStyle = goalColour;
  pen.beginPath();
  pen.arc(width / 2, height - 62, 5, 0, Math.PI * 2);
  pen.fill();

  keeperX = keeperX + keeperSpeed * keeperWay;
  if (keeperX > goal.x + goal.w - 30 || keeperX < goal.x + 30) keeperWay = keeperWay * -1;
  if (keeperX === 0) keeperX = width / 2;

  drawKeeper(keeperX, goal.y + goal.h - 74);

  if (ball) {
    ball.x = ball.x + (ball.toX - ball.x) / ballSpeed * 3;
    ball.y = ball.y + (ball.toY - ball.y) / ballSpeed * 3;
    pen.fillStyle = '#fff';
    pen.beginPath();
    pen.arc(ball.x, ball.y, 14, 0, Math.PI * 2);
    pen.fill();
    if (Math.abs(ball.y - ball.toY) < 12) judgeShot();
  } else if (shotsLeft > 0) {
    pen.fillStyle = '#fff';
    pen.beginPath();
    pen.arc(width / 2, height - 90, 14, 0, Math.PI * 2);
    pen.fill();
  }

  if (messageUntil > 0) {
    messageUntil = messageUntil - 1;
    pen.fillStyle = '#fff';
    pen.font = '800 42px system-ui';
    pen.textAlign = 'center';
    pen.fillText(message, width / 2, height * 0.62);
  }

  requestAnimationFrame(draw);
}

window.addEventListener('pointerdown', e => shootAt(e.clientX, e.clientY));

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

export { PENALTY };
