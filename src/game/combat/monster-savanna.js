//@ The Amber Reach's monster models: feline (grass stalker), swarm (locust cloud), bird (heron, hawk, vulture), hoofed (buffalo, rhino, hippo, croc), hollowed (a grey-veined Kin sleepwalker)
/* Agent map: fills MODELS.feline / swarm / bird / hoofed / hollowed (same contract as monster-parts.js: geo, build, anim; models face -z, metres at scale 1). The stats are the FAM rows of the same names and the
   kinds the MON_DEFS rows a37..a45 (shared/monster-defs.js, the Amber Reach block); the boar, treant, beetle, wisp and goblin kinds there reuse their families with new pal flags. Tested by client-smoke (the roster
   builds) and tools/monster-preview.js (`--ids grassstalker,locusts,poolheron,anvilhawk,dawnvulture,cinderbuffalo,greyrhino,deltahippo,mudcroc,hollowkin`). Helpers sv* are this file's own.
   feline: pal.body / belly / tip (tail tuft, ear backs) / eye / legs; pal.spots (rosettes darker than the coat), pal.stripe. swarm: pal.body / wing / eye, a cloud of small locusts round one centre.
   bird: pal.kind 'heron' (long legs and neck, dagger bill) | 'hawk' (hovers, hooked bill) | 'vulture' (bald neck, ruff, hooked bill); pal.body / wing / head / beak / legs / eye, pal.ruff.
   hoofed: pal.kind 'buffalo' (hump, swept horns) | 'rhino' (two horns, plated skin) | 'hippo' (barrel, wide jaw) | 'croc' (low, long jaws, scutes); pal.body / belly / horn / eye / legs, pal.grey (grey veins creeping over it).
   hollowed: pal.skin / vein (the grey veins) / eye / hair / cloth, pal.ears 'long' | 'round' | 'crest', pal.tail. */
const svFur=(p,k)=>(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.72+0.42*vn3(x*11,y*6,z*11)); if(y<k) moTint(c,p.belly||p.body,clamp((k-y)*4)*0.6); };
// four legs on pivots at (x,y,z) hanging from their tops; geometry G.leg (or G.legF / G.legB for the front and back pairs)
function svLegs(g,M,G,pos,y){ return pos.map(([x,z,k])=>{ const l=new THREE.Group(); l.position.set(x,y,z); l.add(M(G[k||'leg'])); g.add(l); return l; }); }

MODELS.feline={
  geo(d,p){
    const G={}, W=[-1,1], fur=svFur(p,0.55);
    const body=[moLoftZ([{z:-0.55,rx:0.12,ry:0.14,y:0.84},{z:-0.38,rx:0.2,ry:0.26,y:0.76},{z:-0.1,rx:0.22,ry:0.27,y:0.72},{z:0.2,rx:0.17,ry:0.2,y:0.7},{z:0.45,rx:0.2,ry:0.25,y:0.72},{z:0.65,rx:0.1,ry:0.13,y:0.72}],moQ(18),(x,y,z,c)=>{
      fur(x,y,z,c); if(p.spots&&moNoise(x+3,y,z,9)>0.66) c.multiplyScalar(0.55); if(p.stripe&&Math.sin(z*24+Math.sin(y*8))>0.6&&y>0.6) c.multiplyScalar(0.6); })];
    G.body=moMerge(body);
    const head=[moEll(0.17,0.16,0.2,0,0,0,fur,null,12),moEll(0.1,0.085,0.14,0,-0.04,-0.17,p.belly,null,10),moEll(0.03,0.025,0.035,0,0,-0.3,0x141014,null,6),moEll(0.09,0.04,0.12,0,-0.12,-0.12,p.belly,null,8),
      moEll(0.17,0.17,0.12,0,0.0,0.18,fur,null,10)];   // skull, muzzle, nose, jaw, the neck behind it
    for(const sd of W){
      head.push(moEll(0.055,0.07,0.03,sd*0.11,0.15,0.04,(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.9); if(y>0.17) c.set(p.tip); },[-0.1,0,-sd*0.3],7),moEll(0.028,0.02,0.02,sd*0.085,0.04,-0.13,p.eye,[0,0,-sd*0.3],6),
        moCone([sd*0.045,-0.1,-0.26],[sd*0.05,-1,-0.25],0.09,0.016,0xf4f0e0,4));   // ears, eyes, fangs
      for(let i=0;i<4;i++) head.push(moCone([sd*0.07,-0.04,-0.24],[sd*(0.6+i*0.08),-0.2+i*0.07,-0.3],0.1,0.007,0xe8e0d0,3));   // whiskers
    }
    G.head=moMerge(head);
    G.tail=moTube([[0,0,0],[0,0.1,0.35],[0,0.18,0.7],[0,0.05,1.0]],0.05,0.035,(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.85); if(z>0.82) c.set(p.tip); },7,true);
    G.leg=moMerge([moLimb([[0,0.075],[0.3,0.06],[0.6,0.04],[1,0.04]],0.5,1,1,(x,y,z,c)=>{ c.set(y<-0.26?p.legs:p.body).multiplyScalar(0.85+0.2*moNoise(x,y,z,9)); },7),moEll(0.05,0.03,0.08,0,-0.5,-0.04,p.legs,null,6)]);
    return G;
  },
  build(d,G,M,g,P0){
    P0.body=M(G.body); g.add(P0.body); P0.head=new THREE.Group(); P0.head.position.set(0,0.88,-0.62); P0.head.add(M(G.head)); P0.body.add(P0.head);
    P0.tail=new THREE.Group(); P0.tail.position.set(0,0.74,0.62); P0.tail.add(M(G.tail)); g.add(P0.tail);
    P0.legs=svLegs(g,M,G,[[-0.13,-0.4],[0.13,-0.4],[-0.13,0.4],[0.13,0.4]],0.52);
  },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*sp*4.4;
    const amp=Math.min(1,sp/2)*0.75;
    P0.legs.forEach((l,k)=>{ l.rotation.x=Math.sin(m.ph+GAIT[k])*amp; });
    P0.body.rotation.x=lunge*-0.35; P0.body.position.y=Math.abs(Math.sin(m.ph))*0.03*Math.min(1,sp);   // it crouches low while it stalks
    P0.head.rotation.x=0.18-lunge*0.9+Math.sin(t*1.4+m.s*5)*0.04;
    P0.tail.rotation.y=Math.sin(t*1.8+m.s*7)*0.3; P0.tail.rotation.x=-0.15+Math.sin(t*1.3+m.s*3)*0.08;
  }
};

MODELS.swarm={
  geo(d,p){
    const G={}, parts=[], n=moQ(34), bd=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.75+0.5*moNoise(x,y,z,30)); };
    for(let i=0;i<n;i++){
      const a=h3(i,1,7)*TAU, b=Math.acos(2*h3(i,2,7)-1), r=0.3+0.5*h3(i,3,7), x=Math.sin(b)*Math.cos(a)*r, y=1.0+Math.cos(b)*r*0.7, z=Math.sin(b)*Math.sin(a)*r, ry=h3(i,4,7)*TAU;
      parts.push(moEll(0.03,0.025,0.075,x,y,z,bd,[0,ry,0],5),moEll(0.07,0.008,0.03,x+Math.cos(ry)*0.05,y+0.025,z-Math.sin(ry)*0.05,p.wing,[0,ry,0.4],5),moEll(0.07,0.008,0.03,x-Math.cos(ry)*0.05,y+0.025,z+Math.sin(ry)*0.05,p.wing,[0,ry,-0.4],5));
    }
    G.cloud=moMerge(parts); G.eyes=moMerge([-1,1].map(sd=>moEll(0.05,0.06,0.04,sd*0.09,1.0,-0.78,p.eye,null,6)));   // the cloud, and two bright eyes in its front: the swarm looks at you
    return G;
  },
  build(d,G,M,g,P0){ P0.cloud=new THREE.Group(); P0.cloud.add(M(G.cloud)); P0.cloud.add(M(G.eyes)); g.add(P0.cloud); },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*(10+sp*3);
    P0.cloud.rotation.y=m.ph*0.18; P0.cloud.position.y=0.25+Math.sin(m.ph*0.5)*0.08;   // it drifts at head height and turns slowly
    const k=1+Math.sin(m.ph*1.7)*0.06+lunge*0.5; P0.cloud.scale.set(k,1/k,k);
  }
};

MODELS.bird={
  geo(d,p){
    const G={}, W=[-1,1], kd=p.kind||'heron', heron=kd==='heron', vult=kd==='vulture', legL=heron?0.78:kd==='hawk'?0.3:0.42, bodyY=legL+0.3, nk=heron?0.7:vult?0.32:0.2;
    const fe=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.72+0.4*vn3(x*14,y*9,z*14)); if(y<bodyY-0.05) moTint(c,p.head,0.35); }, wf=(x,y,z,c)=>{ c.set(p.wing).multiplyScalar(0.7+0.5*vn3(x*16,y*5,z*16)); };
    const body=[moLoftZ([{z:-0.3,rx:0.1,ry:0.12,y:bodyY+0.06},{z:-0.1,rx:0.16,ry:0.19,y:bodyY},{z:0.15,rx:0.15,ry:0.18,y:bodyY-0.02},{z:0.4,rx:0.07,ry:0.08,y:bodyY-0.06},{z:0.55,rx:0.05,ry:0.04,y:bodyY-0.1}],moQ(14),fe),
      ...[-1,0,1].map(i=>moCone([i*0.04,bodyY-0.1,0.45],[i*0.25,-0.2,1],vult?0.3:0.34,0.04,wf,4))];   // body, tail feathers
    if(vult) for(let i=0;i<9;i++){ const a=i/9*TAU; body.push(moCone([Math.cos(a)*0.09,bodyY+0.16+Math.sin(a)*0.04,-0.28],[Math.cos(a)*0.5,0.3,0.7],0.17,0.04,(x,y,z,c)=>{ c.set(p.ruff||0xe8e0d0).multiplyScalar(0.8+0.3*vn3(x*20,y*20,z*20)); },4)); }   // the ruff
    G.body=moMerge(body);
    const neck=moTube(heron?[[0,0,0],[0,0.2,0.1],[0,0.42,-0.04],[0,0.62,-0.1],[0,0.78,-0.14]]:[[0,0,0],[0,0.1,-0.05],[0,0.2,-0.12],[0,nk,-0.16]],heron?0.05:0.06,0.035,vult?(x,y,z,c)=>{ c.set(0xc08a78).multiplyScalar(0.8+0.3*moNoise(x,y,z,12)); }:fe,6,true);
    const hy=heron?0.8:nk+0.03, hd=[moEll(0.065,0.06,0.09,0,hy,-0.16,vult?0xc08a78:p.head,null,8),moEll(0.025,0.03,0.025,-0.06,hy+0.01,-0.2,p.eye,null,5),moEll(0.025,0.03,0.025,0.06,hy+0.01,-0.2,p.eye,null,5)];
    if(heron) hd.push(moCone([0,hy,-0.22],[0,-0.05,-1],0.4,0.03,p.beak,5),moTube([[0,hy+0.04,-0.12],[0,hy+0.08,0.1],[0,hy+0.0,0.28]],0.025,0.006,p.head,5,true));   // a dagger bill, and a plume
    else hd.push(moHorn([0,hy-0.01,-0.22],[0,-0.1,-1],0.14,0.04,1.6,p.beak,5,[0,-1,0]));   // a hooked bill
    G.neck=moMerge([neck]); G.head=moMerge(hd);
    const wing=sd=>{ const o=[moEll(0.5,0.035,0.2,sd*0.5,0,0.05,wf,[0,0,-sd*0.08],10)]; for(let i=0;i<(vult?6:4);i++) o.push(moCone([sd*(0.55+i*0.14),0,-0.05],[sd*0.3,-0.1,1],vult?0.5:0.4,0.07,wf,4)); return moMerge(o); };
    G.wR=wing(1); G.wL=wing(-1);
    G.leg=moMerge([moBone([0,0,0],[0,-legL,0.02],0.03,0.018,p.legs,5),moBone([0,-legL,0.02],[0,-legL-0.02,-0.1],0.015,0.015,p.legs,4),moBone([0,-legL,0.02],[-0.06,-legL-0.02,-0.08],0.012,0.012,p.legs,4),moBone([0,-legL,0.02],[0.06,-legL-0.02,-0.08],0.012,0.012,p.legs,4)]);
    G.legL=legL; G.bodyY=bodyY;
    return G;
  },
  build(d,G,M,g,P0){
    const fly=d.pal.kind==='hawk'; P0.fly=fly;
    P0.body=M(G.body); g.add(P0.body);
    const nk=new THREE.Group(); nk.position.set(0,G.bodyY+0.04,-0.28); nk.add(M(G.neck)); P0.body.add(nk); P0.neck=nk;
    nk.add(M(G.head));   // (the head's geometry is already in the neck's frame)
    for(const [k,sd] of [['wR',1],['wL',-1]]){ const w=new THREE.Group(); w.position.set(sd*0.14,G.bodyY+0.1,0); w.add(M(sd>0?G.wR:G.wL)); P0.body.add(w); P0[k]=w; }
    P0.legs=[-0.07,0.07].map(x=>{ const l=new THREE.Group(); l.position.set(x,G.legL+0.28,0.02); l.add(M(G.leg)); g.add(l); return l; });
  },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*(sp*3.4+(P0.fly?8:0));
    const amp=Math.min(1,sp/2)*0.5;
    P0.legs.forEach((l,k)=>{ l.rotation.x=Math.sin(m.ph+k*Math.PI)*amp; l.visible=!P0.fly; });
    const hov=P0.fly?0.7+Math.sin(m.ph*0.5+m.s*3)*0.08:0, fl=P0.fly?Math.sin(m.ph*1.6)*0.8:0.12+Math.sin(t*1.2+m.s*4)*0.04+lunge*1.2;   // the hawk hovers and beats; the others fold their wings
    P0.body.position.y=hov+Math.abs(Math.sin(m.ph))*0.02*Math.min(1,sp); P0.body.rotation.x=-lunge*0.35;
    P0.wR.rotation.z=-fl; P0.wL.rotation.z=fl;
    P0.neck.rotation.x=-lunge*0.7+Math.sin(m.ph*0.5)*0.05*Math.min(1,sp);   // it strikes with the neck
  }
};

MODELS.hoofed={
  geo(d,p){
    const G={}, W=[-1,1], kd=p.kind||'buffalo', croc=kd==='croc', hip=kd==='hippo', rh=kd==='rhino', bu=kd==='buffalo';
    const by=croc?0.36:0.8, ry=croc?0.2:hip?0.52:0.5, rx=croc?0.3:hip?0.5:rh?0.44:0.42, hump=bu?0.16:rh?0.04:0;
    const sk=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.72+0.42*vn3(x*9,y*5,z*9)); if(y<by-ry*0.4) moTint(c,p.belly||p.body,0.5);
      if(p.grey){ const n=Math.abs(moNoise(x+5,y,z,6)-0.5); if(n<0.05) c.set(p.grey); }   // grey veins creeping over the hide
      if(croc&&y>by+ry*0.5&&Math.sin(z*40)*Math.sin(x*40)>0.2) c.multiplyScalar(0.62);   // the scutes down a crocodile's back
      if(rh&&Math.abs(moNoise(x,y,z,5)-0.5)<0.04) c.multiplyScalar(0.6); };   // the folds of a rhino's plates
    const L=croc?1.0:0.8, body=[moLoftZ([{z:-L,rx:rx*0.5,ry:ry*0.6,y:by},{z:-L*0.6,rx:rx*0.95,ry:ry+hump,y:by+hump*0.4},{z:-L*0.2,rx:rx,ry:ry+hump*0.6,y:by+hump*0.2},{z:L*0.2,rx:rx*0.95,ry:ry,y:by},{z:L*0.6,rx:rx*0.8,ry:ry*0.85,y:by},{z:L,rx:rx*0.3,ry:ry*0.4,y:by-0.02}],moQ(18),sk)];
    if(croc) body.push(moTube([[0,by,L*0.9],[0,by-0.03,L*1.5],[0.05,by-0.06,L*2.1],[0,by-0.08,L*2.6]],0.18,0.025,sk,7,true));   // the long tail
    else body.push(moTube([[0,by+ry*0.5,L*0.9],[0,by,L*1.05],[0.05,by-0.3,L*1.1]],0.04,0.02,sk,5,true),moEll(0.05,0.1,0.05,0.05,by-0.38,L*1.1,p.horn,null,5));
    if(bu) for(let i=0;i<6;i++) body.push(moCone([0,by+ry+hump-0.03,-L*0.55+i*0.08],[0,1,-0.3],0.14,0.07,(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.55+0.3*vn3(x*20,y*20,z*20)); },4));   // a shaggy hump
    G.body=moMerge(body);
    const hs=croc?1.4:1, hd=croc?[moEll(0.2,0.1,0.3,0,0,-0.1,sk,null,10),moTube([[0,-0.01,-0.3],[0,-0.02,-0.6],[0,-0.03,-0.95]],0.13,0.09,sk,8,true),moEll(0.19,0.025,0.5,0,-0.1,-0.5,p.belly||p.body,null,8)]:
      [moEll(rx*0.55*hs,ry*0.55,0.34,0,0,-0.15,sk,null,12),moEll(rx*(hip?0.62:0.4),ry*(hip?0.42:0.3),0.26,0,-0.1,-0.45,sk,null,10),moEll(rx*(hip?0.6:0.36),0.06,0.3,0,-0.3,-0.42,p.belly||p.body,null,8)];
    for(const sd of W){
      hd.push(moEll(0.035,0.04,0.03,sd*(croc?0.16:rx*0.4),croc?0.07:ry*0.3,croc?-0.22:-0.38,p.eye,null,6));
      if(croc) for(let i=0;i<7;i++) hd.push(moCone([sd*0.09,-0.07,-0.3-i*0.1],[sd*0.1,1,0],0.06,0.013,0xf4f0e0,4));   // teeth
      else hd.push(moEll(0.06,0.11,0.03,sd*rx*0.52,ry*0.5,0.0,sk,[0.3,0,-sd*0.6],6));   // ears
      if(bu) hd.push(moTube([[sd*0.3,0.18,-0.1],[sd*0.5,0.22,-0.1],[sd*0.62,0.4,-0.14],[sd*0.55,0.62,-0.22]],0.06,0.015,p.horn,6,true));
      if(hip) hd.push(moCone([sd*0.2,-0.28,-0.62],[sd*0.1,0.9,-0.3],0.14,0.04,p.horn,4),moEll(0.045,0.035,0.04,sd*0.12,0.0,-0.68,0x201414,null,5));   // tusks, nostrils
    }
    if(rh) hd.push(moCone([0,0.0,-0.62],[0,1,-0.55],0.55,0.075,p.horn,6),moCone([0,0.1,-0.4],[0,1,-0.35],0.28,0.06,p.horn,6));   // two horns, one behind the other
    G.head=moMerge(hd);
    const lw=croc?0.07:hip?0.14:0.12, lh=croc?0.28:0.62;
    G.leg=moMerge([moLimb([[0,lw],[0.4,lw*0.8],[0.8,lw*0.7],[1,lw*0.75]],lh,1,1,(x,y,z,c)=>{ c.set(p.legs).multiplyScalar(0.8+0.3*moNoise(x,y,z,8)); },7),moEll(lw*0.9,0.05,lw*1.1,0,-lh-0.02,-0.01,0x2a2018,null,6)]);
    G.dims={by,L,rx,lh,croc,ry}; return G;
  },
  build(d,G,M,g,P0){
    const D=G.dims; P0.body=M(G.body); g.add(P0.body); P0.head=new THREE.Group(); P0.head.position.set(0,D.by+(D.croc?0.04:D.ry*0.15),-D.L*0.98-0.1); P0.head.add(M(G.head)); P0.body.add(P0.head);
    const lz=D.L*0.55; P0.legs=svLegs(g,M,G,[[-D.rx*0.7,-lz],[D.rx*0.7,-lz],[-D.rx*0.7,lz],[D.rx*0.7,lz]],D.lh+0.04);
  },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*sp*3.2;
    const amp=Math.min(1,sp/2)*0.5;
    P0.legs.forEach((l,k)=>{ l.rotation.x=Math.sin(m.ph+GAIT[k])*amp; });
    P0.body.rotation.x=lunge*-0.2; P0.body.position.y=Math.abs(Math.sin(m.ph))*0.025*Math.min(1,sp);
    P0.head.rotation.x=-lunge*1.2+Math.sin(t*1.3+m.s*5)*0.05;   // it lowers its head and charges
  }
};

MODELS.hollowed={
  geo(d,p){
    const G={}, W=[-1,1], skin=(x,y,z,c)=>{ c.set(p.skin).multiplyScalar(0.8+0.3*moNoise(x,y,z,9)); if(Math.abs(moNoise(x+2,y*0.8,z,5)-0.5)<0.045) c.set(p.vein); };   // grey skin, dark veins running over it
    const cl=(x,y,z,c)=>{ c.set(p.cloth).multiplyScalar(0.75+0.35*moNoise(x,y,z,10)); };
    G.torso=moMerge([moLoft([{y:0.82,rx:0.15,rz:0.1},{y:0.95,rx:0.19,rz:0.12},{y:1.15,rx:0.2,rz:0.12},{y:1.32,rx:0.23,rz:0.13},{y:1.42,rx:0.1,rz:0.08}],moQ(14),cl),moTube([[0,1.38,0],[0.02,1.48,-0.04],[0.03,1.55,-0.06]],0.075,0.06,skin,6,true),
      moTube([[0,0.9,0.08],[0,0.7,0.3],[0.02,0.45,0.5],[0.0,0.25,0.62]],0.055,0.02,skin,6,true)]);   // the sash-clad torso, a bowed neck, the tail
    const hd=[moEll(0.105,0.12,0.115,0,0,0,skin,null,12),moEll(0.07,0.06,0.09,0,-0.05,-0.1,skin,null,8),moEll(0.025,0.02,0.02,0,-0.04,-0.19,0x141014,null,5),moEll(0.1,0.1,0.11,0,0.08,0.04,p.hair,null,8)];
    for(const sd of W){
      hd.push(moEll(0.02,0.03,0.018,sd*0.055,0.01,-0.1,p.eye,null,5));
      if(p.ears==='long') hd.push(moCone([sd*0.07,0.1,0.02],[sd*0.2,1,0.2],0.3,0.045,skin,4));
      else if(p.ears==='crest') hd.push(moCone([sd*0.04,0.14,0.0],[sd*0.1,1,-0.2],0.22,0.04,p.hair,4));
      else hd.push(moEll(0.045,0.055,0.02,sd*0.1,0.1,0.0,skin,[0,0,-sd*0.3],6));
    }
    G.head=moMerge(hd);
    G.arm=moMerge([moLimb([[0,0.045],[0.4,0.038],[1,0.03]],0.5,1,1,skin,6),...[-1,0,1].map(i=>moCone([i*0.014,-0.52,-0.01],[i*0.1,-1,0],0.08,0.01,0x3a3640,3))]);
    G.leg=moMerge([moLimb([[0,0.07],[0.4,0.055],[1,0.04]],0.76,1,1,skin,6),moEll(0.045,0.03,0.08,0,-0.77,-0.04,skin,null,6)]);
    return G;
  },
  build(d,G,M,g,P0){
    P0.torso=M(G.torso); g.add(P0.torso); P0.head=new THREE.Group(); P0.head.position.set(0,1.54,-0.05); P0.head.add(M(G.head)); P0.torso.add(P0.head);
    P0.arms=[-1,1].map(sd=>{ const a=new THREE.Group(); a.position.set(sd*0.26,1.3,0); a.add(M(G.arm)); P0.torso.add(a); return a; });
    P0.legs=[-1,1].map(sd=>{ const l=new THREE.Group(); l.position.set(sd*0.1,0.84,0); l.add(M(G.leg)); g.add(l); return l; });
  },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*sp*2.6;
    const sw=Math.sin(m.ph)*0.45*Math.min(1,sp/1.5);
    P0.legs[0].rotation.x=sw; P0.legs[1].rotation.x=-sw;
    P0.arms.forEach((a,k)=>{ a.rotation.x=-1.25-lunge*0.8+Math.sin(m.ph+k*Math.PI)*0.08+Math.sin(t*0.9+m.s*3+k)*0.05; });   // arms held out in front: a sleepwalker
    P0.torso.rotation.x=0.12+lunge*0.3; P0.torso.rotation.z=Math.sin(m.ph*0.5)*0.05;
    P0.head.rotation.z=Math.sin(t*0.7+m.s*4)*0.12; P0.head.rotation.x=0.2;   // the head lolls
  }
};
