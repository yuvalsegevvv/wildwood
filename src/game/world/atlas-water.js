//@ The water of the atlas's rivers and lakes (the sea is the one plane at y = 0 in generation-setup.js): two merged meshes laid on the atlas's water layer at each surface height, water with the sea's material and frozen lakes as ice
/* Agent map. awBuildWater() is called by buildBridges (bridges.js) once, after waterMat exists. It reads the atlas's 8 m grid directly (WA_WDIST: signed metres to the bank, negative inside; WA_FLAGS: the sea bit and the
   water type; waWaterSurf: the surface height) and makes a quad for every cell that has a corner in water. The quads reach up to 8 m past the bank on purpose: the ground there stands above the surface
   (world-atlas-ground.js: "the bank never stands below the water"), so the extra water is hidden and the edge is the ground's own line, not a staircase of cells.
   Each vertex takes the surface at its own node, so a river that falls to the sea falls smoothly. A cell whose surface is within 0.3 m of the sea (a lake or river mouth at sea level) is left to the sea's plane.
   Frozen lakes (the Reach) are flat, opaque ice a hand below the surface the ground is drawn at; they use no waves.
   Cost: about 2,500 cells (5,000 triangles) for the whole world, two draw calls, no per-frame work (the waves are waterMat's shader). No InstancedMesh is made here.
   Uses: WA_META, WA_FLAGS, WA_WDIST (shared/world-atlas.js), waWaterSurf, waterMat (generation-setup.js). Test: client-smoke (the build must not throw); see it: node tools/shot.js. Names: aw... */
const AW_REACH=1.0;       // a cell is drawn when a corner is this near the bank or inside it (metres)
const AW_SEA_MIN=0.3;     // a surface this close to the sea's plane is the sea's
function awBuildWater(){
  if(typeof waterMat==='undefined'||!waterMat) return;
  const nx=WA_META.nx, nz=WA_META.nz, x0=WA_META.x0, z0=WA_META.z0;
  const mk=()=>({pos:[],idx:[],map:new Map(),tris:0});
  const W=mk(), I=mk();
  const vert=(M,i,j,ice)=>{
    const k=j*nx+i; let v=M.map.get(k); if(v!==undefined) return v;
    const x=x0+i*8, z=z0+j*8, s=waWaterSurf(x,z);
    v=M.pos.length/3; M.pos.push(x,Math.max(0.08,ice?s-0.1:s),z); M.map.set(k,v); return v;
  };
  for(let j=0;j<nz-1;j++) for(let i=0;i<nx-1;i++){
    const k=j*nx+i, a=k, b=k+1, c=k+nx, d=k+nx+1;
    const wa=WA_FLAGS[a]&1?1e9:WA_WDIST[a]*0.5, wb=WA_FLAGS[b]&1?1e9:WA_WDIST[b]*0.5, wc=WA_FLAGS[c]&1?1e9:WA_WDIST[c]*0.5, wd=WA_FLAGS[d]&1?1e9:WA_WDIST[d]*0.5;
    if(wa>AW_REACH&&wb>AW_REACH&&wc>AW_REACH&&wd>AW_REACH) continue;
    // the cell's water: ice if a corner inside the water is ice, else water; its surface (the highest corner) must stand clear of the sea's plane
    let ice=false, any=false;
    for(const [n,w,q,r] of [[a,wa,i,j],[b,wb,i+1,j],[c,wc,i,j+1],[d,wd,i+1,j+1]]) if(w<=0.25){ any=true; if(waWater(x0+q*8,z0+r*8)===WA_ICE) ice=true; }
    if(!any) continue;
    if(Math.max(waWaterSurf(x0+i*8,z0+j*8),waWaterSurf(x0+i*8+8,z0+j*8),waWaterSurf(x0+i*8,z0+j*8+8),waWaterSurf(x0+i*8+8,z0+j*8+8))<AW_SEA_MIN) continue;
    const M=ice?I:W, v0=vert(M,i,j,ice), v1=vert(M,i+1,j,ice), v2=vert(M,i,j+1,ice), v3=vert(M,i+1,j+1,ice);
    M.idx.push(v0,v2,v1,v1,v2,v3); M.tris+=2;   // (counter-clockwise seen from above)
  }
  const mesh=(M,mat)=>{
    if(!M.tris) return null;
    const g=new THREE.BufferGeometry(), n=M.pos.length/3, nrm=new Float32Array(n*3); for(let q=0;q<n;q++) nrm[q*3+1]=1;
    g.setAttribute('position',new THREE.Float32BufferAttribute(M.pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nrm,3)); g.setIndex(M.idx);
    const m=new THREE.Mesh(g,mat); m.receiveShadow=true; m.matrixAutoUpdate=false; scene.add(m); return m;
  };
  const wm=mesh(W,waterMat);
  const iceMat=new THREE.MeshPhongMaterial({color:0xd4e8f2,shininess:80,specular:0xbfd8e6,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const im=mesh(I,iceMat);
  AW_MESH.water=wm; AW_MESH.ice=im; AW_MESH.tris=W.tris+I.tris;
}
const AW_MESH={water:null,ice:null,tris:0};
