import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Pricing from './Pricing';
import { trackEvent } from '../../utils/trackEvent';
const mockNavigate = jest.fn();
const mockLocationState = {};
let mockAuth = { user: { id: 12, role: 'Educator', email: 'parent@example.com' }, token: 'parent-token' };


jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useLocation: () => ({ state: mockLocationState }),
    useNavigate: () => mockNavigate,
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../../components/SiteFooter/SiteFooter', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));

function renderPricing() {
  return render(<Pricing />);
}

describe('Pricing', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    trackEvent.mockReset().mockResolvedValue(true);
    mockNavigate.mockClear();
    mockAuth = { user: { id: 12, role: 'Educator', email: 'parent@example.com' }, token: 'parent-token' };
  });

  test('labels the founding offer as planned and does not imply a charge', () => {
    renderPricing();

    expect(screen.getByText('Offer being tested')).toBeInTheDocument();
    expect(screen.getByText('per month · planned')).toBeInTheDocument();
    expect(screen.getByText('No payment is being collected today')).toBeInTheDocument();
  });

  test('confirms interest only after the analytics service accepts it', async () => {
    renderPricing();
    fireEvent.click(screen.getByRole('button', { name: 'Join the founding family waitlist' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Interest saved — thank you' })).toBeDisabled());
    expect(screen.getByText('You are on the founding family waitlist.')).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith('pricing_interest', 'founding-family', 'parent-token');
  });

  test('shows a retryable error instead of claiming an unsaved interest', async () => {
    trackEvent.mockImplementation((eventName) => Promise.resolve(eventName !== 'pricing_interest'));
    renderPricing();
    fireEvent.click(screen.getByRole('button', { name: 'Join the founding family waitlist' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not save that just now');
    expect(screen.getByRole('button', { name: 'Join the founding family waitlist' })).toBeEnabled();
    expect(screen.queryByText('You are on the founding family waitlist.')).not.toBeInTheDocument();
  });

  test('turns anonymous interest into a parent account return journey', () => {
    mockAuth = { user: null, token: null };
    renderPricing();
    fireEvent.click(screen.getByRole('button', { name: 'Join the founding family waitlist' }));

    expect(sessionStorage.getItem('codeit_pending_founding_interest')).toBe('yes');
    expect(mockNavigate).toHaveBeenCalledWith('/register', {
      state: { from: '/pricing', resumePricingInterest: true },
    });
  });
});
