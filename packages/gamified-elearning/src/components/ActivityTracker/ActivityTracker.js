import { useCallback, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';

export const ACTIVITY_PING_INTERVAL_MS = 15 * 60 * 1000;

export default function ActivityTracker() {
  const { token } = useContext(AuthContext);
  const lastPingAt = useRef(0);

  const ping = useCallback(() => {
    if (!token || document.visibilityState === 'hidden') return;
    const now = Date.now();
    if (now - lastPingAt.current < ACTIVITY_PING_INTERVAL_MS) return;
    lastPingAt.current = now;

    fetch(`${API_BASE_URL}/api/activity/ping`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      keepalive: true,
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    lastPingAt.current = 0;
    ping();
    window.addEventListener('focus', ping);
    document.addEventListener('visibilitychange', ping);
    return () => {
      window.removeEventListener('focus', ping);
      document.removeEventListener('visibilitychange', ping);
    };
  }, [ping]);

  return null;
}
