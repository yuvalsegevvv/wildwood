//@ Reusable extra pieces for the signature sets (scarf, apron, sash tails, rope coil, shoulder plate, hip lantern) and oxPlus, which adds them to a set's kit without editing its hooks
/* oxPlus(base, fn): OUTFITS.<id> = oxPlus(OUTFITS.<id>, (X,D,k) => ({torso, hips, shoulder, extras: cosmetics})) wraps a set so each named hook returns what the set's own hook returns plus the pieces here
   (the set's own pieces are untouched; `cos` = the o of ofCosmetics, a cape and / or an aura). The pieces are drawn in torso / hips / shoulder frames like the hooks: y up, the front is -z, torso heights are design
   heights (times D.TK), the hips hang down from y = 0, the shoulder frame has its origin at the joint with y down the arm. owns: oxBow, oxStreamer, oxSheaf, oxFish, oxTube, oxPlus, oxScarf, oxApron, oxSash, oxCoil, oxPauldron, oxLantern, oxBeads, oxSatchel, oxPack, oxMask.
   used by: game/outfits/{sazanka,ogden,tamsin,pell,sabir}.js (the last line of each). test: tools/outfit-smoke.js, tools/cosmetic-items-smoke.js */
function oxPlus(base,fn){
  return function(X,D){
    const k=base(X,D), m=fn(X,D,k);
    for(const hook of ['torso','hips','shoulder','head','forearm']){ const add=m[hook]; if(!add) continue; const old=k[hook]; k[hook]=(...a)=>(old?old(...a)||[]:[]).concat(add(...a)); }
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
// a loop of large beads hanging round the neck onto the chest (a prayer-bead necklace, gold beads); o = {col, col2 (every fifth bead), n, r, drop}; the torso frame
function oxBeads(X,D,o){
  const {sg}=X, TK=D.TK, out=[], n=o.n||20;
  for(let i=0;i<n;i++){ const a=i/n*TAU, fr=Math.max(0,Math.cos(a)), yd=0.57-(o.drop||0.2)*Math.pow(fr,1.4), s=torsoSize(X,D,clamp(yd,0.1,0.6)), R=s.rx*0.62+0.034;
    const z=fr>0?-(s.rz*0.55+0.03+0.03*fr+R*0.2):Math.cos(a)*(R*0.8);   // front: out over the chest; back: round the neck
    out.push(solid(csph(o.r||0.0145,sg(8),sg(6)).translate(Math.sin(a)*R,yd*TK,z),i%5===0?o.col2:o.col)); }
  return out; }
// a small satchel with a flap and a strap at one hip; o = {col, trim, side}: the hips frame
function oxSatchel(X,D,o){
  const {sg}=X, s=torsoSize(X,D,0.03), x=o.side*(s.rx+0.05), out=[];
  out.push(solid(vbox(0.085,0.075,0.05,x,-0.08,-0.01),o.col), solid(vbox(0.09,0.03,0.054,x,-0.052,-0.01),o.trim), solid(vbox(0.012,0.018,0.006,x,-0.062,-0.04),o.trim));
  out.push(pc(ofRibbon([[x*0.5,0.03,-s.rz*0.5],[x*0.85,-0.01,-0.012],[x,-0.045,-0.01]],0.02,{up:[0,0,-1],seg:6,th:0.004}),(xx,y,z,c)=>c.set(o.trim)));
  if(o.herbs) for(let i=0;i<3;i++) out.push(solid(new THREE.ConeGeometry(0.014,0.07,5).rotateX(Math.PI).translate(x+(i-1)*0.022,-0.14,0.01*i),o.herbs));
  return out; }
// a woven basket or pack on the lower back with two straps; o = {col, trim, w, h}: the torso frame
function oxPack(X,D,o){
  const {sg}=X, TK=D.TK, zb=torsoSize(X,D,0.28).rzBack+0.05, out=[];
  out.push(pc(csph(1,sg(12),sg(8)).scale(o.w||0.09,o.h||0.1,0.06).translate(0,0.22*TK,zb),(x,y,z,c)=>{ c.set(o.col); if(((y*90+x*40)%1+1)%1<0.18) c.set(o.trim); }));
  out.push(solid(ofRingAt([0,0.22*TK+(o.h||0.1)*0.8,zb],[0,1,0],(o.w||0.09)*0.8,0.007,sg(6)),o.trim));
  for(const sd of [-1,1]) out.push(pc(ofRibbon([[sd*0.07,0.5*TK,zb-0.05],[sd*0.085,0.35*TK,zb-0.03],[sd*0.075,0.24*TK,zb-0.015]],0.026,{up:[0,0,1],seg:8,th:0.005}),(x,y,z,c)=>c.set(o.trim)));
  return out; }
// a fox / spirit half-mask pushed up on the side of the head with two ears and painted marks; o = {col, mark, side}: the head frame
function oxMask(X,D,o){
  const {sg}=X, sx=o.side, out=[], cx=sx*0.098, cy=0.045, cz=-0.03;
  out.push(solid(csph(1,sg(14),sg(10)).scale(0.013,0.074,0.062).translate(cx,cy,cz),o.col));
  for(const dz of [-0.03,0.03]) out.push(solid(new THREE.ConeGeometry(0.019,0.055,6).rotateZ(sx*-0.35).translate(cx+sx*0.006,cy+0.088,cz+dz),o.col), solid(new THREE.ConeGeometry(0.009,0.03,5).rotateZ(sx*-0.35).translate(cx+sx*0.0105,cy+0.082,cz+dz),o.mark));
  for(const [dy,dz,w] of [[0.014,-0.03,0.02],[0.014,0.03,0.02],[-0.03,0,0.03]]) out.push(solid(csph(1,sg(8),sg(6)).scale(0.003,0.008,w*0.45).translate(cx+sx*0.011,cy+dy,cz+dz),o.mark));
  out.push(solid(csph(1,sg(8),sg(6)).scale(0.004,0.02,0.0035).translate(cx+sx*0.011,cy-0.018,cz),o.mark));
  return out; }
// a big bow at the back of the waist (an obi bow): two flat loops and two tails; o = {col, col2}: the torso frame
function oxBow(X,D,o){
  const {sg}=X, TK=D.TK, zb=torsoSize(X,D,0.1).rzBack+0.03, y=0.1*TK, out=[];
  for(const sd of [-1,1]) out.push(pc(csph(1,sg(12),sg(8)).scale(0.075,0.05,0.016).rotateZ(sd*0.25).translate(sd*0.075,y+0.01,zb+0.01),(x,yy,z,c)=>{ c.set(o.col); if(Math.abs(x)<0.04) c.set(o.col2); }));
  out.push(solid(csph(1,sg(9),sg(7)).scale(0.028,0.03,0.022).translate(0,y,zb+0.014),o.col2));
  for(const sd of [-1,1]) out.push(pc(ofRibbon([[sd*0.012,y-0.01,zb+0.02],[sd*0.03,y-0.12,zb+0.035],[sd*0.045,y-0.26,zb+0.03]],0.05,{up:[0,0,1],seg:sg(10),th:0.005}),(x,yy,z,c)=>{ c.set(o.col); if(yy<y-0.22) c.set(o.col2); }));
  return out; }
// a long sleeve streamer trailing from the wrist; o = {col, col2, len, side}: the forearm frame (y down the arm, the wrist at -0.25)
function oxStreamer(X,D,o){
  const {sg}=X, out=[], L=o.len||0.4;
  out.push(pc(ofRibbon([[0,-0.235,0.0],[o.side*0.012,-0.235-0.3*L,0.03],[o.side*0.03,-0.235-0.65*L,0.05],[o.side*0.02,-0.235-L,0.04]],0.07,{up:[1,0,0],seg:sg(12),th:0.005}),(x,y,z,c)=>{ c.set(o.col); if(y<-0.235-0.85*L||y>-0.25) c.set(o.col2); }));
  return out; }
// a sheaf of wheat tied with a cord on the back: a fan of stalks with ears; o = {col, ear, cord}: the torso frame
function oxSheaf(X,D,o){
  const {sg}=X, TK=D.TK, zb=torsoSize(X,D,0.3).rzBack+0.045, out=[];
  for(let i=-3;i<=3;i++){ const a=i*0.17, x0=i*0.008;
    out.push(solid(sweepTube([[x0,0.06*TK,zb],[x0+Math.sin(a)*0.18,0.06*TK+0.28,zb+0.01+Math.abs(i)*0.004],[x0+Math.sin(a)*0.36,0.06*TK+0.5,zb+0.012+Math.abs(i)*0.006]],[0.004,0.0035,0.003],4,{cap:'round',rings:8}),o.col));
    out.push(solid(csph(1,sg(7),sg(5)).scale(0.011,0.04,0.011).translate(x0+Math.sin(a)*0.375,0.06*TK+0.54,zb+0.012+Math.abs(i)*0.006),o.ear)); }
  out.push(solid(ofRingAt([0,0.06*TK+0.04,zb],[0,1,0.05],0.034,0.006,sg(6)),o.cord));
  return out; }
// two fish hanging from the belt on a cord; o = {col, fin, side}: the hips frame
function oxFish(X,D,o){
  const {sg}=X, s=torsoSize(X,D,0.03), x0=o.side*(s.rx+0.04), out=[];
  out.push(solid(sweepTube([[x0,-0.01,0.01],[x0,-0.09,0.01]],[0.0022,0.0022],4,{cap:'round',rings:3}),o.fin));
  for(const [i,dz] of [[0,-0.02],[1,0.03]]){ const y=-0.15-0.04*i;
    out.push(solid(csph(1,sg(10),sg(8)).scale(0.018,0.065,0.012).translate(x0,y,dz),o.col), solid(new THREE.ConeGeometry(0.02,0.04,4).translate(x0,y-0.08,dz),o.fin), solid(csph(1,sg(6),sg(5)).scale(0.003,0.012,0.012).translate(x0+0.016,y+0.02,dz),0x111111)); }
  return out; }
// a map / rod tube slung diagonally across the back; o = {col, cap, strap}: the torso frame
function oxTube(X,D,o){
  const {sg}=X, TK=D.TK, zb=torsoSize(X,D,0.3).rzBack+0.045, out=[];
  const a=[0.12,0.52*TK,zb], b=[-0.11,0.04*TK,zb+0.01], dir=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]), len=dir.length();
  const g=new THREE.CylinderGeometry(0.022,0.022,len*0.95,sg(10)); g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize()))); g.translate((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
  out.push(solid(g,o.col));
  for(const t of [0.02,0.98]) out.push(solid(ofRingAt([a[0]+dir.x*t,a[1]+dir.y*t,a[2]+dir.z*t],[dir.x,dir.y,dir.z],0.024,0.006,sg(6)),o.cap));
  out.push(solid(ofRingAt([a[0]+dir.x*0.5,a[1]+dir.y*0.5,a[2]+dir.z*0.5],[dir.x,dir.y,dir.z],0.025,0.005,sg(6)),o.strap));
  return out; }
