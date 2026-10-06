//@ Monster views: made from the family models (monster-*.js), moved smoothly toward the server's snapshots, flashed, burning, dying
const MONS=[], MON_GEO={};
function monMat(glow){ const m=new THREE.MeshLambertMaterial({vertexColors:true, emissive:glow||0x000000}); m.userData.glow=new THREE.Color(glow||0); return m; }
// the models are in monster-*.js (MODELS: geo / build / anim per family); this file makes and moves the views
function monGeos(d){ return MON_GEO[d.id]||(MON_GEO[d.id]=MODELS[d.model].geo(d,d.pal)); }
// fills a monster's group with its meshes (the first time it is in view: a roster of a thousand costs nothing until then, and lands nobody visits are never built); returns the parts animate() moves
function buildMonster(d,mat,g){
  const P0={};
  MODELS[d.model].build(d,monGeos(d),geo=>{ const m=new THREE.Mesh(geo,mat); m.castShadow=true; return m; },g,P0);
  return P0;
}
/* Monsters are simulated by the world server; the client keeps a view of each one (MONS), created from the
   roster the server sends on join, moved smoothly toward the latest snapshot, and animated locally. */
const MON_BY_ID=new Map(), DEF_BY_ID={};
ALL_MON_DEFS.forEach(d=>{ DEF_BY_ID[d.id]=d; });
function addMonView(r){ // [id, defId, campX, campZ, scale, x, z, dead, temp]
  if(MON_BY_ID.has(r[0])) return MON_BY_ID.get(r[0]);
  const d=DEF_BY_ID[r[1]]; if(!d) return null;
  const mat=monMat(d.glow), g=new THREE.Group(); scene.add(g);
  const m={id:r[0],def:d,model:d.model,T:d,camp:{x:r[2],z:r[3]},mat,g,parts:null,s:r[4],gs:r[4]*d.scale,maxHp:d.hp,hp:d.hp,
    x:r[5],z:r[6],y:getH(r[5],r[6]),tx:r[5],tz:r[6],face:0,tface:0,vx:0,vz:0,ph:AR(0,TAU),flash:0,slowT:0,
    dead:!!r[7],deadT:r[7]?9:0,aggro:false,immune:false,act:null,lunge:0,temp:!!r[8],spawnT:r[8]?0.6:0,boss:!!d.boss};
  if(r.length>9){ m.dgK=dgMonK(d,r[9]); m.maxHp=m.hp=Math.max(1,+r[10]||d.hp); }   // dungeons: a run monster's level and health in the def's units (roster fields 9, 10; dungeon/run.js)
  g.visible=false; MONS.push(m); MON_BY_ID.set(m.id,m);
  if(m.boss) BOSS.list.push(m);
  return m;
}
function removeMonView(id){
  const m=MON_BY_ID.get(id); if(!m) return;
  scene.remove(m.g); m.mat.dispose(); MON_BY_ID.delete(id); rxViewDrop(id);   // reactions: its aura marker goes too
  const i=MONS.indexOf(m); if(i>=0) MONS.splice(i,1);
  if(CB.target===m) CB.target=null; BOSS.list=BOSS.list.filter(b=>b!==m); if(BOSS.m===m) BOSS.m=null;
}
function clearMonViews(){ [...MON_BY_ID.keys()].forEach(removeMonView); }
function applyMonSnap(a){ // [id, x, z, face, hp, flags: 1 aggro, 4 slowed, 8 immune]
  const m=MON_BY_ID.get(a[0]); if(!m) return;
  m.tx=a[1]; m.tz=a[2]; m.tface=a[3]; m.hp=a[4];
  m.aggro=!!(a[5]&1); m.slowT=(a[5]&4)?1:0; m.immune=!!(a[5]&8); m.burning=!!(a[5]&32);
  if(m.dead){ monRespawned(m,a[1],a[2]); }
}
function monRespawned(m,x,z){
  m.dead=false; m.deadT=0; m.hp=m.maxHp; m.x=m.tx=x; m.z=m.tz=z; m.y=getH(x,z);
  m.spawnT=0.6; m.g.rotation.set(0,m.face,0); m.act=null;
}
function monCenter(m){ return new THREE.Vector3(m.x,m.y+m.T.height*0.5*m.s,m.z); }
function updateMonsters(dt){
  for(const m of MONS){
    if(m.dead){
      m.deadT+=dt; const dur=m.boss?2:1.2;
      if(m.deadT<dur){ const f=m.deadT/dur; m.g.scale.setScalar(m.gs*(1-f*(m.boss?0.6:0.85))); m.g.position.y=m.y-f*(m.boss?1.5:0.3); m.g.rotation.z=f*(m.boss?0.5:0.9); }
      else m.g.visible=false;
      continue;
    }
    const dp=Math.hypot(m.x-P.x,m.z-P.z);
    if(dp>(m.boss?170:95)){ m.g.visible=false; m.x=m.tx; m.z=m.tz; continue; }
    m.g.visible=true; if(!m.parts) m.parts=buildMonster(m.def,m.mat,m.g);
    const ox=m.x, oz=m.z, k=1-Math.exp(-10*dt);
    m.x+=(m.tx-m.x)*k; m.z+=(m.tz-m.z)*k;
    if(Math.hypot(m.tx-m.x,m.tz-m.z)>12){ m.x=m.tx; m.z=m.tz; }
    const inv=1/Math.max(dt,1e-3); m.vx=(m.x-ox)*inv; m.vz=(m.z-oz)*inv;
    m.y=getH(m.x,m.z);
    m.face=angLerp(m.face,m.tface,1-Math.exp(-10*dt));
    animateMonster(m,dt,Math.min(Math.hypot(m.vx,m.vz),9));
    m.flash=Math.max(0,m.flash-dt*4);
    if(m.boss){ bossVisual(m,dt); continue; }
    const f=m.flash, sl=m.slowT>0?0.35:0, gl=m.mat.userData.glow, bn=m.burning?0.35+0.15*Math.sin(t*14):0;   // burning: an orange glow and sparks
    m.mat.emissive.setRGB(gl.r+f*0.9+bn,gl.g+f*0.35+sl*0.4+bn*0.4,gl.b+f*0.3+sl);
    if(m.burning&&m.g.visible&&Math.random()<dt*12){ const e=new THREE.Mesh(emberGeo,emberMat); e.position.set(m.x+AR(-0.35,0.35)*m.s,m.y+m.T.height*m.s*AR(0.2,1),m.z+AR(-0.35,0.35)*m.s); scene.add(e); CB.fx.push({mesh:e,life:0.5,max:0.5,shrink:true}); }
  }
  updateBossFx(dt); rxViewUpdate(dt);   // reactions: the aura markers follow their monsters
}
function animateMonster(m,dt,sp){
  const g=m.g;
  m.lunge=Math.max(0,m.lunge-dt);
  const lunge=m.lunge>0?Math.sin((0.5-m.lunge)/0.5*Math.PI)*0.45*m.T.scale:0;
  let sc=m.gs; if(m.spawnT>0){ m.spawnT-=dt; sc=m.gs*(1-Math.max(0,m.spawnT)/0.6); }
  g.scale.setScalar(sc); g.rotation.set(0,m.face,0);
  g.position.set(m.x-Math.sin(m.face)*lunge,m.y,m.z-Math.cos(m.face)*lunge);
  MODELS[m.model].anim(m,dt,sp,lunge);
  if(m.act){ m.act.t+=dt; if(m.act.t>=m.act.dur) m.act=null; }
}

