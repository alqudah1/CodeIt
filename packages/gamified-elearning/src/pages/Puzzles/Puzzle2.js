import React from 'react';
import PuzzleTemplate from './PuzzleTemplate';

const Puzzle2 = () => (
  <PuzzleTemplate
    number={2}
    title="Sunset Lighthouse Signals"
    subtitle="Write smart conditionals that light up the harbor when capsized boats need help."
    challenge="Build a signal system that checks the weather, the tide, and any SOS calls before deciding which flare sequence to launch."
    objectives={[
      'Capture three sensor inputs: wind speed, tide level, and distress frequency.',
      'Decide which light pattern to trigger using nested `if...else` logic.',
      'Send a calm-down message when all systems are safe.'
    ]}
    steps={[
      'Create variables for each sensor and assign sample values you can tweak.',
      'Draft the decision tree on paper so you know which condition comes first.',
      'Translate the tree into code using `if`, `elif`, and `else` blocks.'
    ]}
    hints={[
      'Check high-priority emergencies (like distress calls) before the others.',
      'Combine multiple checks with logical operators to avoid duplicate flares.',
      'Add a final `else` block to cover any unseen situations.'
    ]}
    skills={['Conditionals', 'Logical operators', 'Debugging edge cases']}
    resources={[
      { label: 'If statements refresher', href: 'https://www.w3schools.com/python/python_conditions.asp' },
      { label: 'Logic table helper', href: 'https://www.truth-table.com/' }
    ]}
    startLink={null}
    previousPuzzle="/puzzle/1"
    nextPuzzle="/puzzle/3"
  />
);

export default Puzzle2;
