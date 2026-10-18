//@ Marigold's outfit (a stage idol of light): a floating ring of paper lanterns, curled twin tails with plum bows, a pleated plum curtain jacket over a laced cream bodice, a layered tulle skirt, bell boots and a stage-trim weapon dressing
/* ---------- Marigold: mixed (safe DPS + support), light. Design: docs/skillkits/looks/marigold.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: marigold 0xe59a2b, cream 0xfff2d6, plum 0x5a2a4a, glow gold 0xffd36b (the lanterns of the crown and the weapon charm only: unlit matGlow meshes, never a light), gold 0xe3b448 for the metal.
   Silhouette: a little stage: a turning ring of paper lanterns over high twin tails with bows and drill curls, a short puffed-sleeve pleated jacket with a ruffled collar and a big back bow,
   a bell of three tulle layers with ruffled hems, and tall plum boots with a cream frill and gold bells. Every part has at least two colours. */
CHAR_MODELS.marigold={id:'marigold',name:'Marigold',signature:true, hairGrad:{mode:'ombre',c2:0xff7aa8,c3:0x9a5ad8}, items:{hat:'Lantern crown',hair:'Ribbon tails',face:'Lantern glyph',top:'Curtain jacket',bottom:'Footlight skirt',shoes:'Bell boots',weapon:'Stage trim'},sexes:['female'],
  note:'The stage idol: small, big-headed, built for a light, slim figure.',
  ranges:{height:[0.92,1.02],build:[0.88,1.05],shoulders:[0.88,1.05],arms:[0.82,1.05],chest:[0.6,1.2],waist:[0.85,1.05],hips:[0.9,1.15],legs:[0.98,1.14],head:[1.0,1.12],eyeSize:[1.05,1.3],noseSize:[0.7,1.1],smile:[0.2,0.9],hairLength:[1.0,1.35],hairVolume:[1.0,1.25]},
  setups:[{id:'marigold',name:'Marigold',sex:'female',def:true,note:'The idol as drawn: small, big-headed, huge bright eyes.',v:{height:0.94,build:0.9,chest:0.85,shoulders:0.92,waist:0.9,torso:0.97,legs:1.06,thighs:0.95,arms:0.85,neck:0.95,hands:0.9,feet:0.92,head:1.08,jaw:0.9,chin:0.88,cheeks:1.15,eyeSize:1.3,eyeGap:1.04,eyeHeight:-0.2,eyeTilt:0.1,brow:-0.1,noseSize:0.75,mouthSize:0.9,lips:1.15,smile:0.6,hairLength:1.2,hairVolume:1.15}}]};

OUTFITS.marigold=(function(){
  const PLUM=0x5a2a4a, PLUM_D=0x3f1c35, PLUM_L=0x7d4a68, MARI=0xe59a2b, MARI_L=0xf4b957, CREAM=0xfff2d6, GLOW=0xffd36b, GOLD=0xe3b448, PGOLD=0xf2dca0, HAZEL=0x8a5a2e;
  const cPL=ofCol(PLUM_L), cM=ofCol(MARI), cML=ofCol(MARI_L), cC=ofCol(CREAM), cGl=ofCol(GLOW), cG=ofCol(GOLD);
  const V3=THREE.Vector3, G=faceG, sm=faceSm, fr=x=>x-Math.floor(x);

  /* a surface from a grid P(u,v) -> [x,y,z] (u down it, v round / across it): `nu` is the number of rows, or a list of u values (rows 1 mm apart make a crisp colour edge);
     out(x,y,z) says which way the front faces; colFn(u,v,x,y,z,c) sets each vertex's colour. Smooth normals, a non-indexed geometry like pc makes. */
  const surf=(nu,nv,P,out,colFn)=>{
    const U=Array.isArray(nu)?nu:null, n=U?U.length-1:nu, uv=i=>U?U[i]:i/n, pos=new Float32Array((n+1)*(nv+1)*3), tc=new Float32Array((n+1)*(nv+1)*2), idx=[];
    for(let i=0;i<=n;i++) for(let j=0;j<=nv;j++){ const p=P(uv(i),j/nv), k=i*(nv+1)+j; pos[k*3]=p[0]; pos[k*3+1]=p[1]; pos[k*3+2]=p[2]; tc[k*2]=uv(i); tc[k*2+1]=j/nv; }
    for(let i=0;i<n;i++) for(let j=0;j<nv;j++){ const a=i*(nv+1)+j, b=a+1, c=a+nv+1, d=c+1; idx.push(a,c,b,b,c,d); }
    let s=0; const A=new V3(), B=new V3(), C=new V3(), nn=new V3();
    for(let t=0;t<idx.length;t+=3){ A.fromArray(pos,idx[t]*3); B.fromArray(pos,idx[t+1]*3); C.fromArray(pos,idx[t+2]*3); const o=out((A.x+B.x+C.x)/3,(A.y+B.y+C.y)/3,(A.z+B.z+C.z)/3); nn.crossVectors(B.sub(A),C.sub(A)); s+=nn.x*o[0]+nn.y*o[1]+nn.z*o[2]; }
    if(s<0) for(let t=0;t<idx.length;t+=3){ const q=idx[t+1]; idx[t+1]=idx[t+2]; idx[t+2]=q; }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); smoothN(g);
    const nr=g.attributes.normal, m=idx.length, op=new Float32Array(m*3), on=new Float32Array(m*3), oc=new Float32Array(m*3), col=new THREE.Color();
    for(let k=0;k<m;k++){ const v=idx[k]; op[k*3]=pos[v*3]; op[k*3+1]=pos[v*3+1]; op[k*3+2]=pos[v*3+2]; on[k*3]=nr.getX(v); on[k*3+1]=nr.getY(v); on[k*3+2]=nr.getZ(v);
      colFn(tc[v*2],tc[v*2+1],op[k*3],op[k*3+1],op[k*3+2],col); const nz=0.985+0.03*noise2(op[k*3]*7+op[k*3+2]*5,op[k*3+1]*7-op[k*3+2]*3); oc[k*3]=col.r*nz; oc[k*3+1]=col.g*nz; oc[k*3+2]=col.b*nz; }
    const o=new THREE.BufferGeometry(); o.setAttribute('position',new THREE.BufferAttribute(op,3)); o.setAttribute('normal',new THREE.BufferAttribute(on,3)); o.setAttribute('color',new THREE.BufferAttribute(oc,3)); return o; };
  // the back of a one-sided cloth: the same triangles reversed, normals turned, a little darker (tulle, bows and frills are seen from both sides)
  const twoSided=(g,dim)=>{ const h=g.clone(), at=[h.attributes.position,h.attributes.normal,h.attributes.color];
    for(const a of at){ const r=a.array; for(let t=0;t<a.count;t+=3) for(let k=0;k<3;k++){ const x=r[(t+1)*3+k]; r[(t+1)*3+k]=r[(t+2)*3+k]; r[(t+2)*3+k]=x; } }
    const nr=h.attributes.normal.array, pr=h.attributes.position.array; for(let i=0;i<nr.length;i++){ pr[i]-=nr[i]*0.0007; nr[i]=-nr[i]; } const cr=h.attributes.color.array; for(let i=0;i<cr.length;i++) cr[i]*=dim||0.88; return h; };
  const tube=(pts,r,hex,seg,rings)=>solid(sweepTube(pts,Array.isArray(r)?r:[r,r],seg,{cap:'round',rings:rings||Math.max(6,pts.length*3)}),hex);
  // a ribbon with a stripe: a wide strip and a narrower one of another colour on top (both faces). P points, w width (number or f(u)), up = the way the flat face looks
  const ribbon2=(P,w,up,cA,cB,seg,th)=>{ const wf=typeof w==='function'?w:()=>w; return [solid(ofRibbon(P,wf,{up,seg,th:th||0.0016}),cA),solid(ofRibbon(P,u=>wf(u)*0.34,{up,seg,th:(th||0.0016)+0.0014}),cB)]; };

  return function(X,D){
    const {S,sg,fem,skinPaint}=X, TK=D.TK, B=D.B, lr=D.lr, aw=D.aw, ch=S.chest, WY=fem?0.215:0.15, HEAD_T=typeof HEAD_TALL!=='undefined'?HEAD_TALL:1.1;
    // ---- the torso's real surface (the same formulas as buildTorso), so cloth can lie on it, bust and hips included ----
    const nt=Math.max(0.7,(D.headY-0.03)/TK), PROF=(fem?TORSO_F:TORSO_M).concat([[D.neckR*1.3,0.572],[D.neckR*1.06,0.6],[D.neckR,0.635],[D.neckR*0.98,nt]]), rAt=yd=>profR(PROF,yd);
    const bodyXZ=(a,yd)=>{ const r=rAt(yd), x0=r*Math.sin(a), z0=r*Math.cos(a), front=z0<0, sN=sm(0.5,0.6,yd), up=sm(0.22,0.4,yd)*(1-sN), gw=G(yd,WY,0.11), gh=G(yd,-0.03,0.1), belly=G(yd,0.1,0.13)*(B-1)*1.4;
      let x=x0*lerp(B*(fem?1:1.04),1.1,sN), z=z0*lerp((fem?0.66:0.62)*B,0.94,sN)*(1+(front?belly:belly*0.3)*(1-sN));
      x*=1+(S.shoulders-1)*up+(S.waist-1)*gw+(S.hips-1)*gh; z*=1+(S.waist-1)*0.7*gw+(S.hips-1)*0.5*gh+(S.shoulders-1)*0.2*up;
      const ax=Math.abs(x);
      if(front){
        if(!fem) z+=0.012*B*G(yd,0.33,0.1)*(1-0.4*G(ax,0,0.12))-0.003*B*(0.5+0.5*ch)*G(yd,0.37,0.05)*G(ax,0.07*B,0.07);
        z-=0.008*G(yd,0.1,0.08)*(1-G(ax,0,0.04))*(fem?0.5:1);
        if(fem){ const cy=0.315-0.012*(ch-1), wx=0.05*(0.86+0.14*ch), wl=0.036*(0.8+0.2*ch), lobe=sd=>{ const dx=x-sd*0.056*B, dy=yd-cy; return Math.exp(-Math.pow(dx/wx,2))*Math.exp(-Math.pow(dy/(dy>0?0.075:wl),2)); };
          z-=0.034*lr*ch*(1-(1-lobe(-1))*(1-lobe(1))); }
      } else { z+=0.012*B*G(yd,0.37,0.07)*G(ax,0.075*B,0.045); z+=(fem?0.034:0.022)*B*G(yd,0,0.055)*G(ax,0.066*B,0.05); z-=0.008*G(ax,0,0.018)*G(yd,0.2,0.18); }
      z-=sN*(yd-0.5)*0.1; return [x,z]; };
    // a point on the body at angle a (PI = the front, 0 = the back, PI/2 = +x) and design height yd, pushed m metres out along the surface's normal: [x, y, z] in the spine's frame
    const bodyAt=(a,yd,m)=>{ const p=bodyXZ(a,yd), q0=bodyXZ(a-0.012,yd), q1=bodyXZ(a+0.012,yd); let nx=q1[1]-q0[1], nz=-(q1[0]-q0[0]); const l=Math.hypot(nx,nz)||1; nx/=l; nz/=l; if(nx*p[0]+nz*p[1]<0){ nx=-nx; nz=-nz; }
      return [p[0]+nx*m,yd*TK,p[1]+nz*m]; };
    // the front of the body at lateral x (the angle is found by bisection): z of the surface
    const frontZ=(x,yd)=>{ let lo=Math.PI-1.4, hi=Math.PI+1.4; for(let i=0;i<16;i++){ const mid=(lo+hi)/2; if(bodyXZ(mid,yd)[0]>x) lo=mid; else hi=mid; } return bodyXZ((lo+hi)/2,yd)[1]; };
    const radial=(x,y,z)=>[x,0,z];

    /* ---- the paint of the body: a cream bodice (the jacket, sash and skirt are geometry over it), bare arms, cream stockings with a plum garter band, plum boots with a marigold ankle band ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': c.set(CREAM); c.multiplyScalar(0.97+0.05*G(y,0.3,0.2)); return;
        case 'upperArm': if(-y<D.upper*0.4) c.set(PLUM); else skinPaint(c); return;
        case 'foreArm': skinPaint(c); return;
        case 'thigh': { const t=-y/D.thigh; if(t<0.5) skinPaint(c); else { c.set(CREAM); if(t>0.9&&t<0.96) c.set(PLUM); } return; }
        case 'shin': { const t=-y/D.shin; if(t<0.075) c.set(CREAM); else { c.set(PLUM); c.multiplyScalar(0.94+0.1*G(-z*10,0.4,0.6)); if(t>0.88&&t<0.915) c.set(MARI); if(t>0.93) c.set(PLUM_D); } return; }
        case 'foot': { c.set(PLUM); if(y<-D.ankleH+0.012) c.set(PLUM_D); return; }
      }
      c.set(PLUM); };

    /* ---- the jacket: a short pleated bolero, open at the front in a V, plum with light-plum pleat ridges, flaring into a scalloped curtain hem, marigold piping all round ---- */
    const JTOP=0.5, JHEM=0.21, NF=14, gap=yd=>lerp(0.3,0.8,sm(0.23,0.5,yd));
    const jm=(yd,a)=>0.0055+0.0035*sm(0.4,0.5,yd)+0.022*sm(0.3,0.21,yd)+0.0026*sm(0.46,0.21,yd)*Math.sin(NF*a);
    const jang=(u,v)=>{ const g0=gap(lerp(JTOP,JHEM,u)); return Math.PI+g0+(TAU-2*g0)*v; };
    const jpt=(u,v)=>{ const a=jang(u,v), sc=0.5+0.5*Math.cos(NF*a), yd=lerp(JTOP,JHEM+0.013*sc,u); return bodyAt(a,yd,jm(yd,a)); };
    const jacket=()=>surf(sg(14),sg(42),jpt,radial,(u,v,x,y,z,c)=>{ const a=jang(u,v), p=Math.sin(NF*a); c.set(PLUM); if(p<-0.55) c.lerp(cPL,0.55*clamp((-p-0.55)*3)); c.multiplyScalar(0.9+0.12*sm(0.2,0.5,y/TK)); if(u>0.93) c.multiplyScalar(0.86); });
    const jacketPiping=()=>{ const P=[], nE=sg(10), nH=sg(40);
      for(let i=0;i<=nE;i++){ const p=jpt(i/nE,0); P.push([p[0],p[1],p[2]]); }
      for(let i=1;i<=nH;i++){ const p=jpt(1,i/nH); P.push([p[0],p[1]-0.002,p[2]]); }
      for(let i=nE-1;i>=0;i--){ const p=jpt(i/nE,1); P.push([p[0],p[1],p[2]]); }
      return tube(P,0.0028,MARI,4,P.length); };

    /* ---- the ruffled collar: a cream stand-up frill with a plum ribbon band at the neck and a marigold scalloped edge ---- */
    const collar=()=>{ const NC=18, rows=[0,0.09,0.103,0.45,0.78,0.786,1], P=(u,v)=>{ const a=v*TAU, yd=lerp(0.578,0.488,u)-0.012*(0.5+0.5*Math.cos(NC*a))*sm(0.55,1,u); return bodyAt(a,yd,lerp(0.0036,0.03,Math.pow(u,1.25))); };
      return surf(rows,sg(34),P,radial,(u,v,x,y,z,c)=>{ if(u<0.095) c.set(PLUM); else if(u>0.783) c.set(MARI); else { c.set(CREAM); c.multiplyScalar(0.9+0.1*u); } if(u>0.105&&u<0.2) c.multiplyScalar(0.94); }); };

    /* ---- the waist sash: a plum band edged in marigold (the big cream back bow and the streamers are below) ---- */
    const SY0=0.145, SY1=0.205;
    const sash=()=>surf([SY0,SY0+0.008,SY0+0.0085,SY1-0.0085,SY1-0.008,SY1],sg(40),(yd,v)=>bodyAt(v*TAU,yd,0.0105),radial,(yd,v,x,y,z,c)=>{ if(yd<SY0+0.0083||yd>SY1-0.0083) c.set(MARI); else { c.set(PLUM); c.multiplyScalar(0.92+0.14*Math.sin((yd-SY0)/(SY1-SY0)*Math.PI)); } });

    // a bow in its own frame: the knot at the origin, the face looks along -z, loops along +-x, two ribbon tails hanging down (opts.tails false: the caller makes them)
    const bow=(k,det,tails,cMain,cRim,cKnot)=>{ cMain=cMain===undefined?PLUM:cMain; cRim=cRim===undefined?MARI:cRim; cKnot=cKnot===undefined?PLUM:cKnot; const out=[], L=0.078*k, H=0.046*k, puff=0.03*k, nu=Math.max(5,Math.round(sg(5)*det)), nv=Math.max(5,Math.round(sg(7)*det)), k0=0.007*k;
      const hf=u=>H*Math.sin(Math.PI*Math.pow(clamp(u),0.75))*(0.5+0.5*u);
      for(const sd of [-1,1]){ const g=surf(nu,nv,(u,v)=>{ const w=v*2-1; return [sd*(k0+L*u),hf(u)*w,-puff*(1-w*w)*Math.sin(Math.PI*u)*0.85-0.0012*k]; },()=>[0,0,-1],(u,v,x,y,z,c)=>{ const w=Math.abs(2*v-1); c.set(cMain); if(w>0.74) c.set(cRim); else if(w<0.1) c.multiplyScalar(0.8); if(u<0.12) c.multiplyScalar(0.8); });
        out.push(g,twoSided(g,0.9)); }
      out.push(pc(csph(0.0115*k,sg(9),sg(7)).scale(1,1.2,0.9).translate(0,0,-0.004*k),(x,y,z,c)=>{ c.set(cKnot); if(Math.abs(x)<0.0035*k) c.copy(cM); }));
      if(tails!==false) for(const sd of [-1,1]){ const P=[[sd*0.005*k,-0.008*k,-0.003*k],[sd*0.016*k,-0.048*k,-0.001*k],[sd*0.03*k,-0.098*k,0.004*k]]; out.push(...ribbon2(P,u=>0.026*k*(u>0.86?1-(u-0.86)*4.5:1),[0,0,-1],cMain,cRim,sg(8))); }
      return out; };
    const placeG=(list,rx,ry,rz,x,y,z)=>{ const m=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx,ry,rz,'YXZ')); for(const g of list){ g.applyMatrix4(m); g.translate(x,y,z); } return list; };

    /* ---- the skirt: three tulle layers on one flaring cone (cream, plum, marigold from the longest to the shortest), each with a ruffled hem in the next colour; hung from the hips ---- */
    const s15=torsoSize(X,D,0.15), SRX0=s15.rx+0.007, SRZ0=Math.max(s15.rz,s15.rzBack)+0.007, SYT=0.15*TK;
    const SRXH=Math.max(0.255,(D.hx+0.093*D.tw)*1.6), SRZH=SRXH*0.9, SYB=-0.19, NR=12, FRH=0.026;
    const LAY=[{y:-0.19,off:0,main:CREAM,edge:PLUM,light:cC},{y:-0.15,off:0.013,main:PLUM,edge:MARI,light:cPL},{y:-0.11,off:0.026,main:MARI,edge:CREAM,light:cML}];
    const skXZ=(k,y,a)=>{ const L=LAY[k], t=clamp((SYT-y)/(SYT-SYB)), f=Math.pow(t,0.66), rf=sm(L.y+FRH,L.y,y), pl=0.0075*sm(0.1,0.5,t)*Math.sin(12*a), fl=0.013*rf;
      return [(lerp(SRX0,SRXH,f)+L.off*f+fl+pl)*Math.sin(a),(lerp(SRZ0,SRZH,f)+L.off*f+fl+pl)*Math.cos(a)]; };
    const skirtLayer=k=>{ const L=LAY[k], H=SYT-L.y, uF=1-FRH/H, rows=[0,0.16,0.34,0.52,0.68,uF-0.0008,uF,0.96,1];
      const g=surf(rows,sg(40),(u,v)=>{ const a=v*TAU, y0=lerp(SYT,L.y,u), rf=sm(L.y+FRH,L.y,y0), sc=0.5+0.5*Math.cos(NR*a), y=y0-0.012*sc*rf, p=skXZ(k,y0,a); return [p[0],y,p[1]]; },radial,
        (u,v,x,y,z,c)=>{ if(u>=uF) { c.set(L.edge); c.multiplyScalar(0.94+0.1*(u-uF)/(1-uF)); } else { c.set(L.main); c.multiplyScalar((0.84+0.2*u)); const sw=Math.sin(12*v*TAU); if(sw>0) c.lerp(L.light,0.4*clamp(sw*2.5)); } });
      return g; };
    // the outer skirt surface at height y and angle a (the shortest layer that still reaches y)
    const skOuter=(y,a)=>{ const k=y>LAY[2].y?2:y>LAY[1].y?1:0, p=skXZ(k,y,a); return [p[0],p[1]]; };
    // a sash streamer: a plum ribbon with a marigold stripe lying on the skirt from the waist band down past the hem, at angle a
    const streamer=(a,yTop,yBot,w,cA,cB)=>{ const P=[], n=7; for(let i=0;i<=n;i++){ const y=lerp(yTop,yBot,i/n), p=skOuter(Math.max(y,yBot+0.0),a), nx=Math.sin(a), nz=Math.cos(a); P.push([p[0]+nx*0.005,y,p[1]+nz*0.005+(i>=n-1?0.006*(i-n+2):0)]); }
      return ribbon2(P,u=>w*(u>0.84?1-(u-0.84)*3.2:1),[Math.sin(a),0,Math.cos(a)],cA===undefined?PLUM:cA,cB===undefined?MARI:cB,sg(12)); };

    /* ---- the hair: high twin tails with a drill curl, a straight fringe, plum bows ---- */
    const hair=(F,T)=>{
      T.crown(0.113,0.5,0.3); T.fringe(8,1.0,0.03); T.sideLocks(0.075*T.hl); T.backLocks(sg(8),0.03,23);
      const out=[], hl=T.hl, hv=T.hv, tipC=ofCol(0xffc25a), fx=F.fs[0];   // the tails are only scaled across (T.hang), so the parts hung on them are placed with the same factor
      for(const sd of [-1,1]){
        const yC=-0.06*hl, P=[[sd*0.06,0.098,0.02],[sd*0.084,0.139,0.026],[sd*0.118,0.152,0.036],[sd*0.158,0.128,0.049],[sd*0.178,0.08,0.056],[sd*0.184,0.015,0.058],[sd*0.182,yC,0.058]];
        // the drill curl: a helix round a vertical axis that closes in, from the end of the fall
        const turns=1.75, N=Math.round(sg(34)), cx=sd*0.182-sd*0.03, cz=0.058; for(let i=1;i<=N;i++){ const f=i/N, ph=f*turns*TAU, r=lerp(0.03,0.01,f); P.push([cx+sd*r*Math.cos(ph),yC-0.1*f-0.005*Math.sin(f*3),cz+r*Math.sin(ph)]); }
        const rad=[0.025,0.027,0.031,0.033,0.032,0.029,0.026,0.02,0.014,0.0035].map(r=>r*(0.88+0.12*hv));
        T.add(T.hang(sweepTube(P,rad,sg(8),{cap:'point',rings:sg(54)})),(x,y,z,c)=>{ T.hp(x,y,z,c); c.multiplyScalar(1.05); const t=clamp((yC-y)/0.09); if(t>0) c.lerp(tipC,0.45*t); if(y>0.11) c.multiplyScalar(0.95); });
        // a plum band with a marigold edge where the curl starts, and a gold bead at the tip
        out.push(solid(ofRingAt([sd*0.182,yC+0.004,0.058],[0,1,0],0.0305,0.0032,5).scale(fx,1,1),PLUM),solid(ofRingAt([sd*0.182,yC-0.0035,0.058],[0,1,0],0.0302,0.002,5).scale(fx,1,1),MARI));
        { const e=P[P.length-1]; out.push(solid(csph(0.0068,sg(8),sg(6)).translate(e[0]*fx,e[1]-0.004,e[2]),GOLD)); }
        // the plum bow at the tie, facing front and turned out a little, with two short trailing tails
        const bw=bow(0.8,0.8); placeG(bw,0,sd*0.3,sd*0.2,sd*0.088*fx,0.148,-0.012); out.push(...bw);
        out.push(solid(csph(0.011,sg(8),sg(6)).scale(1,0.9,1).translate(sd*0.086*fx,0.139,0.012),GOLD));
      }
      return out; };
    // the head piece is the lantern crown (loose parts that turn: `extras`); nothing static is added to the hair here
    const head=(F,T)=>[];

    /* ---- the face: a gold lantern glyph under the left eye ---- */
    const mark=F=>{ const g=[solid(csph(1,sg(10),sg(8)).scale(0.0036,0.0052,0.0016),MARI),solid(cyl(0.0024,0.0024,0.0009,sg(8)).translate(0,0.0058,0),GOLD),solid(cyl(0.0024,0.0024,0.0009,sg(8)).translate(0,-0.0058,0),GOLD),solid(csph(0.0009,5,4).translate(0,-0.0082,0),GOLD)];
      const out=[F.place(merge(g),-0.052,-0.047,0.0008)];
      // a lantern-shaped highlight in each iris (the same spot and tilt as the eye builder's second highlight)
      const E=S.eyeSize*(fem?1.03:1)*0.74, ex=0.046*S.eyeGap*F.fs[0], ey=(-0.002+0.012*S.eyeHeight)*HEAD_T;
      for(const sd of [-1,1]){ const h=merge([solid(csph(1,6,5).scale(0.0034*E,0.0046*E,0.0013*E),0xfff6dc),solid(cyl(0.0018*E,0.0018*E,0.0007*E,6).translate(0,0.0049*E,0),0xf2c060),solid(cyl(0.0018*E,0.0018*E,0.0007*E,6).translate(0,-0.0049*E,0),0xf2c060)]);
        h.translate(0.0078*E,-0.0105*E,-0.0098).rotateZ(sd*(0.06+0.3*(S.eyeTilt+0.1))); out.push(F.place(h,sd*ex,ey,0.0015)); }
      return out; };

    // a scalloped frill round a vertical axis: its top ring at y, hanging h down (h < 0: standing up), from the ring r0 = [rx, rz] to r1; the last `e0` of its length is the edge colour
    const ruff=o=>{ const ue=1-o.e0, rows=[0,0.5,ue-0.006,ue,1], zc=o.zc||0;
      return surf(rows,o.seg||sg(28),(u,v)=>{ const a=v*TAU, f=Math.pow(u,1.4), y=o.y-o.h*u-Math.sign(o.h)*o.amp*(0.5+0.5*Math.cos(o.N*a))*sm(0.5,1,u);
        return [lerp(o.r0[0],o.r1[0],f)*Math.sin(a),y,lerp(o.r0[1],o.r1[1],f)*Math.cos(a)+zc]; },radial,
        (u,v,x,y,z,c)=>{ if(u>=ue){ c.set(o.edge); } else { c.set(o.main); c.multiplyScalar(0.88+0.12*u); } }); };
    const bell=(x,y,z)=>[pc(csph(0.0062,6,5).translate(x,y,z),(xx,yy,zz,c)=>{ c.set(GOLD); c.multiplyScalar(0.8+0.3*clamp((yy-y)*100+0.5)); })];
    // a limb's section at t (0..1 down it) from its stations, the same smooth curve `limb` draws: [half-width x, half-depth z, z offset]
    const mkAt=st=>{ const n=st.length, m=[1,2,3].map(c=>{ const out=[]; for(let i=0;i<n;i++){ const a=st[Math.max(0,i-1)], b=st[Math.min(n-1,i+1)], dt=(b[0]-a[0])||1; let s=((b[c]||0)-(a[c]||0))/dt;
        const l=i>0?((st[i][c]||0)-(st[i-1][c]||0)):0, r=i<n-1?((st[i+1][c]||0)-(st[i][c]||0)):0; if(l*r<=0) s=0; out.push(s); } return out; });
      return t=>{ t=clamp(t); let i=1; while(i<n-1&&t>st[i][0]) i++; const a=st[i-1], b=st[i], h=(b[0]-a[0])||1, u=clamp((t-a[0])/h), u2=u*u, u3=u2*u;
        return [1,2,3].map((c,ci)=>(2*u3-3*u2+1)*(a[c]||0)+(u3-2*u2+u)*h*m[ci][i-1]+(-2*u3+3*u2)*(b[c]||0)+(u3-u2)*h*m[ci][i]); }; };
    const cw=D.cw, KR=D.KR;
    const SH=mkAt([[0,KR,KR*1.04],[0.14,0.0505*cw,0.054*cw,0.005],[0.3,0.052*cw,0.057*cw,0.011],[0.5,0.041*cw,0.044*cw,0.007],[0.6,0.045*cw,0.048*cw,0.005],[0.66,0.042*cw,0.045*cw,0.005],[0.85,0.037*cw,0.039*cw],[1,0.033*cw,0.035*cw]]);

    /* ---- the corset lacing up the bodice's front (marigold laces crossing between two gold rails) and the lantern button under the collar ---- */
    const lacing=()=>{ const out=[], xs=0.0125, y0=0.245, y1=0.445, nR=6, Z=(x,yd,m)=>frontZ(x,yd)-m, nR2=sg(8);
      out.push(surf(sg(10),sg(4),(u,v)=>{ const yd=lerp(y0-0.004,y1+0.004,u), x=(v*2-1)*0.0158; return [x,yd*TK,frontZ(x,yd)-0.0016]; },()=>[0,0,-1],(u,v,x,y,z,c)=>{ c.set(PLUM); c.multiplyScalar(0.9+0.14*clamp(Math.abs(v*2-1))); }));
      for(const sd of [-1,1]){ const P=[]; for(let i=0;i<=nR2;i++){ const yd=lerp(y0,y1,i/nR2); P.push([sd*xs,yd*TK,Z(sd*xs,yd,0.0028)]); } out.push(tube(P,0.0012,GOLD,4,nR2)); }
      for(let i=0;i<nR;i++){ const ya=lerp(y0,y1,i/nR), yb=lerp(y0,y1,(i+1)/nR), ym=(ya+yb)/2;
        for(const sd of [-1,1]) out.push(tube([[-sd*xs,ya*TK,Z(-sd*xs,ya,0.0034)],[0,ym*TK,Z(0,ym,0.0046)],[sd*xs,yb*TK,Z(sd*xs,yb,0.0034)]],0.00095,MARI,4,4)); }
      // the lantern button: a gold bead with a marigold band and two caps
      const by=0.462, bz=frontZ(0,by)-0.0068, g=[solid(csph(1,sg(8),sg(6)).scale(0.0056,0.0078,0.005).translate(0,by*TK,bz),GOLD),
        solid(ofRingAt([0,by*TK,bz],[0,1,0],0.0058,0.0016,4).scale(1,1,0.9),MARI),solid(cyl(0.0026,0.0026,0.0012,sg(8)).translate(0,by*TK+0.0084,bz),PGOLD),solid(cyl(0.0026,0.0026,0.0012,sg(8)).translate(0,by*TK-0.0084,bz),PGOLD)];
      out.push(...g); return out; };

    /* ---- the back bow: big cream loops with marigold rims and a plum knot, two cream-and-plum tails that lie on the skirt; two plum-and-marigold streamers at the hips ---- */
    const backBow=()=>{ const out=[], b=bow(1.3,1,false,CREAM,MARI,PLUM), bp=bodyAt(0,0.176,0.0105+0.004); placeG(b,0,Math.PI,0,bp[0],bp[1],bp[2]+0.002); out.push(...b);
      for(const sd of [-1,1]) out.push(...streamer(sd*0.17,0.16,-0.14,0.036,CREAM,PLUM));
      return out; };

    // a small plum bow with a gold bell at the throat, and a gold lantern badge between the shoulder blades
    const neckBow=()=>{ const b=bow(0.4,0.6), p=bodyAt(Math.PI,0.572,0.016); placeG(b,0,0,0,p[0],p[1],p[2]); return [...b,...bell(0,p[1]-0.03,p[2]-0.004)]; };
    const badge=()=>{ const p=bodyAt(0,0.375,0.0105), out=[], z=p[2]-0.0005, y=p[1];
      out.push(solid(csph(1,sg(8),sg(6)).scale(0.0085,0.0118,0.0055).translate(0,y,z),GOLD),solid(ofRingAt([0,y,z],[0,1,0],0.0089,0.0017,4).scale(1,1,0.62),MARI),
        solid(cyl(0.0042,0.0042,0.0016,sg(8)).translate(0,y+0.0125,z),PGOLD),solid(cyl(0.0042,0.0042,0.0016,sg(8)).translate(0,y-0.0125,z),PGOLD));
      for(const e of [-1,1]) out.push(tube([[e*0.002,y-0.0135,z],[e*0.004,y-0.026,z+0.002],[e*0.005,y-0.04,z+0.003]],[0.0014,0.0008],4,6),solid(csph(0.0024,4,3).translate(e*0.005,y-0.041,z+0.003),GOLD));
      return out; };

    /* ---- the antenna strand (sways), the ring of lanterns (turns): loose parts on the head ---- */
    const lanternBody=r=>{ const pts=[]; for(let i=0;i<=6;i++){ const t=i/6; pts.push(new THREE.Vector2(0.006+r*Math.pow(Math.sin(Math.PI*t),0.4),lerp(r*1.1,-r*1.1,t))); } return new THREE.LatheGeometry(pts,Math.max(8,Math.round(sg(13)))); };
    const lanternPaint=(h,hot)=>(x,y,z,c)=>{ const k=Math.abs(y)/h, ang=Math.atan2(z,x); c.set(hot); c.lerp(cGl,clamp(k*1.3)); if(fr(ang/(TAU/8))<0.13) c.lerp(cM,0.75); if(k>0.9) c.lerp(cM,0.5); };

    const kit={
      aura:{col:0xffd070,col2:0xff9ac0,style:'orbit',ring:false,n:8,shape:'star',deco:'none'},   /* this set's own aura (kit.aura: model.js) */
      main:{top:0x5a2a4a,bottom:0xe59a2b,shoes:0x5a2a4a,hat:0xe3b448}, /* the main colour of each piece, for the player's recolouring (outfit-tools.js: ofTinter) */ bootTop:0.075, shinCut:0, boot:true, hairColor:MARI, eyeColor:HAZEL,
      eyes:{iris:1.15,hl:1,tilt:0.1,lash:0.85,h:1.04},
      cuts:{torso:[],upperArm:[0.4],thigh:[0.5,0.9,0.96],shin:[0.075,0.88,0.915,0.93]},
      paint, hair, head, mark,
      torso:()=>[jacket(),jacketPiping(),collar(),sash(),...lacing(),...backBow(),...neckBow(),...badge()],
      hips:()=>{ const out=[]; for(let k=0;k<3;k++) out.push(skirtLayer(k)); for(const sd of [-1,1]) out.push(...streamer(Math.PI+sd*1.02,0.16,-0.17,0.034)); return out; },
      shoulder:sd=>{ const out=[], Rm=Math.max(0.045,0.0715*aw), RE=0.045*aw+0.0045, YT=0.04, YB=-0.106;
        const rho=(s,a)=>{ const r=s<0.34?Rm*Math.pow(Math.sin(Math.PI/2*s/0.34),0.85):lerp(Rm,RE,sm(0.34,1,s)); return r*(1+0.05*Math.sin(a*9)*sm(0.5,1,s)); };
        out.push(surf([0,0.08,0.17,0.3,0.46,0.62,0.78,0.92,1],sg(22),(s,v)=>{ const a=v*TAU, r=rho(s,a); return [r*Math.sin(a),lerp(YT,YB,s),r*Math.cos(a)]; },radial,
          (s,v,x,y,z,c)=>{ c.set(PLUM); const f=Math.sin(Math.atan2(x,z)*9); if(s>0.5&&f<-0.5) c.lerp(cPL,0.5); c.multiplyScalar(0.92+0.1*(1-s)); if(s>0.97) c.set(MARI); }));
        out.push(solid(ofRingAt([0,YB,0],[0,1,0],RE+0.0018,0.0034,4),MARI));
        out.push(ruff({y:YB+0.002,h:0.032,r0:[RE+0.002,RE+0.002],r1:[RE+0.013,RE+0.013],N:12,amp:0.005,main:CREAM,edge:PLUM,e0:0.22,seg:sg(22)}));
        return out; },
      forearm:sd=>{ const out=[], R0=0.0262*aw+0.0028;
        out.push(solid(ofRingAt([0,-0.19,0],[0,1,0],R0,0.0026,4),MARI));
        out.push(ruff({y:-0.188,h:0.04,r0:[R0,R0],r1:[R0+0.0105,R0+0.0105],N:11,amp:0.0045,main:CREAM,edge:MARI,e0:0.26,seg:sg(18)}));
        out.push(...bell(sd*0.0215*aw,-0.222,0.0));
        return out; },
      thigh:sd=>{ const out=[], y0=-0.5*D.thigh, tw=D.tw, r=0.0729*tw;
        out.push(ruff({y:y0+0.004,h:0.03,r0:[r+0.002,r*1.05+0.002],r1:[r*1.15,r*1.22],N:14,amp:0.005,main:CREAM,edge:PLUM,e0:0.3,seg:sg(24)}));
        const b=bow(0.3,0.4); placeG(b,0,sd*Math.PI/2,0,sd*(r*1.1+0.004),y0+0.01,0.0); out.push(...b);
        return out; },
      shin:sd=>{ const out=[], len=D.shin, t0=0.11, t1=0.8, A=D.ankleH, sf=S.feet, wf=0.55+0.45*sf, hf=0.8+0.2*sf;
        const fp=(x,t,m)=>{ const q=SH(t), s=clamp(x/q[0],-0.95,0.95); return [x,-t*len,q[2]-q[1]*Math.sqrt(1-s*s)-m]; };
        // the lace-up front: a cream tongue between two gold rails, marigold laces crossing it
        out.push(surf(sg(10),sg(4),(u,v)=>fp((v*2-1)*0.0105,lerp(t0,t1,u),0.0018),()=>[0,0,-1],(u,v,x,y,z,c)=>{ c.set(CREAM); c.multiplyScalar(0.9+0.1*(1-u)); }));
        for(const e of [-1,1]){ const P=[]; for(let i=0;i<=8;i++) P.push(fp(e*0.0113,lerp(t0,t1,i/8),0.0026)); out.push(tube(P,0.0011,GOLD,4,8)); }
        const nR=4; for(let i=0;i<nR;i++){ const ta=lerp(t0+0.02,t1-0.02,i/nR), tb=lerp(t0+0.02,t1-0.02,(i+1)/nR);
          for(const e of [-1,1]) out.push(tube([fp(-e*0.0098,ta,0.0034),fp(0,(ta+tb)/2,0.0044),fp(e*0.0098,tb,0.0034)],0.0012,MARI,4,4)); }
        // the top: a lace frill standing up from a gold rim, three tiny gold bells on cords
        const q=SH(0.075), rr=(q[0]+q[1])/2+0.0034, yR=-0.075*len;
        out.push(solid(ofRingAt([0,yR,q[2]],[0,1,0],rr,0.0023,4),GOLD));
        out.push(ruff({y:yR+0.002,h:-0.034,r0:[q[0]+0.003,q[1]+0.003],r1:[q[0]+0.017,q[1]+0.018],N:14,amp:0.005,main:CREAM,edge:MARI,e0:0.28,seg:sg(26),zc:q[2]}));
        for(const d of [-0.62,0,0.62]){ const a=Math.PI+d, bx=(q[0]+0.004)*Math.sin(a), bz=q[2]+(q[1]+0.004)*Math.cos(a);
          out.push(tube([[bx,yR-0.002,bz],[bx,yR-0.009,bz]],0.0007,PGOLD,4,2)); out.push(...bell(bx,yR-0.0125,bz)); }
        // the gold toe cap: a shell over the toe box, the same rings as the shoe, a hair larger
        const st=[[-0.075,0.037,0.027,0.029],[-0.115,0.031,0.02,0.021],[-0.14,0.018,0.013,0.015],[-0.153,0.004,0.004,0.01]], rg=[]; const k=Math.max(1,Math.round(sg(2)));
        for(let i=0;i<st.length-1;i++) for(let j=0;j<k;j++){ const f=j/k, a=st[i], b=st[i+1]; rg.push([lerp(a[0],b[0],f),lerp(a[1],b[1],f),lerp(a[2],b[2],f),lerp(a[3],b[3],f)]); } rg.push(st[st.length-1]);
        const th=-sd*0.1, ct=Math.cos(th), sn=Math.sin(th);
        out.push(surf(rg.length-1,sg(12),(u,v)=>{ const r=rg[Math.round(u*(rg.length-1))], a=v*TAU, rx=r[1]*wf*1.07+0.0016, rz=r[2]*hf*1.07+0.0016, zc=-(r[3]*hf-A), x=rx*Math.sin(a), y=Math.max(-(rz*Math.cos(a)+zc),-A+0.0004), z=r[0]*sf;
            return [x*ct+z*sn,y-len,-x*sn+z*ct]; },(x,y,z)=>[x,y+len+A*0.4,z+0.05*0],(u,v,x,y,z,c)=>{ c.set(GOLD); c.multiplyScalar(0.9+0.2*sm(-0.4,0.6,Math.sin(v*TAU))); if(u<0.07) c.set(MARI); }));
        return out; },
      extras:(rig,Xx,has)=>{   // has(slot): this outfit's item for the slot is worn: the antenna strand goes with the hair, the lantern crown with the hat
        const fs=rig.dims.faceScale, headY=0.105*fs[1], head=rig.head;
        // the antenna strand: marigold hair that bobs
        if(has('hair')){ const P=[[0,0,0],[-0.005,0.07,-0.008],[-0.024,0.128,0.004],[-0.006,0.168,0.03],[0.02,0.158,0.052]], g=pc(sweepTube(P,[0.0085,0.0075,0.0058,0.0035,0.0012],sg(7),{cap:'point',rings:sg(22)}),(x,y,z,c)=>{ c.copy(ofCol(MARI)).multiplyScalar(0.92+0.2*clamp(y*5)); c.lerp(cML,clamp((y-0.1)*8)*0.6); });
          const m=new THREE.Mesh(g,matChar); m.castShadow=true; const grp=new THREE.Group(); grp.position.set(0.004,0.113*fs[1]*0.93,-0.05); grp.add(m); head.add(grp);
          rig.anims.push((t,dt,mv)=>{ const k=Math.min(1,mv); grp.rotation.z=0.1*Math.sin(t*2.4)+0.06*Math.sin(t*9)*k; grp.rotation.x=0.06*Math.sin(t*1.9+1)-0.08*k*Math.abs(Math.sin(t*6)); }); }
        // the lantern crown: a gold ring with six paper lanterns hanging from it, turning slowly
        if(has('hat')){ const R=0.15, NL=6, lit=[], glow=[], LR=0.026; lit.push(solid(new THREE.TorusGeometry(R,0.0017,4,sg(40)).rotateX(Math.PI/2),GOLD));
          for(let i=0;i<NL;i++){ const a=i*TAU/NL, px=R*Math.sin(a), pz=R*Math.cos(a), cy=-0.055, hh=LR*1.1*1.3;
            glow.push(pc(lanternBody(LR).scale(1,1.3,1),lanternPaint(hh,0xffe6a8)).translate(px,cy,pz));
            lit.push(solid(sweepTube([[px,0.0,pz],[px,cy+hh,pz]],[0.0011,0.0011],4,{cap:'round',rings:3}),GOLD));
            lit.push(pc(cyl(0.011,0.011,0.005,8).translate(px,cy+hh+0.002,pz),(x,y,z,c)=>{ c.set(GOLD); if(y>cy+hh+0.002) c.lerp(cC,0.3); }));
            lit.push(solid(cyl(0.011,0.011,0.005,8).translate(px,cy-hh-0.002,pz),MARI));
            for(const e of [-1,1]) lit.push(solid(sweepTube([[px+e*0.002,cy-hh-0.004,pz],[px+e*0.004,cy-hh-0.014,pz],[px+e*0.0055,cy-hh-0.024,pz]],[0.0012,0.001,0.0007],4,{cap:'round',rings:4}),e<0?MARI:PLUM));
            lit.push(solid(csph(0.0028,5,4).translate(px,cy-hh-0.027,pz),GOLD)); }
          const grp=new THREE.Group(), mL=new THREE.Mesh(merge(lit),matChar), mG=new THREE.Mesh(merge(glow),matGlow); mL.castShadow=true; grp.add(mL,mG); const y0=headY+0.18; grp.position.y=y0; head.add(grp);
          rig.anims.push((t)=>{ grp.rotation.y=t*0.42; grp.position.y=y0+0.004*Math.sin(t*1.7); }); }
      },
      dress:{ shape:{sword:'fan',bow:'hoop',staff:'star'}, grip:PLUM, metal:PGOLD, wood:CREAM, accent:MARI,
        trim:(c,u,part)=>{ const f=fr(u/0.05);
          if(part==='grip'){ if(fr(u/0.016)<0.45) c.lerp(cM,0.92); return; }
          if(f<0.16) c.lerp(cG,0.92); else if(fr(u/0.05+0.5)<0.07) c.lerp(cM,0.88); },
        charm:()=>{ const lit=[], glow=[], cy=-0.05, hh=0.021;
          lit.push(solid(sweepTube([[0,0.004,0],[0.001,-0.014,0.003],[0,cy+hh+0.002,0.004]],[0.0014,0.0014],5,{cap:'round',rings:8}),GOLD));
          lit.push(pc(cyl(0.0085,0.0085,0.0045,10).translate(0,cy+hh+0.001,0.004),(x,y,z,c)=>c.set(GOLD)));
          lit.push(pc(cyl(0.0085,0.0085,0.0045,10).translate(0,cy-hh-0.001,0.004),(x,y,z,c)=>c.set(MARI)));
          for(const e of [-1,-0.5,0,0.5,1]) lit.push(solid(sweepTube([[e*0.0022,cy-hh-0.003,0.004],[e*0.0045,cy-hh-0.013,0.004],[e*0.006,cy-hh-0.024,0.004]],[0.0011,0.001,0.0006],4,{cap:'round',rings:6}),Math.abs(e)<0.3?MARI:PLUM));
          lit.push(solid(csph(0.0026,5,4).translate(0,cy-hh-0.026,0.004),GOLD));
          for(const e of [-1,1]){ const P=[[e*0.006,cy-hh-0.004,0.011],[e*0.012,cy-hh-0.022,0.017],[e*0.016,cy-hh-0.044,0.015]]; lit.push(...ribbon2(P,u=>0.011*(1-0.2*u),[0,0,1],PLUM,MARI,8)); }
          glow.push(pc(lanternBody(0.0158).scale(1,1.34,1),lanternPaint(0.0233,0xffe6a8)).translate(0,cy,0.004));
          return {lit,glow}; } },
    };
    return kit;
  };
})();
