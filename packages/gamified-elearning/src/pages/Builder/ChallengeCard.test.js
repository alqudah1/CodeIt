import { fireEvent, render, screen } from '@testing-library/react';
import ChallengeCard from './ChallengeCard';
import { starterGameById } from './starterGames';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to, ...p }) => React.createElement('a', { href: to, ...p }, children) };
}, { virtual: true });
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));

const game = starterGameById('catch-stars').code;

describe('one rung at a time', () => {
  beforeEach(() => sessionStorage.clear());

  test('offers one challenge named from the project, with a hint behind a tap', () => {
    render(<ChallengeCard code={game} projectKey="p1" />);
    expect(screen.getByText('Make the speed 6 instead of 3.')).toBeInTheDocument();
    expect(screen.queryByText(/fallSpeed = 3/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show me a hint' }));
    expect(screen.getByText(/fallSpeed = 3/)).toBeInTheDocument();
    // Never a list: exactly one prompt on screen.
    expect(document.querySelectorAll('.ladder__prompt').length).toBe(1);
  });

  test('names the concept only after the child has done it', () => {
    const { rerender } = render(<ChallengeCard code={game} projectKey="p1" />);
    expect(document.body.textContent).not.toMatch(/variable/i);
    rerender(<ChallengeCard code={game.replace('let fallSpeed  = 3;', 'let fallSpeed  = 9;')} projectKey="p1" />);
    expect(screen.getByTestId('ladder-done')).toBeInTheDocument();
    expect(screen.getByText(/The number you just changed is a variable/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /lesson 2/ })).toHaveAttribute('href', '/lesson/2');
  });

  test('a change that is not the challenge does not count', () => {
    const { rerender } = render(<ChallengeCard code={game} projectKey="p1" />);
    rerender(<ChallengeCard code={game.replace('let startLives = 3;', 'let startLives = 4;')} projectKey="p1" />);
    expect(screen.queryByTestId('ladder-done')).not.toBeInTheDocument();
    expect(screen.getByText('Make the speed 6 instead of 3.')).toBeInTheDocument();
  });

  test('dismissing costs nothing, and three in a row ends it for the session', () => {
    render(<ChallengeCard code={game} projectKey="p1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip this one' }));
    expect(document.body.textContent).not.toMatch(/speed 6/);
    // The next rung, not the same one again.
    expect(screen.getByText(/Change the title/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Skip this one' }));
    // catch-stars has only two rungs that fit; nothing left, nothing invented.
    expect(screen.queryByTestId('ladder-offer')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/badge|streak|\d+ skipped/i);
  });

  test('stops for the session after three dismissals', () => {
    sessionStorage.setItem('codeit_ladder_dismissals', '3');
    render(<ChallengeCard code={game} projectKey="p1" />);
    expect(screen.queryByTestId('ladder-offer')).not.toBeInTheDocument();
  });
});
