'use strict';

// Each lesson plan page shows a teacher what the children actually change:
// the box in the game, the line of code the game runs with it, and the check
// the child must pass. Taken from the power's own data, so a plan page can
// never describe a power the game does not have.

const test = require('node:test');
const assert = require('node:assert');
const { PAGES } = require('./generate-static-seo');
const { loadLessonPlans } = require('./content-loader');

const { PLANS, POWERS } = loadLessonPlans();

test('every plan page carries its power: the code line, the box and the check', () => {
  assert.strictEqual(PLANS.length, 12);
  for (const plan of PLANS) {
    const power = POWERS.find(p => p.slug === plan.slug);
    assert.ok(power, `plan ${plan.slug} has no power`);
    const page = PAGES.find(p => p.route === `/teach/plans/${plan.slug}`);
    assert.ok(page, `/teach/plans/${plan.slug} is not generated`);
    const html = page.bodyHtml || '';
    const escaped = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    assert.ok(html.includes(escaped(power.engine)), `${plan.slug}: the line the game runs is missing`);
    assert.ok(html.includes(`box called ${power.key}`), `${plan.slug}: the box ${power.key} is not named`);
    assert.ok(html.includes(escaped(power.check.say)), `${plan.slug}: the check is missing`);
  }
});
