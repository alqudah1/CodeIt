import { defaultAuthDestination, resolveAuthDestination } from './authDestination';

describe('authentication destinations', () => {
  test('sends learners to progress, adults to family setup, and admins to admin', () => {
    expect(defaultAuthDestination('Student')).toBe('/MainPage');
    expect(defaultAuthDestination('Educator', { newAccount: true })).toBe('/profile#family-controls');
    expect(defaultAuthDestination('Educator')).toBe('/profile');
    expect(defaultAuthDestination('Admin')).toBe('/admin');
  });

  test('preserves a safe intended action instead of replacing it with onboarding', () => {
    expect(resolveAuthDestination('/builder', 'Student', { newAccount: true })).toBe('/builder');
    expect(resolveAuthDestination('/project/example', 'Educator')).toBe('/project/example');
  });

  test('rejects external and malformed return paths', () => {
    expect(resolveAuthDestination('//example.com', 'Student')).toBe('/MainPage');
    expect(resolveAuthDestination('https://example.com', 'Educator')).toBe('/profile');
    expect(resolveAuthDestination(null, 'Educator', { newAccount: true })).toBe('/profile#family-controls');
  });
});
