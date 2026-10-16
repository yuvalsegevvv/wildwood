//@ The Gloamvault's door (the Gloamhorn's dungeon): a drowned chapel's front set into the cliff of Vault Heath, a pointed arch under a rose window between two buttresses, iron-bound doors that seal it, a wreck's anchor leaning on a pier
/* Agent map (docs/DUNGEON-THEMES.md section 12; rules, prompt, maps and ground patch are game/dungeon/entrances.js, kind 'gloam'; test tools/entrances-client-smoke.js, tools/gloamvault-dungeon-smoke.js).
   dgEntGloam(E) is called by dgEntBuild (buildings-dungeon.js) for DG_ENTRANCES.gloamvault, which is GLOAM_DG_DOOR (shared/gloamhorn.js): the prop the Gloamhorn's agent placed (buildGloamDoor) is gone, this is the real door.
   The group follows the same frame as every door (dgEntBegin: +z out of the door, toward the apron, the cliff at -z) and ends with dgEntEnd; `apply(sealed)` shows or hides the iron-bound doors, `tick` eases the
   violet light behind them. It uses the helpers of buildings-dungeon.js (dgEntBegin, dgEntEnd, dgEntDome, dgEntRock, dgEntFlat, dgEntDet), which loads first. */
function dgEntGloam(E){
  const S=dgEntBegin(E), {main,glow}=S, det=dgEntDet;
  const stoneP=(x,y,z,nx,ny,nz,c)=>{ const n=noise2(x*0.8+y,z*0.8)*0.5+0.5; c.set(0x4a4858).multiplyScalar(0.72+0.5*n); if(ny>0.6) c.lerp(dgEntC.set(0x7a7a86),0.25*n); };
  const rockP=(x,y,z,nx,ny,nz,c)=>{ const n=noise2(x*0.4,z*0.4+y)*0.5+0.5; c.set(0x34323c).multiplyScalar(0.7+0.5*n); };
  const woodP=dgEntFlat(0x2e2218), ironP=dgEntFlat(0x2a2c32), glassP=dgEntFlat(0x6a4ad0), paleP=dgEntFlat(0xb8c8c0);
  const seg=det?[18,9]:[9,5];
  main.push(dgEntDome(14,9,8,0,-1.2,-7.5,seg[0],seg[1],0.12,rockP),dgEntDome(6,4,5,-11,-0.6,-3.2,det?10:6,det?5:3,0.16,rockP),dgEntDome(6,4,5,11,-0.6,-3.2,det?10:6,det?5:3,0.16,rockP));   // the cliff the chapel is cut into
  main.push(dgEntRock(2.4,2.8,2.0,-12.5,1.2,0.4,0.3,stoneP,0.3),dgEntRock(2.0,2.0,1.8,12.8,0.9,0.6,0.3,stoneP,-0.4)); S.foot(-12.5,0.4,S.gy(-12.5,0.4)); S.foot(12.8,0.6,S.gy(12.8,0.6));   // fallen blocks at either end
  for(const sx of [-1,1]){   // the buttresses, each with a pinnacle and a base
    main.push(paint(vbox(2.6,9.6,3.0,sx*4.6,4.8,0),stoneP),paint(vbox(3.1,0.6,3.5,sx*4.6,0.3,0),stoneP),paint(vbox(3.0,0.5,3.4,sx*4.6,9.8,0),stoneP),paint(new THREE.ConeGeometry(1.0,2.6,4).rotateY(Math.PI/4).translate(sx*4.6,11.3,0),stoneP));
    main.push(paint(vbox(1.0,6.2,2.4,sx*2.9,3.1,0),stoneP));   // the jambs
    S.col(sx*4.6,0,1.7); S.foot(sx*4.6,0,S.gy(sx*4.6,0)); }
  main.push(paint(vbox(0.95,4.5,2.4,0,0,0).rotateZ(-0.72).translate(-1.45,7.55,0),stoneP),paint(vbox(0.95,4.5,2.4,0,0,0).rotateZ(0.72).translate(1.45,7.55,0),stoneP));   // the pointed arch
  main.push(paint(vbox(6.2,2.0,2.4,0,10.0,0),stoneP));   // the wall over it, the rose window's bed
  glow.push(paint(cyl(0.75,0.75,0.1,14).rotateX(Math.PI/2).translate(0,10.0,1.22),glassP),paint(new THREE.TorusGeometry(0.95,0.12,5,14).translate(0,10.0,1.25),paleP));
  for(let k=0;k<3;k++){ const lz=1.6+k*0.9, y=S.gy(0,lz); main.push(paint(vbox(6.4-k*0.5,0.28,0.95,0,y+0.14,lz),stoneP)); S.foot(0,lz,y); }   // three worn steps
  // the iron-bound doors that seal it, with a chain across
  const slab=new THREE.Mesh(merge([paint(vbox(5.0,6.0,0.4,0,3.0,0.1),woodP),paint(vbox(5.3,0.22,0.5,0,1.2,0.12),ironP),paint(vbox(5.3,0.22,0.5,0,3.2,0.12),ironP),paint(vbox(5.3,0.22,0.5,0,5.2,0.12),ironP),paint(vbox(0.12,6.0,0.5,0,3.0,0.14),ironP),
    paint(vbox(5.4,0.14,0.14,0,3.1,0.4).rotateZ(0.0),ironP),paint(vbox(0.5,0.6,0.3,0,2.6,0.42),ironP)]),villageMat); slab.castShadow=slab.receiveShadow=true; S.G.add(slab);
  const voidMat=new THREE.MeshBasicMaterial({color:0x07060c}), voidMesh=new THREE.Mesh(new THREE.PlaneGeometry(4.8,6.0),voidMat); voidMesh.position.set(0,3.0,-0.5); S.G.add(voidMesh);
  const gleam=new THREE.Mesh(new THREE.PlaneGeometry(4.6,5.8),new THREE.MeshBasicMaterial({color:0x6a4ad0,transparent:true,opacity:0.25,depthWrite:false,blending:THREE.AdditiveBlending})); gleam.position.set(0,3.0,-0.42); S.G.add(gleam);
  // a wreck's anchor leaning on the left pier, a crate and a keg to the right, two iron lamp posts either side of the steps
  { const ax=-7.4, az=1.9, ay=S.gy(ax,az); main.push(paint(vbox(0.2,3.6,0.2,0,0,0).rotateZ(0.22).translate(ax,ay+1.8,az),ironP),paint(vbox(1.3,0.18,0.18,0,0,0).rotateZ(0.22).translate(ax-0.1,ay+3.1,az),ironP),paint(new THREE.TorusGeometry(0.28,0.07,5,8).translate(ax-0.8,ay+3.75,az),ironP),paint(new THREE.ConeGeometry(0.3,0.6,4).rotateZ(1.2).translate(ax+0.5,ay+0.15,az),ironP)); S.foot(ax,az,ay); }
  { const cx=7.6, cz=2.2, cy=S.gy(cx,cz); main.push(paint(vbox(1.2,0.9,1.2,cx,cy+0.45,cz),woodP),paint(cyl(0.36,0.36,0.7,8).translate(cx+0.1,cy+1.25,cz),woodP)); S.foot(cx,cz,cy); S.col(cx,cz,0.9); }
  for(const sx of [-1,1]){ const lx=sx*5.4, lz=3.6, y=S.gy(lx,lz);
    main.push(paint(vbox(0.7,0.7,0.7,lx,y+0.35,lz),stoneP),paint(cyl(0.07,0.1,2.0,6).translate(lx,y+1.6,lz),ironP),paint(cyl(0.28,0.2,0.25,7).translate(lx,y+2.7,lz),ironP));
    glow.push(paint(new THREE.SphereGeometry(0.22,6,4).translate(lx,y+2.95,lz),dgEntFlat(0xc8b0ff))); S.foot(lx,lz,y); S.col(lx,lz,0.5); }
  for(const [x,z,r] of [[0,-5.2,5.0],[-9.5,-2.4,4],[9.5,-2.4,4],[-1.0,-0.4,0.7],[0,-0.4,0.7],[1.0,-0.4,0.7]]) S.col(x,z,r);
  dgEntEnd(S,{slab,sealMesh:slab,voidMat,gleam,
    apply(sealed){ slab.visible=sealed; },
    tick(dt,lit,d){ S.glowMat.color.setScalar(0.3+0.7*lit); gleam.material.opacity=0.25*lit*(0.8+0.2*Math.sin(t*1.9)*Math.sin(t*1.1)); }});
}
