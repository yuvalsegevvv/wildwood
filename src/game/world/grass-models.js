//@ Grass tufts in three levels of detail (curved, tapering blades with a dark root and a bright tip) and flowers with petals
/* A tuft is `blades` ribbons of `segs` segments: each leans and curls over as it rises (the bend grows with height), narrows to a point, is
   shaded from a dark root to a light tip and jittered in tone (a few blades are dry and yellow). Normals point mostly up with a lean toward the bend,
   so a field shades like the ground it stands on instead of flickering blade by blade. Three versions of the same tuft: the near one is drawn
   within ~22 m, a fatter, sparser one to ~52 m and the old-style flat one beyond (see addGrass in generation-chunks.js). */
function makeGrassTuft(o,seed){
  const {r:rg,R:rr}=mrng(seed), F=flatAcc();
  for(let b=0;b<o.blades;b++){
    const a=rg()*TAU, r=Math.sqrt(rg())*o.radius, bx=Math.cos(a)*r, bz=Math.sin(a)*r;
    const h=rr(o.h[0],o.h[1]), w=rr(o.w[0],o.w[1]), phi=rg()*TAU, hx=Math.cos(phi), hz=Math.sin(phi), lean0=rr(0,0.12), bend=rr(o.bend[0],o.bend[1]);
    const px=-hz, pz=hx, twist=rr(-0.35,0.35), jit=0.84+rg()*0.32, dry=rg()<o.dry, nn=nrm3(hx*0.3,0.92,hz*0.3);
    const pts=[[bx,0,bz]]; let x=bx, y=0, z=bz;
    for(let s=1;s<=o.segs;s++){ const t=s/o.segs, th=lean0+bend*Math.pow(t,1.7), st=h/o.segs; x+=Math.sin(th)*hx*st; y+=Math.cos(th)*st; z+=Math.sin(th)*hz*st; pts.push([x,y,z]); }
    const col=t=>dry?[(0.52+0.7*t)*jit,(0.46+0.55*t)*jit,(0.24+0.22*t)*jit]:[(0.33+0.7*t)*jit*0.94,(0.38+0.82*t)*jit,(0.27+0.42*t)*jit];
    const side=(s)=>{ const t=s/o.segs, wd=w*(1-Math.pow(t,1.15)*0.97), tw=twist*t, cx=px*Math.cos(tw)-hx*Math.sin(tw)*0.5, cz=pz*Math.cos(tw)-hz*Math.sin(tw)*0.5, p=pts[s];
      return [[p[0]-cx*wd,p[1],p[2]-cz*wd],[p[0]+cx*wd,p[1],p[2]+cz*wd]]; };
    let prev=side(0);
    for(let s=1;s<o.segs;s++){
      const cur=side(s), c0=col((s-1)/o.segs), c1=col(s/o.segs);
      F.tri(prev[0],prev[1],cur[1],nn,nn,nn,c0,c0,c1); F.tri(prev[0],cur[1],cur[0],nn,nn,nn,c0,c1,c1);
      prev=cur;
    }
    const tip=pts[o.segs], ct=col(1), cl=col((o.segs-1)/o.segs);
    F.tri(prev[0],prev[1],tip,nn,nn,nn,cl,cl,ct);
  }
  return F.done();
}
// the three levels used on the desktop, and the one phones get
function buildGrassTufts(){
  if(VD>=2) return [
    makeGrassTuft({blades:20,segs:5,radius:0.2,h:[0.3,0.74],w:[0.017,0.03],bend:[0.15,0.95],dry:0.1},11),
    makeGrassTuft({blades:11,segs:3,radius:0.2,h:[0.3,0.74],w:[0.028,0.046],bend:[0.15,0.8],dry:0.1},12),
    makeGrassTuft({blades:8,segs:2,radius:0.15,h:[0.3,0.74],w:[0.045,0.068],bend:[0.1,0.6],dry:0.1},13)];
  return [makeGrassTuft({blades:9,segs:2,radius:0.16,h:[0.32,0.72],w:[0.03,0.05],bend:[0.1,0.7],dry:0.1},11)];
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
