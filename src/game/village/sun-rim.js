//@ Glasswell's Bowl, drawn: the red-rock rim with its gate cracks, the floor with its roads and paving, the Mirror Lake and the river with their curbs, bridges, the gate towers and the Weir
/* GLASSWELL (shared/sunscar.js, sunscar-shape.js) is in the city's own frame: metres from the Old Citadel, y up from the floor. The builders here push painted geometry
   into C, made by buildGlasswell (buildings-sun.js): C.out the walls (vertex colours), C.win dark windows, C.glass black glass, C.leaf palm leaves, C.water water.
   The rim and the floor (C.land: gwRim, gwFloor) are a mesh of their own: until the Sunscar's heightmap carries the Bowl (gwRimH) the model brings its own ground, and then it can leave it out. */
const _gwC=new THREE.Color(), _gwC2=new THREE.Color();
const gwF=(C,F)=>({A:(g,fn)=>C.out.push(pc(g,fn).applyMatrix4(F)), W:(g,col)=>C.win.push(pc(g,c=>c.set(col||0x2e3944)).applyMatrix4(F)), R:g=>C.out.push(g.applyMatrix4(F))});   // A paints, W a dark window, R takes geometry that is already painted   // geometry into the city, placed by a frame
const gwStone=(base,k)=>(x,y,z,c)=>{ k=k||0.2; c.set(base).multiplyScalar(1-k/2+k*h3(Math.floor(x*2.5),Math.floor(y*2.5),Math.floor(z*2.5))); };   // dressed blocks, each a little different
const gwCourses=base=>(x,y,z,c)=>{ c.set(base).multiplyScalar(0.9+0.1*((Math.floor(y*1.6)+Math.floor((x+z)*0.7))&1)+h3(Math.floor(x*2),Math.floor(y*2),Math.floor(z*2))*0.1); };   // masonry laid in courses
// a wall of dressed stone: a box cut into courses of about `course` m, alternate courses a shade apart (vertex colours show nothing on a bare big face); rag > 0 roughens the top (a ruin)
function gwWall(w,h,d,base,course,rag,seed){
  const rows=Math.max(1,Math.round(h/course)), cols=Math.max(1,Math.round(w/(course*1.5))), segy=h/rows, segx=w/cols, g=new THREE.BoxGeometry(w,h,d,cols,rows,1).translate(0,h/2,0);
  if(rag){ const p=g.attributes.position; for(let i=0;i<p.count;i++) if(p.getY(i)>h-0.01) p.setY(i,h-rag*h3(Math.round(p.getX(i)*9),seed||1,Math.round(p.getZ(i)*9))); g.computeVertexNormals(); }
  return pc(g,(x,y,z,c)=>{ const r=Math.round(y/segy), q=Math.round((x+w/2)/segx); c.set(base).multiplyScalar(0.8+0.17*((r+q)&1)+0.1*h3(r,q,Math.round(z*2))); });   // ashlar: blocks in a checker, each a little different
}
const gwRot=(tx,tz)=>Math.atan2(-tz,tx);   // the frame angle that turns a box's long side (local x) along the tangent (tx,tz)
function gwPolyD(x,z,pts){ let m=1e9,bx=0,bz=0; for(let i=0;i<pts.length-1;i++){ const a=pts[i],b=pts[i+1],dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz||1,t=clamp(((x-a[0])*dx+(z-a[1])*dz)/l2),px=a[0]+dx*t,pz=a[1]+dz*t,d=Math.hypot(x-px,z-pz); if(d<m){ m=d; bx=px; bz=pz; } } return [m,bx,bz]; }
// a smooth curve through points (Catmull-Rom), a sample about every `step` metres
function gwSpline(pts,step){ const out=[];
  for(let i=0;i<pts.length-1;i++){ const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)], n=Math.max(2,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
    for(let k=0;k<n;k++){ const t=k/n, t2=t*t, t3=t2*t, f=(a,b,c,d)=>0.5*(2*b+(c-a)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3); out.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]); } }
  out.push(pts[pts.length-1].slice()); return out; }
let GW_RV=null, GW_LN=null;
function gwRiver(){ if(GW_RV) return GW_RV; const G=GLASSWELL, lk=G.lake;   // in from the River Gate to the lake's middle, and from the lake out by the Weir
  return GW_RV={rin:gwSpline(G.river.concat([[lk.x,lk.z-lk.rz*0.4]]),1.5),rout:gwSpline([[lk.x-10,lk.z+6]].concat(G.riverOut),1.5)}; }
const gwInLake=(x,z,m)=>{ const k=GLASSWELL.lake; return ((x-k.x)/(k.rx+m))**2+((z-k.z)/(k.rz+m))**2<1; };
function gwWaterAt(x,z,m){ if(gwInLake(x,z,m)) return true; const R=gwRiver(); return gwPolyD(x,z,R.rin)[0]<2.5+m||gwPolyD(x,z,R.rout)[0]<2.5+m; }
// the lanes from every door to the nearest road, painted on the floor (like the village's door paths)
function gwLanes(){ if(GW_LN) return GW_LN; const G=GLASSWELL; GW_LN=[];
  const door=(x,z,d,rot,hw)=>{ const dx=x-(d/2+0.3)*Math.sin(rot), dz=z-(d/2+0.3)*Math.cos(rot); let best=[1e9,0,0]; for(const R of G.roads){ const q=gwPolyD(dx,dz,R.pts); if(q[0]<best[0]) best=q; } if(best[0]<17) GW_LN.push([dx,dz,best[1],best[2],hw]); };
  for(const h of G.homes) door(h[0],h[1],h[3],h[4],1.0);
  for(const p of G.places) if(p.w&&p.cat!=='res') door(p.x,p.z,p.d,p.rot,1.4);
  return GW_LN; }
const gwSegD=(x,z,s)=>{ const dx=s[2]-s[0], dz=s[3]-s[1], l2=dx*dx+dz*dz||1, t=clamp(((x-s[0])*dx+(z-s[1])*dz)/l2); return Math.hypot(x-s[0]-dx*t,z-s[1]-dz*t); };
// the colour of the floor at (x,z): packed sand, the roads, the lanes, the paved courts. A pure function of the city's frame, so the heightmap's colours can use it later
function gwGround(x,z,c){
  const G=GLASSWELL, n=noise2(x*0.18,z*0.18)*0.5+noise2(x*0.7+9,z*0.7)*0.25;
  c.set(0xbf9f64).multiplyScalar(0.95+n*0.12);
  for(const R of G.roads){ const d=gwPolyD(x,z,R.pts)[0]; if(d<R.w/2+0.9) c.lerp(_gwC2.set(0xdcc590).multiplyScalar(0.96+n*0.08),smoothstep(R.w/2+0.9,R.w/2-0.5,d)); }
  for(const L of gwLanes()){ const d=gwSegD(x,z,L); if(d<L[4]+0.7) c.lerp(_gwC2.set(0xd6c08a),smoothstep(L[4]+0.7,L[4]*0.5,d)); }
  const pave=(cx,cz,r,col,cell)=>{ const d=Math.hypot(x-cx,z-cz); if(d<r+1.2) c.lerp(_gwC2.set(col).multiplyScalar(0.95+0.06*((Math.floor(x/cell)+Math.floor(z/cell))&1)),smoothstep(r+1.2,r-0.4,d)); };
  pave(G.well[0],G.well[1],10,0xc4b088,1.6); pave(G.tele.x,G.tele.z,6.4,0xc4b088,1.4); pave(0,0,15.5,0xbba884,1.8);
}
// ---- the rim: rings of vertices from the inner foot over the crest to the skirt and the plateau's apron, flat-shaded and painted by strata ----
function gwRim(C){
  const G=GLASSWELL, NA=480, TT=[0.06,0.14,0.24,0.36,0.5,0.64,0.78,0.9,1], UU=[0.15,0.3,0.45,0.6,0.75,0.9,1], gs=gwGateList().map(g=>({sa:Math.sin(g.a),ca:Math.cos(g.a),hw:g.hw,road:!g.weir}));
  const st=[a=>gwRimR(a,'foot')]; for(const t of TT) st.push(a=>lerp(gwRimR(a,'foot'),gwRimR(a,'crest'),t)); for(const u of UU) st.push(a=>lerp(gwRimR(a,'crest'),gwRimR(a,'skirt'),u)); for(const d of [8,16,26,38,52]) st.push(a=>gwRimR(a,'skirt')+d);
  const NR=st.length, V=[];
  for(let i=0;i<=NA;i++){ const a=TAU*i/NA, col=[]; for(let j=0;j<NR;j++){ let r=st[j](a), x=Math.sin(a)*r, z=Math.cos(a)*r; if(j>0&&j<TT.length+UU.length) { r+=noise2(x*0.17,z*0.17)*0.5; x=Math.sin(a)*r; z=Math.cos(a)*r; } col.push([x,gwRimH(x,z),z]); } col.push([col[NR-1][0],-26,col[NR-1][2]]); V.push(col); }   // the last row falls to a base: the model's own edge
  const P=[], tri=(a,b,c)=>P.push(...a,...b,...c);
  for(let i=0;i<NA;i++) for(let j=0;j<NR;j++){ const A=V[i][j], B=V[i+1][j], Cc=V[i][j+1], D=V[i+1][j+1]; tri(A,Cc,B); tri(B,Cc,D); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.computeVertexNormals();
  C.land.push(paint(g,(x,y,z,nx,ny,nz,c)=>{
    const r=Math.hypot(x,z), n=noise2(x*0.12,z*0.12+y*0.15), flat=smoothstep(0.72,0.9,ny);
    if(y<-0.6){ c.set(0x8f7348); return; }
    c.set(0x9c5a40).multiplyScalar(0.88+0.07*Math.sin(y*1.55+noise2(x*0.04,z*0.04)*4)+0.07*n);                                // red strata
    if(y<4&&r<G.r+14) c.lerp(_gwC2.set(0x84533c),0.5);                                                                       // scree at the foot
    c.lerp(_gwC2.set(0xd2a868).multiplyScalar(0.94+0.1*noise2(x*0.05,z*0.05)),flat*0.9);                                    // sand on ledges and the plateau
    for(const q of gs) if(q.road&&x*q.sa+z*q.ca>0&&Math.abs(x*q.ca-z*q.sa)<q.hw+0.8&&ny>0.85) c.lerp(_gwC2.set(0xdcc590),0.8);   // the roads in the cracks
  }));
}
// ---- the floor: a grid with holes for the lake and the river, vertices clamped to the foot of the rim ----
function gwFloor(C){
  const G=GLASSWELL, ST=1.6, N=Math.ceil(2*(G.r+6)/ST), x0=-N*ST/2, W1=N+1, vx=new Float32Array(W1*W1), vz=new Float32Array(W1*W1), co=new Float32Array(W1*W1*3), off=new Uint8Array(W1*W1);
  for(let j=0;j<=N;j++) for(let i=0;i<=N;i++){ let x=x0+i*ST, z=x0+j*ST; const r=Math.hypot(x,z), fr=gwRimR(Math.atan2(x,z),'foot')-0.03, k=j*W1+i; if(r>fr){ off[k]=1; x*=fr/r; z*=fr/r; }
    vx[k]=x; vz[k]=z; gwGround(x,z,_gwC); co[k*3]=_gwC.r; co[k*3+1]=_gwC.g; co[k*3+2]=_gwC.b; }
  const P=[],Nn=[],Co=[], put=(k)=>{ P.push(vx[k],0,vz[k]); Nn.push(0,1,0); Co.push(co[k*3],co[k*3+1],co[k*3+2]); };
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const a=j*W1+i, b=a+1, c=a+W1, d=c+1; if(off[a]&&off[b]&&off[c]&&off[d]) continue;
    if(gwWaterAt(x0+(i+0.5)*ST,x0+(j+0.5)*ST,0.5)&&Math.hypot(x0+(i+0.5)*ST,x0+(j+0.5)*ST)<G.r) continue;
    put(a); put(c); put(b); put(b); put(c); put(d); }
  C.land.push(mkGeo(P,Nn,Co));
}
// ---- water: the lake and the river under the floor's holes, curbs of dressed stone round them; outside the rim the river runs on the cracks' floors ----
function gwWaterY(x,z,weir){ const G=GLASSWELL; if(Math.hypot(x,z)<gwRimR(Math.atan2(x,z),'foot')) return -0.35; const k=smoothstep(G.r,G.foot,Math.hypot(x,z)); return (weir?-6*k:G.skirtH*k)+0.07; }
function gwWater(C){
  const G=GLASSWELL, lk=G.lake, R=gwRiver(), P=[],Nn=[],Co=[], deep=new THREE.Color(0x16707f), shallow=new THREE.Color(0x3a9fa6);
  const q=(x,y,z,t)=>{ P.push(x,y,z); Nn.push(0,1,0); _gwC.copy(deep).lerp(shallow,t); Co.push(_gwC.r,_gwC.g,_gwC.b); };
  const NS=64; for(let k=0;k<NS;k++){ const a0=TAU*k/NS, a1=TAU*(k+1)/NS, e=(a,s)=>[lk.x+Math.cos(a)*(lk.rx+1.3)*s,lk.z+Math.sin(a)*(lk.rz+1.3)*s];
    for(const [pa,pb,pc] of [[[lk.x,lk.z,0],[...e(a1,1),1],[...e(a0,1),1]]]) { q(pa[0],-0.35,pa[1],0); q(pb[0],-0.35,pb[1],pb[2]); q(pc[0],-0.35,pc[1],pc[2]); } }   // the lake: a fan, deep in the middle
  for(const [pts,weir] of [[R.rin,false],[R.rout,true]]) for(let i=0;i<pts.length-1;i++){
    const a=pts[i], b=pts[i+1], tx=b[0]-a[0], tz=b[1]-a[1], l=Math.hypot(tx,tz)||1, nx=-tz/l*2.8, nz=tx/l*2.8, ya=gwWaterY(a[0],a[1],weir), yb=gwWaterY(b[0],b[1],weir);
    if(Math.hypot(a[0],a[1])>G.foot+30) continue;
    q(a[0]+nx,ya,a[1]+nz,0.5); q(b[0]+nx,yb,b[1]+nz,0.5); q(a[0]-nx,ya,a[1]-nz,0.5); q(b[0]+nx,yb,b[1]+nz,0.5); q(b[0]-nx,yb,b[1]-nz,0.5); q(a[0]-nx,ya,a[1]-nz,0.5); }   // (wound so both triangles face up)
  C.water.push(mkGeo(P,Nn,Co));
  const curb=(x,z,rot,len)=>C.out.push(pc(vbox(len,0.95,0.7,0,-0.07,0),gwStone(0xc2aa7c,0.25)).applyMatrix4(frameM(x,0,z,rot)));
  for(let k=0;k<56;k++){ const a=TAU*k/56, a2=TAU*(k+1)/56, x=lk.x+Math.cos(a)*(lk.rx+0.6), z=lk.z+Math.sin(a)*(lk.rz+0.6), x2=lk.x+Math.cos(a2)*(lk.rx+0.6), z2=lk.z+Math.sin(a2)*(lk.rz+0.6); curb((x+x2)/2,(z+z2)/2,gwRot(x2-x,z2-z),Math.hypot(x2-x,z2-z)+0.15); }
  for(const pts of [R.rin,R.rout]) for(let i=2;i<pts.length-2;i+=1){ const a=pts[i], b=pts[i+1]; if(Math.hypot(a[0],a[1])>G.r-1||gwInLake(a[0],a[1],1.5)) continue; const tx=b[0]-a[0], tz=b[1]-a[1], l=Math.hypot(tx,tz)||1;
    for(const sd of [-1,1]) curb(a[0]-tz/l*sd*3.0,a[1]+tx/l*sd*3.0,gwRot(tx,tz),l+0.15); }
}
// ---- the footbridges over the river ----
function gwBridges(C){
  for(const [x,z,ba,len,w] of GLASSWELL.bridges){ const {A}=gwF(C,frameM(x,0,z,ba)), stone=gwStone(0xc4ad82,0.22), N=8, sl=len/N;
    for(let k=0;k<N;k++){ const t0=-len/2+k*sl, t1=t0+sl, h0=0.5+0.95*Math.sin(Math.PI*(t0+len/2)/len), h1=0.5+0.95*Math.sin(Math.PI*(t1+len/2)/len), my=(h0+h1)/2, an=Math.atan2(h1-h0,sl), L=Math.hypot(sl,h1-h0)+0.06;   // the deck rises to the middle and falls again
      A(vbox(w,0.4,L,0,0,0).rotateX(-an).translate(0,my-0.2,(t0+t1)/2),stone);
      for(const sd of [-1,1]) A(vbox(0.5,0.75,L,0,0,0).rotateX(-an).translate(sd*(w/2-0.1),my+0.3,(t0+t1)/2),stone); }
    for(const sd of [-1,1]) A(vbox(w+0.2,1.7,1.2,0,0.1,sd*(len/2-0.3)),stone); }   // an abutment at each end
}
// ---- a gate: a masonry wall built into the crack with a pointed arch, two crenellated towers with pyramid roofs, the doors standing open ----
function gwGate(C,g){
  const G=GLASSWELL, r=G.r+8, {A,W}=gwF(C,frameM(Math.sin(g.a)*r,gwCrackY(r,g),Math.cos(g.a)*r,g.a)), hw=g.hw, W2=hw+4.5, wood=woodC(0x3a2616), tile=c=>c.set(0x2c4a8c), gold=c=>c.set(0xd9a032);
  const sh=new THREE.Shape(); sh.moveTo(-W2,-1.5); sh.lineTo(W2,-1.5); sh.lineTo(W2,10); sh.lineTo(-W2,10); sh.lineTo(-W2,-1.5);
  const op=new THREE.Path(); op.moveTo(-4.5,0); op.lineTo(-4.5,5.2); op.quadraticCurveTo(-4.5,7.9,0,8.8); op.quadraticCurveTo(4.5,7.9,4.5,5.2); op.lineTo(4.5,0); op.lineTo(-4.5,0); sh.holes.push(op);
  A(new THREE.ExtrudeGeometry(sh,{depth:3.2,bevelEnabled:false,curveSegments:8}).translate(0,0,-1.6),gwCourses(0xc09a62));
  for(let k=-4;k<=4;k++) A(vbox(1.1,1.2,3.4,k*2.4,10.6,0),gwStone(0xc09a62));   // merlons along the wall's top
  for(const sd of [-1,1]){
    const tx=sd*(hw+1.2);
    A(vbox(4.6,17,4.6,tx,8.5,0),gwCourses(0xc09a62));
    for(let k=-2;k<=2;k++) for(const e of [-1,1]){ A(vbox(0.9,1.1,0.9,tx+k*1.05,17.55,e*2.2),gwStone(0xc09a62)); if(Math.abs(k)<2) A(vbox(0.9,1.1,0.9,tx+e*2.2,17.55,k*1.05),gwStone(0xc09a62)); }
    A(new THREE.ConeGeometry(3.3,4.4,4).rotateY(Math.PI/4).translate(tx,19.6,0),tile); A(cyl(0.06,0.06,2.4,5).translate(tx,22.6,0),c=>c.set(0x3a2616)); A(vbox(0.05,1.5,1.1,tx,22.0,0.55),gold);   // roof, mast and pennant
    for(const e of [-1,1]){ W(vbox(0.3,1.7,0.2,tx,12.5,e*2.35)); W(vbox(0.3,1.7,0.2,tx,7.5,e*2.35)); }
    A(vbox(0.35,5.4,3.5,sd*4.25,2.7,2.7).rotateY(0),wood); A(cyl(0.12,0.12,5.6,5).translate(sd*4.2,2.8,1.0),c=>c.set(0x2a2a30));   // the open door leaf, and its hinge post
    for(let k=0;k<5;k++) A(cyl(0.1,0.1,0.1,5).rotateZ(Math.PI/2).translate(sd*4.45,1.0+k*0.9,2.7),c=>c.set(0x2a2a30));
    A(vbox(0.18,5,0.5,sd*(W2-0.4),2.5,-1.9),gwStone(0xc09a62)); }
  for(const sd of [-1,1]) for(const dz of [-3.2,3.2]){ A(cyl(0.07,0.09,2.1,6).translate(sd*5.6,1.05,dz),c=>c.set(0x2a2a30)); A(cyl(0.34,0.2,0.28,8).translate(sd*5.6,2.15,dz),c=>c.set(0x2a2a30)); const m=new THREE.Mesh(new THREE.ConeGeometry(0.17,0.5,7),flameMats[1]); m.position.set(sd*5.6,2.5,dz); m.position.applyMatrix4(frameM(Math.sin(g.a)*r,gwCrackY(r,g),Math.cos(g.a)*r,g.a)); C.root.add(m); flames.push(m); }   // braziers
}
// ---- the Weir: a lock across the river's gorge: stone piers, a raised grille, a walkway on top ----
function gwWeir(C){
  const G=GLASSWELL, a=G.weir.a, r=G.r+3, {A,W}=gwF(C,frameM(Math.sin(a)*r,0,Math.cos(a)*r,a)), stone=gwCourses(0xc09a64), iron=c=>c.set(0x2a2a30);
  for(const sd of [-1,1]){ A(vbox(2.6,7,6,sd*3.5,3.5,0),stone); for(let k=0;k<3;k++) A(vbox(0.9,1.1,0.9,sd*3.5+(k-1)*0.9,7.55,2.4),stone); }
  A(vbox(9.6,1.2,6,0,6.4,0),stone);
  for(let k=-4;k<=4;k++) A(cyl(0.05,0.05,3.8,5).translate(k*0.4,4.3,1.2),iron); A(vbox(3.8,0.1,0.1,0,3.4,1.2),iron); A(vbox(3.8,0.1,0.1,0,5.0,1.2),iron);   // the raised grille
  W(vbox(0.5,1.6,0.2,-3.5,4.5,3.05));
}
