//@ Character geometry helpers: Phong material, smooth normals, vertex colours, limbs whose ends match their neighbours (limb), swept tubes (sweepTube), shells
/* ---------- helpers for the hiker's meshes (character/model*.js) ---------- */
const csph=(r,w,h)=>new THREE.SphereGeometry(r,w||10,h||8);
/* OUTFITS: the signature outfits (game/outfits/<id>.js). OUTFITS[id]=(X,D)=>kit builds one character's kit when look.model is that id; the hooks of a kit (what the body
   builders ask it) are listed in docs/CHARACTER.md section 9. Declared here because every outfit file loads after this one. */
// a box moved to a place; defined here because the hiker is built when the page loads (rebuildHiker in model.js), long before village/buildings.js runs, and a saved signature outfit or hair style uses it
const vbox=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x||0,y||0,z||0);
const OUTFITS=Object.create(null);   // (no prototype: look.model comes from other players, and 'constructor' / '__proto__' found Object's members here and made buildCharacter throw for everyone who saw them)
const matGlow=new THREE.MeshBasicMaterial({vertexColors:true});   // unlit vertex colours: a lantern's paper, a vial, an ember (an outfit's glow; never a light source)
// Phong lights every pixel from the interpolated normal; Lambert (per-vertex light) showed each triangle's edges on bodies
const matChar=new THREE.MeshPhongMaterial({vertexColors:true,shininess:6,specular:0x0b0b0b});
const _tint=new THREE.Color();
function plaid(c,base,u,v){
  c.set(base);
  const a=((u*15)%1+1)%1<0.32, b=((v*15)%1+1)%1<0.32;
  if(a) c.multiplyScalar(0.6); if(b) c.multiplyScalar(0.6);
  if((((u*15+0.5)%1+1)%1<0.08)||(((v*15+0.5)%1+1)%1<0.08)) c.lerp(_tint.set(0xeadfc4),0.35);
}
// smooth normals that also match across seams: a lathe/sphere repeats its first column of vertices, and
// computeVertexNormals gives the two copies different normals, which drew a visible line down the body
function smoothN(g){ g.computeVertexNormals(); const p=g.attributes.position, n=g.attributes.normal, acc=new Map(), key=i=>Math.round(p.getX(i)*1e4)+','+Math.round(p.getY(i)*1e4)+','+Math.round(p.getZ(i)*1e4);
  for(let i=0;i<p.count;i++){ const k=key(i), a=acc.get(k)||[0,0,0]; a[0]+=n.getX(i); a[1]+=n.getY(i); a[2]+=n.getZ(i); acc.set(k,a); }
  for(let i=0;i<p.count;i++){ const a=acc.get(key(i)), l=Math.hypot(a[0],a[1],a[2])||1; n.setXYZ(i,a[0]/l,a[1]/l,a[2]/l); }
  return g; }
function densify(prof,k){ const out=[]; for(let i=0;i<prof.length-1;i++){ for(let j=0;j<k;j++){ const f=j/k; out.push([lerp(prof[i][0],prof[i+1][0],f), lerp(prof[i][1],prof[i+1][1],f)]); } } out.push(prof[prof.length-1]); return out; }
// oy: the part's offset down the body, so the tint noise continues across a joint (a limb's own y restarts at its joint: without it the shin is a shade off the thigh)
function pc(g,fn,oy){ const one=fn.length===1, o=oy||0; return paint(g,(x,y,z,nx,ny,nz,c)=>{ if(one) fn(c); else fn(x,y,z,c); c.multiplyScalar(0.985+0.03*noise2(x*7+z*5,(y+o)*7-z*3)); }); }   // a faint, smooth variation (a per-vertex hash speckled every triangle)
function solid(g,hex){ return pc(g,(x,y,z,c)=>c.set(hex)); }
function shell(r,t0,tl,gap,tilt,w,h){
  const g=new THREE.SphereGeometry(r,w||22,h||12, gap?1.5*Math.PI+gap/2:0, gap?TAU-gap:TAU, t0, tl);
  if(tilt) g.rotateX(tilt);
  return g;
}

/* A surface of rings, top to bottom: rings = [{y, rx, rz, zc}] (an ellipse of half-widths rx, rz around (0, y, zc)), seg points round each.
   Indexed, with smooth normals that match across the seam. */
function loftRings(rings,seg){
  const n=rings.length, pos=new Float32Array(n*(seg+1)*3), idx=[];
  for(let i=0;i<n;i++){ const r=rings[i]; for(let j=0;j<=seg;j++){ const a=j/seg*TAU, o=(i*(seg+1)+j)*3; pos[o]=Math.max(1e-4,r.rx)*Math.sin(a); pos[o+1]=r.y; pos[o+2]=Math.max(1e-4,r.rz)*Math.cos(a)+(r.zc||0); } }
  for(let i=0;i<n-1;i++) for(let j=0;j<seg;j++){ const a=i*(seg+1)+j, b=a+1, c=a+seg+1, d=c+1; idx.push(a,c,b,b,c,d); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); return smoothN(g);
}
/* A limb hanging from y=0 down to y=-len whose cross-section changes smoothly along its length.
   st = stations [t, rx, rz, zOff] from the top (t=0) to the bottom (t=1), joined by a smooth (Catmull-Rom, never overshooting) curve, so a limb has no beads at its stations.
   Both ends are closed by a ball of that end section's size: a joint turns like a ball in its socket, and a neighbour that starts with the SAME section
   (elbow, knee: the caller shares one constant) continues the surface with no step, which is what removes the "separate sausages" look.
   o.cuts = [t...]: stations where the caller changes colour (a hem, a cuff); two rings 1 mm apart are put there so the colour edge is crisp, not a gradient over a ring's height.
   The cap's rings are spaced quadratically so the first one is almost on the joint plane: the end normals are then radial on both sides and the joint shades without a line.
   The caps are `margin` (0.7 mm) smaller than the end section, so the neighbour's surface always wins where they overlap: two surfaces that touch with the same
   radius and slope z-fight along the ring (a ragged line at every joint). */
function limb(st,len,seg,rings,o){
  o=o||{}; const nc=o.cap||5, n=st.length, mg=o.margin===undefined?0.0007:o.margin;
  const m=[1,2,3].map(c=>{ const out=[]; for(let i=0;i<n;i++){ const a=st[Math.max(0,i-1)], b=st[Math.min(n-1,i+1)], dt=(b[0]-a[0])||1; let s=((b[c]||0)-(a[c]||0))/dt;
    const l=i>0?((st[i][c]||0)-(st[i-1][c]||0)):0, r=i<n-1?((st[i+1][c]||0)-(st[i][c]||0)):0; if(l*r<=0) s=0; out.push(s); } return out; });
  const at=t=>{ let i=1; while(i<n-1&&t>st[i][0]) i++; const a=st[i-1], b=st[i], h=(b[0]-a[0])||1, u=clamp((t-a[0])/h), u2=u*u, u3=u2*u;
    return [1,2,3].map((c,ci)=>(2*u3-3*u2+1)*(a[c]||0)+(u3-2*u2+u)*h*m[ci][i-1]+(-2*u3+3*u2)*(b[c]||0)+(u3-u2)*h*m[ci][i]); };
  const R=[], top=at(0), bot=at(1), rcT=(top[0]+top[1])*0.5*0.92, rcB=(bot[0]+bot[1])*0.5*0.92;
  if(!o.openTop) for(let i=nc;i>=1;i--){ const b=Math.pow(i/nc,2)*Math.PI/2; R.push({y:Math.sin(b)*rcT,rx:Math.cos(b)*(top[0]-mg),rz:Math.cos(b)*(top[1]-mg),zc:top[2]}); }
  const ts=[]; for(let i=0;i<=rings;i++) ts.push(i/rings); for(const c of (o.cuts||[])){ const e=0.0005/len; ts.push(c-e,c+e); } ts.sort((a,b)=>a-b);
  for(const t of ts){ const s=at(t); R.push({y:-len*t,rx:s[0],rz:s[1],zc:s[2]}); }
  if(!o.openBottom) for(let i=1;i<=nc;i++){ const b=Math.pow(i/nc,2)*Math.PI/2; R.push({y:-len-Math.sin(b)*rcB,rx:Math.cos(b)*(bot[0]-mg),rz:Math.cos(b)*(bot[1]-mg),zc:bot[2]}); }
  return loftRings(R,seg);
}
/* A sweepTube swept along a smooth curve through pts ([x,y,z] points): hair locks, fingers, braids, ahoge, eyelashes.
   rad: radius at each point (an array as long as pts, spread evenly along the curve) or a function of 0..1. o.rings: samples along it; o.cap: 'round' (default) ends
   in a small dome, 'point' tapers to a point (radius is multiplied down over the last 12%), 'none' leaves the ends open (hidden inside something). */
function sweepTube(pts,rad,seg,o){
  o=o||{}; const V=pts.map(p=>p.isVector3?p:new THREE.Vector3(p[0],p[1],p[2])), cv=new THREE.CatmullRomCurve3(V,false,'catmullrom',0.5);
  const rings=o.rings||Math.max(5,V.length*3), cap=o.cap||'round';
  const rf=typeof rad==='function'?rad:u=>{ const x=u*(rad.length-1), i=Math.min(rad.length-2,Math.floor(x)), f=x-i; return lerp(rad[i],rad[i+1],f*f*(3-2*f)); };
  const P=[], T=[], Rr=[];
  for(let i=0;i<=rings;i++){ const u=i/rings; P.push(cv.getPoint(u)); T.push(cv.getTangent(u).normalize()); let r=rf(u); if(cap==='point'&&u>0.88) r*=1-(u-0.88)/0.12*0.92; Rr.push(Math.max(1e-4,r)); }
  if(cap==='round'){ const re=Rr[rings], te=T[rings]; for(let k=1;k<=3;k++){ const b=k/3*Math.PI/2; P.push(P[rings].clone().addScaledVector(te,Math.sin(b)*re)); T.push(te); Rr.push(Math.max(1e-4,Math.cos(b)*re)); } }
  const n=P.length, pos=new Float32Array(n*(seg+1)*3), nor=new Float32Array(n*(seg+1)*3), idx=[];
  let N=new THREE.Vector3(Math.abs(T[0].y)<0.9?0:1,Math.abs(T[0].y)<0.9?1:0,0); N.addScaledVector(T[0],-N.dot(T[0])).normalize();
  const B=new THREE.Vector3(), d=new THREE.Vector3();
  for(let i=0;i<n;i++){
    N.addScaledVector(T[i],-N.dot(T[i])).normalize(); B.crossVectors(T[i],N);
    const ds=i<n-1?P[i+1].distanceTo(P[i]):P[i].distanceTo(P[i-1]), dr=(i<n-1?Rr[i+1]-Rr[i]:Rr[i]-Rr[i-1])/(ds||1);
    for(let j=0;j<=seg;j++){ const a=j/seg*TAU, o3=(i*(seg+1)+j)*3; d.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(B,Math.sin(a));
      pos[o3]=P[i].x+d.x*Rr[i]; pos[o3+1]=P[i].y+d.y*Rr[i]; pos[o3+2]=P[i].z+d.z*Rr[i];
      d.addScaledVector(T[i],-dr).normalize(); nor[o3]=d.x; nor[o3+1]=d.y; nor[o3+2]=d.z; }
  }
  for(let i=0;i<n-1;i++) for(let j=0;j<seg;j++){ const a=i*(seg+1)+j, b=a+1, c=a+seg+1, e=c+1; idx.push(a,b,c,b,e,c); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3)); g.setIndex(idx); return g;
}
// a sweepTube from a list of {x,y,z,r} stations: sweepTube() with the radii taken from them
const sweepTubeR=(st,seg,o)=>sweepTube(st.map(s=>[s.x,s.y,s.z]),st.map(s=>s.r),seg,o);
