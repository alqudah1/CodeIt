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
// after a colon, and the symbol keys putting text where the cursor is. It does
// not colour the code. Working plainly beats not working.
import React, { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import './PlainEditor.css';

const INDENT = '    ';

/** What Enter should type: a new line, the same indent, one more after a colon. */
export function newlineFor(before) {
  const line = before.slice(before.lastIndexOf('\n') + 1);
  const indent = /^[ \t]*/.exec(line)[0];
  const opens = /:\s*(#.*)?$/.test(line);
  return '\n' + indent + (opens ? INDENT : '');
}

const PlainEditor = forwardRef(function PlainEditor(
  { value = '', onChange, height = '220px', theme = 'light', label = 'Your code', indent = INDENT },
  ref,
) {
  const area = useRef(null);
  const gutter = useRef(null);
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
    <div className={`plain-editor${theme === 'dark' ? ' plain-editor--dark' : ''}`} style={{ height }} data-plain-editor="1">
      <div className="plain-editor__numbers" ref={gutter} aria-hidden="true">
        {numbers.map((n) => <span key={n}>{n}</span>)}
      </div>
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
        onScroll={(event) => { if (gutter.current) gutter.current.scrollTop = event.target.scrollTop; }}
      />
    </div>
  );
});

export default PlainEditor;
