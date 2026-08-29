// ── The moment a child has actually built something ──────────────────────────
//
// Mustafa, after real children asked "why don't we just use Scratch" and "why
// is the AI writing the code", was asked whether that gets answered in words on
// the site or by what the first five minutes feel like. He said: the first five
// minutes. And: "let them change" before the studio claims they built anything,
// and "they should see what's behind in a way that they use the lessons".
//
// The evidence was already in the product and already honest — the code tab
// lists every concept found in the child's own file, with the line number, the
// line itself, and a link to the lesson that teaches it. It was on tab three,
// which a child reaches after they have already decided whether this is worth
// their time.
//
// So it comes to them, once, at the only moment it can be earned: the first
// change they make with their own hands. Before that the screen asks them to
// change something (see whatCanIChange.js). After it, the same line turns into
// what they just proved they can read.
//
// One line, in the slot the change hint was using. B cut six instruction
// systems to one and this does not add a seventh.
//
// Pure functions. No React, no network.

/**
 * Which concept to open the door with.
 *
 * The earliest lesson among the ones actually in their file, not the most
 * frequent. A project using variables, loops and functions most often uses
 * functions most often — and a child sent to Lesson 9 first has been handed the
 * hardest thing in their own code as an introduction. The lessons are ordered
 * by difficulty, so the earliest one present is the one they can follow today,
 * and it is still, provably, in the file in front of them.
 *
 * ── Skipping what they have already done ─────────────────────────────────────
 *
 * "Earliest" alone sends every child, on every project, to Lesson 2. That is
 * the right first answer and a dead end on the second visit: a browser check
 * opened three different starters and got Variables all three times. So lessons
 * already finished are passed over, and the door opens on the earliest thing in
 * their own code they have not been taught yet.
 *
 * A child with no account has finished none, gets the earliest, and that is
 * correct rather than a fallback. A child who has finished every lesson their
 * project touches gets the earliest again — going back to a lesson you have
 * done is a better offer than being shown nothing.
 */
function doorway(concepts, completedLessons) {
  const list = Array.isArray(concepts) ? concepts.filter(Boolean) : [];
  if (!list.length) return null;

  const done = new Set((Array.isArray(completedLessons) ? completedLessons : []).map(Number));
  const earliest = (candidates) => candidates.reduce((best, concept) => {
    const a = Number(concept.lessonId);
    const b = Number(best.lessonId);
    if (!Number.isFinite(a)) return best;
    if (!Number.isFinite(b)) return concept;
    if (a !== b) return a < b ? concept : best;
    // Same lesson: the one with more of it in the file is the better example.
    return (concept.count || 0) > (best.count || 0) ? concept : best;
  }, candidates[0]);

  const unseen = list.filter(concept => !done.has(Number(concept.lessonId)));
  return earliest(unseen.length ? unseen : list);
}

/**
 * What the screen says once they have changed something.
 *
 * Names the concept, and the line in *their* file, because "your project uses
 * variables" is a claim and "your project uses variables, on line 12" is
 * something a child can go and look at. The claim without the line is exactly
 * the thing codeConcepts.js was written to stop the studio doing.
 */
function lookInside(concepts, completedLessons) {
  const found = doorway(concepts, completedLessons);
  if (!found) return null;

  const others = (Array.isArray(concepts) ? concepts.length : 0) - 1;
  return {
    concept: found,
    // Not "you built this". They changed one thing, which is true and is
    // enough, and it is the first true version of that sentence the studio has
    // been able to say.
    sentence: `You changed it, so it is yours now. It uses ${found.label} — yours is on line ${found.line}.`,
    lessonLabel: `Learn ${found.lessonTitle}`,
    lessonId: found.lessonId,
    rest: others > 0
      ? (others === 1 ? 'and 1 more thing in your code' : `and ${others} more things in your code`)
      : null,
  };
}

export { doorway, lookInside };
