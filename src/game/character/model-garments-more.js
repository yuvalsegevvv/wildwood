//@ The crafted tops, bottoms and shoes (version 3.2): robe, poncho, jerkin, crop top, halter wrap and harness; breeches, hakama, plated leggings, loincloth, short shorts and a slit wrap skirt; geta, fur-lined boots and sabatons
/* Same contract as model-garments.js (the base garments): each look.top / look.bottom / look.shoes id below adds painted geometry in the frame of the part it hangs from, called from the same four hooks:
   gmxTop(X,D) the spine's frame (from gmTop), gmxCuff(X,D,sd) the elbow's (gmCuff), gmxHips(X,D) the hips' (gmHips), gmxThigh(X,D,sd) the hip joint's, y down the thigh (buildLeg), gmxShin(X,D,sd) the knee's (gmShin).
   The body's own paint comes from clothPaints / buildLeg (model-body.js, which read gmxOpenTop and gmxBareBottom here): a top that leaves the midriff or the shoulders bare paints skin there (and the woman's band top under a harness),
   a bottom that leaves the hips open (loincloth, wrap skirt) leaves the body's briefs showing (UNDER_COL), so nothing is ever left undressed.
   Every piece is meant for any body: the lists are unisex and the shapes follow the sliders (torsoSize).
   owns: GMX_TOPS, GMX_BOTTOMS, GMX_SHOES, gmxTop, gmxCuff, gmxHips, gmxThigh, gmxShin, gmxSkirtKind, gmxBareBottom, gmxSleeveless.   used by: model-garments.js, model-body.js, ui/character-editor.js.   test: tools/cospieces-smoke.js */
const GMX_TOPS=CP_PIECES.filter(r=>r[0]==='t').map(r=>[r[1],r[2],r[4]]), GMX_BOTTOMS=CP_PIECES.filter(r=>r[0]==='b').map(r=>[r[1],r[2],r[4]]), GMX_SHOES=CP_PIECES.filter(r=>r[0]==='s').map(r=>[r[1],r[2],r[4]]);
// the body shows where the garment is open: the bare top ids and the bottoms whose hips stay open over the briefs
const gmxSleeveless=t=>t==='halter'||t==='harness'||gmdIs(t), gmxBareBottom=b=>b==='loincloth'||b==='wrapskirt', gmxSkirtKind=b=>b==='hakama'||b==='wrapskirt';
const GMX_STEEL=0xb9bdc2, GMX_LEATHER=0x5a3a22, GMX_BRASS=0xc9a13a;
const gmxMul=(hex,m)=>new THREE.Color(hex).multiplyScalar(m).getHex();
// the colours of a crafted top or bottom (the same four slots as a set's piece: tintTop2..4 / tintBottom2..4): [main, second, third, fourth], each default derived from the main colour
const GMX_PAL={
  top:{crop:tc=>[tc,0xf4efe6,gmxMul(tc,0.7)],halter:tc=>[tc,0xe8c24a,gmxMul(tc,0.7)],harness:tc=>[tc,GMX_LEATHER,GMX_BRASS],robe:tc=>[tc,0x7a2a3a,new THREE.Color(tc).lerp(new THREE.Color(0xffffff),0.35).getHex()],
    poncho:tc=>[tc,0xe8d9b0,gmxMul(tc,0.7)],jerkin:tc=>[tc,0xe8d9b0,GMX_BRASS,0x3a2a1c]},
  bottom:{breeches:tc=>[tc,0x4a3626,GMX_BRASS,gmxMul(tc,0.72)],shortshorts:tc=>[tc,gmxMul(tc,0.6),0xe8e4dc,GMX_STEEL],wrapskirt:tc=>[tc,gmxMul(tc,0.5),gmxMul(tc,0.5)],
    hakama:tc=>[tc,0xe8e4dc,gmxMul(tc,0.75),0xe8e4dc],loincloth:tc=>[tc,0x4a3626,GMX_BRASS,0xe8d9b0],greaves:tc=>[tc,0x4a3626,GMX_BRASS,GMX_STEEL]}
};
// the Sigil track's four sets (shared/puzzle-track.js PZ_TRACK_SETS): each piece is an existing silhouette (base) in the set's own colours (col, pal = the other three tint slots), so a set's top, bottom and shoes belong together.
// buildCharacter runs the look through gmxAliasLook first: the piece becomes its base with the designed colours (the main colour is the design's; the further tints are still the player's).
const GMX_ALIAS={
  mpcrop:{slot:'top',base:'crop',col:0xf2a8c4,pal:[0xfff4f4,0xc8708f]}, mpskirt:{slot:'bottom',base:'wrapskirt',col:0xf2a8c4,pal:[0xd88aa6,0xc8708f]}, mpgeta:{slot:'shoes',base:'geta',col:0xf6dfe6},
  fwponcho:{slot:'top',base:'poncho',col:0xb8d4ea,pal:[0xffffff,0x7a98b8]}, fwbreeches:{slot:'bottom',base:'breeches',col:0x5a7898,pal:[0xdfe9f2,0xe8f0f8,0x4a6684]}, fwboots:{slot:'shoes',base:'furboots',col:0xdfe9f2},
  egjerkin:{slot:'top',base:'jerkin',col:0x9a2f2a,pal:[0xe0b050,0xc9a13a,0x3a2a1c]}, eggreaves:{slot:'bottom',base:'greaves',col:0x3a2626,pal:[0x5a3a22,0xc9a13a,0x8a8f96]}, egsabatons:{slot:'shoes',base:'sabatons',col:0x6a5a56},
  swrobe:{slot:'top',base:'robe',col:0x2b2f6a,pal:[0xf0d060,0x8a8fe0]}, swhakama:{slot:'bottom',base:'hakama',col:0x2b2f6a,pal:[0xf0d060,0x1f2250,0xf0d060]}, swboots:{slot:'shoes',base:'tallboots',col:0x1f2250}
};
function gmxAliasLook(L){
  let o=null; if(gmdIs(L.top)&&L.bottom!=='none'){ o=Object.assign({},L); o.bottom='none'; L=o; }   // a dress is worn without a bottom: its skirt is the bottom
  for(const slot of ['top','bottom','shoes']){ const id=L[slot]; if(typeof id!=='string'||!Object.prototype.hasOwnProperty.call(GMX_ALIAS,id)) continue; const A=GMX_ALIAS[id]; if(A.slot!==slot) continue;
    o=o||Object.assign({},L); o[slot]=A.base; const tc=ofTintOf(L,slot)>=0?ofTintOf(L,slot):A.col; if(slot==='top') o.topColor=tc; else if(slot==='bottom') o.bottomColor=tc; else o.shoeColor=tc;   // the slot's tint (tintTop...: the editor's colour row while a set piece is worn) recolours the main colour, -1 = as designed
    (A.pal||[]).forEach((c,i)=>{ const k=OF_TINTX[slot][i]; if(!(typeof L[k]==='number'&&L[k]>=0)) o[k]=c; }); }
  return o||L;
}
// a Sigil piece is worn in the editor (L.top = 'mpcrop'): its colour row writes the slot's tint
const gmxAliased=(L,slot)=>typeof L[slot]==='string'&&Object.prototype.hasOwnProperty.call(GMX_ALIAS,L[slot])&&GMX_ALIAS[L[slot]].slot===slot;
function gmxPalDef(L,slot){ L=gmxAliasLook(L); const t=GMX_PAL[slot], id=L[slot]; return t&&typeof id==='string'&&Object.prototype.hasOwnProperty.call(t,id)?t[id](slot==='top'?L.topColor:L.bottomColor):[]; }
function gmxPalAt(L,slot){ L=gmxAliasLook(L); return gmxPalDef(L,slot).map((c,i)=>{ if(!i) return c; const v=L[OF_TINTX[slot][i-1]]; return typeof v==='number'&&v>=0&&v<=0xffffff?Math.floor(v):c; }); }
// a strap that follows the body's front (or back) from design height y0 to y1 and from x0 to x1: pts along it, lifted a little off the cloth
function gmxStrap(X,D,y0,y1,x0,x1,back,n){
  const pts=[]; for(let i=0;i<=(n||6);i++){ const t=i/(n||6), yd=y0+(y1-y0)*t, ts=torsoSize(X,D,yd); pts.push([x0+(x1-x0)*t,yd*D.TK,back?(ts.rzBack+0.007):-(ts.rz+0.007)]); }
  return pts;
}
// ---- tops, in the spine's frame ----
function gmxTop(X,D){
  if(gmdIs(X.L.top)) return gmdTop(X,D);   // dresses: model-dresses.js
  const {L,sg}=X, TK=D.TK, nr=D.neckR, top=L.top, out=[], tc=L.topColor, PL=gmxPalAt(L,'top'), dk=gmxMul(tc,0.7), lt=new THREE.Color(tc).lerp(new THREE.Color(0xffffff),0.35).getHex(), fz=yd=>-(torsoSize(X,D,yd).rz+0.004), bz=yd=>torsoSize(X,D,yd).rzBack+0.004;
  if(top==='crop'){
    out.push(gmBand(X,D,0.3,0.275,(x,y,z,c)=>c.set(PL[1]),0.004));   // the ribbed hem, high on the ribs
    out.push(solid(gmRingAt([0,0.572*TK,0],[0,1,0],nr*1.4,0.0065,sg(8)),PL[2]));   // the collar
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*nr*1.5,0.575*TK,fz(0.5)],[sd*nr*2.4,0.545*TK,fz(0.5)-0.002],[sd*nr*3.0,0.5*TK,fz(0.47)]],0.012,{up:[0,1,-0.4],seg:sg(6),th:0.003}),PL[2]));
    out.push(solid(csph(0.009,sg(6),sg(5)).scale(1.5,1,0.6).translate(0,0.475*TK,fz(0.475)-0.005),PL[1]));   // a small bow at the dip of the neckline, with two tails
    for(const sd of [-1,1]) out.push(solid(sweepTube([[sd*0.004,0.47*TK,fz(0.47)-0.006],[sd*0.01,0.44*TK,fz(0.44)-0.006]],[0.0026,0.002],4,{cap:'round',rings:4}),PL[1]));
    out.push(gmBand(X,D,0.348,0.338,(x,y,z,c)=>c.set(PL[2]),0.007));   // the seam under the bust
  } else if(top==='halter'){
    const cz=fz(0.34);
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*0.07,0.43*TK,fz(0.43)-0.005],[sd*0.05,0.495*TK,fz(0.5)-0.004],[sd*nr*1.15,0.565*TK,-nr*0.55],[sd*nr*0.5,0.585*TK,nr*1.25]],0.017,{up:[0,1,-0.3],seg:sg(10),th:0.003}),PL[2]));   // the straps up to the knot behind the neck
    out.push(solid(csph(0.011,sg(8),sg(6)).translate(0,0.585*TK,nr*1.35),PL[2]));
    for(const sd of [-1,1]) out.push(solid(sweepTube([[0,0.585*TK,nr*1.4],[sd*0.012,0.54*TK,nr*1.5+0.006],[sd*0.01,0.48*TK,nr*1.4+0.01]],[0.004,0.0035,0.0015],4,{cap:'point',rings:6}),PL[2]));   // the knot's tails down the back
    out.push(solid(csph(0.006,sg(6),sg(5)).translate(0,0.345*TK,cz-0.016),0xe8f0ff));   // a small gem on the front knot
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
    // pass 3: a buckle on each front strap, D-rings at the shoulders, a ring where the straps cross at the back, a pouch and a knife on the belt
    for(const sd of [-1,1]){ const t=0.35, x=lerp(sd*0.07,-sd*0.1,t), yd=0.5-t*0.4; out.push(solid(gmRingAt([x,yd*TK,fz(yd)-0.013],[0,0,1],0.011,0.0028,sg(8)),PL[2]),solid(vbox(0.003,0.02,0.004,x,yd*TK,fz(yd)-0.015).rotateZ(sd*0.6),PL[2]));
      out.push(solid(gmRingAt([sd*0.075,0.47*TK,fz(0.47)-0.012],[0,0,1],0.009,0.0025,sg(8)),PL[2])); }
    out.push(solid(gmRingAt([0,0.33*TK,bz(0.33)+0.012],[0,0,1],0.017,0.0045,sg(8)),PL[2]));
    const pz=torsoSize(X,D,0.05), px=pz.rx*0.75;
    out.push(pc(vbox(0.05,0.05,0.022,px,0.0*TK,fz(0.05)*0.6-0.008),(x,y,z,c)=>{ c.set(PL[1]).multiplyScalar(0.9); if(y>0.013) c.multiplyScalar(1.15); }),solid(csph(0.004,5,4).translate(px,0.012,fz(0.05)*0.6-0.02),PL[2]));   // the pouch with its flap and stud
    out.push(solid(vbox(0.016,0.075,0.012,-px,-0.01,fz(0.05)*0.6-0.006),0x3a2a1c),solid(vbox(0.026,0.006,0.012,-px,0.03,fz(0.05)*0.6-0.006),PL[2]),solid(cyl(0.005,0.005,0.03,6).translate(-px,0.048,fz(0.05)*0.6-0.006),0x5a3a22));   // the knife: sheath, guard, grip
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
    const pk=new THREE.Color(PL[1]), pd=new THREE.Color(PL[2]);
    const dense=[]; rows.forEach((r,i)=>{ const n=rows[i+1]; if(!n){ dense.push(r); return; } for(let k=0;k<4;k++){ const f=k/4; dense.push({y:r.y+(n.y-r.y)*f,rx:r.rx+(n.rx-r.rx)*f,rz:r.rz+(n.rz-r.rz)*f}); } });   // (four rows between each shape row: the woven bands are painted per vertex)
    out.push(pc(ofLoft(dense,sg(48),0,TAU),(x,y,z,c)=>{ c.set(tc); const t=y/TK, a=Math.atan2(x,z), u=((a/TAU*16)%1+1)%1;   // a woven poncho: a band of diamonds across the chest, a zigzag band near the hem, fine weft lines
      c.multiplyScalar(0.93+0.07*Math.sin(t*300));
      if(t>0.3&&t<0.4){ const dy=Math.abs(t-0.35)/0.05, dx=Math.abs(u-0.5)*2; c.copy(pd); if(dx+dy<0.75) c.copy(pk); if(dx+dy<0.35) c.copy(pd); }
      else if(Math.abs(t-0.29)<0.008||Math.abs(t-0.41)<0.008) c.copy(pk);
      else if(t>0.06&&t<0.13){ const zz=Math.abs(((a/TAU*24)%1+1)%1-0.5)*2; if(Math.abs((t-0.06)/0.07-zz)<0.28) c.copy(pk); else c.multiplyScalar(0.85); }
      if(t<0.03) c.multiplyScalar(0.8); }));
    for(let i=0;i<sg(30);i++){ const a=i/sg(30)*TAU, r=rows[rows.length-1]; out.push(solid(sweepTube([[Math.sin(a)*r.rx,0,Math.cos(a)*r.rz],[Math.sin(a)*(r.rx+0.004),-0.025,Math.cos(a)*(r.rz+0.004)],[Math.sin(a)*(r.rx+0.006),-0.05,Math.cos(a)*(r.rz+0.006)]],[0.0032,0.0028,0.0014],4,{cap:'round',rings:4}),0xe8d9b0)); }   // the fringe
    out.push(solid(gmRingAt([0,0.575*TK,0],[0,1,0],nr*1.9,0.007,sg(8)),PL[2]));   // the neck slit's stitched rim
    for(const sd of [-1,1]) out.push(solid(sweepTube([[sd*0.012,0.565*TK,-nr*1.9-0.004],[sd*0.016,0.5*TK,-(D.shX*0.6)-0.01],[sd*0.012,0.46*TK,-(D.shX*0.7)-0.014]],[0.0026,0.0026,0.002],4,{cap:'round',rings:5}),PL[1]),solid(csph(0.006,5,4).translate(sd*0.012,0.455*TK,-(D.shX*0.7)-0.016),PL[1]));   // the slit's ties with tassels
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
    for(const sd of [-1,1]){ const x=sd*s0.rx*0.5; out.push(pc(vbox(0.05,0.045,0.004,x,-0.025,rz-0.004),c=>c.set(PL[1])),solid(csph(0.0035,4,3).translate(x+sd*0.022,-0.004,rz-0.001),PL[3])); }   // back pockets with a rivet each
    for(const sd of [-1,1]) out.push(solid(csph(0.0035,4,3).translate(sd*s0.rx*0.75,-0.004,-rz*0.85),PL[3]));   // rivets at the front pockets
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
      out.push(pc(ofLoft(rows,sg(14),a0,a1),(x,y,z,c)=>{ c.set(tc); const t=-y/hm, ax=Math.abs(x);
        if(y<-hm+0.03) c.set(PL[3]).multiplyScalar(0.9); else if(y<-hm+0.047) c.multiplyScalar(0.7);
        else if(Math.abs(t-0.74)<0.025||Math.abs(t-0.82)<0.012) c.set(PL[3]).multiplyScalar(0.85);   // two woven bands above the hem
        else if(t>0.25&&t<0.65&&Math.abs(ax+Math.abs(t-0.45)*0.22-0.022)<0.005) c.set(PL[3]).multiplyScalar(0.8);   // a stitched diamond in the middle of the flap
        c.multiplyScalar(0.94+0.06*Math.sin(x*180)); }));
      for(let i=0;i<5;i++){ const a=a0+0.12+(a1-a0-0.24)*i/4, R=rz+0.006+0.042+0.004; out.push(solid(sweepTube([[Math.sin(a)*(s0.rx+0.028),-hm+0.004,Math.cos(a)*R],[Math.sin(a)*(s0.rx+0.03),-hm-0.035,Math.cos(a)*(R+0.003)]],[0.0035,0.002],4,{cap:'round',rings:4}),PL[3])); } }   // a fringe of short tassels under each flap
    out.push(solid(csph(0.012,sg(6),sg(5)).translate(0.1,0.0,-rz*0.5),PL[2]));
    for(const sd of [-1,1]) out.push(solid(sweepTube([[sd*(s0.rx+0.014),0.03*TK,0],[sd*(s0.rx+0.02),-0.02,-0.004],[sd*(s0.rx+0.018),-0.07,-0.002]],[0.004,0.0035,0.002],4,{cap:'round',rings:5}),PL[1]),solid(csph(0.007,5,4).translate(sd*(s0.rx+0.018),-0.072,-0.002),PL[2]));   // a thong knotted at each hip with a bead
  }
  return out;
}
// ---- the thigh's frame (y down the thigh): the plates of the leggings ----
function gmxThigh(X,D,sd){
  const {L,sg}=X, tw=D.tw, thigh=D.thigh;
  if(L.bottom==='shorts'||L.bottom==='shortshorts'){   // the base shorts' turned-up cuff; the short shorts' frayed hem
    const f=L.bottom==='shorts'?0.53:0.2, r=(f<0.14?0.088:f<0.42?0.09-0.013*(f-0.14)/0.28:0.077-0.02*(f-0.42)/0.34)*tw, o=[];
    if(L.bottom==='shorts') o.push(pc(ofLoft([{y:-f*thigh+0.026,rx:r+0.0045,rz:r*1.04+0.0045},{y:-f*thigh,rx:r+0.006,rz:r*1.04+0.006}],sg(22),0,TAU),c=>c.set(L.bottomColor).multiplyScalar(0.8)));
    else for(let i=0;i<sg(18);i++){ const a=i/sg(18)*TAU, R=r+0.003, len=0.008+0.008*h3(i,3,7); o.push(solid(sweepTube([[Math.sin(a)*R,-f*thigh+0.002,Math.cos(a)*R*1.04],[Math.sin(a)*(R+0.001),-f*thigh-len,Math.cos(a)*(R*1.04+0.001)]],[0.0026,0.001],3,{cap:'round',rings:3}),new THREE.Color(L.bottomColor).lerp(new THREE.Color(0xffffff),0.4).getHex())); }
    return o; }
  if(L.bottom!=='greaves') return [];
  const PL=gmxPalAt(L,'bottom');
  // the thigh's own profile (buildLeg's limb: radius 0.088 / 0.09 / 0.077 / 0.057 of tw at 0 / 0.14 / 0.42 / 0.76 of its length) plus a margin, so the plates sit on the cloth instead of inside it
  const prof=f=>(f<0.14?0.088+0.002*f/0.14:f<0.42?0.09-0.013*(f-0.14)/0.28:0.077-0.02*(f-0.42)/0.34)*tw, out=[];
  // three overlapping lames down the front of the thigh, each a little proud of the one above, with a brass edge and a rivet at each end
  for(let i=0;i<3;i++){ const f0=0.12+i*0.17, f1=f0+0.2, a=Math.PI-0.95+i*0.05, b=Math.PI+0.95-i*0.05, m=0.007+0.002*(2-i);
    const rows=[f0,f0+0.02,f1-0.03,f1].map((f,j)=>({y:-f*thigh,rx:prof(f)+m+(j===0||j===3?-0.001:0.001),rz:(prof(f)+m)*1.04}));
    out.push(pc(ofLoft(rows,sg(14),a,b),(x,y,z,c)=>{ const t=(-y/thigh-f0)/(f1-f0); c.set(PL[3]).multiplyScalar(0.72+0.42*Math.abs(Math.sin(Math.atan2(x,-z)*1.5))); if(t>0.86) c.set(PL[2]).multiplyScalar(0.9); else if(t<0.1) c.multiplyScalar(0.7); }));
    for(const e of [a+0.14,b-0.14]){ const f=f0+0.08, R=(prof(f)+m)*1.04+0.002; out.push(solid(csph(0.0042,5,4).translate(Math.sin(e)*R*0.97,-f*thigh,Math.cos(e)*R),PL[2])); } }
  out.push(pc(ofLoft([0.6,0.63].map(f=>({y:-f*thigh,rx:prof(f)+0.007,rz:(prof(f)+0.007)*1.04})),sg(20),Math.PI*0.5,Math.PI*1.5),c=>c.set(PL[1])));   // the leather strap that holds them, buckled at the side
  out.push(solid(vbox(0.012,0.016,0.006,sd*(prof(0.615)+0.008),-0.615*thigh,-0.004),PL[2]));
  return out;
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
    { const bd=new THREE.CylinderGeometry(1,1,0.014,sg(16)).scale(w*0.95,1,0.11*(0.8+0.2*sf)), q=bd.attributes.position; for(let i=0;i<q.count;i++){ const x=q.getX(i), z=q.getZ(i); q.setX(i,x*(0.86+0.14*Math.min(1,Math.abs(z)/0.06+0.4))); } bd.computeVertexNormals();   // the board: a rounded oblong of paulownia with growth rings
      out.push(pc(bd.translate(sd*0.003,-shin-A+0.02,-0.03),(x,y,z,c)=>{ gmCol(c,hex,0.92+0.12*Math.sin(Math.hypot(x*2.2,z+0.03)*260)); if(y>-shin-A+0.026) c.multiplyScalar(1.06); })); }
    out.push(solid(csph(0.0065,sg(6),sg(5)).translate(0,-shin-A+0.03,-0.088),0x8a1f2a));   // the velvet knob where the thong meets the board
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
