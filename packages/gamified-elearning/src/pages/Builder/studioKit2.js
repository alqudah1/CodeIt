/* eslint-disable no-useless-escape -- fallback project templates intentionally preserve escaped HTML/JS */
// Part 2 of what used to be the top of Builder.js: the studio's constants and small helpers.
// See Builder.js for why the studio is in parts.
import { injectErrorReporter } from './previewErrors';
import { injectPlayerSprite } from '../../utils/avatarSprite';
import { injectPreviewStorage } from './previewStorage';
import { injectScoreBridge } from './scoreBridge';
import { projectName } from '../../utils/projectName';

// ── Instant starter templates shown while AI generates ────────────
const STARTER_TEMPLATES = {
  game: `<!DOCTYPE html><!--codeit-starter-template--><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--primary:#FF7A00;--accent:#A855F7;--success:#10B981;--card:#FFFFFF;--border:#EAD9CB;--text:#38291F;--muted:#785B49;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);min-height:100vh;padding:20px;display:flex;flex-direction:column;align-items:center;gap:12px}h1{font-size:1.9rem;font-weight:800;color:var(--text)}.hud{display:flex;gap:22px;font-size:1.1rem;font-weight:700;color:var(--text)}.hud b{color:var(--primary)}#ga{position:relative;width:360px;height:320px;background:var(--card);border-radius:16px;border:2px solid rgba(255,122,0,.18);box-shadow:0 8px 24px rgba(0,0,0,.08);overflow:hidden}.tgt{position:absolute;width:52px;height:52px;background:var(--primary);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.4rem;user-select:none;transition:transform .1s}.tgt:hover{transform:scale(1.12)}.ov{position:absolute;inset:0;background:rgba(255,246,237,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:10}.ov h2{font-size:1.5rem;font-weight:800;color:var(--text)}.ov p{color:var(--muted);font-size:.95rem}button{background:var(--primary);color:#fff;border:none;border-radius:var(--r);padding:13px 30px;font-size:1.05rem;font-weight:700;cursor:pointer;transition:opacity .15s}button:hover{opacity:.88}</style></head><body><h1>Click Game</h1><div class="hud"><span>Score: <b id="sc">0</b></span><span>Time: <b id="ti">30</b>s</span></div><div id="ga"><div class="ov" id="ov"><h2>Ready to Play?</h2><p>Click the stars before they disappear!</p><button onclick="startGame()">Start Game</button></div></div><script>let s=0,t=30,on=false,sp,ct;function startGame(){s=0;t=30;on=true;document.getElementById('sc').textContent=0;document.getElementById('ti').textContent=30;document.getElementById('ov').style.display='none';document.querySelectorAll('.tgt').forEach(x=>x.remove());sp=setInterval(spawn,860);ct=setInterval(()=>{t--;document.getElementById('ti').textContent=t;if(t<=0)end();},1000);}function spawn(){if(!on)return;const e=document.createElement('div');e.className='tgt';e.textContent='⭐';e.style.left=Math.random()*290+'px';e.style.top=Math.random()*260+'px';e.onclick=()=>{if(!on)return;s++;document.getElementById('sc').textContent=s;e.remove();};document.getElementById('ga').appendChild(e);setTimeout(()=>e&&e.remove(),1100);}function end(){on=false;clearInterval(sp);clearInterval(ct);document.querySelectorAll('.tgt').forEach(x=>x.remove());const o=document.getElementById('ov');o.style.display='flex';o.innerHTML='<h2>Game Over!</h2><p>Score: <b style="color:#FF7A00">'+s+'</b>. great job!</p><button onclick="startGame()">Play Again</button>';}<\/script></body></html>`,

  quiz: `<!DOCTYPE html><!--codeit-starter-template--><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--primary:#FF7A00;--accent:#A855F7;--success:#10B981;--card:#FFFFFF;--border:#EAD9CB;--text:#38291F;--muted:#785B49;--coral:#FF6B6B;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:var(--card);border-radius:20px;padding:28px;max-width:460px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.08)}h1{font-size:1.7rem;font-weight:800;color:var(--text);margin-bottom:6px}.sub{color:var(--muted);font-size:.9rem;margin-bottom:20px}#quiz-screen{display:none}#result-screen{display:none;text-align:center}.qnum{font-size:.78rem;font-weight:800;color:var(--primary);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}.qtext{font-size:1.05rem;font-weight:700;color:var(--text);margin-bottom:14px;line-height:1.4}.opts{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}.opt{padding:11px 14px;background:#FFFCF8;border:2px solid var(--border);border-radius:10px;font-size:.95rem;font-weight:600;cursor:pointer;text-align:left;font-family:inherit;transition:all .15s}.opt:hover:not(:disabled){border-color:var(--primary);background:rgba(255,122,0,.06)}.fb{font-weight:700;font-size:.9rem;min-height:1.4rem;margin-bottom:8px}.fb.ok{color:var(--success)}.fb.no{color:var(--coral)}.btn{background:var(--primary);color:#fff;border:none;border-radius:var(--r);padding:12px 24px;font-size:1rem;font-weight:700;cursor:pointer;width:100%;font-family:inherit}.btn:hover{opacity:.9}#nxt{display:none}.bigs{font-size:2.8rem;font-weight:800;color:var(--primary);margin:10px 0}</style></head><body><div class="card"><div id="start-screen"><h1>Quiz Time!</h1><p class="sub">3 sample questions. Can you get them all right?</p><button class="btn" onclick="startQuiz()">Start Quiz</button></div><div id="quiz-screen"><div class="qnum" id="qnum"></div><div class="qtext" id="qtext"></div><div class="opts" id="opts"></div><div class="fb" id="fb"></div><button class="btn" id="nxt" onclick="nextQ()">Next Question</button></div><div id="result-screen"><h1>Done!</h1><div class="bigs" id="fscore">0 / 3</div><p class="sub">Try another round or change the questions.</p><button class="btn" onclick="startQuiz()">Play Again</button></div></div><script>const qs=[{q:'What is 4 × 6?',a:['20','24','26','18'],c:1},{q:'Which is the largest ocean?',a:['Atlantic','Indian','Arctic','Pacific'],c:3},{q:'How many sides does a hexagon have?',a:['5','7','6','8'],c:2}];let cur=0,sc=0;function startQuiz(){cur=0;sc=0;document.getElementById('start-screen').style.display='none';document.getElementById('result-screen').style.display='none';document.getElementById('quiz-screen').style.display='block';showQ();}function showQ(){const q=qs[cur];document.getElementById('qnum').textContent='Question '+(cur+1)+' / '+qs.length;document.getElementById('qtext').textContent=q.q;document.getElementById('fb').textContent='';document.getElementById('fb').className='fb';document.getElementById('nxt').style.display='none';const opts=document.getElementById('opts');opts.innerHTML='';q.a.forEach((a,i)=>{const b=document.createElement('button');b.className='opt';b.textContent=a;b.onclick=()=>check(i);opts.appendChild(b);});}function check(i){const c=qs[cur].c;document.querySelectorAll('.opt').forEach((b,j)=>{b.disabled=true;if(j===c)b.style.background='rgba(16,185,129,.15)';if(j===i&&j!==c)b.style.background='rgba(255,107,107,.15)';});const fb=document.getElementById('fb');if(i===c){sc++;fb.textContent='Correct!';fb.className='fb ok';}else{fb.textContent='Wrong. See green for the answer.';fb.className='fb no';}document.getElementById('nxt').style.display='block';}function nextQ(){cur++;if(cur<qs.length)showQ();else done();}function done(){document.getElementById('quiz-screen').style.display='none';document.getElementById('result-screen').style.display='block';document.getElementById('fscore').textContent=sc+' / '+qs.length;}<\/script></body></html>`,

  website: `<!DOCTYPE html><!--codeit-starter-template--><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--primary:#FF7A00;--accent:#A855F7;--success:#10B981;--card:#FFFFFF;--border:#EAD9CB;--text:#38291F;--muted:#785B49;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--text)}nav{display:flex;gap:10px;padding:.8rem 1.4rem;background:var(--card);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:10}nav a{color:var(--text);font-weight:700;text-decoration:none;padding:6px 10px;border-radius:8px;font-size:.9rem;cursor:pointer;transition:background .15s}nav a:hover{background:rgba(255,122,0,.1);color:var(--primary)}.hero{padding:3.5rem 1.5rem;text-align:center;background:linear-gradient(135deg,rgba(255,122,0,.06),rgba(61,220,151,.05))}.hero h1{font-size:2.2rem;font-weight:800;margin-bottom:8px}.hero p{color:var(--muted);margin-bottom:20px;font-size:1rem}.btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.btn{display:inline-block;background:var(--primary);color:#fff;border:none;border-radius:var(--r);padding:12px 24px;font-size:.95rem;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .15s,transform .1s}.btn:hover{opacity:.9;transform:translateY(-1px)}.btn-g{background:transparent;color:var(--primary);border:2px solid var(--primary)}section{padding:2.5rem 1.5rem;max-width:640px;margin:0 auto}h2{font-size:1.4rem;font-weight:800;margin-bottom:12px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}.card{background:var(--card);border-radius:14px;padding:16px;box-shadow:0 4px 14px rgba(0,0,0,.07)}.card h3{font-weight:700;margin-bottom:4px;font-size:.95rem}.card p{font-size:.82rem;color:var(--muted)}.form-row{display:flex;gap:8px;margin-top:12px}.form-row input{flex:1;padding:10px 12px;border:2px solid var(--border);border-radius:10px;font-family:inherit;font-size:.9rem;outline:none}.form-row input:focus{border-color:var(--primary)}#msg{font-weight:700;color:var(--success);margin-top:8px;min-height:1.2rem;font-size:.9rem}</style></head><body><nav><a onclick="sv('#about')">About</a><a onclick="sv('#features')">Features</a><a onclick="sv('#contact')">Contact</a></nav><div class="hero"><h1>Welcome!</h1><p>Your website is ready. Explore it now!</p><div class="btns"><button class="btn" onclick="sv('#features')">Explore</button><button class="btn btn-g" onclick="alert('Hello! Your site is ready to explore.')">Say Hello</button></div></div><section id="about"><h2>About</h2><p style="color:var(--muted);line-height:1.6">Click buttons and nav links. Everything is interactive and ready for you to customize.</p></section><section id="features"><h2>Features</h2><div class="grid"><div class="card"><h3>Interactive</h3><p>Every button does something</p></div><div class="card"><h3>Colorful</h3><p>Bright and fun design</p></div><div class="card"><h3>Built to edit</h3><p>Change every section</p></div></div></section><section id="contact"><h2>Contact</h2><div class="form-row"><input id="ni" placeholder="Your message..."><button class="btn" onclick="send()">Send</button></div><p id="msg"></p></section><script>function sv(id){document.querySelector(id).scrollIntoView({behavior:'smooth'});}function send(){const v=document.getElementById('ni').value.trim();document.getElementById('msg').textContent=v?'Thanks! Got your message: "'+v+'"':'Please type a message first.';}<\/script></body></html>`,

  tool: `<!DOCTYPE html><!--codeit-starter-template--><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--primary:#FF7A00;--accent:#A855F7;--success:#10B981;--card:#FFFFFF;--border:#EAD9CB;--text:#38291F;--muted:#785B49;--coral:#FF6B6B;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:var(--card);border-radius:20px;padding:30px;max-width:380px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.08)}h1{font-size:1.6rem;font-weight:800;color:var(--text);margin-bottom:6px}p{color:var(--muted);font-size:.88rem;margin-bottom:18px}label{display:block;font-size:.83rem;font-weight:700;color:var(--text);margin-bottom:5px}input,select{width:100%;padding:11px 13px;border:2px solid var(--border);border-radius:10px;font-size:.95rem;font-family:inherit;outline:none;margin-bottom:12px;transition:border-color .15s}input:focus,select:focus{border-color:var(--primary)}button{background:var(--primary);color:#fff;border:none;border-radius:var(--r);padding:13px;font-size:1rem;font-weight:700;cursor:pointer;width:100%;font-family:inherit}button:hover{opacity:.9}.res{margin-top:16px;padding:16px;background:rgba(255,122,0,.07);border:2px solid rgba(255,122,0,.18);border-radius:12px;min-height:56px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px}.rv{font-size:2rem;font-weight:800;color:var(--primary)}.rl{font-size:.8rem;color:var(--muted);text-align:center}</style></head><body><div class="card"><h1>Calculator</h1><p>Enter numbers and click Calculate</p><label>First number</label><input id="a" type="number" placeholder="e.g. 25"><label>Second number</label><input id="b" type="number" placeholder="e.g. 10"><select id="op"><option value="+">Add (+)</option><option value="-">Subtract (−)</option><option value="*">Multiply (×)</option><option value="/">Divide (÷)</option></select><button onclick="calc()">Calculate</button><div class="res"><div class="rv" id="rv">0</div><div class="rl" id="rl">Enter numbers above</div></div></div><script>function calc(){const a=parseFloat(document.getElementById('a').value),b=parseFloat(document.getElementById('b').value),op=document.getElementById('op').value;if(isNaN(a)||isNaN(b)){document.getElementById('rv').textContent='?';document.getElementById('rv').style.color='#FF6B6B';document.getElementById('rl').textContent='Enter valid numbers';return;}let r,l;if(op==='+'){r=a+b;l=a+' + '+b+' = '+r;}else if(op==='-'){r=a-b;l=a+' − '+b+' = '+r;}else if(op==='*'){r=a*b;l=a+' × '+b+' = '+r;}else{if(b===0){document.getElementById('rv').textContent='∞';document.getElementById('rv').style.color='#FF6B6B';document.getElementById('rl').textContent="Can't divide by zero!";return;}r=Math.round(a/b*100)/100;l=a+' ÷ '+b+' = '+r;}document.getElementById('rv').textContent=r;document.getElementById('rv').style.color='#FF7A00';document.getElementById('rl').textContent=l;}document.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')calc();}));<\/script></body></html>`,

  story: `<!DOCTYPE html><!--codeit-starter-template--><html><head><meta charset="UTF-8"><style>:root{--bg:#FFF6ED;--primary:#FF7A00;--accent:#A855F7;--success:#10B981;--card:#FFFFFF;--border:#EAD9CB;--text:#38291F;--muted:#785B49;--r:14px}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:var(--bg);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:var(--card);border-radius:20px;padding:32px;max-width:440px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.08);text-align:center}h1{font-size:1.8rem;font-weight:800;color:var(--text);margin-bottom:6px}p.sub{color:var(--muted);font-size:.9rem;margin-bottom:20px}button{background:var(--primary);color:#fff;border:none;border-radius:var(--r);padding:14px 28px;font-size:1.1rem;font-weight:700;cursor:pointer;font-family:inherit;transition:transform .12s,opacity .15s;margin-bottom:18px}button:hover{opacity:.9;transform:scale(1.04)}button:active{transform:scale(.97)}.sb{background:rgba(255,122,0,.05);border:2px solid rgba(255,122,0,.18);border-radius:14px;padding:20px;min-height:80px;display:flex;align-items:center;justify-content:center}#st{font-size:1rem;line-height:1.6;color:var(--text);font-weight:600;transition:opacity .25s}</style></head><body><div class="card"><h1>Story Generator</h1><p class="sub">Click the button for a random adventure!</p><button onclick="gen()">Generate Story</button><div class="sb"><p id="st">Press the button to begin your story...</p></div></div><script>const H=['A brave knight','A clever fox','A tiny robot','A singing explorer','A fearless pirate'];const P=['in a magical forest','on the moon','in a giant pizza shop','underwater','in a flying castle'];const M=['found the golden trophy','baked the world\'s best pie','defeated the robot king','discovered a hidden map','made everyone laugh'];function gen(){const s=document.getElementById('st');s.style.opacity=0;setTimeout(()=>{s.textContent=H[~~(Math.random()*H.length)]+' went '+P[~~(Math.random()*P.length)]+' and '+M[~~(Math.random()*M.length)]+'!';s.style.opacity=1;},220);}<\/script></body></html>`,
};

const EDIT_STEPS = [
  'Reading your instruction',
  'Updating the code',
  'Keeping everything intact',
  'Almost done',
];

const EASY_EDIT_IDEAS = {
  game: [
    { icon: 'palette', label: 'Change the colours', instruction: 'Change the game to bright rainbow colours.' },
    { icon: 'star', label: 'Add a power-up', instruction: 'Add a fun star power-up that helps the player.' },
    { icon: 'trophy', label: 'Add a win screen', instruction: 'Add a colorful celebration screen when the player wins.' },
  ],
  website: [
    { icon: 'palette', label: 'Change the colours', instruction: 'Change the website to bright rainbow colours.' },
    { icon: 'image', label: 'Add a picture spot', instruction: 'Add a big friendly picture section near the top.' },
    { icon: 'sparkle', label: 'Make buttons move', instruction: 'Add a fun bounce animation when buttons are pressed.' },
  ],
  default: [
    { icon: 'palette', label: 'Change the colours', instruction: 'Change the project to bright rainbow colours.' },
    { icon: 'text', label: 'Make words bigger', instruction: 'Make the important words bigger and easier to read.' },
    { icon: 'sparkle', label: 'Add movement', instruction: 'Add a fun gentle animation to the main button.' },
  ],
};

function getEasyEditIdeas(type) {
  return /game|quiz|clicker|runner|memory|reaction|soccer/.test(type || '')
    ? EASY_EDIT_IDEAS.game
    : /website|portfolio|restaurant|shop|sports|blog|landing/.test(type || '')
      ? EASY_EDIT_IDEAS.website
      : EASY_EDIT_IDEAS.default;
}

// Who may be offered a plan is not decided here any more. It used to be
// "signed in, not a family profile, role is not student", which was the same
// thing as an age test only for as long as every student was a child. The
// backend decides it from date of birth and answers on /api/billing/status as
// canSubscribe, and the pricing page has read that answer for a while. This
// file and the header were the two places still guessing from the role, which
// meant an adult on a learner account was never offered the plan the server
// would have sold them, and the upgrade_prompt_shown event undercounted by
// exactly that group. See the billing state in the component below.

/** "1 November": when the month's free studio builds come back. */
function firstOfNextMonth(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

function friendlyWait(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  if (safeSeconds < 60) return `${safeSeconds} second${safeSeconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(safeSeconds / 60);
  // The site's daily ceiling can ask for most of a day. "437 minutes" is a
  // sum for the child to do; "about 8 hours" is an answer.
  if (minutes >= 90) return `about ${Math.ceil(minutes / 60)} hours`;
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

// GUIDE_LEVELS and learnerGuideLevel now live in utils/guideLevel.js, so the
// lesson pages read the same setting this panel writes.

// Bridge script injected into the iframe for live element editing via postMessage
// ── Editing means editing, not playing ───────────────────────────────────────
//
// The bridge stopped `click` when element editing was on, but not
// `pointerdown`, and every game listens for pointerdown because that is what a
// thumb sends. So a child who turned on Edit elements and tapped a piece was
// still playing the game.
//
// In colour memory that was fatal: the tap counted as an answer, the answer was
// usually wrong, the round ended, and the game-over screen dropped over the
// board the child was trying to edit. It looked like the editor had done
// nothing. A browser check caught it four times in eight, which is the worst
// kind of bug to find by hand.
//
// onDown now stops the event at the document, in the capture phase, before it
// can reach anything the page itself registered. stopPropagation rather than
// stopImmediatePropagation, so the bridge's own drag handling still runs.
const EDITOR_BRIDGE = `(function(){if(window.self===window.top)return;var em=false,sel=null,hov=null;function eid(el){if(!el.id)el.id='ce-'+Math.random().toString(36).slice(2,8);return el.id;}function isEl(el){return el&&el!==document.body&&el!==document.documentElement&&el.nodeType===1;}function clrHov(){if(hov){hov.style.outline='';hov.style.outlineOffset='';hov=null;}}function onOver(e){clrHov();if(!em||!isEl(e.target))return;hov=e.target;hov.style.outline='2.5px solid #FF7A00';hov.style.outlineOffset='2px';}function onClk(e){if(!em)return;e.preventDefault();e.stopPropagation();if(noClick){noClick=false;return;}var el=e.target;if(!isEl(el))return;if(sel&&sel!==el){sel.style.outline='';}sel=el;sel.style.outline='2.5px solid #A855F7';var r=el.getBoundingClientRect();var cs=window.getComputedStyle(el);var t=el.tagName.toLowerCase();window.parent.postMessage({type:'CODEIT_SELECTED',id:eid(el),tag:t,text:el.textContent.slice(0,300),rect:{top:r.top+window.scrollY,left:r.left,w:r.width,h:r.height},styles:{color:cs.color,bg:cs.backgroundColor,fs:cs.fontSize,fw:cs.fontWeight,br:cs.borderRadius,anim:cs.animationName,pt:cs.paddingTop,pb:cs.paddingBottom,pl:cs.paddingLeft,pr:cs.paddingRight},isText:['p','h1','h2','h3','h4','h5','h6','span','li','a','label','td','th','button'].includes(t),isBtn:['button','a'].includes(t),isImg:t==='img'},'*');}function sync(){setTimeout(function(){window.parent.postMessage({type:'CODEIT_SYNC',html:serialize()},'*');},80);}var dEl=null,dSX=0,dSY=0,dBX=0,dBY=0,dMoved=false,noClick=false;function baseXY(el){var m=/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(el.style.transform||'');return m?[parseFloat(m[1]),parseFloat(m[2])]:[0,0];}function clearOutlines(){var o=[];if(sel){o.push([sel,sel.style.outline]);sel.style.outline='';}if(hov){o.push([hov,hov.style.outline]);hov.style.outline='';}return o;}function restoreOutlines(o){o.forEach(function(p){p[0].style.outline=p[1];});}function serialize(){var o=clearOutlines();var h=document.documentElement.outerHTML;restoreOutlines(o);return h;}function onDown(e){if(!em)return;e.stopPropagation();if(!isEl(e.target))return;dEl=e.target;dMoved=false;dSX=e.clientX;dSY=e.clientY;var b=baseXY(dEl);dBX=b[0];dBY=b[1];}function onMove(e){if(!dEl)return;var dx=e.clientX-dSX,dy=e.clientY-dSY;if(!dMoved&&Math.abs(dx)<4&&Math.abs(dy)<4)return;dMoved=true;e.preventDefault();dEl.style.transform='translate('+(dBX+dx)+'px, '+(dBY+dy)+'px)';}function onUp(){if(!dEl)return;var moved=dMoved,el=dEl;dEl=null;dMoved=false;if(!moved)return;noClick=true;el.style.cursor='';window.parent.postMessage({type:'CODEIT_MOVED',html:serialize()},'*');}var played=false;function markPlayed(){if(em||played)return;played=true;window.parent.postMessage({type:'CODEIT_PLAYED'},'*');}document.addEventListener('click',markPlayed,true);document.addEventListener('keydown',markPlayed,true);document.addEventListener('touchstart',markPlayed,true);window.addEventListener('message',function(e){if(e.source!==window.parent||!e.data||e.data.type!=='CODEIT_CMD')return;var d=e.data,p=d.payload||{};if(d.cmd==='ENABLE'){em=true;document.body.style.cursor='move';document.addEventListener('mouseover',onOver,true);document.addEventListener('click',onClk,true);document.addEventListener('pointerdown',onDown,true);document.addEventListener('pointermove',onMove,true);document.addEventListener('pointerup',onUp,true);document.addEventListener('pointercancel',onUp,true);}if(d.cmd==='DISABLE'){em=false;document.body.style.cursor='';clrHov();if(sel){sel.style.outline='';sel=null;}document.removeEventListener('mouseover',onOver,true);document.removeEventListener('click',onClk,true);document.removeEventListener('pointerdown',onDown,true);document.removeEventListener('pointermove',onMove,true);document.removeEventListener('pointerup',onUp,true);document.removeEventListener('pointercancel',onUp,true);window.parent.postMessage({type:'CODEIT_HTML',html:serialize()},'*');}if(d.cmd==='SET_TEXT'){var el=document.getElementById(p.id)||(sel);if(el){el.textContent=p.v;}sync();}if(d.cmd==='SET_STYLE'){var el=document.getElementById(p.id)||(sel);if(el)Object.assign(el.style,p.styles);sync();}if(d.cmd==='SET_PATCH'){var el=document.getElementById(p.id);if(el){var tmp=document.createElement('div');tmp.innerHTML=p.html;var newEl=tmp.firstElementChild||tmp;el.replaceWith(newEl);}sync();}if(d.cmd==='DELETE'){var el=document.getElementById(p.id)||sel;if(el&&el!==document.body){if(el===sel)sel=null;el.remove();}sync();}if(d.cmd==='DUPLICATE'){var el=document.getElementById(p.id)||sel;if(el&&el.parentNode){var c=el.cloneNode(true);c.removeAttribute('id');var kids=c.querySelectorAll('[id]');for(var i=0;i<kids.length;i++){kids[i].removeAttribute('id');}c.style.outline='';var b=baseXY(el);c.style.transform='translate('+(b[0]+16)+'px, '+(b[1]+16)+'px)';el.parentNode.insertBefore(c,el.nextSibling);}sync();}if(d.cmd==='RESIZE'){var el=document.getElementById(p.id)||sel;if(el){var cs=window.getComputedStyle(el);var fs=parseFloat(cs.fontSize)||16;var next=Math.max(8,Math.min(160,fs*(p.factor||1)));el.style.fontSize=next+'px';var w=parseFloat(el.style.width);if(!isNaN(w)){el.style.width=Math.max(16,w*(p.factor||1))+'px';}var h=parseFloat(el.style.height);if(!isNaN(h)){el.style.height=Math.max(16,h*(p.factor||1))+'px';}}sync();}if(d.cmd==='GET_HTML'){window.parent.postMessage({type:'CODEIT_HTML',html:serialize()},'*');}if(d.cmd==='DESELECT'){if(sel){sel.style.outline='';sel=null;}}if(d.cmd==='SET_ROOT_VARS'){var sv=document.getElementById('__ci_vars');if(!sv){sv=document.createElement('style');sv.id='__ci_vars';document.head.appendChild(sv);}var css=':root{';Object.keys(p.vars||{}).forEach(function(k){css+=k+':'+p.vars[k]+';';});css+='}';sv.textContent=css;}if(d.cmd==='RUN_SCRIPT'){try{(new Function(p.js||''))();}catch(e){}}});window.parent.postMessage({type:'CODEIT_READY'},'*');})();`;

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

// One naming rule for the whole product, shared with the server. See
// utils/projectName.js for the classroom session that made this necessary.
function deriveProjectName(rawPrompt) {
  return projectName(rawPrompt);
}

function extractColors(html) {
  const primary = html.match(/--primary:\s*(#[\da-fA-F]{3,8})/)?.[1] || '#FF7A00';
  const accent  = html.match(/--accent:\s*(#[\da-fA-F]{3,8})/)?.[1]  || '#A855F7';
  return { primary, accent };
}

function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 5)     return 'just now';
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return Math.floor(s / 86400) === 1 ? 'Yesterday' : `${Math.floor(s / 86400)}d ago`;
}

function injectBridge(html) {
  if (!html || html.includes('__codeit_bridge__')) return html;
  const tag = `<script id="__codeit_bridge__">${EDITOR_BRIDGE}<\/script>`;
  return html.includes('</body>') ? html.replace('</body>', tag + '</body>') : html + tag;
}

/**
 * Everything the preview needs wrapped around the child's own code.
 *
 * The storage shim has to go first — a game reads its high score on the line it
 * starts on, and the editor bridge does not run until something is clicked.
 */
function preparePreview(html, seed, spriteUri) {
  // The error watcher goes in last so it ends up first in the document: a
  // project that throws on its opening line still gets reported. The player
  // sprite goes in with the rest: starters that know about it draw the kid's
  // own avatar as the player; every other project ignores it.
  // The score bridge reads the child's own score while they play, so the link
  // they send can say "can you beat 120?" (scoreBridge.js).
  return injectErrorReporter(injectBridge(injectPreviewStorage(injectScoreBridge(injectPlayerSprite(html, spriteUri)), seed)));
}

function rgbToHex(rgb) {
  if (!rgb) return '#000000';
  if (rgb.startsWith('#')) return rgb;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#000000';
  return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
}

export {
  STARTER_TEMPLATES,
  EDIT_STEPS,
  EASY_EDIT_IDEAS,
  getEasyEditIdeas,
  firstOfNextMonth,
  friendlyWait,
  EDITOR_BRIDGE,
  CONFETTI_COLORS,
  isValidHtml,
  deriveProjectName,
  extractColors,
  timeAgo,
  injectBridge,
  preparePreview,
  rgbToHex,
};
