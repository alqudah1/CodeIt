import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import { starterGameById } from '../Builder/starterGames';
import { trackEvent } from '../../utils/trackEvent';
import './AvatarInGame.css';

// ── The argument, shown ──────────────────────────────────────────────────────
//
// The avatar a child builds in the lab is the player in the games that child
// builds. utils/avatarSprite.js serialises the lab's own drawing into a sprite,
// the studio hands it to every preview, and the star game draws it as the
// catcher. Scratch has sprites; Tynker has characters; nobody else takes the
// character the child made and drops it into the game the child made.
//
// It has worked since 31 August and nothing on the site said so. This is the
// same code path, on the home page: three choices, one button, and the
// character you just made is catching stars in a game you can play. No
// account, and the marketing page's other rules still hold around it: cream,
// ink, one accent, and the playfulness is inside the frame, where the product
// is.

export const SKIN = [
  { value: 'sunset', label: 'Sunset', swatch: '#f6c7a3' },
  { value: 'sand',   label: 'Sand',   swatch: '#ebb190' },
  { value: 'cocoa',  label: 'Cocoa',  swatch: '#c88762' },
  { value: 'deep',   label: 'Ember',  swatch: '#8d5238' },
  { value: 'pearl',  label: 'Pearl',  swatch: '#f4ddd0' },
];
export const HAIR = [
  { value: 'mocha',    label: 'Brown',  swatch: '#4b2e2b' },
  { value: 'midnight', label: 'Black',  swatch: '#1d1a39' },
  { value: 'copper',   label: 'Copper', swatch: '#c6643d' },
  { value: 'gold',     label: 'Gold',   swatch: '#f6c06b' },
  { value: 'ocean',    label: 'Blue',   swatch: '#2b7de9' },
  { value: 'lavender', label: 'Purple', swatch: '#8660c1' },
];
export const OUTFIT = [
  { value: 'astronaut', label: 'Astronaut', swatch: '#4051db' },
  { value: 'explorer',  label: 'Explorer',  swatch: '#f28b50' },
  { value: 'hacker',    label: 'Hacker',    swatch: '#20a372' },
  { value: 'artist',    label: 'Artist',    swatch: '#9c4dcc' },
];

const START = {
  gender: 'female', skinTone: 'sunset', hairStyle: 'wave', hairColor: 'mocha',
  outfit: 'astronaut', accent: 'headphones', expression: 'smile', nickname: '',
};

function Swatches({ label, options, value, onPick }) {
  return (
    <div className="avdemo__row" role="radiogroup" aria-label={label}>
      <span className="avdemo__row-label">{label}</span>
      <div className="avdemo__swatches">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            aria-label={option.label}
            title={option.label}
            className={`avdemo__swatch${value === option.value ? ' is-on' : ''}`}
            style={{ '--swatch': option.swatch }}
            onClick={() => onPick(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

export default function AvatarInGame() {
  const [character, setCharacter] = useState(START);
  const [playing, setPlaying] = useState(false);
  const [srcDoc, setSrcDoc] = useState('');

  const game = useMemo(() => starterGameById('catch-stars'), []);

  // The sprite module pulls in react-dom/server, which nobody reading the
  // page needs until they press the button. Loaded then, not before.
  useEffect(() => {
    if (!playing || !game) return undefined;
    let live = true;
    import('../../utils/avatarSprite').then(({ avatarSpriteDataUri, injectPlayerSprite }) => {
      if (!live) return;
      const sprite = avatarSpriteDataUri(character);
      setSrcDoc(injectPlayerSprite(game.code, sprite));
    });
    return () => { live = false; };
  }, [playing, character, game]);

  const pick = (patch) => setCharacter((prev) => ({ ...prev, ...patch }));

  if (!game) return null;

  return (
    <section className="avdemo" aria-labelledby="avdemo-title">
      <div className="avdemo__head">
        <h2 id="avdemo-title">Make a character. It becomes the player in the game.</h2>
        <p>Three picks, one button. The character you build here is the one catching the stars.</p>
      </div>

      <div className={`avdemo__body${playing ? ' is-playing' : ''}`}>
        <div className="avdemo__maker">
          <div className="avdemo__preview" aria-hidden="true">
            <CharacterAvatar character={character} size={150} />
          </div>
          <Swatches label="Skin" options={SKIN} value={character.skinTone} onPick={(v) => pick({ skinTone: v })} />
          <Swatches label="Hair" options={HAIR} value={character.hairColor} onPick={(v) => pick({ hairColor: v })} />
          <Swatches label="Outfit" options={OUTFIT} value={character.outfit} onPick={(v) => pick({ outfit: v })} />
          <button
            type="button"
            className="avdemo__go"
            onClick={() => {
              setPlaying(true);
              trackEvent('landing_cta_click', 'avatar-demo');
            }}
          >
            {playing ? 'Update me in the game' : 'Put me in the game'}
          </button>
        </div>

        {playing && (
          <div className="avdemo__stage">
            {srcDoc ? (
              <iframe
                className="avdemo__frame"
                title="Catch the falling stars, played as the character you just made"
                sandbox="allow-scripts"
                srcDoc={srcDoc}
              />
            ) : (
              <p className="avdemo__loading" role="status">Drawing you into the game…</p>
            )}
            <p className="avdemo__hint">Move across the game to catch the stars. That is your character.</p>
          </div>
        )}
      </div>

      <p className="avdemo__more">
        <Link to="/character" onClick={() => trackEvent('landing_cta_click', 'avatar-demo-lab')}>
          Build the full avatar and keep it
        </Link>
        <span> Every game your child makes in the studio uses it.</span>
      </p>
    </section>
  );
}
