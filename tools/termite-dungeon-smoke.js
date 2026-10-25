// Headless test of the Termite Cathedral (shared/dungeons/themes/termitecathedral.js, boss Queen Ortha): the Amber Reach's dungeon, level 45 at +0, entered from level 42 once the Ashbed Gate is open (gear.amber 1), paying a level-40 ring.
// Server straight from src/ (no build): the theme and its boss at level 45, the door at the atlas's amber door (SAV_DOOR), the entry rules, the offer and the board, a run's monsters (the Reach's kinds), the reward (a level-40, unrolled
// ring of the seven types, the odds), the Egg Clusters (an egg popped in time takes its hatching with it, a clutch popped whole stuns her, an egg left alone hatches and hurts), and a won run in a party of two giving the same ring to both.
// Usage: node tools/termite-dungeon-smoke.js
const {loadServer}=require('./load');
const got={}, msgs={};
const {api:W,x}=loadServer({dev:true,log(){},send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (msgs[pid]=msgs[pid]||[]).push(c); if(c.t==='snap'&&c.ev) (got[pid]=got[pid]||[]).push(...c.ev); }},
  ['DG_RUNS','DG_THEMES','DG_BAD','DG_ENTRANCES','DG_LANDS','DG_ENTRY_LV','DG_LV','DG_END_S','DG_BOSS_DEFS','DG_BOSSES','DG_REWARDS','SAV_DOOR','ROADS','RING_ELS','ITEM','MON_DEFS',
   'dgEntranceNear','dgApron','dgUnlocked','dgGateOpen','dgLevel','dgOffer','dgPoolS','dgClearReward','dgParse','dgItem','dgBossDefOf','killMonsterS','BOSS_KITS','DG_EGG_WARN','DG_EGG_R','DG_EGG_PER','DG_EGG_STUN','DG_BROOD_MAX']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const IMM=new Set(), tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const pid of IMM){ const p=W.players.get(pid); if(p&&!p.dead) p.hp=p.maxHp; } } };
const secs=s=>tick(Math.ceil(s/0.05)), P=pid=>W.players.get(pid);
const evs=(pid,kind)=>(got[pid]||[]).filter(e=>e[0]===kind), last=(pid,kind)=>{ const a=evs(pid,kind); return a[a.length-1]; }, lastMsg=(pid,t)=>{ const a=(msgs[pid]||[]).filter(m=>m.t===t); return a[a.length-1]; };
const toasts=pid=>evs(pid,'toast').map(e=>e[2]).join(' | '), clear=()=>{ for(const k in got) got[k]=[]; for(const k in msgs) msgs[k]=[]; };
const join=(pid,name,save)=>{ W.join(pid,{name,look:{cls:'warrior'},save}); IMM.add(pid); return P(pid); };
const withRandom=(v,fn)=>{ const r=Math.random; Math.random=()=>v; try{ return fn(); } finally { Math.random=r; } };
const T=x.DG_THEMES.termitecathedral, E=x.DG_ENTRANCES.termitecathedral, D=x.SAV_DOOR, AG={amber:1,neck:1,sun:2,river:1};

// ---- the theme, the boss and the levels ----
ok('the Termite Cathedral is registered (no bad theme): the Amber Reach\'s dungeon under the Termite Cathedrals, level 45, entry level 42, boss Queen Ortha, five Reach walkers and two guardians',
  !!T&&x.DG_BAD.length===0&&T.land==='amber'&&T.at==='Termite Cathedrals'&&T.lv===45&&T.entry===42&&T.boss==='ortha'&&T.mobs.walkers.length>=5&&T.mobs.guardians.join()==='baobabtreant,greyrhino'&&!!x.DG_LANDS.amber&&x.DG_ENTRY_LV===25);
{ const B=x.DG_BOSSES.ortha, R=x.DG_BOSS_DEFS.ortha;
  ok('Ortha\'s base level is exactly 45: the design, the def makeBossS takes and the theme\'s level at +0 (her add one lower), and 45 + 10 a tier above',B.lv===45&&R.def.level===45&&R.def.boss&&R.add.level===44&&x.dgBossDefOf(T)===R&&x.dgLevel(T,0)===45&&x.dgLevel(T,2)===65);
  ok('the boss is registered with a kit that has start, tick and phase (kit `brood`), exactly one signature (the Egg Clusters), at least five moves, one-hit eggs for a prop, and she barely moves',['start','tick','phase'].every(f=>typeof x.BOSS_KITS.brood[f]==='function')&&R.kit==='brood'&&B.moves.length>=5&&B.moves.filter(m=>m.signature).length===1&&B.moves.find(m=>m.signature).id==='eggs'&&R.prop.hits===1&&R.prop.noAttack&&R.prop.speed===0&&R.def.speed<1); }
ok('every monster of the dungeon is an Amber Reach kind (zones a37-a45); walkers fit a 4 m door',[...T.mobs.walkers,...T.mobs.guardians].every(id=>{ const d=x.MON_DEFS.find(q=>q.id===id); return d&&/^a(3[7-9]|4[0-5])$/.test(d.zone)&&d.level>=37; })&&T.mobs.walkers.every(id=>x.MON_DEFS.find(q=>q.id===id).rad<=0.9));

// ---- the door ----
ok('the door is the atlas\'s amber door: DG_ENTRANCES.termitecathedral at SAV_DOOR where The Amber Door Road ends, its signpost on that road, seven doors in all, found from 3 m and not from 9 m, its apron 7 m out',
  !!E&&E.x===D.x&&E.z===D.z&&E.theme==='termitecathedral'&&E.sign.road==='The Amber Door Road'&&x.ROADS.some(r=>r.name===E.sign.road)&&Object.keys(x.DG_ENTRANCES).length===7&&x.dgEntranceNear(D.x+Math.sin(E.a)*3,D.z+Math.cos(E.a)*3)===E&&x.dgEntranceNear(D.x+Math.sin(E.a)*9,D.z+Math.cos(E.a)*9)===null&&Math.abs(Math.hypot(x.dgApron(E).x-D.x,x.dgApron(E).z-D.z)-7)<1e-9);

// ---- who may enter: the Ashbed Gate open (gear.amber 1) and level 42, at every difficulty ----
{ const un=(g,lv,tier)=>x.dgUnlocked(g,lv,T,tier);
  ok('the way is shut until the Ashbed Gate is open: the gate is closed at gear.amber 0, open at 1, and the hint says so',!x.dgGateOpen({amber:0},T)&&x.dgGateOpen({amber:1},T)&&!un({amber:0},60).ok&&/Ashbed Gate/.test(un({amber:0},60).why));
  ok('entry is level 42 (not 25) once the gate is open: 41 refused with the level in the message, 42 let in at level 45, +0 needing no tier',!un({amber:1},41).ok&&/level 42/.test(un({amber:1},41).why)&&un({amber:1},42).ok&&un({amber:1},42).level===45&&un({amber:1},42).tier===0);
  ok('a tier the Reach has not unlocked is refused (the Reach has no zone tiers of its own yet), at the same entry level',!un({amber:1,zt:{amber:{on:0,max:0}}},60,1).ok&&un({amber:1,zt:{amber:{on:2,max:2}}},42,2).level===65); }
ok('the hourly offer is two different missions of the seven, like every dungeon',(()=>{ const o=x.dgOffer('termitecathedral',Date.UTC(2026,9,3,5),x.dgPoolS()); return o.length===2&&o[0]!==o[1]; })());

// ---- the board at the door, and a run started there ----
const A=join('a','Ash',{level:42,gear:Object.assign({},AG)}), L41=join('s','Sol',{level:41,gear:Object.assign({},AG)}), N=join('n','Nia',{level:60,gear:{amber:0}}); tick(3);
const near={x:D.x+Math.sin(E.a)*3,z:D.z+Math.cos(E.a)*3};
for(const p of [A,L41,N]){ p.x=near.x; p.z=near.z; }
clear(); W.receive('a',{t:'dg',a:'open'}); W.receive('s',{t:'dg',a:'open'}); W.receive('n',{t:'dg',a:'open'}); tick(2);
{ const b=lastMsg('a','dgboard'), s=lastMsg('s','dgboard'), n=lastMsg('n','dgboard');
  ok('at the door the board opens for level 42 (th termitecathedral, level 45, open) and says no to level 41 (why: level 42) and to a hiker whose gate is shut',!!b&&b.th==='termitecathedral'&&b.L===45&&b.ok===1&&b.gate===1&&b.offer.length===2&&!!s&&s.ok===0&&/level 42/.test(s.why)&&s.gate===1&&!!n&&n.ok===0&&n.gate===0,JSON.stringify([b&&b.ok,s&&s.why,n&&n.gate])); }
clear(); W.receive('s',{t:'dg',a:'start',dungeon:'termitecathedral',type:x.dgOffer('termitecathedral',Date.now(),x.dgPoolS())[0]}); W.receive('n',{t:'dg',a:'start',dungeon:'termitecathedral',type:x.dgOffer('termitecathedral',Date.now(),x.dgPoolS())[0]}); tick(2);
ok('a level-41 hiker and one whose gate is shut cannot start a run',!L41.inst&&!N.inst);
{ const started=[]; for(const mi of ['purge','defense','survival','sabotage','siege','hunt','escort']){ W.receive('a',{t:'dev',cmd:'dg',v:'termitecathedral:'+mi+':3'}); tick(3); const r=A.inst?x.DG_RUNS.get(A.inst):null;
    started.push(!!r&&r.th==='termitecathedral'&&r.mission===mi&&r.L===45&&(mi!=='purge'||r.mons.size>0)); W.receive('a',{t:'dg',a:'leave'}); tick(3); }
  ok('all seven mission types start as the Termite Cathedral at level 45 (Purge with its monsters at once)',started.length===7&&started.every(Boolean),started.join()); }
W.receive('a',{t:'dev',cmd:'dg',v:'termitecathedral:purge:5'}); tick(3);
const run=A.inst?x.DG_RUNS.get(A.inst):null;
ok('a purge run: the walkers are the Reach\'s, fought at level 45 (dgK)',!!run&&[...run.mons].length>0&&[...run.mons].every(m=>T.mobs.walkers.includes(m.def.id)||T.mobs.guardians.includes(m.def.id))&&[...run.mons].every(m=>m.dgK&&m.dgK.lv===45));
W.receive('a',{t:'dg',a:'leave'}); tick(3);
{ W.receive('a',{t:'dev',cmd:'dg',v:'termitecathedral:hunt:5'}); tick(3); const r=A.inst?x.DG_RUNS.get(A.inst):null;
  ok('a hunt run\'s quarry is the Locust Cloud (a Reach kind slipping through the galleries)',!!r&&!!r.k&&!!r.k.q&&r.k.q.def.id==='locusts'); W.receive('a',{t:'dg',a:'leave'}); tick(3); }

// ---- what a clear pays: a level-40 ring ----
{ const R=x.DG_REWARDS.termitecathedral, rnd=(()=>{ let a=7; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; })();
  const seen={}, rar=[0,0,0,0,0], N2=30000; let bad=0;
  for(let i=0;i<N2;i++){ const id=x.dgClearReward('termitecathedral',rnd), q=x.dgParse(id), it=x.dgItem(id);
    if(!q||!it||q.t!==8||q.n!==0||q.roll||it.lv!==40||it.kind!=='ring'||!R.pool.includes(q.el)||!it.roll0||it.rcode||!/^ring8-(basic|fire|water|earth|air|dark|light)(-[reul])?$/.test(id)) bad++; seen[q.el]=(seen[q.el]||0)+1; rar[q.rar]++; }
  const within=(o,n,p)=>Math.abs(o-n*p)<=4*Math.sqrt(n*p*(1-p))+1;
  ok('a clear rolls a +0, UNROLLED level-40 ring (ring8-<type>, no ~roll code, waiting for a Ring Reroll Stone) of the seven types, each equally often, at 70 / 25 / 4 / 0.8 / 0.2%',bad===0&&R.kind==='ring'&&R.t===8&&R.pool.join()===x.RING_ELS.join()&&x.RING_ELS.every(s=>within(seen[s],N2,1/x.RING_ELS.length))&&rar.every((c,r)=>within(c,N2,[0.7,0.25,0.04,0.008,0.002][r])),JSON.stringify(seen)+' '+rar); }

// ---- a purge won through Queen Ortha by a party of two: the Egg Clusters, then both get the same level-40 ring ----
const K=join('k','Kai',{level:45,gear:Object.assign({},AG)}), L2=join('l','Lea',{level:45,gear:Object.assign({},AG)}); tick(2);
W.receive('k',{t:'party',a:'invite',name:'Lea'}); tick(2); W.receive('l',{t:'party',a:'accept'}); tick(2);
K.x=near.x; K.z=near.z; L2.x=near.x+0.5; L2.z=near.z; clear();
W.receive('k',{t:'dg',a:'open'}); tick(1);
const wantType=x.dgOffer('termitecathedral',Date.now(),x.dgPoolS())[0];
W.receive('k',{t:'dg',a:'start',dungeon:'termitecathedral',type:wantType}); tick(2); W.receive('l',{t:'dg',a:'accept'}); tick(3);
const runK=K.inst?x.DG_RUNS.get(K.inst):null;
ok('the leader starts from the door board and the member follows: one run, the Termite Cathedral, level 45, two inside',!!runK&&runK.th==='termitecathedral'&&runK.L===45&&L2.inst===K.inst&&runK.mission===wantType,toasts('k')+' | '+toasts('l'));
W.receive('k',{t:'dg',a:'leave'}); W.receive('l',{t:'dg',a:'leave'}); tick(3);
{ const W2=join('w','Wen',{level:45,gear:Object.assign({},AG)}), W3=join('v','Vik',{level:45,gear:Object.assign({},AG)}); tick(2);
  W.receive('w',{t:'party',a:'invite',name:'Vik'}); tick(2); W.receive('v',{t:'party',a:'accept'}); tick(2);
  W.receive('w',{t:'dev',cmd:'dg',v:'termitecathedral:purge:5'}); tick(2); W.receive('v',{t:'dg',a:'accept'}); tick(3);
  const r=W2.inst?x.DG_RUNS.get(W2.inst):null;
  ok('a testing run of the Termite Cathedral with a party of two: both in it',!!r&&r.th==='termitecathedral'&&W3.inst===W2.inst);
  if(r){ for(const m of [...r.mons]) if(m.dgRole==='purge'&&!m.dead) x.killMonsterS(m,W2); tick(3);
    ok('Purge: killing them brings Queen Ortha into the round hall at level 45, with the kit `brood`',!!r.boss&&r.phase==='boss'&&r.boss.bd.def.id==='ortha'&&r.boss.m.dgK.lv===45&&r.boss.bd.kit==='brood');
    const B=r.boss, A3=B.A, m=B.m, at=(p,d,a)=>{ p.x=m.x+Math.sin(a)*d; p.z=m.z+Math.cos(a)*d; p.dgX=p.x; p.dgZ=p.z; };
    W2.x=A3.x+3; W2.z=A3.z+3; W2.dgX=W2.x; W2.dgZ=W2.z; secs(1);
    ok('she engages when a member steps into the hall and the kit ticks through the first moves without a fault',B.engaged&&(secs(8),true));
    // the Egg Clusters: quiet the other moves, lay the eggs, and play it three ways
    IMM.delete('w'); IMM.delete('v'); for(const p of [W2,W3]){ p.maxHp=1e7; p.hp=1e7; }   /* (a player who dies would reset the fight: they take hits, they cannot fall) */
    const quiet=()=>{ B.k.resinT=B.k.burrowT=B.k.broodT=B.k.fallT=B.k.thrumT=99; };
    const heal=()=>{ for(const p of [W2,W3]) p.hp=p.maxHp; };
    const lay=()=>{ B.stunT=0; quiet(); B.k.eggT=99; for(const o of B.k.eggs.slice()){ if(!o.pb.remove) x.killMonsterS(o.pb,W2); } secs(0.5); B.busy=0; B.mv=null; B.k.eggT=0; at(W2,12,0); at(W3,12,2); heal(); tick(2); return B.k.eggs.slice(); };
    const laid=lay(), clutches=[...new Set(laid.map(o=>o.clutch))];
    ok('the Egg Clusters: three clutches of three eggs, each clutch centred at least 6 m from her and every egg under its own warning, and the bar counts them',laid.length===9&&clutches.length===3&&clutches.every(c=>laid.filter(o=>o.clutch===c).length===x.DG_EGG_PER)&&laid.every(o=>Math.hypot(o.pb.x-m.x,o.pb.z-m.z)>=6-1.25-0.01&&B.tele.includes(o.e)&&o.pb.def.id==='broodegg')&&B.aux===9,'aux '+B.aux+', laid '+laid.length);
    // pop the whole of the first clutch, one egg of the second, none of the third
    const [c1,c2,c3]=clutches, ofc=c=>laid.filter(o=>o.clutch===c);
    for(const o of ofc(c1)) x.killMonsterS(o.pb,W2); x.killMonsterS(ofc(c2)[0].pb,W2); tick(2);
    ok('a clutch popped whole stuns her (and takes its warnings back); one egg popped of a clutch stuns nobody',B.stunT>0&&ofc(c1).every(o=>!B.tele.includes(o.e))&&c1.left===0&&c2.left===x.DG_EGG_PER-1&&B.k.lost===1,'stun '+B.stunT.toFixed(2)+', lost '+B.k.lost);
    const hp0=[W2.hp,W3.hp], bro0=B.adds.filter(a=>a.def===B.bd.add&&!a.dead&&!a.remove).length;
    at(W2,0.5,0); at(W3,0.5,2); const stand={x:ofc(c3)[0].x,z:ofc(c3)[0].z}; W3.x=stand.x; W3.z=stand.z; W3.dgX=W3.x; W3.dgZ=W3.z; W3.hp=W3.maxHp; let hurt=false;
    for(let i=0,n=Math.ceil((x.DG_EGG_WARN+1)/0.05);i<n;i++){ tick(1); if(W3.hp<W3.maxHp) hurt=true; W3.hp=W3.maxHp; W2.hp=W2.maxHp; }
    const hatched=B.adds.filter(a=>a.def===B.bd.add&&!a.dead&&!a.remove).length-bro0;
    ok('the eggs left standing hatch: whoever stands among them is hurt, each egg leaves a broodling (five hatched here, at most '+x.DG_BROOD_MAX+' in the hall) and no clutch counts as lost',hurt&&hatched===5&&B.k.eggs.length===0&&B.k.lost===1,'hatched '+hatched);
    IMM.add('w'); IMM.add('v'); for(const p of [W2,W3]){ p.hp=p.maxHp; } B.stunT=0;
    const i2=W2.gear.inv.length, i3=W3.gear.inv.length; clear(); withRandom(0.0005,()=>x.killMonsterS(B.m,W2)); tick(3);
    const n2=W2.gear.inv.slice(i2), n3=W3.gear.inv.slice(i3), w2=n2.find(id=>/^ring8-/.test(id)), d2=last('w','dge');
    ok('the win pays EVERY member the same level-40 ring through dgGrantItemP (unrolled: no ~ code), listed in the results, and is saved as a clear',r.phase==='won'&&!!w2&&n3.includes(w2)&&x.dgParse(w2).t===8&&!x.dgParse(w2).roll&&x.ITEM[w2].lv===40&&x.ITEM[w2].roll0===true&&x.ITEM[w2].kind==='ring'&&!!d2&&d2[6].includes(w2)&&W2.gear.dg.clear['termitecathedral:purge']===1&&W3.gear.dg.clear['termitecathedral:purge']===1,n2+' / '+n3);
    secs(x.DG_END_S+0.5); } }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
