import { changeIdeasFor } from './changeIdeas';

// Karam's project, near enough: a football game with a goalie, a score and a
// shot counter. He reached "Change one thing. pick new colors or add a fun
// idea" and asked what it meant. Every test here is about him getting a real
// answer instead of a mood.
const FOOTBALL_GAME = `<!doctype html>
<html><head><style>
  body { background: #0b7a3b; }
  .goal { background: #ffffff; }
</style></head>
<body>
  <h1>Goal Rush</h1>
  <p>Click the goal area to shoot. Beat the goalie's save!</p>
  <div id="goal" onclick="shoot(event)"></div>
  <button onclick="restart()">Play Now</button>
<script>
  let score = 0;
  let shots = 3;
  let goalieSpeed = 4;
  function shoot(e) { score += 1; render(); }
<\/script>
</body></html>`;

describe('it names things that are really in the project', () => {
  const ideas = changeIdeasFor(FOOTBALL_GAME);

  test('suggests changing a number the child actually has', () => {
    const idea = ideas.find(i => i.id === 'number-score');
    expect(idea.label).toMatch(/score/i);
    expect(idea.why).toContain('score');
    expect(idea.why).toContain('0');
  });

  test('the suggested new number is different from the current one', () => {
    ideas.filter(i => i.id.startsWith('number-')).forEach(idea => {
      const [, from, to] = idea.label.match(/at (\d+) instead of (\d+)/).map(Number);
      expect(from).not.toBe(to);
    });
  });

  test('spots the thing that controls difficulty', () => {
    const speed = ideas.find(i => i.id === 'speed');
    expect(speed.why).toContain('goalieSpeed');
  });

  test('offers to rename the project, quoting its real title', () => {
    const title = changeIdeasFor(FOOTBALL_GAME, { max: 10 }).find(i => i.id === 'title');
    expect(title.label).toContain('Goal Rush');
    expect(title.prompt).toContain('Goal Rush');
  });

  test('quotes the real background colour rather than saying "pick new colors"', () => {
    const colour = changeIdeasFor(FOOTBALL_GAME, { max: 10 }).find(i => i.id === 'colour');
    expect(colour.why).toContain('#0b7a3b');
  });

  test('every idea comes with the exact words to send, so nothing has to be invented', () => {
    ideas.forEach(idea => {
      expect(idea.prompt).toBeTruthy();
      expect(idea.prompt.length).toBeGreaterThan(12);
      expect(idea.label).toBeTruthy();
      expect(idea.why).toBeTruthy();
    });
  });

  test('no idea is a vague mood', () => {
    // The exact phrase that confused a real child, and its family.
    ideas.forEach(idea => {
      expect(idea.label.toLowerCase()).not.toContain('a fun idea');
      expect(idea.label.toLowerCase()).not.toContain('something');
      expect(idea.label.toLowerCase()).not.toMatch(/^change (it|things|stuff)$/);
    });
  });
});

describe('a different project gets different ideas', () => {
  test('the numbers and the title follow the child', () => {
    const other = FOOTBALL_GAME
      .replace('let score = 0;', 'let coins = 25;')
      .replace('<h1>Goal Rush</h1>', '<h1>Space Miner</h1>');
    const ideas = changeIdeasFor(other, { max: 10 });
    expect(ideas.find(i => i.id === 'number-coins').label).toMatch(/coins/i);
    expect(ideas.find(i => i.id === 'title').label).toContain('Space Miner');
  });

  test('a variable with an unfamiliar name is still used by its real name', () => {
    const odd = `<html><body><h1>Thing</h1><script>let wobbliness = 7;<\/script></body></html>`;
    const idea = changeIdeasFor(odd, { max: 10 }).find(i => i.id === 'number-wobbliness');
    expect(idea.label).toContain('wobbliness');
  });
});

describe('there is always something to do', () => {
  test('an empty project still offers concrete ideas, never an empty list', () => {
    const ideas = changeIdeasFor('');
    expect(ideas.length).toBeGreaterThanOrEqual(3);
    ideas.forEach(idea => expect(idea.prompt).toBeTruthy());
  });

  test('a page with nothing in it does not leave a child staring at "change one thing"', () => {
    // Unlike a quiz question, a suggestion cannot be wrong. so unlike proveIt,
    // this never returns nothing.
    [null, undefined, '<html></html>', '<<<not html'].forEach(input => {
      expect(changeIdeasFor(input).length).toBeGreaterThanOrEqual(3);
    });
  });

  test('ideas are never repeated', () => {
    const ideas = changeIdeasFor(FOOTBALL_GAME, { max: 10 });
    expect(new Set(ideas.map(i => i.id)).size).toBe(ideas.length);
    expect(new Set(ideas.map(i => i.label)).size).toBe(ideas.length);
  });

  test('it respects how many were asked for', () => {
    expect(changeIdeasFor(FOOTBALL_GAME, { max: 2 })).toHaveLength(2);
    expect(changeIdeasFor(FOOTBALL_GAME, { max: 4 })).toHaveLength(4);
  });
});

describe('the ideas hold still', () => {
  test('so they do not reshuffle while a child is reading them', () => {
    expect(JSON.stringify(changeIdeasFor(FOOTBALL_GAME)))
      .toBe(JSON.stringify(changeIdeasFor(FOOTBALL_GAME)));
  });
});
