const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyProject } = require('./designEngine');

test('a space club website is not mistaken for a sports website', () => {
  assert.deepEqual(
    classifyProject('Build a colorful space club website with planet facts'),
    { category: 'website', type: 'portfolio' }
  );
});

test('a named sports club still routes to a sports website', () => {
  assert.deepEqual(
    classifyProject('Build a soccer club website for our team'),
    { category: 'website', type: 'sports' }
  );
});
