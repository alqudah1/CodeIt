import { render, waitFor } from '@testing-library/react';
import AcquisitionTracker, { getAcquisitionSource } from './AcquisitionTracker';
import { trackEvent } from '../../utils/trackEvent';

jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));

describe('acquisition attribution', () => {
  beforeEach(() => {
    sessionStorage.clear();
    trackEvent.mockClear();
  });

  test('reduces campaign and referrer data to fixed privacy-safe channels', () => {
    expect(getAcquisitionSource('?utm_source=instagram&utm_campaign=private-name', '')).toBe('instagram');
    expect(getAcquisitionSource('', 'https://www.google.com/search?q=private+query')).toBe('google');
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
});
