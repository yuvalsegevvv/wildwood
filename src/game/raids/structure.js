//@ The six raid ruins: walls with a gate and a broken inner wall, towers, braziers and banners in each land's own stone and style; fires and banners go out when the raid is cleared
/* Agent map. Data: RDS / RD_LAYOUT (shared/raids.js); the site, the court and the yard are those pads (flattened by terrain-height.js through ARENAS). buildRaids() is called by genTerrain
   (world/generation-setup.js, next to buildProvingIsle); rdStructRefresh(i) by hud.js when a raid's state changes (fires and banners are lit while it is not cleared). RD_LOOKS: one palette
   and one extra per raid.look (thorn, kuro, jarn, stone, sand, wrack). Each raid is 3 merged meshes (stone, wood, cloth) and 2 small ones (fire, banners): a handful of draw calls,
   hidden beyond 450 m. Colliders: a circle per standing wall segment and tower (addCol), none in the gates. Test: tools/raids-smoke.js (client part). */
const RD_LOOKS={
  thorn:{wall:0x6e6a5c,trim:0x4a4030,cloth:0x4f7a2c,flame:0xffa040,extra:'spikes'},
  kuro:{wall:0x4a3f3a,trim:0x2a1e1a,cloth:0xa02828,flame:0xff6a30,extra:'torii'},
  jarn:{wall:0x8a96a4,trim:0x5c6672,cloth:0x3a5a8a,flame:0x8fdcff,extra:'icicles'},
  stone:{wall:0x6a6a70,trim:0x45454c,cloth:0x8a6a3a,flame:0xffb050,extra:'rubble'},
  sand:{wall:0xc4a56a,trim:0x9a7e4a,cloth:0xb8862a,flame:0xffd070,extra:'dune'},
  wrack:{wall:0x3a4650,trim:0x24303a,cloth:0x2a6a6a,flame:0x70e0d0,extra:'wreck'}
};
const RDV=[];   // per raid: {R, fire, cloth, group}
const RD_WALL_T=2.4, RD_SEG=3;
function rdBuildOne(R,idx){
  const L=RD_LOOKS[R.look]||RD_LOOKS.stone, ox=R.x, oz=R.z, stone=[], wood=[], cloth=[], fire=[];
  const sc=(x,y,z,nx,ny,nz,c)=>{ c.set(L.wall).multiplyScalar(0.78+0.4*h3(Math.floor(x*2),Math.floor(y*2),Math.floor(z*2))); };
  const tc=(x,y,z,nx,ny,nz,c)=>{ c.set(L.trim).multiplyScalar(0.8+0.35*h3(Math.floor(x*3),Math.floor(y*3),Math.floor(z*3))); };
  const cc=(x,y,z,nx,ny,nz,c)=>{ c.set(L.cloth).multiplyScalar(0.85+Math.sin(y*5)*0.08); };
  const fc=(x,y,z,nx,ny,nz,c)=>{ c.set(L.flame); };
  const gh=(lx,lz)=>getH(ox+lx,oz+lz);
  // a wall run from (x1,z1) to (x2,z2) in site coordinates: segments of random height (some collapsed), a gap where gap(x,z) says so
  function wall(x1,z1,x2,z2,hMax,gap,seed){
    const len=Math.hypot(x2-x1,z2-z1), n=Math.ceil(len/RD_SEG), ax=Math.abs(x2-x1)>Math.abs(z2-z1);
    for(let i=0;i<n;i++){
      const u=(i+0.5)/n, lx=x1+(x2-x1)*u, lz=z1+(z2-z1)*u; if(gap&&gap(lx,lz)) continue;
      const r=h3(i,seed,7), h=r>0.82?0.9+r:hMax*(0.4+0.6*h3(i,seed,3)), y0=gh(lx,lz)-1.2, w=len/n+0.05;
      stone.push(paint(new THREE.BoxGeometry(ax?w:RD_WALL_T,h+1.2,ax?RD_WALL_T:w).translate(ox+lx,y0+(h+1.2)/2,oz+lz),sc));
      if(h>1.6&&!LOW) stone.push(paint(new THREE.BoxGeometry(ax?w*0.4:RD_WALL_T+0.3,0.7,ax?RD_WALL_T+0.3:w*0.4).translate(ox+lx+(ax?0.9:0),y0+h+1.2+0.35,oz+lz+(ax?0:0.9)),tc));   // a merlon
      if(h>1.6) addCol(ox+lx,oz+lz,1.7);
    }
  }
  function tower(lx,lz,r,h){
    const y0=gh(lx,lz)-1.2;
    stone.push(paint(new THREE.CylinderGeometry(r,r*1.12,h+1.2,10).translate(ox+lx,y0+(h+1.2)/2,oz+lz),sc));
    stone.push(paint(new THREE.CylinderGeometry(r*1.18,r*1.18,0.5,10).translate(ox+lx,y0+h+1.4,oz+lz),tc));
    for(let k=0;k<6;k++){ const a=k/6*TAU+(h3(k,lx,lz)>0.7?0.4:0); if(h3(k,lz,9)>0.75) continue; stone.push(paint(new THREE.BoxGeometry(0.9,0.9,0.9).translate(ox+lx+Math.sin(a)*r*1.05,y0+h+1.9,oz+lz+Math.cos(a)*r*1.05),tc)); }
    addCol(ox+lx,oz+lz,r+0.5);
  }
  function brazier(lx,lz){
    const y=gh(lx,lz);
    wood.push(paint(new THREE.CylinderGeometry(0.12,0.18,1.6,6).translate(ox+lx,y+0.8,oz+lz),tc));
    wood.push(paint(new THREE.CylinderGeometry(0.5,0.3,0.35,8).translate(ox+lx,y+1.7,oz+lz),tc));
    fire.push(paint(new THREE.ConeGeometry(0.34,0.9,6).translate(ox+lx,y+2.2,oz+lz),fc));
  }
  function banner(lx,lz,face,h){ const y=gh(lx,lz); cloth.push(paint(new THREE.BoxGeometry(0.06,h||3.2,1.5).rotateY(face).translate(ox+lx,y+(h||3.2)/2+3.2,oz+lz),cc)); }
  const gate=(x,z)=>z<-30&&Math.abs(x)<5.2, door=(x,z)=>Math.abs(z)<2&&Math.abs(x)<14;
  wall(-38,-40,38,-40,6.5,gate,1); wall(-38,44,38,44,6,null,2); wall(-38,-40,-38,44,6,null,3); wall(38,-40,38,44,6,null,4); wall(-38,0,38,0,5,door,5);
  for(const [x,z] of [[-38,-40],[38,-40],[-38,44],[38,44]]) tower(x,z,3.8,11);
  for(const x of [-8,8]) tower(x,-40,2.9,9);
  for(const x of [-14,14]) tower(x,0,2.7,7.5);
  for(const [x,z] of [[-3.5,-37],[3.5,-37],[-20,-14],[20,-14],[-14,6],[14,6]]) brazier(x,z);
  for(const [x,z,f] of [[-8,-37,0],[8,-37,0],[-14,-3,0],[14,-3,0],[-38,10,Math.PI/2],[38,10,Math.PI/2]]) banner(x,z,f);
  // the land's own extra
  const ex=L.extra;
  if(ex==='spikes'){ for(let k=0;k<(LOW?6:16);k++){ const lx=-36+k*4.7, y=gh(lx,-40); stone.push(paint(new THREE.ConeGeometry(0.28,1.8,5).translate(ox+lx,y+6.4,oz-40.8),tc)); } }
  if(ex==='torii'){ for(const s of [-1,1]) wood.push(paint(new THREE.CylinderGeometry(0.4,0.45,8,8).translate(ox+s*5.4,gh(s*5.4,-40)+4,oz-40),cc)); wood.push(paint(new THREE.BoxGeometry(14,0.7,0.8).translate(ox,gh(0,-40)+8.4,oz-40),cc),paint(new THREE.BoxGeometry(11.6,0.5,0.6).translate(ox,gh(0,-40)+7.2,oz-40),tc)); }
  if(ex==='icicles'){ for(let k=0;k<(LOW?8:24);k++){ const lx=-36+k*3.1, y=gh(lx,-40); stone.push(paint(new THREE.ConeGeometry(0.2,1.2+h3(k,3,3),5).rotateX(Math.PI).translate(ox+lx,y+5.2,oz-40),(x,yy,z,nx,ny,nz,c)=>{ c.set(0xdff0ff); })); } for(const [x,z] of [[-38,-40],[38,-40],[-38,44],[38,44]]) stone.push(paint(new THREE.CylinderGeometry(3.9,3.9,0.4,10).translate(ox+x,gh(x,z)+12.4,oz+z),(xx,yy,zz,nx,ny,nz,c)=>{ c.set(0xf2f8ff); })); }
  if(ex==='rubble'){ for(let k=0;k<(LOW?8:18);k++){ const a=h3(k,1,5)*TAU, r=12+h3(k,2,5)*22, lx=Math.sin(a)*r, lz=-8+Math.cos(a)*r*1.2; if(Math.abs(lx)>36||lz<-38||lz>42) continue; const s=0.8+h3(k,3,5)*1.6; stone.push(paint(new THREE.BoxGeometry(s,s*0.7,s*1.2).rotateY(a).rotateZ(h3(k,4,5)*0.5).translate(ox+lx,gh(lx,lz)+s*0.3,oz+lz),sc)); } wood.push(paint(new THREE.BoxGeometry(1.2,0.7,11).rotateY(0.25).rotateX(0.18).translate(ox-4,gh(-4,-33)+1.4,oz-33),tc)); }   // a fallen bridge-gate beam
  if(ex==='dune'){ for(let k=0;k<(LOW?4:9);k++){ const lx=k<5?33+h3(k,1,2)*4:-12+h3(k,2,2)*24, lz=k<5?-30+k*14:-44+h3(k,3,3)*3, s=5+h3(k,4,3)*4; stone.push(paint(new THREE.SphereGeometry(s,10,6).scale(1.5,0.45,1).translate(ox+lx,gh(lx,lz)-0.4,oz+lz),(x,y,z,nx,ny,nz,c)=>{ c.set(0xe0c488).multiplyScalar(0.9+0.12*h3(Math.floor(x),Math.floor(y),Math.floor(z))); })); } for(const s of [-1,1]) stone.push(paint(new THREE.BoxGeometry(1.6,9,1.6).translate(ox+s*26,gh(s*26,32)+4.5,oz+32),tc)); }   // sand heaped against the walls; two obelisks in the court
  if(ex==='wreck'){ stone.push(paint(new THREE.BoxGeometry(5,2.6,15).rotateY(0.5).rotateZ(0.25).translate(ox+30,gh(30,10)+3,oz+10),tc)); wood.push(paint(new THREE.CylinderGeometry(0.22,0.3,13,6).rotateZ(0.5).translate(ox+28,gh(28,10)+7.5,oz+10),tc)); cloth.push(paint(new THREE.BoxGeometry(0.05,4,3).rotateZ(0.5).translate(ox+30.6,gh(28,10)+9.5,oz+10),cc)); }
  // the court and the yard: a paved disc each, so the arena reads on the ground
  const disc=(A,col)=>{ const g=new THREE.CircleGeometry(A.r-1,28); g.rotateX(-Math.PI/2); g.translate(A.x,A.h+0.06,A.z); stone.push(paint(g,(x,y,z,nx,ny,nz,c)=>{ c.set(col).multiplyScalar(0.8+0.3*h3(Math.floor(x*1.5),0,Math.floor(z*1.5))); })); };
  disc(R.court,L.trim); disc(R.yard,L.wall);
  const group=new THREE.Group(), mk=(list,mat)=>{ if(!list.length) return null; const m=new THREE.Mesh(merge(list),mat); m.castShadow=true; m.receiveShadow=true; group.add(m); return m; };
  mk(stone,villageMat); mk(wood,villageMat); const clothM=mk(cloth,villageMat), fireM=mk(fire,new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true}));
  group.userData.near=450; scene.add(group);
  RDV[idx]={R,group,cloth:clothM,fire:fireM};
}
function buildRaids(){ RDV.length=0; RD_ORDER.forEach((id,i)=>rdBuildOne(RDS[id],i)); for(let i=0;i<RD_ORDER.length;i++) rdStructRefresh(i); }
// fires and banners are lit while a raid stands; a cleared raid is quiet until it is rebuilt
function rdStructRefresh(i){ const v=RDV[i], s=RD_CL[i]; if(!v) return; const lit=!s||s.st!==2; if(v.fire) v.fire.visible=lit; if(v.cloth) v.cloth.visible=lit; }
// hides a far raid's meshes (the loop calls it every few frames)
function rdStructCull(){ for(const v of RDV){ if(!v) continue; const d=Math.hypot(P.x-v.R.x,P.z-v.R.z); v.group.visible=d<450; } }
