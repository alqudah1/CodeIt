// TryPython imports react-router's Link; the router itself is not under test.
jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children) };
}, { virtual: true });
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));
const { PRESETS } = require('../Playground/presets');
const { HELLO } = require('./TryPython');

// The hero editor shows the playground's first template; the link under it
// must count the others from the same list.
test('the "more templates" link counts the playground, minus the one on screen', () => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, 'TryPython.js'), 'utf8');
  expect(src).not.toMatch(/Eleven more templates/);
  expect(PRESETS[0].code.replace(/^#.*\n/, '')).toBe(HELLO);
  expect(PRESETS.length).toBeGreaterThan(1);
});
