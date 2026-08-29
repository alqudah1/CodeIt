'use strict';

// ── Does the generated project actually run? ─────────────────────────────────
//
// "People are creating games but some games don't work."
//
// Everything the server checked before returning a project to a child was a
// search for words in the text:
//
//     html.trim().length > 200
//     /<body/i, /<style/i, /<\/html>/i
//     a <script> with at least 80 characters in it
//     for a game: the text contains "score", and "restart|startGame|newGame",
//                 and "setInterval|setTimeout|requestAnimationFrame"
//
// Every one of those passes on JavaScript that cannot run. A generated game
// containing
//
//     let scor = 0;
//     function tick() { score = score + 1
//
// has the word "score" in it, has a script over eighty characters, has a
// listener, closes its html tag — and throws on the first frame. The child
// presses Play and nothing happens, and nothing anywhere noticed.
//
// A syntax error is the one class of failure that can be caught for free and
// with certainty, before a child ever sees the project. `new Function(source)`
// compiles the code and never calls it: a parse error throws here, on the
// server, and a working project costs a millisecond.
//
// This does not catch a typo in a variable name, or a game that runs and is no
// fun. It catches the project that was never going to start.

/** The contents of every <script> block that has code in it. */
function scriptsIn(html) {
  if (typeof html !== 'string') return [];
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    // A <script src="..."> has no body of its own to check.
    .filter(match => !/\bsrc\s*=/i.test(match[1]))
    .map(match => match[2])
    .filter(source => source.trim().length > 0);
}

/**
 * The first syntax error in a project's own JavaScript, or null.
 *
 * Compiles, never runs. `new Function` parses the body and hands back a
 * function nobody calls, so a project that would have thrown on line one throws
 * here instead — where it can be regenerated rather than shipped.
 */
function syntaxErrorIn(html) {
  const scripts = scriptsIn(html);
  for (let i = 0; i < scripts.length; i += 1) {
    try {
      // eslint-disable-next-line no-new-func
      new Function(scripts[i]);
    } catch (error) {
      return {
        script: i + 1,
        of: scripts.length,
        message: String(error.message).slice(0, 160),
      };
    }
  }
  return null;
}

/** Markdown fences and prose the model wrapped around the file. */
function looksWrapped(html) {
  if (typeof html !== 'string') return false;
  const start = html.trimStart().slice(0, 40).toLowerCase();
  // A real file starts with a doctype or a tag. Anything else in front of it —
  // a code fence, "Here's your game!", an explanation — reaches the browser as
  // text at the top of the page.
  return !start.startsWith('<');
}

/**
 * Everything wrong with a generated project that can be known without running
 * it. Empty array means nothing found.
 */
function problemsWith(html) {
  const problems = [];

  if (typeof html !== 'string' || !html.trim()) {
    return [{ kind: 'empty', detail: 'no project was returned' }];
  }
  if (looksWrapped(html)) {
    problems.push({ kind: 'wrapped', detail: 'the file does not begin with a tag' });
  }
  if (!scriptsIn(html).length) {
    problems.push({ kind: 'no-script', detail: 'nothing in the project runs' });
  }

  const syntax = syntaxErrorIn(html);
  if (syntax) {
    problems.push({
      kind: 'syntax',
      detail: `script ${syntax.script} of ${syntax.of} will not parse: ${syntax.message}`,
    });
  }

  return problems;
}

/** True when the project's own JavaScript parses. */
function willRun(html) {
  return problemsWith(html).length === 0;
}

module.exports = { looksWrapped, problemsWith, scriptsIn, syntaxErrorIn, willRun };
