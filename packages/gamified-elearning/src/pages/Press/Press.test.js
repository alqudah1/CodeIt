import { render, screen } from '@testing-library/react';
import Press from './Press';
import COMPANY from '../../config/company';
import { PRICE_PER_INTERVAL, FREE_MONTHLY_AI_BUILDS } from '../../config/pricing';
import { TOTAL_LESSONS } from '../Lessons/lessonRegistry';

jest.mock('../Header/Header', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));

/**
 * /press existed as crawlable HTML with no React route, so a journalist who
 * clicked it in a search result was redirected to the homepage by the catch-all
 * in App.js. scripts/routes-reachable.test.js stops that recurring. This checks
 * the other half: that the page a person lands on actually carries the facts it
 * promises, read from config rather than typed into the page.
 */
describe('the press page', () => {
  test('states the price, the free allowance and the lesson count from config', () => {
    render(<Press />);

    // getAllByText: several of these appear more than once by design — the
    // lesson count is in the quotable paragraph and again under "What it does".
    expect(
      screen.getAllByText(new RegExp(TOTAL_LESSONS + ' beginner Python lessons')).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(new RegExp(PRICE_PER_INTERVAL.replace(/\$/g, '\\$'))).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(new RegExp(FREE_MONTHLY_AI_BUILDS + ' AI-assisted project builds a month')).length
    ).toBeGreaterThan(0);
  });

  test('names the founder and a reachable address, because that is the point of the page', () => {
    render(<Press />);

    expect(screen.getAllByText(new RegExp(COMPANY.founderName)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp(COMPANY.contactEmail)).length).toBeGreaterThan(0);
  });

  test('says what CodeIt does not do', () => {
    render(<Press />);

    expect(screen.getByRole('heading', { name: /What it does not do/i })).toBeInTheDocument();
    expect(screen.getByText(/no rostering/i)).toBeInTheDocument();
  });

  test('gives a paragraph a writer can quote as it stands', () => {
    render(<Press />);
    expect(screen.getByRole('heading', { name: /The paragraph to quote/i })).toBeInTheDocument();
  });
});
