//@ The bosses on the server (Rootwarden, Akaoni, Kyuubi): engagement, cleave / root / slam telegraphs, shield + totems, enrage + adds, reset
/* Each boss (BOSS_DEFS in shared/monster-defs.js) lives in its own arena (ARENAS in shared/vale.js) and fights the same way.
   It engages when any player steps inside its arena; fights the nearest player in the arena; resets to full health when
   nobody alive is left inside. Telegraphs damage every player standing in them. B = one boss fight's state (m.B). */
const BOSSES=[];
let nextTeleId=1;
function initBossS(){
  for(const bd of BOSS_DEFS){
    const A=ARENAS.find(a=>a.key===bd.arena);
    const B={bd,A,m:null,phase:1,tele:[],rootT:6,slamT:12,engaged:false,totems:[],adds:[],enraged:false,stunT:0};
    B.m=makeMon(bd.def,A.x,A.z,{x:A.x,z:A.z},1,false); B.m.boss=true; B.m.B=B; BOSSES.push(B);
  }
}
// snapshot: one entry per boss [monster id, engaged, phase, immune, enraged, stunned, totems left]
function bossState(){ return BOSSES.map(B=>[B.m.id,B.engaged?1:0,B.phase,B.m.immune?1:0,B.enraged?1:0,B.stunT>0?1:0,B.totems.length]); }
function addTeleS(B,x,z,r,dur,kind,dmg,face,half){
  const e={id:nextTeleId++,x,z,r,t:0,dur,kind,dmg,face:face||0,half:half||0}; B.tele.push(e);
  ev('tele',e.id,kind,r1(x),r1(z),r1(r),dur,Math.round(e.face*100)/100,e.half);
}
function clearTeleS(B){ for(const e of B.tele) ev('tend',e.id,0); B.tele=[]; }
function resolveTeleS(e,m){
  for(const p of S.players.values()){
    if(p.dead) continue;
    const pd=Math.hypot(p.x-e.x,p.z-e.z);
    const inside=e.kind==='cleave'?(pd<e.r+0.3&&(pd<1.2||Math.abs(angDiff(Math.atan2(-(p.x-e.x),-(p.z-e.z)),e.face))<e.half)):pd<e.r+0.3;
    if(inside) hurtP(p,Math.round(e.dmg*AR(0.9,1.1)),m);
  }
  ev('tend',e.id,1);
}
function playersInArena(A,pad){ const out=[]; for(const p of S.players.values()) if(!p.dead && Math.hypot(p.x-A.x,p.z-A.z)<A.r+pad) out.push(p); return out; }
function startShieldS(B){
  const m=B.m, A=B.A; m.immune=true; B.totems=[];
  for(let i=0;i<3;i++){ const a=m.face+i/3*TAU+0.5, x=A.x+Math.sin(a)*12, z=A.z+Math.cos(a)*12; B.totems.push(spawnMonS(B.bd.totem,x,z,{x,z},true)); }
  toastTo(null,B.bd.short+' shields itself! Break the '+B.bd.totems+'.','bad'); ev('roar',m.id);
}
function spawnAddsS(B){ const m=B.m; for(let i=0;i<2;i++){ const a=AR(0,TAU), x=m.x+Math.sin(a)*5, z=m.z+Math.cos(a)*5; const t2=spawnMonS(B.bd.add,x,z,{x:B.A.x,z:B.A.z},true); t2.aggro=true; const p=nearestFighter(x,z,60); t2.tgt=p?p.id:null; B.adds.push(t2); } }
function resetBossS(B){
  const m=B.m; B.engaged=false; B.phase=1; B.enraged=false; B.stunT=0; m.immune=false; m.aggro=false; m.tgt=null; m.hp=m.maxHp; m.act=null; m.pendingHit=-1; m.hitters.clear();
  clearTeleS(B); [...B.totems,...B.adds].forEach(removeMonS); B.totems=[]; B.adds=[];
}
function bossDefeatedS(m){
  const B=m.B; m.respawnT=120; clearTeleS(B); [...B.totems,...B.adds].forEach(x=>{ if(!x.dead) removeMonS(x); }); B.totems=[]; B.adds=[];
  B.engaged=false; toastTo(null,B.bd.short+' has fallen!','good');
}
function updateBossS(m,dt){
  const B=m.B, A=B.A;
  for(let i=B.tele.length-1;i>=0;i--){ const e=B.tele[i]; e.t+=dt; if(e.t>=e.dur){ B.tele.splice(i,1); resolveTeleS(e,m); } }
  if(m.dead){
    m.deadT+=dt;
    if(m.deadT>2){ m.respawnT-=dt; if(m.respawnT<=0 && !playersInArena(A,20).length){ resetBossS(B); m.dead=false; m.deadT=0; m.x=A.x; m.z=A.z; ev('respawn',m.id,r1(m.x),r1(m.z)); } }
    return;
  }
  const inside=playersInArena(A,6);
  if(!B.engaged && playersInArena(A,0).length){ B.engaged=true; m.aggro=true; B.rootT=4; B.slamT=10; m.atkT=1.5; toastTo(null,B.bd.short+' awakens!','bad'); ev('roar',m.id); }
  if(B.engaged && !inside.length) resetBossS(B);
  m.awake=B.engaged||anyPlayerNear(m.x,m.z,110);
  if(B.engaged){
    let p=null, dp=1e9; for(const q of inside){ const d=Math.hypot(q.x-m.x,q.z-m.z); if(d<dp){ dp=d; p=q; } }
    const dx=p.x-m.x, dz=p.z-m.z; m.tgt=p.id;
    const f=m.hp/m.maxHp;
    if(B.phase===1 && f<0.6){ B.phase=2; startShieldS(B); }
    if(m.immune){
      B.totems=B.totems.filter(x=>!x.dead&&!x.remove);
      if(!B.totems.length){ m.immune=false; B.stunT=5; m.act=null; clearTeleS(B); toastTo(null,'The shield shatters! '+B.bd.short+' is stunned.','good'); }
      else m.hp=Math.min(m.maxHp*0.6,m.hp+m.maxHp*0.004*dt);
    }
    if(B.phase===2 && !m.immune && f<0.3){ B.phase=3; B.enraged=true; toastTo(null,B.bd.short+' is enraged!','bad'); spawnAddsS(B); ev('roar',m.id); }
    const reach=m.T.rad+2.2;
    if(m.act){ m.act.t+=dt; if(m.act.t>=m.act.dur) m.act=null; }
    const slamming=m.act&&m.act.slam, cleaving=m.act&&m.act.cleave;
    if(B.stunT>0){ B.stunT-=dt; m.vx*=0.8; m.vz*=0.8; }
    else {
      if(!slamming && !cleaving){
        m.faceGoal=Math.atan2(-dx,-dz);
        if(dp>reach){ const sp=m.T.speed*(B.enraged?1.35:1); m.vx=dx/dp*sp; m.vz=dz/dp*sp; }
        else { m.vx*=0.7; m.vz*=0.7; m.atkT-=dt;
          if(m.atkT<=0){ const wind=B.enraged?0.75:0.95; m.atkT=m.T.atk*(B.enraged?0.75:1)+wind; m.act={t:0,dur:wind+0.35,cleave:true};
            m.face=m.faceGoal=Math.atan2(-dx,-dz); addTeleS(B,m.x,m.z,reach+1.3,wind,'cleave',m.T.dmg,m.face,1.05); ev('mact',m.id,wind+0.35); } }
      } else { m.vx*=0.8; m.vz*=0.8; }
      B.rootT-=dt;
      if(B.rootT<=0){ B.rootT=B.enraged?4.5:(B.phase===2?6:7.5); const n=B.enraged?5:3;
        for(let i=0;i<n;i++){ const q=i===0?p:inside[Math.floor(Math.random()*inside.length)], a=AR(0,TAU), r=i===0?0:AR(3,6.5); addTeleS(B,q.x+Math.sin(a)*r,q.z+Math.cos(a)*r,2.4,1.6,'root',Math.round(m.T.dmg*1.5)); } }
      B.slamT-=dt;
      if(B.slamT<=0 && dp<15 && !slamming && !m.immune){ B.slamT=B.enraged?9:12.5; m.act={t:0,dur:2.3,slam:true}; addTeleS(B,m.x,m.z,9,2.2,'slam',Math.round(m.T.dmg*2.2)); ev('mact',m.id,2.3); ev('roar',m.id); }
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
