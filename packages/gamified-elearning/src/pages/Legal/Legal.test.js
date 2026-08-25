import { render, screen } from '@testing-library/react';
import Privacy from './Privacy';
import Terms from './Terms';
import { useSEO } from '../../hooks/useSEO';
import { PRICE, PRICE_PER_INTERVAL } from '../../config/pricing';

jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/SiteFooter/SiteFooter', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));

describe('trust pages', () => {
  beforeEach(() => useSEO.mockClear());

  test('renders the current privacy and child-safety commitments', () => {
    render(<Privacy />);

    expect(screen.getByRole('heading', { name: 'Clear information about what CodeIt collects, and why.' })).toBeInTheDocument();
    expect(screen.getByText('Projects are private by default')).toBeInTheDocument();
    expect(screen.getByText(/does not claim that email confirmation alone proves legal identity/i)).toBeInTheDocument();
    expect(screen.getByText(/does not collect a child email address/i)).toBeInTheDocument();
    expect(screen.getByText(/kept only in that browser for up to seven days/i)).toBeInTheDocument();
    expect(screen.getByText(/not uploaded as a saved account project/i)).toBeInTheDocument();
    expect(useSEO).toHaveBeenCalledWith(expect.objectContaining({ canonical: '/privacy' }));
  });

  test('renders account, publishing, and payment terms', () => {
    render(<Terms />);

    expect(screen.getByRole('heading', { name: 'Build freely. Learn responsibly. Keep people safe.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Eligibility and younger learners' })).toBeInTheDocument();
    expect(screen.getByText(/Managed younger profiles cannot publish projects publicly/i)).toBeInTheDocument();
    expect(screen.getByText(/never starts a subscription/i)).toBeInTheDocument();
    expect(useSEO).toHaveBeenCalledWith(expect.objectContaining({ canonical: '/terms' }));
  });

  // Getting these wrong has money consequences, so they are asserted rather
  // than trusted to a proofread.
  describe('the terms that govern taking money', () => {
    beforeEach(() => render(<Terms />));

    test('no longer claims CodeIt is free-only and merely testing interest', () => {
      // The page said "CodeIt currently offers free access" while the pricing
      // page took subscriptions. Charging against those terms is the bug.
      expect(screen.queryByText(/currently offers free access/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/testing interest in a Founding Family plan/i)).not.toBeInTheDocument();
    });

    test('states the price, the currency and when it recurs', () => {
      expect(screen.getByRole('heading', { name: 'Billing and renewal' })).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`costs ${PRICE.replace('$', '\\$')} per month`, 'i'))).toBeInTheDocument();
      expect(screen.getByText(/Canadian dollars/i)).toBeInTheDocument();
      expect(screen.getByText(/again on the same day each month until you cancel/i)).toBeInTheDocument();
    });

    test('says how to cancel and what happens to access afterwards', () => {
      expect(screen.getByRole('heading', { name: 'Cancelling and refunds' })).toBeInTheDocument();
      expect(screen.getByText(/Manage billing/i)).toBeInTheDocument();
      expect(screen.getByText(/until the end of the month you have already paid for/i)).toBeInTheDocument();
    });

  test('promises no cooling-off window it does not offer', () => {
      // Deliberately no "N days to change your mind". A monthly subscription
      // cancelled before the next charge is the protection; inventing a window
      // and then not honouring it would be worse than offering none.
      expect(screen.queryByText(/days of your first payment/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/change your mind/i)).not.toBeInTheDocument();
      expect(screen.getByText(/never committed beyond the month you are in/i)).toBeInTheDocument();
      expect(screen.getByText(/returned to the card that paid/i)).toBeInTheDocument();
    });

    test('promises a refund when a charge was wrong', () => {
      expect(screen.getByText(/a payment taken after you cancelled/i)).toBeInTheDocument();
      expect(screen.getByText(/duplicate charge/i)).toBeInTheDocument();
    });

    test('does not override consumer protection law', () => {
      expect(screen.getByText(/consumer protection law where you live/i)).toBeInTheDocument();
    });

    test('describes what really happens to published work when a plan ends', () => {
      // The public project route matches on is_public alone, with no billing
      // check, so an already-published project stays reachable. An earlier
      // draft of these terms claimed the opposite.
      expect(screen.getByText(/stays reachable at its link/i)).toBeInTheDocument();
    });

    test('says CodeIt never sees a card number', () => {
      expect(screen.getByText(/never reach CodeIt/i)).toBeInTheDocument();
    });

    test('says children cannot subscribe', () => {
      expect(screen.getByText(/CodeIt does not sell to children/i)).toBeInTheDocument();
    });

    test('quotes one price, in one currency, across the whole page', () => {
      // The site previously stated CA$12, US$12 and "0" in different places.
      const { container } = render(<Terms />);
      const text = container.textContent;
      expect(text).toContain(PRICE_PER_INTERVAL);
      expect(text).not.toMatch(/US\$/);
    });
  });
});
