//@ Shared helpers for the monster models (monster-*.js): the MODELS registry, lofted bodies, tapered bones, curved tubes, horns, lumpy blobs, scale plates
/* One entry per model family in MODELS, filled by the monster-*.js files (they load before monsters.js, which only dispatches):
     geo(d,p)          the shared geometry of one kind (cached in MON_GEO): an object of merged geometries, built once
     build(d,G,M,g,P0) one monster's meshes and pivots: M(geo) is a mesh with that monster's material, g its group, P0 the parts animate() moves
     anim(m,dt,sp,lunge) poses it each frame (m.parts is P0; sp its speed in m/s, lunge the forward jab of an attack, 0..0.45 scaled)
   Models face -z. Units are metres at scale 1 (the def's scale enlarges the group). Colours are vertex colours: paint with pc(geo,(x,y,z,c)=>...)
   or, from here, moLoft / moTube / moBone, all of which take a colour number or a paint function. */
const MODELS={};
const moQ=n=>typeof VD!=='undefined'&&VD<2?Math.max(5,Math.round(n*0.62)):n;   // segment counts: phones and light mode get fewer
const moV=(x,y,z)=>new THREE.Vector3(x,y,z);
const moCol=f=>typeof f==='function'?f:(x,y,z,c)=>c.set(f);
const moTint=(c,hex,k)=>c.lerp(_tint.set(hex),k);
const moNoise=(x,y,z,f)=>vn3(x*f,y*f,z*f);   // smooth 0..1 noise, for skin, bark and fur patterns
// a tapered bar from A to B ([x,y,z] or vectors), radius r0 at A and r1 at B
function moBone(A,B,r0,r1,f,seg){
  const a=Array.isArray(A)?moV(A[0],A[1],A[2]):A, b=Array.isArray(B)?moV(B[0],B[1],B[2]):B, dir=b.clone().sub(a), L=dir.length()||1e-4;
  const q=new THREE.Quaternion().setFromUnitVectors(moV(0,1,0),dir.normalize());
  return pc(cyl(r1,r0,L,seg||6).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)).translate((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2),moCol(f));
}
// n points along a smooth (Catmull-Rom) curve through pts ([x,y,z] each)
function moCurve(pts,n){
  const out=[], m=pts.length-1;
  for(let i=0;i<n;i++){
    const u=i/(n-1)*m, k=Math.min(m-1,Math.floor(u)), t=u-k, p0=pts[Math.max(0,k-1)], p1=pts[k], p2=pts[k+1], p3=pts[Math.min(m,k+2)];
    const cr=j=>0.5*(2*p1[j]+(p2[j]-p0[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t*t+(3*p1[j]-p0[j]-3*p2[j]+p3[j])*t*t*t);
    out.push([cr(0),cr(1),cr(2)]);
  }
  return out;
}
// a curved tube through pts: radius r0 at the start narrowing to r1 at the end (rf(t,a) reshapes it: bulges, furrows); cap closes the far end to a point
function moTube(pts,r0,r1,f,seg,cap,rf){
  const cf=moCol(f), c=moCurve(pts,Math.max(4,pts.length*2));
  return tube(c,(t,a)=>lerp(r0,r1,t)*(rf?rf(t,a):1),seg||6,(x,y,z,col)=>{ cf(x,y,z,col); col.multiplyScalar(0.985+0.03*noise2(x*7+z*5,y*7-z*3)); },cap!==false);
}
// a horn, claw or thorn: a curved cone from `base` heading `dir`, length len, base radius r, turning toward `up` by about `curl`
function moHorn(base,dir,len,r,curl,f,seg,up){
  const d=moV(dir[0],dir[1],dir[2]).normalize(), u=up?moV(up[0],up[1],up[2]):moV(0,1,0), pts=[], n=4;
  let p=moV(base[0],base[1],base[2]), dd=d.clone();
  for(let i=0;i<=n;i++){ pts.push([p.x,p.y,p.z]); p=p.clone().addScaledVector(dd,len/n); dd=dd.clone().addScaledVector(u,curl/n).normalize(); }
  return moTube(pts,r,r*0.05,f,seg||6,true);
}
// a lofted body: rings [{y,rx,rz,x?,z?}] from the bottom up, each an ellipse in a horizontal plane centred at (x,z); the ends close to a point. Smooth normals.
function moLoft(rings,sides,f,zaxis){
  const P=[], I=[], n=rings.length, S=sides||16;
  for(const r of rings) for(let k=0;k<S;k++){ const a=k/S*TAU; P.push((r.x||0)+Math.cos(a)*r.rx,r.y,(r.z||0)+Math.sin(a)*r.rz); }
  const b=P.length/3; P.push(rings[0].x||0,rings[0].y,rings[0].z||0); P.push(rings[n-1].x||0,rings[n-1].y,rings[n-1].z||0);
  for(let i=0;i<n-1;i++) for(let k=0;k<S;k++){ const k1=(k+1)%S, a=i*S+k, bq=i*S+k1, c=(i+1)*S+k1, d=(i+1)*S+k; I.push(a,d,bq,bq,d,c); }
  for(let k=0;k<S;k++){ const k1=(k+1)%S; I.push(b,k,k1,b+1,(n-1)*S+k1,(n-1)*S+k); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setIndex(I); g.computeVertexNormals();
  if(zaxis) g.rotateX(-Math.PI/2);
  return pc(smoothN(g),moCol(f));
}
// the same lofted along the z axis (a quadruped's trunk): rings [{z,rx,ry,y?,x?}] from the front (smallest z) to the back, each an ellipse in an xy plane
function moLoftZ(rings,sides,f){ return moLoft(rings.slice().reverse().map(r=>({y:-r.z,rx:r.rx,rz:r.ry,x:r.x||0,z:r.y||0})),sides,f,true); }
// pushes the vertices of a sphere-like geometry (built at the origin, before scaling) in and out by noise, amp a share of the radius; then smooths normals
function moLump(g,amp,freq,seed){
  const p=g.attributes.position, v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i); const k=1+amp*(moNoise(v.x+seed,v.y-seed,v.z,freq)-0.5)*2; p.setXYZ(i,v.x*k,v.y*k,v.z*k); }
  return smoothN(g);
}
// an ellipsoid at (x,y,z) with radii (rx,ry,rz), painted by f; rot: [rx,ry,rz] Euler turn applied before moving it
function moEll(rx,ry,rz,x,y,z,f,rot,seg){
  const g=csph(1,seg||12,Math.max(6,Math.round((seg||12)*0.7))).scale(rx,ry,rz);
  if(rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rot[0]||0,rot[1]||0,rot[2]||0)));
  return pc(smoothN(g.translate(x,y,z)),moCol(f));
}
// a cone from base (b) along dir for len, with base radius r: teeth, thorns, studs, claws (straight; moHorn curves)
function moCone(b,dir,len,r,f,seg){
  const d=moV(dir[0],dir[1],dir[2]).normalize(), q=new THREE.Quaternion().setFromUnitVectors(moV(0,1,0),d);
  const g=new THREE.ConeGeometry(r,len,seg||5).translate(0,len/2,0).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)).translate(b[0],b[1],b[2]);
  return pc(g,moCol(f));
}
// a flat lump lying on a surface: centre c, outward normal n, radius r, thickness th (spots, warts, petals, barnacles, scales, studs)
function moPatch(c,n,r,th,f,seg,sq){
  const q=new THREE.Quaternion().setFromUnitVectors(moV(0,1,0),moV(n[0],n[1],n[2]).normalize());
  const g=csph(1,seg||8,Math.max(5,Math.round((seg||8)*0.7))).scale(r,th,r*(sq||1)).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)).translate(c[0],c[1],c[2]);
  return pc(smoothN(g),moCol(f));
}
const moMerge=list=>merge(list.flat().filter(Boolean));   // merge accepts nested lists and skips gaps, so builders can add parts conditionally
