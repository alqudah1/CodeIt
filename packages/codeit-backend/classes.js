'use strict';

// ── Class codes ──────────────────────────────────────────────────────────────
//
// A teacher makes a class and gets a code like ROCKET42: one word a child can
// read off a projector and two digits, no letters that look like numbers.
// A child types the code and a first name on /join and is in, with nothing
// else to fill in. Everything here is pure so the rules can be tested without
// a database; routes/class.js does the storage.

const WORDS = [
  'ROCKET', 'COMET', 'PLANET', 'METEOR', 'GALAXY', 'ORBIT', 'NOVA', 'SATURN',
  'PIXEL', 'ROBOT', 'LASER', 'TURBO', 'JETPACK', 'HOVER', 'SPARK', 'BLAST',
  'DRAGON', 'PANDA', 'TIGER', 'FALCON', 'DOLPHIN', 'PENGUIN', 'KOALA', 'OTTER',
  'MANGO', 'LEMON', 'CHERRY', 'PEACH', 'KIWI', 'BERRY', 'COCOA', 'WAFFLE',
  'CASTLE', 'BRIDGE', 'TOWER', 'CANYON', 'RIVER', 'VOLCANO', 'GLACIER', 'JUNGLE',
];

/** A fresh code: WORD plus two digits, never 0 or 1 (they read as O and l). */
function makeCode(random = Math.random) {
  const word = WORDS[Math.floor(random() * WORDS.length)];
  const digit = () => String(2 + Math.floor(random() * 8));
  return `${word}${digit()}${digit()}`;
}

/** What a child typed, as the code it means: case, spaces and dashes forgiven. */
function normaliseCode(input) {
  return String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
}

function isCode(code) {
  return /^[A-Z]{3,12}[0-9]{2}$/.test(code);
}

/** A first name as it will show on the board: letters only, one word or two, capitalised. */
function cleanFirstName(input) {
  const words = String(input || '')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{M}' -]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return words.join(' ').slice(0, 24);
}

/** The username behind a class account: maya.rocket42, maya.rocket42.2, ... */
function studentUsername(firstName, code, n = 0) {
  const slug = String(firstName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20) || 'student';
  const base = `${slug}.${String(code).toLowerCase()}`;
  return n > 0 ? `${base}.${n + 1}` : base;
}

/** The class name as a teacher typed it, trimmed and bounded. */
function cleanClassName(input) {
  return String(input || '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

module.exports = { WORDS, cleanClassName, cleanFirstName, isCode, makeCode, normaliseCode, studentUsername };
