// ── One thing on screen at a time ────────────────────────────────────────────
//
// Karam, a real child using the studio, said:
//
//     "I feel like it's crammed in a way maybe u can make like pages?"
//
// He is describing sixteen panels stacked down one page. After a project is
// built the studio shows, in a single column: the description, the interactive
// badges, the preview, the save banner, the publish banner, the styling bar,
// the styling panel, missions, modifier chips, the AI edit box, version
// history, undo, the element hint, the element editor, the concepts used, the
// lessons used, and the explanation. On a phone that is a wall.
//
// So: pages, as he asked. The panels do not change — they get sorted into four
// places that match what a child is actually doing at that moment, and only one
// is on screen at a time.
//
// The order is the journey the product already claims: play it, change it,
// understand it, keep it. Nothing is hidden — every tab is one tap away, and
// they are all reachable in any order, because a child who wants to look at
// their code before playing should not be told no.

const TABS = [
  {
    id: 'play',
    label: 'Play',
    icon: '▶',
    // What the tab is for, in a child's words. Shown under the tab bar so a
    // seven-year-old knows what they are looking at.
    blurb: 'Try your project and see what it does.',
  },
  {
    id: 'change',
    label: 'Change',
    icon: '🎨',
    blurb: 'Make it yours. Colours, words, or ask for something new.',
  },
  {
    id: 'learn',
    label: 'The code',
    icon: '🔍',
    blurb: 'See what your project is made of and how it works.',
  },
  {
    id: 'keep',
    label: 'Keep',
    icon: '💾',
    blurb: 'Save your work, or share it so people can play it.',
  },
];

const TAB_IDS = TABS.map(tab => tab.id);
const DEFAULT_TAB = 'play';

function isTabId(id) {
  return TAB_IDS.includes(id);
}

/**
 * Where a child should land when a project finishes building.
 *
 * Always Play. The first thing anyone wants after asking for a game is to see
 * whether it is any good, and the old studio opened on a screen where the
 * preview competed with nine other panels for attention.
 */
function initialTab() {
  return DEFAULT_TAB;
}

/**
 * The tab the studio should move to on its own after something happens.
 *
 * Deliberately sparse. Moving a child somewhere they did not ask to go is
 * disorienting, so this only fires on the two moments where staying put would
 * leave them looking at a panel that is no longer about anything: a fresh build
 * (go and play it) and a completed save (go and see it kept).
 */
function tabAfter(event, current) {
  if (event === 'built') return 'play';
  if (event === 'saved') return 'keep';
  return isTabId(current) ? current : DEFAULT_TAB;
}

/**
 * What each tab should nudge towards, given where the project is up to.
 *
 * This is the "what do I do now" line, and it is the reason the tab bar is
 * worth having at all: a child who has played but not changed anything gets
 * told, on the Play tab, that Change is next. Returns null when there is
 * nothing useful to say, rather than inventing encouragement.
 */
function tabHint(tabId, { hasPlayed, hasChanged, hasTested, isSaved } = {}) {
  if (tabId === 'play') {
    if (!hasPlayed) return 'Press Play and try it out.';
    if (!hasChanged) return 'Played it? Now open Change and make it yours.';
    if (!hasTested) return 'You changed something — play it again to check it still works.';
    return null;
  }
  if (tabId === 'change') {
    if (!hasChanged) return 'Pick one of the ideas below. Any one will do.';
    if (!hasTested) return 'Nice change. Go back to Play and test it.';
    return null;
  }
  if (tabId === 'keep') {
    if (!hasChanged) return 'Make at least one change first, so the project is really yours.';
    if (isSaved) return null;
    return 'Save it so it is still here tomorrow.';
  }
  return null;
}

/**
 * A dot on a tab, when there is something there worth a child's attention.
 *
 * Not a count and not a red badge — this is a studio for children, not an inbox.
 */
function tabNeedsAttention(tabId, state = {}) {
  return Boolean(tabHint(tabId, state));
}

/** The tabs, with everything the bar needs to render one. */
function tabsFor(state = {}) {
  return TABS.map(tab => ({
    ...tab,
    hint: tabHint(tab.id, state),
    attention: tabNeedsAttention(tab.id, state),
  }));
}

export {
  DEFAULT_TAB,
  TABS,
  TAB_IDS,
  initialTab,
  isTabId,
  tabAfter,
  tabHint,
  tabNeedsAttention,
  tabsFor,
};
