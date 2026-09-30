//@ Slime and mushroom models: jelly bodies with a skirt and highlights, moss / lava crust / shells / petals / crystals / ice growing on them; gilled, spotted mushrooms and the kodama spirit
/* slime: one mesh (body), animated by squashing; pal.deco picks what grows on it (moss, crust, shell, petal, crystal, shard). shroom: body (stem, ring, cap, face) and two feet;
   pal.spirit turns it into a kodama: a big pale head on a slim body that tilts. */
const SLIME_HL=new THREE.Vector3(-0.45,0.8,-0.4).normalize();
MODELS.slime={
  geo(d,p){
    const R=0.45, g=csph(1,moQ(28),moQ(20)), pos=g.attributes.position, v=new THREE.Vector3(), deco=p.deco, G={};
    for(let i=0;i<pos.count;i++){   // a flat base, a soft skirt just above it, a slightly peaked crown, a little wobble
      v.fromBufferAttribute(pos,i); const uy=v.y, skirt=Math.exp(-Math.pow((uy+0.68)/0.22,2)), lump=1+0.04*(vn3(v.x*2.5+3,uy*2.5,v.z*2.5)-0.5)*2, k=R*(1+0.17*skirt)*(1-0.12*Math.max(0,uy-0.55))*lump;
      pos.setXYZ(i,v.x*k,0.36+Math.max(uy,-0.84)*0.34+(uy>0.7?(uy-0.7)*0.12:0),v.z*k);
    }
    smoothN(g);
    const dark=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.7); };
    const body=[pc(g,(x,y,z,c)=>{
      const t=clamp((y-0.06)/0.62); c.set(p.body).multiplyScalar(0.74+0.3*t+0.14*moNoise(x,y,z,4)); moTint(c,p.top,clamp((t-0.4)/0.5)*0.55);
      const hl=Math.max(0,(x*SLIME_HL.x+(y-0.36)*SLIME_HL.y+z*SLIME_HL.z)/R); moTint(c,0xffffff,Math.pow(hl,14)*0.75);   // a painted highlight
      if(deco==='crust'&&y>0.3&&moNoise(x,y,z,7)>0.55) c.set(0x2a1410).lerp(_tint.set(p.body),0.15);   // (magma) dark plates cooled on the lava
    })];
    for(const sd of [-1,1]){
      body.push(moEll(0.1,0.11,0.07,sd*0.16,0.47,-0.365,0xf4f4ee,null,10),moEll(0.056,0.062,0.04,sd*0.16,0.46,-0.43,0x111111,null,8),moEll(0.018,0.018,0.012,sd*0.145,0.485,-0.46,0xffffff,null,5));
      if(deco) body.push(moEll(0.125,0.045,0.09,sd*0.16,0.545,-0.36,dark,[0,0,-sd*0.45],8));           // the kinds that live in the wild frown
    }
    body.push(deco?moEll(0.12,0.05,0.03,0,0.29,-0.42,p.mouth,null,8):moEll(0.07,0.02,0.02,0,0.3,-0.43,p.mouth,null,8));
    if(deco) for(const sd of [-1,1]) body.push(moCone([sd*0.06,0.31,-0.44],[0,1,-0.2],0.08,0.02,0xf4f0e0,4));
    for(const [x,y,z,r] of [[0.3,0.4,0.22,0.05],[-0.28,0.5,0.18,0.04],[0.12,0.62,0.2,0.035],[-0.1,0.3,0.36,0.045]]) body.push(moPatch([x,y,z],[x,y-0.3,z],r,r*0.5,c=>{ c.set(p.top); },7));   // bubbles in the jelly
    const top=p.top;
    if(deco==='moss'){ for(let i=0;i<7;i++){ const a=i*2.4, r=0.16+0.1*h3(i,1,2), x=Math.cos(a)*r, z=Math.sin(a)*r, y=0.62-r*0.25; body.push(moPatch([x,y,z],[x,1,z],0.1+0.05*h3(i,2,2),0.05,(X,Y,Z,c)=>{ c.set(0x3f5a2c).multiplyScalar(0.8+0.4*moNoise(X,Y,Z,12)); },7)); }
      body.push(moTube([[0.12,0.6,0.1],[0.15,0.85,0.08],[0.1,1.1,0.1]],0.014,0.01,0x5a7a3a,5,true),moEll(0.03,0.09,0.03,0.1,1.08,0.1,0x5a3a20,null,6)); }   // a reed and its cattail
    if(deco==='crust'){ for(let i=0;i<4;i++){ const a=i*1.9+0.5, x=Math.cos(a)*0.2, z=Math.sin(a)*0.2; body.push(moCone([x,0.55,z],[x*1.5,1,z*1.5],0.28+0.1*h3(i,3,3),0.06,0x1e0e0a,4)); } }
    if(deco==='shell'){ body.push(moCone([-0.05,0.67,0.05],[0,1,0.3],0.26,0.11,0xf0e2c8,8),moEll(0.09,0.05,0.09,-0.05,0.68,0.05,0xe0c8a8,null,8),moEll(0.03,0.15,0.006,0.28,0.55,0.15,0x3aa8c8,[0,0,-0.4],6)); }   // a whelk shell, a fin
    if(deco==='petal'){ for(let i=0;i<9;i++){ const a=i*2.2, y=0.3+0.35*h3(i,4,4), r=Math.sqrt(Math.max(0.01,1-Math.pow((y-0.36)/0.34,2)))*0.45, x=Math.cos(a)*r, z=Math.sin(a)*r; body.push(moPatch([x,y,z],[x,(y-0.36)*0.6,z],0.07,0.012,0xffe2ee,6,0.7)); }
      for(let i=0;i<5;i++){ const a=i/5*TAU; body.push(moPatch([Math.cos(a)*0.08,0.72,Math.sin(a)*0.08],[Math.cos(a)*0.6,1,Math.sin(a)*0.6],0.075,0.012,0xffc8dc,6,0.7)); } body.push(moEll(0.03,0.02,0.03,0,0.735,0,0xf2d060,null,6)); }   // a blossom on the crown
    if(deco==='crystal') for(let i=0;i<6;i++){ const a=i*1.5, x=Math.cos(a)*(0.05+0.1*(i%3)), z=Math.sin(a)*(0.05+0.1*(i%3)); body.push(moCone([x,0.55+0.05*(i%2),z],[x*1.2,1,z*1.2],0.24+0.08*(i%3),0.055,(X,Y,Z,c)=>{ c.set(top).multiplyScalar(0.85+0.4*clamp((Y-0.5)*2)); },6)); }
    if(deco==='shard') for(let i=0;i<8;i++){ const a=i*2.3, r=0.12+0.28*h3(i,5,5), x=Math.cos(a)*r, z=Math.sin(a)*r, y=0.4+0.28*Math.sqrt(Math.max(0,1-r*r/0.2)); body.push(moCone([x,y,z],[x*2,1,z*2],0.22+0.16*h3(i,6,6),0.045,(X,Y,Z,c)=>{ c.set(0xeaf8ff).multiplyScalar(0.8+0.35*clamp((Y-y)*4)); },5)); }
    G.body=moMerge(body); return G;
  },
  build(d,G,M,g,P0){ P0.body=M(G.body); g.add(P0.body); },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*(sp>0.1?7:2.5);
    const hop=sp>0.1?Math.max(0,Math.sin(m.ph))*0.45:0, sy=1+(sp>0.1?Math.sin(m.ph*2)*0.14:Math.sin(m.ph)*0.05)+lunge*0.3;
    P0.body.position.y=hop; P0.body.scale.set(1/Math.sqrt(sy),sy,1/Math.sqrt(sy));
  }
};
MODELS.shroom={
  geo(d,p){
    const G={}, body=[], W=[-1,1];
    if(p.spirit){   // kodama: a big pale head with hollow eyes on a slim body, a few moss-green rattle marks
      body.push(moLoft([{y:0.05,rx:0.09,rz:0.08},{y:0.2,rx:0.11,rz:0.09},{y:0.4,rx:0.09,rz:0.08},{y:0.55,rx:0.1,rz:0.09}],10,(x,y,z,c)=>{ c.set(p.stem).multiplyScalar(0.85+0.2*moNoise(x,y,z,8)); }));
      const hg=csph(1,moQ(22),moQ(16)).scale(0.36,0.32,0.34); moLump(hg,0.02,3,4); body.push(pc(hg.translate(0,0.86,0),(x,y,z,c)=>{ c.set(p.cap).multiplyScalar(0.92+0.12*moNoise(x,y,z,6)); if(moNoise(x+5,y,z,9)>0.7) moTint(c,p.spot,0.6); }));
      for(const sd of W){ body.push(moEll(0.07,0.1,0.05,sd*0.13,0.9,-0.3,0x14201a,null,8),moEll(0.03,0.03,0.02,sd*0.13,0.89,-0.335,0x9fe8b0,null,5)); }
      body.push(moEll(0.05,0.06,0.03,0,0.74,-0.33,0x14201a,null,8));
      for(const sd of W) body.push(moBone([sd*0.09,0.5,0],[sd*0.2,0.3,-0.04],0.028,0.02,p.stem,5),moPatch([sd*0.22,0.87,0.05],[sd,0.3,0],0.06,0.02,p.spot,6));
      G.body=moMerge(body); G.foot=moMerge([moEll(0.06,0.05,0.09,0,0.05,-0.02,p.feet,null,7)]); return G;
    }
    // the stem: a swollen foot, a slim neck, a fibrous surface
    body.push(moLoft([{y:0.1,rx:0.16,rz:0.16},{y:0.2,rx:0.23,rz:0.22},{y:0.32,rx:0.2,rz:0.19},{y:0.45,rx:0.17,rz:0.16},{y:0.58,rx:0.18,rz:0.17},{y:0.68,rx:0.2,rz:0.2}],moQ(16),(x,y,z,c)=>{ c.set(p.stem).multiplyScalar(0.72+0.34*vn3(x*24,y*3,z*24)); if(y<0.3) moTint(c,p.gill,0.4*(1-y/0.3)); }));
    // the ring (a skirt under the cap) and the cap: a dome with a wavy rim, its underside gilled
    body.push(moLoft([{y:0.6,rx:0.19,rz:0.19},{y:0.56,rx:0.29,rz:0.29},{y:0.5,rx:0.31,rz:0.31},{y:0.52,rx:0.22,rz:0.22}],moQ(18),(x,y,z,c)=>{ c.set(p.stem).multiplyScalar(0.92-0.2*(0.6-y)/0.1); }));
    const cg=new THREE.SphereGeometry(1,moQ(28),moQ(12),0,TAU,0,Math.PI/2), cp=cg.attributes.position, cv=new THREE.Vector3();
    for(let i=0;i<cp.count;i++){ cv.fromBufferAttribute(cp,i); const rim=clamp((0.45-cv.y)/0.45), w=1+0.06*Math.sin(Math.atan2(cv.z,cv.x)*9)*rim+0.03*(vn3(cv.x*3,cv.y*3,cv.z*3)-0.5); cp.setXYZ(i,cv.x*0.48*w,0.68+cv.y*0.34,cv.z*0.48*w); }
    smoothN(cg); body.push(pc(cg,(x,y,z,c)=>{ c.set(p.cap).multiplyScalar(0.85+0.25*clamp((y-0.68)*3)+0.1*moNoise(x,y,z,6)); }));
    body.push(pc(new THREE.CircleGeometry(0.47,moQ(28)).rotateX(Math.PI/2).translate(0,0.685,0),(x,y,z,c)=>{ const a=Math.atan2(z,x); c.set(p.gill).multiplyScalar(0.72+0.28*(Math.sin(a*40)>0?1:0)); }));   // the gills: radial strips
    for(let i=0;i<10;i++){ const az=i*2.39996, rr=Math.sqrt((i+0.5)/10)*0.36, x=Math.cos(az)*rr, z=Math.sin(az)*rr, y=0.68+Math.sqrt(Math.max(0.01,1-(rr/0.48)*(rr/0.48)))*0.34-0.01;
      body.push(moPatch([x,y,z],[x/0.48,(y-0.68)/0.34*0.9,z/0.48],0.05+0.04*h3(i,7,7),0.022,p.spot,7)); }   // raised spots
    // a face on the stem below the ring: eyes with heavy lids, a little mouth; two stubby arms
    for(const sd of W){ body.push(moEll(0.058,0.066,0.04,sd*0.085,0.43,-0.15,0xf6f2e6,null,8),moEll(0.03,0.034,0.022,sd*0.085,0.425,-0.185,0x111111,null,6),moEll(0.07,0.03,0.05,sd*0.085,0.485,-0.145,p.stem,[0,0,-sd*0.35],6));
      body.push(moBone([sd*0.16,0.4,-0.02],[sd*0.3,0.28,-0.09],0.038,0.028,p.stem,6),moEll(0.04,0.04,0.04,sd*0.3,0.27,-0.09,p.stem,null,6)); }
    body.push(moEll(0.06,0.026,0.02,0,0.33,-0.175,0x5a2a24,null,8),moEll(0.02,0.02,0.01,-0.03,0.342,-0.185,0xf6f2e6,null,4));
    for(const [x,z,r] of [[0.15,-0.1,0.045],[-0.17,0.04,0.035]]) body.push(moEll(r,r*1.2,r,x,0.13,z,p.cap,null,6),moEll(r*0.6,r*1.4,r*0.6,x,0.11,z,p.stem,null,6));   // sprouts at the foot
    G.body=moMerge(body); G.foot=moMerge([moEll(0.09,0.05,0.13,0,0.05,-0.03,p.feet,null,8)]);
    return G;
  },
  build(d,G,M,g,P0){ P0.body=M(G.body); g.add(P0.body); P0.fL=new THREE.Group(); P0.fR=new THREE.Group(); P0.fL.position.set(-0.13,0,0); P0.fR.position.set(0.13,0,0); P0.fL.add(M(G.foot)); P0.fR.add(M(G.foot)); g.add(P0.fL,P0.fR); },
  anim(m,dt,sp){
    const P0=m.parts; m.ph+=dt*(1+sp*6);
    P0.fL.position.z=Math.sin(m.ph)*0.12*Math.min(1,sp); P0.fR.position.z=-P0.fL.position.z;
    P0.body.rotation.z=Math.sin(m.ph)*0.09*Math.min(1,sp+0.2); P0.body.position.y=Math.abs(Math.cos(m.ph))*0.05*Math.min(1,sp);
  }
};
