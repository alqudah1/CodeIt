import React from 'react';
import PuzzleTemplate from './PuzzleTemplate';

const Puzzle4 = () => (
  <PuzzleTemplate
    number={4}
    title="Seashell Sound Synth"
    subtitle="Compose reusable functions that remix seaside sounds on demand."
    challenge="Write helper functions that combine wind, wave, and gull samples into a relaxing soundtrack for campers."
    objectives={[
      'Create small functions that each return one themed sound effect.',
      'Pass options into a mixer function to layer the sounds together.',
      'Export a final playlist so campers can replay their favorite loop.'
    ]}
    steps={[
      'List out the reusable actions your code needs, then turn each into a function.',
      'Decide which arguments the mixer needs (tempo, mood, volume).',
      'Return an object that includes both the combined track and a playful emoji rating.'
    ]}
    hints={[
      'Name functions with verbs so their job is obvious at a glance.',
      'Give default parameter values for a smooth beginner-friendly experience.',
      'Keep functions short—if one does too much, split it into helpers.'
    ]}
    skills={['Functions', 'Parameters & defaults', 'Modular thinking']}
    resources={[
      { label: 'Function best practices', href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions' },
      { label: 'Default parameters primer', href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters' }
    ]}
    startLink={null}
    previousPuzzle="/puzzle/3"
    nextPuzzle="/puzzle/5"
  />
);

export default Puzzle4;
