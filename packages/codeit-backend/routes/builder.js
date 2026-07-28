const express      = require('express');
const router       = express.Router();
const Anthropic    = require('@anthropic-ai/sdk');
const jwt          = require('jsonwebtoken');
const pool         = require('../db');
const designEngine = require('../designEngine');
const { JWT_SECRET } = require('../config');
const { recordEvent } = require('../analytics');
const { projectCategory, normalizeJourneyId } = require('../analyticsEvents');
const { recordAIUsage } = require('../aiUsage');
const { recordMilestoneAndNotify } = require('../progressNotifications');

const client     = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MAX_PROMPT_LENGTH = 1000;
const MAX_CODE_LENGTH = 250000;
const MAX_INSTRUCTION_LENGTH = 2000;
const MAX_ELEMENT_HTML_LENGTH = 25000;

function createRequestLimiter({ anonymous, authenticated, windowMs = 60 * 60 * 1000 }) {
  const requests = new Map();

  return function requestLimiter(req, res, next) {
    const now = Date.now();
    const key = req.user?.user_id ? `user:${req.user.user_id}` : `ip:${req.ip}`;
    const limit = req.user?.user_id ? authenticated : anonymous;
    const entry = requests.get(key);

    if (!entry || entry.resetAt <= now) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'You have made lots of AI creations. Take a short break, then try again.',
      });
    }

    entry.count += 1;
    if (requests.size > 5000) {
      for (const [storedKey, storedEntry] of requests) {
        if (storedEntry.resetAt <= now) requests.delete(storedKey);
      }
    }
    next();
  };
}

const generationLimiter = createRequestLimiter({ anonymous: 5, authenticated: 20 });
const helperLimiter = createRequestLimiter({ anonymous: 15, authenticated: 60 });

async function createTrackedMessage(operation, params) {
  const message = await client.messages.create(params);
  void recordAIUsage(operation, message);
  return message;
}

// ── Auto-create ai_project_versions table ─────────────────────────────────────
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_project_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        version_num INT NOT NULL DEFAULT 1,
        title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
        generated_code LONGTEXT NOT NULL,
        prompt_history JSON,
        label VARCHAR(100) DEFAULT 'Auto save',
        primary_color VARCHAR(20) DEFAULT '#FF7A00',
        accent_color VARCHAR(20) DEFAULT '#A855F7',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES ai_projects(id) ON DELETE CASCADE,
        INDEX idx_project_id (project_id)
      )
    `);
  } catch (err) {
    console.error('ai_project_versions table init error:', err.message);
  }
})();

// ── Response parsing helpers ──────────────────────────────────────────────────
function parseBuilderResponse(rawText) {
  // Strategy 1: <META>{...}</META><HTML>...</HTML> structured format
  // NOTE: no /i flag on htmlTagMatch — the /i flag would cause </HTML> (wrapper) to match
  // the document's own </html>, making non-greedy *? stop early and drop the closing tag.
  const metaMatch = rawText.match(/<META>([\s\S]*?)<\/META>/i);
  const htmlTagMatch = rawText.match(/<HTML>([\s\S]*?)<\/HTML>/);
  if (htmlTagMatch) {
    let title = '', type = 'website', summary = '', conceptsUsed = [];
    if (metaMatch) {
      try {
        const meta = JSON.parse(metaMatch[1].trim());
        title        = meta.title        || '';
        type         = meta.type         || 'website';
        summary      = meta.summary      || '';
        conceptsUsed = Array.isArray(meta.conceptsUsed) ? meta.conceptsUsed : [];
      } catch (_) {}
    }
    return { html: htmlTagMatch[1].trim(), title, type, summary, conceptsUsed };
  }

  // Strategy 2: JSON object with html field
  try {
    const jsonStr = rawText.match(/\{[\s\S]*\}/)?.[0];
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      if (parsed.html) {
        return {
          html:         parsed.html.trim(),
          title:        parsed.title        || '',
          type:         parsed.type         || 'website',
          summary:      parsed.summary      || '',
          conceptsUsed: Array.isArray(parsed.conceptsUsed) ? parsed.conceptsUsed : [],
        };
      }
    }
  } catch (_) {}

  // Strategy 3: <CODE>...</CODE> delimiter (legacy fallback)
  const codeMatch    = rawText.match(/<CODE>([\s\S]*?)<\/CODE>/i);
  const summaryMatch = rawText.match(/<SUMMARY>([\s\S]*?)<\/SUMMARY>/i);
  if (codeMatch) {
    return {
      html:         codeMatch[1].trim(),
      title:        '',
      type:         'website',
      summary:      summaryMatch ? summaryMatch[1].trim() : '',
      conceptsUsed: [],
    };
  }

  // Strategy 4: raw HTML extraction (last resort)
  const stripped = rawText.replace(/^```(?:json|html)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const rawHtml  = stripped.match(/(<!DOCTYPE\s+html[\s\S]+|<html[\s\S]+)/i);
  return {
    html:         rawHtml ? rawHtml[1].trim() : stripped,
    title:        '',
    type:         'website',
    summary:      '',
    conceptsUsed: [],
  };
}

function validateHtml(html) {
  return (
    typeof html === 'string' &&
    html.trim().length > 200 &&
    /<body/i.test(html) &&
    /<style/i.test(html) &&
    /<\/html>/i.test(html)
  );
}

function validateInteractivity(html, type) {
  if (!html) return false;
  // Must have real JS (not just empty or comment-only script tags)
  if (!/<script[\s\S]*?>[\s\S]{80,}<\/script>/i.test(html)) return false;
  // Must have event listeners or onclick
  if (!/addEventListener|\.onclick\s*=|\bonclick\s*=/i.test(html)) return false;
  // Must not be truncated
  if (!/<\/html>/i.test(html)) return false;

  const t = (type || '').toLowerCase();
  const isGame = ['game', 'clicker', 'runner', 'memory', 'reaction', 'soccer', 'platformer', 'dodge', 'racing', 'typing', 'tower', 'maze', 'survival', 'puzzle', 'basketball', 'cooking'].includes(t);
  const isQuiz = t === 'quiz';
  const isWebsite = ['website', 'portfolio', 'restaurant', 'shop', 'sports', 'blog', 'landing'].includes(t);

  if (isGame) {
    if (!/score/i.test(html)) return false;
    if (!/restart|startGame|newGame|play.again/i.test(html)) return false;
    if (!/setInterval|setTimeout|requestAnimationFrame/i.test(html)) return false;
  }
  if (isQuiz) {
    if (!/score/i.test(html)) return false;
    if (!/checkAnswer|answer|correct/i.test(html)) return false;
    if (!/restart|startQuiz|play.again|newQuiz/i.test(html)) return false;
  }
  if (isWebsite) {
    if (!/preventDefault|scrollIntoView|innerHTML|textContent|classList/i.test(html)) return false;
  }
  return true;
}

// ── Auth middleware (optional — attaches req.user if token present) ───────────
function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1];
  if (!token) return next();
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) req.user = user;
    next();
  });
}

function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Please log in to save projects.' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid session. Please log in again.' });
    req.user = user;
    next();
  });
}

// ── Website base CSS (injected server-side — AI does NOT copy this into output) ──
const WEBSITE_CSS = `/* Website utility system */
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased}
.container{max-width:1100px;margin:0 auto;padding:0 28px}
.container-sm{max-width:740px;margin:0 auto;padding:0 28px}
section,.section{padding:88px 0}@media(max-width:768px){section,.section{padding:54px 0}.container,.container-sm{padding:0 16px}}
.nav{position:sticky;top:0;z-index:100;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--border);padding:0 28px;height:66px;display:flex;align-items:center;justify-content:space-between;background:var(--card)}
.nav-brand{font-size:1.25rem;font-weight:900;color:var(--primary);letter-spacing:-.4px;text-decoration:none}
.nav-links{display:flex;gap:2px;list-style:none}.nav-links a,.nav-link{text-decoration:none;color:var(--text);font-weight:600;font-size:.9rem;padding:8px 15px;border-radius:50px;transition:background .18s,color .18s;cursor:pointer;background:none;border:none;font-family:inherit;display:inline-block}.nav-links a:hover,.nav-link:hover{background:var(--border);color:var(--primary)}
h1{font-size:clamp(2.5rem,6vw,4rem);line-height:1.1;letter-spacing:-.6px;font-weight:900}
h2{font-size:clamp(1.8rem,4vw,2.7rem);line-height:1.15;letter-spacing:-.4px;font-weight:900}
h3{font-size:clamp(1.1rem,2.5vw,1.4rem);font-weight:800;letter-spacing:-.2px}
.eyebrow{font-size:.75rem;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:var(--primary);display:block;margin-bottom:12px}
.section-title{font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;line-height:1.15;letter-spacing:-.5px}
.section-sub{color:var(--muted);font-size:1.05rem;margin-top:14px;max-width:520px;line-height:1.7}
.card{background:var(--card);border-radius:var(--r);padding:28px;box-shadow:var(--shadow);border:1.5px solid var(--border);transition:transform .22s cubic-bezier(.2,.8,.4,1),box-shadow .22s}
.card:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(0,0,0,.12)}
.card-img{width:100%;aspect-ratio:16/9;border-radius:calc(var(--r) - 4px);overflow:hidden;margin-bottom:18px;background:linear-gradient(135deg,var(--border),var(--bg));display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:.85rem;font-weight:600}
.grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:24px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
@media(max-width:860px){.grid3{grid-template-columns:repeat(2,1fr)}.grid4{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.grid2,.grid3,.grid4{grid-template-columns:1fr}}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 30px;border-radius:50px;font-family:inherit;font-size:1rem;font-weight:700;cursor:pointer;border:none;transition:all .18s;text-decoration:none;background:var(--primary);color:#fff;box-shadow:0 4px 18px rgba(0,0,0,.16)}.btn:hover{transform:translateY(-2px);filter:brightness(1.09);box-shadow:0 8px 28px rgba(0,0,0,.2)}
.btn-outline{background:transparent!important;color:var(--primary)!important;border:2.5px solid var(--primary)!important;box-shadow:none!important}.btn-outline:hover{background:var(--primary)!important;color:#fff!important}
.btn-ghost{background:var(--border)!important;color:var(--text)!important;box-shadow:none!important}
.btn-lg{padding:18px 44px;font-size:1.15rem}.btn-sm{padding:9px 20px;font-size:.88rem}
.tag{display:inline-block;padding:4px 14px;border-radius:50px;font-size:.75rem;font-weight:800;letter-spacing:.5px;text-transform:uppercase;background:var(--border);color:var(--primary)}
.icon-box{width:54px;height:54px;border-radius:14px;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:16px;transition:transform .2s}.icon-box:hover{transform:scale(1.1)}
.gradient-text{background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
input,select,textarea{padding:13px 16px;border-radius:var(--r);border:2px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;font-size:1rem;outline:none;transition:border-color .2s,box-shadow .2s;width:100%}
input:focus,select:focus,textarea:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(0,0,0,.04)}
.fade-up{opacity:0;animation:slideUp .55s ease forwards}
[data-delay='1']{animation-delay:.1s}[data-delay='2']{animation-delay:.22s}[data-delay='3']{animation-delay:.34s}[data-delay='4']{animation-delay:.46s}[data-delay='5']{animation-delay:.58s}
footer{padding:52px 0 32px;border-top:1px solid var(--border)}`;

// Inject WEBSITE_CSS into the first <style> block of the AI-generated HTML
function injectWebsiteCSS(html) {
  if (!html) return html;
  return html.replace(/<style(\s[^>]*)?>/i, (m) => `${m}\n${WEBSITE_CSS}\n`);
}

// Close truncated HTML — appends missing closing tags if </html> is absent
function repairHtml(html) {
  if (!html || typeof html !== 'string') return html;
  const s = html.trim();
  if (/<\/html>/i.test(s)) return s;
  let r = s;
  if (/<script/i.test(r) && !/<\/script>/i.test(r)) r += '\n</script>';
  if (/<style/i.test(r) && !/<\/style>/i.test(r)) r += '\n</style>';
  if (!/<\/body>/i.test(r)) r += '\n</body>';
  r += '\n</html>';
  return r;
}

// ── Dynamic system prompt builder (Creative Director — Phase 10) ──────────────
function buildSystemPrompt(config) {
  const { category, type, palette, pattern } = config;

  // Essential CSS the AI must include (game screen system + animations)
  const screenCSS = `/* Screen system */
.screen{display:none;width:100%}
.screen.active{display:flex;flex-direction:column;align-items:center;gap:16px;padding:24px;min-height:100vh}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;z-index:50;padding:28px;text-align:center}
button,.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 28px;border-radius:var(--r);font-family:inherit;font-size:1rem;font-weight:700;cursor:pointer;border:none;transition:transform .15s,filter .15s;background:var(--primary);color:#fff;box-shadow:0 3px 12px rgba(0,0,0,.2)}
button:hover,.btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
button:active{transform:scale(.95)}
button:disabled{opacity:.4;cursor:not-allowed;transform:none;filter:none}
input,select{width:100%;padding:12px 16px;border-radius:var(--r);border:2px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;font-size:1rem;outline:none;transition:border-color .2s}
input:focus,select:focus{border-color:var(--primary)}
.card{background:var(--card);border-radius:var(--r);padding:22px;box-shadow:var(--shadow);border:1.5px solid var(--border)}
/* Juicy game utilities */
.particle{position:absolute;pointer-events:none;border-radius:50%;animation:particle-burst .6s ease forwards;z-index:50}
.score-popup{position:absolute;font-weight:900;font-size:1.3rem;pointer-events:none;animation:score-float .8s ease forwards;white-space:nowrap;z-index:99;text-shadow:0 2px 8px rgba(0,0,0,.25)}
.combo-display{font-weight:900;color:var(--accent);min-height:1.5em;text-align:center;font-size:.95rem;letter-spacing:.5px}
.hud-flash{animation:hud-flash .3s ease!important}
.target{position:absolute;border-radius:50%;background:var(--primary);cursor:pointer;animation:spawn-in .22s cubic-bezier(.2,.8,.4,1.4) both;box-shadow:0 0 18px var(--primary),0 2px 8px rgba(0,0,0,.25);border:3px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;user-select:none;transition:transform .1s}
.target:active{transform:scale(.85)}
.game-area{position:relative;overflow:hidden;border-radius:var(--r);cursor:crosshair}`;

  const memCSS = type === 'memory' ? `
/* Memory card flip */
.mem-card{cursor:pointer;perspective:600px;user-select:none}
.card-inner{width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform .45s ease}
.mem-card.flipped .card-inner{transform:rotateY(180deg)}
.card-front,.card-back{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;backface-visibility:hidden;border-radius:var(--r);font-size:2rem;font-weight:800;border:2px solid var(--border)}
.card-front{background:var(--primary);color:#fff}
.card-back{background:var(--card);transform:rotateY(180deg)}
.mem-card.matched .card-back{border-color:var(--success)}` : '';

  // websiteCSS is injected server-side after generation — not output by AI
  const websiteCSS = WEBSITE_CSS;

  let starterSection = '';

  if (category === 'game') {
    starterSection = `══ BUILD A ${type.toUpperCase()} GAME ══
${pattern.description}

INCLUDE THIS CSS IN YOUR <style> BLOCK (copy exactly):
\`\`\`css
${screenCSS}${memCSS}
\`\`\`

USE THIS JAVASCRIPT AS YOUR FOUNDATION — customize theme/names, keep all logic:
\`\`\`js
${pattern.coreJS}
\`\`\`

REQUIRED HTML IDs: ${pattern.elements}

GAME CHECKLIST — verify every item before outputting:
✓ Three screens: start-screen (active by default), game-screen, result-screen
✓ showScreen(id) switches display; every overlay uses showOverlay/hideOverlay or equivalent
✓ Score variable shown live in DOM; flashes or animates on change (use .hud-flash class)
✓ Timer countdown with setInterval (if applicable); turns red/danger style at low time
✓ Restart button resets ALL state (score, combo, timers, DOM) and returns to start
✓ PARTICLES on hit/match: spawn .particle divs with --tx/--ty CSS vars, remove after animation
✓ SCORE POPUPS on score events: spawn .score-popup divs that float up and fade, remove after
✓ COMBO system: track consecutive hits; x2 multiplier at 3, x3 at 5; show in .combo-display
✓ SCREEN SHAKE on miss/fail: apply animation:shake .4s ease to game area, clear after 450ms
✓ SOUND ARCHITECTURE: include playTone(freq,type,dur,vol) using Web Audio API try/catch
✓ DIFFICULTY PROGRESSION: speed, size, or frequency changes as score/level increases
✓ Touch/tap controls work on mobile — no keyboard-only interactions
✓ Game area: position:relative, overflow:hidden, max-width 480px centered`;
  } else if (category === 'website') {
    starterSection = `══ BUILD A ${type.toUpperCase()} WEBSITE ══
${pattern.description}
Required interactions: ${pattern.interactions}
Layout structure: ${pattern.layout}

BASE CSS CLASSES ARE PRE-LOADED — do NOT include them in your output. Just USE these class names in your HTML:
.container .container-sm .nav .nav-brand .nav-links .nav-link .card .card-img .grid2 .grid3 .grid4 .btn .btn-outline .btn-ghost .btn-lg .btn-sm .tag .icon-box .gradient-text .fade-up .section-title .section-sub .eyebrow
These classes use: var(--primary) var(--accent) var(--bg) var(--card) var(--border) var(--muted) var(--r) var(--shadow) from the :root you define.
In your <style> block, output ONLY: :root{...} + custom styles specific to this project.

DESIGN RULES — the page must feel modern and believable, not template-like:
• HERO: gradient or richly colored background — NEVER a plain white/flat hero. Use a gradient on the section or a bold color overlay. Place h1 with class .gradient-text. Add an .eyebrow label above.
• TYPOGRAPHY HIERARCHY: every section uses .eyebrow → .section-title → .section-sub. Body text is readable (1rem, 1.65 line-height). Size contrast matters.
• CARDS EVERYWHERE: wrap content blocks in .card with .card-img where images would live. Hover lift is automatic via CSS.
• DEPTH: sections alternate visual weight — light sections followed by tinted sections (background:var(--border) at 30% opacity, or var(--card))
• ANIMATIONS: use .fade-up + data-delay="1" through "5" on groups of cards for staggered entrance
• INTERACTION FEEDBACK: every click changes something visible immediately

WEBSITE CHECKLIST — verify every item before outputting:
✓ Hero has gradient/colored background with large h1 using .gradient-text + .eyebrow label
✓ Every section header uses .eyebrow + .section-title + .section-sub structure
✓ Cards use .card class (hover lift built in); image areas use .card-img
✓ Nav is sticky with frosted glass — use .nav class from the CSS above
✓ Nav links call scrollIntoView({behavior:'smooth'}) or show/hide sections
✓ EVERY button triggers an immediate visible DOM change — ZERO dead buttons
✓ Forms call e.preventDefault(), validate inline, show DOM success/error state
✓ Counter or cart updates are visible live as user interacts
✓ .fade-up with data-delay stagger applied to card grids and feature lists
✓ Responsive: works at 320px mobile and 1200px desktop
✓ CONCISE: Target under 15KB total HTML. Use pre-loaded CSS classes (saves hundreds of lines). No markdown fences — raw HTML only. Output MUST end with </body></html>.`;
  } else {
    starterSection = `══ BUILD A ${type.toUpperCase()} TOOL ══
${pattern.description}
Required interactions: ${pattern.interactions}
Layout structure: ${pattern.layout}

TOOL CHECKLIST — verify every item before outputting:
✓ All inputs wired to JavaScript logic
✓ Result displays immediately in a styled output area
✓ Validation: friendly error if input is empty or invalid
✓ Enter key triggers the main action (keyboard support)
✓ No dead buttons — every button fires immediately with feedback`;
  }

  return `You are the CodeIt Creative Engine.

CodeIt is not a code generator. It is a creative playground where ideas instantly become interactive experiences.

Your job is NOT to write working HTML.
Your job is to create something someone immediately wants to play, edit, show a friend, or be proud of.

Every project you generate must feel:
  ALIVE      — something moves or animates the moment it loads, even before the user touches anything
  FUN        — every interaction is satisfying and rewarding, not just functional
  POLISHED   — typography, spacing, and color feel intentional — like a real product, not a demo
  PERSONAL   — it's unmistakably the user's idea, with their theme's words, colors, and personality
  REPLAYABLE — there is always a reason to try again: a better score, a new level, a different outcome

━━━ FIRST IMPRESSION (the project has 2 seconds to hook the user) ━━━
${category === 'game' ? `• Start screen: animated title (use animation:float 3s ease infinite or bounce), a visual icon/character representing the game theme, and a glowing pulsing Play button (animation:glow 2s ease infinite)
• The start screen background must feel thematic — bright lavender starlight for space games, warm food colors for cooking, etc.
• Something must be moving on the start screen before the user clicks anything` : category === 'website' ? `• Hero loads with an animated headline (.fade-up, animation-delay stagger)
• The h1 must be large, bold, and use .gradient-text
• At least one element is animated/floating on load — a badge, icon, or decorative shape` : `• The tool layout is centered, clean, and immediately clear in its purpose
• The main input or action area draws the eye — styled prominently, not buried
• An example value or placeholder guides the user instantly`}

━━━ PERSONALITY — every project is unique, never generic ━━━
• Give it a real name drawn from the user's idea: NOT "My Game" — "Galactic Rush", "Chef's Challenge", "Speed Typer 3000"
• Use the theme's vocabulary everywhere: a cooking game says "ingredients" not "targets"; a space game says "asteroids" not "objects"
• Color palette must match the theme while staying bright and welcoming: space → lavender + cyan/purple accents; cooking → warm orange/cream; underwater → sky blue + teal; forest → soft green + lime. Do not use navy or near-black page backgrounds.
• HUD labels, button text, result messages — all should sound like they belong to THIS project

${category === 'game' ? `━━━ GAME FEEL REQUIREMENTS ━━━
• Score increases must animate — flash the number, play a sound tone, spawn a floating +points popup
• Losing a life / missing / failing must feel physical — screen shake, flash red, a low buzzer tone
• Winning / completing a level must celebrate — particles burst, sound plays, score pumps up
• Between rounds or at level-up: show a brief moment of triumph before resuming
• The difficulty must visibly ramp — players must notice something changed after a few rounds
• Every game-over should feel fair, not random — the player should understand why they lost` : category === 'website' ? `━━━ WEBSITE FEEL REQUIREMENTS ━━━
• Every section must feel different from the last — vary background weight, card style, or layout
• Hover states must be satisfying: lift + shadow change, not just a color swap
• Forms give warm, encouraging feedback (not generic "success") — e.g. "You're on the list!"
• Buttons that complete actions should animate: shrink → expand, or briefly show a checkmark
• The page should feel like a real product someone would actually use` : `━━━ TOOL FEEL REQUIREMENTS ━━━
• Results display with a transition — slide in, fade in, or count up (not instant DOM swap)
• Input errors use friendly language: "Hmm, that doesn't look right" not "Invalid input"
• The main result is large, bold, and the visual focus of the page
• Copy-to-clipboard or share actions where they add delight`}

${category === 'game' ? `Games must include:
- start state
- gameplay loop
- score system
- restart
- win/lose state
- progression or increasing challenge` : category === 'website' ? `Websites must:
- have a visually compelling hero (gradient background, large type — NOT plain white or flat)
- use rich typographic hierarchy: giant h1, readable body, .eyebrow labels on sections
- include generous section padding and breathing room — NOT cramped layouts
- apply hover depth on all cards, buttons, and links (lift + shadow)
- use the primary color beyond just buttons: gradient text on hero, eyebrows, accents
- animate 3+ elements on load with .fade-up stagger (feels alive, not static)
- be believable and usable — not generic, not template-looking` : category === 'quiz' ? `Quizzes must include:
- scoring
- progression
- restart
- instant answer feedback` : `Tools must include:
- real functionality
- live updates
- usable interface`}

The user must feel: "I made something I want to show someone."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PALETTE — copy this :root into your <style> first:
:root{${palette.vars}}

ANIMATION KEYFRAMES — include these in your <style>:
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes shake{0%,100%{transform:translateX(0)}15%{transform:translate(-6px,3px)}30%{transform:translate(6px,-3px)}45%{transform:translate(-4px,4px)}60%{transform:translate(4px,-2px)}75%{transform:translate(-2px,3px)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes glow{0%,100%{box-shadow:0 0 6px var(--primary)}50%{box-shadow:0 0 24px var(--primary),0 0 40px var(--accent)}}
@keyframes celebrate{0%{transform:scale(1) rotate(0)}40%{transform:scale(1.25) rotate(-8deg)}80%{transform:scale(1.15) rotate(6deg)}100%{transform:scale(1) rotate(0)}}
@keyframes slideUp{from{transform:translateY(28px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes ripple{0%{transform:scale(0);opacity:.7}100%{transform:scale(3.5);opacity:0}}
@keyframes particle-burst{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--tx),var(--ty)) scale(0);opacity:0}}
@keyframes score-float{0%{transform:translateY(0) scale(.8);opacity:1}100%{transform:translateY(-55px) scale(1.1);opacity:0}}
@keyframes combo-pop{0%{transform:scale(.4)}60%{transform:scale(1.35)}100%{transform:scale(1)}}
@keyframes hud-flash{0%{transform:scale(1)}35%{transform:scale(1.28)}100%{transform:scale(1)}}
@keyframes level-up{0%{transform:scale(1) rotate(0);filter:brightness(1)}50%{transform:scale(1.4) rotate(-4deg);filter:brightness(1.6)}100%{transform:scale(1) rotate(0);filter:brightness(1)}}
@keyframes spawn-in{0%{transform:scale(0) rotate(-20deg);opacity:0}70%{transform:scale(1.15) rotate(5deg)}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideInLeft{from{transform:translateX(-28px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes scaleIn{0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}

${starterSection}

UNIVERSAL RULES (enforced — no exceptions):
1. Return ONE complete self-contained HTML file: <!DOCTYPE html><html>...<head>...<body>...</body></html>
2. MUST include: <meta name="viewport" content="width=device-width, initial-scale=1.0">
3. Use ONLY CSS variables from :root. Font: 'Segoe UI',system-ui,sans-serif. NO Times New Roman.
4. NO external CDN links · NO fetch() to external URLs · NO external image src
5. EVERY <button> MUST have onclick= or addEventListener — ZERO dead buttons
6. EVERY user action MUST produce visible feedback (score change, text update, animation, reveal)
7. Responsive layout: flex/grid with flex-wrap, max-width on all containers, min 320px works
8. At least one CSS animation plays during gameplay or on interaction
9. Close all tags properly — output must end with </html>

OUTPUT FORMAT — return EXACTLY this structure, nothing else:
<META>{"title":"3–5 word title","type":"${type}","summary":"We built ... (max 20 words)","conceptsUsed":["variables","events","loops","functions"]}</META>
<HTML>
<!DOCTYPE html>
[complete working HTML document]
</HTML>`;
}

// ── Polish Pass ───────────────────────────────────────────────────────────────
// Runs after successful generation. Improves visual quality without touching JS.
const POLISH_SYSTEM_PROMPT = `You are a UI polish specialist. You receive a finished, working interactive HTML project and make it look significantly more polished. You ONLY touch CSS and HTML class attributes. You never touch JavaScript.

═══ PRESERVE EXACTLY ═══
• Every line of the <script> block — no rewrites, no moves, no deletions
• All element IDs — they are wired to JavaScript
• All onclick= and addEventListener — do not remove or alter any
• Screen system: .screen, .screen.active, showScreen(), overlays, HUD IDs
• Game logic, timers, score systems, game loops, physics
• The project concept, content, and overall layout structure

═══ WHAT TO IMPROVE ═══

SPACING & LAYOUT
• Screen / section padding: 28px desktop · 18px mobile — never under 16px
• Button padding: 13px 28px minimum
• Gaps between sibling elements: 16–24px
• Game areas: max-width:480px; margin:0 auto — centered, not full-bleed
• Website containers: max-width:680px; margin:0 auto; padding:0 24px

TYPOGRAPHY
• h1 → font-size:clamp(2rem,6vw,3.2rem); font-weight:900; letter-spacing:-.5px; line-height:1.1
• h2 → font-size:clamp(1.4rem,4vw,2rem); font-weight:800; letter-spacing:-.3px
• Score / timer numbers → font-variant-numeric:tabular-nums; font-weight:900
• Body copy → line-height:1.65
• Button labels → font-weight:700

ANIMATION TIMING
• Button hover: transition:transform .15s ease,filter .15s ease (not linear)
• Card / panel hover: transition:transform .22s cubic-bezier(.2,.8,.4,1), box-shadow .22s ease
• Spawning / pop-in: cubic-bezier(.2,.8,.4,1.4) for a satisfying overshoot
• Overlay appear: fadeIn .2s ease
• No harsh linear timings on UI elements — always ease or cubic-bezier

BUTTON STATES — all four must exist for every button and .btn
• :hover  → transform:translateY(-2px); filter:brightness(1.09)
• :active → transform:scale(.95)
• :disabled → opacity:.38; cursor:not-allowed; transform:none; filter:none
• :focus-visible → outline:3px solid var(--primary); outline-offset:3px

COLOR & SHADOWS
• Button box-shadow: use the palette primary color in rgba, not black
  Example: 0 4px 14px rgba(255,122,0,.28) when --primary is #FF7A00
• Card / panel shadow: 0 2px 8px rgba(0,0,0,.06), 0 8px 28px rgba(0,0,0,.09)
• Input :focus shadow: 0 0 0 3px rgba(primary,.18) alongside border-color change
• Danger / error glow: box-shadow:0 0 0 3px rgba(var(--danger),.22)
• Never pure black rgba(0,0,0,1) or flat box-shadow with opacity>.6

RESPONSIVENESS
• All headings use clamp() for font-size
• @media(max-width:520px): reduce padding to 16px, stack flex rows (flex-direction:column), reduce font sizes slightly
• Touch targets: min-height:44px; min-width:44px for all interactive elements
• font-size never below 14px on mobile

GAMEPLAY FEEDBACK (for games)
• Score/HUD element: ensure .hud-flash → animation:hud-flash .3s ease is defined and usable
• Wrong / miss: ensure .wrong or shake animation: animation:shake .4s ease
• Timer danger (≤5s): ensure .danger → color:var(--danger); animation:pulse .5s ease infinite
• Win / success: ensure animate:celebrate .55s cubic-bezier(.2,.8,.4,1.4) is defined
• Combo/streak: animation:combo-pop .28s cubic-bezier(.2,.8,.4,1.4) when streak badge updates

═══ RETURN FORMAT ═══
Return ONLY the complete polished HTML file. No explanation. No markdown fences outside the tags.

<CODE>
[complete polished HTML file, ending with </html>]
</CODE>`;

async function runPolishPass(html, type) {
  try {
    const categoryHint = ['clicker','runner','platformer','dodge','racing','memory','reaction','quiz','soccer','basketball','typing','tower','maze','survival','puzzle','cooking','game'].includes(type)
      ? 'game' : ['website','portfolio','restaurant','shop','sports','blog','landing'].includes(type)
      ? 'website' : 'tool';

    const message = await createTrackedMessage('polish', {
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system:     POLISH_SYSTEM_PROMPT,
      messages: [{
        role:    'user',
        content: `Polish the visual presentation of this ${categoryHint} (type: ${type}). Improve spacing, typography, animations, button states, shadows, and responsiveness. Keep all JavaScript and IDs untouched.\n\nHTML to polish:\n\`\`\`html\n${html}\n\`\`\`\n\nReturn the complete polished file inside <CODE>...</CODE>.`,
      }],
    });

    const raw = message.content[0]?.text || '';
    const { html: polished } = parseBuilderResponse(raw);
    return polished || null;
  } catch (e) {
    console.error('Polish pass error (non-fatal):', e.message);
    return null;
  }
}

// ── Fallback website template (last resort when AI output is incomplete) ───────
function buildFallbackWebsite(designConfig, userPrompt) {
  const palette = designConfig.palette;
  const type = designConfig.type;
  const title = userPrompt.length > 40 ? userPrompt.slice(0, 40) + '...' : userPrompt;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
:root{${palette.vars}}
${WEBSITE_CSS}
*{margin:0;padding:0;box-sizing:border-box}
.hero{min-height:80vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--primary),var(--accent));text-align:center;padding:60px 24px}
.hero h1{font-size:clamp(2rem,6vw,4rem);color:#fff;font-weight:900;line-height:1.1;text-shadow:0 2px 16px rgba(0,0,0,.3);animation:slideUp .7s ease forwards}
.hero p{color:rgba(255,255,255,.85);font-size:1.15rem;margin-top:20px;max-width:540px;line-height:1.7}
.hero-btns{margin-top:36px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.features{padding:80px 0;background:var(--bg)}
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:28px;max-width:1100px;margin:0 auto;padding:0 28px}
.feature-card{background:var(--card);border-radius:16px;padding:32px;border:1.5px solid var(--border);text-align:center;transition:transform .22s,box-shadow .22s;cursor:default}
.feature-card:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(0,0,0,.1)}
.feature-icon{font-size:2.5rem;margin-bottom:16px}
.feature-card h3{font-size:1.15rem;font-weight:800;color:var(--text);margin-bottom:10px}
.feature-card p{color:var(--muted);font-size:.92rem;line-height:1.6}
.cta-section{padding:80px 24px;text-align:center;background:linear-gradient(135deg,var(--primary),var(--accent))}
.cta-section h2{color:#fff;font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;margin-bottom:16px}
.cta-section p{color:rgba(255,255,255,.85);margin-bottom:32px;font-size:1.05rem}
.form-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;max-width:480px;margin:0 auto}
.form-row input{flex:1;min-width:200px;padding:14px 18px;border-radius:50px;border:none;font-size:1rem;outline:none}
.form-row button{padding:14px 28px;border-radius:50px;background:#fff;color:var(--primary);font-weight:800;border:none;cursor:pointer;transition:transform .15s,filter .15s;font-size:1rem}
.form-row button:hover{transform:translateY(-2px);filter:brightness(1.05)}
.success-msg{display:none;color:#fff;font-size:1.1rem;font-weight:700;margin-top:20px;animation:slideUp .4s ease}
.footer{padding:40px 24px;text-align:center;background:var(--bg);border-top:1px solid var(--border);color:var(--muted);font-size:.9rem}
@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
</style>
</head>
<body>
<nav class="nav">
  <a href="#" class="nav-brand">${type.charAt(0).toUpperCase()+type.slice(1)}</a>
  <ul class="nav-links">
    <li><a class="nav-link" onclick="document.getElementById('features').scrollIntoView({behavior:'smooth'})">Features</a></li>
    <li><a class="nav-link" onclick="document.getElementById('cta').scrollIntoView({behavior:'smooth'})">Get Started</a></li>
  </ul>
</nav>

<div class="hero">
  <div>
    <h1 class="gradient-text" style="background:linear-gradient(135deg,#fff,rgba(255,255,255,.7));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${title}</h1>
    <p>Welcome! This project is being built for you. Explore what's here and click below to get started.</p>
    <div class="hero-btns">
      <button class="btn" style="background:#fff;color:var(--primary)" onclick="document.getElementById('features').scrollIntoView({behavior:'smooth'})">Explore</button>
      <button class="btn btn-outline" style="border-color:#fff;color:#fff" onclick="document.getElementById('cta').scrollIntoView({behavior:'smooth'})">Get Started</button>
    </div>
  </div>
</div>

<section id="features" class="features">
  <div style="text-align:center;margin-bottom:48px">
    <span class="eyebrow">What's inside</span>
    <h2 class="section-title">Built for you</h2>
    <p class="section-sub" style="margin:14px auto 0">Everything you need, ready to use.</p>
  </div>
  <div class="features-grid">
    <div class="feature-card" data-delay="1" style="animation:slideUp .55s .1s ease both">
      <div class="feature-icon">✨</div>
      <h3>Beautiful Design</h3>
      <p>Modern, colorful, and built for all screen sizes.</p>
    </div>
    <div class="feature-card" data-delay="2" style="animation:slideUp .55s .22s ease both">
      <div class="feature-icon">⚡</div>
      <h3>Interactive</h3>
      <p>Every button does something — nothing is just for show.</p>
    </div>
    <div class="feature-card" data-delay="3" style="animation:slideUp .55s .34s ease both">
      <div class="feature-icon">🎯</div>
      <h3>Made for Kids</h3>
      <p>Simple, fun, and easy to use for any age.</p>
    </div>
  </div>
</section>

<section id="cta" class="cta-section">
  <h2>Ready to start?</h2>
  <p>Enter your name and join the fun!</p>
  <div class="form-row">
    <input type="text" id="name-input" placeholder="Your name..." />
    <button onclick="joinFun()">Let's Go!</button>
  </div>
  <p class="success-msg" id="success-msg"></p>
</section>

<footer class="footer">
  <p>Made with CodeIt — your AI creative studio</p>
</footer>

<script>
function joinFun() {
  const name = document.getElementById('name-input').value.trim();
  const msg = document.getElementById('success-msg');
  if (!name) {
    document.getElementById('name-input').style.borderColor = 'red';
    setTimeout(() => { document.getElementById('name-input').style.borderColor = ''; }, 1500);
    return;
  }
  msg.textContent = 'Welcome, ' + name + '! You\\u2019re all set!';
  msg.style.display = 'block';
  document.getElementById('name-input').value = '';
}
document.getElementById('name-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') joinFun();
});
</script>
</body>
</html>`;
}

// ── Rich fallback templates (served when AI times out or produces invalid output) ──

function buildPortfolioFallback() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>My Portfolio</title>
<style>
:root{--p:#F87824;--a:#8B5CF6;--bg:#FFF8EF;--c:#FFFFFF;--b:#EFD8C8;--t:#3D302B;--m:#725F55;--r:14px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--t);line-height:1.65}
nav{position:sticky;top:0;z-index:9;background:rgba(255,248,239,.94);backdrop-filter:blur(12px);border-bottom:1px solid var(--b);padding:0 24px;height:62px;display:flex;align-items:center;justify-content:space-between}
.brand{font-size:1.2rem;font-weight:900;background:linear-gradient(135deg,var(--p),var(--a));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;cursor:pointer}
.nl{display:flex;gap:4px;list-style:none}
.nb{color:var(--m);font-size:.88rem;font-weight:600;padding:7px 14px;border-radius:50px;background:none;border:none;cursor:pointer;font-family:inherit;transition:all .15s}
.nb:hover{background:rgba(255,255,255,.07);color:var(--t)}
.hero{min-height:88vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:60px 24px;background:radial-gradient(ellipse at 50% 0,rgba(168,85,247,.15),transparent 65%)}
.badge{display:inline-block;padding:5px 16px;border-radius:50px;background:rgba(255,122,0,.1);border:1px solid rgba(255,122,0,.25);color:var(--p);font-size:.74rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:20px;animation:up .6s ease both}
h1{font-size:clamp(2.4rem,7vw,4.4rem);font-weight:900;line-height:1.06;letter-spacing:-.5px;animation:up .7s .1s ease both}
.grad{background:linear-gradient(135deg,var(--p),var(--a));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sub{color:var(--m);font-size:1.05rem;max-width:460px;margin:18px auto 32px;line-height:1.7;animation:up .7s .2s ease both}
.btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;animation:up .7s .3s ease both}
.btn{display:inline-flex;align-items:center;padding:13px 26px;border-radius:50px;font-family:inherit;font-size:.95rem;font-weight:700;cursor:pointer;border:none;transition:all .18s}
.bp{background:var(--p);color:#fff;box-shadow:0 4px 18px rgba(255,122,0,.28)}.bp:hover{transform:translateY(-2px);filter:brightness(1.1)}
.bg{background:transparent;color:var(--t);border:1.5px solid var(--b)}.bg:hover{background:rgba(255,255,255,.06);transform:translateY(-2px)}
section{padding:76px 24px}
.wrap{max-width:960px;margin:0 auto}
.lbl{font-size:.72rem;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:var(--p);display:block;margin-bottom:12px}
.sh{font-size:clamp(1.8rem,4vw,2.4rem);font-weight:900;letter-spacing:-.4px;margin-bottom:12px}
.ss{color:var(--m);font-size:.95rem;line-height:1.7;max-width:500px}
.sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;margin-top:44px}
.sk{background:var(--c);border-radius:var(--r);padding:22px;border:1px solid var(--b);opacity:0;animation:up .55s ease forwards}
.skh{display:flex;justify-content:space-between;margin-bottom:11px;font-weight:700;font-size:.93rem}
.skp{color:var(--p);font-weight:800}
.skb{height:7px;background:rgba(255,255,255,.06);border-radius:50px;overflow:hidden}
.skf{height:100%;border-radius:50px;background:linear-gradient(90deg,var(--p),var(--a));width:0;transition:width 1.3s cubic-bezier(.22,.68,0,1.2)}
.pg{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:22px;margin-top:44px}
.pc{background:var(--c);border-radius:var(--r);overflow:hidden;border:1px solid var(--b);transition:transform .22s,box-shadow .22s;opacity:0;animation:up .55s ease forwards}
.pc:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(0,0,0,.3)}
.pt{height:130px;display:flex;align-items:center;justify-content:center;font-size:2.6rem;background:linear-gradient(135deg,var(--p),var(--a))}
.pb{padding:18px}.pb h3{font-size:1rem;font-weight:800;margin-bottom:7px}
.pbp{color:var(--m);font-size:.84rem;line-height:1.55;margin-bottom:11px}
.tgs{display:flex;gap:6px;flex-wrap:wrap}
.tg{padding:3px 10px;border-radius:50px;font-size:.7rem;font-weight:700;text-transform:uppercase;background:rgba(255,122,0,.1);color:var(--p);border:1px solid rgba(255,122,0,.18)}
.cs{background:linear-gradient(135deg,rgba(255,122,0,.06),rgba(168,85,247,.06));border-top:1px solid var(--b);border-bottom:1px solid var(--b)}
.cf{max-width:540px;margin:42px auto 0;display:flex;flex-direction:column;gap:14px}
.fg{display:flex;flex-direction:column;gap:6px}
label{font-size:.82rem;font-weight:700;color:var(--m)}
input,textarea{padding:12px 15px;border-radius:var(--r);border:1.5px solid var(--b);background:rgba(255,255,255,.04);color:var(--t);font-family:inherit;font-size:.95rem;outline:none;transition:border-color .2s,box-shadow .2s;resize:none;width:100%}
input:focus,textarea:focus{border-color:var(--p);box-shadow:0 0 0 3px rgba(255,122,0,.1)}
.fr{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.sbtn{width:100%;padding:15px;border-radius:var(--r);background:linear-gradient(135deg,var(--p),var(--a));color:#fff;font-family:inherit;font-size:1rem;font-weight:800;cursor:pointer;border:none;transition:all .18s}
.sbtn:hover{transform:translateY(-2px);filter:brightness(1.08)}
.ok{display:none;background:rgba(16,185,129,.08);border:1px solid #10B981;border-radius:var(--r);padding:12px;color:#10B981;font-weight:700;text-align:center;animation:up .4s ease}
footer{padding:32px 24px;text-align:center;border-top:1px solid var(--b);color:var(--m);font-size:.87rem}
@keyframes up{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:580px){.fr{grid-template-columns:1fr}.nl{display:none}}
</style>
</head>
<body>
<nav>
  <span class="brand" onclick="window.scrollTo({top:0,behavior:'smooth'})">Portfolio</span>
  <ul class="nl">
    <li><button class="nb" onclick="go('skills')">Skills</button></li>
    <li><button class="nb" onclick="go('projects')">Projects</button></li>
    <li><button class="nb" onclick="go('contact')">Contact</button></li>
  </ul>
</nav>
<section class="hero">
  <div>
    <span class="badge">Open to opportunities</span>
    <h1>I build<br><span class="grad">amazing things</span></h1>
    <p class="sub">Developer and creative thinker. I craft interactive experiences that are fast, beautiful, and delightful.</p>
    <div class="btns">
      <button class="btn bp" onclick="go('contact')">Get in touch</button>
      <button class="btn bg" onclick="go('projects')">See my work</button>
    </div>
  </div>
</section>
<section id="skills">
  <div class="wrap">
    <span class="lbl">What I know</span>
    <h2 class="sh">Skills</h2>
    <p class="ss">Technologies I use to build and ship great products.</p>
    <div class="sg" id="sg"></div>
  </div>
</section>
<section id="projects" style="background:rgba(255,255,255,.015)">
  <div class="wrap">
    <span class="lbl">What I've built</span>
    <h2 class="sh">Projects</h2>
    <p class="ss">Selected work I'm proud of.</p>
    <div class="pg" id="pg"></div>
  </div>
</section>
<section id="contact" class="cs">
  <div class="wrap" style="text-align:center">
    <span class="lbl">Say hello</span>
    <h2 class="sh">Get in Touch</h2>
    <p class="ss" style="margin:0 auto">Have an idea? Let's build something amazing together.</p>
    <form class="cf" onsubmit="send(event)">
      <div class="fr">
        <div class="fg"><label>Name</label><input id="cn" type="text" placeholder="Your name" required></div>
        <div class="fg"><label>Email</label><input id="ce" type="email" placeholder="you@example.com" required></div>
      </div>
      <div class="fg"><label>Message</label><textarea id="cm" rows="5" placeholder="Tell me about your project..." required></textarea></div>
      <div class="ok" id="ok">Message sent! I will get back to you soon.</div>
      <button type="submit" class="sbtn" id="sbtn">Send Message</button>
    </form>
  </div>
</section>
<footer><p>Made with <span style="color:var(--p)">CodeIt</span></p></footer>
<script>
var SK=[{n:'HTML & CSS',p:92},{n:'JavaScript',p:87},{n:'React',p:80},{n:'Node.js',p:74},{n:'Python',p:70},{n:'UI Design',p:82}];
var PR=[{e:'🚀',t:'Space Explorer',d:'Interactive solar system with CSS 3D animations and real orbital data.',tags:['JavaScript','CSS','Animation']},{e:'🛒',t:'Shop Dashboard',d:'E-commerce admin dashboard with live analytics, inventory and orders.',tags:['React','Node.js','MySQL']},{e:'🎮',t:'Pixel Runner',d:'Browser platformer with procedural level generation and leaderboard.',tags:['Canvas API','Game Dev','JS']}];
document.getElementById('sg').innerHTML=SK.map(function(s,i){return '<div class="sk" style="animation-delay:'+(.08+i*.1)+'s"><div class="skh"><span>'+s.n+'</span><span class="skp">'+s.p+'%</span></div><div class="skb"><div class="skf" data-p="'+s.p+'"></div></div></div>';}).join('');
document.getElementById('pg').innerHTML=PR.map(function(p,i){return '<div class="pc" style="animation-delay:'+(.08+i*.12)+'s"><div class="pt">'+p.e+'</div><div class="pb"><h3>'+p.t+'</h3><p class="pbp">'+p.d+'</p><div class="tgs">'+p.tags.map(function(t){return '<span class="tg">'+t+'</span>';}).join('')+'</div></div></div>';}).join('');
function go(id){document.getElementById(id).scrollIntoView({behavior:'smooth'});}
function send(e){e.preventDefault();var n=document.getElementById('cn').value.trim(),em=document.getElementById('ce').value.trim(),m=document.getElementById('cm').value.trim();if(!n||!em||!m)return;var b=document.getElementById('sbtn');b.textContent='Sending...';b.disabled=true;setTimeout(function(){document.getElementById('ok').style.display='block';b.style.display='none';document.getElementById('cn').value='';document.getElementById('ce').value='';document.getElementById('cm').value='';},900);}
new IntersectionObserver(function(entries){entries.forEach(function(x){if(x.isIntersecting)x.target.querySelectorAll('.skf').forEach(function(f){f.style.width=f.dataset.p+'%';});});},{threshold:.2}).observe(document.getElementById('sg'));
</script>
</body>
</html>`;
}

function buildRestaurantFallback() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>The Golden Fork</title>
<style>
:root{--p:#FF6B35;--a:#F7C948;--bg:#FFF8F0;--c:#fff;--b:#FDE8D4;--t:#1A1009;--m:#6B5C4B;--r:14px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--t)}
nav{position:sticky;top:0;z-index:9;background:rgba(255,248,240,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--b);padding:0 24px;height:62px;display:flex;align-items:center;justify-content:space-between}
.brand{font-size:1.25rem;font-weight:900;color:var(--p)}
.cbtn{background:var(--p);color:#fff;border:none;border-radius:50px;padding:9px 20px;font-family:inherit;font-size:.88rem;font-weight:700;cursor:pointer;transition:all .18s}
.cbtn:hover{filter:brightness(1.08);transform:translateY(-1px)}
.hero{min-height:50vh;background:linear-gradient(135deg,var(--p),var(--a));display:flex;align-items:center;justify-content:center;text-align:center;padding:60px 24px}
.hero h1{font-size:clamp(2rem,6vw,3.6rem);font-weight:900;color:#fff;text-shadow:0 3px 16px rgba(0,0,0,.2);animation:up .7s ease both}
.hero p{color:rgba(255,255,255,.88);font-size:1.05rem;margin-top:12px;max-width:400px;animation:up .7s .15s ease both}
.rbtn{margin-top:26px;padding:13px 30px;border-radius:50px;background:#fff;color:var(--p);font-family:inherit;font-size:.95rem;font-weight:800;border:none;cursor:pointer;transition:all .18s;animation:up .7s .3s ease both;display:inline-block}
.rbtn:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.15)}
.menu{max-width:1060px;margin:0 auto;padding:56px 24px}
.tabs{display:flex;gap:8px;margin-bottom:36px;flex-wrap:wrap}
.tab{padding:10px 22px;border-radius:50px;background:transparent;border:2px solid var(--b);color:var(--m);font-family:inherit;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .18s}
.tab.on{background:var(--p);color:#fff;border-color:var(--p)}
.tab:hover:not(.on){border-color:var(--p);color:var(--p)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px}
.fc{background:var(--c);border-radius:var(--r);overflow:hidden;border:1.5px solid var(--b);transition:transform .2s,box-shadow .2s}
.fc:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(0,0,0,.08)}
.fi{height:120px;display:flex;align-items:center;justify-content:center;font-size:2.8rem;background:linear-gradient(135deg,var(--p),var(--a));position:relative}
.fbg{position:absolute;top:8px;right:8px;background:#fff;color:var(--p);font-size:.68rem;font-weight:800;padding:3px 9px;border-radius:50px}
.fb{padding:16px}.fn{font-size:1rem;font-weight:800;margin-bottom:5px}
.fd{color:var(--m);font-size:.83rem;line-height:1.5;margin-bottom:12px}
.ff{display:flex;align-items:center;justify-content:space-between}
.fp{font-size:1.1rem;font-weight:900;color:var(--p)}
.ab{background:var(--p);color:#fff;border:none;border-radius:50px;width:34px;height:34px;font-size:1.2rem;cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center}
.ab:hover{transform:scale(1.12)}.ab.added{background:#10B981;animation:pop .25s ease}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:50;display:none;justify-content:flex-end}
.ov.open{display:flex}
.cp{background:#fff;width:320px;max-width:100%;height:100%;display:flex;flex-direction:column;padding:24px;animation:slide .28s ease;overflow-y:auto}
.ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}
.ch h2{font-size:1.25rem;font-weight:900}
.xb{background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--m)}
.ci{flex:1;display:flex;flex-direction:column;gap:10px}
.ci-item{display:flex;align-items:center;justify-content:space-between;background:var(--bg);border-radius:10px;padding:11px 14px;font-size:.88rem}
.ci-n{font-weight:700;flex:1}
.ci-p{color:var(--p);font-weight:800;margin:0 10px}
.ri{background:none;border:none;color:#EF4444;cursor:pointer;font-size:1rem;padding:2px}
.ct{margin-top:18px;padding-top:14px;border-top:2px dashed var(--b);display:flex;justify-content:space-between;font-size:1.05rem;font-weight:900}
.ob{margin-top:14px;width:100%;padding:15px;border-radius:var(--r);background:var(--p);color:#fff;font-family:inherit;font-size:.95rem;font-weight:800;cursor:pointer;border:none}
.ob:hover{filter:brightness(1.08)}
.ec{text-align:center;color:var(--m);padding:36px 0;font-size:.92rem}
.os{display:none;text-align:center;padding:20px;animation:up .4s ease}
.rm{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:60;display:none;align-items:center;justify-content:center}
.rm.open{display:flex}
.mb{background:#fff;border-radius:20px;padding:28px;max-width:400px;width:90%;animation:pop .3s ease}
.mb h2{font-size:1.3rem;font-weight:900;margin-bottom:20px}
.mf{display:flex;flex-direction:column;gap:12px}
.mf input,.mf select{padding:11px 14px;border:1.5px solid var(--b);border-radius:10px;font-family:inherit;font-size:.92rem;outline:none;transition:border-color .2s}
.mf input:focus,.mf select:focus{border-color:var(--p)}
.mbtns{display:flex;gap:8px;margin-top:4px}
.mc{flex:1;padding:13px;border-radius:10px;background:var(--p);color:#fff;font-family:inherit;font-size:.95rem;font-weight:700;cursor:pointer;border:none}
.mx{padding:13px 18px;border-radius:10px;background:var(--bg);border:1.5px solid var(--b);font-family:inherit;cursor:pointer}
.rmsg{display:none;text-align:center;padding:16px}
@keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop{0%{transform:scale(.4)}70%{transform:scale(1.05)}100%{transform:scale(1)}}
@keyframes slide{from{transform:translateX(100%)}to{transform:translateX(0)}}
</style>
</head>
<body>
<nav>
  <span class="brand">The Golden Fork</span>
  <button class="cbtn" onclick="openCart()">Cart (<span id="cc">0</span>)</button>
</nav>
<div class="hero">
  <div>
    <h1>Taste the Difference</h1>
    <p>Fresh ingredients. Bold flavors. Unforgettable moments.</p>
    <button class="rbtn" onclick="openRes()">Reserve a Table</button>
  </div>
</div>
<div class="menu">
  <div class="tabs" id="tabs"></div>
  <div class="grid" id="grid"></div>
</div>
<div class="ov" id="ov" onclick="closeCart(event)">
  <div class="cp">
    <div class="ch"><h2>Your Order</h2><button class="xb" onclick="closeCart()">x</button></div>
    <div class="ci" id="ci"><div class="ec">Your cart is empty</div></div>
    <div id="cf" style="display:none">
      <div class="ct"><span>Total</span><span id="tot">$0.00</span></div>
      <button class="ob" onclick="placeOrder()">Place Order</button>
    </div>
    <div class="os" id="os"><div style="font-size:2.8rem">&#10003;</div><h3>Order Placed!</h3><p style="color:var(--m);margin-top:8px;font-size:.9rem">Ready in about 25 minutes.</p></div>
  </div>
</div>
<div class="rm" id="rm" onclick="closeRes(event)">
  <div class="mb" onclick="event.stopPropagation()">
    <h2>Reserve a Table</h2>
    <div id="rfw">
      <div class="mf">
        <input id="rn" type="text" placeholder="Your name">
        <input id="rd" type="date">
        <select id="rg"><option value="">Number of guests</option><option>1</option><option>2</option><option>3-4</option><option>5+</option></select>
        <div class="mbtns"><button class="mc" onclick="confRes()">Confirm</button><button class="mx" onclick="closeRes()">Cancel</button></div>
      </div>
    </div>
    <div class="rmsg" id="rmsg"></div>
  </div>
</div>
<script>
var MENU={Starters:[{e:'🥗',n:'Garden Salad',d:'Fresh greens, cherry tomatoes, house dressing',p:7.99,b:''},{e:'🍜',n:'Tomato Bisque',d:'Creamy roasted tomato soup with basil oil',p:6.99,b:'Chef Fav'},{e:'🧆',n:'Crispy Falafel',d:'Golden falafel with tahini dipping sauce',p:8.49,b:''}],Mains:[{e:'🍔',n:'Signature Burger',d:'Wagyu beef, aged cheddar, caramelized onion',p:15.99,b:'Best Seller'},{e:'🍝',n:'Truffle Pasta',d:'Fresh pappardelle, black truffle, parmesan',p:18.99,b:''},{e:'🐟',n:'Grilled Salmon',d:'Atlantic salmon, lemon butter, seasonal veg',p:21.99,b:'Popular'}],Desserts:[{e:'🍰',n:'Chocolate Lava',d:'Warm dark chocolate, vanilla bean ice cream',p:8.99,b:'Must Try'},{e:'🍋',n:'Lemon Tart',d:'Silky lemon curd on buttery pastry shell',p:7.49,b:''},{e:'🍨',n:'Affogato',d:'Vanilla gelato drowned in espresso',p:6.99,b:''}]};
var cats=Object.keys(MENU),cur='Starters',cart=[];
document.getElementById('tabs').innerHTML=cats.map(function(t){return '<button class="tab'+(t===cur?' on':'')+'" onclick="switchTab(\''+t+'\')">'+t+'</button>';}).join('');
function switchTab(t){cur=t;document.querySelectorAll('.tab').forEach(function(b,i){b.classList.toggle('on',cats[i]===t);});renderGrid();}
function renderGrid(){var g=document.getElementById('grid');g.innerHTML=MENU[cur].map(function(item,i){return '<div class="fc" style="animation:up .4s '+(.06*i)+'s ease both"><div class="fi">'+item.e+(item.b?'<span class="fbg">'+item.b+'</span>':'')+' </div><div class="fb"><div class="fn">'+item.n+'</div><div class="fd">'+item.d+'</div><div class="ff"><span class="fp">$'+item.p.toFixed(2)+'</span><button class="ab" onclick="addItem(\''+item.n+'\','+item.p+',this)">+</button></div></div></div>';}).join('');}
function addItem(n,p,btn){cart.push({n:n,p:p});updateCart();btn.classList.add('added');btn.textContent='v';setTimeout(function(){btn.classList.remove('added');btn.textContent='+';},700);}
function updateCart(){document.getElementById('cc').textContent=cart.length;renderCartItems();}
function renderCartItems(){var ci=document.getElementById('ci'),cf=document.getElementById('cf');if(!cart.length){ci.innerHTML='<div class="ec">Your cart is empty</div>';cf.style.display='none';return;}ci.innerHTML=cart.map(function(item,i){return '<div class="ci-item"><span class="ci-n">'+item.n+'</span><span class="ci-p">$'+item.p.toFixed(2)+'</span><button class="ri" onclick="rmItem('+i+')">x</button></div>';}).join('');document.getElementById('tot').textContent='$'+cart.reduce(function(s,i){return s+i.p;},0).toFixed(2);cf.style.display='block';}
function rmItem(i){cart.splice(i,1);updateCart();}
function openCart(){document.getElementById('ov').classList.add('open');}
function closeCart(e){if(!e||e.target===document.getElementById('ov'))document.getElementById('ov').classList.remove('open');}
function placeOrder(){document.getElementById('ci').style.display='none';document.getElementById('cf').style.display='none';document.getElementById('os').style.display='block';cart=[];document.getElementById('cc').textContent=0;}
function openRes(){document.getElementById('rm').classList.add('open');}
function closeRes(e){if(!e||e.target===document.getElementById('rm')){document.getElementById('rm').classList.remove('open');document.getElementById('rfw').style.display='block';document.getElementById('rmsg').style.display='none';}}
function confRes(){var n=document.getElementById('rn').value.trim(),d=document.getElementById('rd').value,g=document.getElementById('rg').value;if(!n||!d||!g)return;document.getElementById('rfw').style.display='none';var m=document.getElementById('rmsg');m.innerHTML='<div style="font-size:2.4rem">&#127881;</div><p style="font-weight:700;margin-top:8px">Reserved for <b>'+n+'</b></p><p style="color:var(--m);font-size:.88rem;margin-top:6px">'+g+' guest'+(g!=='1'?'s':'')+' confirmed!</p><button class="mc" style="margin-top:16px" onclick="closeRes()">Done</button>';m.style.display='block';}
renderGrid();
</script>
</body>
</html>`;
}

function buildQuizFallback() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Quiz Challenge</title>
<style>
:root{--p:#F87824;--a:#8B5CF6;--bg:#FFF8EF;--c:#FFFFFF;--b:#EFD8C8;--t:#3D302B;--m:#725F55;--r:14px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--t);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.wrap{width:100%;max-width:560px}
.screen{display:none;flex-direction:column;align-items:center;gap:18px;text-align:center}
.screen.on{display:flex}
h1{font-size:clamp(1.8rem,5vw,2.8rem);font-weight:900;letter-spacing:-.5px}
.grad{background:linear-gradient(135deg,var(--p),var(--a));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
p{color:var(--m);font-size:1rem;line-height:1.6}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 36px;border-radius:50px;font-family:inherit;font-size:1rem;font-weight:700;cursor:pointer;border:none;background:var(--p);color:#fff;box-shadow:0 4px 18px rgba(168,85,247,.28);transition:all .18s}
.btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
.qbox{background:var(--c);border-radius:20px;padding:28px;width:100%;text-align:left;border:1px solid var(--b)}
.prog{display:flex;justify-content:space-between;font-size:.82rem;font-weight:700;color:var(--m);margin-bottom:14px}
.pbar{height:6px;background:#F5E7DC;border-radius:50px;overflow:hidden;margin-bottom:20px}
.pf{height:100%;border-radius:50px;background:linear-gradient(90deg,var(--p),var(--a));transition:width .4s ease}
.qt{font-size:1.1rem;font-weight:700;line-height:1.55;margin-bottom:20px}
.opts{display:flex;flex-direction:column;gap:10px}
.opt{padding:13px 18px;border-radius:12px;background:#FFFDFC;border:1.5px solid var(--b);text-align:left;font-family:inherit;font-size:.95rem;font-weight:600;color:var(--t);cursor:pointer;transition:all .18s}
.opt:hover:not(:disabled){background:rgba(168,85,247,.12);border-color:var(--p)}
.opt.right{background:rgba(16,185,129,.12);border-color:#10B981;color:#10B981}
.opt.wrong{background:rgba(239,68,68,.12);border-color:#EF4444;color:#EF4444}
.fb{min-height:1.4em;font-size:.88rem;font-weight:700;margin-top:10px;text-align:center}
.nxt{width:100%;padding:13px;border-radius:12px;background:var(--p);color:#fff;font-family:inherit;font-size:.95rem;font-weight:700;cursor:pointer;border:none;margin-top:14px;transition:all .18s;display:none}
.nxt:hover{filter:brightness(1.1)}
.score-big{font-size:4rem;font-weight:900;background:linear-gradient(135deg,var(--p),var(--a));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;margin-bottom:4px}
@keyframes pop{0%{transform:scale(.4)}70%{transform:scale(1.08)}100%{transform:scale(1)}}
</style>
</head>
<body>
<div class="wrap">
  <div class="screen on" id="start">
    <h1><span class="grad">Quiz</span> Challenge</h1>
    <p>Test your knowledge with 5 questions and get instant feedback. How many can you get right?</p>
    <button class="btn" onclick="startQuiz()">Start Quiz</button>
  </div>
  <div class="screen" id="quiz">
    <div class="qbox">
      <div class="prog"><span id="qnum">Question 1 of 5</span><span id="sc">Score: 0</span></div>
      <div class="pbar"><div class="pf" id="pf" style="width:0%"></div></div>
      <div class="qt" id="qt"></div>
      <div class="opts" id="opts"></div>
      <div class="fb" id="fb"></div>
      <button class="nxt" id="nxt" onclick="nextQ()">Next Question</button>
    </div>
  </div>
  <div class="screen" id="result">
    <div class="score-big" id="final-sc"></div>
    <p style="font-size:1.1rem;font-weight:700;color:var(--t)" id="final-msg"></p>
    <p id="final-sub"></p>
    <button class="btn" onclick="startQuiz()">Play Again</button>
  </div>
</div>
<script>
var QS=[{q:'What is the capital of France?',opts:['London','Berlin','Paris','Madrid'],a:2},{q:'Which planet is closest to the Sun?',opts:['Venus','Mercury','Earth','Mars'],a:1},{q:'How many sides does a hexagon have?',opts:['5','7','8','6'],a:3},{q:'What is 12 x 12?',opts:['132','144','124','148'],a:1},{q:'Which animal is the fastest on land?',opts:['Lion','Horse','Cheetah','Leopard'],a:2}];
var cur=0,score=0,answered=false;
function showScreen(id){['start','quiz','result'].forEach(function(s){document.getElementById(s).classList.toggle('on',s===id);});}
function startQuiz(){cur=0;score=0;showScreen('quiz');showQ();}
function showQ(){var q=QS[cur];answered=false;document.getElementById('qnum').textContent='Question '+(cur+1)+' of '+QS.length;document.getElementById('sc').textContent='Score: '+score;document.getElementById('pf').style.width=((cur/QS.length)*100)+'%';document.getElementById('qt').textContent=q.q;document.getElementById('fb').textContent='';document.getElementById('nxt').style.display='none';document.getElementById('opts').innerHTML=q.opts.map(function(o,i){return '<button class="opt" onclick="pick(this,'+i+')">'+o+'</button>';}).join('');}
function pick(btn,i){if(answered)return;answered=true;var q=QS[cur];document.querySelectorAll('.opt').forEach(function(b){b.disabled=true;});if(i===q.a){btn.classList.add('right');score++;document.getElementById('sc').textContent='Score: '+score;document.getElementById('fb').innerHTML='<span style="color:#10B981">Correct! +1 point</span>';}else{btn.classList.add('wrong');document.querySelectorAll('.opt')[q.a].classList.add('right');document.getElementById('fb').innerHTML='<span style="color:#EF4444">Incorrect. Answer: '+q.opts[q.a]+'</span>';}document.getElementById('nxt').style.display='block';document.getElementById('nxt').textContent=cur<QS.length-1?'Next Question':'See Results';}
function nextQ(){cur++;if(cur>=QS.length){var pct=Math.round((score/QS.length)*100);document.getElementById('final-sc').textContent=score+'/'+QS.length;document.getElementById('final-sc').style.animation='pop .5s ease';document.getElementById('final-msg').textContent=pct>=80?'Excellent work!':pct>=60?'Good job!':'Keep practicing!';document.getElementById('final-sub').textContent='You scored '+pct+'% ('+score+' of '+QS.length+' correct)';showScreen('result');}else showQ();}
</script>
</body>
</html>`;
}

function buildSoccerFallback() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Penalty Kick</title>
<style>
:root{--p:#22C55E;--a:#F59E0B;--bg:#1A2F1A;--c:#243324;--b:rgba(255,255,255,.1);--t:#F1F5F9;--m:#9CA3AF;--r:10px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--t);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px}
h1{font-size:2rem;font-weight:900;letter-spacing:-.5px}
.hud{display:flex;gap:28px;font-size:1.05rem;font-weight:700;background:var(--c);border-radius:50px;padding:10px 28px;border:1px solid var(--b)}
.hud b{color:var(--a)}
#cv{border-radius:16px;border:3px solid var(--b);cursor:crosshair;display:block;max-width:100%;box-shadow:0 8px 32px rgba(0,0,0,.4)}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center;z-index:10}
.ov.on{display:flex}
.box{background:var(--c);border-radius:20px;padding:32px;text-align:center;display:flex;flex-direction:column;gap:16px;border:1px solid var(--b);min-width:280px;animation:pop .3s ease}
.box h2{font-size:1.6rem;font-weight:900}
.box p{color:var(--m);font-size:.95rem;line-height:1.6}
.btn{padding:14px 36px;border-radius:50px;background:var(--p);color:#fff;font-family:inherit;font-size:1rem;font-weight:700;cursor:pointer;border:none;transition:all .18s}
.btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
@keyframes pop{0%{transform:scale(.5)}70%{transform:scale(1.05)}100%{transform:scale(1)}}
</style>
</head>
<body>
<h1>Penalty Kick</h1>
<div class="hud"><span>Goals: <b id="goals">0</b></span><span>Shots: <b id="shots">0</b>/5</span></div>
<canvas id="cv" width="480" height="300"></canvas>
<p style="color:var(--m);font-size:.88rem">Click inside the goal to shoot!</p>
<div class="ov on" id="s-ov">
  <div class="box">
    <h2>Penalty Kick</h2>
    <p>Click anywhere inside the goal to shoot! The goalkeeper will try to stop you. You have 5 shots — score as many as you can!</p>
    <button class="btn" onclick="startGame()">Kick Off!</button>
  </div>
</div>
<div class="ov" id="r-ov">
  <div class="box">
    <h2 id="r-title">Result</h2>
    <p id="r-msg"></p>
    <button class="btn" onclick="startGame()">Play Again</button>
  </div>
</div>
<script>
var cv=document.getElementById('cv'),ctx=cv.getContext('2d');
var W=480,H=300,goals=0,shots=0,maxShots=5,playing=false,busy=false;
var GK={x:240,y:75,w:50,h:50,tx:240};
var BALL={x:240,y:230,r:13};
var GOAL={x:110,y:25,w:260,h:100};
var gkInt;
function draw(){
  ctx.fillStyle='#2D4A2D';ctx.fillRect(0,0,W,H);
  for(var i=0;i<6;i++){ctx.fillStyle=i%2===0?'#2D4A2D':'#304D30';ctx.fillRect(0,i*50,W,50);}
  ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=2;
  ctx.strokeRect(GOAL.x,GOAL.y,GOAL.w,GOAL.h);
  ctx.beginPath();ctx.moveTo(GOAL.x+GOAL.w/3,GOAL.y);ctx.lineTo(GOAL.x+GOAL.w/3,GOAL.y+GOAL.h);ctx.stroke();
  ctx.beginPath();ctx.moveTo(GOAL.x+GOAL.w*2/3,GOAL.y);ctx.lineTo(GOAL.x+GOAL.w*2/3,GOAL.y+GOAL.h);ctx.stroke();
  ctx.fillStyle='#F59E0B';ctx.fillRect(GK.x-GK.w/2,GK.y-GK.h/2,GK.w,GK.h);
  ctx.fillStyle='#1F2937';ctx.fillRect(GK.x-7,GK.y-GK.h/2-9,14,10);
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(BALL.x,BALL.y,BALL.r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#333';ctx.beginPath();ctx.arc(BALL.x-3,BALL.y-3,4,0,Math.PI*2);ctx.fill();
}
function startGame(){goals=0;shots=0;playing=true;busy=false;BALL.x=240;BALL.y=230;GK.x=240;document.getElementById('goals').textContent=0;document.getElementById('shots').textContent=0;document.getElementById('s-ov').classList.remove('on');document.getElementById('r-ov').classList.remove('on');draw();clearInterval(gkInt);gkInt=setInterval(function(){if(!playing)return;GK.tx=GOAL.x+25+Math.random()*(GOAL.w-50);},800);}
cv.addEventListener('click',function(e){if(!playing||busy)return;var r=cv.getBoundingClientRect();var sx=W/r.width,sy=H/r.height;var tx=(e.clientX-r.left)*sx,ty=(e.clientY-r.top)*sy;if(tx<GOAL.x||tx>GOAL.x+GOAL.w||ty<GOAL.y||ty>GOAL.y+GOAL.h)return;busy=true;var bx=BALL.x,by=BALL.y,step=0,steps=22;var dx=(tx-bx)/steps,dy=(ty-by)/steps;var anim=setInterval(function(){step++;BALL.x+=dx;BALL.y+=dy;if(GK.x<GK.tx)GK.x=Math.min(GK.x+4.5,GK.tx);else GK.x=Math.max(GK.x-4.5,GK.tx);draw();if(step>=steps){clearInterval(anim);var blocked=BALL.x>GK.x-GK.w/2-4&&BALL.x<GK.x+GK.w/2+4&&BALL.y>GK.y-GK.h/2-4&&BALL.y<GK.y+GK.h/2+4;shots++;if(!blocked)goals++;document.getElementById('goals').textContent=goals;document.getElementById('shots').textContent=shots;BALL.x=240;BALL.y=230;busy=false;if(shots>=maxShots){playing=false;clearInterval(gkInt);var t=goals>=4?'Hat-trick Hero!':goals>=3?'Great Shooter!':goals>=2?'Not Bad!':'Better Luck Next Time!';document.getElementById('r-title').textContent=t;document.getElementById('r-msg').textContent='You scored '+goals+' out of '+maxShots+' shots!';document.getElementById('r-ov').classList.add('on');}else draw();}},18);});
draw();
</script>
</body>
</html>`;
}

// ── Derive a short display title from a raw prompt ────────────────────────────
function derivePromptTitle(prompt) {
  const clean = (prompt || '').trim().replace(/^(build|make|create|generate|a|an|the)\s+/gi, '');
  const words = clean.split(/\s+/).slice(0, 6).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// ── Landing page fallback ─────────────────────────────────────────────────────
function buildLandingFallback(userPrompt) {
  const title = derivePromptTitle(userPrompt) || 'Launch Your Idea';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<style>
:root{--p:#F87824;--a:#8B5CF6;--s:#10B981;--bg:#FFF8EF;--c:#FFFFFF;--b:#EFD8C8;--t:#3D302B;--m:#725F55;--r:14px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--t);line-height:1.65}
nav{position:sticky;top:0;z-index:100;background:rgba(255,248,239,.94);backdrop-filter:blur(16px);border-bottom:1px solid var(--b);padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between}
.brand{font-size:1.2rem;font-weight:900;background:linear-gradient(135deg,var(--p),var(--a));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;cursor:pointer}
.nl{display:flex;gap:4px;list-style:none}
.nb{color:var(--m);font-size:.88rem;font-weight:600;padding:7px 14px;border-radius:50px;background:none;border:none;cursor:pointer;font-family:inherit;transition:all .15s}
.nb:hover{background:rgba(255,255,255,.07);color:var(--t)}
.nbtn{padding:9px 20px;border-radius:50px;background:var(--p);color:#fff;font-family:inherit;font-size:.88rem;font-weight:700;border:none;cursor:pointer;transition:all .18s}
.nbtn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.hero{min-height:88vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:60px 24px;background:radial-gradient(ellipse at 50% 0,rgba(255,122,0,.15) 0,rgba(168,85,247,.08) 40%,transparent 70%)}
.badge{display:inline-block;padding:5px 16px;border-radius:50px;background:rgba(255,122,0,.1);border:1px solid rgba(255,122,0,.25);color:var(--p);font-size:.73rem;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:22px;animation:up .5s ease both}
h1{font-size:clamp(2.2rem,7vw,4rem);font-weight:900;line-height:1.07;letter-spacing:-.6px;animation:up .6s .08s ease both}
.grad{background:linear-gradient(135deg,var(--p),var(--a));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero p{color:var(--m);font-size:1.05rem;max-width:440px;margin:20px auto 32px;line-height:1.7;animation:up .6s .16s ease both}
.btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;animation:up .6s .24s ease both}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:50px;font-family:inherit;font-size:.95rem;font-weight:700;cursor:pointer;border:none;transition:all .18s}
.btn-p{background:var(--p);color:#fff;box-shadow:0 4px 20px rgba(255,122,0,.3)}.btn-p:hover{transform:translateY(-2px);filter:brightness(1.1)}
.btn-g{background:transparent;color:var(--t);border:1.5px solid var(--b)}.btn-g:hover{background:rgba(255,255,255,.06);transform:translateY(-2px)}
.stats{padding:48px 24px;border-top:1px solid var(--b);border-bottom:1px solid var(--b)}
.si{max-width:700px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;text-align:center}
.sn{font-size:2.4rem;font-weight:900;background:linear-gradient(135deg,var(--p),var(--a));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1}
.sl{font-size:.78rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--m);margin-top:6px}
.features{padding:80px 24px}
.wrap{max-width:960px;margin:0 auto}
.lbl{font-size:.72rem;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:var(--p);display:block;margin-bottom:12px;text-align:center}
.sh{font-size:clamp(1.8rem,4vw,2.4rem);font-weight:900;letter-spacing:-.4px;text-align:center;margin-bottom:10px}
.ss{color:var(--m);font-size:.93rem;line-height:1.7;max-width:440px;margin:0 auto 48px;text-align:center}
.fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}
.fc{background:var(--c);border-radius:var(--r);padding:26px;border:1px solid var(--b);transition:transform .22s,box-shadow .22s;opacity:0;animation:up .55s ease forwards}
.fc:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(0,0,0,.3)}
.fi{width:50px;height:50px;border-radius:12px;background:rgba(255,122,0,.12);display:flex;align-items:center;justify-content:center;font-size:1.4rem;margin-bottom:16px}
.fc h3{font-size:1rem;font-weight:800;margin-bottom:8px}
.fc p{color:var(--m);font-size:.85rem;line-height:1.6}
.pricing{padding:80px 24px;border-top:1px solid var(--b)}
.tw{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:36px}
.tl{font-size:.9rem;font-weight:700;color:var(--m);transition:color .2s}
.tl.on{color:var(--t)}
.tog{width:48px;height:26px;border-radius:50px;background:var(--p);border:none;cursor:pointer;position:relative;flex-shrink:0}
.tog::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s}
.tog.yr::after{left:25px}
.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;max-width:700px;margin:0 auto}
.plan{background:var(--c);border-radius:var(--r);padding:28px;border:1px solid var(--b);text-align:center}
.plan.feat{border-color:var(--p);position:relative}
.pbg{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--p);color:#fff;font-size:.72rem;font-weight:800;padding:4px 14px;border-radius:50px;white-space:nowrap}
.plan h3{font-size:1.1rem;font-weight:800;margin-bottom:8px}
.pp{font-size:2.6rem;font-weight:900;line-height:1;margin:12px 0 4px}
.ppr{font-size:.82rem;color:var(--m);margin-bottom:20px}
.plan ul{list-style:none;text-align:left;margin-bottom:22px;display:flex;flex-direction:column;gap:8px}
.plan li{font-size:.87rem;color:var(--m);padding-left:20px;position:relative}
.plan li::before{content:'✓';position:absolute;left:0;color:var(--s);font-weight:800}
.pbtn{width:100%;padding:13px;border-radius:var(--r);font-family:inherit;font-size:.95rem;font-weight:700;cursor:pointer;border:none;transition:all .18s;background:var(--p);color:#fff}
.pbtn:hover{filter:brightness(1.1);transform:translateY(-2px)}
.plan:not(.feat) .pbtn{background:rgba(255,255,255,.07);color:var(--t)}
.faq-sec{padding:80px 24px}
.fl{max-width:640px;margin:36px auto 0;display:flex;flex-direction:column;gap:10px}
.fi2{background:var(--c);border-radius:var(--r);border:1px solid var(--b);overflow:hidden}
.fq{width:100%;padding:18px 20px;background:none;border:none;color:var(--t);font-family:inherit;font-size:.93rem;font-weight:700;text-align:left;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
.fq:hover{color:var(--p)}
.fa2{font-size:1.1rem;transition:transform .25s;color:var(--p);flex-shrink:0}
.fi2.open .fa2{transform:rotate(180deg)}
.fac{max-height:0;overflow:hidden;transition:max-height .3s ease}
.fi2.open .fac{max-height:200px}
.fai{padding:0 20px 18px;color:var(--m);font-size:.88rem;line-height:1.7}
.cta{padding:80px 24px;text-align:center;background:linear-gradient(135deg,rgba(255,122,0,.06),rgba(168,85,247,.06));border-top:1px solid var(--b)}
.cta h2{font-size:clamp(1.8rem,4vw,2.4rem);font-weight:900;margin-bottom:12px;letter-spacing:-.4px}
.cta p{color:var(--m);margin-bottom:28px}
.er{display:flex;gap:10px;justify-content:center;max-width:440px;margin:0 auto;flex-wrap:wrap}
.er input{flex:1;min-width:200px;padding:13px 18px;border-radius:50px;border:1.5px solid var(--b);background:var(--c);color:var(--t);font-family:inherit;font-size:.93rem;outline:none;transition:border-color .2s}
.er input:focus{border-color:var(--p)}
.er button{padding:13px 24px;border-radius:50px;background:var(--p);color:#fff;font-family:inherit;font-size:.93rem;font-weight:700;border:none;cursor:pointer;transition:all .18s;white-space:nowrap}
.er button:hover{filter:brightness(1.1);transform:translateY(-2px)}
.cok{display:none;color:var(--s);font-weight:700;font-size:1rem;margin-top:18px;animation:up .4s ease}
footer{padding:32px 24px;text-align:center;border-top:1px solid var(--b);color:var(--m);font-size:.87rem}
@keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:580px){.si{grid-template-columns:1fr 1fr}.nl{display:none}}
</style>
</head>
<body>
<nav>
  <span class="brand" onclick="window.scrollTo({top:0,behavior:'smooth'})">${title.split(' ').slice(0,2).join(' ')}</span>
  <ul class="nl">
    <li><button class="nb" onclick="go('features')">Features</button></li>
    <li><button class="nb" onclick="go('pricing')">Pricing</button></li>
    <li><button class="nb" onclick="go('faq')">FAQ</button></li>
  </ul>
  <button class="nbtn" onclick="go('cta')">Get Started</button>
</nav>
<section class="hero">
  <div>
    <span class="badge">Now Available</span>
    <h1>The <span class="grad">smartest way</span><br>to launch your idea</h1>
    <p>Everything you need to go from idea to reality. Start in minutes, grow without limits.</p>
    <div class="btns">
      <button class="btn btn-p" onclick="go('cta')">Start for Free</button>
      <button class="btn btn-g" onclick="go('features')">See Features</button>
    </div>
  </div>
</section>
<div class="stats">
  <div class="si">
    <div><div class="sn" id="s1">0</div><div class="sl">Happy Users</div></div>
    <div><div class="sn" id="s2">0</div><div class="sl">Uptime %</div></div>
    <div><div class="sn" id="s3">0</div><div class="sl">Projects Built</div></div>
  </div>
</div>
<section id="features" class="features">
  <div class="wrap">
    <span class="lbl">Why people love it</span>
    <h2 class="sh">Everything you need</h2>
    <p class="ss">Powerful features that help you move fast and build things people love.</p>
    <div class="fg">
      <div class="fc" style="animation-delay:.05s"><div class="fi">⚡</div><h3>Lightning Fast</h3><p>Built for speed. No waiting, no loading screens, just results.</p></div>
      <div class="fc" style="animation-delay:.15s"><div class="fi">🛡️</div><h3>Fully Secure</h3><p>Enterprise-grade security out of the box. Your data is always safe.</p></div>
      <div class="fc" style="animation-delay:.25s"><div class="fi">🎨</div><h3>Beautiful Design</h3><p>Stunning interfaces that delight users and make your product shine.</p></div>
    </div>
  </div>
</section>
<section id="pricing" class="pricing">
  <div class="wrap">
    <span class="lbl">Simple pricing</span>
    <h2 class="sh">Plans for everyone</h2>
    <p class="ss">Start free, scale when ready. No hidden fees.</p>
    <div class="tw">
      <span class="tl on" id="ml">Monthly</span>
      <button class="tog" id="ptog" onclick="toggleP()"></button>
      <span class="tl" id="yl">Yearly <span style="color:var(--s);font-size:.78rem">(save 20%)</span></span>
    </div>
    <div class="plans">
      <div class="plan">
        <h3>Starter</h3>
        <div class="pp"><span id="p1">$0</span></div>
        <div class="ppr">per month</div>
        <ul><li>5 projects</li><li>Basic analytics</li><li>Community support</li></ul>
        <button class="pbtn" onclick="go('cta')">Get Started</button>
      </div>
      <div class="plan feat">
        <span class="pbg">Most Popular</span>
        <h3>Pro</h3>
        <div class="pp"><span id="p2">$19</span></div>
        <div class="ppr" id="p2r">per month</div>
        <ul><li>Unlimited projects</li><li>Advanced analytics</li><li>Priority support</li><li>Custom domains</li></ul>
        <button class="pbtn" onclick="go('cta')">Start Free Trial</button>
      </div>
    </div>
  </div>
</section>
<section id="faq" class="faq-sec">
  <div class="wrap">
    <span class="lbl">Got questions?</span>
    <h2 class="sh">Frequently Asked</h2>
    <div class="fl" id="fl"></div>
  </div>
</section>
<section id="cta" class="cta">
  <h2>Ready to get <span class="grad">started?</span></h2>
  <p>Join thousands of people already building amazing things.</p>
  <div class="er">
    <input type="email" id="em" placeholder="Enter your email...">
    <button onclick="sub()">Get Started Free</button>
  </div>
  <p class="cok" id="cok">You're on the list! We'll be in touch soon.</p>
</section>
<footer><p>Made with <span style="color:var(--p)">CodeIt</span> — your AI creative studio</p></footer>
<script>
var yr=false;
function go(id){document.getElementById(id).scrollIntoView({behavior:'smooth'});}
function toggleP(){yr=!yr;document.getElementById('ptog').classList.toggle('yr',yr);document.getElementById('ml').classList.toggle('on',!yr);document.getElementById('yl').classList.toggle('on',yr);document.getElementById('p1').textContent=yr?'$0':'$0';document.getElementById('p2').textContent=yr?'$15':'$19';document.getElementById('p2r').textContent=yr?'per month, billed yearly':'per month';}
var FAQS=[{q:'Is there a free plan?',a:'Yes! Starter is completely free forever. No credit card needed.'},{q:'Can I cancel anytime?',a:'Absolutely. Cancel from your account settings. No questions asked.'},{q:'Do you offer refunds?',a:'Yes — 30-day money-back guarantee on all paid plans.'},{q:'Is my data secure?',a:'We use industry-standard encryption for all data at rest and in transit.'}];
var fl=document.getElementById('fl');
fl.innerHTML=FAQS.map(function(f,i){return '<div class="fi2"><button class="fq" onclick="tF('+i+')">'+f.q+'<span class="fa2">▾</span></button><div class="fac"><div class="fai">'+f.a+'</div></div></div>';}).join('');
function tF(i){document.querySelectorAll('.fi2')[i].classList.toggle('open');}
function sub(){var v=document.getElementById('em').value.trim();if(!v||!v.includes('@')){document.getElementById('em').style.borderColor='#EF4444';setTimeout(function(){document.getElementById('em').style.borderColor='';},1500);return;}document.getElementById('em').value='';document.getElementById('cok').style.display='block';}
document.getElementById('em').addEventListener('keydown',function(e){if(e.key==='Enter')sub();});
function animC(el,target){var start=0,steps=80,inc=target/steps,id=setInterval(function(){start+=inc;if(start>=target){start=target;clearInterval(id);}el.textContent=Math.floor(start).toLocaleString();},16);}
new IntersectionObserver(function(entries){if(entries[0].isIntersecting){animC(document.getElementById('s1'),12000);animC(document.getElementById('s2'),99);animC(document.getElementById('s3'),500);}},{threshold:.3}).observe(document.querySelector('.stats'));
</script>
</body>
</html>`;
}

// ── Generic game fallback (clicker) — used when no specific game fallback matches ─
function buildGenericGameFallback() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Click Challenge</title>
<style>
:root{--p:#F87824;--a:#8B5CF6;--d:#DC2626;--bg:#FFF8EF;--c:#FFFFFF;--b:#EFD8C8;--t:#3D302B;--m:#725F55;--r:14px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--t);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px}
h1{font-size:clamp(1.6rem,5vw,2.4rem);font-weight:900;text-align:center;letter-spacing:-.5px;background:linear-gradient(135deg,var(--p),var(--a));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hud{display:flex;gap:28px;font-size:1.1rem;font-weight:700;background:var(--c);border-radius:50px;padding:10px 28px;border:1px solid var(--b)}
.hud b{color:var(--p)}
.hud b.danger{color:var(--d);animation:pulse .5s ease infinite}
#ga{position:relative;width:min(420px,calc(100vw - 40px));height:300px;background:var(--c);border-radius:16px;border:2px solid var(--b);overflow:hidden;cursor:crosshair;box-shadow:0 8px 32px rgba(0,0,0,.4)}
.tgt{position:absolute;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.4rem;user-select:none;animation:spawn .22s cubic-bezier(.2,.8,.4,1.4) both}
.tgt:active{transform:scale(.85)}
.ov{position:absolute;inset:0;background:rgba(255,248,239,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;z-index:10;text-align:center;padding:24px}
.ov h2{font-size:1.6rem;font-weight:900}
.ov p{color:var(--m);font-size:.9rem;max-width:280px;line-height:1.6}
.btn{padding:13px 30px;border-radius:50px;background:var(--p);color:#fff;font-family:inherit;font-size:1rem;font-weight:700;border:none;cursor:pointer;transition:all .18s;box-shadow:0 4px 18px rgba(255,122,0,.3)}
.btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
.sp{position:absolute;font-weight:900;font-size:1rem;pointer-events:none;animation:sfloat .75s ease forwards;color:var(--a);z-index:20}
.pp{position:absolute;border-radius:50%;pointer-events:none;animation:pburst .6s ease forwards}
@keyframes spawn{0%{transform:scale(0) rotate(-20deg);opacity:0}70%{transform:scale(1.15) rotate(5deg)}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes sfloat{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-50px);opacity:0}}
@keyframes pburst{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--tx),var(--ty)) scale(0);opacity:0}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
</style>
</head>
<body>
<h1>Click Challenge</h1>
<div class="hud"><span>Score: <b id="sc">0</b></span><span>Time: <b id="ti" class="">30</b>s</span></div>
<div id="ga">
  <div class="ov" id="ov">
    <h2>Ready to Play?</h2>
    <p>Click the targets before they disappear! Speed increases as you score.</p>
    <button class="btn" onclick="startGame()">Play Now</button>
  </div>
</div>
<script>
var s=0,t=30,on=false,spMs=880,sp,ct;
var EM=['⭐','🎯','💎','🔥','⚡','🌟','🎮','💥','🎪','🏆'];
var CL=['var(--p)','var(--a)','#10B981','#F59E0B','#06B6D4'];
function startGame(){s=0;t=30;on=true;spMs=880;document.getElementById('sc').textContent=0;document.getElementById('ti').textContent=30;document.getElementById('ti').classList.remove('danger');document.getElementById('ov').style.display='none';document.querySelectorAll('.tgt').forEach(function(x){x.remove();});clearInterval(sp);clearInterval(ct);sp=setInterval(spawn,spMs);ct=setInterval(tick,1000);}
function tick(){t--;var el=document.getElementById('ti');el.textContent=t;if(t<=5)el.classList.add('danger');if(t<=0)end();}
function spawn(){if(!on)return;var sz=44+Math.random()*20;var clr=CL[Math.floor(Math.random()*CL.length)];var e=document.createElement('div');e.className='tgt';e.style.cssText='width:'+sz+'px;height:'+sz+'px;left:'+Math.floor(Math.random()*(380-sz))+'px;top:'+Math.floor(Math.random()*(260-sz))+'px;background:'+clr+';box-shadow:0 0 18px '+clr;e.textContent=EM[Math.floor(Math.random()*EM.length)];e.onclick=function(ev){if(!on)return;s++;document.getElementById('sc').textContent=s;if(s%5===0){spMs=Math.max(300,spMs-70);clearInterval(sp);sp=setInterval(spawn,spMs);}var ga=document.getElementById('ga'),gr=ga.getBoundingClientRect();burst(ev.clientX-gr.left,ev.clientY-gr.top,clr);popup(ev.clientX-gr.left,ev.clientY-gr.top);e.remove();};document.getElementById('ga').appendChild(e);setTimeout(function(){e&&e.parentNode&&e.remove();},spMs+150);}
function burst(x,y,clr){for(var i=0;i<8;i++){var p=document.createElement('div');p.className='pp';var a=(i/8)*Math.PI*2,d=30+Math.random()*25;p.style.cssText='width:7px;height:7px;background:'+clr+';left:'+x+'px;top:'+y+'px;--tx:'+Math.cos(a)*d+'px;--ty:'+Math.sin(a)*d+'px';document.getElementById('ga').appendChild(p);setTimeout(function(){p.remove();},650);}}
function popup(x,y){var el=document.createElement('div');el.className='sp';el.style.left=(x-10)+'px';el.style.top=(y-15)+'px';el.textContent='+1';document.getElementById('ga').appendChild(el);setTimeout(function(){el.remove();},800);}
function end(){on=false;clearInterval(sp);clearInterval(ct);document.querySelectorAll('.tgt').forEach(function(x){x.remove();});var o=document.getElementById('ov');o.style.display='flex';o.innerHTML='<h2>Game Over!</h2><p>Final score: <b style="color:var(--p);font-size:1.3em">'+s+'</b></p><button class="btn" onclick="startGame()">Play Again</button>';}
</script>
</body>
</html>`;
}

function getRichFallback(designConfig, userPrompt) {
  const type = designConfig.type;
  const cat  = designConfig.category;
  switch (type) {
    case 'portfolio':  return buildPortfolioFallback();
    case 'restaurant': return buildRestaurantFallback();
    case 'quiz':       return buildQuizFallback();
    case 'soccer':     return buildSoccerFallback();
    case 'landing':    return buildLandingFallback(userPrompt);
    default:
      if (cat === 'website') return buildFallbackWebsite(designConfig, userPrompt);
      if (cat === 'game')    return buildGenericGameFallback();
      return buildGenericGameFallback();
  }
}

// ── POST /api/builder ─────────────────────────────────────────────────────────
router.post('/', optionalAuth, generationLimiter, async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt is required' });
  }
  if (prompt.trim().length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: `Keep your idea under ${MAX_PROMPT_LENGTH} characters.` });
  }

  // Classify prompt BEFORE try so catch block can serve a fallback
  const designConfig = designEngine.getDesignConfig(prompt.trim());
  const analyticsContext = {
    userId: req.user?.user_id,
    journeyId: normalizeJourneyId(req.get('X-CodeIt-Journey')),
    meta: projectCategory(designConfig.category),
  };
  let generationMode = 'fallback';

  void recordEvent('builder_start', analyticsContext);
  res.once('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      void recordEvent('generation_complete', {
        userId: analyticsContext.userId,
        journeyId: analyticsContext.journeyId,
        meta: generationMode,
      });
    }
  });

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('Builder: ANTHROPIC_API_KEY missing, serving fallback for type:', designConfig.type);
    const fbHtml = getRichFallback(designConfig, prompt.trim());
    const fbTitle = derivePromptTitle(prompt.trim());
    return res.json({ code: fbHtml, html: fbHtml, title: fbTitle, type: designConfig.type, summary: 'Starter ready — AI polish can be added next', isFallback: true, conceptsUsed: [] });
  }

  try {
    // Creative Director — classify prompt, select palette + starter pattern
    // (designConfig already set above)
    const systemPrompt = buildSystemPrompt(designConfig);
    const userMsg = `Build a FULLY WORKING, INTERACTIVE ${designConfig.category} for a kid aged 8–14.

User's idea: "${prompt.trim()}"

CRITICAL REQUIREMENTS:
• This must genuinely work — playable game / usable website / functional tool
• Every button must trigger visible behavior in the DOM
• No placeholder text, no static mockups, no dead buttons
${designConfig.category === 'game' ? '• Game must be startable, playable, scored, and restartable' : designConfig.category === 'website' ? '• Buttons must update visible content, nav must scroll, forms must give feedback' : '• Inputs must connect to logic, results must display immediately'}
• Include viewport meta tag for mobile
• Output the exact <META>...</META><HTML>...</HTML> format specified`;

    const maxTok = 8192;

    let message;
    let attempt1Timedout = false;
    try {
      message = await Promise.race([
        createTrackedMessage('build_initial', {
          model:      'claude-haiku-4-5-20251001',
          max_tokens: maxTok,
          system:     systemPrompt,
          messages:   [{ role: 'user', content: userMsg }],
        }),
        new Promise(function(_, reject) {
          setTimeout(function() { reject(new Error('BUILD_TIMEOUT')); }, 75000);
        }),
      ]);
    } catch (raceErr) {
      if (raceErr.message === 'BUILD_TIMEOUT') {
        attempt1Timedout = true;
      } else {
        throw raceErr;
      }
    }

    if (attempt1Timedout) {
      console.log('Builder: attempt1 timeout, using fallback for type:', designConfig.type);
      const fbHtml = getRichFallback(designConfig, prompt.trim());
      const fbTitle = derivePromptTitle(prompt.trim());
      return res.json({ code: fbHtml, html: fbHtml, title: fbTitle, type: designConfig.type, summary: 'Starter ready — AI polish can be added next', isFallback: true, conceptsUsed: [] });
    }

    let rawText = message.content[0].text;

    // Diagnostic logging — raw AI response stats
    const rawLen = rawText.length;
    const rawHasHtml = /<\/html>/i.test(rawText);
    const rawHasBody = /<\/body>/i.test(rawText);
    const rawHasScript = /<\/script>/i.test(rawText);
    console.log(`Builder diag [${designConfig.type}]: rawLen=${rawLen} </html>=${rawHasHtml} </body>=${rawHasBody} </script>=${rawHasScript}`);
    if (!rawHasHtml) {
      console.log('Builder diag first500:', rawText.slice(0, 500));
      console.log('Builder diag last500:', rawText.slice(-500));
    }

    let parsed  = parseBuilderResponse(rawText);

    // Inject pre-loaded website CSS (AI was told not to copy it)
    if (designConfig.category === 'website' && parsed.html) {
      parsed.html = injectWebsiteCSS(parsed.html);
    }

    // Check for missing script section BEFORE repair (repair adds </script> which hides truncation)
    const missingScript = !/<\/script>/i.test(parsed.html);

    // Try to repair truncated output before quality check
    if (parsed.html && !/<\/html>/i.test(parsed.html)) {
      const repaired = repairHtml(parsed.html);
      if (validateHtml(repaired)) {
        parsed.html = repaired;
        console.log('Builder: truncated HTML repaired on first pass');
      }
    }

    // No </script> on first attempt means JS was cut off or never generated — skip retry, serve rich fallback
    if (missingScript) {
      console.log('Builder: no </script> on attempt1, using rich fallback for type:', designConfig.type);
      const fbHtml = getRichFallback(designConfig, prompt.trim());
      const fbTitle = derivePromptTitle(prompt.trim());
      return res.json({ code: fbHtml, html: fbHtml, title: fbTitle, type: designConfig.type, summary: 'Starter ready — AI polish can be added next', isFallback: true, conceptsUsed: [] });
    }

    // Quality check — retry once with correction prompt if validation fails
    const isValid = validateHtml(parsed.html) && validateInteractivity(parsed.html, designConfig.type);
    const qualityCheck = designEngine.validateOutput(parsed.html);

    if (!isValid || !qualityCheck.valid) {
      const failReasons = [
        !/<script[\s\S]*?>[\s\S]{80,}<\/script>/i.test(parsed.html) ? 'NO working JavaScript code' : '',
        !/addEventListener|onclick/i.test(parsed.html) ? 'NO event listeners (all buttons are dead)' : '',
        !/<\/html>/i.test(parsed.html) ? 'OUTPUT IS TRUNCATED — missing </html>' : '',
        !/<meta[^>]*viewport/i.test(parsed.html) ? 'MISSING viewport meta tag' : '',
        designConfig.category === 'game' && !/score/i.test(parsed.html) ? 'GAME HAS NO SCORE' : '',
        designConfig.category === 'game' && !/restart|startGame|newGame/i.test(parsed.html) ? 'GAME HAS NO RESTART' : '',
        designConfig.category === 'game' && !/screen|showScreen/i.test(parsed.html) ? 'GAME MISSING SCREEN SYSTEM' : '',
        ...(qualityCheck.issues || []),
      ].filter(Boolean);

      const wasTruncated = !/<\/html>/i.test(parsed.html);
      const compactConstraint = wasTruncated && designConfig.category === 'website'
        ? `\n\nCRITICAL: Your output was truncated. This retry MUST be under 12KB total.
- Include ONLY: nav + hero + ONE main section + contact/CTA + footer
- Skip extra sections, testimonials, galleries, long descriptions
- Keep all text SHORT (2–4 words per label)
- Output MUST end with </body></html>` : '';

      const retryMsg = `QUALITY CHECK FAILED — ${failReasons.join(' | ')}

Your previous output is NOT functional. You MUST fix these issues:
${failReasons.map(r => `• ${r}`).join('\n')}

${designConfig.category === 'game' ? `GAME MUST HAVE:
- 3 screens: start-screen (visible first), game-screen, result-screen
- showScreen() function that switches between them
- Working score counter updating live in the DOM
- Restart button that resets score to 0 and returns to start
- setInterval or setTimeout for game loop
- onclick handlers on EVERY button` :
designConfig.category === 'website' ? `WEBSITE MUST HAVE:
- Every button triggers a visible DOM change
- No dead buttons or placeholder CTAs
- Nav links scroll to sections or toggle panels
- Forms show success/error messages` :
`TOOL MUST HAVE:
- All inputs connected to JavaScript logic
- Results display immediately on click
- Enter key works as submit`}
${compactConstraint}
Return the corrected complete HTML in the SAME <META>...</META><HTML>...</HTML> format.`;

      let retryResponse;
      let retryTimedout = false;
      try {
        retryResponse = await Promise.race([
          createTrackedMessage('build_retry', {
            model:      'claude-haiku-4-5-20251001',
            max_tokens: maxTok,
            system:     systemPrompt,
            messages: [
              { role: 'user',      content: userMsg },
              { role: 'assistant', content: rawText },
              { role: 'user',      content: retryMsg },
            ],
          }),
          new Promise(function(_, reject) {
            setTimeout(function() { reject(new Error('BUILD_TIMEOUT')); }, 60000);
          }),
        ]);
      } catch (raceErr2) {
        if (raceErr2.message === 'BUILD_TIMEOUT') {
          retryTimedout = true;
        } else {
          throw raceErr2;
        }
      }

      if (retryTimedout) {
        console.log('Builder: retry timeout, using rich fallback for type:', designConfig.type);
        const fbHtml = getRichFallback(designConfig, prompt.trim());
        const fbTitle = derivePromptTitle(prompt.trim());
        return res.json({ code: fbHtml, html: fbHtml, title: fbTitle, type: designConfig.type, summary: 'Starter ready — AI polish can be added next', isFallback: true, conceptsUsed: [] });
      }

      rawText = retryResponse.content[0].text;
      parsed  = parseBuilderResponse(rawText);

      // Inject CSS and attempt repair on retry output too
      if (designConfig.category === 'website' && parsed.html) {
        parsed.html = injectWebsiteCSS(parsed.html);
      }
      if (parsed.html && !/<\/html>/i.test(parsed.html)) {
        const repaired = repairHtml(parsed.html);
        if (validateHtml(repaired)) {
          parsed.html = repaired;
          console.log('Builder: truncated HTML repaired on retry pass');
        }
      }
    }

    if (!validateHtml(parsed.html) || !validateInteractivity(parsed.html, designConfig.type)) {
      console.log('Builder: validation failed after retry, using rich fallback for type:', designConfig.type);
      const fbHtml = getRichFallback(designConfig, prompt.trim());
      const fbTitle = derivePromptTitle(prompt.trim());
      return res.json({ code: fbHtml, html: fbHtml, title: fbTitle, type: designConfig.type, summary: 'Starter ready — AI polish can be added next', isFallback: true, conceptsUsed: [] });
    }

    // ── Polish pass — visual improvements only, JS preserved ──────────────
    const polished = await runPolishPass(parsed.html, designConfig.type);
    if (polished && validateHtml(polished)) {
      parsed.html = polished;
    }

    const { html, title, summary, conceptsUsed } = parsed;
    // Use design engine type as authoritative fallback
    const type = parsed.type && parsed.type !== 'website' ? parsed.type : designConfig.type;
    generationMode = 'ai';
    res.json({ code: html, html, title, type, summary, conceptsUsed });
  } catch (err) {
    console.error('Builder AI error:', err.message);
    try {
      const fbHtml = getRichFallback(designConfig, prompt.trim());
      const fbTitle = derivePromptTitle(prompt.trim());
      console.log('Builder: serving fallback after error for type:', designConfig.type);
      return res.json({ code: fbHtml, html: fbHtml, title: fbTitle, type: designConfig.type, summary: 'Starter ready — AI polish can be added next', isFallback: true, conceptsUsed: [] });
    } catch (fbErr) {
      console.error('Builder: fallback also failed:', fbErr.message);
      return res.status(502).json({ error: 'AI generation failed. Please try again.' });
    }
  }
});

// ── POST /api/builder/edit ────────────────────────────────────────────────────
// Body: { currentCode, currentTitle, promptHistory, newInstruction }
// AI receives full current code + title + edit history so it modifies, never rewrites.
const EDIT_SYSTEM_PROMPT = `You are an expert frontend developer making targeted edits to existing interactive HTML projects.

You receive: the complete current HTML/CSS/JS · project title · change history · new instruction.

YOUR ROLE: Make ONLY the requested change. Preserve everything else exactly.

━━━ PRESERVE — never remove, rewrite, or accidentally break ━━━
• Gameplay: game loops, requestAnimationFrame, setInterval/setTimeout timers, all game logic
• Score systems: score variables, combo tracking, updateHUD(), score display elements, XP
• Screen system: .screen/.screen.active, showScreen(), showOverlay(), start/game/result states
• All event listeners: every onclick=, addEventListener — every button must keep working
• Existing CSS: :root variables, @keyframes, hover effects, card styles, .fade-up, layout classes
• Animations: particle functions, score-popup code, hud-flash, screen shake, CSS keyframes
• Structural IDs: all element IDs used by JavaScript — never rename or remove them
• Interactions: form logic, tab switching, cart systems, filter logic, modal open/close
• Saved content: all existing text, labels, questions, menu items, product names, copy

━━━ CHANGE ━━━
• Only what the instruction specifies — nothing more, nothing less
• Adding new elements: wire with onclick= or addEventListener, use existing CSS classes
• Changing styles: update rules in <style> block, keep all other rules intact
• Adding features: append to existing JS — never rewrite the whole script block

━━━ RETURN ━━━
1. Full updated HTML document (<!DOCTYPE html> … </html>)
2. Complete <style> block — all original CSS plus your additions/changes
3. Complete <script> block — all original JS plus your additions/changes
4. Never return partial code, diffs, or "// unchanged" placeholders — always the full file

Return EXACTLY this format — nothing else before or after:
<CODE>
[complete updated HTML document]
</CODE>
<SUMMARY>one sentence under 20 words starting with "We" describing what changed</SUMMARY>`;

router.post('/edit', optionalAuth, helperLimiter, async (req, res) => {
  const { currentCode, currentTitle, promptHistory, newInstruction } = req.body;

  if (typeof currentCode !== 'string' || !currentCode.trim()) return res.status(400).json({ error: 'currentCode is required' });
  if (typeof newInstruction !== 'string' || !newInstruction.trim()) return res.status(400).json({ error: 'newInstruction is required' });
  if (currentCode.length > MAX_CODE_LENGTH) return res.status(413).json({ error: 'This project is too large to edit with AI.' });
  if (newInstruction.trim().length > MAX_INSTRUCTION_LENGTH) return res.status(400).json({ error: 'Keep the change request under 2,000 characters.' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI service is not configured.' });
  }

  const titleText   = currentTitle ? `\nProject: "${currentTitle}"\n` : '';
  const historyText = Array.isArray(promptHistory) && promptHistory.length
    ? `\nChange history:\n${promptHistory.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n`
    : '';

  try {
    const message = await createTrackedMessage('edit', {
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system:     EDIT_SYSTEM_PROMPT,
      messages: [
        {
          role:    'user',
          content: `Current code:\n\`\`\`html\n${currentCode.trim()}\n\`\`\`\n${titleText}${historyText}\nNew instruction: ${newInstruction.trim()}`,
        },
      ],
    });

    let rawText = message.content[0].text;
    let { html, summary } = parseBuilderResponse(rawText);

    // Retry once if script/event-listener check fails after edit
    if (validateHtml(html) && !/<script[\s\S]*?>[\s\S]+?<\/script>/i.test(html)) {
      const retry = await createTrackedMessage('edit_retry', {
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 8192,
        system:     EDIT_SYSTEM_PROMPT,
        messages: [
          {
            role:    'user',
            content: `Current code:\n\`\`\`html\n${currentCode.trim()}\n\`\`\`\n${titleText}${historyText}\nNew instruction: ${newInstruction.trim()}`,
          },
          { role: 'assistant', content: rawText },
          { role: 'user',      content: 'Your output removed the JavaScript. Return the COMPLETE updated HTML keeping all existing <script> logic intact, only applying the requested change.' },
        ],
      });
      rawText = retry.content[0].text;
      ({ html, summary } = parseBuilderResponse(rawText));
    }

    if (!validateHtml(html)) {
      return res.status(502).json({ error: 'AI returned an incomplete response. Your project was not changed.' });
    }

    res.json({ code: html, html, summary });
  } catch (err) {
    console.error('Builder edit error:', err.message);
    const msg = err.message || '';
    if (msg.includes('credit balance') || msg.includes('billing') || msg.includes('credit')) {
      return res.status(503).json({ error: 'AI service temporarily unavailable.' });
    }
    res.status(502).json({ error: 'Edit failed. Please try again.' });
  }
});

// ── POST /api/builder/explain ─────────────────────────────────────────────────
router.post('/explain', optionalAuth, helperLimiter, async (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'code is required' });
  }
  if (code.length > MAX_CODE_LENGTH) {
    return res.status(413).json({ error: 'This project is too large to explain all at once.' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI service is not configured.' });
  }

  try {
    const message = await createTrackedMessage('explain', {
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system:     'You explain HTML and CSS code to beginners aged 8–14. Write in plain, friendly language. No jargon. Keep it to 2–4 short sentences. Do not use bullet points or markdown.',
      messages: [
        {
          role:    'user',
          content: `Explain what this code does in simple terms:\n\n${code.trim()}`,
        },
      ],
    });

    res.json({ explanation: message.content[0].text.trim() });
  } catch (err) {
    console.error('Builder explain error:', err.message);
    const msg = err.message || '';
    if (msg.includes('credit balance') || msg.includes('billing') || msg.includes('credit')) {
      return res.status(503).json({ error: 'The AI service is temporarily unavailable — credits have run out.' });
    }
    res.status(502).json({ error: 'Could not generate explanation. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// SAVED PROJECTS — all routes require auth
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/builder/projects — save a new project
router.post('/projects', requireAuth, async (req, res) => {
  const userId = req.user.user_id;
  const { title, prompt, generated_code, project_type } = req.body;

  if (!title || !title.trim())          return res.status(400).json({ error: 'title is required' });
  if (!prompt || !prompt.trim())        return res.status(400).json({ error: 'prompt is required' });
  if (!generated_code || !generated_code.trim()) return res.status(400).json({ error: 'generated_code is required' });

  try {
    const [result] = await pool.query(
      `INSERT INTO ai_projects (user_id, title, prompt, generated_code, project_type)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title.trim(), prompt.trim(), generated_code.trim(), (project_type || 'website').trim()]
    );
    const [rows] = await pool.query('SELECT * FROM ai_projects WHERE id = ?', [result.insertId]);
    void recordEvent('project_save', {
      userId,
      journeyId: normalizeJourneyId(req.get('X-CodeIt-Journey')),
      meta: projectCategory(project_type),
    });
    void recordMilestoneAndNotify({
      userId,
      eventType: 'project_created',
      eventKey: String(result.insertId),
      title: title.trim(),
      detail: `${projectCategory(project_type)} project created`,
    }).catch(error => console.error('Project milestone error:', error.message));
    res.status(201).json({ success: true, project: rows[0] });
  } catch (err) {
    console.error('Save project error:', err.message);
    res.status(500).json({ error: 'Could not save project. Please try again.' });
  }
});

// GET /api/builder/projects — list all projects for current user
router.get('/projects', requireAuth, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [rows] = await pool.query(
      `SELECT id, title, prompt, project_type, created_at, updated_at, public_id, is_public, view_count
       FROM ai_projects WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, projects: rows });
  } catch (err) {
    console.error('List projects error:', err.message);
    res.status(500).json({ error: 'Could not load projects.' });
  }
});

// GET /api/builder/projects/:id — get one project (owner only)
router.get('/projects/:id', requireAuth, async (req, res) => {
  const userId = req.user.user_id;
  const { id }  = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ai_projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found.' });
    res.json({ success: true, project: rows[0] });
  } catch (err) {
    console.error('Get project error:', err.message);
    res.status(500).json({ error: 'Could not load project.' });
  }
});

// PUT /api/builder/projects/:id — update a saved project (owner only)
router.put('/projects/:id', requireAuth, async (req, res) => {
  const userId = req.user.user_id;
  const { id }  = req.params;
  const { title, prompt, generated_code, project_type } = req.body;
  const isFullSave = prompt !== undefined || generated_code !== undefined || project_type !== undefined;

  if (!title || !title.trim()) return res.status(400).json({ error: 'title is required' });
  if (isFullSave && (!prompt || !prompt.trim())) {
    return res.status(400).json({ error: 'prompt is required' });
  }
  if (isFullSave && (!generated_code || !generated_code.trim())) {
    return res.status(400).json({ error: 'generated_code is required' });
  }

  try {
    const [check] = await pool.query(
      'SELECT id FROM ai_projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!check.length) return res.status(404).json({ error: 'Project not found.' });

    if (isFullSave) {
      await pool.query(
        `UPDATE ai_projects
         SET title = ?, prompt = ?, generated_code = ?, project_type = ?, updated_at = NOW()
         WHERE id = ?`,
        [title.trim(), prompt.trim(), generated_code.trim(), (project_type || 'website').trim(), id]
      );
    } else {
      await pool.query('UPDATE ai_projects SET title = ?, updated_at = NOW() WHERE id = ?', [title.trim(), id]);
    }
    const [rows] = await pool.query('SELECT * FROM ai_projects WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true, project: rows[0] });
  } catch (err) {
    console.error('Update project error:', err.message);
    res.status(500).json({ error: 'Could not update project.' });
  }
});

// DELETE /api/builder/projects/:id — delete one project (owner only)
router.delete('/projects/:id', requireAuth, async (req, res) => {
  const userId = req.user.user_id;
  const { id }  = req.params;
  try {
    const [result] = await pool.query(
      'DELETE FROM ai_projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Project not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete project error:', err.message);
    res.status(500).json({ error: 'Could not delete project.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// VERSION HISTORY — all routes require auth + owner check
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/builder/projects/:id/versions — list versions (metadata only)
router.get('/projects/:id/versions', requireAuth, async (req, res) => {
  const userId = req.user.user_id;
  const { id }  = req.params;
  try {
    const [owner] = await pool.query(
      'SELECT id FROM ai_projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!owner.length) return res.status(404).json({ error: 'Project not found.' });
    const [rows] = await pool.query(
      `SELECT id, project_id, version_num, title, label, primary_color, accent_color, created_at
       FROM ai_project_versions WHERE project_id = ? ORDER BY id DESC`,
      [id]
    );
    res.json({ success: true, versions: rows });
  } catch (err) {
    console.error('List versions error:', err.message);
    res.status(500).json({ error: 'Could not load versions.' });
  }
});

// POST /api/builder/projects/:id/versions — save new version
router.post('/projects/:id/versions', requireAuth, async (req, res) => {
  const userId = req.user.user_id;
  const { id }  = req.params;
  const { generated_code, title, label, prompt_history } = req.body;

  if (!generated_code || !generated_code.trim()) {
    return res.status(400).json({ error: 'generated_code is required' });
  }

  try {
    const [owner] = await pool.query(
      'SELECT id FROM ai_projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!owner.length) return res.status(404).json({ error: 'Project not found.' });

    // Extract colors from code
    const primaryMatch = generated_code.match(/--primary:\s*(#[\da-fA-F]{3,8})/);
    const accentMatch  = generated_code.match(/--accent:\s*(#[\da-fA-F]{3,8})/);
    const primaryColor = primaryMatch ? primaryMatch[1] : '#FF7A00';
    const accentColor  = accentMatch  ? accentMatch[1]  : '#A855F7';

    // Auto-increment version_num per project
    const [[{ maxNum }]] = await pool.query(
      'SELECT COALESCE(MAX(version_num), 0) AS maxNum FROM ai_project_versions WHERE project_id = ?',
      [id]
    );
    const versionNum = maxNum + 1;

    const [result] = await pool.query(
      `INSERT INTO ai_project_versions
         (project_id, version_num, title, generated_code, prompt_history, label, primary_color, accent_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        versionNum,
        (title || 'Untitled').trim(),
        generated_code.trim(),
        prompt_history ? JSON.stringify(prompt_history) : null,
        (label || 'Auto save').trim(),
        primaryColor,
        accentColor,
      ]
    );
    // A snapshot is also a save: make it the version that opens next time.
    await pool.query(
      `UPDATE ai_projects
       SET generated_code = ?, title = COALESCE(?, title), updated_at = NOW()
       WHERE id = ?`,
      [generated_code.trim(), title ? title.trim() : null, id]
    );
    res.status(201).json({ success: true, versionId: result.insertId, version_num: versionNum });
  } catch (err) {
    console.error('Save version error:', err.message);
    res.status(500).json({ error: 'Could not save version.' });
  }
});

// GET /api/builder/projects/:id/versions/:vid — get single version (includes generated_code)
router.get('/projects/:id/versions/:vid', requireAuth, async (req, res) => {
  const userId    = req.user.user_id;
  const { id, vid } = req.params;
  try {
    const [owner] = await pool.query(
      'SELECT id FROM ai_projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!owner.length) return res.status(404).json({ error: 'Project not found.' });
    const [rows] = await pool.query(
      'SELECT * FROM ai_project_versions WHERE id = ? AND project_id = ?',
      [vid, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Version not found.' });
    res.json({ success: true, version: rows[0] });
  } catch (err) {
    console.error('Get version error:', err.message);
    res.status(500).json({ error: 'Could not load version.' });
  }
});

// POST /api/builder/projects/:id/versions/:vid/restore — restore version
router.post('/projects/:id/versions/:vid/restore', requireAuth, async (req, res) => {
  const userId    = req.user.user_id;
  const { id, vid } = req.params;
  try {
    const [owner] = await pool.query(
      'SELECT id FROM ai_projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!owner.length) return res.status(404).json({ error: 'Project not found.' });
    const [rows] = await pool.query(
      'SELECT * FROM ai_project_versions WHERE id = ? AND project_id = ?',
      [vid, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Version not found.' });
    const version = rows[0];
    await pool.query(
      'UPDATE ai_projects SET generated_code = ?, updated_at = NOW() WHERE id = ?',
      [version.generated_code, id]
    );
    res.json({
      success:        true,
      code:           version.generated_code,
      title:          version.title,
      prompt_history: version.prompt_history,
    });
  } catch (err) {
    console.error('Restore version error:', err.message);
    res.status(500).json({ error: 'Could not restore version.' });
  }
});

// POST /api/builder/patch — AI patches a single selected element (no full regeneration)
router.post('/patch', optionalAuth, helperLimiter, async (req, res) => {
  const { elementId, tag, elementHtml, instruction } = req.body;

  if (typeof elementHtml !== 'string' || typeof instruction !== 'string' || !elementHtml || !instruction.trim()) {
    return res.status(400).json({ error: 'elementHtml and instruction are required' });
  }
  if (elementHtml.length > MAX_ELEMENT_HTML_LENGTH) {
    return res.status(413).json({ error: 'That selected element is too large to patch.' });
  }
  if (instruction.trim().length > 1000) {
    return res.status(400).json({ error: 'Keep the element change under 1,000 characters.' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI service is not configured.' });
  }

  try {
    const message = await createTrackedMessage('element_patch', {
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     `You are a precise HTML element editor for a kids coding platform.
The user selected one element and wants to change it.
Return ONLY the updated outer HTML for that single element — no markdown, no code fences, no explanation.
Preserve the element's id attribute exactly. Keep existing classes and structure unless the instruction says otherwise.`,
      messages: [
        {
          role:    'user',
          content: `Element tag: ${tag || 'div'}
Element ID: ${elementId || '(none)'}
Current element HTML:
${elementHtml.trim()}

Change instruction: ${instruction.trim()}

Return only the updated element HTML:`,
        },
      ],
    });

    const patchedHtml = message.content[0].text.trim();
    res.json({ success: true, patchedHtml });
  } catch (err) {
    console.error('Builder patch error:', err.message);
    const msg = err.message || '';
    if (msg.includes('credit balance') || msg.includes('billing') || msg.includes('credit')) {
      return res.status(503).json({ error: 'AI service temporarily unavailable.' });
    }
    res.status(502).json({ error: 'AI patch failed. Please try again.' });
  }
});

// POST /api/builder/projects/:id/fork — duplicate project + copy latest version
router.post('/projects/:id/fork', requireAuth, async (req, res) => {
  const userId = req.user.user_id;
  const { id }  = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ai_projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found.' });
    const original = rows[0];

    // Insert fork into ai_projects
    const [newProject] = await pool.query(
      `INSERT INTO ai_projects (user_id, title, prompt, generated_code, project_type)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        `${original.title} (copy)`,
        original.prompt,
        original.generated_code,
        original.project_type,
      ]
    );
    const newId = newProject.insertId;

    // Copy latest version into ai_project_versions for the new project
    const [latestVer] = await pool.query(
      'SELECT * FROM ai_project_versions WHERE project_id = ? ORDER BY id DESC LIMIT 1',
      [id]
    );
    if (latestVer.length) {
      const v = latestVer[0];
      await pool.query(
        `INSERT INTO ai_project_versions
           (project_id, version_num, title, generated_code, prompt_history, label, primary_color, accent_color)
         VALUES (?, 1, ?, ?, ?, 'Forked from original', ?, ?)`,
        [newId, v.title, v.generated_code, v.prompt_history, v.primary_color, v.accent_color]
      );
    }

    const [newRows] = await pool.query('SELECT * FROM ai_projects WHERE id = ?', [newId]);
    res.status(201).json({ success: true, project: newRows[0] });
  } catch (err) {
    console.error('Fork project error:', err.message);
    res.status(500).json({ error: 'Could not fork project.' });
  }
});

// ── AI-generated context-aware missions ──────────────────────────────────────
router.post('/missions', optionalAuth, helperLimiter, async (req, res) => {
  const { html, type, title } = req.body || {};
  if (typeof html !== 'string' || html.length < 100) return res.status(400).json({ error: 'No code provided.' });
  if (html.length > MAX_CODE_LENGTH) return res.status(413).json({ error: 'This project is too large for missions.' });

  const typeHint = (type || 'project').toLowerCase();
  const titleHint = (title || 'this project').slice(0, 80);

  // Extract a condensed snapshot of the code (first 3000 chars) so Haiku can read mechanics
  const codeSample = html.slice(0, 3000);

  const missionPrompt = `You are a creative game designer reviewing student code on a learning platform.

Project title: "${titleHint}"
Project type: ${typeHint}

Here is a sample of the generated code:
\`\`\`html
${codeSample}
\`\`\`

Generate exactly 5 creator missions for this specific project. Each mission should:
- Reference actual mechanics, variables, or elements visible in the code
- Be a concrete, exciting upgrade (not cosmetic, not just "change a color")
- Start with an action verb (Add, Make, Turn, Give, Build, Create, Double, Add a ...)
- Be completable by modifying the existing code
- Feel like an unlock or achievement, not a chore

Bad examples: "change the background color", "make the text bigger", "add a title"
Good examples: "Add a shield powerup that blocks one hit", "Make enemies speed up after each wave", "Add a combo multiplier — 3 hits in a row doubles points"

Return ONLY a JSON array of 5 strings. No explanation, no extra text.
Example format: ["Mission one", "Mission two", "Mission three", "Mission four", "Mission five"]`;

  try {
    const message = await createTrackedMessage('missions', {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: missionPrompt }],
    });

    const raw = message.content[0]?.text?.trim() || '[]';
    // Extract JSON array from response
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (!arrMatch) return res.status(200).json({ missions: [] });

    let missions;
    try {
      missions = JSON.parse(arrMatch[0]);
    } catch (_) {
      return res.status(200).json({ missions: [] });
    }

    if (!Array.isArray(missions)) return res.status(200).json({ missions: [] });

    // Sanitize: strings only, max 120 chars each, cap at 5
    missions = missions
      .filter(m => typeof m === 'string' && m.trim().length > 0)
      .map(m => m.trim().slice(0, 120))
      .slice(0, 5);

    res.json({ missions });
  } catch (err) {
    console.error('AI missions error (non-fatal):', err.message);
    res.status(200).json({ missions: [] });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC SHARING — publish, view, remix
// ═════════════════════════════════════════════════════════════════════════════

const crypto = require('crypto');

function generatePublicId() {
  return crypto.randomBytes(6).toString('hex'); // 12-char hex
}

// POST /api/builder/projects/:id/publish — make project publicly accessible
router.post('/projects/:id/publish', requireAuth, async (req, res) => {
  const userId = req.user.user_id;
  const { id }  = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT id, title, public_id, is_public, project_type FROM ai_projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found.' });

    const wasPublic = Boolean(rows[0].is_public);
    let { public_id } = rows[0];
    if (!public_id) {
      // Generate unique public_id with collision retry
      let attempts = 0;
      while (attempts < 5) {
        const candidate = generatePublicId();
        const [existing] = await pool.query(
          'SELECT id FROM ai_projects WHERE public_id = ?', [candidate]
        );
        if (!existing.length) { public_id = candidate; break; }
        attempts++;
      }
      if (!public_id) return res.status(500).json({ error: 'Could not generate share ID.' });
    }

    // Never expose a child's account name on a public project.
    const creatorName = 'CodeIt creator';
    await pool.query(
      'UPDATE ai_projects SET is_public = 1, public_id = ?, creator_name = ? WHERE id = ?',
      [public_id, creatorName, id]
    );

    if (!wasPublic) {
      void recordEvent('project_publish', {
        userId,
        journeyId: normalizeJourneyId(req.get('X-CodeIt-Journey')),
        meta: projectCategory(rows[0].project_type),
      });
      void recordMilestoneAndNotify({
        userId,
        eventType: 'project_published',
        eventKey: String(id),
        title: rows[0].title || 'Published CodeIt project',
        detail: 'Published and ready to share',
        targetUrl: `https://codeitlearn.com/project/${public_id}`,
      }).catch(error => console.error('Publish milestone error:', error.message));
    }

    const publicUrl = `https://codeitlearn.com/project/${public_id}`;
    res.json({ success: true, public_id, public_url: publicUrl });
  } catch (err) {
    console.error('Publish project error:', err.message);
    res.status(500).json({ error: 'Could not publish project.' });
  }
});

// POST /api/builder/projects/:id/unpublish — make project private again
router.post('/projects/:id/unpublish', requireAuth, async (req, res) => {
  const userId = req.user.user_id;
  const { id }  = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT id FROM ai_projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found.' });

    await pool.query('UPDATE ai_projects SET is_public = 0 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Unpublish project error:', err.message);
    res.status(500).json({ error: 'Could not unpublish project.' });
  }
});

// GET /api/builder/pub/:publicId — fetch public project (no auth)
router.get('/pub/:publicId', async (req, res) => {
  const { publicId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT title, generated_code, project_type, creator_name, created_at, view_count
       FROM ai_projects
       WHERE public_id = ? AND is_public = 1`,
      [publicId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found or not public.' });
    res.json({ success: true, project: rows[0] });
  } catch (err) {
    console.error('Get public project error:', err.message);
    res.status(500).json({ error: 'Could not load project.' });
  }
});

// POST /api/builder/pub/:publicId/view — increment view count (no auth, fire-and-forget)
router.post('/pub/:publicId/view', async (req, res) => {
  const { publicId } = req.params;
  try {
    await pool.query(
      'UPDATE ai_projects SET view_count = view_count + 1 WHERE public_id = ? AND is_public = 1',
      [publicId]
    );
    res.json({ success: true });
  } catch (_) {
    res.json({ success: true }); // never fail a view ping
  }
});

// POST /api/builder/pub/:publicId/remix — copy project into current user's projects
router.post('/pub/:publicId/remix', requireAuth, async (req, res) => {
  const userId     = req.user.user_id;
  const { publicId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT title, prompt, generated_code, project_type
       FROM ai_projects
       WHERE public_id = ? AND is_public = 1`,
      [publicId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found or not public.' });
    const original = rows[0];

    const [result] = await pool.query(
      `INSERT INTO ai_projects (user_id, title, prompt, generated_code, project_type, creator_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        `${original.title} (remix)`,
        original.prompt || '',
        original.generated_code,
        original.project_type,
        req.user.name || null,
      ]
    );
    const projectId = result.insertId;

    // Copy a version snapshot
    await pool.query(
      `INSERT INTO ai_project_versions (project_id, version_num, title, generated_code, label, primary_color, accent_color)
       VALUES (?, 1, ?, ?, 'Remixed', '#FF7A00', '#A855F7')`,
      [projectId, original.title, original.generated_code]
    ).catch(() => {});

    // Increment remix_count on original
    await pool.query(
      'UPDATE ai_projects SET remix_count = remix_count + 1 WHERE public_id = ? AND is_public = 1',
      [publicId]
    ).catch(() => {});

    res.status(201).json({ success: true, projectId });
  } catch (err) {
    console.error('Remix project error:', err.message);
    res.status(500).json({ error: 'Could not remix project.' });
  }
});

module.exports = router;
