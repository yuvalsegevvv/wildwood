//@ The hiker's hair (a cap plus tapered locks: fringe, side locks, tails, braids, spikes; length / volume / fringe sliders) and the hats
/* ---------- hair and hats (head-local coordinates, see model-face.js) ----------
   Anime hair is not a helmet: a thin cap carries ribbons of hair that lie on the scalp and end in points. `scalpLock` lays a ribbon along a meridian of the
   head; `fit` runs head-hugging pieces through the head's sculpt so they follow the jaw and skull, while hanging parts (tails, the back curtain) are only scaled. */
function buildHair(X,F){
  const {L,S,sg,hairCol}=X, {sculpt,fs}=F, H=L.hair, hat=L.hat!=='none', parts=[];
  const hv=hat?Math.min(S.hairVolume,1.04):S.hairVolume, hl=S.hairLength, bg=S.bangs, R=(hat?0.112:0.118)*hv, G=faceG;
  // hair colour: a bright band across the crown (the anime "ring"), darker underneath and toward the nape
  const hp=(x,y,z,c)=>{ c.copy(hairCol).multiplyScalar(0.84+0.3*G(y,0.075,0.03)*(z<0.04?1:0.45)+(y<0?0.05*y*10:0)); };
  const add=(g,fn)=>{ parts.push(pc(g,fn||hp)); };
  const sp=(th,ph,r)=>[r*Math.sin(ph)*Math.sin(th),r*Math.cos(ph),-r*Math.sin(ph)*Math.cos(th)];   // a point on a sphere: azimuth th (0 = front, + toward +x), polar angle ph
  // lay hair flat on the scalp: shrink every vertex's distance from the head's centre toward R (a ribbon, not a rope)
  const flat=(g,k)=>{ const p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), l=Math.hypot(x,y,z)||1, nl=l>R*0.7?R+(l-R)*k:l; p.setXYZ(i,x*nl/l,y*nl/l,z*nl/l); } return smoothN(g); };
  const fit=g=>{ sculpt(g,false); g.scale(fs[0],fs[1],1); return g; };
  const hang=g=>{ g.scale(fs[0],1,1); return g; };   // parts that hang below the jaw are not squeezed by the sculpt
  // a ribbon on the scalp from polar ph0 to ph1 at azimuth th, drifting sideways by `sw`, ending in a free tip
  const scalpLock=(th,ph0,ph1,rad,o)=>{ o=o||{}; const P=[], n=4, sw=o.sw||0;
    for(let k=0;k<=n;k++){ const f=k/n; P.push(sp(th+sw*f,lerp(ph0,ph1,f),(o.R||R)+0.004*Math.sin(f*Math.PI)+(o.lift||0)*f)); }
    if(o.tip) P.push(sp(th+sw*1.15,ph1+o.tip,(o.R||R)+0.003+(o.lift||0)));
    const g=sweepTube(P,rad,sg(8),{cap:'point',rings:sg(14)}); flat(g,o.k||0.5); return fit(g); };
  const cap=(r,tl,tilt)=>shell(r,0,tl*Math.PI,0,tilt,sg(40),sg(20));
  const crown=(r,tl,tilt)=>add(fit(cap(r*hv,tl,tilt)));
  // the fringe: ribbons from the crown down over the forehead, each a different length and ending in a point, swept to one side; the slider sets how far they hang
  const fringe=(n,spread,sweep)=>{ if(bg<0.05) return; const rng=mulberry32(77+n);
    for(let i=0;i<n;i++){ const f=i/(n-1)*2-1, af=Math.abs(f), yb=0.074-0.03*bg-0.016*bg*(i%2)-0.012*rng()*bg, ph1=Math.acos(clamp(yb/R,-0.9,0.9)), w=0.0155-0.0035*af+0.003*rng();
      add(scalpLock(f*spread,0.15*Math.PI,ph1,[0.009,w,w*1.1,w*0.6,0.0015],{sw:sweep*(0.7+0.6*(1-af))+f*0.2,tip:0.11*bg,lift:0.002+0.006*(1-af),k:0.42})); } };
  // locks in front of the ears, hanging toward the jaw and curling in at the tip; `len` (head units) says how far
  const sideLocks=len=>{ for(const sd of [-1,1]){
    const P=[sp(sd*1.2,0.34*Math.PI,R),sp(sd*1.33,0.5*Math.PI,R),[sd*0.103,-0.03,-0.04],[sd*0.099,-0.03-len*0.55,-0.045],[sd*0.088,-0.03-len,-0.052]];
    const g=sweepTube(P,[0.007,0.0135,0.0125,0.0075,0.0015],sg(8),{cap:'point',rings:sg(14)}); flat(g,0.5); add(len>0.08?hang(g):fit(g)); } };
  // the back and sides: overlapping ribbons from the crown, each ending in a point at its own height (above the ears at the sides, lower at the nape), so the edge is jagged, not a bowl's rim
  const backLocks=(n,drop,seed)=>{ const rng=mulberry32(seed||11); for(let i=0;i<n;i++){ const th=1.15+(TAU-2.3)*(i+0.5+(rng()-0.5)*0.6)/n, back=Math.max(0,-Math.cos(th)), pe=(0.455+0.15*smoothstep(0.05,0.85,back)+drop*(0.5+0.8*rng()))*Math.PI, w=0.0175+0.004*rng();
    add(scalpLock(th,0.2*Math.PI,pe,[0.01,w,w*1.1,w*0.65,0.002],{sw:(rng()-0.5)*0.12,tip:0.05+0.07*rng()+drop*2,lift:0.003+0.004*rng(),k:0.6,R:R-0.002*(i%2)})); } };
  // a flat curved blade of hair standing out of the scalp at (th, ph): wide across the head, thin front to back, ending in a point; `lean` tips it (x, y, z) from straight out
  const blade=(th,ph,len,wid,lean)=>{ const a=sp(th,ph,R*0.95), d=new THREE.Vector3(...sp(th,ph,1)).add(new THREE.Vector3(lean[0],lean[1],lean[2])).normalize(), w=new THREE.Vector3(Math.cos(th),0,Math.sin(th)).normalize(), n=new THREE.Vector3().crossVectors(w,d).normalize();
    w.crossVectors(d,n).normalize();
    const g=sweepTube([[0,0,0],[0,len*0.5,len*0.1],[0,len,len*0.3]],[wid,wid*0.85,wid*0.32,0.0015],sg(8),{cap:'point',rings:sg(10)});
    g.scale(1.55,1,0.5); g.applyMatrix4(new THREE.Matrix4().makeBasis(w,d,n)); g.translate(a[0],a[1],a[2]); return g; };
  const tie=(x,y,z,r)=>add(csph(r,sg(10),sg(8)).scale(1,0.8,1).translate(x,y,z),(xx,yy,zz,c)=>c.set(0xc83a4a));

  // a signature outfit brings its own hair and head item: kit.hair(F, T) composes the pieces above (T) and its own geometry (T.add paints and collects it), kit.head(F) is the hat
  if(X.kit){ const k=X.kit, T={add,sp,flat,fit,hang,scalpLock,crown,fringe,sideLocks,backLocks,blade,tie,hp,R,hv,hl,bg};
    if(k.hair){ const ex=k.hair(F,T); if(ex) parts.push(...ex); } if(k.head) parts.push(...k.head(F,T)); return parts; }
  if(H==='buzz') crown(0.108,0.42,0.38);
  if(H==='short'){ crown(0.114,0.5,0.32); add(fit(shell(0.111*hv,0.38*Math.PI,0.17*Math.PI,1.9,0,sg(30),sg(8)))); fringe(8,1.0,0.14); sideLocks(0.05); backLocks(sg(18),0,11); }
  if(H==='messy'){ crown(0.116,0.52,0.3); fringe(8,1.05,0.3); sideLocks(0.05); backLocks(sg(14),0.02,21);
    const rng=mulberry32(4242); for(let i=0;i<10;i++){ const th=rng()*TAU, ph=(0.14+rng()*0.3)*Math.PI; add(hang(blade(th,ph,(0.04+rng()*0.04)*(0.8+0.3*hl),0.016+rng()*0.006,[(rng()-0.5)*0.6,0.1+rng()*0.3,0.2+rng()*0.4]))); } }
  if(H==='spiky'){ crown(0.114,0.5,0.32); sideLocks(0.05); backLocks(sg(12),0.01,31);
    // blades fanned over the crown and swept back, three longer ones pointing forward over the brow
    for(const [th,ph,len,lean] of [[0.25,0.13,0.085,[0,0.5,0.9]],[-0.35,0.15,0.08,[0,0.5,0.9]],[0.9,0.2,0.085,[0.2,0.35,0.8]],[-0.95,0.2,0.085,[-0.2,0.35,0.8]],[1.7,0.28,0.085,[0.2,0.2,0.7]],[-1.7,0.28,0.085,[-0.2,0.2,0.7]],[2.5,0.27,0.08,[0,0.1,0.6]],[-2.5,0.27,0.08,[0,0.1,0.6]],[3.1,0.25,0.085,[0,0,0.6]]]) add(hang(blade(th,ph*Math.PI,len*(0.85+0.25*hl),0.03,lean)));
    for(const f of [-0.75,0,0.75]){ const th=f*0.8, ph=0.2*Math.PI, len=0.06*Math.max(0.3,bg), a=sp(th,ph,R*0.97), d=sp(th,0.42*Math.PI,1);
      add(fit(sweepTube([a,[a[0]+d[0]*len*0.5,a[1]+d[1]*len*0.2+0.01,a[2]+d[2]*len*0.5],[a[0]+d[0]*len,a[1]-0.045*Math.max(0.3,bg),a[2]+d[2]*len*1.1]],[0.022,0.02,0.002],sg(8),{cap:'point',rings:sg(9)}))); } }
  if(H==='curly'){ const r=hat?(L.hat==='helm'?0.11:0.118):0.138*hv; const g=cap(r,0.56,0.3), p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i),j=1+(h3(x*3,y*3,z*3)-0.5)*0.12; p.setXYZ(i,x*j,y*j,z*j); } smoothN(g); add(fit(g));
    add(fit(shell(r*0.95,0.4*Math.PI,0.22*Math.PI,1.9,0,sg(30),sg(8))));
    if(!hat){ const rng=mulberry32(31); for(let i=0;i<16;i++){ const th=(i/16)*TAU+rng()*0.2, ph=(0.46+rng()*0.1)*Math.PI; const q=sp(th,ph,r*0.98); add(csph(0.032+rng()*0.01,sg(10),sg(8)).translate(q[0],q[1]-0.01,q[2]).scale(fs[0],1,1)); } }
    fringe(5,0.85,0.1); }
  if(H==='bob'||H==='long'||H==='twintail'||H==='braid'||H==='ponytail'||H==='bun') crown(H==='bob'||H==='long'?0.116:0.113,0.5,H==='ponytail'||H==='bun'?0.24:0.3);
  if(H==='bob'){ add(fit(shell(0.118*hv,0.34*Math.PI,0.2*Math.PI,1.55,0,sg(36),sg(10)))); fringe(8,1.05,0.12); sideLocks(0.1*hl); backLocks(sg(20),0.09*hl,51); }
  if(H==='long'){ fringe(8,1.1,0.1); sideLocks(0.2*hl);
    const rings=[]; const n=sg(18), len=0.5*hl;
    for(let i=0;i<=n;i++){ const t=i/n, e=t*t*(3-2*t); rings.push({y:0.04-len*t,rx:lerp(0.108,0.128,Math.sin(t*Math.PI*0.7))*(1-0.82*Math.pow(t,3))*hv,rz:lerp(0.05,0.06,Math.sin(t*Math.PI*0.6))*(1-0.85*Math.pow(t,3)),zc:0.062+0.045*Math.sin(Math.min(1,t*1.8)*Math.PI*0.5)-0.02*t}); }
    const cg=loftRings(rings,sg(32)), cp=cg.attributes.position; for(let i=0;i<cp.count;i++){ const x=cp.getX(i), z=cp.getZ(i); if(z>0.04) cp.setZ(i,z+0.0035*Math.sin(x*150)); } smoothN(cg); add(hang(cg));
    for(let i=0;i<5;i++){ const f=i/4*2-1, y0=0.04-len*0.9, P=[[f*0.05,y0,0.105],[f*0.058,y0-0.05*hl,0.1],[f*0.06+0.012*Math.sin(i*2),y0-0.1*hl-0.02*i%2,0.092]]; add(hang(sweepTube(P,[0.02,0.017,0.002],sg(7),{cap:'point',rings:sg(8)}))); }
    for(const sd of [-1,1]){ const P=[[sd*0.1,0.0,-0.01],[sd*0.114,-0.1*hl,-0.02],[sd*0.124,-0.22*hl,-0.025],[sd*0.12,-0.34*hl,-0.02]]; add(hang(sweepTube(P,[0.02,0.026,0.022,0.003],sg(8),{cap:'point',rings:sg(14)}))); } }
  if(H==='ponytail'){ fringe(8,1.0,0.12); sideLocks(0.05); tie(0,0.072,0.092,0.02);
    const P=[[0,0.078,0.09],[0,0.05,0.16],[0,-0.03,0.2],[0,-0.14*hl,0.185],[0.012,-0.26*hl,0.15]];
    add(hang(sweepTube(P,[0.026,0.036,0.04,0.03,0.003],sg(10),{cap:'point',rings:sg(18)})));
    for(const sd of [-1,1]) add(hang(sweepTube([[sd*0.012,0.075,0.092],[sd*0.03,0.04,0.17],[sd*0.042,-0.04,0.2],[sd*0.04,-0.15*hl,0.18],[sd*0.03,-0.24*hl,0.15]],[0.012,0.02,0.022,0.016,0.002],sg(8),{cap:'point',rings:sg(14)}))); }
  if(H==='twintail'){ fringe(8,1.0,0.1); sideLocks(0.05);
    for(const sd of [-1,1]){ tie(sd*0.088,0.07,0.04,0.018);
      add(hang(sweepTube([[sd*0.088,0.07,0.04],[sd*0.15,0.045,0.07],[sd*0.19,-0.06,0.1],[sd*0.2,-0.2*hl,0.09],[sd*0.17,-0.34*hl,0.05]],[0.02,0.03,0.032,0.024,0.003],sg(10),{cap:'point',rings:sg(18)}))); } }
  if(H==='braid'){ fringe(8,1.0,0.12); sideLocks(0.06); tie(0,0.0,0.105,0.02);
    const len=0.45*hl; for(let s=0;s<3;s++){ const ph=s*TAU/3, P=[]; for(let i=0;i<=10;i++){ const t=i/10; P.push([0.022*Math.sin(t*16+ph)*(0.4+0.6*t)*(1-0.3*t),-0.01-len*t,0.11+0.03*Math.sin(t*3)+0.016*Math.cos(t*16+ph)]); }
      add(hang(sweepTube(P,[0.02,0.026,0.026,0.024,0.014,0.003],sg(8),{cap:'point',rings:sg(30)}))); }
    tie(0,-0.01-len*0.96,0.116,0.017); }
  if(H==='bun'){ fringe(8,1.0,0.12); sideLocks(0.05); backLocks(sg(10),-0.02,41); if(!hat){ add(hang(csph(0.056,sg(16),sg(12)).translate(0,0.092,0.078))); tie(0,0.058,0.085,0.045); } }
  if(L.ahoge&&!hat&&H!=='bald'){ add(hang(sweepTube([[0.004,0.1,-0.042],[0.0,0.17,-0.05],[-0.02,0.23,-0.036],[0.0,0.27,-0.012],[0.02,0.26,0.008]],[0.0075,0.0065,0.005,0.003,0.0012],sg(6),{cap:'point',rings:sg(14)}))); }

  /* hats */
  const hc=L.hatColor, scl=g=>g.scale(fs[0],fs[1],1);
  if(L.hat==='ranger'){
    parts.push(pc(new THREE.CylinderGeometry(0.205,0.205,0.012,sg(36)).translate(0,0.078,0),c=>c.set(hc)));
    parts.push(pc(new THREE.CylinderGeometry(0.09,0.118,0.105,sg(28)).translate(0,0.135,0),c=>c.set(hc)));
    parts.push(pc(new THREE.CylinderGeometry(0.119,0.119,0.024,sg(28)).translate(0,0.095,0),c=>c.set(hc).multiplyScalar(0.55)));
  } else if(L.hat==='beanie'){
    parts.push(pc(scl(sculpt(shell(0.123,0,0.46*Math.PI,0,0.415,sg(34),sg(16)),false)),c=>c.set(hc)));
    parts.push(pc(scl(sculpt(shell(0.128,0.36*Math.PI,0.1*Math.PI,0,0.415,sg(34),sg(6)),false)),c=>c.set(hc).multiplyScalar(0.82)));
    parts.push(pc(csph(0.032,sg(12),sg(10)).translate(0,0.125*fs[1],0.05),c=>c.set(0xf2eee4)));
  } else if(L.hat==='helm'){
    parts.push(pc(scl(sculpt(shell(0.128,0,0.475*Math.PI,0,0.4,sg(34),sg(16)),false)),(x,y,z,c)=>c.set(hc).multiplyScalar(0.88+0.18*clamp(y*6))));
    parts.push(pc(scl(sculpt(shell(0.133,0.385*Math.PI,0.09*Math.PI,0,0.4,sg(34),sg(6)),false)),c=>c.set(hc).multiplyScalar(0.7)));
    parts.push(pc(vbox(0.018,0.062,0.016,0,0.03,-0.116).rotateX(0.14),c=>c.set(hc).multiplyScalar(0.8)));
    if(L.plume) parts.push(pc(new THREE.CylinderGeometry(0.13,0.13,0.024,sg(24),1,false,Math.PI,Math.PI).rotateZ(-Math.PI/2).scale(1,0.8,1.05).translate(0,0.03,0).rotateX(0.4).translate(0,0.02*fs[1],0.0),(x,y,z,c)=>c.set(L.plume).multiplyScalar(0.8+0.35*clamp((y-0.1)*8))));
  } else if(L.hat==='kasa'){   // a conical straw hat (the Sakura Vale)
    parts.push(pc(new THREE.ConeGeometry(0.3,0.15,sg(28)).translate(0,0.14*fs[1],0),(x,y,z,c)=>c.set(hc).multiplyScalar(0.84+0.22*h3(Math.round(Math.atan2(z,x)*8),0,5))));
    parts.push(pc(new THREE.CylinderGeometry(0.1,0.11,0.05,sg(20)).translate(0,0.085*fs[1],0),c=>c.set(hc).multiplyScalar(0.6)));
  } else if(L.hat==='cap'){
    parts.push(pc(scl(sculpt(shell(0.119,0,0.435*Math.PI,0,0.33,sg(34),sg(16)),false)),c=>c.set(hc)));
    parts.push(pc(new THREE.CylinderGeometry(0.1,0.1,0.01,sg(22),1,false,Math.PI/2,Math.PI).scale(1,1,1.15).rotateX(-0.12).translate(0,0.062*fs[1],-0.086),c=>c.set(hc).multiplyScalar(0.85)));
  }
  return parts;
}
