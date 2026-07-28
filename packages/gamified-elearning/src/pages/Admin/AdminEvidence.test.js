import { render, screen, waitFor } from '@testing-library/react';
import AdminEvidence from './AdminEvidence';

jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ token: 'admin-token' }) };
});
jest.mock('../../config/api', () => ({ API_BASE_URL: '' }));
jest.mock('./AdminLayout', () => ({ children }) => children);

describe('AdminEvidence', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totals: {
          accounts: 215,
          student_profiles: 199,
          learners_with_xp: 151,
          total_xp: 144060,
          lesson_completions: 609,
          lesson_learners: 165,
          quiz_attempts: 777,
          quiz_learners: 146,
          puzzle_completions: 1165,
          puzzle_learners: 141,
          saved_projects: 12,
          first_account_date: '2025-12-19',
          latest_account_date: '2026-07-27',
          latest_recorded_activity: '2026-05-07',
        },
        lessonReach: [{ lesson_id: 1, learners: 165 }],
        xpDistribution: [{ bucket: '1,000+ XP', learners: 46 }],
        caveat: 'Historical product activity. These records are not verified paying customers and may include internal or test accounts.',
        loginTracking: 'Login counts were not recorded by the historical product.',
      }),
    });
  });

  afterEach(() => delete global.fetch);

  test('shows aggregate evidence without personal details', async () => {
    render(<AdminEvidence />);

    await waitFor(() => expect(screen.getByText('215')).toBeInTheDocument());
    expect(screen.getByText('Historical product evidence')).toBeInTheDocument();
    expect(screen.getByText('144,060')).toBeInTheDocument();
    expect(screen.getByText(/not verified paying customers/i)).toBeInTheDocument();
    expect(screen.getByText(/Login counts were not recorded/i)).toBeInTheDocument();
    expect(screen.queryByText(/email/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/evidence', {
      headers: { Authorization: 'Bearer admin-token' },
    });
  });
});
