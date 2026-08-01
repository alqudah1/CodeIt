export function defaultAuthDestination(role, { newAccount = false } = {}) {
  const normalizedRole = String(role || '').trim().toLowerCase();
  if (normalizedRole === 'admin') return '/admin';
  if (normalizedRole === 'student') return newAccount ? '/builder?welcome=1' : '/MainPage';
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
