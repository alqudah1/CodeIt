import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL, ENDPOINTS } from '../../config/api';
import AdminLayout from './AdminLayout';
import './AdminLayout.css';
import './AdminFunnel.css';

const STAGES = [
  ['homepage_view', 'Homepage views'],
  ['challenge_view', 'Challenge views'],
  ['challenge_start', 'Challenge starts'],
  ['landing_cta_click', 'Landing clicks'],
  ['learning_start', 'Learning starts'],
  ['parent_guide_view', 'Parent guide views'],
  ['parent_cta_click', 'Parent actions'],
  ['builder_start', 'Builds started'],
  ['generation_complete', 'Projects generated'],
  ['guest_draft_recovered', 'Guest projects recovered'],
  ['project_personalize', 'Projects personalized'],
  ['activation_account_gate', 'Account gates reached'],
  ['signup_complete', 'Accounts created'],
  ['new_account_studio_view', 'New student accounts reaching studio'],
  ['new_account_family_setup_view', 'New adult accounts reaching family setup'],
  ['project_save', 'Projects saved'],
  ['activation_next_step', 'Finish steps chosen'],
  ['project_publish', 'Projects published'],
  ['project_share', 'Projects shared'],
  ['project_remix', 'Projects remixed'],
  ['return_use', 'Daily returns'],
  ['pricing_view', 'Pricing views'],
  ['ai_limit_reached', 'Hit the monthly AI limit'],
  ['upgrade_prompt_shown', 'Upgrade offers shown'],
  ['upgrade_click', 'Upgrade offers clicked'],
  ['checkout_start', 'Checkouts started'],
  ['checkout_complete', 'Checkouts completed'],
  ['pricing_interest', 'Plan interest'],
  ['pilot_join', 'Pilot joins'],
  ['pilot_confirmation', 'Pilot confirmation attempts'],
  ['family_child_created', 'Managed learner profiles'],
];

const PARENT_ACTIONS = [
  ['create-family-account', 'Started family account setup'],
  ['try-project', 'Tried a project'],
  ['join-pilot', 'Opened pilot signup'],
  ['view-pricing', 'Viewed family pricing'],
  ['pilot-email', 'Opened pilot email'],
  // The conversion moment the evidence panel was built for: a parent who has
  // just read their child's own line of code, tapping through to the pilot.
  // If this row stays at zero while parent_evidence_open climbs, the offer is
  // wrong; if both stay at zero, parents are not finding the panel.
  ['evidence-pilot', 'Saw the evidence, opened the pilot'],
];

const FINISH_ACTIONS = [
  ['publish', 'Chose to publish'],
  ['improve', 'Kept improving'],
  ['learn', 'Opened code explanation'],
  ['share', 'Shared a live project'],
];

// The growth loop's gauges, planted where the loops close. Reading them as a
// chain tells the whole story: a child publishes and shares from the
// celebration → a stranger lands on the share page and taps "build your own"
// → a parent opens the evidence → the pilot. Where the chain thins is where
// the next round of work goes — measured, not guessed.
const GROWTH_LOOP = [
  ['publish_celebrate_share', 'Shared from the publish celebration'],
  ['public-project-build', 'Stranger on a shared game chose to build'],
  ['parent_evidence_open', 'Parents opened the evidence panel'],
  ['builder_look_inside', 'Children followed their code into a lesson'],
];

const HOMEPAGE_ACTIONS = [
  ['hero-idea', 'Started with their own idea'],
  ['member-resume-project', 'Continued a saved project'],
  ['hero-build', 'Opened the studio'],
  ['hero-lessons', 'Opened beginner lessons'],
  ['final-build', 'Used the final build button'],
];

const ACQUISITION_SOURCES = [
  ['google', 'Google'],
  ['youtube', 'YouTube'],
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
  ['facebook', 'Facebook'],
  ['linkedin', 'LinkedIn'],
  ['search', 'Other search'],
  ['project', 'Shared projects'],
  ['referral', 'Other websites'],
  ['direct', 'Direct / unknown'],
  ['other', 'Other tagged sources'],
];

const fmt = (value) => (Number(value) || 0).toLocaleString();
const usd = (value) => value == null ? ', ' : `$${Number(value).toFixed(3)}`;

function ratio(numerator, denominator) {
  if (!denominator) return 'Collecting data';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export default function AdminFunnel() {
  const { token } = useContext(AuthContext);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [costs, setCosts] = useState(null);
  const [lessonFunnel, setLessonFunnel] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setCosts(null);
    setError('');

    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_BASE_URL}/api/admin/funnel/lessons`, { headers })
      .then(async r => { const b = await r.json(); if (r.ok && !cancelled) setLessonFunnel(b.lessons || []); })
      .catch(() => { /* the section simply stays absent */ });

    Promise.all([
      fetch(ENDPOINTS.analytics.funnel(days), { headers }),
      fetch(ENDPOINTS.analytics.costs(days), { headers }),
    ])
      .then(async ([funnelResponse, costResponse]) => {
        const funnelBody = await funnelResponse.json();
        const costBody = await costResponse.json();
        if (!funnelResponse.ok) throw new Error(funnelBody.error || 'Could not load funnel data.');
        if (!costResponse.ok) throw new Error(costBody.error || 'Could not load AI cost data.');
        if (!cancelled) {
          setData(funnelBody);
          setCosts(costBody);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => { cancelled = true; };
  }, [days, token]);

  const counts = useMemo(() => Object.fromEntries(
    (data?.events || []).map((row) => [row.event_name, Number(row.event_count) || 0])
  ), [data]);
  const ageAudit = data?.student_age_audit || null;

  const uniqueUsers = useMemo(() => Object.fromEntries(
    (data?.events || []).map((row) => [row.event_name, Number(row.unique_users) || 0])
  ), [data]);
  const uniqueJourneys = useMemo(() => Object.fromEntries(
    (data?.events || []).map((row) => [row.event_name, Number(row.unique_journeys) || 0])
  ), [data]);
  const attributedEvents = useMemo(() => Object.fromEntries(
    (data?.events || []).map((row) => [row.event_name, Number(row.attributed_events) || 0])
  ), [data]);

  const parentActions = useMemo(() => Object.fromEntries(
    (data?.breakdown || []).filter((row) => row.event_name === 'parent_cta_click').map((row) => [row.meta, Number(row.event_count) || 0])
  ), [data]);
  const finishActions = useMemo(() => Object.fromEntries(
    (data?.breakdown || []).filter((row) => row.event_name === 'activation_next_step').map((row) => [row.meta, Number(row.event_count) || 0])
  ), [data]);
  const homepageActions = useMemo(() => Object.fromEntries(
    (data?.breakdown || []).filter((row) => row.event_name === 'landing_cta_click').map((row) => [row.meta, Number(row.event_count) || 0])
  ), [data]);
  const pilotJoinSources = useMemo(() => Object.fromEntries(
    (data?.breakdown || []).filter((row) => row.event_name === 'pilot_join').map((row) => [row.meta, Number(row.event_count) || 0])
  ), [data]);
  const pilotConfirmations = useMemo(() => Object.fromEntries(
    (data?.breakdown || []).filter((row) => row.event_name === 'pilot_confirmation').map((row) => [row.meta, Number(row.event_count) || 0])
  ), [data]);
  const progressDeliveries = useMemo(() => Object.fromEntries(
    (data?.progress_email_delivery || []).map((row) => [row.status, Number(row.delivery_count) || 0])
  ), [data]);
  const progressDeliveryAttempts = Object.values(progressDeliveries).reduce((total, value) => total + value, 0);
  const acquisitionSources = useMemo(() => Object.fromEntries(
    (data?.breakdown || []).filter((row) => row.event_name === 'acquisition_visit').map((row) => [row.meta, Number(row.event_count) || 0])
  ), [data]);
  const generationResults = useMemo(() => Object.fromEntries(
    (data?.breakdown || []).filter((row) => row.event_name === 'generation_complete').map((row) => [row.meta, Number(row.event_count) || 0])
  ), [data]);
  const signupJourneys = useMemo(() => Object.fromEntries(
    (data?.breakdown || [])
      .filter((row) => row.event_name === 'signup_complete')
      .map((row) => [row.meta, Number(row.activation_cohort_journeys) || 0])
  ), [data]);
  const foundingLeads = data?.founding_leads || [];
  const sourceFunnel = data?.source_funnel || [];
  const campaignFunnel = data?.campaign_funnel || [];
  const homepageFunnel = data?.homepage_funnel || {};
  const challengeFunnel = data?.challenge_funnel || {};
  const journeyMetric = (key) => uniqueJourneys[key] || 0;
  const measuredVisits = journeyMetric('acquisition_visit');
  const builderAttribution = counts.builder_start
    ? ratio(attributedEvents.builder_start || 0, counts.builder_start)
    : 'Collecting data';
  const sampleReady = measuredVisits >= 20;

  const signals = data ? [
    ['Homepage → action', ratio(Number(homepageFunnel.clicked) || 0, Number(homepageFunnel.views) || 0)],
    ['Homepage → project', ratio(Number(homepageFunnel.generated_projects) || 0, Number(homepageFunnel.views) || 0)],
    ['Homepage → signup', ratio(Number(homepageFunnel.completed_signups) || 0, Number(homepageFunnel.views) || 0)],
    ['Challenge → start', ratio(Number(challengeFunnel.started) || 0, Number(challengeFunnel.views) || 0)],
    ['Challenge → project', ratio(Number(challengeFunnel.generated_projects) || 0, Number(challengeFunnel.views) || 0)],
    ['Challenge → save', ratio(Number(challengeFunnel.saved_projects) || 0, Number(challengeFunnel.views) || 0)],
    ['Visit → learning', ratio(journeyMetric('learning_start'), journeyMetric('acquisition_visit'))],
    ['Build completion', ratio(journeyMetric('generation_complete'), journeyMetric('builder_start'))],
    ['Generated → personalized', ratio(journeyMetric('project_personalize'), journeyMetric('generation_complete'))],
    ['Recovered → saved', ratio(journeyMetric('project_save'), journeyMetric('guest_draft_recovered'))],
    ['Account gate → signup', ratio(journeyMetric('signup_complete'), journeyMetric('activation_account_gate'))],
    ['Student signup → studio', ratio(journeyMetric('new_account_studio_view'), signupJourneys.student || 0)],
    ['Adult signup → family setup', ratio(journeyMetric('new_account_family_setup_view'), signupJourneys.educator || 0)],
    ['Personalized → saved', ratio(journeyMetric('project_save'), journeyMetric('project_personalize'))],
    ['Generated → saved', ratio(journeyMetric('project_save'), journeyMetric('generation_complete'))],
    ['Saved → published', ratio(journeyMetric('project_publish'), journeyMetric('project_save'))],
    ['Published → shared', ratio(journeyMetric('project_share'), journeyMetric('project_publish'))],
    ['Shared visitors → remixed', ratio(journeyMetric('project_remix'), acquisitionSources.project || 0)],
    ['New accounts → return days', ratio(journeyMetric('return_use'), journeyMetric('signup_complete'))],
    ['Pricing view → interest', ratio(journeyMetric('pricing_interest'), journeyMetric('pricing_view'))],
    ['Upgrade offer → click', ratio(counts.upgrade_click || 0, counts.upgrade_prompt_shown || 0)],
    ['Upgrade click → checkout', ratio(counts.checkout_start || 0, counts.upgrade_click || 0)],
    ['Checkout → paid', ratio(counts.checkout_complete || 0, counts.checkout_start || 0)],
    ['Pilot request → setup email', ratio(pilotConfirmations.sent || 0, counts.pilot_join || 0)],
    ['Pilot request → learner profile', ratio(journeyMetric('family_child_created'), journeyMetric('pilot_join'))],
    ['Parent guide → pilot join', ratio(pilotJoinSources['parents-guide'] || 0, journeyMetric('parent_guide_view'))],
  ] : [];

  // ── The money path ─────────────────────────────────────────────────────
  //
  // Counted, not journey-counted: checkout_start and checkout_complete are
  // recorded by the server, which has a user id and no journey id, so a
  // journey ratio would divide by something these events never carry.
  const buildDistribution = data?.ai_build_distribution || [];
  const accountsAtLimit = buildDistribution
    .filter((row) => Number(row.builds) >= 10)
    .reduce((sum, row) => sum + Number(row.accounts || 0), 0);
  const accountsBuilding = buildDistribution
    .reduce((sum, row) => sum + Number(row.accounts || 0), 0);
  const busiestAccount = buildDistribution
    .reduce((max, row) => Math.max(max, Number(row.builds) || 0), 0);
  // A start with no complete is either an abandoned checkout or the webhook
  // failure this code has always warned about: a card charged, no access.
  const checkoutGap = Math.max(0, (counts.checkout_start || 0) - (counts.checkout_complete || 0));

  const recentDaily = (data?.daily || []).slice(-35).reverse();
  const aiGeneratedProjects = generationResults.ai || 0;
  // 'fallback' is the legacy untagged meta; every new fallback arrives as
  // fallback-<reason> so the cause is visible, not just the rate.
  const fallbackReasons = Object.entries(generationResults)
    .filter(([meta]) => meta === 'fallback' || meta.startsWith('fallback-'))
    .map(([meta, count]) => [meta === 'fallback' ? 'untagged (older builds)' : meta.replace('fallback-', ''), count]);
  const fallbackProjects = fallbackReasons.reduce((sum, [, count]) => sum + count, 0);
  const costPerAiGenerated = aiGeneratedProjects && costs?.totals?.estimated_usd != null
    ? costs.totals.estimated_usd / aiGeneratedProjects
    : null;

  return (
    <AdminLayout>
      <div className="funnel-head">
        <div>
          <p className="funnel-kicker">Product health</p>
          <h2 className="adm-page-title">Activation funnel</h2>
          <p className="funnel-note">Directional event activity. Analytics stores no prompts, code, email addresses, or IP addresses; contact emails below are kept separately after an adult explicitly joins the waitlist.</p>
        </div>
        <label className="funnel-window">
          Window
          <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </label>
      </div>

      {error && <div className="adm-error">{error}</div>}
      {!data && !error && <div className="adm-loading">Loading funnel…</div>}

      {data && (
        <>
          <div className={`funnel-measurement ${sampleReady ? 'is-ready' : 'is-learning'}`} role="status">
            <div>
              <span>Measurement health</span>
              <strong>{fmt(measuredVisits)} attributable visitor journeys</strong>
            </div>
            <div>
              <span>Builder events connected to a journey</span>
              <strong>{builderAttribution}</strong>
            </div>
            <p>
              {sampleReady
                ? 'The sample is large enough for directional conversion decisions. Keep comparing sources, not individual visitors.'
                : `Keep collecting before changing the product from these percentages. Aim for at least 20 attributable visitor journeys; ${Math.max(20 - measuredVisits, 0)} more needed.`}
            </p>
          </div>

          <div className="funnel-stage-grid">
            {STAGES.map(([key, label], index) => (
              <article className="funnel-stage" key={key}>
                <span className="funnel-stage__number">{String(index + 1).padStart(2, '0')}</span>
                <strong>{fmt(counts[key])}</strong>
                <p>{label}</p>
                {uniqueJourneys[key] > 0 && <small>{fmt(uniqueJourneys[key])} visitor journeys</small>}
                {counts[key] > 0 && attributedEvents[key] === 0 && <small>Legacy / unattributed activity</small>}
                {uniqueUsers[key] > 0 && <small>{fmt(uniqueUsers[key])} signed-in users</small>}
              </article>
            ))}
          </div>

          <div className="funnel-signal-grid">
            {signals.map(([label, value]) => (
              <article key={label} className="funnel-signal">
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <p className="funnel-parent-note">
            Student and adult destination rates use signups since {data.activation_entry_tracking_since || 'tracking began'}, when destination tracking became available.
          </p>

          {lessonFunnel && lessonFunnel.length > 0 && (
            <>
              <div className="adm-section-head">Lesson retention, measured</div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr><th>Lesson</th><th>Started</th><th>Finished</th><th>Finish rate</th></tr>
                  </thead>
                  <tbody>
                    {lessonFunnel.map(lesson => (
                      <tr key={lesson.id}>
                        <td>{lesson.id}. {lesson.title}</td>
                        <td>{fmt(lesson.started)}</td>
                        <td>{fmt(lesson.finished)}</td>
                        <td>{lesson.started > 0 ? `${Math.round((lesson.finished / lesson.started) * 100)}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="funnel-parent-note">
                Started = left any trace inside the lesson (a step completed, or the lesson finished).
                Finished = a completion recorded. All-time, straight from the live tables, not an estimate.
              </p>
            </>
          )}

          <div className="adm-section-head">What visitors chose on the homepage</div>
          <div className="funnel-parent-grid">
            {HOMEPAGE_ACTIONS.map(([key, label]) => (
              <article key={key}>
                <span>{label}</span>
                <strong>{fmt(homepageActions[key])}</strong>
              </article>
            ))}
          </div>
          <p className="funnel-parent-note">“Started with their own idea” records only that the Build it button was used. The idea itself is never stored in analytics.</p>

          <div className="adm-section-head">Family pilot follow-up</div>
          <div className="funnel-parent-grid">
            <article><span>Setup emails sent</span><strong>{fmt(pilotConfirmations.sent)}</strong></article>
            <article><span>Setup emails not sent</span><strong>{fmt(pilotConfirmations['not-sent'])}</strong></article>
          </div>
          <p className="funnel-parent-note">This records only delivery status. Contact addresses stay in the separate consented lead list and are never placed in analytics.</p>

          <div className="adm-section-head">Parent progress email delivery</div>
          <div className="funnel-parent-grid">
            <article><span>Delivery attempts</span><strong>{fmt(progressDeliveryAttempts)}</strong></article>
            <article><span>Progress emails sent</span><strong>{fmt(progressDeliveries.sent)}</strong></article>
            <article><span>Progress emails failed</span><strong>{fmt(progressDeliveries.failed)}</strong></article>
            <article><span>Email service unavailable</span><strong>{fmt(progressDeliveries.not_configured)}</strong></article>
          </div>
          <p className="funnel-parent-note">Counts only delivery status for selected learner milestones. Parent addresses, learner names, and project titles are not included in this report.</p>

          <div className="adm-section-head">How visitors found CodeIt</div>
          <div className="funnel-parent-grid">
            {ACQUISITION_SOURCES.map(([key, label]) => (
              <article key={key}>
                <span>{label}</span>
                <strong>{fmt(acquisitionSources[key])}</strong>
              </article>
            ))}
          </div>
          <p className="funnel-parent-note">One privacy-safe source bucket per browser session. Search terms and referring URLs are never stored.</p>

          <div className="adm-section-head">Which sources create activated visitors</div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Visits</th>
                  <th>Generated</th>
                  <th>Signed up</th>
                  <th>Pilot requests</th>
                  <th>Setup emails</th>
                  <th>Learner profile</th>
                  <th>Saved</th>
                  <th>Published</th>
                  <th>Remixed</th>
                  <th>Visit → build</th>
                  <th>Visit → pilot</th>
                </tr>
              </thead>
              <tbody>
                {sourceFunnel.length === 0 && (
                  <tr><td colSpan={12} className="adm-loading">Journey attribution starts with the next new visitor session.</td></tr>
                )}
                {sourceFunnel.map((source) => (
                  <tr key={source.source}>
                    <td>{ACQUISITION_SOURCES.find(([key]) => key === source.source)?.[1] || source.source}</td>
                    <td><strong>{fmt(source.visits)}</strong></td>
                    <td>{fmt(source.generated_projects)}</td>
                    <td>{fmt(source.completed_signups)}</td>
                    <td>{fmt(source.pilot_requests)}</td>
                    <td>{fmt(source.setup_emails_sent)}</td>
                    <td>{fmt(source.managed_profiles)}</td>
                    <td>{fmt(source.saved_projects)}</td>
                    <td>{fmt(source.published_projects)}</td>
                    <td>{fmt(source.remixed_projects)}</td>
                    <td>{ratio(Number(source.generated_projects), Number(source.visits))}</td>
                    <td>{ratio(Number(source.pilot_requests), Number(source.visits))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="funnel-parent-note">A random number connects actions only inside one browser session. It contains no prompt, project content, name, email, IP address, or cross-site tracking data.</p>

          <div className="adm-section-head">Which creator campaigns convert</div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Campaign code</th>
                  <th>Channel</th>
                  <th>Visits</th>
                  <th>Generated</th>
                  <th>Signed up</th>
                  <th>Pilot requests</th>
                  <th>Saved</th>
                  <th>Published</th>
                  <th>Visit → pilot</th>
                </tr>
              </thead>
              <tbody>
                {campaignFunnel.length === 0 && (
                  <tr>
                    <td colSpan={9} className="adm-loading">
                      No creator traffic yet. <a className="adm-inline-link" href="/creator-brief#campaign-links">Create and copy a tracked link →</a>
                    </td>
                  </tr>
                )}
                {campaignFunnel.map((campaign) => (
                  <tr key={`${campaign.campaign_code}-${campaign.source}`}>
                    <td><strong>{campaign.campaign_code}</strong></td>
                    <td>{ACQUISITION_SOURCES.find(([key]) => key === campaign.source)?.[1] || campaign.source}</td>
                    <td><strong>{fmt(campaign.visits)}</strong></td>
                    <td>{fmt(campaign.generated_projects)}</td>
                    <td>{fmt(campaign.completed_signups)}</td>
                    <td>{fmt(campaign.pilot_requests)}</td>
                    <td>{fmt(campaign.saved_projects)}</td>
                    <td>{fmt(campaign.published_projects)}</td>
                    <td>{ratio(Number(campaign.pilot_requests), Number(campaign.visits))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="funnel-parent-note">The campaign code identifies the promotion, not the visitor. Use internal codes only, never a visitor name, email address, phone number, or private message detail.</p>

          <div className="adm-section-head">Parent acquisition actions</div>
          <div className="funnel-parent-grid">
            {PARENT_ACTIONS.map(([key, label]) => (
              <article key={key}>
                <span>{label}</span>
                <strong>{fmt(parentActions[key])}</strong>
              </article>
            ))}
          </div>

          {/* Read as a chain, top to bottom. A healthy loop thins gradually;
              a broken link shows as a cliff, and the cliff is where the next
              round of work goes. */}
          <div className="adm-section-head">The growth loop</div>
          <div className="funnel-parent-grid">
            {GROWTH_LOOP.map(([key, label]) => (
              <article key={key}>
                <span>{label}</span>
                <strong>{fmt(key === 'public-project-build' ? homepageActions[key] : counts[key])}</strong>
              </article>
            ))}
          </div>
          <p className="funnel-parent-note">These are button clicks, not people. “Opened pilot email” means the visitor opened their email app; it does not confirm that they sent a message.</p>

          <div className="adm-section-head">What creators choose after saving</div>
          <div className="funnel-parent-grid">
            {FINISH_ACTIONS.map(([key, label]) => (
              <article key={key}>
                <span>{label}</span>
                <strong>{fmt(finishActions[key])}</strong>
              </article>
            ))}
          </div>
          <p className="funnel-parent-note">These choices show whether saved projects move toward publishing, deeper editing, or learning. They contain no project names or content.</p>

          <div className="adm-section-head">Founding family leads</div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Parent / educator</th><th>Contact email</th><th>Source</th><th>Joined</th></tr></thead>
              <tbody>
                {foundingLeads.length === 0 && (
                  <tr><td colSpan={4} className="adm-loading">No contactable waitlist leads in this window yet.</td></tr>
                )}
                {foundingLeads.map((lead) => (
                  <tr key={lead.user_id || lead.email}>
                    <td>{lead.name || 'Parent / educator'}</td>
                    <td><a href={`mailto:${lead.email}`}>{lead.email}</a></td>
                    <td>{lead.source || 'account opt-in'}</td>
                    <td>{lead.interested_at ? new Date(lead.interested_at).toLocaleDateString() : ', '}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="funnel-parent-note">
            These adults explicitly joined through the waitlist form or an adult account. Contact them only about the Founding Family pilot.
          </p>

          <div className="adm-section-head">Account safety audit</div>
          <div className="funnel-safety-grid">
            <article><span>Existing students under 13</span><strong>{fmt(ageAudit?.under_13)}</strong></article>
            <article><span>Verified managed profiles</span><strong>{fmt(ageAudit?.under_13_verified_managed)}</strong></article>
            <article><span>Parent review sent</span><strong>{fmt(ageAudit?.under_13_review_sent)}</strong></article>
            <article className="is-urgent"><span>Parent review needed</span><strong>{fmt(Math.max(0, Number(ageAudit?.under_13 || 0) - Number(ageAudit?.under_13_verified_managed || 0) - Number(ageAudit?.under_13_review_sent || 0)))}</strong></article>
            <article><span>Students ages 13 to 18</span><strong>{fmt(ageAudit?.age_13_18)}</strong></article>
          </div>
          <p className="funnel-safety-note">Aggregate counts only. Historical under-13 accounts stay paused and private until a parent or guardian completes the review and connects a confirmed adult account.</p>

          <div className="adm-section-head">AI unit economics</div>
          <div className="funnel-cost-grid">
            <article><span>Estimated API cost</span><strong>{usd(costs?.totals?.estimated_usd)}</strong></article>
            <article><span>AI calls</span><strong>{fmt(costs?.totals?.calls)}</strong></article>
            <article><span>AI-built projects</span><strong>{fmt(aiGeneratedProjects)}</strong></article>
            <article><span>Safe fallback projects</span><strong>{fmt(fallbackProjects)}</strong></article>
            <article><span>AI generation rate</span><strong>{ratio(aiGeneratedProjects, aiGeneratedProjects + fallbackProjects)}</strong></article>
            {fallbackReasons.filter(([, count]) => count > 0).map(([reason, count]) => (
              <article key={reason}><span>Fallback: {reason}</span><strong>{fmt(count)}</strong></article>
            ))}
            <article><span>Cost / AI-built project</span><strong>{usd(costPerAiGenerated)}</strong></article>
            <article><span>Input / output tokens</span><strong>{fmt(costs?.totals?.input_tokens)} / {fmt(costs?.totals?.output_tokens)}</strong></article>
          </div>
          <p className="funnel-cost-note">AI-built projects and safe fallbacks are shown separately so the cost per working AI result is not understated. The estimate uses the standard Claude Haiku 4.5 list price; timed-out calls are still counted when Anthropic finishes them.</p>

          <div className="adm-section-head">The money path</div>
          <div className="funnel-cost-grid">
            <article><span>Hit the monthly AI limit</span><strong>{fmt(counts.ai_limit_reached)}</strong></article>
            <article><span>Upgrade offers shown</span><strong>{fmt(counts.upgrade_prompt_shown)}</strong></article>
            <article><span>Upgrade offers clicked</span><strong>{fmt(counts.upgrade_click)}</strong></article>
            <article><span>Checkouts started</span><strong>{fmt(counts.checkout_start)}</strong></article>
            <article><span>Checkouts completed</span><strong>{fmt(counts.checkout_complete)}</strong></article>
            <article className={checkoutGap > 0 ? 'is-urgent' : undefined}>
              <span>Started, not completed</span><strong>{fmt(checkoutGap)}</strong>
            </article>
          </div>
          <p className="funnel-cost-note">
            Started but not completed is normally an abandoned checkout. If one of these
            is more than an hour old and the account still has no access, check the Stripe
            webhook before assuming the parent changed their mind: a card can be charged
            with no access granted, and this is the only place that shows it.
          </p>

          <div className="adm-section-head">Builds used per account this month</div>
          <div className="funnel-cost-grid">
            <article><span>Accounts that built anything</span><strong>{fmt(accountsBuilding)}</strong></article>
            <article><span>Reached the free limit of ten</span><strong>{fmt(accountsAtLimit)}</strong></article>
            <article><span>Busiest account</span><strong>{fmt(busiestAccount)}</strong></article>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>AI builds this month</th><th>Accounts</th></tr></thead>
              <tbody>
                {buildDistribution.length === 0 && (
                  <tr><td colSpan={2} className="adm-loading">No AI builds recorded this month yet.</td></tr>
                )}
                {buildDistribution.map((row) => (
                  <tr key={row.builds}>
                    <td>{row.builds}</td>
                    <td><strong>{fmt(row.accounts)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="funnel-cost-note">
            The paid plan sells more AI builds than the free ten. If nobody in this table
            is near ten, the plan is priced on something families are not running out of,
            and the offer needs to change rather than the checkout button.
          </p>

          <div className="adm-section-head">Recent event activity</div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Date</th><th>Event</th><th>Count</th></tr></thead>
              <tbody>
                {recentDaily.length === 0 && (
                  <tr><td colSpan={3} className="adm-loading">No events in this window yet.</td></tr>
                )}
                {recentDaily.map((row) => (
                  <tr key={`${row.day}-${row.event_name}`}>
                    <td>{row.day}</td>
                    <td>{STAGES.find(([key]) => key === row.event_name)?.[1] || row.event_name}</td>
                    <td><strong>{fmt(row.event_count)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
