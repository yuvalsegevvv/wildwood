//@ The Sunscar's monster models: scorpions (model 'scorpion'), walking cacti ('cactus'), sand worms and the sand wyrm ('sandworm'), djinn ('djinn') and the Glass Guardian ('sentinel')
/* Agent map: fills MODELS.scorpion / cactus / sandworm / djinn / sentinel (same contract as monster-parts.js: geo, build, anim; models face -z, metres at scale 1). Their stats are the FAM rows of the same names
   (shared/monster-defs.js), their kinds the MON_DEFS rows with zone 's28'..'s36' (shared/sunland.js, sunzones.js). Look flags: scorpion pal.shell / sheen / head / eye / legs / horn (the sting), pal.glass (a
   glass scorpion: crystal spines); cactus pal.bark (the green), c1 (flowers), c2 (spines); sandworm pal.body / belly / ridge / horn / eye, boss crest; djinn pal.body (smoke) / skin / gold / turban / eye (pal.siren: the Gloamhorn's sirens, hair instead of a turban and no beard);
   sentinel pal.stone / glass / glow / gold. Uses the helpers of monster-parts.js and moBugLegs (monster-bugs.js). Tested by client-smoke (the roster builds) and tools/monster-preview.js. */
const moDesBox=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x,y,z);
// ---- scorpions: a flat armoured body, a curled tail with a sting, two claws that snap, eight legs ----
MODELS.scorpion={
  geo(d,p){
    const G={}, W=[-1,1], body=[], sh=(x,y,z,c)=>{ c.set(p.shell).multiplyScalar(0.8+0.3*moNoise(x,y,z,6)); moTint(c,p.sheen,clamp((y-0.3)*2)*0.35); if(Math.abs(x)<0.03&&y>0.3) c.multiplyScalar(0.7); };
    body.push(moEll(0.36,0.17,0.5,0,0.33,-0.05,sh,null,moQ(14)),moEll(0.2,0.12,0.2,0,0.4,-0.5,p.head,null,10));
    for(let i=0;i<5;i++) body.push(moEll(0.27-i*0.03,0.14-i*0.01,0.15,0,0.31+i*0.005,0.42+i*0.2,sh,null,10));   // the segmented back
    for(const sd of W){ body.push(moEll(0.04,0.04,0.04,sd*0.1,0.5,-0.6,p.eye,null,6),moBone([sd*0.1,0.3,-0.55],[sd*0.14,0.2,-0.72],0.04,0.03,p.head,5));   // eyes, mouth palps
      if(p.glass) for(let i=0;i<3;i++) body.push(moCone([sd*(0.1+i*0.1),0.46,-0.1+i*0.25],[sd*0.4,1,-0.1],0.26+0.1*(i%2),0.05,(x,y,z,c)=>{ c.set(p.horn).multiplyScalar(0.8+0.3*clamp((y-0.45)*2)); },4)); }
    G.body=moMerge(body);
    G.tail=moMerge([moTube([[0,0,0],[0,0.2,0.4],[0,0.62,0.62],[0,0.98,0.32],[0,1.04,-0.1]],0.13,0.06,sh,7,true),moEll(0.1,0.1,0.12,0,1.06,-0.16,p.horn,null,8),moCone([0,1.04,-0.2],[0,-0.7,-1],0.34,0.065,p.horn,5)]);
    for(const sd of W){ const legs=[];
      moBugLegs(legs,[-0.28,-0.04,0.2,0.42].map(z=>[[sd*0.26,0.3,z],[sd*0.5,0.46,z+0.04],[sd*0.72,0.26,z+0.1],[sd*0.8,0.02,z+0.16]]),0.05,0.016,p.legs,1);
      G[sd<0?'lL':'lR']=moMerge(legs);
      const cl=[moBone([0,0,0],[-sd*0.05,0.04,-0.5],0.1,0.08,p.legs,7),moEll(0.17,0.12,0.26,-sd*0.07,0.06,-0.72,sh,null,10)];
      for(const f of [-1,1]) cl.push(moHorn([-sd*0.07,0.06+f*0.05,-0.9],[0,0,-1],0.42,0.07,0.8,p.head,6,[0,-f,0]));
      G[sd<0?'cL':'cR']=moMerge(cl); }
    return G;
  },
  build(d,G,M,g,P0){
    P0.body=M(G.body); g.add(P0.body); P0.lL=M(G.lL); P0.lR=M(G.lR); g.add(P0.lL,P0.lR);
    P0.tail=new THREE.Group(); P0.tail.position.set(0,0.34,0.95); P0.tail.add(M(G.tail)); g.add(P0.tail);
    for(const [n,sd] of [['cL',-1],['cR',1]]){ const pv=new THREE.Group(); pv.position.set(sd*0.3,0.3,-0.42); pv.add(M(G[n])); g.add(pv); P0[n]=pv; }
  },
  anim(m,dt,sp){
    const P0=m.parts, atk=m.act?clamp(m.act.t/m.act.dur):0; m.ph+=dt*(1+sp*10);
    P0.lL.position.z=Math.sin(m.ph)*0.06*Math.min(1,sp); P0.lR.position.z=-P0.lL.position.z; P0.body.position.y=Math.abs(Math.sin(m.ph))*0.015;
    P0.tail.rotation.x=m.act?-0.2-Math.sin(atk*Math.PI)*0.9:Math.sin(t*1.6+m.ph)*0.08;   // the sting comes down in an attack
    const up=m.act?Math.sin(atk*Math.PI)*0.5:0, sw=Math.sin(t*1.7+m.ph)*0.05;
    P0.cL.rotation.set(-up+sw,-0.15,0); P0.cR.rotation.set(-up-sw,0.15,0);
  }
};
// ---- cacti: a ribbed green pillar with raised arms and flowers on top, spines, a hollow face, walking on two stumps ----
MODELS.cactus={
  geo(d,p){
    const G={}, W=[-1,1], body=[], gr=(x,y,z,c)=>{ c.set(p.bark).multiplyScalar(0.62+0.28*Math.abs(Math.sin(Math.atan2(z,x)*8))+0.14*moNoise(x,y,z,5)); if(y<0.7) moTint(c,0x9a7a48,0.35*(1-y/0.7)); };
    body.push(moLoft([{y:0.5,rx:0.4,rz:0.38},{y:0.9,rx:0.5,rz:0.47},{y:1.5,rx:0.52,rz:0.49},{y:2.1,rx:0.46,rz:0.43},{y:2.55,rx:0.34,rz:0.32},{y:2.85,rx:0.18,rz:0.17},{y:2.95,rx:0.06,rz:0.06}],moQ(18),gr));
    for(let i=0;i<46;i++){ const y=0.7+h3(i,1,3)*2.0, a=h3(i,2,3)*TAU, r=0.5-Math.max(0,y-1.5)*0.18; body.push(moCone([Math.cos(a)*r,y,Math.sin(a)*r],[Math.cos(a),0.15,Math.sin(a)],0.15,0.014,p.c2||0xf2ecd0,3)); }   // spines
    for(let i=0;i<4;i++){ const a=i*1.57+0.5; body.push(moEll(0.13,0.07,0.13,Math.cos(a)*0.14,2.9+0.04*(i%2),Math.sin(a)*0.14,p.c1,null,7)); }   // flowers
    body.push(moEll(0.07,0.05,0.07,0,2.97,0,0xffe27a,null,6));
    for(const sd of W){ body.push(moEll(0.13,0.1,0.08,sd*0.17,1.7,-0.4,0x0b0a06,null,8),moEll(0.06,0.06,0.04,sd*0.17,1.7,-0.45,p.eyes,null,7)); }
    body.push(moEll(0.2,0.08,0.07,0,1.36,-0.45,0x0b0a06,null,8));
    G.body=moMerge(body);
    for(const sd of W) G[sd<0?'aL':'aR']=moMerge([moTube([[0,0,0],[sd*0.34,-0.06,0],[sd*0.6,0.14,0],[sd*0.66,0.8,0]],0.2,0.15,gr,8,true),...[0,1,2,3,4,5].map(i=>moCone([sd*(0.62+0.05*Math.sin(i)),0.25+i*0.11,0.1*Math.cos(i*2)],[sd,0.2,Math.cos(i*2)],0.13,0.013,p.c2||0xf2ecd0,3))]);
    G.leg=moMerge([moTube([[0,0,0],[0,-0.3,0],[0,-0.55,-0.04]],0.2,0.15,gr,7,false),moEll(0.17,0.06,0.24,0,-0.6,-0.08,0x9a7a48,null,8)]);
    return G;
  },
  build(d,G,M,g,P0){
    P0.body=M(G.body); g.add(P0.body);
    const nd=(x,y,z,mesh)=>{ const o=new THREE.Group(); o.position.set(x,y,z); o.add(mesh); g.add(o); return o; };
    P0.aL=nd(-0.44,1.85,0,M(G.aL)); P0.aR=nd(0.44,1.85,0,M(G.aR)); P0.lL=nd(-0.22,0.62,0,M(G.leg)); P0.lR=nd(0.22,0.62,0,M(G.leg));
  },
  anim(m,dt,sp){
    const P0=m.parts; m.ph+=dt*sp*2.2; const amp=Math.min(1,sp)*0.4, atk=m.act?clamp(m.act.t/m.act.dur):0;
    P0.lL.rotation.x=Math.sin(m.ph)*amp; P0.lR.rotation.x=-Math.sin(m.ph)*amp;
    const swing=m.act?(atk<0.5?-1.9*atk*2:-1.9+(atk-0.5)*2*2.0):0;   // both arms come down on the target
    P0.aL.rotation.x=m.act?swing:Math.sin(m.ph)*amp*0.5; P0.aR.rotation.x=m.act?swing:-Math.sin(m.ph)*amp*0.5;
    P0.aL.rotation.z=-0.2; P0.aR.rotation.z=0.2; P0.body.rotation.z=Math.sin(t*0.8+m.ph)*0.03;
  }
};
// ---- sand worms: a toothed round maw on a heavy head, a chain of plated segments that undulate, a barbed tail. The sand wyrm (d.boss) wears a crest of spines and a glowing throat ----
MODELS.sandworm={
  geo(d,p){
    const G={}, W=[-1,1], boss=!!d.boss, R=[0.6,0.6,0.56,0.51,0.45,0.39,0.32,0.24];
    const sk=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.74+0.36*vn3(x*7,y*7,z*7)); if(y<-0.05) moTint(c,p.belly,0.8); if(Math.abs(Math.sin(z*8))<0.16&&y>-0.1) c.multiplyScalar(0.78); };
    G.segs=R.map((r,i)=>{ const L=[moEll(r,r*0.95,r*1.25,0,0,0,sk,null,moQ(14))];
      for(const dz of [-0.25,0.25]) L.push(moCone([0,r*0.85,dz*r*2],[0,1,0.1],r*(boss?1.3:0.7),r*0.14,p.ridge,5));
      if(boss&&i<6) for(const sd of W) L.push(moCone([sd*r*0.8,r*0.45,0],[sd,0.6,0],r*0.9,r*0.1,p.ridge,5));
      return moMerge(L); });
    G.tailTip=moMerge([moEll(0.16,0.15,0.22,0,0,0.1,sk,null,8),moCone([0,0,0.1],[0,0,1],0.7,0.14,p.horn,5),...W.map(sd=>moCone([sd*0.1,0,0.2],[sd*0.8,0.2,0.8],0.4,0.06,p.horn,4))]);
    const head=[moEll(0.55,0.5,0.62,0,0,-0.1,sk,null,moQ(16)),moEll(0.42,0.4,0.07,0,-0.02,-0.66,0x1a0a08,null,12)];   // the skull and the dark mouth
    if(boss) head.push(moEll(0.28,0.27,0.05,0,-0.02,-0.7,(x,y,z,c)=>{ c.set(p.eye).multiplyScalar(0.7+0.4*clamp(1-Math.hypot(x,y+0.02)*3)); },null,10));   // a glowing throat
    for(let i=0;i<14;i++){ const a=i/14*TAU+0.2, r=0.42; head.push(moCone([Math.cos(a)*r,Math.sin(a)*r-0.02,-0.64],[-Math.cos(a)*0.5,-Math.sin(a)*0.5,-1],0.3,0.045,0xf2ead2,4)); }   // the ring of teeth, pointing in
    for(let i=0;i<10;i++){ const a=i/10*TAU+0.5, r=0.24; head.push(moCone([Math.cos(a)*r,Math.sin(a)*r-0.02,-0.66],[-Math.cos(a)*0.2,-Math.sin(a)*0.2,-1],0.22,0.035,0xe0d6bc,4)); }
    for(const sd of W){ head.push(moEll(0.08,0.09,0.06,sd*0.36,0.28,-0.38,p.eye,null,7),moHorn([sd*0.32,0.34,-0.1],[sd*0.5,0.8,-0.3],boss?1.1:0.7,0.1,0.9,p.horn,6,[0,0,-1]),moHorn([sd*0.45,-0.05,-0.2],[sd,0.1,-0.5],0.6,0.08,0.7,p.horn,5,[0,0.5,0])); }
    G.head=moMerge(head);
    return G;
  },
  build(d,G,M,g,P0){
    const zs=[0,0.8,0.78,0.7,0.6,0.52,0.45,0.4], nd=(par,x,y,z,mesh)=>{ const o=new THREE.Group(); o.position.set(x,y,z); if(mesh) o.add(mesh); par.add(o); return o; };
    let par=g; P0.segs=G.segs.map((geo,i)=>{ const pv=nd(par,0,i?0:0.8,zs[i],M(geo)); par=pv; return pv; });
    P0.tail=nd(par,0,0,0.5,M(G.tailTip)); P0.head=nd(P0.segs[0],0,0.05,-0.7,M(G.head));
  },
  anim(m,dt,sp){
    const P0=m.parts; m.ph+=dt*(1.2+sp*1.3); const amp=0.13+Math.min(1,sp/2)*0.18, atk=m.act?clamp(m.act.t/m.act.dur):0;
    P0.segs.forEach((s,i)=>{ s.rotation.y=Math.sin(m.ph*2-i*0.6)*amp*(0.4+i*0.14); s.rotation.x=Math.sin(m.ph*1.3-i*0.5)*0.05; });
    P0.tail.rotation.y=Math.sin(m.ph*2-5)*amp*1.3;
    P0.head.rotation.x=m.act?(atk<0.45?-0.8*(atk/0.45):-0.8+(atk-0.45)/0.55*1.6):Math.sin(t*1.4+m.ph)*0.05;   // rears back, then drops on its prey
  }
};
// ---- djinn: a smoke tail rising into a broad-shouldered torso, a turban, gold bracers and folded arms ----
MODELS.djinn={
  geo(d,p){
    const G={}, W=[-1,1], body=[], boss=!!d.boss, sm=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.7+0.4*moNoise(x,y,z,6)); moTint(c,p.skin,clamp((y-1.05)*1.6)*0.55); };
    body.push(moLoft([{y:0.1,rx:0.03,rz:0.03,x:0.18,z:0.1},{y:0.35,rx:0.09,rz:0.09,x:0.14,z:0.07},{y:0.65,rx:0.17,rz:0.15,x:0.07,z:0.03},{y:0.95,rx:0.22,rz:0.17,x:0.02},{y:1.2,rx:0.3,rz:0.18},{y:1.4,rx:0.4,rz:0.2},{y:1.52,rx:0.22,rz:0.14},{y:1.58,rx:0.09,rz:0.08}],moQ(16),sm));
    const sk=p.skin;
    body.push(moBone([0,1.5,0],[0,1.62,-0.02],0.07,0.06,sk,6),moEll(0.15,0.18,0.15,0,1.74,-0.02,sk,null,12),
      ...(p.siren?[moEll(0.17,0.19,0.17,0,1.79,0.03,p.turban,null,12),moEll(0.04,0.04,0.03,0,1.93,-0.1,p.gold,null,6),...[0,1,2,3,4].map(i=>moTube([[(i-2)*0.06,1.82,0.1],[(i-2)*0.1,1.4,0.2],[(i-2)*0.12,0.95,0.16],[(i-2)*0.09,0.6,0.12]],0.06,0.015,p.turban,5,true))]   // a siren: long wet hair, a pearl on the brow
        :[moEll(0.18,0.1,0.18,0,1.88,0,p.turban,null,12),moEll(0.17,0.16,0.17,0,1.96,0.01,p.turban,null,12),moEll(0.045,0.05,0.04,0,1.88,-0.17,p.gold,null,6),moCone([0,1.8,-0.12],[0,-1,-0.2],0.3,0.07,0x1c1410,5)]));   // head, turban with a jewel, a pointed beard
    for(const sd of W){ body.push(moEll(0.035,0.025,0.02,sd*0.06,1.76,-0.17,p.eye,null,5),
      moBone([sd*0.4,1.38,0],[sd*0.34,1.12,-0.3],0.1,0.08,sm,7),moBone([sd*0.34,1.12,-0.3],[sd*-0.1,1.14,-0.42],0.08,0.07,sm,7),moEll(0.1,0.04,0.04,sd*0.36,1.14,-0.3,p.gold,null,8),   // arms folded across the chest, a gold bracer
      moEll(0.06,0.06,0.06,sd*0.38,1.4,0,p.gold,null,6)); }
    body.push(moEll(0.34,0.05,0.2,0,0.98,-0.02,p.gold,null,12));   // a gold sash
    if(boss) for(let i=0;i<7;i++){ const a=(i-3)*0.3; body.push(moCone([Math.sin(a)*0.2,2.0,0],[Math.sin(a)*0.6,1,0],0.4,0.04,p.gold,4)); }
    for(let i=0;i<6;i++){ const a=i*1.05; body.push(moTube([[Math.cos(a)*0.12,0.6,Math.sin(a)*0.1],[Math.cos(a+0.6)*0.26,0.32,Math.sin(a+0.6)*0.2],[Math.cos(a+1.1)*0.18,0.06,Math.sin(a+1.1)*0.14]],0.05,0.01,sm,5,true)); }   // wisps of smoke round the tail
    G.body=moMerge(body); return G;
  },
  build(d,G,M,g,P0){ P0.body=M(G.body); g.add(P0.body); },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*(1.5+sp);
    P0.body.position.y=0.3+Math.sin(m.ph*1.3)*0.16; P0.body.rotation.x=Math.min(0.35,sp*0.08)-lunge*0.5; P0.body.rotation.y=Math.sin(m.ph*0.7)*0.08;
  }
};
// ---- the Glass Guardian: a sandstone colossus that wears the glass its own weapon made: black shards on the shoulders and back, a visor slit lit from inside, a halo of floating shards ----
MODELS.sentinel={
  geo(d,p){
    const G={}, W=[-1,1], body=[], st=(x,y,z,c)=>{ c.set(p.stone).multiplyScalar(0.7+0.5*vn3(x*6,y*6,z*6)); if(((y*3.2)%1+1)%1<0.07) c.multiplyScalar(0.8); },
      gl=(x,y,z,c)=>{ c.set(p.glass).multiplyScalar(0.7+0.5*clamp(0.5+y*0.4)); moTint(c,p.glow,Math.pow(moNoise(x,y,z,3),4)*0.5); };
    body.push(moLoft([{y:1.05,rx:0.36,rz:0.26},{y:1.4,rx:0.46,rz:0.3},{y:1.9,rx:0.56,rz:0.34},{y:2.3,rx:0.62,rz:0.36},{y:2.5,rx:0.4,rz:0.28},{y:2.6,rx:0.2,rz:0.16}],moQ(12),st));   // the torso
    body.push(pc(moDesBox(0.5,0.6,0.46,0,2.85,-0.02),st),pc(moDesBox(0.42,0.08,0.06,0,2.9,-0.26),c=>c.set(p.glow)));   // the head: a helm with a lit visor slit
    body.push(moEll(0.12,0.28,0.06,0,2.5,-0.3,gl,null,8),moEll(0.28,0.1,0.08,0,2.0,-0.32,p.glow,null,8));   // a glass heart in the chest, a seam of light below it
    for(const sd of W){ body.push(moEll(0.36,0.22,0.34,sd*0.74,2.38,0,st,null,10));   // pauldrons
      for(let i=0;i<4;i++) body.push(moCone([sd*(0.6+i*0.1),2.5+0.04*i,0.04*i],[sd*0.5,1,-0.1+0.1*i],0.5+0.18*(i%2),0.07,gl,4)); }
    for(let i=0;i<9;i++){ const a=(i-4)*0.32; body.push(moCone([Math.sin(a)*0.34,2.0+0.1*Math.cos(i*3),0.3],[Math.sin(a)*0.5,0.6,1],0.7+0.25*(i%3),0.09,gl,4)); }   // shards down the back
    G.body=moMerge(body);
    for(const sd of W){
      G[sd<0?'aL':'aR']=moMerge([moLimb([[0,0.17],[0.4,0.15],[1,0.13]],0.9,1,1,st,8),moLimb([[0,0.14],[0.6,0.2],[1,0.24]],0.6,1,1,st,8).translate(0,-0.95,0),moEll(0.26,0.22,0.26,0,-1.6,0,st,null,10),moCone([0,-1.72,0],[0,-1,0],0.35,0.1,gl,4)]);
      G[sd<0?'lL':'lR']=moMerge([moLimb([[0,0.22],[0.5,0.19],[1,0.2]],0.9,1,1,st,8),moEll(0.26,0.12,0.4,0,-0.98,-0.1,st,null,8)]); }
    G.halo=moMerge(Array.from({length:10},(_,i)=>{ const a=i/10*TAU, r=1.4+0.12*(i%2); return moCone([Math.sin(a)*r,(i%3)*0.18,Math.cos(a)*r],[0.1*Math.sin(a),1,0.1*Math.cos(a)],0.55+0.2*(i%3),0.1,gl,4); }));
    return G;
  },
  build(d,G,M,g,P0){
    P0.body=M(G.body); g.add(P0.body);
    const nd=(x,y,z,mesh)=>{ const o=new THREE.Group(); o.position.set(x,y,z); o.add(mesh); g.add(o); return o; };
    P0.aL=nd(-0.78,2.32,0,M(G.aL)); P0.aR=nd(0.78,2.32,0,M(G.aR)); P0.lL=nd(-0.3,1.05,0,M(G.lL)); P0.lR=nd(0.3,1.05,0,M(G.lR));
    P0.halo=nd(0,2.2,0.5,M(G.halo)); P0.halo.children[0].castShadow=false;
  },
  anim(m,dt,sp){
    const P0=m.parts; m.ph+=dt*sp*1.8; const amp=Math.min(1,sp)*0.35, atk=m.act?clamp(m.act.t/m.act.dur):0;
    P0.lL.rotation.x=Math.sin(m.ph)*amp; P0.lR.rotation.x=-Math.sin(m.ph)*amp;
    const arm=m.act?(atk<0.5?-2.5*atk*2:-2.5+(atk-0.5)*2*3.0):0;
    P0.aL.rotation.x=m.act?arm:-Math.sin(m.ph)*amp; P0.aR.rotation.x=m.act?arm:Math.sin(m.ph)*amp;
    P0.aL.rotation.z=-0.12; P0.aR.rotation.z=0.12; P0.halo.rotation.y=t*0.7; P0.halo.position.y=2.2+Math.sin(t*1.3+m.ph)*0.12;
  }
};
