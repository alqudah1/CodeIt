// ── How much help this learner wants ─────────────────────────────────────────
//
// A five-year-old and a sixteen-year-old use the same site. The guide level is
// what makes that bearable: bigger targets and fewer choices at "Big help",
// everything at "Explore myself".
//
// This used to live inside Builder.js, which meant the setting a child chose in
// the Project Studio had no effect on lessons — the place they spend most of
// their time. It is here so both read the same answer.

const GUIDE_LEVELS = [
  { id: 'early',       icon: '🧸', label: 'Big help',       ages: 'about 5 to 7' },
  { id: 'guided',      icon: '🧭', label: 'Some help',      ages: 'about 8 to 12' },
  { id: 'independent', icon: '🚀', label: 'Explore myself', ages: 'about 13 and up' },
];

const GUIDE_LEVEL_IDS = GUIDE_LEVELS.map(level => level.id);

const STORAGE_KEY = 'codeit_guide_level';

/**
 * The level for this account, before any manual override.
 *
 * A child on a parent-managed profile defaults to "guided" rather than
 * "independent": the safer default when we do not know their age. A signed-out
 * visitor also gets "guided", because the first thing they see should not
 * assume expertise.
 */
function learnerGuideLevel(user) {
  // An explicit setting always wins. The old ordering checked managedProfile in
  // the middle of the chain, which meant 'early' overrode a managed profile but
  // 'independent' was silently ignored on one — so a parent could set their
  // thirteen-year-old to explore freely and watch nothing change.
  if (GUIDE_LEVEL_IDS.includes(user?.learningMode)) return user.learningMode;
  if (user?.managedProfile) return 'guided';
  return user ? 'independent' : 'guided';
}

/** A child can switch levels themselves; the choice follows them across pages. */
function storedGuideLevelOverride() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return GUIDE_LEVEL_IDS.includes(saved) ? saved : '';
  } catch {
    return '';
  }
}

function storeGuideLevelOverride(level) {
  try {
    if (GUIDE_LEVEL_IDS.includes(level)) window.localStorage.setItem(STORAGE_KEY, level);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // A locked-down browser just means the choice does not persist. It still
    // applies for this visit.
  }
}

/** The level actually in force: an explicit choice beats the account default. */
function effectiveGuideLevel(user) {
  return storedGuideLevelOverride() || learnerGuideLevel(user);
}

export {
  GUIDE_LEVELS,
  GUIDE_LEVEL_IDS,
  effectiveGuideLevel,
  learnerGuideLevel,
  storeGuideLevelOverride,
  storedGuideLevelOverride,
};
