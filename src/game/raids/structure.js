//@ The eight raid ruins: coursed stone walls with buttresses, merlons and arrow slits, tapered towers, a gatehouse with a broken portcullis, a ruined keep behind the court, pillars round the court, banners and torches; each land adds its own dressing (structure-extras.js)
/* Agent map. Data: RDS / RD_LAYOUT (shared/raids.js); the site, the court and the yard are those pads (flattened by terrain-height.js through ARENAS). buildRaids() is called by genTerrain
   (world/generation-setup.js, next to buildProvingIsle); rdStructRefresh(i) by hud.js when a raid's state changes (fires, lanterns and banners are lit while it is not cleared). RD_LOOKS: one palette
   and one extra per raid.look (thorn, kuro, jarn, stone, sand, wrack, moot, gates). Each raid is 3 merged meshes (stone, wood, cloth) and 1 small one (fire): a handful of draw calls, hidden beyond 450 m.
   Colliders: a circle per standing wall segment, tower, pillar and keep block (addCol), none in the gates. The per-land dressing and the small props are in structure-extras.js (rdExtras, rdProps).
   Builder context `C` (shared with structure-extras.js): the lists stone / wood / cloth / fire, the colour painters sc / tc / cc / fc / dk / wd, gh(lx,lz) the ground, bx(list,w,h,d,lx,y,lz,fn,ry,rz) a box
   placed in site coordinates (y absolute). Test: tools/raids-smoke.js (client part). */
const RD_LOOKS={
  thorn:{wall:0x6e6a5c,trim:0x4a4030,cloth:0x4f7a2c,flame:0xffa040,moss:0x4d7a30,extra:'spikes',roof:'cone'},
  kuro:{wall:0x4a3f3a,trim:0x2a1e1a,cloth:0xa02828,flame:0xff6a30,moss:0x3a5a30,extra:'torii',roof:'pagoda'},
  jarn:{wall:0x8a96a4,trim:0x5c6672,cloth:0x3a5a8a,flame:0x8fdcff,moss:0xe8f2fa,extra:'icicles',roof:'snow'},
  stone:{wall:0x6a6a70,trim:0x45454c,cloth:0x8a6a3a,flame:0xffb050,moss:0x55703a,extra:'rubble',roof:'cone'},
  sand:{wall:0xc4a56a,trim:0x9a7e4a,cloth:0xb8862a,flame:0xffd070,moss:0,extra:'dune',roof:'none'},
  wrack:{wall:0x3a4650,trim:0x24303a,cloth:0x2a6a6a,flame:0x70e0d0,moss:0x2f6a58,extra:'wreck',roof:'none'},
  moot:{wall:0xa68a5e,trim:0x6e5836,cloth:0x9a4a2a,flame:0xffb040,moss:0x7a8a3a,extra:'seats',roof:'none'},
  gates:{wall:0x8e887a,trim:0x5c564a,cloth:0x2a8a8a,flame:0x7ae0cc,moss:0x4a7a48,extra:'gates',roof:'none'}
};
const RDV=[];   // per raid: {R, fire, cloth, group}
const RD_WALL_T=2.4, RD_SEG=3;
function rdBuildOne(R,idx){
  const L=RD_LOOKS[R.look]||RD_LOOKS.stone, ox=R.x, oz=R.z, stone=[], wood=[], cloth=[], fire=[], mossC=new THREE.Color(L.moss||0);
  // stone is laid in courses (a lighter or darker row every 0.42 m, a different tone per block); moss grows in patches on the sides, snow settles on the tops
  const sc=(x,y,z,nx,ny,nz,c)=>{ const course=Math.floor(y*2.4), j=h3(Math.floor(x*1.3),course,Math.floor(z*1.3)); c.set(L.wall).multiplyScalar(0.7+0.36*j+(course%2?0:0.07)); if(ny>0.7) c.multiplyScalar(1.12); if(L.moss&&j>0.84&&ny<0.6) c.lerp(mossC,0.6); };
  const tc=(x,y,z,nx,ny,nz,c)=>{ c.set(L.trim).multiplyScalar(0.8+0.35*h3(Math.floor(x*3),Math.floor(y*3),Math.floor(z*3))); };
  const cc=(x,y,z,nx,ny,nz,c)=>{ c.set(L.cloth).multiplyScalar(0.8+Math.sin(y*5+x*3)*0.1+0.1*h3(Math.floor(x*4),Math.floor(y*3),Math.floor(z*4))); };
  const fc=(x,y,z,nx,ny,nz,c)=>{ c.set(L.flame).multiplyScalar(0.8+0.4*(y%1)); };
  const dk=(x,y,z,nx,ny,nz,c)=>{ c.set(0x15110f); };
  const wd=(x,y,z,nx,ny,nz,c)=>{ c.set(0x5a4026).multiplyScalar(0.8+0.4*h3(Math.floor(x*5),Math.floor(y*5),Math.floor(z*5))); };
  const gh=(lx,lz)=>getH(ox+lx,oz+lz);
  const bx=(list,w,h,d,lx,y,lz,fn,ry,rz)=>{ let g=new THREE.BoxGeometry(w,h,d); if(rz) g.rotateZ(rz); if(ry) g.rotateY(ry); list.push(paint(g.translate(ox+lx,y,oz+lz),fn)); };
  const C={L,R,ox,oz,stone,wood,cloth,fire,sc,tc,cc,fc,dk,wd,gh,bx};
  // a wall run from (x1,z1) to (x2,z2) in site coordinates: each segment is a coursed block with a toe of rubble, a buttress now and then, and either merlons (standing) or a broken edge (fallen); a gap where gap(x,z) says so
  function wall(x1,z1,x2,z2,hMax,gap,seed){
    const len=Math.hypot(x2-x1,z2-z1), n=Math.ceil(len/RD_SEG), ax=Math.abs(x2-x1)>Math.abs(z2-z1), w=len/n+0.05;
    for(let i=0;i<n;i++){
      const u=(i+0.5)/n, lx=x1+(x2-x1)*u, lz=z1+(z2-z1)*u; if(gap&&gap(lx,lz)) continue;
      const r=h3(i,seed,7), broken=r>0.78, h=broken?0.9+r*2.2:hMax*(0.78+0.22*h3(i,seed,3)), g0=gh(lx,lz), y0=g0-1.2;
      bx(stone,ax?w:RD_WALL_T,h+1.2,ax?RD_WALL_T:w,lx,y0+(h+1.2)/2,lz,sc);
      if(!broken){   // a walkway lip, merlons with gaps, an arrow slit
        bx(stone,ax?w:RD_WALL_T+0.5,0.3,ax?RD_WALL_T+0.5:w,lx,y0+h+1.35,lz,tc);
        if(!LOW) for(let k=0;k<2;k++){ if(h3(i,seed*3+k,5)>0.8) continue; const o=(k?0.8:-0.8); bx(stone,ax?0.9:RD_WALL_T+0.1,0.9,ax?RD_WALL_T+0.1:0.9,lx+(ax?o:0),y0+h+1.95,lz+(ax?0:o),sc); }
        if(!LOW&&i%3===1) bx(wood,ax?0.22:0.2,1.2,ax?0.2:0.22,lx,g0+h*0.55,lz+(ax?(seed%2?1.22:-1.22):0),dk);
      } else if(!LOW){   // the broken top: two leaning stumps
        bx(stone,ax?w*0.4:RD_WALL_T*0.8,0.8+r,ax?RD_WALL_T*0.8:w*0.4,lx-(ax?0.8:0),y0+h+1.2+0.4,lz-(ax?0:0.8),sc,0.3*h3(i,1,seed),0.2*(r-0.9));
      }
      if(!LOW&&h3(i,seed,11)>0.6) bx(stone,1.1+h3(i,seed,12),0.7+h3(i,seed,13)*0.6,1.1+h3(i,seed,14),lx+(ax?h3(i,seed,15)-0.5:RD_WALL_T*0.9),g0+0.25,lz+(ax?RD_WALL_T*0.9:h3(i,seed,15)-0.5),sc,h3(i,seed,16)*3,h3(i,seed,17)*0.5-0.2);   // a toe of fallen blocks
      if(!LOW&&i%4===2&&!broken) bx(stone,ax?1.3:RD_WALL_T+1.2,h*0.85+1.2,ax?RD_WALL_T+1.2:1.3,lx,y0+(h*0.85+1.2)/2,lz,tc);   // a buttress
      if(h>1.6) addCol(ox+lx,oz+lz,1.7);
    }
  }
  // a tapered round tower on a plinth: corbelled top, a ring of merlons with gaps, arrow slits, and the land's roof (cone / pagoda / snow cap / none)
  function tower(lx,lz,r,h,top){
    const g0=gh(lx,lz), y0=g0-1.2, yt=y0+h+1.2;
    stone.push(paint(new THREE.CylinderGeometry(r*0.9,r*1.12,h+1.2,12).translate(ox+lx,y0+(h+1.2)/2,oz+lz),sc));
    stone.push(paint(new THREE.CylinderGeometry(r*1.32,r*1.4,1.2,12).translate(ox+lx,g0+0.1,oz+lz),tc));   // plinth
    stone.push(paint(new THREE.CylinderGeometry(r*1.3,r*0.96,0.8,12).translate(ox+lx,yt+0.4,oz+lz),tc));   // corbel
    const nm=LOW?5:9; for(let k=0;k<nm;k++){ const a=k/nm*TAU; if(h3(k,lz,9)>0.72) continue; bx(stone,0.95,0.95,0.8,lx+Math.sin(a)*r*1.2,yt+1.25,lz+Math.cos(a)*r*1.2,sc,a); }
    if(!LOW) for(let k=0;k<3;k++){ const a=k*2.1+h3(lx,lz,k), rr=r*(1.04-0.1*0.5); bx(wood,0.22,1.1,0.2,lx+Math.sin(a)*rr,g0+h*(0.3+0.25*k),lz+Math.cos(a)*rr,dk,a); }
    addCol(ox+lx,oz+lz,r+0.5);
    if(top==='cone'){ stone.push(paint(new THREE.ConeGeometry(r*1.45,4.8,12).rotateZ(0.1).translate(ox+lx,yt+3.2,oz+lz),tc)); }   // a roof, tilting
    else if(top==='pagoda'){ for(let t=0;t<2;t++){ const s=r*(2.9-t*1.1); bx(stone,s,0.35,s,lx,yt+0.95+t*2.2,lz,cc,Math.PI/4); bx(stone,s*0.62,1.6,s*0.62,lx,yt+1.9+t*2.2,lz,tc,Math.PI/4);
        for(const [a,b] of [[1,1],[1,-1],[-1,1],[-1,-1]]) bx(stone,0.5,0.35,0.5,lx+a*s*0.62,yt+1.25+t*2.2,lz+b*s*0.62,tc,0,0.5*a*b); }
      bx(wood,0.18,2,0.18,lx,yt+6.2,lz,tc); }
    else if(top==='snow'){ stone.push(paint(new THREE.CylinderGeometry(r*1.05,r*1.25,0.5,12).translate(ox+lx,yt+0.95,oz+lz),(x,y,z,nx,ny,nz,c)=>{ c.set(0xf2f8ff).multiplyScalar(0.92+0.08*h3(Math.floor(x*2),0,Math.floor(z*2))); })); }
  }
  function brazier(lx,lz){
    const y=gh(lx,lz);
    wood.push(paint(new THREE.CylinderGeometry(0.12,0.18,1.6,6).translate(ox+lx,y+0.8,oz+lz),tc));
    wood.push(paint(new THREE.CylinderGeometry(0.5,0.3,0.35,8).translate(ox+lx,y+1.7,oz+lz),tc));
    fire.push(paint(new THREE.ConeGeometry(0.34,0.9,6).translate(ox+lx,y+2.2,oz+lz),fc),paint(new THREE.ConeGeometry(0.2,1.3,5).translate(ox+lx+0.05,y+2.4,oz+lz),fc));
  }
  // a pole with a crossbar and a tattered banner (two panels of different length, a stripe in the trim colour); a pennant on a tower is the same without the crossbar
  function banner(lx,lz,face,h,y){ const y0=y===undefined?gh(lx,lz)+3.2:y, H=h||3.2;
    bx(wood,0.14,H+1.2,0.14,lx,y0+(H+1.2)/2-0.3,lz,wd); bx(wood,0.1,0.1,2,lx,y0+H+0.4,lz,wd,face);
    bx(cloth,0.06,H,1.5,lx,y0+H/2+0.3,lz,cc,face); bx(cloth,0.06,H*0.72,0.6,lx+Math.sin(face)*0.01,y0+H*0.5-0.1,lz+Math.cos(face)*0.5,cc,face,0.05); bx(cloth,0.08,0.3,1.5,lx,y0+H*0.7,lz,tc,face); }
  function post(lx,lz){ const y=gh(lx,lz); wood.push(paint(new THREE.CylinderGeometry(0.07,0.1,2.8,5).translate(ox+lx,y+1.4,oz+lz),wd)); fire.push(paint(new THREE.ConeGeometry(0.22,0.7,5).translate(ox+lx,y+3.1,oz+lz),fc)); }
  // the gatehouse: a lintel across the gap between the two gate towers, a keystone, a portcullis hanging half-broken and a door leaf fallen ajar
  function gatehouse(){ const gz=-40, y=gh(0,gz);
    bx(stone,10.6,1.4,2.8,0,y+6.7,gz,sc); bx(stone,2,1.9,3,0,y+6.4,gz,tc); bx(stone,4,0.5,3,0,y+7.6,gz,tc);
    for(let k=-4;k<=4;k++){ if(k===1||k===3) continue; bx(wood,0.12,k%2?2.2:3.1,0.12,k*1.05,y+5.9-(k%2?1.1:1.55),gz+0.2,dk); }
    bx(wood,9.6,0.14,0.14,0,y+5.2,gz+0.2,dk); bx(wood,2.4,3.2,0.22,-3.6,y+1.7,gz+2.6,wd,0.9,0.04); bx(wood,2.4,2.6,0.22,3.4,y+0.8,gz-2.8,wd,-0.5,1.2);
    for(const s of [-1,1]) post(s*4.6,gz+3); }
  const gate=(x,z)=>z<-30&&Math.abs(x)<5.2, door=(x,z)=>Math.abs(z)<2&&Math.abs(x)<14;
  wall(-38,-40,38,-40,6.5,gate,1); wall(-38,44,38,44,6,null,2); wall(-38,-40,-38,44,6,null,3); wall(38,-40,38,44,6,null,4); wall(-38,0,38,0,5,door,5);
  const cr=L.roof; [[-38,-40],[38,-40],[-38,44],[38,44]].forEach(([x,z],k)=>{ tower(x,z,3.8,11,cr==='cone'&&k%2?'none':cr); banner(x,z,k*1.57,4,gh(x,z)+16.5); });
  for(const x of [-8,8]) tower(x,-40,2.9,9,cr==='pagoda'?'pagoda':'none');
  for(const x of [-14,14]) tower(x,0,2.7,7.5,'none');
  gatehouse();
  for(const [x,z] of [[-3.5,-37],[3.5,-37],[-20,-14],[20,-14],[-14,6],[14,6]]) brazier(x,z);
  for(const [x,z] of [[-6,-27],[6,-27],[-6,-19],[6,-19]]) post(x,z);
  for(const [x,z,f] of [[-8,-37,0],[8,-37,0],[-14,-3,0],[14,-3,0],[-38,10,Math.PI/2],[38,10,Math.PI/2]]) banner(x,z,f);
  // the ruined keep behind the back wall: a row of broken blocks of different heights, dark windows, a tall corner turret and fallen stone before it
  { const kz=54, nb=7, bw=26/nb;
    for(let i=0;i<nb;i++){ const lx=-13+bw*(i+0.5), h=5+9*h3(i,4,21)+(i===0||i===nb-1?3:0), g0=gh(lx,kz), y0=g0-1.2;
      bx(stone,bw+0.05,h+1.2,12,lx,y0+(h+1.2)/2,kz,sc); bx(stone,bw*0.5,0.9+h3(i,5,21)*1.6,5,lx+0.4,y0+h+1.7,kz-1,sc,0.2*h3(i,6,21)-0.1,0.18*(h3(i,7,21)-0.5)); addCol(ox+lx,oz+kz-5,bw*0.8);
      if(h>7) for(let r=0;r<(h>11?2:1);r++) bx(wood,1.1,2.3,0.3,lx,g0+3.2+r*4.2,kz-6.05,dk); }
    tower(-13,52,3.4,19,'none'); tower(13,52,2.9,12,'none');
    for(let k=0;k<(LOW?4:9);k++){ const lx=-16+k*4+h3(k,1,22)*2, s=0.9+h3(k,2,22)*1.5; bx(stone,s,s*0.7,s*1.2,lx,gh(lx,46)+s*0.3,46+h3(k,3,22)*3,sc,h3(k,4,22)*3,h3(k,5,22)*0.5-0.2); } }
  // pillars round the court (some snapped), one fallen across the ground, a paved ring and a cross of flagstones so the arena reads from afar
  { const cx=R.court.x-ox, cz=R.court.z-oz, nP=LOW?5:8;
    for(let k=0;k<nP;k++){ const a=k/nP*TAU+0.2, lx=cx+Math.sin(a)*17, lz=cz+Math.cos(a)*17, g0=gh(lx,lz), h=h3(k,8,23)>0.55?6.5:2+3*h3(k,9,23);
      stone.push(paint(new THREE.CylinderGeometry(0.75,0.9,h,8).translate(ox+lx,g0+h/2,oz+lz),sc));
      bx(stone,2.1,0.5,2.1,lx,g0+0.25,lz,tc); if(h>6) bx(stone,1.9,0.55,1.9,lx,g0+h+0.25,lz,tc,a);
      addCol(ox+lx,oz+lz,1); }
    { const lx=cx+11, lz=cz-9; stone.push(paint(new THREE.CylinderGeometry(0.8,0.8,7,8).rotateZ(Math.PI/2).rotateY(0.6).translate(ox+lx,gh(lx,lz)+0.8,oz+lz),sc)); }
    const ring=new THREE.RingGeometry(10,12,36); ring.rotateX(-Math.PI/2); ring.translate(R.court.x,R.court.h+0.1,R.court.z); stone.push(paint(ring,tc));
    for(const [w,d] of [[18,1.2],[1.2,18]]) bx(stone,w,0.06,d,cx,R.court.h+0.09,cz,tc); }
  rdProps(C); rdExtras(C,L.extra);
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
