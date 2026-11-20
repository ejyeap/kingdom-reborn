'use strict';
/* ============ BOSS BATTLES (1/3) ============ */
const TYPES={
  money:{l:'Money',ic:'💰',hue:138,eye:'#ff3b3b',desc:'Revenue, sales, pricing, costs'},
  systems:{l:'Systems',ic:'⚙️',hue:214,eye:'#ff4d6d',desc:'Tools, AI, processes, tech'},
  people:{l:'People',ic:'👥',hue:356,eye:'#ffd23f',desc:'Team, hiring, clients, partners'}
};
const RANKS={
  C:{hp:100,hours:3,xp:150,wxp:20,size:'a few days'},
  B:{hp:250,hours:8,xp:300,wxp:25,size:'1-2 weeks'},
  A:{hp:600,hours:20,xp:600,wxp:30,size:'~a month'},
  S:{hp:1500,hours:40,xp:1200,wxp:40,size:'a quarter+'},
  SS:{hp:5000,hours:300,xp:3000,wxp:50,size:'a year'}
};
const NAMES={
  money:{C:'Coin Slime',B:'Greed Goblin',A:'Vault Golem',S:'Hoard Dragon',SS:'Midas Wyrm'},
  systems:{C:'Glitch Bug',B:'Cog Imp',A:'Iron Sentinel',S:'Storm Leviathan',SS:'Clockwork Colossus'},
  people:{C:'Grumble Imp',B:'Doubt Wraith',A:'War Ogre',S:'Twin-Head Titan',SS:'Hydra Sovereign'}
};
const MAX_ACTIVE=5,PAST_XP=50;
/* Pixel sprites: left half of each row, mirrored at draw time.
   o outline · b body · h highlight · d shadow · e glowing eye · k black · w bone/teeth · r mouth · g gold */
const SPR={
money:{
 C:["....og","...ogg","...ogg","....oo","..oooo",".obbhh",".obbbb","obkeeb","obbbbb","obrwrr","obdddd",".ooooo"],
 B:["o......","ow....o","oww..ob",".owo.ob","..oobbb","..obhhb","..okeeb","..obbbb","...obrw","...obrr","..obbbb",".ogobbd",".gggobd","..ooooo"],
 A:["........",".ow.....",".oww....","..owoooo","..obbbbb","..obhhhb","..okeeeb","..obbbbb","..obwrwr","oooobbbb","obgobbdb","obbobggb","obbobddd","oooobddd","...obbo.","...oooo."],
 S:["..........","o.......ow","ob......ow","obo....oww","obbo...owo","obbbo.oobb","obhbboobhb","obbbbobbbb",".obbbobkee",".obbdobbbb","..obdobwrw","..odoobrrr","...o.obwrw",".....obbbb","....obgbbb","...obbggdd","...obgggbd","...obbddbd","..obbo.obo","..ooo..ooo"]
},
systems:{
 C:[".o....","..o...","...o..","...ooo","..obkk","..okee",".oobbo","obobhb","o.obbb","obobdb","o..obo","...o.o"],
 B:["...o.o.","...ohoh","....ooo","..oo.ob",".owo.ob",".oowoob","...obbb","...okkk","...okee","...obbb","..obbrw",".obodbb",".o.obbo","...oo.."],
 A:["........","..o.....","..oo....","..owo...","...owooo","...obbbb","...obhhh","...okkkk","...okeee","...obbbb","oo.obddd","obooobbb","obhobhbb","obooobbo","oo.obbo.","...ooo.."],
 S:["..........","......o...",".....ohoo.","....obhbbo","...obbbbbb","..obbkeebb","..obbbbbbb","..obwrwrwr","..obrrrrrr","..obwrwrwr","o..obbbbbb","ob.obdbbbb","obbobdddbb",".obbbobbbb","..obbobbdd","...oobbbbb","....oobbdd",".obbbbbbbo","obddddddo.",".oooooooo."]
},
people:{
 C:["o.....","ow....","owo.oo",".oobbb","..obhb","..okeb","..obbb","..obrw",".oobbb","obbddd",".obbob","..oo.o"],
 B:["....ooo","...obbb","..obbhh","..obkkk",".obkkek",".obkkkk",".obkkrr","obbbbbb","obdbbbb","obdbbdb","obdbdbb","obobobd","o.o.obo","....o.o"],
 A:["........",".o......",".owo....","..owoooo","...obbbb","...obhhb","...okeeb","...obbbb","...obwrr","..oobbww",".obbbbbb","obbdobbb","obbdobdd","obo.obbb","oo..obbo","....ooo."],
 S:["..........",".ow...ow..",".oww.oww..","..owowoo..","..oobbbo..","..obkeebo.","..obbbbbo.","..obwrwbo.","...obbbo..","....obbooo","..oobbbbbb",".obbbbhbbb","obbbobbbbb","obdoobbddd","obo.obbbbb","oo..obbdbb","....obbobb","....obbobd","...obbo.ob","...oooo.oo"]
}};
SPR.money.SS=["o.......g..g", "ob......gggg", "obo.....gggg", "obbo..owoooo", "obbbo.owobbb", "obhbbooobhhb", "obbbbbbobkee", "obbbbbbobbbb", ".obbdbbobwrw", ".obbdbbobrrr", "..obdbbobwrw", "..obddboobbb", "...odbo.obbb", "....oo..obhb", ".......obbbb", "......obbbdd", ".....obbgbbd", "....obbggbbd", "...ogggggdbb", "..oggggggggb", ".ogggggggggg", "oggggwgggggg", "ogggggggwggg", "oooooooooooo"];
SPR.systems.SS=[".......oh.ho", "......ohhhhh", ".....ohh.ooo", ".....oh.obbb", "....ooh.obbb", "........okkk", "........okee", "........obbb", "....ooooobrw", "...obbbbbbbb", "..obhhbbobbb", ".obbbbbbobdd", ".obdobbbobbb", "obbdobbbobgb", "obbdobbbobgg", "obbdobbbobbb", "oeeeobbbobdd", "ooooobbbobbb", ".....obbbobb", ".....obbo.ob", "....obbbo.ob", "....obbbo.ob", "...obbbbo.ob", "...ooooo..oo"];
SPR.people.SS=["..o.....o...", ".owo...owo..", ".oow...oow..", "obbbo.obbbo.", "okebo.okebo.", "obbbo.obbbo.", "owrwo.owrwo.", ".obo...obo..", ".obo...obo..", ".obbo.obbo..", "..obbobbo...", "..obbbbbooo.", "...obbbbbbbb", "..obbbhhbbbb", ".obbbbbbbbbb", "obbdbbbbgbbb", "obdobbbbbbbb", "obdobbddbbbb", "obo.obbbbbdd", "oo..obbbbbbb", "....obbobbdd", "...obbo.obbb", "..obbo..obbo", "..ooo...ooo."];
const HEAD={C:.62,B:.6,A:.56,S:.5,SS:.48};
const RORD={C:1,B:2,A:3,S:4,SS:5};
function pal(type,shade){const t=TYPES[type],h=t.hue,i=shade%5;
  const L=[40,48,33,55,44][i],Sa=[55,62,50,48,72][i];
  return{o:`hsl(${h},40%,8%)`,b:`hsl(${h},${Sa}%,${L}%)`,h:`hsl(${h},${Sa}%,${L+15}%)`,d:`hsl(${h},${Sa}%,${L-13}%)`,
    e:t.eye,k:'#0b0b12',w:'#efe6cf',r:'#2a0710',g:'#f2c14e'}}
const cache={};
function sprite(type,rank,shade,px,head){
  const key=[type,rank,shade,px,head?1:0].join('|');if(cache[key])return cache[key];
  const rows=SPR[type][rank].map(r=>r+r.split('').reverse().join(''));const P=pal(type,shade);
  const W=rows[0].length,H=head?Math.ceil(rows.length*HEAD[rank]):rows.length;
  let s=`<svg class="px" width="${W*px}" height="${H*px}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" aria-hidden="true">`;
  for(let y=0;y<H;y++){const r=rows[y];let x=0;
    while(x<W){const c=r[x];if(c==='.'||!P[c]){x++;continue}let n=1;while(x+n<W&&r[x+n]===c)n++;
      s+=`<rect x="${x}" y="${y}" width="${n}" height="1" fill="${P[c]}"/>`;x+=n}}
  return cache[key]=s+'</svg>'}

/* ---------- state ---------- */
function L(){return S.bosses||(S.bosses=[])}
const uid=()=>'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const byId=id=>L().find(b=>b.id===id);
const activeList=()=>L().filter(b=>b.status==='active');
const lairList=()=>L().filter(b=>b.status==='lair');
const archived=()=>L().filter(b=>b.status==='archived');
const ts=b=>b.ts||parseInt(String(b.id).slice(1,-4),36)||0;
const trophies=()=>L().filter(b=>b.status==='defeated').sort((a,b)=>(b.defeated||'').localeCompare(a.defeated||'')||(b.won||0)-(a.won||0));
const short=(t,n=22)=>t.length>n?t.slice(0,n-1)+'…':t;
const fmtD=k=>k?parseKey(k).toLocaleDateString(undefined,{month:'short',day:'numeric'}):'';
function hp(b){if(b.rank==='SS')return mhp(b);const R=RANKS[b.rank],n=b.weak.length,done=b.weak.filter(w=>w.done).length;
  const share=n?0.3:1,fd=Math.min(share*R.hp,(b.focusMin||0)*share*R.hp/(R.hours*60)),wd=n?0.7*R.hp*done/n:0;
  const left=b.status==='defeated'?0:Math.max(0,Math.round(R.hp-fd-wd));return{max:R.hp,left,done,n,pct:left/R.hp*100}}
function create(o){
  const b={id:uid(),name:clean(o.name,80),type:o.type,rank:o.rank,shade:Math.floor(Math.random()*5),why:clean(o.why||'',140),
    status:o.status,created:dayKey(),activated:null,defeated:null,won:0,ts:Date.now(),past:!!o.past,focusMin:0,by:o.by||'you',
    weak:(o.weak||[]).map(t=>clean(t,120)).filter(Boolean).slice(0,12).map(t=>({id:uid(),t,done:null}))};
  if(b.status==='active'&&activeList().length>=MAX_ACTIVE)b.status='lair';
  if(b.status==='active')b.activated=dayKey();
  L().unshift(b);return b}
function clean(v,n){return String(v||'').replace(/\s+/g,' ').trim().slice(0,n)}

/* ---------- rewards ---------- */
function award(x,fun,label,msg){const d=day(),before=lvlOf(S.xp);S.xp+=x;d.xp+=x;if(fun)d.earned+=fun;touch();save();burst(30);sound(2);
  toast(`<div>${esc(msg)}</div><div class="x" style="margin-top:4px">+${x} XP${fun?` · +${fun}m guilt-free play`:''}</div>${label?`<div class="tiny muted">${esc(label)}</div>`:''}`);
  checkAch();return before}
function victory(b,lvBefore){
  const before=lvBefore!=null?lvBefore:lvlOf(S.xp),x=b.past?PAST_XP:RANKS[b.rank].xp,d=day();
  b.status='defeated';b.defeated=b.defeated||dayKey();b.won=Date.now();S.xp+=x;d.xp+=x;touch();
  if(!b.past){unlock('boss1');if(b.rank==='S')unlock('bossS');if(b.rank==='SS')unlock('myth1')}
  if(trophies().length>=5)unlock('boss5');
  save();checkAch();render();burst(b.past?30:90);sound(3);
  const after=lvlOf(S.xp);
  openModal(`<div style="text-align:center" class="t-${b.type}">
   <div class="vic">${b.past?'TROPHY HUNG':'VICTORY!'}</div>
   <div class="bsprite big dying">${sprite(b.type,b.rank,b.shade,7)}</div>
   <h2>${esc(b.name)}</h2><p class="small muted">${b.past?'A past victory, honored on your wall.':`The ${NAMES[b.type][b.rank]} falls. Its head now hangs on your Trophy Wall.`}</p>
   <div class="x" style="color:var(--gold2);font-weight:800;font-size:20px;margin-top:8px">+${x} XP</div>
   ${stats(b)}
   <button class="btn gold block" data-a="bvclose" data-v="${after>before?before+'|'+after:''}" style="margin-top:14px">Claim trophy 💀</button></div>`)}
function stats(b){const days=b.past?null:diffDays(b.activated||b.created,b.defeated||dayKey())+1,h=hp(b);
  return `<div class="bstats">
   <div class="stat"><b>${fmtD(b.defeated)}</b><span>${b.past?'finished (past victory)':'defeated'}</span></div>
   <div class="stat"><b>${days==null?'—':days+(days===1?' day':' days')}</b><span>in battle</span></div>
   <div class="stat"><b>${fmtMin(b.focusMin||0)}</b><span>focus dealt</span></div>
   <div class="stat"><b>${h.n?h.done+'/'+h.n:'—'}</b><span>${b.rank==='SS'?'minions defeated':'weak points cleared'}</span></div></div>`}

/* ---------- views ---------- */
function battleCard(b){if(b.rank==='SS')return mythicCard(b);const h=hp(b),T=TYPES[b.type],nw=b.weak.find(w=>!w.done);
  return `<div class="bcard t-${b.type}"><div class="row between"><span class="tiny muted">${T.ic} ${T.l} · ${NAMES[b.type][b.rank]}</span><span class="rk r${b.rank}">${b.rank}</span></div>
  <button class="bsprite" data-a="bopen" data-v="${b.id}" aria-label="Open ${esc(b.name)}">${sprite(b.type,b.rank,b.shade,6)}</button>
  <b class="bname">${esc(b.name)}</b>
  <div class="row between tiny muted" style="margin-top:6px"><span>HP ${h.left} / ${h.max}</span><span>${h.n?`${h.done}/${h.n} weak points`:'no weak points yet'}</span></div>
  <div class="bar hp"><i style="width:${h.pct}%"></i></div>
  ${nw?`<div class="bweak"><button class="chk sm" data-a="bweak" data-v="${b.id}|${nw.id}" aria-label="Mark weak point done"></button><div class="small" style="min-width:0"><span class="tiny muted">Next weak point</span><br>${esc(nw.t)}</div></div>`
    :`<div class="bweak small muted">${h.n?'All weak points destroyed.':'Break it into weak points for big damage.'}</div>`}
  <div class="grid2" style="margin-top:10px"><button class="btn sm gold" data-a="battack" data-v="${b.id}">⚔️ Attack</button><button class="btn sm" data-a="bopen" data-v="${b.id}">Details</button></div></div>`}
function tile(b){return `<button class="btile t-${b.type}" data-a="bopen" data-v="${b.id}">${sprite(b.type,b.rank,b.shade,b.rank==='SS'?2:3)}<span class="rk r${b.rank}">${b.rank}</span><span class="nm">${esc(b.name)}</span></button>`}
function trophy(b){return `<button class="btro t-${b.type}" data-a="bopen" data-v="${b.id}"><span class="plq">${sprite(b.type,b.rank,b.shade,3,true)}</span><span class="rk r${b.rank}">${b.rank}</span><span class="nm">${esc(b.name)}</span><span class="dt">${b.past?'past · ':''}${fmtD(b.defeated)}</span></button>`}
function vBosses(){const act=activeList(),lair=lairList(),tro=trophies();
  let h=`<div class="section-t" style="margin-top:8px"><h3>⚔️ In battle <span class="tiny muted">${act.length}/${MAX_ACTIVE}</span></h3><button class="btn sm gold" data-a="bnew">+ New boss</button></div>`;
  h+=act.length?`<div class="bcar">${act.map(battleCard).join('')}</div>${act.length>1?`<div class="tiny muted" style="text-align:center">swipe for all ${act.length} bosses →</div>`:''}`
    :`<div class="card small muted">No bosses in battle. Tap <b>+ New boss</b> and name your biggest project or idea, or ask the Keeper: “turn my project into a boss”.</div>`;
  const nar=archived().length;
  h+=`<div class="section-t"><h3>🏰 Lair <span class="tiny muted">waiting${lair.length?' · '+lair.length:''}</span></h3>${nar?`<button class="tiny muted" data-a="barch">🗄️ ${nar} archived</button>`:''}</div>`;
  h+=lairView();
  h+=`<div class="section-t"><h3>💀 Trophy Wall <span class="tiny muted">${tro.length}</span></h3><button class="tiny muted" data-a="bpast">+ past victory</button></div>`;
  h+=tro.length?`<div class="bwall">${tro.slice(0,8).map(trophy).join('')}</div>${tro.length>8?`<button class="btn sm ghost block" data-a="bwall" style="margin-top:8px">See all ${tro.length} trophies ›</button>`:''}`
    :`<div class="card small muted">Defeated bosses hang their heads here. Add projects you've already finished with <b>+ past victory</b>.</div>`;
  return h}
let openId=null;
function openBoss(id){const b=byId(id);if(!b)return;openId=id;if(b.rank==='SS'){mythicDetail(b);return}const h=hp(b),T=TYPES[b.type],st=b.status;
  openModal(`<div class="t-${b.type}"><div class="row between"><span class="tiny muted">${T.ic} ${T.l} · ${NAMES[b.type][b.rank]}</span><span class="rk r${b.rank}">Rank ${b.rank}</span></div>
  <div class="bsprite big ${st==='defeated'?'dead':''}">${sprite(b.type,b.rank,b.shade,7)}</div>
  <h2 style="text-align:center">${esc(b.name)}</h2>${b.why?`<p class="small muted" style="text-align:center">${esc(b.why)}</p>`:''}
  ${st==='defeated'?stats(b):`<div class="row between tiny muted" style="margin-top:8px"><span>HP ${h.left} / ${h.max}</span><span>${fmtMin(b.focusMin||0)} of focus dealt</span></div><div class="bar hp"><i style="width:${h.pct}%"></i></div>`}
  <label class="f">Weak points ${h.n?`(${h.done}/${h.n})`:''}</label>
  <div>${b.weak.map(w=>`<div class="bwrow ${w.done?'ok':''}"><button class="chk sm" data-a="bweak" data-v="${b.id}|${w.id}" ${st==='defeated'?'disabled':''} aria-label="Toggle weak point">${w.done?'✓':''}</button><span>${esc(w.t)}</span>${!w.done&&st!=='defeated'?`<button class="tiny muted" data-a="bwdel" data-v="${b.id}|${w.id}" aria-label="Remove weak point">✕</button>`:''}</div>`).join('')||'<p class="small muted">None yet. Break it into steps you could finish in one sitting.</p>'}</div>
  ${st==='defeated'?`<button class="btn block" data-a="close" style="margin-top:14px">Close</button><button class="tiny muted" data-a="bdel" data-v="${b.id}" style="display:block;margin:12px auto 0">Remove trophy</button>`
  :`<div class="row" style="margin-top:8px"><input id="bwnew" maxlength="120" placeholder="Add a weak point…"><button class="btn sm" data-a="bwadd" data-v="${b.id}">Add</button></div>
  <p class="tiny muted" style="margin-top:6px">Tip: ask the Keeper to “split ${esc(short(b.name,30))} into weak points”.</p>
  <div class="grid2" style="margin-top:12px">${st==='active'?`<button class="btn gold" data-a="battack" data-v="${b.id}">⚔️ Attack</button><button class="btn" data-a="bmove" data-v="${b.id}|lair">Back to Lair</button>`
    :`<button class="btn gold" data-a="bmove" data-v="${b.id}|active">⚔️ Send to battle</button><button class="btn" data-a="close">Close</button>`}</div>
  <button class="btn ghost block" data-a="bfinal" data-v="${b.id}" style="margin-top:8px">🗡️ Final blow (the project is done)</button>
  <button class="btn ghost block" data-a="barchive" data-v="${b.id}" style="margin-top:4px">🗄️ Archive (set aside, no penalty)</button>
  <button class="tiny muted" data-a="bdel" data-v="${b.id}" style="display:block;margin:10px auto 0">Delete forever</button>`}</div>`)}
let draft={type:'money',rank:'B',past:false,name:'',weak:'',why:'',mode:'fin',metric:'Revenue',unit:'',total:'',start:'',split:'even',mins:''};
function keepDraft(){if($('#modal').classList.contains('hidden'))return;const g=id=>{const el=document.getElementById(id);return el?el.value:null};
  const n=g('bname'),w=g('bweaks'),y=g('bwhy'),dt=g('bdate');if(n!=null)draft.name=n;if(w!=null)draft.weak=w;if(y!=null)draft.why=y;if(dt!=null)draft.date=dt;
  for(const[k,id]of[['metric','bmetric'],['unit','bunit'],['total','btotal'],['start','bstart'],['mins','bmins']]){const v=g(id);if(v!=null)draft[k]=v}}
function newBoss(){const t=draft.type,r=draft.rank,full=activeList().length>=MAX_ACTIVE,M=r==='SS'&&!draft.past;
  const fin=draft.mode!=='proj',tot=num(draft.total);
  let prevTxt='';
  if(M&&fin&&tot>0){const w=draft.split==='ramp'?[...Array(12)].map((_,i)=>Math.pow(1.05,i)):Array(12).fill(1),sw=w.reduce((a,x)=>a+x,0),u=draft.unit?draft.unit+' ':'';
    prevTxt=draft.split==='ramp'?`Starts ≈ ${u}${Math.round(tot*w[0]/sw).toLocaleString()}/month, grows to ≈ ${u}${Math.round(tot*w[11]/sw).toLocaleString()}`:`≈ ${u}${Math.round(tot/12).toLocaleString()} per month`}
  openModal(`<h2>${draft.past?'🏆 Add a past victory':M?'🌌 Summon a Mythic':'🐉 Summon a new boss'}</h2>
  <p class="small muted">${draft.past?'A project you already finished. It goes straight onto your Trophy Wall.':M?'A year-long goal. Its minions must fall before it can be beaten.':'Name a big project or idea. Bigger projects become bigger, tougher bosses.'}</p>
  <label class="f">${M&&fin?'Name your goal':'Project or big idea'}</label><input id="bname" maxlength="80" value="${esc(draft.name)}" placeholder="${M&&fin?'e.g. 2027 revenue goal':'e.g. Launch the AI proposal tool'}">
  <label class="f">Type</label><div class="btypes">${Object.entries(TYPES).map(([k,v])=>`<button class="t-${k} ${t===k?'on':''}" data-a="btype" data-v="${k}">${sprite(k,'C',1,3)}<b>${v.l}</b><span>${v.desc}</span></button>`).join('')}</div>
  <label class="f">Rank (how big is it?)</label><div class="branks">${Object.entries(RANKS).filter(([k])=>k!=='SS').map(([k,v])=>`<button class="${r===k?'on':''}" data-a="brank" data-v="${k}"><span class="rk r${k}">${k}</span><span class="tiny muted">${v.size}</span></button>`).join('')}</div>
  ${draft.past?'':`<button class="mythbtn ${M?'on':''}" data-a="brank" data-v="SS"><span class="rk rSS">SS</span><span style="text-align:left"><b>Mythic</b><br><span class="tiny muted">A year-long goal, guarded by minions that must fall first</span></span></button>`}
  <div class="bprev t-${t}">${sprite(t,M?'SS':r,2,M?3:5)}<div><b>${NAMES[t][M?'SS':r]}</b><div class="tiny muted">${M?`${RANKS.SS.xp} XP · ${fin?'12 monthly minions':'up to 12 minions'}`:`${RANKS[r].hp} HP · ${draft.past?'+'+PAST_XP+' XP':'+'+RANKS[r].xp+' XP when defeated'}`}</div></div></div>
  ${draft.past?`<label class="f">When did you finish it?</label><input id="bdate" type="date" max="${dayKey()}" value="${esc(draft.date||dayKey())}">`
  :M?`<label class="f">Kind of Mythic</label><div class="grid2"><button class="chip ${fin?'on':''}" data-a="bmode" data-v="fin">💰 Financial goal · 12 months</button><button class="chip ${fin?'':'on'}" data-a="bmode" data-v="proj">🗺️ Project · custom minions</button></div>
    ${fin?`<div class="grid2"><div><label class="f">Measure</label><input id="bmetric" maxlength="24" value="${esc(draft.metric||'Revenue')}" placeholder="Revenue"></div><div><label class="f">Currency</label><input id="bunit" maxlength="6" value="${esc(draft.unit||'')}" placeholder="RM, $, €"></div></div>
    <div class="row wrap" style="gap:6px;margin-top:6px">${['Revenue','Profit','Savings','Sales'].map(x=>`<button class="chip" data-a="bmetric" data-v="${x}">${x}</button>`).join('')}</div>
    <div class="grid2"><div><label class="f">Yearly goal</label><input id="btotal" inputmode="decimal" value="${esc(draft.total||'')}" placeholder="e.g. 240000"></div><div><label class="f">First month</label><input id="bstart" type="month" value="${esc(draft.start||dayKey().slice(0,7))}"></div></div>
    <label class="f">How should the months be split?</label><div class="grid2"><button class="chip ${draft.split!=='ramp'?'on':''}" data-a="bsplit" data-v="even">Even</button><button class="chip ${draft.split==='ramp'?'on':''}" data-a="bsplit" data-v="ramp">Ramp up +5%/mo</button></div>
    ${prevTxt?`<p class="small" style="margin-top:8px">📊 ${prevTxt}</p>`:''}
    <p class="tiny muted" style="margin-top:6px">Nothing is set in stone: you can adjust the goal, lock months and rebalance as you learn.</p>`
    :`<label class="f">Minions (sub-projects, one per line, up to 12)</label><textarea id="bmins" placeholder="Hire a sales lead&#10;Launch the new offer&#10;Systemize onboarding">${esc(draft.mins||'')}</textarea>`}
    <label class="f">Why it matters (optional)</label><input id="bwhy" maxlength="140" value="${esc(draft.why)}" placeholder="e.g. A stable company the team can count on">`
  :`<label class="f">Weak points (optional, one per line)</label><textarea id="bweaks" placeholder="Draft the outline&#10;Get pricing from 2 vendors&#10;Demo to 1 client">${esc(draft.weak)}</textarea>
  <label class="f">Why it matters (optional)</label><input id="bwhy" maxlength="140" value="${esc(draft.why)}" placeholder="e.g. Brings in recurring revenue">`}
  <button class="btn gold block" data-a="bcreate" data-v="${draft.past?'past':full?'lair':'active'}" style="margin-top:14px">${draft.past?'💀 Hang the trophy':M?(full?'🌌 Summon the Mythic to the Lair':'🌌 Summon the Mythic'):full?'Summon to the Lair (battle is full)':'⚔️ Summon to battle'}</button>
  ${draft.past||full?'':`<button class="btn ghost block" data-a="bcreate" data-v="lair" style="margin-top:6px">Summon to the Lair for later</button>`}`)}
function todayStrip(){const act=activeList();
  if(!act.length)return `<button class="card bstrip" data-a="goboss" style="width:100%;text-align:left"><span style="font-size:28px">🐉</span><div style="flex:1"><b>Boss Battles</b><div class="small muted">Turn a big project into a boss and beat it piece by piece.</div></div><span class="muted">›</span></button>`;
  const b=act[0],h=hp(b);let line;
  if(b.rank==='SS'){const cm=curMinion(b);line=exposed(b)?'🌌 Exposed! Deal the final blow':b.mode==='fin'&&cm?`${ml(cm.month)} minion: ${fm(b,cm.actual)} / ${fm(b,cm.target)}`:cm?'▸ Next minion: '+esc(cm.name):''}
  else{const nw=b.weak.find(w=>!w.done);line=nw?'▸ '+esc(nw.t):h.n?'Ready for the final blow':'Add weak points to deal big damage'}
  return `<div class="section-t"><h3>🐉 Boss in battle</h3><button class="tiny muted" data-a="goboss">all ${act.length} ›</button></div>
  <div class="card bstrip t-${b.type}"><button data-a="bopen" data-v="${b.id}" aria-label="Open boss">${sprite(b.type,b.rank,b.shade,b.rank==='SS'?2:3)}</button><div style="flex:1;min-width:0"><b class="ell" style="display:block">${esc(b.name)}</b><div class="bar hp" style="margin:6px 0"><i style="width:${h.pct}%"></i></div><div class="tiny muted ell">${line}</div></div><button class="btn sm gold" data-a="battack" data-v="${b.id}" aria-label="Attack">⚔️</button></div>`}

