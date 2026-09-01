import fs from 'fs';
import path from 'path';
import { projectName } from './projectName';

// The cases below are real prompts typed by children in a classroom session on
// 1 September 2026, plus the lesson prompts from the registry. They are the
// reason this function exists, so they are the test.
const CASES = [
  ['build a game that requires 2 players and that shoots each other with guns with an health bar and stamina and make it playable with WASD and arrow buttons with a battleground- so i can play with my friends', 'Game that requires 2 players'],
  ['make a game called rivals where there are guns — multiplayer and make people allowed to play it', 'Rivals'],
  ['make your own story and post it. there is a button that you can press and make a story', 'Your own story'],
  ['build a snowman winter page with bouncing snowmen', 'Snowman winter page'],
  ['a colourful page that greets me by name', 'Colourful page'],
  ['a quiz that says well done or try again', 'Quiz that says well done'],
  ['make a website about my dog', 'Website about my dog'],
  ['Swemown got rete', 'Swemown got rete'],
  ['build a', 'My Project'],
  ['', 'My Project'],
  ['   ', 'My Project'],
];

describe('naming a project a child made', () => {
  test.each(CASES)('%s', (prompt, expected) => {
    expect(projectName(prompt)).toBe(expected);
  });

  test('a name never ends on a joining word', () => {
    const enders = /\b(and|or|with|that|which|so|then|a|an|the|of|for|to|in|on|at|is|are|it|my|your|but|as|by|from)$/i;
    for (const [prompt] of CASES) {
      expect(projectName(prompt)).not.toMatch(enders);
    }
  });

  test('a name is never empty, and never the word Untitled', () => {
    for (const [prompt] of CASES) {
      const name = projectName(prompt);
      expect(name.trim().length).toBeGreaterThan(0);
      expect(name).not.toBe('Untitled');
    }
  });

  test('a name stays short enough to read on a card', () => {
    for (const [prompt] of CASES) {
      expect(projectName(prompt).split(/\s+/).length).toBeLessThanOrEqual(5);
    }
  });

  // Anti-drift guard. The same logic lives on the server, because the server
  // names a project when it falls back and the browser names it when it does
  // not. Four copies of a classifier drifting apart has already happened once
  // on this codebase; this fails the build the moment the two diverge.
  test('the browser and the server share one naming rule, character for character', () => {
    const here = fs.readFileSync(path.join(__dirname, 'projectName.js'), 'utf8');
    const server = fs.readFileSync(
      path.join(__dirname, '../../../codeit-backend/projectName.js'), 'utf8');
    const body = src => src.slice(0, src.indexOf('module.exports') >= 0
      ? src.indexOf('module.exports')
      : src.indexOf('export {'));
    expect(body(here).trim()).toBe(body(server).trim());
  });
});
