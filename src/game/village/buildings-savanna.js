//@ Amber Reach's buildings: Tallgrass (round mud-brick huts under thatch, reed-awned stalls, torch posts, drums), the Moot Baobab at its heart (a hollow tree wide as a hall, a platform and rope bridges in its crown), the gate posts and the reed landing
/* Agent map: buildTallgrass() is called by generation-setup.js after buildGloamhorn (once). Tallgrass follows the home village's plan (VIL7 from shared/tallgrass.js: the same houses, stalls, anchors and colliders)
   in warm earth: mud-brick walls banded in the seven houses' colours, thatch cones, no snow. TG_BAOBAB is the trunk (its collider comes from VIL7.circles); the model is the trunk, a root flare, six branches with
   flat leaf crowns, a plank platform ring at 6 m with three rope ladders, two rope bridges between crown branches and a hollow door facing the road. TG_LANDING (null when no water is near): a plank jetty
   out over the water with posts. The teleport circle is drawn for every village by buildCircle (buildings-vale.js). Budget: a few thousand triangles, no per-blade or per-fur detail (a phone draws it).
   Tests: tools/client-smoke.js builds it; look at it with tools/shot.js --at <VIL7.x>,<VIL7.z>,0. Names: TGB, tgb... */
const TGB={built:false};
const tgbThatch=base=>(x,y,z,c)=>{ c.set(base).multiplyScalar(0.78+h3(Math.floor(x*4),Math.floor(y*3),Math.floor(z*4))*0.4); };
const tgbBrick=base=>(x,y,z,c)=>{ const b=Math.floor(y*2.4), k=Math.floor((x+z)*1.8+(b&1)*0.5); c.set(base).multiplyScalar(0.82+h3(k,b,5)*0.28); if(y<0.7) c.multiplyScalar(0.82); };
const tgbBark=(x,y,z,c)=>{ c.set(0x8a7a66).multiplyScalar(0.72+h3(Math.floor(Math.atan2(z,x)*9),Math.floor(y*1.2),4)*0.42); };
const TGB_BANDS=[0xc84a2a,0xe0a030,0x3a7aa0,0x7a9a3a,0xf0e8d0,0x8a4a7a,0x2a8a6a];   // the seven houses' colours
function buildTallgrass(){
  if(TGB.built) return; TGB.built=true;
  const out=[], win=[], V=VIL7, Y=V.h;
  const inF=F=>({A:(g,fn)=>out.push(pc(g,fn).applyMatrix4(F)), N:(g,fn)=>out.push(paint(g,fn).applyMatrix4(F)), W:(g,col)=>win.push(pc(g,c=>c.set(col||0xffc060)).applyMatrix4(F))});
  const dark=woodC(0x3a2414), timber=woodC(0x6a4a2a), iron=c=>c.set(0x3a3630);
  for(const H of V.houses){   // a round hut: brick drum, a coloured band, a thatch cone with a smoke hole, a door and two slit windows
    const {A,N,W}=inF(frameM(H.x,Y,H.z,H.rot)), R=Math.min(H.w,H.d)/2+0.1, wh=H.wh, band=TGB_BANDS[H.i%7], tav=!!H.tavern, rr=tav?R*1.12:R;
    A(new THREE.CylinderGeometry(rr+0.25,rr+0.35,0.6,10).translate(0,0.3,0),stoneC);
    A(new THREE.CylinderGeometry(rr,rr,wh,10,2).translate(0,0.5+wh/2,0),tgbBrick(0xb07a4a));
    A(new THREE.CylinderGeometry(rr+0.04,rr+0.04,0.32,10).translate(0,0.5+wh*0.72,0),c=>c.set(band));
    const ch=Math.max(2.2,rr*0.95)+(tav?0.8:0);
    N(new THREE.ConeGeometry(rr+0.9,ch,10).translate(0,0.5+wh+ch/2-0.1,0),tgbThatch(tav?0xb89a48:0xc8a458));
    A(new THREE.CylinderGeometry(0.28,0.34,0.4,6).translate(0,0.5+wh+ch-0.2,0),dark);
    A(vbox(1.2,2.0,0.14,0,0.5+1.0,-rr+0.02),dark); A(vbox(1.5,0.2,0.2,0,0.5+2.1,-rr),timber);
    for(const sd of [-1,1]){ const a=sd*1.25, wx=Math.sin(a)*rr, wz=-Math.cos(a)*rr; W(vbox(0.34,0.7,0.06).rotateY(-a).translate(wx,0.5+wh*0.62,wz)); }
    if(tav){ for(let k=0;k<4;k++){ const a=2.2+k*0.5; A(vbox(0.1,wh*0.8,0.1,Math.sin(a)*(rr+0.5),0.5+wh*0.4,Math.cos(a)*(rr+0.5)),dark); } A(new THREE.CylinderGeometry(0.34,0.3,0.7,8).translate(rr+0.9,0.35,0),c=>c.set(0x9a5a3a)); }   // the moot-house: porch posts and a water jar
    if(H.chimney) vsmAdd(new THREE.Vector3(0,0.5+wh+ch,0).applyMatrix4(frameM(H.x,Y,H.z,H.rot)));
    if(H.i%3===0) A(new THREE.CylinderGeometry(0.36,0.3,0.7,8).translate(-rr-0.9,0.35,0.4),c=>c.set(0x9a5a3a));   // a clay jar
    else if(H.i%3===1) for(let k=0;k<3;k++) A(cyl(0.05,0.05,1.1,5).translate(rr+0.7+k*0.35,0.55,0.2),woodC(0x6a4a2a));   // grain drying on poles
  }
  { // the Moot Baobab: the trunk bulges toward the base, a root flare, a hollow doorway toward the road
    const B=TG_BAOBAB, ent=V.ent, {A,N}=inF(frameM(B.x,Y,B.z,ent));
    const trunk=new THREE.CylinderGeometry(2.7,3.3,9,18,5); { const p=trunk.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i), bulge=1+0.16*Math.sin((y+4.5)/9*Math.PI), a=Math.atan2(p.getZ(i),p.getX(i)); const k=bulge*(1+0.05*Math.sin(a*5+y*0.4)); p.setX(i,p.getX(i)*k); p.setZ(i,p.getZ(i)*k); } trunk.computeVertexNormals(); }
    N(trunk.translate(0,4.5,0),tgbBark);
    N(new THREE.CylinderGeometry(3.5,5.0,1.6,18,1).translate(0,0.8,0),tgbBark);
    A(vbox(0.5,3.4,0.5,-1.0,1.7,-3.3),c=>c.set(0x1c1008)); A(vbox(0.5,3.4,0.5,1.0,1.7,-3.3),c=>c.set(0x1c1008)); A(vbox(2.5,0.6,0.5,0,3.5,-3.3),c=>c.set(0x1c1008)); A(vbox(1.7,3.2,0.4,0,1.6,-3.0),c=>c.set(0x0c0604));   // the hollow doorway (local -z faces the road)
    const crowns=[];
    for(let k=0;k<6;k++){   // branches climbing out of the top, a flat crown on each
      const a=k/6*TAU+0.3, lean=0.75+0.12*h3(k,1,1), L=6.4+h3(k,2,2)*1.8, bx=Math.sin(a)*(L*0.5*Math.sin(lean)), bz=Math.cos(a)*(L*0.5*Math.sin(lean));
      const br=new THREE.CylinderGeometry(0.36,0.62,L,7).translate(0,L/2,0).rotateZ(-lean).rotateY(a-Math.PI/2).translate(0,8.6,0); N(br,tgbBark);
      const ex=Math.sin(a)*L*Math.sin(lean), ez=Math.cos(a)*L*Math.sin(lean), ey=8.6+L*Math.cos(lean); crowns.push([ex,ey,ez]);
      A(new THREE.IcosahedronGeometry(3.4+h3(k,3,3)*0.8,1).scale(1,0.42,1).translate(ex,ey+0.4,ez),(x,y,z,c)=>{ c.set(0x6e8c3a).multiplyScalar(0.7+h3(Math.floor(x*2),Math.floor(y*3),Math.floor(z*2))*0.5); });
    }
    A(new THREE.IcosahedronGeometry(4.2,1).scale(1,0.4,1).translate(0,9.4,0),c=>c.set(0x7a9a42));
    A(new THREE.CylinderGeometry(5.2,5.2,0.3,16).translate(0,6.0,0),timber);   // the platform ring at 6 m, with a rail
    for(let k=0;k<12;k++){ const a=k/12*TAU; A(vbox(0.1,1.0,0.1,Math.sin(a)*5.0,6.65,Math.cos(a)*5.0),dark); }
    A(new THREE.TorusGeometry(5.0,0.05,4,24).rotateX(Math.PI/2).translate(0,7.15,0),dark);
    for(let k=0;k<3;k++){ const a=k*2.1+1.0, lx=Math.sin(a)*5.0, lz=Math.cos(a)*5.0;   // rope ladders down to the roots
      for(const sd of [-0.28,0.28]) A(cyl(0.02,0.02,6,4).translate(lx+Math.cos(a)*sd,3,lz-Math.sin(a)*sd),c=>c.set(0xb8a070));
      for(let r=0;r<8;r++) A(vbox(0.7,0.05,0.1,lx,0.5+r*0.72,lz).rotateY(a),dark); }
    for(let k=0;k<2;k++){   // rope bridges between crown branches (decoration; the platform is above reach)
      const p0=crowns[k*2], p1=crowns[k*2+1], mx=(p0[0]+p1[0])/2, mz=(p0[2]+p1[2])/2, len=Math.hypot(p1[0]-p0[0],p1[2]-p0[2]), ang=Math.atan2(p1[0]-p0[0],p1[2]-p0[2]), y=Math.min(p0[1],p1[1])-1.1;
      for(let j=1;j<10;j++) A(vbox(0.9,0.06,0.28,0,0,0).rotateY(ang).translate(p0[0]+(p1[0]-p0[0])*j/10,y-Math.sin(j/10*Math.PI)*0.7,p0[2]+(p1[2]-p0[2])*j/10),dark);
      for(const sd of [-0.5,0.5]) A(cyl(0.02,0.02,len,4).rotateX(Math.PI/2).rotateY(ang).translate(mx+Math.cos(ang)*sd,y+0.55,mz-Math.sin(ang)*sd),c=>c.set(0xb8a070)); }
    for(let k=0;k<5;k++){ const a=k/5*TAU+0.6; W(vbox(0.22,0.3,0.22,Math.sin(a)*5.0,6.9,Math.cos(a)*5.0),0xffb050); }   // lanterns round the platform rail
  }
  for(const st of V.stalls){   // reed-awned stalls
    const {A}=inF(frameM(st.x,Y,st.z,st.rot));
    A(vbox(2.6,0.9,1.1,0,0.45,0),timber); A(vbox(2.7,0.08,1.2,0,0.94,0),woodC(0x8a6a3a));
    for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.13,2.5,0.13,sx*1.25,1.25,sz*0.5),dark);
    A(new THREE.BoxGeometry(3.4,0.22,2.1).rotateX(0.12).translate(0,2.55,0),tgbThatch(0xc8a458));
    for(let k=0;k<5;k++) A(vbox(0.5,0.34,0.02,-1.0+k*0.5,2.25,-0.62),c=>c.set(TGB_BANDS[(k+st.i*2)%7]));   // a fringe of coloured cloth
    if(st.i===0){ for(let k=0;k<3;k++) A(vbox(0.12,0.9,0.05,-0.8+k*0.8,1.85,0.5).rotateZ(0.1-k*0.1),c=>c.set(0x9aa0a8)); }
    else if(st.i===1){ for(let k=0;k<4;k++) A(vbox(0.42,0.8,0.05,-1.0+k*0.6,1.9,0.5),c=>c.set([0x8a5a2a,0xa06a30,0x7a4a22,0x946030][k])); }
    else { A(vbox(0.34,0.4,0.3,1.95,0.2,0.55),timber); A(vbox(0.56,0.16,0.26,1.95,0.62,0.55),iron); A(cyl(0.34,0.24,0.5,10).translate(-1.95,0.25,0.5),iron);
      const p=new THREE.Vector3(-1.95,0.62,0.5).applyAxisAngle(new THREE.Vector3(0,1,0),st.rot);
      const m=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.45,7),flameMats[1]); m.position.set(st.x+p.x,Y+p.y,st.z+p.z); scene.add(m); flames.push(m); }
  }
  { const B=V.board, {A}=inF(frameM(B.x,Y,B.z,B.rot));   // the quest board: two carved posts and a board of notices
    for(const sx of [-1,1]){ A(vbox(0.34,3.5,0.34,sx*1.9,1.75,0),timber); A(new THREE.ConeGeometry(0.3,0.6,5).translate(sx*1.9,3.8,0),woodC(0xc84a2a)); }
    A(vbox(3.6,2.0,0.1,0,1.95,0),woodC(0x8a6a3a)); A(vbox(4.2,0.16,0.22,0,3.0,0),dark); A(vbox(4.4,0.14,0.26,0,0.9,0),dark); A(vbox(4.7,0.26,1.1,0,3.3,0),tgbThatch(0xc8a458));
    [[-1.2,2.4],[-0.4,2.45],[0.45,2.4],[1.25,2.45],[-1.25,1.5],[-0.45,1.55],[0.4,1.5],[1.2,1.55]].forEach(([x,y],i)=>A(new THREE.BoxGeometry(0.56,0.7,0.012).rotateZ((h3(i,3,7)-0.5)*0.2).translate(x,y,0.062),c=>c.set([0xf0e8d0,0xe8dcc0,0xe0d0a8][i%3])));
    questSign(B,Y,{bg:'#4a2a14',line:'#e0a030',ink:'#fff0cc',font:60,w:2.2,h:0.48,y:3.02,z:0.13,glow:0x201004}); }
  { const fp=V.fire, {A}=inF(frameM(fp.x,Y,fp.z,0));   // the moot fire and the talking drum beside it
    A(cyl(0.9,1.05,0.35,9).translate(0,0.17,0),stoneC); A(cyl(0.68,0.68,0.05,9).translate(0,0.36,0),c=>c.set(0x1a1410));
    for(let k=0;k<4;k++) A(cyl(0.09,0.09,1.1,6).rotateZ(Math.PI/2).rotateY(k*0.8).translate(0,0.44,0),woodC(0x4a3020));
    A(cyl(0.45,0.38,1.0,10).translate(2.2,0.5,0.6),woodC(0x7a4a22)); A(cyl(0.44,0.44,0.05,10).translate(2.2,1.02,0.6),c=>c.set(0xe8d8b0));
    for(let k=0;k<4;k++){ const m=new THREE.Mesh(new THREE.ConeGeometry(k===0?0.34:0.2,k===0?1.1:0.7,7),flameMats[k===0?0:1]); m.position.set(fp.x+(k?Math.sin(k*2.1)*0.2:0),Y+0.85,fp.z+(k?Math.cos(k*2.1)*0.2:0)); scene.add(m); flames.push(m); } }
  for(const b of V.benches){ const {A}=inF(frameM(b.x,Y,b.z,b.rot)); A(cyl(0.24,0.24,1.9,8).rotateZ(Math.PI/2).translate(0,0.36,0),woodC(0x6a4a2a)); A(vbox(1.9,0.05,0.34,0,0.6,0),c=>c.set(0x8a6a3a)); }
  for(const l of V.lamps){   // torch posts
    const {A}=inF(frameM(l.x,Y,l.z,l.rot));
    A(cyl(0.07,0.1,2.0,6).translate(0,1.0,0),timber); A(cyl(0.2,0.12,0.3,7).translate(0,2.1,0),iron);
    const m=new THREE.Mesh(new THREE.ConeGeometry(0.15,0.42,7),flameMats[0]); m.position.set(l.x,Y+2.4,l.z); scene.add(m); flames.push(m); }
  for(const [x,z] of V.barrels){ const {A}=inF(frameM(x,Y,z,0)); A(new THREE.SphereGeometry(0.42,9,7).scale(1,1.1,1).translate(0,0.45,0),c=>c.set(0x9a5a3a)); A(cyl(0.22,0.26,0.16,8).translate(0,0.95,0),c=>c.set(0x7a4a2a)); }
  for(const [x,z,r] of V.crates){ const {A}=inF(frameM(x,Y,z,r)); A(vbox(0.7,0.6,0.7,0,0.3,0),woodC(0x6a4a2a)); }
  { const G=V.garden, {A}=inF(frameM(G.x,Y,G.z,G.rot));   // the healer's herb yard: raised beds, drying racks
    A(vbox(5.8,0.1,4.2,0,0.05,0),(x,y,z,c)=>{ c.set(0x7a5a38).multiplyScalar(0.85+0.12*(Math.floor(x*2.2)&1)); });
    for(let k=0;k<3;k++){ A(vbox(1.4,0.3,0.8,-1.6+k*1.6,0.25,-1.0),woodC(0x6a4a2a)); A(vbox(1.2,0.12,0.6,-1.6+k*1.6,0.42,-1.0),(x,y,z,c)=>c.set([0x5a8a3a,0x8a9a3a,0x6a8a50][k])); }
    for(const sx of [-1,1]) A(vbox(0.14,2.3,0.14,sx*1.4,1.15,1.7),dark); A(vbox(3.1,0.12,0.14,0,2.3,1.7),dark);
    for(let k=0;k<4;k++){ const px=-1.05+k*0.7; A(cyl(0.025,0.025,1.1,5).translate(px,1.7,1.62),woodC(0x6a4a2a)); A(vbox(0.4,0.06,0.06,px,2.2,1.62),c=>c.set([0x6a8a3a,0xa0903a,0x7a6a3a,0x8a4a3a][k])); }
    const sign=boardSign('HEALER',{bg:'#4a2a14',line:'#e0a030',ink:'#fff0cc',font:46,w:2.0,h:0.45,glow:0x201004});
    const sp=new THREE.Vector3(0,2.75,1.95).applyAxisAngle(new THREE.Vector3(0,1,0),G.rot); sign.position.set(G.x+sp.x,Y+sp.y,G.z+sp.z); sign.rotation.y=G.rot+Math.PI; scene.add(sign); }
  { const e=V.ent, p=[V.x+Math.sin(e)*(VR+9),V.z+Math.cos(e)*(VR+9)], {A}=inF(frameM(p[0],getH(p[0],p[1]),p[1],e));   // the gate: two tall carved posts crowned with horns, a lintel and hanging gourds
    for(const sx of [-1,1]){ A(cyl(0.4,0.5,5.4,8).translate(sx*2.8,2.7,0),tgbBark); A(new THREE.ConeGeometry(0.22,1.1,5).rotateZ(-sx*0.5).translate(sx*2.8-sx*0.3,5.8,0),c=>c.set(0xe8dcc0)); const c=Math.cos(e), s=Math.sin(e); V.circles.push([p[0]+sx*2.8*c,p[1]-sx*2.8*s,0.6]); }
    A(vbox(6.4,0.4,0.4,0,4.7,0),dark); for(let k=0;k<5;k++) A(new THREE.SphereGeometry(0.2,6,5).scale(1,1.3,1).translate(-2+k,4.0,0),c=>c.set([0xb87a2a,0x8a9a3a,0xc84a2a,0xb87a2a,0x8a9a3a][k])); }
  { const S=V.sign, {A}=inF(frameM(S.x,Y,S.z,S.rot)); A(vbox(0.16,2.3,0.16,0,1.15,0),dark); A(vbox(0.55,1.3,0.08,0,1.55,0.08),woodC(0x8a6a3a)); }
  if(TG_LANDING){   // the reed landing: a plank jetty out over the water on posts, with a mooring pole at its end
    const L=TG_LANDING, {A}=inF(frameM(L.x,Y,L.z,L.rot)), wy=Math.max(getH(L.x,L.z),0.4)+0.5;
    for(let k=0;k<9;k++) A(vbox(2.0,0.1,0.55,0,wy-Y,1.0+k*0.58),woodC(0x7a5a34));
    for(let k=0;k<4;k++) for(const sx of [-1,1]) A(vbox(0.16,2.2,0.16,sx*1.0,wy-Y-1.0,1.2+k*1.6),dark);
    A(cyl(0.12,0.12,1.6,6).translate(0.9,wy-Y+0.8,6.0),dark); addCol(L.x+Math.sin(L.rot)*6.2,L.z+Math.cos(L.rot)*6.2,0.3); }
  addVillageMeshes(out,win);
  for(const c of V.circles) addCol(c[0],c[1],c[2]);
}
