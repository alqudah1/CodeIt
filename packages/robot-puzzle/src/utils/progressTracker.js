// Minimal stub so robot-puzzle can compile and run standalone.
// Later: connect this to CodeIt backend progress endpoints.

export function initializeTimeTracker() {
  const start = Date.now();
  return {
    startTime: start,
    getElapsedMs: () => Date.now() - start,
  };
}

export async function trackPuzzleGameCompletion(payload = {}) {
  return { ok: true, type: "puzzleCompletion", payload };
}

export function showXPNotification(message = "XP +1") {
  console.log("[XP]", message);
}

export async function trackGameCompletion(payload = {}) {
  return { ok: true, type: "gameCompletion", payload };
}
