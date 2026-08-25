import {
  DEFAULT_TAB,
  TABS,
  TAB_IDS,
  initialTab,
  isTabId,
  tabAfter,
  tabHint,
  tabNeedsAttention,
  tabsFor,
} from './builderTabs';

// Karam: "I feel like it's crammed in a way maybe u can make like pages?"

describe('the pages themselves', () => {
  test('there are four, few enough to fit a phone', () => {
    expect(TABS).toHaveLength(4);
  });

  test('they follow the journey the product promises', () => {
    expect(TAB_IDS).toEqual(['play', 'change', 'learn', 'keep']);
  });

  test('every tab says what it is for, in words a child reads', () => {
    TABS.forEach(tab => {
      expect(tab.label).toBeTruthy();
      expect(tab.label.length).toBeLessThan(12);
      expect(tab.blurb).toBeTruthy();
      expect(tab.icon).toBeTruthy();
    });
  });

  test('no tab is named after something in the code', () => {
    // "Studio panel", "modifiers", "entitlements". none of these mean anything
    // to a ten-year-old.
    const jargon = /panel|modifier|entitlement|config|component|render/i;
    TABS.forEach(tab => {
      expect(tab.label).not.toMatch(jargon);
      expect(tab.blurb).not.toMatch(jargon);
    });
  });
});

describe('where a child starts', () => {
  test('on Play, because the first thing you want is to see if it works', () => {
    expect(initialTab()).toBe('play');
    expect(DEFAULT_TAB).toBe('play');
  });

  test('a freshly built project sends them to Play', () => {
    expect(tabAfter('built', 'keep')).toBe('play');
  });

  test('a completed save sends them to Keep', () => {
    expect(tabAfter('saved', 'change')).toBe('keep');
  });

  test('anything else leaves them where they were', () => {
    // Being moved somewhere you did not ask to go is disorienting.
    expect(tabAfter('edited', 'change')).toBe('change');
    expect(tabAfter('played', 'learn')).toBe('learn');
  });

  test('a nonsense current tab falls back rather than showing nothing', () => {
    expect(tabAfter('edited', 'not-a-tab')).toBe('play');
    expect(tabAfter('edited', undefined)).toBe('play');
  });

  test('tab ids are checked, so a stale saved value cannot blank the studio', () => {
    expect(isTabId('play')).toBe(true);
    expect(isTabId('elements')).toBe(false);
    expect(isTabId(null)).toBe(false);
  });
});

describe('the nudge on each page', () => {
  const fresh = { hasPlayed: false, hasChanged: false, hasTested: false, isSaved: false };

  test('a brand new project tells them to press Play', () => {
    expect(tabHint('play', fresh)).toMatch(/Press Play/i);
  });

  test('once played, Play points at Change', () => {
    expect(tabHint('play', { ...fresh, hasPlayed: true })).toMatch(/Change/);
  });

  test('Change opens with a concrete instruction, not encouragement', () => {
    // This is the step Karam could not understand. "Pick one of the ideas
    // below" beats "add a fun idea".
    const hint = tabHint('change', fresh);
    expect(hint).toMatch(/Pick one/i);
    expect(hint).not.toMatch(/fun idea|be creative|have fun/i);
  });

  test('after a change, it sends them back to test it', () => {
    expect(tabHint('change', { ...fresh, hasChanged: true })).toMatch(/play it again|test it/i);
  });

  test('Keep explains why it will not let them save yet', () => {
    // Rather than a disabled button with no reason, which is what the studio
    // did before.
    expect(tabHint('keep', fresh)).toMatch(/at least one change/i);
  });

  test('Keep asks for a save once a change has been made and tested', () => {
    expect(tabHint('keep', { hasPlayed: true, hasChanged: true, hasTested: true, isSaved: false }))
      .toMatch(/Save it/i);
  });

  test('a finished, saved project is left alone', () => {
    const done = { hasPlayed: true, hasChanged: true, hasTested: true, isSaved: true };
    expect(tabHint('play', done)).toBeNull();
    expect(tabHint('change', done)).toBeNull();
    expect(tabHint('keep', done)).toBeNull();
  });

  test('the code page never nags', () => {
    // Looking at your own code is not a chore to be completed.
    expect(tabHint('learn', fresh)).toBeNull();
    expect(tabHint('learn', { hasPlayed: true, hasChanged: true })).toBeNull();
  });

  test('an unknown tab has nothing to say rather than throwing', () => {
    expect(tabHint('nope', fresh)).toBeNull();
    expect(tabHint('play', undefined)).toBeTruthy();
  });
});

describe('the dot that marks a page worth visiting', () => {
  test('appears exactly where there is a hint', () => {
    const state = { hasPlayed: true, hasChanged: false, hasTested: false, isSaved: false };
    TAB_IDS.forEach(id => {
      expect(`${id}:${tabNeedsAttention(id, state)}`).toBe(`${id}:${Boolean(tabHint(id, state))}`);
    });
  });

  test('a finished project has no dots left', () => {
    const done = { hasPlayed: true, hasChanged: true, hasTested: true, isSaved: true };
    expect(TAB_IDS.filter(id => tabNeedsAttention(id, done))).toEqual([]);
  });
});

describe('what the tab bar renders from', () => {
  test('every tab arrives ready to draw', () => {
    const tabs = tabsFor({ hasPlayed: false });
    expect(tabs).toHaveLength(4);
    tabs.forEach(tab => {
      expect(tab.id).toBeTruthy();
      expect(tab.label).toBeTruthy();
      expect(tab).toHaveProperty('hint');
      expect(typeof tab.attention).toBe('boolean');
    });
  });

  test('it copes with being handed nothing', () => {
    expect(() => tabsFor()).not.toThrow();
    expect(tabsFor()).toHaveLength(4);
  });
});
