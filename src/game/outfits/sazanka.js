//@ Sazanka's outfit (a night courier): a peaked ink hood with a tall collar and a violet bead, one long cord-tied lock, slit eyes, a crossover wrap with a cord sash and moon-grey tails, cord-bound limbs, split-toe shoes, and the lacquer-and-cord weapon dressing
/* ---------- Sazanka: risk DPS, dark + air. Design: docs/skillkits/looks/sazanka.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: ink 0x1b1f2a, indigo 0x2f3f6b, moon-grey 0xc9ccd6 (only the sash tails and the tassels), vermilion 0xc23b2a (cords and thin trim only, never an area), violet 0x6a5ac8 + white-blue
   wisps for the small glow (the dark and the air). Silhouette: the narrowest and lowest of the eight: a peaked hood with a tall collar, one long lock, a low cord sash with two trailing tails, bound limbs. */
CHAR_MODELS.sazanka={id:'sazanka',name:'Sazanka',signature:true, hairGrad:{mode:'ombre',c2:0x6a4ab0,c3:0xb89aff}, items:{glove:'Cord-bound gloves',hat:'Dusk hood',hair:'Cord lock',face:'Tally marks',top:'Runner wrap',bottom:'Taper wraps',shoes:'Soft stalks',weapon:'Cord sheath'},sexes:['female'],
  note:'The night courier: the narrowest and lowest silhouette, drawn for a small, long-legged runner.',
  ranges:{height:[0.92,1.04],build:[0.88,1.05],chest:[0.6,1.1],shoulders:[0.88,1.05],arms:[0.82,1.1],thighs:[0.85,1.1],neck:[0.85,1.1],hands:[0.85,1.1],head:[0.92,1.06],eyeTilt:[0.1,0.7],hairLength:[0.7,1.05],hairVolume:[0.9,1.1]},
  setups:[{id:'sazanka',name:'Sazanka',sex:'female',def:true,note:'The courier as drawn: small, long-legged, narrow-eyed.',v:{height:0.95,build:0.9,chest:0.85,shoulders:0.93,waist:0.88,torso:0.97,legs:1.12,thighs:0.95,arms:0.9,neck:0.95,hands:0.95,feet:0.95,jaw:0.92,chin:0.95,cheeks:0.9,eyeSize:1.05,eyeHeight:0.05,eyeTilt:0.45,brow:0.3,noseSize:0.9,mouthSize:0.9,lips:0.9,smile:0.1,hairLength:0.9,bangs:1.1}}]};

OUTFITS.sazanka=(function(){
  const INK=0x1b1f2a, INDIGO=0x2f3f6b, INDIGO_D=0x222c4e, BODICE=0x252f56, LAPEL=0x3b4e88, VERM=0xc23b2a, MOON=0xc9ccd6, LAC=0x1e1c22, STEEL=0x4a5260, VIOLET=0x6a5ac8, WISP=0xdfe8ff, HAIR=0x1b1c27, TAG=0x7a5a3c;
  const cIL=ofCol(0x2a3248), cI=ofCol(INK), cIn=ofCol(INDIGO), cV=ofCol(VERM), cM=ofCol(MOON), cW=ofCol(WISP), cVi=ofCol(VIOLET);
  const V3=THREE.Vector3, G=faceG, sm=faceSm;
  // the peak of the hood (head-local, units of the skull): a cone curling up and back, its tip drooping; the violet bead sits at the tip (extras)
  const PK=[[0,0.045,0.065],[0,0.095,0.13],[0,0.12,0.205],[0,0.095,0.265]], PKCV=new THREE.CatmullRomCurve3(PK.map(p=>new V3(p[0],p[1],p[2])));

  /* a patch of cloth as a grid P(u,v) -> [x,y,z], u and v in 0..1; the winding is chosen so the faces look toward out(x,y,z); `finish` bakes the colours (colFn(u,v,x,y,z,c)) and makes it a plain triangle list */
  const gridIdx=(nu,nv,P,out)=>{
    const pos=new Float32Array((nu+1)*(nv+1)*3), uv=new Float32Array((nu+1)*(nv+1)*2), idx=[];
    for(let i=0;i<=nu;i++) for(let j=0;j<=nv;j++){ const p=P(i/nu,j/nv), k=i*(nv+1)+j; pos[k*3]=p[0]; pos[k*3+1]=p[1]; pos[k*3+2]=p[2]; uv[k*2]=i/nu; uv[k*2+1]=j/nv; }
    for(let i=0;i<nu;i++) for(let j=0;j<nv;j++){ const a=i*(nv+1)+j, b=a+1, c=a+nv+1, d=c+1; idx.push(a,c,b,b,c,d); }
    let s=0; const A=new V3(), B2=new V3(), C=new V3(), n=new V3();
    for(let t=0;t<idx.length;t+=3){ A.fromArray(pos,idx[t]*3); B2.fromArray(pos,idx[t+1]*3); C.fromArray(pos,idx[t+2]*3); const mx=(A.x+B2.x+C.x)/3, my=(A.y+B2.y+C.y)/3, mz=(A.z+B2.z+C.z)/3, o=out(mx,my,mz);
      n.crossVectors(B2.sub(A),C.sub(A)); s+=n.x*o[0]+n.y*o[1]+n.z*o[2]; }
    if(s<0) for(let t=0;t<idx.length;t+=3){ const q=idx[t+1]; idx[t+1]=idx[t+2]; idx[t+2]=q; }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.setIndex(idx); return g; };
  const finish=(g,colFn)=>{ smoothN(g); const ix=g.index.array, p=g.attributes.position, nr=g.attributes.normal, uv=g.attributes.uv, m=ix.length, pos=new Float32Array(m*3), nor=new Float32Array(m*3), col=new Float32Array(m*3), c=new THREE.Color();
    for(let k=0;k<m;k++){ const v=ix[k]; pos[k*3]=p.getX(v); pos[k*3+1]=p.getY(v); pos[k*3+2]=p.getZ(v); nor[k*3]=nr.getX(v); nor[k*3+1]=nr.getY(v); nor[k*3+2]=nr.getZ(v);
      colFn(uv.getX(v),uv.getY(v),pos[k*3],pos[k*3+1],pos[k*3+2],c); col[k*3]=c.r; col[k*3+1]=c.g; col[k*3+2]=c.b; }
    const o=new THREE.BufferGeometry(); o.setAttribute('position',new THREE.BufferAttribute(pos,3)); o.setAttribute('normal',new THREE.BufferAttribute(nor,3)); o.setAttribute('color',new THREE.BufferAttribute(col,3)); return o; };
  // the inside of a one-sided cloth: a copy pushed d inward along its normals, winding flipped
  const lining=(g,d)=>{ smoothN(g); const h=g.clone(), p=h.attributes.position, n=g.attributes.normal; for(let i=0;i<p.count;i++) p.setXYZ(i,p.getX(i)-n.getX(i)*d,p.getY(i)-n.getY(i)*d,p.getZ(i)-n.getZ(i)*d);
    const ix=h.index.array; for(let t=0;t<ix.length;t+=3){ const q=ix[t+1]; ix[t+1]=ix[t+2]; ix[t+2]=q; } return h; };
  // a limb's section at t (0..1 down it) from its stations, the same smooth curve `limb` draws: [half-width x, half-depth z, z offset]
  const mkAt=st=>{ const n=st.length, m=[1,2,3].map(c=>{ const out=[]; for(let i=0;i<n;i++){ const a=st[Math.max(0,i-1)], b=st[Math.min(n-1,i+1)], dt=(b[0]-a[0])||1; let s=((b[c]||0)-(a[c]||0))/dt;
      const l=i>0?((st[i][c]||0)-(st[i-1][c]||0)):0, r=i<n-1?((st[i+1][c]||0)-(st[i][c]||0)):0; if(l*r<=0) s=0; out.push(s); } return out; });
    return t=>{ t=clamp(t); let i=1; while(i<n-1&&t>st[i][0]) i++; const a=st[i-1], b=st[i], h=(b[0]-a[0])||1, u=clamp((t-a[0])/h), u2=u*u, u3=u2*u;
      return [1,2,3].map((c,ci)=>(2*u3-3*u2+1)*(a[c]||0)+(u3-2*u2+u)*h*m[ci][i-1]+(-2*u3+3*u2)*(b[c]||0)+(u3-u2)*h*m[ci][i]); }; };
  // a cord wound round a limb (y down the limb): from depth s0 to s1, `turns` turns, a thread `off` outside the section at(t); tight(f) bends the pace (a tighter coil at one end)
  const spiral=(at,len,s0,s1,turns,off,r,ph,tight)=>{ const P=[], N=Math.max(10,Math.round(turns*9));
    for(let k=0;k<=N;k++){ const f=k/N, s=lerp(s0,s1,f), q=at(s/len), a=(tight?tight(f):f)*turns*TAU+(ph||0); P.push([(q[0]+off)*Math.cos(a),-s,q[2]+(q[1]+off)*Math.sin(a)]); }
    return sweepTube(P,[r,r],5,{cap:'round',rings:N}); };
  // a tassel: n thin strands hanging from (x, y, z), a little different in length, fanned by `spread`
  const tuft=(x,y,z,n,len,r,col,spread)=>{ const out=[]; for(let i=0;i<n;i++){ const f=n>1?i/(n-1)*2-1:0, L=len*(0.85+0.3*((i*7)%5)/4);
    out.push(solid(sweepTube([[x,y,z],[x+f*spread*0.5,y-L*0.5,z+0.002*f],[x+f*spread,y-L,z+0.004*f]],[r,r*0.9,r*0.4],5,{cap:'point',rings:6}),col)); } return out; };

  return function(X,D){
    const {S,sg,fem,skinPaint}=X, TK=D.TK, aw=D.aw, B=D.B, lr=D.lr, ch=S.chest, HT=typeof HEAD_TALL!=='undefined'?HEAD_TALL:1.1;
    // ---- the torso's real surface (the same formulas as buildTorso), so cloth can lie on it, bust and hips included ----
    const nt=Math.max(0.7,(D.headY-0.03)/TK), PROF=(fem?TORSO_F:TORSO_M).concat([[D.neckR*1.3,0.572],[D.neckR*1.06,0.6],[D.neckR,0.635],[D.neckR*0.98,nt]]), rAt=yd=>profR(PROF,yd);
    const WY=fem?0.215:0.15;
    const kx=yd=>{ const sN=sm(0.5,0.6,yd), up=sm(0.22,0.4,yd)*(1-sN); return lerp(B*(fem?1:1.04),1.1,sN)*(1+(S.shoulders-1)*up+(S.waist-1)*G(yd,WY,0.11)+(S.hips-1)*G(yd,-0.03,0.1)); };
    const kz=(yd,front)=>{ const sN=sm(0.5,0.6,yd), up=sm(0.22,0.4,yd)*(1-sN), gw=G(yd,WY,0.11), gh=G(yd,-0.03,0.1), belly=G(yd,0.1,0.13)*(B-1)*1.4;
      return lerp((fem?0.66:0.62)*B,0.94,sN)*(1+(front?belly:belly*0.3)*(1-sN))*(1+(S.waist-1)*0.7*gw+(S.hips-1)*0.5*gh+(S.shoulders-1)*0.2*up); };
    const surfZ=(x,yd,front)=>{ const r=rAt(yd), a=kx(yd), x0=clamp(x/a,-r,r), z0=Math.sqrt(Math.max(0,r*r-x0*x0)), ax=Math.abs(x), sN=sm(0.5,0.6,yd);
      let z=(front?-z0:z0)*kz(yd,front);
      if(front){ z-=0.008*G(yd,0.1,0.08)*(1-G(ax,0,0.04))*(fem?0.5:1);
        if(!fem) z+=0.012*B*G(yd,0.33,0.1)*(1-0.4*G(ax,0,0.12))-0.003*B*(0.5+0.5*ch)*G(yd,0.37,0.05)*G(ax,0.07*B,0.07);
        else { const cy=0.315-0.012*(ch-1), wx=0.05*(0.86+0.14*ch), wl=0.036*(0.8+0.2*ch), lobe=sd=>{ const dx=x-sd*0.056*B, dy=yd-cy; return Math.exp(-Math.pow(dx/wx,2))*Math.exp(-Math.pow(dy/(dy>0?0.075:wl),2)); };
        z-=0.034*lr*ch*(1-(1-lobe(-1))*(1-lobe(1))); } }
      else { z+=0.012*B*G(yd,0.37,0.07)*G(ax,0.075*B,0.045); z+=(fem?0.034:0.022)*B*G(yd,0,0.055)*G(ax,0.066*B,0.05); z-=0.008*G(ax,0,0.018)*G(yd,0.2,0.18); }
      return z-sN*(yd-0.5)*0.1; };
    const latX=yd=>rAt(yd)*kx(yd);                                     // the torso's half-width at a design height
    // a point on a closed path round the torso at design height yd, m metres off the surface (phi = 0 at the front, + toward +x), as [x, y, z]
    const ringAt=(yd,m,phi)=>{ const s=Math.sin(phi), c=Math.cos(phi), x=latX(yd)*s; return [x+m*s,yd*TK,surfZ(x,yd,c>0)-m*c]; };
    // the hair: blue-black with an indigo sheen band across the crown and a glossy streak where the normal faces the front and up (painted with the normals: `paint`)
    const hp2=T=>(x,y,z,nx,ny,nz,c)=>{ T.hp(x,y,z,c); c.lerp(ofCol(0x3a4780),0.2*G(y,0.05,0.032)*(z<0.04?1:0.4)); const gl=Math.pow(Math.max(0,ny*0.37-nz*0.93),5); c.lerp(ofCol(0x8a96cc),0.4*gl); };

    /* ---- the body's paint: a deep-indigo wrap top, ink sleeves to the wrist, indigo leggings, soft ink shoes ---- */
    const FA=mkAt([[0,D.ER,D.ER*1.04],[0.1,0.037*aw,0.038*aw],[0.34,0.0305*aw,0.03*aw],[D.wrist/D.fore-0.12,0.0235*aw,0.0235*aw],[D.wrist/D.fore,0.02*aw,0.02*aw]]);
    const UA=mkAt([[0,0.05*aw,0.052*aw],[0.13,0.0505*aw,0.053*aw],[0.38,0.045*aw,0.048*aw,-0.003],[0.7,0.037*aw,0.039*aw],[1,D.ER,D.ER*1.04]]);
    const TH=mkAt([[0,0.088*D.tw,0.092*D.tw],[0.14,0.09*D.tw,0.094*D.tw],[0.42,0.077*D.tw,0.081*D.tw,-0.004],[0.76,Math.max(D.KR*1.1,0.057*D.tw),Math.max(D.KR*1.12,0.06*D.tw),-0.002],[1,D.KR,D.KR*1.04]]);
    const SH=mkAt([[0,D.KR,D.KR*1.04],[0.14,0.0505*D.cw,0.054*D.cw,0.005],[0.3,0.052*D.cw,0.057*D.cw,0.011],[0.5,0.04*D.cw,0.043*D.cw,0.007],[0.75,0.033*D.cw,0.035*D.cw],[1,0.028*D.cw,0.03*D.cw]]);
    const WRIST=0.238;   // where the sleeve ends and the hand's skin starts (metres down the forearm)
    const bodyPaint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': if(y<0.012) c.set(INDIGO); else if(y>0.062&&y<0.6) { c.set(BODICE); if(y>0.1&&Math.abs(x)>latX(y)*0.9) c.set(INK); } else c.set(INK); return;   // leggings' top under the sash; the bodice with ink flanks; the neck inside the collar
        case 'upperArm': c.set(INK); return;
        case 'foreArm': if(y<-WRIST) skinPaint(c); else c.set(INK); return;
        case 'thigh': c.set(INDIGO); c.multiplyScalar(0.94+0.1*Math.max(0,-z*6)); return;                 // a little lighter on the front of the leg
        case 'shin': c.set(INDIGO); return;
        case 'foot': { c.set(INK); if(y<-D.ankleH+0.011){ c.set(0x4a5268); return; }                      // the soft sole
          if(z<-0.092) c.set(INDIGO);                                                                       // the toe box in indigo
          if(z<-0.082&&Math.abs(x)<0.0045) c.set(0x090b11);                                                 // the split between the big toe and the others
          return; }
      }
      c.set(INK);
    };

    /* ================= the hood: a close ink hood pushed back off the face, a peak at the back, a violet bead at its tip ================= */
    const hood=(F,T)=>{
      const out=[], fs=F.fs, nr=sg(11), nc=sg(40);
      const rim=th=>{ const f=Math.abs(th)/Math.PI; return Math.PI*(0.335+0.065*sm(0,0.5,f)+0.29*sm(0.45,1,f)+0.026*Math.exp(-Math.pow(th/0.33,2))); };   // the rim's polar angle: high on the brow (a small dip in the middle), over the ears, down at the nape
      const Rh=(th,ph)=>0.127+0.016*sm(0.5,1,Math.abs(th)/Math.PI)*sm(0.1,0.6,ph/Math.PI)+0.03*Math.exp(-Math.pow((Math.abs(th)-Math.PI)/0.7,2))*Math.exp(-Math.pow((ph-0.3*Math.PI)/(0.2*Math.PI),2));   // the dome swells toward the peak
      const surf=(th,ph,k)=>T.sp(th,ph,Rh(th,ph)+(k||0));
      const g=gridIdx(nr,nc,(u,v)=>{ const th=-Math.PI+v*TAU; return surf(th,rim(th)*u); },(x,y,z)=>[x,y,z]);
      T.fit(g);
      out.push(finish(g,(u,v,x,y,z,c)=>{ c.set(INK); c.lerp(cIL,0.9*(1-sm(0.3,0.8,Math.abs(v-0.5)*2))); if(u>0.9) c.set(INDIGO); if(u>0.9&&u<0.917) c.set(INK); c.multiplyScalar(0.92+0.12*Math.min(1,Math.max(0,y*9+0.5))); }), finish(lining(g,0.0042),(u,v,x,y,z,c)=>c.set(INDIGO_D)));
      // the rim cord (vermilion, thin) round the hood's edge from one side of the peak to the other, and a seam cord over the crown into the peak
      const rimP=[], nrm=sg(34); for(let k=0;k<=nrm;k++){ const th=-Math.PI*0.97+k/nrm*Math.PI*1.94; rimP.push(surf(th,rim(th),0.0012)); }
      out.push(solid(T.fit(sweepTube(rimP,[0.0017,0.0017],5,{cap:'round',rings:nrm})),VERM));
      const seamP=[]; for(let k=0;k<=8;k++){ const f=k/8; seamP.push(f<0.5?surf(0,rim(0)*(1-f*2),0.0013):surf(Math.PI,(f-0.5)*2*Math.PI*0.36,0.0013)); }
      out.push(solid(T.fit(sweepTube(seamP,[0.0013,0.0013],5,{cap:'round',rings:sg(14)})),VERM));
      // the peak: a cone that curls up and back from the hood's back, tied near its tip with a cord, a tassel hanging from the tip
      out.push(pc(sweepTube(PK,[0.07,0.055,0.034,0.011],sg(12),{cap:'point',rings:sg(12)}),(x,y,z,c)=>{ c.set(INK); if(z>0.2) c.set(INDIGO_D); }));
      const t0=PKCV.getPoint(0.8), tg0=PKCV.getTangent(0.8), tip=PKCV.getPoint(0.97);
      out.push(solid(ofRingAt([t0.x,t0.y,t0.z],[tg0.x,tg0.y,tg0.z],0.0125,0.0028,sg(6)),VERM));
      out.push(solid(csph(0.0048,sg(8),sg(6)).translate(tip.x,tip.y-0.001,tip.z),VERM));
      out.push(...tuft(tip.x,tip.y-0.005,tip.z,5,0.052,0.0022,MOON,0.018));
      // the drawstring (the right side only: the long lock hangs on the left): a vermilion cord from the rim with a moon-grey tassel
      { const sd=1, p=surf(0.56*Math.PI,rim(0.56*Math.PI),0.001), rx=p[0]*fs[0], ry=p[1]*fs[1], rz=p[2], x1=0.121;
        out.push(solid(sweepTube([[rx,ry,rz],[x1,ry-0.03,rz-0.004],[x1+0.002,ry-0.07,rz-0.012],[x1,ry-0.1,rz-0.018]],[0.002,0.002,0.002,0.002],5,{cap:'round',rings:sg(12)}),VERM));
        out.push(solid(csph(0.0058,sg(8),sg(6)).scale(1,1.2,1).translate(x1,ry-0.106,rz-0.018),VERM));
        out.push(...tuft(x1,ry-0.111,rz-0.018,5,0.046,0.0021,MOON,0.014)); }
      return out;
    };

    /* ================= the hair: a short crop under the hood, a long jagged fringe, a short lock on the right and one long lock on the left, tied with cord ================= */
    const hair=(F,T)=>{
      const out=[], hp=hp2(T), hl=T.hl, bg=T.bg, R=T.R;
      out.push(paint(T.fit(shell(0.113*T.hv,0,0.5*Math.PI,0,0.3,sg(28),sg(10))),hp));                                  // the crop, mostly under the hood
      if(bg>=0.05){ const rng=mulberry32(91), n=8;
        for(let i=0;i<n;i++){ const f=i/(n-1)*2-1, af=Math.abs(f), yb=0.072-0.03*bg-0.012*bg*(i%2)-0.012*rng()*bg, ph1=Math.acos(clamp(yb/R,-0.9,0.9)), w=0.0155-0.0035*af+0.003*rng();
          out.push(paint(T.scalpLock(f*1.0,0.29*Math.PI,ph1,[0.009,w,w*1.1,w*0.6,0.0015],{sw:0.2*(0.7+0.6*(1-af))+f*0.22,tip:0.11*bg,lift:0.002+0.006*(1-af),k:0.42}),hp)); } }
      // the short lock in front of the right ear
      { const len=0.075*hl, P=[T.sp(1.2,0.34*Math.PI,R),T.sp(1.33,0.5*Math.PI,R),[0.103,-0.03,-0.04],[0.099,-0.03-len*0.55,-0.045],[0.088,-0.03-len,-0.052]];
        const g=sweepTube(P,[0.007,0.0135,0.0125,0.0075,0.0015],sg(8),{cap:'point',rings:sg(14)}); T.flat(g,0.5); out.push(paint(T.hang(g),hp)); }
      // the long lock on the left: from under the hood, past the ear, over the collarbone to the chest; three vermilion cords tie it
      { const L=Math.pow(hl,0.8), P=[T.sp(-1.2,0.32*Math.PI,R),[-0.104,-0.005,-0.036],[-0.106,-0.07,-0.05],[-0.108,-0.15*L,-0.066],[-0.1,-0.225*L,-0.074],[-0.09,-0.3*L,-0.073],[-0.082,-0.37*L,-0.07]];
        const rad=[0.012,0.0155,0.0165,0.0155,0.0135,0.0095,0.0015], g=sweepTube(P,rad,sg(9),{cap:'point',rings:sg(26)});
        out.push(paint(T.hang(g),hp));
        const cv=new THREE.CatmullRomCurve3(P.map(p=>new V3(p[0],p[1],p[2]))), rf=u=>{ const x=u*(rad.length-1), i=Math.min(rad.length-2,Math.floor(x)), f=x-i; return lerp(rad[i],rad[i+1],f*f*(3-2*f)); };
        for(const u of [0.38,0.62,0.84]){ const p=cv.getPoint(u), t=cv.getTangent(u); out.push(solid(ofRingAt([p.x*F.fs[0],p.y,p.z],[t.x,t.y,t.z],rf(u)+0.0012,0.0027,sg(6)),VERM)); }
        const e=cv.getPoint(0.84); out.push(...tuft(e.x*F.fs[0],e.y-0.004,e.z-0.012,2,0.03,0.0018,VERM,0.012)); }
      return out;
    };

    /* ================= the face: three tally ticks under the right eye, and the slit pupils drawn over the eyes' own ================= */
    const EYES={iris:0.92,h:0.9,w:1.1,lash:1.6,hl:1,tilt:0.12,browLift:0.002,browThick:0.9};
    const mark=F=>{ const out=[];
      for(let i=0;i<3;i++){ const g=csph(1,sg(8),sg(6)).scale(0.0015,0.0078+0.0009*(i===1?1:0),0.0007); out.push(solid(F.place(g,0.042+i*0.0085,-0.034,0.0006),INK)); }
      // the slit: a patch over each iris (its colours, lighter near the slit) with a narrow ink slit down the middle; it lies a hair in front of the iris and of the round pupil beneath
      const E=S.eyeSize*(fem?1.03:1)*0.74, eI=EYES.iris, rxI=0.0185*E*eI, ryI=0.0242*E*eI*Math.min(1,EYES.h*1.05), cy=-0.0008*E, ex=0.046*S.eyeGap*F.fs[0], ey=(-0.002+0.012*S.eyeHeight)*HT;
      const px=0.0088*E*eI, py=0.0138*E*eI, wx=rxI*0.66, wy=ryI*0.74, eyeC=ofCol(0x8a86a8), white=ofCol(0xf7f3ef), ink=ofCol(0x0c0b15), ring=ofCol(0xc4bfe6);
      const zAt=(x,y)=>{ const a=1-Math.pow(x/rxI,2)-Math.pow((y-cy)/ryI,2), zi=-0.0046-0.0052*Math.sqrt(Math.max(0,a)), b=1-Math.pow(x/px,2)-Math.pow((y-cy)/py,2), zp=b>0?-0.0074-0.0042*Math.sqrt(b):1; return Math.min(zi,zp)-0.0005; };
      for(const sd of [-1,1]){
        const g=pc(ofPatch(-wx,wx,cy-wy,cy+wy,sg(14),sg(18),zAt,true),(x,y,z,c)=>{ const u=x/rxI, v=(y-cy)/ryI, r=Math.hypot(u,v);
          c.copy(eyeC).multiplyScalar((0.86-0.28*v)*(1-0.4*smoothstep(0.66,1,r))); if(v<0) c.lerp(white,-0.16*v);
          const sw=0.0019*E*Math.pow(Math.max(0,1-v*v*1.05),0.6)+0.0002;
          if(Math.abs(x)<sw) c.copy(ink); else if(Math.abs(x)<sw+0.0016*E&&Math.abs(v)<0.84) c.lerp(ring,0.45); });
        out.push(F.place(g.rotateZ(sd*(0.06+0.3*(S.eyeTilt+EYES.tilt))),sd*ex,ey,0.0015)); }
      return out; };

    /* ================= the top: collar, lapels, sash ================= */
    // collar topline: lower at the front (below the chin), rising at the sides and back to the jaw
    const collarTop=phi=>lerp(0.622,0.668,sm(0.2*Math.PI,0.85*Math.PI,Math.abs(phi)));
    const collarPt=(phi,yd,m)=>{ const r=rAt(yd), s=Math.sin(phi), c=Math.cos(phi), sN=sm(0.5,0.6,yd); return [(r*kx(yd)+m)*s,yd*TK,-sN*(yd-0.5)*0.1-c*(r*kz(yd,c>0)+m)]; };
    const collar=()=>{ const nu=sg(8), nv=sg(40), y0=0.488;
      const g=gridIdx(nu,nv,(u,v)=>{ const phi=-Math.PI+v*TAU, yd=lerp(y0,collarTop(phi),u); return collarPt(phi,yd,0.004+0.011*sm(0.5,0.62,yd)+0.006*sm(0.56,0.66,yd)); },(x,y,z)=>[x,0,z]);
      return [finish(g,(u,v,x,y,z,c)=>{ c.set(INK); if(u>0.8) c.set(INDIGO); c.multiplyScalar(0.94+0.08*u); }), finish(lining(g,0.0036),(u,v,x,y,z,c)=>c.set(INDIGO_D))]; };
    const collarCord=()=>{ const pts=[], n=sg(40); for(let k=0;k<=n;k++){ const phi=-Math.PI+k/n*TAU; pts.push(collarPt(phi,collarTop(phi),0.0172)); }
      return solid(sweepTube(pts,[0.0018,0.0018],5,{cap:'round',rings:n}),VERM); };
    // a lapel: a band lying on the body along a centre line [[x, design y]...], light indigo with a vermilion cord edge each side
    const lapel=(pts,w0,w1)=>{ const cv=new THREE.CatmullRomCurve3(pts.map(p=>new V3(p[0],p[1]*TK,0))), nu=sg(20), nv=sg(8), mg=0.0028;
      const g=gridIdx(nu,nv,(u,v)=>{ const p=cv.getPoint(u), t=cv.getTangent(u), w=lerp(w0,w1,u), o=(v-0.5)*w, x=p.x-t.y*o, y=p.y+t.x*o; return [x,y,surfZ(x,y/TK,true)-mg]; },()=>[0,0,-1]);
      return finish(g,(u,v,x,y,z,c)=>{ const e=Math.abs(v-0.5)*2; c.set(LAPEL); if(e>0.76) c.set(VERM); else if(e<0.2) c.multiplyScalar(0.9); }); };
    // the sash: an indigo band low on the hips with an ink edge, two vermilion cords round it, a knot at the left hip
    const KNOT=()=>[-(latX(0.037)+0.0155),0.037*TK];
    const sash=()=>{ const out=[], y0=0.012, y1=0.062, nu=sg(4), nv=sg(52);
      const g=gridIdx(nu,nv,(u,v)=>{ const phi=-Math.PI+v*TAU, yd=lerp(y0,y1,u); return ringAt(yd,0.0055,phi); },(x,y,z)=>[x,0,z]);
      out.push(finish(g,(u,v,x,y,z,c)=>{ c.set(INDIGO); if(u<0.12||u>0.88) c.set(INK); }));
      for(const yd of [y0+0.002,y1-0.002]){ const pts=[], n=sg(40); for(let k=0;k<=n;k++){ const phi=-Math.PI*0.5+k/n*TAU; pts.push(ringAt(yd,0.0105,phi)); }
        out.push(solid(sweepTube(pts,[0.0032,0.0032],5,{cap:'round',rings:n}),VERM)); }
      // the knot at the left hip (the tails hang from it: see extras)
      const [kxp,ky]=KNOT();
      out.push(solid(csph(0.0135,sg(10),sg(8)).scale(0.75,1,1).translate(kxp,ky,0.008),VERM));
      out.push(solid(ofRingAt([kxp-0.003,ky+0.015,-0.004],[1,0,0.25],0.0125,0.0034,sg(6)),VERM), solid(ofRingAt([kxp-0.003,ky+0.014,0.02],[1,0,-0.25],0.0125,0.0034,sg(6)),VERM));
      return out; };
    // the closure at the collar: a vermilion frog knot at the front of the collar's base
    const frog=()=>{ const p=ringAt(0.515,0.0125,0), out=[];
      out.push(solid(csph(0.0058,sg(8),sg(6)).translate(p[0],p[1],p[2]),VERM));
      for(const sd of [-1,1]) out.push(solid(ofRingAt([p[0]+sd*0.0098,p[1]-0.002,p[2]+0.001],[0,0,1],0.007,0.002,sg(6)),VERM));
      return out; };

    /* ================= loose parts that move: the two sash tails (they hang from the left thigh's bone), the message pouch (right), the violet bead and its wisps ================= */
    const extras=(rig,Xx,has)=>{   // has(slot): this outfit's item for the slot is worn: the sash tails and the pouch go with the top, the bead on the hood's peak with the hat
      const wTop=has('top'), wHat=has('hat'); let tA,tB,pg,wisps;
      const [kxp,ky]=KNOT();
      // the tails: flat moon-grey ribbons with a vermilion edge cord and a camellia embroidered near the end; each hangs from the knot and swings
      const AN=0.8, nrm=[-Math.sin(AN),0,-Math.cos(AN)], wd=[Math.cos(AN),0,Math.sin(AN)];   // the flat face looks out and forward (so the tails read from the front), its width runs the other way
      const mkTail=(L,zoff,sx,phase)=>{ const g=new THREE.Group(), P=[[0,0.004,0],[-0.004,-0.28*L,0.006],[-0.009,-0.6*L,0.012],[-0.013,-L,0.018]], cv=new THREE.CatmullRomCurve3(P.map(p=>new V3(p[0],p[1],p[2])));
        const wf=u=>(0.024+0.018*u)*(u>0.9?1-(u-0.9)/0.1*0.92:1), parts=[];
        parts.push(pc(ofRibbon(P,wf,{up:nrm,seg:sg(14),th:0.003}),(x,y,z,c)=>{ c.set(MOON); c.multiplyScalar(0.74+0.2*Math.min(1,-y/0.06)); }));
        for(const e of [-1,1]){ const pts=[]; for(let k=0;k<=12;k++){ const u=k/12, p=cv.getPoint(u), w=e*wf(u)/2*0.93; pts.push([p.x+wd[0]*w+nrm[0]*0.0017,p.y,p.z+wd[2]*w+nrm[2]*0.0017]); } parts.push(solid(sweepTube(pts,[0.0013,0.0013],5,{cap:'round',rings:12}),VERM)); }
        const fp=cv.getPoint(0.62), flower=pc(ofPatch(-0.016,0.016,-0.016,0.016,sg(16),sg(16),()=>0,true),(x,y,z,c)=>{ const r=Math.hypot(x,y), a=Math.atan2(y,x), pr=0.0135*(0.8+0.2*Math.cos(5*a)); c.set(MOON); c.multiplyScalar(0.8+0.2*Math.min(1,-(y+fp.y)/0.06));
          if(r<pr) { c.set(VERM); if(r>pr-0.0013) c.set(0x8e2a1f); if(r<0.0032) c.set(0xe2b86a); } });
        parts.push(flower.rotateY(AN).translate(fp.x+nrm[0]*0.0024,fp.y,fp.z+nrm[2]*0.0024));
        const m=new THREE.Mesh(merge(parts),matChar); m.castShadow=true; g.add(m);
        g.position.set(kxp+D.hx-0.008+sx*0.003,ky-0.004,0.0+zoff); g.userData.phase=phase; return g; };
      if(wTop){ tA=mkTail(0.27,0.002,0,0); tB=mkTail(0.205,-0.006,-1,2.1);
        tB.rotation.z=0.12; rig.hipL.add(tA,tB); }
      // the pouch: ink leather with an indigo flap, a vermilion hem and toggle, hung from the sash by two cords; right hip
      if(wTop){ pg=new THREE.Group(); const pp=[];
      const hw=0.029, bh=0.064, rc=0.009, xs=(g,x)=>g.rotateY(Math.PI/2).translate(x,0,0);
      const bs=new THREE.Shape(); bs.moveTo(-hw,0); bs.lineTo(hw,0); bs.lineTo(hw,-bh+rc); bs.quadraticCurveTo(hw,-bh,hw-rc,-bh); bs.lineTo(-hw+rc,-bh); bs.quadraticCurveTo(-hw,-bh,-hw,-bh+rc); bs.closePath();
      const fs2=new THREE.Shape(); fs2.moveTo(-hw-0.001,0); fs2.lineTo(hw+0.001,0); fs2.lineTo(hw+0.001,-0.03); fs2.quadraticCurveTo(hw*0.5,-0.04,0,-0.05); fs2.quadraticCurveTo(-hw*0.5,-0.04,-hw-0.001,-0.03); fs2.closePath();
      const bev={bevelEnabled:true,bevelThickness:0.0012,bevelSize:0.0012,bevelSegments:1,curveSegments:4};
      pp.push(pc(xs(new THREE.ExtrudeGeometry(bs,Object.assign({depth:0.014},bev)),0.0),(x,y,z,c)=>{ c.set(0x20263a); if(y>-0.012) c.set(INK); }));
      pp.push(pc(xs(new THREE.ExtrudeGeometry(fs2,Object.assign({depth:0.0165},bev)),-0.0015),(x,y,z,c)=>{ c.set(BODICE); c.multiplyScalar(0.8+0.3*clamp((y+0.05)*20)); }));
      { const e=[]; for(let k=0;k<=10;k++){ const t=k/10, u=lerp(hw+0.0015,-hw-0.0015,t); e.push([0.0187,-(0.03+0.021*(1-Math.pow(Math.abs(u)/hw,2))),u]); }
        pp.push(solid(sweepTube(e,[0.0016,0.0016],5,{cap:'round',rings:12}),VERM)); }
      pp.push(solid(csph(0.0045,8,6).scale(0.8,1,1).translate(0.0185,-0.0505,0),VERM));
      for(const z of [-0.022,0.022]) pp.push(solid(sweepTube([[0.004,-0.002,z],[0.004,0.018,z*0.7]],[0.0019,0.0019],5,{cap:'round',rings:4}),VERM));
      const pm=new THREE.Mesh(merge(pp),matChar); pm.castShadow=true; pg.add(pm);
      pg.position.set(latX(0.012)+0.0105+0.0035-D.hx,0.0108,0.03); rig.hipR.add(pg); }
      // the violet bead at the peak's tip with two white-blue wisps circling it (dark and air): small, unlit
      if(wHat){ const gl=new THREE.Group(), tip=PKCV.getPoint(0.97); gl.position.set(tip.x,tip.y-0.012,tip.z);
      const bead=merge([pc(csph(0.0072,10,8),(x,y,z,c)=>{ c.set(VIOLET); c.lerp(ofCol(0xb8aaff),clamp(-z*60+0.4)*0.5); })]);
      gl.add(new THREE.Mesh(bead,matGlow));
      wisps=new THREE.Group(); gl.add(wisps);
      for(let w=0;w<2;w++){ const P=[]; for(let k=0;k<=9;k++){ const f=k/9, a=f*Math.PI*1.5+w*Math.PI, r=0.012+0.012*f; P.push([r*Math.cos(a),0.004*f-0.006+0.012*Math.sin(f*Math.PI),r*Math.sin(a)]); }
        const wg=pc(sweepTube(P,[0.0016,0.0017,0.0012,0.0005],5,{cap:'point',rings:18}),(x,y,z,c)=>{ c.copy(cW).lerp(cVi,clamp(Math.hypot(x,z)/0.026-0.4)*0.9); }); wisps.add(new THREE.Mesh(merge([wg]),matGlow)); }
      rig.head.add(gl); }
      rig.anims.push((t,dt,mv)=>{ const k=Math.min(1,mv);
        if(tA){ tA.rotation.x=-(0.05+0.55*k)+Math.sin(t*2.3)*0.05*(0.4+k); tA.rotation.z=Math.sin(t*1.7+1)*0.05*(0.3+k);
          tB.rotation.x=-(0.08+0.62*k)+Math.sin(t*2.7+2.1)*0.06*(0.4+k); tB.rotation.z=0.12+Math.sin(t*2.1+3)*0.06*(0.3+k);
          pg.rotation.z=0.03+0.05*k*Math.sin(t*5)+0.02*Math.sin(t*1.9); pg.rotation.x=-0.04*k; }
        if(wisps){ wisps.rotation.y=t*1.3; wisps.position.y=Math.sin(t*2.1)*0.003; } });
    };

    /* ================= the weapon dressing: black lacquer, vermilion cord spirals, dark steel, indigo inlay bands, a courier's tag with a violet edge ================= */
    const dress={ shape:{sword:'katana',bow:'yumi',staff:'tassel'}, grip:LAC, metal:STEEL, wood:LAC, accent:INDIGO,
      trim:(c,u,part)=>{ const f=((u/0.06)%1+1)%1;
        if(part==='grip'){ if(((u/0.008)%1+1)%1<0.5) c.lerp(cV,0.92); return; }
        if(f<0.07) c.lerp(ofCol(LAPEL),0.9); else if(f>0.5&&f<0.54) c.lerp(cV,0.9); },
      charm:()=>{ const lit=[], glow=[];
        lit.push(solid(sweepTube([[0,0.004,0],[0.003,-0.018,0.006],[0.0035,-0.034,0.0095],[0.003,-0.0455,0.0095]],[0.0017,0.0017,0.0017,0.0017],5,{cap:'round',rings:8}),VERM));
        const shp=(k)=>{ const s=new THREE.Shape(); s.moveTo(-0.012-k,0.02+k); s.lineTo(0.012+k,0.02+k); s.lineTo(0.016+k,0.014+k); s.lineTo(0.016+k,-0.018-k); s.lineTo(0.004+k*0.3,-0.018-k); s.lineTo(0,-0.0115); s.lineTo(-0.004-k*0.3,-0.018-k); s.lineTo(-0.016-k,-0.018-k); s.lineTo(-0.016-k,0.014+k); s.closePath(); return s; };
        const tagS=shp(0); tagS.holes.push(new THREE.Path().absarc(0,0.0115,0.0029,0,TAU,true));
        lit.push(pc(new THREE.ExtrudeGeometry(tagS,{depth:0.004,bevelEnabled:false,curveSegments:8}).translate(0.003,-0.056,0.0095-0.002),(x,y,z,c)=>{ c.set(TAG); if(z>0.0095+0.0018||z<0.0095-0.0018) c.multiplyScalar(0.84); }));
        for(let i=0;i<3;i++) for(const f of [-1,1]) lit.push(solid(vbox(0.0018,0.011,0.0006,0.003+(i-1)*0.0058,-0.0615,0.0095+f*0.0022),INK));   // three ink ticks: her tally
        lit.push(...tuft(-0.024,-0.004,0.012,6,0.048,0.0021,MOON,0.018));
        const gS=shp(0.0012); gS.holes.push(new THREE.Path().absarc(0,0.0115,0.0029,0,TAU,true));
        glow.push(pc(new THREE.ExtrudeGeometry(gS,{depth:0.0026,bevelEnabled:false,curveSegments:8}).translate(0.003,-0.056,0.0095-0.0013),(x,y,z,c)=>c.set(0x5a4cc0)));
        for(let w=0;w<2;w++){ const P=[]; for(let k=0;k<=7;k++){ const f=k/7, a=f*Math.PI*1.3+w*Math.PI; P.push([0.003+(0.006+0.007*f)*Math.cos(a)*(w?1:-1),-0.082-0.022*f,0.0095+(0.006+0.007*f)*Math.sin(a)]); }
          glow.push(pc(sweepTube(P,[0.0013,0.0012,0.0007,0.0003],5,{cap:'point',rings:14}),(x,y,z,c)=>{ c.copy(cW).lerp(cVi,clamp((-y-0.078)/0.03)*0.8); })); }
        for(const g of lit.concat(glow)) g.scale(1.3,1.3,1.3);
        return {lit,glow}; } };

    const GLV={start:0.19,col:INK,col2:INDIGO_D,trim:VERM,len:0.07,flare:0.0,fingers:'tips'};
    const kit={
      main:{glove:0x1b1f2a,top:0x2f3f6b,bottom:0x2f3f6b,shoes:0x1b1f2a,hat:0x222c4e}, /* the main colour of each piece, for the player's recolouring (outfit-tools.js: ofTinter) */ bootTop:1.1, shinCut:9, boot:false, skinFrom:0.605, hairColor:HAIR, eyeColor:0x8a86a8,
      eyes:EYES,
      cuts:{torso:[0.012,0.062],foreArm:[WRIST/D.fore]},
      paint:bodyPaint,
      gloveStart:GLV.start, gloveFingers:GLV.fingers, glove:sd=>glKitGlove(X,D,sd,GLV), handPaint:glKitPaint(GLV),
      head:(F,T)=>hood(F,T),
      hair:(F,T)=>hair(F,T),
      mark,
      torso:()=>{ const out=[...collar(),collarCord(),...frog()];
        out.push(lapel([[-0.034,0.5],[-0.012,0.43],[0.05,0.26],[0.108,0.095],[0.12,0.07]],0.024,0.026));
        out.push(lapel([[0.034,0.5],[0.02,0.455],[0.002,0.405]],0.021,0.021));
        out.push(...sash());
        return out; },
      shoulder:sd=>[solid(ofRingAt([0,-0.14,0],[0,1,0],UA(0.5)[0]+0.0036,0.0022,sg(6)),VERM)],
      forearm:sd=>{ const out=[], a0=0.108, a1=0.234, nu=sg(8), nv=sg(24), m=0.0026;
        const g=gridIdx(nu,nv,(u,v)=>{ const s=lerp(a0,a1,u), q=FA(s/D.fore), a=v*TAU; return [(q[0]+m)*Math.sin(a),-s,q[2]+(q[1]+m)*Math.cos(a)]; },(x,y,z)=>[x,0,z]);
        out.push(finish(g,(u,v,x,y,z,c)=>{ c.set(INDIGO); if(u<0.1||u>0.9) c.set(INK); }));
        out.push(solid(spiral(FA,D.fore,a0+0.012,a1-0.01,6,m+0.0016,0.002,0.4),VERM));
        out.push(solid(ofRingAt([0,-a1-0.002,0],[0,1,0],FA(a1/D.fore)[0]+m+0.0014,0.002,sg(5)),VERM));
        return out; },
      thigh:sd=>{ const out=[], th=D.thigh, nu=sg(12), nv=sg(8), b0=0.6, s0=0.03;
        const P=(u,v)=>{ const half=lerp(0.3,0.38,u), beta=b0+(v-0.5)*2*half, s1=0.215+0.05*Math.abs(2*v-1), s=lerp(s0,s1,u), q=TH(s/th), gap=0.004+0.042*Math.pow(u,1.4);
          return [sd*(q[0]+gap)*Math.sin(beta),-s,q[2]-(q[1]+gap)*Math.cos(beta)]; };
        const g=gridIdx(nu,nv,P,(x,y,z)=>[x,0,z]);
        out.push(finish(g,(u,v,x,y,z,c)=>{ c.set(INDIGO_D); if(Math.abs(v-0.5)>0.4) c.set(INK); c.multiplyScalar(0.92+0.1*(1-u)); }), finish(lining(g,0.003),(u,v,x,y,z,c)=>c.set(LAPEL)));
        // a vermilion hem, and a seam cord down the outer side of the leg
        const hem=[], nh=sg(12); for(let k=0;k<=nh;k++){ const p=P(1,k/nh); hem.push([p[0],p[1]-0.001,p[2]]); }
        out.push(solid(sweepTube(hem,[0.0016,0.0016],5,{cap:'round',rings:nh*2}),VERM));
        const seam=[]; for(let k=0;k<=10;k++){ const s=lerp(0.05,0.46,k/10), q=TH(s/th); seam.push([sd*(q[0]+0.0016),-s,q[2]]); }
        out.push(solid(sweepTube(seam,[0.0016,0.0016],5,{cap:'round',rings:sg(16)}),VERM));
        return out; },
      shin:sd=>{ const out=[], len=D.shin, t0=0.2, t1=0.955, nu=sg(26), nv=sg(26), m=0.0022;
        const g=gridIdx(nu,nv,(u,v)=>{ const t=lerp(t0,t1,u), q=SH(t), a=v*TAU; return [(q[0]+m)*Math.sin(a),-t*len,q[2]+(q[1]+m)*Math.cos(a)]; },(x,y,z)=>[x,0,z]);
        out.push(finish(g,(u,v,x,y,z,c)=>{ const ph=(-y/0.03+v*3)%1; c.set(INK); if(((ph%1)+1)%1<0.5) c.set(INDIGO); if(u<0.025||u>0.975) c.set(INK); }));
        out.push(solid(spiral(SH,len,t0*len+0.01,len-0.004,8,m+0.0017,0.002,0.3,f=>f<0.86?f/0.86*0.82:0.82+(f-0.86)/0.14*0.18),VERM));
        const q=SH(0.985); out.push(solid(csph(0.0055,sg(8),sg(6)).translate(sd*(q[0]+0.0072),-0.985*len,q[2]),VERM));
        return out; },
      extras:(rig,XX,has)=>{ extras(rig,XX,has); ofCosmetics(rig,XX,has,{cape:{col:INDIGO_D,trim:VIOLET,len:0.78,pat:'gloam',mantle:0},aura:{col:VIOLET,col2:WISP,style:'orbit',ring:false,n:5,shape:'wisp',deco:'none'}}); },
      dress,
    };
    return kit;
  };
})();
OUTFITS.sazanka=oxPlus(OUTFITS.sazanka,(X,D)=>({   // round 4: a vermilion scarf with long tails, an ink shoulder plate with violet trim, a knotted sash with two tails
  torso:()=>oxScarf(X,D,{col:0xc8323a,col2:0x2a1a40,len:1.25,fat:0.022}),
  shoulder:sd=>sd>0?oxPauldron(X,D,{col:0x1b1f2a,trim:0x8a6ae0,r:0.085}):[],
  hips:()=>oxSash(X,D,{col:0xc8323a,col2:0x2a1a40,len:1.1,side:-1})}));
OUTFITS.sazanka=oxPlus(OUTFITS.sazanka,(X,D)=>({   // round 5: a white fox half-mask pushed up on the side of the head, a plate on the other shoulder too
  head:()=>oxMask(X,D,{col:0xf3ead2,mark:0xc8323a,side:1}),
  shoulder:sd=>sd<0?oxPauldron(X,D,{col:0x1b1f2a,trim:0xc8323a,r:0.075}):[]}));
OUTFITS.sazanka=oxPlus(OUTFITS.sazanka,(X,D)=>({   // round 6: a big vermilion obi bow at the back, long trailing sleeve streamers
  torso:()=>oxBow(X,D,{col:0xc8323a,col2:0x2a1a40}),
  forearm:sd=>oxStreamer(X,D,{col:0xc8323a,col2:0x2a1a40,len:0.55,side:sd})}));
OUTFITS.sazanka=oxPlus(OUTFITS.sazanka,(X,D)=>({   // round 3: a curtain of paper talismans hanging from the belt
  hips:()=>oxTags(X,D,{col:0xf3ead2,mark:0xc8323a,n:14,len:0.24})}));
oxTune('sazanka',{eyeSize:1.1,eyeTilt:0.5,lips:1.0,smile:0.35,blush:0.4,cheeks:0.95,earSize:1.15,undertone:0.2});
OUTFITS.sazanka=oxPlus(OUTFITS.sazanka,(X,D)=>({   // face round 4: a red runner's stripe under the eyes, red cords hung at both ears, a cheeky grin
  mark:F=>oxMarks(F,[{t:'stripe',col:0xc8323a},{t:'freckles',col:0x8a5a48}]),
  hair:()=>oxHairBits(X,[{t:'beads',both:true,col:0xc8323a,col2:0xf3ead2}])}));
oxTune('sazanka',{height:1.0,build:0.98,chest:0.8,shoulders:1.0,waist:0.85,hips:1.0,thighs:1.2,legs:1.12,arms:1.0,neck:0.95,head:1.0});
Object.assign(CHAR_MODELS.sazanka.setups[0],{note:'The courier as drawn: lean and long-limbed with a runner\'s legs.'});
OUTFITS.sazanka=oxPlus(OUTFITS.sazanka,(X,D)=>({   // uniqueness round 3: a courier's banner rising from a rod on her back, a red sun on white cloth
  torso:()=>oxBanner(X,D,{col:0xf3ead2,disc:0xc8323a,rod:0x4a3220,len:0.62})}));
oxTune('sazanka',{height:0.93,chest:0.7,legs:1.12,thighs:1.2,head:0.98});
