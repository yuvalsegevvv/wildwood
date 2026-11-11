//@ The hiker's body: chest, neck, shoulders and hips as one surface; arms and legs whose joints continue each other; hands with fingers; shaped feet
/* ---------- body (design units: metres at height 1; torso heights are "design y" and are scaled by TK, the torso-length factor) ----------
   Why it does not look like building blocks: (1) the neck, the trapezius, the deltoid over the arm's joint and the pelvis round the hip joints are part of the torso's own surface;
   (2) every joint is a ball (see `limb` in model-parts.js) and the limb on the other side of it starts with the SAME cross-section (ELBOW / KNEE below), so
   bending shows a round joint and never a step; (3) the hand is the end of the forearm (the palm flattens out of the wrist) and the shin runs into a lofted foot. */
// what shows where a garment is taken off (the editor's None tile): a man's chest is bare, a woman wears a band top; both wear briefs (cream, a darker waistband)
const UNDER_COL=0xe9e3d6, UNDER_BAND=0xb8b2a4;
// the underwear's colours: look.underColor (the cloth) and look.underColor2 (the band); -1 keeps the cream; a chosen cloth with no band colour gets a darker band of itself
const underCol=L=>{ const a=cosQ(L.underColor); return a>=0?a:UNDER_COL; };
const underBand=L=>{ const b=cosQ(L.underColor2); if(b>=0) return b; const a=cosQ(L.underColor); return a>=0?(((a>>16&255)*0.78)<<16)|(((a>>8&255)*0.78)<<8)|((a&255)*0.78):UNDER_BAND; };
function clothPaints(L){
  const cb=chestBand(lookSliders(L)), b0=cb.lo, b1=cb.hi;   // the band top's, the bikini's and the halter's edges follow the bust (chestBand)
  const topPaint=(c,u,v)=>{
    if(L.top==='none'){ if(L.sex==='female'&&v>b0&&v<b1) c.set(v>b1-0.015||v<b0+0.015?underBand(L):underCol(L)); else c.set(L.skin); }
    else if(L.top==='flannel') plaid(c,L.topColor,u,v);
    else if(L.top==='vest'||L.top==='jerkin') c.set(0xe8e4dc);   // (the waistcoat and the leather jerkin are geometry over a cream shirt: model-garments.js, model-garments-more.js)
    else if(L.top==='crop'){ if(v<b0+0.03) c.set(L.skin); else c.set(L.topColor); }   // the midriff is bare
    else if(L.top==='bikini'){ if(v>b0+0.002&&v<b1+0.015) c.set(L.topColor); else c.set(L.skin); }   // two small cups, everything else bare
    else if(L.top==='halter'){ if(v>b0-0.006&&v<b1+0.035) c.set(L.topColor); else c.set(L.skin); }   // a wrap round the chest, bare shoulders, back and belly
    else if(L.top==='harness'){ if(L.sex==='female'&&v>b0&&v<b1) c.set(v>b1-0.015||v<b0+0.015?underBand(L):underCol(L)); else c.set(L.skin); }   // straps over a bare chest (a woman keeps her band top)   // (the waistcoat is geometry over a cream shirt: model-garments.js)
    else if(gmdIs(L.top)) gmdPaint(L,c,u,v);   // dresses: skin above the bodice (model-dresses.js)
    else if(L.top==='mail'){ c.set(L.topColor).multiplyScalar(0.72+0.38*((Math.floor(u*70)+Math.floor(v*70))&1)); }
    else if(L.top==='plate'){ c.set(L.topColor).multiplyScalar(0.82+0.3*(Math.floor(v*13)&1)); }
    else c.set(L.topColor);
  };
  const botPaint=(c,u,v)=>{
    if(L.bottom==='bikinibottom'){ c.set(v<0.045?L.bottomColor:L.skin); return; }
    if(L.bottom==='none'||gmxBareBottom(L.bottom)){ if(v<0.045) c.set(v>0.025?underBand(L):underCol(L)); else c.set(L.skin); return; }
    c.set(L.bottomColor);
    if(L.bottomStyle==='mail') c.multiplyScalar(0.72+0.38*((Math.floor((u||0)*70)+Math.floor((v||0)*70))&1));
    else if(L.bottomStyle==='plate') c.multiplyScalar(0.82+0.3*(Math.floor((v||0)*11)&1));
  };
  return {topPaint,botPaint};
}
/* Muscle (the Muscle slider, -1 soft .. 0 today's body .. 1.5 athletic). The limbs' widths aw / tw / cw carry the muscle's PEAK (the biceps, the quad, the calf: mk.a / mk.t / mk.c), so every outfit
   that fits a sleeve or a trouser leg by them still clears the body; the body's own stations then come back down from that peak (the elbow, the wrist, the knee and the ankle keep today's size,
   e < 1), so the muscle reads as a swelling and the joints stay slim. A negative value is a uniform, slightly slimmer limb. musW: the torso's width factor (lats), musD: its depth factor (ribs, pecs), musP: the pecs' own forward mass */
function musK(S){ const m=S.muscle, p=Math.max(m,0), n=Math.max(-m,0); return {m,p,n,a:1+0.13*p-0.05*n,t:1+0.105*p-0.045*n,c:1+0.09*p-0.045*n}; }
const musW=(S,fem,y)=>1+(S.muscle>=0?(fem?0.03:0.075)*S.muscle:0.025*S.muscle)*faceG(y,0.28,0.09);
const musD=(S,fem,y)=>1+(S.muscle>=0?(fem?0.02:0.045)*S.muscle:0.015*S.muscle)*faceG(y,0.32,0.08);
const musP=(S,fem,y)=>(fem?0.004:0.015)*Math.max(S.muscle,0)*faceG(y,0.34,0.06)+(fem?0.0:0.006)*Math.max(S.muscle,0)*faceG(y,0.12,0.07);   // (what torsoSize adds to the front: the pecs, and a man's abs)
// the measurements every part shares (also handed to outfits as rig.dims)
function charDims(L,S,fem,fs){
  const B=S.build, lr=Math.pow(B,0.9), TK=0.93*S.torso, mk=musK(S), hs=(fem?1.37:1.4)*S.head, thigh=0.46*S.legs, shin=0.44*S.legs, ankleH=0.06*(0.6+0.4*S.feet), neckR=(fem?0.04:0.05)*S.neck;
  const D={fem,B,lr,TK,hs,thigh,shin,ankleH,neckR,hipY:thigh+shin+ankleH,
    headY:0.555*TK+0.042*S.neck+0.1*fs[1]*hs,       // the head's centre above the hips: the chin sits just above the shoulders
    shX:(fem?0.138:0.156)*B*S.shoulders,            // shoulder joint, off the middle
    shY:0.45*TK,                                    // and its height above the hips
    hx:(fem?0.08:0.078)*B*(1+(S.hips-1)*0.6),      // hip joint, off the middle
    aw:(fem?0.9:1.08)*lr*S.arms*mk.a, tw:(fem?1.02:1.0)*lr*S.thighs*mk.t, cw:(fem?0.96:1.04)*lr*S.calves*mk.c, upper:0.28, fore:0.305, wrist:0.25, mk};
  D.ER=0.034*D.aw/mk.a; D.KR=0.05*lr;              // the elbow's and the knee's radius: both sides of the joint use it (the elbow stays slim however strong the arm: /mk.a)
  return D;
}
function profR(prof,y){ for(let i=1;i<prof.length;i++) if(y<=prof[i][1]){ const a=prof[i-1], b=prof[i], f=(y-a[1])/((b[1]-a[1])||1); return lerp(a[0],b[0],f); } return prof[prof.length-1][0]; }

// the torso's lathe profile [radius, design y] for a man and a woman: top-level so an outfit can ask how big the torso is at a height (torsoSize).
// Below the hip joints (y < 0) it is the PELVIS: a bowl wider than the thighs' tops (widest at -0.03..-0.07, the greater trochanter) down to the crotch at -0.165, so each
// thigh turns inside it and comes out under its rim (the hip crease in front, the gluteal fold behind) instead of standing out as an "ear" beside a narrow dome
const TORSO_F=[[0.001,-0.165],[0.062,-0.16],[0.112,-0.145],[0.152,-0.115],[0.174,-0.07],[0.174,-0.03],[0.166,0.0],[0.15,0.07],[0.116,0.17],[0.104,0.22],[0.116,0.3],[0.132,0.37],[0.138,0.43],[0.121,0.472]];
const TORSO_M=[[0.001,-0.165],[0.056,-0.16],[0.106,-0.145],[0.146,-0.115],[0.164,-0.07],[0.165,-0.03],[0.16,0.0],[0.142,0.08],[0.124,0.15],[0.136,0.23],[0.156,0.31],[0.17,0.38],[0.17,0.43],[0.146,0.472]];   // the profile stops at the shoulder's tip: the trapezius and the neck's flare are the concat below (they scale with the neck, not the chest)
/* The shoulder girdle and the neck's root (design y above TRS_Y0): the lathe's own circle cannot give a slope at the sides only, so above the chest every ring is
   rebuilt from three curves of its own: the half-width w (the front view: chest -> trapezius -> neck), the front depth df (the side view: the upper chest rounds back
   into the sternal notch, then the neck) and the back depth db (the long trapezius slope behind, to the neck's base). The deltoid is then a ball round the arm's
   joint blended into that section (trsDelt). That ball is TRS_INSET SMALLER than the arm's own top, so it never shows outside the arm: it only fills the gap between
   the trapezius and the arm above the joint. The shoulder's outer contour is the arm's (its deltoid bulge rotates with it, buildArm), so there is no cap, shelf or ring.
   torsoSize asks the same curves, so collars and straps keep lying on the skin. */
// the bust's centre (design y, chestLift 0) and how far it moved from the old 0.39 (the owner: it sat ~3 cm too high): everything keyed to its height adds CHEST_DY
// (the band top and the bikini's paint and cut rings here, the bikini's and halter's pieces in model-garments-more.js, torsoSize, the jiggle's weights in chest-jiggle.js)
const CHEST_Y=0.356, CHEST_DY=CHEST_Y-0.39;
/* The bust's frame from the sliders: its centre cy (lower for a larger chest: the weight), the lower lobe's height wl, and the band [lo, hi] that a band top, a bikini's cups
   and a halter must cover (it grows with the bust, so a large one never pokes out under the band). At the default it is the old band (0.294 .. 0.401). */
function chestBand(S){ const ce=chestEff(S.chest), cs=S.chestShape, cy=CHEST_Y+0.03*S.chestLift-0.02*(ce-1)-0.006*cs, wl=0.036*(ce<=1?0.8+0.5*ce:1.3+0.3*(ce-1));
  return {ce,cy,wl,lo:cy-1.2*wl-0.006,hi:cy+0.045+0.012*Math.max(0,ce-1)}; }
/* The bust (a woman's), as the forward depth it adds at (x, design y): part of the torso surface, not two balls. Each lobe is a teardrop: a long soft upper slope from the
   chest wall (exponent 1.7: no shelf at its top), fullest low, a round underside that tucks into a fold (the lower exponent grows with size); larger lobes sit a little
   further apart. cs, the chest shape: broad and flat (-1) spreads the lobes wide and shallow, round and full (+1) gathers them narrower, closer and deeper. buildTorso
   subtracts it from z; torsoSize and the garments ask it too (chestBump at the lobe's centre = the envelope cloth must clear). */
function chestBump(S,D,x,y){
  const CB=chestBand(S), ce=CB.ce, cs=S.chestShape, cy=CB.cy, B=D.B, wx=0.05*(0.8+0.22*ce)*(1-0.4*cs), wl=CB.wl, wu=0.085*(0.95+0.12*Math.max(0,ce-1)), lw=2+Math.min(1.2,0.5*Math.max(0,ce-1));
  const lobe=sd=>{ const dx=x-sd*chestLobeX(S,D), dy=y-cy; return Math.exp(-Math.pow(dx/wx,2))*(dy>0?Math.exp(-Math.pow(dy/wu,1.7)):Math.exp(-Math.pow(-dy/wl,lw))); };
  const sf=v=>v*(0.55+0.45*v*(3-2*v)), a=sf(lobe(-1)), b=sf(lobe(1));   // smoothstep flattens each lobe's tip: round, never a point
  return 0.034*D.lr*chestDepthK(ce)*(1+0.4*cs)*(1-(1-a)*(1-b));
}
const chestLobeX=(S,D)=>0.056*D.B*(1-0.3*S.chestShape)*(1+0.5*S.chestGap)*(1+0.05*Math.max(0,chestEff(S.chest)-1));   // a lobe's centre off the middle
// how far the bust stands out (x 0.034 lr): nearly nothing at the small end (min = a flat ribcage), the size itself 1..1.6, then 0.7 of the growth (slider 4.5 ~ 10 cm forward: an H/I cup)
const chestDepthK=ce=>ce<1?Math.pow(Math.max(0,(ce-0.42)/0.58),1.3):ce<=1.6?ce:1.6+(ce-1.6)*0.7;
// the belly: how much the FRONT swells at design y (a fraction of the front's depth), from the build (the old share: a sturdy body has a rounder belly) and the Belly slider
// (+1 = about 3 cm out in front at the navel, 1.5 a clear paunch, -1 a flat, toned front). The back never follows it: the seat is the hips' and the glutes' alone
// the glutes' depth behind at design y (at the centre of each lobe): they rise smoothly from the sacrum (a long upper slope), are fullest in the lower middle (-0.03) and round
// under into the gluteal fold; hipCurve scales and widens them, hipTall stretches them up and down. torsoSize asks the same (with the curve and height at least 1, its roomier envelope)
function trsGlute(S,B,fem,y){ const c=-0.03; return (fem?0.05:0.038)*B*hipAmp(S.hipCurve)*(S.muscle>=0?1+0.2*S.muscle:1+0.1*S.muscle)*faceG(y,c,(y>c?0.095*(1+0.4*S.hipTall):0.075*(1+0.5*S.hipTall))*hipWide(S.hipCurve)); }
// a man's ribcage is deeper than the lathe's ellipse gave (from the side he read paper thin): +RIB_DEPTH of the depth round the chest, front and back (torsoSize too)
const RIB_DEPTH=0.06, ribK=(fem,y)=>fem?1:1+RIB_DEPTH*faceG(y,0.3,0.1);
function trsBellyK(S,B,y){ const b=S.belly; return faceG(y,0.1,0.13)*((B-1)*1.4+(b>=0?0.3*b:0.08*b)); }
const TRS_Y0=0.3, TRS_INSET=0.004, TRS_DROP=0.6;   // where the rebuilt section starts (below 0.36-0.4 it IS the old lathe, so there is no seam), how far the filler ball stays inside the arm's ball (4 mm: closer z-fights), how far below the joint it runs (x its radius)
function trsUpper(S,D,y){
  const {fem,B,TK,neckR}=D, base=fem?TORSO_F:TORSO_M, wy=fem?0.215:0.15, belly=trsBellyK(S,B,y);
  // the old lathe's own width and depths at y (what buildTorso does below the shoulders), so the new curves leave it with no step
  const r=profR(base,Math.min(y,0.43)), up=faceSm(0.22,0.4,y), gw=faceG(y,wy,0.11);
  const ow=r*B*(fem?1:1.04)*(1+(S.shoulders-1)*up+(S.waist-1)*gw+chestRibs(S.chest)*faceG(y,0.32,0.1))*musW(S,fem,y), od=r*(fem?0.66:0.62)*B*(1+(S.waist-1)*0.7*gw+(S.shoulders-1)*0.2*up)*ribK(fem,y)*musD(S,fem,y);
  const yS=D.shY/TK, rd=0.05*D.aw-TRS_INSET, yA=yS+0.85*0.05*D.aw/TK;   // yA: the shoulder's top, a little inside the top of the arm's ball (wA = 0.3 of its radius out: 5 mm under its surface there), so the trapezius runs onto it with no notch
  const wA=D.shX+0.3*0.05*D.aw, nW=neckR*1.1, wN=nW*1.3, yN=yA+0.32*(1+(S.muscle>=0?0.4:0.2)*S.muscle)*(wA-wN)/TK;   // the shoulder line rises ~18 deg inward (0.32 m a metre) from the shoulder's top to yN, where a short concave fillet (wN, 1.3x the neck) turns it into the neck's column (nW): the neck is a column, not a funnel
  const tail=(yy,y1,v1,sl,vi)=>vi+(v1-vi)*Math.exp(-(yy-y1)*sl/Math.max(v1-vi,1e-4));   // past a curve's end: on toward vi with the same slope (no corner)
  let w; const a=0.6, hN=yN-yA, yP=0.38;
  if(y<=yA) w=lerp(ow,wA,faceSm(yP,yA,y));   // the chest narrows a little into the shoulder (the deltoid, not the ribcage, makes the shoulder's width)
  else if(y<=yN){ const q=(y-yA)/hN, s2=(-a+Math.sqrt(a*a+4*(1-a)*q))/(2*(1-a)); w=wA-s2*(wA-wN); }   // the shoulder line: nearly straight, a little steeper toward the neck (y = a*s + (1-a)*s^2 along it)
  else w=tail(y,yN,wN,(wA-wN)/(hN*(2-a)),nW);
  // front: the upper chest stays full, then rounds back to the sternal notch (yF), then the neck (its forward lean is the z shift in buildTorso)
  const yF=yS+(fem?0.05:0.058), dN=neckR*1.1, nD=neckR*0.94, fP=0.4, of=od*(1+belly); let df;
  if(y<=yF){ const t=Math.max(0,(y-fP)/(yF-fP)); df=of-(of-dN)*t*t; } else df=tail(y,yF,dN,2*(od-dN)/(yF-fP),nD);
  // back: the upper back rounds up from the shoulder blades to the base of the neck (yB), then a concave nape into the column (the tail)
  const yB=yN+0.012, bN=neckR*1.25, bP=0.36, ob=od; let db;
  if(y<=yB){ const t=Math.max(0,(y-bP)/(yB-bP)); db=ob-(ob-bN)*Math.pow(t,2.4); } else db=tail(y,yB,bN,2.4*(od-bN)/(yB-bP),nD);
  const col=1+0.06*faceSm(0.57,0.64,y); w*=col; df*=col; db*=col;   // the column swells a little toward the jaw: narrowest at mid-neck
  return {w,df,db,rd,yS};
}
// the body's true section at design height yd >= TRS_Y0 (metres): half-width, front and back depth, and the neck's forward lean (zc, negative = forward). torsoSize keeps its old,
// roomier answer above the chest (the signature outfits were fitted to it); a base garment that must LIE on the neck or the shoulders (a collar, a tie) asks this
function trsSection(X,D,yd){ const u=trsUpper(X.S,D,yd); return {rx:u.w,rzF:u.df,rzB:u.db,zc:-faceSm(0.5,0.6,yd)*(yd-0.5)*0.06}; }
// The torso and the arm are separate meshes, so where they meet their normals disagree and the light breaks in a hard line (chest to arm in front and behind, a tick at the
// shoulder's tip, a ring at the arm's top from the side). Near the arm, the torso's normals are blended toward the arm's own field (radial from the upper arm's axis at its rest
// angle, buildArm), fully within TRS_NBLEND_IN of the arm's surface, fading out over TRS_NBLEND: both meshes then shade alike where they meet. The arm keeps its normals.
const TRS_NBLEND_IN=0.004, TRS_NBLEND=0.035;
function trsShoulderNormals(g,D){
  const p=g.attributes.position, n=g.attributes.normal, r=0.05*D.aw, L=0.2;
  for(const sd of [-1,1]){ const th=sd*(0.1+(D.B-1)*0.35), ax=Math.sin(th), ay=-Math.cos(th), jx=sd*D.shX, jy=D.shY;
    for(let i=0;i<p.count;i++){ const x=p.getX(i); if(x*sd<D.shX*0.3) continue;
      const dx=x-jx, dy=p.getY(i)-jy, z=p.getZ(i), t=Math.max(0,Math.min(L,dx*ax+dy*ay)), qx=dx-ax*t, qy=dy-ay*t, d=Math.hypot(qx,qy,z), dd=d-r;
      if(dd>TRS_NBLEND) continue; const w=1-faceSm(TRS_NBLEND_IN,TRS_NBLEND,dd), k=0.9*w;
      const fx=qx/(d||1), fy=qy/(d||1), fz=z/(d||1), nx=lerp(n.getX(i),fx,k), ny=lerp(n.getY(i),fy,k), nz=lerp(n.getZ(i),fz,k), l=Math.hypot(nx,ny,nz)||1; n.setXYZ(i,nx/l,ny/l,nz/l); } }
}
// the deltoid: how far a ray from the spine (direction ux,uz) reaches through the ball round the arm's joint at height y (design); 0 where it misses
function trsDelt(D,u,y,ux,uz){
  const dy=(y-u.yS)*D.TK, ry=dy>0?u.rd*0.9:u.rd*TRS_DROP, e=dy*dy/(ry*ry), f=1-(dy>0?e:e*e), a=D.shX+(dy<0?-dy*(0.1+(D.B-1)*0.35):0); if(f<=0) return 0;   // (below the joint it leans out with the hanging arm: buildArm's rest angle)   // a ball above the joint; below it the deltoid keeps its width, then tucks steeply into the arm (a squared falloff): a shallow taper met the arm's own surface almost tangentially and z-fought in a ragged line
  const rr=u.rd*u.rd*f;
  const k=rr-a*a*uz*uz; return a*Math.abs(ux)+Math.sign(k)*Math.sqrt(Math.abs(k));   // a ray that misses the ball still gets a value (falling off past the grazing one), so the smooth max has no jump where rays stop hitting it: that jump was a hard rim round the shoulder in the side view
}
function buildTorso(X,D){
  const CB=chestBand(X.S);   // the bust's frame (centre, band) for the cut rings and the lobes
  const {L,S,fem,sg,skin,skinPaint,topPaint,botPaint}=X, {B,lr,TK,neckR}=D, ch=S.chest, G=faceG, sm=faceSm, kT=X.kit&&X.kit.sl.top, kB=X.kit&&X.kit.sl.bottom;   // kT / kB: the signature outfits' top and bottoms, when worn
  const base=fem?TORSO_F:TORSO_M;
  const hem=(L.top==='jacket'||L.top==='hoodie'||L.top==='mail'||L.top==='plate')?-0.035:0.03;
  const nt=Math.max(0.7,(D.headY-0.03)/TK), U=y=>trsUpper(S,D,y), prof0=base.filter(p=>p[1]<TRS_Y0).concat([0.33,0.36,0.39,0.42,0.445,0.47,0.495,0.52,0.545,0.57,0.6,0.635,nt].map(y=>[profR(base,y),y]));   // above TRS_Y0 the ring heights only (the radius, the old profile's so the rings below blend into it, is rebuilt per angle from trsUpper): the shoulders and the neck's root get rings every 2.5 cm
  // rings exactly at the colour edges (the hem, the belt line, the plate band) so those edges are crisp
  // the colour edges: a whole outfit has its own; mixed, the top's lie above the waist and the bottoms' below it (a base garment's are the original list)
  const kc=k=>(k.cuts&&k.cuts.torso)||[], cutList=kT&&kT===kB?kc(kT):[hem].concat(kT?kc(kT).filter(y=>y>hem):[hem+0.03,0.07],kB?kc(kB).filter(y=>y<=hem):[hem-0.035,0.02]);
  const bareTop=['none','bikini','halter','harness','crop'].includes(L.top), belt=hem>0&&L.bottom!=='skirt'&&L.bottom!=='kilt'&&L.bottom!=='pleated'&&L.bottom!=='none'&&!gmxSkirtKind(L.bottom)&&!gmxBareBottom(L.bottom), dark=L.top==='jacket'||L.top==='hoodie'||L.top==='mail';
  // (only where the colour really changes: a pair of rings 1 mm apart on bare skin shaded as a faint line round the belly)
  const cuts=(kT||kB?cutList:(bareTop&&L.bottom!=='none'&&!gmxBareBottom(L.bottom)?[hem]:bareTop?[]:[hem]).concat(belt?[hem-0.035]:[],dark?[hem+0.03]:[],L.top==='plate'?[0.02,0.07]:[]).concat((L.top==='none'||L.top==='harness')&&fem?[CB.lo,CB.lo+0.015,CB.hi-0.015,CB.hi]:[]).concat(L.bottom==='none'||gmxBareBottom(L.bottom)?[0.025,0.045]:[]).concat(L.top==='crop'?[CB.lo+0.03]:L.top==='halter'?[CB.lo-0.006,CB.hi+0.035]:L.top==='bikini'?[CB.lo+0.002,CB.hi+0.015]:[])).filter(y=>y>-0.1&&y<0.5).sort((a,b)=>a-b), prof=[]; for(const pt of prof0){ while(cuts.length&&cuts[0]<pt[1]-0.001){ const y=cuts.shift(); prof.push([profR(prof0,y-0.0005),y-0.0005],[profR(prof0,y+0.0005),y+0.0005]); } prof.push(pt); }
  const tg=new THREE.LatheGeometry(densify(prof,fem?4:3).map(p=>new THREE.Vector2(p[0],p[1])),sg(fem?60:52)), p=tg.attributes.position, wy=fem?0.215:0.15;
  for(let i=0;i<p.count;i++){
    let y=p.getY(i), x0=p.getX(i), z0=p.getZ(i); const belly=trsBellyK(S,B,y), sN=sm(0.5,0.6,y), front=z0<0;
    // wider than deep; above the shoulders the section turns into the neck's own (a little wider than deep, leaning forward)
    let x=x0*lerp(B*(fem?1:1.04),1.1,sN)*lerp(musW(S,fem,y),1,sN), z=z0*lerp((fem?0.66:0.62)*B,0.94,sN)*(1+(front?belly:0)*(1-sN))*ribK(fem,y)*lerp(musD(S,fem,y),1,sN);
    const gw=G(y,wy,0.11), gh=G(y,-0.03,y>-0.03?0.075:0.1), up=sm(0.22,0.4,y)*(1-sN);
    x*=1+(S.shoulders-1)*up+(S.waist-1)*gw+(S.hips-1)*gh+chestRibs(ch)*G(y,0.32,0.1);   // (a larger chest: a broader ribcage)
    z*=1+(S.waist-1)*0.7*gw+(S.hips-1)*(front?0.08:0.5)*gh+(S.shoulders-1)*0.2*up;   // wide hips widen the sides and push the seat back, but never fill the belly out in front
    if(y>=TRS_Y0-1e-4){   // the shoulder girdle and the neck's root: the section of trsUpper (front view, front and back depth) with the deltoid blended in
      const u=U(y), th0=Math.atan2(z0,x0), th=th0-0.32*sm(TRS_Y0,0.4,y)*Math.sin(2*th0)/2, cx=Math.cos(th), cz=Math.sin(th);   // the angles crowd toward the sides (x0.68 spacing) where the deltoid curves
      const se=2/(2+1.2*sm(0.3,0.42,y)*(1-sm(0.52,0.58,y))), px=v=>Math.sign(v)*Math.pow(Math.abs(v),se);   // a squarer section across the shoulders (superellipse, exponent 3.2): the chest and the shoulder blades stay deep out to the arm, so the deltoid is not a pad on a thin wedge
      x=u.w*px(cx); z=(cz<0?u.df:u.db)*px(cz);
      const rc=Math.hypot(x,z)||1e-6, ux=x/rc, uz=z/rc, rdl=trsDelt(D,u,y,ux,uz);
      if(rdl>0){ const k=0.03, h=Math.max(k-Math.abs(rc-rdl),0)/k, rn=Math.max(rc,rdl)+h*h*k*0.25; x=ux*rn; z=uz*rn; }   // a smooth max: the deltoid swells out of the trapezius, no crease
    }
    const ax=Math.abs(x);
    if(front){
      if(!fem) z+=0.008*B*G(y,0.33,0.1)*(1-0.4*G(ax,0,0.12))*(1-0.4*Math.min(S.chestShape,0))-0.003*B*(0.5+0.5*ch)*G(y,0.37,0.05)*G(ax,0.07*B,0.07)-0.007*B*Math.max(S.chestShape,0)*G(y,0.34,0.05)*G(ax,0.06*B,0.045);   // a man's chest: a flat, broad plane (the ribcage flattened by 0.8 cm: 1.2 read paper thin from the side) with only a hint of pec; a rounded bump read as a bust
      if(S.muscle>0){ const mp=S.muscle, up2=sm(0.62,0.34,y);   // muscle: a man's pecs gain mass with a soft line between them and a lower edge; a woman's chest wall a little firmness (the bust is the bust's); abs: a groove and two soft columns, geometry only where the lathe is fine enough for it
        if(!fem) z-=0.015*B*mp*G(y,0.345,0.055)*G(ax,0.062*B,0.055)*(1-0.55*G(ax,0,0.011)*sm(0.3,0.36,y))+0.006*mp*G(ax,0,0.01)*G(y,0.13,0.1)-0.006*mp*G(ax,0.03*B,0.02)*G(y,0.12,0.07);
        else z-=0.004*mp*G(y,0.36,0.07)*G(ax,0,0.1)+0.0015*mp*G(ax,0.03*B,0.02)*G(y,0.12,0.07); }
      if(!fem&&ch>1) z-=0.012*B*Math.min(ch-1,1.2)*G(y,0.34,0.07)*(1-0.4*G(ax,0,0.03));   // a man's chest grows as bulk of the pecs and ribs, not as a bust
      { const u=clamp((-0.03-y)/0.13); z*=1-0.6*Math.pow(u,1.5); }   // below the hip joints the front falls back between the thighs, so the crotch narrows to a point (a V crease) instead of ending as a flat-bottomed wedge
      z-=0.008*G(y,0.14,0.11)*(1-G(ax,0,0.04))*(fem?0.5:1);
      z+=0.0045*B*G(y,0.085,0.016)*G(ax,0,0.016);   // the belly button: a small soft dimple              // stomach, a little rounded
      if(fem){
        // bust: part of the torso surface, not two balls. Each side slopes gently down from the collarbone, is fullest low and tucks in underneath;
        // the two join softly in the middle. A larger chest (ch) is deeper, a little wider and sits a little lower.
        z-=chestBump(S,D,x,y);
      }
    } else {
      z+=0.012*B*G(y,0.37,0.07)*G(ax,0.075*B,0.045);                    // shoulder blades
      if(!fem) z+=0.008*B*G(y,0.3,0.12)*(1-G(ax,0,0.03));                   // a man's upper back and lats: the ribcage has depth behind it too (torsoSize's rzBack adds the same)
      z+=trsGlute(S,B,fem,y)*G(ax,0.066*B,(fem?0.05:0.06)*hipWide(S.hipCurve))*(1-0.45*G(ax,0,0.013)*sm(0.07,-0.02,y));   // glutes (trsGlute), each a round lobe (a man's flatter and squarer: wider), a soft cleft between them below the sacrum
      z-=(fem?0.012:0.008)*B*G(y,0.15,0.06)*G(ax,0,0.09);                // the lumbar curve: the lower back dips in above the sacrum, so the seat rises out of it instead of starting as a shelf
      z-=0.008*G(ax,0,0.018)*G(y,0.2,0.18);                             // the groove of the spine
    }
    z-=sN*(y-0.5)*0.06; p.setXYZ(i,x,y*TK,z);
  }
  smoothN(tg); trsShoulderNormals(tg,D);
  const skinY=kT&&kT.skinFrom!==undefined?kT.skinFrom:0.555;   // an outfit top with a high collar paints the neck itself (skinFrom)
  const u45=U(D.shY/TK), onDelt=(x,y,z)=>{ const dx=Math.abs(x)-D.shX, dy=y-D.shY; const e=dy*dy/Math.pow(u45.rd*(dy>0?0.9:TRS_DROP),2), f=1-(dy>0?e:e*e); return f>0&&dx>-0.45*u45.rd&&dx*dx+z*z<u45.rd*u45.rd*f*1.3; };   // (the same egg as trsDelt)   // a point of the deltoid's cap over the arm
  const bareLeg=!kB&&(L.bottom==='none'||gmxBareBottom(L.bottom));
  const tp=(x,y,z,c)=>{ const yd=onDelt(x,y,z)?Math.max(y/TK,0.47):y/TK;   // the deltoid is painted as the shoulder above it (y 0.47): a band top or a bikini leaves it bare, a shirt covers it   // one paint for every piece of the torso: neck skin, top, belt line, bottoms (each of the top and the bottoms is a base garment or an outfit's item)
    if(yd>skinY+0.02*sm(-0.04,0.04,z)) skinPaint(c);   // the neckline: lower in front, higher behind, blended
    else if(yd>hem){ if(kT) ofPaint(X,'top','torso',c,x,yd,z,0); else topPaint(c,x,yd); }
    else if(kB) ofPaint(X,'bottom','torso',c,x,yd,z,0);
    else if(yd>hem-0.035 && L.bottom!=='skirt' && L.bottom!=='kilt' && L.bottom!=='pleated' && L.bottom!=='none' && !gmxSkirtKind(L.bottom) && !gmxBareBottom(L.bottom) && hem>0) c.set(0x3a2a1c);
    else if(bareLeg&&yd<0.02){ const s=Math.pow(clamp(Math.abs(x)/(0.165*B)),1.3), w=sm(-0.03,0.03,z), bk=L.bottom==='bikinibottom', yl=lerp(-0.15+(bk?0.21:fem?0.13:0.1)*s,(bk?-0.13+0.2*s:-0.16+0.05*s),w); skinPaint(c); const sk=c.clone(); botPaint(c,x,yd); c.lerp(sk,1-sm(yl-0.014,yl+0.014,yd)); }   // briefs and a bikini (cut higher: only its strings cross the hip): blended over 2.8 cm (a diagonal line across the lathe's rings snapped to them in steps); the leg opening runs from the crotch up to the hip's side in front, lower and fuller behind
    else botPaint(c,x,yd);
    if(!kT&&(L.top==='jacket'||L.top==='hoodie'||L.top==='mail') && yd<hem+0.03 && yd>hem) c.multiplyScalar(0.8);
    if(!kT&&L.top==='plate' && yd>0.02 && yd<0.07) c.set(0x3a2a1c); };
  const parts=[pc(tg,tp)];
  if(L.top==='jacket'){
    parts.push(pc(ofLoft([0,0.5,1].map(f=>{ const yd=0.578+(f-0.5)*0.06/TK, sc=trsSection(X,D,yd), m=0.006+0.004*f; return {y:yd*TK,rx:sc.rx+m,rz:(sc.rzF+sc.rzB)/2+m,zc:sc.zc+(sc.rzB-sc.rzF)/2}; }),sg(20),0,TAU),(x,y,z,c)=>{ c.set(L.topColor).multiplyScalar(0.8); }));   // the stand-up collar: rings round the body's own section (the trapezius at its foot, the neck at its top), a little off it
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
  if(L.pack||L.cape==='pack'){   // the backpack: look.pack (the old switch, villagers) or the free cape 'pack'; its colours are look.capeColor (canvas) and look.capeTrim (the bedroll)
    const bz=0.1*B+0.08, cv=cosQ(L.capeColor), tr=cosQ(L.capeTrim), canvas=cv>=0?cv:0x566437, roll=tr>=0?tr:0x8a3b2c, cc=new THREE.Color(canvas), flap=cc.clone().multiplyScalar(0.88).getHex(), strap=cc.clone().multiplyScalar(0.7).getHex();
    parts.push(pc(new THREE.BoxGeometry(0.3,0.42,0.15).translate(0,0.28*TK,bz),c=>c.set(canvas)));
    parts.push(pc(new THREE.BoxGeometry(0.22,0.14,0.05).translate(0,0.17*TK,bz+0.095),c=>c.set(flap)));
    parts.push(pc(new THREE.CylinderGeometry(0.065,0.065,0.36,12).rotateZ(Math.PI/2).translate(0,0.5*TK,bz),c=>c.set(roll)));
    for(const sd of [-1,1]) parts.push(pc(new THREE.BoxGeometry(0.035,0.34,0.012).translate(sd*0.085*B,0.33*TK,-profR(base,0.33)*(fem?0.66:0.62)*B-0.004-(fem?0.012:0)),c=>c.set(strap)));
  }
  if(L.cape==='quiver'){   // the free cape 'quiver': a leather quiver slung across the back (its colours: look.capeColor leather, look.capeTrim fletching); look.left puts it on the other shoulder
    const bz=0.1*B+0.08, cv=cosQ(L.capeColor), tr=cosQ(L.capeTrim), leather=cv>=0?cv:0x6b3a22, fletch=tr>=0?tr:0xe8e4dc, sd=L.left?-1:1, tilt=-0.35*sd, q=g=>g.rotateZ(tilt).translate(sd*0.06,0.3*TK,bz-0.05);
    parts.push(pc(q(new THREE.CylinderGeometry(0.07,0.06,0.55,10)),c=>c.set(leather)));
    for(const x of [-0.03,0,0.03]) parts.push(pc(q(new THREE.BoxGeometry(0.012,0.12,0.04).translate(x,0.32,(x/0.03)*0.02)),c=>c.set(fletch)));
    parts.push(pc(new THREE.BoxGeometry(0.03,0.3,0.01).rotateZ(-0.6*sd).translate(0,0.3*TK,-profR(base,0.3)*(fem?0.66:0.62)*B-0.004-(fem?0.012:0)),c=>c.set(leather)));   // the strap across the chest
  }
  return parts;
}

// a hand's fingers and thumb, as tubes that curl a little toward the palm (the palm faces the thigh)
function buildFingers(X,D,sd){
  const {S,sg,skinPaint}=X, hh=S.hands, out=[], f=[[-0.019,0.93,0.003],[-0.0065,1,0],[0.0065,0.93,0.002],[0.0185,0.76,0.007]], gp=X.glove, fat=gp&&gp.fingers!=='bare'?1.17:1;   // (a glove: fatter fingers, painted by the plan; a mitten: one fat blob and a thumb)
  const fp=gp?(x,y,z,c)=>gp.finger(c,x,y,z,sd):skinPaint, mitt=gp&&gp.fingers==='mitt';
  if(mitt) out.push(pc(csph(1,sg(10),sg(8)).scale(0.0145*hh,0.05*hh,0.0275*hh).translate(-sd*0.006*hh,-0.33,-0.001),fp,-0.28));
  // the fingers start at the knuckle line (the palm's far end, in a shallow arc: the middle knuckle lowest) and are as long as the palm, so the hand reads as a hand and not a ball with claws
  else for(const [z0,k,ky] of f){ const L=0.07*hh*k, y0=-0.306+ky;
    out.push(pc(sweepTube([[-sd*0.001*hh,y0,z0*hh],[-sd*0.004*hh,y0-L*0.4,z0*1.02*hh],[-sd*0.01*hh,y0-L*0.76,z0*1.03*hh],[-sd*0.017*hh,y0-L*0.99,z0*1.02*hh]],[0.0079*hh*fat,0.0073*hh*fat,0.0065*hh*fat,0.0054*hh*fat],sg(7),{cap:'round',rings:sg(10)}),fp,-0.28)); }
  // the thumb leaves the palm's front edge near the wrist and lies ahead of the index finger
  out.push(pc(sweepTube([[-sd*0.006*hh,-0.258,-0.015*hh],[-sd*0.012*hh,-0.279,-0.029*hh],[-sd*0.017*hh,-0.299,-0.036*hh],[-sd*0.021*hh,-0.317,-0.037*hh]],[0.0112*hh*fat,0.0096*hh*fat,0.008*hh*fat,0.0064*hh*fat],sg(7),{cap:'round',rings:sg(10)}),fp,-0.28));
  return out;
}
// the deltoid's own bulge on the arm (it rotates with it): the outer half of the upper arm swells by ARM_DELT x the arm's size just below the joint and fades out a third
// of the way down (its insertion), so the shoulder's outer contour runs straight into the arm's. Only that band's normals are recomputed: limb's own normals at the elbow stay
const ARM_DELT=0.11;
function armDeltoid(g,sd,aw,mus){
  const p=g.attributes.position, r=0.05*aw, n0=g.attributes.normal.array.slice();
  for(let i=0;i<p.count;i++){ const y=p.getY(i), x=p.getX(i), f=Math.max(0,sd*x/r); if(f<=0||y>0.02||y<-0.14) continue;
    const b=ARM_DELT*(1+0.5*mus.p-0.4*mus.n)*r*faceG(y,-0.035,0.04)*f*Math.sqrt(f); p.setX(i,x+sd*b); }
  smoothN(g); const n=g.attributes.normal;
  for(let i=0;i<p.count;i++){ const y=p.getY(i); if(y>0.015||y<-0.13) n.setXYZ(i,n0[i*3],n0[i*3+1],n0[i*3+2]); }
}
// the forearm's paint with the gloves laid over it below their start (y is the elbow's frame: y = -d down the forearm)
const gloveWrap=(gp,sd,f)=>gp?(x,y,z,c)=>{ f(x,y,z,c); if(-y>=gp.start) gp.paint(c,x,y,z,sd); }:f;
function buildArm(X,D,sd){
  const {L,S,fem,sg,skinPaint,topPaint,q}=X, kit=X.kit&&X.kit.sl.top, {aw,ER,upper,fore}=D, longSleeve=L.top!=='tshirt'&&L.top!=='none'&&L.top!=='vest'&&L.top!=='jerkin'&&L.top!=='crop'&&!gmxSleeveless(L.top), hh=S.hands, bareArm=gmxSleeveless(L.top);   // kit: the outfit's top (the sleeves are the top's)
  const sh=new THREE.Group(); sh.name=sd<0?'shL':'shR'; sh.position.set(sd*D.shX,D.shY,0); sh.rotation.z=sd*(0.1+(D.B-1)*0.35);
  // upper arm: the shoulder ball, the biceps in front, narrowing to the elbow. (Cut rings only where a colour edge is: on bare skin a pair of rings 1 mm apart shaded as a faint line round the limb)
  const mk=D.mk, ua=pc(limb([[0,0.05*aw,0.052*aw],[0.13,0.0505*aw,0.053*aw],[0.38,0.045*aw*(1-0.03*mk.p),0.048*aw,-0.003-0.002*mk.p],[0.7,0.037*aw*(1-0.05*mk.p),0.039*aw*(1-0.03*mk.p)],[1,ER,ER*1.04]],upper,sg(24),sg(24),{cuts:(!kit&&!bareArm&&!longSleeve&&L.top!=='none'?[0.13/upper]:[]).concat((kit&&kit.cuts&&kit.cuts.upperArm)||[])}),kit?(x,y,z,c)=>ofPaint(X,'top','upperArm',c,x,y,z,sd):(x,y,z,c)=>{ if(!bareArm&&(longSleeve||y>-0.13)) topPaint(c,x+sd*0.3,y); else skinPaint(c); });
  armDeltoid(ua,sd,aw,D.mk);
  const m1=new THREE.Mesh(ua,matChar); m1.castShadow=true; sh.add(m1);
  if(X.kit){ const ex=ofRun(X,'shoulder',sd); if(ex.length){ const m=new THREE.Mesh(merge(ex),matChar); m.castShadow=true; sh.add(m); } }   // puffed sleeves, epaulets, in the shoulder joint's frame
  const el=new THREE.Group(); el.name=sd<0?'elL':'elR'; el.position.y=-upper; el.rotation.x=0.12; sh.add(el);   // built with poseRig's resting bend (eL / eR 0.12): a still portrait or preview does not show a locked, straight arm
  // forearm and hand in one surface: thick below the elbow, slim at the wrist (t = 0.82), then the palm flattens out of it
  const wr=D.wrist/fore, ww=0.02*aw, pw=0.027*hh;
  const gp=X.glove, gcut=gp?[gp.start/fore]:[];   // gp: the gloves' plan (model-gloves.js): the forearm below gp.start is painted as glove
  const wk=1/mk.a**(mk.p>0?1:0), fa=pc(limb([[0,ER,ER*1.04],[0.1,0.037*aw*(1-0.03*mk.p),0.038*aw*(1-0.03*mk.p)],[0.34,0.0305*aw*(1-0.08*mk.p),0.03*aw*(1-0.08*mk.p)],[wr-0.12,0.0235*aw*wk,0.0235*aw*wk],[wr,ww*0.9*wk,ww*1.06*wk],[wr+0.07,0.0128*hh,pw*0.9],[0.94,0.0124*hh,pw],[1,0.0104*hh,pw*0.95]],fore,sg(20),sg(26),{cuts:(!kit&&longSleeve?[0.2/fore,0.225/fore]:[]).concat((kit&&kit.cuts&&kit.cuts.foreArm)||[],gcut)}),gloveWrap(gp,sd,kit?(x,y,z,c)=>ofPaint(X,'top','foreArm',c,x,y,z,sd):(x,y,z,c)=>{ if(longSleeve && y>-0.225){ topPaint(c,x+sd*0.3,y-upper); if(y<-0.2) c.multiplyScalar(0.8); } else skinPaint(c); }),-upper);
  const hand=q>=0.5?[fa].concat(buildFingers(X,D,sd)):[fa];
  const m2=new THREE.Mesh(hand.length>1?merge(hand):fa,matChar); m2.castShadow=true; el.add(m2);
  if(X.kit){ const ex=ofRun(X,'forearm',sd); if(ex.length){ const m=new THREE.Mesh(merge(ex),matChar); m.castShadow=true; el.add(m); } }   // cuffs, bracers, in the elbow's frame (y down the forearm)
  { const ex=gmCuff(X,D,sd); if(ex.length){ const m=new THREE.Mesh(merge(ex),matChar); m.castShadow=true; el.add(m); } }   // base cuffs (model-garments.js)
  if(gp){ const ex=gp.kit?ofRun(X,'glove',sd):glBaseGeos(X,D,sd,gp); if(ex.length){ const m=new THREE.Mesh(merge(ex),matChar); m.castShadow=true; el.add(m); } }   // cuffs, plates, wraps (model-gloves.js)
  return [sh,el];
}

const FOOT_LEN=1.07, FOOT_BALL=0.12;   // the foot's length (x the stations) and the extra width across the ball of the foot and the toes
// the shoe: a loft from the heel to the toe, whose ankle opening is where the shin comes down into it
function buildFoot(X,D,sd,boot){
  const {L,S,sg,skinPaint}=X, kit=X.kit&&X.kit.sl.shoes, sf=S.feet, wf=0.55+0.45*sf, hf=0.8+0.2*sf, A=D.ankleH;
  const st=[[0.056,0.004,0.004,0.02],[0.05,0.017,0.022,0.027],[0.04,0.025,0.033,0.035],[0.022,0.03,0.042,0.042],[0.0,0.031,0.05,0.05],[-0.03,0.033,0.04,0.042],[-0.075,0.038,0.027,0.029],[-0.112,0.036,0.021,0.022],[-0.138,0.031,0.016,0.017],[-0.151,0.022,0.011,0.012],[-0.157,0.008,0.005,0.007]];   // heel (a round ball), ankle, instep, the ball of the foot (widest), then a round toe box: the old one ran to a point like an elf's shoe
  if(sg(100)<50) st.splice(9,1), st.splice(7,1), st.splice(2,1);   // phones: three stations fewer (the triangle budget)
  const rings=[]; for(const s of st){ rings.push({y:s[0]*sf*FOOT_LEN,rx:s[1]*wf*(1+FOOT_BALL*faceG(s[0],-0.075,0.05)),rz:s[2]*hf,zc:-(s[3]*hf-A)}); }   // (FOOT_LEN, FOOT_BALL: from the front the old foot read as a stub)
  const dense=[]; for(let i=0;i<rings.length-1;i++){ const k=Math.max(1,Math.round(sg(3))); for(let j=0;j<k;j++){ const f=j/k, a=rings[i], b=rings[i+1]; dense.push({y:lerp(a.y,b.y,f),rx:lerp(a.rx,b.rx,f),rz:lerp(a.rz,b.rz,f),zc:lerp(a.zc,b.zc,f)}); } } dense.push(rings[rings.length-1]);
  const g=loftRings(dense,sg(18)); g.rotateX(Math.PI/2); g.rotateY(-sd*0.1);
  const p=g.attributes.position; for(let i=0;i<p.count;i++) if(p.getY(i)<-A) p.setY(i,-A);   // a flat sole
  smoothN(g);
  const white=L.shoes!=='boots'&&L.shoes!=='tallboots'&&L.shoes!=='furboots'&&L.shoes!=='sabatons';
  if(kit) return pc(g,(x,y,z,c)=>ofPaint(X,'shoes','foot',c,x,y,z,sd),-D.thigh-D.shin);
  if(L.shoes==='none'||L.shoes==='sandals'||L.shoes==='geta') return pc(g,skinPaint,-D.thigh-D.shin);   // barefoot (the editor's None tile)
  return pc(g,(x,y,z,c)=>{ c.set(L.shoeColor); if(y<-A+0.011) c.set(white?0xf2efe8:0x221a14); else if(white&&z<-0.1) c.multiplyScalar(1.12); },-D.thigh-D.shin);
}
function buildLeg(X,D,sd){
  const {L,S,fem,sg,skinPaint,botPaint}=X, kB=X.kit&&X.kit.sl.bottom, kS=X.kit&&X.kit.sl.shoes, {tw,cw,thigh,shin,KR,hx,B,lr}=D, boot=kS?kS.boot!==false:(L.shoes==='boots'||L.shoes==='tallboots'||L.shoes==='furboots'||L.shoes==='sabatons');   // kB / kS: the outfits' bottoms and shoes, when worn
  const hp=new THREE.Group(); hp.name=sd<0?'hipL':'hipR'; hp.position.set(sd*hx,0,0);
  // thigh: a slimmer ball at the hip joint, shallowest front to back (it turns inside the pelvis, buildTorso: a stride swings its front up into the belly and its back into the seat), full from where it leaves the pelvis's rim (t 0.24), full quads in front, tapering to the knee (radius KR, shared with the shin below)
  const mp=D.mk.p, th=pc(limb([[0,0.07*tw*(1-0.07*mp),0.064*tw*(1-0.07*mp)],[0.12,0.084*tw*(1-0.03*mp),0.076*tw*(1-0.03*mp)],[0.24,0.089*tw,0.09*tw],[0.45,0.076*tw*(1-0.02*mp),0.08*tw*(1+0.01*mp),-0.004-0.003*mp],[0.76,Math.max(KR*1.1,0.057*tw*(1-0.05*mp)),Math.max(KR*1.12,0.06*tw*(1-0.03*mp)),-0.002],[1,KR,KR*1.04]],thigh,sg(24),sg(28),{cuts:(!kB&&L.bottom==='shorts'?[0.53,0.53-0.03/thigh]:[]).concat(L.bottom==='shortshorts'?[0.2,0.2-0.025/thigh]:[]).concat((kB&&kB.cuts&&kB.cuts.thigh)||[])}),kB?(x,y,z,c)=>ofPaint(X,'bottom','thigh',c,x,y,z,sd):(x,y,z,c)=>{
    if(L.bottom==='trousers'||L.bottom==='greaves'||L.bottom==='breeches'||L.bottom==='hakama'||(L.bottom==='shorts'&&y>-thigh*0.53)||(L.bottom==='shortshorts'&&y>-thigh*0.2)) botPaint(c,x,y); else skinPaint(c);   // (briefs are the pelvis's: buildTorso paints their leg line, so it stays put when the thigh swings)
    if(L.bottom==='shorts'&&y>-thigh*0.53&&y<-thigh*0.53+0.03) c.multiplyScalar(0.85); if(L.bottom==='shortshorts'&&y>-thigh*0.2&&y<-thigh*0.2+0.025) c.multiplyScalar(0.8); });
  const m1=new THREE.Mesh(th,matChar); m1.castShadow=true; hp.add(m1);
  if(!kB){ const ex=gmxThigh(X,D,sd); if(ex.length){ const m=new THREE.Mesh(merge(ex),matChar); m.castShadow=true; hp.add(m); } }   // the plated leggings' thigh plates (model-garments-more.js)
  if(X.kit){ const ex=ofRun(X,'thigh',sd); if(ex.length){ const m=new THREE.Mesh(merge(ex),matChar); m.castShadow=true; hp.add(m); } }   // breeches' flares, stripes' shells, in the hip's frame (y down the thigh)
  const kn=new THREE.Group(); kn.name=sd<0?'kneeL':'kneeR'; kn.position.y=-thigh; hp.add(kn);
  // lower leg: the calf bulges out behind a straight shin, down to a slim ankle; a boot is the same surface, wider and painted
  const ak=t=>1/Math.pow(D.mk.c,(D.mk.p>0?1:0)*faceSm(0.3,0.9,t)), bs=(boot?[[0.5,0.041*cw,0.044*cw,0.007],[0.6,0.045*cw,0.048*cw,0.005],[0.66,0.042*cw,0.045*cw,0.005],[0.85,0.037*cw,0.039*cw],[1,0.033*cw,0.035*cw]]:[[0.5,0.04*cw,0.043*cw,0.007],[0.75,0.033*cw,0.035*cw],[1,0.028*cw,0.03*cw]]).map(r=>[r[0],r[1]*ak(r[0]),r[2]*ak(r[0]),r[3]]);   // the ankle (and a boot's opening) comes back down to today's size from the calf's peak
  // the shin is the bottoms' down to where the boots begin (tb, a fraction of the shin) and the shoes' below it; a whole outfit paints all of it. Sampling the bottoms' paint no lower than its own boot top
  // keeps another outfit's boots from showing under it
  const tb=kS?ofBootTop(kS):(L.shoes==='boots'?0.6:L.shoes==='tallboots'?0.08:L.shoes==='furboots'?0.3:L.shoes==='sabatons'?0.6:1.1), same=kB&&kB===kS, kcut=(k,low)=>((k&&k.cuts&&k.cuts.shin)||[]).filter(t=>(t<tb)===low);
  const sv=pc(limb([[0,KR,KR*1.04],[0.14,0.0505*cw,0.054*cw,0.005],[0.3,0.052*cw,0.057*cw,0.011]].concat(bs),shin,sg(24),sg(28),{cuts:(!kS&&(L.shoes==='boots'||L.shoes==='sabatons')?[0.6]:[]).concat(L.bottom==='breeches'?[0.14]:[],same?(kB.cuts&&kB.cuts.shin)||[]:kcut(kB,true).concat(kcut(kS,false)))}),(x,y,z,c)=>{ const t=-y/shin;
    if(same) ofPaint(X,t<tb?'bottom':'shoes','shin',c,x,y,z,sd);
    else if(t<tb){ if(kB) ofPaint(X,'bottom','shin',c,x,-Math.min(t,ofBootTop(kB)-0.02)*shin,z,sd); else if(L.bottom==='trousers'||L.bottom==='greaves'||L.bottom==='hakama'||(L.bottom==='breeches'&&t<0.14)) botPaint(c,x,y); else skinPaint(c); }
    else if(kS) ofPaint(X,'shoes','shin',c,x,y,z,sd);
    else if(L.shoes==='none'||L.shoes==='sandals'||L.shoes==='geta') skinPaint(c);
    else c.set(L.shoeColor); },-thigh);
  const parts=[sv];
  if(L.bottomStyle==='plate') parts.push(pc(csph(0.066*lr,sg(14),sg(10)).scale(1,0.9,0.8).translate(0,0,-0.03),c=>c.set(L.bottomColor).multiplyScalar(1.1)));   // a knee plate
  const foot=buildFoot(X,D,sd,boot); foot.translate(0,-shin,0); parts.push(foot);
  parts.push(...gmxShin(X,D,sd));   // breeches' knee bands, leggings' plates, geta, fur boots and sabatons (model-garments-more.js)
  parts.push(...gmShin(X,D,sd));   // base trouser cuffs, laces, straps (model-garments.js)
  if(X.kit) parts.push(...ofShin(X,sd,shin));   // boots over the shin, greaves, bells, in the knee's frame (y down the shin; the ankle is y = -D.shin)
  const m2=new THREE.Mesh(merge(parts),matChar); m2.castShadow=true; kn.add(m2);
  return [hp,kn];
}
