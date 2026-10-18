//@ Sorrel's outfit (a mountain lookout): a brass-goggled ridge band and an ear feather, long white-blond hair streaming one way, a layered tunic with a very long striped scarf, crag trousers, ledge boots, and the feather-and-lens weapon dressing
/* ---------- Sorrel: safe DPS, air. Design: docs/skillkits/looks/sorrel.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: sky 0x8fb8d8, cream 0xf1ead8, slate 0x4a5560, snow 0xf4f6f8, feather grey 0xb7c0c9 (+ leather 0x6a5a48 and brass 0xc2a45a for the straps and rims). Silhouette: the tallest and lightest line, loose pale hair and
   a very long scarf both streaming back and to the left, feathers at the ear and the grip. The only glow is a pale sky glint in a lens (air): one in the goggles, one in the weapon charm. */
CHAR_MODELS.sorrel={id:'sorrel',name:'Sorrel',signature:true, hairGrad:{mode:'ombre',c2:0xa8d4f0,c3:0x58c0b8}, items:{hat:'Ridge band',hair:'Gale long',face:'Wind streaks',top:'Lookout layers',bottom:'Crag trousers',shoes:'Ledge boots',weapon:'Feather flight'},sexes:['female'],
  note:'The lookout: the tallest and lightest line, drawn for a tall, slim, long-legged woman.',
  ranges:{height:[0.98,1.08],build:[0.88,1.08],chest:[0.6,1.2],shoulders:[0.88,1.08],waist:[0.85,1.05],legs:[1.0,1.14],thighs:[0.85,1.05],arms:[0.82,1.1],neck:[0.95,1.2],head:[0.92,1.08],eyeSize:[0.9,1.15],eyeTilt:[0.05,0.7],hairLength:[1.0,1.35],hairVolume:[1.0,1.25]},
  setups:[{id:'sorrel',name:'Sorrel',sex:'female',def:true,note:'The lookout as drawn: tall, slim, long-legged, a cool narrow stare.',v:{height:1.05,build:0.9,chest:0.95,shoulders:0.95,waist:0.9,hips:0.97,torso:1.02,legs:1.12,thighs:0.92,arms:0.92,neck:1.05,jaw:0.9,chin:0.95,cheeks:0.85,eyeSize:0.95,eyeGap:1.02,eyeTilt:0.4,brow:0.25,noseSize:0.9,mouthSize:0.9,lips:0.9,hairLength:1.3,hairVolume:1.15,bangs:0.7}}]};

OUTFITS.sorrel=(function(){
  const SKY=0x8fb8d8, SKY_L=0xc4dcec, SKY_D=0x6f9cbf, CREAM=0xf1ead8, CREAM_D=0xddd4bd, SLATE=0x4a5560, SLATE_D=0x38414a, SNOW=0xf4f6f8, FEATH=0xb7c0c9, FEATH_D=0x8c97a3,
        LEATHER=0x6a5a48, LEATHER_D=0x514337, BRASS=0xc2a45a, HAIR=0xece6d4, SOLE=0x2b2e33, RAND=0xd8c9a7, GLINT=0xbfe3ff, EYE=0x9fb4c4;
  const cSky=ofCol(SKY), cSkyL=ofCol(SKY_L), cSkyD=ofCol(SKY_D), cCr=ofCol(CREAM), cCrD=ofCol(CREAM_D), cSl=ofCol(SLATE), cSlD=ofCol(SLATE_D), cSn=ofCol(SNOW), cFe=ofCol(FEATH), cFeD=ofCol(FEATH_D), cLe=ofCol(LEATHER), cBr=ofCol(BRASS), cRand=ofCol(RAND);
  const V3=THREE.Vector3, G=faceG, sm=faceSm, PI=Math.PI;

  /* a surface from a grid P(u,v) -> [x,y,z] (u down, v round; both 0..1) with uv kept for the colours; the winding is chosen so the faces look toward out(x,y,z) */
  const gridG=(nu,nv,P,out)=>{
    const pos=new Float32Array((nu+1)*(nv+1)*3), uv=new Float32Array((nu+1)*(nv+1)*2), idx=[];
    for(let i=0;i<=nu;i++) for(let j=0;j<=nv;j++){ const p=P(i/nu,j/nv), k=i*(nv+1)+j; pos[k*3]=p[0]; pos[k*3+1]=p[1]; pos[k*3+2]=p[2]; uv[k*2]=i/nu; uv[k*2+1]=j/nv; }
    for(let i=0;i<nu;i++) for(let j=0;j<nv;j++){ const a=i*(nv+1)+j, b=a+1, c=a+nv+1, d=c+1; idx.push(a,c,b,b,c,d); }
    let s=0; const A=new V3(), B2=new V3(), C=new V3(), n=new V3();
    for(let t=0;t<idx.length;t+=3){ A.fromArray(pos,idx[t]*3); B2.fromArray(pos,idx[t+1]*3); C.fromArray(pos,idx[t+2]*3); const o=out((A.x+B2.x+C.x)/3,(A.y+B2.y+C.y)/3,(A.z+B2.z+C.z)/3); n.crossVectors(B2.sub(A),C.sub(A)); s+=n.x*o[0]+n.y*o[1]+n.z*o[2]; }
    if(s<0) for(let t=0;t<idx.length;t+=3){ const q=idx[t+1]; idx[t+1]=idx[t+2]; idx[t+2]=q; }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.setIndex(idx); return smoothN(g); };
  // the grid's colours: fn(u, v, x, y, z, c) sets c; returns a plain triangle list with normals and colours (with the faint tint noise `pc` adds)
  const bake=(g,fn)=>{ const ix=g.index.array, p=g.attributes.position, nr=g.attributes.normal, uv=g.attributes.uv, m=ix.length, pos=new Float32Array(m*3), nor=new Float32Array(m*3), col=new Float32Array(m*3), c=new THREE.Color();
    for(let k=0;k<m;k++){ const v=ix[k], x=p.getX(v), y=p.getY(v), z=p.getZ(v); pos[k*3]=x; pos[k*3+1]=y; pos[k*3+2]=z; nor[k*3]=nr.getX(v); nor[k*3+1]=nr.getY(v); nor[k*3+2]=nr.getZ(v);
      c.set(0xffffff); fn(uv.getX(v),uv.getY(v),x,y,z,c); c.multiplyScalar(0.985+0.03*noise2(x*7+z*5,y*7-z*3)); col[k*3]=c.r; col[k*3+1]=c.g; col[k*3+2]=c.b; }
    const o=new THREE.BufferGeometry(); o.setAttribute('position',new THREE.BufferAttribute(pos,3)); o.setAttribute('normal',new THREE.BufferAttribute(nor,3)); o.setAttribute('color',new THREE.BufferAttribute(col,3)); return o; };
  // the inside of a one-sided cloth: a copy pushed d inward along its normals, winding flipped (its normals then face inward)
  const lining=(g,d)=>{ const h=g.clone(), p=h.attributes.position, n=g.attributes.normal; for(let i=0;i<p.count;i++) p.setXYZ(i,p.getX(i)-n.getX(i)*d,p.getY(i)-n.getY(i)*d,p.getZ(i)-n.getZ(i)*d);
    const ix=h.index.array; for(let t=0;t<ix.length;t+=3){ const q=ix[t+1]; ix[t+1]=ix[t+2]; ix[t+2]=q; } return smoothN(h); };
  const two=(g,fo,fi,d)=>[bake(g,fo),bake(lining(g,d||0.003),fi)];
  // a limb's section at t (0..1 down it) from its stations, the same smooth curve `limb` draws: [half-width x, half-depth z, z offset]
  const mkAt=st=>{ const n=st.length, m=[1,2,3].map(c=>{ const out=[]; for(let i=0;i<n;i++){ const a=st[Math.max(0,i-1)], b=st[Math.min(n-1,i+1)], dt=(b[0]-a[0])||1; let s=((b[c]||0)-(a[c]||0))/dt;
      const l=i>0?((st[i][c]||0)-(st[i-1][c]||0)):0, r=i<n-1?((st[i+1][c]||0)-(st[i][c]||0)):0; if(l*r<=0) s=0; out.push(s); } return out; });
    return t=>{ t=clamp(t); let i=1; while(i<n-1&&t>st[i][0]) i++; const a=st[i-1], b=st[i], h=(b[0]-a[0])||1, u=clamp((t-a[0])/h), u2=u*u, u3=u2*u;
      return [1,2,3].map((c,ci)=>(2*u3-3*u2+1)*(a[c]||0)+(u3-2*u2+u)*h*m[ci][i-1]+(-2*u3+3*u2)*(b[c]||0)+(u3-u2)*h*m[ci][i]); }; };
  // a flat strip along a curve whose flat face turns as it goes (upf(u) = the direction the face looks at); both faces are drawn
  const strip=(pts,wf,upf,seg,th)=>{
    const V=pts.map(p=>new V3(p[0],p[1],p[2])), cv=new THREE.CatmullRomCurve3(V,false,'catmullrom',0.5), h=(th||0.003)/2;
    const pos=new Float32Array((seg+1)*12), nor=new Float32Array((seg+1)*12), idx=[], n=new V3(), b=new V3(), up=new V3();
    for(let i=0;i<=seg;i++){ const u=i/seg, p=cv.getPoint(u), t=cv.getTangent(u).normalize(), w=wf(u)/2, uu=upf(u); up.set(uu[0],uu[1],uu[2]); n.copy(up).addScaledVector(t,-up.dot(t)); if(n.lengthSq()<1e-6) n.set(1,0,0).addScaledVector(t,-t.x); n.normalize(); b.crossVectors(t,n).normalize();
      const put=(k,sx,sn)=>{ const o=(i*4+k)*3; pos[o]=p.x+b.x*w*sx+n.x*h*sn; pos[o+1]=p.y+b.y*w*sx+n.y*h*sn; pos[o+2]=p.z+b.z*w*sx+n.z*h*sn; nor[o]=n.x*sn; nor[o+1]=n.y*sn; nor[o+2]=n.z*sn; }; put(0,1,1); put(1,-1,1); put(2,1,-1); put(3,-1,-1); }
    for(let i=0;i<seg;i++){ const a=i*4, c=a+4; idx.push(a,c,a+1, a+1,c,c+1, a+2,a+3,c+2, a+3,c+3,c+2); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3)); g.setIndex(idx);
    { const ix=g.index.array, A=new V3().fromArray(pos,ix[0]*3), B2=new V3().fromArray(pos,ix[1]*3), C=new V3().fromArray(pos,ix[2]*3), fn=new V3().crossVectors(B2.sub(A),C.sub(A)); if(fn.dot(new V3(nor[0],nor[1],nor[2]))<0) for(let i=0;i<ix.length;i+=3){ const q=ix[i+1]; ix[i+1]=ix[i+2]; ix[i+2]=q; } }
    return g; };
  // a feather along the curve P: a leaf-shaped vane bowed across its width (colFn(d, c, e) colours it by the distance d from the base and the nearness e to its edge) on a thin quill; `up` is the way its flat face looks
  const feather=(P,wmax,colFn,up,seg,rq)=>{ const p0=P[0], out=[], r=rq||0.0017;
    out.push(...lockBlade(P,wmax,0.22,seg,up,(u,v,x,y,z,c)=>colFn(Math.hypot(x-p0[0],y-p0[1],z-p0[2]),c,Math.abs(2*v-1)),u=>0.12+0.88*Math.sin(PI*Math.pow(Math.min(1,u*1.01),0.7)),0.0016));
    out.push(solid(sweepTube(P,[r,r*0.8,r*0.55,0.0006],4,{cap:'point',rings:seg}),CREAM_D)); return out; };
  // a lock of hair as a flat blade that bows across its width and tapers to a point: path P, full width wmax, its flat face turning by tw(u); colours fn(u, v, x, y, z, c); both faces
  const lockBlade=(P,wmax,bow,seg,tw,fn,wf,dd,outFn)=>{ const cv=new THREE.CatmullRomCurve3(P.map(p=>new V3(p[0],p[1],p[2])),false,'catmullrom',0.5), n=new V3(), b=new V3(), t=new V3();
    const g=gridG(seg,2,(u,v)=>{ const c=cv.getPoint(u); t.copy(cv.getTangent(u)).normalize(); if(Array.isArray(tw)) n.set(tw[0],tw[1],tw[2]); else { const a=tw(u); if(Array.isArray(a)) n.set(a[0],a[1],a[2]); else n.set(Math.sin(a),0.2,Math.cos(a)); } n.addScaledVector(t,-n.dot(t)).normalize(); b.crossVectors(t,n);
      const w=wmax*(wf?wf(u):(1-Math.pow(u,2.2))*(0.6+0.4*Math.min(1,u*5))), q=2*v-1, bw=bow*w*(1-q*q); return [c.x+b.x*q*w/2+n.x*bw,c.y+b.y*q*w/2+n.y*bw,c.z+b.z*q*w/2+n.z*bw]; },outFn||(()=>[0,0.2,1]));
    return two(g,fn,fn,dd||0.0035); };
  // three strands plaited along the curve through P (a thin braid)
  const plait=(P,rad,turns,seg,col)=>{ const cv=new THREE.CatmullRomCurve3(P.map(p=>new V3(p[0],p[1],p[2])),false,'catmullrom',0.5), out=[], N=Math.max(10,Math.round(turns*6));
    for(let s=0;s<3;s++){ const Q=[]; for(let i=0;i<=N;i++){ const t=i/N, p=cv.getPoint(t), a=t*turns*TAU+s*TAU/3, r=rad*0.55*(0.5+0.5*Math.min(1,t*4))*(1-0.3*t); Q.push([p.x+r*Math.cos(a),p.y,p.z+r*Math.sin(a)]); }
      out.push(sweepTube(Q,[rad*0.8,rad,rad,rad*0.9,rad*0.55,rad*0.1],seg,{cap:'point',rings:N})); } return out; };
  // n thin strands hanging from (x, y, z), a little different in length, fanned by `spread`
  const tuft=(x,y,z,n,len,r,col,spread,col2)=>{ const out=[]; for(let i=0;i<n;i++){ const f=n>1?i/(n-1)*2-1:0, L=len*(0.85+0.3*((i*7)%5)/4);
    out.push(solid(sweepTube([[x,y,z],[x+f*spread*0.5,y-L*0.5,z+0.002*f],[x+f*spread,y-L,z+0.004*f]],[r,r*0.9,r*0.4],4,{cap:'point',rings:5}),col2&&i%2?col2:col)); } return out; };

  return function(X,D){
    const {S,sg,fem,skinPaint}=X, TK=D.TK, aw=D.aw, B=D.B, lr=D.lr, ch=S.chest;
    const Lh=Math.pow(S.hairLength,0.7), yTop=0.05, yEnd=-0.17*Lh, drift=y=>Math.pow(clamp((yTop-y)/(yTop-yEnd)),1.6);   // the hair's back curtain, and how far it has been blown aside at height y
    const hvS=S.hairVolume, CK=16, ph0=t=>2.2*Math.sin(t*5.5+1);
    const cRing=t=>({y:lerp(yTop,yEnd,t),rx:lerp(0.108,0.126,Math.sin(t*PI*0.7))*(1-0.55*t*t*t)*hvS,rz:lerp(0.05,0.062,Math.sin(t*PI*0.6))*(1-0.6*t*t*t),zc:0.062+0.045*Math.sin(Math.min(1,t*1.8)*PI*0.5)-0.02*t});
    let hairPaintFn=(x,y,z,c)=>c.set(HAIR), glintGeo=null;

    // ---- the torso's real surface (the same formulas as buildTorso), so cloth can lie on it, bust and hips included ----
    const nt=Math.max(0.7,(D.headY-0.03)/TK), PROF=(fem?TORSO_F:TORSO_M).concat([[D.neckR*1.3,0.572],[D.neckR*1.06,0.6],[D.neckR,0.635],[D.neckR*0.98,nt]]), rAt=yd=>profR(PROF,yd);
    const WY=fem?0.215:0.15;
    const kx=yd=>{ const sN=sm(0.5,0.6,yd), up=sm(0.22,0.4,yd)*(1-sN); return lerp(B*(fem?1:1.04),1.1,sN)*(1+(S.shoulders-1)*up+(S.waist-1)*G(yd,WY,0.11)+(S.hips-1)*G(yd,-0.03,0.1)); };
    const kz=(yd,front)=>{ const sN=sm(0.5,0.6,yd), up=sm(0.22,0.4,yd)*(1-sN), gw=G(yd,WY,0.11), gh=G(yd,-0.03,0.1), belly=G(yd,0.1,0.13)*(B-1)*1.4;
      return lerp((fem?0.66:0.62)*B,0.94,sN)*(1+(front?belly:belly*0.3)*(1-sN))*(1+(S.waist-1)*0.7*gw+(S.hips-1)*0.5*gh+(S.shoulders-1)*0.2*up); };
    const surfZ=(x,yd,front)=>{ const r=rAt(yd), a=kx(yd), x0=clamp(x/a,-r,r), z0=Math.sqrt(Math.max(0,r*r-x0*x0)), ax=Math.abs(x);
      let z=(front?-z0:z0)*kz(yd,front);
      if(front){ z-=0.008*G(yd,0.1,0.08)*(1-G(ax,0,0.04))*(fem?0.5:1);
        if(!fem) z+=0.012*B*G(yd,0.33,0.1)*(1-0.4*G(ax,0,0.12))-0.003*B*(0.5+0.5*ch)*G(yd,0.37,0.05)*G(ax,0.07*B,0.07);
        else { const cy=0.315-0.012*(ch-1), wx=0.05*(0.86+0.14*ch), wl=0.036*(0.8+0.2*ch), lobe=sd=>{ const dx=x-sd*0.056*B, dy=yd-cy; return Math.exp(-Math.pow(dx/wx,2))*Math.exp(-Math.pow(dy/(dy>0?0.075:wl),2)); };
          z-=0.034*lr*ch*(1-(1-lobe(-1))*(1-lobe(1))); } }
      else { z+=0.012*B*G(yd,0.37,0.07)*G(ax,0.075*B,0.045); z+=(fem?0.034:0.022)*B*G(yd,0,0.055)*G(ax,0.066*B,0.05); z-=0.008*G(ax,0,0.018)*G(yd,0.2,0.18); }
      return z-sm(0.5,0.6,yd)*(yd-0.5)*0.1; };
    const latX=yd=>rAt(yd)*kx(yd);
    // a point on a closed path round the torso at design height yd, m metres off the surface (phi = 0 at the front, + toward +x): [x, y, z]
    const ringAt=(yd,m,phi)=>{ const s=Math.sin(phi), c=Math.cos(phi), x=latX(yd)*s; return [x+m*s,yd*TK,surfZ(x,yd,c>0)-m*c]; };
    const loopPath=(yd,m,tilt,phi0,n)=>{ const P=[]; for(let k=0;k<=n;k++){ const phi=phi0+k/n*TAU; P.push(ringAt(yd-tilt*Math.cos(phi),m,phi)); } return P; };
    // rings for a band round the torso between two design heights, m metres clear of the body (an ellipse through the front and the back)
    const bandRings=(y0,y1,n,m)=>{ const R=[]; for(let i=0;i<=n;i++){ const yd=lerp(y0,y1,i/n), zf=-surfZ(0,yd,true), zb=surfZ(0,yd,false); R.push({y:yd*TK,rx:latX(yd)+m,rz:(zf+zb)/2+m,zc:(zb-zf)/2}); } return R; };

    /* ---- the paint of the body: a cream tunic under a slate yoke, a leather belt, a sky under-layer at the neck and the cuffs, slate trousers, leather boots ---- */
    const WRIST=0.222, BOOT=0.6;
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso':
          if(y<0.012) c.set(SLATE);
          else if(y<0.07) c.set(LEATHER);
          else if(y<0.405){ c.set(CREAM); c.multiplyScalar(0.975+0.025*Math.sin(x*80)); }
          else if(y<0.498) c.set(SLATE);
          else c.set(SKY);
          return;
        case 'upperArm': { const a=-y; if(a<0.075) c.set(SLATE); else if(a>0.158&&a<0.17) c.set(SLATE_D); else if(a>=0.17&&a<0.19) c.set(SKY); else if(a>=0.19&&a<0.202) c.set(SLATE_D); else c.set(CREAM); return; }
        case 'foreArm': { const a=-y; if(a>WRIST) skinPaint(c); else if(a>0.2) c.set(SLATE); else if(a>0.17) c.set(SKY); else c.set(CREAM); return; }
        case 'thigh': c.set(SLATE); c.multiplyScalar(0.94+0.1*Math.max(0,-z*7)); return;
        case 'shin': if(y<-D.shin*BOOT) { c.set(LEATHER); c.multiplyScalar(0.92+0.12*Math.max(0,-z*8)); } else c.set(SLATE); return;
        case 'foot': { c.set(LEATHER); if(y<-D.ankleH+0.012) { c.set(SOLE); return; } if(z<-0.092) c.set(RAND); else if(z>0.034&&y<-D.ankleH+0.045) c.set(RAND);   // a pale toe rand and heel cap, a dark sole
          else if(y>-D.ankleH+0.042&&Math.abs(x)<0.013&&z<0.0&&z>-0.085&&(Math.round(z*70)&1)===0) c.set(CREAM);                                   // lace rungs over the instep
          return; }
      }
      c.set(SLATE);
    };

    /* ================= the hair: a lifted crown, swept fringe, wisps, two feathered braids, a long back curtain; its tails are loose (extras) ================= */
    const hairFn=T=>(x,y,z,c)=>{ T.hp(x,y,z,c); if(y>0.0&&z>-0.12) c.multiplyScalar(0.9+0.1*(0.5+0.5*Math.sin(Math.atan2(x,z)*13))); const low=sm(-0.08,-0.36,y); c.lerp(cSkyL,0.55*low); const st=0.5+0.5*Math.sin(x*150+z*60); c.lerp(cSn,0.16*st*(1-low)); };
    const hair=(F,T)=>{
      const hf=hairPaintFn=hairFn(T), rng=mulberry32(5), R=T.R, fs=F.fs, out=[];
      T.add(T.fit(shell(0.116*T.hv,0,0.5*PI,0,0.5,sg(34),sg(16))),hf);
      // crown strands: blades laid over the dome from the parting back and down toward the ears, so the crown has relief
      { const nB=6; for(let i=0;i<nB;i++){ const sd=i%2?1:-1, k=i>>1, th0=sd*(0.16+0.3*k), th1=th0+sd*(0.75+0.1*k), P=[], rr=0.0028*(0.8+0.4*rng());
          for(let j=0;j<=4;j++){ const f=j/4, q=T.sp(lerp(th0,th1,f),lerp(0.12*PI,0.47*PI,Math.pow(f,0.9)),R+rr+0.0025*Math.sin(f*PI)); P.push([q[0]*fs[0],q[1]*fs[1],q[2]]); }
          const tone=rng(); for(const g of lockBlade(P,0.03,0.2,sg(8),u=>{ const q=T.sp(lerp(th0,th1,u),lerp(0.12*PI,0.47*PI,Math.pow(u,0.9)),1); return [q[0],q[1],q[2]]; },(u,v,x,y,z,c)=>{ hf(x,y,z,c); c.lerp(cSn,0.2*tone+0.16*(1-Math.abs(2*v-1))); },u=>Math.pow(Math.sin(PI*Math.pow(u,0.8)),0.6)*(1-0.35*u),0.0025,(x,y,z)=>[x,y,z])) out.push(g.scale(1,1,1)); } }
      // the fringe: ribbons from the crown, parted in the middle (the goggles sit there) and swept out over the temples
      if(T.bg>=0.05) for(const i of [0,1,2,5,6,7]){ const f=i/7*2-1, af=Math.abs(f), yb=0.074-0.026*T.bg-0.012*T.bg*(i%2)-0.008*rng()*T.bg, ph1=Math.acos(clamp(yb/R,-0.9,0.9)), w=0.0155-0.0035*af+0.003*rng();
        T.add(T.scalpLock(f*1.0,0.15*PI,ph1,[0.009,w,w*1.1,w*0.6,0.0015],{sw:(f<0?-1:1)*(0.25+0.5*af),tip:0.1*T.bg,lift:0.002+0.006*(1-af),k:0.42}),hf); }
      // the back curtain: a lofted sheet with a ridge for every strand, blown to the left and back as it falls
      { const n=sg(18), seg=sg(48), rings=[]; for(let i=0;i<=n;i++) rings.push(cRing(i/n));
        const g=loftRings(rings,seg), p=g.attributes.position;
        for(let i=0;i<=n;i++) for(let j=0;j<=seg;j++){ const k=i*(seg+1)+j, r=rings[i], a=j/seg*TAU, f=1+0.05*Math.sin(CK*a+ph0(i/n)), kd=drift(r.y);
          p.setXYZ(k,r.rx*Math.sin(a)*f-0.035*kd,r.y,r.zc+r.rz*Math.cos(a)*f+0.045*kd); }
        smoothN(g);
        T.add(T.hang(g),(x,y,z,c)=>{ hf(x,y,z,c); const t=clamp((yTop-y)/(yTop-yEnd)), r=cRing(t), kd=drift(y), rv=Math.sin(CK*Math.atan2((x/fs[0]+0.035*kd)/r.rx,(z-0.045*kd-r.zc)/r.rz)+ph0(t));
          c.multiplyScalar(0.88+0.13*(0.5+0.5*rv)); c.lerp(cSn,0.2*Math.max(0,rv)); }); }
      // a wisp in front of each ear, short and blown back
      for(const sd of [-1,1]){ const P=[T.sp(sd*1.38,0.37*PI,R),[sd*0.119,-0.012,-0.004],[sd*0.122,-0.07,0.008],[sd*0.12,-0.125,0.03]];
        T.add(T.hang(sweepTube(P,[0.007,0.0145,0.013,0.0075,0.0015],sg(8),{cap:'point',rings:sg(14)})),hf); }
      // the temple braids: three strands plaited, tied with sky thread, a small barred feather at the end
      const bl=0.2*Math.pow(S.hairLength,0.5);
      for(const sd of [-1,1]){ const P=[T.sp(sd*1.26,0.43*PI,R),[sd*0.113,0.004,-0.04],[sd*0.111,-0.05,-0.052],[sd*0.106,-0.1-bl*0.3,-0.058],[sd*0.1,-0.16-bl*0.5,-0.062],[sd*0.096,-0.2-bl*0.5,-0.062]];
        for(const g of plait(P,0.0072,4,sg(5))) T.add(T.hang(g),hf);
        const cv=new THREE.CatmullRomCurve3(P.map(p=>new V3(p[0],p[1],p[2])));
        for(const t of [0.16,0.97]){ const q=cv.getPoint(t), tg=cv.getTangent(t); out.push(solid(ofRingAt([q.x*fs[0],q.y,q.z],[tg.x,tg.y,tg.z],0.0092,0.0026,sg(6)),SKY)); }
        const e=cv.getPoint(1.0); const FP=[[e.x*fs[0],e.y+0.004,e.z],[e.x*fs[0]+sd*0.004,e.y-0.03,e.z-0.004],[e.x*fs[0]+sd*0.006,e.y-0.062,e.z-0.003]];
        out.push(...feather(FP,0.012,(d,c,e)=>{ c.copy(cSn); if(d>0.012&&d<0.022) c.lerp(cFeD,0.8*(1-e)); else if(d>0.032&&d<0.042) c.lerp(cSky,0.9); },[sd,0,0.3],sg(10),0.0012)); }
      return out;
    };

    /* ================= the head: a leather ridge band, brass snow goggles pushed up into the hair, (the ear feather and the glint are in extras) ================= */
    const head=(F,T)=>{
      const out=[], fs1=F.fs[1], y0=0.036, y1=0.058, rHair=0.116*T.hv+0.0035, rSkin=0.1088;
      const rad=th=>lerp(rSkin,rHair+0.002,sm(0.5,1.15,Math.abs(th)));
      const polar=(th,y)=>Math.acos(clamp(y/(rad(th)*fs1),-0.98,0.98));
      // the band: a strip round the head at the brow, on the skin in front and on the hair at the sides and back
      const gb=gridG(3,sg(56),(u,v)=>{ const th=-PI+v*TAU; return T.sp(th,polar(th,lerp(y1,y0,u)),rad(th)); },(x,y,z)=>[x,0,z]);
      T.fit(gb); out.push(bake(gb,(u,v,x,y,z,c)=>{ c.set(LEATHER); if(u>0.2&&u<0.8) c.set(LEATHER_D); c.multiplyScalar(0.94+0.1*u); }));
      for(const [yy,col] of [[y1,CREAM],[y0,CREAM]]){ const P=[]; const n=sg(40); for(let k=0;k<=n;k++){ const th=-PI+k/n*TAU, r=rad(th); P.push(T.sp(th,polar(th,yy),r+0.0007)); } out.push(solid(T.fit(sweepTube(P,[0.0016,0.0016],4,{cap:'round',rings:n})),col)); }
      for(let k=0;k<10;k++){ const th=-PI+(k+0.5)/10*TAU; if(Math.abs(th)<0.5) continue; const r=rad(th); out.push(solid(T.fit(csph(0.0028,sg(6),sg(5)).translate(...T.sp(th,polar(th,(y0+y1)/2),r+0.0016))),BRASS)); }
      // the goggles: two brass-rimmed lenses on a bridge, tilted up and resting on the hair above the band
      const push=Math.max(0.006,T.R-0.105)+0.012, gy=0.088, tilt=0.42;
      const lens=(R0)=>{ const o=[];
        o.push(pc(new THREE.CylinderGeometry(R0+0.0018,R0,0.015,sg(18),1,false).rotateX(PI/2).translate(0,0,0.0035),(x,y,z,c)=>{ c.set(SLATE); if(z>0.009) c.set(LEATHER_D); }));
        o.push(solid(new THREE.TorusGeometry(R0,0.0036,5,sg(20)).translate(0,0,-0.0046),BRASS));
        o.push(pc(csph(1,sg(12),sg(6)).scale(R0*0.93,R0*0.93,0.0055).translate(0,0,-0.0034),(x,y,z,c)=>{ const u=x/(R0*0.93), v=y/(R0*0.93), r=Math.hypot(u,v); c.copy(cSky); const gl=Math.max(0,-u*0.62+v*0.78); c.lerp(cSkyL,0.5*gl); c.lerp(cSn,0.55*Math.pow(gl,3)); c.lerp(cSkyD,0.45*sm(0.62,1,r)); }));
        return o; };
      for(const sd of [-1,1]){ const ps=lens(0.027); for(const g of ps) g.rotateX(tilt); out.push(...ps.map(g=>F.place(g,sd*0.036*F.fs[0],gy,push))); }
      { const br=[solid(vbox(0.016,0.0052,0.0046,0,0,-0.0058),BRASS), solid(vbox(0.0045,0.012,0.0038,-0.0075,0,-0.0052),BRASS), solid(vbox(0.0045,0.012,0.0038,0.0075,0,-0.0052),BRASS)]; for(const g of br) g.rotateX(tilt); out.push(...br.map(g=>F.place(g,0,gy,push))); }
      // the glint: a small pale-sky patch on the left lens (built here, drawn unlit in extras)
      { const gg=csph(1,8,6).scale(0.0058,0.0032,0.0008).rotateZ(-0.6).translate(-0.0096,0.0096,-0.0098); gg.rotateX(tilt); glintGeo=pc(F.place(gg,-0.036*F.fs[0],gy,push),(x,y,z,c)=>c.set(GLINT)); }
      return out;
    };

    /* ================= the face: windburn streaks toward the ear ================= */
    const mark=F=>{ const out=[];
      for(const sd of [-1,1]) for(const [yy,x0,x1,w] of [[-0.024,0.052,0.083,0.0022],[-0.037,0.054,0.079,0.0018]]){
        for(const [col,k,dz] of [[0xe8b8ae,1,0.0004],[0xfaede6,0.5,0.0007]]){ const P=[], N=5;
          for(let i=0;i<=N;i++){ const f=i/N, x=sd*lerp(x0,x1,f)*F.fs[0], y=yy+0.012*f*f+0.002*f; P.push([x,y,F.zAt(x,y)-dz]); }
          out.push(solid(sweepTube(P,[0.0004,w*k,w*k*0.9,w*k*0.5,0.0004],5,{cap:'point',rings:8}),col)); } }
      return out; };

    /* ================= the top ================= */
    // the scarf: two wound loops (cream with a sky stripe), crossing, and a knot at the back left from which the two long tails hang (extras)
    const KNOT_PHI=-2.44, KNOT_YD=0.52;
    const stripeC=(f,c)=>{ f=((f%1)+1)%1; if(f<0.55) c.copy(cCr); else if(f<0.85) c.copy(cSky); else c.copy(cSn); };
    const scarf=()=>{ const out=[], n=sg(32);
      for(const [yd,m,tilt,rT,off] of [[0.508,0.0125,0.009,0.0165,0.0],[0.545,0.0098,-0.009,0.0155,0.5]]){
        out.push(pc(sweepTube(loopPath(yd,m,tilt,KNOT_PHI,n),[rT,rT,rT],sg(6),{cap:'round',rings:n}),(x,y,z,c)=>{ stripeC(Math.atan2(x,-z)/TAU*9+off,c); c.multiplyScalar(0.94+0.1*clamp((y/TK-yd)*20+0.5)); })); }
      const k=ringAt(KNOT_YD+0.012,0.024,KNOT_PHI);
      out.push(pc(csph(0.02,sg(12),sg(9)).scale(1.15,1,0.95).translate(k[0],k[1],k[2]),(x,y,z,c)=>{ stripeC((x-k[0])*22+(y-k[1])*8,c); }));
      return out; };
    const torso=()=>{ const out=[];
      // the belt: a leather band with cream piping, a brass buckle, and a knotted cord with two sky-tipped tails
      { const R=bandRings(0.017,0.066,4,0.0065), g=loftRings(R.map((r,i)=>Object.assign(r,{rx:r.rx+0.0045*(1-i/4),rz:r.rz+0.0045*(1-i/4)})),sg(44)); out.push(pc(g,(x,y,z,c)=>{ c.set(LEATHER); c.multiplyScalar(0.92+0.12*clamp((y/TK-0.017)/0.05)); }));
        for(const yd of [0.0185,0.0645]){ const P=[], nn=sg(32); for(let k=0;k<=nn;k++){ const phi=-PI+k/nn*TAU; P.push(ringAt(yd,0.0074,phi)); } out.push(solid(sweepTube(P,[0.0015,0.0015],4,{cap:'round',rings:nn}),CREAM)); }
        const bz=surfZ(0,0.042,true)-0.0085, by=0.042*TK;
        out.push(pc(vbox(0.044,0.006,0.005,0,by+0.0125,bz),(x,y,z,c)=>c.copy(cBr)), pc(vbox(0.044,0.006,0.005,0,by-0.0125,bz),(x,y,z,c)=>c.copy(cBr)), pc(vbox(0.006,0.031,0.005,-0.019,by,bz),(x,y,z,c)=>c.copy(cBr)), pc(vbox(0.006,0.031,0.005,0.019,by,bz),(x,y,z,c)=>c.copy(cBr)),
          pc(vbox(0.012,0.02,0.004,0.0,by,bz-0.0005),(x,y,z,c)=>{ c.copy(cSl); }));
        const kp=ringAt(0.042,0.008,-0.7);
        out.push(solid(csph(0.0085,sg(8),sg(6)).scale(1.2,1,1).translate(kp[0],kp[1],kp[2]),CREAM));
        for(const [dx,L,ph] of [[-0.004,0.085,0],[0.008,0.065,1]]){ const P=[[kp[0]+dx,kp[1]-0.003,kp[2]-0.003],[kp[0]+dx-0.008,kp[1]-L*0.5,kp[2]-0.004+0.003*Math.sin(ph)],[kp[0]+dx-0.012,kp[1]-L,kp[2]-0.002]];
          out.push(solid(sweepTube(P,[0.0024,0.0022,0.0018],5,{cap:'round',rings:10}),CREAM)); out.push(solid(csph(0.0042,6,5).translate(...P[2]),SKY)); } }
      // the yoke seam: a sky piping all round, and the placket with five toggles down the front
      { const P=[], nn=sg(36); for(let k=0;k<=nn;k++){ const phi=-PI+k/nn*TAU; P.push(ringAt(0.405,0.0026,phi)); } out.push(solid(sweepTube(P,[0.0021,0.0021],4,{cap:'round',rings:nn}),SKY)); }
      { const y0=0.084, y1=0.4; out.push(pc(ofPatch(-0.0085,0.0085,y0*TK,y1*TK,sg(4),sg(16),(x,y)=>surfZ(x,y/TK,true)-0.0016,true),(x,y,z,c)=>{ c.set(SKY); if(Math.abs(x)>0.0066) c.set(SLATE); }));
        for(let i=0;i<5;i++){ const yd=lerp(0.12,0.37,i/4), zz=surfZ(0,yd,true)-0.005; out.push(pc(csph(0.0048,sg(6),sg(5)).scale(2.3,0.82,0.82).translate(0,yd*TK,zz),(x,y,z,c)=>{ c.copy(cSn); if(Math.abs(x)>0.0075) c.copy(cLe); })); } }
      // princess seams: a slate line each side of the placket that follows the bust and the waist
      for(const sd of [-1,1]){ const P=[]; for(let k=0;k<=9;k++){ const yd=lerp(0.395,0.078,k/9); P.push(ringAt(yd,0.0026,sd*(0.5+0.12*Math.sin(k/9*PI)))); } out.push(solid(sweepTube(P,[0.0015,0.0015],4,{cap:'round',rings:14}),SLATE)); }
      // a leather chest strap from the left shoulder to the right hip, with a brass slide and a carabiner ring on a sky cord
      { const P=[]; for(let k=0;k<=8;k++){ const f=k/8, x=lerp(-0.082,0.092,f)*B, yd=lerp(0.4,0.082,f); P.push([x,yd*TK,surfZ(x,yd,true)-0.0095]); }
        out.push(pc(ofRibbon(P,0.03,{up:[0,0,-1],seg:sg(16),th:0.004}),(x,y,z,c)=>{ c.set(LEATHER); }));
        const q=P[3]; out.push(pc(vbox(0.036,0.024,0.004,q[0],q[1],q[2]-0.003).rotateZ(0.0),(x,y,z,c)=>{ c.copy(cBr); if(Math.abs(x-q[0])<0.011&&Math.abs(y-q[1])<0.006) c.copy(cSl); }));
        const e=P[8]; out.push(solid(ofRingAt([e[0]+0.003,e[1]-0.014,e[2]-0.004],[0,0.3,1],0.0115,0.0021,6),BRASS), solid(sweepTube([[e[0]-0.004,e[1]-0.002,e[2]-0.002],[e[0]-0.008,e[1]-0.03,e[2]-0.004],[e[0]-0.005,e[1]-0.05,e[2]-0.004]],[0.0021,0.002,0.0016],4,{cap:'round',rings:8}),SKY)); }
      out.push(...scarf());
      return out; };

    /* ---- the shoulders: a slate yoke cap with a sky edge; the sleeves' bells and wrist bands (forearm); (the sleeve itself is painted) ---- */
    const shoulder=sd=>{ const out=[], r=0.0525*aw+0.0032;
      out.push(pc(new THREE.SphereGeometry(r,sg(14),sg(8),0,TAU,0,PI*0.56).scale(1.04,0.92,1.06),(x,y,z,c)=>{ c.set(SLATE); c.multiplyScalar(0.92+0.16*clamp(y*12)); }));
      out.push(solid(ofRingAt([0,-0.0125*0.92*0.0+r*0.92*Math.cos(PI*0.56),0],[0,1,0],r*1.04*Math.sin(PI*0.56)+0.0006,0.0023,5),SKY));
      return out; };
    const FA=mkAt([[0,D.ER,D.ER*1.04],[0.1,0.037*aw,0.038*aw],[0.34,0.0305*aw,0.03*aw],[(D.wrist/D.fore)-0.12,0.0235*aw,0.0235*aw],[D.wrist/D.fore,0.02*aw,0.02*aw]]);
    const forearm=sd=>{ const out=[], s0=0.006, s1=0.172, nu=sg(5), nv=sg(22);
      const fl=s=>0.0016+0.036*Math.pow(clamp((s-0.045)/0.127),1.7), P=(u,v)=>{ const s=lerp(s0,s1,u), q=FA(s/D.fore), a=v*TAU, f=fl(s); return [(q[0]+f)*Math.sin(a),-s,q[2]+(q[1]+f)*Math.cos(a)]; };
      const g=gridG(nu,nv,P,(x,y,z)=>[x,0,z]);
      out.push(...two(g,(u,v,x,y,z,c)=>{ c.copy(cCr); c.multiplyScalar(0.96+0.05*Math.sin(v*TAU*3)); if(u>0.93) c.copy(cSky); },(u,v,x,y,z,c)=>{ c.copy(cSky); c.multiplyScalar(0.9+0.14*u); },0.0026));
      { const q=FA(s1/D.fore), f=fl(s1), ring=ofRingAt([0,-s1-0.0006,0],[0,1,0],1,0.0021,5); ring.scale(q[0]+f,1,q[1]+f); ring.translate(0,0,q[2]); out.push(solid(ring,SLATE)); }
      // a brass stud on the slate wrist band
      return out; };

    /* ---- the trousers: slate, a tunic skirt in two halves that follow the thighs (cream outside, sky inside, a sky under-layer below the hem), a rope coil on each hip, leather knee pads ---- */
    const TH=mkAt([[0,0.088*D.tw,0.092*D.tw],[0.14,0.09*D.tw,0.094*D.tw],[0.42,0.077*D.tw,0.081*D.tw,-0.004],[0.76,Math.max(D.KR*1.1,0.057*D.tw),Math.max(D.KR*1.12,0.06*D.tw),-0.002],[1,D.KR,D.KR*1.04]]);
    const cw=D.cw, bs=[[0.5,0.041*cw,0.044*cw,0.007],[0.6,0.045*cw,0.048*cw,0.005],[0.66,0.042*cw,0.045*cw,0.005],[0.85,0.037*cw,0.039*cw],[1,0.033*cw,0.035*cw]];
    const SH=mkAt([[0,D.KR,D.KR*1.04],[0.14,0.0505*cw,0.054*cw,0.005],[0.3,0.052*cw,0.057*cw,0.011]].concat(bs));
    const gp=s=>0.004+0.064*Math.pow(clamp(s/0.2),1.25)-0.006*(1-sm(-0.04,0.03,s)), hemS=a=>0.165+0.11*Math.pow(Math.abs(Math.cos(a)),1.3);
    const skirtP=(sd,gOff,sOff,aR)=>(u,v)=>{
      const a=lerp(sd*PI/2-(aR||2.5),sd*PI/2+(aR||2.5),v), s1=hemS(a)+sOff, s=lerp(-0.022,s1,u), q=TH(s/D.thigh), g=gp(s)+gOff, ca=Math.cos(a), sa=Math.sin(a);
      let z=(q[1]+g)*ca+q[2]; const ts=torsoSize(X,D,clamp(-s/TK,-0.099,0.5));
      if(ca>0) z=lerp(z,Math.max(z,ts.rzBack+0.008+0.7*g),sm(0,0.5,ca)); else z=lerp(z,Math.min(z,-(ts.rz+0.008+0.7*g)),sm(0,0.5,-ca));
      return [(q[0]+g)*sa,-s,z]; };
    const kneePatch=(AT,len,t0,t1,m,flip)=>{ const nu=sg(6), nv=sg(12);
      const g=gridG(nu,nv,(u,v)=>{ const t=lerp(t0,t1,u), q=AT(t), ha=0.3+0.42*Math.pow(Math.sin(PI*clamp(0.07+0.86*u)),0.45), a=PI+(v-0.5)*2*ha; return [(q[0]+m)*Math.sin(a),-t*len,q[2]+(q[1]+m)*Math.cos(a)]; },(x,y,z)=>[x,0,z-0.2]);
      return bake(g,(u,v,x,y,z,c)=>{ c.set(LEATHER); if(u<0.01||u>0.99||v<0.01||v>0.99) c.copy(cCr); else c.multiplyScalar(0.95+0.1*(1-u)); }); };
    const thigh=sd=>{ const out=[], nu=sg(5), nv=sg(20), th=D.thigh;
      const g=gridG(nu,nv,skirtP(sd,0,0),(x,y,z)=>[x,0,z]);
      out.push(...two(g,(u,v,x,y,z,c)=>{ c.copy(cCr); c.multiplyScalar(0.93+0.09*(1-u)+0.025*Math.sin(v*TAU*5)); if(u>0.965) c.copy(cSn); },(u,v,x,y,z,c)=>{ c.copy(cSky); c.multiplyScalar(0.88+0.14*(1-u)); },0.0026));
      const gu=gridG(Math.max(2,Math.round(sg(2)*0.4)),nv,(u,v)=>{ const a=lerp(sd*PI/2-2.5,sd*PI/2+2.5,v), s1=hemS(a); return skirtP(sd,-0.0022,0.034)(lerp((s1-0.006+0.022)/(s1+0.034+0.022),1,u),v); },(x,y,z)=>[x,0,z]);
      out.push(...two(gu,(u,v,x,y,z,c)=>{ c.copy(cSky); c.multiplyScalar(0.96+0.06*u); if(u>0.8) c.copy(cSl); },(u,v,x,y,z,c)=>{ c.copy(cSkyD); },0.0024));
      { const H=[]; for(let k=0;k<=sg(22);k++){ const v=k/sg(22), p=skirtP(sd,-0.0022,0.034)(1,v); H.push([p[0],p[1]-0.0008,p[2]]); } out.push(solid(sweepTube(H,[0.0016,0.0016],4,{cap:'round',rings:H.length}),SLATE_D)); }
      // a slate side panel down the skirt, edged in sky
      { const g3=gridG(sg(5),sg(4),skirtP(sd,0.0017,-0.012,0.2),(x,y,z)=>[x,0,z]); out.push(bake(g3,(u,v,x,y,z,c)=>{ c.copy(cSl); c.lerp(cSkyD,0.25); c.multiplyScalar(0.95+0.1*(1-u)); if(v<0.01||v>0.99||u>0.99) c.copy(cSky); })); }
      // the outer seam: a thin sky cord from under the skirt to the knee
      { const sm2=[]; for(let k=0;k<=10;k++){ const s=lerp(0.2,th*0.93,k/10), q=TH(s/th); sm2.push([sd*(q[0]+0.0017),-s,q[2]]); } out.push(solid(sweepTube(sm2,[0.0016,0.0016],5,{cap:'round',rings:16}),SKY)); }
      // the rope coil on the front of the hip: three turns, two strands (cream and leather) tied with a brass clip
      { const a=sd*(PI/2+0.78), sa=Math.sin(a), ca=Math.cos(a), s=0.075, q=TH(s/th), g2=gp(s), p=[(q[0]+g2)*sa,-s,(q[1]+g2)*ca+q[2]], nn=new V3(sa,0.22,ca).normalize();
        for(let k=0;k<3;k++){ const o=0.0185+0.0052*k, R=0.03-0.0011*k; out.push(solid(ofRingAt([p[0]+nn.x*o,p[1]+nn.y*o,p[2]+nn.z*o],[nn.x,nn.y,nn.z],R,0.0036,5),k%2?LEATHER:CREAM)); }
        const o2=0.0185+0.0052*3; out.push(solid(sweepTube([[p[0]+nn.x*o2,p[1]+0.03,p[2]+nn.z*o2],[p[0]+nn.x*o2,p[1]-0.03,p[2]+nn.z*o2]],[0.0035,0.0035],5,{cap:'round',rings:4}),BRASS)); }
      out.push(kneePatch(TH,th,0.84,1.0,0.0027)); return out; };
    const shin=sd=>{ const out=[], len=D.shin, A=D.ankleH, sf=S.feet, wf=0.55+0.45*sf;
      out.push(kneePatch(SH,len,0.0,0.16,0.0027));
      { const sm3=[]; for(let k=0;k<=8;k++){ const t=lerp(0.18,0.55,k/8), q=SH(t); sm3.push([sd*(q[0]+0.0017),-t*len,q[2]]); } out.push(solid(sweepTube(sm3,[0.0016,0.0016],4,{cap:'round',rings:12}),SKY)); }
      // the trousers are bloused over the boots' fleece tops
      { const q=SH(0.5), ring=ofRingAt([0,0,0],[0,1,0],1,0.0075,5); ring.scale(q[0]+0.0062,1,q[1]+0.0062); ring.translate(0,-0.5*len,q[2]); out.push(solid(ring,SLATE)); }
      for(const [t,rr,col] of [[0.615,0.0105,SNOW],[0.585,0.0078,FEATH]]){ const q=SH(t), ring=ofRingAt([0,0,0],[0,1,0],1,rr,5); ring.scale(q[0]+0.0065,1,q[1]+0.0065); ring.translate(0,-t*len,q[2]); out.push(pc(ring,(x,y,z,c)=>{ c.set(col); if(Math.sin(x*420+z*310+y*200)>0.55) c.lerp(cFe,0.7); })); }
      // the ankle rope: two strands twisted, wrapped twice
      { const t0=0.76, t1=0.975, N=18; for(let st=0;st<2;st++){ const P=[]; for(let k=0;k<=N;k++){ const f=k/N, tt=lerp(t0,t1,f), q=SH(tt), a=f*2*TAU+st*PI; P.push([(q[0]+0.0045)*Math.cos(a),-tt*len,q[2]+(q[1]+0.0045)*Math.sin(a)]); }
          out.push(solid(sweepTube(P,[0.0034,0.0034,0.0034],4,{cap:'round',rings:N}),st?LEATHER_D:CREAM)); } }
      // the sole: a flat welt with a pale midsole and a dark tread, a little wider than the shoe
      { const g=new THREE.CylinderGeometry(1,1,0.014,sg(26),3,false); g.scale(0.037*wf+0.0055,1,0.108*sf+0.004); g.translate(0,0,-0.0485*sf); g.rotateY(-sd*0.1); g.translate(0,-len-A+0.007,0);
        out.push(pc(g,(x,y,z,c)=>{ const yy=y+len+A; c.set(SOLE); if(yy>0.0075) c.copy(cRand); if(yy>0.0075&&Math.abs(Math.sin(z*160))>0.9) c.copy(cLe); })); }
      return out; };

    /* ================= extras: the scarf's two tails and the hair's tails sway; the ear feather; the glint ================= */
    const extras=(rig,Xx,has)=>{   // has(slot): this outfit's item for the slot is worn: the scarf's tails go with the top, the hair's tails with the hair, the ear feather and the goggle's glint with the hat
      const sgx=Xx.sg, wTop=has('top'), wHair=has('hair'), wHat=has('hat'); let tA,tB,hg,fg;
      // the scarf tails: striped ribbons from the knot, blown back and to the left, each with its own twist, a slate end band and a fringe
      const tails=[];
      const mkTail=(len,ph,x0,zoff,twist)=>{ const g=new THREE.Group(), P=[], N=9, parts=[];
        for(let i=0;i<=N;i++){ const s=i/N, e=Math.pow(s,1.3); P.push([x0-0.27*len*e+0.03*Math.sin(s*8+ph)*s,-0.82*len*s,zoff+0.3*len*e+0.024*Math.sin(s*6.5+ph+1)*s]); }
        const lenY=0.82*len;
        parts.push(pc(strip(P,u=>0.056+0.006*u,u=>[Math.cos(twist+1.5*u),0,Math.sin(twist+1.5*u)],sgx(80),0.0032),(x,y,z,c)=>{ const yy=-y; if(yy>lenY-0.05){ c.copy(cSl); if(yy>lenY-0.026&&yy<lenY-0.02) c.copy(cSn); } else stripeC(yy/0.115+ph*0.2,c); }));
        const e=P[N]; parts.push(...tuft(e[0],e[1]-0.002,e[2],7,0.034,0.0019,CREAM,0.04,SKY));
        const m=new THREE.Mesh(merge(parts),matChar); m.castShadow=true; g.add(m); return g; };
      const kp=ringAt(KNOT_YD+0.012,0.024,KNOT_PHI);
      if(wTop){ tA=mkTail(1.3,0,-0.008,0.012,0.5); tB=mkTail(1.05,2.2,0.012,-0.002,0.0);
        for(const t of [tA,tB]){ t.position.set(kp[0],kp[1],kp[2]); rig.spine.add(t); tails.push(t); } }
      // the hair's tails: bowed blades laid over the curtain's end and falling past it, blown back and to the left; they pivot near the nape
      if(wHair){ const fs=rig.dims.faceScale, parts=[], rng=mulberry32(33), nL=Math.max(7,sgx(8)), yR=yEnd+0.06, tR=(yTop-yR)/(yTop-yEnd), rR=cRing(tR);
      const zcR=rR.zc+0.045*drift(yR), xcR=-0.035*drift(yR);
      for(let i=0;i<nL;i++){ const f=nL>1?i/(nL-1)*2-1:0, af=Math.abs(f), a=f*1.15, x0=xcR+rR.rx*Math.sin(a)*0.97, z0=zcR+rR.rz*Math.cos(a)*0.9-0.002, L=(0.17+0.11*rng())*Lh*(1-0.28*f*f), dx=0.03+0.05*rng(), dz=0.07+0.06*rng(), P=[], tone=rng();
        for(let k=0;k<=4;k++){ const s2=k/4, e=Math.pow(s2,1.5); P.push([x0*(1-0.1*s2)-dx*e+0.007*Math.sin(s2*6+i),yR-L*s2,z0+dz*e+0.005*Math.sin(s2*5+i*2)]); }
        const tw=u=>0.35*f+0.6*u*(i%2?1:-1);
        for(const g of lockBlade(P,0.05*(1-0.2*af)*hvS,0.35,sgx(8),tw,(u,v,x,y,z,c)=>{ hairPaintFn(x,y,z,c); c.lerp(cSn,0.18*tone+0.12*Math.abs(2*v-1)); if(u>0.85) c.lerp(cSkyL,0.35*(u-0.85)/0.15); },u=>(0.3+0.7*Math.min(1,u*3))*(1-Math.pow(u,2.2)))) parts.push(g.scale(fs[0],1,1)); }
      const hm=new THREE.Mesh(merge(parts),matChar); hm.castShadow=true; hg=new THREE.Group(); hg.add(hm); hm.position.set(0,-yR,-zcR); hg.position.set(0,yR,zcR); rig.head.add(hg); }
      // the ear feather: a long grey-white vane barred in slate, a short sky-tipped one behind it, loose so that it sways
      if(wHat){ fg=new THREE.Group(); const fp=[];
      { const P=[[0,0,0],[0.02,0.022,0.04],[0.033,0.058,0.08],[0.025,0.103,0.112]];
        fp.push(...feather(P,0.03,(d,c,e)=>{ c.copy(d<0.02?cSn:cFe); if(d>0.02&&((d-0.02)/0.017%1)<0.34) c.lerp(cSl,0.8*(1-0.7*e)); c.lerp(cSn,0.55*e*e); if(d>0.128) c.copy(cSn); if(d>0.139) c.lerp(cSkyD,0.5); },[1,0,0],sgx(16),0.0019));
        const P2=[[0.0,0,0.004],[0.022,0.012,0.04],[0.034,0.034,0.07]];
        fp.push(...feather(P2,0.022,(d,c,e)=>{ c.copy(cFe); c.lerp(cSn,0.5*e); if(d>0.05) c.lerp(cSky,0.9); if(d<0.016) c.copy(cSn); },[1,0,-0.2],sgx(10),0.0015)); }
      const fm=new THREE.Mesh(merge(fp),matChar); fm.castShadow=true; fg.add(fm); fg.position.set(0.108,0.004,0.03); fg.rotation.set(0,0,-0.02); rig.head.add(fg); }
      // the glint in the goggle's lens (unlit, small)
      if(wHat&&glintGeo) rig.head.add(new THREE.Mesh(merge([glintGeo]),matGlow));
      rig.anims.push((t,dt,mv)=>{ const k=Math.min(1,mv);
        if(tA){ tA.rotation.x=-(0.04+0.5*k)+Math.sin(t*1.3)*0.045*(0.5+k); tA.rotation.z=Math.sin(t*0.9+1)*0.05*(0.4+k);
          tB.rotation.x=-(0.06+0.56*k)+Math.sin(t*1.6+2.1)*0.05*(0.5+k); tB.rotation.z=Math.sin(t*1.1+3)*0.06*(0.4+k); }
        if(hg){ hg.rotation.x=-0.02-0.12*k+Math.sin(t*1.2)*0.03; hg.rotation.z=Math.sin(t*0.8+0.5)*0.035*(0.5+k); }
        if(fg){ fg.rotation.x=Math.sin(t*1.9)*0.05*(0.4+k); fg.rotation.z=-0.02+Math.sin(t*1.4+1)*0.05*(0.4+k); } });
    };

    /* ================= the weapon dressing: white wax-wrapped grips, cream ash, silver, sky thread, slate feather-vein lines, a lens and a feather tuft ================= */
    const dress={ shape:{sword:'pick',bow:'longbow',staff:'feather'}, grip:CREAM, metal:0xd9e2ea, wood:0xe8e0c8, accent:SKY,
      trim:(c,u,part)=>{ const f=((u/0.03)%1+1)%1;
        if(part==='grip'){ if(((u/0.014)%1+1)%1<0.4) c.lerp(cSky,0.92); return; }
        if(f<0.1) c.lerp(cSl,0.85); else if(f>0.5&&f<0.56) c.lerp(cSkyD,0.8); },
      charm:()=>{ const lit=[], glow=[];
        lit.push(solid(sweepTube([[0,0.004,0],[0.002,-0.016,0.003],[0.003,-0.034,0.004],[0.0035,-0.048,0.004]],[0.0014,0.0014,0.0014,0.0014],4,{cap:'round',rings:8}),CREAM));
        const lc=[0.0035,-0.0635,0.004];
        lit.push(solid(ofRingAt(lc,[0.25,0,1],0.0125,0.0019,sg(8)),0xdfe7ee), solid(ofRingAt([lc[0],lc[1]+0.0125,lc[2]],[0.25,0,1],0.0032,0.0014,6),0xdfe7ee));
        lit.push(pc(csph(1,12,8).scale(0.0114,0.0114,0.0032).rotateY(0.24).translate(lc[0],lc[1],lc[2]),(x,y,z,c)=>{ const u=(x-lc[0])/0.0114, v=(y-lc[1])/0.0114; c.copy(cSky); const gl=Math.max(0,-u*0.6+v*0.8); c.lerp(cSkyL,0.6*gl); c.lerp(cSn,0.5*gl*gl*gl); c.lerp(cSkyD,0.4*sm(0.6,1,Math.hypot(u,v))); }));
        glow.push(pc(csph(1,8,6).scale(0.0036,0.0021,0.0009).rotateZ(-0.6).rotateY(0.24).translate(lc[0]-0.0042,lc[1]+0.0042,lc[2]-0.0036),(x,y,z,c)=>c.set(GLINT)));
        // the feather tuft: three small barred feathers on a sky-bound thread
        lit.push(solid(sweepTube([[-0.012,0.004,0.0],[-0.014,-0.02,0.003],[-0.0155,-0.036,0.005]],[0.0012,0.0012,0.0012],4,{cap:'round',rings:6}),CREAM), solid(ofRingAt([-0.0148,-0.03,0.004],[0,1,0],0.0036,0.0017,6),SKY));
        for(const [dx,L,rot] of [[-0.0125,0.058,-0.5],[-0.0155,0.07,0.0],[-0.0185,0.052,0.5]]){ const P=[[-0.0155,-0.034,0.005],[-0.0155+rot*0.016,-0.034-L*0.5,0.007+rot*0.004],[-0.0155+rot*0.05,-0.034-L,0.008+rot*0.008]];
          lit.push(...feather(P,0.0135,(d,c,e)=>{ c.copy(cSn); if(d>0.014&&((d-0.014)/0.014%1)<0.3) c.lerp(cFe,0.8*(1-e)); if(d>L*0.8) c.lerp(cSky,0.6); },[0.3,0,1],8,0.0011)); }
        return {lit,glow}; } };

    return {
      aura:{col:0xdcefff,col2:0xffffff,style:'orbit',ring:false,n:6,shape:'wisp',deco:'none'},   /* this set's own aura (kit.aura: model.js) */
      main:{top:0x8fb8d8,bottom:0x4a5560,shoes:0x6a5a48,hat:0x6a5a48}, /* the main colour of each piece, for the player's recolouring (outfit-tools.js: ofTinter) */ bootTop:0.6, shinCut:0.55, boot:true, skinFrom:0.6, hairColor:HAIR, eyeColor:EYE,
      eyes:{iris:0.82,h:0.7,w:1.1,lash:1.9,hl:1,tilt:0.24,browLift:0.004,browThick:0.85},
      cuts:{torso:[0.012,0.07,0.405,0.498],upperArm:[0.158/D.upper,0.17/D.upper,0.19/D.upper,0.202/D.upper],foreArm:[0.17/D.fore,0.2/D.fore,WRIST/D.fore]},
      paint, head, hair, mark, torso, shoulder, forearm, thigh, shin, extras, dress,
    };
  };
})();
OUTFITS.sorrel=oxPlus(OUTFITS.sorrel,(X,D)=>({   // round 4: a climbing rope coil, a rolled bivouac pack, a brass plate on one shoulder
  torso:()=>oxCoil(X,D,{col:0xd88a3a,col2:0xf3ead2,dir:-1}).concat(oxPack(X,D,{col:0x58c0b8,trim:0xe8e2d4,w:0.095,h:0.1})),
  shoulder:sd=>sd>0?oxPauldron(X,D,{col:0xc8d8e4,trim:0xc59c39,r:0.065}):[]}));
oxTune('sorrel',{eyeTilt:0.12,lips:0.9,undertone:-0.2,blush:0.3,cheeks:0.9,smile:0.15,earSize:1.0});
OUTFITS.sorrel=oxPlus(OUTFITS.sorrel,(X,D)=>({   // face round 5: a calm river-guide: snowmelt-blue eyes, tiny dew dots under one eye, a teal sprig and bead strand at the ear
  mark:F=>oxMarks(F,[{t:'tear',side:1,col:0xbfe0ea},{t:'crow',col:0x9ab0b8}]),
  hair:()=>oxHairBits(X,[{t:'sprig',side:1,col:0x58c0b8},{t:'beads',side:-1,col:0x58c0b8,col2:0xe8e2d4}]),
  kit:{eyeColor:0x58b0c8,eyes:{iris:1.05}}}));
oxTune('sorrel',{height:1.0,build:1.08,chest:0.95,shoulders:1.15,waist:0.95,hips:1.08,torso:1.0,legs:1.05,thighs:1.2,arms:1.1,neck:1.0,head:1.0});
OUTFITS.sorrel=oxPlus(OUTFITS.sorrel,(X,D)=>({   // uniqueness round 1: a swimmer's broad shoulders and strong legs, and a teal oilcloth overskirt lifted at the front
  hips:()=>oxSkirt(X,D,{col:0x2f8a88,col2:0xe8e2d4,len:0.34,flare:1.0,rise:0.14})}));
