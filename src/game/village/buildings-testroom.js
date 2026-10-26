//@ The test room's dressing: a ring of stones round the pad, four torch posts and a signboard at the edge toward the village (the scarecrow itself is a monster: combat/monster-totems.js)
/* Agent map. troomBuild() is called once by generation-setup.js beside dgEntBuild(); TROOM is shared/testroom.js. Uses the doors' helpers (dgEntWood, dgEntSignTex: village/buildings-dungeon.js).
   The sign stands 1 m outside the ring toward the village, so the talk key (game/ui/testroom.js, troomNear) finds the scarecrow and the sign alike. Test: tools/testroom-smoke.js. */
function troomBuild(){
  const stone=(x,y,z,nx,ny,nz,c)=>{ c.set(0x8a877e).multiplyScalar(0.72+0.45*h3(x*3,y,z*3)); }, wood=dgEntWood(0x5e4630), parts=[];
  const N=22;
  for(let i=0;i<N;i++){ const a=i/N*TAU, x=TROOM.x+Math.sin(a)*TROOM.r, z=TROOM.z+Math.cos(a)*TROOM.r, y=getH(x,z), w=1.0+0.5*h3(i,1,2);
    parts.push(paint(vbox(w,0.4+0.15*h3(i,3,4),0.55,0,0,0).rotateY(a).translate(x,y+0.12,z),stone)); }
  for(let k=0;k<4;k++){ const a=k/4*TAU+Math.PI/4, x=TROOM.x+Math.sin(a)*(TROOM.r-0.4), z=TROOM.z+Math.cos(a)*(TROOM.r-0.4), y=getH(x,z);
    parts.push(paint(cyl(0.07,0.09,2.2,6).translate(x,y+1.0,z),wood),paint(cyl(0.2,0.12,0.25,7).translate(x,y+2.2,z),wood),paint(new THREE.ConeGeometry(0.15,0.42,6).translate(x,y+2.5,z),(xx,yy,zz,nx,ny,nz,c)=>{ c.set(0xffa43a); })); }
  const m=new THREE.Mesh(merge(parts),villageMat); m.castShadow=true; m.receiveShadow=true; m.name='troom-ring'; scene.add(m);
  // the signboard, on the village side
  const dx=VIL.x-TROOM.x, dz=VIL.z-TROOM.z, d=Math.hypot(dx,dz)||1, sx=TROOM.x+dx/d*(TROOM.r+1.2), sz=TROOM.z+dz/d*(TROOM.r+1.2), sy=getH(sx,sz), G=new THREE.Group();
  G.position.set(sx,sy,sz); G.rotation.y=Math.atan2(-dx,-dz); G.name='troom-sign';   // the boards face the pad (-z of the group points at the village)
  const sp=[paint(cyl(0.08,0.1,2.6,6).translate(0,1.2,0),wood),paint(vbox(1.7,0.5,0.07,0,2.05,0),wood)];
  const sm=new THREE.Mesh(merge(sp),villageMat); sm.castShadow=true; G.add(sm);
  const mat=new THREE.MeshLambertMaterial({map:dgEntSignTex('The Test Room','Scarecrow, counter, resets'),emissive:0x2a2418});
  for(const side of [1,-1]){ const p=new THREE.Mesh(new THREE.PlaneGeometry(1.6,0.4),mat); p.position.set(0,2.05,side*0.037); if(side<0) p.rotation.y=Math.PI; G.add(p); }
  scene.add(G); addCol(sx,sz,0.3);
}
