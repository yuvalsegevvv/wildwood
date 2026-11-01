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
decoReg('flower','headTop',F=>{ const p=[], {c,sg}=F, x0=0.085;   // a blossom pinned above the left ear: two rings of cupped petals, a ring of stamens, a pair of leaves and a bud
  for(let i=0;i<6;i++){ const a=i/6*TAU; p.push(pc(csph(0.012,sg(8),sg(6)).scale(1,0.7,0.35).rotateZ(a).translate(x0+Math.cos(a)*0.016,0.04+Math.sin(a)*0.016,-0.08),(x,y,z,cc)=>{ cc.set(c).lerp(_decoC.set(0xffffff),Math.max(0,0.3-Math.hypot(x-x0,y-0.04)*10)); })); }
  for(let i=0;i<5;i++){ const a=i/5*TAU+0.3; p.push(solid(csph(0.008,sg(6),sg(5)).scale(1,0.7,0.35).rotateZ(a).translate(x0+Math.cos(a)*0.008,0.04+Math.sin(a)*0.008,-0.085),F.l)); }
  p.push(solid(csph(0.0055,sg(6),sg(5)).translate(x0,0.04,-0.089),0xf6d860)); for(let i=0;i<6;i++){ const a=i/6*TAU; p.push(solid(csph(0.0018,4,3).translate(x0+Math.cos(a)*0.006,0.04+Math.sin(a)*0.006,-0.091),0xc89a30)); }
  for(const sd of [-1,1]) p.push(solid(csph(0.008,sg(6),sg(5)).scale(1.9,0.7,0.4).rotateZ(sd*0.5+Math.PI).translate(x0-0.02,0.024+sd*0.006,-0.082),0x4f8a3a));
  p.push(solid(csph(0.006,sg(6),sg(5)).scale(1,1.4,1).translate(x0+0.02,0.064,-0.078),c));
  return {parts:p}; });
decoReg('feather','headTop',F=>{ const {c,sg}=F;   // a long feather standing off the back of the crown
  const pts=[[0.07,-0.02,0.03],[0.1,0.05,0.04],[0.115,0.13,0.035],[0.1,0.2,0.02]];
  return {parts:[pc(sweepTube(pts,[0.005,0.02,0.024,0.002],sg(6),{cap:'point',rings:sg(14)}),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.82+0.3*Math.abs(Math.sin(y*90))); }),solid(sweepTube(pts,[0.0022,0.0018,0.0014,0.0008],4,{cap:'point',rings:8}),F.l)]}; });
decoReg('bell','neck',F=>{ const {c,sg}=F;   // a little bell on a ribbon round the neck: a flared bell with a lip, a slit and a clapper, hung from a loop, and a bow at the back
  const bell=new THREE.LatheGeometry([[0.0001,0.0],[0.007,0.0005],[0.0115,-0.006],[0.0135,-0.016],[0.0175,-0.026],[0.0185,-0.03],[0.0001,-0.03]].map(q=>new THREE.Vector2(q[0],q[1])),sg(12)).translate(0,-0.012,-0.068);
  const p=[solid(gmRingAt([0,0.005,0],[0,1,0],0.062,0.0045,sg(10)),F.k),pc(smoothN(bell),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.85+0.3*Math.abs(Math.sin(x*200))); if(y<-0.039) cc.multiplyScalar(0.75); })];
  p.push(solid(gmRingAt([0,-0.008,-0.068],[1,0,0],0.005,0.0016,6),F.l),solid(vbox(0.016,0.003,0.004,0,-0.034,-0.0865),0x1a1a1a),solid(csph(0.0045,sg(6),sg(5)).translate(0,-0.044,-0.068),F.k));
  for(const sd of [-1,1]) p.push(solid(csph(0.011,sg(6),sg(5)).scale(1.2,0.7,0.4).translate(sd*0.012,0.005,0.064),F.k),solid(sweepTube([[sd*0.003,0.0,0.065],[sd*0.008,-0.02,0.068]],[0.004,0.002],4,{cap:'round',rings:4}),F.k));
  return {parts:p}; });
decoReg('scarf','neck',F=>{ const {c,sg}=F;   // a thick wrap round the neck with a tail hanging down the front
  const p=[solid(gmRingAt([0,-0.004,0.002],[0,1,0.15],0.066,0.0165,sg(12)),c),solid(gmRingAt([0,-0.024,0.002],[0,1,0.15],0.07,0.0125,sg(12)),F.k)];
  p.push(pc(ofRibbon([[0.04,-0.01,-0.07],[0.05,-0.08,-0.085],[0.05,-0.16,-0.09],[0.046,-0.23,-0.088]],u=>0.024*(1-0.3*u),{up:[0,0,-1],seg:sg(10),th:0.006}),(x,y,z,cc)=>{ cc.set(c); if(y<-0.2||Math.abs(y+0.12)<0.006) cc.set(F.l); }));
  return {parts:p}; });
decoReg('glasses','face',F=>{ const {c,sg}=F;   // round spectacles
  const p=[]; for(const s of [-1,1]){ p.push(solid(gmRingAt([s*0.036,0.012,-0.012],[0,0,1],0.021,0.0025,sg(12)),c)); p.push(pc(new THREE.CircleGeometry(0.0205,sg(14)).translate(s*0.036,0.012,-0.0125),(x,y,z,cc)=>cc.set(0xcfe8ff))); p.push(solid(sweepTube([[s*0.057,0.012,-0.01],[s*0.085,0.012,0.04],[s*0.1,0.008,0.12]],[0.0022,0.0022,0.0022],4,{cap:'round',rings:6}),c)); }
  p.push(solid(sweepTube([[-0.0155,0.016,-0.0125],[0,0.026,-0.0125],[0.0155,0.016,-0.0125]],[0.002,0.002,0.002],4,{cap:'round',rings:6}),c)); return {parts:p}; });
decoReg('eyepatch','face',F=>{ const {c,sg}=F;   // a shaped leather patch over the left eye with a stitched rim and an embroidered star, on a strap round the head with a brass slider at the temple
  const p=[pc(csph(0.027,sg(14),sg(10)).scale(1,0.82,0.35).translate(0.036,0.008,-0.0155),(x,y,z,cc)=>{ const r=Math.hypot((x-0.036)/0.027,(y-0.008)/0.022); cc.set(c); if(r>0.86) cc.multiplyScalar(0.7); else if(Math.abs(r-0.76)<0.05&&Math.sin(Math.atan2(y-0.008,x-0.036)*14)>0) cc.set(F.l); })];
  const st=new THREE.Shape(); for(let i=0;i<10;i++){ const a=i/10*TAU+Math.PI/2, r=i%2?0.0035:0.0085; if(i) st.lineTo(Math.cos(a)*r,Math.sin(a)*r); else st.moveTo(Math.cos(a)*r,Math.sin(a)*r); } st.closePath();
  p.push(solid(new THREE.ExtrudeGeometry(st,{depth:0.0015,bevelEnabled:false}).translate(0.036,0.008,-0.0262),F.l));
  p.push(solid(sweepTube([[0.058,0.018,-0.008],[0.105,0.03,0.1],[0,0.062,0.206],[-0.105,0.03,0.1],[-0.01,0.018,-0.017]],[0.0028,0.0028,0.0028,0.0028,0.0028],4,{cap:'round',rings:sg(18)}),F.k),solid(vbox(0.004,0.011,0.009,0.098,0.028,0.07).rotateY(0.6),0xc9a13a));
  return {parts:p}; });
decoReg('kitsunemask','headTop',F=>{ const {c,sg}=F;   // a fox mask pushed up to the side of the head
  const p=[pc(csph(0.056,sg(14),sg(10)).scale(0.9,1.1,0.32).translate(0.075,0.06,-0.06).rotateZ(-0.35),(x,y,z,cc)=>{ cc.set(c); if(Math.abs(x-0.075)>0.034||Math.abs(y-0.06)>0.052) cc.set(0xd03030); }),solid(new THREE.ConeGeometry(0.02,0.05,4).rotateY(Math.PI/4).translate(0.04,0.115,-0.06).rotateZ(0.2),c),solid(new THREE.ConeGeometry(0.02,0.05,4).rotateY(Math.PI/4).translate(0.12,0.105,-0.06).rotateZ(-0.5),c),solid(new THREE.ConeGeometry(0.015,0.05,6).rotateX(-Math.PI/2).translate(0.085,0.04,-0.085),c)];
  for(const s of [-1,1]) p.push(solid(csph(0.0065,sg(6),sg(5)).scale(1.7,0.6,0.5).translate(0.075+s*0.02,0.072,-0.08),0x1a1a22));
  p.push(solid(gmRingAt([0.0,0.05,0.0],[0,1,0.1],0.108,0.0025,sg(16)),F.k)); return {parts:p}; });
decoReg('earrings','face',F=>{ const {c,sg}=F;   // on each ear: a stud, a thick hoop and a teardrop gem in a claw setting hanging from it
  const p=[]; for(const s of [-1,1]){ p.push(solid(csph(0.0035,6,5).translate(s*0.106,-0.016,0.1),F.l));
    p.push(pc(gmRingAt([s*0.105,-0.03,0.1],[1,0,0],0.012,0.0032,sg(12)),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.85+0.3*Math.max(0,y+0.03)*60); }));
    p.push(solid(csph(0.0075,sg(8),sg(6)).scale(1,1.5,1).translate(s*0.105,-0.052,0.1),0xd84a6a),solid(gmRingAt([s*0.105,-0.044,0.1],[0,1,0],0.006,0.0015,6),c),solid(new THREE.ConeGeometry(0.004,0.006,5).rotateX(Math.PI).translate(s*0.105,-0.064,0.1),c)); }
  return {parts:p}; });
decoReg('horns','headTop',F=>{ const {c,sg}=F;   // two small curved horns above the brow
  const p=[]; for(const s of [-1,1]) p.push(pc(sweepTube([[s*0.05,0.0,-0.045],[s*0.075,0.04,-0.055],[s*0.082,0.085,-0.05],[s*0.065,0.12,-0.04]],[0.0125,0.011,0.0075,0.0012],sg(8),{cap:'point',rings:sg(10)}),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.8+0.3*clamp((y+0.02)*5)); })); return {parts:p}; });
decoReg('halo','headTop',F=>{ const {c,sg}=F;   // a small ring of light floating over the head
  return {parts:[solid(gmRingAt([0,0.075,0.0],[0,1,0],0.075,0.0042,sg(18)),c),solid(gmRingAt([0,0.075,0.0],[0,1,0],0.068,0.0016,sg(18)),F.l)],bob:true}; });
decoReg('brooch','chest',F=>{ const {c,sg}=F;   // a faceted gem in a claw setting inside a ring of filigree beads, a pearl hanging under it
  const p=[solid(gmRingAt([0.05,0.06,-0.012],[0,0,1],0.017,0.0028,sg(10)),F.l)]; for(let i=0;i<10;i++){ const a=i/10*TAU; p.push(solid(csph(0.0028,4,3).translate(0.05+Math.cos(a)*0.021,0.06+Math.sin(a)*0.021,-0.012),F.l)); }
  p.push(pc(new THREE.OctahedronGeometry(0.0125,1).scale(1,1,0.55).translate(0.05,0.06,-0.016),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.75+0.5*Math.max(0,(y-0.055)*60)); }),solid(csph(0.0035,5,4).translate(0.046,0.066,-0.023),0xffffff));
  for(let i=0;i<4;i++){ const a=i/4*TAU+Math.PI/4; p.push(solid(csph(0.0025,4,3).translate(0.05+Math.cos(a)*0.012,0.06+Math.sin(a)*0.012,-0.02),F.l)); }
  p.push(solid(sweepTube([[0.05,0.04,-0.012],[0.05,0.03,-0.013]],[0.0012,0.0012],3,{cap:'round',rings:2}),F.l),solid(csph(0.0055,6,5).translate(0.05,0.025,-0.014),0xf4f0e8));
  return {parts:p}; });
decoReg('pouch','waist',F=>{ const {c,sg}=F;   // a belt with a leather pouch on the right hip: a rounded body, a stitched flap with a brass buckle, a drawstring peeking out and a small knife sheath beside it
  const p=[solid(gmRingAt([0,0.04,0],[0,1,0],0.145,0.0045,sg(18)).scale(1,1,0.92),F.k)];
  p.push(pc(csph(0.036,sg(10),sg(8)).scale(1,1.1,0.75).translate(0.115,-0.02,-0.055),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.9+0.1*Math.sin(y*200)); }));
  p.push(pc(csph(0.037,sg(10),sg(6),0,TAU,0,Math.PI*0.45).scale(1.02,0.9,0.8).translate(0.115,-0.012,-0.055),(x,y,z,cc)=>{ cc.set(F.k); if(Math.abs(Math.hypot(x-0.115,(y+0.012)*1.1)-0.03)<0.002) cc.set(F.l); }));
  p.push(solid(vbox(0.012,0.012,0.004,0.115,-0.006,-0.084),0xc9a13a),solid(sweepTube([[0.105,0.015,-0.05],[0.1,0.03,-0.055],[0.096,0.022,-0.064]],[0.0018,0.0018,0.0014],3,{cap:'round',rings:4}),0xe8d9b0));
  p.push(pc(new THREE.ConeGeometry(0.011,0.08,6).rotateX(Math.PI).scale(1,1,0.5).translate(0.15,-0.035,-0.02),(x,y,z,cc)=>cc.set(F.k).multiplyScalar(0.85)),solid(cyl(0.005,0.005,0.025,5).translate(0.15,0.015,-0.02),0x5a3a22));
  return {parts:p}; });
decoReg('lantern','waist',F=>{ const {c,sg}=F;   // a small lantern hanging from the belt: a hook and chain, a pierced cap with a ring, four glass panes in a frame of corner posts, a candle flame inside, a footed base
  const X0=-0.125, Z0=-0.09, Y0=-0.076, p=[solid(sweepTube([[-0.1,0.035,-0.07],[-0.12,-0.01,-0.085],[X0,-0.042,Z0]],[0.0022,0.0022,0.0022],4,{cap:'round',rings:6}),F.k)];
  p.push(pc(new THREE.ConeGeometry(0.024,0.018,4).rotateY(Math.PI/4).translate(X0,Y0+0.03,Z0),(x,y,z,cc)=>cc.set(F.k)),solid(gmRingAt([X0,Y0+0.044,Z0],[0,0,1],0.005,0.0015,6),F.k));
  p.push(pc(vbox(0.028,0.038,0.028,X0,Y0,Z0),(x,y,z,cc)=>cc.set(c).lerp(_decoC.set(0xfff4c0),0.45)));
  for(const sx of [-1,1]) for(const sz of [-1,1]) p.push(solid(vbox(0.004,0.042,0.004,X0+sx*0.015,Y0,Z0+sz*0.015),F.k));
  p.push(solid(new THREE.ConeGeometry(0.005,0.016,5).translate(X0,Y0+0.004,Z0),0xffe680),solid(cyl(0.004,0.004,0.01,5).translate(X0,Y0-0.01,Z0),0xf2efe8));
  p.push(solid(vbox(0.034,0.006,0.034,X0,Y0-0.022,Z0),F.k)); for(const sx of [-1,1]) for(const sz of [-1,1]) p.push(solid(csph(0.003,4,3).translate(X0+sx*0.014,Y0-0.027,Z0+sz*0.014),F.k));
  return {parts:p}; });
decoReg('tail','waist',F=>{ const {c,sg}=F;   // a long soft tail, tipped in a lighter colour
  const pts=[[0,-0.02,0.08],[0,-0.03,0.17],[0,0.0,0.25],[0,0.06,0.3],[0,0.12,0.31]];
  return {parts:[pc(sweepTube(pts,[0.022,0.032,0.04,0.034,0.004],sg(8),{cap:'point',rings:sg(16)}),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.9+0.16*Math.sin(z*60)); if(z>0.25&&y>0.04) cc.set(F.l); })],sway:true}; });
decoReg('wings','back',F=>{ const {c,sg}=F;   // a pair of small feathered wings between the shoulder blades: a row of soft coverts over six long flight feathers, each wing curving out and up
  const p=[]; for(const s of [-1,1]){ const rootX=s*0.03;
    for(let i=0;i<6;i++){ const a=-s*(0.35+0.22*i), L=0.13-0.012*i; p.push(pc(csph(1,sg(8),sg(6)).scale(0.013,L*0.5,0.004).translate(0,L*0.5,0).rotateZ(a).rotateY(s*0.35).translate(rootX,0.03,0.05),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.8+0.25*i/5); if(Math.hypot(x-rootX,y-0.03)>L*0.82) cc.lerp(_decoC.set(F.l),0.6); })); }
    for(let i=0;i<5;i++){ const a=-s*(0.5+0.28*i); p.push(pc(csph(1,sg(7),sg(5)).scale(0.012,0.032,0.0045).translate(0,0.03,0).rotateZ(a).rotateY(s*0.35).translate(rootX,0.035,0.054),(x,y,z,cc)=>{ cc.set(F.l).lerp(_decoC.set(c),0.35); })); }
    p.push(solid(csph(0.014,sg(6),sg(5)).scale(1.2,1,0.8).translate(rootX,0.035,0.052),F.k)); }
  return {parts:p}; });
decoReg('bow','headTop',F=>{ const {c,sg}=F;   // a big hair bow at the back of the head: two deep ribbon loops with soft folds, a wrapped knot, two tails cut in a V
  const p=[], cz=0.124, cy=0.035, fold=(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.82+0.18*Math.abs(Math.sin(Math.atan2(y-cy,x)*3+z*60))); };
  for(const s of [-1,1]){ p.push(pc(new THREE.TorusGeometry(0.022,0.007,sg(8),sg(16)).scale(1.35,0.85,1).scale(1,1,2.2).rotateZ(s*0.12).translate(s*0.033,cy+0.004,cz),fold));
    p.push(pc(sweepTube([[s*0.006,cy-0.004,cz+0.006],[s*0.018,cy-0.04,cz+0.012],[s*0.028,cy-0.08,cz+0.01]],[0.008,0.0085,0.009],sg(6),{cap:'flat',rings:8}).scale(1,1,1),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.88); if(y<cy-0.074&&Math.abs(Math.abs(x)-0.028)<0.004) cc.multiplyScalar(0.7); })); }
  p.push(pc(csph(0.012,sg(8),sg(6)).scale(1,1.15,0.9).translate(0,cy,cz+0.006),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.75+0.15*Math.abs(Math.sin(y*500))); }));
  return {parts:p}; });
decoReg('moth','shoulderR',F=>{ const {c,sg}=F;   // a glowing moth resting on the right shoulder
  const p=[solid(csph(0.006,sg(6),sg(5)).scale(0.8,0.8,2.2).translate(0,0.05,0),F.k)]; for(const s of [-1,1]){ p.push(pc(csph(1,sg(8),sg(6)).scale(0.026,0.003,0.02).translate(s*0.026,0.052,-0.006).rotateZ(s*0.0),(x,y,z,cc)=>{ cc.set(c).lerp(_decoC.set(F.l),0.5*Math.abs(x)/0.05); }),pc(csph(1,sg(8),sg(6)).scale(0.018,0.003,0.014).translate(s*0.018,0.052,0.016),cc=>cc.set(F.l))); }
  return {parts:p,bob:true}; });
decoReg('bracelet','wristL',F=>{ const {c,sg}=F;   // a bangle beside a string of beads on the left wrist, a star charm and a heart charm hanging from it
  const p=[solid(gmRingAt([0,0.03,0],[0,1,0],0.036,0.0045,sg(12)),c)]; const n=sg(12);
  for(let i=0;i<n;i++){ const a=i/n*TAU; p.push(solid(csph(0.0042,5,4).translate(Math.sin(a)*0.0365,0.016,Math.cos(a)*0.0365),i%3?F.l:c)); }
  const st=new THREE.Shape(); for(let i=0;i<10;i++){ const a=i/10*TAU, r=i%2?0.0035:0.0085; if(i) st.lineTo(Math.sin(a)*r,Math.cos(a)*r); else st.moveTo(0,r); }
  p.push(solid(new THREE.ExtrudeGeometry(st,{depth:0.002,bevelEnabled:false}).translate(0.008,0.0,-0.039),c),solid(csph(0.0055,sg(6),sg(5)).scale(1,1,0.5).translate(-0.01,0.0,-0.039),0xe0406a));
  return {parts:p}; });
decoReg('anklet','ankleL',F=>{ const {c,sg}=F;   // a fine chain of links round the left ankle, two little bells and a crescent charm
  const p=[], n=sg(18); for(let i=0;i<n;i++){ const a=i/n*TAU; p.push(solid(gmRingAt([Math.sin(a)*0.05,0.05,Math.cos(a)*0.05],i%2?[Math.cos(a),0,-Math.sin(a)]:[0,1,0],0.0042,0.0012,5),F.l)); }
  for(const a of [-0.35,0.35]){ const x=Math.sin(Math.PI+a)*0.052, z=Math.cos(Math.PI+a)*0.052; p.push(solid(csph(0.0075,sg(8),sg(6)).translate(x,0.038,z),c),solid(vbox(0.008,0.0015,0.002,x,0.034,z-0.007),0x1a1a1a)); }
  p.push(solid(new THREE.TorusGeometry(0.006,0.0022,4,8,Math.PI*1.3).translate(0,0.036,-0.054),c));
  return {parts:p}; });
decoReg('heartclip','headTop',F=>{ const {c,sg}=F;   // a puffy heart-shaped hair clip above the left ear, with a shine, on a metal clip bar
  const x0=0.088, sh=new THREE.Shape(); sh.moveTo(0,-0.016); sh.bezierCurveTo(-0.02,-0.002,-0.016,0.016,0,0.007); sh.bezierCurveTo(0.016,0.016,0.02,-0.002,0,-0.016);
  const g=new THREE.ExtrudeGeometry(sh,{depth:0.003,bevelEnabled:true,bevelThickness:0.003,bevelSize:0.002,bevelSegments:2,curveSegments:sg(8)}).translate(x0,0.045,-0.086);
  return {parts:[pc(g,(x,y,z,cc)=>{ cc.set(c); if(z<-0.087) cc.multiplyScalar(1.05); }),solid(csph(0.003,5,4).scale(1.4,1,0.6).translate(x0-0.006,0.05,-0.09),0xffffff),solid(vbox(0.032,0.004,0.003,x0,0.045,-0.082),0xb9bdc2)]}; });
decoReg('catears','headTop',F=>{ const {c,sg}=F;   // a padded headband with two cat ears: rounded cones, a pale cupped inside with a fluff of fur, a darker tip
  const p=[pc(gmRingAt([0,0.052,0.0],[0,1,0],0.108,0.0065,sg(28)),(x,y,z,cc)=>{ cc.set(F.k).multiplyScalar(0.9+0.12*Math.sin(Math.atan2(x,z)*30)); })];
  for(const s of [-1,1]){ const M=g=>g.rotateX(-0.12).rotateZ(-s*0.18).translate(s*0.06,0.112,-0.008);
    p.push(pc(M(new THREE.ConeGeometry(0.036,0.078,sg(12)).scale(1,1,0.45)),(x,y,z,cc)=>{ cc.set(c); if(y>0.135) cc.multiplyScalar(0.7); }));
    p.push(pc(M(new THREE.ConeGeometry(0.024,0.055,sg(10)).scale(1,1,0.35).translate(0,-0.006,-0.008)),(x,y,z,cc)=>{ cc.set(F.l).lerp(_decoC.set(c),smoothstep(0.08,0.14,y)*0.6); }));
    for(let i=0;i<4;i++) p.push(solid(M(csph(0.006,5,4).scale(1,1.5,0.6).translate((i-1.5)*0.007,-0.028+(i%2)*0.006,-0.016)),0xf6f2ea)); }
  return {parts:p}; });
decoReg('bunnyears','headTop',F=>{ const {c,sg}=F;   // a headband with two long bunny ears: one stands, one flops over at the middle; each a flat tapered lobe, pale and pink inside
  const p=[solid(gmRingAt([0,0.052,0.0],[0,1,0],0.108,0.0055,sg(24)),F.k)];
  for(const s of [-1,1]){ const pts=s<0?[[0,0,0],[0,0.05,0],[s*0.008,0.11,0],[s*0.012,0.16,0],[s*0.01,0.2,0]]:[[0,0,0],[0,0.05,0],[s*0.01,0.1,0],[s*0.04,0.13,0],[s*0.08,0.12,0]];
    const g=sweepTube(pts,[0.01,0.02,0.022,0.019,0.006],sg(10),{cap:'point',rings:sg(16)}).scale(1,1,0.32).rotateZ(-s*0.12).translate(s*0.042,0.055,0.0);
    p.push(pc(g,(x,y,z,cc)=>{ cc.set(c); if(z<-0.0025) cc.set(F.l).lerp(_decoC.set(0xf2a8b8),0.35); })); }
  return {parts:p}; });
decoReg('choker','neck',F=>{ const {c,sg}=F;   // a velvet ribbon with a lace edge of tiny scallops, a ring and a heart charm in front and a bow tied at the back
  const p=[solid(gmRingAt([0,0.0,0],[0,1,0],0.05,0.0055,sg(14)),c)], n=sg(20);
  for(let i=0;i<n;i++){ const a=i/n*TAU; p.push(solid(csph(0.0035,4,3).scale(1,1.2,0.6).translate(Math.sin(a)*0.053,-0.007,Math.cos(a)*0.053),0xf4eee6)); }
  p.push(solid(gmRingAt([0,-0.01,-0.055],[0,0,1],0.004,0.0012,6),F.l));
  const sh=new THREE.Shape(); sh.moveTo(0,-0.011); sh.bezierCurveTo(-0.012,-0.002,-0.008,0.008,0,0.003); sh.bezierCurveTo(0.008,0.008,0.012,-0.002,0,-0.011);
  p.push(solid(new THREE.ExtrudeGeometry(sh,{depth:0.003,bevelEnabled:true,bevelThickness:0.001,bevelSize:0.001,bevelSegments:1}).translate(0,-0.02,-0.058),F.l));
  for(const sd of [-1,1]) p.push(solid(csph(0.009,sg(6),sg(5)).scale(1.3,0.7,0.4).translate(sd*0.011,0.0,0.052),c),solid(sweepTube([[sd*0.003,-0.002,0.053],[sd*0.007,-0.022,0.056]],[0.0035,0.002],4,{cap:'round',rings:4}),c));
  return {parts:p}; });
decoReg('crownlet','headTop',F=>{ const {c,sg}=F;   // a small gold crown: an engraved band set with five gems, tall points tipped with pearls between small leaf points
  const p=[pc(cyl(0.111,0.108,0.016,sg(30),1,true).translate(0,0.058,0),(x,y,z,cc)=>{ cc.set(c); if(Math.abs(y-0.058)>0.006) cc.multiplyScalar(0.78); })];
  p.push(solid(gmRingAt([0,0.05,0],[0,1,0],0.109,0.0022,sg(30)),c),solid(gmRingAt([0,0.066,0],[0,1,0],0.112,0.0022,sg(30)),c));
  for(let i=0;i<10;i++){ const a=i/10*TAU, tall=i%2===0, r=0.111, h=tall?0.046:0.024;
    p.push(pc(new THREE.ConeGeometry(tall?0.012:0.009,h,sg(6)).scale(1,1,0.4).rotateY(-a).translate(Math.sin(a)*r,0.066+h/2,Math.cos(a)*r),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.85+0.2*clamp((y-0.07)*20)); }));
    if(tall) p.push(solid(csph(0.0055,sg(6),sg(5)).translate(Math.sin(a)*r,0.066+h+0.003,Math.cos(a)*r),0xf6f0e6));
    else p.push(solid(csph(0.0045,sg(6),sg(5)).scale(1,1,0.6).translate(Math.sin(a)*(r+0.004),0.058,Math.cos(a)*(r+0.004)),[0xe0406a,0x3a8ae0,0x40c070,0xe0406a,0x3a8ae0][(i-1)/2])); }
  return {parts:p}; });
decoReg('starbadge','chest',F=>{ const {c,sg}=F;   // a gold star medal on the chest: a bevelled star with a gem at its heart, hung from a short striped ribbon
  const sh=new THREE.Shape(); for(let i=0;i<10;i++){ const a=i/10*TAU, r=i%2?0.011:0.026; if(i) sh.lineTo(Math.sin(a)*r,Math.cos(a)*r); else sh.moveTo(0,r); }
  const p=[pc(new THREE.ExtrudeGeometry(sh,{depth:0.003,bevelEnabled:true,bevelThickness:0.002,bevelSize:0.002,bevelSegments:1}).translate(0.05,0.03,-0.072),(x,y,z,cc)=>{ cc.set(c).multiplyScalar(0.85+0.3*Math.max(0,1-Math.hypot(x-0.05,y-0.03)*40)); }),solid(csph(0.0055,sg(6),sg(5)).translate(0.05,0.03,-0.076),0xd8304a)];
  p.push(pc(vbox(0.022,0.026,0.003,0.05,0.066,-0.07),(x,y,z,cc)=>{ cc.set(Math.abs(x-0.05)<0.004?0xf2efe8:0x2f4a9a); }),solid(vbox(0.024,0.004,0.004,0.05,0.053,-0.071),c));
  return {parts:p}; });
// the colour a decoration has: the look's own choice (decoColor<n>, -1 = as designed) or the design's
const DECO_COL={heartclip:0xe84a7a,catears:0x3a3a48,bunnyears:0xf6eef0,choker:0x7a2a4a,crownlet:0xe6c240,starbadge:0xf0c040,flower:0xf08ab0,feather:0xd8d0b0,bell:0xe6c240,scarf:0xc83a3a,glasses:0x3a3a40,eyepatch:0x22222a,kitsunemask:0xf2eee6,earrings:0xe6c240,horns:0xd9d2c0,halo:0xffe27a,brooch:0x3a8ae0,pouch:0x8a5a34,lantern:0xffb040,tail:0xd9812a,wings:0xf4f0e6,bow:0xe0508a,moth:0x9ad8ff,bracelet:0xc0c8d0,anklet:0xe6c240};
function decoTint(L,i){ const v=L['decoColor'+(i+1)]; return typeof v==='number'&&v>=0&&v<=0xffffff?v:null; }
function decoDress(rig,X){
  const L=X.L; for(let i=0;i<3;i++){ const id=L[DECO_FIELDS[i]]; if(typeof id!=='string'||!id||!Object.prototype.hasOwnProperty.call(DECOS,id)) continue;
    const D=DECOS[id], anchor=rig.anchors[D.anchor]; if(!anchor) continue;
    const main=decoTint(L,i), c=new THREE.Color(main===null?DECO_COL[id]:main), k=c.clone().multiplyScalar(0.62), l=c.clone().lerp(new THREE.Color(0xffffff),0.45);
    const R=D.fn({c:c.getHex(),k:k.getHex(),l:l.getHex(),sg:X.sg}); if(!R.parts.length) continue;
    const m=new THREE.Mesh(merge(R.parts),cosCapeMat); m.castShadow=false; anchor.add(m);
    if(D.anchor==='headTop') m.position.y=-0.11*rig.dims.faceScale[1];   // (these were drawn from the head's centre, the anchor is its crown)
    const base=m.position.y; if(R.bob||R.sway){ rig.anims=rig.anims||[]; rig.anims.push((t,dt,mv)=>{ if(R.bob) m.position.y=base+0.006*Math.sin(t*2+i); if(R.sway){ m.rotation.y=Math.sin(t*1.6+i)*0.12+Math.sin(t*5)*0.04*mv; m.rotation.x=0.04*Math.sin(t*1.1)-0.1*mv; } }); }
  }
}
