export function defaultAuthDestination(role, { newAccount = false } = {}) {
  const normalizedRole = String(role || '').trim().toLowerCase();
  if (normalizedRole === 'admin') return '/admin';
  if (normalizedRole === 'student') return newAccount ? '/builder?welcome=1' : '/home';
  return newAccount ? '/profile#family-controls' : '/profile';
}

export function resolveAuthDestination(requestedPath, role, options) {
  const safeRequestedPath = typeof requestedPath === 'string'
    && requestedPath.startsWith('/')
    && !requestedPath.startsWith('//')
    ? requestedPath
    : '/';
  return safeRequestedPath === '/'
    ? defaultAuthDestination(role, options)
    : safeRequestedPath;
}

// ── A parent who came to pay ────────────────────────────────────────────────
//
// The paid plan's button on /pricing sends a signed-out parent to make an
// account (/register?for=plus) or to sign in (/login?from=pricing). Either
// way they are brought back to the plan, where the button is now "Subscribe".
// Before 23 November 2026 neither address meant anything to the page it led
// to, and a parent who did as asked was left on the home page.
export const PLUS_PATH = '/pricing#codeit-plus';

export function cameForPlus(searchParams) {
  if (!searchParams || typeof searchParams.get !== 'function') return false;
  return searchParams.get('for') === 'plus' || searchParams.get('from') === 'pricing';
}
