import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import Schools, { FAMILY_PLAN_CHILDREN } from './Schools';
import schoolFacts, { NOT_YET } from '../../data/schoolFacts';
import COMPANY from '../../config/company';
import { PRICE_PER_INTERVAL } from '../../config/pricing';

jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/SiteFooter/SiteFooter', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));

/**
 * /schools is read by the person at a school who says yes or no, and every
 * sentence on it is a claim that person can test. So the claims a unit test
 * can hold are held here, against the code they describe. A sentence on that
 * page that stops being true must fail something.
 */
const ROOT = path.join(__dirname, '..', '..', '..');
const BACKEND = path.join(ROOT, '..', 'codeit-backend');
const read = (...parts) => fs.readFileSync(path.join(...parts), 'utf8');
const facts = schoolFacts({ contactEmail: COMPANY.contactEmail, pricePerInterval: PRICE_PER_INTERVAL, maxChildren: FAMILY_PLAN_CHILDREN });
const everything = [facts.h1, facts.intro, facts.detail, ...facts.sections.flatMap((s) => [s.heading, ...s.paragraphs])].join('\n');

describe('the schools page', () => {
  test('answers the reviewer\'s form in order, and gives them somewhere to write', () => {
    render(<Schools />);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'One address to allow', 'Web filters that read inside files', 'No third-party tracking',
      'What a classroom account holds', 'Who the adult is', 'Publishing', 'What the AI receives',
      'Ages', 'What CodeIt does not have', 'Questions',
    ]);
    expect(screen.getByText(new RegExp(COMPANY.contactEmail.replace('.', '\\.')))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Test this computer' })).toHaveAttribute('href', '/check');
  });

  test('a classroom account holds a first name and nothing that identifies a family', () => {
    // The sentence: "It holds no email address, no parent's email address, no
    // date of birth and no surname."
    const join = read(BACKEND, 'routes', 'class.js');
    expect(join).toContain("'INSERT INTO Users (username, name, password, role, dob, parent_email) VALUES (?, ?, ?, ?, ?, ?)'");
    expect(join).toContain("[username, firstName, password, 'student', null, null]");
    // "a password the child never sees and never types"
    expect(join).toMatch(/bcrypt\.hashSync\(crypto\.randomBytes\(24\)/);
    // "A child typing the same name into the same class signs back into the same work"
    expect(join).toContain('LOWER(u.name) = LOWER(?)');
  });

  test('a published project never shows the child\'s name, and a managed profile cannot publish', () => {
    const builder = read(BACKEND, 'routes', 'builder.js');
    expect(builder).toContain("const creatorName = 'CodeIt creator';");
    expect(builder).toContain("code: 'MANAGED_PROFILE_PRIVATE'");
    // "Project pages are hidden from search engines."
    const vercel = JSON.parse(read(ROOT, '..', '..', 'vercel.json'));
    const noindex = vercel.headers.find((h) => h.headers.some((x) => x.key === 'X-Robots-Tag') && /\|project\|/.test(h.source));
    expect(noindex).toBeDefined();
  });

  test('nothing that identifies a child is sent to the AI provider', () => {
    // The request is built in one place. It carries no metadata and no user field.
    const builder = read(BACKEND, 'routes', 'builder.js');
    expect(builder).toContain('client.messages.create(params, requestOptions)');
    expect(builder).not.toMatch(/metadata:\s*\{[^}]*user/);
    expect(builder).not.toMatch(/user_id:\s*req\.user/);
  });

  test('one address: Python is served through this site, and the page that tests a computer exists', () => {
    const vercel = JSON.parse(read(ROOT, '..', '..', 'vercel.json'));
    expect(vercel.rewrites.some((r) => r.source === '/pyodide/:path*')).toBe(true);
    expect(read(ROOT, 'src', 'utils', 'pyodideLoader.js')).toMatch(/`\$\{ORIGIN\}\/pyodide\//);
    expect(fs.existsSync(path.join(ROOT, 'public', 'check.html'))).toBe(true);
    // No font, script or stylesheet from another company's server in the page every route starts from.
    const index = read(ROOT, 'public', 'index.html');
    const outside = (index.match(/(?:src|href)="https?:\/\/[^"]+"/g) || []).filter((tag) => /<(script|link rel="stylesheet")/.test(index.slice(index.lastIndexOf('<', index.indexOf(tag)), index.indexOf(tag))) && !tag.includes('codeitlearn.com'));
    expect(outside).toEqual([]);
  });

  test('the price and the number of children are the product\'s own figures', () => {
    expect(everything).toContain(`${PRICE_PER_INTERVAL} for a family, covering up to ${FAMILY_PLAN_CHILDREN} children`);
    const plans = read(BACKEND, 'entitlements.js').match(/maxChildProfiles:\s*(\d+)/g).map((m) => Number(m.replace(/\D/g, '')));
    expect(Math.max(...plans)).toBe(FAMILY_PLAN_CHILDREN);
  });

  test('the ages are said the one way that is safe to quote, with no range', () => {
    expect(everything).toContain('A learner aged 13 or over opens their own account.');
    expect(everything).toContain('which CodeIt supports from age 5');
    expect(everything).not.toMatch(/\b\d{1,2}\s*(?:to|-|–)\s*\d{1,2}\b/);
    expect(everything).not.toMatch(/[—–]/);
  });

  test('what is not true on the live site yet is written, and is not on the page', () => {
    // See NOT_YET in schoolFacts.js for what each one waits for.
    expect(NOT_YET.map((s) => s.heading)).toEqual(['What leaves the classroom', 'Deleting a child\'s data', 'Accessibility']);
    render(<Schools />);
    for (const section of NOT_YET) {
      expect(screen.queryByRole('heading', { name: section.heading })).toBeNull();
      for (const paragraph of section.paragraphs) expect(everything).not.toContain(paragraph);
    }
    // The one sentence a reviewer would test first is not claimed yet.
    expect(everything).not.toMatch(/never listed in CodeIt's public gallery/);
    expect(everything).not.toMatch(/no serious\s+or critical violations/);
  });

  test('it is reachable: a route, a footer link, a link from the teacher page, and a crawlable copy typed as a page', () => {
    expect(read(ROOT, 'src', 'App.js')).toContain('<Route path="/schools" element={<Schools />} />');
    expect(read(ROOT, 'src', 'components', 'SiteFooter', 'SiteFooter.js')).toContain('<Link to="/schools">For schools</Link>');
    expect(read(ROOT, 'src', 'pages', 'Class', 'Teach.js')).toContain('<Link to="/schools">');
    const generator = read(ROOT, 'scripts', 'generate-static-seo.js');
    expect(generator).toMatch(/route: '\/schools',\s*type: 'WebPage',\s*\.\.\.SCHOOL_FACTS\(/);
    const vercel = read(ROOT, '..', '..', 'vercel.json');
    expect(vercel).toMatch(/\|schools\|/);
  });
});
