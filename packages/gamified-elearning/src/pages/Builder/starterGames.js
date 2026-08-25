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

function startGame() {
  score = 0;
  lives = startLives;
  stars = [];
  basketX = width / 2;
  playing = true;
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

  if (Math.random() < 0.05) addStar();

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
  basketX = Math.max(basketWide / 2, Math.min(width - basketWide / 2, x));
}
window.addEventListener('pointermove', e => moveBasket(e.clientX));
window.addEventListener('pointerdown', e => moveBasket(e.clientX));
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  moveBasket(basketX - 34);
  if (e.key === 'ArrowRight') moveBasket(basketX + 34);
});

startGame();
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

startGame();
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

document.getElementById('bestLabel').textContent = best;

function startGame() {
  score = 0;
  rocks = [];
  backgroundStars = [];
  for (let i = 0; i < 60; i++) {
    backgroundStars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 0.6 });
  }
  shipX = width / 2;
  shipY = height - 120;
  playing = true;
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

  if (Math.random() < rockChance) {
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

startGame();
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
];

const STARTER_IDS = STARTER_GAMES.map(game => game.id);

function starterGameById(id) {
  return STARTER_GAMES.find(game => game.id === id) || null;
}

export {
  STARTER_GAMES,
  STARTER_IDS,
  starterGameById,
};
