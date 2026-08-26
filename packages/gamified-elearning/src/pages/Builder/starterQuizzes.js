// ── Quizzes a child can take apart ───────────────────────────────────────────
//
// The games are canvas. A canvas is one element, so the studio's editor cannot
// reach inside it: tapping a falling star selects the whole board. Quizzes are
// the opposite. Every question, every answer button, every word of the result
// screen is a real element, so the click-to-select, drag, resize and recolour
// tools that already exist work on all of it without a line of new editor code.
//
// That makes these the clearest answer to "what can I actually change in here?"
// — which is the question a child has in the first thirty seconds.
//
// Each one carries a settings block at the top of its script for the same
// reason the games do: changeIdeas.js reads those declarations to suggest real
// changes, proveIt.js builds questions from them, and the code tab lists the
// concepts it finds. A quiz with its questions written straight into the HTML
// would run identically and teach nothing, so the questions live in an array
// and the page is built from that array in a loop.
//
// ── Why there is a template here rather than five hand-written files ─────────
//
// The first version of this file wrote one quiz out in full and made the others
// by running .replace() over it. That has a silent failure mode: change a
// single character in the original and the replacement quietly matches nothing,
// so the space quiz ships full of animal questions and every test still passes
// because the file is valid and the page still runs.
//
// A function cannot fail that way. The questions are data, the page is one
// template, and a typo is a crash rather than a wrong answer.

const CLOSE_SCRIPT = `<${'/'}script>`;

const QUIZ_STYLE = `
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh;
    font-family: system-ui, -apple-system, sans-serif;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .card {
    width: 100%; max-width: 520px;
    background: rgba(255,255,255,.96);
    border-radius: 22px;
    padding: 26px 22px 22px;
    box-shadow: 0 18px 50px rgba(0,0,0,.28);
    color: #16182B;
  }
  .top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 8px; }
  .top b { font-size: 13px; letter-spacing: .04em; text-transform: uppercase; opacity: .55; font-weight: 700; }
  .bar { height: 8px; border-radius: 99px; background: #E7E9F5; overflow: hidden; margin-bottom: 20px; }
  .bar i { display: block; height: 100%; width: 0%; border-radius: 99px; transition: width .3s ease; }
  h1 { margin: 0 0 16px; font-size: 25px; line-height: 1.25; }
  .ask { margin: 0 0 18px; font-size: 21px; font-weight: 700; line-height: 1.35; }
  .answers { display: grid; gap: 10px; }
  .answers button {
    width: 100%; text-align: left;
    border: 2px solid #E7E9F5; background: #fff;
    border-radius: 14px; padding: 15px 16px;
    font-size: 17px; font-weight: 600; font-family: inherit; color: #16182B;
    cursor: pointer; min-height: 52px; line-height: 1.35;
  }
  .answers button:hover { border-color: #C9CEEA; }
  .answers button.right { border-color: #1B9E5F; background: #E8F8EF; }
  .answers button.wrong { border-color: #D8443C; background: #FDECEA; }
  .say { margin: 16px 0 0; font-size: 16px; line-height: 1.5; min-height: 48px; }
  .go {
    margin-top: 18px; width: 100%; border: 0; border-radius: 14px;
    padding: 16px; font-size: 18px; font-weight: 800; font-family: inherit;
    color: #fff; cursor: pointer; min-height: 54px;
  }
  .end { display: none; text-align: center; }
  .end .big { font-size: 54px; margin: 6px 0; font-weight: 800; }
  .end h2 { margin: 0 0 6px; font-size: 28px; }
  .end p { font-size: 18px; line-height: 1.5; margin: 0 0 4px; }

  /* ── Short screens, which is where this actually lives ──────────────────
     The studio's preview pane is about 500px tall, whatever size the screen
     around it is. At full size this card is 574px, so the fourth answer sat
     below the fold and a child had to scroll inside a preview to find out
     there were four options at all.

     Published on its own page the card has the whole window and can breathe,
     so this only tightens when the room is genuinely short. */
  @media (max-height: 640px) {
    .card { padding: 18px 18px 16px; border-radius: 18px; }
    .bar { margin-bottom: 14px; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    .ask { font-size: 18px; margin-bottom: 12px; }
    .answers { gap: 8px; }
    /* The personality quiz's answers are sentences, so they wrap to two lines.
       Four two-line buttons is what decides whether the card fits. */
    .answers button { padding: 11px 14px; min-height: 46px; font-size: 16px; line-height: 1.28; }
    .say { margin-top: 11px; min-height: 34px; font-size: 15px; }
    .go { margin-top: 13px; padding: 13px; min-height: 48px; }
    .end .big { font-size: 42px; }
    .end h2 { font-size: 23px; }
  }
`;

/** Turn a list of questions into the `questions = [...]` a child will edit. */
function questionArray(questions) {
  const rows = questions.map(question => {
    const answers = question.answers.map(answer => `'${answer.replace(/'/g, "\\'")}'`).join(', ');
    return `  { ask: '${question.ask.replace(/'/g, "\\'")}',
    answers: [${answers}], right: ${question.right},
    why: '${question.why.replace(/'/g, "\\'")}' },`;
  });
  return `let questions = [\n${rows.join('\n')}\n];`;
}

/**
 * One right-or-wrong quiz page.
 *
 * Everything that differs between the animal, space and football quizzes is an
 * argument here. Nothing is copied.
 */
function rightWrongQuiz({ title, heading, background, accent, questions, passMark, wellDone, tryAgain }) {
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
${QUIZ_STYLE}
  body { background: ${background}; }
  .bar i, .go { background: ${accent}; }
</style>
</head>
<body>

<div class="card">
  <div class="top"><b id="countLabel">Question 1 of ${questions.length}</b><b id="scoreLabel">0 right</b></div>
  <div class="bar"><i id="barFill"></i></div>

  <div id="playing">
    <h1 id="quizTitle">${heading}</h1>
    <p class="ask" id="askLabel">Loading...</p>
    <div class="answers" id="answerBox"></div>
    <p class="say" id="sayLabel"></p>
  </div>

  <div class="end" id="endScreen">
    <h2>All done</h2>
    <p class="big" id="finalLabel">0 / ${questions.length}</p>
    <p id="gradeLabel"></p>
    <button class="go" onclick="startQuiz()">Play again</button>
  </div>
</div>

<script>
// ── Change these and watch what happens ──
let passMark    = ${passMark};
let rightColour = '#1B9E5F';
let wrongColour = '#D8443C';
let showAnswer  = true;

// Every question is one row: what to ask, the answers, and which one is right.
// Counting starts at 0, so right: 2 means the third answer.
${questionArray(questions)}

let atQuestion = 0;
let score = 0;
let answered = false;

const askLabel = document.getElementById('askLabel');
const answerBox = document.getElementById('answerBox');
const sayLabel = document.getElementById('sayLabel');
const countLabel = document.getElementById('countLabel');
const scoreLabel = document.getElementById('scoreLabel');
const barFill = document.getElementById('barFill');
const playing = document.getElementById('playing');
const endScreen = document.getElementById('endScreen');

// Build the answer buttons for whichever question we are on.
function showQuestion() {
  const question = questions[atQuestion];
  answered = false;
  askLabel.textContent = question.ask;
  sayLabel.textContent = '';
  countLabel.textContent = 'Question ' + (atQuestion + 1) + ' of ' + questions.length;
  scoreLabel.textContent = score + ' right';
  barFill.style.width = (atQuestion / questions.length * 100) + '%';

  answerBox.innerHTML = '';
  for (let i = 0; i < question.answers.length; i++) {
    const button = document.createElement('button');
    button.textContent = question.answers[i];
    button.onclick = function () { pick(i, button); };
    answerBox.appendChild(button);
  }
}

// One tap. Mark it, say why, then move on.
function pick(chosen, button) {
  if (answered) return;
  answered = true;
  const question = questions[atQuestion];

  if (chosen === question.right) {
    score = score + 1;
    button.classList.add('right');
    button.style.borderColor = rightColour;
    sayLabel.textContent = 'Correct. ' + (showAnswer ? question.why : '');
  } else {
    button.classList.add('wrong');
    button.style.borderColor = wrongColour;
    answerBox.children[question.right].classList.add('right');
    sayLabel.textContent = showAnswer ? question.why : 'Not this time.';
  }

  scoreLabel.textContent = score + ' right';
  setTimeout(nextQuestion, 1600);
}

function nextQuestion() {
  atQuestion = atQuestion + 1;
  if (atQuestion >= questions.length) finish();
  else showQuestion();
}

function finish() {
  playing.style.display = 'none';
  endScreen.style.display = 'block';
  barFill.style.width = '100%';
  countLabel.textContent = 'Finished';
  document.getElementById('finalLabel').textContent = score + ' / ' + questions.length;
  document.getElementById('gradeLabel').textContent =
    score >= passMark ? '${wellDone}' : '${tryAgain}';
}

function startQuiz() {
  atQuestion = 0;
  score = 0;
  playing.style.display = 'block';
  endScreen.style.display = 'none';
  showQuestion();
}

startQuiz();
${CLOSE_SCRIPT}
</body>
</html>`;
}

// ── The three right-or-wrong quizzes ─────────────────────────────────────────

const ANIMAL_QUIZ = rightWrongQuiz({
  title: 'Animal Quiz',
  heading: '🐾 How well do you know animals?',
  background: 'linear-gradient(140deg, #0F766E, #14B8A6 55%, #5EEAD4)',
  accent: '#0F766E',
  passMark: 4,
  wellDone: 'You really know your animals.',
  tryAgain: 'Have another go and beat that score.',
  questions: [
    { ask: 'Which animal is the fastest on land?',
      answers: ['Lion', 'Cheetah', 'Horse', 'Kangaroo'], right: 1,
      why: 'A cheetah can run about 100 km per hour, but only in short bursts.' },
    { ask: 'How many hearts does an octopus have?',
      answers: ['One', 'Two', 'Three', 'Eight'], right: 2,
      why: 'Two send blood to the gills and one sends it round the rest of the body.' },
    { ask: 'Which of these is not a mammal?',
      answers: ['Dolphin', 'Bat', 'Penguin', 'Whale'], right: 2,
      why: 'A penguin is a bird. It has feathers and it lays eggs.' },
    { ask: 'What is a group of crows called?',
      answers: ['A herd', 'A murder', 'A pack', 'A school'], right: 1,
      why: 'A group of crows really is called a murder. Nobody is quite sure why.' },
    { ask: 'Which animal mostly sleeps standing up?',
      answers: ['Cat', 'Dog', 'Elephant', 'Giraffe'], right: 3,
      why: 'Giraffes sleep standing, in naps of only a few minutes.' },
  ],
});

const SPACE_QUIZ = rightWrongQuiz({
  title: 'Space Quiz',
  heading: '🚀 How much do you know about space?',
  background: 'linear-gradient(140deg, #1E1B4B, #4338CA 55%, #818CF8)',
  accent: '#4338CA',
  passMark: 4,
  wellDone: 'You know your way around the solar system.',
  tryAgain: 'Go round again. It sticks the second time.',
  questions: [
    { ask: 'Which planet is closest to the Sun?',
      answers: ['Venus', 'Mercury', 'Mars', 'Earth'], right: 1,
      why: 'Mercury is closest, which is why a year there lasts only 88 Earth days.' },
    { ask: 'What is the Sun mostly made of?',
      answers: ['Iron', 'Rock', 'Hydrogen', 'Water'], right: 2,
      why: 'Mostly hydrogen, squeezing together into helium and giving off light.' },
    { ask: 'Why do astronauts float on the space station?',
      answers: ['There is no gravity up there', 'They are falling around the Earth', 'Their suits are very light', 'The station spins'], right: 1,
      why: 'The station is falling towards Earth and moving sideways fast enough to keep missing it.' },
    { ask: 'Which planet has the Great Red Spot?',
      answers: ['Saturn', 'Neptune', 'Mars', 'Jupiter'], right: 3,
      why: 'It is a storm on Jupiter, and it is wider than the whole Earth.' },
    { ask: 'What does a light year measure?',
      answers: ['Distance', 'Time', 'Brightness', 'Speed'], right: 0,
      why: 'It is how far light travels in one year. A distance, not a length of time.' },
  ],
});

const FOOTBALL_QUIZ = rightWrongQuiz({
  title: 'Football Quiz',
  heading: '⚽ Do you know the rules?',
  background: 'linear-gradient(140deg, #052E16, #15803D 55%, #4ADE80)',
  accent: '#15803D',
  passMark: 4,
  wellDone: 'You know the rules better than most.',
  tryAgain: 'Close. Run it back.',
  questions: [
    { ask: 'How many players from one team start on the pitch?',
      answers: ['Nine', 'Ten', 'Eleven', 'Twelve'], right: 2,
      why: 'Eleven, and one of them has to be the goalkeeper.' },
    { ask: 'How long is a match, not counting stoppage time?',
      answers: ['90 minutes', '60 minutes', '80 minutes', '120 minutes'], right: 0,
      why: 'Two halves of 45 minutes each.' },
    { ask: 'What happens when a player gets a second yellow card?',
      answers: ['Nothing yet', 'A penalty', 'A free kick', 'A red card'], right: 3,
      why: 'Two yellows make a red, and the player has to leave the pitch.' },
    { ask: 'How far from the goal is a penalty taken?',
      answers: ['Nine metres', 'Eleven metres', 'Fifteen metres', 'Eighteen metres'], right: 1,
      why: 'Eleven metres, which is twelve yards.' },
    { ask: 'Who is allowed to use their hands inside the penalty area?',
      answers: ['Anyone on the team', 'The captain', 'The goalkeeper', 'Nobody at all'], right: 2,
      why: 'Only the goalkeeper, and only inside their own area.' },
  ],
});

// ── 4. Maths, with questions the code makes up ───────────────────────────────

const MATHS_QUIZ = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Maths Challenge</title>
<style>
${QUIZ_STYLE}
  body { background: linear-gradient(140deg, #7C2D12, #EA580C 55%, #FDBA74); }
  .bar i, .go { background: #C2410C; }
  .ask { font-size: 42px; text-align: center; letter-spacing: .03em; font-variant-numeric: tabular-nums; }
  .answers { grid-template-columns: 1fr 1fr; }
  .answers button { text-align: center; font-size: 22px; font-variant-numeric: tabular-nums; }
  .say { min-height: 26px; text-align: center; }
  @media (max-height: 640px) {
    .ask { font-size: 34px; }
    .answers button { font-size: 20px; }
  }
</style>
</head>
<body>

<div class="card">
  <div class="top"><b id="countLabel">Question 1 of 10</b><b id="scoreLabel">0 right</b></div>
  <div class="bar"><i id="barFill"></i></div>

  <div id="playing">
    <h1 id="quizTitle">➗ Maths challenge</h1>
    <p class="ask" id="askLabel">...</p>
    <div class="answers" id="answerBox"></div>
    <p class="say" id="sayLabel"></p>
  </div>

  <div class="end" id="endScreen">
    <h2>Finished</h2>
    <p class="big" id="finalLabel">0 / 10</p>
    <p id="gradeLabel"></p>
    <button class="go" onclick="startQuiz()">Try again</button>
  </div>
</div>

<script>
// ── Change these and watch what happens ──
let howManyQuestions = 10;
let biggestNumber    = 12;
let useTimesTables   = true;
let passMark         = 7;

let atQuestion = 0;
let score = 0;
let rightAnswer = 0;
let answered = false;

const askLabel = document.getElementById('askLabel');
const answerBox = document.getElementById('answerBox');
const sayLabel = document.getElementById('sayLabel');
const countLabel = document.getElementById('countLabel');
const scoreLabel = document.getElementById('scoreLabel');
const barFill = document.getElementById('barFill');
const playing = document.getElementById('playing');
const endScreen = document.getElementById('endScreen');

// A whole number from 1 up to biggest, including biggest.
function pickNumber(biggest) {
  return Math.floor(Math.random() * biggest) + 1;
}

// Nobody wrote these questions down. The code makes a new one every time, so
// the quiz is never the same twice and it cannot be memorised.
function makeQuestion() {
  const left = pickNumber(biggestNumber);
  const right = pickNumber(biggestNumber);
  let sign = '+';

  if (useTimesTables) {
    const roll = Math.floor(Math.random() * 3);
    if (roll === 1) sign = '-';
    if (roll === 2) sign = '×';
  } else if (Math.random() < 0.5) {
    sign = '-';
  }

  let a = left;
  let b = right;
  if (sign === '-' && b > a) { a = right; b = left; }   // keep the answer positive

  if (sign === '+') rightAnswer = a + b;
  else if (sign === '-') rightAnswer = a - b;
  else rightAnswer = a * b;

  askLabel.textContent = a + ' ' + sign + ' ' + b;
  return rightAnswer;
}

// Three wrong answers, close enough that you have to actually work it out.
function makeChoices(correct) {
  const choices = [correct];
  let guard = 0;
  while (choices.length < 4 && guard < 200) {
    guard = guard + 1;
    const nudge = pickNumber(5) * (Math.random() < 0.5 ? -1 : 1);
    const guess = correct + nudge;
    if (guess >= 0 && choices.indexOf(guess) === -1) choices.push(guess);
  }
  while (choices.length < 4) choices.push(correct + choices.length);

  // Shuffle, so the right one is not always in the same place.
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const keep = choices[i];
    choices[i] = choices[j];
    choices[j] = keep;
  }
  return choices;
}

function showQuestion() {
  answered = false;
  sayLabel.textContent = '';
  countLabel.textContent = 'Question ' + (atQuestion + 1) + ' of ' + howManyQuestions;
  scoreLabel.textContent = score + ' right';
  barFill.style.width = (atQuestion / howManyQuestions * 100) + '%';

  const correct = makeQuestion();
  const choices = makeChoices(correct);

  answerBox.innerHTML = '';
  for (let i = 0; i < choices.length; i++) {
    const value = choices[i];
    const button = document.createElement('button');
    button.textContent = value;
    button.onclick = function () { pick(value, button); };
    answerBox.appendChild(button);
  }
}

function pick(chosen, button) {
  if (answered) return;
  answered = true;

  if (chosen === rightAnswer) {
    score = score + 1;
    button.classList.add('right');
    sayLabel.textContent = 'Yes.';
  } else {
    button.classList.add('wrong');
    sayLabel.textContent = 'It was ' + rightAnswer + '.';
  }

  scoreLabel.textContent = score + ' right';
  setTimeout(function () {
    atQuestion = atQuestion + 1;
    if (atQuestion >= howManyQuestions) finish();
    else showQuestion();
  }, 1000);
}

function finish() {
  playing.style.display = 'none';
  endScreen.style.display = 'block';
  barFill.style.width = '100%';
  countLabel.textContent = 'Finished';
  document.getElementById('finalLabel').textContent = score + ' / ' + howManyQuestions;
  document.getElementById('gradeLabel').textContent =
    score >= passMark ? 'That is quick maths.' : 'Go again. It gets faster.';
}

function startQuiz() {
  atQuestion = 0;
  score = 0;
  playing.style.display = 'block';
  endScreen.style.display = 'none';
  showQuestion();
}

startQuiz();
${CLOSE_SCRIPT}
</body>
</html>`;

// ── 5. Which one are you? ────────────────────────────────────────────────────

const PERSONALITY_QUIZ = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Which Creature Are You?</title>
<style>
${QUIZ_STYLE}
  body { background: linear-gradient(140deg, #581C87, #A21CAF 55%, #F0ABFC); }
  .bar i, .go { background: #A21CAF; }
  .end .big { font-size: 78px; }
</style>
</head>
<body>

<div class="card">
  <div class="top"><b id="countLabel">Question 1 of 5</b><b>No wrong answers</b></div>
  <div class="bar"><i id="barFill"></i></div>

  <div id="playing">
    <h1 id="quizTitle">🔮 Which creature are you?</h1>
    <p class="ask" id="askLabel">...</p>
    <div class="answers" id="answerBox"></div>
  </div>

  <div class="end" id="endScreen">
    <p class="big" id="faceLabel">🐉</p>
    <h2 id="nameLabel">You are a Dragon</h2>
    <p id="whyLabel"></p>
    <button class="go" id="againButton" onclick="startQuiz()">Take it again</button>
  </div>
</div>

<script>
// ── Change these and watch what happens ──
let titleText    = 'Which creature are you?';
let resultPrefix = 'You are a ';
let againLabel   = 'Take it again';
let barColour    = '#A21CAF';

let creatures = [
  { name: 'Dragon',  face: '🐉', why: 'You go big, and you do not wait to be asked.' },
  { name: 'Owl',     face: '🦉', why: 'You watch first, then say the one thing everyone needed to hear.' },
  { name: 'Dolphin', face: '🐬', why: 'You bring everyone with you, and you make it fun on the way.' },
  { name: 'Fox',     face: '🦊', why: 'You find the clever way round instead of the obvious way through.' },
];

// Every answer adds a point to one creature. The highest score at the end wins.
// The number is which creature: 0 is the dragon, 1 the owl, and so on.
let questions = [
  { ask: 'It is Saturday morning. What are you doing?',
    answers: [
      { text: 'Something loud, with lots of people', creature: 2 },
      { text: 'Building or making something', creature: 0 },
      { text: 'Reading or watching something good', creature: 1 },
      { text: 'Whatever nobody expects', creature: 3 },
    ] },
  { ask: 'Your group has to pick a leader.',
    answers: [
      { text: 'My hand goes straight up', creature: 0 },
      { text: 'I suggest whoever is best at it', creature: 1 },
      { text: 'I make sure everyone gets a say', creature: 2 },
      { text: 'I lead without anyone noticing', creature: 3 },
    ] },
  { ask: 'Something breaks right before the deadline.',
    answers: [
      { text: 'Push harder and fix it fast', creature: 0 },
      { text: 'Stop and work out what actually broke', creature: 1 },
      { text: 'Get help. Two people, half the time', creature: 2 },
      { text: 'Change the plan so it stops mattering', creature: 3 },
    ] },
  { ask: 'Pick a place.',
    answers: [
      { text: 'The top of a mountain', creature: 0 },
      { text: 'A very old library', creature: 1 },
      { text: 'A beach full of friends', creature: 2 },
      { text: 'A city you have never been to', creature: 3 },
    ] },
  { ask: 'What do people say about you?',
    answers: [
      { text: 'That I am fearless', creature: 0 },
      { text: 'That I notice everything', creature: 1 },
      { text: 'That I am kind', creature: 2 },
      { text: 'That I am hard to predict', creature: 3 },
    ] },
];

let atQuestion = 0;
let points = [0, 0, 0, 0];

const askLabel = document.getElementById('askLabel');
const answerBox = document.getElementById('answerBox');
const countLabel = document.getElementById('countLabel');
const barFill = document.getElementById('barFill');
const playing = document.getElementById('playing');
const endScreen = document.getElementById('endScreen');
const againButton = document.getElementById('againButton');

document.getElementById('quizTitle').textContent = '🔮 ' + titleText;
againButton.textContent = againLabel;
barFill.style.background = barColour;

function showQuestion() {
  const question = questions[atQuestion];
  askLabel.textContent = question.ask;
  countLabel.textContent = 'Question ' + (atQuestion + 1) + ' of ' + questions.length;
  barFill.style.width = (atQuestion / questions.length * 100) + '%';

  answerBox.innerHTML = '';
  for (let i = 0; i < question.answers.length; i++) {
    const answer = question.answers[i];
    const button = document.createElement('button');
    button.textContent = answer.text;
    button.onclick = function () { pick(answer.creature); };
    answerBox.appendChild(button);
  }
}

function pick(whichCreature) {
  points[whichCreature] = points[whichCreature] + 1;
  atQuestion = atQuestion + 1;
  if (atQuestion >= questions.length) finish();
  else showQuestion();
}

// Whoever collected the most points. A tie goes to whichever comes first.
function findWinner() {
  let best = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i] > points[best]) best = i;
  }
  return creatures[best];
}

function finish() {
  const winner = findWinner();
  playing.style.display = 'none';
  endScreen.style.display = 'block';
  barFill.style.width = '100%';
  countLabel.textContent = 'Finished';
  document.getElementById('faceLabel').textContent = winner.face;
  document.getElementById('nameLabel').textContent = resultPrefix + winner.name;
  document.getElementById('whyLabel').textContent = winner.why;
}

function startQuiz() {
  atQuestion = 0;
  points = [0, 0, 0, 0];
  playing.style.display = 'block';
  endScreen.style.display = 'none';
  showQuestion();
}

startQuiz();
${CLOSE_SCRIPT}
</body>
</html>`;

const STARTER_QUIZZES = [
  {
    id: 'quiz-animals',
    kind: 'quiz',
    label: 'Animal quiz',
    emoji: '🐾',
    blurb: 'Five questions. Swap them for your own.',
    prompt: 'a five question animal quiz with answer buttons, a score, and an explanation after each answer',
    code: ANIMAL_QUIZ,
  },
  {
    id: 'quiz-space',
    kind: 'quiz',
    label: 'Space quiz',
    emoji: '🚀',
    blurb: 'Planets, gravity and light years.',
    prompt: 'a five question space quiz with answer buttons, a score, and an explanation after each answer',
    code: SPACE_QUIZ,
  },
  {
    id: 'quiz-football',
    kind: 'quiz',
    label: 'Football rules quiz',
    emoji: '⚽',
    blurb: 'Do you actually know the rules?',
    prompt: 'a five question football rules quiz with answer buttons, a score, and an explanation after each answer',
    code: FOOTBALL_QUIZ,
  },
  {
    id: 'quiz-maths',
    kind: 'quiz',
    label: 'Maths challenge',
    emoji: '➗',
    blurb: 'Ten sums, and the code makes up new ones every time.',
    prompt: 'a maths quiz that makes up random sums, with four answers to choose from and a score at the end',
    code: MATHS_QUIZ,
  },
  {
    id: 'quiz-creature',
    kind: 'quiz',
    label: 'Which creature are you?',
    emoji: '🔮',
    blurb: 'No wrong answers. Every choice adds a point.',
    prompt: 'a personality quiz where each answer adds a point to one of four results and the highest total wins',
    code: PERSONALITY_QUIZ,
  },
];

export { STARTER_QUIZZES };
