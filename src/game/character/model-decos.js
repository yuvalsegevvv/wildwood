//@ Decorations (version 3.2): small colourable details worn up to three at a time (flowers, feathers, bells, a scarf, glasses, masks, a tail, wings...), each fixed to a bone anchor
/* look.deco1 / deco2 / deco3 hold an id of DECOS (any id in any of the three); look.decoColor1..3 the main colour of each (-1 = as designed). A decoration draws a small merged mesh on its own anchor
   (rig.anchors: headTop, face, neck, chest, back, waist, hipL/R, wristL/R, ankleL/R) in that anchor's frame (the face looks along -z, y is up), and some push a motion into rig.anims.
   Crafted at a lodge like every other piece: the recipes are in shared/cospieces.js ('d:<id>').
   owns: DECOS, decoDress, decoTint.   used by: model.js (end of buildCharacter), ui/character-editor.js.   test: tools/cospieces-smoke.js */
const _decoC=new THREE.Color();
const DECO_FIELDS=['deco1','deco2','deco3'];
// [id, anchor, builder(F) → {parts:[geo...], anim?(t,dt,mv,obj)}]; F={c: main colour, k: darker c, l: lighter c, sg}
const DECOS={};
function decoReg(id,anchor,fn){ DECOS[id]={id,anchor,fn}; }
decoReg('flower','headTop',F=>{ const p=[], {c,sg}=F, x0=0.085;   // a blossom pinned above the left ear
  for(let i=0;i<5;i++){ const a=i/5*TAU; p.push(solid(csph(0.011,sg(8),sg(6)).scale(1,1,0.45).translate(x0+Math.cos(a)*0.014,0.04+Math.sin(a)*0.014,-0.08),c)); }
  p.push(solid(csph(0.008,sg(8),sg(6)).translate(x0,0.04,-0.084),0xf6d860));
  p.push(solid(csph(0.007,sg(6),sg(5)).scale(1.6,0.8,0.6).translate(x0-0.018,0.022,-0.083),F.k));
  return {parts:p}; });
decoReg('feather','headTop',F=>{ const {c,sg}=F;   // a long feather standing off the back of the crown
  const pts=[[0.07,-0.02,0.03],[0.1,0.05,0.04],[0.115,0.13,0.035],[0.1,0.2,0.02]];
  return {parts:[pc(sweepTube(pts,[0.005,0.02,0.024,0.002],sg(6),{cap:'point',rings:sg(14)}),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.82+0.3*Math.abs(Math.sin(y*90))); }),solid(sweepTube(pts,[0.0022,0.0018,0.0014,0.0008],4,{cap:'point',rings:8}),F.l)]}; });
decoReg('bell','neck',F=>{ const {c,sg}=F;   // a little bell on a ribbon round the neck
  return {parts:[solid(gmRingAt([0,0.005,0],[0,1,0],0.062,0.0045,sg(10)),F.k),solid(csph(0.016,sg(10),sg(8)).translate(0,-0.02,-0.066),c),solid(csph(0.0045,sg(6),sg(5)).translate(0,-0.034,-0.066),F.k),solid(vbox(0.034,0.004,0.004,0,-0.022,-0.066),F.k)]}; });
decoReg('scarf','neck',F=>{ const {c,sg}=F;   // a thick wrap round the neck with a tail hanging down the front
  const p=[solid(gmRingAt([0,-0.004,0.002],[0,1,0.15],0.066,0.0165,sg(12)),c),solid(gmRingAt([0,-0.024,0.002],[0,1,0.15],0.07,0.0125,sg(12)),F.k)];
  p.push(pc(ofRibbon([[0.04,-0.01,-0.07],[0.05,-0.08,-0.085],[0.05,-0.16,-0.09],[0.046,-0.23,-0.088]],u=>0.024*(1-0.3*u),{up:[0,0,-1],seg:sg(10),th:0.006}),(x,y,z,cc)=>{ cc.set(c); if(y<-0.2||Math.abs(y+0.12)<0.006) cc.set(F.l); }));
  return {parts:p}; });
// ---- worn on the face: fitted to THIS face (F.f: the eyes' place and half size, the ears' x, z(x,y) the skin's depth in the anchor's frame), so glasses frame the eyes and a mask lies on the skin whatever the sliders say ----
function decoFaceOf(X){ const fc=X.face, e=(fc&&fc.eye)||{ex:0.046,ey:0.01,SW:0.02,SH:0.015}, zA=fc&&fc.zAt;
  return {ex:e.ex,ey:e.ey,w:e.SW,h:e.SH,ear:(fc&&fc.earX)||0.1,z:(x,y)=>{ let v=zA?zA(x,y):1e9; if(!(v<1)) v=-Math.sqrt(Math.max(0.0004,0.011-x*x-y*y)); return v+0.1; }}; }
function decoLay(f,g,off,dome){ const p=g.attributes.position; for(let i=0;i<p.count;i++) p.setZ(i,f.z(p.getX(i),p.getY(i))-off-(dome?dome(p.getX(i),p.getY(i)):0)); g.computeVertexNormals(); return g; }   // lays a flat piece on the skin, `off` metres proud of it
function decoLoop(f,cx,cy,rx,ry,r,off,n){ const P=[]; for(let i=0;i<=n;i++){ const a=i/n*TAU, x=cx+Math.cos(a)*rx, y=cy+Math.sin(a)*ry; P.push([x,y,f.z(cx+Math.cos(a)*rx*0.6,cy+Math.sin(a)*ry*0.6)-off]); } return sweepTube(P,P.map(()=>r),5,{cap:'round',rings:n}); }   // an oval rim standing off the skin
function decoTemple(f,s,x,y,off,r){ return sweepTube([[s*x,y,f.z(s*x*0.9,y)-off],[s*(f.ear+0.004),y+0.002,0.085],[s*(f.ear+0.002),y-0.004,0.125]],[r,r,r],4,{cap:'round',rings:6}); }   // an arm from the rim back over the ear
function decoGlint(f,cx,cy,rx,ry,off){ return [0.9,0.45].map((k,i)=>pc(decoLay(f,new THREE.PlaneGeometry(rx*k,ry*0.16,2,1).rotateY(Math.PI).rotateZ(0.75).translate(cx-rx*0.28+i*rx*0.3,cy+ry*0.3-i*ry*0.3,0),off),(x,y,z,cc)=>cc.set(0xffffff))); }   // two slanted strokes of light: the glass, without hiding the eye
decoReg('glasses','face',F=>{ const {c,sg,f}=F, rx=f.w*1.32, ry=f.h*1.5, p=[];   // round spectacles: clear lenses (a rim and a glint), a bridge, arms over the ears
  for(const s of [-1,1]){ p.push(solid(decoLoop(f,s*f.ex,f.ey,rx,ry,0.0023,0.014,sg(20)),c),...decoGlint(f,s*f.ex,f.ey,rx,ry,0.0135),solid(decoTemple(f,s,f.ex+rx,f.ey,0.012,0.002),c)); }
  const bx=f.ex-rx; p.push(solid(sweepTube([[-bx,f.ey+ry*0.25,f.z(-bx,f.ey)-0.014],[0,f.ey+ry*0.5,f.z(0,f.ey)-0.011],[bx,f.ey+ry*0.25,f.z(bx,f.ey)-0.014]],[0.002,0.002,0.002],4,{cap:'round',rings:6}),c)); return {parts:p}; });
decoReg('shades','face',F=>{ const {c,sg,f}=F, rx=f.w*1.5, ry=f.h*1.35, p=[];   // dark glasses: solid lenses with a sheen, a heavy top bar
  for(const s of [-1,1]){ const cx=s*f.ex, cy=f.ey-0.001;
    p.push(pc(decoLay(f,new THREE.CircleGeometry(1,sg(16)).rotateY(Math.PI).scale(rx,ry,1).translate(cx,cy,0),0.013),(x,y,z,cc)=>{ cc.set(c).lerp(decoW,0.3*clamp((y-cy)/ry*0.5+0.5)*clamp(0.5+(x-cx)/rx)); }),solid(decoLoop(f,cx,cy,rx,ry,0.0022,0.0135,sg(18)),F.k),solid(decoTemple(f,s,f.ex+rx,cy+ry*0.5,0.012,0.0028),F.k)); }
  const X0=f.ex+rx, P=[]; for(let i=0;i<=8;i++){ const x=lerp(-X0,X0,i/8); P.push([x,f.ey+ry*0.92,f.z(x*0.8,f.ey)-0.0155]); }
  p.push(solid(sweepTube(P,P.map(()=>0.0034),5,{cap:'round',rings:sg(12)}),F.k)); return {parts:p}; });
decoReg('monocle','face',F=>{ const {c,sg,f}=F, r=f.w*1.22, cx=-f.ex, p=[];   // a monocle on the right eye, its chain falling to the collar
  p.push(solid(decoLoop(f,cx,f.ey,r,Math.max(r*0.9,f.h*1.4),0.003,0.014,sg(20)),c),...decoGlint(f,cx,f.ey,r,r,0.0135));
  p.push(solid(sweepTube([[cx-r,f.ey-0.004,f.z(cx-r*0.6,f.ey)-0.012],[cx-r-0.014,f.ey-0.05,f.z(cx-r,f.ey-0.05)-0.004],[cx-r-0.004,f.ey-0.1,0.06],[cx-0.006,f.ey-0.14,0.045]],[0.0012,0.0012,0.0012,0.0012],4,{cap:'round',rings:sg(14)}),F.l)); return {parts:p}; });
decoReg('eyepatch','face',F=>{ const {c,sg,f}=F, rx=f.w*1.42, ry=f.h*1.6, cx=f.ex, cy=f.ey-0.001;   // a patch over the left eye, cupped, with a stitched edge, on a strap round the head
  const dome=(x,y)=>0.007*Math.max(0,1-Math.pow((x-cx)/rx,2)-Math.pow((y-cy)/ry,2));
  return {parts:[pc(decoLay(f,new THREE.CircleGeometry(1,sg(16)).rotateY(Math.PI).scale(rx,ry,1).translate(cx,cy,0),0.006,dome),(x,y,z,cc)=>{ cc.set(c); const d=Math.hypot((x-cx)/rx,(y-cy)/ry); if(d>0.72&&d<0.84) cc.set(F.l); }),solid(decoLoop(f,cx,cy,rx,ry,0.002,0.0065,sg(18)),F.k),
    solid(sweepTube([[cx+rx,cy+ry*0.5,f.z(cx+rx*0.7,cy)-0.005],[0.105,0.03,0.1],[0,0.062,0.206],[-0.105,0.03,0.1],[-0.06,0.036,f.z(-0.06,0.036)-0.004],[0,0.032,f.z(0,0.032)-0.004],[cx-rx*0.7,cy+ry*0.8,f.z(cx-rx*0.7,cy+ry*0.8)-0.005]],[0.0028,0.0028,0.0028,0.0028,0.0028,0.0028,0.0028],4,{cap:'round',rings:sg(24)}),F.k)]}; });
decoReg('domino','face',F=>{ const {c,sg,f}=F, rx=f.w*1.12, ry=f.h*1.2, p=[];   // a masquerade half mask: an opening for each eye, winged at the temples, a trimmed edge
  for(const s of [-1,1]){ const g=new THREE.RingGeometry(1,2.1,sg(18),2).rotateY(Math.PI), q=g.attributes.position;
    for(let i=0;i<q.count;i++){ const u=q.getX(i), v=q.getY(i), r0=Math.hypot(u,v), o=clamp((r0-1)/1.1), m=0.015*o, wing=u*s>0?o*clamp(v/r0+0.3):0; q.setX(i,u/r0*(rx+m)+s*f.ex+s*0.01*wing); q.setY(i,v/r0*(ry+m)+f.ey+0.008*wing); }   // a band 15 mm wide round the eye's opening, drawn out to a wing at the temple
    p.push(pc(decoLay(f,g,0.006),(x,y,z,cc)=>{ const d=Math.hypot((Math.abs(x)-f.ex)/(rx+0.015),(y-f.ey)/(ry+0.015)); cc.set(d>0.97&&Math.abs(x)>f.ex-rx*0.5?F.l:c); }),solid(decoTemple(f,s,f.ex+rx+0.014,f.ey+0.004,0.005,0.0018),F.k)); }
  p.push(pc(decoLay(f,new THREE.PlaneGeometry(Math.max(0.012,(f.ex-rx)*2+0.006),ry*2.6,2,3).rotateY(Math.PI).translate(0,f.ey+ry*0.1,0),0.0058),(x,y,z,cc)=>cc.set(c))); return {parts:p}; });
decoReg('banditmask','face',F=>{ const {c,sg,f}=F, top=f.ey-f.h*1.45, bot=-0.09, H=top-bot, p=[];   // a cloth tied over the nose and mouth, folded along the top
  const g=new THREE.PlaneGeometry(0.14,H,sg(16),sg(12)).rotateY(Math.PI).translate(0,(top+bot)/2,0), q=g.attributes.position;
  for(let i=0;i<q.count;i++){ const t=clamp((top-q.getY(i))/H); q.setX(i,q.getX(i)*lerp(1,0.5,t*t)); if(t>0.8) q.setY(i,q.getY(i)-0.012*(1-Math.min(1,Math.abs(q.getX(i))/0.03))*(t-0.8)/0.2); }   // narrows to the chin, the hem dips to a point
  p.push(pc(decoLay(f,g,0.0055),(x,y,z,cc)=>{ const t=(top-y)/H; cc.set(t<0.1?F.k:c).multiplyScalar(0.92+0.1*Math.sin(t*26+Math.abs(x)*40)); }));
  for(const s of [-1,1]) p.push(solid(decoTemple(f,s,0.068,top-0.006,0.004,0.0024),F.k)); return {parts:p}; });
decoReg('plaster','face',F=>{ const {c,sg,f}=F, cy=f.ey-f.h*1.25-0.006;   // a sticking plaster across the bridge of the nose
  return {parts:[pc(decoLay(f,new THREE.PlaneGeometry(0.04,0.012,8,2).rotateY(Math.PI).rotateZ(-0.1).translate(0,cy,0),0.0016),(x,y,z,cc)=>{ cc.set(Math.abs(x)<0.007?F.l:c); if(Math.abs(Math.abs(x)-0.014)<0.0015) cc.multiplyScalar(0.85); })]}; });
decoReg('kitsunemask','headTop',F=>{ const {c,sg}=F;   // a fox mask pushed up to the side of the head
  const p=[pc(csph(0.056,sg(14),sg(10)).scale(0.9,1.1,0.32).translate(0.075,0.06,-0.06).rotateZ(-0.35),(x,y,z,cc)=>{ cc.set(c); if(Math.abs(x-0.075)>0.034||Math.abs(y-0.06)>0.052) cc.set(0xd03030); }),solid(new THREE.ConeGeometry(0.02,0.05,4).rotateY(Math.PI/4).translate(0.04,0.115,-0.06).rotateZ(0.2),c),solid(new THREE.ConeGeometry(0.02,0.05,4).rotateY(Math.PI/4).translate(0.12,0.105,-0.06).rotateZ(-0.5),c),solid(new THREE.ConeGeometry(0.015,0.05,6).rotateX(-Math.PI/2).translate(0.085,0.04,-0.085),c)];
  for(const s of [-1,1]) p.push(solid(csph(0.0065,sg(6),sg(5)).scale(1.7,0.6,0.5).translate(0.075+s*0.02,0.072,-0.08),0x1a1a22));
  p.push(solid(gmRingAt([0.0,0.05,0.0],[0,1,0.1],0.108,0.0025,sg(16)),F.k)); return {parts:p}; });
decoReg('earrings','face',F=>{ const {c,sg}=F;   // a hoop and a drop on each ear
  const p=[]; for(const s of [-1,1]){ p.push(solid(gmRingAt([s*0.104,-0.026,0.1],[1,0,0],0.0105,0.0022,sg(10)),c)); p.push(solid(csph(0.0058,sg(8),sg(6)).translate(s*0.104,-0.044,0.1),F.l)); } return {parts:p}; });
decoReg('horns','headTop',F=>{ const {c,sg}=F;   // two small curved horns above the brow
  const p=[]; for(const s of [-1,1]) p.push(pc(sweepTube([[s*0.05,0.0,-0.045],[s*0.075,0.04,-0.055],[s*0.082,0.085,-0.05],[s*0.065,0.12,-0.04]],[0.0125,0.011,0.0075,0.0012],sg(8),{cap:'point',rings:sg(10)}),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.8+0.3*clamp((y+0.02)*5)); })); return {parts:p}; });
decoReg('halo','headTop',F=>{ const {c,sg}=F;   // a small ring of light floating over the head
  return {parts:[solid(gmRingAt([0,0.075,0.0],[0,1,0],0.075,0.0042,sg(18)),c),solid(gmRingAt([0,0.075,0.0],[0,1,0],0.068,0.0016,sg(18)),F.l)],bob:true}; });
decoReg('brooch','chest',F=>{ const {c,sg}=F;   // a gem in a metal setting pinned to the chest
  return {parts:[solid(gmRingAt([0.05,0.06,-0.012],[0,0,1],0.017,0.0032,sg(10)),F.l),solid(csph(0.0125,sg(10),sg(8)).scale(1,1,0.55).translate(0.05,0.06,-0.014),c),solid(csph(0.0045,sg(6),sg(5)).translate(0.046,0.066,-0.022),0xffffff)]}; });
decoReg('pouch','waist',F=>{ const {c,sg}=F;   // a belt pouch with a flap, on the right hip
  return {parts:[solid(gmRingAt([0,0.04,0],[0,1,0],0.145,0.0045,sg(18)).scale(1,1,0.92),F.k),pc(csph(0.036,sg(10),sg(8)).scale(1,1.1,0.8).translate(0.115,-0.02,-0.055),(x,y,z,cc)=>{ cc.set(c); if(y>0) cc.set(F.k); }),solid(csph(0.0065,sg(6),sg(5)).translate(0.115,0.003,-0.092),F.l)]}; });
decoReg('lantern','waist',F=>{ const {c,sg}=F;   // a small lantern hanging from the belt
  return {parts:[solid(sweepTube([[-0.1,0.035,-0.07],[-0.12,-0.01,-0.085],[-0.125,-0.05,-0.09]],[0.0022,0.0022,0.0022],4,{cap:'round',rings:6}),F.k),solid(vbox(0.034,0.006,0.034,-0.125,-0.052,-0.09),F.k),solid(vbox(0.03,0.04,0.03,-0.125,-0.076,-0.09),F.l),pc(csph(0.014,sg(8),sg(6)).translate(-0.125,-0.076,-0.09),(x,y,z,cc)=>cc.set(c).lerp(_decoC.set(0xffffff),0.35)),solid(vbox(0.036,0.006,0.036,-0.125,-0.098,-0.09),F.k)]}; });
decoReg('tail','waist',F=>{ const {c,sg}=F;   // a long soft tail, tipped in a lighter colour
  const pts=[[0,-0.02,0.08],[0,-0.03,0.17],[0,0.0,0.25],[0,0.06,0.3],[0,0.12,0.31]];
  return {parts:[pc(sweepTube(pts,[0.022,0.032,0.04,0.034,0.004],sg(8),{cap:'point',rings:sg(16)}),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.9+0.16*Math.sin(z*60)); if(z>0.25&&y>0.04) cc.set(F.l); })],sway:true}; });
decoReg('wings','back',F=>{ const {c,sg}=F;   // a pair of small feathered wings between the shoulder blades
  const p=[]; for(const s of [-1,1]) for(let i=0;i<5;i++) p.push(pc(csph(1,sg(8),sg(6)).scale(0.011,0.075-0.007*i,0.004).translate(0,0.05,0).rotateZ(-s*(0.45+0.3*i)).translate(s*0.03,0.04,0.05),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.84+0.22*i/4); if(i>=3) cc.lerp(_decoC.set(F.l),0.4); }));
  p.push(solid(csph(0.012,sg(6),sg(5)).translate(0.03,0.04,0.05),F.k),solid(csph(0.012,sg(6),sg(5)).translate(-0.03,0.04,0.05),F.k)); return {parts:p}; });
decoReg('bow','headTop',F=>{ const {c,sg}=F;   // a big hair bow at the back of the head
  const p=[]; for(const s of [-1,1]) p.push(solid(csph(0.03,sg(10),sg(8)).scale(1,0.7,0.35).translate(s*0.034,0.06,0.09).rotateZ(0),c),solid(new THREE.ConeGeometry(0.014,0.05,4).rotateZ(s*Math.PI/2).translate(s*0.0,0,0).translate(s*0.0,0.06,0.09),F.k));
  p.push(solid(csph(0.012,sg(8),sg(6)).translate(0,0.06,0.092),F.k)); for(const s of [-1,1]) p.push(solid(sweepTube([[0,0.055,0.093],[s*0.02,0.01,0.1],[s*0.03,-0.04,0.098]],[0.007,0.006,0.002],4,{cap:'point',rings:8}),c));
  return {parts:p}; });
decoReg('moth','shoulderR',F=>{ const {c,sg}=F;   // a glowing moth resting on the right shoulder
  const p=[solid(csph(0.006,sg(6),sg(5)).scale(0.8,0.8,2.2).translate(0,0.05,0),F.k)]; for(const s of [-1,1]){ p.push(pc(csph(1,sg(8),sg(6)).scale(0.026,0.003,0.02).translate(s*0.026,0.052,-0.006).rotateZ(s*0.0),(x,y,z,cc)=>{ cc.set(c).lerp(_decoC.set(F.l),0.5*Math.abs(x)/0.05); }),pc(csph(1,sg(8),sg(6)).scale(0.018,0.003,0.014).translate(s*0.018,0.052,0.016),cc=>cc.set(F.l))); }
  return {parts:p,bob:true}; });
decoReg('bracelet','wristL',F=>{ const {c,sg}=F;   // a bangle and a charm on the left wrist
  return {parts:[solid(gmRingAt([0,0.02,0],[0,1,0],0.036,0.0045,sg(12)),c),solid(gmRingAt([0,0.034,0],[0,1,0],0.0355,0.0025,sg(12)),F.l),solid(csph(0.0065,sg(6),sg(5)).translate(0.0,0.002,-0.037),F.l)]}; });
decoReg('anklet','ankleL',F=>{ const {c,sg}=F;   // a chain with a bell round the left ankle
  return {parts:[solid(gmRingAt([0,0.05,0],[0,1,0],0.05,0.0026,sg(12)),F.l),solid(csph(0.0095,sg(8),sg(6)).translate(0,0.036,-0.05),c)]}; });
decoReg('heartclip','headTop',F=>{ const {c,sg}=F;   // a heart-shaped hair clip above the left ear
  const x0=0.088, p=[]; for(const s of [-1,1]) p.push(solid(csph(0.0095,sg(8),sg(6)).scale(1,1,0.5).translate(x0+s*0.009,0.05,-0.082),c));
  p.push(solid(new THREE.ConeGeometry(0.0125,0.02,5).rotateZ(Math.PI).scale(1,1,0.5).translate(x0,0.037,-0.082),c)); p.push(solid(csph(0.004,sg(6),sg(5)).translate(x0,0.052,-0.088),F.l)); return {parts:p}; });
decoReg('catears','headTop',F=>{ const {c,sg}=F;   // a headband with two pointed cat ears
  const p=[solid(gmRingAt([0,0.052,0.0],[0,1,0],0.108,0.0055,sg(24)),F.k)]; for(const s of [-1,1]){ p.push(solid(new THREE.ConeGeometry(0.036,0.08,4).rotateY(Math.PI/4).scale(1,1,0.45).translate(s*0.058,0.12,-0.012).rotateZ(-s*0.12),c),solid(new THREE.ConeGeometry(0.02,0.045,4).rotateY(Math.PI/4).scale(1,1,0.4).translate(s*0.058,0.115,-0.024).rotateZ(-s*0.12),F.l)); } return {parts:p}; });
decoReg('bunnyears','headTop',F=>{ const {c,sg}=F;   // two tall floppy bunny ears
  const p=[]; for(const s of [-1,1]){ p.push(solid(csph(0.026,sg(10),sg(8)).scale(0.55,2.6,0.3).translate(s*0.04,0.15,0.0).rotateZ(-s*0.18),c),solid(csph(0.016,sg(8),sg(6)).scale(0.5,2.3,0.25).translate(s*0.04,0.15,-0.01).rotateZ(-s*0.18),F.l)); } return {parts:p}; });
decoReg('choker','neck',F=>{ const {c,sg}=F;   // a ribbon choker with a heart charm
  return {parts:[solid(gmRingAt([0,0.0,0],[0,1,0],0.05,0.005,sg(14)),c),solid(csph(0.0085,sg(8),sg(6)).scale(1,1.1,0.5).translate(0,-0.012,-0.052),F.l)]}; });
decoReg('crownlet','headTop',F=>{ const {c,sg}=F;   // a small gold crown set with a gem
  const p=[solid(gmRingAt([0,0.056,0],[0,1,0],0.108,0.006,sg(24)),c)]; for(let i=0;i<5;i++){ const a=i/5*TAU; p.push(solid(new THREE.ConeGeometry(0.011,0.04,4).translate(Math.sin(a)*0.108,0.082,Math.cos(a)*0.108),c)); }
  p.push(solid(csph(0.0085,sg(8),sg(6)).translate(0,0.062,-0.112),0xe0406a)); return {parts:p}; });
decoReg('starbadge','chest',F=>{ const {c,sg}=F;   // a gold star badge on the chest
  const sh=new THREE.Shape(); for(let i=0;i<10;i++){ const a=i/10*TAU, r=i%2?0.011:0.026; if(i) sh.lineTo(Math.sin(a)*r,Math.cos(a)*r); else sh.moveTo(0,r); }
  return {parts:[solid(new THREE.ExtrudeGeometry(sh,{depth:0.006,bevelEnabled:false}).translate(0.05,0.04,-0.07),c),solid(csph(0.005,sg(6),sg(5)).translate(0.05,0.04,-0.074),F.l)]}; });
// the colour a decoration has: the look's own choice (decoColor<n>, -1 = as designed) or the design's
const decoW=new THREE.Color(0xffffff);
const DECO_COL={shades:0x16161c,monocle:0xe6c240,domino:0x7a1f3a,banditmask:0x8a2a2a,plaster:0xe8c8a0,heartclip:0xe84a7a,catears:0x3a3a48,bunnyears:0xf6eef0,choker:0x7a2a4a,crownlet:0xe6c240,starbadge:0xf0c040,flower:0xf08ab0,feather:0xd8d0b0,bell:0xe6c240,scarf:0xc83a3a,glasses:0x3a3a40,eyepatch:0x22222a,kitsunemask:0xf2eee6,earrings:0xe6c240,horns:0xd9d2c0,halo:0xffe27a,brooch:0x3a8ae0,pouch:0x8a5a34,lantern:0xffb040,tail:0xd9812a,wings:0xf4f0e6,bow:0xe0508a,moth:0x9ad8ff,bracelet:0xc0c8d0,anklet:0xe6c240};
function decoTint(L,i){ const v=L['decoColor'+(i+1)]; return typeof v==='number'&&v>=0&&v<=0xffffff?v:null; }
function decoDress(rig,X){
  const L=X.L; for(let i=0;i<3;i++){ const id=L[DECO_FIELDS[i]]; if(typeof id!=='string'||!id||!Object.prototype.hasOwnProperty.call(DECOS,id)) continue;
    const D=DECOS[id], anchor=rig.anchors[D.anchor]; if(!anchor) continue;
    const main=decoTint(L,i), c=new THREE.Color(main===null?DECO_COL[id]:main), k=c.clone().multiplyScalar(0.62), l=c.clone().lerp(new THREE.Color(0xffffff),0.45);
    const R=D.fn({c:c.getHex(),k:k.getHex(),l:l.getHex(),sg:X.sg,f:D.anchor==='face'?decoFaceOf(X):null}); if(!R.parts.length) continue;
    const m=new THREE.Mesh(merge(R.parts),cosCapeMat); m.castShadow=false; anchor.add(m);
    if(D.anchor==='headTop') m.position.y=-0.11*rig.dims.faceScale[1];   // (these were drawn from the head's centre, the anchor is its crown)
    const base=m.position.y; if(R.bob||R.sway){ rig.anims=rig.anims||[]; rig.anims.push((t,dt,mv)=>{ if(R.bob) m.position.y=base+0.006*Math.sin(t*2+i); if(R.sway){ m.rotation.y=Math.sin(t*1.6+i)*0.12+Math.sin(t*5)*0.04*mv; m.rotation.x=0.04*Math.sin(t*1.1)-0.1*mv; } }); }
  }
}
