import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HomePilotSignup from './HomePilotSignup';

let mockAuth = { user: null, token: null };

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
  };
}, { virtual: true });
jest.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../../config/api', () => ({
  ENDPOINTS: { foundingWaitlist: { join: '/api/founding-waitlist' } },
}));

describe('HomePilotSignup', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mockAuth = { user: null, token: null };
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => delete global.fetch);

  test('captures an explicitly consented adult lead without requiring an account', async () => {
    render(<HomePilotSignup />);
    fireEvent.change(screen.getByLabelText('Adult email'), {
      target: { value: 'parent@example.com' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Join the pilot list' }));

    await waitFor(() => expect(screen.getByText(/You’re on the Founding Family pilot list/i)).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith('/api/founding-waitlist', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'X-CodeIt-Journey': expect.stringMatching(/^[0-9a-f-]{36}$/i),
      }),
      body: JSON.stringify({
        email: 'parent@example.com',
        consent: true,
        source: 'homepage',
        company: '',
      }),
    }));
  });

  test('does not submit without explicit adult consent', () => {
    render(<HomePilotSignup />);
    fireEvent.change(screen.getByLabelText('Adult email'), {
      target: { value: 'parent@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Join the pilot list' }));

    expect(screen.getByRole('alert')).toHaveTextContent('confirm that you are an adult');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('does not let a student account join the adult pilot list', () => {
    mockAuth = { user: { role: 'Student' }, token: 'student-token' };
    render(<HomePilotSignup />);
    fireEvent.change(screen.getByLabelText('Adult email'), {
      target: { value: 'parent@example.com' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Join the pilot list' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Ask a parent, guardian, or educator');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
