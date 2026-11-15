// The Abyss, steps B0-B1 (shared/abyss.js, server/abyss.js), straight from src/, no build: the difficulty and round-level tables (against abyss-plan/PLAN.md section 0), the boss rounds,
// gear.ab cleaned field by field (prototype keys, NaN, negatives, huge numbers, strings), the flag (off: abyss{a:'open'} is silence), on at level 40: the info message, at level 39: a refusal,
// and the slot split (rifts 16-31, the Abyss 32-47). Step B2 (server/abyss/rounds.js): go / next / out, Fight rounds (3 waves, plain monsters at the round's level), a won difficulty opens the next,
// death, leaving and a pulled plug end the run, no XP or coins, the flag, the level gate, 16 runs at once and "full".
// Usage: node tools/abyss-smoke.js
const {loadServer}=require('./load');
const sent=[];
const {api:W,x}=loadServer({dev:false,log(){},send(to,m){ sent.push([to,JSON.parse(JSON.stringify(m))]); }},['AB_DIFFS','AB_INF','abRoundLv','abRounds','abBossRounds','abIsBossRound','abSwitch','abSanitize','abOnS','AB_ART_MAX','AB_RANK_MAX','AB_CURSE_MAX','AB_ENTRY_LV','AB_AS_MAX','AB_LOCK_MAX','AB_SLOT0','DG_MAX_INST','RIFT_SLOT0','sanitizeGear','DG_RUNS','DG_SLOT_RUN','killMonsterS','xpFor','abWaveSize','AB_WAVES','AB_RUN_KEEP_S','DG_EMPTY_S','dgCloseS','dgKOf','RIFT_DMG_K']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined?'  ('+i+')':'')); if(!c) fails++; };
const J=JSON.stringify, tick=n=>{ for(let i=0;i<n;i++) W.tick(0.05); };
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
  sent.length=0; W.receive('c',{t:'abyss',a:'next'}); tick(2); const r2=runOf(C);
  ok('next: round 2 at level 43 in a fresh run object',r2&&r2!==run&&r2.abR===2&&r2.L===43&&!x.DG_RUNS.has(run.id)&&C.gear.ab.run.r===2,r2&&r2.L);
  ok('abr [pid, 2, 7, 43]',evs('c','abr').some(e=>e[2]===2&&e[4]===43));
  // out mid-round is refused; next mid-round does nothing
  W.receive('c',{t:'abyss',a:'out'}); W.receive('c',{t:'abyss',a:'next'}); tick(1); ok('out / next in the middle of a round do nothing',runOf(C)===r2&&r2.abR===2);
  upto(r2,400); ok('round 2 won',r2.abWon);
  // out between rounds
  const co=C.gear.coins; W.receive('c',{t:'abyss',a:'out'}); tick(2);
  ok('out between rounds: back in the world, the run gone, gear.ab.run null, nothing lost',!C.inst&&!x.DG_RUNS.has(r2.id)&&C.gear.ab.run===null&&x.DG_SLOT_RUN.slice(32).every(v=>!v)&&C.gear.coins===co&&C.gear.ab.top===0);
}
// a whole difficulty I: 7 rounds, levels 40 43 47 50 53 57 60, the top opens, a clear counts
{ W.receive('c',{t:'abyss',a:'go',d:0}); tick(2); const lv=[]; let run=runOf(C);
  for(let r=1;r<=7;r++){ run=runOf(C); lv.push(run.L); upto(run,600); if(r<7){ W.receive('c',{t:'abyss',a:'next'}); tick(2); } }
  ok('seven rounds at 40, 43, 47, 50, 53, 57, 60',J(lv)==='[40,43,47,50,53,57,60]',J(lv));
  ok('the last round wins the run: top 1, clears[0] 1, the run is closing (dge won sent), gear.ab.run null',C.gear.ab.top===1&&C.gear.ab.clears[0]===1&&C.gear.ab.run===null&&run.endT>0&&run.abR===7,J(C.gear.ab));
  W.receive('c',{t:'abyss',a:'next'}); tick(1); ok('next after the last round does nothing',runOf(C)===run);
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
  const q=ids[0], run=runOf(q); for(const m of live(run)){ m.hp=0; } run.abWon=true; run.phase='won'; W.receive('m0',{t:'abyss',a:'next'}); tick(2);
  ok('with 16 runs, next still works (its own slot is reused)',runOf(q)&&runOf(q).abR===2&&runOf(q).slot>=32);
  for(const q2 of ids) if(q2.inst) W.receive(q2.id,{t:'dg',a:'leave'}); tick(2); ok('all left: every Abyss slot is free again',x.DG_SLOT_RUN.slice(32).every(v=>!v)); }
// the Test: kill the code and the test fails (see the usage note at the top)
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
