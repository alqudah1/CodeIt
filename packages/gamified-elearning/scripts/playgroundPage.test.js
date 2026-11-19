'use strict';

// /playground said 180 words and showed no Python. It now shows the first
// starter template and what it prints, read from the playground's own
// presets. This fails if the page names a template the playground does not
// have, or stops showing one.

const test = require('node:test');
const assert = require('node:assert');
const { PAGES } = require('./generate-static-seo');
const { loadPlaygroundPresets } = require('./content-loader');

test('the playground page shows a real template and names only real ones', () => {
  const presets = loadPlaygroundPresets();
  const page = PAGES.find((p) => p.route === '/playground');
  const shown = (page.sections || []).find((s) => s.heading === 'It opens with this');
  assert.ok(shown, 'the template section is missing');
  assert.equal(shown.code, presets[0].code);
  assert.ok(shown.output, 'the template output is missing');
  const listed = shown.after.join(' ');
  for (const p of presets.slice(1)) assert.ok(listed.includes(p.label), `${p.label} is not named`);
});
