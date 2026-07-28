import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import Login from './Login';
import Register from './Register';

const mockNavigate = jest.fn();
const mockLogin = jest.fn();
const mockLocationState = { from: '/builder', resumeBuilderAction: 'publish' };

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, state }) => React.createElement('a', {
      href: to,
      'data-state': JSON.stringify(state),
    }, children),
    useLocation: () => ({ state: mockLocationState }),
    useNavigate: () => mockNavigate,
  };
}, { virtual: true });
jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));

describe('builder authentication return', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogin.mockClear();
    axios.post.mockReset();
    axios.post.mockResolvedValue({
      data: { user: { id: 7, role: 'educator' }, token: 'test-token' },
    });
  });

  test('sign in returns to the builder with the publish request intact', async () => {
    render(<Login />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'coder_13' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/builder', {
      replace: true,
      state: { resumeBuilderAction: 'publish' },
    }));
    expect(screen.getByRole('link', { name: 'Create a free account' }).dataset.state).toContain('publish');
  });

  test('adult sign in describes only tools that are available', () => {
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'Parent / Educator' }));

    expect(screen.getByRole('heading', { name: 'Parent / Educator sign in' })).toBeInTheDocument();
    expect(screen.getByText('Access your account, projects, and available learning tools.')).toBeInTheDocument();
    expect(screen.queryByText(/class dashboard/i)).not.toBeInTheDocument();
  });

  test('a new parent account returns to the same builder action', async () => {
    render(<Register />);

    fireEvent.click(screen.getByRole('button', { name: /I am a Parent or Educator/i }));
    fireEvent.change(screen.getByPlaceholderText('Your full name'), { target: { value: 'Parent Tester' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'parent@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Choose a password'), { target: { value: 'test-password' } });
    expect(screen.getByText('Create an adult account for family or classroom use.')).toBeInTheDocument();
    expect(screen.getByText(/Parent dashboards are planned, not live/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create Parent / Educator Account' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/builder', {
      replace: true,
      state: { resumeBuilderAction: 'publish' },
    }));
    expect(axios.post).toHaveBeenCalledWith(
      'http://codeit.test/api/signup',
      expect.objectContaining({ accountType: 'educator' }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-CodeIt-Journey': expect.stringMatching(/^[0-9a-f-]{36}$/i),
        }),
      })
    );
  });
});
