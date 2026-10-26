//@ Dungeon runs, their monsters: spawning at the run's level with the party's health, removing, the walker AI (a flow field round walls, line of sight, no leash, no respawn), kills, and the loot every member gets (rewardAllS)
/* agent map
   exports: dgSpawnS(run,defId,lx,lz,opts) -> monster | null, dgRemoveS(run,m), dgAdoptS(m) (the makeMon hook), dgKOf(def,L), dgMonTickS(run,m,dt), dgKilledS(m,p) (the
            killMonsterS hook), rewardAllS(run,m), dgFlowToS(run,lx,lz), dgNearestS(run,m,maxD,needLos), DG_ELITE_HP, DG_AGGRO_R
   users: server/monsters.js (makeMon, monRoster, updateMonstersS skips m.inst), server/combat.js (killMonsterS), runs.js (the per-tick update), the mission kits
   uses: the world's reward helpers (gainExpP, addItemP, addMatP, questKillP, bossSkillDropP) and the rewards' drop rule (dgRollDropP, dgAddStonesP: server/dungeon-gear.js)
   test: tools/dungeon-runs-smoke.js.   Design: docs/DUNGEONS.md sections 5 (party health), 6 (loot for all), 7 (the AI rows).
   A run's monster: m.inst = the run id, m.dgK = its numbers ({lv, hp, dmg, xp} against its def, what monK returns for it, so the zone tiers of the land the slot's x
   happens to read as never apply), m.maxHp = def.hp x the party's health factor at the moment it spawned (DG_PARTY.hp by the members present then), in the def's own
   units like every monster (a hit takes off damage / m.dgK.hp). Its roster entry (monRoster) has two more fields: [..., level, maxHp]. No camp leash, no respawn
   (dead, it is removed after 1.2 s), never thinks with the world's AI (updateMonstersS skips it): dgMonTickS moves it. */
const DG_AGGRO_R=16, DG_STRAIGHT=10, DG_WALKER_R=0.9, DG_ELITE_HP=2.5, DG_ELITE_S=1.25;   // notices you within 16 m in sight; walks straight when it sees you within 10 m, else by the flow field; walls keep it 0.9 m off at most (the 4 m doors)
const DG_K_CACHE=new Map();
// a def's numbers at level L against its own (like zoneTierK, by level instead of tier)
function dgKOf(d,L){
  const key=d.id+'@'+L; let k=DG_K_CACHE.get(key); if(k) return k;
  const a=defAt(d,L), b=defAt(d,d.level); k={lv:L,hp:a.hp/b.hp,dmg:a.dmg/b.dmg,xp:b.xp?a.xp/b.xp:1};
  DG_K_CACHE.set(key,k); return k;
}
// makeMon calls this while a run updates (S.ctx = its id): a boss's adds, a kit's spawns, the boss itself all join the run with its level and the party's health
function dgAdoptS(m){
  const run=DG_RUNS.get(S.ctx); if(!run) return;
  m.inst=run.id; m.dgK=dgKOf(m.def,run.L); m.maxHp=m.hp=m.def.hp*dgParty(Math.max(1,dgPresentS(run).length)).hp; m.awake=true;
  const lx=m.x-run.ox, lz=m.z-run.oz, r=Math.min(m.T.rad,DG_WALKER_R);
  if(!dgFree(run.B,lx,lz,r)){   // never born inside a wall (a boss's adds land round it, sometimes past the hall's edge): the nearest free cell
    let best=null, bd=1e9; const cx=Math.floor(lx/DG_CELL), cz=Math.floor(lz/DG_CELL);
    for(let dz=-6;dz<=6;dz++) for(let dx=-6;dx<=6;dx++){ const x=(cx+dx+0.5)*DG_CELL, z=(cz+dz+0.5)*DG_CELL, d=dx*dx+dz*dz; if(d<bd&&dgFree(run.B,x,z,r)){ bd=d; best=[x,z]; } }
    if(best){ m.x=run.ox+best[0]; m.z=run.oz+best[1]; }
  }
  run.mons.add(m);
}
/* THE SPAWN PRIMITIVE for mission kits: defId at local (lx, lz), level run.L, the party's health. opts: {elite: true (health x DG_ELITE_HP, a quarter bigger),
   role: a name the kit keeps on it (m.dgRole), hunt: true (comes for the nearest member at once, wherever they are)}. Returns the monster, or null for an unknown id. */
function dgSpawnS(run,defId,lx,lz,opts){
  const d=DEF_BY_ID[defId]; if(!d||run.endT) return null;
  const o=opts||{}, W=dgWorldS(run,lx,lz), c0=S.ctx; S.ctx=run.id;
  const m=makeMon(d,W.x,W.z,{x:W.x,z:W.z},o.elite?DG_ELITE_S:1,true);
  if(m.inst!==run.id) dgAdoptS(m);
  if(o.elite){ m.elite=true; m.maxHp*=DG_ELITE_HP; m.hp=m.maxHp; }
  m.dgRole=o.role||null; if(o.hunt) m.dgHunt=true;
  ev('spawn',monRoster(m)); S.ctx=c0; return m;
}
function dgRemoveS(run,m){ if(!m.remove){ const c0=S.ctx; S.ctx=run.id; removeMonS(m); S.ctx=c0; } run.mons.delete(m); }
// the flow field toward a local point, one per target cell, shared by every walker of the run and kept 5 s after its last use
function dgFlowToS(run,lx,lz){
  const B=run.B, c=Math.floor(lz/DG_CELL)*B.w+Math.floor(lx/DG_CELL); let f=run.flow.get(c);
  if(!f){ f={d:dgFlow(B,lx,lz),used:S.t}; run.flow.set(c,f); } else f.used=S.t;
  return f.d;
}
function dgNearestS(run,m,maxD,needLos){
  let best=null, bd=maxD;
  for(const p of dgMembersS(run)){ const d=Math.hypot(p.x-m.x,p.z-m.z); if(d<bd&&(!needLos||dgLos(run.B,m.x-run.ox,m.z-run.oz,p.x-run.ox,p.z-run.oz))){ bd=d; best=p; } }
  return best;
}
function dgMoveS(run,m,dx,dz){ const lx=m.x-run.ox, lz=m.z-run.oz, s=dgSlide(run.B,lx,lz,lx+dx,lz+dz,Math.min(m.T.rad,DG_WALKER_R)); m.x=run.ox+s[0]; m.z=run.oz+s[1]; }
// one tick of a run's monster (S.ctx is the run's)
function dgMonTickS(run,m,dt){
  if(m.boss){ if(!m.dead) updateBossS(m,dt); return; }   // the run's boss: the world bosses' own code (engage, phases, reset); dead, it stays dead (it is not ticked: no respawn timer)
  if(m.dead){ m.deadT+=dt; if(m.deadT>1.2) dgRemoveS(run,m); return; }
  if(m.dgOwn) return;   // dungeons: a mission kit moves this one itself (fx.js dgWalkS: Defense's breakers, the Hunt's quarry, Escort's captive-takers, guardians)
  m.awake=true;
  const T=m.T, B=run.B, ox=run.ox, oz=run.oz, kd=Math.exp(-7*dt);
  if(m.stunT>0){ m.stunT-=dt; m.pendingHit=-1; dgMoveS(run,m,m.kbx*dt,m.kbz*dt); m.kbx*=kd; m.kbz*=kd; m.vx=m.vz=0; return; }
  let p=m.tgt!=null?S.players.get(m.tgt):null;
  if(p&&(p.dead||p.inst!==run.id)) p=null;
  { const tq=ssTauntedBy(m); if(tq&&tq.inst===run.id){ p=tq; m.tgt=tq.id; if(!m.aggro){ m.aggro=true; ev('aggro',m.id); } } }   // skillsets: a taunted monster of the run comes for the taunter
  if(!p){   // lost its target (or never had one): one that was hunting takes the nearest living member anywhere; a quiet one waits to see someone near
    const q=m.aggro||m.dgHunt?dgNearestS(run,m,1e9,false):dgNearestS(run,m,Math.max(DG_AGGRO_R,T.aggro||0),true);
    if(q){ if(!m.aggro) ev('aggro',m.id); m.aggro=true; m.tgt=q.id; p=q; } else { m.aggro=false; m.tgt=null; }
  }
  let vx=0, vz=0, dp=1e9, dx=0, dz=0;
  const reach=T.rad+(m.model==='treant'?1.6:1.1);
  if(p){
    dx=p.x-m.x; dz=p.z-m.z; dp=Math.hypot(dx,dz);
    const los=dgLos(B,m.x-ox,m.z-oz,p.x-ox,p.z-oz);
    if((dp>reach||!los)&&T.speed>0){
      let dir=los&&dp<DG_STRAIGHT?[dx/dp,dz/dp]:dgStep(B,dgFlowToS(run,p.x-ox,p.z-oz),m.x-ox,m.z-oz);
      if(!dir&&los) dir=[dx/dp,dz/dp];
      if(dir){ const sp=T.speed*(m.slowT>0?0.4:1); vx=dir[0]*sp; vz=dir[1]*sp; m.faceGoal=Math.atan2(-dir[0],-dir[1]); }
      m.state='chase';
    } else if(dp<=reach&&los){ m.state='attack'; m.faceGoal=Math.atan2(-dx,-dz); m.atkT-=dt;
      if(m.atkT<=0&&!T.noAttack){ m.atkT=T.atk; m.pendingHit=0.28; ev('mact',m.id); } }
    if(m.pendingHit>=0){ m.pendingHit-=dt; if(m.pendingHit<0&&dp<reach+0.8&&los) hurtP(p,Math.max(1,Math.round(T.dmg*AR(0.85,1.15))),m); }
  } else { m.state='idle'; m.pendingHit=-1; }
  if(m.slowT>0) m.slowT-=dt;
  m.vx=vx; m.vz=vz;
  dgMoveS(run,m,(vx+m.kbx)*dt,(vz+m.kbz)*dt); m.kbx*=kd; m.kbz*=kd;
  m.face=angLerp(m.face,m.faceGoal,1-Math.exp(-8*dt));
}
// a run's monster died (the killMonsterS hook, after its 'kill' event): every member is paid, the mission is told, and the boss's death ends the run as won
function dgKilledS(m,p){
  m.hitters.clear(); const run=DG_RUNS.get(m.inst); if(!run) return;
  const c0=S.ctx; S.ctx=run.id;
  if(!m.T.noXp&&!run.endT) rewardAllS(run,m);
  if(m.boss) bossDefeatedS(m);
  const kit=DG_KITS[run.mission];
  if(!run.endT&&kit&&kit.onKill) kit.onKill(run,m);
  if(m.boss&&run.boss&&run.boss.m===m&&!run.endT){ if(kit&&kit.onBossDead) kit.onBossDead(run); else dgWinS(run); }
  S.ctx=c0;
}
/* LOOT FOR ALL (docs/DUNGEONS.md section 6): one roll per drop, copied to every member present (alive, downed or out of respawns; not those who left or are offline),
   each paid through the world's own helpers (gainExpP, the coins event, addItemP, addMatP), so toasts and saves are the world's. Per-player modifiers stay per
   player (the XP passive, Fortune's material chance on the one shared roll). A run's kills count for quest-board hunts of the same monster (questKillP), never
   for the main quest, the zone tiers or the land gates. A full bag loses the item (addItemP says so). Kept thin on purpose: rewardKill (server/combat.js) is the
   world's version, and dgLootRollS rolls through the same drop rule (dgRollDropP, server/dungeon-gear.js), once for the whole run. */
function rewardAllS(run,m){
  const ps=dgPresentS(run); if(!ps.length) return;
  const K=m.dgK||dgKOf(m.def,run.L), R=dgLootRollS(m,K,ps);
  for(const q of ps){
    const mb=dgMemberOf(run,q), xp=m.T.xp*K.xp*xpLeadK(q.level,K.lv)*(1+psP(q,'xp'));   // (the world's cap: a member never gets more than 10 levels above their own level pays)
    gainExpP(q,xp,m.id);
    q.gear.coins+=R.coins; ev('coins',q.id,R.coins,m.id);
    if(R.item){ const had=q.gear.inv.length; addItemP(q,R.item,false,m.id); if(mb&&q.gear.inv.length>had) mb.got.items.push(R.item); }
    if(R.stones&&q!==R.q0) dgAddStonesP(q,R.stones,m.id);   // (R.q0 got his from dgRollDropP itself)
    if(MATS[m.def.id]){ const n=dgDropCountS(m.def,psP(q,'drop'),R.u1,R.u2); if(n){ addMatP(q,m.def.id,n,m.id); if(mb) mb.got.mats+=n; } }
    questKillP(q,m.def.id); q.dirty=true;
    if(m.def.boss) bossSkillDropP(q,m.def.id);   // a world boss standing in for a dungeon's: its skills drop by the usual 10% rule, each player rolling for himself
    if(mb){ mb.got.xp+=xp; mb.got.coins+=R.coins; mb.got.kills++; }
  }
}
/* the run's one roll for a kill, made by rewardKill's own drop rule (dgRollDropP, server/dungeon-gear.js: a normal monster at level 30+ rolls the Tempering Stone
   instead of equipment) for one member, q0 (the one with the fewest stones, so a full stack never hides the roll), whose stone count then tells what the others get;
   the item for everyone from the rarity it returns; the coins; the two numbers the material chance uses */
function dgLootRollS(m,K,ps){
  const q0=ps.reduce((a,q)=>(q.gear.temper||0)<(a.gear.temper||0)?q:a), t0=q0.gear.temper||0;
  const r=dgRollDropP(q0,m,K,m.def.boss?rollBossRarity():rollMonsterRarity());
  return {q0,stones:(q0.gear.temper||0)-t0,item:r>=0?randomItem(tierFor(K.lv),r):null,coins:coinsFor(K.lv)*(m.def.boss?20:1),u1:Math.random(),u2:Math.random()};
}
const dgDropCountS=(def,bonus,u1,u2)=>def.boss?BOSS_DROPS:u1<DROP_CHANCE*(1+(bonus||0))?(u2<0.2?2:1):0;   // rollDropCount (shared/drops.js), with the run's one roll instead of each player's
