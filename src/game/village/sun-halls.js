//@ Glasswell's great places: the Wardens' Hall (the palace: an arcade under a tall tower with a beacon lamp), the Archive in the Citadel's east wing, the Physician's Court, and the three shuttered plots held for later (Exchange Hall, Sandring, Guildhall)
/* Each is drawn in the place's own frame (gwFrame, sun-houses.js): local -z is the front. The reserved plots are dressed, not empty: doors chained, windows boarded, a notice from
   the Wardens (docs/DESERT-CITY.md section 7); nothing behind them exists. The people (Steward Nabil, Mirela, Anselm Rook) are not here: this is the model only. */
const gwCoursedAt=(C,F,w,h,d,x,y,z,base,rag,seed)=>gwAtF(C,F,gwWall(w,h,d,base,1.0,rag,seed),x,y,z);
const gwIndigo=0x2d3f78, gwGoldC=0xd9a032;
// a shut double door under a lintel: planks, iron bands, a chain across and a seal
function gwShut(A,x,y,z,w,h){ const wood=woodC(0x4a3220), iron=c=>c.set(0x2a2a30);
  A(vbox(w,h,0.16,x,y+h/2,z),wood); A(vbox(0.06,h,0.2,x,y+h/2,z),iron); for(const k of [0.25,0.75]) A(vbox(w,0.12,0.2,x,y+h*k,z),iron);
  A(vbox(w*0.9,0.06,0.08,x,y+h*0.5,z-0.14).rotateZ(0.05),iron); A(cyl(0.12,0.12,0.05,8).rotateX(Math.PI/2).translate(x,y+h*0.5,z-0.2),c=>c.set(0x8a1e1e)); }
// boards across a window
function gwBoarded(A,x,y,z,w,h){ for(let k=0;k<3;k++) A(vbox(w,0.14,0.08,x,y+h*(0.2+k*0.3),z).rotateZ((k-1)*0.08),woodC(0x6a4a30)); }
function gwWardensHall(C){
  const p=gwPlace('hall'), F=gwFrame(p), {A,W,R}=gwF(C,F), w=p.w, d=p.d, H=5.8, col=gwPlaster(0xe2d2a6), trim=gwStone(0xc9b88c,0.15);
  A(vbox(w+1.2,0.6,d+1.2,0,0.3,0),trim); for(let k=0;k<3;k++) A(vbox(11-k*1.4,0.22,1.2,0,0.7+k*0.22,-d/2-0.6-(2-k)*0.5),trim);
  gwAtF(C,F,gwArchWall(w,H,1.2,[-8,-4,0,4,8].map(x=>[x,1.5,4.4]),col),0,0.6,-d/2+0.6);   // the arcade across the front
  A(vbox(w-1,H-0.4,0.4,0,0.6+(H-0.4)/2,-d/2+2.1),c=>c.set(0x2c5a60));                       // the dark teal tiled wall behind it
  for(const x of [-8,-4,0,4,8]) A(vbox(0.12,2.7,1.2,x+0.0,2.2,-d/2+1.6),c=>c.set(gwIndigo));
  A(vbox(w,H,d-3.0,0,0.6+H/2,1.5),col); A(vbox(12,1.8,d-4,0,0.6+H+0.9,1.4),col); gwParapet(A,w,d-3,0.6+H,trim,0,1.5);
  for(let k=-5;k<=5;k++) A(vbox(0.9,0.8,0.5,k*2.2,0.6+H+0.4,-d/2+0.6),trim);
  const y0=0.6+H+1.8, ty=1.4, TH=9;   // the Wardens' Tower: a square tower over the middle of the hall, a lantern room with a beacon lamp, a pyramid cap and a pennant (the gate towers' look)
  A(vbox(7,TH,7,0,y0+TH/2,ty),col); gwParapet(A,7,7,y0+TH,trim,0,ty);
  for(const sx of [-1,1]) for(const dz of [-1,1]) A(vbox(0.9,0.9,0.9,sx*3.2,y0+TH+0.45,ty+dz*3.2),trim);
  A(vbox(3.8,2.6,3.8,0,y0+TH+1.3,ty),c=>c.set(0xa8dce0)); A(new THREE.ConeGeometry(3.6,3.6,4).rotateY(Math.PI/4).translate(0,y0+TH+2.6+1.8,ty),c=>c.set(gwIndigo));
  A(cyl(0.07,0.07,3.0,5).translate(0,y0+TH+2.6+3.6+1.5,ty),c=>c.set(0x3a2616)); A(vbox(0.05,1.3,1.8,0,y0+TH+2.6+3.6+2.4,ty-0.9),c=>c.set(gwIndigo)); A(vbox(0.06,0.3,1.8,0,y0+TH+2.6+3.6+2.4,ty-0.9),c=>c.set(gwGoldC));
  gwFlame(C,F,0,y0+TH+1.5,ty,1,1.8);
  for(const e of [-1,1]){ W(vbox(0.9,1.5,0.08,e*1.4,y0+3,ty-3.54)); W(vbox(0.9,1.5,0.08,e*1.4,y0+6.2,ty-3.54)); }
  for(const sx of [-1,1]){ const cx=sx*(w/2-1.4), cz=-d/2+1.4;   // two shorter square towers at the front corners, crenellated, with pyramid caps
    A(vbox(2.8,H+3.2,2.8,cx,0.6+(H+3.2)/2,cz),col); gwParapet(A,2.8,2.8,0.6+H+3.2,trim,cx,cz); A(new THREE.ConeGeometry(2.3,2.2,4).rotateY(Math.PI/4).translate(cx,0.6+H+3.2+1.1+0.45,cz),c=>c.set(gwIndigo));
    W(vbox(0.5,1.3,0.08,cx,0.6+H+1.0,cz-1.44)); }
  for(const x of [-8,-4,4,8]) R(gwCloth(1.0,0.05,3.2,gwIndigo,gwGoldC,4).rotateX(Math.PI/2).translate(x,3.6,-d/2-0.2));   // banners down the pillars
  gwSign(C,F,"WARDENS' HALL",0,H+1.0,-d/2-0.35,5,0.9,{bg:'#1f2f66'});
}
function gwArchive(C){
  const p=gwPlace('archive'), F=gwFrame(p), {A,W}=gwF(C,F), w=p.w, d=p.d, H=8, col=gwCourses(GW_GOLD);
  gwAtF(C,F,gwArchWall(w,H,1.0,[[0,1.2,3.6],[-3,0.5,4.8],[3,0.5,4.8]],gwPlaster(0xc8a468)),0,0,-d/2+0.5);
  gwCoursedAt(C,F,w,H,d-1.0,0,0,0.5,GW_GOLD,0,1); gwParapet(A,w,d,H,col);
  for(let k=0;k<5;k++){ W(vbox(0.7,2.8,0.08,-w/2-0.04,4.4,-d/2+3+k*3.2)); W(vbox(0.7,2.8,0.08,w/2+0.04,4.4,-d/2+3+k*3.2)); }   // tall slit windows down the long sides
  A(vbox(3.4,1.4,5.6,0,H+0.7,1.0),c=>c.set(0x5ec6c0)); A(vbox(3.7,0.2,5.9,0,H+1.45,1.0),col);   // a glass lantern over the reading room
  A(vbox(2.8,0.3,1.6,0,0.15,-d/2-0.9),gwStone(0xb09878,0.2)); A(vbox(2.2,0.3,1.0,0,0.45,-d/2-0.6),gwStone(0xb09878,0.2));
  A(vbox(1.8,2.8,0.1,0,1.4,-d/2-0.04),woodC(0x3a2616));
  gwSign(C,F,'ARCHIVE OF THE SILENT YEARS',0,H-1.6,-d/2-0.12,4.8,0.95,{bg:'#2a1c10'});
}
function gwPhysician(C){
  const p=gwPlace('physician'), F=gwFrame(p), {A,W}=gwF(C,F), w=p.w, d=p.d, H=3.8, col=gwPlaster(0xefe9da), blue=c=>c.set(0x7fb2c8);
  gwAtF(C,F,gwArchWall(w,H,0.7,[[0,1.2,3.0]],col),0,0,-d/2+0.35); gwAtF(C,F,pc(vbox(w,H,0.7,0,H/2,0),col),0,0,d/2-0.35); for(const sx of [-1,1]) gwAtF(C,F,pc(vbox(0.7,H,d-1.4,0,H/2,0),col),sx*(w/2-0.35),0,0);
  A(vbox(w+0.2,0.25,0.9,0,H+0.12,-d/2+0.35),blue); for(const sx of [-1,1]) A(vbox(0.9,0.25,d,sx*(w/2-0.35),H+0.12,0),blue);
  A(vbox(w-2,0.1,d-2,0,0.05,0),gwStone(0xd8d0bc,0.1));
  A(vbox(6,3.4,4.6,0,1.7,1.0),col); A(vbox(6.4,0.3,5,0,3.55,1.0),blue); A(vbox(2.6,1.0,2.2,0,4.2,1.0),c=>c.set(0xa8dce0)); A(vbox(3.0,0.14,2.6,0,4.75,1.0),blue);   // the study, and a glass lantern on its roof
  for(const s of [-1,1]) W(vbox(0.9,1.4,0.07,s*1.8,1.9,1.0-2.34)); for(const s of [-1,1]) A(vbox(0.4,1.5,0.06,s*2.5,1.9,1.0-2.35),blue);
  for(const [x,z] of [[-4,-2],[4,-2],[-4,4],[4,4]]){ A(cyl(0.4,0.3,0.6,8).translate(x,0.3,z),woodC(0x9a6a44)); A(new THREE.IcosahedronGeometry(0.55,0).translate(x,0.95,z),c=>c.set(0x4b8a3a)); }
  gwSign(C,F,"PHYSICIAN'S COURT",0,H+0.7,-d/2-0.05,3.6,0.7,{bg:'#e8f2f4',ink:'#1f4a5a',line:'#7fb2c8',glow:0x182024});
}
function gwReserved(C){
  { const p=gwPlace('exchange'), F=gwFrame(p), {A,W}=gwF(C,F), w=p.w, d=p.d, H=6.2, col=gwPlaster(0xd8c9a2);   // a hall with its doors chained and its windows boarded
    A(vbox(w,H,d,0,H/2,0),col); gwParapet(A,w,d,H,col); A(vbox(w+0.5,0.3,d+0.5,0,0.15,0),gwStone(0xb09878,0.2));
    gwShut(A,0,0.3,-d/2-0.1,3.6,3.6); A(vbox(5.2,0.4,0.6,0,4.2,-d/2-0.15),gwStone(0xb09878,0.2)); for(const x of [-4.4,4.4]){ W(vbox(1.0,1.5,0.07,x,3,-d/2-0.04)); gwBoarded(A,x,2.3,-d/2-0.1,1.2,1.5); }
    A(vbox(0.9,1.3,0.06,-2.9,2.2,-d/2-0.2),c=>c.set(0xf2ead2)); A(cyl(0.1,0.1,0.04,8).rotateX(Math.PI/2).translate(-2.9,1.7,-d/2-0.25),c=>c.set(0x8a1e1e));   // the Wardens' notice, sealed
    gwSign(C,F,'EXCHANGE HALL',0,H-1.1,-d/2-0.12,4.4,0.8,{bg:'#4a4036',ink:'#d8cdb4',line:'#8a7a5a',glow:0}); }
  { const p=gwPlace('guild'), F=gwFrame(p), {A,W,R}=gwF(C,F), w=p.w, d=p.d, H=6, col=gwPlaster(0xcfb184);
    A(vbox(w,H,d,0,H/2,0),col); gwParapet(A,w,d,H,col); A(vbox(w+0.5,0.3,d+0.5,0,0.15,0),gwStone(0xb09878,0.2));
    for(let k=0;k<4;k++) A(vbox(0.7,H+1.4,0.7,-w/2+0.2+k*(w-0.4)/3,(H+1.4)/2,-d/2-0.3),col);
    gwShut(A,0,0.3,-d/2-0.1,3.2,3.4); for(const x of [-4.4,4.4]){ W(vbox(1.0,1.5,0.07,x,3,-d/2-0.04)); gwBoarded(A,x,2.3,-d/2-0.1,1.2,1.5); }
    R(gwCloth(1.2,0.05,3.4,0x5a1e1e,0x5a1e1e,1).rotateX(Math.PI/2).translate(0,H-0.6,-d/2-0.4));   // a plain dark banner: no badge yet
    gwSign(C,F,'GUILDHALL',0,H-3.2,-d/2-0.12,3.6,0.7,{bg:'#4a4036',ink:'#d8cdb4',line:'#8a7a5a',glow:0}); }
  { const p=gwPlace('sandring'), F=gwFrame(p), {A}=gwF(C,F), R0=9.2, stone=gwCourses(0xc09a62);   // a round yard behind a wall: the way in shut with great doors
    A(cyl(R0-0.5,R0-0.5,0.2,28).translate(0,0.1,0),c=>c.set(0xc8a96e));
    for(let k=0;k<26;k++){ const a=TAU*k/26+0.12; if(Math.abs(Math.atan2(Math.sin(a),-Math.cos(a)))<0.2) continue;   // (the gap is the way in, shut below)
      C.out.push(gwWall(2.4,4.8,1.2,0xc09a62,1.0,0).applyMatrix4(new THREE.Matrix4().multiplyMatrices(F,frameM(Math.sin(a)*R0,0,Math.cos(a)*R0,a))));
      A(vbox(1.1,0.8,1.2).rotateY(a).translate(Math.sin(a)*R0,5.2,Math.cos(a)*R0),stone); }
    gwShut(A,0,0.1,-R0+0.1,4.4,4.2); A(vbox(6.4,0.5,1.4,0,4.6,-R0+0.3),stone); for(const sx of [-1,1]) A(vbox(1.2,6.2,1.6,sx*3.6,3.1,-R0+0.3),stone);
    gwSign(C,F,'THE SANDRING',0,6.2,-R0-0.45,3.6,0.7,{bg:'#4a4036',ink:'#d8cdb4',line:'#8a7a5a',glow:0}); }
}
