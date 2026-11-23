import { defaultAuthDestination, resolveAuthDestination } from './authDestination';

describe('authentication destinations', () => {
  test('sends learners to progress, adults to family setup, and admins to admin', () => {
    expect(defaultAuthDestination('Student')).toBe('/home');
    expect(defaultAuthDestination('Student', { newAccount: true })).toBe('/builder?welcome=1');
    expect(defaultAuthDestination('Educator', { newAccount: true })).toBe('/profile#family-controls');
    expect(defaultAuthDestination('Educator')).toBe('/profile');
    expect(defaultAuthDestination('Admin')).toBe('/admin');
  });

  test('preserves a safe intended action instead of replacing it with onboarding', () => {
    expect(resolveAuthDestination('/builder', 'Student', { newAccount: true })).toBe('/builder');
    expect(resolveAuthDestination('/project/example', 'Educator')).toBe('/project/example');
  });

  test('rejects external and malformed return paths', () => {
    expect(resolveAuthDestination('//example.com', 'Student')).toBe('/home');
    expect(resolveAuthDestination('https://example.com', 'Educator')).toBe('/profile');
    expect(resolveAuthDestination(null, 'Educator', { newAccount: true })).toBe('/profile#family-controls');
  });
});

describe('a parent who came to pay', () => {
  const { PLUS_PATH, cameForPlus } = require('./authDestination');
  test('both doors under the paid plan are recognised, and nothing else is', () => {
    expect(cameForPlus(new URLSearchParams('?for=plus'))).toBe(true);
    expect(cameForPlus(new URLSearchParams('?from=pricing'))).toBe(true);
    expect(cameForPlus(new URLSearchParams('?from=builder'))).toBe(false);
    expect(cameForPlus(new URLSearchParams(''))).toBe(false);
    expect(cameForPlus(null)).toBe(false);
  });
  test('they are brought back to the plan, whatever kind of account they have', () => {
    expect(PLUS_PATH).toBe('/pricing#codeit-plus');
    expect(resolveAuthDestination(PLUS_PATH, 'Educator', { newAccount: true })).toBe(PLUS_PATH);
    expect(resolveAuthDestination(PLUS_PATH, 'Student')).toBe(PLUS_PATH);
  });
});
