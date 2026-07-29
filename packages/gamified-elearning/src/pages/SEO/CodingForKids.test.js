import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CodingForKids from './CodingForKids';
import { useSEO } from '../../hooks/useSEO';
import { useFAQSchema } from '../../hooks/useFAQSchema';
import { trackEvent } from '../../utils/trackEvent';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/SiteFooter/SiteFooter', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../hooks/useFAQSchema', () => ({ useFAQSchema: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: null, token: null }) }));
jest.mock('../../config/api', () => ({
  ENDPOINTS: { foundingWaitlist: { join: '/api/founding-waitlist' } },
}));

describe('parent acquisition page', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useSEO.mockClear();
    useFAQSchema.mockClear();
    trackEvent.mockClear();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => delete global.fetch);

  test('opens with a concrete project and honest trust commitments', () => {
    render(<CodingForKids />);

    expect(screen.getByRole('heading', { name: 'A first coding project they’ll want to keep improving.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a learner profile' })).toHaveAttribute('href', '/register?for=family');
    expect(screen.getByRole('link', { name: 'Try a project together' })).toHaveAttribute('href', '/builder');
    expect(screen.getByText('Saved projects stay private until Publish.')).toBeInTheDocument();
    expect(screen.getByText('Private parent-managed profiles begin at age 8.')).toBeInTheDocument();
    expect(screen.getByText(/Ages 8–12 start through a free parent or guardian account/i)).toBeInTheDocument();
    expect(screen.queryByText(/ages 8–14/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/everything is free/i)).not.toBeInTheDocument();
  });

  test('measures the direct family-account path separately from a project trial', () => {
    render(<CodingForKids />);

    fireEvent.click(screen.getByRole('link', { name: 'Create a learner profile' }));
    expect(trackEvent).toHaveBeenCalledWith('parent_cta_click', 'create-family-account');

    fireEvent.click(screen.getByRole('link', { name: 'Try a project together' }));
    expect(trackEvent).toHaveBeenCalledWith('parent_cta_click', 'try-project');
  });

  test('captures an adult lead directly from the parent guide', async () => {
    render(<CodingForKids />);

    fireEvent.change(screen.getByLabelText('Adult email'), {
      target: { value: 'parent@example.com' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Join the pilot list' }));

    await waitFor(() => expect(screen.getByText(/You’re on the Founding Family pilot list/i)).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith('/api/founding-waitlist', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        email: 'parent@example.com',
        consent: true,
        source: 'parents-guide',
        company: '',
      }),
    }));
    expect(screen.getByText(/Nothing starts automatically/i)).toBeInTheDocument();
    expect(useSEO).toHaveBeenCalledWith(expect.objectContaining({ canonical: '/coding-for-kids' }));
    expect(useFAQSchema).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ q: 'What age is CodeIt for?' }),
    ]));
  });

  test('keeps the planned family plan as a separately measured detail link', () => {
    render(<CodingForKids />);

    const planLink = screen.getByRole('link', { name: 'See the planned family plan' });
    expect(planLink).toHaveAttribute('href', '/pricing');
    expect(screen.getByText(/No charge or subscription starts/i)).toBeInTheDocument();

    fireEvent.click(planLink);
    expect(trackEvent).toHaveBeenCalledWith('parent_cta_click', 'view-pricing');
  });
});
