'use strict';
/* ============ VOICE QUESTS + TAGS ============
   A floating mic turns spoken instructions into quest changes.
   Offline: built-in rules. Online with a Keeper API key: Claude understands messier speech.
   Clear instructions apply at once (with Undo); unclear ones ask a tap-to-answer question.
   Every quest gets a tag: Health, Money, Systems, People, Personal finance or Others. */
(function(){
const TAGS={
  health:{l:'Health',ic:'💪',c:'#5fd38d'},
  money:{l:'Money',ic:'💰',c:'#3fbf6a'},
  systems:{l:'Systems',ic:'⚙️',c:'#4f8fe8'},
  people:{l:'People',ic:'🤝',c:'#ff7b8a'},
  pfin:{l:'Personal finance',ic:'🏦',c:'#f2c14e'},
  other:{l:'Others',ic:'📌',c:'#a9a5c2'}
};
const KW={
  pfin:['personal finance','bank','banking','loan','debt','credit card','card bill','bill','bills','rent','mortgage','insurance','tax','taxes','lhdn','budget','budgeting','savings','save money','invest','investing','investment','epf','kwsp','asb','tabung','subscription','subscriptions','expenses','spending','salary','pay off','utilities','electric bill','water bill','phone bill','wallet','retirement','zakat','pension'],
  money:['sales','sale','client','clients','customer','customers','invoice','invoices','revenue','pricing','price','prices','quote','quotation','proposal','deal','deals','lead','leads','pitch','sell','selling','offer','marketing','ads','advert','profit','contract','collect payment','receivable','cash flow','cashflow','prospect','prospects','upsell','business','income','money map','swimin12','tender','enrolment','enrollment','promo','promotion'],
  systems:['ai','automate','automation','tool','tools','software','app','website','site','system','systems','process','workflow','set up','setup','notion','supabase','vercel','github','code','coding','bug','build','spreadsheet','sheet','template','sop','dashboard','crm','integrate','integration','database','claude','chatgpt','prompt','api','backup','server','domain','excel','checklist','automations','password','laptop','computer'],
  people:['team','staff','hire','hiring','interview','meeting','meet','friend','friends','family','mum','mom','mother','dad','father','wife','husband','kids','kid','son','daughter','partner','colleague','colleagues','manager','one on one','1:1','message','text','whatsapp','catch up','coffee','birthday','visit','thank','apologise','apologize','reply','coach','mentor','call','people','relationship','brother','sister','parents'],
  health:['gym','walk','run','running','jog','exercise','workout','work out','sleep','nap','doctor','dentist','clinic','eat','meal','meals','water','drink water','stretch','meditate','meditation','therapy','therapist','psychiatrist','psychologist','health','medicine','meds','pill','yoga','rest','breathe','breathing','steps','diet','protein','vegetables','journal','mood','alcohol','sober','checkup','check up','haircut','shower','sunlight','daylight','push ups','pushups','squats','swim laps','cardio','weights','stress','anxiety','mental']
};
// specific phrases beat generic words like "call" or "build"
const WEAK=new Set(['call','message','text','reply','meet','manager','build','tool','tools','app','site','offer','set up','setup','rest','price','sale']);
const PRIORITY=['pfin','money','health','people','systems'];
const POOL_TAG={w_focus:'other',w_ai:'systems',w_inbox:'people',w_top1:'other',w_team:'people',w_learn:'systems',
  h_journal:'health',h_reach:'people',h_breathe:'health',h_win:'health',h_offline:'health',h_keeper:'health'};
const OPS=['add','rename','done','delete','tag','swap','today','weak_add'];

const norm=s=>String(s||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9:+ ]+/g,' ').replace(/\s+/g,' ').trim();
const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const KWRE={};for(const t in KW)KWRE[t]=KW[t].map(k=>({k,re:new RegExp('(^| )'+reEsc(k)+'( |$)')}));

function autoTag(text){const s=norm(text);if(!s)return 'other';let best='other',bs=0;
  for(const t of PRIORITY){let sc=0;for(const {k,re} of KWRE[t])if(re.test(s))sc+=WEAK.has(k)?0.5:(k.includes(' ')?2:1);
    if(sc>bs){bs=sc;best=t}}
  return best}
function tagOf(q){if(!q)return 'other';if(q.tag&&TAGS[q.tag])return q.tag;const o=S.qtag&&S.qtag[q.id];if(o&&TAGS[o])return o;
  if(POOL_TAG[q.id])return POOL_TAG[q.id];if(LINE.includes(q))return 'money';if(q.area==='body')return 'health';return autoTag(q.t)}
function tagWord(w){const s=norm(w).replace(/^(the|a|an) /,'').replace(/ (tag|category|quest|quests|one|thing)$/,'');
  if(/^(personal finance|personal finances|finance|finances|personal money|my money|bills?)$/.test(s))return 'pfin';
  if(/^(health|healthy|fitness|wellbeing|well being|body|mind|mental health)$/.test(s))return 'health';
  if(/^(money|sales|business|revenue|work money|income)$/.test(s))return 'money';
  if(/^(systems?|tech|tools?|ai|admin|process(es)?)$/.test(s))return 'systems';
  if(/^(people|team|social|family|friends|relationships?)$/.test(s))return 'people';
  if(/^(others?|misc|miscellaneous|general|none)$/.test(s))return 'other';
  return null}

/* ---------- text overrides for built-in quests ---------- */
function applyOverrides(){const o=S.qtext||{};for(const q of POOL.concat(LINE)){if(q._orig==null)q._orig=q.t;q.t=o[q.id]||q._orig}}
function tagExisting(){let ch=false;for(const q of S.custom||[])if(!q.tag){q.tag=autoTag(q.t);ch=true}if(ch)save()}

/* ---------- what can be changed ---------- */
function catalog(){const d=day(),out=[],picks=d.picks||[];
  for(const q of S.custom)if(!q.doneDate)out.push({id:q.id,kind:'yours',t:q.t});
  picks.forEach((id,i)=>{const q=findQ(id);if(q&&q.area&&!LINE.includes(q))out.push({id,kind:'today',t:q.t,i,done:d.done.includes(id)})});
  for(const q of poolAvail(picks))out.push({id:q.id,kind:'board',t:q.t});
  const nl=nextLine();if(nl)out.push({id:nl.id,kind:'main',t:nl.t});
  for(const b of S.bosses||[]){if(!(b.status==='active'||b.status==='lair')||b.rank==='SS')continue;
    out.push({id:'b:'+b.id,kind:'boss',t:b.name});
    for(const w of b.weak)out.push({id:'w:'+b.id+'|'+w.id,kind:'weak',t:w.t,boss:b.name,done:!!w.done})}
  return out}
const KIND={yours:'📜',today:'⚔️',board:'📋',main:'👑',boss:'🐉',weak:'💥'};
const label=e=>`${KIND[e.kind]} ${e.t}${e.kind==='weak'?` (${e.boss})`:''}`;
const STOP=new Set('the a an my to for of quest quests task tasks and on in with please it that this i me is as one just side do thing item step'.split(' '));
const toks=s=>norm(s).split(' ').filter(w=>w&&!STOP.has(w));
const stem=w=>w.length>4?w.slice(0,5):w;
function sim(phrase,title){const a=[...new Set(toks(phrase).map(stem))],b=new Set(toks(title).map(stem));if(!a.length||!b.size)return 0;
  let n=0;for(const w of a)if(b.has(w))n++;return (n/a.length)*0.8+(n/b.size)*0.2}
function match(phrase,kinds){const all=catalog().filter(e=>!kinds||kinds.includes(e.kind));
  if(/\bmain( quest)?( step)?\b/i.test(phrase)){const m=all.find(e=>e.kind==='main');if(m)return{sure:m,cands:[]}}
  const sc=all.map(e=>({e,s:sim(phrase,e.t+(e.boss?' '+e.boss:''))})).filter(x=>x.s>=0.34).sort((x,y)=>y.s-x.s);
  const exact=sc.filter(x=>norm(x.e.t)===norm(phrase).replace(/^the /,''));if(exact.length===1)return{sure:exact[0].e,cands:[]};
  const [a,b]=sc;if(a&&a.s>=0.6&&(!b||a.s-b.s>=0.2))return{sure:a.e,cands:[]};
  return{sure:null,cands:sc.slice(0,4).map(x=>x.e)}}

/* ---------- offline rules ---------- */
function title(s){s=String(s||'').trim().replace(/^(?:please\s+)?(?:a\s+)?(?:new\s+)?(?:quest|task|todo)?\s*(?:to|that i need to|that i have to)?\s+/i,'')
  .replace(/^(?:to)\s+/i,'').replace(/\s+(?:please|thanks|thank you)$/i,'').replace(/[.!?,;:\s]+$/,'').trim();
  return clean(s.charAt(0).toUpperCase()+s.slice(1),100)}
const BIG=/\b(project|launch|website|campaign|rebuild|restructure|strategy|overhaul|migrate|business plan|new system|whole|entire|redesign)\b/i;
function addAct(text,tag){const t=title(text);return t?{op:'add',text:t,tag:tag||autoTag(t)}:null}
function addOrAsk(text){const t=title(text);if(!t)return{};
  if(t.split(' ').length>=10||BIG.test(t))return{q:{text:`“${t}” sounds like a big one. What should I do?`,options:[
    {label:'Add it as a quest',acts:[addAct(t)]},{label:'Make it a boss battle',acts:[{op:'boss',text:t}]},{label:'Skip it',acts:[]}]}};
  return{acts:[addAct(t)]}}
function resolve(phrase,kinds,mk,addInstead){const r=match(phrase,kinds);
  if(r.sure)return{acts:[mk(r.sure)]};
  const alt=addInstead?[{label:`Add “${title(phrase)}” as a new quest`,acts:[addAct(phrase)]}]:[];
  if(r.cands.length)return{q:{text:`Which one did you mean by “${phrase}”?`,options:r.cands.map(e=>({label:label(e),acts:[mk(e)]})).concat(alt,[{label:'None of these',acts:[]}])}};
  return addInstead?{q:{text:`I couldn’t find “${phrase}”.`,options:alt.concat([{label:'Skip it',acts:[]}])}}:{note:`Couldn’t find “${phrase}”.`}}
const VERB='(?:mark|tick|check|delete|remove|cancel|drop|rename|change|edit|update|swap|skip|replace|add|create|tag|move|put|finish|finished|complete|completed|i did|i finished|ive|i have|new)';
function clauses(text){return String(text).split(new RegExp(`[.!?;\\n]+|\\s*,?\\s+(?:and then|then|also|and also|after that|plus)\\s+|\\s*,?\\s+and\\s+(?=${VERB}\\b)`,'i')).map(s=>s&&s.trim()).filter(Boolean)}
function splits(rest){const out=[],re=/\s+(?:to|into|as)\s+/gi;let x;
  while((x=re.exec(rest)))out.push([rest.slice(0,x.index).trim(),rest.slice(x.index+x[0].length).trim()]);
  return out.filter(p=>p[0]&&p[1])}
function rule(c){
  let m;const s=c.replace(/^(?:ok(?:ay)?|so|um+|uh+|hey|please|can you|could you|i want you to)[,\s]+/i,'').trim();
  // weak points for a boss
  if((m=s.match(/^(?:add|new|create)\s+(?:a\s+|another\s+)?weak\s*points?\s+(?:to|for|on)\s+(?:the\s+)?(?:boss\s+)?(.+?)\s*(?::|,|-|saying|called|that says)\s*(.+)$/i))||
     (m=s.match(/^(?:for|on)\s+(?:the\s+)?boss\s+(.+?)\s*[,:-]\s*(?:add\s+)?(.+)$/i)))
    return resolve(m[1],['boss'],e=>({op:'weak_add',id:e.id,text:title(m[2])}));
  // rename / change to a tag ("rename go to gym to go to the gym at 7": try every "to" and keep the split whose left side names a quest best)
  if((m=s.match(/^(?:rename|change|edit|update|reword|rewrite)\s+(?:the\s+)?(.+)$/i))&&/\s(?:to|into|as)\s/i.test(m[1])){
    const parts=splits(m[1]);const tagged=parts.find(p=>tagWord(p[1]));
    if(tagged){const tg=tagWord(tagged[1]);return resolve(tagged[0],null,e=>({op:'tag',id:e.id,tag:tg}))}
    const kinds=['yours','today','board','main','weak'];
    const best=parts.map(p=>({p,s:Math.max(0,...catalog().filter(e=>kinds.includes(e.kind)).map(e=>sim(p[0],e.t)))})).sort((a,b)=>b.s-a.s)[0].p;
    return resolve(best[0],kinds,e=>({op:'rename',id:e.id,text:title(best[1])}))}
  // done
  if((m=s.match(/^(?:mark|tick|check)(?:\s+off)?\s+(?:the\s+)?(.+?)(?:\s+(?:as\s+)?(?:done|complete|completed|finished))?$/i))&&!tagWord(m[1].split(/\s+as\s+/).pop()||'')&&!/\s+as\s+/.test(m[1])||
     (m=s.match(/^(?:i\s+)?(?:have\s+|ve\s+|'ve\s+|just\s+)?(?:finished|completed|done|did)\s+(?:with\s+)?(?:the\s+)?(.+)$/i))||
     (m=s.match(/^(?:complete|finish)\s+(?:the\s+)?(.+)$/i))||
     (m=s.match(/^(?!(?:add|new|create|remind|i need|i have to|i must|i should|i want|todo|to do|dont|don't)\b)(?:the\s+)?(.+?)\s+(?:is|are|was)?\s*(?:done|complete|completed|finished)$/i)))
    return resolve(m[1],['yours','today','board','main','weak'],e=>({op:'done',id:e.id}),true);
  // tag
  if((m=s.match(/^(?:tag|label|file|move|put|mark|set)\s+(?:the\s+)?(.+?)\s+(?:as|under|in|into|to)\s+(.+)$/i))&&tagWord(m[2]))
    return resolve(m[1],null,e=>({op:'tag',id:e.id,tag:tagWord(m[2])}));
  if((m=s.match(/^(?:the\s+)?(.+?)\s+is\s+(?:a\s+|an\s+)?(.+?)\s+(?:quest|thing|task|one)$/i))&&tagWord(m[2]))
    return resolve(m[1],null,e=>({op:'tag',id:e.id,tag:tagWord(m[2])}));
  // delete
  if((m=s.match(/^(?:delete|remove|cancel|drop|scrap|get rid of|forget about|forget)\s+(?:the\s+)?(.+)$/i)))
    return resolve(m[1].replace(/\s+(?:quest|task)s?$/i,''),['yours','today','weak'],e=>({op:'delete',id:e.id}));
  // swap
  if((m=s.match(/^(?:swap|skip|replace)\s+(?:the\s+)?(.+?)(?:\s+(?:for|with)\s+(?:something|another|a different).*)?$/i)))
    return resolve(m[1],['today'],e=>({op:'swap',id:e.id}));
  // add to today from the board
  if((m=s.match(/^(?:add|put)\s+(?:the\s+)?(.+?)\s+(?:to|for|on|into)\s+(?:my\s+)?today(?:s)?(?:\s+list|\s+quests)?$/i))){
    const r=match(m[1],['board']);if(r.sure)return{acts:[{op:'today',id:r.sure.id}]};return addOrAsk(m[1])}
  // add (explicit or implied)
  if((m=s.match(/^(?:add|new quest|new task|create(?: a)?(?: new)?(?: quest| task)?|remind me to|i need to|i have to|i must|i should|i want to|i gotta|gotta|todo|to do|dont forget to|don't forget to)\s*:?\s+(.+)$/i)))
    return addOrAsk(m[1]);
  if(toks(s).length>=2)return addOrAsk(s);
  return{note:`Not sure what to do with “${s}”.`}}
function rulePlan(text){const out={acts:[],qs:[],notes:[]};
  for(const c of clauses(text)){const r=rule(c);if(r.acts)out.acts.push(...r.acts.filter(Boolean));if(r.q)out.qs.push(r.q);if(r.note)out.notes.push(r.note)}
  return out}

/* ---------- online: Claude ---------- */
const SCHEMA={type:'object',properties:{
  actions:{type:'array',items:{type:'object',properties:{op:{type:'string',enum:OPS},id:{type:'string'},text:{type:'string'},tag:{type:'string',enum:Object.keys(TAGS)}},required:['op','id','text','tag'],additionalProperties:false}},
  question:{type:'string'},options:{type:'array',items:{type:'string'}},note:{type:'string'}},
  required:['actions','question','options','note'],additionalProperties:false};
const SYSTEM=`You turn what the user said (speech-to-text, so expect misheard words) into edits to their quest list in a personal habit app. Answer with JSON that matches the schema.

Ops:
- add: a new personal quest. id "". text: a short title that starts with a verb, under 10 words. tag: best fit.
- rename: new title for an existing item. id, text.
- done: mark an existing item complete. id.
- delete: remove an item (kinds yours, today or weak only). id.
- tag: change an item's tag. id, tag.
- swap: replace a "today" side quest with a random one. id.
- today: add a "board" side quest to today's list. id.
- weak_add: add a weak point (a concrete sub-step) to a boss. id: the boss id (starts with "b:"). text: the step.
Give "" for fields an op doesn't use, and tag "other" when it doesn't matter.

Tags: health (body, mind, sleep, exercise, medical), money (the business: sales, clients, revenue, pricing, marketing), systems (tools, AI, processes, tech, admin setup), people (team, family, friends, hiring, relationships), pfin (personal finance: bank, bills, debt, savings, tax, insurance), other.

Rules:
- Use only ids from the list, matching loosely since speech gets misheard.
- Do everything that is clear right away. When something is genuinely unclear (which item they mean, or what they want), put one short question in "question" with 2 to 4 short tap-able "options", and leave only that part out of actions. Otherwise question "" and options [].
- One instruction can produce several actions.
- note: one short, warm sentence about what you did, or "".`;
let conv=null;
function ctxText(){return 'CURRENT ITEMS (id | kind | title):\n'+catalog().map(e=>`${e.id} | ${e.kind}${e.done?' (done)':''}${e.boss?` of boss "${e.boss}"`:''} | ${e.t}`).join('\n')}
async function aiPlan(userText,isAnswer){
  if(!window.Keeper||!Keeper.structured||!Keeper.hasKey()||!navigator.onLine)return null;
  if(!isAnswer||!conv)conv=[{role:'user',content:`${ctxText()}\n\nWHAT THEY SAID:\n${userText}`}];
  else conv.push({role:'user',content:`${ctxText()}\n\nTHEIR ANSWER:\n${userText}`});
  const timeout=new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),20000));
  const r=await Promise.race([Keeper.structured(SYSTEM,conv,SCHEMA),timeout]);
  if(!r||!Array.isArray(r.actions))return null;
  conv.push({role:'assistant',content:JSON.stringify(r)});
  const ids=new Set(catalog().map(e=>e.id)),acts=[];
  for(const a of r.actions){if(!OPS.includes(a.op))continue;
    if(a.op==='add'){const x=addAct(a.text,TAGS[a.tag]&&a.tag!=='other'?a.tag:null);if(x)acts.push(x);continue}
    if(!ids.has(a.id))continue;if(a.op==='weak_add'&&!a.id.startsWith('b:'))continue;
    acts.push({op:a.op,id:a.id,text:a.text?title(a.text):'',tag:TAGS[a.tag]?a.tag:'other'})}
  const qs=r.question?[{text:r.question,ai:true,options:(r.options||[]).slice(0,4).map(o=>({label:String(o)}))}]:[];
  return{acts,qs,notes:r.note?[r.note]:[],ai:true}}

/* ---------- applying ---------- */
const cid=()=>'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function bossOf(id){const [bid,wid]=id.slice(2).split('|');const b=(S.bosses||[]).find(x=>x.id===bid);return{b,w:b&&wid?b.weak.find(x=>x.id===wid):null}}
function apply(a,out){const d=day();
  if(a.op==='add'){S.custom.push({id:cid(),t:a.text,tiny:'Set a 10-minute timer and just start.',xp:30,fun:15,created:dayKey(),doneDate:null,tag:a.tag||autoTag(a.text),by:'voice'});
    out.push(`➕ Added “${a.text}” · ${TAGS[a.tag]?TAGS[a.tag].ic+' '+TAGS[a.tag].l:''}`);return}
  if(a.op==='boss'){out.push(`🐉 Opening the boss summon for “${a.text}”`);pendingBoss=a.text;return}
  if(a.op==='weak_add'){const {b}=bossOf(a.id);if(!b||!a.text)return;if(b.weak.length>=12){out.push(`⚠️ ${b.name} already has 12 weak points`);return}
    b.weak.push({id:'w'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:a.text,done:null});out.push(`💥 Weak point for ${b.name}: “${a.text}”`);return}
  if(a.id.startsWith('w:')){const {b,w}=bossOf(a.id);if(!b||!w)return;
    if(a.op==='done'){if(w.done){out.push(`✓ “${w.t}” was already done`);return}doneQ.push(()=>A.bweak(b.id+'|'+w.id));out.push(`💥 Hit weak point “${w.t}”`)}
    else if(a.op==='delete'){b.weak=b.weak.filter(x=>x!==w);out.push(`🗑️ Removed weak point “${w.t}”`)}
    else if(a.op==='rename'&&a.text){out.push(`✏️ “${w.t}” → “${a.text}”`);w.t=a.text}
    return}
  if(a.id.startsWith('b:'))return;
  const q=findQ(a.id);if(!q)return;const isLine=LINE.includes(q),isPool=!!q.area&&!isLine;
  switch(a.op){
    case 'done':
      if(isLine?S.line[q.id]:isPool?d.done.includes(q.id):q.doneDate){out.push(`✓ “${q.t}” was already done`);return}
      if(q.auto){out.push(`⏳ “${q.t}” completes itself when you ${q.auto==='keeper'?'talk to the Keeper':'finish a focus block'}`);return}
      if(isPool){if(!d.picks)d.picks=[];if(!d.picks.includes(q.id))d.picks.push(q.id)}
      doneQ.push(()=>complete(q.id));out.push(`✅ Done: “${q.t}”`);return;
    case 'rename':if(!a.text)return;out.push(`✏️ “${q.t}” → “${a.text}”`);
      if(isLine||isPool){S.qtext=S.qtext||{};S.qtext[q.id]=a.text}else q.t=a.text;return;
    case 'delete':
      if(isLine){out.push('👑 Main quest steps can’t be deleted');return}
      if(isPool){if(d.done.includes(q.id)){out.push(`✓ “${q.t}” is already done today`);return}d.picks=(d.picks||[]).filter(x=>x!==q.id);out.push(`🗑️ Removed “${q.t}” from today`);return}
      S.custom=S.custom.filter(x=>x!==q);out.push(`🗑️ Deleted “${q.t}”`);return;
    case 'tag':{const t=TAGS[a.tag]?a.tag:'other';if(isLine||isPool){S.qtag=S.qtag||{};S.qtag[q.id]=t}else q.tag=t;out.push(`🏷️ “${q.t}” → ${TAGS[t].ic} ${TAGS[t].l}`);return}
    case 'swap':{const i=(d.picks||[]).indexOf(q.id);if(i<0||d.done.includes(q.id))return;const old=q.t;swapQ.push(i);out.push(`🔄 Swapped “${old}”`);return}
    case 'today':if(!d.picks)d.picks=[];if(!d.picks.includes(q.id))d.picks.push(q.id);out.push(`⚔️ Added “${q.t}” to today`);return}}
let doneQ=[],swapQ=[],pendingBoss=null;
function applyAll(acts){const out=[];doneQ=[];swapQ=[];
  for(const a of acts){try{apply(a,out)}catch(e){out.push('⚠️ Couldn’t do one of those')}}
  save();for(const i of swapQ)try{swap(i)}catch(e){}
  doneQ.forEach((f,i)=>setTimeout(()=>{try{f()}catch(e){}},i*700));
  render();return out}

/* ---------- the voice sheet ---------- */
let V=null,rec=null;
const SR=()=>window.SpeechRecognition||window.webkitSpeechRecognition;
function sheet(){const q=V.qs[0];
  const results=V.results.length?`<div class="vres">${V.results.map(r=>`<div>${esc(r)}</div>`).join('')}</div>`:'';
  const notes=V.notes.length?`<p class="small muted" style="margin:8px 0 0">${V.notes.map(esc).join(' ')}</p>`:'';
  const ask=q?`<div class="vq"><b>❓ ${esc(q.text)}</b><div class="vopts">${q.options.map((o,i)=>`<button class="btn sm${i===0?' gold':''}" data-a="vopt" data-v="${i}">${esc(o.label)}</button>`).join('')}</div>
    <p class="tiny muted" style="margin-top:6px">Tap an answer, or say it with the mic.</p></div>`:'';
  const state=V.busy?'🧠 Thinking…':V.listening?'🔴 Listening… tap the mic to stop':V.msg?esc(V.msg):q?'':'Tap the mic and say what to change.';
  return `<div class="row between"><h2>🎙️ Voice quests</h2>${V.snap?'<button class="btn sm ghost" data-a="vundo">↩️ Undo</button>':''}</div>
  ${results}${notes}${ask}
  <p class="small muted vstate" id="vstate" style="margin:12px 0 8px">${state}</p>
  <textarea id="vtext" class="vtext" placeholder="e.g. Add call the bank about the loan. Mark the walk done. Rename the inbox quest to clear emails.">${esc(V.draft||'')}</textarea>
  <div class="vbar"><button class="vbig ${V.listening?'on':''}" data-a="vrec" aria-label="${V.listening?'Stop listening':'Start listening'}">🎙️</button>
  <button class="btn gold" data-a="vgo" style="flex:1">${q?'Send answer':'Do it'}</button></div>
  <p class="tiny muted" style="margin-top:10px">${navigator.onLine&&window.Keeper&&Keeper.hasKey&&Keeper.hasKey()?'Smart mode: the Keeper understands messy speech.':'Offline mode: say things like “add…”, “mark … done”, “rename … to …”, “delete …”, “tag … as money”.'}</p>
  <button class="btn ghost block" data-a="vclose" style="margin-top:6px">Close</button>`}
function draw(){const t=$('#vtext');if(t)V.draft=t.value;openModal(sheet());const n=$('#vtext');if(n&&!V.listening&&!V.busy&&V.focus){n.focus();V.focus=false}}
function setState(txt){const el=$('#vstate');if(el)el.textContent=txt}
function fallback(msg){V.listening=false;V.msg=msg;V.focus=true;draw()}
function listen(){
  const R=SR();if(!R)return fallback('This browser can’t listen. Type below, or tap the mic on your keyboard.');
  try{rec&&rec.abort()}catch(e){}
  let r;try{r=new R()}catch(e){return fallback('Voice isn’t available here. Type below, or tap the mic on your keyboard.')}
  rec=r;r.lang='en-US';r.interimResults=true;r.continuous=false;r.maxAlternatives=1;
  if(!navigator.onLine){if('processLocally' in r){try{r.processLocally=true}catch(e){}}else return fallback('You’re offline, so the mic can’t understand speech. Type below, or tap the mic on your keyboard.')}
  const t0=$('#vtext');const base=t0?t0.value.trim():'';let fin='',err='';
  r.onresult=e=>{let interim='';fin='';for(let i=0;i<e.results.length;i++){const x=e.results[i];if(x.isFinal)fin+=x[0].transcript;else interim+=x[0].transcript}
    const t=$('#vtext');if(t)t.value=((base?base+' ':'')+(fin+' '+interim).trim()).trim();V.draft=t?t.value:V.draft};
  r.onerror=e=>{err=e.error||'error'};
  r.onend=()=>{if(rec!==r)return;rec=null;V.listening=false;
    if(err&&err!=='aborted'&&!fin.trim()){
      V.msg=err==='not-allowed'||err==='service-not-allowed'?'Microphone access is off. Allow it for this site in your browser settings, or type below.'
        :err==='no-speech'?'I didn’t hear anything. Tap the mic to try again.'
        :err==='network'||err==='language-not-supported'?'Voice needs internet right now. Type below, or tap the mic on your keyboard.'
        :'Voice stopped ('+err+'). Type below, or tap the mic to try again.';V.focus=err!=='no-speech';draw();return}
    V.msg='';if(fin.trim())setTimeout(go,300);else draw()};
  V.listening=true;V.msg='';draw();
  try{r.start()}catch(e){rec=null;fallback('Couldn’t start the microphone. Type below, or tap the mic on your keyboard.')}}
async function go(){if(!V)return;const t=$('#vtext');const text=((t&&t.value)||V.draft||'').trim();if(!text){V.focus=true;draw();return}
  if(rec){try{rec.stop()}catch(e){}}
  V.draft='';if(t)t.value='';const q=V.qs[0];
  if(q){if(q.ai)return run(text,true);
    const i=q.options.map((o,k)=>({k,s:sim(text,o.label)})).sort((a,b)=>b.s-a.s)[0];
    if(i&&i.s>=0.5)return choose(i.k);V.qs.shift()}
  return run(text,false)}
async function run(text,isAnswer){if(!V)return;V.busy=true;V.msg='';draw();let plan=null;
  try{plan=await aiPlan(text,isAnswer)}catch(e){plan=null}
  if(!plan){conv=null;plan=rulePlan(text)}
  if(isAnswer&&plan.ai)V.qs.shift();
  if(!V)return;V.busy=false;take(plan)}
function take(plan){if(!V)return;plan.acts=plan.acts.filter(Boolean);if(plan.acts.length&&!V.snap)V.snap=JSON.stringify(S);
  const out=applyAll(plan.acts);V.results.push(...out);V.notes=plan.notes||[];V.qs.push(...plan.qs);
  if(!out.length&&!plan.qs.length&&!V.notes.length)V.msg='Nothing to change there. Try “add …”, “mark … done” or “rename … to …”.';
  if(out.length)sound(1);
  if(pendingBoss){const name=pendingBoss;pendingBoss=null;closeModal();setTimeout(()=>{A.bnew();const el=$('#bname');if(el){el.value=name;el.dispatchEvent(new Event('input',{bubbles:true}))}},200);return}
  draw()}
function choose(i){const q=V.qs[0];if(!q)return;const o=q.options[i];if(!o)return;
  if(q.ai)return run(o.label,true);
  V.qs.shift();take({acts:(o.acts||[]).filter(Boolean),qs:[],notes:[]})}
function open(){if(rec){try{rec.abort()}catch(e){}rec=null}
  V={results:[],notes:[],qs:[],snap:null,draft:'',msg:'',busy:false,listening:false,focus:false};conv=null;listen()}

Object.assign(A,{
  vmic:()=>open(),
  vrec:()=>{if(V&&V.listening&&rec){try{rec.stop()}catch(e){}return}listen()},
  vgo:()=>go(),
  vopt:v=>choose(+v),
  vundo:()=>{if(!V||!V.snap)return;try{localStorage.setItem(KEY,V.snap)}catch(e){}load();save();V.snap=null;V.results=['↩️ Undone. Everything is back how it was.'];V.qs=[];V.notes=[];conv=null;render();draw()},
  vclose:()=>{if(rec){try{rec.abort()}catch(e){}rec=null}V=null;closeModal()},
  vtag:v=>{const q=findQ(v);if(!q)return;const cur=tagOf(q);
    openModal(`<h2>🏷️ Tag this quest</h2><p class="small muted" style="margin:4px 0 12px">${esc(q.t)}</p><div class="vtags">${Object.entries(TAGS).map(([k,t])=>`<button class="tagc big ${k===cur?'on':''}" style="--tg:${t.c}" data-a="vtagset" data-v="${esc(v)}|${k}">${t.ic} ${t.l}</button>`).join('')}</div>
      <button class="btn ghost block" data-a="close" style="margin-top:14px">Close</button>`)},
  vtagset:v=>{const i=v.lastIndexOf('|'),id=v.slice(0,i),t=v.slice(i+1),q=findQ(id);if(!q||!TAGS[t])return;
    if(q.area||LINE.includes(q)){S.qtag=S.qtag||{};S.qtag[id]=t}else q.tag=t;save();closeModal();render()},
  vtf:v=>{S.vtf=S.vtf===v||!TAGS[v]?null:v;save();render()}
});

/* ---------- tags in the views ---------- */
const chip=q=>{const k=tagOf(q),t=TAGS[k];return `<button class="tagc" style="--tg:${t.c}" data-a="vtag" data-v="${esc(q.id)}" aria-label="Tag: ${t.l}">${t.ic} ${t.l}</button>`};
const _qCard=qCard;
qCard=function(q,o={}){if(TAB==='quests'&&S.vtf&&(o.area==='custom')&&tagOf(q)!==S.vtf)return '';
  return _qCard(q,o).replace('<div class="meta">','<div class="meta">'+chip(q))};
const _vQuests=vQuests;
vQuests=function(){let h=_vQuests();
  const head='<h3>📜 Your quests</h3><button class="btn sm" data-a="shrink">+ Add</button></div>';
  if(h.includes(head))h=h.replace(head,head+`<div class="vfilt">${Object.entries(TAGS).map(([k,t])=>`<button class="tagc ${S.vtf===k?'on':''}" style="--tg:${t.c}" data-a="vtf" data-v="${k}">${t.ic} ${t.l}</button>`).join('')}</div>`
    +(S.vtf?`<p class="tiny muted" style="margin:-4px 2px 8px">Showing ${TAGS[S.vtf].l} only · <button class="tiny" style="color:var(--gold2);text-decoration:underline" data-a="vtf" data-v="">show all</button></p>`:''));
  const byTitle={};for(const q of allPool())byTitle[esc(q.t)]=q;
  h=h.replace(/<div class="q" style="--c:[^"]*;padding:10px 12px"><div class="bd"><div class="t" style="font-size:15px">([\s\S]*?)<\/div><div class="meta">([\s\S]*?)<\/div><\/div>\s*(<span class="tiny muted">[^<]*<\/span>|<button class="btn sm" data-a="addtoday" data-v="[^"]*">\+<\/button>)<\/div>/g,
    (row,t)=>{const q=byTitle[t];if(!q)return row;if(S.vtf&&tagOf(q)!==S.vtf)return '';return row.replace('<div class="meta">','<div class="meta">'+chip(q))});
  return h};
const _render=render;
render=function(){applyOverrides();const r=_render();document.body.classList.toggle('on-keeper',TAB==='keeper');return r};

/* ---------- mic button + styles ---------- */
document.body.insertAdjacentHTML('beforeend','<button id="vmic" data-a="vmic" aria-label="Change quests by voice">🎙️</button>');
const css=document.createElement('style');css.textContent=`
#vmic{position:fixed;right:14px;bottom:calc(140px + env(safe-area-inset-bottom));z-index:8;width:56px;height:56px;border-radius:50%;font-size:24px;
  background:linear-gradient(160deg,#7c4ddb,#3b2f72);border:1px solid #a78bfa;box-shadow:0 8px 24px -6px rgba(124,77,219,.7);display:grid;place-items:center}
#vmic:active{transform:scale(.94)}
#app{padding-bottom:calc(280px + env(safe-area-inset-bottom))}
#chestbtn{bottom:calc(208px + env(safe-area-inset-bottom))}
body.on-keeper #vmic{bottom:calc(292px + env(safe-area-inset-bottom))}
body.on-keeper #chestbtn{bottom:calc(358px + env(safe-area-inset-bottom))}
.tagc{display:inline-flex;align-items:center;gap:3px;padding:1px 8px;margin-right:6px;border-radius:99px;font-size:11px;font-weight:600;line-height:1.6;
  color:var(--tg);border:1px solid color-mix(in srgb,var(--tg) 55%,transparent);background:color-mix(in srgb,var(--tg) 10%,transparent);vertical-align:1px}
.tagc.on{background:var(--tg);color:#141414;border-color:var(--tg)}
.tagc.big{font-size:14px;padding:10px 12px;margin:0;justify-content:center}
.vtags{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.vfilt{display:flex;flex-wrap:wrap;gap:6px;margin:-2px 2px 10px}
.vfilt .tagc{margin:0;padding:4px 10px;font-size:12px}
.vtext{min-height:84px;margin-bottom:10px}
.vbar{display:flex;gap:10px;align-items:center}
.vbig{width:64px;height:64px;flex:none;border-radius:50%;font-size:28px;background:linear-gradient(160deg,#7c4ddb,#3b2f72);border:1px solid #a78bfa}
.vbig.on{background:#e5484d;border-color:#ff8a8a;animation:vpul 1.1s ease-in-out infinite}
@keyframes vpul{0%,100%{box-shadow:0 0 0 0 rgba(229,72,77,.6)}50%{box-shadow:0 0 0 12px rgba(229,72,77,0)}}
.vres{margin-top:12px;padding:10px 12px;border-radius:12px;background:var(--card);border:1px solid var(--line);font-size:14px;display:grid;gap:6px}
.vq{margin-top:12px;padding:12px;border-radius:12px;background:rgba(242,193,78,.08);border:1px solid rgba(242,193,78,.5)}
.vopts{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
@media (prefers-reduced-motion:reduce){.vbig.on{animation:none}}`;document.head.appendChild(css);

tagExisting();
window.Voice={rulePlan,autoTag,tagOf,catalog,clauses,applyAll,TAGS};
render();
})();
