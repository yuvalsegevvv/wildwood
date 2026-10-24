//@ Cave props of methods C and D: the echo plinth (a stepped dais with rune stones, a floating crystal and kill orbs) and the lantern crystal, its altar and the glowing crystal you carry
/* Agent map. Doc: docs/CAVE.md section 15. Kit and conventions: method-props.js. Test: tools/client-smoke.js (the cave case).
   exports: caveMpC(X) (plinth), caveMpD(X) (lantern; sets CAVE_MP.carry, the group that follows you while you hold the crystal).
   C: idle = a calm ring, slow runes and a hint pill within 26 m; the trial running = a fast pulsing ring, spinning rune dashes, a bright beam, orbiting orbs (one per pack monster, lit as they fall: c.k of c.n) and sparks off the rim.
   D: the crystal is a tall cyan cluster on a mound with a beam you can see from afar (taken: dull stumps, no light); the altar is a stone brazier, cold embers until you carry the crystal, then a gold flame, a tall beam and a pulsing ground ring show where to go.
      Carrying: the crystal floats over you, its glow and the light disc on the ground are the lantern's radius (they shrink with every hit that is left, turn orange and flicker when it is nearly out). */
function caveMpC(X){
  const pl=X.A.C.plinth, r=Math.min(pl.r||4,4), G=X.at(pl.x,pl.z), ac=X.accent, rd=X.rd, B=(x,y,z)=>new THREE.BoxGeometry(x,y,z), st=caveMpRockC(0x6b6f74,0.25);
  const disc=(x,y,z,nx,ny,nz,c)=>{ c.set(0x575c62).multiplyScalar(0.7+0.3*(ny*0.5+0.5)); if(ny>0.6&&Math.abs(Math.hypot(x,z)-r*0.78)<r*0.035) c.set(ac).multiplyScalar(0.75); };
  const band=(x,y,z,nx,ny,nz,c)=>{ c.set(0x70757a).multiplyScalar(0.65+0.35*(ny*0.5+0.5)); if(y>0.95&&y<1.2) c.set(ac).multiplyScalar(0.7); };
  const parts=[caveMpPart(new THREE.CylinderGeometry(r,r*1.06,0.14,rd?28:16),disc,0,0.07,0), caveMpPart(new THREE.CylinderGeometry(r*0.42,r*0.46,0.22,16),st,0,0.25,0),
    caveMpPart(new THREE.CylinderGeometry(0.38,0.5,1.2,8),st,0,0.85,0), caveMpPart(new THREE.CylinderGeometry(0.62,0.42,0.2,8),st,0,1.55,0)];
  for(let k=0;k<4;k++){ const a=Math.PI/4+k*Math.PI/2; parts.push(caveMpPart(B(0.36,1.5,0.3),band,Math.sin(a)*r*0.84,0.75,Math.cos(a)*r*0.84,{ry:a}), caveMpPart(caveMpRock(0.3,0.15,0.3,0.4,rd),st,Math.sin(a)*r*0.84,0.08,Math.cos(a)*r*0.84)); }
  G.add(X.mesh(parts));
  const gemMat=X.addMat({color:ac,opacity:1}), gems=[0,1,2,3].map(k=>{ const a=Math.PI/4+k*Math.PI/2, m=new THREE.Mesh(new THREE.OctahedronGeometry(0.15),gemMat); CAVE_MP.geos.push(m.geometry); m.scale.y=1.4; m.position.set(Math.sin(a)*r*0.84,1.7,Math.cos(a)*r*0.84); G.add(m); return m; });
  const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(1),X.sol(ac)); CAVE_MP.geos.push(crystal.geometry); crystal.scale.set(0.34,0.6,0.34); G.add(crystal);
  const ring=X.ring(ac,0.93,0.3), runes=X.arcs(6,0.55,0.8,ac,0.4), beam=X.beam(ac,5.5,0.4,0.12), halo=X.halo(ac,3.4,0.4), lb=X.text(3.1);
  ring.position.y=0.17; runes.position.y=0.18; halo.position.y=2.3; G.add(ring,runes,beam,halo); lb.set('Stand on the plinth',X.col.setHex(ac).getStyle()); lb.s.position.y=3.3; G.add(lb.s);
  const lit=X.sol(0xffffff), dim=X.sol(0x2c3238), orbG=new THREE.SphereGeometry(0.1,8,6); CAVE_MP.geos.push(orbG);
  const orbs=[0,1,2,3,4,5,6,7].map(()=>{ const m=new THREE.Mesh(orbG,dim); G.add(m); return m; });
  let t=0, was=false;
  X.add((s,dt,tt)=>{
    const on=!!s.c.s, k=s.c.k|0, n=Math.min(8,s.c.n|0), pu=Math.sin(tt*6);
    ring.material.opacity=on?0.6+0.35*pu:0.28+0.1*Math.sin(tt*1.6); ring.scale.setScalar(r*(on?1+0.02*pu:1)); runes.rotation.y+=dt*(on?2.4:0.25); runes.scale.setScalar(r*0.62); runes.material.opacity=on?0.9:0.35;
    crystal.rotation.y+=dt*(on?5:1); crystal.position.y=2.3+0.12*Math.sin(tt*2); beam.material.opacity=on?0.45:0.13; halo.material.opacity=on?0.7+0.2*pu:0.35; halo.scale.setScalar(on?4.4:3.4);
    gemMat.opacity=on?1:0.45; lb.s.visible=!on&&X.near(G,26);
    orbs.forEach((m,i)=>{ m.visible=on&&i<n; if(!m.visible) return; const a=tt*1.3+i/n*Math.PI*2; m.position.set(Math.cos(a)*1.0,2.3+0.1*Math.sin(tt*3+i),Math.sin(a)*1.0); const L=i<k; if(m.userData.l!==L){ m.userData.l=L; m.material=L?lit:dim; } });
    if(on&&!was&&X.fx) fxpRingSparks(G.position.x,G.position.y+0.2,G.position.z,r,ac,16,0.7); was=on;
    if(on&&X.fx&&X.near(G,30)){ t+=dt; if(t>0.09){ t=0; const a=AR(0,6.28); fxpAdd(G.position.x+Math.sin(a)*r*0.95,G.position.y+0.2,G.position.z+Math.cos(a)*r*0.95,0,AR(0.8,1.6),0,ac,0.16,AR(0.6,1),{white:0.4,grow:0.2,a:0.9}); } } });
}
function caveMpD(X){
  const c=X.A.D.crystal, a=X.A.D.altar, rd=X.rd, CY=0x7fe8ff, GD=0xffe9a8, st=caveMpRockC(0x5d6064,0.3), K=new THREE.Color();
  // the crystal on its mound
  const Gc=X.at(c.x,c.z), mound=X.mesh([caveMpPart(caveMpRock(1.15,0.38,1.05,0.4,rd),caveMpRockC(0x3e4a52,0.3),0,0.1,0)]); Gc.add(mound);
  const cr=X.mesh(caveMpCrystals(CY,[[0,0.0,1.9,0.2],[1.0,0.32,1.25,0.14],[2.2,0.38,1.0,0.14],[3.4,0.3,1.15,0.13],[4.6,0.42,0.8,0.12],[5.5,0.3,0.95,0.12]])); cr.position.y=0.25; Gc.add(cr);
  const stub=X.mesh(caveMpCrystals(0x2a5a6a,[[0,0.25,0.3,0.14],[2,0.4,0.25,0.1],[4,0.4,0.28,0.1]])); stub.position.y=0.3; Gc.add(stub);
  const chalo=X.halo(CY,5,0.6), cbeam=X.beam(CY,6.5,0.3,0.3); chalo.position.y=1.3; Gc.add(chalo,cbeam);
  // the altar
  const Ga=X.at(a.x,a.z), ap=[caveMpPart(new THREE.CylinderGeometry(0.95,1.05,0.28,10),st,0,0.14,0), caveMpPart(new THREE.CylinderGeometry(0.4,0.5,0.8,8),(x,y,z,nx,ny,nz,col)=>{ col.set(0x686c70).multiplyScalar(0.65+0.35*(ny*0.5+0.5)); if(y>0.55&&y<0.7) col.set(CY).multiplyScalar(0.7); },0,0.68,0),
    caveMpPart(new THREE.CylinderGeometry(0.82,0.4,0.38,12),caveMpRockC(0x7a7e82,0.2),0,1.27,0), caveMpPart(new THREE.CylinderGeometry(0.88,0.88,0.08,12),caveMpRockC(0x8e9296,0.15),0,1.5,0)];
  for(let k=0;k<3;k++){ const an=k/3*Math.PI*2+0.5; ap.push(caveMpPart(new THREE.CylinderGeometry(0.04,0.07,1.0,5).translate(0,0.5,0).rotateX(0.3).rotateY(an),st,Math.sin(an)*0.8,1.5,Math.cos(an)*0.8)); }
  Ga.add(X.mesh(ap));
  const fl=new THREE.Group(); fl.position.y=1.55; Ga.add(fl);
  const f1=new THREE.Mesh(new THREE.ConeGeometry(0.3,0.9,7),X.addMat({color:0xffc060,opacity:0.8})), f2=new THREE.Mesh(new THREE.ConeGeometry(0.17,0.6,7),X.addMat({color:0xfff4d0,opacity:0.95})); CAVE_MP.geos.push(f1.geometry,f2.geometry); f1.position.y=0.45; f2.position.y=0.3; fl.add(f1,f2);
  const ahalo=X.halo(0xffd890,3.5,0.0), abeam=X.beam(GD,7.5,0.4,0.0), aring=X.ring(GD,0.85,0.0); ahalo.position.y=1.8; aring.position.y=0.18; aring.scale.set(1.9,1,1.9); Ga.add(ahalo,abeam,aring);
  // the crystal you carry: a cluster, a halo, and the lantern's light on the ground
  const car=new THREE.Group(), cc=X.mesh(caveMpCrystals(CY,[[0,0,0.9,0.12],[1.2,0.4,0.6,0.09],[3.1,0.4,0.55,0.09],[4.5,0.4,0.6,0.08]])); cc.position.y=-0.35; car.add(cc);
  const lh=X.halo(CY,3,0.5), ld=X.ring(CY,0,0.12), le=X.ring(CY,0.93,0.4); ld.position.y=-2.15; le.position.y=-2.14; car.add(lh,ld,le); car.visible=false; X.g.add(car); CAVE_MP.carry=car;
  let had=false, t=0;
  X.add((s,dt,tt)=>{
    const has=!!s.d.s, N=X.MD('D').p.hits, k=has?Math.max(0,1-(s.d.h|0)/N):1;
    if(had&&!has&&X.fx){ if((s.cd.D|0)>0){ fxpSparks(Ga.position.x,Ga.position.y+1.6,Ga.position.z,GD,24,5,{up:3,size:0.25}); fxpFlare(Ga.position.x,Ga.position.y+1.7,Ga.position.z,GD,4); } else fxpSmoke(P.x,P.y+1.6,P.z,0,0.5,0,0x6a7a80,1,1.4,{grow:2,a:0.5}); } had=has;
    cr.visible=!has; stub.visible=has; chalo.visible=!has; cbeam.visible=!has; cr.rotation.y+=dt*0.4; chalo.material.opacity=0.5+0.15*Math.sin(tt*2.2); cbeam.material.opacity=0.28+0.08*Math.sin(tt*2.2);
    fl.scale.setScalar(has?1.0+0.12*Math.sin(tt*9):0.28); f1.material.opacity=has?0.85:0.35; f1.material.color.setHex(has?0xffc060:CY); f2.visible=has;
    ahalo.material.opacity=has?0.65+0.2*Math.sin(tt*5):0.12; ahalo.scale.setScalar(has?4.4:2.6); abeam.material.opacity=has?0.55+0.15*Math.sin(tt*5):0; abeam.visible=has; aring.material.opacity=has?0.35+0.3*Math.sin(tt*4):0; aring.scale.setScalar(1.9+(has?0.15*Math.sin(tt*4):0));
    car.visible=has; if(!has) return;
    car.position.set(P.x,P.y+2.3+0.1*Math.sin(tt*3),P.z); cc.rotation.y+=dt*2; cc.scale.setScalar(0.5+0.5*k);
    const fl2=k<0.34&&!LOW?0.55+0.45*Math.abs(Math.sin(tt*17)):1, r=1.4+3.6*k;
    K.setHex(CY).lerp(CAVEMP_T.set(0xff9a4a),1-Math.min(1,k*2)); lh.material.color.copy(K); ld.material.color.copy(K); le.material.color.copy(K);
    lh.material.opacity=(0.25+0.4*k)*fl2; lh.scale.setScalar(1.8+2.2*k); ld.scale.set(r,1,r); le.scale.set(r,1,r); ld.material.opacity=0.1+0.08*k; le.material.opacity=(0.2+0.3*k)*fl2;
    if(X.fx&&k<0.5){ t+=dt; if(t>0.2){ t=0; fxpAdd(P.x+AR(-0.4,0.4),P.y+2.0,P.z+AR(-0.4,0.4),0,-0.6,0,0xff9a4a,0.1,0.6,{white:0.3,grow:0.3,a:0.9}); } } });
}
