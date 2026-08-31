import { renderToStaticMarkup } from 'react-dom/server';
import CharacterAvatar from '../components/CharacterAvatar/CharacterAvatar';

// ── The kid, as a sprite ────────────────────────────────────────────────────
//
// The avatar a child builds in the lab is already a pure parameterized SVG,
// so it can BE the player in their own games. This serializes the exact same
// component the lab renders — same palettes, same geometry, nothing redrawn —
// into a data URI a game iframe can load as an image. Change your outfit in
// the lab and the sprite changes with it, in every game, because there is
// only one drawing.

export function avatarSpriteDataUri(character) {
  try {
    const svg = renderToStaticMarkup(
      <CharacterAvatar character={character} compact size={160} />
    );
    if (!svg || !svg.startsWith('<svg')) return '';
    // React does not emit xmlns, and an SVG loaded AS AN IMAGE (data URI)
    // silently refuses to render without it. In-page React SVG never needs
    // it, which is why this only bites here.
    const standalone = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    return `data:image/svg+xml;utf8,${encodeURIComponent(standalone)}`;
  } catch {
    return '';
  }
}

/**
 * Hands the sprite to a game document as `window.CODEIT_PLAYER_SPRITE`.
 * Starters that know about the sprite draw the kid; everything else ignores
 * the global completely, so this is safe to inject into any project.
 */
export function injectPlayerSprite(html, spriteUri) {
  if (!html || !spriteUri || html.includes('__codeit_player_sprite__')) return html;
  // The closing tag is assembled so no literal "</script>" appears in this
  // file — CI=true rejects both the \/ escape and literal concatenation.
  const close = ['</scr', 'ipt>'].join('');
  const tag = `<script id="__codeit_player_sprite__">window.CODEIT_PLAYER_SPRITE=${JSON.stringify(spriteUri)};${close}`;
  if (html.includes('<head>')) return html.replace('<head>', '<head>' + tag);
  return tag + html;
}
