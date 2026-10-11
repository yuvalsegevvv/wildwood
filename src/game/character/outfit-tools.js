//@ Helpers for the signature outfits (game/outfits/*.js): the torso's size at a height, flat ribbons, lofts over an arc, rings round a path
/* ---------- outfit helpers (docs/CHARACTER.md section 9) ----------
   Every outfit part is a painted geometry (pc / solid) in the frame of the node it hangs from. These build the shapes a garment needs that the character helpers (limb, loftRings,
   sweepTube) do not: a flat cloth strip, a panel that covers only part of the body's circumference, a ring round a curve. */

// the torso's half-width and half-depth (metres, in the spine's frame) at design height yd (0 = the hips' line, 0.55 = the neck's base), with the sliders applied: where cloth lies on the body
function torsoSize(X,D,yd){
  const {S,fem}=X, B=D.B, r=profR(fem?TORSO_F:TORSO_M,yd), up=faceSm(0.22,0.4,yd), gw=faceG(yd,fem?0.215:0.15,0.11), gh=faceG(yd,-0.03,0.1), belly=faceG(yd,0.1,0.13)*(B-1)*1.4;
  const rz=r*(fem?0.66:0.62)*B*(1+(S.waist-1)*0.7*gw+(S.hips-1)*0.5*gh+(S.shoulders-1)*0.2*up);
  // rz is the front (the belly and the stomach pushed out, a woman's bust); rzBack the back (a third of the belly, the shoulder blades, the glutes): cloth on the back must clear these or the body shows through
  return {rx:r*B*(fem?1:1.04)*(1+(S.shoulders-1)*up+(S.waist-1)*gw+(S.hips-1)*gh), rz:rz*(1+belly)+0.008*faceG(yd,0.1,0.08)+(fem?0.034*D.lr*S.chest*faceG(yd,0.315-0.012*(S.chest-1),0.06):0),   // (a woman's front includes the bust)
    rzBack:rz*(1+belly*0.3)+0.012*B*faceG(yd,0.37,0.07)+(fem?0.034:0.022)*B*faceG(yd,0,0.055)};
}
/* A flat ribbon (sash, pennant, strap, feather, tail of a bow) along a smooth curve through pts ([x,y,z]); width: a number or a function of 0..1 along it; both faces are drawn
   (two thin sheets back to back), so it shows from either side. o.up = the direction the flat face looks at (default -z, the front); o.th = its thickness; o.seg = samples. */
function ofRibbon(pts,width,o){
  o=o||{}; const V=pts.map(p=>p.isVector3?p:new THREE.Vector3(p[0],p[1],p[2])), cv=new THREE.CatmullRomCurve3(V,false,'catmullrom',0.5), seg=o.seg||Math.max(6,V.length*5), th=(o.th||0.0025)/2;
  const wf=typeof width==='function'?width:()=>width, up=o.up?new THREE.Vector3(o.up[0],o.up[1],o.up[2]):new THREE.Vector3(0,0,-1);
  const pos=new Float32Array((seg+1)*4*3), nor=new Float32Array((seg+1)*4*3), idx=[], n=new THREE.Vector3(), b=new THREE.Vector3();
  for(let i=0;i<=seg;i++){ const u=i/seg, p=cv.getPoint(u), t=cv.getTangent(u).normalize(), w=wf(u)/2;
    n.copy(up).addScaledVector(t,-up.dot(t)); if(n.lengthSq()<1e-6) n.set(1,0,0).addScaledVector(t,-t.x); n.normalize(); b.crossVectors(t,n).normalize();
    const put=(k,sx,sn)=>{ const o3=(i*4+k)*3; pos[o3]=p.x+b.x*w*sx+n.x*th*sn; pos[o3+1]=p.y+b.y*w*sx+n.y*th*sn; pos[o3+2]=p.z+b.z*w*sx+n.z*th*sn; nor[o3]=n.x*sn; nor[o3+1]=n.y*sn; nor[o3+2]=n.z*sn; };
    put(0,1,1); put(1,-1,1); put(2,1,-1); put(3,-1,-1); }
  for(let i=0;i<seg;i++){ const a=i*4, c=a+4;
    // the sheet facing +n (vertices 0, 1) and the sheet facing -n (2, 3): the winding is chosen from the first segment's geometry so that each one's front side is the side its normal points to
    idx.push(a,c,a+1, a+1,c,c+1,  a+2,a+3,c+2, a+3,c+3,c+2); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3)); g.setIndex(idx);
  // check the winding of the first +n triangle against its normal and flip every triangle if it is the wrong way round (the curve's handedness decides it)
  { const p=g.attributes.position, ix=g.index.array, A=new THREE.Vector3().fromBufferAttribute(p,ix[0]), B2=new THREE.Vector3().fromBufferAttribute(p,ix[1]), C=new THREE.Vector3().fromBufferAttribute(p,ix[2]);
    const fn=new THREE.Vector3().crossVectors(B2.sub(A),C.sub(A)); if(fn.dot(new THREE.Vector3(nor[0],nor[1],nor[2]))<0) for(let i=0;i<ix.length;i+=3){ const t=ix[i+1]; ix[i+1]=ix[i+2]; ix[i+2]=t; } }
  return g;
}
/* loftRings over an arc: the same rings [{y, rx, rz, zc}] but only from angle a0 to a1 (a = 0 is the back, PI the front, +x at PI/2): a tabard's front panel is the arc PI +- 0.9, a cape the back's.
   An open strip, smooth normals; it is one-sided like loftRings, so it shows from outside only (the body is behind it). */
function ofLoft(rings,seg,a0,a1){
  const n=rings.length, pos=new Float32Array(n*(seg+1)*3), idx=[];
  for(let i=0;i<n;i++){ const r=rings[i]; for(let j=0;j<=seg;j++){ const a=a0+(a1-a0)*j/seg, o=(i*(seg+1)+j)*3; pos[o]=Math.max(1e-4,r.rx)*Math.sin(a); pos[o+1]=r.y; pos[o+2]=Math.max(1e-4,r.rz)*Math.cos(a)+(r.zc||0); } }
  for(let i=0;i<n-1;i++) for(let j=0;j<seg;j++){ const a=i*(seg+1)+j, b=a+1, c=a+seg+1, d=c+1; idx.push(a,c,b,b,c,d); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); return smoothN(g);
}
/* A patch of fine grid on a surface, for an emblem, a badge or a buckle whose edges must be crisp (vertex colours blur over one cell, and the body's own mesh is coarse): the rectangle
   x0..x1, y0..y1 in nx x ny cells, each vertex at (x, y, surf(x, y)); front: true for a patch that faces -z. Paint it with pc / paint; put it a millimetre off the surface in surf. */
function ofPatch(x0,x1,y0,y1,nx,ny,surf,front){
  const pos=new Float32Array((nx+1)*(ny+1)*3), idx=[];
  for(let j=0;j<=ny;j++) for(let i=0;i<=nx;i++){ const x=lerp(x0,x1,i/nx), y=lerp(y0,y1,j/ny), o=(j*(nx+1)+i)*3; pos[o]=x; pos[o+1]=y; pos[o+2]=surf(x,y); }
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){ const a=j*(nx+1)+i, b=a+1, c=a+nx+1, d=c+1; if(front) idx.push(a,c,b,b,c,d); else idx.push(a,b,c,b,d,c); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); return smoothN(g);
}
// a torus (R = the ring's radius, r = the tube's) centred on point p with its axis along direction t: a cord, a band or a ring round a braid, a limb, a handle
function ofRingAt(p,t,R,r,seg){
  const g=new THREE.TorusGeometry(R,r,seg||6,seg?seg*3:18), q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(t[0],t[1],t[2]).normalize());
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)); return g.translate(p[0],p[1],p[2]);
}
// a colour from a hex, cached (a paint function that runs once per vertex must not allocate)
const _ofC={}; const ofCol=h=>_ofC[h]||(_ofC[h]=new THREE.Color(h));
