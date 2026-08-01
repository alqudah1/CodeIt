import {
  captureCampaignCode,
  getCampaignCode,
  getJourneyId,
  journeyHeaders,
  normalizeCampaignCode,
} from './journey';

describe('session journey attribution', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('uses one anonymous UUID for the current browser session', () => {
    const first = getJourneyId();
    const second = getJourneyId();

    expect(first).toMatch(/^[0-9a-f-]{36}$/i);
    expect(second).toBe(first);
    expect(journeyHeaders()).toEqual({ 'X-CodeIt-Journey': first });
  });

  test('replaces malformed stored identifiers instead of transmitting them', () => {
    sessionStorage.setItem('codeit_session_journey', 'email@example.com');

    expect(getJourneyId()).not.toBe('email@example.com');
    expect(getJourneyId()).toMatch(/^[0-9a-f-]{36}$/i);
  });

  test('keeps a short campaign code for the current session', () => {
    expect(captureCampaignCode('?utm_source=instagram&utm_campaign=Creator-01')).toBe('creator-01');
    expect(getCampaignCode()).toBe('creator-01');
    expect(journeyHeaders()).toEqual(expect.objectContaining({
      'X-CodeIt-Campaign': 'creator-01',
      'X-CodeIt-Journey': expect.stringMatching(/^[0-9a-f-]{36}$/i),
    }));
  });

  test('rejects visitor information and arbitrary campaign text', () => {
    expect(normalizeCampaignCode('parent@example.com')).toBeNull();
    expect(normalizeCampaignCode('a private full name')).toBeNull();
    expect(captureCampaignCode('?utm_campaign=parent%40example.com')).toBeNull();
    expect(getCampaignCode()).toBeNull();
  });
});
