// ── A shelf, not a slot ──────────────────────────────────────────────────────
//
// Of 283 learners, 19 ever saved a project and 2 ever published one. It is easy
// to read that as "children do not finish things" and reach for a streak
// counter. The code says something simpler and worse.
//
// A child without an account got exactly one slot — a single localStorage key —
// and the next thing they made silently wrote over it. Make a football game on
// Tuesday and a space game on Wednesday, and on Wednesday the football game is
// gone. No warning, no list, nothing to go back to.
//
// And that one slot was only ever read inside the studio. A child who returned
// to codeitlearn.com landed on a marketing page with no sign their game existed
// at all. You cannot have a streak when yesterday's work does not survive the
// night, and no amount of gamification fixes a shelf with nothing on it.
//
// So: a shelf. It holds several projects, keeps the newest first, survives
// without an account, and brings the old single draft along so nobody loses
// what they already have.
//
// ── What this is not ─────────────────────────────────────────────────────────
//
// It is not a substitute for an account. It lives in one browser on one device,
// it can be cleared by a school IT policy or a parent tidying up, and it is
// capped. The studio should keep saying so. It is the difference between "your
// work is gone" and "your work is here, and here is how to keep it properly".

const SHELF_KEY = 'codeit.shelf.v1';
const LEGACY_DRAFT_KEY = 'codeit_guest_project_draft';

/** How long a project survives without an account. Matches the old draft TTL. */
const SHELF_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * How many projects to keep.
 *
 * Not a technical limit — a human one. A child who has made more than this many
 * things has more than enough reason to make an account, and a shelf that keeps
 * growing turns into a junk drawer nobody opens.
 */
const MAX_PROJECTS = 8;

/** One runaway project must not be able to fill the whole shelf. */
const MAX_PROJECT_BYTES = 400_000;

/** Total budget. localStorage is usually about 5MB and shared with everything else. */
const MAX_SHELF_BYTES = 2_000_000;

const MIN_CODE_LENGTH = 80;

function text(value, limit) {
  return typeof value === 'string' ? value.slice(0, limit) : '';
}

/**
 * A short, stable id for a project.
 *
 * Derived from the code and the time rather than Math.random, so the same save
 * produces the same id and this module can be tested at all.
 */
function idFor(code, now) {
  let hash = 2166136261;
  const sample = String(code).slice(0, 4000);
  for (let i = 0; i < sample.length; i += 1) {
    hash ^= sample.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `p${(hash >>> 0).toString(36)}${Number(now).toString(36).slice(-5)}`;
}

function tidy(entry, now) {
  const code = typeof entry?.code === 'string' ? entry.code : '';
  if (code.length < MIN_CODE_LENGTH || code.length > MAX_PROJECT_BYTES) return null;

  const savedAt = Number(entry?.savedAt);
  const updatedAt = Number(entry?.updatedAt);
  return {
    id: text(entry.id, 40) || idFor(code, savedAt || now),
    title: text(entry.title, 120) || 'Untitled project',
    prompt: text(entry.prompt, 2000),
    projectType: text(entry.projectType, 40) || 'game',
    code,
    savedAt: Number.isFinite(savedAt) && savedAt > 0 ? savedAt : now,
    updatedAt: Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : (savedAt || now),
  };
}

function readRaw(storage) {
  try {
    const raw = storage.getItem(SHELF_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(storage, entries) {
  try {
    storage.setItem(SHELF_KEY, JSON.stringify(entries));
    return true;
  } catch {
    // Storage full, private browsing, a locked-down school device. The studio
    // still works; it just cannot remember between visits, and it says so
    // elsewhere rather than pretending.
    return false;
  }
}

/** Newest first, expired ones dropped. */
function listProjects(storage, now = Date.now()) {
  return readRaw(storage)
    .map(entry => tidy(entry, now))
    .filter(Boolean)
    .filter(entry => now - entry.updatedAt <= SHELF_TTL_MS)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_PROJECTS);
}

function getProject(storage, id, now = Date.now()) {
  if (!id) return null;
  return listProjects(storage, now).find(entry => entry.id === id) || null;
}

/**
 * Put a project on the shelf, or update the one already there.
 *
 * Returns the stored entry — the caller needs its id to keep updating the same
 * project rather than filling the shelf with copies of one game.
 */
function saveProject(storage, project, now = Date.now()) {
  const entry = tidy({ ...project, savedAt: project?.savedAt || now, updatedAt: now }, now);
  if (!entry) return null;

  const rest = listProjects(storage, now).filter(existing => existing.id !== entry.id);
  let next = [entry, ...rest].slice(0, MAX_PROJECTS);

  // Drop the oldest until it fits. Better to lose the thing they made last
  // week than to fail the save of the thing they made just now.
  while (next.length > 1 && JSON.stringify(next).length > MAX_SHELF_BYTES) {
    next = next.slice(0, -1);
  }

  return writeRaw(storage, next) ? entry : null;
}

function removeProject(storage, id, now = Date.now()) {
  const next = listProjects(storage, now).filter(entry => entry.id !== id);
  writeRaw(storage, next);
  return next;
}

function clearShelf(storage) {
  try { storage.removeItem(SHELF_KEY); } catch {}
}

/**
 * Bring the old single draft onto the shelf.
 *
 * Runs once. Children who already have a project in the old slot must not lose
 * it because the storage shape changed underneath them — that would be exactly
 * the failure this module exists to fix, committed by the fix itself.
 */
function migrateLegacyDraft(storage, now = Date.now()) {
  let draft = null;
  try {
    const raw = storage.getItem(LEGACY_DRAFT_KEY);
    if (!raw) return null;
    draft = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!draft || typeof draft.code !== 'string') return null;

  const savedAt = Number(draft.savedAt) || now;
  if (now - savedAt > SHELF_TTL_MS) return null;

  const already = listProjects(storage, now).some(entry => entry.code === draft.code);
  if (already) return null;

  return saveProject(storage, {
    title: draft.aiTitle || draft.prompt || 'My project',
    prompt: draft.builtPrompt || draft.prompt || '',
    projectType: draft.projectType || 'game',
    code: draft.code,
    savedAt,
  }, now);
}

/** How a child should see the age of a thing they made. */
function whenMade(updatedAt, now = Date.now()) {
  const seconds = Math.floor((now - Number(updatedAt)) / 1000);
  if (!Number.isFinite(seconds) || seconds < 0) return 'just now';
  if (seconds < 90) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export {
  MAX_PROJECTS,
  MAX_PROJECT_BYTES,
  MAX_SHELF_BYTES,
  SHELF_KEY,
  SHELF_TTL_MS,
  clearShelf,
  getProject,
  idFor,
  listProjects,
  migrateLegacyDraft,
  removeProject,
  saveProject,
  whenMade,
};
