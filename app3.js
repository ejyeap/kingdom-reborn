'use strict';
/* ============ VIEWS ============ */
let TAB='today';
function go(t){TAB=t;window.scrollTo(0,0);render()}
function whyLine(){const own=(S.why.text||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const roots=S.why.roots.map(r=>WHY_ROOTS[r]&&WHY_ROOTS[r].s).filter(Boolean);
  return own.length&&Math.random()<.7?pick(own):pick(roots.length?roots:[WHY_ROOTS.rebuild.s])}

function qCard(q,o={}){const a=AREAS[o.area||areaOf(q)];const done=o.done;
  return `<div class="q ${done?'done':''}" style="--c:${a.c}">
   <div class="ic">${o.ic||a.ic}</div>
   <div class="bd"><div class="t">${esc(q.t)}</div>${!done?`<div class="tn">▸ ${esc(q.tiny||'')}</div>`:''}
   <div class="meta">${o.tag?o.tag+' · ':''}${q.auto===true?'+25 XP · earns play time = minutes focused':`+${q.xp} XP${q.fun?` · +${q.fun}m play`:''}`}</div></div>
   ${o.swap!=null&&!done?`<button class="swap" data-a="swap" data-v="${o.swap}" aria-label="Swap quest">🔄</button>`:''}
   <button class="chk" data-a="${done?'undo':'done'}" data-v="${esc(q.id)}" aria-label="${done?'Undo':'Complete'}">${done?'✓':''}</button></div>`}

function vToday(){
  const d=day(),e=d.energy,tn=tone(),nl=nextLine();
  const hr=new Date().getHours();const tod=hr<12?'Good morning':hr<18?'Good afternoon':'Good evening';
  let h=`<p class="small muted" style="margin:0 2px">${tod} · ${new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</p>
  <div class="voice">${esc(e?pick(GREET[tn]):'How are you arriving today? Be honest. Every answer is the right one.')}</div>`;
  h+=`<div class="card ${e?'':'glow'}"><div class="row between"><h3>${e?'Today’s energy':'Check in'}</h3>${e?`<span class="tiny muted">tap to change</span>`:'<span class="tiny muted">+10 XP</span>'}</div>
  <div class="energy">${Object.entries(ENERGY).map(([k,v])=>`<button class="${e===k?'on':''}" data-a="energy" data-v="${k}"><b>${v.ic}</b>${v.l}</button>`).join('')}</div>
  <div class="moods" aria-label="Mood">${MOODS.map((m,i)=>`<button class="${d.mood===i?'on':''}" data-a="mood" data-v="${i}" aria-label="Mood ${i+1}">${m}</button>`).join('')}</div>
  ${e?`<p class="small muted" style="margin-top:8px">${esc(ENERGY[e].hint)}</p>`:''}</div>`;
  if(e&&window.Keeper)h+=Keeper.todayCard();
  if(!e){h+=`<div class="card"><p class="muted small">Pick your energy and the app will size today to fit. <b style="color:var(--text)">Survival mode</b> = just one 10-minute thing. That still counts as a full day.</p></div>`;return h+funCard()}
  // main quest
  if(nl){const optional=e==='survival';
    h+=`<div class="section-t"><h3>👑 Main quest${optional?' <span class="tiny muted">(only if you feel like it)</span>':''}</h3><span class="tiny muted">${LINE.filter(q=>S.line[q.id]).length}/${LINE.length}</span></div>`;
    h+=qCard(nl,{area:'main',tag:LINE_NAME})}
  else h+=`<div class="card glow"><b>👑 Main quest complete!</b><p class="small muted">The Treasury of insight is yours. Add your next big mission as your own quests in the Quests tab.</p></div>`;
  // side quests
  h+=`<div class="section-t"><h3>⚔️ Side quests</h3><span class="tiny muted">${(d.picks||[]).filter(id=>d.done.includes(id)).length}/${(d.picks||[]).length} done</span></div>`;
  (d.picks||[]).forEach((id,i)=>{const q=findQ(id);if(q)h+=qCard(q,{done:d.done.includes(id),swap:i})});
  const allDone=(d.picks||[]).length&&(d.picks||[]).every(id=>d.done.includes(id));
  if(allDone)h+=`<div class="card" style="text-align:center"><b>All side quests done.</b><p class="small muted">That’s a full day. Enjoy your play time guilt-free, or roll for a bonus.</p></div>`;
  h+=`<div class="grid2"><button class="btn" data-a="roll">🎲 Roll a quest</button><button class="btn" data-a="shrink">🪓 Shrink a task</button></div>`;
  // custom
  const cu=S.custom.filter(q=>!q.doneDate||q.doneDate===dayKey());
  if(cu.length){h+=`<div class="section-t"><h3>📜 Your quests</h3><button class="tiny muted" data-a="tab" data-v="quests">see all ›</button></div>`;
    cu.slice(0,3).forEach(q=>h+=qCard(q,{area:'custom',done:!!q.doneDate}))}
  return h+funCard()+bodyMini();
}
function funCard(){const d=day(),al=allowance(),used=d.fun||0,left=al-used,pct=Math.min(100,used/Math.max(1,al)*100),wk=taperWeek();
  const nextBase=Math.max(S.taper.floor,S.taper.base-S.taper.step*(wk+1));
  return `<div class="section-t"><h3>🎮 Guilt-free play</h3><span class="tiny muted">games · YouTube · Netflix</span></div>
  <div class="card"><div class="row between"><div><span class="serif" style="font-size:26px;color:${left<0?'var(--danger)':'var(--fun)'}">${left>=0?fmtMin(left):fmtMin(-left)}</span> <span class="muted small">${left>=0?'left today':'over'}</span></div>
  <div class="tiny muted" style="text-align:right">base ${fmtMin(baseFun())}<br>+ earned ${fmtMin(d.earned)}</div></div>
  <div class="bar" style="margin:10px 0"><i style="width:${pct}%;background:linear-gradient(90deg,#8a63ff,var(--fun))"></i></div>
  <p class="small muted">${left<0?'No penalty, ever. Noticing is the skill. A 10-min focus block earns 10 minutes back.':'Enjoy it fully. Earned rest is part of the plan.'}</p>
  <div class="row wrap" style="margin-top:10px;gap:8px"><span class="tiny muted" style="width:100%">Log play (honesty earns XP):</span>
  ${[15,30,60,120].map(m=>`<button class="btn sm" data-a="fun" data-v="${m}">+${fmtMin(m)}</button>`).join('')}<button class="btn sm ghost" data-a="fun" data-v="-15">−15m</button></div>
  <p class="tiny muted" style="margin-top:10px">Gentle taper · week ${wk+1}. ${nextBase<baseFun()?`Next week’s base: ${fmtMin(nextBase)}.`:'You’ve reached your floor. Hold steady here.'} Logged today: ${fmtMin(used)}</p></div>`}
function bodyMini(){const d=day();return `<div class="section-t"><h3>🌿 Body log</h3><span class="tiny muted">from Samsung Health</span></div>
  <div class="card"><div class="grid2">
   <div><label class="f" style="margin-top:0">Steps</label><div class="stepper"><button class="btn sm" data-a="steps" data-v="-1000">−</button><input inputmode="numeric" data-c="steps" value="${d.steps??''}" placeholder="0"><button class="btn sm" data-a="steps" data-v="1000">+</button></div></div>
   <div><label class="f" style="margin-top:0">Sleep (h)</label><div class="stepper"><button class="btn sm" data-a="sleep" data-v="-0.5">−</button><input inputmode="decimal" data-c="sleep" value="${d.sleep??''}" placeholder="0"><button class="btn sm" data-a="sleep" data-v="0.5">+</button></div></div></div>
   ${S.settings.trackAlcohol?`<div class="toggle"><span>💧 Alcohol-free today</span><button class="sw ${d.af?'on':''}" data-a="af" aria-label="Alcohol-free today"></button></div>`:''}
   <p class="tiny muted">Goal: ${S.settings.stepGoal.toLocaleString()} steps · ${S.settings.sleepGoal}h sleep. Hitting each one earns +20 XP.</p></div>`}

function vFocus(){const d=day();
  if(S.focus){const rem=Math.max(0,S.focus.start+S.focus.mins*60e3-Date.now()),s=Math.ceil(rem/1000);
    return `<div class="voice" style="text-align:center">${esc(S.focus.task||'Focus block')}</div>
    <div class="ring"><svg viewBox="0 0 240 240" width="240" height="240"><circle cx="120" cy="120" r="110" fill="none" stroke="var(--line)" stroke-width="10"/><circle id="fring" cx="120" cy="120" r="110" fill="none" stroke="var(--gold)" stroke-width="10" stroke-linecap="round" stroke-dasharray="691" stroke-dashoffset="${691*(rem/(S.focus.mins*60e3))}"/></svg>
    <div style="text-align:center"><div class="tm" id="ftm">${Math.floor(s/60)}:${pad(s%60)}</div><div class="small muted">of ${S.focus.mins} min</div></div></div>
    <p class="small muted" style="text-align:center">Phone face down. Only the first 2 minutes are hard.<br>The timer keeps running even if you leave the app.</p>
    <div class="grid2" style="margin-top:14px"><button class="btn" data-a="fend" data-v="early">✓ Finish early</button><button class="btn ghost" data-a="fend" data-v="stop">✕ Stop (no penalty)</button></div>`}
  const nl=nextLine();const sugg=[nl&&nl.t,...S.custom.filter(q=>!q.doneDate).slice(0,3).map(q=>q.t),'AI experiment','Messages & email'].filter(Boolean);
  return `<div class="voice">One block. That’s all. Everything else can wait ${focusDur} minutes.</div>
  <div class="card"><label class="f" style="margin-top:0">What will you focus on? (optional)</label>
  <input id="ftask" data-c="ftask" value="${esc(focusTask)}" placeholder="e.g. Money Map: list income sources">
  <div class="row wrap" style="gap:6px;margin-top:8px">${sugg.map(s=>`<button class="chip" data-a="ftaskset" data-v="${esc(s)}">${esc(s.length>34?s.slice(0,32)+'…':s)}</button>`).join('')}</div>
  <label class="f">How long?</label>
  <div class="dur">${[10,25,45].map(m=>`<button class="${focusDur===m?'on':''}" data-a="fdur" data-v="${m}"><b>${m}</b><span class="tiny muted">min · +${m*2+5} XP<br>+${m}m play</span></button>`).join('')}</div>
  <button class="btn gold block" data-a="fstart" style="margin-top:14px;min-height:58px;font-size:18px">⚔️ Start ${focusDur}-minute block</button></div>
  <div class="card"><div class="row between"><span class="muted">Focused today</span><b class="serif" style="font-size:22px;color:var(--gold2)">${fmtMin(d.focusMin)}</b></div>
  <p class="tiny muted" style="margin-top:6px">Every minute focused = 1 minute of guilt-free play added to today’s bank. Stopped before 5 minutes? You still get +3 XP for starting.</p></div>`}

function vKingdom(){const l=lvlOf(S.xp),cur=need(l),nx=need(l+1),t=totals();
  let h=`<div class="card glow"><div class="row between"><div><h2 style="color:var(--gold2)">Level ${l} · ${titleOf(l)}</h2><p class="small muted">${S.xp.toLocaleString()} XP total</p></div><div style="font-size:40px">${BUILDINGS.filter(b=>b.lv<=l).slice(-1)[0].ic}</div></div>
  <div class="bar" style="margin-top:10px"><i style="width:${(S.xp-cur)/(nx-cur)*100}%"></i></div><p class="tiny muted" style="margin-top:4px">${(nx-S.xp).toLocaleString()} XP to level ${l+1}</p></div>`;
  h+=`<div class="section-t"><h3>🏰 Your kingdom</h3><span class="tiny muted">${BUILDINGS.filter(b=>b.lv<=l).length}/${BUILDINGS.length} restored</span></div>
  <div class="bld">${BUILDINGS.map(b=>`<div class="${b.lv<=l?'':'ruin'}"><b>${b.ic}</b><div class="nm">${b.n}</div><div class="st">${b.lv<=l?esc(b.d):'Ruins · Lv '+b.lv}</div></div>`).join('')}</div>`;
  const last7=[...Array(7)].map((_,i)=>S.days[addDays(dayKey(),-i)]).filter(Boolean);
  const avgFun=last7.length?last7.reduce((a,d)=>a+(d.fun||0),0)/last7.length:0;
  const moods=allDays().filter(([k,d])=>d.mood!=null&&diffDays(k,dayKey())<7).map(([k,d])=>d.mood);
  h+=`<div class="section-t"><h3>📈 Progress</h3></div><div class="stats">
   <div class="stat"><b>${t.shown}</b><span>days you showed up</span></div>
   <div class="stat"><b>${fmtMin(t.focus)}</b><span>total focus</span></div>
   <div class="stat"><b>${LINE.filter(q=>S.line[q.id]).length}/${LINE.length}</b><span>main quest steps</span></div>
   <div class="stat"><b>${fmtMin(avgFun)}</b><span>avg play/day (7d)</span></div>
   <div class="stat"><b>${moods.length?MOODS[Math.round(moods.reduce((a,b)=>a+b,0)/moods.length)]:'—'}</b><span>avg mood (7d)</span></div>
   <div class="stat"><b>${S.settings.trackAlcohol?t.af:Object.keys(S.ach).length}</b><span>${S.settings.trackAlcohol?'alcohol-free days':'achievements'}</span></div></div>`;
  h+=`<div class="card" style="margin-top:12px"><h3 style="font-size:15px">Last 14 days: focus vs play</h3>${chart()}<div class="legend"><span><i style="background:var(--gold)"></i>focus</span><span><i style="background:var(--fun)"></i>play</span><span><i style="background:var(--muted);height:2px;vertical-align:3px"></i>play budget</span></div></div>`;
  h+=`<div class="card"><h3 style="font-size:15px;margin-bottom:10px">Showing up · 8 weeks</h3>${heat()}<p class="tiny muted" style="margin-top:8px">Brighter = more XP. Empty days don’t erase anything. This map only grows.</p></div>`;
  h+=`<div class="section-t"><h3>🏅 Achievements</h3><span class="tiny muted">${Object.keys(S.ach).length}/${ACH.length}</span></div>
  <div class="ach">${ACH.map(a=>`<div class="${S.ach[a.id]?'':'lk'}"><b>${a.ic}</b><div><strong>${a.n}</strong>${a.d}</div></div>`).join('')}</div>`;
  return h}
function chart(){const W=480,H=150,n=14,keys=[...Array(n)].map((_,i)=>addDays(dayKey(),i-n+1));
  const data=keys.map(k=>{const d=S.days[k]||{};return{f:d.focusMin||0,p:d.fun||0,b:baseFun(k)+(d.earned||0),k}});
  const mx=Math.max(60,...data.map(d=>Math.max(d.f,d.p,d.b)));const gw=W/n,bw=gw*.34,y=v=>H-18-(v/mx)*(H-28);
  let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Focus and play minutes for the last 14 days">`;
  data.forEach((d,i)=>{const x=i*gw+gw*.14;
    s+=`<rect x="${x}" y="${y(d.f)}" width="${bw}" height="${H-18-y(d.f)}" rx="3" fill="var(--gold)"><title>${d.k}: focus ${fmtMin(d.f)}</title></rect>`;
    s+=`<rect x="${x+bw+2}" y="${y(d.p)}" width="${bw}" height="${H-18-y(d.p)}" rx="3" fill="var(--fun)"><title>${d.k}: play ${fmtMin(d.p)}</title></rect>`;
    s+=`<line x1="${i*gw+2}" x2="${(i+1)*gw-2}" y1="${y(d.b)}" y2="${y(d.b)}" stroke="var(--muted)" stroke-width="2" stroke-dasharray="3 3"/>`;
    if(i%2===n%2||i===n-1)s+=`<text x="${i*gw+gw/2}" y="${H-4}" fill="var(--dim)" font-size="11" text-anchor="middle">${parseKey(d.k).getDate()}</text>`});
  return s+'</svg>'}
function heat(){const t=dayKey(),start=addDays(t,-(7*8-1));let h='<div class="heat">';
  for(let w=0;w<8;w++){h+='<div>';for(let r=0;r<7;r++){const k=addDays(start,w*7+r),d=S.days[k],x=d?d.xp:0;
    const a=x<=0?0:x<40?.3:x<100?.55:x<180?.8:1;h+=`<i title="${k}: ${x} XP" style="${a?`background:rgba(242,193,78,${a});border-color:transparent`:''}${k===t?';outline:2px solid var(--text)':''}"></i>`}h+='</div>'}
  return h+'</div>'}

function vQuests(){const done=LINE.filter(q=>S.line[q.id]).length;let curShown=false;
  let h=`<div class="card glow"><div class="row between"><h3>👑 ${LINE_NAME}</h3><span class="pill">${done}/${LINE.length}</span></div>
  <p class="small muted" style="margin-top:4px">30-day mission: find what really earns money, then double down. One step is unlocked at a time, so you never have to look at the whole mountain.</p>
  <div class="bar" style="margin:10px 0"><i style="width:${done/LINE.length*100}%"></i></div>
  ${LINE.map((q,i)=>{const ok=!!S.line[q.id];let cls='lock';if(ok)cls='ok';else if(!curShown){cls='cur';curShown=true}
    return `<div class="step ${cls}"><span class="n">${ok?'✓':i+1}</span><div style="flex:1">${cls==='lock'?'<span class="tiny">🔒 Unlocks later</span>':esc(q.t)}${cls==='cur'?`<div class="tiny muted" style="font-weight:400">▸ ${esc(q.tiny)}</div>`:''}</div>
    ${cls==='cur'?`<button class="btn sm gold" data-a="done" data-v="${q.id}">Done</button>`:ok&&S.line[q.id]===dayKey()?`<button class="btn sm ghost" data-a="undo" data-v="${q.id}">undo</button>`:''}</div>`}).join('')}</div>`;
  h+=`<div class="section-t"><h3>📜 Your quests</h3><button class="btn sm" data-a="shrink">+ Add</button></div>`;
  const open=S.custom.filter(q=>!q.doneDate),fin=S.custom.filter(q=>q.doneDate);
  if(!open.length)h+=`<div class="card small muted">No personal quests yet. Got something big you’re avoiding? Tap <b>+ Add</b> and we’ll shrink it to a tiny first step.</div>`;
  open.forEach(q=>h+=qCard(q,{area:'custom'}));
  if(fin.length)h+=`<details class="card"><summary class="small muted">Completed (${fin.length})</summary>${fin.slice(-15).reverse().map(q=>`<div class="small" style="padding:6px 0">✓ ${esc(q.t)} <span class="tiny muted">${q.doneDate}</span></div>`).join('')}</details>`;
  h+=`<div class="section-t"><h3>⚔️ Side quest board</h3><span class="tiny muted">tap + to add to today</span></div>`;
  const d=day();
  ['work','body','heart'].forEach(a=>{h+=`<p class="small" style="margin:12px 2px 6px;color:${AREAS[a].c}">${AREAS[a].ic} ${AREAS[a].name}</p>`;
    poolAvail().filter(q=>q.area===a).forEach(q=>{const inT=(d.picks||[]).includes(q.id),dn=d.done.includes(q.id);
      h+=`<div class="q" style="--c:${AREAS[a].c};padding:10px 12px"><div class="bd"><div class="t" style="font-size:15px">${esc(q.t)}</div><div class="meta">+${q.xp} XP${q.fun?` · +${q.fun}m play`:''}</div></div>
      ${dn?'<span class="tiny muted">done ✓</span>':inT?'<span class="tiny muted">on today</span>':`<button class="btn sm" data-a="addtoday" data-v="${q.id}">+</button>`}</div>`})});
  return h}

function vMe(){const s=S.settings,d=day();
  let h=`<div class="section-t" style="margin-top:4px"><h3>❤️‍🔥 Your why</h3></div><div class="card glow">
  <p class="small muted">Shown to you when you tap “About to escape?”. Write it the way you’d say it to a friend. One reason per line.</p>
  <div class="row wrap" style="gap:6px;margin:10px 0">${Object.entries(WHY_ROOTS).map(([k,v])=>`<button class="chip ${S.why.roots.includes(k)?'on':''}" data-a="root" data-v="${k}">${v.l}</button>`).join('')}</div>
  <textarea data-c="whytext" placeholder="e.g. I'm rebuilding so my team keeps their jobs.\nI want to look back on this year as the comeback.">${esc(S.why.text)}</textarea>
  <label class="f">Letter from future me (1 year from now)</label>
  <textarea data-c="future" placeholder="Dear me, a year ago you were exhausted. Here's what changed...">${esc(S.why.future)}</textarea></div>`;
  h+=`<div class="section-t"><h3>⚙️ Settings</h3></div><div class="card">
  <label class="f" style="margin-top:0">Play time taper</label>
  <div class="grid2"><div><span class="tiny muted">Starting base</span><select data-c="tbase">${[240,300,360,420,480,600].map(m=>`<option value="${m}" ${S.taper.base===m?'selected':''}>${fmtMin(m)}</option>`).join('')}</select></div>
  <div><span class="tiny muted">Drops per week</span><select data-c="tstep">${[15,30,45,60].map(m=>`<option value="${m}" ${S.taper.step===m?'selected':''}>${m}m</option>`).join('')}</select></div></div>
  <div style="margin-top:8px"><span class="tiny muted">Floor (never below)</span><select data-c="tfloor">${[60,90,120,150,180].map(m=>`<option value="${m}" ${S.taper.floor===m?'selected':''}>${fmtMin(m)}</option>`).join('')}</select></div>
  <p class="tiny muted" style="margin-top:6px">Started ${S.taper.start} · now week ${taperWeek()+1}, base ${fmtMin(baseFun())}. <button class="tiny" style="color:var(--gold2);text-decoration:underline" data-a="taperreset">Restart taper today</button></p>
  <hr><div class="grid2"><div><label class="f" style="margin-top:0">Daily step goal</label><input data-c="stepgoal" inputmode="numeric" value="${s.stepGoal}"></div><div><label class="f" style="margin-top:0">Sleep goal (h)</label><input data-c="sleepgoal" inputmode="decimal" value="${s.sleepGoal}"></div></div>
  <div class="toggle"><span>Track alcohol-free days</span><button class="sw ${s.trackAlcohol?'on':''}" data-a="set" data-v="trackAlcohol"></button></div>
  <div class="toggle"><span>Sounds</span><button class="sw ${s.sound?'on':''}" data-a="set" data-v="sound"></button></div>
  <hr><p class="small muted">Your data lives only on this phone. Export a backup now and then.</p>
  <div class="grid2" style="margin-top:8px"><button class="btn sm" data-a="export">⬇️ Export backup</button><button class="btn sm" data-a="import">⬆️ Import backup</button></div>
  <button class="btn sm ghost block" data-a="intro" style="margin-top:8px">Replay intro</button>
  <button class="btn sm ghost block" data-a="reset" style="margin-top:4px;color:var(--danger)">Reset everything</button></div>
  <p class="tiny muted" style="text-align:center;margin:16px 0">Kingdom Reborn · works offline · nothing leaves your device</p>`;
  return h}
function render(){
  const l=lvlOf(S.xp),cur=need(l),nx=need(l+1);
  $('#hLvl').innerHTML=`Lv ${l}<small>${titleOf(l)}</small>`;$('#hXp').style.width=((S.xp-cur)/(nx-cur)*100)+'%';$('#hXpT').textContent=`${S.xp-cur} / ${nx-cur} XP`;
  const left=allowance()-(day().fun||0);$('#hFun').textContent=`🎮 ${left>=0?fmtMin(left):'+'+fmtMin(-left)}`;
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===TAB));
  $('#fab').style.display=(TAB==='today'&&!S.focus)?'flex':'none';
  $('#view').innerHTML=TAB==='keeper'?(window.Keeper?Keeper.view():'<p class="muted">Loading the Keeper…</p>'):TAB==='focus'?vFocus():TAB==='kingdom'?vKingdom():TAB==='quests'?vQuests():TAB==='me'?vMe():vToday();
  if(TAB==='today')$('#view').insertAdjacentHTML('beforeend','<div style="height:64px"></div>');
  if(window.Keeper&&Keeper.after)Keeper.after(TAB);
}

