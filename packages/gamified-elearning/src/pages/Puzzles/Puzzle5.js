import React from 'react';
import PuzzleTemplate from './PuzzleTemplate';

const Puzzle5 = () => (
  <PuzzleTemplate
    number={5}
    title="Boardwalk Bug Safari"
    subtitle="Track down sneaky summer bugs using a kid-friendly debugging checklist."
    challenge="A carnival ticket counter keeps glitching. Follow the logs, patch the typos, and celebrate with a victory confetti animation."
    objectives={[
      'Read through the console output to spot which function is misbehaving first.',
      'Fix off-by-one errors so every guest receives the right number of tickets.',
      'Add a final assertion to prove your fix works for any crowd size.'
    ]}
    steps={[
      'Reproduce the bug deliberately so you know exactly when it appears.',
      'Use console logs or breakpoints to narrow the issue to one code block.',
      'Write a quick test (even a manual one) to verify the fix sticks.',
      'Trigger the confetti animation only after validations pass.'
    ]}
    hints={[
      'Look for variables that are reused in loops—they often hide the bug.',
      'Check boundary values like 0 or the max ticket count.',
      'Automate your check so teammates can catch regressions next time.'
    ]}
    skills={['Debugging', 'Testing mindset', 'Resilient code']}
    resources={[
      { label: 'Debugging strategies', href: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/What_went_wrong' },
      { label: 'Guide to writing quick tests', href: 'https://kentcdodds.com/blog/unit-vs-integration-vs-e2e-tests' }
    ]}
    startLink={null}
    previousPuzzle="/puzzle/4"
  />
);

export default Puzzle5;
