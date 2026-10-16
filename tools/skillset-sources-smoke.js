// Headless test of where a skill set comes from (docs/SKILL-SETS.md section 7; server/skillsets.js ssClearP): the roll of a world boss kill and of a dungeon win at +1 or above,
// the pity, the tiers, what you already own, the save, the trial dungeon (no sets). Server straight from src/, no build. Usage: node tools/skillset-sources-smoke.js
const {loadServer}=require('./load');
const inbox={}, evs=[];
const {api:W,x}=loadServer({dev:true,send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (inbox[pid]=inbox[pid]||[]).push(c); if(c.t==='snap'&&c.ev) evs.push(...c.ev); }},
  ['MONS','rewardKill','ssClearP','ssDungeonClearP','ssBossClearP','ssSanitizeSave','sanitizeGear','SS_SETS','SS_SOURCES','ssSetFor','ssOddsOf','ssSourceOf','ssPieceIdsOf','SS_CHANCE_BOSS','SS_PITY_BOSS','SS_CHANCE_DUNGEON','SS_PITY_DUNGEON','newGearFor']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=(n)=>{ for(let i=0;i<Math.max(n,3);i++) W.tick(0.05); };
const toasts=()=>evs.filter(e=>e[0]==='toast').map(e=>e[2]);
const rnd0=Math.random, roll=v=>{ Math.random=()=>v; };   // a forced roll: 0 always hits, 0.999 always misses
inbox.a=[]; W.join('a',{name:'Roller',look:{cls:'warrior'},save:{level:60}}); tick(3);
const p=W.players.get('a'), T=x.SS_SETS.tansy, run=th=>({theme:{id:th},tier:1});
const owns=(pos)=>x.ssPieceIdsOf('tansy',pos).every(id=>p.gear.skills.owned.includes(id));
const reset=()=>{ for(let pos=1;pos<=3;pos++) for(const id of x.ssPieceIdsOf('tansy',pos)){ const i=p.gear.skills.owned.indexOf(id); if(i>=0) p.gear.skills.owned.splice(i,1); } p.gear.ss={pity:{}}; evs.length=0; };

ok('the defaults: boss 10% with a sure drop at 20, dungeon 20% at 10; a set may override one position',x.SS_CHANCE_BOSS===0.10&&x.SS_PITY_BOSS===20&&x.SS_CHANCE_DUNGEON===0.20&&x.SS_PITY_DUNGEON===10&&x.ssOddsOf(T,1).chance===T.pos[1].from.chance&&T.pos[1].from.chance!==undefined);
ok('a source names its land and position: boss 1, boss 2, the dungeon; anything else (the trial dungeon, a dungeon boss) names none',JSON.stringify(x.ssSourceOf('boss'))==='{"land":"home","pos":1}'&&x.ssSourceOf('carapax').pos===2&&x.ssSourceOf('hollowroots').pos===3&&x.ssSourceOf('trial')===null&&x.ssSourceOf('amanita')===null&&x.ssSourceOf('constructor')===null);

// ---- a world boss kill, through rewardKill ----
const boss=x.MONS.find(m=>m.def.id==='boss');
const kill=(tier)=>{ p.gear.zt.home={on:tier,max:Math.max(tier,p.gear.zt.home.max)}; x.rewardKill(p,boss); tick(3); };
reset(); roll(0); kill(0);
ok('a +0 kill rolls nothing, however lucky: no piece, no pity',!owns(1)&&!owns(2)&&Object.keys(p.gear.ss.pity).length===0);
reset(); roll(0); kill(1);
ok('a +1 kill with a lucky roll gives the first piece of the land\'s set: the active (all class versions) and its passive, with an event',owns(1)&&!owns(2)&&evs.some(e=>e[0]==='ssget'&&e[1]==='a'&&e[2]==='tansy'&&e[3]===1)&&p.gear.ss.pity['tansy:1']===0);
roll(0); kill(1);
ok('a pair you own has nothing left to roll: no change, no toast',owns(1)&&p.gear.ss.pity['tansy:1']===0&&evs.filter(e=>e[0]==='ssget').length===1);
reset(); roll(0.999); kill(1);
ok('a miss counts a clear and says how far the sure drop is',!owns(1)&&p.gear.ss.pity['tansy:1']===1&&toasts().some(t=>/Tansy.*no drop this time, 1 of \d+ clears to a sure drop/.test(t)),toasts().filter(t=>/Tansy/.test(t))[0]);
{ const pity=x.ssOddsOf(T,1).pity; reset(); roll(0.999); for(let i=0;i<pity-1;i++) kill(1);
  const before=owns(1), n=p.gear.ss.pity['tansy:1']; kill(1);
  ok('the clear that reaches the pity is a sure drop even on the worst roll, and the count starts again',!before&&n===pity-1&&owns(1)&&p.gear.ss.pity['tansy:1']===0,'pity '+pity); }
reset(); roll(0); kill(4); { const S4=x.ssSetFor('home',4), ids=x.ssPieceIdsOf(S4.id,1);
  ok('a higher tier rolls the land\'s highest released set at or below it (a set with a higher tier replaces the +1 set from its tier on; nothing falls back to a lower one)',S4.tier<=4&&S4.tier>=T.tier&&ids.every(id=>p.gear.skills.owned.includes(id))&&x.ssSetFor('home',0)===null&&x.ssSetFor('home',1)===T,'+4 rolls '+S4.id+' (needs +'+S4.tier+')'); }
reset(); roll(0); p.gear.zt.hoar={on:1,max:1}; const va=x.MONS.find(m=>m.def.id==='ymrik'); x.rewardKill(p,va); tick(3);
ok('each boss rolls for its own land\'s set: Ymrik (the Reach) gives the Reach\'s first piece, not Wildwood\'s',x.SS_SETS.torgeir&&x.ssPieceIdsOf('torgeir',1).every(id=>p.gear.skills.owned.includes(id))&&!owns(1));

// ---- a dungeon win ----
reset(); roll(0); x.ssDungeonClearP(p,run('hollowroots')); tick(3);
ok('a won Hollow Roots run at +1 rolls the dungeon\'s piece (the third)',owns(3)&&!owns(1)&&evs.some(e=>e[0]==='ssget'&&e[2]==='tansy'&&e[3]===3));
reset(); roll(0.999); { const pity=x.ssOddsOf(T,3).pity; for(let i=0;i<pity-1;i++) x.ssDungeonClearP(p,run('hollowroots')); const n=p.gear.ss.pity['tansy:3'], had=owns(3); x.ssDungeonClearP(p,run('hollowroots'));
  ok('the dungeon has its own pity count, and the sure drop comes at its pity',!had&&n===pity-1&&owns(3)&&!owns(1)&&!owns(2),'pity '+pity); }
reset(); roll(0); x.ssDungeonClearP(p,{theme:{id:'hollowroots'},tier:0}); x.ssDungeonClearP(p,run('trial')); x.ssDungeonClearP(p,run('bare'));
ok('a +0 run, the trial dungeon and the test set roll nothing',!owns(1)&&!owns(2)&&!owns(3)&&Object.keys(p.gear.ss.pity).length===0);

// ---- the Sunscar and the Gloamhorn (version 3): two sets a land, told apart by the tier (+3 the first, +4 and above the second); the Gloamvault is registered by id even if its theme is not ----
{ const has=id=>x.ssPieceIdsOf(id,1).every(i=>p.gear.skills.owned.includes(i)), has3=id=>x.ssPieceIdsOf(id,3).every(i=>p.gear.skills.owned.includes(i)), clearAll=()=>{ for(const id of ['nephra','sabir','ogden','ottoline']) for(let pos=1;pos<=3;pos++) for(const i of x.ssPieceIdsOf(id,pos)){ const k=p.gear.skills.owned.indexOf(i); if(k>=0) p.gear.skills.owned.splice(k,1); } p.gear.ss={pity:{}}; evs.length=0; };
  clearAll(); roll(0); x.ssClearP(p,'glassguardian',3); x.ssClearP(p,'sandglass',3); x.ssClearP(p,'sandwyrm',2);
  ok('the Glass Guardian and the Sandglass at +3 roll Nephra (pieces 1 and 3); +2 rolls nothing',has('nephra')&&has3('nephra')&&!x.ssPieceIdsOf('nephra',2).some(i=>p.gear.skills.owned.includes(i)));
  clearAll(); roll(0); x.ssClearP(p,'sandwyrm',4); ok('the Sand Wyrm at +4 rolls Sabir\'s second piece, not Nephra\'s',x.ssPieceIdsOf('sabir',2).every(i=>p.gear.skills.owned.includes(i))&&!has('nephra'));
  clearAll(); roll(0); x.ssClearP(p,'drownedcaptain',3); x.ssClearP(p,'gloamvault',3);
  ok('Captain Dredge and the Gloamvault at +3 roll Ogden (named by id: the theme need not be registered)',has('ogden')&&has3('ogden'));
  clearAll(); roll(0); x.ssClearP(p,'gloamwarden',5); ok('the Gloam Warden at +5 rolls Ottoline\'s second piece',x.ssPieceIdsOf('ottoline',2).every(i=>p.gear.skills.owned.includes(i)));
  clearAll(); roll(0.999); { const pity=x.ssOddsOf(x.SS_SETS.sabir,3).pity; for(let i=0;i<pity-1;i++) x.ssClearP(p,'sandglass',4); const n=p.gear.ss.pity['sabir:3'], had=has3('sabir'); x.ssClearP(p,'sandglass',4);
    ok('the Sandglass at +4 has its own pity count for Sabir (dungeon rules: 20% / 10) and a sure drop at the pity',!had&&n===pity-1&&has3('sabir')&&pity===10,'pity '+pity); }
  clearAll(); const g=x.sanitizeGear({ss:{pity:{'sabir:1':3,'ottoline:2':5,'nephra:3':999}}},'warrior'); ok('the new sets\' pity counts are saved and clamped like any other',g.ss.pity['sabir:1']===3&&g.ss.pity['ottoline:2']===5&&g.ss.pity['nephra:3']===x.ssOddsOf(x.SS_SETS.nephra,3).pity-1); clearAll(); }

// ---- the save ----
{ const g=x.sanitizeGear({ss:{pity:{'tansy:1':3,'tansy:9':2,'nobody:1':2,'__proto__':5,'tansy:2':9999,'tansy:3':-4,'tansy:x':1}}},'warrior');
  ok('a save keeps the pity counts of real sets and positions, clamped below the sure drop, and nothing else',g.ss.pity['tansy:1']===3&&g.ss.pity['tansy:2']===x.ssOddsOf(T,2).pity-1&&g.ss.pity['tansy:3']===0&&Object.keys(g.ss.pity).length===3&&!Object.prototype.hasOwnProperty.call(g.ss.pity,'nobody:1'));
  ok('an old save (no field) and a garbage one get an empty count; a new account has one',JSON.stringify(x.sanitizeGear({},'warrior').ss)==='{"pity":{}}'&&JSON.stringify(x.sanitizeGear({ss:7},'warrior').ss)==='{"pity":{}}'&&JSON.stringify(x.newGearFor('mage').ss)==='{"pity":{}}'); }
Math.random=rnd0;
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
