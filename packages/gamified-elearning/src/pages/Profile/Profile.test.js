import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Profile from './Profile';
import { trackEvent } from '../../utils/trackEvent';

const mockNavigate = jest.fn();
const mockLogout = jest.fn();
let mockFetchMode = 'unavailable';
let mockProfileUser = { user_id: 8, name: 'Student Builder', username: 'student-builder', role: 'Student' };
let mockFamilyChildren = [];

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
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return {
    AuthContext: React.createContext({
      get user() { return mockProfileUser; },
      token: 'student-token',
      logout: (...args) => mockLogout(...args),
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
    mockLogout.mockClear();
    mockProfileUser = { user_id: 8, name: 'Student Builder', username: 'student-builder', role: 'Student' };
    mockFamilyChildren = [];
    sessionStorage.clear();
    window.location.hash = '';
    trackEvent.mockClear();
    global.fetch = jest.fn((url, options = {}) => {
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
            children: mockFamilyChildren,
          }),
        });
      }
      if (requestUrl.endsWith('/api/family/children') && options.method === 'POST') {
        const child = {
          id: 23,
          username: 'new_coder',
          totalXP: 0,
          lessons: 0,
          quizzes: 0,
          puzzles: 0,
          projects: 0,
          progressEmailsEnabled: false,
        };
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            child,
            status: {
              adultEmail: 'parent@example.com',
              emailVerified: true,
              emailConfigured: true,
              noticeVersion: '2026-07-28',
              children: [child],
            },
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
    window.location.hash = '';
  });

  test('records a new adult reaching family setup once without personal details', async () => {
    mockProfileUser = { id: 19, name: 'Parent Tester', role: 'Educator' };
    window.location.hash = '#family-controls';

    const { rerender } = render(<Profile />);
    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith(
      'new_account_family_setup_view',
      null,
      'student-token'
    ));

    rerender(<Profile />);
    expect(trackEvent).toHaveBeenCalledTimes(1);
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

    expect(await screen.findByRole('heading', { name: 'Private profiles for ages 5 to 12' })).toBeInTheDocument();
    expect(await screen.findByText('Email confirmed')).toBeInTheDocument();
    expect(screen.getByLabelText('Learner username')).toBeInTheDocument();
    expect(screen.getByText(/public publishing is disabled/i)).toBeInTheDocument();
  });

  test('safely hands an existing managed learner into their first project', async () => {
    mockProfileUser = { user_id: 9, name: 'Parent Builder', email: 'parent@example.com', role: 'Educator' };
    mockFamilyChildren = [{
      id: 22,
      username: 'creative_coder',
      totalXP: 0,
      lessons: 0,
      quizzes: 0,
      puzzles: 0,
      projects: 0,
      progressEmailsEnabled: true,
    }];
    window.confirm = jest.fn(() => true);
    render(<Profile />);

    fireEvent.click(await screen.findByRole('button', { name: 'Switch to learner' }));

    expect(window.confirm).toHaveBeenCalledWith(expect.stringMatching(/signs out the parent account/i));
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { managedUsername: 'creative_coder', from: '/builder' },
    });
  });

  test('attributes a newly created learner profile to the current visitor journey', async () => {
    mockProfileUser = { user_id: 9, name: 'Parent Builder', email: 'parent@example.com', role: 'Educator' };
    render(<Profile />);

    await screen.findByLabelText('Learner username');
    fireEvent.change(screen.getByLabelText('Learner username'), { target: { value: 'new_coder' } });
    fireEvent.change(screen.getByLabelText('Learner birthday'), { target: { value: '2016-08-01' } });
    fireEvent.change(screen.getByLabelText('Learner password'), { target: { value: 'strong-password' } });
    fireEvent.click(screen.getByLabelText(/I am this learner’s parent or legal guardian/i));
    fireEvent.click(screen.getByRole('button', { name: 'Create private learner profile' }));

    await screen.findByText(/Use “Switch to learner” below/i);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://codeit.test/api/family/children',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-CodeIt-Journey': expect.stringMatching(/^[0-9a-f-]{36}$/i),
        }),
      })
    );
  });
});
