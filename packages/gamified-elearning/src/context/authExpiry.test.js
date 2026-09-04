import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Seen live: a browser signed in eight days earlier still said "Welcome
// back" and the first Save failed with "Invalid session" in silence. A token
// past its expiry is not a session.

function fakeJwt(exp) {
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${b64({ alg: 'HS256' })}.${b64({ user_id: 1, exp })}.sig`;
}

function Who() {
  const { user } = useAuth();
  return <p>{user ? `signed in as ${user.name}` : 'signed out'}</p>;
}

afterEach(() => { localStorage.clear(); });

test('an expired token on load means signed out, and the dead token is removed', () => {
  localStorage.setItem('user', JSON.stringify({ name: 'Maya' }));
  localStorage.setItem('token', fakeJwt(Math.floor(Date.now() / 1000) - 60));
  render(<AuthProvider><Who /></AuthProvider>);
  expect(screen.getByText('signed out')).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
});

test('a live token on load is a session', () => {
  localStorage.setItem('user', JSON.stringify({ name: 'Maya' }));
  localStorage.setItem('token', fakeJwt(Math.floor(Date.now() / 1000) + 3600));
  render(<AuthProvider><Who /></AuthProvider>);
  expect(screen.getByText('signed in as Maya')).toBeInTheDocument();
});

test('a server reply of "invalid session" signs the browser out wherever it happened', () => {
  localStorage.setItem('user', JSON.stringify({ name: 'Maya' }));
  localStorage.setItem('token', fakeJwt(Math.floor(Date.now() / 1000) + 3600));
  render(<AuthProvider><Who /></AuthProvider>);
  act(() => { window.dispatchEvent(new Event('codeit:session-invalid')); });
  expect(screen.getByText('signed out')).toBeInTheDocument();
});
