import { shouldWarm, warmCoreRoutes, CORE_ROUTES } from './warmRoutes';

// The pages a class uses are fetched once the first page is up, so a child
// whose Wi-Fi drops can still open Build. Not on a device that asked to save
// data, not on 2G, not while offline.

test('it warms on an ordinary connection and holds back when asked to save data', () => {
  expect(shouldWarm({ onLine: true })).toBe(true);
  expect(shouldWarm({ onLine: true, connection: { effectiveType: '4g' } })).toBe(true);
  expect(shouldWarm({ onLine: true, connection: { saveData: true } })).toBe(false);
  expect(shouldWarm({ onLine: true, connection: { effectiveType: 'slow-2g' } })).toBe(false);
  expect(shouldWarm({ onLine: true, connection: { effectiveType: '2g' } })).toBe(false);
  expect(shouldWarm({ onLine: false })).toBe(false);
  expect(shouldWarm(null)).toBe(false);
});

test('the pages are fetched one after another, after a pause, and a failure does not stop the rest', async () => {
  jest.useFakeTimers();
  const order = [];
  const routes = [
    () => { order.push('build'); return Promise.resolve(); },
    () => { order.push('home'); return Promise.reject(new Error('offline')); },
    () => { order.push('powers'); return Promise.resolve(); },
  ];
  const win = { navigator: { onLine: true }, setTimeout, clearTimeout };
  warmCoreRoutes(win, routes, 4000);
  expect(order).toEqual([]);
  jest.advanceTimersByTime(4000);
  jest.advanceTimersByTime(1);
  jest.useRealTimers();
  await new Promise((r) => setTimeout(r, 0));
  expect(order).toEqual(['build', 'home', 'powers']);
});

test('leaving before the pause ends fetches nothing', () => {
  jest.useFakeTimers();
  const load = jest.fn(() => Promise.resolve());
  const cancel = warmCoreRoutes({ navigator: { onLine: true }, setTimeout, clearTimeout }, [load], 4000);
  cancel();
  jest.advanceTimersByTime(10000);
  expect(load).not.toHaveBeenCalled();
  jest.useRealTimers();
});

test('Build is first, because it is the page that works with no connection', () => {
  expect(CORE_ROUTES.length).toBeGreaterThanOrEqual(6);
  expect(String(CORE_ROUTES[0])).toMatch(/Build\/Build/);
});
