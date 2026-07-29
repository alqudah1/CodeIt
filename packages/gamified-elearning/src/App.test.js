const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, 'App.js'), 'utf8');

describe('public route contract', () => {
  test.each([
    '/',
    '/builder',
    '/lessons',
    '/games',
    '/playground',
    '/explore',
    '/pricing',
    '/privacy',
    '/terms',
    '/ai-website-builder-for-kids',
  ])('declares %s as a public route', (route) => {
    const escapedRoute = route.replaceAll('/', '\\/');
    expect(appSource).toMatch(new RegExp(`<Route\\s+path="${escapedRoute}"`));
  });

  test('loads the trust pages from their dedicated modules', () => {
    expect(appSource).toContain("import('./pages/Legal/Privacy')");
    expect(appSource).toContain("import('./pages/Legal/Terms')");
  });
});
