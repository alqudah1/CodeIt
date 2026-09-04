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
  check: (
    <path d="M5.5 12.5l4 4 9-9.5" fill="none" />
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
  medal1: (
    <>
      <path d="M8.4 3.5 12 9.4 15.6 3.5" fill="none" />
      <circle cx="12" cy="15" r="6.2" fill={SUN} />
      <path d="M11 12.4h1.4v5.2" fill="none" />
    </>
  ),
  medal2: (
    <>
      <path d="M8.4 3.5 12 9.4 15.6 3.5" fill="none" />
      <circle cx="12" cy="15" r="6.2" fill="#D9DDE3" />
      <path d="M10.2 13.4a1.8 1.8 0 0 1 3.4.9c0 1.4-3.4 2-3.4 3.3h3.6" fill="none" />
    </>
  ),
  medal3: (
    <>
      <path d="M8.4 3.5 12 9.4 15.6 3.5" fill="none" />
      <circle cx="12" cy="15" r="6.2" fill="#E0A26B" />
      <path d="M10.3 13.2a1.7 1.7 0 1 1 1.4 2.6 1.7 1.7 0 1 1-1.4 2.6" fill="none" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.4" fill={PAPER} />
      <circle cx="12" cy="12" r="4.8" fill={ORANGE} />
      <circle cx="12" cy="12" r="1.6" fill={PAPER} />
    </>
  ),
  sprout: (
    <>
      <path d="M12 20.5v-6.4" fill="none" />
      <path d="M12 14.1C12 11 9.8 8.8 6.6 8.8c0 3.1 2.2 5.3 5.4 5.3Z" fill={MINT} />
      <path d="M12 14.1c0-3.4 2.4-5.8 5.8-5.8 0 3.4-2.4 5.8-5.8 5.8Z" fill={MINT} />
    </>
  ),
  moon: (
    <path d="M20 14.4A8.4 8.4 0 0 1 9.6 4a8.5 8.5 0 1 0 10.4 10.4Z" fill={VIOLET} />
  ),
  bolt: (
    <path d="M13.6 2.8 5.6 13.4h5.2l-1.4 7.8 8.2-10.8h-5.2Z" fill={SUN} />
  ),
  ball: (
    <>
      <circle cx="12" cy="12" r="8.4" fill={PAPER} />
      <path d="M12 7.4 15.4 9.9 14.1 13.9H9.9L8.6 9.9Z" fill={INK} stroke="none" />
      <path d="M12 3.6v3.8M4.4 10.2 8.6 9.9M19.6 10.2 15.4 9.9M8 19.6l1.9-5.7M16 19.6l-1.9-5.7" fill="none" />
    </>
  ),
  paw: (
    <>
      <ellipse cx="8" cy="8.6" rx="1.9" ry="2.4" fill={ORANGE} />
      <ellipse cx="12.6" cy="7.4" rx="1.9" ry="2.4" fill={ORANGE} />
      <ellipse cx="17" cy="9.6" rx="1.9" ry="2.3" fill={ORANGE} />
      <path d="M12 12.4c3 0 5 2 5 4.2 0 2-1.7 3.3-3.6 2.9-1-.2-1.8-.2-2.8 0-1.9.4-3.6-.9-3.6-2.9 0-2.2 2-4.2 5-4.2Z" fill={SUN} />
    </>
  ),
  shop: (
    <>
      <path d="M4.4 8.6h15.2l-1.2 11.2H5.6Z" fill={SUN} />
      <path d="M8.8 8.6V6.4a3.2 3.2 0 0 1 6.4 0v2.2" fill="none" />
    </>
  ),
  // The eleven starter games. These are the first pictures a child meets, so
  // they are pictures rather than labels: a rocket, a balloon, a cat.
  rocket: (
    <>
      <path d="M12 2.6c3.1 2.4 4.8 6 4.8 9.9L12 17.4l-4.8-4.9c0-3.9 1.7-7.5 4.8-9.9Z" fill={PAPER} />
      <circle cx="12" cy="10" r="2.1" fill={VIOLET} />
      <path d="M7.2 12.5 4.6 15v3.4l3.2-2M16.8 12.5 19.4 15v3.4l-3.2-2" fill={ORANGE} />
      <path d="M10.3 18.4 12 21.6l1.7-3.2" fill={SUN} />
    </>
  ),
  balloon: (
    <>
      <path d="M12 3.2c3.3 0 5.6 2.5 5.6 5.8 0 3.7-3.4 6.6-5.6 6.6S6.4 12.7 6.4 9C6.4 5.7 8.7 3.2 12 3.2Z" fill="#F0698E" />
      <path d="M12 15.6 11 17.4h2Z" fill={INK} stroke="none" />
      <path d="M12 17.6c1.6 1.4-1.6 2.2 0 3.6" fill="none" />
    </>
  ),
  snake: (
    <>
      <path d="M5 17.4h7.6a3.2 3.2 0 0 0 0-6.4H9.4a3.2 3.2 0 0 1 0-6.4H17" fill="none" strokeWidth="2.6" />
      <circle cx="18.4" cy="4.6" r="2" fill={MINT} />
      <circle cx="19" cy="4.2" r="0.5" fill={INK} stroke="none" />
    </>
  ),
  bricks: (
    <>
      <rect x="3.4" y="5" width="7.6" height="4.6" rx="1" fill={ORANGE} />
      <rect x="13" y="5" width="7.6" height="4.6" rx="1" fill={SUN} />
      <rect x="3.4" y="11.4" width="7.6" height="4.6" rx="1" fill={SUN} />
      <rect x="13" y="11.4" width="7.6" height="4.6" rx="1" fill={ORANGE} />
      <circle cx="12" cy="20" r="2.2" fill={PAPER} />
    </>
  ),
  runner: (
    <>
      <circle cx="14.4" cy="5.2" r="2.2" fill={SUN} />
      <path d="M13.6 9 9.8 11.4l1.6 3.4-2.2 5" fill="none" />
      <path d="M11.4 14.8 15.6 15l1.6 4.8" fill="none" />
      <path d="M13.6 9.4 17.8 11" fill="none" />
      <path d="M4.6 10.6h3.2M3.6 14h2.6" fill="none" />
    </>
  ),
  puzzle: (
    <path d="M9.6 3.6h4.8v2a1.8 1.8 0 1 0 3.6 0v-2h2.4v16.8H4.6V3.6h2.4v2a1.8 1.8 0 1 0 2.6 0Z" fill={VIOLET} />
  ),
  mallet: (
    <>
      <rect x="4.4" y="4.4" width="11" height="6.4" rx="2" fill={ORANGE} transform="rotate(-16 9.9 7.6)" />
      <path d="M11 11.6 18.6 20" fill="none" strokeWidth="2.4" />
    </>
  ),
  cat: (
    <>
      <path d="M5.6 9.6 6 4.6l4 3.1a8.6 8.6 0 0 1 4 0l4-3.1.4 5A7.4 7.4 0 0 1 20 14c0 4-3.6 6.6-8 6.6S4 18 4 14a7.4 7.4 0 0 1 1.6-4.4Z" fill={SUN} />
      <circle cx="9.6" cy="13.4" r="0.9" fill={INK} stroke="none" />
      <circle cx="14.4" cy="13.4" r="0.9" fill={INK} stroke="none" />
      <path d="M12 15.4v1.2M10.6 17.4h2.8" fill="none" />
    </>
  ),
  // The starter quizzes and websites.
  maths: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" fill={PAPER} />
      <path d="M7.4 9.2h4M9.4 7.2v4" fill="none" />
      <path d="M13 9.2h3.6" fill="none" />
      <path d="M7.6 15.2h4M13 14h3.6M13 16.6h3.6" fill="none" />
    </>
  ),
  crystal: (
    <>
      <path d="M12 3.4 18 9.2 12 20.6 6 9.2Z" fill={VIOLET} />
      <path d="M6 9.2h12M12 3.4 9.4 9.2 12 20.6 14.6 9.2Z" fill="none" />
    </>
  ),
  cupcake: (
    <>
      <path d="M6.6 11.4h10.8L16 20.4H8Z" fill={PAPER} />
      <path d="M6 11.4c0-3.2 2.7-5.6 6-5.6s6 2.4 6 5.6Z" fill="#F0698E" />
      <path d="M12 3.2v2.2" fill="none" />
    </>
  ),
  shoe: (
    <>
      <path d="M3.6 16.6c0-1.6.8-2.6 2.4-3.2l3.4-1.4 2.2-3.4 3 1.6-.6 2.4 5.4 2.6c.8.4 1 1 1 1.8v2.2H3.6Z" fill={MINT} />
      <path d="M8 15.2l1.6 1.4M11 14l1.6 1.4M14 13.4l1.6 1.4" fill="none" />
    </>
  ),
  dog: (
    <>
      <path d="M6.4 6.4 5 11.6c0 4 3.1 6.6 7 6.6s7-2.6 7-6.6L17.6 6.4l-3 2.4a8.6 8.6 0 0 0-5.2 0Z" fill="#C98A52" />
      <circle cx="9.8" cy="12.6" r="0.9" fill={INK} stroke="none" />
      <circle cx="14.2" cy="12.6" r="0.9" fill={INK} stroke="none" />
      <path d="M12 14.6v1.4" fill="none" />
    </>
  ),
  thread: (
    <>
      <circle cx="12" cy="12" r="8.2" fill="#F0698E" />
      <path d="M6.4 8.4c3.4 1 6.8 3.4 9 6.8M8.4 5.6c3.6 1.6 6.8 4.6 8.6 8.4M5.6 12.4c2.6 1 5 2.8 6.6 5.2" fill="none" />
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
