import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PublicProject from './PublicProject';
import { trackEvent } from '../../utils/trackEvent';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => mockNavigate,
    useParams: () => ({ publicId: 'public-123' }),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null }) };
});
jest.mock('../../utils/trackEvent', () => ({
  trackEvent: jest.fn(() => Promise.resolve(true)),
}));

describe('public project sharing', () => {
  const clipboardWrite = jest.fn(() => Promise.resolve());

  beforeEach(() => {
    mockNavigate.mockClear();
    trackEvent.mockClear();
    clipboardWrite.mockClear();
    sessionStorage.clear();
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });
    global.fetch = jest.fn((url) => {
      if (String(url).endsWith('/view')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          project: {
            title: 'Solar System Quiz',
            creator_name: 'CodeIt creator',
            created_at: new Date().toISOString(),
            view_count: 3,
            generated_code: '<!doctype html><html><head><title>Solar System Quiz</title></head><body><h1>Solar System Quiz</h1><button>Start</button></body></html>',
          },
        }),
      });
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('copies the public URL and records a privacy-safe share event', async () => {
    render(<PublicProject />);

    await screen.findByRole('heading', { name: 'Solar System Quiz' });
    fireEvent.click(screen.getByRole('button', { name: 'Share project' }));

    await waitFor(() => expect(clipboardWrite).toHaveBeenCalledWith(
      `${window.location.origin}/project/public-123?utm_source=project-share`
    ));
    expect(trackEvent).toHaveBeenCalledWith('project_share', 'viewer', null);
    expect(screen.getByRole('button', { name: 'Link copied!' })).toBeInTheDocument();
  });

  test('keeps the project link tied to a clear build invitation', async () => {
    render(<PublicProject />);

    await screen.findByRole('heading', { name: 'Solar System Quiz' });
    expect(screen.getByRole('link', { name: 'Build your own' })).toHaveAttribute('href', '/build');
    expect(screen.getByText(/where kids say a game and get one/i)).toBeInTheDocument();
  });

  test('a friend with no account remixes straight into the studio, with the game on their shelf', async () => {
    localStorage.clear();
    render(<PublicProject />);

    await screen.findByRole('heading', { name: 'Solar System Quiz' });
    fireEvent.click(screen.getByRole('button', { name: 'Remix this' }));

    const { listProjects } = require('../../utils/projectShelf');
    const [entry] = listProjects(localStorage);
    expect(entry).toMatchObject({ title: 'Solar System Quiz', prompt: 'Remix of Solar System Quiz' });
    expect(entry.code).toContain('Solar System Quiz');
    expect(mockNavigate).toHaveBeenCalledWith(`/builder?shelf=${entry.id}`);
    expect(trackEvent).toHaveBeenCalledWith('guest_remix', 'other');
    expect(sessionStorage.getItem('codeit_remix_intent')).toBeNull();
  });

  test('with no room on the shelf, a guest still gets the sign-in road back to this project', async () => {
    const real = Storage.prototype.setItem;
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (String(key).includes('shelf')) throw new Error('QuotaExceededError');
      return real.call(this, key, value);
    });
    try {
      render(<PublicProject />);
      await screen.findByRole('heading', { name: 'Solar System Quiz' });
      fireEvent.click(screen.getByRole('button', { name: 'Remix this' }));
      expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { from: '/project/public-123' } });
    } finally {
      setItem.mockRestore();
    }
  });
});
