import React, { createContext, useContext, useMemo, useState } from "react";

const CharacterContext = createContext(null);

const defaultCharacter = {
  name: "CodeIt Buddy",
  base: "default",
  color: "blue",
  accessories: [],
};

export function CharacterProvider({ children }) {
  const [character, setCharacter] = useState(defaultCharacter);

  const api = useMemo(
    () => ({
      character,
      setCharacter,
      getDefaultCharacter: () => defaultCharacter,
    }),
    [character]
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
  return defaultCharacter;
}
