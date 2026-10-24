//@ Cave props of methods E and F: the silent chamber (a sleeping stone guardian with a noise meter, a lantern gate at the entry, the shrine) and the collapse run (the boulder jam with glowing cracks, the vault chest)
/* Agent map. Doc: docs/CAVE.md section 15. Kit and conventions: method-props.js. Test: tools/client-smoke.js (the cave case).
   exports: caveMpE(X) (silent chamber), caveMpF(X) (collapse vault).
   E: the guardian is a curled beast of stone (haunches, horns, spine spikes, a tail) lying with its head to the entry; its eye slits open and glow red as the noise rises (e.z), a bar above it shows the noise (only while you run the chamber), and a ground ring
      goes from teal to red. The entry is a gate of two posts with lanterns (teal, amber while it runs) and a hint pill within 22 m; the shrine is a carved stele with a beacon, bright while you run it.
   F: the jam is a pile of boulders with orange cracks; with a tremor announced (fv.w) the cracks glow, dust and pebbles fall, the boulders shake and a countdown pill shows; open (fv.o) the boulders are gone and the vault chest throws its lid
      open with a gold beam, a glow on the floor and a countdown pill. */
function caveMpE(X){
  const MP=CAVE_MP, E=X.A.E, gd=E.guard, en=E.entry, sh=E.shrine, rd=X.rd, B=(x,y,z)=>new THREE.BoxGeometry(x,y,z), K=new THREE.Color();
  const G=X.at(gd.x,gd.z); G.rotation.y=Math.atan2(en.x-gd.x,en.z-gd.z);   // local +z = toward the entry
  const skin=(x,y,z,nx,ny,nz,c)=>{ c.set(0x3b3f48).multiplyScalar(0.5+0.5*(ny*0.5+0.5)); const v=h3(Math.floor(x*2),Math.floor(y*2),Math.floor(z*2)); if(ny>0.4&&v>0.72) c.set(0x3e5a42).multiplyScalar(0.6+0.4*ny); else c.multiplyScalar(0.85+v*0.3); };
  const bone=caveMpRockC(0x8d8a80,0.2), parts=[caveMpPart(caveMpRock(1.9,1.0,1.5,0.3,rd),skin,0,0.85,-0.3), caveMpPart(caveMpRock(1.1,0.85,1.0,0.3,rd),skin,-1.25,0.65,-0.8), caveMpPart(caveMpRock(1.1,0.85,1.0,0.3,rd),skin,1.25,0.65,-0.8),
    caveMpPart(caveMpRock(0.85,0.62,0.85,0.25,rd),skin,0,0.62,1.9), caveMpPart(caveMpRock(0.5,0.34,0.55,0.25,rd),skin,0,0.42,2.6), caveMpPart(caveMpRock(0.9,0.2,0.3,0.3,rd),skin,0,1.0,2.25),
    caveMpPart(caveMpRock(0.42,0.28,0.6,0.3,rd),skin,-0.75,0.25,2.3), caveMpPart(caveMpRock(0.42,0.28,0.6,0.3,rd),skin,0.75,0.25,2.3)];
  for(const sx of [-1,1]) parts.push(caveMpPart(new THREE.ConeGeometry(0.2,1.4,6).translate(0,0.7,0).rotateX(-0.8).rotateZ(sx*0.45),bone,sx*0.6,1.05,1.65));   // horns
  for(let k=0;k<6;k++) parts.push(caveMpPart(new THREE.ConeGeometry(0.17-k*0.01,0.7-k*0.05,5),bone,0,1.85-Math.abs(k-2)*0.1,-1.7+k*0.45,{rx:-0.25}));   // spine spikes
  for(let k=0;k<5;k++) parts.push(caveMpPart(caveMpRock(0.5-k*0.07,0.3,0.5-k*0.07,0.3,rd),skin,-1.7-Math.sin(k*0.7)*0.7,0.3,-1.2-k*0.5-Math.cos(k*0.7)*0.2));   // the tail, curling away
  G.add(X.mesh(parts));
  const eyeMat=X.sol(0xff4a3a), eyes=[-1,1].map(s=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),eyeMat); MP.geos.push(m.geometry); m.position.set(s*0.4,0.8,2.55); G.add(m); return m; });
  const eh=X.halo(0xff3a2a,2.2,0); eh.position.set(0,0.85,2.9); G.add(eh);
  const ring=X.ring(0x66e0d0,0.9,0); ring.position.y=0.15; ring.scale.set(4.4,1,4.4); G.add(ring);
  const mc=document.createElement('canvas'); mc.width=128; mc.height=32; const mt=new THREE.CanvasTexture(mc), mm=new THREE.SpriteMaterial({map:mt,transparent:true,depthWrite:false,fog:false}), meter=new THREE.Sprite(mm); MP.texs.push(mt); MP.mats.push(mm);
  meter.scale.set(2.6,0.65,1); meter.position.set(0,3.2,1.2); G.add(meter); let lastZ=-9;
  const drawMeter=z=>{ const c=mc.getContext('2d'), f=Math.max(0,Math.min(1,z/100)); c.clearRect(0,0,128,32); c.fillStyle='rgba(10,10,14,.75)'; c.fillRect(2,6,124,20); c.fillStyle=K.setHSL((1-f)*0.45,0.85,0.5).getStyle(); c.fillRect(5,9,118*f,14);
    c.strokeStyle='#d8d4c8'; c.lineWidth=2; c.strokeRect(2,6,124,20); c.fillStyle='#fff'; c.font='bold 12px sans-serif'; c.textAlign='center'; c.fillText('NOISE',64,20); mt.needsUpdate=true; };
  // the entry gate
  const Gn=X.at(en.x,en.z); Gn.rotation.y=Math.atan2(gd.x-en.x,gd.z-en.z); const post=caveMpRockC(0x74787c,0.25), cloth=(x,y,z,nx,ny,nz,c)=>{ c.set(0x3a2a48); if(y<2.12||y>2.6) c.set(0xc8a24a); };
  const gp=[caveMpPart(B(2.5,0.5,0.04),cloth,0,2.37,0)]; for(const s of [-1,1]) gp.push(caveMpPart(new THREE.CylinderGeometry(0.2,0.28,2.0,7),post,s*1.4,1.0,0), caveMpPart(new THREE.CylinderGeometry(0.34,0.24,0.2,7),post,s*1.4,2.1,0), caveMpPart(B(0.1,0.1,0.5),post,s*1.4,2.45,0.25), caveMpPart(caveMpRock(0.4,0.2,0.4,0.3,rd),post,s*1.9,0.15,0.4));
  Gn.add(X.mesh(gp)); const lamps=[-1,1].map(s=>{ const h=X.halo(0x66e0d0,1.8,0.6); h.position.set(s*1.4,2.3,0.55); Gn.add(h); const l=new THREE.Mesh(new THREE.OctahedronGeometry(0.11),X.sol(0xbaf8ee)); MP.geos.push(l.geometry); l.position.set(s*1.4,2.3,0.55); Gn.add(l); return h; });
  const gring=X.ring(0x66e0d0,0.9,0.2); gring.position.y=0.15; gring.scale.set(3.2,1,3.2); Gn.add(gring); const hint=X.text(3.6); hint.set('Silent chamber: walk slowly','#66e0d0'); hint.s.position.y=3.0; Gn.add(hint.s);
  // the shrine
  const Gs=X.at(sh.x,sh.z), sp=[caveMpPart(B(1.3,0.2,1.3),post,0,0.1,0), caveMpPart(B(0.6,2.0,0.34),(x,y,z,nx,ny,nz,c)=>{ c.set(0x8a8f94).multiplyScalar(0.65+0.35*(ny*0.5+0.5)); if(nz>0.6&&Math.abs(y-1.2)<0.5&&Math.abs(Math.sin(y*20))<0.35) c.set(X.accent).multiplyScalar(0.8); },0,1.2,0), caveMpPart(new THREE.ConeGeometry(0.42,0.42,4).rotateY(Math.PI/4),post,0,2.4,0,{sz:0.6})];
  Gs.add(X.mesh(sp)); const gem=new THREE.Mesh(new THREE.OctahedronGeometry(0.24),X.sol(X.accent)); MP.geos.push(gem.geometry); gem.scale.y=1.4; gem.position.y=2.95; Gs.add(gem);
  const sHalo=X.halo(X.accent,3.2,0.4), sBeam=X.beam(X.accent,6.5,0.35,0.15), sRing=X.ring(X.accent,0.9,0.3); sHalo.position.y=2.9; sRing.position.y=0.17; sRing.scale.set(1.4,1,1.4); Gs.add(sHalo,sBeam,sRing);
  let wasWoke=false, dust=0;
  X.add((s,dt,tt)=>{
    const run=!!s.e.s, z=Math.max(0,Math.min(100,s.e.z|0)), f=z/100, woke=!!s.e.w, open=woke?1:run?Math.min(1,0.15+f):0.0;
    for(const e of eyes) e.scale.set(0.15,0.02+0.17*open,0.1); eh.material.opacity=0.75*open*(woke?1:0.7+0.3*Math.sin(tt*(2+f*8))); G.children[0].scale.y=1+0.03*Math.sin(tt*(1.2+f*5))*(1+f*3);
    ring.visible=run; ring.material.color.setHSL((1-f)*0.45,0.8,0.55); ring.material.opacity=0.12+0.5*f+(f>0.5?0.15*Math.sin(tt*(4+f*10)):0); meter.visible=run; if(run&&Math.abs(z-lastZ)>=2){ lastZ=z; drawMeter(z); }
    if(woke&&!wasWoke&&X.fx&&X.near(G,50)){ fxpFlare(G.position.x,G.position.y+1,G.position.z,0xff3a2a,5); fxpRingSparks(G.position.x,G.position.y+0.2,G.position.z,4,0xff5a3a,18,0.6); } wasWoke=woke;
    const lc=woke?0xff4a3a:run?0xffc060:0x66e0d0; for(const h of lamps){ h.material.color.setHex(lc); h.material.opacity=0.5+0.15*Math.sin(tt*2+h.position.x); } gring.visible=!run; gring.material.opacity=0.15+0.12*Math.sin(tt*2.2); hint.s.visible=!run&&X.near(Gn,22);
    gem.rotation.y+=dt*2; gem.position.y=2.95+0.08*Math.sin(tt*2); sHalo.material.opacity=run?0.8:0.3; sBeam.material.opacity=run?0.5:0.14; sRing.material.opacity=run?0.4+0.25*Math.sin(tt*4):0.15;
    if(run&&X.fx&&X.near(Gs,24)){ dust+=dt; if(dust>0.3){ dust=0; fxpAdd(Gs.position.x+AR(-0.5,0.5),Gs.position.y+AR(0.2,2.5),Gs.position.z+AR(-0.5,0.5),0,AR(0.3,0.8),0,X.accent,0.14,AR(0.8,1.3),{white:0.5,grow:0.2,a:0.9}); } } });
}
function caveMpF(X){
  const MP=CAVE_MP, sl=X.A.F.seal, v=X.A.F.vault, rd=X.rd, B=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
  const Gs=X.at(sl.x,sl.z), blk=new THREE.Group(); Gs.add(blk);
  const jam=[];
  for(let i=0;i<7;i++){ const a=i/7*Math.PI*2+0.3, r1=0.85+0.1*(i%2), s=1.0+0.1*(i%3); jam.push(caveMpPart(caveMpRock(s,0.95,s*0.95,0.45,rd),caveMpRockC(i%2?0x6d6a62:0x59574f,0.35),Math.cos(a)*r1,0.62+(i%2)*0.35,Math.sin(a)*r1)); }
  for(let i=0;i<4;i++){ const a=i/4*Math.PI*2+0.9; jam.push(caveMpPart(caveMpRock(0.85,0.8,0.85,0.45,rd),caveMpRockC(0x625f57,0.35),Math.cos(a)*0.4,1.45+(i%2)*0.2,Math.sin(a)*0.4)); }
  blk.add(X.mesh(jam));
  const cr=[]; for(let i=0;i<6;i++){ const a=i/6*Math.PI*2+0.2, r1=0.95; cr.push(paint(new THREE.BoxGeometry(0.06,0.5+0.3*(i%3),0.06).translate(Math.cos(a)*r1,0.9+(i%2)*0.3,Math.sin(a)*r1).rotateY(a),(x,y,z,nx,ny,nz,c)=>c.set(0xff7a30))); }
  const cracks=X.glow(cr,0.0); blk.add(cracks);
  const rub=[]; for(let i=0;i<7;i++){ const a=i*1.1, r1=1.8+0.5*(i%3); rub.push(caveMpPart(caveMpRock(0.3,0.16,0.26,0.5,rd),caveMpRockC(0x5d5a52,0.3),Math.cos(a)*r1,0.1,Math.sin(a)*r1)); } Gs.add(X.mesh(rub));
  const wt=X.text(3.2); wt.set('Tremor soon','#ff9a4a'); wt.s.position.y=3.6; Gs.add(wt.s);
  // the vault chest
  const Gv=X.at(v.x,v.z), wood=(x,y,z,nx,ny,nz,c)=>{ c.set(Math.abs(Math.sin(y*30))<0.12?0x4a3018:0x7a5428).multiplyScalar(0.65+0.35*(ny*0.5+0.5)); if(Math.abs(Math.abs(x)-0.38)<0.06) c.set(0x3a3c40); }, gold=caveMpRockC(0xd9a840,0.15);
  const cp=[caveMpPart(new THREE.CylinderGeometry(1.5,1.6,0.16,16),caveMpRockC(0x5c5a54,0.25),0,0.08,0), caveMpPart(B(1.15,0.55,0.75),wood,0,0.44,0), caveMpPart(B(0.18,0.22,0.06),gold,0,0.55,0.4)];
  for(let k=0;k<12;k++){ const a=k/12*Math.PI*2; cp.push(caveMpPart(B(0.12,0.03,0.22),gold,Math.sin(a)*1.25,0.17,Math.cos(a)*1.25,{ry:a})); }
  Gv.add(X.mesh(cp));
  const lidG=new THREE.CylinderGeometry(0.375,0.375,1.15,10,1,false,0,Math.PI).rotateZ(Math.PI/2).translate(0,0,0.375), lidM=X.mesh([caveMpPart(lidG,wood,0,0,0)],caveMpDouble()), pivot=new THREE.Group();
  pivot.position.set(0,0.72,-0.375); pivot.add(lidM); Gv.add(pivot);
  const coins=[]; for(let k=0;k<9;k++) coins.push(caveMpPart(new THREE.CylinderGeometry(0.1,0.1,0.04,8),gold,(h3(k,1,1)-0.5)*0.7,0.74+h3(k,2,2)*0.05,(h3(k,3,3)-0.5)*0.4,{rz:(h3(k,4,4)-0.5)*0.5}));
  const hoard=X.mesh(coins); Gv.add(hoard);
  const vh=X.halo(0xffc860,4.5,0.0), vb=X.beam(0xffd27a,6,0.5,0.0), vr=X.ring(0xffd27a,0.85,0.0), vt=X.text(3.0); vh.position.y=1.0; vr.position.y=0.2; vr.scale.set(2.2,1,2.2); vt.set('Vault open','#ffd27a'); vt.s.position.y=3.3; Gv.add(vh,vb,vr,vt.s);
  let wasOpen=false, ds=0, lastW=-1, lastO=-1, k=0;
  X.add((s,dt,tt)=>{
    const o=s.fv.o|0, w=s.fv.w|0, open=o>0, warn=!open&&w>0;
    if(open!==wasOpen){ if(X.fx&&X.near(Gv,60)){ if(open){ fxpSparks(Gv.position.x,Gv.position.y+0.9,Gv.position.z,0xffd27a,20,4,{up:2.5,size:0.22}); fxpFlare(Gv.position.x,Gv.position.y+1,Gv.position.z,0xffd27a,4); } else fxpSmoke(Gs.position.x,Gs.position.y+1,Gs.position.z,0,0.4,0,0x7a766c,2.4,1.6,{grow:2.5,a:0.5}); } wasOpen=open; }
    blk.visible=!open; if(!open){ const q=warn?(w<=8?0.045:0.015):0; blk.position.set(q*Math.sin(tt*53),0,q*Math.cos(tt*47)); cracks.material.opacity=warn?0.45+0.4*Math.sin(tt*(3+Math.max(0,20-w)*0.5))+(w<=8?0.2:0):0; cracks.visible=warn; }
    wt.s.visible=warn&&X.near(Gs,60); if(warn&&lastW!==w){ lastW=w; wt.set('Tremor in '+w+' s','#ff9a4a'); }
    if(warn&&X.fx&&X.near(Gs,40)){ ds+=dt; if(ds>0.28){ ds=0; fxpSmoke(Gs.position.x+AR(-1,1),Gs.position.y+3.0,Gs.position.z+AR(-1,1),0,-0.5,0,0x7a766c,0.7,AR(1,1.6),{grow:1.6,a:0.35}); fxpAdd(Gs.position.x+AR(-1,1),Gs.position.y+3.2,Gs.position.z+AR(-1,1),0,0,0,0x9a968a,0.1,0.8,{g:9,a:0.9}); } }
    k+=((open?1:0)-k)*Math.min(1,dt*4); pivot.rotation.x=-1.15*k; hoard.visible=k>0.2;
    vh.material.opacity=open?0.6+0.2*Math.sin(tt*4):0.1+0.04*Math.sin(tt*2); vh.scale.setScalar(open?5:2.4); vb.visible=open; vb.material.opacity=0.5+0.15*Math.sin(tt*4); vr.visible=open; vr.material.opacity=0.3+0.25*Math.sin(tt*3);
    vt.s.visible=open&&X.near(Gv,60); if(open&&lastO!==o){ lastO=o; vt.set('Vault open: '+o+' s','#ffd27a'); }
    if(open&&X.fx&&X.near(Gv,30)){ ds+=dt; if(ds>0.2){ ds=0; fxpAdd(Gv.position.x+AR(-0.5,0.5),Gv.position.y+0.9,Gv.position.z+AR(-0.5,0.5),0,AR(0.6,1.4),0,0xffd27a,0.14,AR(0.7,1.2),{white:0.4,grow:0.2,a:0.9}); } } });
}
function caveMpDouble(){ const m=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}); CAVE_MP.mats.push(m); return m; }
