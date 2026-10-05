//@ The Greyspine's buildings and dressing: its water (tarns, the river, the cold fjord), the rock falls in the west wall (the gates), Highmark (stone houses under slate and snow, bell tower, mine headframe, the Lodge yard) and the ice fall across the glacier valley (the gate, opened when Ymrik falls)
/* The ice fall is the glacier's own: a heap of broken blue blocks wedged across the cut GLEN (shared/greyspine.js) with dark shapes frozen in it, like the
   ice wall in Frostgate Pass (buildings-hoar.js, whose material and helpers it borrows). It stays until GEAR.west >= 1, then it sinks with a rumble.
   player/movement.js (glenWall) and server/api.js (setPos) stop you at it. */
const GREY={fall:null,opening:0,open:false,fjord:null,falls:{}};
const gateOpen=G=>!!(GEAR&&GEAR[G.id]>=1);
function buildGreyspine(){
  buildGreyWater(); buildRockFalls(); buildHighmark(); buildIceFall(); buildQueenNest(ARENA29); buildGolemCavern(ARENA32);
}
/* Water at altitude (shared/greyspine.js): the sea's one plane lies at y = 0, so each tarn gets a disc at its own level, the river a ribbon a hand above its bed
   (wider than the channel: the banks hide its edges), and the fjord (sea level, in a gorge) a darker, colder surface laid just over the sea's. All use the sea's
   water material (waves, day and night tint). */
function buildGreyWater(){
  for(const T of GREY_TARNS){ const m=new THREE.Mesh(new THREE.CircleGeometry(T.r*1.25,32).rotateX(-Math.PI/2),waterMat); m.position.set(T.x,T.l,T.z); m.receiveShadow=true; scene.add(m); }
  { const R=GREY_RIVER, pos=[], idx=[];
    for(let i=0;i<R.length;i++){ const a=R[Math.max(0,i-1)], b=R[Math.min(R.length-1,i+1)], vx=b[0]-a[0], vz=b[1]-a[1], l=Math.hypot(vx,vz)||1, nx=-vz/l, nz=vx/l, y=R[i][2]+0.65;
      pos.push(R[i][0]+nx*4.6,y,R[i][1]+nz*4.6,R[i][0]-nx*4.6,y,R[i][1]-nz*4.6); if(i>0){ const k=i*2; idx.push(k-2,k,k-1,k-1,k,k+1); } }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals();
    const m=new THREE.Mesh(g,waterMat); m.receiveShadow=true; scene.add(m); }
  GREY.fjord=new THREE.MeshPhongMaterial({color:0x14303a,transparent:true,opacity:0.94,shininess:140,specular:0x8fa4b4});
  GREY.fjord.onBeforeCompile=waterMat.onBeforeCompile; GREY.fjord.customProgramCacheKey=()=>'water2';
  const fq=new THREE.Mesh(new THREE.PlaneGeometry(230,170).rotateX(-Math.PI/2).translate(WX0+100,0.06,-505),GREY.fjord); fq.receiveShadow=true; scene.add(fq);
}
/* Highmark follows the home village's plan (VIL4 from shared/highmark.js: the same houses, stalls, anchors and colliders): grey stone walls with a timber
   frame, steep slate roofs under snow, iron lanterns, and the two things only a mining monastery has: a bell tower behind the plaza and the mine's wooden
   headframe at the North Fork side, with ore cars on a short track. */
function buildHighmark(){
  const out=[], win=[], V=VIL4, Y=V.h;
  const inF=F=>({A:(g,fn)=>out.push(pc(g,fn).applyMatrix4(F)), N:(g,fn)=>out.push(paint(g,fn).applyMatrix4(F)), W:(g,col)=>win.push(pc(g,c=>c.set(col||0xf6d890)).applyMatrix4(F))});
  const dark=woodC(0x2a2018), timber=woodC(0x5a4430), pale=woodC(0x8a7250), iron=c=>c.set(0x3a3c42);
  const blocks=base=>(x,y,z,c)=>{ const b=Math.floor(y*2.2), k=Math.floor((x+z)*1.6+(b&1)*0.5); c.set(base).multiplyScalar(0.8+h3(k,b,3)*0.28+((b&1)?0.05:0)); };
  const slate=[0x4a5058,0x434a52,0x50555c,0x464c54,0x4c5258];
  for(const H of V.houses){
    const F=frameM(H.x,Y,H.z,H.rot), {A,N,W}=inF(F), {w,d,wh}=H, base=0.5, rh=Math.max(2.2,w*0.5)+(H.tavern?0.8:0);
    A(vbox(w+0.5,1.0,d+0.5,0,base-0.5,0),stoneC); A(vbox(w+0.56,0.14,d+0.56,0,base+0.02,0),snowC);
    A(vbox(w,wh,d,0,base+wh/2,0),blocks(0x8a8a86));
    for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.34,wh+0.12,0.34,sx*w/2,base+wh/2,sz*d/2),timber);   // timber corner posts
    A(vbox(w+0.1,0.22,d+0.1,0,base+wh-0.1,0),timber);   // a wall plate under the eaves
    const a=Math.atan2(rh,w/2), len=Math.hypot(w/2,rh)+0.6, rd=d+1.1, th=0.3;
    for(const sd of [-1,1]){
      const g=new THREE.BoxGeometry(len,th,rd,6,1,1); g.rotateZ(-sd*a);
      g.translate(sd*(w/4+Math.cos(a)*0.3+Math.sin(a)*th/2), base+wh+rh/2-Math.sin(a)*0.3+Math.cos(a)*th/2, 0);
      N(g,snowOn(slate[H.i%5]));
    }
    A(prism(w,rh,d).translate(0,base+wh,0),blocks(0x7a7a76));   // the gable ends in stone
    A(vbox(0.26,0.26,rd+0.1,0,base+wh+rh+0.12,0),dark);
    A(vbox(1.2,2.1,0.12,0,base+1.05,-d/2-0.04),woodC(0x3a2a1c)); A(vbox(1.5,0.2,0.18,0,base+2.2,-d/2-0.05),dark);   // the door
    A(vbox(1.9,0.3,0.8,0,0.15,-d/2-0.5),stoneC); A(vbox(1.95,0.1,0.85,0,0.34,-d/2-0.5),snowC);
    const shutters=(px,py,pz,ry)=>{ const M=new THREE.Matrix4().makeRotationY(ry).setPosition(px,py,pz);
      W(vbox(0.6,0.5,0.06).applyMatrix4(M)); for(const sd of [-1,1]) A(vbox(0.28,0.56,0.05,sd*0.44,0,-0.02).applyMatrix4(M),woodC(H.accent)); };
    const wy=base+wh*0.6; shutters(w*0.3,wy,-d/2-0.05,0); shutters(-w/2-0.05,wy,0,Math.PI/2); shutters(w/2+0.05,wy,0,-Math.PI/2); shutters(0,wy,d/2+0.05,Math.PI);
    if(H.chimney){ A(vbox(0.85,rh+1.3,0.85,w*0.26,base+wh+(rh+1.3)/2-0.3,d*0.12),stoneC); A(vbox(1.0,0.16,1.0,w*0.26,base+wh+rh+1.05,d*0.12),snowC); }
    if(H.tavern){   // the miners' hall: banners in the abbey's green and gold over the door
      for(let k=0;k<3;k++) A(vbox(0.6,1.5,0.04,-w/3+k*w/3,base+2.9,-d/2-0.12),c=>c.set([0x2f5a3a,0xc9a13a,0x2f5a3a][k]));
    }
    if(H.woodpile){ for(let r=0;r<3;r++) for(let k=0;k<4-r;k++) A(cyl(0.16,0.16,1.2,7).rotateZ(Math.PI/2).translate(w/2+0.9,0.2+r*0.3,-d*0.2+k*0.34+r*0.17),woodC(0x8a6a44)); A(vbox(1.3,0.12,1.8,w/2+0.9,0.92,-d*0.02),snowC); }
    if(H.i%3===0){   // a miner's barrow of black stone beside the door
      A(vbox(0.9,0.4,0.6,-w/2-1.1,0.5,0.4),timber); for(let j=0;j<6;j++) A(new THREE.DodecahedronGeometry(0.15,0).translate(-w/2-1.3+(j%3)*0.22,0.82+(j>2?0.1:0),0.3+(j%2)*0.2),c=>c.set(0x1c1c22));
      A(cyl(0.18,0.18,0.1,8).rotateZ(Math.PI/2).translate(-w/2-1.1,0.2,0.75),iron);
    }
  }
  { const {A,N}=inF(frameM(V.x,Y,V.z,V.ent));   // the well: a stone ring, a slate roof on two posts
    A(new THREE.CylinderGeometry(1.1,1.2,0.8,16).translate(0,0.4,0),(x,y,z,c)=>{ if(y>0.78&&Math.hypot(x,z)<0.95) c.set(0x7ab0c8); else stoneC(x,y,z,c); });
    A(new THREE.CylinderGeometry(1.14,1.14,0.08,16).translate(0,0.82,0),(x,y,z,c)=>{ if(Math.hypot(x,z)>0.96) c.set(0xf0f5f8); else c.set(0x7ab0c8); });
    for(const sd of [-1,1]) A(vbox(0.16,2.3,0.16,sd*0.95,1.15,0),dark);
    A(cyl(0.06,0.06,2.1,8).rotateZ(Math.PI/2).translate(0,1.75,0),pale); N(vbox(2.8,0.22,1.9,0,2.4,0),snowOn(0x4a5058)); }
  const trim=[0x2f5a3a,0x8a6a2a,0x4a5a6a];
  for(const st of V.stalls){   // stalls: a counter, a slanted snow roof, wares in each stall's own way
    const {A,N}=inF(frameM(st.x,Y,st.z,st.rot));
    A(vbox(2.6,0.9,1.1,0,0.45,0),timber); A(vbox(2.7,0.08,1.2,0,0.94,0),snowC);
    for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.13,2.6,0.13,sx*1.25,1.3,sz*0.5),dark);
    N(new THREE.BoxGeometry(3.4,0.26,2.1).rotateX(0.1).translate(0,2.65,0),snowOn(0x434a52));
    for(let k=0;k<5;k++) A(vbox(0.5,0.5,0.02,-1.0+k*0.5,2.2,-0.6),(x,y,z,c)=>{ c.set(trim[st.i]); if(y<2.0) c.multiplyScalar(0.85); });
    if(st.i===0){ for(let k=0;k<3;k++){ A(cyl(0.025,0.025,1.0,5).translate(0,0.5,0).rotateZ(0.2).translate(-0.9+k*0.3,0.94,-0.25),woodC(0x6a4630)); A(vbox(0.26,0.2,0.04,-0.92+k*0.3+0.1,1.86,-0.25),c=>c.set(0xc0c8ce)); } }   // picks and axes
    else if(st.i===1){ for(let k=0;k<4;k++) A(vbox(0.42,0.9,0.05,-1.0+k*0.6,1.9,0.5),(x,y,z,c)=>{ c.set([0xb8b4aa,0x8a929a,0xc8c4ba,0x7a828a][k]).multiplyScalar(0.85+h3(Math.floor(x*9),Math.floor(y*9),k)*0.2); }); }   // mail and plate
    else { const ir=c=>c.set(0x3a3c40); A(vbox(0.34,0.4,0.3,1.95,0.2,0.55),timber); A(vbox(0.56,0.16,0.26,1.95,0.62,0.55),ir); A(cyl(0.34,0.24,0.5,10).translate(-1.95,0.25,0.5),ir);
      for(let j=0;j<7;j++) A(new THREE.DodecahedronGeometry(0.07,0).translate(-1.95+Math.sin(j*2.4)*0.18,0.54,0.5+Math.cos(j*2.4)*0.18),c=>c.set(0xff6a1a));
      for(let k=0;k<4;k++) A(new THREE.OctahedronGeometry(0.09,0).translate(-0.75+k*0.5,1.02,-0.1),c=>c.set([0x5b9cf0,0xb77cf5,0xf0cd45,0x62d66e][k]));
      const p=new THREE.Vector3(-1.95,0.62,0.5).applyAxisAngle(new THREE.Vector3(0,1,0),st.rot);
      const m=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.45,7),flameMats[1]); m.position.set(st.x+p.x,Y+p.y,st.z+p.z); scene.add(m); flames.push(m); }
  }
  { const B=V.board, {A,N}=inF(frameM(B.x,Y,B.z,B.rot));   // the quest board: stone posts, a slate cap
    for(const sx of [-1,1]){ A(vbox(0.34,3.5,0.34,sx*1.9,1.75,0),stoneC); A(vbox(0.55,0.3,0.55,sx*1.9,0.1,0),stoneC); A(new THREE.ConeGeometry(0.2,0.5,4).translate(sx*1.9,3.7,0),woodC(0x2f5a3a)); }
    A(vbox(3.6,2.0,0.1,0,1.95,0),(x,y,z,c)=>c.set(0x6a4a30).multiplyScalar(0.85+h3(x,y,z)*0.08));
    A(vbox(4.2,0.16,0.22,0,3.0,0),dark); A(vbox(4.4,0.14,0.26,0,0.9,0),dark); N(vbox(4.7,0.28,1.1,0,3.3,0),snowOn(0x434a52));
    [[-1.2,2.4],[-0.4,2.45],[0.45,2.4],[1.25,2.45],[-1.25,1.5],[-0.45,1.55],[0.4,1.5],[1.2,1.55]].forEach(([x,y],i)=>A(new THREE.BoxGeometry(0.56,0.7,0.012).rotateZ((h3(i,3,7)-0.5)*0.2).translate(x,y,0.062),c=>c.set([0xf2ead6,0xe6d6b0,0xefe4c8][i%3])));
    questSign(B,Y,{bg:'#2a2e34',line:'#c8b070',ink:'#fff4d8',font:60,w:2.2,h:0.48,y:3.02,z:0.13,glow:0x0c0e12}); }
  { const fp=V.fire, {A}=inF(frameM(fp.x,Y,fp.z,0));   // the great fire
    A(cyl(0.9,1.05,0.35,9).translate(0,0.17,0),stoneC); A(cyl(0.68,0.68,0.05,9).translate(0,0.36,0),c=>c.set(0x2a2220));
    for(let k=0;k<4;k++) A(cyl(0.09,0.09,1.1,6).rotateZ(Math.PI/2).rotateY(k*0.8).translate(0,0.44,0),woodC(0x3a2a1c));
    for(let k=0;k<4;k++){ const m=new THREE.Mesh(new THREE.ConeGeometry(k===0?0.34:0.2,k===0?1.1:0.7,7),flameMats[k===0?0:1]); m.position.set(fp.x+(k?Math.sin(k*2.1)*0.2:0),Y+0.85,fp.z+(k?Math.cos(k*2.1)*0.2:0)); scene.add(m); flames.push(m); } }
  for(const b of V.benches){ const {A}=inF(frameM(b.x,Y,b.z,b.rot)); A(cyl(0.22,0.22,1.9,8).rotateZ(Math.PI/2).translate(0,0.36,0),woodC(0x6a4630)); A(vbox(1.9,0.05,0.34,0,0.6,0),c=>c.set(0xe8eef2)); }
  for(const l of V.lamps){ const {A}=inF(frameM(l.x,Y,l.z,l.rot)); A(cyl(0.06,0.08,1.9,6).translate(0,0.95,0),iron); A(vbox(0.34,0.46,0.34,0,2.05,0),iron);   // iron lantern posts
    const m=new THREE.Mesh(new THREE.ConeGeometry(0.13,0.38,7),flameMats[1]); m.position.set(l.x,Y+2.05,l.z); scene.add(m); flames.push(m); }
  for(const [x,z] of V.barrels){ const {A}=inF(frameM(x,Y,z,0)); A(cyl(0.36,0.36,0.8,12).translate(0,0.4,0),(px,py,pz,c)=>{ c.set(0x8a6a44).multiplyScalar(0.9+h3(Math.floor(Math.atan2(pz,px)*6),0,0)*0.15); if(Math.abs(py-0.25)<0.05||Math.abs(py-0.6)<0.05) c.set(0x2e2a28); }); A(cyl(0.34,0.34,0.06,12).translate(0,0.82,0),snowC); }
  for(const [x,z,r] of V.crates){ const {A}=inF(frameM(x,Y,z,r)); A(vbox(0.7,0.6,0.7,0,0.3,0),woodC(0x8a6a44)); A(vbox(0.72,0.08,0.72,0,0.64,0),snowC); }
  { const G=V.garden, {A,N}=inF(frameM(G.x,Y,G.z,G.rot));   // the Wayfarers' Lodge yard: a plank floor, a tool rack, chopping block, herb rack, a barrow of black stone
    A(vbox(5.8,0.1,4.2,0,0.05,0),(x,y,z,c)=>{ c.set(0x6a4a30).multiplyScalar(0.85+0.12*(Math.floor(x*2.2)&1)); });
    for(const sx of [-1,1]) A(vbox(0.14,2.3,0.14,sx*1.4,1.15,1.7),dark); A(vbox(3.1,0.12,0.14,0,2.3,1.7),dark);
    for(let k=0;k<4;k++){ const px=-1.05+k*0.7; A(cyl(0.025,0.025,1.1,5).translate(px,1.6,1.62),woodC(0x6a4630)); A(vbox(0.55,0.06,0.06,px,2.12,1.62),c=>c.set(0xc0c8ce)); A(new THREE.ConeGeometry(0.05,0.18,4).rotateZ(Math.PI/2).translate(px+0.3,2.12,1.62),c=>c.set(0xc0c8ce)); }
    A(cyl(0.42,0.46,0.5,10).translate(-2.0,0.35,-0.7),woodC(0x8a6a44)); A(vbox(0.06,0.7,0.06,-1.9,0.85,-0.7).rotateZ(0.5),woodC(0x6a4630)); A(vbox(0.34,0.24,0.05,-1.62,1.05,-0.7).rotateZ(0.5),c=>c.set(0xc0c8ce));
    for(let r=0;r<3;r++) for(let k=0;k<3-r;k++) A(cyl(0.17,0.17,1.3,7).rotateZ(Math.PI/2).translate(-2.0,0.2+r*0.3,0.3+k*0.36+r*0.18),woodC(0x8a6a44));
    for(const sx of [-1,1]) A(vbox(0.1,1.7,0.1,1.6+sx*0.9,0.85,-1.2),dark); A(vbox(1.9,0.08,0.08,1.6,1.7,-1.2),dark);
    for(let k=0;k<5;k++) A(new THREE.ConeGeometry(0.12,0.5,5).rotateX(Math.PI).translate(1.0+k*0.3,1.4,-1.2),c=>c.set([0x7aa04a,0x9ac06a,0xc8c4e0,0x7aa04a,0x5a8a5a][k]));
    A(vbox(1.0,0.5,0.7,1.8,0.45,0.6),woodC(0x5a3c26)); for(let j=0;j<5;j++) A(new THREE.DodecahedronGeometry(0.15,0).translate(1.6+Math.sin(j*2.1)*0.25,0.82+0.05*j%2,0.6+Math.cos(j*2.1)*0.15),c=>c.set(0x1c1c22));
    A(cyl(0.14,0.14,0.5,8).rotateZ(Math.PI/2).translate(1.2,0.3,0.6),c=>c.set(0x3a3c40));
    const sign=boardSign("WAYFARERS' LODGE",{bg:'#3a3028',line:'#e0c890',ink:'#fff2d8',font:46,w:2.6,h:0.57,glow:0x1a0e06});
    const sp=new THREE.Vector3(0,2.75,1.95).applyAxisAngle(new THREE.Vector3(0,1,0),G.rot); sign.position.set(G.x+sp.x,Y+sp.y,G.z+sp.z); sign.rotation.y=G.rot+Math.PI; scene.add(sign); }
  { const e=V.ent, p=[V.x+Math.sin(e)*(VR+9),V.z+Math.cos(e)*(VR+9)], {A,N,W}=inF(frameM(p[0],getH(p[0],p[1]),p[1],e));   // the gate: two stone piers, a timber beam, a hanging bell; cairns beside it
    for(const sx of [-1,1]){ A(vbox(0.9,5.2,0.9,sx*2.8,2.6,0),blocks(0x8a8a86)); A(vbox(1.1,0.3,1.1,sx*2.8,5.3,0),snowC); const c=Math.cos(e), s=Math.sin(e); V.circles.push([p[0]+sx*2.8*c,p[1]-sx*2.8*s,0.6]); }
    A(vbox(6.8,0.5,0.5,0,4.9,0),dark); N(vbox(6.9,0.26,0.7,0,5.22,0),snowOn(0x2a2018));
    A(new THREE.ConeGeometry(0.3,0.6,10).rotateX(Math.PI).translate(0,4.3,0),c=>c.set(0xb08a3a)); A(cyl(0.02,0.02,0.5,4).translate(0,4.7,0),iron);   // the bell
    for(const sd of [-1,1]){ const [rx,rz]=[sd*4.8,-0.6]; for(let k=0;k<4;k++) A(new THREE.DodecahedronGeometry(0.5-k*0.08,0).translate(rx,0.35+k*0.6,rz),stoneC); V.circles.push([p[0]+rx*Math.cos(e)+rz*Math.sin(e),p[1]-rx*Math.sin(e)+rz*Math.cos(e),0.6]); } }
  { const S=V.sign, {A,N}=inF(frameM(S.x,Y,S.z,S.rot)); A(vbox(0.16,2.3,0.16,0,1.15,0),dark); A(vbox(0.55,1.3,0.08,0,1.55,0.08),woodC(0x8a6a44)); N(vbox(0.8,0.14,0.36,0,2.25,0.04),snowOn(0x434a52)); }
  // the abbey's bell tower, behind the tavern outside the ring of houses: a square stone tower with a slate spire and a belfry
  { const a=V.ent+Math.PI-0.6, tx=V.x+Math.sin(a)*33, tz=V.z+Math.cos(a)*33, {A,N,W}=inF(frameM(tx,getH(tx,tz),tz,a));
    A(vbox(4.6,1.0,4.6,0,0.5,0),stoneC); A(vbox(3.8,9.5,3.8,0,5.7,0),blocks(0x8a8a86)); A(vbox(4.2,0.4,4.2,0,10.6,0),timber);
    for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.4,2.6,0.4,sx*1.6,12.0,sz*1.6),timber);
    A(vbox(3.8,0.3,3.8,0,13.4,0),timber); A(cyl(0.5,0.62,1.0,10).translate(0,12.4,0),c=>c.set(0xb08a3a));   // the belfry and its bell
    N(new THREE.ConeGeometry(2.9,3.6,4).rotateY(Math.PI/4).translate(0,15.4,0),snowOn(0x434a52));
    for(const [wx,wz,ry] of [[0,-1.92,0],[0,1.92,Math.PI],[-1.92,0,Math.PI/2],[1.92,0,-Math.PI/2]]) W(vbox(0.5,1.4,0.06).rotateY(ry).translate(wx,7.6,wz),0xf6d890);
    addCol(tx,tz,2.6); }
  // the mine's headframe at the North Fork side: a wooden A-frame over the shaft with a wheel, ore cars on a short track and a heap of black stone
  { const a=Math.atan2(263-V.x,-771-V.z), hx=V.x+Math.sin(a)*35, hz=V.z+Math.cos(a)*35, {A,N}=inF(frameM(hx,getH(hx,hz),hz,a));
    for(const sx of [-1,1]){ A(vbox(0.4,9.0,0.4,sx*1.8,4.5,0).rotateZ(-sx*0.2).translate(sx*0.2,0,0),timber); A(vbox(0.3,0.3,3.6,sx*1.9,0.2,0),timber); }
    A(vbox(4.2,0.3,0.4,0,8.7,0),dark); A(cyl(1.0,1.0,0.25,14).rotateZ(Math.PI/2).translate(0,8.8,0),iron); A(vbox(0.1,5.0,0.1,0,5.8,0),iron);   // the wheel and the cable
    A(vbox(3.2,0.4,2.4,0,0.2,-2.6),stoneC); A(vbox(2.4,1.3,1.6,0,0.85,-4.4),woodC(0x4a3a2a)); N(vbox(2.8,0.2,2.0,0,1.6,-4.4),snowOn(0x2a2018));   // the shaft house
    for(const sz of [-1,1]) A(vbox(0.12,0.12,9,sz*0.5,0.12,2.0),iron);
    for(let k=0;k<2;k++){ A(vbox(1.0,0.7,1.5,0,0.65,2+k*2.4),woodC(0x5a4430)); for(let j=0;j<5;j++) A(new THREE.DodecahedronGeometry(0.22,0).translate((j%3-1)*0.28,1.15,2+k*2.4+(j>2?0.3:-0.2)),c=>c.set(0x1c1c22)); }
    for(let j=0;j<10;j++) A(new THREE.DodecahedronGeometry(0.45+h3(j,1,1)*0.5,0).translate(2.6+Math.sin(j*1.9)*1.0,0.35,-2.4+Math.cos(j*1.9)*1.3),c=>c.set(0x1a1a20));
    addCol(hx,hz,1.6); }
  { const items=[], hA=V.houses.map(h=>h.a);   // dark spruce behind the houses
    for(let i=0;i<7;i++){ const a=(hA[i]+hA[i+1])/2, r=31, x=V.x+Math.sin(a)*r, z=V.z+Math.cos(a)*r, sc=R(0.95,1.3);
      items.push({x,z,m:mtx(x,getH(x,z)-0.15,z,a,sc,sc,sc),c:tint(pick(PAL.spruce))}); addCol(x,z,RAD.spruce*sc); }
    addTreeKind('spruce',items); }
  addVillageMeshes(out,win);
  for(const c of V.circles) addCol(c[0],c[1],c[2]);
}
function buildIceFall(){
  const g=new THREE.Group(), ice=[], dk=[], x0=GLEN.ice, z0=GLEN.z, y0=getH(x0,z0);
  for(let k=-7;k<=7;k++){
    const h=12+h3(k,1,2)*9+(Math.abs(k)>5?8:0), w=2.7+h3(k,3,4)*1.3, px=x0+(h3(k,5,6)-0.5)*1.6, pz=z0+k*2.0+(h3(k,7,8)-0.5)*0.6;
    const b=new THREE.BoxGeometry(3.0+h3(k,9,1)*1.6,h,w,1,3,1), p=b.attributes.position;   // ragged tops
    for(let i=0;i<p.count;i++) if(p.getY(i)>h*0.4) p.setY(i,p.getY(i)+(h3(i,k,3)-0.5)*2.4);
    b.rotateY((h3(k,4,4)-0.5)*0.4); b.translate(px-x0,h/2-2,pz-z0); ice.push(b);
  }
  for(let k=0;k<8;k++){ const s=0.4+h3(k,2,2)*0.8; dk.push(new THREE.BoxGeometry(s*0.5,s*1.2,s*0.5).rotateZ((h3(k,6,1)-0.5)*1.6).translate((h3(k,3,3)-0.5)*1.2,3+h3(k,9,9)*8,(h3(k,8,8)-0.5)*16)); }
  const im=new THREE.Mesh(merge(ice.map(b=>paint(b,()=>_c.set(0xffffff)))),iceMat), dm=new THREE.Mesh(merge(dk.map(b=>paint(b,()=>_c.set(0x2a2228)))),new THREE.MeshLambertMaterial({vertexColors:true}));
  im.renderOrder=2; g.add(dm); g.add(im); g.position.set(x0,y0,z0); scene.add(g); GREY.fall=g;
}
/* ---- the Gryphon Queen's peak (ARENA29): her nest on the crown, a rim of woven branches and bleached bones round a bed of straw, three huge pale eggs,
   gold plumes stuck upright in the rim, a few perch stones ---- */
function buildQueenNest(A){
  const parts=[], wood=(x,y,z,c)=>{ c.set(0x6a5238).multiplyScalar(0.75+0.5*h3(Math.floor(x*4),Math.floor(y*4),Math.floor(z*4))); }, bone=c=>c.set(0xe8e0cc), gold=(x,y,z,c)=>{ c.set(0xe8b830).multiplyScalar(0.8+0.3*clamp(y*0.4)); };
  for(let k=0;k<44;k++){ const a=k/44*TAU+h3(k,1,1)*0.2, r=A.r-1.5+h3(k,2,2)*3.2, x=A.x+Math.sin(a)*r, z=A.z+Math.cos(a)*r, len=3+h3(k,3,3)*3.4, ty=Math.sin(a+1.4)*0.7;
    parts.push(pc(new THREE.CylinderGeometry(0.08,0.14,len,5).rotateZ(Math.PI/2).rotateY(a+Math.PI/2+(h3(k,4,4)-0.5)*0.9).rotateX((h3(k,5,5)-0.5)*0.3).translate(x,A.h+0.5+h3(k,6,6)*1.3+ty*0.2,z),k%5===0?bone:wood)); }
  for(let k=0;k<7;k++){ const a=k/7*TAU+0.3, r=A.r+0.8, x=A.x+Math.sin(a)*r, z=A.z+Math.cos(a)*r, hh=2.6+h3(k,7,7)*2.2; parts.push(pc(new THREE.ConeGeometry(0.2,hh,4).translate(x,A.h+hh/2,z),gold)); }   // plumes
  for(let k=0;k<3;k++){ const a=k*2.1, x=A.x+Math.sin(a)*3.2, z=A.z+Math.cos(a)*3.2; parts.push(pc(csph(1,12,9).scale(1.1,1.5,1.1).translate(x,A.h+0.9,z),(X,Y,Z,c)=>{ c.set(0xf0ead8).multiplyScalar(0.9+0.12*h3(Math.floor(X*6),Math.floor(Y*6),Math.floor(Z*6))); })); addCol(x,z,1.1); }   // eggs
  for(let k=0;k<4;k++){ const a=k/4*TAU+0.8, r=A.r+7+h3(k,8,8)*4, x=A.x+Math.sin(a)*r, z=A.z+Math.cos(a)*r, y=getH(x,z); parts.push(pc(new THREE.DodecahedronGeometry(1.5+h3(k,9,9),0).scale(1,1.4,0.9).translate(x,y+1,z),stoneC)); addCol(x,z,1.7); }
  const m=new THREE.Mesh(merge(parts),villageMat); m.castShadow=true; m.receiveShadow=true; scene.add(m);
}
/* ---- the mountain golem's cavern (ARENA32): a ring of boulders round the clearing, and on the far side from Highmark the cavern's mouth: two rough pillars with an
   old iron beam across them, rusty ribs, and a black opening (the machine's resting place) ---- */
function buildGolemCavern(A){
  const rockp=[], iron=[], a0=Math.atan2(A.x-VIL4.x,A.z-VIL4.z), irc=(x,y,z,c)=>{ c.set(0x8a7a66).multiplyScalar(0.7+0.4*vn3(x*14,y*14,z*14)); };
  for(let k=0;k<13;k++){ const a=k/13*TAU+0.2, x=A.x+Math.sin(a)*(A.r+1.8), z=A.z+Math.cos(a)*(A.r+1.8), s=1.2+h3(k,1,2)*1.4;
    rockp.push(pc(new THREE.DodecahedronGeometry(s,0).scale(1,0.9,1).translate(x,getH(x,z)+s*0.5,z),stoneC)); addCol(x,z,s*0.8); }
  const ax=A.x+Math.sin(a0)*(A.r+7), az=A.z+Math.cos(a0)*(A.r+7), ay=getH(ax,az)-0.3, F=new THREE.Matrix4().makeRotationY(a0+Math.PI).setPosition(ax,ay,az);
  for(const sx of [-1,1]){ rockp.push(pc(new THREE.CylinderGeometry(1.7,2.5,12,7,2).translate(sx*6.5,6,0).applyMatrix4(F),stoneC)); rockp.push(pc(new THREE.DodecahedronGeometry(2.2,0).translate(sx*6.5,12,0).applyMatrix4(F),stoneC)); addCol(...[ax+sx*6.5*Math.cos(a0+Math.PI),az-sx*6.5*Math.sin(a0+Math.PI)],2.8); }
  iron.push(pc(new THREE.BoxGeometry(15.5,1.3,1.8).translate(0,11.2,0).applyMatrix4(F),irc));
  for(let k=0;k<5;k++) iron.push(pc(new THREE.BoxGeometry(0.4,5.5,0.5).translate(-6+k*3,8.4,-0.2).applyMatrix4(F),irc));   // ribs hanging from the beam
  for(const sx of [-1,1]) iron.push(pc(new THREE.CylinderGeometry(0.5,0.5,11,8).translate(sx*4.5,5.5,-1.0).applyMatrix4(F),irc));   // rusty pipes
  const rm=new THREE.Mesh(merge(rockp),villageMat); rm.castShadow=true; rm.receiveShadow=true; scene.add(rm);
  const im=new THREE.Mesh(merge(iron),matRock); im.castShadow=true; scene.add(im);
  const hole=new THREE.Mesh(new THREE.CircleGeometry(4.6,20),new THREE.MeshBasicMaterial({color:0x050507})); hole.scale.y=1.25; hole.applyMatrix4(F); hole.position.x+=0; scene.add(hole);
  const q=new THREE.Vector3(0,5.2,0.3).applyMatrix4(F); hole.position.copy(q); hole.rotation.y=a0+Math.PI;
}
/* ---- the rock falls in the west wall (GREY_GATES): a heap of boulders wedged across each canyon, which slides away when its boss has fallen ---- */
function buildRockFalls(){
  for(const G of GREY_GATES){
    const g=new THREE.Group(), parts=[], y0=getH(G.x,G.z);
    for(let k=0;k<22;k++){ const s=1.6+h3(k,1,G.z)*2.6, a=(h3(k,2,G.z)-0.5)*2, tier=k<12?0:k<19?1:2, pz=a*(tier===0?13:tier===1?9:5), py=s*0.5+tier*2.6;
      parts.push(pc(new THREE.DodecahedronGeometry(s,0).scale(1,0.85,1).rotateY(k).translate((h3(k,3,G.z)-0.5)*3,py,pz),stoneC)); }
    for(let k=0;k<6;k++) parts.push(pc(new THREE.CylinderGeometry(0.2,0.3,4+h3(k,4,G.z)*3,5).rotateZ(1.1+h3(k,5,G.z)*0.8).translate((h3(k,6,G.z)-0.5)*3,3.4+h3(k,7,G.z)*3,(h3(k,8,G.z)-0.5)*14),woodC(0x5a4430)));   // snapped trunks
    const m=new THREE.Mesh(merge(parts),villageMat); m.castShadow=true; m.receiveShadow=true; g.add(m); g.position.set(G.x,y0,G.z); scene.add(g);
    for(let k=0;k<7;k++){ const px=G.x+(h3(k,9,G.z)-0.5)*3, pz=G.z+(k-3)*3.6; addCol(px,pz,2.4); }
    GREY.falls[G.id]={g,opening:0,open:false,y0};
  }
}
// the server tells you when a gate opens (the rock fall slides down with a rumble)
function onGateStep(id){
  const F=GREY.falls[id]; if(F&&!F.open){ F.opening=0.001; if(SND.ready) noiseHit({bus:'ui',filter:'lowpass',ff:130,dur:3.6,vol:0.42}); camShake=Math.max(camShake,0.6); }
}
// the server tells you when the ice fall opens (1: it sinks with a rumble) and when you reach Highmark (2)
function onWestStep(k){
  if(k===1&&GREY.fall&&!GREY.open){ GREY.opening=0.001; if(SND.ready) noiseHit({bus:'ui',filter:'lowpass',ff:150,dur:3.2,vol:0.4}); camShake=Math.max(camShake,0.6); }
  if(k>=2) UI_SFX.success();
}
function updateGreyspine(dt){
  if(GREY.fjord&&waterMat) GREY.fjord.color.copy(waterMat.color).multiplyScalar(0.5);   // (colder and darker than the sea at every hour)
  for(const G of GREY_GATES){ const F=GREY.falls[G.id]; if(!F) continue;
    if(!gateOpen(G)){ F.open=false; F.opening=0; F.g.visible=true; F.g.position.y=F.y0; }
    else if(F.opening>0){ F.opening=Math.min(1,F.opening+dt/3.6); F.g.position.y=F.y0-F.opening*16; F.g.rotation.z=Math.sin(F.opening*38)*0.006*(1-F.opening); if(F.opening>=1){ F.opening=0; F.open=true; F.g.visible=false; } }
    else if(!F.open){ F.open=true; F.g.visible=false; } }
  if(!GREY.fall) return;
  const open=westOpen(), W=GREY.fall, y0=getH(GLEN.ice,GLEN.z);
  if(!open){ GREY.open=false; GREY.opening=0; W.visible=true; W.position.y=y0; }
  else if(GREY.opening>0){ GREY.opening=Math.min(1,GREY.opening+dt/3.4); W.position.y=y0-GREY.opening*20; W.rotation.z=Math.sin(GREY.opening*40)*0.004*(1-GREY.opening); if(GREY.opening>=1){ GREY.opening=0; GREY.open=true; W.visible=false; } }
  else if(!GREY.open){ GREY.open=true; W.visible=false; }
}
