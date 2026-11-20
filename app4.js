'use strict';
/* ============ FLOWS ============ */
function escapeFlow(){openModal(`<h2 style="text-align:center">🛡️ Pause, hero.</h2>
  <div class="quote">“${esc(whyLine())}”</div>
  <p class="small muted" style="text-align:center;margin-bottom:14px">The urge is real, and that’s okay. Pick one, any one:</p>
  <button class="opt" data-a="esc" data-v="sprint"><b>⚔️</b><span>10-minute sprint first<small>Then play guilt-free. Earns +10m play and +25 XP.</small></span></button>
  <button class="opt" data-a="esc" data-v="keeper"><b>🔮</b><span>Talk it through with the Keeper<small>Two minutes on what’s really going on.</small></span></button>
  <button class="opt" data-a="esc" data-v="shrink"><b>🪓</b><span>Task feels too big?<small>Shrink it to a 2-minute first step.</small></span></button>
  <button class="opt" data-a="esc" data-v="roll"><b>🎲</b><span>Bored? Roll a quick quest<small>Something random and small, for novelty.</small></span></button>
  <button class="opt" data-a="esc" data-v="walk"><b>🚶</b><span>5-minute walk or stretch, then decide<small>Reset the body, then choose again.</small></span></button>
  <button class="opt" data-a="esc" data-v="rest"><b>🎮</b><span>I need rest. Play guilt-free.<small>Choosing rest on purpose is a skill too.</small></span></button>`)}
function shrinkFlow(prefill=''){openModal(`<h2>🪓 Shrink the giant</h2>
  <p class="small muted">Big, unclear tasks are why we escape. Let’s make it so small it’s almost silly.</p>
  <label class="f">What are you avoiding?</label><input id="sbig" value="${esc(prefill)}" placeholder="e.g. Build the AI proposal for the client">
  <label class="f">Tiniest first physical step (under 2 minutes)</label><input id="stiny" placeholder="e.g. Open a doc and write the title">
  <div class="row wrap" style="gap:6px;margin-top:8px">${['Open the file','Write the title only','Send one message','Set a 10-min timer','List 3 bullet points'].map(s=>`<button class="chip" data-a="stinyset" data-v="${s}">${s}</button>`).join('')}</div>
  <button class="btn gold block" data-a="shrinksave" style="margin-top:16px">Add quest (+30 XP when done)</button>
  <button class="btn ghost block" data-a="close" style="margin-top:6px">Cancel</button>`)}
let introStep=0;
function intro(){const steps=[
  `<div style="text-align:center"><div style="font-size:64px">🏰</div><h2 style="color:var(--gold2)">Kingdom Reborn</h2>
   <p class="muted" style="margin:10px 0">Your kingdom has fallen into ruin. It happens to every hero. This isn’t a discipline app. It’s a <b style="color:var(--text)">comeback</b> app.</p>
   <div class="card" style="text-align:left"><p>✦ <b>Small counts.</b> On hard days, one 10-minute thing is a full win.</p><p>✦ <b>You can’t lose progress.</b> No streaks to break. Coming back earns a bonus.</p><p>✦ <b>Fun is earned, not forbidden.</b> Games and shows are your reward, not your enemy.</p></div></div>`,
  `<h2>❤️‍🔥 Your why</h2><p class="small muted" style="margin:8px 0">You picked all four roots. In one sentence, in your own words: <b style="color:var(--text)">who or what are you rebuilding for?</b> You can change it any time.</p>
   <textarea id="iwhy" placeholder="e.g. I'm rebuilding so I can look back on this year as the year I came back.">${esc(S.why.text)}</textarea>
   <p class="tiny muted" style="margin-top:6px">This appears when you’re about to escape.</p>`,
  `<h2>🎮 The gentle taper</h2><p class="muted" style="margin:8px 0">No cold turkey. You’ve quit enough things at once.</p>
   <div class="card"><p>Week 1: <b>${fmtMin(S.taper.base)}</b>/day of guilt-free play.</p><p>Each week the base drops <b>${S.taper.step}m</b>, never below <b>${fmtMin(S.taper.floor)}</b>.</p><p>Every focus minute earns a play minute on top. Quests earn bonus time too.</p><p class="small muted">Going over costs nothing. Just log it honestly. Honesty earns XP.</p></div>`];
  openModal(`${steps[introStep]}<div class="dots">${steps.map((_,i)=>`<i class="${i===introStep?'on':''}"></i>`).join('')}</div>
  <button class="btn gold block" data-a="introNext">${introStep<steps.length-1?'Next':'Begin the rebuild ⚔️'}</button>
  ${introStep===0?'<button class="btn ghost block" data-a="introSkip" style="margin-top:6px">Skip</button>':''}`)}

/* ============ ACTIONS ============ */
const A={
  tab:v=>go(v),close:()=>closeModal(),
  energy:v=>setEnergy(v),
  mood:v=>{const d=day();d.mood=+v;touch();save();render();toast(+v<=1?'Thank you for being honest. Today we go gentle. Survival mode is always okay.':'Noted. 💛')},
  done:v=>complete(v),undo:v=>undo(v),swap:v=>swap(+v),roll:()=>roll(),shrink:()=>shrinkFlow(),
  addtoday:v=>{const d=day();if(!d.picks)d.picks=[];if(!d.picks.includes(v))d.picks.push(v);save();render();toast('Added to today ⚔️')},
  fun:v=>{const d=day();d.fun=Math.max(0,(d.fun||0)+(+v));
    if(+v>0&&d.honesty<5){d.honesty++;gain(2,'Honest log',{crit:false,msg:'Logged honestly. Awareness is how change starts.'})}else{touch();save();render()}},
  steps:v=>{const d=day();d.steps=Math.max(0,(d.steps||0)+(+v));bodyXp();save();render()},
  sleep:v=>{const d=day();d.sleep=Math.max(0,Math.round(((d.sleep||0)+(+v))*2)/2);bodyXp();save();render()},
  af:()=>{const d=day();d.af=!d.af;if(d.af&&!d.flags.af){d.flags.af=true;gain(15,'Alcohol-free today',{crit:false,msg:'Clear waters. Your future self thanks you.'})}else{checkAch();save();render()}},
  escape:()=>escapeFlow(),
  esc:v=>{if(v==='sprint'){closeModal();focusDur=10;go('focus');startFocus()}
    else if(v==='keeper'){closeModal();go('keeper');if(window.Keeper)Keeper.prefill('I’m about to escape into games/YouTube right now.')}
    else if(v==='shrink')shrinkFlow();else if(v==='roll')roll();
    else if(v==='walk'){closeModal();gain(10,'Took a pause',{crit:false,msg:'Go. Walk or stretch for 5. Then decide with a clearer head.'})}
    else{closeModal();gain(5,'Chose rest on purpose',{crit:false,msg:'Enjoy it fully, no guilt. Log the time when you’re done.'})}},
  stinyset:v=>{$('#stiny').value=v},
  shrinksave:()=>{const b=$('#sbig').value.trim(),t=$('#stiny').value.trim();if(!b){$('#sbig').focus();return}
    S.custom.push({id:'c'+Date.now(),t:b,tiny:t||'Set a 10-minute timer and just start.',xp:30,fun:15,created:dayKey(),doneDate:null});
    unlock('shrink');closeModal();gain(5,'Shrunk a giant',{crit:false,msg:'The giant is smaller now. Just do the tiny step.'})},
  fdur:v=>{focusDur=+v;render()},ftaskset:v=>{focusTask=v;render()},fstart:()=>startFocus(),
  fend:v=>{if(!S.focus)return;const el=(Date.now()-S.focus.start)/60e3;if(v==='early')finishFocus(Math.min(el,S.focus.mins),false);
    else{S.focus=null;try{wakeLock&&wakeLock.release()}catch(e){}save();if(el>=5){finishFocus(el,false)}else{render();toast('No problem. Starting is a skill. Try again whenever.')}}},
  root:v=>{const r=S.why.roots;S.why.roots=r.includes(v)?r.filter(x=>x!==v):[...r,v];save();render()},
  ledger:()=>{const num=id=>{const x=parseFloat(($(id).value||'').replace(/,/g,''));return isNaN(x)?null:x};
    const e={date:dayKey(),revenue:num('#lr'),cash:num('#lc'),costs:num('#lm')};if(e.revenue==null&&e.cash==null){toast('Add at least revenue or cash.');return}
    const wk=S.company.findIndex(x=>diffDays(x.date,e.date)<7&&diffDays(x.date,e.date)>=0);
    const first=!S.company.some(x=>diffDays(x.date,e.date)<7);
    S.company.push(e);unlock('ledger');if(!S.line.m13&&nextLine()&&nextLine().id==='m13'){}
    if(first)gain(30,'Faced the numbers',{crit:false,msg:'Facing the numbers takes courage. Well done.'});else{save();render();toast('Ledger updated.')}},
  set:v=>{S.settings[v]=!S.settings[v];save();render()},
  taperreset:()=>{if(confirm('Restart the taper from week 1 today?')){S.taper.start=dayKey();save();render()}},
  export:()=>{const b=new Blob([JSON.stringify(S,null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='kingdom-backup-'+dayKey()+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast('Backup downloaded. Keep it somewhere safe.')},
  import:()=>$('#importFile').click(),
  reset:()=>{if(prompt('Type RESET to erase all progress on this device.')==='RESET'){S=fresh();save();go('today');intro()}},
  intro:()=>{introStep=0;intro()},
  introNext:()=>{if(introStep===1){const w=$('#iwhy');if(w){S.why.text=w.value;checkAch()}}
    if(introStep<2){introStep++;intro()}else{S.onboarded=true;save();closeModal();render()}},
  introSkip:()=>{S.onboarded=true;save();closeModal();render()}
};
function bodyXp(){const d=day(),s=S.settings;
  if(d.steps>=s.stepGoal&&!d.flags.steps){d.flags.steps=true;gain(20,'Step goal reached',{crit:false})}
  if(d.sleep>=s.sleepGoal&&!d.flags.sleep){d.flags.sleep=true;gain(20,'Slept enough',{crit:false,msg:'Sleep is a superpower for an ADHD brain. Well rested, hero.'})}}
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el)return;const f=A[el.dataset.a];if(f){e.preventDefault();f(el.dataset.v,el)}});
document.addEventListener('change',e=>{const el=e.target.closest('[data-c]');if(!el)return;const v=el.value,d=day(),s=S.settings;
  switch(el.dataset.c){
    case 'steps':d.steps=v===''?null:Math.max(0,parseInt(v)||0);bodyXp();break;
    case 'sleep':d.sleep=v===''?null:Math.max(0,parseFloat(v)||0);bodyXp();break;
    case 'whytext':S.why.text=v;checkAch();break;case 'future':S.why.future=v;break;
    case 'cname':s.contactName=v;break;case 'cphone':s.contactPhone=v;break;
    case 'tbase':S.taper.base=+v;break;case 'tstep':S.taper.step=+v;break;case 'tfloor':S.taper.floor=+v;break;
    case 'stepgoal':s.stepGoal=Math.max(500,parseInt(v)||6000);break;case 'sleepgoal':s.sleepGoal=Math.max(4,parseFloat(v)||7);break;
    case 'ftask':focusTask=v;return;
  }save();render()});
document.addEventListener('input',e=>{if(e.target.dataset&&e.target.dataset.c==='ftask')focusTask=e.target.value});
$('#importFile').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{const o=JSON.parse(r.result);if(!o||o.v!==1||!o.days)throw 0;if(!confirm('Replace current progress with this backup?'))return;
    localStorage.setItem(KEY,JSON.stringify(o));load();render();toast('Backup restored ✓')}catch(err){toast('That file doesn’t look like a Kingdom backup.')}};r.readAsText(f);e.target.value=''});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();render()}});

/* ============ BOOT ============ */
load();
if(S.focus&&Date.now()>=S.focus.start+S.focus.mins*60e3){const m=S.focus.mins;setTimeout(()=>finishFocus(m,true),300)}
render();setInterval(tick,500);
if(!S.onboarded)intro();
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
