import { SPRITE_NAMES, PLAYERS, ENEMIES, TREASURES, spriteNameFor, spriteUri, spriteTable } from './sprites';

test('every menu is made of sprites we drew ourselves', () => {
  for (const name of [...PLAYERS, ...ENEMIES, ...TREASURES]) expect(SPRITE_NAMES).toContain(name);
  expect(SPRITE_NAMES.length).toBeGreaterThanOrEqual(13);
});

test('a sprite is a data URI an image tag can load, with the xmlns a standalone SVG needs', () => {
  const uri = spriteUri('ship');
  expect(uri.startsWith('data:image/svg+xml;utf8,')).toBe(true);
  expect(decodeURIComponent(uri)).toContain('xmlns="http://www.w3.org/2000/svg"');
  expect(Object.keys(spriteTable())).toEqual(SPRITE_NAMES);
});

test('the server\'s emoji, a child\'s words and nonsense all become a sprite', () => {
  expect(spriteNameFor('🚀')).toBe('ship');
  expect(spriteNameFor('👾')).toBe('alien');
  expect(spriteNameFor('💎')).toBe('gem');
  expect(spriteNameFor('ship')).toBe('ship');
  expect(spriteNameFor('a big bomb')).toBe('bomb');
  expect(spriteNameFor('Carrots')).toBe('carrot');
  expect(spriteNameFor('???')).toBe('hero');
  expect(spriteNameFor(undefined, 'rock')).toBe('rock');
});
