//@ Dresses (version 3.3): six crafted tops that carry their own skirt, naturally shaped (a hip curve, folds that deepen to the hem, a waved hem), the skirt swaying with the legs
/* A dress is a look.top id (shared/cospieces.js, slot t) with three parts: the torso paint (gmdPaint: skin above the bodice's top edge, the dress colour below), the bodice and its straps / sleeves / trim in
   the spine's frame (gmdTop, called from gmxTop) and the skirt in the hips' frame (gmdHips, called from gmHips; buildCharacter lists that mesh for clSway, character/cloth.js). Wearing a dress takes the bottom off
   (gmxAliasLook: bottom 'none', the briefs show where a short skirt lifts). Colours: gmxPalAt(L,'top') = [main, second, third, fourth] (GMX_PAL entries added below), tintable like any crafted top.
   GMD holds each dress's numbers: `top` the bodice's top edge as a share of the torso (the paint and the loft), `len` the hem as a share of the leg length, `hem` the hem radius as a multiple of the waist's, `curve` the
   silhouette from waist to hem (t 0..1 -> 0..1), `bulge` how far the hips swell first, `folds` {n, amp} (radial ripple that deepens towards the hem), `wave` how much the hem rises and falls, `tiers` ruffle ledges.
   owns: GMD, gmdIs, gmdPaint, gmdTop, gmdHips.   used by: model-garments-more.js (gmxTop, gmxSleeveless, GMX_PAL), model-garments.js (gmHips), model-body.js (clothPaints), modest.js.   test: tools/dresses-smoke.js */
const GMD={
  sundress:{top:0.44,len:0.34,hem:1.55,curve:t=>Math.pow(t,1.1),bulge:0.04,folds:{n:9,amp:0.05},wave:0.012,tiers:0,pal:tc=>[tc,0xf6efe2,gmxMul(tc,0.75)]},
  peasant:{top:0.5,len:0.56,hem:1.6,curve:t=>Math.pow(t,1.25),bulge:0.05,folds:{n:11,amp:0.06},wave:0.014,tiers:0,pal:tc=>[tc,0xf1e7cf,0x6a4a2c,gmxMul(tc,0.7)]},
  tiered:{top:0.46,len:0.52,hem:1.75,curve:t=>Math.pow(t,1.05),bulge:0.03,folds:{n:13,amp:0.05},wave:0.02,tiers:3,pal:tc=>[tc,gmxMul(tc,1.18),0xf6efe2]},
  mermaid:{top:0.42,len:0.96,hem:1.85,curve:t=>t<0.5?0.12*t/0.5:0.12+0.88*Math.pow((t-0.5)/0.5,1.7),bulge:0.06,folds:{n:9,amp:0.05},wave:0.03,tiers:0,pal:tc=>[tc,0xe8c870,0xf6efe2]},
  ballgown:{top:0.41,len:0.97,hem:2.7,curve:t=>1-Math.pow(1-t,2.1),bulge:0.03,folds:{n:15,amp:0.07},wave:0.035,tiers:0,pal:tc=>[tc,0xe8c870,0xf6efe2]},
  wrapdress:{top:0.53,len:0.5,hem:1.5,curve:t=>Math.pow(t,1.2),bulge:0.05,folds:{n:7,amp:0.045},wave:0.03,tiers:0,pal:tc=>[tc,gmxMul(tc,1.25),0xe8c870]}
};
const GMD_EDGES={sundress:[0.9],peasant:[0.93],tiered:[1/3,1/3+0.04,2/3,2/3+0.04,0.96],mermaid:[0.62,0.66,0.96],ballgown:[0.9,0.94],wrapdress:[0.95]};   // where a skirt's colour changes (t, 0 waist .. 1 hem)
for(const id of Object.keys(GMD)) GMX_PAL.top[id]=GMD[id].pal;
const gmdIs=t=>typeof t==='string'&&Object.prototype.hasOwnProperty.call(GMD,t);
// the dress paints the torso: skin above the bodice's top edge (v is the share of the torso, 0 at the waist), the main colour below; a back-hung wrap shows a little cleavage line in the front colour
const gmdTopAt=(L,id)=>Math.min(0.62,GMD[id].top*sliderVal(L,'neckline'));   // the bodice's top edge, moved by the Neckline slider
const gmdPaint=(L,c,u,v)=>{ if(v>gmdTopAt(L,L.top)) c.set(L.skin); else c.set(L.topColor); };
// the bodice: a snug shell over the torso from the waist to its top edge, straps, sleeves, ties and trim, in the spine's frame
function gmdTop(X,D){
  const {L,sg}=X, id=L.top, G=Object.assign({},GMD[id],{top:gmdTopAt(L,id)}), TK=D.TK, nr=D.neckR, PL=gmxPalAt(L,'top'), tc=L.topColor, out=[], fz=yd=>-(torsoSize(X,D,yd).rz+0.004), bz=yd=>torsoSize(X,D,yd).rzBack+0.004;
  const ys=[]; for(let i=0;i<=6;i++) ys.push(0.02+(G.top-0.045)*i/6); ys.push(G.top-0.027,G.top-0.024,G.top);   // (two rows a hair apart at the trim's lower edge: a crisp line, not a gradient)
  const rows=ys.map(yd=>{ const t=torsoSize(X,D,yd), m=0.009; return {y:yd*TK,rx:t.rx+m,rz:Math.max(t.rz,t.rzBack)+m}; });
  out.push(pc(ofLoft(rows,sg(40),0,TAU),(x,y,z,c)=>{ c.set(tc); const t=y/TK; if(t>G.top-0.025) c.set(PL[1]); else if(t<0.045) c.multiplyScalar(0.8); c.multiplyScalar(0.96+0.04*Math.sin(Math.atan2(x,z)*6)); }));   // (the first row sits at the waist: the skirt's rim covers its lower edge)
  const edge=(yd,hex)=>out.push(gmBand(X,D,yd+0.004,yd-0.014,(x,y,z,c)=>c.set(hex),0.013));   // a thin trim that follows the body's oval (a round ring floated out at the sides)
  if(id==='sundress'){
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*0.075,G.top*TK,fz(G.top)-0.004],[sd*0.06,0.5*TK,fz(0.5)-0.004],[sd*nr*1.3,0.575*TK,-nr*0.45],[sd*0.075,0.5*TK,bz(0.5)+0.004],[sd*0.075,G.top*TK,bz(G.top)+0.004]],0.018,{up:[0,1,0],seg:sg(12),th:0.004}),PL[1]));   // thin shoulder straps
    edge(G.top,PL[1]);
    for(const sd of [-1,1]) out.push(solid(csph(0.0075,5,4).translate(sd*0.06,0.5*TK,fz(0.5)-0.007),PL[2]));   // a button on each strap
  } else if(id==='peasant'){
    edge(G.top,PL[1]);
    for(const sd of [-1,1]){ const cx=sd*(D.shX+0.006), cy=D.shY-0.01, R=0.05*D.aw+0.012;   // gathered puff sleeves round the shoulder ball (wider than the arm's own ball, so they show), pleated, with a band at the bottom
      out.push(pc(csph(R,sg(16),sg(10)).scale(1,0.95,1.05).translate(cx,cy,0),(x,y,z,c)=>{ c.set(PL[1]).multiplyScalar(0.86+0.14*Math.abs(Math.sin(Math.atan2(x-cx,z)*7))); if(y<cy-R*0.62) c.set(PL[2]); }));
      out.push(solid(gmRingAt([cx,cy-R*0.7,0],[sd*0.15,1,0],R*0.72,0.004,sg(8)),PL[2])); }
    for(let i=0;i<sg(16);i++){ const a=(i/sg(16)-0.5)*2.6, t=torsoSize(X,D,G.top+0.012); out.push(solid(csph(0.011,5,4).scale(1.2,0.8,0.7).translate(Math.sin(a)*(t.rx+0.012),(G.top+0.012)*TK,-Math.cos(a)*(t.rz+0.01)),PL[1])); }   // the chemise's frill along the neckline
    out.push(solid(csph(0.008,sg(6),sg(5)).scale(1.5,1,0.7).translate(0,(G.top-0.01)*TK,fz(G.top)-0.012),PL[2]));
    for(const sd of [-1,1]) out.push(solid(sweepTube([[0,(G.top-0.01)*TK,fz(G.top)-0.013],[sd*0.008,(G.top-0.045)*TK,fz(G.top-0.04)-0.013],[sd*0.004,(G.top-0.08)*TK,fz(G.top-0.08)-0.012]],[0.0022,0.0022,0.0018],4,{cap:'round',rings:5}),PL[2]));   // the drawstring's two ends
    for(let i=0;i<5;i++){ const yd=0.4-i*0.07; out.push(solid(ofRibbon([[-0.026,yd*TK,fz(yd)-0.008],[0,(yd-0.028)*TK,fz(yd)-0.01],[0.026,yd*TK,fz(yd)-0.008]],0.006,{up:[0,0,-1],seg:4,th:0.003}),PL[2])); }   // a laced front
  } else if(id==='tiered'){
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*0.07,G.top*TK,fz(G.top)-0.005],[sd*0.05,0.5*TK,fz(0.5)-0.004],[sd*nr*1.15,0.565*TK,-nr*0.55],[sd*nr*0.5,0.585*TK,nr*1.25]],0.016,{up:[0,1,-0.3],seg:sg(10),th:0.003}),PL[2]));   // halter straps to a knot behind the neck
    out.push(solid(csph(0.011,sg(8),sg(6)).translate(0,0.585*TK,nr*1.35),PL[2])); edge(G.top,PL[2]);
    out.push(solid(csph(0.012,sg(8),sg(6)).scale(1.4,1,0.7).translate(0,0.13*TK,fz(0.13)-0.008),PL[2]));   // a small bow at the waist
  } else if(id==='mermaid'){
    edge(G.top,PL[1]); edge(G.top-0.03,PL[1]);
    for(const sd of [-1,1]) out.push(solid(csph(0.012,sg(8),sg(6)).translate(sd*torsoSize(X,D,0.3).rx*0.5,0.36*TK,fz(0.36)-0.009),PL[2]));   // two pearls on the bust
    out.push(solid(csph(0.016,sg(8),sg(6)).scale(1,0.8,0.7).translate(0,0.17*TK,fz(0.17)-0.01),PL[1]));
  } else if(id==='ballgown'){
    edge(G.top,PL[1]); edge(G.top-0.045,PL[2]);
    for(const sd of [-1,1]){ out.push(pc(ofLoft([{y:0.43*TK,rx:0.03*D.aw+0.006,rz:0.03*D.aw+0.006},{y:0.43*TK-0.035,rx:0.034*D.aw+0.01,rz:0.034*D.aw+0.01},{y:0.43*TK-0.075,rx:0.03*D.aw+0.008,rz:0.03*D.aw+0.008}],sg(14),0,TAU).translate(sd*(D.shX+0.004),0,0),(x,y,z,c)=>c.set(PL[2]).multiplyScalar(y<0.43*TK-0.065?0.86:1)));   // off-the-shoulder puffs
      out.push(solid(csph(0.011,sg(8),sg(6)).translate(sd*0.05,0.33*TK,fz(0.33)-0.008),PL[1])); }
    out.push(solid(csph(0.022,sg(8),sg(6)).scale(1.3,1,0.7).translate(0,0.1*TK,bz(0.1)+0.016),PL[1]));   // the bow at the back
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*0.03,0.1*TK,bz(0.1)+0.02],[sd*0.07,0.0,bz(0.05)+0.04],[sd*0.085,-0.12,bz(0.03)+0.05]],0.03,{up:[0,0,1],seg:sg(8),th:0.004}),PL[1]));
  } else if(id==='wrapdress'){
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*nr*1.15,0.57*TK,fz(0.55)-0.004],[sd*nr*1.6,0.5*TK,fz(0.5)-0.007],[-sd*0.02,0.3*TK,fz(0.3)-0.009+(sd>0?-0.003:0)],[-sd*0.045,0.1*TK,fz(0.1)-0.01+(sd>0?-0.003:0)]],0.04,{up:[0,0,-1],seg:sg(14),th:0.005}),sd>0?PL[1]:gmxMul(tc,0.85)));   // the crossed lapels
    out.push(gmBand(X,D,0.14,0.07,(x,y,z,c)=>c.set(PL[2]),0.012));   // the sash
    out.push(solid(csph(0.02,sg(8),sg(6)).scale(1.2,1,0.7).translate(0.08,0.1*TK,fz(0.1)-0.012),PL[2]));
    for(const sd of [0,1]) out.push(solid(ofRibbon([[0.08,0.1*TK,fz(0.1)-0.016],[0.1+sd*0.015,0.02,fz(0.03)-0.02],[0.11+sd*0.03,-0.1-sd*0.04,fz(0.0)-0.018]],0.026,{up:[0,0,-1],seg:sg(8),th:0.004}),PL[2]));   // the bow's tails
    out.push(solid(gmRingAt([0,0.572*TK,0],[0,1,0],nr*1.5,0.007,sg(8)),PL[1]));
  }
  return out;
}
// the skirt, in the hips' frame: rings from the waist to the hem, radius = the waist's + (the hem's - the waist's) * the silhouette curve, a hip swell first, folds that deepen towards the hem, a waved hem
function gmdHips(X,D){
  const {L,sg}=X, id=L.top, G=GMD[id], PL=gmxPalAt(L,'top'), tc=L.topColor, s0=torsoSize(X,D,0.03), rz0=Math.max(s0.rz,s0.rzBack)+0.012, rx0=Math.max(s0.rx+0.014,D.hx+0.09);
  const len=Math.min(G.len*X.S.skirtLen*D.hipY,D.hipY-0.05), rows=sg(22), seg=sg(48), geo=[], R=[], TS=[];
  for(let i=0;i<=rows;i++) TS.push(i/rows);
  for(const b of GMD_EDGES[id]){ TS.push(Math.min(1,b)); if(b>0.004) TS.push(b-0.004); }   // a colour edge gets two rows a hair apart: a crisp line, not a gradient across a whole row
  TS.sort((a,b)=>a-b);
  for(const t of TS){ const sw=G.bulge*Math.sin(Math.PI*Math.min(1,t/0.35)), k=G.curve(t)*(G.hem*X.S.skirtFlare-1)+1+sw, tier=G.tiers?Math.pow(((t*G.tiers)%1+1)%1,1.6)*0.16*(G.hem-1)*0.5:0;
    R.push({y:0.03-len*t,rx:rx0*(k+tier),rz:rz0*(k+tier)*0.92}); }
  const g=ofLoft(R,seg,0,TAU), p=g.attributes.position, n=p.count, TW=(t,a)=>G.wave*Math.pow(t,2.5)*Math.sin(a*3+1);
  for(let i=0;i<n;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), t=Math.min(1,Math.max(0,(0.03-y)/len)), a=Math.atan2(x,z), f=G.folds.amp*Math.pow(t,1.25)*(Math.sin(G.folds.n*a)*0.7+Math.sin(G.folds.n*a*2.3+1.3)*0.3), w=TW(t,a);
    p.setX(i,x*(1+f)); p.setZ(i,z*(1+f)); p.setY(i,y+w+(id==='wrapdress'?0.05*t*t*Math.max(0,Math.sin(a-2.2)):0)); }
  smoothN(g);
  geo.push(pc(g,(x,y,z,c)=>{ const t0=Math.min(1,Math.max(0,(0.03-y)/len)), t=Math.min(1,Math.max(0,(0.03-y+TW(t0,Math.atan2(x,z)))/len)); c.set(tc);   // t: the share of the length before the hem's wave moved the vertex
    if(id==='tiered'){ const u=(((t+0.0008)*G.tiers)%1+1)%1; c.set(u<0.12&&t<0.999?PL[1]:tc).multiplyScalar(0.88+0.12*u); }
    else if(id==='sundress'){ if(t>0.899) c.set(PL[1]); else c.multiplyScalar(0.95+0.05*Math.sin(Math.atan2(x,z)*14)); }
    else if(id==='peasant'){ if(t>0.929) c.set(PL[3]); }
    else if(id==='mermaid'){ if(t>0.619&&t<0.659) c.set(PL[1]); if(t>0.959) c.set(PL[1]); }
    else if(id==='ballgown'){ if(t>0.939) c.set(PL[1]); else if(t>0.899) c.set(PL[2]); c.multiplyScalar(0.93+0.07*Math.sin(Math.atan2(x,z)*15)); }
    else if(id==='wrapdress'){ if(t>0.949) c.set(PL[1]); }
    if(t<0.1) c.multiplyScalar(0.84+t*1.5); }));
  if(id==='peasant') geo.push(pc(ofLoft(R.map(r=>({y:r.y,rx:r.rx*0.97,rz:r.rz*1.04})),sg(14),Math.PI-0.55,Math.PI+0.55),(x,y,z,c)=>{ c.set(PL[1]); const t=(0.03-y)/len; if(t>0.92) c.set(PL[2]); }));   // the apron panel, a little proud of the skirt
  geo.push(pc(ofLoft([{y:0.04,rx:rx0*1.01,rz:rz0*1.01},{y:0.03,rx:rx0*1.035,rz:rz0*1.035},{y:-0.012,rx:rx0*1.035,rz:rz0*1.035},{y:-0.022,rx:rx0*1.012,rz:rz0*1.012}],sg(40),0,TAU),c=>c.set(PL[1])));   // the waistband (the skirt's rim)
  return geo;
}
