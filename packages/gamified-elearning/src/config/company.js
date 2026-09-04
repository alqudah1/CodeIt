/**
 * Who CodeIt is, in one place.
 *
 * This exists for a specific reason. "CodeIt" collides with several real
 * organisations — MIT CodeIt (a youth outreach programme), codeitlearning.com
 * (a coding tutoring company in London), and codeit.us (a software services
 * firm). An AI assistant or a search engine asked "what is CodeIt" has no way
 * to tell them apart unless this site states plainly who it is and where it is
 * from. Every field below is a disambiguating signal, and the empty ones are
 * the ones still doing us no good.
 *
 * Fill in `founderName` and `contactEmail` when they are available. The About
 * page and the Organization schema both read from here, so supplying them is a
 * one-file change and nothing needs rewriting.
 *
 * Do not put a placeholder in an empty field. A page that says
 * "[FOUNDER NAME]" is worse than one that says nothing, and a fabricated
 * founding date is worse still — these are the exact fields a reader checks
 * when deciding whether a site is real.
 */

// ── Who it is for ─────────────────────────────────────────────────────────────
//
// "Ages 5 to 18" was in fifty-nine places, and /press said, under "what it
// does not do", that a pre-reading child should use Kodable or codeSpark and a
// teenager wanting a professional workflow should use real developer tools.
// The marketing said 5; the press page said a five-year-old should go
// elsewhere. Both were ours.
//
// A range that wide reads as not knowing who it is for, and it is specifically
// an AI-visibility problem: an assistant asked for "coding for a 9 year old"
// matches products that are FOR nine-year-olds, and a label for everyone is no
// label. What the product actually requires, reading short sentences, typing a
// description, reading a line of Python, is roughly eight, and it is not five.
//
// Three sentences, precise where precision helps and excluding nobody. This is
// the ONLY place the marketing range is written; everything reads it from here
// (ageRange.test.js fails if the old number comes back or /press disagrees).
//
// The legal boundaries are separate and do not move: parent-managed profiles
// under 13, independent accounts from 13. Those are COPPA, not marketing.
export const AGE_RANGE = Object.freeze({
  from: 8,
  to: 14,
  short: 'ages 8 to 14',
  statement: 'Built for ages 8 to 14. Younger children can use it alongside an adult. Older beginners are welcome.',
});

const COMPANY = {
  name: 'CodeIt',
  // 'CodeIt Learn' is what the public profiles are named. On LinkedIn there
  // are ten other companies called CodeIt and this site did not appear at all;
  // adding the second word makes the name findable by a person, not just
  // resolvable by a model. Every alias used anywhere is declared here.
  alternateNames: ['CodeIt Learn', 'CodeItLearn', 'Code It Learn'],
  url: 'https://codeitlearn.com',

  // Stated by the owner. Safe to publish.
  city: 'Toronto',
  region: 'Ontario',
  country: 'Canada',
  countryCode: 'CA',

  founderName: 'Mustafa AlQudah',

  // Temporary: this is a personal business address on another domain, used
  // until a codeitlearn.com mailbox exists. It is a real, monitored inbox, so
  // it is better than no contact at all — but an address on the site's own
  // domain is a stronger signal that the site and the organisation are the
  // same thing. Swap it here when that mailbox is ready; nothing else changes.
  contactEmail: 'mustafa@lynq.build',

  // ── The founder note on the home page ────────────────────────────────────
  //
  // There is no person anywhere on codeitlearn.com. Nobody built it, nobody is
  // named, nobody answers. That absence is most of what makes a site read as
  // generated, more than any sentence on it does.
  //
  // The block that fixes it is written and waiting in Home.js, and it renders
  // NOTHING until this string is filled in. It is deliberately empty rather
  // than holding a plausible sentence, because the one thing worse than no
  // founder on the page is a founder saying something he did not say.
  //
  // Mustafa: one true sentence, first person, why you built it. For example
  // the shape, not the content: "I built CodeIt because <the real reason>."
  // Fill it here and it appears, signed, above the footer, with the address
  // above as a mailbox a person actually answers.
  founderNote: '',

  // Optional. A path under public/ to a photograph of the founder. The block
  // works without it; a face works better than no face.
  founderPhoto: '',

  // Not yet available. Leave empty rather than guessing — a fabricated
  // founding date is exactly what a reader checks when deciding if a site is
  // real, and the company is not registered yet.
  legalName: '',
  foundingDate: '',

  /**
   * External profiles. Each one is simultaneously a `sameAs` target and an
   * independent source that corroborates the brand exists.
   *
   * Add a URL only once the profile is actually live. An empty list is honest;
   * a link to a page that does not exist is a broken claim.
   */
  sameAs: [
    'https://www.linkedin.com/company/codeitlearn',
    'https://www.youtube.com/@CodeItLearn1',
    'https://www.crunchbase.com/organization/codeit-learn',
    'https://www.facebook.com/codeitlearn',
    'https://www.instagram.com/codeitlearn',
    'https://www.tiktok.com/@codeitlearn',
  ],
};

/** True once there is enough here to identify the organisation to a stranger. */
COMPANY.hasIdentity = function hasIdentity() {
  return Boolean(COMPANY.founderName || COMPANY.contactEmail || COMPANY.sameAs.length);
};

/** "Toronto, Ontario, Canada" */
COMPANY.locationLine = function locationLine() {
  return [COMPANY.city, COMPANY.region, COMPANY.country].filter(Boolean).join(', ');
};

/** schema.org Organization, built from whatever facts actually exist. */
COMPANY.organizationSchema = function organizationSchema() {
  const schema = {
    '@type': 'Organization',
    '@id': `${COMPANY.url}/#organization`,
    name: COMPANY.name,
    alternateName: COMPANY.alternateNames,
    url: `${COMPANY.url}/`,
    logo: `${COMPANY.url}/brand/codeit-logo-trimmed.png`,
    description:
      `CodeIt is a browser-based creative coding studio, built for ${AGE_RANGE.short}, where learners build websites, games and quizzes by describing them, change them by moving things and picking colours, and see what the finished project is made of. Younger children can use it alongside an adult; older beginners are welcome.`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: COMPANY.city,
      addressRegion: COMPANY.region,
      addressCountry: COMPANY.countryCode,
    },
    knowsAbout: [
      'learning to code',
      'HTML',
      'CSS',
      'JavaScript',
      'Python for beginners',
      'coding for kids',
    ],
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      audienceType: `Learners ${AGE_RANGE.short}, younger children with an adult, and older beginners`,
    },
  };

  if (COMPANY.legalName) schema.legalName = COMPANY.legalName;
  if (COMPANY.foundingDate) schema.foundingDate = COMPANY.foundingDate;
  if (COMPANY.founderName) schema.founder = { '@type': 'Person', name: COMPANY.founderName };
  if (COMPANY.contactEmail) {
    schema.email = COMPANY.contactEmail;
    schema.contactPoint = {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: COMPANY.contactEmail,
      availableLanguage: ['en'],
    };
  }
  if (COMPANY.sameAs.length) schema.sameAs = COMPANY.sameAs;

  return schema;
};

export default COMPANY;
