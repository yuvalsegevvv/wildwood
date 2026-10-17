//@ The effects beyond light: scorch marks, dust and smoke, flying debris, jagged lightning, rotating rune circles, slash crescents, shock domes and the screen flash
/* Agent map. Built on the spark pool (fx-pool.js). Pools are fixed (phones get fewer), meshes are reused or disposed when done; fxxUpdate(dt) runs from updateSkillFx.
   fxxScorch(x,z,r,col)   a dark burn mark with a glowing crack ring that fades over a few seconds (big impacts: meteor, quake, boss slams)
   fxxDust(x,y,z,n,r,col) a puff of dust or smoke rolling out and up (landings, slams, deaths)
   fxxDebris(x,y,z,n,sp,col) chunks of ground thrown up that tumble and land (quake, meteor, slams)
   fxxBolt(a,b,col,w)     a jagged lightning bolt with branches that flickers for a quarter second
   fxxRune(x,y,z,r,col,life) a glyph circle (ring, triangle, hexagon) turning on the ground: casts and telegraphs
   fxxSlash(x,y,z,face,col,size) a thin bright crescent that sweeps through a blow
   fxxDome(x,y,z,r,col)   a translucent shock dome that swells and fades (explosions)
   fxxFlash(col,a)        a full-screen flash for a big hit near you
   Callers: attacks.js (spawnArcAt, kills, swings), skill-fx.js (meteor, chain, beam, casts, dash), boss.js (telegraphs). Test: client-smoke. */
const FXX={scorch:[],bolts:[],runes:[],domes:[],slashes:[],debris:null,flashEl:null,flashA:0};
const FXX_DEB=LOW?24:64, FXX_SCORCH=LOW?3:8, FXX_BOLTS=LOW?4:10;
const fxxDiscGeo=new THREE.CircleGeometry(1,28).rotateX(-Math.PI/2), fxxCrackGeo=new THREE.RingGeometry(0.72,1,28).rotateX(-Math.PI/2);
const fxxTriGeo=new THREE.RingGeometry(0.9,1,3).rotateX(-Math.PI/2), fxxHexGeo=new THREE.RingGeometry(0.93,1,6).rotateX(-Math.PI/2), fxxRingGeo=new THREE.RingGeometry(0.97,1,40).rotateX(-Math.PI/2);
const fxxCrescentGeo=new THREE.RingGeometry(1.5,2.3,20,1,-Math.PI*0.42,Math.PI*0.84).rotateX(-Math.PI/2), fxxDomeGeo=new THREE.SphereGeometry(1,16,10,0,TAU,0,Math.PI/2);
const fxxDebGeo=new THREE.BoxGeometry(0.28,0.2,0.24), fxxDebMat=new THREE.MeshBasicMaterial({color:0xffffff});
const fxxDebDummy=new THREE.Object3D(), fxxDebCol=new THREE.Color();
function fxxInitDebris(){
  const m=new THREE.InstancedMesh(fxxDebGeo,fxxDebMat,FXX_DEB); m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(FXX_DEB*3),3);   // (every instanced mesh needs colours: CLAUDE.md section 8)
  m.frustumCulled=false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  fxxDebDummy.scale.setScalar(0); fxxDebDummy.updateMatrix(); for(let i=0;i<FXX_DEB;i++) m.setMatrixAt(i,fxxDebDummy.matrix);
  scene.add(m); FXX.debris={m,i:0,live:0,p:new Float32Array(FXX_DEB*3),v:new Float32Array(FXX_DEB*3),r:new Float32Array(FXX_DEB*3),w:new Float32Array(FXX_DEB*3),life:new Float32Array(FXX_DEB),sz:new Float32Array(FXX_DEB)};
}
function fxxDebris(x,y,z,n,sp,col){
  if(!FXX.debris) fxxInitDebris(); const D=FXX.debris; n=fxpN(n);
  for(let k=0;k<n;k++){ const i=D.i, a=AR(0,TAU), h=AR(0.3,1)*sp, j=i*3; D.i=(i+1)%FXX_DEB;
    D.p[j]=x+Math.sin(a)*0.5; D.p[j+1]=y+0.2; D.p[j+2]=z+Math.cos(a)*0.5; D.v[j]=Math.sin(a)*h; D.v[j+1]=AR(0.6,1.2)*sp*1.3; D.v[j+2]=Math.cos(a)*h;
    D.r[j]=AR(0,TAU); D.r[j+1]=AR(0,TAU); D.r[j+2]=AR(0,TAU); D.w[j]=AR(-9,9); D.w[j+1]=AR(-9,9); D.w[j+2]=AR(-9,9);
    D.life[i]=AR(0.9,1.5); D.sz[i]=AR(0.6,1.5); fxxDebCol.setHex(col||0x6a5030).multiplyScalar(AR(0.7,1.2)); D.m.setColorAt(i,fxxDebCol); D.live=FXX_DEB; }
  D.m.instanceColor.needsUpdate=true;
}
function fxxDebrisStep(dt){
  const D=FXX.debris; if(!D||!D.live) return; let live=0;
  for(let i=0;i<FXX_DEB;i++){ const j=i*3; let l=D.life[i];
    if(l<=0){ continue; } l-=dt; D.life[i]=l;
    if(l<=0){ fxxDebDummy.scale.setScalar(0); fxxDebDummy.updateMatrix(); D.m.setMatrixAt(i,fxxDebDummy.matrix); continue; }
    live++; D.v[j+1]-=16*dt; D.p[j]+=D.v[j]*dt; D.p[j+1]+=D.v[j+1]*dt; D.p[j+2]+=D.v[j+2]*dt;
    const gy=getH(D.p[j],D.p[j+2])+0.1;
    if(D.p[j+1]<gy){ D.p[j+1]=gy; D.v[j+1]*=-0.3; D.v[j]*=0.5; D.v[j+2]*=0.5; if(Math.abs(D.v[j+1])<0.8){ D.v[j+1]=0; D.w[j]=D.w[j+1]=D.w[j+2]=0; } }
    D.r[j]+=D.w[j]*dt; D.r[j+1]+=D.w[j+1]*dt; D.r[j+2]+=D.w[j+2]*dt;
    fxxDebDummy.position.set(D.p[j],D.p[j+1],D.p[j+2]); fxxDebDummy.rotation.set(D.r[j],D.r[j+1],D.r[j+2]); fxxDebDummy.scale.setScalar(D.sz[i]*Math.min(1,l*3)); fxxDebDummy.updateMatrix(); D.m.setMatrixAt(i,fxxDebDummy.matrix); }
  D.live=live; D.m.instanceMatrix.needsUpdate=true;
}
function fxxDust(x,y,z,n,r,col){   // a ring of dust billowing out and up
  n=fxpN(n); col=col||0x9a8a70;
  for(let k=0;k<n;k++){ const a=AR(0,TAU), s=AR(0.4,1)*r;
    fxpSmoke(x+Math.sin(a)*r*0.2,y+0.2,z+Math.cos(a)*r*0.2,Math.sin(a)*s*1.6,AR(0.4,1.4),Math.cos(a)*s*1.6,col,AR(0.5,0.9)*(1+r*0.12),AR(0.8,1.4),{drag:1.8,grow:2.4,a:0.45,g:-0.2}); }
}
function fxxScorch(x,z,r,col){
  while(FXX.scorch.length>=FXX_SCORCH){ const o=FXX.scorch.shift(); scene.remove(o.disc,o.crack); o.disc.material.dispose(); o.crack.material.dispose(); }
  const y=getH(x,z)+0.06, disc=new THREE.Mesh(fxxDiscGeo,new THREE.MeshBasicMaterial({color:0x14100c,transparent:true,opacity:0.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2})),
    crack=new THREE.Mesh(fxxCrackGeo,fxMat(col,0.9));
  disc.position.set(x,y,z); crack.position.set(x,y+0.02,z); disc.scale.setScalar(r*0.9); crack.scale.setScalar(r*0.85); disc.rotation.y=crack.rotation.y=AR(0,TAU); scene.add(disc,crack);
  FXX.scorch.push({disc,crack,t:0,life:5});
}
function fxxBolt(a,b,col,w){
  if(FXX.bolts.length>=FXX_BOLTS){ const o=FXX.bolts.shift(); scene.remove(o.core,o.glow); o.core.geometry.dispose(); o.core.material.dispose(); o.glow.geometry.dispose(); o.glow.material.dispose(); }
  const N=10, mk=(c,op)=>{ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array((N+1)*3*3),3)); const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:c,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false})); l.frustumCulled=false; scene.add(l); return l; };
  const B={a,b,w:w||1,t:0,life:0.28,core:mk(0xffffff,1),glow:mk(col,0.7),seed:0}; FXX.bolts.push(B); fxxBoltShape(B);
}
function fxxBoltShape(B){   // main line from a to b with random kinks, plus one short branch off the middle; reshaped every frame so it crawls
  const A=B.a, E=B.b, N=10, len=Math.hypot(E[0]-A[0],E[1]-A[1],E[2]-A[2])||1, j=Math.min(1.2,len*0.07)*B.w;
  for(const l of [B.core,B.glow]){ const p=l.geometry.attributes.position.array; let n=0;
    const put=(x,y,z)=>{ p[n++]=x; p[n++]=y; p[n++]=z; };
    for(let k=0;k<=N;k++){ const f=k/N, e=(k===0||k===N)?0:1, jj=l===B.glow?j*1.8:j; put(A[0]+(E[0]-A[0])*f+AR(-jj,jj)*e,A[1]+(E[1]-A[1])*f+AR(-jj,jj)*e,A[2]+(E[2]-A[2])*f+AR(-jj,jj)*e); }
    for(let k=0;k<=N;k++){ const f=0.5+k/N*0.3; put(A[0]+(E[0]-A[0])*0.5+(E[0]-A[0])*(f-0.5)*0.4+AR(-j,j)*2*k/N,A[1]+(E[1]-A[1])*0.5+(k/N)*-j*2+AR(-j,j)*k/N,A[2]+(E[2]-A[2])*0.5+(E[2]-A[2])*(f-0.5)*0.4+AR(-j,j)*2*k/N); }
    for(;n<p.length;) put(E[0],E[1],E[2]);
    l.geometry.attributes.position.needsUpdate=true; }
}
function fxxRune(x,y,z,r,col,life){   // a glyph circle turning on the ground: an outer ring, a triangle and a hexagon turning against each other
  life=life||0.9; const g=new THREE.Group(), mats=[];
  for(const [geo,s,sp] of [[fxxRingGeo,1,0],[fxxTriGeo,0.8,2.2],[fxxHexGeo,0.58,-3],[fxxTriGeo,0.4,-2.2]]){ const m=fxMat(col,0.85), o=new THREE.Mesh(geo,m); o.scale.setScalar(r*s); o.userData.sp=sp; g.add(o); mats.push(m); }
  g.position.set(x,y+0.1,z); scene.add(g); FXX.runes.push({g,mats,t:0,life});
}
function fxxSlash(x,y,z,face,col,size){
  const m=fxMat(col,0.9), o=new THREE.Mesh(fxxCrescentGeo,m); o.position.set(x,y,z); o.rotation.y=face+Math.PI/2-0.9; o.scale.set(size,size,size*0.55); o.rotation.z=AR(-0.5,0.5); scene.add(o);
  FXX.slashes.push({o,t:0,life:0.2,face,sweep:1.8});
}
function fxxDome(x,y,z,r,col){
  const m=fxMat(col,0.5), o=new THREE.Mesh(fxxDomeGeo,m); o.position.set(x,y,z); o.scale.setScalar(0.3); scene.add(o); FXX.domes.push({o,r,t:0,life:0.42});
}
function fxxFlash(col,a){
  try{
    if(!FXX.flashEl){ const e=document.createElement('div'); e.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:3;opacity:0;mix-blend-mode:screen'; document.body.appendChild(e); FXX.flashEl=e; }
    FXX.flashEl.style.background='radial-gradient(circle at 50% 50%,rgba(0,0,0,0) 30%,#'+(col&0xffffff).toString(16).padStart(6,'0')+' 130%)'; FXX.flashA=Math.max(FXX.flashA,a);
  }catch(_){}
}
function fxxUpdate(dt){
  fxxDebrisStep(dt);
  for(let i=FXX.scorch.length-1;i>=0;i--){ const o=FXX.scorch[i]; o.t+=dt; const k=o.t/o.life; o.disc.material.opacity=0.5*(1-Math.max(0,(k-0.4)/0.6)); o.crack.material.opacity=0.9*Math.max(0,1-k*2.2)*(0.7+0.3*Math.sin(t*10));
    if(k>=1){ scene.remove(o.disc,o.crack); o.disc.material.dispose(); o.crack.material.dispose(); FXX.scorch.splice(i,1); } }
  for(let i=FXX.bolts.length-1;i>=0;i--){ const B=FXX.bolts[i]; B.t+=dt; const k=B.t/B.life;
    if(k>=1){ scene.remove(B.core,B.glow); B.core.geometry.dispose(); B.core.material.dispose(); B.glow.geometry.dispose(); B.glow.material.dispose(); FXX.bolts.splice(i,1); continue; }
    if((B.seed+=dt)>0.04){ B.seed=0; fxxBoltShape(B); } B.core.material.opacity=1-k; B.glow.material.opacity=0.7*(1-k); }
  for(let i=FXX.runes.length-1;i>=0;i--){ const R=FXX.runes[i]; R.t+=dt; const k=R.t/R.life, op=0.85*Math.min(1,k*6)*(1-Math.max(0,(k-0.6)/0.4));
    R.g.children.forEach(c=>{ c.rotation.y+=c.userData.sp*dt; }); for(const m of R.mats) m.opacity=op;
    if(k>=1){ scene.remove(R.g); for(const m of R.mats) m.dispose(); FXX.runes.splice(i,1); } }
  for(let i=FXX.slashes.length-1;i>=0;i--){ const S=FXX.slashes[i]; S.t+=dt; const k=S.t/S.life; S.o.rotation.y+=S.sweep*dt/S.life*0.5; S.o.material.opacity=0.9*(1-k*k);
    if(k>=1){ scene.remove(S.o); S.o.material.dispose(); FXX.slashes.splice(i,1); } }
  for(let i=FXX.domes.length-1;i>=0;i--){ const D=FXX.domes[i]; D.t+=dt; const k=D.t/D.life; D.o.scale.setScalar(D.r*(1-(1-k)*(1-k))+0.3); D.o.material.opacity=0.5*(1-k);
    if(k>=1){ scene.remove(D.o); D.o.material.dispose(); FXX.domes.splice(i,1); } }
  if(FXX.flashEl&&FXX.flashA>0){ FXX.flashA=Math.max(0,FXX.flashA-dt*2.2); FXX.flashEl.style.opacity=String(FXX.flashA); }
}
