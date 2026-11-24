import { fireEvent, render, screen } from '@testing-library/react';
import LearnPythonForKids from './LearnPythonForKids';
import { trackEvent } from '../../utils/trackEvent';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../hooks/useFAQSchema', () => ({ useFAQSchema: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));

describe('free Python learning landing page', () => {
  beforeEach(() => trackEvent.mockClear());

  test('sends beginners directly to Lesson 1 and measures the entry point', () => {
    render(<LearnPythonForKids />);

    const startLinks = screen.getAllByRole('link', { name: /Lesson 1/i });
    expect(startLinks[0]).toHaveAttribute('href', '/lesson/1');
    expect(screen.getByText(/no download or signup needed for Lesson 1/i)).toBeInTheDocument();

    fireEvent.click(startLinks[0]);
    expect(trackEvent).toHaveBeenCalledWith('learning_start', 'lesson-one');
  });

  test('offers a measurable no-account playground path', () => {
    render(<LearnPythonForKids />);

    fireEvent.click(screen.getByRole('link', { name: 'Try Python in the playground' }));
    expect(trackEvent).toHaveBeenCalledWith('learning_start', 'playground');
  });
});

// 21 November 2026: two claims on this page had no source, and one of them
// was in the FAQ that search engines are given.
describe('claims nobody could point to a source for', () => {
  const fs = require('fs');
  const path = require('path');
  // The page and the questions it shows, which since 24 November 2026 are in
  // the file the crawlable copy reads as well.
  const source = fs.readFileSync(path.join(__dirname, 'LearnPythonForKids.js'), 'utf8')
    + '\n' + fs.readFileSync(path.join(__dirname, '../../data/learnPythonFaqs.js'), 'utf8');
  const code = source.split('\n').filter((line) => !line.trim().startsWith('//')).join('\n');

  test('no ranking, no company names, no count of lines in other languages', () => {
    expect(code).not.toMatch(/consistently ranked/i);
    expect(code).not.toMatch(/best first programming language/i);
    expect(code).not.toMatch(/NASA|YouTube|at Google/);
    expect(code).not.toMatch(/used everywhere/i);
    expect(code).not.toMatch(/ten\s+lines/i);
  });

  test('what it says instead can be stood behind', () => {
    expect(code).toMatch(/Python reads close to English, so a child can focus on the idea rather than the punctuation\./);
    expect(code).toMatch(/Adults use Python for real work in data, science and automation; it is not a toy/);
  });
});

describe('the questions on the page', () => {
  test('are the ones in the shared file, all of them, and the same list goes to the FAQ schema', () => {
    const learnPythonFaqs = require('../../data/learnPythonFaqs').default;
    const { useFAQSchema } = require('../../hooks/useFAQSchema');
    const expected = learnPythonFaqs({ agesStatement: 'x', price: 'CA$12', interval: 'month' }).map((f) => f.q);
    render(<LearnPythonForKids />);
    expected.forEach((q) => expect(screen.getByText(q)).toBeInTheDocument());
    expect(useFAQSchema.mock.calls[useFAQSchema.mock.calls.length - 1][0].map((f) => f.q)).toEqual(expected);
    expect(document.body.textContent).not.toMatch(/20 to 30 minutes/);
  });
});
