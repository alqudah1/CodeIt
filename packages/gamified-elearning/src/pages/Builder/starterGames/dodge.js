import { CLOSE_SCRIPT, SHARED_STYLE } from './shared';

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
// The best score is remembered if the browser lets us. In a sandboxed
// preview it does not, and that must not stop the game.
let best = 0;
try { best = Number(localStorage.getItem('best') || 0); } catch (e) { best = 0; }
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
    try { localStorage.setItem('best', String(best)); } catch (e) {}
    document.getElementById('bestLabel').textContent = best;
  }
  document.getElementById('finalScore').textContent = score;
  var finalNoun = document.getElementById('finalNoun');
  if (finalNoun) finalNoun.textContent = score === 1 ? finalNoun.textContent.replace(/s$/, '') : finalNoun.textContent.replace(/([^s])$/, '$1s');
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

export { DODGE };
