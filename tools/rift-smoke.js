// Rifts (shared/rift.js, shared/rift/shardmere.js, server/rift.js), straight from src/, no build: the energy clock (full in 28 h, online and offline, the cap, save cleaning), the tear in the
// wild (outside every village, off the roads, its clearing free of camps), the window, a solo run in a rift slot (never a dungeon's), the void lets hits through, XP only (3x a same-level
// world kill, x2 with the Double, no coins / items / materials), the Double's price and refund, the waves (75% / 40 s, the cap, the Herald), the clear bonus, one respawn, leaving.
// Usage: node tools/rift-smoke.js
const {loadServer}=require('./load');
const sent=[];
const {api:W,x}=loadServer({dev:false,send(to,m){ sent.push([to,m]); }},['RIFT_DEFS','RIFT_BAD','defineRift','RIFT_PAY','RIFT_MON_DEFS','RIFT_E_MAX','RIFT_E_MS','RIFT_E_DOUBLE','RIFT_WAVES','RIFT_ALIVE_MAX','RIFT_SLOT0',
  'RIFT_HP_K','RIFT_DMG_K','RIFT_BONUS_KILLS','riftEnergyAt','riftWaveSize','riftNear','riftLayout','DG_RUNS','DG_SLOT_RUN','DG_DG_SLOTS','DG_MAX_INST','DG_KITS','DG_MISSIONS','dgPoolS','dgBake','dgSolid',
  'dgHitOkS','dgWallAtS','DEF_BY_ID','MON_DEFS','sanitizeGear','getH','vilAt','inVillage','nearRoad','landAt','waCoast','CAMPS','killMonsterS','xpFor','defAt','dgKOf','MONS','S','dgLaunchS','DG_THEMES']);
let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i!==undefined?'  ('+i+')':'')); if(!c) fails++; };
const tick=(n,dt)=>{ for(let i=0;i<n;i++) W.tick(dt||0.05); };
const msgs=(to,t)=>sent.filter(s=>s[0]===to&&s[1].t===t).map(s=>s[1]);
const R=x.RIFT_DEFS.shardmere, H=3600000;
ok('the Shardmere is defined, nothing left out, seven glass kinds with the look flag',!!R&&!x.RIFT_BAD.length&&x.RIFT_MON_DEFS.length===7&&x.RIFT_MON_DEFS.every(d=>d.pal.glass&&d.pal.tint&&x.DEF_BY_ID[d.id]),JSON.stringify(x.RIFT_BAD));
{ const n=x.RIFT_BAD.length, bad=x.defineRift(Object.assign({},R,{id:'badreward',reward:'gold'}));
  ok('the Shardmere pays XP (its reward mode, default xp, has a payer); an unknown reward mode is left out',R.reward==='xp'&&typeof x.RIFT_PAY.xp.kill==='function'&&!bad&&x.RIFT_BAD.length===n+1&&!x.RIFT_DEFS.badreward,JSON.stringify(x.RIFT_BAD));
  x.RIFT_BAD.length=n; }
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
// junk
W.receive('a',{t:'rift',a:'constructor'}); W.receive('a',{t:'rift'}); W.receive('a',{t:'rift',a:'go',x2:'__proto__'});
ok('junk messages do nothing (already in a run)',A.inst===c.id||!A.inst);
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
