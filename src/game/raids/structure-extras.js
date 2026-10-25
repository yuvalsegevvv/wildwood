//@ The raid ruins' small props (a palisade and a broken catapult before the gate, a cart and a well in the yard) and each land's own dressing (brambles, pagoda lanterns, ice, arches, colonnades, a wreck)
/* Agent map. rdProps(C) and rdExtras(C,extra) are called by rdBuildOne (raids/structure.js) with its builder context C: the lists stone / wood / cloth / fire, the colour painters sc / tc / cc / fc / dk / wd,
   gh(lx,lz), bx(list,w,h,d,lx,y,lz,fn,ry,rz), R (the raid), ox / oz (the site). `extra` is RD_LOOKS[look].extra: spikes (thorn), torii (kuro), icicles (jarn), rubble (stone), dune (sand), wreck (wrack), seats (moot).
   Everything is added to the lists and merged by the caller; `LOW` thins the counts. Test: tools/raids-smoke.js (client part). */
function rdProps(C){
  const {stone,wood,gh,bx,sc,tc,wd,dk,ox,oz}=C;
  // a palisade of leaning stakes on both sides of the approach, some fallen
  for(let k=0;k<(LOW?8:22);k++){ const s=k%2?1:-1, lx=s*(11+Math.floor(k/2)*1.7), lz=-50+h3(k,1,31)*2, h=1.8+h3(k,2,31)*1.3, fall=h3(k,3,31)>0.85;
    bx(wood,0.3,h,0.3,lx,gh(lx,lz)+(fall?0.2:h/2),lz,wd,h3(k,4,31)*3,fall?1.3:(h3(k,5,31)-0.5)*0.4);
    if(!fall&&!LOW) wood.push(paint(new THREE.ConeGeometry(0.22,0.5,4).translate(ox+lx,gh(lx,lz)+h+0.2,oz+lz),wd)); }
  // a broken catapult: two runners, a frame, a tilted arm, a bucket, two wheels
  { const x=24, z=-58, y=gh(x,z);
    bx(wood,0.4,0.4,5,x-0.9,y+0.5,z,wd,0.3); bx(wood,0.4,0.4,5,x+0.9,y+0.5,z,wd,0.3); bx(wood,2.4,0.3,0.3,x,y+1.2,z,wd,0.3);
    bx(wood,0.3,2.4,0.3,x-0.9,y+1.6,z+0.4,wd,0.3); bx(wood,0.3,2.4,0.3,x+0.9,y+1.6,z+0.4,wd,0.3);
    bx(wood,0.3,0.3,5,x,y+2.4,z+0.6,wd,0.3,0.0); bx(wood,0.3,0.3,4.2,x+0.4,y+2.2,z-1.6,wd,0.8,0.5); bx(wood,1,0.5,1,x+2.2,y+1.2,z-3.2,wd,0.3);
    for(const s of [-1,1]) wood.push(paint(new THREE.CylinderGeometry(0.7,0.7,0.2,10).rotateZ(Math.PI/2).rotateX(0.2).translate(ox+x+s*1.3,y+0.7,oz+z+1.2),wd)); }
  // a cart on its side in the yard, a well in a corner
  { const x=30, z=-8, y=gh(x,z); bx(wood,3,0.3,1.6,x,y+0.8,z,wd,0.4,0.35); bx(wood,3,0.8,0.2,x+0.2,y+1.3,z-0.7,wd,0.4,0.35); wood.push(paint(new THREE.CylinderGeometry(0.65,0.65,0.15,10).rotateX(Math.PI/2).rotateY(0.4).translate(ox+x+1.5,y+0.7,oz+z+0.5),wd)); }
  { const x=-30, z=-24, y=gh(x,z); stone.push(paint(new THREE.CylinderGeometry(1.3,1.4,1.1,10).translate(ox+x,y+0.55,oz+z),sc)); bx(wood,0.15,2,0.15,x-1.2,y+1.6,z,wd); bx(wood,0.15,2,0.15,x+1.2,y+1.6,z,wd); bx(wood,2.6,0.15,0.15,x,y+2.6,z,wd); addCol(ox+x,oz+z,1.4); }
}
function rdExtras(C,ex){
  const {stone,wood,cloth,fire,gh,bx,sc,tc,cc,fc,dk,wd,ox,oz,R}=C, col=hex=>(x,y,z,nx,ny,nz,c)=>{ c.set(hex).multiplyScalar(0.85+0.2*h3(Math.floor(x*3),Math.floor(y*3),Math.floor(z*3))); };
  if(ex==='spikes'){   // thorn: spiked tips along the gate wall, brambles and hanging vines on the walls, dead trees' worth of thorns in the yard
    for(let k=0;k<(LOW?6:16);k++){ const lx=-36+k*4.7, y=gh(lx,-40); stone.push(paint(new THREE.ConeGeometry(0.28,1.8,5).translate(ox+lx,y+6.4,oz-40.8),tc)); }
    for(let k=0;k<(LOW?10:30);k++){ const a=h3(k,1,41)*TAU, lx=Math.sin(a)*(34+h3(k,2,41)*5), lz=2+Math.cos(a)*(40+h3(k,3,41)*4), s=0.6+h3(k,4,41)*0.9;
      stone.push(paint(new THREE.IcosahedronGeometry(s,0).scale(1.4,0.7,1.2).translate(ox+lx,gh(lx,lz)+s*0.4,oz+lz),col(0x2e4a22)));
      if(!LOW) for(let t=0;t<3;t++) stone.push(paint(new THREE.ConeGeometry(0.07,0.5,4).rotateZ((t-1)*0.9).translate(ox+lx+(t-1)*s*0.5,gh(lx,lz)+s*0.8,oz+lz),col(0x241a14))); }
    for(let k=0;k<(LOW?6:14);k++){ const lx=-34+k*5, y=gh(lx,-38), L2=2+h3(k,5,41)*3; wood.push(paint(new THREE.CylinderGeometry(0.05,0.07,L2,4).translate(ox+lx,y+5.6-L2/2,oz-38.9),col(0x35592a))); }
  }
  if(ex==='torii'){   // kuro: the torii over the gate, a string of paper lanterns along the gate wall and the yard, stone lanterns on the path
    for(const s of [-1,1]) wood.push(paint(new THREE.CylinderGeometry(0.4,0.45,8,8).translate(ox+s*5.4,gh(s*5.4,-40)+4,oz-40),cc));
    wood.push(paint(new THREE.BoxGeometry(14,0.7,0.8).translate(ox,gh(0,-40)+8.4,oz-40),cc),paint(new THREE.BoxGeometry(11.6,0.5,0.6).translate(ox,gh(0,-40)+7.2,oz-40),tc));
    for(let k=0;k<(LOW?6:14);k++){ const lx=-32+k*4.9, y=gh(lx,-37.4); fire.push(paint(new THREE.SphereGeometry(0.34,6,5).scale(1,1.25,1).translate(ox+lx,y+4.2+0.3*Math.sin(k),oz-37.4),fc)); }
    for(const [x,z] of [[-5,-24],[5,-24],[-5,-10],[5,-10]]){ const y=gh(x,z); stone.push(paint(new THREE.CylinderGeometry(0.2,0.25,1.2,6).translate(ox+x,y+0.6,oz+z),sc),paint(new THREE.BoxGeometry(0.8,0.5,0.8).translate(ox+x,y+1.45,oz+z),tc),paint(new THREE.ConeGeometry(0.7,0.4,4).rotateY(0.78).translate(ox+x,y+1.9,oz+z),tc)); fire.push(paint(new THREE.BoxGeometry(0.3,0.3,0.3).translate(ox+x,y+1.45,oz+z),fc)); }
  }
  if(ex==='icicles'){   // jarn: icicles along the gate wall, snow on every tower, a crust of snow on the wall tops, ice crystals in the yard
    for(let k=0;k<(LOW?8:24);k++){ const lx=-36+k*3.1, y=gh(lx,-40); stone.push(paint(new THREE.ConeGeometry(0.2,1.2+h3(k,3,3),5).rotateX(Math.PI).translate(ox+lx,y+5.2,oz-40),col(0xdff0ff))); }
    for(const [x,z] of [[-38,-40],[38,-40],[-38,44],[38,44]]) stone.push(paint(new THREE.CylinderGeometry(3.9,3.9,0.4,10).translate(ox+x,gh(x,z)+12.4,oz+z),col(0xf2f8ff)));
    for(let k=0;k<(LOW?4:10);k++){ const lx=-30+h3(k,1,43)*60, lz=-30+h3(k,2,43)*60; if(Math.hypot(lx-R.yard.x+ox,lz-R.yard.z+oz)<8) continue; for(let t=0;t<3;t++){ const h=1.2+h3(k,t,44)*2.2; stone.push(paint(new THREE.ConeGeometry(0.35,h,5).rotateZ((t-1)*0.35).translate(ox+lx+(t-1)*0.5,gh(lx,lz)+h/2,oz+lz),col(0xb8e6ff))); } }
    for(let k=0;k<(LOW?6:16);k++){ const lx=-36+k*4.8, y=gh(lx,-40); bx(stone,3,0.3,2.7,lx,y+6.5+0.3,-40,col(0xf0f6ff)); }
  }
  if(ex==='rubble'){   // stonewatch: fallen blocks everywhere, the gate's fallen beam, a half-standing arch in the yard
    for(let k=0;k<(LOW?8:22);k++){ const a=h3(k,1,5)*TAU, r=12+h3(k,2,5)*22, lx=Math.sin(a)*r, lz=-8+Math.cos(a)*r*1.2; if(Math.abs(lx)>36||lz<-38||lz>42) continue; const s=0.8+h3(k,3,5)*1.6; bx(stone,s,s*0.7,s*1.2,lx,gh(lx,lz)+s*0.3,lz,sc,a,h3(k,4,5)*0.5); }
    wood.push(paint(new THREE.BoxGeometry(1.2,0.7,11).rotateY(0.25).rotateX(0.18).translate(ox-4,gh(-4,-33)+1.4,oz-33),tc));
    { const x=22, z=-24, y=gh(x,z); for(const s of [-1,1]) stone.push(paint(new THREE.CylinderGeometry(0.7,0.8,6,8).translate(ox+x+s*3,y+3,oz+z),sc)); bx(stone,3.6,1,1.6,x-1.6,y+6.4,z,sc,0,0.1); bx(stone,1.6,0.8,1.4,x-3.6,y+0.4,z+2,sc,0.4,0.3); addCol(ox+x-3,oz+z,1); addCol(ox+x+3,oz+z,1); }
  }
  if(ex==='dune'){   // sunken: sand heaped against the walls, two obelisks in the court, a broken colonnade in the yard, sun-bleached bones of a beast
    for(let k=0;k<(LOW?4:9);k++){ const lx=k<5?33+h3(k,1,2)*4:-12+h3(k,2,2)*24, lz=k<5?-30+k*14:-44+h3(k,3,3)*3, s=5+h3(k,4,3)*4; stone.push(paint(new THREE.SphereGeometry(s,10,6).scale(1.5,0.45,1).translate(ox+lx,gh(lx,lz)-0.4,oz+lz),col(0xe0c488))); }
    for(const s of [-1,1]) stone.push(paint(new THREE.BoxGeometry(1.6,9,1.6).translate(ox+s*26,gh(s*26,32)+4.5,oz+32),tc),paint(new THREE.ConeGeometry(1.15,1.6,4).rotateY(0.78).translate(ox+s*26,gh(s*26,32)+9.8,oz+32),cc));
    for(let k=0;k<4;k++){ const lx=-30+k*4.2, lz=-30, h=k%3===2?2.4:5.5; stone.push(paint(new THREE.CylinderGeometry(0.6,0.75,h,8).translate(ox+lx,gh(lx,lz)+h/2,oz+lz),sc)); bx(stone,1.6,0.4,1.6,lx,gh(lx,lz)+h+0.2,lz,tc); addCol(ox+lx,oz+lz,0.8); }
    { const x=-30, z=14, y=gh(x,z); for(let k=0;k<8;k++) bx(stone,0.18,0.18,1.4,x+k*0.5-2,y+0.9+Math.sin(k/7*Math.PI)*0.8,z,col(0xece0c4),0,(k-3.5)*0.1); bx(stone,0.5,0.4,0.9,x+3,y+0.5,z,col(0xece0c4)); }
  }
  if(ex==='wreck'){   // wrackmoor: a ship's hull in the wall's breach with a leaning mast and torn sail, barnacle crusts, kelp and driftwood
    bx(stone,5,2.6,15,30,gh(30,10)+3,10,tc,0.5,0.25); wood.push(paint(new THREE.CylinderGeometry(0.22,0.3,13,6).rotateZ(0.5).translate(ox+28,gh(28,10)+7.5,oz+10),tc)); bx(cloth,0.05,4,3,30.6,gh(28,10)+9.5,10,cc,0,0.5);
    for(let r=0;r<5;r++) bx(wood,0.3,0.3,10,29+r*0.6,gh(30,10)+1+r*0.5,10+r*0.2,wd,0.5,0.25+r*0.05);   // ribs showing
    for(let k=0;k<(LOW?8:26);k++){ const a=h3(k,1,45)*TAU, lx=Math.sin(a)*(30+h3(k,2,45)*8), lz=2+Math.cos(a)*(38+h3(k,3,45)*5), s=0.22+h3(k,4,45)*0.3; stone.push(paint(new THREE.SphereGeometry(s,5,4).translate(ox+lx,gh(lx,lz)+s+h3(k,5,45)*3,oz+lz),col(0x6a9a8a))); }
    for(let k=0;k<(LOW?5:12);k++){ const lx=-34+k*6, y=gh(lx,-39), L2=2.5+h3(k,6,45)*3; wood.push(paint(new THREE.BoxGeometry(0.08,L2,0.5).translate(ox+lx,y+5.5-L2/2,oz-38.9),col(0x2a5a3a))); }
    for(let k=0;k<(LOW?3:6);k++){ const lx=-26+k*9, lz=-20+h3(k,7,45)*30; bx(wood,0.3,0.3,4+h3(k,8,45)*3,lx,gh(lx,lz)+0.2,lz,wd,h3(k,9,45)*3,0.1); }
  }
  if(ex==='seats'){   // moot: seven seats toppled in a ring round the court's middle (no colliders: the boss fight is in there), a fallen roof beam across the keep, thorn hedges and a bleached baobab trunk in the yard
    for(let k=0;k<7;k++){ const a=k/7*TAU+0.3, lx=Math.sin(a)*12, lz=22+Math.cos(a)*12, tip=h3(k,1,61)*0.7;
      bx(stone,2.4,0.7,1.6,lx,gh(lx,lz)+0.4,lz,tc,a,tip*0.3); bx(stone,2.4,2.2,0.5,lx+Math.sin(a)*0.9,gh(lx,lz)+0.9,lz+Math.cos(a)*0.9,sc,a+1.4,1.1+tip*0.3); }   // the seat and its fallen back
    bx(wood,0.9,0.9,30,-4,gh(-4,30)+5.5,30,wd,0.35,0.22); bx(wood,0.8,0.8,24,6,gh(6,26)+3.5,26,wd,-0.5,0.3);
    for(let k=0;k<(LOW?8:20);k++){ const s2=k%2?1:-1, lx=s2*(14+Math.floor(k/2)*1.8), lz=-24+h3(k,2,61)*2, h=1.2+h3(k,3,61)*1.2;   // thorn hedges in the yard's mouth, a gap kept for the road
      stone.push(paint(new THREE.ConeGeometry(0.5,h,5).translate(ox+lx,gh(lx,lz)+h/2,oz+lz),col(0x6a5a30))); if(!LOW) stone.push(paint(new THREE.ConeGeometry(0.35,h*0.8,5).translate(ox+lx+0.6,gh(lx+0.6,lz+0.4)+h*0.4,oz+lz+0.4),col(0x7a6a38))); }
    stone.push(paint(new THREE.CylinderGeometry(2.6,3.4,3.2,10).translate(ox-26,gh(-26,-6)+1.4,oz-6),col(0x9a8a74)));   // a baobab trunk, hollow and bleached
    bx(wood,5,3.4,0.4,-26,gh(-26,-6)+1.7,-3.2,dk);
  }
}
