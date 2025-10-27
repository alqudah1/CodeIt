import { createContext, useContext, useState, useEffect } from 'react';

const CharacterContext = createContext();

export const getDefaultCharacter = () => ({
  nickname: 'Code Explorer',
  gender: 'female',
  skinTone: 'sunset',
  hairStyle: 'wave',
  hairColor: 'mocha',
  outfit: 'astronaut',
  accent: 'headphones',
  expression: 'smile',
});

export const CharacterProvider = ({ children }) => {
  const [character, setCharacter] = useState(() => {
    const saved = localStorage.getItem('codeit-character');
    if (saved) {
      try {
        return { ...getDefaultCharacter(), ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse character data:', e);
        return getDefaultCharacter();
      }
    }
    return getDefaultCharacter();
  });

  useEffect(() => {
    localStorage.setItem('codeit-character', JSON.stringify(character));
  }, [character]);

  const updateCharacter = (updates) => {
    setCharacter((prev) => ({ ...prev, ...updates }));
  };

  const resetCharacter = () => {
    setCharacter(getDefaultCharacter());
  };

  return (
    <CharacterContext.Provider value={{ character, updateCharacter, resetCharacter }}>
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
};

export default CharacterContext;

