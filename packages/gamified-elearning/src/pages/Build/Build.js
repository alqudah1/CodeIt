// ── Build: say a game, get a game ───────────────────────────────────────────
//
// The page a child lands on to make something. Two doors, one game:
//
//   Say it   a sentence in their own words. The box turns into the sky they
//            mention and the things they name pop into a tray as they type.
//            Two seconds later the game is in the frame.
//   Make it  seven choices with big cards: where, who, what you do, what
//            comes at you, what you collect, a twist, a name. The frame
//            rebuilds on every tap, so the choice lands before moving on.
//
// Under the frame: four knobs (you, enemy, twist, lives) that cycle the game
// live, Publish, and "See the code", which opens the same game in the full
// studio (/builder) where the lines at the top are the knobs.
//
// Nothing here waits on the full AI build. The recipe endpoint answers in
// about two seconds; if it does not, recipeLocal.js builds the same game from
// the sentence with no network. A child never sees the word error.

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import TabBar from '../../ds/TabBar';
import ExampleCards, { ExampleHero } from '../../ds/Examples';
import { API_BASE_URL } from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import { useCharacterDisplay } from '../../context/CharacterContext';
import { useSEO } from '../../hooks/useSEO';
import { journeyHeaders } from '../../utils/journey';
import { avatarSpriteDataUri, injectPlayerSprite } from '../../utils/avatarSprite';
import { saveProject as saveShelfProject } from '../../utils/projectShelf';
import { recipeGame } from '../Builder/recipeGame';
import { PLAYERS, ENEMIES, TREASURES, SPRITE_LABEL } from './sprites';
import { IDEAS, SKY_NAMES, TWISTS, keepTheirWord, localRecipe, looksLikeGame, nameFor, normaliseRecipe, rollIdea } from './recipeLocal';
import { namedGame } from './gameWords';
import { KINDS, KIND_SAY, nounsIn, wordFor } from './gameWords';
import Look from './Look';
import ProveItPanel from '../Builder/ProveItPanel';
import { hasUnderstood, recordUnderstanding } from '../../utils/understanding';
import { trackEvent } from '../../utils/trackEvent';
import { whyUnreachable } from '../../ds/Offline';
import '../../ds/ds.css';
import './Build.css';

const SKY_COLOURS = { space: ['#2A1E5C', '#5B3FD6'], night: ['#1E1B3A', '#35220E'], ocean: ['#042F4A', '#0E7490'], candy: ['#FF6B6B', '#FFD6E0'], day: ['#3EB7F8', '#BFE6FF'], sunset: ['#FF7A00', '#FFC93C'] };
const SKY_LABEL = { space: 'Space', night: 'Night', ocean: 'Under the sea', candy: 'Candy land', day: 'Day', sunset: 'Sunset' };
const TWIST_LABEL = { none: 'None', faster: 'Faster', waves: 'Waves' };
const KIND_LABEL = KIND_SAY;
const KIND_ICON = { catch: 'coin', dodge: 'bomb', shooter: 'rock', runner: 'carrot', flyer: '🐦', racer: '🏎️', maze: '🧩', pop: '🎈', pet: '🐶' };
const STEPS = ['Reading your idea', 'Picking the kind of game', 'Choosing who you are', 'Choosing the enemies', 'Setting the speed'];
const FIRST_PUBLISH_KEY = 'codeit_first_publish_done';

const WIZARD = [
  { key: 'sky', title: 'Where does it happen?', hint: 'Pick a world. The frame changes as you tap.', options: SKY_NAMES.map((v) => ({ value: v, label: SKY_LABEL[v], sky: true })) },
  { key: 'player', title: 'Who are you?', hint: 'Your hero.', options: PLAYERS.map((v) => ({ value: v, label: SPRITE_LABEL[v], sprite: v })) },
  { key: 'kind', title: 'What do you do?', hint: 'The one rule of the game.', two: true, options: KINDS.map((v) => ({ value: v, label: KIND_LABEL[v], sprite: KIND_ICON[v] })) },
  { key: 'enemy', title: 'What comes at you?', hint: 'The enemy.', options: ENEMIES.map((v) => ({ value: v, label: SPRITE_LABEL[v], sprite: v })) },
  { key: 'treasure', title: 'What do you collect?', hint: 'The treasure.', options: TREASURES.map((v) => ({ value: v, label: SPRITE_LABEL[v], sprite: v })) },
  { key: 'twist', title: 'Add a twist.', hint: 'This is what makes it yours.', options: TWISTS.map((v) => ({ value: v, label: v === 'none' ? 'Keep it simple' : v === 'faster' ? 'Gets faster' : 'Comes in waves', sprite: v === 'none' ? 'star' : v === 'faster' ? 'sun' : 'rock' })) },
  { key: 'title', title: 'Name it.', hint: 'Then publish.', naming: true },
];

const DEFAULT_RECIPE = { kind: 'catch', title: '', player: 'hero', enemy: 'bomb', treasure: 'coin', sky: 'day', speed: 2, lives: 3, winAt: 15, twist: 'none' };
const KNOB_CYCLE = { player: PLAYERS, enemy: ENEMIES, twist: TWISTS, lives: [1, 3, 5] };

const SITE_WORDS = /\b(quiz|trivia|website|web site|webpage|web page|home ?page|portfolio|shop|store|calculator|flash ?cards?|blog|page about|chat ?bot|essay|story|slideshow|presentation)\b/i;
const triesFor = (word) => [`a ${word} that catches stars`, `a ${word} that flies through the clouds`, `a maze where a ${word} finds treasure`];

// How the game reads back to the child: what kind it is, who they are, what
// they catch and what they avoid, in their own words. If no word said which
// kind of game it is, it says so, and every kind is one tap away.
const PART = { player: 'you', enemy: 'bad thing', treasure: 'treasure' };
const KIND_NOUN = { catch: 'a catching game', dodge: 'a dodging game', shooter: 'a shooting game', runner: 'a running game', flyer: 'a flying game', racer: 'a racing game', maze: 'a maze', pop: 'a popping game', pet: 'a pet game' };
function Thing({ recipe, part }) {
  const word = recipe.words?.[part] || SPRITE_LABEL[recipe[part]] || wordFor(recipe[part]) || PART[part];
  return <><Look look={recipe[part]} /> <b>{String(word).toLowerCase()}</b></>;
}
function rule(recipe) {
  const P = <Thing recipe={recipe} part="player" />, E = <Thing recipe={recipe} part="enemy" />, T = <Thing recipe={recipe} part="treasure" />;
  switch (recipe.kind) {
    case 'catch': return <>You are the {P}. Catch the {T}, not the {E}.</>;
    case 'dodge': return <>You are the {P}. Dodge the {E}, collect the {T}.</>;
    case 'shooter': return <>You are the {P}. Shoot the {E} before they land.</>;
    case 'runner': return <>You are the {P}. Jump over the {E}, collect the {T}.</>;
    case 'flyer': return <>You are the {P}. Flap through the gaps in the {E}, collect the {T}.</>;
    case 'racer': return <>You are the {P}. Swap lanes to pass the {E}, pick up the {T}.</>;
    case 'maze': return <>You are the {P}. Find every {T}, keep away from the {E}.</>;
    case 'pop': return <>Tap the {T} before they go. Not the {E}.</>;
    case 'pet': return <>Your pet is the {P}. Feed it {T}, play with it, tap the {E} away.</>;
    default: return null;
  }
}
function WhatWeMade({ recipe, said, aiDown, onKind }) {
  return (
    <div className="bd__made ci-rise" role="status">
      {recipe.fits === false && <p className="bd__unsure">We could not tell which kind of game you meant, so we started with {KIND_NOUN[recipe.kind]}. Pick the closest one below.</p>}
      <div><b>{KIND_SAY[recipe.kind]}.</b> {rule(recipe)}</div>
      <div className="bd__kinds" role="group" aria-label="Make it a different kind of game">
        {KINDS.map((k) => (
          <button key={k} type="button" className={`bd__kind${k === recipe.kind ? ' is-on' : ''}`} aria-pressed={k === recipe.kind} onClick={() => onKind(k)}>
            <Look look={KIND_ICON[k]} />{KIND_SAY[k]}
          </button>
        ))}
      </div>
      {said && !aiDown && (
        <p className="bd__exact">Not what you imagined? <Link to={`/builder?prompt=${encodeURIComponent(said)}&go=1&scratch=1`}>Have the studio write it from scratch</Link>. It takes about a minute.</p>
      )}
    </div>
  );
}

let audio = null;
function tone(freq, length = 0.08, type = 'sine', volume = 0.05) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audio = audio || new Ctx();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type; osc.frequency.value = freq; gain.gain.value = volume;
    osc.connect(gain); gain.connect(audio.destination); osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + length);
    osc.stop(audio.currentTime + length);
  } catch { /* sound is a bonus, never a requirement */ }
}
const chord = () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'triangle'), i * 70));

export default function Build() {
  // Title and description come from src/data/pageMeta.js, which the crawlable copy reads too.
  useSEO({ canonical: '/build' });
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useContext(AuthContext);
  const { character } = useCharacterDisplay();

  const [mode, setMode] = useState('say');
  const [idea, setIdea] = useState('');
  const [tray, setTray] = useState([]);
  const [skyHint, setSkyHint] = useState('');
  const [notGame, setNotGame] = useState(null);
  // A game the child named that has rules of its own (tic tac toe, chess):
  // the sentence, kept so the studio can be handed it.
  const [ownRules, setOwnRules] = useState('');
  const [thinking, setThinking] = useState(-1);
  const [recipe, setRecipe] = useState(null);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({ ...DEFAULT_RECIPE });
  const [autoName, setAutoName] = useState(true);
  const [reels, setReels] = useState(null);
  const [flip, setFlip] = useState('');
  const [published, setPublished] = useState(null);
  // A project the server made before the connection went, so pressing Publish
  // again finishes that one rather than making a second copy.
  const madeId = useRef(null);
  const shelfId = useRef(null);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState('');
  const [ghost, setGhost] = useState('');
  // Whether the model answered. When it is out of credit or unreachable we do
  // not send a child to the studio to wait for a build that cannot happen.
  const [aiDown, setAiDown] = useState(false);
  // "Show it's yours" waits until the child has made the game theirs: changed
  // a knob, picked another kind, or published it. Asking about a game they
  // have not touched would be asking them to explain our template.
  const [changed, setChanged] = useState(false);
  const [said, setSaid] = useState('');
  // The things the child named, so tapping a knob can always come back to them.
  const own = useRef({ player: null, enemy: null });
  const ideaRef = useRef(null);
  const frameRef = useRef(null);
  const toastTimer = useRef(null);

  const say = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }, []);

  // The player is the child's own avatar when there is one.
  const playerSprite = useMemo(() => (user && character ? avatarSpriteDataUri(character) : ''), [user, character]);
  // Your avatar plays only when your sentence did not name who you are: a
  // child who asked to be a samosa is the samosa.
  const gameHtml = useMemo(() => (recipe ? injectPlayerSprite(recipeGame(recipe), recipe.player === 'hero' ? playerSprite : '') : ''), [recipe, playerSprite]);

  // ── The input writes ideas to itself until the child types ──
  useEffect(() => {
    if (idea || mode !== 'say') { setGhost(''); return undefined; }
    let word = 0, chars = 0, deleting = false, timer = 0, alive = true;
    const tick = () => {
      if (!alive) return;
      const w = IDEAS[word % IDEAS.length];
      chars += deleting ? -1 : 1;
      setGhost(w.slice(0, chars));
      if (chars >= w.length) { deleting = true; timer = window.setTimeout(tick, 1400); return; }
      if (chars <= 0) { deleting = false; word += 1; }
      timer = window.setTimeout(tick, deleting ? 24 : 55);
    };
    timer = window.setTimeout(tick, 400);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [idea, mode]);

  // ── The sentence builds the game as it is typed ──
  const onIdea = (value) => {
    setIdea(value);
    setNotGame(null);
    setOwnRules('');
    const t = value.toLowerCase();
    const sky = /space|alien|asteroid|rocket/.test(t) ? 'space' : /night|dark/.test(t) ? 'night' : /sea|ocean|under ?water/.test(t) ? 'ocean' : /sunset|fire|lava/.test(t) ? 'sunset' : /candy|pink|sweet/.test(t) ? 'candy' : '';
    setSkyHint(sky);
    const found = nounsIn(t).slice(0, 6).map((n) => n.emoji);
    setTray((prev) => { if (found.length > prev.length) tone(700 + found.length * 60, 0.06, 'triangle', 0.04); return found; });
  };

  const applyRecipe = useCallback((r, from) => {
    setRecipe(r);
    setDraft((d) => ({ ...d, ...r }));
    setPublished(null);
    madeId.current = null;
    shelfId.current = null;
    if (from === 'build') { chord(); setChanged(false); }
    if (from === 'knob' || from === 'choice') setChanged(true);
  }, []);

  // ── Show it's yours: questions made from this game's own code ──
  const proofKey = recipe ? `build:${recipe.kind}:${recipe.title}:${recipe.player}` : '';
  const proved = ({ skills, questionIds }) => {
    const projectId = madeId.current || shelfId.current || proofKey;
    recordUnderstanding(localStorage, { projectId, projectTitle: recipe.title, skills });
    if (token && Array.isArray(questionIds) && questionIds.length) {
      void fetch(`${API_BASE_URL}/api/understanding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectKey: projectId, projectTitle: recipe.title, questionIds }),
      }).catch(() => { /* the record on this device still stands */ });
    }
    void trackEvent('project_explained', String(skills.length), token);
  };

  // ── Say it: the server's recipe, or ours ──
  const build = useCallback(async (text) => {
    const sentence = String(text || '').trim();
    if (!sentence) { ideaRef.current?.focus(); return; }
    // Tic tac toe is a game, just not one of our nine. It was told "We could
    // not find a game in that yet" and offered dragons (28 October, live).
    const named = namedGame(sentence);
    if (named && !named.kind) {
      setNotGame(null);
      setOwnRules(sentence);
      tone(660, 0.08, 'triangle');
      return;
    }
    setOwnRules('');
    if (!looksLikeGame(sentence)) {
      const word = keepTheirWord(sentence);
      setNotGame({ word, site: SITE_WORDS.test(sentence), tries: triesFor(word) });
      tone(300, 0.08);
      return;
    }
    setNotGame(null);
    setThinking(0);
    const started = Date.now();
    let next = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(`${API_BASE_URL}/api/builder/recipe`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...journeyHeaders(), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ prompt: sentence }),
      });
      clearTimeout(timeout);
      const data = res.ok ? await res.json() : null;
      setAiDown(data?.ai === 'down');
      if (data && data.game === false) {
        const word = keepTheirWord(sentence);
        setThinking(-1);
        setNotGame({ word, site: SITE_WORDS.test(sentence), tries: triesFor(word) });
        tone(300, 0.08);
        return;
      }
      if (data?.recipe) next = normaliseRecipe({ fits: data.fits, ...data.recipe }, sentence);
    } catch {
      next = null;
    }
    if (!next) next = localRecipe(sentence);
    // The five named steps take at least 1.4 s to read, so a fast answer does
    // not flash past and a slow one does not feel stuck.
    const minimum = 1400;
    const elapsed = Date.now() - started;
    for (let i = 1; i < STEPS.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, Math.max(0, (minimum - elapsed) / STEPS.length)));
      setThinking(i);
    }
    setThinking(-1);
    own.current = { player: next.player, enemy: next.enemy };
    setSaid(sentence);
    applyRecipe(next, 'build');
  }, [token, applyRecipe]);

  // ── A different kind of game, from the same sentence ──
  const remake = (kind) => {
    if (!recipe || kind === recipe.kind) return;
    // The child's things stay what they were: the mouse is still you and the
    // cheese still the treasure when a maze becomes a flying game. Only the
    // rule changes, and the name with it.
    const next = said
      ? { ...localRecipe(said, kind), player: recipe.player, enemy: recipe.enemy, treasure: recipe.treasure, words: recipe.words, twist: recipe.twist, lives: recipe.lives }
      : { ...recipe, kind };
    tone(560, 0.06, 'triangle');
    applyRecipe({ ...next, fits: true }, 'knob');
  };

  // ── Make it: every tap rebuilds ──
  const current = WIZARD[step];
  const choose = (value) => {
    const next = { ...draft, [current.key]: value };
    if (autoName || !next.title) next.title = nameFor(next);
    setDraft(next);
    applyRecipe(next, 'choice');
    tone(600 + step * 60, 0.06, 'triangle');
    window.setTimeout(() => setStep((s) => Math.min(WIZARD.length - 1, s + 1)), 520);
  };
  const openMake = (m) => {
    setMode(m);
    if (m === 'make' && !recipe) {
      const first = { ...draft, title: nameFor(draft) };
      setDraft(first);
      applyRecipe(first, 'choice');
    }
    tone(500, 0.04);
  };

  // ── Knobs cycle the live game ──
  const cycle = (key) => {
    if (!recipe) return;
    const mine = own.current[key];
    const list = mine && !KNOB_CYCLE[key].includes(mine) ? [mine, ...KNOB_CYCLE[key]] : KNOB_CYCLE[key];
    const at = list.indexOf(recipe[key]);
    const next = { ...recipe, [key]: list[(at + 1) % list.length] };
    setFlip(key);
    window.setTimeout(() => setFlip(''), 400);
    tone(600, 0.05);
    applyRecipe(next, 'knob');
  };
  const shakeUp = () => {
    if (!recipe) { rollDice(); return; }
    const rnd = (list) => list[Math.floor(Math.random() * list.length)];
    const next = { ...recipe, player: rnd(PLAYERS), enemy: rnd(ENEMIES), sky: rnd(SKY_NAMES), twist: rnd(TWISTS) };
    tone(300, 0.08, 'square'); window.setTimeout(() => tone(600, 0.08, 'square'), 90);
    applyRecipe(next, 'knob');
  };
  const rollDice = () => {
    const parts = rollIdea();
    setReels(parts);
    parts.forEach((_, i) => window.setTimeout(() => tone(400 + i * 120, 0.06, 'square', 0.04), i * 120));
    window.setTimeout(() => { onIdea(parts.join(' ')); tone(900, 0.1, 'triangle'); }, 700);
  };

  // ── Say it out loud ──
  const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const [listening, setListening] = useState(false);
  const listen = () => {
    if (!SR) { say('Your browser cannot listen. Chrome and Safari can.'); return; }
    try {
      const rec = new SR();
      rec.lang = 'en-US'; rec.interimResults = true;
      setListening(true);
      let heard = '';
      rec.onresult = (e) => { heard = Array.from(e.results).map((x) => x[0].transcript).join(''); onIdea(heard); };
      rec.onend = () => { setListening(false); if (heard.trim()) build(heard); };
      rec.onerror = () => setListening(false);
      rec.start();
    } catch { setListening(false); }
  };

  // ── Publish ──
  const publish = async () => {
    if (!recipe || publishing) return;
    setPublishing(true);
    const first = !localStorage.getItem(FIRST_PUBLISH_KEY);
    const prompt = idea.trim() || `Make it: ${recipe.title}`;
    let result = { url: '', xp: 0, kept: false };
    if (user && token) {
      try {
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...journeyHeaders() };
        let id = madeId.current;
        if (!id) {
          const created = await fetch(`${API_BASE_URL}/api/builder/projects`, { method: 'POST', headers, body: JSON.stringify({ title: recipe.title, prompt, generated_code: gameHtml, project_type: 'game' }) });
          const project = created.ok ? await created.json() : null;
          id = project?.id || project?.project?.id || null;
          madeId.current = id;
        }
        if (id) {
          const pub = await fetch(`${API_BASE_URL}/api/builder/projects/${id}/publish`, { method: 'POST', headers });
          const data = pub.ok ? await pub.json() : null;
          if (data?.public_url) result = { url: data.public_url, xp: Number(data.xp_awarded) || 0, kept: true, id };
        }
      } catch (err) { console.error('build/publish:', err); }
      // Signed in and it did not reach the arcade: that is the connection,
      // not a missing account. Say so, and keep the game on this device.
      if (!result.kept) result.offline = true;
    }
    if (!result.kept) {
      const entry = saveShelfProject(localStorage, { id: shelfId.current || undefined, title: recipe.title, prompt, projectType: 'game', code: gameHtml });
      shelfId.current = entry?.id || null;
      result = { ...result, kept: false, shelfId: entry?.id || '' };
    }
    if (!result.offline) localStorage.setItem(FIRST_PUBLISH_KEY, '1');
    setPublished({ ...result, first: first && !result.offline });
    setPublishing(false);
    if (!result.offline) chord();
  };
  const share = async () => {
    const url = published?.url || window.location.origin + '/build';
    try {
      if (navigator.share) { await navigator.share({ title: recipe.title, text: `Play ${recipe.title}, a game I made on CodeIt`, url }); return; }
      await navigator.clipboard.writeText(url);
      say('Link copied. Send it to a friend.');
    } catch { say(url); }
  };
  const seeCode = () => {
    if (!recipe) return;
    const entry = saveShelfProject(localStorage, { title: recipe.title, prompt: idea.trim() || `Make it: ${recipe.title}`, projectType: 'game', code: gameHtml });
    navigate(entry ? `/builder?shelf=${entry.id}` : '/builder');
  };

  // ?prompt=a%20ship%20game from the front page: build it on arrival.
  const builtFromUrl = useRef(false);
  useEffect(() => {
    if (builtFromUrl.current) return;
    const asked = new URLSearchParams(location?.search || '').get('prompt');
    if (asked && asked.trim()) { builtFromUrl.current = true; onIdea(asked.trim()); build(asked.trim()); }
  }, [location, build]); // eslint-disable-line react-hooks/exhaustive-deps

  const skyStyle = skyHint ? { background: `linear-gradient(160deg, ${SKY_COLOURS[skyHint][0]}, ${SKY_COLOURS[skyHint][1]})`, borderColor: 'transparent' } : undefined;
  const dark = skyHint === 'space' || skyHint === 'night' || skyHint === 'ocean';

  return (
    <div className="bd">
      <Header />
      <main className="bd__main">
        <section className="bd__left ci-rise">
          <div className="ci-ey">Build</div>
          <h1 className="ci-h1"><span className="ci-shimmer">{mode === 'say' ? 'Say it.' : 'Make it.'}</span></h1>
          <div className={`ci-seg bd__seg${mode === 'make' ? ' is-second' : ''}`} role="tablist" aria-label="How to build">
            <i aria-hidden="true" />
            <button type="button" role="tab" aria-selected={mode === 'say'} className={mode === 'say' ? 'is-on' : ''} onClick={() => openMake('say')}>Say it</button>
            <button type="button" role="tab" aria-selected={mode === 'make'} className={mode === 'make' ? 'is-on' : ''} onClick={() => openMake('make')}>Make it</button>
          </div>

          {mode === 'say' && (
            <div className="bd__say">
              <div className={`bd__ask${dark ? ' is-dark' : ''}`} style={skyStyle}>
                {!idea && <div className="bd__ghost" aria-hidden="true">{ghost}<span className="bd__cursor" /></div>}
                <textarea
                  ref={ideaRef}
                  className="bd__idea"
                  value={idea}
                  maxLength={120}
                  aria-label="Describe the game you want to play"
                  onChange={(e) => onIdea(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); build(idea); } }}
                />
                <div className="bd__tray" aria-hidden="true">{tray.map((name) => <Look key={name} look={name} className="ci-popin" />)}</div>
                {idea.length >= 100 && <span className="bd__count">{idea.length} / 120</span>}
                <button type="button" className="ci-btn bd__go" onClick={() => build(idea)} disabled={thinking >= 0}>Build it</button>
              </div>
              {ownRules && (
                <div className="bd__own ci-rise" role="status">
                  <b>“{ownRules}” has rules of its own.</b> The quick games here come in nine kinds and yours is none of them, so the studio writes it from scratch, just for you. It takes about a minute.
                  <div className="bd__ownacts">
                    <button type="button" className="ci-btn" onClick={() => navigate(`/builder?prompt=${encodeURIComponent(ownRules)}&go=1`)}>Write it for me</button>
                  </div>
                </div>
              )}
              {notGame && (
                <div className="bd__notgame ci-rise" role="status">
                  <b>{notGame.site ? 'That sounds like a website, not a game.' : 'We could not find a game in that yet.'}</b> {notGame.site ? 'Try a game you would play:' : 'Say who you are and what you do. Like one of these:'}
                  <div className="bd__chips">{notGame.tries.map((t) => <button key={t} type="button" className="ci-chip" onClick={() => { onIdea(t); build(t); }}>{t}</button>)}</div>
                  {!aiDown && <small>Or {notGame.site ? 'make it as a website' : 'have it written from scratch'}: <Link to={`/builder?prompt=${encodeURIComponent(idea.trim())}&go=1`}>open the studio with your idea</Link>.</small>}
                </div>
              )}
              {reels && (
                <div className="bd__reels" aria-hidden="true">{reels.map((r, i) => <span key={`${r}-${i}`} style={{ animationDelay: `${i * 0.12}s` }}>{r}</span>)}</div>
              )}
              <div className="bd__tools">
                <button type="button" className={`bd__tool${listening ? ' is-rec' : ''}`} onClick={listen}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
                  {listening ? 'Listening' : 'Say it out loud'}
                </button>
                <button type="button" className="bd__tool" onClick={rollDice}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="9" cy="9" r="1.3" fill="currentColor" /><circle cx="15" cy="15" r="1.3" fill="currentColor" /><circle cx="15" cy="9" r="1.3" fill="currentColor" /><circle cx="9" cy="15" r="1.3" fill="currentColor" /></svg>
                  Roll an idea
                </button>
                <button type="button" className="bd__tool" onClick={shakeUp}>Shake it up</button>
              </div>
              <div className="bd__chips bd__chips--scroll">
                {IDEAS.slice(0, 4).map((t) => <button key={t} type="button" className="ci-chip" onClick={() => { onIdea(t); build(t); }}>{t}</button>)}
              </div>
              {!recipe && <ExampleCards from={4} count={4} title="Or start from one of these" onPick={(t) => { onIdea(t); build(t); }} className="bd__ex" />}
            </div>
          )}

          {mode === 'make' && (
            <div className="bd__make" key={step}>
              <div className="bd__wstep ci-rise">
                <h3 className="bd__wtitle">{current.title}</h3>
                <p className="bd__whint">{current.hint}</p>
                {current.naming ? (
                  <div className="bd__name">
                    <input
                      aria-label="Name your game"
                      maxLength={22}
                      value={draft.title}
                      onChange={(e) => { setAutoName(false); const next = { ...draft, title: e.target.value }; setDraft(next); setRecipe((r) => (r ? { ...r, title: e.target.value } : r)); }}
                    />
                    <button type="button" className="bd__tool" onClick={() => { const t = nameFor(draft, Math.random); setAutoName(false); setDraft({ ...draft, title: t }); setRecipe((r) => (r ? { ...r, title: t } : r)); tone(700, 0.06); }}>Another name</button>
                  </div>
                ) : (
                  <div className={`bd__choices${current.two ? ' is-two' : ''}`}>
                    {current.options.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        className={`bd__choice${draft[current.key] === o.value ? ' is-on' : ''}`}
                        onClick={() => choose(o.value)}
                        onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`); e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`); }}
                      >
                        <span className="bd__tick" aria-hidden="true">✓</span>
                        {o.sky ? (
                          <span className="bd__skyp" style={{ background: `linear-gradient(${SKY_COLOURS[o.value][0]}, ${SKY_COLOURS[o.value][1]})` }}>
                            {(o.value === 'space' || o.value === 'night') && <><i style={{ left: '20%', top: '30%' }} /><i style={{ left: '60%', top: '20%', animationDelay: '.4s' }} /><i style={{ left: '75%', top: '60%', animationDelay: '.8s' }} /></>}
                          </span>
                        ) : <Look look={o.sprite} />}
                        <b>{o.label}</b>
                      </button>
                    ))}
                  </div>
                )}
                <div className="bd__wnav">
                  {step > 0 && <button type="button" className="ci-btn ci-btn--paper" onClick={() => setStep(step - 1)}>Back</button>}
                  {step < WIZARD.length - 1 && <button type="button" className="ci-btn" onClick={() => setStep(step + 1)}>Next</button>}
                </div>
              </div>
              <div className="bd__dots" aria-hidden="true">{WIZARD.map((w, i) => <i key={w.key} className={i === step ? 'is-on' : i < step ? 'is-done' : ''} />)}</div>
            </div>
          )}
          <p className="bd__keys">On a keyboard: <b>←</b><b>→</b> move, <b>space</b> shoots or jumps. On a phone: drag and tap.</p>
        </section>

        <section className="bd__right ci-rise" style={{ animationDelay: '.08s' }}>
          <div className={`ci-frame bd__frame${recipe ? ' is-lit' : ''}`} ref={frameRef}>
            {gameHtml ? (
              <iframe key={gameHtml.length + recipe.title + recipe.kind + recipe.player + recipe.enemy + recipe.sky + recipe.twist + recipe.lives} title={recipe.title} srcDoc={gameHtml} sandbox="allow-scripts" />
            ) : (
              <ExampleHero onPick={(t) => { onIdea(t); build(t); }} />
            )}
            {thinking >= 0 && (
              <div className="bd__think" role="status" aria-live="polite">
                <div>{STEPS.map((s, i) => <div key={s} className={i < thinking ? 'is-done' : i === thinking ? 'is-now' : ''}><span>{i < thinking ? '✓' : i === thinking ? '›' : '·'}</span> {s}</div>)}</div>
              </div>
            )}
          </div>
          {recipe && (
            <>
              <div className="ci-knobs">
                {[['player', 'You'], ['enemy', 'Enemy'], ['twist', 'Twist'], ['lives', 'Lives']].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`ci-knob${flip === key ? ' is-flip' : ''}`}
                    onClick={() => cycle(key)}
                    onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`); e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`); }}
                    aria-label={`${label}: ${recipe[key]}. Tap to change.`}
                  >
                    {key === 'player' || key === 'enemy' ? <Look look={recipe[key]} /> : <b>{key === 'twist' ? TWIST_LABEL[recipe.twist] : recipe.lives}</b>}
                    <small>{label}</small>
                  </button>
                ))}
              </div>
              {mode === 'say' && <WhatWeMade recipe={recipe} said={said} aiDown={aiDown} onKind={remake} />}
              {(changed || published) && gameHtml && (
                <div className="bd__prove">
                  <ProveItPanel code={gameHtml} projectTitle={recipe.title} onProved={proved} alreadyProved={hasUnderstood(localStorage, madeId.current || shelfId.current || proofKey)} />
                </div>
              )}
              <div className="bd__after">
                <button type="button" className="ci-btn ci-btn--ink bd__publish" onClick={publish} disabled={publishing}>{publishing ? 'Publishing' : published && !published.offline ? (published.kept ? 'In your arcade' : 'Kept on this device') : 'Publish to my arcade'}</button>
                <button type="button" className="ci-btn ci-btn--paper" onClick={shakeUp}>Shake it up</button>
              </div>
              <button type="button" className="bd__seecode" onClick={seeCode}>See the code</button>
            </>
          )}
        </section>
      </main>

      {published && (
        <div className="bd__ov" role="dialog" aria-modal="true" aria-label={published.offline ? 'Saved on this device' : 'Published'} onClick={(e) => { if (e.target === e.currentTarget) setPublished(null); }}>
          <div className="bd__panel ci-popin">
            <div className="bd__card3d">
              <div className="bd__tcard">
                <iframe title={`${recipe.title} card`} srcDoc={gameHtml} sandbox="allow-scripts" tabIndex={-1} />
                <div className="bd__holo" />
                <div className="bd__meta"><b>{recipe.title}</b><small>{user ? `by ${user.username || user.name || 'you'}` : 'by you'} · {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small>
                  <div className="bd__stats"><span><b>{recipe.kind}</b>kind</span><span><b>{recipe.lives}</b>lives</span><span><b>{TWIST_LABEL[recipe.twist]}</b>twist</span></div>
                </div>
              </div>
            </div>
            <div className="bd__moment">
              <h2>{published.offline ? 'Saved on this device.' : published.first ? 'Your first game!' : 'Published.'}</h2>
              <p>{published.offline
                ? `${whyUnreachable()} ${recipe.title} is safe here, but not in your arcade yet. Press Publish again when the connection is back.`
                : published.kept ? `${recipe.title} is in your arcade. Friends can play it now.` : `${recipe.title} is kept on this device for a week. Make a free account to keep it for good and share it.`}</p>
              {published.xp > 0 && <div className="bd__xp"><b>+{published.xp}</b> XP</div>}
              <div className="bd__acts">
                {published.offline
                  ? <button type="button" className="ci-btn" onClick={() => { setPublished(null); publish(); }}>Publish again</button>
                  : published.kept ? <button type="button" className="ci-btn" onClick={share}>Show a friend</button> : <button type="button" className="ci-btn" onClick={() => navigate('/register')}>Keep my game</button>}
                <button type="button" className="ci-btn ci-btn--paper" onClick={() => { setPublished(null); shakeUp(); }}>Build another</button>
              </div>
              <button type="button" className="bd__seecode bd__gohome" onClick={() => navigate('/home')}>Go home</button>
            </div>
          </div>
        </div>
      )}
      <div className={`ci-toast${toast ? ' is-on' : ''}`} role="status">{toast}</div>
      <TabBar />
    </div>
  );
}
