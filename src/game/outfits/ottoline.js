//@ Ottoline's outfit (a porcelain doll): a lace headband with a black bow and a blood rose, long ringlets under a straight hime fringe, glassy violet eyes with painted cheeks and seams, a corset over a white puff-sleeved blouse, a tiered bell skirt with lace, striped stockings, buckled shoes and the key-and-doll weapon dressing
/* ---------- Ottoline: support (both), dark. Design: docs/skillkits/looks/ottoline.md. The hooks of a kit are in docs/CHARACTER.md section 9. ----------
   Palette: black 0x1c1822, porcelain 0xf3eee8, lace 0xf8f4ee, blood rose 0x8a1f3d, silver 0xb9b6c4, violet 0xb06ad8 (the weapon charm's spark only, an unlit glow). Silhouette: a little bell: a wide skirt, a narrow corset, big puffed
   sleeves and a lace-crowned head with long curls. Every part has at least two colours (black and white at the least, rose as the accent); the emblem is a rose and a key, never a skull. */
CHAR_MODELS.ottoline={id:'ottoline',name:'Ottoline',signature:true, items:{hat:'Lace headdress',hair:'Hime ringlets',face:'Doll face',top:'Corset blouse',bottom:'Tier skirt',shoes:'Strap shoes',weapon:'Key & doll'},sexes:['female'],
  note:'The porcelain doll: small, narrow and big-eyed, built for a slight figure with a small waist.',
  ranges:{height:[0.92,1.02],build:[0.88,1.02],shoulders:[0.88,1.05],arms:[0.82,1.05],chest:[0.6,1.15],waist:[0.82,1.0],hips:[0.9,1.15],legs:[0.96,1.12],head:[1.0,1.12],eyeSize:[1.1,1.3],hairLength:[1.0,1.35],hairVolume:[1.0,1.25]},
  setups:[{id:'ottoline',name:'Ottoline',sex:'female',def:true,note:'The doll as drawn: small, a tiny waist, huge glassy eyes, a still face.',v:{height:0.93,build:0.9,chest:0.8,shoulders:0.92,waist:0.84,torso:0.96,legs:1.04,thighs:0.92,arms:0.84,neck:0.95,hands:0.88,feet:0.9,head:1.08,jaw:0.88,chin:0.85,cheeks:1.1,eyeSize:1.3,eyeGap:1.05,eyeHeight:-0.15,eyeTilt:0.05,brow:0.0,noseSize:0.7,mouthSize:0.8,lips:1.0,smile:0.1,hairLength:1.3,hairVolume:1.1}}]};

OUTFITS.ottoline=(function(){
  const BLACK=0x1c1822, BLACK_L=0x2e2638, PORC=0xf3eee8, LACE=0xf8f4ee, ROSE=0x8a1f3d, ROSE_L=0xb8385a, SILVER=0xb9b6c4, HAIR=0x241c2c;
  const cR=ofCol(ROSE), cRL=ofCol(ROSE_L), cP=ofCol(PORC), cB=ofCol(BLACK), cLa=ofCol(LACE);
  const fr=x=>x-Math.floor(x);
  return function(X,D){
    const {S,sg,skinPaint}=X, TK=D.TK, aw=D.aw;
    // a scalloped lace frill round a vertical axis: top ring at y, h down (h<0: standing up), rx/rz from r0 to r1, N scallops of depth amp, the last quarter the edge colour
    const frill=(y,h,r0,r1,N,amp,main,edge,zc)=>{ const k=r=>[r[0],r[1]], rings=[]; for(let i=0;i<=3;i++){ const f=i/3; rings.push({y:y-h*f,rx:lerp(r0[0],r1[0],f),rz:lerp(r0[1],r1[1],f),zc:zc||0}); }
      const g=pc(ofLoft(rings,sg(44),0,TAU),(x,yy,z,c)=>{ const t=(y-yy)/h; c.set(main); c.multiplyScalar(0.9+0.1*t); if(t>0.78) c.set(edge); });
      const p=g.attributes.position, yb=y-h; for(let i=0;i<p.count;i++) if(Math.abs(p.getY(i)-yb)<0.0015){ const a=Math.atan2(p.getX(i),p.getZ(i)-(zc||0)); p.setY(i,yb-Math.sign(h)*amp*(0.5+0.5*Math.cos(N*a))); } p.needsUpdate=true; return g; };
    const bow=(x,y,z,s,col,knot)=>{ const out=[]; for(const sd of [-1,1]){ out.push(solid(ofRibbon([[sd*0.004*s,y,z],[sd*0.02*s,y+0.012*s,z-0.004*s],[sd*0.038*s,y+0.004*s,z-0.006*s],[sd*0.03*s,y-0.012*s,z-0.004*s],[sd*0.008*s,y-0.003*s,z]].map(p=>[p[0]+x,p[1],p[2]]),0.022*s,{up:[0,0,-1],seg:12,th:0.002}),col));
        out.push(solid(ofRibbon([[x+sd*0.004*s,y-0.004*s,z],[x+sd*0.012*s,y-0.028*s,z-0.002*s],[x+sd*0.016*s,y-0.05*s,z-0.001*s]],0.013*s,{up:[0,0,-1],seg:8,th:0.002}),col)); }
      out.push(solid(csph(0.0075*s,sg(8),sg(6)).translate(x,y,z-0.002*s),knot||col)); return out; };

    /* ---- the paint of the body: a white blouse, a black corset with silver boning, white-and-black striped stockings, black strap shoes with a white sock ---- */
    const paint=(part,c,x,y,z,sd)=>{
      switch(part){
        case 'torso': { c.set(PORC); if(y>0.03&&y<0.31){ c.set(BLACK); if(fr(x*34)<0.07) c.set(0x3a3446); if(Math.abs(x)<0.022&&z<0) c.set(PORC); }
          if(y>0.548&&y<0.582) c.set(BLACK); else if(y>=0.582) skinPaint(c); return; }
        case 'upperArm': { if(-y<D.upper*0.2) c.set(PORC); else skinPaint(c); return; }
        case 'foreArm': { if(y<-0.222) skinPaint(c); else if(y<-0.208) c.set(ROSE); else skinPaint(c); return; }
        case 'thigh': { const t=-y/D.thigh; if(t<0.15) skinPaint(c); else { c.set(fr(y*24)<0.5?BLACK:PORC); } return; }
        case 'shin': { const t=-y/D.shin; if(t<0.82){ c.set(fr(y*24)<0.5?BLACK:PORC); } else if(t<0.86) c.set(LACE); else c.set(BLACK); return; }
        case 'foot': { c.set(BLACK); if(y<-D.ankleH+0.012) c.set(SILVER); return; }
      }
      c.set(PORC); };

    /* ---- the corset's front lacing (rose crossed over black), the bust bow, a black choker with a cameo, a lace neck ruff ---- */
    const lacing=()=>{ const out=[], s=torsoSize(X,D,0.17); const by=0.03*TK, ty=0.31*TK;
      out.push(pc(ofPatch(-0.024,0.024,by,ty,sg(8),sg(34),(x,y)=>-torsoSize(X,D,y/TK).rz*Math.sqrt(Math.max(0,1-Math.pow(x/torsoSize(X,D,y/TK).rx,2)))-0.0012,true),(x,y,z,c)=>{ c.set(PORC); const d=Math.abs(x); if(d>0.017) c.set(SILVER); else { const f=fr(y*55+(x>0?0.5:0)*0+Math.abs(x)*0); const k=fr(y*40+x*38); if(k<0.3||k>0.82) c.set(ROSE); else c.set(BLACK_L); } }));
      return out; };
    const neckStuff=()=>{ const out=[], R=D.neckR*1.45, zf=-torsoSize(X,D,0.565).rz; out.push(frill(0.545*TK,0.03,[D.neckR*1.7,D.neckR*1.7],[D.neckR*2.9,D.neckR*2.9],14,0.006,LACE,PORC));
      const cy=0.565*TK; out.push(pc(new THREE.CylinderGeometry(0.0125,0.0125,0.004,sg(14)).rotateX(Math.PI/2).scale(1,1.25,1).translate(0,cy-0.008,-D.neckR*1.15-0.012),(x,y,z,c)=>{ c.set(SILVER); if(Math.hypot(x/0.9,(y-cy+0.008)/1.25)<0.0085&&z<-D.neckR*1.15-0.012) c.set(ROSE); }));
      return out; };

    /* ---- the headdress: a black satin band under a standing lace frill, a bow, and a blood rose ---- */
    const headdress=F=>{ const out=[], y0=0.062, R=Math.sqrt(0.121*0.121-y0*y0);
      out.push(frill(y0+0.03,-0.026,[R*0.99,R*1.03],[R*1.06,R*1.1],16,0.007,LACE,PORC,0.004));
      out.push(pc(ofLoft([{y:y0+0.018,rx:R,rz:R*1.04,zc:0.004},{y:y0+0.016,rx:R*1.01,rz:R*1.05,zc:0.004},{y:y0-0.008,rx:R*1.03,rz:R*1.06,zc:0.004},{y:y0-0.01,rx:R*1.02,rz:R*1.05,zc:0.004}],sg(40),0,TAU),(x,y,z,c)=>{ c.set(BLACK); if(y>y0+0.013||y<y0-0.007) c.set(SILVER); }));
      out.push(...bow(0.09,y0+0.016,-0.06,1.5,ROSE_L+0*1,BLACK).map(g=>g));
      // the blood rose: a deep red bud of three nested petals on the bow
      out.push(solid(csph(0.0115,sg(8),sg(6)).translate(0.09,y0+0.016,-0.066),ROSE),solid(csph(0.008,sg(8),sg(6)).translate(0.09,y0+0.018,-0.072),0xa92a4a),solid(csph(0.0045,6,5).translate(0.09,y0+0.018,-0.077),0x5a1428));
      for(const a of [0.5,2.4]) out.push(solid(csph(0.006,5,4).scale(1.8,0.5,1).rotateZ(a).translate(0.09+Math.cos(a)*0.012,y0+0.016+Math.sin(a)*0.012,-0.06),0x2f5a3a));
      return out; };

    /* ---- the hair: black, a straight hime fringe, long hime side locks and two long ringlets down the front ---- */
    const ringlets=(F,T)=>{ T.crown(0.113,0.5,0.3); T.fringe(9,1.0,0.0); T.sideLocks(0.11*T.hl); T.backLocks(sg(14),0.06,41);
      const hl=T.hl, hv=T.hv, out=[];
      for(const sd of [-1,1]){ const P=[[sd*0.09,0.0,0.03]]; const Lh=0.3*hl, N=sg(26), turns=3.5;
        for(let i=1;i<=N;i++){ const f=i/N, ph=f*turns*TAU, r=0.022*(1-0.35*f); P.push([sd*(0.112+0.012*f)+sd*r*Math.cos(ph)*0.9,-0.02-Lh*f,0.03+0.03*Math.sin(f*2)+r*Math.sin(ph)]); }
        T.add(sweepTube(P,[0.011*hv,0.014*hv,0.015*hv,0.014*hv,0.01*hv,0.0035],sg(7),{cap:'point',rings:sg(60)}),(x,y,z,c)=>{ T.hp(x,y,z,c); c.multiplyScalar(0.95+0.1*Math.sin(y*120)); });
        out.push(solid(ofRingAt([sd*0.1,-0.012,0.03],[0,1,0],0.021,0.0042,sg(5)),ROSE)); }
      return out; };
    const mark=F=>{ const out=[]; for(const sd of [-1,1]){ out.push(pc(F.place(csph(1,sg(8),sg(6)).scale(0.018,0.0115,0.0008),sd*0.056,-0.036,0.0006),(x,y,z,c)=>c.set(ROSE_L)));
        const seam=csph(1,sg(8),sg(6)).scale(0.0009,0.026,0.0007).rotateZ(sd*0.1); out.push(solid(F.place(seam,sd*0.046,-0.074,0.0007),0x7a7684)); }
      out.push(solid(F.place(csph(1,sg(6),sg(5)).scale(0.0028,0.0028,0.0008),0.03,-0.058,0.0007),0x2a2030)); return out; };

    return {
      main:{top:0x1c1822,bottom:0x1c1822,shoes:0x1c1822,hat:0x1c1822}, bootTop:0.82, shinCut:0.8, boot:false, skinFrom:0.582, hairColor:HAIR, eyeColor:0x8a52c8,
      eyes:{iris:1.3,hl:3,tilt:0.05,lash:1.3,h:1.12,browLift:0.003,browThick:0.9},
      cuts:{torso:[0.03,0.31,0.548,0.582],upperArm:[0.2],foreArm:[0.208/D.fore,0.222/D.fore],thigh:[0.15],shin:[0.82,0.86]},
      paint,
      head:F=>headdress(F),
      hair:(F,T)=>ringlets(F,T),
      mark,
      torso:()=>[...lacing(),...neckStuff(),...bow(0,0.325*TK,-torsoSize(X,D,0.325).rz-0.012,1.1,ROSE_L,BLACK)],
      shoulder:sd=>{ const out=[], r=0.066*aw;
        out.push(pc(csph(r,sg(18),sg(12)).scale(1.15,1.0,1.1).translate(0,-0.03,0),(x,y,z,c)=>{ c.set(PORC); if(fr(Math.atan2(x,z)*5/TAU)<0.06) c.lerp(cLa,0.8); if(y<-0.075) c.set(BLACK); c.multiplyScalar(0.93+0.08*Math.min(1,(y+0.1)*8)); }));
        out.push(solid(ofRingAt([0,-0.08,0],[0,1,0],r*0.72,0.0042,sg(5)),ROSE));
        out.push(...bow(sd*0.07*aw,-0.01,-0.04*aw,0.8,ROSE_L,BLACK)); return out; },
      forearm:sd=>[frill(-0.18,0.05,[0.0285*aw+0.002,0.0285*aw+0.002],[0.05*aw,0.05*aw],11,0.006,LACE,PORC),solid(ofRingAt([0,-0.2,0],[0,1,0],0.0268*aw+0.002,0.0026,sg(5)),ROSE)],

      /* ---- the skirt: a black bell with a silver band and a rose waist sash, a white lace petticoat frill under its hem; a big back bow ---- */
      hips:()=>{ const s=torsoSize(X,D,0.04), rx0=s.rx+0.012, rz0=Math.max(s.rz,s.rzBack)+0.012, RX=Math.max(0.29,(D.hx+0.093*D.tw)*1.9), RZ=RX*0.92, rings=[];
        for(let i=0;i<=9;i++){ const f=i/9, y=lerp(0.04*TK,-0.3,f), k=Math.pow(f,0.65); rings.push({y,rx:lerp(rx0,RX,k),rz:lerp(rz0,RZ,k)}); }
        const out=[pc(ofLoft(rings,sg(48),0,TAU),(x,y,z,c)=>{ c.set(BLACK); c.multiplyScalar(0.86+0.18*fr(Math.atan2(x,z)*12/TAU)); const h=y+0.3; if(h<0.05) c.set(BLACK_L); if(h>0.035&&h<0.05) c.set(SILVER); })];
        out.push(frill(-0.29,0.075,[RX*0.995,RZ*0.995],[RX*1.04,RZ*1.04],18,0.012,LACE,PORC));
        out.push(pc(ofLoft([{y:0.058*TK,rx:s.rx+0.006,rz:rz0-0.004},{y:0.053*TK,rx:s.rx+0.009,rz:rz0-0.001},{y:0.0,rx:s.rx+0.009,rz:rz0-0.001},{y:-0.004,rx:s.rx+0.006,rz:rz0-0.004}],sg(34),0,TAU),(x,y,z,c)=>{ c.set(ROSE); if(y>0.053*TK-0.004||y<0.002) c.set(ROSE_L); }));
        const bb=bow(0,0.03*TK,rz0+0.01,1.6,ROSE_L,BLACK).map(g=>{ g.rotateY(Math.PI); return g; }); out.push(...bb);
        return out; },
      thigh:sd=>{ const out=[], y=-D.thigh*0.72, r=0.0715*D.tw+0.003; out.push(solid(ofRingAt([0,y,0],[0,1,0],r,0.0032,sg(5)),ROSE)); out.push(...bow(sd*r*0.5,y+0.004,-r*0.86,0.55,ROSE_L,BLACK)); return out; },
      shin:sd=>{ const out=[]; out.push(frill(-D.shin*0.82,0.035,[0.0405*D.cw+0.002,0.0405*D.cw+0.002],[0.062*D.cw,0.062*D.cw],12,0.005,LACE,PORC));
        out.push(solid(ofRingAt([0,-D.shin*0.935,0],[0,1,0],0.036*D.cw+0.002,0.0026,sg(5)),SILVER),solid(vbox(0.014,0.012,0.006,0,-D.shin*0.935,-0.036*D.cw-0.004),SILVER));
        out.push(solid(vbox(0.056*(0.55+0.45*S.feet),0.012,0.046,0,-D.shin-D.ankleH+0.006,0.045),SILVER)); return out; },
      dress:{ shape:{sword:'key',bow:'crescent',staff:'key'}, grip:BLACK_L, metal:SILVER, wood:0x2e2638, accent:ROSE,
        trim:(c,u,part)=>{ const f=((u/0.05)%1+1)%1; if((part==='blade'||part==='limb'||part==='shaft'||part==='rim')&&Math.abs(f-0.5)<0.12) c.lerp(cRL,0.85); if(part==='grip'&&((u/0.012)%1+1)%1<0.35) c.lerp(cP,0.8); },
        charm:()=>{ const lit=[], glow=[];   // a tiny porcelain doll on a ribbon: round head, a rose bow, a black dress, button eyes; a key beside it
          lit.push(solid(sweepTube([[0,0.004,0],[0,-0.022,0.003]],[0.0014,0.0014],4,{cap:'round',rings:4}),ROSE));
          lit.push(solid(csph(0.0105,sg(10),sg(8)).translate(0,-0.038,0.004),PORC),solid(new THREE.ConeGeometry(0.014,0.026,sg(10)).translate(0,-0.062,0.004),BLACK),solid(new THREE.CylinderGeometry(0.014,0.014,0.003,sg(10)).translate(0,-0.075,0.004),SILVER));
          lit.push(solid(csph(0.0017,5,4).translate(-0.0042,-0.0385,-0.0062),BLACK),solid(csph(0.0017,5,4).translate(0.0042,-0.0385,-0.0062),BLACK),solid(csph(0.0042,5,4).scale(1.8,0.8,0.8).translate(0.006,-0.047,0.004),ROSE));
          lit.push(solid(ofRingAt([0.026,-0.045,0.004],[0,0,1],0.0045,0.0012,6),SILVER),solid(vbox(0.0014,0.03,0.0014,0.026,-0.064,0.004),SILVER),solid(vbox(0.007,0.0016,0.0014,0.0295,-0.074,0.004),SILVER));
          glow.push(pc(csph(0.0034,6,5).translate(-0.02,-0.05,0.004),(x,y,z,c)=>c.set(0xb06ad8)));
          return {lit,glow}; } },
    };
  };
})();
