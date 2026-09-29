//@ Chunked instanced meshes (frustum culled, with per-instance levels of detail), distance culling, tree collision grid (addCol, nearCols)
/* ---------- instancing ---------- */
// chunks are CS (110 m) squares over the whole world: CHX across, CHZ down
const CS=SIZE/8, CHX=Math.ceil(WW/CS-0.01), CHZ=Math.ceil(WD/CS-0.01);
const _q=new THREE.Quaternion(), _e=new THREE.Euler(), _p=new THREE.Vector3(), _s=new THREE.Vector3();
function mtx(x,y,z,ry,sx,sy,sz,tx,tz){ _e.set(tx||0,ry,tz||0); _q.setFromEuler(_e); _p.set(x,y,z); _s.set(sx,sy,sz); return new THREE.Matrix4().compose(_p,_q,_s); }
/* Instanced plants live in one mesh per chunk (CS = 110 m) and kind. Unlike three's default, these are frustum culled (r128's InstancedMesh switches it
   off, so everything within the fog was drawn, behind the camera too): each mesh's bounding sphere is fitted to its instances, o.hgt / o.rad being
   how tall and wide one model can be (default 16 m / 5 m: a tree).
   o.lods: coarser versions of the mesh, nearest first: [{geo, from, frac, cast}]. `geo` is drawn for instances nearer than the first `from`, each lod
   from its `from` to the next one's (frac: the share of the instances that level draws; the list is in random order, so thinning far grass is just
   a smaller count). Every instance picks its own level by its own distance to the eye (see updateLod), so the switch is exact, not by chunk. */
function addInstanced(geo, mat, items, o){
  o=o||{};
  // Every instanced mesh carries instance colours (white where an item has none). r128 picks a material's shader program once, from whichever instanced
  // mesh draws first, and does not look at instanceColor again: a material shared by meshes with and without colours (matBark: trunks and mushrooms,
  // matFlower: stems and heads, matAnimal) drew nothing right, or threw "Cannot read properties of null (reading 'isInterleavedBufferAttribute')"
  // when a mesh without colours drew after one with. So all of them have colours.
  const buckets=new Map(), hasColor=true;
  for(const it of items){
    const cx=clamp(Math.floor((it.x-WX0)/CS),0,CHX-1), cz=clamp(Math.floor((it.z-WZ0)/CS),0,CHZ-1), k=cz*CHX+cx;
    let b=buckets.get(k); if(!b){ b=[]; buckets.set(k,b); } b.push(it);
  }
  buckets.forEach((list,k)=>{
    const cx=k%CHX, cz=Math.floor(k/CHX);
    let x0=1e9, x1=-1e9, y0=1e9, y1=-1e9, z0=1e9, z1=-1e9;
    for(const it of list){ const y=it.m.elements[13]; if(it.x<x0) x0=it.x; if(it.x>x1) x1=it.x; if(y<y0) y0=y; if(y>y1) y1=y; if(it.z<z0) z0=it.z; if(it.z>z1) z1=it.z; }
    const hg=o.hgt===undefined?16:o.hgt, rd=o.rad===undefined?5:o.rad;
    const sph=new THREE.Sphere(new THREE.Vector3((x0+x1)/2,(y0+y1+hg)/2,(z0+z1)/2), 0.5*Math.hypot(x1-x0+2*rd,y1-y0+hg,z1-z0+2*rd)+1);
    if(o.lods&&o.lods.length){ lodGroup(list,geo,o,mat,sph,hasColor,{x0,x1,z0,z1}); return; }
    const g=new THREE.BufferGeometry();
    for(const name in geo.attributes) g.setAttribute(name, geo.attributes[name]);
    g.boundingSphere=sph;
    const mesh=new THREE.InstancedMesh(g, mat, list.length);
    list.forEach((it,i)=>{ mesh.setMatrixAt(i,it.m); if(hasColor) mesh.setColorAt(i,it.c||WHITE); });
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor) mesh.instanceColor.needsUpdate=true;
    mesh.frustumCulled=true; mesh.castShadow=!!o.cast; mesh.receiveShadow=!!o.receive;
    scene.add(mesh);
    CHUNK_MESHES.push({mesh,x:WX0+(cx+0.5)*CS,z:WZ0+(cz+0.5)*CS,max:o.maxDist||0});
  });
}
// instances that have levels of detail: the matrices and colours stay here, each level's mesh (made when first needed) holds only the instances
// that are at its level now, packed to the front of its own buffers
const LODS=[], LOD_HY=6, LOD_FREE=150;   // LOD_HY: an instance keeps its level until it is this many metres past the switch distance; LOD_FREE: a group this much farther than it is drawn gives its buffers back
function lodGroup(list,geo,o,mat,sph,hasColor,bb){
  const n=list.length, xs=new Float32Array(n), zs=new Float32Array(n), src=new Float32Array(n*16), srcC=hasColor?new Float32Array(n*3):null;
  for(let i=0;i<n;i++){ const it=list[i]; src.set(it.m.elements,i*16); xs[i]=it.x; zs[i]=it.z; if(hasColor){ const c=it.c||WHITE; srcC[i*3]=c.r; srcC[i*3+1]=c.g; srcC[i*3+2]=c.b; } }
  const levels=[{geo,from:-1e9,frac:1,cast:!!o.cast}].concat(o.lods.map(l=>({geo:l.geo,from:l.from,frac:l.frac||1,cast:!!l.cast})));
  levels.forEach(L=>{ L.lim=Math.ceil(n*L.frac); L.mesh=null; });
  LODS.push({n,xs,zs,src,srcC,lvl:new Int8Array(n),levels,bb,lx:1e9,lz:1e9,cur:-9,freed:false,mat,o,sph,hasColor});
}
function lodMesh(g,j){
  const L=g.levels[j], cap=Math.max(1,L.lim), geo=new THREE.BufferGeometry();
  for(const name in L.geo.attributes) geo.setAttribute(name, L.geo.attributes[name]);
  geo.boundingSphere=g.sph.clone();
  const m=new THREE.InstancedMesh(geo, g.mat, cap);
  if(g.hasColor) m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3);
  m.frustumCulled=true; m.castShadow=L.cast; m.receiveShadow=!!g.o.receive; m.visible=false; m.count=0;
  scene.add(m); L.mesh=m; return m;
}
// a level's instance buffers are only as big as the level needs while the group is near: far away they are handed back (a world walked end to end
// held ~150 MB of them), and made again by lodAlloc when the group comes within range
function lodRelease(g){
  for(const L of g.levels){
    const m=L.mesh; if(!m||L.freed) continue;
    m.visible=false; m.count=0; m.dispose();   // (drops the GPU copies of its instance buffers)
    m.instanceMatrix=new THREE.BufferAttribute(new Float32Array(16),16); if(m.instanceColor) m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(3),3);
    L.freed=true;
  }
}
function lodAlloc(g,j){
  const L=g.levels[j], m=L.mesh, cap=Math.max(1,L.lim);
  m.instanceMatrix=new THREE.BufferAttribute(new Float32Array(cap*16),16);
  if(g.hasColor) m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3);
  L.freed=false;
}
function lodFill(g){   // pack every level's instances (g.lvl says which level each is at, -1 = none) into that level's mesh
  const K=g.levels.length, cnt=new Array(K).fill(0), src=g.src, srcC=g.srcC;
  g.freed=false;
  for(let i=0;i<g.n;i++){
    const j=g.lvl[i]; if(j<0) continue;
    const L=g.levels[j]; if(i>=L.lim) continue;
    if(!L.mesh) lodMesh(g,j); else if(L.freed) lodAlloc(g,j);
    const m=L.mesh, c=cnt[j]++, a=m.instanceMatrix.array, s0=i*16, d0=c*16;
    for(let k=0;k<16;k++) a[d0+k]=src[s0+k];   // (a plain loop: a subarray per instance made a few hundred thousand short-lived objects on every move)
    if(srcC){ const b=m.instanceColor.array; b[c*3]=srcC[i*3]; b[c*3+1]=srcC[i*3+1]; b[c*3+2]=srcC[i*3+2]; }
  }
  for(let j=0;j<K;j++){
    const m=g.levels[j].mesh; if(!m) continue;
    m.count=cnt[j]; m.visible=cnt[j]>0;
    if(cnt[j]){ m.instanceMatrix.updateRange.offset=0; m.instanceMatrix.updateRange.count=cnt[j]*16; m.instanceMatrix.needsUpdate=true;
      if(m.instanceColor){ m.instanceColor.updateRange.offset=0; m.instanceColor.updateRange.count=cnt[j]*3; m.instanceColor.needsUpdate=true; } }
  }
}
function updateLod(g,cx,cz,far){
  const lv=g.levels, K=lv.length, maxD=g.o.maxDist||far, b=g.bb;
  const dx=Math.max(b.x0-cx,0,cx-b.x1), dz=Math.max(b.z0-cz,0,cz-b.z1), dmin=Math.hypot(dx,dz);
  if(dmin>=maxD){
    if(g.cur!==-9){ for(const L of lv) if(L.mesh) L.mesh.visible=false; g.cur=-9; }
    if(dmin>=maxD+LOD_FREE&&!g.freed){ lodRelease(g); g.freed=true; }
    return;
  }
  const dmax=Math.hypot(Math.max(cx-b.x0,b.x1-cx),Math.max(cz-b.z0,b.z1-cz));
  const lev=d=>{ let j=0; while(j<K-1&&d>=lv[j+1].from) j++; return j; };
  const la=lev(dmin), lb=lev(dmax);
  if(la===lb&&dmax<maxD){   // the whole group is at one level
    if(g.cur!==la){ g.lvl.fill(la); g.cur=la; lodFill(g); }
    return;
  }
  if(g.cur===-1&&Math.hypot(cx-g.lx,cz-g.lz)<2.5) return;
  const first=g.cur!==-1; g.lx=cx; g.lz=cz; g.cur=-1;
  for(let i=0;i<g.n;i++){
    const ex=g.xs[i]-cx, ez=g.zs[i]-cz, d=Math.sqrt(ex*ex+ez*ez), p=first?-1:g.lvl[i];
    let j=d>=maxD?-1:lev(d);
    if(p>=0&&j>=0&&j!==p){ if(j>p?d<lv[p+1].from+LOD_HY:d>=lv[p].from-LOD_HY) j=p; }   // hysteresis
    g.lvl[i]=j;
  }
  lodFill(g);
}
// hide chunks of plants that are too far away to matter (beyond the fog, or grass beyond ~100 m)
const CHUNK_MESHES=[]; let cullT=0;
function cullChunks(dt){
  cullT-=dt; if(cullT>0) return; cullT=0.3; cullTerrain();
  const cx=camera.position.x, cz=camera.position.z, pad=CS*0.72, far=scene.fog.far+30;
  for(const c of CHUNK_MESHES){ const d=Math.hypot(c.x-cx,c.z-cz)-pad; c.mesh.visible=d<(c.max||far); }
  for(const g of LODS) updateLod(g,cx,cz,far);
}
function tint(hex,j){ j=j===undefined?0.12:j; const c=new THREE.Color(hex); c.multiplyScalar(1+(rand()-0.5)*j*2); c.offsetHSL((rand()-0.5)*0.02,0,0); return c; }

/* collision grid */
const colGrid=new Map(), CG=6;
const ck=(cx,cz)=>(cx+200)*1000+(cz+200);
function addCol(x,z,r){ const k=ck(Math.floor(x/CG),Math.floor(z/CG)); let a=colGrid.get(k); if(!a){ a=[]; colGrid.set(k,a); } a.push(x,z,r); }
function nearCols(x,z,fn){
  const cx=Math.floor(x/CG), cz=Math.floor(z/CG);
  for(let dx=-1;dx<=1;dx++) for(let dz=-1;dz<=1;dz++){ const a=colGrid.get(ck(cx+dx,cz+dz)); if(a) for(let i=0;i<a.length;i+=3) fn(a[i],a[i+1],a[i+2]); }
}
function canPlace(x,z,minD){ let ok=true; nearCols(x,z,(cx,cz)=>{ if(ok && Math.hypot(cx-x,cz-z)<minD) ok=false; }); return ok; }

