//@ The Gloamhorn's buildings and dressing: Wraithwick (dark stone cottages, crooked lamps, cairns, a chapel), the Gloam Light, wrecks, sea-cave mouths, the Captain's hold, and standing stones (the Gloamvault's door is game/village/buildings-dungeon-gloam.js)
/* Agent map: buildGloamhorn() is called by generation-setup.js after buildSunscar; updateGloamhorn(dt) by main/loop.js (the lighthouse's slow beam, the lamps' dim glow).
   Wraithwick follows the home village's plan (VIL6 from shared/wraithwick.js: the same houses, stalls, anchors and colliders) in grey-black stone under wet slate with moss, no snow.
   The ground itself (cliffs, sea stacks, the horn) is terrain (shared/gloamhorn.js gloamGround); what is built here sits on it. The lighthouse's lamp burns dimly on purpose
   (a violet-white glow and a pale beam sweeping the water every 14 s), the land is lit by moon and lamps (world/gloam-sky.js). Colliders: addCol. Test: tools/gloamhorn-smoke.js (client-smoke builds it). */
const GLOAMB={beam:null,lamp:null,glow:[],built:false};
const gloamFlame=new THREE.MeshBasicMaterial({color:0x9a8cff,transparent:true,opacity:0.8,depthWrite:false,blending:THREE.AdditiveBlending});
const gloamSlate=base=>(x,y,z,nx,ny,nz,c)=>{ c.set(base).multiplyScalar(0.8+h3(Math.floor(x*3),Math.floor(y*3),Math.floor(z*3))*0.3); if(ny>0.5&&h3(Math.floor(x*2),7,Math.floor(z*2))>0.55) c.lerp(_gm,0.5); };
const _gm=new THREE.Color(0x2c3a28);
const gloamBlocks=base=>(x,y,z,c)=>{ const b=Math.floor(y*2.2), k=Math.floor((x+z)*1.6+(b&1)*0.5); c.set(base).multiplyScalar(0.78+h3(k,b,3)*0.3); if(y<0.9&&h3(k,b,9)>0.5) c.lerp(_gm,0.35); };   // wet stone, moss at the foot
function buildGloamhorn(){
  if(GLOAMB.built) return; GLOAMB.built=true;
  buildWraithwick(); buildGloamLight(); buildGloamWrecks(); buildGloamCaves(); buildGloamHold(); buildGloamStones();
}
function buildWraithwick(){
  const out=[], win=[], V=VIL6, Y=V.h;
  const inF=F=>({A:(g,fn)=>out.push(pc(g,fn).applyMatrix4(F)), N:(g,fn)=>out.push(paint(g,fn).applyMatrix4(F)), W:(g,col)=>win.push(pc(g,c=>c.set(col||0xb8a8ff)).applyMatrix4(F))});
  const dark=woodC(0x1e1a1c), timber=woodC(0x3a2e2c), iron=c=>c.set(0x2a2c32), slate=[0x34363e,0x2c2e36,0x3a3c44,0x30323a,0x383a42];
  for(const H of V.houses){
    const F=frameM(H.x,Y,H.z,H.rot), {A,N,W}=inF(F), {w,d,wh}=H, base=0.5, rh=Math.max(2.2,w*0.5)+(H.tavern?0.8:0);
    A(vbox(w+0.5,1.0,d+0.5,0,base-0.5,0),stoneC); A(vbox(w,wh,d,0,base+wh/2,0),gloamBlocks(0x5c5a62));
    A(vbox(w+0.1,0.22,d+0.1,0,base+wh-0.1,0),timber);
    const a=Math.atan2(rh,w/2), len=Math.hypot(w/2,rh)+0.6, rd=d+1.1, th=0.3;
    for(const sd of [-1,1]){ const g=new THREE.BoxGeometry(len,th,rd,6,1,1); g.rotateZ(-sd*a); g.translate(sd*(w/4+Math.cos(a)*0.3+Math.sin(a)*th/2), base+wh+rh/2-Math.sin(a)*0.3+Math.cos(a)*th/2, 0); N(g,gloamSlate(slate[H.i%5])); }
    A(prism(w,rh,d).translate(0,base+wh,0),gloamBlocks(0x4c4a52)); A(vbox(0.26,0.26,rd+0.1,0,base+wh+rh+0.12,0),dark);
    A(vbox(1.2,2.1,0.12,0,base+1.05,-d/2-0.04),woodC(0x2a2018)); A(vbox(1.5,0.2,0.18,0,base+2.2,-d/2-0.05),dark);   // the door
    A(vbox(1.9,0.3,0.8,0,0.15,-d/2-0.5),stoneC);
    const shutters=(px,py,pz,ry)=>{ const M=new THREE.Matrix4().makeRotationY(ry).setPosition(px,py,pz);
      W(vbox(0.6,0.5,0.06).applyMatrix4(M)); for(const sd of [-1,1]) A(vbox(0.28,0.56,0.05,sd*0.44,0,-0.02).applyMatrix4(M),woodC(0x24202a)); };
    const wy=base+wh*0.6; shutters(w*0.3,wy,-d/2-0.05,0); shutters(-w/2-0.05,wy,0,Math.PI/2); shutters(w/2+0.05,wy,0,-Math.PI/2); shutters(0,wy,d/2+0.05,Math.PI);
    if(H.chimney){ A(vbox(0.85,rh+1.3,0.85,w*0.26,base+wh+(rh+1.3)/2-0.3,d*0.12),stoneC); }
    if(H.kind==='wing'||H.kind==='loft'||H.kind==='tower'){
      const o={A,R:N,wall:gloamBlocks(0x5c5a62),gable:gloamBlocks(0x4c4a52),roof:()=>gloamSlate(slate[H.i%5]),cap:gloamSlate(0x2c2e36),W,door:woodC(0x2a2018)};
      if(H.kind==='wing') vlAnnex(H,base,o); else if(H.kind==='loft') vlDormer(H,base,o); else vlTurret(H,base,o);
    }
    if(H.tavern){ for(let k=0;k<3;k++) A(vbox(0.6,1.5,0.04,-w/3+k*w/3,base+2.9,-d/2-0.12),c=>c.set([0x3a2a4a,0x7a6a3a,0x3a2a4a][k])); }   // the wake-house: faded banners
    if(H.woodpile){ for(let r=0;r<3;r++) for(let k=0;k<4-r;k++) A(cyl(0.16,0.16,1.2,7).rotateZ(Math.PI/2).translate(w/2+0.9,0.2+r*0.3,-d*0.2+k*0.34+r*0.17),woodC(0x4a3a2c)); }
    if(H.i%3===0){ A(vbox(0.9,0.4,0.6,-w/2-1.1,0.5,0.4),timber); for(let j=0;j<6;j++) A(new THREE.DodecahedronGeometry(0.15,0).translate(-w/2-1.3+(j%3)*0.22,0.82+(j>2?0.1:0),0.3+(j%2)*0.2),c=>c.set(0x2a2e34)); }   // a barrow of wet stones
    else if(H.i%3===1){ A(vbox(1.4,0.08,0.9,w/2+1.2,0.9,0.2).rotateZ(0.04),timber); for(let k=0;k<3;k++) A(new THREE.CylinderGeometry(0.02,0.02,0.7,4).translate(w/2+0.8+k*0.4,0.55,0.2),c=>c.set(0x6a5a40)); }   // a net drying
  }
  { const {A}=inF(frameM(V.x,Y,V.z,V.ent));   // the well: a stone ring and a slate roof on two posts
    A(new THREE.CylinderGeometry(1.1,1.2,0.8,16).translate(0,0.4,0),(x,y,z,c)=>{ if(y>0.78&&Math.hypot(x,z)<0.95) c.set(0x10141c); else stoneC(x,y,z,c); });
    for(const sd of [-1,1]) A(vbox(0.16,2.3,0.16,sd*0.95,1.15,0),dark);
    A(cyl(0.06,0.06,2.1,8).rotateZ(Math.PI/2).translate(0,1.75,0),timber); A(vbox(2.8,0.22,1.9,0,2.4,0),c=>c.set(0x2c2e36)); }
  const trim=[0x3a2a4a,0x6a5a2a,0x2a3a4a];
  for(const st of V.stalls){
    const {A}=inF(frameM(st.x,Y,st.z,st.rot));
    A(vbox(2.6,0.9,1.1,0,0.45,0),timber); A(vbox(2.7,0.08,1.2,0,0.94,0),woodC(0x2a2220));
    for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.13,2.6,0.13,sx*1.25,1.3,sz*0.5),dark);
    A(new THREE.BoxGeometry(3.4,0.26,2.1).rotateX(0.1).translate(0,2.65,0),c=>c.set(0x2c2e36));
    for(let k=0;k<5;k++) A(vbox(0.5,0.5,0.02,-1.0+k*0.5,2.2,-0.6),(x,y,z,c)=>{ c.set(trim[st.i]); if(y<2.0) c.multiplyScalar(0.85); });
    if(st.i===0){ for(let k=0;k<3;k++){ A(cyl(0.025,0.025,1.0,5).translate(0,0.5,0).rotateZ(0.2).translate(-0.9+k*0.3,0.94,-0.25),woodC(0x4a3a2c)); A(vbox(0.26,0.2,0.04,-0.92+k*0.3+0.1,1.86,-0.25),c=>c.set(0x9aa0a8)); } }
    else if(st.i===1){ for(let k=0;k<4;k++) A(vbox(0.42,0.9,0.05,-1.0+k*0.6,1.9,0.5),(x,y,z,c)=>{ c.set([0x8a8c94,0x6a727a,0x9a9ca4,0x5a626a][k]).multiplyScalar(0.8+h3(Math.floor(x*9),Math.floor(y*9),k)*0.2); }); }
    else { A(vbox(0.34,0.4,0.3,1.95,0.2,0.55),timber); A(vbox(0.56,0.16,0.26,1.95,0.62,0.55),iron); A(cyl(0.34,0.24,0.5,10).translate(-1.95,0.25,0.5),iron);
      for(let k=0;k<4;k++) A(new THREE.OctahedronGeometry(0.09,0).translate(-0.75+k*0.5,1.02,-0.1),c=>c.set([0x6a8cd0,0x9a6ad0,0xc8b86a,0x6ac8a0][k]));
      const p=new THREE.Vector3(-1.95,0.62,0.5).applyAxisAngle(new THREE.Vector3(0,1,0),st.rot);
      const m=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.45,7),flameMats[1]); m.position.set(st.x+p.x,Y+p.y,st.z+p.z); scene.add(m); flames.push(m); }
  }
  { const B=V.board, {A}=inF(frameM(B.x,Y,B.z,B.rot));   // the quest board: stone posts, a slate cap
    for(const sx of [-1,1]){ A(vbox(0.34,3.5,0.34,sx*1.9,1.75,0),stoneC); A(vbox(0.55,0.3,0.55,sx*1.9,0.1,0),stoneC); A(new THREE.ConeGeometry(0.2,0.5,4).translate(sx*1.9,3.7,0),woodC(0x3a2a4a)); }
    A(vbox(3.6,2.0,0.1,0,1.95,0),(x,y,z,c)=>c.set(0x3a2c24).multiplyScalar(0.85+h3(x,y,z)*0.08));
    A(vbox(4.2,0.16,0.22,0,3.0,0),dark); A(vbox(4.4,0.14,0.26,0,0.9,0),dark); A(vbox(4.7,0.28,1.1,0,3.3,0),c=>c.set(0x2c2e36));
    [[-1.2,2.4],[-0.4,2.45],[0.45,2.4],[1.25,2.45],[-1.25,1.5],[-0.45,1.55],[0.4,1.5],[1.2,1.55]].forEach(([x,y],i)=>A(new THREE.BoxGeometry(0.56,0.7,0.012).rotateZ((h3(i,3,7)-0.5)*0.2).translate(x,y,0.062),c=>c.set([0xd8d0c0,0xc8bea4,0xd2c8b0][i%3])));
    questSign(B,Y,{bg:'#1c1a26',line:'#8a7ad0',ink:'#e8e0ff',font:60,w:2.2,h:0.48,y:3.02,z:0.13,glow:0x0a0814}); }
  { const fp=V.fire, {A}=inF(frameM(fp.x,Y,fp.z,0));   // the great fire, burning low and cold-white
    A(cyl(0.9,1.05,0.35,9).translate(0,0.17,0),stoneC); A(cyl(0.68,0.68,0.05,9).translate(0,0.36,0),c=>c.set(0x1a1618));
    for(let k=0;k<4;k++) A(cyl(0.09,0.09,1.1,6).rotateZ(Math.PI/2).rotateY(k*0.8).translate(0,0.44,0),woodC(0x2a2020));
    for(let k=0;k<4;k++){ const m=new THREE.Mesh(new THREE.ConeGeometry(k===0?0.34:0.2,k===0?1.1:0.7,7),flameMats[k===0?0:1]); m.position.set(fp.x+(k?Math.sin(k*2.1)*0.2:0),Y+0.85,fp.z+(k?Math.cos(k*2.1)*0.2:0)); scene.add(m); flames.push(m); } }
  for(const b of V.benches){ const {A}=inF(frameM(b.x,Y,b.z,b.rot)); A(cyl(0.22,0.22,1.9,8).rotateZ(Math.PI/2).translate(0,0.36,0),woodC(0x3a2c24)); A(vbox(1.9,0.05,0.34,0,0.6,0),c=>c.set(0x6a6258)); }
  for(const l of V.lamps){   // crooked iron lamp-posts, each leaning its own way, with a pale violet flame
    const lean=(h3(Math.floor(l.x),3,Math.floor(l.z))-0.5)*0.22, {A}=inF(frameM(l.x,Y,l.z,l.rot));
    A(cyl(0.06,0.08,1.9,6).translate(0,0.95,0).rotateZ(lean),iron); A(vbox(0.34,0.46,0.34,Math.sin(lean)*-1.9,2.05,0),iron);
    const m=new THREE.Mesh(new THREE.ConeGeometry(0.13,0.38,7),gloamFlame); m.position.set(l.x-Math.sin(lean)*1.9*Math.cos(l.rot),Y+2.05,l.z+Math.sin(lean)*1.9*Math.sin(l.rot)); scene.add(m); flames.push(m); GLOAMB.glow.push(m); }
  for(const [x,z] of V.barrels){ const {A}=inF(frameM(x,Y,z,0)); A(cyl(0.36,0.36,0.8,12).translate(0,0.4,0),(px,py,pz,c)=>{ c.set(0x4a3a2c).multiplyScalar(0.9+h3(Math.floor(Math.atan2(pz,px)*6),0,0)*0.15); if(Math.abs(py-0.25)<0.05||Math.abs(py-0.6)<0.05) c.set(0x22201e); }); }
  for(const [x,z,r] of V.crates){ const {A}=inF(frameM(x,Y,z,r)); A(vbox(0.7,0.6,0.7,0,0.3,0),woodC(0x4a3a2c)); }
  { const G=V.garden, {A}=inF(frameM(G.x,Y,G.z,G.rot));   // the Wayfarers' Lodge yard
    A(vbox(5.8,0.1,4.2,0,0.05,0),(x,y,z,c)=>{ c.set(0x3a2c24).multiplyScalar(0.85+0.12*(Math.floor(x*2.2)&1)); });
    for(const sx of [-1,1]) A(vbox(0.14,2.3,0.14,sx*1.4,1.15,1.7),dark); A(vbox(3.1,0.12,0.14,0,2.3,1.7),dark);
    for(let k=0;k<4;k++){ const px=-1.05+k*0.7; A(cyl(0.025,0.025,1.1,5).translate(px,1.6,1.62),woodC(0x4a3a2c)); A(vbox(0.55,0.06,0.06,px,2.12,1.62),c=>c.set(0x9aa0a8)); }
    A(cyl(0.42,0.46,0.5,10).translate(-2.0,0.35,-0.7),woodC(0x4a3a2c));
    for(let r=0;r<3;r++) for(let k=0;k<3-r;k++) A(cyl(0.17,0.17,1.3,7).rotateZ(Math.PI/2).translate(-2.0,0.2+r*0.3,0.3+k*0.36+r*0.18),woodC(0x4a3a2c));
    for(const sx of [-1,1]) A(vbox(0.1,1.7,0.1,1.6+sx*0.9,0.85,-1.2),dark); A(vbox(1.9,0.08,0.08,1.6,1.7,-1.2),dark);
    for(let k=0;k<5;k++) A(new THREE.ConeGeometry(0.12,0.5,5).rotateX(Math.PI).translate(1.0+k*0.3,1.4,-1.2),c=>c.set([0x5a7a4a,0x7a9a6a,0x9a8ab0,0x5a7a4a,0x4a6a5a][k]));
    const sign=boardSign("WAYFARERS' LODGE",{bg:'#22202c',line:'#8a7ad0',ink:'#e8e0ff',font:46,w:2.6,h:0.57,glow:0x0a0814});
    const sp=new THREE.Vector3(0,2.75,1.95).applyAxisAngle(new THREE.Vector3(0,1,0),G.rot); sign.position.set(G.x+sp.x,Y+sp.y,G.z+sp.z); sign.rotation.y=G.rot+Math.PI; scene.add(sign); }
  { const e=V.ent, p=[V.x+Math.sin(e)*(VR+9),V.z+Math.cos(e)*(VR+9)], {A}=inF(frameM(p[0],getH(p[0],p[1]),p[1],e));   // the gate: two stone piers, a beam, a hanging lantern; cairns beside it
    for(const sx of [-1,1]){ A(vbox(0.9,5.2,0.9,sx*2.8,2.6,0),gloamBlocks(0x5c5a62)); A(vbox(1.1,0.3,1.1,sx*2.8,5.3,0),stoneC); const c=Math.cos(e), s=Math.sin(e); V.circles.push([p[0]+sx*2.8*c,p[1]-sx*2.8*s,0.6]); }
    A(vbox(6.8,0.5,0.5,0,4.9,0),dark);
    A(vbox(0.34,0.46,0.34,0,4.2,0),iron); A(cyl(0.02,0.02,0.5,4).translate(0,4.7,0),iron);
    { const m=new THREE.Mesh(new THREE.ConeGeometry(0.15,0.4,7),gloamFlame); const q=new THREE.Vector3(0,4.2,0).applyAxisAngle(new THREE.Vector3(0,1,0),e); m.position.set(p[0]+q.x,getH(p[0],p[1])+4.2,p[1]+q.z); scene.add(m); flames.push(m); GLOAMB.glow.push(m); }
    for(const sd of [-1,1]){ const [rx,rz]=[sd*4.8,-0.6]; for(let k=0;k<4;k++) A(new THREE.DodecahedronGeometry(0.5-k*0.08,0).translate(rx,0.35+k*0.6,rz),stoneC); V.circles.push([p[0]+rx*Math.cos(e)+rz*Math.sin(e),p[1]-rx*Math.sin(e)+rz*Math.cos(e),0.6]); } }
  { const S=V.sign, {A}=inF(frameM(S.x,Y,S.z,S.rot)); A(vbox(0.16,2.3,0.16,0,1.15,0),dark); A(vbox(0.55,1.3,0.08,0,1.55,0.08),woodC(0x3a2c24)); }
  // the chapel behind the wake-house, outside the ring: a nave under slate, a leaning bell-cote, narrow lit windows, graves
  { const a=V.ent+Math.PI-0.6, tx=V.x+Math.sin(a)*34, tz=V.z+Math.cos(a)*34, {A,N,W}=inF(frameM(tx,getH(tx,tz),tz,a));
    A(vbox(7.4,0.9,12.4,0,0.45,0),stoneC); A(vbox(6.4,5.2,11.4,0,3.5,0),gloamBlocks(0x58565e));
    for(const sd of [-1,1]){ const g=new THREE.BoxGeometry(5.6,0.32,12.4,1,1,1); g.rotateZ(-sd*0.62); g.translate(sd*1.95,7.4,0); N(g,gloamSlate(0x2c2e36)); }
    A(prism(6.4,3.6,11.4).translate(0,6.1,0),gloamBlocks(0x4c4a52));
    A(vbox(2.6,8.6,2.6,0,4.3,-6.3),gloamBlocks(0x58565e)); N(new THREE.ConeGeometry(2.1,4.6,4).rotateY(Math.PI/4).translate(0,10.9,-6.3),gloamSlate(0x24262e));   // the tower and its spire
    A(vbox(0.2,1.4,0.2,0,13.7,-6.3),iron); A(vbox(0.8,0.16,0.2,0,13.9,-6.3),iron);   // a cross
    for(const sd of [-1,1]) for(let k=0;k<3;k++) W(vbox(0.06,1.8,0.7).translate(sd*3.22,3.6,-3.2+k*3.2),0xb8a8ff);
    W(vbox(1.2,2.0,0.06).translate(0,3.2,6.0),0xb8a8ff);
    A(vbox(1.4,2.6,0.2,0,1.5,5.8),woodC(0x24201e));
    for(let k=0;k<7;k++){ const gx=(k%4-1.5)*2.4, gz=11+Math.floor(k/4)*2.6, lean=(h3(k,5,5)-0.5)*0.3; A(vbox(0.8,1.3,0.2,gx,0.65,gz).rotateZ(lean),stoneC); }   // leaning gravestones
    addCol(tx,tz,5.2); }
  addVillageMeshes(out,win);
  for(const c of V.circles) addCol(c[0],c[1],c[2]);
}
// a gloamy plank-and-iron cairn: a stack of stones; and a standing stone: a tall leaning slab
function gloamCairn(x,z,s,seed){ const parts=[]; for(let k=0;k<5;k++){ const r=(0.55-k*0.09)*s; parts.push(pc(new THREE.DodecahedronGeometry(r,0).scale(1,0.7,1).rotateY(h3(seed,k,1)*3).translate(x+(h3(seed,k,2)-0.5)*0.25*s,getH(x,z)+k*0.38*s+0.2,z+(h3(seed,k,3)-0.5)*0.25*s),stoneC)); } return parts; }
function gloamMenhir(x,z,s,seed){ const h=(3.2+h3(seed,1,1)*2.4)*s, w=(0.9+h3(seed,2,2)*0.5)*s, lean=(h3(seed,3,3)-0.5)*0.22;
  return pc(vbox(w,h,w*0.55,0,h/2-0.3,0).rotateZ(lean).rotateY(h3(seed,4,4)*TAU).translate(x,getH(x,z),z),(X,Y,Z,c)=>{ c.set(0x5a5860).multiplyScalar(0.7+h3(Math.floor(X*4),Math.floor(Y*3),Math.floor(Z*4))*0.35); if(Y<getH(x,z)+0.8) c.lerp(_gm,0.4); }); }
function buildGloamStones(){   // cairns and standing stones scattered over the heath, thicker near the sea (deterministic)
  const rng=mulberry32(60707), parts=[];
  for(let i=0,n=0;i<1400&&n<(LITE?40:LOW?70:110);i++){
    const S=gloamSpine(rng()), side=rng()<0.5?-1:1, off=rng()*S.w*0.9, x=S.x+(-S.dz)*side*off, z=S.z+S.dx*side*off;
    if(gloamIn(x,z)<8||gloamKeepOut(x,z,6)||vDist(x,z)<VR+10||x>GW0-20) continue;
    const h=getH(x,z); if(h<2||h>60) continue;
    if(rng()<0.45){ parts.push(...gloamCairn(x,z,0.9+rng()*0.8,i)); addCol(x,z,0.7); } else { parts.push(gloamMenhir(x,z,0.8+rng()*0.9,i)); addCol(x,z,0.7); }
    n++;
  }
  // the Mourning Stones ring (zone 36): nine tall stones in a circle
  { const Z=ZONES.find(z=>z.key==='m36'); if(Z) for(let k=0;k<9;k++){ const a=k/9*TAU, x=Z.x+Math.sin(a)*14, z=Z.z+Math.cos(a)*14; if(gloamIn(x,z)<8||gloamKeepOut(x,z,4)) continue; parts.push(gloamMenhir(x,z,1.5,900+k)); addCol(x,z,1.0); } }
  if(parts.length){ const m=new THREE.Mesh(merge(parts),villageMat); m.castShadow=true; m.receiveShadow=true; scene.add(m); }
}
// ---- the Gloam Light: a tall banded tower on the rocks at the tip, a gallery, a lamp room that burns dim, and a pale beam that sweeps the sea ----
function buildGloamLight(){
  const L=GLOAM_LIGHT, y0=getH(L.x,L.z), g=new THREE.Group(), parts=[], band=(x,y,z,c)=>{ c.set(Math.floor(y/5)%2?0x6a6870:0x44424a).multiplyScalar(0.8+h3(Math.floor(x*3),Math.floor(y*2),Math.floor(z*3))*0.3); if(y<2.4) c.lerp(_gm,0.4); };
  parts.push(pc(new THREE.CylinderGeometry(L.r*1.25,L.r*1.5,3,14).translate(0,1.2,0),stoneC));
  parts.push(pc(new THREE.CylinderGeometry(L.r*0.62,L.r,L.hgt,16,6).translate(0,L.hgt/2+1.5,0),band));
  parts.push(pc(new THREE.CylinderGeometry(L.r*0.95,L.r*0.7,0.9,16).translate(0,L.hgt+1.9,0),stoneC));   // the gallery
  for(let k=0;k<12;k++){ const a=k/12*TAU; parts.push(pc(vbox(0.12,1.1,0.12,Math.sin(a)*L.r*0.92,L.hgt+2.8,Math.cos(a)*L.r*0.92),c=>c.set(0x2a2c32))); }
  parts.push(pc(new THREE.CylinderGeometry(L.r*0.5,L.r*0.55,3.2,12).translate(0,L.hgt+3.9,0),c=>c.set(0x1e1c24)));   // the lamp room's dark frame
  parts.push(pc(new THREE.ConeGeometry(L.r*0.75,3.2,12).translate(0,L.hgt+7.1,0),c=>c.set(0x24222c)));
  parts.push(pc(vbox(1.4,2.4,0.3,0,2.2,L.r*1.0),c=>c.set(0x14121a)));   // a low black door
  for(let k=0;k<5;k++){ const a=0.4+k*1.1, y=6+k*5.2; parts.push(pc(vbox(0.5,1.1,0.2,Math.sin(a)*L.r*0.8,y,Math.cos(a)*L.r*0.8).rotateY(a),c=>c.set(0x0a0a10))); }
  const m=new THREE.Mesh(merge(parts),villageMat); m.castShadow=true; m.receiveShadow=true; g.add(m);
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(1.0,10,8),new THREE.MeshBasicMaterial({color:0xcfc4ff,transparent:true,opacity:0.5,depthWrite:false,blending:THREE.AdditiveBlending})); lamp.position.set(0,L.hgt+3.9,0); g.add(lamp); GLOAMB.lamp=lamp;
  const bmat=new THREE.MeshBasicMaterial({color:0xb8aaff,transparent:true,opacity:0.13,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}), beam=new THREE.Group();
  beam.add(new THREE.Mesh(new THREE.PlaneGeometry(130,7).translate(65,0,0),bmat),new THREE.Mesh(new THREE.PlaneGeometry(130,5).rotateX(-Math.PI/2).translate(65,0,0),bmat));
  beam.position.set(0,L.hgt+3.9,0); g.add(beam); GLOAMB.beam=beam;
  g.position.set(L.x,y0,L.z); scene.add(g); addCol(L.x,L.z,L.r*1.3);
  GLOAMB.light=g;
}
// ---- wrecks: ribs of a hull standing out of the shallows, a broken mast ----
function buildGloamWrecks(){
  const parts=[], wood=(x,y,z,c)=>{ c.set(0x3a2e26).multiplyScalar(0.7+h3(Math.floor(x*3),Math.floor(y*3),Math.floor(z*3))*0.4); };
  GLOAM_WRECKS.forEach((q,i)=>{ const [wx,wz,rot]=q, F=new THREE.Matrix4().makeRotationY(rot).setPosition(wx,-1.4,wz), tilt=(h3(i,1,1)-0.5)*0.3;
    for(let k=-5;k<=5;k++){ const s=1-Math.abs(k)/6.5, rh=(3.8+h3(i,k,2)*1.6)*s; for(const sd of [-1,1]) parts.push(pc(new THREE.CylinderGeometry(0.16,0.2,rh+1.2,5).rotateZ(-sd*(0.55+0.2*s)).translate(sd*(2.6*s+0.5),rh/2,k*2.1).applyMatrix4(F),wood)); }
    parts.push(pc(vbox(0.5,0.4,22,0,0.1,0).applyMatrix4(F),wood));   // the keel
    parts.push(pc(new THREE.CylinderGeometry(0.2,0.3,13,6).rotateZ(0.35+tilt).translate(0,6.0,2).applyMatrix4(F),wood));   // the broken mast
    parts.push(pc(vbox(0.1,5,3.2,1.6,8.5,2.2).rotateZ(0.2).applyMatrix4(F),c=>c.set(0x3a3a40)));   // a shred of sail
  });
  if(parts.length){ const m=new THREE.Mesh(merge(parts),villageMat); m.castShadow=true; scene.add(m); }
}
// ---- sea-cave mouths at the cliff foot: a black arch in the rock, wet stone slabs, a dim green lantern ----
function buildGloamCaves(){
  const parts=[], dk=new THREE.MeshBasicMaterial({color:0x040408});
  GLOAM_CAVES.forEach((q,i)=>{ const [cx,cz,face]=q, F=new THREE.Matrix4().makeRotationY(face).setPosition(cx,0,cz);
    for(const sd of [-1,1]) parts.push(pc(new THREE.DodecahedronGeometry(2.6,0).scale(1,1.7,1).translate(sd*4.2,2.4,0).applyMatrix4(F),stoneC));
    parts.push(pc(new THREE.DodecahedronGeometry(3.2,0).scale(1.6,0.8,1).translate(0,5.4,0).applyMatrix4(F),stoneC));
    const hole=new THREE.Mesh(new THREE.CircleGeometry(3.3,14),dk); hole.scale.y=1.1; hole.position.set(cx+Math.sin(face)*0.4,2.6,cz+Math.cos(face)*0.4); hole.rotation.y=face; scene.add(hole); });
  if(parts.length){ const m=new THREE.Mesh(merge(parts),villageMat); m.castShadow=true; m.receiveShadow=true; scene.add(m); }
}
// ---- Captain Dredge's hold: a wrecked hull driven up the beach, its stern high in the air; anchors and chain; a ring of barnacled stones ----
function buildGloamHold(){
  const A=ARENA_M35, parts=[], wood=(x,y,z,c)=>{ c.set(0x40322a).multiplyScalar(0.7+h3(Math.floor(x*3),Math.floor(y*3),Math.floor(z*3))*0.4); }, a0=Math.atan2(GLOAM_HOLD.caves[0][0]-A.x,GLOAM_HOLD.caves[0][1]-A.z);
  const F=new THREE.Matrix4().makeRotationY(a0+Math.PI/2).setPosition(A.x-Math.sin(a0)*(A.r-2),A.h,A.z-Math.cos(a0)*(A.r-2));
  for(let k=-6;k<=6;k++){ const s=1-Math.abs(k)/8, rh=(4.5+h3(k,1,1)*1.4)*s+(k>3?k-3:0)*1.1; for(const sd of [-1,1]) parts.push(pc(new THREE.CylinderGeometry(0.18,0.24,rh+1.4,5).rotateZ(-sd*(0.5+0.2*s)).translate(sd*(3.0*s+0.6),rh/2,k*2.2).applyMatrix4(F),wood)); }
  parts.push(pc(vbox(0.7,0.5,28,0,0.15,0).applyMatrix4(F),wood));
  for(let k=0;k<4;k++){ const a=k/4*TAU+0.7, x=A.x+Math.sin(a)*(A.r+3), z=A.z+Math.cos(a)*(A.r+3);   // anchors stuck upright
    parts.push(pc(vbox(0.3,3.4,0.3,0,1.7,0).translate(x,getH(x,z),z),c=>c.set(0x3a3c42)), pc(vbox(2.0,0.28,0.3,0,3.0,0).translate(x,getH(x,z),z),c=>c.set(0x3a3c42))); addCol(x,z,0.8); }
  for(let k=0;k<10;k++){ const a=k/10*TAU+0.2, x=A.x+Math.sin(a)*(A.r+6+h3(k,2,2)*3), z=A.z+Math.cos(a)*(A.r+6+h3(k,2,2)*3); if(gloamIn(x,z)<2) continue; parts.push(pc(new THREE.DodecahedronGeometry(1.2+h3(k,3,3),0).translate(x,getH(x,z)+0.6,z),stoneC)); addCol(x,z,1.3); }
  const m=new THREE.Mesh(merge(parts),villageMat); m.castShadow=true; m.receiveShadow=true; scene.add(m);
}
function updateGloamhorn(dt){
  if(!GLOAMB.built) return;
  const near=Math.hypot(P.x-GLOAM_LIGHT.x,P.z-GLOAM_LIGHT.z)<420;
  if(GLOAMB.beam){ GLOAMB.beam.visible=near; GLOAMB.lamp.visible=near; if(near){ GLOAMB.beam.rotation.y=-t*0.45; GLOAMB.lamp.material.opacity=0.38+0.14*Math.sin(t*1.7)+0.04*Math.sin(t*6.1); } }
}
