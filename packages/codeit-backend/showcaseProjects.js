'use strict';

const SHOWCASE_PROJECTS = Object.freeze([
  {
    id: -101,
    public_id: 'studioquiz01',
    title: 'Mission Control Quiz',
    prompt: 'Build a colorful space quiz with instant feedback and a mission score.',
    project_type: 'quiz',
    creator_name: 'CodeIt Studio',
    created_at: '2026-07-20T12:00:00.000Z',
    view_count: 0,
    like_count: 0,
    remix_count: 0,
    is_showcase: true,
    generated_code: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 20% 10%,#7447d8,#24194f 52%,#171034);font-family:system-ui;color:#fff}.card{width:min(92%,560px);padding:28px;border:2px solid #ffd84d;border-radius:28px;background:#fff8;backdrop-filter:blur(16px);box-shadow:0 25px 70px #110928aa}.eyebrow{color:#ffe16b;font-weight:900;letter-spacing:.16em;text-transform:uppercase}h1{font-size:clamp(2rem,7vw,3.6rem);line-height:.95;margin:10px 0 18px}.answers{display:grid;gap:10px}button{border:0;border-radius:16px;padding:15px;text-align:left;font:700 1rem system-ui;color:#2f2144;background:#fff;cursor:pointer;transition:.15s}button:hover{transform:translateY(-2px);background:#fff2bc}.status{min-height:28px;margin:15px 0 0;font-weight:800}.score{float:right;background:#ff7657;padding:7px 12px;border-radius:99px}</style></head><body><main class="card"><span class="score">Score <b id="score">0</b>/3</span><div class="eyebrow">Mission 01</div><h1 id="question">Which planet has rings you can see?</h1><div class="answers" id="answers"></div><p class="status" id="status">Choose an answer to launch.</p></main><script>
const qs=[['Which planet has rings you can see?',['Mars','Saturn','Venus'],1],['What powers the Sun?',['Nuclear fusion','Wind','Moonlight'],0],['Where do astronauts float?',['In orbit','Under the ocean','Inside mountains'],0]];let i=0,s=0;const q=document.querySelector('#question'),a=document.querySelector('#answers'),st=document.querySelector('#status'),sc=document.querySelector('#score');function draw(){q.textContent=qs[i][0];a.innerHTML='';qs[i][1].forEach((x,n)=>{const b=document.createElement('button');b.textContent=x;b.onclick=()=>pick(n);a.appendChild(b)})}function pick(n){if(n===qs[i][2]){s++;sc.textContent=s;st.textContent='Correct! Thrusters on.'}else st.textContent='Good try—mission data updated.';i++;setTimeout(()=>{if(i<qs.length){st.textContent='Next mission question';draw()}else{q.textContent=s===3?'Perfect mission!':'Mission complete!';a.innerHTML='<button onclick="location.reload()">Fly again</button>';st.textContent='You scored '+s+' out of 3.'}},650)}draw();
</script></body></html>`,
  },
  {
    id: -102,
    public_id: 'studiogame01',
    title: 'Reaction Rush',
    prompt: 'Make a fast reaction game with a moving target, timer, and playful colors.',
    project_type: 'game',
    creator_name: 'CodeIt Studio',
    created_at: '2026-07-19T12:00:00.000Z',
    view_count: 0,
    like_count: 0,
    remix_count: 0,
    is_showcase: true,
    generated_code: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#fff2df;font-family:system-ui;color:#3c2a22;overflow:hidden}.top{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;background:#ff7858;border-bottom:4px solid #3c2a22}.top strong{font-size:1.4rem}.pill{background:#ffd84d;border:3px solid #3c2a22;border-radius:99px;padding:8px 15px;font-weight:900}.arena{position:relative;height:calc(100vh - 84px);min-height:380px;background-image:radial-gradient(#ffb192 2px,transparent 2px);background-size:25px 25px}.target{position:absolute;width:88px;height:88px;border:4px solid #3c2a22;border-radius:28px;background:#7447d8;color:white;font-size:2rem;box-shadow:7px 7px 0 #ffd84d;cursor:pointer;transition:.12s}.start{position:absolute;inset:50% auto auto 50%;transform:translate(-50%,-50%);border:4px solid #3c2a22;border-radius:18px;background:#ffd84d;padding:18px 25px;font:900 1.2rem system-ui;cursor:pointer}.message{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);background:#fff;border:3px solid #3c2a22;border-radius:99px;padding:9px 16px;font-weight:800}</style></head><body><header class="top"><strong>Reaction Rush</strong><div><span class="pill">Hits <b id="score">0</b></span> <span class="pill"><b id="time">15</b>s</span></div></header><main class="arena" id="arena"><button class="start" id="start">Start the rush!</button><div class="message" id="msg">Tap the star as fast as you can.</div></main><script>
const ar=document.querySelector('#arena'),start=document.querySelector('#start'),score=document.querySelector('#score'),time=document.querySelector('#time'),msg=document.querySelector('#msg');let s=0,t=15,timer;function move(b){b.style.left=Math.random()*Math.max(10,ar.clientWidth-100)+'px';b.style.top=Math.random()*Math.max(10,ar.clientHeight-115)+'px'}start.onclick=()=>{start.remove();const b=document.createElement('button');b.className='target';b.textContent='★';ar.appendChild(b);move(b);b.onclick=()=>{s++;score.textContent=s;move(b)};timer=setInterval(()=>{t--;time.textContent=t;if(t<=0){clearInterval(timer);b.remove();msg.textContent='You hit '+s+' stars! Refresh to race again.'}},1000)};
</script></body></html>`,
  },
  {
    id: -103,
    public_id: 'studiosite01',
    title: 'Young Creator Portfolio',
    prompt: 'Create a bold personal portfolio for a young inventor with projects and a contact button.',
    project_type: 'portfolio',
    creator_name: 'CodeIt Studio',
    created_at: '2026-07-18T12:00:00.000Z',
    view_count: 0,
    like_count: 0,
    remix_count: 0,
    is_showcase: true,
    generated_code: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}body{margin:0;background:#fff9ef;color:#3c2a22;font-family:system-ui}.nav{display:flex;justify-content:space-between;padding:18px 7%;font-weight:900}.logo{color:#ff6e48}.hero{display:grid;grid-template-columns:1.2fr .8fr;gap:30px;align-items:center;padding:6vh 7% 8vh}.tag{display:inline-block;background:#ffd84d;border:2px solid #3c2a22;border-radius:99px;padding:7px 12px;font-weight:900}h1{font-size:clamp(3rem,9vw,6.4rem);line-height:.87;margin:18px 0}.orange{color:#ff6e48}.portrait{aspect-ratio:1;border:4px solid #3c2a22;border-radius:42% 58% 55% 45%;background:linear-gradient(145deg,#7447d8,#ff7b59);display:grid;place-items:center;font-size:clamp(5rem,15vw,10rem);box-shadow:14px 14px 0 #ffd84d}.projects{padding:25px 7% 60px;background:#f1e7ff}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{border:3px solid #3c2a22;border-radius:18px;padding:22px;background:#fff;box-shadow:6px 6px 0 #3c2a22}.card:nth-child(2){background:#ffd84d}.card:nth-child(3){background:#ffb199}button{border:3px solid #3c2a22;border-radius:99px;background:#ff6e48;color:white;padding:12px 18px;font-weight:900;cursor:pointer}@media(max-width:650px){.hero{grid-template-columns:1fr}.portrait{max-width:280px}.grid{grid-template-columns:1fr}}</style></head><body><nav class="nav"><span class="logo">MAYA MAKES</span><span>Inventor · Coder · Artist</span></nav><main class="hero"><div><span class="tag">Hello, internet!</span><h1>I make <span class="orange">big ideas</span> work.</h1><p>I am Maya, a young creator who builds helpful robots, tiny games, and colorful websites.</p><button onclick="document.querySelector('.projects').scrollIntoView({behavior:'smooth'})">See my projects ↓</button></div><div class="portrait" aria-label="Colorful robot portrait">🤖</div></main><section class="projects"><h2>Things I built</h2><div class="grid"><article class="card"><h3>Plant Pal</h3><p>A sensor that reminds my basil when it needs water.</p></article><article class="card"><h3>Math Dash</h3><p>A quick game that turns multiplication into a race.</p></article><article class="card"><h3>Kind Notes</h3><p>A website that gives visitors a tiny confidence boost.</p></article></div></section></body></html>`,
  },
]);

function findShowcaseProject(publicId) {
  return SHOWCASE_PROJECTS.find((project) => project.public_id === publicId) || null;
}

module.exports = { SHOWCASE_PROJECTS, findShowcaseProject };
