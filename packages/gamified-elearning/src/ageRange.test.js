import fs from 'fs';
import path from 'path';
import COMPANY, { AGE_RANGE } from './config/company';
import pressFacts from './data/pressFacts';
import PAGE_META from './data/pageMeta';

// ── One age range, and it agrees with what /press says we are not for ────────
//
// "Ages 5 to 18" was in fifty-nine places while /press said a pre-reading
// child should use Kodable or codeSpark. Nothing watched the two, so they
// drifted. This does.

const SRC = __dirname;
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.js$/.test(e.name) && !/\.test\.js$/.test(e.name)) out.push(full);
  }
  return out;
}
const read = (f) => fs.readFileSync(f, 'utf8');
const strip = (src) => src.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const PRESS = pressFacts({ locationLine: 'Toronto, Canada', founderName: 'M', contactEmail: 'a@b.c', url: 'https://x', primaryAlternateName: 'Code It', sameAs: [], pricePerInterval: 'CA$12 a month', freeMonthlyAiBuilds: 5, lessonCount: 31, ages: AGE_RANGE.short });
const pressText = JSON.stringify(PRESS);
const notFor = (() => {
  const sections = PRESS.sections || [];
  const s = sections.find((x) => /does not do/i.test(x.heading));
  return s ? s.paragraphs.join(' ') : '';
})();

describe('the marketing age range', () => {
  test('is written once, in config, as three sentences', () => {
    expect(AGE_RANGE.from).toBe(8);
    expect(AGE_RANGE.to).toBe(14);
    expect(AGE_RANGE.statement).toMatch(/^Built for ages 8 to 14\./);
    expect(AGE_RANGE.statement).toMatch(/alongside an adult/);
    expect(AGE_RANGE.statement).toMatch(/Older beginners are welcome/);
  });

  test('the old claim about ourselves is gone from every page and guide', () => {
    const offenders = [];
    for (const f of walk(SRC)) {
      const src = strip(read(f));
      // Competitor rows in the guides state THEIR ranges; those stay.
      const lines = src.split('\n').filter((l) => /(ages?|for)\s+5\s*(to|–|-)\s*18/i.test(l) && !/Tynker|Create & Learn|tynker/.test(l));
      if (lines.length) offenders.push(path.relative(SRC, f));
    }
    expect(offenders).toEqual([]);
  });

  test('wherever a sentence names CodeIt beside an age range, it is the one range', () => {
    // Three guides said CodeIt suited a child "roughly 8 to 16", one of them
    // in the comparison table that Google's AI Mode cites for parents asking
    // what to buy. Every other page says 8 to 14. Two ranges for one product
    // is how Google came to describe it as a product for children aged 5 to
    // 12, so a second range about ourselves is not a wording choice.
    //
    // Read by sentence, not by line: a guide paragraph is one long line, and
    // a sentence about Scratch covering 8 to 16 in a paragraph that also
    // names CodeIt is a fact about Scratch.
    const range = /\b(?:ages?|aged|roughly)\s+(\d{1,2})\s*(?:to|\u2013|-)\s*(\d{1,2})\b/gi;
    // React strings in src/pages belong to the design session. These two
    // still say "ages 5 to 12" and are handed over in message 89; delete each
    // line here when its fix lands, and this test holds the rest of the site.
    const handedOver = new Set([
      'pages/Home/Home.js: "ages 5 to 12"',
      'pages/Legal/Terms.js: "ages 5 to 12"',
    ]);
    const offenders = [];
    for (const f of walk(SRC)) {
      const rel = path.relative(SRC, f);
      strip(read(f)).split(/(?<=[.!?])\s+|\n/).forEach((sentence) => {
        if (!/CodeIt/.test(sentence)) return;
        for (const m of sentence.matchAll(range)) {
          if (Number(m[1]) === AGE_RANGE.from && Number(m[2]) === AGE_RANGE.to) continue;
          const key = `${rel}: "${m[0]}"`;
          if (!handedOver.has(key)) offenders.push(key);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  test('the schema and the default description carry it', () => {
    const schema = COMPANY.organizationSchema();
    expect(schema.description).toContain(AGE_RANGE.short);
    expect(schema.audience.audienceType).toContain(AGE_RANGE.short);
    expect(read(path.join(SRC, 'hooks/useSEO.js'))).toContain('ages 8 to 14');
    for (const route of ['/', '/about', '/coding-for-kids', '/first-game-challenge']) {
      expect(PAGE_META[route].description).toMatch(/ages 8 to 14/);
    }
  });

  test('/press quotes the same range, and its "not for" paragraph does not contradict it', () => {
    expect(pressText).toContain('ages 8 to 14');
    expect(pressText).not.toMatch(/ages 5 to 18/);
    // The press page says a pre-reading child belongs elsewhere. The range must
    // not start below reading age.
    expect(notFor).toMatch(/pre-reading/);
    expect(AGE_RANGE.from).toBeGreaterThanOrEqual(7);
  });

  test('the legal boundaries did not move with it', () => {
    // COPPA, not marketing: managed profiles under 13, own accounts from 13.
    const register = read(path.join(SRC, 'pages/Auth/Register.js'));
    expect(register).toMatch(/MIN_INDEPENDENT_AGE = 13/);
    const terms = read(path.join(SRC, 'pages/Legal/Terms.js'));
    expect(terms).toMatch(/ages 13 and up/);
  });

  test('the home page states it once, and not in the hero', () => {
    const home = read(path.join(SRC, 'pages/Home/Home.js'));
    expect(home).toContain('{AGE_RANGE.statement}');
    const hero = home.slice(home.indexOf('<section className="studio-hero"'), home.indexOf('</section>', home.indexOf('<section className="studio-hero"')));
    expect(strip(hero)).not.toMatch(/ages \d/i);
  });
});
