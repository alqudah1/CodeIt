import { render, screen } from '@testing-library/react';
import Certificate, { certificateDate } from './Certificate';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children), NavLink: ({ children, to }) => React.createElement('a', { href: to }, children) };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../ds/TabBar', () => () => null);
jest.mock('../../components/BrandLogo/BrandLogo', () => () => null);
jest.mock('../../components/Icon/Icon', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../config/api', () => ({ ENDPOINTS: { lessons: { progress: 'http://codeit.test/api/lessons/progress' } } }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null }) };
});
const { AuthContext } = require('../../context/AuthContext');
const all31 = Array.from({ length: 31 }, (_, i) => i + 1);

test('all 31 done: a certificate with the name and the real finishing date', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ completedLessons: all31, finishedAt: '2026-10-28T15:00:00Z' }) }));
  render(<AuthContext.Provider value={{ user: { name: 'Maya Q' }, token: 't' }}><Certificate /></AuthContext.Provider>);
  expect(await screen.findByRole('heading', { name: 'Maya Q' })).toBeInTheDocument();
  expect(screen.getByText(/finished all 31 lessons/)).toBeInTheDocument();
  expect(screen.getByText(certificateDate('2026-10-28T15:00:00Z'))).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Print it' })).toBeInTheDocument();
});

test('not yet: how far there is to go, no certificate', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ completedLessons: [1, 2, 3], finishedAt: '2026-10-28T15:00:00Z' }) }));
  render(<AuthContext.Provider value={{ user: { name: 'Maya Q' }, token: 't' }}><Certificate /></AuthContext.Provider>);
  expect(await screen.findByText('3 of 31 lessons done.')).toBeInTheDocument();
  expect(screen.queryByText(/finished all/)).toBeNull();
});
