// ── What Python said, in words a child can act on ───────────────────────────
//
// A missing quote mark is the first mistake everybody makes, and until now it
// was answered with a traceback: file paths inside Pyodide, a caret, and
// "unterminated string literal". That is a page an eight-year-old closes.
//
// Two rules, the same two the studio's error bar keeps:
//   1. Translated, not dressed up. Each sentence names the line and the thing
//      to look for. When the error is not one we recognise we say Python
//      stopped on that line and nothing more.
//   2. Python's own last line is always kept and shown underneath. Reading
//      "SyntaxError" next to the plain sentence is how a child learns to read
//      the real thing.
//
// The patterns are the real messages, captured from the Python this site runs.

const CLOSER = { '(': ')', '[': ']', '{': '}' };

function sentenceFor(kind, message) {
  let m;
  if (kind === 'SyntaxError') {
    if (/unterminated (triple-quoted )?string literal/.test(message)) return 'a quote mark is missing. Text needs one " at the start and one " at the end.';
    if ((m = message.match(/^'([([{])' was never closed/))) return `a bracket is missing. Every ${m[1]} needs a ${CLOSER[m[1]]} to close it.`;
    if ((m = message.match(/^unmatched '([)\]}])'/))) return `there is a ${m[1]} with nothing to close. Take it out, or add the opening one.`;
    if (/^expected ':'/.test(message)) return 'this line needs a : at the end.';
    if (/Perhaps you forgot a comma/.test(message)) return 'Python could not read this line. If those are words to say, put quote marks around them.';
    if (/Missing parentheses in call to 'print'/.test(message)) return 'print needs brackets. Write print( then your words, then ).';
    return 'Python could not read this line. Look for a missing quote mark, bracket or comma.';
  }
  if (kind === 'IndentationError' || kind === 'TabError') {
    if (/expected an indented block/.test(message)) return 'this line needs 4 spaces at the start, because it belongs to the line above it.';
    if (/unexpected indent/.test(message)) return 'this line starts with spaces it does not need. Move it back to the left edge.';
    return 'the spaces at the start of this line do not match the lines around it.';
  }
  if (kind === 'NameError' && (m = message.match(/^name '([^']+)' is not defined(?:\. Did you mean: '([^']+)'\?)?/))) {
    const [, word, meant] = m;
    if (meant && meant === word.toLowerCase()) return `Python does not know ${word}. It cares about capital letters. Try ${meant}, all in small letters.`;
    if (meant) return `Python does not know the word ${word}. Did you mean ${meant}?`;
    return `Python does not know the word ${word}. If it is text, put quote marks around it. If it is a name you made, check the spelling.`;
  }
  if (kind === 'TypeError') {
    if (/can only concatenate str/.test(message) || /unsupported operand type\(s\) for \+: '(int|float)' and 'str'/.test(message)) {
      return 'text and a number cannot be joined with +. Use a comma in print instead, like print("I am", age).';
    }
  }
  if (kind === 'ZeroDivisionError') return 'nothing can be divided by zero. Change the number under the divide sign.';
  if (kind === 'IndexError') return 'that place in the list does not exist. Lists start counting at 0.';
  if (kind === 'KeyError') return 'that key is not in the dictionary. Check the spelling of the key.';
  if (kind === 'ValueError' && /invalid literal for int\(\)/.test(message)) return 'int() can only turn digits into a number, and that text is not digits.';
  return '';
}

/**
 * Read a raw Python error.
 * Returns { line, kind, original, say }:
 *   line      the line of the child's own code, or 0 when Python did not say
 *   kind      "SyntaxError", "NameError", ...
 *   original  Python's own last line, untouched
 *   say       one sentence for a child, starting with the line when known
 */
export function explainPythonError(raw) {
  const text = String(raw || '');
  const lines = text.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
  const original = (lines[lines.length - 1] || text).trim();
  const found = original.match(/^([A-Za-z_][A-Za-z0-9_.]*(?:Error|Exception|Interrupt|Exit))(?::\s*(.*))?$/);
  const kind = found ? found[1] : '';
  const message = found ? (found[2] || '') : '';
  // The child's code is "<exec>". The last mention is the line that failed.
  const mentions = [...text.matchAll(/File "<exec>", line (\d+)/g)];
  const line = mentions.length ? Number(mentions[mentions.length - 1][1]) : 0;
  const where = line ? `Line ${line}: ` : '';
  const sentence = kind ? sentenceFor(kind, message) : '';
  const say = sentence
    ? `${where}${sentence}`
    : (line ? `Python stopped on line ${line}.` : 'Python stopped before it finished.');
  return { line, kind, original, say };
}

/** What the Output box shows: the plain sentence, then what Python really said. */
export function errorOutput(raw) {
  const { say, original, kind } = explainPythonError(raw);
  if (!kind) return String(raw || '').trim();          // not a Python error (a timeout, say): show it as it is
  return `${say}\n\nPython said: ${original}`;
}
