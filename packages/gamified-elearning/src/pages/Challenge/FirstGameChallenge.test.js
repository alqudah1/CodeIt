import { fireEvent, render, screen } from '@testing-library/react';
import FirstGameChallenge, { GAME_STARTERS } from './FirstGameChallenge';
import { trackEvent } from '../../utils/trackEvent';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, onClick, ...props }) => React.createElement('a', {
      href: to,
      onClick,
      ...props,
    }, children),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/SiteFooter/SiteFooter', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));

describe('first game challenge', () => {
  beforeEach(() => {
    sessionStorage.clear();
    trackEvent.mockClear();
  });

  test('records one privacy-safe challenge view per session', () => {
    const { rerender } = render(<FirstGameChallenge />);
    expect(trackEvent).toHaveBeenCalledWith('challenge_view');

    rerender(<FirstGameChallenge />);
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  test('offers three fixed game starters and tracks the selected type', () => {
    render(<FirstGameChallenge />);

    for (const game of GAME_STARTERS) {
      const link = screen.getByRole('link', { name: `Build ${game.title} →` });
      expect(link).toHaveAttribute('href', `/builder?prompt=${encodeURIComponent(game.prompt)}`);
    }

    fireEvent.click(screen.getByRole('link', { name: 'Build Reaction Rush →' }));
    expect(trackEvent).toHaveBeenCalledWith('challenge_start', 'reaction');
    expect(trackEvent).not.toHaveBeenCalledWith(expect.anything(), expect.stringContaining('reaction speed game'));
  });

  test('states the real age, privacy, and reward rules', () => {
    render(<FirstGameChallenge />);

    expect(screen.getByText(/Ages 8–12 participate through a parent-managed profile/i)).toBeInTheDocument();
    expect(screen.getByText(/The first save of a new project earns 25 XP/i)).toBeInTheDocument();
    expect(screen.getByText(/coder aliases instead of real names/i)).toBeInTheDocument();
  });
});
