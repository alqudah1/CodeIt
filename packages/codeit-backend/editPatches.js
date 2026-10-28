'use strict';

// ── A change is a few lines, not a new file ─────────────────────────────────
//
// 28 October 2026, live: a child built "a bunny that catches carrots at night"
// in two seconds, then asked for "Make the carrots fall faster". The edit
// route asked the model to write the whole file back. The instant game is
// about 48 KB, more than the 8,192 words of reply allowed, so after 65
// seconds the answer was cut off and the child was told "AI returned an
// incomplete response". Every change to every instant game ended that way,
// and from the side buttons the child was not even told.
//
// So the model now answers with edits: the exact lines to find, and what they
// become. A speed change is one line out instead of 48 KB, which is why it
// takes seconds, and the size of the project no longer matters.
//
// This file is the part that does not need a model: hiding the long picture
// data the model has no reason to read, reading the edits out of a reply,
// and applying them strictly enough that a wrong guess is caught, not merged.

const LONG_LINE = 1500;
const KEPT = (i) => `__KEPT_${i}__`;

/**
 * The file as the model sees it: any line longer than LONG_LINE (the sprite
 * table, inline images) is swapped for a short marker. `restore` puts the
 * real lines back into whatever the edits produced.
 */
function shrinkForModel(code) {
  const kept = [];
  const text = String(code).split('\n').map((line) => {
    if (line.length <= LONG_LINE) return line;
    // Keep what the line is, so the model can still tell what it holds.
    const head = line.match(/^\s*(?:(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=|<[a-z]+)/i);
    kept.push(line);
    return `${head ? head[0] + ' ' : ''}${KEPT(kept.length)}`;
  }).join('\n');
  // Returns the real file, and the markers an edit removed, because a lost
  // marker is a game whose pictures are gone, which no parse check can see.
  const restore = (edited) => {
    let code = String(edited);
    const lost = [];
    kept.forEach((line, i) => {
      const marker = new RegExp(`^[^\\n]*${KEPT(i + 1)}[^\\n]*$`, 'm');
      if (!marker.test(code)) { lost.push(KEPT(i + 1)); return; }
      code = code.replace(marker, () => line);
    });
    return { code, lost };
  };
  return { text, restore, kept: kept.length };
}

/** The edits and the one-line summary out of a model reply. */
function parseEdits(raw) {
  const text = String(raw || '');
  const edits = [];
  const re = /<FIND>\r?\n?([\s\S]*?)\r?\n?<\/FIND>\s*<REPLACE>\r?\n?([\s\S]*?)\r?\n?<\/REPLACE>/g;
  let m;
  while ((m = re.exec(text))) edits.push({ find: m[1], replace: m[2] });
  const summary = ((text.match(/<SUMMARY>([\s\S]*?)<\/SUMMARY>/) || [])[1] || '').trim();
  return { edits, summary };
}

function occurrences(haystack, needle) {
  let count = 0;
  let at = haystack.indexOf(needle);
  while (at !== -1) { count += 1; at = haystack.indexOf(needle, at + 1); }
  return count;
}

/**
 * Where `find` is in `code` when only the indentation or trailing spaces
 * differ, line for line. Models re-indent; they should not have to be
 * byte-perfect about it. Returns { start, end } only for a single match.
 */
function looseFind(code, find) {
  const want = find.split('\n').map((l) => l.trim());
  while (want.length && !want[0]) want.shift();
  while (want.length && !want[want.length - 1]) want.pop();
  if (!want.length) return null;
  const lines = code.split('\n');
  const starts = [];
  let offset = 0;
  for (const line of lines) { starts.push(offset); offset += line.length + 1; }
  let hit = null;
  for (let i = 0; i + want.length <= lines.length; i += 1) {
    let same = true;
    for (let j = 0; j < want.length; j += 1) {
      if (lines[i + j].trim() !== want[j]) { same = false; break; }
    }
    if (!same) continue;
    if (hit) return null; // more than one place: ambiguous, so no
    const last = i + want.length - 1;
    hit = { start: starts[i], end: starts[last] + lines[last].length };
  }
  return hit;
}

/**
 * Apply edits in order. An edit whose FIND is missing, or appears more than
 * once, is not guessed at: it is reported, and the caller asks again.
 */
function applyEdits(code, edits) {
  let out = String(code);
  const misses = [];
  edits.forEach((edit, i) => {
    const find = edit.find;
    if (!find || !find.trim()) { misses.push({ edit: i + 1, why: 'the FIND was empty' }); return; }
    const exact = occurrences(out, find);
    if (exact === 1) {
      const at = out.indexOf(find);
      out = out.slice(0, at) + edit.replace + out.slice(at + find.length);
      return;
    }
    if (exact > 1) { misses.push({ edit: i + 1, why: 'the FIND appears more than once' }); return; }
    const loose = looseFind(out, find);
    if (!loose) { misses.push({ edit: i + 1, why: 'the FIND is not in the current file' }); return; }
    out = out.slice(0, loose.start) + edit.replace + out.slice(loose.end);
  });
  return { code: out, misses, applied: edits.length - misses.length };
}

module.exports = { shrinkForModel, parseEdits, applyEdits, looseFind, LONG_LINE };
