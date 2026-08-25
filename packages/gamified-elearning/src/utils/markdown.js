/**
 * markdown.js — a deliberately small Markdown renderer.
 *
 * Why not a library: this runs in two places that must agree exactly — the
 * React app, and the CommonJS static-SEO build script that inlines the same
 * content into crawlable HTML. Sharing one dependency-free module keeps them
 * identical and keeps the bundle unchanged.
 *
 * It supports only what the guide pages actually use: headings, paragraphs,
 * bullet and numbered lists, tables, blockquotes, fenced code, horizontal
 * rules, and inline bold / italic / code / links. Anything else is escaped and
 * passed through as text rather than silently mangled.
 */

// A sentinel from the Unicode private-use area: it cannot occur in authored
// Markdown, so code spans can be lifted out and put back without a collision.
const CODE_MARK = '\uE000';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Inline formatting. Code spans are extracted first so their contents are literal. */
function inline(text) {
  const codeSpans = [];
  let out = String(text).replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(code);
    return `${CODE_MARK}CODE${codeSpans.length - 1}${CODE_MARK}`;
  });

  out = escapeHtml(out);

  // [label](href) — only http(s), mailto and site-relative targets.
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, href) => {
    if (!/^(https?:\/\/|mailto:|\/)/i.test(href)) return match;
    const external = /^https?:\/\//i.test(href);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escapeHtml(href)}"${attrs}>${label}</a>`;
  });

  out = out
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>');

  return out.replace(new RegExp(`${CODE_MARK}CODE(\\d+)${CODE_MARK}`, 'g'), (_, i) => `<code>${escapeHtml(codeSpans[Number(i)])}</code>`);
}

function isTableDivider(line) {
  return /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-');
}

function splitRow(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
}

export default function markdownToHtml(markdown) {
  if (!markdown) return '';

  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;

  const flushParagraph = (buffer) => {
    if (buffer.length) {
      html.push(`<p>${inline(buffer.join(' '))}</p>`);
      buffer.length = 0;
    }
  };
  const paragraph = [];

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code
    if (/^\s*```/.test(line)) {
      flushParagraph(paragraph);
      const code = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    // Table: a header row followed by a divider row
    if (line.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      flushParagraph(paragraph);
      const head = splitRow(line);
      i += 2;
      const body = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        body.push(splitRow(lines[i]));
        i += 1;
      }
      const thead = `<thead><tr>${head.map((c) => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${body
        .map((row) => `<tr>${row.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody>`;
      html.push(`<div class="md-table-scroll"><table>${thead}${tbody}</table></div>`);
      continue;
    }

    // Headings
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph(paragraph);
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushParagraph(paragraph);
      html.push('<hr />');
      i += 1;
      continue;
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      flushParagraph(paragraph);
      const quote = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      html.push(`<blockquote>${markdownToHtml(quote.join('\n'))}</blockquote>`);
      continue;
    }

    // Lists
    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushParagraph(paragraph);
      const ordered = Boolean(numbered);
      const items = [];
      while (i < lines.length) {
        const match = ordered
          ? /^\s*\d+[.)]\s+(.*)$/.exec(lines[i])
          : /^\s*[-*+]\s+(.*)$/.exec(lines[i]);
        if (!match) break;
        items.push(`<li>${inline(match[1])}</li>`);
        i += 1;
      }
      html.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
      continue;
    }

    // Blank line ends a paragraph
    if (!line.trim()) {
      flushParagraph(paragraph);
      i += 1;
      continue;
    }

    paragraph.push(line.trim());
    i += 1;
  }

  flushParagraph(paragraph);
  return html.join('\n');
}
