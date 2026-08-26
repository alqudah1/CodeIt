// ── Games a child recognises as games ────────────────────────────────────────
//
// The old starters were web pages with buttons: fifteen onclick handlers, no
// canvas, no animation loop, and the word "score" twice. A ten-year-old who
// asks for a game and gets a page with three buttons on it does not come back,
// and no amount of work on the rest of the studio fixes that.
//
// So these are real games. Every one of them has something that moves on its
// own, a score that goes up, a way to lose, and controls that work with a thumb
// on a phone and with arrow keys on a school laptop. They start instantly —
// nothing here waits for a model to write it — which is the difference between
// "I made a game" and "I waited twenty seconds and got a web page".
//
// ── Written to be read, not just run ─────────────────────────────────────────
//
// Every game opens with a block of plain settings:
//
//     let fallSpeed = 3;
//     let starColour = '#FFD84D';
//     let livesLeft  = 3;
//
// That is not decoration. It is the first code a child will ever change, and
// changing a number and watching the game get harder is the moment the whole
// idea lands. It also feeds the rest of the studio: changeIdeas.js reads those
// declarations to suggest real changes, and proveIt.js builds its questions
// from them — "what does fallSpeed start as?" is only a fair question when the
// project really has a variable called fallSpeed.
//
// So: short names, obvious names, values at the top, no cleverness. A minified
// game would run just as well and teach nothing.

// Built rather than written literally: `<\/script>` is a meaningless escape
// inside a template literal, and writing the tag whole would end this file's
// own script block if it were ever inlined into a page.
const CLOSE_SCRIPT = `<${'/'}script>`;

const SHARED_STYLE = `
  * { box-sizing: border-box; }
  body {
    margin: 0; overflow: hidden; touch-action: none;
    font-family: system-ui, -apple-system, sans-serif;
    color: #fff; user-select: none;
  }
  .hud {
    position: absolute; top: 0; left: 0; right: 0; z-index: 2;
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 16px; font-weight: 800; font-size: 17px;
    text-shadow: 0 2px 6px rgba(0,0,0,.45); pointer-events: none;
  }
  .hud span { background: rgba(0,0,0,.28); border-radius: 99px; padding: 6px 14px; }
  .over {
    position: absolute; inset: 0; z-index: 3; display: none;
    flex-direction: column; align-items: center; justify-content: center; gap: 14px;
    background: rgba(9,10,25,.82); backdrop-filter: blur(3px); text-align: center; padding: 24px;
  }
  .over h2 { margin: 0; font-size: 34px; }
  .over p { margin: 0; font-size: 18px; opacity: .9; }
  .over button {
    border: 0; border-radius: 14px; padding: 15px 30px;
    font-size: 19px; font-weight: 800; color: #241704;
    background: #FFD84D; cursor: pointer;
  }
  .tip {
    position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 2;
    margin: 0; padding: 7px 16px; border-radius: 99px;
    background: rgba(0,0,0,.42); font-size: 14px; opacity: .9; pointer-events: none;
    white-space: nowrap;
    /* Gets out of the way on its own. A first-time hint that never leaves ends
       up sitting on top of the game — in the catch game it printed straight
       across the basket. */
    animation: fadeTip .8s 3s forwards;
  }
  @keyframes fadeTip { to { opacity: 0; } }
`;

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
  <p>You caught <b id="finalScore">0</b> stars</p>
  <button onclick="startGame()">Play again</button>
</div>

<script>
// ── Change these and watch what happens ──
let fallSpeed  = 3;
let starSize   = 18;
let starColour = '#FFD84D';
let basketWide = 90;
let startLives = 3;

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
    document.getElementById('gameOver').style.display = 'flex';
  }
}

function draw() {
  if (!playing) return;
  pen.clearRect(0, 0, width, height);

  if (started && Math.random() < 0.05) addStar();

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

// ── 3. Dodge the asteroids ───────────────────────────────────────────────────
//
// The one where the score climbs on its own, which is what makes a child say
// "one more go".

const DODGE = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Asteroid Dodge</title>
<style>
${SHARED_STYLE}
  body { background: radial-gradient(circle at 30% 20%, #241a5c, #0b0a1f 70%); }
  canvas { display: block; }
</style>
</head>
<body>

<div class="hud"><span>🚀 <b id="scoreLabel">0</b></span><span>Best: <b id="bestLabel">0</b></span></div>
<canvas id="screen"></canvas>
<p class="tip">Move your finger to fly</p>

<div class="over" id="gameOver">
  <h2>Crashed!</h2>
  <p>You flew <b id="finalScore">0</b> metres</p>
  <button onclick="startGame()">Fly again</button>
</div>

<script>
// ── Change these and watch what happens ──
let rockSpeed  = 4;
let rockChance = 0.04;
let shipColour = '#FF7A00';
let shipSize   = 18;

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
let best = Number(localStorage.getItem('best') || 0);
let rocks = [];
let backgroundStars = [];
let shipX = 0, shipY = 0;
let playing = false;

// Nothing falls until the child moves. Same reason as the catching game: the
// ship starts under the rocks, so a player who is still working out how to
// steer loses before they have steered. The stars keep streaming past, so the
// screen is alive while it waits.
let started = false;

document.getElementById('bestLabel').textContent = best;

function startGame() {
  score = 0;
  rocks = [];
  backgroundStars = [];
  for (let i = 0; i < 60; i++) {
    backgroundStars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 0.6 });
  }
  shipX = width / 2;
  // Clamped, because the preview frame is not always tall. A fixed 120px from
  // the bottom puts the ship above the top of a short frame, and the game then
  // runs perfectly with nothing visible in it.
  shipY = Math.max(shipSize * 2, height - Math.min(120, height * 0.25));
  playing = true;
  started = false;
  document.getElementById('gameOver').style.display = 'none';
  draw();
}

function crash() {
  playing = false;
  if (score > best) {
    best = score;
    localStorage.setItem('best', String(best));
    document.getElementById('bestLabel').textContent = best;
  }
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOver').style.display = 'flex';
}

function draw() {
  if (!playing) return;
  pen.clearRect(0, 0, width, height);

  score = score + 1;
  document.getElementById('scoreLabel').textContent = score;

  // The stars stream past, which is the only thing that makes standing still
  // feel like moving.
  pen.fillStyle = 'rgba(255,255,255,.7)';
  for (const star of backgroundStars) {
    star.y = star.y + rockSpeed * 0.55;
    if (star.y > height) { star.y = -4; star.x = Math.random() * width; }
    pen.fillRect(star.x, star.y, star.size, star.size * 3);
  }

  if (started && Math.random() < rockChance) {
    rocks.push({ x: Math.random() * width, y: -30, size: 14 + Math.random() * 22 });
  }

  pen.fillStyle = '#8b7ec8';
  for (let i = rocks.length - 1; i >= 0; i--) {
    const rock = rocks[i];
    rock.y = rock.y + rockSpeed;
    pen.beginPath();
    pen.arc(rock.x, rock.y, rock.size, 0, Math.PI * 2);
    pen.fill();

    const dx = rock.x - shipX;
    const dy = rock.y - shipY;
    if (Math.sqrt(dx * dx + dy * dy) < rock.size + shipSize * 0.7) crash();
    if (rock.y > height + 40) rocks.splice(i, 1);
  }

  pen.fillStyle = '#FFD84D';
  pen.beginPath();
  pen.moveTo(shipX, shipY + shipSize + 6 + Math.random() * 10);
  pen.lineTo(shipX + 7, shipY + shipSize - 2);
  pen.lineTo(shipX - 7, shipY + shipSize - 2);
  pen.fill();

  pen.fillStyle = shipColour;
  pen.beginPath();
  pen.moveTo(shipX, shipY - shipSize);
  pen.lineTo(shipX + shipSize * 0.8, shipY + shipSize);
  pen.lineTo(shipX - shipSize * 0.8, shipY + shipSize);
  pen.fill();

  requestAnimationFrame(draw);
}

function flyTo(x, y) {
  started = true;
  shipX = Math.max(shipSize, Math.min(width - shipSize, x));
  shipY = Math.max(shipSize, Math.min(height - shipSize, y));
}
window.addEventListener('pointermove', e => flyTo(e.clientX, e.clientY));
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  flyTo(shipX - 34, shipY);
  if (e.key === 'ArrowRight') flyTo(shipX + 34, shipY);
  if (e.key === 'ArrowUp')    flyTo(shipX, shipY - 34);
  if (e.key === 'ArrowDown')  flyTo(shipX, shipY + 34);
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

/**
 * The starts a child can tap.
 *
 * `label` is what appears on the card and has to read like something you would
 * want, not like a category. "Catch the falling stars" beats "Arcade game".
 *
 * `prompt` is what the studio tells the AI the child asked for, so that a later
 * "make it harder" or "add a boss" lands on the right kind of thing.
 */
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
  <p>You popped <b id="finalScore">0</b> balloons</p>
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

function endGame() {
  playing = false;
  clearInterval(clock);
  document.getElementById('finalScore').textContent = score;
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
  <p>You ate <b id="finalScore">0</b> apples</p>
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

function endGame() {
  playing = false;
  document.getElementById('finalScore').textContent = score;
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
  <p>You smashed <b id="finalScore">0</b> bricks</p>
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
  <p>You cleared <b id="finalScore">0</b> gaps</p>
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
let best = Number(localStorage.getItem('bestJump') || 0);
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

function endGame() {
  playing = false;
  if (score > best) {
    best = score;
    localStorage.setItem('bestJump', best);
  }
  document.getElementById('finalScore').textContent = score;
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


const STARTER_GAMES = [
  {
    id: 'catch-stars',
    label: 'Catch the falling stars',
    emoji: '⭐',
    blurb: 'Move the basket. Miss three and it is over.',
    prompt: 'a game where you catch falling stars in a basket',
    code: CATCH_STARS,
  },
  {
    id: 'penalty',
    label: 'Penalty shootout',
    emoji: '⚽',
    blurb: 'Five shots. Beat the goalkeeper.',
    prompt: 'a football penalty shootout game with a moving goalkeeper',
    code: PENALTY,
  },
  {
    id: 'dodge',
    label: 'Dodge the asteroids',
    emoji: '🚀',
    blurb: 'Fly as far as you can without crashing.',
    prompt: 'a space game where you fly a rocket and dodge asteroids',
    code: DODGE,
  },
  {
    id: 'pop-balloons',
    label: 'Pop the balloons',
    emoji: '🎈',
    blurb: 'Tap them before they float away. Thirty seconds.',
    prompt: 'a game where balloons float up the screen and you tap them to pop them before a timer runs out',
    code: POP_BALLOONS,
  },
  {
    id: 'snake',
    label: 'Snake',
    emoji: '🐍',
    blurb: 'Eat apples. Get longer. Do not bump into yourself.',
    prompt: 'a snake game where you eat apples, grow longer, and lose if you hit the wall or your own tail',
    code: SNAKE,
  },
  {
    id: 'bricks',
    label: 'Brick breaker',
    emoji: '🧱',
    blurb: 'Bounce the ball. Clear every brick.',
    prompt: 'a brick breaker game with a paddle, a bouncing ball, and rows of bricks to smash',
    code: BRICKS,
  },
  {
    id: 'jumper',
    label: 'Jump the gap',
    emoji: '🏃',
    blurb: 'One tap to jump. How far can you get?',
    prompt: 'a one-button endless runner where you tap to jump over gaps in the ground',
    code: JUMPER,
  },
];

// ── How many a child is shown, and where ─────────────────────────────────────
//
// Two different problems that used to share one answer.
//
// The front page has to be chosen from in about two seconds by someone who has
// not decided to try this yet. Seven cards there is a menu, and a menu is a
// decision, and a decision is where people leave. Three is a glance.
//
// The studio is the opposite. A child is already in, already had a go, and the
// question is whether there is another one. Running out is what ends the visit,
// so everything is offered there.
//
// So: HOME_PICKS is deliberately short. STARTER_GAMES is deliberately not.
const HOME_PICKS = STARTER_GAMES.slice(0, 3);

const STARTER_IDS = STARTER_GAMES.map(game => game.id);

function starterGameById(id) {
  return STARTER_GAMES.find(game => game.id === id) || null;
}

export {
  HOME_PICKS,
  STARTER_GAMES,
  STARTER_IDS,
  starterGameById,
};
