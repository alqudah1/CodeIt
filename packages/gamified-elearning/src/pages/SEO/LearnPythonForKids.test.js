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
