import { CLOSE_SCRIPT, SHARED_STYLE } from './shared';

// ── 21. Cat and mouse chase ──────────────────────────────────────────────────
//
// Written for the child who arrives from Scratch. Every important line carries
// the block it replaces, so "real code" stops being a wall and starts being a
// translation of something they already speak.

const CAT_CHASE = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Cat and Mouse</title>
<style>
${SHARED_STYLE}
  body { background: linear-gradient(#fff4e5, #ffe0b3); }
  canvas { display: block; }
</style>
</head>
<body>

<div class="hud"><span>🐭 <b id="scoreLabel">0</b></span><span>⏱ <b id="timeLabel">30</b></span></div>
<canvas id="screen"></canvas>
<p class="tip">Move your finger and the cat follows it. Catch the mouse!</p>

<div class="over" id="gameOver">
  <h2>Time's up!</h2>
  <p>You caught the mouse <b id="finalScore">0</b> <span id="finalNoun">times</span></p>
  <button onclick="startGame()">Play again</button>
</div>

<script>
// In Scratch these were sliders and variable blocks. Same idea, typed out.
// ── Change these and watch what happens ──
let catSpeed   = 6;
let catSize    = 34;
let gameTime   = 30;
let trailColour = '#FF7A00';
let mouseJumps = true;

const canvas = document.getElementById('screen');
const pen = canvas.getContext('2d');
let width = 0, height = 0;

function fitScreen() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  // The studio keeps this screen hidden until Play is pressed, so the page
  // can load while the window is still 0 by 0. When real space arrives,
  // everyone takes their places again.
  if (!started && width && height) {
    cat = { x: width / 2, y: height - 120 };
    target = { x: cat.x, y: cat.y };
    moveMouseSomewhere();
  }
}
window.addEventListener('resize', fitScreen);

// In Scratch: the "score" and "timer" variable blocks.
let score = 0;
let timeLeft = gameTime;
// In Scratch: each sprite's x and y on the stage.
let cat   = { x: 80,  y: 120 };
let mouse = { x: 200, y: 300 };
let target = { x: 80, y: 120 };
let playing = false;
let started = false;
let countdown = null;
fitScreen();

// In Scratch: "when green flag clicked".
function startGame() {
  score = 0;
  timeLeft = gameTime;
  cat = { x: width / 2, y: height - 120 };
  target = { x: cat.x, y: cat.y };
  moveMouseSomewhere();
  playing = true;
  started = false;
  document.getElementById('scoreLabel').textContent = score;
  document.getElementById('timeLabel').textContent = timeLeft;
  document.getElementById('gameOver').style.display = 'none';
  clearInterval(countdown);
  // In Scratch: "wait 1 second" inside a "repeat" block.
  countdown = setInterval(() => {
    if (!started || !playing) return;
    timeLeft = timeLeft - 1;
    document.getElementById('timeLabel').textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
  draw();
}

// In Scratch: "go to random position".
function moveMouseSomewhere() {
  mouse.x = 40 + Math.random() * (width - 80);
  mouse.y = 90 + Math.random() * (height - 180);
}

// In Scratch: "when this sprite touched". Here we measure the distance.
function touching(a, b, closerThan) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy) < closerThan;
}

// In Scratch: "point towards" + "move 10 steps", forever.
function chase() {
  const dx = target.x - cat.x, dy = target.y - cat.y;
  const far = Math.sqrt(dx * dx + dy * dy);
  if (far > catSpeed) {
    cat.x += (dx / far) * catSpeed;
    cat.y += (dy / far) * catSpeed;
  }
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
  clearInterval(countdown);
  document.getElementById('finalScore').textContent = score;
  var finalNoun = document.getElementById('finalNoun');
  if (finalNoun) finalNoun.textContent = score === 1 ? finalNoun.textContent.replace(/s$/, '') : finalNoun.textContent.replace(/([^s])$/, '$1s');
  document.getElementById('gameOver').style.display = 'flex';
}

// In Scratch: the "forever" block. Here it is a function that asks the
// browser to run it again on every frame.
function draw() {
  if (!playing) return;
  pen.clearRect(0, 0, width, height);

  chase();

  // In Scratch: "if touching mouse, change score by 1".
  if (started && touching(cat, mouse, catSize)) {
    score = score + 1;
    document.getElementById('scoreLabel').textContent = score;
    if (mouseJumps) moveMouseSomewhere();
  }

  // In Scratch: the "pen" blocks. A little coloured trail behind the cat.
  pen.fillStyle = trailColour;
  pen.beginPath();
  pen.arc(cat.x, cat.y + catSize * 0.7, 6, 0, Math.PI * 2);
  pen.fill();

  // In Scratch these two were costumes. Here they are drawn, ear by ear,
  // which means every part of how they look is yours to change.
  drawMouse(mouse.x, mouse.y);
  drawCat(cat.x, cat.y);

  requestAnimationFrame(draw);
}

// In Scratch: "when key pressed" and "when this sprite clicked".
// Here one listener hears every touch or mouse move.
function steer(x, y) {
  started = true;
  target.x = x;
  target.y = y;
}
canvas.addEventListener('pointermove', e => steer(e.clientX, e.clientY));
canvas.addEventListener('pointerdown', e => steer(e.clientX, e.clientY));
window.addEventListener('keydown', e => {
  started = true;
  if (e.key === 'ArrowLeft')  target.x = cat.x - 90;
  if (e.key === 'ArrowRight') target.x = cat.x + 90;
  if (e.key === 'ArrowUp')    target.y = cat.y - 90;
  if (e.key === 'ArrowDown')  target.y = cat.y + 90;
});

startGame();
${CLOSE_SCRIPT}
</body>
</html>`;

export { CAT_CHASE };
