//@ Reusable extra pieces for the signature sets (scarf, apron, sash tails, rope coil, shoulder plate, hip lantern) and oxPlus, which adds them to a set's kit without editing its hooks
/* oxPlus(base, fn): OUTFITS.<id> = oxPlus(OUTFITS.<id>, (X,D,k) => ({torso, hips, shoulder, extras: cosmetics})) wraps a set so each named hook returns what the set's own hook returns plus the pieces here
   (the set's own pieces are untouched; `cos` = the o of ofCosmetics, a cape and / or an aura). The pieces are drawn in torso / hips / shoulder frames like the hooks: y up, the front is -z, torso heights are design
   heights (times D.TK), the hips hang down from y = 0, the shoulder frame has its origin at the joint with y down the arm. owns: oxPlus, oxScarf, oxApron, oxSash, oxCoil, oxPauldron, oxLantern.
   used by: game/outfits/{sazanka,ogden,tamsin,pell,sabir}.js (the last line of each). test: tools/outfit-smoke.js, tools/cosmetic-items-smoke.js */
function oxPlus(base,fn){
  return function(X,D){
    const k=base(X,D), m=fn(X,D,k);
    for(const hook of ['torso','hips','shoulder']){ const add=m[hook]; if(!add) continue; const old=k[hook]; k[hook]=(...a)=>(old?old(...a)||[]:[]).concat(add(...a)); }
    if(m.cos){ const old=k.extras; k.extras=(rig,XX,has)=>{ if(old) old(rig,XX,has); ofCosmetics(rig,XX,has,m.cos); }; }
    return k; };
}
// a scarf wound twice round the neck with a knot and two long tails down the back; o = {col, col2 (the stripe / hem), len (0..1 of the torso), th}
function oxScarf(X,D,o){
  const {sg}=X, TK=D.TK, s=torsoSize(X,D,0.55), zb=torsoSize(X,D,0.3).rzBack+0.03, out=[], r=s.rx*0.62+0.03+(o.fat||0);
  for(const dy of [0.0,0.03]) out.push(solid(ofRingAt([0,0.545*TK+dy,0.0],[0,1,0],Math.max(r,s.rz*0.9)+(o.fat||0),0.0185+(o.fat||0)*0.6,sg(8)),dy?o.col2:o.col));
  out.push(solid(csph(0.034,sg(9),sg(7)).translate(0.05,0.53*TK,-(s.rz*0.9+0.02)),o.col2));
  for(const [i,sd] of [[0,1],[1,-1]]){ const L=o.len*(i?0.82:1), P=[[sd*0.045,0.54*TK,zb-0.012],[sd*0.06,0.54*TK-0.18*L,zb+0.022+0.01*i],[sd*0.05,0.54*TK-0.42*L,zb+0.03+0.012*i],[sd*0.075,0.54*TK-0.6*L,zb+0.04]];
    out.push(pc(ofRibbon(P,0.062,{up:[0,0.15,1],seg:sg(14),th:0.006}),(x,y,z,c)=>{ c.set(o.col); const t=(0.54*TK-y)/(0.6*TK*L); if(t>0.86||(t>0.7&&t<0.74)) c.set(o.col2); })); }
  return out; }
// a hanging panel at the front of the hips (an apron, a loincloth): o = {col, trim, len, w}, with a band and two loops
function oxApron(X,D,o){
  const {sg}=X, s=torsoSize(X,D,0.03), rz=Math.max(s.rz,s.rzBack)+0.014, out=[];
  out.push(pc(ofRibbon([[0,0.015,-rz-0.004],[0,-0.07,-rz-0.026],[0,-o.len*0.6,-rz-0.034],[0,-o.len,-rz-0.03]],o.w,{up:[0,0,-1],seg:sg(10),th:0.006}),(x,y,z,c)=>{ c.set(o.col); if(y<-o.len+0.025||Math.abs(x)>o.w*0.5) c.set(o.trim); }));
  for(const sd of [-1,1]) out.push(solid(vbox(0.012,0.05,0.012,sd*o.w*0.2,-0.05,-rz-0.036),o.trim));
  return out; }
// two sash tails hanging from a knot on one hip; o = {col, col2, len, side: 1 | -1}
function oxSash(X,D,o){
  const {sg}=X, s=torsoSize(X,D,0.03), rz=Math.max(s.rz,s.rzBack)+0.012, out=[], x0=o.side*(s.rx*0.8);
  out.push(solid(csph(0.03,sg(9),sg(7)).translate(x0,0.0,-rz*0.6),o.col2));
  for(const [i,dx] of [[0,0.02],[1,-0.015]]){ const L=o.len*(i?0.78:1);
    out.push(pc(ofRibbon([[x0+dx,-0.01,-rz*0.6-0.01],[x0+dx*2+o.side*0.02,-0.1*L,-rz*0.6-0.03],[x0+dx*3+o.side*0.03,-0.24*L,-rz*0.6-0.028],[x0+dx*3+o.side*0.04,-0.4*L,-rz*0.6-0.02]],0.055,{up:[0,0,-1],seg:sg(10),th:0.005}),(x,y,z,c)=>{ c.set(o.col); if(y<-0.36*L) c.set(o.col2); })); }
  return out; }
// a rope coil across the chest from one shoulder to the opposite hip: three turns side by side; o = {col, col2, dir: 1 | -1}
function oxCoil(X,D,o){
  const {sg}=X, TK=D.TK, out=[];
  for(let k=-1;k<=1;k++){ const P=[]; for(let i=0;i<=8;i++){ const f=i/8, yd=lerp(0.5,0.08,f)+k*0.022, s=torsoSize(X,D,clamp(yd,0.02,0.6)), x=o.dir*lerp(0.105,-0.105,f)*D.B; P.push([x,yd*TK,-(s.rz+0.02)]); }
    out.push(pc(sweepTube(P,[0.011,0.012,0.012,0.012,0.012,0.012,0.012,0.012,0.011],sg(6),{cap:'round',rings:sg(18)}),(x,y,z,c)=>{ c.set(((y*140+x*60)%1+1)%1<0.5?o.col:o.col2); })); }
  return out; }
// a plate over the shoulder with a rim and two rivets; o = {col, trim, r}; the shoulder hook frame
function oxPauldron(X,D,o){
  const {sg}=X, aw=D.aw, r=(o.r||0.066)*aw, out=[];
  out.push(pc(new THREE.SphereGeometry(r,sg(18),sg(10),0,TAU,0,Math.PI*0.58).scale(1.1,0.82,1.12).translate(0,0.008,0),(x,y,z,c)=>{ c.set(o.col); if(y<-0.012) c.set(o.trim); }));
  out.push(solid(ofRingAt([0,-0.036,0],[0,1,0],r*0.98,0.0065,sg(6)),o.trim));
  for(const a of [0.9,2.2]) out.push(solid(csph(0.0065,sg(6),sg(5)).translate(Math.sin(a)*r*0.72,0.032,Math.cos(a)*r*0.72),o.trim));
  return out; }
// a lantern on a short cord at the belt: a cage of two caps and posts round a lit core; o = {frame, glow, side}
function oxLantern(X,D,o){
  const {sg}=X, s=torsoSize(X,D,0.03), x=o.side*(s.rx+0.045), out=[];
  out.push(solid(sweepTube([[x*0.88,0.0,0],[x,-0.05,0.0]],[0.0025,0.0025],4,{cap:'round',rings:3}),o.frame),
    solid(vbox(0.05,0.008,0.05,x,-0.056,0),o.frame), solid(vbox(0.05,0.008,0.05,x,-0.13,0),o.frame), solid(csph(0.019,sg(8),sg(6)).translate(x,-0.093,0),o.glow));
  for(const [a,b] of [[1,1],[1,-1],[-1,1],[-1,-1]]) out.push(solid(vbox(0.005,0.074,0.005,x+a*0.022,-0.093,b*0.022),o.frame));
  return out; }
