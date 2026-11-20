'use strict';
/* ============ CONTENT ============ */
const AREAS={
  work:{name:'Work',ic:'⚒️',c:'var(--work)'},
  body:{name:'Body',ic:'🌿',c:'var(--body)'},
  heart:{name:'Mind & Heart',ic:'💗',c:'var(--heart)'},
  main:{name:'Main Quest',ic:'👑',c:'var(--gold)'},
  custom:{name:'Your quest',ic:'📜',c:'var(--gold2)'}
};
const POOL=[
  {id:'w_focus',area:'work',t:'One 10-minute focus block',tiny:'Open Focus and press 10 min. That’s the whole quest.',xp:25,fun:0,auto:true},
  {id:'w_ai',area:'work',t:'Try one AI tool on a real work task',tiny:'Paste one annoying task into an AI chat and ask for a first draft.',xp:35,fun:15},
  {id:'w_inbox',area:'work',t:'Clear messages for 10 minutes',tiny:'Reply to just the oldest one first.',xp:25,fun:10},
  {id:'w_top1',area:'work',t:'Write tomorrow’s ONE most important task',tiny:'One line, in Notes or on a sticky note.',xp:20,fun:10},
  {id:'w_team',area:'work',t:'Check in with one team member',tiny:'“Hey, how’s it going? Anything blocking you?”',xp:30,fun:10},
  {id:'w_learn',area:'work',t:'Watch or read one AI-for-business thing',tiny:'Search “AI for [your industry]” and watch one video. Productive YouTube!',xp:25,fun:10},
  {id:'b_walk',area:'body',t:'Walk 10 minutes',tiny:'Shoes on. Step outside. Turn back whenever you like.',xp:30,fun:15},
  {id:'b_move',area:'body',t:'20 reps of anything',tiny:'Push-ups, squats or stairs, any mix. Start with just 1.',xp:25,fun:10},
  {id:'b_water',area:'body',t:'Drink a full glass of water',tiny:'Fill the glass now.',xp:10,fun:5},
  {id:'b_sun',area:'body',t:'5 minutes of daylight',tiny:'Open the curtains or stand at a door or window.',xp:15,fun:5},
  {id:'b_bed',area:'body',t:'Phone down by bedtime',tiny:'Plug the phone in across the room.',xp:30,fun:15},
  {id:'b_meal',area:'body',t:'Eat one real meal',tiny:'Anything with protein or vegetables counts.',xp:15,fun:5},
  {id:'b_stretch',area:'body',t:'5-minute stretch',tiny:'Reach for the ceiling. Then touch your knees.',xp:15,fun:5},
  {id:'h_journal',area:'heart',t:'Write 3 lines: how I feel, what I need',tiny:'Start with “Right now I feel…”',xp:25,fun:10},
  {id:'h_reach',area:'heart',t:'Message one friend or family member',tiny:'“Hey, thinking of you. How are you?”',xp:30,fun:15},
  {id:'h_breathe',area:'heart',t:'2 minutes of slow breathing',tiny:'In for 4, out for 6. Ten times.',xp:15,fun:5},
  {id:'h_win',area:'heart',t:'Name one thing that went OK today',tiny:'Even “I got out of bed” counts.',xp:15,fun:5},
  {id:'h_offline',area:'heart',t:'10 minutes with no screens',tiny:'Sit somewhere, phone in another room. Just notice.',xp:20,fun:10},
  {id:'h_keeper',area:'heart',t:'5 minutes with the Keeper',tiny:'Open the Keeper tab and say how today really feels.',xp:20,fun:10,auto:'keeper'}
];
const LINE_NAME='Find What Makes Money Now';
const LINE=[
  {id:'m1',t:'Open a blank note called “Money Map”',tiny:'Just create it. Done is done.',xp:20,fun:10},
  {id:'m2',t:'List every income source from the last 12 months',tiny:'Write the first 3 that come to mind. Add more later.',xp:40,fun:15},
  {id:'m3',t:'Next to each, write rough revenue',tiny:'Ballpark is fine. Guess first, check later.',xp:40,fun:15},
  {id:'m4',t:'Mark each one: effort High / Med / Low',tiny:'Gut feeling. 10 seconds each.',xp:30,fun:10},
  {id:'m5',t:'Circle the top 3: most money, least pain',tiny:'Look for high revenue + low effort.',xp:40,fun:15},
  {id:'m6',t:'List your 5 biggest monthly costs',tiny:'Open bank or accounting app. Write the top one.',xp:40,fun:15},
  {id:'m7',t:'Ask 1 best client: “What do you value most from us?”',tiny:'Copy that sentence into a message. Send.',xp:60,fun:20},
  {id:'m8',t:'Ask 1 lost client or lead why they didn’t buy',tiny:'“No hard feelings, what would have made it a yes?”',xp:60,fun:20},
  {id:'m9',t:'Pick ONE offer to double down on for 30 days',tiny:'Choose from your top 3. Imperfect is fine.',xp:50,fun:20},
  {id:'m10',t:'Write a 1-page plan: who, what, price, how to reach them',tiny:'Four headings. One line each to start.',xp:80,fun:30},
  {id:'m11',t:'Find 1 way AI can make that offer faster or cheaper',tiny:'Ask an AI: “How could AI cut the time to deliver [offer]?”',xp:60,fun:20},
  {id:'m12',t:'Share the plan with your team or 1 trusted person',tiny:'Send the note. Ask for one honest reaction.',xp:80,fun:30},
  {id:'m13',t:'Turn your yearly money goal into a Mythic boss',tiny:'Quests → Bosses → Summon → Mythic. A rough goal is fine; you can adjust it later.',xp:50,fun:20}
];
const ENERGY={
  survival:{ic:'🪫',l:'Survival',n:1,tone:'gentle',hint:'10-minute mode. One small thing is a full win today.'},
  low:{ic:'🌥️',l:'Low',n:2,tone:'gentle',hint:'Low tide. Two small quests, nothing heroic needed.'},
  ok:{ic:'☀️',l:'Okay',n:3,tone:'friend',hint:'Steady day. Three quests and the main quest step.'},
  strong:{ic:'🔥',l:'Strong',n:4,tone:'hype',hint:'Strong day! Ride it, but stop before you’re drained.'}
};
const MOODS=['😞','😕','😐','🙂','😄'];
const VOICE={
  gentle:['You showed up. On a hard day, that’s the whole win.','Small counts. Small is how kingdoms are rebuilt.','That was enough for right now. Be kind to yourself.','One stone placed. The wall remembers.','You did a thing while it was hard. That’s real strength.','Rest is allowed. You already moved forward today.'],
  friend:['Nice. One more than zero, and zero is the hardest number to beat.','Look at you, actually doing stuff.','That’s momentum. Want one more, or a break? Both are fine.','Solid. Future you just exhaled.','Done is better than perfect, and that was done.','Quietly building. I see it.'],
  hype:['The hero strikes! The kingdom stirs!','The banners rise again!','Another stone on the walls of the Keep!','The bards will sing of this one.','Unstoppable today. Remember to rest the blade too.','The realm grows stronger with every swing!']
};
const GREET={
  gentle:['Welcome back. We go slow today, and slow still counts.','Hey. No pressure. Let’s find one small thing.','You opened the app. That’s already a step.'],
  friend:['Morning, builder. What’s the one thing today?','Back at it. Let’s keep it light and real.','Okay, let’s stack a couple of small wins.'],
  hype:['The kingdom awaits its ruler!','Fire in the belly! Let’s build!','Today, the walls go up!']
};
const WHY_ROOTS={
  rebuild:{l:'Prove I can rebuild',s:'I’m proving to myself I can rebuild, and come back stronger than before.'},
  people:{l:'People who rely on me',s:'The people who rely on me deserve the best version of me.'},
  meaningful:{l:'Build something meaningful',s:'I’m building something meaningful I’ll be proud of.'},
  freedom:{l:'Freedom & stability',s:'Every small win buys back my freedom and peace of mind.'}
};
const BUILDINGS=[
  {lv:1,ic:'🔥',n:'Campfire',d:'Where every comeback begins'},
  {lv:2,ic:'🗼',n:'Watchtower',d:'You can see what’s coming'},
  {lv:3,ic:'🌾',n:'Farm',d:'Your body, fed and moving'},
  {lv:4,ic:'⛲',n:'Well',d:'Calm water, a clearer mind'},
  {lv:5,ic:'⚒️',n:'Forge',d:'Where AI tools are made'},
  {lv:6,ic:'📚',n:'Library',d:'Learning returns'},
  {lv:7,ic:'🏡',n:'Hearth Hall',d:'Friends and family welcome'},
  {lv:8,ic:'🏪',n:'Market',d:'Trade flows again'},
  {lv:10,ic:'💰',n:'Treasury',d:'The kingdom is profitable'},
  {lv:12,ic:'⛩️',n:'Temple',d:'Peace you built yourself'},
  {lv:15,ic:'🏰',n:'Castle',d:'The kingdom, reborn'},
  {lv:20,ic:'🌅',n:'New Horizon',d:'Beyond what you imagined'}
];
const TITLES=[[1,'Wanderer'],[2,'Squire'],[3,'Scout'],[4,'Knight'],[6,'Captain'],[8,'Steward'],[10,'Lord of the Keep'],[12,'Rebuilder'],[15,'Sovereign'],[20,'Legend']];
const ACH=[
  {id:'first',ic:'🌄',n:'First Light',d:'Check in for the first time'},
  {id:'focus1',ic:'🗡️',n:'Blade Drawn',d:'Finish a focus block'},
  {id:'focus10h',ic:'⚔️',n:'Ten Hours of Steel',d:'10 hours of focus total'},
  {id:'d3',ic:'🌤️',n:'Three Dawns',d:'Show up on 3 days'},
  {id:'d7',ic:'📅',n:'A Week of Return',d:'Show up on 7 days'},
  {id:'d30',ic:'🌕',n:'Moon Cycle',d:'Show up on 30 days'},
  {id:'comeback',ic:'🚪',n:'The Return',d:'Come back after a break'},
  {id:'main1',ic:'🗺️',n:'Map Opened',d:'First main quest step'},
  {id:'mainDone',ic:'👑',n:'Treasure Found',d:'Finish the main quest line'},
  {id:'why',ic:'❤️‍🔥',n:'Heart of the Kingdom',d:'Write your why'},
  {id:'shrink',ic:'🪓',n:'Giant Slayer',d:'Shrink a big task'},
  {id:'crit',ic:'⚡',n:'Critical Hit',d:'Land a lucky double XP'},
  {id:'honest',ic:'📖',n:'Honest Ledger',d:'Log play time on 7 days'},
  {id:'steady',ic:'⚖️',n:'Steady Hand',d:'3 days within play budget'},
  {id:'clear7',ic:'💧',n:'Clear Waters',d:'7 alcohol-free days logged'},
  {id:'lv5',ic:'🛡️',n:'Captain Rising',d:'Reach level 5'}
];

/* ============ UTIL ============ */
const $=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,'0');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function keyOf(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function dayKey(){return keyOf(new Date(Date.now()-4*3600e3))} // day rolls over at 4am, for night owls
function parseKey(k){const[y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)}
function diffDays(a,b){return Math.round((parseKey(b)-parseKey(a))/864e5)}
function addDays(k,n){const d=parseKey(k);d.setDate(d.getDate()+n);return keyOf(d)}
function fmtMin(m){m=Math.round(m);const neg=m<0;m=Math.abs(m);const h=Math.floor(m/60),r=m%60;return(neg?'-':'')+(h?h+'h'+(r?' '+r+'m':''):r+'m')}
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const pick=a=>a[Math.floor(Math.random()*a.length)];

