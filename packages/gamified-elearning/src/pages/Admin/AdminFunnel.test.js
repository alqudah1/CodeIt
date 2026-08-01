import { render, screen, waitFor } from '@testing-library/react';
import AdminFunnel from './AdminFunnel';

jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ token: 'admin-token' }) };
});
jest.mock('../../config/api', () => ({
  ENDPOINTS: {
    analytics: {
      funnel: (days) => `/api/analytics/funnel?days=${days}`,
      costs: (days) => `/api/analytics/costs?days=${days}`,
    },
  },
}));
jest.mock('./AdminLayout', () => ({ children }) => children);

describe('admin acquisition funnel', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [
            { event_name: 'acquisition_visit', event_count: 14, unique_users: 0, unique_journeys: 14, attributed_events: 14 },
            { event_name: 'learning_start', event_count: 8, unique_users: 0, unique_journeys: 7, attributed_events: 8 },
            { event_name: 'parent_cta_click', event_count: 11, unique_users: 0, unique_journeys: 7, attributed_events: 9 },
            { event_name: 'builder_start', event_count: 12, unique_users: 2, unique_journeys: 10, attributed_events: 10 },
            { event_name: 'generation_complete', event_count: 10, unique_users: 2, unique_journeys: 8, attributed_events: 8 },
            { event_name: 'project_personalize', event_count: 6, unique_users: 2, unique_journeys: 5, attributed_events: 5 },
            { event_name: 'project_save', event_count: 4, unique_users: 2, unique_journeys: 3, attributed_events: 3 },
            { event_name: 'project_remix', event_count: 2, unique_users: 2, unique_journeys: 2, attributed_events: 2 },
            { event_name: 'activation_next_step', event_count: 3, unique_users: 2, unique_journeys: 2, attributed_events: 3 },
          ],
          breakdown: [
            { event_name: 'acquisition_visit', meta: 'instagram', event_count: 9 },
            { event_name: 'acquisition_visit', meta: 'linkedin', event_count: 3 },
            { event_name: 'acquisition_visit', meta: 'project', event_count: 5 },
            { event_name: 'parent_cta_click', meta: 'create-family-account', event_count: 4 },
            { event_name: 'parent_cta_click', meta: 'try-project', event_count: 4 },
            { event_name: 'parent_cta_click', meta: 'view-pricing', event_count: 2 },
            { event_name: 'parent_cta_click', meta: 'pilot-email', event_count: 1 },
            { event_name: 'activation_next_step', meta: 'publish', event_count: 2 },
            { event_name: 'activation_next_step', meta: 'improve', event_count: 1 },
            { event_name: 'generation_complete', meta: 'ai', event_count: 8 },
            { event_name: 'generation_complete', meta: 'fallback', event_count: 2 },
          ],
          daily: [],
          source_funnel: [
            {
              source: 'instagram',
              visits: 8,
              generated_projects: 4,
              completed_signups: 2,
              saved_projects: 1,
              published_projects: 1,
              remixed_projects: 2,
            },
          ],
          student_age_audit: {},
          founding_leads: [
            {
              user_id: 12,
              name: 'Parent Tester',
              email: 'parent@example.com',
              interested_at: '2026-07-23T12:00:00.000Z',
            },
            {
              user_id: null,
              name: null,
              email: 'direct@example.com',
              interested_at: '2026-07-24T12:00:00.000Z',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totals: { estimated_usd: 0.08, calls: 8, input_tokens: 1200, output_tokens: 2400 } }),
      });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('shows the privacy-safe parent actions separately', async () => {
    render(<AdminFunnel />);

    await waitFor(() => expect(screen.getByText('Parent acquisition actions')).toBeInTheDocument());
    expect(screen.getByText('Measurement health')).toBeInTheDocument();
    expect(screen.getByText('14 attributable visitor journeys')).toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();
    expect(screen.getByText(/6 more needed/i)).toBeInTheDocument();
    expect(screen.getByText('Projects shared')).toBeInTheDocument();
    expect(screen.getByText('Learning starts')).toBeInTheDocument();
    expect(screen.getByText('Visit → learning').parentElement).toHaveTextContent('50%');
    expect(screen.getByText('Projects personalized')).toBeInTheDocument();
    expect(screen.getByText('Projects remixed')).toBeInTheDocument();
    expect(screen.getByText('Finish steps chosen')).toBeInTheDocument();
    expect(screen.getByText('Generated → personalized').parentElement).toHaveTextContent('63%');
    expect(screen.getByText('Personalized → saved').parentElement).toHaveTextContent('60%');
    expect(screen.getByText('Published → shared')).toBeInTheDocument();
    expect(screen.getByText('Shared visitors → remixed')).toBeInTheDocument();
    expect(screen.getByText('How visitors found CodeIt')).toBeInTheDocument();
    expect(screen.getByText('Instagram', { selector: 'span' }).parentElement).toHaveTextContent('9');
    expect(screen.getByText('LinkedIn', { selector: 'span' }).parentElement).toHaveTextContent('3');
    expect(screen.getByText('Shared projects').parentElement).toHaveTextContent('5');
    expect(screen.getByText('Which sources create activated visitors')).toBeInTheDocument();
    expect(screen.getByText('Visit → build')).toBeInTheDocument();
    expect(screen.getByText('Remixed', { selector: 'th' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Instagram 8 4 2 1 1 2 50%/i })).toBeInTheDocument();
    expect(screen.getByText('Started family account setup').parentElement).toHaveTextContent('4');
    expect(screen.getByText('Tried a project').parentElement).toHaveTextContent('4');
    expect(screen.getByText('Viewed family pricing').parentElement).toHaveTextContent('2');
    expect(screen.getByText('Opened pilot email').parentElement).toHaveTextContent('1');
    expect(screen.getByText(/does not confirm that they sent a message/i)).toBeInTheDocument();
    expect(screen.getByText('What creators choose after saving')).toBeInTheDocument();
    expect(screen.getByText('Chose to publish').parentElement).toHaveTextContent('2');
    expect(screen.getByText('Kept improving').parentElement).toHaveTextContent('1');
    expect(screen.getByText('Founding family leads')).toBeInTheDocument();
    expect(screen.getByText('Parent Tester')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'parent@example.com' })).toHaveAttribute('href', 'mailto:parent@example.com');
    expect(screen.getByRole('link', { name: 'direct@example.com' })).toHaveAttribute('href', 'mailto:direct@example.com');
    expect(screen.getByText(/waitlist form or an adult account/i)).toBeInTheDocument();
    expect(screen.getByText('AI-built projects').parentElement).toHaveTextContent('8');
    expect(screen.getByText('Safe fallback projects').parentElement).toHaveTextContent('2');
    expect(screen.getByText('AI generation rate').parentElement).toHaveTextContent('80%');
    expect(screen.getByText('Cost / AI-built project').parentElement).toHaveTextContent('$0.010');
    expect(screen.getByText(/cost per working AI result is not understated/i)).toBeInTheDocument();
  });
});
