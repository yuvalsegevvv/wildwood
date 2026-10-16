//@ The Sunscar placed in the game: Glasswell's model on the Bowl the heightmap carries, its colliders, the Glass River and the Springhead's water
/* Agent map: buildSunscar() is called by generation-setup.js after buildGreyspine. It builds Glasswell (buildGlasswell, buildings-sun.js; noLand: the Bowl's rim and floor are the terrain's own,
   shared/sunland.js + terrain-color-sun.js) at SUN_CITY, registers the circles of VIL5 as colliders (its houses and halls are boxes, which the movement code finds through vilAt), and lays the water:
   the Glass River outside the Bowl as a ribbon at its own altitude (SUN_RIVER, sunWaterSurf is the same surface for swimming and plants) and the Springhead's pond. Inside the Bowl the water is the model's.
   Test: client-smoke (it builds the world). */
const SUNS={city:null,river:null,pond:null,door:null};
function buildSunscar(){
  const C=SUN_CITY;
  SUNS.city=buildGlasswell({x:C.x,z:C.z,h:C.h,noLand:true}); scene.add(SUNS.city);
  for(const c of VIL5.circles) addCol(c[0],c[1],c[2]);
  { const pos=[], idx=[], far=GLASSWELL.foot+8; let n=0;
    const chain=(a,b)=>{ let started=false, base=n;
      for(let i=a;i<b;i++){ const R=SUN_RIVER[i]; if(Math.hypot(R[0]-C.x,R[1]-C.z)<far) { started=false; continue; }
        const p=SUN_RIVER[Math.max(a,i-1)], q=SUN_RIVER[Math.min(b-1,i+1)], vx=q[0]-p[0], vz=q[1]-p[1], l=Math.hypot(vx,vz)||1, nx=-vz/l*(R[3]+1.1), nz=vx/l*(R[3]+1.1), y=R[2]+0.12;
        pos.push(R[0]+nx,y,R[1]+nz,R[0]-nx,y,R[1]-nz); if(started){ idx.push(n*2-2,n*2,n*2-1,n*2-1,n*2,n*2+1); } started=true; n++; } };
    chain(0,SUN_RIVER_UPN); chain(SUN_RIVER_UPN,SUN_RIVER.length);
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals();
    SUNS.river=new THREE.Mesh(g,waterMat); SUNS.river.receiveShadow=true; scene.add(SUNS.river); }
  { const S=SUN_SPRING; SUNS.pond=new THREE.Mesh(new THREE.CircleGeometry(S.r*1.2,28).rotateX(-Math.PI/2),waterMat); SUNS.pond.position.set(S.x,SUN_BASE-0.6+0.12,S.z); SUNS.pond.receiveShadow=true; scene.add(SUNS.pond); }
  // (the Sandglass's door, SUN_DG_DOOR, is built with the other dungeon doors: dgEntSand in buildings-dungeon.js)
}
