// Headless test of the Sandglass (shared/dungeons/themes/sandglass.js, boss Khet): the Sunscar's dungeon, level 40 at +0, entered from level 36 once Glasswell has been walked into (gear.sun 2), paying a level-40 weapon.
// Server straight from src/ (no build): the theme and its boss at level 40, the door at SUN_DG_DOOR, the entry rules, the offer and the board, a run's monsters (Sunscar kinds with res / acc), the reward (a level-40, unrolled
// weapon of the pool, the odds), and a won run in a party of two giving the same piece to both. Usage: node tools/sandglass-dungeon-smoke.js
const {loadServer}=require('./load');
const got={}, msgs={};
const {api:W,x}=loadServer({dev:true,log(){},send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (msgs[pid]=msgs[pid]||[]).push(c); if(c.t==='snap'&&c.ev) (got[pid]=got[pid]||[]).push(...c.ev); }},
  ['DG_RUNS','DG_THEMES','DG_BAD','DG_ENTRANCES','DG_LANDS','DG_ENTRY_LV','DG_LV','DG_END_S','DG_BOSS_DEFS','DG_BOSSES','DG_REWARDS','SUN_DG_DOOR','ZTIER_MAX','ZTIER_STEP','WEAPON_SLOTS','ITEM','MON_DEFS',
   'dgEntranceNear','dgApron','dgUnlocked','dgGateOpen','dgLevel','dgOffer','dgPoolS','dgClearReward','dgParse','dgItem','dgBossDefOf','killMonsterS','BOSS_KITS','DG_ENTRANCES']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const IMM=new Set(), tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const pid of IMM){ const p=W.players.get(pid); if(p&&!p.dead) p.hp=p.maxHp; } } };
const secs=s=>tick(Math.ceil(s/0.05)), P=pid=>W.players.get(pid);
const evs=(pid,kind)=>(got[pid]||[]).filter(e=>e[0]===kind), last=(pid,kind)=>{ const a=evs(pid,kind); return a[a.length-1]; }, lastMsg=(pid,t)=>{ const a=(msgs[pid]||[]).filter(m=>m.t===t); return a[a.length-1]; };
const toasts=pid=>evs(pid,'toast').map(e=>e[2]).join(' | '), clear=()=>{ for(const k in got) got[k]=[]; for(const k in msgs) msgs[k]=[]; };
const join=(pid,name,save)=>{ W.join(pid,{name,look:{cls:'warrior'},save}); IMM.add(pid); return P(pid); };
const withRandom=(v,fn)=>{ const r=Math.random; Math.random=()=>v; try{ return fn(); } finally { Math.random=r; } };
const T=x.DG_THEMES.sandglass, E=x.DG_ENTRANCES.sandglass, D=x.SUN_DG_DOOR, sunZt=(on,max)=>({sun:{on,max},home:{on:0,max:0},vale:{on:0,max:0},hoar:{on:0,max:0},grey:{on:0,max:0}});

// ---- the theme, the boss and the levels ----
ok('the Sandglass is registered (no bad theme): the Sunscar\'s dungeon under the Whitefloor, level 40, entry level 36, boss Khet, five Sunscar walkers or more and the Sand Golem and Dune Drake keeping the vault',
  !!T&&x.DG_BAD.length===0&&T.land==='sun'&&T.at==='The Whitefloor'&&T.lv===40&&T.entry===36&&T.boss==='khet'&&T.mobs.walkers.length>=5&&T.mobs.guardians.join()==='sandgolem,dunedrake'&&x.DG_LANDS.sun&&x.DG_ENTRY_LV===25);
ok('the other dungeons keep entry level 25 and level 30 (the `entry` field defaults)',['hollowroots','jadesprings','bonefrostbarrow','blackseam'].every(id=>x.DG_THEMES[id].entry===25&&x.DG_THEMES[id].lv===30));
{ const B=x.DG_BOSSES.khet, R=x.DG_BOSS_DEFS.khet;
  ok('Khet\'s base level is exactly 40: the design, the def makeBossS takes and the theme\'s level at +0 (his add one lower), and 40 + 10 a tier above',B.lv===40&&R.def.level===40&&R.def.boss&&R.add.level===39&&x.dgBossDefOf(T)===R&&x.dgLevel(T,0)===40&&[0,1,2,3,4,5,6,7].map(k=>x.dgLevel(T,k)).join()==='40,50,60,70,80,90,100,110'&&x.ZTIER_MAX===7);
  ok('the boss is registered with a kit that has start, tick and phase (kit `hour`), exactly one signature (High Noon) and its element, model and music exist',['start','tick','phase'].every(f=>typeof x.BOSS_KITS.hour[f]==='function')&&R.kit==='hour'&&B.moves.filter(m=>m.signature).map(m=>m.id).join()==='noon'&&B.moves.length>=5); }
ok('every monster of the dungeon is a Sunscar kind (levels 33-36) walkers fit a 4 m door',[...T.mobs.walkers,...T.mobs.guardians].every(id=>{ const d=x.MON_DEFS.find(q=>q.id===id); return d&&d.zone&&/^s\d\d$/.test(d.zone)&&d.level>=33&&d.level<=36; })&&T.mobs.walkers.every(id=>x.MON_DEFS.find(q=>q.id===id).rad<=0.9));

// ---- the door ----
ok('the door is the prop the Sunscar reserved: DG_ENTRANCES.sandglass at SUN_DG_DOOR, eight doors in all, found from 3 m and not from 9 m, its apron 7 m out toward the city',
  !!E&&E.x===D.x&&E.z===D.z&&E.theme==='sandglass'&&Object.keys(x.DG_ENTRANCES).length===8&&x.dgEntranceNear(D.x+3,D.z)===E&&x.dgEntranceNear(D.x+9,D.z)===null&&Math.abs(Math.hypot(x.dgApron(E).x-D.x,x.dgApron(E).z-D.z)-7)<1e-9&&x.dgApron(E).z<D.z);

// ---- who may enter: Glasswell walked into (gear.sun 2) and level 36, at every difficulty ----
{ const un=(g,lv,tier)=>x.dgUnlocked(g,lv,T,tier);
  ok('the way is shut until Glasswell has been walked into: the gate is closed at gear.sun 0 and 1, open at 2, and the hint says so',!x.dgGateOpen({sun:0,zt:sunZt(0,0)},T)&&!x.dgGateOpen({sun:1,zt:sunZt(0,0)},T)&&x.dgGateOpen({sun:2,zt:sunZt(0,0)},T)&&!un({sun:1,zt:sunZt(0,0)},60).ok&&/Glasswell/.test(un({sun:1,zt:sunZt(0,0)},60).why));
  ok('entry is level 36 (not 25) once the gate is open: 35 refused with the level in the message, 36 let in at level 40, +0 needing no tier',!un({sun:2,zt:sunZt(0,0)},35).ok&&/level 36/.test(un({sun:2,zt:sunZt(0,0)},35).why)&&un({sun:2,zt:sunZt(0,0)},36).ok&&un({sun:2,zt:sunZt(0,0)},36).level===40&&un({sun:2,zt:sunZt(0,0)},36).tier===0);
  ok('the Sunscar\'s own tier sets the level (+2 = 60) and needs it unlocked (gear.zt.sun.max), at the same entry level',un({sun:2,zt:sunZt(2,2)},36,2).level===60&&!un({sun:2,zt:sunZt(0,0)},60,2).ok&&/not unlocked \+2/.test(un({sun:2,zt:sunZt(0,0)},60,2).why)&&!un({sun:2,zt:sunZt(2,2)},35,2).ok); }
ok('the hourly offer is two different missions of the seven, like every dungeon',(()=>{ const o=x.dgOffer('sandglass',Date.UTC(2026,9,3,5),x.dgPoolS()); return o.length===2&&o[0]!==o[1]; })());

// ---- the board at the door, and a run started there ----
const A=join('a','Ash',{level:36,gear:{sun:2,zt:sunZt(0,0)}}), L35=join('s','Sol',{level:35,gear:{sun:2,zt:sunZt(0,0)}}), N=join('n','Nia',{level:60,gear:{sun:1,zt:sunZt(0,0)}}); tick(3);
const near={x:D.x+Math.sin(E.a)*3,z:D.z+Math.cos(E.a)*3};
for(const p of [A,L35,N]){ p.x=near.x; p.z=near.z; }
clear(); W.receive('a',{t:'dg',a:'open'}); W.receive('s',{t:'dg',a:'open'}); W.receive('n',{t:'dg',a:'open'}); tick(2);
{ const b=lastMsg('a','dgboard'), s=lastMsg('s','dgboard'), n=lastMsg('n','dgboard');
  ok('at the door the board opens for level 36 (th sandglass, level 40, open) and says no to level 35 (why: level 36) and to a hiker who has not walked into Glasswell (gate shut)',!!b&&b.th==='sandglass'&&b.L===40&&b.ok===1&&b.gate===1&&b.offer.length===2&&!!s&&s.ok===0&&/level 36/.test(s.why)&&s.gate===1&&!!n&&n.ok===0&&n.gate===0,JSON.stringify([b&&b.ok,s&&s.why,n&&n.gate])); }
clear(); W.receive('s',{t:'dg',a:'start',dungeon:'sandglass',type:x.dgOffer('sandglass',Date.now(),x.dgPoolS())[0]}); W.receive('n',{t:'dg',a:'start',dungeon:'sandglass',type:x.dgOffer('sandglass',Date.now(),x.dgPoolS())[0]}); tick(2);
ok('a level-35 hiker and one who has not been to Glasswell cannot start a run',!L35.inst&&!N.inst);
// seven mission types start (the offer is two an hour: the testing tool starts any)
{ const started=[]; for(const mi of ['purge','defense','survival','sabotage','siege','hunt','escort']){ W.receive('a',{t:'dev',cmd:'dg',v:'sandglass:'+mi+':3'}); tick(3); const r=A.inst?x.DG_RUNS.get(A.inst):null;
    started.push(!!r&&r.th==='sandglass'&&r.mission===mi&&r.L===40&&(mi!=='purge'||r.mons.size>0)); W.receive('a',{t:'dg',a:'leave'}); tick(3); }
  ok('all seven mission types start as the Sandglass at level 40 (Purge with its monsters at once)',started.length===7&&started.every(Boolean),started.join()); }
W.receive('a',{t:'dev',cmd:'dg',v:'sandglass:purge:5'}); tick(3);
const run=A.inst?x.DG_RUNS.get(A.inst):null;
ok('a purge run: the walkers are the Sunscar\'s, fought at level 40 (dgK)',!!run&&[...run.mons].length>0&&[...run.mons].every(m=>T.mobs.walkers.includes(m.def.id)||T.mobs.guardians.includes(m.def.id))&&[...run.mons].every(m=>m.dgK&&m.dgK.lv===40));
W.receive('a',{t:'dg',a:'leave'}); tick(3);

// ---- what a clear pays ----
{ const R=x.DG_REWARDS.sandglass, rnd=(()=>{ let a=7; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; })();
  const seen={}, rar=[0,0,0,0,0], N2=30000; let bad=0;
  for(let i=0;i<N2;i++){ const id=x.dgClearReward('sandglass',rnd), q=x.dgParse(id), it=x.dgItem(id);
    if(!q||!it||q.t!==8||q.n!==0||q.roll||it.lv!==40||it.kind!=='weapon'||!R.pool.includes(q.slot)||!it.roll0||it.rcode||!/^(sword|bow|wand)8(-[reul])?$/.test(id)) bad++; seen[q.slot]=(seen[q.slot]||0)+1; rar[q.rar]++; }
  const within=(o,n,p)=>Math.abs(o-n*p)<=4*Math.sqrt(n*p*(1-p))+1;
  ok('a clear rolls a +0, UNROLLED level-40 weapon (sword8 / bow8 / wand8, no ~roll code, waiting for a Weapon Reroll Stone) of the pool, each kind equally often, at 70 / 25 / 4 / 0.8 / 0.2%',bad===0&&R.pool.join()==='sword,bow,wand'&&R.t===8&&['sword','bow','wand'].every(s=>within(seen[s],N2,1/3))&&rar.every((c,r)=>within(c,N2,[0.7,0.25,0.04,0.008,0.002][r])),JSON.stringify(seen)+' '+rar); }

// ---- a purge won through Khet by a party of two: both get the same level-40 weapon ----
const K=join('k','Kai',{level:40,gear:{sun:2,zt:sunZt(0,0)}}), L2=join('l','Lea',{level:40,gear:{sun:2,zt:sunZt(0,0)}}); tick(2);
W.receive('k',{t:'party',a:'invite',name:'Lea'}); tick(2); W.receive('l',{t:'party',a:'accept'}); tick(2);
K.x=near.x; K.z=near.z; L2.x=near.x+0.5; L2.z=near.z; clear();
W.receive('k',{t:'dg',a:'open'}); tick(1);
const wantType=x.dgOffer('sandglass',Date.now(),x.dgPoolS())[0];
W.receive('k',{t:'dg',a:'start',dungeon:'sandglass',type:wantType}); tick(2); W.receive('l',{t:'dg',a:'accept'}); tick(3);
const runK=K.inst?x.DG_RUNS.get(K.inst):null;
ok('the leader starts from the door board and the member follows: one run, the Sandglass, level 40, two inside',!!runK&&runK.th==='sandglass'&&runK.L===40&&L2.inst===K.inst&&runK.mission===wantType,toasts('k')+' | '+toasts('l'));
W.receive('k',{t:'dg',a:'leave'}); W.receive('l',{t:'dg',a:'leave'}); tick(3);
{ const W2=join('w','Wen',{level:40,gear:{sun:2,zt:sunZt(0,0)}}), W3=join('v','Vik',{level:40,gear:{sun:2,zt:sunZt(0,0)}}); tick(2);
  W.receive('w',{t:'party',a:'invite',name:'Vik'}); tick(2); W.receive('v',{t:'party',a:'accept'}); tick(2);
  W.receive('w',{t:'dev',cmd:'dg',v:'sandglass:purge:5'}); tick(2); W.receive('v',{t:'dg',a:'accept'}); tick(3);
  const r=W2.inst?x.DG_RUNS.get(W2.inst):null;
  ok('a testing run of the Sandglass with a party of two: both in it',!!r&&r.th==='sandglass'&&W3.inst===W2.inst);
  if(r){ for(const m of [...r.mons]) if(m.dgRole==='purge'&&!m.dead) x.killMonsterS(m,W2); tick(3);
    ok('Purge: killing them brings Khet into the round hall at level 40, with the kit `hour`',!!r.boss&&r.phase==='boss'&&r.boss.bd.def.id==='khet'&&r.boss.m.dgK.lv===40&&r.boss.bd.kit==='hour');
    const A3=r.boss.A; W2.x=A3.x+3; W2.z=A3.z+3; W2.dgX=W2.x; W2.dgZ=W2.z; secs(1);
    ok('he engages when a member steps into the hall and the kit ticks through the first moves without a fault',r.boss.engaged&&(secs(8),true));
    const i2=W2.gear.inv.length, i3=W3.gear.inv.length; clear(); withRandom(0.0005,()=>x.killMonsterS(r.boss.m,W2)); tick(3);
    const n2=W2.gear.inv.slice(i2), n3=W3.gear.inv.slice(i3), w2=n2.find(id=>/^(sword|bow|wand)8/.test(id)), d2=last('w','dge');
    ok('the win pays EVERY member the same level-40 weapon through dgGrantItemP (unrolled: no ~ code), listed in the results, and is saved as a clear',r.phase==='won'&&!!w2&&n3.includes(w2)&&x.dgParse(w2).t===8&&!x.dgParse(w2).roll&&x.ITEM[w2].lv===40&&x.ITEM[w2].roll0===true&&!!d2&&d2[6].includes(w2)&&W2.gear.dg.clear['sandglass:purge']===1&&W3.gear.dg.clear['sandglass:purge']===1,n2+' / '+n3);
    secs(x.DG_END_S+0.5); } }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
