//@ Detailed plant models for the desktop (the *Hi builders): conifers with drooping boughs, broadleaf crowns of leaf fans on forked limbs, leafy bushes, pinnate ferns, faceted rocks, fallen logs, reeds
/* plant-models.js keeps the low-poly models: chunks far from the eye draw them (levels of detail in addInstanced) and phones / light mode use them alone.
   The models here draw from their own seeded streams (mrng), never from the global rand, so building them moves nothing in the world.
   VD: 0 light mode (low-poly only), 1 phones (low-poly plants, curved grass), 2 desktop (everything here: about 5-8x the polygons up close). */
const VD=LITE?0:(LOW?1:2);
const mrng=seed=>{ const g=mulberry32(seed); return {r:g, R:(a,b)=>a+(b-a)*g()}; };
// smooth 3D value noise, 0..1 (rock relief, bark furrows)
function vn3(x,y,z){
  const ix=Math.floor(x), iy=Math.floor(y), iz=Math.floor(z), fx=x-ix, fy=y-iy, fz=z-iz, u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy), w=fz*fz*(3-2*fz);
  const H=(a,b,c)=>h3(ix+a,iy+b,iz+c);
  return lerp(lerp(lerp(H(0,0,0),H(1,0,0),u),lerp(H(0,1,0),H(1,1,0),u),v), lerp(lerp(H(0,0,1),H(1,0,1),u),lerp(H(0,1,1),H(1,1,1),u),v), w);
}
// an indexed mesh that grows vertex by vertex; done() gives smooth normals. tri() turns a face to show the side (hx,hy,hz) points to, so any winding works
function meshAcc(){
  const P=[], C=[], I=[];
  return {
    v(x,y,z,r,g,b){ P.push(x,y,z); C.push(r,g,b); return P.length/3-1; },
    tri(a,b,c,hx,hy,hz){
      const ax=P[a*3], ay=P[a*3+1], az=P[a*3+2], ux=P[b*3]-ax, uy=P[b*3+1]-ay, uz=P[b*3+2]-az, vx=P[c*3]-ax, vy=P[c*3+1]-ay, vz=P[c*3+2]-az;
      if((uy*vz-uz*vy)*hx+(uz*vx-ux*vz)*hy+(ux*vy-uy*vx)*hz<0) I.push(a,c,b); else I.push(a,b,c);
    },
    quad(a,b,c,d,hx,hy,hz){ this.tri(a,b,c,hx,hy,hz); this.tri(a,c,d,hx,hy,hz); },
    at(i){ return [P[i*3],P[i*3+1],P[i*3+2]]; },
    done(){
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
      g.setIndex(I); g.computeVertexNormals(); return g.toNonIndexed();
    }
  };
}
// a flat-shaded triangle soup with its own normals (leaf clusters, fronds, petals)
function flatAcc(){
  const P=[], N=[], C=[];
  return {
    tri(a,b,c,na,nb,nc,ca,cb,cc){ P.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]); N.push(na[0],na[1],na[2],nb[0],nb[1],nb[2],nc[0],nc[1],nc[2]); C.push(ca[0],ca[1],ca[2],cb[0],cb[1],cb[2],cc[0],cc[1],cc[2]); },
    done(){ return mkGeo(P,N,C); }
  };
}
const nrm3=(x,y,z)=>{ const l=Math.hypot(x,y,z)||1; return [x/l,y/l,z/l]; };
const crs3=(a,b)=>[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
/* a tube along points pts ([x,y,z] each), tapered and furrowed by rad(t,a) (t 0..1 along it, a the angle round it), coloured by colFn(x,y,z,c);
   capped to a point at the far end when `cap` */
function tube(pts,rad,sides,colFn,cap){
  const A=meshAcc(), n=pts.length, rows=[], cen=[];
  let nr=null;
  for(let i=0;i<n;i++){
    const p=pts[i], q=pts[Math.min(i+1,n-1)], o=pts[Math.max(i-1,0)], t=nrm3(q[0]-o[0],q[1]-o[1],q[2]-o[2]);
    if(!nr) nr=Math.abs(t[1])<0.9?[0,1,0]:[1,0,0];
    const d=nr[0]*t[0]+nr[1]*t[1]+nr[2]*t[2]; nr=nrm3(nr[0]-t[0]*d,nr[1]-t[1]*d,nr[2]-t[2]*d);   // parallel transport of the ring's frame
    const b=crs3(t,nr), row=[];
    for(let k=0;k<sides;k++){
      const a=k/sides*TAU, ca=Math.cos(a), sa=Math.sin(a), r=rad(i/(n-1),a);
      const x=p[0]+(nr[0]*ca+b[0]*sa)*r, y=p[1]+(nr[1]*ca+b[1]*sa)*r, z=p[2]+(nr[2]*ca+b[2]*sa)*r;
      colFn(x,y,z,_c); row.push(A.v(x,y,z,_c.r,_c.g,_c.b));
    }
    rows.push(row); cen.push(p);
  }
  for(let i=0;i<n-1;i++) for(let k=0;k<sides;k++){
    const k1=(k+1)%sides, mx=(cen[i][0]+cen[i+1][0])/2, my=(cen[i][1]+cen[i+1][1])/2, mz=(cen[i][2]+cen[i+1][2])/2;
    const p0=A.at(rows[i][k]), p1=A.at(rows[i+1][k1]);
    A.quad(rows[i][k],rows[i][k1],rows[i+1][k1],rows[i+1][k],(p0[0]+p1[0])/2-mx,(p0[1]+p1[1])/2-my,(p0[2]+p1[2])/2-mz);
  }
  if(cap){
    const last=pts[n-1], prev=pts[n-2]||last, t=nrm3(last[0]-prev[0],last[1]-prev[1],last[2]-prev[2]), r=rad(1,0);
    colFn(last[0]+t[0]*r,last[1]+t[1]*r,last[2]+t[2]*r,_c);
    const tip=A.v(last[0]+t[0]*r*1.2,last[1]+t[1]*r*1.2,last[2]+t[2]*r*1.2,_c.r,_c.g,_c.b);
    for(let k=0;k<sides;k++) A.tri(rows[n-1][k],rows[n-1][(k+1)%sides],tip,t[0],t[1],t[2]);
  }
  return A.done();
}
// bark: furrows run up the trunk (darker in the grooves), moss at the foot
const barkHi=(hex,sd)=>(x,y,z,c)=>{ const gr=vn3(Math.atan2(z,x)*2.6+sd,y*0.7,0.5); c.set(hex).multiplyScalar(0.6+0.62*gr); if(y<0.7) c.lerp(moss,0.28*(1-y/0.7)); };
const furrow=(sd,amp)=>(t,a,H)=>1+amp*(vn3(Math.cos(a)*2.4+sd,t*H*1.3,Math.sin(a)*2.4)-0.5)*2;

/* ---------- conifers: tiers of drooping boughs ----------
   Each tier is a dense dark shoulder (a small smooth shell round the trunk) carrying separate boughs: folded, pointed fronds that reach out and
   droop at the tips, in two layers (the lower one darker and turned a little), long and short ones alternating, so light and gaps show between them
   and the outline is feathery. The tiers are packed 1.8x closer than the low-poly cones and follow the same radius curve, so both levels of detail
   have the same outline. */
function makeConiferHi(o,seed){
  const {r:rg,R:rr}=mrng(seed), seg=14, nb=15, n=Math.round(o.layers*1.8), A=meshAcc(), F=flatAcc();
  const step=n>1?(o.layers-1)*o.spacing/(n-1):0;
  let top=0;
  for(let i=0;i<n;i++){
    const t=i/n, r=o.r0*(1-t*0.85)+0.15, lh=o.lh*(1-t*0.25)*1.08, y0=o.start+i*step+lh*0.5, rot=rg()*TAU, lit=0.6+0.5*(i+0.5)/n;
    // the shoulder
    const ring=(rad,dy,ao)=>{ const row=[]; for(let k=0;k<seg;k++){ const a=rot+k/seg*TAU, v=lit*ao*(0.9+rg()*0.2); row.push(A.v(Math.cos(a)*rad,y0+dy,Math.sin(a)*rad,v,v,v)); } return row; };
    const R1=ring(0.34*r,lh*0.2,0.6), R2=ring(0.66*r,-lh*0.14,0.75), cv=lit*0.3, apex=A.v(0,y0+lh*0.5,0,lit*0.7,lit*0.7,lit*0.7), ctr=A.v(0,y0-lh*0.3,0,cv,cv,cv);
    top=y0+lh*0.5;
    for(let k=0;k<seg;k++){
      const k1=(k+1)%seg, am=rot+(k+0.5)/seg*TAU, ux=Math.cos(am), uz=Math.sin(am);
      A.tri(apex,R1[k],R1[k1],ux,0.6,uz); A.quad(R1[k],R1[k1],R2[k1],R2[k],ux,0.5,uz); A.tri(R2[k],R2[k1],ctr,ux*0.3,-1,uz*0.3);
    }
    // the boughs: two layers of folded kites (root, two shoulders, tip), each leaning out and down
    for(let L=0;L<2;L++) for(let k=0;k<nb;k++){
      const a=rot+(k+(L?0.5:0)+rr(-0.25,0.25))/nb*TAU, ca=Math.cos(a), sa=Math.sin(a), px=-sa, pz=ca;
      const long=(k&1)?0.78:1, len=r*rr(0.88,1.12)*long*(L?0.86:1), r0=0.36*r, y1=y0-lh*(L?0.02:-0.06)-lh*0.1*L;
      const tipY=y1-lh*rr(0.4,0.62)*(L?1.1:1), hw=0.3*(len-r0)*0.6+0.06*r, ridge=0.05*r;
      const B=[ca*r0,y1,sa*r0], T=[ca*len,tipY,sa*len], mx=ca*(r0+(len-r0)*0.45), mz=sa*(r0+(len-r0)*0.45), my=y1+(tipY-y1)*0.4+ridge;
      const ML=[mx-px*hw,my-ridge*0.7,mz-pz*hw], MR=[mx+px*hw,my-ridge*0.7,mz+pz*hw], MC=[mx,my,mz];
      const v=lit*(L?0.62:1)*rr(0.85,1.15), cb=v*0.6, cm=v*1.0, ct=v*(L?1.05:1.3);
      const n1=nrm3(ca*0.35,1,sa*0.35), n2=nrm3(ca*0.5,0.8,sa*0.5);
      F.tri(B,ML,MC,n1,n1,n1,[cb,cb,cb],[cm,cm,cm],[cm,cm,cm]); F.tri(B,MC,MR,n1,n1,n1,[cb,cb,cb],[cm,cm,cm],[cm,cm,cm]);
      F.tri(ML,T,MC,n2,n2,n2,[cm,cm,cm],[ct,ct,ct],[cm,cm,cm]); F.tri(MC,T,MR,n2,n2,n2,[cm,cm,cm],[ct,ct,ct],[cm,cm,cm]);
    }
  }
  const H=Math.max(o.trunkH,top*0.8), pts=[];
  for(let s=0;s<=8;s++){ const t=s/8; pts.push([Math.sin(t*2.4+seed)*0.03*t*H,t*H,Math.cos(t*2.1+seed)*0.03*t*H]); }
  const fr=furrow(seed,0.08), trunk=tube(pts,(t,a)=>lerp(0.28,0.07,t)*(1+1.0*Math.exp(-t*H*1.6))*fr(t,a,H),8,barkHi(0x4a3524,seed));
  return {trunk, leaves:merge([A.done(),F.done()])};
}

/* ---------- broadleaf trees: a crown of leaf clusters on forked limbs ----------
   A crown is a few dark core blobs (the shade inside) wearing clumps of leaves: five folded diamonds splayed from a point, laid over the blobs'
   surfaces with normals that lean mostly along the crown's outward direction, so the silhouette is leafy while the shading stays soft. Below it a furrowed, flared trunk and limbs
   that fork once. Same crown size, blob layout and colour ramp as makeBroadleaf (the low-poly one). */
function leafFan(F,px,py,pz,n,cr,rg,v,g){   // one clump: five leaves splayed from a point, each a folded diamond (base, two mids, tip); g: the crown's outward direction there
  let u=crs3(n,Math.abs(n[1])>0.95?[1,0,0]:[0,1,0]); u=nrm3(u[0],u[1],u[2]); const w=crs3(n,u), rot=rg()*TAU;
  for(let k=0;k<5;k++){
    const a=rot+k/5*TAU+(rg()-0.5)*0.5, ca=Math.cos(a), sa=Math.sin(a), L=cr*(0.9+rg()*0.45), W=L*(0.42+rg()*0.14), up=0.3+rg()*0.5;
    const ax=nrm3((u[0]*ca+w[0]*sa)+n[0]*up,(u[1]*ca+w[1]*sa)+n[1]*up-0.08,(u[2]*ca+w[2]*sa)+n[2]*up), sd=crs3(ax,n), sl=Math.hypot(sd[0],sd[1],sd[2])||1;
    const sx=sd[0]/sl*W*0.5, sy=sd[1]/sl*W*0.5, sz=sd[2]/sl*W*0.5, fold=0.09*L;
    const B=[px,py,pz], ML=[px+ax[0]*L*0.45-sx+n[0]*fold,py+ax[1]*L*0.45-sy+n[1]*fold,pz+ax[2]*L*0.45-sz+n[2]*fold], MR=[px+ax[0]*L*0.45+sx+n[0]*fold,py+ax[1]*L*0.45+sy+n[1]*fold,pz+ax[2]*L*0.45+sz+n[2]*fold];
    const T=[px+ax[0]*L,py+ax[1]*L-0.05*L,pz+ax[2]*L];
    let ln=crs3(ax,sd); if(ln[0]*n[0]+ln[1]*n[1]+ln[2]*n[2]<0) ln=[-ln[0],-ln[1],-ln[2]];
    const nn=nrm3(ln[0]*0.3+g[0]*0.7,ln[1]*0.3+g[1]*0.7,ln[2]*0.3+g[2]*0.7), j=0.9+rg()*0.2, cb=v*0.7*j, cm=v*0.96*j, ct=v*1.12*j;
    F.tri(B,ML,MR,nn,nn,nn,[cb,cb,cb],[cm,cm,cm],[cm,cm,cm]); F.tri(ML,T,MR,nn,nn,nn,[cm,cm,cm],[ct,ct,ct],[cm,cm,cm]);
  }
}
// blobs: [{r,x,y,z,sy}]; C the crown's centre (normals lean away from it); cr the clump size; returns the shaded core blobs and the leaf clumps
function crownHi(blobs,C,cr,dens,rg,bot,top){
  const core=[], F=flatAcc();
  for(const b of blobs) core.push(paint(blob(b.r*0.66,b.x,b.y,b.z,b.sy,C,1),(x,y,z,nx,ny,nz,c)=>{ const v=(0.5+0.58*clamp((y-bot)/(top-bot)))*0.55*(0.9+h3(x,y,z)*0.2); c.setRGB(v,v,v); }));
  for(const b of blobs){
    const area=4*Math.PI*b.r*b.r*(1+b.sy)/2, cnt=Math.max(6,Math.round(1.5*area/(1.77*cr*cr)*dens));
    for(let i=0;i<cnt;i++){
      const yy=1-(i+0.5)/cnt*2, rad=Math.sqrt(Math.max(0,1-yy*yy)), ph=i*2.39996+rg()*0.6;
      const d=nrm3(Math.cos(ph)*rad+(rg()-0.5)*0.3, yy+(rg()-0.5)*0.3, Math.sin(ph)*rad+(rg()-0.5)*0.3);
      if(d[1]<-0.72) continue;
      const k=0.97+rg()*0.2, px=b.x+d[0]*b.r*k, py=b.y+d[1]*b.r*b.sy*k, pz=b.z+d[2]*b.r*k;
      let buried=false;
      for(const o of blobs){ if(o===b) continue; const ex=(px-o.x)/o.r, ey=(py-o.y)/(o.r*o.sy), ez=(pz-o.z)/o.r; if(ex*ex+ey*ey+ez*ez<0.7){ buried=true; break; } }
      if(buried) continue;
      const e=nrm3(d[0],d[1]/b.sy,d[2]), g=nrm3(px-C.x,py-C.y,pz-C.z), n=nrm3(e[0]*0.6+g[0]*0.4,e[1]*0.6+g[1]*0.4,e[2]*0.6+g[2]*0.4);
      const v=(0.5+0.58*clamp((py-bot)/(top-bot)))*(0.8+0.2*g[1]+0.06)*(0.9+rg()*0.2);
      leafFan(F,px,py,pz,n,cr*(0.85+rg()*0.3),rg,v,g);
    }
  }
  return {core,leaves:F.done()};
}
function limbPts(x,y,z,az,elev,len,segs,rg){
  const pts=[[x,y,z]], st=len/segs;
  for(let s=1;s<=segs;s++){
    const e=elev+0.4*s/segs+(rg()-0.5)*0.25, a=az+(rg()-0.5)*0.3, c=Math.cos(e);
    x+=Math.cos(a)*c*st; y+=Math.sin(e)*st; z+=Math.sin(a)*c*st; pts.push([x,y,z]);
  }
  return pts;
}
function makeBroadleafHi(o,seed){
  const {r:rg,R:rr}=mrng(seed), H=o.trunkH, tr=o.tr, parts=[];
  const tp=[], nT=o.birch?13:10;
  for(let s=0;s<nT;s++){ const t=s/(nT-1); tp.push([Math.sin(t*2.7+seed)*0.05*t*H*0.5,t*H,Math.cos(t*2.3+seed)*0.05*t*H*0.5]); }
  const birchCol=(x,y,z,c)=>{
    const band=Math.floor(y*3.3), ang=Math.floor((Math.atan2(z,x)+Math.PI)*1.6);
    if(y<0.5) c.set(0x3a3630); else if(h3(band,ang,7)>0.76) c.set(0x2e2b27); else c.set(0xe6e1d6).multiplyScalar(0.88+h3(band,1,2)*0.14);
  };
  const fr=furrow(seed,o.birch?0.02:0.09), flare=o.birch?0.45:1.1;
  parts.push(tube(tp,(t,a)=>tr*(o.birch?lerp(1,0.6,t):1-0.55*t)*(1+flare*Math.exp(-t*H*1.3))*fr(t,a,H),o.birch?7:9,o.birch?birchCol:barkHi(o.bark,seed)));
  const nL=o.birch?0:o.branches+2, limbCol=barkHi(o.bark||0x4a3524,seed+3);
  for(let l=0;l<nL;l++){
    const az=l/nL*TAU+rr(-0.4,0.4), y0=H*rr(0.6,0.88), e0=rr(0.5,0.95), len=o.rMain*rr(0.9,1.5), segs=4, r0=tr*rr(0.34,0.46);
    const at=tp[Math.min(nT-1,Math.round(y0/H*(nT-1)))], pts=limbPts(at[0],at[1],at[2],az,e0,len,segs,rg), taper=(t,a)=>lerp(r0,r0*0.2,t);
    parts.push(tube(pts,taper,5,limbCol,true));
    const q=pts[2], sub=len*0.55;
    for(const sg of [-1,1]) parts.push(tube(limbPts(q[0],q[1],q[2],az+sg*rr(0.5,0.9),e0+0.15,sub,3,rg),(t,a)=>lerp(r0*0.55,r0*0.12,t),5,limbCol,true));
  }
  const C=new THREE.Vector3(0,o.crownY,0), blobs=[{r:o.rMain,x:0,y:o.crownY,z:0,sy:o.sy}], nb=o.blobs+(o.birch?1:2);
  for(let k=0;k<nb;k++){
    const a=k/nb*TAU+rg()*0.6, d=o.spread*(0.7+rg()*0.45);
    blobs.push({r:o.rMain*rr(0.55,0.8),x:Math.cos(a)*d,y:o.crownY+rr(-0.6,0.9)*o.sy,z:Math.sin(a)*d,sy:o.sy});
  }
  const bot=o.crownY-o.rMain*o.sy*1.2, top=o.crownY+o.rMain*o.sy*1.2, cr=clamp(0.22*o.rMain+0.1,0.3,0.62);
  const cw=crownHi(blobs,C,cr,1,rg,bot,top);
  return {trunk:merge(parts), leaves:merge(cw.core.concat([cw.leaves]))};
}
// the Sakura Vale's cherry: a wide, flat crown on a leaning trunk (lean as in makeSakura)
function makeSakuraHi(){
  const t=makeBroadleafHi({trunkH:3.0, tr:0.34, crownY:4.6, rMain:2.1, blobs:7, spread:2.5, sy:0.55, branches:5, bark:0x4a3434},77);
  const lean=g=>{ const p=g.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i); p.setX(i,p.getX(i)+y*y*0.018); } return g; };
  return {trunk:lean(t.trunk), leaves:lean(t.leaves)};
}
// a dead tree: a flared, broken trunk and forked bare branches
function makeSnagHi(){
  const {r:rg,R:rr}=mrng(91), parts=[], col=barkHi(0x6b6254,91), pts=[];
  for(let s=0;s<=9;s++){ const t=s/9; pts.push([Math.sin(t*2.2)*0.12*t,t*6.5,Math.cos(t*1.9)*0.1*t]); }
  const fr=furrow(91,0.1);
  parts.push(tube(pts,(t,a)=>lerp(0.3,0.09,t)*(1+0.9*Math.exp(-t*7))*fr(t,a,6.5),8,col,true));
  for(let b=0;b<7;b++){
    const az=b/7*TAU+rr(-0.4,0.4), y0=rr(2.6,5.8), len=rr(1.3,2.5), pp=limbPts(0,y0,0,az,rr(0.35,0.9),len,3,rg), r0=rr(0.07,0.1);
    parts.push(tube(pp,(t,a)=>lerp(r0,r0*0.2,t),5,col,true));
    if(b&1){ const q=pp[2]; parts.push(tube(limbPts(q[0],q[1],q[2],az+rr(0.5,1),rr(0.5,1),len*0.5,2,rg),(t,a)=>lerp(r0*0.5,r0*0.1,t),4,col,true)); }
  }
  return {trunk:merge(parts), leaves:null};
}
function makeBushHi(nb,spread,seed){
  const {r:rg,R:rr}=mrng(seed), C=new THREE.Vector3(0,0.3,0), blobs=[];
  for(let k=0;k<nb;k++){ const a=k/nb*TAU+rg()*TAU, d=k===0?0:spread*rr(0.5,1); blobs.push({r:rr(0.5,0.8),x:Math.cos(a)*d,y:rr(0.45,0.75),z:Math.sin(a)*d,sy:0.8}); }
  const cw=crownHi(blobs,C,0.24,1,rg,0,1.4);
  return merge(cw.core.concat([cw.leaves]));
}

/* ---------- ferns: arching fronds with leaflets on both sides of a rib ---------- */
function makeFernHi(seed){
  const {R:rr}=mrng(seed), F=flatAcc(), n=8, S=9, up=[0,1,0];
  for(let f=0;f<n;f++){
    const ang=f/n*TAU+rr(-0.2,0.2), L=rr(0.9,1.35), dx=Math.cos(ang), dz=Math.sin(ang), px=-dz, pz=dx, dark=rr(0.9,1.1);
    const pt=t=>[dx*t*L, t*L*0.95-t*t*L*0.8, dz*t*L];
    for(let s=0;s<S;s++){
      const ta=s/S, tb=(s+1)/S, a=pt(ta), b=pt(tb), wa=0.028*(1-ta*0.6), wb=0.028*(1-tb*0.6), ca=(0.32+0.28*ta)*dark, cb=(0.32+0.28*tb)*dark;
      const A1=[a[0]-px*wa,a[1],a[2]-pz*wa], A2=[a[0]+px*wa,a[1],a[2]+pz*wa], B1=[b[0]-px*wb,b[1],b[2]-pz*wb], B2=[b[0]+px*wb,b[1],b[2]+pz*wb];
      F.tri(A1,A2,B2,up,up,up,[ca,ca,ca],[ca,ca,ca],[cb,cb,cb]); F.tri(A1,B2,B1,up,up,up,[ca,ca,ca],[cb,cb,cb],[cb,cb,cb]);
      const len=0.2*Math.sin(Math.min(ta*1.2+0.15,1)*Math.PI)*(1-ta*0.35)+0.03, tipv=(0.85+0.3*(1-ta))*dark;
      for(const sg of [-1,1]){
        const tip=[a[0]+px*sg*len+dx*0.07, a[1]-len*0.3, a[2]+pz*sg*len+dz*0.07], nn=nrm3(px*sg*0.35,1,pz*sg*0.35);
        F.tri(a,b,tip,nn,nn,nn,[ca*1.1,ca*1.1,ca*1.1],[cb*1.1,cb*1.1,cb*1.1],[tipv,tipv,tipv]);
      }
    }
  }
  return F.done();
}

/* ---------- boulders: a dense sphere pushed and cut into a faceted lump, smooth-shaded ---------- */
function smoothByPos(g){   // vertex normals averaged over every face that meets at a position, with a third of the face's own (keeps the cut edges readable)
  const p=g.attributes.position, nr=g.attributes.normal, sum=new Map(), key=i=>Math.round(p.getX(i)*1e4)+','+Math.round(p.getY(i)*1e4)+','+Math.round(p.getZ(i)*1e4), fn=[];
  for(let i=0;i<p.count;i+=3){
    const ux=p.getX(i+1)-p.getX(i), uy=p.getY(i+1)-p.getY(i), uz=p.getZ(i+1)-p.getZ(i), vx=p.getX(i+2)-p.getX(i), vy=p.getY(i+2)-p.getY(i), vz=p.getZ(i+2)-p.getZ(i);
    const f=[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx]; fn.push(f);
    for(let k=0;k<3;k++){ const kk=key(i+k); let s=sum.get(kk); if(!s){ s=[0,0,0]; sum.set(kk,s); } s[0]+=f[0]; s[1]+=f[1]; s[2]+=f[2]; }
  }
  for(let i=0;i<p.count;i++){ const s=sum.get(key(i)), f=fn[Math.floor(i/3)], fl=Math.hypot(f[0],f[1],f[2])||1, sl=Math.hypot(s[0],s[1],s[2])||1, n=nrm3(s[0]/sl*0.75+f[0]/fl*0.25,s[1]/sl*0.75+f[1]/fl*0.25,s[2]/sl*0.75+f[2]/fl*0.25); nr.setXYZ(i,n[0],n[1],n[2]); }
}
function makeRockHi(snow,seed,detail){   // detail 6: 980 faces, 3: 320
  const {r:rg,R:rr}=mrng(seed), g=new THREE.IcosahedronGeometry(1,detail), p=g.attributes.position, cuts=[];
  for(let k=0;k<6;k++) cuts.push([nrm3(rr(-1,1),rr(-0.6,1),rr(-1,1)),rr(0.66,0.86)]);
  for(let i=0;i<p.count;i++){
    const d=nrm3(p.getX(i),p.getY(i),p.getZ(i));
    let r=1+0.34*(vn3(d[0]*1.7+seed,d[1]*1.7,d[2]*1.7)-0.5)+0.11*(vn3(d[0]*4.3,d[1]*4.3+seed,d[2]*4.3)-0.5)+0.035*(vn3(d[0]*10,d[1]*10,d[2]*10+seed)-0.5);
    for(const [cn,off] of cuts){ const dd=d[0]*cn[0]+d[1]*cn[1]+d[2]*cn[2]; if(dd>0.05&&dd*r>off) r=off/dd; }
    p.setXYZ(i,d[0]*r,d[1]*r*0.92,d[2]*r);
  }
  smoothByPos(g);
  const snowC=new THREE.Color(0xf0f5f8);
  return paint(g,(x,y,z,nx,ny,nz,c)=>{
    const strata=0.86+0.26*vn3(x*0.4,y*5,z*0.4);
    if(snow){ c.set(0x88909a).multiplyScalar(strata*(0.8+h3(x,y,z)*0.3)); if(ny>0.3&&y>0.05) c.lerp(snowC,clamp((ny-0.3)*2.4)*0.93); return; }
    c.set(0x7c786e).multiplyScalar(strata*(0.8+h3(x,y,z)*0.3));
    if(vn3(x*7,y*7,z*7)>0.74) c.lerp(_c2.set(0x9ea07a),0.45);                     // lichen
    if(ny>0.4&&y>-0.1) c.lerp(moss,clamp((ny-0.4)*1.8)*(0.35+0.55*vn3(x*3,y*3,z*3)));   // moss on the upward faces
    if(y<-0.55) c.multiplyScalar(0.72);                                           // damp, dirty foot
  });
}
const _c2=new THREE.Color();

/* ---------- a fallen log: furrowed bark with moss on top, a slight sag, a branch stub, ends showing the growth rings ---------- */
function makeLogHi(seed){
  const {r:rg,R:rr}=mrng(seed), pts=[], parts=[];
  for(let s=0;s<=10;s++){ const t=s/10; pts.push([(t-0.5)*4,Math.sin(t*3.1+seed)*0.05,Math.sin(t*2.3+seed*2)*0.06]); }
  const col=(x,y,z,c)=>{ c.set(0x4e3c2a).multiplyScalar(0.55+0.8*vn3(Math.atan2(z,y)*2.2+seed,x*1.8,0.3)); if(y>0.12) c.lerp(moss,0.65*clamp((y-0.12)*4)); };
  parts.push(tube(pts,(t,a)=>lerp(0.34,0.29,t)*(1+0.16*(vn3(Math.cos(a)*2+seed,t*7,Math.sin(a)*2)-0.5)),12,col));
  for(const [sx,dir] of [[-2,-1],[2,1]]){   // the ends: three rings of light and dark wood
    const A=meshAcc(), r=0.335, tone=[0xb39264,0x9a7a4c,0xb39264,0x8a6a3f], ctr=A.v(sx,pts[sx<0?0:10][1],pts[sx<0?0:10][2],0.62,0.5,0.32), rows=[];
    for(let k=0;k<3;k++){ const row=[]; for(let j=0;j<12;j++){ const a=j/12*TAU, rr2=r*(0.34*(k+1)+(k===2?0.02:0)); _c.set(tone[k+1]); row.push(A.v(sx,pts[sx<0?0:10][1]+Math.sin(a)*rr2,pts[sx<0?0:10][2]+Math.cos(a)*rr2,_c.r,_c.g,_c.b)); } rows.push(row); }
    for(let j=0;j<12;j++){ const j1=(j+1)%12; A.tri(ctr,rows[0][j],rows[0][j1],dir,0,0); for(let k=0;k<2;k++) A.quad(rows[k][j],rows[k][j1],rows[k+1][j1],rows[k+1][j],dir,0,0); }
    parts.push(A.done());
  }
  const bp=[[0.3,0.2,0.05],[0.42,0.4,0.16],[0.5,0.6,0.3]];
  parts.push(tube(bp,(t,a)=>lerp(0.07,0.04,t),5,col,true));
  return merge(parts);
}

/* ---------- reeds: a tuft of long curved blades (grass-models.js) and cattails ---------- */
function makeReedsHi(seed){
  const {r:rg,R:rr}=mrng(seed), parts=[makeGrassTuft({blades:16,segs:4,radius:0.16,h:[0.9,1.6],w:[0.02,0.034],bend:[0.1,0.55],dry:0.06},seed)];
  for(let k=0;k<3;k++){
    const x=rr(-0.1,0.1), z=rr(-0.1,0.1), h=rr(1.15,1.45), lean=rr(-0.06,0.06), pts=[[x,0,z],[x+lean*0.3,h*0.4,z],[x+lean*0.7,h*0.8,z],[x+lean,h,z]];
    parts.push(tube(pts,(t,a)=>lerp(0.014,0.008,t),4,(px,py,pz,c)=>c.setRGB(0.32,0.48,0.2),false));
    parts.push(paint(cyl(0.036,0.03,0.22,7).translate(x+lean,h+0.09,z),(px,py,pz,nx,ny,nz,c)=>c.set(0x5a3a22).multiplyScalar(0.8+h3(px,py,pz)*0.4)));
  }
  return merge(parts);
}
