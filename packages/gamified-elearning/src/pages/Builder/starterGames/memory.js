import { CLOSE_SCRIPT, SHARED_STYLE } from './shared';

// ── 10. Colour memory ────────────────────────────────────────────────────────
//
// The one game here that is not about reflexes. It grows a list by one every
// round and asks you to repeat it, so the code is a real example of a list
// being appended to and then walked through — which is lessons 7 and 8.

const MEMORY = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Colour Memory</title>
<style>
${SHARED_STYLE}
  body { background: linear-gradient(#0C1222, #16213E 60%, #1F3057); }
  #field { position: absolute; inset: 0; display: grid; gap: 4%;
           grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;
           padding: 15% 9% 13%; }
  .pad {
    border-radius: 22px; opacity: .42; cursor: pointer;
    transition: opacity .12s ease, transform .12s ease;
  }
  .pad.lit { opacity: 1; transform: scale(1.04); }
  #says {
    position: absolute; left: 50%; top: 9%; transform: translateX(-50%);
    z-index: 2; margin: 0; font-size: 17px; font-weight: 700;
    background: rgba(0,0,0,.32); padding: 7px 18px; border-radius: 99px;
    max-width: calc(100% - 24px); text-align: center;
  }
</style>
</head>
<body>

<div class="hud"><span>🎯 Round <b id="scoreLabel">1</b></span><span>⭐ Best <b id="bestLabel">0</b></span></div>
<p id="says">Watch</p>

<div id="field">
  <div class="pad" style="background: #EF4444;"></div>
  <div class="pad" style="background: #3B82F6;"></div>
  <div class="pad" style="background: #22C55E;"></div>
  <div class="pad" style="background: #EAB308;"></div>
</div>

<div class="over" id="gameOver">
  <h2 id="endTitle">Wrong one</h2>
  <p>You got <b id="finalScore">0</b> <span id="finalNoun">rounds</span> right</p>
  <button onclick="startGame()">Play again</button>
</div>

<script>
// ── Change these and watch what happens ──
let flashFor    = 480;
let gapBetween  = 220;
let startLength = 1;
let firstPad    = '#EF4444';
let winColour   = '#3DDC97';
let padCount    = 4;

const scoreLabel = document.getElementById('scoreLabel');
const bestLabel = document.getElementById('bestLabel');
const saysLabel = document.getElementById('says');
const gameOver = document.getElementById('gameOver');

let pads = [];
let pattern = [];
let atStep = 0;
let score = 0;
let best = 0;
let yourTurn = false;

// Read the pads off the page, so a child who adds a fifth one gets a five
// colour game without touching the code.
function readPads() {
  pads = [];
  const found = document.querySelectorAll('.pad');
  for (let i = 0; i < found.length; i++) {
    found[i].classList.remove('lit');
    pads.push(found[i]);
  }
  // The first pad wears the colour from the settings, so changing that one
  // line changes something you can see before the first round is over.
  if (pads[0]) pads[0].style.background = firstPad;
  padCount = pads.length;
}

function light(which) {
  if (!pads[which]) return;
  pads[which].classList.add('lit');
  setTimeout(function () { pads[which].classList.remove('lit'); }, flashFor - 60);
}

// Play the whole pattern back, one pad at a time, then hand over.
function showPattern() {
  yourTurn = false;
  saysLabel.textContent = 'Watch';
  let step = 0;

  const player = setInterval(function () {
    if (step >= pattern.length) {
      clearInterval(player);
      yourTurn = true;
      atStep = 0;
      saysLabel.textContent = 'Your turn';
      return;
    }
    light(pattern[step]);
    step = step + 1;
  }, flashFor + gapBetween);
}

function addStep() {
  pattern.push(Math.floor(Math.random() * padCount));
  scoreLabel.textContent = pattern.length;
  saysLabel.style.color = '';
  showPattern();
}

function tapped(which) {
  if (!yourTurn) return;

  if (which !== pattern[atStep]) {
    endGame();
    return;
  }

  light(which);
  atStep = atStep + 1;

  if (atStep >= pattern.length) {
    yourTurn = false;
    score = score + 1;
    saysLabel.textContent = 'Yes!';
    saysLabel.style.color = winColour;
    if (score > best) {
      best = score;
      bestLabel.textContent = best;
    }
    setTimeout(addStep, 700);
  }
}

document.getElementById('field').addEventListener('pointerdown', function (e) {
  const pad = e.target.closest('.pad');
  if (!pad) return;
  tapped(pads.indexOf(pad));
});

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
  yourTurn = false;
  saysLabel.textContent = 'Wrong one';
  saysLabel.style.color = '';
  document.getElementById('finalScore').textContent = score;
  var finalNoun = document.getElementById('finalNoun');
  if (finalNoun) finalNoun.textContent = score === 1 ? finalNoun.textContent.replace(/s$/, '') : finalNoun.textContent.replace(/([^s])$/, '$1s');
  gameOver.style.display = 'flex';
}

function startGame() {
  readPads();
  pattern = [];
  atStep = 0;
  score = 0;
  gameOver.style.display = 'none';
  saysLabel.style.color = '';

  for (let i = 0; i < startLength; i++) {
    pattern.push(Math.floor(Math.random() * padCount));
  }
  scoreLabel.textContent = pattern.length;
  setTimeout(showPattern, 600);
}

// Wait until the frame has a size, however many frames that takes.
(function waitForSize() {
  if (window.innerWidth > 0 && window.innerHeight > 0) { startGame(); return; }
  requestAnimationFrame(waitForSize);
})();
${CLOSE_SCRIPT}
</body>
</html>`;

export { MEMORY };
