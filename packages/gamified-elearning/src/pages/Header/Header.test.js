import { fireEvent, render, screen } from '@testing-library/react';
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
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));

// The header asks the billing API once per mount for an adult account. Each
// test says what that answer is; the default is the free plan, which is also
// what an unreachable billing API leaves behind.
let mockBilling = { billingEnabled: false, plan: 'free' };
jest.mock('../../utils/billing', () => ({
  DEFAULT_BILLING_STATE: { billingEnabled: false, plan: 'free' },
  fetchBillingStatus: () => Promise.resolve(mockBilling),
  isPlusMember: (state) => Boolean(state && state.plan === 'plus'),
}));

function renderHeader(user, token) {
  return render(
    <AuthContext.Provider value={{ user, token, logout: jest.fn() }}>
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
    //
    // Plan now lives in the account menu rather than the top bar — eight
    // destinations across the top spent a child's whole attention before the
    // page below had rendered anything. It still has to be reachable, which is
    // what this test has always been about.
    renderHeader({ id: 1, name: 'Parent', role: 'Educator' });
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByRole('menuitem', { name: 'Plan' })).toHaveAttribute('href', '/pricing');
  });

  test('a managed child profile is never shown a price', () => {
    renderHeader({ id: 2, name: 'Sara', role: 'student', managedProfile: true });
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.queryByRole('menuitem', { name: 'Plan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Plan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pricing' })).not.toBeInTheDocument();
    // The rest of the learning nav is untouched.
    expect(screen.getByRole('link', { name: 'Learn' })).toBeInTheDocument();
  });
});

// CodeIt's first paying family said subscribing took too many buttons. From a
// signed-in adult's studio the plan page was two taps behind an avatar.
describe('the shortcut to subscribing', () => {
  afterEach(() => { mockBilling = { billingEnabled: false, plan: 'free' }; });

  test('an adult on the free plan gets one tap to the paid card', async () => {
    mockBilling = { billingEnabled: true, plan: 'free' };
    renderHeader({ id: 1, name: 'Parent', role: 'Educator' }, 'token-abc');
    const link = await screen.findByRole('link', { name: 'Get Plus' });
    expect(link).toHaveAttribute('href', '/pricing#codeit-plus');
    // One destination, one control: Plan leaves the menu while this is up.
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.queryByRole('menuitem', { name: 'Plan' })).not.toBeInTheDocument();
  });

  test('a subscriber is never sold to again', async () => {
    mockBilling = { billingEnabled: true, plan: 'plus' };
    renderHeader({ id: 1, name: 'Parent', role: 'Educator' }, 'token-abc');
    fireEvent.click(await screen.findByRole('button', { name: /account menu/i }));
    expect(screen.queryByRole('link', { name: 'Get Plus' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Plan' })).toHaveAttribute('href', '/pricing');
  });

  test('a child is never sold to at all', async () => {
    mockBilling = { billingEnabled: true, plan: 'free' };
    renderHeader({ id: 2, name: 'Sara', role: 'student', managedProfile: true }, 'token-abc');
    fireEvent.click(await screen.findByRole('button', { name: /account menu/i }));
    expect(screen.queryByRole('link', { name: 'Get Plus' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Plan' })).not.toBeInTheDocument();
  });
});
