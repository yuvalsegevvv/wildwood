// Headless test of dungeon runs on the server (server/dungeons/*.js and their hooks), straight from src/ (no build): slots and the floor, the testing tool's start and
// the tp payload, two runs and the world kept apart (events, snapshots, rosters), a walker finding its way round a wall, walls stopping hits and projectiles, setPos
// inside a run, party health at spawn, joining in progress, every member getting every drop, the zone-tier trap, a place held for a reconnect, downed / revive /
// respawn / lost, a purge run won through its boss (the save, the return), a start at a door (the offer, the gate), the slot cap, a Shared host refusing, the kit registry.
// Usage: node tools/dungeon-runs-smoke.js
const {loadServer}=require('./load');
const got={}, msgs={};   // pid -> events / messages received
const NAMES=['DG_RUNS','DG_SLOT_RUN','DG_KITS','DG_KIT_BAD','DG_THEMES','DG_MISSIONS','DG_PARTY','DG_X0','DG_SLOT','DG_FLOOR_Y','DG_MAX_INST','DG_ENTRANCES','DG_HOLD_S','DG_END_S','DG_EMPTY_S',
  'DG_DOWN_S','DG_REVIVE_HP','DG_LV','MONS','S','WX1','getH','dgWorldS','dgLocalS','dgSpawnS','dgRemoveS','dgPresentS','dgBossS','dgBossDefOf','dgSlotAt','dgSlotOrigin','dgSolid','dgFree','dgLos',
  'dgFlow','dgLayout','dgBake','dgOffer','dgPoolS','dgApron','dgDefineKit','dgMemberOf','dgKOf','damageMonsterS','killMonsterS','hurtP','monK','zoneTierK','landAt','recalcP','sanitizeGear',
  'DEF_BY_ID','fireProjS','PROJS','partyOf','ITEM','xpFor','psP','dgParse','PENDANT_STATS'];
const {api:W,x}=loadServer({dev:true,log(){},send(pid,m){ const c=JSON.parse(JSON.stringify(m)); (msgs[pid]=msgs[pid]||[]).push(c); if(c.t==='snap'&&c.ev) (got[pid]=got[pid]||[]).push(...c.ev); }},NAMES);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const IMM=new Set();   // players kept at full health (monsters roam the runs)
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const pid of IMM){ const p=W.players.get(pid); if(p&&!p.dead) p.hp=p.maxHp; } } };
const secs=s=>tick(Math.ceil(s/0.05));
const P=pid=>W.players.get(pid);
const evs=(pid,kind)=>(got[pid]||[]).filter(e=>e[0]===kind);
const last=(pid,kind)=>{ const a=evs(pid,kind); return a[a.length-1]; };
const mOf=(pid,t)=>(msgs[pid]||[]).filter(m=>m.t===t);
const lastMsg=(pid,t)=>{ const a=mOf(pid,t); return a[a.length-1]; };
const toasts=pid=>evs(pid,'toast').map(e=>e[2]).join(' | ');
const clear=()=>{ for(const k in got) got[k]=[]; for(const k in msgs) msgs[k]=[]; };
const join=(pid,name,save)=>{ W.join(pid,Object.assign({name,look:{cls:'warrior'}},{save:Object.assign({level:30},save||{})})); return P(pid); };
const dev=(pid,v)=>W.receive(pid,{t:'dev',cmd:'dg',v});
const dg=(pid,a,o)=>W.receive(pid,Object.assign({t:'dg',a},o||{}));
const runOf=pid=>x.DG_RUNS.get(P(pid).inst);
const clearMons=run=>{ for(const m of [...run.mons]) if(!m.boss) x.dgRemoveS(run,m); };
const local=(run,p)=>x.dgLocalS(run,p.x,p.z);
const withRandom=(v,fn)=>{ const r=Math.random; Math.random=()=>v; try{ return fn(); } finally { Math.random=r; } };

// ---- slots and the floor ----
{ const o0=x.dgSlotOrigin(0), o1=x.dgSlotOrigin(1), o4=x.dgSlotOrigin(4);
  ok('slots lie far east of the walkable world, 600 m apart, 4 a row, 16 at most',x.DG_X0>=x.WX1+1000&&o1.x-o0.x===600&&o4.z-o0.z===600&&o4.x===o0.x&&x.DG_MAX_INST===16&&x.dgSlotAt(o0.x+10,o0.z+10)===0&&x.dgSlotAt(o4.x+300,o4.z+250)===4&&x.dgSlotAt(0,0)===-1);
  ok('the floor of a slot is flat at DG_FLOOR_Y; the world keeps its hills',x.getH(o0.x+5,o0.z+5)===x.DG_FLOOR_Y&&x.getH(o1.x+200,o1.z+90)===x.DG_FLOOR_Y&&[[0,0],[100,-50],[-200,150]].some(([a,b])=>x.getH(a,b)!==x.DG_FLOOR_Y)); }
ok('the kit registry loaded with no bad kit, and Purge is built',x.DG_KIT_BAD.length===0&&!!x.DG_KITS.purge&&x.dgPoolS().includes('purge'),JSON.stringify(x.DG_KIT_BAD));

// ---- the testing tool's start, the tp payload ----
const A=join('a','Ash'), B=join('b','Bree'), C=join('c','Cole'); IMM.add('a'); IMM.add('b'); IMM.add('c');
const aStart={x:A.x,z:A.z}; tick(3); clear();
dev('a','bare:purge:7'); tick(3);
const runA=runOf('a');
{ const tp=mOf('a','tp').find(m=>m.dg), d=tp&&tp.dg;
  ok('dev{cmd:"dg"} starts a run for you: you are in it, in its slot',!!runA&&A.inst===runA.id&&x.dgSlotAt(A.x,A.z)===runA.slot);
  ok('the tp carries dg {id, m, seed, th, L, tier, ox, oz, y}: what the client needs to rebuild the same dungeon',!!d&&d.m==='purge'&&d.th==='bare'&&d.seed===runA.seed&&d.L===x.DG_LV&&d.ox===runA.ox&&d.oz===runA.oz&&d.y===x.DG_FLOOR_Y&&tp.x===A.x&&tp.z===A.z,JSON.stringify(d));
  const B2=x.dgBake(x.dgLayout({mission:d.m,seed:d.seed,theme:d.th}));
  ok('the seed rebuilds the very same grid (dgLayout + dgBake from the payload)',B2.w===runA.B.w&&B2.h===runA.B.h&&B2.cells.every((c,i)=>c===runA.B.cells[i])&&B2.start.x===runA.B.start.x);
  const l=local(runA,A); ok('you stand by the entrance portal, on the floor, clear of walls',x.dgFree(runA.B,l.x,l.z,0.4)&&Math.hypot(l.x-runA.B.start.x,l.z-runA.B.start.z)<8&&A.y===x.DG_FLOOR_Y);
  const ros=[...mOf('a','mons').flatMap(m=>m.list),...evs('a','spawn').map(e=>e[1])], mine=[...runA.mons];
  ok('a lone hiker\'s run sets up at once: its monsters reach you (a mons roster on entry, spawn events after), each entry with [.., level, maxHp]',runA.ready&&mine.length>=6&&mine.every(m=>ros.some(r=>r[0]===m.id&&r.length===11&&r[9]===runA.L&&r[10]===Math.round(m.maxHp))),mine.length+' monsters'); }
tick(4);
{ const s=lastMsg('a','snap'); ok('the snapshot carries dg [phase, seconds, waiting, ...kit hud]: Purge shows [killed, needed]',!!s&&Array.isArray(s.dg)&&s.dg[0]===0&&s.dg[2]===0&&s.dg[3]===0&&s.dg[4]===runA.k.need&&Array.isArray(s.b)&&s.b.length===0,JSON.stringify(s&&s.dg)); }

// ---- two runs and the world kept apart ----
dev('b','bare:purge:11'); tick(3);
const runB=runOf('b');
ok('a second run takes another slot, far from the first',!!runB&&runB!==runA&&runB.slot!==runA.slot&&Math.hypot(runB.ox-runA.ox,runB.oz-runA.oz)>=600);
clear(); tick(40);   // a few seconds, past a "send everyone" snapshot
{ const snA=mOf('a','snap').filter(s=>s.pl), snC=mOf('c','snap').filter(s=>s.pl);
  const plA=new Set(snA.flatMap(s=>s.pl.map(r=>r[0]))), plC=new Set(snC.flatMap(s=>s.pl.map(r=>r[0])));
  const moC=new Set(snC.flatMap(s=>(s.mo||[]).map(r=>r[0]))), runIds=new Set([...runA.mons,...runB.mons].map(m=>m.id));
  ok('players: a run\'s member sees only its members; the world sees no one in a run (even the once-a-second "everyone")',plA.has('a')&&!plA.has('b')&&!plA.has('c')&&plC.has('c')&&!plC.has('a')&&!plC.has('b'),'A sees '+[...plA]+', C sees '+[...plC]);
  ok('monsters: the world\'s snapshots carry none of a run\'s',![...moC].some(id=>runIds.has(id)));
  ok('bosses: a run member\'s b holds only his run\'s boss (none yet); the world\'s holds the eight (the six of the three old lands and the Greyspine\'s two)',snA.every(s=>s.b.length===0)&&snC.every(s=>s.b.length===8)); }
clear();
{ const ma=[...runA.mons][0], mb=[...runB.mons][0];
  for(const [p,m] of [[A,ma],[B,mb]]){ p.face=0; m.x=p.x; m.z=p.z-1.5; m.stunT=1; W.receive(p.id,{t:'atk',k:'basic',tg:m.id,face:0}); }   // a real swing at a monster put in front of each
  tick(12);
  const dA=evs('a','dmg').map(e=>e[1]), dB=evs('b','dmg').map(e=>e[1]), dC=evs('c','dmg').map(e=>e[1]);
  ok('events: a hit in one run reaches its members only (not the other run, not the world)',dA.includes(ma.id)&&!dA.includes(mb.id)&&dB.includes(mb.id)&&!dB.includes(ma.id)&&!dC.includes(ma.id)&&!dC.includes(mb.id),'A '+dA+' B '+dB+' C '+dC); }
clear(); const D=join('d','Dara'); tick(3);
{ const ros=mOf('d','mons').flatMap(m=>m.list).map(r=>r[0]);
  ok('a hiker joining the world is sent the world\'s monsters only',ros.length>500&&!ros.some(id=>runA.mons.has(x.MONS.find(m=>m.id===id))||[...runB.mons].some(m=>m.id===id)));
  ok('who joins the world is news in the runs too (pjoin goes to everyone)',evs('a','pjoin').some(e=>e[1].id==='d')&&evs('b','pjoin').some(e=>e[1].id==='d')); }
W.leave('d');

// ---- walls: a walker goes round, hits and projectiles stop ----
clearMons(runA); tick(2);
let pair=null;
{ const Bk=runA.B, l=local(runA,A), flow=x.dgFlow(Bk,l.x,l.z);
  for(let i=0;i<Bk.w*Bk.h&&!pair;i++){ const d=flow[i]; if(d<10||d>28) continue; const cx=(i%Bk.w+0.5)*2, cz=(Math.floor(i/Bk.w)+0.5)*2;
    if(x.dgFree(Bk,cx,cz,0.9)&&!x.dgLos(Bk,l.x,l.z,cx,cz)) pair={x:cx,z:cz,d}; } }
ok('the run has a spot out of sight of the entrance but reachable round a wall',!!pair,pair&&('flow '+pair.d+' cells'));
if(pair){
  const m=x.dgSpawnS(runA,'slime',pair.x,pair.z,{role:'test'});
  const l0=local(runA,A);
  ok('the spawn primitive: level of the run, party health (x1 alone), its run\'s numbers',m.inst===runA.id&&m.dgK.lv===runA.L&&m.maxHp===x.DEF_BY_ID.slime.hp*x.DG_PARTY.hp[0]&&runA.mons.has(m));
  // walls stop hits and projectiles
  m.hp=m.maxHp; const through=x.damageMonsterS(m,1,A,A.x,A.z,0);
  ok('a hit through a wall does nothing',through===0&&m.hp===m.maxHp);
  const h={x:A.x,z:A.z}, dx=m.x-h.x, dz=m.z-h.z, dl=Math.hypot(dx,dz);
  clear(); x.fireProjS(A,'shard',[dx/dl,0,dz/dl],null,1,'basic'); const prId=x.PROJS[x.PROJS.length-1].id; tick(30);
  const pe=evs('a','pend').find(e=>e[1]===prId), pl=pe&&x.dgLocalS(runA,pe[2],pe[4]);
  ok('a projectile flown at it ends in the wall',!!pe&&m.hp===m.maxHp&&x.dgSolid(runA.B,pl.x,pl.z),pe?'ended at '+pl.x.toFixed(1)+','+pl.z.toFixed(1):'no pend');
  m.dgHunt=true; let best=1e9, inWall=false;
  for(let i=0;i<20*25&&best>m.T.rad+1.6;i++){ tick(1); const ml=local(runA,m); if(x.dgSolid(runA.B,ml.x,ml.z)) inWall=true; best=Math.min(best,Math.hypot(m.x-A.x,m.z-A.z)); }
  ok('a walker reaches you round the wall (the flow field), never stepping into one',best<=m.T.rad+1.6&&!inWall,'closest '+best.toFixed(1)+' m');
  m.hp=m.maxHp; const now=x.damageMonsterS(m,1,A,A.x,A.z,0);
  ok('in sight, the same hit lands',now>0);
  x.dgRemoveS(runA,m);
}
// setPos inside a run
{ const l=local(runA,A), sx=A.x, sz=A.z;
  let wall=null; for(let r=1;r<20&&!wall;r++) for(const [ux,uz] of [[1,0],[-1,0],[0,1],[0,-1]]) if(!wall&&x.dgSolid(runA.B,l.x+ux*r,l.z+uz*r)) wall=[A.x+ux*(r+0.5),A.z+uz*(r+0.5)];
  W.setPos('a',[wall[0],x.DG_FLOOR_Y,wall[1],0,0,0]); const ll=local(runA,A);
  ok('setPos never puts you inside a wall',x.dgFree(runA.B,ll.x,ll.z,0.3));
  W.setPos('a',[sx,x.DG_FLOOR_Y,sz,0,0,0]);
  let far=null; for(let i=0;i<runA.B.w*runA.B.h&&!far;i++){ const cx=(i%runA.B.w+0.5)*2, cz=(Math.floor(i/runA.B.w)+0.5)*2, d=Math.hypot(cx-l.x,cz-l.z); if(d>20&&d<60&&x.dgFree(runA.B,cx,cz,0.5)) far=[runA.ox+cx,runA.oz+cz]; }
  W.setPos('a',[far[0],x.DG_FLOOR_Y,far[1],0,0,0]);
  ok('nor onto open floor 20+ m away in one step (a late or forged position)',Math.hypot(A.x-sx,A.z-sz)<1);
  W.setPos('a',[sx+0.5,x.DG_FLOOR_Y,sz,0,0,0]);
  ok('an ordinary step is taken',Math.abs(A.x-(sx+0.5))<1e-6);
  const cx=C.x; W.setPos('c',[runB.ox+20,10,runB.oz+20,0,0,0]);
  ok('slot coordinates from a hiker in no run are ignored (never clamped onto the world\'s edge)',C.x===cx&&!C.inst);
  W.setPos('a',[cx,5,C.z,0,0,0]);
  ok('a world position from a run member is ignored too (a late message)',A.inst===runA.id&&x.dgSlotAt(A.x,A.z)===runA.slot); }

// ---- a party's run: the start prompt, party health, joining in progress ----
const E=join('e','Eli'), F=join('f','Fern'), G=join('g','Gil'), H=join('h','Hana'); for(const p of 'efgh') IMM.add(p);
tick(2);
W.receive('e',{t:'party',a:'invite',name:'Fern'}); tick(2); W.receive('f',{t:'party',a:'accept'}); tick(2);
clear(); const eStart={x:E.x,z:E.z}; dev('e','bare:purge:21'); tick(3);
const runE=runOf('e');
{ const iv=last('f','dgi');
  ok('the leader is in at once; the party is prompted: dgi [pid, run, 0, theme, mission, level, seconds, leader]',!!runE&&!runE.ready&&!!iv&&iv[1]==='f'&&iv[2]===runE.id&&iv[3]===0&&iv[4]==='bare'&&iv[5]==='purge'&&iv[6]===runE.L&&iv[7]===15&&iv[8]==='Eli',JSON.stringify(iv));
  ok('nothing spawns while the party answers (so the head count is right)',runE.mons.size===0&&lastMsg('e','snap').dg[2]===1); }
dg('f','accept'); tick(3);
ok('a member who accepts is put in; with everyone in, the mission sets up',F.inst===runE.id&&runE.ready&&runE.mons.size>0&&x.dgPresentS(runE).length===2);
clearMons(runE);
const spawnHp=()=>{ const l=local(runE,E), m=x.dgSpawnS(runE,'slime',l.x,l.z+3,{}); return m; };
const m2=spawnHp();
ok('party health at spawn: 2 in the run, x'+x.DG_PARTY.hp[1],m2.maxHp===x.DEF_BY_ID.slime.hp*x.DG_PARTY.hp[1]&&m2.hp===m2.maxHp);
W.receive('e',{t:'party',a:'invite',name:'Gil'}); tick(2); W.receive('g',{t:'party',a:'accept'}); clear(); secs(1.5);
{ const iv=last('g','dgi'); ok('a new party member is prompted to join the run in progress (dgi kind 1)',!!iv&&iv[2]===runE.id&&iv[3]===1); }
dg('g','accept'); tick(3);
const m3=spawnHp();
ok('joining in progress works; 3 in the run: x'+x.DG_PARTY.hp[2],G.inst===runE.id&&m3.maxHp===x.DEF_BY_ID.slime.hp*x.DG_PARTY.hp[2]);
W.receive('e',{t:'party',a:'invite',name:'Hana'}); tick(2); W.receive('h',{t:'party',a:'accept'}); secs(1.5); dg('h','accept'); tick(3);
const m4=spawnHp();
ok('4 in the run: x'+x.DG_PARTY.hp[3],H.inst===runE.id&&m4.maxHp===x.DEF_BY_ID.slime.hp*x.DG_PARTY.hp[3]);
clear(); dg('h','leave'); tick(3);
const m5=spawnHp();
ok('one leaves: new spawns get easier (x'+x.DG_PARTY.hp[2]+'), those out keep their health',m5.maxHp===x.DEF_BY_ID.slime.hp*x.DG_PARTY.hp[2]&&m4.maxHp===x.DEF_BY_ID.slime.hp*x.DG_PARTY.hp[3]);
{ const tp=mOf('h','tp').find(m=>m.dg===false), gone=evs('h','despawn').map(e=>e[1]);
  ok('who leaves goes back (tp with dg:false) and the run\'s monsters leave his view',!H.inst&&!!tp&&gone.includes(m4.id)&&x.dgSlotAt(H.x,H.z)<0); }
for(const m of [m2,m3,m4,m5]) x.dgRemoveS(runE,m);
// every member gets every drop: one roll, copied
{ const before=['e','f','g'].map(pid=>{ const p=P(pid); return {coins:p.gear.coins,exp:p.exp,temper:p.gear.temper||0,mats:p.gear.mats.slime||0}; });
  const m=spawnHp(); clear();
  withRandom(0.0005,()=>x.killMonsterS(m,E)); tick(3);
  const d=['e','f','g'].map((pid,i)=>{ const p=P(pid); return {coins:p.gear.coins-before[i].coins,exp:p.exp-before[i].exp,temper:(p.gear.temper||0)-before[i].temper,mats:(p.gear.mats.slime||0)-before[i].mats}; });
  ok('a kill pays every member the same roll: coins, XP, the stone (level 30: no equipment), the material',d.every(q=>q.coins>0&&q.coins===d[0].coins&&q.exp>0&&Math.abs(q.exp-d[0].exp)<1e-6&&q.temper===1&&q.mats===2),JSON.stringify(d));
  ok('...whoever struck it: those who never hit it are paid too',d[1].coins===d[0].coins&&d[2].coins===d[0].coins);
  ok('and each hears of it (coins / stone / drop events to each)',['e','f','g'].every(pid=>evs(pid,'coins').length&&evs(pid,'stone').length&&evs(pid,'drop').length)); }
// the world's XP cap inside a run: nobody gets more than a monster 10 levels above their own level pays (shared/balance.js: xpLeadK), whatever the run's level
{ const real=P('f').level; P('f').level=12;   // F is far below the run (level 30): the cap is level 22
  const m=spawnHp(); clear(); withRandom(0.5,()=>x.killMonsterS(m,E)); tick(3);
  const amount=pid=>{ const q=evs(pid,'xp').filter(e=>e[1]===pid&&e[3]===m.id); return q.length?q[q.length-1][2]:null; };
  const eX=amount('e'), fX=amount('f'), gX=amount('g'), wantE=x.xpFor(runE.L)*(1+x.psP(P('e'),'xp')), wantF=x.xpFor(22)*(1+x.psP(P('f'),'xp'));
  ok('a member far below the run\'s level is paid for a monster 10 levels above them (level 22), the others in full (level '+runE.L+'): one kill, one amount for each',
    Math.abs(eX-wantE)<0.15+wantE*1e-3&&Math.abs(gX-eX)<0.2&&Math.abs(fX-wantF)<0.15+wantF*1e-3&&fX<eX,eX+' / '+fX+' / '+gX+' (wanted '+wantE.toFixed(1)+' / '+wantF.toFixed(1)+')');
  P('f').level=real; }
// the zone-tier trap: the slot's x reads as another land, but a run's monster has the run's numbers for everyone
{ const m=spawnHp(); E.gear.zt={home:{on:3,max:3},vale:{on:3,max:3},hoar:{on:3,max:3}}; x.recalcP(E); E.dmg=F.dmg;
  const kE=x.monK(m,E), kF=x.monK(m,F), land=x.landAt(m.camp.x,m.camp.z), trap=x.zoneTierK(m.T,3).lv;
  ok('the trap exists (a slot reads as '+land+', where E plays tier III: level '+trap+')',land!=='home'&&trap!==runE.L);
  ok('but monK gives a run\'s monster the run\'s level and numbers, whatever your zone tier',kE===kF&&kE.lv===runE.L&&kE.hp===x.dgKOf(m.def,runE.L).hp);
  const hit=p=>withRandom(0.5,()=>{ m.hp=m.maxHp; x.damageMonsterS(m,1,p,m.x,m.z,0); return m.maxHp-m.hp; });
  ok('the same hit takes off the same share of its health from a tier III and a tier 0 player',Math.abs(hit(E)-hit(F))<1e-9&&hit(E)>0);
  E.gear.zt={home:{on:0,max:0},vale:{on:0,max:0},hoar:{on:0,max:0}}; x.recalcP(E); x.dgRemoveS(runE,m); }
// a place held for a reconnect
{ W.leave('f'); tick(3); const mb=[...runE.members.values()].find(q=>q.key==='pid:f');
  ok('a disconnect holds the place',!!mb&&mb.gone>0&&x.dgPresentS(runE).length===2);
  clear(); join('f','Fern'); IMM.add('f'); secs(1.5);
  ok('coming back online puts you back in the run, at the entrance',P('f').inst===runE.id&&!!mOf('f','tp').find(m=>m.dg&&m.dg.id===runE.id)&&mb.gone===0);
  W.leave('f'); tick(2); mb.gone=x.S.t-x.DG_HOLD_S-1; secs(1.5);
  ok('a place is held '+x.DG_HOLD_S/60+' minutes, then freed',![...runE.members.values()].some(q=>q.key==='pid:f'));
  join('f','Fern'); secs(1.5); ok('...and then coming back does not put you in',!P('f').inst); }
// the boss appears: no more joining
{ x.dgBossS(runE); tick(2); W.receive('e',{t:'party',a:'invite',name:'Fern'}); tick(2); W.receive('f',{t:'party',a:'accept'}); clear(); secs(1.5); dg('f','accept'); tick(2);
  ok('once the boss has appeared the run can no longer be joined',!P('f').inst&&/boss has appeared/.test(toasts('f'))&&!evs('f','dgi').length,toasts('f')); }
// down, revive, bleed out, wipe
{ dg('g','leave'); tick(2); for(const m of [...runE.mons]) if(!m.boss) x.dgRemoveS(runE,m);
  IMM.delete('e');
  ok('the run goes on with its leader alone',x.dgPresentS(runE).length===1&&runE.boss&&!runE.boss.m.dead);
  x.hurtP(E,1e9,null); secs(4);
  ok('at 0 health in a run you are downed: no wake in a village after 3 s',E.dead&&E.inst===runE.id&&x.dgSlotAt(E.x,E.z)===runE.slot);
  secs(x.DG_DOWN_S-3);
  const mb=x.dgMemberOf(runE,E);
  ok('bleeding out ('+x.DG_DOWN_S+' s) spends a respawn: back on your feet at the entrance, full health',!E.dead&&E.hp===E.maxHp&&mb.respawns===1&&Math.hypot(local(runE,E).x-runE.B.start.x,local(runE,E).z-runE.B.start.z)<8);
  IMM.add('e'); }
// a party: revive, then a wipe
const I=join('i','Ida'), J=join('j','Jun'); IMM.add('i'); IMM.add('j'); tick(2);
W.receive('i',{t:'party',a:'invite',name:'Jun'}); tick(2); W.receive('j',{t:'party',a:'accept'}); tick(2);
const iStart={x:I.x,z:I.z}; dev('i','bare:purge:33'); tick(2); dg('j','accept'); tick(3);
const runI=runOf('i');
{ clearMons(runI); IMM.delete('i'); IMM.delete('j'); J.x=I.x+1; J.z=I.z; J.dgX=J.x; J.dgZ=J.z;
  x.hurtP(J,1e9,null); clear(); secs(2);
  ok('a party member down, the run goes on (no wipe while someone stands)',J.dead&&runI.phase==='objectives'&&evs('i','toast').some(e=>/is down/.test(e[2])));
  dg('i','revive',{id:'j'}); tick(3);
  const c=last('i','cast'); ok('a teammate within 2.5 m channels the revive on the cast bar: cast [pid, -1, 3, target]',!!c&&c[1]==='i'&&c[2]===-1&&c[3]===3&&c[4]==='j');
  secs(3.2);
  ok('3 s later the downed one stands at 35% health; dgr [reviver, revived] to the run',!J.dead&&J.hp===Math.round(J.maxHp*x.DG_REVIVE_HP)&&!!last('j','dgr')&&last('i','dgr')[2]==='j');
  J.x=I.x+6; J.dgX=J.x; x.hurtP(J,1e9,null); tick(2); dg('i','revive',{id:'j'}); tick(2);
  ok('too far (6 m) to revive',!I.cast&&J.dead&&/closer/.test(toasts('i')));
  J.x=I.x+1; J.dgX=J.x; clear(); x.hurtP(I,1e9,null); tick(3);
  ok('everyone down at once: the run is lost; dge [pid, 0, ...] to each',runI.phase==='lost'&&last('i','dge')[2]===0&&last('j','dge')[2]===0,JSON.stringify(last('i','dge')));
  secs(x.DG_END_S+0.5);
  ok('20 s later everyone is back where the run was started (alive), the slot is free',!I.inst&&!J.inst&&!I.dead&&!J.dead&&Math.hypot(I.x-iStart.x,I.z-iStart.z)<0.5&&!!mOf('i','tp').find(m=>m.dg===false)&&!x.DG_RUNS.has(runI.id)&&x.DG_SLOT_RUN[runI.slot]===0&&!x.MONS.some(m=>m.inst===runI.id));
  IMM.add('i'); IMM.add('j'); }
// a lone hiker out of respawns: lost
{ clearMons(runA); IMM.delete('a'); const mb=x.dgMemberOf(runA,A); clear();
  for(let k=0;k<3;k++){ x.hurtP(A,1e9,null); secs(x.DG_DOWN_S+0.2); }
  ok('a lone hiker downed three times (two respawns) is out, and the run is lost',mb.out&&runA.phase==='lost'&&last('a','dge')&&last('a','dge')[2]===0,'respawns '+mb.respawns+', phase '+runA.phase);
  secs(x.DG_END_S+0.5); ok('...and wakes where the run was started',!A.inst&&!A.dead&&Math.hypot(A.x-aStart.x,A.z-aStart.z)<0.5); IMM.add('a'); }

// ---- a purge won through its boss (a real dungeon, a party of two) ----
const K=join('k','Kai'), L2=join('l','Lea'); IMM.add('k'); IMM.add('l'); tick(2);
W.receive('k',{t:'party',a:'invite',name:'Lea'}); tick(2); W.receive('l',{t:'party',a:'accept'}); tick(2);
const kStart={x:K.x,z:K.z}; dev('k','hollowroots:purge:5'); tick(2); dg('l','accept'); tick(3);
const runK=runOf('k');
{ ok('a testing run of a real dungeon: its level, its walkers',!!runK&&runK.th==='hollowroots'&&runK.L===x.DG_LV&&[...runK.mons].every(m=>runK.theme.mobs.walkers.includes(m.def.id)));
  clear(); const need=runK.k.need; let n=0;
  for(const m of [...runK.mons]) if(m.dgRole==='purge'&&!m.dead){ x.killMonsterS(m,K); n++; }
  tick(3);
  const b=last('k','dgb'), sn=lastMsg('k','snap'), A2=runK.boss&&runK.boss.A;
  ok('Purge: killing all '+need+' brings the boss into the round hall (dgb [id, x, z, r, def])',n===need&&runK.k.killed===need&&!!runK.boss&&runK.phase==='boss'&&!!b&&b[1]===runK.boss.m.id&&b[4]===20&&Math.abs(b[2]-(runK.ox+runK.B.boss.x))<0.1&&b[5]===runK.boss.bd.def.id,JSON.stringify(b));
  ok('the boss is the theme\'s (or its stand-in), at the run\'s level, with the party\'s health (x'+x.DG_PARTY.hp[1]+')',runK.boss.bd===x.dgBossDefOf(runK.theme)&&runK.boss.m.inst===runK.id&&runK.boss.m.dgK.lv===runK.L&&runK.boss.m.maxHp===runK.boss.bd.def.hp*x.DG_PARTY.hp[1]);
  ok('the members\' snapshots carry its row in b and phase 1 in dg',!!sn&&sn.b.length===1&&sn.b[0][0]===runK.boss.m.id&&sn.dg[0]===1);
  K.x=A2.x+3; K.z=A2.z+3; K.dgX=K.x; K.dgZ=K.z; secs(1);
  ok('it engages when a member steps into the hall (the world bosses\' own code)',runK.boss.engaged);
  const invK=K.gear.inv.length, invL=L2.gear.inv.length; clear();
  withRandom(0.0005,()=>x.killMonsterS(runK.boss.m,K)); tick(3);
  const newK=K.gear.inv.slice(invK), newL=L2.gear.inv.slice(invL), dK=last('k','dge'), dL=last('l','dge');
  ok('its death clears the run: dge [pid, 1, seconds, xp, coins, [items], mats, why] to each member',runK.phase==='won'&&!!dK&&dK[2]===1&&!!dL&&dL[2]===1&&dK[5]>0,JSON.stringify(dK));
  ok('the boss\'s drop and the clear\'s level-30 piece: the same two items for both (one roll each, copied)',newK.length===2&&JSON.stringify(newK)===JSON.stringify(newL)&&newK.some(id=>x.ITEM[id]&&x.ITEM[id].dg)&&newK.every(id=>dK[6].includes(id)),newK+' / '+newL);
  ok('the clear and the best time are saved in gear.dg',K.gear.dg.clear['hollowroots:purge']===1&&L2.gear.dg.clear['hollowroots:purge']===1&&K.gear.dg.best['hollowroots:purge']>=1);
  ok('the fallen boss does not come back (no respawn timer in a run)',(secs(5),runK.boss.m.dead&&!runK.boss.engaged));
  secs(x.DG_END_S);
  ok('20 s after the clear both are back where the run started, the run is closed',!K.inst&&!L2.inst&&Math.hypot(K.x-kStart.x,K.z-kStart.z)<0.5&&!x.DG_RUNS.has(runK.id)&&!x.MONS.some(m=>m.inst===runK.id)); }

// ---- the Blackseam (the fourth dungeon): a purge won through Garrick pays a pendant ----
{ const Pp=join('p','Pia'); IMM.add('p'); tick(2); dev('p','blackseam:purge:5'); tick(3);
  const runP=runOf('p');
  ok('the Blackseam: a testing run of it has its own walkers, at level '+x.DG_LV,!!runP&&runP.th==='blackseam'&&runP.L===x.DG_LV&&[...runP.mons].every(m=>runP.theme.mobs.walkers.includes(m.def.id)||runP.theme.mobs.guardians.includes(m.def.id)),runP?runP.th+' L'+runP.L+' phase '+runP.phase+' k '+JSON.stringify(runP.k)+' mons '+[...runP.mons].map(m=>m.def.id+(m.dead?'(dead)':'')).join(','):'no run');
  clear(); for(const m of [...runP.mons]) if(m.dgRole==='purge'&&!m.dead) x.killMonsterS(m,Pp); tick(3);
  ok('Purge: killing them brings Garrick into the round hall',!!runP.boss&&runP.phase==='boss'&&runP.boss.bd===x.dgBossDefOf(runP.theme)&&runP.boss.bd.def.id==='garrick'&&runP.boss.m.dgK.lv===runP.L);
  const A3=runP.boss.A; Pp.x=A3.x+3; Pp.z=A3.z+3; Pp.dgX=Pp.x; Pp.dgZ=Pp.z; secs(1);
  const inv0=Pp.gear.inv.length; clear(); withRandom(0.0005,()=>x.killMonsterS(runP.boss.m,Pp)); tick(3);
  const got=Pp.gear.inv.slice(inv0), pend=got.find(id=>/^pendant-/.test(id));
  ok('its clear pays one level-30 pendant (a kind of the five, +0), and the clear is saved',runP.phase==='won'&&!!pend&&x.dgParse(pend)&&x.PENDANT_STATS.includes(x.dgParse(pend).stat)&&x.dgParse(pend).n===0&&Pp.gear.dg.clear['blackseam:purge']===1,got+'');
  secs(x.DG_END_S+0.5); IMM.delete('p'); }

// ---- a start at a door: the gate, the offer, leaving, an empty run closing ----
{ const Ent=x.DG_ENTRANCES.hollowroots, ap=x.dgApron(Ent);
  const M=join('m','Mo',{gear:{zt:{home:{on:1,max:1}}}}), N=join('n','Nia'); IMM.add('m'); tick(2);
  clear(); dg('m','start',{dungeon:'hollowroots',type:'purge'}); tick(2);
  ok('away from the door a run cannot start',!M.inst&&/door/.test(toasts('m')));
  const near={x:Ent.x+Math.sin(Ent.a)*3,z:Ent.z+Math.cos(Ent.a)*3};   // (the talk key works within DG_ENT_TALK of the door; the apron, where a run puts you back, is a little further out)
  M.x=near.x; M.z=near.z; N.x=near.x+0.5; N.z=near.z; clear(); dg('m','open'); dg('n','start',{dungeon:'hollowroots',type:'purge'}); tick(2);
  const bd=lastMsg('m','dgboard'), offer=x.dgOffer('hollowroots',Date.now(),x.dgPoolS());
  ok('at the door the board opens: dgboard {th, offer, pool, left, L, tier, gate, ok, why, lead}',!!bd&&bd.th==='hollowroots'&&JSON.stringify(bd.offer)===JSON.stringify(offer)&&bd.L===30&&bd.tier===1&&bd.gate===1&&bd.ok===1&&bd.lead===1&&bd.left>0,JSON.stringify(bd));
  ok('Wildwood at +0: its door stays shut',!N.inst&&/\+1|Carapax/.test(toasts('n')));
  clear(); dg('m','start',{dungeon:'hollowroots',type:x.dgPoolS().find(k=>!offer.includes(k))||'nosuch'}); tick(2);   // (a built mission that is not on offer this hour)
  ok('a type not on offer this hour is refused ("the offer changed") and the board comes again',!M.inst&&/offer changed/.test(toasts('m'))&&!!lastMsg('m','dgboard'));
  dg('m','start',{dungeon:'hollowroots',type:offer[0]}); tick(3);
  const run=runOf('m');
  ok('at the door, with the level and the tier, the offered type starts a run',!!run&&run.th==='hollowroots'&&run.tier===1&&run.L===30&&!run.dev);
  clear(); dg('m','leave'); tick(2);
  ok('leaving (the portal) puts you on the door\'s apron',!M.inst&&Math.hypot(M.x-ap.x,M.z-ap.z)<0.01&&!!mOf('m','tp').find(t=>t.dg===false));
  secs(x.DG_EMPTY_S+1.5); ok('a run nobody is in closes after '+x.DG_EMPTY_S+' s',!x.DG_RUNS.has(run.id)); }

// ---- the slot cap ----
{ const ps=[]; for(let i=0;x.DG_RUNS.size<x.DG_MAX_INST&&i<20;i++){ const pid='r'+i; join(pid,'Run'+i); IMM.add(pid); dev(pid,'bare:purge:'+i); ps.push(pid); }
  tick(2); const p=join('over','Over'); clear(); dev('over','bare:purge:1'); tick(2);
  ok(x.DG_MAX_INST+' runs at most: one more is refused',x.DG_RUNS.size===x.DG_MAX_INST&&!p.inst&&/busy/.test(toasts('over')));
  for(const pid of ps) dg(pid,'leave'); }

// ---- the save ----
{ const g=x.sanitizeGear({dg:{clear:{'hollowroots:purge':3,'bare:purge':2,'x:y':1,'hollowroots:nope':4,'constructor:purge':1,'jadesprings:defense':'7'},best:{'hollowroots:purge':95.6,'bonefrostbarrow:siege':-5}}},'warrior');
  ok('gear.dg is sanitized: unknown dungeons, missions and the test set dropped, counts clamped',JSON.stringify(g.dg)==='{"clear":{"hollowroots:purge":3,"jadesprings:defense":7},"best":{"hollowroots:purge":95,"bonefrostbarrow:siege":1}}',JSON.stringify(g.dg));
  ok('an old save gets an empty record',JSON.stringify(x.sanitizeGear({coins:5},'mage').dg)==='{"clear":{},"best":{}}'); }

// ---- the kit registry refuses a bad kit without stopping ----
{ const kept={defense:x.DG_KITS.defense,siege:x.DG_KITS.siege}; delete x.DG_KITS.defense; delete x.DG_KITS.siege;   // (every mission has its kit now: two are taken out for the checks and put back)
  const n=x.DG_KIT_BAD.length, a=x.dgDefineKit('purge',{setup(){}}), b=x.dgDefineKit('nosuch',{setup(){}}), c=x.dgDefineKit('defense',{tick(){}}), d=x.dgDefineKit('siege',{setup(){},onKill:3});
  ok('a bad kit is left out and listed (twice, no such mission, no setup, a field that is not a function)',!a&&!b&&!c&&!d&&x.DG_KIT_BAD.length===n+4&&!x.DG_KITS.defense&&!x.DG_KITS.siege,JSON.stringify(x.DG_KIT_BAD.slice(n)));
  Object.assign(x.DG_KITS,kept); }

// ---- a Shared (room) host refuses ----
{ const t2=[]; const {api:W2,x:x2}=loadServer({dev:true,broadcastSnaps:true,broadcast(m){ if(m.ev) t2.push(...m.ev); },send(pid,m){ const c=JSON.parse(JSON.stringify(m)); if(c.t==='snap'&&c.ev) t2.push(...c.ev); }},['DG_RUNS']);
  W2.join('s',{name:'Sam',look:{cls:'warrior'},save:{level:30}}); W2.receive('s',{t:'dev',cmd:'dg',v:'bare:purge:1'}); for(let i=0;i<3;i++) W2.tick(0.05);
  ok('a Shared (room) host refuses to start a run, and says why',x2.DG_RUNS.size===0&&t2.some(e=>e[0]==='toast'&&/Solo mode or a server/.test(e[2]))); }

console.log(fails?fails+' FAILED':'all passed');
process.exit(fails?1:0);
