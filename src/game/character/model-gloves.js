//@ Gloves (version 3.1): six base gloves and the glove slot of the signature outfits: the hand's paint, fatter fingers or a mitten, and the cuff (geometry on the forearm)
/* look.gloves is 'none', a base glove (GL_BASE) or the id of a signature outfit that has a glove item (CHAR_MODELS.<id>.items.glove: ofPieces / OF_FIELD.glove); look.gloveColor is the base glove's colour,
   look.tintGloves recolours an outfit's glove (outfit-tools.js). buildCharacter sets X.glove = glPlan(X) before the arms are built; buildArm (model-body.js) paints the forearm below plan.start and the fingers
   through the plan, and hangs the cuff geometry in the elbow's frame (y down the forearm, the wrist at -D.wrist = -0.25).
   A kit with a glove item supplies: `glove(sd)` (cuffs, plates, wraps: geometry in the elbow's frame), `handPaint(c,x,y,z,sd)` (the colours of the covered forearm, palm and fingers),
   optionally `gloveStart` (metres down the forearm where the covering begins, default 0.2), `gloveFingers` ('full' | 'tips' | 'bare' | 'mitt', default 'full') and `main.glove` (the recolour anchor).
   Palm side: the palm faces the thigh (x = -sd), the back of the hand is x = +sd, the thumb is toward -z.
   owns: GL_BASE, glPlan, glBaseGeos, glRadius.   used by: model-body.js (buildArm, buildFingers), model.js, the editor's Gloves tab.   test: tools/cosmetic-items-smoke.js */
// [name, where the cover begins (m down the forearm), fingers: full | tips (bare from the second joint) | bare | mitt, a short line]
const GL_BASE={
  leather:{name:'Work gloves',start:0.2,fingers:'full',text:'Stitched leather with a turned-back cuff.'},
  fingerless:{name:'Fingerless gloves',start:0.215,fingers:'tips',text:'A wrist band and a knuckle cover, fingertips free.'},
  gauntlet:{name:'Gauntlets',start:0.1,fingers:'full',text:'A long flared cuff with steel bands and a knuckle plate.'},
  mitten:{name:'Mittens',start:0.2,fingers:'mitt',text:'Thick and warm, a cuff and a thumb.'},
  opera:{name:'Long gloves',start:0.03,fingers:'full',text:'Cloth to the elbow with a frilled top.'},
  wraps:{name:'Hand wraps',start:0.165,fingers:'bare',text:'Bound strips of cloth over the wrist and palm.'},
  // the crafted gloves (shared/cospieces.js 'g:'): lace, fur mitts and studded leather
  lace:{name:'Lace Gloves',start:0.19,fingers:'tips',text:'Fine open lace to the wrist with a small bow.',crafted:true},
  furmitts:{name:'Fur Mitts',start:0.16,fingers:'mitt',text:'Deep fur mitts with a stitched hide palm.',crafted:true},
  studded:{name:'Studded Gloves',start:0.2,fingers:'full',text:'Black leather with brass studs along the knuckles.',crafted:true}
};
const glBase=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(GL_BASE,id)?GL_BASE[id]:null;
const GL_STEEL=0xb9bdc2, GL_SKIN_Y=-0.285;   // below this the fingertips of a 'tips' glove are bare
// the forearm's radius at d metres below the elbow (the limb profile of buildArm: ER at the elbow, 0.0235 aw before the wrist, 0.02 aw at it)
function glRadius(D,d){ const aw=D.aw, f=D.fore; return profR([[D.ER,0],[0.037*aw,0.1*f],[0.0305*aw,0.34*f],[0.0235*aw,(0.82-0.12)*f],[0.02*aw,D.wrist],[0.02*aw,1]],Math.min(d,D.wrist)); }
// the plan of the gloves of a look, or null for bare hands: {kit, base, start, fingers, paint(c,x,y,z,sd), finger(c,x,y,z,sd)}
function glPlan(X){
  const L=X.L, kit=X.kit&&X.kit.sl.glove;
  if(kit){
    const f=X.kit.tr.glove, hp=kit.handPaint||((c)=>c.set(0x8a8a8a));
    const paint=(c,x,y,z,sd)=>{ hp(c,x,y,z,sd); if(f) f(c); };
    return {kit,base:null,start:kit.gloveStart!==undefined?kit.gloveStart:0.2,fingers:kit.gloveFingers||'full',paint,finger:paint};
  }
  const b=glBase(L.gloves); if(!b) return null;
  const col=new THREE.Color(Number.isFinite(L.gloveColor)?L.gloveColor:GLOVEC[0]), dark=col.clone().multiplyScalar(0.78), light=col.clone().lerp(new THREE.Color(0xffffff),0.35), id=L.gloves, st=b.start;
  const paint=(c,x,y,z,sd)=>{ const d=-y; c.copy(col);
    if(id==='lace'){ const k=((Math.floor(z*80)+Math.floor(d*80))&1); c.copy(col).multiplyScalar(k?1:0.8); if(d<st+0.025) c.copy(light); return; }
    if(id==='furmitts'){ c.copy(col).multiplyScalar(0.86+0.2*h3(Math.round(x*150),Math.round(y*150),Math.round(z*150))); if(x*sd<0&&d>0.2) c.set(0x6a4a30); if(d<st+0.03) c.copy(light); return; }
    if(id==='studded'&&d>0.25&&d<0.27) c.multiplyScalar(0.7);
    if(id==='wraps'){ const k=((d*58)%1+1)%1; if(k<0.2) c.copy(dark); else if(k>0.9) c.copy(light); return; }
    if(id==='gauntlet'&&d<0.235){ const k=((d*20)%1+1)%1; if(k<0.2||(d>st&&d<st+0.03)) c.set(GL_STEEL).multiplyScalar(0.92); else c.multiplyScalar(0.9); }
    if(id==='opera'&&d<st+0.045) c.copy(light);
    else if(d<st+0.04) c.copy(dark);   // the cuff band
    if(id==='fingerless'&&d>0.255&&d<0.275) c.copy(dark);   // the knuckle strap
    if(id==='leather'&&d>0.255&&d<0.268) c.copy(dark);
    if(id==='mitten'&&d>0.265){ const k=((z*60)%1+1)%1; if(k<0.12) c.copy(dark); } };
  const finger=(c,x,y,z,sd)=>{ if(b.fingers==='tips'&&y<GL_SKIN_Y) c.copy(X.skin); else if(b.fingers==='bare'&&y<-0.262) c.copy(X.skin); else paint(c,x,y,z,sd); };
  return {kit:null,base:id,start:st,fingers:b.fingers,paint,finger};
}
// the cuff and trimmings of a base glove, in the elbow's frame (a list of painted geometries)
function glBaseGeos(X,D,sd,gp){
  const {sg}=X, aw=D.aw, hh=X.S.hands, id=gp.base, col=new THREE.Color(Number.isFinite(X.L.gloveColor)?X.L.gloveColor:GLOVEC[0]), out=[];
  const tube=(d0,d1,flare,paintF,n)=>{ const rings=[], k=n||4; for(let i=0;i<=k;i++){ const t=i/k, d=d0+(d1-d0)*t; rings.push({y:-d,rx:glRadius(D,d)+0.0035+flare*t*t,rz:glRadius(D,d)+0.0035+flare*t*t}); }
    return pc(ofLoft(rings,sg(22),0,TAU),paintF); };
  const band=(d,r,hex)=>solid(gmRingAt([0,-d,0],[0,1,0],glRadius(D,d)+0.0035+r,r,sg(6)),hex);
  const dk=col.clone().multiplyScalar(0.78).getHex(), lt=col.clone().lerp(new THREE.Color(0xffffff),0.35).getHex();
  if(id==='leather'){
    const s=gp.start; out.push(tube(s,s+0.05,0.009,(x,y,z,c)=>{ c.copy(col).multiplyScalar(y<-s-0.043?0.7:0.88); }),band(s+0.05,0.0035,dk),band(s+0.012,0.0025,lt));
  } else if(id==='fingerless'){
    const s=gp.start; out.push(tube(s,s+0.035,0.004,(x,y,z,c)=>c.copy(col).multiplyScalar(0.8)),band(s+0.035,0.003,lt));
  } else if(id==='gauntlet'){
    const s=gp.start; out.push(tube(s,0.235,0.022,(x,y,z,c)=>{ const k=((-y*20)%1+1)%1; if(k<0.2) c.set(GL_STEEL); else c.copy(col).multiplyScalar(0.92); },6),band(s,0.0045,GL_STEEL),band(0.235,0.005,GL_STEEL),band(s+0.07,0.0035,GL_STEEL));
    for(const z of [-0.016,0,0.016]) out.push(solid(csph(0.004,5,4).translate(sd*(glRadius(D,s+0.035)+0.016),-s-0.035,z*aw),0xd8dce0));
    out.push(pc(vbox(0.006,0.034,0.05*hh,sd*(0.0125*hh+0.003),-0.272,-0.002),(x,y,z,c)=>c.set(GL_STEEL).multiplyScalar(0.9+0.2*Math.abs(z)*8)));   // the knuckle plate on the back of the hand
  } else if(id==='mitten'){
    const s=gp.start; out.push(tube(s,s+0.05,0.01,(x,y,z,c)=>c.copy(col).multiplyScalar(y<-s-0.043?0.7:0.85)),band(s+0.05,0.004,lt));
  } else if(id==='opera'){
    const s=gp.start; out.push(tube(s,0.235,0.0,(x,y,z,c)=>{ c.copy(col); if(-y<s+0.05) c.lerp(new THREE.Color(0xffffff),0.35); },8));
    for(let i=0;i<8;i++){ const a=i/8*TAU; out.push(solid(csph(0.0065,5,4).translate(Math.sin(a)*(glRadius(D,s)+0.012),-s+0.003,Math.cos(a)*(glRadius(D,s)+0.012)),lt)); }   // the frill: a ring of beads at the top
    out.push(band(s,0.0035,lt),band(0.235,0.003,dk));
  } else if(id==='lace'){
    const s=gp.start; out.push(tube(s,s+0.04,0.003,(x,y,z,c)=>c.set(lt).multiplyScalar(0.94)),band(s+0.04,0.0028,lt));
    for(let i=0;i<10;i++){ const a=i/10*TAU; out.push(solid(csph(0.0045,5,4).translate(Math.sin(a)*(glRadius(D,s+0.04)+0.007),-s-0.044,Math.cos(a)*(glRadius(D,s+0.04)+0.007)),0xffffff)); }   // the scalloped edge
    out.push(solid(csph(0.008,6,5).scale(1.2,0.8,0.8).translate(sd*(glRadius(D,s)+0.01),-s-0.01,0),dk),solid(ofRibbon([[sd*(glRadius(D,s)+0.012),-s-0.01,0],[sd*(glRadius(D,s)+0.02),-s-0.035,0.014],[sd*(glRadius(D,s)+0.02),-s-0.06,0.012]],0.012,{up:[sd,0,0],seg:6,th:0.003}),dk),solid(ofRibbon([[sd*(glRadius(D,s)+0.012),-s-0.01,0],[sd*(glRadius(D,s)+0.02),-s-0.035,-0.014],[sd*(glRadius(D,s)+0.02),-s-0.06,-0.012]],0.012,{up:[sd,0,0],seg:6,th:0.003}),dk));   // a small bow on the back of the wrist
  } else if(id==='furmitts'){
    const s=gp.start; for(let r=0;r<2;r++) for(let i=0;i<12;i++){ const a=i/12*TAU+r*0.26, d=s+0.012+r*0.02; out.push(solid(csph(0.0105,5,4).translate(Math.sin(a)*(glRadius(D,d)+0.011),-d,Math.cos(a)*(glRadius(D,d)+0.011)),r?0xf0e8d8:0xdcd2c0)); }   // the fur cuff
    out.push(band(s+0.05,0.0035,dk));
  } else if(id==='studded'){
    const s=gp.start; out.push(tube(s,s+0.05,0.008,(x,y,z,c)=>c.copy(col).multiplyScalar(y<-s-0.043?0.7:0.88)),band(s+0.05,0.0035,dk));
    for(let i=0;i<8;i++){ const a=i/8*TAU, r=glRadius(D,s+0.025)+0.012; out.push(solid(csph(0.0034,5,4).translate(Math.sin(a)*r,-s-0.025,Math.cos(a)*r),0xc9a13a)); }
    for(const z of [-0.018,-0.006,0.006,0.018]) out.push(solid(csph(0.004,5,4).translate(sd*(0.0125*hh+0.007),-0.268,z*hh),0xc9a13a));   // studs on the knuckles
  } else if(id==='wraps'){
    const s=gp.start; for(let i=0;i<5;i++){ const d=s+0.012+i*0.012; out.push(solid(gmRingAt([0,-d,0],[0.05*(i%2?1:-1),1,0],glRadius(D,d)+0.0035,0.0034,sg(6)),i%2?lt:col.getHex())); }
    out.push(pc(ofRibbon([[sd*0.01,-0.23,glRadius(D,0.23)+0.004],[sd*0.02,-0.27,glRadius(D,0.23)+0.012],[sd*0.03,-0.31,glRadius(D,0.23)+0.016]],0.012,{up:[sd,0,0],seg:sg(6),th:0.003}),(x,y,z,c)=>c.copy(col).multiplyScalar(0.9)));   // the loose end
  }
  return out;
}
/* ---- the glove item of a signature outfit: a spec G = {start, col, col2, trim, len, flare, fingers, studs, ring} (colours are hex numbers; start = metres down the forearm where the covering begins, default 0.19;
   len = the cuff's length up from the wrist, flare = how much it opens at the top, studs = rivets along the cuff, ring = a band round the second finger's base). A kit returns
   {gloveStart: G.start, gloveFingers: G.fingers, glove: sd=>glKitGlove(X,D,sd,G), handPaint: glKitPaint(G), main:{glove: G.col}} (docs/CHARACTER.md section 9, "Gloves"). ---- */
function glKitPaint(G){
  const start=G.start!==undefined?G.start:0.19, A=new THREE.Color(G.col), B=new THREE.Color(G.col2!==undefined?G.col2:G.col), T=new THREE.Color(G.trim!==undefined?G.trim:G.col);
  return (c,x,y,z,sd)=>{ const d=-y; c.copy(d<0.25?B:A);
    if(d>0.25&&d<0.268) c.lerp(T,0.7);   // the knuckle line
    if(d<start+0.012) c.copy(T); };
}
function glKitGlove(X,D,sd,G){
  const {sg}=X, len=G.len!==undefined?G.len:0.09, fl=G.flare!==undefined?G.flare:0.012, d1=0.245, d0=d1-len, out=[], col=new THREE.Color(G.col2!==undefined?G.col2:G.col), trim=G.trim!==undefined?G.trim:G.col, rings=[], n=4;
  for(let i=0;i<=n;i++){ const t=i/n, d=d0+(d1-d0)*t, r=glRadius(D,d)+0.0035+fl*Math.pow(1-t,1.6); rings.push({y:-d,rx:r,rz:r}); }
  out.push(pc(ofLoft(rings,sg(20),0,TAU),(x,y,z,c)=>{ c.copy(col); const t=(-y-d0)/(d1-d0); if(t<0.14) c.set(trim); }));
  out.push(solid(gmRingAt([0,-d0,0],[0,1,0],glRadius(D,d0)+0.0035+fl,0.0042,sg(7)),trim),solid(gmRingAt([0,-d1,0],[0,1,0],glRadius(D,d1)+0.0035,0.0034,sg(6)),trim));
  if(G.studs) for(let i=0;i<6;i++){ const a=i/6*TAU; out.push(solid(csph(0.0045,5,4).translate(Math.sin(a)*(glRadius(D,d0+len*0.5)+0.0055+fl*0.3),-(d0+len*0.5),Math.cos(a)*(glRadius(D,d0+len*0.5)+0.0055+fl*0.3)),trim)); }
  if(G.ring!==undefined) out.push(solid(gmRingAt([-sd*0.003*X.S.hands,-0.292,-0.0065*X.S.hands],[0,-1,0],0.0085*X.S.hands,0.0022,5),G.ring));
  return out;
}
