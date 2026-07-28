import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ENDPOINTS } from '../../config/api';
import AdminLayout from './AdminLayout';
import './AdminLayout.css';
import './AdminFunnel.css';

const STAGES = [
  ['landing_cta_click', 'Landing clicks'],
  ['parent_cta_click', 'Parent actions'],
  ['builder_start', 'Builds started'],
  ['generation_complete', 'Projects generated'],
  ['project_personalize', 'Projects personalized'],
  ['signup_complete', 'Accounts created'],
  ['project_save', 'Projects saved'],
  ['project_publish', 'Projects published'],
  ['project_share', 'Projects shared'],
  ['return_use', 'Daily returns'],
  ['pricing_view', 'Pricing views'],
  ['pricing_interest', 'Plan interest'],
];

const PARENT_ACTIONS = [
  ['try-project', 'Tried a project'],
  ['view-pricing', 'Viewed family pricing'],
  ['pilot-email', 'Opened pilot email'],
];

const ACQUISITION_SOURCES = [
  ['google', 'Google'],
  ['youtube', 'YouTube'],
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
  ['facebook', 'Facebook'],
  ['search', 'Other search'],
  ['project', 'Shared projects'],
  ['referral', 'Other websites'],
  ['direct', 'Direct / unknown'],
];

const fmt = (value) => (Number(value) || 0).toLocaleString();
const usd = (value) => value == null ? '—' : `$${Number(value).toFixed(3)}`;

function ratio(numerator, denominator) {
  if (!denominator) return '—';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export default function AdminFunnel() {
  const { token } = useContext(AuthContext);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [costs, setCosts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setCosts(null);
    setError('');

    const headers = { Authorization: `Bearer ${token}` };
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

  const parentActions = useMemo(() => Object.fromEntries(
    (data?.breakdown || []).filter((row) => row.event_name === 'parent_cta_click').map((row) => [row.meta, Number(row.event_count) || 0])
  ), [data]);
  const acquisitionSources = useMemo(() => Object.fromEntries(
    (data?.breakdown || []).filter((row) => row.event_name === 'acquisition_visit').map((row) => [row.meta, Number(row.event_count) || 0])
  ), [data]);
  const foundingLeads = data?.founding_leads || [];

  const signals = data ? [
    ['Build completion', ratio(counts.generation_complete, counts.builder_start)],
    ['Generated → personalized', ratio(counts.project_personalize, counts.generation_complete)],
    ['Personalized → saved', ratio(counts.project_save, counts.project_personalize)],
    ['Generated → saved', ratio(counts.project_save, counts.generation_complete)],
    ['Saved → published', ratio(counts.project_publish, counts.project_save)],
    ['Published → shared', ratio(counts.project_share, counts.project_publish)],
    ['New accounts → return days', ratio(counts.return_use, counts.signup_complete)],
    ['Pricing view → interest', ratio(counts.pricing_interest, counts.pricing_view)],
  ] : [];

  const recentDaily = (data?.daily || []).slice(-35).reverse();
  const costPerGenerated = counts.generation_complete && costs?.totals?.estimated_usd != null
    ? costs.totals.estimated_usd / counts.generation_complete
    : null;

  return (
    <AdminLayout>
      <div className="funnel-head">
        <div>
          <p className="funnel-kicker">Product health</p>
          <h2 className="adm-page-title">Activation funnel</h2>
          <p className="funnel-note">Directional event activity. Analytics stores no prompts, code, email addresses, or IP addresses; contact emails below come from adults' existing accounts after explicit waitlist opt-in.</p>
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
          <div className="funnel-stage-grid">
            {STAGES.map(([key, label], index) => (
              <article className="funnel-stage" key={key}>
                <span className="funnel-stage__number">{String(index + 1).padStart(2, '0')}</span>
                <strong>{fmt(counts[key])}</strong>
                <p>{label}</p>
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

          <div className="adm-section-head">How visitors found CodeIt</div>
          <div className="funnel-parent-grid">
            {ACQUISITION_SOURCES.map(([key, label]) => (
              <article key={key}>
                <span>{label}</span>
                <strong>{fmt(acquisitionSources[key])}</strong>
              </article>
            ))}
          </div>
          <p className="funnel-parent-note">One privacy-safe source bucket per browser session. Campaign names, search terms, and referring URLs are never stored.</p>

          <div className="adm-section-head">Parent acquisition actions</div>
          <div className="funnel-parent-grid">
            {PARENT_ACTIONS.map(([key, label]) => (
              <article key={key}>
                <span>{label}</span>
                <strong>{fmt(parentActions[key])}</strong>
              </article>
            ))}
          </div>
          <p className="funnel-parent-note">These are button clicks, not people. “Opened pilot email” means the visitor opened their email app; it does not confirm that they sent a message.</p>

          <div className="adm-section-head">Founding family leads</div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Parent / educator</th><th>Contact email</th><th>Joined</th></tr></thead>
              <tbody>
                {foundingLeads.length === 0 && (
                  <tr><td colSpan={3} className="adm-loading">No contactable waitlist leads in this window yet.</td></tr>
                )}
                {foundingLeads.map((lead) => (
                  <tr key={lead.user_id}>
                    <td>{lead.name || 'Parent / educator'}</td>
                    <td><a href={`mailto:${lead.email}`}>{lead.email}</a></td>
                    <td>{lead.interested_at ? new Date(lead.interested_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="funnel-parent-note">
            These adults explicitly joined the founding family waitlist while signed in. Contact them only about that pilot.
          </p>

          <div className="adm-section-head">Account safety audit</div>
          <div className="funnel-safety-grid">
            <article><span>Existing students under 13</span><strong>{fmt(ageAudit?.under_13)}</strong></article>
            <article><span>Parent email on file</span><strong>{fmt(ageAudit?.under_13_with_parent_email)}</strong></article>
            <article className="is-urgent"><span>No parent email on file</span><strong>{fmt(ageAudit?.under_13_without_parent_email)}</strong></article>
            <article><span>Students ages 13–18</span><strong>{fmt(ageAudit?.age_13_18)}</strong></article>
          </div>
          <p className="funnel-safety-note">Aggregate counts only. A parent email on file is not proof of verified parental consent. Existing under-13 accounts need a reviewed remediation plan before a paid launch.</p>

          <div className="adm-section-head">AI unit economics</div>
          <div className="funnel-cost-grid">
            <article><span>Estimated API cost</span><strong>{usd(costs?.totals?.estimated_usd)}</strong></article>
            <article><span>AI calls</span><strong>{fmt(costs?.totals?.calls)}</strong></article>
            <article><span>Cost / generated project</span><strong>{usd(costPerGenerated)}</strong></article>
            <article><span>Input / output tokens</span><strong>{fmt(costs?.totals?.input_tokens)} / {fmt(costs?.totals?.output_tokens)}</strong></article>
          </div>
          <p className="funnel-cost-note">Estimate uses the standard Claude Haiku 4.5 list price. Timed-out calls are still counted when Anthropic finishes them.</p>

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
