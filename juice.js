'use strict';
/* ============ JUICE: combos, treasure chests, shiny bosses, bestiary, rested bonus ============
   Rule: every reward here comes from a real-world action (quest, focus block, weak point,
   boss victory, body goal). Opening or browsing the app never earns anything. */
(function(){
const J=()=>S.juice||(S.juice={combo:{n:0,last:0,best:0},chests:[],dry:0,rested:0,restedDay:null,relics:{},charm:false,opened:0});
const on=()=>S.settings.juice!==false;
if(S.settings.juice==null)S.settings.juice=true;
const COMBO_MS=2*3600e3;
const uid=()=>'j'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const rand=a=>a[0]+Math.floor(Math.random()*(a[1]-a[0]+1));
const hidden=()=>$('#modal').classList.contains('hidden');

/* ---------- chests & relics ---------- */
const TIERS={
  wood:{l:'Wooden Chest',c:'#8a5a2b',h:'#b07a40',d:'#5e3b1a',g:'#d8a24a',n:1},
  silver:{l:'Silver Chest',c:'#8f9ab0',h:'#c9d1e0',d:'#5d667a',g:'#eef3fb',n:2},
  gold:{l:'Golden Chest',c:'#d9982f',h:'#f2c14e',d:'#9a6a1c',g:'#fff1a8',n:3},
  legend:{l:'Legendary Chest',c:'#7c4ddb',h:'#a78bfa',d:'#4c2a99',g:'#ffe08f',n:3}
};
const RELICS=[
  {id:'key',ic:'🗝️',n:'Rusty Key',r:'common'},{id:'candle',ic:'🕯️',n:'Candle Stub',r:'common'},{id:'quill',ic:'🪶',n:'Old Quill',r:'common'},
  {id:'compass',ic:'🧭',n:'Wayfinder Compass',r:'common'},{id:'coin',ic:'🪙',n:'Lucky Coin',r:'common'},{id:'map',ic:'📜',n:'Torn Map',r:'common'},
  {id:'orb',ic:'🔮',n:'Seer Orb',r:'rare'},{id:'horn',ic:'📯',n:'War Horn',r:'rare'},{id:'flask',ic:'⚗️',n:'Alchemist Flask',r:'rare'},{id:'shield',ic:'🛡️',n:'Oak Shield',r:'rare'},
  {id:'crown',ic:'👑',n:'Lost Crown',r:'legendary'},{id:'egg',ic:'🥚',n:'Dragon Egg',r:'legendary'}
];
const CHEST=["..oooo",".olhhh","olhlll","olllll","oggggg","olllgk","olllgg","oddddd","oddddd","oggggg",".ooooo"];
function chestSvg(t,px){const T=TIERS[t],P={o:'#1a1010',l:T.c,h:T.h,d:T.d,g:T.g,k:'#120a0a'};
  const rows=CHEST.map(r=>r+r.split('').reverse().join('')),W=rows[0].length,H=rows.length;
  let s=`<svg class="px" width="${W*px}" height="${H*px}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" aria-hidden="true">`;
  rows.forEach((r,y)=>{let x=0;while(x<W){const c=r[x];if(c==='.'){x++;continue}let n=1;while(x+n<W&&r[x+n]===c)n++;s+=`<rect x="${x}" y="${y}" width="${n}" height="1" fill="${P[c]}"/>`;x+=n}});
  return s+'</svg>'}
const BASE={quest:.22,focus:.25,weak:.35,body:.15};
function rollChest(kind,info,n){const j=J();
  if(kind==='victory')return info.rank==='S'||info.rank==='SS'||info.shiny?'legend':'gold';
  let p=(BASE[kind]||.2)+(kind==='focus'&&info.mins>=25?.1:0)+Math.min(.2,.04*(n-1));
  if(j.dry>=5)p=1; // never more than 6 real actions without a chest
  if(Math.random()>=p){j.dry++;return null}
  j.dry=0;const r=Math.random();let t=r<.02?'legend':r<.10?'gold':r<.35?'silver':'wood';
  if(n>=5&&t!=='legend')t={wood:'silver',silver:'gold',gold:'legend'}[t];
  return t}
function dropChest(t){J().chests.push({id:uid(),t,date:dayKey()});save();
  floatText(`🎁 ${TIERS[t].l.toUpperCase()}!`,TIERS[t].g,0,true);if(on())vibe(2);sound(2);chestBtn(true)}
function pickRelic(t){const w={wood:[.85,.14],silver:[.65,.3],gold:[.4,.45],legend:[.1,.5]}[t],r=Math.random();
  const rar=r<w[0]?'common':r<w[0]+w[1]?'rare':'legendary';return pick(RELICS.filter(x=>x.r===rar))}
function loot(t){const out=[],xpR={wood:[20,40],silver:[50,90],gold:[120,200],legend:[220,320]}[t],play={wood:10,silver:20,gold:40,legend:60}[t];
  for(let i=0;i<TIERS[t].n;i++){const r=Math.random();
    if(r<(t==='legend'?.12:.03))out.push({k:'jackpot'});
    else if(r<.40)out.push({k:'xp',v:rand(xpR)});
    else if(r<.68)out.push({k:'play',v:play});
    else if(r<.86)out.push({k:'relic',v:pickRelic(t)});
    else if(r<.94&&!J().charm&&!out.some(o=>o.k==='charm'))out.push({k:'charm'});
    else out.push({k:'rested',v:{wood:40,silver:60,gold:100,legend:150}[t]})}
  if(t==='legend'&&!out.some(o=>o.k==='relic'))out.push({k:'relic',v:pickRelic('legend')});
  return out}
function applyLoot(o){const j=J(),d=day();
  switch(o.k){
    case 'xp':S.xp+=o.v;d.xp+=o.v;return{ic:'⭐',t:`+${o.v} XP`,s:'Experience'};
    case 'play':d.earned+=o.v;return{ic:'🎮',t:`+${o.v}m guilt-free play`,s:'Added to today’s bank'};
    case 'jackpot':S.xp+=150;d.xp+=150;d.earned+=60;return{ic:'💎',t:'JACKPOT!',s:'+150 XP and +60m play',cls:'legendary'};
    case 'charm':j.charm=true;return{ic:'✨',t:'Shiny Charm',s:'Your next boss will be shiny',cls:'rare'};
    case 'rested':j.rested=Math.min(400,(j.rested||0)+o.v);return{ic:'💤',t:`Rested Scroll +${o.v}`,s:'Banked: your next actions earn double XP',cls:'rare'};
    case 'relic':{const x=o.v,had=j.relics[x.id]||0;j.relics[x.id]=had+1;
      if(had){S.xp+=30;d.xp+=30;return{ic:x.ic,t:x.n,s:'Duplicate relic: +30 XP',cls:x.r}}
      if(Object.keys(j.relics).length>=RELICS.length)unlock('relic12');
      return{ic:x.ic,t:x.n,s:`New ${x.r} relic for your collection!`,cls:x.r}}}}
let opening=false,lvBefore=null;
function openChest(){const j=J(),c=j.chests[0];if(!c)return;const T=TIERS[c.t];opening=false;
  openModal(`<div style="text-align:center;--cg:${T.g}">
   <div class="tiny muted">${j.chests.length>1?`${j.chests.length} chests waiting`:'Earned by doing real things'}</div>
   <h2 style="color:${T.g};margin-top:4px">${T.l}</h2>
   <button class="chestbig" id="chestbig" data-a="chestcrack" aria-label="Open chest">${chestSvg(c.t,12)}</button>
   <p class="muted small" id="chesthint">Tap the chest to open it</p><div class="loot" id="chestloot"></div></div>`)}
function crack(){if(opening)return;const j=J(),c=j.chests[0];if(!c)return;opening=true;
  const el=$('#chestbig');if(el)el.classList.add('opening');const hint=$('#chesthint');if(hint)hint.textContent='…';
  if(on()){vibe(1);setTimeout(()=>vibe(2),400);setTimeout(()=>vibe(3),800)}
  setTimeout(()=>{
    j.chests.shift();j.opened=(j.opened||0)+1;unlock('chest1');lvBefore=lvlOf(S.xp);
    const got=loot(c.t).map(applyLoot);save();burst(c.t==='wood'?40:80);sound(3);if(on()){shake(c.t==='wood'?2:3);flash()}
    if(el)el.style.display='none';if(hint)hint.textContent='';
    const box=$('#chestloot');if(!box)return;
    box.innerHTML=got.map((g,i)=>`<div class="${g.cls||''}" style="animation-delay:${i*.18}s"><b>${g.ic}</b><span><strong>${esc(g.t)}</strong><br><span class="tiny muted">${esc(g.s)}</span></span></div>`).join('')+
      `<p class="small muted" style="margin:10px 0 0">Go. The kingdom will be here.</p>`+
      (j.chests.length?`<button class="btn gold block" data-a="chestnext" style="margin-top:10px">🎁 Open next chest (${j.chests.length})</button><button class="btn ghost block" data-a="chestdone" style="margin-top:6px">Later</button>`
        :`<button class="btn gold block" data-a="chestdone" style="margin-top:10px">Collect</button>`);
    chestBtn();render()},1250)}

/* ---------- feedback: floating numbers, combo flash, shake, vibration ---------- */
let fltN=0;
function floatText(text,color,i,big){const fx=$('#fx');if(!fx)return;const el=document.createElement('div');
  el.className='flt'+(big?' big':'');el.textContent=text;el.style.color=color;
  el.style.top=`calc(${38+((fltN++%3)-1)*2}% + ${i*34}px)`;el.style.marginLeft=((Math.random()*40)-20)+'px';el.style.animationDelay=(i*.12)+'s';
  fx.appendChild(el);setTimeout(()=>el.remove(),1900+i*120)}
function comboFlash(n){const fx=$('#fx');if(!fx)return;const el=document.createElement('div');el.className='cflash';
  el.textContent=n>=5?`FRENZY ×${n}!`:`COMBO ×${n}!`;el.style.color=n>=5?'#ff5a5a':n>=3?'#ff9f43':'#ffe08f';fx.appendChild(el);setTimeout(()=>el.remove(),1100)}
function shake(l){const a=$('#app');if(!a)return;a.classList.remove('shk1','shk2','shk3','shk4');void a.offsetWidth;a.classList.add('shk'+l);setTimeout(()=>a.classList.remove('shk'+l),650)}
function vibe(l){try{navigator.vibrate&&navigator.vibrate({1:[25],2:[30,40,30],3:[40,30,40,30,70],4:[60,30,60,30,60,30,140]}[l]||[25])}catch(e){}}
function flash(){const f=document.createElement('div');f.className='flash';document.body.appendChild(f);setTimeout(()=>f.remove(),500)}

/* ---------- the core: every real action goes through here ---------- */
function action(kind,base,info={}){
  const j=J(),d=day(),t=Date.now(),c=j.combo;
  if(!info.noCombo){c.n=(t-c.last<=COMBO_MS)?c.n+1:1;c.last=t;if(c.n>c.best)c.best=c.n}
  if(c.n>=5)unlock('combo5');
  const before=lvlOf(S.xp),lines=[];let bonus=0;
  const cm=c.n>=5?1:c.n>=3?.5:0;
  if(cm&&base){const b=Math.round(base*cm);bonus+=b;lines.push({t:`+${b} COMBO ×${c.n>=5?2:1.5}`,c:'#ff9f43'})}
  if(j.rested>0&&base){const r=Math.min(j.rested,base);j.rested-=r;bonus+=r;lines.push({t:`+${r} RESTED 💤`,c:'#8ec5ff'})}
  if(info.shiny&&base){const s=Math.round(base*.5);bonus+=s;lines.push({t:`+${s} SHINY ✨`,c:'#ffe08f'})}
  if(bonus){S.xp+=bonus;d.xp+=bonus}
  const lvl=c.n>=5?4:c.n>=3?3:c.n>=2?2:1;
  setTimeout(()=>{
    if(base)floatText(`+${base} XP`,'#ffe08f',0);lines.forEach((l,i)=>floatText(l.t,l.c,i+1));
    if(c.n>=2&&!info.noCombo)comboFlash(c.n);
    if(on()){shake(kind==='victory'?4:lvl);vibe(kind==='victory'?4:lvl);if(lvl>=3||kind==='victory')flash()}
    hud(true)},380);
  const ch=rollChest(kind,info,c.n);save();
  if(ch)setTimeout(()=>dropChest(ch),kind==='victory'?2600:1200);
  render();
  const after=lvlOf(S.xp);if(after>before)setTimeout(()=>{if(hidden())levelUp(after,before)},1900)}

/* ---------- combo HUD ---------- */
function hud(pulse){const el=$('#combo');if(!el)return;const c=J().combo,rem=COMBO_MS-(Date.now()-c.last);
  if(c.n<2||rem<=0){el.classList.remove('on','hot');return}
  el.classList.add('on');el.classList.toggle('hot',c.n>=5);
  el.innerHTML=`🔥 ${c.n} combo <span class="tiny">${c.n>=5?'×2 XP':c.n>=3?'×1.5 XP':'1 more → ×1.5'}</span><span class="cb"><i style="width:${rem/COMBO_MS*100}%"></i></span>`;
  if(pulse){el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}}

/* ---------- shiny bosses ---------- */
function rollShiny(){const j=J();let changed=false;
  for(const b of S.bosses||[]){if(b.sr)continue;b.sr=1;changed=true;
    if(j.charm&&b.status!=='defeated'){b.shiny=true;j.charm=false}else if(Math.random()<.05)b.shiny=true;
    if(b.shiny&&b.status!=='defeated')setTimeout(()=>{floatText('✨ A SHINY BOSS APPEARED!','#ffe08f',0,true);if(on())vibe(3)},900)}
  if(changed)save()}
function decorate(root){const bs=(S.bosses||[]).filter(b=>b.shiny);if(!bs.length)return;const r=root||document;
  for(const b of bs){r.querySelectorAll(`[data-v="${b.id}"]`).forEach(el=>(el.closest('.bcard,.btile,.btro,.bstrip,.chip')||el).classList.add('shiny'))}
  const sh=$('#sheet');if(sh)for(const b of bs)if(sh.querySelector(`[data-a="bdel"][data-v="${b.id}"]`)){const sp=sh.querySelector('.bsprite');if(sp)sp.classList.add('shiny')}}

/* ---------- bestiary ---------- */
function known(){const m={};for(const b of S.bosses||[])if(b.status==='defeated'&&b.rank!=='SS'){const k=b.type+'|'+b.rank;m[k]=m[k]||{n:0,shiny:0};m[k].n++;if(b.shiny)m[k].shiny++}return m}
function checkBestiary(){const m=known();if(Object.keys(m).length>=12)unlock('best12');
  for(const t of ['money','systems','people'])if(['C','B','A','S'].every(r=>m[t+'|'+r]))unlock('bestline')}
function bestiaryBtn(){const k=Object.keys(known()).length,rel=Object.keys(J().relics).length;
  return `<button class="card bestbtn" data-a="bestiary"><span style="font-size:26px">📖</span><span style="flex:1;text-align:left"><b>Bestiary</b> <span class="tiny muted">${k}/12 creatures · ${rel}/12 relics${J().charm?' · ✨ charm ready':''}</span><span class="bar" style="display:block;margin-top:6px"><i style="width:${k/12*100}%"></i></span></span><span class="muted">›</span></button>`}
function bestiary(){const m=known(),j=J(),T=Boss.TYPES,N=Boss.NAMES;
  let h=`<h2>📖 Bestiary <span class="tiny muted">${Object.keys(m).length}/12</span></h2><p class="small muted">Defeat each creature once to record it. Shiny finds glow ✨.</p>`;
  for(const t of ['money','systems','people']){const got=['C','B','A','S'].filter(r=>m[t+'|'+r]).length;
    h+=`<div class="section-t t-${t}" style="margin-top:12px"><h3 style="color:var(--tc)">${T[t].ic} ${T[t].l}</h3><span class="tiny muted">${got}/4${got===4?' · line complete 🏅':''}</span></div><div class="bgrid t-${t}">`;
    for(const r of ['C','B','A','S']){const e=m[t+'|'+r];
      h+=`<div class="${e?'':'unk'} ${e&&e.shiny?'shiny':''}">${Boss.sprite(t,r,1,r==='C'?4:3)}<b>${e?N[t][r]:'???'}</b><span class="tiny muted">${r}${e?' · ×'+e.n:''}${e&&e.shiny?' ✨':''}</span></div>`}
    h+='</div>'}
  const my=(S.bosses||[]).filter(b=>b.status==='defeated'&&b.rank==='SS');
  h+=`<div class="section-t" style="margin-top:12px"><h3>🌌 Mythic</h3><span class="tiny muted">${new Set(my.map(b=>b.type)).size}/3</span></div><div class="bgrid" style="grid-template-columns:repeat(3,1fr)">${['money','systems','people'].map(t=>{const n=my.filter(b=>b.type===t).length;return `<div class="t-${t} ${n?'':'unk'}">${Boss.sprite(t,'SS',1,3)}<b>${n?N[t].SS:'???'}</b><span class="tiny muted">SS${n?' · ×'+n:''}</span></div>`}).join('')}</div>`;
  h+=`<div class="section-t" style="margin-top:16px"><h3>🏺 Relics <span class="tiny muted">${Object.keys(j.relics).length}/12</span></h3>${j.charm?'<span class="tiny" style="color:var(--gold2)">✨ Shiny charm ready</span>':''}</div>
  <div class="relics">${RELICS.map(x=>{const n=j.relics[x.id];return `<div class="${n?'r-'+x.r:'miss'}"><b>${x.ic}</b>${n?esc(x.n):'???'}<span class="tiny muted">${x.r}${n>1?' ×'+n:''}</span></div>`}).join('')}</div>
  <p class="tiny muted" style="margin-top:8px">Relics come from treasure chests, and chests drop only from real actions: quests, focus blocks, weak points and boss victories.</p>
  <button class="btn block" data-a="close" style="margin-top:12px">Close</button>`;
  openModal(h)}

/* ---------- rested bonus ---------- */
function accrueRested(){const j=J(),t=dayKey();if(j.restedDay===t)return;j.restedDay=t;
  if(S.lastActive){const gap=diffDays(S.lastActive,t);
    if(gap>=2){const add=Math.min(200,(gap-1)*50);j.rested=Math.min(400,(j.rested||0)+add);
      setTimeout(()=>toast(`<div>💤 <b>Rested bonus: +${add} XP banked</b></div><div class="tiny muted">Breaks make comebacks stronger. Your next actions earn double XP until it’s used up.</div>`),2600)}}
  save()}
function restedCard(){const r=J().rested;if(!r)return '';
  return `<div class="card restcard"><span style="font-size:26px">💤</span><div><b>Rested bonus: ${r} XP banked</b><div class="small muted">Your next real actions earn double XP until it’s used up.</div></div></div>`}

/* ---------- chest button ---------- */
function chestBtn(pop){const b=$('#chestbtn');if(!b)return;const cs=J().chests;
  if(!cs.length){b.classList.remove('on');return}
  b.classList.add('on');b.innerHTML=chestSvg(cs[0].t,4)+`<span class="n">${cs.length}</span>`;
  if(pop){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}}

/* ---------- wrap the app: detect real actions ---------- */
const _complete=complete;
complete=function(id){const d=day(),q=findQ(id),sig=()=>d.done.length+Object.keys(S.line).length+S.custom.filter(x=>x.doneDate).length;
  const b=sig();_complete(id);if(q&&sig()>b)action('quest',q.xp||20)};
const _ff=finishFocus;
finishFocus=function(mins,full){const b=day().focusMin;_ff(mins,full);const m=day().focusMin-b;if(m>=10)action('focus',m*2+5,{mins:m})};
const _bx=bodyXp;
bodyXp=function(){const d=day(),a=!!d.flags.steps,s=!!d.flags.sleep;_bx();if(!a&&d.flags.steps)action('body',20);if(!s&&d.flags.sleep)action('body',20)};
const bstate=()=>{const bs=S.bosses||[];return{w:bs.reduce((a,b)=>a+b.weak.filter(w=>w.done).length,0),v:bs.filter(b=>b.status==='defeated'&&!b.past).length}};
function victoryJuice(b){if(b.shiny){unlock('shiny1');const sp=$('#sheet .bsprite');if(sp)sp.classList.add('shiny')}
  checkBestiary();action('victory',Boss.RANKS[b.rank].xp,{rank:b.rank,shiny:!!b.shiny,noCombo:true})}
const _bweak=A.bweak;
A.bweak=v=>{const id=v.split('|')[0],s0=bstate();_bweak(v);const b=(S.bosses||[]).find(x=>x.id===id);if(!b)return;const s1=bstate();
  if(s1.w>s0.w)action('weak',Boss.RANKS[b.rank].wxp);if(s1.v>s0.v)victoryJuice(b)};
const _bfinal=A.bfinal;
A.bfinal=v=>{const s0=bstate();_bfinal(v);const b=(S.bosses||[]).find(x=>x.id===v);if(b&&bstate().v>s0.v)victoryJuice(b)};
const _vQuests=vQuests;
vQuests=function(){const h=_vQuests();const i=h.indexOf('Trophy Wall');if(i<0)return h;const k=h.lastIndexOf('<div class="section-t">',i);if(k<0)return h;return h.slice(0,k)+bestiaryBtn()+h.slice(k)};
const _vToday=vToday;
vToday=function(){const h=_vToday(),rc=restedCard();if(!rc)return h;const i=h.indexOf('<div class="card');return i<0?h+rc:h.slice(0,i)+rc+h.slice(i)};
const _vMe=vMe;
vMe=function(){return _vMe().replace('<div class="toggle"><span>Sounds</span>',`<div class="toggle"><span>Screen shake &amp; vibration</span><button class="sw ${on()?'on':''}" data-a="set" data-v="juice" aria-label="Screen shake and vibration"></button></div><div class="toggle"><span>Sounds</span>`)};
const _render=render;
render=function(){if(S.settings.juice==null)S.settings.juice=true;rollShiny();_render();decorate();checkBestiary();chestBtn();hud()};
const _open=openModal;
openModal=function(h){_open(h);decorate($('#sheet'))};

ACH.push({id:'combo5',ic:'🔥',n:'Unstoppable',d:'Reach a 5-action combo'},{id:'chest1',ic:'🎁',n:'Treasure Hunter',d:'Open your first chest'},
  {id:'shiny1',ic:'✨',n:'Shiny Hunter',d:'Defeat a shiny boss'},{id:'bestline',ic:'🏅',n:'Lineage',d:'All 4 ranks of one boss type'},
  {id:'best12',ic:'📖',n:'Monster Scholar',d:'Complete the Bestiary'},{id:'relic12',ic:'🏺',n:'Relic Keeper',d:'Collect all 12 relics'});

Object.assign(A,{
  chestopen:()=>openChest(),chestcrack:()=>crack(),chestnext:()=>openChest(),
  chestdone:()=>{closeModal();const a=lvlOf(S.xp);if(lvBefore!=null&&a>lvBefore){const b=lvBefore;setTimeout(()=>levelUp(a,b),250)}lvBefore=null},
  bestiary:()=>bestiary(),
  combohelp:()=>{const c=J().combo;toast(`<div>🔥 <b>${c.n}-action combo</b></div><div class="tiny muted">Do another real action within 2 hours to keep it going. 3+ in a row = ×1.5 XP, 5+ = ×2 XP and better chests. Missing it costs nothing.</div>`)}
});

/* ---------- DOM + styles ---------- */
document.body.insertAdjacentHTML('beforeend','<button id="combo" data-a="combohelp" aria-label="Combo meter"></button><button id="chestbtn" data-a="chestopen" aria-label="Open treasure chest"></button>');
const css=document.createElement('style');css.textContent=`
#combo{position:fixed;top:calc(64px + env(safe-area-inset-top));right:12px;z-index:9;display:none;align-items:center;gap:6px;padding:6px 10px;border-radius:99px;background:linear-gradient(180deg,#5a2a10,#3a1808);border:1px solid #ff9f43;color:#ffd7a8;font-weight:800;font-size:13px;box-shadow:0 0 16px rgba(255,140,40,.35)}
#combo.on{display:flex}
#combo .cb{width:40px;height:5px;border-radius:9px;background:rgba(255,255,255,.15);overflow:hidden}#combo .cb i{display:block;height:100%;background:#ff9f43}
#combo.hot{border-color:#ff4d4d;box-shadow:0 0 22px rgba(255,77,77,.6);animation:hot 1s ease-in-out infinite}
#combo.pop{animation:cpulse .5s ease-out}
@keyframes hot{50%{transform:scale(1.06)}}
@keyframes cpulse{30%{transform:scale(1.35)}}
.flt{position:absolute;left:50%;transform:translateX(-50%);font:800 21px Georgia,serif;text-shadow:0 2px 0 rgba(0,0,0,.7),0 0 12px rgba(0,0,0,.6);white-space:nowrap;opacity:0;animation:flt 1.6s ease-out forwards;pointer-events:none}
.flt.big{font-size:25px}
@keyframes flt{0%{opacity:0;transform:translate(-50%,10px) scale(.6)}15%{opacity:1;transform:translate(-50%,0) scale(1.2)}30%{transform:translate(-50%,-6px) scale(1)}100%{opacity:0;transform:translate(-50%,-95px)}}
.cflash{position:absolute;left:50%;top:27%;font:900 44px Georgia,serif;letter-spacing:2px;white-space:nowrap;opacity:0;animation:cpop 1.05s ease-out forwards;text-shadow:0 0 24px currentColor,0 3px 0 #000}
@keyframes cpop{0%{opacity:0;transform:translate(-50%,-50%) scale(.4) rotate(-8deg)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.25) rotate(3deg)}40%{transform:translate(-50%,-50%) scale(1) rotate(0)}100%{opacity:0;transform:translate(-50%,-80%) scale(1.05)}}
#app.shk1{animation:shk1 .3s}#app.shk2{animation:shk2 .4s}#app.shk3{animation:shk3 .5s}#app.shk4{animation:shk4 .6s}
@keyframes shk1{25%{transform:translate(-2px,1px)}50%{transform:translate(2px,-1px)}75%{transform:translate(-1px,1px)}}
@keyframes shk2{20%{transform:translate(-4px,2px)}40%{transform:translate(4px,-2px)}60%{transform:translate(-3px,1px)}80%{transform:translate(2px,-1px)}}
@keyframes shk3{15%{transform:translate(-7px,3px) rotate(-.6deg)}30%{transform:translate(7px,-3px) rotate(.6deg)}45%{transform:translate(-5px,2px)}60%{transform:translate(5px,-2px)}80%{transform:translate(-2px,1px)}}
@keyframes shk4{10%{transform:translate(-10px,4px) rotate(-1deg)}25%{transform:translate(10px,-4px) rotate(1deg)}40%{transform:translate(-8px,3px) rotate(-.6deg)}55%{transform:translate(8px,-3px)}70%{transform:translate(-4px,2px)}85%{transform:translate(3px,-1px)}}
.flash{position:fixed;inset:0;z-index:24;pointer-events:none;background:radial-gradient(circle,rgba(255,200,120,.5),transparent 70%);animation:fl .45s ease-out forwards}
@keyframes fl{to{opacity:0}}
#chestbtn{position:fixed;right:14px;bottom:calc(140px + env(safe-area-inset-bottom));z-index:8;display:none;padding:8px;border-radius:16px;background:rgba(20,20,40,.9);border:1px solid var(--gold);box-shadow:0 0 18px rgba(242,193,78,.5);animation:cwig 1.8s ease-in-out infinite}
#chestbtn.on{display:block}#chestbtn.pop{animation:cdrop .6s cubic-bezier(.3,1.6,.5,1)}
#chestbtn .n{position:absolute;top:-7px;right:-7px;background:#e5484d;color:#fff;border-radius:99px;font-size:11px;font-weight:800;padding:1px 6px}
@keyframes cwig{0%,100%{transform:none}8%{transform:translateY(-6px) rotate(-6deg)}16%{transform:rotate(5deg)}24%{transform:none}}
@keyframes cdrop{0%{transform:translateY(-120px) scale(.5);opacity:0}100%{transform:none;opacity:1}}
.chestbig{display:block;margin:14px auto;padding:0;background:none;filter:drop-shadow(0 0 26px var(--cg))}
.chestbig.opening svg{animation:copen 1.25s ease-in forwards}
@keyframes copen{0%{transform:none}15%{transform:rotate(-4deg)}25%{transform:rotate(4deg)}40%{transform:rotate(-7deg) scale(1.04)}55%{transform:rotate(7deg) scale(1.08)}70%{transform:rotate(-10deg) scale(1.12)}88%{transform:scale(1.3);filter:brightness(2.5)}100%{transform:scale(.2);opacity:0;filter:brightness(4)}}
.loot{display:grid;gap:8px;margin-top:6px}
.loot>div{display:flex;gap:12px;align-items:center;text-align:left;padding:12px;border-radius:14px;background:var(--card);border:1px solid var(--line);animation:lin .5s ease-out both}
.loot>div>b{font-size:30px}.loot .rare{border-color:#6aa9ff;box-shadow:0 0 14px rgba(106,169,255,.3)}.loot .legendary{border-color:var(--gold);box-shadow:0 0 18px rgba(242,193,78,.45)}
@keyframes lin{from{opacity:0;transform:translateY(16px) scale(.9)}to{opacity:1;transform:none}}
.shiny svg.px{filter:sepia(1) saturate(3.2) hue-rotate(-14deg) brightness(1.18) drop-shadow(0 0 3px rgba(255,224,143,.9))}
.shiny .bsprite svg,.bsprite.shiny svg{animation:bob 2.6s ease-in-out infinite,shine 1.6s ease-in-out infinite}
.bsprite.dying.shiny svg{animation:die 1.6s ease-in forwards}
@keyframes shine{50%{filter:sepia(1) saturate(3.6) hue-rotate(-14deg) brightness(1.45) drop-shadow(0 0 8px rgba(255,236,170,1))}}
.bcard.shiny,.btile.shiny,.btro.shiny{border-color:rgba(255,224,143,.7);box-shadow:0 0 22px -6px rgba(255,224,143,.7)}
.bcard.shiny .bname::after,.btile.shiny .nm::after,.btro.shiny .nm::after,.bstrip.shiny b.ell::after{content:' ✨'}
.bestbtn{display:flex;gap:12px;align-items:center;width:100%;margin:14px 0 0}
.bgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.bgrid>div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;min-height:108px;padding:8px 3px;border-radius:12px;background:var(--bg2);border:1px solid var(--line);border-bottom:3px solid var(--tc);font-size:11px;text-align:center;line-height:1.2}
.bgrid .unk svg{filter:brightness(0) opacity(.6)}.bgrid .unk b{color:var(--dim)}
.relics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.relics>div{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 3px;border-radius:12px;background:var(--bg2);border:1px solid var(--line);font-size:10px;text-align:center;line-height:1.2}
.relics b{font-size:24px}.relics .miss{opacity:.4}.relics .miss b{filter:grayscale(1) brightness(.3)}
.relics .r-rare{border-color:#6aa9ff}.relics .r-legendary{border-color:var(--gold);box-shadow:0 0 12px rgba(242,193,78,.35)}
.restcard{display:flex;gap:12px;align-items:center;border-color:#4f8fe8;background:linear-gradient(180deg,rgba(79,143,232,.14),var(--card))}
@media (prefers-reduced-motion:reduce){#app.shk1,#app.shk2,#app.shk3,#app.shk4{animation:none}#chestbtn,#combo.hot{animation:none}}`;
document.head.appendChild(css);

accrueRested();
setInterval(()=>hud(),1000);
window.Juice={action,J,RELICS,TIERS,openChest,bestiary};
render();
})();
