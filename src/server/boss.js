//@ The bosses on the server: engagement, the shared melee (cleave), phases, reset; each boss's own moves are its BOSS_KITS entry (boss-kits-*.js) built on boss-fx.js
/* Each boss (BOSS_DEFS in shared/monster-defs.js) lives in its own arena (ARENAS in vale.js, hoarfrost.js, beach.js). It engages when any player steps inside
   its arena; fights the nearest player in the arena; resets to full health when nobody alive is left inside. What every boss shares: chase the nearest
   player, a telegraphed cleave in melee, phase 2 at 60% health and phase 3 (enraged: faster and hits sooner) at 30%. What makes each one its own is its kit:
     start(B,m)           it engaged: set B.k (the kit's own timers)
     tick(B,m,dt,C)       every tick while it fights and is not stunned; C = {p: the nearest player, inside: everyone in the arena, dp: distance to p}
     phase(B,m,n)         it entered phase n (2 or 3)
   A kit casts through boss-fx.js (telegraphs, zones, walls, orbs, timed steps). While B.busy > 0 (a cast) or B.mv is set (a leap) the boss neither chases nor
   cleaves; B.mode is what the client shows (0 normal, 1 airborne, 2 hidden, 3 shielded, 4 whiteout, 5 blizzard); B.aux a number for the boss bar. B = one
   boss fight's state (m.B). */
const BOSSES=[];
// one boss fight's state for a def and an arena circle A = {x,z,r}: the six of the world are made through it at start, and a dungeon makes its boss on demand (dungeons: makeBossS)
function makeBossS(bd,A){
  const B={bd,A,kit:BOSS_KITS[bd.kit],m:null,phase:1,tele:[],zones:[],walls:[],orbs:[],q:[],k:{},mode:0,aux:0,busy:0,mv:null,engaged:false,totems:[],adds:[],enraged:false,stunT:0};
  B.m=makeMon(bd.def,A.x,A.z,{x:A.x,z:A.z},1,false); B.m.boss=true; B.m.B=B;
  return B;
}
function initBossS(){
  for(const bd of BOSS_DEFS) BOSSES.push(makeBossS(bd,ARENAS.find(a=>a.key===bd.arena)));
}
// snapshot: one entry per boss [monster id, engaged, phase, immune, enraged, stunned, aux, mode]
function bossState(){ return BOSSES.map(B=>[B.m.id,B.engaged?1:0,B.phase,B.m.immune?1:0,B.enraged?1:0,B.stunT>0?1:0,B.aux,B.mode]); }
function resetBossS(B){
  const m=B.m; B.engaged=false; B.phase=1; B.enraged=false; B.stunT=0; m.immune=false; m.aggro=false; m.tgt=null; m.hp=m.maxHp; m.act=null; m.pendingHit=-1; m.hitters.clear();
  clearBossFxS(B); [...B.totems,...B.adds].forEach(removeMonS); B.totems=[]; B.adds=[];
}
function bossDefeatedS(m){
  const B=m.B; m.respawnT=120; clearBossFxS(B); [...B.totems,...B.adds].forEach(x=>{ if(!x.dead) removeMonS(x); }); B.totems=[]; B.adds=[];
  B.engaged=false; m.immune=false; toastTo(null,B.bd.short+' has fallen!','good');
}
function updateBossS(m,dt){
  const B=m.B, A=B.A;
  for(let i=B.tele.length-1;i>=0;i--){ const e=B.tele[i]; e.t+=dt; if(e.t>=e.dur){ B.tele.splice(i,1); resolveTeleS(e,m); } }
  if(m.dead){
    m.deadT+=dt;
    if(m.deadT>2){ m.respawnT-=dt; if(m.respawnT<=0 && !playersInArena(A,20).length){ resetBossS(B); m.dead=false; m.deadT=0; m.x=A.x; m.z=A.z; ev('respawn',m.id,r1(m.x),r1(m.z)); } }
    return;
  }
  updateBossFxS(B,m,dt);
  const inside=playersInArena(A,6);
  if(!B.engaged && playersInArena(A,0).length){ B.engaged=true; m.aggro=true; B.k={}; B.kit.start(B,m); m.atkT=1.5; toastTo(null,B.bd.short+' awakens!','bad'); ev('roar',m.id); }
  if(B.engaged && !inside.length) resetBossS(B);
  m.awake=B.engaged||anyPlayerNear(m.x,m.z,110);
  if(B.engaged){
    let p=null, dp=1e9; for(const q of inside){ const d=Math.hypot(q.x-m.x,q.z-m.z); if(d<dp){ dp=d; p=q; } }
    const dx=p.x-m.x, dz=p.z-m.z; m.tgt=p.id;
    const f=m.hp/m.maxHp;
    if(B.phase===1 && f<0.6){ B.phase=2; B.kit.phase(B,m,2); }
    else if(B.phase===2 && !m.immune && f<0.3){ B.phase=3; B.enraged=true; toastTo(null,B.bd.short+' is enraged!','bad'); ev('roar',m.id); B.kit.phase(B,m,3); }
    const reach=m.T.rad+2.2;
    if(m.act){ m.act.t+=dt; if(m.act.t>=m.act.dur) m.act=null; }
    if(B.busy>0) B.busy-=dt;
    if(B.mv){ const v=B.mv; v.t+=dt; const k=Math.min(1,v.t/v.dur); m.x=v.x0+(v.x1-v.x0)*k; m.z=v.z0+(v.z1-v.z0)*k; m.vx=m.vz=0; if(k>=1) B.mv=null; }
    if(B.stunT>0){ B.stunT-=dt; m.vx*=0.8; m.vz*=0.8; }
    else {
      if(!(m.act&&m.act.cleave) && B.busy<=0 && !B.mv){
        m.faceGoal=Math.atan2(-dx,-dz);
        if(dp>reach){ const sp=m.T.speed*(B.enraged?1.35:1); m.vx=dx/dp*sp; m.vz=dz/dp*sp; }
        else { m.vx*=0.7; m.vz*=0.7; m.atkT-=dt;
          if(m.atkT<=0){ const wind=B.enraged?0.75:0.95; m.atkT=m.T.atk*(B.enraged?0.75:1)+wind; m.act={t:0,dur:wind+0.35,cleave:true};
            m.face=m.faceGoal=Math.atan2(-dx,-dz); addTeleS(B,m.x,m.z,reach+1.3,wind,'cleave',m.T.dmg,m.face,1.05); ev('mact',m.id,wind+0.35); } }
      } else { m.vx*=0.8; m.vz*=0.8; }
      B.kit.tick(B,m,dt,{p,inside,dp});
    }
  } else {
    const ex=A.x-m.x, ez=A.z-m.z, d=Math.hypot(ex,ez);
    if(d>1.5){ m.vx=ex/d*m.T.speed; m.vz=ez/d*m.T.speed; m.faceGoal=Math.atan2(-ex,-ez); } else { m.vx*=0.8; m.vz*=0.8; m.faceGoal+=dt*0.1; }
    if(m.hp<m.maxHp) m.hp=m.maxHp;
  }
  m.x+=m.vx*dt; m.z+=m.vz*dt;
  const ea=Math.hypot(m.x-A.x,m.z-A.z); if(ea>A.r-2){ m.x=A.x+(m.x-A.x)/ea*(A.r-2); m.z=A.z+(m.z-A.z)/ea*(A.r-2); }
  m.face=angLerp(m.face,m.faceGoal,1-Math.exp(-5*dt));
}
