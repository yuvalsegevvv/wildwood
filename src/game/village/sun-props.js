//@ Glasswell's greenery and harbour: date palms (round the lake, the Well Court, the courtyards and in the gaps between houses), the jetties and the moored boats
/* Palm leaves go to C.leaf (double-sided, the game's matBroadD); trunks to C.out. The positions come from GLASSWELL and a fixed seed, so every visit shows the same trees. Boats are static views:
   the game's other client-only life (camels at the stables, villagers, birds) is not part of the model. */
// a date palm: a leaning trunk in short tapering rings, a crown of curved fronds, a bunch of dates
function gwPalm(C,x,z,seed,scale){
  const s=scale||1, h=(5.2+h3(seed,1,1)*3)*s, lean=(h3(seed,2,2)-0.5)*0.4, la=h3(seed,3,3)*TAU, N=6, up=new THREE.Vector3(0,1,0);
  const P=t=>new THREE.Vector3(x+Math.sin(la)*lean*h*t*t,h*t,z+Math.cos(la)*lean*h*t*t);
  for(let k=0;k<N;k++){ const a=P(k/N), b=P((k+1)/N), dir=b.clone().sub(a), len=dir.length(), q=new THREE.Quaternion().setFromUnitVectors(up,dir.normalize());
    C.out.push(pc(cyl(0.2*s*(1-(k+1)/N*0.45),0.2*s*(1-k/N*0.45),len,6),(px,py,pz,c)=>c.set(0x8a6a44).multiplyScalar(0.78+0.22*((Math.floor(py*2.4)+k)&1))).applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5),q,new THREE.Vector3(1,1,1)))); }
  const top=P(1), T=[], NF=10;
  for(let i=0;i<NF;i++){ const a=TAU*i/NF+h3(seed,i,5)*0.4, L=(3.0+h3(seed,i,6)*1.1)*s, ca=Math.cos(a), sa=Math.sin(a), st=[];
    for(let k=0;k<=5;k++){ const t=k/5, r=L*t, y=L*(0.38*t-0.62*t*t), w=0.55*s*Math.sin(Math.PI*(0.12+0.88*t))*(1-0.3*t); st.push([top.x+Math.sin(a)*r,top.y+y,top.z+Math.cos(a)*r,Math.cos(a)*w,-Math.sin(a)*w]); }
    for(let k=0;k<5;k++){ const A0=st[k], B0=st[k+1]; T.push(A0[0]+A0[3],A0[1],A0[2]+A0[4], A0[0]-A0[3],A0[1],A0[2]-A0[4], B0[0]+B0[3],B0[1],B0[2]+B0[4], B0[0]+B0[3],B0[1],B0[2]+B0[4], A0[0]-A0[3],A0[1],A0[2]-A0[4], B0[0]-B0[3],B0[1],B0[2]-B0[4]); } }
  C.leaf.push(paint(trisGeo(T),(px,py,pz,nx,ny,nz,c)=>{ c.set(0x4a7a32).lerp(_gwC2.set(0x7aa046),clamp((py-top.y+1.5)/2.2)).multiplyScalar(0.85+0.3*h3(Math.round(px*2),Math.round(pz*2),seed)); }));
  for(let k=0;k<3;k++) C.out.push(pc(new THREE.SphereGeometry(0.22*s,6,5).translate(top.x+Math.sin(k*2.1)*0.35,top.y-0.35,top.z+Math.cos(k*2.1)*0.35),c=>c.set(0x7a4a24)));
}
// where a palm may stand in the gaps: off every home, place, road and the water
function gwGap(x,z,r){ const G=GLASSWELL;
  if(Math.hypot(x,z)<26||Math.hypot(x,z)>G.r-4||gwInLake(x,z,r+2)||gwPolyD(x,z,gwRiver().rin)[0]<r+4) return false;
  if(G.roads.some(R=>gwPolyD(x,z,R.pts)[0]<R.w/2+r)) return false;
  if(G.places.some(p=>p.w&&Math.hypot(x-p.x,z-p.z)<Math.max(p.w,p.d)/2+r)) return false;
  return !G.homes.some(h=>Math.hypot(x-h[0],z-h[1])<Math.max(h[2],h[3])/2+r); }
function gwProps(C){
  const G=GLASSWELL, lk=G.lake; let n=0;
  for(let k=0;k<26;k++){ const a=TAU*k/26+0.2, x=lk.x+Math.cos(a)*(lk.rx+4), z=lk.z+Math.sin(a)*(lk.rz+4); if(Math.hypot(x,z)<G.r-5&&!(x>-38&&z>-2&&z<20)&&gwGap(x,z,0.5)) gwPalm(C,x,z,n++); }
  for(let a=0;a<6;a++){ const x=G.well[0]+Math.cos(a)*12.8, z=G.well[1]+Math.sin(a)*12.8; if(gwGap(x,z,0.5)) gwPalm(C,x,z,n++,0.9); }
  for(const p of G.places) if(p.id.startsWith('inn')) for(const [lx,lz] of [[-4.6,-3.6],[4.6,-3.6],[-4.6,3.8],[4.6,3.8]]){ const c=Math.cos(p.rot), s=Math.sin(p.rot); gwPalm(C,p.x+lx*c+lz*s,p.z-lx*s+lz*c,n++,0.8); }
  const rng=mulberry32(77); for(let t=0,got=0;t<900&&got<34;t++){ const x=(rng()-0.5)*150, z=(rng()-0.5)*150; if(gwGap(x,z,3.4)){ gwPalm(C,x,z,n++,0.85+rng()*0.3); got++; } }
  // three jetties on the lake's east shore, a boat at the end of each
  for(let k=0;k<3;k++){ const z=2+k*8, x0=lk.x+lk.rx-3, {A}=gwF(C,frameM(x0,0,z,0)), wood=woodC(0x6a4630);
    for(let b=0;b<9;b++) A(vbox(1.0,0.12,1.7,-b*1.0-0.5,0.32,0),c=>c.set(b&1?0x8a6a44:0x7a5a38));
    for(let b=0;b<4;b++) for(const sz of [-1,1]) A(cyl(0.12,0.14,1.7,6).translate(-b*2.2-0.4,-0.4,sz*0.8),wood);
    A(cyl(0.14,0.16,0.5,6).translate(-9.0,0.5,0.6),wood);
    const {A:B,R}=gwF(C,frameM(lk.x+lk.rx-16,0,z+3.5,Math.PI/2));   // a dhow: a long hull, a mast and a slanted sail
    B(new THREE.SphereGeometry(1,10,6,0,TAU,Math.PI/2,Math.PI/2).scale(0.95,0.75,3.0).translate(0,0.05,0),woodC(0x8a5a34)); B(vbox(1.7,0.08,5.6,0,0.12,0),woodC(0x6a4630));
    B(cyl(0.05,0.07,4.2,6).translate(0,2.1,0),wood); B(vbox(0.04,2.6,2.8,0,2.6,0.8).rotateX(0.35),c=>c.set(0xeee4cc)); }
}
