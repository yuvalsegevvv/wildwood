//@ The Hoarfrost Reach's buildings: Rimehold (timber houses under snow, gate and rune stones, the Wayfarers' Lodge yard), the ice wall in Frostgate Pass, the Rimeking's ice hall, the iron bird's wreck
/* Rimehold follows the home village's plan (VIL3 from shared/hoarfrost.js has the same houses, stalls, anchors and colliders), so only the look
   changes here: log walls, steep roofs of turf under snow, carved gable beams, iron braziers. The ice wall shuts Frostgate Pass (a real wall,
   stopped by player/movement.js) until GEAR.north >= 1: then it sinks into the ground with a rumble. The two boss halls are dressed here too. */
const HOAR={wall:null,opening:0,open:false,steam:null};
const iceMat=new THREE.MeshPhongMaterial({color:0xa8d8f0,transparent:true,opacity:0.8,shininess:100,specular:0xdff2fb,flatShading:true,depthWrite:false});
const snowC=(x,y,z,c)=>{ c.set(0xf0f5f8).multiplyScalar(0.94+h3(Math.floor(x*4),Math.floor(y*4),Math.floor(z*4))*0.06); };
// snow on every upward face, `base` (a colour) on the rest
const snowOn=base=>(x,y,z,nx,ny,nz,c)=>{ if(ny>0.5) c.set(0xf0f5f8).multiplyScalar(0.95+h3(Math.floor(x*3),Math.floor(y*3),Math.floor(z*3))*0.05); else c.set(base).multiplyScalar(0.84+h3(Math.floor(x*4),Math.floor(y*4),Math.floor(z*4))*0.3); };
// a painted board seen from the front (canvas text): the lodge's sign
function boardSign(text,o){
  const cv=document.createElement('canvas'); cv.width=512; cv.height=112; const g=cv.getContext('2d');
  g.fillStyle=o.bg; g.fillRect(0,0,512,112); g.strokeStyle=o.line; g.lineWidth=6; g.strokeRect(8,8,496,96);
  g.fillStyle=o.ink; g.font='700 '+o.font+'px Fraunces, Georgia, serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,256,60);
  const tex=new THREE.CanvasTexture(cv); tex.anisotropy=4;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(o.w,o.h),new THREE.MeshLambertMaterial({map:tex,emissive:o.glow||0x000000})); return m;
}
function buildHoarfrost(){
  buildRimehold(); buildIceWall(); buildIceHall(ARENA26); buildWreck(ARENA30);
}
function buildRimehold(){
  const out=[], win=[], V=VIL3, Y=V.h;
  const inF=F=>({A:(g,fn)=>out.push(pc(g,fn).applyMatrix4(F)), N:(g,fn)=>out.push(paint(g,fn).applyMatrix4(F)), W:(g,col)=>win.push(pc(g,c=>c.set(col||0xf6d890)).applyMatrix4(F))});
  const dark=woodC(0x2a1c14), timber=woodC(0x5a3c26), pale=woodC(0x8a6a48), iron=c=>c.set(0x3a3c42);
  const logs=(base,y0)=>(x,y,z,c)=>{ const b=Math.floor((y-y0)*3.4); c.set(base).multiplyScalar(0.72+((b&1)?0.14:0)+h3(Math.floor(x*3),b,Math.floor(z*3))*0.14); };
  const roofs=[0x5a4a34,0x4e4a38,0x5a3f30,0x4a4a3a,0x584636];
  // houses: a stone footing under snow, log walls, a steep turf roof under snow, carved beams crossing over the gable, a shuttered window or two
  for(const H of V.houses){
    const F=frameM(H.x,Y,H.z,H.rot), {A,N,W}=inF(F), {w,d,wh}=H, base=0.5, rh=Math.max(2.3,w*0.46)+(H.tavern?0.8:0);
    A(vbox(w+0.5,1.0,d+0.5,0,base-0.5,0),stoneC); A(vbox(w+0.56,0.14,d+0.56,0,base+0.02,0),snowC);
    A(vbox(w,wh,d,0,base+wh/2,0),logs(0x6a4630,base));
    for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.4,wh+0.12,0.4,sx*w/2,base+wh/2,sz*d/2),dark);   // the corner logs stand proud
    const a=Math.atan2(rh,w/2), len=Math.hypot(w/2,rh)+0.6, rd=d+1.1, th=0.34;
    for(const sd of [-1,1]){
      const g=new THREE.BoxGeometry(len,th,rd,6,1,1); g.rotateZ(-sd*a);
      g.translate(sd*(w/4+Math.cos(a)*0.3+Math.sin(a)*th/2), base+wh+rh/2-Math.sin(a)*0.3+Math.cos(a)*th/2, 0);
      N(g,snowOn(roofs[H.i%5]));
    }
    A(prism(w,rh,d).translate(0,base+wh,0),logs(0x5a3c26,base+wh));   // the gable ends, planked
    A(vbox(0.3,0.3,rd+0.1,0,base+wh+rh+0.14,0),dark);
    for(const ez of [-1,1]) for(const sd of [-1,1]) A(vbox(0.12,1.5,0.1,0,0,0).rotateZ(sd*0.55).translate(0,base+wh+rh+0.35,ez*(rd/2+0.02)),dark);   // the crossed gable beams
    A(vbox(1.25,2.1,0.12,0,base+1.05,-d/2-0.04),woodC(0x3a2618));
    A(vbox(1.6,0.2,0.18,0,base+2.2,-d/2-0.05),dark);
    A(vbox(1.9,0.3,0.8,0,0.15,-d/2-0.5),stoneC); A(vbox(1.95,0.1,0.85,0,0.34,-d/2-0.5),snowC);
    const shutters=(px,py,pz,ry)=>{ const M=new THREE.Matrix4().makeRotationY(ry).setPosition(px,py,pz);
      W(vbox(0.62,0.5,0.06).applyMatrix4(M));
      for(const sd of [-1,1]) A(vbox(0.3,0.56,0.05,sd*0.46,0,-0.02).applyMatrix4(M),woodC(H.accent)); A(vbox(0.78,0.08,0.12,0,0.3,0).applyMatrix4(M),dark); };
    const wy=base+wh*0.6;
    shutters(w*0.3,wy,-d/2-0.05,0); shutters(-w/2-0.05,wy,0,Math.PI/2); shutters(w/2+0.05,wy,0,-Math.PI/2); shutters(0,wy,d/2+0.05,Math.PI);
    if(H.chimney){ A(vbox(0.85,rh+1.3,0.85,w*0.26,base+wh+(rh+1.3)/2-0.3,d*0.12),stoneC); A(vbox(1.0,0.16,1.0,w*0.26,base+wh+rh+1.05,d*0.12),snowC); }
    if(H.tavern){   // the mead hall: a row of round shields along the front, a banner over the door
      for(let k=0;k<5;k++){ const cx=-w/2+1.2+k*(w-2.4)/4, col=[0x8a2a26,0x2f4a6b,0xc9a13a,0x3d5a3a,0x8a2a26][k]; A(cyl(0.42,0.42,0.07,14).rotateX(Math.PI/2).translate(cx,base+wh*0.86,-d/2-0.09),(x,y,z,c)=>{ c.set(col); if(Math.hypot(x-cx,y-base-wh*0.86)<0.09) c.set(0xd8d4c8); }); }
      A(vbox(0.9,1.6,0.04,w*0.3,base+2.9,-d/2-0.12),c=>c.set(0x7a1e1e));
    }
    if(H.woodpile){ for(let r=0;r<3;r++) for(let k=0;k<4-r;k++) A(cyl(0.16,0.16,1.2,7).rotateZ(Math.PI/2).translate(w/2+0.9,0.2+r*0.3,-d*0.2+k*0.34+r*0.17),woodC(0x8a6a44)); A(vbox(1.3,0.12,1.8,w/2+0.9,0.92,-d*0.02),snowC); }
    if(H.i%3===0){   // a fish-drying rack
      for(const sd of [-1,1]) A(vbox(0.1,1.9,0.1,-w/2-1.2,0.95,sd*0.9),dark); A(vbox(0.1,0.1,2.0,-w/2-1.2,1.85,0),dark);
      for(let k=0;k<5;k++) A(vbox(0.05,0.55,0.22,-w/2-1.2,1.5,-0.75+k*0.37),c=>c.set(0xa8b4bc));
    }
  }
  // the well: a stone ring, a turf-and-snow roof on two posts
  { const {A,N}=inF(frameM(V.x,Y,V.z,V.ent));
    A(new THREE.CylinderGeometry(1.1,1.2,0.8,16).translate(0,0.4,0),(x,y,z,c)=>{ if(y>0.78&&Math.hypot(x,z)<0.95) c.set(0x9ab8cc); else stoneC(x,y,z,c); });
    A(new THREE.CylinderGeometry(1.14,1.14,0.08,16).translate(0,0.82,0),(x,y,z,c)=>{ if(Math.hypot(x,z)>0.96) c.set(0xf0f5f8); else c.set(0x9ab8cc); });
    for(const sd of [-1,1]) A(vbox(0.16,2.3,0.16,sd*0.95,1.15,0),dark);
    A(cyl(0.06,0.06,2.1,8).rotateZ(Math.PI/2).translate(0,1.75,0),pale);
    N(vbox(2.8,0.22,1.9,0,2.4,0).rotateZ(0.0),snowOn(0x5a4a34));
  }
  // stalls: a counter, a slanted snow roof, pelts and wares in each stall's own way
  const trim=[0x2f4a6b,0x8a2a26,0x3d5a3a];
  for(const st of V.stalls){
    const {A,N}=inF(frameM(st.x,Y,st.z,st.rot));
    A(vbox(2.6,0.9,1.1,0,0.45,0),timber); A(vbox(2.7,0.08,1.2,0,0.94,0),snowC);
    for(const sx of [-1,1]) for(const sz of [-1,1]) A(vbox(0.13,2.6,0.13,sx*1.25,1.3,sz*0.5),dark);
    N(new THREE.BoxGeometry(3.4,0.26,2.1).rotateX(0.1).translate(0,2.65,0),snowOn(0x4a3a28));
    for(let k=0;k<5;k++) A(vbox(0.5,0.5,0.02,-1.0+k*0.5,2.2,-0.6),(x,y,z,c)=>{ c.set(trim[st.i]); if(y<2.0) c.multiplyScalar(0.85); });
    if(st.i===0){   // axes and spears
      for(let k=0;k<3;k++){ A(cyl(0.025,0.025,1.0,5).translate(0,0.5,0).rotateZ(0.2).translate(-0.9+k*0.3,0.94,-0.25),woodC(0x6a4630)); A(vbox(0.26,0.2,0.04,-0.92+k*0.3+0.1,1.86,-0.25),c=>c.set(0xc0c8ce)); }
      A(cyl(0.02,0.02,2.0,5).rotateZ(0.12).translate(0.9,1.0,0.3),woodC(0x6a4630)); A(new THREE.ConeGeometry(0.05,0.28,4).translate(0.9-0.12,2.05,0.3),c=>c.set(0xc0c8ce));
    } else if(st.i===1){   // furs and mail
      for(let k=0;k<4;k++) A(vbox(0.42,0.9,0.05,-1.0+k*0.6,1.9,0.5),(x,y,z,c)=>{ c.set([0xe8e2d6,0xa08c76,0xf2f0ea,0x8a7660][k]).multiplyScalar(0.85+h3(Math.floor(x*9),Math.floor(y*9),k)*0.2); });
      A(vbox(0.5,0.6,0.22,0.75,1.25,0),(x,y,z,c)=>c.set(0x8a929a).multiplyScalar(0.75+0.3*((Math.floor(y*14))&1)));
    } else {   // the forge stall: an anvil, a coal bed that glows
      const ir=c=>c.set(0x3a3c40);
      A(vbox(0.34,0.4,0.3,1.95,0.2,0.55),timber); A(vbox(0.56,0.16,0.26,1.95,0.62,0.55),ir);
      A(cyl(0.34,0.24,0.5,10).translate(-1.95,0.25,0.5),ir);
      for(let j=0;j<7;j++) A(new THREE.DodecahedronGeometry(0.07,0).translate(-1.95+Math.sin(j*2.4)*0.18,0.54,0.5+Math.cos(j*2.4)*0.18),c=>c.set(0xff6a1a));
      for(let k=0;k<4;k++) A(new THREE.OctahedronGeometry(0.09,0).translate(-0.75+k*0.5,1.02,-0.1),c=>c.set([0x5b9cf0,0xb77cf5,0xf0cd45,0x62d66e][k]));
      const p=new THREE.Vector3(-1.95,0.62,0.5).applyAxisAngle(new THREE.Vector3(0,1,0),st.rot);
      const m=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.45,7),flameMats[1]); m.position.set(st.x+p.x,Y+p.y,st.z+p.z); scene.add(m); flames.push(m);
    }
  }
  // the quest board: carved posts, a snow cap
  { const B=V.board, {A,N}=inF(frameM(B.x,Y,B.z,B.rot));
    for(const sx of [-1,1]){ A(vbox(0.26,3.5,0.26,sx*1.9,1.75,0),woodC(0x4a2e1c)); A(vbox(0.5,0.3,0.5,sx*1.9,0.1,0),stoneC); A(new THREE.ConeGeometry(0.2,0.5,4).translate(sx*1.9,3.7,0),woodC(0x8a2a26)); }
    A(vbox(3.6,2.0,0.1,0,1.95,0),(x,y,z,c)=>c.set(0x6a4a30).multiplyScalar(0.85+h3(x,y,z)*0.08));
    A(vbox(4.2,0.16,0.22,0,3.0,0),dark); A(vbox(4.4,0.14,0.26,0,0.9,0),dark);
    N(vbox(4.7,0.28,1.1,0,3.3,0),snowOn(0x4a3a28));
    [[-1.2,2.4],[-0.4,2.45],[0.45,2.4],[1.25,2.45],[-1.25,1.5],[-0.45,1.55],[0.4,1.5],[1.2,1.55]].forEach(([x,y],i)=>A(new THREE.BoxGeometry(0.56,0.7,0.012).rotateZ((h3(i,3,7)-0.5)*0.2).translate(x,y,0.062),c=>c.set([0xf2ead6,0xe6d6b0,0xefe4c8][i%3])));
    questSign(B,Y,{bg:'#1c3346',line:'#b8d8ec',ink:'#f0f8ff',font:60,w:2.2,h:0.48,y:3.02,z:0.13,glow:0x081420});
  }
  // the great fire: a ring of stones, split logs, and log benches
  { const fp=V.fire, {A}=inF(frameM(fp.x,Y,fp.z,0));
    A(cyl(0.9,1.05,0.35,9).translate(0,0.17,0),stoneC); A(cyl(0.68,0.68,0.05,9).translate(0,0.36,0),c=>c.set(0x2a2220));
    for(let k=0;k<4;k++) A(cyl(0.09,0.09,1.1,6).rotateZ(Math.PI/2).rotateY(k*0.8).translate(0,0.44,0),woodC(0x3a2a1c));
    for(let k=0;k<4;k++){ const m=new THREE.Mesh(new THREE.ConeGeometry(k===0?0.34:0.2,k===0?1.1:0.7,7),flameMats[k===0?0:1]);
      m.position.set(fp.x+(k?Math.sin(k*2.1)*0.2:0),Y+0.85,fp.z+(k?Math.cos(k*2.1)*0.2:0)); scene.add(m); flames.push(m); }
  }
  for(const b of V.benches){ const {A}=inF(frameM(b.x,Y,b.z,b.rot)); A(cyl(0.22,0.22,1.9,8).rotateZ(Math.PI/2).translate(0,0.36,0),woodC(0x6a4630)); A(vbox(1.9,0.05,0.34,0,0.6,0),c=>c.set(0xe8eef2)); }
  // braziers on iron posts instead of lamps
  for(const l of V.lamps){ const {A}=inF(frameM(l.x,Y,l.z,l.rot)); A(cyl(0.06,0.08,1.9,6).translate(0,0.95,0),iron); A(cyl(0.3,0.16,0.24,8).translate(0,1.98,0),iron); A(cyl(0.3,0.3,0.05,8).translate(0,2.12,0),c=>c.set(0x2a2220));
    const m=new THREE.Mesh(new THREE.ConeGeometry(0.15,0.42,7),flameMats[1]); m.position.set(l.x,Y+2.35,l.z); scene.add(m); flames.push(m); }
  for(const [x,z] of V.barrels){ const {A}=inF(frameM(x,Y,z,0)); A(cyl(0.36,0.36,0.8,12).translate(0,0.4,0),(px,py,pz,c)=>{ c.set(0x8a6a44).multiplyScalar(0.9+h3(Math.floor(Math.atan2(pz,px)*6),0,0)*0.15); if(Math.abs(py-0.25)<0.05||Math.abs(py-0.6)<0.05) c.set(0x2e2a28); }); A(cyl(0.34,0.34,0.06,12).translate(0,0.82,0),snowC); }
  for(const [x,z,r] of V.crates){ const {A}=inF(frameM(x,Y,z,r)); A(vbox(0.7,0.6,0.7,0,0.3,0),woodC(0x8a6a44)); A(vbox(0.72,0.08,0.72,0,0.64,0),snowC); }
  // the Wayfarers' Lodge yard (the garden's place): a plank floor, racks of pickaxes and axes, a chopping block, drying herbs, an ore barrow
  { const G=V.garden, {A,N}=inF(frameM(G.x,Y,G.z,G.rot));
    A(vbox(5.8,0.1,4.2,0,0.05,0),(x,y,z,c)=>{ c.set(0x6a4a30).multiplyScalar(0.85+0.12*(Math.floor(x*2.2)&1)); });
    for(const sx of [-1,1]) A(vbox(0.14,2.3,0.14,sx*1.4,1.15,1.7),dark); A(vbox(3.1,0.12,0.14,0,2.3,1.7),dark);   // the tool rack: a crossbar on two posts...
    for(let k=0;k<4;k++){ const px=-1.05+k*0.7; A(cyl(0.025,0.025,1.1,5).translate(px,1.6,1.62),woodC(0x6a4630)); A(vbox(0.55,0.06,0.06,px,2.12,1.62),c=>c.set(0xc0c8ce)); A(new THREE.ConeGeometry(0.05,0.18,4).rotateZ(Math.PI/2).translate(px+0.3,2.12,1.62),c=>c.set(0xc0c8ce)); }   // ...hung with pickaxes
    A(cyl(0.42,0.46,0.5,10).translate(-2.0,0.35,-0.7),woodC(0x8a6a44)); A(vbox(0.06,0.7,0.06,-1.9,0.85,-0.7).rotateZ(0.5),woodC(0x6a4630)); A(vbox(0.34,0.24,0.05,-1.62,1.05,-0.7).rotateZ(0.5),c=>c.set(0xc0c8ce));   // a chopping block with an axe in it
    for(let r=0;r<3;r++) for(let k=0;k<3-r;k++) A(cyl(0.17,0.17,1.3,7).rotateZ(Math.PI/2).translate(-2.0,0.2+r*0.3,0.3+k*0.36+r*0.18),woodC(0x8a6a44));   // a pile of logs
    for(const sx of [-1,1]) A(vbox(0.1,1.7,0.1,1.6+sx*0.9,0.85,-1.2),dark); A(vbox(1.9,0.08,0.08,1.6,1.7,-1.2),dark);   // the herb rack
    for(let k=0;k<5;k++) A(new THREE.ConeGeometry(0.12,0.5,5).rotateX(Math.PI).translate(1.0+k*0.3,1.4,-1.2),c=>c.set([0x7aa04a,0x9ac06a,0xc8a04a,0x7aa04a,0x5a8a5a][k]));
    A(vbox(1.0,0.5,0.7,1.8,0.45,0.6),woodC(0x5a3c26)); for(let j=0;j<5;j++) A(new THREE.OctahedronGeometry(0.14,0).translate(1.6+Math.sin(j*2.1)*0.25,0.82+0.05*j%2,0.6+Math.cos(j*2.1)*0.15),c=>c.set([0x9fd8ff,0xb8e4ff,0x8ac8f0][j%3]));   // an ore barrow of blue rime ore
    A(cyl(0.14,0.14,0.5,8).rotateZ(Math.PI/2).translate(1.2,0.3,0.6),c=>c.set(0x3a3c40));
    const sign=boardSign("WAYFARERS' LODGE",{bg:'#4a3020',line:'#e0c890',ink:'#fff2d8',font:46,w:2.6,h:0.57,glow:0x1a0e06});
    const sp=new THREE.Vector3(0,2.75,1.95).applyAxisAngle(new THREE.Vector3(0,1,0),G.rot); sign.position.set(G.x+sp.x,Y+sp.y,G.z+sp.z); sign.rotation.y=G.rot+Math.PI; scene.add(sign);
  }
  // the gate on the road in: two tall posts, a beam with shields and a hanging horn; rune stones beside it
  { const e=V.ent, p=[V.x+Math.sin(e)*(VR+9),V.z+Math.cos(e)*(VR+9)], {A,N,W}=inF(frameM(p[0],getH(p[0],p[1]),p[1],e));
    for(const sx of [-1,1]){ A(cyl(0.26,0.32,5.4,10).translate(sx*2.7,2.7,0),woodC(0x4a2e1c)); A(cyl(0.44,0.44,0.3,10).translate(sx*2.7,0.15,0),stoneC); A(new THREE.ConeGeometry(0.3,0.7,6).translate(sx*2.7,5.75,0),woodC(0x8a2a26));
      const c=Math.cos(e), s=Math.sin(e); V.circles.push([p[0]+sx*2.7*c,p[1]-sx*2.7*s,0.45]); }
    A(vbox(6.5,0.5,0.5,0,4.9,0),dark); N(vbox(6.7,0.3,0.7,0,5.25,0),snowOn(0x3a2a1c));
    for(let k=0;k<4;k++){ const col=[0x8a2a26,0x2f4a6b,0xc9a13a,0x8a2a26][k]; A(cyl(0.5,0.5,0.08,14).rotateX(Math.PI/2).translate(-2.25+k*1.5,4.9,-0.3),(x,y,z,c)=>{ c.set(col); if(Math.hypot(x+2.25-k*1.5,y-4.9)<0.1) c.set(0xd8d4c8); }); }
    A(new THREE.ConeGeometry(0.28,1.0,8).rotateX(Math.PI).translate(0,3.9,0),c=>c.set(0xe8e0c8)); A(cyl(0.02,0.02,0.5,4).translate(0,4.5,0),iron);   // the horn
    for(const sd of [-1,1]){ const [rx,rz]=[sd*4.6,-0.6]; A(vbox(0.9,2.6,0.5,rx,1.3,rz).rotateY(sd*0.3),stoneC); A(vbox(0.96,0.14,0.56,rx,2.62,rz).rotateY(sd*0.3),snowC);
      for(let k=0;k<4;k++) W(vbox(0.06,0.42,0.04,rx+(k%2?0.12:-0.12),0.95+k*0.36,rz-0.27).rotateZ((k%2?1:-1)*0.5),0x8ad8ff); V.circles.push([p[0]+rx*Math.cos(e)+rz*Math.sin(e),p[1]-rx*Math.sin(e)+rz*Math.cos(e),0.6]); }
  }
  { const S=V.sign, {A,N}=inF(frameM(S.x,Y,S.z,S.rot)); A(vbox(0.16,2.3,0.16,0,1.15,0),dark); A(vbox(0.55,1.3,0.08,0,1.55,0.08),woodC(0x8a6a44)); N(vbox(0.8,0.14,0.36,0,2.25,0.04),snowOn(0x4a3a28)); }
  // dark spruce behind the houses (the forest keeps its distance from the village)
  { const items=[], hA=V.houses.map(h=>h.a);
    for(let i=0;i<7;i++){ const a=(hA[i]+hA[i+1])/2, r=31, x=V.x+Math.sin(a)*r, z=V.z+Math.cos(a)*r, s=R(0.95,1.3);
      items.push({x,z,m:mtx(x,getH(x,z)-0.15,z,a,s,s,s),c:tint(pick(PAL.frostSpruce))}); addCol(x,z,RAD.frostspruce*s); }
    addTreeKind('frostspruce',items);
  }
  addVillageMeshes(out,win);
  for(const c of V.circles) addCol(c[0],c[1],c[2]);
}
/* ---- the ice wall in Frostgate Pass: blue blocks across the canyon with dark shapes frozen inside (LORE 'icewall'), sinking when the way opens ---- */
function buildIceWall(){
  const g=new THREE.Group(), ice=[], dk=[], x0=PASS.x, z0=PASS.ice, y0=getH(x0,z0);
  for(let k=-4;k<=4;k++){
    const h=11+h3(k,1,2)*7, w=2.6+h3(k,3,4)*1.2, px=x0+k*2.0+(h3(k,5,6)-0.5)*0.6, pz=z0+(h3(k,7,8)-0.5)*1.4;
    const b=new THREE.BoxGeometry(w,h,2.6+h3(k,9,1)*1.4,1,3,1); const p=b.attributes.position;   // ragged tops
    for(let i=0;i<p.count;i++) if(p.getY(i)>h*0.4) p.setY(i,p.getY(i)+(h3(i,k,3)-0.5)*2.2);
    b.rotateY((h3(k,4,4)-0.5)*0.4); b.translate(px-x0,h/2-2,pz-z0); ice.push(b);
  }
  for(let k=0;k<7;k++){ const s=0.4+h3(k,2,2)*0.8; dk.push(new THREE.BoxGeometry(s*0.5,s*1.2,s*0.5).rotateZ((h3(k,6,1)-0.5)*1.6).translate((h3(k,8,8)-0.5)*14,3+h3(k,9,9)*8,(h3(k,3,3)-0.5)*1.2)); }   // shapes hung in the ice like flies in amber
  const im=new THREE.Mesh(merge(ice.map(b=>paint(b,()=>_c.set(0xffffff)))),iceMat), dm=new THREE.Mesh(merge(dk.map(b=>paint(b,()=>_c.set(0x2a2228)))),new THREE.MeshLambertMaterial({vertexColors:true}));
  im.renderOrder=2; g.add(dm); g.add(im); g.position.set(x0,y0,z0); scene.add(g); HOAR.wall=g;
}
/* ---- the Rimeking's hall (ARENA26): a ring of tall ice pillars, a great arch of ice on the far side with icicles hanging from it ---- */
function buildIceHall(A){
  const ice=[], snow=[], a0=Math.atan2(A.x-VIL3.x,A.z-VIL3.z);   // the way in faces Rimehold; the arch stands opposite
  for(let k=0;k<11;k++){ const a=k/11*TAU+0.15, x=A.x+Math.sin(a)*(A.r+1.6), z=A.z+Math.cos(a)*(A.r+1.6), h=AR(4.5,8.5), base=getH(x,z)-0.3;
    ice.push(new THREE.CylinderGeometry(AR(0.4,0.6),AR(0.9,1.2),h,6,2).translate(x,base+h/2,z)); snow.push(new THREE.CylinderGeometry(1.5,1.7,0.5,8).translate(x,base+0.15,z)); addCol(x,z,0.9); }
  const ax=A.x+Math.sin(a0)*(A.r+6), az=A.z+Math.cos(a0)*(A.r+6), F=new THREE.Matrix4().makeRotationY(a0+Math.PI).setPosition(ax,getH(ax,az)-0.3,az);
  for(const sx of [-1,1]){ ice.push(new THREE.CylinderGeometry(1.5,2.1,13,6,3).translate(sx*6,6.5,0).applyMatrix4(F)); addCol(...[ax+sx*6*Math.cos(a0+Math.PI),az-sx*6*Math.sin(a0+Math.PI)],2.2); }
  ice.push(new THREE.BoxGeometry(15.5,2.4,2.6).translate(0,13.3,0).applyMatrix4(F));
  for(let k=0;k<9;k++){ const h=AR(1.8,4.6); ice.push(new THREE.ConeGeometry(AR(0.2,0.4),h,5).rotateX(Math.PI).translate(-6.5+k*1.65,12-h/2,AR(-0.4,0.4)).applyMatrix4(F)); }
  const im=new THREE.Mesh(merge(ice.map(b=>paint(b,()=>_c.set(0xffffff)))),iceMat); im.renderOrder=2; scene.add(im);
  const sm=new THREE.Mesh(merge(snow.map(b=>pc(b,snowC))),villageMat); sm.receiveShadow=true; scene.add(sm);
}
/* ---- the iron bird (ARENA30): the wreck of a great machine in the glacier, nose down in the ice, one wing broken; a painted sun inside a ring on its tail ---- */
function buildWreck(A){
  const parts=[], metal=(x,y,z,nx,ny,nz,c)=>{ c.set(0x9aa2a8).multiplyScalar(0.8+h3(Math.floor(x*5),Math.floor(y*5),Math.floor(z*5))*0.3); if(Math.abs(Math.sin(z*3.4))<0.05) c.multiplyScalar(0.6); },
    dent=(x,y,z,nx,ny,nz,c)=>{ c.set(0x7a8288).multiplyScalar(0.8+h3(Math.floor(x*5),Math.floor(y*5),Math.floor(z*5))*0.3); };
  const a0=Math.atan2(A.x-VIL3.x,A.z-VIL3.z), ox=A.x+Math.sin(a0)*(A.r+10), oz=A.z+Math.cos(a0)*(A.r+10), oy=getH(ox,oz);
  const F=new THREE.Matrix4().compose(new THREE.Vector3(ox,oy+0.8,oz),new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.32,a0+Math.PI,0.12,'YXZ')),new THREE.Vector3(1,1,1));
  const put=(g,fn)=>parts.push(paint(g,fn).applyMatrix4(F));
  put(new THREE.CylinderGeometry(1.5,1.2,15,12,6).rotateX(Math.PI/2),metal);                              // the fuselage, its nose toward -z
  put(new THREE.SphereGeometry(1.5,12,8,0,TAU,0,Math.PI/2).rotateX(-Math.PI/2).translate(0,0,-7.5),dent);   // the nose
  put(new THREE.SphereGeometry(1.05,10,8).scale(1,0.7,1.5).translate(0,0.95,-4.4),(x,y,z,nx,ny,nz,c)=>c.set(0x4a5c6a));   // the cockpit glass, cracked dark
  put(new THREE.BoxGeometry(13,0.3,3.2).translate(-7.3,-0.1,0.8).rotateY(-0.12),metal);                   // the left wing, whole
  put(new THREE.BoxGeometry(4.2,0.3,3.0).translate(4.6,-0.1,0.8).rotateY(0.25).rotateZ(-0.3),dent);      // the right wing, snapped off short
  put(new THREE.BoxGeometry(0.3,4.2,3.0).translate(0,2.4,6.6),metal);                                      // the tail fin
  put(new THREE.BoxGeometry(6.0,0.25,2.0).translate(0,0.6,6.9),dent);                                      // the tailplane
  for(const sx of [-1,1]) put(new THREE.CylinderGeometry(0.6,0.7,2.2,10).rotateX(Math.PI/2).translate(sx*4.4,-0.2,-1.2),dent);   // engines on the wings
  for(let b=0;b<2;b++) put(new THREE.BoxGeometry(0.16,3.0,0.1).rotateZ(b?2.2:-0.4).translate(-4.4,0,-2.5),(x,y,z,nx,ny,nz,c)=>c.set(0x6a6e74));   // a bent propeller
  for(let k=0;k<9;k++) put(new THREE.BoxGeometry(3.06,0.05,0.05).translate(0,0.4+Math.sin(k)*0.3,-6+k*1.5).rotateZ(k*0.7),(x,y,z,nx,ny,nz,c)=>c.set(0x5a6066));   // riveted seams
  const bm=new THREE.Mesh(merge(parts),matRock); bm.castShadow=true; bm.receiveShadow=true; scene.add(bm);
  // ice heaped round it, and the emblem painted on the fin: a sun inside a ring (the Concord's sign, docs/STORY.md)
  const mounds=[]; for(let k=0;k<9;k++){ const a=k/9*TAU, r=AR(3,6.5), x=ox+Math.sin(a)*r*1.4, z=oz+Math.cos(a)*r, s=AR(1.4,2.6); mounds.push(paint(new THREE.IcosahedronGeometry(s,1).scale(1,0.55,1).translate(x,getH(x,z)+0.1,z),(x2,y2,z2,nx,ny,nz,c)=>c.set(0xe6eff4).multiplyScalar(0.92+h3(Math.floor(x2*3),Math.floor(y2*3),Math.floor(z2*3))*0.1))); }
  const mm=new THREE.Mesh(merge(mounds),villageMat); mm.receiveShadow=true; scene.add(mm);
  const cv=document.createElement('canvas'); cv.width=cv.height=128; const g=cv.getContext('2d');
  g.clearRect(0,0,128,128); g.strokeStyle='#d8b040'; g.lineWidth=9; g.beginPath(); g.arc(64,64,52,0,TAU); g.stroke(); g.fillStyle='#e8c860'; g.beginPath(); g.arc(64,64,22,0,TAU); g.fill();
  for(let k=0;k<8;k++){ const a=k/8*TAU; g.lineWidth=6; g.beginPath(); g.moveTo(64+Math.sin(a)*28,64+Math.cos(a)*28); g.lineTo(64+Math.sin(a)*40,64+Math.cos(a)*40); g.stroke(); }
  const em=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(cv),transparent:true,side:THREE.DoubleSide}));
  em.position.set(0.17,2.6,6.6); em.rotation.y=Math.PI/2; em.applyMatrix4(F); em.matrixAutoUpdate=false; scene.add(em);
  addCol(ox,oz,3.4);
  // warmth still leaking from an engine: a few pale puffs rising
  const N=14, pos=new Float32Array(N*3), data=[], sp=(()=>{ const c=document.createElement('canvas'); c.width=c.height=32; const gg=c.getContext('2d'), r=gg.createRadialGradient(16,16,0,16,16,16); r.addColorStop(0,'rgba(255,255,255,.9)'); r.addColorStop(1,'rgba(255,255,255,0)'); gg.fillStyle=r; gg.fillRect(0,0,32,32); return new THREE.CanvasTexture(c); })();
  const eng=new THREE.Vector3(4.4,0.6,-1.2).applyMatrix4(F);
  for(let k=0;k<N;k++) data.push({age:k/N,sp:AR(0.8,1.3)});
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const st=new THREE.Points(sg,new THREE.PointsMaterial({size:2.2,map:sp,transparent:true,depthWrite:false,opacity:0.32,color:0xe8f0f6})); st.frustumCulled=false; scene.add(st);
  HOAR.steam={pts:st,data,pos,o:eng};
}
// the server tells you when the ice wall opens (1: it sinks with a rumble) and when you reach Rimehold (2)
function onNorthStep(k){
  if(k===1&&HOAR.wall&&!HOAR.open){ HOAR.opening=0.001; if(SND.ready) noiseHit({bus:'ui',filter:'lowpass',ff:160,dur:3.2,vol:0.4}); camShake=Math.max(camShake,0.6); }
  if(k>=2) UI_SFX.success();
}
function updateHoarfrost(dt){
  if(HOAR.wall){
    const open=northOpen(), W=HOAR.wall, y0=getH(PASS.x,PASS.ice);
    if(!open){ HOAR.open=false; HOAR.opening=0; W.visible=true; W.position.y=y0; }
    else if(HOAR.opening>0){ HOAR.opening=Math.min(1,HOAR.opening+dt/3.4); W.position.y=y0-HOAR.opening*18; W.rotation.z=Math.sin(HOAR.opening*40)*0.004*(1-HOAR.opening); if(HOAR.opening>=1){ HOAR.opening=0; HOAR.open=true; W.visible=false; } }
    else if(!HOAR.open){ HOAR.open=true; W.visible=false; }
  }
  const S=HOAR.steam;
  if(S&&Math.hypot(S.o.x-P.x,S.o.z-P.z)<160){ S.pts.visible=true; const d=S.data, p=S.pos;
    for(let i=0;i<d.length;i++){ const s=d[i]; s.age+=dt*0.16*s.sp; if(s.age>1) s.age-=1; p[i*3]=S.o.x+Math.sin(i*2.3)*0.6+s.age*1.4; p[i*3+1]=S.o.y+s.age*6.5; p[i*3+2]=S.o.z+Math.cos(i*1.7)*0.6; }
    S.pts.geometry.attributes.position.needsUpdate=true; } else if(S) S.pts.visible=false;
}
