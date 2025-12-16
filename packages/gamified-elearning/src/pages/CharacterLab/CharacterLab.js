import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import { useCharacter, getDefaultCharacter } from '../../context/CharacterContext';
import './CharacterLab.css';

const genderOptions = [
  { value: 'female', label: 'Female base' },
  { value: 'male', label: 'Male base' },
];

const skinOptions = [
  { value: 'sunset', label: 'Sunset Glow', swatch: '#f6c7a3' },
  { value: 'sand', label: 'Golden Sand', swatch: '#ebb190' },
  { value: 'cocoa', label: 'Warm Cocoa', swatch: '#c88762' },
  { value: 'deep', label: 'Amber Ember', swatch: '#8d5238' },
  { value: 'pearl', label: 'Moon Pearl', swatch: '#f4ddd0' },
];

const hairStyleOptions = [
  { value: 'wave', label: 'Wave Rider' },
  { value: 'crown', label: 'Spark Crown' },
  { value: 'bun', label: 'Stellar Bun' },
  { value: 'curls', label: 'Neon Curls' },
  { value: 'pixie', label: 'Pixel Pixie' },
];

const hairColorOptions = [
  { value: 'mocha', label: 'Mocha Breeze', swatch: '#4b2e2b' },
  { value: 'midnight', label: 'Midnight Nova', swatch: '#1d1a39' },
  { value: 'copper', label: 'Copper Comet', swatch: '#c6643d' },
  { value: 'gold', label: 'Solar Gold', swatch: '#f6c06b' },
  { value: 'ocean', label: 'Ocean Spark', swatch: '#2b7de9' },
  { value: 'lavender', label: 'Cosmic Lavender', swatch: '#8660c1' },
];

const outfitOptions = [
  { value: 'astronaut', label: 'Galactic Astronaut', description: 'Ready for stellar missions.' },
  { value: 'explorer', label: 'Jungle Explorer', description: 'Finds clues in every jungle of code.' },
  { value: 'hacker', label: 'Arcade Hacker', description: 'Debugs glitches with electric style.' },
  { value: 'artist', label: 'Neon Artist', description: 'Paints vibrant story interfaces.' },
];

const accentOptions = [
  { value: 'headphones', label: 'Beat Headphones' },
  { value: 'glasses', label: 'Code Specs' },
  { value: 'cape', label: 'Hero Cape' },
  { value: 'none', label: 'Keep it simple' },
];

const expressionOptions = [
  { value: 'smile', label: 'Confident Smile' },
  { value: 'laugh', label: 'Bright Laugh' },
  { value: 'wink', label: 'Cheeky Wink' },
];

const CharacterLab = () => {
  const navigate = useNavigate();
  const { character, updateCharacter, resetCharacter } = useCharacter();
  const [showSaved, setShowSaved] = useState(false);
  const gender = character.gender || 'female';

  const handleChange = (key, value) => {
    updateCharacter({ [key]: value });
    setShowSaved(true);
    window.setTimeout(() => setShowSaved(false), 1200);
  };

  const nickname = character.nickname || '';
  const selectedGender = genderOptions.find((option) => option.value === gender) || genderOptions[0];

  const quickSummary = useMemo(() => {
    const outfit = outfitOptions.find((option) => option.value === character.outfit);
    const expression = expressionOptions.find((option) => option.value === character.expression);
    const pronoun = gender === 'male' ? 'He' : 'She';
    const energy = gender === 'male' ? 'bold' : 'radiant';
    const summaryIntro = `${nickname || 'Your buddy'} ${outfit?.description || 'loves coding quests'} with a ${expression?.label.toLowerCase()}.`;
    return `${summaryIntro} ${pronoun} brings a ${energy} energy to every challenge.`;
  }, [nickname, character.outfit, character.expression, gender]);

  const handleReset = () => {
    resetCharacter();
  };

  const handleNicknameChange = (event) => {
    updateCharacter({ nickname: event.target.value.slice(0, 28) });
  };

  return (
    <div className="character-lab">
      <header className="character-lab__hero">
        <button type="button" className="character-lab__back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <span className="character-lab__tag">New</span>
        <h1>Create your CodeIt buddy</h1>
        <p>
          Tune the colors, vibes, and accessories that greet you across the platform. Your buddy
          travels with you through lessons, quizzes, and games.
        </p>
        {showSaved && <div className="character-lab__toast">Saved!</div>}
      </header>

      <section className="character-lab__preview">
        <CharacterAvatar character={character} size={260} />
        <div className="character-lab__preview-copy">
          <h2>{nickname || 'Name your adventurer'}</h2>
          <p>{quickSummary}</p>
          <p className="character-lab__meta">Current base: {selectedGender.label}</p>
          <div className="character-lab__field">
            <label htmlFor="nickname">Nickname</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              maxLength={28}
              placeholder="E.g. Pixel Wizard"
              onChange={handleNicknameChange}
            />
          </div>
          <button type="button" className="character-lab__reset" onClick={handleReset}>
            Reset to default
          </button>
        </div>
      </section>

      <section className="character-lab__grid">
        <fieldset className="character-lab__panel">
          <legend>Base style</legend>
          <div className="option-stack">
            {genderOptions.map((option) => (
              <label key={option.value} className={`pill ${gender === option.value ? 'is-active' : ''}`}>
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={gender === option.value}
                  onChange={() => handleChange('gender', option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="character-lab__panel">
          <legend>Skin tone</legend>
          <div className="option-grid">
            {skinOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`swatch ${character.skinTone === option.value ? 'is-active' : ''}`}
                onClick={() => handleChange('skinTone', option.value)}
                style={{ '--swatch-color': option.swatch }}
                aria-pressed={character.skinTone === option.value}
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="character-lab__panel">
          <legend>Hair style</legend>
          <div className="option-stack">
            {hairStyleOptions.map((option) => (
              <label key={option.value} className={`pill ${character.hairStyle === option.value ? 'is-active' : ''}`}>
                <input
                  type="radio"
                  name="hair-style"
                  value={option.value}
                  checked={character.hairStyle === option.value}
                  onChange={() => handleChange('hairStyle', option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="character-lab__panel">
          <legend>Hair color</legend>
          <div className="option-grid">
            {hairColorOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`swatch ${character.hairColor === option.value ? 'is-active' : ''}`}
                onClick={() => handleChange('hairColor', option.value)}
                style={{ '--swatch-color': option.swatch }}
                aria-pressed={character.hairColor === option.value}
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="character-lab__panel">
          <legend>Outfit</legend>
          <div className="option-card-grid">
            {outfitOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`option-card ${character.outfit === option.value ? 'is-active' : ''}`}
                onClick={() => handleChange('outfit', option.value)}
                aria-pressed={character.outfit === option.value}
              >
                <h3>{option.label}</h3>
                <p>{option.description}</p>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="character-lab__panel">
          <legend>Accessories</legend>
          <div className="option-stack">
            {accentOptions.map((option) => (
              <label key={option.value} className={`pill ${character.accent === option.value ? 'is-active' : ''}`}>
                <input
                  type="radio"
                  name="accent"
                  value={option.value}
                  checked={character.accent === option.value}
                  onChange={() => handleChange('accent', option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="character-lab__panel">
          <legend>Expression</legend>
          <div className="option-stack">
            {expressionOptions.map((option) => (
              <label key={option.value} className={`pill ${character.expression === option.value ? 'is-active' : ''}`}>
                <input
                  type="radio"
                  name="expression"
                  value={option.value}
                  checked={character.expression === option.value}
                  onChange={() => handleChange('expression', option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <footer className="character-lab__footer">
        <p>
          Tips: visit lessons or your dashboard to see your updated buddy cheering you on. Looking for
          inspiration? Try the default combo&nbsp;
          <button type="button" onClick={() => updateCharacter(getDefaultCharacter())} className="character-lab__link">
            Code Explorer
          </button>
          .
        </p>
        <button type="button" className="character-lab__primary" onClick={() => navigate('/')}>
          Done — return home
        </button>
      </footer>
    </div>
  );
};

export default CharacterLab;