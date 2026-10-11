//@ Torgeir's outfit (a northern shield-wall veteran): an iron spangen cap-helm with a fur rim, paired bone-bound braids, a quilted slate coat with a fur mantle on one shoulder and a banded iron spaulder on the other, strapped iron greaves, fur-cuffed fell boots, a belt horn, and the lichen-wrap weapon dressing
/* ---------- Torgeir: tank, earth. Design: docs/skillkits/looks/torgeir.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: slate 0x3f5668, bone 0xe3dccb, iron 0x5d6168, lichen 0x7d8c5a, fur grey 0x8f8a80. The silhouette is a wall: the widest body of the eight, a heavy fur mantle on the right shoulder,
   a banded iron spaulder on the left, a cap-helm with a fur rim over a small head, two thick braids on the chest, iron-plated shins. Earth: no glow but one dull ochre bead on the weapon charm. */
CHAR_MODELS.torgeir={id:'torgeir',name:'Torgeir',signature:true,sexes:['male'],
  note:'The shield-wall veteran: a heavy mantle, an iron cap-helm and a wall of a body, built for a broad, tall man.',
  ranges:{height:[0.96,1.08],build:[1.0,1.18],chest:[0.9,1.25],shoulders:[1.0,1.18],arms:[0.95,1.25],neck:[0.95,1.2],legs:[0.92,1.06],thighs:[0.95,1.25],head:[0.95,1.1],hairLength:[1.0,1.35],hairVolume:[0.9,1.15]},
  setups:[{id:'torgeir',name:'Torgeir',sex:'male',def:true,note:'The veteran as drawn: wide, tall, a plain stern face.',v:{height:1.04,build:1.16,chest:1.05,shoulders:1.14,waist:1.04,hips:0.98,torso:1.04,legs:0.98,thighs:1.22,arms:1.2,neck:1.15,hands:1.15,feet:1.1,jaw:1.1,chin:1.08,cheeks:0.95,eyeSize:0.95,eyeHeight:-0.1,eyeTilt:-0.1,brow:0.15,noseSize:1.1,lips:0.85,hairLength:1.25,bangs:0.5}}]};

OUTFITS.torgeir=(function(){
  const SLATE=0x3f5668, SLATE_D=0x2b3a47, SLATE_L=0x587490, BONE=0xe3dccb, BONE_D=0xb4ab95, IRON=0x5d6168, IRON_L=0x8a8f97, IRON_D=0x383b41, LICHEN=0x7d8c5a, LICHEN_D=0x566640,
    FUR=0x8f8a80, FUR_L=0xbdb8ac, FUR_D=0x5c584f, LEATHER=0x4a3a2c, LEATHER_D=0x2c2118, LEATHER_L=0x735b44, WOOL=0x6a794c, WOOL_D=0x4f5c37, BOOT=0x4e3a2a, SOLE=0x221a14,
    HAIR=0xa8a398, HAIR_D=0x77736a, SCAR=0xc89888, OCHRE=0xb59a4a;
  const cSlate=ofCol(SLATE), cSlateD=ofCol(SLATE_D), cSlateL=ofCol(SLATE_L), cBone=ofCol(BONE), cBoneD=ofCol(BONE_D), cIron=ofCol(IRON), cIronL=ofCol(IRON_L), cIronD=ofCol(IRON_D),
    cLichen=ofCol(LICHEN), cLichenD=ofCol(LICHEN_D), cFur=ofCol(FUR), cFurL=ofCol(FUR_L), cFurD=ofCol(FUR_D), cLeather=ofCol(LEATHER), cLeatherD=ofCol(LEATHER_D), cLeatherL=ofCol(LEATHER_L),
    cWool=ofCol(WOOL), cWoolD=ofCol(WOOL_D), cBoot=ofCol(BOOT), cSole=ofCol(SOLE), cHair=ofCol(HAIR), cHairD=ofCol(HAIR_D);
  // matted grey fur: three tones in clumps (noise on the position), no allocation
  const furPaint=(c,x,y,z,seed)=>{ const n=noise2(x*44+seed,y*44-z*38); c.copy(cFur); if(n>0.12) c.lerp(cFurL,Math.min(1,(n-0.12)*1.7)); else if(n<-0.12) c.lerp(cFurD,Math.min(1,(-0.12-n)*1.7)); };
  // a table of stations [t, rx, rz, zc] read at t (piecewise linear: the limb is a smooth curve through the same stations, so keep a few mm of margin)
  const lin=(st,t)=>{ t=clamp(t); let i=1; while(i<st.length-1&&t>st[i][0]) i++; const a=st[i-1], b=st[i], f=clamp((t-a[0])/((b[0]-a[0])||1)); return [lerp(a[1],b[1],f),lerp(a[2],b[2],f),lerp(a[3]||0,b[3]||0,f)]; };
  // the onion dome of the fur mantle round the shoulder joint, in units of the arm's radius: [radius, y] from the top down
  const DOME=[[0.001,1.6],[0.66,1.52],[1.18,1.22],[1.6,0.8],[1.84,0.3],[1.9,-0.25],[1.8,-0.8],[1.7,-1.3]];
  const domeR=(y,ra)=>{ const k=y/ra; if(k>=DOME[0][1]) return 0.001; for(let i=1;i<DOME.length;i++){ if(k>=DOME[i][1]){ const a=DOME[i-1], b=DOME[i], f=(k-b[1])/((a[1]-b[1])||1); return ra*lerp(b[0],a[0],f); } } return ra*DOME[DOME.length-1][0]; };

  return function(X,D){
    const {S,sg,skin,skinPaint}=X, TK=D.TK, aw=D.aw, tw=D.tw, cw=D.cw, hs=D.hs, B=D.B, KR=D.KR, ER=D.ER, ts=yd=>torsoSize(X,D,yd);
    const THIGH=[[0,0.088*tw,0.092*tw,0],[0.14,0.09*tw,0.094*tw,0],[0.42,0.077*tw,0.081*tw,-0.004],[0.76,Math.max(KR*1.1,0.057*tw),Math.max(KR*1.12,0.06*tw),-0.002],[1,KR,KR*1.04,0]];
    const SHIN=[[0,KR,KR*1.04,0],[0.14,0.0505*cw,0.054*cw,0.005],[0.3,0.052*cw,0.057*cw,0.011],[0.5,0.041*cw,0.044*cw,0.007],[0.6,0.045*cw,0.048*cw,0.005],[0.66,0.042*cw,0.045*cw,0.005],[0.85,0.037*cw,0.039*cw,0],[1,0.033*cw,0.035*cw,0]];
    const FORE=[[0,ER,ER*1.04,0],[0.1,0.037*aw,0.038*aw,0],[0.34,0.0305*aw,0.03*aw,0],[0.7,0.0235*aw,0.0235*aw,0],[0.82,0.02*aw,0.02*aw,0]];
    const ra=0.05*aw;                                            // the arm's radius at the shoulder
    const ringAt=(yd,m)=>{ const s=ts(yd); return {y:yd*TK,rx:s.rx+m,rz:(s.rz+s.rzBack)/2+m,zc:(s.rzBack-s.rz)/2}; };   // a loft ring round the torso, m metres clear of it
    // an elliptical ring (a belt, a band, a roll, piping) as a tube round the ellipse (rx, rz) centred (0, y, zc); the geometry is left unpainted
    const ringGeo=(y,rx,rz,zc,r,seg)=>{ const P=[], n=16; for(let i=0;i<=n;i++){ const a=i/n*TAU*1.03; P.push([rx*Math.sin(a),y,rz*Math.cos(a)+zc]); } return sweepTube(P,[r,r],sg(seg||4),{cap:'round',rings:sg(11)}); };
    const eRing=(y,rx,rz,zc,r,hex,seg)=>solid(ringGeo(y,rx,rz,zc,r,seg),hex);
    // a tuft of fur: a tapering curved tube from p along dir, dark at its root and light at its tip
    const tuft=(p,dir,len,r,c0,c1)=>{ const q1=[p[0]+dir[0]*len*0.5,p[1]+dir[1]*len*0.5,p[2]+dir[2]*len*0.5], q2=[p[0]+dir[0]*len,p[1]+dir[1]*len-len*0.12,p[2]+dir[2]*len];
      return pc(sweepTube([p,q1,q2],[r,r*0.8,r*0.12],sg(5),{cap:'point',rings:4}),(x,y,z,c)=>{ const k=clamp(((x-p[0])*dir[0]+(y-p[1])*dir[1]+(z-p[2])*dir[2])/len); c.copy(c0).lerp(c1,k); }); };
    const nrm=(x,y,z)=>{ const l=Math.hypot(x,y,z)||1; return [x/l,y/l,z/l]; };
    // a sheet of fur from a function of the grid cell (j = column 0..nU, i = row 0..nV): rows run top to bottom and columns turn the way a loft's angle does (x = r sin a, z = r cos a), so the faces look outward
    const furGrid=(nU,nV,fn)=>{ const pos=new Float32Array((nU+1)*(nV+1)*3), idx=[];
      for(let i=0;i<=nV;i++) for(let j=0;j<=nU;j++){ const p=fn(j,i), o=(i*(nU+1)+j)*3; pos[o]=p[0]; pos[o+1]=p[1]; pos[o+2]=p[2]; }
      for(let i=0;i<nV;i++) for(let j=0;j<nU;j++){ const a=i*(nU+1)+j, b=a+1, c=a+nU+1, d=c+1; idx.push(a,c,b,b,c,d); }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); return smoothN(g); };
    // locks: a long one every third column, the ones between short, so a fur hem ends in points; lo..hi metres, seeded, the last column repeats the first (a ring)
    const locks=(nU,seed,lo,hi,per)=>{ per=per||3; const r=mulberry32(seed), L=[]; for(let j=0;j<=nU;j++) L.push(j%per===0?lo+(hi-lo)*r():0); L[nU]=L[0]; return L; };
    const TEETH=Math.max(5,Math.round(15*X.q));

    /* ---- the paint of the body: slate quilted sleeves with a bone cord, leather bracers, wool trousers, leather boots with iron toes ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso':
          if(y>0.012&&y<0.07){ c.copy(cLeather); return; }
          c.copy(y<=0.012?cSlateD:cSlate); return;
        case 'upperArm': { c.copy(cSlate); const a=-y; if(a>0.045){ const f=((a/0.07)%1+1)%1; if(f<0.09) c.lerp(cSlateD,0.85); else if(f>0.4&&f<0.6) c.lerp(cSlateL,0.18); }
          if(a>0.188&&a<0.2) c.copy(cBone); return; }
        case 'foreArm':
          if(y<-0.225) skinPaint(c); else if(y<-0.2) c.copy(cBone);                                     // a bone-white wool cuff
          else if(y<-0.07){ c.copy(cLeather); if(y>-0.082||y<-0.19) c.copy(cLeatherL); }                // the leather bracer
          else { c.copy(cSlate); if(y<-0.045) c.lerp(cSlateD,0.4); }
          return;
        case 'thigh': { c.copy(cWool); const n=noise2(x*26,y*4+z*20); if(n>0.1) c.lerp(cWoolD,Math.min(0.7,n)); if(y>-0.04) c.copy(cSlate);
          if(y<-0.305&&y>-0.355){ c.copy(cLeather); if(y>-0.312||y<-0.348) c.copy(cLeatherL); } return; }
        case 'shin': { const t=-y/D.shin;
          if(t<0.76){ c.copy(cWool); const n=noise2(x*26,y*4+z*20); if(n>0.1) c.lerp(cWoolD,Math.min(0.7,n)); }
          else { c.copy(cBoot); if(z<0) c.multiplyScalar(1.1); }
          return; }
        case 'foot': { c.copy(cBoot); if(y<-D.ankleH+0.014) c.copy(cSole); else if(z<-0.1) c.copy(cIron); else if(y>-D.ankleH+0.05&&z<-0.03&&z>-0.09) c.multiplyScalar(1.12); return; }
      }
      c.copy(cSlate);
    };

    /* ---- the helm: an iron spangen cap (two bands over the dome, a brow band with bone rivets), a fur rim round it, a nasal bar, two cheek plates hung from the rim ---- */
    const helm=(F,T)=>{
      const fs=F.fs, out=[], R0=0.12, TILT=0.24, LIFT=0.008, ph=0.004;
      const xf=g=>{ g.rotateX(TILT).translate(0,LIFT,0); return T.fit(g); };   // built round the sphere's centre, tilted so the rim rises over the brow, then fitted to the skull
      const parts=[];
      // the dome: iron, the four quarter-panels between the bands a little different
      parts.push(pc(shell(R0,0,0.47*Math.PI,0,0,sg(34),sg(15)),(x,y,z,c)=>{ c.copy(cIron).multiplyScalar(0.8+0.32*clamp(y*6)); if(x*z>0) c.multiplyScalar(0.9); if(y<0.02) c.lerp(cIronD,0.35); }));
      // the two iron bands over the top (front to back, ear to ear), a knob where they cross
      for(const side of [0,1]){ const P=[]; for(let i=0;i<=8;i++){ const a=(-0.455+0.91*i/8)*Math.PI; P.push(side?[(R0+ph)*Math.sin(a),(R0+ph)*Math.cos(a),0]:[0,(R0+ph)*Math.cos(a),-(R0+ph)*Math.sin(a)]); }
        parts.push(solid(sweepTube(P,[0.0052,0.0052],sg(5),{cap:'round',rings:sg(16)}),IRON_L)); }
      parts.push(pc(csph(0.0105,sg(9),sg(7)).translate(0,R0+0.007,0),(x,y,z,c)=>{ c.copy(cBone); if(y<R0+0.004) c.copy(cIronL); }));
      // the brow band round the rim, and bone rivets on it
      { const th=0.452*Math.PI, Rc=(R0+ph)*Math.sin(th), yb=(R0+ph)*Math.cos(th);
        parts.push(pc(new THREE.TorusGeometry(Rc,0.0072,5,sg(34)).rotateX(Math.PI/2).translate(0,yb,0),(x,y,z,c)=>{ c.copy(cIronL); if(y>yb+0.004) c.multiplyScalar(0.8); }));
        for(let i=0;i<9;i++){ const a=(-0.75+1.5*i/8)*Math.PI, Rb=Rc+0.0068; parts.push(solid(csph(0.0043,6,4).translate(Rb*Math.sin(a),yb,-Rb*Math.cos(a)),BONE)); } }
      // the fur rim: a thick roll and, hugging the skull below it, a skirt of fur ending in points: a short edge over the brow, long locks over the nape and ears
      { const th0=0.482*Math.PI, nU=TEETH*4, nV=3, L=locks(nU,5,0.012,0.03,2), Rr=R0+0.004;
        parts.push(pc(new THREE.TorusGeometry(Rr*Math.sin(th0)+0.002,0.0105,5,sg(34)).rotateX(Math.PI/2).translate(0,Rr*Math.cos(th0)-0.001,0),(x,y,z,c)=>furPaint(c,x*1.5,y*1.5,z*1.5,3)));
        parts.push(pc(furGrid(nU,nV,(j,i)=>{ const a=j/nU*TAU, v=i/nV, back=(1+Math.cos(a))/2, len=0.01+0.022*back+L[j]*(0.2+1.0*back), th=th0+len/R0*v, R=R0+0.005+0.009*(1-v);
            return [R*Math.sin(th)*Math.sin(a),R*Math.cos(th),R*Math.sin(th)*Math.cos(a)]; }),(x,y,z,c)=>{ furPaint(c,x*1.3,y*1.3,z*1.3,9); c.lerp(cFurL,0.25); c.multiplyScalar(0.9+0.15*smoothstep(-0.06,0.02,y)); })); }
      // the cheek plates: a curved iron strip hung from the rim in front of each ear, with a bone rivet row and a leather hinge strap (built round the skull, then sculpted onto it)
      for(const sd of [-1,1]){ const R=[], N=6; for(let i=0;i<=N;i++){ const y=lerp(0.034,-0.042,i/N), r=Math.sqrt(Math.max(1e-5,0.109*0.109-y*y))+0.003; R.push({y,rx:r,rz:r,zc:0}); }
        const a0=sd>0?Math.PI/2+0.3:1.5*Math.PI-0.72, a1=sd>0?Math.PI/2+0.72:1.5*Math.PI-0.3;
        out.push(T.fit(pc(ofLoft(R,sg(8),a0,a1),(x,y,z,c)=>{ c.copy(cIronL).multiplyScalar(0.78+0.3*clamp((y+0.045)*10)); if(y>0.028||y<-0.036) c.lerp(cIron,0.6); })));
        for(const [yy,k] of [[0.018,0.5],[0.0,0.5],[-0.018,0.5],[-0.034,0.5]]){ const a=lerp(a0,a1,k), r=Math.sqrt(0.109*0.109-yy*yy)+0.0045; out.push(T.fit(solid(csph(0.0037,6,4).translate(r*Math.sin(a),yy,r*Math.cos(a)),BONE))); }
        out.push(T.fit(pc(ofLoft([{y:0.043,rx:0.1135,rz:0.1135,zc:0},{y:0.03,rx:0.1135,rz:0.1135,zc:0}],sg(4),lerp(a0,a1,0.3),lerp(a0,a1,0.7)),(x,y,z,c)=>c.copy(cLeather)))); }
      // the nasal bar: a flat iron strip from the brow band down the nose (the nose pushes it forward), a bone stud at the top
      { const P=[]; for(const [y,m] of [[0.06,0.0075],[0.03,0.008],[0.0,0.0095],[-0.014,0.0155],[-0.021,0.0182]]) P.push([0,y,F.zAt(0,y)-m]);
        out.push(pc(ofRibbon(P,u=>0.0105-0.0015*u,{up:[0,0,-1],th:0.004,seg:sg(8)}),(x,y,z,c)=>{ c.copy(cIron).lerp(cIronL,0.2); if(y<-0.0165) c.copy(cBone); }));
        out.push(solid(csph(0.0042,6,4).translate(0,0.048,F.zAt(0,0.048)-0.0105),BONE)); }
      for(const g of parts) out.push(xf(g));
      return out;
    };

    /* ---- the braids: two thick three-strand braids from behind the ears over the collar to the chest, bone rings along them and a big bone ring at the tip ---- */
    const braids=(F,T)=>{
      const hv=Math.min(T.hv,1.03), RH=0.118*hv;
      T.add(T.fit(shell(0.113*hv,0,0.5*Math.PI,0,0.3,sg(26),sg(11))));                 // the hair under the helm: a cap (a hairline between the brow band and the brows)
      // a short forelock under the brow band: four locks, tapering, swept to the left
      { const rng=mulberry32(91); for(let i=0;i<4;i++){ const f=i/3*2-1, af=Math.abs(f), yb=0.046-0.004*rng(), ph1=Math.acos(clamp(yb/RH,-0.9,0.9)), w=0.0125-0.003*af+0.002*rng();
          T.add(T.scalpLock(f*0.75,0.3*Math.PI,ph1,[0.009,w,w*1.1,w*0.6,0.0015],{sw:-0.12+f*0.16,tip:0.07,lift:0.003+0.004*(1-af),k:0.42,R:RH-0.009}),(x,y,z,c)=>{ T.hp(x,y,z,c); c.lerp(cHairD,0.12*(1-af)); }); } }
      const out=[], hl=T.hl, yEnd=clamp(0.4-0.3*(hl-1.0),0.2,0.47);
      const hx=x=>x/hs, hy=y=>(y-D.headY)/hs;
      for(const sd of [-1,1]){
        const m=sd>0?0.058:0.032, pts=[[sd*0.099,-0.012,0.032],[sd*0.103,-0.07,0.03]];
        const down=[[0.585,0.128,-0.002],[0.52,0.118,null],[0.45,0.1,null],[lerp(0.45,yEnd,0.55),0.092,null],[yEnd,0.09,null]];
        for(const [yd,xr,zr] of down){ const s=ts(yd), xx=Math.min(xr,s.rx*0.8+(yd>0.55?0.06:0)), zz=zr!==null?zr:-(s.rz*Math.sqrt(Math.max(0.15,1-Math.pow(xx/s.rx,2)))+m); pts.push([hx(sd*(yd>0.55?xr:xx)),hy(yd*TK),zz/hs]); }
        const cv=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],p[2])),false,'catmullrom',0.5), n=sg(30), strands=[[],[],[]], Nv=new THREE.Vector3(), Bv=new THREE.Vector3(), ref=new THREE.Vector3(sd*0.6,0,-1);
        const frames=[];
        for(let i=0;i<=n;i++){ const t=i/n, p=cv.getPoint(t), tg=cv.getTangent(t).normalize();
          Nv.copy(ref).addScaledVector(tg,-ref.dot(tg)); if(Nv.lengthSq()<1e-4) Nv.set(1,0,0); Nv.normalize(); Bv.crossVectors(tg,Nv);
          const off=0.0105*(0.6+0.4*Math.min(1,t*5))*(1-0.4*t*t);
          for(let s=0;s<3;s++){ const a=t*22+s*TAU/3+(sd>0?0:1.1); strands[s].push([p.x+(Math.cos(a)*Nv.x+Math.sin(a)*Bv.x)*off,p.y+(Math.cos(a)*Nv.y+Math.sin(a)*Bv.y)*off,p.z+(Math.cos(a)*Nv.z+Math.sin(a)*Bv.z)*off]); }
          frames.push([p,tg]); }
        for(let s=0;s<3;s++){ const sx=s;
          out.push(pc(sweepTube(strands[s],u=>0.0145*(0.8+0.2*Math.min(1,u*5))*(1-0.3*u*u),sg(5),{cap:'point',rings:sg(24)}),(x,y,z,c)=>{ T.hp(x,y,z,c); c.lerp(cHairD,0.2+0.22*Math.sin(y*190+sx*2.1)); })); }
        // bone rings: a small one just below the ear, one at the middle, a big one at the tip with an iron band above it
        for(const [t,R,r,hex] of [[0.12,0.0235,0.0055,BONE],[0.5,0.0255,0.0052,BONE],[0.955,0.028,0.0078,BONE],[0.9,0.0265,0.0038,IRON_L]]){ const f=frames[Math.round(t*n)], p=f[0], tg=f[1]; out.push(solid(ofRingAt([p.x,p.y,p.z],[tg.x,tg.y,tg.z],R,r,sg(4)),hex)); }
        { const f=frames[n], p=f[0], tg=f[1]; out.push(solid(csph(0.0105,sg(8),sg(6)).translate(p.x+tg.x*0.008,p.y+tg.y*0.008,p.z+tg.z*0.008),BONE)); }
      }
      return out;
    };

    /* ---- the beard: short, iron grey with pale streaks, fading into the skin at its edges, a full moustache, and one braid from the chin ending in a bone bead ---- */
    const beard=F=>{
      const out=[], {sculpt,fs,zAt}=F, hp=(x,y,z,c)=>{ c.copy(cHair); const n=noise2(x*60,y*45); if(n>0.2) c.lerp(cBone,0.25*Math.min(1,(n-0.2)*2)); else if(n<-0.2) c.lerp(cHairD,0.45*Math.min(1,(-0.2-n)*2)); };
      const g=new THREE.SphereGeometry(1,sg(30),sg(15),Math.PI,Math.PI,0.4*Math.PI,0.58*Math.PI), bp=g.attributes.position;
      for(let i=0;i<bp.count;i++){ const x=bp.getX(i), y=bp.getY(i), z=bp.getZ(i), th=Math.acos(clamp(y,-1,1)), side=Math.abs(x);
        const top=lerp(0.74,0.58,smoothstep(0.55,0.97,side))*Math.PI, m=smoothstep(0,0.09*Math.PI,th-top)*smoothstep(0.985*Math.PI,0.92*Math.PI,th)*smoothstep(-0.05,0.25,-z);
        const r=lerp(0.098,0.1145,m); bp.setXYZ(i,x*r,y*r,z*r); }
      // the colour is laid on the unsculpted shell: where the shell sinks into the skull (its edge) the skin shows, so the beard fades out instead of ending in a line
      const col=pc(g,(x,y,z,c)=>{ const m=clamp((Math.hypot(x,y,z)-0.0985)/0.0155); skinPaint(c); hp(x,y,z,c); const k=smoothstep(0.35,0.85,m); c.lerp(skin,1-k); c.multiplyScalar(0.92-0.1*smoothstep(-0.05,-0.1,y)*k+0.0); });
      out.push(sculpt(col,false).scale(fs[0],fs[1],1));
      const mz=zAt(0,-0.047*1.1);       // a full moustache over the lip, turned down at the ends
      out.push(pc(csph(1,sg(12),sg(8)).scale(0.027,0.0075,0.0105).translate(0,-0.0475*1.1,mz+0.0015),hp));
      for(const sd of [-1,1]){ const x=sd*0.0265, y=-0.0525*1.1; out.push(pc(csph(1,sg(8),sg(6)).scale(0.0085,0.0055,0.0075).rotateZ(sd*0.6).translate(x,y,zAt(x,y)+0.001),hp)); }
      // the chin braid: three strands from the chin's front, a bone bead at the end
      const y0=-0.098*fs[1], z0=zAt(0,y0*0.9)-0.004, P=[[0,y0,z0],[0,y0-0.03,z0-0.002],[0,y0-0.062,z0-0.008],[0,y0-0.092,z0-0.013]];
      for(let s=0;s<3;s++){ const Q=[]; for(let i=0;i<=sg(8);i++){ const t=i/sg(8), j=t*(P.length-1), k=Math.min(P.length-2,Math.floor(j)), f=j-k, a=t*12+s*TAU/3, o=0.0042*(1-0.35*t);
          Q.push([lerp(P[k][0],P[k+1][0],f)+Math.cos(a)*o,lerp(P[k][1],P[k+1][1],f),lerp(P[k][2],P[k+1][2],f)+Math.sin(a)*o]); }
        out.push(pc(sweepTube(Q,[0.0052,0.0052,0.0044,0.0014],sg(5),{cap:'point',rings:sg(10)}),hp)); }
      out.push(solid(csph(0.0058,sg(8),sg(6)).translate(0,P[3][1]-0.003,P[3][2]),BONE));
      return out;
    };

    /* ---- the face: a pale scar through the left brow (the brow only; the eye is clear of it), and the heavy lids: a skin-coloured fold over the upper third of each eye with a dark lash line ---- */
    const faceMark=F=>{
      const ex=0.046*S.eyeGap*F.fs[0], ey=(-0.002+0.012*S.eyeHeight)*1.1, by=ey+0.026, E=S.eyeSize*0.74, SW=0.0295*E, SH=0.0245*E*0.7, out=[];
      const pt=(u,v)=>{ const x=-(ex+u), y=by+v; return [x,y,F.zAt(x,y)-0.0045]; };
      out.push(pc(sweepTube([pt(-0.007,0.021),pt(0.0,0.009),pt(0.008,-0.004),pt(0.0135,-0.0102)],[0.0012,0.0021,0.0021,0.001],sg(5),{cap:'point',rings:sg(12)}),(x,y,z,c)=>c.set(SCAR)));
      out.push(pc(sweepTube([pt(-0.0098,0.02),pt(-0.0022,0.0085),pt(0.0055,-0.0045),pt(0.0102,-0.0108)],[0.0005,0.0009,0.0009,0.0004],sg(5),{cap:'point',rings:sg(12)}),(x,y,z,c)=>c.set(0x7a4a40)));
      const lid=skin.clone().multiplyScalar(0.9);
      for(const sd of [-1,1]){
        out.push(pc(F.place(csph(1,sg(14),sg(8)).scale(SW*1.16,SH*0.62,0.0042),sd*ex,ey+SH*0.58,0.0074),(x,y,z,c)=>{ c.copy(lid); c.multiplyScalar(0.94+0.1*smoothstep(ey,ey+SH*1.2,y)); }));
        const P=[]; for(const t of [0,0.25,0.5,0.75,1]){ const u=2*t-1, x=sd*ex+sd*u*SW*1.12; P.push([x,ey+SH*0.02+0.0045*(1-u*u),F.zAt(x,ey)-0.0128]); }
        out.push(pc(sweepTube(P,[0.0006,0.0016,0.002,0.0016,0.0006],sg(5),{cap:'point',rings:sg(10)}),(x,y,z,c)=>c.set(0x2a1f22))); }
      return out;
    };

    /* ---- the coat: a quilted slate shell from the collar to the belt (channels and rows of stitching), bone toggles down the front, a leather belt with iron rings and a buckle, a rolled collar ---- */
    const quilt=(x,y,z)=>{ const a=Math.atan2(x,-z), sa=Math.abs(Math.sin(a*9)), ry=((y/0.085)%1+1)%1, e=Math.min(ry,1-ry); return smoothstep(0.12,0.55,sa)*smoothstep(0.06,0.3,e); };   // 1 in the middle of a quilted box, 0 on a seam
    const coat=()=>{
      const R=[], N=sg(18); for(let i=0;i<=N;i++) R.push(ringAt(lerp(0.545,0.0,i/N),0.005)); for(const yd of [-0.03,-0.06,-0.085]) R.push(ringAt(yd,0.005));   // and a little below the belt, over the pelvis between the coat's tails
      const g=ofLoft(R,sg(56),0,TAU), p=g.attributes.position;
      for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), r=Math.hypot(x,z)||1, d=0.0055*quilt(x,y,z)*smoothstep(0.52,0.4,y/TK); p.setXYZ(i,x*(1+d/r),y,z*(1+d/r)); }
      smoothN(g);
      return pc(g,(x,y,z,c)=>{
        const yd=y/TK, pill=quilt(x,y,z);
        c.copy(cSlateD).lerp(cSlate,pill); c.lerp(cSlateL,0.3*pill*pill*(1-0.5*smoothstep(0.1,0.45,yd)));
        if(Math.abs(x)<0.0115&&z<0&&yd<0.5) c.lerp(cBoneD,0.55);                        // the placket
        if(yd>0.47&&yd<0.495) c.lerp(cBoneD,0.35);                                      // a yoke seam
      });
    };
    const belt=()=>{
      const out=[], R=[ringAt(0.072,0.008),ringAt(0.069,0.0135),ringAt(0.004,0.0145),ringAt(0.0,0.009)];
      out.push(pc(ofLoft(R,sg(60),0,TAU),(x,y,z,c)=>{ const yd=y/TK; c.copy(cLeather); if(yd>0.0645||yd<0.01) c.copy(cLeatherL); }));
      const yb=0.037, rb=ringAt(yb,0.0135);
      // four iron rings (a little to each side of the front and on the hips) with a bone stud in each
      for(const a of [0.62,-0.62,1.7,-1.7]){ const nx=Math.sin(a)/rb.rx, nz=-Math.cos(a)/rb.rz, p=[rb.rx*Math.sin(a),yb*TK,-rb.rz*Math.cos(a)+rb.zc], n=nrm(nx,0,nz);
        out.push(solid(ofRingAt([p[0]+n[0]*0.008,p[1],p[2]+n[2]*0.008],n,0.0195,0.0052,sg(4)),IRON_L));
        out.push(solid(csph(0.0062,sg(7),sg(5)).translate(p[0]+n[0]*0.0085,p[1],p[2]+n[2]*0.0085),BONE)); }
      // the buckle: an iron plate with a bone tongue and four rivets
      const zb=-(rb.rz-rb.zc)-0.0055;
      out.push(pc(vbox(0.062,0.05,0.0075,0,yb*TK,zb),(x,y,z,c)=>{ c.copy(cIron); if(Math.abs(x)<0.02&&Math.abs(y-yb*TK)<0.012) c.copy(cIronL); }));
      out.push(solid(vbox(0.0085,0.034,0.004,0,yb*TK,zb-0.0045),BONE));
      for(const sx of [-1,1]) for(const sy of [-1,1]) out.push(solid(csph(0.0034,6,5).translate(sx*0.024,yb*TK+sy*0.018,zb-0.004),BONE));
      return out;
    };
    const toggles=()=>{ const out=[]; for(const yd of [0.37,0.305,0.24,0.175,0.11]){ const s=ts(yd), z=-s.rz-0.0145;
        out.push(solid(cyl(0.0058,0.0058,0.036,sg(7)).rotateZ(Math.PI/2).translate(0,yd*TK,z),BONE));
        out.push(solid(cyl(0.0068,0.0068,0.004,sg(7)).rotateZ(Math.PI/2).translate(-0.019,yd*TK,z),LEATHER)); out.push(solid(cyl(0.0068,0.0068,0.004,sg(7)).rotateZ(Math.PI/2).translate(0.019,yd*TK,z),LEATHER)); }
      return out; };
    const collar=()=>{ const yc=0.563*TK, out=[];
      out.push(pc(ringGeo(yc,0.096,0.086,-0.005,0.0215,8),(x,y,z,c)=>{ c.copy(cSlate); if(y>yc+0.009) c.lerp(cSlateL,0.5); else if(y<yc-0.009) c.copy(cSlateD); }));
      out.push(eRing(yc+0.0185,0.094,0.084,-0.005,0.0046,BONE,5));
      return out; };

    /* ---- the mantle: a grey fur pelt over the right shoulder: a sheet over the chest and back, a dome round the arm (in the shoulder hook), a ragged hem of tufts, an iron ring brooch ---- */
    const MA0=-0.2, MA1=Math.PI+0.16, MTOP=0.54;
    const mhem=a=>{ if(a<Math.PI/2) return lerp(0.085,0.21,smoothstep(MA0,Math.PI/2,a)); return lerp(0.21,0.375,smoothstep(Math.PI/2,Math.PI+0.16,a)); };
    const mpt=(a,yd,m)=>{ const s=ts(yd), rz=(s.rz+s.rzBack)/2, zc=(s.rzBack-s.rz)/2; return [(s.rx+m)*Math.sin(a),yd*TK,(rz+m)*Math.cos(a)+zc]; };
    const mantle=()=>{
      const out=[], nU=TEETH*3, nV=sg(10), L=locks(nU,12,0.03,0.075);
      out.push(pc(furGrid(nU,nV,(j,i)=>{ const a=lerp(MA0,MA1,j/nU), v=i/nV, yb=mhem(a)-L[j]/TK*(a<1.6?1.25:0.85); return mpt(a,lerp(MTOP,yb,v),0.017+0.013*v); }),(x,y,z,c)=>{
        furPaint(c,x,y,z,7); const st=Math.abs(Math.sin(Math.atan2(x,z)*11)); c.multiplyScalar((0.74+0.3*smoothstep(0.1,0.5,y/TK))*(0.9+0.14*st)); }));
      // the brooch: an iron ring with a bone pin through it, on the pelt's front edge below the collar
      { const a=Math.PI+0.02, yd=0.465, p=mpt(a,yd,0.03), q=[p[0]+0.002,p[1],p[2]-0.012];
        out.push(solid(ofRingAt(q,[0,0,-1],0.0235,0.0058,sg(5)),IRON_L));
        out.push(solid(sweepTube([[q[0]-0.026,q[1]+0.012,q[2]-0.004],[q[0],q[1],q[2]-0.009],[q[0]+0.03,q[1]-0.016,q[2]-0.004]],[0.0034,0.0034,0.0034],sg(5),{cap:'round',rings:8}),BONE));
        out.push(solid(csph(0.0062,sg(8),sg(6)).translate(q[0]+0.03,q[1]-0.016,q[2]-0.006),BONE)); }
      return out;
    };
    // the dome round the right arm: a grid from the top of the shoulder down over the arm, ending in points of fur (the ends follow the dome's table, then narrow)
    const domeRad=y=>{ const lo=DOME[DOME.length-1][1]*ra; return y>=lo?domeR(y,ra):ra*DOME[DOME.length-1][0]-(lo-y)*0.45; };
    const dome=()=>{
      const nU=TEETH*3, nV=sg(9), L=locks(nU,44,0.02,0.062), top=DOME[0][1]*ra, bot=DOME[DOME.length-1][1]*ra;
      const out=[pc(furGrid(nU,nV,(j,i)=>{ const a=j/nU*TAU, v=i/nV, y=lerp(top,bot-L[j],v), R=domeRad(y); return [R*Math.sin(a),y,R*0.96*Math.cos(a)]; }),(x,y,z,c)=>{
        furPaint(c,x,y,z,21); const st=Math.abs(Math.sin(Math.atan2(x,z)*TEETH*0.75)); c.multiplyScalar((0.7+0.32*smoothstep(-1.3*ra,1.2*ra,y))*(0.9+0.14*st)); })];
      return out;
    };
    // the left shoulder: a banded iron spaulder over a leather cap: four overlapping lames, bone rivets, a bone knob
    const spaulder=()=>{
      const out=[], rr=y=>domeR(y,ra)*0.755;
      { const pts=[0.95,1.1,1.25,1.4].map(k=>new THREE.Vector2(rr(k*ra)+0.002,k*ra)); pts.push(new THREE.Vector2(0.001,1.52*ra));
        out.push(pc(new THREE.LatheGeometry(pts,sg(20)),(x,y,z,c)=>{ c.copy(cLeatherD); if(y>1.2*ra&&y<1.3*ra) c.copy(cLichenD); })); }
      out.push(solid(csph(0.0105,sg(8),sg(6)).translate(0,1.52*ra+0.003,0),BONE));
      for(let k=0;k<4;k++){ const yt=0.075-0.04*k, yb=yt-0.056, rt=rr(yt)+0.004+0.003*k, rb=rr(yb)+0.014+0.003*k;
        const pts=[new THREE.Vector2(rb,yb),new THREE.Vector2(lerp(rb,rt,0.5)+0.0015,(yt+yb)/2),new THREE.Vector2(rt,yt)];
        out.push(pc(new THREE.LatheGeometry(pts,sg(22)).scale(1,1,0.98),(x,y,z,c)=>{ const f=clamp((y-yb)/(yt-yb)); c.copy(cIron).lerp(cIronL,0.7*(1-f)*(1-f)); if(f>0.85) c.lerp(cIronD,0.5); }));
        for(const th of [-0.8,0,0.8]){ const R=rb+0.003, a=th*0.95; out.push(solid(csph(0.0047,5,4).translate(-R*Math.cos(a),yb+0.012,-R*Math.sin(a)*0.98),BONE)); } }
      return out;
    };

    /* ---- the coat's tails: a quilted slate skirt on each thigh to mid-thigh, a lichen hem band, bone piping; the trousers' leather bindings below ---- */
    const tails=sd=>{
      const out=[], ys=[0.03,0.0,-0.03,-0.06,-0.09,-0.12,-0.15,-0.18,-0.2045,-0.2055,-0.25], th=D.thigh, R=[];
      for(const y of ys){ const t=clamp(-y/th), s=lin(THIGH,t), k=clamp(-y/0.25), m=0.004+0.036*k*k; R.push({y,rx:s[0]+m,rz:s[1]+m*0.85,zc:s[2]}); }
      const g=loftRings(R,sg(28)), p=g.attributes.position, chan=(x,z)=>smoothstep(0.12,0.6,Math.abs(Math.sin(Math.atan2(z,x*sd)*4+0.4)));
      for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), r=Math.hypot(x,z)||1, d=y<-0.2055?0:0.005*chan(x,z)*smoothstep(0.02,-0.06,y); p.setXYZ(i,x*(1+d/r),y,z*(1+d/r)); }
      smoothN(g);
      out.push(pc(g,(x,y,z,c)=>{ const sa=Math.abs(Math.sin(Math.atan2(z,x*sd)*4+0.4)), ry=((y/0.07)%1+1)%1, e=Math.min(ry,1-ry);
        if(y<-0.2055){ c.copy(cLichen); c.lerp(cLichenD,0.5*(1-smoothstep(0,0.3,sa))); if(y<-0.222&&y>-0.232) c.lerp(cLichenD,0.5); return; }
        const pill=smoothstep(0.12,0.6,sa)*smoothstep(0.06,0.3,e); c.copy(cSlateD).lerp(cSlate,pill); c.lerp(cSlateL,0.25*pill*pill); }));
      { const s=R[R.length-1]; out.push(eRing(-0.25,s.rx+0.0005,s.rz+0.0005,s.zc,0.0048,BONE,5)); }
      for(const y of [-0.31,-0.34]){ const s=lin(THIGH,-y/th); out.push(eRing(y,s[0]+0.0045,s[1]+0.0045,s[2],0.0036,y>-0.32?BONE:LEATHER_L,5)); }
      return out;
    };

    /* ---- the shin: strapped iron greaves (a ridged plate, three leather straps with bone studs), a rounded knee guard, a fur cuff over the boot, an iron ankle strap, an iron toe cap and heel ---- */
    const shin=sd=>{
      const out=[], sh=D.shin, A=D.ankleH, sf=S.feet, wf=0.55+0.45*sf, hf=0.8+0.2*sf;
      { const R=[], t0=0.17, t1=0.735, N=14;
        for(let i=0;i<=N;i++){ const t=lerp(t0,t1,i/N), s=lin(SHIN,t), e=Math.min(i,N-i)/N, m=0.0065+0.0045*(1-Math.min(1,e*5)); R.push({y:-t*sh,rx:s[0]+m,rz:s[1]+m,zc:s[2]}); }
        out.push(pc(ofLoft(R,sg(14),Math.PI-1.25,Math.PI+1.25),(x,y,z,c)=>{ const f=Math.abs(x)/(0.05*cw), t=-y/sh; c.copy(cIron); if(f<0.2) c.lerp(cIronL,0.85); else if(f>0.9) c.lerp(cIronD,0.7); if(t<t0+0.014||t>t1-0.014) c.lerp(cIronD,0.55); }));
        for(const t of [0.27,0.45,0.63]){ const s=lin(SHIN,t), y=-t*sh; out.push(eRing(y,s[0]+0.0125,s[1]+0.0125,s[2],0.0042,LEATHER,5)); out.push(solid(csph(0.0048,6,4).translate(0,y,s[2]-(s[1]+0.0155)),BONE)); } }
      // the knee guard
      { const rx=KR*1.28, ry=KR*1.08, rz=KR*0.82, cz=-KR*0.5, cy=-0.004;
        out.push(pc(csph(1,sg(12),sg(9)).scale(rx,ry,rz).translate(0,cy,cz),(x,y,z,c)=>{ const r2=Math.pow(x/rx,2)+Math.pow((y-cy)/ry,2); c.copy(cIronL); if(r2>0.5) c.lerp(cIron,0.8); if(r2>0.78) c.copy(cIronD); }));
        for(let i=0;i<5;i++){ const a=i/5*TAU+0.5, qx=Math.cos(a)*0.72, qy=Math.sin(a)*0.72; out.push(solid(csph(0.0046,5,4).translate(qx*rx,cy+qy*ry,cz-rz*Math.sqrt(Math.max(0,1-qx*qx-qy*qy))-0.0015),BONE)); }
        out.push(solid(csph(0.0075,sg(8),sg(6)).translate(0,cy,cz-rz-0.001),BONE)); }
      // the fur cuff turned down over the boot's top: a roll and a short skirt ending in points
      { const tc=0.765, s=lin(SHIN,tc), y=-tc*sh, nU=sg(12)-sg(12)%3||6, L=locks(nU,63,0.018,0.036);
        out.push(pc(ringGeo(y+0.002,s[0]+0.0075,s[1]+0.0075,s[2],0.0115,5),(x,y2,z,c)=>furPaint(c,x*1.4,y2*1.4,z*1.4,5)));
        out.push(pc(furGrid(nU,3,(j,i)=>{ const a=j/nU*TAU, v=i/3, yy=y-(0.014+L[j])*v, ss=lin(SHIN,-yy/sh); return [(ss[0]+0.007+0.009*(1-v))*Math.sin(a),yy,(ss[1]+0.007+0.009*(1-v))*Math.cos(a)+ss[2]]; }),(x,y2,z,c)=>{ furPaint(c,x*1.3,y2*1.3,z*1.3,8); c.multiplyScalar(0.75+0.3*smoothstep(y-0.04,y,y2)); })); }
      { const t=0.925, s=lin(SHIN,t), y=-t*sh; out.push(eRing(y,s[0]+0.0036,s[1]+0.0036,s[2],0.0034,IRON_L,5)); out.push(solid(csph(0.0045,6,4).translate(sd*(s[0]+0.0065),y,s[2]),BONE)); }
      // the toe cap: an iron cap that follows the foot's toe (it sits 2 mm proud of it); the sole is painted dark with the iron toe above it
      out.push(pc(csph(1,sg(12),sg(8)).scale(0.0335*wf,0.0235*hf,0.047*sf).translate(0,-sh+0.0245*hf-A,-0.1085*sf).rotateY(-sd*0.1),(x,y,z,c)=>{ c.copy(cIron).lerp(cIronL,0.5); if(z<-0.14*sf) c.lerp(cIron,0.6); if(y<-sh-A+0.012) c.copy(cIronD); }));
      return out;
    };

    /* ---- the weapon dressing: leather grips, iron fittings, ash wood, bone caps, lichen paint; a charm of three bone rings, a tiny iron shield and one dull ochre bead ---- */
    const dress={ grip:LEATHER, metal:0x8a9098, wood:0x6a5a48, accent:BONE, glow:0x9a8440,
      trim:(c,u,part)=>{
        if(part==='shaft'){ c.lerp(u<0.01?cIronL:cLichen,0.75); }                                         // a wand: iron at the grip, lichen paint at the head
        else if(part==='limb'){ const f=((u/0.066)%1+1)%1; if(f<0.2) c.lerp(cLichen,0.85); }             // a bow: lichen-painted rings along the limb
        else if(part==='grip'){ if(u<-0.1) c.lerp(cLichen,0.55); else c.lerp(cIronL,0.4); }               // a grip: lichen below, an iron collar above
        else if(part==='blade'){ c.multiplyScalar(0.94+0.06*Math.sin(u*90)); }
        else if(part==='rim'){ const k=Math.round(u*5/(Math.PI/9)-4.5); if((k&1)===0) c.lerp(cIronD,0.65); else c.lerp(cBone,0.3); }   // a shield's rim: bone and iron blocks
        else if(part==='face'){ c.lerp(cLichen,0.85); }                                                    // a shield's face: lichen green at the heart
        else if(part==='quiver'){ if(u>0.2) c.lerp(cLichen,0.6); }
      },
      charm:()=>{ const lit=[], glow=[], X0=0.04, Z0=-0.02;     // hung a hand's width to the side of the grip, so the hand does not hide it
        lit.push(solid(sweepTube([[0,0.004,0],[0.012,0.0,-0.006],[X0*0.85,-0.02,Z0*0.9],[X0,-0.06,Z0],[X0+0.001,-0.108,Z0]],[0.0019,0.0019,0.0019,0.0019,0.0019],5,{cap:'round',rings:12}),LEATHER_D));
        for(const y of [-0.034,-0.06,-0.086]) lit.push(solid(ofRingAt([X0,y,Z0],[0,1,0],0.0088,0.0031,6),BONE));
        // the tiny iron shield: a disc with a lichen face, a bone boss and a rim of iron
        lit.push(pc(cyl(0.0185,0.0185,0.005,14).rotateX(Math.PI/2).translate(X0+0.001,-0.131,Z0+0.0),(x,y,z,c)=>{ const r=Math.hypot(x-X0-0.001,y+0.131); c.copy(cIronL); if(r<0.0125) c.copy(cLichen); if(r<0.005&&z<Z0) c.copy(cBone); }));
        lit.push(solid(csph(0.0045,7,5).translate(X0+0.001,-0.131,Z0-0.003),BONE));
        lit.push(solid(sweepTube([[X0+0.001,-0.148,Z0],[X0+0.001,-0.158,Z0-0.002]],[0.0014,0.0014],4,{cap:'round',rings:4}),LEATHER_D));
        glow.push(pc(csph(0.0052,8,6).translate(X0+0.001,-0.1645,Z0-0.002),(x,y,z,c)=>c.set(OCHRE)));          // the one dull ochre bead (earth)
        return {lit,glow}; } };

    /* ---- the forearms: a leather bracer with three iron bands and bone studs ---- */
    const bracers=()=>{ const out=[]; for(const y of [-0.1,-0.17]){ const s=lin(FORE,-y/D.fore), R=s[0]+0.0035; out.push(eRing(y,R,R,0,0.0036,IRON_L,5)); out.push(solid(csph(0.0038,6,4).translate(0,y,-R-0.002),BONE)); } return out; };

    return {
      boot:true, skinFrom:0.588, hairColor:HAIR, eyeColor:0x7a9ab0,
      eyes:{iris:0.97,h:0.7,lash:1.25,hl:1,tilt:-0.1,browLift:-0.004,browThick:1.25,browAngle:0.1},   // the "heavy" style: the upper lid drops over the pale iris, thick low brows
      cuts:{torso:[0.012,0.07,0.588],upperArm:[0.188/D.upper,0.2/D.upper],foreArm:[0.07/D.fore,0.082/D.fore,0.19/D.fore],thigh:[0.304/D.thigh,0.312/D.thigh,0.348/D.thigh,0.356/D.thigh],shin:[0.76]},
      paint,
      head:helm, hair:braids, mark:faceMark, facial:beard,
      torso:()=>[coat(),...belt(),...toggles(),...collar(),...mantle()],
      shoulder:sd=>sd>0?dome():spaulder(),
      forearm:sd=>bracers(),
      thigh:sd=>tails(sd),
      shin:sd=>shin(sd),
      /* ---- the drinking horn: hung from the belt behind the left hip on a leather strap, a bone-and-iron horn that half-follows the left thigh ---- */
      extras:rig=>{
        const grp=new THREE.Group(), parts=[], P=[[0,-0.03,0],[0,-0.075,0.03],[0.004,-0.13,0.05],[0.012,-0.185,0.04],[0.02,-0.215,0.02]];
        parts.push(pc(sweepTube(P,[0.031,0.029,0.022,0.012,0.003],sg(8),{cap:'point',rings:sg(18)}),(x,y,z,c)=>{ const k=clamp((-y-0.03)/0.19); c.copy(cBone).lerp(cBoneD,0.45*k); const n=noise2(x*70,y*18); if(n>0) c.lerp(cLeather,0.35*n*k); c.lerp(cLeatherD,0.85*smoothstep(0.72,0.95,k)); }));
        parts.push(solid(ofRingAt([0,-0.03,0],[0,1,0.05],0.0325,0.0048,sg(5)),IRON_L));              // the iron rim at the mouth
        parts.push(solid(ofRingAt([0.0005,-0.075,0.03],[0,1,0.9],0.0305,0.0036,sg(5)),IRON_D));      // a second iron band
        parts.push(solid(cyl(0.029,0.029,0.003,sg(10)).translate(0,-0.033,0.0),LEATHER_D));          // the dark inside of the mouth
        parts.push(solid(sweepTube([[-0.028,-0.03,0],[-0.03,0.0,-0.004],[0,0.03,-0.012],[0.03,0.0,-0.004],[0.028,-0.03,0]],[0.0032,0.0032,0.0032,0.0032,0.0032],sg(5),{cap:'round',rings:sg(12)}),LEATHER));   // the strap's loop up to the belt
        parts.push(solid(csph(0.0075,6,5).translate(0,0.031,-0.012),IRON_L));
        const m=new THREE.Mesh(merge(parts),matChar); m.castShadow=true; grp.add(m);
        grp.position.set(-0.085,0.0,ts(0.02).rzBack+0.036); grp.scale.setScalar(0.88);
        rig.hips.add(grp);
        rig.anims.push(()=>{ grp.rotation.x=rig.hipL.rotation.x*0.45; });
      },
      dress,
    };
  };
})();
