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
const mockTrack = jest.fn();
jest.mock('../../utils/trackEvent', () => ({ trackEvent: (...args) => mockTrack(...args) }));

// The header asks the billing API once per mount for any account that is not
// a managed profile. Each test says what that answer is; the default is the
// free plan with no verdict yet, which is also what an unreachable billing API
// leaves behind.
//
// canSubscribe is the server's answer to "may this account be charged", and it
// is the whole point of asking. It is null here rather than false because that
// is the real starting state, and the header has to show nothing while it is
// null without treating it as a refusal.
let mockBilling = { billingEnabled: false, plan: 'free', canSubscribe: null };
jest.mock('../../utils/billing', () => ({
  DEFAULT_BILLING_STATE: { billingEnabled: false, plan: 'free', canSubscribe: null },
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
    expect(screen.getByRole('link', { name: 'Lessons' })).toBeInTheDocument();
  });
});

// CodeIt's first paying family said subscribing took too many buttons. From a
// signed-in adult's studio the plan page was two taps behind an avatar.
describe('the shortcut to subscribing', () => {
  afterEach(() => { mockBilling = { billingEnabled: false, plan: 'free', canSubscribe: null }; mockTrack.mockClear(); });

  test('an adult on the free plan gets one tap to the paid card', async () => {
    mockBilling = { billingEnabled: true, plan: 'free', canSubscribe: true };
    renderHeader({ id: 1, name: 'Parent', role: 'Educator' }, 'token-abc');
    const link = await screen.findByRole('link', { name: 'Get Plus' });
    expect(link).toHaveAttribute('href', '/pricing#codeit-plus');
    // One destination, one control: Plan leaves the menu while this is up.
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.queryByRole('menuitem', { name: 'Plan' })).not.toBeInTheDocument();
    // Shown is counted as well as clicked. A click count with no denominator
    // cannot tell a control nobody presses from one nobody is offered.
    expect(mockTrack).toHaveBeenCalledWith('upgrade_prompt_shown', 'header', 'token-abc');
    fireEvent.click(link);
    expect(mockTrack).toHaveBeenCalledWith('upgrade_click', 'header', 'token-abc');
  });

  test('a subscriber is never sold to again', async () => {
    mockBilling = { billingEnabled: true, plan: 'plus', canSubscribe: true };
    renderHeader({ id: 1, name: 'Parent', role: 'Educator' }, 'token-abc');
    fireEvent.click(await screen.findByRole('button', { name: /account menu/i }));
    expect(screen.queryByRole('link', { name: 'Get Plus' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Plan' })).toHaveAttribute('href', '/pricing');
    expect(mockTrack).not.toHaveBeenCalledWith('upgrade_prompt_shown', 'header', 'token-abc');
  });

  // The reason the gate moved off the role. An adult beginner signs up on the
  // learner path, so their role is 'student' and their account is not managed.
  // The server looks at their date of birth and says yes; /pricing offered them
  // the plan; the header used to read the role, decide "child", and never even
  // ask. They were the one group in the product that had said yes to paying and
  // been shown no way to.
  test('an adult on a learner account is offered the plan the server will sell them', async () => {
    mockBilling = { billingEnabled: true, plan: 'free', canSubscribe: true };
    renderHeader({ id: 3, name: 'Dana', role: 'student' }, 'token-abc');
    const link = await screen.findByRole('link', { name: 'Get Plus' });
    expect(link).toHaveAttribute('href', '/pricing#codeit-plus');
    expect(mockTrack).toHaveBeenCalledWith('upgrade_prompt_shown', 'header', 'token-abc');
  });

  // The other half of the same change, and the one that must never break: the
  // role no longer keeps a price away from a child, so the server's answer has
  // to. An eleven-year-old who signed up on their own holds exactly the same
  // kind of account as the adult above.
  test('a child who signed up alone is not offered a price, whatever the nav says', async () => {
    mockBilling = { billingEnabled: true, plan: 'free', canSubscribe: false };
    renderHeader({ id: 4, name: 'Maya', role: 'student' }, 'token-abc');
    expect(await screen.findByRole('link', { name: 'Lessons' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Get Plus' })).not.toBeInTheDocument();
    expect(mockTrack).not.toHaveBeenCalledWith('upgrade_prompt_shown', 'header', 'token-abc');
  });

  // Fail closed. Between mount and the answer there is no verdict, and a
  // header that reads "no verdict" as "go ahead" flashes a price at whoever is
  // holding the phone.
  test('nothing is offered while the server has not answered', async () => {
    mockBilling = { billingEnabled: true, plan: 'free', canSubscribe: null };
    renderHeader({ id: 5, name: 'Unknown', role: 'student' }, 'token-abc');
    expect(await screen.findByRole('link', { name: 'Lessons' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Get Plus' })).not.toBeInTheDocument();
  });

  test('a child is never sold to at all', async () => {
    mockBilling = { billingEnabled: true, plan: 'free', canSubscribe: false };
    renderHeader({ id: 2, name: 'Sara', role: 'student', managedProfile: true }, 'token-abc');
    fireEvent.click(await screen.findByRole('button', { name: /account menu/i }));
    expect(screen.queryByRole('link', { name: 'Get Plus' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Plan' })).not.toBeInTheDocument();
  });
});

// A teacher who made a class on Monday had no way back to it but the address
// bar; a parent's week was two taps behind the avatar.
describe('an adult\'s header goes to the two pages adults came for', () => {
  test('a signed-in adult sees This week and Classes in the bar', () => {
    renderHeader({ id: 1, name: 'Ms R', role: 'Educator' });
    expect(screen.getByRole('link', { name: 'This week' })).toHaveAttribute('href', '/parent');
    expect(screen.getByRole('link', { name: 'Classes' })).toHaveAttribute('href', '/teach');
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
    // One place for each destination, not two.
    expect(screen.queryByRole('menuitem', { name: 'This week' })).not.toBeInTheDocument();
  });

  test('a child sees neither, and a visitor sees the door for teachers', () => {
    const child = renderHeader({ id: 2, name: 'Maya', role: 'student' });
    expect(screen.queryByRole('link', { name: 'Classes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'This week' })).not.toBeInTheDocument();
    child.unmount();
    renderHeader(null);
    expect(screen.getByRole('link', { name: 'For teachers' })).toHaveAttribute('href', '/teach');
  });
});
