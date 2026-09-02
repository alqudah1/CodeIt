import { ENDPOINTS } from "../config/api";
import { journeyHeaders } from "./journey";

// The browser's half of the analytics contract, and a privacy gate: an event
// name that is not on this list is never sent, so no code path can post a
// child's prompt or a lesson title to the ingest route by naming it as an
// event.
//
// It has to equal the server's CLIENT_REPORTED_EVENTS exactly, and on
// 2 September 2026 it did not: eighteen names had been added to the server
// over two days and none of them were added here. trackEvent returned false
// before making a request, so every one of those calls was silently dead —
// including the measurement for the studio door, the studio and lesson
// denominators, and the upgrade path shipped the same morning. The 8
// September read-out would have reported zero and the silence would have
// looked like a null result.
//
// analyticsContract.test.js now asserts this set equals the server's, read
// from the real server file. The two lists can no longer drift.
const CLIENT_EVENTS = new Set([
  "acquisition_visit",
  "homepage_view",
  "challenge_view",
  "challenge_start",
  "landing_cta_click",
  "learning_start",
  "parent_guide_view",
  "parent_cta_click",
  "new_account_studio_view",
  "new_account_family_setup_view",
  "guest_draft_recovered",
  "project_personalize",
  "activation_account_gate",
  "activation_next_step",
  "project_share",
  "return_use",
  "pricing_view",
  "lesson_to_studio",
  "quiz_to_studio",
  "project_played",
  "builder_starter_open",
  "shelf_project_reopened",
  "project_explained",
  "builder_look_inside",
  "publish_refused",
  "publish_celebrate_share",
  "parent_evidence_open",
  "billing_portal_open",
  "billing_checkout_start",
  "studio_view",
  "lesson_start",
  "upgrade_prompt_shown",
  "upgrade_click",
  "learn_the_code_behind",
  "page_crash",
]);

export async function trackEvent(eventName, meta = null, explicitToken = null) {
  if (!CLIENT_EVENTS.has(eventName)) return false;

  const token = explicitToken || localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...journeyHeaders() };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(ENDPOINTS.analytics.event, {
      method: "POST",
      headers,
      body: JSON.stringify({ event_name: eventName, meta }),
      keepalive: true,
    });
    return response.ok;
  } catch (_) {
    return false;
  }
}
