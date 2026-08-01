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
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ saved: true, confirmationSent: true }),
    });
  });

  afterEach(() => delete global.fetch);

  test('captures an explicitly consented adult lead without requiring an account', async () => {
    render(<HomePilotSignup />);
    fireEvent.change(screen.getByLabelText('Adult email'), {
      target: { value: 'parent@example.com' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Request pilot spot' }));

    await waitFor(() => expect(screen.getByText(/Your Founding Family pilot request is saved/i)).toBeInTheDocument());
    expect(screen.getByText(/Check your inbox for immediate family setup steps/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a family account' })).toHaveAttribute('href', '/register?for=family');
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

  test('uses the fixed parent-guide source when embedded on that page', async () => {
    render(<HomePilotSignup source="parents-guide" showHeading={false} />);
    expect(screen.queryByText('Parent, guardian, or educator?')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Adult email'), {
      target: { value: 'guide-parent@example.com' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Request pilot spot' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/founding-waitlist', expect.objectContaining({
      body: JSON.stringify({
        email: 'guide-parent@example.com',
        consent: true,
        source: 'parents-guide',
        company: '',
      }),
    })));
  });

  test('does not submit without explicit adult consent', () => {
    render(<HomePilotSignup />);
    fireEvent.change(screen.getByLabelText('Adult email'), {
      target: { value: 'parent@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Request pilot spot' }));

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
    fireEvent.click(screen.getByRole('button', { name: 'Request pilot spot' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Ask a parent, guardian, or educator');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
