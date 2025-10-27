import React from 'react';
import PuzzleTemplate from './PuzzleTemplate';

const Puzzle1 = () => (
  <PuzzleTemplate
    number={1}
    title="Coral Reef Loop Quest"
    subtitle="Teach Robo-Fin how to swim across the reef using repeatable patterns."
    challenge="Use loops to help Robo-Fin clean every coral row without writing the same instruction over and over."
    objectives={[
      'Plan the cleaning path using a simple sketch or grid.',
      'Translate repeated moves into a `for` loop.',
      'Collect the shining shells without crashing into seaweed.'
    ]}
    steps={[
      'List the moves Robo-Fin makes in one full pass across the reef.',
      'Group repeated actions together and wrap them in a loop.',
      'Add a celebration animation once every coral tile sparkles.'
    ]}
    hints={[
      'Remember you can nest loops if Robo-Fin needs to explore rows inside rows.',
      'Keep variable names short but clear so you can tweak them quickly.',
      'Test the loop with two tiles first, then expand to the whole reef.'
    ]}
    skills={['Loops', 'Pattern recognition', 'Creative debugging']}
    resources={[
      { label: 'Loop cheatsheet', href: 'https://www.programiz.com/python-programming/for-loop' },
      { label: 'Interactive grid planner', href: 'https://niftygrid.github.io/' }
    ]}
    startLink={null}
    nextPuzzle="/puzzle/2"
  />
);

export default Puzzle1;
