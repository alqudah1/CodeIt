import { useState, useRef, useEffect, useMemo, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import { API_BASE_URL } from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import { useSEO } from '../../hooks/useSEO';
import './Builder.css';

const QUICK_STARTS = [
  { label: 'Click-the-target game', category: 'Game',    prompt: 'a fun click-the-target game where colored circles appear on screen and disappear if you miss them, with a score counter, timer countdown from 30 seconds, and a Game Over screen showing your final score' },
  { label: 'Quiz about animals',    category: 'Quiz',    prompt: 'a 5-question multiple choice quiz about animals with fun facts shown after each answer, a score tracker, and a colourful results screen at the end' },
  { label: 'Space quiz',            category: 'Quiz',    prompt: 'a 5-question quiz about space and planets with illustrated answers, fun facts after each question, and a final score screen' },
  { label: 'Soccer fan page',       category: 'Website', prompt: 'a colorful soccer fan website with a header, my favorite team section, top players list with stats, and latest scores — make it look exciting with team colors' },
  { label: 'Random story maker',    category: 'Fun',     prompt: 'a random story generator with a big colourful button — each click picks a random hero, setting, and mission and shows a short funny story paragraph, with a new story button' },
  { label: 'My about-me page',      category: 'Website', prompt: 'a personal about-me webpage with a big greeting, my hobbies section with icons, my favorite things list, and a friendly contact section — make it bright and fun' },
];

const MODIFIERS = [
  'Add score',
  'Add timer',
  'Make it harder',
  'Change colors',
  'Add animation',
  'Add more questions',
  'Make it more fun',
];

const BUILD_STEPS = [
  'Building your idea',
  'Writing the structure',
  'Adding interaction',
  'Connecting everything',
];

const LESSON_CONCEPTS = [
  { id: 2,  title: 'Variables',     hint: 'Store scores, names, and data'         },
  { id: 3,  title: 'Strings',       hint: 'Work with text and messages'            },
  { id: 4,  title: 'If Statements', hint: 'Decide what happens next'               },
  { id: 5,  title: 'For Loops',     hint: 'Repeat actions automatically'           },
  { id: 7,  title: 'Lists',         hint: 'Store and show multiple items'          },
  { id: 9,  title: 'Functions',     hint: 'Organize actions into reusable blocks'  },
];

function detectLessonIds(prompt) {
  const p = (prompt || '').toLowerCase();
  if (/game|click|target|score|timer|play|hit|miss/.test(p)) return [2, 4, 5, 9];
  if (/quiz|question|answer|multiple|choice/.test(p))        return [4, 7, 9];
  if (/story|random|generator|maker/.test(p))                return [2, 3, 7];
  if (/website|page|fan|about|profile|portfolio/.test(p))    return [3, 4];
  return [2, 4, 9];
}

function detectProjectType(prompt) {
  const p = (prompt || '').toLowerCase();
  if (/quiz|trivia|question|answer|knowledge|multiple.?choice/.test(p)) return 'quiz';
  if (/game|click|catch|dodge|jump|score|play|hit|target|race|puzzle|tap/.test(p)) return 'game';
  if (/calc|tool|convert|measure|track|counter/.test(p)) return 'tool';
  if (/story|random|generat|pick|maker/.test(p)) return 'story';
  return 'website';
}

// ── Instant starter templates shown while AI generates ────────────
const STARTER_TEMPLATES = {
  game: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--orange:#FF7A00;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);min-height:100vh;padding:20px;display:flex;flex-direction:column;align-items:center;gap:12px}h1{font-size:1.9rem;font-weight:800;color:#1F2937}.hud{display:flex;gap:22px;font-size:1.1rem;font-weight:700;color:#1F2937}.hud b{color:var(--orange)}#ga{position:relative;width:360px;height:320px;background:#fff;border-radius:16px;border:2px solid rgba(255,122,0,.18);box-shadow:0 8px 24px rgba(0,0,0,.08);overflow:hidden}.tgt{position:absolute;width:52px;height:52px;background:var(--orange);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.4rem;user-select:none;transition:transform .1s}.tgt:hover{transform:scale(1.12)}.ov{position:absolute;inset:0;background:rgba(255,246,237,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:10}.ov h2{font-size:1.5rem;font-weight:800;color:#1F2937}.ov p{color:#6B7280;font-size:.95rem}button{background:var(--orange);color:#fff;border:none;border-radius:var(--r);padding:13px 30px;font-size:1.05rem;font-weight:700;cursor:pointer;transition:opacity .15s}button:hover{opacity:.88}</style></head><body><h1>Click Game</h1><div class="hud"><span>Score: <b id="sc">0</b></span><span>Time: <b id="ti">30</b>s</span></div><div id="ga"><div class="ov" id="ov"><h2>Ready to Play?</h2><p>Click the stars before they disappear!</p><button onclick="startGame()">Start Game</button></div></div><script>let s=0,t=30,on=false,sp,ct;function startGame(){s=0;t=30;on=true;document.getElementById('sc').textContent=0;document.getElementById('ti').textContent=30;document.getElementById('ov').style.display='none';document.querySelectorAll('.tgt').forEach(x=>x.remove());sp=setInterval(spawn,860);ct=setInterval(()=>{t--;document.getElementById('ti').textContent=t;if(t<=0)end();},1000);}function spawn(){if(!on)return;const e=document.createElement('div');e.className='tgt';e.textContent='⭐';e.style.left=Math.random()*290+'px';e.style.top=Math.random()*260+'px';e.onclick=()=>{if(!on)return;s++;document.getElementById('sc').textContent=s;e.remove();};document.getElementById('ga').appendChild(e);setTimeout(()=>e&&e.remove(),1100);}function end(){on=false;clearInterval(sp);clearInterval(ct);document.querySelectorAll('.tgt').forEach(x=>x.remove());const o=document.getElementById('ov');o.style.display='flex';o.innerHTML='<h2>Game Over!</h2><p>Score: <b style="color:#FF7A00">'+s+'</b> — great job!</p><button onclick="startGame()">Play Again</button>';}<\/script></body></html>`,

  quiz: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--orange:#FF7A00;--mint:#10B981;--coral:#FF6B6B;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:#fff;border-radius:20px;padding:28px;max-width:460px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.08)}h1{font-size:1.7rem;font-weight:800;color:#1F2937;margin-bottom:6px}.sub{color:#6B7280;font-size:.9rem;margin-bottom:20px}#quiz-screen{display:none}#result-screen{display:none;text-align:center}.qnum{font-size:.78rem;font-weight:800;color:var(--orange);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}.qtext{font-size:1.05rem;font-weight:700;color:#1F2937;margin-bottom:14px;line-height:1.4}.opts{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}.opt{padding:11px 14px;background:#f9fafb;border:2px solid #E5E7EB;border-radius:10px;font-size:.95rem;font-weight:600;cursor:pointer;text-align:left;font-family:inherit;transition:all .15s}.opt:hover:not(:disabled){border-color:var(--orange);background:rgba(255,122,0,.06)}.fb{font-weight:700;font-size:.9rem;min-height:1.4rem;margin-bottom:8px}.fb.ok{color:var(--mint)}.fb.no{color:var(--coral)}.btn{background:var(--orange);color:#fff;border:none;border-radius:var(--r);padding:12px 24px;font-size:1rem;font-weight:700;cursor:pointer;width:100%;font-family:inherit}.btn:hover{opacity:.9}#nxt{display:none}.bigs{font-size:2.8rem;font-weight:800;color:var(--orange);margin:10px 0}</style></head><body><div class="card"><div id="start-screen"><h1>Quiz Time!</h1><p class="sub">3 sample questions — can you get them all right?</p><button class="btn" onclick="startQuiz()">Start Quiz</button></div><div id="quiz-screen"><div class="qnum" id="qnum"></div><div class="qtext" id="qtext"></div><div class="opts" id="opts"></div><div class="fb" id="fb"></div><button class="btn" id="nxt" onclick="nextQ()">Next Question</button></div><div id="result-screen"><h1>Done!</h1><div class="bigs" id="fscore">0 / 3</div><p class="sub">AI is customizing this quiz for your topic...</p><button class="btn" onclick="startQuiz()">Play Again</button></div></div><script>const qs=[{q:'What is 4 × 6?',a:['20','24','26','18'],c:1},{q:'Which is the largest ocean?',a:['Atlantic','Indian','Arctic','Pacific'],c:3},{q:'How many sides does a hexagon have?',a:['5','7','6','8'],c:2}];let cur=0,sc=0;function startQuiz(){cur=0;sc=0;document.getElementById('start-screen').style.display='none';document.getElementById('result-screen').style.display='none';document.getElementById('quiz-screen').style.display='block';showQ();}function showQ(){const q=qs[cur];document.getElementById('qnum').textContent='Question '+(cur+1)+' / '+qs.length;document.getElementById('qtext').textContent=q.q;document.getElementById('fb').textContent='';document.getElementById('fb').className='fb';document.getElementById('nxt').style.display='none';const opts=document.getElementById('opts');opts.innerHTML='';q.a.forEach((a,i)=>{const b=document.createElement('button');b.className='opt';b.textContent=a;b.onclick=()=>check(i);opts.appendChild(b);});}function check(i){const c=qs[cur].c;document.querySelectorAll('.opt').forEach((b,j)=>{b.disabled=true;if(j===c)b.style.background='rgba(16,185,129,.15)';if(j===i&&j!==c)b.style.background='rgba(255,107,107,.15)';});const fb=document.getElementById('fb');if(i===c){sc++;fb.textContent='Correct!';fb.className='fb ok';}else{fb.textContent='Wrong — see green for the answer.';fb.className='fb no';}document.getElementById('nxt').style.display='block';}function nextQ(){cur++;if(cur<qs.length)showQ();else done();}function done(){document.getElementById('quiz-screen').style.display='none';document.getElementById('result-screen').style.display='block';document.getElementById('fscore').textContent=sc+' / '+qs.length;}<\/script></body></html>`,

  website: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--orange:#FF7A00;--mint:#10B981;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);color:#1F2937}nav{display:flex;gap:10px;padding:.8rem 1.4rem;background:#fff;border-bottom:1px solid #F3F4F6;position:sticky;top:0;z-index:10}nav a{color:#1F2937;font-weight:700;text-decoration:none;padding:6px 10px;border-radius:8px;font-size:.9rem;cursor:pointer;transition:background .15s}nav a:hover{background:rgba(255,122,0,.1);color:var(--orange)}.hero{padding:3.5rem 1.5rem;text-align:center;background:linear-gradient(135deg,rgba(255,122,0,.06),rgba(61,220,151,.05))}.hero h1{font-size:2.2rem;font-weight:800;margin-bottom:8px}.hero p{color:#6B7280;margin-bottom:20px;font-size:1rem}.btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.btn{display:inline-block;background:var(--orange);color:#fff;border:none;border-radius:var(--r);padding:12px 24px;font-size:.95rem;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .15s,transform .1s}.btn:hover{opacity:.9;transform:translateY(-1px)}.btn-g{background:transparent;color:var(--orange);border:2px solid var(--orange)}section{padding:2.5rem 1.5rem;max-width:640px;margin:0 auto}h2{font-size:1.4rem;font-weight:800;margin-bottom:12px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}.card{background:#fff;border-radius:14px;padding:16px;box-shadow:0 4px 14px rgba(0,0,0,.07)}.card h3{font-weight:700;margin-bottom:4px;font-size:.95rem}.card p{font-size:.82rem;color:#6B7280}.form-row{display:flex;gap:8px;margin-top:12px}.form-row input{flex:1;padding:10px 12px;border:2px solid #E5E7EB;border-radius:10px;font-family:inherit;font-size:.9rem;outline:none}.form-row input:focus{border-color:var(--orange)}#msg{font-weight:700;color:var(--mint);margin-top:8px;min-height:1.2rem;font-size:.9rem}</style></head><body><nav><a onclick="sv('#about')">About</a><a onclick="sv('#features')">Features</a><a onclick="sv('#contact')">Contact</a></nav><div class="hero"><h1>Welcome!</h1><p>Your website is ready — explore it now!</p><div class="btns"><button class="btn" onclick="sv('#features')">Explore</button><button class="btn btn-g" onclick="alert('Hello! Your site is being customized by AI.')">Say Hello</button></div></div><section id="about"><h2>About</h2><p style="color:#6B7280;line-height:1.6">Click buttons and nav links — everything is interactive and ready for AI to customize.</p></section><section id="features"><h2>Features</h2><div class="grid"><div class="card"><h3>Interactive</h3><p>Every button does something</p></div><div class="card"><h3>Colorful</h3><p>Bright and fun design</p></div><div class="card"><h3>AI Built</h3><p>Generated in seconds</p></div></div></section><section id="contact"><h2>Contact</h2><div class="form-row"><input id="ni" placeholder="Your message..."><button class="btn" onclick="send()">Send</button></div><p id="msg"></p></section><script>function sv(id){document.querySelector(id).scrollIntoView({behavior:'smooth'});}function send(){const v=document.getElementById('ni').value.trim();document.getElementById('msg').textContent=v?'Thanks! Got your message: "'+v+'"':'Please type a message first.';}<\/script></body></html>`,

  tool: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--orange:#FF7A00;--coral:#FF6B6B;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:#fff;border-radius:20px;padding:30px;max-width:380px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.08)}h1{font-size:1.6rem;font-weight:800;color:#1F2937;margin-bottom:6px}p{color:#6B7280;font-size:.88rem;margin-bottom:18px}label{display:block;font-size:.83rem;font-weight:700;color:#374151;margin-bottom:5px}input,select{width:100%;padding:11px 13px;border:2px solid #E5E7EB;border-radius:10px;font-size:.95rem;font-family:inherit;outline:none;margin-bottom:12px;transition:border-color .15s}input:focus,select:focus{border-color:var(--orange)}button{background:var(--orange);color:#fff;border:none;border-radius:var(--r);padding:13px;font-size:1rem;font-weight:700;cursor:pointer;width:100%;font-family:inherit}button:hover{opacity:.9}.res{margin-top:16px;padding:16px;background:rgba(255,122,0,.07);border:2px solid rgba(255,122,0,.18);border-radius:12px;min-height:56px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px}.rv{font-size:2rem;font-weight:800;color:var(--orange)}.rl{font-size:.8rem;color:#6B7280;text-align:center}</style></head><body><div class="card"><h1>Calculator</h1><p>Enter numbers and click Calculate</p><label>First number</label><input id="a" type="number" placeholder="e.g. 25"><label>Second number</label><input id="b" type="number" placeholder="e.g. 10"><select id="op"><option value="+">Add (+)</option><option value="-">Subtract (−)</option><option value="*">Multiply (×)</option><option value="/">Divide (÷)</option></select><button onclick="calc()">Calculate</button><div class="res"><div class="rv" id="rv">—</div><div class="rl" id="rl">Enter numbers above</div></div></div><script>function calc(){const a=parseFloat(document.getElementById('a').value),b=parseFloat(document.getElementById('b').value),op=document.getElementById('op').value;if(isNaN(a)||isNaN(b)){document.getElementById('rv').textContent='?';document.getElementById('rv').style.color='#FF6B6B';document.getElementById('rl').textContent='Enter valid numbers';return;}let r,l;if(op==='+'){r=a+b;l=a+' + '+b+' = '+r;}else if(op==='-'){r=a-b;l=a+' − '+b+' = '+r;}else if(op==='*'){r=a*b;l=a+' × '+b+' = '+r;}else{if(b===0){document.getElementById('rv').textContent='∞';document.getElementById('rv').style.color='#FF6B6B';document.getElementById('rl').textContent="Can't divide by zero!";return;}r=Math.round(a/b*100)/100;l=a+' ÷ '+b+' = '+r;}document.getElementById('rv').textContent=r;document.getElementById('rv').style.color='#FF7A00';document.getElementById('rl').textContent=l;}document.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')calc();}));<\/script></body></html>`,

  story: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--orange:#FF7A00;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:#fff;border-radius:20px;padding:32px;max-width:440px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.08);text-align:center}h1{font-size:1.8rem;font-weight:800;color:#1F2937;margin-bottom:6px}p.sub{color:#6B7280;font-size:.9rem;margin-bottom:20px}button{background:var(--orange);color:#fff;border:none;border-radius:var(--r);padding:14px 28px;font-size:1.1rem;font-weight:700;cursor:pointer;font-family:inherit;transition:transform .12s,opacity .15s;margin-bottom:18px}button:hover{opacity:.9;transform:scale(1.04)}button:active{transform:scale(.97)}.sb{background:rgba(255,122,0,.05);border:2px solid rgba(255,122,0,.18);border-radius:14px;padding:20px;min-height:80px;display:flex;align-items:center;justify-content:center}#st{font-size:1rem;line-height:1.6;color:#1F2937;font-weight:600;transition:opacity .25s}</style></head><body><div class="card"><h1>Story Generator</h1><p class="sub">Click the button for a random adventure!</p><button onclick="gen()">Generate Story</button><div class="sb"><p id="st">Press the button to begin your story...</p></div></div><script>const H=['A brave knight','A clever fox','A tiny robot','A singing explorer','A fearless pirate'];const P=['in a magical forest','on the moon','in a giant pizza shop','underwater','in a flying castle'];const M=['found the golden trophy','baked the world\'s best pie','defeated the robot king','discovered a hidden map','made everyone laugh'];function gen(){const s=document.getElementById('st');s.style.opacity=0;setTimeout(()=>{s.textContent=H[~~(Math.random()*H.length)]+' went '+P[~~(Math.random()*P.length)]+' and '+M[~~(Math.random()*M.length)]+'!';s.style.opacity=1;},220);}<\/script></body></html>`,
};

const EDIT_STEPS = [
  'Reading your instruction',
  'Updating the code',
  'Keeping everything intact',
  'Almost done',
];

const CONFETTI_COLORS = ['#FF7A00', '#A855F7', '#10B981', '#60A5FA', '#F59E0B'];

function isValidHtml(str) {
  return (
    typeof str === 'string' &&
    str.trim().length > 200 &&
    /<[a-z]/i.test(str) &&
    /<body/i.test(str) &&
    /<style/i.test(str)
  );
}

function deriveProjectName(rawPrompt) {
  const clean = rawPrompt.trim().replace(/^(build |make |create |generate |a |an |the )+/gi, '');
  const words = clean.split(/\s+/).slice(0, 6);
  if (!words.length) return rawPrompt;
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '');
}


export default function Builder() {
  useSEO({
    title:       'AI Website Builder for Kids — Build Websites with AI | CodeIt',
    description: 'Describe any idea in plain words and watch CodeIt build a real working website instantly. A beginner-friendly AI website builder for kids, students, and curious learners. No coding experience needed.',
    canonical:   '/builder',
  });

  const { user, token } = useContext(AuthContext);
  const { awardXP }     = useCharacter();
  const navigate        = useNavigate();
  const location        = useLocation();

  // ── Build state ────────────────────────────────────────────────────────────
  const [prompt, setPrompt]             = useState('');
  const [builtPrompt, setBuiltPrompt]   = useState('');
  const [code, setCode]                 = useState('');
  const [builtSummary, setBuiltSummary] = useState('');
  const [aiTitle, setAiTitle]           = useState('');
  const [projectType, setProjectType]   = useState('website');
  const [conceptsUsed, setConceptsUsed] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [buildStep, setBuildStep]       = useState(0);
  const [error, setError]               = useState('');
  const [buildKey, setBuildKey]         = useState(0);

  // ── AI memory ──────────────────────────────────────────────────────────────
  const [promptHistory, setPromptHistory] = useState([]);
  const [previousCode, setPreviousCode]   = useState('');

  // ── Play mode ──────────────────────────────────────────────────────────────
  const [isPlayMode, setIsPlayMode] = useState(false);

  // ── Edit-with-AI panel ─────────────────────────────────────────────────────
  const [showEditPanel, setShowEditPanel]     = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [editing, setEditing]                 = useState(false);
  const [editStep, setEditStep]               = useState(0);
  const [editError, setEditError]             = useState('');

  // ── Explain ────────────────────────────────────────────────────────────────
  const [explanation, setExplanation]   = useState('');
  const [explaining, setExplaining]     = useState(false);
  const [explainError, setExplainError] = useState('');

  // ── Save state ─────────────────────────────────────────────────────────────
  const [isSaved, setIsSaved]               = useState(false);
  const [saveStatus, setSaveStatus]         = useState(null);
  const [saveError, setSaveError]           = useState('');
  const [unsavedWarning, setUnsavedWarning] = useState(false);

  // ── Saved projects ─────────────────────────────────────────────────────────
  const [savedProjects, setSavedProjects]     = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const promptRef  = useRef(null);
  const editRef    = useRef(null);

  // ── Read URL params on mount: ?prompt= (from lessons), ?type= (from lobby), ?view=projects ──
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pre  = params.get('prompt');
    const type = params.get('type');
    const view = params.get('view');
    if (pre)                setPrompt(pre);
    if (type === 'game')    setProjectType('game');
    if (type === 'website') setProjectType('website');
    if (view === 'projects') {
      setTimeout(() => {
        document.querySelector('.bldr-projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 700);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Confetti (only on fresh builds, not edits) ─────────────────────────────
  const confettiParticles = useMemo(() => {
    if (buildKey === 0) return [];
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      angle: i * 20 + (i % 2 === 0 ? 7 : -7),
      dist:  48 + (i % 5) * 10,
      color: CONFETTI_COLORS[i % 5],
      delay: (i % 4) * 0.05,
      isCircle: i % 3 === 0,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildKey]);

  // ── Interactivity badges (derived from generated code) ────────────────────
  const interactivityBadges = useMemo(() => {
    if (!code) return [];
    const badges = [];
    const hasScript   = /<script/i.test(code);
    const hasListener = /addEventListener|\.onclick\s*=|\bonclick\s*=|onchange\s*=/i.test(code);
    const isGame      = /game/i.test(projectType);
    const hasGameLogic = /score|restart|start\s*game|gameActive|setInterval/i.test(code);
    if (isGame && hasScript && hasGameLogic) {
      badges.push({ label: 'Playable project', cls: 'play' });
      badges.push({ label: 'Game controls ready', cls: 'game' });
    } else if (hasScript && hasListener) {
      badges.push({ label: 'Buttons work', cls: 'buttons' });
    }
    return badges;
  }, [code, projectType]);

  // ── Loading step advancement ───────────────────────────────────────────────
  useEffect(() => {
    if (!loading) { setBuildStep(0); return; }
    setBuildStep(0);
    const timers = [900, 1900, 3100].map((delay, i) =>
      setTimeout(() => setBuildStep(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  useEffect(() => {
    if (!editing) { setEditStep(0); return; }
    setEditStep(0);
    const timers = [700, 1600, 2600].map((delay, i) =>
      setTimeout(() => setEditStep(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [editing]);

  // ── Auto-focus edit textarea when panel opens ──────────────────────────────
  useEffect(() => {
    if (showEditPanel) editRef.current?.focus();
  }, [showEditPanel]);

  // ── Load saved projects when user logs in ──────────────────────────────────
  useEffect(() => {
    if (!user || !token) { setSavedProjects([]); return; }
    setProjectsLoading(true);
    fetch(`${API_BASE_URL}/api/builder/projects`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setSavedProjects(d.projects); })
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, [user, token]);

  // ── Fresh build ────────────────────────────────────────────────────────────
  const callBuilder = async (text) => {
    setLoading(true);
    setError('');
    setCode('');
    setBuiltSummary('');
    setAiTitle('');
    setProjectType('website');
    setConceptsUsed([]);
    setExplanation('');
    setIsSaved(false);
    setSaveStatus(null);
    setUnsavedWarning(false);
    setPromptHistory([]);
    setPreviousCode('');
    setShowEditPanel(false);
    setEditError('');
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      const html = data.html || data.code;
      if (!isValidHtml(html)) throw new Error('The AI returned an incomplete page. Please try again.');
      setCode(html);
      setBuiltPrompt(text);
      setBuiltSummary(data.summary || '');
      setAiTitle(data.title || '');
      setProjectType(data.type || 'website');
      setConceptsUsed(Array.isArray(data.conceptsUsed) ? data.conceptsUsed : []);
      setPromptHistory([text]);
      setBuildKey(k => k + 1);
      setShowEditPanel(true);
      awardXP(20);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Edit with AI — modifies existing code, never starts from scratch ───────
  const applyEdit = async (instruction) => {
    if (!code || !instruction.trim() || editing) return;
    setEditing(true);
    setEditError('');
    const snapshot = code; // save fallback before we touch anything
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/edit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          currentCode:    code,
          currentTitle:   aiTitle || projectName,
          promptHistory,
          newInstruction: instruction.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Edit failed');
      const html = data.html || data.code;
      if (!isValidHtml(html)) throw new Error('AI returned invalid code — your project was not changed.');
      // Only touch state after confirmed success
      setPreviousCode(snapshot);
      setCode(html);
      setBuiltSummary(data.summary || builtSummary);
      setPromptHistory(prev => [...prev, instruction.trim()]);
      setIsSaved(false);
      setSaveStatus(null);
      setEditInstruction('');
      awardXP(10);
      // Don't rebuildKey — keeps iframe alive; srcdoc update re-renders the content
    } catch (err) {
      // Code unchanged — snapshot was never committed
      setEditError(err.message);
    } finally {
      setEditing(false);
    }
  };

  const handleUndoEdit = () => {
    if (!previousCode) return;
    setCode(previousCode);
    setPreviousCode('');
    setPromptHistory(prev => prev.slice(0, -1));
    setBuiltSummary('');
    setIsSaved(false);
    setSaveStatus(null);
    setEditError('');
  };

  // ── Modifiers: use edit endpoint when code exists (incremental) ───────────
  const handleModifier = (mod) => {
    if (code) {
      applyEdit(mod);
    } else {
      const updated = `${prompt.trim()} — ${mod}`;
      setPrompt(updated);
      callBuilder(updated);
    }
  };

  const handleBuild = () => {
    if (!prompt.trim()) return;
    callBuilder(prompt.trim());
  };

  const handleQuickStart = (qs) => {
    setPrompt(qs.prompt);
    callBuilder(qs.prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleBuild();
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) applyEdit(editInstruction);
  };

  // ── Explain ────────────────────────────────────────────────────────────────
  const handleExplain = async () => {
    if (!code) return;
    setExplaining(true);
    setExplainError('');
    setExplanation('');
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/explain`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setExplanation(data.explanation);
    } catch (err) {
      setExplainError(err.message);
    } finally {
      setExplaining(false);
    }
  };

  // ── Save project ───────────────────────────────────────────────────────────
  const handleSaveProject = async () => {
    if (!code) return;
    if (!user || !token) { navigate('/login'); return; }
    setSaveStatus('saving');
    setSaveError('');
    const title = (builtPrompt ? deriveProjectName(builtPrompt) : '') || 'My Project';
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/projects`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ title, prompt: builtPrompt, generated_code: code, project_type: projectType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save project.');
      setSavedProjects(prev => [data.project, ...prev]);
      setIsSaved(true);
      setSaveStatus('saved');
      awardXP(15);
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err.message);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // ── Load saved project ─────────────────────────────────────────────────────
  const handleLoadProject = async (project) => {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/builder/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      const p = data.project;
      setPrompt(p.prompt);
      setCode(p.generated_code);
      setBuiltPrompt(p.prompt);
      setBuiltSummary('');
      setExplanation('');
      setPromptHistory([p.prompt]);
      setPreviousCode('');
      setIsSaved(true);
      setSaveStatus(null);
      setUnsavedWarning(false);
      setShowEditPanel(false);
      setEditError('');
      setBuildKey(k => k + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setPrompt(project.prompt);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Delete saved project ───────────────────────────────────────────────────
  const handleDeleteProject = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/builder/projects/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedProjects(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  // ── New build ──────────────────────────────────────────────────────────────
  const handleNewBuild = () => {
    if (code && !isSaved) { setUnsavedWarning(true); return; }
    clearEditor();
  };

  const clearEditor = () => {
    setPrompt('');
    setCode('');
    setBuiltPrompt('');
    setBuiltSummary('');
    setAiTitle('');
    setProjectType('website');
    setConceptsUsed([]);
    setIsPlayMode(false);
    setExplanation('');
    setError('');
    setIsSaved(false);
    setSaveStatus(null);
    setUnsavedWarning(false);
    setPromptHistory([]);
    setPreviousCode('');
    setShowEditPanel(false);
    setEditInstruction('');
    setEditError('');
    promptRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasResult   = !loading && code;
  const hasError    = !loading && error;
  const projectName = aiTitle || (builtPrompt ? deriveProjectName(builtPrompt) : '');
  const editCount   = promptHistory.length > 1 ? promptHistory.length - 1 : 0;
  const lessonChips = builtPrompt
    ? LESSON_CONCEPTS.filter(l => detectLessonIds(builtPrompt).includes(l.id))
    : [];

  return (
    <>
      <Header />
      <div className="bldr-page">

        {/* ════════════════════════════════════════
            HERO
        ════════════════════════════════════════ */}
        <section className="bldr-hero">
          <div className="bldr-hero__badge">AI Builder</div>
          <h1 className="bldr-hero__title">
            Type an idea.<br />
            <span className="bldr-hero__title-accent">AI builds it instantly.</span>
          </h1>
          <p className="bldr-hero__sub">
            Describe anything — a game, a quiz, a website about your favourite topic.
            Watch it appear live in seconds. Edit it with a single sentence. Save and share.
          </p>
        </section>

        {/* ════════════════════════════════════════
            INPUT CARD
        ════════════════════════════════════════ */}
        <div className="bldr-input-card">
          <div className="bldr-textarea-wrap">
            <textarea
              ref={promptRef}
              className="bldr-textarea"
              placeholder="Describe what you want to build..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              disabled={loading || editing}
            />
            <div className="bldr-textarea-hint">Ctrl+Enter to build</div>
          </div>

          {!code && !loading && (
            <div className="bldr-quickstarts">
              <span className="bldr-quickstarts__label">Not sure what to make? Pick one:</span>
              <div className="bldr-quickstarts__chips">
                {QUICK_STARTS.map(qs => (
                  <button key={qs.label} className="bldr-chip" onClick={() => handleQuickStart(qs)}>
                    <span className="bldr-chip__cat">{qs.category}</span>
                    {qs.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            className="bldr-build-btn"
            onClick={handleBuild}
            disabled={!prompt.trim() || loading || editing}
          >
            {loading
              ? <><span className="bldr-spinner bldr-spinner--btn" />Building...</>
              : hasResult ? 'Rebuild from scratch' : 'Build with AI'}
          </button>
        </div>

        {/* ════════════════════════════════════════
            LOADING STATE
        ════════════════════════════════════════ */}
        {loading && (
          <div className="bldr-loading">
            <div className="bldr-loading__header">
              <span className="bldr-spinner" />
              <span className="bldr-loading__title">Building your idea...</span>
            </div>
            <p className="bldr-loading__idea">"{prompt}"</p>

            <div className="bldr-loading__steps">
              {BUILD_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`bldr-loading__step ${
                    buildStep > i ? 'is-done' : buildStep === i ? 'is-active' : 'is-pending'
                  }`}
                >
                  <span className="bldr-loading__step-icon" aria-hidden="true">
                    {buildStep > i ? '✓' : buildStep === i ? '' : '○'}
                    {buildStep === i && <span className="bldr-loading__step-spinner" />}
                  </span>
                  <span className="bldr-loading__step-text">{step}</span>
                </div>
              ))}
            </div>

            <div className="bldr-loading__bar-wrap">
              <div
                className="bldr-loading__bar"
                style={{ width: `${Math.min(((buildStep) / BUILD_STEPS.length) * 100 + 8, 92)}%` }}
              />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            ERROR STATE (build)
        ════════════════════════════════════════ */}
        {hasError && (
          <div className="bldr-error-card">
            <div className="bldr-error-card__icon">!</div>
            <div className="bldr-error-card__body">
              <p className="bldr-error-card__title">We couldn't build that yet.</p>
              <p className="bldr-error-card__sub">Try a simpler idea, or rephrase your description.</p>
              <p className="bldr-error-card__detail">{error}</p>
            </div>
            <button className="bldr-action-btn bldr-action-btn--primary bldr-action-btn--sm" onClick={handleBuild}>
              Try again
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════
            RESULT SECTION
        ════════════════════════════════════════ */}
        {hasResult && (
          <div className="bldr-result">

            {/* Unsaved warning */}
            {unsavedWarning && (
              <div className="bldr-unsaved-warning">
                <span className="bldr-unsaved-warning__text">
                  Start a new build? Save this project first if you want to keep it.
                </span>
                <div className="bldr-unsaved-warning__actions">
                  <button className="bldr-action-btn bldr-action-btn--save bldr-action-btn--sm" onClick={handleSaveProject}>
                    Save first
                  </button>
                  <button className="bldr-action-btn bldr-action-btn--sm" onClick={clearEditor}>
                    Start new build anyway
                  </button>
                  <button className="bldr-action-btn bldr-action-btn--sm" onClick={() => setUnsavedWarning(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Success banner */}
            <div className="bldr-success-banner" key={buildKey}>
              <div className="bldr-success-banner__check-wrap">
                <div className="bldr-success-banner__check" aria-hidden="true">✓</div>
                <div className="bldr-confetti-burst" aria-hidden="true">
                  {confettiParticles.map(p => (
                    <span
                      key={p.id}
                      className={`bldr-confetti-dot${p.isCircle ? ' bldr-confetti-dot--circle' : ''}`}
                      style={{ '--angle': `${p.angle}deg`, '--dist': `${p.dist}px`, background: p.color, animationDelay: `${p.delay}s` }}
                    />
                  ))}
                </div>
              </div>
              <div className="bldr-success-banner__copy">
                <span className="bldr-success-banner__label">
                  {editCount > 0 ? `${editCount} edit${editCount > 1 ? 's' : ''} made` : 'Your project is ready'}
                </span>
                <h2 className="bldr-success-banner__name">{projectName}</h2>
                {builtSummary && <p className="bldr-success-banner__summary">{builtSummary}</p>}
              </div>
            </div>

            {/* Interactivity badges */}
            {interactivityBadges.length > 0 && (
              <div className="bldr-interact-badges">
                {interactivityBadges.map(b => (
                  <span key={b.label} className={`bldr-interact-badge bldr-interact-badge--${b.cls}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            )}

            {/* Live interactive iframe preview */}
            <div className={`bldr-browser${isPlayMode ? ' bldr-browser--play' : ''}`}>
              <div className="bldr-browser__chrome">
                <div className="bldr-browser__dots">
                  <span className="bldr-browser__dot bldr-browser__dot--red" />
                  <span className="bldr-browser__dot bldr-browser__dot--yellow" />
                  <span className="bldr-browser__dot bldr-browser__dot--green" />
                </div>
                <div className="bldr-browser__bar">
                  {editing
                    ? <><span className="bldr-browser__bar-spinner" />Applying changes...</>
                    : `AI Builder — ${projectName}`}
                </div>
                <button
                  className="bldr-browser__play-btn"
                  onClick={() => setIsPlayMode(p => !p)}
                  title={isPlayMode ? 'Compact view' : 'Expand to play mode'}
                >
                  {isPlayMode ? 'Compact' : 'Play Project'}
                </button>
              </div>
              {/* sandbox="allow-scripts allow-forms allow-pointer-lock" — enables JS, forms, and pointer lock for games */}
              <iframe
                srcDoc={code}
                className={`bldr-iframe${editing ? ' bldr-iframe--updating' : ''}${isPlayMode ? ' bldr-iframe--play' : ''}`}
                title="AI Builder Preview"
                sandbox="allow-scripts allow-forms allow-pointer-lock"
              />
            </div>

            {/* Quick edits — visible immediately after preview */}
            <div className="bldr-modifiers">
              <span className="bldr-modifiers__label">Quick edits:</span>
              {MODIFIERS.map(m => (
                <button
                  key={m}
                  className="bldr-modifier-btn"
                  onClick={() => handleModifier(m)}
                  disabled={editing}
                >
                  {editing ? <span className="bldr-spinner bldr-spinner--sm" /> : null}
                  {m}
                </button>
              ))}
            </div>

            {/* Action bar */}
            <div className="bldr-result__footer">
              <button
                className="bldr-action-btn bldr-action-btn--explain-primary"
                onClick={handleExplain}
                disabled={explaining || editing}
              >
                {explaining
                  ? <><span className="bldr-spinner bldr-spinner--sm" />Explaining...</>
                  : 'How does this work?'}
              </button>

              <button
                className={`bldr-action-btn bldr-action-btn--edit${showEditPanel ? ' bldr-action-btn--edit-active' : ''}`}
                onClick={() => { setShowEditPanel(p => !p); setEditError(''); }}
                disabled={editing}
              >
                {showEditPanel ? 'Close editor' : 'Edit with AI'}
              </button>

              {user ? (
                <button
                  className={`bldr-action-btn bldr-action-btn--save${saveStatus === 'saved' ? ' bldr-action-btn--saved' : ''}`}
                  onClick={handleSaveProject}
                  disabled={saveStatus === 'saving' || isSaved || editing}
                >
                  {saveStatus === 'saving' && <><span className="bldr-spinner bldr-spinner--sm" />Saving...</>}
                  {saveStatus === 'saved'  && 'Saved!'}
                  {saveStatus === 'error'  && 'Try again'}
                  {!saveStatus && (isSaved ? 'Saved' : 'Save project')}
                </button>
              ) : (
                <button className="bldr-action-btn bldr-action-btn--login-hint" onClick={() => navigate('/login')}>
                  Log in to save
                </button>
              )}

              <button className="bldr-action-btn bldr-action-btn--new" onClick={handleNewBuild} disabled={editing}>
                New build
              </button>
            </div>

            {saveStatus === 'error' && saveError && (
              <p className="bldr-error-inline">{saveError}</p>
            )}

            {/* ── Edit-with-AI panel ─────────────────────────────────────── */}
            {showEditPanel && (
              <div className="bldr-edit-panel">
                <div className="bldr-edit-panel__header">
                  <span className="bldr-edit-panel__title">Edit with AI</span>
                  {promptHistory.length > 0 && (
                    <span className="bldr-edit-panel__badge">{promptHistory.length} prompt{promptHistory.length > 1 ? 's' : ''} in memory</span>
                  )}
                </div>

                <div className="bldr-edit-panel__input-wrap">
                  <textarea
                    ref={editRef}
                    className="bldr-edit-panel__textarea"
                    placeholder="Describe a change — e.g. make it harder, add a sound effect placeholder, change the color to blue, add a high score..."
                    value={editInstruction}
                    onChange={e => setEditInstruction(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    rows={3}
                    disabled={editing}
                  />
                  <div className="bldr-textarea-hint">Ctrl+Enter to apply</div>
                </div>

                {editError && (
                  <div className="bldr-edit-panel__error-block">
                    <p className="bldr-edit-panel__error-main">
                      That edit didn't work.{previousCode ? ' Your last working version is preserved.' : ''}
                    </p>
                    <p className="bldr-edit-panel__error-detail">{editError}</p>
                    {previousCode && (
                      <button className="bldr-edit-panel__restore-btn" onClick={handleUndoEdit} disabled={editing}>
                        Restore last working version
                      </button>
                    )}
                  </div>
                )}

                <div className="bldr-edit-panel__actions">
                  <button
                    className="bldr-edit-panel__apply-btn"
                    onClick={() => applyEdit(editInstruction)}
                    disabled={!editInstruction.trim() || editing}
                  >
                    {editing
                      ? <><span className="bldr-spinner bldr-spinner--btn" />{EDIT_STEPS[editStep] || 'Applying...'}...</>
                      : 'Apply changes'}
                  </button>

                  {previousCode && !editError && (
                    <button className="bldr-edit-panel__undo-btn" onClick={handleUndoEdit} disabled={editing}>
                      Undo last change
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Concepts used by AI */}
            {conceptsUsed.length > 0 && (
              <div className="bldr-concepts-used">
                <span className="bldr-concepts-used__label">Concepts in this build:</span>
                <div className="bldr-concepts-used__tags">
                  {conceptsUsed.map(c => (
                    <span key={c} className="bldr-concepts-used__tag">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Lessons used in this build */}
            {lessonChips.length > 0 && (
              <div className="bldr-lessons-used">
                <div className="bldr-lessons-used__header">
                  <span className="bldr-lessons-used__title">What you just used</span>
                  <span className="bldr-lessons-used__sub">Each concept below made this build possible — tap to learn how it works</span>
                </div>
                <div className="bldr-lessons-used__chips">
                  {lessonChips.map(lesson => (
                    <div key={lesson.id} className="bldr-lesson-chip">
                      <div className="bldr-lesson-chip__top">
                        <span className="bldr-lesson-chip__num">L{lesson.id}</span>
                        <span className="bldr-lesson-chip__name">{lesson.title}</span>
                      </div>
                      <p className="bldr-lesson-chip__hint">{lesson.hint}</p>
                      <Link to={`/lesson/${lesson.id}`} className="bldr-lesson-chip__learn">
                        Learn this
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            {explainError && <p className="bldr-error-inline">{explainError}</p>}
            {explanation && (
              <div className="bldr-explanation">
                <div className="bldr-explanation__label">What this build does</div>
                <p className="bldr-explanation__text">{explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            MY SAVED PROJECTS
        ════════════════════════════════════════ */}
        {user && (projectsLoading || savedProjects.length > 0) && (
          <section className="bldr-projects" aria-label="My saved projects">
            <div className="bldr-projects__header">
              <h2 className="bldr-projects__title">My Projects</h2>
              {savedProjects.length > 0 && (
                <span className="bldr-projects__count">{savedProjects.length}</span>
              )}
            </div>

            {projectsLoading && (
              <div className="bldr-projects__loading">
                <span className="bldr-spinner" />
                <span>Loading your projects...</span>
              </div>
            )}

            {!projectsLoading && savedProjects.length > 0 && (
              <div className="bldr-projects__grid">
                {savedProjects.map(project => (
                  <div key={project.id} className="bldr-project-card">
                    <div className="bldr-project-card__type">{project.project_type}</div>
                    <div className="bldr-project-card__name">{project.title}</div>
                    <div className="bldr-project-card__prompt">{project.prompt}</div>
                    <div className="bldr-project-card__date">
                      {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="bldr-project-card__actions">
                      <button
                        className="bldr-project-card__btn bldr-project-card__btn--load"
                        onClick={() => handleLoadProject(project)}
                      >
                        View
                      </button>
                      <button
                        className="bldr-project-card__btn bldr-project-card__btn--delete"
                        onClick={() => handleDeleteProject(project.id)}
                        aria-label={`Delete ${project.title}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ════════════════════════════════════════
            PARENT / TRUST STRIP
        ════════════════════════════════════════ */}
        <section className="bldr-trust" aria-label="About AI Builder">
          <div className="bldr-trust__inner">
            <h2 className="bldr-trust__title">
              A safe, guided way for kids to explore AI and coding
            </h2>
            <p className="bldr-trust__body">
              The AI Builder lets children and beginners see what code can create — without needing
              to know any programming first. Every project runs in a secure sandbox. Log in to save
              your builds and come back to them any time. The AI remembers what it built and can
              modify it — add features, change colours, make it interactive.
            </p>
            <div className="bldr-trust__pills">
              {['Beginner-friendly', 'AI remembers your build', 'Secure sandbox', 'Save your builds'].map(pill => (
                <span key={pill} className="bldr-trust__pill">{pill}</span>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
