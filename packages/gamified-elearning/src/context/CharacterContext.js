import React, { createContext, useContext, useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ENDPOINTS } from "../config/api";

// ── Character defaults ────────────────────────────────────────────────────────
const DEFAULT_CHARACTER = {
  gender:     'female',
  skinTone:   'sunset',
  hairStyle:  'wave',
  hairColor:  'mocha',
  outfit:     'astronaut',
  accent:     'headphones',
  expression: 'smile',
  nickname:   '',
};

function getToken() {
  return localStorage.getItem('token') || null;
}

const CharacterContext = createContext(null);

export function CharacterProvider({ children }) {
  // Start with defaults — authoritative data always comes from DB on mount.
  // No localStorage cache: character is critical data and must be cross-device.
  const [character, setCharacter] = useState(DEFAULT_CHARACTER);
  const [characterLoaded, setCharacterLoaded] = useState(false);
  const fetchedRef = useRef(false);
  const saveTimerRef = useRef(null);

  // ── On mount: fetch character from DB if authenticated ────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCharacterLoaded(true);
      return;
    }
    fetch(ENDPOINTS.profile.get, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.character) {
          const dbChar = {
            ...DEFAULT_CHARACTER,
            gender:     data.character.gender     || DEFAULT_CHARACTER.gender,
            skinTone:   data.character.skinTone   || DEFAULT_CHARACTER.skinTone,
            hairStyle:  data.character.hairStyle  || DEFAULT_CHARACTER.hairStyle,
            hairColor:  data.character.hairColor  || DEFAULT_CHARACTER.hairColor,
            outfit:     data.character.outfit     || DEFAULT_CHARACTER.outfit,
            accent:     data.character.accent     || DEFAULT_CHARACTER.accent,
            expression: data.character.expression || DEFAULT_CHARACTER.expression,
            nickname:   data.character.nickname   ?? DEFAULT_CHARACTER.nickname,
          };
          setCharacter(dbChar);
        }
        if (data?.stats) {
          setStats(data.stats);
        }
        fetchedRef.current = true;
        setCharacterLoaded(true);
      })
      .catch(() => {
        // Network error — keep defaults; changes will save to DB when connectivity returns
        fetchedRef.current = true;
        setCharacterLoaded(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced save to DB (1 500 ms after last change) ────────────────────
  useEffect(() => {
    if (!fetchedRef.current) return; // don't write back until we've read from DB
    const token = getToken();
    if (!token) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(ENDPOINTS.profile.character, {
        method:  'PUT',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify(character),
      }).catch(() => {
        // Silently fail — DB will sync on next successful request
      });
    }, 1500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [character]);

  const updateCharacter = useCallback(
    (patch) => setCharacter(prev => ({ ...prev, ...patch })),
    []
  );

  const resetCharacter = useCallback(
    () => setCharacter(DEFAULT_CHARACTER),
    []
  );

    const [stats, setStats] = useState(null);
  const [pendingXP, setPendingXP] = useState(null);

  const awardXP = useCallback((amount) => {
    setPendingXP({ amount, id: Date.now() });
    setStats(prev => prev ? { ...prev, totalXP: (prev.totalXP || 0) + amount } : prev);
  }, []);

  const clearPendingXP = useCallback(() => setPendingXP(null), []);

  const api = useMemo(
    () => ({ character, characterLoaded, updateCharacter, resetCharacter, stats, pendingXP, awardXP, clearPendingXP }),
    [character, characterLoaded, updateCharacter, resetCharacter, stats, pendingXP, awardXP, clearPendingXP]
  );

  return (
    <CharacterContext.Provider value={api}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const ctx = useContext(CharacterContext);
  if (!ctx) throw new Error("useCharacter must be used within a CharacterProvider");
  return ctx;
}

export function getDefaultCharacter() {
  return DEFAULT_CHARACTER;
}
