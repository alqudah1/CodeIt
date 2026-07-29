import { fireEvent, render, screen } from '@testing-library/react';
import CreatorBrief from './CreatorBrief';
import { useSEO } from '../../hooks/useSEO';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
  };
}, { virtual: true });
jest.mock('../../components/BrandLogo/BrandLogo', () => (props) => <img alt="CodeIt" {...props} />);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));

describe('CreatorBrief', () => {
  beforeEach(() => {
    useSEO.mockClear();
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  test('is unlisted from search and explains the product in one sentence', () => {
    render(<CreatorBrief />);

    expect(useSEO).toHaveBeenCalledWith(expect.objectContaining({ robots: 'noindex,nofollow' }));
    expect(screen.getByText(/CodeIt helps students turn an idea into a real website/i)).toBeInTheDocument();
    expect(screen.getByText('One continuous story. No feature dump.')).toBeInTheDocument();
  });

  test('provides only privacy-safe channel links', () => {
    render(<CreatorBrief />);

    expect(screen.getByText('Young creators ages 8–17')).toBeInTheDocument();
    expect(screen.getByText(/Parents can create private managed profiles for ages 8–12/i)).toBeInTheDocument();
    expect(screen.getByText('Five links. One website.')).toBeInTheDocument();
    expect(screen.getByText(/LinkedIn for founder or investor posts/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct sharing for WhatsApp, email, or messages/i)).toBeInTheDocument();
    const instagram = screen.getByLabelText('Instagram campaign link');
    const tiktok = screen.getByLabelText('TikTok campaign link');
    const linkedin = screen.getByLabelText('LinkedIn campaign link');
    expect(instagram).toHaveValue('https://codeitlearn.com/?utm_source=instagram&utm_medium=creator');
    expect(tiktok).toHaveValue('https://codeitlearn.com/?utm_source=tiktok&utm_medium=creator');
    expect(linkedin).toHaveValue('https://codeitlearn.com/?utm_source=linkedin&utm_medium=founder');
    expect(instagram.value).not.toContain('utm_campaign');
  });

  test('copies the selected campaign link', async () => {
    render(<CreatorBrief />);

    const buttons = screen.getAllByRole('button', { name: 'Copy link' });
    fireEvent.click(buttons[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://codeitlearn.com/?utm_source=instagram&utm_medium=creator'
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Copied');
  });

  test('keeps planned product claims clearly separated', () => {
    render(<CreatorBrief />);

    expect(screen.getByText('Say this')).toBeInTheDocument();
    expect(screen.getByText('Label this as planned')).toBeInTheDocument();
    expect(screen.getByText(/billing is not live/i)).toBeInTheDocument();
    expect(screen.getByText(/confirmed parents can receive selected milestone emails/i)).toBeInTheDocument();
  });
});
