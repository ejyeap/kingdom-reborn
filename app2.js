'use strict';
/* ============ STATE ============ */
const KEY='kingdomReborn.v1';
function fresh(){const t=dayKey();return{v:1,created:t,onboarded:false,xp:0,lastActive:null,
  taper:{start:t,base:360,step:30,floor:120},days:{},line:{},once:{},custom:[],
  why:{roots:['rebuild','people','meaningful','freedom'],text:'',future:''},company:[],ach:{},
  settings:{stepGoal:6000,sleepGoal:7,trackAlcohol:true,sound:true,contactName:'',contactPhone:''},
  focus:null,seed:Math.floor(Math.random()*1e9)}}
let S;
function load(){let raw=null;try{raw=localStorage.getItem(KEY)}catch(e){}
  const f=fresh();
  if(!raw){S=f;return}
  try{const o=JSON.parse(raw);S=Object.assign(f,o);
    S.settings=Object.assign(fresh().settings,o.settings||{});S.taper=Object.assign(fresh().taper,o.taper||{});S.why=Object.assign(fresh().why,o.why||{});
  }catch(e){S=f}}
let saveWarned=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){if(!saveWarned){saveWarned=true;toast('⚠️ Couldn’t save on this device. Export a backup from the Me tab.')}}}
function day(k=dayKey()){if(!S.days[k])S.days[k]={energy:null,mood:null,xp:0,focusMin:0,fun:0,earned:0,done:[],picks:null,g:{},steps:null,sleep:null,af:null,honesty:0,flags:{},checkin:false};return S.days[k]}
function allDays(){return Object.entries(S.days)}

/* ============ XP / LEVELS ============ */
const need=l=>50*(l-1)*l;
function lvlOf(xp){let l=1;while(xp>=need(l+1))l++;return l}
function titleOf(l){let t='Wanderer';for(const[a,n]of TITLES)if(l>=a)t=n;return t}
function tone(){const e=day().energy;return e?ENERGY[e].tone:'gentle'}

function gain(base,label,o={}){
  const d=day();let x=base,crit=false;
  if(o.crit!==false&&base>=15&&Math.random()<.12){x=base*2;crit=true;unlock('crit')}
  const before=lvlOf(S.xp);S.xp+=x;d.xp+=x;
  if(o.key)d.g[o.key]={xp:x,fun:o.fun||0};
  touch();save();
  const after=lvlOf(S.xp);
  burst(crit?40:22);sound(crit?2:1);
  toast(`<div>${esc(o.msg||pick(VOICE[tone()].concat(S.myLines||[])))}</div><div class="x" style="margin-top:4px">${crit?'⚡ Critical hit! ':''}+${x} XP${o.fun?` · +${o.fun}m guilt-free play`:''}</div>${label?`<div class="tiny muted">${esc(label)}</div>`:''}`);
  if(after>before)setTimeout(()=>levelUp(after,before),900);
  checkAch();render();return x;
}
function levelUp(l,prev){
  const nb=BUILDINGS.filter(b=>b.lv>prev&&b.lv<=l);
  if(l>=5)unlock('lv5');
  sound(3);burst(60);
  openModal(`<div style="text-align:center"><div style="font-size:56px">🏆</div><h2 style="color:var(--gold2)">Level ${l}!</h2><p class="muted">You are now <b style="color:var(--text)">${titleOf(l)}</b>.</p>
  ${nb.map(b=>`<div class="card" style="margin-top:12px"><div style="font-size:44px">${b.ic}</div><b>${b.n} restored</b><div class="small muted">${b.d}</div></div>`).join('')}
  <button class="btn gold block" data-a="close" style="margin-top:12px">Onward</button></div>`);
}
function touch(){const t=dayKey(),d=day();
  if(!d.checkin){d.checkin=true;
    if(S.lastActive&&diffDays(S.lastActive,t)>=2&&!d.flags.comeback){d.flags.comeback=true;S.xp+=30;d.xp+=30;unlock('comeback');
      setTimeout(()=>toast('<div>🚪 <b>The gates were never closed.</b> Welcome back, hero.</div><div class="x">+30 XP comeback bonus</div>'),1400)}}
  S.lastActive=t}

/* ============ PLAY TIME (gentle taper) ============ */
function taperWeek(k=dayKey()){return Math.max(0,Math.floor(diffDays(S.taper.start,k)/7))}
function baseFun(k=dayKey()){return Math.max(S.taper.floor,S.taper.base-S.taper.step*taperWeek(k))}
function allowance(k=dayKey()){const d=S.days[k];return baseFun(k)+(d?d.earned:0)}

/* ============ QUESTS ============ */
function allPool(){return POOL.concat(S.customPool||[])}
function poolAvail(excl=[]){return allPool().filter(q=>!(q.once&&S.once[q.id])&&!(q.req&&!S.once[q.req])&&!excl.includes(q.id))}
function findQ(id){return allPool().find(q=>q.id===id)||LINE.find(q=>q.id===id)||S.custom.find(q=>q.id===id)}
function areaOf(q){return q.area||(LINE.includes(q)?'main':'custom')}
function nextLine(){return LINE.find(q=>!S.line[q.id])}
function genPicks(n,keep=[]){
  const r=rng(hash(dayKey()+':'+keep.length)^S.seed);
  const order=n===1?[['work','body','heart'][Math.floor(r()*3)]]:['work','body','heart','work','body'];
  const picks=[...keep];
  for(let i=picks.length;i<n;i++){let opts=poolAvail(picks).filter(q=>q.area===order[i%order.length]);if(!opts.length)opts=poolAvail(picks);if(opts.length)picks.push(opts[Math.floor(r()*opts.length)].id)}
  return picks}
function setEnergy(e){const d=day();d.energy=e;const n=ENERGY[e].n;
  if(!d.picks)d.picks=genPicks(n);
  else{const done=d.picks.filter(id=>d.done.includes(id)),undone=d.picks.filter(id=>!d.done.includes(id));
    let p=[...done,...undone].slice(0,Math.max(n,done.length));if(p.length<n)p=genPicks(n,p);d.picks=p}
  if(!d.flags.checkinXp){d.flags.checkinXp=true;unlock('first');gain(10,'Daily check-in',{crit:false,msg:ENERGY[e].hint})}else{save();render()}}
function complete(id){
  const d=day(),q=findQ(id);if(!q)return;
  if(q.auto==='keeper'){go('keeper');return}
  if(q.auto){go('focus');focusDur=10;render();toast('Pick a task (or not) and press Start. 10 minutes. You’ve got this.');return}
  if(LINE.includes(q)){if(S.line[id])return;S.line[id]=dayKey();unlock('main1');if(LINE.every(x=>S.line[x.id]))unlock('mainDone')}
  else if(q.area){if(d.done.includes(id))return;d.done.push(id);if(q.once){S.once[id]=dayKey();if(id.startsWith('h_support'))unlock('support')}}
  else{if(q.doneDate)return;q.doneDate=dayKey()}
  d.earned+=q.fun||0;
  gain(q.xp,q.t,{fun:q.fun,key:id});
}
function undo(id){
  const d=day(),g=d.g[id],q=findQ(id);if(!g||!q)return;
  if(!confirm('Undo “'+q.t+'”?'))return;
  S.xp=Math.max(0,S.xp-g.xp);d.xp=Math.max(0,d.xp-g.xp);d.earned=Math.max(0,d.earned-g.fun);delete d.g[id];
  if(LINE.includes(q))delete S.line[id];else if(q.area){d.done=d.done.filter(x=>x!==id);if(q.once)delete S.once[id]}else q.doneDate=null;
  save();render()}
function swap(i){const d=day();const cur=d.picks[i];const opts=poolAvail(d.picks).filter(q=>!q.auto||!d.done.includes(q.id));if(!opts.length)return;
  d.picks[i]=pick(opts).id;save();render();toast('🔄 Swapped. Pick what feels doable.')}
function roll(){const d=day();if(!d.picks)d.picks=[];const opts=poolAvail(d.picks).filter(q=>!d.done.includes(q.id));if(!opts.length){toast('You’ve done every side quest. Legendary.');return}
  const q=pick(opts);d.picks.push(q.id);save();closeModal();go('today');sound(1);toast(`🎲 You rolled: <b>${esc(q.t)}</b><div class="tiny muted">${esc(q.tiny)}</div>`)}

/* ============ FOCUS ============ */
let focusDur=10,focusTask='';
let wakeLock=null;
async function startFocus(){S.focus={start:Date.now(),mins:focusDur,task:focusTask.trim()};save();render();sound(1);
  try{wakeLock=await navigator.wakeLock?.request('screen')}catch(e){}}
function finishFocus(mins,full){
  const d=day();mins=Math.round(mins);const task=S.focus&&S.focus.task;S.focus=null;
  try{wakeLock&&wakeLock.release();wakeLock=null}catch(e){}
  try{navigator.vibrate&&navigator.vibrate([120,80,120])}catch(e){}
  if(mins<5){gain(3,'Starting counts',{crit:false,msg:'You started. That’s the hardest part, and it counts.'});return}
  d.focusMin+=mins;d.earned+=mins;unlock('focus1');
  if(mins>=10&&!d.done.includes('w_focus')){d.done.push('w_focus')}
  gain(mins*2+5,(full?'Focus block complete':'Focus block')+(task?': '+task:''),{fun:mins,msg:full?pick(VOICE[tone()]):'Stopped early and still counted. Smart.'});
}
function tick(){if(!S||!S.focus)return;const rem=S.focus.start+S.focus.mins*60e3-Date.now();
  if(rem<=0){finishFocus(S.focus.mins,true);return}
  const el=$('#ftm');if(el){const s=Math.ceil(rem/1000);el.textContent=Math.floor(s/60)+':'+pad(s%60);
    const c=$('#fring');if(c){const tot=S.focus.mins*60e3;c.setAttribute('stroke-dashoffset',String(691*(rem/tot)))}}}

/* ============ ACHIEVEMENTS ============ */
function unlock(id){if(!S.ach[id]){S.ach[id]=dayKey();const a=ACH.find(x=>x.id===id);if(a)setTimeout(()=>toast(`🏅 Achievement: <b>${a.ic} ${a.n}</b><div class="tiny muted">${a.d}</div>`),2200)}}
function totals(){let shown=0,focus=0,honest=0,steady=0,af=0;
  for(const[k,d]of allDays()){if(d.checkin)shown++;focus+=d.focusMin||0;if(d.fun>0)honest++;if(d.checkin&&d.fun>0&&d.fun<=baseFun(k)+d.earned)steady++;if(d.af===true)af++}
  return{shown,focus,honest,steady,af}}
function checkAch(){const t=totals();
  if(t.shown>=3)unlock('d3');if(t.shown>=7)unlock('d7');if(t.shown>=30)unlock('d30');
  if(t.focus>=600)unlock('focus10h');if(t.honest>=7)unlock('honest');if(t.steady>=3)unlock('steady');if(t.af>=7)unlock('clear7');
  if((S.why.text||'').trim().length>10)unlock('why')}

/* ============ FX ============ */
let toastT;
function toast(h){const t=$('#toast');t.innerHTML=h;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),3800)}
function burst(n){const fx=$('#fx');const cols=['#f2c14e','#ffe08f','#6aa9ff','#5fd38d','#ff8fab','#b18cff'];
  for(let i=0;i<n;i++){const s=document.createElement('i');const a=Math.random()*Math.PI*2,r=120+Math.random()*220;
    s.style.cssText=`background:${pick(cols)};--dx:${Math.cos(a)*r}px;--dy:${Math.sin(a)*r+120}px;--rot:${Math.random()*720}deg`;fx.appendChild(s);setTimeout(()=>s.remove(),1200)}}
let actx;
function sound(kind){if(!S.settings.sound)return;try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();
  const notes=kind===3?[523,659,784,1047]:kind===2?[659,880,1175]:[784,1047];
  notes.forEach((f,i)=>{const o=actx.createOscillator(),g=actx.createGain();o.type='triangle';o.frequency.value=f;
    const t0=actx.currentTime+i*.09;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.12,t0+.01);g.gain.exponentialRampToValueAtTime(.001,t0+.35);
    o.connect(g).connect(actx.destination);o.start(t0);o.stop(t0+.4)})}catch(e){}}

/* ============ MODAL ============ */
function openModal(h){$('#sheet').innerHTML=h;$('#modal').classList.remove('hidden')}
function closeModal(){$('#modal').classList.add('hidden')}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});

