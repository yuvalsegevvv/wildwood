//@ Detailed plant models for the desktop (the *Hi builders): conifers with irregular drooping tiers, broadleaf crowns of leaf-spray clusters on forked limbs, rooted trunks with streaked, mossy bark, bushes, ferns, rocks, logs, reeds
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
/* bark: furrows and fine vertical streaks run up the trunk (darker in the grooves, the ridges a little warmer), the foot is damp and dark with moss on it,
   moss climbs in patches and pale lichen spots it. Everything is in the model's own space, so a tree turned by its instance keeps it */
const barkHi=(hex,sd)=>(x,y,z,c)=>{
  const a=Math.atan2(z,x), gr=vn3(a*2.6+sd,y*0.7,0.5), st=vn3(a*8+sd*1.7,y*0.16,2.5);
  c.set(hex).multiplyScalar((0.56+0.62*gr)*(0.78+0.42*st)); c.r*=0.96+0.08*gr; c.b*=1.02-0.06*gr;
  if(y<1) c.multiplyScalar(0.66+0.34*Math.max(0,y));
  const mp=vn3(x*1.3+sd,y*0.8,z*1.3), mk=Math.max(0,0.5*(1-y/1.1))+Math.max(0,(mp-0.62)*2.4)*clamp(1-y/6);
  if(mk>0) c.lerp(moss,Math.min(0.6,mk));
  if(vn3(x*6+sd,y*4,z*6)>0.75) c.lerp(_c2.set(0xa3a88a),0.42);
};
const furrow=(sd,amp)=>(t,a,H)=>1+amp*(vn3(Math.cos(a)*2.4+sd,t*H*1.3,Math.sin(a)*2.4)-0.5)*2;
// the foot of a trunk: a flare with nr buttress lobes where the roots leave it (k: how far it flares)
const rootFlare=(y,a,k,nr,ph)=>1+k*Math.exp(-Math.max(y,0)*2.4)*(0.4+0.9*Math.pow(Math.max(0,Math.cos(a*nr+ph)),3));
// a point on a polyline at height y (where a limb or a twig leaves a trunk)
function stemAt(pts,y){
  for(let i=1;i<pts.length;i++) if(pts[i][1]>=y){ const p=pts[i-1], q=pts[i], f=clamp((y-p[1])/((q[1]-p[1])||1)); return [lerp(p[0],q[0],f),y,lerp(p[2],q[2],f)]; }
  return pts[pts.length-1].slice();
}
// exposed roots: n snaking tubes that leave the buttress lobes, hug the ground (model y 0.15 is the ground: trees are placed 0.15 m low) and dive under it
function rootsHi(parts,n,tr,nr,ph,rg,rr,col,base){
  for(let k=0;k<n;k++){
    const a0=(TAU*Math.round(k*nr/n)-ph)/nr+rr(-0.12,0.12), len=rr(0.85,1.3), pts=[];
    for(const [d,y] of [[0.5,0.45],[1.25,0.25],[2.0,0.17],[2.7,0.08],[3.2,-0.06]]){ const a=a0+rr(-0.09,0.09)*d; pts.push([base[0]+Math.cos(a)*d*tr*len,y,base[2]+Math.sin(a)*d*tr*len]); }
    const r0=tr*rr(0.38,0.5);
    parts.push(tube(pts,(t,a)=>lerp(r0,r0*0.22,t)*(1+0.12*Math.cos(a*2)),5,col));
  }
}
// dead twigs low on a trunk: short bare stubs, grey and weathered
function deadTwigs(parts,n,pts,y0,y1,r0,len,el0,el1,rg,rr){
  const col=barkHi(0x6e665a,7);
  for(let k=0;k<n;k++){
    const y=rr(y0,y1), at=stemAt(pts,y), az=rg()*TAU, rr0=r0*rr(0.7,1.2);
    parts.push(tube(limbPts(at[0],at[1],at[2],az,rr(el0,el1),len*rr(0.6,1.2),2,rg),(t,a)=>lerp(rr0,rr0*0.25,t),4,col,true));
  }
}

/* ---------- conifers: tiers of drooping boughs ----------
   Each tier is a dense dark shoulder (a small smooth shell round the trunk) carrying separate boughs: folded, pointed fronds that reach out and droop
   at the tips (the two halves of the fold catch the light differently), in two layers (the lower one darker and turned a little), long and short ones alternating, so light and gaps show between them
   and the outline is feathery. No tier is regular: its height, radius and droop wander (the lower tiers droop more), a bough now and then is missing or
   reaches out past the others. Colour: dark and cool at the trunk, light and warm (new growth) at the tips. The tiers are packed 1.8x closer than the
   low-poly cones and follow the same radius curve, so both levels of detail have the same outline. The trunk has a flared, rooted foot and dead twigs
   below the first tier. */
/* The pine: a bare, slightly bent, orange-barked trunk, limbs that sweep out and up, and flat needle pads (a squashed dome wearing short needle tufts) in an open, lopsided crown.
   The pads' places come from conPinePads (plant-models.js), shared with the low-poly makePineLo. */
function makePineHi(o,seed){
  const {r:rg,R:rr}=mrng(seed), H=o.H||9.6, pads=conPinePads(o,seed), A=meshAcc(), F=flatAcc(), parts=[], bendK=o.bend||0.3;
  const pts=[]; for(let s=0;s<=8;s++){ const t=s/8, y=-0.25+t*(H*0.98+0.25); pts.push([bendK*Math.pow(Math.max(y,0)/H,2)+Math.sin(t*2.6+seed)*0.05*t,y,Math.cos(t*2.1+seed)*0.05*t]); }
  const fr=furrow(seed,0.08), ph=rg()*TAU, bark=barkHi(0x6a4a32,seed), orange=new THREE.Color(0xa8623c);
  const col=(x,y,z,c)=>{ bark(x,y,z,c); c.lerp(orange,clamp((y-0.4*H)/(0.2*H))*0.6); };
  parts.push(tube(pts,(t,a)=>{ const y=-0.25+t*(H*0.98+0.25); return (o.tk||1)*lerp(0.26,0.06,clamp(y/H))*rootFlare(y,a,0.85,4,ph)*fr(t,a,H); },8,col));
  rootsHi(parts,3,0.26,4,ph,rg,rr,col,[0,0,0]);
  for(const p of pads){   // a limb from the trunk up to its pad, then the pad
    const by=Math.max(p.y-1.3,0.4*H), bx=bendK*Math.pow(by/H,2), L=[[bx,by,0],[(bx+p.x)*0.5,by+(p.y-by)*0.35,p.z*0.5],[p.x,p.y-0.1,p.z]];
    parts.push(tube(L,(t)=>(o.tk||1)*lerp(0.085,0.03,t),5,col,true));
    const sy=0.95, rim=8, ring=(rad,dy,v)=>{ const row=[]; for(let k=0;k<rim;k++){ const a=k/rim*TAU+p.x; row.push(A.v(p.x+Math.cos(a)*rad,p.y+dy,p.z+Math.sin(a)*rad,v*0.9,v,v*1.06)); } return row; };
    const R0=ring(p.r,0,0.72), R1=ring(p.r*0.72,p.r*sy*0.6,0.8), top=A.v(p.x,p.y+p.r*sy,p.z,0.6,0.6,0.62), bot=A.v(p.x,p.y-p.r*0.3,p.z,0.5,0.5,0.5);
    for(let k=0;k<rim;k++){ const k1=(k+1)%rim; A.quad(R0[k],R0[k1],R1[k1],R1[k],0,1,0); A.tri(R1[k],R1[k1],top,0,1,0); A.tri(R0[k],R0[k1],bot,0,-1,0); }
    for(let q=0;q<64;q++){   // needle tufts standing up and out from the pad's surface (a V of two triangles)
      const a=rg()*TAU, d=Math.sqrt(rg())*p.r*0.95, bx0=p.x+Math.cos(a)*d, bz0=p.z+Math.sin(a)*d, by0=p.y+p.r*sy*(1-d/p.r)*0.8-0.02, L2=rr(0.42,0.68), ox=Math.cos(a)*1.1, oz=Math.sin(a)*1.1, w=0.075;
      const tip=[bx0+ox*L2*0.8,by0+L2*0.55,bz0+oz*L2*0.8], b1=[bx0-oz*w,by0,bz0+ox*w], b2=[bx0+oz*w,by0,bz0-ox*w], v=rr(0.9,1.2), cr=[0.7,0.74,0.7], ct=[v*1.1,v*1.14,v*0.95], nn=nrm3(ox,1,oz);
      F.tri(b1,b2,tip,nn,nn,nn,cr,cr,ct);
      const tip2=[bx0-ox*L2*0.5-oz*0.1,by0+L2*0.5,bz0-oz*L2*0.5+ox*0.1]; F.tri(b2,b1,tip2,nn,nn,nn,cr,cr,ct);
    }
  }
  return {trunk:merge(parts), leaves:merge([A.done(),F.done()])};
}
function makeConiferHi(o,seed){
  if(o.habit==='pine') return makePineHi(o,seed);
  const {r:rg,R:rr}=mrng(seed), seg=12, nb=16, n=Math.round(o.layers*1.8), A=meshAcc(), F=flatAcc(), az0=rg()*TAU;   // az0: the side of the tree whose boughs are shorter (a lopsided crown)
  const step=n>1?(o.layers-1)*o.spacing/(n-1):0;
  let top=0;
  for(let i=0;i<n;i++){
    const t=i/n, r=(o.r0*(o.taper?Math.pow(1-t*0.9,o.taper):1-t*0.85)+0.15)*(i<n-1?rr(0.72,1.2):0.85), lh=o.lh*(1-t*0.25)*1.08, y0=o.start+i*step+(i&&i<n-1?rr(-0.45,0.45)*step:0)+lh*0.5;
    const rot=rg()*TAU, lit=0.55+0.55*(i+0.5)/n, droop=lerp(1.3,0.8,t)*rr(0.85,1.15);
    // the shoulder
    const ring=(rad,dy,ao)=>{ const row=[]; for(let k=0;k<seg;k++){ const a=rot+k/seg*TAU, v=lit*ao*(0.9+rg()*0.2); row.push(A.v(Math.cos(a)*rad,y0+dy,Math.sin(a)*rad,v*0.9,v,v*1.06)); } return row; };
    const R1=ring(0.34*r,lh*0.2,0.55), R2=ring((o.core||0.5)*r,-lh*0.14,0.7), cv=lit*0.28, apex=A.v(0,y0+lh*0.5,0,lit*0.7,lit*0.7,lit*0.7), ctr=A.v(0,y0-lh*0.3,0,cv,cv,cv);
    top=y0+lh*0.5;
    for(let k=0;k<seg;k++){
      const k1=(k+1)%seg, am=rot+(k+0.5)/seg*TAU, ux=Math.cos(am), uz=Math.sin(am);
      A.tri(apex,R1[k],R1[k1],ux,0.6,uz); A.quad(R1[k],R1[k1],R2[k1],R2[k],ux,0.5,uz); A.tri(R2[k],R2[k1],ctr,ux*0.3,-1,uz*0.3);
    }
    // the boughs: two layers of curved fronds (root, two pairs of shoulders, tip), each leaning out and bending down
    for(let L=0;L<2;L++) for(let k=0;k<nb;k++){
      if(i<n-2&&rg()<(o.thin?0.4:0.22)) continue;   // a gap in the tier
      const a=rot+(k+(L?0.5:0)+rr(-0.3,0.3))/nb*TAU, ca=Math.cos(a), sa=Math.sin(a), px=-sa, pz=ca;
      const long=rr(0.7,1.05)*(rg()<0.12?1.28:1)*(Math.cos(a-az0)<-0.3?0.8:1), len=r*rr(0.86,1.12)*long*(L?0.86:1), r0=0.34*r, y1=y0-lh*(L?0.02:-0.06)-lh*0.1*L;
      const drop=lh*rr(0.38,0.6)*droop*(L?1.1:1), hw=(o.frondW||0.3)*(len-r0)*0.6+0.06*r, ridge=0.06*r, f=0.45, mx=ca*(r0+(len-r0)*f), mz=sa*(r0+(len-r0)*f), my=y1-drop*(0.22+0.3*(o.sag||0));
      const B=[ca*r0,y1,sa*r0], ML=[mx-px*hw,my-ridge*0.8,mz-pz*hw], MR=[mx+px*hw,my-ridge*0.8,mz+pz*hw], MC=[mx,my+ridge,mz], T=[ca*(len+0.04*r),y1-drop+(o.lift||0)*lh,sa*(len+0.04*r)];
      const v=lit*(L?0.6:1)*rr(0.85,1.15)*(0.7+0.3*clamp(len/(o.r0*0.9))), sk=rg()<0.5?1:-1, nl=nrm3(ca*0.3-px*0.5*sk,1,sa*0.3-pz*0.5*sk), nr=nrm3(ca*0.3+px*0.5*sk,1,sa*0.3+pz*0.5*sk), no=nrm3(ca*0.6,0.75,sa*0.6);
      const cb=[v*0.66*0.9,v*0.66,v*0.66*1.1], tk=L?0.95:1.12, sn=o.snow&&!L?1.5:1, cm=[v*0.95*(sn>1?1.25:1),v*0.97*(sn>1?1.25:1),v*0.97*(sn>1?1.25:1)], ct=[v*tk*1.05*sn,v*tk*1.06*sn,v*tk*(sn>1?1.0:0.8)*sn];   // (snow: the upper boughs' ridge and tips go near white once the palette tints them)
      F.tri(B,ML,MC,nl,nl,nl,cb,cm,cm); F.tri(B,MC,MR,nr,nr,nr,cb,cm,cm); F.tri(ML,T,MC,no,no,nl,cm,ct,cm); F.tri(MC,T,MR,nr,no,no,cm,ct,cm);
    }
  }
  { // the leader: a thin spire over the top tier
    const y=top-o.lh*0.25, h=o.lh*0.45, tip=A.v(rr(-0.03,0.03),y+h,rr(-0.03,0.03),1.2,1.24,0.95), rw=[];
    for(let k=0;k<4;k++){ const a=k/4*TAU; rw.push(A.v(Math.cos(a)*0.07,y,Math.sin(a)*0.07,0.7,0.72,0.72)); }
    for(let k=0;k<4;k++){ const a=(k+0.5)/4*TAU; A.tri(rw[k],rw[(k+1)%4],tip,Math.cos(a),0.3,Math.sin(a)); }
  }
  const H=Math.max(o.trunkH,top*0.8), pts=[], ph=rg()*TAU;
  for(let s=0;s<=8;s++){ const t=Math.pow(s/8,1.3); pts.push([Math.sin(t*2.4+seed)*0.03*t*H,-0.25+t*(H+0.25),Math.cos(t*2.1+seed)*0.03*t*H]); }
  const fr=furrow(seed,0.08), col=barkHi(0x4a3524,seed), parts=[];
  parts.push(tube(pts,(t,a)=>{ const y=-0.25+Math.pow(t,1.3)*(H+0.25); return lerp(0.28,0.07,clamp(y/H))*rootFlare(y,a,0.85,4,ph)*fr(t,a,H); },8,col));
  rootsHi(parts,3,0.28,4,ph,rg,rr,col,[0,0,0]);
  deadTwigs(parts,4,pts,0.9,o.start+0.4,0.045,0.9,-0.35,0.25,rg,rr);
  return {trunk:merge(parts), leaves:merge([A.done(),F.done()])};
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
// a limb from S to E that arches up a little on the way (arch: the rise in the middle, a share of its length) and kinks at each joint
function archPts(S,E,segs,arch,rg){
  const len=Math.hypot(E[0]-S[0],E[1]-S[1],E[2]-S[2]), pts=[];
  for(let s=0;s<=segs;s++){
    const u=s/segs, j=s&&s<segs?len*0.07:0;
    pts.push([lerp(S[0],E[0],u)+(rg()-0.5)*j, lerp(S[1],E[1],u)+Math.sin(u*Math.PI)*arch*len+(rg()-0.5)*j, lerp(S[2],E[2],u)+(rg()-0.5)*j]);
  }
  return pts;
}
/* one leaf spray: four leaves along a short twig on a cluster's surface at p (alternate sides and one at the end), each a folded diamond.
   n: the surface's normal there, g: the crown's outward direction (the shading normal leans on it, so the crown shades softly);
   v: brightness, hr / hb: the cluster's own hue (red and blue factors). The leaf's base is darker and cooler, its tip lighter and warmer. */
function leafSpray(F,p,n,g,L,rg,v,hr,hb,lw){   // lw: the leaf's width factor (plant-models-hi.js LEAF: oval, small, lobed...)
  let u=crs3(n,Math.abs(n[1])>0.95?[1,0,0]:[0,1,0]); u=nrm3(u[0],u[1],u[2]); const w=crs3(n,u), a0=rg()*TAU, ca=Math.cos(a0), sa=Math.sin(a0);
  const t=nrm3(u[0]*ca+w[0]*sa+n[0]*0.3, u[1]*ca+w[1]*sa+n[1]*0.3-0.15, u[2]*ca+w[2]*sa+n[2]*0.3), s0=crs3(t,n), sl=Math.hypot(s0[0],s0[1],s0[2])||1, sd=[s0[0]/sl,s0[1]/sl,s0[2]/sl];
  const cb=[v*0.68*0.94*hr,v*0.68,v*0.68*1.08*hb], cm=[v*hr,v,v*hb], ct=[v*1.2*hr,v*1.18,v*0.98*hb];
  for(let j=0;j<4;j++){
    const f=j===3?0.62:j*0.25, sg=j===3?0:(j&1?1:-1), up=0.15+rg()*0.3;
    const bx=p[0]+t[0]*L*f, by=p[1]+t[1]*L*f, bz=p[2]+t[2]*L*f;
    const ax=nrm3(t[0]*0.8+sd[0]*sg*0.85+n[0]*up, t[1]*0.8+sd[1]*sg*0.85+n[1]*up-0.12, t[2]*0.8+sd[2]*sg*0.85+n[2]*up);
    const Ll=L*(0.8+rg()*0.35)*(j===3?1.12:1), q=crs3(ax,n), ql=Math.hypot(q[0],q[1],q[2])||1, W=Ll*(0.4+rg()*0.12)*0.5/ql*(lw||1), fold=0.1*Ll;
    const ML=[bx+ax[0]*Ll*0.42-q[0]*W+n[0]*fold, by+ax[1]*Ll*0.42-q[1]*W+n[1]*fold, bz+ax[2]*Ll*0.42-q[2]*W+n[2]*fold];
    const MR=[bx+ax[0]*Ll*0.42+q[0]*W+n[0]*fold, by+ax[1]*Ll*0.42+q[1]*W+n[1]*fold, bz+ax[2]*Ll*0.42+q[2]*W+n[2]*fold];
    const B=[bx,by,bz], T=[bx+ax[0]*Ll, by+ax[1]*Ll-0.06*Ll, bz+ax[2]*Ll];
    let ln=crs3(ax,q); if(ln[0]*n[0]+ln[1]*n[1]+ln[2]*n[2]<0) ln=[-ln[0],-ln[1],-ln[2]];
    const ll=Math.hypot(ln[0],ln[1],ln[2])||1, nn=nrm3(ln[0]/ll*0.2+g[0]*0.8,ln[1]/ll*0.2+g[1]*0.8,ln[2]/ll*0.2+g[2]*0.8), j2=0.92+rg()*0.16;
    const m2=[cm[0]*j2,cm[1]*j2,cm[2]*j2];
    F.tri(B,ML,MR,nn,nn,nn,cb,m2,m2); F.tri(ML,T,MR,nn,nn,nn,m2,ct,m2);
  }
}
/* A crown of leaf clusters: cl = [{x,y,z,r,sy,core}], each cluster a shell of leaf sprays (the parts buried in another cluster are left out) round a
   dark core blob (core clusters only), so the crown reads as separate masses of leaves with shade and gaps between them. nSpray: about how many sprays
   the whole crown gets (4 leaves, 8 triangles each). Fake ambient occlusion in the colours: darker low down, toward the crown's centre and on a
   cluster's inner side; lighter, warmer and more saturated at the top and the outer tips. */
/* leaf shapes of the broadleaf species (still 2 triangles a leaf): w the width factor, l the length factor; makeBroadleafHi reads o.leaf */
const LEAF={oval:{w:0.85,l:1.05},small:{w:0.9,l:0.75},lobed:{w:1.0,l:1.0},petal:{w:0.95,l:0.72},fan:{w:1.0,l:1.0},fine:{w:0.4,l:1.2}};
function treeCrown(cl,C,L,nSpray,rg,rr,lf){
  const F=flatAcc(), core=[];
  let bot=1e9, top=-1e9, reach=0.1, area=0;
  for(const c of cl){ bot=Math.min(bot,c.y-c.r*c.sy); top=Math.max(top,c.y+c.r*c.sy); reach=Math.max(reach,Math.hypot(c.x-C.x,c.z-C.z)+c.r); c.area=4*Math.PI*c.r*c.r*(1+c.sy)/2; area+=c.area; }
  for(const c of cl){
    const ox=c.x-C.x, oy=(c.y-C.y)*1.6+0.6, oz=c.z-C.z, co=nrm3(ox,oy,oz), hr=1+rr(-0.06,0.06), hb=1+rr(-0.1,0.1);   // co: which way the cluster faces out of the crown
    if(c.core) core.push(paint(blob(c.r*0.62,c.x,c.y,c.z,c.sy,C,1),(x,y,z,nx,ny,nz,col)=>{ const v=(0.3+0.24*clamp((y-bot)/(top-bot)))*(0.55+h3(x*3,y*3,z*3)*0.9); col.setRGB(v*0.92*hr,v,v*1.06*hb); }));
    const cnt=Math.max(5,Math.round(nSpray*c.area/area*1.3));
    for(let i=0;i<cnt;i++){
      const yy=1-(i+0.5)/cnt*2, rad=Math.sqrt(Math.max(0,1-yy*yy)), ph=i*2.39996+rg()*0.6;
      const d=nrm3(Math.cos(ph)*rad+(rg()-0.5)*0.3, yy+(rg()-0.5)*0.3, Math.sin(ph)*rad+(rg()-0.5)*0.3);
      if(d[1]<-0.75) continue;
      const k=0.94+rg()*0.16, px=c.x+d[0]*c.r*k, py=c.y+d[1]*c.r*c.sy*k, pz=c.z+d[2]*c.r*k;
      let buried=false;
      for(const o of cl){ if(o===c) continue; const ex=(px-o.x)/o.r, ey=(py-o.y)/(o.r*o.sy), ez=(pz-o.z)/o.r; if(ex*ex+ey*ey+ez*ez<0.72){ buried=true; break; } }
      if(buried) continue;
      const e=nrm3(d[0],d[1]/c.sy,d[2]), g=nrm3(px-C.x,py-C.y,pz-C.z), nn=nrm3(e[0]*0.75+g[0]*0.25,e[1]*0.75+g[1]*0.25,e[2]*0.75+g[2]*0.25);
      const hgt=clamp((py-bot)/(top-bot)), out=clamp(Math.hypot(px-C.x,pz-C.z)/reach*0.8+Math.max(0,py-C.y)/(top-C.y+0.01)*0.4), face=0.5+0.5*(d[0]*co[0]+d[1]*co[1]+d[2]*co[2]);
      const v=(0.6+0.46*hgt)*(0.66+0.34*out)*(0.62+0.5*face)*(0.9+rg()*0.2);
      leafSpray(F,[px,py,pz],nn,g,L*(0.85+rg()*0.3)*(lf?lf.l:1),rg,v,hr,hb,lf?lf.w:1);
    }
  }
  return {core,leaves:F.done()};
}
/* ---------- broadleaf trees: a crown of leaf clusters at the ends of forked limbs ----------
   Spreading crowns (oaks, maple, beech, the flat umbrella and acacia): branches+2 limbs arch out of the trunk's top part, each to a main cluster, and
   fork near its end into two smaller clusters beside it; a top cluster sits over the trunk. Columnar crowns (birch, poplar, ginkgo: sy over 1.2) carry
   their clusters on short limbs spiralling up a leader. The clusters fill the same envelope as the low-poly crown (makeBroadleaf: the centre blob and
   o.blobs blobs at `spread`), so the switch between the two levels does not show. o.fork: the trunk splits into two leaders. The trunk has a flared,
   buttressed foot, exposed roots and a dead twig or two. */
function makeBroadleafHi(o,seed){
  const {r:rg,R:rr}=mrng(seed), H=o.trunkH, tr=o.tr, birch=!!o.birch, colm=birch||o.sy>1.2, parts=[];
  const birchCol=(x,y,z,c)=>{
    const band=Math.floor(y*3.3), ang=Math.floor((Math.atan2(z,x)+Math.PI)*1.6), a=Math.atan2(z,x);
    if(y<1.1&&vn3(a*3,y*3.5,1.5)>y/1.1*0.8) c.set(0x3a3630).multiplyScalar(0.8+0.4*vn3(a*6,y*6,0.5));   // the dark, fissured foot
    else if(h3(band,ang,7)>0.76) c.set(0x2e2b27); else c.set(0xe6e1d6).multiplyScalar(0.86+h3(band,1,2)*0.14+0.06*vn3(a*5,y*0.3,3));
    if(y<0.5) c.lerp(moss,0.3*(1-y/0.5));
  };
  const bk=o.bark||0x4a3524, trunkC=birch?birchCol:barkHi(bk,seed), limbC=birch?barkHi(0x4a4038,seed+3):barkHi(bk,seed+3);
  // the trunk: rings packed toward the foot (the flare), a slow bend
  const fork=!!o.fork&&!colm, Ht=fork?H*rr(0.5,0.6):H, nT=birch?12:11, tp=[], ph=rg()*TAU, nr=birch?3:4, fk=birch?0.45:1.05, bx=rr(-1,1)*0.04*H, bz=rr(-1,1)*0.04*H;
  for(let s=0;s<nT;s++){ const t=Math.pow(s/(nT-1),1.35), y=-0.25+t*(Ht+0.25); tp.push([Math.sin(t*2.7+seed)*0.025*Ht+bx*t*t,y,Math.cos(t*2.3+seed)*0.025*Ht+bz*t*t]); }
  const fr=furrow(seed,birch?0.02:0.09), rT=(y,a,u)=>tr*(birch?lerp(1,0.62,u):1-0.42*u)*rootFlare(y,a,fk,nr,ph)*fr(u,a,H);
  parts.push(tube(tp,(t,a)=>{ const y=-0.25+Math.pow(t,1.35)*(Ht+0.25); return rT(y,a,clamp(y/H)); },birch?8:11,trunkC));
  if(!birch) rootsHi(parts,o.sy<0.5?3:4,tr,nr,ph,rg,rr,trunkC,tp[0]);
  // stems the limbs grow from: the trunk, or its two leaders when it forks
  const stems=[{pts:tp,r:tr*0.6}], C=new THREE.Vector3(0,o.crownY,0), cl=[];
  if(fork) for(let k=0;k<2;k++){
    const az=ph+k*Math.PI+rr(-0.3,0.3), top=tp[nT-1], pts=limbPts(top[0],top[1],top[2],az,rr(0.95,1.15),(H-Ht)+(o.crownY-H)*0.55+0.4,4,rg);
    parts.push(tube(pts,(t,a)=>lerp(tr*0.68,tr*0.36,t),8,trunkC)); stems.push({pts,r:tr*0.4});
  }
  const attach=y=>{ let best=null, bd=1e9; for(const s of stems){ const lo=s.pts[0][1], hi=s.pts[s.pts.length-1][1], d=y<lo?lo-y:y>hi?y-hi:0; if(d<bd-0.01||(d<bd+0.01&&s!==stems[0])){ bd=d; best=s; } } return {p:stemAt(best.pts,clamp(y,best.pts[0][1],best.pts[best.pts.length-1][1])),r:best.r}; };
  if(!colm){
    const nL=o.branches+2, csy=clamp(o.sy*1.05,0.4,0.95);
    for(let l=0;l<nL;l++){
      const up=nL>3&&(l&1), az=ph+l/nL*TAU+rr(-0.35,0.35), d=o.spread*(up?rr(0.42,0.68):rr(0.8,1.12)), rc=o.rMain*rr(0.5,0.66);   // limbs take turns: a high one nearer the middle, a low one reaching out
      const E=[Math.cos(az)*d,o.crownY+(up?rr(0.25,0.65):rr(-0.42,0.12))*o.rMain*o.sy,Math.sin(az)*d];
      const at=attach(Math.min(H*rr(0.66,0.95),E[1]-0.5)), S=at.p, r0=Math.min(at.r,tr*rr(0.34,0.44));
      const pts=archPts(S,[S[0]+(E[0]-S[0])*0.9,S[1]+(E[1]-S[1])*0.9,S[2]+(E[2]-S[2])*0.9],5,0.12,rg);
      parts.push(tube(pts,(t,a)=>lerp(r0,r0*0.28,t),5,limbC,true));
      cl.push({x:E[0],y:E[1],z:E[2],r:rc,sy:csy,core:true});
      for(const sg of [-1,1]){
        const a2=az+sg*rr(0.65,1.05), q=pts[3], rs=rc*rr(0.5,0.66), Ec=[E[0]+Math.cos(a2)*rc*0.95,E[1]+rc*csy*rr(-0.1,0.45),E[2]+Math.sin(a2)*rc*0.95];
        parts.push(tube(archPts(q,[lerp(q[0],Ec[0],0.85),lerp(q[1],Ec[1],0.85),lerp(q[2],Ec[2],0.85)],2,0.1,rg),(t,a)=>lerp(r0*0.45,r0*0.12,t),4,limbC,true));
        cl.push({x:Ec[0],y:Ec[1],z:Ec[2],r:rs,sy:csy,core:false});
      }
    }
    const T=[rr(-0.25,0.25)*o.spread*0.4,o.crownY+o.rMain*o.sy*rr(0.5,0.68),rr(-0.25,0.25)*o.spread*0.4], at=attach(H);
    parts.push(tube(archPts(at.p,T,3,0.04,rg),(t,a)=>lerp(Math.min(at.r,tr*0.5),tr*0.12,t),5,limbC,true));
    cl.push({x:T[0],y:T[1],z:T[2],r:o.rMain*rr(0.6,0.72),sy:csy,core:true});
  } else {
    // a leader up the middle, clusters on short limbs spiralling round it
    const yb=o.crownY-o.rMain*o.sy*0.88, yt=o.crownY+o.rMain*o.sy*0.92, top=tp[nT-1];
    if(yt-0.4>top[1]){ const lp=archPts(top,[top[0]+rr(-0.1,0.1),yt-0.3,top[2]+rr(-0.1,0.1)],4,0,rg); parts.push(tube(lp,(t,a)=>lerp(tr*(birch?0.6:0.55),tr*0.18,t),birch?6:5,birch?trunkC:limbC,true)); stems.push({pts:lp,r:tr*0.3}); }
    const nc=Math.round(4+3*o.sy);
    for(let i=0;i<nc;i++){
      const u=(i+0.5)/nc, y=lerp(yb,yt,u)+rr(-0.12,0.12)*o.rMain, e=(y-o.crownY)/(o.rMain*o.sy), w=o.rMain*Math.sqrt(Math.max(0.12,1-e*e));
      const az=ph+i*2.39996+rr(-0.3,0.3), d=w*rr(0.3,0.62), rc=Math.max(0.4*o.rMain,w*rr(0.52,0.7)), E=[Math.cos(az)*d,y,Math.sin(az)*d];
      const at=attach(y-rc*rr(0.4,0.9)), r0=Math.min(at.r,tr*0.32);
      parts.push(tube(archPts(at.p,E,3,birch?0.16:0.08,rg),(t,a)=>lerp(r0,r0*0.25,t),4,limbC,true));
      cl.push({x:E[0],y:E[1],z:E[2],r:rc,sy:rr(0.8,1),core:!(i&1)});
    }
    cl.push({x:rr(-0.1,0.1),y:yt-o.rMain*0.3,z:rr(-0.1,0.1),r:o.rMain*0.5,sy:1,core:true});
  }
  if(!birch) deadTwigs(parts,1,tp,H*0.35,H*0.7,tr*0.13,tr*3.2,0.25,0.7,rg,rr);
  const L=clamp(0.22*o.rMain+0.1,0.3,0.62)*0.76, nS=Math.round(215*(o.rMain+o.spread*0.5)*Math.sqrt(Math.max(o.sy,0.5)));
  const cw=treeCrown(cl,C,L,nS,rg,rr,LEAF[o.leaf||'oval']);
  return {trunk:merge(parts), leaves:merge(cw.core.concat([cw.leaves]))};
}
// the Sakura Vale's cherry: a wide, flat crown on a leaning trunk (lean as in makeSakura)
function makeSakuraHi(){
  const t=makeBroadleafHi({trunkH:3.0, tr:0.34, crownY:4.6, rMain:2.1, blobs:7, spread:2.5, sy:0.55, branches:5, bark:0x4a3434, leaf:'petal'},77);
  const lean=g=>{ const p=g.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i); p.setX(i,p.getX(i)+y*y*0.018); } return g; };
  return {trunk:lean(t.trunk), leaves:lean(t.leaves)};
}
// a dead tree: a flared, broken trunk and forked bare branches
function makeSnagHi(){
  const {r:rg,R:rr}=mrng(91), parts=[], col=barkHi(0x6b6254,91), pts=[];
  for(let s=0;s<=9;s++){ const t=Math.pow(s/9,1.25); pts.push([Math.sin(t*2.2)*0.12*t,-0.25+t*6.75,Math.cos(t*1.9)*0.1*t]); }
  const fr=furrow(91,0.1);
  parts.push(tube(pts,(t,a)=>{ const y=-0.25+Math.pow(t,1.25)*6.75; return lerp(0.3,0.09,clamp(y/6.5))*rootFlare(y,a,0.9,4,1.3)*fr(t,a,6.5); },8,col,true));
  rootsHi(parts,3,0.3,4,1.3,rg,rr,col,[0,0,0]);
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
  for(let k=0;k<2;k++){ const a=rg()*TAU, d=spread*rr(0.9,1.4); blobs.push({r:rr(0.3,0.42),x:Math.cos(a)*d,y:rr(0.28,0.42),z:Math.sin(a)*d,sy:0.8}); }   // low skirts that reach the grass
  const cw=crownHi(blobs,C,0.19,1,rg,0,1.4), st=bshStems(rg,rr,5,spread*0.6,0.45,3);   // a few stems show at the foot (bush-models.js)
  return merge(cw.core.concat([cw.leaves],st));
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
