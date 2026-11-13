// The coloured Python editor (CodeMirror), in a file of its own.
//
// It is the largest thing a lesson needs, 185 KB in one piece, so it arrives
// as its own file. If that file does not arrive (a school filter that stops
// large scripts), the runner falls back to PlainEditor and the lesson still
// works. See editorLoader.js.
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

// A screen reader lands on the editor and has to be told what it is.
const NAMED = EditorView.contentAttributes.of({ 'aria-label': 'Your code' });

const SETUP = {
  lineNumbers: true,
  highlightActiveLine: true,
  tabSize: 4,
  indentOnInput: true,
  bracketMatching: true,
  autocompletion: false,
};

const PythonEditor = forwardRef(function PythonEditor({ value, onChange, height, theme, wrap }, ref) {
  const mirrorRef = useRef(null);

  useImperativeHandle(ref, () => ({
    // Put text where the cursor is, and keep the keyboard up.
    typeAtCursor(text) {
      const held = mirrorRef.current;
      const dom = held && held.editor && held.editor.querySelector && held.editor.querySelector('.cm-editor');
      const view = (held && held.view) || (dom && EditorView.findFromDOM(dom));
      if (!view) return false;
      // Said in full: where the text goes, and that the cursor ends up after it.
      const { from, to } = view.state.selection.main;
      const after = from + text.length;
      view.focus();
      view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: after }, scrollIntoView: true });
      // Safari keeps its own idea of where the cursor is until the next frame.
      // Saying it again then is what makes the next typed letter land after
      // the symbol, not before it.
      requestAnimationFrame(() => {
        if (view.state.selection.main.head !== after || view.state.doc.length < after) return;
        const node = view.domAtPos(after);
        const selection = view.root.getSelection ? view.root.getSelection() : window.getSelection();
        try { selection.collapse(node.node, node.offset); } catch (e) { /* the editor went away */ }
      });
      return true;
    },
  }), []);

  return (
    <CodeMirror
      ref={mirrorRef}
      value={value}
      height={height}
      theme={theme === 'dark' ? 'dark' : 'light'}
      extensions={wrap ? [python(), NAMED, EditorView.lineWrapping] : [python(), NAMED]}
      onChange={(text) => onChange(text)}
      basicSetup={SETUP}
    />
  );
});

export default PythonEditor;
