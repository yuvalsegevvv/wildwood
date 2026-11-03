//@ The story's two homesteads, built properly: Tansy's farm (red plank barn with a hoist, door ajar and a lean-to, hen coop and hens, haystacks, cart, trough, fence and gate, furrowed barley, Old Hob the scarecrow) and Morrow's hut (stone and timber cottage under shaggy thatch, herb bundles, cauldron, garden, woodpile)
/* Agent map. buildStoryHouses() (called from farm-props.js's buildFarmProps, itself called by generation-setup.js) merges everything into two static meshes: one lit (vertex colours) and one
   glowing (lantern glass and the hut's window). Places come from shared/main-quest.js (MQ_FARM, MQ_PLACES.hut). Client only, no colliders. Test: client-smoke.
   Style: the village's own (buildings.js): a stone plinth sunk below the slope, board and plaster walls, banded roof rows, timber trim; woodC / stoneC / prism / vbox / cyl / csph / pc / h3 are the village's helpers.
   Names start with sb (story buildings). A building is drawn in its own frame (x across, z toward the door, y up from the floor) and moved to the ground by sbFrame. */
function sbFrame(cx,cz,rot,hw,hd,low){
  let y=getH(cx,cz), lo=y;
  for(const sx of [-1,0,1]) for(const sz of [-1,0,1]){ const lx=sx*hw, lz=sz*hd, h=getH(cx+lx*Math.cos(rot)+lz*Math.sin(rot),cz-lx*Math.sin(rot)+lz*Math.cos(rot)); if(h<lo) lo=h; }
  const y0=y; if(low) y=lo-0.04;   // low: stand on the footprint's lowest point (the high side sinks a little) so a prop on a slope never floats
  return {F:frameM(cx,y,cz,rot),y,drop:y0-lo+0.35};
}
// a box with a tilt (rz about the length, ry yaw, rx pitch), moved to (x,y,z)
function sbBox(w,h,d,x,y,z,rz,ry,rx){
  const g=new THREE.BoxGeometry(w,h,d);
  if(rz||ry||rx) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx||0,ry||0,rz||0,'YXZ')));
  return g.translate(x,y,z);
}
// a colour function: a base colour with a little grain, darker toward the ground (damp), by a per-piece seed
const sbCol=(base,seed,wear)=>(x,y,z,c)=>{ c.set(base).multiplyScalar((0.86+h3(seed,Math.floor(x*4),Math.floor(z*4))*0.24)*(1-(wear||0)*Math.max(0,1-y/2.2))); };
const sbFlat=base=>(x,y,z,c)=>{ c.set(base).multiplyScalar(0.92+h3(x,y,z)*0.16); };

/* ---------------- Tansy's farm ---------------- */
// the barn in its own frame: w across (x), d deep (z, the door at +z), wall height wh, roof rise rs
function sbBarn(A,G){
  const w=8, d=11, wh=3.5, wt=wh+0.5, rs=2.6, red=0x9a3a2c, cream=0xe4d6b6, dark=0x4a3422, hw=w/2, hd=d/2;   // (the plinth, up to y 0.5, is the caller's: it is sunk into the slope)
  // floor boards inside (seen through the open door)
  A(vbox(w-0.4,0.06,d-0.4,0,0.48,0),sbFlat(0x6a5238));
  // the walls: vertical boards, each its own shade, damp and darker at the foot
  const board=(wx,wz,len,top,x0,z0,alongX,skip)=>{ const n=Math.round(len/0.3); for(let i=0;i<n;i++){ const t=-len/2+(i+0.5)*len/n, h=top(t); if(h<=0) continue;
    const segs=skip?skip(t,h):[[0.5,h]]; for(const [y0,y1] of segs) if(y1>y0) A(alongX?vbox(len/n-0.02,y1-y0,0.1,x0+t,y0+(y1-y0)/2,z0):vbox(0.1,y1-y0,len/n-0.02,x0,y0+(y1-y0)/2,z0+t),sbCol(red,i*7+wx,0.3)); } };
  for(const sx of [-1,1]) board(sx,0,d,()=>wt,sx*(hw+0.02),0,false);
  const gable=t=>wt+rs*(1-Math.abs(t)/hw)-0.12;
  const frontSkip=(t,h)=>Math.abs(t)<1.75?(Math.abs(t)<0.7?[[3.7,4.05],[5.45,h]]:[[3.7,h]]):[[0.5,h]];   // (above the door, and a hatch in the gable)
  board(2,0,w,gable,0,hd+0.02,true,frontSkip);
  board(3,0,w,gable,0,-hd-0.02,true);
  // corner posts, plate and fascia, a baseboard: cream trim
  for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.28,wt-0.4,0.28,sx*(hw+0.05),0.5+(wt-0.5)/2,sz*(hd+0.05)),sbFlat(cream));
  for(const sz of [-1,1]) A(vbox(w+0.5,0.2,0.14,0,wt-0.05,sz*(hd+0.08)),sbFlat(cream));
  for(const sx of [-1,1]) A(vbox(0.14,0.2,d+0.5,sx*(hw+0.08),wt-0.05,0),sbFlat(cream));
  for(const sx of [-1,1]) A(vbox(0.12,0.3,d+0.3,sx*(hw+0.06),0.65,0),sbFlat(dark));
  // the big door: dark interior, a jamb, a closed leaf with an X brace, the other ajar
  A(vbox(3.2,3.0,0.5,0,0.5+1.5,hd-0.15),sbFlat(0x1c140e));
  for(const [bx,by,bz,bw,bh,bd] of [[-1.75,2.0,hd+0.1,0.18,3.1,0.18],[1.75,2.0,hd+0.1,0.18,3.1,0.18],[0,3.62,hd+0.1,3.7,0.2,0.18]]) A(vbox(bw,bh,bd,bx,by,bz),sbFlat(cream));
  { const leaf=(x0,ajar)=>{ // a leaf 1.6 wide, 3.0 high, hinged at x0 (outer edge); ajar: swung open by 1.1 rad
      const parts=[]; const dir=x0<0?1:-1;
      for(let i=0;i<5;i++) parts.push(vbox(0.3,2.95,0.09,dir*(0.16+i*0.32),1.5,0).translate(0,0,0));
      parts.push(vbox(1.6,0.14,0.12,dir*0.8,0.6,0.07),vbox(1.6,0.14,0.12,dir*0.8,2.4,0.07),sbBox(2.0,0.12,0.1,dir*0.8,1.5,0.07,dir*Math.atan2(1.8,1.6)));
      const M=new THREE.Matrix4().makeTranslation(x0,0.5,hd+0.12); if(ajar) M.multiply(new THREE.Matrix4().makeRotationY(-dir*1.1));
      parts.forEach((g,i)=>A(g.applyMatrix4(M),sbCol(i<5?0xa8442f:0x6a4a30,i+x0,0.2))); };
    leaf(-1.6,false); leaf(1.6,true); }
  // hay stacked inside the dark
  for(let k=0;k<3;k++) A(vbox(1.0,0.5,0.5,-0.9+k*0.8,0.8,hd-1.1+(k%2)*0.3),sbCol(0xd8b45a,k,0));
  // the loft hatch: a cream frame, hay inside, a sill and the hoist beam with its pulley and a hanging rope
  for(const [bx,by,bw,bh] of [[-0.78,4.75,0.12,1.5],[0.78,4.75,0.12,1.5],[0,4.0,1.68,0.12],[0,5.5,1.68,0.12]]) A(vbox(bw,bh,0.14,bx,by,hd+0.1),sbFlat(cream));
  A(vbox(1.4,1.4,0.3,0,4.75,hd-0.15),sbCol(0xd8b45a,9,0)); A(vbox(1.8,0.12,0.5,0,3.96,hd+0.25),sbFlat(dark));
  A(vbox(0.16,0.16,1.5,0,5.85,hd+0.62),sbFlat(dark)); A(vbox(0.12,0.12,0.5,0,5.75,hd-0.1),sbFlat(dark));
  A(cyl(0.2,0.2,0.1,10).rotateZ(Math.PI/2).translate(0,5.7,hd+1.2),sbFlat(0x3a3a3e));
  A(vbox(0.04,2.4,0.04,0,4.5,hd+1.2),sbFlat(0xc8b890)); A(vbox(0.1,0.22,0.1,0,3.2,hd+1.2),sbFlat(0x3a3a3e));
  // the roof: rows of shingles, each a shade of its own, a ridge cap, rakes and a drip edge
  const a=Math.atan2(rs,hw), rd=d+1.1, rows=Math.ceil((Math.hypot(hw,rs)+0.7)/0.34);
  for(const sd of [-1,1]){ const ux=-sd*Math.cos(a), uy=Math.sin(a), sx0=sd*hw-ux*0.62, sy0=wt-uy*0.62;
    for(let i=0;i<rows;i++){ const s=i*0.34+0.2, g=sbBox(0.4,0.08,rd,sx0+ux*s,sy0+uy*s+0.04,0,sd===1?Math.PI-a:a);
      A(g,(x,y,z,c)=>{ c.set(0x5b4a3c).multiplyScalar(0.78+h3(i,Math.floor(z*1.8),sd)*0.34+(i%2)*0.06); if(h3(i*3,Math.floor(z*0.7),sd)>0.93) c.lerp(new THREE.Color(0x4e6a3a),0.5); }); }
    A(sbBox(0.1,0.26,rd+0.06,sx0+ux*0.0,sy0+0.05,0,sd===1?Math.PI-a:a),sbFlat(dark));
    for(const sz of [-1,1]) A(sbBox(Math.hypot(hw,rs)+0.7,0.2,0.1,sd*hw/2,wt+rs/2+0.02,sz*(rd/2+0.02),sd===1?-a:a),sbFlat(cream)); }
  A(vbox(0.5,0.16,rd+0.1,0,wt+rs+0.1,0),sbFlat(dark));
  // a weather vane on the ridge
  A(vbox(0.06,1.3,0.06,0,wt+rs+0.75,-2),sbFlat(0x2e2a26)); A(vbox(0.9,0.12,0.04,0,wt+rs+1.35,-2),sbFlat(0x2e2a26)); A(vbox(0.26,0.34,0.04,-0.4,wt+rs+1.35,-2),sbFlat(0x2e2a26));
  // a lantern by the door and a ladder-back bench
  A(vbox(0.06,0.06,0.5,2.35,3.0,hd+0.3),sbFlat(dark)); A(vbox(0.3,0.4,0.3,2.35,2.7,hd+0.52),sbFlat(0x3a3028));
  G.push(vbox(0.2,0.3,0.2,2.35,2.7,hd+0.52));
  A(vbox(1.8,0.1,0.5,-2.8,0.95,hd+0.5),sbFlat(0x7a5836)); for(const sx of [-3.5,-2.1]) A(vbox(0.1,0.9,0.4,sx,0.5,hd+0.5),sbFlat(0x5a4028));
  // the lean-to on the barn's side: posts, a shed roof, hay and a wheelbarrow under it
  const lx=-hw-3.4;
  for(const sz of [-3.5,-1.2,1.1,3.4]) A(vbox(0.2,2.3,0.2,lx,0.5+1.15,sz),sbFlat(0x6a4a30));
  A(vbox(0.2,0.2,7.4,lx,2.85,0),sbFlat(0x6a4a30)); A(vbox(0.2,0.2,7.4,-hw-0.15,3.55,0),sbFlat(0x6a4a30));   // (the lean-to's roof leans on the barn's wall below its eaves)
  { const ang=Math.atan2(3.55-2.85,3.4), len=Math.hypot(3.4,0.7)+0.5; for(let i=0;i<10;i++){ const s=(i+0.5)*len/10, g=sbBox(len/10+0.04,0.07,7.9,lx+(s-0.4)*Math.cos(ang),2.95+(s-0.4)*Math.sin(ang)+0.05,0,ang); A(g,(x,y,z,c)=>c.set(0x5b4a3c).multiplyScalar(0.8+h3(i,Math.floor(z*1.8),5)*0.3)); } }
  for(const [hx,hz,hy] of [[lx+0.1,-2.6,0],[lx+0.1,-1.5,0],[lx+0.1,-2.05,0.5],[lx-0.5,2.4,0],[lx+0.4,2.4,0]]) A(vbox(1.0,0.5,0.5,hx,0.8+hy,hz),sbCol(0xd8b45a,hx*3+hz,0));
  { const wx=lx-0.1, wz=0.6; A(sbBox(0.7,0.08,0.9,wx,0.95,wz,0,0,0),sbFlat(0x6a4a30)); for(const s of [-1,1]) A(sbBox(0.06,0.4,0.9,wx+s*0.32,1.12,wz,0.0,0,0),sbFlat(0x6a4a30)); A(cyl(0.3,0.3,0.1,10).rotateZ(Math.PI/2).translate(wx,0.82,wz+0.55),sbFlat(0x3a2a1e)); for(const s of [-1,1]) A(vbox(0.06,0.5,0.06,wx+s*0.3,0.75,wz-0.4),sbFlat(0x4a3422)); }
}
function sbCoop(A){   // a hen house on legs: a ramp, a gabled roof, a nest-box lid, a little wire run
  const wd=0x8a6a44;
  for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.12,0.6,0.12,sx*0.8,0.3,sz*0.6),sbFlat(0x5a4028));
  A(vbox(1.8,1.1,1.3,0,1.15,0),sbCol(0xb8a888,2,0.1));
  for(let i=0;i<9;i++) A(vbox(0.16,1.1,0.02,-0.8+i*0.2,1.15,0.66),sbCol(0xd8c8a4,i,0.1));
  A(prism(1.9,0.7,1.5).translate(0,1.7,0),sbCol(0x6a4a34,3,0));
  for(const sd of [-1,1]) A(sbBox(1.1,0.07,1.6,sd*0.5,2.0,0,sd*0.62),sbCol(0x6a4a34,sd+4,0));
  A(vbox(0.3,0.36,0.04,0.3,1.2,0.68),sbFlat(0x2a1e14)); A(sbBox(0.5,0.05,0.8,0.3,0.55,0.9,0,0,0.5),sbFlat(wd));
  A(vbox(0.6,0.4,0.5,1.15,1.0,0),sbCol(wd,5,0)); A(vbox(0.64,0.05,0.54,1.15,1.23,0),sbFlat(0x6a4a34));
  for(const [px,pz] of [[-1.4,1.1],[0.2,2.5],[1.8,1.1],[-1.4,2.5],[1.8,2.5]]) A(vbox(0.07,0.8,0.07,px,0.4,pz),sbFlat(0x6a4a30));
  for(const [x0,z0,x1,z1] of [[-1.4,1.1,-1.4,2.5],[-1.4,2.5,0.2,2.5],[0.2,2.5,1.8,2.5],[1.8,2.5,1.8,1.1]]) for(const y of [0.3,0.65]) A(sbBox(Math.hypot(x1-x0,z1-z0),0.03,0.03,(x0+x1)/2,y,(z0+z1)/2,0,-Math.atan2(z1-z0,x1-x0)),sbFlat(0x8a8a86));
}
function sbHen(A,col,comb){   // a low-poly hen: a body, a head with comb and beak, a fanned tail, two thin legs
  A(csph(0.17,8,6).scale(1,0.85,1.35).translate(0,0.28,0),sbFlat(col)); A(csph(0.09,7,5).translate(0,0.5,0.2),sbFlat(col));
  A(vbox(0.03,0.05,0.07,0,0.5,0.31),sbFlat(0xe0a030)); A(vbox(0.03,0.07,0.07,0,0.6,0.2),sbFlat(comb)); A(vbox(0.02,0.08,0.05,0,0.42,0.28),sbFlat(comb));
  A(sbBox(0.14,0.22,0.04,0,0.4,-0.26,0,0,-0.6),sbFlat(col)); for(const s of [-1,1]) A(vbox(0.025,0.17,0.025,s*0.06,0.09,0.0),sbFlat(0xd0a040));
}
function sbHay(A,r,h,seed){   // a haystack: a rounded cone on a pole, bound with a rope band
  const g=new THREE.CylinderGeometry(r*0.12,r,h,14,6); g.translate(0,h/2,0);
  const p=g.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i), k=1+Math.sin(y*5+seed)*0.05+Math.sin(Math.atan2(p.getZ(i),p.getX(i))*5+y)*0.04; p.setX(i,p.getX(i)*k); p.setZ(i,p.getZ(i)*k); }
  g.computeVertexNormals();
  A(g,(x,y,z,c)=>{ c.set(0xd8b45a).multiplyScalar(0.8+h3(seed,Math.floor(y*5),Math.floor(Math.atan2(z,x)*3))*0.3); });
  A(vbox(0.07,h*0.55,0.07,0,h+0.35,0),sbFlat(0x5a4028)); A(cyl(r*0.62,r*0.62,0.07,14).translate(0,h*0.35,0),sbFlat(0x8a6a3a));
}
function sbScarecrow(A){   // Old Hob: a post and a crosspole, a ragged coat and straw, a stitched sack face, a battered hat with a band, a crow on his shoulder
  A(vbox(0.14,2.6,0.14,0,1.3,0),sbFlat(0x4a3422)); A(sbBox(1.9,0.11,0.11,0,1.75,0,0.04),sbFlat(0x4a3422));
  A(vbox(0.66,0.85,0.34,0,1.45,0),sbFlat(0x8a7a48));
  for(let i=0;i<7;i++) A(sbBox(0.08,0.32,0.03,-0.27+i*0.09,0.95,0.17,0.08*(i%3-1)),sbFlat(0x8a7a48));
  for(const s of [-1,1]){ A(sbBox(0.7,0.2,0.22,s*0.75,1.65,0,0.0),sbFlat(0x7a6a3a)); for(let i=0;i<4;i++) A(sbBox(0.03,0.28,0.03,s*(1.12+i*0.02),1.5-i*0.02,(i-1.5)*0.05,0.4*s),sbCol(0xd8b45a,i,0)); }
  for(let i=0;i<7;i++) A(sbBox(0.03,0.3,0.03,-0.1+i*0.035,1.98,0.0,(i-3)*0.18),sbCol(0xd8b45a,i+9,0));
  A(csph(0.3,10,8).translate(0,2.2,0),sbFlat(0xc8b890));
  for(const s of [-1,1]) A(vbox(0.06,0.05,0.03,s*0.11,2.26,0.28),sbFlat(0x2a1e14)); A(vbox(0.22,0.025,0.03,0,2.1,0.29),sbFlat(0x2a1e14)); for(let i=0;i<5;i++) A(vbox(0.02,0.06,0.03,-0.1+i*0.05,2.1,0.3),sbFlat(0x2a1e14));
  A(cyl(0.44,0.44,0.05,12).translate(0,2.42,0),sbFlat(0x4a3a2a)); A(cyl(0.22,0.26,0.3,10).translate(0,2.58,0),sbFlat(0x4a3a2a)); A(cyl(0.265,0.265,0.06,10).translate(0,2.46,0),sbFlat(0x8a2a2a));
  A(csph(0.09,7,5).scale(1,0.8,1.3).translate(0.78,1.85,0),sbFlat(0x181818)); A(csph(0.05,6,4).translate(0.78,1.93,0.1),sbFlat(0x181818)); A(vbox(0.02,0.02,0.06,0.78,1.93,0.17),sbFlat(0x3a3020));
}
function sbBarley(A,rows,cols,x0,z0,dx,dz,poorFrom){   // furrows with barley, the last rows thin and grey at the tips (the corruption has reached the south of the field)
  for(let r=0;r<rows;r++){ const poor=r>=poorFrom, z=z0+r*dz;
    for(let k=0;k<cols;k++){ const x=x0+k*dx, y=getH(x,z), s=h3(r,k,7);
      A(vbox(dx+0.05,0.22,0.55,x,y+0.06,z),sbFlat(poor?0x4a4034:0x4a3626));
      if(poor&&s<0.3) continue;
      for(let q=0;q<3;q++){ const h=poor?0.45+s*0.25:0.95+s*0.25, ox=(q-1)*0.28+(s-0.5)*0.1, tilt=(poor?0.35:0.08)*(s-0.5+q*0.2);
        A(sbBox(0.04,h,0.04,x+ox,y+0.1+h/2,z+(q-1)*0.05,tilt),sbCol(poor?0xaaa070:0xcfae52,q+k*3,0));
        A(sbBox(0.09,0.26,0.07,x+ox+Math.sin(tilt)*h*0.5,y+0.1+h*0.95,z+(q-1)*0.05,tilt),sbCol(poor?0x8a8a7a:0xe2bd4a,q+k,0)); } } }
}
function buildStoryFarm(out,glow){
  const F0=MQ_FARM;
  const put=(cx,cz,rot,hw,hd,fn,plinth)=>{ const fr=sbFrame(cx,cz,rot,hw,hd,!plinth), A=(g,c)=>out.push(pc(g,c).applyMatrix4(fr.F)); fn(A,fr); };
  // the barn: its door faces the yard (east, toward the village)
  put(F0.x-10,F0.z-5,Math.PI/2,4,5.5,(A,fr)=>{ A(vbox(8.6,fr.drop+0.5,11.6,0,-fr.drop/2+0.25,0),stoneC); const G=[]; sbBarn(A,G); G.forEach(g=>glow.push(g.applyMatrix4(fr.F))); },true);
  // the hen house and its hens (the Sheaf-Crown game starts with "the hens first")
  put(F0.x+3,F0.z-9,0,1.8,1.5,(A)=>{ sbCoop(A); });
  const hens=[[F0.x+2,F0.z-6.5,0.4,0xf0e8d8,0xc02020],[F0.x+4.4,F0.z-6.9,2.2,0xa8602a,0xc02020],[F0.x+3.4,F0.z-5.6,-1,0x30302e,0xc02020],[F0.x+5.8,F0.z-8,4,0xd8b070,0xd04040]];
  for(const [hx,hz,hr,col,comb] of hens) put(hx,hz,hr,0.3,0.3,(A)=>sbHen(A,col,comb));
  // haystacks, a hay cart and barrels in the yard
  put(F0.x+9,F0.z-9,0,1.6,1.6,(A)=>sbHay(A,1.6,2.6,3)); put(F0.x+11.5,F0.z-6,0,1.1,1.1,(A)=>sbHay(A,1.1,1.8,8));
  put(F0.x+5,F0.z+0.5,0.5,3.0,2.0,(A)=>{   // a hay cart: a bed of boards, two spoked wheels, shafts, a heap of hay
    A(vbox(2.4,0.12,1.3,0,0.85,0),sbFlat(0x7a5836)); for(const s of [-1,1]) A(vbox(2.4,0.35,0.08,0,1.05,s*0.65),sbFlat(0x6a4a30)); for(const s of [-1,1]) A(vbox(0.08,0.35,1.3,s*1.2,1.05,0),sbFlat(0x6a4a30));
    for(const s of [-1,1]){ A(cyl(0.5,0.5,0.1,14).rotateX(Math.PI/2).translate(0,0.5,s*0.78),sbFlat(0x5a4028)); A(cyl(0.38,0.38,0.12,12).rotateX(Math.PI/2).translate(0,0.5,s*0.78),sbFlat(0x2a1e14)); for(let i=0;i<4;i++) A(sbBox(0.9,0.06,0.08,0,0.5,s*0.84,i*Math.PI/4),sbFlat(0x6a4a30)); }
    for(const s of [-1,1]) A(sbBox(1.8,0.08,0.08,-2.0,0.75,s*0.45,s*-0.03,0,0.0),sbFlat(0x6a4a30)); A(csph(0.9,10,6).scale(1.2,0.55,0.7).translate(0,1.25,0),sbCol(0xd8b45a,11,0)); });
  for(const [bx,bz] of [[F0.x-3,F0.z+1.5],[F0.x-2.1,F0.z+2.2]]) put(bx,bz,0,0.5,0.5,(A)=>{ A(cyl(0.42,0.38,0.85,12).translate(0,0.42,0),sbCol(0x7a5836,bx,0.1)); for(const y of [0.2,0.65]) A(cyl(0.44,0.44,0.05,12).translate(0,y,0),sbFlat(0x3a3a3e)); });
  put(F0.x-0.5,F0.z+1.6,0.2,1.2,0.5,(A)=>{ A(vbox(2.0,0.45,0.6,0,0.5,0),sbCol(0x7a5836,2,0)); A(vbox(1.8,0.04,0.45,0,0.7,0),sbFlat(0x4a7a90)); for(const s of [-1,1]) A(vbox(0.12,0.4,0.5,s*0.8,0.2,0),sbFlat(0x5a4028)); });   // a trough with water
  // the field: furrows and barley, Old Hob in the middle
  sbBarley((g,c)=>out.push(pc(g,c)),9,10,F0.x-8,F0.z+5,1.5,1.15,6);
  put(F0.x+2.5,F0.z+8.5,0.3,0.5,0.5,(A)=>sbScarecrow(A));
  // the fence: posts and two rails along the road side (a gap for the gate) and the south edge
  const rail=(x0,z0,x1,z1)=>{ const n=Math.max(1,Math.round(Math.hypot(x1-x0,z1-z0)/1.8)); for(let i=0;i<=n;i++){ const x=x0+(x1-x0)*i/n, z=z0+(z1-z0)*i/n, y=getH(x,z); out.push(pc(vbox(0.14,1.25,0.14,x,y+0.55,z),sbCol(0x7a5836,i+x,0.1)));
      if(i<n){ const xm=(x+x0+(x1-x0)*(i+1)/n)/2, zm=(z+z0+(z1-z0)*(i+1)/n)/2, ym=getH(xm,zm), yaw=-Math.atan2(z1-z0,x1-x0), L=Math.hypot(x1-x0,z1-z0)/n; for(const hy of [0.55,0.95]) out.push(pc(sbBox(L,0.09,0.06,xm,ym+hy,zm,0,yaw),sbCol(0x8a6a44,i+hy*9,0.05))); } } };
  rail(F0.x+14,F0.z-12,F0.x+14,F0.z+0.5); rail(F0.x+14,F0.z+4.5,F0.x+14,F0.z+17); rail(F0.x+14,F0.z+17,F0.x-9,F0.z+17);
  put(F0.x+14,F0.z+2.5,0,0.5,1.6,(A)=>{ for(const s of [-1,1]) A(vbox(0.2,1.6,0.2,0,0.8,s*1.7),sbFlat(0x5a4028)); A(vbox(0.1,0.1,3.4,0,1.55,0),sbFlat(0x5a4028)); for(const s of [-1,1]) A(vbox(0.08,0.9,1.5,0.1,0.75,s*0.8),sbFlat(0x8a6a44)); });
}

/* ---------------- Morrow's hut ---------------- */
function sbThatch(A,w,d,wh,rs,ov,seed){   // shaggy thatch: overlapping thick rows, ragged lower edges, moss, a rolled ridge
  const hw=w/2, a=Math.atan2(rs,hw), rows=Math.ceil((Math.hypot(hw,rs)+ov)/0.3);
  for(const sd of [-1,1]){ const ux=-sd*Math.cos(a), uy=Math.sin(a), sx0=sd*hw-ux*ov, sy0=wh-uy*ov;
    for(let i=0;i<rows;i++){ const s=i*0.3+0.15; for(let k=0;k<Math.ceil((d+0.9)/0.7);k++){ const kz=-(d+0.9)/2+0.35+k*0.7, j=h3(seed+i,k,sd), len=0.7+j*0.25, th=0.16+(i<2?0.08:0);
        A(sbBox(0.42,th,len,sx0+ux*s,sy0+uy*s+0.06,kz+(j-0.5)*0.14,sd===1?Math.PI-a:a,(j-0.5)*0.12),(x,y,z,c)=>{ c.set(0xb89a58).multiplyScalar(0.72+h3(seed,i,k)*0.4); if(h3(i,k*3,seed)>0.86) c.lerp(new THREE.Color(0x5a7a3a),0.55); if(i<2) c.multiplyScalar(0.8); }); } } }
  for(let k=0;k<Math.ceil((d+1)/0.9);k++) A(sbBox(0.45,0.3,0.95,0,wh+rs+0.14,-(d+0.9)/2+0.45+k*0.9,0,(h3(seed,k,3)-0.5)*0.2),sbCol(0xa88a48,k+seed,0));
  A(sbBox(0.16,0.2,d+1.0,0,wh+rs+0.3,0),sbFlat(0x5a4a30));
}
function sbHerbs(A,x,y,z,n,seed){   // bundles of herbs hung upside down to dry: a string, a tied bunch, grey at the tips here and there
  for(let i=0;i<n;i++){ const bx=x+i*0.42, g=h3(seed,i,2)>0.6;
    A(vbox(0.015,0.3,0.015,bx,y+0.15,z),sbFlat(0x8a7a5a)); A(sbBox(0.1,0.34,0.1,bx,y-0.1,z,(h3(seed,i,4)-0.5)*0.3),sbCol(0x6a8a4a,i+seed,0));
    A(sbBox(0.17,0.16,0.14,bx,y-0.34,z,0.1),sbCol(g?0x8a9484:0x7a9a58,i+seed,0)); }
}
function buildStoryHut(out,glow){
  const H=MQ_PLACES.hut, hx=H.x+5, hz=H.z, W=5.2, D=4.2, wh=2.3, rs=2.1;
  const fr=sbFrame(hx,hz,-Math.PI/2,W/2,D/2), A=(g,c)=>out.push(pc(g,c).applyMatrix4(fr.F)), G=g=>glow.push(g.applyMatrix4(fr.F)), hwx=W/2, hwz=D/2, T=0x4a3422;
  // a stone plinth sunk into the slope, a course of fieldstones on it; cob and plaster above, framed in dark timber
  A(vbox(W+0.5,fr.drop+0.6,D+0.5,0,-fr.drop/2+0.3,0),stoneC);
  for(const sz of [-1,1]) for(let i=0;i<9;i++){ const jx=h3(i,sz,5); A(vbox(0.55+jx*0.2,0.3+jx*0.1,0.3,-hwx+0.35+i*(W-0.7)/8,0.76,sz*(hwz+0.05)),sbCol(0x8a8478,i+sz*9,0)); }
  for(const sx of [-1,1]) for(let i=0;i<7;i++){ const jx=h3(i,sx,6); A(vbox(0.3,0.3+jx*0.1,0.55+jx*0.2,sx*(hwx+0.05),0.76,-hwz+0.35+i*(D-0.7)/6),sbCol(0x8a8478,i+sx*7+30,0)); }
  A(vbox(W,wh-0.5,D,0,0.9+(wh-0.5)/2,0),(x,y,z,c)=>{ c.set(0xd6c8a4).multiplyScalar(0.84+h3(Math.floor(x*3),Math.floor(y*3),Math.floor(z*3))*0.22); if(y<1.4) c.multiplyScalar(0.84); });
  for(const sx of [-1,1]) for(const sz of [-1,1]) A(sbBox(0.2,wh-0.4,0.2,sx*(hwx+0.04),0.9+(wh-0.4)/2,sz*(hwz+0.04),(sx*sz)*0.01),sbFlat(T));
  for(const sz of [-1,1]){ A(vbox(W+0.12,0.16,0.14,0,0.95,sz*(hwz+0.05)),sbFlat(T)); A(vbox(W+0.12,0.18,0.14,0,wh-0.05,sz*(hwz+0.05)),sbFlat(T)); A(vbox(0.12,wh-1.0,0.12,0,0.95+(wh-1.0)/2,sz*(hwz+0.07)),sbFlat(T)); }
  for(const sx of [-1,1]){ A(vbox(0.14,0.16,D+0.12,sx*(hwx+0.05),0.95,0),sbFlat(T)); A(vbox(0.14,0.18,D+0.12,sx*(hwx+0.05),wh-0.05,0),sbFlat(T)); A(sbBox(0.1,0.1,1.7,sx*(hwx+0.07),1.6,0.7*sx,0,0,0.7*sx),sbFlat(T)); }
  A(sbBox(1.6,0.1,0.1,1.7,1.5,-hwz-0.07,0.7),sbFlat(T));
  // the gable above the plaster, then the thatch
  A(prism(W,rs,D).translate(0,wh,0),sbFlat(0xb89a58));
  sbThatch(A,W,D,wh,rs,0.95,5);
  // the door: planks, a lintel and jambs, iron straps, a stone step; a lantern on an iron arm
  A(vbox(1.0,1.65,0.12,0,0.95+0.82,hwz+0.04),sbFlat(0x5a3e28)); for(let i=0;i<4;i++) A(vbox(0.02,1.6,0.01,-0.36+i*0.24,1.77,hwz+0.11),sbFlat(0x3a2818));
  A(vbox(1.4,0.16,0.2,0,2.67,hwz+0.06),sbFlat(T)); for(const s of [-1,1]) A(vbox(0.16,1.75,0.2,s*0.6,1.77,hwz+0.06),sbFlat(T));
  for(const y of [1.35,2.15]) A(vbox(0.85,0.06,0.04,-0.05,y,hwz+0.13),sbFlat(0x2a2a2e));
  A(vbox(0.07,0.07,0.04,0.34,1.8,hwz+0.12),sbFlat(0xc8a848)); A(vbox(1.5,0.2,0.7,0,0.1,hwz+0.5),stoneC);
  A(vbox(0.05,0.05,0.5,1.1,2.1,hwz+0.3),sbFlat(0x2a2a2e)); A(vbox(0.26,0.3,0.26,1.1,1.85,hwz+0.5),sbFlat(0x2a2a2e)); G(vbox(0.16,0.2,0.16,1.1,1.85,hwz+0.5));
  // a window with open shutters and a warm glow, a pot of grey-tipped herbs on the sill
  A(vbox(0.8,0.7,0.1,-1.6,1.5,hwz+0.05),sbFlat(0x2a2a2e)); G(vbox(0.64,0.54,0.06,-1.6,1.5,hwz+0.1));
  for(const [bx,by,bw,bh] of [[-1.6,1.88,0.9,0.1],[-1.6,1.12,0.96,0.1],[-1.6,1.5,0.06,0.7],[-2.04,1.5,0.1,0.8],[-1.16,1.5,0.1,0.8]]) A(vbox(bw,bh,0.14,bx,by,hwz+0.1),sbFlat(T));
  for(const s of [-1,1]) A(sbBox(0.4,0.8,0.05,-1.6+s*0.72,1.5,hwz+0.25,0,s*0.9),sbFlat(0x4a6a58));
  A(cyl(0.12,0.09,0.16,8).translate(-1.6,1.04,hwz+0.3),sbFlat(0x8a5a3a)); for(let i=0;i<3;i++) A(sbBox(0.03,0.3,0.03,-1.68+i*0.08,1.22,hwz+0.3,(i-1)*0.25),sbCol(0x7a9a58,i,0));
  // herb bundles drying from a beam under each eave and a bunch by the door, a broom, a rain barrel, wind chimes of coloured glass
  for(const sx of [-1,1]){ A(vbox(0.06,0.06,D-0.4,sx*(hwx+0.3),1.95,0),sbFlat(T));
    sbHerbs((g,c)=>A(g.applyMatrix4(new THREE.Matrix4().makeRotationY(sx*Math.PI/2)),c),-1.5,1.8,hwx+0.3,8,sx*5+9); }
  A(vbox(0.06,1.5,0.06,2.3,0.95,hwz+0.35),sbFlat(0x6a4a30)); A(sbBox(0.26,0.4,0.2,2.3,0.2,hwz+0.35),sbCol(0xb89a58,4,0));
  A(cyl(0.5,0.44,0.9,12).translate(-2.4,0.55,hwz+0.7),sbCol(0x6a4a34,6,0.1)); for(const y of [0.3,0.8]) A(cyl(0.52,0.52,0.05,12).translate(-2.4,y,hwz+0.7),sbFlat(0x3a3a3e)); A(cyl(0.44,0.44,0.03,12).translate(-2.4,1.0,hwz+0.7),sbFlat(0x3a5a6a));
  A(vbox(0.05,0.05,0.9,-0.4,2.0,hwz+0.55),sbFlat(0x2a2a2e));
  for(let i=0;i<5;i++){ const l=0.3+h3(i,1,1)*0.3; A(vbox(0.01,l,0.01,-0.6+i*0.16,2.0-l/2,hwz+0.8),sbFlat(0xaaa090)); G(vbox(0.07,0.14,0.07,-0.6+i*0.16,2.0-l-0.05,hwz+0.8)); }
  // the chimney, crooked, of stacked stones, with a clay pot on top
  { const cx=hwx-0.7, cz=-hwz+0.4; for(let i=0;i<9;i++) A(sbBox(0.9-i*0.01,0.42,0.9,cx+Math.sin(i*0.7)*0.04,wh+0.4*i+0.2,cz,0,0.05*i),sbCol(0x8a8478,i+20,0)); A(cyl(0.3,0.26,0.4,8).translate(cx,wh+3.9,cz),sbFlat(0x9a5a3a)); }
  // a woodpile against the east wall under the eave
  for(let r=0;r<3;r++) for(let k=0;k<6-r;k++) A(cyl(0.13,0.13,1.1,7).rotateZ(Math.PI/2).translate(hwx+0.75,0.15+r*0.26,-0.8+k*0.3+r*0.15),sbCol(0x6a4a30,r*9+k,0.1));
  // the cauldron on its tripod out front, green liquid, a stool and a mortar
  { const cx=-3.4, cz=hwz+1.7; for(let i=0;i<3;i++){ const a=i*2.09; A(sbBox(0.07,1.5,0.07,cx+Math.sin(a)*0.5,0.75,cz+Math.cos(a)*0.5,Math.sin(a)*0.35,0,Math.cos(a)*0.35),sbFlat(0x3a2a1e)); }
    A(csph(0.42,12,8).scale(1,0.8,1).translate(cx,0.78,cz),sbFlat(0x1e1e22)); A(cyl(0.34,0.34,0.03,12).translate(cx,1.0,cz),sbFlat(0x3a8a4a)); G(cyl(0.3,0.3,0.02,12).translate(cx,1.03,cz));
    A(cyl(0.22,0.2,0.4,8).translate(cx+1.2,0.2,cz+0.3),sbCol(0x7a5836,3,0)); A(cyl(0.16,0.12,0.14,8).translate(cx+1.2,0.48,cz+0.3),sbFlat(0x8a8a86)); }
}
// the herb garden by the hut: three raised beds with wicker edges, leafy plants, grey at the tips here and there (in world coordinates: north of the hut)
function sbGarden(out){
  const H=MQ_PLACES.hut;
  for(let b=0;b<3;b++){ const bx=H.x+0.8+b*3.0, bz=H.z-5.4, w=2.4, d=1.5, y=getH(bx,bz);
    for(const [ox,oz,sw,sd] of [[0,-d/2,w,0.1],[0,d/2,w,0.1],[-w/2,0,0.1,d],[w/2,0,0.1,d]]) out.push(pc(vbox(sw,0.35,sd,bx+ox,y+0.15,bz+oz),sbCol(0xa8884a,b*4+ox,0)));
    out.push(pc(vbox(w-0.1,0.3,d-0.1,bx,y+0.12,bz),sbFlat(0x3e2e20)));
    for(let k=0;k<6;k++){ const px=bx-w/2+0.3+(k%3)*0.9+(h3(b,k,1)-0.5)*0.2, pz=bz-0.35+Math.floor(k/3)*0.7, s=0.8+h3(b,k,2)*0.5, grey=h3(b,k,3)>0.55;
      const g=csph(0.28*s,8,6).scale(1,0.8,1).translate(px,y+0.5,pz); out.push(pc(g,sbCol(b===1?0x8a9a5a:0x6a9a50,k+b*7,0)));
      const t=csph(0.16*s,7,5).translate(px+0.05,y+0.72,pz); out.push(pc(t,sbCol(grey?0x8a9484:0x9ab868,k+b*5,0))); }
  }
  for(let i=0;i<7;i++){ const x=H.x-1.2+i*0.55, z=H.z-1.0+(i%2)*0.2, y=getH(x,z); out.push(pc(vbox(0.5,0.06,0.4,x,y+0.03,z),sbFlat(0x8a8478))); }   // stepping stones to the door
}
function buildStoryHouses(){
  const out=[], glow=[];
  buildStoryFarm(out,glow); buildStoryHut(out,glow); sbGarden(out);
  const mesh=new THREE.Mesh(merge(out),villageMat); mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh);
  const gl=new THREE.Mesh(merge(glow.map(g=>pc(g,(x,y,z,c)=>c.set(0xffc868)))),new THREE.MeshBasicMaterial({vertexColors:true})); scene.add(gl);
}
