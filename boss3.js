'use strict';
/* ============ BOSS BATTLES (3/3) ============ */
/* ---------- wrap existing views and focus ---------- */
let QT='quests',sel=null;
const _vQuests=vQuests;
vQuests=function(){const n=activeList().length;
  return `<div class="seg"><button class="${QT==='quests'?'on':''}" data-a="qtab" data-v="quests">📜 Quests</button><button class="${QT==='bosses'?'on':''}" data-a="qtab" data-v="bosses">🐉 Bosses${n?` <span class="bdg">${n}</span>`:''}</button></div>`+(QT==='bosses'?vBosses():_vQuests())};
const _vToday=vToday;
vToday=function(){const h=_vToday();const i=h.indexOf('Side quests</h3>');if(i<0)return h;
  const j=h.lastIndexOf('<div class="section-t">',i);if(j<0)return h;return h.slice(0,j)+todayStrip()+h.slice(j)};
const _vFocus=vFocus;
vFocus=function(){let h=_vFocus();
  if(S.focus){const b=S.focusBoss&&byId(S.focusBoss);
    return b?`<div class="bfocus t-${b.type}">${sprite(b.type,b.rank,b.shade,4)}<div><div class="tiny muted">Attacking</div><b>${esc(b.name)}</b><div class="bar hp" style="width:140px;margin-top:4px"><i style="width:${hp(b).pct}%"></i></div></div></div>`+h:h}
  const act=activeList();if(!act.length)return h;
  const chips=`<label class="f">🐉 Attack a boss (optional)</label><div class="bchips">${act.map(b=>`<button class="chip ${sel===b.id?'on':''}" data-a="bsel" data-v="${b.id}">${sprite(b.type,b.rank,b.shade,2)} ${esc(short(b.name,20))}</button>`).join('')}</div>`;
  return h.replace('<label class="f">How long?</label>',chips+'<label class="f">How long?</label>')};
const _start=startFocus;
startFocus=function(){S.focusBoss=sel&&byId(sel)&&byId(sel).status==='active'?sel:null;sel=null;return _start()};
const _finish=finishFocus;
finishFocus=function(mins,full){const id=S.focusBoss;S.focusBoss=null;_finish(mins,full);
  const b=id&&byId(id),m=Math.round(mins);if(!b||b.status!=='active'||m<5)return;
  if(b.rank==='SS'){b.focusMin=(b.focusMin||0)+m;save();render();setTimeout(()=>toast(`<div>⚔️ ${m} minutes of effort against <b>${esc(b.name)}</b></div><div class="tiny muted">Mythics fall when their minions do. Effort is how you get there.</div>`),1500);return}
  const before=hp(b).left;b.focusMin=(b.focusMin||0)+m;const after=hp(b).left;save();render();
  setTimeout(()=>toast(`<div>⚔️ <b>${esc(b.name)}</b> takes <b>${before-after}</b> damage!</div><div class="tiny muted">HP ${after} / ${RANKS[b.rank].hp}${after===0?' · ready for the final blow':''}</div>`),1500)};

/* ---------- achievements ---------- */
ACH.push({id:'boss1',ic:'🩸',n:'First Blood',d:'Defeat your first boss'},{id:'boss5',ic:'🏹',n:'Monster Hunter',d:'5 trophies on the wall'},{id:'bossS',ic:'🐉',n:'Dragon Slayer',d:'Defeat an S-rank boss'},{id:'myth1',ic:'🌌',n:'Mythbreaker',d:'Defeat a Mythic (SS) boss'});

/* ---------- actions ---------- */
function reopen(){if(openId&&!$('#modal').classList.contains('hidden')&&byId(openId))openBoss(openId)}
Object.assign(A,{
  qtab:v=>{QT=v;render()},
  goboss:()=>{QT='bosses';go('quests')},
  bnew:()=>{draft={type:draft.type,rank:draft.rank,mode:draft.mode||'fin',metric:draft.metric||'Revenue',unit:draft.unit||'',split:draft.split||'even',total:'',start:'',mins:'',past:false,name:'',weak:'',why:''};openId=null;newBoss()},
  bpast:()=>{draft={type:draft.type,rank:draft.rank==='SS'?'B':draft.rank,mode:draft.mode,split:draft.split,past:true,name:'',weak:'',why:'',date:dayKey()};openId=null;newBoss()},
  btype:v=>{keepDraft();draft.type=v;newBoss()},
  brank:v=>{keepDraft();draft.rank=v;newBoss()},
  bcreate:v=>{keepDraft();const name=clean(draft.name,80);if(!name){const el=$('#bname');if(el)el.focus();toast('Give your boss a name first.');return}
    if(draft.rank==='SS'&&v!=='past'){const res=createMythic({name,type:draft.type,mode:draft.mode,metric:draft.metric,unit:draft.unit,total:draft.total,start:draft.start,split:draft.split,minions:String(draft.mins||'').split('\n'),why:draft.why,status:v==='lair'?'lair':'active'});
      if(res.err){toast(res.err);return}const b=res.b;save();closeModal();QT='bosses';go('quests');sound(3);burst(90);
      if(window.Juice&&S.settings.juice!==false){try{navigator.vibrate&&navigator.vibrate([60,30,60,30,140])}catch(e){}}
      toast(`<div>🌌 <b>The ${esc(NAMES[b.type].SS)} rises:</b> ${esc(b.name)}</div><div class="tiny muted">${b.minions.length} minions guard it. They must fall first.</div>`);return}
    if(v==='past'){const b=create({name,type:draft.type,rank:draft.rank,status:'defeated',past:true});b.defeated=draft.date&&draft.date<=dayKey()?draft.date:dayKey();victory(b);return}
    const b=create({name,type:draft.type,rank:draft.rank,status:v==='lair'?'lair':'active',weak:draft.weak.split('\n'),why:draft.why});
    closeModal();QT='bosses';go('quests');sound(3);burst(40);
    toast(`<div>🐉 <b>${esc(NAMES[b.type][b.rank])}</b> appears: <b>${esc(b.name)}</b></div><div class="tiny muted">${b.status==='active'?'It’s in battle. Hit a weak point or attack with a focus block.':'Waiting in the Lair.'}</div>`)},
  bopen:v=>openBoss(v),
  bwall:()=>{openId=null;const t=trophies();openModal(`<h2>💀 Trophy Wall <span class="tiny muted">${t.length}</span></h2><div class="bwall" style="margin-top:12px">${t.map(trophy).join('')}</div><button class="btn block" data-a="close" style="margin-top:14px">Close</button>`)},
  bweak:v=>{const[id,wid]=v.split('|'),b=byId(id);if(!b||b.status==='defeated')return;const w=b.weak.find(x=>x.id===wid);if(!w)return;const R=RANKS[b.rank];
    if(w.done){if(!confirm('Mark this weak point as not done?'))return;if(w.done===dayKey()){const d=day();S.xp=Math.max(0,S.xp-R.wxp);d.xp=Math.max(0,d.xp-R.wxp);d.earned=Math.max(0,d.earned-10)}w.done=null;save();render();reopen();return}
    w.done=dayKey();const before=award(R.wxp,10,'Weak point: '+w.t,'💥 Critical weakness hit!');
    if(b.weak.every(x=>x.done)){victory(b,before);return}
    const after=lvlOf(S.xp);render();reopen();if(after>before)setTimeout(()=>levelUp(after,before),900)},
  bwadd:v=>{const b=byId(v),el=$('#bwnew');if(!b||!el)return;const t=clean(el.value,120);if(!t){el.focus();return}
    if(b.weak.length>=12){toast('12 weak points max. Finish a few first.');return}b.weak.push({id:uid(),t,done:null});save();render();openBoss(v);const n=$('#bwnew');if(n)n.focus()},
  bwdel:v=>{const[id,wid]=v.split('|'),b=byId(id);if(!b)return;b.weak=b.weak.filter(x=>x.id!==wid);save();render();openBoss(id)},
  bmove:v=>{const[id,to]=v.split('|'),b=byId(id);if(!b)return;
    if(to==='active'&&activeList().length>=MAX_ACTIVE){toast(`Battle is full (${MAX_ACTIVE}). Send one back to the Lair first.`);return}
    b.status=to;if(to==='active'){b.activated=b.activated||dayKey();L().splice(L().indexOf(b),1);L().unshift(b)}
    save();closeModal();render();toast(to==='active'?`⚔️ ${esc(b.name)} enters battle.`:`🏰 ${esc(b.name)} retreats to the Lair. No penalty.`)},
  bfinal:v=>{const b=byId(v);if(!b)return;if(!exposed(b)&&!confirm(`Deal the final blow to “${b.name}”? Only if the project is actually done.`))return;victory(b)},
  bdel:v=>{const b=byId(v);if(!b)return;if(!confirm(b.status==='defeated'?`Remove “${b.name}” from your Trophy Wall?`:`Release “${b.name}”? It will be deleted.`))return;
    L().splice(L().indexOf(b),1);if(sel===v)sel=null;save();closeModal();render()},
  battack:v=>{const b=byId(v);if(!b)return;if(b.status!=='active'){toast('Send it to battle first.');return}
    sel=v;const nw=b.weak.find(w=>!w.done);focusTask=nw?nw.t:b.name;closeModal();go('focus');toast(`⚔️ Target locked: <b>${esc(b.name)}</b>. Pick a length and start. Every minute deals damage.`)},
  bsel:v=>{sel=sel===v?null:v;const b=byId(v);if(sel&&b){const nw=b.weak.find(w=>!w.done);focusTask=nw?nw.t:b.name}render()},
  bvclose:v=>{closeModal();if(v){const[a,c]=v.split('|').map(Number);setTimeout(()=>levelUp(c,a),250)}}
});

/* ---------- Keeper integration ---------- */
const arr=a=>(Array.isArray(a)?a:[]).map(x=>clean(x,120)).filter(Boolean).slice(0,12);
window.KeeperExt={
  tools:[
    {name:'create_boss',description:'Create a Boss Battle from a big project or idea the user agreed to tackle. Put it in battle if there is room, otherwise the Lair.',strict:true,eager_input_streaming:true,
     input_schema:{type:'object',properties:{name:{type:'string',description:'Short project name, under 60 characters.'},type:{type:'string',enum:['money','systems','people'],description:'money = revenue, sales, pricing, costs; systems = tools, AI, processes, tech; people = team, hiring, clients, partners.'},rank:{type:'string',enum:['C','B','A','S'],description:'Size: C = a few days, B = 1-2 weeks, A = about a month, S = a quarter or more.'},weak_points:{type:'array',items:{type:'string'},description:'3-8 concrete sub-steps, each finishable in one sitting.'},why:{type:'string',description:'One line on why it matters, or an empty string.'}},required:['name','type','rank','weak_points','why'],additionalProperties:false}},
    {name:'add_weak_points',description:'Add weak points (concrete sub-steps) to an existing boss.',strict:true,eager_input_streaming:true,
     input_schema:{type:'object',properties:{boss:{type:'string',description:'The exact name of an existing boss.'},weak_points:{type:'array',items:{type:'string'},description:'Concrete sub-steps, each finishable in one sitting.'}},required:['boss','weak_points'],additionalProperties:false}}
  ],
  run(name,inp,view){
    if(name==='create_boss'){if(!TYPES[inp.type]||!RANKS[inp.rank]||!clean(inp.name,80))return{ok:false,msg:'Invalid boss fields.'};
      const b=create({name:inp.name,type:inp.type,rank:inp.rank,status:'active',weak:arr(inp.weak_points),why:inp.why,by:'keeper'});save();
      view.push({r:'note',t:`🐉 Boss summoned: ${b.name} (${TYPES[b.type].l}, rank ${b.rank}, ${b.weak.length} weak points)${b.status==='lair'?', waiting in the Lair':''}`});
      return{ok:true,msg:`Boss created ${b.status==='active'?'and in battle':'in the Lair (battle is full)'}. It appears in Quests > Bosses.`}}
    if(name==='add_weak_points'){const q=clean(inp.boss,80).toLowerCase();const ok=x=>(x.status==='active'||x.status==='lair')&&x.rank!=='SS';const b=L().find(x=>ok(x)&&x.name.toLowerCase()===q)||L().find(x=>ok(x)&&x.name.toLowerCase().includes(q));
      if(!b)return{ok:false,msg:'No active or waiting boss with that name. Check the BOSS BATTLES list in the context.'};
      const add=arr(inp.weak_points).slice(0,Math.max(0,12-b.weak.length));if(!add.length)return{ok:false,msg:'No weak points added (none given, or the boss already has 12).'};
      add.forEach(t=>b.weak.push({id:uid(),t,done:null}));save();
      view.push({r:'note',t:`💥 ${add.length} weak point${add.length===1?'':'s'} added to ${b.name}`});return{ok:true,msg:'Added.'}}
    return null},
  prompt:`

Boss Battles: the user turns big projects and ideas into bosses (types: money, systems, people; ranks C/B/A/S by size). Each boss has weak points (concrete sub-steps; finishing one deals big damage) and takes damage from focus blocks aimed at it. Up to ${MAX_ACTIVE} bosses can be in battle; the rest wait in the Lair; defeated bosses hang on a Trophy Wall. When they mention a big project or idea, offer to make it a boss. When a boss has few or no weak points, offer to split it. Use create_boss and add_weak_points only after they agree. Celebrate defeated bosses, and use the boss list to help them choose what to attack today.`,
  freePrompt:` Also: create_boss(name, type: money/systems/people, rank: C/B/A/S, weak_points: [list], why) and add_weak_points(boss, weak_points: [list]).`,
  snapshot(){const line=b=>{if(b.rank==='SS')return mline(b);const h=hp(b),nw=b.weak.find(w=>!w.done);return `- "${b.name}" (${b.type}, rank ${b.rank}${b.status==='defeated'?', defeated '+b.defeated+(b.past?' (past victory)':''):`, HP ${h.left}/${h.max}, weak points ${h.done}/${h.n}${nw?', next: '+nw.t:''}`})`};
    return `\nBOSS BATTLES:\nIn battle (${activeList().length}/${MAX_ACTIVE}):\n${activeList().map(line).join('\n')||'(none)'}\nLair:\n${lairList().map(line).join('\n')||'(none)'}\nRecent trophies:\n${trophies().slice(0,5).map(line).join('\n')||'(none)'}\n`}
};

/* ---------- Keeper: Mythic tools ---------- */
(function(){const X=window.KeeperExt,run0=X.run;
  const findM=q=>{q=clean(q,80).toLowerCase();const ok=x=>x.rank==='SS'&&(x.status==='active'||x.status==='lair');return L().find(x=>ok(x)&&x.name.toLowerCase()===q)||L().find(x=>ok(x)&&x.name.toLowerCase().includes(q))};
  X.tools.push(
    {name:'create_mythic',description:'Create a Mythic (SS) boss: a year-long goal guarded by minions that must fall first. Financial mode makes 12 monthly minions with targets that add up to the yearly goal; project mode uses custom sub-project minions. Only after the user agrees.',strict:true,eager_input_streaming:true,
     input_schema:{type:'object',properties:{name:{type:'string',description:'Short goal name.'},type:{type:'string',enum:['money','systems','people']},mode:{type:'string',enum:['financial','project']},
       metric:{type:'string',description:'Financial mode: what is measured, e.g. Revenue, Profit, Savings.'},unit:{type:'string',description:'Financial mode: currency symbol, e.g. RM or $.'},total:{type:'number',description:'Financial mode: the yearly goal.'},
       start_month:{type:'string',description:'Financial mode: first month as YYYY-MM.'},split:{type:'string',enum:['even','ramp'],description:'even = same each month; ramp = grows 5% per month.'},
       minions:{type:'array',items:{type:'string'},description:'Project mode: 2-12 sub-project names.'},why:{type:'string',description:'One line on why it matters.'}},
       required:['name','type','mode'],additionalProperties:false}},
    {name:'update_mythic',description:'Update a Mythic boss: log a month result, add to a month, change a month target (locks it), change the yearly goal (rebalances open months), rebalance, or add a project minion. Only after the user agrees; include a short reason for plan changes.',strict:true,eager_input_streaming:true,
     input_schema:{type:'object',properties:{boss:{type:'string',description:'Exact name of the Mythic boss.'},action:{type:'string',enum:['log_result','add_amount','set_month_target','set_yearly_goal','rebalance','add_minion']},
       month:{type:'string',description:'YYYY-MM for month actions.'},amount:{type:'number',description:'The amount for log_result, add_amount, set_month_target or set_yearly_goal.'},
       text:{type:'string',description:'Minion name for add_minion.'},reason:{type:'string',description:'Why the plan changed (what was learned).'}},
       required:['boss','action'],additionalProperties:false}});
  X.run=function(name,inp,view){
    if(name==='create_mythic'){const res=createMythic({name:inp.name,type:inp.type,mode:inp.mode==='project'?'proj':'fin',metric:inp.metric,unit:inp.unit,total:inp.total,start:inp.start_month,split:inp.split,minions:Array.isArray(inp.minions)?inp.minions:[],why:inp.why,status:'active',by:'keeper'});
      if(res.err)return{ok:false,msg:res.err};const b=res.b;save();
      view.push({r:'note',t:`🌌 Mythic summoned: ${b.name} (${b.minions.length} minions${b.mode==='fin'?`, goal ${fm(b,b.fin.target)}`:''})${b.status==='lair'?', waiting in the Lair':''}`});
      return{ok:true,msg:`Mythic created ${b.status==='active'?'and in battle':'in the Lair (battle is full)'}.${b.mode==='fin'?' Monthly targets: '+b.minions.map(m=>m.month+' '+m.target).join(', '):''}`}}
    if(name==='update_mythic'){const b=findM(inp.boss);if(!b)return{ok:false,msg:'No active or waiting Mythic with that name.'};
      const amt=Number(inp.amount),why=clean(inp.reason||'',120),act=inp.action;let m=null;
      if(['log_result','add_amount','set_month_target'].includes(act)){if(b.mode!=='fin')return{ok:false,msg:'That action is for financial Mythics.'};m=b.minions.find(x=>x.month===clean(inp.month,7));if(!m)return{ok:false,msg:'Month not found in this Mythic (use YYYY-MM).'};if(!isFinite(amt)||amt<0)return{ok:false,msg:'A non-negative amount is required.'}}
      if(act==='log_result'){m.actual=Math.round(amt);logM(b,`${ml(m.month)} result logged: ${fm(b,amt)}${why?' ('+why+')':''}`)}
      else if(act==='add_amount'){m.actual=Math.round((m.actual||0)+amt);logM(b,`${ml(m.month)} +${fm(b,amt)}${why?' ('+why+')':''}`)}
      else if(act==='set_month_target'){logM(b,`${ml(m.month)} target ${fm(b,m.target)} → ${fm(b,amt)}${why?': '+why:''}`);m.target=Math.round(amt);m.locked=true}
      else if(act==='set_yearly_goal'){if(b.mode!=='fin'||!(amt>0))return{ok:false,msg:'A financial Mythic and a goal above 0 are required.'};const old=b.fin.target;b.fin.target=Math.round(amt);logM(b,`Goal ${fm(b,old)} → ${fm(b,amt)}${why?': '+why:''}`);applyRebalance(b)}
      else if(act==='rebalance'){if(b.mode!=='fin')return{ok:false,msg:'Rebalance is for financial Mythics.'};if(!applyRebalance(b,why))return{ok:false,msg:'No open, unlocked months to rebalance.'}}
      else if(act==='add_minion'){if(b.mode==='fin')return{ok:false,msg:'Financial Mythics have fixed monthly minions.'};const t=clean(inp.text,60);if(!t)return{ok:false,msg:'Give the minion a name in text.'};if(b.minions.length>=12)return{ok:false,msg:'12 minions max.'};b.minions.push({id:uid(),name:t,rank:'B',weak:[],focusMin:0,status:'alive',defeated:null})}
      settle(b,true);save();render();
      view.push({r:'note',t:`📊 ${b.name}: ${act.replace(/_/g,' ')}${m?' · '+ml(m.month):''}`});
      return{ok:true,msg:'Done. '+mline(b)}}
    return run0(name,inp,view)};
  X.prompt+=`

Mythic (SS) bosses are year-long goals guarded by up to 12 minions that must fall first; a Mythic takes one battle slot. Financial Mythics have one minion per month with a target; hitting a month's target defeats that minion; the yearly goal is the master number, locked months keep their target, and Rebalance spreads what's left (counting real results) across the open months. A month that ends under target "escapes" with no penalty. Help them set a realistic goal and split, review each month (what happened, what they learned), and adjust targets when reality changes, always with a short reason. Treat replanning as smart budgeting, never as failure. Use create_mythic and update_mythic only after they agree.`;
  X.freePrompt+=` Also: create_mythic(name, type, mode: financial/project, metric, unit, total, start_month: YYYY-MM, split: even/ramp, minions: [list], why) and update_mythic(boss, action: log_result/add_amount/set_month_target/set_yearly_goal/rebalance/add_minion, month: YYYY-MM, amount, text, reason).`;
})();

/* ---------- styles for Mythics, Lair controls and archive ---------- */
(function(){const c=document.createElement('style');c.textContent=`
.rSS{background:linear-gradient(135deg,#ff5ad1,#7c4ddb 55%,#4f8fe8);color:#fff;text-shadow:0 1px 0 rgba(0,0,0,.4)}
.mythbtn{display:flex;gap:12px;align-items:center;width:100%;margin-top:8px;padding:10px 12px;border-radius:14px;background:linear-gradient(135deg,rgba(124,77,219,.18),var(--bg2));border:1px solid #6b4fc0}
.mythbtn.on{border-color:#c79bff;box-shadow:0 0 0 1px #c79bff,0 0 22px -6px rgba(199,155,255,.7)}
.bcard.myth{border-top:4px solid transparent;border-image:linear-gradient(90deg,#ff5ad1,#7c4ddb,#4f8fe8) 1;border-radius:18px;background:radial-gradient(ellipse at 50% 0%,rgba(124,77,219,.22),transparent 60%),var(--card)}
.bcard.myth .bsprite svg{filter:drop-shadow(0 0 10px rgba(199,155,255,.45))}
.mpips{display:grid;grid-template-columns:repeat(12,1fr);gap:3px;margin-top:8px}
.mpips i{height:9px;border-radius:3px;background:var(--bg2);border:1px solid var(--line)}
.mpips .p-won{background:var(--gold);border-color:var(--gold)}
.mpips .p-escaped{background:rgba(255,138,122,.25);border-color:rgba(255,138,122,.5)}
.mpips .p-now{border-color:var(--tc);box-shadow:0 0 8px var(--tc);animation:pnow 1.4s ease-in-out infinite}
@keyframes pnow{50%{opacity:.45}}
.mbox{width:100%;text-align:left}
.mfinal{animation:mf 1.2s ease-in-out infinite;box-shadow:0 0 24px rgba(242,193,78,.6)}
@keyframes mf{50%{transform:scale(1.03)}}
.mgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.mtile{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px;min-height:86px;padding:6px 2px;border-radius:12px;background:var(--bg2);border:1px solid var(--line);font-size:11px;line-height:1.2;text-align:center;min-width:0}
.mtile b{font-size:11px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mtile span{font-size:10px;color:var(--muted)}
.mtile.ms-won{border-color:var(--gold);background:rgba(242,193,78,.08)}.mtile.ms-won svg{filter:grayscale(.85) brightness(.7)}
.mtile.ms-escaped{opacity:.55}.mtile.ms-escaped svg{filter:grayscale(1)}
.mtile.ms-now{border-color:var(--tc);box-shadow:0 0 14px -4px var(--tc)}
.mtile.ms-wait svg{opacity:.75}
.mlog{margin-top:10px;font-size:12px;color:var(--muted)}.mlog div{padding:3px 0;border-top:1px dashed var(--line)}
.lctl{display:flex;gap:6px;align-items:center;margin:0 0 8px;flex-wrap:wrap}
.lctl .chip{padding:6px 10px}
.lctl select{width:auto;margin-left:auto;padding:6px 10px;border-radius:99px;font-size:13px}
.arow{display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px dashed var(--line)}
.arow svg{flex:none}`;document.head.appendChild(c)})();

/* ---------- styles ---------- */
const css=document.createElement('style');css.textContent=`
.t-money{--tc:#3fbf6a}.t-systems{--tc:#4f8fe8}.t-people{--tc:#e5484d}
.seg{display:grid;grid-template-columns:1fr 1fr;gap:4px;background:var(--bg2);border:1px solid var(--line);border-radius:14px;padding:4px}
.seg button{padding:10px;border-radius:10px;font-weight:650;color:var(--muted)}
.seg button.on{background:var(--card2);color:var(--gold2)}
.bdg{background:var(--gold);color:#2a1d00;border-radius:99px;padding:0 7px;font-size:11px;margin-left:4px}
svg.px{display:block;image-rendering:pixelated}
.bcar{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -16px;padding:0 16px 6px;scrollbar-width:none}
.bcar::-webkit-scrollbar,.brow::-webkit-scrollbar{display:none}
.bcard{flex:0 0 86%;scroll-snap-align:center;background:var(--card);border:1px solid var(--line);border-top:4px solid var(--tc);border-radius:18px;padding:14px}
.bcar .bcard:only-child{flex-basis:100%}
.bsprite{width:100%;height:128px;display:flex;align-items:flex-end;justify-content:center;margin:4px 0;background:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--tc) 22%,transparent),transparent 62%)}
.bsprite svg{animation:bob 2.6s ease-in-out infinite}
.bsprite.big{height:170px}
.bsprite.dead svg{animation:none;filter:grayscale(.85) brightness(.75)}
@keyframes bob{50%{transform:translateY(-4px)}}
.bname{display:block;text-align:center;font-family:Georgia,serif;font-size:18px}
.bar.hp>i{background:linear-gradient(90deg,#e5484d,#ff8a5b)}
.bweak{display:flex;gap:10px;align-items:center;margin-top:10px;padding:10px;background:var(--bg2);border-radius:12px;min-height:56px}
.chk.sm{width:34px;height:34px;font-size:15px;--c:var(--tc,var(--gold))}
.chk.sm[disabled]{opacity:.6}
.rk{display:inline-grid;place-items:center;min-width:24px;height:24px;padding:0 6px;border-radius:7px;font:800 13px Georgia,serif}
.rC{background:#3a3d55;color:#d5d8ec}.rB{background:#2b4a7a;color:#d6e6ff}.rA{background:#6b3fa0;color:#f2e2ff}.rS{background:linear-gradient(180deg,#ffe08f,#f2a43a);color:#3a2000}
.brow{display:flex;gap:10px;overflow-x:auto;margin:0 -16px;padding:0 16px 6px;scrollbar-width:none}
.btile{flex:0 0 92px;height:118px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;padding:8px 6px;background:var(--card);border:1px solid var(--line);border-bottom:3px solid var(--tc);border-radius:14px}
.btile .rk,.btro .rk{position:absolute;top:5px;right:5px;min-width:19px;height:19px;font-size:11px;padding:0 4px}
.btile .nm,.btro .nm{font-size:11px;line-height:1.2;text-align:center;max-width:100%;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bwall{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.btro{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 3px 6px;background:var(--card);border:1px solid var(--line);border-radius:12px;min-width:0}
.plq{width:58px;height:54px;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;background:linear-gradient(180deg,#6b4a2b,#4a321c);border:2px solid #9a7444;border-radius:48% 48% 38% 38%;padding-bottom:3px;box-shadow:inset 0 -6px 0 rgba(0,0,0,.25)}
.plq svg{max-width:50px;height:auto}
.btro .dt{font-size:10px;color:var(--dim)}
.btypes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.btypes button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 4px;background:var(--bg2);border:1px solid var(--line);border-radius:14px;font-size:13px}
.btypes button span{font-size:10px;line-height:1.25;color:var(--muted);text-align:center}
.btypes button.on{border-color:var(--tc);box-shadow:0 0 0 1px var(--tc);background:color-mix(in srgb,var(--tc) 10%,var(--bg2))}
.branks{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.branks button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 2px;background:var(--bg2);border:1px solid var(--line);border-radius:12px}
.branks button.on{border-color:var(--gold);background:rgba(242,193,78,.1)}
.bprev{display:flex;gap:14px;align-items:flex-end;margin-top:12px;padding:12px;background:var(--bg2);border:1px solid var(--line);border-left:4px solid var(--tc);border-radius:14px}
.bwrow{display:flex;gap:10px;align-items:center;padding:6px 0;border-bottom:1px dashed var(--line)}
.bwrow span{flex:1;min-width:0}.bwrow.ok span{text-decoration:line-through;opacity:.6}
.bstrip{display:flex;gap:12px;align-items:center;border-left:4px solid var(--tc,var(--line))}
.ell{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bchips{display:flex;gap:6px;flex-wrap:wrap}
.bfocus{display:flex;gap:12px;align-items:flex-end;justify-content:center;margin-bottom:4px}
.bstats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;text-align:left}
.bstats .stat b{font-size:18px}
.vic{font:700 34px Georgia,serif;letter-spacing:3px;color:var(--gold2);text-shadow:0 0 18px rgba(242,193,78,.6);animation:vpulse 1s ease-in-out 3}
@keyframes vpulse{50%{transform:scale(1.08)}}
.dying svg{animation:die 1.6s ease-in forwards}
@keyframes die{0%{transform:none}12%{transform:translateX(-7px)}24%{transform:translateX(7px)}36%{transform:translateX(-5px);filter:brightness(2.2)}55%{transform:none;filter:brightness(1.4)}100%{transform:translateY(18px) rotate(10deg);filter:grayscale(1) brightness(.6);opacity:.35}}
@media (prefers-reduced-motion:reduce){.bsprite svg,.dying svg,.vic{animation:none}}`;document.head.appendChild(css);

window.Boss={sprite,vBosses,SPR,TYPES,RANKS,NAMES,hp,exposed,finAct,createMythic,planRebalance};
render();
