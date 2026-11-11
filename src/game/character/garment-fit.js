//@ Garment fit: the body's TRUE torso surface (the lathe buildTorso made) as a lookup, so details, trims, straps and shells lie on the bust, the belly and the flanks instead of on an estimate
/* The base garments used estimates of the body (torsoSize's ellipse, a depth on the centre line), so a button stood in the air beside a bust and a trim cut through it. buildTorso keeps its geometry on
   X.trsGeo; a lathe's vertices are a grid (column k round the body, ring j up it: index k*np+j), so the surface at (x, y) is found by crossing the rings, with no ray casting and no copy of the body's formulas
   (every slider, present and future, is in it). All values are in the spine's frame (metres; the front is -z); `yd` arguments are design heights (x D.TK).
   gfitAt(X,x,y,front) -> {x,y,z,nx,ny,nz} the surface point (y in metres) and its outward normal; gfitFz(X,D,x,yd) the front depth (negative z) at x; gfitDrape(X,geo,front) moves a geometry built in the
   SURFACE FRAME (x across, y up in metres, z = the offset OUT of the body, negative toward the front) onto the body; gfitSeat(X,D,geo,x,yd,lift,front) places a small detail; gfitRibbon / gfitCord lay a ribbon
   or a tube along a path of [x,yd] points on the surface; gfitShell(X,y0,y1,lift,o) an offset of the body between two heights (a belt, a hem, a waistcoat), optionally only some of the way round.
   owns: gfit*.   used by: model-garments.js, model-garments-more.js, model-dresses.js.   test: tools/garment-fit-smoke.js */
function gfitGrid(X){
  if(X.gfit) return X.gfit; const g=X.trsGeo; if(!g||!g.parameters||!g.parameters.points) return null;
  const np=g.parameters.points.length, ns=g.parameters.segments, p=g.attributes.position.array, n=g.attributes.normal.array, ys=[];
  for(let j=0;j<np;j++) ys.push(p[j*3+1]);
  return (X.gfit={np,ns,p,n,ys});
}
// one ring's front (or back) crossing at x: [z, nx, ny, nz] (outside the silhouette: the ring's nearest vertex on that side)
function gfitRing(G,j,x,front,o){
  const {np,ns,p,n}=G; let bz=front?1e9:-1e9, hit=false, zs=0;
  for(let k=0;k<ns;k++){ const a=(k*np+j)*3, b=((k+1)*np+j)*3, x0=p[a], x1=p[b]; zs+=p[a+2];
    if(x0!==x1&&x>=Math.min(x0,x1)-1e-9&&x<=Math.max(x0,x1)+1e-9){ const f=Math.min(1,Math.max(0,(x-x0)/(x1-x0))), z=p[a+2]+(p[b+2]-p[a+2])*f; if(front?z<bz:z>bz){ bz=z; hit=true; o[0]=z; o[1]=n[a]+(n[b]-n[a])*f; o[2]=n[a+1]+(n[b+1]-n[a+1])*f; o[3]=n[a+2]+(n[b+2]-n[a+2])*f; } } }
  if(!hit){ zs/=ns; let bd=1e9; for(let k=0;k<ns;k++){ const a=(k*np+j)*3, d=Math.abs(p[a]-x); if((front?p[a+2]<=zs:p[a+2]>=zs)&&d<bd){ bd=d; o[0]=p[a+2]; o[1]=n[a]; o[2]=n[a+1]; o[3]=n[a+2]; } } }
}
function gfitAt(X,x,y,front){
  const G=gfitGrid(X); if(!G) return {x,y,z:front?-0.1:0.1,nx:0,ny:0,nz:front?-1:1};
  const ys=G.ys, top=ys.length-1; y=Math.min(Math.max(y,ys[0]),ys[top]); let j=0, hi=top; while(hi-j>1){ const m=(j+hi)>>1; if(ys[m]<=y) j=m; else hi=m; }
  const a=[0,0,0,0], b=[0,0,0,0]; gfitRing(G,j,x,front!==false,a); gfitRing(G,j+1,x,front!==false,b);
  const d=ys[j+1]-ys[j], f=d>1e-7?(y-ys[j])/d:0, nx=a[1]+(b[1]-a[1])*f, ny=a[2]+(b[2]-a[2])*f, nz=a[3]+(b[3]-a[3])*f, l=Math.hypot(nx,ny,nz)||1;
  return {x,y,z:a[0]+(b[0]-a[0])*f,nx:nx/l,ny:ny/l,nz:nz/l};
}
const gfitFz=(X,D,x,yd)=>gfitAt(X,x,yd*D.TK,true).z;
const gfitBz=(X,D,x,yd)=>gfitAt(X,x,yd*D.TK,false).z;
// move a geometry built in the surface frame onto the body (z = the offset out of it: negative toward the front, positive toward the back)
function gfitDrape(X,g,front){
  const p=g.attributes.position, fr=front!==false;
  for(let i=0;i<p.count;i++){ const off=fr?-p.getZ(i):p.getZ(i), s=gfitAt(X,p.getX(i),p.getY(i),fr); p.setXYZ(i,s.x+s.nx*off,s.y+s.ny*off,s.z+s.nz*off); }
  g.computeVertexNormals(); return g;
}
// a small detail (built round the origin, z = its own thickness) seated on the surface at x and design height yd, `lift` metres out
function gfitSeat(X,D,g,x,yd,lift,front){ g.translate(x,yd*D.TK,front===false?lift:-lift); return gfitDrape(X,g,front); }
// a path of [x, yd] points on the surface, thickened to 3D points `lift` out and sampled about every 6 mm
function gfitPath(X,D,pts,lift,front){
  const out=[]; for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1], n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],(b[1]-a[1])*D.TK)/0.006));
    for(let k=(i?1:0);k<=n;k++){ const f=k/n, s=gfitAt(X,a[0]+(b[0]-a[0])*f,(a[1]+(b[1]-a[1])*f)*D.TK,front), l=pts[i].length>2?lift+(pts[i][2]||0):lift; out.push(new THREE.Vector3(s.x+s.nx*l,s.y+s.ny*l,s.z+s.nz*l)); } }
  return out;
}
// a ribbon of `width` laid ON the surface along a path of [x, yd] points: its edges are found on the body too (across the path in the x-y plane), so a wide strip follows a bust instead of standing off it
function gfitRibbon(X,D,pts,width,o){
  o=o||{}; const fr=o.front!==false, lift=o.lift||0.004, TK=D.TK, P=[];
  for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1], n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],(b[1]-a[1])*TK)/0.006)); for(let k=(i?1:0);k<=n;k++){ const f=k/n; P.push([a[0]+(b[0]-a[0])*f,(a[1]+(b[1]-a[1])*f)*TK]); } }
  const N=P.length, pos=new Float32Array(N*2*3), nor=new Float32Array(N*2*3), idx=[], w=width/2;
  for(let i=0;i<N;i++){ const a=P[Math.max(0,i-1)], b=P[Math.min(N-1,i+1)]; let tx=b[0]-a[0], ty=b[1]-a[1]; const l=Math.hypot(tx,ty)||1; tx/=l; ty/=l;
    for(let e=0;e<2;e++){ const sg=e?-1:1, s=gfitAt(X,P[i][0]-ty*w*sg,P[i][1]+tx*w*sg,fr), o3=(i*2+e)*3; pos[o3]=s.x+s.nx*lift; pos[o3+1]=s.y+s.ny*lift; pos[o3+2]=s.z+s.nz*lift; nor[o3]=s.nx; nor[o3+1]=s.ny; nor[o3+2]=s.nz; } }
  for(let i=0;i<N-1;i++){ const a=i*2, b=a+1, c=a+2, d=a+3; idx.push(a,c,b,b,c,d); }
  { let sm=0; for(let t=0;t<Math.min(idx.length,150);t+=3){ const A=idx[t]*3, B=idx[t+1]*3, C2=idx[t+2]*3, ux=pos[B]-pos[A], uy=pos[B+1]-pos[A+1], uz=pos[B+2]-pos[A+2], vx=pos[C2]-pos[A], vy=pos[C2+1]-pos[A+1], vz=pos[C2+2]-pos[A+2]; sm+=Math.sign((uy*vz-uz*vy)*nor[A]+(uz*vx-ux*vz)*nor[A+1]+(ux*vy-uy*vx)*nor[A+2]); }
    if(sm<0) for(let t=0;t<idx.length;t+=3){ const q=idx[t+1]; idx[t+1]=idx[t+2]; idx[t+2]=q; } }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3)); g.setIndex(idx); return g;
}
function gfitCord(X,D,pts,rad,o){ o=o||{}; const fr=o.front!==false, P=gfitPath(X,D,pts,o.lift||0.005,fr); return sweepTube(P,P.map((q,i)=>typeof rad==='function'?rad(i/(P.length-1)):rad),4,{cap:'round',rings:Math.max(6,P.length)}); }
/* an offset of the torso between heights y0 and y1 (metres): the lathe's own rings between them (the cut ends exact), each column moved `lift` along its normal. o.a0 / o.a1: only the angles between them,
   measured from the front (0 = the front, +-PI = the back; the cut ends exact, between columns); o.rows: extra heights to cut a row at (a crisp colour edge: two a hair apart); o.dy(ang,x): how far to move the whole band down in that column (a scoop under the arm); o.lim(ang,x): [lowest y, highest y] for the column at that angle (x = where it is across the body) (an armhole, a V neck). Winding as loftRings. */
function gfitShell(X,y0,y1,lift,o){
  o=o||{}; const G=gfitGrid(X); if(!G) return new THREE.BufferGeometry();
  const {np,ns,p,n,ys}=G, a0=o.a0===undefined?-Math.PI:o.a0, a1=o.a1===undefined?Math.PI:o.a1, rows=[y0]; for(const y of ys) if(y>y0+1e-5&&y<y1-1e-5&&(!rows.length||y>rows[rows.length-1]+1e-5)) rows.push(y); for(const y of (o.rows||[])) if(y>y0+1e-5&&y<y1-1e-5) rows.push(y); rows.sort((a,b)=>a-b); rows.push(y1);
  const S=(o.lim||o.dy)?2:1, cols=[]; for(let k=0;k<=ns*S;k++){ const ang=(k/(ns*S))*TAU-Math.PI; if(ang>a0+1e-6&&ang<a1-1e-6) cols.push(ang); } cols.unshift(a0); cols.push(a1);   // (the seam is behind: -PI = +PI)
  const col=(ang,y)=>{ const f=(ang+Math.PI)/TAU*ns, k=Math.min(ns-1,Math.floor(f+1e-9)), t=f-k; y=Math.min(Math.max(y,ys[0]),ys[np-1]); let j=0, hi=np-1; while(hi-j>1){ const m=(j+hi)>>1; if(ys[m]<=y) j=m; else hi=m; }
    const d=ys[j+1]-ys[j], u=d>1e-7?(y-ys[j])/d:0, v=(kk,jj,c)=>p[(kk*np+jj)*3+c], w=(kk,jj,c)=>n[(kk*np+jj)*3+c], pt=c=>{ const A=lerp(v(k,j,c),v(k,j+1,c),u), B=lerp(v(k+1,j,c),v(k+1,j+1,c),u); return lerp(A,B,t); }, nn=c=>{ const A=lerp(w(k,j,c),w(k,j+1,c),u), B=lerp(w(k+1,j,c),w(k+1,j+1,c),u); return lerp(A,B,t); };
    const nx=nn(0), ny=nn(1), nz=nn(2), l=Math.hypot(nx,ny,nz)||1; const hn=Math.hypot(nx,nz)/l||1, dd=lift/Math.max(hn,0.55);   // the offset is HORIZONTAL (the row's height is kept exactly, so a band's edges run level all the way round), as far as a slope needs to clear the surface by `lift`
    return [pt(0)+nx/l/Math.max(hn,1e-6)*dd,y,pt(2)+nz/l/Math.max(hn,1e-6)*dd,nx/l,ny/l,nz/l]; };
  const R=rows.length, C=cols.length, pos=new Float32Array(R*C*3), nor=new Float32Array(R*C*3), idx=[];
  for(let c=0;c<C;c++){ const ang=cols[c], xm=(o.lim||o.dy)?col(ang,(y0+y1)/2)[0]:0, lim=o.lim?o.lim(ang,xm):null, dy=o.dy?o.dy(ang,xm):0;   // (lim and dy are asked the column's real x, at the shell's middle)
    for(let r=0;r<R;r++){ let y=rows[r]-dy; if(lim) y=Math.min(Math.max(y,lim[0]),lim[1]); const q=col(ang,y), i=(r*C+c)*3; pos[i]=q[0]; pos[i+1]=q[1]; pos[i+2]=q[2]; nor[i]=q[3]; nor[i+1]=q[4]; nor[i+2]=q[5]; } }
  for(let r=0;r<R-1;r++) for(let c=0;c<C-1;c++){ const a=r*C+c, b=a+1, d=a+C, e=d+1; idx.push(a,d,b,b,d,e); }   // (loftRings's winding: ring up, then column on)
  { let s=0; for(let t=0;t<Math.min(idx.length,300);t+=3){ const A=idx[t]*3, B=idx[t+1]*3, C2=idx[t+2]*3, ux=pos[B]-pos[A], uy=pos[B+1]-pos[A+1], uz=pos[B+2]-pos[A+2], vx=pos[C2]-pos[A], vy=pos[C2+1]-pos[A+1], vz=pos[C2+2]-pos[A+2], fx=uy*vz-uz*vy, fy=uz*vx-ux*vz, fz=ux*vy-uy*vx; s+=Math.sign(fx*nor[A]+fy*nor[A+1]+fz*nor[A+2]); }
    if(s<0) for(let t=0;t<idx.length;t+=3){ const q=idx[t+1]; idx[t+1]=idx[t+2]; idx[t+2]=q; } }   // (facing outward: whichever way the angles ran)
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3)); g.setIndex(idx); return g;
}
