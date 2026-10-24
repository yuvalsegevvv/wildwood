//@ Cave props of methods A and B: the carved mural wall with its five gold shards, and the geodes (rock shells with crystals in the element they ask for)
/* Agent map. Doc: docs/CAVE.md section 15. Kit and conventions: method-props.js. Test: tools/client-smoke.js (the cave case).
   exports: caveMpA(X) (mural), caveMpB(X) (geodes), caveMpCrystals(col, [[yaw, tilt, length, radius]...]) -> painted parts (also used by method D).
   A: a stone frame with a painted mural that fills as you hold pieces (a canvas, redrawn on change), five gem sockets under it, a golden beam over the wall when all five are held (touch it); the shards float, glow and spark only within `light` of you
      (the rule is the server's), each on a little cairn, and burst when you take one.
   B: a rock shell with a crystal cluster in the first element's colour (a second, taller crystal in the second colour for a chain), a halo and a label pill with the element(s): sealed = crystals low, steady halo; charged = crystals high,
      fast halo in the colour of the NEXT element and orbiting sparks; cracked = the shell sinks, crystals grey and dull, no label. */
function caveMpA(X){
  const MP=CAVE_MP, p=X.MD('A').p, w=X.A.A.wall, [wx,wz]=X.out(w,0.25), G=X.at(wx,wz), rd=X.rd; G.rotation.y=Math.atan2(w.nx||0,w.nz||1);
  const st=caveMpRockC(0x6a665c,0.35), stD=caveMpRockC(0x45423b,0.3), B=(x,y,z)=>new THREE.BoxGeometry(x,y,z), parts=[];
  parts.push(caveMpPart(B(3.7,0.34,1.0),st,0,0.17,0.1), caveMpPart(B(0.34,2.8,0.55),st,-1.62,1.5,0.05), caveMpPart(B(0.34,2.8,0.55),st,1.62,1.5,0.05), caveMpPart(B(3.9,0.36,0.6),st,0,3.0,0.05), caveMpPart(B(3.2,0.14,0.62),stD,0,2.8,0.06),
    caveMpPart(B(2.95,2.1,0.3),stD,0,1.58,-0.12), caveMpPart(B(0.5,0.2,0.62),st,-1.62,3.25,0.05), caveMpPart(B(0.5,0.2,0.62),st,1.62,3.25,0.05));
  for(const [x,y,z,r] of [[-2.0,0.18,0.7,0.34],[1.9,0.14,0.8,0.28],[2.2,0.2,0.3,0.24]]) parts.push(caveMpPart(caveMpRock(r,r*0.6,r,0.5,rd),st,x,y,z));   // rubble at the foot
  for(let i=0;i<5;i++) parts.push(caveMpPart(new THREE.OctahedronGeometry(0.12),caveMpRockC(0x24221e,0.1),(i-2)*0.44,0.4,0.4,{sy:0.8}));   // the five sockets, dark
  G.add(X.mesh(parts));
  const cv=document.createElement('canvas'); cv.width=256; cv.height=176; const tex=new THREE.CanvasTexture(cv), pm=new THREE.MeshBasicMaterial({map:tex}), pg=new THREE.PlaneGeometry(2.75,1.9); MP.texs.push(tex); MP.mats.push(pm); MP.geos.push(pg);
  const panel=new THREE.Mesh(pg,pm); panel.position.set(0,1.58,0.05); G.add(panel);
  const halo=X.halo(0xffc860,6,0.0), beam=X.beam(0xffd27a,5,0.5,0.0); halo.position.set(0,1.6,0.5); beam.position.set(0,3.2,0.1); G.add(halo,beam);
  const gems=[0,1,2,3,4].map(i=>{ const m=new THREE.Mesh(new THREE.OctahedronGeometry(0.16),X.addMat({color:0xffd27a,opacity:1})); MP.geos.push(m.geometry); m.position.set((i-2)*0.44,0.5,0.4); m.scale.y=1.3; m.visible=false; G.add(m); return m; });
  const draw=got=>{ const c=cv.getContext('2d'), ox=128, oy=88; c.fillStyle='#262522'; c.fillRect(0,0,256,176);
    for(let i=0;i<70;i++){ c.fillStyle=i%2?'#2f2d29':'#1f1e1b'; c.fillRect(h3(i,1,2)*250,h3(i,3,4)*170,3+h3(i,5,6)*7,2); }
    c.strokeStyle='#5c574a'; c.lineWidth=6; c.strokeRect(6,6,244,164); c.strokeStyle='#3a372f'; c.lineWidth=2; c.strokeRect(16,16,224,144); c.shadowColor='#ffb040';
    for(let i=0;i<5;i++){ const on=got>>i&1, a=i/5*Math.PI*2-Math.PI/2, dx=Math.cos(a), dy=Math.sin(a)*0.82, px=-dy, py=dx, tx=ox+dx*70, ty=oy+dy*70, mx=ox+dx*40, my=oy+dy*40;
      c.beginPath(); c.moveTo(ox+dx*16,oy+dy*16); c.quadraticCurveTo(mx+px*20,my+py*20,tx,ty); c.quadraticCurveTo(mx-px*20,my-py*20,ox+dx*16,oy+dy*16);
      if(on){ c.shadowBlur=16; c.fillStyle='#ffd27a'; c.fill(); c.shadowBlur=0; c.fillStyle='#fff3c8'; c.beginPath(); c.arc(tx,ty,4,0,7); c.fill(); }
      else { c.setLineDash([6,5]); c.strokeStyle='#5a5546'; c.lineWidth=3; c.stroke(); c.setLineDash([]); } }
    c.shadowBlur=got===31?20:0; c.fillStyle=got===31?'#fff0b8':'#48443a'; c.beginPath(); c.arc(ox,oy,14,0,7); c.fill(); c.shadowBlur=0; tex.needsUpdate=true; };
  let last=-1;
  const pieces=X.A.A.pieces.map((q,i)=>{   // a shard on a cairn, floating in a glow
    const o=X.at(q.x,q.z), fl=new THREE.Group(); o.add(fl); fl.position.y=1.0;
    const cp=[0,1,2].map(k=>caveMpPart(caveMpRock(0.3-k*0.05,0.16,0.28,0.4,rd),caveMpRockC(0x59554c,0.3),Math.cos(k*2.1)*0.26,0.1,Math.sin(k*2.1)*0.26)); o.add(X.mesh(cp));
    const gold=(x,y,z,nx,ny,nz,c)=>{ c.set(Math.abs(Math.sin(y*16))<0.18?0x9a6a1c:0xe0aa44).multiplyScalar(0.7+0.3*(nz*0.5+0.5)); };
    fl.add(X.mesh([caveMpPart(new THREE.CylinderGeometry(1,1,1,5),gold,0,0,0,{rx:Math.PI/2,sx:0.3,sy:0.09,sz:0.4,ry:i}),caveMpPart(new THREE.BoxGeometry(0.2,0.04,0.02),(x,y,z,nx,ny,nz,c)=>c.set(0xfff0b0),0,0.03,0.07,{rz:0.5})]));
    const h=X.halo(0xffc860,1.9,0.6); fl.add(h); const b=X.beam(0xffd27a,3.2,0.14,0.4); b.position.y=-0.9; fl.add(b); o.userData={h,b,fl,x:X.R.ox+q.x,z:X.R.oz+q.z,t:0,had:false}; return o; });
  X.add((s,dt,tt)=>{
    const got=s.a|0, n=(got&1)+(got>>1&1)+(got>>2&1)+(got>>3&1)+(got>>4&1), full=got===31;
    if(last!==got){ if(last>=0&&got!==0&&X.fx) fxpFlare(G.position.x,G.position.y+1.6,G.position.z,0xffd27a,2.2); last=got; draw(got); gems.forEach((m,i)=>{ m.visible=!!(got>>i&1); }); }
    halo.material.opacity=full?0.55+0.25*Math.sin(tt*4):0.05+0.07*n; beam.visible=full; beam.material.opacity=0.35+0.15*Math.sin(tt*4); gems.forEach((m,i)=>{ m.rotation.y=tt*1.5+i; });
    pieces.forEach((o,i)=>{ const u=o.userData, near=Math.hypot(P.x-u.x,P.z-u.z)<p.light, has=!!(got>>i&1);
      if(has&&!u.had&&X.fx) fxpSparks(u.x,o.position.y+1.0,u.z,0xffd27a,12,3,{up:1.5,size:0.2});
      u.had=has; o.visible=near&&!has; if(!o.visible) return;
      u.fl.rotation.y+=dt*1.8; u.fl.position.y=1.0+0.1*Math.sin(tt*2+i); u.h.material.opacity=0.45+0.2*Math.sin(tt*3+i); u.t+=dt;
      if(X.fx&&u.t>0.35){ u.t=0; fxpAdd(u.x+AR(-0.3,0.3),o.position.y+AR(0.6,1.6),u.z+AR(-0.3,0.3),0,AR(0.2,0.5),0,0xffd27a,0.12,AR(0.6,1),{white:0.5,grow:0.2,a:0.9}); } }); });
}
function caveMpCrystals(col,list){   // hexagonal prisms with pointed tips, tilted out from their foot ([yaw, tilt, length, radius] each), painted dark at the root and bright at the tip
  const C=new THREE.Color(col), lo=C.clone().multiplyScalar(0.35).getHex(), hi=C.clone().lerp(new THREE.Color(0xffffff),0.35).getHex(), parts=[];
  for(const [a,t,len,r] of list){ const gr=caveMpGradC(lo,hi,0,len), o={rz:t,ry:a};
    parts.push(caveMpPart(new THREE.CylinderGeometry(r,r*1.05,len*0.65,6).translate(0,len*0.325,0),gr,0,0,0,o),caveMpPart(new THREE.ConeGeometry(r,len*0.35,6).translate(0,len*0.825,0),gr,0,0,0,o)); }
  return parts;
}
function caveMpB(X){
  const need=X.MD('B').p.need[X.R.n]||[], rd=X.rd, hex=e=>parseInt(ELEMS[e].col.slice(1),16);
  X.A.B.geodes.forEach((q,i)=>{
    const w=need[i], els=(Array.isArray(w)?w:[w]).filter(e=>ELEMS[e]); if(!els.length) els.push('basic');
    const c0=hex(els[0]), c1=hex(els[els.length-1]), [x,z]=X.out(q,0.7), G=X.at(x,z), chain=els.length>1;
    const vein=(xx,y,z2,nx,ny,nz,c)=>{ c.set(0x4a443c).multiplyScalar(0.55+0.45*(ny*0.5+0.5)); if(h3(Math.floor(xx*2.6),Math.floor(y*2.6),Math.floor(z2*2.6))>0.76) c.lerp(X.col.setHex(c0),0.6); };
    const shell=X.mesh([caveMpPart(caveMpRock(1.0,0.78,0.92,0.45,rd),vein,0,0.55,0)]); G.add(shell);
    const main=caveMpCrystals(c0,[[0,0.0,1.25,0.13],[1.0,0.35,0.9,0.1],[2.2,0.4,0.8,0.1],[3.3,0.3,0.85,0.1],[4.4,0.45,0.7,0.09],[5.5,0.35,0.75,0.09]]);
    const cr=X.mesh(main), crDim=new THREE.Mesh(cr.geometry,X.vcDim); const cg=new THREE.Group(); cg.position.y=1.0; cg.add(cr,crDim); G.add(cg);
    let sec=null; if(chain){ sec=X.mesh(caveMpCrystals(c1,[[0.6,0.25,1.1,0.12]])); sec.position.set(0.55,0.95,0.35); G.add(sec); }
    const halo=X.halo(c0,3.6,0.4); halo.position.y=1.5; G.add(halo); const lb=X.text(2.7); lb.set(els.map(e=>ELEMS[e].name).join(' → '),ELEMS[els[0]].col); lb.s.position.y=2.9; G.add(lb.s);
    let last=0, t=0;
    X.add((s,dt,tt)=>{ const st=s.b[i]|0;
      if(st!==last){ if(X.fx&&X.near(G,40)) { fxpFlare(G.position.x,G.position.y+1.3,G.position.z,st===1?0xffffff:c1,st===1?3:2); if(st===1) fxpSparks(G.position.x,G.position.y+1.2,G.position.z,c0,10,3.5,{up:2}); } last=st; }
      const k=st===1?1:st===2?0.95+0.08*Math.sin(tt*9):0.5; cg.scale.setScalar(k); cr.visible=st!==1; crDim.visible=st===1; shell.scale.y=st===1?0.7:1; if(sec){ sec.visible=st!==1; sec.scale.setScalar(st===2?1.1:0.8); }
      halo.visible=st!==1; halo.material.color.setHex(st===2?c1:c0); halo.material.opacity=st===2?0.8+0.2*Math.sin(tt*9):0.35+0.1*Math.sin(tt*2+i); halo.scale.setScalar(st===2?4.6:3.6);
      lb.s.visible=st!==1&&X.near(G,45); lb.s.position.y=2.9+0.06*Math.sin(tt*2+i);
      if(st===2&&X.fx&&X.near(G,30)){ t+=dt; if(t>0.12){ t=0; const a=tt*4+i; fxpAdd(G.position.x+Math.cos(a)*1.0,G.position.y+1.1+0.5*Math.sin(tt*3),G.position.z+Math.sin(a)*1.0,0,0.2,0,c1,0.16,0.5,{white:0.4,grow:0.3,a:0.9}); } } });
  });
}
