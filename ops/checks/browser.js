'use strict';

// ── Finding a browser to check with ──────────────────────────────────────────
//
// Every check in this folder hardcoded one path:
//
//     /opt/pw-browsers/chromium-1194/chrome-linux/chrome
//
// That path exists in exactly one place — the container these checks were
// written in. On anybody else's machine every one of them died on line one, and
// since they are the checks that found the flagship game ending before a child
// could move, the invisible asteroid game, and element editing not stopping the
// game, that is not a small thing. A check nobody else can run is a check that
// only works while one person is awake.
//
// So: an env var if you set one, then Playwright's own installed browsers, then
// the usual places Chrome lives on a Mac and on Linux.

const fs = require('node:fs');
const path = require('node:path');

const CANDIDATES = [
  process.env.CODEIT_CHROME,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
];

/** Playwright's download folder, whose version number changes on every bump. */
function fromPlaywrightFolder() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .filter(name => name.startsWith('chromium'))
    .sort()
    .reverse()
    .flatMap(name => [
      path.join(root, name, 'chrome-linux', 'chrome'),
      path.join(root, name, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
      path.join(root, name),
    ]);
}

/**
 * A path to something that can be launched, or an explanation of why not.
 *
 * Returning the reason rather than throwing lets each check print one clear
 * line instead of a stack trace about a missing executable.
 */
function findChrome() {
  const tried = [];
  for (const candidate of [...CANDIDATES.slice(0, 2), ...fromPlaywrightFolder(), ...CANDIDATES.slice(2)]) {
    if (!candidate) continue;
    tried.push(candidate);
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return { exe: candidate };
    } catch { /* unreadable is the same as absent */ }
  }
  return {
    exe: null,
    why: `No Chrome or Chromium found. Set CODEIT_CHROME to one.\nLooked in:\n  ${tried.join('\n  ')}`,
  };
}

/** Launch, or exit with something a person can act on. */
async function launch() {
  const { exe, why } = findChrome();
  if (!exe) {
    console.error(why);
    process.exit(1);
  }
  const { chromium } = require('playwright-core');
  return chromium.launch({ executablePath: exe });
}

module.exports = { findChrome, launch };
