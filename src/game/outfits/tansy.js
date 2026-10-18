//@ Tansy's outfit (a farm-hand who harvests a whole field): a wide coil-straw sunbrim with wheat sprigs, a braided wheat crown, a laced green-yoke smock with a sash, patchwork knee breeches with leg wraps, lugged field boots, and the sheaf-wrap dressing
/* ---------- Tansy: grind, no element (nothing glows, no matGlow). Design: docs/skillkits/looks/tansy.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: wheat 0xe0b95a, field green 0x7a9a3c, clay red 0xb5532f, oat cream 0xece3c8, leather 0x7a5a3a (plus darker and lighter shades of them). The silhouette is a bell: widest at a big straw brim, a rounded
   smock over an A-line skirt, short breeches and boots. Every part has at least two colours; the emblems are wheat ears and patches, never a rayed sun.
   How it is built: bands of colour are cut rows of a loft (`rowLoft`: two rings a millimetre apart), patches and appliqué are grids and tubes laid on the real section of the body part (`wrapPatch`, `wpt`, with `torsoSize`
   and the limbs' own stations), so nothing blurs and nothing pokes through at any build. The skirt is two panels swung by the thighs in `extras`; the sash tails and the hat's wheat sprigs move there too. */
CHAR_MODELS.tansy={id:'tansy',name:'Tansy',signature:true, hairGrad:{mode:'tips',c2:0xe8c860}, items:{hat:'Sun brim',hair:'Sheaf crown',face:'Freckles',top:'Harvest smock',bottom:'Stook breeches',shoes:'Furrow boots',weapon:'Sheaf wrap'},sexes:['female'],
  note:'The farm-hand: a wide brim and round shapes, built for a short, strong, round-cheeked woman.',
  ranges:{chest:[0.7,1.3],waist:[0.88,1.15],legs:[0.92,1.1],thighs:[0.95,1.25],arms:[0.9,1.25],neck:[0.9,1.2],head:[0.94,1.1],hairLength:[0.9,1.25],hairVolume:[1.0,1.2]},
  setups:[{id:'tansy',name:'Tansy',sex:'female',def:true,note:'Tansy as drawn: short, strong, round-cheeked, always smiling.',v:{height:0.96,build:1.1,shoulders:1.04,hips:1.1,thighs:1.12,arms:1.15,hands:1.1,feet:1.05,jaw:1.05,chin:0.95,cheeks:1.15,eyeSize:1.1,noseSize:0.95,mouthSize:1.1,smile:0.5,hairVolume:1.1,bangs:0.8}}]};

OUTFITS.tansy=(function(){
  const WHEAT=0xe0b95a, FIELD=0x7a9a3c, CLAY=0xb5532f, OAT=0xece3c8, LEATHER=0x7a5a3a;
  const STRAW_D=0xc89f46, STRAW_L=0xefd78a, CANVAS=0xb59a64, CANVAS_D=0x9a8250, CLAY_D=0x8c3b21, FIELD_D=0x5b7b2d, FIELD_L=0x9bb55a, TWINE=0xe8dcc0, BARK=0x3a2a1c, STALK=0xb7ad5a, EARC=0xd9ab45, OAT_D=0xd9cdaa;
  const PI=Math.PI, sin=Math.sin, cos=Math.cos, mixc=(c,h,t)=>c.lerp(ofCol(h),t);

  /* ---- shared building blocks ---- */
  // a surface of rows [{y,rx,rz,zc,col(c,ang,rowIndex,x,y,z)}] (each row its own colour: crisp bands where two rows sit a millimetre apart), then an optional warp of every vertex
  const rowLoft=(rows,seg,warp,arc)=>{
    const g=arc?ofLoft(rows,seg,arc[0],arc[1]):loftRings(rows,seg), p=g.attributes.position, col=new Float32Array(p.count*3), c=new THREE.Color();
    for(let i=0;i<rows.length;i++){ const r=rows[i]; for(let j=0;j<=seg;j++){ const v=i*(seg+1)+j, x=p.getX(v), y=p.getY(v), z=p.getZ(v);          // the vertices run ring after ring: a row's colour goes on its own ring
      r.col(c,Math.atan2(x,-(z-(r.zc||0))),i,x,y,z); c.multiplyScalar(0.985+0.03*noise2(x*7+z*5,y*7-z*3)); col[v*3]=c.r; col[v*3+1]=c.g; col[v*3+2]=c.b; } }
    g.setAttribute('color',new THREE.BufferAttribute(col,3));
    if(warp){ for(let v=0;v<p.count;v++){ const q=warp(p.getX(v),p.getY(v),p.getZ(v)); p.setXYZ(v,q[0],q[1],q[2]); } smoothN(g); }
    return g.toNonIndexed(); };
  // a point on an elliptical body part at angle a (0 = the back, PI = the front, PI/2 = +x), height y, mg metres off the surface; rf(y) = [rx, rz, zc]
  const wpt=(rf,a,y,mg)=>{ const s=rf(y); return [(s[0]+mg)*sin(a),y,(s[1]+mg)*cos(a)+s[2]]; };
  // make the triangles of an indexed grid face away from the part's axis
  const outward=(g,zcOf)=>{ const p=g.attributes.position, ix=g.index.array, m=Math.floor(ix.length/6)*3, a=ix[m], b=ix[m+1], c=ix[m+2];
    const ax=p.getX(a), ay=p.getY(a), az=p.getZ(a), ux=p.getX(b)-ax, uy=p.getY(b)-ay, uz=p.getZ(b)-az, vx=p.getX(c)-ax, vy=p.getY(c)-ay, vz=p.getZ(c)-az;
    const nx=uy*vz-uz*vy, nz=ux*vy-uy*vx; if(nx*ax+nz*(az-zcOf(ay))<0) for(let i=0;i<ix.length;i+=3){ const t=ix[i+1]; ix[i+1]=ix[i+2]; ix[i+2]=t; }
    return g; };
  // a patch hugging the part: rows [{y,w}] bottom to top (w = half-width along the surface, metres) centred at angle a0, nx columns, mg metres off the surface
  const wrapPatch=(rf,a0,rows,nx,mg)=>{
    const nr=rows.length, pos=new Float32Array(nr*(nx+1)*3), idx=[];
    for(let j=0;j<nr;j++){ const r=rows[j], s=rf(r.y), rm=(s[0]+s[1])/2+mg;
      for(let i=0;i<=nx;i++){ const p=wpt(rf,a0+lerp(-r.w,r.w,i/nx)/rm,r.y,mg), o=(j*(nx+1)+i)*3; pos[o]=p[0]; pos[o+1]=p[1]; pos[o+2]=p[2]; } }
    for(let j=0;j<nr-1;j++) for(let i=0;i<nx;i++){ const a=j*(nx+1)+i, b=a+1, c=a+nx+1, d=c+1; idx.push(a,c,b,b,c,d); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx);
    return smoothN(outward(g,y=>rf(y)[2])); };
  // rows of a rounded rectangle (centre height cy, half-width w, height h, corner radius k)
  const rrRows=(cy,w,h,k)=>{ k=Math.min(k,w,h/2); const r=[], n=2; for(let i=0;i<=n;i++){ const a=i/n*PI/2; r.push({y:cy-h/2+k*(1-cos(a)),w:w-k+k*sin(a)}); } for(let i=n;i>=0;i--){ const a=i/n*PI/2; r.push({y:cy+h/2-k*(1-cos(a)),w:w-k+k*sin(a)}); } return r; };
  // a sewn-on patch: a cloth of colour colA inside a stitched border of colour colB (two layers, the cloth 1.6 mm above the border), laid on the part at angle a0
  const clothPatch=(rf,a0,cy,w,h,mg,colA,colB,k,fr,fn)=>{ fr=fr||0.0042;
    return [solid(wrapPatch(rf,a0,rrRows(cy,w+fr,h+fr,(k||0.008)+fr),5,mg),colB),
            pc(wrapPatch(rf,a0,rrRows(cy,w,h,k||0.008),5,mg+0.0016),(x,y,z,c)=>{ c.set(colA); if(fn) fn(c,x,y,z); })]; };
  // a torus ring round an elliptical part at height y, mg off its surface, tube radius r
  const ellRing=(rf,y,mg,r,seg,hex,tu)=>{ const s=rf(y), R=(s[0]+s[1])/2+mg, g=new THREE.TorusGeometry(R,r,seg,tu||18).rotateX(PI/2); g.scale((s[0]+mg)/R,1,(s[1]+mg)/R); g.translate(0,y,s[2]); return solid(g,hex); };
  // a limb's section from its stations [t, rx, rz, zOff]: rf(y) for y running down from 0, over `len` metres
  const stRF=(st,len)=>y=>{ const t=clamp(-y/len,0,1); let i=1; while(i<st.length-1&&t>st[i][0]) i++; const a=st[i-1], b=st[i], f=clamp((t-a[0])/((b[0]-a[0])||1),0,1); return [lerp(a[1],b[1],f),lerp(a[2],b[2],f),lerp(a[3],b[3],f)]; };

  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw, tw=D.tw, cw=D.cw, KR=D.KR, fore=D.fore, thigh=D.thigh, shin=D.shin;
    const hv=S.hairVolume, Rb=0.14+0.09*clamp(hv-1,0,0.35), Y0=0.07, RIM=Rb+0.074;     // the hat: the crown clears the hair, the seat sits above the brows
    const tube=(pts,r,hex,seg,rings,cap)=>solid(sweepTube(pts,Array.isArray(r)?r:[r,r],sg(seg||5),{cap:cap||'round',rings:rings||Math.max(3,pts.length*2)}),hex);

    /* ---- the paint of the body: an oat smock under a green yoke, canvas breeches, bare forearms, wrapped and booted shins ---- */
    const bodyPaint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso':   // y is the design height
          if(y>0.4375) c.set(FIELD); else if(y>0.434) c.set(WHEAT); else if(y>0.03) c.set(OAT); else c.set(CANVAS);
          return;
        case 'upperArm': c.set(OAT); return;
        case 'foreArm': if(y<-0.135) skinPaint(c); else c.set(OAT); return;
        case 'thigh': { c.set(CANVAS); if(-y/thigh>0.935) c.set(CLAY); return; }
        case 'shin': { const t=-y/shin; if(t<0.085) c.set(CANVAS); else if(t<0.8) c.set(FIELD_D); else { c.set(LEATHER); if(z>0.02) c.multiplyScalar(0.82); } return; }
        case 'foot': { const sf=S.feet; c.set(LEATHER);
          if(y<-D.ankleH+0.012) c.set(BARK); else if(y<-D.ankleH+0.016) c.set(0xb09560);      // a dark lugged sole under a tan welt stitch
          else if(z<-0.082*sf) c.set(CLAY_D); else if(z>0.03*sf) c.set(0x5d422c);            // a clay-brown toe cap and a dark heel counter
          return; }
      }
      c.set(OAT);
    };

    /* ---- the sunbrim: a coil-straw hat, a round crown, a field-green band between cream threads, a clay-bound brim that dips at the front and turns up at the back, lined in green ---- */
    const sunbrim=F=>{
      const ytop=Y0+0.14, Hd=0.1, drp=0.008, r0=Rb+0.004, rows=[], add=(r,y,col)=>rows.push({y,rx:Math.max(r,1e-4),rz:Math.max(r,1e-4),zc:0,col});
      const topY=r=>Y0-0.0004-drp*Math.pow((r-r0)/(RIM-r0),2);
      for(let i=0;i<=6;i++){ const ph=i/6*PI/2; add(Rb*sin(ph),ytop-Hd*(1-cos(ph)),(c,a)=>{ c.set(i%2?STRAW_D:WHEAT); c.multiplyScalar(0.96+0.06*sin(a*17+i)); }); }   // the dome: rings of coiled straw
      add(Rb+0.0015,Y0+0.0262,c=>c.set(WHEAT));
      add(Rb+0.0016,Y0+0.0252,c=>c.set(TWINE)); add(Rb+0.0018,Y0+0.0236,c=>c.set(TWINE));          // a cream thread above the band
      add(Rb+0.0019,Y0+0.0226,c=>c.set(FIELD)); add(Rb+0.0033,Y0+0.0044,c=>c.set(FIELD));           // the crown band is field green: a red band on a straw hat is a famous pirate's (the IP check in docs/skillkits/looks/tansy.md)
      add(Rb+0.0034,Y0+0.0034,c=>c.set(TWINE)); add(Rb+0.0036,Y0+0.0018,c=>c.set(TWINE));         // and a cream thread under it
      for(let k=0;k<=7;k++){ const r=lerp(r0,RIM-0.0075,k/7); add(r,topY(r),(c,a)=>{ c.set(k%2?STRAW_D:WHEAT); c.multiplyScalar(0.96+0.06*sin(a*24+k*2)); }); }   // the brim: coils
      add(RIM-0.0063,topY(RIM-0.0063),c=>c.set(STRAW_D)); add(RIM-0.0052,topY(RIM-0.0052),c=>c.set(CLAY));                // a clay binding round the edge
      add(RIM,topY(RIM)-0.0017,c=>c.set(CLAY)); add(RIM-0.0052,topY(RIM-0.0052)-0.0035,c=>c.set(CLAY));
      add(RIM-0.0063,topY(RIM-0.0063)-0.0035,c=>c.set(FIELD_D));                                                          // under the brim: a green lining
      for(let k=0;k<=3;k++){ const r=lerp(RIM-0.0063,Rb-0.011,k/3); add(r,topY(Math.max(r,r0))-0.0035,(c,a)=>{ c.set(k%2?FIELD:FIELD_D); if(k===2) c.set(WHEAT); c.multiplyScalar(0.97+0.05*sin(a*20)); }); }
      const dY=r=>ytop-Hd*(1-Math.sqrt(Math.max(0,1-Math.pow(r/Rb,2))));                       // the dome's outer height at radius r: the inside follows it 4 mm below
      add(Rb-0.011,Y0-0.0045,c=>c.set(STRAW_D)); add(Rb-0.009,Y0+0.03,c=>c.set(STRAW_D)); add(0.9*Rb,dY(0.9*Rb)-0.004,c=>c.set(STRAW_D)); add(0.6*Rb,dY(0.6*Rb)-0.004,c=>c.set(STRAW_D)); add(0,ytop-0.004,c=>c.set(STRAW_D));
      const warp=(x,y,z)=>{ const r=Math.hypot(x,z); if(r<=Rb+0.006) return [x,y,z]; const t=smoothstep(Rb+0.006,RIM,r), fz=-z/r; return [x,y+t*t*(fz>0?-0.012*fz:0.02*-fz),z]; };
      return [rowLoft(rows,sg(32),warp)];
    };

    /* ---- the sheaf crown: wheat-gold hair under the brim, a thick three-strand braid wound round the head with a clay thread in it, two straw wisps at the temples ---- */
    const sheafcrown=(F,T)=>{
      const fs=F.fs, hl=T.hl, out=[];
      T.crown(0.113,0.5,0.3); T.fringe(5,0.8,0.14);
      T.add(T.fit(shell(0.113*T.hv,0.3*PI,0.2*PI,1.9,0,sg(30),sg(8))),(x,y,z,c)=>{ T.hp(x,y,z,c); c.multiplyScalar(0.95+0.09*sin(Math.atan2(x,z)*13)); });   // the hair gathered up under the braid
      // the loose hair behind: twelve tapering locks from under the braid to the nape, each its own length and shade
      const rng=mulberry32(321), lock=(th,ph0,ph1,w,sw,tip,k)=>{ const P=[]; for(let q=0;q<=4;q++){ const f=q/4; P.push(T.sp(th+sw*f,lerp(ph0,ph1,f),T.R+0.004*sin(f*PI)-0.001*k)); } P.push(T.sp(th+sw*1.15,ph1+tip,T.R+0.002));
        const g=sweepTube(P,[0.006,w,w*1.1,w*0.65,0.002],sg(5),{cap:'point',rings:sg(8)}); T.flat(g,0.55); return T.fit(g); };
      for(let i=0;i<12;i++){ const th=1.15+(TAU-2.3)*(i+0.5+(rng()-0.5)*0.5)/12, k=i%3, ph1=(0.62+0.14*rng())*PI; T.add(lock(th,0.34*PI,ph1,0.0105+0.004*rng(),(rng()-0.5)*0.12,0.04+0.05*rng(),k),(x,y,z,c)=>{ T.hp(x,y,z,c); mixc(c,k===0?0xf0d796:k===1?0xc9a053:0xd8b56e,0.45); }); }                                                      // the hair behind the braid, down to the nape
      for(const sd of [-1,1]) T.add(T.scalpLock(sd*1.28,0.34*PI,0.62*PI,[0.003,0.0085,0.0078,0.0045,0.001],{sw:sd*0.14,tip:0.1,lift:0.007,k:0.55}),(x,y,z,c)=>{ T.hp(x,y,z,c); mixc(c,0xf3dc9a,0.4); });
      const nT=1.35+0.5*clamp((hl-0.9)/0.35,0,1), n1=sg(40), N=Math.round(n1*nT), a0=0.92*PI, Rc0=0.113*T.hv+0.0085, TW=6, ro=0.0058, rs=0.0092;
      const at=s=>{ const u=s*nT, L=smoothstep(0.85,1.25,u), tk=smoothstep(nT-0.3,nT,u), a=a0+u*TAU, ca=cos(a), sa=sin(a), sink=1-smoothstep(0,0.12,u);
        const R=Rc0-0.004*L-0.016*tk-0.022*sink, zs=ca>0?1-0.05*ca:1+0.09*-ca;
        return {p:[R*sa*fs[0],0.03+0.021*ca+0.011*L-0.013*tk,-R*ca*zs],nx:sa*fs[0],nz:-ca*zs}; };
      const strand=(j,rad,off,seg,col)=>{ const P=[]; for(let i=0;i<=N;i++){ const s=i/N, q=at(s), nl=Math.hypot(q.nx,q.nz)||1, ph=s*nT*TAU*TW+j*TAU/3, co=cos(ph)*off, so=sin(ph)*off;
          P.push([q.p[0]+co*q.nx/nl,q.p[1]+so,q.p[2]+co*q.nz/nl]); }
        return pc(sweepTube(P,[rad*0.55,rad,rad,rad,rad,rad*0.8],seg,{cap:'point',rings:N}),col); };
      const shades=[0xeccb88,0xd3a95a,0xbd9345];
      for(let j=0;j<3;j++) out.push(strand(j,rs,ro,sg(5),(x,y,z,c)=>{ c.set(shades[j]); c.multiplyScalar(0.94+0.1*sin(x*90+z*90+j)); }));
      out.push(strand(1.5,0.0034,ro+0.0068,3,(x,y,z,c)=>c.set(CLAY)));    // a clay thread woven round the braid
      return out;
    };

    /* ---- the smock: a loose oat blouse under the green yoke, gathered at a wheat sash, with a laced green bib, a clay neckerchief, a wheat-ear emblem on the back ---- */
    const ringT=(yd,m)=>{ const s=torsoSize(X,D,yd); return [s.rx+m,(s.rz+s.rzBack)/2+m,(s.rzBack-s.rz)/2]; };      // [rx, rz, zc] of the torso at a design height, m off the body
    const mBl=yd=>0.008+0.012*Math.pow(sin(PI*clamp((yd-0.19)/0.24,0,1)),1.3);                                         // the blouse bulges over the bust and is gathered at the sash and the yoke
    const rfBl=y=>ringT(y/TK,mBl(y/TK));
    const rfBib=y=>{ const yd=y/TK; return ringT(yd,yd<=0.43?mBl(yd)+0.0035:0.0115-0.0085*smoothstep(0.43,0.465,yd)); };
    const rfKer=y=>{ const yd=y/TK; return ringT(yd,0.003+0.011*smoothstep(0.47,0.56,yd)); };       // the neckerchief rides over the collarbones
    const sashY=0.19*TK, SW=0.052;
    const pleat=(a,yd)=>0.95+0.055*sin(a*7+1)*(1-0.5*smoothstep(0.3,0.43,yd));
    const blouse=()=>{ const rows=[]; for(let i=0;i<=9;i++){ const yd=lerp(0.19,0.43,i/9), s=rfBl(yd*TK); rows.push({y:yd*TK,rx:s[0],rz:s[1],zc:s[2],col:(c,a)=>{ c.set(OAT); c.multiplyScalar(pleat(a,yd)); }}); }
      return rowLoft(rows,sg(32)); };
    const sash=()=>{ const vs=[0,0.07,0.13,0.14,0.15,0.16,0.5,0.84,0.85,0.86,0.87,0.93,1];
      const rows=vs.map(v=>{ const y=sashY+(v-0.5)*SW, s=ringT(y/TK,0.0105+0.0085*sin(PI*v)); return {y,rx:s[0],rz:s[1],zc:s[2],col:(c,a)=>{
        const e=Math.min(v,1-v); if(e<0.135) c.set(CLAY); else if(e<0.16) c.set(TWINE); else { c.set(WHEAT); c.multiplyScalar(0.96+0.06*sin(a*5)); } }}; });
      return rowLoft(rows,sg(32)); };
    const bibW=yd=>{ const T=[[0.256,0.028],[0.265,0.052],[0.28,0.066],[0.31,0.075],[0.36,0.08],[0.42,0.085],[0.465,0.09]]; for(let i=1;i<T.length;i++) if(yd<=T[i][0]) return lerp(T[i-1][1],T[i][1],(yd-T[i-1][0])/(T[i][0]-T[i-1][0])); return 0.09; };
    const BIB=[]; for(let i=0;i<=17;i++){ const yd=lerp(0.256,0.464,i/17); BIB.push([yd,bibW(yd)]); }
    const rmOf=(rf,y)=>{ const s=rf(y); return (s[0]+s[1])/2; };
    const bib=()=>{ const out=[], rows=BIB.map(r=>({y:r[0]*TK,w:r[1]}));
      out.push(pc(wrapPatch(rfBib,PI,rows,sg(14),0),(x,y,z,c)=>{ c.set(FIELD); mixc(c,FIELD_L,0.45*faceG(x,0,0.02)); c.multiplyScalar(0.97+0.05*sin(x*220)); }));
      { const P=[wpt(rfBib,PI,BIB[0][0]*TK-0.002,0.0026)];                                                                    // a clay piping all round the bib, from its point up the right side, across the top and down the left
        for(const r of BIB.slice(0,-1)) P.push(wpt(rfBib,PI-r[1]/rmOf(rfBib,r[0]*TK),r[0]*TK,0.0026));
        { const yt=BIB[BIB.length-1][0]*TK, wt=BIB[BIB.length-1][1]; for(const f of [1,0.8,0.4,0,-0.4,-0.8,-1]) P.push(wpt(rfBib,PI-f*(wt-(Math.abs(f)>0.9?0.004:0))/rmOf(rfBib,yt),yt-(Math.abs(f)>0.9?0.004:0)*0,0.0026)); }
        for(let i=BIB.length-2;i>=0;i--) P.push(wpt(rfBib,PI+BIB[i][1]/rmOf(rfBib,BIB[i][0]*TK),BIB[i][0]*TK,0.0026));
        P.push(P[0]); out.push(tube(P,0.0025,CLAY,5,P.length*2)); }
      for(const sx of [-1,1]){ const P=[]; for(const yd of [0.285,0.33,0.38,0.43]){ const y=yd*TK; P.push(wpt(rfBib,PI-sx*0.036/rmOf(rfBib,y),y,0.0022)); } out.push(tube(P,0.0014,WHEAT,4,12)); }   // two wheat seams
      // the lacing: cream eyelets in two columns, a leather cord crossing between them, two loose ends below
      const ys=[0.44,0.415,0.39,0.365,0.34,0.315], cx=0.0155, lp=(sx,yd,mg)=>{ const y=yd*TK; return wpt(rfBib,PI-sx*cx/rmOf(rfBib,y),y,mg); };
      for(let i=0;i<ys.length;i++) for(const sx of [-1,1]) out.push(solid(csph(0.0034,sg(5),sg(4)).scale(1,1,0.55).translate(...lp(sx,ys[i],0.0016)),TWINE));
      for(let i=0;i<ys.length-1;i++) for(const sx of [-1,1]) out.push(tube([lp(sx,ys[i],0.0034),lp(-sx,ys[i+1],0.0034)],0.0013,LEATHER,4,3,'none'));
      for(const sx of [-1,1]) out.push(tube([lp(sx,ys[5],0.0034),lp(sx,0.292,0.0036),lp(sx,0.272,0.0034)],0.0013,LEATHER,4,5));
      for(const sx of [-1,1]){ const y=0.435*TK, p=wpt(rfBib,PI-sx*0.07/rmOf(rfBib,y),y,0.0045); out.push(solid(csph(0.0058,sg(7),sg(5)).scale(1,1,0.5).translate(...p),WHEAT),solid(csph(0.0024,5,4).scale(1,1,0.5).translate(p[0],p[1],p[2]-0.0026),LEATHER)); }   // a button at each top corner
      return out; };
    const kerchief=()=>{ const K=[[0.468,0.004],[0.482,0.028],[0.5,0.046],[0.525,0.058],[0.55,0.064],[0.565,0.066]], fr=0.0032;
      return [solid(wrapPatch(rfKer,PI,K.map(r=>({y:(r[0]-(r===K[0]?0.004:0))*TK,w:r[1]+fr})),sg(12),0),TWINE),
              pc(wrapPatch(rfKer,PI,K.map(r=>({y:r[0]*TK,w:r[1]})),sg(12),0.0016),(x,y,z,c)=>{ c.set(CLAY); c.multiplyScalar(0.96+0.06*sin(x*160+y*90)); })]; };
    const collar=()=>{ const y=0.575*TK, R=D.neckR*1.3+0.005;
      return [solid(new THREE.TorusGeometry(R,0.0078,5,sg(22)).rotateX(PI/2).translate(0,y,0),0xf3ecd6),solid(new THREE.TorusGeometry(R+0.0008,0.0024,3,sg(22)).rotateX(PI/2).translate(0,y-0.0074,0),CLAY)]; };
    // the emblem on the back of the blouse: five green stalks fanned from a clay tie, five wheat ears (raised, like appliqué)
    const emblem=()=>{ const out=[], yb=0.3*TK, rm=rmOf(rfBl,yb), P=(x,y,mg)=>wpt(rfBl,x/rm,y,mg), ear=new THREE.Vector3(), up=new THREE.Vector3(0,1,0), E=1.3;
      for(let k=-2;k<=2;k++){ const x1=k*0.0105*E, top=yb+(0.056+0.006*(2-Math.abs(k)))*E, mg=0.0042;
        const pts=[P(k*0.0016,yb-0.01,mg),P(k*0.0035*E,yb+0.012*E,mg),P(x1*0.9,yb+0.034*E,mg),P(x1,top-0.008*E,mg)];
        out.push(tube(pts,[0.0016,0.0015,0.0014,0.0012],FIELD_D,4,4,'none'));
        const e=P(x1*1.04,top+0.004,mg+0.0006); ear.set(x1*0.5,0.03,0).normalize();
        out.push(solid(csph(1,sg(6),sg(4)).scale(0.0058*E,0.0145*E,0.0044*E).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(up,ear))).translate(e[0],e[1],e[2]),k%2?WHEAT:0xe8c868)); }
      out.push(tube([P(-0.0125*E,yb,0.0056),P(0,yb+0.0008,0.0062),P(0.0125*E,yb,0.0056)],0.0036,CLAY,5,5));
      out.push(tube([P(0.0,yb-0.002,0.0058),P(0.006,yb-0.022,0.0054)],0.0014,CLAY,4,3),tube([P(0.0,yb-0.002,0.0058),P(-0.005,yb-0.02,0.0054)],0.0014,CLAY,4,3));
      return out; };
    const knotAt=()=>{ const s=ringT(0.19,0.0105+0.0085), bz=s[1]+s[2]+0.006; return [0,sashY,bz]; };

    /* ---- the skirt of the smock: an A-line hem to the thigh, a clay hem band between cream threads, scalloped; two big patch pockets, patches behind ---- */
    const hemY=-0.085, skL=sashY-hemY;
    const thr=y=>{ if(y<=0) return rfTh(y); const t=rfTh(0), rc=(t[0]+t[1])*0.46, k=Math.sqrt(Math.max(0,rc*rc-y*y))/rc; return [t[0]*k,t[1]*k,t[2]]; };     // the breeches' thigh at height y: its ball above the hip joint, the shell below
    const rfSk=y=>{ const u=clamp((sashY-y)/skL,0,1), s=torsoSize(X,D,Math.max(y/TK,0)), f=Math.pow(u,1.25), th=thr(y);       // wide enough to clear the breeches' thighs at any build, hips and thigh slider
      return [Math.max(s.rx+0.010,D.hx+th[0]+0.012)+0.05*f,Math.max((s.rz+s.rzBack)/2+0.010,th[1]+Math.abs(th[2])+0.012)+0.045*f,(s.rzBack-s.rz)/2]; };
    // two panels (a front and a back, each reaching 0.35 rad past the side seams so the seams never open), hung from the sash and swung out by the thighs in `extras`
    const skirtPanel=front=>{ const ys=[], N=7, gr=front?0.0015:0, A=PI/2+0.35, arc=front?[PI-A,PI+A]:[-A,A]; for(let i=0;i<=N-1;i++) ys.push(lerp(sashY,hemY+0.03,i/(N-1)));
      const spec=ys.map(y=>[y,0]).concat([[hemY+0.0285,0],[hemY+0.0272,1],[hemY+0.0258,1],[hemY+0.0245,2],[hemY+0.0,2]]);
      const rows=spec.map(q=>{ const s=rfSk(q[0]); return {y:q[0],rx:s[0]+gr,rz:s[1]+gr,zc:s[2],col:(c,a)=>{ if(q[1]===2) c.set(CLAY); else if(q[1]===1) c.set(TWINE); else { c.set(OAT); c.multiplyScalar(0.95+0.055*sin(a*8+2)); } }}; });
      const warp=(x,y,z)=>{ const u=clamp((sashY-y)/skL,0,1); return [x,y+0.0065*sin(Math.atan2(x,-z)*8)*u*u*u,z]; };
      const out=[rowLoft(rows,sg(26),warp,arc)], cy=sashY-0.09;
      if(front) for(const sx of [-1,1]){ const a=PI-sx*0.62;
        out.push(...clothPatch(rfSk,a,cy,0.034,0.062,0.0035,CLAY,TWINE,0.008,0.0045,(c,x,y)=>{ if(y>cy+0.012) c.set(CLAY_D); }));                                  // the pocket; its flap a darker clay
        out.push(solid(wrapPatch(rfSk,a,rrRows(cy+0.0205,0.0345,0.0085,0.003),5,0.0057),CLAY_D));                                                                    // the flap's edge
        const p=wpt(rfSk,a,cy+0.0165,0.0083); out.push(solid(csph(0.0036,sg(7),sg(5)).scale(1,1,0.5).translate(...p),LEATHER)); }                                  // a leather button
      else { out.push(...clothPatch(rfSk,0.4,sashY-0.085,0.036,0.04,0.002,FIELD,TWINE,0.008,0.0045));                                                              // a green patch on the back
        out.push(...clothPatch(rfSk,-0.55,sashY-0.14,0.022,0.026,0.002,OAT_D,CLAY,0.006,0.004)); }
      return out; };

    /* ---- the shoulders: a green yoke cap with a wheat piping, an elbow patch on the sleeve ---- */
    const upSt=[[0,0.05*aw,0.052*aw,0],[0.13,0.0505*aw,0.053*aw,0],[0.38,0.045*aw,0.048*aw,-0.003],[0.7,0.037*aw,0.039*aw,0],[1,D.ER,D.ER*1.04,0]], rfUp=stRF(upSt,D.upper);
    const shoulder=sd=>{ const out=[], r=0.0548*aw, yE=r*cos(PI*0.52)*0.95+0.004;
      out.push(pc(new THREE.SphereGeometry(r,sg(16),sg(8),0,TAU,0,PI*0.52).scale(1.03,0.95,1.06).translate(0,0.004,0),(x,y,z,c)=>{ c.set(FIELD); mixc(c,FIELD_L,0.5*clamp(y*14)); }));
      const g=new THREE.TorusGeometry(r*0.998,0.0028,4,sg(22)).rotateX(PI/2); g.scale(1.03,1,1.06); g.translate(0,yE,0); out.push(solid(g,WHEAT));
      out.push(...clothPatch(rfUp,sd*1.0,-0.222,0.02,0.04,0.0026,sd>0?CLAY:FIELD_L,TWINE,0.007,0.0035));
      return out; };
    /* ---- the forearms: sleeves rolled to the mid-forearm in a thick cream cuff between a green and a clay cord ---- */
    const faSt=[[0,D.ER,D.ER*1.04,0],[0.1,0.037*aw,0.038*aw,0],[0.34,0.0305*aw,0.03*aw,0],[D.wrist/fore-0.12,0.0235*aw,0.0235*aw,0],[D.wrist/fore,0.02*aw,0.02*aw,0]], rfFa=stRF(faSt,fore);
    const forearm=sd=>[ellRing(rfFa,-0.125,0.0036,0.0074,6,0xf3ecd6,sg(18)),ellRing(rfFa,-0.1115,0.0018,0.0024,3,FIELD,sg(18)),ellRing(rfFa,-0.1385,0.0018,0.0024,3,CLAY,sg(18))];

    /* ---- the breeches: baggy canvas to the knee, a leather side seam with buttons, patchwork, a clay hem; below the knee a buckled strap and green leg wraps ---- */
    const thSt0=stRF([[0,0.088*tw,0.092*tw,0],[0.14,0.09*tw,0.094*tw,0],[0.42,0.077*tw,0.081*tw,-0.004],[0.76,Math.max(KR*1.1,0.057*tw),Math.max(KR*1.12,0.06*tw),-0.002],[1,KR,KR*1.04,0]],thigh);
    const mT=t=>t<0.14?lerp(0.011,0.013,t/0.14):t<0.42?lerp(0.013,0.019,(t-0.14)/0.28):t<0.76?lerp(0.019,0.017,(t-0.42)/0.34):lerp(0.017,0.007,(t-0.76)/0.24);
    const thSt=[0,0.14,0.3,0.42,0.6,0.76,0.88,0.96,1].map(t=>{ const b=thSt0(-t*thigh); return [t,b[0]+mT(t),b[1]+mT(t),b[2]]; }), rfTh=stRF(thSt,thigh);
    const thighHook=sd=>{ const out=[];
      out.push(pc(limb(thSt,thigh,sg(16),sg(10),{cuts:[0.935],cap:3}),(x,y,z,c)=>{ c.set(CANVAS); if(-y/thigh>0.935) c.set(CLAY); }));
      const s=thigh/0.46, mg=0.003;
      out.push(...clothPatch(rfTh,PI-sd*0.55,-0.14*s,0.033,0.062,mg,sd>0?FIELD:CLAY,TWINE));
      out.push(...clothPatch(rfTh,PI+sd*0.4,-0.3*s,0.024,0.04,mg,sd>0?CLAY:FIELD_L,TWINE,0.006));
      out.push(...clothPatch(rfTh,sd*0.77,-0.2*s,0.03,0.05,mg,OAT_D,LEATHER,0.007));
      if(sd<0) out.push(...clothPatch(rfTh,PI-0.1,-0.385*s,0.026,0.036,mg,CLAY_D,TWINE,0.006));
      const seam=[]; for(const f of [0.08,0.3,0.55,0.8,0.93]) seam.push(wpt(rfTh,sd*PI/2,-f*thigh,0.0016)); out.push(tube(seam,0.0021,LEATHER,4,10));      // a leather seam down the outer side
      for(const f of [0.2,0.42,0.64]) out.push(solid(csph(0.0045,sg(6),sg(4)).scale(1,1,0.5).translate(...wpt(rfTh,sd*PI/2,-f*thigh,0.0045)),WHEAT));
      out.push(ellRing(rfTh,-0.935*thigh,0.0009,0.0017,3,TWINE,sg(18)));
      return out; };
    const shSt=[[0,KR,KR*1.04,0],[0.14,0.0505*cw,0.054*cw,0.005],[0.3,0.052*cw,0.057*cw,0.011],[0.5,0.041*cw,0.044*cw,0.007],[0.6,0.045*cw,0.048*cw,0.005],[0.66,0.042*cw,0.045*cw,0.005],[0.85,0.037*cw,0.039*cw,0],[1,0.033*cw,0.035*cw,0]], rfSh=stRF(shSt,shin);
    // a ribbon of cloth wound round the shin from yTop to yBot: edges low and dark, a raised lighter centre; neighbouring turns meet edge to edge
    const wrapStrip=(sd,yTop,yBot)=>{ const pitch0=0.033, turns=Math.max(3,Math.round((yTop-yBot)/pitch0)-1), pitch=(yTop-yBot)/(turns+1), n=Math.max(8,Math.round(turns*sg(14))), pos=new Float32Array((n+1)*9), idx=[];
      for(let i=0;i<=n;i++){ const u=i/n*turns, a=PI*0.5+sd*u*TAU, yc=yTop-pitch/2-u*pitch;
        [[yc+pitch/2,0.0012],[yc,0.0045],[yc-pitch/2,0.0012]].forEach((q,k)=>{ const p=wpt(rfSh,a,q[0],q[1]), o=(i*3+k)*3; pos[o]=p[0]; pos[o+1]=p[1]; pos[o+2]=p[2]; }); }
      for(let i=0;i<n;i++) for(let k=0;k<2;k++){ const a=i*3+k, b=a+1, c=a+3, d=c+1; idx.push(a,c,b,b,c,d); }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); smoothN(outward(g,y=>rfSh(y)[2]));
      return paint(g,(x,y,z,nx,ny,nz,c)=>{ const s=rfSh(y), e=Math.hypot(x/(s[0]+0.0045),(z-s[2])/(s[1]+0.0045)); if(e>0.985){ c.set(FIELD); mixc(c,FIELD_L,0.35); c.multiplyScalar(0.96+0.1*sin(y*210)); } else c.set(FIELD_D); }); };
    const shinHook=sd=>{ const out=[], A=D.ankleH, sf=S.feet, wf=0.55+0.45*sf;
      out.push(ellRing(rfSh,-0.028,0.0036,0.0046,5,LEATHER,sg(18)));                                                                       // the strap below the knee
      out.push(...clothPatch(rfSh,PI-sd*0.7,-0.028,0.0075,0.0105,0.0074,LEATHER,WHEAT,0.0015,0.0035));                                    // its buckle
      out.push(wrapStrip(sd,-0.085*shin,-0.8*shin));
      // the turned cuff of the boot: a flared collar, clay thread at the rim, ribbed straw below
      const yc=-0.8*shin, cuff=[[0.014,0.0108,0],[0.0128,0.0104,0],[0.0114,0.0097,1],[0.002,0.0076,1],[-0.008,0.0058,2],[-0.013,0.005,2]].map(q=>{ const s=rfSh(yc+q[0]); return {y:yc+q[0],rx:s[0]+q[1],rz:s[1]+q[1],zc:s[2],col:(c,a)=>{ if(q[2]===0) c.set(CLAY); else { c.set(q[2]===1?WHEAT:STRAW_D); c.multiplyScalar(0.95+0.07*sin(a*8)); } }}; });
      out.push(rowLoft(cuff,sg(26)));
      // the lugged sole: five transverse blocks under the foot, turned with it
      const zs=[0.046,0.012,-0.026,-0.064,-0.104], ws=[0.014,0.026,0.03,0.031,0.026];
      for(let i=0;i<5;i++){ const g=solid(vbox(ws[i]*2*wf,0.011,0.011,0,-A+0.0016,zs[i]*sf),BARK).rotateY(-sd*0.1); out.push(g.translate(0,-shin,0)); }
      // cream laces crossing over the instep: the top of the foot at a given z (from the foot's own rings), three crossings
      const top=z=>{ const T=[[0.026,0.08],[0,0.1],[-0.03,0.082],[-0.075,0.056],[-0.115,0.041]]; z/=sf; let i=1; while(i<T.length-1&&z<T[i][0]) i++; const a=T[i-1], b=T[i]; return (lerp(a[1],b[1],clamp((z-a[0])/(b[0]-a[0])))*(0.8+0.2*sf))-A; };
      const lz=[-0.012,-0.034,-0.056,-0.078];
      for(let i=0;i<3;i++) for(const sx of [-1,1]){ const z0=lz[i]*sf, z1=lz[i+1]*sf, g=tube([[sx*0.011*wf,top(z0)+0.0022,z0],[-sx*0.011*wf,top(z1)+0.0022,z1]],0.0016,TWINE,3,3,'none').rotateY(-sd*0.1); out.push(g.translate(0,-shin,0)); }
      return out; };

    /* ---- freckles: flat flecks over the nose bridge and the cheeks, on the skull's own surface ---- */
    const freckles=F=>{ const out=[], rng=mulberry32(5150), cols=[0xb8793f,0xc99560,0xa66b3f];
      const add=(x,y,k)=>{ const g=csph(1,sg(5),sg(3)).scale(k,k*(0.8+0.3*rng()),k*0.3); out.push(solid(F.place(g,x,y,0.0005),cols[Math.floor(rng()*3)])); };
      for(let i=0;i<4;i++) add((rng()-0.5)*0.022,-0.012+0.02*rng(),0.0016+0.0008*rng());
      for(const sd of [-1,1]) for(let i=0;i<7;i++) add(sd*(0.024+0.03*rng()),-0.03-0.019*rng(),0.0018+0.001*rng());
      return out; };

    /* ---- the sheaf: seven gold ears tied at the waist with a clay cord, hung ears-down from the grip ---- */
    const sheaf=()=>{ const lit=[], wy=-0.062, ox=0.03;      // the sheaf hangs a hand's breadth to the side so the grip and the fist do not hide it
      lit.push(tube([[0,0.004,0],[0.012,-0.004,0.002],[0.026,-0.02,0.002],[ox,-0.038,0]],0.0014,CLAY,4,6));
      for(let k=0;k<7;k++){ const a=k===0?0:(k-1)/6*TAU+0.3, rp=k===0?0:1, rt=0.011*rp, rw=0.0028*rp, re=0.0062*rp, rm=0.0092*rp, ym=-0.085;
        const at=(r,y)=>[r*cos(a),y,r*sin(a)];
        lit.push(tube([at(rt,-0.041),at(rw,wy),at(re,-0.073)],0.0013,STALK,4,3,'none'));
        const ear=csph(1,sg(6),sg(4)).scale(0.0042,0.0165,0.0038).rotateZ(0.19).translate(rm,ym,0).rotateY(-a); lit.push(solid(ear,k%2?EARC:0xe6c05c));
        lit.push(solid(new THREE.ConeGeometry(0.0009,0.014,3).rotateX(PI).rotateZ(0.19).translate(rm+0.0032,ym-0.0165-0.005,0).rotateY(-a),STRAW_L)); }      // an ear and its awn
      lit.push(solid(new THREE.TorusGeometry(0.0066,0.0023,5,16).rotateX(PI/2).translate(0,wy,0),CLAY),solid(new THREE.TorusGeometry(0.006,0.0016,5,14).rotateX(PI/2).translate(0,wy-0.0055,0),TWINE));
      lit.slice(1).forEach(g=>g.translate(ox,0,0));
      return {lit,glow:[]}; };

    return {
      aura:{col:0xe0b95a,col2:0xf0e0a0,style:'rise',ring:false,n:8,shape:'grain',deco:'none'},   /* this set's own aura (kit.aura: model.js) */
      main:{top:0x7a9a3c,bottom:0xb59a64,shoes:0x7a5a3a,hat:0xe0b95a}, /* the main colour of each piece, for the player's recolouring (outfit-tools.js: ofTinter) */ bootTop:0.8, shinCut:0.77, boot:true, hairColor:0xd8b56e, eyeColor:0xb8862f,
      eyes:{iris:1.05,h:1.06,lash:0.4,hl:1,tilt:0,browThick:1.3,browLift:0.003},    // the "sunny" style: a round wide-open amber eye, one big highlight, a light lash, thick friendly brows
      cuts:{torso:[0.03,0.434,0.4375],foreArm:[0.135/fore],thigh:[0.935],shin:[0.085,0.8]},
      paint:bodyPaint,
      head:F=>sunbrim(F),
      hair:(F,T)=>sheafcrown(F,T),
      mark:F=>freckles(F),
      torso:()=>{ const out=[blouse(),sash(),...bib(),...kerchief(),...collar(),...emblem()], k=knotAt();
        out.push(solid(csph(0.0125,sg(7),sg(5)).scale(1,0.85,0.7).translate(k[0],k[1],k[2]),CLAY));                                            // the sash's knot and two bow loops
        for(const sx of [-1,1]) out.push(pc(csph(0.0185,sg(7),sg(5)).scale(1,0.55,0.32).rotateZ(sx*0.45).translate(k[0]+sx*0.0185,k[1]+sx*0.002,k[2]-0.001),(x,y,z,c)=>{ c.set(WHEAT); if(Math.abs(x-k[0])<0.011) c.set(CLAY); }));
        return out; },
      shoulder, forearm,
      thigh:thighHook, shin:shinHook,

      /* ---- loose parts: the sash's two tails (they trail when she moves) and three wheat sprigs tucked in the hat band (they sway) ---- */
      extras:(rig,Xx,has)=>{    // `has(slot)`: this outfit's piece for that slot is worn (the pieces mix: docs/CHARACTER.md section 9)
        if(has('top')){
        const panel=front=>{ const m=new THREE.Mesh(merge(skirtPanel(front).map(g=>g.translate(0,-sashY,0))),matChar), g=new THREE.Group(); m.castShadow=true; g.position.y=sashY; g.add(m); rig.hips.add(g); return g; };
        const skF=panel(true), skB=panel(false);
        rig.anims.push(()=>{ const l=rig.hipL.rotation.x, r=rig.hipR.rotation.x; skF.rotation.x=0.5*Math.max(0,l,r); skB.rotation.x=0.4*Math.min(0,l,r); });   // the hem swings out with the leading thigh, front and back
        const k=knotAt(), tailGroups=[];
        for(const [sx,L] of [[-1,0.215],[1,0.17]]){
          const g=new THREE.Group(); g.position.set(k[0]+sx*0.006,k[1]-0.006,k[2]); rig.hips.add(g);
          const P=[], N=5; for(let i=0;i<=N;i++){ const f=i/N, y=k[1]-0.006-f*L, bz=rfSk(y)[1]+rfSk(y)[2]+0.007; P.push([sx*(0.004+0.03*f),-f*L,bz-k[2]+0.0025*sin(f*PI*1.4)*sx]); }
          const tail=pc(ofRibbon(P,u=>0.034*(0.8+0.2*u),{up:[0,0,1],seg:sg(10)}),(x,y,z,c)=>{ const f=-y/L; c.set(WHEAT); if(f>0.8) c.set(CLAY); if(f>0.77&&f<0.8) c.set(TWINE); if(f>0.9&&f<0.92) c.set(TWINE); });
          const m=new THREE.Mesh(merge([tail]),matChar); m.castShadow=true; g.add(m); tailGroups.push([g,sx]); }
        rig.anims.push((t,dt,sp)=>{ for(const [g,sx] of tailGroups){ g.rotation.x=-0.1-0.28*Math.min(1,sp)+0.05*sin(t*5.2+sx)*Math.min(1,sp+0.2); g.rotation.z=sx*0.05*sin(t*3.1); } });
        }
        if(has('hat')){
        const fs=rig.dims.faceScale, sprigs=[];
        [[0.42,0.40,0.14],[0.6,0.52,0.16],[0.8,0.34,0.125]].forEach(([az,lean,Ls],i)=>{
          const outer=new THREE.Group(), inner=new THREE.Group(); outer.add(inner);
          outer.position.set((Rb-0.002)*sin(az)*fs[0],Y0+0.012,-(Rb-0.002)*cos(az)*0.97);
          const dir=new THREE.Vector3(sin(az)*sin(lean),cos(lean),-cos(az)*sin(lean)).normalize(); outer.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
          const parts=[solid(sweepTube([[0,-0.01,0],[0.002,Ls*0.4,0],[0.005,Ls*0.75,0],[0.009,Ls*0.97,0]],[0.0023,0.002,0.0016,0.0013],sg(5),{cap:'round',rings:6}),STALK),
            solid(csph(1,sg(7),sg(5)).scale(0.0072,0.021,0.0062).translate(0.0095,Ls+0.008,0),i===1?0xe6c05c:EARC)];
          for(const sx of [-1,1]) parts.push(solid(csph(1,5,3).scale(0.0011,0.016,0.0011).rotateZ(sx*0.25).translate(0.0095+sx*0.004,Ls+0.03,0),STRAW_L));
          parts.push(pc(ofRibbon([[0.002,0.004,0],[0.014,0.04,0.003],[0.03,0.07,0.004],[0.05,0.082,0.006]],u=>0.011*(1-0.85*u),{up:[0,0,-1],seg:sg(8)}),(x,y,z,c)=>{ c.set(FIELD); mixc(c,FIELD_L,clamp(y*8)*0.6); }));   // a green blade beside the stalk
          const m=new THREE.Mesh(merge(parts),matChar); m.castShadow=true; inner.add(m); rig.head.add(outer); sprigs.push([inner,i]); });
        rig.anims.push((t,dt,sp)=>{ for(const [g,i] of sprigs){ g.rotation.z=0.05*sin(t*2.1+i*1.7)+0.07*Math.min(1,sp)*sin(t*6+i); g.rotation.x=0.04*sin(t*1.7+i*2.3); } });
        }
      },

      /* ---- the weapon dressing: ash grips wrapped in twine with clay cords, hazel limbs and shafts, dull steel, wheat-ear notches, a sheaf hung from the grip ---- */
      dress:{ shape:{sword:'sickle',bow:'longbow',staff:'sheaf'}, grip:0x9a7a4a, metal:0xb9bcc0, wood:0x8a6a3a, accent:CLAY, glow:0xa88a4a,    // (the mage's orb is drawn unlit by weapons.js; a dull straw colour keeps it from shining)
        trim:(c,u,part)=>{ const f=((u/0.02)%1+1)%1;
          if(part==='grip'){ const g=((u/0.006)%1+1)%1; if(g<0.55) c.lerp(ofCol(TWINE),0.85); if((((u/0.045)%1+1)%1)<0.1) c.lerp(ofCol(CLAY),0.9); }
          else if(part==='blade'||part==='limb'||part==='shaft'||part==='rim'){ if(f<0.3) c.lerp(ofCol(0xa8803a),0.85); else if(f>0.5&&f<0.62) c.lerp(ofCol(WHEAT),0.7); } },
        charm:sheaf }
    };
  };
})();
OUTFITS.tansy=oxPlus(OUTFITS.tansy,(X,D)=>({   // round 6: a sheaf of wheat on the back, a red kerchief, a straw shoulder cape
  torso:()=>oxSheaf(X,D,{col:0xd8b050,ear:0xe8c860,cord:0xa04030}).concat(oxScarf(X,D,{col:0xc0392b,col2:0xf3ead2,len:0.4})),
  cos:{cape:{col:0xe0b95a,trim:0x7a9a3c,len:0.4,pat:'stitch',mantle:1}}}));
oxTune('tansy',{eyeSize:1.2,smile:0.7,cheeks:1.2,blush:0.7,lips:1.1,noseSize:0.85,jaw:0.9,chin:0.9,undertone:0.3});
OUTFITS.tansy=oxPlus(OUTFITS.tansy,(X,D)=>({   // face round 2: a round sunny face, rosy cheek patches, freckles, bright green eyes
  mark:F=>oxMarks(F,[{t:'cheek',col:0xe89888},{t:'freckles',col:0xb08060}]),
  hair:()=>oxHairBits(X,[{t:'ring',both:true,col:0xe0b95a}]),
  kit:{eyeColor:0x58a848,eyes:{iris:1.1,lash:0.5}}}));
Object.assign(CHAR_MODELS.tansy,{hairGrad:{mode:'ombre',c2:0xe8c860,c3:0xf3e0a0}});
oxTune('tansy',{height:0.97,build:1.05,chest:1.1,shoulders:0.9,waist:0.95,hips:1.2,thighs:1.25,arms:0.95,legs:0.92,head:1.1});
Object.assign(CHAR_MODELS.tansy.setups[0],{note:'The farm-hand as drawn: a pear shape with wide hips and short legs, round-cheeked.'});
OUTFITS.tansy=oxPlus(OUTFITS.tansy,(X,D)=>({   // uniqueness round 2: two big quilted panniers at the hips, wide enough to read from across the field
  hips:()=>oxPannier(X,D,{col:0xe8c050,col2:0x6a9a40,w:0.15,h:0.11})}));
