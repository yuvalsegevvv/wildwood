//@ The story's props: Wren's sickbed under its awning, Odran's two carts (shown while he is there), the readable lore spots (carved stones, signs, the drowned milestone, the grey wreck, a roadside shrine, a grey plate in the ice) and the heartleaf you pick
/* Places come from shared/main-quest.js (VIL.bed, V.cart, LORE, HERBS). The static props are one merged mesh; each cart is its own
   mesh (hidden unless Odran stands beside it: odranHere in game/economy/main-quest.js), the herbs glow while you are picking them. */
const LP={carts:[],herbs:[]};
function buildLoreProps(){
  const out=[], m=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(0,0,0,'YXZ'), v=new THREE.Vector3(), one=new THREE.Vector3(1,1,1);
  // a painted box / cylinder / any geometry placed in a frame (x, y, z, yaw) with a local offset and tilt
  const put=(list,g,col,x,y,z,yaw,pitch,roll)=>{ const p=paint(g,(px,py,pz,nx,ny,nz,c)=>c.set(col).multiplyScalar(0.86+h3(x+px*3,y+py*3,z+pz*3)*0.26));
    e.set(pitch||0,yaw||0,roll||0); q.setFromEuler(e); m.compose(v.set(x,y,z),q,one); p.applyMatrix4(m); list.push(p); };
  const local=(x,z,yaw)=>(lx,lz)=>[x+lx*Math.cos(yaw)+lz*Math.sin(yaw), z-lx*Math.sin(yaw)+lz*Math.cos(yaw)];
  const wood=0x6e4c2e, dark=0x4e3622, stone=0x8a847a, cloth=0xd8cfb8;
  /* Wren's sickbed: a low wooden bed with a straw mattress, a grey-blue blanket and a pillow, under a slanted awning of two posts */
  { const B=VIL.bed, Y=VIL.h, L=local(B.x,B.z,B.rot), yaw=B.rot;
    { const [x,z]=L(0,0); put(out,new THREE.BoxGeometry(2.1,0.18,1.0),wood,x,Y+0.38,z,yaw); }
    for(const sx of [-0.98,0.98]) for(const sz of [-0.44,0.44]){ const [x,z]=L(sx,sz); put(out,new THREE.BoxGeometry(0.1,0.45,0.1),dark,x,Y+0.22,z,yaw); }
    { const [x,z]=L(0.98,0); put(out,new THREE.BoxGeometry(0.1,0.8,1.0),wood,x,Y+0.45,z,yaw); }   // the headboard
    { const [x,z]=L(0,0); put(out,new THREE.BoxGeometry(1.95,0.12,0.9),0xc8b88a,x,Y+0.53,z,yaw); }
    { const [x,z]=L(-0.25,0); put(out,new THREE.BoxGeometry(1.35,0.08,0.95),0x5a6a82,x,Y+0.62,z,yaw); }
    { const [x,z]=L(0.72,0); put(out,new THREE.BoxGeometry(0.36,0.14,0.6),0xefe8da,x,Y+0.64,z,yaw); }
    // the awning: two posts out front, a cloth sloping back up to the wall
    for(const sx of [-1.35,1.35]){ const [x,z]=L(sx,-0.95); put(out,new THREE.BoxGeometry(0.12,2.1,0.12),dark,x,Y+1.05,z,yaw); }
    { const [x,z]=L(0,-0.2); put(out,new THREE.BoxGeometry(3.0,0.05,1.9),0x8a6a4a,x,Y+2.25,z,yaw,0.28); }
    { const [x,z]=L(-1.3,0.7); put(out,new THREE.BoxGeometry(0.4,0.5,0.4),wood,x,Y+0.25,z,yaw); const [x2,z2]=L(-1.3,0.7); put(out,cyl(0.08,0.06,0.16,8),0x7aa04a,x2,Y+0.58,z2,yaw); }   // a stool with a cup of heartleaf tea
  }
  /* the lore spots */
  for(const Lo of LORE){
    const x=Lo.x, z=Lo.z, y=Lo.kind==='mile'?WATER-1.4:getH(x,z)-0.15, yaw=Lo.rot, L=local(x,z,yaw);
    if(Lo.kind==='stone'){
      const g=new THREE.BoxGeometry(1.3,3.2,0.6,1,4,1); g.translate(0,1.6,0);
      out.push(paint(g,(px,py,pz,nx,ny,nz,c)=>{ c.set(Lo.id==='demongate'?0x4a4650:stone).multiplyScalar(0.8+h3(Math.floor(px*4),Math.floor(py*4),Math.floor(pz*4))*0.3); if(Math.abs(nz)>0.9&&py>0.9&&py<2.6&&h3(Math.floor(px*6),Math.floor(py*6),1)>0.55) c.multiplyScalar(0.55); }).applyMatrix4(m.compose(v.set(x,y,z),q.setFromEuler(e.set(0,yaw,0.03)),one)));
    } else if(Lo.kind==='sign'){
      put(out,new THREE.BoxGeometry(0.14,2.0,0.14),dark,x,y+1.0,z,yaw);
      put(out,new THREE.BoxGeometry(1.5,0.6,0.08),0x8a6a44,x,y+1.65,z,yaw);
      put(out,new THREE.BoxGeometry(1.2,0.06,0.09),0x2a1e14,x,y+1.72,z,yaw); put(out,new THREE.BoxGeometry(0.9,0.05,0.09),0x2a1e14,x,y+1.56,z,yaw);
    } else if(Lo.kind==='mile'){
      put(out,new THREE.BoxGeometry(0.55,2.6,0.4),0x9a948a,x,y+1.2,z,yaw,0.2,0.12);
      put(out,cyl(0.3,0.3,0.06,14),0x6a8a6a,x+Math.sin(yaw)*0.25,y+2.05,z+Math.cos(yaw)*0.25,yaw,Math.PI/2+0.2);   // the ring, grown with moss
    } else if(Lo.kind==='wreck'){
      put(out,new THREE.BoxGeometry(0.25,0.3,6.2),0x8a8a84,x,y+0.2,z,yaw,0,0.08);   // the keel
      for(let k=-2;k<=2;k++){ const [rx,rz]=L(0,k*1.2); for(const sd of [-1,1]) put(out,new THREE.BoxGeometry(0.14,1.5-Math.abs(k)*0.2,0.14),0x9a9a94,rx+Math.cos(yaw)*sd*0.8,y+0.7,rz-Math.sin(yaw)*sd*0.8,yaw,0,-sd*0.45); }
      { const [px,pz]=L(0.6,1.3); put(out,new THREE.BoxGeometry(1.6,0.08,0.3),0x7a7a74,px,y+0.12,pz,yaw+0.5); }
    } else if(Lo.kind==='shrine'){
      put(out,new THREE.BoxGeometry(0.16,1.1,0.16),dark,x,y+0.55,z,yaw);
      put(out,new THREE.BoxGeometry(0.7,0.55,0.55),0x8a3a2a,x,y+1.35,z,yaw);
      put(out,new THREE.ConeGeometry(0.62,0.4,4),0x3a3230,x,y+1.82,z,yaw+Math.PI/4);
      for(let k=0;k<5;k++){ const [px,pz]=L(-0.3+k*0.15,0.3); put(out,new THREE.BoxGeometry(0.08,0.22,0.02),0xf4f0e6,px,y+0.95-(k%2)*0.08,pz,yaw); }
    } else if(Lo.kind==='hull'){   // a slab of grey metal in the ice with the Concord's ring and sun (docs/STORY.md: the emblem, unexplained)
      put(out,new THREE.BoxGeometry(2.6,0.22,1.7),0x9aa2a8,x,y+0.85,z,yaw,0.55,0.12);
      for(let k=0;k<6;k++){ const [px,pz]=L(-0.9+k*0.36,0.05); put(out,new THREE.SphereGeometry(0.05,5,4),0x6a7076,px,y+0.95+k*0.09,pz,yaw); }
      put(out,new THREE.CylinderGeometry(0.34,0.34,0.02,14),0xd8b040,x+Math.sin(yaw)*0.05,y+1.02,z+Math.cos(yaw)*0.05,yaw,0.55+Math.PI/2,0.12);
      put(out,new THREE.IcosahedronGeometry(0.9,0).scale(1.4,0.6,1.1),0xe6eff4,x,y+0.15,z,yaw+0.4);
    }   // (the ice wall, the rune stones and the iron bird are dressed in game/village/buildings-hoar.js)
  }
  const mat=new THREE.MeshLambertMaterial({vertexColors:true});
  const mesh=new THREE.Mesh(merge(out),mat); mesh.castShadow=true; mesh.receiveShadow=true; mesh.matrixAutoUpdate=false; scene.add(mesh);
  for(const L of LORE) if(L.kind!=='mile'&&L.kind!=='ice'&&L.kind!=='runes'&&L.kind!=='ironbird') addCol(L.x,L.z,L.kind==='wreck'?1.2:L.kind==='hull'?1.3:0.6);
  /* Odran's carts: a covered wagon with two big wheels, crates and a lantern pole */
  for(const V of VILS){
    const C=V.cart, parts=[], y=getH(C.x,C.z), L=local(C.x,C.z,C.rot), yaw=C.rot;
    put(parts,new THREE.BoxGeometry(1.7,0.5,3.0),0x7a5634,C.x,y+0.95,C.z,yaw);
    for(const sd of [-1,1]) for(const fz of [-0.8,0.9]){ const [wx,wz]=L(sd*0.95,fz); put(parts,cyl(0.55,0.55,0.12,12),0x4e3622,wx,y+0.55,wz,yaw,0,Math.PI/2); }
    for(let k=0;k<5;k++){ const a=k/4*Math.PI; const [cx,cz]=L(Math.cos(a)*0.8,0); put(parts,new THREE.BoxGeometry(0.1,0.1,2.6),0x6a4a30,cx,y+1.2+Math.sin(a)*0.9,cz,yaw); }
    const cover=new THREE.CylinderGeometry(0.85,0.85,2.5,12,1,true,-Math.PI/2,Math.PI); cover.rotateX(-Math.PI/2);   // the upper half, along the wagon
    put(parts,cover,0x8a3a4a,C.x,y+1.2,C.z,yaw);
    { const [px,pz]=L(0,-1.9); put(parts,new THREE.BoxGeometry(0.08,0.08,1.6),dark,px,y+0.7,pz,yaw); }
    for(const [lx,lz,s] of [[1.6,0.4,0.6],[1.7,-0.5,0.5],[1.5,-0.1,0.4]]){ const [px,pz]=L(lx,lz); put(parts,new THREE.BoxGeometry(s,s,s),0x9a7a54,px,getH(px,pz)+s/2,pz,yaw+lx); }
    { const [px,pz]=L(-1.3,1.2); put(parts,new THREE.BoxGeometry(0.1,2.4,0.1),dark,px,y+1.2,pz,yaw); put(parts,new THREE.BoxGeometry(0.22,0.28,0.22),0xffd890,px,y+2.2,pz,yaw); }
    const cm=new THREE.Mesh(merge(parts),mat); cm.castShadow=true; cm.receiveShadow=true; cm.visible=false; scene.add(cm); LP.carts.push({V,mesh:cm});
  }
  /* heartleaf: a tuft of broad glowing leaves, one per HERBS spot */
  const herbMat=new THREE.MeshLambertMaterial({vertexColors:true,emissive:0x2a5a1a,emissiveIntensity:0.9});
  HERBS.forEach(([x,z],i)=>{
    const parts=[];
    for(let k=0;k<7;k++){ const a=k/7*TAU; put(parts,new THREE.BoxGeometry(0.14,0.03,0.5),k%2?0x7ad05a:0x9ae07a,x+Math.sin(a)*0.18,getH(x,z)+0.18,z+Math.cos(a)*0.18,a,-0.55); }
    put(parts,new THREE.SphereGeometry(0.09,6,5),0xf2f0a0,x,getH(x,z)+0.34,z,0);
    const hm=new THREE.Mesh(merge(parts),herbMat); hm.visible=false; scene.add(hm); LP.herbs.push(hm);
  });
}
// every frame: carts where Odran is, herbs while you still need them (both from your main quest progress)
function updateLoreProps(){
  if(!LP.herbs.length) return;
  for(const c of LP.carts) c.mesh.visible=odranHere(VILS.indexOf(c.V)+1);
  const pick=mqPicking(), M=GEAR&&GEAR.mq, pulse=0.6+0.4*Math.sin(t*3);
  LP.herbs.forEach((h,i)=>{ h.visible=pick&&!((M.h>>i)&1); if(h.visible) h.material.emissiveIntensity=pulse; });
}
