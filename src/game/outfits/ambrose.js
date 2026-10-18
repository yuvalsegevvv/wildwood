//@ Ambrose's outfit (a marsh herbalist and field medic): a linen head-wrap with a mint sprig, a reed cone hat slung on the back, a nape knot pinned with a reed, clay smear and soft eyes, an open river-green apron-robe with a herb satchel and a belt of five aqua-glowing vials, clay wader breeches with shin guards, folded wading boots, and the reed-and-shell dressing for every weapon
/* ---------- Ambrose: healer, water. Design: docs/skillkits/looks/ambrose.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: river green 0x4f7a6a, shell white 0xe6ecea, clay 0xa57b55, aqua 0x7fd0d8 (the glow of the vials ONLY: never a light), reed 0xcdbd8a. Soft, rounded shapes, nothing sharp.
   Silhouette: a soft triangle: a tall reed cone slung on the back, a robe that flares (the skirt is two shells that hang from the THIGH bones, so the legs never pierce it),
   a satchel at the left hip, wide folded boots. The cloth (skirt shells, the hat) is one thin surface drawn on both sides (matCloth). */
CHAR_MODELS.ambrose={id:'ambrose',name:'Ambrose',signature:true, hairGrad:{mode:'tips',c2:0x6fae7a}, items:{hat:'Marsh wrap',hair:'Reed knot',face:'Clay dab',top:'Ford robe',bottom:'Wader legs',shoes:'Ford boots',weapon:'Reed tend'},sexes:['male'],
  note:'The marsh herbalist: soft in the middle, gentle-faced, built for a slightly rounded man with good hands.',
  ranges:{build:[0.9,1.15],shoulders:[0.88,1.1],chest:[0.7,1.3],waist:[0.9,1.15],hands:[0.95,1.2],head:[0.95,1.1],eyeTilt:[-0.5,0.2],brow:[-0.6,0.2],hairLength:[0.8,1.2]},
  setups:[{id:'ambrose',name:'Ambrose',sex:'male',def:true,note:'The herbalist as drawn: soft in the middle, gentle-faced, good hands.',v:{build:0.98,shoulders:0.96,waist:1.06,hips:1.02,torso:1.02,arms:0.95,hands:1.12,head:1.02,jaw:0.95,chin:0.95,cheeks:1.05,eyeSize:1.05,eyeGap:1.02,eyeTilt:-0.25,brow:-0.3,lips:1.05,smile:0.35,hairLength:1.1,bangs:0.8}}]};

OUTFITS.ambrose=(function(){
  const GREEN=0x4f7a6a, GREEN_D=0x3b5f52, SHELL=0xe6ecea, SHELL_D=0xc9d3d0, CLAY=0xa57b55, CLAY_D=0x8a6340, REED=0xcdbd8a, REED_D=0xa89a64, REED_P=0xe3d9b0;
  const LEATHER=0x6f5236, LEATHER_D=0x4a3624, BRASS=0xdfe4d8, WILLOW=0x8a7a4a, HAIR=0x6a4428, MINT=0x86c2a0, MINT_D=0x5f9a7c, CANVAS=0xb8a870;
  const AQ_TOP=0xa6e4e6, AQ_BOT=0x6bbcc6;     // the vials' glow: pale, faint (unlit vertex colours)
  const cG=ofCol(GREEN), cGd=ofCol(GREEN_D), cS=ofCol(SHELL), cC=ofCol(CLAY), cCd=ofCol(CLAY_D), cR=ofCol(REED), cRd=ofCol(REED_D), cL=ofCol(LEATHER), cLd=ofCol(LEATHER_D), cM=ofCol(MINT), cMd=ofCol(MINT_D);
  const V3=THREE.Vector3, G=faceG, sm=faceSm;
  // thin cloth is drawn on both sides (skirt shells, the hat): the same Phong material as the body, double sided (three flips the normal on the back face)
  const matCloth=new THREE.MeshPhongMaterial({vertexColors:true,shininess:6,specular:0x0b0b0b,side:THREE.DoubleSide});
  const mesh=(parts,mat)=>{ const m=new THREE.Mesh(merge(parts),mat||matChar); m.castShadow=true; return m; };

  /* a patch of cloth as a grid P(u,v) -> [x,y,z], u and v in 0..1; the winding is chosen so the faces look toward out(x,y,z); bake() colours it (colFn(u,v,x,y,z,c)) and makes it a plain triangle list */
  const grid=(nu,nv,P,out)=>{
    const pos=new Float32Array((nu+1)*(nv+1)*3), uv=new Float32Array((nu+1)*(nv+1)*2), idx=[];
    for(let i=0;i<=nu;i++) for(let j=0;j<=nv;j++){ const p=P(i/nu,j/nv), k=i*(nv+1)+j; pos[k*3]=p[0]; pos[k*3+1]=p[1]; pos[k*3+2]=p[2]; uv[k*2]=i/nu; uv[k*2+1]=j/nv; }
    for(let i=0;i<nu;i++) for(let j=0;j<nv;j++){ const a=i*(nv+1)+j, b=a+1, c=a+nv+1, d=c+1; idx.push(a,c,b,b,c,d); }
    let s=0; const A=new V3(), B2=new V3(), C=new V3(), n=new V3();
    for(let t=0;t<idx.length;t+=3){ A.fromArray(pos,idx[t]*3); B2.fromArray(pos,idx[t+1]*3); C.fromArray(pos,idx[t+2]*3); const mx=(A.x+B2.x+C.x)/3, my=(A.y+B2.y+C.y)/3, mz=(A.z+B2.z+C.z)/3, o=out(mx,my,mz);
      n.crossVectors(B2.sub(A),C.sub(A)); s+=n.x*o[0]+n.y*o[1]+n.z*o[2]; }
    if(s<0) for(let t=0;t<idx.length;t+=3){ const q=idx[t+1]; idx[t+1]=idx[t+2]; idx[t+2]=q; }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.setIndex(idx); return g; };
  const bake=(g,colFn)=>{ smoothN(g); const ix=g.index.array, p=g.attributes.position, nr=g.attributes.normal, uv=g.attributes.uv, m=ix.length, pos=new Float32Array(m*3), nor=new Float32Array(m*3), col=new Float32Array(m*3), c=new THREE.Color();
    for(let k=0;k<m;k++){ const v=ix[k]; pos[k*3]=p.getX(v); pos[k*3+1]=p.getY(v); pos[k*3+2]=p.getZ(v); nor[k*3]=nr.getX(v); nor[k*3+1]=nr.getY(v); nor[k*3+2]=nr.getZ(v);
      colFn(uv.getX(v),uv.getY(v),pos[k*3],pos[k*3+1],pos[k*3+2],c); col[k*3]=c.r; col[k*3+1]=c.g; col[k*3+2]=c.b; }
    const o=new THREE.BufferGeometry(); o.setAttribute('position',new THREE.BufferAttribute(pos,3)); o.setAttribute('normal',new THREE.BufferAttribute(nor,3)); o.setAttribute('color',new THREE.BufferAttribute(col,3)); return o; };
  // a limb's section at t (0..1 down it) from its stations, the same smooth curve `limb` draws: [half-width x, half-depth z, z offset]
  const mkAt=st=>{ const n=st.length, m=[1,2,3].map(c=>{ const out=[]; for(let i=0;i<n;i++){ const a=st[Math.max(0,i-1)], b=st[Math.min(n-1,i+1)], dt=(b[0]-a[0])||1; let s=((b[c]||0)-(a[c]||0))/dt;
      const l=i>0?((st[i][c]||0)-(st[i-1][c]||0)):0, r=i<n-1?((st[i+1][c]||0)-(st[i][c]||0)):0; if(l*r<=0) s=0; out.push(s); } return out; });
    return t=>{ t=clamp(t); let i=1; while(i<n-1&&t>st[i][0]) i++; const a=st[i-1], b=st[i], h=(b[0]-a[0])||1, u=clamp((t-a[0])/h), u2=u*u, u3=u2*u;
      return [1,2,3].map((c,ci)=>(2*u3-3*u2+1)*(a[c]||0)+(u3-2*u2+u)*h*m[ci][i-1]+(-2*u3+3*u2)*(b[c]||0)+(u3-u2)*h*m[ci][i]); }; };
  // a leaf: a flat ellipsoid standing along +y from the origin, a darker vein down the middle (2 colours), tip pointing up
  const leaf=(len,wid,col,vein,sgm)=>pc(csph(1,Math.min(sgm||6,6),4).scale(wid,len,Math.max(0.0012,wid*0.18)).translate(0,len,0),(x,y,z,c)=>{ c.set(col); if(Math.abs(x)<wid*0.13) c.set(vein); else c.multiplyScalar(0.92+0.12*Math.min(1,y/(2*len))); });
  const lay=(g,rx,rz,x,y,z)=>g.rotateX(rx).rotateZ(rz).translate(x,y,z);   // lean a leaf: tip tilted by rz about z (sideways) and rx about x (forward / back), then moved

  return function(X,D){
    const {S,sg,skin,skinPaint}=X, TK=D.TK, B=D.B, aw=D.aw, cw=D.cw, tw=D.tw, th=D.thigh, shinL=D.shin, KR=D.KR, hx=D.hx, HT=typeof HEAD_TALL!=='undefined'?HEAD_TALL:1.1, ts=yd=>torsoSize(X,D,yd);
    // a point on the torso's surface at design height yd, azimuth th (0 = front, + toward +x), m metres off it: cloth on the body, front opening, belt, straps
    const ringPt=(yd,a,m)=>{ const s=ts(yd), zr=lerp(s.rzBack,s.rz,smoothstep(-0.45,0.45,Math.cos(a))); return [(s.rx+m)*Math.sin(a),yd*TK,-(zr+m)*Math.cos(a)]; };
    const zFront=(x,yd,m)=>{ const s=ts(yd); return -(s.rz+m)*Math.sqrt(Math.max(0,1-Math.pow(x/(s.rx+m),2))); };

    /* ---- the paint of the body: a shell-white shirt with a V neck (the robe covers most of it), clay breeches to above the knee, bare calves, green wading boots ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso':   // y is the design height
          if(y>0.44&&z<0&&Math.abs(x)<(y-0.44)*0.55){ skinPaint(c); return; }               // the shirt's V neck
          if(y<0.065) c.set(CLAY); else { c.set(SHELL); if(z<0&&Math.abs(x)<0.004) c.set(SHELL_D); }   // clay breeches' top under the belt; the shirt with a placket line
          return;
        case 'upperArm': c.set(SHELL); return;                                                 // the shirt's sleeve, to the elbow (rolled: forearm hook)
        case 'foreArm': skinPaint(c); return;
        case 'thigh': { const t=-y/th; if(t>0.9) skinPaint(c); else { c.set(CLAY); c.lerp(cCd,0.16*(0.5+0.5*Math.sin(Math.atan2(z,x*sd)*6))); } return; }
        case 'shin': { const t=-y/shinL; if(t<0.5) skinPaint(c); else c.set(GREEN); return; }
        case 'foot': c.set(GREEN); if(y<-D.ankleH+0.012) c.set(LEATHER_D); return;
      }
      c.set(SHELL);
    };

    /* ================= the eyes: gentle, the outer lid drooping, a large low highlight (mark adds the lid and the highlight over the base eye) ================= */
    const EYES={iris:1.08,h:0.94,w:1.04,lash:0.8,hl:1,tilt:-0.14,browLift:0.004,browThick:0.9,browAngle:-0.2};

    /* ================= the face: a thumb-smear of marsh clay on the left cheekbone with two drips, and the drooping lids with a big low highlight ================= */
    const mark=F=>{ const out=[], fx=F.fs[0];
      { const cx=-0.052*fx, cy=-0.027*HT;                                      // the smear: a rough ellipse, a lighter streak in it, a darker rim, two drips
        out.push(pc(F.place(csph(1,sg(10),sg(6)).scale(0.0105,0.0068,0.0007).rotateZ(0.42),cx,cy,0.0005),(x,y,z,c)=>{ c.set(CLAY); c.lerp(cCd,0.5*smoothstep(0.0035,0.0105,Math.hypot(x-cx,(y-cy)*1.4))); }));
        for(const k of [-1,0,1]) out.push(solid(F.place(csph(1,sg(8),sg(5)).scale(0.0072,0.0007,0.0007).rotateZ(0.42),cx-k*0.0017,cy+k*0.0026,0.0011),k===0?0xb88f68:CLAY_D));   // the print of three fingers dragged through it
        for(const [dx,dy,l] of [[-0.0032,-0.0099,0.0042],[0.0042,-0.0084,0.0031]]) out.push(solid(F.place(csph(1,sg(8),sg(5)).scale(0.0013,l,0.0007),cx+dx,cy+dy,0.0005),CLAY)); }
      const E=S.eyeSize*0.74, ex=0.046*S.eyeGap*fx, ey=(-0.002+0.012*S.eyeHeight)*HT, tilt=0.06+0.3*(S.eyeTilt+EYES.tilt);
      for(const sd of [-1,1]){ const e=[];
        // the outer lid: a skin-coloured sliver over the outer top of the eye, edged by a fine lash-coloured line
        e.push(pc(csph(1,sg(10),sg(6)).scale(0.0205*E,0.0058*E,0.0036).translate(sd*0.0128*E,0.0212*E,-0.0067),(x,y,z,c)=>{ skinPaint(c); c.multiplyScalar(0.94+0.06*smoothstep(0,0.01,0.025*E-y)); }));
        const P=[]; for(let k=0;k<=6;k++){ const f=k/6; P.push([sd*(0.002+0.0305*f)*E,(0.0186-0.0068*f*f)*E,-0.0102+0.0009*f]); }
        e.push(solid(sweepTube(P,[0.0006,0.0011,0.0012,0.001,0.0006].map(r=>r*E),sg(5),{cap:'point',rings:sg(10)}),0x4a3626));
        // the big, low highlight: a soft white ellipse in the lower part of the iris
        e.push(solid(csph(1,sg(10),sg(6)).scale(0.0082*E,0.0048*E,0.0012).translate(-sd*0.0035*E,-0.0098*E,-0.0121),0xfbfcfa));
        out.push(F.place(merge(e).rotateZ(sd*tilt),sd*ex,ey,0.0015)); }
      return out; };

    /* ================= the head: a white linen wrap (green trim at both edges) knotted at the left temple with a sprig of mint ================= */
    const wrap=(F,T)=>{
      const out=[], fs=F.fs, nu=sg(8), nv=sg(44), hv=T.hv;
      const phc=a=>(0.356+0.07*sm(0.25,1,Math.abs(a)/Math.PI))*Math.PI;          // the band's polar angle: higher on the brow, lower at the nape
      const Rb=a=>(0.1115+0.027*sm(0.1,0.42,Math.abs(a)/Math.PI))*hv;             // snug on the brow, standing off the hair at the sides and behind
      const surf=(a,u)=>T.sp(a,phc(a)+(u-0.5)*0.2,Rb(a)+0.002);
      const g=grid(nu,nv,(u,v)=>surf(-Math.PI+v*TAU,u),(x,y,z)=>[x,0,z]);
      T.fit(g);
      const kv=Math.round(((-1.12)+Math.PI)/TAU*nv), kp=new V3().fromBufferAttribute(g.attributes.position,Math.floor(nu/2)*(nv+1)+kv);   // the band's surface at the left temple, after the sculpt
      out.push(bake(g,(u,v,x,y,z,c)=>{ c.set(SHELL); if(u<0.12||u>0.88) c.set(GREEN); else if(u<0.2||u>0.8) c.lerp(cS,0.3); c.multiplyScalar(0.95+0.05*Math.sin(v*TAU*46)); }));
      // the knot: a plump knot, two loops and two short tails with green ends, and the mint sprig tucked in it
      const out2=new V3(-1,0.2,-0.3).normalize(), kc=[kp.x+out2.x*0.02,kp.y+out2.y*0.02,kp.z+out2.z*0.02];
      out.push(solid(csph(0.0145,sg(10),sg(8)).scale(1.15,0.95,0.95).translate(kc[0],kc[1],kc[2]),SHELL));
      for(const s2 of [-1,1]) out.push(solid(ofRingAt([kc[0]-0.004,kc[1]+0.0105,kc[2]+s2*0.0075],[0.35,s2*0.15,s2],0.0108,0.0036,sg(5)),SHELL));
      for(const [len,dz,lean] of [[0.056,0.004,0.004],[0.044,-0.007,-0.006]]){
        const P=[[kc[0]-0.005,kc[1]-0.004,kc[2]+dz],[kc[0]-0.011,kc[1]-len*0.45,kc[2]+dz+lean*0.5],[kc[0]-0.014,kc[1]-len,kc[2]+dz+lean]];
        out.push(pc(ofRibbon(P,u=>0.0125*(u>0.86?1-(u-0.86)/0.14*0.65:1),{up:[-1,0,-0.2],seg:sg(8),th:0.0028}),(x,y,z,c)=>{ c.set(SHELL); if(y<kc[1]-len*0.66) c.set(GREEN); if(y<kc[1]-len*0.62&&y>kc[1]-len*0.68) c.set(REED); })); }
      // mint: a thin stem and three leaves fanned up and outward from the knot
      const sx=kc[0]-0.002, sy=kc[1]+0.008, sz=kc[2]-0.002;
      out.push(solid(sweepTube([[sx,sy,sz],[sx-0.004,sy+0.012,sz-0.002],[sx-0.008,sy+0.022,sz-0.003]],[0.0013,0.0012,0.001],5,{cap:'round',rings:6}),MINT_D));
      out.push(lay(leaf(0.016,0.0075,MINT,MINT_D,sg(8)),-0.25,0.0,sx-0.008,sy+0.022,sz-0.003));
      out.push(lay(leaf(0.014,0.0066,MINT,MINT_D,sg(8)),-0.1,0.95,sx-0.007,sy+0.02,sz-0.003));
      out.push(lay(leaf(0.013,0.0062,0x9ad0b0,MINT_D,sg(8)),-0.4,-0.85,sx-0.007,sy+0.019,sz-0.002));
      return out; };

    /* ================= the hair: brown, a short fringe above the wrap, loose strands at the temples, the rest gathered in a low knot at the nape pinned with a pale reed ================= */
    const hair=(F,T)=>{
      const R=T.R, hv=T.hv, hl=T.hl, bg=T.bg, fs=F.fs, rng=mulberry32(61);
      const hp=(x,y,z,c)=>{ T.hp(x,y,z,c); c.lerp(ofCol(0x9a6a40),0.22*(0.5+0.5*Math.sin(x*210+z*120+y*40))); };      // warm streaks over the base colour
      T.add(T.fit(shell(0.113*hv,0,0.5*Math.PI,0,0.3,sg(40),sg(20))),hp);                                         // the cap
      // the fringe: ribbons that end ABOVE the wrap, so the band stays clean
      { const n=6; for(let i=0;i<n;i++){ const f=i/(n-1)*2-1, af=Math.abs(f), yb=0.092-0.022*bg-0.01*bg*(i%2)-0.008*rng()*bg, ph1=Math.acos(clamp(yb/R,-0.9,0.9)), w=0.0155-0.0035*af+0.003*rng();
          T.add(T.scalpLock(f*0.95,0.15*Math.PI,ph1,[0.009,w,w*1.1,w*0.6,0.0015],{sw:0.1*(0.7+0.6*(1-af))+f*0.18,tip:0.1*bg,lift:0.002+0.006*(1-af),k:0.42}),hp); } }
      T.sideLocks(0.05*hl);
      // the back: ribbons from the crown that all run down and in toward the nape, where the knot is
      { const n=sg(12); for(let i=0;i<n;i++){ const a=1.05+(TAU-2.1)*(i+0.5)/n, w=0.0185+0.004*rng(), sw=(Math.PI-a)*0.22;
          T.add(T.scalpLock(a,0.2*Math.PI,0.6*Math.PI+0.03*rng(),[0.01,w,w*1.1,w*0.65,0.003],{sw,tip:0.02,lift:0.004+0.004*rng(),k:0.6,R:R-0.002*(i%2)}),hp); } }
      // the loose strands framing the temples: two thin ones each side, longer than the side locks
      for(const sd of [-1,1]) for(const [k,len] of [[0,0.115],[1,0.085]]){ const L=len*hl, P=[T.sp(sd*(1.18+0.05*k),0.32*Math.PI,R),T.sp(sd*(1.34+0.03*k),0.5*Math.PI,R),[sd*(0.106-0.004*k),-0.03,-0.05+0.01*k],[sd*(0.104-0.005*k),-0.03-L*0.55,-0.054+0.01*k],[sd*(0.098-0.004*k),-0.03-L,-0.058+0.01*k]];
        T.add(T.hang(sweepTube(P,[0.0035,0.0058,0.0055,0.0036,0.0008],sg(6),{cap:'point',rings:sg(12)})),hp); }
      // the knot: low on the nape, strands wound over it, loose ends below; a pale reed with dark nodes pins it, standing out both sides
      const kz=0.128, ky=-0.044;
      T.add(T.hang(csph(0.046,sg(18),sg(12)).scale(1,0.8,0.92).translate(0,ky,kz)),(x,y,z,c)=>{ hp(x,y,z,c); c.multiplyScalar(0.86+0.14*Math.sin(Math.atan2(x,(y-ky)*1.3)*9)); });
      for(let s=0;s<3;s++){ const P=[]; for(let i=0;i<=8;i++){ const f=i/8, a=-1.3+2.6*f+s*0.45-0.45; P.push([0.049*Math.sin(a)*(1-0.15*s),ky+0.03*Math.cos(a*1.3)-0.014*s+0.01*(f-0.5),kz+0.04*(1-Math.cos(a))*-0.2+0.036*Math.cos(a)-0.002]); }
        T.add(T.hang(sweepTube(P,[0.006,0.0075,0.0075,0.0065,0.003],sg(6),{cap:'point',rings:sg(12)})),(x,y,z,c)=>{ hp(x,y,z,c); c.multiplyScalar(1.1); }); }
      for(const [dx,L] of [[-0.012,0.062],[0.014,0.048]]){ const P=[[dx,ky-0.03,kz+0.02],[dx*1.1,ky-0.03-L*0.5,kz+0.03],[dx*1.4,ky-0.03-L,kz+0.026]];
        T.add(T.hang(sweepTube(P,[0.0075,0.0065,0.0012],sg(6),{cap:'point',rings:sg(10)})),hp); }
      const pin=[[-0.083,-0.012,kz-0.004],[-0.04,-0.028,kz+0.012],[0.0,-0.043,kz+0.024],[0.044,-0.058,kz+0.017],[0.088,-0.072,kz-0.004]];
      T.add(sweepTube(pin,[0.0026,0.0044,0.0048,0.0042,0.0012],sg(6),{cap:'point',rings:sg(30)}),(x,y,z,c)=>{ const u=(x+0.083)/0.171; c.set(REED_P); if(((u*7)%1+1)%1<0.09) c.set(REED_D); if(u>0.94||u<0.04) c.set(REED_D); });
      return []; };

    /* ================= the shirt, belt, strap, leaf badge (all on the spine) ================= */
    const EPS=yd=>0.1+0.42*sm(0.14,0.5,yd), YB=-0.004, YT=0.532;     // the robe's front opening (half-angle, widening to a V at the chest) and its lowest / highest design heights
    const mg=0.0085;
    const robe=()=>{ const out=[], nu=sg(18), nv=sg(32);
      const g=grid(nu,nv,(u,v)=>{ const yd=lerp(YB,YT,u); return ringPt(yd,lerp(EPS(yd),TAU-EPS(yd),v),mg); },(x,y,z)=>[x,0,z]);
      out.push(bake(g,(u,v,x,y,z,c)=>{ c.set(GREEN); c.lerp(cGd,0.14*(0.5+0.5*Math.sin(v*TAU*13)));      // soft pleats
        if(u>0.945) c.lerp(cGd,0.7);                                                                        // a darker yoke band at the neck
        c.multiplyScalar(0.93+0.1*u); }));
      // the piping (shell white): up the right front edge, round the neck, down the left front edge
      const P=[], n1=sg(14), n2=sg(22);
      for(let i=0;i<=n1;i++){ const yd=lerp(YB,YT,i/n1); P.push(ringPt(yd,EPS(yd),mg+0.0012)); }
      for(let i=1;i<n2;i++) P.push(ringPt(YT,lerp(EPS(YT),TAU-EPS(YT),i/n2),mg+0.0012));
      for(let i=0;i<=n1;i++){ const yd=lerp(YT,YB,i/n1); P.push(ringPt(yd,TAU-EPS(yd),mg+0.0012)); }
      out.push(solid(sweepTube(P,P.map(()=>0.0029),4,{cap:'round',rings:P.length}),SHELL));
      return out; };
    // the leaf badge on the left chest: a darker green oval, a reed-coloured leaf with a shell-white vein (a fine grid, so its edge is crisp)
    const badge=()=>{ const cx=-0.076*B, by=0.37*TK, hw=0.022, hh=0.03;
      const g=ofPatch(cx-hw,cx+hw,by-hh,by+hh,sg(13),sg(15),(x,y)=>zFront(x,y/TK,mg+0.0013),true);
      return pc(g,(x,y,z,c)=>{ const u=x-cx, v=y-by;
        c.set(GREEN_D); if(Math.abs(u)>hw-0.0028||Math.abs(v)>hh-0.0028) c.set(REED);                           // a sewn-on patch with a reed border
        else { const k=v/0.0185, lw=0.0105*Math.pow(Math.max(0,1-k*k),0.8)*(1-0.12*k);
          if(Math.abs(k)<1&&Math.abs(u-0.001*k)<lw){ c.set(REED); if(Math.abs(u-0.001*k)<0.0009) c.set(SHELL); } } }); };   // the leaf and its vein
    const buttons=()=>{ const out=[]; for(const yd of [0.115,0.19,0.265,0.34,0.415]) out.push(solid(csph(0.0058,sg(6),sg(4)).scale(1,1,0.38).translate(0,yd*TK,zFront(0,yd,0.0028)),SHELL));
      return out; };
    // the shirt's collar: a rolled ring round the neck's base with a thread of reed on top
    const collar=()=>{ const nr=D.neckR, y=0.567*TK, R=nr*1.3*1.05+0.0085;
      return [solid(ofRingAt([0,y,-0.007],[0,1,0],R,0.0092,sg(6)),SHELL),solid(ofRingAt([0,y+0.004,-0.007],[0,1,0],R+0.0035,0.003,4),REED)]; };
    // the belt: a leather band with dark edges; a shell-brass buckle on a fine patch
    const belt=()=>{ const out=[], y0=0.012, y1=0.062, mb=0.0128;
      const g=grid(sg(4),sg(36),(u,v)=>ringPt(lerp(y0,y1,u),-Math.PI+v*TAU,mb),(x,y,z)=>[x,0,z]);
      out.push(bake(g,(u,v,x,y,z,c)=>{ c.set(LEATHER); if(u<0.15||u>0.85) c.set(LEATHER_D); c.multiplyScalar(0.94+0.08*Math.sin(v*TAU*30)); }));
      const by=0.037*TK, bw=0.024, bh=0.021;
      out.push(pc(ofPatch(-bw,bw,by-bh,by+bh,sg(10),sg(9),(x,y)=>zFront(x,y/TK,mb+0.0016),true),(x,y,z,c)=>{ c.set(BRASS); if(Math.abs(x)<bw*0.62&&Math.abs(y-by)<bh*0.62) c.set(LEATHER_D); if(Math.abs(x)<0.0022) c.set(BRASS); }));
      return out; };
    // the satchel's strap: a flat band from the right shoulder across the chest to the left hip, and its twin across the back; per-point normals so the flat face always looks outward
    const band=(yds,ths,w,m,col)=>{ const cv=new THREE.CatmullRomCurve3(yds.map((y,i)=>new V3(y,ths[i],0))), nu=sg(16), nv=2, at=u=>{ const p=cv.getPoint(clamp(u)); return ringPt(p.x,p.y,m); };
      const g=grid(nu,nv,(u,v)=>{ const p=at(u), q=at(u+0.01), r=at(u-0.01), n0=ringPt(cv.getPoint(clamp(u)).x,cv.getPoint(clamp(u)).y,m+0.01), tx=q[0]-r[0], ty=q[1]-r[1], tz=q[2]-r[2];
          const nx=n0[0]-p[0], ny=n0[1]-p[1], nz=n0[2]-p[2], bx=ty*nz-tz*ny, by=tz*nx-tx*nz, bz=tx*ny-ty*nx, bl=Math.hypot(bx,by,bz)||1, o=(v-0.5)*w;
          return [p[0]+bx/bl*o+nx*0.0,p[1]+by/bl*o,p[2]+bz/bl*o]; },(x,y,z)=>[x,0,z]);
      return bake(g,(u,v,x,y,z,c)=>{ c.set(col); const e=Math.abs(v-0.5)*2; if(e>0.7) c.set(LEATHER_D); else if(e<0.2) c.lerp(cR,0.18); }); };
    const STRAP_Y=[0.495,0.43,0.33,0.23,0.14,0.08,0.04], STRAP_F=[0.78,0.5,0.14,-0.3,-0.75,-1.2,-1.5708], STRAP_B=[Math.PI-0.78,Math.PI-0.5,Math.PI-0.14,Math.PI+0.3,Math.PI+0.75,Math.PI+1.2,Math.PI+1.5708];

    /* ---- the torso hook: robe, piping, badge, shirt details, collar, belt, strap ---- */
    const torso=()=>{ const out=[...robe(),badge(),...buttons(),...collar(),...belt()];
      out.push(band(STRAP_Y,STRAP_F,0.036,0.0155,LEATHER),band(STRAP_Y,STRAP_B,0.036,0.0155,LEATHER));
      // the strap's brass keeper on the chest, and the neck cord ring for the hat
      const kp=ringPt(0.33,0.14,0.0175); out.push(pc(vbox(0.024,0.016,0.004,0,0,0).rotateZ(0.6).translate(kp[0],kp[1],kp[2]-0.001),(x,y,z,c)=>{ c.set(BRASS); const q=Math.hypot(x-kp[0],y-kp[1]); if(q<0.0055) c.set(LEATHER_D); }));
      out.push(solid(ofRingAt([0,0.6*TK,-0.006],[0,1,0],D.neckR*1.06*1.05+0.004,0.0026,4),REED));
      return out; };

    /* ---- shoulders and forearms: the shirt's garters and rolled sleeves, linen wraps on the wrists ---- */
    const shoulder=sd=>[solid(ofRingAt([0,-0.19,0],[0,1,0],0.0395*aw+0.003,0.0058,sg(5)),GREEN),solid(ofRingAt([0,-0.205,0],[0,1,0],0.0385*aw+0.0025,0.0024,4),REED)];
    const forearm=sd=>{ const out=[solid(ofRingAt([0,-0.004,0],[0,1,0],D.ER+0.0035,0.0092,sg(6)),SHELL),solid(ofRingAt([0,-0.022,0],[0,1,0],D.ER*0.96+0.0015,0.0024,4),GREEN)];
      [[-0.184,0.0272,SHELL,0.1],[-0.199,0.0262,REED,-0.1],[-0.214,0.0252,SHELL,0.1]].forEach(([y,r,col,tl])=>out.push(solid(ofRingAt([0,y,0],[tl,1,0],r*aw+0.0016,0.0046,4),col)));
      return out; };

    /* ---- the breeches' rolled cuffs (thigh) ---- */
    const TH=mkAt([[0,0.088*tw,0.092*tw],[0.14,0.09*tw,0.094*tw],[0.42,0.077*tw,0.081*tw,-0.004],[0.76,Math.max(KR*1.1,0.057*tw),Math.max(KR*1.12,0.06*tw),-0.002],[1,KR,KR*1.04]]);
    const thigh=sd=>{ const q=TH(0.9), R=Math.max(q[0],q[1])+0.0045, q2=TH(0.935);
      return [solid(ofRingAt([0,-0.9*th,q[2]],[0,1,0],R,0.0105,sg(6)),CLAY_D),solid(ofRingAt([0,-0.9*th-0.006,q[2]],[0,1,0],R+0.0035,0.0033,4),CLAY),
        solid(ofRingAt([0,-0.935*th,q2[2]],[0,1,0],Math.max(q2[0],q2[1])+0.0035,0.0024,4),LEATHER)]; };

    /* ---- the skirt: two half-robes that hang from the thigh bones (so a swinging leg never pierces them): open at the front and at the back centre, flaring at the hem ---- */
    const skirt=sd=>{ const s1=0.8*th, nu=sg(9), nv=sg(24), B0=u=>0.36+0.5*Math.pow(u,1.2), B1=3.95, out=[];
      const P=(u,v,m)=>{ const s=lerp(-0.002,s1,u), q=TH(clamp(s/th)), gap=0.011-0.003*Math.min(1,u*6)+0.046*Math.pow(u,1.6)+(m||0), be=lerp(B0(u),B1,v);
        return [sd*(q[0]+gap)*Math.sin(be),-s,q[2]-(q[1]+gap)*Math.cos(be)]; };
      const ot=(x,y,z)=>[x,0,z];
      out.push(bake(grid(nu,nv,(u,v)=>P(u*0.955,v),ot),(u,v,x,y,z,c)=>{ c.set(GREEN); c.lerp(cGd,0.14*(0.5+0.5*Math.sin(v*TAU*7))); c.multiplyScalar(0.84+0.2*Math.min(1,u*2.2)+0.04*u); }));
      // the hem: a shell-white band (a strip of its own, so its edge is crisp), the open front edge likewise, and a reed-coloured wave a hand above the hem
      out.push(bake(grid(2,nv,(u,v)=>P(lerp(0.955,1,u),v,0.0012),ot),(u,v,x,y,z,c)=>{ c.set(SHELL); if(u<0.1) c.set(SHELL_D); }));
      out.push(bake(grid(sg(9),1,(u,v)=>P(u,v*0.03,0.0012),ot),(u,v,x,y,z,c)=>c.set(SHELL)));
      const W=sg(60), nw=Math.max(5,Math.round(W/9));
      out.push(bake(grid(2,W,(u,v)=>{ const p=P(0.85,v,0.0016); p[1]+=0.0065*Math.sin(v*TAU*nw*0.5*1.5)+(u-0.5)*0.0075; return p; },ot),(u,v,x,y,z,c)=>{ c.set(REED); if(u<0.15||u>0.85) c.set(REED_D); }));
      return out; };

    /* ---- the boots: a wide, soft shaft, a folded-over cuff, a thick-soled wide foot with a pale patch where the mud dries; and the leather shin guards on the bare calf above ---- */
    const SH=mkAt([[0,KR,KR*1.04],[0.14,0.0505*cw,0.054*cw,0.005],[0.3,0.052*cw,0.057*cw,0.011],[0.5,0.041*cw,0.044*cw,0.007],[0.6,0.045*cw,0.048*cw,0.005],[0.66,0.042*cw,0.045*cw,0.005],[0.85,0.037*cw,0.039*cw],[1,0.033*cw,0.035*cw]]);
    const shaft=()=>{ const out=[], t0=0.6, t1=0.985, nu=sg(11), nv=sg(20);
      const g=grid(nu,nv,(u,v)=>{ const t=lerp(t0,t1,u), q=SH(t), a=v*TAU, gap=0.0058+0.0035*sm(0.6,0.95,t)+0.0022*Math.sin(t*38)*sm(0.62,0.75,t); return [(q[0]+gap)*Math.sin(a),-t*shinL,q[2]+(q[1]+gap)*Math.cos(a)]; },(x,y,z)=>[x,0,z]);
      out.push(bake(g,(u,v,x,y,z,c)=>{ c.set(GREEN); c.multiplyScalar(0.9+0.14*Math.sin(u*Math.PI*5.5+1)); if(u>0.93) c.lerp(cGd,0.6); }));
      // the cuff folded over at the top: a pale lining outside, a rounded fold above, a darker green edge
      const c0=0.5, c1=0.615, g2=grid(4,nv,(u,v)=>{ const t=lerp(c0,c1,u), q=SH(t), a=v*TAU, gap=0.0042+0.0075*Math.sin(u*Math.PI*0.5); return [(q[0]+gap)*Math.sin(a),-t*shinL,q[2]+(q[1]+gap)*Math.cos(a)]; },(x,y,z)=>[x,0,z]);
      out.push(bake(g2,(u,v,x,y,z,c)=>{ c.set(REED); c.multiplyScalar(0.92+0.12*u); c.multiplyScalar(0.94+0.06*Math.sin(v*TAU*16)); if(u>0.9) c.set(REED_D); }));
      const qf=SH(c0), qb=SH(c1);
      out.push(solid(ofRingAt([0,-c0*shinL,qf[2]],[0,1,0],(qf[0]+qf[1])/2+0.0066,0.0062,sg(5)),REED_D));
      out.push(solid(ofRingAt([0,-c1*shinL,qb[2]],[0,1,0],(qb[0]+qb[1])/2+0.0125,0.0034,4),GREEN_D));
      { const qa=SH(0.985); out.push(solid(ofRingAt([0,-0.985*shinL,qa[2]],[0,1,0],(qa[0]+qa[1])/2+0.0108,0.0052,sg(5)),LEATHER_D)); }   // an ankle strap over the seam between shaft and foot
      return out; };
    const footShell=sd=>{ const sf=S.feet, wf=0.55+0.45*sf, hf=0.8+0.2*sf, A=D.ankleH, e=0.0062, out=[];
      const st=[[0.056,0.004,0.004,0.02],[0.047,0.02,0.026,0.03],[0.026,0.029,0.04,0.04],[0.0,0.031,0.05,0.05],[-0.03,0.033,0.04,0.042],[-0.075,0.037,0.027,0.029],[-0.115,0.031,0.02,0.021],[-0.14,0.018,0.013,0.015],[-0.153,0.004,0.004,0.01]];
      const loft=(rings,sgn)=>{ const dense=[], k=Math.max(1,Math.round(X.q*1.6)); for(let i=0;i<rings.length-1;i++) for(let j=0;j<k;j++){ const f=j/k, a=rings[i], b=rings[i+1]; dense.push({y:lerp(a.y,b.y,f),rx:lerp(a.rx,b.rx,f),rz:lerp(a.rz,b.rz,f),zc:lerp(a.zc,b.zc,f)}); } dense.push(rings[rings.length-1]);
        const g=loftRings(dense,sgn); g.rotateX(Math.PI/2); g.rotateY(-sd*0.1); return g; };
      const close=r=>{ const a=r[0], b=r[r.length-1]; return [{y:a.y+0.003,rx:0.0006,rz:0.0006,zc:a.zc},...r,{y:b.y-0.003,rx:0.0006,rz:0.0006,zc:b.zc}]; };   // end rings: the shell is closed at the heel and the toe
      // the upper: the foot's own outline, e wider, standing on the sole
      { const g=loft(close(st.map(s=>({y:s[0]*sf,rx:s[1]*wf+e,rz:s[2]*hf+e,zc:-(s[3]*hf-A)}))),sg(12)), p=g.attributes.position; for(let i=0;i<p.count;i++) if(p.getY(i)<-A+0.008) p.setY(i,-A+0.008); smoothN(g); g.translate(0,-shinL,0);
        out.push(pc(g,(x,y,z,c)=>{ const yy=y+shinL; c.set(GREEN); if(z<-0.1) c.multiplyScalar(0.9);
          const m=1-Math.hypot((z+0.075)/0.05,(yy+A-0.036)/0.024)+0.08*Math.sin(z*40+1); if(sd*x>0.012&&m>0) c.lerp(ofCol(0xc9b98c),Math.min(0.85,m*2.6));   // the pale dried-mud patch on the outer side
        },-D.thigh-D.shin)); }
      // the sole: a thin lens of the same outline, wider by a welt, in dark leather with a reed thread along its top
      { const g=loft(close(st.map(s=>({y:s[0]*sf,rx:s[1]*wf+e+0.0028,rz:0.0062,zc:A-0.0062}))),sg(10)); g.translate(0,-shinL,0);
        out.push(pc(g,(x,y,z,c)=>{ c.set(LEATHER_D); if(y+shinL>-A+0.0085) c.set(REED_D); },-D.thigh-D.shin)); }
      return out; };
    const guards=sd=>{ const out=[], t0=0.1, t1=0.5, nu=sg(8), nv=sg(12);
      const g=grid(nu,nv,(u,v)=>{ const t=lerp(t0,t1,u), q=SH(t), be=lerp(-1.5,1.5,v), m=0.0048; return [(q[0]+m)*Math.sin(be),-t*shinL,q[2]-(q[1]+m)*Math.cos(be)]; },(x,y,z)=>[x,0,z-0.2]);
      out.push(bake(g,(u,v,x,y,z,c)=>{ c.set(LEATHER); c.multiplyScalar(0.9+0.2*(1-Math.abs(v-0.5)*2)); if(v<0.07||v>0.93||u<0.06||u>0.94) c.set(LEATHER_D); }));
      for(const t of [0.18,0.42]){ const q=SH(t), m=0.0075, gr=grid(2,sg(20),(u,v)=>{ const tt=t+(u-0.5)*0.05, qq=SH(tt), a=v*TAU; return [(qq[0]+m)*Math.sin(a),-tt*shinL,qq[2]+(qq[1]+m)*Math.cos(a)]; },(x,y,z)=>[x,0,z]);
        out.push(bake(gr,(u,v,x,y,z,c)=>{ c.set(LEATHER_D); if(u<0.15||u>0.85) c.set(LEATHER); }));
        out.push(pc(vbox(0.017,0.0135,0.004,0,-t*shinL,q[2]-(q[1]+m)-0.0005),(x,y,z,c)=>{ c.set(BRASS); if(Math.abs(x)<0.0045&&Math.abs(y+t*shinL)<0.0035) c.set(LEATHER_D); })); }          // the buckle on the front
      return out; };
    const shin=sd=>[...shaft(),...footShell(sd),...guards(sd)];

    /* ================= extras: the two skirt shells (on the thigh bones), the reed hat slung on the back, the herb satchel, the belt of vials ================= */
    const extras=(rig,Xx,has)=>{   // has(slot): this outfit's item for the slot is worn: the reed hat slung on the back goes with the hat, the robe's shells, flaps, satchel and vials with the top
      if(has('top')) for(const sd of [-1,1]){ const m=mesh(skirt(sd),matCloth); (sd<0?rig.hipL:rig.hipR).add(m); }
      // ---- the reed cone hat: woven, a wide brim edged in green, a shell-white knob; slung on the back by a cord to the neck ----
      if(has('hat')){ const HR=0.225, prof=[[0.003,0.158],[0.023,0.149],[0.054,0.125],[0.088,0.093],[0.122,0.06],[0.15,0.038],[0.178,0.0225],[0.1835,0.0215],[0.21,0.008],[0.2145,0.0072],[HR,0.0]].map(p=>new THREE.Vector2(p[0],p[1]));
        const segs=sg(44), g=new THREE.LatheGeometry(prof,segs);
        const hat=[pc(g,(x,y,z,c)=>{ const r=Math.hypot(x,z), a=Math.atan2(z,x), rib=((Math.floor((a+Math.PI)/TAU*segs)%3)+3)%3, ring=Math.floor(r/0.021)&1;
          c.set(REED); if(ring) c.multiplyScalar(0.93); if(rib===0) c.multiplyScalar(0.9); if(r>0.18) { c.set(GREEN); if(rib===0) c.multiplyScalar(0.9); } if(r>0.213) c.set(REED_D); })];
        hat.push(solid(new THREE.TorusGeometry(HR-0.002,0.0042,3,segs),GREEN_D).rotateX(Math.PI/2).translate(0,0.0,0));
        hat.push(solid(csph(0.0105,sg(8),sg(6)).translate(0,0.163,0),SHELL));
        hat.push(solid(new THREE.TorusGeometry(0.0125,0.0028,4,sg(12)).rotateX(Math.PI/2).translate(0,0.153,0),REED));
        const hg=new THREE.Group(); hg.add(mesh(hat,matCloth));
        const yc=0.34, zc=ts(yc/TK).rzBack+0.165; hg.position.set(0,yc,zc); hg.rotation.x=1.15; rig.spine.add(hg);
        // the cord: from both rims up over the shoulder blades to the ring at the neck
        const cord=[]; for(const s2 of [-1,1]){ const rim=[s2*HR*0.99,yc+0.004,zc+0.005];
          cord.push(solid(sweepTube([rim,[s2*0.19,yc+0.1,zc-0.012],[s2*0.14,0.5,0.095],[s2*0.06,0.592,0.052]],[0.0026,0.0026,0.0026,0.0026],sg(5),{cap:'round',rings:sg(18)}),REED_D));
          cord.push(solid(csph(0.0055,sg(6),sg(5)).translate(rim[0],rim[1],rim[2]),LEATHER)); }
        rig.spine.add(mesh(cord)); }
      // ---- the apron flaps: a short green panel in front of and behind the pelvis (so the open robe never shows a bare crotch); they hang from the hips and half-follow the thighs ----
      if(has('top')){ const mkFlap=(front)=>{ const sgn=front?-1:1, s0=ts(0.0), z0=(front?s0.rz:s0.rzBack)+0.0105, hh=0.185, hwT=0.098*B, hwB=0.118*B, Rc=0.09;
          const P=(u,v,m)=>{ const hw=lerp(hwT,hwB,u), x=(v-0.5)*2*hw, y=0.027-u*hh, k=Math.min(1,u*5); return [x,y,sgn*(z0+0.004*k+0.005*u+(m||0)-0.5*x*x/Rc*0.6)]; };
          const ot=(x,y,z)=>[0,0,sgn];
          const parts=[bake(grid(sg(8),sg(10),(u,v)=>P(u*0.935,0.04+v*0.92),ot),(u,v,x,y,z,c)=>{ c.set(GREEN); c.lerp(cGd,0.14*(0.5+0.5*Math.sin(v*TAU*4))); c.multiplyScalar(0.86+0.16*Math.min(1,u*2)); }),
            bake(grid(2,sg(10),(u,v)=>P(lerp(0.935,1,u),v,0.001),ot),(u,v,x,y,z,c)=>{ c.set(SHELL); if(u<0.12) c.set(SHELL_D); })];
          for(const [v0,v1] of [[0,0.04],[0.96,1]]) parts.push(bake(grid(sg(8),1,(u,v)=>P(u*0.935,lerp(v0,v1,v),0.001),ot),(u,v,x,y,z,c)=>c.set(SHELL)));
          const W=sg(26); parts.push(bake(grid(2,W,(u,v)=>{ const p=P(0.8,0.04+v*0.92,0.0014); p[1]+=0.0065*Math.sin(v*TAU*2.5)+(u-0.5)*0.0075; return p; },ot),(u,v,x,y,z,c)=>{ c.set(REED); if(u<0.15||u>0.85) c.set(REED_D); }));
          const g=new THREE.Group(); g.add(mesh(parts,matCloth)); rig.hips.add(g); return g; };
        const ff=mkFlap(true), fb=mkFlap(false);
        rig.anims=rig.anims||[]; rig.anims.push(()=>{ const a=rig.hipL.rotation.x, b=rig.hipR.rotation.x; ff.rotation.x=0.75*Math.max(0,a,b); fb.rotation.x=0.75*Math.min(0,a,b); }); }
      // ---- the herb satchel at the left hip: canvas bag with a green scalloped flap and a shell button, herbs sticking out of it ----
      if(has('top')){ const sg0=new THREE.Group(), bw=0.074, hw=0.082, bh=0.125, rc=0.014, bev={bevelEnabled:true,bevelThickness:0.003,bevelSize:0.003,bevelSegments:1,curveSegments:3}, parts=[];
        const body=new THREE.Shape(); body.moveTo(-hw,0); body.lineTo(hw,0); body.lineTo(hw,-bh+rc); body.quadraticCurveTo(hw,-bh,hw-rc,-bh); body.lineTo(-hw+rc,-bh); body.quadraticCurveTo(-hw,-bh,-hw,-bh+rc); body.closePath();
        const flap=new THREE.Shape(); flap.moveTo(-hw-0.002,0); flap.lineTo(hw+0.002,0); flap.lineTo(hw+0.002,-0.052);
        for(let i=0;i<4;i++){ const x1=hw+0.002-(i+1)*(2*hw+0.004)/4, x0=x1+(2*hw+0.004)/4; flap.quadraticCurveTo((x0+x1)/2,-0.052-0.02,x1,-0.052+(i===3?0:0)); }
        flap.lineTo(-hw-0.002,0); flap.closePath();
        const xs=(g,x)=>g.rotateY(Math.PI/2).translate(x,0,0);
        parts.push(pc(xs(new THREE.ExtrudeGeometry(body,Object.assign({depth:bw-0.006},bev)),0),(x,y,z,c)=>{ c.set(CANVAS); c.multiplyScalar(0.92+0.1*Math.sin(y*210)*0.5+0.06*y/0.12+0.05); if(y>-0.01) c.set(REED_D); }));
        parts.push(pc(xs(new THREE.ExtrudeGeometry(flap,Object.assign({depth:bw-0.002},bev)),-0.002),(x,y,z,c)=>{ c.set(GREEN); if(y<-0.058||Math.abs(z)>hw-0.004) c.set(GREEN_D); c.multiplyScalar(0.9+0.2*Math.min(1,-y/0.07)); }));
        parts.push(solid(csph(0.0072,sg(8),sg(6)).scale(0.5,1,1).translate(-0.0045,-0.062,0),SHELL));                        // the shell button
        for(const zz of [-0.05,0.05]) parts.push(solid(sweepTube([[0.008,0.002,zz],[0.012,0.03,zz*0.9],[0.016,0.058,zz*0.7]],[0.003,0.003,0.003],sg(5),{cap:'round',rings:6}),LEATHER_D));   // the loops the strap goes through
        // herbs: stems with leaves, a yarrow head, a dried clay-coloured spray
        const stem=(P,col,leaves,lc,lv,flower)=>{ parts.push(solid(sweepTube(P,[0.0018,0.0016,0.0012],sg(5),{cap:'round',rings:8}),col));
          for(const [f,rz,rx,len] of leaves){ const cvv=new THREE.CatmullRomCurve3(P.map(p=>new V3(p[0],p[1],p[2]))), p=cvv.getPoint(f); parts.push(lay(leaf(len,len*0.6,lc,lv,6),rx,rz,p.x,p.y,p.z)); }
          if(flower){ const e=P[P.length-1]; for(const [dx,dz] of [[0,0],[0.007,0.003],[-0.006,0.004],[0.002,-0.007]]) parts.push(solid(csph(0.0058,5,3).translate(e[0]+dx,e[1]+0.004,e[2]+dz),SHELL)); } };
        stem([[0.0,-0.03,-0.03],[0.004,0.03,-0.036],[0.008,0.105,-0.044]],MINT_D,[[0.45,0.9,0,0.034],[0.58,-0.9,0.2,0.034],[0.74,0.7,-0.2,0.031],[0.88,-0.6,0.1,0.028]],MINT,MINT_D);
        stem([[0.0,-0.03,0.0],[0.002,0.04,0.004],[0.002,0.122,0.012]],GREEN,[[0.5,-0.95,0,0.04],[0.66,0.95,0.15,0.036],[0.82,-0.7,-0.1,0.03]],0x6aa27f,GREEN_D,true);
        stem([[0.0,-0.03,0.03],[-0.004,0.026,0.04],[-0.012,0.094,0.056]],MINT_D,[[0.4,0.9,0,0.032],[0.6,-0.85,0.2,0.034],[0.8,0.8,-0.1,0.028]],0x8fb878,MINT_D);
        stem([[0.0,-0.03,0.015],[0.006,0.03,0.022],[0.013,0.082,0.03]],CLAY,[[0.55,0.8,0,0.028],[0.78,-0.8,0.2,0.024]],0xb89a64,CLAY_D);
        sg0.add(mesh(parts)); sg0.position.set(-0.246,-0.005,0.012); rig.spine.add(sg0);
        rig.anims=rig.anims||[]; rig.anims.push((t,dt,mv)=>{ const k=Math.min(1,mv); sg0.rotation.z=-0.02-0.05*k*Math.sin(t*5.2)+0.012*Math.sin(t*1.7); sg0.rotation.x=0.04*k*Math.sin(t*2.6); }); }
      // ---- the belt of five glass vials: each a faint aqua glow (unlit parts, no light), a cork, a shell-white collar, hung from a leather loop ----
      if(has('top')){ const vg=[], mb=0.0128+0.01, y0=0.012*TK;
        for(let i=0;i<5;i++){ const x=(i-2)*0.047*B, a=Math.asin(clamp(x/(ts(0.012).rx+mb),-0.95,0.95)), p=ringPt(0.012,a,mb), g=new THREE.Group(); g.position.set(p[0],y0,p[2]);
          const lit=[solid(sweepTube([[0,0.007,0],[0,0.0,0],[0,-0.004,0]],[0.0016,0.0016,0.0016],3,{cap:'round',rings:3}),LEATHER_D),
            solid(new THREE.CylinderGeometry(0.0045,0.0038,0.007,7).translate(0,-0.0045,0),CLAY),
            solid(new THREE.TorusGeometry(0.0058,0.0018,3,9).rotateX(Math.PI/2).translate(0,-0.0092,0),SHELL),
            solid(csph(0.0055,6,4).scale(1,0.5,1).translate(0,-0.0295,0),SHELL)];
          const core=pc(csph(1,sg(9),sg(6)).scale(0.0066,0.0104,0.0066).translate(0,-0.0198,0),(x,y,z,c)=>{ c.set(AQ_TOP).lerp(ofCol(AQ_BOT),clamp((-0.0198-y)/0.0104*0.5+0.5)); });
          g.add(mesh(lit),new THREE.Mesh(merge([core]),matGlow)); g.scale.setScalar(1.5); rig.spine.add(g); vg.push(g); }
        rig.anims=rig.anims||[]; rig.anims.push((t,dt,mv)=>{ const k=Math.min(1,mv); vg.forEach((g,i)=>{ g.rotation.x=0.02*Math.sin(t*1.9+i)+0.12*k*Math.sin(t*5.5+i*1.3); g.rotation.z=0.03*Math.sin(t*1.3+i*2); }); }); }
    };

    /* ================= the weapon dressing: reed-and-linen grips, willow wood, shell-brass metal, green thread, a wave trim, and a charm of a herb bundle, a shell bell and a glowing vial ================= */
    const dress={ shape:{sword:'cleaver',bow:'branch',staff:'crook'}, grip:REED, metal:BRASS, wood:WILLOW, accent:GREEN, glow:0x8fd6dc,   // (the mage's orb: a soft water aqua instead of the tier's colour)
      trim:(c,u,part)=>{ if(part==='grip'){ if(((u/0.011)%1+1)%1<0.3) c.lerp(cS,0.8); return; } const w=Math.sin(u/0.04*TAU); if(part!=='face'&&w>0.74) c.lerp(cG,0.85); else if(part!=='face'&&w<-0.9) c.lerp(cR,0.5); },
      charm:()=>{ const lit=[], glow=[];
        lit.push(solid(sweepTube([[0,0.004,0],[0.002,-0.016,0.004],[0.004,-0.036,0.008]],[0.0013,0.0013,0.0013],5,{cap:'round',rings:6}),REED_D));
        // the herb bundle: a drying bunch hung upside down, tied with a shell-white thread
        const bx=0.005, by=-0.04, bz=0.01;
        lit.push(solid(ofRingAt([bx,by-0.008,bz],[0,1,0],0.0042,0.0013,5),SHELL));
        [[0,0,MINT_D,0.044],[0.007,0.004,GREEN,0.04],[-0.006,0.005,MINT,0.037],[0.002,-0.006,CLAY,0.034]].forEach(([dx,dz,col,L],i)=>{
          lit.push(solid(sweepTube([[bx,by,bz],[bx+dx*0.5,by-L*0.5,bz+dz*0.5],[bx+dx,by-L,bz+dz]],[0.0015,0.0014,0.0009],4,{cap:'round',rings:5}),col));
          lit.push(lay(leaf(0.011,0.0052,i===3?CLAY_D:MINT,MINT_D,6).rotateX(Math.PI),0.2,(i%2?1:-1)*0.8,bx+dx*0.75,by-L*0.75,bz+dz*0.75)); });
        lit.push(solid(csph(0.0034,6,5).translate(bx+0.0,by-0.049,bz),SHELL));
        // the shell bell: a little scallop-shell bell with a brass rim and a dark clapper
        const sx=-0.014, sy=-0.034, sz=0.004;
        lit.push(solid(sweepTube([[0,0.004,0],[-0.004,-0.012,0.002],[sx,sy+0.01,sz]],[0.0011,0.0011,0.0011],4,{cap:'round',rings:4}),REED_D));
        lit.push(pc(csph(0.0072,10,7).scale(1,0.85,1).translate(sx,sy,sz),(x,y,z,c)=>{ c.set(SHELL); if(Math.abs(Math.sin((Math.atan2(z-sz,x-sx))*5))>0.8) c.set(SHELL_D); if(y<sy-0.003) c.set(BRASS); }));
        lit.push(solid(csph(0.0022,5,4).translate(sx,sy-0.0075,sz),LEATHER_D));
        // the glass vial: cork and collar lit, the glass itself a faint aqua glow
        const vx=0.0, vy=-0.03, vz=-0.022;
        lit.push(solid(sweepTube([[0,0.004,0],[0.0,-0.01,-0.012],[vx,vy+0.012,vz]],[0.0011,0.0011,0.0011],4,{cap:'round',rings:4}),REED_D));
        lit.push(solid(new THREE.CylinderGeometry(0.0034,0.003,0.005,6).translate(vx,vy+0.0075,vz),CLAY));
        lit.push(solid(ofRingAt([vx,vy+0.0045,vz],[0,1,0],0.0044,0.0013,5),SHELL));
        glow.push(pc(csph(1,8,6).scale(0.0052,0.0092,0.0052).translate(vx,vy-0.003,vz),(x,y,z,c)=>{ c.set(AQ_TOP).lerp(ofCol(AQ_BOT),clamp((vy-0.003-y)/0.0092*0.5+0.5)); }));
        return {lit,glow}; } };

    return {
      aura:{col:0x8fcf8a,col2:0xdff5c0,style:'orbit',ring:false,n:6,shape:'leaf',deco:'none'},   /* this set's own aura (kit.aura: model.js) */
      main:{top:0x4f7a6a,bottom:0xa57b55,shoes:0x4f7a6a,hat:0x4f7a6a}, /* the main colour of each piece, for the player's recolouring (outfit-tools.js: ofTinter) */ bootTop:0.5, shinCut:0.48, boot:true, skinFrom:0.555, hairColor:HAIR, eyeColor:0x3f6b3a, eyes:EYES,
      cuts:{torso:[0.065],thigh:[0.9],shin:[0.5]},
      paint,
      head:(F,T)=>wrap(F,T),
      hair:(F,T)=>hair(F,T),
      mark,
      torso, shoulder, forearm, thigh, shin,
      extras,
      dress,
    };
  };
})();
OUTFITS.ambrose=oxPlus(OUTFITS.ambrose,(X,D)=>({   // round 5: an herb satchel with hanging bundles, a bead string of dried seeds, a mossy leaf mantle
  torso:()=>oxBeads(X,D,{col:0xcdbd8b,col2:0x4f7a6a,n:18,r:0.012,drop:0.2}),
  hips:()=>oxSatchel(X,D,{col:0x6a5a3a,trim:0x4f7a6a,herbs:0x8bc5a4,side:1}),
  cos:{cape:{col:0x4f7a6a,trim:0xdff5c0,len:0.45,pat:'petals',mantle:1}}}));
OUTFITS.ambrose=oxPlus(OUTFITS.ambrose,(X,D)=>({   // round 3: a mint linen scarf, a second satchel on the other hip, a leather plate with moss trim
  torso:()=>oxScarf(X,D,{col:0xdff5c0,col2:0x4f7a6a,len:0.6}),
  hips:()=>oxSatchel(X,D,{col:0x4f7a6a,trim:0x6a5a3a,herbs:0xe6eee6,side:-1}),
  shoulder:sd=>sd<0?oxPauldron(X,D,{col:0x6a5a3a,trim:0x8bc5a4,r:0.06}):[]}));
OUTFITS.ambrose=oxPlus(OUTFITS.ambrose,(X,D)=>({   // round 4: a curtain of hanging herb tags at the belt and a big mint obi-style bow
  torso:()=>oxBow(X,D,{col:0x8bc5a4,col2:0x4f7a6a}),
  hips:()=>oxTags(X,D,{col:0xe6eee6,mark:0x4f7a6a,n:10,len:0.2})}));
oxTune('ambrose',{eyeSize:1.18,brow:-0.6,smile:0.5,cheeks:1.15,blush:0.55,lips:1.1,undertone:-0.2,jaw:0.95,chin:0.95,noseSize:0.9,earSize:1.1});
OUTFITS.ambrose=oxPlus(OUTFITS.ambrose,(X,D)=>({   // face round 1: soft rosy cheeks, a warm smile, a tiny freckle sprinkle, a mint sprig tucked behind the ear, hazel-green eyes
  mark:F=>oxMarks(F,[{t:'freckles',col:0xb08a68}]),
  hair:()=>oxHairBits(X,[{t:'sprig',side:1,col:0x6fae7a,col2:0xf3ead2}]),
  kit:{eyeColor:0x7a9a4a,eyes:{iris:1.08,lash:0.5}}}));
