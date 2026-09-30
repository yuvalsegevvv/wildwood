//@ Boar and fox / wolf / lynx models (models 'boar' and 'fox'): bristled hogs with tusks and a head that gores, slim kitsune with fans of tails, heavy wolves, tufted lynx
/* boar: body (shoulders, haunches, a bristle ridge, a curled tail) with a head pivot (P0.head: it dips to gore) and four leg pivots; pal.ram (curled horns), pal.spiky (long bristles),
   pal.shaggy (a fringe). fox: body (head, ears, ruff), tail (P0.tail: one tail, or a fan of pal.tails), four legs; pal.wolf (heavy, small ears, ruff), pal.cat (a lynx: round head, ear tufts,
   a bobbed tail), pal.flame (foxfire on the tails' tips), pal.mane (a ridge of spikes, the raiju). */
MODELS.boar={
  geo(d,p){
    const G={}, W=[-1,1], fur=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.62+0.6*vn3(x*13,y*5,z*13)); if(y<0.5) c.multiplyScalar(0.85); }, dk=(x,y,z,c)=>{ c.set(p.ridge).multiplyScalar(0.8+0.3*moNoise(x,y,z,9)); };
    const backY=z=>lerp(1.0,1.06,clamp(1-Math.abs(z+0.25)/0.45))-(z>0.3?(z-0.3)*0.18:0)-(z<-0.5?(-0.5-z)*0.4:0);
    const body=[moLoftZ([{z:-0.76,rx:0.18,ry:0.2,y:0.68},{z:-0.55,rx:0.36,ry:0.38,y:0.68},{z:-0.28,rx:0.42,ry:0.42,y:0.68},{z:0.05,rx:0.38,ry:0.38,y:0.64},{z:0.32,rx:0.4,ry:0.4,y:0.62},{z:0.62,rx:0.3,ry:0.3,y:0.6},{z:0.8,rx:0.13,ry:0.13,y:0.6}],moQ(18),fur)];
    for(let i=0;i<11;i++){ const z=-0.55+i*0.115, sh=Math.exp(-Math.pow((z+0.3)/0.3,2)); body.push(moCone([0,backY(z)-0.05,z],[0,1,-0.25],(0.16+0.12*sh)*(p.spiky?1.7:1),0.05,dk,4)); }   // the bristle ridge
    body.push(moTube([[0,0.72,0.72],[0,0.86,0.86],[0.05,0.96,0.86],[0.07,0.97,0.78]],0.035,0.014,dk,5,true));   // the curled tail
    if(p.shaggy) for(let i=0;i<16;i++){ const z=-0.5+(i>>1)*0.16, sd=i&1?1:-1; body.push(moCone([sd*0.34,0.5,z],[sd*0.3,-1,0],0.2,0.06,fur,4)); }
    G.body=moMerge(body);
    // the head, at the neck (pivot): skull, snout, nose disc, jaw, tusks, ears, eyes
    const head=[moEll(0.25,0.26,0.3,0,0,-0.14,(x,y,z,c)=>{ c.set(p.head).multiplyScalar(0.7+0.5*vn3(x*13,y*5,z*13)); },null,14),moEll(0.14,0.12,0.24,0,-0.1,-0.46,p.snout,null,10),moEll(0.125,0.105,0.05,0,-0.09,-0.68,p.snout,null,10),
      moEll(0.11,0.05,0.2,0,-0.22,-0.4,p.head,null,8),moEll(0.3,0.05,0.09,0,0.14,-0.26,dk,[0.3,0,0],8)];
    for(const sd of W){
      head.push(moEll(0.03,0.03,0.02,sd*0.05,-0.08,-0.72,0x2a1418,null,5),moEll(0.03,0.03,0.03,sd*0.14,0.08,-0.32,p.eye,null,6),moEll(0.1,0.15,0.03,sd*0.18,0.24,0.06,dk,[0.4,0,-sd*0.45],7));   // nostrils, eyes, ears
      head.push(moHorn([sd*0.1,-0.17,-0.52],[sd*0.2,0.35,-0.8],0.34,0.045,1.5,p.tusk,5,[0,1,0]),moCone([sd*0.06,-0.15,-0.66],[0,-1,-0.4],0.1,0.02,p.tusk,4));
      for(let i=0;i<3;i++) head.push(moCone([sd*0.2,-0.05-i*0.04,-0.28+i*0.06],[sd*0.6,-0.5,0.2],0.13,0.03,dk,4));   // cheek bristles
      if(p.ram) head.push(moHorn([sd*0.2,0.2,-0.02],[sd,0.2,0.3],0.75,0.09,2.2,0xe8e4dc,7,[0,-0.4,-1]));
    }
    G.head=moMerge(head);
    G.leg=moMerge([moLimb([[0,0.095],[0.3,0.075],[0.55,0.05],[0.85,0.04],[1,0.045]],0.42,1,1.05,(x,y,z,c)=>{ c.set(p.legs).multiplyScalar(0.8+0.4*vn3(x*13,y*5,z*13)); },8),moEll(0.05,0.035,0.065,0,-0.445,-0.02,0x1a1410,null,6)]);
    return G;
  },
  build(d,G,M,g,P0){
    P0.body=M(G.body); g.add(P0.body); P0.head=new THREE.Group(); P0.head.position.set(0,0.66,-0.6); P0.head.add(M(G.head)); P0.body.add(P0.head);
    P0.legs=[[-0.2,-0.4],[0.2,-0.4],[-0.2,0.4],[0.2,0.4]].map(([x,z])=>{ const l=new THREE.Group(); l.position.set(x,0.42,z); l.add(M(G.leg)); g.add(l); return l; });
  },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*sp*4;
    const amp=Math.min(1,sp/2)*0.6;
    P0.legs.forEach((l,k)=>{ l.rotation.x=Math.sin(m.ph+GAIT[k])*amp; });
    P0.body.rotation.x=lunge*-0.3; P0.head.rotation.x=-lunge*1.5+Math.sin(t*1.6+m.s*5)*0.04+Math.sin(m.ph*2)*0.05*Math.min(1,sp);   // it lowers its head to gore
  }
};
MODELS.fox={
  geo(d,p){
    const G={}, W=[-1,1], w=p.wolf?1:0, cat=!!p.cat, big=1+0.16*w;
    const fur=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.72+0.42*vn3(x*11,y*6,z*11)); const lo=clamp((0.6-y)*5); if(lo>0||(z<-0.4&&y<0.88)) moTint(c,p.belly,Math.max(lo,z<-0.4&&y<0.88?0.55:0)*0.75); };
    const pale=(x,y,z,c)=>{ c.set(p.belly).multiplyScalar(0.9+0.15*moNoise(x,y,z,10)); };
    const body=[moLoftZ([{z:-0.66,rx:0.1*big,ry:0.13*big,y:0.82},{z:-0.46,rx:0.19*big,ry:0.23*big,y:0.72},{z:-0.25,rx:0.24*big,ry:0.27*big,y:0.68},{z:0,rx:0.2*big,ry:0.22*big,y:0.65},{z:0.25,rx:0.22*big,ry:0.25*big,y:0.66},{z:0.5,rx:0.15*big,ry:0.18*big,y:0.66},{z:0.64,rx:0.07*big,ry:0.09*big,y:0.68}],moQ(16),fur),
      moEll(0.14*big,0.19*big,0.22,0,0.84,-0.58,fur,null,10)];   // the trunk (chest, waist, hips), the neck
    const sn=cat?0.5:1;   // a cat's muzzle is short
    body.push(moEll(0.16*big+(cat?0.03:0),0.15*big,0.18,0,0.93,-0.72,fur,null,12),moTube([[0,0.9,-0.8],[0,0.88,-0.8-0.18*sn],[0,0.86,-0.8-0.3*sn]],0.09*big,cat?0.065:0.045,(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.9); moTint(c,p.belly,clamp((0.88-y)*8)); },8,true),
      moEll(0.03,0.025,0.035,0,0.86,-0.8-0.31*sn,0x141014,null,6),moEll(0.07*big,0.03,0.12*sn+0.04,0,0.8,-0.8-0.12*sn,pale,null,8),moEll(0.09,0.1,0.06,0,1.05,-0.66,p.tip,null,6));   // head, muzzle, nose, jaw, the blaze
    for(const sd of W){
      const ear=(len,wd)=>moCone([sd*0.1,1.03,-0.6],[sd*0.28,1,0.12],len,wd,(x,y,z,c)=>{ c.set(p.body); if(y>1.03+len*0.72) c.set(cat?0x14100e:0x1a1414); },4);
      body.push(w?ear(0.2,0.06):cat?ear(0.19,0.06):ear(0.3,0.075));
      body.push(moEll(0.028,0.024,0.02,sd*0.1,0.97,-0.81,p.eye,[0,0,-sd*0.3],6),moEll(0.008,0.02,0.01,sd*0.1,0.97,-0.83,0x101010,null,4));
      if(w||cat) for(let i=0;i<3;i++) body.push(moCone([sd*0.13,0.9-i*0.03,-0.66+i*0.03],[sd*0.6,-0.6,0.3],0.16,0.035,pale,4));   // cheek fur
      if(cat) body.push(moCone([sd*0.09,1.2,-0.58],[sd*0.1,1,0.05],0.14,0.012,0x14100e,3));   // ear tufts
    }
    if(w||cat) for(let i=0;i<14;i++){ const a=i/14*TAU, ca=Math.cos(a), sa=Math.sin(a); body.push(moCone([ca*0.17*big,0.82+sa*0.19*big,-0.52],[ca*0.25,sa*0.25,1],0.22,0.1,(x,y,z,c)=>{ c.set(p.belly).lerp(_tint.set(p.body),0.3).multiplyScalar(0.8+0.3*vn3(x*12,y*8,z*12)); },4)); }   // the ruff: locks round the neck
    if(p.mane) for(let i=0;i<9;i++){ const z=-0.6+i*0.12; body.push(moCone([0,0.93-Math.abs(i-2)*0.02-i*0.012,z],[0,1,0.3],0.3-i*0.02,0.045,p.tip,4)); }
    moBossFox(d,p,body);   // (Kyuubi) gold, beads, a rope and foxfire
    G.body=moMerge(body);
    // the tail, or a fan of them, in the pivot's own frame (starts at the origin, runs back along +z)
    const n=cat?1:Math.max(1,Math.min(9,p.tails|0||1)), tails=[];
    const path=cat?[[0,0,0],[0,0.05,0.2],[0,0,0.36]]:w?[[0,0,0],[0,-0.05,0.4],[0,-0.3,0.75],[0,-0.6,0.95]]:[[0,0,0],[0,0.18,0.45],[0,0.35,0.9],[0,0.32,1.3]];
    for(let i=0;i<n;i++){
      const a=n>1?(i/(n-1)-0.5)*Math.min(2.6,0.55*n):0, lift=n>1?0.3*Math.sin(i*1.7):0, q=path.map(([X,Y,Z])=>[Math.sin(a)*Z,Y+lift*Z,Math.cos(a)*Z]), tipZ=path[path.length-1][2]*0.72;
      tails.push(moTube(q,cat?0.055:0.06,0.02,(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.8+0.4*vn3(x*10,y*6,z*10)); if(Math.hypot(x,z)>tipZ) c.set(p.tip); },8,true,t=>1+(cat?0.4:2.3)*Math.pow(Math.sin(Math.PI*Math.min(1,t*1.05)),0.8)));
      if(p.flame){ const e=q[q.length-1]; tails.push(moEll(0.07,0.11,0.07,e[0],e[1]+0.1,e[2],p.tip,null,7),moCone([e[0],e[1]+0.12,e[2]],[0,1,0.15],0.34,0.06,p.tip,5)); }
    }
    G.tail=moMerge(tails);
    G.leg=moMerge([moLimb([[0,0.075*big],[0.25,0.062*big],[0.5,0.04],[0.85,0.032],[1,0.036]],0.46,1,1,(x,y,z,c)=>{ if(y<-0.22) c.set(p.legs).multiplyScalar(0.9); else c.set(p.body).multiplyScalar(0.85); },8),moEll(0.04,0.03,0.07,0,-0.46,-0.03,p.legs,null,6)]);
    return G;
  },
  build(d,G,M,g,P0){
    P0.body=M(G.body); g.add(P0.body); P0.tail=new THREE.Group(); P0.tail.position.set(0,0.78,0.5); P0.tail.add(M(G.tail)); g.add(P0.tail);
    P0.legs=[[-0.15,-0.4],[0.15,-0.4],[-0.15,0.38],[0.15,0.38]].map(([x,z])=>{ const l=new THREE.Group(); l.position.set(x,0.46,z); l.add(M(G.leg)); g.add(l); return l; });
  },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*sp*4.5;
    const amp=Math.min(1,sp/2)*0.7;
    P0.legs.forEach((l,k)=>{ l.rotation.x=Math.sin(m.ph+GAIT[k])*amp; });
    P0.body.rotation.x=lunge*-0.3; P0.body.position.y=Math.abs(Math.sin(m.ph))*0.04*Math.min(1,sp);
    P0.tail.rotation.y=Math.sin(t*2.2+m.s*7)*0.25; P0.tail.rotation.x=-0.1+Math.sin(t*1.7+m.s*3)*0.08;
  }
};
