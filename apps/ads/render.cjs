// Render the ad at Instagram's sizes from real screenshots of the app.
//   node apps/ads/render.cjs <out dir> <map.png> <quest.png> [castle.png]
// Needs Playwright with its Chromium (the repo's dev setup has it).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const [outDir, ...shots] = process.argv.slice(2);
if (!outDir || shots.length < 2) { console.error('usage: render.cjs <out dir> <map.png> <quest.png> [castle.png]'); process.exit(1); }
const dataUrl = (f) => `data:image/${path.extname(f).slice(1) === 'png' ? 'png' : 'webp'};base64,${fs.readFileSync(f).toString('base64')}`;
const logo = path.join(__dirname, '../../packages/gamified-elearning/public/brand/codeit-logo-trimmed.png');
// The app's fonts, from the same packages Google Fonts serves (FONT_DIR holds
// the @fontsource woff2 files; see README.md).
const FONT_DIR = process.env.FONT_DIR || path.join(__dirname, 'fonts');
const font = (f) => { const p = path.join(FONT_DIR, f); return fs.existsSync(p) ? `data:font/woff2;base64,${fs.readFileSync(p).toString('base64')}` : ''; };

const SIZES = {
  'feed-4x5': { w: 1080, h: 1350, vars: { '--h1': '100px', '--copytop': '190px', '--subsize': '36px', '--phonetop': '600px', '--pw': '400px', '--ph': '580px' }, phones: 2 },
  'story-9x16': { w: 1080, h: 1920, vars: { '--h1': '112px', '--copytop': '200px', '--subsize': '40px', '--phonetop': '680px', '--pw': '450px', '--ph': '940px' }, phones: 2 },
  'square-1x1': { w: 1080, h: 1080, vars: { '--h1': '84px', '--copytop': '180px', '--subsize': '32px', '--phonetop': '450px', '--pw': '340px', '--ph': '440px' }, phones: 2 },
};

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  const html = fs.readFileSync(path.join(__dirname, 'ad.html'), 'utf8');
  for (const [name, s] of Object.entries(SIZES)) {
    const p = await (await b.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 })).newPage();
    const withFonts = html.replace('FONT_BALOO', font('baloo-2-latin-800-normal.woff2')).replace('FONT_NUNITO8', font('nunito-latin-800-normal.woff2')).replace('FONT_NUNITO9', font('nunito-latin-900-normal.woff2'));
    await p.setContent(withFonts.replace('<html lang="en">', `<html lang="en" style="--w:${s.w}px;--h:${s.h}px;${Object.entries(s.vars).map(([k, v]) => `${k}:${v}`).join(';')}">`));
    await p.evaluate(({ shots, logo }) => {
      document.getElementById('logo').src = logo;
      const ph = document.getElementById('phones');
      shots.forEach((src, i) => { const d = document.createElement('div'); d.className = `phone ${i === 0 ? 'tilt-l' : 'tilt-r'}`; const img = document.createElement('img'); img.src = src; d.appendChild(img); ph.appendChild(d); });
    }, { shots: shots.slice(0, s.phones).map(dataUrl), logo: dataUrl(logo) });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(outDir, `codeit-${name}.png`) });
    console.log('wrote', path.join(outDir, `codeit-${name}.png`));
  }
  await b.close();
})();
