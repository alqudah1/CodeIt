import { gradeAttempt, isEnoughToProve, questionsFor, readProject } from './proveIt';

// A project shaped like the ones the studio actually produces: one HTML file
// with a <style> block and a <script> block.
const CLICKER_GAME = `<!doctype html>
<html><head><style>
  body { background: #1E1E2E; color: white; }
  .card { background-color: #FF7A00; border-radius: 12px; }
  .panel { background: #3DDC97; }
</style></head>
<body>
  <h1>Star Catcher</h1>
  <button id="catch">Catch a star</button>
  <button id="reset">Start again</button>
  <p id="out">Score: 0</p>
<script>
  let score = 0;
  const target = 10;
  document.getElementById('catch').addEventListener('click', function () {
    score++;
    document.getElementById('out').textContent = 'Score: ' + score;
  });
  for (let i = 0; i < 5; i++) {
    console.log(i);
  }
</script>
</body></html>`;

describe('reading a real project', () => {
  const facts = readProject(CLICKER_GAME);

  test('finds the variables the child declared, with their values', () => {
    expect(facts.variables).toEqual(
      expect.arrayContaining([
        { name: 'score', value: '0' },
        { name: 'target', value: '10' },
      ])
    );
  });

  test('finds a countable loop', () => {
    expect(facts.loops[0]).toMatchObject({ from: 0, to: 5 });
  });

  test('finds what makes the score go up, and by how much', () => {
    expect(facts.increments[0]).toMatchObject({ name: 'score', by: 1 });
  });

  test('counts click handlers and buttons', () => {
    expect(facts.clickHandlers).toBe(1);
    expect(facts.buttons).toBe(2);
  });

  test('finds background colours in the order they appear', () => {
    expect(facts.backgrounds.slice(0, 3)).toEqual(['#1E1E2E', '#FF7A00', '#3DDC97']);
  });

  test('ignores the CodeIt editor bridge, which the child did not write', () => {
    const withBridge = CLICKER_GAME.replace('</body>',
      `<script>var x = 999; window.addEventListener('message', function(e){ if(e.data.type!=='CODEIT_CMD')return; });<\/script></body>`);
    const seen = readProject(withBridge);
    expect(seen.variables.some(v => v.name === 'x')).toBe(false);
  });
});

describe('questions come from this project, not a question bank', () => {
  const questions = questionsFor(CLICKER_GAME);

  test('asks about the variables the child actually named', () => {
    const starting = questions.find(q => q.id === 'starting-value');
    expect(starting.question).toContain('score');
    expect(starting.choices[starting.correct]).toBe('0');
  });

  test('a different project gets different questions', () => {
    const other = questionsFor(CLICKER_GAME.replace('let score = 0;', 'let coins = 25;'));
    expect(other.find(q => q.id === 'starting-value').question).toContain('coins');
    expect(other.find(q => q.id === 'starting-value').choices).toContain('25');
  });

  test('every answer key points at a real choice', () => {
    questions.forEach(q => {
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(q.choices.length);
      expect(q.choices[q.correct]).toBeTruthy();
    });
  });

  test('no question offers the same answer twice', () => {
    questions.forEach(q => {
      expect(new Set(q.choices).size).toBe(q.choices.length);
    });
  });

  test('every question offers a real choice, not a single option', () => {
    questions.forEach(q => expect(q.choices.length).toBeGreaterThanOrEqual(3));
  });

  test('every question explains itself afterwards', () => {
    questions.forEach(q => expect(q.explain).toBeTruthy());
  });

  test('the right answer is not always in the same place', () => {
    // Otherwise a child learns to press the first button every time.
    const positions = new Set(questions.map(q => q.correct));
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe('the loop question counts correctly', () => {
  test('a loop from 0 to 5 runs five times, not six', () => {
    const q = questionsFor(CLICKER_GAME, { max: 10 }).find(x => x.id === 'loop-count');
    expect(q.choices[q.correct]).toBe('5');
    // The off-by-one is offered as a wrong answer, because that is the mistake.
    expect(q.choices).toContain('6');
  });

  test('a loop starting at 1 is counted from where it starts', () => {
    const html = CLICKER_GAME.replace('for (let i = 0; i < 5; i++)', 'for (let i = 1; i < 5; i++)');
    const q = questionsFor(html, { max: 10 }).find(x => x.id === 'loop-count');
    expect(q.choices[q.correct]).toBe('4');
  });
});

describe('it refuses to ask what it cannot verify', () => {
  test('an empty project produces no questions rather than made-up ones', () => {
    expect(questionsFor('')).toEqual([]);
    expect(questionsFor(null)).toEqual([]);
    expect(questionsFor(undefined)).toEqual([]);
  });

  test('a page with no code asks nothing about code', () => {
    const plain = '<html><body><h1>Hello</h1><p>Just words.</p></body></html>';
    expect(questionsFor(plain)).toEqual([]);
  });

  test('a project with one background colour is not asked to pick between colours', () => {
    const single = `<html><head><style>body{background:#111;}</style></head>
      <body><script>let a = 1;<\/script></body></html>`;
    expect(questionsFor(single, { max: 10 }).some(q => q.id === 'background')).toBe(false);
  });

  test('a project with no loop is not asked how many times a loop runs', () => {
    const noLoop = CLICKER_GAME.replace(/for \(let i = 0; i < 5; i\+\+\) \{[\s\S]*?\}/, '');
    expect(questionsFor(noLoop, { max: 10 }).some(q => q.id === 'loop-count')).toBe(false);
  });

  test('a broken or half-written project does not throw', () => {
    expect(() => questionsFor('<html><script>let x =</script>')).not.toThrow();
    expect(() => questionsFor('<<<>>>not html at all')).not.toThrow();
  });
});

describe('the same project always asks the same thing', () => {
  test('so a child cannot refresh until the questions get easy', () => {
    const first = questionsFor(CLICKER_GAME);
    const again = questionsFor(CLICKER_GAME);
    expect(JSON.stringify(again)).toBe(JSON.stringify(first));
  });

  test('and the answers stay in the same places', () => {
    expect(questionsFor(CLICKER_GAME).map(q => q.correct))
      .toEqual(questionsFor(CLICKER_GAME).map(q => q.correct));
  });
});

describe('grading an attempt', () => {
  const questions = questionsFor(CLICKER_GAME);
  const allRight = questions.map(q => q.correct);

  test('all right passes', () => {
    const result = gradeAttempt(questions, allRight);
    expect(result.passed).toBe(true);
    expect(result.correct).toBe(questions.length);
    expect(result.wrongIds).toEqual([]);
  });

  test('one wrong does not pass, and names what to look at again', () => {
    const nearly = [...allRight];
    nearly[0] = (allRight[0] + 1) % questions[0].choices.length;
    const result = gradeAttempt(questions, nearly);
    expect(result.passed).toBe(false);
    expect(result.correct).toBe(questions.length - 1);
    expect(result.wrongIds).toEqual([questions[0].id]);
  });

  test('answering nothing does not pass', () => {
    expect(gradeAttempt(questions, []).passed).toBe(false);
    expect(gradeAttempt(questions, undefined).passed).toBe(false);
    expect(gradeAttempt(questions, [null, null, null]).passed).toBe(false);
  });

  test('a project we could not ask about never counts as proven', () => {
    // Better to let the child through elsewhere than to award understanding
    // nobody demonstrated.
    expect(gradeAttempt([], []).passed).toBe(false);
    expect(gradeAttempt(null, []).passed).toBe(false);
  });

  test('an answer of the right number as a string still counts', () => {
    const asStrings = allRight.map(String);
    expect(gradeAttempt(questions, asStrings).passed).toBe(true);
  });
});


// ── Shapes taken from the projects actually published on codeitlearn.com ─────
//
// The first version of this module was written against a hand-made fixture and
// looked fine. Run against the two real published projects it got two things
// wrong, both caught here so they cannot come back.

describe('a real generated game, which uses onclick attributes', () => {
  // The published click-the-target game has five onclick attributes and not one
  // addEventListener. Looking only for the listener form missed the entire
  // mechanic of the game.
  const REAL_SHAPE = `<html><head><style>body{background:#0f172a;}</style></head>
    <body>
      <div class="target" onclick="hit(this)"></div>
      <div class="target" onclick="hit(this)"></div>
      <button onclick="startGame()">Start</button>
    <script>
      let score = 0;
      let timeLeft = 30;
      function hit(el) { score += 5; render(); }
      for (let i = 0; i < 12; i++) { spawn(i); }
    <\/script></body></html>`;

  const facts = readProject(REAL_SHAPE);

  test('onclick attributes count as reacting to a click', () => {
    expect(facts.clickHandlers).toBe(3);
  });

  test('the click question is asked even with no addEventListener', () => {
    expect(questionsFor(REAL_SHAPE, { max: 10 }).some(q => q.id === 'clicks')).toBe(true);
  });

  test('the increment question is about score, not the loop counter i', () => {
    // "What does i++ do to i" is the least interesting question in the project.
    expect(facts.increments[0].name).toBe('score');
    expect(facts.increments[0].by).toBe(5);
    const q = questionsFor(REAL_SHAPE, { max: 10 }).find(x => x.id === 'increment');
    expect(q.question).toContain('score');
    expect(q.choices[q.correct]).toBe('Adds 5 to it');
  });

  test('a project whose only counter is a loop variable still gets a question', () => {
    const onlyLoop = `<html><body><script>for (let i = 0; i < 3; i++) { draw(i); }<\/script></body></html>`;
    const q = questionsFor(onlyLoop, { max: 10 }).find(x => x.id === 'increment');
    expect(q).toBeTruthy();
    expect(q.question).toContain('i');
  });
});

describe('a real static website, which has almost no code', () => {
  // The other published project is a one-page site: no JavaScript at all. It
  // yields a single colour question, which is honest but proves nothing.
  const REAL_SITE = `<html><head><style>
      .hero{background:#6366f1;} .about{background:#ffffff;} .cta{background-color:#f59e0b;}
    </style></head><body><h1>My Site</h1><p>About me.</p></body></html>`;

  test('it asks only what it can, and that is one question', () => {
    const questions = questionsFor(REAL_SITE, { max: 10 });
    expect(questions.map(q => q.id)).toEqual(['background']);
  });

  test('one question is not enough to call a project understood', () => {
    expect(isEnoughToProve(questionsFor(REAL_SITE, { max: 10 }))).toBe(false);
  });

  test('a project with real code is enough', () => {
    expect(isEnoughToProve(questionsFor(CLICKER_GAME))).toBe(true);
  });

  test('no questions at all is never enough', () => {
    expect(isEnoughToProve([])).toBe(false);
    expect(isEnoughToProve(null)).toBe(false);
  });
});
