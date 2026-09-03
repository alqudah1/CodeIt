import React from 'react';

// ── The icon set ─────────────────────────────────────────────────────────────
//
// Every icon in the interface used to be an emoji: 🎨 on the colours panel, 💾
// on Save, 👆 on Show me, 🎮 on a saved game. Emoji are the loudest signal a
// product has that it was assembled quickly. They are drawn by whoever made the
// device, so the same button is a different picture on a phone, a Mac and a
// school Chromebook, they carry none of our colours, and they cannot be sized,
// aligned or trusted. No company anyone pays money to ships them as its icons.
//
// These are drawn in the Paper Arcade language that ArcadeArt.js already
// established: ink outlines, arcade fills, round joins, no gradients. Same
// stroke weight and same 24-unit grid, so a row of them lines up.
//
// Rules for adding one:
//   1. It is decorative. The word beside it carries the meaning, and every icon
//      is aria-hidden, so a screen reader never announces "palette" where the
//      button says "Change colours".
//   2. It reads at 18px. Anything that needs more than five shapes to be
//      recognised is the wrong idea for an icon.
//   3. Ink is the outline, never a fill on its own: these sit on warm paper,
//      and a solid black shape punches a hole in the page.
const INK = '#35220E';
const ORANGE = '#F87824';
const SUN = '#FED340';
const MINT = '#27AE7E';
const VIOLET = '#7B5CD6';
const PAPER = '#FFFDF7';

const paths = {
  // Making and changing
  palette: (
    <>
      <path d="M12 3.5c-4.7 0-8.5 3.6-8.5 8.2 0 4.6 3.8 8.3 8.5 8.3 1.5 0 2.2-1 2.2-1.9 0-1.5-1.4-1.6-1.4-2.9 0-1 .8-1.7 1.9-1.7h1.6c2.6 0 4.2-1.9 4.2-4.4C20.5 6.4 16.7 3.5 12 3.5Z" fill={SUN} />
      <circle cx="8" cy="9" r="1.4" fill={ORANGE} stroke="none" />
      <circle cx="12.5" cy="7.2" r="1.4" fill={VIOLET} stroke="none" />
      <circle cx="16.5" cy="9.6" r="1.4" fill={MINT} stroke="none" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.2 13.9 9 19.8 10.9 13.9 12.8 12 18.7 10.1 12.8 4.2 10.9 10.1 9Z" fill={SUN} />
      <path d="M18 15.5 18.9 18 21.4 18.9 18.9 19.8 18 22.3 17.1 19.8 14.6 18.9 17.1 18Z" fill={ORANGE} />
    </>
  ),
  text: (
    <>
      <path d="M4 7V5h16v2" fill="none" />
      <path d="M12 5v14" fill="none" />
      <path d="M9 19h6" fill="none" />
    </>
  ),
  pen: (
    <>
      <path d="M4 20l1-4.2L15.2 5.6a2 2 0 0 1 2.8 0l1.4 1.4a2 2 0 0 1 0 2.8L9.2 20 5 21Z" fill={SUN} />
      <path d="M14.2 6.8 17.9 10.5" fill="none" />
    </>
  ),
  image: (
    <>
      <rect x="3.2" y="5" width="17.6" height="14" rx="2.4" fill={PAPER} />
      <circle cx="8.6" cy="10" r="1.7" fill={SUN} />
      <path d="M4.5 17.4 9.6 12.6l3.2 3 2.6-2.3 4.1 4.1" fill={MINT} />
    </>
  ),
  tag: (
    <>
      <path d="M11.4 3.6H20v8.6l-8.4 8.4a2 2 0 0 1-2.8 0l-5.8-5.8a2 2 0 0 1 0-2.8Z" fill={MINT} />
      <circle cx="16.3" cy="7.7" r="1.5" fill={PAPER} />
    </>
  ),
  wand: (
    <>
      <path d="M5 19 15.6 8.4a1.7 1.7 0 0 1 2.4 0l.6.6a1.7 1.7 0 0 1 0 2.4L8 22Z" fill={VIOLET} />
      <path d="M6.5 4.5 7.3 6.8 9.6 7.6 7.3 8.4 6.5 10.7 5.7 8.4 3.4 7.6 5.7 6.8Z" fill={SUN} />
    </>
  ),

  // Doing and testing
  hand: (
    <>
      <path d="M10 11V5.6a1.8 1.8 0 0 1 3.6 0V11" fill={SUN} />
      <path d="M13.6 11.4V9.8a1.6 1.6 0 0 1 3.2 0v1.8" fill={SUN} />
      <path d="M16.8 12v-.6a1.6 1.6 0 0 1 3.2 0v4.2c0 3-2.2 5.4-5.4 5.4h-2c-2 0-3.2-1-4.2-2.6L5 13.8a1.6 1.6 0 0 1 2.7-1.7L10 15" fill={SUN} />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3.5h5M10.5 3.5v6L5.8 17.6A2.2 2.2 0 0 0 7.7 21h8.6a2.2 2.2 0 0 0 1.9-3.4L13.5 9.5v-6" fill={MINT} />
      <path d="M8 15.6h8" fill="none" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="8.6" fill={ORANGE} />
      <path d="M10.2 8.6 16 12l-5.8 3.4Z" fill={PAPER} />
    </>
  ),
  save: (
    <>
      <path d="M4.5 4.5h11.6L19.5 8v11.5h-15Z" fill={VIOLET} />
      <rect x="8" y="4.5" width="7" height="5" rx="1" fill={PAPER} />
      <rect x="7.5" y="13" width="9" height="6.5" rx="1" fill={PAPER} />
    </>
  ),
  search: (
    <>
      <circle cx="10.6" cy="10.6" r="6.1" fill={PAPER} />
      <path d="M15.2 15.2 20.5 20.5" fill="none" />
    </>
  ),
  trash: (
    <>
      <path d="M4.8 6.6h14.4" fill="none" />
      <path d="M9.4 6.6V4.9h5.2v1.7" fill="none" />
      <path d="M6.5 6.6 7.4 20h9.2l.9-13.4" fill={PAPER} />
      <path d="M10.4 10.2v6M13.6 10.2v6" fill="none" />
    </>
  ),
  lock: (
    <>
      <rect x="4.6" y="10.4" width="14.8" height="9.6" rx="2.2" fill={SUN} />
      <path d="M8.2 10.4V8a3.8 3.8 0 0 1 7.6 0v2.4" fill="none" />
      <circle cx="12" cy="15" r="1.5" fill={INK} stroke="none" />
    </>
  ),

  // Saying and showing
  chat: (
    <>
      <path d="M4 6.4A2.4 2.4 0 0 1 6.4 4h11.2A2.4 2.4 0 0 1 20 6.4v7.2a2.4 2.4 0 0 1-2.4 2.4H10l-4.6 3.6v-3.6H6.4A2.4 2.4 0 0 1 4 13.6Z" fill={PAPER} />
      <circle cx="9" cy="10" r="1.1" fill={ORANGE} stroke="none" />
      <circle cx="12" cy="10" r="1.1" fill={ORANGE} stroke="none" />
      <circle cx="15" cy="10" r="1.1" fill={ORANGE} stroke="none" />
    </>
  ),
  speaker: (
    <>
      <path d="M4.5 9.4h3.2L12 5.4v13.2l-4.3-4H4.5Z" fill={SUN} />
      <path d="M15 9.2a4 4 0 0 1 0 5.6M17.6 6.8a7.4 7.4 0 0 1 0 10.4" fill="none" />
    </>
  ),
  mute: (
    <>
      <path d="M4.5 9.4h3.2L12 5.4v13.2l-4.3-4H4.5Z" fill={PAPER} />
      <path d="M15.4 9.6 20 14.2M20 9.6 15.4 14.2" fill="none" />
    </>
  ),
  wave: (
    <>
      <circle cx="12" cy="8" r="3.6" fill={SUN} />
      <path d="M5 20.5c0-3.6 3.1-6 7-6s7 2.4 7 6" fill={MINT} />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4.5h10v5a5 5 0 0 1-10 0Z" fill={SUN} />
      <path d="M7 6H4.6v1.6A3.4 3.4 0 0 0 7 10.8M17 6h2.4v1.6a3.4 3.4 0 0 1-2.4 3.2" fill="none" />
      <path d="M10.4 14.4h3.2l.6 3.1h2.3V20H7.5v-2.5h2.3Z" fill={ORANGE} />
    </>
  ),
  star: (
    <path d="M12 3.4 14.5 9l6.1.6-4.6 4.1 1.3 6-5.3-3.1-5.3 3.1 1.3-6L3.4 9.6 9.5 9Z" fill={SUN} />
  ),
  party: (
    <>
      <path d="M4 20.5 9.2 8.7 15.3 14.8Z" fill={ORANGE} />
      <path d="M14 4.5v2.2M18.6 6.2l-1.5 1.6M20 11.4h-2.2" fill="none" />
      <circle cx="15.8" cy="10.4" r="1.2" fill={MINT} stroke="none" />
    </>
  ),
  cross: (
    <>
      <circle cx="12" cy="12" r="8.6" fill="#F1948A" />
      <path d="M9 9l6 6M15 9l-6 6" fill="none" />
    </>
  ),

  // What a project is
  game: (
    <>
      <rect x="2.8" y="7.2" width="18.4" height="10.4" rx="4.4" fill={ORANGE} />
      <path d="M7.6 10.6v3.6M5.8 12.4h3.6" fill="none" />
      <circle cx="16" cy="11.6" r="1.3" fill={SUN} stroke="none" />
      <circle cx="18.2" cy="14" r="1.3" fill={MINT} stroke="none" />
    </>
  ),
  quiz: (
    <>
      <rect x="4.4" y="3.6" width="15.2" height="16.8" rx="2.6" fill={VIOLET} />
      <path d="M9.4 9.2a2.6 2.6 0 1 1 3.2 2.6v1.4" stroke={PAPER} fill="none" />
      <circle cx="12.4" cy="16.2" r="1.2" fill={SUN} stroke="none" />
    </>
  ),
  site: (
    <>
      <rect x="3.2" y="4.6" width="17.6" height="14.8" rx="2.4" fill={PAPER} />
      <path d="M3.2 9h17.6" fill="none" />
      <circle cx="6.2" cy="6.8" r="0.9" fill={ORANGE} stroke="none" />
      <rect x="6" y="11.6" width="7" height="5.4" rx="1.2" fill={MINT} stroke="none" />
      <path d="M14.8 12.4h3.4M14.8 15h3.4" fill="none" />
    </>
  ),
  tool: (
    <>
      <path d="M14.4 3.6a5 5 0 0 0-4.6 6.9L3.9 16.4a2 2 0 0 0 2.8 2.8l5.9-5.9a5 5 0 0 0 6.9-4.6c0-.8-.2-1.5-.5-2.2l-3 3-2.6-2.6 3-3a5 5 0 0 0-2-.3Z" fill={MINT} />
    </>
  ),
  book: (
    <>
      <path d="M4 5.2c2.6-1 5.3-1 8 0v14c-2.7-1-5.4-1-8 0Z" fill={PAPER} />
      <path d="M12 5.2c2.7-1 5.4-1 8 0v14c-2.6-1-5.3-1-8 0Z" fill={SUN} />
    </>
  ),
};

/**
 * One icon.
 *
 * @param name  a key of `paths`
 * @param size  pixels, square. 18 in a button, 22 in a panel legend, 28 and up
 *              as a picture in its own right.
 */
export default function Icon({ name, size = 20, className = '', strokeWidth = 1.7 }) {
  const shape = paths[name];
  // An unknown name draws nothing rather than throwing: an icon is decoration,
  // and a typo in decoration must never take a page down. Round 73 was one null
  // read in a component body.
  if (!shape) return null;
  return (
    <svg
      className={`ci-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ flex: '0 0 auto', display: 'inline-block', verticalAlign: '-0.15em' }}
    >
      <g
        stroke={INK}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      >
        {shape}
      </g>
    </svg>
  );
}

export const ICON_NAMES = Object.keys(paths);
