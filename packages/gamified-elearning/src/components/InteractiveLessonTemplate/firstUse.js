// ── First use: where an activity link lands, and what counts as done ─────────
//
// Two public activity links exist so a Reel or a Story can send a family to
// the exact step it showed, not to a lesson introduction. They target stable
// step IDs, never array positions, and only Lesson 1 has them.
const FIRST_ACTIVITIES = {
  'python-first-run': 'example',
  'python-change-message': 'tryit',
};

export function firstUseStep(lesson, search, restoredIndex = 0) {
  if (Number(lesson?.id) !== 1) return restoredIndex;
  const activity = new URLSearchParams(search).get('activity');
  const target = Object.prototype.hasOwnProperty.call(FIRST_ACTIVITIES, activity)
    ? FIRST_ACTIVITIES[activity] : null;
  const index = target ? lesson.steps.findIndex(step => step.id === target) : -1;
  return index >= 0 ? index : restoredIndex;
}

// The step a learner must run and submit before a lesson can be recorded as
// complete. Until 11 September the early "Finish lesson" control appeared
// after any non-concept step, so a prediction alone counted as a finished
// lesson. Every one of the 31 lessons has a "Try it" step where the learner
// writes code themselves; that is the practice, and it is required in all of
// them, not only Lesson 1. Matched by type so a lesson cannot slip through by
// naming the step differently.
export function firstPracticeIndex(lesson) {
  const steps = Array.isArray(lesson?.steps) ? lesson.steps : [];
  return steps.findIndex(step => step.type === 'tryit');
}
