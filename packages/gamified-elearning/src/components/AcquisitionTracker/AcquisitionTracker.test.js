import { render, waitFor } from '@testing-library/react';
import AcquisitionTracker, { getAcquisitionSource, shouldTrackAcquisition } from './AcquisitionTracker';
import { trackEvent } from '../../utils/trackEvent';

jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
}), { virtual: true });

describe('acquisition attribution', () => {
  beforeEach(() => {
    sessionStorage.clear();
    trackEvent.mockClear();
  });

  test('reduces campaign and referrer data to fixed privacy-safe channels', () => {
    expect(getAcquisitionSource('?utm_source=instagram&utm_campaign=private-name', '')).toBe('instagram');
    expect(getAcquisitionSource('?utm_source=linkedin&utm_campaign=investor-name', '')).toBe('linkedin');
    expect(getAcquisitionSource('?utm_source=project-share&project=private-title', '')).toBe('project');
    expect(getAcquisitionSource('?utm_source=referral&utm_medium=creator', '')).toBe('referral');
    expect(getAcquisitionSource('', 'https://www.google.com/search?q=private+query')).toBe('google');
    expect(getAcquisitionSource('', 'https://www.linkedin.com/feed/update/private-post')).toBe('linkedin');
    expect(getAcquisitionSource('', 'https://example.org/private/path')).toBe('referral');
    expect(getAcquisitionSource('', '')).toBe('direct');
  });

  test('records at most one visit per browser session', async () => {
    render(<AcquisitionTracker />);
    await waitFor(() => expect(trackEvent).toHaveBeenCalledTimes(1));
    expect(trackEvent).toHaveBeenCalledWith('acquisition_visit', expect.any(String));

    render(<AcquisitionTracker />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  test('captures a campaign code before recording the acquisition visit', async () => {
    window.history.replaceState({}, '', '/?utm_source=instagram&utm_campaign=creator-01');
    render(<AcquisitionTracker />);

    await waitFor(() => expect(trackEvent).toHaveBeenCalledTimes(1));
    expect(sessionStorage.getItem('codeit_session_campaign')).toBe('creator-01');
  });

  test('excludes account, evidence, and administration screens from acquisition totals', () => {
    expect(shouldTrackAcquisition('/admin/funnel')).toBe(false);
    expect(shouldTrackAcquisition('/login')).toBe(false);
    expect(shouldTrackAcquisition('/investor-brief')).toBe(false);
    expect(shouldTrackAcquisition('/builder')).toBe(true);
    expect(shouldTrackAcquisition('/project/example')).toBe(true);
  });
});
