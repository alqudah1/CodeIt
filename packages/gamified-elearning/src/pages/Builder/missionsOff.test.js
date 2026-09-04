const fs = require('fs');
const path = require('path');

// Rounds 66 and 67: "Turn Upgrade Missions off today." The model-written
// missions (specifications in circles, cut mid-word) stay off until every
// project type has five hand-written, checkable rungs. This guard fails the
// day someone flips the flag without doing that work.

const src = fs.readFileSync(path.join(__dirname, 'Builder.js'), 'utf8');

describe('Upgrade missions are off', () => {
  test('the flag is false', () => {
    expect(src).toMatch(/export const MISSIONS_ENABLED = false;/);
  });

  test('both the fetch and the render sit behind the flag', () => {
    expect(src).toMatch(/if \(MISSIONS_ENABLED\) \{\s*setMissions\(getMissions/);
    expect(src).toMatch(/\{MISSIONS_ENABLED && onTab\('play'\) && missions\.length > 0/);
  });
});
