// Rifts (shared/rift.js, shared/rift/shardmere.js, server/rift.js), straight from src/, no build: the energy clock (full in 28 h, online and offline, the cap, save cleaning), the tear in the
// wild (outside every village, off the roads, its clearing free of camps), the window, a solo run in a rift slot (never a dungeon's), the void lets hits through, XP only (3x a same-level
// world kill, x2 with the Double, no coins / items / materials), the Double's price and refund, the waves (75% / 40 s, the cap, the Herald), the clear bonus, one respawn, leaving.
// Step 17a (the elemental rifts): the Taproot (shared/rift/taproot.js, Wildwood's root rift) pays Prime Essence (gear.awm.ess_prime, about 12 a full run by the waves reached, x2 doubled, no XP, no coins),
// opens at level 28, its monsters carry its element, every elemental rift shares one plan (defineElemRift leaves a drifting file out), the Shardmere is unchanged, and an Awakening purchase spends the Essence.
// Usage: node tools/rift-smoke.js
const {loadServer}=require('./load');
const sent=[];
const {api:W,x}=loadServer({dev:false,send(to,m){ sent.push([to,m]); }},['RIFT_DEFS','RIFT_BAD','defineRift','RIFT_PAY','RIFT_MON_DEFS','RIFT_E_MAX','RIFT_E_MS','RIFT_E_DOUBLE','RIFT_WAVES','RIFT_ALIVE_MAX','RIFT_SLOT0',
  'RIFT_HP_K','RIFT_DMG_K','RIFT_SPEED_K','riftShapeBad','ALL_MON_DEFS','RIFT_BONUS_KILLS','riftEnergyAt','riftWaveSize','riftNear','riftLayout','DG_RUNS','DG_SLOT_RUN','DG_DG_SLOTS','DG_MAX_INST','DG_KITS','DG_MISSIONS','dgPoolS','dgBake','dgSolid',
  'dgHitOkS','dgWallAtS','DEF_BY_ID','MON_DEFS','sanitizeGear','getH','vilAt','inVillage','nearRoad','landAt','waCoast','CAMPS','killMonsterS','xpFor','defAt','dgKOf','MONS','S','dgLaunchS','DG_THEMES',
  'RIFT_ELEM_LV','RIFT_ESS_FULL','RIFT_ELEM_SLOTS','riftEssFor','defineElemRift','riftMobDef','RIFT_DOORS','ESS_ORDER','essOf','foeMult','awkTierCost','awkTierP','awkGrantP','MAT_MAX','MAT_IDS','rdMatsOf']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined?'  ('+i+')':'')); if(!c) fails++; };
const tick=(n,dt)=>{ for(let i=0;i<n;i++) W.tick(dt||0.05); };
const msgs=(to,t)=>sent.filter(s=>s[0]===to&&s[1].t===t).map(s=>s[1]);
const R=x.RIFT_DEFS.shardmere, H=3600000;
const shardIds=[...R.kinds.map(k=>k.id),R.herald];
ok('the Shardmere is defined, nothing left out, seven glass kinds with the look flag',!!R&&!x.RIFT_BAD.length&&shardIds.length===7&&shardIds.every(id=>{ const d=x.DEF_BY_ID[id]; return d&&d.rift&&d.pal.glass&&d.pal.tint&&x.RIFT_MON_DEFS.includes(d); }),JSON.stringify(x.RIFT_BAD));
{ const base=id=>x.ALL_MON_DEFS.find(d=>d.id===id);
  ok('glass monsters run twice as fast as the kind they copy',x.RIFT_SPEED_K===2&&x.RIFT_MON_DEFS.every(d=>base(d.riftOf)&&Math.abs(d.speed-2*base(d.riftOf).speed)<1e-9),x.RIFT_MON_DEFS.filter(d=>!base(d.riftOf)||d.speed!==2*base(d.riftOf).speed).map(d=>d.id).join());
  const Rs=Object.values(x.RIFT_DEFS), keys=Rs.map(r=>JSON.stringify(x.riftLayout(r).cells.map(c=>[c.x,c.z,c.mask])));
  const bakes=Rs.map(r=>{ const L=x.riftLayout(r), B=x.dgBake(L), O=(r.shape||['O']).join('').split('O').length-1; return {id:r.id,ok:!!B&&!!B.start&&B.marks.S.length===(r.shape?2*O:8)}; });
  ok('every rift has its own platform shape (the Shardmere the plus), each bakes with its hub and two tears a platform',new Set(keys).size===Rs.length&&!R.shape&&Rs.filter(r=>r.id!=='shardmere').every(r=>r.shape)&&bakes.every(b=>b.ok),bakes.filter(b=>!b.ok).map(b=>b.id).join());
  ok('a bad shape is refused (two hubs, a cut-off platform)',!!x.riftShapeBad(['HOH'])&&!!x.riftShapeBad(['HO.','..O'])&&x.riftShapeBad(['.O.','OHO','.O.'])===''); }
{ const n=x.RIFT_BAD.length, bad=x.defineRift(Object.assign({},R,{id:'badreward',reward:'gold'}));
  ok('the Shardmere pays XP (its reward mode, default xp, has a payer); an unknown reward mode is left out',R.reward==='xp'&&typeof x.RIFT_PAY.xp.kill==='function'&&!bad&&x.RIFT_BAD.length===n+1&&!x.RIFT_DEFS.badreward,JSON.stringify(x.RIFT_BAD));
  x.RIFT_BAD.length=n; }
ok('the Shardmere is unchanged: XP mode, opens at 10, the old tear and the old kind plan',R.reward==='xp'&&R.lv===10&&R.door.x===-124&&R.door.z===104&&!R.essence&&R.kinds.map(k=>k.id+':'+k.from+':'+k.w).join()==='riftmite:1:4,riftbeetle:1:2,riftfox:2:3,riftwisp:3:2,riftbat:4:2,riftborn:5:2');
ok('the glass kinds are not world monsters (no camps, no board quests)',x.RIFT_MON_DEFS.every(d=>!x.MON_DEFS.includes(d)&&!x.CAMPS.some(c=>c.def===d)));
ok('rift is not a dungeon mission: the Delve board never deals it, but its kit is there',!x.DG_MISSIONS.rift&&!x.dgPoolS().includes('rift')&&!!x.DG_KITS.rift);
// the tear: in the wild
const D=R.door;
ok('the tear stands in the home forest, outside every village, off the roads and the coast',x.landAt(D.x,D.z)==='home'&&!x.inVillage(D.x,D.z)&&!x.nearRoad(D.x,D.z,10)&&x.waCoast(D.x,D.z)>60);
ok('its clearing is kept free (riftNear), and no camp stands in it',x.riftNear(D.x+10,D.z,0)&&!x.riftNear(D.x+60,D.z,0)&&x.CAMPS.every(c=>Math.hypot(c.x-D.x,c.z-D.z)>20));
// the energy clock
const T0=1.7e12;
ok('a new save is full; the refill is 100 in 28 h, about 16.8 min a point, capped',x.riftEnergyAt(null,T0)===100&&Math.abs(x.riftEnergyAt({e:0,at:T0},T0+28*H)-100)<1e-9&&Math.abs(x.riftEnergyAt({e:0,at:T0},T0+14*H)-50)<1e-9&&x.riftEnergyAt({e:90,at:T0},T0+99*H)===100&&Math.abs(x.RIFT_E_MS/60000-16.8)<1e-9);
{ const g=x.sanitizeGear({rift:{e:250,at:Date.now()+9e9,best:'x',clears:-4}},'warrior'), g2=x.sanitizeGear({rift:{e:-5,at:'zz'}},'warrior'), g3=x.sanitizeGear({},'warrior');
  ok('save cleaning: energy clamped, a future clock is now, junk counts 0, an old save starts full',g.rift.e===100&&g.rift.at<=Date.now()&&g.rift.best===0&&g.rift.clears===0&&g2.rift.e===0&&isFinite(g2.rift.at)&&g3.rift.e===100); }
// a hiker at the tear
W.join('a',{name:'Alice',look:{cls:'warrior'},save:{level:40}}); tick(2);
const A=W.players.get('a'), at=(p,dx)=>{ p.x=D.x+(dx||2); p.z=D.z; p.y=x.getH(p.x,p.z); };
at(A,200); W.receive('a',{t:'rift',a:'go',x2:0}); ok('away from the tear: no run',!A.inst);
at(A); W.receive('a',{t:'rift',a:'open'}); const inf=msgs('a','rift').pop();
ok('the window: energy, time to full, level, cost',inf&&inf.a==='info'&&inf.e===100&&inf.full===0&&inf.L===40&&inf.cost===20);
// a doubled run
W.receive('a',{t:'rift',a:'go',x2:1}); const run=[...x.DG_RUNS.values()].find(r=>r.rift);
ok('the run starts in a rift slot, solo, at your level, doubled, 20 energy spent',!!run&&run.slot>=x.RIFT_SLOT0&&run.slot<x.DG_MAX_INST&&A.inst===run.id&&run.L===40&&run.x2&&run.members.size===1&&!run.party&&Math.abs(A.gear.rift.e-80)<0.01,run&&run.slot);
ok('the tp builds the rift on the client: mission rift, its theme',(()=>{ const tp=msgs('a','tp').pop(); return tp&&tp.dg&&tp.dg.m==='rift'&&tp.dg.th==='shardmere'; })());
ok('the void blocks walking but no hit or projectile',run.B.open&&x.dgSolid(run.B,2,2)&&!x.dgWallAtS(run.ox+2,run.oz+2));
// leaving before the first kill refunds
W.receive('a',{t:'dg',a:'leave'});
ok('leaving before a kill: back at the tear, the run closed, the energy back',!A.inst&&!x.DG_RUNS.has(run.id)&&Math.abs(A.gear.rift.e-100)<0.01&&Math.hypot(A.x-D.x,A.z-D.z)<5);
// a dungeon never takes a rift slot
{ const T=x.DG_THEMES.bare, r2=x.dgLaunchS(A,T,'purge',{L:30,back:{x:A.x,z:A.z},dev:true}); ok('a dungeon run takes a dungeon slot',r2&&r2.slot<x.DG_DG_SLOTS); if(r2){ W.receive('a',{t:'dg',a:'leave'}); tick(1300); } }
// a plain run: waves and XP
at(A); A.dead=false; A.hp=A.maxHp; W.receive('a',{t:'rift',a:'go',x2:0});
const r=[...x.DG_RUNS.values()].find(q=>q.rift); ok('a plain run spends no energy',!!r&&!r.x2&&Math.abs(A.gear.rift.e-100)<0.01);
A.vbGrace=1e12; const keepAlive=()=>{ A.hp=A.maxHp; A.dead=false; };
tick(Math.ceil(5.2/0.05)); keepAlive();
ok('after the count-down wave 1 comes: 14 monsters on their way',r.k.w===1&&r.k.size===14&&r.hud[0]===1,r.k.w+' '+r.k.size);
tick(Math.ceil(11/0.05),0.05); keepAlive();
const live=()=>[...r.mons].filter(m=>!m.dead&&!m.remove);
ok('wave 1 has poured in at the tears: glass kinds, at your level, brittle',live().length===14&&live().every(m=>m.def.rift&&m.dgK.lv===40&&Math.abs(m.dgK.dmg-x.dgKOf(m.def,40).dmg*x.RIFT_DMG_K)<1e-9),live().length);
{ const m=live()[0]; ok('its health is 0.6 of a world monster of its level',Math.abs(m.maxHp*m.dgK.hp-x.defAt(m.def,40).hp*x.RIFT_HP_K)/(m.maxHp*m.dgK.hp)<0.02,m.maxHp*m.dgK.hp+' vs '+x.defAt(m.def,40).hp); }
ok('a hit from across the void lands (no line-of-sight wall)',x.dgHitOkS(live()[0],A,r.ox+2,r.oz+2));
// a kill: 3x the world's XP, nothing else
const coins0=A.gear.coins, inv0=A.gear.inv.length, mats0=JSON.stringify(A.gear.mats), mb=[...r.members.values()][0], xp0=mb.got.xp;
{ const m=live()[0]; m.hp=0; x.killMonsterS(m,A); }
ok('a kill pays 3x a same-level world kill',Math.abs(mb.got.xp-xp0-3*x.xpFor(40))<1e-6,(mb.got.xp-xp0)+' vs '+3*x.xpFor(40));
ok('and no coins, items or materials',A.gear.coins===coins0&&A.gear.inv.length===inv0&&JSON.stringify(A.gear.mats)===mats0);
// the next wave at 75% dead
for(const m of live().slice(0,10)){ m.hp=0; x.killMonsterS(m,A); }
tick(2); keepAlive(); ok('75% of wave 1 dead: wave 2 comes',r.k.w===2&&r.k.size===16);
// the 40 s rule
tick(Math.ceil(41/0.05)); keepAlive(); ok('40 s later wave 3 comes even with monsters left',r.k.w===3,r.k.w);
ok('never more than 45 alive',live().length<=x.RIFT_ALIVE_MAX);
// wave 5 has a Herald
for(let i=0;i<200&&r.k.w<5&&!r.endT;i++){ for(const m of live()){ m.hp=0; x.killMonsterS(m,A); } tick(20); keepAlive(); }
tick(Math.ceil(6/0.05)); keepAlive();
ok('wave 5 brings the Rift Herald, x8 health',live().some(m=>m.def.id==='riftherald'&&m.maxHp*m.dgK.hp>x.defAt(m.def,40).hp*x.RIFT_HP_K*7));
// one respawn, then the run is lost on the second knock-out
A.vbGrace=0; A.hp=0; A.dead=true; A.deadT=0; tick(Math.ceil(5.5/0.05));
ok('a knock-out: back on the hub 5 s later',!A.dead&&A.inst===r.id&&!r.endT);
A.hp=0; A.dead=true; A.deadT=0; tick(Math.ceil(5.5/0.05));
ok('a second knock-out ends the run as lost (results sent)',r.phase==='lost'&&!!r.endT&&msgs('a','snap').some(s=>(s.ev||[]).some(e=>e[0]==='dge'&&e[2]===0)));
tick(Math.ceil(21/0.05)); ok('20 s later you are back at the tear',!A.inst&&Math.hypot(A.x-D.x,A.z-D.z)<5);
// a whole clear, doubled: the bonus
at(A); A.dead=false; A.hp=A.maxHp; A.vbGrace=1e12; W.receive('a',{t:'rift',a:'go',x2:1});
const c=[...x.DG_RUNS.values()].find(q=>q.rift&&!q.endT), cm=[...c.members.values()][0];
for(let i=0;i<4000&&!c.endT;i++){ for(const m of [...c.mons]) if(!m.dead&&!m.remove){ m.hp=0; x.killMonsterS(m,A); } tick(4); keepAlive(); }
const kills=cm.got.kills, want=(kills*3+x.RIFT_BONUS_KILLS)*x.xpFor(40)*2;
ok('all 10 waves cleared: won, the clear saved',c.phase==='won'&&A.gear.rift.clears===1&&A.gear.rift.best>0,c.phase+' wave '+c.k.w);
ok('230 monsters and two Heralds in all',kills===232,kills);
ok('doubled: every kill and the clear bonus (75 kills\' worth) x2',Math.abs(cm.got.xp-want)/want<1e-9,cm.got.xp+' vs '+want);
// ---- step 17a: the Taproot, an elemental rift paying Prime Essence ----
tick(Math.ceil(21/0.05));   // (back at the tear)
const TR=x.RIFT_DEFS.taproot, TD=TR&&TR.door, awm=()=>A.gear.awm.ess_prime|0, exp0=()=>A.exp+A.level*1e9;
const trIds=TR?[...TR.kinds.map(k=>k.id),TR.herald]:[];
ok('the Taproot registers: nothing left out, essence mode, Prime, earth, opens at 28, the shared kind plan',!!TR&&!x.RIFT_BAD.length&&TR.reward==='essence'&&TR.essence==='prime'&&TR.el==='earth'&&TR.lv===28&&x.RIFT_ELEM_LV===28&&
  TR.kinds.map(k=>k.from+':'+k.w).join()===x.RIFT_ELEM_SLOTS.map(k=>k.from+':'+k.w).join()&&typeof x.RIFT_PAY.essence.clear==='function'&&x.RIFT_DOORS.some(d=>d.id==='taproot'),JSON.stringify(x.RIFT_BAD));
ok('its seven glass kinds carry its element (so the wheel applies) and the glass look',trIds.length===7&&trIds.every(id=>{ const d=x.DEF_BY_ID[id]; return d&&d.rift&&d.el==='earth'&&d.pal.glass&&d.pal.tint; })&&x.foeMult('air',TR.el)>1&&x.foeMult('earth',TR.el)<1);
ok('its tear is in the home forest wilds like the Shardmere\'s: no village, off roads and coast, far from the first tear, its clearing kept free',x.landAt(TD.x,TD.z)==='home'&&!x.inVillage(TD.x,TD.z)&&!x.nearRoad(TD.x,TD.z,10)&&x.waCoast(TD.x,TD.z)>60&&Math.hypot(TD.x-D.x,TD.z-D.z)>250&&x.riftNear(TD.x+10,TD.z,0)&&x.CAMPS.every(c=>Math.hypot(c.x-TD.x,c.z-TD.z)>20),TD.x+','+TD.z);
ok('the Essence table: 12 for a full run, by the waves reached (about 1.2 a wave)',x.RIFT_ESS_FULL===12&&x.riftEssFor(10)===12&&x.riftEssFor(5)===6&&x.riftEssFor(0)===0&&x.riftEssFor(99)===12&&[...Array(10).keys()].every(i=>x.riftEssFor(i+1)>=x.riftEssFor(i)));
// every elemental rift (the Taproot and any data file copied from it): the same checks, so a new file is tested the moment it is in the manifest
for(const id of Object.keys(x.RIFT_DEFS).filter(i=>x.RIFT_DEFS[i].reward==='essence')){
  const E=x.RIFT_DEFS[id], d=E.door, ids=[...E.kinds.map(k=>k.id),E.herald], others=x.RIFT_DOORS.filter(o=>o.id!==id);
  ok('elemental rift '+id+': opens at 28, six kinds on the shared plan, monsters of its element '+E.el+', pays '+E.essence+' Essence',E.lv===28&&E.kinds.length===6&&E.kinds.map(k=>k.from+':'+k.w).join()===x.RIFT_ELEM_SLOTS.map(k=>k.from+':'+k.w).join()&&
    ids.every(i=>{ const m=x.DEF_BY_ID[i]; return m&&m.rift&&m.el===E.el&&m.pal.glass&&m.pal.tint; })&&(E.essence==='prime'||E.essence===E.el)&&x.essOf('ess_'+E.essence)&&x.RIFT_BAD.length===0,JSON.stringify(x.RIFT_BAD));
  ok('elemental rift '+id+': its tear is in one of the first four lands, outside villages, off roads and the coast, 250 m from every other tear, no camp in its clearing',['home','vale','hoar','grey'].includes(x.landAt(d.x,d.z))&&!x.inVillage(d.x,d.z)&&!x.nearRoad(d.x,d.z,10)&&x.waCoast(d.x,d.z)>60&&x.getH(d.x,d.z)>2&&
    others.every(o=>Math.hypot(o.x-d.x,o.z-d.z)>250)&&x.CAMPS.every(c=>Math.hypot(c.x-d.x,c.z-d.z)>20),id+' '+d.x+','+d.z+' '+x.landAt(d.x,d.z)); }
{ const n=x.RIFT_BAD.length, M=TR.kinds.map(k=>k.id), mk=o=>Object.assign({id:'x'+Math.random().toString(36).slice(2,6),name:'X',blurb:'',door:{x:0,z:0},aura:[1,2,3],music:'rift',el:'earth',essence:'prime',herald:'rootherald',mobs:M},o);
  const a=x.defineElemRift(mk({el:'fire'})), b=x.defineElemRift(mk({essence:'fire'})), c2=x.defineElemRift(mk({mobs:M.slice(1)})), d2=x.defineElemRift(mk({essence:'gold',el:'earth'}));
  ok('a drifting file is left out: a monster of another element, essence of another element, a short kind list',!a&&!b&&!c2&&!d2&&x.RIFT_BAD.length===n+4&&x.RIFT_BAD.slice(n).every(r=>r.why),JSON.stringify(x.RIFT_BAD.slice(n)));
  const dup=x.riftMobDef('treant','rootlet','Again',{el:'earth',pal:{tint:1}}), nm=x.RIFT_MON_DEFS.length;
  ok('a glass kind with an id already used is refused (it would shadow the first)',dup===null&&x.RIFT_BAD.length===n+5&&x.RIFT_MON_DEFS.length===nm&&x.DEF_BY_ID.rootlet.name==='Rootlet');
  x.RIFT_BAD.length=n; }
// closed below 28
W.join('lo',{name:'Lowe',look:{cls:'warrior'},save:{level:27}}); tick(2);
{ const Lo=W.players.get('lo'); Lo.x=TD.x+2; Lo.z=TD.z; Lo.y=x.getH(Lo.x,Lo.z); W.receive('lo',{t:'rift',a:'open'}); const li=msgs('lo','rift').pop();
  W.receive('lo',{t:'rift',a:'go',x2:0}); ok('closed below level 28: the window says 28, a level-27 hiker gets no run',li&&li.lv===28&&!Lo.inst&&![...x.DG_RUNS.values()].some(q=>q.rift==='taproot'));
  Lo.gear.awm=Lo.gear.awm||{}; ok('the Shardmere stays open to a level-27 hiker (its own rule)',(()=>{ Lo.x=D.x+2; Lo.z=D.z; Lo.y=x.getH(Lo.x,Lo.z); W.receive('lo',{t:'rift',a:'go',x2:0}); const ok2=!!Lo.inst; if(ok2) W.receive('lo',{t:'dg',a:'leave'}); return ok2; })());
  W.leave('lo'); }
const atT=(p,dx)=>{ p.x=TD.x+(dx||2); p.z=TD.z; p.y=x.getH(p.x,p.z); };
const startT=x2=>{ A.gear.rift.e=100; A.gear.rift.at=Date.now(); A.dead=false; A.hp=A.maxHp; A.vbGrace=1e12; A.gear.awm={}; atT(A); W.receive('a',{t:'rift',a:'go',x2:x2?1:0}); return [...x.DG_RUNS.values()].find(q=>q.rift==='taproot'&&!q.endT); };
const clearRun=r2=>{ for(let i=0;i<4000&&!r2.endT;i++){ for(const m of [...r2.mons]) if(!m.dead&&!m.remove){ m.hp=0; x.killMonsterS(m,A); } tick(4); keepAlive(); } };
{ const c0=A.gear.coins, e0=exp0(), t0=A.gear.mats?JSON.stringify(A.gear.mats):'', r1_=startT(false);
  ok('a level-40 hiker enters the Taproot: a run in a rift slot, its theme the Taproot, no energy spent',!!r1_&&r1_.th==='taproot'&&r1_.L===40&&!r1_.x2&&Math.abs(A.gear.rift.e-100)<0.01&&msgs('a','tp').pop().dg.th==='taproot');
  tick(Math.ceil(16/0.05)); keepAlive();
  ok('its monsters carry the rift\'s element: earth, at your level, brittle',[...r1_.mons].filter(m=>!m.dead).length>0&&[...r1_.mons].filter(m=>!m.dead).every(m=>m.def.el==='earth'&&m.def.rift&&m.dgK.lv===40));
  { const m=[...r1_.mons].find(m=>!m.dead), mb1=[...r1_.members.values()][0]; m.hp=0; x.killMonsterS(m,A);
    ok('a kill pays no XP, no coins and no Essence by itself',exp0()===e0&&A.gear.coins===c0&&awm()===0&&mb1.got.xp===0); }
  clearRun(r1_); const mb1=[...r1_.members.values()][0];
  ok('a full clear: won, 12 Prime Essence in gear.awm, no XP, no coins, no items or materials',r1_.phase==='won'&&awm()===12&&exp0()===e0&&A.gear.coins===c0&&JSON.stringify(A.gear.mats)===t0&&mb1.got.xp===0&&mb1.got.mats===12&&A.gear.rift.clears>=1,r1_.phase+' '+awm()+' w'+r1_.k.w);
  ok('the Shardmere paid no Essence earlier (XP mode only)',!Object.keys(A.gear.awm).some(k=>k!=='ess_prime'&&k.startsWith('ess_')));
  tick(Math.ceil(21/0.05)); }
// doubled: twice the Essence, the energy paid and no XP
{ const e0=exp0(), r2=startT(true); ok('the Double costs 20 energy here as well',!!r2&&r2.x2&&Math.abs(A.gear.rift.e-80)<0.01);
  clearRun(r2); ok('doubled: a full clear pays 24 Prime Essence, still no XP',r2.phase==='won'&&awm()===24&&exp0()===e0,awm()+' '+r2.phase);
  ok('the HUD number and the results count the Essence (the materials slot)',[...r2.members.values()][0].got.mats===24&&r2.hud[4]===24,JSON.stringify(r2.hud)); tick(Math.ceil(21/0.05)); }
// a run lost on wave 5 pays what it got through: waves 1-4 = riftEssFor(4)
{ const r3=startT(false); let g5=0; for(let i=0;i<4000&&r3.k.w<5&&!r3.endT;i++){ for(const m of [...r3.mons]) if(!m.dead&&!m.remove){ m.hp=0; x.killMonsterS(m,A); } tick(4); keepAlive(); g5++; }
  ok('wave 5 reached: waves 1-4 are paid ('+x.riftEssFor(4)+'), the fifth is not yet',r3.k.w===5&&awm()===x.riftEssFor(4),'w'+r3.k.w+' '+awm());
  A.vbGrace=0; A.hp=0; A.dead=true; A.deadT=0; tick(Math.ceil(5.5/0.05)); A.hp=0; A.dead=true; A.deadT=0; tick(Math.ceil(5.5/0.05));
  ok('lost on wave 5: it keeps what it got through and no more',r3.phase==='lost'&&awm()===x.riftEssFor(4),r3.phase+' '+awm()); tick(Math.ceil(21/0.05)); }
// leaving before a kill pays nothing even as waves pass
{ const r4=startT(false); tick(Math.ceil(100/0.05)); keepAlive(); ok('a hiker who kills nothing is paid nothing for the waves that pass',r4.k.w>=2&&awm()===0,'w'+r4.k.w+' '+awm()); W.receive('a',{t:'dg',a:'leave'}); tick(2); }
// the save: Essence ids are known ones, clamped to MAT_MAX
{ const g=x.sanitizeGear({awm:{ess_prime:99999,ess_air:7,ess_nope:5,ess_fire:-2,constructor:3,__proto__:{ess_dark:9},echo:4}},'warrior');
  ok('save cleaning: Essence clamped to MAT_MAX, unknown and negative ids dropped, inherited ids ignored, Echo Shards kept',g.awm.ess_prime===x.MAT_MAX&&g.awm.ess_air===7&&!('ess_nope' in g.awm)&&!('ess_fire' in g.awm)&&!('ess_dark' in g.awm)&&g.awm.echo===4&&x.ESS_ORDER.length===7&&x.essOf('constructor')===null&&x.essOf('ess_prime').name==='Prime Essence',JSON.stringify(g.awm)); }
// an Awakening purchase that needs Essence takes it: the Wanderer's A4 asks Prime Essence
{ const gg=A.gear; x.awkGrantP(A,'wanderer',3); gg.coins=1e9; for(const id of x.MAT_IDS) gg.mats[id]=999; gg.awm={echo:9999}; const rm=x.rdMatsOf(A); for(const l of ['home','vale','hoar','grey','sun','gloam','amber','isles']) rm[l]=999;
  const c4=x.awkTierCost('wanderer',4), need=c4.mats.ess_prime, snapG=()=>JSON.stringify([gg.coins,gg.mats,gg.awm,gg.rd]);
  gg.awm.ess_prime=need-1; const s0=snapG(), why=x.awkTierP(A,'wanderer');
  ok('A4 with one Prime Essence too few: refused naming it, nothing taken',need>0&&typeof why==='string'&&/Prime Essence/.test(why)&&!/cannot/.test(why)&&snapG()===s0&&gg.awk.wanderer.t===3,why);
  gg.awm.ess_prime=need+5; const r=x.awkTierP(A,'wanderer');
  ok('A4 with the Essence held: bought, exactly the price taken and 5 left',r===null&&gg.awk.wanderer.t===4&&gg.awm.ess_prime===5,String(r)+' '+gg.awm.ess_prime+' need '+need); }
// junk
W.receive('a',{t:'rift',a:'constructor'}); W.receive('a',{t:'rift'}); W.receive('a',{t:'rift',a:'go',x2:'__proto__'});
ok('junk messages do nothing (already in a run)',A.inst===c.id||!A.inst);
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
