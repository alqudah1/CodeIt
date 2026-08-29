// The editor itself, split out so it can be lazy-loaded.
//
// CodeMirror plus the HTML/CSS/JS grammars is a real chunk of JavaScript, and a
// child who spends the whole session on the Play tab should never download it.
// Keeping it in its own module is what lets CodePanel pull it in only when the
// code tab is opened.

import { useCallback, useRef } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';

export default function CodeEditor({ value, onChange, openAtLine = 1 }) {
  const jumped = useRef(false);

  // ── Open where the child's code is ─────────────────────────────────────────
  //
  // CodeMirror opens at line 1, which in a generated project is <!doctype
  // html>, then <head>, then sixty lines of CSS. Scroll to the line that is
  // actually theirs — once, on first mount, so it never fights a child who has
  // since scrolled somewhere else themselves.
  const jumpToTheirCode = useCallback(view => {
    if (!view || jumped.current || openAtLine <= 1) return;
    jumped.current = true;
    try {
      const line = view.state.doc.line(Math.min(openAtLine, view.state.doc.lines));
      view.dispatch({
        selection: { anchor: line.from },
        effects: EditorView.scrollIntoView(line.from, { y: 'start', yMargin: 12 }),
      });
    } catch {
      // A file shorter than we thought is not worth breaking the editor over.
    }
  }, [openAtLine]);

  return (
    <CodeMirror
      value={value}
      height="380px"
      theme="light"
      onCreateEditor={jumpToTheirCode}
      // Wrapping, because most of these children are on a phone. Generated code
      // has long lines, and a nine-year-old who has to scroll sideways to read
      // the end of a line will not read the end of the line.
      extensions={[html(), EditorView.lineWrapping]}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        tabSize: 2,
        indentOnInput: true,
        bracketMatching: true,
        // Off on purpose. An autocomplete popup jumping in front of what a
        // child is typing is confusing rather than helpful at this age, and it
        // covers the very code they are trying to read.
        autocompletion: false,
        foldGutter: false,
      }}
    />
  );
}
