'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SHOWCASE_PROJECTS, findShowcaseProject } = require('./showcaseProjects');

test('ships distinct playable studio examples without student data', () => {
  assert.equal(SHOWCASE_PROJECTS.length, 3);
  assert.equal(new Set(SHOWCASE_PROJECTS.map((project) => project.public_id)).size, 3);
  for (const project of SHOWCASE_PROJECTS) {
    assert.equal(project.creator_name, 'CodeIt Studio');
    assert.equal(project.is_showcase, true);
    assert.match(project.generated_code, /<!doctype html>/i);
    assert.doesNotMatch(project.generated_code, /parent_email|user_id|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
  }
});

test('finds only known studio project identifiers', () => {
  assert.equal(findShowcaseProject('studioquiz01')?.title, 'Mission Control Quiz');
  assert.equal(findShowcaseProject('missing-project'), null);
});
