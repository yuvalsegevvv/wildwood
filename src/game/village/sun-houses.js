//@ Glasswell's homes (80 flat-roofed houses in four kinds), the caravanserais, stables and guardhouses at the gates, and the painted signs
/* A place of GLASSWELL.places is drawn in its own frame: local -z is its front (the door), +x its right, y up from the floor. gwAtF puts a finished geometry into that frame. */
const gwPlaster=base=>(x,y,z,c)=>{ c.set(base).multiplyScalar(0.94+h3(Math.floor(x*2),Math.floor(y*2),Math.floor(z*2))*0.1-Math.max(0,0.45-y)*0.3); };   // limewash, grubby at the foot
const gwPlace=id=>GLASSWELL.places.find(p=>p.id===id);
const gwFrame=p=>frameM(p.x,0,p.z,p.rot);
const gwAtF=(C,F,g,x,y,z)=>C.out.push(g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(F,new THREE.Matrix4().makeTranslation(x||0,y||0,z||0))));
// cloth in stripes: n strips of two colours side by side along x (an awning, a shade over a lane); crisp edges need separate strips, vertex colours would only blend
function gwCloth(w,t,d,a,b,n){ const list=[]; for(let k=0;k<n;k++) list.push(pc(vbox(w/n+0.002,t,d,-w/2+(k+0.5)*w/n,0,0),c=>c.set(k&1?a:b))); return merge(list); }
// four low walls round a flat roof
function gwParapet(A,w,d,y,col,ox,oz){ ox=ox||0; oz=oz||0; for(const sz of [-1,1]) A(vbox(w+0.3,0.45,0.3,ox,y+0.22,oz+sz*d/2),col); for(const sx of [-1,1]) A(vbox(0.3,0.45,d,ox+sx*w/2,y+0.22,oz),col); }
// a wall with pointed-arch openings: openings = [[centre x, half width, height]], the wall's bottom at y 0, extruded d deep (centred)
function gwArchWall(w,h,d,openings,col){
  const sh=new THREE.Shape(); sh.moveTo(-w/2,-0.4); sh.lineTo(w/2,-0.4); sh.lineTo(w/2,h); sh.lineTo(-w/2,h); sh.lineTo(-w/2,-0.4);
  for(const [cx,hw,oh] of openings){ const op=new THREE.Path(), sp=oh-hw*0.6; op.moveTo(cx-hw,0); op.lineTo(cx-hw,sp); op.quadraticCurveTo(cx-hw,oh-hw*0.1,cx,oh); op.quadraticCurveTo(cx+hw,oh-hw*0.1,cx+hw,sp); op.lineTo(cx+hw,0); op.lineTo(cx-hw,0); sh.holes.push(op); }
  return pc(new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false,curveSegments:6}).translate(0,0,-d/2),col);
}
// a painted board: text fitted to the width, hung at (x,y,z) of frame F facing the front (-z)
function gwSign(C,F,text,x,y,z,w,h,o){
  o=o||{}; const cv=document.createElement('canvas'); cv.width=512; cv.height=Math.max(64,Math.round(512*h/w)); const g=cv.getContext('2d'), fs=48;
  g.fillStyle=o.bg||'#2d3f78'; g.fillRect(0,0,512,cv.height); g.strokeStyle=o.line||'#d9a032'; g.lineWidth=7; g.strokeRect(8,8,496,cv.height-16);
  g.font='700 '+fs+'px Fraunces, Georgia, serif'; const k=Math.min(1,440/g.measureText(text).width); g.font='700 '+Math.round(fs*k)+'px Fraunces, Georgia, serif';
  g.fillStyle=o.ink||'#fff2d8'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,256,cv.height/2+3);
  const tex=new THREE.CanvasTexture(cv); tex.anisotropy=4; const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:tex,emissive:o.glow===undefined?0x14100a:o.glow}));
  m.applyMatrix4(new THREE.Matrix4().multiplyMatrices(F,new THREE.Matrix4().makeTranslation(x,y,z).multiply(new THREE.Matrix4().makeRotationY(Math.PI)))); C.root.add(m);
}
// ---- the homes: limewashed or mud-brick boxes on a plinth, a flat roof with a parapet and a row of beam ends; a rooftop room, a dome or a shaded porch on some ----
function gwHome(C,h,i){
  const [x,z,w,d,rot]=h, {A,W,R}=gwF(C,frameM(x,0,z,rot)), v=Math.floor(h3(i,7,3)*4), wh=3.0+h3(i,2,9)*0.9, y0=0.5, ry=y0+wh;
  const pl=[0xe9dcbc,0xd9c08c,0xcf9f5a,0xc98a60,0xb8895a,0xd8cdb4][Math.floor(h3(i,5,5)*6)], P=gwPlaster(pl), dk=woodC(0x3a2616), acc=[0x2c8c86,0x2d3f78,0xb8623a,0x6a4a8c][Math.floor(h3(i,6,1)*4)], trim=gwPlaster(pl*1.0-0x0a0a0a);
  A(vbox(w+0.3,y0,d+0.3,0,y0/2,0),gwStone(0xb09878,0.2)); A(vbox(w,wh,d,0,y0+wh/2,0),P); A(vbox(w-0.2,0.1,d-0.2,0,ry+0.04,0),c=>c.set(0xa88a5c)); gwParapet(A,w,d,ry,trim);   // (the roof's own slab is mud: the walls' limewash would glare)
  for(let k=0;k*1.05<w-0.8;k++){ const bx=-w/2+0.6+k*1.05; for(const sz of [-1,1]) A(vbox(0.13,0.13,0.55,bx,ry-0.35,sz*(d/2+0.18)),dk); }   // the beam ends that stick out under the roof
  A(vbox(1.1,2.1,0.14,0,y0+1.05,-d/2-0.05),dk); A(vbox(1.5,0.24,0.34,0,y0+2.2,-d/2-0.08),gwStone(0xb09878,0.2)); A(vbox(1.5,0.2,0.7,0,0.1,-d/2-0.5),gwStone(0xb09878,0.2));
  const win=(wx,wy,wz,ry2)=>{ const M=new THREE.Matrix4().makeRotationY(ry2).setPosition(wx,wy,wz); W(vbox(0.5,0.64,0.07).applyMatrix4(M)); for(const s of [-1,1]) A(vbox(0.24,0.7,0.05,s*0.4,0,0).applyMatrix4(M),woodC(acc)); };
  win(w*0.27,y0+1.9,-d/2-0.04,0); win(-w/2-0.04,y0+1.9,0,Math.PI/2); if(h3(i,4,4)<0.6) win(w/2+0.04,y0+1.9,0,-Math.PI/2); win(0,y0+1.9,d/2+0.04,Math.PI);
  if(v===1){ A(vbox(w*0.55,2.3,d*0.55,0,ry+1.15,d*0.15),P); gwParapet(A,w*0.55,d*0.55,ry+2.3,trim,0,d*0.15); W(vbox(0.5,0.6,0.07,w*0.1,ry+1.3,d*0.15-d*0.275-0.04)); A(vbox(1.0,1.9,1.0,-w*0.3,ry+0.95,-d*0.25),trim); W(vbox(0.5,0.9,0.05,-w*0.3,ry+1.2,-d*0.25-0.52));   // a rooftop room and a wind-catcher
  } else if(v===2){ const r=Math.min(w,d)*0.34; A(cyl(r,r*1.05,0.8,12).translate(0,ry+0.4,0),P); A(new THREE.SphereGeometry(r,12,6,0,TAU,0,Math.PI/2).translate(0,ry+0.8,0),gwPlaster(pl+0x0c0c0c)); A(cyl(0.05,0.05,0.9,5).translate(0,ry+0.8+r+0.35,0),c=>c.set(0xd9a032));   // a dome
  } else if(v===3){ for(const sx of [-1,1]) A(vbox(0.4,wh,0.4,sx*(w/2-0.4),y0+wh/2,-d/2-1.5),P); A(vbox(w-0.2,0.3,0.4,0,ry-0.15,-d/2-1.5),trim); R(gwCloth(w-0.2,0.08,1.9,acc,0xeee4cc,6).rotateX(0.1).translate(0,ry+0.05,-d/2-0.6)); }   // a porch under a striped cloth
  else { A(cyl(0.3,0.24,0.75,8).translate(w*0.3,ry+0.38,d*0.28),woodC(0x9a6a44)); for(const sx of [-1,1]) A(vbox(0.08,2.6,0.05,sx*0.25,ry+1.3,0).rotateZ(sx*0.12).translate(-w*0.3,0,d/2+0.12),dk); }   // a water jar, a ladder to the roof
}
// ---- a caravanserai: a walled court with a pointed gate in the front wall, four corner towers, rooms round three sides, an awning over the yard ----
function gwInn(C,p){
  const F=gwFrame(p), {A,W,R}=gwF(C,F), w=p.w, d=p.d, H=4.8, T=1.0, G=2.2, col=gwPlaster(0xcfb184), dk=woodC(0x3a2616);
  gwAtF(C,F,gwArchWall(w,H,T,[[0,G,3.9]],col),0,0,-d/2+T/2);
  gwAtF(C,F,pc(vbox(w,H,T,0,H/2,0),col),0,0,d/2-T/2); for(const sx of [-1,1]) gwAtF(C,F,pc(vbox(T,H,d-2*T,0,H/2,0),col),sx*(w/2-T/2),0,0);
  for(const sx of [-1,1]) for(const sz of [-1,1]){ A(vbox(2.8,H+2.4,2.8,sx*(w/2-1.1),(H+2.4)/2,sz*(d/2-1.1)),col); for(const k of [-1,0,1]) A(vbox(0.7,0.9,0.7,sx*(w/2-1.1)+k*0.95,H+2.85,sz*(d/2-1.1)-sz*1.1),col); }
  for(let k=-3;k<=3;k++) for(const sz of [-1,1]) A(vbox(0.9,0.9,0.4,k*2.6*(w-6)/18,H+0.45,sz*(d/2-T/2)),col);   // crenels on the front and back walls
  A(vbox(w-2*T-0.4,0.12,d-2*T-0.4,0,0.06,0),gwStone(0xb9a67e,0.2));
  for(const sx of [-1,1]){ A(vbox(3.8,3.5,d-2*T-5.6,sx*(w/2-T-1.9),1.75,1.4),col); gwParapet(A,3.8,d-2*T-5.6,3.5,col,sx*(w/2-T-1.9),1.4); for(let k=0;k<5;k++) A(vbox(0.4,3.0,0.4,sx*(w/2-T-3.9),1.5,-d/2+T+3.6+k*(d-2*T-5.6)/4.2),dk); }
  A(vbox(w-2*T-8,3.2,3.2,0,1.6,d/2-T-1.6),col); gwParapet(A,w-2*T-8,3.2,3.2,col,0,d/2-T-1.6); for(let k=0;k<5;k++) W(vbox(0.5,0.8,0.06,-4+k*2,2.1,d/2-T-3.23));
  for(const sx of [-1,1]) for(const sz of [-1,1]) A(cyl(0.1,0.12,3.9,6).translate(sx*(w/2-T-4.2),1.95,sz*3.2),dk);
  R(gwCloth(w*0.34,0.07,6.6,0x2d3f78,0xeee4cc,10).translate(0,3.95,0));                                             // the awning over the yard
  A(cyl(0.9,1.0,0.7,10).translate(0,0.4,0),gwStone(0xc4ad82,0.2)); A(cyl(0.7,0.7,0.1,10).translate(0,0.78,0),c=>c.set(0x1d7f95));   // a little fountain
  gwSign(C,F,p.name.toUpperCase(),0,H+1.3,-d/2-0.2,5.6,0.95,{bg:'#4a2a16'});
}
// ---- stables: an open shed under a slanted striped cloth, troughs, hay and a fenced yard ----
function gwStables(C,p){
  const F=gwFrame(p), {A,R}=gwF(C,F), w=p.w, d=p.d, dk=woodC(0x4a3220), big=p.w>=18&&p.id==='stables_dune';
  A(vbox(w,0.12,d,0,0.06,0),c=>c.set(0xb8a070)); A(vbox(w,2.6,0.4,0,1.3,d/2-0.2),gwPlaster(0xcfb184));
  for(let k=0;k<=Math.round(w/3.4);k++) for(const sz of [-1,1]) A(vbox(0.3,3.2,0.3,-w/2+0.2+k*(w-0.4)/Math.round(w/3.4),1.6,sz*(d/2-0.2)),dk);
  R(gwCloth(w+0.8,0.14,d+1.2,0xb8623a,0xeee4cc,Math.round(w/1.2)).rotateX(0.14).translate(0,3.35,-0.2));
  for(let k=0;k<Math.round(w/4.5);k++){ A(vbox(2.2,0.5,0.55,-w/2+2.4+k*4.5,0.3,d/2-1.1),dk); A(vbox(1.2,0.8,0.9,-w/2+3.8+k*4.5,0.4,d/2-1.2),c=>c.set(0xc9a44a)); }
  if(big){ for(let k=0;k<=8;k++){ const fx=-w/2-7+k*(w+14)/8; A(vbox(0.2,1.6,0.2,fx,0.8,-d/2-9),dk); A(vbox(0.2,1.6,0.2,fx,0.8,-d/2+2),dk); } for(const y of [0.6,1.2]) { A(vbox(w+14,0.1,0.12,0,y,-d/2-9),dk); A(vbox(w+14,0.1,0.12,0,y,-d/2+2),dk); } for(const sx of [-1,1]) for(const y of [0.6,1.2]) A(vbox(0.12,0.1,11,sx*(w/2+7),y,-d/2-3.5),dk); }   // the camel yard's fence
}
// ---- a guardhouse: a square tower house with arrow slits, crenels, a brazier and a banner ----
function gwGuard(C,p){
  const F=gwFrame(p), {A,W}=gwF(C,F), w=p.w, d=p.d, H=6.4, col=gwCourses(0xc09a62);
  A(vbox(w,H,d,0,H/2,0),col); for(let k=-1;k<=1;k++) for(const sz of [-1,1]){ A(vbox(0.9,0.9,0.7,k*(w/2-0.8),H+0.45,sz*(d/2-0.35)),col); }
  for(const sx of [-1,1]) for(let k=-1;k<=1;k+=2) A(vbox(0.7,0.9,0.9,sx*(w/2-0.35),H+0.45,k*d*0.22),col);
  A(vbox(1.2,2.2,0.14,0,1.1,-d/2-0.05),woodC(0x3a2616)); for(const s of [-1,1]) W(vbox(0.2,1.2,0.1,s*1.9,4.2,-d/2-0.05));
  A(cyl(0.07,0.07,3.2,5).translate(w/2-0.8,H+1.6,0),c=>c.set(0x3a2616)); A(vbox(0.05,1.3,1.5,w/2-0.8,H+2.6,0.8),c=>c.set(0x2d3f78)); A(vbox(0.06,0.25,1.5,w/2-0.8,H+2.6,0.8),c=>c.set(0xd9a032));
  gwSign(C,F,'GATE WATCH',0,H-1.4,-d/2-0.12,3.4,0.6,{bg:'#3a2a1a'});
}
function gwHomes(C){ GLASSWELL.homes.forEach((h,i)=>gwHome(C,h,i)); for(const p of GLASSWELL.places){ if(p.cat==='inn'&&p.id.startsWith('inn')) gwInn(C,p); else if(p.id.startsWith('stables')) gwStables(C,p); else if(p.id.startsWith('guard')) gwGuard(C,p); } }
