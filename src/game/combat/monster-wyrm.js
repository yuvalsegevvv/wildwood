//@ The frost wyrm model (model 'wyrm': Vetrmaw and the wyrmlings): a horned head with teeth, eight armoured body segments that undulate, membrane wings on finger bones, clawed legs, a spiked tail
/* Parts: segs (pivots chained from the neck to the tail, each swaying more than the one before), head (on the first segment: it snaps in an attack), tail (the spade),
   wR / wL (wings, flapping), legs. The boss (d.boss) grows frost: a crown of ice, crystals down its back, a beard of icicles. */
function moWyrmWing(sd,p){
  const V=(x,y,z)=>[sd*x,y,z], S0=V(0,0,0), Wr=V(1.25,0.55,-0.35), T=[V(2.5,0.35,-1.05),V(3.0,0.05,0.3),V(2.2,-0.1,1.6)], Bk=V(0.35,-0.05,1.25), A=flatAcc(), out=[];
  const col=(k)=>{ const c=new THREE.Color(p.wing).multiplyScalar(0.55+0.55*k); return [c.r,c.g,c.b]; };
  const tri=(a,b,c,ka,kb,kc)=>{ const n=crs3([b[0]-a[0],b[1]-a[1],b[2]-a[2]],[c[0]-a[0],c[1]-a[1],c[2]-a[2]]), l=Math.hypot(n[0],n[1],n[2])||1, nn=[n[0]/l,n[1]/l,n[2]/l], nf=[-nn[0],-nn[1],-nn[2]];
    A.tri(a,b,c,nn,nn,nn,col(ka),col(kb),col(kc)); A.tri(a,c,b,nf,nf,nf,col(ka),col(kc),col(kb)); };   // two-sided
  const mid=(a,b,k)=>[lerp(a[0],b[0],0.5)*(1-k)+Wr[0]*k,lerp(a[1],b[1],0.5)*(1-k)+Wr[1]*k,lerp(a[2],b[2],0.5)*(1-k)+Wr[2]*k];   // scallops: the edge dips toward the wrist between the fingers
  const edge=[...T,Bk];
  for(let i=0;i<edge.length-1;i++){ const m=mid(edge[i],edge[i+1],0.3); tri(Wr,edge[i],m,0.5,1,0.9); tri(Wr,m,edge[i+1],0.5,0.9,1); }
  tri(S0,Wr,Bk,0.35,0.5,0.7);
  out.push(A.done(),moBone(S0,Wr,0.09,0.06,p.horn,6));
  for(const t of T) out.push(moBone(Wr,t,0.05,0.018,p.horn,5));
  out.push(moBone(S0,Bk,0.04,0.02,p.horn,5),moCone(T[0],[sd*0.6,-0.1,-0.8],0.22,0.03,0xe8f6ff,4));   // the wing's claw
  return moMerge(out);
}
MODELS.wyrm={
  geo(d,p){
    const G={}, W=[-1,1], boss=!!d.boss, R=[0.62,0.6,0.55,0.5,0.44,0.38,0.31,0.24], ice=(x,y,z,c)=>{ c.set(0xeaf8ff).multiplyScalar(0.8+0.3*clamp(y*0.5+0.5)); };
    G.segs=R.map((r,i)=>{ const L=[moEll(r,r*0.92,r*1.25,0,0,0,(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.72+0.4*vn3(x*7,y*7,z*7)); if(y<-r*0.25) moTint(c,p.belly,0.85); if(Math.abs(Math.sin(z*7))<0.16&&y>-r*0.2) c.multiplyScalar(0.8); },null,moQ(14))];
      for(const dz of [-0.25,0,0.25]) L.push(moCone([0,r*0.85,dz*r*2],[0,1,0.15],r*0.75*(dz===0?1.2:1),r*0.13,p.ridge,5));   // the back's spines
      if(boss&&i<6) for(const sd of W) L.push(moCone([sd*r*0.5,r*0.8,-r*0.3],[sd*0.6,1,0],r*1.1,r*0.12,ice,5),moCone([sd*r*0.8,r*0.5,r*0.2],[sd,0.7,0],r*0.7,r*0.09,ice,5));   // frost crystals
      return moMerge(L); });
    G.tailTip=moMerge([moEll(0.16,0.15,0.2,0,0,0.1,p.body,null,8),moEll(0.44,0.04,0.36,0,0,0.75,(x,y,z,c)=>{ c.set(p.ridge).multiplyScalar(0.8+0.3*clamp(z)); },null,8),moCone([0,0,0.9],[0,0,1],0.5,0.09,p.horn,5),
      ...[-1,1].map(sd=>moCone([0,sd*0.3,0.55],[0,sd,0.7],0.3,0.05,p.ridge,4))]);
    const bone=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.72+0.4*vn3(x*7,y*7,z*7)); if(y<-0.12) moTint(c,p.belly,0.7); };
    const head=[moEll(0.42,0.34,0.5,0,0,-0.3,bone,null,moQ(14)),moTube([[0,0.0,-0.55],[0,-0.05,-0.9],[0,-0.08,-1.22]],0.27,0.15,bone,8,true),moEll(0.25,0.08,0.52,0,-0.29,-0.75,p.belly,null,10),
      moEll(0.1,0.05,0.08,0,-0.06,-1.28,0x14202a,null,6)];
    for(const sd of W){
      head.push(moEll(0.075,0.085,0.05,sd*0.27,0.13,-0.52,p.eye,[0,sd*0.3,0],8),moEll(0.02,0.07,0.02,sd*0.28,0.13,-0.56,0x101010,null,5),moEll(0.22,0.06,0.17,sd*0.2,0.24,-0.5,p.ridge,[0.2,0,-sd*0.3],8),
        moHorn([sd*0.24,0.26,-0.1],[sd*0.3,0.55,0.8],0.85,0.1,0.9,p.horn,6,[0,1,0]),moHorn([sd*0.3,0.05,-0.15],[sd*0.8,0.1,0.6],0.5,0.07,0.6,p.horn,5,[0,0.5,0]));   // eyes, brows, the great horns, the cheek horns
      for(let i=0;i<5;i++) head.push(moCone([sd*(0.13-i*0.008),-0.1,-0.7-i*0.12],[0,-1,-0.1],0.13-i*0.008,0.028,0xf6f2e4,4),moCone([sd*(0.11-i*0.006),-0.27,-0.7-i*0.11],[0,1,-0.1],0.1,0.022,0xf6f2e4,4));   // teeth
      for(let i=0;i<3;i++) head.push(moEll(0.03,0.3-i*0.06,0.13,sd*(0.3+i*0.04),0.0+i*0.05,0.12+i*0.06,p.wing,[0,sd*0.6,-sd*(0.4+i*0.25)],6));   // a frill of fins behind the jaw
    }
    for(let i=0;i<3;i++) head.push(moCone([0,0.3,-0.15+i*0.26],[0,1,0.3],0.3,0.07,p.ridge,5));
    if(boss){ for(let i=0;i<5;i++){ const a=(i-2)*0.32; head.push(moCone([Math.sin(a)*0.22,0.3,-0.25],[Math.sin(a)*0.5,1,-0.15],0.5+0.2*Math.cos(a*2),0.06,ice,5)); }   // a crown of ice
      for(let i=0;i<5;i++) head.push(moCone([(i-2)*0.06,-0.32,-0.55-i*0.06],[0,-1,-0.1],0.3-Math.abs(i-2)*0.04,0.035,ice,4)); }   // a beard of icicles
    G.head=moMerge(head);
    G.wingR=moWyrmWing(1,p); G.wingL=moWyrmWing(-1,p);
    G.leg=moMerge([moLimb([[0,0.23],[0.4,0.16],[1,0.12]],0.62,1,1,bone,8),moEll(0.17,0.07,0.25,0,-0.66,-0.1,p.body,null,8),...[-1,0,1].map(sd=>moCone([sd*0.08,-0.68,-0.3],[sd*0.2,-0.2,-1],0.2,0.035,p.horn,4))]);
    return G;
  },
  build(d,G,M,g,P0){
    const zs=[0,0.85,0.8,0.7,0.6,0.5,0.45,0.4], nd=(par,x,y,z,mesh)=>{ const o=new THREE.Group(); o.position.set(x,y,z); if(mesh) o.add(mesh); par.add(o); return o; };
    let par=g; P0.segs=G.segs.map((geo,i)=>{ const pv=nd(par,0,i?0:1.0,zs[i],M(geo)); par=pv; return pv; });
    P0.tail=nd(par,0,0,0.5,M(G.tailTip)); P0.head=nd(P0.segs[0],0,0.35,-0.75,M(G.head));
    P0.wR=nd(P0.segs[0],0.45,0.5,-0.1,M(G.wingR)); P0.wL=nd(P0.segs[0],-0.45,0.5,-0.1,M(G.wingL));
    P0.legs=[[P0.segs[0],-0.5,-0.15],[P0.segs[0],0.5,-0.15],[P0.segs[3],-0.4,0],[P0.segs[3],0.4,0]].map(([s,x,z])=>nd(s,x,-0.25,z,M(G.leg)));
  },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*(1.2+sp*1.3);
    const amp=0.12+Math.min(1,sp/2)*0.16, atk=m.act?clamp(m.act.t/m.act.dur):0;
    P0.segs.forEach((s,i)=>{ s.rotation.y=Math.sin(m.ph*2-i*0.6)*amp*(0.4+i*0.14); s.rotation.x=Math.sin(m.ph*1.3-i*0.5)*0.03; });
    P0.tail.rotation.y=Math.sin(m.ph*2-5)*amp*1.3;
    P0.head.rotation.x=m.act?(atk<0.45?-0.7*(atk/0.45):-0.7+(atk-0.45)/0.55*1.5):Math.sin(t*1.4+m.ph)*0.05+lunge*0.6;
    P0.head.rotation.y=Math.sin(m.ph*2+0.6)*0.1;
    const fl=Math.sin(t*(m.aggro?3.2:1.4)+m.s*5)*0.35+0.25; P0.wR.rotation.z=fl; P0.wL.rotation.z=-fl;
    P0.legs.forEach((l,k)=>{ l.rotation.x=Math.sin(m.ph*2+GAIT[k])*Math.min(1,sp/2)*0.5; });
  }
};
