//@ Corvin's outfit (a lamplighter and mine surveyor): a brass-lamp surveyor's cap, silver swept-back hair, round brass spectacles, a long waxed coat to the calf whose tails follow the legs, nail boots, and the brass-and-lantern weapon dressing
/* ---------- Corvin: support (debuff), light. Design: docs/skillkits/looks/corvin.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: brass 0xc9a13a, charcoal 0x2b2b2e, lamp white 0xfff1c9 (only the cap lamp's and the lantern charm's glass glow), verdigris 0x5f8f7f (patina), leather 0x3a3228.
   Silhouette: a tall narrow column: a long waxed coat to the calf (each coat-tail is a flap that rides on its own leg, so no stride pushes a leg through the cloth), one bright
   point on the cap, round lenses on the face. Every part has at least two colours (charcoal wax with brass piping, leather and verdigris; leather with brass straps; hair in two greys). */
CHAR_MODELS.corvin={id:'corvin',name:'Corvin',signature:true, items:{hat:'Lamp cap',hair:'Silver wave',face:'Lamp soot & specs',top:'Plumb coat',bottom:'Survey legs',shoes:'Nail boots',weapon:'Brass bind'},sexes:['male'],
  note:'The lamplighter and mine surveyor: a tall narrow column in a long coat, built for a slim, tall man.',
  ranges:{height:[0.98,1.08],legs:[0.96,1.14],build:[0.88,1.06],shoulders:[0.88,1.08],chest:[0.6,1.15],waist:[0.88,1.1],thighs:[0.85,1.1],neck:[0.85,1.15],head:[0.92,1.06],eyeGap:[0.96,1.1],noseSize:[0.85,1.2],earSize:[0.8,1.15],hairVolume:[0.9,1.05],bangs:[0.3,1.0]},
  setups:[{id:'corvin',name:'Corvin',sex:'male',def:true,note:'The surveyor as drawn: tall, narrow, a long nose for the spectacles.',v:{height:1.04,build:0.94,chest:0.9,shoulders:0.94,waist:0.95,hips:0.95,torso:1.04,legs:1.06,thighs:0.9,arms:0.9,hands:1.05,jaw:0.95,chin:0.95,cheeks:0.9,eyeGap:1.04,brow:-0.1,noseSize:1.1,lips:0.9,hairVolume:0.9,bangs:0.3}}]};

OUTFITS.corvin=(function(){
  const CHAR=0x2b2b2e, CHAR_L=0x4c4c55, CHAR_D=0x1c1c1f, LEATHER=0x3a3228, LEATHER_D=0x241e18, LEATHER_L=0x5c4b3a, BRASS=0xc9a13a, BRASS_D=0x8a6d27, BRASS_L=0xeccf6e,
    LAMP=0xfff1c9, VERD=0x5f8f7f, VERD_D=0x2f4d44, STEEL=0xaab4bd, SOOT=0x6a5f55, SILVER=0xb9b3aa, WALNUT=0x4a3a2c, CHALK=0x9a9285;
  const cC=ofCol(0x3b3b41), cCl=ofCol(CHAR_L), cCd=ofCol(CHAR_D), cLe=ofCol(LEATHER), cLd=ofCol(LEATHER_D), cLl=ofCol(LEATHER_L), cB=ofCol(BRASS), cBd=ofCol(BRASS_D), cBl=ofCol(BRASS_L), cV=ofCol(VERD), cVd=ofCol(VERD_D), cCh=ofCol(CHALK);
  const V3=THREE.Vector3, G=faceG, sm=faceSm;

  /* a grid surface P(u, v) -> [x, y, z] over the rows us[] and nv columns; the faces are turned toward out(x, y, z); finish() bakes the colours (a one-sided cloth) */
  const grid=(us,nv,P,out)=>{
    const nu=us.length-1, pos=new Float32Array((nu+1)*(nv+1)*3), uv=new Float32Array((nu+1)*(nv+1)*2), idx=[];
    for(let i=0;i<=nu;i++) for(let j=0;j<=nv;j++){ const p=P(us[i],j/nv), k=i*(nv+1)+j; pos[k*3]=p[0]; pos[k*3+1]=p[1]; pos[k*3+2]=p[2]; uv[k*2]=us[i]; uv[k*2+1]=j/nv; }
    for(let i=0;i<nu;i++) for(let j=0;j<nv;j++){ const a=i*(nv+1)+j, b=a+1, c=a+nv+1, d=c+1; idx.push(a,c,b,b,c,d); }
    let s=0; const A=new V3(), B2=new V3(), C=new V3(), n=new V3();
    for(let t=0;t<idx.length;t+=3){ A.fromArray(pos,idx[t]*3); B2.fromArray(pos,idx[t+1]*3); C.fromArray(pos,idx[t+2]*3); const o=out((A.x+B2.x+C.x)/3,(A.y+B2.y+C.y)/3,(A.z+B2.z+C.z)/3);
      n.crossVectors(B2.sub(A),C.sub(A)); s+=n.x*o[0]+n.y*o[1]+n.z*o[2]; }
    if(s<0) for(let t=0;t<idx.length;t+=3){ const q=idx[t+1]; idx[t+1]=idx[t+2]; idx[t+2]=q; }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.setIndex(idx); return g;
  };
  const finish=(g,colFn)=>{
    smoothN(g); const ix=g.index.array, p=g.attributes.position, nr=g.attributes.normal, uv=g.attributes.uv, m=ix.length, pos=new Float32Array(m*3), nor=new Float32Array(m*3), col=new Float32Array(m*3), c=new THREE.Color();
    for(let k=0;k<m;k++){ const v=ix[k], x=p.getX(v), y=p.getY(v), z=p.getZ(v); pos[k*3]=x; pos[k*3+1]=y; pos[k*3+2]=z; nor[k*3]=nr.getX(v); nor[k*3+1]=nr.getY(v); nor[k*3+2]=nr.getZ(v);
      colFn(uv.getX(v),uv.getY(v),x,y,z,c); c.multiplyScalar(0.985+0.03*noise2(x*7+z*5,y*7-z*3)); col[k*3]=c.r; col[k*3+1]=c.g; col[k*3+2]=c.b; }
    const o=new THREE.BufferGeometry(); o.setAttribute('position',new THREE.BufferAttribute(pos,3)); o.setAttribute('normal',new THREE.BufferAttribute(nor,3)); o.setAttribute('color',new THREE.BufferAttribute(col,3)); return o;
  };
  // the inside face of a one-sided cloth: a copy pushed d inward along its normals with the winding turned
  const lining=(g,d)=>{ smoothN(g); const h=g.clone(), p=h.attributes.position, n=g.attributes.normal; for(let i=0;i<p.count;i++) p.setXYZ(i,p.getX(i)-n.getX(i)*d,p.getY(i)-n.getY(i)*d,p.getZ(i)-n.getZ(i)*d);
    const ix=h.index.array; for(let t=0;t<ix.length;t+=3){ const q=ix[t+1]; ix[t+1]=ix[t+2]; ix[t+2]=q; } return h; };
  // a limb's section [half-width x, half-depth z, z offset] at t (0..1 down it): the same smooth curve `limb` draws from its stations
  const mkAt=st=>{ const n=st.length, m=[1,2,3].map(c=>{ const out=[]; for(let i=0;i<n;i++){ const a=st[Math.max(0,i-1)], b=st[Math.min(n-1,i+1)], dt=(b[0]-a[0])||1; let s=((b[c]||0)-(a[c]||0))/dt;
      const l=i>0?((st[i][c]||0)-(st[i-1][c]||0)):0, r=i<n-1?((st[i+1][c]||0)-(st[i][c]||0)):0; if(l*r<=0) s=0; out.push(s); } return out; });
    return t=>{ t=clamp(t); let i=1; while(i<n-1&&t>st[i][0]) i++; const a=st[i-1], b=st[i], h=(b[0]-a[0])||1, u=clamp((t-a[0])/h), u2=u*u, u3=u2*u;
      return [1,2,3].map((c,ci)=>(2*u3-3*u2+1)*(a[c]||0)+(u3-2*u2+u)*h*m[ci][i-1]+(-2*u3+3*u2)*(b[c]||0)+(u3-u2)*h*m[ci][i]); }; };
  // a flat ring (an ellipse in the xz plane) of tube radius r: bands, rims, cuffs
  const ring=(y,rx,rz,zc,r,seg)=>{ const R=(rx+rz)/2, g=new THREE.TorusGeometry(R,r,5,seg); g.rotateX(Math.PI/2); g.scale(rx/R,1,rz/R); return g.translate(0,y,zc); };
  // a short open band round the y axis whose colour edges are crisp because it has many columns: a measuring band (a brass ring with an engraved tick every k columns)
  const tickBand=(R,h,n,y,tickEvery,long,sx,sz,zc)=>{ const g=new THREE.CylinderGeometry(R,R,h,n,1,true).scale(sx||1,1,sz||1).translate(0,y,zc||0);
    return pc(g,(x,yy,z,c)=>{ const k=Math.round((Math.atan2(x/(sx||1),z/(sz||1))+Math.PI)/TAU*n)%n, long5=long&&k%(tickEvery*long)===0; c.copy(cB); if(k%tickEvery===0){ c.copy(cLd); if(long5&&yy<y) c.copy(cB); } else if(yy>y) c.copy(cBl); else c.copy(cB); }); };
  // a thin round rod along a path (piping, seams, cords): four sides keep it cheap
  const tube=(P,rad,hex,rings)=>solid(sweepTube(P,[rad,rad],4,{cap:'round',rings:rings||Math.max(6,P.length*3)}),hex);
  const PHI=1.826, SQ=2/3;   // the coat-tail's section: a flat front and back, a rounded outer side, open on the inside (a squircle clipped where it meets the body's midline)

  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, B=D.B, aw=D.aw, hx=D.hx, HT=typeof HEAD_TALL!=='undefined'?HEAD_TALL:1.1;
    // a coat button: a short brass disc whose face is shaded toward its centre colour (domed), facing -z, turned by f about y
    const stud=(x,y,z,f,tone,rad)=>{ rad=rad||0.0088; return pc(new THREE.CylinderGeometry(rad,rad*1.045,0.0048,sg(8)).rotateX(Math.PI/2).rotateY(-f).translate(x,y,z-0.002),(xx,yy,zz,c)=>{ c.copy(cBd); if(zz<z-0.0035) c.lerp(ofCol(tone),1-clamp(Math.hypot(xx-x,yy-y)/rad)*0.85); }); };
    /* ---- the legs' real sections (the same stations the body is drawn from), so the coat's tails can ride at a fixed margin outside them ---- */
    const TH=mkAt([[0,0.088*D.tw,0.092*D.tw],[0.14,0.09*D.tw,0.094*D.tw],[0.42,0.077*D.tw,0.081*D.tw,-0.004],[0.76,Math.max(D.KR*1.1,0.057*D.tw),Math.max(D.KR*1.12,0.06*D.tw),-0.002],[1,D.KR,D.KR*1.04]]);
    const SH=mkAt([[0,D.KR,D.KR*1.04],[0.14,0.0505*D.cw,0.054*D.cw,0.005],[0.3,0.052*D.cw,0.057*D.cw,0.011],[0.5,0.041*D.cw,0.044*D.cw,0.007],[0.6,0.045*D.cw,0.048*D.cw,0.005],[0.66,0.042*D.cw,0.045*D.cw,0.005],[0.85,0.037*D.cw,0.039*D.cw],[1,0.033*D.cw,0.035*D.cw]]);
    let lampGlow=null;
    const BOOT=0.72, HEMT=0.455;   // the boot's top and the coat's hem, as fractions of the shin

    /* ---- the body's paint: charcoal coat, leather leggings and boots, brass at the toe ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': if(y<0.0) c.set(LEATHER); else c.set(CHAR); return;
        case 'upperArm': { c.set(CHAR); if(-y>0.205&&z>0.004) c.set(LEATHER_L); return; }
        case 'foreArm': if(y<-0.232) skinPaint(c); else if(y>-0.07&&z>0.004) c.set(LEATHER_L); else c.set(CHAR); return;
        case 'thigh': c.set(LEATHER); return;
        case 'shin': { const t=-y/D.shin; c.set(LEATHER); if(t>BOOT) { c.set(LEATHER_D); c.multiplyScalar(0.92+0.16*clamp(-z*10)); }
          else { const n=noise2(x*60+sd*3,y*28)*0.5+0.5; if(z<0&&t>0.45) c.lerp(cCh,0.28*smoothstep(0.55,0.9,n)); } return; }
        case 'foot': { c.set(LEATHER_D); if(y<-D.ankleH+0.012) c.set(0x15110d); else if(z<-0.1*S.feet*0.9) c.set(BRASS_D); return; }
      }
      c.set(CHAR);
    };

    /* ================= the coat: the torso's own surface wrapped in 7 mm of waxed cloth, flaring below the belt into the hem, with a standing collar ================= */
    const nt=Math.max(0.7,(D.headY-0.03)/TK), PROF=TORSO_M.concat([[D.neckR*1.3,0.572],[D.neckR*1.06,0.6],[D.neckR,0.635],[D.neckR*0.98,nt]]);
    // [half-width, front depth, back depth, centre offset] of the torso at design height yd (torsoSize below the neck; the neck's own section above, as the body's lathe is made)
    const body=yd=>{ if(yd<=0.5){ const s=torsoSize(X,D,yd); return [s.rx,s.rz,s.rzBack,0]; }
      const sN=sm(0.5,0.6,yd), up=sm(0.22,0.4,yd)*(1-sN), r=profR(PROF,yd), rz=r*lerp(0.62*B,0.94,sN)*(1+(S.shoulders-1)*0.2*up);
      return [r*lerp(B*1.04,1.1,sN)*(1+(S.shoulders-1)*up),rz,rz,-sN*(yd-0.5)*0.1]; };
    const HEM=-0.082, yTop=phi=>0.668-0.098*Math.exp(-Math.pow(phi/0.72,2));
    const mgAt=yd=>0.0075+0.0065*sm(0.5,0.58,yd)+0.011*sm(0.6,0.668,yd)+0.006*sm(0.07,0.0,yd);
    // a point on the coat's surface at design height yd (below 0: the flare under the hip), angle phi (0 front, + toward +x), `m` metres further out
    const coatPt=(yd,phi,m)=>{ const k=Math.max(0,-yd*TK), b=body(Math.max(yd,0)), c=Math.cos(phi), s=Math.sin(phi), mg=mgAt(yd)+(m||0), rx=b[0]+mg+0.34*k, rz=(c>0?b[1]:b[2])+mg+0.3*k, e=1-0.5*sm(0.0,0.07,k);   // e < 1 squares the section toward the hem, where the tails (squarer) take over
      return [rx*Math.sign(s)*Math.pow(Math.abs(s),e),yd*TK,b[3]-rz*Math.sign(c)*Math.pow(Math.abs(c),e)]; };
    const ydAt=(u,phi)=>u<0.3?lerp(yTop(phi),0.5,u/0.3):u<0.86?lerp(0.5,0,(u-0.3)/0.56):lerp(0,HEM,(u-0.86)/0.14);
    const SHU=[]; for(let i=0;i<6;i++) SHU.push(i*0.06); for(let i=1;i<=14;i++) SHU.push(0.3+i*0.56/14); SHU.push(0.91,0.955,1);
    const shellG=()=>{ const g=grid(SHU,sg(38),(u,v)=>{ const phi=-Math.PI+v*TAU; return coatPt(ydAt(u,phi),phi,0); },(x,y,z)=>[x,0,z]);
      return finish(g,(u,v,x,y,z,c)=>{ const yd=y/TK; c.copy(cC); c.lerp(cCl,0.55*sm(0.2,0.5,yd)*(0.6+0.4*Math.max(0,-z*8))); if(yd<0.0) c.lerp(cCd,0.5*clamp(-yd/0.08)); if(yd>0.56) c.lerp(cCl,0.35); }); };
    // the waist seam at the coat's hem: a leather welt that hides where the tails slide out from under the body of the coat
    const hemSeam=()=>{ const P=[], n=sg(28); for(let i=0;i<=n;i++) P.push(coatPt(HEM+0.002,-Math.PI+i/n*TAU,0.0012)); return tube(P,0.0032,LEATHER_L,n); };
    const collarLining=()=>{ const us=[0,0.2,0.4,0.6,0.8,1], phiMax=Math.PI*0.97, g=grid(us,sg(22),(u,v)=>{ const phi=-phiMax+v*2*phiMax, yd=lerp(0.545,yTop(phi)-0.004,u); return coatPt(yd,phi,-0.0065); },(x,y,z)=>[-x,0,-z]);
      return finish(g,(u,v,x,y,z,c)=>{ c.copy(cVd); if(u>0.9) c.copy(cV); }); };
    const collarTop=()=>{ const P=[], n=sg(22), pm=Math.PI*0.97; for(let k=0;k<=n;k++){ const phi=-pm+k/n*2*pm; P.push(coatPt(yTop(phi)+0.0005,phi,0.001)); } return tube(P,0.0021,BRASS,n); };

    /* ================= the coat-tails: one flap on each leg, riding on the thigh (the upper) and the shin (the lower) ================= */
    const HIN=hx-0.0015, GAPMAX=0.38*hx, TOTAL=D.thigh+HEMT*D.shin;   // the tails part toward the hem: a V of lining between the legs
    // the point of a flap at row u (down the leg) and column v (0 = the back edge, 1 = the front edge, the outer side in the middle); AT is the leg's section, len the segment's length
    const flapPt=(sd,AT,len,s0,s1,m0,m1,pw,off)=>(u,v)=>{
      const s=lerp(s0,s1,u), q=AT(s/len), m=lerp(m0,m1,Math.pow(u,pw||1)), ax=q[0]+m, bz=q[1]+m, hin=HIN-GAPMAX*sm(0.45,1.0,(s+(off||0))/TOTAL), wx=(ax+hin)/1.4, phi=lerp(-PHI,PHI,v), cp=Math.cos(phi), sp=Math.sin(phi);
      const X=Math.sign(cp)*Math.pow(Math.abs(cp),SQ), Z=Math.sign(sp)*Math.pow(Math.abs(sp),SQ);
      return [sd*(ax-wx*(1-X)),-s,q[2]-bz*Z]; };
    const rowsU=(n,edges)=>{ const r=[]; for(let i=0;i<=n;i++) r.push(i/n); for(const e of edges||[]) r.push(e-0.0012,e+0.0012); return r.sort((a,b)=>a-b); };
    const pipe=(P,u0,u1,n,rad,hex)=>{ const pts=[]; for(let i=0;i<=n;i++) pts.push(P(lerp(u0,u1,i/n))); return tube(pts,rad,hex,n); };
    const clothFlap=(sd,AT,len,s0,s1,m0,m1,pw,off,rows,nv,colFn,inFn)=>{
      const P=flapPt(sd,AT,len,s0,s1,m0,m1,pw,off), out=(x,y,z)=>[x,0,z-0.0], g=grid(rows,nv,P,out), half=grid(rows.filter((r,i)=>i%2===0||i===rows.length-1),Math.max(8,nv>>1),P,out);
      return [finish(g,colFn),finish(lining(half,0.004),inFn||((u,v,x,y,z,c)=>c.copy(cVd)))]; };
    // the upper tail (hip frame): hangs from the belt to the knee
    const UP0=-0.02, UP1=D.thigh;
    const upperFlap=sd=>{ const rows=rowsU(sg(10));
      const parts=clothFlap(sd,TH,D.thigh,UP0,UP1,0.004,0.021,0.6,0,rows,sg(26),(u,v,x,y,z,c)=>{ c.copy(cC); c.lerp(cCl,0.3*(1-u)*(0.5+0.5*Math.max(0,-z*9))); if(v<0.03||v>0.97) c.lerp(cCd,0.5); });
      const P=flapPt(sd,TH,D.thigh,UP0,UP1,0.004,0.021,0.6,0);
      parts.push(pipe(u=>P(u,1),0.25,1,sg(9),0.0016,BRASS),pipe(u=>P(u,0),0.25,1,sg(9),0.0016,LEATHER_L));
      // the coat's buttons go on down the front of each tail
      for(const [uu,tone] of [[0.43,BRASS_L],[0.65,VERD],[0.87,BRASS_L]]){ const p=P(uu,0.93); parts.push(stud(p[0],p[1],p[2],0,tone,0.0078)); }
      return parts; };
    // the lower tail (knee frame): from a leather knee band to the hem, a little wider than the upper's hem so it overlaps it on the outside
    const LO0=-0.03, LO1=HEMT*D.shin, BANDU=0.2, HEMU=0.88;
    const lowerFlap=sd=>{ const rows=rowsU(sg(6),[BANDU,HEMU,0.97]);
      const parts=clothFlap(sd,SH,D.shin,LO0,LO1,0.029,0.056,1.5,D.thigh,rows,sg(24),(u,v,x,y,z,c)=>{ c.copy(cC); c.lerp(cCl,0.22*(1-u)*(0.5+0.5*Math.max(0,-z*9)));
        if(u<BANDU) { c.copy(cLe); c.lerp(cLl,0.25*(0.5+0.5*Math.max(0,-z*9))); } else if(u>HEMU) { c.copy(cVd); c.lerp(cV,0.35); }
        if(v<0.03||v>0.97) c.lerp(cCd,0.5); },(u,v,x,y,z,c)=>{ c.copy(cVd); });
      const P=flapPt(sd,SH,D.shin,LO0,LO1,0.029,0.056,1.5,D.thigh);
      parts.push(pipe(u=>P(u,1),BANDU,1,sg(6),0.0016,BRASS),pipe(u=>P(u,0),BANDU,1,sg(6),0.0016,LEATHER_L));
      for(const [uu,tone] of [[0.42,BRASS_L],[0.7,VERD]]){ const p=P(uu,0.93); parts.push(stud(p[0],p[1],p[2],0,tone,0.0078)); }
      for(const uu of [1,HEMU]){ const pts=[]; for(let i=0;i<=sg(14);i++) pts.push(P(uu,0.03+0.94*i/sg(14))); parts.push(tube(pts,uu===1?0.0021:0.0016,uu===1?BRASS:BRASS_L,sg(18))); }
      // the knee band's buckle: a brass plate with a leather tongue, on the front
      { const p=P(0.1,0.78), q=P(0.1,0.74); parts.push(pc(vbox(0.026,0.026,0.0042,p[0],p[1],p[2]-0.0016),(x,y,z,c)=>{ c.copy(cB); if(Math.abs(x-p[0])<0.0085&&Math.abs(y-p[1])<0.0085) c.copy(cLd); }));
        parts.push(solid(vbox(0.0036,0.021,0.0052,p[0],p[1],p[2]-0.0026),BRASS_L)); }
      return parts; };

    /* ================= the front of the coat: closing line, two rows of buttons, pockets, the belt with its ruler and buckle, tape and pencil ================= */
    // the coat's front surface z at sideways x and design height yd, m metres further out
    const frontZ=(x,yd,m)=>{ const b=body(yd), mg=mgAt(yd)+(m||0), rx=b[0]+mg, rz=b[1]+mg; return b[3]-rz*Math.sqrt(Math.max(0,1-Math.pow(x/rx,2))); };
    const slopeAt=(x,yd,m)=>Math.atan((frontZ(x+0.003,yd,m)-frontZ(x-0.003,yd,m))/0.006);
    const BELT0=0.108, BELT1=0.168, BM=0.0057, BY=0.138;
    const button=(x,yd,tone)=>[stud(x,yd*TK,frontZ(x,yd,0.0006),slopeAt(x,yd,0.0006),tone)];
    const buttons=()=>{ const out=[]; let k=0;
      for(const sx of [-1,1]) for(const yd of [0.462,0.395,0.327,0.258,0.19,0.062]){ k++; const verd=(sx>0&&(yd===0.395||yd===0.19))||(sx<0&&yd===0.327); out.push(...button(sx*0.052,yd,verd?VERD:BRASS_L)); }
      return out; };
    // the closing line: a brass piping from the hem to the collar's notch
    const closing=()=>{ const P=[], n=sg(20); for(let i=0;i<=n;i++){ const yd=lerp(0.0,0.585,i/n); P.push([0,yd*TK,frontZ(0,yd,0.0012)]); } return tube(P,0.0017,BRASS,n); };
    // a pocket flap on the coat: a lighter patch with a dark top seam, a leather edge below and a button
    const pocket=(cx,yd,w,h,btn)=>{ const out=[], nx=sg(8), ny=3, y0=yd*TK-h/2, y1=yd*TK+h/2, m=0.0012;
      out.push(pc(ofPatch(cx-w/2,cx+w/2,y0,y1,nx,ny,(x,y)=>frontZ(x,y/TK,m),true),(x,y,z,c)=>{ c.copy(cCl); if(y>y1-0.0045) c.copy(cCd); if(y<y0+0.003) c.copy(cLl); c.lerp(cC,0.2); }));
      const P=[]; for(let i=0;i<=5;i++){ const x=lerp(cx-w/2,cx+w/2,i/5); P.push([x,y0,frontZ(x,y0/TK,m+0.0008)]); } out.push(tube(P,0.0017,LEATHER_L,sg(8)));
      if(btn) out.push(...button(cx,yd-h*0.1/TK,BRASS_L).map(g=>g)); return out; };
    const belt=()=>{ const us=[0,0.07,0.93,1], g=grid(us,sg(40),(u,v)=>{ const phi=-Math.PI+v*TAU, yd=lerp(BELT0,BELT1,u); return coatPt(yd,phi,[0.0016,BM,BM,0.0016][us.indexOf(u)]); },(x,y,z)=>[x,0,z]);
      return finish(g,(u,v,x,y,z,c)=>{ c.copy(cLe); if(u<0.1||u>0.9) c.copy(cLd); else c.lerp(cLl,0.18); }); };
    // the ruler: a brass strip across the belt with an engraved tick every centimetre and a long one every five
    const ruler=sd=>{ const x0=sd>0?0.027:-0.103, x1=x0+0.076, nx=sg(26), ny=3, y0=BY*0+(BELT0+0.014)*TK, y1=(BELT1-0.014)*TK, sx=(x1-x0)/nx, per=Math.round(0.01/sx);
      return pc(ofPatch(x0,x1,y0,y1,nx,ny,(x,y)=>frontZ(x,y/TK,BM+0.0014),true),(x,y,z,c)=>{ const k=Math.round((x-x0)/sx), t=(y-y0)/(y1-y0); c.copy(cB); c.lerp(cBl,0.35*t);
        if(k%per===0&&(t>0.5||k%(per*5)===0)) c.copy(cLd); }); };
    const buckle=()=>{ const z=frontZ(0,BY,BM+0.003), out=[]; const bx=(w,h,x,y,hex)=>out.push(solid(vbox(w,h,0.0065,x,y,z),hex));
      bx(0.04,0.0058,0,BY*TK+0.0148,BRASS); bx(0.04,0.0058,0,BY*TK-0.0148,BRASS); bx(0.0058,0.036,-0.0171,BY*TK,BRASS); bx(0.0058,0.036,0.0171,BY*TK,BRASS_D);
      out.push(solid(vbox(0.0034,0.03,0.0042,0.003,BY*TK,z-0.0028),BRASS_L)); out.push(solid(vbox(0.0058,0.0058,0.0068,-0.0171,BY*TK-0.0148,z-0.0003),VERD));
      return out; };
    // the tape-measure: a brass case on a leather strap under the belt on the left, with a strip of white tape and its black ticks hanging from it
    const tape=()=>{ const out=[], cx=-0.074, yd=0.082, z=frontZ(cx,yd,0.02)-0.003, r=0.0265, th=0.0135, fz=Math.atan((frontZ(cx+0.003,yd,0.02)-frontZ(cx-0.003,yd,0.02))/0.006);
      const caseG=new THREE.CylinderGeometry(r,r,th,sg(28)).rotateX(Math.PI/2).rotateY(-fz).translate(cx,yd*TK,z);
      out.push(pc(caseG,(x,y,zz,c)=>{ const rr=Math.hypot(x-cx,y-yd*TK); c.copy(cB); if(zz<z-th*0.3) { c.copy(cBl); if(rr>r*0.78) c.copy(cBd); else if(rr<r*0.3) c.copy(cV); else if(rr>r*0.55&&rr<r*0.62) c.copy(cBd); } }));
      const sz=frontZ(cx,BELT0,BM+0.001)-0.0008;
      out.push(pc(vbox(0.011,0.032,0.0034,cx,yd*TK+0.03,sz+0.0003),(x,y,zz,c)=>c.copy(cLe)));
      out.push(solid(ofRingAt([cx,yd*TK+0.0155,z-th*0.2],[0,0,1],0.0036,0.0012,sg(5)),BRASS_L));
      out.push(pc(ofRibbon([[cx+0.012,yd*TK-r*0.7,z-0.006],[cx+0.014,yd*TK-r*0.7-0.03,z-0.008],[cx+0.014,yd*TK-r*0.7-0.062,z-0.006]],0.013,{up:[0,0,-1],seg:sg(16),th:0.0016}),(x,y,zz,c)=>{ c.copy(ofCol(LAMP)); const t=-(y-(yd*TK-r*0.7))*1000; if(((t%3)+3)%3<0.9) c.copy(cLd); if(((t%15)+15)%15<1.2) c.copy(cLd); }));
      return out; };
    // a brass pencil with a verdigris cap in the left breast pocket
    const pencil=()=>{ const cx=-0.066, yd=0.352, z=frontZ(cx,yd,0.003), f=slopeAt(cx,yd,0.003);
      return [pc(new THREE.CylinderGeometry(0.0034,0.0034,0.058,sg(6)).rotateZ(0.14).translate(cx+0.004,yd*TK+0.018,z-0.003),(x,y,zz,c)=>{ c.copy(cB); if(y>yd*TK+0.036) c.copy(cV); })]; };
    // the cravat: a folded stock of lamp-white linen in the collar's notch, held by a brass pin with a verdigris stone
    const cravat=()=>{ const us=[0,0.25,0.5,0.75,1], out=[];
      const P=(u,v)=>{ const yd=lerp(0.628,0.526,u), pw=lerp(0.62,0.04,Math.pow(u,0.8)), phi=(v*2-1)*pw, m=lerp(0.0035,-0.0105,sm(0.578,0.608,yd))+0.0022*Math.sin(v*Math.PI*5+u*2.6)*(0.4+0.6*u)+0.004*u*(1-u)*2; return coatPt(yd,phi,m); };
      out.push(finish(grid(us,sg(12),P,(x,y,z)=>[x,0,-1]),(u,v,x,y,z,c)=>{ c.set(0xece3c8); c.multiplyScalar(0.84+0.2*Math.sin(v*Math.PI*5+u*2.6)*0.5+0.1); if(u>0.92) c.multiplyScalar(0.8); }));
      const z=frontZ(0,0.553,0.0075); out.push(solid(csph(0.0046,sg(8),sg(6)).translate(0,0.553*TK,z),BRASS_L),solid(csph(0.0022,5,4).translate(0,0.553*TK,z-0.0036),VERD));
      return out; };
    // the back: a centre seam, a yoke seam over the shoulder blades, a half-belt with two buttons and a brass D-ring, and a vent edge below
    const backBits=()=>{ const out=[], n=sg(12), P=[], Y=[];
      for(let i=0;i<=n;i++){ P.push(coatPt(lerp(0.5,BELT1+0.002,i/n),Math.PI,0.0012)); const f=i/n*2-1, phi=Math.PI+f*1.18; Y.push(coatPt(0.39-0.03*f*f,phi,0.0012)); }
      out.push(tube(P,0.0016,LEATHER_L,sg(14)),tube(Y,0.0016,LEATHER_L,sg(14)));
      for(const e of [-1,1]){ const phi=Math.PI+e*0.33, p=coatPt(BY,phi,BM+0.0015), nx=Math.sin(phi), nz=-Math.cos(phi), g=new THREE.CylinderGeometry(0.0092,0.0098,0.0048,sg(8)).rotateX(Math.PI/2).rotateY(Math.atan2(nx,nz)).translate(p[0],p[1],p[2]);
        out.push(pc(g,(x,y,z,c)=>{ c.copy(cBd); if(Math.hypot(x-p[0],z-p[2])<0.0058&&y>p[1]-0.0045) c.lerp(cBl,0.7); })); }
      { const p=coatPt(BY,Math.PI,BM+0.002); out.push(solid(ofRingAt([p[0],p[1],p[2]+0.0],[0,0,1],0.0105,0.0021,5),BRASS)); }
      return out; };

    /* ================= the arms ================= */
    // a short open cone of leather with a measuring band at its lower edge: a cuff
    const cuff=(sd)=>{ const out=[], ra=0.0265*aw, rb=0.0225*aw, y0=-0.178, y1=-0.236;
      out.push(pc(new THREE.CylinderGeometry(ra+0.004,rb+0.0045,y0-y1,sg(20),1,true).translate(0,(y0+y1)/2,0),(x,y,z,c)=>{ c.copy(cLe); c.lerp(cLl,0.2*(0.5+0.5*clamp(-z*14))); }));
      out.push(solid(ring(y0,ra+0.0045,ra+0.0045,0,0.0024,sg(14)),BRASS));
      out.push(tickBand(rb+0.0058,0.0075,sg(40),y1+0.0035,3,5,1,1,0));
      out.push(solid(ring(y1-0.0035,rb+0.0016,rb+0.0016,0,0.0032,sg(14)),0xece3c8));   // a linen shirt cuff showing under the leather
      { const bz=-(ra+0.0075); out.push(solid(vbox(0.0125,0.016,0.0045,sd*0.002,(y0+y1)/2+0.004,bz),BRASS)); out.push(solid(vbox(0.0058,0.009,0.0052,sd*0.002,(y0+y1)/2+0.004,bz-0.0004),LEATHER_D)); }
      return out; };
    // the shoulder: a leather cap with a brass measuring band at its rim and a brass button
    const epaulet=(sd)=>{ const r=0.06*aw, out=[];
      out.push(pc(new THREE.SphereGeometry(r,sg(14),sg(7),0,TAU,0,Math.PI*0.5).scale(1.03,1.0,1.08).translate(0,0.004,0),(x,y,z,c)=>{ c.copy(cLe); c.lerp(cLl,0.25*clamp(y*18)); if(Math.abs(x)<0.0045) c.copy(cLd); }));
      out.push(tickBand(r*1.03+0.0012,0.0085,sg(44),0.0085,3,5,1,1.05,0));
      out.push(solid(csph(0.0058,sg(8),sg(6)).scale(1,0.7,1).translate(0,0.004+r*1.0,0),BRASS_L));
      return out; };

    /* ================= the legs: straps on the leggings, boots with a cuff, toe cap, welt sole with hobnails and a stirrup heel ================= */
    const A=D.ankleH, sf=S.feet, wf=0.55+0.45*sf, hf=0.8+0.2*sf;
    const PLAN=[[0.056,0.004],[0.047,0.02],[0.026,0.029],[0.0,0.031],[-0.03,0.033],[-0.075,0.037],[-0.115,0.031],[-0.14,0.018],[-0.153,0.004]];   // the foot's plan from the heel to the toe (the base model's own table)
    const outline=(off)=>PLAN.map(([s,x])=>[x*wf+off,s*sf+(s>0?off:s<-0.1?-off:0)]);   // the sole's plan, off metres wider
    const shoeParts=(sd)=>{ const out=[], yb=-D.shin-A, yaw=-sd*0.1;
      // the welt: a heavy leather sole slab round the foot's plan, wider than the upper, with a lighter stitched top edge
      const pl=outline(0.0042), shp=new THREE.Shape(); shp.moveTo(pl[0][0]*0+0.0,pl[0][1]+0.003);
      for(let i=0;i<pl.length;i++) shp.lineTo(pl[i][0],pl[i][1]); for(let i=pl.length-2;i>=1;i--) shp.lineTo(-pl[i][0],pl[i][1]); shp.lineTo(0,pl[0][1]+0.003);
      const wg=new THREE.ExtrudeGeometry(shp,{depth:0.0115,bevelEnabled:false,curveSegments:4}); wg.rotateX(Math.PI/2); wg.rotateY(yaw); wg.translate(0,yb+0.0115,0);
      out.push(pc(wg,(x,y,z,c)=>{ c.copy(cLd); if(y>yb+0.0085) c.copy(cLl); else if(y<yb+0.002) c.set(0x120f0b); }));
      // 12 hobnails along the welt's edge
      for(let i=0;i<12;i++){ const f=i/11, k=f*(PLAN.length-2)+0.5, a=PLAN[Math.min(PLAN.length-1,Math.floor(k))], b=PLAN[Math.min(PLAN.length-1,Math.floor(k)+1)], q=k-Math.floor(k), s=lerp(a[0],b[0],q)*sf, xx=lerp(a[1],b[1],q)*wf+0.0058;
        for(const e of (i===0||i===11?[1]:[-1,1])){ const g=csph(0.0032,sg(6),sg(4)).scale(1,0.9,1).translate(e*xx,yb+0.0058,s); g.rotateY(yaw); out.push(solid(g,i%4===1?BRASS_L:BRASS)); } }
      // the stirrup heel plate: a steel-brass U round the heel with a tab up the back
      { const P=[]; for(const [s,x] of PLAN.slice(0,4).reverse()) P.push([x*wf+0.0068,yb+0.0058,s*sf+(s>0?0.0058:0)]); for(const [s,x] of PLAN.slice(1,4)) P.push([-(x*wf+0.0068),yb+0.0058,s*sf+(s>0?0.0058:0)]);
        const pts=[]; for(const [x,y,z] of P) pts.push([x,y,z]); const g=sweepTube(pts,[0.0034,0.0034],sg(5),{cap:'round',rings:sg(24)}); g.rotateY(yaw); out.push(solid(g,BRASS_D));
        const tab=vbox(0.014,0.026,0.0042,0,yb+0.0155,PLAN[0][0]*sf+0.0055).rotateY(yaw); out.push(pc(tab,(x,y,z,c)=>{ c.copy(cBd); if(y>yb+0.021) c.copy(cV); })); }
      // the toe cap: a brass shell over the foot's toe, its rim a dark band
      { const rows=[[-0.09,0],[-0.1,0],[-0.115,0],[-0.128,0],[-0.14,0],[-0.15,0],[-0.1535,0]], rings=[];
        const tab=[[-0.075,0.037,0.027,0.029],[-0.115,0.031,0.02,0.021],[-0.14,0.018,0.013,0.015],[-0.153,0.004,0.004,0.01]], at=s=>{ for(let i=1;i<tab.length;i++) if(s>=tab[i][0]){ const a=tab[i-1], b=tab[i], f=(s-a[0])/((b[0]-a[0])||1); return [lerp(a[1],b[1],f),lerp(a[2],b[2],f),lerp(a[3],b[3],f)]; } return tab[tab.length-1].slice(1); };
        for(const [s] of rows){ const q=at(s); rings.push({y:s*sf,rx:q[0]*wf+0.0016,rz:q[1]*hf+0.0016,zc:-(q[2]*hf-A)}); }
        const g=loftRings(rings,sg(20)); g.rotateX(Math.PI/2); g.rotateY(yaw); const p=g.attributes.position; for(let i=0;i<p.count;i++) if(p.getY(i)<-A+0.0115) p.setY(i,-A+0.0115); smoothN(g);
        out.push(pc(g.translate(0,-D.shin,0),(x,y,z,c)=>{ c.copy(cB); c.lerp(cBl,0.5*clamp((y+D.shin+A-0.02)*30)); if(z>-0.096*sf&&z<-0.088*sf) c.copy(cBd); if(y<-D.shin-A+0.014) c.copy(cBd); })); }
      return out; };
    const legBits=(sd)=>{ const out=[];
      // two brass-buckled straps on the leggings, and the boot's cuff: a rolled leather ring with a measuring band and a buckle
      for(const t of [0.535,0.625]){ const q=SH(t), y=-t*D.shin, rx=q[0]+0.0022, rz=q[1]+0.0022;
        out.push(pc(new THREE.CylinderGeometry(1,1,0.0125,sg(22),1,true).scale(rx,1,rz).translate(0,y,q[2]),(x,yy,z,c)=>{ c.copy(cLl); c.lerp(cLe,0.35); }));
        out.push(solid(vbox(0.0125,0.0165,0.0046,sd*(rx*0.55),y,q[2]-rz-0.0022),BRASS)); out.push(solid(vbox(0.0062,0.01,0.0052,sd*(rx*0.55),y,q[2]-rz-0.0025),LEATHER_D)); }
      { const q=SH(BOOT), y=-BOOT*D.shin;
        out.push(pc(ring(y,q[0]+0.0045,q[1]+0.0045,q[2],0.0058,sg(28)),(x,yy,z,c)=>{ c.copy(cLl); c.lerp(cLe,0.3); }));
        out.push(tickBand(1,0.0075,sg(64),y-0.0085,3,5,q[0]+0.0034,q[1]+0.0034,q[2]));
        out.push(solid(vbox(0.015,0.019,0.005,sd*(q[0]*0.4),y-0.0085,q[2]-q[1]-0.0052),BRASS)); out.push(solid(vbox(0.0075,0.0115,0.0058,sd*(q[0]*0.4),y-0.0085,q[2]-q[1]-0.0055),LEATHER_D)); }
      // laces: three crossings over the instep, with brass eyelets either side
      for(const t of [0.8,0.865,0.93]){ const q=SH(t), y=-t*D.shin, zf=q[2]-q[1]-0.0012, w=q[0]*0.55, dy=0.0125;
        out.push(solid(sweepTube([[-w,y+dy,zf+0.0014],[0,y,zf-0.0012],[w,y-dy,zf+0.0014]],[0.0016,0.0016,0.0016],4,{cap:'round',rings:sg(8)}),LEATHER_L));
        out.push(solid(sweepTube([[w,y+dy,zf+0.0014],[0,y,zf-0.0013],[-w,y-dy,zf+0.0014]],[0.0016,0.0016,0.0016],4,{cap:'round',rings:sg(8)}),LEATHER_L));
        for(const e of [-1,1]){ out.push(solid(new THREE.CylinderGeometry(0.0034,0.0034,0.0022,sg(8)).rotateX(Math.PI/2).translate(e*w,y+e*dy,zf+0.0004),BRASS_L)); } }
      out.push(...shoeParts(sd));
      return out; };

    /* ================= the head: a surveyor's cap (leather gores with brass welts, a verdigris band engraved with ticks, a stiff brim, rolled ear flaps) with a hooded brass lamp ================= */
    const CR=0.127, TILT=0.14, AIM=0.1, LIFT=0.011, X3=new V3(1,0,0);
    const LAMP_AT=(F)=>{ const q=new V3(...F.T.sp(0,0.352*Math.PI,CR-0.004)).applyAxisAngle(X3,TILT); return [q.x*F.fs[0],q.y*F.fs[1]+LIFT,q.z]; };
    // the lamp's parts in its own frame (+z toward the cap, -z the way it shines): lit = brass, glow = the lens and a small star of rays
    const lampParts=()=>{ const lit=[], glow=[], zb=-0.0355, RB=0.0185;
      lit.push(pc(ofPatch(-0.026,0.026,-0.026,0.026,sg(7),sg(7),()=>0.0004,true),(x,y,z,c)=>{ c.copy(cBd); const d=Math.hypot(Math.abs(x)-0.0185,Math.abs(y)-0.0185); if(d<0.0046) c.copy(cBl); c.lerp(cV,clamp(0.55*clamp(-y*30)*(0.4+(noise2(x*140,y*140)))-0.1)); }));
      lit.push(solid(new THREE.CylinderGeometry(0.0115,0.0135,0.012,sg(10)).rotateX(Math.PI/2).translate(0,0,-0.006),BRASS_D));
      lit.push(pc(new THREE.CylinderGeometry(RB,RB,0.021,sg(16)).rotateX(Math.PI/2).translate(0,0,-0.0225),(x,y,z,c)=>{ c.copy(cB); c.lerp(cBl,0.3*clamp(y*40)); c.lerp(cV,0.6*clamp((z+0.0215)*-80)); }));
      lit.push(solid(ring(0,0.0195,0.0195,0,0.0021,sg(14)).rotateX(Math.PI/2).translate(0,0,-0.0125),BRASS_D));
      lit.push(pc(new THREE.CylinderGeometry(0.0238,0.0238,0.0235,sg(14),1,true,Math.PI/2,Math.PI).rotateX(Math.PI/2).translate(0,0.0006,-0.0225),(x,y,z,c)=>{ c.copy(cBd); c.lerp(cB,0.4*clamp(y*30)); }));
      for(const zz of [-0.0145,-0.0225,-0.0305]) lit.push(solid(vbox(0.027,0.0014,0.0036,0,0.0243,zz),LEATHER_D));
      lit.push(solid(new THREE.TorusGeometry(0.0176,0.0027,4,sg(20)).translate(0,0,zb),BRASS_L));
      lit.push(solid(new THREE.CylinderGeometry(0.0032,0.0032,0.015,5).rotateZ(Math.PI/2).translate(0,0.0198,zb+0.002),BRASS_D));   // the lens's hinge
      glow.push(pc(new THREE.CylinderGeometry(0.0165,0.0165,0.0034,sg(18)).rotateX(Math.PI/2).translate(0,0,zb+0.0004),(x,y,z,c)=>{ c.set(LAMP); c.lerp(ofCol(0xffffff),0.7*clamp(1-Math.hypot(x,y)/0.0165)); }));
      for(let i=0;i<8;i++){ const a=i*TAU/8+0.2, L=i%2?0.016:0.027, dx=Math.cos(a), dy=Math.sin(a);
        glow.push(pc(ofRibbon([[dx*0.011,dy*0.011,zb-0.0034],[dx*(0.011+L*0.5),dy*(0.011+L*0.5),zb-0.0034],[dx*(0.011+L),dy*(0.011+L),zb-0.0034]],u=>0.0062*(1-u)+0.0005,{up:[0,0,-1],seg:4,th:0.0008}),(x,y,z,c)=>{ c.set(LAMP); c.multiplyScalar(0.92); })); }
      return {lit,glow}; };
    const lampXf=(F,g)=>{ const p=LAMP_AT(F); return g.rotateX(AIM).translate(p[0],p[1],p[2]); };
    const cap=(F,T)=>{ F.T=T; const fs=F.fs, out=[], sp=T.sp, onCrown=(th,ph,r)=>{ const q=new V3(...sp(th,ph,r)).applyAxisAngle(X3,TILT); return [q.x*fs[0],q.y*fs[1],q.z]; };
      // the crown: six gores, each a shade apart, sewn with brass welts
      { const g=pc(shell(CR,0,0.47*Math.PI,0,0,sg(40),sg(14)),(x,y,z,c)=>{ const a=Math.atan2(x,-z), sec=Math.floor((a+Math.PI*7/6)/(Math.PI/3))%6; c.copy(cLe); c.multiplyScalar(sec%2?1.12:0.92); c.lerp(cLl,0.28*clamp((y-0.025)*8)); }); g.rotateX(TILT); out.push(T.fit(g)); }
      for(let k=0;k<6;k++){ const th=Math.PI/6+k*Math.PI/3, P=[]; for(let j=0;j<=6;j++) P.push(sp(th,lerp(0.012,0.466,j/6)*Math.PI,CR+0.0014));
        const g=sweepTube(P,[0.0016,0.0016],4,{cap:'round',rings:7}); g.rotateX(TILT); out.push(solid(T.fit(g),BRASS_D)); }
      { const b=onCrown(0,0,CR+0.003); out.push(solid(new THREE.CylinderGeometry(0.0125,0.0135,0.004,sg(10)).translate(b[0],b[1]-0.0005,b[2]),VERD)); out.push(solid(csph(0.0105,sg(8),5).scale(1,0.62,1).translate(b[0],b[1]+0.0022,b[2]),BRASS_L)); }
      // the band: verdigris leather engraved with a brass tick every few millimetres, a long one every fifth, a brass piping on its rim
      { const N=sg(72), ym=(CR+0.0024)*Math.cos(0.4383*Math.PI)-0.0005, g=pc(shell(CR+0.0024,0.405*Math.PI,0.0666*Math.PI,0,0,N,2),(x,y,z,c)=>{ const k=Math.round((Math.atan2(x,-z)+Math.PI)/TAU*N)%N, hi=y>ym, tk=k%3===0; c.copy(cV); if(tk&&(hi||k%15===0)) c.copy(cBl); else if(!hi) c.multiplyScalar(0.9); });
        g.rotateX(TILT); out.push(T.fit(g));
        const P=[]; for(let j=0;j<=sg(26);j++) P.push(onCrown(j/sg(26)*TAU,0.4722*Math.PI,CR+0.003)); out.push(tube(P,0.0023,BRASS,sg(30))); }
      // the brim: a stiff half-ellipse drooping a little, a brass edge
      { const rim=onCrown(0,0.47*Math.PI,CR), yb=rim[1]-0.004, zc=rim[2]+0.044, ax=0.12*fs[0], az=0.078, ang=-0.1;
        out.push(pc(new THREE.CylinderGeometry(1,1,0.0062,sg(26),1,false,Math.PI/2,Math.PI).scale(ax,1,az).rotateX(ang).translate(0,yb,zc),(x,y,z,c)=>{ const top=(y-yb)>-0.0004+(z-zc)*0.2, r=clamp(Math.hypot(x/ax,(z-zc)/az)); c.copy(top?cLl:cLd); if(top) c.lerp(cLe,0.4*(1-r)); }));
        const P=[]; for(let j=0;j<=sg(22);j++){ const a=Math.PI/2+j/sg(22)*Math.PI, q=new V3(ax*Math.sin(a),0,az*Math.cos(a)).applyAxisAngle(X3,ang); P.push([q.x,q.y+yb,q.z+zc]); }
        out.push(tube(P,0.0026,BRASS,sg(26))); }
      // the ear flaps: rolled leather against the cap's sides, tied with a verdigris strap and a brass button
      for(const sd of [-1,1]){ const cx=sd*(0.1185+0.0105)*fs[0], cy=0.03*fs[1], cz=0.024, rr=0.0112, len=0.046;
        out.push(pc(new THREE.CylinderGeometry(rr,rr,len,sg(12)).rotateX(Math.PI/2).translate(cx,cy,cz),(x,y,z,c)=>{ c.copy(cLl); c.lerp(cLe,0.4*clamp((cy-y)*50+0.5)); }));
        const zz=cz-len/2-0.0004; out.push(solid(new THREE.CylinderGeometry(rr,rr,0.0014,sg(12)).rotateX(Math.PI/2).translate(cx,cy,zz),LEATHER_L)); out.push(solid(new THREE.CylinderGeometry(rr*0.66,rr*0.66,0.0016,sg(10)).rotateX(Math.PI/2).translate(cx,cy,zz-0.0004),LEATHER_D)); out.push(solid(new THREE.CylinderGeometry(rr*0.3,rr*0.3,0.0018,6).rotateX(Math.PI/2).translate(cx,cy,zz-0.0008),LEATHER_L));
        out.push(solid(ring(0,rr+0.0012,rr+0.0012,0,0.0026,sg(12)).rotateX(Math.PI/2).rotateY(Math.PI/2).translate(cx,cy,cz+0.002),VERD));
        out.push(solid(new THREE.CylinderGeometry(0.0044,0.0044,0.003,6).rotateZ(Math.PI/2).translate(cx+sd*(rr+0.0014),cy,cz+0.002),BRASS_L)); }
      for(const g of out) g.translate(0,LIFT,0);
      // the lamp
      { const lp=lampParts(); out.push(...lp.lit.map(g=>lampXf(F,g))); lampGlow=lp.glow.map(g=>lampXf(F,g)); }
      return out; };

    /* ================= the hair: silver, combed back in soft waves; a toothed skirt of hair at the back under the cap, two swept locks over each temple, a short tied tail at the nape ================= */
    const hair=(F,T)=>{ const R=T.R, hl=T.hl, out=[], pal=(x,y,z,c)=>{ T.hp(x,y,z,c); const w=Math.sin(Math.atan2(x,-z)*13+y*34)*0.5+0.5; c.lerp(ofCol(0xdedad2),0.24*w*clamp(y*14+0.6)); if(y<-0.03) c.multiplyScalar(0.84); };
      T.add(T.fit(shell(0.112,0,0.4*Math.PI,0,0.22,sg(24),sg(8))),pal);
      // the skirt: a shell over the back of the head whose lower edge runs high over the ears and down to the nape, cut into teeth
      { const g=shell(0.118+0.03*(T.hv-1),0.34*Math.PI,0.4*Math.PI,3.2,0,sg(36),sg(8)), p=g.attributes.position, p0=0.34*Math.PI, tl=0.4*Math.PI;
        for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), rr=Math.hypot(x,y,z), pol=Math.acos(clamp(y/rr,-1,1)), t=(pol-p0)/tl, az=Math.atan2(x,z), bf=smoothstep(0,1,clamp(1-Math.abs(az)/1.45));
          const tooth=Math.abs((((az/TAU*18)%1)+1)%1*2-1), pe=lerp(0.585*Math.PI,0.745*Math.PI,bf), pol2=p0+t*(pe-p0)+smoothstep(0.7,1,t)*(1-tooth)*0.07, w=(1+0.012*Math.sin(az*9)), hz=Math.hypot(x,z)||1;
          const gr=1+0.07*smoothstep(0.45,0.72,pol2/Math.PI);   // the hair thickens toward its lower edge so it clears the cheek and jaw
          p.setXYZ(i,x/hz*rr*gr*Math.sin(pol2)*w,rr*Math.cos(pol2),z/hz*rr*gr*Math.sin(pol2)*w); }
        smoothN(g); T.add(T.fit(g),pal); }
      for(const sd of [-1,1]) for(let i=0;i<2;i++){ const th=sd*(1.0+0.2*i), ph0=(0.27+0.04*i)*Math.PI, ph1=(0.52+0.04*i)*Math.PI, sw=sd*(0.7-0.06*i), P=[];
        for(let k=0;k<=4;k++){ const f=k/4; P.push(T.sp(th+sw*f,lerp(ph0,ph1,f),R+0.004*Math.sin(f*Math.PI)+(0.0025+0.001*i)*f)); } P.push(T.sp(th+sw*1.15,ph1+0.07,R+0.003+0.0025));
        const g=sweepTube(P,[0.008,0.0125,0.013,0.008,0.0015],6,{cap:'point',rings:sg(10)}); T.flat(g,0.5); T.add(T.fit(g),pal); }
      // the tail: three tapered locks bound with a leather cord and a brass ring
      const len=0.025+0.045*hl; for(let i=0;i<3;i++){ const ox=(i-1)*0.0105, P=[[ox*0.7,-0.045,0.104],[ox,-0.07,0.114],[ox*1.1,-0.07-len*0.55,0.117],[ox*0.9,-0.07-len,0.112]];
        T.add(T.hang(sweepTube(P,[0.0105,0.0135,0.012,0.003],6,{cap:'point',rings:sg(8)})),pal); }
      out.push(solid(ofRingAt([0,-0.086,0.1175],[0,-1,0.08],0.0185,0.0027,5),LEATHER_D),solid(ofRingAt([0,-0.0805,0.1185],[0,-1,0.08],0.0195,0.0017,5),BRASS));
      return out; };

    /* ================= the face: a soot smudge, pressure marks from the spectacles, a light ring in each iris; round brass spectacles ================= */
    const mark=F=>{ const out=[], sk=F.skin.clone().multiplyScalar(0.8).getHex();
      out.push(solid(F.place(csph(1,sg(10),sg(6)).scale(0.0125,0.0075,0.0006).rotateZ(0.5),0.056,-0.03,0.0006),SOOT));
      out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.0058,0.0042,0.0005).rotateZ(-0.3),0.049,-0.036,0.0009),0x58504a));
      for(const sd of [-1,1]) out.push(solid(F.place(csph(1,sg(8),sg(6)).scale(0.0036,0.0056,0.0005),sd*0.0105,-0.0035,0.0007),sk));
      // the light ring of the iris: a thin pale ring at the iris edge, over each eye
      { const E=S.eyeSize*0.74, ex=0.046*S.eyeGap*F.fs[0], ey=(-0.002+0.012*S.eyeHeight)*HT, e1=0.92, hh=Math.min(1,0.84*1.05), rx=0.0185*E*e1*0.8, ry=0.0242*E*e1*hh*0.8;
        for(const sd of [-1,1]){ const P=[]; for(let k=0;k<=sg(14);k++){ const a=k/sg(14)*TAU, u=Math.cos(a)*rx, v=Math.sin(a)*ry-0.0008*E, w=1-Math.pow(u/(0.0185*E*e1),2)-Math.pow((v+0.0008*E)/(0.0242*E*e1*hh),2); P.push([u,v,-0.0046-0.0052*Math.sqrt(Math.max(0,w))-0.0007]); }
          out.push(F.place(tube(P,0.0008,0xf2f6f8,sg(16)).rotateZ(sd*(0.06+0.3*(S.eyeTilt-0.05))),sd*ex,ey,0.0015)); } }
      return out; };
    const specs=F=>{ const out=[], ex=0.046*S.eyeGap*F.fs[0], ey=(-0.002+0.012*S.eyeHeight)*HT, Rl=0.0335, push=0.0165;
      for(const sd of [-1,1]){
        out.push(solid(F.place(new THREE.TorusGeometry(Rl,0.0018,4,sg(24)),sd*ex,ey,push),BRASS));
        // a lens glint: a bright arc on the upper outer rim of the glass
        out.push(pc(F.place(ofRibbon([[sd*0.0105,0.0245,0],[sd*0.0185,0.0222,0],[sd*0.0245,0.0168,0],[sd*0.0272,0.0105,0]],u=>0.004*(1-0.7*u),{up:[0,0,-1],seg:5,th:0.0006}),sd*ex,ey,push+0.0004),(x,y,z,c)=>c.set(0xffffff)));
        // the temple bar: from the lens's outer edge back along the skull to the top of the ear
        const xe=sd*(ex+Rl), ze=F.zAt(Math.abs(xe),ey)-push+0.002, Rs=0.1062*F.fs[0];
        out.push(tube([[xe,ey,ze],[sd*(Rs*0.955),ey+0.002,-0.052],[sd*(Rs*1.03),ey+0.0045,-0.03],[sd*(Rs*1.045),ey+0.0085,-0.004],[sd*F.earX*1.02,0.0125,0.014]],0.0013,BRASS,sg(10))); }
      // the bridge: a small arc over the nose
      { const zb=F.zAt(0,ey)-push-0.0012, zi=F.zAt(ex-Rl,ey)-push+0.0006; out.push(tube([[-(ex-Rl-0.0006),ey+0.004,zi],[-0.007,ey+0.0105,zb],[0,ey+0.0125,zb-0.0008],[0.007,ey+0.0105,zb],[ex-Rl-0.0006,ey+0.004,zi]],0.0013,BRASS,sg(10))); }
      return out; };

    /* ================= the weapon dressing: leather grips, brass bands, brushed steel and walnut, the hooded lantern and a plumb bob on a chain ================= */
    const chain=(a,b,n)=>{ const out=[]; for(let i=0;i<n;i++){ const f=(i+0.5)/n, p=[lerp(a[0],b[0],f),lerp(a[1],b[1],f),lerp(a[2],b[2],f)], g=new THREE.TorusGeometry(0.0034,0.0009,4,8); if(i%2) g.rotateY(Math.PI/2); g.scale(1,1.45,1); out.push(solid(g.translate(p[0],p[1],p[2]),BRASS)); } return out; };
    const charm=()=>{ const lit=[], glow=[], LC=[0.034,-0.066,0.0], PC=[-0.026,-0.082,0.0];
      lit.push(solid(new THREE.TorusGeometry(0.0062,0.0015,5,12).translate(0,0.0,0),BRASS_L));
      lit.push(...chain([0.003,-0.005,0],[LC[0]-0.002,LC[1]+0.0265,0],3), ...chain([-0.003,-0.005,0],[PC[0]+0.002,PC[1]+0.0215,0],3));
      // the lantern: a hex cage of brass posts round a glass, a louvred hood with a verdigris patina, a ring on top
      const L=(g)=>g.translate(LC[0],LC[1],LC[2]);
      lit.push(solid(L(new THREE.CylinderGeometry(0.0135,0.0135,0.004,12).translate(0,-0.0185,0)),BRASS_D));
      for(let k=0;k<6;k++){ const a=k*TAU/6; lit.push(solid(L(new THREE.CylinderGeometry(0.0013,0.0013,0.032,4).translate(Math.sin(a)*0.0108,-0.0025,Math.cos(a)*0.0108)),BRASS)); }
      lit.push(pc(L(new THREE.ConeGeometry(0.0175,0.0145,12).translate(0,0.0215,0)),(x,y,z,c)=>{ c.copy(cBl); c.lerp(cV,0.8*clamp((0.0215+LC[1]-y+0.0)*70+(-0.0)+0.2)*0+0.5*clamp(-(y-LC[1]-0.021)*90)); }));
      lit.push(solid(L(ofRingAt([0,0.0125,0],[0,1,0],0.0128,0.0016,6)),BRASS));
      lit.push(solid(L(new THREE.TorusGeometry(0.0048,0.0013,4,10).translate(0,0.0305,0)),BRASS_L));
      glow.push(pc(L(new THREE.CylinderGeometry(0.0089,0.0089,0.027,10).translate(0,-0.0035,0)),(x,y,z,c)=>{ c.set(LAMP); c.lerp(ofCol(0xffffff),0.5*clamp(1-Math.hypot(x-LC[0],z-LC[2])/0.0089)); }));
      // the plumb bob: a brass cone with a verdigris cap and three engraved rings
      const Pb=(g)=>g.translate(PC[0],PC[1],PC[2]);
      lit.push(pc(Pb(new THREE.ConeGeometry(0.0105,0.034,10).rotateX(Math.PI).translate(0,-0.0075,0)),(x,y,z,c)=>{ c.copy(cB); c.lerp(cBl,0.4*clamp((y-PC[1]+0.02)*40)); }));
      lit.push(solid(Pb(new THREE.CylinderGeometry(0.0108,0.0108,0.0105,10).translate(0,0.0145,0)),VERD));
      for(const dy of [-0.0005,-0.0085,-0.0165]) lit.push(solid(Pb(ofRingAt([0,dy,0],[0,1,0],0.0112*(1+dy*18),0.0006,5)),BRASS_D));
      // a brass tag with engraved ticks hung from the ring
      lit.push(pc(ofPatch(-0.006,0.006,-0.036,-0.008,2,sg(24),()=>0.0,true).translate(0.0,0,0.0105),(x,y,z,c)=>{ const k=Math.round((y+0.036)/0.028*24); c.copy(cB); if(k%2===0&&(k%6===0||x<0.0)) c.copy(cLd); }));
      lit.push(...chain([0,-0.004,0.0],[0,-0.0085,0.0105],1));
      for(const g of lit.concat(glow)) g.scale(1.3,1.3,1.3);
      return {lit,glow}; };
    const dress={ grip:LEATHER, metal:STEEL, wood:WALNUT, accent:BRASS, glow:LAMP,
      trim:(c,u,part)=>{ const f=((u/0.05)%1+1)%1;
        if(part==='blade') c.lerp(cB,0.38*clamp(1-u/0.12)); else if(part==='limb'||part==='shaft'||part==='rim'){ if(f<0.22) c.lerp(cBl,0.85); else if(f>0.5&&f<0.56) c.lerp(cV,0.7); }
        else if(part==='grip'){ if(((u/0.016)%1+1)%1<0.4) c.lerp(cB,0.8); }
        else if(part==='face'){ c.lerp(cLd,0.2); } },
      charm };

    /* ================= loose parts: the lamp's glass and rays (unlit), the plumb bob swinging from the belt ================= */
    const extras=(rig,Xx,has)=>{   // has(slot): this outfit's item for the slot is worn: the cap lamp's glow goes with the hat, the plumb bob on the belt with the coat
      if(has('hat')&&lampGlow&&lampGlow.length) rig.head.add(new THREE.Mesh(merge(lampGlow),matGlow));
      if(!has('top')) return;
      // the plumb bob: a leather loop on the belt, a cord, a brass cone, hanging in front of the right hip
      const bx=0.076, g=new THREE.Group(), z0=frontZ(bx,BELT0,BM)-0.016; g.position.set(bx,BELT0*TK,z0); rig.spine.add(g);
      const pb=[solid(vbox(0.011,0.026,0.0035,0,0.004,0.014),LEATHER),
        solid(sweepTube([[0,0,0.004],[0,-0.03,0.0],[0,-0.062,0.0]],[0.0011,0.0011,0.0011],4,{cap:'round',rings:8}),LEATHER_L),
        solid(ofRingAt([0,0.0,0.004],[1,0,0],0.0042,0.0012,5),BRASS_L),
        pc(new THREE.CylinderGeometry(0.0125,0.0125,0.013,sg(10)).translate(0,-0.0685,0),(x,y,z,c)=>{ c.copy(cV); if(y<-0.0715) c.copy(cBd); }),
        pc(new THREE.ConeGeometry(0.0125,0.044,sg(10)).rotateX(Math.PI).translate(0,-0.097,0),(x,y,z,c)=>{ c.copy(cB); c.lerp(cBl,0.4*clamp((y+0.12)*30)); }),
        solid(ring(-0.08,0.0128,0.0128,0,0.0007,sg(10)),BRASS_D),solid(ring(-0.0905,0.0095,0.0095,0,0.0007,sg(10)),BRASS_D)];
      const m=new THREE.Mesh(merge(pb),matChar); m.castShadow=true; g.add(m);
      rig.anims.push((t,dt,mv)=>{ g.rotation.x=-0.2*rig.hipR.rotation.x+0.04*Math.sin(t*1.9)+0.05*mv*Math.sin(t*6.3); g.rotation.z=0.03*Math.sin(t*1.3+1); });
    };

    /* ================= the kit ================= */
    return {
      bootTop:0.72, shinCut:0.70, own:{thigh:'top'}, boot:true, skinFrom:0.605, hairColor:SILVER, eyeColor:0xaab4bd,
      eyes:{iris:0.92,h:0.84,w:1.05,lash:0.9,hl:2,tilt:-0.05,browLift:0.002,browThick:0.95,browAngle:0.2},
      cuts:{torso:[0.0],foreArm:[0.232/D.fore,0.07/D.fore],upperArm:[0.205/D.upper],shin:[BOOT]},
      paint,
      head:(F,T)=>cap(F,T),
      hair:(F,T)=>hair(F,T),
      mark:F=>mark(F),
      facial:F=>specs(F),
      torso:()=>[shellG(),hemSeam(),collarLining(),collarTop(),closing(),...buttons(),belt(),ruler(-1),ruler(1),...buckle(),...tape(),...pencil(),...cravat(),...pocket(-0.074,0.338,0.054,0.027,true),...pocket(-0.128,0.06,0.058,0.036,true),...pocket(0.128,0.06,0.058,0.036,true),...backBits()],
      shoulder:sd=>epaulet(sd),
      forearm:sd=>cuff(sd),
      thigh:sd=>upperFlap(sd),
      shin:sd=>[...lowerFlap(sd),...legBits(sd)],
      extras,
      dress
    };
  };
})();
