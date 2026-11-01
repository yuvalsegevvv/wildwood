//@ The base garments' details (version 3.1): collars, plackets, pockets, belts, cuffs, laces, soles and straps for the plain tops, bottoms and shoes, and the new vest, tunic, kilt, pleated skirt, sandals and tall boots
/* The base clothes were one painted surface each; this adds the geometry that makes a garment read as one, in the frame of the part it hangs from, called from the body builders (model-body.js, model.js) only
   while that slot wears a base item (a signature outfit's piece draws its own):
   - gmTop(X,D): the spine's frame (y in metres above the hips, the front is -z): collars, buttons, pockets, the vest's waistcoat, the hem band;
   - gmCuff(X,D,sd): the elbow's frame (y down the forearm): cuffs and ribbed bands at the wrist;
   - gmHips(X,D): the hips' frame (y up): the belt and buckle, pockets, the tunic's skirts and the kilt's sporran;
   - gmShin(X,D,sd): the knee's frame (y down the shin, the ankle at -D.shin): trouser cuffs, boot cuffs, laces, heels and sandal straps.
   New ids: tops 'vest' (a waistcoat over a cream shirt) and 'tunic' (a belted, flared tunic); bottoms 'kilt' (tartan, to the knee) and 'pleated' (a pleated skirt); shoes 'sandals' and 'tallboots'. Lists for the editor: GM_TOPS, GM_BOTTOMS, GM_SHOES.
   owns: GM_*, gmTop, gmCuff, gmHips, gmShin, gmSkirt (the skirt family's lathe).   used by: model.js, model-body.js, ui/character-editor.js.   test: tools/cosmetic-items-smoke.js */
const GM_TOPS=[['none','None'],['tshirt','T-shirt','A crew-neck tee with ribbed collar and hem.'],['flannel','Flannel','A plaid shirt with a collar, a placket of buttons and a pocket.'],['jacket','Jacket','A zipped jacket with flapped pockets, a high collar and ribbed cuffs.'],
  ['hoodie','Hoodie','A pullover with a hood, a pouch pocket, drawstrings and ribbed cuffs.'],['vest','Waistcoat','A buttoned waistcoat over a cream shirt.'],['tunic','Tunic','A belted tunic with a laced neck and a flared skirt.']];
const GM_BOTTOMS=[['none','None'],['trousers','Trousers','Belted, with pockets and turned cuffs.'],['shorts','Shorts','Belted, with a hem band.'],['skirt','Skirt','A flared skirt with a waistband and a hem trim.'],
  ['kilt','Kilt','A tartan kilt to the knee with a belt and a pin.'],['pleated','Pleated skirt','A short skirt of sharp pleats with a ribbon belt.']];
const GM_SHOES=[['none','None'],['boots','Boots','Leather boots with a cuff, laces and a heel.'],['sneakers','Sneakers','Canvas shoes with a toe cap, laces and a striped sole.'],['sandals','Sandals','Open soles with crossed straps and an ankle band.'],['tallboots','Tall boots','Boots to the knee with a folded cuff and two buckled straps.']];
// a cheap ring (a torus with a 4-sided tube): a band, a strap or a cord round a limb
function gmRingAt(p,t,R,r,seg){ const g=new THREE.TorusGeometry(R,r,4,Math.max(6,Math.round((seg||5)*1.4))), q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(t[0],t[1],t[2]).normalize());
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)); return g.translate(p[0],p[1],p[2]); }
const gmCol=(c,h,m)=>c.set(h).multiplyScalar(m===undefined?1:m);
// a band round the torso between design heights y0 and y1 (a belt, a hem): a loft over the body's own size
function gmBand(X,D,y0,y1,fn,m){ const a=torsoSize(X,D,y0), b=torsoSize(X,D,y1), mm=m||0.006, TK=D.TK;   // y0 above y1 (design heights)
  return pc(ofLoft([{y:y0*TK,rx:a.rx+mm,rz:Math.max(a.rz,a.rzBack)+mm},{y:y1*TK,rx:b.rx+mm,rz:Math.max(b.rz,b.rzBack)+mm}],X.sg(28),0,TAU),fn); }
// ---- tops, in the spine's frame ----
function gmTop(X,D){
  if(X.kit&&X.kit.sl.top) return [];
  const {L,sg}=X, TK=D.TK, B=D.B, top=L.top, out=[], nr=D.neckR, tc=new THREE.Color(L.topColor), dk=tc.clone().multiplyScalar(0.72).getHex(), lt=tc.clone().lerp(new THREE.Color(0xffffff),0.3).getHex();
  if(top==='none'||top==='outfit') return out;
  const fz=yd=>-(torsoSize(X,D,yd).rz+0.004), hemY=(top==='jacket'||top==='hoodie')?-0.035:0.03;
  const button=(yd,hex)=>solid(csph(0.0075,sg(7),sg(6)).scale(1,1,0.6).translate(0,yd*TK,fz(yd)-0.003),hex);
  if(top==='tshirt'){
    out.push(solid(gmRingAt([0,0.572*TK,0],[0,1,0],nr*1.42,0.0065,sg(8)),dk));   // the ribbed collar
    out.push(gmBand(X,D,hemY+0.012,hemY-0.006,(x,y,z,c)=>gmCol(c,L.topColor,0.82),0.004));   // the hem
  } else if(top==='flannel'){
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*nr*0.9,0.585*TK,-nr*1.25],[sd*nr*2.0,0.575*TK,-nr*1.1],[sd*nr*2.5,0.545*TK,fz(0.545)-0.01]],0.034,{up:[0,1,-0.4],seg:sg(8),th:0.004}),lt));   // the collar's two points
    out.push(pc(new THREE.BoxGeometry(0.014,0.5*TK,0.004).translate(0,0.285*TK,fz(0.285)),c=>gmCol(c,L.topColor,0.62)));   // the placket
    for(const yd of [0.5,0.4,0.3,0.2,0.1]) out.push(button(yd,0xe8e4dc));
    out.push(pc(new THREE.BoxGeometry(0.052,0.052,0.004).translate(torsoSize(X,D,0.36).rx*0.45,0.36*TK,fz(0.36)),c=>gmCol(c,L.topColor,0.78)),solid(new THREE.BoxGeometry(0.052,0.006,0.005).translate(torsoSize(X,D,0.36).rx*0.45,0.382*TK,fz(0.36)-0.001),dk));   // a chest pocket
  } else if(top==='jacket'){
    for(const sd of [-1,1]){ const x=sd*torsoSize(X,D,0.14).rx*0.5;
      out.push(pc(new THREE.BoxGeometry(0.06,0.032,0.005).translate(x,0.15*TK,fz(0.15)),c=>gmCol(c,L.topColor,0.74)));   // flapped pockets
      out.push(solid(new THREE.BoxGeometry(0.06,0.004,0.006).translate(x,0.134*TK,fz(0.15)-0.001),0x2a2a2a));
      out.push(solid(ofRibbon([[sd*nr*0.9,0.58*TK,-nr*1.4],[sd*nr*2.3,0.56*TK,-nr*1.3],[sd*nr*2.9,0.52*TK,fz(0.52)-0.01]],0.04,{up:[0,1,-0.5],seg:sg(8),th:0.004}),dk)); }   // the high collar's lapels
    out.push(gmBand(X,D,hemY+0.03,hemY,(x,y,z,c)=>gmCol(c,L.topColor,0.62),0.005));   // the ribbed hem
    out.push(solid(vbox(0.012,0.022,0.006,0.008,0.5*TK,fz(0.5)-0.006),0xc9ccd0),solid(gmRingAt([0.008,0.515*TK,fz(0.5)-0.006],[0,0,1],0.004,0.0015,5),0xc9ccd0));   // the zip's pull
    { const x0=-torsoSize(X,D,0.36).rx*0.65; out.push(solid(ofRibbon([[x0,0.39*TK,fz(0.39)-0.002],[x0+0.05,0.33*TK,fz(0.33)-0.002]],0.005,{up:[0,0,-1],seg:3,th:0.003}),0x2a2a2a),solid(vbox(0.008,0.014,0.005,x0+0.004,0.385*TK,fz(0.385)-0.004),0xc9ccd0)); }   // a slanted chest-pocket zip
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*torsoSize(X,D,0.47).rx*0.98,0.47*TK,-0.002],[sd*torsoSize(X,D,0.47).rx*0.6,0.47*TK,fz(0.47)+0.001]],0.004,{up:[0,1,0],seg:4,th:0.003}),dk));   // the yoke's stitched edge
  } else if(top==='hoodie'){
    out.push(gmBand(X,D,hemY+0.035,hemY,(x,y,z,c)=>gmCol(c,L.topColor,0.66),0.005));
    for(const sd of [-1,1]) out.push(solid(sweepTube([[sd*0.03,0.44*TK,fz(0.44)-0.004],[sd*0.034,0.36*TK,fz(0.36)-0.006],[sd*0.03,0.3*TK,fz(0.3)-0.006]],[0.0035,0.0035,0.0045],4,{cap:'round',rings:6}),0xe8e4dc),solid(csph(0.006,sg(6),sg(5)).translate(sd*0.03,0.295*TK,fz(0.3)-0.006),0xc9a13a));   // drawstrings with tips
    for(const sd of [-1,1]) out.push(solid(ofRibbon([[sd*0.072*B,0.145*TK,fz(0.145)-0.017],[sd*0.092*B,0.06*TK,fz(0.06)-0.017]],0.006,{up:[0,0,-1],seg:3,th:0.003}),dk));   // the pouch pocket's two slanted openings
    out.push(solid(gmRingAt([0,0.565*TK,0.01],[0,1,-0.25],nr*1.75,0.007,sg(10)),lt));   // the hood's rolled rim round the neck
  } else if(top==='vest'){
    const rows=[0.505,0.42,0.3,0.18,0.07,0.01].map(yd=>{ const t=torsoSize(X,D,yd), m=0.009+(yd<0.2?0.004:0); return {y:yd*TK,rx:t.rx+m,rz:Math.max(t.rz,t.rzBack)+m}; });
    out.push(pc(ofLoft(rows,sg(36),-2.85,2.85),(x,y,z,c)=>{ c.set(L.topColor); const k=Math.abs(Math.atan2(x,-z)); if(k<0.52) c.multiplyScalar(0.84); if(y<0.04*TK) c.multiplyScalar(0.8); else if(y>0.5*TK) c.multiplyScalar(0.84); }));   // the waistcoat: back and sides, the front open
    for(const sd of [-1,1]){ const t=torsoSize(X,D,0.42); out.push(pc(ofRibbon([[sd*0.01,0.5*TK,fz(0.5)-0.006],[sd*0.035,0.4*TK,fz(0.4)-0.008],[sd*0.03,0.25*TK,fz(0.25)-0.01],[sd*0.012,0.06*TK,fz(0.06)-0.01]],0.026,{up:[0,0,-1],seg:sg(10),th:0.004}),(x,y,z,c)=>gmCol(c,L.topColor,0.7))); }   // the two fronts' edges
    for(const yd of [0.43,0.33,0.23,0.13]) out.push(button(yd,0xd8b84a));
    out.push(solid(sweepTube([[-0.07,0.17*TK,fz(0.17)-0.01],[-0.04,0.165*TK,fz(0.17)-0.012],[0.0,0.2*TK,fz(0.2)-0.012]],[0.0018,0.0018,0.0018],4,{cap:'round',rings:5}),0xd8b84a));   // a watch chain
    out.push(solid(gmRingAt([0,0.572*TK,0],[0,1,0],nr*1.35,0.006,sg(8)),0xe8e4dc));   // the shirt's collar under it
    for(const sd of [-1,1]){ const t=torsoSize(X,D,0.12); out.push(pc(vbox(0.045,0.007,0.004,sd*t.rx*0.55,0.12*TK,fz(0.12)-0.011).rotateZ(0),c=>gmCol(c,L.topColor,0.6))); }   // pass 3: two welt pockets
    { const t=torsoSize(X,D,0.38); out.push(pc(vbox(0.035,0.006,0.004,-t.rx*0.5,0.38*TK,fz(0.38)-0.011),c=>gmCol(c,L.topColor,0.6)),solid(new THREE.ConeGeometry(0.012,0.02,3).translate(-t.rx*0.5,0.385*TK+0.008,fz(0.38)-0.012),0xe8e4dc)); }   // a breast welt with a pocket square peeking out
    { const t=torsoSize(X,D,0.12), z=t.rzBack+0.02; out.push(pc(vbox(0.09,0.016,0.008,0,0.12*TK,z),c=>gmCol(c,L.topColor,0.78)),solid(vbox(0.02,0.02,0.005,0,0.12*TK,z+0.002),0xd8b84a)); }   // the back's cinch strap and buckle
  } else if(top==='tunic'){
    out.push(gmBand(X,D,0.045,0.0,(x,y,z,c)=>{ c.set(0x4a3626); },0.008));   // the belt
    out.push(solid(new THREE.BoxGeometry(0.036,0.03,0.008).translate(0,0.02*TK,fz(0.02)-0.008),0xc9a13a),solid(new THREE.BoxGeometry(0.022,0.018,0.01).translate(0,0.02*TK,fz(0.02)-0.009),0x2a2a2a));   // the buckle
    for(const sd of [-1,1]) out.push(solid(sweepTube([[sd*0.012,0.555*TK,fz(0.55)-0.004],[sd*0.02,0.5*TK,fz(0.5)-0.005],[sd*0.012,0.46*TK,fz(0.46)-0.005]],[0.0025,0.0025,0.0025],4,{cap:'round',rings:6}),0xe8d9b0));   // the laced neck
    out.push(gmBand(X,D,0.54,0.505,(x,y,z,c)=>{ c.set(L.topColor).lerp(ofCol(0xe8d9b0),0.6); },0.004));
  }
  out.push(...gmxTop(X,D));   // the crafted tops (model-garments-more.js)
  return out;
}
// ---- cuffs, in the elbow's frame ----
function gmCuff(X,D,sd){
  if(X.kit&&X.kit.sl.top) return [];
  const {L,sg}=X, aw=D.aw, top=L.top, out=[], band=(y,r,hex)=>solid(gmRingAt([0,y,0],[0,1,0],r*aw+0.003,0.0045,sg(7)),hex), col=new THREE.Color(L.topColor);
  if(top==='jacket'||top==='hoodie') out.push(pc(ofLoft([{y:-0.205,rx:0.0235*aw+0.004,rz:0.0235*aw+0.004},{y:-0.245,rx:0.0215*aw+0.0045,rz:0.0215*aw+0.0045}],sg(22),0,TAU),c=>gmCol(c,L.topColor,0.62)),band(-0.205,0.0235,col.clone().multiplyScalar(0.5).getHex()));
  else if(top==='flannel') out.push(pc(ofLoft([{y:-0.2,rx:0.0245*aw+0.004,rz:0.0245*aw+0.004},{y:-0.243,rx:0.0215*aw+0.004,rz:0.0215*aw+0.004}],sg(22),0,TAU),c=>gmCol(c,L.topColor,0.72)),solid(new THREE.SphereGeometry(0.0055,6,5).translate(sd*0.0215*aw*0.2,-0.222,-(0.0215*aw+0.005)),0xe8e4dc));
  else if(top==='tunic') out.push(band(-0.24,0.021,0x4a3626),band(-0.2,0.0235,0xe8d9b0));
  out.push(...gmxCuff(X,D,sd));   // the robe's hanging sleeves, the crop top's band (model-garments-more.js)
  return out;
}
// ---- the skirt family: a lathe from the waist, a number of sharp pleats or a smooth flare; hem and waistband are painted ----
function gmSkirt(X,D,kind){
  const {L,S,sg}=X, prof=[], rows=sg(16), legs=S.legs, top=Math.max(0.165*D.B,D.hx+0.085), kilt=kind==='kilt', hk=kind==='hakama', wr=kind==='wrapskirt', pl=kind==='pleated'||hk, len=kilt?0.46:hk?0.8:pl?0.3:wr?0.25:0.4, hem=top*(kilt?1.22:hk?1.4:pl?1.55:wr?1.25:1.4);
  for(let i=0;i<=rows;i++){ const t=i/rows; prof.push(new THREE.Vector2(top+(hem-top)*Math.pow(t,kilt?1.1:1.35)+top*0.05*Math.sin(Math.PI*Math.min(1,t/0.4)),(0.04-len*t)*legs)); }   // (a hip swell first, then the flare: a curve, not a cone)
  const g=(wr?new THREE.LatheGeometry(prof,sg(40),Math.PI*1.5+0.65,TAU-1.3):new THREE.LatheGeometry(prof,sg(pl?48:40))).scale(1,1,0.8), p=g.attributes.position;
  if(pl) for(let i=0;i<p.count;i++){ const x=p.getX(i), z=p.getZ(i), a=Math.atan2(x,z), k=(Math.floor(((a/TAU)*36+36)%1*0)+0)+0.045*Math.sin(a*18)*(1-(p.getY(i)>-0.01?1:0)*0.9); const r=Math.hypot(x,z); p.setX(i,x*(1+k*0.5)); p.setZ(i,z*(1+k*0.5)); }
  if(!pl) for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), t=Math.min(1,Math.max(0,(0.04*legs-y)/(len*legs))), a=Math.atan2(x,z), f=(kilt?0.02:0.045)*Math.pow(t,1.25)*(Math.sin(a*9)*0.7+Math.sin(a*20.7+1.3)*0.3);   // soft folds that deepen to the hem, and a hem that rises and falls
    p.setX(i,x*(1+f)); p.setZ(i,z*(1+f)); p.setY(i,y+(kilt?0.004:0.012)*Math.pow(t,2.5)*Math.sin(a*3+1)); }
  smoothN(g);
  return pc(g,(x,y,z,c)=>{ const t=Math.min(1,Math.max(0,(0.04*legs-y)/(len*legs)));
    if(kilt) plaid(c,L.bottomColor,x*6,y*6); else c.set(L.bottomColor);
    if(pl){ const a=Math.atan2(x,z); c.multiplyScalar(0.9+0.14*Math.sin(a*18)); }
    else if(!kilt&&t>0.9) c.multiplyScalar(0.8); if(t<0.1) c.multiplyScalar(0.78); if(t>0.96) c.multiplyScalar(0.82); });
}
// ---- the hips' frame ----
function gmHips(X,D){
  if(gmdIs(X.L.top)&&!X.kit) return gmdHips(X,D);   // a dress carries its own skirt (model-dresses.js)
  const {L,sg}=X, TK=D.TK, out=[], b=L.bottom, tc=L.bottomColor, dk=new THREE.Color(tc).multiplyScalar(0.55).getHex(), s0=torsoSize(X,D,0.03), rz=Math.max(s0.rz,s0.rzBack)+0.012;
  const kB=X.kit&&X.kit.sl.bottom, kT=X.kit&&X.kit.sl.top;
  if(b==='none'||b==='outfit') return out;
  if(kB){ return out; }
  const belt=(hex,w)=>out.push(pc(ofLoft([{y:0.052*TK,rx:s0.rx+0.012,rz},{y:0.052*TK-w,rx:s0.rx+0.014,rz:rz+0.002}],sg(28),0,TAU),c=>c.set(hex)));
  if(b==='trousers'||b==='shorts'){
    belt(0x4a3626,0.034);
    out.push(solid(new THREE.BoxGeometry(0.034,0.028,0.008).translate(0,0.036*TK,-rz-0.004),0xc9a13a),solid(new THREE.BoxGeometry(0.02,0.016,0.01).translate(0,0.036*TK,-rz-0.0045),0x2a2a2a));
    for(let i=0;i<6;i++){ const a=(i/6)*TAU+0.5; if(Math.abs(Math.sin(a))>0.25) out.push(solid(new THREE.BoxGeometry(0.02,0.012,0.008).translate(Math.sin(a)*(s0.rx+0.02),0.044*TK,Math.cos(a)*(rz+0.004)),0x4a3626)); }   // belt loops
    const st=new THREE.Color(tc).lerp(new THREE.Color(0xe8d9b0),0.45).getHex(), sm=new THREE.Color(tc).multiplyScalar(0.72).getHex();
    if(X.q>=0.6) for(const sd of [-1,1]) out.push(solid(sweepTube([[sd*s0.rx*0.45,0.02*TK,-rz+0.002],[sd*s0.rx*0.7,-0.02,-rz*0.9],[sd*(s0.rx+0.006),-0.05,-rz*0.45]],[0.0022,0.0022,0.0022],4,{cap:'round',rings:6}),sm));   // the front pockets' curved openings
    if(X.q>=0.6) out.push(solid(sweepTube([[0.012,0.02*TK,-rz-0.002],[0.014,-0.04,-rz+0.002],[0.0,-0.065,-rz+0.006]],[0.0018,0.0018,0.0018],4,{cap:'round',rings:6}),st));   // the fly's J of stitching
    if(X.q>=0.6) for(const sd of [-1,1]){ const x=sd*s0.rx*0.5, z=rz-0.004; out.push(pc(vbox(0.055,0.06,0.004,x,-0.035,z),(x2,y,z2,c)=>{ c.set(tc).multiplyScalar(0.9); if(y>-0.012) c.multiplyScalar(0.8); }),solid(sweepTube([[x-0.024,-0.062,z+0.003],[x,-0.07,z+0.003],[x+0.024,-0.062,z+0.003]],[0.0015,0.0015,0.0015],4,{cap:'round',rings:5}),st)); }   // the back pockets, stitched in a shallow V
  } else if(b==='skirt'||b==='kilt'||b==='pleated'){
    out.push(pc(ofLoft([{y:0.06*TK,rx:s0.rx+0.012,rz},{y:0.025*TK,rx:s0.rx+0.014,rz:rz+0.002}],sg(28),0,TAU),c=>c.set(b==='pleated'?0xe8e4dc:b==='kilt'?0x4a3626:dk)));   // the waistband
    if(b==='kilt'){ out.push(solid(new THREE.BoxGeometry(0.034,0.034,0.008).translate(0,0.042*TK,-rz-0.004),0xc9a13a));
      out.push(pc(csph(0.035,sg(12),sg(8)).scale(1,1.15,0.6).translate(0,-0.06,-(rz+0.04)),(x,y,z,c)=>{ c.set(0x5a3a22).multiplyScalar(0.85+0.2*(y>-0.04?1:0)); }),solid(sweepTube([[-0.04,0.03,-rz-0.015],[0,0.0,-rz-0.032],[0.04,0.03,-rz-0.015]],[0.003,0.003,0.003],4,{cap:'round',rings:6}),0xc9a13a));   // the sporran, hung from a chain
      out.push(solid(new THREE.OctahedronGeometry(0.012,0).translate(-0.095,-0.17,-rz*0.6),0xb9bdc2)); }   // the kilt pin
    if(b==='pleated'){ out.push(pc(ofRibbon([[0.02,0.05*TK,-rz-0.01],[0.06,0.02*TK,-rz-0.03],[0.09,-0.05,-rz-0.03],[0.07,-0.1,-rz-0.02]],0.03,{up:[0,0,-1],seg:sg(8),th:0.003}),c=>c.set(0xc0344a))); }   // a ribbon belt's bow
  }
  if(!kT&&L.top==='tunic'&&b!=='skirt'&&b!=='kilt'&&b!=='pleated'){   // the tunic's flare over the thighs
    const rows=[{y:0.0,rx:s0.rx+0.014,rz},{y:-0.035,rx:s0.rx+0.03,rz:rz+0.016},{y:-0.07,rx:s0.rx+0.048,rz:rz+0.03},{y:-0.125,rx:s0.rx+0.066,rz:rz+0.044},{y:-0.18,rx:s0.rx+0.08,rz:rz+0.054}];   // five rings: a curve that eases out
    out.push(pc(ofLoft(rows,sg(36),0,TAU),(x,y,z,c)=>{ c.set(L.topColor); if(y<-0.16) c.set(0xe8d9b0); else if(y<-0.15) c.multiplyScalar(0.7); }));
  }
  out.push(...gmxHips(X,D));   // the crafted bottoms' belts, flaps and sashes (model-garments-more.js)
  return out;
}
// ---- the knee's frame: trouser cuffs, and the shoes' straps, laces, cuffs and heels ----
function gmShin(X,D,sd){
  const kS=X.kit&&X.kit.sl.shoes, kB=X.kit&&X.kit.sl.bottom, {L,sg}=X, cw=D.cw, shin=D.shin, A=D.ankleH, out=[], sh=L.shoes, bt=L.bottom, ring=(t,r,th,hex)=>solid(gmRingAt([0,-shin*t,0],[0,1,0],r*cw+0.002,th,sg(7)),hex), sf=X.S.feet;
  if(!kB&&bt==='trousers'&&sh!=='tallboots'&&sh!=='boots'&&sh!=='outfit') out.push(ring(0.88,0.037,0.0042,new THREE.Color(L.bottomColor).multiplyScalar(0.7).getHex()));   // a turned cuff
  if(kS) return out;
  if(sh==='boots'){
    out.push(pc(ofLoft([{y:-shin*0.6,rx:0.049*cw+0.0035,rz:0.052*cw+0.0035},{y:-shin*0.66,rx:0.046*cw+0.0045,rz:0.049*cw+0.0045}],sg(22),0,TAU),c=>gmCol(c,L.shoeColor,0.75)),ring(0.6,0.0475,0.0035,new THREE.Color(L.shoeColor).multiplyScalar(0.55).getHex()));   // the boot's cuff
    out.push(pc(new THREE.BoxGeometry(0.014,shin*0.3,0.004).translate(sd*0.003,-shin*0.83,-(0.039*cw+0.001)),c=>gmCol(c,L.shoeColor,0.62)));   // the tongue behind the laces
    if(X.q>=0.6) for(let i=0;i<5;i++){ const y=-shin*(0.69+i*0.058), zf=-(0.039*cw+0.004); for(const k of [-1,1]) out.push(solid(csph(0.0028,5,4).translate(sd*0.003+k*0.011,y,zf+0.002),0xc9a13a));   // brass hooks up each side
      if(i<4) for(const k of [-1,1]) out.push(solid(sweepTube([[sd*0.003+k*0.011,y,zf],[sd*0.003-k*0.011,y-shin*0.058,zf]],[0.0016,0.0016],3,{cap:'round',rings:3}),0xd8c8a8)); }   // laces crossing between them
    if(X.q>=0.6) out.push(solid(sweepTube([[sd*0.003,-shin*0.69,-(0.039*cw+0.004)],[sd*0.003+0.012,-shin*0.66,-(0.039*cw+0.01)],[sd*0.003+0.016,-shin*0.72,-(0.039*cw+0.012)]],[0.0016,0.0016,0.0012],3,{cap:'round',rings:4}),0xd8c8a8));   // a lace end tied off
    out.push(pc(vbox(0.014,0.03,0.005,0,-shin*0.6+0.012,0.049*cw+0.006),c=>gmCol(c,L.shoeColor,0.55)));   // the pull tab at the back
    out.push(pc(vbox(0.058*(0.55+0.45*sf),0.014,0.034,0,-shin-A+0.007,0.052),c=>gmCol(c,L.shoeColor,0.5)));   // the heel
  } else if(sh==='tallboots'){
    out.push(pc(ofLoft([{y:-shin*0.05,rx:0.054*cw+0.005,rz:0.058*cw+0.005},{y:-shin*0.17,rx:0.0505*cw+0.006,rz:0.054*cw+0.006}],sg(22),0,TAU),c=>gmCol(c,L.shoeColor,0.7)),ring(0.05,0.0545,0.0042,0x3a2a1c));   // the folded cuff
    for(const t of [0.4,0.66]) out.push(solid(gmRingAt([0,-shin*t,0],[0,1,0],0.0455*cw+0.0035,0.0034,sg(7)),0x3a2a1c),solid(new THREE.BoxGeometry(0.014,0.016,0.006).translate(sd*0.03,-shin*t,-(0.042*cw)),0xc9a13a));   // two straps with buckles
    out.push(pc(vbox(0.058*(0.55+0.45*sf),0.016,0.034,0,-shin-A+0.008,0.052),c=>gmCol(c,L.shoeColor,0.45)));
    for(const s2 of [-1,1]) out.push(pc(new THREE.TorusGeometry(0.009,0.0028,5,10,Math.PI).rotateY(Math.PI/2).translate(s2*(0.054*cw+0.006),-shin*0.05+0.001,0),c=>gmCol(c,L.shoeColor,0.6)));   // pass 3: pull loops at the top, a stitched seam down the outside
    out.push(pc(cyl(0.0016,0.0016,shin*0.62,4).translate(-sd*(0.0505*cw+0.0062),-shin*0.5,0),c=>gmCol(c,L.shoeColor,1.25)));
  } else if(sh==='sneakers'){
    const wf=0.55+0.45*sf, sc=new THREE.Color(L.shoeColor), dk=sc.clone().multiplyScalar(0.7).getHex();
    out.push(pc(vbox(0.03*wf,0.006,0.07,0,-shin-A+0.036,-0.045).rotateX(-0.32),c=>c.copy(sc).multiplyScalar(0.88)));   // the tongue
    for(let i=0;i<4;i++){ const z=-0.085+i*0.017, y=-shin-A+0.031+i*0.006; out.push(solid(new THREE.BoxGeometry(0.034*wf,0.0026,0.004).translate(0,y,z),0xf2efe8)); for(const k of [-1,1]) out.push(solid(csph(0.0024,4,3).translate(k*0.017*wf,y,z),0xc9ccd0)); }   // laces across the instep, with eyelets
    for(const k of [-1,1]) out.push(solid(new THREE.TorusGeometry(0.008,0.0018,4,8).rotateX(-0.4).translate(k*0.008,-shin-A+0.054,-0.02),0xf2efe8));   // the bow
    out.push(pc(vbox(0.022,0.03,0.008,0,-shin-A+0.04,0.05).rotateX(0.2),c=>c.set(dk)));   // the heel tab
    out.push(solid(gmRingAt([0,-shin*0.95,0],[0,1,0],0.034*cw+0.004,0.0055,sg(8)),0xf2efe8));   // the padded collar
  } else if(sh==='sandals'){
    const w=0.052*(0.55+0.45*sf), hex=new THREE.Color(L.shoeColor).multiplyScalar(0.9).getHex(), lt=new THREE.Color(L.shoeColor).lerp(new THREE.Color(0xffffff),0.25).getHex(), Z=0.225*(0.8+0.2*sf);
    // a contoured footbed on a darker sole, a toe post with a thong, two crossed straps, a braided ankle band with a buckle and a heel strap down to the sole
    const bed=new THREE.CylinderGeometry(1,1,0.012,sg(16)).scale(w*0.95,1,Z*0.5).translate(sd*0.003,-shin-A+0.004,-0.03);
    out.push(pc(bed,(x,y,z,c)=>{ c.set(hex); if(y<-shin-A+0.002) c.multiplyScalar(0.55); else if(y>-shin-A+0.009) c.set(lt).multiplyScalar(0.92+0.08*Math.sin(z*300)); }));
    out.push(solid(cyl(0.003,0.003,0.022,5).translate(sd*0.008,-shin-A+0.018,-0.115),hex));   // the toe post
    for(const k of [-1,1]) out.push(solid(sweepTube([[sd*0.008,-shin-A+0.028,-0.115],[k*w*0.55,-shin-A+0.03,-0.085],[k*w*0.85,-shin-A+0.012,-0.06]],[0.0035,0.0035,0.0035],4,{cap:'round',rings:6}),hex));   // the thong
    for(const k of [-1,1]) out.push(solid(sweepTube([[k*w*0.85,-shin-A+0.012,-0.04],[0,-shin-A+0.042,-0.018],[-k*w*0.85,-shin-A+0.012,0.004]],[0.0042,0.0042,0.0042],4,{cap:'round',rings:7}),hex));   // the crossed straps
    for(let i=0;i<sg(10);i++){ const a=i/sg(10)*TAU; out.push(solid(csph(0.0045,4,3).scale(1.3,0.8,1).translate(Math.sin(a)*(0.031*cw+0.004),-shin+A*0.3+(i%2?0.002:-0.002),Math.cos(a)*(0.033*cw+0.004)),i%2?hex:lt)); }   // the braided ankle band
    out.push(solid(new THREE.BoxGeometry(0.012,0.012,0.004).translate(sd*0.03*cw+sd*0.006,-shin+A*0.3,-0.006),0xc9a13a));   // its buckle
    out.push(solid(sweepTube([[0,-shin+A*0.3,0.03],[0,-shin-A+0.01,0.06]],[0.004,0.004],4,{cap:'round',rings:5}),hex));   // the heel strap
  }
  return out;
}
