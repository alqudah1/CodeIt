import './CharacterAvatar.css';

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

const baseGeometry = {
  female: {
    torso: 'M80 150 Q120 120 160 150 L172 240 L68 240 Z',
    overlay: 'M90 170 L150 170 L154 240 L86 240 Z',
    leftArm: 'M70 160 Q45 170 55 210 L75 208',
    rightArm: 'M170 160 Q195 170 185 210 L165 208',
  },
  male: {
    torso: 'M72 148 Q120 108 168 148 L182 240 L58 240 Z',
    overlay: 'M82 168 L158 168 L166 240 L74 240 Z',
    leftArm: 'M68 158 Q38 172 50 212 L74 208',
    rightArm: 'M172 158 Q202 172 190 212 L166 208',
  },
};

const expressions = {
  smile: {
    mouth: 'M95 120 C 110 140, 130 140, 145 120',
    leftEye: { type: 'circle', props: { cx: 100, cy: 95, r: 6 } },
    rightEye: { type: 'circle', props: { cx: 140, cy: 95, r: 6 } },
  },
  laugh: {
    mouth: 'M95 125 C 110 150, 130 150, 145 125',
    leftEye: { type: 'path', props: { d: 'M90 92 Q100 85 110 92', strokeWidth: 6 } },
    rightEye: { type: 'path', props: { d: 'M130 92 Q140 85 150 92', strokeWidth: 6 } },
  },
  wink: {
    mouth: 'M95 123 C 110 140, 130 140, 145 123',
    leftEye: { type: 'circle', props: { cx: 100, cy: 95, r: 6 } },
    rightEye: { type: 'path', props: { d: 'M133 95 H147', strokeWidth: 5, strokeLinecap: 'round' } },
  },
};

const hairShapes = {
  wave: (color) => (
    <path
      d="M58 74 C70 20, 170 20, 182 74 L182 110 C165 95, 145 75, 120 75 C95 75, 75 95, 58 110 Z"
      fill={color}
    />
  ),
  crown: (color) => (
    <>
      <path d="M60 70 C70 40, 170 40, 180 70 L180 120 L60 120 Z" fill={color} />
      <path
        d="M70 65 C95 35, 145 35, 170 65"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  bun: (color) => (
    <>
      <circle cx="120" cy="45" r="28" fill={color} />
      <path d="M62 80 Q120 20 178 80 L178 120 L62 120 Z" fill={color} />
    </>
  ),
  curls: (color) => (
    <>
      <path
        d="M55 95 Q70 40, 120 58 Q170 40, 185 95 Q165 120, 120 115 Q75 120, 55 95 Z"
        fill={color}
      />
      <path
        d="M55 105 C75 140, 165 140, 185 105"
        stroke={color}
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  pixie: (color) => (
    <path
      d="M58 90 C70 60, 170 55, 182 90 L182 110 C160 102, 140 100, 120 105 C100 100, 80 102, 58 110 Z"
      fill={color}
    />
  ),
};

const accentLayers = {
  headphones: (color) => (
    <>
      <path d="M70 90 C70 40, 170 40, 170 90" stroke={color} strokeWidth="12" fill="none" />
      <rect x="66" y="88" width="18" height="42" rx="9" fill={color} />
      <rect x="156" y="88" width="18" height="42" rx="9" fill={color} />
    </>
  ),
  glasses: (color) => (
    <>
      <rect x="80" y="82" width="40" height="26" rx="10" stroke={color} strokeWidth="4" fill="none" />
      <rect x="120" y="82" width="40" height="26" rx="10" stroke={color} strokeWidth="4" fill="none" />
      <line x1="120" y1="95" x2="140" y2="95" stroke={color} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  cape: (color) => (
    <path
      d="M60 160 Q40 220, 80 250 L160 250 Q200 220, 180 160 Z"
      fill={color}
      opacity="0.8"
    />
  ),
  none: () => null,
};

const getExpressionLayer = (expressionKey, strokeColor) => {
  const expression = expressions[expressionKey] || expressions.smile;
  return (
    <>
      {expression.leftEye.type === 'circle' ? (
        <circle {...expression.leftEye.props} fill={strokeColor} />
      ) : (
        <path
          {...expression.leftEye.props}
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
        />
      )}
      {expression.rightEye.type === 'circle' ? (
        <circle {...expression.rightEye.props} fill={strokeColor} />
      ) : (
        <path
          {...expression.rightEye.props}
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
        />
      )}
      <path
        d={expression.mouth}
        fill="none"
        stroke={strokeColor}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </>
  );
};

const CharacterAvatar = ({ character, size = 240, className }) => {
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
  const geometry = baseGeometry[gender] || baseGeometry.female;

  const aspectRatio = 260 / 240;
  const height = size * aspectRatio;
  const hairShape = hairShapes[hairStyle] || hairShapes.wave;
  const accentLayer = accentLayers[accent] || accentLayers.none;

  const classes = ['character-avatar', className].filter(Boolean).join(' ');

  return (
    <div className={classes} style={{ width: size, height }}>
      <svg viewBox="0 0 240 260" role="img" aria-label="Customized CodeIt character">
        <defs>
          <linearGradient id="avatar-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.accent} stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
          </linearGradient>
          <filter id="shadow-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
            <feOffset in="blur" dx="0" dy="4" result="offsetBlur" />
            <feMerge>
              <feMergeNode in="offsetBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="10" y="10" width="220" height="240" rx="40" fill="url(#avatar-bg)" />

        {accent === 'cape' && accentLayer(accentColor)}

        {/* Body */}
        <path
          d={geometry.torso}
          fill={palette.primary}
          filter="url(#shadow-blur)"
        />
        <path d={geometry.overlay} fill={palette.secondary} opacity="0.7" />

        {/* Arms */}
        <path
          d={geometry.leftArm}
          fill={skin}
          stroke={palette.primary}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={geometry.rightArm}
          fill={skin}
          stroke={palette.primary}
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Head */}
        <circle cx="120" cy="90" r="55" fill={skin} />

        {/* Hair */}
        {hairShape(hair)}

        {/* Facial features */}
        {getExpressionLayer(expression, '#2b1b18')}

        {/* Accent accessory */}
        {accent !== 'cape' && accentLayer(accentColor)}

        {/* Highlight sparkle */}
        <circle cx="170" cy="50" r="12" fill="#ffffff" opacity="0.4" />
      </svg>
    </div>
  );
};

export default CharacterAvatar;