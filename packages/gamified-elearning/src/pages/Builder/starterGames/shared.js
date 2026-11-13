// What every starter game is built with: the closing script tag, and the look
// they share. Each game is a file of its own beside this one, so that no one
// script file is large (a school filter was stopping large scripts).

// Built rather than written literally: `<\/script>` is a meaningless escape
// inside a template literal, and writing the tag whole would end this file's
// own script block if it were ever inlined into a page.
const CLOSE_SCRIPT = `<${'/'}script>`;

const SHARED_STYLE = `
  * { box-sizing: border-box; }
  body {
    margin: 0; overflow: hidden; touch-action: none;
    font-family: system-ui, -apple-system, sans-serif;
    color: #fff; user-select: none;
  }
  .hud {
    position: absolute; top: 0; left: 0; right: 0; z-index: 2;
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 16px; font-weight: 800; font-size: 17px;
    text-shadow: 0 2px 6px rgba(0,0,0,.45); pointer-events: none;
  }
  .hud span { background: rgba(0,0,0,.28); border-radius: 99px; padding: 6px 14px; }
  .over {
    position: absolute; inset: 0; z-index: 3; display: none;
    flex-direction: column; align-items: center; justify-content: center; gap: 14px;
    background: rgba(9,10,25,.82); backdrop-filter: blur(3px); text-align: center; padding: 24px;
  }
  .over h2 { margin: 0; font-size: 34px; }
  .over p { margin: 0; font-size: 18px; opacity: .9; }
  .over button {
    border: 0; border-radius: 14px; padding: 15px 30px;
    font-size: 19px; font-weight: 800; color: #241704;
    background: #FFD84D; cursor: pointer;
  }
  .tip {
    position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 2;
    margin: 0; padding: 7px 16px; border-radius: 99px;
    background: rgba(0,0,0,.42); font-size: 14px; opacity: .9; pointer-events: none;
    /* It used to be white-space: nowrap, and three of the eleven starter
       games scrolled sideways on a phone because of it: maze at 422px,
       cat-chase at 413px and whack at 406px, on a 390px screen. The hint is
       centred with translateX(-50%), so a line it cannot break pushes past
       both edges and drags the whole page with it. The longest three tips
       measure 455, 436 and 422 pixels. Every tip is short enough to stay on
       one line on any normal screen, so this only ever fires where it has
       to. */
    max-width: calc(100% - 24px);
    text-align: center;
    /* Gets out of the way on its own. A first-time hint that never leaves ends
       up sitting on top of the game. In the catch game it printed straight
       across the basket. */
    animation: fadeTip .8s 3s forwards;
  }
  @keyframes fadeTip { to { opacity: 0; } }
`;

export { CLOSE_SCRIPT, SHARED_STYLE };
