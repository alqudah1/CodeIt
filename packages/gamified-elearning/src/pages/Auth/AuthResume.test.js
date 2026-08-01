import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import Login from './Login';
import Register from './Register';

const mockNavigate = jest.fn();
const mockLogin = jest.fn();
const mockLocationState = { from: '/builder', resumeBuilderAction: 'publish' };
let mockLocationSearch = '';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, state }) => React.createElement('a', {
      href: to,
      'data-state': JSON.stringify(state),
    }, children),
    useLocation: () => ({ state: mockLocationState, search: mockLocationSearch }),
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
    mockLocationState.from = '/builder';
    mockLocationState.resumeBuilderAction = 'publish';
    delete mockLocationState.managedUsername;
    mockLocationSearch = '';
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
    expect(screen.getByRole('link', { name: 'Create an account and publish' }).dataset.state).toContain('publish');
  });

  test('adult sign in describes only tools that are available', () => {
    mockLocationState.from = '/';
    delete mockLocationState.resumeBuilderAction;
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'Parent / Educator' }));

    expect(screen.getByRole('heading', { name: 'Parent / Educator sign in' })).toBeInTheDocument();
    expect(screen.getByText('Access your account, projects, and available learning tools.')).toBeInTheDocument();
    expect(screen.queryByText(/class dashboard/i)).not.toBeInTheDocument();
  });

  test('a managed learner handoff prefills the username and returns to the builder', () => {
    mockLocationState.from = '/builder';
    delete mockLocationState.resumeBuilderAction;
    mockLocationState.managedUsername = 'creative_coder';

    render(<Login />);

    expect(screen.getByLabelText('Username')).toHaveValue('creative_coder');
    expect(screen.getByRole('heading', { name: 'Sign in to your account' })).toBeInTheDocument();
  });

  test('a returning student with no requested action lands on progress', async () => {
    mockLocationState.from = '/';
    delete mockLocationState.resumeBuilderAction;
    axios.post.mockResolvedValueOnce({
      data: { user: { id: 8, name: 'Learner', role: 'Student' }, token: 'student-token' },
    });
    render(<Login />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'learner_8' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/MainPage', {
      replace: true,
      state: null,
    }));
  });

  test('a new student with no requested action lands on the first-win dashboard', async () => {
    mockLocationState.from = '/';
    delete mockLocationState.resumeBuilderAction;
    axios.post.mockResolvedValueOnce({
      data: { user: { id: 9, name: 'learner_9', role: 'Student' }, token: 'student-token' },
    });
    render(<Register />);

    fireEvent.click(screen.getByRole('button', { name: /I am a Student/i }));
    fireEvent.change(screen.getByPlaceholderText('e.g. coder_alex42'), { target: { value: 'learner_9' } });
    fireEvent.change(screen.getByPlaceholderText('Choose a password'), { target: { value: 'test-password' } });
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2010-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account and Play' }));

    await screen.findByRole('heading', { name: 'Add a parent or guardian email?' });
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));

    expect(mockNavigate).toHaveBeenCalledWith('/MainPage', {
      replace: true,
      state: null,
    });
  });

  test('a new parent account returns to the same builder action', async () => {
    render(<Register />);

    expect(screen.getByRole('heading', { name: 'Publish your project' })).toBeInTheDocument();
    expect(screen.getByText(/Your work is safe in this browser/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continue with a Parent or Educator/i }));
    fireEvent.change(screen.getByPlaceholderText('Your full name'), { target: { value: 'Parent Tester' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'parent@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Choose a password'), { target: { value: 'test-password' } });
    expect(screen.getByText(/Your project is safe/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm your adult email to create a private learner profile/i)).toBeInTheDocument();
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

  test('a new eligible student returns directly to the project without an extra recovery step', async () => {
    axios.post.mockResolvedValueOnce({
      data: { user: { id: 10, name: 'builder_10', role: 'Student' }, token: 'student-token' },
    });
    render(<Register />);

    fireEvent.click(screen.getByRole('button', { name: /Publish with a Student account/i }));
    expect(screen.getByRole('heading', { name: 'Create an account to publish' })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('e.g. coder_alex42'), { target: { value: 'builder_10' } });
    fireEvent.change(screen.getByPlaceholderText('Choose a password'), { target: { value: 'test-password' } });
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2010-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account and publish project' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/builder', {
      replace: true,
      state: { resumeBuilderAction: 'publish' },
    }));
    expect(screen.queryByRole('heading', { name: 'Add a parent or guardian email?' })).not.toBeInTheDocument();
  });

  test('refresh-safe query context keeps the project save handoff intact', () => {
    delete mockLocationState.from;
    delete mockLocationState.resumeBuilderAction;
    mockLocationSearch = '?from=builder&action=save';

    render(<Register />);

    expect(screen.getByRole('heading', { name: 'Save your project' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save with a Student account/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login?from=builder&action=save'
    );
  });

  test('a new adult with no requested action lands on family setup', async () => {
    mockLocationState.from = '/';
    delete mockLocationState.resumeBuilderAction;
    render(<Register />);

    fireEvent.click(screen.getByRole('button', { name: /I am a Parent or Educator/i }));
    fireEvent.change(screen.getByPlaceholderText('Your full name'), { target: { value: 'Parent Tester' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'parent@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Choose a password'), { target: { value: 'test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Parent / Educator Account' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/profile#family-controls', {
      replace: true,
      state: null,
    }));
  });

  test('a family campaign link opens directly on the adult account form', () => {
    mockLocationState.from = '/';
    delete mockLocationState.resumeBuilderAction;
    mockLocationSearch = '?for=family';

    render(<Register />);

    expect(screen.getByRole('heading', { name: 'Create a private learner profile' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your full name')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /I am a Student/i })).not.toBeInTheDocument();
    expect(screen.getByText(/After confirming your email/i)).toBeInTheDocument();
  });

  test('a new adult account returns to a shared project even without a builder action', async () => {
    mockLocationState.from = '/project/public-123';
    delete mockLocationState.resumeBuilderAction;
    render(<Register />);

    fireEvent.click(screen.getByRole('button', { name: /I am a Parent or Educator/i }));
    fireEvent.change(screen.getByPlaceholderText('Your full name'), { target: { value: 'Parent Tester' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'parent@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Choose a password'), { target: { value: 'test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Parent / Educator Account' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/project/public-123', {
      replace: true,
      state: null,
    }));
  });
});
