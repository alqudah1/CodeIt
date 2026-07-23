import { render, screen, waitFor } from '@testing-library/react';
import AdminFunnel from './AdminFunnel';

jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ token: 'admin-token' }) };
});
jest.mock('../../config/api', () => ({
  ENDPOINTS: {
    analytics: {
      funnel: (days) => `/api/analytics/funnel?days=${days}`,
      costs: (days) => `/api/analytics/costs?days=${days}`,
    },
  },
}));
jest.mock('./AdminLayout', () => ({ children }) => children);

describe('admin acquisition funnel', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [{ event_name: 'parent_cta_click', event_count: 7, unique_users: 0 }],
          breakdown: [
            { event_name: 'parent_cta_click', meta: 'try-project', event_count: 4 },
            { event_name: 'parent_cta_click', meta: 'view-pricing', event_count: 2 },
            { event_name: 'parent_cta_click', meta: 'pilot-email', event_count: 1 },
          ],
          daily: [],
          student_age_audit: {},
          founding_leads: [{
            user_id: 12,
            name: 'Parent Tester',
            email: 'parent@example.com',
            interested_at: '2026-07-23T12:00:00.000Z',
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totals: { estimated_usd: 0, calls: 0, input_tokens: 0, output_tokens: 0 } }),
      });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('shows the three privacy-safe parent actions separately', async () => {
    render(<AdminFunnel />);

    await waitFor(() => expect(screen.getByText('Parent acquisition actions')).toBeInTheDocument());
    expect(screen.getByText('Tried a project').parentElement).toHaveTextContent('4');
    expect(screen.getByText('Viewed family pricing').parentElement).toHaveTextContent('2');
    expect(screen.getByText('Opened pilot email').parentElement).toHaveTextContent('1');
    expect(screen.getByText(/does not confirm that they sent a message/i)).toBeInTheDocument();
    expect(screen.getByText('Founding family leads')).toBeInTheDocument();
    expect(screen.getByText('Parent Tester')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'parent@example.com' })).toHaveAttribute('href', 'mailto:parent@example.com');
  });
});
