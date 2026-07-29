import { fireEvent, render, screen } from '@testing-library/react';
import FirstWinPanel from './FirstWinPanel';
import { trackEvent } from '../../utils/trackEvent';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
  };
}, { virtual: true });
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));

describe('FirstWinPanel', () => {
  beforeEach(() => trackEvent.mockClear());

  test('offers one guided learning start and a creative alternative', () => {
    render(<FirstWinPanel token="student-token" />);

    expect(screen.getByRole('heading', { name: 'Get your first win in about 10 minutes.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Start Lesson 1/ })).toHaveAttribute('href', '/lesson/1');
    expect(screen.getByRole('link', { name: 'I want to build first' })).toHaveAttribute('href', '/builder');
    expect(screen.getByText('Finish Lesson 1')).toBeInTheDocument();
  });

  test('measures the selected lesson start without storing lesson content', () => {
    render(<FirstWinPanel token="student-token" />);
    fireEvent.click(screen.getByRole('link', { name: /Start Lesson 1/ }));

    expect(trackEvent).toHaveBeenCalledWith('learning_start', 'lesson-one', 'student-token');
  });
});
