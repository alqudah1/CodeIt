import fs from 'fs';
import path from 'path';
import { isEnoughToProve, questionsFor } from './proveIt';

// ── A template is never provable material ────────────────────────────────────
//
// Between an unknown date and 21:45 on 1 September 2026 the Anthropic account
// had no credit, so every build fell back to a canned starter. Every child
// received the same file. "Show it's yours" read that file and asked all of
// them the same questions about the same variables, and the answers were
// written to the account as evidence a parent could be sent.
//
// The evidence page tells a parent those questions "cannot be shared between
// two children". For the length of that outage that sentence was false.
//
// Two independent guards, because one was not enough to notice an outage that
// lasted weeks:
//   1. The panel refuses to render on a fallback build (isStarter), tested in
//      ProveItPanel's own suite.
//   2. This file: the fallback templates themselves must not contain enough
//      distinct, project-specific material to be provable in the first place.
//      That holds even if the flag is ever lost in a refactor.
const ROUTE = fs.readFileSync(
  path.join(__dirname, '../../../../codeit-backend/routes/builder.js'), 'utf8');

// The generic game template, taken from the server source rather than
// reimplemented here, so this cannot pass against a copy that has drifted.
function templateFrom(fnName) {
  const start = ROUTE.indexOf(`function ${fnName}(`);
  if (start < 0) return null;
  const open = ROUTE.indexOf('`', start);
  const close = ROUTE.indexOf('`;', open + 1);
  if (open < 0 || close < 0) return null;
  // getRichFallback stamps the marker on the way out; the raw template does not
  // carry it, so this test applies the same stamp the server does.
  const raw = ROUTE.slice(open + 1, close);
  return raw.replace('<!DOCTYPE html>', '<!DOCTYPE html><!--codeit-starter-template-->');
}

describe('fallback templates cannot be used as evidence', () => {
  test('the fallback builders still exist under the names this test reads', () => {
    expect(ROUTE).toMatch(/function buildGenericGameFallback\(/);
    expect(ROUTE).toMatch(/function buildQuizFallback\(/);
  });

  test.each(['buildGenericGameFallback', 'buildQuizFallback'])(
    '%s is not provable material',
    (fnName) => {
      const html = templateFrom(fnName);
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(200);
      const questions = questionsFor(html, { max: 3 });
      // If this ever fails, the template has grown enough project-specific
      // detail to look like a child's own work, which is precisely the
      // condition that made the outage produce false evidence.
      expect(isEnoughToProve(questions)).toBe(false);
    },
  );

  test('the browser s own starter templates carry the marker too', () => {
    // The browser substitutes its own copies on a fallback, so marking only the
    // server's would have left the real path unguarded.
    const builder = fs.readFileSync(path.join(__dirname, 'Builder.js'), 'utf8');
    const block = builder.slice(builder.indexOf('const STARTER_TEMPLATES'),
      builder.indexOf('const STARTER_TEMPLATES') + 20000);
    const templates = (block.match(/<!DOCTYPE html>/g) || []).length;
    const marked = (block.match(/codeit-starter-template/g) || []).length;
    expect(templates).toBeGreaterThan(0);
    expect(marked).toBe(templates);
  });

  test('the server stamps every fallback it returns', () => {
    expect(ROUTE).toMatch(/function markStarter\(/);
    expect(ROUTE).toMatch(/return markStarter\(getRichFallbackHtml\(/);
  });

  test('the panel refuses a starter build outright', () => {
    const panel = fs.readFileSync(path.join(__dirname, 'ProveItPanel.js'), 'utf8');
    expect(panel).toMatch(/if \(isStarter\) return null;/);
    const builder = fs.readFileSync(path.join(__dirname, 'Builder.js'), 'utf8');
    expect(builder).toMatch(/isStarter=\{isStarter\}/);
  });
});
