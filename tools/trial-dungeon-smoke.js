// Headless test of the Trial Roots (shared/dungeons/themes/trial.js, DG_TRIAL_GATE): the Hollow Roots at level 5, open to everyone, paying nothing, entered through a gate in the home
// village. Server straight from src/ (no build): the theme is the Hollow Roots' with its level changed, the gate and the board, a level-1 hiker on a run at level 5 at any zone tier, and that no
// kill, boss, chest, clear piece, clear record or skill set pays out (with the Hollow Roots as the control that does). Usage: node tools/trial-dungeon-smoke.js
const {loadServer}=require('./load');
const got={}, msgs={};
const {api:W,x}=loadServer({dev:true,log(){},send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (msgs[pid]=msgs[pid]||[]).push(c); if(c.t==='snap'&&c.ev) (got[pid]=got[pid]||[]).push(...c.ev); }},
  ['DG_RUNS','DG_THEMES','DG_BAD','DG_ENTRANCES','DG_TRIAL_GATE','DG_LV','DG_END_S','MONS','VIL','VR','dgEntranceNear','dgApron','dgUnlocked','dgGateOpen','dgLevel','dgTierFor','dgOffer','dgPoolS','dgRemoveS',
   'killMonsterS','dgChestOpenS','dgObjS','SS_SOURCES','DG_REWARDS','dgClearReward','getH','SS_ORDER']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const IMM=new Set(), tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const pid of IMM){ const p=W.players.get(pid); if(p&&!p.dead) p.hp=p.maxHp; } } };
const secs=s=>tick(Math.ceil(s/0.05)), P=pid=>W.players.get(pid);
const evs=(pid,kind)=>(got[pid]||[]).filter(e=>e[0]===kind), lastMsg=(pid,t)=>{ const a=(msgs[pid]||[]).filter(m=>m.t===t); return a[a.length-1]; };
const toasts=pid=>evs(pid,'toast').map(e=>e[2]).join(' | '), clear=()=>{ for(const k in got) got[k]=[]; for(const k in msgs) msgs[k]=[]; };
const join=(pid,name,save)=>{ W.join(pid,{name,look:{cls:'warrior'},save}); IMM.add(pid); return P(pid); };
const withRandom=(v,fn)=>{ const r=Math.random; Math.random=()=>v; try{ return fn(); } finally { Math.random=r; } };
const T=x.DG_THEMES.trial, H=x.DG_THEMES.hollowroots, G=x.DG_TRIAL_GATE;

// ---- the theme and the rules ----
ok('the Trial Roots is registered (no bad theme) as the Hollow Roots with level 5: same tiles, roster, boss, music and palette',!!T&&x.DG_BAD.length===0&&T.lv===5&&T.trial===true&&T.tiles===H.tiles&&T.boss===H.boss&&T.music===H.music&&T.legend===H.legend&&JSON.stringify(T.mobs)===JSON.stringify(H.mobs)&&JSON.stringify(T.pal)===JSON.stringify(H.pal)&&T.id!==H.id);
ok('it is level 5 at every difficulty, open to a level-1 hiker with no progress, and it ignores the zone tier you play at',[0,1,2,3,4,5].every(t=>x.dgLevel(T,t)===5)&&x.dgUnlocked({},1,T,0).ok&&x.dgUnlocked({},1,T,0).level===5&&x.dgGateOpen({},T)&&x.dgTierFor({zt:{home:{on:3,max:3}}},T)===0&&x.dgTierFor({zt:{home:{on:3,max:3}}},H)===3);
ok('the real dungeon is untouched: the Hollow Roots is still level 30, locked at +0, entered from level 25',x.dgLevel(H,1)===30&&!x.dgGateOpen({zt:{home:{on:0,max:0}}},H)&&!x.dgUnlocked({zt:{home:{on:1,max:1}}},24,H,1).ok&&x.dgUnlocked({zt:{home:{on:1,max:1}}},25,H,1).ok);
ok('it pays nothing by the rules either: no clear piece, no skill set source',x.dgClearReward('trial')===null&&!x.DG_REWARDS.trial&&!Object.values(x.SS_SOURCES).some(s=>s.includes('trial')));

// ---- the gate ----
const dV=Math.hypot(G.x-x.VIL.x,G.z-x.VIL.z), ap=x.dgApron(G);
ok('the gate stands in the home village, inside the houses\' ring of the road in, and is not one of the five doors',dV>28&&dV<34&&Object.keys(x.DG_ENTRANCES).length===5&&!Object.values(x.DG_ENTRANCES).includes(G)&&G.temp===true);
ok('it is found from 3 m, not from 8 m; its apron is a few metres off, inside the village and on flat ground',x.dgEntranceNear(G.x+3,G.z)===G&&x.dgEntranceNear(G.x+8,G.z)===null&&Math.hypot(ap.x-G.x,ap.z-G.z)>3&&Math.hypot(ap.x-G.x,ap.z-G.z)<9&&Math.hypot(ap.x-x.VIL.x,ap.z-x.VIL.z)<x.VR+2&&Math.abs(x.getH(ap.x,ap.z)-x.getH(G.x,G.z))<0.6);
{ const h=x.dgEntranceNear(x.DG_ENTRANCES.hollowroots.x+2,x.DG_ENTRANCES.hollowroots.z); ok('the five real doors are still found where they were',h===x.DG_ENTRANCES.hollowroots&&Object.values(x.DG_ENTRANCES).every(E=>x.dgEntranceNear(E.x,E.z)===E)); }

// ---- the board and a run, as a level-1 hiker who has done nothing ----
const A=join('a','Ash',{level:1,gear:{zt:{home:{on:2,max:2}}}}); tick(3);
A.x=G.x+2.5; A.z=G.z; clear(); W.receive('a',{t:'dg',a:'open'}); tick(2);
const bd=lastMsg('a','dgboard'), pool=x.dgPoolS(), offer=x.dgOffer('trial',Date.now(),pool);
ok('at the gate the board opens for the trial: level 5, no difficulty, open for a level-1 hiker, and EVERY mission type on offer (not an hourly pair)',!!bd&&bd.th==='trial'&&bd.L===5&&bd.tier===0&&bd.gate===1&&bd.ok===1&&bd.lead===1&&bd.offer.length===7&&JSON.stringify(bd.offer)===JSON.stringify(pool),JSON.stringify(bd.offer));
ok('the offer never changes with the hour for the trial, while a real dungeon still offers two',[0,1,2,500].every(h=>JSON.stringify(x.dgOffer('trial',Date.UTC(2026,9,3,h),pool))===JSON.stringify(pool))&&x.dgOffer('hollowroots',Date.UTC(2026,9,3,12),pool).length===2);
A.x=G.x+30; A.z=G.z; clear(); W.receive('a',{t:'dg',a:'start',dungeon:'trial',type:offer[0]}); tick(2);
ok('away from the gate a run cannot start',!A.inst&&/door/.test(toasts('a')));
A.x=G.x+2.5; A.z=G.z; A.zNow=0; clear(); W.receive('a',{t:'dg',a:'start',dungeon:'trial',type:offer[0]}); tick(4);
const run=A.inst?x.DG_RUNS.get(A.inst):null;
ok('a level-1 hiker playing Wildwood at +2 starts it: the run is the trial, level 5, difficulty 0',!!run&&run.th==='trial'&&run.L===5&&run.tier===0&&run.mission===offer[0]);
ok('its monsters are the Hollow Roots\' walkers and guardians, fought at level 5 (health and damage scaled to it), the party\'s health on top',!!run&&[...run.mons].length>0&&[...run.mons].every(m=>(H.mobs.walkers.includes(m.def.id)||H.mobs.guardians.includes(m.def.id))&&m.dgK&&m.dgK.lv===5));
{ const m=[...run.mons].find(q=>q.dgK); clear(); const exp0=A.exp, c0=A.gear.coins, inv0=A.gear.inv.length, mats0=JSON.stringify(A.gear.mats);
  withRandom(0.0005,()=>x.killMonsterS(m,A)); tick(3);
  ok('a kill in the trial pays nothing: no XP, coins, items or materials, and no coins or xp event',m.dead&&A.exp===exp0&&A.gear.coins===c0&&A.gear.inv.length===inv0&&JSON.stringify(A.gear.mats)===mats0&&!evs('a','coins').length&&!evs('a','xp').length); }
{ const ob=x.dgObjS(run,'chest',run.B.boss.x,run.B.boss.z,{r:1.5,v:3}); ob.st=1; const inv0=A.gear.inv.length, c0=A.gear.coins; clear(); const r=x.dgChestOpenS(run,ob,A); tick(2);
  ok('a reward chest in the trial is empty: it opens (state 2) and gives nothing',Array.isArray(r)&&r.length===0&&ob.st===2&&A.gear.inv.length===inv0&&A.gear.coins===c0); }
W.receive('a',{t:'dg',a:'leave'}); tick(3);
ok('leaving puts the hiker back on the gate\'s apron',!A.inst&&Math.hypot(A.x-ap.x,A.z-ap.z)<1.5,Math.hypot(A.x-ap.x,A.z-ap.z).toFixed(1)+' m');

{ const started=[]; for(const type of pool){ A.x=G.x+2.5; A.z=G.z; clear(); W.receive('a',{t:'dg',a:'start',dungeon:'trial',type}); tick(3); const r=A.inst?x.DG_RUNS.get(A.inst):null; started.push(!!r&&r.th==='trial'&&r.mission===type&&r.L===5); W.receive('a',{t:'dg',a:'leave'}); tick(3); }
  ok('every one of the seven mission types can be started at the gate, whichever hour it is, and each is the trial at level 5',started.length===7&&started.every(Boolean),started.join()); }

// ---- a whole run won: nothing paid, nothing recorded; and the Hollow Roots as the control ----
const win=(th,pid,name)=>{
  const Q=join(pid,name,{level:20,gear:{zt:{home:{on:1,max:1}}}}); tick(2); W.receive(pid,{t:'dev',cmd:'dg',v:th+':purge:5'}); tick(3);
  const r=Q.inst?x.DG_RUNS.get(Q.inst):null; if(!r) return {Q,r:null};
  for(const m of [...r.mons]) if(m.dgRole==='purge'&&!m.dead) withRandom(0.0005,()=>x.killMonsterS(m,Q)); tick(3);
  const exp0=Q.exp, coins0=Q.gear.coins, inv0=Q.gear.inv.length, clr0=JSON.stringify(Q.gear.dg.clear);
  Q.x=r.boss.A.x+3; Q.z=r.boss.A.z+3; Q.dgX=Q.x; Q.dgZ=Q.z; secs(1); clear();
  withRandom(0.0005,()=>x.killMonsterS(r.boss.m,Q)); tick(3);
  return {Q,r,dge:evs(pid,'dge')[0],dExp:Q.exp-exp0,dCoins:Q.gear.coins-coins0,dInv:Q.gear.inv.length-inv0,clearsChanged:JSON.stringify(Q.gear.dg.clear)!==clr0,pid};
};
const t=win('trial','t','Tia'), c=win('hollowroots','h','Hal');
ok('the control pays: a won Hollow Roots run gives XP, coins, the boss\'s drop and the clear\'s piece, and records the clear',!!c.r&&c.r.phase==='won'&&c.dCoins>0&&c.dInv>0&&c.clearsChanged&&c.Q.gear.dg.clear['hollowroots:purge']===1);
ok('a won trial run (the boss at level 5) pays nothing: no XP, no coins, no items, no clear record, no skill set roll',!!t.r&&t.r.phase==='won'&&t.r.boss.m.dgK.lv===5&&t.dExp===0&&t.dCoins===0&&t.dInv===0&&!t.clearsChanged&&!t.Q.gear.dg.clear['trial:purge']&&!evs('t','ssget').length&&!(t.Q.gear.ss&&Object.keys(t.Q.gear.ss.pity).length));
ok('and the win is still announced to the hiker, with nothing in the list (dge: won, seconds, xp 0, coins 0, no items)',(()=>{ const d=t.dge; return !!d&&d[2]===1&&d[4]===0&&d[5]===0&&d[6].length===0; })(),JSON.stringify(t.dge));
secs(x.DG_END_S+0.5);
console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
