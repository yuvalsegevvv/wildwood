//@ Beetle, spider and crab models (model 'beetle'): horned / kabuto / scarab / ironshell / ice beetles, the Jorogumo and glacier spiders, crabs with claws, the Tide King
/* One family, three body plans chosen by the def's pal: default = beetle (pal.kind: rhino horn, 'kabuto' forked horn, 'scarab' dome, 'iron' plates, 'ice' crystals),
   pal.spider (eight jointed legs, an abdomen; pal.lady: the Jorogumo's woman), pal.crab (a broad carapace, stalked eyes, two claws that snap; the boss Carapax
   is the same model with barnacles, coral and kelp). Parts: body, lL / lR (a side's legs, swung fore and aft), cL / cR (a crab's claws, pivoted at the shoulder). */
const moBugLegs=(list,pts,r0,r1,f,spikes)=>{ for(const P of pts){ list.push(moTube(P,r0,r1,f,6,true)); if(spikes){ const a=P[P.length-2], b=P[P.length-1]; for(let i=1;i<=spikes;i++){ const t=i/(spikes+1), q=[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]; list.push(moCone(q,[0,1,-0.2],0.09,0.016,0x14100e,4)); } } } };
function moBeetleGeo(d,p){
  const G={}, k=p.kind||'rhino', W=[-1,1], body=[], dark=(x,y,z,c)=>{ c.set(p.head).multiplyScalar(0.8); };
  const shellF=(x,y,z,c)=>{
    c.set(p.shell).multiplyScalar(0.8+0.3*moNoise(x,y,z,6)); moTint(c,p.sheen,clamp((y-0.5)*2.2)*0.4);
    if(Math.abs(x)<0.035&&y>0.5) c.set(p.seam);
    else if(k==='scarab'){ const a=Math.atan2(z-0.2,x); if(Math.abs(Math.sin(a*9))<0.12&&y>0.5) c.set(p.seam); }   // a sunburst
    else if(k==='iron'){ if(((Math.floor((z+0.6)*5))&1)&&y>0.35) c.multiplyScalar(0.72); }                          // plate bands
    else if(Math.abs(Math.sin(x*24))<0.07&&y>0.45) c.multiplyScalar(0.8);                                             // grooves along the wing cases
  };
  const hh=k==='scarab'?0.4:0.32;
  for(const sd of W) body.push(moEll(0.27,hh,0.62,sd*0.155,0.44+(hh-0.32),0.17,shellF,[0,0,sd*0.07],moQ(16)));
  body.push(moEll(0.3,0.16,0.5,0,0.3,0.24,dark,null,10));                                                        // the abdomen under the wing cases
  body.push(moEll(0.36,0.19,0.25,0,0.5,-0.3,shellF,null,12),moEll(0.19,0.15,0.2,0,0.37,-0.66,p.head,null,12));   // the shield behind the head, the head
  for(const sd of W){
    body.push(moEll(0.045,0.05,0.045,sd*0.15,0.42,-0.7,p.eye,null,7),moHorn([sd*0.07,0.32,-0.8],[sd*0.18,-0.05,-1],0.28,0.045,1.3,0x1a1410,5,[-sd,0,0]));   // eyes, pincer jaws
    body.push(moTube([[sd*0.1,0.45,-0.78],[sd*0.2,0.58,-0.95],[sd*0.28,0.6,-1.08]],0.014,0.01,0x1a1410,4,false),moEll(0.03,0.03,0.05,sd*0.28,0.6,-1.1,0x1a1410,null,5));   // antennae
  }
  if(k==='rhino') body.push(moHorn([0,0.42,-0.75],[0,0.45,-1],0.6,0.065,1.0,p.horn,7,[0,1,0]),moHorn([0,0.6,-0.34],[0,0.9,-0.6],0.3,0.06,0.6,p.horn,6,[0,0,-1]));
  if(k==='kabuto'){   // a long horn that rises and forks, a short one on the shield
    body.push(moHorn([0,0.42,-0.75],[0,0.55,-1],0.6,0.07,1.6,p.horn,7,[0,1,0]),moHorn([0,0.6,-0.32],[0,1,-0.3],0.3,0.06,0.5,p.horn,6,[0,0,-1]));
    for(const sd of W) body.push(moHorn([0,0.92,-1.02],[sd*0.6,1,-0.4],0.32,0.045,0.5,p.horn,5,[0,0,-1]));
  }
  if(k==='scarab') for(let i=-2;i<=2;i++) body.push(moCone([i*0.06,0.42,-0.84],[i*0.15,0.2,-1],0.14,0.03,p.horn,4));   // the head's toothed rim
  if(k==='iron'){ for(const sd of W) body.push(moCone([sd*0.34,0.52,-0.3],[sd,0.3,-0.2],0.22,0.05,p.horn,5),moCone([sd*0.3,0.55,-0.42],[sd,0.4,-0.6],0.16,0.04,p.horn,5)); body.push(moEll(0.22,0.05,0.14,0,0.5,-0.72,p.horn,null,8)); }
  if(k==='ice'){ for(let i=0;i<9;i++){ const a=i*2.4, x=Math.cos(a)*0.16*(1+i%2), z=0.6*Math.sin(i*1.3)+0.1; body.push(moCone([x,0.6,z],[x*2,1,0.2],0.26+0.16*h3(i,2,2),0.05,(X,Y,Z,c)=>{ c.set(p.horn).multiplyScalar(0.8+0.3*clamp((Y-0.6)*3)); },5)); } body.push(moHorn([0,0.42,-0.75],[0,0.5,-1],0.5,0.06,0.8,p.horn,6,[0,1,0])); }
  G.body=moMerge(body);
  for(const sd of W){ const legs=[];
    moBugLegs(legs,[-0.36,-0.02,0.34].map((z,i)=>{ const fz=z+(i===0?-0.22:i===2?0.24:0.02); return [[sd*0.26,0.36,z],[sd*0.44,0.5,z+(fz-z)*0.3],[sd*0.58,0.32,z+(fz-z)*0.75],[sd*0.64,0.02,fz]]; }),0.065,0.026,p.legs,2);
    G[sd<0?'lL':'lR']=moMerge(legs); }
  return G;
}
function moSpiderGeo(d,p){
  const G={}, W=[-1,1], body=[], band=(x,y,z,c)=>{ c.set(p.shell).multiplyScalar(0.8+0.3*moNoise(x,y,z,5)); moTint(c,p.sheen,clamp((y-0.85)*2)*0.4); if(Math.abs(Math.sin(z*9))<0.2&&y>0.6) c.set(p.seam); };
  body.push(moEll(0.4,0.36,0.52,0,0.72,0.42,band,[-0.15,0,0],moQ(16)),moEll(0.27,0.22,0.32,0,0.56,-0.12,p.head,null,12),moEll(0.2,0.18,0.2,0,0.54,-0.4,p.head,null,12));
  for(const [x,y,z,r] of [[0.06,0.62,-0.55,0.045],[0.12,0.6,-0.54,0.03],[0.16,0.56,-0.5,0.025]]) for(const sd of W) body.push(moEll(r,r,r,sd*x,y,z,p.eye,null,6));   // eyes
  for(const sd of W) body.push(moHorn([sd*0.07,0.45,-0.52],[sd*0.05,-1,-0.5],0.24,0.045,0.6,0x14100e,5,[0,0,-1]),moBone([sd*0.16,0.5,-0.5],[sd*0.2,0.3,-0.66],0.03,0.022,p.legs,5));   // fangs, palps
  for(let i=0;i<14;i++){ const a=i*2.3, y=0.72+0.34*Math.cos(i*1.1), z=0.42+0.5*Math.sin(i*1.7); body.push(moCone([Math.sin(a)*0.3,y,z],[Math.sin(a),0.6,0.1],0.07,0.012,0x14100e,3)); }   // bristles
  if(p.lady){   // the Jorogumo's woman: a kimono torso rising from the front, black hair, raised arms
    const skin=0xeadcd6, kim=(x,y,z,c)=>{ c.set(p.shell).lerp(_tint.set(0x8a6ab0),0.55).multiplyScalar(0.85+0.2*moNoise(x,y,z,9)); if(y<0.78) c.set(p.seam); };
    body.push(moLoft([{y:0.6,rx:0.17,rz:0.12,z:-0.36},{y:0.76,rx:0.14,rz:0.1,z:-0.36},{y:0.92,rx:0.17,rz:0.12,z:-0.36},{y:1.04,rx:0.2,rz:0.13,z:-0.36},{y:1.13,rx:0.11,rz:0.08,z:-0.36}],14,kim));
    body.push(moBone([0,1.1,-0.36],[0,1.24,-0.37],0.05,0.04,skin,7),moEll(0.1,0.12,0.1,0,1.34,-0.38,skin,null,12),moEll(0.13,0.15,0.12,0,1.36,-0.3,0x101014,null,10),moEll(0.045,0.02,0.02,0,1.29,-0.47,0xa02a3a,null,6));
    for(const sd of W){ body.push(moEll(0.022,0.025,0.015,sd*0.05,1.36,-0.475,p.eye,null,5),moBone([sd*0.19,1.06,-0.36],[sd*0.34,0.96,-0.5],0.04,0.03,skin,6),moBone([sd*0.34,0.96,-0.5],[sd*0.24,1.02,-0.78],0.03,0.022,skin,6),
      moHorn([sd*0.24,1.02,-0.78],[sd*0.1,0.1,-1],0.16,0.018,0.3,0x2a1a2a,4,[0,1,0])); }
    for(let i=0;i<4;i++) body.push(moTube([[(i-1.5)*0.06,1.4,-0.28],[(i-1.5)*0.1,1.1,-0.18],[(i-1.5)*0.12,0.85,-0.1],[(i-1.5)*0.14,0.7,0.1]],0.035,0.012,0x101014,5,true));
  }
  G.body=moMerge(body);
  const zs=[-0.45,-0.15,0.15,0.45], fz=[-0.95,-0.4,0.35,0.95];
  for(const sd of W){ const legs=[];
    moBugLegs(legs,zs.map((z,i)=>[[sd*0.2,0.55,z*0.5],[sd*0.6,0.95,z*0.9+(fz[i]-z)*0.2],[sd*0.98,1.05,z*1.1+(fz[i]-z)*0.5],[sd*1.35,0.5,z*1.2+(fz[i]-z)*0.85],[sd*1.55,0.02,fz[i]]]),0.04,0.011,p.legs,0);
    G[sd<0?'lL':'lR']=moMerge(legs); }
  return G;
}
function moCrabGeo(d,p){
  const G={}, W=[-1,1], boss=!!d.boss, body=[], sh=(x,y,z,c)=>{ c.set(p.shell).multiplyScalar(0.8+0.32*moNoise(x,y,z,6)); if(moNoise(x+7,y,z,10)>0.7) moTint(c,p.horn,0.35); moTint(c,p.sheen,clamp((y-0.55)*3)*0.35);
    if(boss&&Math.abs(moNoise(x,y,z,3.2)-0.5)<0.022) c.set(0x6af0ff); };   // (the Tide King) cracks that glow with the sea
  const gk=(x,y,z,c)=>{ c.set(p.legs).multiplyScalar(0.85+0.2*moNoise(x,y,z,8)); };
  body.push(moEll(0.78,0.36,0.6,0,0.52,0,sh,null,moQ(20)),moEll(0.3,0.14,0.2,0,0.4,-0.56,p.head,null,10));
  for(let i=-3;i<=3;i++){ const a=i*0.36, x=Math.sin(a)*0.74, z=-Math.cos(a)*0.56; body.push(moCone([x,0.48,z],[Math.sin(a),0.35,-Math.cos(a)],boss?0.3:0.16,boss?0.07:0.05,p.horn,5)); }   // a toothed front rim
  for(const sd of W){ body.push(moBone([sd*0.16,0.62,-0.45],[sd*0.2,0.88,-0.52],0.03,0.026,p.head,5),moEll(0.07,0.075,0.07,sd*0.2,0.94,-0.52,p.eye,null,8),moEll(0.02,0.02,0.02,sd*0.19,0.97,-0.57,0xffffff,null,4));
    body.push(moCone([sd*0.06,0.38,-0.68],[sd*0.2,-1,-0.4],0.14,0.03,0x2a1a10,4)); }
  if(boss){   // barnacles, spines of coral, kelp draped over the shell
    for(let i=0;i<44;i++){ const a=i*2.4, r=0.15+0.6*h3(i,4,4), x=Math.cos(a)*r*0.95, z=Math.sin(a)*r*0.7, y=0.5+0.3*Math.sqrt(Math.max(0.01,1-(x*x/0.6+z*z/0.36)));
      body.push(moCone([x,y-0.02,z],[x*0.5,1,z*0.5],0.1+0.08*h3(i,5,5),0.045+0.03*h3(i,6,6),(X,Y,Z,c)=>{ c.set(0xd8d0b8).multiplyScalar(0.8+0.3*clamp((Y-y)*8)); },6)); }
    for(let i=0;i<5;i++){ const a=(i-2)*0.3; body.push(moHorn([Math.sin(a)*0.3,0.72,0.1+Math.cos(a)*0.1],[Math.sin(a)*0.5,1,0.2],0.65,0.08,0.4*(i-2),0xe8a89a,6,[0,0,-1])); }
    for(let i=0;i<5;i++){ const s=i%2?1:-1; body.push(moTube([[s*(0.1+i*0.1),0.86,0.1-i*0.1],[s*(0.5+i*0.05),0.8,0.3],[s*(0.85+i*0.05),0.4,0.4],[s*(1.0+i*0.05),0.1,0.5]],0.03,0.018,(x,y,z,c)=>{ c.set(0x3a6a3a).multiplyScalar(0.8+0.5*moNoise(x,y,z,8)); },5,true)); }
  }
  G.body=moMerge(body);
  for(const sd of W){ const legs=[];
    moBugLegs(legs,[-0.34,-0.12,0.12,0.34].map(z=>[[sd*0.55,0.5,z*0.9],[sd*0.85,0.85,z*0.95],[sd*1.1,0.5,z*1.05],[sd*1.22,0.02,z*1.15]]),0.05,0.012,gk,0);
    G[sd<0?'lL':'lR']=moMerge(legs);
    // a claw, from its shoulder forward: the arm, the palm, and two serrated fingers that close on each other
    const cl=[moBone([0,0,0],[-sd*0.04,0.14,-0.6],0.12,0.1,gk,7),moEll(0.25,0.2,0.34,-sd*0.05,0.22,-0.85,(x,y,z,c)=>{ sh(x,y,z,c); },null,12)];
    for(const f of [-1,1]){   // the fingers: one above, one below, each curving in toward the other
      cl.push(moHorn([-sd*0.05,0.22+f*0.07,-1.08],[0,0,-1],0.62,0.12,0.9,p.horn,6,[0,-f,0]));
      for(let i=0;i<4;i++) cl.push(moCone([-sd*0.05,0.22+f*0.05,-1.2-i*0.12],[0,-f*0.5,0.1],0.06,0.022,0xe8dcc0,4)); }
    G[sd<0?'cL':'cR']=moMerge(cl); }
  return G;
}
MODELS.beetle={
  geo(d,p){ return p.crab?moCrabGeo(d,p):p.spider?moSpiderGeo(d,p):moBeetleGeo(d,p); },
  build(d,G,M,g,P0){
    P0.body=M(G.body); g.add(P0.body); P0.lL=M(G.lL); P0.lR=M(G.lR); g.add(P0.lL,P0.lR);
    if(G.cL){ for(const [n,sd] of [['cL',-1],['cR',1]]){ const pv=new THREE.Group(); pv.position.set(sd*0.7,0.55,-0.42); pv.add(M(G[n])); g.add(pv); P0[n]=pv; } }
  },
  anim(m,dt,sp){
    const P0=m.parts; m.ph+=dt*(1+sp*10);
    P0.lL.position.z=Math.sin(m.ph)*0.07*Math.min(1,sp); P0.lR.position.z=-P0.lL.position.z;
    P0.body.position.y=Math.abs(Math.sin(m.ph))*0.02;
    if(P0.cL){   // a crab's claws: held up and swaying, they rear back and snap shut in its attack
      const atk=m.act?clamp(m.act.t/m.act.dur):0, up=m.act?Math.sin(atk*Math.PI)*0.7:0, snap=m.act?Math.sin(atk*Math.PI*4)*0.22:0, sw=Math.sin(t*1.7+m.ph)*0.06;
      P0.cL.rotation.set(-up+sw,-0.2+snap,0); P0.cR.rotation.set(-up-sw,0.2-snap,0);
    }
  }
};
