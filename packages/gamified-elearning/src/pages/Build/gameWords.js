// ── The child's own words, kept ─────────────────────────────────────────────
//
// Until 27 October 2026 a sentence became one of four games drawn with
// thirteen pictures. "A samosa that has to dodge the fork" came out as a
// rocket dodging aliens, and "pizza that falls from the sky", the example in
// our own Instagram challenge, was refused as not a game. The model that was
// meant to read the sentence was out of credit, and the rules under it knew
// nineteen nouns.
//
// This file reads a sentence the way a child means it: who you are, what you
// catch, what you avoid, and what kind of game it is, out of nine. Every noun
// it knows becomes the picture the child named. It needs no network and no
// model, so it works when both are gone. When it cannot tell what kind of game
// a sentence is, it says so instead of quietly making a catch game.
//
// The same text runs on the server (codeit-backend/gameWords.js) and in the
// page. gameWordsParity.test.js holds them together.

const KINDS = ['catch', 'dodge', 'shooter', 'runner', 'flyer', 'racer', 'maze', 'pop', 'pet'];

/** What each kind is, in a child's words: the explanation under the game. */
const KIND_SAY = {
  catch: 'Catch things',
  dodge: 'Dodge things',
  shooter: 'Shoot things',
  runner: 'Run and jump',
  flyer: 'Fly through gaps',
  racer: 'Race in lanes',
  maze: 'Find the way',
  pop: 'Tap them fast',
  pet: 'Look after a pet',
};

const KIND_TITLE = { catch: 'Catch', dodge: 'Dodge', shooter: 'Blaster', runner: 'Run', flyer: 'Flight', racer: 'Race', maze: 'Maze', pop: 'Pop', pet: 'Pet' };

// One line per thing: the words a child might type, then the picture.
// Plurals are worked out below, so "pizzas" and "cherries" find these too.
const WORD_LIST = `
cat|kitten|kitty:🐱; dog|puppy|doggy|pup:🐶; bunny|rabbit:🐰; mouse|mice:🐭; hamster|guinea pig:🐹; fox:🦊; bear:🐻;
panda:🐼; koala:🐨; tiger:🐯; lion:🦁; cow:🐮; pig|piggy:🐷; frog|toad:🐸;
monkey|ape:🐵; gorilla:🦍; chicken|hen:🐔; chick|duckling:🐥; penguin:🐧; bird|birdie:🐦; eagle|hawk:🦅;
owl:🦉; duck:🦆; bat:🦇; wolf:🐺; horse|pony:🐴; unicorn:🦄; bee|bumblebee:🐝;
butterfly:🦋; snail:🐌; ladybug|ladybird:🐞; ant:🐜; spider:🕷️; turtle|tortoise:🐢; snake:🐍;
lizard|gecko:🦎; dinosaur|dino|trex|t-rex:🦖; octopus:🐙; squid:🦑; crab:🦀; lobster:🦞; shrimp|prawn:🦐;
fish|goldfish:🐟; shark:🦈; whale:🐳; dolphin:🐬; seal:🦭; crocodile|alligator|croc:🐊; elephant:🐘;
giraffe:🦒; zebra:🦓; camel:🐪; kangaroo:🦘; sloth:🦥; hedgehog:🦔; squirrel:🐿️;
deer|reindeer:🦌; goat:🐐; sheep|lamb:🐑; llama|alpaca:🦙; parrot:🦜; flamingo:🦩; peacock:🦚;
swan:🦢; worm:🪱; mosquito|bug|insect:🦟; beetle:🪲; rat:🐀; otter:🦦; raccoon:🦝;
beaver:🦫; mammoth:🦣; mole:🐹; dragon:🐉; alien:👽; monster|invader:👾; ghost:👻;
zombie:🧟; vampire:🧛; wizard|witch:🧙; fairy:🧚; mermaid:🧜; genie:🧞; elf:🧝;
ninja:🥷; pirate:🏴‍☠️; knight:🛡️; princess|queen:👸; prince|king:🤴; superhero|hero:🦸; villain:🦹;
robot:🤖; clown:🤡; skeleton|skull:💀; troll:🧌; ogre:👹; astronaut:🧑‍🚀; rocket|spaceship|space ship|ship:🚀;
ufo|flying saucer|saucer:🛸; planet:🪐; moon:🌙; sun:☀️; star:⭐; comet:☄️; asteroid|meteor|meteorite:☄️;
satellite:🛰️; car:🚗; race car|racecar|racing car|kart|go kart:🏎️; truck:🚚; bus:🚌; police car:🚓; fire truck|firetruck|fire engine:🚒;
ambulance:🚑; tractor:🚜; bike|bicycle:🚲; motorbike|motorcycle:🏍️; scooter:🛴; skateboard:🛹; train:🚂;
plane|airplane|aeroplane|jet:✈️; helicopter:🚁; boat:🚤; sailboat|sail boat:⛵; submarine:🛥️; pizza:🍕; burger|hamburger|cheeseburger:🍔;
fries|french fries|chips:🍟; hot dog|hotdog:🌭; taco:🌮; burrito:🌯; sandwich:🥪; samosa|dumpling|momo|empanada|gyoza:🥟; sushi:🍣;
ramen|noodles|noodle:🍜; spaghetti|pasta:🍝; rice:🍚; bread|toast:🍞; croissant:🥐; bagel:🥯; pancake:🥞;
waffle:🧇; egg:🥚; cheese:🧀; popcorn:🍿; cookie|biscuit:🍪; cake:🍰; cupcake|muffin:🧁;
donut|doughnut:🍩; ice cream|icecream|ice-cream:🍦; lollipop:🍭; candy|sweet|sweets|gummy:🍬; chocolate:🍫; pie:🥧; apple:🍎;
banana:🍌; orange:🍊; lemon:🍋; watermelon|melon:🍉; grape:🍇; strawberry:🍓; cherry:🍒;
peach:🍑; pear:🍐; pineapple:🍍; mango:🥭; coconut:🥥; avocado:🥑; carrot:🥕;
broccoli:🥦; corn:🌽; potato:🥔; tomato:🍅; chilli|chili|pepper:🌶️; mushroom:🍄; peanut|nut:🥜;
acorn:🌰; honey:🍯; milk:🥛; juice:🧃; soda|drink:🥤; bone:🦴; meat|steak:🍖;
drumstick|chicken leg:🍗; bacon:🥓; falafel|kebab|shawarma:🧆; soup:🍲; curry:🍛; pretzel:🥨; cereal:🥣;
salad:🥗; fork|spoon|knife|cutlery:🍴; plate:🍽️; bucket:🪣; basket:🧺; bowl:🥣; cup|mug:☕;
ball|football|soccer ball:⚽; basketball:🏀; baseball:⚾; tennis ball:🎾; volleyball:🏐; rugby ball:🏈; hockey:🏒;
golf:⛳; goal:🥅; trophy:🏆; medal:🏅; balloon:🎈; kite:🪁; teddy|teddy bear:🧸;
dice:🎲; puzzle:🧩; present|gift:🎁; crown:👑; ring:💍; gem|diamond|jewel|crystal|ruby:💎; coin|money|gold:🪙;
treasure|chest:💰; key:🔑; heart:❤️; magnet:🧲; bomb:💣; rock|stone|boulder:🪨; fire|fireball|flame|lava:🔥;
lightning|thunder|bolt:⚡; cloud:☁️; raindrop|water drop|drop:💧; snowflake|snow:❄️; snowball:⚪; snowman:⛄; rainbow:🌈;
tornado:🌪️; flower:🌸; rose:🌹; sunflower:🌻; tree:🌳; leaf:🍃; cactus:🌵;
volcano:🌋; mountain:⛰️; house|home:🏠; castle:🏰; book:📚; pencil:✏️; homework:📝;
backpack|schoolbag:🎒; music|note:🎵; guitar:🎸; drum:🥁; hand:✋; hammer:🔨; phone:📱; computer|laptop:💻; brick|wall|block:🧱;
pipe:🟩; bubble:🫧; poop|poo:💩; tooth|teeth:🦷; sock:🧦; shoe:👟; hat:🎩;
bell:🔔;
`;

/** Every known word, singular, to its picture. Built once from WORD_LIST. */
const WORDS = (() => {
  const map = {};
  for (const entry of WORD_LIST.split(';')) {
    const at = entry.lastIndexOf(':');
    if (at < 1) continue;
    const emoji = entry.slice(at + 1).trim();
    for (const word of entry.slice(0, at).split('|')) map[word.trim()] = emoji;
  }
  return map;
})();

// The longest names first, so "race car" wins over "car" and "ice cream" is
// one thing, not ice and cream.
const PHRASES = Object.keys(WORDS).filter((w) => /[\s-]/.test(w)).sort((a, b) => b.length - a.length);

/** The word as the table knows it: "cherries" is cherry, "moles" is mole. */
function singular(word) {
  const w = String(word || '').toLowerCase().trim();
  if (!w) return null;
  if (WORDS[w]) return w;
  if (w.endsWith('ies') && WORDS[`${w.slice(0, -3)}y`]) return `${w.slice(0, -3)}y`;
  if (w.endsWith('ves') && WORDS[`${w.slice(0, -3)}f`]) return `${w.slice(0, -3)}f`;
  if (w.endsWith('s') && WORDS[w.slice(0, -1)]) return w.slice(0, -1);
  if (w.endsWith('es') && WORDS[w.slice(0, -2)]) return w.slice(0, -2);
  return null;
}

/** The picture for one word a child typed, singular or plural, or null. */
function emojiForWord(word) {
  const base = singular(word);
  return base ? WORDS[base] : null;
}

/** Lower case, with the words a child adds for emphasis taken out. */
function tidy(text) {
  // Idempotent: a tidied sentence tidies to itself, so positions agree.
  return ` ${String(text || '').toLowerCase().replace(/[^a-z0-9\s,'-]/g, ' ').replace(/\s+/g, ' ').trim()} `
    // "a frog that catches flies": those flies are bugs, not flying.
    .replace(/\b(catch|catches|catching|eat|eats|eating|chase|chases|chasing)\s+(the\s+)?flies\b/g, '$1 $2bugs');
}

/** The things named in a sentence, in order: { word, emoji, at }. */
function nounsIn(text) {
  let s = tidy(text);
  const found = [];
  for (const phrase of PHRASES) {
    const at = s.indexOf(` ${phrase} `) >= 0 ? s.indexOf(` ${phrase} `) : s.indexOf(` ${phrase}s `);
    if (at < 0) continue;
    found.push({ word: phrase, emoji: WORDS[phrase], at: at + 1 });
    s = s.slice(0, at + 1) + '#'.repeat(phrase.length) + s.slice(at + 1 + phrase.length);
  }
  const re = /[a-z][a-z'-]*/g;
  let m;
  while ((m = re.exec(s))) {
    // "fly" and "flies" are verbs in nearly every sentence a child writes.
    if (/^(fly|flies|flying|fall|falls|run|runs|race|races|pop|pops|jump|jumps|catch|catches|shoot|shoots|dodge|dodges|feed|feeds|play|plays|eat|eats|find|finds|game|games|go|gets|get|it|its|you|your|me|my|i|a|an|the|and|or|of|to|in|on|at|from|with|that|who|which|where|has|have|must|can|over|under|into|through|not|but|so|then|every|all|lots|lot|some|more|five|one|two|three|ten|day|night|sky|space|sea|ocean|land|world|level|levels|win|time)$/.test(m[0])) continue;
    const base = singular(m[0]);
    if (base) found.push({ word: base, emoji: WORDS[base], at: m.index });
  }
  found.sort((a, b) => a.at - b.at);
  const seen = new Set();
  return found.filter((n) => (seen.has(n.emoji) ? false : seen.add(n.emoji)));
}

// The verbs that decide what kind of game it is, most specific first. Each
// one also says where the thing it acts on sits: "dodge the fork" puts the
// fork after the verb, "pizza that falls" puts the pizza before it.
const KIND_RULES = [
  ['dodge', /\b(chas\w* (?:me|you|us)|after (?:me|you|us)|coming for (?:me|you|us))\b/],
  ['shooter', /\b(shoot|shoots|shooting|shooter|shot|blast|blasts|blasting|blaster|zap|zaps|laser|lasers|fires? at|invaders?)\b/],
  ['maze', /\b(maze|mazes|labyrinth|find (?:its|his|her|their|the|my|your) way|get out of|tunnels?)\b/],
  ['racer', /\b(race|races|racing|racer|drive|drives|driving|lanes?|kart|karts|race car|racecar)\b/],
  ['flyer', /\b(fly|flies|flying|flap|flaps|flapping|soar|soars|glide|glides|flappy|wings?)\b/],
  ['pop', /\b(pop|pops|popping|whack|whacks|smash|smashes|squish|squishes|tap the|tap on|click the|click on|burst|bursts)\b/],
  ['runner', /\b(jump|jumps|jumping|hop|hops|runner|obby|obstacles?|platform|platforms|parkour|leaps?|over the)\b/],
  ['catch', /\b(catch|catches|catching|collect|collects|collecting|grab|grabs|eat|eats|eating|chase|chases|chasing|pick up|picks up|falls?|falling|fell|rain|rains|raining|drops?|dropping|in a bucket|in a basket|bucket|basket)\b/],
  ['pet', /\b(pet|pets|feed|feeds|feeding|look after|looks after|take care|takes care|tamagotchi|virtual)\b/],
  ['dodge', /\b(dodge|dodges|dodging|avoid|avoids|escape|escapes|survive|survives|run from|runs from|run away|runs away|away from|hide from|hides from|chased)\b/],
  ['runner', /\b(run|runs|running)\b/],
];

/** The kind of game a sentence asks for, and whether a word really said so. */
function kindOf(text) {
  const s = tidy(text);
  for (const [kind, re] of KIND_RULES) if (re.test(s)) return { kind, sure: true };
  return { kind: 'catch', sure: false };
}

// A pet's favourite food, a mouse's natural enemy: the second thing in a game
// when the child named only the first.
const LIKES = { '🐱': '🐟', '🐶': '🦴', '🐰': '🥕', '🐭': '🧀', '🐹': '🌻', '🐵': '🍌', '🦍': '🍌', '🐝': '🌸', '🐼': '🎋', '🐿️': '🌰', '🐻': '🍯', '🐸': '🦟', '🦖': '🍖', '🐧': '🐟', '🐦': '🪱', '🐔': '🌽', '🐴': '🥕', '🦄': '🌈', '🐉': '💎', '🦈': '🐟', '🐳': '🐟', '🐬': '🐟', '🤖': '⚡', '👽': '⭐', '🚀': '⭐', '🏎️': '🪙', '🚗': '🪙', '🐢': '🍓', '🐷': '🍎', '🐮': '🌸', '🦊': '🍇', '🐺': '🍖', '🦁': '🍖', '🐯': '🍖' };
const FEARS = { '🐭': '🐱', '🐟': '🦈', '🐠': '🦈', '🐰': '🦊', '🐑': '🐺', '🐔': '🦊', '🐦': '🐱', '🐱': '🐶', '🐛': '🐦', '🦋': '🕷️', '🐢': '🦈', '🚀': '☄️', '🛸': '☄️', '🏎️': '🚗', '🚗': '🚙' };

// What each kind uses when the child named nothing for that part. Plain words
// are our own drawn sprites; the rest are pictures.
const DEFAULTS = {
  catch: { player: '🧺', enemy: 'bomb', treasure: 'star' },
  dodge: { player: 'hero', enemy: 'rock', treasure: 'gem' },
  shooter: { player: 'ship', enemy: 'alien', treasure: 'gem' },
  runner: { player: 'hero', enemy: 'rock', treasure: 'coin' },
  flyer: { player: '🐦', enemy: '🧱', treasure: 'star' },
  racer: { player: '🏎️', enemy: '🚗', treasure: 'coin' },
  maze: { player: 'hero', enemy: '👻', treasure: 'coin' },
  pop: { player: '✋', enemy: 'bomb', treasure: '🎈' },
  pet: { player: '🐶', enemy: '🦟', treasure: '🦴' },
};

const CONTAINERS = new Set(['🪣', '🧺', '🥣', '☕', '🍽️']);
const AVOID_BEFORE = /\b(not|avoid|avoids|avoiding|dodge|dodges|dodging|without|except|watch out for|away from|run from|runs from|hide from|escape|escapes|but|no|never|from the|chased by|beware)\s+(?:the\s+|a\s+|an\s+|any\s+|all\s+)?$/;

/**
 * Who you are, what you catch, what you avoid, from the sentence.
 * Each role is { emoji, word } when the child named it, or null.
 */
function rolesIn(text, kind) {
  let s = tidy(text);
  // "a game where a cat catches pizza" is about the cat, not the game.
  s = s.replace(/^\s*(?:i want |i wanna |make me |make |build me |build |create |please )?(?:a |an |the )?(?:[a-z]+ )?(?:game|maze|level|world|place)\s+(?:where|were|wear|in which|about|that|with|of)\s+/, ' ');
  const nouns = nounsIn(s);
  const verb = (KIND_RULES.find(([k]) => k === kind) || [null, /$^/])[1];
  const vm = verb.exec(s) || /\b(finds?|gets?|collects?|eats?|grabs?|looks? for|search(?:es)? for|catch(?:es)?|feeds?)\b/.exec(s);
  const verbAt = vm ? vm.index : -1;
  // "popcorn you catch in a bucket": the thing comes first and "you" catches it.
  const passive = verbAt > 0 && /\b(you|we|i|they)\s+(?:can\s+|have to\s+|must\s+|try to\s+)?$/.test(s.slice(Math.max(0, verbAt - 24), verbAt));
  const before = nouns.filter((n) => verbAt < 0 || n.at < verbAt);
  const after = nouns.filter((n) => verbAt >= 0 && n.at > verbAt);
  const avoided = nouns.filter((n) => AVOID_BEFORE.test(s.slice(Math.max(0, n.at - 26), n.at)));
  const isAvoided = (n) => avoided.includes(n);
  const container = nouns.find((n) => CONTAINERS.has(n.emoji) && /\b(in|into|with|inside)\s+(?:a\s+|an\s+|the\s+|my\s+|your\s+)?$/.test(s.slice(Math.max(0, n.at - 14), n.at)));
  const role = (n) => (n ? { emoji: n.emoji, word: n.word } : null);
  let player = null, enemy = null, treasure = null;

  const falls = /\b(falls?|falling|fell|rains?|raining|drops?|dropping)\b/.test(s) && !/\b(catch|catches|collect|collects|grab|grabs|eat|eats)\b/.test(s.slice(0, Math.max(0, verbAt)));
  if (kind === 'catch' && (passive || (falls && !before.some((n) => !CONTAINERS.has(n.emoji) && LIKES[n.emoji] && n.at < verbAt && !/\bfalling\b/.test(s.slice(n.at - 9, n.at)))))) {
    // The thing that falls, or the thing you catch, is the treasure; you are
    // what it lands in.
    treasure = role(before.find((n) => !isAvoided(n) && n !== container) || after.find((n) => !isAvoided(n) && n !== container));
    player = role(container);
  } else if (kind === 'maze' || kind === 'pet' || kind === 'pop') {
    const subject = before.find((n) => !isAvoided(n) && n !== container);
    const object = after.find((n) => !isAvoided(n) && n !== container);
    if (kind === 'pop') {
      treasure = role(object || subject);
      player = /\b(whack|smash|squish|hit)\b/.test(s) ? { emoji: '🔨', word: 'hammer' } : null;
    } else if (kind === 'pet') {
      const pet = nouns.find((n) => LIKES[n.emoji] && !isAvoided(n)) || subject;
      player = role(pet);
      treasure = role(nouns.find((n) => n !== pet && !isAvoided(n) && n !== container));
    } else {
      player = role(subject);
      treasure = role(object);
    }
  } else {
    const chasesMe = /\b(chas\w* (?:me|you|us)|after (?:me|you|us)|coming for (?:me|you|us))\b/.test(s);
    player = chasesMe ? null : role(before.find((n) => !isAvoided(n) && n !== container));
    if (chasesMe) enemy = role(before.find((n) => n !== container));
    const collectedFirst = nouns.find((n) => n.at > verbAt && /\b(collect|collects|collecting|grab|grabs|get|gets|eat|eats|catch|catches)\s+(?:the\s+|a\s+|an\s+|all\s+|some\s+)?$/.test(s.slice(Math.max(0, n.at - 18), n.at)));
    const other = (n) => n !== container && n !== collectedFirst && (!player || n.emoji !== player.emoji);
    // What you catch is the first thing after the verb you are not told to
    // avoid; what you dodge, shoot or jump over is simply the first thing.
    if (kind === 'catch') treasure = role(collectedFirst || after.find((n) => other(n) && !isAvoided(n)));
    else if (!enemy) enemy = role(after.find(other));
    if (!treasure && collectedFirst && kind !== 'catch') treasure = role(collectedFirst);
    if (!treasure) {
      const collected = nouns.find((n) => n.at > verbAt && /\b(collect|collects|collecting|grab|grabs|get|gets|eat|eats|catch|catches)\s+(?:the\s+|a\s+|an\s+|all\s+|some\s+)?$/.test(s.slice(Math.max(0, n.at - 18), n.at)));
      if (collected && (!enemy || collected.emoji !== enemy.emoji)) treasure = role(collected);
    }
    if (kind === 'catch' && !player && container) player = role(container);
  }
  const foe = avoided.find((n) => (!player || n.emoji !== player.emoji) && (!treasure || n.emoji !== treasure.emoji));
  if (foe && (!enemy || ((kind === 'catch' || kind === 'pop' || kind === 'pet' || kind === 'maze') && foe.emoji !== treasure?.emoji))) enemy = role(foe);
  // "a cat that catches pizza and avoids dogs": a later noun nobody claimed is the enemy.
  if (!enemy && kind !== 'pet') {
    const spare = after.find((n) => n.emoji !== player?.emoji && n.emoji !== treasure?.emoji && n !== container);
    if (spare && (kind === 'catch' || kind === 'pop' || kind === 'maze' || kind === 'runner' || kind === 'flyer')) enemy = role(spare);
  }
  return { player, enemy, treasure };
}

function capital(word) {
  return String(word || '').split(/[\s-]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

/** A name for the game from the child's own words: "Samosa Dodge", "Pizza Catch". */
function titleFromIdea(text, kind, roles) {
  const s = tidy(text);
  const named = s.match(/\b([a-z]+(?: [a-z]+){0,2}) game\b/);
  if (named && !/\b(a|an|the|my|this|that|fun|cool|new|best|whole|real|good|video|computer|board|card|racing|shooting|dodge|catch|jumping|flying)$/.test(named[1].split(' ').pop())) {
    // "make me a zombie game": the name starts after the last little word.
    const all = named[1].split(' ');
    let from = 0;
    all.forEach((w, i) => { if (/^(a|an|the|my|me|make|build|i|want|wanna|create|please|our|your)$/.test(w)) from = i + 1; });
    const words = all.slice(from);
    if (words.length) return `${capital(words.join(' '))} Game`.slice(0, 22);
  }
  const creature = roles.player && !CONTAINERS.has(roles.player.emoji) && roles.player.emoji !== '🔨' ? roles.player : null;
  const main = kind === 'catch' || kind === 'pop' ? (creature || roles.treasure || roles.player) : (roles.player || roles.treasure || roles.enemy);
  if (!main) return `${capital(KIND_SAY[kind].split(' ')[0])} Game`;
  if (kind === 'pet') return `Pet ${capital(main.word)}`.slice(0, 22);
  return `${capital(main.word)} ${KIND_TITLE[kind]}`.slice(0, 22);
}

const NOT_A_GAME = /\b(quiz|trivia|website|web site|webpage|web page|home ?page|portfolio|shop|store|calculator|flash ?cards?|blog|page about|chat ?bot|essay|story|slideshow|presentation|timer|to-?do|todo)\b/;

/** Does this sound like a game? A sentence that names a thing we can draw is one. */
function looksLikeGame(text) {
  const s = tidy(text);
  if (s.trim().length < 3) return false;
  if (NOT_A_GAME.test(s)) return false;
  if (/\b(game|play|score|level|win|lose|lives|boss|enemy|enemies)\b/.test(s)) return true;
  if (kindOf(s).sure) return true;
  return nounsIn(s).length > 0;
}

/**
 * The whole recipe from a sentence, with no network: what kind of game, who
 * you are, what comes at you, what you collect, the sky, the numbers, and
 * whether a word really said which kind (fits) and what was understood.
 */
function recipeFromIdea(text, kindOverride) {
  const s = tidy(text);
  // A kind the child picked from the chips beats a kind guessed from a verb.
  const { kind, sure } = KINDS.includes(kindOverride) ? { kind: kindOverride, sure: true } : kindOf(s);
  const roles = rolesIn(text, kind);
  const base = DEFAULTS[kind];
  const player = roles.player ? roles.player.emoji : base.player;
  const treasure = roles.treasure ? roles.treasure.emoji
    : (LIKES[player] && LIKES[player] !== player ? LIKES[player] : base.treasure);
  // A mouse fears the cat in a chase; a bird flies through walls, not cats.
  const chases = kind === 'catch' || kind === 'dodge' || kind === 'maze' || kind === 'racer';
  const enemy = roles.enemy ? roles.enemy.emoji
    : (chases && FEARS[player] && FEARS[player] !== treasure ? FEARS[player] : base.enemy);
  // A place the child named beats a place guessed from a word.
  const sky = /\bspace\b|planet|galaxy/.test(s) ? 'space'
    : /night|dark|spooky|halloween|moon/.test(s) ? 'night'
    : /\bsea\b|ocean|under ?water|beach/.test(s) ? 'ocean'
    : /candy|sweet|cake land/.test(s) ? 'candy'
    : /sunset|lava|volcano|desert/.test(s) ? 'sunset'
    : /alien|asteroid|rocket|ufo|ship\b/.test(s) && kind !== 'racer' ? 'space'
    : /zombie|ghost|vampire|bat\b/.test(s) ? 'night'
    : /fish|shark|whale|dolphin|octopus/.test(s) ? 'ocean'
    : /fire|flame/.test(s) ? 'sunset'
    : /pink|unicorn|fairy/.test(s) ? 'candy'
    : 'day';
  const goal = s.match(/\bwin at (\d+)/);
  return {
    kind,
    fits: sure,
    title: titleFromIdea(text, kind, roles),
    player,
    // "enemy ships" in a ship game: same picture as you would be confusing.
    enemy: enemy === player || (enemy === '🚀' && player === 'ship') ? (enemy === '🚀' ? '🛸' : base.enemy) : enemy,
    treasure: treasure === player ? base.treasure : treasure,
    sky,
    speed: /fast|hard|crazy|insane|extreme|turbo/.test(s) ? 3 : /slow|easy|baby|calm/.test(s) ? 1 : 2,
    lives: /one life|1 life/.test(s) ? 1 : /five lives|5 lives/.test(s) ? 5 : 3,
    winAt: goal ? Math.max(5, Math.min(50, Number(goal[1]))) : (kind === 'runner' || kind === 'flyer' ? 20 : 15),
    twist: /faster|harder|speed up|speeds up|gets? fast/.test(s) ? 'faster' : /waves?|at once|lots of|swarm/.test(s) ? 'waves' : 'none',
    named: { player: Boolean(roles.player), enemy: Boolean(roles.enemy), treasure: Boolean(roles.treasure) },
    words: { player: roles.player?.word || null, enemy: roles.enemy?.word || null, treasure: roles.treasure?.word || null },
  };
}

/** A word for a picture, for reading a game back: 🧺 is a basket, 🐱 a cat. */
function wordFor(emoji) {
  return Object.keys(WORDS).find((w) => WORDS[w] === emoji && !/[\s-]/.test(w)) || null;
}

/** True for a picture a child named (an emoji), false for one of our drawn sprites. */
function isEmojiLook(look) {
  return typeof look === 'string' && Array.from(look).some((ch) => ch.codePointAt(0) > 127);
}

// ── exports ──
export { DEFAULTS, KINDS, KIND_SAY, KIND_TITLE, WORDS, emojiForWord, isEmojiLook, kindOf, looksLikeGame, nounsIn, recipeFromIdea, rolesIn, titleFromIdea, wordFor };
