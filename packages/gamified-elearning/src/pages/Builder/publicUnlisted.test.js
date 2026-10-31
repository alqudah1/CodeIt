import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PublicProject from './PublicProject';

// ── An unlisted link reads the unlisted answer as it really is ──────────────
//
// GET /api/builder/unlisted/:id answers in camelCase (routes/unlisted.js:
// projectType, createdAt, code). The page read created_at and project_type,
// so every /project/u-... page said "NaNd ago" and a remix of a website went
// on the shelf as a game (found 31 October 2026).

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => mockNavigate,
    useParams: () => ({ publicId: 'u-0123456789ab' }),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null }) };
});
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));

const CODE = '<!doctype html><html><head><title>My Dog Rex</title></head><body><h1>My Dog Rex</h1><p>He likes sticks and naps.</p></body></html>';

beforeEach(() => {
  localStorage.clear();
  mockNavigate.mockClear();
  global.fetch = jest.fn((url) => {
    expect(String(url)).toBe('http://codeit.test/api/builder/unlisted/0123456789ab');
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        project: { publicId: '0123456789ab', title: 'My Dog Rex', projectType: 'website', code: CODE, label: null, createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
      }),
    });
  });
});

test('the age is real, never NaN', async () => {
  render(<PublicProject />);
  await screen.findByRole('heading', { name: 'My Dog Rex' });
  expect(document.body.textContent).not.toMatch(/NaN/);
  expect(screen.getByText('3h ago')).toBeInTheDocument();
});

test('a remix of an unlisted website goes on the shelf as a website', async () => {
  render(<PublicProject />);
  await screen.findByRole('heading', { name: 'My Dog Rex' });
  fireEvent.click(screen.getByRole('button', { name: /Remix this/ }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  const shelf = JSON.parse(localStorage.getItem('codeit.shelf.v1'));
  expect(shelf[0]).toMatchObject({ title: 'My Dog Rex', projectType: 'website', code: CODE });
});
