const JOURNEY_KEY = 'codeit_session_journey';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createJourneyId() {
  const browserCrypto = typeof window !== 'undefined' ? window.crypto : null;
  if (browserCrypto?.randomUUID) return browserCrypto.randomUUID();

  const bytes = new Uint8Array(16);
  if (browserCrypto?.getRandomValues) {
    browserCrypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getJourneyId() {
  try {
    const existing = sessionStorage.getItem(JOURNEY_KEY);
    if (UUID_PATTERN.test(existing || '')) return existing;

    const created = createJourneyId();
    if (!created) return null;
    sessionStorage.setItem(JOURNEY_KEY, created);
    return created;
  } catch (_) {
    return null;
  }
}

export function journeyHeaders() {
  const journeyId = getJourneyId();
  return journeyId ? { 'X-CodeIt-Journey': journeyId } : {};
}
