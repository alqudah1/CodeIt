// ── The medal case ──────────────────────────────────────────────────────────
//
// The five ideas the studio can actually ask a child to explain, mirroring
// SKILL_FOR_QUESTION in the backend. Showing the un-won ones as empty slots is
// what makes it a collection rather than a list — and it invents nothing: a
// locked medal says "not yet", never that it was earned.
export const MEDALS = [
  { id: 'loop-count',     icon: '\u{1F501}', name: 'Loop Reader',   match: /how many times a loop/i },
  { id: 'increment',      icon: '\u{2795}',  name: 'Score Keeper',  match: /adds to the score/i },
  { id: 'clicks',         icon: '\u{1F446}', name: 'Click Master',  match: /run when you click/i },
  { id: 'starting-value', icon: '\u{1F4E6}', name: 'Value Finder',  match: /starting value/i },
  { id: 'background',     icon: '\u{1F3A8}', name: 'Colour Tracer', match: /colour in the stylesheet/i },
];

/** Which medals this learner has actually won, and where. Records only. */
export function medalsFrom(records) {
  const won = [];
  for (const medal of MEDALS) {
    for (const record of records || []) {
      const hit = (record.skills || []).find(skill => medal.match.test(skill));
      if (hit) { won.push({ ...medal, projectTitle: record.projectTitle }); break; }
    }
  }
  return won;
}
