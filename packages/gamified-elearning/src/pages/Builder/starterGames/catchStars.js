import { CLOSE_SCRIPT, SHARED_STYLE } from './shared';

// ── 1. Catch the falling stars ───────────────────────────────────────────────
//
// The most legible game there is: something falls, you catch it. Understood in
// one second with no instructions, which is the whole test.

const CATCH_STARS = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Catch the Stars</title>
<style>
${SHARED_STYLE}
  body { background: linear-gradient(#1b1440, #2d1b69 60%, #4c2a85); }
  canvas { display: block; }
</style>
</head>
<body>

<div class="hud"><span>⭐ <b id="scoreLabel">0</b></span><span id="livesLabel">❤️❤️❤️</span></div>
<canvas id="screen"></canvas>
<p class="tip">Move your finger to catch the stars</p>

<div class="over" id="gameOver">
  <h2>Game over!</h2>
  <p>You caught <b id="finalScore">0</b> <span id="finalNoun">stars</span></p>
  <button onclick="startGame()">Play again</button>
</div>

<script>
// ── Change these and watch what happens ──
let fallSpeed  = 3;
let starSize   = 18;
let starColour = '#FFD84D';
let basketWide = 90;
let startLives = 3;

// You, in the game: if CodeIt handed us your avatar, you are the catcher.
// (In Scratch: this is like choosing your own sprite as the player.)
// This block sits BELOW the settings on purpose. The Controls panel reads the
// author's marked block as consecutive declarations and stops at the first
// blank line, so when the avatar code was inserted between basketWide and
// startLives on 31 August, the panel silently dropped to four knobs and a
// child could no longer change how many lives they start with.
let playerImg = null;
if (window.CODEIT_PLAYER_SPRITE) {
  playerImg = new Image();
  playerImg.src = window.CODEIT_PLAYER_SPRITE;
}

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
let stars = [];
let basketX = 0;
let playing = false;

// Nothing falls until the child moves.
//
// The game used to start the moment the page did. A child taps the card on the
// front page, the studio opens, they look up, read "move your finger to catch
// the stars" and by then three stars have hit the floor and it says Game over.
// Three or four seconds, and the first thing this product ever did was beat
// them at something they had not started playing.
let started = false;
let waitSpin = 0;

function startGame() {
  score = 0;
  lives = startLives;
  stars = [];
  basketX = width / 2;
  playing = true;
  started = false;
  document.getElementById('scoreLabel').textContent = score;
  document.getElementById('livesLabel').textContent = '\u2764\ufe0f'.repeat(lives);
  document.getElementById('gameOver').style.display = 'none';
  draw();
}

function addStar() {
  stars.push({ x: 30 + Math.random() * (width - 60), y: -20, spin: Math.random() * 6 });
}

function drawStar(x, y, size, spin) {
  pen.save();
  pen.translate(x, y);
  pen.rotate(spin);
  pen.fillStyle = starColour;
  pen.beginPath();
  for (let point = 0; point < 5; point++) {
    pen.lineTo(0, 0 - size);
    pen.rotate(Math.PI / 5);
    pen.lineTo(0, 0 - size * 0.45);
    pen.rotate(Math.PI / 5);
  }
  pen.fill();
  pen.restore();
}

function loseALife() {
  lives = lives - 1;
  document.getElementById('livesLabel').textContent = '\u2764\ufe0f'.repeat(Math.max(0, lives));
  if (lives <= 0) {
    playing = false;
    document.getElementById('finalScore').textContent = score;
  var finalNoun = document.getElementById('finalNoun');
  if (finalNoun) finalNoun.textContent = score === 1 ? finalNoun.textContent.replace(/s$/, '') : finalNoun.textContent.replace(/([^s])$/, '$1s');
    document.getElementById('gameOver').style.display = 'flex';
  }
}

function draw() {
  if (!playing) return;
  pen.clearRect(0, 0, width, height);

  if (started && Math.random() < 0.05) addStar();

  // Before the first move, three stars hover near the top, waiting. So the
  // child sees what they are about to catch, in the colour they chose, and
  // nothing falls until they say so.
  if (!started) {
    waitSpin = waitSpin + 0.02;
    for (let i = 0; i < 3; i++) {
      drawStar(width * (0.25 + 0.25 * i), 70 + Math.sin(waitSpin + i) * 6, starSize, waitSpin + i);
    }
  }

  const basketY = height - 60;
  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];
    star.y = star.y + fallSpeed;
    star.spin = star.spin + 0.05;
    drawStar(star.x, star.y, starSize, star.spin);

    const caught = star.y > basketY - 16 && star.y < basketY + 30
      && Math.abs(star.x - basketX) < basketWide / 2;
    if (caught) {
      stars.splice(i, 1);
      score = score + 1;
      document.getElementById('scoreLabel').textContent = score;
    } else if (star.y > height) {
      stars.splice(i, 1);
      loseALife();
    }
  }

  pen.fillStyle = '#FF7A00';
  pen.beginPath();
  pen.roundRect(basketX - basketWide / 2, basketY, basketWide, 26, 12);
  pen.fill();

  // Your avatar stands behind the basket, catching with you.
  if (playerImg && playerImg.complete && playerImg.naturalWidth > 0) {
    pen.drawImage(playerImg, basketX - 26, basketY - 56, 52, 52);
  }

  requestAnimationFrame(draw);
}

function moveBasket(x) {
  started = true;
  basketX = Math.max(basketWide / 2, Math.min(width - basketWide / 2, x));
}
window.addEventListener('pointermove', e => moveBasket(e.clientX));
window.addEventListener('pointerdown', e => moveBasket(e.clientX));
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  moveBasket(basketX - 34);
  if (e.key === 'ArrowRight') moveBasket(basketX + 34);
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

export { CATCH_STARS };
