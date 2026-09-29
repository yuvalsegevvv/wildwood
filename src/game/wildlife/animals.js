//@ Deer, foxes, rabbits, ducks, birds/bats, butterflies
/* ---------- wildlife ---------- */
const ZERO=new THREE.Matrix4().makeScale(0,0,0);
const _am=new THREE.Matrix4(), _bm=new THREE.Matrix4(), _pv=new THREE.Vector3(), _pq=new THREE.Quaternion(), _pe=new THREE.Euler(), _ps=new THREE.Vector3();
function baseM(out,x,y,z,yaw,pitch,roll,s){ _pe.set(pitch,yaw,roll||0,'YXZ'); _pq.setFromEuler(_pe); _pv.set(x,y,z); _ps.set(s,s,s); return out.compose(_pv,_pq,_ps); }
function partM(out,base,px,py,pz,rx,ry,rz){ _pe.set(rx||0,ry||0,rz||0,'XYZ'); _pq.setFromEuler(_pe); _pv.set(px,py,pz); _ps.set(1,1,1); out.compose(_pv,_pq,_ps); return out.premultiply(base); }
function col(g,hex,fn){ return paint(g,(x,y,z,nx,ny,nz,c)=>{ c.set(hex); if(fn) fn(x,y,z,c); c.multiplyScalar(0.92+h3(x,y,z)*0.14); }); }
const sph=(r,w,h)=>new THREE.SphereGeometry(r,w||10,h||8);
const cream=new THREE.Color(0xdcc8a6), snowy=new THREE.Color(0xf2eee4);
function wingGeo(pts,mirror){
  const P=[],N=[],C=[];
  for(const p of pts){ P.push(mirror?-p[0]:p[0],p[1],p[2]); N.push(0,1,0); C.push(1,1,1); }
  return mkGeo(P,N,C);
}
const matAnimal=new THREE.MeshLambertMaterial({vertexColors:true});
function animMesh(geo,mat,n,cast){
  const m=new THREE.InstancedMesh(geo,mat,Math.max(1,n));
  m.frustumCulled=false; m.castShadow=!!cast; m.receiveShadow=true;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for(let i=0;i<m.count;i++){ m.setMatrixAt(i,ZERO); m.setColorAt(i,WHITE); }   // (colours on every instanced mesh: see addInstanced)
  scene.add(m); return m;
}

/* geometry: animals face -z, feet at y=0 */
function buildAnimalGeos(){
  const A={};
  // deer
  A.deerTorso=merge([
    col(sph(0.35,12,8).scale(0.72,0.78,1.55).translate(0,1.0,0),0x8a5a34,(x,y,z,c)=>{ if(y<0.86) c.lerp(cream,0.7); if(z>0.42&&y>0.92) c.lerp(snowy,0.6); }),
    col(new THREE.ConeGeometry(0.06,0.18,6).rotateX(2.2).translate(0,1.1,0.57),0xf0ebe0)
  ]);
  const headParts=()=>[
    col(cyl(0.075,0.12,0.62,7).rotateX(-0.54).translate(0,0.26,-0.15),0x7d5130),
    col(sph(0.12,10,8).scale(0.85,0.85,1.7).translate(0,0.56,-0.42),0x83552f),
    col(sph(0.07,8,6).scale(0.9,0.8,1.2).translate(0,0.52,-0.6),0x2e231c),
    col(new THREE.ConeGeometry(0.05,0.17,5).rotateZ(0.8).translate(-0.12,0.68,-0.34),0x7d5130),
    col(new THREE.ConeGeometry(0.05,0.17,5).rotateZ(-0.8).translate(0.12,0.68,-0.34),0x7d5130)
  ];
  A.deerHeadDoe=merge(headParts());
  const antl=[];
  for(const sd of [-1,1]){
    const bx=sd*0.06, by=0.66, bz=-0.38, len=0.4, dx=sd*Math.sin(0.5), dy=Math.cos(0.5);
    antl.push(col(cyl(0.014,0.024,len,5).translate(0,len/2,0).rotateZ(-sd*0.5).translate(bx,by,bz),0xd8c8a8));
    for(const tt of [0.45,0.85]){
      const l2=0.15, g=cyl(0.008,0.014,l2,4).translate(0,l2/2,0).rotateX(-0.8).translate(bx+dx*len*tt,by+dy*len*tt,bz);
      antl.push(col(g,0xd8c8a8));
    }
  }
  A.deerHeadBuck=merge(headParts().concat(antl));
  A.deerLeg=col(cyl(0.028,0.045,0.95,5).translate(0,-0.475,0),0x6e4a2c,(x,y,z,c)=>{ if(y<-0.86) c.set(0x2a211b); });
  // fox
  A.foxBody=merge([
    col(sph(0.18,10,8).scale(0.8,0.75,1.9).translate(0,0.38,0),0xc4602a,(x,y,z,c)=>{ if(y<0.31&&z<-0.1) c.lerp(snowy,0.8); }),
    col(sph(0.09,8,6).scale(0.85,0.85,2.6).rotateX(0.35).translate(0,0.34,0.5),0xc4602a,(x,y,z,c)=>{ if(z>0.66) c.lerp(snowy,0.9); }),
    col(sph(0.1,10,8).scale(1,0.9,1.1).translate(0,0.5,-0.36),0xc86a30,(x,y,z,c)=>{ if(y<0.47) c.lerp(snowy,0.7); }),
    col(new THREE.ConeGeometry(0.05,0.17,6).rotateX(-Math.PI/2).translate(0,0.47,-0.5),0xc86a30,(x,y,z,c)=>{ if(z<-0.56) c.set(0x1c1612); }),
    col(new THREE.ConeGeometry(0.035,0.1,4).translate(-0.05,0.61,-0.34),0x2a1c14),
    col(new THREE.ConeGeometry(0.035,0.1,4).translate(0.05,0.61,-0.34),0x2a1c14)
  ]);
  A.foxLeg=col(cyl(0.018,0.026,0.32,5).translate(0,-0.16,0),0x2d1f16);
  // rabbit
  A.rabbit=merge([
    col(sph(0.12,10,8).scale(0.8,0.75,1.1).translate(0,0.13,0),0x8b7a64,(x,y,z,c)=>{ if(y<0.08) c.lerp(cream,0.6); }),
    col(sph(0.075,9,7).translate(0,0.22,-0.12),0x857359),
    col(sph(0.022,6,5).scale(1,5,1.4).rotateZ(0.15).translate(-0.03,0.33,-0.09),0x7c6a52),
    col(sph(0.022,6,5).scale(1,5,1.4).rotateZ(-0.15).translate(0.03,0.33,-0.09),0x7c6a52),
    col(sph(0.035,6,5).translate(0,0.16,0.13),0xf2eee4)
  ]);
  // duck (mallard drake)
  A.duck=merge([
    col(sph(0.18,10,8).scale(0.75,0.55,1.2).translate(0,0.06,0),0x8c8a86,(x,y,z,c)=>{ if(z<-0.1) c.set(0x6b4a36); if(z>0.14) c.set(0x2a2a2a); }),
    col(cyl(0.04,0.05,0.14,6).translate(0,0.13,-0.15),0x1f5a32),
    col(sph(0.075,9,7).translate(0,0.21,-0.17),0x1f5a32),
    col(new THREE.ConeGeometry(0.03,0.09,6).rotateX(-Math.PI/2).translate(0,0.19,-0.27),0xd9b23a)
  ]);
  // bird
  A.bird=merge([
    col(sph(0.07,8,6).scale(0.8,0.7,2.4).translate(0,0,0),0x2b2b30),
    col(sph(0.045,7,6).translate(0,0.02,-0.17),0x26262b),
    col(new THREE.ConeGeometry(0.018,0.06,5).rotateX(-Math.PI/2).translate(0,0.01,-0.23),0x3a3530)
  ]);
  const bw=[[0,0,-0.09],[0.48,0,0.03],[0,0,0.1], [0,0,0.1],[0.48,0,0.03],[0.26,0,0.13]];
  A.birdWingL=wingGeo(bw,false); A.birdWingR=wingGeo(bw,true);
  const fw=[[0,0,-0.02],[0.075,0,-0.07],[0.085,0,0.005], [0,0,-0.02],[0.085,0,0.005],[0,0,0.02], [0,0,0.0],[0.065,0,0.015],[0.045,0,0.065]];
  A.flyL=wingGeo(fw,false); A.flyR=wingGeo(fw,true);
  return A;
}

const KIND={
  deer:{walk:1.3, run:8.5, flee:13, alert:26, rad:0.45, stride:2.6, legY:0.97, legs:[[-0.14,-0.42],[0.14,-0.42],[-0.14,0.4],[0.14,0.4]], graze:-1.75},
  fox:{walk:1.7, run:7.5, flee:9, alert:0, rad:0.25, stride:7, legY:0.32, legs:[[-0.07,-0.2],[0.07,-0.2],[-0.07,0.2],[0.07,0.2]], graze:-0.8},
  rabbit:{walk:2.2, run:6.5, flee:6, alert:11, rad:0.15, stride:5, graze:0}
};
const GAIT=[0,Math.PI,Math.PI,0];
const W={ready:false};
function groundOK(x,z){ return vDist(x,z)>VIL.r+5 && Math.abs(x)<HALF-20 && Math.abs(z)<HALF-20 && getH(x,z)>0.7 && grad(x,z)<0.7; }
function findSpot(cx,cz,rmin,rmax,dirAng,spread){
  for(let i=0;i<40;i++){
    const a=dirAng===undefined?AR(0,TAU):dirAng+AR(-spread,spread), r=AR(rmin,rmax), x=cx+Math.sin(a)*r, z=cz+Math.cos(a)*r;
    if(groundOK(x,z)) return [x,z];
  }
  return null;
}
function newGround(kind,x,z,extra){
  return Object.assign({kind,x,z,y:getH(x,z),heading:AR(0,TAU),goal:0,speed:0,state:'idle',timer:AR(0,3),phase:AR(0,TAU),ph0:AR(0,TAU),hp:0,hy:0,pitch:0,s:1},extra||{});
}
function initAnimals(){
  const A=buildAnimalGeos(); W.A=A;
  const herds=LITE?4:7, rabbits=LITE?16:34, foxes=LITE?3:5, ducks=LITE?10:22, flocks=LITE?3:4, flies=LITE?26:56;
  W.deer=[]; W.herds=[];
  const fwd=Math.atan2(-Math.sin(P.yaw),-Math.cos(P.yaw)); // direction the player faces, in (sin,cos) angle form
  for(let h=0;h<herds;h++){
    const c=h===0?(findSpot(P.x,P.z,28,45,fwd+1.6,0.5)||findSpot(P.x,P.z,28,45,fwd-1.6,0.5)):findSpot(P.x,P.z,35,100);
    if(!c) continue;
    const herd={id:h}; W.herds.push(herd);
    const n=3+Math.floor(Math.random()*2);
    for(let k=0;k<n;k++){
      const p=findSpot(c[0],c[1],0,6)||c;
      const fawn=k===n-1&&Math.random()<0.5;
      W.deer.push(newGround('deer',p[0],p[1],{herd,buck:k===0&&Math.random()<0.6,s:fawn?AR(0.58,0.68):AR(0.88,1.08)}));
    }
  }
  W.fox=[]; for(let i=0;i<foxes;i++){ const p=findSpot(P.x,P.z,30,100); if(p) W.fox.push(newGround('fox',p[0],p[1],{s:AR(0.9,1.1)})); }
  W.rabbit=[]; for(let i=0;i<rabbits;i++){ const p=findSpot(P.x,P.z,i<4?10:15,i<4?25:90); if(p) W.rabbit.push(newGround('rabbit',p[0],p[1],{s:AR(0.85,1.15)})); }
  const nD=W.deer.length;
  W.mDeerT=animMesh(A.deerTorso,matAnimal,nD,true);
  W.mDeerHD=animMesh(A.deerHeadDoe,matAnimal,nD,true);
  W.mDeerHB=animMesh(A.deerHeadBuck,matAnimal,nD,true);
  W.mDeerL=animMesh(A.deerLeg,matAnimal,nD*4,true);
  W.mFox=animMesh(A.foxBody,matAnimal,W.fox.length,true);
  W.mFoxL=animMesh(A.foxLeg,matAnimal,W.fox.length*4,true);
  W.mRabbit=animMesh(A.rabbit,matAnimal,W.rabbit.length,true);
  // ducks live on open water
  W.duck=[];
  for(let i=0;i<6000 && W.duck.length<ducks;i++){
    const x=AR(-HALF+20,HALF-20), z=AR(-HALF+20,HALF-20);
    if(getH(x,z)<-1){ const n=1+Math.floor(Math.random()*3); for(let k=0;k<n&&W.duck.length<ducks;k++) W.duck.push({x:x+AR(-1.5,1.5),z:z+AR(-1.5,1.5),h:AR(0,TAU),goal:AR(0,TAU),sp:0,timer:AR(0,4),dab:0,ph:AR(0,TAU)}); }
  }
  W.mDuck=animMesh(A.duck,matAnimal,W.duck.length,true);
  // birds
  W.flocks=[]; let nb=0;
  for(let f=0;f<flocks;f++){
    const fl={ox:AR(-60,60),oz:AR(-60,60),ax:P.x,az:P.z,ang:AR(0,TAU),rad:AR(18,34),speed:AR(7,10)*(Math.random()<0.5?1:-1),h:AR(22,34),birds:[]};
    const n=LOW?5:7;
    for(let k=0;k<n;k++){ fl.birds.push({off:k*AR(0.18,0.3),ro:AR(-3,3),hoff:AR(-2,2),idx:nb++}); }
    fl.ax=P.x+fl.ox; fl.az=P.z+fl.oz; W.flocks.push(fl);
  }
  W.mBird=animMesh(A.bird,matAnimal,nb,true);
  W.mBWL=animMesh(A.birdWingL,matFlat,nb,true);
  W.mBWR=animMesh(A.birdWingR,matFlat,nb,true);
  const dark=new THREE.Color(0x303036);
  for(let i=0;i<nb;i++){ W.mBWL.setColorAt(i,dark); W.mBWR.setColorAt(i,dark); }
  // butterflies
  W.flies=[];
  const fcol=[0xf29a38,0xf4f1e6,0xf3d64a,0x6fa3f0,0xc85a8e];
  W.mFlyL=animMesh(A.flyL,matFlat,flies,false); W.mFlyR=animMesh(A.flyR,matFlat,flies,false);
  for(let i=0;i<flies;i++){
    const c=new THREE.Color(APick(fcol));
    W.flies.push({x:P.x+AR(-28,28),z:P.z+AR(-28,28),h:AR(0,TAU),sp:AR(0.8,1.6),ph:AR(0,TAU)});
    W.mFlyL.setColorAt(i,c); W.mFlyR.setColorAt(i,c);
  }
  W.ready=true;
}

function chooseState(a){
  const K=KIND[a.kind], r=Math.random();
  if(a.kind==='deer'){
    if(r<0.5){ a.state='graze'; a.timer=AR(4,9); }
    else if(r<0.85){ a.state='walk'; a.timer=AR(3,7); a.goal=a.heading+AR(-1.2,1.2); }
    else { a.state='idle'; a.timer=AR(2,4); }
  } else if(a.kind==='fox'){
    if(r<0.7){ a.state='walk'; a.timer=AR(4,8); a.goal=a.heading+AR(-1,1); }
    else if(r<0.87){ a.state='graze'; a.timer=AR(1.5,3); }
    else { a.state='idle'; a.timer=AR(1.5,3); }
  } else {
    if(r<0.55){ a.state='graze'; a.timer=AR(1.5,5); }
    else if(r<0.9){ a.state='walk'; a.timer=AR(0.6,1.6); a.goal=a.heading+AR(-1.5,1.5); }
    else { a.state='idle'; a.timer=AR(1,3); }
  }
  // stay with the herd
  if(a.herd && a.herd.n && a.state==='walk'){
    const hx=a.herd.cx-a.x, hz=a.herd.cz-a.z;
    if(Math.hypot(hx,hz)>7) a.goal=Math.atan2(-hx,-hz);
  }
}
function relocate(list){
  const back=P.yaw; // behind the camera is the +sin/+cos direction
  const base=findSpot(P.x,P.z,60,100,Math.atan2(Math.sin(back),Math.cos(back)),1.4)||findSpot(P.x,P.z,60,100);
  if(!base) return;
  for(const a of list){ const p=findSpot(base[0],base[1],0,6)||base; a.x=p[0]; a.z=p[1]; a.state='idle'; a.timer=AR(0,2); a.speed=0; }
}
function updateGround(a,dt){
  const K=KIND[a.kind];
  const dx=a.x-P.x, dz=a.z-P.z, d=Math.hypot(dx,dz)||1;
  a.timer-=dt;
  if(started && d<K.flee*(a.s<0.75?1.2:1)){ a.state='flee'; a.timer=AR(2,3.5); }
  if(a.state==='flee'){
    a.goal=Math.atan2(-dx,-dz); // run directly away from the player
    if(a.kind==='rabbit') a.goal+=Math.sin(t*5+a.ph0)*0.8;
    if(a.timer<=0){ a.state='idle'; a.timer=AR(1,3); }
  } else if(started && K.alert && d<K.alert){
    if(a.state!=='alert'){ a.state='alert'; a.timer=AR(2,5); }
  } else if(a.timer<=0) chooseState(a);

  // look ahead for water, cliffs and the world edge
  const moving=a.state==='walk'||a.state==='flee';
  if(moving){
    const ax=a.x-Math.sin(a.heading)*2, az=a.z-Math.cos(a.heading)*2;
    if(!groundOK(ax,az)) a.goal=a.heading+Math.PI*AR(0.7,1.3);
  }
  const tgt=a.state==='walk'?K.walk:a.state==='flee'?K.run:0;
  a.speed+=(tgt-a.speed)*Math.min(1,dt*(a.state==='flee'?5:3));
  if(moving){ const df=angDiff(a.goal,a.heading), rate=(a.state==='flee'?5:2)*dt; a.heading+=clamp(df,-rate,rate); }
  const sp=a.speed*(a.kind==='rabbit'&&a.state==='walk'?(Math.sin(a.phase)>0?1.6:0.3):1);
  a.x-=Math.sin(a.heading)*sp*dt; a.z-=Math.cos(a.heading)*sp*dt;
  nearCols(a.x,a.z,(cx,cz,r)=>{ const ex=a.x-cx, ez=a.z-cz, e=Math.hypot(ex,ez), m=r+K.rad; if(e<m&&e>1e-4){ a.x=cx+ex/e*m; a.z=cz+ez/e*m; } });
  a.y=getH(a.x,a.z);
  const l=0.6*a.s, hf=getH(a.x-Math.sin(a.heading)*l,a.z-Math.cos(a.heading)*l), hb=getH(a.x+Math.sin(a.heading)*l,a.z+Math.cos(a.heading)*l);
  a.pitch=Math.atan2(hf-hb,2*l);
  a.phase+=Math.max(a.speed,a.kind==='rabbit'&&a.state==='walk'?1.5:0)*dt*K.stride;

  // head pose
  let hp=-0.2, hy=0;
  if(a.state==='graze') hp=K.graze+Math.sin(t*3+a.ph0)*0.05;
  else if(a.state==='alert'){ hp=0.18; hy=clamp(angDiff(Math.atan2(dx,dz),a.heading),-1.1,1.1); }
  else if(a.state==='idle'){ hp=0.05; hy=Math.sin(t*0.6+a.ph0)*0.6; }
  else if(a.state==='flee') hp=0.05;
  a.hp+=(hp-a.hp)*Math.min(1,dt*4); a.hy+=(hy-a.hy)*Math.min(1,dt*4);
  return d;
}

function updateAnimals(dt){
  if(!W.ready) return;
  const night=envCur.night;
  // deer herds
  for(const h of W.herds){ h.cx=0; h.cz=0; h.n=0; h.far=true; }
  for(const a of W.deer){ a.herd.cx+=a.x; a.herd.cz+=a.z; a.herd.n++; }
  for(const h of W.herds){ if(h.n){ h.cx/=h.n; h.cz/=h.n; } }
  W.deer.forEach((a,i)=>{
    const d=updateGround(a,dt); if(d<115) a.herd.far=false;
    baseM(_am,a.x,a.y,a.z,a.heading,a.pitch,0,a.s);
    W.mDeerT.setMatrixAt(i,_am);
    partM(_bm,_am,0,1.15,-0.45,a.hp,a.hy,0);
    (a.buck?W.mDeerHB:W.mDeerHD).setMatrixAt(i,_bm);
    (a.buck?W.mDeerHD:W.mDeerHB).setMatrixAt(i,ZERO);
    const amp=Math.min(a.speed/KIND.deer.walk,1)*0.45+(a.state==='flee'?0.3:0);
    KIND.deer.legs.forEach((lg,k)=>{ partM(_bm,_am,lg[0],KIND.deer.legY,lg[1],Math.sin(a.phase+GAIT[k])*amp,0,0); W.mDeerL.setMatrixAt(i*4+k,_bm); });
  });
  for(const h of W.herds) if(h.far) relocate(W.deer.filter(a=>a.herd===h));
  W.fox.forEach((a,i)=>{
    const d=updateGround(a,dt); if(d>115) relocate([a]);
    baseM(_am,a.x,a.y,a.z,a.heading,a.pitch+(a.state==='graze'?-0.2:0),0,a.s);
    W.mFox.setMatrixAt(i,_am);
    const amp=Math.min(a.speed/KIND.fox.walk,1)*0.6;
    KIND.fox.legs.forEach((lg,k)=>{ partM(_bm,_am,lg[0],KIND.fox.legY,lg[1],Math.sin(a.phase+GAIT[k])*amp,0,0); W.mFoxL.setMatrixAt(i*4+k,_bm); });
  });
  W.rabbit.forEach((a,i)=>{
    const d=updateGround(a,dt); if(d>100) relocate([a]);
    const hopping=a.speed>0.3;
    const hop=hopping?Math.abs(Math.sin(a.phase*0.5))*0.2*Math.min(1,a.speed/2):0;
    const tilt=hopping?Math.cos(a.phase*0.5)*0.35:(a.state==='graze'?-0.25+Math.sin(t*9+a.ph0)*0.03:(a.state==='alert'?0.35:0));
    baseM(_am,a.x,a.y+hop,a.z,a.heading+(a.state==='alert'?a.hy*0.5:0),a.pitch+tilt,0,a.s);
    W.mRabbit.setMatrixAt(i,_am);
  });
  // ducks
  W.duck.forEach((b,i)=>{
    const dx=b.x-P.x, dz=b.z-P.z, d=Math.hypot(dx,dz);
    b.timer-=dt; b.dab=Math.max(0,b.dab-dt);
    if(started && d<7){ b.goal=Math.atan2(-dx,-dz); b.sp=1.6; b.timer=1.5; }
    else if(b.timer<=0){ b.timer=AR(2,6); b.goal=b.h+AR(-1.5,1.5); b.sp=Math.random()<0.3?0:AR(0.2,0.6); if(Math.random()<0.25) b.dab=AR(1,2); }
    const ax=b.x-Math.sin(b.h)*1.2, az=b.z-Math.cos(b.h)*1.2;
    if(getH(ax,az)>-0.35) b.goal=b.h+Math.PI*AR(0.7,1.3);
    b.h+=clamp(angDiff(b.goal,b.h),-1.5*dt,1.5*dt);
    b.x-=Math.sin(b.h)*b.sp*dt; b.z-=Math.cos(b.h)*b.sp*dt;
    const dabP=b.dab>0?-0.9:0;
    baseM(_am,b.x,WATER+Math.sin(t*1.8+b.ph)*0.015,b.z,b.h,dabP,Math.sin(t*1.3+b.ph)*0.05,1);
    W.mDuck.setMatrixAt(i,_am);
  });
  // birds by day, bats by night
  for(const f of W.flocks){
    f.ax+=(P.x+f.ox-f.ax)*dt*0.05; f.az+=(P.z+f.oz-f.az)*dt*0.05;
    const bat=night>0.5, rad=f.rad*(bat?0.45:1);
    f.ang+=dt*f.speed/rad*(bat?1.8:1);
    for(const b of f.birds){
      const th=f.ang-b.off*Math.sign(f.speed), r=rad+b.ro;
      const x=f.ax+Math.cos(th)*r, z=f.az+Math.sin(th)*r;
      const y=Math.max(getH(x,z),WATER)+lerp(f.h,7,night)+b.hoff+Math.sin(t*0.7+b.off*3)*1.5+(bat?Math.sin(t*9+b.off*20)*0.6:0);
      const heading=f.speed>0?Math.PI-th:-th;
      const gliding=!bat&&Math.sin(t*0.4+b.off*5)<-0.3;
      const flap=gliding?0.08:Math.sin(t*(bat?22:9)+b.off*7)*0.8;
      baseM(_am,x,y,z,heading,0,0.3*Math.sign(f.speed),bat?0.8:1.3);
      W.mBird.setMatrixAt(b.idx,_am);
      partM(_bm,_am,0.03,0,0,0,0,flap); W.mBWL.setMatrixAt(b.idx,_bm);
      partM(_bm,_am,-0.03,0,0,0,0,-flap); W.mBWR.setMatrixAt(b.idx,_bm);
    }
  }
  // butterflies (daytime, near the ground)
  const showFly=night<0.6;
  W.flies.forEach((b,i)=>{
    if(!showFly){ W.mFlyL.setMatrixAt(i,ZERO); W.mFlyR.setMatrixAt(i,ZERO); return; }
    b.h+=(Math.sin(t*1.3+b.ph)*1.5+Math.sin(t*3.1+b.ph*2))*dt;
    b.x-=Math.sin(b.h)*b.sp*dt; b.z-=Math.cos(b.h)*b.sp*dt;
    if(b.x-P.x>30) b.x-=60; else if(b.x-P.x<-30) b.x+=60;
    if(b.z-P.z>30) b.z-=60; else if(b.z-P.z<-30) b.z+=60;
    const y=Math.max(getH(b.x,b.z),WATER)+0.55+Math.sin(t*2.3+b.ph)*0.35;
    const a=0.2+(Math.sin(t*22+b.ph)*0.5+0.5)*1.2;
    baseM(_am,b.x,y,b.z,b.h,0.2,0,1.5);
    partM(_bm,_am,0,0,0,0,0,a); W.mFlyL.setMatrixAt(i,_bm);
    partM(_bm,_am,0,0,0,0,0,-a); W.mFlyR.setMatrixAt(i,_bm);
  });
  [W.mDeerT,W.mDeerHD,W.mDeerHB,W.mDeerL,W.mFox,W.mFoxL,W.mRabbit,W.mDuck,W.mBird,W.mBWL,W.mBWR,W.mFlyL,W.mFlyR].forEach(m=>m.instanceMatrix.needsUpdate=true);
}

