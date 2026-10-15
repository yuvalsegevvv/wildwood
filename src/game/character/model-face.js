//@ The hiker's head: an anime-leaning face (moderate eyes with highlights and lashes, a small nose and mouth, brows, ears, a rounded chin) on a sculpted skull that the face sliders reshape
/* ---------- the head ----------
   Head-local coordinates: the head's centre is the origin, the face looks along -z, the skull radius is 0.105 before the face shape scales it.
   The caller (buildCharacter in model.js) makes the context X = {L, S (clamped sliders), fem, sg (a segment count scaled by the detail factor), skin, skinPaint, hairCol}.
   (Realistic-leaning anime: eyes about a fifth of the face width, a softly rounded chin.)
   Every feature is placed on the skull with `place`, which reads the skull's real front surface (frontSurface), so the jaw / cheek / chin / eye sliders cannot leave an eye floating or buried. */
const faceG=(v,m,w)=>Math.exp(-Math.pow((v-m)/w,2));
const faceSm=(a,b,v)=>{ const t=clamp((v-a)/(b-a)); return t*t*(3-2*t); };
// the head is HEAD_TALL (10%) taller than a round skull: a longer forehead and lower face (the owner asked for it); the features keep their sizes and move with it
const HEAD_TALL=1.1;
function faceShape(L){ const f=L.face==='oval'?[0.93,1.08]:L.face==='round'?[1.04,0.97]:[0.97,1.03]; return [f[0],f[1]*HEAD_TALL]; }
/* sculpt: turns a ball around the head's centre into a head shape (jaw, chin, cheekbones, the back of the skull). Used on the skull and on everything that
   wraps it (hair, beards, hats), so they keep fitting. Anime-leaning face: a flat front, a jaw that tapers only a little to a rounded chin (a sharper one looked exaggerated). */
function headSculptFn(X){
  const {L,S,fem}=X, G=faceG, sm=faceSm;
  const jawK=Math.max(0.05,(fem?0.3:0.24)*(1-(S.jaw-1)*1.6)*(L.face==='angular'?0.8:L.face==='oval'?1.1:1)), chinK=0.86*S.chin, chinOut=0.008*S.chin, chk=0.007*S.cheeks+0.014*(S.cheeks-1);
  return (g,face)=>{ const p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      let x=p.getX(i), y=p.getY(i), z=p.getZ(i); const front=z<0, ax=Math.abs(x);
      const jaw=sm(-0.015,-0.1,y);                                   // 0 above the cheeks, 1 at the chin
      x*=1-jaw*jawK;                                                 // the jaw narrows toward the chin
      if(front){
        z-=chinOut*G(y,-0.086,0.022)*G(x,0,0.03);                    // chin
        z*=1-0.09*G(y,0.0,0.07);                                     // a flat face, not a ball
        x+=Math.sign(x)*chk*G(y,-0.025,0.026)*G(z,-0.075,0.03);      // cheekbones
        if(face) z+=0.004*G(y,-0.006,0.02)*G(ax,0.044,0.022);        // a shallow hollow for each eye
      } else {
        z*=1+0.1*G(y,0.025,0.055);                                   // the back of the skull
        z*=1-0.2*jaw;                                                // tucks in toward the neck
      }
      x*=1-0.035*G(y,0.035,0.03)*sm(-0.02,-0.08,z);                  // temples
      if(y<-0.07) y=-0.07+(y+0.07)*chinK;                            // a shorter underside, so the head meets the neck
      p.setXYZ(i,x,y,z);
    }
    return smoothN(g); };
}
// the skull's front surface as a function z(x,y): the front-most triangle that covers that point (a face's features are placed with it)
function frontSurface(g){
  const p=g.attributes.position, ix=g.index.array, T=[];
  for(let i=0;i<ix.length;i+=3){ const a=ix[i], b=ix[i+1], c=ix[i+2], ax=p.getX(a), ay=p.getY(a), az=p.getZ(a), bx=p.getX(b), by=p.getY(b), bz=p.getZ(b), cx=p.getX(c), cy=p.getY(c), cz=p.getZ(c);
    if(az+bz+cz<0) T.push([ax,ay,az,bx,by,bz,cx,cy,cz,Math.min(ax,bx,cx),Math.max(ax,bx,cx),Math.min(ay,by,cy),Math.max(ay,by,cy)]); }
  return (x,y)=>{ let best=1e9;
    for(const t of T){ if(x<t[9]||x>t[10]||y<t[11]||y>t[12]) continue;
      const d=(t[4]-t[7])*(t[0]-t[6])+(t[6]-t[3])*(t[1]-t[7]); if(Math.abs(d)<1e-12) continue;
      const l1=((t[4]-t[7])*(x-t[6])+(t[6]-t[3])*(y-t[7]))/d, l2=((t[7]-t[1])*(x-t[6])+(t[0]-t[6])*(y-t[7]))/d, l3=1-l1-l2;
      if(l1<-1e-6||l2<-1e-6||l3<-1e-6) continue; const z=l1*t[2]+l2*t[5]+l3*t[8]; if(z<best) best=z; }
    return best<1e8?best:-0.09; };
}
function buildFace(X){
  const {L,S,fem,sg,skin,skinPaint,hairCol}=X, kF=X.kit&&X.kit.sl.face, fs=faceShape(L), sculpt=headSculptFn(X), G=faceG, parts=[];
  const skull=sculpt(csph(0.105,sg(44),sg(30)),true).scale(fs[0],fs[1],1), zAt=frontSurface(skull);
  const blushC=new THREE.Color(0xe98c88), pos=skull.attributes.position;
  let earX=0.095; { let m=0; for(let i=0;i<pos.count;i++){ if(Math.abs(pos.getY(i)+0.008)<0.012&&pos.getZ(i)>-0.02&&pos.getZ(i)<0.03) m=Math.max(m,Math.abs(pos.getX(i))); } if(m>0) earX=m; }
  parts.push(pc(skull,(x,y,z,c)=>{ skinPaint(c);
    if(L.facial==='stubble'&&y<-0.018*HEAD_TALL&&z<-0.02) c.lerp(hairCol,0.3);
    if(z<-0.03) c.lerp(blushC,(fem?0.2:0.1)*G(Math.abs(x),0.058*fs[0],0.022)*G(y,-0.03*HEAD_TALL,0.02)); }));     // a faint blush on the cheeks
  // put a feature (built around the origin, facing -z) on the face at (x,y), `push` metres out of the surface, turned to follow the surface's slope
  const place=(g,x,y,push)=>{ const d=0.004, z=zAt(x,y), n=new THREE.Vector3((zAt(x+d,y)-zAt(x-d,y))/(2*d),(zAt(x,y+d)-zAt(x,y-d))/(2*d),-1).normalize();
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,-1),n)));
    return g.translate(x+n.x*push,y+n.y*push,z+n.z*push); };
  const col=(g,hex,m)=>pc(g,c=>{ c.set(hex); if(m) c.multiplyScalar(m); });
  const el=(rx,ry,rz,x,y,z)=>csph(1,sg(14),sg(10)).scale(rx,ry,rz).translate(x,y,z);

  /* eyes: a wide almond white, an iris that nearly fills its height (lighter below), a pupil, two highlights, an upper lash with a flick, the lid's crease,
     and (female) a fine lower lash. The upper lash line is what reads as "anime"; keep the rest quiet. */
  const ES=(kF&&kF.eyes)||{}, eI=ES.iris||1, eHt=ES.h||1, eWd=ES.w||1, eLs=ES.lash||1;   // an outfit's eye style: iris size, eye height / width, lash weight, highlight count, tilt (docs/CHARACTER.md section 9)
  const E=S.eyeSize*(fem?1.03:1)*0.74, ex=0.046*S.eyeGap*fs[0], ey=(-0.002+0.012*S.eyeHeight)*HEAD_TALL, eyeC=new THREE.Color(kF&&kF.eyeColor!==undefined?kF.eyeColor:L.eyes), lashC=new THREE.Color(0x251b1e).lerp(hairCol,0.15), white=new THREE.Color(0xf7f3ef);
  const SW=0.0295*E*eWd, SH=0.0245*E*eHt;
  for(const sd of [-1,1]){
    const e=[];
    e.push(pc(el(SW,SH,0.008,0,0,0),(x,y,z,c)=>{ c.copy(white); if(y>SH*0.35) c.multiplyScalar(0.84); }));
    e.push(pc(el(0.0185*E*eI,0.0242*E*eI*Math.min(1,eHt*1.05),0.0052,0,-0.0008*E,-0.0046),(x,y,z,c)=>{ const u=x/(0.0185*E*eI), v=(y+0.0008*E)/(0.0242*E*eI*Math.min(1,eHt*1.05)), r=Math.hypot(u,v);
      c.copy(eyeC).multiplyScalar((0.86-0.28*v)*(1-0.4*smoothstep(0.66,1,r))); if(v<0) c.lerp(white,-0.16*v); }));
    e.push(solid(el(0.0088*E*eI,0.0138*E*eI,0.0042,0,-0.0008*E,-0.0074),0x14101a));
    if((ES.hl===undefined?2:ES.hl)>=1) e.push(solid(el(0.0068*E,0.0074*E,0.002,-0.0062*E,0.0092*E,-0.0098),0xffffff));
    if((ES.hl===undefined?2:ES.hl)>=2) e.push(solid(el(0.0033*E,0.0033*E,0.0015,0.0075*E,-0.0105*E,-0.0094),0xf2f2f2));
    if((ES.hl||2)>=3) e.push(solid(el(0.0022*E,0.0022*E,0.0013,-0.0105*E,-0.0035*E,-0.0092),0xf6efe0));
    const arc=(lift,yk,x0,x1)=>{ const P=[]; for(const t of [0,0.15,0.3,0.5,0.7,0.85,1]){ const u=2*t-1; P.push([sd*(x0+t*(x1-x0))*E,yk*Math.pow(Math.max(0,1-u*u),0.5)*E+lift*E*t,-0.0026]); } return P; };
    const up=arc(0.003,0.0262,-0.0298,0.0298); up.push([sd*0.0368*E,0.0128*E,-0.0021]);
    e.push(col(sweepTube(up,[0.0009,0.0017,0.0023,0.0025,0.0022,0.0014,0.0007,0.0003].map(r=>r*E*eLs),sg(7),{cap:'point',rings:sg(16)}),lashC.getHex()));
    e.push(col(sweepTube(arc(0.002,0.031,-0.026,0.03).map(q=>[q[0],q[1]+0.0042*E,q[2]+0.0008]),[0.0006,0.001,0.0011,0.001,0.0005].map(r=>r*E),sg(5),{cap:'point',rings:sg(10)}),skin.clone().multiplyScalar(fem?0.8:0.88).getHex()));
    if(fem&&sg(10)>=9) e.push(col(sweepTube([[-sd*0.0225*E,-0.0185*E,-0.0036],[sd*0.002*E,-0.0262*E,-0.0036],[sd*0.0255*E,-0.0165*E,-0.0036]],[0.0005,0.0009,0.0005].map(r=>r*E),sg(5),{cap:'point',rings:8}),lashC.getHex()));
    const eye=merge(e).rotateZ(sd*(0.06+0.3*(S.eyeTilt+(ES.tilt||0))));   // outer corners up for positive tilt, whichever side
    parts.push(place(eye,sd*ex,ey,0.0015));
  }

  /* brows: a tapered arch over each eye; the slider turns them from gentle (inner end up) to stern (inner end down) */
  const by=ey+0.026+(ES.browLift||0), hb=new THREE.Color(hairCol).multiplyScalar(0.78).getHex();
  for(const sd of [-1,1]){
    const b=S.brow+(ES.browAngle||0), P=[[sd*(ex-0.029*E),by-0.007*b,0],[sd*(ex-0.01*E),by+0.0035-0.002*b,0],[sd*(ex+0.012*E),by+0.0045+0.0005*b,0],[sd*(ex+0.032*E),by+0.0005+0.0045*b,0]];
    P.forEach(q=>{ q[2]=zAt(q[0],q[1])-0.0012; });
    const t=(fem?1:1.5)*(ES.browThick||1); parts.push(col(sweepTube(P,[0.0016*t,0.0027*t,0.0025*t,0.0011*t],sg(6),{cap:'point',rings:sg(14)}),hb));
  }

  /* nose: a tiny rounded tip with two wings and nostril dots (anime noses are little more than a hint, and have no bridge line) */
  { const nS=S.noseSize*(fem?0.88:1), n=[];
    n.push(pc(sweepTube([[0,0.008,0.002],[0,-0.001,-0.004*nS],[0,-0.007,-0.0082*nS]],[0.0015*nS,0.0028*nS,0.0045*nS],sg(8),{cap:'round',rings:sg(8)}),(x,y,z,c)=>skinPaint(c)));
    n.push(pc(el(0.0058*nS,0.005*nS,0.0055*nS,0,-0.0085,-0.0085*nS),(x,y,z,c)=>{ skinPaint(c); c.multiplyScalar(0.985); }));
    for(const sd of [-1,1]){ n.push(pc(el(0.0028*nS,0.003*nS,0.003*nS,sd*0.0048*nS,-0.0078,-0.0052*nS),(x,y,z,c)=>{ skinPaint(c); c.multiplyScalar(0.96); }));
      n.push(col(el(0.0013*nS,0.001*nS,0.001*nS,sd*0.0025*nS,-0.0118,-0.0088*nS),skin.clone().multiplyScalar(0.62).getHex())); }
    parts.push(place(merge(n),0,-0.02*HEAD_TALL,0)); }

  /* mouth: a fine line whose corners lift with a smile, a fuller lower lip (and an upper one on a female face) */
  { const mw=0.0165*S.mouthSize*(fem?0.92:1), my=-0.062*HEAD_TALL, sm=S.smile, lipsC=skin.clone().lerp(_tint.set(0xb04a52),fem?0.62:0.4), line=lipsC.clone().multiplyScalar(0.5).getHex();
    const P=[]; for(let i=0;i<=6;i++){ const u=i/6*2-1, x=u*mw, y=my+sm*0.0055*u*u-0.0013*(1-u*u)*(1+0.3*sm); P.push([x,y,zAt(x,y)-0.0007]); }
    parts.push(col(sweepTube(P,[0.0008,0.0015,0.0019,0.002,0.0019,0.0015,0.0008],sg(6),{cap:'point',rings:sg(14)}),line));
    const lw=S.lips; const lo=new THREE.Color(lipsC);
    const lower=place(el(mw*0.6,0.0046*lw,0.0036,0,0,0),0,my-0.0058-0.001*sm,0.0008); parts.push(pc(lower,c=>c.copy(lo).multiplyScalar(1.04)));
    if(fem||lw>1.15){ const upper=place(el(mw*0.5,0.0030*lw,0.003,0,0,0),0,my+0.0028,0.0004); parts.push(pc(upper,c=>c.copy(lo).multiplyScalar(0.92))); }
    if(sm>0.55){ const teeth=place(el(mw*0.5,0.0022*(sm-0.45),0.002,0,0,0),0,my-0.0035,0.0003); parts.push(solid(teeth,0xf4f0ea)); }   // a wide smile shows teeth
  }

  /* ears: a flattened shell with a hollow, a lobe, and (earPoint) an elf's long tip */
  { const es=S.earSize*(fem?0.95:1), pt=S.earPoint;
    for(const sd of [-1,1]){ const x0=sd*(earX-0.002), y0=-0.008*HEAD_TALL, z0=0.012, ear=[];
      ear.push(pc(el(0.0068,0.0235*es,0.0155*es,0,0,0).rotateZ(sd*-0.1).rotateY(sd*0.3).translate(x0,y0,z0),(x,y,z,c)=>skinPaint(c)));
      ear.push(pc(el(0.0034,0.0135*es,0.0085*es,0,0,0).rotateY(sd*0.3).translate(x0+sd*0.0045,y0+0.002,z0-0.001),(x,y,z,c)=>{ skinPaint(c); c.multiplyScalar(0.82); }));
      ear.push(pc(el(0.0052*es,0.0062*es,0.0058*es,x0+sd*0.0012,y0-0.0225*es,z0-0.002),(x,y,z,c)=>skinPaint(c)));
      if(pt>0.03){ const T=[[x0,y0+0.016*es,z0+0.003],[x0+sd*0.014,y0+0.03*es+0.02*pt,z0+0.007+0.01*pt],[x0+sd*0.026+sd*0.012*pt,y0+0.042*es+0.05*pt,z0+0.015+0.026*pt]];
        ear.push(pc(sweepTube(T,[0.0085,0.0052,0.0011],sg(8),{cap:'point',rings:sg(10)}),(x,y,z,c)=>skinPaint(c))); }
      parts.push(...ear); }
  }

  /* facial hair: a moustache over the lip; a beard as a chin piece (the mouth stays open) and two jaw pieces */
  const hairPaint=m=>c=>c.copy(hairCol).multiplyScalar(m);
  if(L.facial==='beard'||L.facial==='mustache'){
    const mz=zAt(0,-0.047*HEAD_TALL);
    parts.push(pc(csph(1,sg(12),sg(8)).scale(0.0215,0.0058,0.0085).translate(0,-0.0475*HEAD_TALL,mz+0.0012),hairPaint(0.9)));
    for(const sd of [-1,1]) parts.push(pc(el(0.0075,0.0042,0.0065,0,0,0).rotateZ(sd*0.45).translate(sd*0.0215,-0.0495*HEAD_TALL,zAt(sd*0.0215,-0.0495*HEAD_TALL)+0.0008),hairPaint(0.9)));   // (turned first, then moved: turned after moving it swung to the cheek)
  }
  if(L.facial==='beard'){
    // one patch of a slightly larger ball over the jaw and chin, from ear to ear and from the lower lip down; where its mask fades to 0 (the edges, the mouth) the ball sinks
    // 7 mm inside the skull, so the beard has no cut edge standing off the face
    const g=new THREE.SphereGeometry(1,sg(40),sg(20),Math.PI,Math.PI,0.42*Math.PI,0.56*Math.PI), bp=g.attributes.position;
    for(let i=0;i<bp.count;i++){ const x=bp.getX(i), y=bp.getY(i), z=bp.getZ(i), th=Math.acos(clamp(y,-1,1)), side=Math.abs(x);   // th: 0 at the top, PI at the chin's underside
      const top=lerp(0.735,0.5,smoothstep(0.55,0.97,side))*Math.PI;                      // the beard starts below the lip in front and at the ear at the sides
      const m=smoothstep(0,0.07*Math.PI,th-top)*smoothstep(0.985*Math.PI,0.92*Math.PI,th)*smoothstep(-0.05,0.25,-z);                     // below the start line, above the underside, in front of the ears
      const r=lerp(0.098,0.1135,m); bp.setXYZ(i,x*r,y*r,z*r); }
    smoothN(g); parts.push(pc(sculpt(g,false).scale(fs[0],fs[1]*1.0,1),(x,y,z,c)=>{ c.copy(hairCol).multiplyScalar(0.9-0.12*smoothstep(-0.05,-0.1,y)); }));
  }
  // the face item of an outfit (a decal laid on the skull) and its facial hair / glasses: kF.mark(F) / kF.facial(F) return painted geometries in head-local coordinates; F carries the helpers
  const F={parts,sculpt,fs,zAt,earX,place,col,el,skull,hairCol,skin};
  if(kF){ if(kF.mark) parts.push(...kF.mark(F)); if(kF.facial) parts.push(...kF.facial(F)); }
  return F;
}
