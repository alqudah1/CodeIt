import { CLOSE_SCRIPT, SHARED_STYLE } from './shared';

// ── 5. Snake ─────────────────────────────────────────────────────────────────
//
// Here because almost every adult in the house recognises it, which is worth
// more than it looks: a parent who says "I used to play this" is a parent who
// stays in the room.
//
// It is also the first starter whose difficulty comes from the child's own
// success rather than from a number going up. Nothing gets faster; the snake
// gets longer, and the game gets harder because they were good at it.

const SNAKE = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Snake</title>
<style>
${SHARED_STYLE}
  body { background: linear-gradient(#052E16, #14532D 60%, #166534); }
  canvas { display: block; }
</style>
</head>
<body>

<div class="hud"><span>🍎 <b id="scoreLabel">0</b></span><span id="lenLabel">Length 3</span></div>
<canvas id="screen"></canvas>
<p class="tip">Swipe or use the arrow keys</p>

<div class="over" id="gameOver">
  <h2>Bumped!</h2>
  <p>You ate <b id="finalScore">0</b> <span id="finalNoun">apples</span></p>
  <button onclick="startGame()">Play again</button>
</div>

<script>
// ── Change these and watch what happens ──
let squareSize  = 24;
let stepsPerSec = 8;
let startLength = 3;
let snakeColour = '#3DDC97';
let appleColour = '#FF4D6D';

const canvas = document.getElementById('screen');
const pen = canvas.getContext('2d');
let width = 0, height = 0;
let columns = 0, rows = 0;

function fitScreen() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  columns = Math.floor(width / squareSize);
  rows = Math.floor(height / squareSize);
}
window.addEventListener('resize', fitScreen);
fitScreen();

let snake = [];
let goX = 1, goY = 0;
let apple = { x: 5, y: 5 };
let score = 0;
let playing = false;
let lastStep = 0;

function startGame() {
  fitScreen();
  snake = [];
  for (let i = 0; i < startLength; i++) {
    snake.push({ x: Math.floor(columns / 2) - i, y: Math.floor(rows / 2) });
  }
  goX = 1; goY = 0;
  score = 0;
  playing = true;
  placeApple();
  document.getElementById('scoreLabel').textContent = score;
  document.getElementById('lenLabel').textContent = 'Length ' + snake.length;
  document.getElementById('gameOver').style.display = 'none';
  lastStep = 0;
  requestAnimationFrame(draw);
}

function placeApple() {
  apple = {
    x: Math.floor(Math.random() * columns),
    y: Math.floor(Math.random() * rows)
  };
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
  document.getElementById('finalScore').textContent = score;
  var finalNoun = document.getElementById('finalNoun');
  if (finalNoun) finalNoun.textContent = score === 1 ? finalNoun.textContent.replace(/s$/, '') : finalNoun.textContent.replace(/([^s])$/, '$1s');
  document.getElementById('gameOver').style.display = 'flex';
}

function step() {
  const head = { x: snake[0].x + goX, y: snake[0].y + goY };

  // Out one side, in the other. A phone is about sixteen squares wide, so a
  // snake that starts in the middle and dies at the wall is over in eight
  // steps: one second, while the child is still reading how to play. Wrapping
  // means the only way to lose is a mistake they can see themselves make.
  if (head.x < 0) head.x = columns - 1;
  if (head.y < 0) head.y = rows - 1;
  if (head.x >= columns) head.x = 0;
  if (head.y >= rows) head.y = 0;

  for (let i = 0; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) return endGame();
  }

  snake.unshift(head);

  if (head.x === apple.x && head.y === apple.y) {
    score = score + 1;
    document.getElementById('scoreLabel').textContent = score;
    placeApple();
  } else {
    snake.pop();
  }
  document.getElementById('lenLabel').textContent = 'Length ' + snake.length;
}

function box(x, y, colour, inset) {
  pen.fillStyle = colour;
  pen.beginPath();
  pen.roundRect(x * squareSize + inset, y * squareSize + inset,
                squareSize - inset * 2, squareSize - inset * 2, 6);
  pen.fill();
}

function draw(now) {
  if (!playing) return;
  if (now - lastStep > 1000 / stepsPerSec) {
    step();
    lastStep = now;
  }
  if (!playing) return;

  pen.clearRect(0, 0, width, height);
  box(apple.x, apple.y, appleColour, 3);
  for (let i = 0; i < snake.length; i++) {
    box(snake[i].x, snake[i].y, i === 0 ? '#fff' : snakeColour, 2);
  }
  requestAnimationFrame(draw);
}

function turn(x, y) {
  // A snake cannot fold back on itself, and letting it would end the game on
  // a mis-tap rather than on a mistake the child could see coming.
  if (x === -goX && y === -goY) return;
  goX = x; goY = y;
}
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  turn(-1, 0);
  if (e.key === 'ArrowRight') turn(1, 0);
  if (e.key === 'ArrowUp')    turn(0, -1);
  if (e.key === 'ArrowDown')  turn(0, 1);
});

let touchX = 0, touchY = 0;
window.addEventListener('pointerdown', e => { touchX = e.clientX; touchY = e.clientY; });
window.addEventListener('pointerup', e => {
  const dx = e.clientX - touchX;
  const dy = e.clientY - touchY;
  if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
  else turn(0, dy > 0 ? 1 : -1);
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

export { SNAKE };
