'use strict';
/* ============ SYNC: keep phone and computer on the same kingdom ============
   Opt-in. One device makes a private sync code; other devices join with it.
   The whole kingdom is stored in Supabase under a SHA-256 hash of that code.
   The Claude API key is stored separately on each device and never syncs. */
(function(){
const CFG={url:'https://lrmzsruxlifpmcnjzema.supabase.co',key:'sb_publishable_ooxT5EldojjkHRH89vKF-g_9mtoU-b1'}; // Supabase project URL and publishable key (safe to be public)
const SK='kingdomReborn.sync',BK='kingdomReborn.preSync';
const ready=()=>!!(CFG.url&&CFG.key);
let M=(()=>{try{return JSON.parse(localStorage.getItem(SK))||{}}catch(e){return {}}})();
const putM=()=>{try{localStorage.setItem(SK,JSON.stringify(M))}catch(e){}};
let busy=false,again=false,timer=null,applying=false,err='';

function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)+':'+s.length}
const ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode(){const r=new Uint8Array(20);crypto.getRandomValues(r);return fmtCode(Array.from(r,x=>ABC[x%32]).join(''))}
function fmtCode(s){s=String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');return (s.match(/.{1,5}/g)||[]).join('-')}
const okCode=c=>/^[A-Z0-9]{5}(-[A-Z0-9]{5}){3}$/.test(c);
const device=()=>/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)?'phone':'computer';
const ago=t=>{if(!t)return 'never';const s=Math.round((Date.now()-t)/1000);return s<45?'just now':s<3600?Math.round(s/60)+' min ago':s<86400?Math.round(s/3600)+' h ago':new Date(t).toLocaleDateString()};
const typing=()=>{const a=document.activeElement;return a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)};

async function rpc(fn,body){
  const h={'Content-Type':'application/json',apikey:CFG.key};if(/^eyJ/.test(CFG.key))h.Authorization='Bearer '+CFG.key;
  const r=await fetch(`${CFG.url}/rest/v1/rpc/${fn}`,{method:'POST',headers:h,body:JSON.stringify(body),cache:'no-store'});
  if(!r.ok)throw new Error('Sync server said '+r.status);return r.json()}

function apply(r){
  try{const cur=localStorage.getItem(KEY);if(cur)localStorage.setItem(BK,JSON.stringify({t:Date.now(),data:cur}))}catch(e){}
  applying=true;
  try{localStorage.setItem(KEY,JSON.stringify(r.data.s));load();save()}finally{applying=false}
  M.rev=r.rev;M.h=hash(JSON.stringify(S));M.t=r.data.t||Date.parse(r.updated_at)||Date.now();putM();
  if(window.closeModal&&!$('#modal').classList.contains('hidden')&&!typing())closeModal();
  render();toast('<div>🔄 <b>Synced</b> from your other device</div>')}

async function push(base){
  const cur=JSON.stringify(S),h=hash(cur);
  if(!M.t)M.t=Date.now();
  const r=(await rpc('kr_push',{p_code:M.code,p_base:base||0,p_data:{v:1,t:M.t,s:JSON.parse(cur)},p_device:device()}))[0];
  if(r&&r.ok){M.rev=r.rev;M.h=h;putM();return true}
  again=true;return false}

async function sync(){
  if(!ready()||!M.code)return;if(!navigator.onLine){err='offline';ui();return}
  if(busy){again=true;return}busy=true;again=false;
  try{
    let r=(await rpc('kr_pull',{p_code:M.code}))[0]||null;if(r&&!(r.data&&r.data.s))r=null;
    const dirty=hash(JSON.stringify(S))!==M.h;
    if(M.join){
      if(!r){toast('No kingdom found with that code. Check it and try again.');M={};putM();busy=false;render();return}
      M.join=false;apply(r)}
    else if(r&&r.rev>(M.rev||0)){
      if(!dirty){if(!typing())apply(r);else again=true}
      else if(((r.data&&r.data.t)||0)>=(M.t||0)){ // newest edit wins; the other version is kept as a backup
        if(!typing())apply(r);else again=true}
      else await push(r.rev)}
    else if(dirty||!r)await push(r?r.rev:0);
    M.at=Date.now();err='';putM()}
  catch(e){err=e.message||'failed'}
  busy=false;ui();
  if(again){again=false;clearTimeout(timer);timer=setTimeout(sync,3000)}}

function schedule(){if(!M.code||!ready())return;clearTimeout(timer);timer=setTimeout(sync,4000)}
const _save=save;
save=function(){_save();if(applying||!M.code)return;const h=hash(JSON.stringify(S));if(h!==M.h&&h!==M.lh){M.lh=h;M.t=Date.now();putM()}if(h!==M.h)schedule()};

/* ---------- UI ---------- */
function ui(){const el=$('#synst');if(el)el.innerHTML=status()}
function status(){if(!ready())return 'Sync isn’t switched on for this app yet.';
  if(err==='offline')return '📴 Offline. Changes will sync when you’re back online.';
  if(err)return `⚠️ Last try failed (${esc(err)}). It will retry automatically.`;
  return `✅ Synced ${ago(M.at)}`}
function card(){
  let h=`<div class="section-t"><h3>🔄 Sync devices</h3><span class="tiny muted">phone ⇄ computer</span></div><div class="card">`;
  if(!ready())return h+`<p class="small muted">Sync isn’t switched on for this app yet. Until then each device keeps its own kingdom; use Export and Import backup below to move it.</p></div>`;
  if(M.code){
    h+=`<p class="small">This device is linked. Your quests, bosses, Keeper chats and progress stay the same on every device with this code.</p>
    <div class="syncode">${esc(M.code)}</div>
    <div class="grid2"><button class="btn sm" data-a="syncopy" data-v="code">📋 Copy code</button><button class="btn sm" data-a="syncopy" data-v="link">🔗 Copy link</button></div>
    <p class="tiny muted" style="margin-top:8px">On your other device, open the link, or go to Me → Sync devices and enter the code. Keep it private: anyone with it can see your kingdom.</p>
    <p class="small" id="synst" style="margin:10px 0 0">${status()}</p>
    <div class="grid2" style="margin-top:10px"><button class="btn sm" data-a="synnow">🔄 Sync now</button><button class="btn sm ghost" data-a="synoff">Unlink this device</button></div>`;
    let bk=null;try{bk=JSON.parse(localStorage.getItem(BK)||'null')}catch(e){}
    if(bk)h+=`<button class="tiny" style="margin-top:10px;color:var(--muted);text-decoration:underline" data-a="synundo">Undo last sync (restore this device as of ${new Date(bk.t).toLocaleString()})</button>`;
    return h+'</div>'}
  return h+`<p class="small">Use the same kingdom on your phone and computer.</p>
    <button class="btn gold block" data-a="synon" style="margin-top:10px">Start syncing from this device</button>
    <label class="f">Already started on another device? Enter its code</label>
    <div class="row"><input id="syncin" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autocapitalize="characters" autocomplete="off" spellcheck="false"><button class="btn sm" data-a="synjoin">Link</button></div>
    <p class="tiny muted" style="margin-top:8px">Start on the device with your real progress (probably your phone). Linking replaces this device’s kingdom with the synced one; a backup is kept.</p></div>`}

const _vMe=vMe;
vMe=function(){let h=_vMe();const i=h.indexOf('<div class="section-t"><h3>⚙️ Settings</h3>');
  if(i>=0)h=h.slice(0,i)+card()+h.slice(i);
  if(M.code&&ready())h=h.replace('Your data lives only on this phone. Export a backup now and then.','Your kingdom syncs between your linked devices. Export a backup now and then too.').replace('nothing leaves your device','syncs only with your code');
  return h};

function join(code){code=fmtCode(code);if(!okCode(code)){toast('That code doesn’t look right. It has 4 groups of 5 letters and numbers.');return false}
  M={code,join:true,rev:0};putM();toast('🔄 Linking…');sync();return true}

Object.assign(A,{
  synon:()=>{M={code:genCode(),rev:0,h:null};putM();render();sync();toast('<div>🔄 <b>Sync is on.</b></div><div class="tiny muted">Now open the link or enter the code on your other device.</div>')},
  synjoin:()=>{const el=$('#syncin');if(!el||!el.value.trim()){if(el)el.focus();return}
    if(confirm('Link this device? Its current kingdom will be replaced by the synced one (a backup is kept).'))join(el.value)},
  syncopy:v=>{const t=v==='link'?location.origin+location.pathname+'#sync='+M.code:M.code;
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Copied ✓'),()=>prompt('Copy this:',t))},
  synnow:()=>{err='';ui();sync()},
  synoff:()=>{if(!confirm('Unlink this device? It keeps its current data but stops syncing.'))return;M={};putM();render()},
  synundo:()=>{let bk=null;try{bk=JSON.parse(localStorage.getItem(BK)||'null')}catch(e){}if(!bk)return;
    if(!confirm('Restore this device to how it was before the last sync? This version will then sync to your other devices.'))return;
    localStorage.setItem(KEY,bk.data);localStorage.removeItem(BK);load();M.h=null;putM();save();render();toast('Restored ✓')}
});

const css=document.createElement('style');css.textContent=`
.syncode{font:700 19px ui-monospace,Menlo,Consolas,monospace;letter-spacing:1px;text-align:center;padding:12px;margin:10px 0;border-radius:12px;background:var(--bg2);border:1px dashed var(--gold);color:var(--gold2);word-break:break-all;user-select:all}
#syncin{text-transform:uppercase;font-family:ui-monospace,Menlo,Consolas,monospace}`;document.head.appendChild(css);

/* ---------- triggers ---------- */
function fromLink(){const m=location.hash.match(/sync=([A-Za-z0-9-]+)/);if(!m)return;history.replaceState(null,'',location.pathname+location.search);
  if(!ready())return;const code=fmtCode(m[1]);if(M.code===code)return;
  setTimeout(()=>{if(confirm('Link this device to your kingdom? Its current data will be replaced by the synced one (a backup is kept).')){join(code);TAB='me';render()}},600)}
fromLink();
// Send pending changes right away when the app is closed or hidden, instead of waiting for the 4-second delay.
const flush=()=>{if(M.code&&hash(JSON.stringify(S))!==M.h){clearTimeout(timer);sync()}};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync();else flush()});
window.addEventListener('pagehide',flush);
window.addEventListener('online',()=>sync());
window.addEventListener('focus',()=>sync());
setInterval(()=>{if(document.visibilityState==='visible')sync()},45000);
setTimeout(sync,800);
window.Sync={sync,cfg:CFG,state:()=>M,fmtCode};
render();
})();
