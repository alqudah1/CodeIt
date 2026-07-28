import { getJourneyId, journeyHeaders } from './journey';

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
});

