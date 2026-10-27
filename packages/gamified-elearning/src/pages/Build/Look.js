// ── One thing in a game, as a child sees it ─────────────────────────────────
//
// A look is one of our drawn sprites ("ship", "coin") or the picture of the
// thing a child named ("🥟"). The menus, the knobs, the example cards and the
// game itself all show the same thing for the same look.

import React from 'react';
import { isEmojiLook } from './gameWords';
import { spriteUri } from './sprites';

export default function Look({ look, className = '' }) {
  if (isEmojiLook(look)) return <span className={`look look--emoji ${className}`.trim()} aria-hidden="true">{look}</span>;
  return <img className={`look ${className}`.trim()} src={spriteUri(look)} alt="" />;
}
