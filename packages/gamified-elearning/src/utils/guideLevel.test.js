import {
  GUIDE_LEVELS,
  GUIDE_LEVEL_IDS,
  effectiveGuideLevel,
  learnerGuideLevel,
  storeGuideLevelOverride,
  storedGuideLevelOverride,
} from './guideLevel';

beforeEach(() => window.localStorage.clear());

describe('the level for an account', () => {
  test('an explicit learning mode is honoured', () => {
    expect(learnerGuideLevel({ learningMode: 'early' })).toBe('early');
    expect(learnerGuideLevel({ learningMode: 'guided' })).toBe('guided');
    expect(learnerGuideLevel({ learningMode: 'independent' })).toBe('independent');
  });

  test('a child on a parent-managed profile gets help by default', () => {
    // We do not know their age, and guessing "independent" for a six-year-old
    // is the worse of the two mistakes.
    expect(learnerGuideLevel({ managedProfile: true })).toBe('guided');
  });

  test('an explicit independent setting still wins on a managed profile', () => {
    expect(learnerGuideLevel({ managedProfile: true, learningMode: 'independent' }))
      .toBe('independent');
  });

  test('a signed-out visitor is guided, not thrown in at the deep end', () => {
    expect(learnerGuideLevel(null)).toBe('guided');
    expect(learnerGuideLevel(undefined)).toBe('guided');
  });

  test('a signed-in adult account with no preference explores freely', () => {
    expect(learnerGuideLevel({ name: 'Parent' })).toBe('independent');
  });

  test('an unrecognised learning mode falls back rather than leaking through', () => {
    expect(GUIDE_LEVEL_IDS).toContain(learnerGuideLevel({ learningMode: 'wizard' }));
  });
});

describe('a level the child chose themselves', () => {
  test('round-trips through storage', () => {
    storeGuideLevelOverride('early');
    expect(storedGuideLevelOverride()).toBe('early');
  });

  test('a junk value in storage is ignored rather than applied', () => {
    window.localStorage.setItem('codeit_guide_level', 'wizard');
    expect(storedGuideLevelOverride()).toBe('');
  });

  test('storing a junk value clears the choice instead of saving it', () => {
    storeGuideLevelOverride('early');
    storeGuideLevelOverride('wizard');
    expect(storedGuideLevelOverride()).toBe('');
  });

  test('the choice beats the account default', () => {
    storeGuideLevelOverride('early');
    expect(effectiveGuideLevel({ learningMode: 'independent' })).toBe('early');
  });

  test('with no choice made, the account default applies', () => {
    expect(effectiveGuideLevel({ learningMode: 'early' })).toBe('early');
    expect(effectiveGuideLevel(null)).toBe('guided');
  });

  test('a browser that refuses localStorage does not break the page', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(storedGuideLevelOverride()).toBe('');
    expect(() => storeGuideLevelOverride('early')).not.toThrow();
    expect(effectiveGuideLevel(null)).toBe('guided');
    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe('the level list', () => {
  test('offers three levels covering the whole age range', () => {
    expect(GUIDE_LEVELS).toHaveLength(3);
    GUIDE_LEVELS.forEach(level => {
      expect(level.label).toBeTruthy();
      expect(level.icon).toBeTruthy();
      expect(level.ages).toBeTruthy();
    });
  });

  test('every level returned by learnerGuideLevel is one that exists', () => {
    [null, {}, { managedProfile: true }, { learningMode: 'early' }].forEach(user => {
      expect(GUIDE_LEVEL_IDS).toContain(learnerGuideLevel(user));
    });
  });
});
