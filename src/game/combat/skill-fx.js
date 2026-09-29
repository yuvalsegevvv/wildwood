//@ Visuals and sounds for the equippable skills: Arrow Rain, Meteor, Chain Lightning, Piercing Shot, Shield Bash, Charge, and every skill with generic effects (fx: the boss skills)
/* The server sends 'area' (a ground effect starting), 'aend' (it ended), 'chain' (lightning points), 'beam' (a line of light) and 'proj'
   with kind 'pierce'. Everyone nearby sees them, whoever cast them. A skill with generic effects (fx in its row) is drawn from that row
   in the colour of its element: fxVisuals for the swing, then the same events as above. */
const elCol=el=>parseInt(ELEMS[ELEMS[el]?el:'basic'].col.slice(1),16);
const GEN_PROJ={spore:0x9adf6a,thorn:0xa8834a,ember:0xff8a3a,spirit:0xfff0a0,frost:0x9fd8ff};   // the colours of the generic projectiles
const AREA_FX=new Map(), BOLTS=[];
const meteorGeo=new THREE.IcosahedronGeometry(0.9,1), fallArrowGeo=new THREE.CylinderGeometry(0.02,0.02,0.9,4);
const AREA_COL={meteor:0xff6a2a,rain:0xf2cf5a,hail:0xf2cf5a,blizzard:0x9fd8ff,storm:0xdfe6ee};
const snowGeo=new THREE.OctahedronGeometry(0.07,0), bladeGeo=new THREE.BoxGeometry(0.08,0.05,1.1);
function onArea(id,kind,x,z,r,dur,owner,el,flags){
  const zone=kind==='zone', once=zone&&(flags&1), y=getH(x,z)+0.07, col=zone?elCol(el):(AREA_COL[kind]||0xf2cf5a);
  const fill=new THREE.Mesh(teleFill,fxMat(col,0.22)), edge=new THREE.Mesh(teleEdge,fxMat(col,0.85));
  fill.position.set(x,y,z); edge.position.set(x,y+0.01,z); edge.scale.setScalar(r); fill.scale.setScalar(kind==='meteor'||once?0.01:r); scene.add(fill,edge);
  const A={kind,x,z,r,dur,t:0,fill,edge,objs:[],spawn:0,y,owner,col,once:!!once,follow:zone&&!!(flags&2)};
  if(kind==='storm'){ fill.material.opacity=0.12; const ring=new THREE.Group(); for(let i=0;i<6;i++){ const b=new THREE.Mesh(bladeGeo,matChar); const a=i/6*TAU; b.position.set(Math.sin(a)*r*0.75,1,Math.cos(a)*r*0.75); b.rotation.y=a; ring.add(b); } scene.add(ring); A.ring=ring; A.objs.push(ring); }
  if(kind==='meteor'){
    const m=new THREE.Mesh(meteorGeo,fxMat(0xff7a2a,0.95)); m.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.55,1),new THREE.MeshBasicMaterial({color:0xfff0b0})));
    scene.add(m); A.meteor=m;
    if(SND.ready){ const s=spatial(x,z,15,90); if(s) tone({bus:'ui',type:'sawtooth',freq:300,freq2:60,dur:dur,vol:0.06*s.gain,filter:'lowpass',ff:900,pan:s.pan}); }
  }
  AREA_FX.set(id,A);
}
function onAreaEnd(id){
  const A=AREA_FX.get(id); if(!A) return; AREA_FX.delete(id);
  for(const o of [A.fill,A.edge,A.meteor,...A.objs]) if(o){ scene.remove(o); if(o.material&&o.material!==matChar&&o.material.dispose) o.material.dispose(); }
  if(A.once){   // a zone that hits once, at the end (Demon Gate)
    const c=new THREE.Vector3(A.x,A.y+0.5,A.z);
    spawnBurst(c,A.col,2.2); spawnBurst(c,0xffffff,1); spawnRingAt(A.x,A.y,A.z,A.r+1.5,A.col); spawnRingAt(A.x,A.y+0.4,A.z,A.r,0xffffff);
    cSfx.boom(c); if(Math.hypot(P.x-A.x,P.z-A.z)<30) camShake=Math.max(camShake,0.4);
  }
  if(A.kind==='meteor'){
    const c=new THREE.Vector3(A.x,A.y+0.5,A.z);
    spawnBurst(c,0xff7a2a,2.4); spawnBurst(c,0xfff0b0,1.2); spawnRingAt(A.x,A.y,A.z,A.r+1.5,0xffa040); spawnRingAt(A.x,A.y+0.4,A.z,A.r,0xffe0a0);
    cSfx.boom(c); if(SND.ready){ const s=spatial(A.x,A.z,15,100); if(s) tone({bus:'ui',type:'sine',freq:70,freq2:30,dur:0.9,vol:0.2*s.gain,pan:s.pan}); }
    if(Math.hypot(P.x-A.x,P.z-A.z)<30) camShake=Math.max(camShake,0.45);
  }
}
function onChain(pts,el){
  if(!pts||pts.length<2) return;
  const col=el&&el!=='basic'?elCol(el):0x8fd8ff;
  for(let pass=0;pass<2;pass++){
    const v=[];
    for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1];
      for(let k=0;k<=6;k++){ const f=k/6, j=(k===0||k===6)?0:0.45; v.push(a[0]+(b[0]-a[0])*f+AR(-j,j),a[1]+(b[1]-a[1])*f+AR(-j,j),a[2]+(b[2]-a[2])*f+AR(-j,j)); } }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
    const line=new THREE.Line(g,new THREE.LineBasicMaterial({color:pass?0xffffff:col,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false}));
    scene.add(line); BOLTS.push({o:line,t:0,life:0.3});
  }
  for(let i=1;i<pts.length;i++) spawnBurst(new THREE.Vector3(pts[i][0],pts[i][1],pts[i][2]),col,0.45);
  if(SND.ready){ const s=spatial(pts[0][0],pts[0][2],12,80); if(s){ const n=SND.ctx.currentTime;
    for(let i=0;i<pts.length;i++){ noiseHit({bus:'ui',filter:'highpass',ff:3000,dur:0.08,vol:0.14*s.gain,pan:s.pan,when:n+i*0.05}); tone({bus:'ui',type:'square',freq:1400-i*120,freq2:300,dur:0.08,vol:0.03*s.gain,pan:s.pan,when:n+i*0.05}); } } }
}
// a line of light (server event 'beam'): a bright core and a coloured glow that fade in a third of a second
function onBeam(x1,y1,z1,x2,y2,z2,el,w){
  const len=Math.hypot(x2-x1,y2-y1,z2-z1)||1, col=elCol(el);
  for(const [rad,c,op] of [[0.16*(w||1),0xffffff,0.95],[0.42*(w||1),col,0.5]]){
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,len,10,1,true).rotateX(Math.PI/2),fxMat(c,op));
    mesh.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2); mesh.lookAt(x2,y2,z2); scene.add(mesh); BOLTS.push({o:mesh,t:0,life:0.35});
  }
  spawnBurst(new THREE.Vector3(x1,y1,z1),col,0.5); spawnBurst(new THREE.Vector3(x2,y2,z2),col,0.8);
  if(SND.ready){ const s=spatial(x1,z1,12,80); if(s){ tone({bus:'ui',type:'sawtooth',freq:900,freq2:200,dur:0.35,vol:0.05*s.gain,filter:'lowpass',ff:2500,pan:s.pan}); noiseHit({bus:'ui',filter:'highpass',ff:2500,dur:0.25,vol:0.08*s.gain,pan:s.pan}); } }
}
// the swing of a skill with generic effects: rings, arcs, a flare and a sound, in the colour of its element
function fxVisuals(s,x,y,z,face,sc,mine){
  const f=s.fx, col=elCol(elOf(s)), g=getH(x,z);
  if(f.buff) return;   // onBuff draws the aura
  if(f.dash){ spawnRingAt(x,g,z,f.ring?f.ring.r*0.7:3.2,col); spawnBurst(new THREE.Vector3(x,y+0.3,z),col,1.4); if(mine){ cSfx.boom({x,z}); camShake=Math.max(camShake,0.35); } }
  if(f.ring){ const R=f.ring, pull=R.kb<0; for(let i=0;i<3;i++) spawnRingAt(x,g,z,R.r*(0.5+i*0.25),i?col:0xffffff,pull);
    if(mine||Math.hypot(P.x-x,P.z-z)<25) cSfx.nova(); }
  if(f.cone){ const C=f.cone, n=C.hits||1; for(let h=0;h<n;h++) spawnArcAt(x,y+(0.8+0.22*h)*sc,z,face+(h-(n-1)/2)*0.28,col,C.r/2.6);
    if(mine) (C.r>6?cSfx.whoosh:cSfx.swing)(false); }
  if(f.proj||f.zone||f.beam||f.chain){ spawnRingAt(x-Math.sin(face)*0.6,y+1.1*sc,z-Math.cos(face)*0.6,1.3,col); if(mine) (f.proj&&f.proj.kind!=='spirit'?cSfx.draw:cSfx.charge)(true); }
}
function updateZoneFx(A,dt,k){   // a generic zone: motes of its element rising inside the circle (and following the caster if it does)
  if(A.follow){ const o=A.owner===NET.pid?P:REMOTES.get(A.owner); if(o){ A.x=o.x; A.z=o.z; A.y=getH(A.x,A.z)+0.07; A.fill.position.set(A.x,A.y,A.z); A.edge.position.set(A.x,A.y+0.01,A.z); } }
  if(A.once) A.fill.scale.setScalar(Math.max(0.01,k*A.r));
  A.spawn-=dt;
  while(A.spawn<=0&&A.t<A.dur-0.2){ A.spawn+=A.once?0.03:0.02; const a=AR(0,TAU), r=Math.sqrt(Math.random())*A.r, ax=A.x+Math.sin(a)*r, az=A.z+Math.cos(a)*r;
    const m=new THREE.Mesh(snowGeo,fxMat(A.col,0.9)); m.position.set(ax,getH(ax,az)+0.1,az); m.scale.setScalar(A.once?1.6:2.2); m.userData.v=AR(2,5); m.userData.life=AR(0.5,0.9); scene.add(m); A.objs.push(m); }
  for(let i=A.objs.length-1;i>=0;i--){ const m=A.objs[i]; m.userData.life-=dt; m.position.y+=m.userData.v*dt; m.rotation.y+=dt*5; m.scale.multiplyScalar(1-dt*1.5);
    if(m.userData.life<=0){ scene.remove(m); m.material.dispose(); A.objs.splice(i,1); } }
  if(SND.ready&&Math.random()<dt*5){ const s=spatial(A.x,A.z,10,60); if(s) noiseHit({bus:'ui',filter:'bandpass',ff:800,dur:0.3,vol:0.05*s.gain,pan:s.pan}); }
}
function updateSkillFx(dt){
  for(const A of AREA_FX.values()){
    A.t+=dt; const k=Math.min(1,A.t/A.dur); A.edge.material.opacity=0.55+0.35*Math.sin(t*12);
    if(A.kind==='zone'){ updateZoneFx(A,dt,k); continue; }
    if(A.kind==='storm'){ // follows whoever cast it
      const o=A.owner===NET.pid?P:REMOTES.get(A.owner); if(o){ A.x=o.x; A.z=o.z; A.y=getH(A.x,A.z)+0.07; }
      A.fill.position.set(A.x,A.y,A.z); A.edge.position.set(A.x,A.y+0.01,A.z); A.ring.position.set(A.x,A.y,A.z); A.ring.rotation.y+=dt*14;
      if(SND.ready&&Math.random()<dt*5){ const s=spatial(A.x,A.z,10,60); if(s) noiseHit({bus:'ui',filter:'bandpass',ff:1600,ff2:3200,dur:0.18,vol:0.08*s.gain,pan:s.pan}); }
      continue;
    }
    if(A.kind==='blizzard'){ // snow and ice falling, drifting sideways
      A.spawn-=dt;
      while(A.spawn<=0&&A.t<A.dur-0.3){ A.spawn+=0.012; const a=AR(0,TAU), r=Math.sqrt(Math.random())*A.r, ax=A.x+Math.sin(a)*r, az=A.z+Math.cos(a)*r;
        const m=new THREE.Mesh(snowGeo,fxMat(0xeef8ff,0.9)); m.position.set(ax,getH(ax,az)+AR(6,10),az); m.userData.g=getH(ax,az)+0.1; m.userData.v=AR(7,11); scene.add(m); A.objs.push(m); }
      for(let i=A.objs.length-1;i>=0;i--){ const m=A.objs[i]; m.position.y-=m.userData.v*dt; m.position.x+=dt*2.5; m.rotation.x+=dt*4; if(m.position.y<=m.userData.g){ scene.remove(m); m.material.dispose(); A.objs.splice(i,1); } }
      if(SND.ready&&Math.random()<dt*6){ const s=spatial(A.x,A.z,12,70); if(s) noiseHit({bus:'ui',filter:'bandpass',ff:900,dur:0.5,vol:0.05*s.gain,pan:s.pan}); }
      continue;
    }
    if(A.kind==='meteor'){ A.fill.scale.setScalar(Math.max(0.01,k*A.r)); const h=26*(1-k*k); A.meteor.position.set(A.x-6*(1-k*k),A.y+h,A.z-6*(1-k*k)); A.meteor.rotation.x+=dt*3;
      A.spawn-=dt; if(A.spawn<=0){ A.spawn=0.03; const e=new THREE.Mesh(emberGeo,emberMat); e.position.copy(A.meteor.position); e.scale.setScalar(3); scene.add(e); CB.fx.push({mesh:e,life:0.5,max:0.5,shrink:true}); } }
    else { // arrow rain: arrows keep falling inside the circle
      A.spawn-=dt;
      while(A.spawn<=0 && A.t<A.dur-0.3){ A.spawn+=A.kind==='hail'?0.018:0.045; const a=AR(0,TAU), r=Math.sqrt(Math.random())*A.r, ax=A.x+Math.sin(a)*r, az=A.z+Math.cos(a)*r;
        const m=new THREE.Mesh(fallArrowGeo,matChar); m.position.set(ax,getH(ax,az)+12,az); m.userData.g=getH(ax,az)+0.35; m.userData.v=AR(26,32); scene.add(m); A.objs.push(m); }
      for(let i=A.objs.length-1;i>=0;i--){ const m=A.objs[i]; if(m.userData.stuck!==undefined){ m.userData.stuck-=dt; if(m.userData.stuck<=0){ scene.remove(m); A.objs.splice(i,1); } continue; }
        m.position.y-=m.userData.v*dt; if(m.position.y<=m.userData.g){ m.position.y=m.userData.g; m.userData.stuck=0.6; } }
      if(SND.ready && Math.random()<dt*14){ const s=spatial(A.x,A.z,10,60); if(s) noiseHit({bus:'ui',filter:'highpass',ff:4200,dur:0.04,vol:0.06*s.gain,pan:s.pan}); }
    }
  }
  for(let i=BOLTS.length-1;i>=0;i--){ const b=BOLTS[i]; b.t+=dt; b.o.material.opacity=1-b.t/b.life; if(b.t>=b.life){ scene.remove(b.o); b.o.geometry.dispose(); b.o.material.dispose(); BOLTS.splice(i,1); } }
  updateAuras();
  if(CB.dash){ const d=CB.dash; d.t+=dt; const f=Math.min(1,d.t/d.dur), e=f*(2-f); P.x=d.fx+(d.tx-d.fx)*e; P.z=d.fz+(d.tz-d.fz)*e; P.y=Math.max(P.y,getH(P.x,P.z)); P.vx=P.vz=0; if(f>=1) CB.dash=null; }
}
// Charge: dash to the target (or 8 m ahead) right away; the server lands the blow
function startCharge(T,range,ahead){   // range / ahead: the skill's reach and how far it goes with no target (Charge by default)
  let tx,tz; range=range||SKILLS.charge.range; ahead=ahead||8;
  if(T&&!T.dead&&Math.hypot(T.x-P.x,T.z-P.z)<=range+2){ const dx=T.x-P.x, dz=T.z-P.z, d=Math.hypot(dx,dz)||1, o=T.T.rad*T.s+0.9; tx=T.x-dx/d*o; tz=T.z-dz/d*o; }
  else { tx=P.x-Math.sin(P.face)*ahead; tz=P.z-Math.cos(P.face)*ahead; }
  CB.dash={fx:P.x,fz:P.z,tx:clamp(tx,WX0+14,WX1-14),tz:clamp(tz,WZ0+14,WZ1-14),t:0,dur:0.26};
  if(SND.ready){ noiseHit({bus:'ui',filter:'bandpass',ff:500,ff2:1500,dur:0.3,vol:0.12}); }
}
// buffs (Berserk, Hunter's Focus, Arcane Surge): a glowing ring at the feet for as long as they last
const AURAS=new Map(), AURA_COL={berserk:0xff4a3a,focus:0x9fe08a,surge:0xb08aff};
const auraGeo=new THREE.RingGeometry(0.75,1,40).rotateX(-Math.PI/2);
function onBuff(pid,id,dur){
  const s=SKILLS[id]; if(!s) return;
  if(pid===NET.pid){ CB.buff={id,until:performance.now()+dur*1000,cd:s.buff.cd}; if(s.buff.reset) CB.cd.skill=0; toast(s.name+'! '+dur+' seconds','good'); }
  const old=AURAS.get(pid); if(old){ scene.remove(old.mesh); old.mesh.material.dispose(); }
  const mesh=new THREE.Mesh(auraGeo,fxMat(AURA_COL[id]||(s.buff.el?elCol(s.buff.el):0xffffff),0.7)); scene.add(mesh);
  AURAS.set(pid,{mesh,until:performance.now()+dur*1000});
}
function updateAuras(){
  const now=performance.now();
  for(const [pid,A] of AURAS){
    const o=pid===NET.pid?P:REMOTES.get(pid);
    if(!o||now>A.until){ scene.remove(A.mesh); A.mesh.material.dispose(); AURAS.delete(pid); continue; }
    A.mesh.position.set(o.x,(o.y||getH(o.x,o.z))+0.08,o.z); A.mesh.scale.setScalar(1.1+0.12*Math.sin(now/120)); A.mesh.material.opacity=0.45+0.3*Math.sin(now/90);
  }
}
