//@ The four dungeon doors and their signposts: the Hollowed Elder (a half-dead giant tree with a root-arch door), the Falls Door (a cascade over three ledges, the door behind the water), the Barrow Door (a snow-covered mound with a trilithon) and the Old Adit (a timbered mine mouth in a crag, a head frame above)
/* Agent map (docs/DUNGEON-THEMES.md section 6; the rules, prompt, maps and ground patch are game/dungeon/entrances.js; test tools/entrances-client-smoke.js).
   Each door is one THREE.Group at the door (x, ground height, z) turned by DG_ENTRANCES[..].a, so in the group's own frame +z is OUT of the door (toward the apron) and the bank is at -z.
   Props that stand on the ground take their height from getH at their own spot (S.gy), never from the door's: the ground falls 1-3 m in front of two of the doors.
   Per door: a few merged meshes (villageMat: solids, dgEntMat2: open shells, a Basic "glow" mesh that is not lit) and a handful of animated extras. The group's state is in DG_DOORS.doors[id].
   dgEntBuild() builds all four plus the signposts (once, from generation-setup.js); dgEntUpdate(dt) every frame (main/loop.js): sealed or open follows your gear (dgGateOpen), animation only on the desktop.
   Phones (LOW) get fewer details and no animation; light mode (LITE) the bare shapes. Nothing here changes the terrain's height. */
const dgEntDet=LITE?0:LOW?1:2;   // 2 desktop, 1 phone (fewer details, nothing moves), 0 light mode (the bare shapes)
const DG_ENT_VIS=420;            // a door's group is hidden beyond this (the fog ends at about 230 m; the Elder's crown and the Barrow's column are what show from afar)
const dgEntMat2=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});   // open shells seen from both sides (a hollow trunk)
const dgEntC=new THREE.Color(), dgEntC2=new THREE.Color();
let dgEntSpr=null;
function dgEntSprite(){   // a soft round puff (mist, fireflies)
  if(!dgEntSpr){ const c=document.createElement('canvas'); c.width=c.height=32; const g=c.getContext('2d'), r=g.createRadialGradient(16,16,0,16,16,16);
    r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(0.45,'rgba(255,255,255,.45)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=r; g.fillRect(0,0,32,32); dgEntSpr=new THREE.CanvasTexture(c); }
  return dgEntSpr;
}
const dgEntFlat=hex=>(x,y,z,nx,ny,nz,c)=>{ c.set(hex); };
const dgEntWood=hex=>(x,y,z,nx,ny,nz,c)=>{ c.set(hex).multiplyScalar(0.84+h3(x,y,z)*0.3); };   // (woodC is made for pc, which calls with 4 arguments; paint calls with 7)

/* ---- shapes ---- */
// a craggy block: a subdivided box whose points are pushed about (the same push for the same place, so it stays closed), flat shaded
function dgEntRock(w,h,d,x,y,z,amp,fn,ry,rz){
  const g=new THREE.BoxGeometry(w,h,d,2,2,2), p=g.attributes.position;
  for(let i=0;i<p.count;i++){ const px=p.getX(i), py=p.getY(i), pz=p.getZ(i);
    p.setXYZ(i,px+(h3(px*2.3+x,py*2.3,pz*2.3)-0.5)*amp,py+(h3(px*2.3,py*2.3+y,pz*2.3+1)-0.5)*amp*0.7,pz+(h3(px*2.3+2,py*2.3,pz*2.3+z)-0.5)*amp); }
  if(rz) g.rotateZ(rz); if(ry) g.rotateY(ry); g.translate(x,y,z); const n=g.toNonIndexed(); n.computeVertexNormals(); return paint(n,fn);
}
// a tapered tube along a Catmull-Rom curve through [x,y,z] points: radius r0 at the start, r1 at the end
function dgEntTube(pts,r0,r1,seg,rad,fn){
  const curve=new THREE.CatmullRomCurve3(pts.map(q=>new THREE.Vector3(q[0],q[1],q[2]))), g=new THREE.TubeGeometry(curve,seg,1,rad,false), pos=g.attributes.position, ring=rad+1, c=new THREE.Vector3(), v=new THREE.Vector3();
  for(let i=0;i<pos.count;i++){ const j=Math.floor(i/ring)/seg; curve.getPointAt(j,c); v.fromBufferAttribute(pos,i).sub(c).multiplyScalar(r0+(r1-r0)*j).add(c); pos.setXYZ(i,v.x,v.y,v.z); }
  return paint(g,fn);
}
// the upper half of a lumpy ellipsoid centred at (cx, cy, cz), with smooth normals of its own (a mound, a snowdrift)
function dgEntDome(rx,ry,rz,cx,cy,cz,nw,nh,lump,fn){
  const g=new THREE.SphereGeometry(1,nw,nh,0,TAU,0,Math.PI/2), p=g.attributes.position, nr=g.attributes.normal;
  for(let i=0;i<p.count;i++){ const ux=p.getX(i), uy=p.getY(i), uz=p.getZ(i), k=1+lump*(noise2(ux*1.7+cx,uz*1.7+cz+uy)*0.7+h3(ux*5+cx,uy*5,uz*5)*0.3-0.15);
    const x=ux*rx*k, y=uy*ry*k, z=uz*rz*k, a=x/(rx*rx), b=y/(ry*ry), c=z/(rz*rz), l=Math.hypot(a,b,c)||1; p.setXYZ(i,x+cx,y+cy,z+cz); nr.setXYZ(i,a/l,b/l,c/l); }
  return paint(g,fn);
}
// a grid of points fn(u,v) -> [x,y,z], u across nu columns and v up nv rows (wrap: the last column is the first again), with smooth normals by central differences, pointing away from `from`
function dgEntGrid(nu,nv,wrap,fn,from){
  const P=[]; for(let j=0;j<=nv;j++) for(let i=0;i<=nu;i++) P.push(fn(i/nu,j/nv));
  const id=(i,j)=>j*(nu+1)+i, pos=[], nor=[], idx=[];
  for(let j=0;j<=nv;j++) for(let i=0;i<=nu;i++){
    const a=P[id(wrap?(i-1+nu)%nu:Math.max(i-1,0),j)], b=P[id(wrap?(i+1)%nu:Math.min(i+1,nu),j)], c=P[id(i,Math.max(j-1,0))], d=P[id(i,Math.min(j+1,nv))], q=P[id(i,j)];
    const ux=b[0]-a[0], uy=b[1]-a[1], uz=b[2]-a[2], vx=d[0]-c[0], vy=d[1]-c[1], vz=d[2]-c[2];
    let nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx; const l=Math.hypot(nx,ny,nz)||1; nx/=l; ny/=l; nz/=l;
    if(nx*(q[0]-from[0])+ny*(q[1]-from[1])+nz*(q[2]-from[2])<0){ nx=-nx; ny=-ny; nz=-nz; }
    pos.push(q[0],q[1],q[2]); nor.push(nx,ny,nz); }
  // wind each quad so its face points the way the normals do
  let flip=false; { const q0=P[id(0,0)], q1=P[id(1,0)], q2=P[id(0,1)], gx=(q1[1]-q0[1])*(q2[2]-q0[2])-(q1[2]-q0[2])*(q2[1]-q0[1]), gy=(q1[2]-q0[2])*(q2[0]-q0[0])-(q1[0]-q0[0])*(q2[2]-q0[2]), gz=(q1[0]-q0[0])*(q2[1]-q0[1])-(q1[1]-q0[1])*(q2[0]-q0[0]); flip=gx*nor[0]+gy*nor[1]+gz*nor[2]<0; }
  for(let j=0;j<nv;j++) for(let i=0;i<nu;i++){ const a=id(i,j), b=id(i+1,j), c=id(i,j+1), d=id(i+1,j+1); if(flip) idx.push(a,c,b,b,c,d); else idx.push(a,b,c,b,d,c); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); g.setIndex(idx); return g;
}
function dgEntPoints(n,size,hex,op,vcol){   // a cloud of soft puffs; the caller moves them (pos, and col when vcol)
  const pos=new Float32Array(n*3), g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  let col=null; if(vcol){ col=new Float32Array(n*3); g.setAttribute('color',new THREE.BufferAttribute(col,3)); }
  const p=new THREE.Points(g,new THREE.PointsMaterial({size,map:dgEntSprite(),color:hex,vertexColors:!!vcol,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:op}));
  p.frustumCulled=false; return {pts:p,pos,col,n};
}
// a stone lantern as the Vale builds them (buildings-vale.js): a base, a stem, a lit box, a roof
function dgEntLantern(S,lx,lz,s){
  const gy=S.gy(lx,lz), stone=(x,y,z,nx,ny,nz,c)=>{ c.set(0xcfcbc0).multiplyScalar(0.78+h3(Math.floor(x*3),Math.floor(y*3),Math.floor(z*3))*0.2); };
  S.main.push(paint(cyl(0.34*s,0.4*s,0.16*s,6).translate(lx,gy+0.08*s,lz),stone),paint(cyl(0.1*s,0.13*s,0.8*s,8).translate(lx,gy+0.56*s,lz),stone),
    paint(new THREE.ConeGeometry(0.44*s,0.3*s,6).translate(lx,gy+1.56*s,lz),stone));
  S.glow.push(paint(vbox(0.34*s,0.34*s,0.34*s,lx,gy+1.24*s,lz),dgEntFlat(0xf6e0b0)));
  S.foot(lx,lz,gy); S.col(lx,lz,0.35);
}

/* ---- one door: the frame every builder starts from and ends with ---- */
function dgEntBegin(E){
  const y0=getH(E.x,E.z), G=new THREE.Group(), ca=Math.cos(E.a), sa=Math.sin(E.a);
  G.position.set(E.x,y0,E.z); G.rotation.y=E.a; G.name='dg-door-'+E.theme;
  const S={E,G,y0,main:[],two:[],glow:[],feet:[],cols:[],
    wx:(lx,lz)=>E.x+lx*ca+lz*sa, wz:(lx,lz)=>E.z-lx*sa+lz*ca,                            // the group's own (x, z) -> the world's
    gy:(lx,lz)=>getH(E.x+lx*ca+lz*sa,E.z-lx*sa+lz*ca)-y0};                                // the ground's height there, from the door's
  S.col=(lx,lz,r)=>{ const x=S.wx(lx,lz), z=S.wz(lx,lz); addCol(x,z,r); S.cols.push([x,z,r]); };   // (a collider must stay within 6 m: the grid looks one cell round you)
  S.foot=(lx,lz,ly)=>{ S.feet.push([S.wx(lx,lz),y0+ly,S.wz(lx,lz)]); };                   // where a prop's base stands: the test checks it against the ground
  S.glowMat=new THREE.MeshBasicMaterial({vertexColors:true});
  return S;
}
function dgEntEnd(S,extra){
  const add=(list,mat,shadow)=>{ if(!list.length) return null; const m=new THREE.Mesh(merge(list),mat); m.castShadow=shadow; m.receiveShadow=shadow; S.G.add(m); return m; };
  add(S.main,villageMat,true); add(S.two,dgEntMat2,true); add(S.glow,S.glowMat,false);
  scene.add(S.G);
  let tris=0, meshes=0; S.G.traverse(o=>{ if(o.isMesh||o.isPoints){ meshes++; const g=o.geometry; tris+=(g.index?g.index.count:g.attributes.position.count)/3; } });
  DG_DOORS.doors[S.E.theme]=Object.assign({E:S.E,G:S.G,y0:S.y0,feet:S.feet,cols:S.cols,sealed:null,lit:null,tris:Math.round(tris),meshes},extra);
}

/* ================= 1. The Hollowed Elder ================= */
function dgEntElder(E){
  const S=dgEntBegin(E), {main,two,glow}=S, TX=0, TZ=-2.7, TR=2.7, DW=2.0, DH=4.4, det=dgEntDet;
  const trunkR=y=>y<DH?TR+2.1*Math.exp(-Math.max(y,-0.5)/1.3):TR-0.03*(y-DH)+0.7*Math.exp(-Math.pow((y-9)/3.2,2));   // the trunk's own radius at a height: flared roots, a burl at 9 m
  const wob=(a,y)=>noise2(a*2.1+5,y*0.45)*0.2;
  // bark: brown, bleached grey on the dead left half (-x), moss on the living half, on every upward face and low down
  const bark=(x,y,z,nx,ny,nz,c)=>{
    const a=Math.atan2(x-TX,z-TZ), dead=smoothstep(0.8,-1.2,x), n=noise2(a*3.5,y*0.3)*0.5+0.5, ridge=noise2(a*8+y*0.15,y*0.12)*0.5+0.5;
    c.set(0x7a634c).lerp(dgEntC.set(0xaaa290),dead*0.8).multiplyScalar(0.62+0.5*(n*0.5+ridge*0.5));
    const moss=clamp(0.75-(y-1)*0.05+ny*0.35+noise2(x*0.7,z*0.7+y*0.4)*0.35-dead*0.8);
    if(moss>0.3) c.lerp(dgEntC.set(0x5a8a34),clamp((moss-0.3)*2.0)*0.85);
  };
  const leaf=(x,y,z,nx,ny,nz,c)=>{ c.set(0x5a9a30).lerp(dgEntC.set(0xd0a838),clamp(0.45+noise2(x*0.5,z*0.5+y*0.3)*0.8)*0.6).multiplyScalar(0.85+0.4*clamp(ny*0.5+0.5)); };
  // the trunk: a lower shell that stops at the doorway's jambs (x = +-2 whatever the flare), an upper one all the way round with a ragged, broken top (higher on the dead side)
  two.push(paint(dgEntGrid(det?16:10,7,false,(u,v)=>{ const y=-2.6+v*(DH+2.6), rb=trunkR(y), tg=Math.asin(Math.min(0.97,DW/rb)), th=tg+u*(TAU-2*tg), r=rb+wob(th,y); return [TX+Math.sin(th)*r,y,TZ+Math.cos(th)*r]; },[TX,0,TZ]),bark));
  const top=th=>19.5+3.2*(noise2(th*1.6+2,1)*0.5+0.5)+(Math.sin(th)<-0.3?3.5*(noise2(th*3,7)*0.5+0.5):0);
  two.push(paint(dgEntGrid(det?18:10,det?11:6,true,(u,v)=>{ const th=u*TAU, y=DH-0.3+v*(top(th)-DH+0.3), r=trunkR(y)+wob(th,y)*1.3; return [TX+Math.sin(th)*r,y,TZ+Math.cos(th)*r]; },[TX,12,TZ]),bark));
  // the doorway: two jambs and a ceiling of bark, the arch roots over it, the glowing void at the back
  for(const sx of [-1,1]) main.push(dgEntRock(0.6,DH+0.4,1.5,sx*(DW+0.1),(DH+0.4)/2-0.2,-0.45,0.15,bark));
  main.push(dgEntRock(DW*2+1.0,0.7,1.5,0,DH+0.1,-0.5,0.15,bark));
  main.push(paint(new THREE.BoxGeometry(DW*2+0.6,0.4,1.7).translate(0,-0.2,-0.3),bark), paint(new THREE.BoxGeometry(DW*2+0.4,0.5,1.5).translate(0,S.gy(0,1.6)-0.2,1.6),bark));   // the sill and a root step down to the ground
  const foot=(x,z)=>S.gy(x,z)-0.45;
  main.push(dgEntTube([[-2.5,foot(-2.5,0.9),0.9],[-2.35,1.4,0.8],[-1.6,3.3,0.7],[0,4.55,0.55],[1.6,3.4,0.6],[2.4,1.5,0.8],[2.55,foot(2.55,1.0),1.0]],0.5,0.5,22,7,bark),
            dgEntTube([[2.3,foot(2.3,0.5),0.4],[2.15,1.6,0.3],[1.2,3.7,0.25],[-0.2,4.3,0.3],[-1.5,3.5,0.35],[-2.3,1.3,0.3],[-2.45,foot(-2.45,0.5),0.5]],0.4,0.36,22,6,bark));
  S.foot(-2.5,0.9,S.gy(-2.5,0.9)); S.foot(2.55,1.0,S.gy(2.55,1.0));
  for(let k=0;k<(det?6:3);k++){ const x=-1.7+k*(3.4/Math.max(1,(det?5:2))); main.push(dgEntTube([[x,4.3,0.55],[x+0.08,3.8,0.5],[x-0.05,3.2+h3(k,1,1)*0.7,0.5]],0.07,0.025,5,4,dgEntFlat(0x5a4632))); }   // rootlets hanging over the opening
  // buttress roots out of the trunk's foot, down into the ground (none across the doorway)
  const nR=det>=2?11:det===1?8:6;
  for(let k=0;k<nR;k++){ const th=0.85+k*(TAU-1.7)/(nR-1)+(h3(k,3,1)-0.5)*0.15, sn=Math.sin(th), cs=Math.cos(th), len=2.1+h3(k,1,2)*2.4, pts=[];
    [[2.1,2.7],[3.1,1.5],[4.2,0.5],[len+3.3,-0.3]].forEach(([d,hh],i)=>{ const w=(h3(k,i,5)-0.5)*0.9, x=TX+sn*d+cs*w, z=TZ+cs*d-sn*w; pts.push([x,S.gy(x,z)+hh,z]); });
    main.push(dgEntTube(pts,0.85,0.1,10,6,bark)); }
  // bracket fungi: half discs standing out of the bark
  for(let k=0;k<(det?9:4);k++){ const th=0.9+h3(k,2,2)*(TAU-1.8), y=2.4+h3(k,5,1)*10.5, r=0.55+h3(k,3,3)*0.55, R=trunkR(y)-0.08;
    main.push(paint(new THREE.CylinderGeometry(r,r*0.85,0.14,10,1,false,0,Math.PI).rotateY(th-Math.PI/2).translate(TX+Math.sin(th)*R,y,TZ+Math.cos(th)*R),(x,yy,z,nx,ny,nz,c)=>{ if(ny>0.5) c.set(0xe8c98a).multiplyScalar(0.9+h3(Math.floor(x*4),0,Math.floor(z*4))*0.15); else c.set(0xa86a38); })); }
  // the crown: dead limbs on the left reaching for the sky, two living limbs on the right under clouds of leaves (the top of it all stands 29 m up, over the canopy)
  const limbs=[[-1.2,18.5,5.5,8.5,0.55,0],[-2.3,19.5,6.5,6.5,0.5,0],[-0.5,20.5,3.2,9.0,0.45,0],[1.1,18.0,6.5,7.5,0.7,1],[2.4,17.0,7.0,5.0,0.7,1],[0.2,19.0,4.0,6.0,0.55,1]];
  for(const [th,y0,out,up,r0,live] of limbs){ const sn=Math.sin(th), cs=Math.cos(th), R=trunkR(y0)*0.75, p=(f,g,s)=>[TX+sn*(R+out*f)+cs*s,y0+up*g,TZ+cs*(R+out*f)-sn*s];
    const pts=[p(0,0,0),p(0.35,0.28,0.4),p(0.7,0.62,-0.3),p(1,1,0.2)];
    main.push(dgEntTube(pts,r0,0.05,12,5,live?bark:(x,y,z,nx,ny,nz,c)=>{ c.set(0x8f877a).multiplyScalar(0.75+0.35*(noise2(x*0.8,y*0.6)*0.5+0.5)); }));
    if(live&&det){ const tip=pts[3], C=new THREE.Vector3(tip[0],tip[1],tip[2]); for(let b=0;b<5;b++){ const o=[[0,0,0],[-2.2,-0.8,1.6],[2.0,-1.0,-1.4],[0.4,1.5,0.6],[-1.2,-1.6,-1.8]][b]; main.push(paint(blob(3.0+h3(th,b,1)*1.2,tip[0]+o[0],tip[1]+o[1]+0.8,tip[2]+o[2],0.8,C,1),leaf)); } } }
  // glowing mushrooms in a ring on the apron and a few among the roots (the caps glow: they are not lit)
  const nM=det>=2?15:det===1?7:0, mush=(lx,lz,s,hue)=>{ const y=S.gy(lx,lz); main.push(paint(cyl(0.05*s,0.07*s,0.4*s,6).translate(lx,y+0.2*s,lz),dgEntFlat(0xd8d0b0)));
    glow.push(paint(new THREE.SphereGeometry(0.22*s,8,5,0,TAU,0,Math.PI/2).scale(1,0.7,1).translate(lx,y+0.36*s,lz),dgEntFlat(hue?0xffc060:0x7affb0))); S.foot(lx,lz,y); };
  for(let k=0;k<nM;k++){ const a=k/nM*TAU+h3(k,1,1)*0.3, rr=4.6+(h3(k,2,2)-0.5)*0.8; mush(Math.sin(a)*rr,6.5+Math.cos(a)*rr,0.8+h3(k,4,4)*1.0,k%3===0?1:0); }
  for(let k=0;k<(det>=2?7:0);k++){ const a=1.0+k*0.75, d=3.6+h3(k,6,6)*2.5; mush(Math.sin(a)*d,-2.7+Math.cos(a)*d,0.7+h3(k,7,7)*0.7,k%2); }
  // the way in: the void inside the doorway (amber, dull while sealed) and the knotted roots that seal it
  const voidMat=new THREE.MeshBasicMaterial({color:0xffb040,vertexColors:true}), voidMesh=new THREE.Mesh(paint(new THREE.PlaneGeometry(DW*2-0.1,DH,6,8),(x,y,z,nx,ny,nz,c)=>{ const k=clamp(1-Math.hypot(x/(DW*0.95),(y+DH*0.12)/(DH*0.62))); c.setRGB(0.55+0.45*k,0.4+0.45*k,0.2+0.5*k*k); }),voidMat); voidMesh.position.set(0,DH/2,-1.25); S.G.add(voidMesh);
  const knot=(x,y,z,nx,ny,nz,c)=>{ c.set(0x4a3a2a).multiplyScalar(0.8+0.4*(noise2(x*2,y*2+z)*0.5+0.5)); if(ny>0.2||noise2(x*3+y,z*3)>0.3) c.lerp(dgEntC.set(0x4f7a2e),0.55); };
  const knots=[dgEntTube([[-2.0,-0.1,0.4],[-0.7,1.3,0.5],[0.8,2.7,0.45],[2.0,3.9,0.4]],0.36,0.3,12,6,knot),dgEntTube([[2.0,-0.1,0.45],[0.7,1.2,0.5],[-0.8,2.6,0.4],[-2.0,3.9,0.45]],0.34,0.3,12,6,knot),
    dgEntTube([[-2.1,2.0,0.4],[-0.8,1.55,0.5],[0.9,1.65,0.5],[2.1,2.1,0.4]],0.3,0.3,12,6,knot),dgEntTube([[-2.1,3.6,0.45],[-0.9,3.1,0.5],[0.9,3.2,0.5],[2.1,3.7,0.45]],0.28,0.28,12,6,knot),
    dgEntTube([[-0.7,-0.1,0.55],[-0.9,1.6,0.6],[-0.6,3.0,0.55],[-0.8,4.3,0.5]],0.3,0.26,12,6,knot),dgEntTube([[0.8,-0.1,0.55],[1.0,1.5,0.6],[0.7,3.0,0.55],[0.9,4.3,0.5]],0.3,0.26,12,6,knot),
    paint(new THREE.SphereGeometry(0.6,8,6).scale(1,0.8,0.9).translate(0,2.0,0.55),knot),paint(new THREE.SphereGeometry(0.5,8,6).translate(-1.1,1.0,0.5),knot)];
  const seal=new THREE.Mesh(merge(knots),villageMat); seal.castShadow=true; S.G.add(seal);
  // fireflies drifting over the apron
  const mo=det>=2?dgEntPoints(18,0.5,0xcff08a,0.9,false):null; if(mo) S.G.add(mo.pts);
  // the trunk is a wall, the door a room's width: colliders (the player stops in front of the doorway, well within the talk range)
  S.col(0,-2.7,3.3); S.col(-3.3,-1.0,1.3); S.col(3.3,-1.0,1.3); S.col(-2.5,0.9,0.45); S.col(2.55,1.0,0.45);
  dgEntEnd(S,{seal,sealMesh:seal,voidMat,mo,
    apply(sealed){ seal.visible=sealed; },
    tick(dt,lit,d){
      voidMat.color.set(0x4a3418).lerp(dgEntC.set(0xffb040),lit).multiplyScalar(1+0.05*Math.sin(t*2.1+Math.sin(t*0.7)));
      S.glowMat.color.setScalar((0.5+0.5*lit)*(0.88+0.12*Math.sin(t*1.7)));
      if(mo&&d<150){ mo.pts.material.opacity=0.35+0.55*lit*(0.7+0.3*Math.sin(t*2.3)); const p=mo.pos;
        for(let i=0;i<mo.n;i++){ const a=i*2.399, rr=2+h3(i,1,1)*7; p[i*3]=Math.sin(a)*rr+Math.sin(t*0.4+i)*1.2; p[i*3+1]=1.2+h3(i,2,2)*3+Math.sin(t*0.6+i*1.3)*0.7; p[i*3+2]=2+h3(i,3,3)*8+Math.cos(t*0.35+i*1.7)*1.2; }
        mo.pts.geometry.attributes.position.needsUpdate=true; }
    }});
}

/* ================= 2. The Falls Door ================= */
// the canvas the water curtain scrolls: pale streaks on a thin jade veil (seamless top to bottom)
function dgEntWaterTex(){
  const c=document.createElement('canvas'); c.width=128; c.height=256; const g=c.getContext('2d');
  g.fillStyle='rgba(176,236,216,0.30)'; g.fillRect(0,0,128,256);
  for(let k=0;k<26;k++){ const x=Math.floor(h3(k,1,1)*126), w=1+Math.floor(h3(k,2,2)*3), ph=h3(k,3,3)*TAU, f=1+Math.floor(h3(k,4,4)*3);
    for(let y=0;y<256;y+=8){ const a=0.3+0.7*(0.5+0.5*Math.sin(y/256*TAU*f+ph)); g.fillStyle='rgba(255,255,255,'+(a*0.6).toFixed(2)+')'; g.fillRect(x,y,w,8); } }
  const tex=new THREE.CanvasTexture(c); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; return tex;
}
function dgEntFalls(E){
  const S=dgEntBegin(E), {main,glow}=S, det=dgEntDet, DWD=1.6, DHT=3.6;
  // one rock's paint: grey-green stone with its own tone and vertical strata, dark and wet at the foot, moss on every upward face
  const rockPaint=k=>(x,y,z,nx,ny,nz,c)=>{
    const n=noise2(x*0.6+z*0.3,y*0.5)*0.5+0.5, st=noise2(x*2.4+z*1.1,y*0.22+k)*0.5+0.5;
    c.set(0xaab1a6).multiplyScalar(0.72+0.3*n+0.14*st).lerp(dgEntC.set(0x8fa090),0.25*h3(k,1,1));
    const wet=smoothstep(1.0,0,y); if(wet>0) c.lerp(dgEntC.set(0x4f7064),wet*0.6);
    if(ny>0.5&&y>0.4) c.lerp(dgEntC.set(0x5f8f48),0.7*clamp(0.45+noise2(x*0.9,z*0.9)*0.9));
  };
  const rockP=rockPaint(0.5);
  // the rock face: a back mass, wings of boulders stepping back either side of the door (rows of three), a lintel over it, and the three ledges stepping up and back (C over the door, B, A the spring's)
  main.push(dgEntRock(12.5,9,3.4,0,0.5,-5.6,0.35,rockPaint(0.2)));
  for(const sd of [-1,1]) for(let r=0;r<3;r++) for(let q=0;q<3;q++){ const k=r*3+q+(sd>0?20:0), w=2.1+h3(k,1,1)*0.7, h=2.5+h3(k,2,2)*0.7-r*0.1, x=sd*(2.65+q*1.9+(h3(k,3,3)-0.5)*0.3), y=0.5+r*2.3+h*0.1, z=-0.7-q*0.75+(h3(k,4,4)-0.5)*0.5;
    if(r===2&&q===0&&sd<0) continue;   // (the top of the left inner column is left open: the spring's own ledges rise there)
    main.push(dgEntRock(w,h,3.0,x,y+(r?0:0.4),z,0.5,rockPaint(k),(h3(k,5,5)-0.5)*0.5,(h3(k,6,6)-0.5)*0.12)); }
  main.push(dgEntRock(DWD*2+0.8,1.6,7.0,0,4.4,-3.0,0.18,rockP),dgEntRock(5.6,1.0,5.9,0,5.5,-3.55,0.2,rockP),dgEntRock(5.5,0.9,4.8,-1.0,6.35,-4.1,0.2,rockP));
  // the doorway: floor flags, a dark void with a pale glow, and the lattice that seals it (a talisman on it) until Hanami has been walked to
  const flag=(x,y,z,nx,ny,nz,c)=>{ c.set(0x6a7570).multiplyScalar(0.8+0.3*h3(Math.floor(x*2),Math.floor(z*2),1)); };
  main.push(paint(new THREE.BoxGeometry(DWD*2+0.5,1.2,2.6).translate(0,0.75-0.6,-0.7),flag));   // (a landing at the door, its top a hand's breadth over the pool, which stands 0.7 m over the door's ground)
  const voidMat=new THREE.MeshBasicMaterial({color:0xc8fff0}), voidMesh=new THREE.Mesh(new THREE.PlaneGeometry(DWD*2,DHT),voidMat); voidMesh.position.set(0,DHT/2,-1.6); S.G.add(voidMesh);
  const wood=dgEntWood(0x3a2a1c), lat=[];
  for(let k=0;k<8;k++) lat.push(paint(vbox(0.07,DHT,0.07,-1.4+k*0.4,DHT/2,-0.9),wood));
  for(let k=0;k<4;k++) lat.push(paint(vbox(DWD*2,0.07,0.07,0,0.5+k*0.95,-0.9),wood));
  for(const [x,y] of [[-0.6,2.4],[0.7,1.5],[0,3.0]]) lat.push(paint(vbox(0.22,0.62,0.02,x,y,-0.85),dgEntFlat(0xb02a1e)));
  const seal=new THREE.Mesh(merge(lat),villageMat); S.G.add(seal);
  // the shimenawa: a straw rope across the door from two short posts, paper strips hanging from it
  for(const sx of [-1,1]) main.push(paint(cyl(0.09,0.11,DHT+0.3,6).translate(sx*(DWD+0.45),(DHT+0.3)/2-0.2,0.95),wood));
  main.push(dgEntTube([[-DWD-0.45,DHT-0.1,0.95],[-0.8,DHT-0.32,0.95],[0.8,DHT-0.32,0.95],[DWD+0.45,DHT-0.1,0.95]],0.07,0.07,10,5,dgEntFlat(0xd8c890)));
  for(let k=0;k<7;k++){ const x=-1.7+k*0.57; main.push(paint(vbox(0.12,0.46,0.02,x,DHT-0.6-(k%2)*0.1,0.95).rotateZ((k%2?1:-1)*0.15),dgEntFlat(0xf4f0e6))); }
  // the pool in front of the door: water just over the doorway's floor, spread wide enough to cover every dip; where the ground rises above it the ground simply shows, so the pool takes the shape
  // of the hollow the door lies in (the ground is not touched) and a ring of boulders is set where the ground meets the water
  const PX=0, PZ=1.2, PR=4.2, wl=0.7, pg=new THREE.CircleGeometry(PR,32).rotateX(-Math.PI/2).translate(PX,0,PZ), pp=pg.attributes.position;
  for(let i=0;i<pp.count;i++) pp.setZ(i,Math.max(pp.getZ(i),0.2));   // (nothing behind the door's front: the disc's back is cut straight)
  const pool=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:0x2fa88a,transparent:true,opacity:0.88})); pool.position.set(0,wl,0); pool.name='pool'; S.G.add(pool);
  { const nB=det?15:8; for(let k=0;k<nB;k++){ const a=-1.5+k*(3.0/(nB-1)); let r=1.0, hit=0; for(;r<6;r+=0.2){ if(S.gy(Math.sin(a)*r,1.0+Math.cos(a)*r)>wl+0.1){ hit=r; break; } }
      if(!hit||hit<1.4) continue; const lx=Math.sin(a)*hit, lz=1.0+Math.cos(a)*hit, s=0.5+h3(k,2,2)*0.45, y=S.gy(lx,lz);
      main.push(paint(new THREE.DodecahedronGeometry(s,0).scale(1.25,0.75,1).rotateY(h3(k,3,3)*TAU).translate(lx,y+0.08,lz),rockPaint(k+50))); S.foot(lx,lz,y); } }
  // stepping stones across the pool from the apron to the door, a stone lantern either side of them
  for(let k=0;k<5;k++){ const lz=5.4-k*1.1+(h3(k,1,2)-0.5)*0.3, lx=(h3(k,2,3)-0.5)*0.7, y=S.gy(lx,lz), top=Math.max(y,wl)+0.12;
    main.push(paint(cyl(0.55,0.62,top-y+0.3,7).translate(lx,(top+y-0.3)/2,lz),flag)); S.foot(lx,lz,y); }
  dgEntLantern(S,-2.0,6.9,1.25); dgEntLantern(S,2.0,6.9,1.25);
  // the curtains: C falls in front of the door, B and A are the two ledges above it; one texture scrolls down all three, bulging a little at the foot
  const tex=dgEntWaterTex(), cmat=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0.82,depthWrite:false,side:THREE.DoubleSide,color:0xe4fff6}), sheets=[];
  const sheet=(x0,x1,yTop,yBot,z,bulge)=>{ const w=x1-x0, h=yTop-yBot, g=new THREE.PlaneGeometry(w,h,3,6), p=g.attributes.position, uv=g.attributes.uv;
    for(let i=0;i<p.count;i++){ const v=(p.getY(i)+h/2)/h; p.setXYZ(i,(x0+x1)/2+p.getX(i),yBot+v*h,z+bulge*Math.pow(Math.max(0,1-v),2.2)); uv.setXY(i,uv.getX(i)*w/1.3,uv.getY(i)*h/2.4); } return g; };
  sheets.push(sheet(-DWD-0.3,DWD+0.3,5.2,wl-0.02,0.7,0.35),sheet(-2.7,2.7,5.95,5.2,-0.5,0.1),sheet(-3.7,1.7,6.8,6.0,-1.65,0.1));
  const falls=new THREE.Mesh(merge(sheets.map(g=>paint(g,dgEntFlat(0xffffff)))),cmat); falls.renderOrder=2; S.G.add(falls);
  // the mist: puffs rising off the pool 14 m, seen from the road
  const mist=det?dgEntPoints(det>=2?28:14,7,0xe6fff6,0.36,true):null; if(mist) S.G.add(mist.pts);
  const mistAt=(age,i)=>{ const p=mist.pos, c=mist.col, a=age, s=Math.sin(a*Math.PI); const w=h3(i,1,1)*TAU;
    p[i*3]=Math.sin(w)*(0.8+a*3.2); p[i*3+1]=wl+0.5+a*14; p[i*3+2]=PZ-0.5+Math.cos(w)*(0.8+a*2.6)+a*2.5; const k=s*(0.35+0.65*(1-a)); c[i*3]=k*0.8; c[i*3+1]=k; c[i*3+2]=k*0.92; };
  if(mist){ for(let i=0;i<mist.n;i++) mistAt(i/mist.n,i); mist.pts.geometry.attributes.position.needsUpdate=true; mist.pts.geometry.attributes.color.needsUpdate=true; }
  // colliders: the rock face either side of the doorway (the way between them stays open to the door's plug)
  S.col(-4.0,-1.6,2.4); S.col(4.0,-1.6,2.4); S.col(-2.7,0.1,1.2); S.col(2.7,0.1,1.2); S.col(-1.0,-1.0,0.6); S.col(0,-1.0,0.6); S.col(1.0,-1.0,0.6); S.col(0,-4.0,3.5);
  dgEntEnd(S,{seal,sealMesh:seal,voidMat,falls,mist,pool,wl,tex,
    apply(sealed){ seal.visible=sealed; },
    tick(dt,lit,d){
      voidMat.color.set(0x2e4a42).lerp(dgEntC.set(0xc8fff0),lit);
      if(det>=2&&d<220){ tex.offset.y-=dt*0.55; pool.material.color.set(0x2fa88a).lerp(dgEntC.set(0x62d6b4),0.5+0.5*Math.sin(t*1.5+Math.sin(t*0.4))*0.6);
        if(mist&&d<260){ for(let i=0;i<mist.n;i++){ const age=((t*0.07+i/mist.n)%1+1)%1; mistAt(age,i); } mist.pts.geometry.attributes.position.needsUpdate=true; mist.pts.geometry.attributes.color.needsUpdate=true; } }
    }});
}

/* ================= 3. The Barrow Door ================= */
function dgEntBarrow(E){
  const S=dgEntBegin(E), {main,glow}=S, det=dgEntDet;
  const snowP=(x,y,z,nx,ny,nz,c)=>{ const n=noise2(x*0.5,z*0.5+y*0.2)*0.5+0.5;
    if(ny>0.52+0.22*n) c.set(0xf0f5f8).multiplyScalar(0.93+0.07*n); else c.set(0x4e5048).lerp(dgEntC.set(0x7f7c6c),n*0.6).multiplyScalar(0.8+0.3*n); };
  const stoneP=(x,y,z,nx,ny,nz,c)=>{ const n=noise2(x*0.9,y*0.7+z)*0.5+0.5; c.set(0x6c7380).multiplyScalar(0.78+0.3*n); if(y<0.9) c.lerp(dgEntC.set(0xdde8ee),0.55*smoothstep(0.9,0,y)); if(ny>0.6) c.lerp(dgEntC.set(0xf0f5f8),0.85); };
  // the mound: a big dome behind the doorway and a lobe either side of it, all under snow, a grey turf showing low down
  const seg=det?[24,12]:[12,6];
  main.push(dgEntDome(9.5,8.0,7.4,0,-0.3,-8.4,seg[0],seg[1],0.12,snowP),dgEntDome(3.6,3.4,3.8,-6.4,-0.3,-3.2,seg[0]*0.75|0,seg[1]*0.75|0,0.14,snowP),dgEntDome(3.6,3.3,3.8,6.4,-0.3,-3.4,seg[0]*0.75|0,seg[1]*0.75|0,0.14,snowP));
  // a kerb of cairn stones round the front of the two lobes (snow on their tops), so the mound shows against the snow
  for(const [cx,cz,rx,rz] of [[-6.4,-3.2,3.6,3.8],[6.4,-3.4,3.6,3.8]]) for(let k=0;k<(det?7:3);k++){ const f=0.12+k*(0.76/Math.max(1,(det?7:3)-1)), ph=f*Math.PI, lx=cx+Math.cos(ph)*rx*1.1, lz=cz+Math.sin(ph)*rz*1.1, q=k+(cx>0?9:0); if(Math.abs(lx)<3.1) continue;
    const y=S.gy(lx,lz); main.push(dgEntRock(1.0+h3(q,3,3)*0.9,0.8+h3(q,4,4)*0.6,0.9+h3(q,5,5)*0.7,lx,y+0.25,lz,0.3,stoneP,h3(q,6,6)*TAU)); S.foot(lx,lz,y); }
  // the trilithon: two uprights and a lintel, rime on the feet, snow on top, a floor of flags down to the ground
  main.push(dgEntRock(0.95,5.5,0.9,-2.1,1.95,0,0.14,stoneP),dgEntRock(0.95,5.4,0.9,2.1,1.9,0.05,0.14,stoneP),dgEntRock(6.3,1.0,1.2,0,5.1,0,0.16,stoneP));
  const flag=(x,y,z,nx,ny,nz,c)=>{ c.set(0x8a9096).multiplyScalar(0.8+0.3*h3(Math.floor(x*2),Math.floor(z*2),1)); if(ny>0.5) c.lerp(dgEntC.set(0xe6eef2),0.5); };
  main.push(paint(new THREE.BoxGeometry(4.4,0.5,1.6).translate(0,-0.2,0.3),flag),paint(new THREE.BoxGeometry(4.0,0.5,1.5).translate(0,S.gy(0,1.9)-0.2,1.9),flag));
  // runes cut pale blue into the stones (they glow: they are not lit, and dim while the door is sealed)
  const rune=(lx,ly,lz,s,seed,yaw)=>{ const k=h3(seed,1,1), pl=(w,h,x,y,rot)=>glow.push(paint(new THREE.PlaneGeometry(w*s,h*s).rotateZ(rot).translate(x*s,y*s,0).rotateY(yaw||0).translate(lx,ly,lz),dgEntFlat(0x9fd0ff)));
    pl(0.05,0.5,0,0,0); pl(0.05,0.28,0.1,0.12,0.7+k*0.8); pl(0.05,0.24,-0.1,-0.1,-0.8-k*0.6); if(k>0.45) pl(0.18,0.05,0,0.22,0); };
  for(const sx of [-1,1]) for(let k=0;k<(det?5:3);k++) rune(sx*2.1,0.9+k*0.78,0.5,1,sx*10+k);
  for(let k=0;k<(det?8:4);k++) rune(-2.55+k*(5.1/Math.max(1,(det?7:3))),5.1,0.63,1.1,40+k);
  // two braziers either side of the way in, burning blue
  const flames=[], fOut=new THREE.MeshBasicMaterial({color:0x3a82ff,transparent:true,opacity:0.78,depthWrite:false,blending:THREE.AdditiveBlending}), fIn=new THREE.MeshBasicMaterial({color:0xcfe8ff,transparent:true,opacity:0.9,depthWrite:false,blending:THREE.AdditiveBlending});
  for(const sx of [-1,1]){ const lx=sx*4.4, lz=2.0, y=S.gy(lx,lz), iron=dgEntFlat(0x2c2f36);
    main.push(paint(cyl(0.34,0.44,1.1,8).translate(lx,y+0.55,lz),stoneP),paint(cyl(0.62,0.36,0.34,10).translate(lx,y+1.27,lz),iron));
    glow.push(paint(cyl(0.5,0.5,0.04,10).translate(lx,y+1.42,lz),dgEntFlat(0x6aa8ff))); S.foot(lx,lz,y); S.col(lx,lz,0.55);
    for(const [m,r,h,dy] of [[fOut,0.38,1.3,0.65],[fIn,0.2,0.85,0.45]]){ const f=new THREE.Mesh(new THREE.ConeGeometry(r,h,6),m); f.position.set(lx,y+1.4+dy,lz); S.G.add(f); flames.push({f,h,y:y+1.4,ph:h3(sx,dy,1)*TAU}); } }
  // seven standing stones round the front at 12 m, a rune on each stone's inner face
  for(let k=0;k<7;k++){ const a=(k-3)*0.38, lx=Math.sin(a)*12, lz=Math.cos(a)*12, h=2.4+h3(k,1,1)*1.0, y=S.gy(lx,lz), yaw=a+Math.PI+(h3(k,2,2)-0.5)*0.1;
    main.push(dgEntRock(0.9,h,0.6,lx,y+h/2-0.3,lz,0.12,stoneP,yaw,(h3(k,3,3)-0.5)*0.12));
    rune(lx-Math.sin(a)*0.38,y+h*0.55,lz-Math.cos(a)*0.38,0.9,70+k,a+Math.PI);   // on the face toward the door
    S.foot(lx,lz,y-0.3); S.col(lx,lz,0.5); }
  // the sealing slab across the doorway (frost on it, a dim ring) and the way in behind: a dark void with a blue gleam
  const slab=new THREE.Mesh(merge([dgEntRock(3.4,4.5,0.55,0,2.2,0.0,0.1,(x,y,z,nx,ny,nz,c)=>{ c.set(0x8b97a3).multiplyScalar(0.8+0.25*h3(Math.floor(x*3),Math.floor(y*3),1)); if(y>3.8) c.lerp(dgEntC.set(0xf0f5f8),0.6); }),
    paint(new THREE.TorusGeometry(0.9,0.06,6,24).translate(0,2.3,0.32),dgEntFlat(0x5a86c0))]),villageMat); S.G.add(slab);
  const voidMat=new THREE.MeshBasicMaterial({color:0x0a1626}), voidMesh=new THREE.Mesh(new THREE.PlaneGeometry(3.3,4.5),voidMat); voidMesh.position.set(0,2.25,-0.3); S.G.add(voidMesh);
  const gleam=new THREE.Mesh(new THREE.PlaneGeometry(3.2,4.4),new THREE.MeshBasicMaterial({color:0x2f6fb8,transparent:true,opacity:0.2,depthWrite:false,blending:THREE.AdditiveBlending})); gleam.position.set(0,2.25,-0.25); S.G.add(gleam);
  // the column of pale blue light over the mound, strong at night and in a blizzard
  const colG=new THREE.CylinderGeometry(1.0,1.9,46,14,1,true).translate(0,0,0), cp=colG.attributes.position, cc=new Float32Array(cp.count*3);
  for(let i=0;i<cp.count;i++){ const f=Math.pow(1-(cp.getY(i)+23)/46,1.2); cc[i*3]=0.45*f; cc[i*3+1]=0.7*f; cc[i*3+2]=f; }
  colG.setAttribute('color',new THREE.BufferAttribute(cc,3));
  const column=new THREE.Mesh(colG,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0.1,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); column.position.set(0,29.5,-8); S.G.add(column);
  // colliders: the mound (circles of at most 6 m), the uprights, a plug in the doorway
  for(const [x,z,r] of [[0,-8.4,5.2],[-4.5,-6.5,4.2],[4.5,-6.5,4.2],[-6.4,-3.2,3.3],[6.4,-3.4,3.3],[-2.1,0,0.55],[2.1,0.05,0.55],[-1.0,-0.7,0.6],[0,-0.7,0.6],[1.0,-0.7,0.6]]) S.col(x,z,r);
  dgEntEnd(S,{slab,sealMesh:slab,voidMat,gleam,flames,column,
    apply(sealed){ slab.visible=sealed; },
    tick(dt,lit,d){
      S.glowMat.color.setScalar(0.3+0.7*lit);
      voidMat.color.set(0x0a1626); gleam.material.opacity=0.2*lit*(0.8+0.2*Math.sin(t*1.9));
      const vis=Math.max(envCur.night,WX.snow*WX.inten), k=lit>0.5?(lit-0.5)*2:0; column.material.opacity=k*(0.04+0.2*vis);   // faint by day, bright at night and in a blizzard, off while sealed
      for(const q of flames){ const sc=lit*(det>=2?0.85+0.3*Math.sin(t*9+q.ph)*Math.sin(t*5.3+q.ph*2):1); q.f.scale.set(Math.max(0.01,sc*(0.9+0.15*Math.sin(t*7+q.ph))),Math.max(0.01,sc),Math.max(0.01,sc*(0.9+0.15*Math.cos(t*6+q.ph)))); q.f.position.y=q.y+q.h*0.5*Math.max(0.01,sc)*0.9+0.05; }
    }});
}

/* ================= 4. The Old Adit ================= */
function dgEntAdit(E){
  const S=dgEntBegin(E), {main,glow}=S, det=dgEntDet;
  const slateP=(x,y,z,nx,ny,nz,c)=>{ const n=noise2(x*0.8,y*0.6+z)*0.5+0.5; c.set(0x8a8d96).multiplyScalar(0.72+0.4*n); if(ny>0.6) c.lerp(dgEntC.set(0x6f8a54),0.4*n); };
  const coalP=(x,y,z,nx,ny,nz,c)=>{ const n=noise2(x*1.3,z*1.3+y)*0.5+0.5; c.set(0x1c1d22).multiplyScalar(0.7+0.7*n); };
  const woodP=dgEntWood(0x5e4630), iron=dgEntFlat(0x34343c);
  // the hillside: a mound behind the doorway and two crags either side of it, one over the lintel (the cliff the adit was cut into)
  const seg=det?[20,10]:[10,5];
  main.push(dgEntDome(10,9,8,0,-0.4,-9,seg[0],seg[1],0.12,slateP));
  main.push(dgEntRock(5.4,9,4.2,-5.2,3.8,-3.0,0.5,slateP,0.12),dgEntRock(5.4,8.6,4.2,5.2,3.6,-3.2,0.5,slateP,-0.1),dgEntRock(6.6,4.6,3.4,0,6.6,-1.9,0.4,slateP,0.03),dgEntRock(4.2,6.2,3.4,-8.6,2.8,-1.6,0.5,slateP,0.5,0.08),dgEntRock(4.2,5.6,3.4,8.8,2.5,-1.8,0.5,slateP,-0.6,-0.08));
  // the timber portal: two posts, a lintel and a second frame inside with its braces, a cap of boards on top
  for(const sx of [-1,1]){ main.push(paint(cyl(0.3,0.34,3.9,7).translate(sx*1.75,1.95,0.1),woodP),paint(cyl(0.26,0.3,3.7,7).translate(sx*1.7,1.85,-1.3),woodP),
      paint(vbox(0.14,1.5,0.14,0,0,0).rotateZ(-sx*0.7).translate(sx*1.15,3.2,0.1),woodP)); S.col(sx*1.75,0.1,0.4); S.foot(sx*1.75,0.1,S.gy(sx*1.75,0.1)); }
  main.push(paint(vbox(4.5,0.5,0.62,0,3.95,0.1),woodP),paint(vbox(4.2,0.46,0.5,0,3.8,-1.3),woodP),paint(vbox(5.2,0.18,2.2,0,4.3,-0.6),woodP));
  // the sealing boards across the doorway, nailed, with iron straps (shown while the way is shut), and what is behind: a dark mouth with a lamp's warm gleam far in
  const slab=new THREE.Mesh(merge([0,1,2,3,4].map(i=>paint(vbox(3.7,0.42,0.12,0,0.45+i*0.78,0.32),woodP)).concat([paint(vbox(0.16,4.0,0.1,-1.1,1.95,0.4),iron),paint(vbox(0.16,4.0,0.1,1.1,1.95,0.4),iron),paint(vbox(0.2,4.3,0.1,0,0,0).rotateZ(0.5).translate(0,2.0,0.44),woodP)])),villageMat); S.G.add(slab);
  const voidMat=new THREE.MeshBasicMaterial({color:0x07080a}), voidMesh=new THREE.Mesh(new THREE.PlaneGeometry(3.3,3.8),voidMat); voidMesh.position.set(0,1.9,-0.4); S.G.add(voidMesh);
  const gleam=new THREE.Mesh(new THREE.PlaneGeometry(3.2,3.7),new THREE.MeshBasicMaterial({color:0xd07a30,transparent:true,opacity:0.2,depthWrite:false,blending:THREE.AdditiveBlending})); gleam.position.set(0,1.9,-0.34); S.G.add(gleam);
  // the track: two rails and sleepers running out from the mouth over the apron, following the ground
  const rail=(lx,lz)=>{ const y=S.gy(lx,lz); return paint(vbox(0.09,0.09,0.9,lx,y+0.12,lz),dgEntFlat(0x6a6a74)); };
  for(let k=0;k<(det?10:5);k++){ const lz=0.9+k*(det?0.85:1.7), y=S.gy(0,lz); main.push(paint(vbox(1.5,0.1,0.26,0,y+0.06,lz),woodP),rail(-0.55,lz),rail(0.55,lz)); if(k===0||k===(det?9:4)) S.foot(0,lz,y); }
  // an ore cart parked beside the track, a spoil heap of coal, three kegs and a pick on the rock by the door
  { const lx=-3.4, lz=3.6, y=S.gy(lx,lz);
    main.push(paint(vbox(1.6,0.8,1.1,0,0,0).rotateY(0.3).translate(lx,y+0.8,lz),dgEntFlat(0x4e4036)),dgEntRock(1.2,0.5,0.9,lx,y+1.3,lz,0.2,coalP,0.3));
    for(const [wx,wz] of [[-0.55,-0.6],[0.55,-0.6],[-0.55,0.6],[0.55,0.6]]) main.push(paint(cyl(0.24,0.24,0.1,8).rotateX(Math.PI/2).translate(lx+wx,y+0.26,lz+wz),iron));
    S.foot(lx,lz,y); S.col(lx,lz,0.95); }
  main.push(dgEntDome(2.8,1.5,2.4,5.2,0.0,2.0,det?12:6,det?6:3,0.2,coalP)); S.foot(5.2,2.0,S.gy(5.2,2.0)); S.col(5.2,2.0,2.2);
  { const kx=-3.9, kz=1.0, y=S.gy(kx,kz), keg=(x,yy,z)=>[paint(cyl(0.34,0.34,0.8,9).translate(x,yy,z),dgEntFlat(0x6a4a2c)),paint(cyl(0.36,0.36,0.06,9).translate(x,yy+0.22,z),iron),paint(cyl(0.36,0.36,0.06,9).translate(x,yy-0.22,z),iron)];
    main.push(...keg(kx+0.4,y+0.4,kz),...keg(kx-0.4,y+0.4,kz),...keg(kx,y+1.15,kz)); S.foot(kx,kz,y); S.col(kx,kz,0.9); }
  // two lamps on posts either side of the way in: lit (the lamp is a glow, not lit) and dimmer while the door is sealed
  for(const sx of [-1,1]){ const lx=sx*3.0, lz=2.2, y=S.gy(lx,lz);
    main.push(paint(vbox(0.2,2.4,0.2,lx,y+1.2,lz),woodP),paint(vbox(0.75,0.14,0.14,lx-sx*0.38,y+2.4,lz),woodP),paint(vbox(0.34,0.4,0.34,lx-sx*0.75,y+2.1,lz),iron));
    glow.push(paint(vbox(0.26,0.28,0.26,lx-sx*0.75,y+2.1,lz),dgEntFlat(0xffb870))); S.foot(lx,lz,y); S.col(lx,lz,0.3); }
  // the head frame on the hill: two inclined beams, a cross-tie and a winding wheel, seen from afar
  { const hx=2.6, hz=-9.5, y=S.gy(hx,hz), H=8.5;
    for(const sz of [-1,1]) main.push(paint(vbox(0.34,H,0.34,0,0,0).rotateX(sz*0.22).translate(hx,y+H/2-0.2,hz+sz*1.0),woodP));
    main.push(paint(vbox(0.3,0.3,2.4,hx,y+H-0.3,hz),woodP),paint(vbox(0.26,0.26,2.0,hx,y+H*0.5,hz),woodP),paint(new THREE.TorusGeometry(1.1,0.14,5,16).rotateY(Math.PI/2).translate(hx,y+H-0.2,hz),iron));
    S.foot(hx,hz,y); S.col(hx,hz,1.4); }
  // colliders: the crags, the mound, the way in plugged
  for(const [x,z,r] of [[-5.2,-3.0,3.3],[5.2,-3.2,3.3],[-8.4,-1.6,2.4],[8.6,-1.8,2.4],[0,-6.5,4.6],[-1.0,-0.8,0.6],[0,-0.8,0.6],[1.0,-0.8,0.6]]) S.col(x,z,r);
  dgEntEnd(S,{slab,sealMesh:slab,voidMat,gleam,
    apply(sealed){ slab.visible=sealed; },
    tick(dt,lit,d){ S.glowMat.color.setScalar(0.3+0.7*lit); gleam.material.opacity=0.2*lit*(0.8+0.2*Math.sin(t*3.1)*Math.sin(t*1.7)); }});
}

/* ================= the signposts =================
   One on the nearest road to each door (DG_ENTRANCES[..].sign, 3.5 m off it toward the door): a post with a pointed board that points at the door, its name and the distance
   painted on both faces (the sign stands where it was put, so the distance is fixed). */
function dgEntSignTex(name,line){
  const c=document.createElement('canvas'); c.width=512; c.height=128; const g=c.getContext('2d');
  g.fillStyle='#8a6a44'; g.fillRect(0,0,512,128); g.strokeStyle='#2a1e14'; g.lineWidth=6; g.strokeRect(6,6,500,116);
  g.fillStyle='#fff4dc'; g.font='700 44px Fraunces, Georgia, serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(name,256,50);
  g.fillStyle='#ecdcb4'; g.font='600 30px Inter, system-ui, sans-serif'; g.fillText(line,256,98);
  const tex=new THREE.CanvasTexture(c); tex.anisotropy=4; return tex;
}
function dgEntSign(E){
  const x=E.sign.x, z=E.sign.z, y=getH(x,z), dx=E.x-x, dz=E.z-z, dist=Math.hypot(dx,dz), rot=Math.atan2(-dz,dx), G=new THREE.Group();   // in the group's frame +x points at the door
  G.position.set(x,y,z); G.rotation.y=rot; G.name='dg-sign-'+E.theme;
  const wood=dgEntWood(0x5e4630), parts=[paint(cyl(0.08,0.1,2.9,6).translate(0,1.25,0),wood),paint(new THREE.ConeGeometry(0.14,0.22,6).translate(0,2.8,0),wood)];
  const sh=new THREE.Shape(); sh.moveTo(-0.95,-0.27); sh.lineTo(0.72,-0.27); sh.lineTo(1.05,0); sh.lineTo(0.72,0.27); sh.lineTo(-0.95,0.27); sh.closePath();
  parts.push(paint(new THREE.ExtrudeGeometry(sh,{depth:0.07,bevelEnabled:false}).translate(0,2.1,-0.035),wood));
  parts.push(paint(vbox(1.2,0.07,0.07,-0.1,1.45,0),wood), paint(vbox(0.06,0.75,0.06,0,0,0).rotateZ(0.7).translate(0.3,1.75,0),wood));   // a brace under the board
  const m=new THREE.Mesh(merge(parts),villageMat); m.castShadow=true; m.receiveShadow=true; G.add(m);
  const line=Math.round(dist)+' m, '+dirWord(dx,dz), tex=dgEntSignTex(E.name,line), mat=new THREE.MeshLambertMaterial({map:tex,emissive:0x2a2418});
  for(const side of [1,-1]){ const p=new THREE.Mesh(new THREE.PlaneGeometry(1.55,0.4),mat); p.position.set(-0.12,2.1,side*0.037); if(side<0) p.rotation.y=Math.PI; G.add(p); }
  addCol(x,z,0.3); scene.add(G);
  DG_DOORS.signs[E.theme]={E,G,x,z,y,rot,dist,text:[E.name,line]};
}

/* ================= build and run ================= */
let dgEntBuilt=false;
function dgEntBuild(){
  if(dgEntBuilt) return; dgEntBuilt=true;
  dgEntElder(DG_ENTRANCES.hollowroots); dgEntFalls(DG_ENTRANCES.jadesprings); dgEntBarrow(DG_ENTRANCES.bonefrostbarrow); dgEntAdit(DG_ENTRANCES.blackseam);
  for(const E of dgEntList) dgEntSign(E);
}
/* every frame: each door takes its sealed or open look from your gear (dgGateOpen, so +1 at Wildwood opens the Elder, Hanami / Rimehold the others; checked for all three wherever you are,
   it is three lookups) and eases its light up or down; a door hides when far, and its animation runs only when it shows and only on the desktop */
function dgEntUpdate(dt){
  for(const id in DG_DOORS.doors){ const D=DG_DOORS.doors[id], E=D.E, d=Math.hypot(P.x-E.x,P.z-E.z), vis=d<DG_ENT_VIS;
    const sealed=dgEntSealed(E); if(sealed!==D.sealed){ D.sealed=sealed; D.apply(sealed); }
    const target=sealed?0.22:1; D.lit=D.lit===null||!vis?target:D.lit+(target-D.lit)*Math.min(1,dt*2.5);
    D.G.visible=vis; if(vis) D.tick(dt,D.lit,d); }
  for(const id in DG_DOORS.signs){ const S=DG_DOORS.signs[id]; S.G.visible=Math.hypot(P.x-S.x,P.z-S.z)<260; }
}
