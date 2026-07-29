import {
  GUEST_PROJECT_DRAFT_KEY,
  GUEST_PROJECT_DRAFT_TTL_MS,
  clearGuestProjectDraft,
  readGuestProjectDraft,
  saveGuestProjectDraft,
} from './guestProjectDraft';

const projectCode = '<!doctype html><html><head><style>body{color:#432c23}</style></head><body><h1>My project</h1><button>Play</button></body></html>';

describe('guest project recovery', () => {
  beforeEach(() => localStorage.clear());

  test('keeps a bounded project only on the current device', () => {
    expect(saveGuestProjectDraft(localStorage, {
      code: projectCode,
      prompt: 'my project',
      promptHistory: ['my project'],
    }, 1000)).toBe(true);

    expect(readGuestProjectDraft(localStorage, 2000)).toEqual(expect.objectContaining({
      code: projectCode,
      prompt: 'my project',
      savedAt: 1000,
    }));
  });

  test('expires old or malformed recovery data', () => {
    saveGuestProjectDraft(localStorage, { code: projectCode }, 1000);
    expect(readGuestProjectDraft(localStorage, 1000 + GUEST_PROJECT_DRAFT_TTL_MS + 1)).toBeNull();
    expect(localStorage.getItem(GUEST_PROJECT_DRAFT_KEY)).toBeNull();

    localStorage.setItem(GUEST_PROJECT_DRAFT_KEY, '{"code":"too short","savedAt":2000}');
    expect(readGuestProjectDraft(localStorage, 2001)).toBeNull();
  });

  test('can be cleared after an intentional discard or account save', () => {
    saveGuestProjectDraft(localStorage, { code: projectCode }, 1000);
    clearGuestProjectDraft(localStorage);
    expect(readGuestProjectDraft(localStorage, 1001)).toBeNull();
  });
});
