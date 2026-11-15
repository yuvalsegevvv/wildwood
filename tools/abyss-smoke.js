// The Abyss, steps B0-B1 (shared/abyss.js, server/abyss.js), straight from src/, no build: the difficulty and round-level tables (against abyss-plan/PLAN.md section 0), the boss rounds,
// gear.ab cleaned field by field (prototype keys, NaN, negatives, huge numbers, strings), the flag (off: abyss{a:'open'} is silence), on at level 40: the info message, at level 39: a refusal,
// and the slot split (rifts 16-31, the Abyss 32-47). Step B2 (server/abyss/rounds.js): go / next / out, Fight rounds (3 waves, plain monsters at the round's level), a won difficulty opens the next,
// death, leaving and a pulled plug end the run, no XP or coins, the flag, the level gate, 16 runs at once and "full".
// Step B4 (server/abyss/arts.js, shared/abyss/artifacts-stat.js): the artifact registry, abArtStat, the stored offer (same after a reopen), pick / skip / drop and their refusals, the 20 cap and rank 5,
// next refused while an offer is pending, abP = 1 outside a run and after it, and the hooks: damage dealt, damage taken, max health, healing, lifesteal really change in a headless hit.
// Usage: node tools/abyss-smoke.js
const {loadServer}=require('./load');
const sent=[];
const {api:W,x}=loadServer({dev:false,log(){},send(to,m){ sent.push([to,JSON.parse(JSON.stringify(m))]); }},['getH','recalcP','abShardsOf','abClearBonus','abShopRow','abShopPrice','AB_SHOP','AB_SH_DIFF','AB_ROUND_S','AB_SPECIAL_GROWTH','AB_BUY_MAX','abDayS','abShopP','abBuyP','abPayRoundP','isGuestP','gsDayOf','essOf','RL_STONE_MAX','AB_PRISM_MAX','AB_ELITE_HP','AB_CHAMP_HP','RIFT_HERALD_HP','RIFT_GAUNT_S','RIFT_THAW_S','abKindDev','abDrawKindsS','abTileOfferP','abTileSendP','AB_CURSE_MAX','AB_KIND_W','AB_KIND_IDS','AB_KIND_PICKS','AB_TRIAL_MODES','AB_EVENTS','AB_EVENT_BAD','AB_CURSES','abEncWindow','abIsEvent','abEvWhyP','abShrineOfferS','abRoundWonS','abRunNewS','RIFT_DEFS','riftDefOf',  'AB_DIFFS','AB_INF','abRoundLv','abRounds','abBossRounds','abIsBossRound','abSwitch','abSanitize','abOnS','AB_ART_MAX','AB_RANK_MAX','AB_CURSE_MAX','AB_ENTRY_LV','AB_AS_MAX','AB_LOCK_MAX','AB_SLOT0','DG_MAX_INST','RIFT_SLOT0','sanitizeGear','DG_RUNS','DG_SLOT_RUN','killMonsterS','xpFor','abWaveSize','AB_WAVES','AB_RUN_KEEP_S','DG_EMPTY_S','dgCloseS','dgKOf','RIFT_DMG_K','abP','AB_ARTS','AB_ART_BAD','defineAbArt','abArtStat','AB_CAPS','rollDmgS','hurtP','healP','damageMonsterS','abDrawOfferS','AB_CURSES','AB_CURSE_BAD','defineAbCurse','abCurseStat','abIsCurse','abHitS','abKillP','abThornsS','abShieldS','abCurseAddP','abGiveArtP','abSpawnS','DEF_BY_ID','AB_NTH','monK','AB_TILES','AB_TILE_IDS','AB_TILE_BAD','defineAbTile','abTileOf','abLayout','dgBake','dgFlow','CAVE_FLOOR_DEFS','abRandTileS','AB_TILE_OFFER_N','AB_BOSS_ALL','AB_BOSS_OK','AB_BOSS_OUT','AB_BOSS_LAND','abBossOk','abBossRowOf','abBossDrawS','AB_BOSS_CELLS','abStartRoundS','dgSolid','MONS','abIsBossRound','abTileBase','abTileLayout','DG_BOSS_R','DG_BOSS_DEFS','BOSS_DEFS','clearBossFxS']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined?'  ('+i+')':'')); if(!c) fails++; };
const K=(id,s)=>x.AB_ARTS[id].k[s];   // the numbers are tuned by tools/abyss-sim.js: the tests read them from the rows
// a hit of a size where rounding cannot matter: the damage a plain 50 does depends on the monster's kind (a weak kind made 7 -> 12 and a 5% rounding error), so the size is calibrated to about 800 taken (at most a fifth of max health) with no artifact on the bar
const bigV=(q,m,bar)=>{ q.shield=null; q.dead=false; const keep=bar.slice(); bar.length=0; q.ab=null; q.vbGrace=0; q.hp=q.maxHp; const base=Math.max(1,x.hurtP(q,50,m)); q.hp=q.maxHp; bar.push(...keep); q.ab=null; return Math.max(50,Math.ceil(50*Math.min(800,q.maxHp*0.2)/base)); };
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
const D={top:0,best:0,clears:[0,0,0,0,0,0],as:0,lock:0,prism:0,sh:{d:0,n:{}},run:null};
ok('no gear.ab (an old save): the default',J(clean(undefined))===J(D)&&J((()=>{ const o={}; x.abSanitize({},o); return o.ab; })())===J(D));
ok('garbage values: strings, NaN, negative, arrays, null give the default',[ 'x',7,null,[],{top:'a',best:NaN,clears:'no',as:-5,lock:'z',sh:'q',run:5},{top:-3,best:-1,clears:[-1,NaN,'x'],as:Infinity,lock:-Infinity,sh:{d:-4,n:[1,2]}} ].every(g=>{ const c=clean(g); return J(c)===J(D)||(c.top===0&&c.best===0&&c.as>=0&&c.lock>=0&&c.run===null&&c.clears.length===6); }));
{ const c=clean({top:9,best:99999999,clears:[1,2,3,4,5,6,7,8],as:1e15,lock:1e15,run:{d:1,r:2}}); ok('huge numbers are capped, clears keeps 6, a run is dropped',c.top===5&&c.best===999999&&c.clears.length===6&&c.as===x.AB_AS_MAX&&c.lock===x.AB_LOCK_MAX&&c.run===null,J(c)); }
{ const g=JSON.parse('{"sh":{"d":5,"n":{"__proto__":3,"constructor":2,"toString":1,"rsw":4,"rsa":-2,"x":"abc","temper":1e9,"z":true}}}'), c=clean(g); ok('shop counts: prototype names and bad counts dropped, own ids clamped',J(c.sh)===J({d:5,n:{rsw:4,temper:9999}})&&Object.getPrototypeOf(c.sh.n)===Object.prototype,J(c.sh)); }
ok('a clean save stays as it is',(()=>{ const g={top:3,best:21,clears:[4,3,2,0,0,0],as:500,lock:2,prism:1,sh:{d:20000,n:{rsw:3}},run:null}; return J(clean(g))===J(g); })());
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
x.abSwitch(true); x.abKindDev.force='fight';   // B8: the offered kinds are pinned to Fights for everything up to the B8 section (it frees them again)
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
ok('the offer is in the stored save before it is sent: the `you` message carries it and only the bar, curses, offer, es and pk beside d, r, at',(()=>{ const y=sent.filter(q=>q[0]==='d'&&q[1].t==='you').pop(); const r=y&&y[1].gear.ab.run; return !!r&&J(Object.keys(r).sort())===J(['arts','at','curses','d','es','offer','pk','r']); })());
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
    arts().length=0; const hv=bigV(Dq,mm,arts()); arts().push('ab_scale','ab_scale'); Dq.ab=null; Dq.vbGrace=0; Dq.shield=null; Dq.hp=Dq.maxHp; const h0=x.hurtP(Dq,hv,mm); Dq.hp=Dq.maxHp; arts().length=0; Dq.ab=null; const h1=x.hurtP(Dq,hv,mm); Dq.vbGrace=1e12;
    ok('damage taken: the same hit does the factor of two Slate Scales (hurtP)',h1>20&&Math.abs(h0/h1-K('ab_scale','def')**2)<0.005,h1+' -> '+h0);
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
  { const R0=Math.random; Math.random=()=>0.5; try{ const hv=bigV(Dq,mm6,A6()); Dq.vbGrace=0; Dq.shield=null; Dq.hp=Dq.maxHp; const hg=x.hurtP(Dq,hv,mm6); A6().length=0; Dq.ab=null; Dq.hp=Dq.maxHp; const h0g=x.hurtP(Dq,hv,mm6); Dq.vbGrace=1e12;
      ok('a wildcard\'s minus: the same hit really hurts more (hurtP: x1.75 above the 10% floor)',h0g>20&&Math.abs(hg/h0g-K('ab_w_glass','def'))<0.005,h0g+' -> '+hg); } finally { Math.random=R0; } }
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
  ok('wave monsters are the tile\'s kinds at the round level, plain (not the rift\'s glass copies, normal speed)',ms.length>0&&ms.every(m=>T.pool.includes(m.def.id)&&m.dgK.lv===run.L&&!m.def.rift&&m.def===x.DEF_BY_ID[m.def.id]&&m.def.speed===x.DEF_BY_ID[m.def.id].speed),J(ms.map(m=>m.def.id)));
  ok('...and more than one kind comes (a varied pool)',new Set(ms.map(m=>m.def.id)).size>=2);
  for(let i=0;i<400&&!run.abWon;i++){ for(const m of live(run)){ m.hp=0; x.killMonsterS(m,E); } tick(10); E.hp=E.maxHp; E.dead=false; }
  ok('(round won; the artifact offer comes first)',run.abWon&&E.gear.ab.run.offer&&E.gear.ab.run.offer.k==='art');
  W.receive('e',{t:'abyss',a:'next',i:0}); tick(1); ok('next with an artifact offer pending is refused',runOf(E)===run);
  sent.length=0; W.receive('e',{t:'abyss',a:'pick',i:0}); tick(2); const o=E.gear.ab.run.offer;
  ok('after the pick: a tile offer of 3 different tiles, kind fight, stored before abo is sent',o&&o.k==='tile'&&o.o.length===x.AB_TILE_OFFER_N&&new Set(o.o.map(t=>t.tile)).size===o.o.length&&o.o.every(t=>x.abTileOf(t.tile)&&t.kind==='fight')&&!o.o.some(t=>t.tile===run.abTile),J(o));
  ok('abo [pid, tile, [[tile, kind]...]] was sent',evs('e','abo').some(e=>e[2]==='tile'&&J(e[3])===J(o.o.map(t=>[t.tile,t.kind,t.mode||'']))),J(evs('e','abo')));
  sent.length=0; W.receive('e',{t:'abyss',a:'open'}); tick(1); ok('reopening shows the same tile offer again',evs('e','abo').some(e=>e[2]==='tile'&&J(e[3])===J(o.o.map(t=>[t.tile,t.kind,t.mode||'']))));
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

// ---- B8: round kinds (Elite, Trial, Event, Shrine); the kinds were pinned to Fights above, they are freed here
x.abKindDev.force=''; x.abKindDev.mode='';
{ const KW=x.AB_KIND_W, draws=Array.from({length:3000},()=>x.abDrawKindsS(5,2,0,3)).flat(), cnt={}; for(const k of draws) cnt[k]=(cnt[k]|0)+1;
  ok('kinds: weights are fight 45, elite 15, trial 10, event 15, shrine 10, boss 5 (B9)',J(KW)===J({fight:45,elite:15,trial:10,event:15,shrine:10,boss:5}));
  ok('every kind comes over many draws; the shares follow the weights (+-4 points, the boss of round 2 included)',['fight','elite','trial','event','shrine','boss'].every(k=>cnt[k]>0&&Math.abs(cnt[k]/draws.length*100-KW[k]/100*100)<4),J(cnt));
  ok('the offer slot of a boss has weight 5 and pays 3 picks',x.AB_KIND_IDS.includes('boss')&&KW.boss===5&&x.AB_KIND_PICKS.boss===3);
  ok('the guarantee windows are rounds 4-6, 10-12, 16-18: abEncWindow gives the first round of a window',J([1,2,3,4,5,6,7,9,10,11,12,13,16,18,19].map(x.abEncWindow))==='[0,0,0,4,4,4,0,0,10,10,10,0,16,16,0]');
  const hasEnc=o=>o.some(k=>k==='event'||k==='shrine'), many=(d,r,es)=>Array.from({length:400},()=>x.abDrawKindsS(d,r,es,3));
  ok('window rounds 4, 5: an Event or a Shrine is always among the cards while none was played in the window; round 6: every card is one',[[4,0],[5,3],[10,0],[11,9],[16,0],[17,5]].every(([r,es])=>many(5,r,es).every(hasEnc))&&[[6,0],[12,4],[18,0]].every(([r,es])=>many(5,r,es).every(o=>o.every(k=>k==='event'||k==='shrine'))));
  ok('...but not once one was played in the window (es inside it), and outside the windows the draw is free',many(5,6,5).some(o=>!hasEnc(o))&&many(5,5,4).some(o=>!hasEnc(o))&&many(5,3,0).some(o=>!hasEnc(o))&&many(5,8,0).some(o=>!hasEnc(o)));
  ok('the last round of a finite difficulty is never an Event or a Shrine (it wins the run); Infinite has no last round',[[0,7],[1,10],[4,19]].every(([d,r])=>many(d,r,0).every(o=>!hasEnc(o)))&&many(5,6,0).every(hasEnc)&&many(5,8,0).some(hasEnc)); }   // (round 7 of Infinite is a forced boss round: B9)
const Dk=mk('k',60), kRun=()=>runOf(Dk), tilesOf=()=>Dk.gear.ab.run&&Dk.gear.ab.run.offer;
const rift0=()=>J(Dk.gear.rift), seen=new Set(); let kcount=0;
const finish=run=>{ for(let i=0;i<600&&!run.abWon&&!run.endT;i++){ for(const m of live(run)){ seen.add(m); m.hp=0; x.killMonsterS(m,Dk); } tick(10); Dk.hp=Dk.maxHp; Dk.dead=false; } };
const aboArt=()=>evs('k','abo').filter(e=>e[2]==='art').length;
// round 1 is a Fight, whatever the draw
{ Dk.gear.ab.top=0; x.abKindDev.force='trial'; W.receive('k',{t:'abyss',a:'go',d:0}); tick(2); const r=kRun();
  ok('round 1 is always a Fight (even with every kind pinned to something else)',r&&r.abKind==='fight'&&r.abR===1&&!!r.tile&&evs('k','abr').some(e=>e[6]==='fight'),r&&r.abKind);
  x.abKindDev.force='elite'; finish(r); ok('(round 1 won; its offer is for an Elite now)',r.abWon);
  // an Elite pays two offers one after another, then the tiles
  sent.length=0; const ids0=Dk.gear.ab.run.arts.length;
  const o1=Dk.gear.ab.run.offer; ok('a Fight pays one pick: after it the tile offer (cards of kind elite, with their tiles)',o1.k==='art'&&Dk.gear.ab.run.pk===0);
  W.receive('k',{t:'abyss',a:'pick',i:0}); tick(1); const to=tilesOf();
  ok('the tile offer carries kinds, stored: 3 Elite cards (tile + kind)',to&&to.k==='tile'&&to.o.length===3&&to.o.every(c=>c.kind==='elite'&&x.abTileOf(c.tile)),J(to));
  W.receive('k',{t:'abyss',a:'next',i:1}); tick(3); const e=kRun();
  ok('next: an Elite round on that tile at the round level, abr carries the kind',e&&e.abKind==='elite'&&e.abR===2&&e.abTile===to.o[1].tile&&evs('k','abr').some(q=>q[2]===2&&q[6]==='elite'));
  // composition: smaller waves than a Fight, elites x2, champions x4 and bigger
  x.abKindDev.force='fight'; const spawned=[]; for(let i=0;i<600&&!e.abWon&&!e.endT;i++){ for(const m of live(e)){ if(!spawned.includes(m)) spawned.push(m); m.hp=0; x.killMonsterS(m,Dk); } tick(10); Dk.hp=Dk.maxHp; Dk.dead=false; }
  const el=spawned.filter(m=>m.abTier==='e'), ch=spawned.filter(m=>m.abTier==='c'), base=spawned.filter(m=>!m.abTier);
  ok('an Elite round is won; it had fewer monsters than a Fight of its round (half a wave), elites and 1-2 champions',e.abWon&&spawned.length<3*x.abWaveSize(2,1)&&el.length>0&&ch.length>=1&&ch.length<=2&&base.length>0,J([spawned.length,el.length,ch.length,base.length]));
  ok('elites have x2 health, champions x4 and a bigger scale; the others are plain',el.every(m=>Math.abs(m.maxHp/m.T.hp-x.AB_ELITE_HP)<1e-6&&m.s>1)&&ch.every(m=>Math.abs(m.maxHp/m.T.hp-x.AB_CHAMP_HP)<1e-6&&m.s>el[0].s)&&base.every(m=>m.maxHp===m.T.hp&&m.s===1),J(ch.map(m=>m.maxHp/m.T.hp)));
  sent.length=0; const a0=Dk.gear.ab.run.arts.length, off1=Dk.gear.ab.run.offer;
  ok('an Elite pays 2 picks: the first offer is there, one more is owed (pk 1)',off1&&off1.k==='art'&&Dk.gear.ab.run.pk===1);
  W.receive('k',{t:'abyss',a:'pick',i:0}); tick(1); const off2=Dk.gear.ab.run.offer;
  ok('...picking it opens a SECOND artifact offer (not the tiles yet), stored and sent',off2&&off2.k==='art'&&Dk.gear.ab.run.pk===0&&aboArt()===1&&Dk.gear.ab.run.arts.length===a0+1);
  W.receive('k',{t:'abyss',a:'skip'}); tick(1); ok('...skipping that one leads to the tile offer; the bar has the one copy',tilesOf()&&tilesOf().k==='tile'&&Dk.gear.ab.run.arts.length===a0+1);
  ok('a bad index on a pending second offer is refused (the offer stays)',(()=>{ W.receive('k',{t:'abyss',a:'next',i:9}); return !!kRun()&&kRun()===e; })());
  W.receive('k',{t:'dg',a:'leave'}); tick(2); }
// Trials: every working mode is played by the rift smoke's bot; the win ends the ROUND (picks, tiles), never the rift's save or XP
const modeOk={};
for(const mode of Object.keys(x.AB_TRIAL_MODES)){
  Dk.gear.ab.top=0; x.abKindDev.force='fight'; x.abKindDev.mode=''; W.receive('k',{t:'abyss',a:'go',d:0}); tick(2); const r1=kRun(); x.abKindDev.force='trial'; x.abKindDev.mode=mode; finish(r1);
  W.receive('k',{t:'abyss',a:'skip'}); tick(1); const to=tilesOf(); const c0=Dk.gear.coins, xp=Dk.exp+Dk.level*1e9, rs=rift0();
  ok(mode+': the offered cards are Trials of that mode on a tile',to&&to.k==='tile'&&to.o.every(c=>c.kind==='trial'&&c.mode===mode&&x.abTileOf(c.tile)),J(to));
  W.receive('k',{t:'abyss',a:'next',i:0}); tick(3); const r=kRun(); sent.length=0;
  ok(mode+': a Trial round on the mode\'s rift platforms (th '+x.AB_TRIAL_MODES[mode]+'), level '+x.abRoundLv(0,2)+', the Abyss\'s own def (reward abyss)',r&&r.abKind==='trial'&&r.abMode===mode&&r.th===x.AB_TRIAL_MODES[mode]&&r.L===43&&x.riftDefOf(r).reward==='abyss'&&x.riftDefOf(r).mode===mode&&r.abTile==='rift:'+r.th&&!r.rift,r&&[r.abKind,r.th,r.abTile]);
  ok(mode+': the client rebuilds the same platforms: abLayout(tile, seed) is the rift\'s layout',J(x.abLayout(r.abTile,r.seed).cells.map(c=>c.art))===J(r.lay.cells.map(c=>c.art)));
  let steps=0, plain=true; const bot=()=>{ if(mode==='thaw'&&r.t<x.RIFT_THAW_S-5) r.t=x.RIFT_THAW_S-5;
    for(const m of [...r.mons]) if(!m.dead&&!m.remove&&!m.immune){ seen.add(m); if(Math.abs(m.dgK.dmg-x.dgKOf(m.def,r.L).dmg)>1e-9||(!(m.riftChamp||m.riftGuard||m.riftCol)&&Math.abs(m.maxHp-m.T.hp*(m.dgRole==='herald'?x.RIFT_HERALD_HP*0.5:1))>1e-6)) plain=false; m.hp=0; x.killMonsterS(m,Dk); }
    const ob=r.objs.find(o=>o.st===1&&(o.kind==='beacon'||((o.kind==='core'||o.kind==='pylon')&&!(o.v>0)))); if(ob){ Dk.x=ob.x; Dk.z=ob.z; Dk.y=x.getH(Dk.x,Dk.z); if(ob.kind!=='beacon'&&!Dk.cast) W.receive('k',{t:'dg',a:'use',id:ob.id}); } };
  for(;steps<12000&&!r.abWon&&!r.endT;steps++){ bot(); tick(2); Dk.hp=Dk.maxHp; Dk.dead=false; Dk.vbGrace=1e12; }
  const won=r.abWon&&!r.endT&&r.phase==='won'; modeOk[mode]=won;
  ok(mode+': won headless: the round is won (abWon), the run goes on (no end timer, hiker still inside)',won&&Dk.inst===r.id,r.phase+' '+steps+' steps '+J(r.hud));
  ok(mode+': nothing from the rift: gear.rift untouched, no XP, no coins, the HUD was the mode\'s tuple + marker',rift0()===rs&&Dk.gear.coins===c0&&Dk.exp+Dk.level*1e9===xp&&r.hud[8]===1&&r.hud[9]===2&&r.hud[10]===7,rs+' '+rift0());
  ok(mode+': monsters had the plain numbers of the round (no brittle K) and the run had no riftwon / rift save',plain&&!evs('k','dge').some(q=>q[2]===1));
  const o1=Dk.gear.ab.run.offer; ok(mode+': a Trial pays 2 picks: a first artifact offer, pk 1',o1&&o1.k==='art'&&Dk.gear.ab.run.pk===1);
  W.receive('k',{t:'abyss',a:'pick',i:0}); tick(1); const o2=Dk.gear.ab.run.offer; ok(mode+': then the second offer, then the tiles',o2&&o2.k==='art'&&!(Dk.gear.ab.run.pk>0));
  W.receive('k',{t:'abyss',a:'pick',i:0}); tick(1); ok(mode+': ...and then the next tiles',tilesOf()&&tilesOf().k==='tile');
  W.receive('k',{t:'dg',a:'leave'}); tick(2); ok(mode+': leaving between rounds is "out"',!Dk.inst&&Dk.gear.ab.run===null); }
ok('every Trial mode of the plan plays (heart gale beacons thaw lanterns quarry gauntlet)',Object.keys(x.AB_TRIAL_MODES).join()==='heart,gale,beacons,thaw,lanterns,quarry,gauntlet'&&Object.values(modeOk).every(Boolean),J(modeOk));
// a lost Trial (the gauntlet's clock) ends the run like a fall
{ Dk.gear.ab.top=0; x.abKindDev.force='fight'; W.receive('k',{t:'abyss',a:'go',d:0}); tick(2); const r1=kRun(); x.abKindDev.force='trial'; x.abKindDev.mode='gauntlet'; finish(r1); W.receive('k',{t:'abyss',a:'skip'}); W.receive('k',{t:'abyss',a:'next',i:0}); tick(3); const r=kRun();
  r.t=x.RIFT_GAUNT_S+1; tick(3); ok('a Trial that runs out of time is lost: the run ends, the save is cleared, nothing is paid',r.endT>0&&r.phase==='lost'&&!r.abWon,r.phase); tick(Math.ceil(25/0.05)); ok('...and the hiker is back in the world with no run',!Dk.inst&&Dk.gear.ab.run===null); }
// Events
x.abKindDev.force='event'; x.abKindDev.mode='';
{ Dk.gear.ab.top=0; x.abKindDev.force='fight'; W.receive('k',{t:'abyss',a:'go',d:0}); tick(2); const r1=kRun(); x.abKindDev.force='event'; finish(r1); W.receive('k',{t:'abyss',a:'skip'}); tick(1);
  ok('Event cards in the offer have no tile',tilesOf().o.every(c=>c.kind==='event'&&c.tile===''),J(tilesOf())); sent.length=0;
  W.receive('k',{t:'abyss',a:'next',i:0}); tick(3); const ev=kRun(); const off=tilesOf();
  ok('an Event round: plain rift platforms, no monsters, won at once, an encounter offer stored and sent',ev.abKind==='event'&&ev.abTile===''&&ev.abWon&&!ev.endT&&live(ev).length===0&&off&&off.k==='event'&&x.abIsEvent(off.o.id)&&evs('k','abo').some(q=>q[2]==='event'&&q[3]===off.o.id&&q[4].length===x.AB_EVENTS[off.o.id].choices.length),J(off));
  ok('the layout is the Shardmere\'s plain platforms (3 x 3)',ev.lay.gw===3&&x.abLayout('',ev.seed).gw===3);
  ok('the save names it: es is this round, pk 0',Dk.gear.ab.run.es===2&&Dk.gear.ab.run.pk===0);
  for(const bad of [-1,3,99,1.5,'0',null,undefined,NaN,{},[0],true]) W.receive('k',{t:'abyss',a:'pick',i:bad}); W.receive('k',{t:'abyss',a:'next',i:0}); W.receive('k',{t:'abyss',a:'skip'}); tick(1);
  ok('a bad pick index, next and skip leave the encounter as it is',tilesOf()&&tilesOf().k==='event'&&tilesOf().o.id===off.o.id&&kRun()===ev);
  // every event, every choice (the bar and the curses reset each time; a gamble may go either way)
  const g=()=>Dk.gear.ab.run, set=(id,arts,curses)=>{ g().arts.length=0; g().arts.push(...arts); g().curses.length=0; g().curses.push(...curses); g().offer={k:'event',o:{id}}; Dk.ab=null; Dk.hp=1; Dk.dead=false; x.recalcP(Dk); Dk.hp=1; };
  const bar4=['ab_edge','ab_fang','ab_heart','ab_scale'], cur2=['ab_c_hides','ab_c_dull'];
  const delta=ops=>{ let a=0,c=0,h=false,u=0; const out=[]; const walk=(os)=>{ for(const o of os){ if(o.op==='art') a+=o.n||1; else if(o.op==='lose') a-=o.n||1; else if(o.op==='curse') c+=o.n||1; else if(o.op==='uncurse') u++; else if(o.op==='heal') h=true; } }; 
    const gam=ops.find(o=>o.op==='gamble'); if(!gam){ walk(ops); return [[a,c,h,u]]; } const res=[]; for(const br of [gam.win,gam.lose]){ a=0;c=0;h=false;u=0; walk(ops.filter(o=>o!==gam)); walk(br); res.push([a,c,h,u]); } return res; };
  let nChoice=0, allOk=true, why='';
  for(const id of Object.keys(x.AB_EVENTS)) for(let ci=0;ci<x.AB_EVENTS[id].choices.length;ci++) for(let rep=0;rep<(x.AB_EVENTS[id].choices[ci].fx.some(o=>o.op==='gamble')?12:1);rep++){
    set(id,bar4,cur2); const a0=g().arts.length, c0=g().curses.length; sent.length=0; let threw=false; try{ W.receive('k',{t:'abyss',a:'pick',i:ci}); tick(1); }catch(err){ threw=true; why=id+'/'+ci+' threw '+err.message; }
    const fx=x.AB_EVENTS[id].choices[ci].fx, dl=delta(fx), da=g().arts.length-a0, dc=g().curses.length-c0, healed=Dk.hp===Dk.maxHp, u=cur2.length-g().curses.filter(q=>cur2.includes(q)).length;
    const match=dl.some(([a,c,h,uu])=>a===da&&c-uu===dc&&(!h||healed));
    const resolved=g().offer&&g().offer.k==='tile'&&!threw; nChoice++; if(!match||!resolved||!g().arts.every(q=>x.AB_ARTS[q])||g().arts.length>x.AB_ART_MAX){ allOk=false; why=why||id+'/'+ci+' deltas '+J([da,dc,healed])+' wanted '+J(dl)+' offer '+J(g().offer&&g().offer.k); } }
  ok('every choice of every event ('+nChoice+' picks, gambles repeated) resolves without throwing, does what it says (artifacts gained / lost, curses added / lifted, heal) and leads to the tiles',allOk&&nChoice>=24,why);
  ok('eight events, 2-3 choices each, each with a way to walk on; no bad row',Object.keys(x.AB_EVENTS).length===8&&x.AB_EVENT_BAD.length===0&&Object.values(x.AB_EVENTS).every(E=>E.choices.length>=2&&E.choices.length<=3&&E.choices.some(c=>c.fx.length===0)));
  ok('a curse comes from the events: the Altar takes a rare artifact AND adds a curse (outside the 20, repeats stack)',(()=>{ set('ab_ev_altar',bar4,[]); W.receive('k',{t:'abyss',a:'pick',i:0}); tick(1); return g().arts.length===5&&g().curses.length===1&&x.AB_ARTS[g().arts[4]].rar==='rare'&&x.abIsCurse(g().curses[0])&&evs('k','aba').length>0; })());
  // refusals: nothing to lose, too many curses, a full bar
  set('ab_ev_forge',[],[]); W.receive('k',{t:'abyss',a:'pick',i:0}); tick(1); ok('a choice that loses what you do not hold is refused: bar unchanged, the offer stays',g().arts.length===0&&g().offer&&g().offer.k==='event');
  set('ab_ev_altar',bar4,['ab_c_hides','ab_c_dull','ab_c_claws','ab_c_famine','ab_c_frail']); W.receive('k',{t:'abyss',a:'pick',i:0}); tick(1); ok('a curse past AB_CURSE_MAX is refused: 5 curses stay 5, the bar unchanged, the offer stays',g().curses.length===5&&g().arts.length===4&&g().offer.k==='event');
  set('ab_ev_altar',Array.from({length:20},(_,i)=>['ab_edge','ab_fang','ab_heart','ab_scale','ab_thread'][i%5]),[]); W.receive('k',{t:'abyss',a:'pick',i:0}); tick(1); ok('a gain with a full bar of 20 is refused (the 20 never grows); a choice with no gain still works',g().arts.length===20&&g().offer.k==='event'&&(()=>{ W.receive('k',{t:'abyss',a:'pick',i:1}); tick(1); return g().offer.k==='tile'&&Dk.hp===Dk.maxHp; })());
  set('ab_ev_scars',bar4,[]); W.receive('k',{t:'abyss',a:'pick',i:1}); tick(1); ok('lifting a curse with none held is refused',g().offer.k==='event'&&g().curses.length===0);
  W.receive('k',{t:'dg',a:'leave'}); tick(2); }
// Shrines
{ Dk.gear.ab.top=0; x.abKindDev.force='fight'; W.receive('k',{t:'abyss',a:'go',d:0}); tick(2); const r1=kRun(); x.abKindDev.force='shrine'; finish(r1); W.receive('k',{t:'abyss',a:'skip'}); tick(1);
  const g=()=>Dk.gear.ab.run; g().arts.length=0; g().arts.push('ab_edge','ab_edge','ab_fang'); g().curses.length=0; g().curses.push('ab_c_hides','ab_c_dull'); sent.length=0;
  W.receive('k',{t:'abyss',a:'next',i:0}); tick(3); const sh=kRun(); g().arts.push('ab_edge','ab_edge','ab_fang');
  ok('a Shrine round: no fight, plain platforms, won at once, a shrine offer stored (heal first) and sent',sh.abKind==='shrine'&&sh.abWon&&sh.abTile===''&&live(sh).length===0&&g().offer&&g().offer.k==='shrine'&&g().offer.o[0].t==='heal'&&evs('k','abo').some(q=>q[2]==='shrine'));
  // the stored offer is rebuilt for the assertions below with the bar and curses of the test
  const put=(arts,curses)=>{ g().arts.length=0; g().arts.push(...arts); g().curses.length=0; g().curses.push(...curses); g().offer={k:'shrine',o:x.abShrineOfferS(g())}; Dk.ab=null; };
  put(['ab_edge','ab_edge','ab_fang'],['ab_c_hides','ab_c_dull']); const o=g().offer.o;
  ok('the shrine offers: heal, one removal per curse held, a copy of up to 4 artifacts held',o[0].t==='heal'&&o.filter(c=>c.t==='curse').map(c=>c.id).sort().join()==='ab_c_dull,ab_c_hides'&&o.filter(c=>c.t==='copy').length===2&&o.filter(c=>c.t==='copy').every(c=>['ab_edge','ab_fang'].includes(c.id)),J(o));
  Dk.hp=1; W.receive('k',{t:'abyss',a:'pick',i:0}); tick(1); ok('heal: full health, the bar and curses as they were, then the tiles',Dk.hp===Dk.maxHp&&g().arts.length===3&&g().curses.length===2&&g().offer&&g().offer.k==='tile');
  put(['ab_edge','ab_edge','ab_fang'],['ab_c_hides','ab_c_dull']); const ci=g().offer.o.findIndex(c=>c.t==='curse'&&c.id==='ab_c_dull'); sent.length=0; W.receive('k',{t:'abyss',a:'pick',i:ci}); tick(1);
  ok('remove a curse (the one chosen): that curse is gone, the other stays, the tiles follow',J(g().curses)===J(['ab_c_hides'])&&g().offer.k==='tile');
  put(['ab_edge','ab_edge','ab_fang'],[]); const cp=g().offer.o.findIndex(c=>c.t==='copy'&&c.id==='ab_fang'); sent.length=0; W.receive('k',{t:'abyss',a:'pick',i:cp}); tick(1);
  ok('copy an artifact: one more copy of exactly that one (a place used), aba sent, the tiles follow',g().arts.length===4&&g().arts.filter(q=>q==='ab_fang').length===2&&evs('k','aba').some(q=>q[2]==='ab_fang'&&q[3]===2)&&g().offer.k==='tile');
  // copy at 20 is refused (the offer was made with a free place, then the bar filled)
  put(['ab_edge','ab_fang'],[]); const cp2=g().offer.o.findIndex(c=>c.t==='copy'); g().arts.length=0; for(let i=0;i<20;i++) g().arts.push(['ab_edge','ab_fang','ab_heart','ab_scale','ab_thread'][i%5]); g().arts[0]='ab_edge';
  W.receive('k',{t:'abyss',a:'pick',i:cp2}); tick(1); ok('copy with 20 held is refused: the bar stays 20, the offer stays',g().arts.length===20&&g().offer.k==='shrine');
  ok('a shrine made with a full bar offers no copy at all',x.abShrineOfferS(g()).every(c=>c.t!=='copy'));
  put(['ab_edge'],['ab_c_hides']); for(const bad of [-1,9,1.5,'0',null,NaN,{},undefined,true]) W.receive('k',{t:'abyss',a:'pick',i:bad}); tick(1);
  ok('bad indices on a shrine are refused (offer stays)',g().offer.k==='shrine');
  g().offer.o.push({t:'curse',id:'ab_c_frail'}); W.receive('k',{t:'abyss',a:'pick',i:g().offer.o.length-1}); tick(1); ok('a removal of a curse you no longer carry is refused',g().offer.k==='shrine'&&g().curses.length===1);
  g().arts.length=0; g().arts.push('ab_edge'); g().offer.o.push({t:'copy',id:'ab_heart'}); W.receive('k',{t:'abyss',a:'pick',i:g().offer.o.length-1}); tick(1); ok('a copy of an artifact you no longer hold is refused',g().offer.k==='shrine'&&g().arts.length===1);
  W.receive('k',{t:'dg',a:'leave'}); tick(2); }
// the guarantee inside a run: with no Event / Shrine yet, the offer for round 4 always has one
{ x.abKindDev.force=''; Dk.gear.ab.top=0; W.receive('k',{t:'abyss',a:'go',d:0}); tick(2); const r=kRun(); let all=true, all6=true;
  for(let i=0;i<40;i++){ r.abWon=true; r.endT=0; r.abR=3; Dk.gear.ab.run.es=0; Dk.gear.ab.run.offer=null; x.abTileOfferP(Dk); const o=tilesOf(); if(!(o&&o.k==='tile'&&o.o.some(c=>c.kind==='event'||c.kind==='shrine'))) all=false;
    r.abR=5; Dk.gear.ab.run.offer=null; x.abTileOfferP(Dk); const o6=tilesOf(); if(!(o6&&o6.o.every(c=>c.kind==='event'||c.kind==='shrine'))) all6=false; }
  ok('in a real run: the offer for round 4 holds an Event or Shrine card, the offer for round 6 only such cards (none played yet)',all&&all6);
  r.abR=3; Dk.gear.ab.run.es=4; let free=false; for(let i=0;i<60;i++){ Dk.gear.ab.run.offer=null; x.abTileOfferP(Dk); if(!tilesOf().o.some(c=>c.kind==='event'||c.kind==='shrine')) free=true; } ok('...and not forced once es says one was played in the window',free);
  W.receive('k',{t:'dg',a:'leave'}); tick(2); }
// the stored offers survive sanitizing; garbage in a stored offer is cleaned
{ const now=Date.now(), san=o=>clean({run:{d:0,r:3,at:now,offer:o}}).run&&clean({run:{d:0,r:3,at:now,offer:o}}).run.offer;
  ok('tile offers with kinds round-trip; an Event / Shrine card needs no tile, a Trial needs a mode',J(san({k:'tile',o:[{tile:'forest',kind:'elite'},{tile:'',kind:'event'},{tile:'vale',kind:'trial',mode:'gale'}]}))===J({k:'tile',o:[{tile:'forest',kind:'elite'},{tile:'',kind:'event'},{tile:'vale',kind:'trial',mode:'gale'}]}));
  ok('bad cards are dropped: an unknown kind, a boss (weight 0), a Trial without a mode or with a prototype mode, a fight with no tile',J(san({k:'tile',o:[{tile:'forest',kind:'boss'},{tile:'forest',kind:'constructor'},{tile:'vale',kind:'trial'},{tile:'vale',kind:'trial',mode:'__proto__'},{tile:'',kind:'fight'},{tile:'sun',kind:'fight'}]}))===J({k:'tile',o:[{tile:'sun',kind:'fight'}]}));
  ok('event and shrine offers round-trip; unknown ids, prototype names and garbage entries are cleaned',J(san({k:'event',o:{id:'ab_ev_altar'}}))===J({k:'event',o:{id:'ab_ev_altar'}})&&san({k:'event',o:{id:'constructor'}})===null&&san({k:'event',o:'ab_ev_altar'})===null
    &&J(san({k:'shrine',o:[{t:'heal'},{t:'curse',id:'ab_c_hides'},{t:'curse',id:'nope'},{t:'copy',id:'ab_edge'},{t:'copy',id:'__proto__'},{t:'x'},7,null]}))===J({k:'shrine',o:[{t:'heal'},{t:'curse',id:'ab_c_hides'},{t:'copy',id:'ab_edge'}]})&&san({k:'shrine',o:[]})===null);
  ok('es and pk are clamped integers (a bad value is 0)',(()=>{ const q=clean({run:{d:0,r:3,at:now,es:-4,pk:99}}).run, q2=clean({run:{d:0,r:3,at:now,es:'x',pk:NaN}}).run; return q.es===0&&q.pk===3&&q2.es===0&&q2.pk===0; })()); }
x.abKindDev.force=''; x.abKindDev.mode='';
// ---- B9: bosses (shared/abyss/boss.js, server/abyss/boss.js): the pool, the whitelist, the forced and the offered boss rounds, the disc, the kill pays 3 picks and nothing in the world
for(const id of [...W.players.keys()]) W.leave(id); tick(5);   // (the earlier players only slow the ticks of the 24 boss fights)
{ const world15=x.BOSS_DEFS.map(b=>b.def.id).filter(id=>id!=='sinkwarden'), dg8=Object.keys(x.DG_BOSS_DEFS);
  ok('the pool is the 16 world bosses but Pyrrhax (sinkwarden) plus the 8 dungeon bosses: 24, all known',x.AB_BOSS_ALL.length===24&&world15.length===16&&dg8.length===8&&!x.AB_BOSS_ALL.includes('sinkwarden')&&[...world15,...dg8].every(id=>x.AB_BOSS_ALL.includes(id)&&x.abBossRowOf(id)&&x.AB_BOSS_LAND[id]&&x.abTileOf(x.AB_BOSS_LAND[id])),x.AB_BOSS_ALL.length);
  ok('the whitelist is a subset of the pool; every exclusion has a reason; garbage ids are no boss (prototype names too)',x.AB_BOSS_OK.every(id=>x.AB_BOSS_ALL.includes(id))&&x.AB_BOSS_ALL.every(id=>x.AB_BOSS_OK.includes(id)||typeof x.AB_BOSS_OUT[id]==='string'&&x.AB_BOSS_OUT[id])&&['constructor','__proto__','sinkwarden','x',7,null,undefined,{}].every(id=>!x.abBossOk(id)&&!x.abBossRowOf(id)));
  const cnt={}; for(let i=0;i<4800;i++){ const id=x.abBossDrawS(); cnt[id]=(cnt[id]|0)+1; }
  ok('the draw is uniform over the whitelist (every boss comes, none more than twice its share)',x.AB_BOSS_OK.every(id=>cnt[id]>0&&cnt[id]<2*4800/x.AB_BOSS_OK.length)&&Object.keys(cnt).every(id=>x.AB_BOSS_OK.includes(id)),J(cnt));
  ok('abBossDrawS avoids the ids it is given while another is left',(()=>{ const av=x.AB_BOSS_OK.slice(0,x.AB_BOSS_OK.length-1); for(let i=0;i<50;i++) if(x.abBossDrawS(av)!==x.AB_BOSS_OK[x.AB_BOSS_OK.length-1]) return false; return true; })()); }
// the forced and the offered boss rounds
{ const many=(d,r,prev)=>Array.from({length:600},()=>x.abDrawKindsS(d,r,0,3,prev)), allBoss=o=>o.every(k=>k==='boss');
  ok('forced: difficulty I round 7; II 7 and 10; V 7, 13 and 19: every card is a boss there, and in no other round of these',[[0,[7]],[1,[7,10]],[2,[7,13]],[3,[7,13,16]],[4,[7,13,19]]].every(([d,rs])=>{ for(let r=2;r<=x.abRounds(d);r++){ const m=many(d,r,'fight'); if(rs.includes(r)?!m.every(allBoss):m.every(allBoss)) return false; } return true; })&&many(5,25,'fight').every(allBoss));
  const off=Array.from({length:4000},()=>x.abDrawKindsS(5,2,0,3,'fight')).flat(), o1=Array.from({length:4000},()=>x.abDrawKindsS(5,1,0,3)).flat(), op=Array.from({length:4000},()=>x.abDrawKindsS(5,8,0,3,'boss')).flat(), o8=Array.from({length:4000},()=>x.abDrawKindsS(5,8,0,3,'fight')).flat();
  ok('offered: a boss card turns up between the forced rounds (round 2, 8 ...), about its 5% share',off.includes('boss')&&o8.includes('boss')&&Math.abs(off.filter(k=>k==='boss').length/off.length*100-5)<2.5);
  ok('offered: never for round 1, never right after a boss round',!o1.includes('boss')&&!op.includes('boss'));
  ok('the finite last round of a finite difficulty is a boss round even when it is not on the 6-step (II round 10, IV round 16)',x.abIsBossRound(1,10)&&x.abIsBossRound(3,16)&&many(1,10,'fight').every(allBoss)); }
// the disc
{ const lay=x.abLayout('boss:forest',4242), Bk=x.dgBake(lay), mid=lay.mid, cell=2; let hole=0, far=0, nearest=1e9;
  for(let gz=0;gz<Bk.h;gz++) for(let gx=0;gx<Bk.w;gx++){ const d=Math.hypot((gx+0.5)*cell-mid.x,(gz+0.5)*cell-mid.z), open=!!Bk.cells[gz*Bk.w+gx]; if(d<=24&&!open) hole++; if(d>x.AB_BOSS_CELLS*cell+2&&open) far++; }
  ok('a boss tile is a solid disc of at least 24 m radius (no hole inside, nothing past 32 m) with its own tile id and the landing outside the boss circle',hole===0&&far===0&&x.AB_BOSS_CELLS*cell>=24&&lay.tile==='boss:forest'&&Math.hypot(Bk.start.x-mid.x,Bk.start.z-mid.z)>x.DG_BOSS_R+2&&Bk.marks.S.length===0&&!x.dgSolid(Bk,Bk.start.x,Bk.start.z),J([hole,far,Bk.start]));
  ok('the land tile is unchanged (its own id, six tears) and the disc differs from it; abTileBase strips only the prefix',x.abLayout('forest',4242).tile==='forest'&&x.dgBake(x.abLayout('forest',4242)).marks.S.length>0&&x.abTileBase('boss:vale')==='vale'&&x.abTileBase('vale')==='vale'&&x.abTileBase('rift:taproot')==='rift:taproot'&&J(x.abLayout('boss:forest',4242).cells.map(c=>c.art))===J(lay.cells.map(c=>c.art)));
  ok('every whitelisted boss has a land disc that bakes',x.AB_BOSS_OK.every(id=>{ const l=x.abLayout('boss:'+x.AB_BOSS_LAND[id],7), b=x.dgBake(l); return b.start&&!x.dgSolid(b,l.mid.x,l.mid.z); })); }
// a forced boss round in a real run: round 6 won -> three boss cards, different bosses; next -> the round
const Bs=mk('bs',60), bsRun=()=>runOf(Bs), bsLive=run=>[...run.mons].filter(m=>!m.dead&&!m.remove);
x.abKindDev.force=''; x.abKindDev.mode=''; x.abKindDev.boss='';
{ Bs.gear.ab.top=0; W.receive('bs',{t:'abyss',a:'go',d:0}); tick(2); const r1=bsRun(); r1.abWon=true; r1.endT=0; r1.abR=6; Bs.gear.ab.run.offer=null; x.abTileOfferP(Bs); const to=Bs.gear.ab.run.offer;
  ok('round 6 of difficulty I won: the offer holds three boss cards (a boss each, all different, the land of the boss)',to&&to.k==='tile'&&to.o.length===3&&to.o.every(c=>c.kind==='boss'&&x.abBossOk(c.boss)&&c.tile===x.AB_BOSS_LAND[c.boss])&&new Set(to.o.map(c=>c.boss)).size===3,J(to));
  tick(6); const abo=evs('bs','abo').filter(e=>e[2]==='tile').pop(); ok('abo carries [tile, kind, mode, boss id] for a boss card',abo&&abo[3].every((c,i)=>c[1]==='boss'&&c[3]===to.o[i].boss&&c[0]===to.o[i].tile),J(abo));
  ok('the stored offer survives sanitizing; a boss card with no valid boss is dropped',J(clean({run:{d:0,r:6,at:Date.now(),offer:to}}).run.offer)===J(to)&&clean({run:{d:0,r:6,at:Date.now(),offer:{k:'tile',o:[{tile:'forest',kind:'boss'},{tile:'forest',kind:'boss',boss:'constructor'},{tile:'forest',kind:'boss',boss:'sinkwarden'},{tile:'sun',kind:'boss',boss:'sandwyrm'}]}}}).run.offer.o.length===1);
  const pick=1; W.receive('bs',{t:'abyss',a:'next',i:pick}); tick(3); const r=bsRun();
  ok('next: the boss round 7, level 60, the chosen boss on its land disc, a bake circle r = 20 at the disc\'s middle',r&&r.abKind==='boss'&&r.abR===7&&r.L===60&&r.abBoss===to.o[pick].boss&&r.abTile==='boss:'+to.o[pick].tile&&r.B.boss&&r.B.boss.r===20&&r.B.boss.x===r.lay.mid.x&&r.tile&&r.tile.id===to.o[pick].tile,r&&[r.abKind,r.abBoss,r.abTile]);
  ok('abr tells the client the round: the tile string and the kind',evs('bs','abr').some(e=>e[2]===7&&e[4]===60&&e[5]==='boss:'+to.o[pick].tile&&e[6]==='boss'));
  ok('the boss is there at once, belongs to the run (m.inst), at the round level with plain numbers, and no monster but its own adds are in the run',r.boss&&r.boss.m.inst===r.id&&r.boss.m.abBoss&&r.boss.m.boss&&r.boss.m.dgK.lv===60&&Math.abs(r.boss.m.dgK.dmg-x.dgKOf(r.boss.m.def,60).dmg)<1e-9&&r.boss.m.def.id===r.abBoss&&[...r.mons].every(m=>m.inst===r.id)&&r.phase==='boss',r.boss&&r.boss.m.def.id);
  ok('the HUD tuple is the boss round\'s (kind code 5)',r.hud[6]===5,J(r.hud));
  W.receive('bs',{t:'dg',a:'leave'}); tick(2); ok('(a fall in the boss round ends the run)',!Bs.inst&&Bs.gear.ab.run===null); }
// the kill: a boss of a non-final round pays 3 picks and nothing in the world; the last round's boss wins the run
const worldOf=q=>J(Object.assign({},q.gear,{ab:0}))+'|'+q.exp+'|'+q.level+'|'+q.gear.coins;
{ x.abSwitch(true); const w0=worldOf(Bs), mid=bossId=>{ const run=x.abRunNewS(Bs,5,7,undefined,'vale','boss','',bossId); x.abStartRoundS(Bs,run); return run; }, ids=x.AB_BOSS_OK.slice(0,3);
  for(const id of [ids[0],x.AB_BOSS_OK.find(i=>x.AB_BOSS_LAND[i]!=='vale')]){
    const run=mid(id); tick(3); const m=run.boss.m; Bs.x=m.x+4; Bs.z=m.z; for(let i=0;i<40;i++){ Bs.hp=Bs.maxHp; Bs.dead=false; tick(1); }
    const w1=worldOf(Bs); m.hp=0; sent.length=0; x.killMonsterS(m,Bs); tick(3);
    const g=Bs.gear.ab.run;
    ok(id+': the boss\'s death wins the round and pays 3 artifact picks: an offer now, two more owed (pk 2)',run.abWon&&run.phase==='won'&&!run.endT&&g&&g.offer&&g.offer.k==='art'&&g.pk===2,J(g&&[g.offer&&g.offer.k,g.pk]));
    ok(id+': nothing in the world: gear (but gear.ab), XP, level and coins as before; no trophy, zone tier or set roll',worldOf(Bs)===w1&&w1===w0&&!evs('bs','coins').length,'');
    W.receive('bs',{t:'abyss',a:'pick',i:0}); tick(1); const o2=Bs.gear.ab.run.offer; W.receive('bs',{t:'abyss',a:'pick',i:0}); tick(1); const o3=Bs.gear.ab.run.offer;
    ok(id+': three artifact offers in a row, then the tiles',o2&&o2.k==='art'&&o3&&o3.k==='art'&&(W.receive('bs',{t:'abyss',a:'pick',i:0}),tick(1),Bs.gear.ab.run.offer&&Bs.gear.ab.run.offer.k==='tile'));
    W.receive('bs',{t:'dg',a:'leave'}); tick(2); }
  // the last round of a finite difficulty: the boss's death wins the run (no picks, the next difficulty opens)
  Bs.gear.ab.top=0; Bs.gear.ab.clears[0]=0; const last=x.abRunNewS(Bs,0,7,undefined,'forest','boss','',x.AB_BOSS_OK[0]); x.abStartRoundS(Bs,last); tick(3); const m=last.boss.m; Bs.x=m.x+4; Bs.z=m.z; m.hp=0; x.killMonsterS(m,Bs); tick(3);
  ok('difficulty I round 7 (a forced boss): its death wins the run, opens difficulty II and counts the clear',last.abWon&&last.endT>0&&Bs.gear.ab.top===1&&Bs.gear.ab.clears[0]===1&&evs('bs','dge').some(e=>e[2]===1));
  tick(Math.ceil(25/0.05)); ok('...and the hiker is back in the world',!Bs.inst&&Bs.gear.ab.run===null); }
// every whitelisted boss: spawns, engages, fights its kit for 30 s on the disc, dies (default: level 100; node tools/abyss-smoke.js --deep: 60, 100 and 140)
{ const lvls=process.argv.includes('--deep')?[[0,7],[2,13],[4,19]]:[[2,13]], fail=[];
  for(const [d,r] of lvls) for(const id of x.AB_BOSS_OK){
    let why=''; try{
      Bs.gear.ab.top=5; const run=x.abRunNewS(Bs,d,r,undefined,x.AB_BOSS_LAND[id],'boss','',id); x.abStartRoundS(Bs,run); tick(2); const B=run.boss, m=B&&B.m; if(!B){ why='no boss'; throw 0; }
      if(m.inst!==run.id||m.dgK.lv!==x.abRoundLv(d,r)) { why='not the run\'s / not at the round level'; throw 0; }
      for(let i=0;i<600&&!why;i++){ Bs.hp=Bs.maxHp; Bs.dead=false; Bs.x=m.x+(i%200<100?4:-4); Bs.z=m.z+2; if(i%20===0&&m.hp>m.maxHp*0.08) m.hp-=m.maxHp*0.03; tick(1);
        if(!isFinite(m.hp)||!isFinite(m.x)||!isFinite(m.z)) why='non-finite hp / position at tick '+i; else if(x.dgSolid(run.B,m.x-run.ox,m.z-run.oz)) why='off the disc at tick '+i;
        else for(const q of run.mons) if(q.inst!==run.id) why='an add outside the run'; }
      if(!why&&!B.engaged&&!m.dead) why='never engaged';
      if(!why&&x.MONS.some(q=>Math.abs(q.x-run.ox)<200&&Math.abs(q.z-run.oz)<200&&q.inst!==run.id&&!q.remove)) why='a world monster in the slot';
      if(!why){ m.hp=0; x.killMonsterS(m,Bs); tick(3); if(!run.abWon) why='its death did not win the round'; }
    }catch(e){ if(e) why='threw '+(e.message||e); }
    if(why) fail.push(id+'@'+x.abRoundLv(d,r)+': '+why);
    if(Bs.inst){ W.receive('bs',{t:'dg',a:'leave'}); tick(2); if(Bs.inst){ W.receive('bs',{t:'dg',a:'leave'}); tick(2); } } }
  ok('every whitelisted boss ('+x.AB_BOSS_OK.length+' of 24) passes the disc check at '+lvls.map(l=>x.abRoundLv(...l)).join(' / ')+': spawn, engage, 30 s of its kit with no throw and no NaN, stays on the disc, adds in the run, dies and wins the round',fail.length===0,fail.join('; ')); }
// ---- B10: Abyssal Shards and the Abyss shop (server/abyss/pay.js, shared/abyss/shop.js)
{ x.abKindDev.force='fight';
  const pay=(d,r,k)=>x.abShardsOf(d,r,k||'fight'), fl=a=>a.every((v,i)=>i===0||v>=a[i-1]);
  ok('the pay: round 1 of difficulty I is the base, difficulty scales it, ~x1.2 a round, a boss round x2.5, an Event / Shrine nothing, a bad difficulty nothing',pay(0,1)===10&&pay(4,1)===70&&Math.abs(pay(2,10)/pay(2,9)-1.2)<0.02&&Math.abs(pay(1,7,'boss')-pay(1,7)*2.5)<=1.5&&pay(0,3,'event')===0&&pay(0,3,'shrine')===0&&pay(9,1)===0&&pay(-1,1)===0);
  ok('the clear bonus is the last three rounds again (finite difficulties only; Infinite has none)',[0,1,2,3,4].every(d=>{ const n=x.AB_DIFFS[d].rounds; return x.abClearBonus(d)===pay(d,n-2)+pay(d,n-1)+pay(d,n); })&&x.abClearBonus(5)===0);
  // shards a minute rise with depth: the marginal rate of every next round (a rough round time x.AB_ROUND_S) and the average of a run that stops at round R
  const kindOf=(d,r)=>x.abIsBossRound(d,r)?'boss':'fight';
  const rise=[0,1,2,3,4,5].every(d=>{ const n=x.AB_DIFFS[d].rounds||40; let S=0,T=0,last=0,lastM=0; for(let r=1;r<=n;r++){ const k=kindOf(d,r), p=pay(d,r,k), t=x.AB_ROUND_S(r,k); S+=p; T+=t; const avg=S/T, m=p/t; if(avg<last||m<lastM*0.999) return false; last=avg; lastM=m; } return true; });
  ok('shards a minute never fall with depth: the marginal rate and the average of a run to round R rise at every round of every difficulty',rise);
  ok('dying at round 15 of difficulty V pays far more than three runs to round 5',(()=>{ let a=0,b=0; for(let r=1;r<=15;r++) a+=pay(4,r,kindOf(4,r)); for(let r=1;r<=5;r++) b+=pay(4,r); return a>3*b; })());
  const total=d=>{ let s=x.abClearBonus(d); for(let r=1;r<=x.AB_DIFFS[d].rounds;r++) s+=pay(d,r,kindOf(d,r)); return s; };
  const V=total(4); ok('a difficulty V clear pays about one Void Anchor / one Abyss Heart at the base price, a Prism is about three clears',x.abShopRow('lock').price>=V*0.9&&x.abShopRow('lock').price<=V*1.2&&x.abShopRow('heart').price===x.abShopRow('lock').price&&x.abShopRow('prism').price===3*x.abShopRow('lock').price,'V clear '+V);
  console.log('     shards a run (rounds + clear bonus): '+[0,1,2,3,4].map(d=>x.AB_DIFFS[d].id+' '+total(d)).join(', '));
  ok('the shop rows: unique ids, common rows with a daily stock and an essence the game knows, specials open at III / IV / V',(()=>{ const ids=new Set(x.AB_SHOP.map(r=>r.id)); return ids.size===x.AB_SHOP.length&&x.AB_SHOP.every(r=>(r.kind==='common'?r.day>=1&&r.open===0:r.day===undefined&&r.open>=3)&&r.price>0&&r.give.n>=1&&(!/^ess_/.test(r.give.to)||x.essOf(r.give.to)))&&x.abShopRow('heart').open===3&&x.abShopRow('lock').open===4&&x.abShopRow('prism').open===5; })());
  ok('abShopRow and the specials\' price: own ids only; x1.5 a copy bought today',x.abShopRow('__proto__')===null&&x.abShopRow('constructor')===null&&x.abShopRow(7)===null&&x.abShopRow('toString')===null&&x.abShopPrice(x.abShopRow('lock'),0,1)===20000&&x.abShopPrice(x.abShopRow('lock'),2,1)===45000&&x.abShopPrice(x.abShopRow('lock'),0,2)===50000&&x.abShopPrice(x.abShopRow('rsw'),3,2)===120);
  // a round won pays at once and a fall keeps it
  const SP=mk('sp',60); SP.gear.ab.top=0; SP.gear.ab.as=0; const w0=[SP.gear.coins,SP.level,SP.exp];
  sent.length=0; W.receive('sp',{t:'abyss',a:'go',d:0}); tick(2); let run=runOf(SP); upto(run,600);
  ok('round 1 won: its shards are credited at once (the balance, the abs event, a toast)',SP.gear.ab.as===pay(0,1)&&evs('sp','abs').some(e=>e[2]===1&&e[3]===pay(0,1)&&e[4]===0&&e[5]===pay(0,1))&&sent.some(q=>q[1].t==='snap'&&(q[1].ev||[]).some(e=>e&&e[0]==='toast'&&e[1]==='sp'&&/\+\d+ Abyssal Shards/.test(e[2]))),J(SP.gear.ab.as));
  W.receive('sp',{t:'abyss',a:'skip'}); W.receive('sp',{t:'abyss',a:'next',i:0}); tick(2); run=runOf(SP); upto(run,600);
  ok('round 2 adds its own (more than round 1)',SP.gear.ab.as===pay(0,1)+pay(0,2)&&pay(0,2)>pay(0,1));
  W.receive('sp',{t:'abyss',a:'skip'}); W.receive('sp',{t:'abyss',a:'next',i:0}); tick(2); const run3=runOf(SP); const kept=SP.gear.ab.as; SP.hp=0; SP.dead=true; SP.deadT=0; tick(Math.ceil(4/0.05));
  ok('a fall in round 3 keeps every shard of the rounds won, and pays nothing for the lost round; no coins, XP or level from the Abyss',!SP.inst&&SP.gear.ab.as===kept&&kept===pay(0,1)+pay(0,2)&&SP.gear.coins===w0[0]&&SP.level===w0[1]&&SP.exp===w0[2]);
  // the last round: its pay and the clear bonus
  SP.gear.ab.as=0; const last=x.abRunNewS(SP,0,7,undefined,'forest','fight'); x.abStartRoundS(SP,last); tick(2); sent.length=0; upto(last,600);
  ok('the last round of difficulty I pays its round and the clear bonus (the abs event names the bonus)',SP.gear.ab.as===pay(0,7)+x.abClearBonus(0)&&evs('sp','abs').some(e=>e[4]===x.abClearBonus(0)&&e[3]===pay(0,7)+x.abClearBonus(0)),J(SP.gear.ab.as)); tick(Math.ceil(25/0.05)); SP.hp=SP.maxHp;
  // a cap: the balance never passes AB_AS_MAX
  SP.gear.ab.as=x.AB_AS_MAX-3; W.receive('sp',{t:'abyss',a:'go',d:0}); tick(2); upto(runOf(SP),600); ok('the balance stops at AB_AS_MAX',SP.gear.ab.as===x.AB_AS_MAX); W.receive('sp',{t:'dg',a:'leave'}); tick(2); W.receive('sp',{t:'dg',a:'leave'}); tick(2); SP.gear.ab.run=null;
}
// guests earn no shards (a second server with accounts: a guest at level 60 and a registered hiker through the same hook)
{ const {memoryAccounts}=require('./headless'), {store,auth}=memoryAccounts(), sent2=[];
  const L2=loadServer({dev:false,log(){},store,auth,send(to,m){ sent2.push([to,m]); }},['abPayRoundP','isGuestP']); const W2=L2.api, x2=L2.x;
  W2.join('gu',{acct:'g'.repeat(32),name:'Guesty',look:{cls:'warrior'},save:{level:60}}); W2.join('rg',{acct:'r'.repeat(32),name:'Regis',look:{cls:'warrior'},save:{level:60}}); for(let i=0;i<40;i++) W2.tick(0.05);
  const G=W2.players.get('gu'), R=W2.players.get('rg'); G.acct='g'.repeat(32); G.user=undefined; R.acct='user:regis'; R.user='Regis'; const fake={abD:0,abR:1,abKind:'fight'};
  x2.abPayRoundP(G,fake,false); x2.abPayRoundP(R,fake,false);
  ok('a guest is a guest and earns no shards; a registered hiker does',x2.isGuestP(G)&&!x2.isGuestP(R)&&(G.gear.ab.as|0)===0&&R.gear.ab.as===10,J([G.gear.ab&&G.gear.ab.as,R.gear.ab&&R.gear.ab.as])); }
// the shop
{ const SP=W.players.get('sp'); SP.hp=SP.maxHp; SP.dead=false; const shop=()=>{ sent.length=0; W.receive('sp',{t:'abyss',a:'shop'}); return abm('sp').filter(m=>m.a==='shop').pop(); };
  const buy=(id,n)=>{ W.receive('sp',{t:'abyss',a:'buy',id,n}); tick(1); };
  const snap=()=>J([SP.gear.ab,SP.gear.rsw,SP.gear.rsa,SP.gear.rsr,SP.gear.temper,SP.gear.coins,SP.gear.awm]);
  const realNow=Date.now; let off=0; Date.now=()=>realNow()+off*86400000;
  try{
  SP.gear.ab.top=2; SP.gear.ab.as=10000; SP.gear.rsw=0; let sh=shop(); const row=id=>sh.rows.find(r=>r.id===id);
  ok('the shop info: the balance, one row per item, daily stock, locked specials with their difficulty',sh&&sh.as===10000&&sh.rows.length===x.AB_SHOP.length&&row('rsw').left===5&&row('rsw').price===60&&row('lock').left===-1&&row('heart').ok===0&&row('heart').open===3&&row('rsw').ok===1&&sh.d===x.gsDayOf(Date.now()),J(sh&&sh.rows&&row('heart')));
  buy('rsw',2); ok('a common item within stock: charged, granted, the stock goes down',SP.gear.ab.as===10000-120&&SP.gear.rsw===2&&SP.gear.ab.sh.n.rsw===2&&shop().rows.find(r=>r.id==='rsw').left===3);
  buy('rsw',4); ok('more than the stock left is refused and charges nothing',SP.gear.ab.as===9880&&SP.gear.rsw===2);
  buy('rsw',3); buy('rsw',1); ok('the last of the stock sells, then it is sold out',SP.gear.rsw===5&&SP.gear.ab.as===10000-300&&shop().rows.find(r=>r.id==='rsw').left===0);
  buy('coins',1); buy('temper',2); buy('echo',1); buy('ess_prime',1); buy('rsr',1); buy('rsa',1);
  ok('the other common rows grant what the real saves hold (coins, Tempering Stones, Echo Shards, Prime Essence, the stones)',SP.gear.temper>=2&&SP.gear.awm.echo>=1&&SP.gear.awm.ess_prime===1&&SP.gear.rsr>=1&&SP.gear.rsa>=1&&sent.length>=0);
  off=1; sh=shop(); ok('the next UTC day the stock is back',row('rsw').left===5&&SP.gear.ab.sh.n.rsw===undefined&&SP.gear.ab.sh.d===x.gsDayOf(Date.now())); buy('rsw',5); ok('...and sells again',SP.gear.rsw===10);
  // specials: locked until the difficulty is beaten
  SP.gear.ab.as=1e8; let b=snap(); buy('heart',1); ok('the Abyss Heart is refused before difficulty III is beaten (top 2): nothing charged, nothing granted',snap()===b);
  SP.gear.ab.top=3; buy('heart',1); ok('...and sold after it (top 3)',!!SP.gear.awm.abyss&&SP.gear.awm.abyss===1&&SP.gear.ab.as===1e8-20000);
  b=snap(); buy('lock',1); ok('the Void Anchor needs difficulty IV (top 3 refused)',snap()===b); SP.gear.ab.top=4; buy('lock',1); ok('...top 4: sold, gear.ab.lock 1',SP.gear.ab.lock===1);
  b=snap(); buy('prism',1); ok('the Ascendant Prism needs difficulty V (top 4 refused)',snap()===b); SP.gear.ab.top=5; const a0=SP.gear.ab.as; buy('prism',1); ok('...top 5: sold at the base price, gear.ab.prism 1',SP.gear.ab.prism===1&&a0-SP.gear.ab.as===60000);
  // the price rises with every one bought today, and resets next day
  SP.gear.ab.as=1e8; const p0=SP.gear.ab.as; buy('prism',1); const p1=p0-SP.gear.ab.as; buy('prism',2); const p2=p0-p1-SP.gear.ab.as;
  ok('a special costs x1.5 more for each one bought today: the 2nd 90,000, then two more 135,000 + 202,500',p1===90000&&p2===135000+Math.ceil(60000*1.5**3)&&SP.gear.ab.prism===4,J([p1,p2]));
  ok('the shop shows the next price and an unlimited special',shop().rows.find(r=>r.id==='prism').price===Math.ceil(60000*1.5**4)&&row('prism').left===-1);
  buy('lock',1); ok('another special keeps its own count (the Void Anchor\'s 2nd copy costs 30,000)',SP.gear.ab.sh.n.lock===2);
  off=2; ok('the next day every special is at its base price again',shop().rows.find(r=>r.id==='prism').price===60000&&row('lock').price===20000&&SP.gear.ab.sh.n.prism===undefined);
  // refusals
  SP.gear.ab.as=7; b=snap(); buy('rsw',1); buy('prism',1); ok('not enough shards: refused, nothing charged, nothing granted',snap()===b);
  SP.gear.ab.as=1e8; b=snap(); for(const id of ['__proto__','constructor','toString','hasOwnProperty','','nope',7,null,undefined,{},[],'rsw ','RSW']) for(const n of [1,2]){ try{ x.abBuyP(SP,id,n); }catch(e){ ok('abBuyP throws on id '+J(id),false,e.message); } }
  ok('bad ids (__proto__, constructor, toString, unknown, numbers, objects) are refused: nothing charged, nothing granted',snap()===b);
  b=snap(); for(const n of [0,-1,1e9,1.5,'2','1',NaN,Infinity,null,undefined,{},100,x.AB_BUY_MAX+1]){ try{ x.abBuyP(SP,'temper',n); W.receive('sp',{t:'abyss',a:'buy',id:'temper',n}); }catch(e){ ok('abBuyP throws on n '+J(n),false,e.message); } }
  ok('bad counts (0, -1, 1e9, 1.5, strings, NaN, Infinity, null, 100) are refused: nothing charged, nothing granted',snap()===b);
  b=snap(); for(const m of [{id:'rsw'},{n:1},{id:'__proto__',n:1},{id:'constructor',n:1}]) W.receive('sp',Object.assign({t:'abyss',a:'buy'},m)); ok('messages without an id or a count change nothing',snap()===b);
  SP.gear.rsw=x.RL_STONE_MAX; SP.gear.ab.sh.n={}; SP.gear.ab.as=1000; b=snap(); buy('rsw',1); ok('a full pile (no room for the goods) refuses before charging',snap()===b); SP.gear.rsw=0;
  SP.gear.ab.sh.n={}; SP.gear.ab.prism=x.AB_PRISM_MAX; SP.gear.ab.as=1e9; b=snap(); buy('prism',1); ok('the Prism count cap refuses before charging',snap()===b); SP.gear.ab.prism=0;
  // inside a run: no shopping
  SP.gear.ab.as=1000; W.receive('sp',{t:'abyss',a:'go',d:0}); tick(2); b=snap(); const inRun=!!SP.inst; buy('rsw',1); ok('no buying inside a run',inRun&&SP.gear.ab.as===1000&&SP.gear.rsw===0); W.receive('sp',{t:'dg',a:'leave'}); tick(2); W.receive('sp',{t:'dg',a:'leave'}); tick(2);
  // level and flag
  const LOW=mk('lw',39); LOW.gear.ab.as=1000; W.receive('lw',{t:'abyss',a:'buy',id:'rsw',n:1}); ok('level 39 cannot buy',LOW.gear.ab.as===1000&&!LOW.gear.rsw);
  x.abSwitch(false); SP.gear.ab.as=1000; W.receive('sp',{t:'abyss',a:'buy',id:'rsw',n:1}); ok('flag off: the shop is silence',SP.gear.ab.as===1000); x.abSwitch(true);
  // the day state and the save round-trip
  off=0; SP.gear.ab.as=5000; buy('rsw',1); const rt=x.sanitizeGear(JSON.parse(J(SP.gear)),'warrior'); ok('today\'s purchases and the Abyss goods survive a save (sanitizeGear)',J(rt.ab.sh)===J(SP.gear.ab.sh)&&rt.ab.as===SP.gear.ab.as&&rt.ab.prism===SP.gear.ab.prism&&rt.ab.lock===SP.gear.ab.lock&&(rt.awm.abyss|0)===(SP.gear.awm.abyss|0),J(rt.ab.sh));
  const wk=x.sanitizeGear({awm:{abyss:1e12,__proto__:{x:1}},ab:{prism:1e12}},'warrior'); ok('the Heart and the Prism are capped by the sanitizer',wk.awm.abyss===99999&&wk.ab.prism===x.AB_PRISM_MAX,J([wk.awm,wk.ab.prism]));
  }finally{ Date.now=realNow; }
}
x.abKindDev.force=''; x.abKindDev.mode=''; x.abKindDev.boss='';
// the Test: kill the code and the test fails (see the usage note at the top)
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
