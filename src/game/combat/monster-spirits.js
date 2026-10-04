//@ Wisp and ghost models (model 'wisp'): fire spirits (onibi, rime wisp) with a bright core and rising tongues; the yurei, ice wraith and barrow wight, tattered figures that float
/* One mesh (body) that bobs and leans; the flame wisp has a second one (P0.flick, the topmost tongue, which flickers). pal.ghost picks a ghost; the ghost's look follows its id:
   the yurei (long black hair, a white kimono, arms held out), the ice wraith and the Grave Wisp (a hood of frost), the barrow wight and Haugbui, the Barrow Lord (a crown of ice, a cloak in rags). */
MODELS.wisp={
  geo(d,p){
    const G={}, W=[-1,1], body=[];
    if(!p.ghost){
      const fl=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.85+0.3*moNoise(x,y,z,6)); moTint(c,p.core,clamp(1-Math.hypot(x,z)*2.2)*0.5+clamp((y-1.3)*0.7)*0.4); };
      body.push(moEll(0.42,0.46,0.42,0,0.95,0,fl,null,moQ(16)),moEll(0.26,0.28,0.26,0,0.98,0,p.core,null,10));
      for(let i=0;i<9;i++){ const a=i/9*TAU+0.3, r=0.3, L=0.5+0.35*h3(i,1,1); body.push(moTube([[Math.cos(a)*r,1.12,Math.sin(a)*r],[Math.cos(a+0.5)*r*0.75,1.12+L*0.45,Math.sin(a+0.5)*r*0.75],[Math.cos(a+1.0)*r*0.2,1.12+L,Math.sin(a+1.0)*r*0.2]],0.12,0.015,fl,6,true,t=>1+0.3*Math.sin(Math.PI*Math.min(1,t*1.1)))); }   // tongues of flame
      for(const sd of W) body.push(moEll(0.07,0.1,0.05,sd*0.14,1.02,-0.4,p.eye,null,7),moEll(0.02,0.03,0.02,sd*0.135,1.05,-0.435,0xffffff,null,4));
      body.push(moEll(0.06,0.025,0.03,0,0.82,-0.42,p.eye,null,6));
      G.flick=moTube([[0,0,0],[0.05,0.28,0],[0,0.55,0.04]],0.11,0.01,(x,y,z,c)=>{ c.set(p.body).lerp(_tint.set(p.core),clamp(y*1.6)); },6,true,t=>1+0.3*Math.sin(Math.PI*t));
      G.body=moMerge(body); return G;
    }
    const st=d.id==='barrowwight'||d.id==='haugbui'?'wight':d.id==='icewraith'||d.id==='gravewisp'?'wraith':'yurei', skinC=st==='yurei'?0xe8e4e0:p.core;   // (haugbui: the Barrow Lord, a huge wight; gravewisp: his thralls)
    const sh=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.72+0.3*clamp(y*0.9)+0.12*moNoise(x,y,z,7)); if(st==='yurei'&&y>1.05&&y<1.25&&Math.abs(x)<0.18-(1.25-y)*0.5) c.set(skinC); };
    // the shroud: a tapering torso down to a ragged hem of strips, twisting in the wind
    body.push(moLoft([{y:0.7,rx:0.16,rz:0.13},{y:0.95,rx:0.2,rz:0.15},{y:1.15,rx:0.17,rz:0.12},{y:1.32,rx:0.22,rz:0.14},{y:1.42,rx:0.1,rz:0.09},{y:1.5,rx:0.06,rz:0.06}],moQ(14),sh));
    for(let i=0;i<10;i++){ const a=i/10*TAU, L=0.55+0.45*h3(i,2,2), r=0.2+0.05*(i%2); body.push(moTube([[Math.cos(a)*0.14,0.85,Math.sin(a)*0.11],[Math.cos(a)*r*1.3,0.85-L*0.5,Math.sin(a)*r*1.3],[Math.cos(a+0.4)*r*1.5,0.85-L,Math.sin(a+0.4)*r*1.5]],0.09,0.012,(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.6+0.4*clamp((y+0.1)*1.3)); },5,true)); }
    const head=(y,rx,ry)=>moEll(rx,ry,rx,0,y,-0.02,skinC,null,12);
    if(st==='yurei'){
      body.push(moBone([0,1.4,0],[0,1.52,-0.02],0.06,0.05,skinC,6),head(1.62,0.13,0.16),moEll(0.17,0.2,0.16,0,1.66,0.05,p.hair,null,12),moEll(0.16,0.06,0.03,0,1.72,-0.15,p.hair,null,8));
      for(const sd of W){ body.push(moEll(0.04,0.06,0.03,sd*0.06,1.62,-0.13,0x0a0a0e,null,6),moEll(0.012,0.012,0.01,sd*0.06,1.62,-0.15,p.eye,null,4),
        moTube([[sd*0.14,1.7,-0.05],[sd*0.2,1.3,-0.1],[sd*0.22,0.9,-0.05],[sd*0.2,0.6,0.0]],0.06,0.02,p.hair,6,true),moBone([sd*0.22,1.28,0],[sd*0.28,1.1,-0.35],0.05,0.04,sh,6),moBone([sd*0.28,1.1,-0.35],[sd*0.26,0.9,-0.6],0.04,0.03,skinC,6));
        for(let i=0;i<4;i++) body.push(moBone([sd*0.26+ (i-1.5)*0.015,0.9,-0.6],[sd*0.26+(i-1.5)*0.03,0.72,-0.66],0.012,0.006,skinC,4)); }   // limp hands, long fingers
      body.push(moEll(0.03,0.012,0.015,0,1.55,-0.14,0xb03a48,null,6));
      for(let i=0;i<5;i++) body.push(moTube([[(i-2)*0.06,1.76,0.08],[(i-2)*0.1,1.3,0.16],[(i-2)*0.12,0.85,0.12],[(i-2)*0.1,0.5,0.1]],0.05,0.012,p.hair,5,true));
    } else {
      body.push(moBone([0,1.4,0],[0,1.52,-0.02],0.06,0.05,skinC,6));
      const hood=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.55+0.3*moNoise(x,y,z,7)); };
      body.push(moEll(0.2,0.24,0.2,0,1.66,0.02,hood,null,12),moEll(0.1,0.13,0.06,0,1.64,-0.14,0x06080c,null,8));   // the hood and the dark inside it
      for(const sd of W) body.push(moEll(0.028,0.02,0.016,sd*0.05,1.65,-0.19,0x9fe8ff,null,5));
      for(const sd of W){ body.push(moBone([sd*0.22,1.28,0],[sd*0.3,1.0,-0.3],0.05,0.04,sh,6),moBone([sd*0.3,1.0,-0.3],[sd*0.26,0.8,-0.5],0.04,0.03,skinC,6));
        for(let i=0;i<4;i++) body.push(moHorn([sd*0.26+(i-1.5)*0.02,0.8,-0.5],[sd*0.05,-1,-0.5],0.18,0.012,0.3,skinC,4,[0,0,-1])); }
      if(st==='wight') for(let i=0;i<7;i++){ const a=(i-3)*0.32; body.push(moCone([Math.sin(a)*0.15,1.82,-0.04+Math.cos(a)*0.02],[Math.sin(a)*0.4,1,0],0.28+0.1*(3-Math.abs(i-3))*0.4,0.03,0xdff4ff,4)); }   // a crown of ice
      if(st==='wraith') for(let i=0;i<5;i++) body.push(moCone([(i-2)*0.06,1.8,0.0],[(i-2)*0.15,1,0.2],0.2,0.03,0xdff4ff,4));
      for(let i=0;i<8;i++){ const a=i/8*TAU+0.2; body.push(moTube([[Math.cos(a)*0.22,1.3,Math.sin(a)*0.16+0.05],[Math.cos(a)*0.35,0.9,Math.sin(a)*0.28+0.08],[Math.cos(a)*0.4,0.4,Math.sin(a)*0.34+0.1]],0.07,0.012,hood,5,true)); }   // a cloak in rags behind
    }
    G.body=moMerge(body); return G;
  },
  build(d,G,M,g,P0){
    P0.body=M(G.body); g.add(P0.body);
    if(G.flick){ P0.flick=new THREE.Group(); P0.flick.position.set(0,1.8,0.05); const f=M(G.flick); f.castShadow=false; P0.flick.add(f); g.add(P0.flick); }
  },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*(1.5+sp);
    P0.body.position.y=0.25+Math.sin(m.ph*1.3)*0.15; P0.body.rotation.x=Math.min(0.35,sp*0.08)+lunge*-0.4;
    if(P0.flick){ P0.flick.position.y=P0.body.position.y+1.8; P0.flick.scale.set(1,0.8+0.35*Math.sin(t*11+m.s*9),1); P0.flick.rotation.y=t*2; }
  }
};
