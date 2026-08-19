import {
  BACKGROUNDS,
  DEFAULT_PREFS,
  FONTS,
  TEXT_SIZES,
  bakeInstantStyle,
  buildInstantCss,
  controlsForGuideLevel,
  optionsForGuideLevel,
  readInstantPrefs,
  readProjectHeading,
  setProjectHeading,
} from './instantStyle';

const PROJECT = '<!DOCTYPE html><html><head><title>Click Game</title>'
  + '<style>body{background:#FFF6ED}h1{font-size:1.9rem}</style></head>'
  + '<body><h1>Click Game</h1><button>Start</button></body></html>';

describe('buildInstantCss', () => {
  test('returns nothing when every choice is the original look', () => {
    expect(buildInstantCss(DEFAULT_PREFS)).toBe('');
    expect(buildInstantCss({})).toBe('');
    expect(buildInstantCss(undefined)).toBe('');
  });

  test('scales root type and enlarges controls for bigger text', () => {
    const css = buildInstantCss({ textSize: 'huge' });
    expect(css).toContain('html{font-size:132% !important}');
    expect(css).toContain('min-height:44px !important');
  });

  test('applies a font stack to the whole document', () => {
    const css = buildInstantCss({ font: 'rounded' });
    expect(css).toContain('font-family:"Comic Sans MS"');
    expect(css).toContain('!important');
  });

  test('layers a background pattern without replacing the project colour', () => {
    const css = buildInstantCss({ background: 'dots' });
    expect(css).toContain('background-image:');
    expect(css).not.toContain('background-color');
  });

  test('falls back to the first option for an unknown id', () => {
    expect(buildInstantCss({ textSize: 'gigantic' })).toBe('');
  });

  test('stays inert CSS — the marker is a comment, not a selector', () => {
    const css = buildInstantCss({ textSize: 'big' });
    expect(css.startsWith('/* codeit-instant-style:')).toBe(true);
    expect(css).not.toContain('[data-codeit-prefs=');
  });
});

describe('bakeInstantStyle', () => {
  test('inserts the block before the final closing style tag', () => {
    const css = buildInstantCss({ textSize: 'big' });
    const baked = bakeInstantStyle(PROJECT, css);
    expect(baked).toContain('html{font-size:115% !important}');
    expect(baked.indexOf('codeit-instant-style')).toBeLessThan(baked.indexOf('</style>'));
    expect(baked).toContain('<h1>Click Game</h1>');
  });

  test('replaces rather than stacks when a choice changes', () => {
    const once = bakeInstantStyle(PROJECT, buildInstantCss({ textSize: 'big' }));
    const twice = bakeInstantStyle(once, buildInstantCss({ textSize: 'huge' }));
    expect(twice.match(/codeit-instant-style/g)).toHaveLength(1);
    expect(twice).toContain('132%');
    expect(twice).not.toContain('115%');
  });

  test('removes the block when the student returns to the original look', () => {
    const styled = bakeInstantStyle(PROJECT, buildInstantCss({ textSize: 'huge', font: 'chunky' }));
    const reset = bakeInstantStyle(styled, buildInstantCss(DEFAULT_PREFS));
    expect(reset).not.toContain('codeit-instant-style');
    expect(reset).toContain('<h1>Click Game</h1>');
    expect(reset).toContain('body{background:#FFF6ED}');
  });

  test('adds a stylesheet when the project has none', () => {
    const bare = '<html><head></head><body><h1>Hi</h1></body></html>';
    const baked = bakeInstantStyle(bare, buildInstantCss({ font: 'clean' }));
    expect(baked).toContain('<style>');
    expect(baked).toContain('codeit-instant-style');
  });

  test('survives a fragment with no head or body', () => {
    const baked = bakeInstantStyle('<h1>Hi</h1>', buildInstantCss({ font: 'clean' }));
    expect(baked).toContain('codeit-instant-style');
    expect(baked).toContain('<h1>Hi</h1>');
  });

  test('leaves empty input alone', () => {
    expect(bakeInstantStyle('', 'x')).toBe('');
    expect(bakeInstantStyle(null, 'x')).toBe(null);
  });

  test('does not disturb an existing colour override block', () => {
    const withColors = PROJECT.replace(
      '</style>',
      '/* codeit-color-override */ :root { --primary: #EC4899 }</style>'
    );
    const baked = bakeInstantStyle(withColors, buildInstantCss({ background: 'grid' }));
    expect(baked).toContain('codeit-color-override');
    expect(baked).toContain('--primary: #EC4899');
    expect(baked).toContain('codeit-instant-style');
  });
});

describe('readInstantPrefs', () => {
  test('round-trips a student’s choices through the saved HTML', () => {
    const prefs = { textSize: 'big', font: 'typewriter', background: 'stripes', corners: 'pill' };
    const baked = bakeInstantStyle(PROJECT, buildInstantCss(prefs));
    expect(readInstantPrefs(baked)).toEqual(prefs);
  });

  test('reports defaults for an untouched project', () => {
    expect(readInstantPrefs(PROJECT)).toEqual(DEFAULT_PREFS);
    expect(readInstantPrefs(undefined)).toEqual(DEFAULT_PREFS);
  });

  test('repairs a corrupted marker instead of throwing', () => {
    const broken = PROJECT.replace('</style>', '/* codeit-instant-style:nope|nope */</style>');
    expect(readInstantPrefs(broken)).toEqual(DEFAULT_PREFS);
  });
});

describe('project heading', () => {
  test('reads the first heading', () => {
    expect(readProjectHeading(PROJECT)).toBe('Click Game');
  });

  test('falls back to the document title when there is no h1', () => {
    expect(readProjectHeading('<html><head><title>My Quiz</title></head><body></body></html>'))
      .toBe('My Quiz');
  });

  test('renames both the heading and the document title', () => {
    const renamed = setProjectHeading(PROJECT, "Sara's Star Catcher");
    expect(renamed).toContain("<h1>Sara&#x27;s Star Catcher</h1>".replace('&#x27;', "'"));
    expect(renamed).toContain('<title>');
    expect(readProjectHeading(renamed)).toBe("Sara's Star Catcher");
  });

  test('escapes markup a student types into the name box', () => {
    const renamed = setProjectHeading(PROJECT, '<script>alert(1)</script>');
    expect(renamed).not.toContain('<script>alert(1)</script>');
    expect(renamed).toContain('&lt;script&gt;');
  });

  test('ignores an empty or whitespace-only name', () => {
    expect(setProjectHeading(PROJECT, '   ')).toBe(PROJECT);
    expect(setProjectHeading(PROJECT, '')).toBe(PROJECT);
  });

  test('caps a very long name', () => {
    const renamed = setProjectHeading(PROJECT, 'x'.repeat(200));
    expect(readProjectHeading(renamed)).toHaveLength(80);
  });
});

describe('age-appropriate control sets', () => {
  test('ages 5–7 get the fewest controls, teens the most', () => {
    const early = controlsForGuideLevel('early');
    const independent = controlsForGuideLevel('independent');
    expect(early.length).toBeLessThan(independent.length);
    expect(early).toContain('theme');
    expect(early).not.toContain('corners');
  });

  test('an unknown level falls back to the middle band', () => {
    expect(controlsForGuideLevel('nonsense')).toEqual(controlsForGuideLevel('guided'));
  });

  test('younger students see a trimmed option list', () => {
    expect(optionsForGuideLevel(FONTS, 'early')).toHaveLength(3);
    expect(optionsForGuideLevel(FONTS, 'guided')).toHaveLength(FONTS.length);
    expect(optionsForGuideLevel(BACKGROUNDS, 'early')).toHaveLength(3);
    expect(optionsForGuideLevel(TEXT_SIZES, 'early')).toHaveLength(3);
  });
});
