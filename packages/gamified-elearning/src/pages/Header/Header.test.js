import { render, screen } from '@testing-library/react';
import Header from './Header';
import { AuthContext } from '../../context/AuthContext';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/' }),
  };
}, { virtual: true });
jest.mock('../../context/CharacterContext', () => ({
  useCharacter: () => ({ character: null, stats: null, pendingXP: 0, clearPendingXP: jest.fn() }),
}));
jest.mock('../../components/CharacterAvatar/CharacterAvatar', () => () => null);
jest.mock('../../components/BrandLogo/BrandLogo', () => () => null);

function renderHeader(user) {
  return render(
    <AuthContext.Provider value={{ user, logout: jest.fn() }}>
      <Header />
    </AuthContext.Provider>
  );
}

describe('header navigation', () => {
  test('a signed-out visitor can reach pricing', () => {
    renderHeader(null);
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing');
  });

  test('a signed-in adult can reach the plan page', () => {
    // Regression: MEMBER_NAV used to be PUBLIC_NAV.slice(0, 4), which silently
    // dropped Pricing. so the people who might actually pay had no link to it.
    renderHeader({ id: 1, name: 'Parent', role: 'Educator' });
    expect(screen.getByRole('link', { name: 'Plan' })).toHaveAttribute('href', '/pricing');
  });

  test('a managed child profile is never shown a price', () => {
    renderHeader({ id: 2, name: 'Sara', role: 'student', managedProfile: true });
    expect(screen.queryByRole('link', { name: 'Plan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pricing' })).not.toBeInTheDocument();
    // The rest of the learning nav is untouched.
    expect(screen.getByRole('link', { name: 'Learn' })).toBeInTheDocument();
  });
});
