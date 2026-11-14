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
  const jawK=Math.max(0.05,(fem?0.3:0.15)*(1-(S.jaw-1)*1.6)*(L.face==='angular'?0.8:L.face==='oval'?1.1:1)), chinK=0.86*S.chin, chinOut=0.008*S.chin, chk=0.007*S.cheeks+0.014*(S.cheeks-1);
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
/* the skull's ball: a sphere whose vertices crowd toward the face (around the -z axis, and in the band from the brows to the mouth), so the nose and the eye sockets
   can be sculpted into the surface itself (no stuck-on pieces, no seam). faceWarp maps a uniform angle to one with density 1 + b near `peak`. */
function faceWarp(lo,hi,peak,wd,b){ const N=256, cum=new Float32Array(N+1);
  for(let i=1;i<=N;i++){ const a=lo+(hi-lo)*(i-0.5)/N; cum[i]=cum[i-1]+1+b*Math.exp(-Math.pow((a-peak)/wd,2)); }
  return a=>{ const t=(a-lo)/(hi-lo)*cum[N]; let i=0, j=N; while(j-i>1){ const m=(i+j)>>1; if(cum[m]<=t) i=m; else j=m; } return lo+(hi-lo)*(i+(t-cum[i])/((cum[j]-cum[i])||1))/N; }; }
function faceSkullGeo(r,w,h){
  const g=new THREE.SphereGeometry(r,w,h), p=g.attributes.position, uv=g.attributes.uv, wp=faceWarp(0,TAU,1.5*Math.PI,0.45,3), wt=faceWarp(0,Math.PI,Math.PI/2+0.2,0.5,1.6);
  for(let i=0;i<p.count;i++){ const ph=wp(clamp(uv.getX(i))*TAU), th=wt(clamp(1-uv.getY(i))*Math.PI); p.setXYZ(i,-r*Math.cos(ph)*Math.sin(th),r*Math.cos(th),r*Math.sin(ph)*Math.sin(th)); }
  return g;
}
/* the face's relief, sculpted into the skull (head coordinates, after the face shape's scale): an eye socket around each eye, a soft brow ridge over them, the nose
   (a low bridge growing out of the brow, a small rounded tip, the hint of two wings, an underside plane back to the lip) and the muzzle a little forward round the mouth.
   R = {ex, ey, SW, SH, E, nS, wk, yR, yT, yB, Ht, fem}. Anime-subtle: from the front the nose is only a little light and shade; the side profile reads as a nose. */
function faceNoseH(R,x,y){
  const {nS,wk,yR,yT,yB,Ht}=R, G=faceG, sm=faceSm, t=clamp((yR-y)/(yR-yT)), sig=lerp(0.0042,0.006,t)*wk;
  let h=y>=yT?sm(yR+0.014,yR,y)*(0.0012+(Ht-0.0012)*Math.pow(t,1.35)):Ht*(1-sm(yT,yB,y));   // the bridge rises slowly to the tip, then the underside falls back
  h*=G(x,0,sig);
  h+=0.0019*nS*G(x,0,0.0052*wk)*G(y,yT+0.0008,0.004);                                      // the tip's soft ball
  h+=0.0016*nS*(G(x,-0.0068*wk,0.0033*wk)+G(x,0.0068*wk,0.0033*wk))*G(y,yT-0.0014,0.0036); // the wings
  return h;
}
function faceRelief(g,R){
  const {ex,ey,SW,SH,E,fem}=R, G=faceG, p=g.attributes.position, sock=0.0095*E, rx=SW*1.06*1.35, ry=SH*1.4, brow=fem?0.0016:0.0026;
  for(let i=0;i<p.count;i++){ const z=p.getZ(i); if(z>-0.02) continue;
    const x=p.getX(i), y=p.getY(i), k=faceSm(-0.02,-0.06,z);
    let d=0;
    for(const sd of [-1,1]) d+=sock*Math.exp(-Math.pow((x-sd*ex)/rx,2)-Math.pow((y-ey-0.001)/ry,2));   // the sockets (the eye sits in them, not on the skin)
    d-=brow*G(y,ey+SH*1.2+0.003,0.008)*G(Math.abs(x),ex*0.95,0.028);                                 // the brow ridge that shades them
    d-=faceNoseH(R,x,y);
    d-=0.0018*G(y,-0.052*HEAD_TALL,0.014)*G(x,0,0.02);                                               // the muzzle: the lips sit a little forward of the cheeks
    p.setZ(i,z+d*k); }
  return g;
}
// the skull's front surface as a function z(x,y): the front-most triangle that covers that point (a face's features are placed with it). The triangles are bucketed in a 1 cm grid.
function frontSurface(g){
  const p=g.attributes.position, ix=g.index.array, T=[], CS=0.01, grid=new Map();
  for(let i=0;i<ix.length;i+=3){ const a=ix[i], b=ix[i+1], c=ix[i+2], ax=p.getX(a), ay=p.getY(a), az=p.getZ(a), bx=p.getX(b), by=p.getY(b), bz=p.getZ(b), cx=p.getX(c), cy=p.getY(c), cz=p.getZ(c);
    if(az+bz+cz<0) T.push([ax,ay,az,bx,by,bz,cx,cy,cz,Math.min(ax,bx,cx),Math.max(ax,bx,cx),Math.min(ay,by,cy),Math.max(ay,by,cy)]); }
  for(const t of T) for(let gx=Math.floor(t[9]/CS);gx<=Math.floor(t[10]/CS);gx++) for(let gy=Math.floor(t[11]/CS);gy<=Math.floor(t[12]/CS);gy++){ const key=gx*1000+gy; let l=grid.get(key); if(!l) grid.set(key,l=[]); l.push(t); }
  return (x,y)=>{ let best=1e9; const cell=grid.get(Math.floor(x/CS)*1000+Math.floor(y/CS));
    if(cell) for(const t of cell){ if(x<t[9]||x>t[10]||y<t[11]||y>t[12]) continue;
      const d=(t[4]-t[7])*(t[0]-t[6])+(t[6]-t[3])*(t[1]-t[7]); if(Math.abs(d)<1e-12) continue;
      const l1=((t[4]-t[7])*(x-t[6])+(t[6]-t[3])*(y-t[7]))/d, l2=((t[7]-t[1])*(x-t[6])+(t[0]-t[6])*(y-t[7]))/d, l3=1-l1-l2;
      if(l1<-1e-6||l2<-1e-6||l3<-1e-6) continue; const z=l1*t[2]+l2*t[5]+l3*t[8]; if(z<best) best=z; }
    return best<1e8?best:-0.09; };
}
/* the pupil: look.pupil is one of FACE_PUPILS (an unknown id is the round one). k = the eye's size factor (E * the iris size); the shapes face -z, centred on the iris, in the pupil's dark colour.
   Round, dot, slit and wide are ellipsoids, the rest flat cut-outs just in front of the iris. */
const FACE_PUPILS=[['round','Round'],['dot','Dot'],['slit','Slit'],['wide','Wide'],['diamond','Diamond'],['star','Star'],['heart','Heart'],['sparkle','Sparkle'],['moon','Crescent'],['ring','Ring']];
function facePupil(shape,k,sg){
  const cy=-0.0008*k, ell=(rx,ry,rz,z)=>csph(1,sg(12),sg(9)).scale(rx*k,ry*k,rz*k).translate(0,cy,z);
  const flat=(sh,r)=>new THREE.ShapeGeometry(sh,6).scale(r*k,r*k,1).rotateY(Math.PI).translate(0,cy,-0.0112);
  if(shape==='dot') return ell(0.0058,0.0078,0.0042,-0.0074);
  if(shape==='slit') return ell(0.0028,0.0225,0.0042,-0.0074);
  if(shape==='wide') return ell(0.0165,0.0062,0.0042,-0.0074);
  if(shape==='diamond'||shape==='star'||shape==='sparkle'){
    const n=shape==='diamond'?2:shape==='star'?5:4, r0=shape==='diamond'?0.0105:shape==='star'?0.0062:0.0035, r1=shape==='diamond'?0.0175:shape==='star'?0.0155:0.0185, sh=new THREE.Shape();
    for(let i=0;i<2*n;i++){ const a=i/(2*n)*TAU+(shape==='star'?0:0), r=(i%2?r0:r1)*(shape==='diamond'&&i%4===2?0.8:1), x=Math.sin(a)*(shape==='diamond'?0.6:1)*r, y=Math.cos(a)*r; if(i) sh.lineTo(x,y); else sh.moveTo(x,y); }
    return flat(sh,1);
  }
  if(shape==='moon'){ const sh=new THREE.Shape(); sh.moveTo(0,0.0165); sh.absarc(0,0,0.0165,Math.PI/2,Math.PI*1.5,false); sh.bezierCurveTo(-0.0075,-0.008,-0.0075,0.008,0,0.0165); return flat(sh,1); }
  if(shape==='ring') return new THREE.RingGeometry(0.0078,0.0155,16).scale(k,k,1).rotateY(Math.PI).translate(0,cy,-0.0112);
  if(shape==='heart'){ const sh=new THREE.Shape(); sh.moveTo(0,-0.0145); sh.bezierCurveTo(-0.0235,0.0015,-0.0135,0.0185,0,0.0085); sh.bezierCurveTo(0.0135,0.0185,0.0235,0.0015,0,-0.0145); return flat(sh,1); }
  return ell(0.0088,0.0138,0.0042,-0.0074);
}
function buildFace(X){
  const {L,S,fem,sg,skin,skinPaint,hairCol}=X, kF=X.kit&&X.kit.sl.face, fs=faceShape(L), sculpt=headSculptFn(X), G=faceG, parts=[];
  const ES=(kF&&kF.eyes)||{}, eI=ES.iris||1, eHt=ES.h||1, eWd=ES.w||1, eLs=ES.lash||1;   // an outfit's eye style: iris size, eye height / width, lash weight, highlight count, tilt (docs/CHARACTER.md section 9)
  const E=S.eyeSize*(fem?1.03:0.9)*0.74, ex=0.046*S.eyeGap*fs[0], ey=(-0.002+0.012*S.eyeHeight)*HEAD_TALL, SW=0.0295*E*eWd, SH=0.0245*E*eHt*0.9*S.eyeOpen;   // 0.9: the base eye is a tenth less tall than it was; eyeOpen narrows / widens the opening only (the iris stays round, the lids cover more of it)
  const nS=S.noseSize*(fem?0.88:1), yT=-0.028*HEAD_TALL, R={ex,ey,SW,SH,E,fem,nS,wk:lerp(1,nS,0.6),yR:ey+0.009,yT,yB:yT-0.0075*nS,Ht:0.0098*nS};
  const skull=smoothN(faceRelief(sculpt(faceSkullGeo(0.105,sg(60),sg(40)),false).scale(fs[0],fs[1],1),R)), zAt=frontSurface(skull);
  const blushC=new THREE.Color(0xe98c88), pos=skull.attributes.position;
  let earX=0.095; { let m=0; for(let i=0;i<pos.count;i++){ if(Math.abs(pos.getY(i)+0.008)<0.012&&pos.getZ(i)>-0.02&&pos.getZ(i)<0.03) m=Math.max(m,Math.abs(pos.getX(i))); } if(m>0) earX=m; }
  parts.push(pc(skull,(x,y,z,c)=>{ skinPaint(c);
    c.multiplyScalar(lerp(0.955,1.02,clamp((y+0.1)/0.2)));   // a smooth form gradient: the jaw and under-chin a little darker, the crown lighter (per-vertex colour, no hash: it must not facet)
    if(L.facial==='stubble'){ const top=lerp(-0.047,-0.022,faceSm(0.035,0.075,Math.abs(x)))*HEAD_TALL; c.lerp(hairCol,0.3*faceSm(top+0.012,top-0.012,y)*faceSm(-0.005,-0.035,z)); }   // a soft shadow over the jaw, chin and upper lip (from the sideburns down at the sides, below the nose in the middle), not a hard band across the face at eye level
    if(z<-0.03) c.lerp(blushC,Math.min(0.8,(fem?0.3:0.22)+0.45*S.blush)*G(Math.abs(x),0.058*fs[0],0.026)*G(y,-0.03*HEAD_TALL,0.024));     // a faint blush on the cheeks (raised: at game distance it used to vanish)
    if(z<-0.04){ const so=G(x,-ex,SW*1.3)*G(y,ey+SH*0.95,SH*0.75)+G(x,ex,SW*1.3)*G(y,ey+SH*0.95,SH*0.75);   // a soft shade in the upper socket, under the brow
      c.multiplyScalar(1-(fem?0.08:0.06)*so); if(fem) c.lerp(blushC,0.08*so);
      c.multiplyScalar(1+0.03*G(x,0,0.004)*G(y,(R.yR+yT)/2,0.012)+0.035*G(x,0,0.005)*G(y,yT+0.002,0.004)-0.12*G(x,0,0.0075)*G(y,yT-0.0048,0.0026)); } }));   // the nose: light on the bridge and tip, shade under it
  // put a feature (built around the origin, facing -z) on the face at (x,y), `push` metres out of the surface, turned to follow the surface's slope
  const place=(g,x,y,push)=>{ const d=0.004, z=zAt(x,y), n=new THREE.Vector3((zAt(x+d,y)-zAt(x-d,y))/(2*d),(zAt(x,y+d)-zAt(x,y-d))/(2*d),-1).normalize();
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,-1),n)));
    return g.translate(x+n.x*push,y+n.y*push,z+n.z*push); };
  const col=(g,hex,m)=>pc(g,c=>{ c.set(hex); if(m) c.multiplyScalar(m); });
  const el=(rx,ry,rz,x,y,z)=>csph(1,sg(14),sg(10)).scale(rx,ry,rz).translate(x,y,z);

  /* eyes: large anime eyes set INTO the sockets (faceRelief): the white is a shallow dome whose edge sinks under the skin, so the opening is where the two meet and the
     eye never stands off the head from the side. On it, following its curve: the iris (a radial gradient, a darker limbal rim, a light crescent below, the upper lid's
     shadow), the pupil (look.pupil: FACE_PUPILS), catchlights (the big one upper left on both eyes); the lid lines are traced along the real opening (eyeEdge):
     a thick dark upper lash line with a flick, the crease above it and a thin lower lid line. Everything is built in the eye's frame (eyeFrame: the socket's normal
     and the tilt), so the sliders and an outfit's eye style move it as one. */
  const eyeC=new THREE.Color(X.kit&&X.kit.eye>=0?X.kit.eye:kF&&kF.eyeColor!==undefined?kF.eyeColor:L.eyes), eyeC2=Number.isFinite(L.eyes2)&&L.eyes2>=0&&!(X.kit&&X.kit.eye>=0)&&!(kF&&kF.eyeColor!==undefined)?new THREE.Color(L.eyes2):eyeC, lashC=new THREE.Color(0x251b1e).lerp(hairCol,0.15), white=new THREE.Color(0xf7f3ef), lidSh=new THREE.Color(0xb9bccb), pinkC=new THREE.Color(0xe7a9a4);
  const SWx=SW*1.06, Wz=0.0098*E, hlN=ES.hl===undefined?2:ES.hl, V=new THREE.Vector3();
  const wf=(u,v)=>-Wz*Math.sqrt(Math.max(0,1-(u/SWx)*(u/SWx)-(v/SH)*(v/SH)));   // the white's front, eye-local z
  const eyeFrame=(cx,cy,rz)=>{ const d=0.004, z=zAt(cx,cy), n=new THREE.Vector3((zAt(cx+d,cy)-zAt(cx-d,cy))/(2*d),(zAt(cx,cy+d)-zAt(cx,cy-d))/(2*d),-1).normalize(), po=0.0008;
    const m=new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,-1),n)).multiply(new THREE.Matrix4().makeRotationZ(rz));
    m.setPosition(cx+n.x*po,cy+n.y*po,z+n.z*po); return {m,nz:Math.max(0.3,-n.z)}; };
  const skinW=(F,u,v)=>{ let w=0; for(let k=0;k<2;k++){ V.set(u,v,w).applyMatrix4(F.m); w-=(V.z-zAt(V.x,V.y))/F.nz; } return w; };   // the skin's eye-local z under (u,v)
  const eyeEdge=(F,u,dir)=>{ const seen=v=>{ const w=wf(u,v); return w<0&&w<skinW(F,u,v); }; if(!seen(0)) return 0; let a=0, b=1.3*SH; for(let k=0;k<9;k++){ const m=(a+b)/2; if(seen(dir*m)) a=m; else b=m; } return dir*(a+b)/2; };
  const lid=(F,ts,fn)=>ts.map((t,i)=>{ const q=fn(t,i); return [q[0],q[1],skinW(F,q[0],q[1])-q[2]]; });
  for(const sd of [-1,1]){
    const F=eyeFrame(sd*ex,ey,sd*(0.06+0.3*(S.eyeTilt+(ES.tilt||0)))), e=[], ic=sd>0?eyeC2:eyeC;   // outer corners up for positive tilt, whichever side
    e.push(pc(new THREE.SphereGeometry(1,sg(18),sg(12),Math.PI,Math.PI).scale(SWx,SH,Wz),(x,y,z,c)=>{ const vy=y/SH, ux=x/SWx;
      c.copy(white).lerp(lidSh,0.6*faceSm(-0.2,0.95,vy)); c.multiplyScalar(1-0.1*faceSm(0.6,1,Math.abs(ux))); c.lerp(pinkC,0.35*faceSm(0.7,1,-sd*ux)); }));   // shaded under the lid, pink at the inner corner
    const IR=0.0185*E*eI, IRy=0.0242*E*eI*Math.min(1,eHt*1.05), icy=-0.0008*E, dome=0.0011*E, nr=Math.max(3,sg(7)), na=Math.max(12,sg(28)), iz=(u,v,r)=>wf(u,v)-0.0003-dome*(1-r*r);
    { const P=[0,icy,iz(0,icy,0)], I=[];
      for(let j=1;j<=nr;j++){ const r=j/nr; for(let i=0;i<na;i++){ const a=i/na*TAU, u=r*IR*Math.cos(a), v=icy+r*IRy*Math.sin(a); P.push(u,Math.max(-0.97*SH,Math.min(0.97*SH,v)),iz(u,v,r)); } }   // a narrow eye: the disc is cut by the lids, not squashed
      for(let i=0;i<na;i++) I.push(0,1+(i+1)%na,1+i);
      for(let j=1;j<nr;j++) for(let i=0;i<na;i++){ const a=1+(j-1)*na+i, b=1+(j-1)*na+(i+1)%na, c=a+na, d=b+na; I.push(a,b,c,b,d,c); }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(P),3)); g.setIndex(I); g.computeVertexNormals();
      e.push(pc(g,(x,y,z,c)=>{ const u=x/IR, vv=(y-icy)/IRy, r=Math.min(1,Math.hypot(u,vv)), a=Math.atan2(vv,u);
        let m=1-0.42*faceSm(-0.15,0.95,vv);                                                // the upper lid's shadow
        m*=1+0.3*faceSm(0,-0.9,vv)*faceSm(0.2,0.7,r);                                      // the light crescent below
        m*=1+0.1*G(r,0.4,0.1)+0.07*Math.cos(a*7)*faceSm(0.3,0.55,r)*faceSm(0.95,0.7,r);  // a lighter ring round the pupil, faint streaks
        m*=1-0.6*faceSm(0.74,0.98,r);                                                      // the darker rim
        c.copy(ic).multiplyScalar(m); if(vv<0) c.lerp(white,0.14*(-vv)*faceSm(0.25,0.75,r)); })); }
    e.push(solid(facePupil(L.pupil,E*eI,sg).translate(0,0,iz(0,icy,0)+0.0104),new THREE.Color(0x14101a).lerp(ic,0.12).getHex()));   // (look.pupil: model-face.js FACE_PUPILS)
    const hl=(rx,ry,x,y,hex)=>{ const r=Math.min(1,Math.hypot(x/IR,(y-icy)/IRy)); e.push(solid(csph(1,sg(10),sg(7)).scale(rx,ry,0.0008).translate(x,y,iz(x,y,r)-0.0017),hex)); };
    if(hlN>=1) hl(0.0068*E,0.0074*E,-0.0062*E,0.0092*E,0xffffff);    // the catchlights: the same side on both eyes (the light is one light)
    if(hlN>=2) hl(0.0033*E,0.0033*E,0.0075*E,-0.0105*E,0xf2f2f2);
    if(hlN>=3) hl(0.0022*E,0.0022*E,-0.0105*E,-0.0035*E,0xf6efe0);
    const LR=[0.001,0.0019,0.0026,0.003,0.0031,0.0028,0.0019,0.0006].map(r=>r*E*eLs*(fem?1:0.88));
    const up=lid(F,[0,0.15,0.32,0.5,0.68,0.85,1],(t,i)=>{ const u=sd*(2*t-1)*SWx*0.985; return [u,eyeEdge(F,u,1)+0.4*LR[i]+0.0025*E*t*t,0.0004]; });
    up.push(lid(F,[1],()=>[sd*SWx*1.2,0.5*SH+0.003*E,0.0003])[0]);   // the flick past the outer corner
    e.push(col(sweepTube(up,LR,sg(7),{cap:'point',rings:sg(16)}),lashC.getHex()));
    e.push(col(sweepTube(lid(F,[0.12,0.3,0.5,0.7,0.9],t=>{ const u=sd*(2*t-1)*SWx*0.92; return [u,eyeEdge(F,u,1)+0.0062*E+0.0012*E*t,0.00025]; }),[0.0005,0.0009,0.001,0.0009,0.0004].map(r=>r*E),sg(5),{cap:'point',rings:sg(10)}),skin.clone().multiplyScalar(fem?0.78:0.85).getHex()));   // the crease
    if(sg(10)>=7) e.push(col(sweepTube(lid(F,[0.2,0.42,0.64,0.84,0.98],t=>{ const u=sd*(2*t-1)*SWx*0.97; return [u,eyeEdge(F,u,-1)-0.0003*E,0.0003]; }),[0.0003,0.0006,0.0007,0.0008,0.0004].map(r=>r*E*(fem?1.3:1)),sg(5),{cap:'point',rings:sg(10)}),lashC.clone().lerp(skin,fem?0.3:0.5).getHex()));   // the lower lid line (darker on a female face)
    parts.push(merge(e).applyMatrix4(F.m));
  }

  /* brows: a tapered arch over each eye, lying on the brow ridge (half sunk into it, so they do not stand off the face from the side); the slider turns them from gentle (inner end up) to stern (inner end down) */
  const by=ey+0.026+(ES.browLift||0), hb=new THREE.Color(hairCol).multiplyScalar(0.62).getHex();
  for(const sd of [-1,1]){
    const b=S.brow+(ES.browAngle||0), P=[[sd*(ex-0.029*E),by-0.007*b,0],[sd*(ex-0.01*E),by+0.0035-0.002*b,0],[sd*(ex+0.012*E),by+0.0045+0.0005*b,0],[sd*(ex+0.032*E),by+0.0005+0.0045*b,0]];
    const t=(fem?1.6:2.2)*(ES.browThick||1), BR=[0.0016*t,0.0027*t,0.0025*t,0.0011*t];
    P.forEach((q,i)=>{ q[2]=zAt(q[0],q[1])-0.0012+0.45*BR[i]; });
    parts.push(col(sweepTube(P,BR,sg(6),{cap:'point',rings:sg(14)}),hb));
  }

  /* nose: sculpted into the skull (faceNoseH in faceRelief: bridge, tip, wings, underside) and shaded in its paint; only the two nostrils are pieces, small dark ovals on the underside */
  for(const sd of [-1,1]) parts.push(col(place(el(0.0017*nS,0.0011*nS,0.0012*nS,0,0,0),sd*0.0034*R.wk,yT-0.0042*nS,-0.0004),skin.clone().multiplyScalar(0.55).getHex()));

  /* mouth: a fine line whose corners lift with a smile, a fuller lower lip (and an upper one on a female face) */
  { const mw=0.0165*S.mouthSize*(fem?0.92:1), my=(-0.062+0.008*S.mouthHeight)*HEAD_TALL, sm=S.smile, lipsC=skin.clone().lerp(_tint.set(Number.isFinite(L.lipColor)&&L.lipColor>=0?L.lipColor:0xb04a52),Number.isFinite(L.lipColor)&&L.lipColor>=0?0.8:fem?0.62:0.4), line=lipsC.clone().multiplyScalar(0.45).getHex();
    const P=[]; for(let i=0;i<=6;i++){ const u=i/6*2-1, x=u*mw, y=my+sm*0.0055*u*u-0.0013*(1-u*u)*(1+0.3*sm); P.push([x,y,zAt(x,y)-0.0007]); }
    parts.push(col(sweepTube(P,[0.0012,0.0022,0.0028,0.003,0.0028,0.0022,0.0012],sg(6),{cap:'point',rings:sg(14)}),line));   // (thicker than a hairline: the mouth vanished at game distance)
    // the lips: two surfaces that grow out of the mouth line and lie on the face (not two ovals stuck on it). The upper one has a cupid's bow (two peaks, a dip between), the lower one
    // is fullest in the middle; both taper to nothing at the corners, swell a little, and fade into the skin at their outer edge
    const lw=S.lips, lo=new THREE.Color(lipsC), LW=mw*0.9, yl=u=>my+sm*0.0055*u*u-0.0013*(1-u*u)*(1+0.3*sm);
    const hU=u=>(fem?0.0043:0.0027)*lw*Math.pow(Math.max(0,1-u*u),0.8)*(1-0.24*G(u,0,0.15))*(1+0.22*G(Math.abs(u),0.3,0.2)), hLo=u=>(fem?0.0064:0.005)*lw*Math.pow(Math.max(0,1-u*u),0.62);
    const gap=sm>0.55?0.0046*(sm-0.45):0;   // a wide smile parts the lips over the teeth
    const lipGeo=up=>{ const nu=Math.max(6,sg(18)), nv=sg(100)>=50?5:3, pos=[], idx=[], W=nu+1;
      for(let j=0;j<=nv;j++) for(let i=0;i<=nu;i++){ const u=i/nu*2-1, v=j/nv, x=u*LW, h=up?hU(u):hLo(u), y=yl(u)+(up?h*v:-gap*(1-u*u)-h*v), out=(up?0.0013:0.0021)*Math.min(1.4,lw)*Math.pow(Math.sin(Math.PI*Math.min(1,v*1.08)),0.8)*Math.sqrt(Math.max(0,1-u*u));
        pos.push(x,y,zAt(x,y)-0.0003-out); }
      for(let j=0;j<nv;j++) for(let i=0;i<nu;i++){ const a0=j*W+i, b0=a0+1, c0=a0+W, d0=c0+1; if(up) idx.push(a0,c0,b0,b0,c0,d0); else idx.push(a0,b0,c0,b0,d0,c0); }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3)); g.setIndex(idx); return smoothN(g); };
    const lipPaint=up=>(x,y,z,c)=>{ const u=clamp(x/LW,-1,1), h=(up?hU(u):hLo(u))||1e-6, v=clamp((Math.abs(y-yl(u))-(up?0:gap*(1-u*u)))/h);
      c.copy(lo).multiplyScalar(up?0.9:1.0+0.1*G(v,0.45,0.25)*G(u,0,0.5)); c.lerp(skin,(fem?0:0.25)+(1-(fem?0:0.25))*0.75*faceSm(0.62,1,v)); };
    parts.push(pc(lipGeo(false),lipPaint(false)));
    if(fem||lw>1.15) parts.push(pc(lipGeo(true),lipPaint(true)));
    if(sm>0.55){ const teeth=place(el(mw*0.62,gap*0.62,0.0016,0,0,0),0,my-0.0017-gap*0.5,0.0002); parts.push(solid(teeth,0xf4f0ea)); }   // a wide smile shows teeth
  }

  /* ears: a flattened shell with a hollow, a lobe, and (earPoint) an elf's long tip */
  { const es=S.earSize*(fem?0.95:1), pt=S.earPoint;
    for(const sd of [-1,1]){ const x0=sd*(earX-0.002), y0=-0.008*HEAD_TALL, z0=0.012, ear=[];
      ear.push(pc(el(0.0068,0.0235*es,0.0155*es,0,0,0).rotateZ(sd*-0.1).rotateY(sd*0.3).translate(x0,y0,z0),(x,y,z,c)=>skinPaint(c)));
      ear.push(pc(el(0.0034,0.0135*es,0.0085*es,0,0,0).rotateY(sd*0.3).translate(x0+sd*0.0045,y0+0.002,z0-0.001),(x,y,z,c)=>{ skinPaint(c); c.multiplyScalar(0.82); }));
      ear.push(pc(el(0.0046*es,0.0078*es,0.0066*es,x0+sd*0.0012,y0-0.0172*es,z0-0.0015),(x,y,z,c)=>skinPaint(c)));   // the lobe: the shell's rounded lower end (a ball hanging under it read as an earring)
      if(sg(100)>=50) ear.push(pc(sweepTube([[x0+sd*0.0035,y0+0.012*es,z0-0.0095*es],[x0+sd*0.0048,y0+0.0215*es,z0-0.001*es],[x0+sd*0.0062,y0+0.0165*es,z0+0.0105*es],[x0+sd*0.0066,y0+0.002*es,z0+0.0142*es],[x0+sd*0.005,y0-0.011*es,z0+0.0105*es]],[0.002*es,0.0029*es,0.003*es,0.0027*es,0.0016*es],sg(6),{rings:sg(14)}),(x,y,z,c)=>skinPaint(c)));   // the helix: a rolled rim over the top and down the back (not on phones: the triangle budget)
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
