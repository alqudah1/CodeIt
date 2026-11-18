// A game nobody is playing starts again by itself.
//
// Two places show a child's game running with nobody at the controls: the
// game beside the code on a power page, before the child has touched it, and
// the small live screen above the code in the studio, which cannot be touched
// at all. Left alone, the ship is hit three times in about ten seconds and
// the frame shows "Game over. Play again" from then on. Seen 18 November
// 2026: a child opening their first power was met by Game over on a game they
// had not played, and the live screen in the studio was a Game over card for
// most of the time a child spent reading a line of code.
//
// The games already say when they end: they post CODEIT_LOST or CODEIT_WON to
// the page (recipeGame.js). When that comes from the frame being watched, and
// the child is not in it (a frame that was tapped or clicked has the focus),
// the frame is started again a moment later. A child who is playing keeps
// their Game over and their own Play again.
import { useEffect } from 'react';

const ENDED = new Set(['CODEIT_LOST', 'CODEIT_WON']);

/** Long enough to see that the game ended, short enough that it is not what the frame mostly shows. */
export const REPLAY_AFTER_MS = 900;

/**
 * @param {{ current: HTMLIFrameElement | null }} frameRef  the frame to watch
 * @param {() => void} replay  start it again (must keep its identity between renders)
 */
export function useKeepPlaying(frameRef, replay) {
  useEffect(() => {
    let timer = null;
    const playing = () => Boolean(frameRef.current) && document.activeElement === frameRef.current;
    const onMessage = (event) => {
      const frame = frameRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      if (!ENDED.has(event.data && event.data.type) || playing()) return;
      clearTimeout(timer);
      timer = setTimeout(() => { if (!playing()) replay(); }, REPLAY_AFTER_MS);
    };
    window.addEventListener('message', onMessage);
    return () => { window.removeEventListener('message', onMessage); clearTimeout(timer); };
  }, [frameRef, replay]);
}
