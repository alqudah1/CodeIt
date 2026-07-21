import { ENDPOINTS } from "../config/api";

const CLIENT_EVENTS = new Set(["landing_cta_click", "return_use"]);

export async function trackEvent(eventName, meta = null, explicitToken = null) {
  if (!CLIENT_EVENTS.has(eventName)) return false;

  const token = explicitToken || localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
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
