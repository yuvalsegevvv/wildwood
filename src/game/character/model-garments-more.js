//@ The crafted tops, bottoms and shoes (version 3.2): robe, poncho, jerkin, crop top, halter wrap and harness; breeches, hakama, plated leggings, loincloth, short shorts and a slit wrap skirt; geta, fur-lined boots and sabatons
/* Same contract as model-garments.js (the base garments): each look.top / look.bottom / look.shoes id below adds painted geometry in the frame of the part it hangs from, called from the same four hooks:
   gmxTop(X,D) the spine's frame (from gmTop), gmxCuff(X,D,sd) the elbow's (gmCuff), gmxHips(X,D) the hips' (gmHips), gmxThigh(X,D,sd) the hip joint's, y down the thigh (buildLeg), gmxShin(X,D,sd) the knee's (gmShin).
   The body's own paint comes from clothPaints / buildLeg (model-body.js, which read gmxOpenTop and gmxBareBottom here): a top that leaves the midriff or the shoulders bare paints skin there (and the woman's band top under a harness),
   a bottom that leaves the hips open (loincloth, wrap skirt) leaves the body's briefs showing (UNDER_COL), so nothing is ever left undressed.
   Every piece is meant for any body: the lists are unisex and the shapes follow the sliders (torsoSize).
   owns: GMX_TOPS, GMX_BOTTOMS, GMX_SHOES, gmxTop, gmxCuff, gmxHips, gmxThigh, gmxShin, gmxSkirtKind, gmxBareBottom, gmxSleeveless.   used by: model-garments.js, model-body.js, ui/character-editor.js.   test: tools/cospieces-smoke.js */
const GMX_TOPS=CP_PIECES.filter(r=>r[0]==='t').map(r=>[r[1],r[2],r[4]]), GMX_BOTTOMS=CP_PIECES.filter(r=>r[0]==='b').map(r=>[r[1],r[2],r[4]]), GMX_SHOES=CP_PIECES.filter(r=>r[0]==='s').map(r=>[r[1],r[2],r[4]]);
// the body shows where the garment is open: the bare top ids and the bottoms whose hips stay open over the briefs
const gmxSleeveless=t=>t==='halter'||t==='harness', gmxBareBottom=b=>b==='loincloth'||b==='wrapskirt', gmxSkirtKind=b=>b==='hakama'||b==='wrapskirt';
const GMX_STEEL=0xb9bdc2, GMX_LEATHER=0x5a3a22, GMX_BRASS=0xc9a13a;
const gmxMul=(hex,m)=>new THREE.Color(hex).multiplyScalar(m).getHex();
// the colours of a crafted top or bottom (the same four slots as a set's piece: tintTop2..4 / tintBottom2..4): [main, second, third, fourth], each default derived from the main colour
const GMX_PAL={
  top:{crop:tc=>[tc,0xf4efe6,gmxMul(tc,0.7)],halter:tc=>[tc,0xe8c24a,gmxMul(tc,0.7)],harness:tc=>[tc,GMX_LEATHER,GMX_BRASS],robe:tc=>[tc,0x7a2a3a,new THREE.Color(tc).lerp(new THREE.Color(0xffffff),0.35).getHex()],
    poncho:tc=>[tc,0xe8d9b0,gmxMul(tc,0.7)],jerkin:tc=>[tc,0xe8d9b0,GMX_BRASS,0x3a2a1c]},
  bottom:{breeches:tc=>[tc,0x4a3626,GMX_BRASS,gmxMul(tc,0.72)],shortshorts:tc=>[tc,gmxMul(tc,0.6),0xe8e4dc,GMX_STEEL],wrapskirt:tc=>[tc,gmxMul(tc,0.5),gmxMul(tc,0.5)],
    hakama:tc=>[tc,0xe8e4dc,gmxMul(tc,0.75),0xe8e4dc],loincloth:tc=>[tc,0x4a3626,GMX_BRASS,0xe8d9b0],greaves:tc=>[tc,0x4a3626,GMX_BRASS,GMX_STEEL]}
};
function gmxPalDef(L,slot){ const t=GMX_PAL[slot], id=L[slot]; return t&&typeof id==='string'&&Object.prototype.hasOwnProperty.call(t,id)?t[id](slot==='top'?L.topColor:L.bottomColor):[]; }
function gmxPalAt(L,slot){ return gmxPalDef(L,slot).map((c,i)=>{ if(!i) return c; const v=L[OF_TINTX[slot][i-1]]; return typeof v==='number'&&v>=0&&v<=0xffffff?Math.floor(v):c; }); }
// a strap that follows the body's front (or back) from design height y0 to y1 and from x0 to x1: pts along it, lifted a little off the cloth
function gmxStrap(X,D,y0,y1,x0,x1,back,n){
  const pts=[]; for(let i=0;i<=(n||6);i++){ const t=i/(n||6), yd=y0+(y1-y0)*t, ts=torsoSize(X,D,yd); pts.push([x0+(x1-x0)*t,yd*D.TK,back?(ts.rzBack+0.007):-(ts.rz+0.007)]); }
  return pts;
}
// ---- tops, in the spine's frame ----
function gmxTop(X,D){
  const {L,sg}=X, TK=D.TK, nr=D.neckR, top=L.top, out=[], tc=L.topColor, PL=gmxPalAt(L,'top'), dk=gmxMul(tc,0.7), lt=new THREE.Color(tc).lerp(new THREE.Color(0xffffff),0.35).getHex(), fz=yd=>-(torsoSize(X,D,yd).rz+0.004), bz=yd=>torsoSize(X,D,yd).rzBack+0.004;
  if(top==='crop'){
    out.push(gmBand(X,D,0.3,0.275,(x,y,z,c)=>c.set(PL[1]),0.004));   // the ribbed hem, high on the ribs
    out.push(solid(gmRingAt([0,0.572*TK,0],[0,1,0],nr*1.4,0.0065,sg(8)),PL[2]));   // the collar
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*nr*1.5,0.575*TK,fz(0.5)],[sd*nr*2.4,0.545*TK,fz(0.5)-0.002],[sd*nr*3.0,0.5*TK,fz(0.47)]],0.012,{up:[0,1,-0.4],seg:sg(6),th:0.003}),PL[2]));
  } else if(top==='halter'){
    const cz=fz(0.34);
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*0.07,0.43*TK,fz(0.43)-0.005],[sd*0.05,0.495*TK,fz(0.5)-0.004],[sd*nr*1.15,0.565*TK,-nr*0.55],[sd*nr*0.5,0.585*TK,nr*1.25]],0.017,{up:[0,1,-0.3],seg:sg(10),th:0.003}),PL[2]));   // the straps up to the knot behind the neck
    out.push(solid(csph(0.011,sg(8),sg(6)).translate(0,0.585*TK,nr*1.35),PL[2]));
    out.push(gmBand(X,D,0.435,0.41,(x,y,z,c)=>c.set(PL[1]),0.004),gmBand(X,D,0.285,0.26,(x,y,z,c)=>c.set(PL[1]),0.004));   // the wrap's top and bottom edges
    out.push(solid(csph(0.0105,sg(8),sg(6)).scale(1.3,1,0.8).translate(0,0.345*TK,cz-0.006),PL[2]),solid(ofRibbon([[0,0.34*TK,cz-0.008],[0.012,0.31*TK,cz-0.01],[0.01,0.27*TK,cz-0.01]],0.012,{up:[0,0,-1],seg:sg(6),th:0.003}),PL[2]));   // the knot between the cups, with a tail
    for(const sd of [-1,1]) out.push(solid(gmRingAt([0,0.35*TK,0],[0,1,0],torsoSize(X,D,0.35).rx*0.98,0.0015,sg(6)),PL[1]));
  } else if(top==='harness'){
    for(const sd of [-1,1]){
      out.push(solid(ofRibbon(gmxStrap(X,D,0.5,0.1,sd*0.07,-sd*0.1,false),0.03,{up:[0,0,-1],seg:sg(14),th:0.006}),PL[1]));
      out.push(solid(ofRibbon(gmxStrap(X,D,0.5,0.1,sd*0.07,-sd*0.1,true),0.03,{up:[0,0,1],seg:sg(14),th:0.006}),PL[1]));
      out.push(solid(ofRibbon([[sd*0.07,0.5*TK,fz(0.5)-0.004],[sd*D.shX*0.7,0.5*TK+0.015,0],[sd*0.07,0.5*TK,bz(0.5)]],0.03,{up:[0,1,0],seg:sg(8),th:0.006}),PL[1]));   // over the shoulder
      for(const yd of [0.43,0.3,0.18]){ const t=(0.5-yd)/0.4, x=lerp(sd*0.07,-sd*0.1,t); out.push(solid(csph(0.0055,sg(6),sg(5)).translate(x,yd*TK,fz(yd)-0.012),PL[2])); }
    }
    out.push(solid(gmRingAt([0,0.33*TK,fz(0.33)-0.012],[0,0,1],0.017,0.0045,sg(8)),PL[2]));   // the ring where the straps cross
    out.push(gmBand(X,D,0.07,0.035,(x,y,z,c)=>c.set(PL[1]),0.007),solid(vbox(0.03,0.026,0.008,0,0.052*TK,fz(0.05)-0.008),PL[2]));
  } else if(top==='robe'){
    const trim=PL[2];
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*nr*1.15,0.57*TK,fz(0.55)-0.004],[sd*nr*1.6,0.5*TK,fz(0.5)-0.007],[-sd*0.02,0.3*TK,fz(0.3)-0.009+(sd>0?-0.003:0)],[-sd*0.045,0.14*TK,fz(0.14)-0.01+(sd>0?-0.003:0)]],0.042,{up:[0,0,-1],seg:sg(14),th:0.005}),sd>0?trim:gmxMul(tc,0.82)));   // the crossed lapels
    out.push(gmBand(X,D,0.2,0.1,(x,y,z,c)=>c.set(PL[1]),0.009));   // the wide sash
    out.push(solid(csph(0.02,sg(8),sg(6)).scale(1.2,1,0.7).translate(0.06,0.15*TK,bz(0.15)+0.014),PL[1]));
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*0.03,0.15*TK,bz(0.15)+0.02],[sd*0.06,0.08*TK,bz(0.1)+0.03],[sd*0.07,0.0,bz(0.05)+0.035]],0.026,{up:[0,0,1],seg:sg(8),th:0.004}),PL[1]));   // the bow's tails
    out.push(solid(gmRingAt([0,0.572*TK,0],[0,1,0],nr*1.5,0.008,sg(8)),trim));
    const s0=torsoSize(X,D,0.03), r0=Math.max(s0.rz,s0.rzBack)+0.012, len=0.62*X.S.legs;   // the skirt of the robe, to the calf, a split a hand wide at the front hem
    out.push(pc(ofLoft([{y:0.02,rx:s0.rx+0.014,rz:r0},{y:-0.1,rx:s0.rx+0.05,rz:r0+0.04},{y:-0.32,rx:s0.rx+0.085,rz:r0+0.065},{y:-len+0.062,rx:s0.rx+0.108,rz:r0+0.075},{y:-len+0.058,rx:s0.rx+0.109,rz:r0+0.0755},{y:-len+0.047,rx:s0.rx+0.111,rz:r0+0.077},{y:-len+0.043,rx:s0.rx+0.1115,rz:r0+0.0775},{y:-len,rx:s0.rx+0.115,rz:r0+0.08}],sg(36),0.1,TAU-0.1),(x,y,z,c)=>{ c.set(tc); if(y<-len+0.045) c.copy(new THREE.Color(trim)); else if(y<-len+0.06) c.multiplyScalar(0.7); c.multiplyScalar(0.94+0.06*Math.sin(Math.atan2(x,z)*12)); }));
  } else if(top==='poncho'){
    const rows=[[0.57,nr*1.9,nr*1.9],[0.5,D.shX*0.85,D.shX*0.6],[0.42,D.shX+0.075,0.14*D.B+0.045],[0.27,D.shX+0.12,0.14*D.B+0.075],[0.12,D.shX+0.15,0.14*D.B+0.095],[0.0,D.shX+0.165,0.14*D.B+0.105]].map(([yd,rx,rz])=>({y:yd*TK,rx,rz}));
    out.push(pc(ofLoft(rows,sg(40),0,TAU),(x,y,z,c)=>{ c.set(tc); const t=y/TK, k=(((t*22)%1)+1)%1; if(k<0.16) c.multiplyScalar(0.7); else if(k>0.5&&k<0.62) c.lerp(new THREE.Color(PL[1]),0.55); if(t<0.03) c.multiplyScalar(0.8); c.multiplyScalar(0.94+0.06*Math.sin(Math.atan2(x,z)*14)); }));
    for(let i=0;i<sg(30);i++){ const a=i/sg(30)*TAU, r=rows[rows.length-1]; out.push(solid(sweepTube([[Math.sin(a)*r.rx,0,Math.cos(a)*r.rz],[Math.sin(a)*(r.rx+0.004),-0.025,Math.cos(a)*(r.rz+0.004)],[Math.sin(a)*(r.rx+0.006),-0.05,Math.cos(a)*(r.rz+0.006)]],[0.0032,0.0028,0.0014],4,{cap:'round',rings:4}),0xe8d9b0)); }   // the fringe
    out.push(solid(gmRingAt([0,0.575*TK,0],[0,1,0],nr*1.9,0.007,sg(8)),PL[2]));   // the neck slit's stitched rim
  } else if(top==='jerkin'){
    const rows=[0.52,0.44,0.3,0.18,0.07,0.0].map(yd=>{ const t=torsoSize(X,D,yd), m=0.011; return {y:yd*TK,rx:t.rx+m,rz:Math.max(t.rz,t.rzBack)+m}; });
    out.push(pc(ofLoft(rows,sg(36),0.3,TAU-0.3),(x,y,z,c)=>{ c.set(tc); const k=Math.abs(Math.atan2(x,-z)); if(k>2.4) c.multiplyScalar(0.84); if(y<0.04*TK) c.multiplyScalar(0.78); if(y>0.5*TK) c.multiplyScalar(0.82); }));   // the leather body, open a hand's width in the middle of the front for the lacing
    for(let i=0;i<6;i++){ const yd=0.46-i*0.07; out.push(solid(ofRibbon([[-0.026,yd*TK,fz(yd)-0.012],[0,(yd-0.03)*TK,fz(yd)-0.014],[0.026,yd*TK,fz(yd)-0.012]],0.007,{up:[0,0,-1],seg:4,th:0.003}),PL[1])); out.push(solid(csph(0.004,5,4).translate(-0.028,yd*TK,fz(yd)-0.01),PL[2]),solid(csph(0.004,5,4).translate(0.028,yd*TK,fz(yd)-0.01),PL[2])); }   // the criss-cross lacing and its eyelets
    for(const sd of [-1,1]){ for(const yd of [0.4,0.22,0.08]) out.push(solid(csph(0.0048,5,4).translate(sd*torsoSize(X,D,yd).rx*0.55,yd*TK,fz(yd)-0.0155),PL[2])); out.push(solid(csph(0.0048,5,4).translate(sd*torsoSize(X,D,0.4).rx*0.55,0.4*TK,fz(0.4)-0.0155),PL[2]));
      out.push(solid(ofRibbon([[sd*0.05,0.525*TK,fz(0.5)-0.006],[sd*D.shX*0.7,0.535*TK,0],[sd*0.05,0.525*TK,bz(0.5)+0.004]],0.03,{up:[0,1,0],seg:sg(8),th:0.004}),gmxMul(tc,0.85))); }   // shoulder straps
    out.push(gmBand(X,D,0.045,0.01,(x,y,z,c)=>c.set(PL[3]),0.013));
  }
  return out;
}
// ---- the cuffs, in the elbow's frame (y down the forearm) ----
function gmxCuff(X,D,sd){
  const {L,sg}=X, aw=D.aw, tc=L.topColor, PL=gmxPalAt(L,'top');
  if(L.top==='robe'){ const rows=[-0.12,-0.17,-0.215,-0.245].map((y,i)=>({y,rx:0.0235*aw+0.004+[0.0,0.02,0.04,0.052][i],rz:0.0235*aw+0.004+[0.0,0.02,0.04,0.052][i]}));
    return [pc(ofLoft(rows,sg(22),0,TAU),(x,y,z,c)=>{ c.set(tc); if(y<-0.235) c.set(PL[2]); else if(y<-0.22) c.set(PL[1]); })]; }   // a wide hanging sleeve
  if(L.top==='crop') return [solid(gmRingAt([0,-0.13,0],[0,1,0],0.0375*aw+0.003,0.004,sg(7)),PL[2])];
  return [];
}
// ---- the hips' frame ----
function gmxHips(X,D){
  const {L,sg}=X, TK=D.TK, b=L.bottom, tc=L.bottomColor, PL=gmxPalAt(L,'bottom'), out=[], s0=torsoSize(X,D,0.03), rz=Math.max(s0.rz,s0.rzBack)+0.012, leg=X.S.legs, dk=gmxMul(tc,0.55), lt=new THREE.Color(tc).lerp(new THREE.Color(0xffffff),0.35).getHex();
  const belt=(hex,w,y)=>out.push(pc(ofLoft([{y:y*TK,rx:s0.rx+0.012,rz},{y:y*TK-w,rx:s0.rx+0.014,rz:rz+0.002}],sg(28),0,TAU),c=>c.set(hex)));
  if(b==='breeches'||b==='greaves'){ belt(PL[1],0.034,0.052); out.push(solid(vbox(0.034,0.028,0.008,0,0.036*TK,-rz-0.004),PL[2])); }
  else if(b==='shortshorts'){
    belt(PL[1],0.026,0.018);   // a low-slung waistband
    for(const sd of [-1,1]) out.push(solid(sweepTube([[sd*0.012,0.0,-rz-0.004],[sd*0.02,-0.04,-rz-0.008],[sd*0.016,-0.075,-rz-0.006]],[0.0028,0.0026,0.0016],4,{cap:'round',rings:6}),PL[2]));   // the drawstring
    out.push(solid(csph(0.0045,5,4).translate(-0.012,-0.002,-rz-0.004),PL[3]),solid(csph(0.0045,5,4).translate(0.012,-0.002,-rz-0.004),PL[3]));
  } else if(b==='hakama'){
    belt(PL[1],0.03,0.11); belt(gmxMul(tc,0.7),0.05,0.075);
    out.push(pc(vbox(0.1,0.14,0.012,0,0.0,rz+0.01).rotateX(-0.12),c=>c.set(PL[2])));   // the stiff back plate
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*0.03,0.085*TK,-rz-0.008],[sd*0.05,0.02*TK,-rz-0.012],[sd*0.06,-0.1,-rz-0.01]],0.022,{up:[0,0,-1],seg:sg(8),th:0.004}),PL[3]));   // the ties hanging in front
  } else if(b==='wrapskirt'){
    belt(PL[1],0.05,0.075);   // the sash
    out.push(solid(csph(0.02,sg(8),sg(6)).scale(1.3,1,0.7).translate(0.09,0.05*TK,-rz-0.012),PL[1]));
    for(const sd of [0,1]) out.push(solid(ofRibbon([[0.09,0.05*TK,-rz-0.014],[0.11+sd*0.015,-0.02,-rz-0.02],[0.12+sd*0.03,-0.13-sd*0.04,-rz-0.016]],0.024,{up:[0,0,-1],seg:sg(8),th:0.004}),PL[2]));
  } else if(b==='loincloth'){
    belt(PL[1],0.034,0.06); out.push(solid(vbox(0.036,0.03,0.008,0,0.044*TK,-rz-0.004),PL[2]));
    for(const [a0,a1,len] of [[Math.PI-0.55,Math.PI+0.55,0.42],[-0.5,0.5,0.34]]){   // a long front flap and a shorter back one
      const hm=len*leg, rows=[0,-0.08,-0.2,-hm+0.05,-hm+0.045,-hm+0.032,-hm+0.028,-hm].map((y,i)=>({y,rx:s0.rx+0.016+Math.min(3,i)*0.004,rz:rz+0.006+Math.min(3,i)*0.014}));
      out.push(pc(ofLoft(rows,sg(14),a0,a1),(x,y,z,c)=>{ c.set(tc); if(y<-hm+0.03) c.set(PL[3]).multiplyScalar(0.9); else if(y<-hm+0.047) c.multiplyScalar(0.7); const t=-y/hm; if(Math.abs(x)<0.006&&t>0.3) c.multiplyScalar(0.8); })); }
    out.push(solid(csph(0.012,sg(6),sg(5)).translate(0.1,0.0,-rz*0.5),PL[2]));
  }
  return out;
}
// ---- the thigh's frame (y down the thigh): the plates of the leggings ----
function gmxThigh(X,D,sd){
  const {L,sg}=X, tw=D.tw, thigh=D.thigh;
  if(L.bottom!=='greaves') return [];
  const PL=gmxPalAt(L,'bottom');
  const r=y=>0.082*tw-0.02*(y/thigh)+0.006, rows=[0.1,0.18,0.3,0.4].map(y=>({y:-y*thigh/0.46*0.46,rx:r(y*thigh/0.46)*0.97,rz:r(y*thigh/0.46)*1.02}));
  return [pc(ofLoft(rows,sg(14),Math.PI-0.95,Math.PI+0.95),(x,y,z,c)=>{ c.set(PL[3]); const k=((-y*thigh*0+(-y)/thigh*5)%1+1)%1; c.multiplyScalar(0.7+0.4*Math.abs(Math.sin(Math.atan2(x,-z)*1.5))); if(k<0.1) c.multiplyScalar(0.68); }),
    solid(gmRingAt([0,-0.1*thigh/0.46,0],[0,1,0],r(0.1*thigh/0.46)+0.004,0.004,sg(6)),gmxMul(PL[3],0.8))];
}
// ---- the knee's frame (y down the shin; the ankle at -D.shin) ----
function gmxShin(X,D,sd){
  const {L,sg}=X, cw=D.cw, shin=D.shin, A=D.ankleH, out=[], kB=X.kit&&X.kit.sl.bottom, kS=X.kit&&X.kit.sl.shoes, b=kB?'':L.bottom, PL=gmxPalAt(L,'bottom'), sh=kS?'':L.shoes, sf=X.S.feet, lr=D.lr;
  if(b==='breeches') out.push(pc(ofLoft([{y:-shin*0.0,rx:0.052*cw+0.004,rz:0.056*cw+0.004},{y:-shin*0.14,rx:0.0505*cw+0.0065,rz:0.054*cw+0.0065}],sg(22),0,TAU),c=>c.set(PL[3])),solid(gmRingAt([0,-shin*0.13,0],[0,1,0],0.0505*cw+0.007,0.0035,sg(7)),PL[1]),solid(vbox(0.02,0.022,0.006,0,-shin*0.13,-(0.054*cw+0.01)),PL[2]));   // the buttoned band under the knee
  if(b==='greaves'){
    out.push(solid(csph(0.056*lr,sg(14),sg(10)).scale(1,0.85,0.7).translate(0,0.004,-0.036),PL[3]));   // the knee cop
    out.push(pc(ofLoft([{y:-shin*0.12,rx:0.05*cw+0.004,rz:0.054*cw+0.004},{y:-shin*0.4,rx:0.0505*cw+0.007,rz:0.056*cw+0.007},{y:-shin*0.6,rx:0.046*cw+0.005,rz:0.05*cw+0.005}],sg(16),Math.PI-0.9,Math.PI+0.9),(x,y,z,c)=>{ c.set(PL[3]).multiplyScalar(0.75+0.3*Math.abs(Math.sin(Math.atan2(x,-z)*1.5))); }));   // the shin guard
  }
  if(sh==='geta'){
    const w=0.052*(0.55+0.45*sf), hex=L.shoeColor;
    out.push(pc(vbox(w*1.8,0.012,0.215*(0.8+0.2*sf),sd*0.003,-shin-A+0.02,-0.03),(x,y,z,c)=>{ gmCol(c,hex,0.95+0.1*Math.sin(z*90)); }));   // the wooden board
    for(const z of [-0.07,0.045]) out.push(pc(vbox(w*1.7,0.032,0.018,sd*0.003,-shin-A+0.0,z),c=>gmCol(c,hex,0.68)));   // its two teeth
    for(const k of [-1,1]) out.push(solid(sweepTube([[0,-shin-A+0.027,-0.085],[k*w*0.55,-shin-A+0.045,-0.04],[k*w*0.85,-shin-A+0.03,0.0]],[0.0045,0.0045,0.0045],4,{cap:'round',rings:6}),0xc23b2a));   // the thong's two straps
    out.push(solid(sweepTube([[0,-shin-A+0.027,-0.088],[0,-shin-A+0.05,-0.075]],[0.005,0.0045],4,{cap:'round',rings:4}),0xc23b2a));
  } else if(sh==='furboots'){
    const fur=gmxMul(0xf0e8d8,1);
    const rows=[{y:-shin*0.3,rx:0.046*cw+0.0035,rz:0.049*cw+0.0035},{y:-shin*0.36,rx:0.053*cw+0.012,rz:0.056*cw+0.012},{y:-shin*0.42,rx:0.052*cw+0.014,rz:0.055*cw+0.014},{y:-shin*0.5,rx:0.043*cw+0.005,rz:0.046*cw+0.005}];
    out.push(pc(ofLoft(rows,sg(26),0,TAU),(x,y,z,c)=>{ c.set(fur).multiplyScalar(0.84+0.2*h3(Math.round(x*140),Math.round(y*140),Math.round(z*140))); }));   // the fur cuff
    for(let i=0;i<sg(14);i++){ const a=i/sg(14)*TAU; out.push(solid(csph(0.0085,sg(5),sg(4)).translate(Math.sin(a)*(0.056*cw+0.012),-shin*0.31,Math.cos(a)*(0.058*cw+0.012)),i%2?fur:0xdcd2c0)); }
    out.push(solid(gmRingAt([0,-shin*0.52,0],[0,1,0],0.04*cw+0.006,0.0032,sg(7)),0x3a2a1c),solid(csph(0.0065,sg(6),sg(5)).translate(sd*0.003,-shin*0.52,-(0.04*cw+0.009)),0xe8d9b0));   // a strap and a bone toggle
    out.push(pc(vbox(0.058*(0.55+0.45*sf),0.014,0.034,0,-shin-A+0.007,0.052),c=>gmCol(c,L.shoeColor,0.5)));
    out.push(solid(csph(0.034*(0.6+0.4*sf),sg(10),sg(8)).scale(1,0.7,1.2).translate(0,-shin-A+0.036,-0.1),0xf0e8d8));   // a fur tuft over the toe
  } else if(sh==='sabatons'){
    for(let i=0;i<4;i++){ const t=0.62+i*0.09; out.push(pc(ofLoft([{y:-shin*t,rx:0.0395*cw+0.0075,rz:0.0425*cw+0.0075},{y:-shin*(t+0.1),rx:0.036*cw+0.0095,rz:0.039*cw+0.0095}],sg(18),0,TAU),(x,y,z,c)=>{ c.set(GMX_STEEL).multiplyScalar(0.84+0.14*Math.sin(Math.atan2(x,z)*2)); }),solid(gmRingAt([0,-shin*t,0],[0,1,0],0.0395*cw+0.008,0.0026,sg(7)),gmxMul(GMX_STEEL,0.7))); }   // overlapping lames up the shin
    out.push(solid(csph(0.034*(0.6+0.4*sf),sg(12),sg(8)).scale(1.0,0.62,1.5).translate(0,-shin-A+0.03,-0.075),GMX_STEEL));   // the plated instep
    out.push(solid(new THREE.ConeGeometry(0.03*(0.6+0.4*sf),0.075,sg(10)).rotateX(-Math.PI/2).translate(0,-shin-A+0.027,-0.17),GMX_STEEL));   // the pointed toe
    for(const z of [-0.06,-0.1]) out.push(solid(gmRingAt([0,-shin-A+0.03,z],[0,0.1,1],0.032*(0.6+0.4*sf),0.003,sg(7)),gmxMul(GMX_STEEL,0.7)));
    out.push(pc(vbox(0.058*(0.55+0.45*sf),0.016,0.034,0,-shin-A+0.008,0.052),c=>c.set(0x3a3a40)));
  }
  return out;
}
