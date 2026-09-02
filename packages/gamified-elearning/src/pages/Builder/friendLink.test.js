import fs from 'fs';
import path from 'path';

// ── A child can hand their project to someone ────────────────────────────────
//
// Watched in a classroom: a nine-year-old typed forty words describing a
// two-player fighting game and finished with "so i can play with my friends".
// That was the reason they built it, and there was no way to do it. Sharing
// required an account, a save, a personalisation, a play and a publish.
//
// Unlisted projects were built for exactly this and shipped complete: route,
// rate limit, report flag, tables created in production on 1 September. The
// browser had never called them, and the server was returning a path
// (/project/u-<id>) that the public page could not read, because it sent the
// whole "u-<id>" string to an endpoint that only knows published ids.
//
// So the feature existed, was tested, was deployed, and was unreachable.
const BUILDER = fs.readFileSync(path.join(__dirname, 'Builder.js'), 'utf8');
const PUBLIC = fs.readFileSync(path.join(__dirname, 'PublicProject.js'), 'utf8');
const code = src => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
const B = code(BUILDER);
const P = code(PUBLIC);

describe('the friend link', () => {
  test('the studio calls the unlisted endpoint that already existed', () => {
    expect(B).toMatch(/\/api\/builder\/unlisted/);
    expect(B).toMatch(/handleSendToFriend/);
  });

  test('it needs no account, no save and no publish', () => {
    const btn = B.slice(B.indexOf('bldr-action-btn--friend'), B.indexOf('bldr-action-btn--friend') + 400);
    expect(btn).not.toMatch(/isSaved/);
    expect(btn).not.toMatch(/\buser\b/);
    expect(btn).not.toMatch(/isPersonalized/);
  });

  test('it is not offered for a template the child did not make', () => {
    expect(B).toMatch(/code && !isStarter && !isPublished &&/);
  });

  test('the public page reads a u- link from the unlisted endpoint', () => {
    expect(P).toMatch(/\^u-\[a-f0-9\]\{12\}\$/);
    expect(P).toMatch(/\/api\/builder\/unlisted\/\$\{unlistedId\}/);
  });

  test('the two endpoints name the code field differently and that is handled', () => {
    expect(P).toMatch(/generated_code: data\.project\.code/);
  });

  test('remix is hidden on an unlisted link, because it would always fail', () => {
    expect(P).toMatch(/\{!unlistedId && \(/);
  });

  test('the child is told plainly what the link does', () => {
    expect(BUILDER).toMatch(/Anyone with this link can play it/);
    expect(BUILDER).toMatch(/does not\s*\n?\s*need an account/);
  });
});
