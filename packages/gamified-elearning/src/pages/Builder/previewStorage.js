// ── Making "save my high score" work inside the preview ──────────────────────
//
// Ask the studio for a game and a child will, very often, ask for a high score
// that is still there tomorrow. The generated code reaches for localStorage,
// which is the right answer — and until now the preview threw:
//
//     Uncaught SecurityError: Failed to read the 'localStorage' property from
//     'Window': Access is denied for this document.
//
// The preview iframe is sandboxed without `allow-same-origin`, so it runs on an
// opaque origin with no storage of its own. Verified in Chromium, not assumed.
//
// The obvious fix — add `allow-same-origin` — is the wrong one and we are not
// going to do it. `allow-scripts allow-same-origin` on a same-origin document
// lets the framed page reach straight back into codeitlearn.com: the parent's
// localStorage, its auth token, its cookies. The code in that frame is written
// by a model from a child's prompt, and on a published project page it is
// written by a *different* child. That combination is a full sandbox escape,
// and no high score is worth it.
//
// So instead the frame keeps its opaque origin and gets a localStorage that
// behaves like the real one:
//
//   * The parent reads whatever this project saved last time and bakes it into
//     the shim as a seed, because the localStorage API is synchronous and there
//     is no chance to ask for it once the child's code starts running.
//   * Writes inside the frame are mirrored out by postMessage, and the parent
//     persists them under a key scoped to that one project.
//   * Nothing else changes: if a document ever does get real storage, the shim
//     notices and leaves it completely alone.
//
// The child gets a high score that survives a reload. The frame still cannot
// touch anything of ours.

/** Where one project's preview storage lives in the parent. */
const STORAGE_PREFIX = 'codeit.preview.storage.';

/**
 * A cap on what a preview may keep.
 *
 * A generated game with a bug — writing to localStorage inside a game loop, say
 * — should not be able to fill up the parent's storage and break the studio for
 * everything else. 32KB is far more than a score table needs.
 */
const MAX_STORAGE_BYTES = 32 * 1024;

const STORAGE_MESSAGE = 'CODEIT_STORAGE';

function storageKeyFor(projectKey) {
  const key = String(projectKey || 'draft').replace(/[^\w.-]/g, '_').slice(0, 80);
  return `${STORAGE_PREFIX}${key}`;
}

/** What this project saved last time, or {} — never throws. */
function loadPreviewStorage(projectKey, store) {
  try {
    const source = store || window.localStorage;
    const raw = source.getItem(storageKeyFor(projectKey));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    // Values are strings in a real Storage; anything else came from somewhere
    // we do not trust, so drop it rather than hand the frame a surprise.
    const clean = {};
    Object.keys(parsed).forEach(name => {
      if (typeof parsed[name] === 'string') clean[name] = parsed[name];
    });
    return clean;
  } catch {
    return {};
  }
}

/**
 * Persist what a preview saved. Returns false when it was refused, so a caller
 * can tell the difference between "kept" and "silently dropped".
 */
function savePreviewStorage(projectKey, data, store) {
  try {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    const clean = {};
    Object.keys(data).forEach(name => {
      if (typeof data[name] === 'string') clean[name] = data[name];
    });
    const raw = JSON.stringify(clean);
    if (raw.length > MAX_STORAGE_BYTES) return false;
    (store || window.localStorage).setItem(storageKeyFor(projectKey), raw);
    return true;
  } catch {
    // Private browsing, a full disk, a locked-down school device. The preview
    // still works; it just forgets between reloads.
    return false;
  }
}

/** Throw away one project's preview storage — used when a project is reset. */
function clearPreviewStorage(projectKey, store) {
  try {
    (store || window.localStorage).removeItem(storageKeyFor(projectKey));
    return true;
  } catch {
    return false;
  }
}

/** Is this postMessage a preview reporting its storage? */
function isStorageMessage(data) {
  return Boolean(
    data
    && data.type === STORAGE_MESSAGE
    && data.data
    && typeof data.data === 'object'
    && !Array.isArray(data.data)
  );
}

/**
 * The script that gives the frame a working localStorage.
 *
 * Runs before anything the child's project does, which is the whole point — a
 * game reads its high score at the top of the file.
 *
 * Written as pieces joined into ONE line, and it has to stay that way. The
 * browser reports error line numbers relative to the whole document, so every
 * newline in here would push the child's own code down and make the error
 * console point at the wrong line. previewErrors.test.js fails if a newline
 * ever creeps back in.
 */
function storageShimScript(seed = {}) {
  // Embedded as JSON, and `<` escaped so a saved value can never close the
  // script tag it is sitting inside.
  const seedJson = JSON.stringify(seed || {}).replace(/</g, '\\u003c');

  return [
    '(function(){',
    "try{window.localStorage.getItem('__codeit_probe__');return;}catch(e){}",
    `var saved=${seedJson};`,
    'function report(store){',
    `try{parent.postMessage({type:'${STORAGE_MESSAGE}',data:store},'*');}catch(e){}`,
    '}',
    'function make(store,persist){',
    'var api={',
    'getItem:function(k){k=String(k);return Object.prototype.hasOwnProperty.call(store,k)?store[k]:null;},',
    'setItem:function(k,v){store[String(k)]=String(v);if(persist)report(store);},',
    'removeItem:function(k){delete store[String(k)];if(persist)report(store);},',
    'clear:function(){Object.keys(store).forEach(function(k){delete store[k];});if(persist)report(store);},',
    'key:function(i){var keys=Object.keys(store);return i<keys.length?keys[i]:null;}',
    '};',
    "Object.defineProperty(api,'length',{get:function(){return Object.keys(store).length;}});",
    'return api;',
    '}',
    'try{',
    "Object.defineProperty(window,'localStorage',{value:make(saved,true),configurable:true});",
    // sessionStorage is meant to be forgotten when the page goes, so it is
    // given a store of its own that is never persisted. That is the correct
    // behaviour, not a shortcut.
    "Object.defineProperty(window,'sessionStorage',{value:make({},false),configurable:true});",
    '}catch(e){}',
    '})();',
  ].join('');
}

const SHIM_ID = '__codeit_storage__';

/**
 * Put the shim into a project, as early as the document allows.
 *
 * Order matters more here than for the editor bridge: the bridge can go at the
 * end of the body because nothing calls it until a child clicks something, but
 * a game reads its high score on the first line it runs.
 */
function injectPreviewStorage(html, seed = {}) {
  if (typeof html !== 'string' || !html) return html;
  if (html.includes(SHIM_ID)) return html;

  // Built from a constant rather than written literally, so this module can
  // never terminate a script block it happens to be inlined into.
  const closeTag = `<${'/'}script>`;
  const tag = `<script id="${SHIM_ID}">${storageShimScript(seed)}${closeTag}`;

  const head = html.match(/<head[^>]*>/i);
  if (head) return html.replace(head[0], head[0] + tag);

  const htmlTag = html.match(/<html[^>]*>/i);
  if (htmlTag) return html.replace(htmlTag[0], htmlTag[0] + tag);

  const body = html.match(/<body[^>]*>/i);
  if (body) return html.replace(body[0], body[0] + tag);

  // A fragment with no structure at all still gets storage.
  return tag + html;
}

/**
 * Take CodeIt's own scripts back out of a project.
 *
 * The preview serialises the live document when a child edits by hand, and that
 * document contains whatever we injected into it. Without this, every save
 * would bake the editor bridge and this shim — seed values and all — into the
 * child's project: their saved file would grow every time, and a published game
 * would hand every player the author's high score as their starting one.
 */
function stripPreviewScripts(html) {
  if (typeof html !== 'string' || !html) return html;
  return html.replace(
    /<script\s+id="(?:__codeit_storage__|__codeit_bridge__|__codeit_errors__)"[^>]*>[\s\S]*?<\/script>/gi,
    ''
  );
}

export {
  MAX_STORAGE_BYTES,
  STORAGE_MESSAGE,
  STORAGE_PREFIX,
  clearPreviewStorage,
  injectPreviewStorage,
  isStorageMessage,
  loadPreviewStorage,
  savePreviewStorage,
  storageKeyFor,
  storageShimScript,
  stripPreviewScripts,
};
