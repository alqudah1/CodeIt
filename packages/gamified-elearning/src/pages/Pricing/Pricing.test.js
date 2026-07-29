import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Pricing from './Pricing';
import { trackEvent } from '../../utils/trackEvent';
let mockAuth = { user: { id: 12, role: 'Educator', email: 'parent@example.com' }, token: 'parent-token' };


jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
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
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ready: true }),
    });
    mockAuth = { user: { id: 12, role: 'Educator', email: 'parent@example.com' }, token: 'parent-token' };
  });

  test('labels the founding offer as planned and does not imply a charge', async () => {
    renderPricing();
    await screen.findByRole('checkbox');

    expect(screen.getByText('Pilot waitlist · no charge')).toBeInTheDocument();
    expect(screen.getByText('per month · planned')).toBeInTheDocument();
    expect(screen.getByText('No payment is being collected today')).toBeInTheDocument();
    expect(screen.getByText('You decide whether to participate. Nothing starts automatically.')).toBeInTheDocument();
  });

  test('saves an adult lead through the waitlist endpoint', async () => {
    renderPricing();
    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Join the pilot waitlist — no charge' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Interest saved — thank you' })).toBeDisabled());
    expect(screen.getByText('You are on the founding family waitlist.')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringMatching(/\/api\/founding-waitlist$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer parent-token',
          'X-CodeIt-Journey': expect.stringMatching(/^[0-9a-f-]{36}$/i),
        }),
        body: JSON.stringify({
          email: 'parent@example.com',
          consent: true,
          source: 'pricing',
          company: '',
        }),
      })
    );
  });

  test('shows a retryable error instead of claiming an unsaved interest', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ready: true }) })
      .mockResolvedValueOnce({ ok: false });
    renderPricing();
    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Join the pilot waitlist — no charge' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not save that just now');
    expect(screen.getByRole('button', { name: 'Join the pilot waitlist — no charge' })).toBeEnabled();
    expect(screen.queryByText('You are on the founding family waitlist.')).not.toBeInTheDocument();
  });

  test('lets an adult join without creating an account', async () => {
    mockAuth = { user: null, token: null };
    renderPricing();
    fireEvent.change(await screen.findByLabelText('Your email for pilot updates'), {
      target: { value: 'newparent@example.com' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Join the pilot waitlist — no charge' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch.mock.calls[1][1].headers).not.toHaveProperty('Authorization');
    expect(global.fetch.mock.calls[1][1].body).toContain('newparent@example.com');
  });

  test('requires explicit adult consent before submitting contact information', async () => {
    renderPricing();
    await screen.findByRole('checkbox');
    fireEvent.click(screen.getByRole('button', { name: 'Join the pilot waitlist — no charge' }));

    expect(screen.getByRole('alert')).toHaveTextContent('confirm that you are an adult');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('offers adults a low-friction email path without sending automatically', async () => {
    renderPricing();

    const emailLink = await screen.findByRole('link', { name: 'Or email us about the pilot' });
    expect(emailLink).toHaveAttribute(
      'href',
      expect.stringMatching(/^mailto:hello@codeitlearn\.com\?subject=/)
    );
    expect(screen.getByText(/email links open your email app; nothing is sent automatically/i)).toBeInTheDocument();

    emailLink.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(emailLink);
    expect(trackEvent).toHaveBeenCalledWith('parent_cta_click', 'pilot-email');
  });

  test('keeps a working email fallback when the direct endpoint is unavailable', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });
    renderPricing();

    const fallback = await screen.findByRole('link', { name: 'Email us to join the pilot' });
    expect(fallback).toHaveAttribute('href', expect.stringMatching(/^mailto:hello@codeitlearn\.com/));
    expect(screen.queryByLabelText('Your email for pilot updates')).not.toBeInTheDocument();
  });
});
