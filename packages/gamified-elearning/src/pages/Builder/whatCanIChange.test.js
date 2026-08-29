import { changeInvitation, repeatedPiece, whatCanIChange } from './whatCanIChange';
import { STARTER_PROJECTS } from './starterProjects';

// ── Can we always name one real thing? ───────────────────────────────────────
//
// The children asked "what can I edit". A sentence saying "you can edit
// anything" is what a screen says when it has nothing specific to offer. This
// has to name something the child is actually looking at.

test('it names the biggest words on the page', () => {
  const found = whatCanIChange('<html><body><h1>My Cupcake Shop</h1><p>hello there</p></body></html>');
  expect(found.text).toBe('My Cupcake Shop');
  expect(found.tag).toBe('h1');
});

test('a heading beats a paragraph, whatever the order in the file', () => {
  const found = whatCanIChange('<body><p>read me first</p><h1>The Big Title</h1></body>');
  expect(found.text).toBe('The Big Title');
});

test('it never points at something painted rather than written', () => {
  // A canvas game is one element as far as the page is concerned. Telling a
  // child to tap a heading that is drawn in pixels sends them hunting for
  // something they cannot find, which is worse than saying nothing.
  const canvasGame = `<html><body><canvas id="screen"></canvas>
    <script>const title = "<h1>Catch the stars</h1>"; pen.fillText('Score', 10, 10);<\/script>
    </body></html>`;
  expect(whatCanIChange(canvasGame)).toBeNull();
  expect(changeInvitation(canvasGame)).toBeNull();
});

test('script and style contents are not on the screen', () => {
  const html = `<body><style>h1 { color: red }</style>
    <script>document.write("<h2>from a script</h2>")<\/script>
    <h2>Really On The Page</h2></body>`;
  expect(whatCanIChange(html).text).toBe('Really On The Page');
});

test('it skips things a child cannot tell apart', () => {
  // Score badges, timers, a lone × on a close button. Quoting "0" back at a
  // child is pointing at nothing.
  const html = '<body><h1>0</h1><h2>⏱ 30</h2><h3>Pick a colour</h3></body>';
  expect(whatCanIChange(html).text).toBe('Pick a colour');
});

test('it will not quote back a paragraph nobody can find again', () => {
  const long = 'a'.repeat(200);
  expect(whatCanIChange(`<body><h1>${long}</h1><h2>Short Enough</h2></body>`).text)
    .toBe('Short Enough');
});

test('nonsense does not throw', () => {
  for (const input of [null, undefined, 42, {}, [], '', '<h1>']) {
    expect(() => whatCanIChange(input)).not.toThrow();
    expect(() => changeInvitation(input)).not.toThrow();
  }
});

// ── The real projects ────────────────────────────────────────────────────────

describe('every starter a child can open', () => {
  const editable = STARTER_PROJECTS.filter(p => p.kind !== 'game');

  test.each(editable.map(p => [p.label, p]))('%s can name something', (label, project) => {
    const found = whatCanIChange(project.code);
    expect(found).not.toBeNull();
    // And the thing it names is really in the file, so a child looking for it
    // finds it.
    expect(project.code).toContain(found.text);
  });

  test('the canvas games stay silent rather than lying', () => {
    const canvasGames = STARTER_PROJECTS.filter(
      p => p.kind === 'game' && p.code.includes('<canvas') && !p.code.includes('id="field"')
    );
    expect(canvasGames.length).toBeGreaterThan(4);
    for (const game of canvasGames) {
      expect(whatCanIChange(game.code)).toBeNull();
    }
  });
});

// ── Projects whose pieces have no words on them ──────────────────────────────

describe('shapes, where there are no words', () => {
  test('it names a shape the project repeats', () => {
    const maze = `<body><div id="field">
      <div class="wall" style="left:1%"></div>
      <div class="wall" style="left:2%"></div>
      <div class="wall" style="left:3%"></div>
      <div class="coin"></div></div></body>`;
    expect(repeatedPiece(maze).name).toBe('wall');
    expect(changeInvitation(maze)).toMatch(/See the walls\?/);
  });

  test('two of something is not a pattern', () => {
    const html = '<body><div class="blob"></div><div class="blob"></div></body>';
    expect(repeatedPiece(html)).toBeNull();
  });

  test('it will not read a generated hash out to a child', () => {
    const html = `<body><div class="sc-a1b2c3"></div><div class="sc-a1b2c3"></div>
      <div class="sc-a1b2c3"></div><div class="sc-a1b2c3"></div></body>`;
    expect(repeatedPiece(html)).toBeNull();
  });

  test('words still win over shapes', () => {
    const html = `<body><h1>My Maze</h1>
      <div class="wall"></div><div class="wall"></div><div class="wall"></div></body>`;
    expect(changeInvitation(html)).toMatch(/My Maze/);
  });

  test('the three element-built games all get an invitation', () => {
    for (const id of ['maze', 'whack', 'memory']) {
      const game = STARTER_PROJECTS.find(p => p.id === id);
      expect(changeInvitation(game.code)).not.toBeNull();
    }
  });

  test('the canvas games are still silent', () => {
    for (const id of ['catch-stars', 'snake', 'bricks']) {
      const game = STARTER_PROJECTS.find(p => p.id === id);
      expect(changeInvitation(game.code)).toBeNull();
    }
  });
});
