import { ENDPOINTS } from "../config/api";
import { journeyHeaders } from "./journey";

const CLIENT_EVENTS = new Set(["acquisition_visit", "landing_cta_click", "learning_start", "parent_guide_view", "parent_cta_click", "new_account_studio_view", "guest_draft_recovered", "project_personalize", "activation_account_gate", "activation_next_step", "project_share", "return_use", "pricing_view"]);

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
