// ── Where a child's own code actually starts ─────────────────────────────────
//
// "The way the code is displayed needs fixing."
//
// Tapping "The code" opened the child's file at line 1, which is:
//
//     <!doctype html>
//     <html>
//     <head>
//     <meta name="viewport" content="width=device-width, initial-scale=1">
//     <title>Catch the Stars</title>
//     <style>
//
// Then sixty lines of CSS. A two-hundred-line file, and nothing a child would
// recognise until somewhere past line seventy — by which point they have
// scrolled through more machinery than most adults would sit through.
//
// Every starter marks the spot on purpose:
//
//     // ── Change these and watch what happens ──
//     let fallSpeed = 3;
//
// That is the line the whole product is pointing at. Open there.

const SETTINGS_MARKER = '── Change these and watch what happens ──';

/**
 * The line number to open a project at, counting from 1.
 *
 * In order of preference: the settings block a starter marks for exactly this
 * purpose, then the first line of real JavaScript, then the top of the file.
 * A generated project has no marker, so the script tag is what it gets.
 */
function whereMyCodeStarts(code) {
  if (typeof code !== 'string' || !code) return 1;
  const lines = code.split('\n');

  const marked = lines.findIndex(line => line.includes(SETTINGS_MARKER));
  if (marked !== -1) return marked + 1;

  // The first <script> that has something in it. A child's code is the part
  // that runs, not the part that describes how it looks.
  for (let i = 0; i < lines.length; i += 1) {
    if (!/<script\b/i.test(lines[i])) continue;
    if (/\bsrc\s*=/i.test(lines[i])) continue;
    // Skip the tag itself and land on the first line with code on it.
    for (let j = i + 1; j < lines.length; j += 1) {
      const text = lines[j].trim();
      if (!text || text.startsWith('//')) continue;
      if (/<\/script>/i.test(text)) break;
      return j + 1;
    }
  }

  return 1;
}

/** What to call the place we opened at, for the line above the editor. */
function whatIsHere(code) {
  if (typeof code !== 'string' || !code) return null;
  if (code.includes(SETTINGS_MARKER)) {
    return 'Opened at the settings you can change. Scroll up for the rest of the file.';
  }
  if (/<script\b(?![^>]*\bsrc\s*=)[^>]*>/i.test(code)) {
    return 'Opened where your project starts working. Scroll up for the colours and layout.';
  }
  return null;
}

export { SETTINGS_MARKER, whatIsHere, whereMyCodeStarts };
