// The Abyss, steps B0-B1 (shared/abyss.js, server/abyss.js), straight from src/, no build: the difficulty and round-level tables (against abyss-plan/PLAN.md section 0), the boss rounds,
// gear.ab cleaned field by field (prototype keys, NaN, negatives, huge numbers, strings), the flag (off: abyss{a:'open'} is silence), on at level 40: the info message, at level 39: a refusal,
// and the slot split (rifts 16-31, the Abyss 32-47). Step B2 (server/abyss/rounds.js): go / next / out, Fight rounds (3 waves, plain monsters at the round's level), a won difficulty opens the next,
// death, leaving and a pulled plug end the run, no XP or coins, the flag, the level gate, 16 runs at once and "full".
// Step B4 (server/abyss/arts.js, shared/abyss/artifacts-stat.js): the artifact registry, abArtStat, the stored offer (same after a reopen), pick / skip / drop and their refusals, the 20 cap and rank 5,
// next refused while an offer is pending, abP = 1 outside a run and after it, and the hooks: damage dealt, damage taken, max health, healing, lifesteal really change in a headless hit.
// Usage: node tools/abyss-smoke.js
const {loadServer}=require('./load');
const sent=[];
const {api:W,x}=loadServer({dev:false,log(){},send(to,m){ sent.push([to,JSON.parse(JSON.stringify(m))]); }},['AB_DIFFS','AB_INF','abRoundLv','abRounds','abBossRounds','abIsBossRound','abSwitch','abSanitize','abOnS','AB_ART_MAX','AB_RANK_MAX','AB_CURSE_MAX','AB_ENTRY_LV','AB_AS_MAX','AB_LOCK_MAX','AB_SLOT0','DG_MAX_INST','RIFT_SLOT0','sanitizeGear','DG_RUNS','DG_SLOT_RUN','killMonsterS','xpFor','abWaveSize','AB_WAVES','AB_RUN_KEEP_S','DG_EMPTY_S','dgCloseS','dgKOf','RIFT_DMG_K','abP','AB_ARTS','AB_ART_BAD','defineAbArt','abArtStat','AB_CAPS','rollDmgS','hurtP','healP','damageMonsterS','abDrawOfferS','AB_CURSES','AB_CURSE_BAD','defineAbCurse','abCurseStat','abIsCurse','abHitS','abKillP','abThornsS','abShieldS','abCurseAddP','abGiveArtP','abSpawnS','DEF_BY_ID','AB_NTH','monK','AB_TILES','AB_TILE_IDS','AB_TILE_BAD','defineAbTile','abTileOf','abLayout','dgBake','dgFlow','CAVE_FLOOR_DEFS','abRandTileS','AB_TILE_OFFER_N']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined?'  ('+i+')':'')); if(!c) fails++; };
const K=(id,s)=>x.AB_ARTS[id].k[s];   // the numbers are tuned by tools/abyss-sim.js: the tests read them from the rows
const J=JSON.stringify, tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
const noArtOffer=()=>{ const o=Dq.gear.ab.run.offer; return !o||o.k==='tile'; };   // B7: a resolved artifact offer is followed by the tile offer
const lvs=(d,n)=>Array.from({length:n},(_,i)=>x.abRoundLv(d,i+1));
// the tables
ok('six difficulties: I-V and Infinite',x.AB_DIFFS.length===6&&x.AB_INF===5&&x.AB_DIFFS[5].rounds===0);
ok('round counts 7 / 10 / 13 / 16 / 19',J(x.AB_DIFFS.slice(0,5).map(d=>d.rounds))==='[7,10,13,16,19]');
ok('difficulty I: 40, 43, 47, 50, 53, 57, 60',J(lvs(0,7))==='[40,43,47,50,53,57,60]',J(lvs(0,7)));
ok('every finite difficulty starts at lo and ends at hi',x.AB_DIFFS.slice(0,5).every((d,i)=>x.abRoundLv(i,1)===d.lo&&x.abRoundLv(i,d.rounds)===d.hi&&d.hi===d.lo+20+10*i));
ok('the last digit cycles 0, 3, 7 in every finite difficulty',x.AB_DIFFS.slice(0,5).every((d,i)=>lvs(i,d.rounds).every((l,r)=>l%10===[0,3,7][r%3])));
ok('Infinite: 90 at round 1, 180 at round 28',x.abRoundLv(5,1)===90&&x.abRoundLv(5,28)===180,x.abRoundLv(5,28));
ok('boss rounds: I [7], II [7,10], III [7,13], IV [7,13,16], V [7,13,19]',J([0,1,2,3,4].map(d=>x.abBossRounds(d)))==='[[7],[7,10],[7,13],[7,13,16],[7,13,19]]');
ok('Infinite boss rounds start 7, 13, 19, 25',J(x.abBossRounds(5).slice(0,4))==='[7,13,19,25]'&&[7,13,19,25,31,61].every(r=>x.abIsBossRound(5,r))&&![1,6,8,12,14,26].some(r=>x.abIsBossRound(5,r)));
ok('abIsBossRound agrees with abBossRounds for every finite round (none past the end)',[0,1,2,3,4].every(d=>{ const b=x.abBossRounds(d); for(let r=1;r<=30;r++) if(x.abIsBossRound(d,r)!==b.includes(r)) return false; return true; }));
ok('caps: 20 artifacts, rank 5, 5 curses, entry level 40',x.AB_ART_MAX===20&&x.AB_RANK_MAX===5&&x.AB_CURSE_MAX===5&&x.AB_ENTRY_LV===40);
ok('slots: the Abyss takes 32-47, the rifts 16-31',x.AB_SLOT0===32&&x.DG_MAX_INST===48&&x.RIFT_SLOT0===16);
// the save
const clean=(g)=>{ const o={}; x.abSanitize({ab:g},o); return o.ab; };
const D={top:0,best:0,clears:[0,0,0,0,0,0],as:0,lock:0,sh:{d:0,n:{}},run:null};
ok('no gear.ab (an old save): the default',J(clean(undefined))===J(D)&&J((()=>{ const o={}; x.abSanitize({},o); return o.ab; })())===J(D));
ok('garbage values: strings, NaN, negative, arrays, null give the default',[ 'x',7,null,[],{top:'a',best:NaN,clears:'no',as:-5,lock:'z',sh:'q',run:5},{top:-3,best:-1,clears:[-1,NaN,'x'],as:Infinity,lock:-Infinity,sh:{d:-4,n:[1,2]}} ].every(g=>{ const c=clean(g); return J(c)===J(D)||(c.top===0&&c.best===0&&c.as>=0&&c.lock>=0&&c.run===null&&c.clears.length===6); }));
{ const c=clean({top:9,best:99999999,clears:[1,2,3,4,5,6,7,8],as:1e15,lock:1e15,run:{d:1,r:2}}); ok('huge numbers are capped, clears keeps 6, a run is dropped',c.top===5&&c.best===999999&&c.clears.length===6&&c.as===x.AB_AS_MAX&&c.lock===x.AB_LOCK_MAX&&c.run===null,J(c)); }
{ const g=JSON.parse('{"sh":{"d":5,"n":{"__proto__":3,"constructor":2,"toString":1,"rsw":4,"rsa":-2,"x":"abc","y":1e9,"z":true}}}'), c=clean(g); ok('shop counts: prototype names and bad counts dropped, own ids clamped',J(c.sh)===J({d:5,n:{rsw:4,y:9999}})&&Object.getPrototypeOf(c.sh.n)===Object.prototype,J(c.sh)); }
ok('a clean save stays as it is',(()=>{ const g={top:3,best:21,clears:[4,3,2,0,0,0],as:500,lock:2,sh:{d:20000,n:{rsw:3}},run:null}; return J(clean(g))===J(g); })());
{ const o=x.sanitizeGear({ab:{top:2,as:-1}}); ok('sanitizeGear carries gear.ab (the hook)',o&&o.ab&&o.ab.top===2&&o.ab.as===0&&o.ab.clears.length===6); }
// the flag and the window
W.join('a',{name:'Alice',look:{cls:'warrior'},save:{level:40}}); W.join('b',{name:'Bob',look:{cls:'warrior'},save:{level:39}}); tick(2);
const A=W.players.get('a'), B=W.players.get('b'), abm=pid=>sent.filter(s=>s[0]===pid&&s[1].t==='abyss').map(s=>s[1]);
ok('the flag is off by default (and the deploy-like server has no dev tools)',x.abOnS()===false);
W.receive('a',{t:'abyss',a:'open'}); tick(2); ok('flag off: open is silence',abm('a').length===0);
x.abSwitch(true); ok('abSwitch(true) turns the flag on',x.abOnS()===true);
W.receive('a',{t:'abyss',a:'open'}); const inf=abm('a').pop();
ok('flag on, level 40: the info message',inf&&inf.a==='info'&&inf.on===1&&inf.top===0&&inf.best===0&&inf.lv===40&&inf.diffs.length===6&&inf.diffs[0].lo===40&&inf.diffs[4].rounds===19&&inf.diffs[5].rounds===0,J(inf));
A.gear.ab.top=2; A.gear.ab.best=17; W.receive('a',{t:'abyss',a:'open'}); const inf2=abm('a').pop(); ok('the info carries the save (top, best)',inf2&&inf2.top===2&&inf2.best===17);
sent.length=0; W.receive('b',{t:'abyss',a:'open'}); tick(2);
ok('level 39: no info, a refusal toast',abm('b').length===0&&sent.some(s=>s[1].t==='snap'&&(s[1].ev||[]).some(e=>e&&e[0]==='toast'&&e[1]==='b'&&/level 40/.test(e[2]))),sent.length);
ok('garbage messages do nothing and do not throw',(()=>{ try{ for(const m of [{t:'abyss'},{t:'abyss',a:'constructor'},{t:'abyss',a:7},{t:'abyss',a:null}]) W.receive('a',m); return abm('a').length===0; }catch(e){ return false; } })());
x.abSwitch(false); sent.length=0; W.receive('a',{t:'abyss',a:'open'}); ok('switched off again: silence',abm('a').length===0);

// B3: the client learns the flag from one field of the welcome
{ const wel=pid=>sent.filter(q=>q[0]===pid&&q[1].t==='welcome').map(q=>q[1]).pop(); x.abSwitch(false); W.join('wf',{name:'Wf',look:{cls:'warrior'},save:{level:40}}); tick(1); const off=wel('wf'); x.abSwitch(true); W.join('wn',{name:'Wn',look:{cls:'warrior'},save:{level:40}}); tick(1); const on=wel('wn');
  ok('the welcome carries ab:1 when the flag is on and nothing when it is off',off&&on&&off.ab===undefined&&on.ab===1,J(off&&off.ab)+' '+J(on&&on.ab)); W.leave('wf'); W.leave('wn'); }
// ---- B2: the run
x.abSwitch(true);
ok('a saved run is kept while valid and young, dropped when old, malformed or past the last round',(()=>{ const now=Date.now(), c=r=>clean({run:r}).run;
  const g=c({d:1,r:3,at:now-1000}); return g&&g.d===1&&g.r===3&&c({d:1,r:3,at:now-(x.AB_RUN_KEEP_S+5)*1000})===null&&c({d:0,r:8,at:now})===null&&c({d:9,r:1,at:now})===null&&c({d:'x',r:1,at:now})===null&&c({d:0,r:1})===null&&c('q')===null&&c({d:0,r:1,at:now+1e9}).at<=Date.now(); })());
const evs=(pid,k)=>sent.filter(s=>s[1].t==='snap').flatMap(s=>s[1].ev||[]).filter(e=>e&&e[0]===k&&e[1]===pid);
const mk=(id,lv)=>{ W.join(id,{name:'P'+id,look:{cls:'warrior'},save:{level:lv}}); tick(2); const q=W.players.get(id); q.vbGrace=1e12; return q; };
const runOf=q=>x.DG_RUNS.get(q.inst), live=run=>[...run.mons].filter(m=>!m.dead&&!m.remove);
const upto=(run,n)=>{ for(let i=0;i<n&&!run.endT&&!run.abWon;i++){ for(const m of live(run)){ m.hp=0; x.killMonsterS(m,run.members.size?[...run.members.values()][0].p:null); } tick(10); } };
const C=mk('c',60); C.gear.ab.top=0; C.dead=false;
const xp0=()=>C.exp+C.level*1e9;
// flag off: go does nothing
x.abSwitch(false); W.receive('c',{t:'abyss',a:'go',d:0}); tick(2); ok('flag off: go does nothing',!C.inst); x.abSwitch(true);
ok('level 39 is refused',(()=>{ W.receive('b',{t:'abyss',a:'go',d:0}); tick(2); return !B.inst; })());
for(const bad of [1,-1,6,0.5,'0',null,undefined,{}]){ W.receive('c',{t:'abyss',a:'go',d:bad}); }
ok('a difficulty that is not unlocked (d > top) or not an integer starts nothing',!C.inst&&x.DG_RUNS.size===0);
// round 1 of difficulty I
{ const e0=xp0(), c0=C.gear.coins; sent.length=0; W.receive('c',{t:'abyss',a:'go',d:0}); tick(2);
  const run=runOf(C); ok('go d=0: a run in an Abyss slot, solo, at the round level 40',!!run&&run.ab&&run.slot>=x.AB_SLOT0&&run.slot<x.DG_MAX_INST&&run.L===40&&run.members.size===1&&run.mission==='abyss'&&run.abR===1,run&&run.slot);
  ok('the save keeps {d,r,at} while the run is on',C.gear.ab.run&&C.gear.ab.run.d===0&&C.gear.ab.run.r===1&&C.gear.ab.run.at>0);
  ok('abr [pid, 1, 7, 40]',evs('c','abr').some(e=>e[2]===1&&e[3]===7&&e[4]===40),J(evs('c','abr')));
  ok('the tp tells the client to build it: mission abyss, the rift theme',(()=>{ const tp=sent.filter(s=>s[0]==='c'&&s[1].t==='tp').pop(); return tp&&tp[1].dg&&tp[1].dg.m==='abyss'&&tp[1].dg.th==='shardmere'; })());
  tick(Math.ceil(20/0.05)); C.hp=C.maxHp;
  ok('wave 1: monsters at level 40 with plain numbers (no brittle K)',live(run).length>0&&live(run).every(m=>m.dgK.lv===40&&Math.abs(m.dgK.dmg-x.dgKOf(m.def,40).dmg)<1e-9&&x.RIFT_DMG_K<1),live(run).length);
  ok('wave 1 has the planned size',run.k.w===1&&run.k.size===x.abWaveSize(1,1),run.k.w);
  for(let i=0;i<400&&!run.abWon;i++){ for(const m of live(run)){ m.hp=0; x.killMonsterS(m,C); } tick(10); C.hp=C.maxHp; C.dead=false; }
  ok('the round is won when its waves are dead (3 waves)',run.abWon&&run.k.w===x.AB_WAVES&&!run.endT&&C.inst===run.id,run.k.w);
  ok('kills paid no XP and no coins',xp0()===e0&&C.gear.coins===c0&&run.members.values().next().value.got.xp===0);
  // next: round 2 at level 43, in a fresh run object
  sent.length=0; W.receive('c',{t:'abyss',a:'skip'}); W.receive('c',{t:'abyss',a:'next',i:0}); tick(2); const r2=runOf(C);
  ok('next: round 2 at level 43 in a fresh run object',r2&&r2!==run&&r2.abR===2&&r2.L===43&&!x.DG_RUNS.has(run.id)&&C.gear.ab.run.r===2,r2&&r2.L);
  ok('abr [pid, 2, 7, 43]',evs('c','abr').some(e=>e[2]===2&&e[4]===43));
  // out mid-round is refused; next mid-round does nothing
  W.receive('c',{t:'abyss',a:'out'}); W.receive('c',{t:'abyss',a:'skip'}); W.receive('c',{t:'abyss',a:'next',i:0}); tick(1); ok('out / next in the middle of a round do nothing',runOf(C)===r2&&r2.abR===2);
  upto(r2,400); ok('round 2 won',r2.abWon);
  // out between rounds
  const co=C.gear.coins; W.receive('c',{t:'abyss',a:'out'}); tick(2);
  ok('out between rounds: back in the world, the run gone, gear.ab.run null, nothing lost',!C.inst&&!x.DG_RUNS.has(r2.id)&&C.gear.ab.run===null&&x.DG_SLOT_RUN.slice(32).every(v=>!v)&&C.gear.coins===co&&C.gear.ab.top===0);
}
// a whole difficulty I: 7 rounds, levels 40 43 47 50 53 57 60, the top opens, a clear counts
{ W.receive('c',{t:'abyss',a:'go',d:0}); tick(2); const lv=[]; let run=runOf(C);
  for(let r=1;r<=7;r++){ run=runOf(C); lv.push(run.L); upto(run,600); if(r<7){ W.receive('c',{t:'abyss',a:'skip'}); W.receive('c',{t:'abyss',a:'next',i:0}); tick(2); } }
  ok('seven rounds at 40, 43, 47, 50, 53, 57, 60',J(lv)==='[40,43,47,50,53,57,60]',J(lv));
  ok('the last round wins the run: top 1, clears[0] 1, the run is closing (dge won sent), gear.ab.run null',C.gear.ab.top===1&&C.gear.ab.clears[0]===1&&C.gear.ab.run===null&&run.endT>0&&run.abR===7,J(C.gear.ab));
  W.receive('c',{t:'abyss',a:'skip'}); W.receive('c',{t:'abyss',a:'next',i:0}); tick(1); ok('next after the last round does nothing',runOf(C)===run);
  tick(Math.ceil(25/0.05)); C.hp=C.maxHp; ok('the won run closes by itself and puts the hiker back',!C.inst&&!x.DG_RUNS.has(run.id)); }
ok('difficulty II is open now, III is not',(()=>{ W.receive('c',{t:'abyss',a:'go',d:2}); tick(1); const no=!C.inst; W.receive('c',{t:'abyss',a:'go',d:1}); tick(2); const yes=!!C.inst&&runOf(C).L===50; return no&&yes; })());
// death mid-round ends the run
{ const run=runOf(C); tick(Math.ceil(10/0.05)); const hp0=C.gear.coins; C.hp=0; C.dead=true; C.deadT=0; tick(Math.ceil(4/0.05));
  ok('death ends the run: kicked out, run closed, save cleared, nothing lost',!C.inst&&!x.DG_RUNS.has(run.id)&&C.gear.ab.run===null&&!C.dead&&C.gear.coins===hp0&&C.gear.ab.top===1); }
// dg leave mid-round = death
{ W.receive('c',{t:'abyss',a:'go',d:0}); tick(2); const run=runOf(C); tick(Math.ceil(10/0.05)); C.hp=C.maxHp; W.receive('c',{t:'dg',a:'leave'}); tick(2);
  ok('leaving mid-round ends the run',!C.inst&&!x.DG_RUNS.has(run.id)&&C.gear.ab.run===null); }
// leaving between rounds is "out"
{ W.receive('c',{t:'abyss',a:'go',d:0}); tick(2); const run=runOf(C); upto(run,600); ok('(round won)',run.abWon); W.receive('c',{t:'dg',a:'leave'}); tick(2); ok('dg leave between rounds: out, nothing lost',!C.inst&&C.gear.ab.run===null); }
// a pulled plug: the run's empty close ends it
{ W.receive('c',{t:'abyss',a:'go',d:0}); tick(2); const run=runOf(C), id=run.id; tick(Math.ceil(5/0.05)); W.leave('c'); tick(Math.ceil((x.DG_EMPTY_S+3)/0.05));
  ok('a disconnect: the run closes after DG_EMPTY_S and the slot is free',!x.DG_RUNS.has(id)&&x.DG_SLOT_RUN.slice(32).every(v=>!v)); }
// a restored run with no live instance is ended cleanly, never resumed
{ const C2=mk('c2',60); C2.gear.ab.run={d:0,r:3,at:Date.now()}; W.receive('c2',{t:'abyss',a:'open'}); tick(1); ok('a saved run without a live instance is cleared by the next message',C2.gear.ab.run===null&&!C2.inst); W.leave('c2'); }
// refusals: dead, in a dungeon
{ const C3=mk('c3',60); C3.dead=true; W.receive('c3',{t:'abyss',a:'go',d:0}); ok('a dead hiker cannot go in',!C3.inst); C3.dead=false; C3.hp=C3.maxHp; W.leave('c3'); }
// 16 at once, the 17th is told it is full, a free slot is reused
{ const ids=[]; for(let i=0;i<17;i++){ const q=mk('m'+i,60); ids.push(q); }
  sent.length=0; for(let i=0;i<16;i++) W.receive('m'+i,{t:'abyss',a:'go',d:0}); tick(2);
  ok('16 runs at once: slots 32-47, all different',ids.slice(0,16).every(q=>q.inst)&&new Set(ids.slice(0,16).map(q=>runOf(q).slot)).size===16&&ids.slice(0,16).every(q=>runOf(q).slot>=32));
  sent.length=0; W.receive('m16',{t:'abyss',a:'go',d:0}); tick(2);
  ok('the 17th: "the Abyss is full" and not in a run',!ids[16].inst&&sent.some(s=>s[1].t==='snap'&&(s[1].ev||[]).some(e=>e&&e[0]==='toast'&&e[1]==='m16'&&/Abyss is full/.test(e[2]))));
  ok('a rift never takes an Abyss slot (and the reverse): none of the 16 is in a rift slot',ids.slice(0,16).every(q=>runOf(q).slot>=x.AB_SLOT0));
  // a round change with every slot taken still works (the old slot is reused)
  const q=ids[0], run=runOf(q); for(const m of live(run)){ m.hp=0; } run.abWon=true; run.phase='won'; W.receive('m0',{t:'abyss',a:'skip'}); W.receive('m0',{t:'abyss',a:'next',i:0}); tick(2);
  ok('with 16 runs, next still works (its own slot is reused)',runOf(q)&&runOf(q).abR===2&&runOf(q).slot>=32);
  for(const q2 of ids) if(q2.inst) W.receive(q2.id,{t:'dg',a:'leave'}); tick(2); ok('all left: every Abyss slot is free again',x.DG_SLOT_RUN.slice(32).every(v=>!v)); }

// ---- B4: artifacts
{ const N=Object.keys(x.AB_ARTS).length;
  ok('the registry: 12 stat artifacts (B4) beside the combat and wild ones (B6), none left out, every row has factors',Object.values(x.AB_ARTS).filter(a=>a.fam==='stat').length===12&&x.AB_ART_BAD.length===0&&Object.values(x.AB_ARTS).every(a=>Object.keys(a.k).length&&a.text&&a.icon),N+' '+J(x.AB_ART_BAD));
  const bads=[null,{id:'__proto__',name:'x',fam:'stat',rar:'common',icon:'a',k:{atk:2},text:'t'},{id:'ab_edge',name:'dup',fam:'stat',rar:'common',icon:'a',k:{atk:2},text:'t'},{id:'ab_zz1',name:'x',fam:'stat',rar:'mythic',icon:'a',k:{atk:2},text:'t'},
    {id:'ab_zz2',name:'x',fam:'stat',rar:'rare',icon:'a',k:{luck:2},text:'t'},{id:'ab_zz3',name:'x',fam:'stat',rar:'rare',icon:'a',k:{atk:NaN},text:'t'},{id:'ab_zz4',name:'x',fam:'stat',rar:'rare',icon:'a',k:{crit:5},text:'t'},{id:'ab_zz5',name:'x',fam:'stat',rar:'rare',icon:'a',k:{},text:'t'}];
  for(const b of bads) x.defineAbArt(b);
  ok('bad rows are left out and listed in AB_ART_BAD',Object.keys(x.AB_ARTS).length===N&&x.AB_ART_BAD.length===bads.length&&Object.getPrototypeOf(x.AB_ARTS)===null,x.AB_ART_BAD.length); x.AB_ART_BAD.length=0;
  const st=(a,s)=>x.abArtStat(a,s);
  ok('abArtStat: copies multiply (Honed Edge twice and Ravener\'s Fang once), an empty bar is 1 / 0',Math.abs(st(['ab_edge','ab_fang','ab_edge'],'atk')-K('ab_edge','atk')*K('ab_edge','atk')*K('ab_fang','atk'))<1e-9&&st([],'atk')===1&&st([],'crit')===0&&Math.abs(st(['ab_scale','ab_scale'],'def')-K('ab_scale','def')**2)<1e-9);
  ok('five copies of Honed Edge multiply (rank 5); rate stats add up and stop at their cap',Math.abs(st(Array(5).fill('ab_edge'),'atk')-Math.pow(K('ab_edge','atk'),5))<1e-9&&Math.abs(st(['ab_eye','ab_eye'],'crit')-0.10)<1e-9&&st(Array(20).fill('ab_eye'),'crit')===x.AB_CAPS.crit&&st(Array(20).fill('ab_wraps'),'aspd')===x.AB_CAPS.aspd);
  ok('a bar of garbage ids is neutral',st(['__proto__','constructor','nope',7,null],'atk')===1); }
{ const o=x.sanitizeGear({ab:{top:1,run:{d:0,r:2,at:Date.now(),arts:['ab_edge','__proto__','constructor','nope',7,null,{},'ab_edge',...Array(10).fill('ab_heart'),...Array(10).fill('ab_fang'),...Array(10).fill('ab_scale'),...Array(10).fill('ab_thread')],curses:['x','y'],offer:{k:'art',o:['ab_fang','__proto__','ab_fang','ab_eye','ab_wraps','ab_glass']}}}}).ab.run;
  ok('a saved run keeps own-property ids only, at most 20 and 5 of one, curses cleaned, an offer of at most 3 different ids',o&&o.arts.length===x.AB_ART_MAX&&o.arts.every(id=>x.AB_ARTS[id])&&o.arts.filter(i=>i==='ab_heart').length===5&&o.arts.filter(i=>i==='ab_edge').length===2&&J(o.curses)==='[]'&&J(o.offer)===J({k:'art',o:['ab_fang','ab_eye','ab_wraps']}),J(o));
  ok('a bad offer or bar is dropped',(()=>{ const c=clean({run:{d:0,r:2,at:Date.now(),arts:'x',offer:{k:'tile',o:['ab_edge']}}}).run; const c2=clean({run:{d:0,r:2,at:Date.now(),offer:{k:'art',o:['zz']}}}).run; return c.arts.length===0&&c.offer===null&&c2.offer===null; })()); }
const Dq=mk('d',60); Dq.gear.ab.top=0; 
// outside a run abP is neutral, even with a bar written into the save
Dq.gear.ab.run={d:0,r:2,at:Date.now(),arts:['ab_edge','ab_heart','ab_eye'],curses:[],offer:null};
ok('abP is 1 (0 for a rate stat) outside a live run, whatever the save says',x.AB_ARTS&&x.abP(Dq,'atk')===1&&x.abP(Dq,'hp')===1&&x.abP(Dq,'crit')===0&&x.abP(Dq,'lifesteal')===0); Dq.gear.ab.run=null;
const maxHp0=Dq.maxHp; W.receive('d',{t:'abyss',a:'go',d:0}); tick(2); let rD=runOf(Dq);
ok('in a run with an empty bar abP is still neutral; a fresh run has an empty bar and no offer',!!rD&&x.abP(Dq,'atk')===1&&J(Dq.gear.ab.run.arts)==='[]'&&Dq.gear.ab.run.offer===null&&Dq.maxHp===maxHp0);
for(const m of ['ab_edge']) { W.receive('d',{t:'abyss',a:'pick',i:0}); W.receive('d',{t:'abyss',a:'drop',i:0}); }
ok('pick / drop with no offer or mid-round do nothing',J(Dq.gear.ab.run.arts)==='[]');
// win round 1: the offer is drawn, stored, then sent
sent.length=0; upto(rD,600); ok('(round 1 won)',rD.abWon);
const off1=Dq.gear.ab.run.offer, abo1=evs('d','abo').pop();
ok('a won round stores an offer of 3 different artifacts (k art) and sends abo [pid, art, ids] with the same ids',off1&&off1.k==='art'&&off1.o.length===3&&new Set(off1.o).size===3&&off1.o.every(id=>x.AB_ARTS[id])&&abo1&&abo1[2]==='art'&&J(abo1[3])===J(off1.o),J(off1)+' '+J(abo1));
ok('the offer is in the stored save before it is sent: the `you` message carries it and only the bar, curses and offer beside d, r, at',(()=>{ const y=sent.filter(q=>q[0]==='d'&&q[1].t==='you').pop(); const r=y&&y[1].gear.ab.run; return !!r&&J(Object.keys(r).sort())===J(['arts','at','curses','d','offer','r']); })());
sent.length=0; W.receive('d',{t:'abyss',a:'open'}); tick(1); const abo2=evs('d','abo').pop();
ok('reopening during the run shows the same offer again',abo2&&J(abo2[3])===J(off1.o)&&J(Dq.gear.ab.run.offer)===J(off1),J(abo2));
W.receive('d',{t:'abyss',a:'next',i:0}); tick(1); ok('next is refused while an offer is pending',runOf(Dq)===rD&&rD.abWon&&Dq.gear.ab.run.r===1);
for(const bad of [3,-1,1.5,'0','__proto__','constructor',null,undefined,{},[0],NaN,Infinity,true]) W.receive('d',{t:'abyss',a:'pick',i:bad});
ok('pick with a bad index, string, __proto__ or object is refused: nothing taken, the offer stays',J(Dq.gear.ab.run.arts)==='[]'&&J(Dq.gear.ab.run.offer)===J(off1));
const setOffer=o=>{ Dq.gear.ab.run.offer={k:'art',o}; }, arts=()=>Dq.gear.ab.run.arts;
setOffer(['ab_edge','ab_fang','ab_heart']); sent.length=0; W.receive('d',{t:'abyss',a:'pick',i:0}); tick(1);
ok('pick 0 adds the copy, clears the offer and sends aba [pid, id, 1]',J(arts())==='["ab_edge"]'&&noArtOffer()&&evs('d','aba').some(e=>e[2]==='ab_edge'&&e[3]===1));
ok('abP now multiplies: Honed Edge\'s damage',Math.abs(x.abP(Dq,'atk')-K('ab_edge','atk'))<1e-9);
W.receive('d',{t:'abyss',a:'pick',i:0}); ok('a pick with no offer does nothing',arts().length===1);
setOffer(['ab_edge','ab_fang','ab_heart']); W.receive('d',{t:'abyss',a:'pick',i:0}); setOffer(['ab_fang','ab_heart','ab_eye']); W.receive('d',{t:'abyss',a:'pick',i:0});
ok('two copies of one and one other: the factors multiply',J(arts())==='["ab_edge","ab_edge","ab_fang"]'&&Math.abs(x.abP(Dq,'atk')-K('ab_edge','atk')**2*K('ab_fang','atk'))<1e-9,x.abP(Dq,'atk'));
// skip
setOffer(['ab_heart','ab_eye','ab_glass']); W.receive('d',{t:'abyss',a:'skip'}); ok('skip clears the offer and takes nothing',noArtOffer()&&arts().length===3);
// max health follows the bar at once
setOffer(['ab_heart','ab_eye','ab_glass']); const hpBefore=Dq.maxHp; W.receive('d',{t:'abyss',a:'pick',i:0});
ok('max health x Heartwood Knot, applied at once (the bar already holds none: abP hp is its factor)',Math.abs(Dq.maxHp/hpBefore-K('ab_heart','hp'))<0.01&&Math.abs(x.abP(Dq,'hp')-K('ab_heart','hp'))<1e-9,Dq.maxHp+' / '+hpBefore);
// rank 5: a sixth copy of one is refused
for(let i=0;i<3;i++){ setOffer(['ab_edge','ab_fang','ab_eye']); W.receive('d',{t:'abyss',a:'pick',i:0}); }
ok('five copies of one artifact (rank 5)',arts().filter(i=>i==='ab_edge').length===5&&arts().length===7);
setOffer(['ab_edge','ab_fang','ab_eye']); W.receive('d',{t:'abyss',a:'pick',i:0}); ok('a sixth copy is refused (rank 5 is the most)',arts().filter(i=>i==='ab_edge').length===5&&Dq.gear.ab.run.offer!==null);
ok('the drawn offers never include an artifact held 5 times, and are 3 different ids',Array.from({length:300},()=>x.abDrawOfferS(arts())).every(o=>o.length===3&&new Set(o).size===3&&!o.includes('ab_edge')));
// the cap of 20
const fill=['ab_fang','ab_heart','ab_scale','ab_thread'];
for(let i=0;arts().length<20;i++){ setOffer([fill[(i>>2)%4],'ab_eye','ab_glass']); W.receive('d',{t:'abyss',a:'pick',i:0}); }
tick(2); ok('the bar fills to 20 (every copy takes a place)',arts().length===20,J(arts()));
setOffer(['ab_heart','ab_eye','ab_glass']); sent.length=0; W.receive('d',{t:'abyss',a:'pick',i:1}); tick(4);
ok('a 21st is refused with "throw one away first": the bar stays 20, the offer stays, no aba',arts().length===20&&Dq.gear.ab.run.offer!==null&&!evs('d','aba').length&&sent.some(s=>s[1].t==='snap'&&(s[1].ev||[]).some(e=>e&&e[0]==='toast'&&e[1]==='d'&&/throw one away/.test(e[2]))));
// drop between rounds, then the pick goes through
for(const bad of [20,-1,1.5,'0','__proto__',null,undefined,{},NaN]) W.receive('d',{t:'abyss',a:'drop',i:bad});
ok('drop with a bad index does nothing',arts().length===20);
const gone=arts()[19]; sent.length=0; W.receive('d',{t:'abyss',a:'drop',i:19}); W.receive('d',{t:'abyss',a:'pick',i:1}); tick(4);
ok('drop 19 then pick: 20 again, the thrown id sent as aba with its copies, the pick went through',arts().length===20&&arts()[19]==='ab_eye'&&noArtOffer()&&evs('d','aba').length===2&&evs('d','aba')[0][2]===gone,J(evs('d','aba')));
// the real effect of the bar in a hit: damage dealt, damage taken, healing, lifesteal
arts().length=0; Dq.ab=null;
W.receive('d',{t:'abyss',a:'next',i:0}); tick(Math.ceil(5/0.05)); rD=runOf(Dq); const mm=live(rD)[0];
ok('(round 2 on, a monster to hit)',!!mm&&rD.abR===2);
{ const R0=Math.random; Math.random=()=>0.5; try{
    const dmg=()=>x.rollDmgS(Dq,1,mm,null).v, v0=dmg(); arts().push('ab_edge','ab_edge','ab_fang'); const v1=dmg();
    ok('damage dealt: the same hit does the bar\'s factor more (rollDmgS)',Math.abs(v1/v0-K('ab_edge','atk')**2*K('ab_fang','atk'))<0.02*K('ab_edge','atk')**2*K('ab_fang','atk'),v0+' -> '+v1);
    arts().length=0; arts().push('ab_scale','ab_scale'); Dq.vbGrace=0; Dq.hp=Dq.maxHp; const h0=x.hurtP(Dq,50,mm); Dq.hp=Dq.maxHp; arts().length=0; const h1=x.hurtP(Dq,50,mm); Dq.vbGrace=1e12;
    ok('damage taken: the same hit does the factor of two Slate Scales (hurtP)',h1>20&&Math.abs(h0/h1-K('ab_scale','def')**2)<0.03,h1+' -> '+h0);
    arts().length=0; arts().push('ab_thread'); Dq.hp=1; x.healP(Dq,100); const g1=Dq.hp-1; arts().length=0; Dq.hp=1; x.healP(Dq,100); const g0=Dq.hp-1;
    ok('healing received x Mender\'s Thread (healP)',g0===100&&g1===Math.round(100*K('ab_thread','heal')),g0+' -> '+g1);
    arts().length=0; for(let i=0;i<10;i++) arts().push('ab_leech'); mm.hp=1e9; Dq.hp=1; const dd=x.damageMonsterS(mm,1,Dq,mm.x+3,mm.z); const gain=Dq.hp-1;
    ok('lifesteal: ten Leech Charms heal their sum, at the cap, of the damage dealt',dd>0&&Math.abs(gain-Math.min(x.AB_CAPS.lifesteal,10*K('ab_leech','lifesteal'))*dd)<=1.5,dd+' -> '+gain);
  } finally { Math.random=R0; } arts().length=0; Dq.vbGrace=1e12; }
// drop in the middle of a round is refused
arts().push('ab_edge','ab_edge'); W.receive('d',{t:'abyss',a:'drop',i:0}); ok('drop in the middle of a round is refused',arts().length===2);
ok('cooldown, attack speed and crit come from the bar too (rate stats)',(()=>{ arts().length=0; arts().push('ab_glass','ab_glass','ab_wraps','ab_eye'); const o=Math.abs(x.abP(Dq,'cdr')-0.12)<1e-9&&Math.abs(x.abP(Dq,'aspd')-0.08)<1e-9&&Math.abs(x.abP(Dq,'crit')-0.05)<1e-9; arts().length=0; return o; })());
// the bar travels to the next round, and ends with the run
upto(rD,600); arts().push('ab_heart','ab_heart'); Dq.ab=null; W.receive('d',{t:'abyss',a:'skip'}); W.receive('d',{t:'abyss',a:'next',i:0}); tick(2); const rD3=runOf(Dq);
ok('the bar goes on to the next round (3 rounds, the same copies)',rD3&&rD3.abR===3&&J(arts())==='["ab_heart","ab_heart"]'&&Math.abs(x.abP(Dq,'hp')-K('ab_heart','hp')**2)<1e-9);
W.receive('d',{t:'dg',a:'leave'}); tick(2);
ok('the run ends: the bar is gone, abP is 1, max health is back',!Dq.inst&&Dq.gear.ab.run===null&&x.abP(Dq,'hp')===1&&x.abP(Dq,'atk')===1&&Math.abs(Dq.maxHp-maxHp0)<=1,Dq.maxHp+' vs '+maxHp0);
W.receive('d',{t:'abyss',a:'go',d:0}); tick(2); ok('a new run starts with an empty bar',J(Dq.gear.ab.run.arts)==='[]'&&Dq.gear.ab.run.offer===null); W.receive('d',{t:'dg',a:'leave'}); tick(2);
// the Abyss with the flag off: pick / skip / drop are silence


// ---- B6: combat artifacts, wildcards, curses
{ const arts6=Object.values(x.AB_ARTS), fam=f=>arts6.filter(a=>a.fam===f), curses=Object.values(x.AB_CURSES);
  ok('the registry: ten combat artifacts, eight wildcards (each with its minus text), ten curses, no bad row',fam('combat').length===10&&fam('wild').length===8&&fam('wild').every(a=>a.minus&&a.minus.length)&&curses.length===10&&x.AB_ART_BAD.length===0&&x.AB_CURSE_BAD.length===0,x.AB_ART_BAD.length+' '+x.AB_CURSE_BAD.length);
  const isMinus=([st,v])=>st==='def'?v>1:(st==='atk'||st==='hp'||st==='heal')&&v<1, isPlus=([st,v])=>st==='def'?v<1:(st==='atk'||st==='hp'||st==='heal')?v>1:true;
  ok('every wildcard has a real plus and a real minus (a factor below 1 on damage / health / healing, or damage taken above 1)',fam('wild').every(a=>Object.entries(a.k).some(isMinus)&&Object.entries(a.k).some(isPlus)),fam('wild').filter(a=>!Object.entries(a.k).some(isMinus)).map(a=>a.id).join());
  const nBad=x.AB_CURSE_BAD.length; for(const b of [null,{id:'ab_c_x1',name:'x',icon:'a',k:{luck:2},text:'t'},{id:'nope',name:'x',icon:'a',k:{mhp:2},text:'t'},{id:'ab_c_hides',name:'dup',icon:'a',k:{mhp:2},text:'t'},{id:'ab_c_x2',name:'x',icon:'a',k:{mhp:NaN},text:'t'},{id:'ab_c_x3',name:'x',icon:'a',k:{},text:'t'}]) x.defineAbCurse(b);
  ok('a bad curse row is left out and listed',Object.keys(x.AB_CURSES).length===10&&x.AB_CURSE_BAD.length===nBad+6&&Object.getPrototypeOf(x.AB_CURSES)===null); x.AB_CURSE_BAD.length=0;
  x.defineAbArt({id:'ab_zw',name:'x',fam:'wild',rar:'rare',icon:'a',k:{atk:2},text:'t'}); ok('a wildcard row without its minus is left out',!x.AB_ARTS.ab_zw&&x.AB_ART_BAD.pop().why.includes('minus')); }
// a clean saved run keeps own-property curse ids only, at most 5
{ const c=clean({run:{d:0,r:2,at:Date.now(),arts:[],curses:['ab_c_hides','__proto__','constructor','nope',7,null,{},'ab_c_famine','ab_c_hides','ab_c_hides','ab_c_hides','ab_c_hides','ab_c_hides'],offer:null}}).run;
  ok('abSanitize drops unknown curse ids (prototype names, numbers, objects) and keeps at most 5',c&&J(c.curses)==='["ab_c_hides","ab_c_famine","ab_c_hides","ab_c_hides","ab_c_hides"]'&&clean({run:{d:0,r:2,at:Date.now(),curses:'x'}}).run.curses.length===0,J(c&&c.curses)); }
W.receive('d',{t:'abyss',a:'go',d:0}); tick(Math.ceil(5/0.05)); rD=runOf(Dq); const A6=()=>Dq.gear.ab.run.arts, C6=()=>Dq.gear.ab.run.curses; Dq.ab=null;
{ const mm6=live(rD)[0]; mm6.maxHp=1000; mm6.hp=1000;
  // every 5th hit, boss damage, execute
  A6().push('ab_echo'); Dq.ab=null; Dq.abHits=0; const hits=[1,2,3,4,5,6,7,8,9,10].map(()=>x.abHitS(Dq,mm6,100));
  ok('Echoing Strike: every 5th hit deals more (hits 5 and 10), the others are plain',hits.filter(v=>v===100).length===8&&hits[4]===Math.round(100*K('ab_echo','nth'))&&hits[9]===hits[4],J(hits));
  A6().length=0; A6().push('ab_exec'); Dq.ab=null; Dq.abHits=1; mm6.hp=500; const e1=x.abHitS(Dq,mm6,100); mm6.hp=150; const e2=x.abHitS(Dq,mm6,100); mm6.hp=1000;
  ok('Executioner: only a monster under 20% health takes more',e1===100&&e2===Math.round(100*K('ab_exec','exec')),e1+' '+e2);
  A6().length=0; A6().push('ab_bane'); Dq.ab=null; const b0=x.abHitS(Dq,mm6,100); mm6.boss=true; const b1=x.abHitS(Dq,mm6,100); mm6.boss=false; ok('Titanbane: only bosses take more',b0===100&&b1===Math.round(100*K('ab_bane','boss')),b0+' '+b1);
  // kills heal, the round-start shield, thorns
  A6().length=0; A6().push('ab_bloodletter','ab_bloodletter'); Dq.ab=null; Dq.hp=1; x.abKillP(Dq,mm6); ok('Bloodletter: a kill heals its share of max health (two copies add up)',Math.abs(Dq.hp-1-Dq.maxHp*2*K('ab_bloodletter','killheal'))<=1.5,Dq.hp);
  A6().length=0; A6().push('ab_ward'); Dq.ab=null; Dq.shield=null; x.abShieldS(Dq); ok('Round Ward: a shield of its share of max health (done: true, no skill-set trigger)',Dq.shield&&Math.abs(Dq.shield.v-Dq.maxHp*K('ab_ward','shield'))<1.5&&Dq.shield.done===true); Dq.shield=null;
  A6().length=0; A6().push('ab_thorn'); Dq.ab=null; mm6.hp=1000; mm6.dead=false; x.abThornsS(Dq,mm6); ok('Thornmail: the attacker loses a share of its own max health',Math.abs(1000-mm6.hp-1000*K('ab_thorn','thorns'))<1e-6,mm6.hp);
  // a wildcard's minus really applies
  A6().length=0; A6().push('ab_w_glass'); Dq.ab=null; ok('a wildcard: its plus AND its minus are in abP (damage x, damage taken x)',Math.abs(x.abP(Dq,'atk')-K('ab_w_glass','atk'))<1e-9&&Math.abs(x.abP(Dq,'def')-K('ab_w_glass','def'))<1e-9&&x.abP(Dq,'def')>1);
  { const R0=Math.random; Math.random=()=>0.5; try{ Dq.vbGrace=0; Dq.hp=Dq.maxHp; const hg=x.hurtP(Dq,50,mm6); A6().length=0; Dq.ab=null; Dq.hp=Dq.maxHp; const h0g=x.hurtP(Dq,50,mm6); Dq.vbGrace=1e12;
      ok('a wildcard\'s minus: the same hit really hurts more (hurtP: x1.75 above the 10% floor)',h0g>20&&Math.abs(hg/h0g-K('ab_w_glass','def'))<0.05,h0g+' -> '+hg); } finally { Math.random=R0; } }
  A6().length=0; A6().push('ab_w_colossus'); Dq.ab=null; ok('Colossus Heart: max health up, damage down (both factors in abP)',x.abP(Dq,'hp')>1&&x.abP(Dq,'atk')<1); A6().length=0; Dq.ab=null; }
// Last Breath: saves once per copy, is consumed, the bar loses it
{ A6().push('ab_last','ab_last','ab_edge'); Dq.ab=null; x.recalcP&&0; Dq.hp=Dq.maxHp; Dq.dead=false; Dq.vbGrace=0; sent.length=0;
  const mmL=live(rD)[0]; x.hurtP(Dq,1e15,mmL);
  ok('Last Breath: a lethal hit leaves you alive at 30% health and uses one copy up (the bar loses it)',!Dq.dead&&Math.abs(Dq.hp/Dq.maxHp-0.3)<0.01&&A6().filter(i=>i==='ab_last').length===1&&A6().length===2,Dq.hp+'/'+Dq.maxHp+' '+J(A6()));
  tick(2); ok('Last Breath: aba tells the client the copies left',evs('d','aba').some(e=>e[2]==='ab_last'&&e[3]===1),J(evs('d','aba')));
  Dq.vbGrace=0; Dq.hp=10; x.hurtP(Dq,1e15,mmL); ok('the second copy saves again, then none are left',!Dq.dead&&A6().filter(i=>i==='ab_last').length===0);
  Dq.vbGrace=0; Dq.hp=10; x.hurtP(Dq,1e15,mmL); ok('with no copy left the same hit kills',Dq.dead===true); Dq.dead=false; Dq.hp=Dq.maxHp; Dq.vbGrace=1e12; A6().length=0; Dq.ab=null;
  // outside a run nothing is saved (the hook asks p.inst)
}
// curses: engine, cap 5, outside the 20, a spawned monster is stronger, healing and offers
{ for(let i=0;i<20;i++) A6().push('ab_fang'); Dq.ab=null;
  ok('a full bar of 20 and a curse: the curse takes no place',x.abCurseAddP(Dq,'ab_c_hides')&&A6().length===20&&C6().length===1&&A6().length<=x.AB_ART_MAX);
  const k0=x.dgKOf(x.DEF_BY_ID.riftmite,rD.L), m1=x.abSpawnS(rD,'riftmite',0,0);
  ok('a curse raises a spawned monster\'s health (x1.25) and leaves the cached dgKOf alone',m1&&Math.abs(m1.dgK.hp/k0.hp-x.AB_CURSES.ab_c_hides.k.mhp)<1e-9&&Math.abs(m1.dgK.dmg-k0.dmg)<1e-9&&x.dgKOf(x.DEF_BY_ID.riftmite,rD.L).hp===k0.hp,J(m1&&m1.dgK)+' '+J(k0));
  ok('...and in the number the fight uses (monK): the monster takes that much more to kill',Math.abs(x.monK(m1,Dq).hp/k0.hp-1.25)<1e-6);
  x.abCurseAddP(Dq,'ab_c_claws'); const m2=x.abSpawnS(rD,'riftmite',0,0); ok('Whetted Claws: monsters deal more (x1.25 on top)',Math.abs(m2.dgK.dmg/k0.dmg-1.25)<1e-9&&Math.abs(m2.dgK.hp/k0.hp-1.25)<1e-9);
  x.abCurseAddP(Dq,'ab_c_famine'); Dq.ab=null; ok('Famine: healing x0.7 (a curse of the hiker\'s own stat joins the bar in abP)',Math.abs(x.abP(Dq,'heal')-0.7)<1e-9);
  x.abCurseAddP(Dq,'ab_c_frail'); ok('Frail Frame: max health x0.85 at once',Math.abs(x.abP(Dq,'hp')-0.85)<1e-9);
  x.abCurseAddP(Dq,'ab_c_narrow'); ok('five curses held; Narrow Offers takes one card off an offer (2 of 3), never all',C6().length===5&&x.abDrawOfferS(A6().slice(0,5),3-x.abCurseStat(C6(),'offer')).length===2&&x.abDrawOfferS([],0).length>=1);
  sent.length=0; ok('a 6th curse is refused (at most AB_CURSE_MAX) and the bar is still 20',!x.abCurseAddP(Dq,'ab_c_dull')&&C6().length===5&&A6().length===20);
  ok('a curse id that is not one (prototype names, an artifact id) is refused',!x.abCurseAddP(Dq,'__proto__')&&!x.abCurseAddP(Dq,'constructor')&&!x.abCurseAddP(Dq,'ab_fang')&&C6().length===5);
  ok('the save carries the curses (the `you` message and sanitizeGear keep them)',(()=>{ const o=x.sanitizeGear({ab:{top:1,run:JSON.parse(JSON.stringify(Dq.gear.ab.run))}}); return o.ab.run&&J(o.ab.run.curses)===J(C6()); })());
  // a curse never counts toward the 20: a pick onto a full bar is still refused by the bar only
  ok('the curses are gone with the run, and so are their factors',(()=>{ W.receive('d',{t:'dg',a:'leave'}); tick(2); return !Dq.inst&&Dq.gear.ab.run===null&&x.abP(Dq,'heal')===1; })()); }
// ---- B7: the tiles (shared/abyss/tiles.js, server/abyss/tiles.js)
{ const ids=x.AB_TILE_IDS, lands=['forest','vale','hoar','grey','sun','gloam','amber','isles'];
  ok('eight land tiles and six cave tiles, none left out as bad',ids.length===14&&x.AB_TILE_BAD.length===0&&lands.every(l=>ids.some(i=>x.AB_TILES[i].land===l))&&[1,2,3,4,5,6].every(n=>ids.some(i=>x.AB_TILES[i].floor===n)),J(x.AB_TILE_BAD));
  ok('every pool kind is a real, non-boss monster of DEF_BY_ID (land: 5-8 kinds; cave: the floor\'s ten, in its order)',ids.every(i=>{ const T=x.AB_TILES[i]; if(T.pool.some(id=>!x.DEF_BY_ID[id]||x.DEF_BY_ID[id].boss)) return false;
    return T.kind==='cave'?J(T.pool)===J(x.CAVE_FLOOR_DEFS[T.floor].mobs):T.pool.length>=5&&T.pool.length<=8; }));
  ok('a land tile\'s kinds are its land\'s: none of them is a cave copy or a rift glass kind',ids.every(i=>{ const T=x.AB_TILES[i]; return T.pool.every(id=>{ const d=x.DEF_BY_ID[id]; return !d.rift&&(T.kind==='cave')===!!d.cave; }); }));
  ok('abTileOf is own-property only',x.abTileOf('forest')&&x.abTileOf('constructor')===null&&x.abTileOf('__proto__')===null&&x.abTileOf(7)===null&&x.abTileOf(undefined)===null);
  const bad0=x.AB_TILE_BAD.length, row=()=>({id:'zz_test',kind:'land',land:'forest',name:'T',pool:['slime','shroom','beetle','boar'],tint:{ground:1,ground2:2,rim:3,fog:4,chip:5},props:['tree','rock'],shape:{r:18,wob:0.1,pillars:1}});
  const tries=[r=>{ r.pool=['slime','shroom','beetle','nonesuch']; },r=>{ r.pool=['slime','shroom','beetle','boss']; },r=>{ r.props=['tree','zzz']; },r=>{ r.kind='sea'; },r=>{ r.shape.r=40; },r=>{ r.pool=['slime']; },r=>{ r.id='Bad Id'; },r=>{ r.tint.chip='red'; },r=>{ r.kind='cave'; r.floor=99; }];
  const accepted=tries.filter(f=>{ const r=row(); f(r); return x.defineAbTile(r); }).length;
  ok('bad rows (unknown kind, a boss, a bad prop, kind, radius, short pool, id, colour, cave floor) are left out and listed',accepted===0&&x.AB_TILE_BAD.length===bad0+tries.length&&!x.AB_TILES.zz_test);
  ok('a good extra row is taken, and a duplicate id is refused',x.defineAbTile(row())===true&&x.defineAbTile(row())===false&&x.abTileOf('zz_test'));
  x.AB_TILE_IDS.pop(); delete x.AB_TILES.zz_test;
  // every tile bakes: a hub spawn, tears, enough open cells, one connected island (the flow field reaches every open cell), pure
  let allOk=true, why='';
  for(const id of ids) for(const seed of [1,777,123456789]){
    const L=x.abLayout(id,seed), B=x.dgBake(L), open=B.cells.reduce((s,v)=>s+v,0), st=B.start, S=B.marks.S;
    const fl=st&&x.dgFlow(B,st.x,st.z); let reach=0; if(fl) for(let i=0;i<B.cells.length;i++) if(B.cells[i]&&fl[i]!==65535) reach++;
    const good=st&&S.length>=4&&open>=700&&reach===open&&L.gw===2&&L.gh===2&&J(L)===J(x.abLayout(id,seed))&&S.every(m=>B.cells[Math.floor(m.z/2)*B.w+Math.floor(m.x/2)]);
    if(!good){ allOk=false; why=id+' '+seed+' open '+open+' reach '+reach+' S '+S.length; }
  }
  ok('every tile bakes (3 seeds each): a hub spawn, 4+ tears, 700+ open cells, one connected island, the same layout for the same seed',allOk,why);
  ok('different seeds give different islands; the layout is not the rift plus',J(x.abLayout('forest',1).cells.map(c=>c.art))!==J(x.abLayout('forest',2).cells.map(c=>c.art))&&x.abLayout('forest',1).gw===2&&x.abLayout('',1).gw===3&&x.abLayout(undefined,1).gw===3);
}
// a run on a tile: round 1 is a random tile, its kinds at the round level with normal speed, the tp names the tile; the offer after a won round
{ const E=mk('e',60); E.gear.ab.top=0; sent.length=0; W.receive('e',{t:'abyss',a:'go',d:0}); tick(2); let run=runOf(E);
  const T=run&&x.abTileOf(run.abTile);
  ok('round 1: a tile of the registry, its island baked, abr carries its id',!!T&&run.tile===T&&run.B.marks.S.length>=4&&evs('e','abr').some(e=>e[5]===T.id),run&&run.abTile);
  ok('the tp carries the tile id (the client rebuilds the island from tile + seed)',(()=>{ const tp=sent.filter(s=>s[0]==='e'&&s[1].t==='tp').pop(); return tp&&tp[1].dg&&tp[1].dg.tile===T.id&&tp[1].dg.m==='abyss'; })());
  tick(Math.ceil(40/0.05)); E.hp=E.maxHp; const ms=live(run);
  ok('wave monsters are the tile\'s kinds at the round level, plain (not the rift\'s glass copies, normal speed)',ms.length>0&&ms.every(m=>T.pool.includes(m.def.id)&&m.dgK.lv===run.L&&!m.def.rift&&!(m.def.pal&&m.def.pal.glass)&&m.def.speed===x.DEF_BY_ID[m.def.id].speed),J(ms.map(m=>m.def.id)));
  ok('...and more than one kind comes (a varied pool)',new Set(ms.map(m=>m.def.id)).size>=2);
  for(let i=0;i<400&&!run.abWon;i++){ for(const m of live(run)){ m.hp=0; x.killMonsterS(m,E); } tick(10); E.hp=E.maxHp; E.dead=false; }
  ok('(round won; the artifact offer comes first)',run.abWon&&E.gear.ab.run.offer&&E.gear.ab.run.offer.k==='art');
  W.receive('e',{t:'abyss',a:'next',i:0}); tick(1); ok('next with an artifact offer pending is refused',runOf(E)===run);
  sent.length=0; W.receive('e',{t:'abyss',a:'pick',i:0}); tick(2); const o=E.gear.ab.run.offer;
  ok('after the pick: a tile offer of 3 different tiles, kind fight, stored before abo is sent',o&&o.k==='tile'&&o.o.length===x.AB_TILE_OFFER_N&&new Set(o.o.map(t=>t.tile)).size===o.o.length&&o.o.every(t=>x.abTileOf(t.tile)&&t.kind==='fight')&&!o.o.some(t=>t.tile===run.abTile),J(o));
  ok('abo [pid, tile, [[tile, kind]...]] was sent',evs('e','abo').some(e=>e[2]==='tile'&&J(e[3])===J(o.o.map(t=>[t.tile,t.kind]))),J(evs('e','abo')));
  sent.length=0; W.receive('e',{t:'abyss',a:'open'}); tick(1); ok('reopening shows the same tile offer again',evs('e','abo').some(e=>e[2]==='tile'&&J(e[3])===J(o.o.map(t=>[t.tile,t.kind]))));
  const keep=J(o);
  for(const bad of [undefined,null,-1,3,99,1.5,'0','1',{},[0],NaN,true]){ W.receive('e',{t:'abyss',a:'next',i:bad}); }
  tick(1); ok('next with a missing, negative, too large, fractional or non-number index is refused: same run, same offer',runOf(E)===run&&J(E.gear.ab.run.offer)===keep);
  W.receive('e',{t:'abyss',a:'skip'}); ok('skip does not clear a tile offer',J(E.gear.ab.run.offer)===keep);
  const want=o.o[1].tile; W.receive('e',{t:'abyss',a:'next',i:1}); tick(2); const r2=runOf(E);
  ok('next,1 plays the second tile: a fresh run on exactly that tile, round 2, the offer is gone',r2&&r2!==run&&r2.abTile===want&&r2.abR===2&&E.gear.ab.run.offer===null&&r2.L===43,r2&&r2.abTile);
  // skipping the artifact offer leads to the tiles too
  upto(r2,600); ok('(round 2 won)',r2.abWon); W.receive('e',{t:'abyss',a:'skip'}); const o2=E.gear.ab.run.offer;
  ok('skip: the tile offer follows',o2&&o2.k==='tile'&&o2.o.length>=2);
  W.receive('e',{t:'abyss',a:'next',i:0}); tick(2); ok('next,0 on it',runOf(E)&&runOf(E).abTile===o2.o[0].tile&&runOf(E).abR===3);
  // no tile offer pending (the dev jump): a random tile, as before
  W.receive('e',{t:'dg',a:'leave'}); tick(2); }
// the Test: kill the code and the test fails (see the usage note at the top)
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
