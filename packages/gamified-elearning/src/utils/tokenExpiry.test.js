import { isTokenExpired, isSessionError, tokenExpiresAt } from './tokenExpiry';

function fakeJwt(exp) {
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${b64({ alg: 'HS256' })}.${b64({ user_id: 1, exp })}.sig`;
}

test('reads the expiry a token carries', () => {
  expect(tokenExpiresAt(fakeJwt(1700000000))).toBe(1700000000000);
  expect(tokenExpiresAt('not-a-token')).toBeNull();
  expect(tokenExpiresAt('')).toBeNull();
});

test('a token past its expiry is expired; one without an expiry is left to the server', () => {
  expect(isTokenExpired(fakeJwt(1000), 2000 * 1000)).toBe(true);
  expect(isTokenExpired(fakeJwt(3000), 2000 * 1000)).toBe(false);
  expect(isTokenExpired('garbage')).toBe(false);
});

test('an invalid-session reply is recognised by status or by wording', () => {
  expect(isSessionError(403, 'Invalid session. Please log in again.')).toBe(true);
  expect(isSessionError(401, '')).toBe(true);
  expect(isSessionError(500, 'Could not save project.')).toBe(false);
});
