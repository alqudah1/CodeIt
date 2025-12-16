import { Link } from 'react-router-dom';
import { useCharacter } from '../../context/CharacterContext';
import CharacterAvatar from '../CharacterAvatar/CharacterAvatar';
import './CharacterSpotlight.css';

const descriptionByOutfit = {
  astronaut: 'explores cosmic coding missions in style.',
  explorer: 'loves uncovering hidden patterns and puzzles.',
  hacker: 'debugs mysteries with lightning-fast logic.',
  artist: 'paints vibrant worlds with code and creativity.',
};

const CharacterSpotlight = ({ headline = 'Your CodeIt buddy', cta = 'Open character lab', size = 220 }) => {
  const { character } = useCharacter();
  const summary = descriptionByOutfit[character.outfit] || descriptionByOutfit.astronaut;

  return (
    <section className="character-spotlight" aria-labelledby="character-card-headline">
      <div className="character-spotlight__media">
        <CharacterAvatar character={character} size={size} />
      </div>
      <div className="character-spotlight__content">
        <h3 id="character-card-headline">{headline}</h3>
        <p className="character-spotlight__nickname">{character.nickname}</p>
        <p className="character-spotlight__summary">
          This character {summary}
        </p>
        <Link to="/character" className="character-spotlight__cta">
          {cta}
        </Link>
      </div>
    </section>
  );
};

export default CharacterSpotlight;