//@ Dungeon runs, the mission kits' registry (DG_KITS, dgDefineKit) and the pieces kits build on: objectives (dgObjS: the dgo event) and the boss finale (dgBossS: the theme's boss made on demand in the round hall)
/* agent map
   exports: DG_KITS (mission id -> kit), DG_KIT_BAD (kits left out, with why), dgDefineKit(id,kit), dgPoolS() (the missions that have a kit: what the hourly offer deals from),
            dgObjS(run,kind,lx,lz,o) -> objective, dgObjSetS(run,ob,st,v), dgObjDelS(run,ob), dgBossS(run) -> B, dgBossDefOf(T) (DG_BOSS_DEFS / BOSS_DEFS row), dgHallArena (shared)
   users: kits/*.js (one dgDefineKit call each), runs.js (calls the kit), lobby.js (the offer pool), the client (dgo / dgb events)
   test: tools/dungeon-runs-smoke.js (the purge kit end to end; a bad kit is left out and listed).   Design: docs/DUNGEONS.md sections 4 (missions), 7 (the boss row), 9.
   A KIT (one file in server/dungeons/kits/, a single dgDefineKit call, no top-level names):
     setup(run)            required: the run has its members (they answered the start prompt or 15 s passed): spawn, make objectives, set run.hud
     tick(run,dt)          every tick while the run is on (objectives or boss phase)
     onKill(run,m)         any monster of the run died (its loot is already paid: rewardAllS)
     onUse(run,p,ob)       a member used objective ob (dg{a:'use',id}: within ob.r + 1.5 m, alive)
     onDown(run,p)         a member was downed
     onBossDead(run)       the boss died; default dgWinS(run)
   The kits' shared moves (channels, monsters a kit drives, chests, mouths, packs, guardians) are server/dungeons/fx.js; the themes' hazards hazards.js.
   Primitives (instances.js, mobs.js, runs.js): dgSpawnS, dgRemoveS, dgMembersS (living members), dgPresentS, dgEv (an event to the run), dgWinS, dgLoseS(run,why),
   dgBossS, dgObjS; local coordinates are metres from the bake's corner (run.B.marks hold every marker: S monster mouths, O objectives, C caches, P the portal, B the boss). */
const DG_KITS={}, DG_KIT_BAD=[];
// a bad kit never stops the server booting: it is left out, warned about and listed in DG_KIT_BAD (the smoke test fails naming it)
function dgDefineKit(id,kit){
  let why='';
  if(!DG_MISSIONS[id]) why='no such mission in DG_MISSIONS';
  else if(DG_KITS[id]) why='defined twice';
  else if(!kit||typeof kit.setup!=='function') why='setup(run) is missing';
  else { const k=['tick','onKill','onUse','onDown','onBossDead'].find(n=>kit[n]!==undefined&&typeof kit[n]!=='function'); if(k) why=k+' is not a function'; }
  if(why){ DG_KIT_BAD.push({id,why}); if(io.log) io.log('dungeon kit '+id+' left out: '+why); else if(typeof console!=='undefined') console.warn('dungeon kit '+id+' left out: '+why); return false; }
  DG_KITS[id]=kit; return true;
}
const dgPoolS=()=>Object.keys(DG_MISSIONS).filter(k=>DG_KITS[k]);
/* objectives: {id, kind (the kit's word: 'stone', 'lantern', 'altar'...), x, z (world), r (how close a member must be to use it), st (1 active, 2 done), v (a number the HUD
   shows: health, progress...), plus the kit's own fields}. Each change is a dgo event [id, kind, x, z, st (0 = removed), v] to the run; a member who enters is sent them all. */
function dgObjS(run,kind,lx,lz,o){
  const W=dgWorldS(run,lx,lz), ob=Object.assign({id:++run.nextObj,kind,x:W.x,z:W.z,r:3,st:1,v:0},o||{});
  run.objs.push(ob); dgEv(run,'dgo',ob.id,ob.kind,r1(ob.x),r1(ob.z),ob.st,ob.v); return ob;
}
function dgObjSetS(run,ob,st,v){ ob.st=st; if(v!==undefined) ob.v=v; dgEv(run,'dgo',ob.id,ob.kind,r1(ob.x),r1(ob.z),ob.st,ob.v); }
function dgObjDelS(run,ob){ run.objs=run.objs.filter(o=>o!==ob); dgEv(run,'dgo',ob.id,ob.kind,r1(ob.x),r1(ob.z),0,ob.v); }
// the theme's boss as a row makeBossS takes: its own (DG_BOSS_DEFS, shared/dungeons/bosses.js) when its kit is registered (BOSS_KITS: server/dungeons/boss-kits.js), else the
// world boss of that id, else the Rootwarden as a stand-in (the test set has no boss of its own)
function dgBossDefOf(T){ const own=T&&T.boss&&Object.prototype.hasOwnProperty.call(DG_BOSS_DEFS,T.boss)?DG_BOSS_DEFS[T.boss]:null; return own&&BOSS_KITS[own.kit]?own:BOSS_DEFS.find(b=>b.def.id===(T&&T.boss))||BOSS_DEFS[0]; }
/* THE BOSS FINALE: the theme's boss appears in the round hall (the bake's boss circle, r = 20 like every arena, so any boss kit works there), made by
   makeBossS (server/boss.js) like the six of the world, its monster adopted by the run (level run.L, the party's health). It engages when a member steps into the
   circle and resets when nobody is left in it, by the same code (updateBossS, ticked by the run); its death ends the run as won (dgKilledS -> onBossDead / dgWinS).
   Events: spawn (its roster entry) and dgb [monster id, x, z, r, def id] to the run; the snapshot's b holds its row for the run's members. */
function dgBossS(run){
  if(run.boss||run.endT||!run.B.boss) return run.boss;
  const bd=dgBossDefOf(run.theme); if(!bd) return null;
  const A=dgHallArena(run.B,run.ox,run.oz), c0=S.ctx; S.ctx=run.id;   // {x, z, r} in world coordinates, plus solid(x,z) for the dungeon bosses' cover and charges
  const B=makeBossS(bd,A);
  if(B.m.inst!==run.id) dgAdoptS(B.m);
  run.boss=B; run.phase='boss';
  ev('spawn',monRoster(B.m)); ev('dgb',B.m.id,r1(A.x),r1(A.z),A.r,bd.def.id);
  toastTo(null,bd.short+' waits in the round hall.','bad');
  S.ctx=c0; return B;
}
