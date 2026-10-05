//@ Glasswell's heart: the Old Citadel (a broken ring wall with its towers, one face fused to black glass), the broken statue at the centre, the Great Well's pavilion, the Circle Court
/* All in the city's own frame (see sun-rim.js). The statue stands at the exact centre of the Citadel's court: a robed figure on a stepped plinth, its head and one arm gone
   (the head lies at the plinth's foot), the inscription on the plinth chiselled away: nobody remembers whose it was (docs/STORY.md: the Quiet). Only the model exists:
   the plinth's inscription is not readable and the statue does nothing (docs/NOT-BUILT.md). */
const GW_GOLD=0xb8904e;
// flip a geometry inside out (the inside of the Great Well's wall must face the person looking down into it); winding and normals together
function gwFlip(g){ const ix=g.index.array; for(let i=0;i<ix.length;i+=3){ const t=ix[i+1]; ix[i+1]=ix[i+2]; ix[i+2]=t; } const n=g.attributes.normal.array; for(let i=0;i<n.length;i++) n[i]=-n[i]; return g; }
const gwBox=(C,x,y,z,w,h,d,rot,col)=>C.out.push(pc(vbox(w,h,d,0,h/2,0),col).applyMatrix4(frameM(x,y,z,rot||0)));
const gwCoursed=(C,x,y,z,w,h,d,rot,base,rag,seed)=>C.out.push(gwWall(w,h,d,base,1.0,rag,seed).applyMatrix4(frameM(x,y,z,rot||0)));
function gwRubble(C,x,z,n,spread,base,seed){ for(let k=0;k<n;k++){ const a=h3(k,seed,1)*TAU, r=Math.sqrt(h3(k,seed,2))*spread, s=0.35+h3(k,seed,3)*0.7;
  C.out.push(pc(new THREE.IcosahedronGeometry(s,0).scale(1,0.55,1.1).rotateY(h3(k,seed,4)*TAU).translate(x+Math.sin(a)*r,s*0.3,z+Math.cos(a)*r),gwStone(base,0.3))); } }
// a tower of staves round a solid core: whole (crenellated, pyramid roof) or broken (staves of every height, gaps)
function gwTower(C,x,z,H,broken,seed,roof){
  const R=2.4, st=gwCourses(GW_GOLD); C.out.push(pc(cyl(R*0.95,R*1.02,H*0.82,10).translate(x,H*0.41,z),st));
  for(let k=0;k<10;k++){ const a=TAU*k/10+0.3, hh=broken?H*(0.3+0.7*h3(k,seed,3))*(k>6?0.55:1):H; if(broken&&h3(k,seed,9)<0.16) continue;
    gwCoursed(C,x+Math.sin(a)*R,0,z+Math.cos(a)*R,2.0,hh,1.2,a,GW_GOLD,broken?0.8:0,seed+k); if(!broken) gwBox(C,x+Math.sin(a)*(R+0.1),H,z+Math.cos(a)*(R+0.1),1.0,1.1,1.1,a,st); }
  if(roof){ C.out.push(pc(new THREE.ConeGeometry(3.6,4.6,10).translate(x,H+1.1+2.3,z),c=>c.set(0x2c4a8c))); C.out.push(pc(cyl(0.07,0.07,2.4,5).translate(x,H+5.5,z),c=>c.set(0x3a2616))); }
  gwRubble(C,x,z,broken?9:3,5,GW_GOLD,seed*7);
}
function gwCitadel(C){
  const R=18.5, arcs=[[0.1,0.9],[1.9,2.15],[2.15,2.7],[3.1,4.0],[4.5,5.0],[5.35,6.1]], glazed=[4.05,4.45], st=gwCourses(GW_GOLD);   // the wall's standing stretches (the Archive is the east wing: 1.1-1.9)
  arcs.splice(1,1);
  const seg=(a0,a1,glass)=>{ const n=Math.max(1,Math.round((a1-a0)*R/2.6)), da=(a1-a0)/n;
    for(let k=0;k<n;k++){ const a=a0+da*(k+0.5), x=Math.sin(a)*R, z=Math.cos(a)*R, q=h3(Math.round(a*40),7,3), H=glass?2.4+q*1.8:(q<0.3?2.4:q<0.65?4.6:q<0.9?6.8:9.5)+q*0.8;
      if(!glass&&h3(Math.round(a*40),3,9)<0.1) continue;   // a breach
      if(glass){ const g=pc(vbox(R*da+0.3,H,3.2,0,H/2,0),(px,py,pz,c)=>c.set(0x1b1d2a).lerp(_gwC2.set(0x34466e),0.4*noise2(px*0.8+k,py*0.8))).applyMatrix4(frameM(x,0,z,a)); C.glass.push(g);
        for(let d=0;d<3;d++){ const dh=0.8+h3(k,d,5)*1.6; C.glass.push(pc(new THREE.ConeGeometry(0.16+h3(k,d,6)*0.14,dh,5).rotateX(Math.PI).translate((d-1)*0.7,H-dh/2,1.7),c=>c.set(0x101116)).applyMatrix4(frameM(x,0,z,a))); } }   // a drip of melted glass
      else { gwCoursed(C,x,0,z,R*da+0.3,H,3.2,a,GW_GOLD,q<0.65?1.1:0.4,k+9); if(q>0.8) gwBox(C,x,H,z,R*da*0.5,0.9,3.3,a,st); } } };
  for(const [a0,a1] of arcs) seg(a0,a1,false); seg(glazed[0],glazed[1],true);
  gwTower(C,Math.sin(0.0)*R,Math.cos(0.0)*R+0.3,13,false,1,true); gwTower(C,Math.sin(6.1)*R-1.5,Math.cos(6.1)*R,9,true,2);   // the south gate's two towers
  gwTower(C,Math.sin(2.7)*R,Math.cos(2.7)*R,15,false,3,false); gwTower(C,Math.sin(3.1)*R+1.5,Math.cos(3.1)*R,6,true,4);      // the north breach
  gwTower(C,Math.sin(5.0)*R,Math.cos(5.0)*R,11,true,5); gwTower(C,Math.sin(0.9)*R,Math.cos(0.9)*R,12,true,6);
  for(let k=0;k<7;k++){ const a=0.5+k*0.9, r=8+h3(k,2,2)*5; C.out.push(pc(cyl(0.55,0.55,2.4+h3(k,3,3)*1.8,9).rotateZ(Math.PI/2).rotateY(h3(k,4,4)*TAU).translate(Math.sin(a)*r,0.55,Math.cos(a)*r),gwStone(0xc9b992,0.2))); }   // fallen column drums in the court
  gwRubble(C,0,0,30,17,GW_GOLD,11);
}
// the statue at the centre: three steps, a die with its erased inscription on the south face, a robed figure with no head and one arm, the head on the lowest step
function gwStatue(C){
  const stone=gwStone(0xb9ab8a,0.2), weather=(x,y,z,c)=>{ c.set(0xb9ab8a).multiplyScalar(0.9+0.12*h3(Math.floor(x*3),Math.floor(y*3),Math.floor(z*3))-0.1*smoothstep(1.2,3.4,y)*noise2(x*2,y*0.6)); };
  C.out.push(pc(cyl(5.6,6.0,0.5,8).translate(0,0.25,0),stone)); C.out.push(pc(cyl(4.6,5.0,0.5,8).translate(0,0.75,0),stone));
  gwBox(C,0,1.0,0,3.2,2.6,3.2,0,stone); gwBox(C,0,3.6,0,3.8,0.4,3.8,0,stone); gwBox(C,0,1.0,0,3.6,0.3,3.6,0,stone);
  C.out.push(pc(vbox(2.2,1.3,0.12,0,2.35,1.62),c=>c.set(0x8c7e62)));                                                                  // the panel: sunk into the face...
  for(let k=0;k<14;k++){ const y=1.85+h3(k,1,1)*1.0, x=(h3(k,2,2)-0.5)*1.9; C.out.push(pc(vbox(0.7+h3(k,3,3)*0.4,0.05,0.05,0,0,0).rotateZ((h3(k,4,4)-0.5)*1.4).translate(x,y,1.7),c=>c.set(0x5a5040))); }   // ...and scored with chisel strokes
  const Y=4.0;
  C.out.push(pc(cyl(0.55,0.95,2.4,12,2).translate(0,Y+1.2,0),weather)); C.out.push(pc(cyl(0.52,0.58,1.4,10).translate(0,Y+3.1,0),weather));   // robe and torso
  for(let k=0;k<7;k++){ const a=k/7*TAU; C.out.push(pc(vbox(0.16,2.2,0.2,0,0,0).rotateY(a).translate(Math.sin(a)*0.86,Y+1.3,Math.cos(a)*0.86),weather)); }   // folds
  C.out.push(pc(cyl(0.2,0.2,1.7,8).rotateZ(Math.PI/2).translate(0,Y+3.62,0),weather)); C.out.push(pc(vbox(0.9,1.5,0.12,0,Y+2.7,-0.52),weather));   // shoulders, and a cloak down the back
   C.out.push(pc(cyl(0.2,0.25,0.3,8).translate(0,Y+3.95,0),weather));          // shoulders and the neck's stump
  C.out.push(pc(cyl(0.2,0.22,1.1,8).rotateZ(-0.7).translate(0.95,Y+3.9,0.1),weather)); C.out.push(pc(cyl(0.17,0.2,0.9,8).rotateZ(0.12).translate(-0.85,Y+3.0,0.3),weather));   // the right arm raised and snapped, the left hanging
  C.out.push(pc(cyl(0.07,0.07,2.1,6).rotateZ(0.05).translate(-1.0,Y+1.5,0.55),woodC(0x4a3220))); C.out.push(pc(cyl(0.07,0.07,1.5,6).rotateZ(1.2).translate(1.9,0.9,3.3),woodC(0x4a3220)));   // the staff, snapped: its lower half on the steps
  C.out.push(pc(new THREE.SphereGeometry(0.52,10,8).scale(1,1.15,1).translate(2.3,1.0+0.58,3.6),weather));                           // the head, worn smooth, at the foot of the plinth
  C.out.push(pc(new THREE.BoxGeometry(0.5,0.3,0.4).translate(-2.4,0.65,3.4),stone));
}
// the Great Well: a pavilion of four pillars under a pyramid roof, a stone ring round the water, a windlass with its rope and bucket, troughs, benches and a brazier on the court
function gwWell(C){
  const G=GLASSWELL, [wx,wz]=G.well, stone=gwStone(0xc4ad82,0.22), {A}=gwF(C,frameM(wx,0,wz,0)), wood=woodC(0x4a3220);
  A(cyl(4.4,4.7,0.3,20).translate(0,0.15,0),stone);
  A(new THREE.CylinderGeometry(3.2,3.4,1.0,20,1,true).translate(0,0.5,0),stone); A(gwFlip(new THREE.CylinderGeometry(2.5,2.5,0.9,20,1,true).translate(0,0.55,0)),stone);
  A(new THREE.RingGeometry(2.5,3.25,20).rotateX(-Math.PI/2).translate(0,1.0,0),stone);
  C.water.push(pc(new THREE.CircleGeometry(2.5,20).rotateX(-Math.PI/2).translate(wx,0.3,wz),c=>c.set(0x1d7f95)));
  for(const sx of [-1,1]) for(const sz of [-1,1]){ A(vbox(0.7,4.6,0.7,sx*3.2,2.3,sz*3.2),stone); A(vbox(0.9,0.3,0.9,sx*3.2,4.75,sz*3.2),stone); }
  A(new THREE.ConeGeometry(5.2,1.9,4).rotateY(Math.PI/4).translate(0,5.7,0),c=>c.set(0x2c4a8c)); A(cyl(0.07,0.07,2.0,5).translate(0,7.4,0),wood); A(new THREE.SphereGeometry(0.2,8,6).translate(0,8.4,0),c=>c.set(0xd9a032));
  A(cyl(0.14,0.14,6.2,7).rotateZ(Math.PI/2).translate(0,4.0,0),wood); A(cyl(0.38,0.38,1.8,10).rotateZ(Math.PI/2).translate(0,3.2,0),wood); A(cyl(0.03,0.03,2.4,5).translate(0.2,2.0,0),c=>c.set(0xb8a070)); A(cyl(0.28,0.22,0.36,8).translate(0.2,0.8,0),wood);
  for(let k=0;k<4;k++){ const a=k*TAU/4+0.785; A(vbox(2.2,0.55,0.7,0,0.28,0).rotateY(a).translate(Math.sin(a)*6.2,0,Math.cos(a)*6.2),stone); }
  for(let k=0;k<6;k++){ const a=k*TAU/6+0.3; A(vbox(1.9,0.45,0.5,0,0.23,0).rotateY(a).translate(Math.sin(a)*8.6,0,Math.cos(a)*8.6),stone); }
  const bx=wx+10, bz=wz-5, {A:B}=gwF(C,frameM(bx,0,bz,0));   // the court's great brazier, on three legs
  for(let k=0;k<3;k++){ const a=k*TAU/3; B(cyl(0.07,0.1,1.9,6).rotateZ(Math.sin(a)*0.25).rotateX(Math.cos(a)*0.25).translate(Math.sin(a)*0.5,0.95,Math.cos(a)*0.5),c=>c.set(0x2a2a30)); }
  B(cyl(0.8,0.45,0.55,10).translate(0,2.05,0),c=>c.set(0x2a2a30)); B(cyl(0.7,0.7,0.05,10).translate(0,2.34,0),c=>c.set(0x1a1612));
  for(let k=0;k<3;k++){ const m=new THREE.Mesh(new THREE.ConeGeometry(k?0.3:0.45,k?0.9:1.4,7),flameMats[k?1:0]); m.position.set(bx+(k?Math.sin(k*2.1)*0.3:0),2.9,bz+(k?Math.cos(k*2.1)*0.3:0)); C.root.add(m); flames.push(m); }
}
// the Circle Court: a paved ring of stone with four standing stones and the runes inlaid (the glowing ring and beam are buildCircle's, in buildings-vale.js, added when the city is placed)
function gwCircle(C){
  const T=GLASSWELL.tele, {A}=gwF(C,frameM(T.x,0,T.z,0));
  A(cyl(T.r+0.4,T.r+0.6,0.3,28).translate(0,0.05,0),(x,y,z,c)=>{ stoneC(x,y,z,c); if(y>0.18&&Math.abs(Math.hypot(x,z)-T.r*0.7)<0.14) c.set(0x3a4a5a); });
  for(let k=0;k<4;k++){ const a=k/4*TAU+0.4, h=1.3+0.2*(k%2); A(vbox(0.5,h,0.34,0,h/2,0).rotateY(a).translate(Math.sin(a)*(T.r+1.1),-0.1,Math.cos(a)*(T.r+1.1)),stoneC); }
}
