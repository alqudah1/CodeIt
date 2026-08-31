'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { projectKind } = require('./projectKind');

test('the strings production actually holds classify correctly', () => {
  // 'interactive-website' is in the live database today and used to fall
  // through every exact-string list to 'other'.
  assert.strictEqual(projectKind('interactive-website'), 'website');
  assert.strictEqual(projectKind('personal_portfolio_site'), 'website');
  assert.strictEqual(projectKind('one page website'), 'website');
  assert.strictEqual(projectKind('simulator'), 'tool');
});

test('the single words designEngine emits keep their old categories', () => {
  for (const word of ['game', 'clicker', 'runner', 'memory', 'reaction', 'maze', 'puzzle', 'cooking']) {
    assert.strictEqual(projectKind(word), 'game', word);
  }
  for (const word of ['website', 'portfolio', 'restaurant', 'shop', 'blog', 'landing']) {
    assert.strictEqual(projectKind(word), 'website', word);
  }
  for (const word of ['tool', 'calculator', 'timer', 'drawing', 'flashcards']) {
    assert.strictEqual(projectKind(word), 'tool', word);
  }
  assert.strictEqual(projectKind('quiz'), 'quiz');
});

test('quiz wins over site, and the unknown stays other', () => {
  assert.strictEqual(projectKind('quiz website'), 'quiz');
  assert.strictEqual(projectKind('animal trivia site'), 'quiz');
  assert.strictEqual(projectKind('story'), 'other');
  assert.strictEqual(projectKind(''), 'other');
  assert.strictEqual(projectKind(null), 'other');
});
