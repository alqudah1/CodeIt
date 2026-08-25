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

    expect(screen.getByText('Young creators ages 5 to 18')).toBeInTheDocument();
    expect(screen.getByText(/Parents can create private managed profiles for ages 5 to 12/i)).toBeInTheDocument();
    expect(screen.getByText('Five links. One measurable campaign.')).toBeInTheDocument();
    expect(screen.getByText(/LinkedIn for founder posts/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct sharing for WhatsApp, email, or messages/i)).toBeInTheDocument();
    const instagram = screen.getByLabelText('Instagram campaign link');
    const tiktok = screen.getByLabelText('TikTok campaign link');
    const linkedin = screen.getByLabelText('LinkedIn campaign link');
    expect(instagram).toHaveValue('https://codeitlearn.com/pricing?utm_source=instagram&utm_medium=creator&utm_campaign=creator-01#family-pilot');
    expect(tiktok).toHaveValue('https://codeitlearn.com/pricing?utm_source=tiktok&utm_medium=creator&utm_campaign=creator-01#family-pilot');
    expect(linkedin).toHaveValue('https://codeitlearn.com/pricing?utm_source=linkedin&utm_medium=founder&utm_campaign=creator-01#family-pilot');

    fireEvent.change(screen.getByLabelText('Campaign code'), { target: { value: 'Summer Creator!' } });
    expect(instagram).toHaveValue('https://codeitlearn.com/pricing?utm_source=instagram&utm_medium=creator&utm_campaign=summer-creator#family-pilot');
  });

  test('copies the selected campaign link', async () => {
    render(<CreatorBrief />);

    const buttons = screen.getAllByRole('button', { name: 'Copy link' });
    fireEvent.click(buttons[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://codeitlearn.com/pricing?utm_source=instagram&utm_medium=creator#family-pilot'
        .replace('#family-pilot', '&utm_campaign=creator-01#family-pilot')
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Copied');
  });

  test('keeps planned product claims clearly separated', () => {
    render(<CreatorBrief />);

    expect(screen.getByText('Say this')).toBeInTheDocument();
    expect(screen.getByText('Label this as planned')).toBeInTheDocument();
    expect(screen.getByText(/live and cancellable at any time/i)).toBeInTheDocument();
    expect(screen.getByText(/free family pilot requests are open with no card/i)).toBeInTheDocument();
    expect(screen.getByText(/confirmed parents can receive selected milestone emails/i)).toBeInTheDocument();
  });

  test('provides an exact launch script and measurable seven-day test', () => {
    render(<CreatorBrief />);

    expect(screen.getByText('One 30-second video that explains the whole product.')).toBeInTheDocument();
    expect(screen.getByText('Show the finished project')).toBeInTheDocument();
    expect(screen.getByText(/Parents can request a free family pilot spot at codeitlearn.com/i)).toBeInTheDocument();
    expect(screen.getByText('Four posts. One learning question at a time.')).toBeInTheDocument();
    expect(screen.getByLabelText('First campaign decision targets')).toHaveTextContent('100qualified visits');
    expect(screen.getByLabelText('First campaign decision targets')).toHaveTextContent('20own-idea starts');
    expect(screen.getByLabelText('First campaign decision targets')).toHaveTextContent('3family pilot requests');
    expect(screen.getByText(/Decision targets for the first test/i)).toBeInTheDocument();
  });
});
