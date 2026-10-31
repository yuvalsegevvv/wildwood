//@ The Emberwake Isles' buildings: Coralhaven (stilt houses under palm-thatch hip roofs, a coral-stone basin with a carved totem, outrigger canoes and a harbour jetty) and the waystations Zotchul (a stepped altar) and Urkuwara (a trapezoid stone gate)
/* Agent map: buildCoralhaven() is called by generation-setup.js after buildTallgrass (once). Coralhaven follows the home village's plan (VIL8 from shared/coralhaven.js: the same houses, stalls, anchors and colliders): every
   house stands on posts a step above the sand, in timber banded in the seven houses' colours (ISB_BANDS), under a four-sided palm-thatch roof; the moot-house (tavern) is longer with a carved ridge. At the heart (where the home village's
   well would be) a coral-stone basin and a carved totem; the gate is two totem posts with a shell lintel; CH_LANDING (null when no water is near) a plank jetty with two outrigger canoes drawn up beside its foot.
   buildWaystations() draws the stone dressing round each waystation's circle (the circle itself is buildCircle's, buildings-vale.js): Zotchul's low stepped altar with a stair and braziers, Urkuwara's trapezoid door in a dry-stone wall
   with rope-bound lintel and banners. Budget: a few thousand triangles, no per-leaf detail (a phone draws it). Tests: tools/client-smoke.js builds it; look at it with tools/shot.js --at <VIL8.x>,<VIL8.z>,0. Names: ISB, isb... */
const ISB={built:false};
const isbThatch=base=>(x,y,z,c)=>{ c.set(base).multiplyScalar(0.78+h3(Math.floor(x*4),Math.floor(y*3),Math.floor(z*4))*0.4); };
const isbPlank=base=>(x,y,z,c)=>{ const k=Math.floor((x+z)*3.2); c.set(base).multiplyScalar(0.84+h3(k,Math.floor(y*2),3)*0.26); if(y<0.5) c.multiplyScalar(0.85); };
const isbStone=base=>(x,y,z,c)=>{ c.set(base).multiplyScalar(0.8+h3(Math.floor(x*2.4),Math.floor(y*2.4),Math.floor(z*2.4))*0.36); };
const ISB_BANDS=[0x2fb6a8,0xe0583a,0xf0c040,0x2a6ab0,0xf0e8d0,0x8a4a7a,0x3a9a5a];   // the seven houses' colours: turquoise, coral, sun yellow, deep sea, shell white, mangosteen, palm
function buildCoralhaven(){
  if(ISB.built) return; ISB.built=true;
  const out=[], win=[], V=VIL8, Y=V.h;
  const inF=F=>({A:(g,fn)=>out.push(pc(g,fn).applyMatrix4(F)), N:(g,fn)=>out.push(paint(g,fn).applyMatrix4(F)), W:(g,col)=>win.push(pc(g,c=>c.set(col||0xffc060)).applyMatrix4(F))});
  const dark=woodC(0x3a2414), timber=woodC(0x6a4a2a), rope=c=>c.set(0xc8b078), shell=c=>c.set(0xf0e8d8);
  for(const H of V.houses){   // a stilt house: posts, a plank floor, banded timber walls, a four-sided thatch roof with a long overhang, a stair and a door
    const {A,W}=inF(frameM(H.x,Y,H.z,H.rot)), w=H.w, d=H.d, wh=H.wh, band=ISB_BANDS[H.i%7], tav=!!H.tavern, fl=0.9, ww=tav?w*1.1:w, dd=tav?d*1.15:d;
    for(const sx of [-1,1]) for(const sz of [-1,1]) A(cyl(0.16,0.2,fl+0.6,6).translate(sx*(ww/2-0.2),(fl+0.6)/2-0.3,sz*(dd/2-0.2)),dark);
    A(vbox(ww+0.5,0.18,dd+0.5,0,fl,0),timber);
    A(vbox(ww,wh,dd,0,fl+0.09+wh/2,0),isbPlank(0xb88a58));
    A(vbox(ww+0.04,0.3,dd+0.04,0,fl+0.09+wh*0.74,0),c=>c.set(band));
    const ch=Math.max(2.4,Math.min(ww,dd)*0.62)+(tav?0.9:0);
    A(new THREE.ConeGeometry(Math.hypot(ww,dd)*0.5+0.9,ch,4).rotateY(Math.PI/4).scale(ww>=dd?1:ww/dd,1,ww>=dd?dd/ww:1).translate(0,fl+0.09+wh+ch/2-0.1,0),isbThatch(tav?0xb8a050:0xc8b068));
    A(cyl(0.07,0.07,0.9,5).translate(0,fl+0.09+wh+ch+0.3,0),dark);   // the ridge finial
    A(vbox(1.1,1.9,0.14,0,fl+0.09+0.95,-dd/2+0.01),dark); A(vbox(1.4,0.18,0.2,0,fl+0.09+2.0,-dd/2),timber);
    for(let k=0;k<3;k++) A(vbox(1.2,0.1,0.34,0,fl-0.1-k*0.3,-dd/2-0.45-k*0.34),timber);   // the stair down to the sand
    for(const sd of [-1,1]){ W(vbox(0.7,0.55,0.06).translate(sd*(ww/2-1.1),fl+0.09+wh*0.58,-dd/2-0.02)); }
    if(tav){ for(let k=0;k<4;k++) A(vbox(0.12,wh*0.9,0.12,-ww/2+0.6+k*(ww-1.2)/3,fl+0.09+wh*0.45,-dd/2-0.9),dark); A(vbox(ww-0.6,0.12,0.12,0,fl+0.09+wh*0.9,-dd/2-0.9),dark);
      for(let k=0;k<5;k++) A(new THREE.SphereGeometry(0.18,6,5).translate(-1.2+k*0.6,fl+0.09+wh*0.82,-dd/2-0.9),c=>c.set([0xe0583a,0xf0c040,0x2fb6a8,0xf0e8d0,0x2a6ab0][k])); }   // the moot-house's porch: posts and a string of floats
    if(H.chimney) vsmAdd(new THREE.Vector3(0,fl+0.09+wh+ch*0.8,0).applyMatrix4(frameM(H.x,Y,H.z,H.rot)));
    if(H.i%3===0){ A(new THREE.SphereGeometry(0.34,7,6).scale(1,1.2,1).translate(ww/2+0.9,0.4,0.6),c=>c.set(0xc8a070)); A(cyl(0.2,0.3,0.12,7).translate(ww/2+0.9,0.9,0.6),c=>c.set(0x8a6a40)); }   // a water jar
    else if(H.i%3===1){ for(let k=0;k<3;k++) A(cyl(0.04,0.04,2.0,5).rotateZ(Math.PI/2).translate(-ww/2-0.9,0.7+k*0.4,0.2),dark); for(let k=0;k<4;k++) A(vbox(0.1,0.7,0.3,-ww/2-0.9,0.9,-0.5+k*0.5),c=>c.set(0xd8d0c0)); }   // fish drying on a rack
  }
  { // the heart of the village: a coral-stone basin (the home village's well, grown to the collider) and a carved totem
    const c=V.circles.find(q=>q[0]===V.x&&q[1]===V.z), R=c?c[2]:1.8, {A}=inF(frameM(V.x,Y,V.z,V.ent));
    A(new THREE.CylinderGeometry(R,R+0.3,0.9,12).translate(0,0.45,0),isbStone(0xe4dccc)); A(new THREE.CylinderGeometry(R-0.35,R-0.35,0.08,12).translate(0,0.88,0),c=>c.set(0x2f8aa8));
    for(let k=0;k<4;k++){ const h=1.3+k*0.9, r=0.55-k*0.04;   // a totem: stacked carved blocks, each a different face
      A(vbox(r*2,0.8,r*2,0,0.9+h-0.4,0),c=>c.set([0x8a5a34,0xe0583a,0x2fb6a8,0xf0c040][k])); A(vbox(r*1.4,0.12,r*2.1,0,0.9+h-0.1,0),shell);
      A(vbox(0.14,0.14,0.14,-r*0.5,0.9+h-0.35,-r),dark); A(vbox(0.14,0.14,0.14,r*0.5,0.9+h-0.35,-r),dark); }
    A(new THREE.ConeGeometry(0.5,0.9,6).translate(0,0.9+1.3+3*0.9+0.5,0),c=>c.set(0xe0583a)); }
  for(const st of V.stalls){   // palm-roofed stalls
    const {A}=inF(frameM(st.x,Y,st.z,st.rot));
    A(vbox(2.6,0.9,1.1,0,0.45,0),timber); A(vbox(2.7,0.08,1.2,0,0.94,0),woodC(0x8a6a3a));
    for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.13,2.5,0.13,sx*1.25,1.25,sz*0.5),dark);
    A(new THREE.BoxGeometry(3.4,0.22,2.1).rotateX(0.12).translate(0,2.55,0),isbThatch(0xc8b068));
    for(let k=0;k<5;k++) A(vbox(0.5,0.34,0.02,-1.0+k*0.5,2.25,-0.62),c=>c.set(ISB_BANDS[(k+st.i*2)%7]));
    if(st.i===0){ for(let k=0;k<3;k++) A(vbox(0.12,0.9,0.05,-0.8+k*0.8,1.85,0.5).rotateZ(0.1-k*0.1),c=>c.set(0x9aa0a8)); for(let k=0;k<4;k++) A(new THREE.SphereGeometry(0.15,6,5).translate(-0.9+k*0.6,1.1,0.2),shell); }
    else if(st.i===1){ for(let k=0;k<4;k++) A(vbox(0.42,0.8,0.05,-1.0+k*0.6,1.9,0.5),c=>c.set([0x2fb6a8,0xe0583a,0xf0c040,0x2a6ab0][k])); }
    else { A(vbox(0.34,0.4,0.3,1.95,0.2,0.55),timber); A(vbox(0.56,0.16,0.26,1.95,0.62,0.55),c=>c.set(0x3a3630)); A(cyl(0.34,0.24,0.5,10).translate(-1.95,0.25,0.5),c=>c.set(0x3a3630));
      const p=new THREE.Vector3(-1.95,0.62,0.5).applyAxisAngle(new THREE.Vector3(0,1,0),st.rot);
      const m=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.45,7),flameMats[1]); m.position.set(st.x+p.x,Y+p.y,st.z+p.z); scene.add(m); flames.push(m); }
  }
  { const B=V.board, {A}=inF(frameM(B.x,Y,B.z,B.rot));   // the quest board: two carved posts and a board of notices
    for(const sx of [-1,1]){ A(vbox(0.34,3.5,0.34,sx*1.9,1.75,0),timber); A(new THREE.ConeGeometry(0.3,0.6,5).translate(sx*1.9,3.8,0),c=>c.set(0x2fb6a8)); }
    A(vbox(3.6,2.0,0.1,0,1.95,0),woodC(0x8a6a3a)); A(vbox(4.2,0.16,0.22,0,3.0,0),dark); A(vbox(4.4,0.14,0.26,0,0.9,0),dark); A(vbox(4.7,0.26,1.1,0,3.3,0),isbThatch(0xc8b068));
    [[-1.2,2.4],[-0.4,2.45],[0.45,2.4],[1.25,2.45],[-1.25,1.5],[-0.45,1.55],[0.4,1.5],[1.2,1.55]].forEach(([x,y],i)=>A(new THREE.BoxGeometry(0.56,0.7,0.012).rotateZ((h3(i,3,7)-0.5)*0.2).translate(x,y,0.062),c=>c.set([0xf0e8d0,0xe8dcc0,0xe0d0a8][i%3])));
    questSign(B,Y,{bg:'#0e3a4a',line:'#f0c040',ink:'#eaffff',font:60,w:2.2,h:0.48,y:3.02,z:0.13,glow:0x041a20}); }
  { const fp=V.fire, {A}=inF(frameM(fp.x,Y,fp.z,0));   // the beach fire ring and a log drum
    A(cyl(0.9,1.05,0.35,9).translate(0,0.17,0),stoneC); A(cyl(0.68,0.68,0.05,9).translate(0,0.36,0),c=>c.set(0x1a1410));
    for(let k=0;k<4;k++) A(cyl(0.09,0.09,1.1,6).rotateZ(Math.PI/2).rotateY(k*0.8).translate(0,0.44,0),woodC(0x4a3020));
    A(cyl(0.4,0.4,1.2,10).rotateZ(Math.PI/2).translate(2.2,0.45,0.6),woodC(0x7a4a22));
    for(let k=0;k<4;k++){ const m=new THREE.Mesh(new THREE.ConeGeometry(k===0?0.34:0.2,k===0?1.1:0.7,7),flameMats[k===0?0:1]); m.position.set(fp.x+(k?Math.sin(k*2.1)*0.2:0),Y+0.85,fp.z+(k?Math.cos(k*2.1)*0.2:0)); scene.add(m); flames.push(m); } }
  for(const b of V.benches){ const {A}=inF(frameM(b.x,Y,b.z,b.rot)); A(cyl(0.24,0.24,1.9,8).rotateZ(Math.PI/2).translate(0,0.36,0),woodC(0x6a4a2a)); A(vbox(1.9,0.05,0.34,0,0.6,0),c=>c.set(0x8a6a3a)); }
  for(const l of V.lamps){   // torch posts with a conch on top
    const {A}=inF(frameM(l.x,Y,l.z,l.rot));
    A(cyl(0.07,0.1,2.0,6).translate(0,1.0,0),timber); A(cyl(0.2,0.12,0.3,7).translate(0,2.1,0),c=>c.set(0xf0e8d8));
    const m=new THREE.Mesh(new THREE.ConeGeometry(0.15,0.42,7),flameMats[0]); m.position.set(l.x,Y+2.4,l.z); scene.add(m); flames.push(m); }
  for(const [x,z] of V.barrels){ const {A}=inF(frameM(x,Y,z,0)); A(new THREE.SphereGeometry(0.42,9,7).scale(1,1.1,1).translate(0,0.45,0),c=>c.set(0x9a5a3a)); A(cyl(0.22,0.26,0.16,8).translate(0,0.95,0),c=>c.set(0x7a4a2a)); }
  for(const [x,z,r] of V.crates){ const {A}=inF(frameM(x,Y,z,r)); A(vbox(0.7,0.6,0.7,0,0.3,0),woodC(0x6a4a2a)); }
  { const G=V.garden, {A}=inF(frameM(G.x,Y,G.z,G.rot));   // the healer's herb yard: raised beds, drying racks
    A(vbox(5.8,0.1,4.2,0,0.05,0),(x,y,z,c)=>{ c.set(0xd8c89a).multiplyScalar(0.85+0.12*(Math.floor(x*2.2)&1)); });
    for(let k=0;k<3;k++){ A(vbox(1.4,0.3,0.8,-1.6+k*1.6,0.25,-1.0),woodC(0x6a4a2a)); A(vbox(1.2,0.12,0.6,-1.6+k*1.6,0.42,-1.0),(x,y,z,c)=>c.set([0x3a9a5a,0x8a9a3a,0x6aaa60][k])); }
    for(const sx of [-1,1]) A(vbox(0.14,2.3,0.14,sx*1.4,1.15,1.7),dark); A(vbox(3.1,0.12,0.14,0,2.3,1.7),dark);
    for(let k=0;k<4;k++){ const px=-1.05+k*0.7; A(cyl(0.025,0.025,1.1,5).translate(px,1.7,1.62),woodC(0x6a4a2a)); A(vbox(0.4,0.06,0.06,px,2.2,1.62),c=>c.set([0x6a8a3a,0xa0903a,0x7a6a3a,0x8a4a3a][k])); }
    const sign=boardSign('HEALER',{bg:'#0e3a4a',line:'#f0c040',ink:'#eaffff',font:46,w:2.0,h:0.45,glow:0x041a20});
    const sp=new THREE.Vector3(0,2.75,1.95).applyAxisAngle(new THREE.Vector3(0,1,0),G.rot); sign.position.set(G.x+sp.x,Y+sp.y,G.z+sp.z); sign.rotation.y=G.rot+Math.PI; scene.add(sign); }
  { const e=V.ent, p=[V.x+Math.sin(e)*(VR+9),V.z+Math.cos(e)*(VR+9)], {A}=inF(frameM(p[0],getH(p[0],p[1]),p[1],e));   // the gate: two tall carved totem posts, a lintel and a string of shells
    for(const sx of [-1,1]){ for(let k=0;k<4;k++) A(vbox(0.8,1.3,0.8,sx*2.8,0.65+k*1.3,0),c=>c.set([0x8a5a34,0xe0583a,0x2fb6a8,0xf0c040][(k+(sx>0?1:0))%4]));
      A(new THREE.ConeGeometry(0.5,0.9,6).translate(sx*2.8,5.65,0),c=>c.set(0xe0583a)); const c=Math.cos(e), s=Math.sin(e); V.circles.push([p[0]+sx*2.8*c,p[1]-sx*2.8*s,0.7]); }
    A(vbox(6.4,0.4,0.4,0,4.7,0),dark); for(let k=0;k<7;k++) A(new THREE.SphereGeometry(0.2,6,5).scale(1,1.2,1).translate(-2.4+k*0.8,4.1-Math.sin(k/6*Math.PI)*-0.15,0),shell); }
  { const S=V.sign, {A}=inF(frameM(S.x,Y,S.z,S.rot)); A(vbox(0.16,2.3,0.16,0,1.15,0),dark); A(vbox(0.55,1.3,0.08,0,1.55,0.08),woodC(0x8a6a3a)); }
  if(CH_LANDING){   // the harbour: a plank jetty out over the water on posts with a mooring pole, and two outrigger canoes on the sand beside its foot
    const L=CH_LANDING, {A}=inF(frameM(L.x,Y,L.z,L.rot)), wy=Math.max(getH(L.x,L.z),0.4)+0.5;
    for(let k=0;k<14;k++) A(vbox(2.4,0.1,0.55,0,wy-Y,1.0+k*0.58),woodC(0x7a5a34));
    for(let k=0;k<6;k++) for(const sx of [-1,1]) A(vbox(0.18,2.4,0.18,sx*1.2,wy-Y-1.1,1.2+k*1.5),dark);
    A(cyl(0.12,0.12,1.8,6).translate(1.1,wy-Y+0.9,9.0),dark); addCol(L.x+Math.sin(L.rot)*9.4,L.z+Math.cos(L.rot)*9.4,0.3);
    for(const sd of [-1,1]){   // an outrigger canoe: a long hull, two curved ends and a float on two booms
      const cx=L.x+Math.cos(L.rot)*sd*5.5-Math.sin(L.rot)*(-1.0), cz=L.z-Math.sin(L.rot)*sd*5.5-Math.cos(L.rot)*(-1.0), {A:C}=inF(frameM(cx,getH(cx,cz),cz,L.rot+(sd>0?0.15:-0.1)));
      C(new THREE.SphereGeometry(0.5,8,6).scale(0.8,0.5,4.2).translate(0,0.45,0),c=>c.set(sd>0?0x8a5a34:0xb0743a));
      for(const e of [-1,1]) C(new THREE.ConeGeometry(0.22,0.9,5).rotateX(e*1.2).translate(0,0.9,e*2.0),c=>c.set(0xe0583a));
      C(new THREE.SphereGeometry(0.22,6,5).scale(1,0.7,5).translate(1.8,0.38,0),c=>c.set(0xd8c8a0)); for(const e of [-0.9,0.9]) C(cyl(0.04,0.04,1.4,4).rotateZ(Math.PI/2).translate(0.9,0.55,e),dark);
      addCol(cx,cz,1.6); }
  }
  addVillageMeshes(out,win);
  for(const c of V.circles) addCol(c[0],c[1],c[2]);
}
// the waystations' stone dressing: the circle is buildCircle's; each gets its own landmark beside it and a fire
function buildWaystations(){
  const out=[], win=[];
  const inF=F=>({A:(g,fn)=>out.push(pc(g,fn).applyMatrix4(F))});
  const dark=woodC(0x3a2414), timber=woodC(0x6a4a2a);
  for(const w of EW_WAYS){
    const {A}=inF(frameM(w.x,w.h,w.z,w.face));   // local +z is the way the keeper faces
    if(w.id==='zotchul'){   // a low stepped altar (three tiers, a stair, braziers) behind the circle, and carved stelae
      for(let k=0;k<3;k++){ const s=9.0-k*2.4; A(vbox(s,0.7,s*0.8,0,0.35+k*0.7,-9.0),isbStone(0xa8a090)); }
      for(let k=0;k<6;k++) A(vbox(2.2,0.18,0.5,0,0.09+k*0.2,-6.2-k*0.16),isbStone(0xb0a898));   // the stair, one riser a step
      A(vbox(1.4,1.6,1.4,0,2.1+0.8,-9.0),isbStone(0x8a8070)); A(vbox(1.0,0.5,1.0,0,2.1+1.85,-9.0),c=>c.set(0x2fb6a8));
      for(const sx of [-6,6]){ A(vbox(0.9,3.4,0.5,sx,1.7,-4.0),isbStone(0x9a9488)); A(vbox(0.7,0.7,0.52,sx,2.6,-4.0),c=>c.set(0x2a2a26)); A(vbox(1.0,0.3,0.6,sx,3.5,-4.0),isbStone(0xb0a898)); addCol(w.x+Math.cos(w.face)*sx+Math.sin(w.face)*4.0*-1,w.z-Math.sin(w.face)*sx+Math.cos(w.face)*4.0*-1,0.6); } }
    else {   // Urkuwara: a dry-stone wall with a trapezoid door, a rope-bound lintel and two banners
      for(let k=0;k<5;k++) for(const sx of [-1,1]){ const x0=sx*(2.2+k*1.6); A(vbox(1.55,2.6-k*0.15,1.0,x0,(2.6-k*0.15)/2,-8.0),isbStone([0x8a8a86,0x9a9690,0x7a7a78,0x8e8a82,0x86847e][k])); }
      A(vbox(4.0,0.7,1.1,0,2.35,-8.0),isbStone(0x8a8a86)); for(const sx of [-1,1]) A(vbox(0.9,2.4,1.0,sx*1.6,1.2,-8.0).rotateZ(-sx*0.08),isbStone(0x9a9690));
      for(let k=0;k<5;k++) A(cyl(0.05,0.05,4.2,5).rotateZ(Math.PI/2).translate(0,2.62+k*0.06,-8.56),c=>c.set(0xc8b078));   // the rope binding the lintel
      for(const sx of [-3.5,3.5]){ A(cyl(0.08,0.08,4.4,5).translate(sx,2.2,-6.0),dark); A(vbox(0.06,1.5,0.9,sx,3.5,-6.0),c=>c.set(sx<0?0xe0583a:0x2a6ab0)); A(vbox(0.07,0.5,0.9,sx,2.6,-6.0),c=>c.set(0xf0c040)); addCol(w.x+Math.cos(w.face)*sx-Math.sin(w.face)*6.0,w.z-Math.sin(w.face)*sx-Math.cos(w.face)*6.0,0.3); } }
    for(const sx of [-3.2,3.2]){ A(cyl(0.45,0.55,0.7,8).translate(sx,0.35,2.6),isbStone(0x8a8478)); const fx=w.x+Math.cos(w.face)*sx+Math.sin(w.face)*2.6, fz=w.z-Math.sin(w.face)*sx+Math.cos(w.face)*2.6;
      const m=new THREE.Mesh(new THREE.ConeGeometry(0.3,0.8,7),flameMats[0]); m.position.set(fx,w.h+1.0,fz); scene.add(m); flames.push(m); }   // two braziers flank the keeper's side
    A(vbox(1.6,0.7,0.5,0,0.35,4.6),timber); A(vbox(1.6,0.08,0.7,0,0.74,4.6),woodC(0x8a6a3a));   // a plank bench for the keeper
  }
  addVillageMeshes(out,[]);
}
