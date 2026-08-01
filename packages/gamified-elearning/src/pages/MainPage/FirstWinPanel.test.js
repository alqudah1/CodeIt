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

  test('leads with a first project and keeps a guided lesson alternative', () => {
    render(<FirstWinPanel token="student-token" />);

    expect(screen.getByRole('heading', { name: 'Make something you can play in about 10 minutes.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Build my first project/ })).toHaveAttribute('href', '/builder?welcome=1');
    expect(screen.getByRole('link', { name: 'Start with Lesson 1' })).toHaveAttribute('href', '/lesson/1');
    expect(screen.getByText('Change it and save it')).toBeInTheDocument();
  });

  test('measures the selected lesson start without storing lesson content', () => {
    render(<FirstWinPanel token="student-token" />);
    fireEvent.click(screen.getByRole('link', { name: 'Start with Lesson 1' }));

    expect(trackEvent).toHaveBeenCalledWith('learning_start', 'lesson-one', 'student-token');
  });
});
