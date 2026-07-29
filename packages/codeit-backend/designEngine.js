'use strict';

// ================================================================
// DESIGN ENGINE — CodeIt AI Builder
// Provides: palettes, CSS system, animation library, starter
// patterns, project classifier, and quality validator.
// ================================================================

// ── Color Palettes ───────────────────────────────────────────────

const PALETTES = {
  arcade: {
    name: 'Arcade',
    vars: '--bg:#FFF8E7;--card:#FFFFFF;--border:#FFD6A5;--primary:#FF6B6B;--accent:#F4B942;--success:#00AFC1;--danger:#DC2626;--text:#3D302B;--muted:#725F55;--r:12px;--shadow:0 4px 22px rgba(255,107,107,.16)',
    mood: 'bright arcade energy, colorful controls, playful motion',
  },
  candy: {
    name: 'Candy',
    vars: '--bg:#FFF0F6;--card:#FFFFFF;--border:#F9A8D4;--primary:#EC4899;--accent:#A855F7;--success:#10B981;--danger:#EF4444;--text:#1F2937;--muted:#6B7280;--r:20px;--shadow:0 4px 20px rgba(236,72,153,.15)',
    mood: 'playful, sweet, kawaii, rounded, pastel-pop',
  },
  ocean: {
    name: 'Ocean',
    vars: '--bg:#E8F4FD;--card:#FFFFFF;--border:#BAE6FD;--primary:#0EA5E9;--accent:#10B981;--success:#22C55E;--danger:#EF4444;--text:#0F172A;--muted:#64748B;--r:14px;--shadow:0 4px 20px rgba(14,165,233,.12)',
    mood: 'calm, fresh, aquatic, adventure, clear skies',
  },
  forest: {
    name: 'Forest',
    vars: '--bg:#F0FDF4;--card:#FFFFFF;--border:#BBF7D0;--primary:#22C55E;--accent:#F59E0B;--success:#10B981;--danger:#EF4444;--text:#14532D;--muted:#6B7280;--r:16px;--shadow:0 4px 20px rgba(34,197,94,.12)',
    mood: 'natural, earthy, cozy, growth, adventure',
  },
  sunset: {
    name: 'Sunset',
    vars: '--bg:#FFF6ED;--card:#FFFFFF;--border:#FED7AA;--primary:#FF7A00;--accent:#A855F7;--success:#10B981;--danger:#EF4444;--text:#1F2937;--muted:#6B7280;--r:14px;--shadow:0 4px 20px rgba(255,122,0,.10)',
    mood: 'warm, creative, energetic, CodeIt signature',
  },
  space: {
    name: 'Space',
    vars: '--bg:#F8F2FF;--card:#FFFFFF;--border:#DDC9F7;--primary:#8B5CF6;--accent:#06B6D4;--success:#10B981;--danger:#DC2626;--text:#3D302B;--muted:#725F55;--r:14px;--shadow:0 8px 28px rgba(139,92,246,.16)',
    mood: 'bright cosmic adventure, lavender starlight, playful sci-fi',
  },
};

// ── CSS Component Library ────────────────────────────────────────
// Paste inside <style> before any custom CSS. Uses :root variables.

const BASE_CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif;font-size:16px;line-height:1.5}
.container{max-width:680px;margin:0 auto;padding:20px}
.center{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px}
.row{display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center}
.grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
@media(max-width:520px){.grid2,.grid3{grid-template-columns:1fr}}
.card{background:var(--card);border-radius:var(--r);padding:24px;box-shadow:var(--shadow);border:1.5px solid var(--border)}
.card-sm{background:var(--card);border-radius:var(--r);padding:16px;box-shadow:var(--shadow);border:1.5px solid var(--border)}
button,.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 26px;border-radius:var(--r);font-family:inherit;font-size:1rem;font-weight:700;cursor:pointer;border:none;transition:transform .15s,filter .15s;user-select:none;background:var(--primary);color:#fff;box-shadow:0 3px 10px rgba(0,0,0,.18)}
button:hover,.btn:hover{transform:translateY(-2px);filter:brightness(1.09)}
button:active,.btn:active{transform:scale(.96)}
button:disabled,.btn:disabled{opacity:.45;cursor:not-allowed;transform:none;filter:none}
.btn-accent{background:var(--accent)}
.btn-outline{background:transparent!important;color:var(--primary);border:2.5px solid var(--primary);box-shadow:none}
.btn-ghost{background:rgba(128,128,128,.1)!important;color:var(--text);border:1.5px solid var(--border);box-shadow:none}
.btn-lg{padding:16px 38px;font-size:1.2rem}
.btn-sm{padding:8px 16px;font-size:.85rem}
.btn-round{border-radius:50px}
input,select,textarea{width:100%;padding:12px 16px;border-radius:var(--r);border:2px solid var(--border);background:var(--card);color:var(--text);font-family:inherit;font-size:1rem;outline:none;transition:border-color .2s}
input:focus,select:focus,textarea:focus{border-color:var(--primary)}
.score-num{font-size:2.8rem;font-weight:900;color:var(--primary);line-height:1}
.score-label{font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px}
.timer-num{font-size:2.2rem;font-weight:900;color:var(--primary);font-variant-numeric:tabular-nums}
.timer-num.danger{color:var(--danger);animation:pulse .5s ease infinite}
.xp-track{width:100%;height:12px;background:var(--border);border-radius:50px;overflow:hidden}
.xp-fill{height:100%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:50px;transition:width .4s ease}
.overlay{position:absolute;inset:0;background:rgba(0,0,0,.65);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:20;padding:24px;backdrop-filter:blur(4px);border-radius:var(--r)}
.overlay h2{font-size:1.9rem;font-weight:900;color:#fff}
.overlay p{color:rgba(255,255,255,.82);font-size:1rem}
.nav{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;background:var(--card);border-bottom:1.5px solid var(--border);position:sticky;top:0;z-index:50}
.nav-brand{font-weight:900;font-size:1.2rem;color:var(--primary)}
.nav-links{display:flex;gap:6px;list-style:none}
.nav-links a,.nav-link{text-decoration:none;color:var(--text);padding:6px 14px;border-radius:50px;font-weight:600;transition:background .2s;cursor:pointer;font-size:.9rem;background:none;border:none;font-family:inherit;box-shadow:none}
.nav-links a:hover,.nav-link:hover{background:var(--border)}
.hero{text-align:center;padding:48px 20px 32px}
.hero h1{font-size:clamp(2rem,6vw,3rem);font-weight:900;line-height:1.1;margin-bottom:14px}
.hero p{font-size:1.05rem;color:var(--muted);max-width:480px;margin:0 auto 24px}
.ok,.correct{color:var(--success);font-weight:700}
.no,.wrong{color:var(--danger);font-weight:700}
.no,.wrong{animation:shake .4s ease}
.screen{display:none}
.screen.active{display:flex;flex-direction:column;animation:fadeIn .3s ease}
.mem-card{cursor:pointer;perspective:600px;user-select:none}
.card-inner{width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform .45s ease}
.mem-card.flipped .card-inner{transform:rotateY(180deg)}
.card-front,.card-back{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:var(--r);backface-visibility:hidden;font-size:1.5rem;font-weight:800;border:2px solid var(--border)}
.card-front{background:var(--primary);color:#fff}
.card-back{background:var(--card);transform:rotateY(180deg)}
.mem-card.matched .card-back{border-color:var(--accent)}
.divider{height:1.5px;background:var(--border);margin:20px 0;border-radius:50px}
.particle{position:absolute;pointer-events:none;border-radius:50%;animation:particle-burst .6s ease forwards;z-index:50}
.score-popup{position:absolute;font-weight:900;font-size:1.3rem;pointer-events:none;animation:score-float .8s ease forwards;white-space:nowrap;z-index:99;text-shadow:0 2px 8px rgba(0,0,0,.25)}
.combo-display{font-weight:900;color:var(--accent);min-height:1.5em;text-align:center;font-size:.95rem;letter-spacing:.5px}
.hud-flash{animation:hud-flash .3s ease!important}
.target{position:absolute;border-radius:50%;background:var(--primary);cursor:pointer;animation:spawn-in .22s cubic-bezier(.2,.8,.4,1.4) both;box-shadow:0 0 18px var(--primary),0 2px 8px rgba(0,0,0,.25);border:3px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;user-select:none;transition:transform .1s}
.target:active{transform:scale(.85)}
.game-area{position:relative;overflow:hidden;border-radius:var(--r);cursor:crosshair}`;

// ── Animation Library ────────────────────────────────────────────

const ANIMATION_CSS = `@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{transform:scale(.5);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes shake{0%,100%{transform:translateX(0)}15%{transform:translate(-6px,3px)}30%{transform:translate(6px,-3px)}45%{transform:translate(-4px,4px)}60%{transform:translate(4px,-2px)}75%{transform:translate(-2px,3px)}}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.07);opacity:.82}}
@keyframes glow{0%,100%{box-shadow:0 0 8px var(--primary)}50%{box-shadow:0 0 28px var(--primary),0 0 48px var(--accent)}}
@keyframes celebrate{0%{transform:scale(1) rotate(0)}25%{transform:scale(1.2) rotate(-6deg)}75%{transform:scale(1.15) rotate(5deg)}100%{transform:scale(1) rotate(0)}}
@keyframes slideInUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes slideInLeft{from{transform:translateX(-30px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes ripple{0%{transform:scale(0);opacity:.6}100%{transform:scale(3);opacity:0}}
@keyframes particle-burst{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--tx),var(--ty)) scale(0);opacity:0}}
@keyframes score-float{0%{transform:translateY(0) scale(.8);opacity:1}100%{transform:translateY(-55px) scale(1.1);opacity:0}}
@keyframes combo-pop{0%{transform:scale(.4)}60%{transform:scale(1.35)}100%{transform:scale(1)}}
@keyframes hud-flash{0%{transform:scale(1)}35%{transform:scale(1.28)}100%{transform:scale(1)}}
@keyframes level-up{0%{transform:scale(1) rotate(0);filter:brightness(1)}50%{transform:scale(1.4) rotate(-4deg);filter:brightness(1.6)}100%{transform:scale(1) rotate(0);filter:brightness(1)}}
@keyframes spawn-in{0%{transform:scale(0) rotate(-20deg);opacity:0}70%{transform:scale(1.15) rotate(5deg)}100%{transform:scale(1) rotate(0);opacity:1}}`;

// ── Game Starter Patterns ────────────────────────────────────────

const GAME_STARTERS = {
  clicker: {
    description: 'Click/tap targets that appear randomly, score per hit, 30s timer, speed increases each hit.',
    elements: '#game-area(position:relative;overflow:hidden) | #score-display | #timer-display(.timer-num) | start overlay | game-over overlay with #final-score | restart button',
    coreJS: `let _ac=null;
function playTone(f,t,d,v){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain();o.connect(g);g.connect(_ac.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(v||0.15,_ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+(d||0.1));o.start();o.stop(_ac.currentTime+(d||0.1));}catch(e){}}
function burst(x,y,clr){const a=document.getElementById('game-area');for(let i=0;i<8;i++){const p=document.createElement('div');p.className='particle';const ang=(i/8)*Math.PI*2,d=36+Math.random()*28;p.style.cssText='width:'+(5+i%4*2)+'px;height:'+(5+i%4*2)+'px;background:'+clr+';left:'+x+'px;top:'+y+'px;--tx:'+Math.cos(ang)*d+'px;--ty:'+Math.sin(ang)*d+'px';a.appendChild(p);setTimeout(()=>p.remove(),750);}}
function popScore(x,y,txt,clr){const a=document.getElementById('game-area');const el=document.createElement('div');el.className='score-popup';el.style.cssText='left:'+(x-18)+'px;top:'+(y-10)+'px;color:'+(clr||'var(--accent)');el.textContent=txt;a.appendChild(el);setTimeout(()=>el.remove(),850);}
function shake(){const a=document.getElementById('game-area');a.style.animation='shake .4s ease';setTimeout(()=>a.style.animation='',450);}
function flashEl(id){const el=document.getElementById(id);if(!el)return;el.classList.remove('hud-flash');void el.offsetWidth;el.classList.add('hud-flash');}
function showOverlay(id){document.querySelectorAll('.overlay').forEach(o=>o.style.display='none');document.getElementById(id).style.display='flex';}
function hideOverlay(){document.querySelectorAll('.overlay').forEach(o=>o.style.display='none');}
let score=0,combo=0,timeLeft=30,gameOn=false,spawnMs=900,level=1,spawnTimer,clockTimer;
function startGame(){
  score=0;combo=0;timeLeft=30;spawnMs=900;level=1;gameOn=true;
  document.querySelectorAll('.target').forEach(t=>t.remove());
  document.getElementById('timer-display').classList.remove('danger');
  updateHUD();hideOverlay();
  spawnTimer=setInterval(spawnTarget,spawnMs);
  clockTimer=setInterval(tick,1000);
}
function tick(){timeLeft--;updateHUD();if(timeLeft<=5)document.getElementById('timer-display').classList.add('danger');if(timeLeft<=0)endGame();}
function spawnTarget(){
  if(!gameOn)return;
  const area=document.getElementById('game-area');
  const sz=Math.max(34,52-level*2);
  const t=document.createElement('div');t.className='target';
  t.style.cssText='width:'+sz+'px;height:'+sz+'px;left:'+Math.random()*(area.clientWidth-sz)+'px;top:'+Math.random()*(area.clientHeight-sz)+'px';
  t.onclick=e=>{
    if(!gameOn)return;e.stopPropagation();
    const r=t.getBoundingClientRect(),ar=area.getBoundingClientRect();
    const cx=r.left-ar.left+r.width/2,cy=r.top-ar.top+r.height/2;
    combo++;
    const mult=combo>=5?3:combo>=3?2:1;
    const pts=10*mult;score+=pts;
    playTone(mult>1?660:440,'triangle',0.1);
    burst(cx,cy,mult>=3?'var(--danger)':mult===2?'var(--accent)':'var(--primary)');
    popScore(cx,cy,mult>1?'+'+pts+' x'+mult+'!':'+'+pts,mult>1?'var(--accent)':null);
    flashEl('score-display');t.remove();updateHUD();
  };
  area.appendChild(t);
  setTimeout(()=>{if(t.parentNode&&gameOn){t.remove();combo=0;shake();playTone(180,'sawtooth',0.15,0.12);updateHUD();}},spawnMs+100);
}
function endGame(){
  gameOn=false;clearInterval(spawnTimer);clearInterval(clockTimer);
  document.querySelectorAll('.target').forEach(t=>t.remove());
  document.getElementById('final-score').textContent=score;
  showOverlay('game-over');playTone(220,'sawtooth',0.35,0.2);
}
function updateHUD(){
  document.getElementById('score-display').textContent=score;
  document.getElementById('timer-display').textContent=timeLeft;
  const cd=document.getElementById('combo-display');
  if(cd){cd.textContent=combo>=2?'COMBO x'+(combo>=5?3:combo>=3?2:1)+'!':'';if(combo>=2){cd.style.animation='';void cd.offsetWidth;cd.style.animation='combo-pop .3s both';}}
}`,
  },
  quiz: {
    description: 'Multiple choice quiz: welcome screen → questions with instant feedback → final score screen. Min 5 questions.',
    elements: '#start-screen(.screen.active) | #quiz-screen(.screen hidden) | #result-screen(.screen hidden) | #q-num | #q-text | #options container with 4 .opt buttons | #feedback | #next-btn | #final-score | #max-score',
    coreJS: `// AI fills questions array with 5-8 topic-specific entries:
const questions=[
  {q:'Question 1?',opts:['A','B','C','D'],answer:0},
];
let cur=0,score=0,combo=0,answered=false;
let _ac=null;
function playTone(f,t,d,v){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain();o.connect(g);g.connect(_ac.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(v||0.12,_ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+(d||0.1));o.start();o.stop(_ac.currentTime+(d||0.1));}catch(e){}}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.className='screen');document.getElementById(id).className='screen active';}
function startQuiz(){cur=0;score=0;combo=0;showScreen('quiz-screen');showQuestion();}
function showQuestion(){
  answered=false;
  const q=questions[cur];
  document.getElementById('q-num').textContent=(cur+1)+' / '+questions.length;
  document.getElementById('q-text').textContent=q.q;
  document.getElementById('feedback').textContent='';document.getElementById('feedback').className='';
  document.getElementById('next-btn').style.display='none';
  const cb=document.getElementById('combo-badge');
  if(cb)cb.textContent=combo>=3?'Combo x'+(combo>=5?3:2)+'!':'';
  document.querySelectorAll('.opt').forEach((btn,i)=>{btn.textContent=q.opts[i];btn.disabled=false;btn.className='opt btn btn-outline';btn.style.cssText='';});
}
function checkAnswer(i){
  if(answered)return;answered=true;
  const correct=questions[cur].answer;
  document.querySelectorAll('.opt').forEach((btn,j)=>{
    btn.disabled=true;
    if(j===correct)btn.style.cssText='background:var(--success);color:#fff;border-color:var(--success)';
    else if(j===i)btn.style.cssText='background:var(--danger);color:#fff;border-color:var(--danger)';
  });
  const fb=document.getElementById('feedback');
  if(i===correct){
    combo++;const mult=combo>=5?3:combo>=3?2:1;score+=mult;
    playTone(660,'triangle',0.15);
    fb.textContent=mult>1?'Correct! Combo x'+mult+'!':'Correct!';fb.className='ok';
  }else{
    combo=0;playTone(220,'sawtooth',0.1);
    fb.textContent='Not quite — the right answer is highlighted.';fb.className='no';
  }
  document.getElementById('next-btn').style.display='block';
}
function nextQuestion(){cur++;cur<questions.length?showQuestion():showResult();}
function showResult(){
  document.getElementById('final-score').textContent=score;
  document.getElementById('max-score').textContent=questions.length;
  const pct=Math.round((score/questions.length)*100);
  const msg=document.getElementById('result-msg');
  if(msg)msg.textContent=pct===100?'Perfect score!':pct>=80?'Great job!':pct>=60?'Good effort!':'Keep practicing!';
  showScreen('result-screen');
}`,
  },
  memory: {
    description: 'Flip-card matching game: find all emoji pairs to win. Track moves. 4x4 grid (8 pairs).',
    elements: '#start-screen | #game-screen(.screen hidden, contains #card-grid) | #result-screen(.screen hidden) | #moves-count | #win-moves',
    coreJS: `const SYMBOLS=['🦊','🐬','🌟','🎮','🍕','🚀','🎨','🦋'];
let flipped=[],matched=0,moves=0,locked=false;
let _ac=null;
function playTone(f,t,d,v){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain();o.connect(g);g.connect(_ac.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(v||0.12,_ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+(d||0.1));o.start();o.stop(_ac.currentTime+(d||0.1));}catch(e){}}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.className='screen');document.getElementById(id).className='screen active';}
function cardBurst(card){
  const grid=document.getElementById('card-grid');
  const gr=grid.getBoundingClientRect(),r=card.getBoundingClientRect();
  const cx=r.left-gr.left+r.width/2,cy=r.top-gr.top+r.height/2;
  grid.style.position='relative';
  for(let i=0;i<10;i++){
    const p=document.createElement('div');p.className='particle';
    const a=(i/10)*Math.PI*2,d=30+Math.random()*30;
    p.style.cssText='width:8px;height:8px;background:var(--accent);left:'+cx+'px;top:'+cy+'px;--tx:'+Math.cos(a)*d+'px;--ty:'+Math.sin(a)*d+'px';
    grid.appendChild(p);setTimeout(()=>p.remove(),700);
  }
}
function startGame(){
  flipped=[];matched=0;moves=0;locked=false;
  const pairs=[...SYMBOLS,...SYMBOLS].sort(()=>Math.random()-.5);
  const grid=document.getElementById('card-grid');grid.innerHTML='';
  pairs.forEach(sym=>{
    const card=document.createElement('div');card.className='mem-card';
    card.style.cssText='width:72px;height:72px';
    card.innerHTML='<div class="card-inner"><div class="card-front">?</div><div class="card-back">'+sym+'</div></div>';
    card.dataset.sym=sym;card.onclick=()=>flipCard(card);
    grid.appendChild(card);
  });
  updateMoves();showScreen('game-screen');
}
function flipCard(card){
  if(locked||card.classList.contains('flipped')||card.classList.contains('matched'))return;
  card.classList.add('flipped');flipped.push(card);playTone(440,'triangle',0.07);
  if(flipped.length===2){locked=true;moves++;updateMoves();checkMatch();}
}
function checkMatch(){
  const[a,b]=flipped;
  if(a.dataset.sym===b.dataset.sym){
    a.classList.add('matched');b.classList.add('matched');matched++;flipped=[];locked=false;
    playTone(660,'triangle',0.18);cardBurst(a);cardBurst(b);
    if(matched===SYMBOLS.length)setTimeout(showWin,600);
  }else{
    [a,b].forEach(c=>{c.querySelector('.card-back').style.background='var(--danger)';c.style.animation='shake .38s ease';});
    playTone(180,'sawtooth',0.12,0.14);
    setTimeout(()=>{a.classList.remove('flipped');b.classList.remove('flipped');[a,b].forEach(c=>{c.querySelector('.card-back').style.background='';c.style.animation='';});flipped=[];locked=false;},900);
  }
}
function showWin(){document.getElementById('win-moves').textContent=moves;showScreen('result-screen');}
function updateMoves(){document.getElementById('moves-count').textContent=moves;}`,
  },
  reaction: {
    description: 'Tap the glowing target as fast as possible when it appears. 5 rounds. Shows average ms.',
    elements: '#start-screen | #game-screen(.screen hidden) | #result-screen(.screen hidden) | #big-target(large circle, hidden initially) | #round-display | #status-text | #avg-time',
    coreJS: `let rounds=5,cur=0,times=[],streak=0,best=Infinity,waiting=false,startTime,waitTimer;
let _ac=null;
function playTone(f,t,d,v){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain();o.connect(g);g.connect(_ac.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(v||0.12,_ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+(d||0.1));o.start();o.stop(_ac.currentTime+(d||0.1));}catch(e){}}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.className='screen');document.getElementById(id).className='screen active';}
function rateMs(ms){
  if(ms<200)return{label:'LIGHTNING FAST',color:'var(--accent)'};
  if(ms<350)return{label:'Fast!',color:'var(--success)'};
  if(ms<550)return{label:'Average',color:'var(--primary)'};
  return{label:'Too Slow...',color:'var(--muted)'};
}
function startGame(){cur=0;times=[];streak=0;best=Infinity;showScreen('game-screen');document.getElementById('round-display').textContent='1 / '+rounds;setStatus('Get ready...');scheduleNext();}
function scheduleNext(){
  waiting=false;
  const tgt=document.getElementById('big-target');
  tgt.style.display='none';tgt.style.animation='';tgt.style.background='var(--primary)';
  setStatus(cur>0?'Round '+(cur+1)+' — wait for the glow...':'Get ready...');
  waitTimer=setTimeout(()=>{waiting=true;startTime=Date.now();tgt.style.display='flex';tgt.style.animation='glow .5s ease infinite';setStatus('TAP NOW!');playTone(880,'triangle',0.1);},1200+Math.random()*2800);
}
function onTap(){
  if(!waiting){
    clearTimeout(waitTimer);setStatus('Too early! +300ms penalty');playTone(200,'sawtooth',0.1);
    times.push(999);cur++;document.getElementById('round-display').textContent=Math.min(cur+1,rounds)+' / '+rounds;
    setTimeout(()=>{if(cur>=rounds)setTimeout(showResult,1200);else scheduleNext();},1000);return;
  }
  const ms=Date.now()-startTime;times.push(ms);waiting=false;cur++;
  if(ms<best)best=ms;
  const rating=rateMs(ms);
  document.getElementById('big-target').style.display='none';
  if(ms<350)streak++;else streak=0;
  const statusEl=document.getElementById('status-text');
  statusEl.style.color=rating.color;
  setStatus(ms+'ms — '+rating.label+(streak>=3?' — STREAK x'+streak+'!':''));
  if(ms<350)playTone(660,'triangle',0.15);
  document.getElementById('round-display').textContent=Math.min(cur+1,rounds)+' / '+rounds;
  if(cur>=rounds)setTimeout(showResult,1400);else setTimeout(scheduleNext,1100);
}
function showResult(){
  const valid=times.filter(t=>t<900);
  const avg=valid.length?Math.round(valid.reduce((a,b)=>a+b)/valid.length):999;
  const rating=rateMs(avg);
  document.getElementById('avg-time').textContent=avg+'ms';
  const rl=document.getElementById('rating-label');if(rl){rl.textContent=rating.label;rl.style.color=rating.color;}
  const bl=document.getElementById('best-time');if(bl)bl.textContent=(best<900?best:'-')+'ms';
  showScreen('result-screen');
}
function setStatus(msg){const el=document.getElementById('status-text');if(el)el.textContent=msg;}`,
  },
  runner: {
    description: 'Side-scrolling runner: jump over obstacles with spacebar or tap. Score = distance. Canvas-based.',
    elements: '#start-screen | #game-screen(.screen hidden, contains canvas#game-canvas width=480 height=260) | #result-screen(.screen hidden) | #score-display | #final-score',
    coreJS: `let canvas,ctx,player,obstacles,coins,parts,score,speed,raf,running;
const GND=210,CW=480,CH=260;
let _ac=null;
function playTone(f,t,d,v){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain();o.connect(g);g.connect(_ac.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(v||0.12,_ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+(d||0.1));o.start();o.stop(_ac.currentTime+(d||0.1));}catch(e){}}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.className='screen');document.getElementById(id).className='screen active';}
function rrect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function addParts(x,y,n,clr){for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-0.5)*4,vy:-2-Math.random()*3,life:1,color:clr});}
function initCanvas(){
  canvas=document.getElementById('game-canvas');ctx=canvas.getContext('2d');
  canvas.width=CW;canvas.height=CH;
  canvas.onclick=canvas.ontouchstart=e=>{e.preventDefault();running?jump():startGame();};
}
document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();running?jump():startGame();}});
function startGame(){
  if(!canvas)initCanvas();
  player={x:70,y:GND,w:36,h:36,vy:0,grounded:true,trail:[]};
  obstacles=[];coins=[];parts=[];score=0;speed=4;running=true;
  showScreen('game-screen');loop();
}
function jump(){if(player.grounded){player.vy=-16;player.grounded=false;playTone(440,'triangle',0.12);addParts(player.x+18,GND+36,6,'rgba(255,230,80,0.9)');}}
function loop(){
  if(!running)return;raf=requestAnimationFrame(loop);
  ctx.clearRect(0,0,CW,CH);
  player.vy+=0.85;player.y+=player.vy;
  if(player.y>=GND){player.y=GND;player.vy=0;player.grounded=true;}
  player.trail.unshift({x:player.x,y:player.y});if(player.trail.length>8)player.trail.pop();
  if(Math.random()<0.024)obstacles.push({x:CW,y:GND,w:22+Math.random()*14,h:38+Math.random()*22});
  if(Math.random()<0.018)coins.push({x:CW,y:GND-65-Math.random()*45,r:9,hit:false});
  speed+=0.0025;
  obstacles.forEach(o=>o.x-=speed);coins.forEach(c=>c.x-=speed);
  obstacles=obstacles.filter(o=>o.x>-60);
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.18;p.life-=0.04;});
  parts=parts.filter(p=>p.life>0);
  coins.forEach(c=>{if(!c.hit&&Math.abs(player.x+18-c.x)<22&&Math.abs(player.y+18-c.y)<22){c.hit=true;score+=50;playTone(660,'triangle',0.1);addParts(c.x,c.y,8,'gold');}});
  coins=coins.filter(c=>!c.hit);
  score++;
  document.getElementById('score-display').textContent=Math.floor(score/10);
  draw();
  if(obstacles.some(o=>player.x+4<o.x+o.w&&player.x+player.w-4>o.x&&player.y+player.h>o.y&&player.y<o.y+o.h))endGame();
}
function draw(){
  ctx.fillStyle='rgba(100,80,180,0.06)';ctx.fillRect(0,0,CW,CH);
  ctx.fillStyle='rgba(120,120,200,0.18)';ctx.fillRect(0,GND+player.h,CW,CH);
  ctx.fillStyle='rgba(140,140,210,0.4)';ctx.fillRect(0,GND+player.h-2,CW,3);
  player.trail.forEach((pt,i)=>{ctx.globalAlpha=(1-i/8)*0.22;ctx.fillStyle='#8B5CF6';rrect(pt.x,pt.y,player.w*(1-i/12),player.h*(1-i/12),6);ctx.fill();});
  ctx.globalAlpha=1;
  ctx.fillStyle='#7C3AED';rrect(player.x,player.y,player.w,player.h,7);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.4)';ctx.fillRect(player.x+7,player.y+7,8,8);
  ctx.fillStyle='#EF4444';obstacles.forEach(o=>{rrect(o.x,o.y-o.h,o.w,o.h,5);ctx.fill();});
  coins.forEach(c=>{ctx.fillStyle='gold';ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.arc(c.x-2,c.y-2,c.r/3,0,Math.PI*2);ctx.fill();});
  parts.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();});
  ctx.globalAlpha=1;
}
function endGame(){running=false;cancelAnimationFrame(raf);document.getElementById('final-score').textContent=Math.floor(score/10);playTone(200,'sawtooth',0.35,0.18);showScreen('result-screen');}`,
  },
  soccer: {
    description: 'Penalty kick soccer game: player aims and clicks to shoot at the goal, goalie dives to block. 5 kicks per match. Real ball movement, goal detection, score tracking, restart.',
    elements: '#start-screen(.screen.active) | #game-screen(.screen hidden, contains #goal-area #ball #goalie #kick-msg) | #result-screen(.screen hidden) | #score-display | #shot-count | #final-score | #final-attempts',
    coreJS: `let score=0,shot=0,totalShots=5,shooting=false;
let _ac=null;
function playTone(f,t,d,v){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain();o.connect(g);g.connect(_ac.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(v||0.15,_ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+(d||0.1));o.start();o.stop(_ac.currentTime+(d||0.1));}catch(e){}}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.className='screen');document.getElementById(id).className='screen active';}
function goalParticles(){
  const area=document.getElementById('goal-area');const CLRS=['gold','white','var(--accent)','var(--primary)','#fff'];
  for(let i=0;i<18;i++){
    const p=document.createElement('div');p.className='particle';
    const ang=Math.random()*Math.PI*2,d=44+Math.random()*56;
    p.style.cssText='width:'+(6+Math.random()*8)+'px;height:'+(6+Math.random()*8)+'px;background:'+CLRS[i%5]+';position:absolute;left:50%;top:30%;--tx:'+Math.cos(ang)*d+'px;--ty:'+Math.sin(ang)*d+'px;border-radius:50%';
    area.appendChild(p);setTimeout(()=>p.remove(),900);
  }
}
function startGame(){
  score=0;shot=0;shooting=false;
  document.getElementById('score-display').textContent=0;
  showScreen('game-screen');resetShot();
}
function updateShotCount(){document.getElementById('shot-count').textContent='Kick '+(shot+1)+' of '+totalShots;}
function resetShot(){
  if(shot>=totalShots){return endGame();}
  shooting=false;
  const ball=document.getElementById('ball');
  ball.style.transition='none';ball.style.left='50%';ball.style.bottom='24px';
  ball.style.transform='translateX(-50%) scale(1) rotate(0deg)';ball.style.opacity='1';ball.style.filter='';
  const goalie=document.getElementById('goalie');
  goalie.style.transition='none';goalie.style.left='50%';goalie.style.transform='translateX(-50%)';
  const msg=document.getElementById('kick-msg');
  msg.textContent='Click the goal area to shoot!';msg.className='kick-msg';
  updateShotCount();
}
function shoot(e){
  if(shooting)return;shooting=true;
  const area=document.getElementById('goal-area');
  const rect=area.getBoundingClientRect();
  const px=(e.clientX-rect.left)/rect.width,py=(e.clientY-rect.top)/rect.height;
  const ball=document.getElementById('ball'),goalie=document.getElementById('goalie');
  ball.style.transition='all 0.52s cubic-bezier(.15,.8,.4,1.2)';
  ball.style.left=Math.round(px*100)+'%';
  ball.style.bottom=Math.round((1-py)*rect.height+24)+'px';
  ball.style.transform='translateX(-50%) scale(0.5) rotate(540deg)';
  const gz=Math.random();
  const gzName=gz<0.35?'left':gz<0.65?'center':'right';
  const gPos=gz<0.35?'16%':gz<0.65?'50%':'82%';
  const shootZone=px<0.35?'left':px<0.65?'center':'right';
  goalie.style.transition='left 0.4s cubic-bezier(.2,.8,.4,1)';
  goalie.style.left=gPos;goalie.style.transform='translateX(-50%)';
  setTimeout(()=>{
    const scored=shootZone!==gzName;
    const msg=document.getElementById('kick-msg');
    if(scored){
      score++;document.getElementById('score-display').textContent=score;
      msg.textContent='GOAL!';msg.className='kick-msg goal-msg';
      goalParticles();
      playTone(660,'triangle',0.25,0.22);setTimeout(()=>playTone(880,'triangle',0.18,0.18),140);
      ball.style.opacity='0.6';
    }else{
      msg.textContent='Saved! Aim for the open zone.';msg.className='kick-msg miss-msg';
      ball.style.filter='brightness(0.55)';
      playTone(220,'sawtooth',0.18,0.14);
    }
    shot++;setTimeout(()=>{ball.style.filter='';resetShot();},1400);
  },560);
}
function endGame(){document.getElementById('final-score').textContent=score;document.getElementById('final-attempts').textContent=totalShots;showScreen('result-screen');}
document.addEventListener('DOMContentLoaded',()=>{
  const area=document.getElementById('goal-area');
  if(area){area.addEventListener('click',shoot);area.addEventListener('touchstart',e=>{e.preventDefault();shoot(e.touches[0]);},{passive:false});}
});`,
  },

  platformer: {
    description: 'Side-scrolling platformer: jump across floating platforms, collect coins, avoid gaps, infinite-scroll world that speeds up each level.',
    coreHTML: `<div id="start-screen" class="screen active"><h1 class="gradient-text">Sky Jumper</h1><p>Jump across platforms and collect coins</p><button class="glass-btn" onclick="startGame()">Play</button></div><div id="game-screen" class="screen"><div class="hud"><span>Score: <b id="score-val">0</b></span><span>Level: <b id="level-val">1</b></span><span>Lives: <b id="lives-val">3</b></span></div><canvas id="c"></canvas></div><div id="result-screen" class="screen"><h2>Game Over</h2><p>Score: <b id="final-score">0</b></p><button class="glass-btn" onclick="startGame()">Play Again</button></div>`,
    coreCSS: `#c{display:block;width:100%;border-radius:var(--r)}canvas{touch-action:none}`,
    coreJS: `const AC=new AudioContext();
function playTone(f,t,d,v=0.18){const o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.frequency.value=f;o.type=t;g.gain.setValueAtTime(v,AC.currentTime);g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+d);o.start();o.stop(AC.currentTime+d);}
const C=document.getElementById('c'),ctx=C.getContext('2d');
let W,H,score,lives,level,spd,raf,running=false;
let px,py,pvx,pvy,onGround,jumping;
let platforms=[],coins=[];
const PW=80,PH=14,PY_BASE=0.65,GRAVITY=0.55,JUMP=-13,PLAYER_W=28,PLAYER_H=32;
function resize(){W=C.width=C.offsetWidth;H=C.height=Math.min(C.offsetWidth*0.56,380);}
function genPlatform(x){return{x,y:H*(0.4+Math.random()*0.35),w:PW+Math.random()*60,coin:Math.random()<0.6};}
function startGame(){
  resize();score=0;lives=3;level=1;spd=2.8;running=true;jumping=false;onGround=false;
  px=80;py=H*0.55;pvx=0;pvy=0;
  platforms=[{x:0,y:H*PY_BASE,w:220,coin:false}];
  for(let i=1;i<8;i++)platforms.push(genPlatform(i*160+100));
  coins=[];
  updateHUD();showScreen('game-screen');
  cancelAnimationFrame(raf);loop();
}
function updateHUD(){document.getElementById('score-val').textContent=score;document.getElementById('level-val').textContent=level;document.getElementById('lives-val').textContent=lives;}
function loop(){
  if(!running)return;
  raf=requestAnimationFrame(loop);
  ctx.clearRect(0,0,W,H);
  // bg gradient
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#1a0533');bg.addColorStop(1,'#0d1b2a');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // move world
  for(const p of platforms){p.x-=spd;}
  for(const c of coins){c.x-=spd;}
  // remove off-screen
  while(platforms.length&&platforms[0].x+platforms[0].w<-10)platforms.shift();
  while(coins.length&&coins[0].x<-20)coins.shift();
  // spawn new
  const last=platforms[platforms.length-1];
  if(last.x<W+20){
    const np=genPlatform(last.x+140+Math.random()*80);
    platforms.push(np);
    if(np.coin)coins.push({x:np.x+np.w/2-10,y:np.y-26,r:10,collected:false});
  }
  // physics
  pvy+=GRAVITY;py+=pvy;pvx*=0.88;px+=pvx;
  onGround=false;
  for(const p of platforms){
    if(px+PLAYER_W>p.x&&px<p.x+p.w&&py+PLAYER_H>p.y&&py+PLAYER_H<p.y+PH+pvy+2&&pvy>=0){
      py=p.y-PLAYER_H;pvy=0;onGround=true;
    }
  }
  // collect coins
  for(const c of coins){
    if(!c.collected&&Math.abs(px+PLAYER_W/2-c.x)<c.r+12&&Math.abs(py+PLAYER_H/2-c.y)<c.r+12){
      c.collected=true;score+=10;playTone(880,'sine',0.12);updateHUD();
    }
  }
  // fell off
  if(py>H+40){
    lives--;updateHUD();playTone(150,'sawtooth',0.4,0.25);
    if(lives<=0){running=false;document.getElementById('final-score').textContent=score;showScreen('result-screen');return;}
    px=80;py=H*0.3;pvy=0;
  }
  // level up
  if(score>0&&score%(level*50)===0&&score>0){level++;spd+=0.4;playTone(660,'sine',0.2);}
  // draw platforms
  ctx.fillStyle='#7c3aed';
  for(const p of platforms){ctx.beginPath();ctx.roundRect(p.x,p.y,p.w,PH,6);ctx.fill();}
  // draw coins
  ctx.fillStyle='#fbbf24';
  for(const c of coins){if(!c.collected){ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fill();}}
  // draw player
  ctx.fillStyle='#f97316';
  ctx.beginPath();ctx.roundRect(px,py,PLAYER_W,PLAYER_H,6);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px+9,py+9,4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(px+19,py+9,4,0,Math.PI*2);ctx.fill();
}
function doJump(){if(onGround){pvy=JUMP;onGround=false;playTone(440,'square',0.08,0.12);}}
document.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();doJump();}});
document.addEventListener('touchstart',e=>{if(document.getElementById('game-screen').classList.contains('active')){e.preventDefault();doJump();}},{passive:false});
window.addEventListener('resize',()=>{if(running)resize();});`,
  },

  dodge: {
    description: 'Dodge falling objects: move left/right to survive as increasingly faster obstacles rain down. Lives system, high score.',
    coreHTML: `<div id="start-screen" class="screen active"><h1 class="gradient-text">Dodge!</h1><p>Avoid falling obstacles</p><button class="glass-btn" onclick="startGame()">Play</button></div><div id="game-screen" class="screen"><div class="hud"><span>Score: <b id="score-val">0</b></span><span>Lives: <b id="lives-val">3</b></span><span>Best: <b id="best-val">0</b></span></div><div id="arena" class="game-area" style="height:340px"></div></div><div id="result-screen" class="screen"><h2>Wiped Out!</h2><p>Score: <b id="final-score">0</b></p><button class="glass-btn" onclick="startGame()">Again</button></div>`,
    coreCSS: `#arena{background:linear-gradient(180deg,#0f0c29,#302b63)}#player{position:absolute;bottom:28px;width:44px;height:44px;border-radius:50%;background:var(--primary);transition:left .06s linear;box-shadow:0 0 18px var(--primary)}#player.hit{animation:hud-flash .3s ease}`,
    coreJS: `const AC=new AudioContext();
function playTone(f,t,d,v=0.18){const o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.frequency.value=f;o.type=t;g.gain.setValueAtTime(v,AC.currentTime);g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+d);o.start();o.stop(AC.currentTime+d);}
let score,lives,best=0,spawnMs,diffMs,running=false,playerX,arenaW,intervals=[];
const arena=document.getElementById('arena')||(()=>{const d=document.createElement('div');d.id='arena';return d;})();
function clearIntervals(){intervals.forEach(clearInterval);intervals=[];}
function px2pct(x){return Math.max(0,Math.min(arenaW-44,x));}
function startGame(){
  arena.innerHTML='';
  const pl=document.createElement('div');pl.id='player';arena.appendChild(pl);
  arenaW=arena.offsetWidth;playerX=arenaW/2-22;pl.style.left=playerX+'px';
  score=0;lives=3;spawnMs=900;diffMs=0;running=true;
  updateHUD();showScreen('game-screen');
  clearIntervals();
  intervals.push(setInterval(()=>{score++;updateHUD();},100));
  intervals.push(setInterval(spawnObstacle,spawnMs));
  intervals.push(setInterval(()=>{spawnMs=Math.max(300,spawnMs-40);clearIntervals();if(running){intervals.push(setInterval(()=>{score++;updateHUD();},100));intervals.push(setInterval(spawnObstacle,spawnMs));}},4000));
}
function updateHUD(){document.getElementById('score-val').textContent=score;document.getElementById('lives-val').textContent=lives;document.getElementById('best-val').textContent=best;}
function spawnObstacle(){
  if(!running)return;
  const ob=document.createElement('div');
  const sz=28+Math.random()*20;
  ob.style.cssText='position:absolute;border-radius:6px;background:#ef4444;width:'+sz+'px;height:'+sz+'px;top:-'+sz+'px;left:'+(Math.random()*(arenaW-sz))+'px;transition:top '+(1.2-Math.min(0.7,(score/3000)))+'s linear';
  arena.appendChild(ob);
  requestAnimationFrame(()=>{ob.style.top=(arena.offsetHeight+10)+'px';});
  const dur=(1.3-Math.min(0.75,(score/3000)))*1000;
  setTimeout(()=>{
    const pl=document.getElementById('player');if(!pl)return;
    const pr=pl.getBoundingClientRect(),or=ob.getBoundingClientRect();
    if(pr.left<or.right-8&&pr.right>or.left+8&&pr.top<or.bottom-8&&pr.bottom>or.top+8){
      lives--;playTone(180,'sawtooth',0.35,0.3);pl.classList.add('hit');setTimeout(()=>pl.classList.remove('hit'),300);
      updateHUD();if(lives<=0){running=false;clearIntervals();best=Math.max(best,score);document.getElementById('final-score').textContent=score;showScreen('result-screen');}
    }
    ob.remove();
  },dur+200);
}
// mouse/touch movement
document.addEventListener('mousemove',e=>{
  if(!running)return;
  const r=arena.getBoundingClientRect();
  playerX=px2pct(e.clientX-r.left-22);
  const pl=document.getElementById('player');if(pl)pl.style.left=playerX+'px';
});
arena.addEventListener('touchmove',e=>{
  e.preventDefault();
  const r=arena.getBoundingClientRect();
  playerX=px2pct(e.touches[0].clientX-r.left-22);
  const pl=document.getElementById('player');if(pl)pl.style.left=playerX+'px';
},{passive:false});`,
  },

  typing: {
    description: 'Type the displayed word before time runs out. Streak multiplier for consecutive hits. Speed and word length increase each level.',
    elements: '#start-screen(.screen.active) | #game-screen(.screen) | #result-screen(.screen) | #word-display(large centered word, animated) | #type-input(text input, autofocus) | #score-display(.hud-flash) | #time-display(.timer-num, .danger at ≤10s) | #level-display | #feedback(streak/score messages) | #final-score',
    coreJS: `let _ac=null;
function playTone(f,t,d,v){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain();o.connect(g);g.connect(_ac.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(v||0.15,_ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+(d||0.1));o.start();o.stop(_ac.currentTime+(d||0.1));}catch(e){}}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.className='screen');document.getElementById(id).className='screen active';}
function flashEl(id){const el=document.getElementById(id);if(!el)return;el.classList.remove('hud-flash');void el.offsetWidth;el.classList.add('hud-flash');}
const WORDS=['apple','brave','cloud','dance','earth','flame','ghost','heart','laser','magic','noble','ocean','piano','storm','tiger','ultra','water','young','zebra','code','loop','data','byte','game','star','jump','fast','bold','neon','pixel','quest','realm','swift','vault','wraith','xenon'];
let score=0,timeLeft=45,clockTimer,currentWord='',streak=0,level=1;
function startGame(){
  score=0;timeLeft=45;streak=0;level=1;
  clearInterval(clockTimer);
  document.getElementById('time-display').classList.remove('danger');
  updateHUD();showScreen('game-screen');nextWord();
  setTimeout(()=>document.getElementById('type-input').focus(),100);
  clockTimer=setInterval(()=>{
    timeLeft--;updateHUD();
    if(timeLeft<=10)document.getElementById('time-display').classList.add('danger');
    if(timeLeft<=0)endGame();
  },1000);
}
function nextWord(){
  const pool=level>=3?WORDS:WORDS.filter(w=>w.length<=4+level);
  currentWord=pool[Math.floor(Math.random()*pool.length)];
  const wd=document.getElementById('word-display');
  if(wd){wd.textContent=currentWord;wd.style.animation='none';void wd.offsetWidth;wd.style.animation='popIn .3s ease';}
  document.getElementById('type-input').value='';
  document.getElementById('feedback').textContent='';
}
function checkInput(){
  const val=(document.getElementById('type-input').value||'').trim().toLowerCase();
  if(val===currentWord){
    streak++;const mult=streak>=5?3:streak>=3?2:1;const pts=currentWord.length*2*mult;
    score+=pts;playTone(mult>1?880:660,'triangle',0.1);
    document.getElementById('feedback').textContent=mult>1?'STREAK x'+mult+'! +'+pts:'+'+pts;
    document.getElementById('feedback').style.color=mult>1?'var(--accent)':'var(--success)';
    flashEl('score-display');
    if(score>=level*100){level++;timeLeft=Math.min(timeLeft+6,60);}
    nextWord();updateHUD();
  }else if(currentWord&&!currentWord.startsWith(val)){
    streak=0;
    const inp=document.getElementById('type-input');
    inp.style.animation='shake .3s ease';setTimeout(()=>inp.style.animation='',350);
  }
}
function updateHUD(){
  document.getElementById('score-display').textContent=score;
  document.getElementById('time-display').textContent=timeLeft;
  document.getElementById('level-display').textContent=level;
}
function endGame(){
  clearInterval(clockTimer);
  document.getElementById('final-score').textContent=score;
  showScreen('result-screen');playTone(220,'sawtooth',0.35,0.2);
}
document.addEventListener('DOMContentLoaded',()=>{
  const inp=document.getElementById('type-input');
  if(inp)inp.addEventListener('input',checkInput);
});`,
  },

  tower: {
    description: 'Tower defense: enemies walk a winding path toward the base, player clicks to place towers (costs gold) that auto-shoot. Waves get bigger each round.',
    elements: '#start-screen(.screen.active) | #game-screen(.screen, contains canvas#c) | #result-screen(.screen) | #score-display | #gold-display | #lives-display | #wave-display | #final-score | place-tower-btn (optional UI)',
    coreJS: `const C=document.getElementById('c'),ctx=C.getContext('2d');
let W,H,raf,running=false,score=0,gold=120,lives=10,wave=0,frame=0;
let enemies=[],towers=[],bullets=[],path=[];
let _ac=null;
function playTone(f,t,d,v){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain();o.connect(g);g.connect(_ac.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(v||0.12,_ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+(d||0.1));o.start();o.stop(_ac.currentTime+(d||0.1));}catch(e){}}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.className='screen');document.getElementById(id).className='screen active';}
function resize(){C.width=W=C.offsetWidth;C.height=H=Math.min(W*0.6,360);buildPath();}
function buildPath(){path=[{x:0,y:H*.18},{x:W*.28,y:H*.18},{x:W*.28,y:H*.55},{x:W*.65,y:H*.55},{x:W*.65,y:H*.28},{x:W,y:H*.28}];}
function posOnPath(t){
  let total=0,segs=[];
  for(let i=1;i<path.length;i++){const dx=path[i].x-path[i-1].x,dy=path[i].y-path[i-1].y,l=Math.hypot(dx,dy);segs.push({dx,dy,l,cum:total});total+=l;}
  const dist=Math.min(t,1)*total;
  for(let i=segs.length-1;i>=0;i--){if(dist>=segs[i].cum){const r=(dist-segs[i].cum)/segs[i].l;return{x:path[i].x+segs[i].dx*r,y:path[i].y+segs[i].dy*r};}}
  return{x:path[0].x,y:path[0].y};
}
function spawnWave(){
  wave++;const count=3+wave*2;
  for(let i=0;i<count;i++)enemies.push({t:0,speed:0.00035+wave*0.00004,hp:1+Math.ceil(wave/2),maxHp:1+Math.ceil(wave/2),alive:true,delay:i*0.9});
}
function startGame(){
  resize();score=0;gold=120;lives=10;wave=0;frame=0;running=true;
  enemies=[];towers=[];bullets=[];
  updateHUD();showScreen('game-screen');cancelAnimationFrame(raf);spawnWave();loop();
}
function loop(){
  if(!running)return;raf=requestAnimationFrame(loop);frame++;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#14532d';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#a16207';ctx.lineWidth=24;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
  ctx.strokeStyle='#ca8a04';ctx.lineWidth=18;
  ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
  for(const t of towers){
    ctx.fillStyle='#1d4ed8';ctx.strokeStyle='rgba(59,130,246,0.2)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(t.x,t.y,13,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(t.x,t.y,t.range,0,Math.PI*2);ctx.stroke();
    t.cd=Math.max(0,(t.cd||0)-1);
    if(!t.cd){
      const tgt=enemies.find(e=>e.alive&&!e.delay&&Math.hypot(posOnPath(e.t).x-t.x,posOnPath(e.t).y-t.y)<t.range);
      if(tgt){const tp=posOnPath(tgt.t);bullets.push({x:t.x,y:t.y,tx:tp.x,ty:tp.y,target:tgt});t.cd=Math.max(8,38-wave*2);}
    }
  }
  bullets=bullets.filter(b=>{
    const dx=b.tx-b.x,dy=b.ty-b.y,d=Math.hypot(dx,dy);
    if(d<7){
      if(b.target.alive){b.target.hp--;if(b.target.hp<=0){b.target.alive=false;score+=8+wave;gold+=4+wave;updateHUD();playTone(660,'triangle',0.07);}}
      return false;
    }
    const spd=6;b.x+=dx/d*spd;b.y+=dy/d*spd;
    ctx.fillStyle='#fbbf24';ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill();
    return true;
  });
  let allDone=true;
  enemies=enemies.filter(e=>{
    if(e.delay>0){e.delay-=1/60;allDone=false;return true;}
    if(!e.alive)return false;
    e.t=Math.min(1,e.t+e.speed);allDone=false;
    const p=posOnPath(e.t),pct=e.hp/e.maxHp;
    ctx.fillStyle=\`hsl(\${Math.round(120*pct)},80%,45%)\`;
    ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.45)';ctx.fillRect(p.x-11,p.y-19,22,5);
    ctx.fillStyle='#22c55e';ctx.fillRect(p.x-11,p.y-19,22*pct,5);
    if(e.t>=1){lives--;updateHUD();playTone(200,'sawtooth',0.15);if(lives<=0){running=false;cancelAnimationFrame(raf);document.getElementById('final-score').textContent=score;showScreen('result-screen');}return false;}
    return true;
  });
  if(allDone&&running)setTimeout(spawnWave,1400);
}
function updateHUD(){
  document.getElementById('score-display').textContent=score;
  document.getElementById('gold-display').textContent=gold;
  document.getElementById('lives-display').textContent=lives;
  document.getElementById('wave-display').textContent=wave;
}
function tryPlaceTower(mx,my){
  if(!running||gold<20)return;
  const onPath=path.some((p,i)=>{if(!i)return false;const prev=path[i-1];const dx=p.x-prev.x,dy=p.y-prev.y,t2=Math.max(0,Math.min(1,((mx-prev.x)*dx+(my-prev.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(mx-(prev.x+t2*dx),my-(prev.y+t2*dy))<22;});
  if(!onPath){towers.push({x:mx,y:my,range:80,cd:0});gold-=20;updateHUD();playTone(440,'square',0.1);}
}
C.addEventListener('click',e=>{const r=C.getBoundingClientRect();tryPlaceTower(e.clientX-r.left,e.clientY-r.top);});
C.addEventListener('touchstart',e=>{e.preventDefault();const r=C.getBoundingClientRect();tryPlaceTower(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top);},{passive:false});
window.addEventListener('resize',()=>{if(running)resize();});`,
  },

  maze: {
    description: 'Navigate a procedurally generated maze from top-left to bottom-right exit. Faster = more points. Maze grows each level.',
    elements: '#start-screen(.screen.active) | #game-screen(.screen, contains canvas#c) | #result-screen(.screen) | #score-display | #level-display | #final-score | #final-level',
    coreJS: `const C=document.getElementById('c'),ctx=C.getContext('2d');
let W,COLS,ROWS,CS,grid,player,exitPos,running=false,score=0,level=1,startTime;
let _ac=null;
function playTone(f,t,d,v){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain();o.connect(g);g.connect(_ac.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(v||0.12,_ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+(d||0.1));o.start();o.stop(_ac.currentTime+(d||0.1));}catch(e){}}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.className='screen');document.getElementById(id).className='screen active';}
function idx(c,r){return r*COLS+c;}
function generateMaze(){
  grid=Array.from({length:COLS*ROWS},()=>({walls:[true,true,true,true],visited:false}));
  const stack=[];let curr=0;grid[0].visited=true;stack.push(0);
  const DIR=[[0,-1,0,2],[1,0,1,3],[0,1,2,0],[-1,0,3,1]];
  while(stack.length){
    const c=curr%COLS,r=Math.floor(curr/COLS),nbrs=[];
    DIR.forEach(([dc,dr,w,ow])=>{const nc=c+dc,nr=r+dr;if(nc>=0&&nc<COLS&&nr>=0&&nr<ROWS&&!grid[idx(nc,nr)].visited)nbrs.push([nc,nr,w,ow]);});
    if(nbrs.length){const[nc,nr,w,ow]=nbrs[Math.floor(Math.random()*nbrs.length)];const ni=idx(nc,nr);grid[curr].walls[w]=false;grid[ni].walls[ow]=false;grid[ni].visited=true;stack.push(curr);curr=ni;}
    else curr=stack.pop();
  }
}
function startGame(){
  COLS=Math.min(13,5+level*2);ROWS=Math.min(13,5+level*2);
  C.width=W=C.height=Math.min(C.offsetWidth,380);CS=Math.floor(W/COLS);
  generateMaze();player={c:0,r:0};exitPos={c:COLS-1,r:ROWS-1};startTime=Date.now();running=true;
  updateHUD();showScreen('game-screen');draw();
}
function draw(){
  ctx.clearRect(0,0,W,W);
  ctx.fillStyle='#0f0c29';ctx.fillRect(0,0,W,W);
  const ox=Math.floor((W-COLS*CS)/2),oy=Math.floor((W-ROWS*CS)/2);
  ctx.strokeStyle='#7c3aed';ctx.lineWidth=2;ctx.lineCap='square';
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const cell=grid[idx(c,r)],x=ox+c*CS,y=oy+r*CS;
    if(cell.walls[0]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+CS,y);ctx.stroke();}
    if(cell.walls[1]){ctx.beginPath();ctx.moveTo(x+CS,y);ctx.lineTo(x+CS,y+CS);ctx.stroke();}
    if(cell.walls[2]){ctx.beginPath();ctx.moveTo(x,y+CS);ctx.lineTo(x+CS,y+CS);ctx.stroke();}
    if(cell.walls[3]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+CS);ctx.stroke();}
  }
  ctx.fillStyle='#22c55e';ctx.beginPath();ctx.arc(ox+exitPos.c*CS+CS/2,oy+exitPos.r*CS+CS/2,CS*.32,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f97316';ctx.beginPath();ctx.arc(ox+player.c*CS+CS/2,oy+player.r*CS+CS/2,CS*.3,0,Math.PI*2);ctx.fill();
}
function move(dc,dr){
  if(!running)return;
  const w=dc===0&&dr===-1?0:dc===1?1:dc===0&&dr===1?2:3;
  if(!grid[idx(player.c,player.r)].walls[w]){player.c+=dc;player.r+=dr;playTone(440,'sine',0.06,0.07);draw();}
  if(player.c===exitPos.c&&player.r===exitPos.r){
    const elapsed=Math.floor((Date.now()-startTime)/1000);
    const bonus=Math.max(0,30-elapsed)*3;score+=50+bonus;level++;
    playTone(880,'triangle',0.3);updateHUD();
    setTimeout(startGame,700);
  }
}
function updateHUD(){document.getElementById('score-display').textContent=score;document.getElementById('level-display').textContent=level;}
document.addEventListener('keydown',e=>{
  if(!running)return;
  if(e.key==='ArrowUp'||e.key==='w'){e.preventDefault();move(0,-1);}
  if(e.key==='ArrowDown'||e.key==='s'){e.preventDefault();move(0,1);}
  if(e.key==='ArrowLeft'||e.key==='a'){e.preventDefault();move(-1,0);}
  if(e.key==='ArrowRight'||e.key==='d'){e.preventDefault();move(1,0);}
});
let tx=0,ty=0;
C.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
C.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
  if(Math.abs(dx)>Math.abs(dy))move(dx>0?1:-1,0);else move(0,dy>0?1:-1);
},{passive:true});`,
  },

  survival: {
    description: 'Top-down survival: enemies chase the player, dodge them as long as possible. Collect health pickups. Enemy speed and count grow each wave.',
    elements: '#start-screen(.screen.active) | #game-screen(.screen, contains canvas#c) | #result-screen(.screen) | #score-display(time survived) | #level-display | #final-score | #best-score | move with WASD/arrows or finger drag on canvas',
    coreJS: `const C=document.getElementById('c'),ctx=C.getContext('2d');
let W,H,raf,running=false,score=0,best=0,level=1,frame=0;
let player,enemies,pickups,keys={},mouseX=0,mouseY=0,useMouse=false;
let _ac=null;
function playTone(f,t,d,v){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain();o.connect(g);g.connect(_ac.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(v||0.12,_ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+(d||0.1));o.start();o.stop(_ac.currentTime+(d||0.1));}catch(e){}}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.className='screen');document.getElementById(id).className='screen active';}
function resize(){C.width=W=C.offsetWidth;C.height=H=Math.min(C.offsetWidth,360);}
function startGame(){
  resize();score=0;level=1;frame=0;running=true;
  player={x:W/2,y:H/2,r:13,hp:5,maxHp:5,invul:0,speed:3};
  enemies=[];pickups=[];
  updateHUD();showScreen('game-screen');cancelAnimationFrame(raf);loop();
}
function loop(){
  if(!running)return;raf=requestAnimationFrame(loop);frame++;
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W);bg.addColorStop(0,'#1a0533');bg.addColorStop(1,'#0d0d1a');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  score++;
  if(frame%300===0){level++;player.speed=Math.min(5.5,player.speed+0.25);}
  if(frame%(Math.max(35,90-level*7))===0){
    const side=Math.floor(Math.random()*4);
    let ex,ey;
    if(side===0){ex=Math.random()*W;ey=-20;}
    else if(side===1){ex=W+20;ey=Math.random()*H;}
    else if(side===2){ex=Math.random()*W;ey=H+20;}
    else{ex=-20;ey=Math.random()*H;}
    enemies.push({x:ex,y:ey,r:11,spd:0.9+level*0.15+Math.random()*0.4,hp:1+Math.floor(level/3)});
  }
  if(frame%200===0)pickups.push({x:20+Math.random()*(W-40),y:20+Math.random()*(H-40)});
  let dx=0,dy=0;
  if(keys['ArrowLeft']||keys['a'])dx-=player.speed;
  if(keys['ArrowRight']||keys['d'])dx+=player.speed;
  if(keys['ArrowUp']||keys['w'])dy-=player.speed;
  if(keys['ArrowDown']||keys['s'])dy+=player.speed;
  if(useMouse){const mdx=mouseX-player.x,mdy=mouseY-player.y,d=Math.hypot(mdx,mdy);if(d>5){dx=mdx/d*player.speed;dy=mdy/d*player.speed;}}
  player.x=Math.max(player.r,Math.min(W-player.r,player.x+dx));
  player.y=Math.max(player.r,Math.min(H-player.r,player.y+dy));
  if(player.invul>0)player.invul--;
  pickups=pickups.filter(p=>{
    if(Math.hypot(p.x-player.x,p.y-player.y)<18){player.hp=Math.min(player.maxHp,player.hp+1);playTone(660,'sine',0.1);updateHUD();return false;}
    ctx.fillStyle='#22c55e';ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.fillRect(p.x-3,p.y-1,6,2);ctx.fillRect(p.x-1,p.y-3,2,6);
    return true;
  });
  enemies=enemies.filter(e=>{
    const ang=Math.atan2(player.y-e.y,player.x-e.x);e.x+=Math.cos(ang)*e.spd;e.y+=Math.sin(ang)*e.spd;
    if(Math.hypot(e.x-player.x,e.y-player.y)<e.r+player.r&&player.invul===0){
      player.hp--;player.invul=70;playTone(200,'sawtooth',0.2);updateHUD();
      if(player.hp<=0){running=false;cancelAnimationFrame(raf);best=Math.max(best,score);
        document.getElementById('final-score').textContent=Math.floor(score/60);
        document.getElementById('best-score').textContent=Math.floor(best/60);
        showScreen('result-screen');return true;}
    }
    ctx.fillStyle=e.hp>1?'#a855f7':'#ef4444';ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();
    return true;
  });
  ctx.globalAlpha=player.invul>0&&player.invul%8<4?0.35:1;
  ctx.fillStyle='#f97316';ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  const bw=100,bh=9,bx=(W-bw)/2,by=8;
  ctx.fillStyle='rgba(255,255,255,0.12)';ctx.beginPath();ctx.roundRect(bx,by,bw,bh,4);ctx.fill();
  ctx.fillStyle='#22c55e';ctx.beginPath();ctx.roundRect(bx,by,bw*(player.hp/player.maxHp),bh,4);ctx.fill();
  document.getElementById('score-display').textContent=Math.floor(score/60)+'s';
  document.getElementById('level-display').textContent=level;
}
function updateHUD(){document.getElementById('score-display').textContent=Math.floor(score/60)+'s';document.getElementById('level-display').textContent=level;}
document.addEventListener('keydown',e=>keys[e.key]=true);
document.addEventListener('keyup',e=>keys[e.key]=false);
C.addEventListener('mousemove',e=>{const r=C.getBoundingClientRect();mouseX=e.clientX-r.left;mouseY=e.clientY-r.top;useMouse=true;});
C.addEventListener('touchmove',e=>{e.preventDefault();const r=C.getBoundingClientRect();mouseX=e.touches[0].clientX-r.left;mouseY=e.touches[0].clientY-r.top;useMouse=true;},{passive:false});
window.addEventListener('resize',()=>{if(running)resize();});`,
  },

  basketball: {
    description: 'Basketball shooting: hold to charge power, release to shoot. Land the ball in the hoop for 2 or 3 points. 30-second shot clock.',
    elements: '#start-screen(.screen.active) | #game-screen(.screen, contains canvas#c) | #result-screen(.screen) | #score-display | #time-display(.timer-num, .danger at ≤5s) | #made-display(shots made/attempted) | #final-score | #final-made | #final-shots',
    coreJS: `const C=document.getElementById('c'),ctx=C.getContext('2d');
let W,H,score=0,shots=0,made=0,timeLeft=30,timer,raf,running=false;
let power=0,powerDir=1,aiming=false,ballFlight=null,powerTick;
let _ac=null;
function playTone(f,t,d,v){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain();o.connect(g);g.connect(_ac.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(v||0.15,_ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+(d||0.1));o.start();o.stop(_ac.currentTime+(d||0.1));}catch(e){}}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.className='screen');document.getElementById(id).className='screen active';}
function resize(){C.width=W=C.offsetWidth;C.height=H=Math.min(C.offsetWidth*.72,440);}
function hx(){return W*.65;}function hy(){return H*.3;}function bx(){return W*.18;}function by(){return H*.72;}
function startGame(){
  resize();score=0;shots=0;made=0;timeLeft=30;aiming=false;ballFlight=null;running=true;power=0;
  document.getElementById('time-display').classList.remove('danger');
  updateHUD();showScreen('game-screen');clearInterval(timer);
  timer=setInterval(()=>{timeLeft--;updateHUD();if(timeLeft<=5)document.getElementById('time-display').classList.add('danger');if(timeLeft<=0)endGame();},1000);
  cancelAnimationFrame(raf);draw();
}
function beginAim(){if(!running||ballFlight)return;aiming=true;power=0;powerDir=1;clearInterval(powerTick);powerTick=setInterval(()=>{power+=powerDir*3;if(power>=100||power<=0)powerDir*=-1;draw();},18);}
function shoot(){
  if(!aiming||!running||ballFlight)return;
  clearInterval(powerTick);aiming=false;shots++;
  const frames=52,GR=0.52;
  const dx=hx()-bx(),dy=hy()-by();
  ballFlight={x:bx(),y:by(),vx:dx/frames,vy:(dy-0.5*GR*frames*frames)/frames,t:0,maxT:frames+25};
  playTone(360,'triangle',0.1);cancelAnimationFrame(raf);animBall();
}
function animBall(){
  if(!ballFlight){draw();return;}
  raf=requestAnimationFrame(animBall);
  ballFlight.t++;ballFlight.x+=ballFlight.vx;ballFlight.y+=ballFlight.vy;ballFlight.vy+=0.52;
  draw();
  const dist=Math.hypot(ballFlight.x-hx(),ballFlight.y-hy());
  if(dist<22&&ballFlight.vy>0){
    made++;score+=ballFlight.t<46?3:2;playTone(880,'triangle',0.22);updateHUD();
    ballFlight=null;cancelAnimationFrame(raf);setTimeout(()=>draw(),100);return;
  }
  if(ballFlight.t>ballFlight.maxT||ballFlight.y>H+20){playTone(200,'sawtooth',0.12);ballFlight=null;cancelAnimationFrame(raf);draw();return;}
}
function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#92400e';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#a16207';ctx.fillRect(0,H*.55,W,H*.45);
  ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(W/2,H*.55,W*.18,0,Math.PI*2);ctx.stroke();
  const HX=hx(),HY=hy();
  ctx.fillStyle='rgba(255,255,255,0.9)';ctx.fillRect(HX+8,HY-42,52,36);
  ctx.strokeStyle='#ef4444';ctx.lineWidth=2;ctx.strokeRect(HX+18,HY-32,32,24);
  ctx.strokeStyle='#f97316';ctx.lineWidth=4;
  ctx.beginPath();ctx.ellipse(HX,HY,18,5,0,0,Math.PI);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.55)';ctx.lineWidth=1;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(HX-16+i*8,HY);ctx.lineTo(HX-12+i*7,HY+22);ctx.stroke();}
  if(aiming){
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.beginPath();ctx.roundRect(bx()-22,by()-58,44,12,6);ctx.fill();
    ctx.fillStyle=power>80?'#ef4444':power>50?'#fbbf24':'#22c55e';
    ctx.beginPath();ctx.roundRect(bx()-22,by()-58,44*power/100,12,6);ctx.fill();
  }
  const BX=ballFlight?ballFlight.x:bx(),BY=ballFlight?ballFlight.y:by();
  ctx.fillStyle='#f97316';ctx.beginPath();ctx.arc(BX,BY,13,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#78350f';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(BX,BY,13,0.15,Math.PI-.15);ctx.stroke();
  ctx.beginPath();ctx.moveTo(BX-13,BY);ctx.lineTo(BX+13,BY);ctx.stroke();
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(BX,H*.57,10,4,0,0,Math.PI*2);ctx.fill();
}
function updateHUD(){
  document.getElementById('score-display').textContent=score;
  document.getElementById('time-display').textContent=timeLeft;
  document.getElementById('made-display').textContent=made+'/'+shots;
}
function endGame(){
  clearInterval(timer);running=false;
  document.getElementById('final-score').textContent=score;
  document.getElementById('final-made').textContent=made;
  document.getElementById('final-shots').textContent=shots;
  showScreen('result-screen');playTone(220,'sawtooth',0.35,0.2);
}
C.addEventListener('mousedown',beginAim);C.addEventListener('mouseup',shoot);
C.addEventListener('touchstart',e=>{e.preventDefault();beginAim();},{passive:false});
C.addEventListener('touchend',e=>{e.preventDefault();shoot();},{passive:false});
window.addEventListener('resize',()=>{if(running)resize();});`,
  },

  puzzle: {
    description: 'Sliding tile puzzle: tap a tile next to the empty space to slide it. Solve the number grid in as few moves as possible. Grid grows each level.',
    elements: '#start-screen(.screen.active) | #game-screen(.screen, contains canvas#c sized square) | #result-screen(.screen) | #moves-display | #level-display | #score-display | #final-score | #final-moves',
    coreJS: `const C=document.getElementById('c'),ctx=C.getContext('2d');
let W,N,CS,tiles,blank,moves,startTime,running=false,score=0,level=1;
let _ac=null;
function playTone(f,t,d,v){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain();o.connect(g);g.connect(_ac.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(v||0.12,_ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+(d||0.1));o.start();o.stop(_ac.currentTime+(d||0.1));}catch(e){}}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.className='screen');document.getElementById(id).className='screen active';}
function resize(){C.width=C.height=W=Math.min(C.offsetWidth,340);}
function shuffle(){
  for(let i=0;i<300+level*100;i++){
    const nb=[];
    if(blank.r>0)nb.push({r:blank.r-1,c:blank.c});
    if(blank.r<N-1)nb.push({r:blank.r+1,c:blank.c});
    if(blank.c>0)nb.push({r:blank.r,c:blank.c-1});
    if(blank.c<N-1)nb.push({r:blank.r,c:blank.c+1});
    const t=nb[Math.floor(Math.random()*nb.length)];
    tiles[blank.r][blank.c]=tiles[t.r][t.c];tiles[t.r][t.c]=0;blank={r:t.r,c:t.c};
  }
}
function isSolved(){
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const n=r*N+c+1;
    if(r===N-1&&c===N-1){if(tiles[r][c]!==0)return false;}
    else if(tiles[r][c]!==n)return false;
  }return true;
}
function startGame(){
  resize();N=2+level;CS=Math.floor(W/N);moves=0;startTime=Date.now();running=true;
  tiles=Array.from({length:N},(_,r)=>Array.from({length:N},(_,c)=>r*N+c+1));
  tiles[N-1][N-1]=0;blank={r:N-1,c:N-1};shuffle();
  updateHUD();showScreen('game-screen');draw();
}
function draw(){
  ctx.clearRect(0,0,W,W);
  ctx.fillStyle='#0f0c29';ctx.fillRect(0,0,W,W);
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const v=tiles[r][c];if(!v)continue;
    const isCorrect=v===(r*N+c+1);
    ctx.fillStyle=isCorrect?'#15803d':'#7c3aed';
    ctx.beginPath();ctx.roundRect(c*CS+3,r*CS+3,CS-6,CS-6,8);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.08)';ctx.beginPath();ctx.roundRect(c*CS+3,r*CS+3,CS-6,CS/3,8);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold '+Math.round(CS*.38)+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(v,c*CS+CS/2,r*CS+CS/2);
  }
}
function clickTile(px,py){
  if(!running)return;
  const c=Math.floor(px/CS),r=Math.floor(py/CS);
  if(c<0||c>=N||r<0||r>=N)return;
  if(Math.abs(r-blank.r)+Math.abs(c-blank.c)===1){
    tiles[blank.r][blank.c]=tiles[r][c];tiles[r][c]=0;blank={r,c};moves++;
    playTone(440,'sine',0.06,0.08);updateHUD();draw();
    if(isSolved()){
      running=false;
      const elapsed=Math.floor((Date.now()-startTime)/1000);
      const pts=Math.max(20,300-moves*2-elapsed);score+=pts;level++;
      document.getElementById('final-score').textContent=score;
      document.getElementById('final-moves').textContent=moves;
      showScreen('result-screen');playTone(880,'triangle',0.3);
    }
  }
}
function updateHUD(){document.getElementById('moves-display').textContent=moves;document.getElementById('level-display').textContent=level;document.getElementById('score-display').textContent=score;}
C.addEventListener('click',e=>{const r=C.getBoundingClientRect();clickTile(e.clientX-r.left,e.clientY-r.top);});
C.addEventListener('touchstart',e=>{e.preventDefault();const r=C.getBoundingClientRect();clickTile(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top);},{passive:false});
window.addEventListener('resize',()=>{if(running){resize();draw();}});`,
  },

  cooking: {
    description: 'Cooking game: a recipe appears showing ingredients in order. Tap them in the correct sequence to complete the dish before the timer runs out.',
    elements: '#start-screen(.screen.active) | #game-screen(.screen) | #result-screen(.screen) | #recipe-name(dish name + emoji) | #recipe-steps(step badges with .done/.active states) | #ingredients(grid of ingredient buttons) | #feedback(correct/wrong message) | #score-display | #time-display(.timer-num) | #level-display | #final-score',
    coreJS: `let _ac=null;
function playTone(f,t,d,v){try{if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain();o.connect(g);g.connect(_ac.destination);o.type=t||'triangle';o.frequency.value=f;g.gain.setValueAtTime(v||0.15,_ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,_ac.currentTime+(d||0.1));o.start();o.stop(_ac.currentTime+(d||0.1));}catch(e){}}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.className='screen');document.getElementById(id).className='screen active';}
const RECIPES=[
  {name:'Pizza',emoji:'🍕',steps:['Dough','Sauce','Cheese','Pepperoni']},
  {name:'Burger',emoji:'🍔',steps:['Bun','Patty','Cheese','Lettuce','Sauce']},
  {name:'Sushi',emoji:'🍣',steps:['Rice','Nori','Fish','Roll']},
  {name:'Cake',emoji:'🎂',steps:['Flour','Eggs','Butter','Sugar','Bake']},
  {name:'Tacos',emoji:'🌮',steps:['Shell','Beef','Salsa','Cheese','Lettuce']},
  {name:'Ramen',emoji:'🍜',steps:['Broth','Noodles','Egg','Pork','Onion']},
];
const DECOYS=['Salt','Pepper','Oil','Garlic','Onion','Cumin','Paprika','Cream','Vinegar','Honey'];
let score=0,timeLeft=60,clockTimer,currentRecipe=null,curStep=0,level=1,combo=0;
function startGame(){
  score=0;timeLeft=60;combo=0;level=1;clearInterval(clockTimer);
  document.getElementById('time-display').classList.remove('danger');
  showScreen('game-screen');nextRecipe();
  clockTimer=setInterval(()=>{timeLeft--;updateHUD();if(timeLeft<=10)document.getElementById('time-display').classList.add('danger');if(timeLeft<=0)endGame();},1000);
}
function nextRecipe(){
  currentRecipe=RECIPES[Math.floor(Math.random()*RECIPES.length)];curStep=0;
  renderRecipe();renderIngredients();updateHUD();
  document.getElementById('feedback').textContent='';
}
function renderRecipe(){
  const el=document.getElementById('recipe-steps');
  if(el)el.innerHTML=currentRecipe.steps.map((s,i)=>'<span class="step '+( i<curStep?'done':i===curStep?'active':'')+'">'+s+'</span>').join(' → ');
  const nm=document.getElementById('recipe-name');
  if(nm)nm.textContent=currentRecipe.emoji+' '+currentRecipe.name;
}
function renderIngredients(){
  const pool=[...currentRecipe.steps];
  while(pool.length<8)pool.push(DECOYS[Math.floor(Math.random()*DECOYS.length)]);
  const shuffled=[...new Set(pool)].sort(()=>Math.random()-.5).slice(0,8);
  const container=document.getElementById('ingredients');
  if(container)container.innerHTML=shuffled.map(i=>'<button class="ingr-btn btn btn-outline btn-sm" onclick="pickIngredient(\\'' +i+ '\\')" style="flex:1;min-width:80px">'+i+'</button>').join('');
}
function pickIngredient(name){
  const correct=currentRecipe.steps[curStep];
  const fb=document.getElementById('feedback');
  if(name===correct){
    curStep++;combo++;const pts=10+combo*2;score+=pts;playTone(660,'triangle',0.1);
    if(fb){fb.textContent=combo>=3?'COMBO x'+combo+'! +'+pts:'+'+pts;fb.style.color=combo>=3?'var(--accent)':'var(--success)';}
    if(curStep>=currentRecipe.steps.length){
      score+=30;playTone(880,'triangle',0.22);timeLeft=Math.min(timeLeft+8,90);
      if(score>=level*120)level++;setTimeout(nextRecipe,500);
    }else renderRecipe();
  }else{
    combo=0;playTone(200,'sawtooth',0.12);
    if(fb){fb.textContent='Wrong! Try again.';fb.style.color='var(--danger)';fb.style.animation='shake .3s ease';setTimeout(()=>fb.style.animation='',350);}
  }
  updateHUD();
}
function updateHUD(){
  document.getElementById('score-display').textContent=score;
  document.getElementById('time-display').textContent=timeLeft;
  document.getElementById('level-display').textContent=level;
}
function endGame(){clearInterval(clockTimer);document.getElementById('final-score').textContent=score;showScreen('result-screen');playTone(220,'sawtooth',0.35,0.2);}`,
  },

  racing: {
    description: 'Top-down lane racing: steer left/right to dodge oncoming traffic on a scrolling road, speed increases over time.',
    coreHTML: `<div id="start-screen" class="screen active"><h1 class="gradient-text">Road Rush</h1><p>Dodge traffic, survive as long as possible</p><button class="glass-btn" onclick="startGame()">Drive</button></div><div id="game-screen" class="screen"><div class="hud"><span>Score: <b id="score-val">0</b></span><span>Best: <b id="best-val">0</b></span></div><canvas id="c"></canvas></div><div id="result-screen" class="screen"><h2>Crash!</h2><p>Score: <b id="final-score">0</b></p><button class="glass-btn" onclick="startGame()">Retry</button></div>`,
    coreCSS: `#c{display:block;width:100%;border-radius:var(--r)}`,
    coreJS: `const AC=new AudioContext();
function playTone(f,t,d,v=0.18){const o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.frequency.value=f;o.type=t;g.gain.setValueAtTime(v,AC.currentTime);g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+d);o.start();o.stop(AC.currentTime+d);}
const C=document.getElementById('c'),ctx=C.getContext('2d');
let W,H,score,best=0,spd,raf,running=false;
let px,py,pvy=0;
let traffic=[],lines=[];
const PW=36,PH=60,LANE_COUNT=5;
function resize(){W=C.width=C.offsetWidth;H=C.height=Math.min(C.offsetWidth*0.62,400);}
function laneX(i){const lw=W/LANE_COUNT;return lw*i+lw/2-PW/2;}
function startGame(){
  resize();score=0;spd=3;running=true;
  px=laneX(2);py=H-PH-20;traffic=[];
  lines=Array.from({length:8},(_, i)=>({y:i*(H/7)}));
  updateHUD();showScreen('game-screen');cancelAnimationFrame(raf);loop();
}
function updateHUD(){document.getElementById('score-val').textContent=score;document.getElementById('best-val').textContent=best;}
function spawnCar(){
  const lane=Math.floor(Math.random()*LANE_COUNT);
  const colors=['#ef4444','#3b82f6','#f59e0b','#10b981','#a855f7'];
  traffic.push({x:laneX(lane),y:-PH,color:colors[lane%colors.length]});
}
let frameCount=0;
function loop(){
  if(!running)return;
  raf=requestAnimationFrame(loop);
  frameCount++;
  if(frameCount%Math.max(18,55-Math.floor(spd*4))===0)spawnCar();
  if(frameCount%180===0){spd+=0.25;score+=5;updateHUD();}
  // road
  const rg=ctx.createLinearGradient(0,0,0,H);rg.addColorStop(0,'#1f2937');rg.addColorStop(1,'#111827');
  ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
  // lane lines
  ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=2;ctx.setLineDash([30,20]);
  for(let i=1;i<LANE_COUNT;i++){const x=W/LANE_COUNT*i;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  ctx.setLineDash([]);
  // center dashes scroll
  ctx.strokeStyle='rgba(255,255,0,0.4)';ctx.lineWidth=3;ctx.setLineDash([40,30]);
  for(const l of lines){l.y+=spd;if(l.y>H)l.y=-40;}
  ctx.setLineDash([]);
  // traffic
  for(const t of traffic){
    t.y+=spd*1.4;
    ctx.fillStyle=t.color;ctx.beginPath();ctx.roundRect(t.x,t.y,PW,PH,6);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(t.x+4,t.y+8,PW-8,14);ctx.fillRect(t.x+4,t.y+PH-22,PW-8,14);
  }
  // player car
  ctx.fillStyle='#f97316';ctx.beginPath();ctx.roundRect(px,py,PW,PH,6);ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(px+4,py+8,PW-8,14);ctx.fillRect(px+4,py+PH-22,PW-8,14);
  // collision
  for(const t of traffic){
    if(t.y+PH>py&&t.y<py+PH&&t.x+PW>px+4&&t.x<px+PW-4){
      running=false;best=Math.max(best,score);playTone(120,'sawtooth',0.5,0.3);
      document.getElementById('final-score').textContent=score;showScreen('result-screen');return;
    }
  }
  traffic=traffic.filter(t=>t.y<H+PH);
}
// keyboard
document.addEventListener('keydown',e=>{
  if(!running)return;
  const lw=W/LANE_COUNT;
  if((e.key==='ArrowLeft'||e.key==='a')&&px>4)px=Math.max(0,px-lw);
  if((e.key==='ArrowRight'||e.key==='d')&&px<W-PW-4)px=Math.min(W-PW,px+lw);
});
// touch
let touchStartX=0;
document.addEventListener('touchstart',e=>{touchStartX=e.touches[0].clientX;},{passive:true});
document.addEventListener('touchend',e=>{
  if(!running)return;
  const dx=e.changedTouches[0].clientX-touchStartX;
  const lw=W/LANE_COUNT;
  if(dx<-30)px=Math.max(0,px-lw);
  if(dx>30)px=Math.min(W-PW,px+lw);
},{passive:true});
window.addEventListener('resize',()=>{if(running)resize();});`,
  },
};

// ── Website Starter Patterns ─────────────────────────────────────

const WEBSITE_STARTERS = {
  portfolio: {
    description: 'Creative personal portfolio: bold gradient hero with animated name, work grid with image overlay hovers, animated skill bars, testimonials, and a contact form.',
    interactions: 'project card hover: darken overlay appears + project title slides up + "View Project" CTA reveals | skill bars animate width from 0 on load | filter tabs (All/Design/Dev) hide and show cards with fade | contact form validates inline + shows animated success message | nav links smooth-scroll to each section | hero CTA scrolls to projects',
    layout: 'nav[brand + links + hire-me-btn] → hero[eyebrow + big-name.gradient-text + role + 2-line-bio + CTA-pair] → about[.grid2: photo-placeholder + text + stats-row[3 numbers]] → skills[eyebrow + .grid3 skill-bars with labels+percent] → projects[eyebrow + filter-tabs + .grid3 cards with card-img overlay-hover] → testimonials[.grid2 quote-cards] → contact[container-sm centered form] → footer',
  },
  restaurant: {
    description: 'Warm restaurant site: dramatic hero with atmosphere, tabbed menu (Starters / Mains / Desserts), food item cards with add-to-order, live cart panel, and order confirmation.',
    interactions: 'menu tabs switch with sliding underline animation + fade content | food card hover: image zooms slightly + glow border appears + price highlights | add-to-cart: button shows checkmark + cart badge count rises + item line appears in cart | cart total recalculates live | order button triggers confirmation overlay with animated checkmark | hero reserve-btn smooth-scrolls to menu',
    layout: 'nav[logo + tagline + cart-icon with badge-count] → hero[full-bleed gradient bg + big headline + .tag label + rating-row + reserve-CTA] → menu-section[eyebrow + tab-nav(Starters|Mains|Desserts) + .grid3 food-cards: card-img + name + description + price + add-btn] → cart-panel[inline or fixed: item-list + qty-controls + total + order-btn] → confirmation-overlay[checkmark + summary + close] → footer',
  },
  shop: {
    description: 'Modern product shop: hero banner, filterable product grid with hover quick-add, sliding cart panel with quantity controls, and checkout form.',
    interactions: 'product card hover: scale 1.04 + shadow deepens + quick-add button slides up from card bottom | add-to-cart: button flips to checkmark for 1s + cart badge count rises + item added to panel | cart panel slides in from right (animation:slideInRight) | quantity +/− update totals live | filter pills hide/show products with fade | checkout button opens form overlay with validation',
    layout: 'nav[brand + search-input + cart-icon + badge] → hero-banner[gradient bg + headline + shop-now CTA + decorative shapes] → filter-pills[category buttons, active state] → products[.grid3 cards: card-img + .tag + name + price + rating-dots + add-btn] → cart-panel[position:fixed right, slide-in: item-list + qty-controls + subtotal + checkout-btn] → checkout-overlay[form + order-confirm] → footer',
  },
  sports: {
    description: 'Sports team fan page: dramatic full-bleed hero with team colors, animated stat counters, tabbed sections (Squad / Schedule / Results), player cards, and match display.',
    interactions: 'stat counters count up from 0 on page load using setInterval | tab clicks switch visible panel with fade | player card hover: scale up + show stats overlay | upcoming match pulses gently (animation:pulse) | results show W/L badges with color coding | CTA opens ticket overlay | hero motto animates in with slideUp',
    layout: 'nav[team-crest + team-name + nav-links] → hero[full-bleed team-gradient + team-name.gradient-text + motto.fade-up + animated-stat-tickers + CTA] → tab-nav[Squad|Schedule|Results + active-underline] → squad-panel[.grid4 player-cards with hover-overlay] → schedule-panel[list: date + opponent + venue + result-badge] → results-panel[match-result cards with score display] → footer',
  },
  blog: {
    description: 'Editorial blog: featured article hero, category filter chips, article cards with reading time, live search, and full article in a modal overlay.',
    interactions: 'category chips filter cards with fade-out/fade-in (classList toggle) | search input filters live by title text | featured article card hover: overlay darkens + Read Story button appears | article card click opens modal reader | modal close button and Escape key dismiss it | article cards have left-border accent on hover | reading-time badge on every card',
    layout: 'nav[brand + search-input + write-btn] → featured-hero[large .card: .tag + big-title + author-info + read-time + read-btn] → category-chips[horizontal pill-row with active state] → article-grid[.grid3 cards: card-img + .tag + title + excerpt + read-time + author] → article-modal[position:fixed overlay + title + body-text + close-btn] → newsletter-strip[gradient bg + email form] → footer',
  },
  landing: {
    description: 'Modern product landing page: gradient hero with visual, staggered feature cards, social proof counters, pricing toggle, FAQ accordion, and email capture strip.',
    interactions: 'hero primary CTA has animation:pulse gentle loop | feature cards animate in staggered with .fade-up + data-delay | social-proof counters count up from 0 on load | pricing toggle switches between monthly/yearly prices with smooth transition | FAQ items expand/collapse with max-height transition | email form validates inline and shows success message',
    layout: 'nav[logo + links + free-trial-btn] → hero[gradient-bg + eyebrow + h1.gradient-text + sub + CTA-pair + device-visual-placeholder] → social-proof[counter-strip: 3 big numbers + labels] → features[eyebrow + .grid3 icon-box cards + data-delay stagger] → how-it-works[3-step numbered row] → pricing[toggle + .grid2 plan-cards] → testimonials[.grid3 quote-cards] → FAQ[accordion list] → CTA-strip[gradient bg + email-form] → footer',
  },
};

// ── Tool Starter Patterns ────────────────────────────────────────

const TOOL_STARTERS = {
  calculator: {
    description: 'Full calculator with display, 4 operations, history, keyboard support.',
    interactions: 'button press with ripple | display updates live | equals animates result | error on divide-by-zero | clear with AC | keyboard (0-9, operators, Enter=equals)',
    layout: 'centered card → display[expression line + result line] → keypad-grid[AC/±/÷/×/7-0/.=] → history-list',
  },
  timer: {
    description: 'Countdown timer + stopwatch: large display, controls, lap list.',
    interactions: 'start/pause toggle | reset clears | lap records entry with time | color warning at 10s | alarm animation + message at zero | mode tabs countdown/stopwatch',
    layout: 'card → mode-tabs[countdown|stopwatch] → time-display[MM:SS] → control-row[start/pause/reset/lap] → laps-list',
  },
  drawing: {
    description: 'Canvas drawing app: pencil, eraser, colors, size slider, clear, save.',
    interactions: 'draw with mouse + touch | tool buttons highlight active | color swatch grid | size range slider | clear canvas confirm | save as PNG download',
    layout: 'toolbar[pencil/eraser + color-swatches + size-slider] → canvas(full-width responsive) → action-row[clear+undo+save]',
  },
  flashcards: {
    description: 'Study flashcard deck with 3D flip, progress bar, shuffle, known/unknown sorting.',
    interactions: 'click card → 3D CSS flip reveals answer | prev/next navigation | mark known (green) | shuffle deck | progress bar fills | completion screen',
    layout: 'progress-bar → card-count[x/total] → card-viewer[front|back 3D flip] → nav-row[prev+flip+next] → known-btn → completion-screen',
  },
  simulator: {
    description: 'Interactive visual simulator: user tweaks parameters via sliders/buttons and the simulation updates in real time on a canvas or animated DOM. Could be physics, nature, economy, or logic.',
    interactions: 'sliders change parameters instantly (no Submit needed) | play/pause/reset controls | canvas or grid redraws every frame | clicking the simulation area injects an event (add particle, spawn creature, etc.) | live stats panel shows key numbers updating in real time | speed control changes tick rate',
    layout: 'header[title + description] → controls-panel[labeled sliders + toggle switches + play/pause/reset] → simulation-viewport[canvas or animated grid, full-width, aspect-ratio 16/9 or square] → stats-strip[3-5 live counters with labels] → optional: event-log list',
  },
};

// ── Project Classifier (Creative Director) ───────────────────────

function classifyProject(prompt) {
  const p = prompt.toLowerCase();

  // ── Broad intent signals (used to break ties, not hard gates) ─────────────
  const isGameWord = /\bgame\b|\barcade\b|\bgame.?over\b|\blevel.?up\b|\bhigh.?score\b/.test(p);
  const isSiteWord = /\bwebsite\b|\bweb.?site\b|\bsite\b|\bhomepage\b/.test(p);
  const isToolWord = /\btool\b|\butility\b|\bcalculator?\b|\btracker\b|\bconverter\b|\bbuilder\b|\bplanner\b/.test(p);
  const isAppWord  = /\bapp\b/.test(p); // ambiguous — used only as last-resort site signal

  // ── SIMULATOR (explicit keyword → always tool, never game) ────────────────
  if (/\bsimulat(or|e|ion)\b/.test(p)) return { category: 'tool', type: 'simulator' };

  // ── QUIZ (own type; checked before generic "question" game patterns) ───────
  if (/\bquiz\b|\btrivia\b|\bmultiple.?choice\b|\bq\s*&\s*a\b/.test(p)) {
    return { category: 'game', type: 'quiz' };
  }

  // ── MEMORY / REACTION — high-specificity game types ──────────────────────
  if (/\bmemory.?game\b|\bflip.?card\b|\bmatching.?game\b|\bfind.?pair\b|\bmatch.?card\b/.test(p)) return { category: 'game', type: 'memory' };
  if (/\breact(ion)?.{0,12}game\b|\breflex.{0,8}game\b|\btap.?fast\b|\bresponse.?time\b|\breflexes?\b/.test(p)) return { category: 'game', type: 'reaction' };

  // ── SPORTS: hard-phrase disambiguation ───────────────────────────────────
  // Sports-GAME: action verb + sport OR "soccer/football/basketball game/challenge/arcade"
  const isSportsGame = /\bpenalty\s*(kick|shoot)\b|\bshoot.*\bgoal\b|\bfree.?throw\b|\bshoot.*\bhoop\b|\bplay\s+(soccer|football|basketball)\b|\b(soccer|football|basketball)\s*(game|arcade|challenge|shooter|challenge)\b/.test(p);
  // Sports-SITE: fan/club/team/site nouns collocated with sport word
  const isSportsSite = /\b(soccer|football|basketball|sports?)\s*(fan|club|team|site|website|hub|page)\b|\b(fan|team|club)\s*(site|page|website)\b/.test(p);

  if (isSportsGame) {
    // include context words: penalty/kick → soccer; hoop/throw → basketball
    if (/\bsoccer\b|\bfootball\b|\bpenalty\b|\bkick\b|\bgoal\b/.test(p)) return { category: 'game', type: 'soccer' };
    if (/\bbasketball\b|\bhoop\b|\bthrow\b/.test(p)) return { category: 'game', type: 'basketball' };
    return { category: 'game', type: 'clicker' };
  }
  if (isSportsSite && /\b(soccer|football|basketball|sports?)\b/.test(p)) {
    return { category: 'website', type: 'sports' };
  }

  // ── SPECIFIC GAME TYPES ────────────────────────────────────────────────────
  // Each anchors to a distinctive concept so only the right prompt matches.
  if (/\bplatformer\b|\bplatform.?game\b|\bjump\s*(over|on)\s*platforms?\b/.test(p)) return { category: 'game', type: 'platformer' };
  if (/\bdodge.?game\b|\bdodge\s+falling\b|\bfalling\s*objects?\s*game\b/.test(p)) return { category: 'game', type: 'dodge' };
  if (/\bracing.?game\b|\bcar.?race.?game\b|\blane.?racing\b|\bdodge\s+traffic\b|\broad.?rush\b/.test(p)) return { category: 'game', type: 'racing' };
  if (/\btyp(ing|e)\s*(speed\s*)?game\b|\btype\s+the\s+words?\b|\bword.?typ\b|\bspeed.?typ\b|\bkeyboard.?game\b/.test(p)) return { category: 'game', type: 'typing' };
  if (/\btower.?defense\b|\bplace\s*towers?\b|\bdefend\s*(the\s*)?base\b|\btd.?game\b/.test(p)) return { category: 'game', type: 'tower' };
  if (/\bmaze.?game\b|\bsolve\s*(a\s*)?maze\b|\bnavigate\s*(a\s*)?maze\b|\blabyrinth\b/.test(p)) return { category: 'game', type: 'maze' };
  if (/\bsurvival.?game\b|\bsurvive\s*(the\s*)?enemies\b|\benemies?\s*chase\b/.test(p)) return { category: 'game', type: 'survival' };
  if (/\bsliding?.?puzzle\b|\btile.?puzzle\b|\bnumber.?puzzle\b|\b15.?puzzle\b|\bslide\s*tiles?\b/.test(p)) return { category: 'game', type: 'puzzle' };
  if (/\bbasketball.?game\b|\bshoot\s*(the\s*)?hoop\b|\bfree.?throw.?game\b/.test(p)) return { category: 'game', type: 'basketball' };
  if (/\bsoccer.?game\b|\bfootball.?game\b/.test(p)) return { category: 'game', type: 'soccer' };
  if (/\bcooking.?game\b|\brecipe.?game\b|\bchef.?game\b|\bkitchen.?game\b/.test(p)) return { category: 'game', type: 'cooking' };
  if (/\bendless.?runner\b|\brunner.?game\b|\bside.?scroll.*runner\b|\bjump.*obstacles?\s*game\b/.test(p)) return { category: 'game', type: 'runner' };

  // ── GENERIC GAME INTENT → sub-signal routing (no defaulting to clicker) ───
  if (isGameWord) {
    if (/\btyp|\bword|\bspell|\bkeyboard/.test(p))       return { category: 'game', type: 'typing' };
    if (/\bjump\b|\bplatform\b|\bdash\b|\brun\b/.test(p))      return { category: 'game', type: 'platformer' };
    if (/\brace\b|\bcar\b|\bdrive\b|\btrack\b/.test(p))        return { category: 'game', type: 'racing' };
    if (/\bmatch\b|\bflip\b|\bcard\b|\bpair\b/.test(p))        return { category: 'game', type: 'memory' };
    if (/\bmaze|\blabyrin|\bexit/.test(p))                return { category: 'game', type: 'maze' };
    if (/\bsurviv|\bdodge\b|\bavoid\b|\benem/.test(p))     return { category: 'game', type: 'survival' };
    if (/\bcook|\brecipe|\bingredient|\bchef/.test(p))    return { category: 'game', type: 'cooking' };
    if (/\bsoccer|\bfootball|\bkick|\bgoal/.test(p))      return { category: 'game', type: 'soccer' };
    if (/\bbasketball|\bhoop/.test(p))                    return { category: 'game', type: 'basketball' };
    if (/\bpuzzle|\bslide|\btile/.test(p))                return { category: 'game', type: 'puzzle' };
    if (/\bclick|\btap|\bwhack|\bmole|\btarget|\bpop/.test(p)) return { category: 'game', type: 'clicker' };
    if (/\bshoot|\baim|\bfire|\bblast/.test(p))           return { category: 'game', type: 'clicker' };
    return { category: 'game', type: 'clicker' };
  }

  // ── TOOLS (before websites — tools with "app/page" in name shouldn't misfire) ─
  if (/\bdraw(ing)?\s+(app|tool|pad)\b|\bpaint\s*(app|tool)\b|\bsketch\s*(app|tool)\b|\bdoodle\b/.test(p)) return { category: 'tool', type: 'drawing' };
  if (/\btimer\b|\bcountdown\b|\bstopwatch\b|\balarm\b/.test(p)) return { category: 'tool', type: 'timer' };
  if (/\bflash.?cards?\b|\bstudy.?cards?\b|\bvocab.?trainer\b|\bspaced.?rep\b/.test(p)) return { category: 'tool', type: 'flashcards' };
  if (/\bcalculat(or|e)\b|\bbudget\b|\bcompute\b|\bmath\s*tool\b/.test(p)) return { category: 'tool', type: 'calculator' };
  if (isToolWord) return { category: 'tool', type: 'calculator' };

  // ── WEBSITES ──────────────────────────────────────────────────────────────
  if (/\brestaurant\b|\bcafe\b|\bdiner\b|\bpizzeria\b|\bfood.?menu\b|\border.?food\b|\bsushi\b|\bburger\b|\bcooking\b|\brecipe\b/.test(p)) return { category: 'website', type: 'restaurant' };
  if (/\bportfolio\b|\babout.?me\b|\bmy\s*website\b|\bshowcase\b|\bresume.?site\b|\bpersonal.?site\b/.test(p)) return { category: 'website', type: 'portfolio' };
  // Shop: checked BEFORE sports so "soccer store" → shop not sports
  if (/\bshop\b|\bstore\b|\bsell\b|\be.?commerce\b|\bproduct\s*catalog\b|\bpet.?shop\b|\bclothing\b/.test(p)) return { category: 'website', type: 'shop' };
  // Generic sports word with no prior game/site hard phrase → treat as fan site
  if (/\bsoccer\b|\bfootball\b|\bbasketball\b|\bsports?\b|\bleague\b/.test(p)) return { category: 'website', type: 'sports' };
  if (/\bblog\b|\bnews\b|\barticle\b|\bjournal\b/.test(p)) return { category: 'website', type: 'blog' };
  if (/\blanding\s*page\b|\blaunch\s*page\b|\bstartup\s*site\b|\bpromo\s*page\b|\bproduct\s*page\b/.test(p)) return { category: 'website', type: 'landing' };
  if (isSiteWord || isAppWord) return { category: 'website', type: 'portfolio' };

  // ── Fallback ──────────────────────────────────────────────────────────────
  return { category: 'game', type: 'clicker' };
}

function selectPalette(prompt, category, type) {
  const p = prompt.toLowerCase();
  if (type === 'soccer' || type === 'basketball') return PALETTES.forest;
  if (type === 'cooking')  return PALETTES.candy;
  if (type === 'tower' || type === 'survival' || type === 'maze' || type === 'simulator') return PALETTES.space;
  if (type === 'racing')   return PALETTES.arcade;
  if (p.match(/space|galaxy|star|alien|cosmic|sci.?fi|universe|planet/)) return PALETTES.space;
  if (p.match(/ocean|sea|water|fish|aqua|marine|surf|beach/))            return PALETTES.ocean;
  if (p.match(/forest|nature|green|tree|jungle|safari|plant/))           return PALETTES.forest;
  if (p.match(/candy|sweet|pink|cute|princess|kawaii|rainbow|pastel/))   return PALETTES.candy;
  if (category === 'game')    return PALETTES.arcade;
  if (category === 'website') return PALETTES.sunset;
  return PALETTES.sunset;
}

// ── Main Config Builder ──────────────────────────────────────────

function getDesignConfig(prompt) {
  const { category, type } = classifyProject(prompt);
  const palette = selectPalette(prompt, category, type);

  let pattern;
  if      (category === 'game')    pattern = GAME_STARTERS[type];
  else if (category === 'website') pattern = WEBSITE_STARTERS[type];
  else                             pattern = TOOL_STARTERS[type];

  return { category, type, palette, pattern };
}

// ── Quality Validator (Phase 6) ──────────────────────────────────

function validateOutput(html) {
  const issues = [];
  if (!html || html.length < 400)                                          issues.push('output too short');
  if (!/<body/i.test(html))                                                issues.push('missing <body>');
  if (!/<meta[^>]*viewport/i.test(html))                                   issues.push('missing viewport meta (not mobile-friendly)');
  if (!/<\/html>/i.test(html))                                              issues.push('output truncated — missing </html>');
  if (!/<style/i.test(html))                                               issues.push('no <style> block');
  if (!/<script/i.test(html))                                              issues.push('no <script> block');
  if (!/addEventListener|onclick/i.test(html))                            issues.push('no event listeners or onclick handlers');
  if (/Times New Roman/i.test(html))                                       issues.push('uses banned font Times New Roman');
  if (!/(border-radius)/i.test(html))                                     issues.push('no border-radius (layout looks harsh)');
  if (!/(transition|animation|@keyframes)/i.test(html))                  issues.push('no animations or transitions');
  if (!/:hover/i.test(html))                                              issues.push('no hover effects on buttons/cards');
  return { valid: issues.length === 0, issues };
}

module.exports = {
  PALETTES,
  BASE_CSS,
  ANIMATION_CSS,
  GAME_STARTERS,
  WEBSITE_STARTERS,
  TOOL_STARTERS,
  classifyProject,
  selectPalette,
  getDesignConfig,
  validateOutput,
};
