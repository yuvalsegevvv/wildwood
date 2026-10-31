//@ The Cenote of Hollow Stars' door (the Emberwake Isles' dungeon): a low mossy mound with a stepped stone arch, a carved star over the lintel, a stone plug that seals it, pale blue star-fire that lights the way
/* Agent map (docs/DUNGEON-THEMES.md section 14; rules, prompt, maps and ground patch are game/dungeon/entrances.js, kind 'cenote'; test tools/entrances-client-smoke.js, tools/cenote-dungeon-smoke.js).
   dgEntCenote(E) is called by dgEntBuild (buildings-dungeon.js) for DG_ENTRANCES.cenote, which stands at the atlas's isles door (EW_DOOR, shared/emberwakezones.js).
   The group follows the same frame as every door (dgEntBegin: +z out of the door, toward the apron, the mound at -z) and ends with dgEntEnd; `apply(sealed)` shows or hides the stone plug,
   `tick` eases the star-fire behind it. It uses the helpers of buildings-dungeon.js (dgEntBegin, dgEntEnd, dgEntDome, dgEntRock, dgEntFlat, dgEntDet), which loads first. */
function dgEntCenote(E){
  const S=dgEntBegin(E), {main,glow}=S, det=dgEntDet;
  const stoneP=(x,y,z,nx,ny,nz,c)=>{ const n=noise2(x*0.6+y*0.3,z*0.6)*0.5+0.5, band=Math.sin(y*2.6+noise2(x*0.5,z*0.5)*2)*0.5+0.5; c.set(0x8a9a8a).multiplyScalar(0.62+0.42*n+0.08*band); if(ny>0.6) c.lerp(dgEntC.set(0x4a7a3a),0.45*n); };   // grey limestone, moss on the tops
  const darkP=(x,y,z,nx,ny,nz,c)=>{ const n=noise2(x*0.5,z*0.5+y)*0.5+0.5; c.set(0x4a5a50).multiplyScalar(0.7+0.5*n); };
  const plugP=dgEntFlat(0x6a7a70), starP=dgEntFlat(0x7fe8ff), paleP=dgEntFlat(0xe8fbff);
  const seg=det?[18,9]:[9,5];
  main.push(dgEntDome(10,7,10,0,-0.8,-8,seg[0],seg[1],0.1,stoneP),dgEntDome(5,4,5,-10,-0.6,-4,det?12:6,det?6:3,0.14,darkP),dgEntDome(4.5,3.4,4.5,10,-0.6,-3.5,det?12:6,det?6:3,0.14,darkP));   // the mound, and the smaller ones either side
  main.push(dgEntRock(2.0,1.8,1.7,-11.8,0.8,2.4,0.3,stoneP,0.3),dgEntRock(1.7,1.5,1.5,11.6,0.7,2.2,0.3,stoneP,-0.4)); S.foot(-11.8,2.4,S.gy(-11.8,2.4)); S.foot(11.6,2.2,S.gy(11.6,2.2));
  for(const sx of [-1,1]){   // the jambs: three blocks each, stepping inward as they rise (a corbelled arch)
    for(let k=0;k<3;k++) main.push(paint(new THREE.BoxGeometry(1.6-k*0.0,1.8,2.2).translate(sx*(3.0-k*0.55),0.9+k*1.8,-0.2),stoneP));
    S.col(sx*3.0,-0.2,1.6); S.foot(sx*3.0,-0.2,S.gy(sx*3.0,-0.2)); }
  main.push(paint(new THREE.BoxGeometry(2.2,1.0,2.4).translate(0,5.9,-0.2),stoneP),paint(new THREE.BoxGeometry(5.2,1.0,2.4).translate(0,6.9,-0.2),stoneP));   // the capstone and the lintel
  glow.push(paint(new THREE.OctahedronGeometry(0.55,0).scale(1,1.5,0.5).translate(0,6.9,0.95),starP));   // the carved star over the door
  for(let k=0;k<4;k++){ const lz=1.6+k*0.9, y=S.gy(0,lz); main.push(paint(new THREE.BoxGeometry(5.0-k*0.5,0.3,0.95).translate(0,y+0.15,lz),stoneP)); S.foot(0,lz,y); }   // four worn steps
  // the stone plug that seals it, with a seam of star-fire round its edge
  const slab=new THREE.Mesh(merge([paint(new THREE.BoxGeometry(3.6,4.6,0.5).translate(0,2.4,0.1),plugP),paint(new THREE.TorusGeometry(2.1,0.1,5,det?14:8).scale(1,1.2,1).translate(0,2.6,0.38),starP)]),villageMat); slab.castShadow=slab.receiveShadow=true; S.G.add(slab);
  const voidMat=new THREE.MeshBasicMaterial({color:0x041016}), voidMesh=new THREE.Mesh(new THREE.PlaneGeometry(3.8,4.8),voidMat); voidMesh.position.set(0,2.4,-0.5); S.G.add(voidMesh);
  const gleam=new THREE.Mesh(new THREE.PlaneGeometry(3.6,4.6),new THREE.MeshBasicMaterial({color:0x5ad0f0,transparent:true,opacity:0.25,depthWrite:false,blending:THREE.AdditiveBlending})); gleam.position.set(0,2.4,-0.42); S.G.add(gleam);
  // star-fire bowls on stone stems either side of the steps, a still basin, a heap of mossy rubble
  for(const sx of [-1,1]){ const lx=sx*4.6, lz=3.6, y=S.gy(lx,lz);
    main.push(paint(new THREE.CylinderGeometry(0.2,0.4,1.4,6).translate(lx,y+0.7,lz),stoneP));
    glow.push(paint(new THREE.SphereGeometry(0.34,7,5).scale(1,1.2,1).translate(lx,y+1.65,lz),paleP)); S.foot(lx,lz,y); S.col(lx,lz,0.5); }
  { const ax=7.2, az=2.6, ay=S.gy(ax,az); glow.push(paint(new THREE.CylinderGeometry(0.9,0.9,0.12,10).translate(ax,ay+0.4,az),starP)); main.push(paint(new THREE.CylinderGeometry(1.05,1.15,0.4,8).translate(ax,ay+0.2,az),darkP)); S.foot(ax,az,ay); S.col(ax,az,1.0); }
  for(const [x,z,r] of [[0,-5.2,5.0],[-8.5,-3.2,4],[9.0,-3.0,4],[-1.0,-0.4,0.7],[0,-0.4,0.7],[1.0,-0.4,0.7]]) S.col(x,z,r);
  dgEntEnd(S,{slab,sealMesh:slab,voidMat,gleam,
    apply(sealed){ slab.visible=sealed; },
    tick(dt,lit,d){ S.glowMat.color.setScalar(0.3+0.7*lit); gleam.material.opacity=0.25*lit*(0.8+0.2*Math.sin(t*1.7)*Math.sin(t*1.1)); }});
}
