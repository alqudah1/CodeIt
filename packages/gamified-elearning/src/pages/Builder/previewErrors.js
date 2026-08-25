// ── Telling a child what broke ───────────────────────────────────────────────
//
// Every real code editor does this and CodeIt did not. When a project threw,
// the preview went blank or half-drawn and the studio said nothing at all — so
// a child who had just changed one line had no way to know whether they had
// broken it, or where, or how to get back.
//
// Two things make this honest rather than decorative:
//
//   1. The line number is the child's own. Chrome reports the line relative to
//      the whole document, so anything CodeIt injects above their code would
//      shift every number and point at the wrong line — which is worse than no
//      line at all. Everything we inject is therefore kept to a single line
//      with no newlines in it, which makes the offset exactly zero. There is a
//      test that fails the moment an injected script grows a newline.
//
//   2. The message is translated, not dressed up. "Uncaught ReferenceError:
//      scoreboard is not defined" becomes a sentence naming what to look for.
//      When we do not recognise an error we say so and show the original,
//      rather than inventing a friendly explanation that might be wrong.

const ERROR_MESSAGE = 'CODEIT_ERROR';

/**
 * The script that watches for errors inside the preview.
 *
 * Deliberately one line: see above. It goes in before anything else so that a
 * project which throws on its very first line is still caught.
 */
function errorReporterScript() {
  return [
    '(function(){',
    'function send(kind,message,line,col){',
    "try{parent.postMessage({type:'" + ERROR_MESSAGE + "',kind:kind,message:String(message||''),line:Number(line)||0,col:Number(col)||0},'*');}catch(e){}",
    '}',
    "window.addEventListener('error',function(e){send('error',e.message,e.lineno,e.colno);});",
    "window.addEventListener('unhandledrejection',function(e){send('promise',(e.reason&&e.reason.message)||e.reason,0,0);});",
    '})();',
  ].join('');
}

const REPORTER_ID = '__codeit_errors__';

/** Put the watcher in, before everything, so nothing throws unheard. */
function injectErrorReporter(html) {
  if (typeof html !== 'string' || !html) return html;
  if (html.includes(REPORTER_ID)) return html;

  const closeTag = `<${'/'}script>`;
  const tag = `<script id="${REPORTER_ID}">${errorReporterScript()}${closeTag}`;

  const head = html.match(/<head[^>]*>/i);
  if (head) return html.replace(head[0], head[0] + tag);
  const htmlTag = html.match(/<html[^>]*>/i);
  if (htmlTag) return html.replace(htmlTag[0], htmlTag[0] + tag);
  const body = html.match(/<body[^>]*>/i);
  if (body) return html.replace(body[0], body[0] + tag);
  return tag + html;
}

/** Is this postMessage the preview reporting a problem? */
function isErrorMessage(data) {
  return Boolean(data && data.type === ERROR_MESSAGE && typeof data.message === 'string');
}

// ── Translating ──────────────────────────────────────────────────────────────
//
// Each rule reads one real browser message and says what a child should
// actually do about it. Order matters: the more specific patterns come first.

const RULES = [
  {
    match: /^(?:Uncaught )?ReferenceError: (\w+) is not defined/,
    explain: (m) => ({
      title: `Your code uses ${m[1]}, but nothing called ${m[1]} exists yet.`,
      fix: `Either it is spelled differently where you made it, or that line runs before ${m[1]} is created.`,
    }),
  },
  {
    match: /Cannot read propert(?:y|ies) of null \(reading '([^']+)'\)/,
    explain: (m) => ({
      title: `Your code looked for something on the page and did not find it, then tried to use its ${m[1]}.`,
      fix: 'Usually the id in getElementById does not match the id on the element. Check both spellings.',
    }),
  },
  {
    match: /Cannot read propert(?:y|ies) of undefined \(reading '([^']+)'\)/,
    explain: (m) => ({
      title: `Something in your code is empty, and the next line asked it for ${m[1]}.`,
      fix: 'Check that the thing was given a value before this line runs.',
    }),
  },
  {
    match: /^(?:Uncaught )?TypeError: (\w+(?:\.\w+)*) is not a function/,
    explain: (m) => ({
      title: `Your code tried to run ${m[1]}() but ${m[1]} is not something that can run.`,
      fix: 'Check the spelling, and check that you wrote a function with that name.',
    }),
  },
  {
    match: /^(?:Uncaught )?SyntaxError: (?:Unexpected|Invalid|missing)/i,
    explain: () => ({
      title: 'There is a typo in the code, so the browser could not read it.',
      fix: 'Look for a missing bracket, quote mark, or semicolon near the line below.',
    }),
  },
  {
    match: /Maximum call stack size exceeded/,
    explain: () => ({
      title: 'A function in your project keeps calling itself and never stops.',
      fix: 'Find the function named below and give it a way to finish.',
    }),
  },
  {
    match: /Script error\.?$/,
    explain: () => ({
      title: 'Something went wrong in your project, but the browser would not say what.',
      fix: 'Try playing it again. If it keeps happening, undo your last change.',
    }),
  },
];

/**
 * Turn one raw browser error into something worth showing a child.
 *
 * `recognised` is deliberately part of the result. When we do not have a rule
 * we show the browser's own words rather than guessing, and the studio can say
 * so honestly instead of pretending to understand.
 */
function describeError(raw) {
  if (!raw || typeof raw.message !== 'string' || !raw.message.trim()) return null;

  const message = raw.message.trim();
  for (const rule of RULES) {
    const found = message.match(rule.match);
    if (found) {
      const { title, fix } = rule.explain(found);
      return {
        title,
        fix,
        line: raw.line > 0 ? raw.line : null,
        raw: message,
        recognised: true,
      };
    }
  }

  return {
    title: 'Your project hit a problem.',
    fix: 'Here is exactly what the browser said. If it does not make sense, undo your last change and try it a different way.',
    line: raw.line > 0 ? raw.line : null,
    raw: message,
    recognised: false,
  };
}

/**
 * The one line of the project an error points at, with its neighbours.
 *
 * Shown under the message, because "line 41" means nothing on its own to a
 * child who has never counted lines in their life.
 */
function lineContext(code, line, around = 1) {
  if (typeof code !== 'string' || !line || line < 1) return [];
  const lines = code.split('\n');
  if (line > lines.length) return [];

  const from = Math.max(1, line - around);
  const to = Math.min(lines.length, line + around);
  const out = [];
  for (let n = from; n <= to; n += 1) {
    out.push({ number: n, text: lines[n - 1], isTheOne: n === line });
  }
  return out;
}

/**
 * Collapse a burst of errors down to what is worth showing.
 *
 * A game that throws inside its animation loop throws sixty times a second.
 * Showing sixty copies of one problem is how a child learns to ignore the
 * error panel entirely.
 */
function collapseErrors(errors, max = 3) {
  const seen = new Map();
  (errors || []).forEach(error => {
    if (!error) return;
    const key = `${error.raw}@${error.line || 0}`;
    const existing = seen.get(key);
    if (existing) existing.count += 1;
    else seen.set(key, { ...error, count: 1 });
  });
  return [...seen.values()].slice(0, max);
}

export {
  ERROR_MESSAGE,
  REPORTER_ID,
  collapseErrors,
  describeError,
  errorReporterScript,
  injectErrorReporter,
  isErrorMessage,
  lineContext,
};
