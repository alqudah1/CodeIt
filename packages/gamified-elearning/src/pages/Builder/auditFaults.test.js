const fs = require('fs');
const path = require('path');

// ── Faults an outside audit found on 20 November 2026 ───────────────────────
// A fresh pair of eyes walked the site signed out, on a phone and a laptop.
// These hold the fixes for the ones that stopped a child or lied to one. Each
// was also walked in a browser; these are here so they do not come back.
const read = (file) => fs.readFileSync(path.join(__dirname, file), 'utf8');

describe('what the audit found', () => {
  test('the waiting chest sits above a bottom bar, not on top of its keys', () => {
    const css = read('../../components/Chest/ChestTray.css');
    expect(css).toMatch(/@media \(max-width: 899px\) \{\s*body:has\(\.ci-tabs\) \.chest-tray \{ bottom: calc\(84px \+ env\(safe-area-inset-bottom\)\); \}/);
    expect(css).toMatch(/body:has\(\.bldr-mobile-play-bar\) \.chest-tray \{ bottom: calc\(84px/);
    // The tab bar shows under 900px and is 64px tall: the two numbers this depends on.
    const tabs = read('../../ds/TabBar.css');
    expect(tabs).toMatch(/\.ci-tabs \{[^}]*height: calc\(64px \+ env\(safe-area-inset-bottom\)\)/);
    expect(tabs).toMatch(/@media \(min-width: 900px\) \{ \.ci-tabs \{ display: none; \} \}/);
  });

  test('a game that has stopped is not given a green tick or told it is running', () => {
    const banner = read('studioScreen1.js');
    expect(banner).toMatch(/\{broken \? '!' : '✓'\}/);
    expect(banner).toMatch(/\{broken\s*\? 'It stopped\. The code has a mistake'/);
    const next = read('studioScreen2.js');
    expect(next).toMatch(/\{broken\s*\? 'It stopped\. One line of the code has a mistake\.'/);
    expect(next).toMatch(/onClick=\{\(\) => setWorkspaceTab\('learn'\)\}>\s*See what went wrong/);
    expect(next).toMatch(/\{behind && !broken && \(/);
    const builder = read('Builder.js');
    expect((builder.match(/broken: runErrors\.length > 0,/g) || []).length).toBe(2);
    expect(read('CodePanel.js')).toMatch(/errors\.length > 0 \? 'Run it again' : 'Running your latest code'/);
  });

  test('what went wrong cannot be wider than the panel it is in', () => {
    const css = read('CodePanel.css');
    expect(css).toMatch(/\.cp__errors, \.cp__errors-list, \.cp-error \{ min-width: 0; max-width: 100%; \}/);
    expect(css).toMatch(/\.cp-error__title, \.cp-error__fix \{ overflow-wrap: anywhere; \}/);
  });

  test('a visitor who taps Remix is never sent to "Welcome back, sign in"', () => {
    const explore = read('Explore.js');
    const guest = explore.slice(explore.indexOf('if (!user) {', explore.indexOf('const handleRemix')), explore.indexOf('setRemixingId(project.publicId);', explore.indexOf('navigate(`/project/${project.publicId}`);')));
    expect(guest).toMatch(/navigate\(`\/builder\?shelf=\$\{entry\.id\}`\)/);
    expect(guest).toMatch(/navigate\(`\/project\/\$\{project\.publicId\}`\)/);
    expect(guest).not.toMatch(/navigate\('\/login'/);
  });

  test('on a phone the built game is the tall thing on the screen', () => {
    expect(read('../Build/Build.css')).toMatch(/@media \(max-width: 640px\) \{ \.bd__frame\.is-lit \{ aspect-ratio: 5 \/ 6; \} \}/);
  });
});
