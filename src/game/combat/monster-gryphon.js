//@ The gryphon model (model 'gryphon': the Gryphon Queen and her eaglets): a lion's body, an eagle's head and forelegs, great feathered wings that beat
/* Parts: body (lion trunk with the neck, tail and the eagle's chest), head (a pivot at the neck: it snaps down to strike), wR / wL (wings on shoulder
   pivots, beating), four legs (the front pair eagle's, the back lion's). pal: body (the lion's gold), belly, plume (the eagle's head and chest), beak,
   eye, wing (the flight feathers), tuft (the tail). The boss (d.boss) wears a crest of long plumes and a collar of gold. Faces -z. */
function moGryphWing(sd,p){
  const sh=[sd*0.3,1.35,-0.1], wr=[sd*1.5,1.95,-0.25], out=[moBone(sh,wr,0.1,0.06,p.wing,6)];
  const plume=(k)=>(x,y,z,c)=>{ c.set(p.wing).multiplyScalar(0.7+0.5*k*(0.6+0.4*Math.sin(z*9+x*4))); };
  for(let i=0;i<9;i++){   // flight feathers fanned back from the arm: the long ones outermost
    const s=i/8, bx=lerp(sh[0],wr[0],0.15+s*0.85), by=lerp(sh[1],wr[1],0.15+s*0.85)-0.06, bz=lerp(sh[2],wr[2],0.15+s*0.85), len=1.0+0.9*Math.sin(s*Math.PI*0.5+0.2), ang=sd*(0.25+s*0.55);
    out.push(moEll(0.13,0.02,len/2,bx+Math.sin(ang)*len/2,by-0.05*i,bz+Math.cos(ang)*len/2+0.1,plume(0.4+0.6*s),[0.08,ang*0.6,0],7));
  }
  for(let i=0;i<5;i++){ const s=i/4; out.push(moEll(0.14,0.03,0.38,lerp(sh[0],wr[0],0.2+s*0.7),lerp(sh[1],wr[1],0.2+s*0.7)+0.05,lerp(sh[2],wr[2],0.2+s*0.7)+0.1,p.plume,[0.1,sd*0.2,0],6)); }   // the covert feathers over the arm
  return moMerge(out);
}
MODELS.gryphon={
  geo(d,p){
    const G={}, W=[-1,1], boss=!!d.boss, fur=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.74+0.4*vn3(x*9,y*6,z*9)); if(y<0.7) moTint(c,p.belly,0.5); }, pl=(x,y,z,c)=>{ c.set(p.plume).multiplyScalar(0.8+0.35*vn3(x*14,y*14,z*14)); };
    const body=[moLoftZ([{z:-0.7,rx:0.34,ry:0.38,y:0.95},{z:-0.3,rx:0.44,ry:0.46,y:0.98},{z:0.3,rx:0.4,ry:0.42,y:0.95},{z:0.8,rx:0.3,ry:0.32,y:0.88},{z:1.0,rx:0.14,ry:0.16,y:0.86}],14,fur),
      moEll(0.4,0.42,0.42,0,1.12,-0.72,pl,null,12),moTube([[0,1.05,-0.6],[0,1.35,-0.85],[0,1.62,-1.02]],0.26,0.2,pl,8,true),   // the chest and the neck, in feathers
      moTube([[0,0.92,0.9],[0,1.0,1.5],[0,1.35,2.0],[0,1.55,2.3]],0.085,0.05,fur,6,false),moEll(0.1,0.13,0.2,0,1.6,2.35,p.tuft,null,8)];   // the lion's tail with its tuft
    if(boss) for(let i=0;i<8;i++){ const a=i/7*TAU*0.7-TAU*0.35; body.push(moEll(0.07,0.05,0.34,Math.sin(a)*0.34,1.48+Math.cos(a)*0.06,-0.95+Math.cos(a)*0.08,p.beak,[0.9,-a*0.6,0],6)); }   // a collar of gold
    G.body=moMerge(body);
    const head=[moEll(0.22,0.21,0.3,0,0,0,pl,null,12),moEll(0.1,0.1,0.15,0,-0.05,-0.26,p.beak,null,8),moHorn([0,-0.02,-0.3],[0,-0.1,-1],0.34,0.11,1.7,p.beak,7,[0,-1,0])];   // the skull, the cere, the hooked beak
    for(const sd of W){
      head.push(moEll(0.055,0.06,0.05,sd*0.16,0.06,-0.14,p.eye,null,8),moEll(0.02,0.045,0.02,sd*0.17,0.06,-0.17,0x101010,null,5),moEll(0.17,0.04,0.12,sd*0.14,0.15,-0.12,p.plume,[0.2,0,-sd*0.3],7));   // eyes, brows
      for(let i=0;i<(boss?4:2);i++) head.push(moCone([sd*0.1,0.14,0.08+i*0.08],[sd*0.3,1,0.7+i*0.2],0.3+i*0.12,0.045,p.beak,4));   // crest plumes
    }
    G.head=moMerge(head);
    G.wingR=moGryphWing(1,p); G.wingL=moGryphWing(-1,p);
    const talon=sd=>moCone([sd*0.05,-0.5,-0.06],[sd*0.2,-0.5,-1],0.16,0.028,0x2a2018,4);
    G.legF=moMerge([moLimb([[0,0.13],[0.3,0.1],[0.7,0.06],[1,0.055]],0.55,1,1,(x,y,z,c)=>{ c.set(y>-0.2?p.plume:p.beak).multiplyScalar(0.85+0.3*vn3(x*13,y*9,z*13)); },8),moEll(0.07,0.04,0.1,0,-0.58,-0.04,p.beak,null,6),talon(-1),talon(0),talon(1)]);   // eagle forelegs: feathered thigh, scaly shank, three talons
    G.legB=moMerge([moLimb([[0,0.17],[0.35,0.12],[0.7,0.085],[1,0.08]],0.58,1,1.1,fur,8),moEll(0.09,0.05,0.14,0,-0.62,-0.06,p.body,null,7),...[-1,0,1].map(sd=>moCone([sd*0.045,-0.64,-0.17],[sd*0.1,-0.3,-1],0.1,0.02,0x2a2018,4))]);   // lion hindlegs
    return G;
  },
  build(d,G,M,g,P0){
    P0.body=M(G.body); g.add(P0.body); P0.head=new THREE.Group(); P0.head.position.set(0,1.62,-1.05); P0.head.add(M(G.head)); P0.body.add(P0.head);
    for(const [k,sd] of [['wR',1],['wL',-1]]){ const w=new THREE.Group(); w.position.set(sd*0.3,1.35,-0.1); w.add(M(sd>0?G.wingR:G.wingL)); w.children[0].position.set(-sd*0.3,-1.35,0.1); P0.body.add(w); P0[k]=w; }
    P0.legs=[[-0.24,-0.6,'legF'],[0.24,-0.6,'legF'],[-0.26,0.7,'legB'],[0.26,0.7,'legB']].map(([x,z,k])=>{ const l=new THREE.Group(); l.position.set(x,0.62,z); l.add(M(G[k])); g.add(l); return l; });
  },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*sp*3.6;
    const amp=Math.min(1,sp/2)*0.55, atk=m.act?clamp(m.act.t/m.act.dur):0;
    P0.legs.forEach((l,k)=>{ l.rotation.x=Math.sin(m.ph+GAIT[k])*amp; });
    P0.body.rotation.x=-lunge*0.25;
    P0.head.rotation.x=m.act?(atk<0.4?-0.5*(atk/0.4):-0.5+(atk-0.4)/0.6*1.1):Math.sin(t*1.6+m.s*5)*0.05+lunge*-0.8;
    P0.head.rotation.y=Math.sin(t*0.8+m.s*3)*0.12;
    const bs=m.bs||{}, air=bs.mode===1, fl=(air?0.1:0.7)+Math.sin(t*(air?7:m.aggro?3.4:1.5)+m.s*5)*(air?0.6:0.22); P0.wR.rotation.z=fl; P0.wL.rotation.z=-fl;   // (held up like a raised V; airborne: spread and beaten hard)
  }
};
