'use strict';

/**
 * content-loader.js
 * -----------------
 * Reads the app's ESM content modules (blog posts, lesson data) from a plain
 * CommonJS build script, without adding a bundler step.
 *
 * Why this exists: the static SEO generator runs as `postbuild` in Node. The
 * content it needs to inline lives in `src/data/blogPosts.js` and
 * `src/pages/Lessons/lessonData/*.js`, which are ES modules and contain regex
 * literals (so they cannot simply be JSON.parse'd). We evaluate them in a vm
 * sandbox after rewriting `export default X` to `module.exports = X`.
 *
 * Single source of truth is preserved: the React app and the crawlable static
 * HTML are generated from the same files. Edit the content once.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.resolve(__dirname, '../src');

function loadEsmDefault(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');

  // `export default foo;`      -> `module.exports = foo;`
  // `export { A, B };`          -> `module.exports = { A, B };`
  // `export const X = ...;`     -> `const X = ...;` (collected by the block above)
  const cjs = source
    .replace(/export\s+default\s+/g, 'module.exports = ')
    .replace(/export\s*\{([^}]*)\}\s*;/g, (_, names) => `module.exports = {${names}};`)
    .replace(/export\s+(const|let|function|class)\s/g, '$1 ');

  const sandboxModule = { exports: {} };
  const context = vm.createContext({
    module: sandboxModule,
    exports: sandboxModule.exports,
    require: () => {
      throw new Error(
        `content-loader: ${path.basename(filePath)} must not import other modules`
      );
    },
    console,
  });

  try {
    vm.runInContext(cjs, context, { filename: filePath, timeout: 5000 });
  } catch (error) {
    throw new Error(`content-loader: failed to evaluate ${filePath}\n${error.message}`);
  }

  return sandboxModule.exports;
}

/** The starter games, including the short list the front page shows. */
function loadStarterGames() {
  const module_ = loadEsmDefault(path.join(SRC, 'pages/Builder/starterGames.js'));
  if (!Array.isArray(module_.HOME_PICKS) || !Array.isArray(module_.STARTER_GAMES)) {
    throw new Error('content-loader: starterGames.js did not export HOME_PICKS and STARTER_GAMES');
  }
  return module_;
}

/** The /press content, as a function of the values that change. */
function loadPressFacts() {
  const build = loadEsmDefault(path.join(SRC, 'data/pressFacts.js'));
  if (typeof build !== 'function') {
    throw new Error('content-loader: pressFacts.js did not export a function');
  }
  return build;
}

/** All blog posts, in file order. */
function loadBlogPosts() {
  const posts = loadEsmDefault(path.join(SRC, 'data/blogPosts.js'));
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error('content-loader: blogPosts.js did not export a non-empty array');
  }
  return posts;
}

/** Lessons 1..16 keyed by lesson number. Missing files are skipped, not fatal. */
function loadLessons() {
  const dir = path.join(SRC, 'pages/Lessons/lessonData');
  const lessons = new Map();

  for (const file of fs.readdirSync(dir)) {
    const match = /^lesson(\d+)\.js$/.exec(file);
    if (!match) continue;
    const number = Number(match[1]);
    try {
      lessons.set(number, loadEsmDefault(path.join(dir, file)));
    } catch (error) {
      console.warn(`content-loader: skipping ${file} — ${error.message}`);
    }
  }

  if (lessons.size === 0) {
    throw new Error('content-loader: no lesson data files could be loaded');
  }
  return lessons;
}

/** Long-form guide pages, shared with the React GuidePage component. */
function loadGuidePages() {
  const guides = loadEsmDefault(path.join(SRC, 'data/guidePages.js'));
  if (!Array.isArray(guides) || guides.length === 0) {
    throw new Error('content-loader: guidePages.js did not export a non-empty array');
  }
  return guides;
}

/** The same Markdown renderer the React app uses, so both agree exactly. */
function loadMarkdownRenderer() {
  const render = loadEsmDefault(path.join(SRC, 'utils/markdown.js'));
  if (typeof render !== 'function') {
    throw new Error('content-loader: markdown.js did not export a function');
  }
  return render;
}

/** The single FAQ list shared with the /faq page and the parent guide. */
function loadFaqs() {
  const faqs = loadEsmDefault(path.join(SRC, 'data/faqs.js'));
  if (!Array.isArray(faqs) || faqs.length === 0) {
    throw new Error('content-loader: faqs.js did not export a non-empty array');
  }
  return faqs;
}

/** Company identity, so the Organization schema has exactly one source. */
function loadCompany() {
  const company = loadEsmDefault(path.join(SRC, 'config/company.js'));
  if (!company || typeof company.organizationSchema !== 'function') {
    throw new Error('content-loader: company.js did not export the expected object');
  }
  return company;
}

/** Price constants, shared with the pricing page so there is one source. */
function loadPricing() {
  const pricing = loadEsmDefault(path.join(SRC, 'config/pricing.js'));
  if (!pricing || !pricing.PRICE_PER_INTERVAL) {
    throw new Error('content-loader: pricing.js did not export the expected constants');
  }
  return pricing;
}

/**
 * Title and description per route, shared with the React app's useSEO hook.
 * Both sides reading one object is what stops a page telling a person one
 * thing and a crawler another.
 */
function loadPageMeta() {
  const meta = loadEsmDefault(path.join(SRC, 'data/pageMeta.js'));
  if (!meta || typeof meta !== 'object' || !Object.keys(meta).length) {
    throw new Error('content-loader: pageMeta.js did not export a non-empty object');
  }
  return meta;
}

module.exports = {
  loadStarterGames,
  loadPressFacts,
  loadPageMeta,
  loadPricing,
  loadBlogPosts,
  loadLessons,
  loadGuidePages,
  loadMarkdownRenderer,
  loadFaqs,
  loadCompany,
  loadEsmDefault,
};
