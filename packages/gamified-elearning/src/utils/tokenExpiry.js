// ── Is this session still a session? ─────────────────────────────────────────
//
// Seen live on 4 September 2026: a browser that had been signed in eight
// days earlier still showed "Welcome back" with the avatar and the level,
// and the first Save failed with "Invalid session" in the console and
// nothing on the screen. Tokens last seven days (JWT_EXPIRY). The browser
// kept the user object after the token behind it had died.
//
// A JWT carries its own expiry, so the browser can read it without asking
// the server. No signature check here; the server still does that. This is
// only to stop pretending.

export function tokenExpiresAt(token) {
  try {
    const payload = String(token || '').split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json);
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token, now = Date.now()) {
  const at = tokenExpiresAt(token);
  return at !== null && at <= now;
}

/** True when a server reply means the session is gone, not that the request was wrong. */
export function isSessionError(status, message) {
  return status === 401 || status === 403 || /invalid session|log in again|jwt expired/i.test(String(message || ''));
}
