// The five words analytics accepts for a kind of project, from free text.
export function projectKindOf(value) {
  const t = String(value || '').toLowerCase();
  if (/quiz|trivia/.test(t)) return 'quiz';
  if (/website|site|page|portfolio|restaurant|shop|blog|landing/.test(t)) return 'website';
  if (/tool|calculator|timer|drawing|flashcard/.test(t)) return 'tool';
  if (/game|clicker|runner|memory|reaction|soccer|platformer|dodge|racing|typing|tower|maze|survival|puzzle|basketball|cooking|custom/.test(t)) return 'game';
  return 'other';
}
