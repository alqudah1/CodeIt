// ── "Can you beat my score?" ────────────────────────────────────────────────
//
// The loop that brings a child's friends: a friend opens a shared game, sees
// the score to beat, plays, beats it, and sends the link back with theirs.
// No account, no names, nothing stored on a server: the score to beat rides in
// the link (?beat=42) and the score just made is read from the game itself.
//
// Reading the score. Games made in the studio do one of two things:
//   * the instant games post { type: 'CODEIT_WON' | 'CODEIT_LOST', score } to
//     the page, and new AI games are asked to post CODEIT_ROUND_END the same way;
//   * every game seen on Explore on 2 November 2026 also writes its score into
//     an element with "score" in its id (score-display, scoreLabel, finalScore,
//     final-score). The bridge below watches those and reports the highest
//     whole number it sees, skipping anything named best, high, record, target
//     or goal, which are not this round's score.
//
// The bridge runs inside the game's sandboxed frame (opaque origin) and only
// posts numbers out. It reads nothing from the page around it.

export const SCORE_MESSAGES = new Set(['CODEIT_SCORE', 'CODEIT_WON', 'CODEIT_LOST', 'CODEIT_ROUND_END']);
export const MAX_SCORE = 10_000_000;
const BRIDGE_ID = '__codeit_score_bridge';

/** A whole score from a message the game posted, or null. */
export function readScoreMessage(data) {
  if (!data || typeof data !== 'object' || !SCORE_MESSAGES.has(data.type)) return null;
  const n = Number(data.score);
  if (!Number.isFinite(n) || n < 0 || n > MAX_SCORE) return null;
  return Math.floor(n);
}

/** The score to beat from a link's query string, or null. */
export function scoreToBeat(search) {
  let raw = null;
  try { raw = new URLSearchParams(search || '').get('beat'); } catch { return null; }
  if (raw === null || !/^\d{1,8}$/.test(raw.trim())) return null;
  const n = Number(raw.trim());
  return n > 0 && n <= MAX_SCORE ? n : null;
}

/** The link to send: this page, with the score to beat when there is one. */
export function beatLink(path, origin, score, utmSource = 'project-share') {
  const url = new URL(path, origin);
  if (utmSource) url.searchParams.set('utm_source', utmSource);
  if (Number.isFinite(score) && score > 0) url.searchParams.set('beat', String(Math.floor(score)));
  return url.toString();
}

const BRIDGE_SCRIPT = `(function(){
  if (window.__codeitScore) return; window.__codeitScore = true;
  var best = 0, skip = /best|high|record|target|goal|max/i;
  function read(){
    var els = document.querySelectorAll('[id]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (!/score/i.test(el.id) || skip.test(el.id)) continue;
      var m = (el.textContent || '').replace(/,/g, '').match(/\\d+/);
      if (!m) continue;
      var n = parseInt(m[0], 10);
      if (n > best && n <= ${MAX_SCORE}) { best = n; try { window.parent.postMessage({ type: 'CODEIT_SCORE', score: n }, '*'); } catch (e) {} }
    }
  }
  var queued = false;
  function soon(){ if (queued) return; queued = true; setTimeout(function(){ queued = false; read(); }, 120); }
  function start(){ try { new MutationObserver(soon).observe(document.body, { subtree: true, childList: true, characterData: true }); } catch (e) {} }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();`;

/** The game's HTML with the bridge added at the end of the body. Idempotent. */
export function injectScoreBridge(html) {
  if (typeof html !== 'string' || !html || html.includes(BRIDGE_ID)) return html;
  const tag = `<script id="${BRIDGE_ID}">${BRIDGE_SCRIPT}<${'/'}script>`;
  const close = html.match(/<\/body>/i);
  if (close) return html.replace(close[0], tag + close[0]);
  return html + tag;
}
