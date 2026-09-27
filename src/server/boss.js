//@ The Rootwarden on the server: engagement, cleave / root / slam telegraphs, shield + totems, enrage + adds, reset
/* Engages when any player steps inside the stone circle; fights the nearest player in the circle;
   resets to full health when nobody alive is left inside. Telegraphs damage every player standing in them. */
const BOSS={m:null,phase:1,tele:[],rootT:6,slamT:12,engaged:false,totems:[],adds:[],enraged:false,stunT:0};
let nextTeleId=1;
function initBossS(){ BOSS.m=makeMon(BOSS_DEF,ARENA.x,ARENA.z,{x:ARENA.x,z:ARENA.z},1,false); BOSS.m.boss=true; }
function bossState(){ const B=BOSS, m=B.m; if(!m) return null; return [B.engaged?1:0,B.phase,m.immune?1:0,B.enraged?1:0,B.stunT>0?1:0,B.totems.length]; }
function addTeleS(x,z,r,dur,kind,dmg,face,half){
  const e={id:nextTeleId++,x,z,r,t:0,dur,kind,dmg,face:face||0,half:half||0}; BOSS.tele.push(e);
  ev('tele',e.id,kind,r1(x),r1(z),r1(r),dur,Math.round(e.face*100)/100,e.half);
}
function clearTeleS(){ for(const e of BOSS.tele) ev('tend',e.id,0); BOSS.tele=[]; }
function resolveTeleS(e,m){
  for(const p of S.players.values()){
    if(p.dead) continue;
    const pd=Math.hypot(p.x-e.x,p.z-e.z);
    const inside=e.kind==='cleave'?(pd<e.r+0.3&&(pd<1.2||Math.abs(angDiff(Math.atan2(-(p.x-e.x),-(p.z-e.z)),e.face))<e.half)):pd<e.r+0.3;
    if(inside) hurtP(p,Math.round(e.dmg*AR(0.9,1.1)),m);
  }
  ev('tend',e.id,1);
}
function playersInArena(pad){ const out=[]; for(const p of S.players.values()) if(!p.dead && Math.hypot(p.x-ARENA.x,p.z-ARENA.z)<ARENA.r+pad) out.push(p); return out; }
function startShieldS(m){
  m.immune=true; BOSS.totems=[];
  for(let i=0;i<3;i++){ const a=m.face+i/3*TAU+0.5, x=ARENA.x+Math.sin(a)*12, z=ARENA.z+Math.cos(a)*12; BOSS.totems.push(spawnMonS(TOTEM_DEF,x,z,{x,z},true)); }
  toastTo(null,'The Rootwarden shields itself! Break the Heartwood Totems.','bad'); ev('roar');
}
function spawnAddsS(m){ for(let i=0;i<2;i++){ const a=AR(0,TAU), x=m.x+Math.sin(a)*5, z=m.z+Math.cos(a)*5; const t2=spawnMonS(THORN_DEF,x,z,{x:ARENA.x,z:ARENA.z},true); t2.aggro=true; const p=nearestFighter(x,z,60); t2.tgt=p?p.id:null; BOSS.adds.push(t2); } }
function resetBossS(){
  const B=BOSS, m=B.m; B.engaged=false; B.phase=1; B.enraged=false; B.stunT=0; m.immune=false; m.aggro=false; m.tgt=null; m.hp=m.maxHp; m.act=null; m.pendingHit=-1; m.hitters.clear();
  clearTeleS(); [...B.totems,...B.adds].forEach(removeMonS); B.totems=[]; B.adds=[];
}
function bossDefeatedS(m){
  const B=BOSS; m.respawnT=120; clearTeleS(); [...B.totems,...B.adds].forEach(x=>{ if(!x.dead) removeMonS(x); }); B.totems=[]; B.adds=[];
  B.engaged=false; toastTo(null,'The Rootwarden has fallen!','good');
}
function updateBossS(m,dt){
  const B=BOSS;
  for(let i=B.tele.length-1;i>=0;i--){ const e=B.tele[i]; e.t+=dt; if(e.t>=e.dur){ B.tele.splice(i,1); resolveTeleS(e,m); } }
  if(m.dead){
    m.deadT+=dt;
    if(m.deadT>2){ m.respawnT-=dt; if(m.respawnT<=0 && !playersInArena(20).length){ resetBossS(); m.dead=false; m.deadT=0; m.x=ARENA.x; m.z=ARENA.z; ev('respawn',m.id,r1(m.x),r1(m.z)); } }
    return;
  }
  const inside=playersInArena(6);
  if(!B.engaged && playersInArena(0).length){ B.engaged=true; m.aggro=true; B.rootT=4; B.slamT=10; m.atkT=1.5; toastTo(null,'The Rootwarden awakens!','bad'); ev('roar'); }
  if(B.engaged && !inside.length) resetBossS();
  m.awake=true;
  if(B.engaged){
    let p=null, dp=1e9; for(const q of inside){ const d=Math.hypot(q.x-m.x,q.z-m.z); if(d<dp){ dp=d; p=q; } }
    const dx=p.x-m.x, dz=p.z-m.z; m.tgt=p.id;
    const f=m.hp/m.maxHp;
    if(B.phase===1 && f<0.6){ B.phase=2; startShieldS(m); }
    if(m.immune){
      B.totems=B.totems.filter(x=>!x.dead&&!x.remove);
      if(!B.totems.length){ m.immune=false; B.stunT=5; m.act=null; clearTeleS(); toastTo(null,'The shield shatters! The Rootwarden is stunned.','good'); }
      else m.hp=Math.min(m.maxHp*0.6,m.hp+m.maxHp*0.004*dt);
    }
    if(B.phase===2 && !m.immune && f<0.3){ B.phase=3; B.enraged=true; toastTo(null,'The Rootwarden is enraged!','bad'); spawnAddsS(m); ev('roar'); }
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
            m.face=m.faceGoal=Math.atan2(-dx,-dz); addTeleS(m.x,m.z,reach+1.3,wind,'cleave',m.T.dmg,m.face,1.05); ev('mact',m.id,wind+0.35); } }
      } else { m.vx*=0.8; m.vz*=0.8; }
      B.rootT-=dt;
      if(B.rootT<=0){ B.rootT=B.enraged?4.5:(B.phase===2?6:7.5); const n=B.enraged?5:3;
        for(let i=0;i<n;i++){ const q=i===0?p:inside[Math.floor(Math.random()*inside.length)], a=AR(0,TAU), r=i===0?0:AR(3,6.5); addTeleS(q.x+Math.sin(a)*r,q.z+Math.cos(a)*r,2.4,1.6,'root',Math.round(m.T.dmg*1.5)); } }
      B.slamT-=dt;
      if(B.slamT<=0 && dp<15 && !slamming && !m.immune){ B.slamT=B.enraged?9:12.5; m.act={t:0,dur:2.3,slam:true}; addTeleS(m.x,m.z,9,2.2,'slam',Math.round(m.T.dmg*2.2)); ev('mact',m.id,2.3); ev('roar'); }
    }
  } else {
    const ex=ARENA.x-m.x, ez=ARENA.z-m.z, d=Math.hypot(ex,ez);
    if(d>1.5){ m.vx=ex/d*m.T.speed; m.vz=ez/d*m.T.speed; m.faceGoal=Math.atan2(-ex,-ez); } else { m.vx*=0.8; m.vz*=0.8; m.faceGoal+=dt*0.1; }
    if(m.hp<m.maxHp) m.hp=m.maxHp;
  }
  m.x+=m.vx*dt; m.z+=m.vz*dt;
  const ea=Math.hypot(m.x-ARENA.x,m.z-ARENA.z); if(ea>ARENA.r-2){ m.x=ARENA.x+(m.x-ARENA.x)/ea*(ARENA.r-2); m.z=ARENA.z+(m.z-ARENA.z)/ea*(ARENA.r-2); }
  m.face=angLerp(m.face,m.faceGoal,1-Math.exp(-5*dt));
}
