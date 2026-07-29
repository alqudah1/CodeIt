import { fireEvent, render, screen } from '@testing-library/react';
import Home from './Home';
import { trackEvent } from '../../utils/trackEvent';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/BrandLogo/BrandLogo', () => ({ alt = 'CodeIt', ...props }) => <img alt={alt} {...props} />);
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));

describe('Home', () => {
  beforeEach(() => {
    trackEvent.mockReset().mockResolvedValue(true);
  });

  test('gives parents a direct, measurable path to the family pilot', () => {
    render(<Home />);

    const pilotLink = screen.getByRole('link', { name: 'See full pilot details' });
    expect(pilotLink).toHaveAttribute('href', '/pricing');

    fireEvent.click(pilotLink);
    expect(trackEvent).toHaveBeenCalledWith('parent_cta_click', 'view-pricing');
  });

  test('shows rounded, defensible traction without claiming active users', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: 'Learners are already building momentum.' })).toBeInTheDocument();
    expect(screen.getByText('200+')).toBeInTheDocument();
    expect(screen.getByText('140k+')).toBeInTheDocument();
    expect(screen.getByText('1,900+')).toBeInTheDocument();
    expect(screen.queryByText(/active users/i)).not.toBeInTheDocument();
  });
});
