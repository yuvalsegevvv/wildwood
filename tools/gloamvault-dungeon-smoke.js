// Headless test of the Gloamvault (shared/dungeons/themes/gloamvault.js, boss Abbess Morrow): the Gloamhorn's dungeon, level 40 at +0, entered from level 38 once Wraithwick has been walked into (gear.gloam 2), paying a level-40 armour piece.
// Server straight from src/ (no build): the theme and its boss at level 40, the door at GLOAM_DG_DOOR, the entry rules, the offer and the board, a run's monsters (Gloamhorn kinds with res / acc), the reward (a level-40, unrolled
// armour piece of the pool, the odds), the Drowning Toll (stay close, then get out; a toll that hurts nobody stuns her), and a won run in a party of two giving the same piece to both. Usage: node tools/gloamvault-dungeon-smoke.js
const {loadServer}=require('./load');
const got={}, msgs={};
const {api:W,x}=loadServer({dev:true,log(){},send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (msgs[pid]=msgs[pid]||[]).push(c); if(c.t==='snap'&&c.ev) (got[pid]=got[pid]||[]).push(...c.ev); }},
  ['DG_RUNS','DG_THEMES','DG_BAD','DG_ENTRANCES','DG_LANDS','DG_ENTRY_LV','DG_LV','DG_END_S','DG_BOSS_DEFS','DG_BOSSES','DG_REWARDS','GLOAM_DG_DOOR','ZTIER_MAX','ZTIER_STEP','ARMOR_SLOTS','ITEM','MON_DEFS',
   'dgEntranceNear','dgApron','dgUnlocked','dgGateOpen','dgLevel','dgOffer','dgPoolS','dgClearReward','dgParse','dgItem','dgBossDefOf','killMonsterS','BOSS_KITS','DG_TOLL_WARN','DG_TOLL_GAP','DG_TOLL_INNER','DG_TOLL_BURST','DG_TOLL_STUN']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const IMM=new Set(), tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const pid of IMM){ const p=W.players.get(pid); if(p&&!p.dead) p.hp=p.maxHp; } } };
const secs=s=>tick(Math.ceil(s/0.05)), P=pid=>W.players.get(pid);
const evs=(pid,kind)=>(got[pid]||[]).filter(e=>e[0]===kind), last=(pid,kind)=>{ const a=evs(pid,kind); return a[a.length-1]; }, lastMsg=(pid,t)=>{ const a=(msgs[pid]||[]).filter(m=>m.t===t); return a[a.length-1]; };
const toasts=pid=>evs(pid,'toast').map(e=>e[2]).join(' | '), clear=()=>{ for(const k in got) got[k]=[]; for(const k in msgs) msgs[k]=[]; };
const join=(pid,name,save)=>{ W.join(pid,{name,look:{cls:'warrior'},save}); IMM.add(pid); return P(pid); };
const withRandom=(v,fn)=>{ const r=Math.random; Math.random=()=>v; try{ return fn(); } finally { Math.random=r; } };
const T=x.DG_THEMES.gloamvault, E=x.DG_ENTRANCES.gloamvault, D=x.GLOAM_DG_DOOR, gzt=(on,max)=>({gloam:{on,max},sun:{on:0,max:0},home:{on:0,max:0},vale:{on:0,max:0},hoar:{on:0,max:0},grey:{on:0,max:0}});

// ---- the theme, the boss and the levels ----
ok('the Gloamvault is registered (no bad theme): the Gloamhorn\'s dungeon under Vault Heath, level 40, entry level 38, boss Abbess Morrow, six Gloamhorn walkers and the Gargoyle and Storm Gargoyle keeping the vault',
  !!T&&x.DG_BAD.length===0&&T.land==='gloam'&&T.at==='Vault Heath'&&T.lv===40&&T.entry===38&&T.boss==='abbess'&&T.mobs.walkers.length>=5&&T.mobs.guardians.join()==='gargoyle,stormgargoyle'&&x.DG_LANDS.gloam&&x.DG_ENTRY_LV===25);
ok('the older dungeons keep entry level 25 and level 30 (the `entry` field defaults), the Sandglass 36',['hollowroots','jadesprings','bonefrostbarrow','blackseam'].every(id=>x.DG_THEMES[id].entry===25&&x.DG_THEMES[id].lv===30)&&x.DG_THEMES.sandglass.entry===36);
{ const B=x.DG_BOSSES.abbess, R=x.DG_BOSS_DEFS.abbess;
  ok('the Abbess\'s base level is exactly 40: the design, the def makeBossS takes and the theme\'s level at +0 (her add one lower), and 40 + 10 a tier above; she carries the Gloamhorn\'s res and acc 0.35',B.lv===40&&R.def.level===40&&R.def.boss&&R.add.level===39&&x.dgBossDefOf(T)===R&&x.dgLevel(T,0)===40&&[0,1,2,3,4,5].map(k=>x.dgLevel(T,k)).join()==='40,50,60,70,80,90'&&x.ZTIER_MAX===5&&R.def.res===0.35&&R.def.acc===0.35);
  ok('the boss is registered with a kit that has start, tick and phase (kit `toll`), exactly one signature (the Drowning Toll) and at least five moves',['start','tick','phase'].every(f=>typeof x.BOSS_KITS.toll[f]==='function')&&R.kit==='toll'&&B.moves.filter(m=>m.signature).map(m=>m.id).join()==='toll'&&B.moves.length>=5); }
ok('every monster of the dungeon is a Gloamhorn kind (zones m32-m40) carrying res or acc like the rest of the land, walkers fit a 4 m door',[...T.mobs.walkers,...T.mobs.guardians].every(id=>{ const d=x.MON_DEFS.find(q=>q.id===id); return d&&/^m\d\d$/.test(d.zone)&&d.level>=32&&d.level<=40&&(d.res>0||d.acc>0); })&&T.mobs.walkers.every(id=>x.MON_DEFS.find(q=>q.id===id).rad<=0.9));

// ---- the door ----
ok('the door is the prop the Gloamhorn reserved: DG_ENTRANCES.gloamvault at GLOAM_DG_DOOR (facing its rot), six doors in all, found from 3 m and not from 9 m, its apron 7 m out',
  !!E&&E.x===D.x&&E.z===D.z&&E.a===D.rot&&E.theme==='gloamvault'&&Object.keys(x.DG_ENTRANCES).length===6&&x.dgEntranceNear(D.x+Math.sin(E.a)*3,D.z+Math.cos(E.a)*3)===E&&x.dgEntranceNear(D.x+Math.sin(E.a)*9,D.z+Math.cos(E.a)*9)===null&&Math.abs(Math.hypot(x.dgApron(E).x-D.x,x.dgApron(E).z-D.z)-7)<1e-9);

// ---- who may enter: Wraithwick walked into (gear.gloam 2) and level 38, at every difficulty ----
{ const un=(g,lv,tier)=>x.dgUnlocked(g,lv,T,tier);
  ok('the way is shut until Wraithwick has been walked into: the gate is closed at gear.gloam 0 and 1, open at 2, and the hint says so',!x.dgGateOpen({gloam:0,zt:gzt(0,0)},T)&&!x.dgGateOpen({gloam:1,zt:gzt(0,0)},T)&&x.dgGateOpen({gloam:2,zt:gzt(0,0)},T)&&!un({gloam:1,zt:gzt(0,0)},60).ok&&/Wraithwick/.test(un({gloam:1,zt:gzt(0,0)},60).why));
  ok('entry is level 38 (not 25) once the gate is open: 37 refused with the level in the message, 38 let in at level 40, +0 needing no tier',!un({gloam:2,zt:gzt(0,0)},37).ok&&/level 38/.test(un({gloam:2,zt:gzt(0,0)},37).why)&&un({gloam:2,zt:gzt(0,0)},38).ok&&un({gloam:2,zt:gzt(0,0)},38).level===40&&un({gloam:2,zt:gzt(0,0)},38).tier===0);
  ok('the Gloamhorn\'s own tier sets the level (+2 = 60) and needs it unlocked (gear.zt.gloam.max), at the same entry level',un({gloam:2,zt:gzt(2,2)},38,2).level===60&&!un({gloam:2,zt:gzt(0,0)},60,2).ok&&/not unlocked \+2/.test(un({gloam:2,zt:gzt(0,0)},60,2).why)&&!un({gloam:2,zt:gzt(2,2)},37,2).ok); }
ok('the hourly offer is two different missions of the seven, like every dungeon',(()=>{ const o=x.dgOffer('gloamvault',Date.UTC(2026,9,3,5),x.dgPoolS()); return o.length===2&&o[0]!==o[1]; })());

// ---- the board at the door, and a run started there ----
const A=join('a','Ash',{level:38,gear:{gloam:2,neck:1,zt:gzt(0,0)}}), L37=join('s','Sol',{level:37,gear:{gloam:2,neck:1,zt:gzt(0,0)}}), N=join('n','Nia',{level:60,gear:{gloam:1,neck:1,zt:gzt(0,0)}}); tick(3);
const near={x:D.x+Math.sin(E.a)*3,z:D.z+Math.cos(E.a)*3};
for(const p of [A,L37,N]){ p.x=near.x; p.z=near.z; }
clear(); W.receive('a',{t:'dg',a:'open'}); W.receive('s',{t:'dg',a:'open'}); W.receive('n',{t:'dg',a:'open'}); tick(2);
{ const b=lastMsg('a','dgboard'), s=lastMsg('s','dgboard'), n=lastMsg('n','dgboard');
  ok('at the door the board opens for level 38 (th gloamvault, level 40, open) and says no to level 37 (why: level 38) and to a hiker who has not walked into Wraithwick (gate shut)',!!b&&b.th==='gloamvault'&&b.L===40&&b.ok===1&&b.gate===1&&b.offer.length===2&&!!s&&s.ok===0&&/level 38/.test(s.why)&&s.gate===1&&!!n&&n.ok===0&&n.gate===0,JSON.stringify([b&&b.ok,s&&s.why,n&&n.gate])); }
clear(); W.receive('s',{t:'dg',a:'start',dungeon:'gloamvault',type:x.dgOffer('gloamvault',Date.now(),x.dgPoolS())[0]}); W.receive('n',{t:'dg',a:'start',dungeon:'gloamvault',type:x.dgOffer('gloamvault',Date.now(),x.dgPoolS())[0]}); tick(2);
ok('a level-37 hiker and one who has not been to Wraithwick cannot start a run',!L37.inst&&!N.inst);
// seven mission types start (the offer is two an hour: the testing tool starts any)
{ const started=[]; for(const mi of ['purge','defense','survival','sabotage','siege','hunt','escort']){ W.receive('a',{t:'dev',cmd:'dg',v:'gloamvault:'+mi+':3'}); tick(3); const r=A.inst?x.DG_RUNS.get(A.inst):null;
    started.push(!!r&&r.th==='gloamvault'&&r.mission===mi&&r.L===40&&(mi!=='purge'||r.mons.size>0)); W.receive('a',{t:'dg',a:'leave'}); tick(3); }
  ok('all seven mission types start as the Gloamvault at level 40 (Purge with its monsters at once)',started.length===7&&started.every(Boolean),started.join()); }
W.receive('a',{t:'dev',cmd:'dg',v:'gloamvault:purge:5'}); tick(3);
const run=A.inst?x.DG_RUNS.get(A.inst):null;
ok('a purge run: the walkers are the Gloamhorn\'s, fought at level 40 (dgK) with their res / acc passing through (m.T.res, m.T.acc)',!!run&&[...run.mons].length>0&&[...run.mons].every(m=>T.mobs.walkers.includes(m.def.id)||T.mobs.guardians.includes(m.def.id))&&[...run.mons].every(m=>m.dgK&&m.dgK.lv===40&&(m.T.res>0||m.T.acc>0)));
W.receive('a',{t:'dg',a:'leave'}); tick(3);
{ W.receive('a',{t:'dev',cmd:'dg',v:'gloamvault:hunt:5'}); tick(3); const r=A.inst?x.DG_RUNS.get(A.inst):null;
  ok('a hunt run\'s quarry is the Grave Hound (a Gloamhorn kind slipping between the tombs)',!!r&&!!r.k&&!!r.k.q&&r.k.q.def.id==='gravehound'); W.receive('a',{t:'dg',a:'leave'}); tick(3); }

// ---- what a clear pays ----
{ const R=x.DG_REWARDS.gloamvault, rnd=(()=>{ let a=7; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; })();
  const seen={}, rar=[0,0,0,0,0], N2=30000; let bad=0;
  for(let i=0;i<N2;i++){ const id=x.dgClearReward('gloamvault',rnd), q=x.dgParse(id), it=x.dgItem(id);
    if(!q||!it||q.t!==8||q.n!==0||q.roll||it.lv!==40||it.kind!=='armor'||!R.pool.includes(q.slot)||!it.roll0||it.rcode||!/^(helmet|top|bottom|shoes)8(-[reul])?$/.test(id)) bad++; seen[q.slot]=(seen[q.slot]||0)+1; rar[q.rar]++; }
  const within=(o,n,p)=>Math.abs(o-n*p)<=4*Math.sqrt(n*p*(1-p))+1;
  ok('a clear rolls a +0, UNROLLED level-40 armour piece (helmet8 / top8 / bottom8 / shoes8, no ~roll code, waiting for an Armor Reroll Stone) of the pool, each piece equally often, at 70 / 25 / 4 / 0.8 / 0.2%',bad===0&&R.pool.join()===x.ARMOR_SLOTS.join()&&R.t===8&&x.ARMOR_SLOTS.every(s=>within(seen[s],N2,1/x.ARMOR_SLOTS.length))&&rar.every((c,r)=>within(c,N2,[0.7,0.25,0.04,0.008,0.002][r])),JSON.stringify(seen)+' '+rar); }

// ---- a purge won through the Abbess by a party of two: the Drowning Toll, then both get the same level-40 armour ----
const K=join('k','Kai',{level:40,gear:{gloam:2,neck:1,zt:gzt(0,0)}}), L2=join('l','Lea',{level:40,gear:{gloam:2,neck:1,zt:gzt(0,0)}}); tick(2);
W.receive('k',{t:'party',a:'invite',name:'Lea'}); tick(2); W.receive('l',{t:'party',a:'accept'}); tick(2);
K.x=near.x; K.z=near.z; L2.x=near.x+0.5; L2.z=near.z; clear();
W.receive('k',{t:'dg',a:'open'}); tick(1);
const wantType=x.dgOffer('gloamvault',Date.now(),x.dgPoolS())[0];
W.receive('k',{t:'dg',a:'start',dungeon:'gloamvault',type:wantType}); tick(2); W.receive('l',{t:'dg',a:'accept'}); tick(3);
const runK=K.inst?x.DG_RUNS.get(K.inst):null;
ok('the leader starts from the door board and the member follows: one run, the Gloamvault, level 40, two inside',!!runK&&runK.th==='gloamvault'&&runK.L===40&&L2.inst===K.inst&&runK.mission===wantType,toasts('k')+' | '+toasts('l'));
W.receive('k',{t:'dg',a:'leave'}); W.receive('l',{t:'dg',a:'leave'}); tick(3);
{ const W2=join('w','Wen',{level:40,gear:{gloam:2,neck:1,zt:gzt(0,0)}}), W3=join('v','Vik',{level:40,gear:{gloam:2,neck:1,zt:gzt(0,0)}}); tick(2);
  W.receive('w',{t:'party',a:'invite',name:'Vik'}); tick(2); W.receive('v',{t:'party',a:'accept'}); tick(2);
  W.receive('w',{t:'dev',cmd:'dg',v:'gloamvault:purge:5'}); tick(2); W.receive('v',{t:'dg',a:'accept'}); tick(3);
  const r=W2.inst?x.DG_RUNS.get(W2.inst):null;
  ok('a testing run of the Gloamvault with a party of two: both in it',!!r&&r.th==='gloamvault'&&W3.inst===W2.inst);
  if(r){ for(const m of [...r.mons]) if(m.dgRole==='purge'&&!m.dead) x.killMonsterS(m,W2); tick(3);
    ok('Purge: killing them brings the Abbess into the round hall at level 40, with the kit `toll`',!!r.boss&&r.phase==='boss'&&r.boss.bd.def.id==='abbess'&&r.boss.m.dgK.lv===40&&r.boss.bd.kit==='toll');
    const B=r.boss, A3=B.A, m=B.m, at=(p,d,a)=>{ p.x=m.x+Math.sin(a)*d; p.z=m.z+Math.cos(a)*d; p.dgX=p.x; p.dgZ=p.z; };
    W2.x=A3.x+3; W2.z=A3.z+3; W2.dgX=W2.x; W2.dgZ=W2.z; secs(1);
    ok('she engages when a member steps into the hall and the kit ticks through the first moves without a fault',B.engaged&&(secs(8),true));
    // (5 m from her is inside the first toll's safe ring and out of her reach) the Drowning Toll: stand close for the first toll, get out for the second -> no one is hurt and the bell cracks; stand out for the first -> hurt
    IMM.delete('w'); IMM.delete('v'); const quiet=()=>{ B.k.chainT=B.k.brineT=B.k.quakeT=B.k.acolyteT=B.k.requiemT=99; };
    const heal=()=>{ for(const p of [W2,W3]) p.hp=p.maxHp; };
    const watch=sec=>{ const f=[false,false]; for(let i=0,n=Math.ceil(sec/0.05);i<n;i++){ tick(1); [W2,W3].forEach((p,j)=>{ if(p.hp<p.maxHp) f[j]=true; }); heal(); } return f; };   // (one tick at a time: who lost health, healed after each)
    const toll=(where1,where2)=>{ B.stunT=0; quiet(); at(W2,5,0); at(W3,5,2); watch(10); B.k.tollT=0; B.busy=0; B.mv=null; B.k.hurt=0; const tolls0=B.k.tolls; watch(0.05); where1(); heal();
      const first=watch(x.DG_TOLL_WARN+0.1); where2(); const second=watch(x.DG_TOLL_GAP+0.1);
      return {tolls:B.k.tolls-tolls0,first,second,stun:B.stunT}; };
    const R1=toll(()=>{ at(W2,5,0); at(W3,5,2); },()=>{ at(W2,x.DG_TOLL_BURST+2.5,0); at(W3,x.DG_TOLL_BURST+2.5,2); });
    ok('the Drowning Toll, played right (close for the first toll, out for the second): nobody is hurt, the toll count rises and the cracked bell stuns her',R1.tolls===1&&!R1.first[0]&&!R1.first[1]&&!R1.second[0]&&!R1.second[1]&&R1.stun>0,JSON.stringify(R1));
    const R2=toll(()=>{ at(W2,x.DG_TOLL_INNER+5,0); at(W3,5,2); },()=>{ at(W2,x.DG_TOLL_BURST+3,0); at(W3,5,2); });
    ok('played wrong (one stays outside for the first toll, the other stays in for the second): the one outside is hurt by the donut, the one inside by the burst, and the bell does not crack',R2.first[0]&&!R2.first[1]&&R2.second[1]&&R2.stun===0,JSON.stringify(R2));
    IMM.add('w'); IMM.add('v'); for(const p of [W2,W3]){ p.hp=p.maxHp; } B.stunT=0;
    const i2=W2.gear.inv.length, i3=W3.gear.inv.length; clear(); withRandom(0.0005,()=>x.killMonsterS(B.m,W2)); tick(3);
    const n2=W2.gear.inv.slice(i2), n3=W3.gear.inv.slice(i3), w2=n2.find(id=>/^(helmet|top|bottom|shoes)8/.test(id)), d2=last('w','dge');
    ok('the win pays EVERY member the same level-40 armour piece through dgGrantItemP (unrolled: no ~ code), listed in the results, and is saved as a clear',r.phase==='won'&&!!w2&&n3.includes(w2)&&x.dgParse(w2).t===8&&!x.dgParse(w2).roll&&x.ITEM[w2].lv===40&&x.ITEM[w2].roll0===true&&x.ITEM[w2].kind==='armor'&&!!d2&&d2[6].includes(w2)&&W2.gear.dg.clear['gloamvault:purge']===1&&W3.gear.dg.clear['gloamvault:purge']===1,n2+' / '+n3);
    secs(x.DG_END_S+0.5); } }
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
