//@ Arm clearance: measures the body and clothes beside each arm when a character is built, so the hands swing past the hips, thighs, belly, bust and skirts instead of through them
/* Agent map. poseRig (pose.js) only swings the arms forward and back (rotation.x) and folds the elbows, so the hand sweeps a fixed plane beside the body; wide hips, a belly, a gown or
   plate used to swallow the fingers. aclBuild(X,D,parts) runs once in buildCharacter (model.js), after the body, the garments and the legs and before the extras, and returns rig.acl:
   - the obstacles as radial envelopes (aclEnv: for slabs ACL_BIN high, the farthest surface in ACL_NA directions round the slab's centre): the torso lathe below the armpit
     (the spine's frame), every mesh hung on the hips (skirts, dresses, belts: the hips' frame) and each thigh and shin (their joints' frames). aclDepth(env,x,y,z) > 0 = inside.
   - the forearm and hand as a few dozen sample points (aclPoints: the outermost vertex in ACL_PD directions per ACL_PS slab of the elbow's meshes, not the outer side).
   - T[side] / TE[side]: the extra abduction (shoulder rotation.z beyond armLean) that keeps those points ACL_CLR clear, for a grid of shoulder swing (ACL_A) x elbow bend (ACL_E) x
     standing / walking / running (the gait couples the swing to the thigh on that side and the shoulders' twist: poseRig's gait at full walking and full running speed). Capped at ACL_MAX;
     past it the elbow bends a little more (TE). Seated, the meshes on the hips count only above the waist (their shell below it hangs where the sway moves it, not round the thighs).
   - rest[side]: the standing pose {z, a, e}: when the rest needs more than ACL_REST_MAX (very wide hips, a ballgown) the arm carries a little forward and bends instead of sticking out.
   - aclSit(acl,mode,sd) (lazy, cached): a seated pose (shoulder swing, inward turn rotation.y, elbow, the forearm's twist w) that lays the hand palm down on top of the thigh, never in it.
   aclLook(acl,sd,a,e,m,out) -> out=[extra abduction, extra elbow bend] (m: 0 standing .. 1 walking .. 2 running) is poseRig's per-frame lookup (bilinear, cheap: every villager calls it). Sides: index 0 = left (shL, sd -1), 1 = right.
   owns: acl*, ACL_*.   used by: model.js (aclBuild), pose.js (aclLook, aclSit).   test: tools/hands-clip-smoke.js */
const ACL_PD=12, ACL_PS=0.025, ACL_BIN=0.015, ACL_NA=24, ACL_CLR=0.009, ACL_MAX=0.42, ACL_REST_MAX=0.2, ACL_BIAS=0.6;   // the forearm's sample directions and slab, the envelopes' slab height and directions, wanted clearance (m), the most extra abduction (rad), the most extra at rest before the arm bends instead
/* The arm at rest is not a straight post: the elbow keeps ACL_REST_E of bend (pose.js's standing eL / eR) and the forearm angles out from the upper arm by the carrying angle (elbow
   rotation.z, aclCarry: A.carry, more for a woman), which fades as the elbow bends (the forearm folds onto the upper arm). The forearm's lower part twists (twL / twR rotation.y, the
   pronation: + turns the palm from the thigh to the back): the sample points below A.cut turn with it (aclArmPt's w). */
const ACL_REST_E=0.2, ACL_SIT_TW=1.5, ACL_CARRY_M=0.075, ACL_CARRY_F=0.11, ACL_CARRY_FADE=1.3;
const aclCarry=(A,e)=>A.carry*clamp(1-e/ACL_CARRY_FADE);
const ACL_A=[-1.0,-0.8,-0.6,-0.4,-0.2,0,0.2,0.4,0.6,0.8,1.0,1.4,2.0], ACL_E=[0.1,0.35,0.6,0.9,1.2,1.5,1.8];   // the table's shoulder swings (rotation.x, + forward) and elbow bends (closest where poseRig's walk, run, talk and holds are; not evenly spaced: aclLook searches)
// a cheap stand-in for atan2 (monotonic round the circle, 0..ACL_NA): the envelopes are asked thousands of times per character
function aclAng(dx,dz){ const a=Math.abs(dx)+Math.abs(dz); if(a<1e-9) return 0; const q=dz>=0?(dx>=0?dz/a:2-dz/a):(dx<0?2-dz/a:4+dz/a); return q*(ACL_NA/4); }
// the radial envelope of the vertices of `geos` (all in one frame) between heights y0 and y1
function aclEnv(geos,y0,y1){
  let lo=1e9, hi=-1e9; for(const g of geos){ const p=g.attributes.position.array; for(let i=1;i<p.length;i+=3){ const y=p[i]; if(y<y0||y>y1) continue; if(y<lo) lo=y; if(y>hi) hi=y; } }
  if(lo>hi) return null;
  const nb=Math.max(1,Math.ceil((hi-lo)/ACL_BIN)), NA=ACL_NA, bx=new Float32Array(nb*4).fill(0), cx=new Float32Array(nb), cz=new Float32Array(nb), r=new Float32Array(nb*NA), has=new Uint8Array(nb);
  for(let b=0;b<nb;b++){ bx[b*4]=1e9; bx[b*4+1]=-1e9; bx[b*4+2]=1e9; bx[b*4+3]=-1e9; }
  for(const g of geos){ const p=g.attributes.position.array; for(let i=0;i<p.length;i+=3){ const y=p[i+1]; if(y<lo||y>hi) continue; const b=Math.min(nb-1,((y-lo)/ACL_BIN)|0), x=p[i], z=p[i+2];
    if(x<bx[b*4]) bx[b*4]=x; if(x>bx[b*4+1]) bx[b*4+1]=x; if(z<bx[b*4+2]) bx[b*4+2]=z; if(z>bx[b*4+3]) bx[b*4+3]=z; has[b]=1; } }
  for(let b=0;b<nb;b++) if(has[b]){ cx[b]=(bx[b*4]+bx[b*4+1])/2; cz[b]=(bx[b*4+2]+bx[b*4+3])/2; }
  for(const g of geos){ const p=g.attributes.position.array; for(let i=0;i<p.length;i+=3){ const y=p[i+1]; if(y<lo||y>hi) continue; const b=Math.min(nb-1,((y-lo)/ACL_BIN)|0), dx=p[i]-cx[b], dz=p[i+2]-cz[b];
    const s=Math.round(aclAng(dx,dz))%NA, d=Math.sqrt(dx*dx+dz*dz); if(d>r[b*NA+s]) r[b*NA+s]=d; } }
  // a direction no vertex fell in takes the chord between its filled neighbours (a coarse mesh: a villager's few columns)
  for(let b=0;b<nb;b++){ if(!has[b]) continue; const o=b*NA, src=r.slice(o,o+NA);
    for(let s=0;s<NA;s++){ if(src[s]>0) continue; let i=1, j=1; while(i<NA&&src[(s-i+NA)%NA]<=0) i++; while(j<NA&&src[(s+j)%NA]<=0) j++; if(i<NA&&j<NA) r[o+s]=(src[(s-i+NA)%NA]*j+src[(s+j)%NA]*i)/(i+j); } }
  for(let b=0;b<nb;b++){ if(has[b]) continue; let i=b-1, j=b+1; while(i>=0&&!has[i]) i--; while(j<nb&&!has[j]) j++; if(i<0||j>=nb) continue;   // an empty slab between two filled ones: their blend
    const f=(b-i)/(j-i); cx[b]=lerp(cx[i],cx[j],f); cz[b]=lerp(cz[i],cz[j],f); for(let s=0;s<NA;s++) r[b*NA+s]=lerp(r[i*NA+s],r[j*NA+s],f); has[b]=1; }
  return {y0:lo,nb,cx,cz,r,has};
}
// how far the point (x, y, z) of the envelope's frame is inside it (metres; negative = outside, -1 = above or below it)
function aclDepth(E,x,y,z){
  if(!E) return -1; const b=Math.floor((y-E.y0)/ACL_BIN); if(b<0||b>=E.nb||!E.has[b]) return -1;
  const dx=x-E.cx[b], dz=z-E.cz[b], s=aclAng(dx,dz), i=Math.floor(s), f=s-i, o=b*ACL_NA, r=E.r[o+(i%ACL_NA)]*(1-f)+E.r[o+((i+1)%ACL_NA)]*f;
  return r-Math.sqrt(dx*dx+dz*dz);
}
const aclGeos=grp=>grp.children.filter(c=>c.isMesh&&c.geometry&&c.geometry.attributes.position).map(c=>c.geometry);
// sample points of the elbow's meshes (the forearm and the hand, the cuffs, the gloves): per 2 cm down the forearm, the outermost vertex in ACL_PD directions
function aclPoints(geos,sd){
  const slabs=new Map(), dir=[]; for(let k=0;k<ACL_PD;k++){ const c=Math.cos(k*TAU/ACL_PD); if(c*sd<0.4) dir.push([c,Math.sin(k*TAU/ACL_PD)]); }   // (not the outer side: the body is never there)
  for(const g of geos){ const p=g.attributes.position.array; for(let i=0;i<p.length;i+=3){ const y=p[i+1]; if(y>-0.04) continue; const b=Math.floor(-y/ACL_PS); let s=slabs.get(b); if(!s){ s=dir.map(()=>[-1e9,0,0,0]); slabs.set(b,s); }
    for(let k=0;k<dir.length;k++){ const v=p[i]*dir[k][0]+p[i+2]*dir[k][1]; if(v>s[k][0]){ s[k][0]=v; s[k][1]=p[i]; s[k][2]=y; s[k][3]=p[i+2]; } } } }
  const out=[], seen=new Set(); for(const s of slabs.values()) for(const q of s) if(q[0]>-1e8){ const key=q[1]+','+q[2]+','+q[3]; if(seen.has(key)) continue; seen.add(key); out.push(q[1],q[2],q[3]); }
  return new Float32Array(out);
}
// where a point of the elbow's frame lands: shoulder (a swing, b inward turn, z abduction; Euler XYZ = Rx * Ry * Rz), elbow e with its carrying angle c (rotation.z, signed),
// and below the forearm's cut yc its twist tw (rotation.y, signed). Out: spine frame
function aclArmPt(o,px,py,pz,sx,sy,up,a,b,z,e,c,tw,yc){
  if(tw&&py<yc){ const ct=Math.cos(tw), st=Math.sin(tw), qx=px*ct+pz*st; pz=-px*st+pz*ct; px=qx; }
  if(c){ const cc=Math.cos(c), sc=Math.sin(c), qx=px*cc-py*sc; py=px*sc+py*cc; px=qx; }
  const ce=Math.cos(e), se=Math.sin(e); let x=px, y=py*ce-pz*se-up, w=py*se+pz*ce;   // the elbow's bend, then down the upper arm
  const cz=Math.cos(z), sz=Math.sin(z); let x1=x*cz-y*sz, y1=x*sz+y*cz;   // Rz
  const cb=Math.cos(b), sb=Math.sin(b); let x2=x1*cb+w*sb, z2=-x1*sb+w*cb;   // Ry
  const ca=Math.cos(a), sa=Math.sin(a); o[0]=sx+x2; o[1]=sy+y1*ca-z2*sa; o[2]=y1*sa+z2*ca;   // Rx
}
// a spine-frame point into the hips' frame (the spine's lean x, twist y) and then into a leg joint's frame (hip at hx, thigh swing t; knee k below it)
function aclToHips(o,s,lean,tw){ const ct=Math.cos(tw), st=Math.sin(tw), x=s[0]*ct+s[2]*st, z=-s[0]*st+s[2]*ct, cl=Math.cos(lean), sl=Math.sin(lean); o[0]=x; o[1]=s[1]*cl-z*sl; o[2]=s[1]*sl+z*cl; }
function aclToLeg(o,h,hx,t){ const x=h[0]-hx, y=h[1], z=h[2], c=Math.cos(t), s=Math.sin(t); o[0]=x; o[1]=y*c+z*s; o[2]=-y*s+z*c; }
// the deepest any sample point of side sd sits inside an obstacle, for an arm pose and a body pose {lean, tw, t (that side's thigh), k (its knee)}; also that point's lever (its distance from the shoulder, across)
const _as=[0,0,0], _ah=[0,0,0], _al=[0,0,0];
function aclDeep(A,sd,a,b,z,e,bp,withShin,hipsY,thighOnly,tw){
  const P=A.pts[sd<0?0:1], sx=sd*A.shX, sy=A.shY, th=A.thigh[sd<0?0:1], sh=A.shin[sd<0?0:1], hx=sd*A.hx, c=sd*aclCarry(A,e), w=sd*(tw||0); let best=-1, lev=0.3;
  for(let i=0;i<P.length;i+=3){ aclArmPt(_as,P[i],P[i+1],P[i+2],sx,sy,A.up,a,b,z,e,c,w,A.cut); let d=thighOnly?-1:aclDepth(A.torso,_as[0],_as[1],_as[2]);
    aclToHips(_ah,_as,bp.lean,bp.tw); if(!(hipsY>_ah[1])) for(const E of A.hips){ const v=aclDepth(E,_ah[0],_ah[1],_ah[2]); if(v>d) d=v; }
    aclToLeg(_al,_ah,hx,bp.t); const v=aclDepth(th,_al[0],_al[1],_al[2]); if(v>d) d=v;
    if(withShin){ const kx=_al[0], ky=_al[1]+A.thighL, kz=_al[2], c=Math.cos(bp.k), s=Math.sin(bp.k), w=aclDepth(sh,kx,ky*c+kz*s,-ky*s+kz*c); if(w>d) d=w; }
    if(d>best){ best=d; lev=Math.max(0.12,Math.hypot(_as[0]-sx,_as[1]-sy)); } }
  return [best,lev];
}
// the least abduction from `z0` that clears the body by ACL_CLR (up to zMax): a few Newton-like steps (the deepest point moves out by about its lever x the angle). Also whether it cleared
function aclSolve(A,sd,a,e,bp,z0,zMax,hipsY){
  let z=z0; for(let it=0;it<7;it++){ const [d,lev]=aclDeep(A,sd,a,0,sd*z,e,bp,false,hipsY); const need=d+ACL_CLR; if(need<=0) return [z,true]; if(z>=zMax) return [zMax,false]; z=Math.min(zMax,z+need/lev+0.008); }
  return [z,aclDeep(A,sd,a,0,sd*z,e,bp,false,hipsY)[0]+ACL_CLR<=0];
}
// one cell of the table: [extra abduction, extra elbow bend]. Past ACL_MAX the arm stays at ACL_MAX and the elbow bends a little more (the hand rises over a gown's bell or a wide hip)
// instead of the arm sticking out further. (Always in that order, so neighbouring cells blend: a cell that bent the elbow at a smaller abduction met one that did not as a hole)
function aclCell(A,sd,a,e,bp){
  const lean=A.lean, zMax=lean+ACL_MAX; let [z,ok]=aclSolve(A,sd,a,e,bp,lean,zMax); if(ok) return [z-lean,0];
  for(const de of [0.1,0.2,0.3,0.45,0.6,0.8]){ if(aclDeep(A,sd,a,0,sd*zMax,e+de,bp)[0]+ACL_CLR<=0) return [ACL_MAX,de]; }
  return [ACL_MAX,0];
}
// the gait for a shoulder swing a of side sd, at full walking speed (pose.js: aR = sw*0.495, the thigh on the same side swings -sw*0.561, the shoulders twist sw*0.17) or a full run
// (amplitude 0.87: aR = sw*0.783, the thigh -sw*0.887, the twist sw*0.068, the trunk leans 0.21 forward)
function aclWalk(sd,a){ const sw=clamp(a/0.495,-1,1); return {lean:-0.04,tw:sd*sw*0.17,t:-sw*0.561,k:-0.2}; }
function aclRun(sd,a){ const sw=clamp(a/0.783,-1,1); return {lean:-0.21,tw:sd*sw*0.068,t:-sw*0.887,k:-0.5}; }
const ACL_STAND={lean:0,tw:0,t:0,k:0};
function aclBuild(X,D,parts){
  const {torso,hips,elL,elR,twL,twR,hipL,hipR,kneeL,kneeR}=parts;
  const A={shX:D.shX,shY:D.shY,up:D.upper,hx:D.hx,thighL:D.thigh,lean:armLean(D),carry:D.fem?ACL_CARRY_F:ACL_CARRY_M,cut:twR?twR.userData.cut:-9,
    torso:aclEnv([torso.geometry],-0.4,D.shY-0.07),   // below the armpit: above it the arm's own top sits in the shoulder
    hips:hips.children.filter(c=>c.isMesh&&c!==torso).map(m=>aclEnv([m.geometry],-1.2,0.5)).filter(Boolean),
    thigh:[aclEnv(aclGeos(hipL),-2,2),aclEnv(aclGeos(hipR),-2,2)], shin:[aclEnv(aclGeos(kneeL),-2,2),aclEnv(aclGeos(kneeR),-2,2)],
    pts:[aclPoints(aclGeos(elL).concat(twL?aclGeos(twL):[]),-1),aclPoints(aclGeos(elR).concat(twR?aclGeos(twR):[]),1)], T:[], TE:[], rest:[], sit:{}};
  const nA=ACL_A.length, nE=ACL_E.length, lean=A.lean;
  for(const sd of [-1,1]){ const T=new Float32Array(3*nA*nE), TE=new Float32Array(3*nA*nE);
    for(let m=0;m<3;m++) for(let i=0;i<nA;i++) for(let j=0;j<nE;j++){ const a=ACL_A[i], o=(m*nA+i)*nE+j;
      if(m===2&&ACL_E[j]<0.6){ T[o]=T[(nA+i)*nE+j]; TE[o]=TE[(nA+i)*nE+j]; continue; }   // (a runner's elbows are bent past 0.95: the walk's answer stands in below)
      const c=aclCell(A,sd,a,ACL_E[j],m===2?aclRun(sd,a):m?aclWalk(sd,a):ACL_STAND); T[o]=c[0]; TE[o]=c[1]; }
    A.T.push(T); A.TE.push(TE);
    // the standing pose (pose.js's rest: swing 0, elbow ACL_REST_E): within ACL_REST_MAX, or carried forward and bent a little
    let [z,ok]=aclSolve(A,sd,0,ACL_REST_E,ACL_STAND,lean,lean+ACL_MAX), rest={z:z-lean,a:0,e:ACL_REST_E};
    if(!ok||rest.z>ACL_REST_MAX){ let best=null;
      for(const ea of [[0.06,0.3],[0.1,0.42],[0.14,0.55],[0.18,0.7],[0.22,0.85],[0.26,1.0],[0.3,1.15],[0.34,1.3]]){ const [z2,ok2]=aclSolve(A,sd,ea[0],ea[1],ACL_STAND,lean,lean+ACL_REST_MAX);
        if(ok2){ best={z:z2-lean,a:ea[0],e:ea[1]}; break; } }
      if(best) rest=best; else rest.z=Math.min(rest.z,ACL_MAX); }
    A.rest.push(rest); }
  return A;
}
// poseRig's lookup: the extra abduction for side sd at swing a, elbow e, walking weight m (0 standing .. 1 walking)
const aclIdx=(G,v)=>{ if(v<=G[0]) return 0; const n=G.length-1; if(v>=G[n]) return n-1e-6; let i=0; while(G[i+1]<v) i++; return i+(v-G[i])/(G[i+1]-G[i]); };
function aclLook(A,sd,a,e,m,out){
  const nA=ACL_A.length, nE=ACL_E.length, fa=aclIdx(ACL_A,a), fe=aclIdx(ACL_E,e), i=Math.min(nA-2,fa|0), j=Math.min(nE-2,fe|0), u=fa-i, v=fe-j, s=sd<0?0:1, w=clamp(m,0,2);
  // between the grid's points: halfway from the bilinear blend toward the largest corner (the need rises steeply where a hand starts to meet a hip: a plain blend undershoots there)
  const g=(T,mm)=>{ const o=mm*nA, c00=T[(o+i)*nE+j], c01=T[(o+i)*nE+j+1], c10=T[(o+i+1)*nE+j], c11=T[(o+i+1)*nE+j+1], bl=(c00*(1-v)+c01*v)*(1-u)+(c10*(1-v)+c11*v)*u;
    return bl+(Math.max(c00,c01,c10,c11)-bl)*ACL_BIAS; };
  // m: 0 standing, 1 walking, 2 running (poseRig's mv + run)
  const m0=Math.min(1,Math.floor(w)), f=w-m0; out[0]=g(A.T[s],m0)*(1-f)+(f>0?g(A.T[s],m0+1)*f:0); out[1]=g(A.TE[s],m0)*(1-f)+(f>0?g(A.TE[s],m0+1)*f:0); return out;
}
/* A seated pose for side sd (mode 1: on the ground, legs out; 2: on a seat): the thighs, knees and lean pose.js gives a sitter. The palm's centre should rest on the top of the
   thigh about halfway along it: a grid over the shoulder's swing, its inward turn and the elbow, nearest first, the first that clears everything by ACL_CLR wins. */
function aclSit(A,mode,sd){
  const key=mode+'/'+sd; if(A.sit[key]) return A.sit[key];
  const bp=mode===1?{lean:0.12,tw:0,t:1.4,k:-0.22}:{lean:0.12,tw:0,t:1.5,k:-1.45}, th=A.thigh[sd<0?0:1], hx=sd*A.hx, z=sd*A.lean;
  // the target: the top of the thigh at 45% of its length, in the hips' frame (the thigh's local up when it swings forward by t is its front, -z)
  const ty=-0.45*A.thighL, top=th?Math.max(0.03,aclTop(th,ty)):0.08, c=Math.cos(bp.t), s=Math.sin(bp.t);
  const ly=ty, lz=-(top+0.022), tgt=[hx,ly*c-lz*s,ly*s+lz*c];   // (the leg frame back to the hips': Rx(t))
  const o=[0,0,0], h=[0,0,0], o2=[0,0,0], h2=[0,0,0];
  // the palm's facing in the hips' frame for an arm pose and a twist: how far it points down (-1 = straight down)
  const palmY=(a,b,e,w)=>{ const c=sd*aclCarry(A,e); aclArmPt(o,0,-0.285,0,sd*A.shX,A.shY,A.up,a,sd*b,z,e,c,sd*w,A.cut); aclArmPt(o2,-sd*0.01,-0.285,0,sd*A.shX,A.shY,A.up,a,sd*b,z,e,c,sd*w,A.cut); aclToHips(h,o,bp.lean,0); aclToHips(h2,o2,bp.lean,0); return (h2[1]-h[1])/0.01; };
  // the twist that turns the palm down onto the thigh (pronation, at most ACL_SIT_TW): the least within 0.05 of the best
  const palmDown=(a,b,e)=>{ let lo=9, ws=[]; for(let w=0;w<=ACL_SIT_TW+1e-6;w+=0.1){ const y=palmY(a,b,e,w); ws.push([w,y]); if(y<lo) lo=y; } for(const [w,y] of ws) if(y<=lo+0.05) return w; return 0; };
  const search=w=>{ const cand=[];
    for(let a=-0.7;a<=1.21;a+=0.1) for(let b=-0.8;b<=0.31;b+=0.1) for(let e=0.2;e<=2.01;e+=0.1){ aclArmPt(o,0,-0.285,0,sd*A.shX,A.shY,A.up,a,sd*b,z,e,sd*aclCarry(A,e)); aclToHips(h,o,bp.lean,0);
      const d=Math.hypot(h[0]-tgt[0],h[1]-tgt[1],h[2]-tgt[2]); if(d<0.15) cand.push([d,a,b,e]); }
    cand.sort((p,q)=>p[0]-q[0]);
    // the nearest few hundred, fully checked: clear of everything by ACL_CLR, and lying on the thigh (its nearest point little more than that above it) beats being nearest the target
    let pick={a:-0.3,b:0,e:0.9,w}, best=1e9;
    for(let i=0;i<cand.length&&i<500;i++){ const [d,a,b,e]=cand[i]; if(d>best) break; const [dp]=aclDeep(A,sd,a,sd*b,z,e,bp,true,-0.03,false,w); if(dp+ACL_CLR>0) continue;
      const [dt]=aclDeep(A,sd,a,sd*b,z,e,bp,false,9,true,w), sc=d+2*Math.max(0,-dt-ACL_CLR-0.004); if(sc<best){ best=sc; pick={a,b,e,w}; } }
    return pick; };
  // twice: the arm's pose with the hand on its edge, the twist that lays that palm flat, then the pose again with the turned hand (thinner from above: it comes down onto the thigh)
  let pick=search(0); const w=palmDown(pick.a,pick.b,pick.e); if(w>0){ pick=search(w); pick.w=palmDown(pick.a,pick.b,pick.e); if(pick.w>w) pick.w=w; }
  return (A.sit[key]=pick);
}
// the envelope's largest radius toward the thigh's front (-z) at local height y: how far above the thigh's axis its top is when seated
function aclTop(E,y){ const b=clamp(Math.floor((y-E.y0)/ACL_BIN),0,E.nb-1), s=Math.round(aclAng(0,-1))%ACL_NA; return E.r[b*ACL_NA+s]-E.cz[b]; }
