//@ Armour and straps on the goblin family's jerkins (pal.garb): studded leather, lacquered lames and a banner, a miner's cuirass and pack, a sash and bandolier, hemp rope
/* Agent map. Called by moFolkTorsoExtras (monster-gear.js) when a def's pal has `garb`; every part is in torso space (origin at the hip joint, -z the front, rings from
   monster-folk.js). garb: 'studs' (hobgoblin), 'lame' (Goblin Ashigaru), 'mail' (Mountain Goblin), 'sash' (Desert Raider), 'rope' (Wrecker Goblin), 'chief' (Goblin Chieftain), 'priest' (Sun Priest),
   'yama' (Karasu Tengu). Parts add to the torso's own
   merged geometry (a few hundred triangles each). Look at it: node tools/monster-preview.js out.png --ids hobgoblin,ashigaru,minegoblin,raider,wrecker,chieftain,sunpriest,tengu */
const moGarbLeather=(hex,k)=>(x,y,z,c)=>{ c.set(hex).multiplyScalar((k||1)*(0.85+0.3*moNoise(x,y,z,16))); };
const moGarbMetal=hex=>(x,y,z,c)=>{ c.set(hex).multiplyScalar(0.8+0.3*clamp((y+0.1)*1.4)+0.12*moNoise(x,y,z,22)); };
// a belt, hem, collar or lame: the torso's own rings between y0 and y1, grown by `grow` metres with softened edges
function moGarbBand(rings,y0,y1,grow,f){
  const h=y1-y0, rs=[[y0,0.5],[y0+h*0.15,1],[y1-h*0.15,1],[y1,0.5]].map(([y,s])=>{ const a=moRingAt(rings,y); return {y,rx:a.rx+grow*s,rz:a.rz+grow*s,z:a.z}; });
  return moLoft(rs,moQ(22),f);
}
// a point on the torso's skin at (x,y); side -1 the front, 1 the back, off a little way out
function moGarbAt(rings,x,y,side,off){ const a=moRingAt(rings,y), k=Math.sqrt(Math.max(0,1-(x/a.rx)**2)); return [x,y,a.z+side*(a.rz+off)*k]; }
// a strap lying on the skin from A=[x,y] to B=[x,y]
function moGarbStrap(rings,A,B,side,r,f,n){
  const pts=[]; for(let i=0;i<=n;i++){ const t=i/n; pts.push(moGarbAt(rings,lerp(A[0],B[0],t),lerp(A[1],B[1],t),side,r*0.7)); }
  return moTube(pts,r,r,f,5,true);
}
// the padding on the shoulders (monster-folk.js: an ellipsoid at shX, shY+0.03): a rim under it and n rivets on top
function moGarbShoulders(F,rim,rivet,n){
  const out=[], rx=0.09*F.ar+0.03, ry=0.06*F.ar+0.02, ph=0.78;
  for(const sd of [-1,1]){
    const cx=sd*F.shX, cy=F.shY+0.03;
    out.push(moEll(rx*0.84,0.016,rx*0.84,cx,cy-ry*0.6,0,rim,null,12));
    for(let i=0;i<n;i++){ const th=i/n*TAU+sd, nx=Math.sin(ph)*Math.cos(th), ny=Math.cos(ph), nz=Math.sin(ph)*Math.sin(th);
      out.push(moPatch([cx+nx*rx,cy+ny*ry,nz*rx],[nx/rx,ny/ry,nz/rx],0.014,0.008,rivet,5)); }
  }
  return out;
}
function moGarbStuds(F,p,rings){   // thick leather with iron: a hem and collar, braces with studs, spiked shoulders
  const tc=p.topColor, lea=moGarbLeather(0x3a2418), met=moGarbMetal(0xc4c8d0), out=[];
  out.push(moGarbBand(rings,0.05,0.12,0.014,moGarbLeather(tc,0.55)),moGarbBand(rings,0.48,0.55,0.012,moGarbLeather(tc,0.62)));
  for(const sd of [-1,1]) for(const side of [-1,1]){
    out.push(moGarbStrap(rings,[sd*0.09,0.5],[sd*0.075,0.07],side,0.018,lea,4));
    if(side<0) for(let i=0;i<4;i++){ const q=moGarbAt(rings,sd*0.083,0.14+i*0.09,-1,0.014); out.push(moPatch(q,[0,0,-1],0.013,0.008,met,5)); }
  }
  out.push(moGarbStrap(rings,[-0.17,0.2],[0.17,0.2],-1,0.016,lea,5),...moGarbShoulders(F,moGarbLeather(tc,0.55),met,4));
  const ry=0.06*F.ar+0.02; for(const sd of [-1,1]) out.push(moCone([sd*F.shX*1.02,F.shY+0.03+ry*0.85,0],[sd*0.2,1,0],0.085,0.026,met,5));
  return out;
}
function moGarbLame(F,p,rings){   // lacquered lames laced with cream cord, a kilt of plates and a banner on the back
  const tc=p.topColor, cord=0xe6dcc0, gold=0xc9a13a, out=[];
  for(let i=0;i<4;i++) out.push(moGarbBand(rings,0.09+i*0.085,0.19+i*0.085,0.01,(x,y,z,c)=>{ c.set(tc).multiplyScalar((i&1?0.78:0.98)*(0.9+0.2*moNoise(x,y,z,12))); }));
  for(const sd of [-1,1]) for(const x of [0.05,0.12]) out.push(moGarbStrap(rings,[sd*x,0.09],[sd*x,0.44],-1,0.007,cord,4));
  out.push(moGarbBand(rings,0.46,0.53,0.01,moGarbLeather(0x1c1a1e)));                       // a dark collar
  const at=moRingAt(rings,-0.02);
  for(const side of [-1,1]) for(let i=-1;i<=1;i++) out.push(moEll(0.062,0.1,0.012,i*0.085,-0.09,at.z+side*(at.rz+0.04),(x,y,z,c)=>{ c.set(tc).multiplyScalar(0.72+0.12*(y<-0.12?1:0)); },[0.12*i*side,0,0],8));
  for(const sd of [-1,1]) for(let k=0;k<3;k++) out.push(moEll(0.12-k*0.008,0.017,0.1,sd*(F.shX+0.025),F.shY+0.07-k*0.037,0,(x,y,z,c)=>{ c.set(tc).multiplyScalar(0.95-k*0.1); },[0,0,sd*(0.3+k*0.12)],8));
  const bz=moRingAt(rings,0.3).z+moRingAt(rings,0.3).rz+0.05;                                // the sashimono: a pole on the back and a gold-ringed banner
  out.push(moBone([0,0.05,bz],[0,0.98,bz],0.01,0.008,0x4a3220,5),moBone([-0.005,0.96,bz],[0.17,0.96,bz],0.007,0.007,0x4a3220,5));
  out.push(moEll(0.085,0.18,0.007,0.085,0.78,bz+0.012,(x,y,z,c)=>{ c.set(tc).multiplyScalar(0.9+0.15*moNoise(x,y,z,10)); },[0,0,0.04],10),moPatch([0.085,0.78,bz+0.02],[0,0,1],0.045,0.006,gold,10));
  return out;
}
function moGarbMail(F,p,rings){   // a miner's cuirass over banded plates, riveted shoulders, and a pack with a bedroll
  const tc=p.topColor, plate=moGarbMetal(0x8a8c90), dark=moGarbMetal(0x4a4a48), out=[];
  for(let i=0;i<3;i++) out.push(moGarbBand(rings,0.06+i*0.05,0.12+i*0.05,0.011,i&1?dark:plate));
  for(const side of [-1,1]){ const a=moRingAt(rings,0.32), z=a.z+side*a.rz*0.92;
    out.push(moEll(a.rx*0.86,0.15,0.034,0,0.32,z,plate,null,12));
    out.push(moBone([0,0.19,z+side*0.026],[0,0.47,z+side*0.026],0.012,0.012,dark,5));
    for(const x of [-0.1,0.1]) for(const y of [0.2,0.43]) out.push(moPatch([x,y,z+side*0.026],[0,0,side],0.012,0.008,0xb8bcc4,5)); }
  out.push(...moGarbShoulders(F,dark,0xb8bcc4,5));
  const pk=moRingAt(rings,0.28), pz=pk.z+pk.rz+0.09;
  out.push(moEll(0.14,0.17,0.1,0,0.27,pz,moGarbLeather(0x7a6a48),null,12),moEll(0.09,0.06,0.05,0,0.2,pz+0.08,moGarbLeather(0x5a4a30),null,8),   // the pack, a pocket
    moBone([-0.14,0.47,pz],[0.14,0.47,pz],0.046,0.046,moGarbLeather(0x6a3a30),8),                                                              // the bedroll
    moGarbStrap(rings,[-0.09,0.46],[-0.075,0.1],1,0.018,moGarbLeather(0x3a2418),4),moGarbStrap(rings,[0.09,0.46],[0.075,0.1],1,0.018,moGarbLeather(0x3a2418),4),
    moGarbStrap(rings,[-0.09,0.46],[-0.075,0.1],-1,0.018,moGarbLeather(0x3a2418),4),moGarbStrap(rings,[0.09,0.46],[0.075,0.1],-1,0.018,moGarbLeather(0x3a2418),4));
  return out;
}
function moGarbSash(F,p,rings){   // a red sash with knot and tails, a bandolier of pouches and a cream scarf with a trailing end
  const red=moGarbLeather(0xa8322a), lea=moGarbLeather(0x4a2c18), scarf=p.turban||0xe8e0c8, out=[];
  out.push(moGarbBand(rings,-0.03,0.12,0.02,red));
  const at=moRingAt(rings,0.05);
  out.push(moEll(0.032,0.03,0.02,0.07,0.06,at.z-at.rz-0.03,red,null,8),moEll(0.024,0.11,0.008,0.05,-0.06,at.z-at.rz-0.055,red,[0,0,0.14],6),moEll(0.024,0.09,0.008,0.1,-0.05,at.z-at.rz-0.055,red,[0,0,-0.2],6));
  for(const side of [-1,1]) out.push(moGarbStrap(rings,[0.14,0.5],[-0.13,0.14],side,0.018,lea,5));
  for(let i=0;i<3;i++){ const t=(i+0.7)/3.4, q=moGarbAt(rings,lerp(0.14,-0.13,t),lerp(0.5,0.14,t),-1,0.022); out.push(moEll(0.03,0.032,0.018,q[0],q[1]-0.03,q[2],lea,[0,0,0.5],7),moPatch([q[0],q[1]-0.02,q[2]-0.014],[0,0,-1],0.011,0.007,0xc9a13a,5)); }
  out.push(moGarbBand(rings,0.47,0.55,0.02,moGarbLeather(scarf,1)));
  const bk=moGarbAt(rings,0.04,0.5,1,0.03);
  out.push(moTube([bk,[bk[0]+0.03,bk[1]-0.12,bk[2]+0.03],[bk[0]-0.02,bk[1]-0.26,bk[2]+0.05],[bk[0]+0.02,bk[1]-0.4,bk[2]+0.05]],0.034,0.05,moGarbLeather(scarf,0.95),6,true));
  return out;
}
function moGarbRope(F,p,rings){   // two turns of hemp rope over the chest, a coil on a shoulder and an iron hook on the belt
  const hemp=(x,y,z,c)=>{ c.set(0xa88a58).multiplyScalar(0.75+0.4*moNoise(x,y,z,28)); }, twist=(t,a)=>1+0.2*Math.sin(a*2+t*70), out=[];
  for(const [A,B] of [[[0.14,0.5],[-0.14,0.1]],[[-0.15,0.48],[0.15,0.16]]]){
    for(const side of [-1,1]){ const pts=[]; for(let i=0;i<=5;i++){ const t=i/5; pts.push(moGarbAt(rings,lerp(A[0],B[0],t),lerp(A[1],B[1],t),side,0.026)); } out.push(moTube(pts,0.026,0.026,hemp,6,true,twist)); }
  }
  for(let k=0;k<3;k++) out.push(moEll(0.1-k*0.005,0.026,0.1-k*0.005,-F.shX,F.shY+0.11+k*0.035,0,hemp,null,10));
  const at=moRingAt(rings,0.02);
  out.push(moBone([0.1,0.0,at.z-at.rz-0.01],[0.1,-0.07,at.z-at.rz-0.025],0.011,0.011,moGarbMetal(0x6a6e74),5),moHorn([0.1,-0.07,at.z-at.rz-0.025],[0,-1,-0.1],0.06,0.011,-1.6,moGarbMetal(0x6a6e74),5,[0,0,-1]));
  out.push(moGarbBand(rings,0.48,0.55,0.01,moGarbLeather(p.topColor,0.6)));
  return out;
}
function moGarbChief(F,p,rings){   // a fur mantle, a V of trophy fangs and a broad belt with a gold buckle
  const fang=(x,y,z,c)=>{ c.set(0xe8e2cc).multiplyScalar(0.78+0.3*clamp((y+0.2)*3)); }, out=[];
  out.push(...moFurLocks(rings,0.5,1.12,14,0.14,0x4a3624,2),moGarbBand(rings,-0.03,0.08,0.013,moGarbLeather(0x2a1c14)));
  for(let i=0;i<9;i++){ const t=i/8, x=lerp(-0.1,0.1,t), y=0.4-0.11*(1-Math.abs(t-0.5)*2)-0.0, q=moGarbAt(rings,x,y+0.04,-1,0.02);
    out.push(moCone([q[0],q[1],q[2]],[0,-1,-0.25],0.05+(i===4?0.04:0),0.014+(i===4?0.006:0),fang,5)); }
  out.push(moGarbStrap(rings,[-0.12,0.46],[0,0.3],-1,0.007,0x2a1c14,3),moGarbStrap(rings,[0.12,0.46],[0,0.3],-1,0.007,0x2a1c14,3));
  const at=moRingAt(rings,0.02); out.push(moPatch([0,0.02,at.z-at.rz-0.02],[0,0,-1],0.05,0.012,0xc9a13a,10));
  return out;
}
function moGarbPriest(F,p,rings){   // a gold collar hung with turquoise, a sun disc on the chest, a gold sash and gilded shoulders
  const gold=moGarbMetal(0xe0b040), tq=0x3a9aa8, out=[];
  out.push(moGarbBand(rings,0.43,0.54,0.026,gold),moGarbBand(rings,-0.03,0.08,0.014,gold));
  for(let i=0;i<7;i++){ const t=i/6, x=lerp(-0.12,0.12,t), q=moGarbAt(rings,x,0.42-0.06*(1-Math.abs(t-0.5)*2)*0.0-0.01,-1,0.034);
    out.push(moEll(0.014,0.03,0.01,q[0],q[1],q[2],tq,null,6)); }
  const ch=moRingAt(rings,0.3), z=ch.z-ch.rz-0.016;
  out.push(moPatch([0,0.3,z],[0,0,-1],0.055,0.012,gold,12),moPatch([0,0.3,z-0.01],[0,0,-1],0.025,0.01,0xff5a3a,8));
  for(let i=0;i<8;i++){ const a=i/8*TAU; out.push(moCone([Math.cos(a)*0.058,0.3+Math.sin(a)*0.058,z-0.004],[Math.cos(a),Math.sin(a),-0.15],0.035,0.011,gold,4)); }
  for(const sd of [-1,1]) out.push(moEll(0.014,0.09,0.008,sd*0.045,-0.07,at_front(rings)-0.05,gold,[0,0,sd*0.08],6));
  out.push(...moGarbShoulders(F,gold,tq,3));
  return out;
}
const at_front=rings=>{ const a=moRingAt(rings,0.0); return a.z-a.rz; };
function moGarbYama(F,p,rings){   // a yamabushi's: a rope collar with paper streamers, round tufts on the chest, a red sash with a tassel
  const hemp=moGarbLeather(0xb89a62), paper=(x,y,z,c)=>{ c.set(0xf4f0e4).multiplyScalar(0.85+0.2*moNoise(x,y,z,14)); }, tuft=(x,y,z,c)=>{ c.set(0x24242c).multiplyScalar(0.7+0.6*moNoise(x,y,z,34)); }, out=[];
  out.push(moGarbBand(rings,0.46,0.53,0.018,hemp),moGarbBand(rings,-0.03,0.09,0.014,moGarbLeather(0xa8322a)));
  for(const sd of [-1,1]) for(let i=0;i<3;i++){ const q=moGarbAt(rings,sd*(0.05+0.045*i),0.4-0.08*i,-1,0.026); out.push(moEll(0.034,0.034,0.03,q[0],q[1],q[2],tuft,null,7)); }
  for(let i=0;i<5;i++){ const x=lerp(-0.1,0.1,i/4), q=moGarbAt(rings,x,0.47,-1,0.03);
    out.push(moEll(0.014,0.045,0.004,q[0],q[1]-0.055-0.01*(i&1),q[2]-0.006,paper,[0,0,0.08*(i-2)],6)); }
  const at=moRingAt(rings,0.04); out.push(moEll(0.02,0.09,0.008,0.0,-0.07,at.z-at.rz-0.04,moGarbLeather(0xa8322a),null,6),moEll(0.028,0.026,0.02,0.0,0.04,at.z-at.rz-0.03,moGarbLeather(0xa8322a),null,7));
  return out;
}
function moGarb(F,p,rings){
  if(p.garb==='studs') return moGarbStuds(F,p,rings);
  if(p.garb==='lame') return moGarbLame(F,p,rings);
  if(p.garb==='mail') return moGarbMail(F,p,rings);
  if(p.garb==='sash') return moGarbSash(F,p,rings);
  if(p.garb==='rope') return moGarbRope(F,p,rings);
  if(p.garb==='chief') return moGarbChief(F,p,rings);
  if(p.garb==='priest') return moGarbPriest(F,p,rings);
  if(p.garb==='yama') return moGarbYama(F,p,rings);
  return [];
}
