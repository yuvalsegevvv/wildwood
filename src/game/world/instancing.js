//@ Chunked instanced meshes, distance culling, tree collision grid (addCol, nearCols)
/* ---------- instancing ---------- */
const CH=8, CS=SIZE/CH;
const _q=new THREE.Quaternion(), _e=new THREE.Euler(), _p=new THREE.Vector3(), _s=new THREE.Vector3();
function mtx(x,y,z,ry,sx,sy,sz,tx,tz){ _e.set(tx||0,ry,tz||0); _q.setFromEuler(_e); _p.set(x,y,z); _s.set(sx,sy,sz); return new THREE.Matrix4().compose(_p,_q,_s); }
function addInstanced(geo, mat, items, o){
  o=o||{};
  const buckets=new Map(), hasColor=items.some(i=>i.c);
  for(const it of items){
    const cx=clamp(Math.floor((it.x+HALF)/CS),0,CH-1), cz=clamp(Math.floor((it.z+HALF)/CS),0,CH-1), k=cz*CH+cx;
    let b=buckets.get(k); if(!b){ b=[]; buckets.set(k,b); } b.push(it);
  }
  buckets.forEach((list,k)=>{
    const cx=k%CH, cz=Math.floor(k/CH), g=new THREE.BufferGeometry();
    for(const name in geo.attributes) g.setAttribute(name, geo.attributes[name]);
    g.boundingSphere=new THREE.Sphere(new THREE.Vector3(-HALF+(cx+0.5)*CS, 12, -HALF+(cz+0.5)*CS), CS*0.75+25);
    const mesh=new THREE.InstancedMesh(g, mat, list.length);
    list.forEach((it,i)=>{ mesh.setMatrixAt(i,it.m); if(hasColor) mesh.setColorAt(i,it.c||WHITE); });
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor) mesh.instanceColor.needsUpdate=true;
    mesh.castShadow=!!o.cast; mesh.receiveShadow=!!o.receive;
    scene.add(mesh);
    CHUNK_MESHES.push({mesh,x:g.boundingSphere.center.x,z:g.boundingSphere.center.z,max:o.maxDist||0});
  });
}
// hide chunks of plants that are too far away to matter (beyond the fog, or grass beyond ~100 m)
const CHUNK_MESHES=[]; let cullT=0;
function cullChunks(dt){
  cullT-=dt; if(cullT>0) return; cullT=0.3;
  const cx=camera.position.x, cz=camera.position.z, pad=CS*0.72;
  for(const c of CHUNK_MESHES){ const d=Math.hypot(c.x-cx,c.z-cz)-pad; c.mesh.visible=d<(c.max||scene.fog.far+30); }
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

