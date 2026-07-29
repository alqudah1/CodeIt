import { render, screen, waitFor } from '@testing-library/react';
import Profile from './Profile';

const mockNavigate = jest.fn();
let mockFetchMode = 'unavailable';
let mockProfileUser = { user_id: 8, name: 'Student Builder', username: 'student-builder', role: 'Student' };

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => mockNavigate,
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/CharacterAvatar/CharacterAvatar', () => () => <div>Avatar</div>);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return {
    AuthContext: React.createContext({
      get user() { return mockProfileUser; },
      token: 'student-token',
    }),
  };
});
jest.mock('../../context/CharacterContext', () => ({
  useCharacter: () => ({
    character: {},
    stats: { totalXP: 20, currentStreak: 1, longestStreak: 2 },
  }),
}));

const settings = {
  parentEmail: '',
  verified: false,
  enabled: true,
  notifyLessons: true,
  notifyExercises: true,
  notifyProjects: true,
  notifyPublishing: true,
};

describe('parent progress availability', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockProfileUser = { user_id: 8, name: 'Student Builder', username: 'student-builder', role: 'Student' };
    global.fetch = jest.fn((url) => {
      const requestUrl = String(url);
      if (requestUrl.endsWith('/api/builder/projects')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, projects: [] }) });
      }
      if (requestUrl.endsWith('/api/family')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            adultEmail: 'parent@example.com',
            emailVerified: true,
            emailConfigured: true,
            noticeVersion: '2026-07-28',
            children: [],
          }),
        });
      }
      if (mockFetchMode === 'unavailable') {
        return Promise.resolve({ ok: false, json: async () => ({ error: 'Not found' }) });
      }
      if (requestUrl.endsWith('/settings')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            settings: { ...settings, emailConfigured: mockFetchMode === 'configured' },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          counts: { lessons: 1, exercises: 2, projects: 1, published: 0 },
          recent: [],
          eventLabels: {},
        }),
      });
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('explains when the running server does not provide parent updates', async () => {
    mockFetchMode = 'unavailable';
    render(<Profile />);

    expect(await screen.findByText('Parent updates are not connected in this preview yet.')).toBeInTheDocument();
    expect(screen.getByText(/No parent email has been collected here/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Parent or guardian email')).not.toBeInTheDocument();
  });

  test('does not claim to send confirmation when email delivery is unconfigured', async () => {
    mockFetchMode = 'not-configured';
    render(<Profile />);

    expect(await screen.findByText('Email delivery is not connected yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save parent details' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send parent confirmation' })).not.toBeInTheDocument();
  });

  test('offers confirmation only when the email service is connected', async () => {
    mockFetchMode = 'configured';
    render(<Profile />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send parent confirmation' })).toBeInTheDocument());
    expect(screen.queryByText('Email delivery is not connected yet.')).not.toBeInTheDocument();
  });

  test('gives a confirmed adult a private managed-profile form', async () => {
    mockProfileUser = { user_id: 9, name: 'Parent Builder', email: 'parent@example.com', role: 'Educator' };
    render(<Profile />);

    expect(await screen.findByRole('heading', { name: 'Private profiles for ages 8–12' })).toBeInTheDocument();
    expect(await screen.findByText('Email confirmed')).toBeInTheDocument();
    expect(screen.getByLabelText('Learner username')).toBeInTheDocument();
    expect(screen.getByText(/public publishing is disabled/i)).toBeInTheDocument();
  });
});
