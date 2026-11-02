import { render, screen } from '@testing-library/react';
import ProgressPanel, { coursePercent, levelPercent } from './ProgressPanel';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children) };
}, { virtual: true });
jest.mock('../../context/CharacterContext', () => ({ useCharacterDisplay: () => ({ character: {} }) }));

test('every number on the panel is the one it was given, and the course percent is of 31', () => {
  render(<ProgressPanel level={{ n: 2, title: 'Explorer', xp: 320, next: 500 }} streak={7} minutes={15} lessonsDone={6} guest={false} />);
  expect(screen.getByText('Level 2')).toBeInTheDocument();
  expect(screen.getByText('Explorer')).toBeInTheDocument();
  expect(screen.getByText('320 / 500 XP')).toBeInTheDocument();
  expect(screen.getByText('7')).toBeInTheDocument();
  expect(screen.getByText('days in a row')).toBeInTheDocument();
  expect(screen.getByText('15')).toBeInTheDocument();
  expect(screen.getByText('min today')).toBeInTheDocument();
  expect(screen.getByText('19%')).toBeInTheDocument();
  expect(screen.getByText('6 of 31 lessons')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /of 31 lessons/ })).toHaveAttribute('href', '/lessons');
  expect(levelPercent({ n: 2, xp: 320, next: 500 })).toBeCloseTo(40);
  expect(coursePercent(31)).toBe(100);
  expect(coursePercent(0)).toBe(0);
});

test('a guest gets the honest XP line, singular words for one', () => {
  render(<ProgressPanel level={{ n: 1, title: 'Beginner', xp: 0, next: 200 }} streak={1} minutes={1} lessonsDone={0} guest />);
  expect(screen.getByText('0 XP. Make an account to keep it.')).toBeInTheDocument();
  expect(screen.getByText('day in a row')).toBeInTheDocument();
  expect(screen.getByText('minute today')).toBeInTheDocument();
  expect(screen.getByText('0%')).toBeInTheDocument();
});
