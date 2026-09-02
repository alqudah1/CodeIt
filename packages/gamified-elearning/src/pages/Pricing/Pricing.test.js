import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Pricing from './Pricing';
import { trackEvent } from '../../utils/trackEvent';
let mockAuth = { user: { id: 12, role: 'Educator', email: 'parent@example.com' }, token: 'parent-token' };


jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useLocation: () => ({ pathname: '/pricing', hash: '' }),
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
    global.fetch = jest.fn().mockImplementation((url) => Promise.resolve({
      ok: true,
      json: async () => (String(url).includes('/api/billing/')
        ? { billingEnabled: false, plan: 'free' }
        : { ready: true }),
    }));
    mockAuth = { user: { id: 12, role: 'Educator', email: 'parent@example.com' }, token: 'parent-token' };
  });

  test('the pilot card is free and never contradicts the live paid plan', async () => {
    renderPricing();
    await screen.findByRole('checkbox');

    expect(screen.getByText('Free pilot requests open')).toBeInTheDocument();
    // Both cards render on one screen. The pilot card used to read "planned
    // plan: CA$12/month after testing" a few centimetres from a live CA$12
    // checkout button, and the status line said no payment was being collected
    // while checkout was open. Two false sentences about money, on the page
    // that exists to be trusted about money.
    expect(document.body.textContent).not.toMatch(/after testing|being collected today|billing is not live|before billing opens/i);
    expect(screen.getByText('Try the current family experience. Nothing paid starts automatically.')).toBeInTheDocument();
  });

  test('the plans are the first thing on the page', async () => {
    // There used to be a jump link in the hero — "Request a free family pilot
    // spot ↓" — that scrolled past the free plan and the paid plan to reach the
    // pilot card, which is the third card in the grid immediately below it.
    // With it went a kicker, a 75px headline, a paragraph and a note: the plans
    // began 727px down a page called Pricing, 9% of a laptop's first screen.
    //
    // What has to survive is that a parent still reaches the pilot card, and
    // still reads the truth about money before the numbers.
    renderPricing();
    await screen.findByRole('checkbox');

    expect(screen.getByRole('button', { name: 'Request a free family pilot spot' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Request a free family pilot spot/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Start free/i);
  });

  test('saves an adult lead through the waitlist endpoint', async () => {
    global.fetch.mockImplementation((url) => Promise.resolve(
      /\/api\/founding-waitlist$/.test(String(url))
        ? { ok: true, json: async () => ({ saved: true, confirmationSent: true }) }
        : { ok: true, json: async () => ({ ready: true, billingEnabled: false, plan: 'free' }) }
    ));
    renderPricing();
    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Request a free family pilot spot' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Pilot request saved. Thank you.' })).toBeDisabled());
    expect(screen.getByText('Your family pilot request is saved.')).toBeInTheDocument();
    expect(screen.getByText(/Check your inbox for immediate setup steps/i)).toBeInTheDocument();
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
    global.fetch.mockImplementation((url) => Promise.resolve(
      /\/api\/founding-waitlist$/.test(String(url))
        ? { ok: false }
        : { ok: true, json: async () => ({ ready: true, billingEnabled: false, plan: 'free' }) }
    ));
    renderPricing();
    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Request a free family pilot spot' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not save that just now');
    expect(screen.getByRole('button', { name: 'Request a free family pilot spot' })).toBeEnabled();
    expect(screen.queryByText('Your family pilot request is saved.')).not.toBeInTheDocument();
  });

  test('lets an adult join without creating an account', async () => {
    mockAuth = { user: null, token: null };
    renderPricing();
    fireEvent.change(await screen.findByLabelText('Your email for pilot updates'), {
      target: { value: 'newparent@example.com' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Request a free family pilot spot' }));

    await waitFor(() => expect(
      global.fetch.mock.calls.some(([url]) => /\/api\/founding-waitlist$/.test(String(url)))
    ).toBe(true));
    const [, options] = global.fetch.mock.calls.find(([url]) => /\/api\/founding-waitlist$/.test(String(url)));
    expect(options.headers).not.toHaveProperty('Authorization');
    expect(options.body).toContain('newparent@example.com');
  });

  test('requires explicit adult consent before submitting contact information', async () => {
    renderPricing();
    await screen.findByRole('checkbox');
    fireEvent.click(screen.getByRole('button', { name: 'Request a free family pilot spot' }));

    expect(screen.getByRole('alert')).toHaveTextContent('confirm that you are an adult');
    // No contact details leave the browser without consent.
    expect(global.fetch.mock.calls.filter(([url]) => /\/api\/founding-waitlist$/.test(String(url)))).toHaveLength(0);
  });

  test('offers adults a low-friction email path without sending automatically', async () => {
    renderPricing();

    const emailLink = await screen.findByRole('link', { name: 'Or email us about the pilot' });
    expect(emailLink).toHaveAttribute(
      'href',
      expect.stringMatching(/^mailto:mustafa@lynq\.build\?subject=/)
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
    expect(fallback).toHaveAttribute('href', expect.stringMatching(/^mailto:mustafa@lynq\.build/));
    expect(screen.queryByLabelText('Your email for pilot updates')).not.toBeInTheDocument();
  });
  function mockBilling(billingState) {
    global.fetch.mockImplementation((url) => Promise.resolve({
      ok: true,
      json: async () => (String(url).includes('/api/billing/')
        ? { billingEnabled: true, plan: 'free', canPublish: false, ...billingState }
        : { ready: true }),
    }));
  }

  test('hides the paid plan entirely until billing is switched on', async () => {
    renderPricing();
    await screen.findByRole('checkbox');
    expect(screen.queryByText('CodeIt Plus')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'CodeIt Plus' })).not.toBeInTheDocument();
    expect(screen.queryByText('CA$12')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Subscribe/i })).not.toBeInTheDocument();
  });

  test('shows the paid plan to a visitor who is not signed in', async () => {
    // The paid plan used to be invisible to anyone without an account, because
    // the only source of billingEnabled needed a token. A parent comparing
    // CodeIt on their phone saw no business model at all.
    mockAuth = { user: null, token: null };
    global.fetch.mockImplementation((url) => Promise.resolve({
      ok: true,
      json: async () => (String(url).includes('/api/billing/plan')
        ? { billingEnabled: true, currency: 'CAD', amount: 12, interval: 'month' }
        : { ready: true }),
    }));
    renderPricing();

    expect(await screen.findByRole('heading', { name: 'CodeIt Plus' })).toBeInTheDocument();
    expect(screen.getByText('CA$12')).toBeInTheDocument();
    // Signed out, the call to action is to sign in — never a checkout they
    // cannot complete.
    expect(screen.getByRole('link', { name: /Log in to subscribe/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Subscribe for/i })).not.toBeInTheDocument();
  });

  test('a visitor still gets the free plan if the plan endpoint is down', async () => {
    mockAuth = { user: null, token: null };
    // Only billing is down; the rest of the page must still work.
    global.fetch.mockImplementation((url) => (String(url).includes('/api/billing/')
      ? Promise.reject(new Error('offline'))
      : Promise.resolve({ ok: true, json: async () => ({ ready: true }) })));
    renderPricing();

    await screen.findByRole('checkbox');
    expect(screen.queryByRole('heading', { name: 'CodeIt Plus' })).not.toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  test('offers an adult the CA$12 plan once billing is on', async () => {
    mockBilling({});
    renderPricing();

    expect(await screen.findByRole('heading', { name: 'CodeIt Plus' })).toBeInTheDocument();
    expect(screen.getByText('CA$12')).toBeInTheDocument();
    // The receipt a family gets says CA$13.56 in Ontario, not CA$12. The card has to
    // say so before any card details are typed, not only in the terms.
    expect(screen.getByText('plus tax, per month, cancel any time')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Subscribe for CA\$12\/month/i })).toBeEnabled();
    expect(screen.getByText(/Sales tax is added at checkout/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm the full total before anything is charged/i)).toBeInTheDocument();
  });

  test('never asks a child to pay', async () => {
    mockAuth = { user: { id: 3, role: 'Student', name: 'Sara' }, token: 'student-token' };
    mockBilling({});
    renderPricing();

    expect(await screen.findByRole('heading', { name: 'CodeIt Plus' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Subscribe/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Ask a parent or guardian/i)).toBeInTheDocument();
  });

  test('shows a subscriber their renewal date and a way to cancel', async () => {
    mockBilling({ plan: 'plus', status: 'active', currentPeriodEnd: '2026-09-19T00:00:00.000Z' });
    renderPricing();

    expect(await screen.findByRole('button', { name: 'Manage billing' })).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent(/Renews on/);
    expect(screen.queryByRole('button', { name: /Subscribe/i })).not.toBeInTheDocument();
  });

  test('warns a subscriber whose payment failed', async () => {
    mockBilling({ plan: 'plus', status: 'past_due', currentPeriodEnd: '2026-09-19T00:00:00.000Z' });
    renderPricing();

    expect(await screen.findByRole('status')).toHaveTextContent(/could not take the last payment/i);
  });

  test('tells a cancelling family when access actually ends', async () => {
    mockBilling({
      plan: 'plus', status: 'active', cancelAtPeriodEnd: true,
      currentPeriodEnd: '2026-09-19T00:00:00.000Z', willLoseAccessAt: '2026-09-19T00:00:00.000Z',
    });
    renderPricing();

    expect(await screen.findByRole('status')).toHaveTextContent(/Your plan ends on/);
  });

  test('keeps the page usable when the billing API is down', async () => {
    global.fetch.mockImplementation((url) => (String(url).includes('/api/billing/')
      ? Promise.reject(new Error('network'))
      : Promise.resolve({ ok: true, json: async () => ({ ready: true }) })));
    renderPricing();

    // The free plan is the honest fallback; nothing paid is offered.
    await screen.findByRole('checkbox');
    expect(screen.queryByText('CodeIt Plus')).not.toBeInTheDocument();
    expect(screen.getByText('Free pilot requests open')).toBeInTheDocument();
  });
  test('the monthly email is shown as a labeled example, never as a real record', async () => {
    renderPricing();
    await screen.findByRole('checkbox');

    // The example email gives the "one email a month" promise a shape. It must
    // say it is an example with a made-up learner, in the same breath — an
    // unlabeled sample reads as a fabricated record of a real child.
    const flag = screen.getByText(/Maya is made up/i);
    expect(flag).toBeInTheDocument();
    expect(screen.getByText(/What Maya built this month on CodeIt/)).toBeInTheDocument();
    // The mechanics shown are the product's real mechanics: concept labels and
    // the child's own changed lines.
    expect(screen.getByText(/score = score \+ 2/)).toBeInTheDocument();
    expect(screen.getByText(/open this view any time on your child/i)).toBeInTheDocument();
  });
});
