// A code editor with nothing underneath it but the browser.
//
// The coloured editor is a library, and its main file is 185 KB that cannot be
// cut smaller. On 13 November 2026 a school's web filter was stopping every
// large script, so on that network the editor could never arrive, and a lesson
// with no editor is not a lesson. This is what a pupil types into when that
// happens, and it is all the small-files version of CodeIt ever uses.
//
// It keeps the things a child would miss: line numbers (error messages say
// "line 3"), Tab for four spaces, Enter keeping the indent and adding one
// after a colon, and the symbol keys putting text where the cursor is.
//
// Python is coloured too, in the simplest way there is: the same text is
// painted, in colour, exactly underneath a textarea whose own letters are
// see-through. A whole school behind a filter types into this editor every
// lesson, and code that is all one colour is harder for a beginner to read:
// a quote mark left open stops looking like a mistake.
import React, { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import './PlainEditor.css';

const INDENT = '    ';

// ── Colouring Python ────────────────────────────────────────────────────────
//
// Five kinds of thing, found with one pattern: a comment, a string (finished
// or not), a number, a word Python owns, and a built-in being called. Not a
// parser, and it does not need to be: it only decides what colour a letter is.
const PYTHON = new RegExp([
  '(#[^\\n]*)',
  '("""[\\s\\S]*?(?:"""|$)|\'\'\'[\\s\\S]*?(?:\'\'\'|$)|"(?:\\\\.|[^"\\\\\\n])*"?|\'(?:\\\\.|[^\'\\\\\\n])*\'?)',
  '\\b(\\d+(?:\\.\\d+)?)\\b',
  '\\b(def|return|if|elif|else|for|while|in|not|and|or|import|from|as|class|try|except|finally|with|pass|break|continue|global|lambda|is|True|False|None)\\b',
  '\\b(print|len|range|int|str|float|input|list|dict|set|tuple|enumerate|zip|sum|min|max|sorted|round|abs|type)(?=\\()',
].join('|'), 'g');
const KINDS = [null, 'comment', 'string', 'number', 'keyword', 'builtin'];

/** The text as a list of [kind, text] pieces. Joined back together it is the text, letter for letter. */
export function paintPython(text) {
  const pieces = [];
  let at = 0;
  PYTHON.lastIndex = 0;
  let found = PYTHON.exec(text);
  while (found) {
    if (found[0] === '') { PYTHON.lastIndex += 1; found = PYTHON.exec(text); continue; }
    if (found.index > at) pieces.push(['plain', text.slice(at, found.index)]);
    let kind = 'plain';
    for (let group = 1; group < KINDS.length; group += 1) if (found[group] !== undefined) kind = KINDS[group];
    pieces.push([kind, found[0]]);
    at = found.index + found[0].length;
    found = PYTHON.exec(text);
  }
  if (at < text.length) pieces.push(['plain', text.slice(at)]);
  return pieces;
}

/** What Enter should type: a new line, the same indent, one more after a colon. */
export function newlineFor(before) {
  const line = before.slice(before.lastIndexOf('\n') + 1);
  const indent = /^[ \t]*/.exec(line)[0];
  const opens = /:\s*(#.*)?$/.test(line);
  return '\n' + indent + (opens ? INDENT : '');
}

const PlainEditor = forwardRef(function PlainEditor(
  { value = '', onChange, height = '220px', theme = 'light', label = 'Your code', indent = INDENT, language = 'python' },
  ref,
) {
  const area = useRef(null);
  const gutter = useRef(null);
  const paint = useRef(null);
  const coloured = language === 'python';
  const caret = useRef(null);   // where the cursor belongs once the new text is on screen

  // The textarea shows what it is given, so after a change that this file
  // made (a symbol key, Tab, Enter) the cursor has to be put back by hand.
  useLayoutEffect(() => {
    if (caret.current === null || !area.current) return;
    const at = caret.current;
    caret.current = null;
    try { area.current.setSelectionRange(at, at); } catch (e) { /* not focused: nothing to place */ }
  }, [value]);

  const put = useCallback((text, from, to) => {
    const el = area.current;
    if (!el) return false;
    const start = from === undefined ? el.selectionStart : from;
    const end = to === undefined ? el.selectionEnd : to;
    const now = el.value;
    caret.current = start + text.length;
    if (onChange) onChange(now.slice(0, start) + text + now.slice(end));
    return true;
  }, [onChange]);

  useImperativeHandle(ref, () => ({
    typeAtCursor(text) {
      const el = area.current;
      if (!el) return false;
      el.focus();
      return put(text);
    },
  }), [put]);

  const onKeyDown = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;   // Ctrl+Enter is Run, and belongs to the runner
    const el = event.target;
    const { selectionStart: from, selectionEnd: to, value: text } = el;
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      put(indent);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      put(newlineFor(text.slice(0, from)));
    } else if (event.key === 'Backspace' && from === to && from >= indent.length) {
      // One press takes a whole indent back, the way it was put in.
      const lineStart = text.lastIndexOf('\n', from - 1) + 1;
      const lead = text.slice(lineStart, from);
      if (lead.length && /^ +$/.test(lead) && lead.length % indent.length === 0) {
        event.preventDefault();
        put('', from - indent.length, from);
      }
    }
  };

  const lines = value.split('\n').length;
  const numbers = [];
  for (let n = 1; n <= lines; n += 1) numbers.push(n);

  return (
    <div className={`plain-editor${theme === 'dark' ? ' plain-editor--dark' : ''}${coloured ? ' plain-editor--coloured' : ''}`} style={{ height }} data-plain-editor="1">
      <div className="plain-editor__numbers" ref={gutter} aria-hidden="true">
        {numbers.map((n) => <span key={n}>{n}</span>)}
      </div>
      <div className="plain-editor__code">
        {coloured && (
          // The same text, in colour, exactly under the textarea. One more
          // line is added so the copy is never shorter than what it sits under.
          <pre className="plain-editor__paint" ref={paint} aria-hidden="true">
            {paintPython(value).map(([kind, piece], index) => (
              // eslint-disable-next-line react/no-array-index-key
              kind === 'plain' ? piece : <span key={index} className={`pe-${kind}`}>{piece}</span>
            ))}
            {'\n '}
          </pre>
        )}
        <textarea
          ref={area}
          className="plain-editor__text"
          value={value}
          aria-label={label}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          wrap="off"
          onChange={(event) => onChange && onChange(event.target.value)}
          onKeyDown={onKeyDown}
          onScroll={(event) => {
            if (gutter.current) gutter.current.scrollTop = event.target.scrollTop;
            if (paint.current) { paint.current.scrollTop = event.target.scrollTop; paint.current.scrollLeft = event.target.scrollLeft; }
          }}
        />
      </div>
    </div>
  );
});

export default PlainEditor;
