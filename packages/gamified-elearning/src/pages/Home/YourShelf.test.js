import { render, screen } from '@testing-library/react';
import YourShelf from './YourShelf';

// react-router v7 does not resolve under this jest setup, so the rest of the
// suite stubs it. Same pattern here: Link becomes a plain anchor, which is all
// this component asks of it and all these tests check.
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, onClick, ...props }) => React.createElement('a', {
      href: to,
      onClick: (event) => { event.preventDefault(); onClick?.(event); },
      ...props,
    }, children),
  };
}, { virtual: true });

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

const project = (over = {}) => ({
  id: 'p1',
  title: 'Catch the falling stars',
  prompt: 'a star catching game',
  projectType: 'game',
  code: '<!doctype html><html><body><canvas></canvas></body></html>',
  savedAt: NOW,
  updatedAt: NOW,
  ...over,
});

const show = (projects, now = NOW) => render(<YourShelf projects={projects} now={now} />);

describe('a child who has never made anything', () => {
  test('sees nothing at all, rather than an empty box', () => {
    const { container } = show([]);
    expect(container).toBeEmptyDOMElement();
  });

  test('and nothing breaks if it is handed nothing', () => {
    const { container } = render(<YourShelf />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('a child coming back to one project', () => {
  test('is told their work is here, in the singular', () => {
    show([project()]);
    expect(screen.getByText('Your project is here')).toBeInTheDocument();
  });

  test('sees the name they gave it', () => {
    show([project({ title: 'My football game' })]);
    expect(screen.getByText('My football game')).toBeInTheDocument();
  });

  test('is told when they made it, in words a child uses', () => {
    show([project({ updatedAt: NOW - DAY })]);
    expect(screen.getByText('You made this yesterday')).toBeInTheDocument();
  });

  test('gets a link straight back into it', () => {
    show([project({ id: 'abc123' })]);
    expect(screen.getByRole('link', { name: /Catch the falling stars/ }))
      .toHaveAttribute('href', '/builder?shelf=abc123');
  });

  test('sees the project itself running, not a picture of one', () => {
    const { container } = show([project()]);
    const preview = container.querySelector('.shelf__preview');
    expect(preview).toBeTruthy();
    expect(preview.getAttribute('srcdoc')).toContain('<canvas>');
  });
});

describe('the preview is a reminder, not the game', () => {
  test('it cannot be tapped, so the tap opens the studio instead', () => {
    const { container } = show([project()]);
    expect(container.querySelector('.shelf__preview')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.shelf__preview')).toHaveAttribute('tabindex', '-1');
  });

  test('it is sandboxed, like every other place we run generated code', () => {
    const { container } = show([project()]);
    expect(container.querySelector('.shelf__preview').getAttribute('sandbox')).toBe('allow-scripts');
  });
});

describe('a child coming back to several projects', () => {
  const many = [
    project({ id: 'a', title: 'Penalty shootout', updatedAt: NOW }),
    project({ id: 'b', title: 'Catch the falling stars', updatedAt: NOW - DAY }),
    project({ id: 'c', title: 'Asteroid dodge', updatedAt: NOW - 3 * DAY }),
  ];

  test('is told in the plural', () => {
    show(many);
    expect(screen.getByText('Your projects are here')).toBeInTheDocument();
  });

  test('the newest one is the big one, because it is what they were doing', () => {
    const { container } = show(many);
    expect(container.querySelector('.shelf__name').textContent).toBe('Penalty shootout');
  });

  test('the rest are still reachable', () => {
    show(many);
    expect(screen.getByRole('link', { name: /Catch the falling stars/ }))
      .toHaveAttribute('href', '/builder?shelf=b');
    expect(screen.getByRole('link', { name: /Asteroid dodge/ }))
      .toHaveAttribute('href', '/builder?shelf=c');
  });

  test('only one preview runs, so the front page does not start three games', () => {
    const { container } = show(many);
    expect(container.querySelectorAll('.shelf__preview')).toHaveLength(1);
  });
});

describe('being honest about where this is kept', () => {
  test('it says the work lives in this browser and how to keep it properly', () => {
    show([project()]);
    const note = screen.getByText(/Kept in this browser/);
    expect(note).toHaveTextContent('for a week');
    expect(note).toHaveTextContent('free account');
  });
});
