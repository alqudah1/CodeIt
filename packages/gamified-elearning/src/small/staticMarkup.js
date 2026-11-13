// react-dom/server, for the small-files version of CodeIt (see scripts/build.js).
//
// The studio and the build page turn the pupil's avatar into a picture while
// they are being drawn: avatarSpriteDataUri() is called inside a useMemo. In
// React that is fine. In Preact, which the small-files version uses, drawing
// one thing to text in the middle of drawing another makes the outer page
// forget which component it was in, and its next hook throws ("Cannot read
// properties of null"). The first run of the studio in that version found it.
//
// So while the avatar is turned into text, Preact's between-component
// callbacks are unplugged, and plugged back afterwards. The one that tidies
// attribute names (options.vnode) stays, because the text needs it. What is
// drawn this way must not use hooks itself; the avatar does not.
import { options } from 'preact';
import { renderToStaticMarkup as toMarkup, renderToString as toString } from 'preact-render-to-string';

function quietly(render, element) {
  const kept = {};
  for (const key of Object.keys(options)) {
    if (key === 'vnode' || typeof options[key] !== 'function') continue;
    kept[key] = options[key];
    options[key] = undefined;
  }
  try {
    return render(element);
  } finally {
    Object.assign(options, kept);
  }
}

export function renderToStaticMarkup(element) {
  return quietly(toMarkup, element);
}

export function renderToString(element) {
  return quietly(toString, element);
}

const server = { renderToStaticMarkup, renderToString };
export default server;
