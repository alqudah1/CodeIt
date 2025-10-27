import React from 'react';
import PuzzleTemplate from './PuzzleTemplate';

const Puzzle3 = () => (
  <PuzzleTemplate
    number={3}
    title="Tide Pool Sorting Party"
    subtitle="Organize sea critters into tidy arrays before the tide rolls back in."
    challenge="Sort incoming creatures by size and species, then build a quick report that tells the marine biologist what arrived."
    objectives={[
      'Store each creature in an array with properties for name, size, and color.',
      'Split the array into two lists: friendly helpers and mysterious visitors.',
      'Print a cheerful summary that counts each group.'
    ]}
    steps={[
      'Sketch a table with three columns to decide which details you want to track.',
      'Push sample data into an array and log the results to confirm the structure.',
      'Use array filters or loops to build the grouped lists.',
      'Create a final string that reads naturally when you display it.'
    ]}
    hints={[
      'Keep your objects consistent—missing properties make sorting harder.',
      'Try chaining array methods like `.filter()` and `.map()` for clean code.',
      'Format the summary string with template literals for easy reading.'
    ]}
    skills={['Arrays & objects', 'Data filtering', 'String formatting']}
    resources={[
      { label: 'JavaScript array patterns', href: 'https://javascript.info/array-methods' },
      { label: 'Template literal guide', href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals' }
    ]}
    startLink={null}
    previousPuzzle="/puzzle/2"
    nextPuzzle="/puzzle/4"
  />
);

export default Puzzle3;
