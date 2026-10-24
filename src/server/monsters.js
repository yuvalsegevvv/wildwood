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
  if(rdCtx) rdAdoptS(m);   // raids: what is made while a raid builds or its boss ticks (a boss's adds, a kit's spawns) belongs to the raid and fights at its level
  if(S.ctx) dgAdoptS(m);   // dungeons: a monster made while a run updates (a boss's adds, a kit's spawn, the boss) belongs to that run: its level, the party's health
  m.faceGoal=m.face; MONS.push(m); MON_BY_ID.set(m.id,m); return m;
}
const CAMPS=[];
// how many of each monster live in its zone: 40 of the level-1 kind, down to 20 of the level-15 kind;
// the vale's and the Hoarfrost Reach's zones hold two kinds, 12 of each; the outer ring's kinds (12-15) a quarter more, since their zones reach on
// to the land's edge; the edge kinds say how many (count)
const MON_COUNT_K=1.5;   // playtest: mobs felt scarce, so every zone holds half as many again
const MON_COUNT=d=>Math.round(MON_COUNT_K*(d.count||(d.level>15?12:Math.round((40-(d.level-1)*20/14)*(d.level>=12?1.25:1)))));
function initMonstersS(){
  const rng=mulberry32(31337), rr=(a,b)=>a+(b-a)*rng();
  /* where a camp may stand (the atlas's world, shared/world-atlas.js): on dry land clear of the coast, of every river and lake, of the villages and the roads (and trails), of the boss arenas, of every anchor
     (a village, gate, boss, dungeon door, zone entrance, island spot: 22 m) and of the Proving Isle; on ground a hiker walks easily. The zone itself is asked by the caller (zoneAt), so each land's zone table decides which ground is whose.
     (The old per-land keep-outs, sunKeepOut / gloamKeepOut, are not asked: their water, the Bowl's rim and the reserved doors are the atlas's water and anchors now.) */
  const ok=(x,z)=>x>WX0+26&&x<WX1-26&&z>WZ0+26&&z<WZ1-26&&!waIsSea(x,z)&&waCoast(x,z)>26&&getH(x,z)>1&&grad(x,z)<0.55&&waWaterDist(x,z)>8&&vDist(x,z)>VR+15&&!nearPath(x,z,8)&&arenaDist(x,z)>50&&waAnchorDist(x,z)>22&&!dgEntranceNear(x,z,32)&&!caveMouthNear(x,z,40)&&!inGlen(x,z,0)&&Math.hypot(x-WA_PVP.x,z-WA_PVP.z)>WA_PVP.r+62&&RD_ORDER.every(i=>Math.hypot(x-RDS[i].x,z-RDS[i].z)>56);   // dungeons: a camp keeps 32 m off a dungeon's door; no camp in the Greyspine's glacier valley (a strip kept clear); pvp: and 62 m off the Proving Isle's shore (nothing lives by the bridgehead)
  for(const d of MON_DEFS){
    const zn=defZone(d), total=MON_COUNT(d), pack=d.per+2;
    if(!zn) continue;   // amber: a kind whose zone is not defined yet (the Amber Reach's a37..a45 until shared/savannazones.js) has no camps
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
    // a crowded zone (the Sunscar's s28 by its walls) can run out of room: the rest join the kind's camps already made, so every kind keeps its MON_COUNT
    const mine=CAMPS.filter(c=>c.def===d);
    for(let k=0;made<total&&mine.length;k++,made++){ const c=mine[k%mine.length], a=rr(0,TAU), r=rr(0.5,4.5); makeMon(d,c.x+Math.sin(a)*r,c.z+Math.cos(a)*r,c,rr(0.92,1.08),false); }
  }
}
function monRoster(m){ return [m.id,m.def.id,r1(m.camp.x),r1(m.camp.z),Math.round(m.s*100)/100,r1(m.x),r1(m.z),m.dead?1:0,m.temp?1:0].concat(m.inst||m.rd?[m.dgK.lv,Math.round(m.maxHp)]:[]); }   // raids: a raid monster too   // dungeons: a run's monster adds [level, maxHp in the def's units]
function spawnMonS(d,x,z,camp,temp){ const m=makeMon(d,x,z,camp,1,temp); ev('spawn',monRoster(m)); return m; }
function removeMonS(m){ if(m.remove) return; m.remove=true; ev('despawn',m.id); }
function respawnMonS(m){
  const c=m.camp; m.x=c.x+AR(-3,3); m.z=c.z+AR(-3,3); m.hp=m.maxHp; m.dead=false; m.deadT=0; m.state='idle'; m.aggro=false; m.tgt=null;
  if(m.cave) caveFixS(m);   // cave: a spot on the floor
  m.timer=AR(1,3); m.slowT=0; m.burnT=0; m.pendingHit=-1; m.kbx=m.kbz=0; ev('respawn',m.id,r1(m.x),r1(m.z));
}
// inside a lake (not its frozen ice, not a river's ford): the cheap bilinear first, the water type only when well inside
const monInLake=(x,z)=>waWaterDist(x,z)<-1&&waWater(x,z)===WA_LAKE;
function monCenterS(m){ return {x:m.x,y:getH(m.x,m.z)+m.T.height*0.5*m.s,z:m.z}; }
// the cheap distance test comes first: inVillage() is only worth asking about a player who is close enough to matter (it was 28% of the server's tick)
function nearestFighter(x,z,maxD){ let best=null,bd=maxD*maxD; for(const p of S.players.values()){ const dx=p.x-x, dz=p.z-z, d=dx*dx+dz*dz; if(d>=bd||p.dead||p.pv||inVillage(p)||homeAt(p.x,p.z)) continue;   // home: monsters leave you alone at home
     bd=d; best=p; } return best; }   // (pvp: nothing hunts a fighter on the island)
function anyPlayerNear(x,z,d){ const d2=d*d; for(const p of S.players.values()){ const dx=p.x-x, dz=p.z-z; if(dx*dx+dz*dz<d2) return true; } return false; }
function updateMonstersS(dt){
  for(const m of MONS){
    if(m.remove) continue;
    if(m.inst) continue;   // dungeons: a run's monsters (its boss too) move in updateInstsS
    if(m.boss){ if(m.rd) rdBossTickS(m,dt); else updateBossS(m,dt); continue; }   // raids: a raid boss sleeps until its wards are broken (rdBossTickS, server/raids.js)
    if(m.cmo){ caveMoleS(m,dt); continue; }   // cave: the gem mole is scripted (server/cave/method-g.js)
    if(m.dead){
      m.deadT+=dt;
      if(m.deadT>1.2){ if(m.temp) removeMonS(m); else { m.respawnT-=dt; if(m.respawnT<=0 && !anyPlayerNear(m.camp.x,m.camp.z,22)) respawnMonS(m); } }
      continue;
    }
    m.awake=m.aggro||anyPlayerNear(m.x,m.z,110);
    if(!m.awake) continue;
    if(m.stunT>0){ m.stunT-=dt; m.pendingHit=-1; m.x+=m.kbx*dt; m.z+=m.kbz*dt; if(m.cave) caveMonStepS(m,m.x-m.kbx*dt,m.z-m.kbz*dt); const kd=Math.exp(-7*dt); m.kbx*=kd; m.kbz*=kd; m.vx=m.vz=0; continue; }   // cave: walls hold a knocked-back monster
    const hd=Math.hypot(m.x-m.camp.x,m.z-m.camp.z);
    if(!m.aggro && m.T.aggro){ const p=nearestFighter(m.x,m.z,m.T.aggro); if(p&&(!m.cave||caveLos(m.x,m.z,p.x,p.z))){ m.aggro=true; m.tgt=p.id; ev('aggro',m.id); } }   // cave: a wall hides you
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
      if(m.pendingHit>=0){ m.pendingHit-=dt; if(m.pendingHit<0 && dp<reach+0.8 && !(m.blindT>S.t)) hurtP(p,Math.max(1,Math.round(m.T.dmg*AR(0.85,1.15))),m); }   // cave: Flare, a blinded monster misses
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
    if(m.cave&&tx!==null){ const w=caveSteerS(m,tx,tz); tx=w[0]; tz=w[1]; }   // cave: round the corner
    if(tx!==null){ const ex=tx-m.x, ez=tz-m.z, d=Math.hypot(ex,ez); if(d>0.1){ m.vx=ex/d*speed; m.vz=ez/d*speed; m.faceGoal=Math.atan2(-ex,-ez); } }
    else { m.vx*=0.8; m.vz*=0.8; }
    const ox=m.x, oz=m.z;
    m.x+=(m.vx+m.kbx)*dt; m.z+=(m.vz+m.kbz)*dt;
    const kd=Math.exp(-7*dt); m.kbx*=kd; m.kbz*=kd;
    if(getH(m.x,m.z)<0.4 || vNear(m.x,m.z,VR+8) || monInLake(m.x,m.z)){ m.x=ox; m.z=oz; }   // (a river is a ford a monster wades; a lake is not)
    if(m.cave) caveMonStepS(m,ox,oz);   // cave: along the walls
    if(p && dp<m.T.rad+0.35){ const e=dp||1, mm=m.T.rad+0.35; m.x=p.x-dx/e*mm; m.z=p.z-dz/e*mm; }
    m.face=angLerp(m.face,m.faceGoal,1-Math.exp(-8*dt));
  }
  for(let i=MONS.length-1;i>=0;i--) if(MONS[i].remove){ MON_BY_ID.delete(MONS[i].id); MONS.splice(i,1); }
}
