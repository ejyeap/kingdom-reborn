'use strict';
/* ============ BOSS BATTLES (2/3) ============ */
/* ---------- Lair filter / sort ---------- */
function lairView(){const all=lairList(),u=S.bui||(S.bui={lt:'all',ls:'new'});
  const so={new:(a,b)=>ts(b)-ts(a),old:(a,b)=>ts(a)-ts(b),big:(a,b)=>RORD[b.rank]-RORD[a.rank]||ts(b)-ts(a),small:(a,b)=>RORD[a.rank]-RORD[b.rank]||ts(b)-ts(a)}[u.ls]||((a,b)=>ts(b)-ts(a));
  const ls=all.filter(b=>u.lt==='all'||b.type===u.lt).sort(so);
  const ctr=all.length>=2?`<div class="lctl">${[['all','All'],['money','💰'],['systems','⚙️'],['people','👥']].map(([k,l])=>`<button class="chip ${u.lt===k?'on':''}" data-a="blf" data-v="${k}" aria-label="Filter ${k}">${l}</button>`).join('')}<select data-c="bls" aria-label="Sort the Lair">${[['new','Newest'],['old','Oldest'],['big','Biggest'],['small','Smallest']].map(([k,l])=>`<option value="${k}" ${u.ls===k?'selected':''}>${l}</option>`).join('')}</select></div>`:'';
  if(ls.length)return ctr+`<div class="brow">${ls.map(tile).join('')}</div>`;
  return ctr+`<p class="small muted" style="margin:0 2px">${all.length?`No ${TYPES[u.lt]?TYPES[u.lt].l:''} bosses waiting.`:'Bosses you’re not fighting yet wait here.'}</p>`}
function archiveView(){openId=null;const a=archived().sort((x,y)=>(y.archivedAt||'').localeCompare(x.archivedAt||''));
  openModal(`<h2>🗄️ Archive</h2><p class="small muted">Bosses you set aside. No penalty, nothing lost. Restore one to the Lair any time, or delete it for good.</p>
  ${a.map(b=>`<div class="arow t-${b.type}">${sprite(b.type,b.rank,b.shade,2)}<div style="flex:1;min-width:0"><b class="ell" style="display:block">${esc(b.name)}</b><span class="tiny muted">${TYPES[b.type].l} · ${b.rank} · archived ${fmtD(b.archivedAt)}</span></div><button class="btn sm" data-a="brestore" data-v="${b.id}">Restore</button><button class="btn sm ghost" data-a="bdel" data-v="${b.id}" aria-label="Delete forever">✕</button></div>`).join('')||'<p class="small muted">Nothing archived.</p>'}
  <button class="btn block" data-a="close" style="margin-top:12px">Close</button>`)}

/* ---------- Mythic (SS) bosses and their minions ---------- */
const curM=()=>dayKey().slice(0,7);
function addMonth(k,i){const[y,m]=k.split('-').map(Number),d=new Date(y,m-1+i,1);return d.getFullYear()+'-'+pad(d.getMonth()+1)}
function ml(k,long){const[y,m]=k.split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString(undefined,long?{month:'long',year:'numeric'}:{month:'short',year:'2-digit'})}
function num(v){const x=parseFloat(String(v==null?'':v).replace(/[^0-9.\-]/g,''));return isFinite(x)?x:NaN}
function fm(b,n){const u=b.fin&&b.fin.unit?b.fin.unit+' ':'';return u+Math.round(n||0).toLocaleString()}
function fk(n){n=Math.round(n||0);return n>=1e6?(n/1e6).toFixed(n>=1e7?0:1)+'M':n>=1e4?Math.round(n/1e3)+'k':n>=1e3?(n/1e3).toFixed(1)+'k':String(n)}
const finAct=b=>(b.minions||[]).reduce((a,m)=>a+(m.actual||0),0);
function mstate(b,m){if(m.status==='defeated')return 'won';if(b.mode!=='fin')return 'alive';const c=curM();return m.month<c?'escaped':m.month===c?'now':'wait'}
function exposed(b){if(!b||b.rank!=='SS'||b.status==='defeated')return false;if(b.mode==='fin')return b.fin.target>0&&finAct(b)>=b.fin.target;return b.minions.length>0&&b.minions.every(m=>m.status==='defeated')}
function mhp(b){const ms=b.minions||[],n=ms.length,done=ms.filter(m=>m.status==='defeated').length;
  if(b.mode==='fin'){const max=b.fin.target||0,left=b.status==='defeated'?0:Math.max(0,Math.round(max-finAct(b)));return{max,left,done,n,pct:max?left/max*100:0}}
  const left=b.status==='defeated'?0:n-done;return{max:n,left,done,n,pct:n?left/n*100:0}}
const mname=(b,m)=>b.mode==='fin'?ml(m.month,true):m.name;
function curMinion(b){if(b.mode==='fin'){const c=curM();return b.minions.find(m=>m.month===c)||b.minions.find(m=>m.month>c)||b.minions[b.minions.length-1]}return b.minions.find(m=>m.status!=='defeated')}
function nice(x){return x>=10000?Math.round(x/100)*100:x>=1000?Math.round(x/10)*10:Math.round(x)}
function distribute(b,ms,amount){const w=ms.map(m=>b.fin.split==='ramp'?Math.pow(1.05,b.minions.indexOf(m)):1),sw=w.reduce((a,x)=>a+x,0);let left=amount;
  ms.forEach((m,i)=>{const share=i===ms.length-1?left:nice(amount*w[i]/sw);left-=share;m.target=Math.max(0,Math.round((m.actual||0)+share))})}
function logM(b,t){(b.log=b.log||[]).unshift({d:dayKey(),t:clean(t,160)});if(b.log.length>40)b.log.length=40}
function planRebalance(b){const c=curM(),ms=b.minions,R=ms.filter(m=>m.status!=='defeated'&&m.month>=c&&!m.locked);if(!R.length)return null;
  const fixed=ms.filter(m=>!R.includes(m)).reduce((a,m)=>a+((m.status==='defeated'||m.month<c)?(m.actual||0):Math.max(m.target||0,m.actual||0)),0);
  const need=Math.max(0,b.fin.target-fixed-R.reduce((a,m)=>a+(m.actual||0),0)),old=R.map(m=>m.target);
  distribute(b,R,need);const ch=R.map((m,i)=>({m,o:old[i],n:m.target}));R.forEach((m,i)=>m.target=old[i]);return{ch,need}}
function applyRebalance(b,why){const p=planRebalance(b);if(!p)return null;p.ch.forEach(x=>x.m.target=x.n);logM(b,`Rebalanced ${p.ch.length} open month${p.ch.length===1?'':'s'}${why?': '+why:''}`);return p}
function planGap(b){const c=curM();return Math.round(b.fin.target-b.minions.reduce((a,m)=>a+((m.status==='defeated'||m.month<c)?(m.actual||0):Math.max(m.target||0,m.actual||0)),0))}
function createMythic(o){const name=clean(o.name,80),type=TYPES[o.type]?o.type:'money',fin=o.mode!=='proj';
  if(!name)return{err:'Give your Mythic a name first.'};
  let ms=[];const tot=num(o.total);
  if(fin){if(!(tot>0))return{err:'Set a yearly goal above 0.'}}
  else{ms=(o.minions||[]).map(x=>clean(x,60)).filter(Boolean).slice(0,12);if(ms.length<2)return{err:'Add at least 2 minions, one per line.'}}
  const b=create({name,type,rank:'SS',status:o.status==='lair'?'lair':'active',why:o.why,by:o.by});
  b.mode=fin?'fin':'proj';b.log=[];b.minions=[];
  if(fin){const st=/^\d{4}-\d{2}$/.test(o.start||'')?o.start:curM();
    b.fin={metric:clean(o.metric||'Revenue',24)||'Revenue',unit:clean(o.unit||'',6),target:Math.round(tot),split:o.split==='ramp'?'ramp':'even'};
    for(let i=0;i<12;i++)b.minions.push({id:uid(),month:addMonth(st,i),rank:'B',target:0,actual:0,status:'alive',defeated:null,locked:false,weak:[],focusMin:0});
    distribute(b,b.minions,b.fin.target);logM(b,`Plan set: ${fm(b,b.fin.target)} ${b.fin.metric} over 12 months (${b.fin.split==='ramp'?'ramp +5%/mo':'even'})`)}
  else ms.forEach(t=>b.minions.push({id:uid(),name:t,rank:'B',weak:[],focusMin:0,status:'alive',defeated:null}));
  return{b}}
function minionFall(b,m,quiet){if(m.status==='defeated')return;m.status='defeated';m.defeated=dayKey();const R=RANKS[m.rank];
  const before=award(R.xp,0,'Minion defeated: '+mname(b,m),'💥 A minion falls!');
  if(window.Juice)Juice.action('minion',R.xp);
  const ex=exposed(b);save();render();
  if(quiet){if(ex)setTimeout(()=>toast(`<div>🌌 <b>${esc(b.name)}</b> is exposed!</div><div class="tiny muted">Deal the final blow from its card.</div>`),1800);return}
  const left=b.minions.filter(x=>x.status!=='defeated').length,after=lvlOf(S.xp),i=b.minions.indexOf(m);
  openModal(`<div style="text-align:center" class="t-${b.type}"><div class="vic" style="font-size:26px">MINION FALLS</div>
   <div class="bsprite big dying">${sprite(b.type,m.rank,i%5,7)}</div><h2>${esc(mname(b,m))}</h2>
   ${b.mode==='fin'?`<p class="small muted">${esc(b.fin.metric)}: ${fm(b,m.actual)} against a ${fm(b,m.target)} target</p>`:''}
   <div class="x" style="color:var(--gold2);font-weight:800;font-size:20px;margin-top:6px">+${R.xp} XP</div>
   <p class="small" style="margin-top:8px">${ex?`🌌 <b>The ${esc(NAMES[b.type].SS)} is exposed!</b> Deal the final blow.`:`🛡️ ${esc(b.name)}: ${left} minion${left===1?'':'s'} still guard${left===1?'s':''} it.`}</p>
   <div class="grid2" style="margin-top:12px"><button class="btn gold" data-a="bvclose" data-v="${after>before?before+'|'+after:''}">Onward</button><button class="btn" data-a="bopen" data-v="${b.id}">View Mythic</button></div></div>`)}
function settle(b,quiet){if(b.mode!=='fin'||b.status==='defeated')return false;
  const fell=b.minions.filter(m=>m.status!=='defeated'&&m.target>0&&(m.actual||0)>=m.target);
  fell.forEach((m,i)=>minionFall(b,m,quiet||i<fell.length-1));return fell.length>0}
function pips(b){const first=b.minions.findIndex(x=>x.status!=='defeated');
  return `<div class="mpips">${b.minions.map((m,i)=>{const s=mstate(b,m);return `<i class="p-${s}${b.mode!=='fin'&&i===first?' p-now':''}" title="${esc(mname(b,m))}"></i>`}).join('')}</div>`}
function mythicCard(b){const h=hp(b),T=TYPES[b.type],cm=curMinion(b),ex=exposed(b);let box='';
  if(b.mode==='fin'&&cm){const st=mstate(b,cm),p=cm.target?Math.min(100,(cm.actual||0)/cm.target*100):0;
    box=`<button class="bweak mbox" data-a="mopen" data-v="${b.id}|${cm.id}"><span style="flex:1;min-width:0;text-align:left"><span class="tiny muted">${ml(cm.month,true)} minion${st==='won'?' · defeated ✓':st==='wait'?' · upcoming':''}</span><br><b>${fm(b,cm.actual)}</b> <span class="small muted">/ ${fm(b,cm.target)}</span><span class="bar" style="display:block;margin-top:6px"><i style="width:${p}%"></i></span></span><span class="btn sm">Log</span></button>`}
  else if(cm){const d=cm.weak.filter(w=>w.done).length;
    box=`<button class="bweak mbox" data-a="mopen" data-v="${b.id}|${cm.id}"><span style="flex:1;min-width:0;text-align:left"><span class="tiny muted">Next minion</span><br><b>${esc(cm.name)}</b> <span class="small muted">${cm.weak.length?d+'/'+cm.weak.length+' weak points':'add weak points'}</span></span><span class="btn sm">Open</span></button>`}
  return `<div class="bcard myth t-${b.type}"><div class="row between"><span class="tiny muted">${T.ic} ${T.l} · Mythic ${NAMES[b.type].SS}</span><span class="rk rSS">SS</span></div>
  <button class="bsprite" data-a="bopen" data-v="${b.id}" aria-label="Open ${esc(b.name)}">${sprite(b.type,'SS',b.shade,5)}</button>
  <b class="bname">${esc(b.name)}</b>
  <div class="row between tiny muted" style="margin-top:6px"><span>${b.mode==='fin'?`${esc(b.fin.metric)} ${fm(b,finAct(b))} / ${fm(b,b.fin.target)}`:`${h.done}/${h.n} minions down`}</span><span>🛡️ ${h.n-h.done} guarding</span></div>
  <div class="bar hp"><i style="width:${h.pct}%"></i></div>${pips(b)}
  ${ex?`<button class="btn gold block mfinal" data-a="bfinal" data-v="${b.id}" style="margin-top:10px">🌌 Exposed! Deal the final blow</button>`:box}
  <div class="grid2" style="margin-top:10px"><button class="btn sm gold" data-a="battack" data-v="${b.id}">⚔️ Attack</button><button class="btn sm" data-a="bopen" data-v="${b.id}">Details</button></div></div>`}
function mythicDetail(b){const h=hp(b),T=TYPES[b.type],st=b.status,ex=exposed(b),dead=st==='defeated'||st==='archived';
  const tiles=b.minions.map((m,i)=>{const s=mstate(b,m);let sub;
    if(b.mode==='fin'){const p=m.target?Math.round((m.actual||0)/m.target*100):0;sub=s==='won'?`✓ ${p}%`:s==='escaped'?`✗ ${p}%`:s==='now'?`${p}% · now`:fk(m.target)}
    else{const d=m.weak.filter(w=>w.done).length;sub=s==='won'?'✓ defeated':m.weak.length?`${d}/${m.weak.length}`:'—'}
    return `<button class="mtile ms-${s}" data-a="mopen" data-v="${b.id}|${m.id}">${sprite(b.type,m.rank,i%5,2)}<b>${esc(b.mode==='fin'?ml(m.month):m.name)}</b><span>${sub}${m.locked?' 🔒':''}</span></button>`}).join('');
  let plan='';
  if(b.mode==='fin'){const gap=planGap(b);
    plan=`<div class="card" style="margin-top:12px;padding:12px"><div class="row between"><b>📊 ${esc(b.fin.metric)} plan</b><span class="tiny muted">${b.fin.split==='ramp'?'ramp +5%/mo':'even split'}</span></div>
    <div class="stats" style="margin-top:8px"><div class="stat"><b>${fm(b,b.fin.target)}</b><span>yearly goal</span></div><div class="stat"><b>${fm(b,finAct(b))}</b><span>achieved so far</span></div></div>
    ${Math.abs(gap)>=1&&!dead?`<p class="small" style="margin-top:8px">${gap>0?`⚠️ Your monthly plan is <b>${fm(b,gap)}</b> short of the goal. Tap Rebalance to spread it over the open months.`:`✅ Your plan is <b>${fm(b,-gap)}</b> ahead of the goal.`}</p>`:''}
    ${dead?'':`<div class="grid2" style="margin-top:10px"><button class="btn sm" data-a="mgoal" data-v="${b.id}">✏️ Adjust goal</button><button class="btn sm" data-a="mrebal" data-v="${b.id}">⚖️ Rebalance</button></div>`}
    ${b.log&&b.log.length?`<div class="mlog"><span class="tiny muted">Plan history</span>${b.log.slice(0,6).map(l=>`<div>${fmtD(l.d)} · ${esc(l.t)}</div>`).join('')}</div>`:''}</div>`}
  openModal(`<div class="t-${b.type}"><div class="row between"><span class="tiny muted">${T.ic} ${T.l} · Mythic ${NAMES[b.type].SS}</span><span class="rk rSS">SS</span></div>
  <div class="bsprite big ${st==='defeated'?'dead':''}">${sprite(b.type,'SS',b.shade,6)}</div>
  <h2 style="text-align:center">${esc(b.name)}</h2>${b.why?`<p class="small muted" style="text-align:center">${esc(b.why)}</p>`:''}
  ${st==='defeated'?stats(b):`<div class="row between tiny muted" style="margin-top:8px"><span>${b.mode==='fin'?`Left to reach the goal: ${fm(b,h.left)}`:`${h.left} of ${h.n} minions remain`}</span><span>${fmtMin(b.focusMin||0)} focus</span></div><div class="bar hp"><i style="width:${h.pct}%"></i></div>`}
  <label class="f">${b.mode==='fin'?'Monthly minions':'Minions'} · ${h.done}/${h.n} defeated · they must fall first</label>
  <div class="mgrid">${tiles}</div>
  ${b.mode!=='fin'&&!dead&&b.minions.length<12?`<div class="row" style="margin-top:8px"><input id="mnew" maxlength="60" placeholder="Add a minion (sub-project)…"><button class="btn sm" data-a="madd" data-v="${b.id}">Add</button></div>`:''}
  ${plan}
  ${st==='defeated'?`<button class="btn block" data-a="close" style="margin-top:14px">Close</button>`:st==='archived'?`<button class="btn gold block" data-a="brestore" data-v="${b.id}" style="margin-top:14px">Restore to the Lair</button>`:`
  ${ex?`<button class="btn gold block mfinal" data-a="bfinal" data-v="${b.id}" style="margin-top:12px">🌌 Exposed! Deal the final blow</button>`:''}
  <div class="grid2" style="margin-top:12px">${st==='active'?`<button class="btn gold" data-a="battack" data-v="${b.id}">⚔️ Attack</button><button class="btn" data-a="bmove" data-v="${b.id}|lair">Back to Lair</button>`:`<button class="btn gold" data-a="bmove" data-v="${b.id}|active">⚔️ Send to battle</button><button class="btn" data-a="close">Close</button>`}</div>
  ${ex?'':`<button class="btn ghost block" data-a="bfinal" data-v="${b.id}" style="margin-top:8px">🗡️ Final blow (the goal is done)</button>`}
  <button class="btn ghost block" data-a="barchive" data-v="${b.id}" style="margin-top:4px">🗄️ Archive (set aside, no penalty)</button>
  <button class="tiny muted" data-a="bdel" data-v="${b.id}" style="display:block;margin:10px auto 0">Delete forever</button>`}</div>`)}
function openMinion(bid,mid){const b=byId(bid);if(!b||!b.minions)return;const m=b.minions.find(x=>x.id===mid);if(!m)return;openId=bid;
  const i=b.minions.indexOf(m),s=mstate(b,m),dead=b.status==='defeated'||b.status==='archived';let body='';
  if(b.mode==='fin'){const led=S.company.filter(e=>e.date&&e.date.slice(0,7)===m.month&&e.revenue!=null).reduce((a,e)=>a+e.revenue,0),p=m.target?Math.min(100,(m.actual||0)/m.target*100):0;
    body=`<p class="small muted" style="text-align:center">${s==='won'?'Defeated ✓':s==='escaped'?`It escaped, short by ${fm(b,Math.max(0,m.target-(m.actual||0)))}. No penalty: Rebalance rolls the gap into the open months.`:s==='now'?'This month’s minion. Hit the target to defeat it.':'Upcoming'}</p>
    <div class="bar" style="margin:8px 0"><i style="width:${p}%"></i></div>
    <div class="grid2"><div><label class="f">Target ${m.locked?'🔒':''}</label><input id="mtarget" inputmode="decimal" value="${Math.round(m.target||0)}" ${dead?'disabled':''}></div><div><label class="f">Actual ${esc(b.fin.metric.toLowerCase())}</label><input id="mactual" inputmode="decimal" value="${Math.round(m.actual||0)}" ${dead?'disabled':''}></div></div>
    ${dead?'':`<label class="f">Quick add (a sale, a payment…)</label><div class="row"><input id="mplusv" inputmode="decimal" placeholder="e.g. 3500"><button class="btn sm" data-a="mplus" data-v="${b.id}|${m.id}">+ Add</button></div>
    ${led?`<button class="btn sm block" data-a="mledger" data-v="${b.id}|${m.id}" style="margin-top:8px">Use ledger revenue for this month (${fm(b,led)})</button>`:''}
    <button class="btn gold block" data-a="msave" data-v="${b.id}|${m.id}" style="margin-top:12px">Save</button>
    ${m.locked?`<button class="tiny muted" data-a="munlock" data-v="${b.id}|${m.id}" style="display:block;margin:10px auto 0">🔓 Let Rebalance adjust this month again</button>`:''}
    <p class="tiny muted" style="margin-top:8px">Changing a target locks it 🔒. Rebalance then spreads the rest of the goal across the other open months.</p>`}`}
  else{const d=m.weak.filter(w=>w.done).length,live=m.status!=='defeated'&&!dead;
    body=`<label class="f">Weak points (${d}/${m.weak.length})</label><div>${m.weak.map(w=>`<div class="bwrow ${w.done?'ok':''}"><button class="chk sm" data-a="mweak" data-v="${b.id}|${m.id}|${w.id}" ${live?'':'disabled'} aria-label="Toggle weak point">${w.done?'✓':''}</button><span>${esc(w.t)}</span></div>`).join('')||'<p class="small muted">Break this minion into steps you can finish in one sitting.</p>'}</div>
    ${live?`<div class="row" style="margin-top:8px"><input id="mwnew" maxlength="120" placeholder="Add a weak point…"><button class="btn sm" data-a="mwadd" data-v="${b.id}|${m.id}">Add</button></div>
    <button class="btn ghost block" data-a="mkill" data-v="${b.id}|${m.id}" style="margin-top:10px">🗡️ Defeat minion (it’s done)</button>
    ${m.weak.some(w=>w.done)?'':`<button class="tiny muted" data-a="mdel" data-v="${b.id}|${m.id}" style="display:block;margin:10px auto 0">Remove minion</button>`}`:''}`}
  openModal(`<div class="t-${b.type}"><div class="row between"><span class="tiny muted">Minion of ${esc(b.name)}</span><span class="rk r${m.rank}">${m.rank}</span></div>
  <div class="bsprite ${s==='won'?'dead':''}">${sprite(b.type,m.rank,i%5,6)}</div>
  <h2 style="text-align:center">${esc(mname(b,m))}</h2>${body}
  <button class="btn block" data-a="bopen" data-v="${b.id}" style="margin-top:12px">← Back to ${esc(short(b.name,26))}</button></div>`)}
function mline(b){if(b.mode==='fin')return `- MYTHIC "${b.name}" (${b.status}, financial: ${b.fin.metric} goal ${fm(b,b.fin.target)}, achieved ${fm(b,finAct(b))}, ${b.fin.split} split; months target/actual: ${b.minions.map(m=>`${m.month} ${fk(m.target)}/${fk(m.actual||0)}${m.status==='defeated'?' won':''}${m.locked?' locked':''}`).join(', ')}${b.log&&b.log.length?'; recent plan changes: '+b.log.slice(0,3).map(l=>l.d+' '+l.t).join(' | '):''})`;
  return `- MYTHIC "${b.name}" (${b.status}, project; minions: ${b.minions.map(m=>`${m.name} ${m.status==='defeated'?'won':m.weak.filter(w=>w.done).length+'/'+m.weak.length}`).join(', ')})`}
function mfind(id){const[bid,mid,wid]=String(id).split('|'),b=byId(bid),m=b&&b.minions?b.minions.find(x=>x.id===mid):null;return{b,m,wid}}
function afterPlanChange(b){if(!settle(b,false))openBoss(b.id);save();render()}

Object.assign(A,{
  blf:v=>{(S.bui||(S.bui={lt:'all',ls:'new'})).lt=v;save();render()},
  barch:()=>archiveView(),
  barchive:v=>{const b=byId(v);if(!b)return;b.status='archived';b.archivedAt=dayKey();if(sel===v)sel=null;save();closeModal();render();toast(`🗄️ <b>${esc(b.name)}</b> archived. No penalty. Restore it from the Lair any time.`)},
  brestore:v=>{const b=byId(v);if(!b)return;b.status='lair';b.archivedAt=null;save();render();if(archived().length)archiveView();else closeModal();toast(`🏰 ${esc(b.name)} is back in the Lair.`)},
  bmode:v=>{keepDraft();draft.mode=v;if(v==='fin'&&draft.type!=='money'&&!draft.name)draft.type='money';newBoss()},
  bsplit:v=>{keepDraft();draft.split=v;newBoss()},
  bmetric:v=>{keepDraft();draft.metric=v;newBoss()},
  mopen:v=>{const{b,m}=mfind(v);if(b&&m)openMinion(b.id,m.id)},
  msave:v=>{const{b,m}=mfind(v);if(!b||!m)return;const t=num(($('#mtarget')||{}).value),a=num(($('#mactual')||{}).value);
    if(isFinite(t)&&t>=0&&Math.round(t)!==Math.round(m.target)){logM(b,`${ml(m.month)} target ${fm(b,m.target)} → ${fm(b,t)}`);m.target=Math.round(t);m.locked=true}
    if(isFinite(a)&&a>=0&&Math.round(a)!==Math.round(m.actual||0)){m.actual=Math.round(a);logM(b,`${ml(m.month)} result logged: ${fm(b,m.actual)}`)}
    save();if(!settle(b,false)){openMinion(b.id,m.id);toast('Saved ✓')}render()},
  mplus:v=>{const{b,m}=mfind(v);if(!b||!m)return;const x=num(($('#mplusv')||{}).value);if(!(x>0)){toast('Enter an amount to add.');return}
    m.actual=Math.round((m.actual||0)+x);logM(b,`${ml(m.month)} +${fm(b,x)}`);save();if(!settle(b,false)){openMinion(b.id,m.id);toast(`+${esc(fm(b,x))} logged`)}render()},
  mledger:v=>{const{b,m}=mfind(v);if(!b||!m)return;const led=S.company.filter(e=>e.date&&e.date.slice(0,7)===m.month&&e.revenue!=null).reduce((a,e)=>a+e.revenue,0);
    m.actual=Math.round(led);logM(b,`${ml(m.month)} synced from ledger: ${fm(b,led)}`);save();if(!settle(b,false))openMinion(b.id,m.id);render()},
  munlock:v=>{const{b,m}=mfind(v);if(!b||!m)return;m.locked=false;save();openMinion(b.id,m.id)},
  mgoal:v=>{const b=byId(v);if(!b||!b.fin)return;openId=v;
    openModal(`<h2>✏️ Adjust the yearly goal</h2><p class="small muted">Learning and replanning is part of winning. Adjusting is smart, not failure.</p>
    <label class="f">New yearly goal (now ${esc(fm(b,b.fin.target))})</label><input id="mgoalv" inputmode="decimal" value="${b.fin.target}">
    <label class="f">What did you learn? (optional, saved in the plan history)</label><input id="mgoalr" maxlength="120" placeholder="e.g. Q1 slower than expected; new retainer starts in May">
    <p class="tiny muted" style="margin-top:6px">Open months are rebalanced to match. Locked 🔒 months keep their targets.</p>
    <button class="btn gold block" data-a="mgoalok" data-v="${b.id}" style="margin-top:12px">Apply</button><button class="btn ghost block" data-a="bopen" data-v="${b.id}" style="margin-top:6px">Cancel</button>`)},
  mgoalok:v=>{const b=byId(v);if(!b)return;const g=num(($('#mgoalv')||{}).value),r=clean(($('#mgoalr')||{}).value,120);if(!(g>0)){toast('Enter a goal above 0.');return}
    const old=b.fin.target;b.fin.target=Math.round(g);logM(b,`Goal ${fm(b,old)} → ${fm(b,g)}${r?': '+r:''}`);const p=applyRebalance(b);
    toast(`<div>📊 Goal set to <b>${esc(fm(b,g))}</b></div>${p&&p.ch.length?`<div class="tiny muted">${p.ch.length} open months now ≈ ${esc(fm(b,p.ch[0].n))} each</div>`:''}`);afterPlanChange(b)},
  mrebal:v=>{const b=byId(v);if(!b)return;openId=v;const p=planRebalance(b);
    if(!p){toast('No open, unlocked months to rebalance.');return}
    openModal(`<h2>⚖️ Rebalance the plan</h2><p class="small muted">Spreads what’s left of the ${esc(fm(b,b.fin.target))} goal across the open months, counting what you actually achieved so far. Locked 🔒 months stay as they are.</p>
    <div class="card" style="padding:10px;margin-top:10px">${p.ch.map(x=>`<div class="row between small" style="padding:4px 0"><span>${ml(x.m.month)}</span><span class="muted">${esc(fm(b,x.o))} → <b style="color:var(--text)">${esc(fm(b,x.n))}</b></span></div>`).join('')}</div>
    <label class="f">Reason (optional)</label><input id="mrebr" maxlength="120" placeholder="e.g. Rolled October’s gap forward">
    <button class="btn gold block" data-a="mrebalok" data-v="${b.id}" style="margin-top:12px">Apply</button><button class="btn ghost block" data-a="bopen" data-v="${b.id}" style="margin-top:6px">Cancel</button>`)},
  mrebalok:v=>{const b=byId(v);if(!b)return;applyRebalance(b,clean(($('#mrebr')||{}).value,120));toast('⚖️ Plan rebalanced.');afterPlanChange(b)},
  madd:v=>{const b=byId(v),el=$('#mnew');if(!b||!el)return;const t=clean(el.value,60);if(!t){el.focus();return}if(b.minions.length>=12){toast('12 minions max.');return}
    b.minions.push({id:uid(),name:t,rank:'B',weak:[],focusMin:0,status:'alive',defeated:null});save();render();openBoss(b.id)},
  mweak:v=>{const{b,m,wid}=mfind(v);if(!b||!m||m.status==='defeated')return;const w=m.weak.find(x=>x.id===wid);if(!w)return;const R=RANKS[m.rank];
    if(w.done){if(!confirm('Mark this weak point as not done?'))return;if(w.done===dayKey()){const d=day();S.xp=Math.max(0,S.xp-R.wxp);d.xp=Math.max(0,d.xp-R.wxp);d.earned=Math.max(0,d.earned-10)}w.done=null;save();render();openMinion(b.id,m.id);return}
    w.done=dayKey();award(R.wxp,10,'Weak point: '+w.t,'💥 Critical weakness hit!');if(window.Juice)Juice.action('weak',R.wxp);
    if(m.weak.every(x=>x.done)){minionFall(b,m,false);return}render();openMinion(b.id,m.id)},
  mwadd:v=>{const{b,m}=mfind(v),el=$('#mwnew');if(!b||!m||!el)return;const t=clean(el.value,120);if(!t){el.focus();return}if(m.weak.length>=8){toast('8 weak points max per minion.');return}
    m.weak.push({id:uid(),t,done:null});save();openMinion(b.id,m.id);const n=$('#mwnew');if(n)n.focus()},
  mkill:v=>{const{b,m}=mfind(v);if(!b||!m)return;if(!confirm(`Defeat “${m.name}”? Only if it’s actually done.`))return;minionFall(b,m,false)},
  mdel:v=>{const{b,m}=mfind(v);if(!b||!m)return;if(!confirm(`Remove the minion “${m.name}”?`))return;b.minions.splice(b.minions.indexOf(m),1);save();render();openBoss(b.id)}
});
document.addEventListener('change',e=>{const el=e.target;if(el&&el.dataset&&el.dataset.c==='bls'){(S.bui||(S.bui={lt:'all',ls:'new'})).ls=el.value;save();render()}});

