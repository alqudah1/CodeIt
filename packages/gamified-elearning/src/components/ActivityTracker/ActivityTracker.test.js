import { act, render } from '@testing-library/react';
import ActivityTracker, { ACTIVITY_PING_INTERVAL_MS } from './ActivityTracker';

jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ token: 'signed-in-token' }) };
});
jest.mock('../../config/api', () => ({ API_BASE_URL: '' }));

describe('ActivityTracker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.fetch;
  });

  test('records a privacy-safe signed-in visit and throttles focus pings', async () => {
    render(<ActivityTracker />);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/activity/ping', {
      method: 'POST',
      headers: { Authorization: 'Bearer signed-in-token' },
      keepalive: true,
    });

    act(() => window.dispatchEvent(new Event('focus')));
    expect(global.fetch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(ACTIVITY_PING_INTERVAL_MS);
      window.dispatchEvent(new Event('focus'));
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
