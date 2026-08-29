// ── Hand-drawn stickers for the Paper Arcade ─────────────────────────────────
//
// Inline SVG, drawn in the design language itself: ink outlines (#35220E),
// arcade fills, a white sticker rim so each one sits on the page like
// something peeled from a sheet. Inline because it costs no request, scales
// crisp on every screen, and can never load after the layout does.
//
// Every sticker is decorative: aria-hidden, with the words carried by the
// text beside it.

const INK = '#35220E';
const PAPER = '#FFFFFF';

const Sticker = ({ children, size = 44, viewBox = '0 0 48 48', tilt = -4, className = '' }) => (
  <svg
    className={`arcade-sticker ${className}`}
    width={size}
    height={size}
    viewBox={viewBox}
    aria-hidden="true"
    focusable="false"
    style={{ transform: `rotate(${tilt}deg)` }}
  >
    {children}
  </svg>
);

/** An arcade cabinet, for the games shelf. */
export const CabinetSticker = ({ size, tilt }) => (
  <Sticker size={size} tilt={tilt ?? -5}>
    <g stroke={INK} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M10 6 h28 l3 12 v22 a3 3 0 0 1 -3 3 H10 a3 3 0 0 1 -3 -3 V18 Z" fill="#FF7A00" />
      <rect x="13" y="12" width="22" height="14" rx="2.5" fill="#3D2B75" />
      <circle cx="20" cy="19" r="2.4" fill="#FED340" stroke="none" />
      <circle cx="28" cy="17" r="1.7" fill="#7ADFB1" stroke="none" />
      <circle cx="18" cy="34" r="3" fill="#FED340" />
      <circle cx="30" cy="34" r="3" fill="#7ADFB1" />
    </g>
  </Sticker>
);

/** A quiz card with a big tick, for the quizzes shelf. */
export const QuizSticker = ({ size, tilt }) => (
  <Sticker size={size} tilt={tilt ?? 4}>
    <g stroke={INK} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
      <rect x="8" y="7" width="32" height="36" rx="4" fill="#8A6FF0" />
      <rect x="13" y="13" width="22" height="6" rx="2" fill={PAPER} />
      <rect x="13" y="24" width="14" height="4.5" rx="2" fill="#FED340" stroke="none" />
      <rect x="13" y="32" width="14" height="4.5" rx="2" fill={PAPER} stroke="none" />
      <path d="M30 30.5 l3.5 4 l6 -7" stroke="#FED340" strokeWidth="3.4" fill="none" />
    </g>
  </Sticker>
);

/** A little storefront, for the websites-that-sell shelf. */
export const ShopSticker = ({ size, tilt }) => (
  <Sticker size={size} tilt={tilt ?? -4}>
    <g stroke={INK} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
      <rect x="9" y="20" width="30" height="21" rx="2.5" fill="#FFF4E5" />
      <path d="M7 20 l4 -10 h26 l4 10 Z" fill="#7ADFB1" />
      <path d="M13 10 v10 M20 10 v10 M28 10 v10 M35 10 v10" strokeWidth="1.8" />
      <rect x="14" y="26" width="8" height="15" fill="#FF7A00" />
      <rect x="26" y="26" width="8" height="8" rx="1.5" fill="#8A6FF0" />
    </g>
  </Sticker>
);

/** A game controller, for the Build-a-Game card. */
export const ControllerSticker = ({ size, tilt }) => (
  <Sticker size={size} tilt={tilt ?? -6}>
    <g stroke={INK} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M14 14 h20 c7 0 10 6 10 12 c0 7 -4 10 -7 10 c-3 0 -5 -4 -8 -4 h-10 c-3 0 -5 4 -8 4 c-3 0 -7 -3 -7 -10 c0 -6 3 -12 10 -12 Z" fill="#FF7A00" />
      <path d="M18 21 v8 M14 25 h8" strokeWidth="2.8" />
      <circle cx="31" cy="22" r="2.2" fill="#FED340" stroke="none" />
      <circle cx="35" cy="27" r="2.2" fill="#7ADFB1" stroke="none" />
    </g>
  </Sticker>
);

/** A browser window with blocks, for the Build-a-Website card. */
export const BrowserSticker = ({ size, tilt }) => (
  <Sticker size={size} tilt={tilt ?? 4}>
    <g stroke={INK} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
      <rect x="7" y="9" width="34" height="30" rx="3.5" fill={PAPER} />
      <path d="M7 17 h34" />
      <circle cx="12.5" cy="13" r="1.5" fill="#FF7A00" stroke="none" />
      <circle cx="17.5" cy="13" r="1.5" fill="#FED340" stroke="none" />
      <circle cx="22.5" cy="13" r="1.5" fill="#7ADFB1" stroke="none" />
      <rect x="12" y="22" width="11" height="12" rx="2" fill="#7ADFB1" />
      <rect x="27" y="22" width="9" height="5" rx="1.5" fill="#FED340" stroke="none" />
      <rect x="27" y="30" width="9" height="4" rx="1.5" fill="#8A6FF0" stroke="none" />
    </g>
  </Sticker>
);

/** A thought bubble with a question mark, for the Build-a-Quiz card. */
export const QuestionSticker = ({ size, tilt }) => (
  <Sticker size={size} tilt={tilt ?? -4}>
    <g stroke={INK} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M24 7 c10 0 17 6 17 14 c0 8 -7 14 -17 14 c-2 0 -4 -0.3 -5.5 -0.8 L11 38 l1.8 -7 C9.5 28.6 7 25.2 7 21 C7 13 14 7 24 7 Z" fill="#8A6FF0" />
      <path d="M19.5 18 c0 -3 2 -4.7 4.7 -4.7 c2.6 0 4.4 1.6 4.4 4 c0 3.6 -4.3 3.6 -4.3 6.6" stroke={PAPER} strokeWidth="3" fill="none" />
      <circle cx="24.2" cy="28.6" r="1.9" fill="#FED340" stroke="none" />
    </g>
  </Sticker>
);
