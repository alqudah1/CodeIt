import { act, fireEvent, render, screen } from '@testing-library/react';
import CodePanel from './CodePanel';

// ── "Change anything and it runs straight away", where a child can see it ───
//
// 15 November 2026, on the live site: a sentence game, opened in the studio,
// The code tab, speed changed from 2 to 3. The game did restart at speed 3.
// It was 800 pixels above the editor, off the top of the screen, on a phone
// and on a desktop. The child was looking at a line of text.
//
// And on that first change the editor moved: a card far above it grew, and
// the line under the cursor dropped 153 pixels (257 on a phone).

jest.mock('./CodeEditor', () => ({
  __esModule: true,
  default: ({ value, onChange }) => <textarea aria-label="Your project's code" value={value} onChange={(e) => onChange(e.target.value)} />,
}));

const GAME = '<!doctype html><html><body><script>let speed = 2;</script></body></html>';

describe('the project runs, small, right above the code', () => {
  test('a second copy of the preview, for the eyes only', async () => {
    const { container } = render(<CodePanel code={GAME} liveDoc={`<!-- prepared -->${GAME}`} isGame onPlay={() => {}} />);
    await screen.findByLabelText("Your project's code");
    const frame = container.querySelector('.cp__live-frame');
    expect(frame).toHaveAttribute('srcdoc', `<!-- prepared -->${GAME}`);
    // Scripts and nothing else: no forms, no pointer lock, no same origin.
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts');
    // Not a second thing to tab into or read out. The real one is on Play.
    expect(frame).toHaveAttribute('tabindex', '-1');
    expect(container.querySelector('.cp__live-screen')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.cp__live-words')).toHaveTextContent('Your game, live');
    expect(container.querySelector('.cp__live-words')).toHaveTextContent('It starts again each time your code changes. Change a number and watch.');
    // It sits above the editor, so both are on the screen together.
    const editor = container.querySelector('.cp__editor');
    expect(container.querySelector('.cp__live').compareDocumentPosition(editor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('it follows the code that is running', async () => {
    const { container, rerender } = render(<CodePanel code={GAME} liveDoc={GAME} isGame />);
    await screen.findByLabelText("Your project's code");
    const faster = GAME.replace('speed = 2', 'speed = 3');
    rerender(<CodePanel code={faster} liveDoc={faster} isGame />);
    expect(container.querySelector('.cp__live-frame').getAttribute('srcdoc')).toContain('let speed = 3;');
  });

  test('Play it goes to the real game', async () => {
    const onPlay = jest.fn();
    render(<CodePanel code={GAME} liveDoc={GAME} isGame onPlay={onPlay} />);
    await screen.findByLabelText("Your project's code");
    fireEvent.click(screen.getByRole('button', { name: 'Play it' }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  test('a website is not called a game', async () => {
    const { container } = render(<CodePanel code="<h1>Hi</h1>" liveDoc="<h1>Hi</h1>" onPlay={() => {}} />);
    await screen.findByLabelText("Your project's code");
    expect(container.querySelector('.cp__live-words')).toHaveTextContent('Your project, live');
    expect(screen.getByRole('button', { name: 'Open it' })).toBeInTheDocument();
  });

  test('with nothing to show there is no empty screen', async () => {
    const { container } = render(<CodePanel code={GAME} />);
    await screen.findByLabelText("Your project's code");
    expect(container.querySelector('.cp__live')).toBeNull();
  });

  test('the small screen is the same size on a desktop and smaller on a phone, in the stylesheet', () => {
    const css = require('fs').readFileSync(require('path').join(__dirname, 'CodePanel.css'), 'utf8');
    expect(css).toMatch(/\.cp__live-frame \{[^}]*pointer-events: none/);
    expect(css).toMatch(/@media \(max-width: 640px\) \{[^@]*\.cp__live-screen \{ width: 160px; height: 100px; \}/);
  });
});

describe('the line being typed on stays where it is', () => {
  let settle;
  let top;
  beforeEach(() => {
    top = 400;
    settle = null;
    global.ResizeObserver = class {
      constructor(callback) { settle = callback; }
      observe() {}
      disconnect() {}
    };
    window.scrollBy = jest.fn();
  });
  afterEach(() => { delete global.ResizeObserver; });

  async function open() {
    const view = render(<div><CodePanel code={GAME} liveDoc={GAME} isGame /></div>);
    const box = await screen.findByLabelText("Your project's code");
    // The first measurement was taken when the panel was drawn, before this
    // stand-in was in place, so tell it where the panel is now.
    view.container.querySelector('.cp').getBoundingClientRect = () => ({ top });
    act(() => { window.dispatchEvent(new Event('scroll')); });
    return { ...view, box };
  }

  test('a card above grows while the child is typing: the page is scrolled by the same amount', async () => {
    const { box } = await open();
    box.focus();
    top = 553;   // pushed down 153 pixels by something above
    act(() => settle());
    expect(window.scrollBy).toHaveBeenCalledWith(0, 153);
  });

  test('not typing in the code: the page is left alone', async () => {
    await open();
    top = 553;
    act(() => settle());
    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  test('the child scrolls: that is not something to undo', async () => {
    const { box } = await open();
    box.focus();
    top = 100;
    act(() => { window.dispatchEvent(new Event('scroll')); });
    act(() => settle());
    expect(window.scrollBy).not.toHaveBeenCalled();
  });
});
