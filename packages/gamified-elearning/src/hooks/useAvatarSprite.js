import { useEffect, useMemo, useState } from 'react';

// The child's avatar as the player in the starters. The sprite module pulls
// in react-dom/server, so it is loaded after the page is up rather than
// before. Returns a function that hands a game document the sprite, or the
// identity until the module is here.
export default function useAvatarSprite(character) {
  const [sprite, setSprite] = useState('');
  const [inject, setInject] = useState(null);
  useEffect(() => {
    let live = true;
    import('../utils/avatarSprite').then(({ avatarSpriteDataUri, injectPlayerSprite }) => {
      if (!live) return;
      setSprite(avatarSpriteDataUri(character));
      setInject(() => injectPlayerSprite);
    }).catch(() => {});
    return () => { live = false; };
  }, [character]);
  return useMemo(
    () => (inject && sprite ? (code) => inject(code, sprite) : (code) => code),
    [inject, sprite]
  );
}
