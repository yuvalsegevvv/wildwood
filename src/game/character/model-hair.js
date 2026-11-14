//@ The hiker's hair (a cap plus tapered locks: fringe, side locks, tails, braids, spikes; length / volume / fringe sliders) and the hats
/* ---------- hair and hats (head-local coordinates, see model-face.js) ----------
   Anime hair is not a helmet: a thin cap carries ribbons of hair that lie on the scalp and end in points. `scalpLock` lays a ribbon along a meridian of the
   head; `fit` runs head-hugging pieces through the head's sculpt so they follow the jaw and skull, while hanging parts (tails, the back curtain) are only scaled. */
function buildHair(X,F){
  const {L,S,sg,hairCol}=X, {sculpt,fs}=F, H=L.hair, kH=X.kit&&X.kit.sl.hair, kHat=X.kit&&X.kit.sl.hat, hat=L.hat!=='none'&&!kH, parts=[];   // an outfit's hair item was drawn without a hat (its own volume rules): a hat over it is the wearer's choice
  const hv=hat?Math.min(S.hairVolume,1.04):S.hairVolume, hl=S.hairLength, bg=S.bangs, R=(hat?0.112:0.118)*hv, G=faceG;
  // hair colour: a bright band across the crown (the anime "ring"), darker underneath and toward the nape
  // (version 3.2: fine strand streaks along every lock, a softer sheen with a bright core, and a darker underlayer toward the nape and the roots)
  const hp=(x,y,z,c)=>{ const a=Math.atan2(x,z), streak=0.5+0.5*Math.sin(a*38+y*58+3*h3(Math.round(x*46),Math.round(y*20),Math.round(z*46))), sheen=G(y,0.082,0.02)*(z<0.06?1:0.3);
    c.copy(hairCol).multiplyScalar(0.8+0.3*G(y,0.075,0.03)*(z<0.04?1:0.45)+(y<0?0.05*y*10:0)).multiplyScalar(0.9+0.16*streak);
    if(y<-0.03) c.multiplyScalar(0.9+0.4*y);
    c.lerp(_tint.set(0xffffff),0.17*sheen*(0.6+0.4*streak)); };
  // version 3.4: every lock gets its own tone and a root-to-tip band (dark root, bright mid, warm light tip) and a dark seam along its edges, so overlapping locks read as separate clumps, not one shell
  let lockN=0;
  const lockHp=g=>{ const p=g.attributes.position; let t0=1e9, t1=-1e9; for(let i=0;i<p.count;i++){ const y=p.getY(i); if(y<t0) t0=y; if(y>t1) t1=y; } const E=Math.max(0.02,t1-t0), tone=0.8+0.4*h3(lockN++*7,13,5), tc=new THREE.Color();
    return (x,y,z,c)=>{ hp(x,y,z,c); const u=clamp((t1-y)/E,0,1), band=0.82+0.3*Math.sin(Math.min(1,u*1.15)*Math.PI*0.8)+0.1*u*u;   // u: 0 at the root, 1 at the tip
      const cl=0.5+0.5*Math.sin(Math.atan2(x,z)*13+Math.sin(y*30)*0.6), gr=0.84+0.26*cl*cl;   // clumps: broad strand bands running with the flow
      c.multiplyScalar(tone*band*gr); c.lerp(tc.set(0xffe2b0),0.1*u*u*u); }; };
  const add=(g,fn)=>{ const q=pc(g,fn||lockHp(g)); if(g.hairHang) q.hairHang=g.hairHang; parts.push(q); };   // (hairHang: a hanging lock that swings, see hair-sway.js; pc makes a new geometry, so the mark is carried over)
  const sp=(th,ph,r)=>[r*Math.sin(ph)*Math.sin(th),r*Math.cos(ph),-r*Math.sin(ph)*Math.cos(th)];   // a point on a sphere: azimuth th (0 = front, + toward +x), polar angle ph
  // lay hair flat on the scalp: shrink every vertex's distance from the head's centre toward R (a ribbon, not a rope)
  const flat=(g,k)=>{ const p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), l=Math.hypot(x,y,z)||1, nl=l>R*0.7?R+(l-R)*k:l; p.setXYZ(i,x*nl/l,y*nl/l,z*nl/l); } return smoothN(g); };
  const fit=g=>{ sculpt(g,false); g.scale(fs[0],fs[1],1); return g; };
  const hang=g=>{ g.scale(fs[0],1,1); return g; };   // parts that hang below the jaw are not squeezed by the sculpt
  const swing=g=>{ g.hairHang=true; return hang(g); };   // the same, and the lock swings with the head and the walk (hair-sway.js): tails, braids, long hair, side locks, strands
  // a ribbon on the scalp from polar ph0 to ph1 at azimuth th, drifting sideways by `sw`, ending in a free tip
  const scalpLock=(th,ph0,ph1,rad,o)=>{ o=o||{}; const P=[], n=4, sw=o.sw||0;
    for(let k=0;k<=n;k++){ const f=k/n; P.push(sp(th+sw*f,lerp(ph0,ph1,f),(o.R||R)+0.004*Math.sin(f*Math.PI)+(o.lift||0)*f)); }
    if(o.tip) P.push(sp(th+sw*1.15,ph1+o.tip,(o.R||R)+0.003+(o.lift||0)));
    const g=sweepTube(P,rad,sg(8),{cap:'point',rings:sg(14)}); flat(g,o.k||0.5); return fit(g); };
  // a shell's lower rim cut into points of different lengths (every second column of its last row hangs up to `amp` radians lower, tucked toward the scalp), so the cap ends
  // in hair tips and not in a helmet's straight edge; `ends`: a band that does not go all the way round also narrows to a point at both ends instead of a square corner
  const jag=(g,w,h,amp,ends)=>{ const p=g.attributes.position, W=w+1; if(p.count!==W*(h+1)||!amp) return g;
    const pol=i=>{ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), r=Math.hypot(x,y,z)||1; return [r,Math.acos(clamp(y/r,-1,1)),Math.atan2(x,z)]; }, put=(i,r,t,a)=>p.setXYZ(i,r*Math.sin(t)*Math.sin(a),r*Math.cos(t),r*Math.sin(t)*Math.cos(a));
    if(ends) for(let ix=0;ix<W;ix++){ const e=Math.min(ix,w-ix)/(w*0.16); if(e>=1) continue; const k=0.12+0.88*e*e*(3-2*e), t0=pol(ix)[1]; for(let iy=1;iy<=h;iy++){ const q=pol(iy*W+ix); put(iy*W+ix,q[0],t0+(q[1]-t0)*k,q[2]); } }
    for(let ix=1;ix<w;ix+=2){ const i=h*W+ix, q=pol(i), d=amp*(0.35+0.65*h3(ix*7,w,h)); put(i,q[0]*(1-0.12*d),q[1]+d,q[2]); }
    return smoothN(g); };
  const cap=(r,tl,tilt,amp)=>{ const g=jag(shell(r,0,tl*Math.PI,0,0,sg(40),sg(20)),sg(40),sg(20),amp===undefined?0.2:amp); if(tilt) g.rotateX(tilt); return g; };
  const band=(r,t0,tl,gap,w,h)=>jag(shell(r,t0,tl,gap,0,w,h),w,h,0.16,true);   // the short styles' band of hair round the back of the head
  const crown=(r,tl,tilt,amp)=>add(fit(cap(r*hv,tl,tilt,amp)));
  // the scalp: a cap that ends at the real hairline (high over the forehead, down in front of the ear, lowest at the nape) with a finely jagged edge. Tied-back styles and the buzz cut wear it:
  // a round cap cut straight left the nape and the skin behind the ear bald (a wig), and sat on the forehead like a beret on the buzz cut
  const scalp=(r,amp)=>{ const w=sg(40), h=sg(16), g=shell(r,0,1,0,0,w,h), p=g.attributes.position;
    for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), a=Math.abs(Math.atan2(x,-z)), q=Math.acos(clamp(y/r,-1,1))*(0.29+0.18*smoothstep(0.75,1.15,a)+0.2*smoothstep(1.7,2.3,a))*Math.PI, s0=Math.hypot(x,z)||1e-6, k=r*Math.sin(q)/s0; p.setXYZ(i,x*k,r*Math.cos(q),z*k); }
    return jag(g,w,h,amp===undefined?0.1:amp); };
  // the fringe: ribbons from the crown down over the forehead, each a different length and ending in a point, swept to one side; the slider sets how far they hang
  // the fringe's cut (look.bangStyle): 'swept' to one side with ragged ends (the default), 'straight' a blunt level cut, 'parted' in the middle and falling to both sides (the forehead shows),
  // 'side' a long sweep across one eye. bsY moves a lock's end (+ = shorter), bsSw is its sideways drift
  const BS=L.bangStyle==='straight'||L.bangStyle==='parted'||L.bangStyle==='side'?L.bangStyle:'swept';
  const bsY=(f,af,jit)=>BS==='straight'?0.012*bg-jit*0.85:BS==='parted'?0.036*Math.pow(1-af,1.5)*bg-0.012*af*bg:BS==='side'?-0.02*f*bg:0;
  const bsSw=(f,af,sweep)=>BS==='straight'?f*0.05:BS==='parted'?(f>=0?1:-1)*(0.16+0.3*(1-af))+f*0.1:BS==='side'?0.46*(0.7+0.6*(1-af))+f*0.2:sweep*(0.7+0.6*(1-af))+f*0.2;
  const fringe=(n,spread,sweep)=>{ if(bg<0.05) return; const rng=mulberry32(77+n);
    for(let i=0;i<n;i++){ const f=i/(n-1)*2-1, af=Math.abs(f), jit=0.016*bg*(i%2)+0.02*rng()*bg, yb=0.074-0.03*bg-jit+bsY(f,af,jit), ph1=Math.acos(clamp(yb/R,-0.9,0.9)), w=0.0155-0.0035*af+0.003*rng();   // (a wider length spread: the even alternate rhythm read as a saw-tooth band)
      add(scalpLock(f*spread,0.15*Math.PI,ph1,[0.009,w,w*1.1,w*0.6,0.0015],{sw:bsSw(f,af,sweep),tip:(BS==='straight'?0.03:0.11)*bg,lift:0.002+0.006*(1-af),k:0.42})); }
    // between them a finer, shorter lock each, so the fringe breaks into strands and the scalp does not show between the broad ones
    if(sg(100)>=50) for(let i=0;i<n-1;i++){ const f=(i+0.5)/(n-1)*2-1, af=Math.abs(f), jit=0.012*rng()*bg, yb=0.082-0.026*bg-jit+bsY(f,af,jit), ph1=Math.acos(clamp(yb/R,-0.9,0.9)), w=0.0068+0.002*rng();
      add(scalpLock(f*spread,0.17*Math.PI,ph1,[0.006,w,w*1.05,w*0.5,0.001],{sw:bsSw(f,af,sweep)+0.03*(rng()-0.5),tip:(BS==='straight'?0.025:0.09)*bg,lift:0.009+0.004*(1-af),k:0.4})); } };
  // locks in front of the ears, hanging toward the jaw and curling in at the tip; `len` (head units) says how far
  const sideLocks=len=>{ for(const sd of [-1,1]){
    const P=[sp(sd*1.2,0.34*Math.PI,R),sp(sd*1.33,0.5*Math.PI,R),[sd*0.103,-0.03,-0.04],[sd*0.099,-0.03-len*0.55,-0.045],[sd*0.088,-0.03-len,-0.052]];
    const g=sweepTube(P,[0.007,0.0135,0.0125,0.0075,0.0015],sg(8),{cap:'point',rings:sg(14)}); flat(g,0.5); add(len>0.08?swing(g):fit(g)); } };
  // the back and sides: overlapping ribbons from the crown, each ending in a point at its own height (above the ears at the sides, lower at the nape), so the edge is jagged, not a bowl's rim
  const backLocks=(n,drop,seed)=>{ const rng=mulberry32(seed||11); for(let i=0;i<n;i++){ const th=1.15+(TAU-2.3)*(i+0.5+(rng()-0.5)*0.6)/n, back=Math.max(0,-Math.cos(th)), pe=(0.455+0.15*smoothstep(0.05,0.85,back)+drop*(0.5+0.8*rng()))*Math.PI, w=0.0175+0.004*rng();
    add(scalpLock(th,0.2*Math.PI,pe,[0.01,w,w*1.1,w*0.65,0.002],{sw:(rng()-0.5)*0.12,tip:0.05+0.07*rng()+drop*2,lift:0.003+0.004*rng(),k:0.6,R:R-0.002*(i%2)})); }
    if(sg(100)>=50) for(let i=0;i<n;i++){ const th=1.15+(TAU-2.3)*(i+rng()*0.9)/n, back=Math.max(0,-Math.cos(th)), pe=(0.435+0.15*smoothstep(0.05,0.85,back)+drop*(0.4+0.6*rng()))*Math.PI;   // a finer layer between and over them
      add(scalpLock(th,0.22*Math.PI,pe,[0.006,0.0095,0.0105,0.006,0.0015],{sw:(rng()-0.5)*0.1,tip:0.04+0.05*rng()+drop*1.5,lift:0.008+0.003*rng(),k:0.55,R:R+0.001})); } };
  // a flat curved blade of hair standing out of the scalp at (th, ph): wide across the head, thin front to back, ending in a point; `lean` tips it (x, y, z) from straight out
  const blade=(th,ph,len,wid,lean)=>{ const a=sp(th,ph,R*0.95), d=new THREE.Vector3(...sp(th,ph,1)).add(new THREE.Vector3(lean[0],lean[1],lean[2])).normalize(), w=new THREE.Vector3(Math.cos(th),0,Math.sin(th)).normalize(), n=new THREE.Vector3().crossVectors(w,d).normalize();
    w.crossVectors(d,n).normalize();
    const g=sweepTube([[0,0,0],[0,len*0.5,len*0.1],[0,len,len*0.3]],[wid,wid*0.85,wid*0.32,0.0015],sg(8),{cap:'point',rings:sg(10)});
    g.scale(1.55,1,0.5); g.applyMatrix4(new THREE.Matrix4().makeBasis(w,d,n)); g.translate(a[0],a[1],a[2]); return g; };
  // wisps: thin strands that leave a thick lock a little way down and end at different lengths, so a tail frays into a tip instead of ending in one clean point (not on phones)
  const wisps=(P,w,n,spread)=>{ if(sg(100)<50) return; const rng=mulberry32(5000+Math.round(P[1][1]*1000)+Math.round(P[2][0]*1000));
    for(let j=0;j<n;j++){ const R0=P.slice(1+Math.floor(rng()*2)), ox=(rng()-0.5)*2, oz=(rng()-0.5)*2; if(rng()<0.5) R0.pop();
      if(R0.length<3) continue;
      add(swing(sweepTube(R0.map((q,i)=>{ const f=(i+1)/R0.length; return [q[0]+ox*spread*f*f,q[1]-0.01*f,q[2]+oz*spread*f*f]; }),[w*0.33,w*0.3,w*0.22,0.0012],5,{cap:'point',rings:10}))); } };
  const tie=(x,y,z,r)=>add(csph(r,sg(10),sg(8)).scale(1,0.8,1).translate(x,y,z),(xx,yy,zz,c)=>c.set(0xc83a4a));
  // tied tails: `offs` are [sideways shift, thickness, shorter-by-one-point 0/1] per lock; a shift grows toward the tip so the tail fans out and frays (z for twintails: `zs`)
  const tail=(P,rad,offs,zs)=>{ for(const [dx,w,cut] of offs){ const Q=P.slice(0,P.length-(cut?1:0)).map((q,i)=>{ const f=i/(P.length-1), d=dx*f*(0.4+f); return zs?[q[0],q[1],q[2]+d]:[q[0]+d,q[1],q[2]]; });
    add(swing(sweepTube(Q,rad.map(r=>r*(w>0.9?1:w)),sg(10),{cap:'point',rings:sg(18)}))); } };
  // hair gathered toward a tie: a pair of locks lying on the scalp that sweep from the temple up toward th (the tie), so the tail does not sprout from nowhere
  const gather=(th,ph1,sw)=>{ if(hat) return; for(const k of [0,1]) add(scalpLock(th+(th===0?(k?1:-1)*0.9:-Math.sign(th)*0.2*k),0.52*Math.PI-0.03*Math.PI*k,ph1*Math.PI,[0.006,0.012,0.012,0.008,0.0015],{sw:th===0?(k?-1:1)*sw:Math.sign(th)*sw,lift:0.006+0.003*k,k:0.5})); };
  // a plait: a chain of overlapping flattened lobes leaning alternately left and right along the path fn(t), ending in a tuft
  const plait=(fn,len,_a,_b,_c,side)=>{ const n=sg(100)>=50?12:8; for(let i=0;i<n;i++){ const t=(i+0.5)/n, p=fn(t), s=i%2?1:-1, r=0.022*(1-0.45*t);
      add(swing(csph(r,sg(8),sg(6)).scale(1,(n>8?1.9:2.5),0.8).rotateZ(s*0.8).translate(p[0]+s*0.01*(1-0.4*t),p[1],p[2]))); }
    const e=fn(1); for(let k=-1;k<=1;k++) add(swing(sweepTube([[e[0]+k*0.004,e[1],e[2]],[e[0]+k*0.012,e[1]-0.02,e[2]],[e[0]+k*0.02,e[1]-0.045,e[2]-0.004]],[0.008,0.006,0.001],5,{cap:'point',rings:6}))); tie(e[0],e[1]+0.002,e[2],0.016); };
  // a wound bun: a flattened ball (axis z, turned by `ry`) with two strands spiralling out of its centre, so it reads as hair wrapped round itself
  const bun=(cx,cy,cz,r,ry,rx)=>{ const mk=g=>{ g.rotateX(rx||0); g.rotateY(ry); g.translate(cx,cy,cz); return g; }; add(hang(mk(csph(r,sg(16),sg(12)).scale(1,0.95,0.7))));
    for(let k=0;k<2;k++){ const P=[]; for(let i=0;i<=9;i++){ const f=i/9, a=k*Math.PI+f*TAU*1.25, rr=r*(0.15+0.82*f); P.push([Math.cos(a)*rr,Math.sin(a)*rr*0.95,r*0.7*Math.sqrt(Math.max(0.05,1-f*f*0.9))+0.003]); }
      add(hang(mk(sweepTube(P,[0.012*r/0.05,0.011*r/0.05,0.01*r/0.05,0.008*r/0.05,0.003],sg(6),{cap:'point',rings:sg(20)})))); } };

  // a signature outfit's hair item and head item (docs/CHARACTER.md section 9): kH.hair(F, T) composes the pieces above (T) and its own geometry (T.add paints and collects it), kHat.head(F, T) is the hat, built after the base hats below
  const T={add,swing,wisps,sp,flat,fit,hang,scalp,scalpLock,crown,fringe,sideLocks,backLocks,blade,tie,hp,R,hv,hl,bg};
  if(kH&&kH.hair){ const n0=parts.length, ex=kH.hair(F,T); if(ex) parts.push(...ex); ofTintFrom(X,'hair',parts,n0); }
  if(H==='buzz') add(fit(scalp(0.108*hv,0.035)));
  if(H==='short'){ add(fit(scalp(0.114*hv))); add(fit(band(0.111*hv,0.38*Math.PI,0.17*Math.PI,1.9,sg(30),sg(8)))); fringe(8,1.0,0.14); sideLocks(0.05); backLocks(sg(18),0,11); }
  const hatOver=hat&&!['circlet','bandana','laurel','catphones'].includes(L.hat);   // a hat that covers the crown: the blades standing off the scalp would poke through it
  if(H==='messy'){ add(fit(scalp(0.116*hv))); fringe(8,1.05,0.3); sideLocks(0.05); backLocks(sg(14),0.02,21);
    const rng=mulberry32(4242); for(let i=0;i<(hatOver?0:10);i++){ const th=rng()*TAU, ph=(0.14+rng()*0.3)*Math.PI; add(hang(blade(th,ph,(0.04+rng()*0.04)*(0.8+0.3*hl),0.016+rng()*0.006,[(rng()-0.5)*0.6,0.1+rng()*0.3,0.2+rng()*0.4]))); } }
  if(H==='spiky'){ add(fit(scalp(0.114*hv))); sideLocks(0.05); backLocks(sg(10),0.01,31);
    // layered anime spikes: rows of blades that all sweep up and back, big on the crown, smaller toward the sides and nape (the lean is the same in the world frame)
    if(!hatOver) for(const [n,ph,len,off,half] of [[6,0.15,0.1,0.3,1],[7,0.29,0.08,0.1,1],[sg(100)>=50?6:0,0.42,0.06,0.2,0.62]]) for(let i=0;i<n;i++){
      const th=half<1?Math.PI-Math.PI*half+(i+0.5)/n*2*Math.PI*half:(i+off)/n*TAU, fr=Math.abs(Math.cos(th*0.5));   // fr: 1 at the front, 0 at the back
      add(hang(blade(th,ph*Math.PI,len*(0.85+0.25*hl)*(1-0.15*fr),0.03*(1-0.2*(ph>0.3?1:0)),[-Math.sin(th)*0.7,0.65,0.85])));
      }
    if(!hatOver) for(const f of [-0.7,0,0.7]){ const th=f*0.8, ph=0.2*Math.PI, len=0.05*Math.max(0.3,bg), a=sp(th,ph,R*0.97), d=sp(th,0.42*Math.PI,1);
      add(fit(sweepTube([a,[a[0]+d[0]*len*0.5,a[1]+d[1]*len*0.2+0.01,a[2]+d[2]*len*0.5],[a[0]+d[0]*len,a[1]-0.04*Math.max(0.3,bg),a[2]+d[2]*len*1.1]],[0.022,0.02,0.002],sg(8),{cap:'point',rings:sg(9)}))); } }
  if(H==='curly'){ const r=hat?(L.hat==='helm'?0.11:0.118):0.132*hv, lump=(x,y,z)=>0.5+0.5*Math.sin(x*105+1.3)*Math.sin(y*118+0.4)*Math.sin(z*105+2.1);
    add(fit(scalp(0.109*hv)));   // the hairline underneath, so no bald skin shows between the curls
    { const g=cap(r,0.5,0.34,0.14), p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i),j=1+0.13*lump(x,y,z)+(h3(x*3,y*3,z*3)-0.5)*0.05; p.setXYZ(i,x*j,y*j,z*j); } smoothN(g); add(fit(g)); }   // a mass of round lumps (curls), not a smooth ball with noise
    // loose curls round the edge: small, in two staggered rows behind the temples and one short row over the forehead (a single ring of big balls sat on the eyes like grapes)
    if(!hat){ const rng=mulberry32(31), n=sg(100)>=50?26:14; for(let i=0;i<n;i++){ const th=(i/n)*TAU+rng()*0.2, front=Math.abs(Math.atan2(Math.sin(th),Math.cos(th)))<0.95, ph=(front?0.27+rng()*0.05*bg+0.03*bg:0.45+(i%2)*0.1+rng()*0.05)*Math.PI; if(front&&bg<0.05) continue; const q=sp(th,ph,r*(front?0.9:0.94)); add(csph(0.021+rng()*0.009,sg(8),sg(6)).translate(q[0],q[1],q[2]).scale(fs[0],1,1)); } } }
  if(H==='bob'||H==='long'||H==='waves'||H==='buns2'||H==='sidebraid'||H==='highpony'||H==='twintail'||H==='braid'||H==='ponytail'||H==='bun') add(fit(scalp((H==='bob'||H==='long'?0.116:0.113)*hv)));
  if(H==='bob'){ add(fit(band(0.118*hv,0.34*Math.PI,0.2*Math.PI,1.55,sg(36),sg(10)))); fringe(8,1.05,0.12); sideLocks(0.1*hl); backLocks(sg(20),0.09*hl,51); }
  if(H==='long'||H==='waves'){ fringe(8,1.1,0.1); sideLocks(0.2*hl);
    const rings=[{y:0.078,rx:0.08*hv,rz:0.028,zc:0.05}]; const n=sg(18), len=0.5*hl;   // (the first ring is tucked inside the scalp: the curtain's open top stood out as a box behind the ear)
    for(let i=0;i<=n;i++){ const t=i/n, e=t*t*(3-2*t); rings.push({y:0.04-len*t,rx:lerp(0.108,0.128,Math.sin(t*Math.PI*0.7))*(1-0.82*Math.pow(t,3))*hv,rz:lerp(0.05,0.06,Math.sin(t*Math.PI*0.6))*(1-0.85*Math.pow(t,3)),zc:0.062+0.045*Math.sin(Math.min(1,t*1.8)*Math.PI*0.5)-0.02*t}); }
    const cg=loftRings(rings,sg(32)), cp=cg.attributes.position; for(let i=0;i<cp.count;i++){ const x=cp.getX(i), z=cp.getZ(i); if(z>0.04) cp.setZ(i,z+0.0035*Math.sin(x*150)); if(H==='waves') cp.setX(i,x+0.012*Math.sin(cp.getY(i)*62)*Math.min(1,Math.abs(cp.getY(i)-0.04)*9)); } smoothN(cg); add(swing(cg));
    for(let i=0;i<5;i++){ const f=i/4*2-1, y0=0.04-len*0.9, P=[[f*0.05,y0,0.105],[f*0.058,y0-0.05*hl,0.1],[f*0.06+0.012*Math.sin(i*2),y0-0.1*hl-0.02*i%2,0.092]]; add(swing(sweepTube(P,[0.02,0.017,0.002],sg(7),{cap:'point',rings:sg(8)}))); }
    for(const sd of [-1,1]){ const P=[[sd*0.1,0.0,-0.01],[sd*0.114,-0.1*hl,-0.02],[sd*0.124,-0.22*hl,-0.025],[sd*0.12,-0.34*hl,-0.02]]; add(swing(sweepTube(P,[0.02,0.026,0.022,0.003],sg(8),{cap:'point',rings:sg(14)}))); } }
  if(H==='ponytail'){ fringe(8,1.0,0.12); sideLocks(0.05); gather(0,0.2,0.3);
    // a gathered tail: from the tie at the back of the crown it arcs up and back a little, swells and falls in three locks of different length
    const P=[[0,0.082,0.088],[0,0.098,0.13],[0,0.06,0.18],[0,-0.05*hl,0.205],[0,-0.17*hl,0.2],[0.008,-0.3*hl,0.175]];
    tail(P,[0.018,0.036,0.05,0.046,0.032,0.003],[[0,1,0],[-0.034,0.7,1],[0.034,0.6,0]]); wisps(P,0.03,3,0.014); tie(0,0.082,0.09,0.022); }
  if(H==='buns2'){ fringe(8,1.0,0.12); sideLocks(0.05); backLocks(sg(10),-0.02,43); if(!hat) for(const sd of [-1,1]){ gather(sd*1.9,0.46,0.27); bun(sd*0.084,0.092,0.056,0.052,sd*1.1); tie(sd*0.074,0.066,0.062,0.022); } }
  if(H==='highpony'){ fringe(8,1.0,0.12); sideLocks(0.05); gather(0,0.15,0.2);
    const hpP=[[0,0.108,0.065],[0,0.135,0.095],[0,0.13,0.15],[0,0.07,0.195],[0,-0.06*hl,0.22],[0.008,-0.2*hl,0.205],[0.012,-0.32*hl,0.18]];
    tail(hpP,[0.018,0.036,0.05,0.046,0.038,0.024,0.003],[[0,1,0],[-0.036,0.7,1],[0.036,0.62,0]]); wisps(hpP,0.034,3,0.014); tie(0,0.112,0.062,0.024); }
  if(H==='sidebraid'){ fringe(8,1.0,0.12); sideLocks(0.06); backLocks(sg(12),0.0,61);
    const len=0.42*hl; plait(t=>[0.1-0.012*t,-len*t,0.075+0.04*Math.sin(t*2.6)],len,0.0,0.088,0.08,1);
    tie(0.1,0.0,0.078,0.02); }
  if(H==='twintail'){ fringe(8,1.0,0.1); sideLocks(0.05);
    // two tails from ties just above and behind the ears: full at the tie, a soft outward bow, tapering, three locks each
    for(const sd of [-1,1]){ gather(sd*1.75,0.4,0.2);
      const ttP=[[sd*0.09,0.062,0.045],[sd*0.118,0.03,0.062],[sd*0.134,-0.07*hl,0.072],[sd*0.134,-0.19*hl,0.066],[sd*0.12,-0.31*hl,0.05],[sd*0.1,-0.4*hl,0.04]];
      tail(ttP,[0.022,0.04,0.042,0.034,0.02,0.003],[[0,1,0],[0,0.7,-0.03],[0,0.65,0.03]],true); wisps(ttP,0.024,2,0.011); tie(sd*0.09,0.062,0.045,0.02); } }
  if(H==='braid'){ fringe(8,1.0,0.12); sideLocks(0.06); gather(0,0.25,0.3);
    const len=0.45*hl; plait(t=>[0,-0.01-len*t,0.11+0.03*Math.sin(t*3)],len,0.0,0.0,0.105,0);
    tie(0,-0.01,0.105,0.02); }
  if(H==='bun'){ fringe(8,1.0,0.12); sideLocks(0.05); backLocks(sg(10),-0.02,41); gather(1.9,0.46,0.27); gather(-1.9,0.46,0.27); if(!hat){ bun(0,0.1,0.082,0.064,0,-0.6); tie(0,0.064,0.088,0.026); } }
  if(L.ahoge&&!hat&&H!=='bald'){ add(swing(sweepTube([[0.004,0.1,-0.042],[0.0,0.17,-0.05],[-0.02,0.23,-0.036],[0.0,0.27,-0.012],[0.02,0.26,0.008]],[0.0075,0.0065,0.005,0.003,0.0012],sg(6),{cap:'point',rings:sg(14)}))); }

  if(H!=='bald'&&H!=='buzz'&&!hat&&sg(100)>=50){   // (not on phones) a few loose strands standing off the crown (version 3.2), the same ones every build
    const rng=mulberry32(909); for(let i=0;i<5;i++){ const th=rng()*TAU, ph=(0.1+rng()*0.22)*Math.PI, a=sp(th,ph,R*0.99), d=sp(th,ph+0.3,1), k=0.035+0.025*rng();
      add(swing(sweepTube([a,[a[0]+d[0]*k*0.5,a[1]+d[1]*k*0.5+0.012,a[2]+d[2]*k*0.5],[a[0]+d[0]*k+0.012*(rng()-0.5),a[1]+d[1]*k+0.02,a[2]+d[2]*k+0.012*(rng()-0.5)]],[0.0016,0.0013,0.0004],4,{cap:'point',rings:6}))); } }
  hgApply(X,parts,0,parts.length);   // hair colour gradient (model-hairgrad.js), before any hat is added
  /* hats: the base hats are in model-hats.js */
  const nHair=parts.length; htBase(X,F,parts); if(hat&&!(kHat&&kHat.head)){ htFit(parts,nHair); hatShape(X,parts,nHair); }   // hair never shows through a base hat; the hat size and tilt sliders come after the fit
  if(kHat&&kHat.head){ const n0=parts.length; parts.push(...kHat.head(F,T)); ofTintFrom(X,'hat',parts,n0); }
  return parts;
}
