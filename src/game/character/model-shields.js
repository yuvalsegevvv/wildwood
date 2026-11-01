//@ Shields (version 3.2): an optional cosmetic worn on the weak hand's forearm (the left, or the right when look.left), four shapes (round buckler, heater, kite, tower), off by default, with a main and a trim colour
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
  const L=X.L, id=L.shield; if(typeof id!=='string'||!id||!Object.prototype.hasOwnProperty.call(SHIELDS,id)||rig.sillyW) return;   // (a silly weak-hand item replaces it: model-silly.js)
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
    else if(id==='heater'){ c.multiplyScalar(0.94+0.06*Math.sin(y*90)); if(y<0.03) c.multiplyScalar(0.9); }   // (the cross is raised bars below: a face this coarse cannot carry a painted one)
    else if(id==='kite'){ c.multiplyScalar(0.94+0.06*Math.sin(y*80)); }   // (the chevron and the spine are raised bars below)
    else { if(Math.abs(x)<0.03) c.set(T); if(Math.abs(y)>S.h/2-0.05) c.set(Cd); c.multiplyScalar(0.92+0.08*Math.sin(x*140)); } }));
  if(id==='round'){   // the buckler: a domed face of six wooden planks (a ring grid, so the planks and the grain show), an iron rim band with rivets, a domed boss with a spike and a ring of rivets round it
    const R=S.w/2-0.003;
    const rings=new THREE.RingGeometry(0.001,R,sg(28),6); const rp=rings.attributes.position; for(let i=0;i<rp.count;i++){ const r=Math.hypot(rp.getX(i),rp.getY(i))/R; rp.setZ(i,0.021+0.022*(1-r*r)); }
    smoothN(rings); parts.push(pc(rings,(x,y,z,c)=>{ const pl=Math.floor((x+R)/(2*R)*6); c.set(C).multiplyScalar((pl%2?0.88:1.0)*(0.92+0.08*Math.sin(y*260+pl*1.7))); if(Math.abs(((x+R)/(2*R)*6)%1)<0.06) c.multiplyScalar(0.6); if(Math.hypot(x,y)>R-0.02) c.set(T).multiplyScalar(0.85); }));
    for(let i=0;i<12;i++){ const a=i/12*TAU; parts.push(solid(csph(0.0055,5,4).translate(Math.cos(a)*(R-0.01),Math.sin(a)*(R-0.01),0.024),Tl)); }
    parts.push(pc(csph(0.04,sg(12),sg(8)).scale(1,1,0.6).translate(0,0,0.042),(x,y,z,c)=>{ c.set(T).multiplyScalar(0.8+0.35*Math.max(0,z-0.045)*40); }),solid(new THREE.ConeGeometry(0.01,0.03,sg(6)).rotateX(Math.PI/2).translate(0,0,0.078),Tl));
    for(let i=0;i<8;i++){ const a=i/8*TAU; parts.push(solid(csph(0.0045,5,4).translate(Math.cos(a)*0.05,Math.sin(a)*0.05,0.04),Tl)); } }
  if(id==='heater'){   // the heater: a raised cross with bevelled edges, a ring of rim rivets, a quatrefoil boss on the crossing and a stud in each quarter
    const hw=S.w/2, hh=S.h/2, cy=0.03, bar=(w,h,x,y)=>pc(vbox(w,h,0.008,x,y,0.024),(px,py,pz,c)=>{ c.set(T); if(pz<0.027) c.multiplyScalar(0.72); else if(Math.abs(px-x)>w/2-0.004||Math.abs(py-y)>h/2-0.004) c.multiplyScalar(0.85); });
    parts.push(bar(0.036,hh-cy-0.016,0,(hh+cy)/2-0.008), bar(0.036,cy+hh-0.05,0,(cy-hh)/2+0.025), bar(hw-0.04,0.036,-(hw-0.04)/2-0.018,cy), bar(hw-0.04,0.036,(hw-0.04)/2+0.018,cy));
    for(let i=0;i<4;i++){ const a=i/4*TAU+Math.PI/4; parts.push(solid(csph(0.014,sg(8),sg(6)).scale(1,1,0.5).translate(Math.cos(a)*0.016,cy+Math.sin(a)*0.016,0.03),T)); }
    for(const [x,y] of [[-0.065,0.095],[0.065,0.095],[-0.06,-0.04],[0.06,-0.04]]) parts.push(solid(csph(0.008,sg(6),sg(5)).scale(1,1,0.6).translate(x,y,0.022),Tl));
    for(const x of [-0.11,-0.055,0.055,0.11]) parts.push(solid(csph(0.0055,5,4).translate(x,hh-0.014,0.021),Tl));
    for(const sd of [-1,1]) for(const t of [0.35,0.65]){ const y=hh*0.1-t*hh*1.0, x=sd*(hw-0.012-t*t*0.04); parts.push(solid(csph(0.0055,5,4).translate(x,y,0.021),Tl)); } }
  // the boss and, on the tall ones, a row of rivets down the middle band
  if(id==='heater'||id==='tower') parts.push(solid(csph(0.026,sg(12),sg(8)).scale(1,1,0.55).translate(0,id==='heater'?0.03:0,id==='heater'?0.036:0.022),T));
  if(id==='tower') for(const y of [-0.17,-0.1,0.1,0.17]) parts.push(solid(csph(0.008,sg(6),sg(5)).translate(0,y,0.021),Tl));
  if(id==='kite'){   // the kite: a raised chevron and a raised spine (bars, not paint), a boss where they meet, rivets down the rim
    const hh=S.h/2, bar=(w,h,x,y,rz)=>pc(vbox(w,h,0.007,0,0,0).rotateZ(rz).translate(x,y,0.023),(px,py,pz,c)=>{ c.set(T); if(pz<0.025) c.multiplyScalar(0.72); });
    parts.push(bar(0.022,hh*1.55,0,-0.02,0)); const ang=Math.atan2(S.h*0.9,S.w); for(const sd of [-1,1]) parts.push(bar(0.022,0.13,sd*0.045,0.04-0.045*Math.tan(ang),sd*(Math.PI/2-ang)));
    parts.push(solid(csph(0.022,sg(10),sg(8)).scale(1,1,0.55).translate(0,0.04,0.028),T),solid(csph(0.008,6,5).translate(0,0.04,0.04),Tl));
    for(const q of shieldOutline(id,-0.017).getSpacedPoints(20).slice(0,20)) parts.push(solid(csph(0.005,5,4).translate(q.x,q.y,0.021),Tl)); }
  // faces outward (-x), a hand's width down the forearm, tilted back a little so it clears the hip
  const lf=!!rig.left, g=merge(parts).rotateY(lf?Math.PI/2:-Math.PI/2).translate(lf?0.056:-0.056,-0.12,0);   // (left-handed: the weak hand is the right one)
  const m=new THREE.Mesh(g,cosCapeMat); m.castShadow=false; (lf?rig.elR:rig.elL).add(m);
}
