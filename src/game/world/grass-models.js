//@ Grass tufts in three levels of detail (fanned bunches of tapering blades: green, tall, drooping dry ones and seed stalks; grassMat colours and moves them), grass placement helpers (grassTint, grassSort), flowers with petals
/* A tuft is a bunch of ribbons fanned out from its centre: short green blades round the rim, a few tall arching ones in the middle, dry blades that
   droop over to the ground and thin seed stalks with a spindle head. Each blade leans and curls as it rises (the bend grows with height) and narrows
   to a sharp point. Normals point mostly up with a lean toward the bend, so a field shades like the ground it stands on instead of flickering.
   The attribute `gk` (kind, t) tells grassMat (engine/materials.js) what each vertex is: kind 0 green, 1 dry, 2 seed stalk (shown on some tufts
   only), t 0 at the root to 1 at the tip; the shader paints the root in the ground's colour (the instance colour), the tip fresher, the dry blades
   straw, and bends the tip in the wind. The vertex colour holds only the blade's own tone. Three versions of the tuft: the near one within 30 m,
   a fatter, sparser one to 62 m, the far one to 100 m (addGrass, generation-chunks.js); phones get one cheap tuft. */
function makeGrassTuft(o,seed){
  const {r:rg,R:rr}=mrng(seed), P=[], N=[], C=[], K=[], rt=o.root||0.6;   // rt: the root's shade (the coarser levels darker: fewer blades need more contrast)
  const tri=(a,b,c,n,ca,cb,cc,k,ta,tb,tc)=>{ P.push(...a,...b,...c); if(n.length===3&&Array.isArray(n[0])) N.push(...n[0],...n[1],...n[2]); else N.push(...n,...n,...n); C.push(...ca,...cb,...cc); K.push(k,ta,k,tb,k,tc); };
  const blade=(kind,segs,h,w,bend,lean0,r,fan)=>{
    const a=rg()*TAU, bx=Math.cos(a)*r, bz=Math.sin(a)*r, phi=r>o.radius*0.3?a+rr(-fan,fan):rg()*TAU, hx=Math.cos(phi), hz=Math.sin(phi);   // (rim blades lean outward: a tuft opens like a fountain)
    const px=-hz, pz=hx, twist=rr(-0.5,0.5), nn=nrm3(hx*0.3,0.92,hz*0.3), nL=nrm3(hx*0.3-px*0.55,0.92,hz*0.3-pz*0.55), nR=nrm3(hx*0.3+px*0.55,0.92,hz*0.3+pz*0.55), hue=rr(-1,1), jit=0.86+rg()*0.28, kk=kind+rg()*0.9, rtb=r>o.radius*0.6?Math.min(rt+0.2,0.9):rt;   // nL / nR: the two edges lean apart, so a blade shades across its width; kk: the kind plus a per-blade random for the shader; rtb: roots at the tuft's rim are lighter (the shade belongs in its heart)
    const pts=[[bx,0,bz]]; let x=bx, y=0, z=bz;
    for(let s=1;s<=segs;s++){ const t=s/segs, th=lean0+bend*Math.pow(t,1.8), st=h/segs; x+=Math.sin(th)*hx*st; y+=Math.cos(th)*st; z+=Math.sin(th)*hz*st; pts.push([x,y,z]); }
    const col=t=>kind?[0.8+0.25*t,0.8+0.25*t,0.8+0.25*t].map(v=>v*jit):   // dry and seed: the shader mixes the straw, this is only the shade
      [(rtb+(1.04-rtb)*t)*jit*(1+hue*0.1),(rtb+0.03+(1.14-rtb)*t)*jit,(rtb-0.04+(0.84-rtb)*t)*jit*(1-hue*0.2)];   // green: dark root (shade at the ground) to a fresh tip, some blades bluer, some yellower
    const side=s=>{ const t=s/segs, wd=w*(1-Math.pow(t,2.2))*(kind===2?1:0.85+0.6*t*(1-t)), tw=twist*t, cx=px*Math.cos(tw)-hx*Math.sin(tw)*0.5, cz=pz*Math.cos(tw)-hz*Math.sin(tw)*0.5, p=pts[s];
      return [[p[0]-cx*wd,p[1],p[2]-cz*wd],[p[0]+cx*wd,p[1],p[2]+cz*wd]]; };
    let prev=side(0);
    for(let s=1;s<segs;s++){
      const cur=side(s), t0=(s-1)/segs, t1=s/segs, c0=col(t0), c1=col(t1);
      const d0=c0.map(v=>v*0.88), d1=c1.map(v=>v*0.88);   // the left edge is the shaded half of a V-folded blade
      tri(prev[0],prev[1],cur[1],[nL,nR,nR],d0,c0,c1,kk,t0,t0,t1); tri(prev[0],cur[1],cur[0],[nL,nR,nL],d0,c1,d1,kk,t0,t1,t1);
      prev=cur;
    }
    const tip=pts[segs], tl=(segs-1)/segs, cl=col(tl), ct=col(1);
    tri(prev[0],prev[1],tip,[nL,nR,nn],cl.map(v=>v*0.88),cl,ct,kk,tl,tl,1);
    return {tip, dir:nrm3(tip[0]-pts[segs-1][0],tip[1]-pts[segs-1][1],tip[2]-pts[segs-1][2])};
  };
  const R0=o.radius;
  for(let b=0;b<o.main;b++){ const r=Math.sqrt(rg())*R0, k=r/R0; blade(0,o.segs,rr(o.h[0],o.h[1])*(1-0.32*k),rr(o.w[0],o.w[1]),rr(0.15,0.55)+0.65*k*rg(),rr(0,0.1)+0.18*k,r,0.6); }
  for(let b=0;b<(o.tall||0);b++) blade(0,o.tallSegs||o.segs,rr(o.h[1]*1.05,o.h[1]*1.4),rr(o.w[0],o.w[1])*0.8,rr(0.25,0.7),rr(0,0.08),Math.sqrt(rg())*R0*0.35,0.4);
  for(let b=0;b<(o.dry||0);b++) blade(1,o.drySegs||o.segs,rr(o.h[0]*1.2,o.h[1]),rr(o.w[0],o.w[1])*0.9,rr(1.3,2.1),rr(0.15,0.3),R0*rr(0.4,0.9),0.5);   // drooping: the tip arches back toward the ground
  for(let b=0;b<(o.seed||0);b++){   // a thin stalk and a spindle head of two crossed diamonds (one at the mid level)
    const st=blade(2,o.segs,rr(o.h[1]*1.15,o.h[1]*1.55),o.w[0]*0.32,rr(0.12,0.4),rr(0,0.06),Math.sqrt(rg())*R0*0.5,0.3), d=st.dir, L=rr(0.06,0.09), W=rr(0.005,0.007), c=[1,1,1];
    const p0=st.tip, p2=[p0[0]+d[0]*L,p0[1]+d[1]*L,p0[2]+d[2]*L], pm=[p0[0]+d[0]*L*0.45,p0[1]+d[1]*L*0.45,p0[2]+d[2]*L*0.45];
    for(let q=0;q<(o.headQ||2);q++){
      const ang=q*Math.PI/2+rg(), ax=Math.cos(ang), az=Math.sin(ang), ad=ax*d[0]+az*d[2], side=nrm3(ax-d[0]*ad,-d[1]*ad,az-d[2]*ad), nn=nrm3(side[2]*0.3,0.9,-side[0]*0.3);
      const s0=[pm[0]-side[0]*W,pm[1]-side[1]*W,pm[2]-side[2]*W], s1=[pm[0]+side[0]*W,pm[1]+side[1]*W,pm[2]+side[2]*W];
      tri(p0,s0,p2,nn,c,c,c,2,1,1,1); tri(p0,p2,s1,nn,c,c,c,2,1,1,1);
    }
  }
  if(o.lawn){   // lawn: single-triangle short blades over a wide skirt round the tuft (kind 3, drawn from their own stream so the blades above do not move)
    const L=mrng(seed+500), lr=L.r, lR=L.R;
    for(let b=0;b<o.lawn;b++){
      const a=lr()*TAU, r=o.lawnR*Math.sqrt(lr()), bx=Math.cos(a)*r, bz=Math.sin(a)*r, ph=lr()*TAU, hx=Math.cos(ph), hz=Math.sin(ph), w=lR(0.007,0.012)*(o.lawnW||1), h=lR(0.07,0.16), lean=lR(0.1,0.5), kk=3+lr()*0.9;
      const base0=[bx-hz*w,0,bz+hx*w], base1=[bx+hz*w,0,bz-hx*w], tip=[bx+Math.sin(lean)*hx*h,Math.cos(lean)*h,bz+Math.sin(lean)*hz*h], nn=nrm3(hx*0.3,0.92,hz*0.3), cr=[0.62,0.66,0.34], ct=[1.04,1.16,0.84];
      tri(base0,base1,tip,nn,cr,cr,ct,kk,0,0,1);
    }
  }
  const g=mkGeo(P,N,C); g.setAttribute('gk',new THREE.Float32BufferAttribute(K,2));
  return g;
}
/* the three levels used on the desktop (near 194 triangles, mid 60, far 30), and the one phones get (27). Wide tufts of many short-segmented blades:
   a 3-segment blade (5 triangles) curves well enough at hiker height, so the triangles go into more blades over more ground, not smoother ones */
function buildGrassTufts(){
  if(VD>=2) return [
    makeGrassTuft({main:24,tall:3,dry:3,seed:2,segs:3,tallSegs:4,radius:0.42,h:[0.3,0.66],w:[0.011,0.02],lawn:60,lawnR:0.95},11),
    makeGrassTuft({main:13,tall:2,dry:2,seed:1,segs:2,tallSegs:3,radius:0.4,h:[0.3,0.66],w:[0.026,0.04],headQ:1,root:0.5,lawn:14,lawnR:1.1,lawnW:1.6},12),
    makeGrassTuft({main:9,tall:1,segs:2,radius:0.36,h:[0.3,0.66],w:[0.05,0.076],root:0.46},13)];
  return [makeGrassTuft({main:7,tall:1,dry:1,segs:2,radius:0.28,h:[0.32,0.66],w:[0.032,0.052],root:0.5},11)];
}
/* Placement helpers for addGrass / genChunk. grassTint: a tuft's instance colour is the ground's own (terrainColor) nudged a little toward fresh green
   (u 0..1: its brightness jitter), so the root melts into the ground and a far tuft fades into it (grassMat). grassHash is grassMat's per-tuft hash
   (gh12 of floor(x*2), floor(z*2), the same float steps): grassSort puts the tufts the shader shrinks away first (hash > 0.58 by 56 m, > 0.83 by 24 m)
   at the end of the list, which is where addInstanced's thinned levels (frac 0.6 / 0.85) cut, so the far levels thin without a visible pop. */
const GRASS_FRESH=new THREE.Color(0x5f8f35);
function grassTint(c,u){ return c.lerp(GRASS_FRESH,0.1).multiplyScalar(0.96+0.12*u); }
function grassHash(x,z){
  const f=Math.fround, fr=v=>f(v-Math.floor(v)), px=Math.floor(x*2), pz=Math.floor(z*2);
  let a=fr(f(px*f(0.1031))), b=fr(f(pz*f(0.1031))), c=a;
  const d=f(f(a*f(b+33.33))+f(b*f(c+33.33))+f(c*f(a+33.33))); a=f(a+d); b=f(b+d); c=f(c+d);
  return fr(f(f(a+b)*c));
}
function grassSort(items){
  const bins=[[],[],[]];
  for(const it of items){ const h=grassHash(it.x,it.z); bins[h>0.83?2:h>0.58?1:0].push(it); }
  let i=0; for(const b of bins) for(const it of b) items[i++]=it;
  return items;
}

/* ---------- wildflowers: a bent stem with a leaf or two, a head of seven petals round a dark centre ---------- */
function makeStemHi(h,green,seed){
  const {r:rg,R:rr}=mrng(seed), F=flatAcc(), S=4, ph=rg()*TAU, lean=rr(0.02,0.07), up=[0,1,0], pts=[];
  for(let s=0;s<=S;s++){ const t=s/S; pts.push([Math.cos(ph)*lean*t*t*h*2,t*h,Math.sin(ph)*lean*t*t*h*2]); }
  const dk=[green[0]*0.7,green[1]*0.7,green[2]*0.7];
  for(let k=0;k<2;k++){
    const a=k*Math.PI/2, px=Math.cos(a), pz=Math.sin(a);
    for(let s=0;s<S;s++){
      const t0=s/S, t1=(s+1)/S, w0=0.011*(1-t0*0.4), w1=0.011*(1-t1*0.4), p=pts[s], q=pts[s+1], c0=[dk[0]+(green[0]-dk[0])*t0,dk[1]+(green[1]-dk[1])*t0,dk[2]+(green[2]-dk[2])*t0], c1=[dk[0]+(green[0]-dk[0])*t1,dk[1]+(green[1]-dk[1])*t1,dk[2]+(green[2]-dk[2])*t1];
      const A1=[p[0]-px*w0,p[1],p[2]-pz*w0], A2=[p[0]+px*w0,p[1],p[2]+pz*w0], B1=[q[0]-px*w1,q[1],q[2]-pz*w1], B2=[q[0]+px*w1,q[1],q[2]+pz*w1];
      F.tri(A1,A2,B2,up,up,up,c0,c0,c1); F.tri(A1,B2,B1,up,up,up,c0,c1,c1);
    }
  }
  for(let k=0;k<2;k++){   // two leaves near the foot
    const a=ph+k*Math.PI+rr(-0.5,0.5), y0=h*(0.15+0.12*k), p=pts[Math.round((0.15+0.12*k)*S)], L=rr(0.09,0.14), dx=Math.cos(a), dz=Math.sin(a), nn=nrm3(dx*0.3,1,dz*0.3);
    F.tri([p[0],y0,p[2]],[p[0]+dx*L*0.5-dz*0.02,y0+L*0.22,p[2]+dz*L*0.5+dx*0.02],[p[0]+dx*L,y0-L*0.1,p[2]+dz*L],nn,nn,nn,dk,green,green);
    F.tri([p[0],y0,p[2]],[p[0]+dx*L*0.5+dz*0.02,y0+L*0.22,p[2]+dz*L*0.5-dx*0.02],[p[0]+dx*L,y0-L*0.1,p[2]+dz*L],nn,nn,nn,dk,green,green);
  }
  return F.done();
}
function makeFlowerHead(seed){
  const {r:rg,R:rr}=mrng(seed), F=flatAcc(), n=7, y0=0.46, ctr=[0,y0+0.012,0], cc=[0.55,0.5,0.4], cw=[0.6,0.5,0.4], up=[0,1,0];
  const rot=rg()*TAU;
  for(let k=0;k<n;k++){   // the dark centre: a small disc
    const a0=rot+k/n*TAU, a1=rot+(k+1)/n*TAU, r=0.02;
    F.tri(ctr,[Math.cos(a0)*r,y0+0.006,Math.sin(a0)*r],[Math.cos(a1)*r,y0+0.006,Math.sin(a1)*r],up,up,up,cc,cw,cw);
  }
  for(let k=0;k<n;k++){   // petals: a kite from the centre to a tip, cupped upward
    const a=rot+k/n*TAU+rr(-0.06,0.06), da=0.33, L=rr(0.058,0.074), ca=Math.cos(a), sa=Math.sin(a), nn=nrm3(ca*0.5,1,sa*0.5);
    const tip=[ca*L,y0+0.028+rr(-0.006,0.01),sa*L], s0=[Math.cos(a-da)*L*0.55,y0+0.016,Math.sin(a-da)*L*0.55], s1=[Math.cos(a+da)*L*0.55,y0+0.016,Math.sin(a+da)*L*0.55];
    const inner=[ca*0.017,y0+0.004,sa*0.017], dark=[0.62,0.62,0.62], lit=[1.05,1.05,1.05];
    F.tri(inner,s0,tip,nn,nn,nn,dark,lit,lit); F.tri(inner,tip,s1,nn,nn,nn,dark,lit,lit);
  }
  return F.done();
}
