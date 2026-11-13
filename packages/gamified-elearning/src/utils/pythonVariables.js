// ── What is in the boxes ────────────────────────────────────────────────────
//
// A lesson about variables shows them: every name the child's code assigns
// becomes a labelled box on the stage with its value inside. The values are
// not guessed from the text of the code. After the run, Python itself is
// asked what each name holds, so `score = 10` then `score = score + 5` shows
// 15, because that is what is in the box.
//
// Only names the code assigns at the start of a line are asked for, in the
// order they first appear, and only a handful: a shelf, not a debugger.

const ASSIGN = /^[ \t]*([A-Za-z_][A-Za-z0-9_]*)[ \t]*(?:[-+*/]|\/\/|%)?=(?!=)/gm;
// Several names filled at once: width, height = screen
const UNPACK = /^[ \t]*([A-Za-z_][A-Za-z0-9_]*(?:[ \t]*,[ \t]*[A-Za-z_][A-Za-z0-9_]*)+)[ \t]*=(?!=)/gm;
const MOST = 6;
const SLOTS = 6;        // items of a list shown as slots; the rest are counted

/** The names a piece of code assigns, in order, without repeats. */
export function assignedNames(code) {
  const names = [];
  const found = [];   // [where in the code, name], so the shelf keeps the order the code made them in
  String(code || '').replace(ASSIGN, (whole, name, at) => { found.push([at, name]); return whole; });
  String(code || '').replace(UNPACK, (whole, group, at) => { group.split(',').forEach((name, i) => found.push([at + i / 100, name.trim()])); return whole; });
  found.sort((a, b) => a[0] - b[0]);
  for (const [, name] of found) if (!names.includes(name)) names.push(name);
  return names.slice(0, MOST);
}

/** How a value is written on its box: text keeps its quote marks, like in the code. */
export function boxText(type, value) {
  const text = String(value);
  const short = text.length > 28 ? `${text.slice(0, 27)}…` : text;
  return type === 'str' ? `"${short}"` : short;
}

/**
 * Ask a running Python what the assigned names hold.
 * Returns [{ name, type, text }]; an empty list if anything goes wrong, since
 * a shelf that cannot be read is an empty shelf, never an error for a child.
 */
export function readVariables(py, code) {
  const names = assignedNames(code);
  if (!py || !names.length) return [];
  try {
    // A list comes back with its first few items as well, so the stage can
    // lay it out as slots with their numbers under them.
    const source = [
      'import json as __codeit_json',
      'def __codeit_show(v):',
      '    return v if isinstance(v, str) else repr(v)',
      'def __codeit_box(k):',
      '    v = globals()[k]',
      '    box = {"name": k, "type": type(v).__name__, "value": __codeit_show(v)}',
      '    if isinstance(v, list):',
      `        box["items"] = [[type(x).__name__, __codeit_show(x)] for x in v[:${SLOTS}]]`,
      `        box["more"] = max(0, len(v) - ${SLOTS})`,
      '    if isinstance(v, dict):',
      `        box["items"] = [[type(x).__name__, __codeit_show(x)] for x in list(v.values())[:${SLOTS}]]`,
      `        box["labels"] = [str(k) for k in list(v.keys())[:${SLOTS}]]`,
      `        box["more"] = max(0, len(v) - ${SLOTS})`,
      '    return box',
      `__codeit_json.dumps([__codeit_box(k) for k in ${JSON.stringify(names)} if k in globals()])`,
    ].join('\n');
    const rows = JSON.parse(py.runPython(source));
    return rows.map((row) => {
      const box = { name: row.name, type: row.type, text: boxText(row.type, row.value) };
      if (Array.isArray(row.items)) { box.items = row.items.map(([type, value]) => boxText(type, value)); box.more = Number(row.more) || 0; }
      // A dictionary's slots are named, not numbered.
      if (Array.isArray(row.labels)) box.labels = row.labels.map(String);
      return box;
    });
  } catch (e) {
    return [];
  }
}
