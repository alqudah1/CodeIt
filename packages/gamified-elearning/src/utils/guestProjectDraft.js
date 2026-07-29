export const GUEST_PROJECT_DRAFT_KEY = 'codeit_guest_project_draft';
export const GUEST_PROJECT_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const MAX_CODE_LENGTH = 1_500_000;

const shortText = (value, limit) => (
  typeof value === 'string' ? value.slice(0, limit) : ''
);

const stringList = (value, itemLimit, itemLength) => (
  Array.isArray(value)
    ? value.filter((item) => typeof item === 'string').slice(0, itemLimit).map((item) => item.slice(0, itemLength))
    : []
);

export function saveGuestProjectDraft(storage, draft, now = Date.now()) {
  const code = typeof draft?.code === 'string' ? draft.code : '';
  if (code.length < 80 || code.length > MAX_CODE_LENGTH) return false;

  try {
    storage.setItem(GUEST_PROJECT_DRAFT_KEY, JSON.stringify({
      code,
      prompt: shortText(draft.prompt, 2000),
      builtPrompt: shortText(draft.builtPrompt, 2000),
      projectType: shortText(draft.projectType, 40) || 'website',
      aiTitle: shortText(draft.aiTitle, 160),
      builtSummary: shortText(draft.builtSummary, 500),
      conceptsUsed: stringList(draft.conceptsUsed, 12, 80),
      promptHistory: stringList(draft.promptHistory, 12, 500),
      hasPersonalized: draft.hasPersonalized === true,
      savedAt: now,
    }));
    return true;
  } catch {
    return false;
  }
}

export function readGuestProjectDraft(storage, now = Date.now()) {
  try {
    const raw = storage.getItem(GUEST_PROJECT_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    const code = typeof draft?.code === 'string' ? draft.code : '';
    const age = now - Number(draft?.savedAt);
    const valid = code.length >= 80
      && code.length <= MAX_CODE_LENGTH
      && Number.isFinite(age)
      && age >= 0
      && age <= GUEST_PROJECT_DRAFT_TTL_MS;
    if (!valid) {
      storage.removeItem(GUEST_PROJECT_DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    try { storage.removeItem(GUEST_PROJECT_DRAFT_KEY); } catch {}
    return null;
  }
}

export function clearGuestProjectDraft(storage) {
  try {
    storage.removeItem(GUEST_PROJECT_DRAFT_KEY);
  } catch {}
}
