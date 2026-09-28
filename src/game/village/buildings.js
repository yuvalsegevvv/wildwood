//@ Houses, stalls, well, campfire, lamps, garden, arena stones, chimney smoke
/* ---------- the village: buildings and props ---------- */
const villageMat=new THREE.MeshLambertMaterial({vertexColors:true});
const windowMat=new THREE.MeshLambertMaterial({vertexColors:true, emissive:0xffb060, emissiveIntensity:0});
const flameMats=[new THREE.MeshBasicMaterial({color:0xff7a22,transparent:true,opacity:0.85,depthWrite:false,blending:THREE.AdditiveBlending}),
                 new THREE.MeshBasicMaterial({color:0xffd060,transparent:true,opacity:0.9,depthWrite:false,blending:THREE.AdditiveBlending})];
const fireLight=new THREE.PointLight(0xff9a4a,0,18,2); scene.add(fireLight);
const flames=[]; let smoke=null;
const _vq=new THREE.Quaternion(), _vy=new THREE.Vector3(0,1,0), _vp=new THREE.Vector3(), _v1=new THREE.Vector3(1,1,1);
function frameM(x,y,z,rot){ _vq.setFromAxisAngle(_vy,rot); _vp.set(x,y,z); return new THREE.Matrix4().compose(_vp,_vq,_v1); }
const vbox=(w,h,d,x,y,z)=>new THREE.BoxGeometry(w,h,d).translate(x||0,y||0,z||0);
const woodC=base=>(x,y,z,c)=>{ c.set(base).multiplyScalar(0.84+h3(x,y,z)*0.3); };
function stoneC(x,y,z,c){ c.set(0x807a70).multiplyScalar(0.72+h3(Math.floor(x*3),Math.floor(y*3),Math.floor(z*3))*0.4); }
function prism(w,h,d){
  const hw=w/2, hd=d/2, P=[];
  const tri=(a,b,c)=>P.push(...a,...b,...c);
  tri([-hw,0,-hd],[0,h,-hd],[hw,0,-hd]); tri([-hw,0,hd],[hw,0,hd],[0,h,hd]);
  tri([-hw,0,-hd],[-hw,0,hd],[0,h,hd]); tri([-hw,0,-hd],[0,h,hd],[0,h,-hd]);
  tri([hw,0,-hd],[0,h,hd],[hw,0,hd]); tri([hw,0,-hd],[0,h,-hd],[0,h,hd]);
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.computeVertexNormals(); return g;
}
function buildVillage(){
  const out=[], win=[], Y=VIL.h, smokePts=[];
  const inF=(F)=>({A:(g,fn)=>out.push(pc(g,fn).applyMatrix4(F)), W:(g)=>win.push(pc(g,(x,y,z,c)=>c.set(0x2e3944)).applyMatrix4(F))});
  // houses
  for(const H of VIL.houses){
    const F=frameM(H.x,Y,H.z,H.rot), {A,W}=inF(F), {w,d,wh,rh}=H, base=0.4, T=woodC(0x4e3624);
    A(vbox(w+0.35,0.9,d+0.35,0,base-0.45,0),stoneC);
    A(vbox(w,wh,d,0,base+wh/2,0),(x,y,z,c)=>{ c.set(H.plaster).multiplyScalar(0.93+h3(x,y,z)*0.1); });
    for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.24,wh,0.24,sx*w/2,base+wh/2,sz*d/2),T);
    for(const sz of [-1,1]){ A(vbox(w+0.1,0.2,0.14,0,base+wh-0.1,sz*(d/2+0.03)),T); A(vbox(w+0.1,0.16,0.12,0,base+wh*0.52,sz*(d/2+0.03)),T); }
    for(const sx of [-1,1]){ A(vbox(0.14,0.2,d+0.1,sx*(w/2+0.03),base+wh-0.1,0),T); A(vbox(0.12,0.16,d+0.1,sx*(w/2+0.03),base+wh*0.52,0),T); }
    A(prism(w,rh,d).translate(0,base+wh,0),(x,y,z,c)=>{ c.set(H.plaster).multiplyScalar(0.88); });
    const a=Math.atan2(rh,w/2), len=Math.hypot(w/2,rh)+0.55, rd=d+0.9, th=0.2;
    for(const sd of [-1,1]){
      const g=new THREE.BoxGeometry(len,th,rd,6,1,1); g.rotateZ(-sd*a);
      g.translate(sd*(w/4+Math.cos(a)*0.27+Math.sin(a)*th/2), base+wh+rh/2-Math.sin(a)*0.27+Math.cos(a)*th/2, 0);
      A(g,(x,y,z,c)=>{ const band=Math.floor(y*4.5); c.set(H.roof).multiplyScalar(0.82+(band%2)*0.1+h3(x,band,z)*0.12); });
    }
    A(vbox(0.26,0.26,rd+0.1,0,base+wh+rh+0.12,0),T);
    A(vbox(1.15,2.05,0.12,0,base+1.02,-d/2-0.04),woodC(0x4a3020));
    A(vbox(1.45,0.18,0.16,0,base+2.12,-d/2-0.05),T);
    A(vbox(1.8,0.4,0.7,0,0,-d/2-0.5),stoneC);
    const winAt=(px,py,pz,ry)=>{
      const M=new THREE.Matrix4().makeRotationY(ry).setPosition(px,py,pz);
      W(vbox(0.85,0.95,0.08).applyMatrix4(M));
      [vbox(1.05,0.12,0.14,0,0.53,0),vbox(1.05,0.12,0.18,0,-0.53,0),vbox(0.06,0.95,0.12),vbox(0.85,0.06,0.12)].forEach(g=>A(g.applyMatrix4(M),T));
      for(const sd of [-1,1]) A(vbox(0.4,1.0,0.05,sd*0.68,0,-0.02).applyMatrix4(M),woodC(H.accent));
    };
    const wy=base+wh*0.56;
    if(w>=5.4){ winAt(-w*0.3,wy,-d/2-0.07,0); winAt(w*0.3,wy,-d/2-0.07,0); } else winAt(w*0.3,wy,-d/2-0.07,0);
    winAt(-w/2-0.07,wy,0,Math.PI/2); winAt(w/2+0.07,wy,0,-Math.PI/2); winAt(0,wy,d/2+0.07,Math.PI);
    if(H.tavern){
      for(const x of [-2.6,0,2.6]) winAt(x,base+wh*0.85,-d/2-0.07,0);
      A(vbox(0.12,0.12,1.2,w/2-0.9,base+2.9,-d/2-0.6),T);
      A(vbox(0.9,0.6,0.08,w/2-0.9,base+2.45,-d/2-1.1),woodC(0x7a5030));
      A(vbox(0.5,0.3,0.1,w/2-0.9,base+2.45,-d/2-1.15),(x,y,z,c)=>c.set(0xc9a13a));
    }
    if(H.flowers && w>=5.4) for(const sx of [-1,1]){
      A(vbox(0.95,0.22,0.3,sx*w*0.3,wy-0.65,-d/2-0.22),woodC(0x5a3e28));
      for(let k=0;k<4;k++) A(csph(0.1,6,5).translate(sx*w*0.3-0.33+k*0.22,wy-0.47,-d/2-0.22),(x,y,z,c)=>c.set([0xe5484d,0xf6d23c,0xf4f2ea,0xa65fd4][(k+H.i)%4]));
    }
    if(H.chimney){
      const cx=w*0.22, cz=d*0.2;
      A(vbox(0.7,rh+1.3,0.7,cx,base+wh+(rh+1.3)/2-0.2,cz),stoneC);
      smokePts.push(new THREE.Vector3(cx,base+wh+rh+1.2,cz).applyMatrix4(F));
    }
    if(H.woodpile){
      for(let r=0;r<3;r++) for(let k=0;k<4-r;k++){
        A(cyl(0.14,0.14,1.1,7).rotateX(Math.PI/2).translate(w/2+0.5,0.16+r*0.26,-1+k*0.3+r*0.15),woodC(0x6a4a30));
      }
      VIL.boxes.push({x:H.x+(w/2+0.5)*Math.cos(H.rot)+(-0.5)*Math.sin(H.rot), z:H.z-(w/2+0.5)*Math.sin(H.rot)+(-0.5)*Math.cos(H.rot), rot:H.rot, hw:0.25, hd:0.75});
    }
  }
  // well
  { const {A}=inF(frameM(VIL.x,Y,VIL.z,VIL.ent));
    A(new THREE.CylinderGeometry(1.1,1.2,0.9,16).translate(0,0.45,0),(x,y,z,c)=>{ if(y>0.88 && Math.hypot(x,z)<0.95) c.set(0x1c2a36); else stoneC(x,y,z,c); });
    for(const sd of [-1,1]) A(vbox(0.16,2.2,0.16,sd*0.95,1.1,0),woodC(0x5a3e28));
    A(cyl(0.06,0.06,2.1,8).rotateZ(Math.PI/2).translate(0,1.7,0),woodC(0x6a4a30));
    A(prism(2.6,0.9,1.7).translate(0,2.2,0),woodC(0x7d5c34));
    A(cyl(0.16,0.13,0.28,10).translate(0,1.2,0),woodC(0x6a4a30));
  }
  // stalls
  const awn=[0xb4552f,0x2f4a6b,0x3d5a3a];
  const goods=[[0xc0392b,0xd35400,0x8a2f2f],[0xd8b56e,0xc9a13a,0xb88a4a],[0x5d8a32,0x7aa04a,0xe0a23a]];
  for(const st of VIL.stalls){
    const {A}=inF(frameM(st.x,Y,st.z,st.rot)), T=woodC(0x5a3e28);
    A(vbox(2.6,0.9,1.1,0,0.45,0),woodC(0x7a5a3a));
    for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.1,sz<0?2.3:2.7,0.1,sx*1.25,(sz<0?2.3:2.7)/2,sz*0.5),T);
    A(new THREE.BoxGeometry(3,0.07,1.9,12,1,1).rotateX(-0.22).translate(0,2.55,0),(x,y,z,c)=>{ c.set(Math.floor((x+1.5)*2.2)%2?awn[st.i]:0xeae3d2); });
    if(st.i===0){ // weapons
      for(let k=0;k<3;k++){ A(vbox(0.9,0.02,0.06,-0.7+k*0.3,0.92,-0.2+k*0.05).rotateY(0.1*k),(x,y,z,c)=>c.set([0xc0c6cc,0xd9e2ea,0x9c9288][k])); A(vbox(0.06,0.04,0.2,-1.18+k*0.3,0.93,-0.2+k*0.05),c=>c.set(0x8a7a4a)); }
      A(new THREE.TorusGeometry(0.45,0.02,5,20,Math.PI*0.62).rotateX(Math.PI/2).translate(0.55,0.93,0.05),c=>c.set(0x6a4428));
      for(let k=0;k<3;k++) A(cyl(0.012,0.018,0.34,5).rotateZ(Math.PI/2).translate(0.75,0.93,-0.3+k*0.08),c=>c.set([0x7a5236,0xcfd8e6,0x3a2a4a][k]));
    } else if(st.i===1){ // armor
      for(let k=0;k<3;k++) A(new THREE.SphereGeometry(0.15,12,8,0,TAU,0,Math.PI/2).translate(-0.85+k*0.42,0.9,-0.15),c=>c.set([0x7a5236,0x8a8f94,0xa8b4c0][k]));
      A(vbox(0.5,0.6,0.22,0.75,1.2,0.05),(x,y,z,c)=>c.set(0x8a8f94).multiplyScalar(0.72+0.38*((Math.floor(x*40)+Math.floor(y*40))&1)));
      A(vbox(0.1,0.35,0.1,0.75,0.72+0.18,0.05),c=>c.set(0x5a3e28));
    } else if(st.i===2){ // Greta's forge: anvil, brazier of glowing coals, rarity gems on the counter
      const iron=c=>c.set(0x3a3c40), ironHi=(x,y,z,c)=>c.set(0x4a4d52).multiplyScalar(0.85+y*0.25);
      A(vbox(0.34,0.4,0.3,1.95,0.2,0.55),woodC(0x4a3424));
      A(vbox(0.26,0.14,0.2,1.95,0.47,0.55),iron); A(vbox(0.56,0.16,0.26,1.95,0.62,0.55),ironHi);
      A(new THREE.ConeGeometry(0.1,0.3,8).rotateZ(Math.PI/2).translate(2.37,0.63,0.55),iron);
      A(vbox(0.05,0.05,0.34,1.85,0.73,0.5).rotateY(0.3),woodC(0x6a4a30)); A(vbox(0.12,0.08,0.08,1.85,0.73,0.33),iron);
      A(cyl(0.34,0.24,0.5,10).translate(-1.95,0.25,0.5),iron); A(cyl(0.36,0.36,0.06,10).translate(-1.95,0.52,0.5),ironHi);
      for(let j=0;j<7;j++) A(new THREE.DodecahedronGeometry(0.07,0).translate(-1.95+Math.sin(j*2.4)*0.18,0.58,0.5+Math.cos(j*2.4)*0.18),c=>c.set(0xff6a1a).multiplyScalar(0.8+h3(j,2,9)*0.5));
      for(let k=0;k<4;k++) A(new THREE.OctahedronGeometry(0.09,0).translate(-0.75+k*0.5,1.02,-0.1),c=>c.set([0x5b9cf0,0xb77cf5,0xf0cd45,0x62d66e][k]));
      for(let k=0;k<2;k++) A(vbox(0.5,0.08,0.16,-0.6+k*1.2,0.94,0.25),(x,y,z,c)=>c.set(0x8a8f94).multiplyScalar(0.8+y*2));
      const p=new THREE.Vector3(-1.95,0.62,0.5).applyAxisAngle(new THREE.Vector3(0,1,0),st.rot);
      const m=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.45,7),flameMats[1]); m.position.set(st.x+p.x,Y+p.y,st.z+p.z); scene.add(m); flames.push(m);
    } else {
      for(let k=0;k<3;k++){
        A(vbox(0.6,0.3,0.5,-0.8+k*0.8,1.05,-0.1),woodC(0x8a6a44));
        for(let j=0;j<5;j++) A(csph(0.09,7,5).translate(-0.95+k*0.8+(j%3)*0.15,1.26+Math.floor(j/3)*0.08,-0.2+(j%2)*0.2),(x,y,z,c)=>c.set(goods[st.i][k]).multiplyScalar(0.9+h3(j,k,st.i)*0.2));
      }
    }
  }
  // the quest board (Maren stands in front of it)
  { const B=VIL.board, F=frameM(B.x,Y,B.z,B.rot), {A}=inF(F), post=woodC(0x4e3624), trim=woodC(0x3a2a1c);
    for(const sx of [-1,1]){ A(vbox(0.2,3.6,0.2,sx*1.9,1.8,0),post); A(vbox(0.42,0.3,0.42,sx*1.9,0.1,0),stoneC); }
    A(vbox(3.6,2.0,0.1,0,1.95,0),(x,y,z,c)=>{ c.set(0x7a5a3a).multiplyScalar(0.8+0.2*((Math.floor((y-0.95)*5))&1)+h3(x,y,z)*0.08); });
    for(const y of [0.9,3.0]) A(vbox(4.0,0.14,0.2,0,y,0),trim);
    A(prism(1.1,0.55,4.5).rotateY(Math.PI/2).translate(0,3.62,0),(x,y,z,c)=>{ c.set(0x6a4a3a).multiplyScalar(0.8+0.2*((Math.floor(x*6))&1)); });
    A(vbox(4.5,0.08,1.1,0,3.6,0),trim);
    const notes=[[-1.25,2.45,0.62,0.78],[-0.45,2.5,0.58,0.72],[0.35,2.42,0.66,0.8],[1.2,2.5,0.6,0.7],[-1.3,1.5,0.56,0.7],[-0.5,1.55,0.64,0.76],[0.4,1.5,0.6,0.7],[1.25,1.55,0.62,0.78],[-0.05,2.0,0.4,0.36],[0.9,1.98,0.36,0.3],[-0.95,1.98,0.38,0.32]];
    notes.forEach(([x,y,w,h],i)=>{
      const rz=(h3(i,3,7)-0.5)*0.22, col=[0xefe4c8,0xe6d6b0,0xf2ead6,0xdccb9e][i%4];
      A(new THREE.BoxGeometry(w,h,0.012).rotateZ(rz).translate(x,y,0.062),(px,py,pz,c)=>{ c.set(col); const ly=(py-y)*Math.cos(rz)-(px-x)*Math.sin(rz); if(Math.abs(ly)<h*0.36 && Math.abs(ly*18-Math.round(ly*18))<0.18) c.multiplyScalar(0.72); });
      A(csph(0.035,6,5).translate(x-Math.sin(rz)*h*0.42,y+Math.cos(rz)*h*0.42,0.08),c=>c.set(i%3?0xb03a2e:0xd4a83a));
    });
    A(vbox(0.7,0.45,0.5,1.45,0.22,0.7),woodC(0x8a6a44));
    for(let k=0;k<4;k++) A(cyl(0.06,0.06,0.42,8).rotateZ(Math.PI/2).translate(1.3+(k%2)*0.2,0.5+Math.floor(k/2)*0.1,0.6+(k%2)*0.12),c=>c.set(0xefe4c8));
    // the painted header
    const cv=document.createElement('canvas'); cv.width=512; cv.height=112; const g=cv.getContext('2d');
    g.fillStyle='#3a2a1c'; g.fillRect(0,0,512,112); g.strokeStyle='#d4a83a'; g.lineWidth=6; g.strokeRect(8,8,496,96);
    g.fillStyle='#f2cf5a'; g.font='700 64px Fraunces, Georgia, serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('QUEST BOARD',256,60);
    const tex=new THREE.CanvasTexture(cv); tex.anisotropy=4;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.3,0.5),new THREE.MeshLambertMaterial({map:tex,emissive:0x2a1a08}));
    const sp=new THREE.Vector3(0,3.28,0.12).applyAxisAngle(new THREE.Vector3(0,1,0),B.rot);
    sign.position.set(B.x+sp.x,Y+sp.y,B.z+sp.z); sign.rotation.y=B.rot; scene.add(sign);
  }
  // campfire + benches
  { const fp=VIL.fire, {A}=inF(frameM(fp.x,Y,fp.z,0));
    for(let k=0;k<9;k++){ const a=k/9*TAU; A(new THREE.DodecahedronGeometry(0.2,0).scale(1,0.7,1).translate(Math.sin(a)*0.75,0.1,Math.cos(a)*0.75),stoneC); }
    for(let k=0;k<3;k++) A(cyl(0.08,0.08,1.0,6).rotateZ(Math.PI/2).rotateY(k*1.05).translate(0,0.15,0),woodC(0x3a2a1c));
    for(let k=0;k<4;k++){
      const m=new THREE.Mesh(new THREE.ConeGeometry(k===0?0.3:0.18,k===0?1.0:0.65,7),flameMats[k===0?0:1]);
      m.position.set(fp.x+(k?Math.sin(k*2.1)*0.18:0),Y+0.5,fp.z+(k?Math.cos(k*2.1)*0.18:0)); scene.add(m); flames.push(m);
    }
    fireLight.position.set(fp.x,Y+1.3,fp.z);
  }
  for(const b of VIL.benches){
    const {A}=inF(frameM(b.x,Y,b.z,b.rot));
    A(cyl(0.2,0.2,1.8,9).rotateZ(Math.PI/2).translate(0,0.4,0),woodC(0x6a4a30));
    for(const sx of [-1,1]) A(cyl(0.12,0.14,0.3,7).translate(sx*0.6,0.15,0),woodC(0x4e3624));
  }
  // lamps
  for(const l of VIL.lamps){
    const {A,W}=inF(frameM(l.x,Y,l.z,l.rot)), T=woodC(0x3e2c1e);
    A(vbox(0.14,2.8,0.14,0,1.4,0),T); A(vbox(0.1,0.1,0.7,0,2.7,-0.3),T);
    W(vbox(0.26,0.34,0.26,0,2.42,-0.6)); A(vbox(0.32,0.06,0.32,0,2.62,-0.6),T);
  }
  // barrels, crates, garden, sign
  for(const [x,z] of VIL.barrels){ const {A}=inF(frameM(x,Y,z,0)); A(cyl(0.35,0.35,0.85,12).translate(0,0.43,0),(px,py,pz,c)=>{ c.set(0x7a5030).multiplyScalar(0.9+h3(Math.floor(Math.atan2(pz,px)*4),0,0)*0.2); if(Math.abs(py-0.2)<0.05||Math.abs(py-0.66)<0.05) c.set(0x3a3a3a); }); }
  for(const [x,z,r] of VIL.crates){ const {A}=inF(frameM(x,Y,z,r)); A(vbox(0.7,0.6,0.7,0,0.3,0),woodC(0x8a6a44)); A(vbox(0.55,0.45,0.55,0.05,0.82,0.05),woodC(0x7a5a3a)); }
  { const G=VIL.garden, {A}=inF(frameM(G.x,Y,G.z,G.rot)), T=woodC(0x6a5038);
    const hw=3, hd=2.2;
    for(let x=-hw;x<=hw+0.01;x+=1.5) for(const sz of [-1,1]) A(vbox(0.1,0.9,0.1,x,0.45,sz*hd),T);
    for(let z=-hd+1.1;z<hd;z+=1.1) for(const sx of [-1,1]) A(vbox(0.1,0.9,0.1,sx*hw,0.45,z),T);
    for(const y of [0.35,0.7]){ for(const sz of [-1,1]) A(vbox(2*hw,0.06,0.05,0,y,sz*hd),T); for(const sx of [-1,1]) A(vbox(0.05,0.06,2*hd,sx*hw,y,0),T); }
    for(let r=0;r<3;r++){ A(vbox(5.4,0.12,0.6,0,0.06,-1.2+r*1.2),(x,y,z,c)=>c.set(0x5a4430)); for(let k=0;k<9;k++) A(csph(0.17,7,5).scale(1,0.7,1).translate(-2.4+k*0.6,0.2,-1.2+r*1.2),(x,y,z,c)=>c.set(r===1?0x7aa04a:0x4f7a30).multiplyScalar(0.9+h3(k,r,1)*0.2)); }
  }
  { const S=VIL.sign, {A}=inF(frameM(S.x,Y,S.z,S.rot)), T=woodC(0x5a3e28);
    A(vbox(0.14,2.2,0.14,0,1.1,0),T); A(vbox(1.4,0.45,0.08,0.45,1.8,0),woodC(0x8a6a44)); A(vbox(1.1,0.07,0.09,0.45,1.8,0),(x,y,z,c)=>c.set(0x3a2a1c));
  }
  // standing stones around the Rootwarden's arena (the vale's two shrines are in buildings-vale.js)
  for(let k=0;k<11;k++){
    const a=k/11*TAU+0.2, x=ARENA.x+Math.sin(a)*(ARENA.r+1.5), z=ARENA.z+Math.cos(a)*(ARENA.r+1.5), hgt=AR(2.6,4.2);
    const {A}=inF(frameM(x,ARENA.h-0.3,z,a));
    A(new THREE.BoxGeometry(1.2,hgt,0.7,1,4,1).translate(0,hgt/2,0).rotateZ(AR(-0.08,0.08)),(px,py,pz,c)=>{ stoneC(px,py,pz,c); if(py>hgt*0.75) c.lerp(_tint.set(0x5a6a3a),0.4); if(Math.abs(py-hgt*0.5)<0.12) c.set(0xb07ae0); });
    VIL.circles.push([x,z,0.7]);
  }
  const vm=new THREE.Mesh(merge(out),villageMat); vm.castShadow=true; vm.receiveShadow=true; scene.add(vm);
  const wm=new THREE.Mesh(merge(win),windowMat); wm.receiveShadow=true; scene.add(wm);
  for(const c of VIL.circles) addCol(c[0],c[1],c[2]);
  // chimney smoke
  const per=10, pos=new Float32Array(smokePts.length*per*3), data=[];
  smokePts.forEach(p=>{ for(let k=0;k<per;k++) data.push({o:p,age:k/per,sp:AR(0.8,1.2)}); });
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const sm=new THREE.PointsMaterial({size:1.6,map:new THREE.CanvasTexture(spr),transparent:true,depthWrite:false,opacity:0.22,color:0xc8c8c8});
  smoke={pts:new THREE.Points(sg,sm),data,pos}; smoke.pts.frustumCulled=false; scene.add(smoke.pts);
}
function updateVillage(dt){
  if(!smoke) return;
  const night=envCur.night;
  windowMat.emissiveIntensity=smoothstep(0.05,0.9,night)*1.35+0.08;
  const fl=0.85+0.15*Math.sin(t*13)*Math.sin(t*7.3);
  const FV=vilAt(camera.position.x,camera.position.z); fireLight.position.set(FV.fire.x,FV.h+(FV===VIL2?1.6:1.3),FV.fire.z);
  fireLight.intensity=(0.35+night*2.4)*fl;
  flames.forEach((m,i)=>{ const s=0.75+0.3*Math.sin(t*(9+i*2.3)+i)*Math.sin(t*5.1+i*1.7); m.scale.set(1+0.1*Math.sin(t*11+i),s,1+0.1*Math.cos(t*10+i)); m.rotation.y=t*(0.5+i*0.3); });
  const d=smoke.data, p=smoke.pos;
  for(let i=0;i<d.length;i++){
    const s=d[i]; s.age+=dt*0.12*s.sp; if(s.age>1) s.age-=1;
    p[i*3]=s.o.x+s.age*3.2+Math.sin(t+i)*0.3; p[i*3+1]=s.o.y+s.age*7; p[i*3+2]=s.o.z+Math.sin(s.age*5+i)*0.4;
  }
  smoke.pts.geometry.attributes.position.needsUpdate=true;
  smoke.pts.material.color.set(0xc8c8c8).lerp(_tint.set(0x39404c),night);
}

