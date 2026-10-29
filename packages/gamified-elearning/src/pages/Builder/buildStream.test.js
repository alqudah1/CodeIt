import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';
import { readBuildStream, writtenShare } from './buildStream';

if (typeof global.TextDecoder === 'undefined') global.TextDecoder = NodeTextDecoder;
const encoder = new NodeTextEncoder();

// A body whose bytes arrive cut in the worst places: mid-line, mid-character.
function bodyOf(chunks) {
  const queue = chunks.map((c) => (typeof c === 'string' ? encoder.encode(c) : c));
  return { getReader: () => ({ read: async () => (queue.length ? { value: queue.shift(), done: false } : { value: undefined, done: true }) }) };
}

test('progress lines are handed over as they arrive, and the done line is returned', async () => {
  const seen = [];
  const all = `${JSON.stringify({ event: 'progress', chars: 120, lines: 4, tail: '<h1>Tic 🎲</h1>' })}\n${JSON.stringify({ event: 'progress', chars: 900, lines: 30, tail: 'x' })}\n${JSON.stringify({ event: 'done', status: 200, type: 'custom', title: 'Tic Tac Toe Showdown', html: '<html></html>' })}\n`;
  const bytes = encoder.encode(all);
  // Cut every 7 bytes, which splits the emoji and every line.
  const chunks = [];
  for (let i = 0; i < bytes.length; i += 7) chunks.push(bytes.slice(i, i + 7));
  const done = await readBuildStream(bodyOf(chunks), (p) => seen.push(p));
  expect(seen.map((p) => p.chars)).toEqual([120, 900]);
  expect(seen[0].tail).toBe('<h1>Tic 🎲</h1>');
  expect(done).toMatchObject({ event: 'done', status: 200, type: 'custom', title: 'Tic Tac Toe Showdown' });
});

test('a last line with no newline still counts, and a connection that ends early returns null', async () => {
  expect(await readBuildStream(bodyOf([JSON.stringify({ event: 'done', status: 402, code: 'FREE_AI_LIMIT_REACHED' })]))).toMatchObject({ status: 402 });
  expect(await readBuildStream(bodyOf([`${JSON.stringify({ event: 'progress', chars: 5 })}\n`, 'not json\n']))).toBeNull();
});

test('the bar moves with what was written and never claims to be finished', () => {
  expect(writtenShare(0)).toBe(8);
  expect(writtenShare(7000)).toBe(52);
  expect(writtenShare(999999)).toBe(96);
});
