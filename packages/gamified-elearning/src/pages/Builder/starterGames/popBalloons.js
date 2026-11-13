import { CLOSE_SCRIPT, SHARED_STYLE } from './shared';

// ── 4. Pop the balloons ──────────────────────────────────────────────────────
//
// The first game that is tapped rather than steered. Catching asks a child to
// track something continuously; tapping asks them to aim, and a five-year-old
// who cannot yet do the first can do the second immediately.
//
// It also ends on a clock rather than on losing, which matters more than it
// sounds: a child who is bad at the game still reaches the end screen and still
// has a score to beat. Nothing here can be lost in two seconds.

const POP_BALLOONS = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Pop the Balloons</title>
<style>
${SHARED_STYLE}
  body { background: linear-gradient(#7DD3FC, #38BDF8 55%, #0EA5E9); }
  canvas { display: block; }
</style>
</head>
<body>

<div class="hud"><span>🎈 <b id="scoreLabel">0</b></span><span>⏱ <b id="timeLabel">30</b></span></div>
<canvas id="screen"></canvas>
<p class="tip">Tap the balloons before they float away</p>

<div class="over" id="gameOver">
  <h2>Time!</h2>
  <p>You popped <b id="finalScore">0</b> <span id="finalNoun">balloons</span></p>
  <button onclick="startGame()">Play again</button>
</div>

<script>
// ── Change these and watch what happens ──
let riseSpeed    = 2;
let balloonSize  = 34;
let popChance    = 0.03;
let gameSeconds  = 30;
let balloonColour = '#FF4D6D';

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
let timeLeft = gameSeconds;
let balloons = [];
let playing = false;
let clock = null;

function startGame() {
  score = 0;
  timeLeft = gameSeconds;
  balloons = [];
  // Start with some already in the air. Rising from below the screen, the first
  // balloon took two seconds to appear, and a game that opens on an empty sky
  // reads as broken rather than as about to begin.
  for (let i = 0; i < 4; i++) {
    balloons.push({
      x: balloonSize + Math.random() * (width - balloonSize * 2),
      y: height * (0.45 + i * 0.18),
      sway: Math.random() * 6
    });
  }
  playing = true;
  document.getElementById('scoreLabel').textContent = score;
  document.getElementById('timeLabel').textContent = timeLeft;
  document.getElementById('gameOver').style.display = 'none';
  if (clock) clearInterval(clock);
  clock = setInterval(tickClock, 1000);
  draw();
}

function tickClock() {
  if (!playing) return;
  timeLeft = timeLeft - 1;
  document.getElementById('timeLabel').textContent = timeLeft;
  if (timeLeft <= 0) endGame();
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
  clearInterval(clock);
  document.getElementById('finalScore').textContent = score;
  var finalNoun = document.getElementById('finalNoun');
  if (finalNoun) finalNoun.textContent = score === 1 ? finalNoun.textContent.replace(/s$/, '') : finalNoun.textContent.replace(/([^s])$/, '$1s');
  document.getElementById('gameOver').style.display = 'flex';
}

function addBalloon() {
  balloons.push({
    x: balloonSize + Math.random() * (width - balloonSize * 2),
    y: height + balloonSize,
    sway: Math.random() * 6
  });
}

function drawBalloon(b) {
  pen.save();
  pen.translate(b.x + Math.sin(b.sway) * 12, b.y);
  pen.strokeStyle = 'rgba(255,255,255,.7)';
  pen.lineWidth = 2;
  pen.beginPath();
  pen.moveTo(0, balloonSize * 0.9);
  pen.lineTo(0, balloonSize * 1.6);
  pen.stroke();
  pen.fillStyle = balloonColour;
  pen.beginPath();
  pen.ellipse(0, 0, balloonSize * 0.78, balloonSize, 0, 0, Math.PI * 2);
  pen.fill();
  pen.fillStyle = 'rgba(255,255,255,.45)';
  pen.beginPath();
  pen.ellipse(-balloonSize * 0.26, -balloonSize * 0.3, balloonSize * 0.16, balloonSize * 0.24, 0, 0, Math.PI * 2);
  pen.fill();
  pen.restore();
}

function draw() {
  if (!playing) return;
  pen.clearRect(0, 0, width, height);

  if (Math.random() < popChance) addBalloon();

  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i];
    b.y = b.y - riseSpeed;
    b.sway = b.sway + 0.04;
    drawBalloon(b);
    if (b.y < -balloonSize * 2) balloons.splice(i, 1);
  }

  requestAnimationFrame(draw);
}

function popAt(x, y) {
  if (!playing) return;
  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i];
    const dx = x - (b.x + Math.sin(b.sway) * 12);
    const dy = y - b.y;
    if (dx * dx + dy * dy < balloonSize * balloonSize * 1.15) {
      balloons.splice(i, 1);
      score = score + 1;
      document.getElementById('scoreLabel').textContent = score;
      return;
    }
  }
}
window.addEventListener('pointerdown', e => popAt(e.clientX, e.clientY));

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

export { POP_BALLOONS };
