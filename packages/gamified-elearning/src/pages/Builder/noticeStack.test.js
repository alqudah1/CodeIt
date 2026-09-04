const fs = require('fs');
const path = require('path');

// Rounds 66 and 67: two toasts were stacked on top of each other, one
// covering a word of the other. The stacking rule: transient notices (the XP
// pop, the companion tip) live in ONE fixed column, top right, each below the
// last, and nothing else pins itself to that column's corner.

const js = fs.readFileSync(path.join(__dirname, 'Builder.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'Builder.css'), 'utf8');

function rule(selector) {
  const i = css.indexOf(`\n${selector} {`);
  expect(i).toBeGreaterThan(-1);
  return css.slice(i, css.indexOf('}', i));
}

test('the XP pop and the companion tip render inside the one notice stack', () => {
  const stack = js.slice(js.indexOf('className="bldr-toasts"'), js.indexOf('Wow moment overlay'));
  expect(stack).toContain('className="bldr-xp-popup"');
  expect(stack).toContain('className="bldr-companion"');
});

test('the stack is fixed and stacks vertically; its members are not fixed themselves', () => {
  const stack = rule('.bldr-toasts');
  expect(stack).toMatch(/position: fixed/);
  expect(stack).toMatch(/flex-direction: column/);
  expect(stack).toMatch(/gap: \d+px/);
  expect(rule('.bldr-xp-popup')).not.toMatch(/position: fixed/);
  expect(rule('.bldr-companion')).not.toMatch(/position: fixed/);
  // No media query pins the companion back to a corner.
  expect(css).not.toMatch(/\.bldr-companion \{\s*bottom:/);
});

test('the bottom corners stay with the controls: Pixel bottom right, the chest bottom left', () => {
  const pixel = rule('.pixel-guide');
  expect(pixel).toMatch(/right: 16px/);
  expect(pixel).toMatch(/bottom: 16px/);
  const chest = fs.readFileSync(path.join(__dirname, '../../components/Chest/ChestTray.css'), 'utf8');
  expect(chest).toMatch(/left: 16px;\s*bottom: 16px/);
});
