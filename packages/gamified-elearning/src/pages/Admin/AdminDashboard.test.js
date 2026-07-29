import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';

jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ token: 'admin-token' }) };
});
jest.mock('../../config/api', () => ({ API_BASE_URL: '' }));
jest.mock('./AdminLayout', () => ({ children }) => children);
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });

describe('AdminDashboard active-user reporting', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        totals: {
          total_users: 216,
          signups_today: 1,
          signups_week: 8,
          students_with_streak: 58,
        },
        activity: {
          daily_active_users: 2,
          weekly_active_users: 7,
          monthly_active_users: 11,
          tracking_started_at: '2026-07-29',
          definition: 'A non-admin signed-in account that opened or used CodeIt during the selected period.',
        },
        recentSignups: [],
      }),
    });
  });

  afterEach(() => delete global.fetch);

  test('separates measured activity from historical streaks', async () => {
    render(<AdminDashboard />);

    await waitFor(() => expect(screen.getByText('Active Today (DAU)')).toBeInTheDocument());
    expect(screen.getByText('Active 7 Days (WAU)')).toBeInTheDocument();
    expect(screen.getByText('Active 30 Days (MAU)')).toBeInTheDocument();
    expect(screen.getByText('Learners With a Streak')).toBeInTheDocument();
    expect(screen.getByText(/historical accounts are not backfilled/i)).toBeInTheDocument();
    expect(screen.queryByText('Active Streaks')).not.toBeInTheDocument();
  });
});
