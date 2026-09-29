//@ Boss zones and waves (fire pools, whirlpools, the whiteout, the blizzard, tidal walls) and what a boss does to you: frozen, slowed, shoved, pulled into a whirlpool
/* The server (src/server/boss-fx.js) sends 'zone' / 'zend' (a ground zone: ember, whirl, whiteout, blizzard), 'wall' / 'wend' (a wave with a gap in it) and
   'pfx' (an effect on you: root, slow, push). The hurting is done there; here the zones and waves are drawn, and the effects are applied to your own
   movement (pfxStep, called by updatePlayer): a whirlpool pulls you toward its middle while you stand in it. */
const BZONES=new Map(), BWALLS=new Map(), PFX={root:0,slow:0,kx:0,kz:0,ice:null};
const ZONE_COL={ember:0xff7a2a,whirl:0x3ac8e8,whiteout:0xeaf6ff,blizzard:0xdff0ff};
const whiteGeo=new THREE.RingGeometry(1,4,64).rotateX(-Math.PI/2);   // the snow outside a whiteout's safe circle: scale = the circle's radius
const armGeo=new THREE.RingGeometry(0.5,0.6,24,1,0,2.4).rotateX(-Math.PI/2), waveGeo=new THREE.BoxGeometry(1,1,1);
function onBossZone(id,kind,x,z,r,dur,a,b){
  if(BZONES.has(id)) return;
  const y=getH(x,z)+0.09, col=ZONE_COL[kind]||0xffffff;
  const fill=new THREE.Mesh(kind==='whiteout'?whiteGeo:teleFill,fxMat(col,kind==='whiteout'?0.55:0.26)), edge=new THREE.Mesh(teleEdge,fxMat(kind==='whiteout'?0xffffff:col,0.9));
  fill.position.set(x,y,z); edge.position.set(x,y+0.01,z); fill.scale.setScalar(r); edge.scale.setScalar(r); scene.add(fill,edge);
  const Z={kind,x,z,r,dur,t:0,a,b,fill,edge,y,arms:null};
  if(kind==='whirl'){ Z.arms=new THREE.Group(); for(let i=0;i<3;i++){ const arm=new THREE.Mesh(armGeo,fxMat(0xbff4ff,0.7)); arm.rotation.y=i*TAU/3; Z.arms.add(arm); } Z.arms.position.set(x,y+0.03,z); Z.arms.scale.setScalar(r); scene.add(Z.arms); }
  if(kind==='blizzard'&&SND.ready){ const s=spatial(x,z,20,120); if(s) noiseHit({bus:'ui',filter:'bandpass',ff:1200,ff2:500,dur:1.8,vol:0.22*s.gain,pan:s.pan}); }
  BZONES.set(id,Z);
}
function endBossZone(id){
  const Z=BZONES.get(id); if(!Z) return; BZONES.delete(id);
  scene.remove(Z.fill,Z.edge); Z.fill.material.dispose(); Z.edge.material.dispose();
  if(Z.arms){ scene.remove(Z.arms); Z.arms.children.forEach(c=>c.material.dispose()); }
}
const whiteRNow=Z=>lerp(Z.r,Z.b,clamp(Z.t/(Z.dur*0.8)));   // a whiteout's safe radius: it closes over the first 80% of its life (same rule as the server)
function updateBossZones(dt){
  for(const [id,Z] of BZONES){
    Z.t+=dt; if(Z.t>Z.dur+1){ endBossZone(id); continue; }
    const pulse=0.5+0.5*Math.sin(t*5);
    if(Z.kind==='ember'){ Z.fill.material.opacity=0.2+0.12*pulse; if(Math.random()<dt*10){ const e=new THREE.Mesh(emberGeo,emberMat); e.position.set(Z.x+AR(-Z.r,Z.r)*0.8,Z.y+0.1,Z.z+AR(-Z.r,Z.r)*0.8); scene.add(e); CB.fx.push({mesh:e,life:0.6,max:0.6,shrink:true}); } }
    else if(Z.kind==='whirl'){ Z.arms.rotation.y+=dt*2.4; Z.fill.material.opacity=0.2+0.1*pulse; }
    else if(Z.kind==='whiteout'){ const r=whiteRNow(Z); Z.fill.scale.setScalar(r); Z.edge.scale.setScalar(r); Z.edge.material.opacity=0.6+0.35*pulse; }
    else if(Z.kind==='blizzard'){ const wind=Z.t<Z.a; Z.fill.material.opacity=wind?0.06+0.05*pulse:0.3+0.06*pulse; Z.edge.material.opacity=wind?0.3+0.3*pulse:0.9; }
  }
  for(const [id,W] of BWALLS){
    W.t+=dt; if(W.t>W.life+0.5){ endBossWall(id); continue; }
    const age=Math.max(0,W.t-W.delay), s=age*W.speed, px=W.x+W.ux*s, pz=W.z+W.uz*s;
    W.g.position.set(px,Math.max(getH(px,pz),WATER)+0.9,pz);
    const warn=W.t<W.delay; W.mat.opacity=warn?0.25+0.2*Math.sin(t*16):0.6;
    if(!warn&&!W.started){ W.started=true; if(SND.ready){ const q=spatial(px,pz,20,140); if(q) noiseHit({bus:'ui',filter:'lowpass',ff:900,ff2:300,dur:1.6,vol:0.26*q.gain,pan:q.pan}); } }
    W.foam.position.y=0.95+Math.sin(t*9)*0.12;
  }
}
function clearBossZones(){ [...BZONES.keys()].forEach(endBossZone); [...BWALLS.keys()].forEach(endBossWall); }
// a wave: two walls of water with the gap between them, rolling along ang; before delay it stands where it starts, flickering (the warning)
function onBossWall(id,x,z,ang,speed,half,gapC,gapHalf,delay,life){
  if(BWALLS.has(id)) return;
  const g=new THREE.Group(), mat=fxMat(0x3ac8e8,0.6), foamMat=fxMat(0xffffff,0.55); g.rotation.y=ang;
  const foam=new THREE.Group(); g.add(foam);
  for(const [l0,l1] of [[-half,gapC-gapHalf],[gapC+gapHalf,half]]){
    if(l1-l0<0.5) continue;
    const w=new THREE.Mesh(waveGeo,mat); w.scale.set(l1-l0,1.8,2.2); w.position.set((l0+l1)/2,0,0); g.add(w);
    const f=new THREE.Mesh(waveGeo,foamMat); f.scale.set(l1-l0,0.25,2.6); f.position.set((l0+l1)/2,1.0,0); foam.add(f);
  }
  g.position.set(x,Math.max(getH(x,z),WATER)+0.9,z); scene.add(g);
  BWALLS.set(id,{g,mat,foam,foamMat,x,z,ux:-Math.sin(ang),uz:-Math.cos(ang),speed,delay,life,t:0,started:false});
}
function endBossWall(id){
  const W=BWALLS.get(id); if(!W) return; BWALLS.delete(id);
  scene.remove(W.g); W.mat.dispose(); W.foamMat.dispose();
}
/* ---- effects on you ---- */
function onPfx(kind,dur,vx,vz){
  if(kind==='root'){ PFX.root=Math.max(PFX.root,dur); toast('Frozen in ice!','bad'); spawnRing(2.2,0x9fe8ff,P.y+0.2); }
  else if(kind==='slow') PFX.slow=Math.max(PFX.slow,dur);
  else if(kind==='push'){ PFX.kx+=vx; PFX.kz+=vz; camShake=Math.max(camShake,0.3); }
}
// each frame while you move: timers, the shove fading out (about 3 m for 12 m/s), a whirlpool's pull, and the ice block round you
function pfxStep(dt){
  PFX.root=Math.max(0,PFX.root-dt); PFX.slow=Math.max(0,PFX.slow-dt);
  P.x+=PFX.kx*dt; P.z+=PFX.kz*dt; const kd=Math.exp(-4*dt); PFX.kx*=kd; PFX.kz*=kd;
  for(const Z of BZONES.values()){
    if(Z.kind!=='whirl') continue;
    const dx=Z.x-P.x, dz=Z.z-P.z, d=Math.hypot(dx,dz); if(d<Z.r+1.5&&d>0.6){ P.x+=dx/d*3.4*dt; P.z+=dz/d*3.4*dt; }
  }
  if(PFX.root>0){
    if(!PFX.ice){ PFX.ice=new THREE.Mesh(new THREE.CylinderGeometry(0.75,0.95,2.3,6),iceMat); PFX.ice.renderOrder=3; scene.add(PFX.ice); }
    PFX.ice.visible=true; PFX.ice.position.set(P.x,P.y+1.1,P.z);
  } else if(PFX.ice) PFX.ice.visible=false;
}
