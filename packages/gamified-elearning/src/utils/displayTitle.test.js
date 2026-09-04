import { displayTitle } from './displayTitle';

// Message 68: titles that are prompts get cut at a word boundary, never
// mid-word; titles that are already names pass through untouched.

test('a real name passes through untouched', () => {
  expect(displayTitle('Mission Control Quiz')).toBe('Mission Control Quiz');
  expect(displayTitle('Reaction Rush')).toBe('Reaction Rush');
});

test('a prompt-title is cut to a few words at a word boundary', () => {
  const t = displayTitle('Colorful one-page website with About, Features and Contact sections');
  expect(t).toBe('Colorful one-page website');
  expect(t.length).toBeLessThanOrEqual(28);
  const u = displayTitle('Click-the-target game where colorful circles appear randomly');
  expect(u).toBe('Click-the-target game');
});

test('never ends on a joining word or punctuation', () => {
  expect(displayTitle('A game that requires 2 players and')).not.toMatch(/\b(and|that|with)$/);
  expect(displayTitle('Website for my dog,')).toBe('Website for my dog');
});

test('no word is ever sliced', () => {
  const raw = 'Extraordinarily complicated multiplayer spaceship battle simulator';
  const out = displayTitle(raw);
  for (const word of out.split(' ')) expect(raw.split(' ')).toContain(word);
});

test('empty is a name, not a blank', () => {
  expect(displayTitle('')).toBe('My project');
  expect(displayTitle(undefined)).toBe('My project');
});
