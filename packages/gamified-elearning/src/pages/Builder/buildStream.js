// ── Reading a build as it is written ────────────────────────────────────────
//
// The server can answer a build with one JSON line every third of a second
// ({ event: 'progress', chars, lines, tail }) and a last line with the project
// ({ event: 'done', status, ...project }). This reads those lines as they
// arrive, however the bytes are cut up on the way, and hands each progress
// line to `onProgress`. It returns the done line, or null if the connection
// ended without one.

export const EXPECTED_CHARS = 14000;

export async function readBuildStream(body, onProgress) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let done = null;
  const take = (line) => {
    const text = line.trim();
    if (!text) return;
    let message;
    try { message = JSON.parse(text); } catch { return; }
    if (message.event === 'progress') onProgress?.(message);
    else if (message.event === 'done') done = message;
  };
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const { value, done: finished } = await reader.read();
    if (value) {
      pending += decoder.decode(value, { stream: true });
      const parts = pending.split('\n');
      pending = parts.pop();
      parts.forEach(take);
    }
    if (finished) break;
  }
  pending += decoder.decode();
  take(pending);
  return done;
}

/** How far along the bar is, from what has been written: never 100 until it is done. */
export function writtenShare(chars) {
  const value = Number(chars) || 0;
  return Math.min(96, Math.round(8 + (value / EXPECTED_CHARS) * 88));
}
