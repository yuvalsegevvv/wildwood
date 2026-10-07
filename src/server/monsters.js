//@ Monsters on the server: camps in their zones, AI (aggro, chase, attack, leash), respawns, temporary monsters
/* Levels 1-2 leave you alone until hit; everything else comes for the nearest player close by.
   A monster only thinks while a player is within 110 m (or while it is chasing someone).
   The server has no tree colliders, so monsters can brush through trees. */
const MONS=[], MON_BY_ID=new Map(); let nextMonId=1;
const DEF_BY_ID={}; ALL_MON_DEFS.forEach(d=>{ DEF_BY_ID[d.id]=d; });
function makeMon(d,x,z,camp,s,temp){
  const m={id:nextMonId++,def:d,T:d,model:d.model,camp:camp||{x,z},s:s||1,x,z,face:AR(0,TAU),faceGoal:0,vx:0,vz:0,kbx:0,kbz:0,
    state:'idle',timer:AR(0,3),ph:AR(0,TAU),slowT:0,dead:false,deadT:0,respawnT:0,atkT:0,aggro:false,tgt:null,gx:x,gz:z,
    pendingHit:-1,act:null,temp:!!temp,hp:d.hp,maxHp:d.hp,hitters:new Map(),awake:false};
  if(S.ctx) dgAdoptS(m);   // dungeons: a monster made while a run updates (a boss's adds, a kit's spawn, the boss) belongs to that run: its level, the party's health
  m.faceGoal=m.face; MONS.push(m); MON_BY_ID.set(m.id,m); return m;
}
const CAMPS=[];
// how many of each monster live in its zone: 40 of the level-1 kind, down to 20 of the level-15 kind;
// the vale's and the Hoarfrost Reach's zones hold two kinds, 12 of each; the outer ring's kinds (12-15) a quarter more, since their zones reach on
// to the land's edge; the edge kinds say how many (count)
const MON_COUNT=d=>d.count||(d.level>15?12:Math.round((40-(d.level-1)*20/14)*(d.level>=12?1.25:1)));
function initMonstersS(){
  const rng=mulberry32(31337), rr=(a,b)=>a+(b-a)*rng();
  const ok=(x,z)=>{ const bz=borderZ(x), home=z>=bz&&x<borderX(z), grey=z<bz&&x<borderXN(z); return x>WX0+26&&x<WX1-26&&z>(home?bz:WZ0)+26&&z<(grey?bz:HALF)-26&&getH(x,z)>1&&grad(x,z)<0.55&&zoneRidge(x,z)<0.5&&vDist(x,z)>VR+15&&!nearPath(x,z,8)&&arenaDist(x,z)>50&&!inTunnelCut(x,z,15)&&!inGlen(x,z,8)&&!inGate(x,z,6)&&!greyWet(x,z,-3)&&!dgEntranceNear(x,z,32); };   // dungeons: a camp keeps 32 m off a dungeon's door (none was nearer: no camp moves)
  for(const d of MON_DEFS){
    const zn=defZone(d), total=MON_COUNT(d), pack=d.per+2;
    let made=0;
    for(let tries=0;tries<4000&&made<total;tries++){
      const spread=tries<1200?0.8:0.94, gap=tries<1500?18:tries<2800?13:9;
      const [x,z]=zonePoint(zn,rr(-0.5,0.5)*spread,0.5+rr(-0.5,0.5)*spread,true);
      if(!ok(x,z)||zoneAt(x,z)!==zn||CAMPS.some(c=>Math.hypot(c.x-x,c.z-z)<gap)) continue;
      const camp={x,z,def:d,zone:zn}; CAMPS.push(camp);
      const n=Math.min(pack,total-made);
      for(let k=0;k<n;k++){ const a=rr(0,TAU), r=rr(0.5,3.5+n*0.4); makeMon(d,x+Math.sin(a)*r,z+Math.cos(a)*r,camp,rr(0.92,1.08),false); }
      made+=n;
    }
  }
}
function monRoster(m){ return [m.id,m.def.id,r1(m.camp.x),r1(m.camp.z),Math.round(m.s*100)/100,r1(m.x),r1(m.z),m.dead?1:0,m.temp?1:0].concat(m.inst?[m.dgK.lv,Math.round(m.maxHp)]:[]); }   // dungeons: a run's monster adds [level, maxHp in the def's units]
function spawnMonS(d,x,z,camp,temp){ const m=makeMon(d,x,z,camp,1,temp); ev('spawn',monRoster(m)); return m; }
function removeMonS(m){ if(m.remove) return; m.remove=true; ev('despawn',m.id); }
function respawnMonS(m){
  const c=m.camp; m.x=c.x+AR(-3,3); m.z=c.z+AR(-3,3); m.hp=m.maxHp; m.dead=false; m.deadT=0; m.state='idle'; m.aggro=false; m.tgt=null;
  m.timer=AR(1,3); m.slowT=0; m.burnT=0; m.pendingHit=-1; m.kbx=m.kbz=0; ev('respawn',m.id,r1(m.x),r1(m.z));
}
function monCenterS(m){ return {x:m.x,y:getH(m.x,m.z)+m.T.height*0.5*m.s,z:m.z}; }
function nearestFighter(x,z,maxD){ let best=null,bd=maxD; for(const p of S.players.values()){ if(p.dead||inVillage(p)) continue; const d=Math.hypot(p.x-x,p.z-z); if(d<bd){ bd=d; best=p; } } return best; }
function anyPlayerNear(x,z,d){ for(const p of S.players.values()) if(Math.hypot(p.x-x,p.z-z)<d) return true; return false; }
function updateMonstersS(dt){
  for(const m of MONS){
    if(m.remove) continue;
    if(m.inst) continue;   // dungeons: a run's monsters (its boss too) move in updateInstsS
    if(m.boss){ updateBossS(m,dt); continue; }
    if(m.dead){
      m.deadT+=dt;
      if(m.deadT>1.2){ if(m.temp) removeMonS(m); else { m.respawnT-=dt; if(m.respawnT<=0 && !anyPlayerNear(m.camp.x,m.camp.z,22)) respawnMonS(m); } }
      continue;
    }
    m.awake=m.aggro||anyPlayerNear(m.x,m.z,110);
    if(!m.awake) continue;
    if(m.stunT>0){ m.stunT-=dt; m.pendingHit=-1; m.x+=m.kbx*dt; m.z+=m.kbz*dt; const kd=Math.exp(-7*dt); m.kbx*=kd; m.kbz*=kd; m.vx=m.vz=0; continue; }
    const hd=Math.hypot(m.x-m.camp.x,m.z-m.camp.z);
    if(!m.aggro && m.T.aggro){ const p=nearestFighter(m.x,m.z,m.T.aggro); if(p){ m.aggro=true; m.tgt=p.id; ev('aggro',m.id); } }
    { const tq=ssTauntedBy(m); if(tq&&!inVillage(tq)&&hd<=32){ m.tgt=tq.id; m.aggro=true; } }   // skillsets: a taunted monster comes for the taunter
    let p=m.aggro?S.players.get(m.tgt):null;
    if(m.aggro && (!p||p.dead||inVillage(p)||hd>32)){
      const alt=hd<=32?nearestFighter(m.x,m.z,14):null;
      if(alt){ m.tgt=alt.id; p=alt; } else { m.aggro=false; m.tgt=null; m.state='return'; m.pendingHit=-1; p=null; }
    }
    let tx=null,tz=null,speed=0,dx=0,dz=0,dp=1e9;
    const reach=m.T.rad+(m.model==='treant'?1.6:1.1);
    if(m.aggro&&p){
      dx=p.x-m.x; dz=p.z-m.z; dp=Math.hypot(dx,dz);
      if(dp>reach && m.T.speed>0){ tx=p.x; tz=p.z; speed=m.T.speed; m.state='chase'; }
      else if(m.T.speed===0){ m.state='idle'; }
      else { m.state='attack'; m.faceGoal=Math.atan2(-dx,-dz); m.atkT-=dt;
        if(m.atkT<=0 && !m.T.noAttack){ m.atkT=m.T.atk; m.pendingHit=0.28; ev('mact',m.id); } }
      if(m.pendingHit>=0){ m.pendingHit-=dt; if(m.pendingHit<0 && dp<reach+0.8) hurtP(p,Math.max(1,Math.round(m.T.dmg*AR(0.85,1.15))),m); }
    } else if(m.state==='return'){
      tx=m.camp.x; tz=m.camp.z; speed=m.T.speed*1.1;
      if(hd<2.5){ m.state='idle'; m.timer=AR(1,3); m.hp=m.maxHp; m.hitters.clear(); }
    } else {
      m.timer-=dt;
      if(m.timer<=0){
        if(m.state==='wander'){ m.state='idle'; m.timer=AR(2,6); }
        else { m.state='wander'; m.timer=AR(3,7); const a=AR(0,TAU), r=AR(1,7); m.gx=m.camp.x+Math.sin(a)*r; m.gz=m.camp.z+Math.cos(a)*r; }
      }
      if(m.state==='wander'){ tx=m.gx; tz=m.gz; speed=m.T.speed*0.4; if(Math.hypot(tx-m.x,tz-m.z)<0.5){ m.state='idle'; m.timer=AR(2,5); } }
    }
    if(m.slowT>0){ m.slowT-=dt; speed*=0.4; }
    if(m.model==='slime'){ m.ph+=dt*(Math.hypot(m.vx,m.vz)>0.1?7:2.5); if(speed>0) speed*=Math.max(0,Math.sin(m.ph))>0.15?1.6:0.15; }
    if(tx!==null){ const ex=tx-m.x, ez=tz-m.z, d=Math.hypot(ex,ez); if(d>0.1){ m.vx=ex/d*speed; m.vz=ez/d*speed; m.faceGoal=Math.atan2(-ex,-ez); } }
    else { m.vx*=0.8; m.vz*=0.8; }
    const ox=m.x, oz=m.z;
    m.x+=(m.vx+m.kbx)*dt; m.z+=(m.vz+m.kbz)*dt;
    const kd=Math.exp(-7*dt); m.kbx*=kd; m.kbz*=kd;
    if(getH(m.x,m.z)<0.4 || vDist(m.x,m.z)<VR+8 || inTunnelCut(m.x,m.z)){ m.x=ox; m.z=oz; }
    if(p && dp<m.T.rad+0.35){ const e=dp||1, mm=m.T.rad+0.35; m.x=p.x-dx/e*mm; m.z=p.z-dz/e*mm; }
    m.face=angLerp(m.face,m.faceGoal,1-Math.exp(-8*dt));
  }
  for(let i=MONS.length-1;i>=0;i--) if(MONS[i].remove){ MON_BY_ID.delete(MONS[i].id); MONS.splice(i,1); }
}
