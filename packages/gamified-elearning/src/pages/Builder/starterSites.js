// ── Websites that sell something ─────────────────────────────────────────────
//
// A child who has only ever seen the games thinks this studio makes games. The
// point of these is to show the other half: a real page, with a headline, a
// price, a picture, a basket that counts up, and a button that does something.
//
// Every one of them is made of ordinary elements, so the editor works on all of
// it — tap the headline and change the words, drag the price, recolour the
// button, delete the bit you do not want. That is the whole demonstration.
//
// ── Two rules these follow ───────────────────────────────────────────────────
//
// Nothing here pretends to be a real business. Every shop is obviously invented
// and there are no reviews, no ratings and no customer counts, because a made-up
// number on a page that looks real is the one thing this product must never
// teach a child to write.
//
// And no basket ever asks for a card. The button adds to a total and says well
// done. A page that walks a child through typing card details, even a pretend
// one, is a habit worth not building.

const CLOSE_SCRIPT = `<${'/'}script>`;

const SITE_STYLE = `
  * { box-sizing: border-box; }
  body {
    margin: 0; font-family: system-ui, -apple-system, sans-serif;
    color: #16182B; line-height: 1.5;
  }
  .wrap { max-width: 720px; margin: 0 auto; padding: 0 20px 60px; }
  header { padding: 20px 0 8px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .brand { font-size: 20px; font-weight: 800; letter-spacing: -.01em; }
  .basket {
    border: 0; border-radius: 99px; padding: 10px 18px; min-height: 44px;
    font-size: 15px; font-weight: 700; font-family: inherit; color: #fff; cursor: pointer;
  }
  .hero { padding: 26px 0 8px; }
  .hero h1 { font-size: 40px; line-height: 1.1; margin: 0 0 12px; letter-spacing: -.02em; }
  .hero p { font-size: 19px; margin: 0 0 20px; opacity: .78; }
  .shot {
    height: 210px; border-radius: 20px; display: flex;
    align-items: center; justify-content: center; font-size: 92px; margin-bottom: 26px;
  }
  h2 { font-size: 25px; margin: 34px 0 14px; letter-spacing: -.01em; }
  .items { display: grid; gap: 14px; }
  .item {
    display: flex; align-items: center; gap: 14px;
    border: 2px solid #EAECF6; border-radius: 18px; padding: 14px 16px; background: #fff;
  }
  .item .face { font-size: 38px; line-height: 1; }
  .item .words { flex: 1; min-width: 0; }
  .item .words b { display: block; font-size: 17px; }
  .item .words span { font-size: 15px; opacity: .7; }
  .item .cost { font-size: 19px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .item button {
    border: 0; border-radius: 12px; padding: 12px 16px; min-height: 44px;
    font-size: 15px; font-weight: 700; font-family: inherit; color: #fff; cursor: pointer;
  }
  .points { display: grid; gap: 12px; padding: 0; margin: 0; list-style: none; }
  .points li {
    display: flex; gap: 12px; align-items: flex-start;
    font-size: 17px; padding: 14px 16px; border-radius: 16px; background: #F5F6FB;
  }
  .points b { font-size: 21px; line-height: 1.2; }
  .say {
    margin-top: 22px; padding: 16px 18px; border-radius: 16px;
    font-size: 17px; font-weight: 700; text-align: center; min-height: 56px;
    display: flex; align-items: center; justify-content: center;
  }
  footer { margin-top: 40px; font-size: 14px; opacity: .6; text-align: center; }
  @media (max-width: 520px) {
    .hero h1 { font-size: 31px; }
    .item { flex-wrap: wrap; }
    .item .cost { margin-left: auto; }
  }
`;

/**
 * One shop page.
 *
 * Everything a child would want to change is an argument, and everything the
 * page does at runtime is the same seven functions, so a child who understands
 * one of these understands all five.
 */
function shopPage({
  title, brand, headline, promise, face, accent, ink, wash,
  currency, itemsHeading, items, pointsHeading, points, footerLine,
}) {
  const itemRows = items.map((item, index) => `      <div class="item">
        <span class="face" aria-hidden="true">${item.face}</span>
        <span class="words"><b>${item.name}</b><span>${item.note}</span></span>
        <span class="cost">${currency}${item.price.toFixed(2)}</span>
        <button onclick="addToBasket(${index})">Add</button>
      </div>`).join('\n');

  const pointRows = points.map(point => `      <li><b aria-hidden="true">${point.face}</b><span>${point.text}</span></li>`).join('\n');

  const itemData = items.map(item =>
    `  { name: '${item.name.replace(/'/g, "\\'")}', price: ${item.price} },`).join('\n');

  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
${SITE_STYLE}
  body { background: ${wash}; }
  .basket, .item button { background: ${accent}; }
  .shot { background: ${ink}; }
  .say { background: ${ink}; color: #fff; }
  .hero h1 { color: ${accent}; }
</style>
</head>
<body>

<div class="wrap">

  <header>
    <div class="brand" id="brandLabel">${brand}</div>
    <button class="basket" id="basketButton" onclick="emptyBasket()">Basket: 0</button>
  </header>

  <section class="hero">
    <h1 id="headline">${headline}</h1>
    <p id="promise">${promise}</p>
  </section>

  <div class="shot" aria-hidden="true">${face}</div>

  <h2>${itemsHeading}</h2>
  <div class="items">
${itemRows}
  </div>

  <div class="say" id="sayLabel">Tap Add and watch the basket count up</div>

  <h2>${pointsHeading}</h2>
  <ul class="points">
${pointRows}
  </ul>

  <footer>${footerLine}</footer>
</div>

<script>
// ── Change these and watch what happens ──
let shopName    = '${brand.replace(/'/g, "\\'")}';
let currency    = '${currency}';
let discount    = 0;      // try 10 for ten percent off everything
let freeOver    = 20;     // spend this much and delivery is free

// Every price on the page, in the order they appear.
let items = [
${itemData}
];

let basketCount = 0;
let basketTotal = 0;

const basketButton = document.getElementById('basketButton');
const sayLabel = document.getElementById('sayLabel');

document.getElementById('brandLabel').textContent = shopName;

// Take the discount off a price, and round it back to pennies.
function priceAfterDiscount(price) {
  const off = price * discount / 100;
  return Math.round((price - off) * 100) / 100;
}

function addToBasket(which) {
  const item = items[which];
  const paid = priceAfterDiscount(item.price);

  basketCount = basketCount + 1;
  basketTotal = basketTotal + paid;

  showBasket();
  sayLabel.textContent = item.name + ' added. That is ' + currency + basketTotal.toFixed(2) + ' so far.';
}

function showBasket() {
  basketButton.textContent = 'Basket: ' + basketCount;
  if (basketCount > 0 && basketTotal >= freeOver) {
    sayLabel.textContent = 'Nice. Over ' + currency + freeOver + ', so delivery is free.';
  }
}

function emptyBasket() {
  if (basketCount === 0) {
    sayLabel.textContent = 'Your basket is empty. Add something.';
    return;
  }
  sayLabel.textContent = 'Emptied. ' + basketCount + ' things went back on the shelf.';
  basketCount = 0;
  basketTotal = 0;
  basketButton.textContent = 'Basket: 0';
}

showBasket();
${CLOSE_SCRIPT}
</body>
</html>`;
}

// ── The five shops ───────────────────────────────────────────────────────────

const CUPCAKES = shopPage({
  title: 'Sprinkle Street Bakery',
  brand: 'Sprinkle Street',
  headline: 'Cupcakes baked this morning',
  promise: 'Made in a very small kitchen, iced by hand, gone by four.',
  face: '🧁',
  accent: '#C2185B',
  ink: '#4A0E28',
  wash: '#FFF5F8',
  currency: '£',
  itemsHeading: 'Today',
  items: [
    { face: '🧁', name: 'Vanilla with sprinkles', note: 'The one everybody orders', price: 2.5 },
    { face: '🍫', name: 'Double chocolate', note: 'Chocolate sponge, chocolate icing', price: 3.0 },
    { face: '🍓', name: 'Strawberry swirl', note: 'Real strawberries in the icing', price: 3.2 },
    { face: '🍋', name: 'Lemon drizzle', note: 'Sharp, not sweet', price: 2.8 },
  ],
  pointsHeading: 'Why bother',
  points: [
    { face: '🌅', text: 'Baked the morning you buy them, never the night before.' },
    { face: '🥜', text: 'Nut free kitchen. Say the word and we will do dairy free too.' },
    { face: '🚲', text: 'Delivered by bike anywhere in town.' },
  ],
  footerLine: 'Sprinkle Street is a made-up shop, built as a school project.',
});

const SNEAKERS = shopPage({
  title: 'Volt Trainers',
  brand: 'VOLT',
  headline: 'Trainers that do not look like everyone else’s',
  promise: 'Four pairs. Made in small runs. When they are gone they are gone.',
  face: '👟',
  accent: '#1D4ED8',
  ink: '#111C44',
  wash: '#F3F6FF',
  currency: '£',
  itemsHeading: 'This drop',
  items: [
    { face: '👟', name: 'Volt Runner', note: 'Everyday pair, extra padding', price: 54.0 },
    { face: '🥾', name: 'Volt Trail', note: 'Grippy sole, made for mud', price: 68.0 },
    { face: '👞', name: 'Volt Court', note: 'Flat sole, plain white', price: 49.5 },
    { face: '🩴', name: 'Volt Slides', note: 'For after the game', price: 22.0 },
  ],
  pointsHeading: 'The details',
  points: [
    { face: '♻️', text: 'The laces and the lining are made from recycled bottles.' },
    { face: '📦', text: 'Free returns for thirty days, even if you have worn them outside.' },
    { face: '🔢', text: 'Every pair is numbered, because we only make a few hundred.' },
  ],
  footerLine: 'VOLT is an invented brand, built as a school project.',
});

const DOG_WALKING = shopPage({
  title: 'Two Paws Dog Walking',
  brand: 'Two Paws',
  headline: 'Your dog gets a proper walk while you are at work',
  promise: 'Small groups, the same walker every time, a photo when we get back.',
  face: '🐕',
  accent: '#B45309',
  ink: '#3B2410',
  wash: '#FFFBF3',
  currency: '£',
  itemsHeading: 'What we do',
  items: [
    { face: '🦴', name: 'Half hour walk', note: 'Around the block and the park', price: 12.0 },
    { face: '🌳', name: 'Hour in the woods', note: 'Off the lead if they are good at it', price: 20.0 },
    { face: '🐾', name: 'Puppy visit', note: 'Twenty minutes, playing and feeding', price: 10.0 },
    { face: '🏠', name: 'Whole day', note: 'They come to ours until you finish', price: 34.0 },
  ],
  pointsHeading: 'How it works',
  points: [
    { face: '👤', text: 'The same walker every time, so your dog knows who is coming.' },
    { face: '📸', text: 'A photo and a message when they are home and fed.' },
    { face: '🐕‍🦺', text: 'Four dogs maximum on a walk. Usually two.' },
  ],
  footerLine: 'Two Paws is a made-up business, built as a school project.',
});

const GAME_STUDIO = shopPage({
  title: 'Pixel Fort',
  brand: 'Pixel Fort',
  headline: 'Small games, made by three people',
  promise: 'No adverts, no timers, no asking you for money halfway through.',
  face: '🎮',
  accent: '#7C3AED',
  ink: '#1B1235',
  wash: '#F8F5FF',
  currency: '£',
  itemsHeading: 'Our games',
  items: [
    { face: '🏰', name: 'Fort Builder', note: 'Build it, then defend it', price: 6.99 },
    { face: '🐙', name: 'Deep Down', note: 'Swim further each time you die', price: 4.99 },
    { face: '🚂', name: 'Signal Box', note: 'Puzzle game about trains', price: 3.49 },
    { face: '🎁', name: 'All three', note: 'Cheaper than buying them separately', price: 12.99 },
  ],
  pointsHeading: 'What you get',
  points: [
    { face: '🚫', text: 'Buy it once. There is nothing else to pay for, ever.' },
    { face: '📴', text: 'Every game works with the internet turned off.' },
    { face: '👶', text: 'No chat, no adverts, nothing aimed at getting you to spend.' },
  ],
  footerLine: 'Pixel Fort is an invented studio, built as a school project.',
});

const BRACELETS = shopPage({
  title: 'Knot Nice',
  brand: 'Knot Nice',
  headline: 'Bracelets I make at my kitchen table',
  promise: 'Pick your colours. I make it that evening and post it the next day.',
  face: '🧵',
  accent: '#0E7490',
  ink: '#062C33',
  wash: '#F2FBFD',
  currency: '£',
  itemsHeading: 'Pick one',
  items: [
    { face: '🪢', name: 'Plain braid', note: 'Three colours, your choice', price: 3.5 },
    { face: '🌈', name: 'Rainbow', note: 'Seven colours, takes a while', price: 6.0 },
    { face: '🔤', name: 'With a name on it', note: 'Up to eight letters', price: 7.5 },
    { face: '👯', name: 'Two matching', note: 'One for you, one for a friend', price: 6.5 },
  ],
  pointsHeading: 'The small print',
  points: [
    { face: '✂️', text: 'Every one is made after you order it. Nothing sits in a box.' },
    { face: '💧', text: 'They survive the shower. They do not survive the washing machine.' },
    { face: '📮', text: 'Posted in an envelope, so it fits through the letterbox.' },
  ],
  footerLine: 'Knot Nice is a made-up shop, built as a school project.',
});

const STARTER_SITES = [
  {
    id: 'site-cupcakes',
    kind: 'site',
    label: 'Cupcake shop',
    emoji: '🧁',
    blurb: 'A real shop page. Change the cakes, change the prices.',
    prompt: 'a website for a small bakery selling cupcakes, with prices, a basket that counts up, and reasons to buy',
    code: CUPCAKES,
  },
  {
    id: 'site-sneakers',
    kind: 'site',
    label: 'Trainer shop',
    emoji: '👟',
    blurb: 'Four pairs, a basket, and a free delivery rule.',
    prompt: 'a website for a small trainer brand with four products, prices and a basket',
    code: SNEAKERS,
  },
  {
    id: 'site-dogs',
    kind: 'site',
    label: 'Dog walking service',
    emoji: '🐕',
    blurb: 'Selling a service instead of a thing.',
    prompt: 'a website for a dog walking business with prices for each kind of walk and a booking basket',
    code: DOG_WALKING,
  },
  {
    id: 'site-games',
    kind: 'site',
    label: 'Game studio',
    emoji: '🎮',
    blurb: 'Sell the games you make.',
    prompt: 'a website for a small indie game studio selling three games, with prices and a bundle',
    code: GAME_STUDIO,
  },
  {
    id: 'site-bracelets',
    kind: 'site',
    label: 'Handmade bracelets',
    emoji: '🧵',
    blurb: 'The one you could actually run this weekend.',
    prompt: 'a website for a handmade bracelet shop with a few options, prices and a basket',
    code: BRACELETS,
  },
];

export { STARTER_SITES };
