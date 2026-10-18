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
decoReg('glasses','face',F=>{ const {c,sg}=F;   // round spectacles
  const p=[]; for(const s of [-1,1]){ p.push(solid(gmRingAt([s*0.036,0.012,-0.012],[0,0,1],0.021,0.0025,sg(12)),c)); p.push(pc(new THREE.CircleGeometry(0.0205,sg(14)).translate(s*0.036,0.012,-0.0125),(x,y,z,cc)=>cc.set(0xcfe8ff))); p.push(solid(sweepTube([[s*0.057,0.012,-0.01],[s*0.085,0.012,0.04],[s*0.1,0.008,0.12]],[0.0022,0.0022,0.0022],4,{cap:'round',rings:6}),c)); }
  p.push(solid(sweepTube([[-0.0155,0.016,-0.0125],[0,0.026,-0.0125],[0.0155,0.016,-0.0125]],[0.002,0.002,0.002],4,{cap:'round',rings:6}),c)); return {parts:p}; });
decoReg('eyepatch','face',F=>{ const {c,sg}=F;   // a patch over the left eye on a strap round the head
  return {parts:[solid(csph(0.026,sg(12),sg(8)).scale(1,0.85,0.35).translate(0.036,0.008,-0.0155),c),solid(sweepTube([[0.058,0.018,-0.008],[0.105,0.03,0.1],[0,0.062,0.206],[-0.105,0.03,0.1],[-0.01,0.018,-0.017]],[0.0028,0.0028,0.0028,0.0028,0.0028],4,{cap:'round',rings:sg(18)}),F.k)]}; });
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
  return {parts:[solid(gmRingAt([0,0.04,0],[0,1,0],0.145,0.0045,sg(18)).scale(1,1,0.92),F.k),pc(csph(0.036,sg(10),sg(8)).scale(1,1.1,0.8).translate(0.115,-0.02,-0.055),(x,y,z,cc)=>{ cc.set(c); if(y>-0.0) cc.set(F.k); }),solid(csph(0.0065,sg(6),sg(5)).translate(0.115,0.003,-0.092),F.l)]}; });
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
// the colour a decoration has: the look's own choice (decoColor<n>, -1 = as designed) or the design's
const DECO_COL={flower:0xf08ab0,feather:0xd8d0b0,bell:0xe6c240,scarf:0xc83a3a,glasses:0x3a3a40,eyepatch:0x22222a,kitsunemask:0xf2eee6,earrings:0xe6c240,horns:0xd9d2c0,halo:0xffe27a,brooch:0x3a8ae0,pouch:0x8a5a34,lantern:0xffb040,tail:0xd9812a,wings:0xf4f0e6,bow:0xe0508a,moth:0x9ad8ff,bracelet:0xc0c8d0,anklet:0xe6c240};
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
