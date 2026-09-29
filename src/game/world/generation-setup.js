//@ Palettes, shared geometries (buildGeometries), terrain (in tiles, culled by distance) + water + the three villages (genTerrain)
/* ---------- world generation (streamed in small slices) ---------- */
let water, waterMat;
const statusEl=$('#status');
const G={}; // shared geometries, built once
const PAL={
  pine:[0x2d5a2b,0x2f5230,0x3a6432,0x28492a], spruce:[0x24462d,0x2b5236,0x1f3f2a],
  oak:[0x4d7c2c,0x5d8a32,0x416f2a,0x6a9139], autumn:[0xc27a2c,0xb24f26,0xd2a236,0x9a6a2a,0xe0b441],
  birch:[0x7fa83e,0x92b64a,0x6f9a38], birchAutumn:[0xdcc046,0xe6cf5a,0xc9b03c],
  bush:[0x3f6d2a,0x4f7a30,0x5b8436,0x365f28], shrubBloom:[0xc76a8f,0xd8d2e6,0xe0a0b8],
  fern:[0x3d7a2a,0x4f8a30,0x467f2c], lily:[0x3f7a35,0x4b8a3c,0x356a30],
  flowers:[0xf4f2ea,0xf6d23c,0xa65fd4,0xe5484d,0x6f8cf0,0xff9ad5,0xf29a38],
  // the Sakura Vale
  sakura:[0xf6c6d6,0xf2b0c8,0xfad4e0,0xeea0bc,0xfbe6ee,0xf4bcd0], maple:[0xc8321e,0xd8502a,0xb82a24,0xe07030,0xa8281e],
  bamboo:[0x6f9a3a,0x7aa844,0x5f8a34], azalea:[0xe0508a,0xf07aa8,0xf4f0f2,0xd84a6a], valeFlowers:[0xf8f4f6,0xffb0cc,0xf6d23c,0xe0508a,0xb080e0,0xfad4e0],
  // the Hoarfrost Reach: snow-laden spruce, dwarf birch with its last rust leaves, frosted shrubs, dry pale tussocks
  frostSpruce:[0x6f8f86,0x86a69c,0x9fbab0,0x7a9c92], frostBirch:[0x9a6438,0x8a5430,0xa8763e], frostBush:[0x7f918c,0x93a49f,0x6f807c], tussock:[0xb8b090,0xc6bfa0,0xa8a084]
};
const RAD={pine:0.35,spruce:0.3,oakA:0.55,oakB:0.5,birch:0.22,snag:0.3,sakura:0.4,maple:0.3,bamboo:0.7,frostspruce:0.32,dwarfbirch:0.2};
const moss=new THREE.Color(0x56702f);

function buildGeometries(){
  G.trees={
    pine:makeConifer({trunkH:4, layers:5, r0:2.3, lh:2.8, spacing:1.45, start:1.6}),
    spruce:makeConifer({trunkH:3, layers:8, r0:1.8, lh:2.2, spacing:1.05, start:1.2}),
    oakA:makeBroadleaf({trunkH:4.2, tr:0.42, crownY:6.2, rMain:2.4, blobs:5, spread:1.9, sy:0.85, branches:3, bark:0x4f3c2a}),
    oakB:makeBroadleaf({trunkH:3.4, tr:0.36, crownY:5.0, rMain:2.0, blobs:6, spread:2.2, sy:0.75, branches:4, bark:0x5a4632}),
    birch:makeBroadleaf({trunkH:7.5, tr:0.16, crownY:7.6, rMain:1.2, blobs:4, spread:0.85, sy:1.6, branches:0, birch:true}),
    snag:makeSnag(),
    sakura:makeSakura(),
    maple:makeBroadleaf({trunkH:2.6, tr:0.22, crownY:4.0, rMain:1.6, blobs:6, spread:1.5, sy:0.65, branches:3, bark:0x3e302a}),
    bamboo:makeBamboo(),
    frostspruce:makeConifer({trunkH:2.6, layers:9, r0:1.7, lh:2.3, spacing:0.95, start:1.1}),
    dwarfbirch:makeBroadleaf({trunkH:2.4, tr:0.1, crownY:2.8, rMain:0.85, blobs:3, spread:0.6, sy:1.25, branches:0, birch:true})
  };
  G.bush=[makeBush(4,0.6), makeBush(3,0.45)];
  G.fern=makeFern();
  G.grass=makeGrass(9);
  G.stem=makeStem(0.45,[0.35,0.55,0.2]);
  G.head=paint(new THREE.IcosahedronGeometry(0.06,0).scale(1,0.55,1).translate(0,0.46,0),()=>_c.setRGB(1,1,1));
  let rg=new THREE.DodecahedronGeometry(1,1);
  { const p=rg.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i),j=1+(h3(x,y,z)-0.5)*0.5; p.setXYZ(i,x*j,y*j,z*j);} rg.computeVertexNormals(); }
  const rockSnowCol=new THREE.Color(0xf0f5f8);   // the Hoarfrost's boulders: cold grey stone with snow on every upward face
  G.rockSnow=paint(rg.clone(),(x,y,z,nx,ny,nz,c)=>{ c.set(0x88909a).multiplyScalar(0.8+h3(x,y,z)*0.35); if(ny>0.3&&y>0.05) c.lerp(rockSnowCol,clamp((ny-0.3)*2.4)*0.93); });
  G.rock=paint(rg,(x,y,z,nx,ny,nz,c)=>{ c.set(0x7c786e).multiplyScalar(0.8+h3(x,y,z)*0.35); if(ny>0.5&&y>0.15) c.lerp(moss,clamp((ny-0.5)*2)*0.75); });
  let lg=cyl(0.3,0.34,4,9); lg.rotateZ(Math.PI/2);
  G.log=paint(lg,(x,y,z,nx,ny,nz,c)=>{ if(Math.abs(nx)>0.9) c.set(0xb39264); else { c.set(0x4e3c2a).multiplyScalar(0.85+h3(x,y,z)*0.3); if(ny>0.45) c.lerp(moss,0.65); } });
  G.mush=merge([
    paint(cyl(0.028,0.038,0.15,6).translate(0,0.075,0),()=>_c.set(0xe8dfcc)),
    paint(new THREE.SphereGeometry(0.1,9,4,0,TAU,0,Math.PI/2).scale(1,0.6,1).translate(0,0.14,0),(x,y,z)=>{ _c.set(0xb8322a); if(h3(x,y,z)>0.86) _c.set(0xf2ece0); })
  ]);
  G.reeds=makeReeds();
  G.lily=paint(new THREE.CircleGeometry(0.4,12,0.35,TAU-0.35).rotateX(-Math.PI/2),(x,y,z)=>_c.setRGB(1,1,1).multiplyScalar(0.85+Math.hypot(x,z)*0.4));
  G.lilyFlower=paint(new THREE.IcosahedronGeometry(0.1,0).scale(1,0.55,1),()=>_c.setRGB(1,1,1));
}

/* The terrain is one grid (HS) over the whole world, drawn as tiles of TBAND x TTILE cells (strips east to west, cut into tiles north to south)
   so that tiles beyond the fog (most of the other lands) are skipped; normals come from the heightmap so tiles meet seamlessly. */
const TBAND=LITE?48:64, TTILE=LITE?96:128, TERRAIN_BANDS=[];
function* genTerrain(){
  for(let iz=0;iz<NVZ;iz++){
    const z=WZ0+iz*CELL;
    for(let ix=0;ix<NVX;ix++) HS[iz*NVX+ix]=rawHeight(WX0+ix*CELL,z);
    Stream.tp=iz/NVZ*0.6;
    if((iz&7)===7) yield;
  }
  const tmat=new THREE.MeshLambertMaterial({vertexColors:true}), cc=new THREE.Color(), hs=(ix,iz)=>HS[clamp(iz,0,SEGZ)*NVX+clamp(ix,0,SEGX)];
  const tiles=Math.ceil(SEGX/TBAND)*Math.ceil(SEGZ/TTILE); let done=0;
  for(let b0=0;b0<SEGX;b0+=TBAND) for(let c0=0;c0<SEGZ;c0+=TTILE){
    const nx=Math.min(TBAND,SEGX-b0), nz=Math.min(TTILE,SEGZ-c0), w=nx*CELL, d=nz*CELL, g=new THREE.PlaneGeometry(w,d,nx,nz); g.rotateX(-Math.PI/2);
    g.translate(WX0+b0*CELL+w/2,0,WZ0+c0*CELL+d/2);
    const tp=g.attributes.position, tn=g.attributes.normal, tc=new Float32Array(tp.count*3), n=new THREE.Vector3();
    for(let r=0;r<=nz;r++){
      const iz=c0+r;
      for(let k=0;k<=nx;k++){
        const i=r*(nx+1)+k, ix=b0+k, h=HS[iz*NVX+ix], x=tp.getX(i), z=tp.getZ(i);
        tp.setY(i,h);
        n.set(hs(ix-1,iz)-hs(ix+1,iz),2*CELL,hs(ix,iz-1)-hs(ix,iz+1)).normalize(); tn.setXYZ(i,n.x,n.y,n.z);
        terrainColor(x,z,h,grad(x,z),cc); tc[i*3]=cc.r; tc[i*3+1]=cc.g; tc[i*3+2]=cc.b;
      }
      if((r&15)===15) yield;
    }
    g.setAttribute('color', new THREE.BufferAttribute(tc,3)); g.computeBoundingSphere();
    const mesh=new THREE.Mesh(g,tmat); mesh.receiveShadow=true; scene.add(mesh);
    TERRAIN_BANDS.push({mesh,x0:WX0+b0*CELL,x1:WX0+b0*CELL+w,z0:WZ0+c0*CELL,z1:WZ0+c0*CELL+d});
    Stream.tp=0.6+(++done)/tiles*0.4;
  }
  waterMat=new THREE.MeshPhongMaterial({color:0x2c5560, transparent:true, opacity:0.84, shininess:140, specular:0x8fa4b4});
  waterMat.onBeforeCompile=sh=>{
    sh.uniforms.uTime=timeU;
    sh.vertexShader='varying vec3 vWp;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vWp=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='uniform float uTime;\nvarying vec3 vWp;\n'+sh.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      float t=uTime;
      vec3 pn=vec3(sin(vWp.x*0.9+t*1.3)*0.5+sin(vWp.z*1.7-t*1.1)*0.3+sin((vWp.x+vWp.z)*2.6+t*2.1)*0.2, 0.0,
                   cos(vWp.z*0.8+t*1.2)*0.5+sin(vWp.x*1.9+t*0.9)*0.3+cos((vWp.x-vWp.z)*3.1-t*1.7)*0.2);
      normal=normalize(normal+(viewMatrix*vec4(pn*0.16,0.0)).xyz);`);
  };
  waterMat.customProgramCacheKey=()=>'water';
  applyEnv(envCur);
  // one sea for the lakes, the Crownsea and the ocean: wide enough that its edge is never within the camera's reach (1200 m)
  const wg=new THREE.PlaneGeometry(4200,3800,1,1); wg.rotateX(-Math.PI/2); wg.translate((WX0+WX1)/2,0,(WZ0+WZ1)/2);
  water=new THREE.Mesh(wg,waterMat); water.position.y=WATER; water.receiveShadow=true;
  scene.add(water);
  buildFarLands(); buildBridges(); buildLoreProps();

  spawn.x=VIL.spawn.x; spawn.z=VIL.spawn.z;
  P.x=spawn.x; P.z=spawn.z; P.y=getH(P.x,P.z);
  { const ux=VIL.x-P.x, uz=VIL.z-P.z; P.yaw=Math.atan2(-ux,-uz); P.face=P.yaw; }
  buildVillage(); buildVale(); buildHoarfrost(); buildTideBeach(); buildNodes();
}
// terrain tiles farther than the fog are hidden (checked with the plant chunks, see cullChunks)
function cullTerrain(){ const cx=camera.position.x, cz=camera.position.z, far=scene.fog.far+60; for(const b of TERRAIN_BANDS) b.mesh.visible=Math.hypot(Math.max(b.x0-cx,0,cx-b.x1),Math.max(b.z0-cz,0,cz-b.z1))<far; }

