//@ The Termite Cathedral's door (the Amber Reach's dungeon): the foot of a clay spire on open grass, a ribbed pointed gap between two buttresses, a clay plug that seals it, amber resin beads that light the way and a heap of crumbled clay
/* Agent map (docs/DUNGEON-THEMES.md section 13; rules, prompt, maps and ground patch are game/dungeon/entrances.js, kind 'termite'; test tools/entrances-client-smoke.js, tools/termite-dungeon-smoke.js).
   dgEntTermite(E) is called by dgEntBuild (buildings-dungeon.js) for DG_ENTRANCES.termitecathedral, which stands at the atlas's amber door (SAV_DOOR, shared/savanna.js).
   The group follows the same frame as every door (dgEntBegin: +z out of the door, toward the apron, the spire at -z) and ends with dgEntEnd; `apply(sealed)` shows or hides the clay plug,
   `tick` eases the amber light behind it. It uses the helpers of buildings-dungeon.js (dgEntBegin, dgEntEnd, dgEntDome, dgEntRock, dgEntFlat, dgEntDet), which loads first. */
function dgEntTermite(E){
  const S=dgEntBegin(E), {main,glow}=S, det=dgEntDet;
  const clayP=(x,y,z,nx,ny,nz,c)=>{ const n=noise2(x*0.6+y*0.3,z*0.6)*0.5+0.5, rib=Math.sin(y*3.2+noise2(x*0.5,z*0.5)*2)*0.5+0.5; c.set(0x9a6440).multiplyScalar(0.66+0.4*n+0.1*rib); if(ny>0.6) c.lerp(dgEntC.set(0xc09060),0.25*n); };
  const darkP=(x,y,z,nx,ny,nz,c)=>{ const n=noise2(x*0.5,z*0.5+y)*0.5+0.5; c.set(0x6e4428).multiplyScalar(0.7+0.5*n); };
  const plugP=dgEntFlat(0x84522e), amberP=dgEntFlat(0xe09c3a), paleP=dgEntFlat(0xffd890);
  const seg=det?[18,9]:[9,5];
  main.push(dgEntDome(8.5,15,8.5,0,-0.6,-8.5,seg[0],seg[1],0.1,clayP),dgEntDome(5,9,5,-9,-0.5,-4.5,det?12:6,det?6:3,0.14,darkP),dgEntDome(4.5,7,4.5,9.5,-0.5,-4,det?12:6,det?6:3,0.14,darkP));   // the spire, and the smaller chimneys either side
  main.push(dgEntRock(2.2,2.0,1.8,-11.5,0.9,1.0,0.3,clayP,0.3),dgEntRock(1.8,1.6,1.6,11.8,0.7,1.3,0.3,clayP,-0.4)); S.foot(-11.5,1.0,S.gy(-11.5,1.0)); S.foot(11.8,1.3,S.gy(11.8,1.3));   // lumps of crumbled clay
  for(const sx of [-1,1]){   // the buttresses: a swelling ribbed foot rising to a blunt crown
    main.push(paint(new THREE.CylinderGeometry(1.1,1.9,7.4,det?8:5).translate(sx*4.4,3.7,-0.2),clayP),paint(new THREE.SphereGeometry(1.15,det?8:5,det?5:3).scale(1,0.7,1).translate(sx*4.4,7.7,-0.2),clayP));
    main.push(paint(new THREE.CylinderGeometry(0.7,1.1,5.2,det?7:5).translate(sx*2.8,2.6,0.1),clayP));   // the jambs
    S.col(sx*4.4,-0.2,1.9); S.foot(sx*4.4,-0.2,S.gy(sx*4.4,-0.2)); }
  main.push(paint(new THREE.CylinderGeometry(0.9,0.9,2.6,6).rotateZ(Math.PI/2).scale(1,1,1).translate(0,5.4,0),clayP),paint(new THREE.ConeGeometry(1.7,2.6,det?8:5).translate(0,7.3,0.1),clayP));   // the lintel and the pointed top of the gap
  for(let k=0;k<3;k++){ const lz=1.6+k*0.9, y=S.gy(0,lz); main.push(paint(new THREE.CylinderGeometry(3.1-k*0.4,3.3-k*0.4,0.28,det?10:6).translate(0,y+0.14,lz),clayP)); S.foot(0,lz,y); }   // three worn, rounded steps
  // the clay plug that seals it, with a seam of resin round its edge
  const slab=new THREE.Mesh(merge([paint(new THREE.CylinderGeometry(2.45,2.45,0.5,det?12:7).rotateX(Math.PI/2).scale(1,1.2,1).translate(0,2.9,0.1),plugP),paint(new THREE.TorusGeometry(2.4,0.12,5,det?14:8).scale(1,1.2,1).translate(0,2.9,0.38),amberP)]),villageMat); slab.castShadow=slab.receiveShadow=true; S.G.add(slab);
  const voidMat=new THREE.MeshBasicMaterial({color:0x140a04}), voidMesh=new THREE.Mesh(new THREE.PlaneGeometry(4.2,5.6),voidMat); voidMesh.position.set(0,2.8,-0.5); S.G.add(voidMesh);
  const gleam=new THREE.Mesh(new THREE.PlaneGeometry(4.0,5.4),new THREE.MeshBasicMaterial({color:0xffa840,transparent:true,opacity:0.25,depthWrite:false,blending:THREE.AdditiveBlending})); gleam.position.set(0,2.8,-0.42); S.G.add(gleam);
  // amber beads on clay nubs either side of the steps, an amber lump with a beetle in it, a heap of crumbled clay
  for(const sx of [-1,1]){ const lx=sx*5.2, lz=3.6, y=S.gy(lx,lz);
    main.push(paint(new THREE.CylinderGeometry(0.2,0.45,1.5,6).translate(lx,y+0.75,lz),clayP));
    glow.push(paint(new THREE.SphereGeometry(0.34,7,5).scale(1,1.2,1).translate(lx,y+1.75,lz),paleP)); S.foot(lx,lz,y); S.col(lx,lz,0.5); }
  { const ax=7.4, az=2.4, ay=S.gy(ax,az); glow.push(paint(new THREE.SphereGeometry(0.7,8,6).scale(1,1.3,0.9).translate(ax,ay+0.9,az),amberP)); main.push(paint(new THREE.CylinderGeometry(0.7,0.9,0.4,7).translate(ax,ay+0.2,az),darkP)); S.foot(ax,az,ay); S.col(ax,az,0.9); }
  for(const [x,z,r] of [[0,-5.2,5.0],[-8.5,-3.2,4],[9.0,-3.0,4],[-1.0,-0.4,0.7],[0,-0.4,0.7],[1.0,-0.4,0.7]]) S.col(x,z,r);
  dgEntEnd(S,{slab,sealMesh:slab,voidMat,gleam,
    apply(sealed){ slab.visible=sealed; },
    tick(dt,lit,d){ S.glowMat.color.setScalar(0.3+0.7*lit); gleam.material.opacity=0.25*lit*(0.8+0.2*Math.sin(t*1.7)*Math.sin(t*1.1)); }});
}
