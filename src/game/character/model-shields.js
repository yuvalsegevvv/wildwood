//@ Shields (version 3.2): an optional cosmetic worn on the left forearm, four shapes (round buckler, heater, kite, tower), off by default, with a main and a trim colour
/* look.shield holds an id of SHIELDS ('' = none), look.shieldColor the field colour and look.shieldTrim the rim / boss / emblem colour (-1 = as designed). The shield is one merged mesh fixed to the left elbow's frame
   (y runs down the forearm, the outside of the arm is -x), so it follows the arm through every pose. A cosmetic only: it changes no number and no weapon. Crafted at a lodge ('w:<id>' in shared/cospieces.js).
   owns: SHIELDS, shieldDress.   used by: model.js (end of buildCharacter), ui/character-editor.js, ui/character-thumbs.js.   test: tools/cospieces-smoke.js */
const SHIELDS={
  round:{name:'Buckler',col:0x8a5a34,trim:0x9aa0a8,w:0.25,h:0.25},
  heater:{name:'Heater Shield',col:0x2f5a9a,trim:0xe6c240,w:0.26,h:0.32},
  kite:{name:'Kite Shield',col:0x9a2f2f,trim:0xe8e4dc,w:0.22,h:0.42},
  tower:{name:'Tower Shield',col:0x4a4a52,trim:0xb08a3a,w:0.3,h:0.46}
};
// the outline of a shape in the shield's own plane (x across, y up, the centre at 0,0); r: how far to grow it for the rim behind
function shieldOutline(id,r){
  const S=SHIELDS[id], hw=S.w/2+r, hh=S.h/2+r, sh=new THREE.Shape();
  if(id==='round'){ sh.absarc(0,0,hw,0,TAU,false); }
  else if(id==='heater'){ sh.moveTo(-hw,hh); sh.lineTo(hw,hh); sh.lineTo(hw,hh*0.1); sh.quadraticCurveTo(hw*0.9,-hh*0.62,0,-hh); sh.quadraticCurveTo(-hw*0.9,-hh*0.62,-hw,hh*0.1); sh.lineTo(-hw,hh); }
  else if(id==='kite'){ sh.moveTo(0,hh); sh.quadraticCurveTo(hw*0.9,hh*0.95,hw,hh*0.5); sh.quadraticCurveTo(hw*0.9,-hh*0.2,0,-hh); sh.quadraticCurveTo(-hw*0.9,-hh*0.2,-hw,hh*0.5); sh.quadraticCurveTo(-hw*0.9,hh*0.95,0,hh); }
  else { const c=hw*0.5; sh.moveTo(-hw,-hh+c); sh.lineTo(-hw,hh-c); sh.quadraticCurveTo(-hw,hh,-hw+c,hh); sh.lineTo(hw-c,hh); sh.quadraticCurveTo(hw,hh,hw,hh-c); sh.lineTo(hw,-hh+c); sh.quadraticCurveTo(hw,-hh,hw-c,-hh); sh.lineTo(-hw+c,-hh); sh.quadraticCurveTo(-hw,-hh,-hw,-hh+c); }
  return sh;
}
function shieldDress(rig,X){
  const L=X.L, id=L.shield; if(typeof id!=='string'||!id||!Object.prototype.hasOwnProperty.call(SHIELDS,id)) return;
  const S=SHIELDS[id], sg=X.sg, fc=v=>typeof v==='number'&&v>=0&&v<=0xffffff?Math.floor(v):null, col=fc(L.shieldColor), trim=fc(L.shieldTrim), C=col===null?S.col:col, T=trim===null?S.trim:trim;
  const Cd=gmxMul(C,0.72), Tl=new THREE.Color(T).lerp(new THREE.Color(0xffffff),0.3).getHex(), curve=Math.max(6,sg(10));
  const ext=(sh,depth)=>new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:false,curveSegments:curve});
  const parts=[];
  // the rim behind (a little larger, in trim), then the face
  parts.push(solid(ext(shieldOutline(id,0.012),0.014).translate(0,0,-0.014),T));
  parts.push(pc(ext(shieldOutline(id,-0.004),0.02),(x,y,z,c)=>{
    if(z<0.016){ c.set(Cd); return; }   // the sides of the face
    c.set(C);
    if(id==='round'){ const a=Math.atan2(y,x), k=Math.floor(((a/TAU+1)%1)*10); c.multiplyScalar(k%2?0.86:1.0); if(Math.hypot(x,y)>S.w/2-0.026) c.set(Cd); }
    else if(id==='heater'){ if(Math.abs(x)<0.026||Math.abs(y-0.03)<0.026) c.set(T); }
    else if(id==='kite'){ if(Math.abs(Math.abs(x)*S.h/S.w*0.9+(y-0.04))<0.03||Math.abs(x)<0.014) c.set(T); }
    else { if(Math.abs(x)<0.03) c.set(T); if(Math.abs(y)>S.h/2-0.05) c.set(Cd); c.multiplyScalar(0.92+0.08*Math.sin(x*140)); } }));
  // the boss and, on the tall ones, a row of rivets down the middle band
  if(id==='round'||id==='heater'||id==='tower') parts.push(solid(csph(id==='round'?0.036:0.026,sg(12),sg(8)).scale(1,1,0.55).translate(0,id==='heater'?0.03:0,0.022),T));
  if(id==='tower') for(const y of [-0.17,-0.1,0.1,0.17]) parts.push(solid(csph(0.008,sg(6),sg(5)).translate(0,y,0.021),Tl));
  if(id==='kite') parts.push(solid(csph(0.02,sg(10),sg(8)).scale(1,1,0.5).translate(0,0.04,0.022),T));
  // faces outward (-x), a hand's width down the forearm, tilted back a little so it clears the hip
  const g=merge(parts).rotateY(-Math.PI/2).translate(-0.056,-0.12,0);
  const m=new THREE.Mesh(g,cosCapeMat); m.castShadow=false; rig.elL.add(m);
}
