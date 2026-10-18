//@ The hiker's body: chest, neck, shoulders and hips as one surface; arms and legs whose joints continue each other; hands with fingers; shaped feet
/* ---------- body (design units: metres at height 1; torso heights are "design y" and are scaled by TK, the torso-length factor) ----------
   Why it does not look like building blocks: (1) the neck, the shoulder slope, the collarbones and the hip sockets are part of the torso's own surface;
   (2) every joint is a ball (see `limb` in model-parts.js) and the limb on the other side of it starts with the SAME cross-section (ELBOW / KNEE below), so
   bending shows a round joint and never a step; (3) the hand is the end of the forearm (the palm flattens out of the wrist) and the shin runs into a lofted foot. */
// what shows where a garment is taken off (the editor's None tile): a man's chest is bare, a woman wears a band top; both wear briefs (cream, a darker waistband)
const UNDER_COL=0xe9e3d6, UNDER_BAND=0xb8b2a4;
function clothPaints(L){
  const topPaint=(c,u,v)=>{
    if(L.top==='none'){ if(L.sex==='female'&&v>0.265&&v<0.375) c.set(v>0.36||v<0.28?UNDER_BAND:UNDER_COL); else c.set(L.skin); }
    else if(L.top==='flannel') plaid(c,L.topColor,u,v);
    else if(L.top==='vest') c.set(0xe8e4dc);   // (the waistcoat is geometry over a cream shirt: model-garments.js)
    else if(L.top==='mail'){ c.set(L.topColor).multiplyScalar(0.72+0.38*((Math.floor(u*70)+Math.floor(v*70))&1)); }
    else if(L.top==='plate'){ c.set(L.topColor).multiplyScalar(0.82+0.3*(Math.floor(v*13)&1)); }
    else c.set(L.topColor);
  };
  const botPaint=(c,u,v)=>{
    if(L.bottom==='none'){ if(v<0.045) c.set(v>0.025?UNDER_BAND:UNDER_COL); else c.set(L.skin); return; }
    c.set(L.bottomColor);
    if(L.bottomStyle==='mail') c.multiplyScalar(0.72+0.38*((Math.floor((u||0)*70)+Math.floor((v||0)*70))&1));
    else if(L.bottomStyle==='plate') c.multiplyScalar(0.82+0.3*(Math.floor((v||0)*11)&1));
  };
  return {topPaint,botPaint};
}
// the measurements every part shares (also handed to outfits as rig.dims)
function charDims(L,S,fem,fs){
  const B=S.build, lr=Math.pow(B,0.9), TK=0.93*S.torso, hs=(fem?1.37:1.4)*S.head, thigh=0.46*S.legs, shin=0.44*S.legs, ankleH=0.06*(0.6+0.4*S.feet), neckR=(fem?0.04:0.05)*S.neck;
  const D={fem,B,lr,TK,hs,thigh,shin,ankleH,neckR,hipY:thigh+shin+ankleH,
    headY:0.555*TK+0.042*S.neck+0.1*fs[1]*hs,       // the head's centre above the hips: the chin sits just above the shoulders
    shX:(fem?0.138:0.156)*B*S.shoulders,            // shoulder joint, off the middle
    shY:0.45*TK,                                    // and its height above the hips
    hx:(fem?0.08:0.078)*B*(1+(S.hips-1)*0.6),      // hip joint, off the middle
    aw:(fem?0.9:1.08)*lr*S.arms, tw:(fem?1.02:1.0)*lr*S.thighs, cw:(fem?0.96:1.04)*lr*S.calves, upper:0.28, fore:0.305, wrist:0.25};
  D.ER=0.034*D.aw; D.KR=0.05*lr;                   // the elbow's and the knee's radius: both sides of the joint use it
  return D;
}
function profR(prof,y){ for(let i=1;i<prof.length;i++) if(y<=prof[i][1]){ const a=prof[i-1], b=prof[i], f=(y-a[1])/((b[1]-a[1])||1); return lerp(a[0],b[0],f); } return prof[prof.length-1][0]; }

// the torso's lathe profile [radius, design y] for a man and a woman: top-level so an outfit can ask how big the torso is at a height (torsoSize)
const TORSO_F=[[0.001,-0.115],[0.116,-0.1],[0.158,-0.05],[0.166,0.0],[0.15,0.07],[0.116,0.17],[0.104,0.22],[0.116,0.3],[0.132,0.37],[0.138,0.43],[0.124,0.482],[0.082,0.524],[0.062,0.55]];
const TORSO_M=[[0.001,-0.115],[0.112,-0.1],[0.152,-0.05],[0.16,0.0],[0.142,0.08],[0.124,0.15],[0.136,0.23],[0.156,0.31],[0.17,0.38],[0.17,0.43],[0.148,0.478],[0.098,0.522],[0.07,0.55]];
function buildTorso(X,D){
  const {L,S,fem,sg,skin,skinPaint,topPaint,botPaint}=X, {B,lr,TK,neckR}=D, ch=S.chest, G=faceG, sm=faceSm, kT=X.kit&&X.kit.sl.top, kB=X.kit&&X.kit.sl.bottom;   // kT / kB: the signature outfits' top and bottoms, when worn
  const base=fem?TORSO_F:TORSO_M;
  const hem=(L.top==='jacket'||L.top==='hoodie'||L.top==='mail'||L.top==='plate')?-0.035:0.03;
  const nt=Math.max(0.7,(D.headY-0.03)/TK), prof0=base.concat([[neckR*1.3,0.572],[neckR*1.06,0.6],[neckR,0.635],[neckR*0.98,nt]]);   // the neck is the top of the same surface
  // rings exactly at the colour edges (the hem, the belt line, the plate band) so those edges are crisp
  // the colour edges: a whole outfit has its own; mixed, the top's lie above the waist and the bottoms' below it (a base garment's are the original list)
  const kc=k=>(k.cuts&&k.cuts.torso)||[], cutList=kT&&kT===kB?kc(kT):[hem].concat(kT?kc(kT).filter(y=>y>hem):[hem+0.03,0.07],kB?kc(kB).filter(y=>y<=hem):[hem-0.035,0.02]);
  const cuts=(kT||kB?cutList:[hem,hem-0.035,hem+0.03,0.02,0.07].concat(L.top==='none'&&fem?[0.265,0.28,0.36,0.375]:[]).concat(L.bottom==='none'?[0.025,0.045]:[])).filter(y=>y>-0.1&&y<0.5).sort((a,b)=>a-b), prof=[]; for(const pt of prof0){ while(cuts.length&&cuts[0]<pt[1]-0.001){ const y=cuts.shift(); prof.push([profR(prof0,y-0.0005),y-0.0005],[profR(prof0,y+0.0005),y+0.0005]); } prof.push(pt); }
  const tg=new THREE.LatheGeometry(densify(prof,fem?4:3).map(p=>new THREE.Vector2(p[0],p[1])),sg(fem?60:52)), p=tg.attributes.position, wy=fem?0.215:0.15;
  for(let i=0;i<p.count;i++){
    const y=p.getY(i), x0=p.getX(i), z0=p.getZ(i), belly=G(y,0.1,0.13)*(B-1)*1.4, sN=sm(0.5,0.6,y), front=z0<0;
    // wider than deep; above the shoulders the section turns into the neck's own (a little wider than deep, leaning forward)
    let x=x0*lerp(B*(fem?1:1.04),1.1,sN), z=z0*lerp((fem?0.66:0.62)*B,0.94,sN)*(1+(front?belly:belly*0.3)*(1-sN));
    const gw=G(y,wy,0.11), gh=G(y,-0.03,0.1), up=sm(0.22,0.4,y)*(1-sN);
    x*=1+(S.shoulders-1)*up+(S.waist-1)*gw+(S.hips-1)*gh;
    z*=1+(S.waist-1)*0.7*gw+(S.hips-1)*0.5*gh+(S.shoulders-1)*0.2*up;
    const ax=Math.abs(x);
    if(front){
      if(!fem) z+=0.012*B*G(y,0.33,0.1)*(1-0.4*G(ax,0,0.12))-0.003*B*(0.5+0.5*ch)*G(y,0.37,0.05)*G(ax,0.07*B,0.07);   // a man's chest: a flat, broad plane (the ribcage flattened by 1.2 cm) with only a hint of pec; a rounded bump read as a bust
      z-=0.008*G(y,0.1,0.08)*(1-G(ax,0,0.04))*(fem?0.5:1);              // stomach, a little rounded
      if(fem){
        // bust: part of the torso surface, not two balls. Each side slopes gently down from the collarbone, is fullest low and tucks in underneath;
        // the two join softly in the middle. A larger chest (ch) is deeper, a little wider and sits a little lower.
        const cy=0.315-0.012*(ch-1), wx=0.05*(0.86+0.14*ch), wl=0.036*(0.8+0.2*ch);
        const lobe=sd=>{ const dx=x-sd*0.056*B, dy=y-cy; return Math.exp(-Math.pow(dx/wx,2))*Math.exp(-Math.pow(dy/(dy>0?0.075:wl),2)); };
        const a=lobe(-1), b=lobe(1); z-=0.034*lr*ch*(1-(1-a)*(1-b));
      }
    } else {
      z+=0.012*B*G(y,0.37,0.07)*G(ax,0.075*B,0.045);                    // shoulder blades
      z+=(fem?0.034:0.022)*B*G(y,0.0,0.055)*G(ax,0.066*B,0.05);         // glutes
      z-=0.008*G(ax,0,0.018)*G(y,0.2,0.18);                             // the groove of the spine
    }
    z-=sN*(y-0.5)*0.1; p.setXYZ(i,x,y*TK,z);
  }
  smoothN(tg);
  const skinY=kT&&kT.skinFrom!==undefined?kT.skinFrom:0.555;   // an outfit top with a high collar paints the neck itself (skinFrom)
  const tp=(x,y,z,c)=>{ const yd=y/TK;   // one paint for every piece of the torso: neck skin, top, belt line, bottoms (each of the top and the bottoms is a base garment or an outfit's item)
    if(yd>skinY+0.02*sm(-0.04,0.04,z)) skinPaint(c);   // the neckline: lower in front, higher behind, blended
    else if(yd>hem){ if(kT) ofPaint(X,'top','torso',c,x,yd,z,0); else topPaint(c,x,yd); }
    else if(kB) ofPaint(X,'bottom','torso',c,x,yd,z,0);
    else if(yd>hem-0.035 && L.bottom!=='skirt' && L.bottom!=='kilt' && L.bottom!=='pleated' && L.bottom!=='none' && hem>0) c.set(0x3a2a1c);
    else botPaint(c,x,yd);
    if(!kT&&(L.top==='jacket'||L.top==='hoodie'||L.top==='mail') && yd<hem+0.03 && yd>hem) c.multiplyScalar(0.8);
    if(!kT&&L.top==='plate' && yd>0.02 && yd<0.07) c.set(0x3a2a1c); };
  const parts=[pc(tg,tp)];
  if(!fem) parts.push(pc(csph(0.0085,8,6).scale(1.1,1.5,0.7).translate(0,0.6*TK,-neckR*1.0-0.006),skinPaint));   // Adam's apple
  // collarbones: a tube from the neck that runs into the arm's own ball joint (a little slimmer than it, so it meets the ball in a clean crease, not a coincident surface)
  for(const sd of [-1,1]) parts.push(pc(sweepTubeR([{x:sd*neckR*0.8,y:0.538*TK,z:0.002,r:0.032},{x:sd*D.shX*0.45,y:0.512*TK,z:0.0,r:0.036},{x:sd*D.shX*0.9,y:D.shY+0.012*TK,z:0.0,r:0.04*D.aw}],sg(10),{cap:'none',rings:sg(8)}),tp));
  if(L.top==='jacket'){
    parts.push(pc(new THREE.CylinderGeometry(neckR*1.55,neckR*2.05,0.06,sg(20),1,true).scale(B,1,B*0.8).translate(0,0.578*TK,0),(x,y,z,c)=>{ c.set(L.topColor).multiplyScalar(0.8); }));
    const Z=[]; for(let y=0.45;y>=-0.01;y-=0.06) Z.push([0,y*TK,-profR(base,y)*(fem?0.66:0.62)*B-0.002]);
    parts.push(solid(sweepTube(Z,Z.map(()=>0.0045),5,{cap:'round',rings:Z.length*2}),0x2a2a2a));
  }
  if(L.top==='hoodie'){
    parts.push(pc(csph(0.1,sg(14),sg(10)).scale(1.15*B,0.7,0.95).translate(0,0.565*TK,0.062*B),(x,y,z,c)=>{ c.set(L.topColor).multiplyScalar(0.88); }));
    parts.push(pc(new THREE.BoxGeometry(0.19*B,0.09,0.02).translate(0,0.1*TK,-profR(base,0.1)*(fem?0.66:0.62)*B-0.006),(x,y,z,c)=>{ c.set(L.topColor).multiplyScalar(0.85); }));
    for(const sd of [-1,1]) parts.push(solid(new THREE.BoxGeometry(0.006,0.11,0.006).translate(sd*0.03,0.44*TK,-profR(base,0.44)*(fem?0.66:0.62)*B-0.004),0xe8e4dc));
  }
  if(!kT) parts.push(...gmTop(X,D));   // a base garment's collar, pockets, buttons (model-garments.js)
  if(X.kit) parts.push(...ofRun(X,'torso'));   // an outfit's extra pieces on the torso (collars, tabards, belts, sashes), in the spine's frame
  if(L.pack){
    const bz=0.1*B+0.08;
    parts.push(pc(new THREE.BoxGeometry(0.3,0.42,0.15).translate(0,0.28*TK,bz),c=>c.set(0x566437)));
    parts.push(pc(new THREE.BoxGeometry(0.22,0.14,0.05).translate(0,0.17*TK,bz+0.095),c=>c.set(0x4a5630)));
    parts.push(pc(new THREE.CylinderGeometry(0.065,0.065,0.36,12).rotateZ(Math.PI/2).translate(0,0.5*TK,bz),c=>c.set(0x8a3b2c)));
    for(const sd of [-1,1]) parts.push(pc(new THREE.BoxGeometry(0.035,0.34,0.012).translate(sd*0.085*B,0.33*TK,-profR(base,0.33)*(fem?0.66:0.62)*B-0.004-(fem?0.012:0)),c=>c.set(0x3b4228)));
  }
  return parts;
}

// a hand's fingers and thumb, as tubes that curl a little toward the palm (the palm faces the thigh)
function buildFingers(X,D,sd){
  const {S,sg,skinPaint}=X, hh=S.hands, out=[], f=[[-0.019,0.95],[-0.0065,1],[0.0065,0.93],[0.018,0.76]], gp=X.glove, fat=gp&&gp.fingers!=='bare'?1.17:1;   // (a glove: fatter fingers, painted by the plan; a mitten: one fat blob and a thumb)
  const fp=gp?(x,y,z,c)=>gp.finger(c,x,y,z,sd):skinPaint, mitt=gp&&gp.fingers==='mitt';
  if(mitt) out.push(pc(csph(1,sg(10),sg(8)).scale(0.0145*hh,0.05*hh,0.0275*hh).translate(-sd*0.004*hh,-0.312,-0.001),fp,-0.28));
  else for(const [z0,k] of f){ const L=0.062*hh*k, y0=-0.272;
    out.push(pc(sweepTube([[0,y0,z0*hh],[-sd*0.003*hh,y0-L*0.45,z0*hh],[-sd*0.011*hh,y0-L*0.8,(z0-0.0008)*hh],[-sd*0.015*hh,y0-L,(z0-0.001)*hh]],[0.0072*hh*fat,0.0064*hh*fat,0.0052*hh*fat,0.004*hh*fat],sg(7),{cap:'round',rings:sg(10)}),fp,-0.28)); }
  out.push(pc(sweepTube([[-sd*0.008*hh,-0.255,-0.013*hh],[-sd*0.017*hh,-0.278,-0.024*hh],[-sd*0.02*hh,-0.298,-0.03*hh],[-sd*0.018*hh,-0.315,-0.032*hh]],[0.0105*hh*fat,0.0085*hh*fat,0.0068*hh*fat,0.0052*hh*fat],sg(7),{cap:'round',rings:sg(10)}),fp,-0.28));
  return out;
}
// the forearm's paint with the gloves laid over it below their start (y is the elbow's frame: y = -d down the forearm)
const gloveWrap=(gp,sd,f)=>gp?(x,y,z,c)=>{ f(x,y,z,c); if(-y>=gp.start) gp.paint(c,x,y,z,sd); }:f;
function buildArm(X,D,sd){
  const {L,S,fem,sg,skinPaint,topPaint,q}=X, kit=X.kit&&X.kit.sl.top, {aw,ER,upper,fore}=D, longSleeve=L.top!=='tshirt'&&L.top!=='none'&&L.top!=='vest', hh=S.hands;   // kit: the outfit's top (the sleeves are the top's)
  const sh=new THREE.Group(); sh.name=sd<0?'shL':'shR'; sh.position.set(sd*D.shX,D.shY,0); sh.rotation.z=sd*(0.1+(D.B-1)*0.35);
  // upper arm: the shoulder ball, the biceps in front, narrowing to the elbow
  const ua=pc(limb([[0,0.05*aw,0.052*aw],[0.13,0.0505*aw,0.053*aw],[0.38,0.045*aw,0.048*aw,-0.003],[0.7,0.037*aw,0.039*aw],[1,ER,ER*1.04]],upper,sg(24),sg(24),{cuts:[0.13/upper].concat((kit&&kit.cuts&&kit.cuts.upperArm)||[])}),kit?(x,y,z,c)=>ofPaint(X,'top','upperArm',c,x,y,z,sd):(x,y,z,c)=>{ if(longSleeve||y>-0.13) topPaint(c,x+sd*0.3,y); else skinPaint(c); });
  const m1=new THREE.Mesh(ua,matChar); m1.castShadow=true; sh.add(m1);
  if(X.kit){ const ex=ofRun(X,'shoulder',sd); if(ex.length){ const m=new THREE.Mesh(merge(ex),matChar); m.castShadow=true; sh.add(m); } }   // puffed sleeves, epaulets, in the shoulder joint's frame
  const el=new THREE.Group(); el.name=sd<0?'elL':'elR'; el.position.y=-upper; sh.add(el);
  // forearm and hand in one surface: thick below the elbow, slim at the wrist (t = 0.82), then the palm flattens out of it
  const wr=D.wrist/fore, ww=0.02*aw, pw=0.027*hh;
  const gp=X.glove, gcut=gp?[gp.start/fore]:[];   // gp: the gloves' plan (model-gloves.js): the forearm below gp.start is painted as glove
  const fa=pc(limb([[0,ER,ER*1.04],[0.1,0.037*aw,0.038*aw],[0.34,0.0305*aw,0.03*aw],[wr-0.12,0.0235*aw,0.0235*aw],[wr,ww,ww],[wr+0.08,0.0125*hh,pw*0.9],[1,0.0115*hh,pw]],fore,sg(20),sg(26),{cuts:[0.2/fore,0.225/fore].concat((kit&&kit.cuts&&kit.cuts.foreArm)||[],gcut)}),gloveWrap(gp,sd,kit?(x,y,z,c)=>ofPaint(X,'top','foreArm',c,x,y,z,sd):(x,y,z,c)=>{ if(longSleeve && y>-0.225){ topPaint(c,x+sd*0.3,y-upper); if(y<-0.2) c.multiplyScalar(0.8); } else skinPaint(c); }),-upper);
  const hand=q>=0.5?[fa].concat(buildFingers(X,D,sd)):[fa];
  const m2=new THREE.Mesh(hand.length>1?merge(hand):fa,matChar); m2.castShadow=true; el.add(m2);
  if(X.kit){ const ex=ofRun(X,'forearm',sd); if(ex.length){ const m=new THREE.Mesh(merge(ex),matChar); m.castShadow=true; el.add(m); } }   // cuffs, bracers, in the elbow's frame (y down the forearm)
  { const ex=gmCuff(X,D,sd); if(ex.length){ const m=new THREE.Mesh(merge(ex),matChar); m.castShadow=true; el.add(m); } }   // base cuffs (model-garments.js)
  if(gp){ const ex=gp.kit?ofRun(X,'glove',sd):glBaseGeos(X,D,sd,gp); if(ex.length){ const m=new THREE.Mesh(merge(ex),matChar); m.castShadow=true; el.add(m); } }   // cuffs, plates, wraps (model-gloves.js)
  return [sh,el];
}

// the shoe: a loft from the heel to the toe, whose ankle opening is where the shin comes down into it
function buildFoot(X,D,sd,boot){
  const {L,S,sg,skinPaint}=X, kit=X.kit&&X.kit.sl.shoes, sf=S.feet, wf=0.55+0.45*sf, hf=0.8+0.2*sf, A=D.ankleH;
  const st=[[0.056,0.004,0.004,0.02],[0.047,0.02,0.026,0.03],[0.026,0.029,0.04,0.04],[0.0,0.031,0.05,0.05],[-0.03,0.033,0.04,0.042],[-0.075,0.037,0.027,0.029],[-0.115,0.031,0.02,0.021],[-0.14,0.018,0.013,0.015],[-0.153,0.004,0.004,0.01]];
  const rings=[]; for(const s of st){ rings.push({y:s[0]*sf,rx:s[1]*wf,rz:s[2]*hf,zc:-(s[3]*hf-A)}); }
  const dense=[]; for(let i=0;i<rings.length-1;i++){ const k=Math.max(1,Math.round(sg(3))); for(let j=0;j<k;j++){ const f=j/k, a=rings[i], b=rings[i+1]; dense.push({y:lerp(a.y,b.y,f),rx:lerp(a.rx,b.rx,f),rz:lerp(a.rz,b.rz,f),zc:lerp(a.zc,b.zc,f)}); } } dense.push(rings[rings.length-1]);
  const g=loftRings(dense,sg(18)); g.rotateX(Math.PI/2); g.rotateY(-sd*0.1);
  const p=g.attributes.position; for(let i=0;i<p.count;i++) if(p.getY(i)<-A) p.setY(i,-A);   // a flat sole
  smoothN(g);
  const white=L.shoes!=='boots'&&L.shoes!=='tallboots';
  if(kit) return pc(g,(x,y,z,c)=>ofPaint(X,'shoes','foot',c,x,y,z,sd),-D.thigh-D.shin);
  if(L.shoes==='none'||L.shoes==='sandals') return pc(g,skinPaint,-D.thigh-D.shin);   // barefoot (the editor's None tile)
  return pc(g,(x,y,z,c)=>{ c.set(L.shoeColor); if(y<-A+0.011) c.set(white?0xf2efe8:0x221a14); else if(white&&z<-0.1) c.multiplyScalar(1.12); },-D.thigh-D.shin);
}
function buildLeg(X,D,sd){
  const {L,S,fem,sg,skinPaint,botPaint}=X, kB=X.kit&&X.kit.sl.bottom, kS=X.kit&&X.kit.sl.shoes, {tw,cw,thigh,shin,KR,hx,B,lr}=D, boot=kS?kS.boot!==false:(L.shoes==='boots'||L.shoes==='tallboots');   // kB / kS: the outfits' bottoms and shoes, when worn
  const hp=new THREE.Group(); hp.name=sd<0?'hipL':'hipR'; hp.position.set(sd*hx,0,0);
  // thigh: the hip ball, full quads in front, tapering to the knee (radius KR, shared with the shin below)
  const th=pc(limb([[0,0.088*tw,0.092*tw],[0.14,0.09*tw,0.094*tw],[0.42,0.077*tw,0.081*tw,-0.004],[0.76,Math.max(KR*1.1,0.057*tw),Math.max(KR*1.12,0.06*tw),-0.002],[1,KR,KR*1.04]],thigh,sg(24),sg(28),{cuts:[0.53,0.53-0.03/thigh].concat((kB&&kB.cuts&&kB.cuts.thigh)||[])}),kB?(x,y,z,c)=>ofPaint(X,'bottom','thigh',c,x,y,z,sd):(x,y,z,c)=>{
    if(L.bottom==='trousers'||(L.bottom==='shorts'&&y>-thigh*0.53)) botPaint(c,x,y); else if(L.bottom==='none'&&y>-thigh*0.16) c.set(y>-thigh*0.03?UNDER_BAND:UNDER_COL); else skinPaint(c);
    if(L.bottom==='shorts'&&y>-thigh*0.53&&y<-thigh*0.53+0.03) c.multiplyScalar(0.85); });
  const m1=new THREE.Mesh(th,matChar); m1.castShadow=true; hp.add(m1);
  if(X.kit){ const ex=ofRun(X,'thigh',sd); if(ex.length){ const m=new THREE.Mesh(merge(ex),matChar); m.castShadow=true; hp.add(m); } }   // breeches' flares, stripes' shells, in the hip's frame (y down the thigh)
  const kn=new THREE.Group(); kn.name=sd<0?'kneeL':'kneeR'; kn.position.y=-thigh; hp.add(kn);
  // lower leg: the calf bulges out behind a straight shin, down to a slim ankle; a boot is the same surface, wider and painted
  const bs=boot?[[0.5,0.041*cw,0.044*cw,0.007],[0.6,0.045*cw,0.048*cw,0.005],[0.66,0.042*cw,0.045*cw,0.005],[0.85,0.037*cw,0.039*cw],[1,0.033*cw,0.035*cw]]:[[0.5,0.04*cw,0.043*cw,0.007],[0.75,0.033*cw,0.035*cw],[1,0.028*cw,0.03*cw]];
  // the shin is the bottoms' down to where the boots begin (tb, a fraction of the shin) and the shoes' below it; a whole outfit paints all of it. Sampling the bottoms' paint no lower than its own boot top
  // keeps another outfit's boots from showing under it
  const tb=kS?ofBootTop(kS):(L.shoes==='boots'?0.6:L.shoes==='tallboots'?0.08:1.1), same=kB&&kB===kS, kcut=(k,low)=>((k&&k.cuts&&k.cuts.shin)||[]).filter(t=>(t<tb)===low);
  const sv=pc(limb([[0,KR,KR*1.04],[0.14,0.0505*cw,0.054*cw,0.005],[0.3,0.052*cw,0.057*cw,0.011]].concat(bs),shin,sg(24),sg(28),{cuts:[0.6].concat(same?(kB.cuts&&kB.cuts.shin)||[]:kcut(kB,true).concat(kcut(kS,false)))}),(x,y,z,c)=>{ const t=-y/shin;
    if(same) ofPaint(X,t<tb?'bottom':'shoes','shin',c,x,y,z,sd);
    else if(t<tb){ if(kB) ofPaint(X,'bottom','shin',c,x,-Math.min(t,ofBootTop(kB)-0.02)*shin,z,sd); else if(L.bottom==='trousers') botPaint(c,x,y); else skinPaint(c); }
    else if(kS) ofPaint(X,'shoes','shin',c,x,y,z,sd);
    else if(L.shoes==='none'||L.shoes==='sandals') skinPaint(c);
    else c.set(L.shoeColor); },-thigh);
  const parts=[sv];
  if(L.bottomStyle==='plate') parts.push(pc(csph(0.066*lr,sg(14),sg(10)).scale(1,0.9,0.8).translate(0,0,-0.03),c=>c.set(L.bottomColor).multiplyScalar(1.1)));   // a knee plate
  const foot=buildFoot(X,D,sd,boot); foot.translate(0,-shin,0); parts.push(foot);
  parts.push(...gmShin(X,D,sd));   // base trouser cuffs, laces, straps (model-garments.js)
  if(X.kit) parts.push(...ofShin(X,sd,shin));   // boots over the shin, greaves, bells, in the knee's frame (y down the shin; the ankle is y = -D.shin)
  const m2=new THREE.Mesh(merge(parts),matChar); m2.castShadow=true; kn.add(m2);
  return [hp,kn];
}
