// ── The four lands of the lesson map, and the castle at the end ─────────────
//
// 31 lessons in a row read as a list. Four named stages, each with its own
// ground, read as a journey with an end: Beginner, Intermediate, Advanced,
// Expert, then the certificate. The lesson order and content do not change;
// this is only how the same 31 stops are grouped and drawn.

export const STAGES = [
  { id: 'beginner', name: 'Beginner', place: 'Sprout Meadow', from: 1, to: 8, icon: 'sprout' },
  { id: 'intermediate', name: 'Intermediate', place: 'Mountain Pass', from: 9, to: 16, icon: 'rocket' },
  { id: 'advanced', name: 'Advanced', place: 'Cloud Peaks', from: 17, to: 24, icon: 'crystal' },
  { id: 'expert', name: 'Expert', place: 'Dragon Castle', from: 25, to: 31, icon: 'trophy' },
];

/** The band between stages, in pixels, where the stage's name is drawn. */
export const STAGE_BAND = 112;

export function stageOfLesson(id) {
  return STAGES.find((s) => id >= s.from && id <= s.to) || STAGES[STAGES.length - 1];
}

export function stageIndexOfLesson(id) {
  return STAGES.indexOf(stageOfLesson(id));
}

/** How a stage is doing: done lessons out of its lessons, and its state. */
export function stageProgress(stage, completedIds, nextId) {
  const ids = [];
  for (let id = stage.from; id <= stage.to; id += 1) ids.push(id);
  const done = ids.filter((id) => completedIds.includes(id)).length;
  const state = done === ids.length ? 'done' : (nextId !== null && nextId >= stage.from && nextId <= stage.to) ? 'here' : done > 0 ? 'here' : 'ahead';
  return { done, total: ids.length, state };
}
