// Which editor a pupil gets: the coloured one if it arrives, the plain one if
// it does not.
//
// The coloured editor is asked for as soon as any page with a runner on it
// loads, so it is normally there before the first lesson step is drawn. If the
// file is stopped on the way (13 November 2026: a school filter answering 403
// to every large script), the answer is remembered and the plain editor is
// used for the rest of the visit. The small-files version of CodeIt never asks
// at all: there the coloured editor is not part of the build.
const SMALL_FILES = process.env.REACT_APP_LITE === '1';

let found;          // undefined while it is on its way, null if it did not arrive, else the editor
let asking = null;

if (SMALL_FILES) found = null;

/** The editor if it has already arrived, null if it will not, undefined if not known yet. */
export function editorNow() {
  return found;
}

/** Ask for the coloured editor once. Resolves to it, or to null. Never rejects. */
export function fetchEditor() {
  if (!asking) {
    // The test is written out here, not kept in a name, so that the build
    // can see it is always true in the small-files version and leave the
    // coloured editor out of that build altogether.
    asking = (process.env.REACT_APP_LITE === '1'
      ? Promise.resolve(null)
      : import('./PythonEditor').then((file) => file.default, () => null)
    ).then((editor) => { found = editor || null; return found; });
  }
  return asking;
}

/** For tests: forget what was found. */
export function forgetEditor() {
  found = SMALL_FILES ? null : undefined;
  asking = null;
}
