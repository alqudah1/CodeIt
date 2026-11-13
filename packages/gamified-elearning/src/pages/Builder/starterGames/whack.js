import { CLOSE_SCRIPT, SHARED_STYLE } from './shared';

// ── 9. Whack-a-mole ──────────────────────────────────────────────────────────
//
// The second game whose world is elements rather than canvas. Nine holes in a
// grid, and a child can drag one somewhere else, make it bigger, or delete it
// — and the game plays the board that is actually on the page, because
// readHoles() reads it fresh every round.

const WHACK = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Whack a Mole</title>
<style>
${SHARED_STYLE}
  body { background: linear-gradient(#166534, #22C55E 65%, #86EFAC); }
  #field { position: absolute; inset: 0; display: grid; gap: 3%;
           grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);
           padding: 14% 8% 12%; }
  .hole {
    position: relative; border-radius: 50%;
    background: #14532D; box-shadow: inset 0 8px 0 rgba(0,0,0,.35);
    display: flex; align-items: flex-end; justify-content: center;
    overflow: hidden; cursor: pointer;
  }
  .mole {
    width: 74%; height: 0%;
    border-radius: 44% 44% 12% 12%;
    background: #A16207;
    transition: height .12s ease;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px;
  }
  .hole.up .mole { height: 78%; }
  .hole.bonked .mole { background: #DC2626; }
</style>
</head>
<body>

<div class="hud"><span>🔨 <b id="scoreLabel">0</b></span><span>⏱ <b id="timeLabel">30</b></span></div>

<div id="field">
  <div class="hole"><div class="mole">🐹</div></div>
  <div class="hole"><div class="mole">🐹</div></div>
  <div class="hole"><div class="mole">🐹</div></div>
  <div class="hole"><div class="mole">🐹</div></div>
  <div class="hole"><div class="mole">🐹</div></div>
  <div class="hole"><div class="mole">🐹</div></div>
  <div class="hole"><div class="mole">🐹</div></div>
  <div class="hole"><div class="mole">🐹</div></div>
  <div class="hole"><div class="mole">🐹</div></div>
</div>

<p class="tip">Tap the moles. Turn on Edit elements to move the holes</p>

<div class="over" id="gameOver">
  <h2 id="endTitle">Time!</h2>
  <p>You bonked <b id="finalScore">0</b> <span id="finalNoun">moles</span></p>
  <button onclick="startGame()">Play again</button>
</div>

<script>
// ── Change these and watch what happens ──
let secondsToPlay = 30;
let popEvery      = 700;
let staysUpFor    = 900;
let moleColour    = '#A16207';

const scoreLabel = document.getElementById('scoreLabel');
const timeLabel = document.getElementById('timeLabel');
const gameOver = document.getElementById('gameOver');

let holes = [];
let score = 0;
let timeLeft = 0;
let playing = false;
let popTimer = null;
let clockTimer = null;

// Read the board off the page.
//
// Called at the start of every round, so a hole a child has dragged, resized or
// deleted is the board the game actually plays. Nothing about the level is
// stored anywhere else.
function readHoles() {
  holes = [];
  const found = document.querySelectorAll('.hole');
  for (let i = 0; i < found.length; i++) {
    const hole = found[i];
    hole.classList.remove('up', 'bonked');
    const mole = hole.querySelector('.mole');
    if (mole) mole.style.background = moleColour;
    holes.push(hole);
  }
}

function popOne() {
  if (!playing || holes.length === 0) return;
  const which = Math.floor(Math.random() * holes.length);
  const hole = holes[which];
  if (hole.classList.contains('up')) return;

  hole.classList.add('up');
  setTimeout(function () { hole.classList.remove('up', 'bonked'); }, staysUpFor);
}

function bonk(hole) {
  if (!playing) return;
  if (!hole.classList.contains('up')) return;
  if (hole.classList.contains('bonked')) return;

  hole.classList.add('bonked');
  score = score + 1;
  scoreLabel.textContent = score;
  setTimeout(function () { hole.classList.remove('up', 'bonked'); }, 140);
}

// One listener on the whole board, so a hole added later still works.
document.getElementById('field').addEventListener('pointerdown', function (e) {
  const hole = e.target.closest('.hole');
  if (hole) bonk(hole);
});

function tick() {
  timeLeft = timeLeft - 1;
  timeLabel.textContent = timeLeft;
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
  clearInterval(popTimer);
  clearInterval(clockTimer);
  for (let i = 0; i < holes.length; i++) holes[i].classList.remove('up', 'bonked');
  document.getElementById('finalScore').textContent = score;
  var finalNoun = document.getElementById('finalNoun');
  if (finalNoun) finalNoun.textContent = score === 1 ? finalNoun.textContent.replace(/s$/, '') : finalNoun.textContent.replace(/([^s])$/, '$1s');
  gameOver.style.display = 'flex';
}

function startGame() {
  clearInterval(popTimer);
  clearInterval(clockTimer);
  readHoles();
  score = 0;
  timeLeft = secondsToPlay;
  playing = true;
  scoreLabel.textContent = score;
  timeLabel.textContent = timeLeft;
  gameOver.style.display = 'none';
  popTimer = setInterval(popOne, popEvery);
  clockTimer = setInterval(tick, 1000);
  popOne();
}

// Wait until the frame has a size, however many frames that takes.
(function waitForSize() {
  if (window.innerWidth > 0 && window.innerHeight > 0) { startGame(); return; }
  requestAnimationFrame(waitForSize);
})();
${CLOSE_SCRIPT}
</body>
</html>`;

export { WHACK };
