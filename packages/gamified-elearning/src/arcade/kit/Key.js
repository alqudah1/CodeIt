import React from 'react';
import { play } from './sound';
import { haptic } from './haptic';
import './kit.css';

// ── A key is a physical object ───────────────────────────────────────────────
//
// Every button in the child's shell: a flat face on a 5px ink edge that
// presses down under the finger, with the sound and the haptic on the same
// frame as the press, not on the release. The tone names the job: orange for
// the one thing to do, mint for Run and Check, sun for a reward, quiet for
// the way back, coral for try again.

export default function Key({ tone = 'orange', sound = 'tap', glow = false, className = '', onPointerDown, children, ...rest }) {
  return (
    <button
      type="button"
      className={`ak-key ak-key--${tone}${glow ? ' ak-key--glow' : ''} ${className}`.trim()}
      onPointerDown={(e) => { if (!rest.disabled) { play(sound); haptic(sound); } if (onPointerDown) onPointerDown(e); }}
      {...rest}
    >
      {children}
    </button>
  );
}
