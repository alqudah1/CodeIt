import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { getXpProgress } from '../data/unlocks';

// Fetches XP from the journey progress endpoint and returns level info.
// Safe to call from any component that has a token.
export function usePlayerProgress(token) {
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE_URL}/api/journey/progress`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success) setXp(Number(data.xp) || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // Spread level + progress breakdown inline
  return { xp, loading, ...getXpProgress(xp) };
}
