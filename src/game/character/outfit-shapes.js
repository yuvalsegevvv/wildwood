//@ Silhouette pieces for the signature sets (a flared skirt, a shoulder mantle or banded collar, a back disc or sunburst, a lamp pole, a crape veil) that change a set's outline, not just its trim
/* The pieces of outfit-extras.js are small trims; these are big shapes, built to make two sets read differently from across a street. All go through oxPlus (outfit-extras.js) like the trims.
   oxSkirt(X,D,o)    hips frame: a bell of cloth round the hips, o = {col, col2 (hem), len, flare, rise (the front hem lifted), th}
   oxMantle(X,D,o)   torso frame: a cape over the shoulders or a wide banded collar, o = {cols: [one colour per band from the neck down], flat (a wide flat collar instead of a cape), drop (design height of its lower edge), out (how far past the shoulder), trim}
   oxDisc(X,D,o)     torso frame: a round plate on the back, o = {col, rim, boss, R, y (design height), rays (n spikes round it), ray}
   oxPole(X,D,o)     torso frame: a pole strapped across the back, rising past the head with a hooked arm and a lit lantern, o = {col, frame, glow, len}
   oxVeil(X,D,o)     head frame: a long ribbon from the hat's crown down the back, o = {col, col2, len, w}
   owns: oxSkirt, oxMantle, oxDisc, oxPole, oxVeil, and the pieces listed in the second block below.   used by: game/outfits/*.js (the last lines); test: tools/outfit-smoke.js, tools/cosmetic-items-smoke.js */
function oxSkirt(X,D,o){
  const {sg}=X, s=torsoSize(X,D,0.03), R=Math.max(s.rx,s.rz)+0.018, L=o.len||0.3, n=7, rings=[];
  for(let i=0;i<=n;i++){ const t=i/n, r=R*(1+(o.flare||0.8)*Math.pow(t,1.35)); rings.push({y:-L*t+0.01,rx:r,rz:r}); }
  const g=ofLoft(rings,sg(26),0,TAU), p=g.attributes.position, rise=o.rise||0;
  if(rise) for(let i=0;i<p.count;i++){ const y=p.getY(i), z=p.getZ(i); if(y<-0.02) p.setY(i,y+rise*Math.max(0,-z/(R*1.5))*(-y/L)); }
  g.computeVertexNormals();
  const out=[pc(g,(x,y,z,c)=>{ c.set(o.col); if(y<-L+0.035) c.set(o.col2||o.col); })];
  out.push(solid(ofRingAt([0,-L+0.008+(rise?0:0),0],[0,1,0],rings[n].rx,0.0075,sg(8)),o.col2||o.col));
  return out; }
function oxMantle(X,D,o){
  const {sg}=X, TK=D.TK, s=torsoSize(X,D,0.5), cols=o.cols, y1=(o.flat?0.45:(o.drop||0.36))*TK, rings=[], ex=o.out||0.1;
  const prof=o.flat?[[0.565*TK,0.09],[0.535*TK,s.rx+ex*0.45],[0.51*TK,s.rx+ex*0.85],[0.47*TK,s.rx+ex],[0.45*TK,s.rx+ex*0.94]]:[[0.575*TK,0.09],[0.545*TK,s.rx*0.9+ex*0.45],[0.5*TK,s.rx+ex*0.85],[(0.5*TK+y1)/2,s.rx+ex],[y1,s.rx+ex*0.9]];
  for(const [y,rx] of prof) rings.push({y,rx,rz:Math.max(0.085,rx*0.88)});
  const g=ofLoft(rings,sg(26),0,TAU), top=(o.flat?0.565:0.575)*TK, span=top-y1;
  const out=[pc(g,(x,y,z,c)=>{ const t=clamp((top-y)/span,0,0.999); c.set(cols[Math.floor(t*cols.length)]); })];
  if(o.trim) out.push(solid(ofRingAt([0,y1+0.004,0],[0,1,0],rings[4].rx,o.trimR||0.02,sg(8)),o.trim));
  return out; }
function oxDisc(X,D,o){
  const {sg}=X, TK=D.TK, zb=torsoSize(X,D,0.3).rzBack+0.05, R=o.R||0.17, y=(o.y||0.3)*TK, out=[];
  out.push(solid(new THREE.CylinderGeometry(R,R,0.012,sg(24)).rotateX(Math.PI/2).translate(0,y,zb),o.col));
  out.push(solid(ofRingAt([0,y,zb],[0,0,1],R,0.012,sg(8)),o.rim));
  out.push(solid(csph(R*0.28,sg(10),sg(7)).scale(1,1,0.45).translate(0,y,zb+0.012),o.boss||o.rim));
  for(let i=0;i<(o.rays||0);i++){ const a=i/o.rays*TAU; out.push(solid(new THREE.ConeGeometry(R*0.16,R*0.9,5).rotateZ(-a).translate(Math.sin(a)*(R+R*0.38),y+Math.cos(a)*(R+R*0.38),zb),o.ray||o.rim)); }
  return out; }
function oxPole(X,D,o){
  const {sg}=X, TK=D.TK, zb=torsoSize(X,D,0.3).rzBack+0.05, a=[-0.13,0.0,zb+0.012], b=[0.3,0.55*TK+(o.len||0.5),zb+0.012], dir=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]), L=dir.length(), out=[];
  const g=new THREE.CylinderGeometry(0.014,0.017,L,sg(8)); g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize()))); g.translate((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
  out.push(solid(g,o.col));
  out.push(solid(sweepTube([b,[b[0]+0.02,b[1]+0.05,b[2]-0.04],[b[0]+0.02,b[1]+0.03,b[2]-0.14],[b[0]+0.02,b[1]-0.01,b[2]-0.2]],[0.011,0.01,0.009,0.008],sg(6),{cap:'round',rings:sg(10)}),o.col));
  const lx=b[0]+0.02, ly=b[1]-0.1, lz=b[2]-0.2;
  out.push(solid(new THREE.CylinderGeometry(0.036,0.036,0.1,sg(8),1,true).translate(lx,ly,lz),o.frame),solid(new THREE.ConeGeometry(0.046,0.04,sg(8)).translate(lx,ly+0.07,lz),o.frame),solid(new THREE.CylinderGeometry(0.04,0.03,0.014,sg(8)).translate(lx,ly-0.057,lz),o.frame),solid(csph(0.03,sg(9),sg(7)).translate(lx,ly,lz),o.glow));
  for(let i=0;i<4;i++){ const q=i/4*TAU; out.push(solid(vbox(0.006,0.1,0.006,lx+Math.sin(q)*0.036,ly,lz+Math.cos(q)*0.036),o.frame)); }
  for(const t of [0.3,0.62]) out.push(solid(ofRingAt([a[0]+dir.x*t,a[1]+dir.y*t,a[2]+dir.z*t],[dir.x,dir.y,dir.z],0.02,0.006,sg(6)),o.frame));
  return out; }
function oxVeil(X,D,o){
  const {sg}=X, L=o.len||0.85, w=o.w||0.15;
  return [pc(ofRibbon([[0,0.1,0.07],[0,0.04,0.145],[0,-0.2,0.175],[0,-L*0.55,0.165],[0,-L,0.15]],u=>w*(1-0.35*u),{up:[0,0,1],seg:sg(16),th:0.006}),(x,y,z,c)=>{ c.set(o.col); if(y<-L+0.05) c.set(o.col2||o.col); })]; }
/* oxTabard(X,D,o)   hips frame: long panels hanging from the waist, o = {col, col2 (hem and edge), len, flare, front, back, split (the back as two tails with a gap), half (the arc each covers, radians)}
   oxPannier(X,D,o)  hips frame: two big rounded panniers at the hips, o = {col, col2, w, h}
   oxYoke(X,D,o)     torso frame: a beam across the shoulders with a rope and a bucket hanging from each end, o = {col, rope, bucket, load, drop}
   oxNet(X,D,o)      torso frame: a mesh of rope draped over one shoulder and down the side, o = {col, side, rows, cols}
   owns (second block): oxTabard, oxPannier, oxYoke, oxNet. */
function oxTabard(X,D,o){
  const {sg}=X, s=torsoSize(X,D,0.03), R=Math.max(s.rx,s.rz)+0.02, L=o.len||0.5, n=6, half=o.half||0.85, out=[];
  const rings=[]; for(let i=0;i<=n;i++){ const t=i/n, r=R*(1+(o.flare||0.25)*Math.pow(t,1.3)); rings.push({y:-L*t+0.01,rx:r*(o.slim||1),rz:r}); }
  const arcs=[]; if(o.front!==false&&!o.backOnly) arcs.push([Math.PI-half,Math.PI+half]); if(o.back!==false&&!o.frontOnly) { if(o.split) arcs.push([0.2,half],[-half,-0.2]); else arcs.push([-half,half]); }
  for(const [a0,a1] of arcs) out.push(pc(ofLoft(rings,sg(14),a0,a1),(x,y,z,c)=>{ c.set(o.col); if(y<-L+0.045||Math.abs(x)>R*Math.sin(half)*0.9) c.set(o.col2||o.col); }));
  return out; }
function oxPannier(X,D,o){
  const {sg}=X, s=torsoSize(X,D,0.03), out=[];
  for(const sd of [-1,1]) out.push(pc(csph(1,sg(14),sg(10)).scale(o.w||0.13,o.h||0.1,0.14).translate(sd*(s.rx+(o.w||0.13)*0.7),-0.04,0.01),(x,y,z,c)=>{ c.set(o.col); if(Math.abs(Math.sin(y*80)+Math.cos(x*60))<0.3) c.set(o.col2); }));
  return out; }
function oxYoke(X,D,o){
  const {sg}=X, TK=D.TK, yb=0.515*TK, z0=0.018, hw=0.4, out=[];
  out.push(solid(sweepTube([[-hw,yb-0.005,z0],[-hw*0.4,yb+0.01,z0],[hw*0.4,yb+0.01,z0],[hw,yb-0.005,z0]],[0.02,0.02,0.02,0.02],sg(7),{cap:'round',rings:sg(12)}),o.col));
  for(const sd of [-1,1]){ const x=sd*hw*0.94, yt=yb-0.02, yh=o.drop?yb-o.drop:0.12*TK;
    out.push(solid(sweepTube([[x,yt,z0],[x,(yt+yh)/2,z0],[x,yh+0.07,z0]],[0.005,0.005,0.005],4,{cap:'round',rings:8}),o.rope));
    out.push(solid(new THREE.CylinderGeometry(0.08,0.06,0.1,sg(10),1,true).translate(x,yh,z0),o.bucket),solid(new THREE.CylinderGeometry(0.06,0.06,0.01,sg(10)).translate(x,yh-0.05,z0),o.bucket),solid(ofRingAt([x,yh+0.05,z0],[0,1,0],0.08,0.007,sg(6)),o.rope),solid(csph(0.07,sg(9),sg(6)).scale(1,0.55,1).translate(x,yh+0.045,z0),o.load)); }
  return out; }
function oxNet(X,D,o){
  const {sg}=X, TK=D.TK, sd=o.side||1, rows=o.rows||6, cols=o.cols||7, out=[], a0=0.5, a1=2.7;
  const pt=(yd,a)=>{ const s=torsoSize(X,D,yd), c=Math.cos(a); return [sd*(s.rx+0.03)*Math.sin(a), yd*TK, (c>0?s.rzBack:s.rz)*c+0.03*c]; };
  for(let j=0;j<=rows;j++){ const yd=0.53-j*0.075, P=[]; for(let i=0;i<=cols;i++) P.push(pt(yd,a0+(a1-a0)*i/cols)); out.push(solid(sweepTube(P,P.map(()=>0.0042),4,{cap:'round',rings:sg(14)}),o.col)); }
  for(let i=0;i<=cols;i++){ const a=a0+(a1-a0)*i/cols, P=[]; for(let j=0;j<=rows;j++) P.push(pt(0.53-j*0.075,a)); out.push(solid(sweepTube(P,P.map(()=>0.0042),4,{cap:'round',rings:sg(10)}),o.col)); }
  return out; }
/* oxRuff(X,D,o)     torso frame: a stack of wide frilled rings round the neck, o = {col, col2, r, n}
   oxTripod(X,D,o)   torso frame: a folded surveyor's tripod strapped across the back (three splayed legs, a brass head above the shoulder), o = {col, brass, len}
   oxBanner(X,D,o)   torso frame: a rod up the back with a long cloth banner streaming from its top and a disc on it, o = {col, disc, rod, len}
   oxFringe(X,D,o)   torso frame: many hanging strips round the shoulders like a kelp cloak, o = {cols, n, len, w}
   owns (third block): oxRuff, oxTripod, oxBanner, oxFringe. */
function oxRuff(X,D,o){
  const {sg}=X, TK=D.TK, r=o.r||0.13, out=[];
  for(let i=0;i<(o.n||3);i++) out.push(solid(ofRingAt([0,0.545*TK+0.006-i*0.014,0.003],[0,1,0],r*(1+0.16*i),0.02-0.002*i,sg(8)),i%2?o.col2:o.col));
  return out; }
function oxTripod(X,D,o){
  const {sg}=X, TK=D.TK, zb=torsoSize(X,D,0.3).rzBack+0.06, ap=[0.1,0.55*TK+(o.len||0.34),zb+0.03], out=[];
  for(const f of [[-0.24,0.0,zb+0.02],[0.2,0.02,zb+0.02],[-0.02,-0.04,zb+0.14]]){ const d=new THREE.Vector3(f[0]-ap[0],f[1]-ap[1],f[2]-ap[2]), L=d.length(), g=new THREE.CylinderGeometry(0.013,0.017,L,sg(7));
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()))); g.translate((ap[0]+f[0])/2,(ap[1]+f[1])/2,(ap[2]+f[2])/2); out.push(solid(g,o.col)); }
  out.push(solid(new THREE.CylinderGeometry(0.04,0.04,0.05,sg(10)).translate(ap[0],ap[1]+0.025,ap[2]),o.brass),solid(new THREE.CylinderGeometry(0.018,0.018,0.1,sg(8)).rotateX(Math.PI/2).translate(ap[0],ap[1]+0.075,ap[2]-0.04),o.brass),solid(ofRingAt([ap[0],ap[1]-0.12,ap[2]],[0,1,0.2],0.032,0.006,sg(6)),o.brass),solid(ofRingAt([ap[0]-0.02,ap[1]-0.3,ap[2]+0.03],[0,1,0.3],0.045,0.006,sg(6)),o.brass));
  return out; }
function oxBanner(X,D,o){
  const {sg}=X, TK=D.TK, zb=torsoSize(X,D,0.3).rzBack+0.07, top=0.55*TK+(o.len||0.62), out=[];
  out.push(solid(sweepTube([[0,0.06*TK,zb],[0,0.3*TK,zb],[0,top,zb]],[0.011,0.011,0.009],sg(6),{cap:'round',rings:sg(12)}),o.rod||0x5a3a22),solid(csph(0.02,sg(7),sg(5)).translate(0,top+0.012,zb),o.rod||0x5a3a22));
  out.push(pc(ofRibbon([[0.01,top-0.02,zb+0.004],[0.1,top-0.15,zb+0.03],[0.17,top-0.32,zb+0.02],[0.2,top-0.5,zb+0.01]],u=>0.2*(1-0.25*u),{up:[0,0,1],seg:sg(14),th:0.006}),(x,y,z,c)=>{ c.set(o.col); const dx=x-0.08, dy=y-(top-0.17); if(dx*dx+dy*dy<0.0036) c.set(o.disc); }));
  return out; }
function oxFringe(X,D,o){
  const {sg}=X, TK=D.TK, s=torsoSize(X,D,0.5), n=o.n||16, out=[];
  for(let i=0;i<n;i++){ const a=i/n*TAU, L=(o.len||0.5)*(0.7+0.3*Math.abs(Math.sin(i*2.1))), rx=s.rx+0.045, rz=(Math.cos(a)>0?s.rzBack:s.rz)+0.045, sw=0.025*Math.sin(i*1.7), P=[[Math.sin(a)*rx*0.8,0.53*TK,Math.cos(a)*rz*0.8],[Math.sin(a)*rx,0.5*TK,Math.cos(a)*rz],[Math.sin(a)*(rx+0.03)+sw,0.5*TK-L*0.5,Math.cos(a)*(rz+0.03)],[Math.sin(a)*(rx+0.05)+sw*2,0.5*TK-L,Math.cos(a)*(rz+0.05)]], cols=o.cols;
    out.push(pc(ofRibbon(P,o.w||0.05,{up:[Math.sin(a),0,Math.cos(a)],seg:sg(8),th:0.004}),(x,y,z,c)=>{ c.set(cols[(i+Math.floor((0.5*TK-y)*10))%cols.length]); })); }
  return out; }
