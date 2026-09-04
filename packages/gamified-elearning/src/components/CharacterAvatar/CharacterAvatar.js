import React from 'react';
import './CharacterAvatar.css';

// ── The character ────────────────────────────────────────────────────────────
//
// This drawing is the most distinctive asset in the product. It is the player
// inside the child's game and it travels with every project they share, and
// for a long time it was a flat blue rectangle with a circle on top: a
// placeholder that never got replaced. "Make a character and it becomes the
// player in your game" is a promise the picture has to keep.
//
// What changed, and why:
//
//   a body, not a rectangle   neck, shoulders, a waist, hands. Two body shapes.
//   hair with a silhouette    five styles that read as five different people
//                             from across a room, not five colours of one hat.
//   outfits with a detail     a visor ring, a strap and pocket, hoodie strings,
//                             an apron and beret: one thing each, big enough
//                             to survive shrinking.
//   accessories with character
//   it reads at 32px          that is its size in a game. So: ink outlines on
//                             every shape, no gradients, no drop-shadow filter,
//                             nothing thinner than four units on a 240 canvas.
//
// Same parameters as before (skinTone, hairStyle, hairColor, outfit, accent,
// expression, gender), same palettes, same compact prop, so the lab, the
// header, the sprite and the home page all keep working. There is no
// background: the character sits on whatever it is placed on.

const INK = '#2b1b18';

const skinPalette = {
  sunset: '#f6c7a3',
  sand: '#ebb190',
  cocoa: '#c88762',
  deep: '#8d5238',
  pearl: '#f4ddd0',
};

const hairPalette = {
  mocha: '#4b2e2b',
  midnight: '#1d1a39',
  copper: '#c6643d',
  gold: '#f6c06b',
  ocean: '#2b7de9',
  lavender: '#8660c1',
};

const outfitPalette = {
  astronaut: { primary: '#4051db', secondary: '#2334a0', accent: '#f5f6ff' },
  explorer: { primary: '#f28b50', secondary: '#d76a30', accent: '#fdf0e3' },
  hacker: { primary: '#20a372', secondary: '#137759', accent: '#ebfff8' },
  artist: { primary: '#9c4dcc', secondary: '#6f31a1', accent: '#f4e8ff' },
};

const accentPalette = {
  headphones: '#ffcf5c',
  glasses: '#1f4f8a',
  cape: '#ff6d8f',
  none: 'transparent',
};

// ── Body ─────────────────────────────────────────────────────────────────────
// Two silhouettes. Shoulders, a neck, a waist, and hands. The head sits at
// (120, 92) with radius 52 in both.
const bodies = {
  female: {
    neck: 'M106 136 L134 136 L134 154 L106 154 Z',
    torso: 'M86 156 C96 148 144 148 154 156 C168 162 176 176 176 196 L172 240 L68 240 L64 196 C64 176 72 162 86 156 Z',
    leftArm: 'M70 172 C50 182 44 206 52 226',
    rightArm: 'M170 172 C190 182 196 206 188 226',
    leftHand: { cx: 52, cy: 230 },
    rightHand: { cx: 188, cy: 230 },
  },
  male: {
    neck: 'M104 136 L136 136 L136 154 L104 154 Z',
    torso: 'M80 156 C92 146 148 146 160 156 C178 162 186 178 186 198 L180 240 L60 240 L54 198 C54 178 62 162 80 156 Z',
    leftArm: 'M62 172 C42 184 36 208 44 228',
    rightArm: 'M178 172 C198 184 204 208 196 228',
    leftHand: { cx: 44, cy: 232 },
    rightHand: { cx: 196, cy: 232 },
  },
};

// ── Outfit details: one recognisable thing each ───────────────────────────────
const outfitDetails = {
  astronaut: (p) => (
    <>
      {/* collar ring and a chest badge */}
      <path d="M92 158 C104 170 136 170 148 158" fill="none" stroke={p.accent} strokeWidth="8" strokeLinecap="round" />
      <circle cx="120" cy="196" r="12" fill={p.accent} stroke={INK} strokeWidth="4" />
      <circle cx="120" cy="196" r="4" fill={p.secondary} />
    </>
  ),
  explorer: (p) => (
    <>
      {/* a strap across the chest and a pocket */}
      <path d="M92 160 L150 236" stroke={p.secondary} strokeWidth="12" strokeLinecap="round" />
      <path d="M92 160 L150 236" stroke={p.accent} strokeWidth="4" strokeLinecap="round" strokeDasharray="1 14" />
      <rect x="74" y="200" width="30" height="24" rx="4" fill={p.accent} stroke={INK} strokeWidth="4" />
    </>
  ),
  hacker: (p) => (
    <>
      {/* hoodie: a hood behind the neck and two strings */}
      <path d="M86 156 C96 132 144 132 154 156" fill={p.secondary} stroke={INK} strokeWidth="5" />
      <path d="M108 160 L104 200" stroke={p.accent} strokeWidth="5" strokeLinecap="round" />
      <path d="M132 160 L136 200" stroke={p.accent} strokeWidth="5" strokeLinecap="round" />
      <path d="M92 236 L148 236" stroke={p.secondary} strokeWidth="8" strokeLinecap="round" />
    </>
  ),
  artist: (p) => (
    <>
      {/* an apron with paint spots */}
      <path d="M96 172 L144 172 L150 240 L90 240 Z" fill={p.accent} stroke={INK} strokeWidth="4" />
      <circle cx="108" cy="204" r="6" fill="#ff6d8f" />
      <circle cx="128" cy="216" r="6" fill="#2b7de9" />
      <circle cx="120" cy="190" r="5" fill="#f6c06b" />
    </>
  ),
};

// ── Hair: five silhouettes, each drawn as a back layer (behind the head) and
// a front layer (over the forehead), so the shape reads from a distance.
const hairShapes = {
  wave: (c) => ({
    back: <path d="M62 96 C58 40 182 40 178 96 L184 150 C170 140 156 138 148 142 L142 104 L98 104 L92 142 C84 138 70 140 56 150 Z" fill={c} stroke={INK} strokeWidth="5" strokeLinejoin="round" />,
    front: <path d="M66 92 C74 44 166 44 174 92 C160 78 140 70 120 74 C100 70 80 78 66 92 Z" fill={c} stroke={INK} strokeWidth="5" strokeLinejoin="round" />,
  }),
  crown: (c) => ({
    back: null,
    front: (
      <path
        d="M64 96 L72 58 L88 78 L102 44 L120 70 L138 44 L152 78 L168 58 L176 96 C160 82 140 76 120 78 C100 76 80 82 64 96 Z"
        fill={c} stroke={INK} strokeWidth="5" strokeLinejoin="round"
      />
    ),
  }),
  bun: (c) => ({
    back: <circle cx="120" cy="40" r="24" fill={c} stroke={INK} strokeWidth="5" />,
    front: <path d="M66 94 C70 52 170 52 174 94 C166 80 150 72 132 76 L120 66 L108 76 C90 72 74 80 66 94 Z" fill={c} stroke={INK} strokeWidth="5" strokeLinejoin="round" />,
  }),
  curls: (c) => ({
    back: (
      <path
        d="M56 98 C46 78 60 60 76 62 C78 44 100 38 112 48 C122 34 146 36 152 50 C170 44 186 62 178 80 C190 92 184 112 170 114 L170 136 C160 150 148 152 140 146 L100 146 C92 152 80 150 70 136 L70 114 C56 114 48 104 56 98 Z"
        fill={c} stroke={INK} strokeWidth="5" strokeLinejoin="round"
      />
    ),
    front: (
      <path
        d="M66 96 C62 76 76 62 90 70 C94 54 114 50 122 62 C132 50 152 56 152 72 C168 66 180 82 174 96 C160 82 142 76 120 78 C98 76 80 82 66 96 Z"
        fill={c} stroke={INK} strokeWidth="5" strokeLinejoin="round"
      />
    ),
  }),
  pixie: (c) => ({
    back: null,
    front: (
      <path
        d="M64 100 C62 58 120 40 160 54 C178 62 184 84 176 100 C168 88 150 80 130 82 L118 92 L100 84 C84 84 72 92 64 100 Z"
        fill={c} stroke={INK} strokeWidth="5" strokeLinejoin="round"
      />
    ),
  }),
};

const expressions = {
  smile: {
    mouth: 'M100 118 C110 132 130 132 140 118',
    eyes: [{ type: 'dot', cx: 102, cy: 94 }, { type: 'dot', cx: 138, cy: 94 }],
  },
  laugh: {
    mouth: 'M98 116 C106 138 134 138 142 116 Z',
    eyes: [{ type: 'arc', d: 'M92 94 Q102 84 112 94' }, { type: 'arc', d: 'M128 94 Q138 84 148 94' }],
  },
  wink: {
    mouth: 'M100 118 C110 130 130 130 140 118',
    eyes: [{ type: 'dot', cx: 102, cy: 94 }, { type: 'line', d: 'M130 94 L148 94' }],
  },
};

// ── Accessories with character ────────────────────────────────────────────────
const accentLayers = {
  headphones: (color) => (
    <>
      <path d="M70 92 C70 36 170 36 170 92" stroke={INK} strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d="M70 92 C70 36 170 36 170 92" stroke={color} strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="58" y="84" width="24" height="42" rx="10" fill={color} stroke={INK} strokeWidth="5" />
      <rect x="158" y="84" width="24" height="42" rx="10" fill={color} stroke={INK} strokeWidth="5" />
    </>
  ),
  glasses: (color) => (
    <>
      <rect x="78" y="80" width="38" height="28" rx="10" fill="#ffffff" fillOpacity="0.35" stroke={color} strokeWidth="6" />
      <rect x="124" y="80" width="38" height="28" rx="10" fill="#ffffff" fillOpacity="0.35" stroke={color} strokeWidth="6" />
      <path d="M116 92 L124 92" stroke={color} strokeWidth="6" strokeLinecap="round" />
      <path d="M78 90 L66 86" stroke={color} strokeWidth="6" strokeLinecap="round" />
      <path d="M162 90 L174 86" stroke={color} strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  cape: (color) => (
    <path d="M78 154 C40 176 24 216 34 252 L206 252 C216 216 200 176 162 154 Z" fill={color} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
  ),
  none: () => null,
};

function Face({ expression }) {
  const e = expressions[expression] || expressions.smile;
  return (
    <>
      {e.eyes.map((eye, i) => {
        if (eye.type === 'dot') return <circle key={i} cx={eye.cx} cy={eye.cy} r="6" fill={INK} />;
        return <path key={i} d={eye.d} fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />;
      })}
      {expression === 'laugh'
        ? <path d={e.mouth} fill={INK} />
        : <path d={e.mouth} fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />}
      {/* cheeks */}
      <circle cx="88" cy="112" r="7" fill="#ff8f8f" opacity="0.55" />
      <circle cx="152" cy="112" r="7" fill="#ff8f8f" opacity="0.55" />
    </>
  );
}

function Figure({ palette, accentColor, body, skin, hair, hairStyle, accent, expression, outfit }) {
  const style = hairShapes[hairStyle] || hairShapes.wave;
  const layers = style(hair);
  const detail = outfitDetails[outfit] || outfitDetails.astronaut;
  return (
    <>
      {accent === 'cape' && accentLayers.cape(accentColor)}
      {layers.back}

      {/* arms and hands */}
      <path d={body.leftArm} fill="none" stroke={INK} strokeWidth="22" strokeLinecap="round" />
      <path d={body.leftArm} fill="none" stroke={palette.primary} strokeWidth="14" strokeLinecap="round" />
      <path d={body.rightArm} fill="none" stroke={INK} strokeWidth="22" strokeLinecap="round" />
      <path d={body.rightArm} fill="none" stroke={palette.primary} strokeWidth="14" strokeLinecap="round" />
      <circle cx={body.leftHand.cx} cy={body.leftHand.cy} r="11" fill={skin} stroke={INK} strokeWidth="5" />
      <circle cx={body.rightHand.cx} cy={body.rightHand.cy} r="11" fill={skin} stroke={INK} strokeWidth="5" />

      {/* neck and torso */}
      <path d={body.neck} fill={skin} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d={body.torso} fill={palette.primary} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      {detail(palette)}

      {/* head, ears, face */}
      <circle cx="66" cy="98" r="10" fill={skin} stroke={INK} strokeWidth="5" />
      <circle cx="174" cy="98" r="10" fill={skin} stroke={INK} strokeWidth="5" />
      <circle cx="120" cy="92" r="52" fill={skin} stroke={INK} strokeWidth="5" />
      <Face expression={expression} />
      {layers.front}
      {accent !== 'cape' && (accentLayers[accent] || accentLayers.none)(accentColor)}
    </>
  );
}

const CharacterAvatar = ({ character, size = 240, className, compact = false }) => {
  const {
    skinTone = 'sunset',
    hairStyle = 'wave',
    hairColor = 'mocha',
    outfit = 'astronaut',
    accent = 'headphones',
    expression = 'smile',
    gender = 'female',
  } = character || {};

  const palette = outfitPalette[outfit] || outfitPalette.astronaut;
  const skin = skinPalette[skinTone] || skinPalette.sunset;
  const hair = hairPalette[hairColor] || hairPalette.mocha;
  const accentColor = accentPalette[accent] || accentPalette.none;
  const body = bodies[gender] || bodies.female;

  const figure = (
    <Figure
      palette={palette}
      accentColor={accentColor}
      body={body}
      skin={skin}
      hair={hair}
      hairStyle={hairStyle}
      accent={accent}
      expression={expression}
      outfit={outfit}
    />
  );

  if (compact) {
    // Head and shoulders, square. This is the sprite in a game and the face in
    // the header, so it is cropped to the part that reads at 32px.
    return (
      <svg
        viewBox="34 14 172 172"
        width={size}
        height={size}
        className={className}
        role="img"
        aria-label="Customized CodeIt character"
        style={{ display: 'block' }}
      >
        {figure}
      </svg>
    );
  }

  const aspectRatio = 260 / 240;
  const height = size * aspectRatio;
  const classes = ['character-avatar', className].filter(Boolean).join(' ');

  return (
    <div className={classes} style={{ width: size, height }}>
      <svg viewBox="0 0 240 260" role="img" aria-label="Customized CodeIt character">
        {figure}
      </svg>
    </div>
  );
};

export default CharacterAvatar;
