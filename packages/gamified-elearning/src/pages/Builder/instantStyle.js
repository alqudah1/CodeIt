// ── Instant project customization (no AI, no network) ────────────────────────
//
// Every control here rewrites the project's own HTML locally. That matters for
// two reasons:
//   1. A student can always change their project, even when AI generation is
//      unavailable. The save gate ("change it, test it, then save it") stays
//      reachable instead of dead-ending on a provider error.
//   2. Changes are instant. Waiting 30–75s for a model round-trip loses a
//      five-year-old long before the result arrives.
//
// The functions below are pure so they can be unit tested without a browser.

const STYLE_MARKER = '/* codeit-instant-style:';

// ── Option tables ────────────────────────────────────────────────────────────
// `id` values are persisted inside the project HTML (see readInstantPrefs), so
// renaming one silently drops a student's saved choice. Add, don't rename.

const TEXT_SIZES = [
  { id: 'normal', label: 'Normal', icon: 'Aa', scale: 1 },
  { id: 'big',    label: 'Big',    icon: 'Aa', scale: 1.15 },
  { id: 'huge',   label: 'Huge',   icon: 'Aa', scale: 1.32 },
];

const FONTS = [
  { id: 'default',    label: 'Original',   stack: null },
  { id: 'rounded',    label: 'Bubbly',     stack: '"Comic Sans MS", "Comic Neue", "Chalkboard SE", "Trebuchet MS", sans-serif' },
  { id: 'friendly',   label: 'Friendly',   stack: '"Trebuchet MS", Verdana, system-ui, sans-serif' },
  { id: 'clean',      label: 'Clean',      stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { id: 'chunky',     label: 'Chunky',     stack: '"Arial Black", Impact, system-ui, sans-serif' },
  { id: 'typewriter', label: 'Typewriter', stack: '"Courier New", ui-monospace, monospace' },
];

const BACKGROUNDS = [
  { id: 'plain',   label: 'Plain',   swatch: '#FFFFFF', image: null },
  { id: 'glow',    label: 'Soft glow', swatch: 'radial-gradient(circle at 30% 20%, #FFD9B0, #FFF6ED)',
    image: 'radial-gradient(circle at 15% 12%, rgba(255,122,0,.18), transparent 42%), radial-gradient(circle at 85% 78%, rgba(168,85,247,.16), transparent 45%)' },
  { id: 'dots',    label: 'Dots',    swatch: 'radial-gradient(circle, #FF7A00 2px, #FFF6ED 2px)',
    image: 'radial-gradient(rgba(56,41,31,.13) 1.6px, transparent 1.6px)', size: '22px 22px' },
  { id: 'stripes', label: 'Stripes', swatch: 'repeating-linear-gradient(45deg, #FF7A00 0 6px, #FFF6ED 6px 12px)',
    image: 'repeating-linear-gradient(45deg, rgba(56,41,31,.06) 0 14px, transparent 14px 28px)' },
  { id: 'grid',    label: 'Grid',    swatch: 'linear-gradient(#FF7A00 1px, #FFF6ED 1px)',
    image: 'linear-gradient(rgba(56,41,31,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(56,41,31,.09) 1px, transparent 1px)', size: '26px 26px' },
];

const CORNERS = [
  { id: 'default', label: 'Original', radius: null },
  { id: 'round',   label: 'Round',    radius: '22px' },
  { id: 'pill',    label: 'Pill',     radius: '999px' },
  { id: 'sharp',   label: 'Sharp',    radius: '0px' },
];

const DEFAULT_PREFS = { textSize: 'normal', font: 'default', background: 'plain', corners: 'default' };

function optionById(table, id) {
  return table.find(option => option.id === id) || table[0];
}

// ── CSS generation ───────────────────────────────────────────────────────────

/**
 * Build the override stylesheet for a set of student choices.
 * Returns '' when every choice is the project's original look, so an untouched
 * project never carries a marker block around.
 */
function buildInstantCss(prefs) {
  const merged = { ...DEFAULT_PREFS, ...(prefs || {}) };
  const size = optionById(TEXT_SIZES, merged.textSize);
  const font = optionById(FONTS, merged.font);
  const background = optionById(BACKGROUNDS, merged.background);
  const corners = optionById(CORNERS, merged.corners);

  const rules = [];

  if (size.scale !== 1) {
    // rem-based type scales with the root. Controls are scaled explicitly and
    // given a 44px floor so younger students get a real tap target, not just
    // larger words.
    rules.push(`html{font-size:${Math.round(size.scale * 100)}% !important}`);
    rules.push(
      'button,.btn,[role="button"],input,select,textarea{'
      + `font-size:calc(1rem * ${size.scale}) !important;`
      + 'min-height:44px !important;'
      + 'line-height:1.25 !important}'
    );
  }

  if (font.stack) {
    rules.push(`body,body *{font-family:${font.stack} !important}`);
  }

  if (background.image) {
    rules.push(
      `body{background-image:${background.image} !important;`
      + (background.size ? `background-size:${background.size} !important;` : '')
      + 'background-attachment:fixed !important}'
    );
  }

  if (corners.radius) {
    rules.push(
      'button,.btn,[role="button"],input,select,textarea,.card,section,article,'
      + `.box,.panel,.tile{border-radius:${corners.radius} !important}`
    );
  }

  if (!rules.length) return '';
  // The prefs ride inside the marker comment itself, so the block stays inert
  // CSS while still telling us what the student picked when the project is
  // reopened later.
  return `/* codeit-instant-style:${encodePrefs(merged)} */\n${rules.join('\n')}`;
}

function encodePrefs(prefs) {
  return [prefs.textSize, prefs.font, prefs.background, prefs.corners].join('|');
}

function readInstantPrefs(html) {
  const match = typeof html === 'string'
    ? html.match(/\/\* codeit-instant-style:([^*]*)\*\//)
    : null;
  if (!match) return { ...DEFAULT_PREFS };
  const [textSize, font, background, corners] = match[1].trim().split('|');
  return {
    textSize:   optionById(TEXT_SIZES,  textSize).id,
    font:       optionById(FONTS,       font).id,
    background: optionById(BACKGROUNDS, background).id,
    corners:    optionById(CORNERS,     corners).id,
  };
}

// ── HTML rewriting ───────────────────────────────────────────────────────────

const MARKER_BLOCK = /\n?\/\* codeit-instant-style:[^*]*\*\/[\s\S]*?(?=<\/style>|\/\* codeit-color-override \*\/|$)/;

/**
 * Insert (or replace, or remove) the instant-style block in a project.
 * Always returns a string; returns the input unchanged when there is nothing
 * sensible to do, so callers can compare by identity to detect a no-op.
 */
function bakeInstantStyle(html, css) {
  if (typeof html !== 'string' || !html) return html;

  const stripped = MARKER_BLOCK.test(html) ? html.replace(MARKER_BLOCK, '') : html;
  if (!css) return stripped;

  const block = `\n${css}\n`;

  // Prefer the last </style> so the override wins the cascade.
  if (/<\/style>/i.test(stripped)) {
    return stripped.replace(/<\/style>(?![\s\S]*<\/style>)/i, `${block}</style>`);
  }
  // No stylesheet at all (rare, but AI output is not guaranteed) — add one.
  if (/<\/head>/i.test(stripped)) {
    return stripped.replace(/<\/head>/i, `<style>${block}</style></head>`);
  }
  if (/<body[^>]*>/i.test(stripped)) {
    return stripped.replace(/<body[^>]*>/i, match => `${match}<style>${block}</style>`);
  }
  return `<style>${block}</style>${stripped}`;
}

// ── Project title ────────────────────────────────────────────────────────────

function escapeHtmlText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function readProjectHeading(html) {
  if (typeof html !== 'string') return '';
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (heading) return heading[1].replace(/<[^>]*>/g, '').trim();
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return title ? title[1].trim() : '';
}

/**
 * Rename the project in its own HTML: the first <h1> and the document <title>.
 * Leaves the document untouched for an empty or unchanged name.
 */
function setProjectHeading(html, rawTitle) {
  if (typeof html !== 'string' || !html) return html;
  const title = String(rawTitle == null ? '' : rawTitle).trim().slice(0, 80);
  if (!title) return html;

  const safe = escapeHtmlText(title);
  let updated = html;

  if (/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(updated)) {
    updated = updated.replace(/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/i, `$1${safe}$2`);
  }
  if (/<title\b[^>]*>[\s\S]*?<\/title>/i.test(updated)) {
    updated = updated.replace(/(<title\b[^>]*>)[\s\S]*?(<\/title>)/i, `$1${safe}$2`);
  } else if (/<\/head>/i.test(updated)) {
    updated = updated.replace(/<\/head>/i, `<title>${safe}</title></head>`);
  }
  return updated;
}

// ── Age-appropriate control sets ─────────────────────────────────────────────
//
// Same platform, different amount of choice. Younger students get fewer, larger
// options so the panel is one decision at a time rather than a control surface.

const CONTROLS_BY_GUIDE_LEVEL = {
  early:       ['theme', 'textSize', 'title'],
  guided:      ['theme', 'textSize', 'font', 'background', 'title'],
  independent: ['theme', 'textSize', 'font', 'background', 'corners', 'title'],
};

function controlsForGuideLevel(guideLevel) {
  return CONTROLS_BY_GUIDE_LEVEL[guideLevel] || CONTROLS_BY_GUIDE_LEVEL.guided;
}

// Ages 5–7 see a trimmed option list — three choices, not six.
function optionsForGuideLevel(table, guideLevel) {
  return guideLevel === 'early' ? table.slice(0, 3) : table;
}

export {
  BACKGROUNDS,
  CORNERS,
  DEFAULT_PREFS,
  FONTS,
  STYLE_MARKER,
  TEXT_SIZES,
  bakeInstantStyle,
  buildInstantCss,
  controlsForGuideLevel,
  encodePrefs,
  optionsForGuideLevel,
  readInstantPrefs,
  readProjectHeading,
  setProjectHeading,
};
