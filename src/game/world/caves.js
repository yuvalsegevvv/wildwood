//@ Caves on the client: each site's rock mesh (streamed in when you come within 420 m: cvNeed, cvBuildJob), its tide-pool water, the darker light inside a cave (cvLightTint) and the per-frame upkeep (cvUpdate)
/* Agent map. The rock itself (field, floor, collision, mesh and paint) is shared/caves.js + caves-mesh.js; this file only puts it on screen. Hooks into other files (all marked `// caves:`, table in docs/CAVES.md):
   world/streaming.js (job kind 'v' builds one site's mesh a slice per frame), main/loop.js (cvUpdate, and cvNeed keeps the stream pump awake), world/time-of-day.js (cvLightTint before applyEnv),
   world/zone-props.js (terrainColor: the shelf's colour), player/movement.js (walls, ledges, the ground under an arch, the camera's arm), shared/terrain-height.js (the floor), shared/village-helpers.js (keep-out).
   Detail by device: CVC.cell = 1.4 m grid cells on a desktop, 1.9 on a phone (LOW), 2.6 in light mode (LITE); about 33k, 18k and 9k triangles for the biggest site. Test: tools/caves-smoke.js. */
const CVC={built:new Map(), group:null, mat:null, poolMat:null, sh:0, shT:0, cullT:0, cell:LITE?2.6:(LOW?1.9:1.4), range:420};
// the next site that has no mesh yet and is within range of the player (or null); a site being built is marked at once so the scheduler never starts it twice
function cvNeed(){
  if(!CV_SITES.length||!Stream.terrainDone||dgIn()||caveIn()) return null;   // cave: also on a floor
  for(let i=0;i<CV_SITES.length;i++){
    const S=CV_SITES[i]; if(CVC.built.has(S.id)) continue;
    if(Math.hypot(Math.max(S.bx0-P.x,0,P.x-S.bx1),Math.max(S.bz0-P.z,0,P.z-S.bz1))<CVC.range) return S;
  }
  return null;
}
function* cvBuildJob(S){
  CVC.built.set(S.id,null);
  const gen=cvMeshGen(S,CVC.cell,1,(x,z)=>getH(x,z)-CELL*0.3*grad(x,z));   // (what the ground hides is dropped; the coarser the ground grid, the more it is spared)
  let r=gen.next(); while(!r.done){ yield; r=gen.next(); }
  const m=r.value, g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(m.pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(m.nor,3)); g.setAttribute('color',new THREE.BufferAttribute(m.col,3));
  g.setIndex(new THREE.BufferAttribute(m.idx,1)); g.computeBoundingSphere();
  if(!CVC.mat) CVC.mat=new THREE.MeshLambertMaterial({vertexColors:true});
  const mesh=new THREE.Mesh(g,CVC.mat); mesh.receiveShadow=true; mesh.castShadow=!LOW&&!LITE; scene.add(mesh);
  yield;
  let pools=null;
  if(S.pools.length){   // tide pools: flat water patches (fans of 12 triangles) sitting a little under the shelf's rim, one mesh for the site
    const seg=12, P2=new Float32Array(S.pools.length*seg*9), N2=new Float32Array(S.pools.length*seg*9); let o=0;
    for(const p of S.pools){
      const y=S.fy-p.depth*0.45, r=p.r*0.8;
      for(let k=0;k<seg;k++){ const a0=k/seg*TAU, a1=(k+1)/seg*TAU; P2.set([p.wx,y,p.wz, p.wx+Math.cos(a0)*r,y,p.wz+Math.sin(a0)*r, p.wx+Math.cos(a1)*r,y,p.wz+Math.sin(a1)*r],o); for(let q=0;q<3;q++) N2[o+q*3+1]=1; o+=9; }
    }
    const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.BufferAttribute(P2,3)); pg.setAttribute('normal',new THREE.BufferAttribute(N2,3)); pg.computeBoundingSphere();
    if(!CVC.poolMat) CVC.poolMat=new THREE.MeshPhongMaterial({color:0x3f7568,transparent:true,opacity:0.8,shininess:90,specular:0x9ab8b4,side:THREE.DoubleSide,depthWrite:false});
    pools=new THREE.Mesh(pg,CVC.poolMat); pools.renderOrder=1; scene.add(pools);
  }
  CVC.built.set(S.id,{mesh,pools,tris:m.tris,S});
}
// each frame: sites beyond the fog are not drawn; the cave's darkness (rays up and out from the hiker) is sampled 8 times a second
function cvUpdate(dt){
  if(!CV_SITES.length) return;
  CVC.cullT-=dt; if(CVC.cullT<=0){
    CVC.cullT=0.5; const far=scene.fog.far+120;
    for(const b of CVC.built.values()){ if(!b) continue; const S=b.S, v=Math.hypot(Math.max(S.bx0-camera.position.x,0,camera.position.x-S.bx1),Math.max(S.bz0-camera.position.z,0,camera.position.z-S.bz1))<far; b.mesh.visible=v; if(b.pools) b.pools.visible=v; }
  }
  CVC.shT-=dt; if(CVC.shT<=0){ CVC.shT=0.125; const S=cvSiteAt(P.x,P.z); CVC.want=S&&!dgIn()&&!caveIn()?cvShade(P.x,P.y,P.z)*S.dark:0; }
  CVC.sh+=((CVC.want||0)-CVC.sh)*Math.min(1,dt*3);
}
// the light inside a cave: the hemisphere light and the sun fade with how enclosed the hiker is, and the far walls fade into dark, not into the day's haze
function cvLightTint(s,dt){
  const k=CVC.sh; if(k<0.01) return;
  s.hi*=1-0.32*k; s.sunI*=1-0.85*k; s.fog.multiplyScalar(1-0.6*k); s.far=lerp(s.far,95,k);
}
