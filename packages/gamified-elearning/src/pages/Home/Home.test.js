import { fireEvent, render, screen } from '@testing-library/react';
import Home from './Home';
import { TOTAL_LESSONS } from '../Lessons/lessonRegistry';
import { STARTER_PROJECTS } from '../Builder/starterProjects';
import { trackEvent } from '../../utils/trackEvent';

let mockHomeAuth = { user: null, token: null };

jest.mock('react-router-dom', () => {
  const React = require('react');
  const navigate = jest.fn();
  return {
    Link: ({ children, to, onClick, ...props }) => React.createElement('a', {
      href: to,
      onClick: (event) => { event.preventDefault(); onClick?.(event); },
      ...props,
    }, children),
    useNavigate: () => navigate,
    __navigate: navigate,
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/BrandLogo/BrandLogo', () => ({ alt = 'CodeIt', ...props }) => <img alt={alt} {...props} />);
jest.mock('../../context/AuthContext', () => ({ useAuth: () => mockHomeAuth }));
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));

describe('Home', () => {
  beforeEach(() => {
    mockHomeAuth = { user: null, token: null };
    sessionStorage.clear();
    trackEvent.mockReset().mockResolvedValue(true);
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('gives parents a direct, measurable path to the family pilot', () => {
    render(<Home />);

    const familyAccountLink = screen.getByRole('link', { name: 'Create a learner profile' });
    expect(familyAccountLink).toHaveAttribute('href', '/register?for=family');
    fireEvent.click(familyAccountLink);
    expect(trackEvent).toHaveBeenCalledWith('parent_cta_click', 'create-family-account');

    const pilotLink = screen.getByRole('link', { name: 'See full pilot details' });
    expect(pilotLink).toHaveAttribute('href', '/pricing');

    fireEvent.click(pilotLink);
    expect(trackEvent).toHaveBeenCalledWith('parent_cta_click', 'view-pricing');
  });

  test('records one privacy-safe homepage view per browser session', () => {
    const { rerender } = render(<Home />);

    expect(trackEvent).toHaveBeenCalledWith('homepage_view', null, null);
    rerender(<Home />);
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  test('the home page keeps the two claims and drops the two counts', () => {
    // "31 lessons" and "21 projects" used to sit beside CA$0 and None. A
    // number invites a comparison, and this is one we lose every time we
    // invite it: Tynker publishes thousands of activities and Code.org has a
    // curriculum a school district signs off on. The counts belong on
    // /lessons and /press, where somebody has asked. CA$0 and None are not
    // counts, they are claims, and no competitor can match either.
    render(<Home />);

    const values = [...document.querySelectorAll('.studio-cost__facts dd')].map(el => el.textContent);
    expect(values).toEqual(['CA$0', 'None']);
    expect(values).not.toContain(String(TOTAL_LESSONS));
    expect(values).not.toContain(String(STARTER_PROJECTS.length));
    expect(document.body.textContent).not.toMatch(new RegExp(`\\b${TOTAL_LESSONS} lessons`));
    expect(screen.getByRole('heading', { name: /Beginner Python, from print\(\) to functions/ })).toBeInTheDocument();
  });

  test('the home page claims no usage figures at all', () => {
    // The owner's standing rule: never invent a statistic. The cheapest way to
    // keep it is to fail the build if one reappears.
    const { container } = render(<Home />);
    const text = container.textContent;
    expect(text).not.toMatch(/\b\d[\d,.]*\s*\+/);          // "200+", "1,900+"
    expect(text).not.toMatch(/\b\d+k\+/i);                   // "140k+"
    expect(text).not.toMatch(/active users|verified in|registered accounts/i);
  });

  test('carries a visitor idea into the builder without sending it to analytics', () => {
    const { __navigate } = require('react-router-dom');
    render(<Home />);

    fireEvent.change(screen.getByLabelText('What do you want to build?'), {
      target: { value: 'A space quiz about planets' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Build it' }));

    expect(trackEvent).toHaveBeenCalledWith('landing_cta_click', 'hero-idea');
    expect(trackEvent).not.toHaveBeenCalledWith(expect.anything(), 'A space quiz about planets');
    expect(__navigate).toHaveBeenCalledWith('/builder?prompt=A%20space%20quiz%20about%20planets');
  });

  test('lets a returning student continue their latest project from the homepage', async () => {
    mockHomeAuth = { user: { name: 'Alex' }, token: 'creator-token' };
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        projects: [{ id: 42, title: 'Mission Control Quiz' }],
      }),
    }));

    render(<Home />);

    const continueLink = await screen.findByRole('link', { name: 'Continue Mission Control Quiz' });
    expect(continueLink).toHaveAttribute('href', '/builder?project=42');
    fireEvent.click(continueLink);
    expect(trackEvent).toHaveBeenCalledWith('landing_cta_click', 'member-resume-project', 'creator-token');
    expect(trackEvent).not.toHaveBeenCalledWith(expect.anything(), 'Mission Control Quiz', expect.anything());
  });
});
