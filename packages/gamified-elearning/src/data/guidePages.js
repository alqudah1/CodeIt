/* ─────────────────────────────────────────────────────────────
   CodeIt guides — long-form reference pages.

   These are written to be genuinely the best answer to a specific
   question, which means several of them recommend a competitor. That
   is deliberate: a page that only recommends CodeIt does not get
   cited by anything, and being useful is the whole mechanism.

   Both the React GuidePage component and the static-SEO build script
   render from this file, so the crawlable HTML and the page a person
   sees are always the same words.
───────────────────────────────────────────────────────────── */
// ── In parts ─────────────────────────────────────────────────────────────────
//
// The guides were written out in this one file, which made it a 165 KB script.
// On 13 November 2026 a school's web filter was refusing large scripts, and a
// guide could not open there. The articles now live in files of about 40 KB
// under guides/, in the same order, and this file puts the list together.
import { GUIDES_A } from './guides/part1';
import { GUIDES_B } from './guides/part2';
import { GUIDES_C } from './guides/part3';
import { GUIDES_D } from './guides/part4';
import { GUIDES_E } from './guides/part5';

const GUIDE_PAGES = [
  ...GUIDES_A,
  ...GUIDES_B,
  ...GUIDES_C,
  ...GUIDES_D,
  ...GUIDES_E,
];

export default GUIDE_PAGES;