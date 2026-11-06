// ── Is Plus on sale? ─────────────────────────────────────────────────────────
//
// The pilot was the offer while paid plans were closed, and it is written
// into the front page, the parents' guide and the profile. Once Plus is on
// sale those places must offer Plus instead, or the site advertises a free
// copy of the thing it sells. One fetch per page load, shared by every
// component that asks; until it answers, nothing claims Plus is on sale.

import { useEffect, useState } from 'react';
import { fetchPublicPlan } from '../utils/billing';

const UNKNOWN = Object.freeze({ known: false, billingEnabled: false, amount: 12, currency: 'CAD', interval: 'month' });
let cached = null;
let inflight = null;

export function resetPublicPlanCache() { cached = null; inflight = null; }

function load() {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = fetchPublicPlan()
      .then((plan) => { cached = { known: true, ...plan }; return cached; })
      .catch(() => ({ ...UNKNOWN, known: true }))
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export function usePublicPlan() {
  const [plan, setPlan] = useState(cached || UNKNOWN);
  useEffect(() => {
    let alive = true;
    if (!cached) load().then((p) => { if (alive) setPlan(p); });
    return () => { alive = false; };
  }, []);
  return plan;
}
