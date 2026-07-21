import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Pricing from './Pricing';
import { trackEvent } from '../../utils/trackEvent';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children) };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
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
  });

  test('labels the founding offer as planned and does not imply a charge', () => {
    renderPricing();

    expect(screen.getByText('Offer being tested')).toBeInTheDocument();
    expect(screen.getByText('per month · planned')).toBeInTheDocument();
    expect(screen.getByText('No payment is being collected today')).toBeInTheDocument();
  });

  test('confirms interest only after the analytics service accepts it', async () => {
    renderPricing();
    fireEvent.click(screen.getByRole('button', { name: "I'd consider this plan" }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Interest saved — thank you' })).toBeDisabled());
    expect(screen.getByText('That is useful—thank you.')).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith('pricing_interest', 'founding-family');
  });

  test('shows a retryable error instead of claiming an unsaved interest', async () => {
    trackEvent.mockImplementation((eventName) => Promise.resolve(eventName !== 'pricing_interest'));
    renderPricing();
    fireEvent.click(screen.getByRole('button', { name: "I'd consider this plan" }));

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not save that just now');
    expect(screen.getByRole('button', { name: "I'd consider this plan" })).toBeEnabled();
    expect(screen.queryByText('That is useful—thank you.')).not.toBeInTheDocument();
  });
});
