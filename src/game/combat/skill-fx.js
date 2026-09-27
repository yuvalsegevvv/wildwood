//@ Visuals and sounds for the equippable skills: Arrow Rain, Meteor, Chain Lightning, Piercing Shot, Shield Bash, Charge
/* The server sends 'area' (a ground effect starting), 'aend' (it ended), 'chain' (lightning points) and 'proj'
   with kind 'pierce'. Everyone nearby sees them, whoever cast them. */
const AREA_FX=new Map(), BOLTS=[];
const meteorGeo=new THREE.IcosahedronGeometry(0.9,1), fallArrowGeo=new THREE.CylinderGeometry(0.02,0.02,0.9,4);
function onArea(id,kind,x,z,r,dur){
  const y=getH(x,z)+0.07, col=kind==='meteor'?0xff6a2a:0xf2cf5a;
  const fill=new THREE.Mesh(teleFill,fxMat(col,0.22)), edge=new THREE.Mesh(teleEdge,fxMat(col,0.85));
  fill.position.set(x,y,z); edge.position.set(x,y+0.01,z); edge.scale.setScalar(r); fill.scale.setScalar(kind==='meteor'?0.01:r); scene.add(fill,edge);
  const A={kind,x,z,r,dur,t:0,fill,edge,objs:[],spawn:0,y};
  if(kind==='meteor'){
    const m=new THREE.Mesh(meteorGeo,fxMat(0xff7a2a,0.95)); m.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.55,1),new THREE.MeshBasicMaterial({color:0xfff0b0})));
    scene.add(m); A.meteor=m;
    if(SND.ready){ const s=spatial(x,z,15,90); if(s) tone({bus:'ui',type:'sawtooth',freq:300,freq2:60,dur:dur,vol:0.06*s.gain,filter:'lowpass',ff:900,pan:s.pan}); }
  }
  AREA_FX.set(id,A);
}
function onAreaEnd(id){
  const A=AREA_FX.get(id); if(!A) return; AREA_FX.delete(id);
  for(const o of [A.fill,A.edge,A.meteor,...A.objs]) if(o){ scene.remove(o); if(o.material&&o.material!==matChar) o.material.dispose(); }
  if(A.kind==='meteor'){
    const c=new THREE.Vector3(A.x,A.y+0.5,A.z);
    spawnBurst(c,0xff7a2a,2.4); spawnBurst(c,0xfff0b0,1.2); spawnRingAt(A.x,A.y,A.z,A.r+1.5,0xffa040); spawnRingAt(A.x,A.y+0.4,A.z,A.r,0xffe0a0);
    cSfx.boom(c); if(SND.ready){ const s=spatial(A.x,A.z,15,100); if(s) tone({bus:'ui',type:'sine',freq:70,freq2:30,dur:0.9,vol:0.2*s.gain,pan:s.pan}); }
    if(Math.hypot(P.x-A.x,P.z-A.z)<30) camShake=Math.max(camShake,0.45);
  }
}
function onChain(pts){
  if(!pts||pts.length<2) return;
  for(let pass=0;pass<2;pass++){
    const v=[];
    for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1];
      for(let k=0;k<=6;k++){ const f=k/6, j=(k===0||k===6)?0:0.45; v.push(a[0]+(b[0]-a[0])*f+AR(-j,j),a[1]+(b[1]-a[1])*f+AR(-j,j),a[2]+(b[2]-a[2])*f+AR(-j,j)); } }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
    const line=new THREE.Line(g,new THREE.LineBasicMaterial({color:pass?0xffffff:0x8fd8ff,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false}));
    scene.add(line); BOLTS.push({o:line,t:0,life:0.3});
  }
  for(let i=1;i<pts.length;i++) spawnBurst(new THREE.Vector3(pts[i][0],pts[i][1],pts[i][2]),0x8fd8ff,0.45);
  if(SND.ready){ const s=spatial(pts[0][0],pts[0][2],12,80); if(s){ const n=SND.ctx.currentTime;
    for(let i=0;i<pts.length;i++){ noiseHit({bus:'ui',filter:'highpass',ff:3000,dur:0.08,vol:0.14*s.gain,pan:s.pan,when:n+i*0.05}); tone({bus:'ui',type:'square',freq:1400-i*120,freq2:300,dur:0.08,vol:0.03*s.gain,pan:s.pan,when:n+i*0.05}); } } }
}
function updateSkillFx(dt){
  for(const A of AREA_FX.values()){
    A.t+=dt; const k=Math.min(1,A.t/A.dur); A.edge.material.opacity=0.55+0.35*Math.sin(t*12);
    if(A.kind==='meteor'){ A.fill.scale.setScalar(Math.max(0.01,k*A.r)); const h=26*(1-k*k); A.meteor.position.set(A.x-6*(1-k*k),A.y+h,A.z-6*(1-k*k)); A.meteor.rotation.x+=dt*3;
      A.spawn-=dt; if(A.spawn<=0){ A.spawn=0.03; const e=new THREE.Mesh(emberGeo,emberMat); e.position.copy(A.meteor.position); e.scale.setScalar(3); scene.add(e); CB.fx.push({mesh:e,life:0.5,max:0.5,shrink:true}); } }
    else { // arrow rain: arrows keep falling inside the circle
      A.spawn-=dt;
      while(A.spawn<=0 && A.t<A.dur-0.3){ A.spawn+=0.045; const a=AR(0,TAU), r=Math.sqrt(Math.random())*A.r, ax=A.x+Math.sin(a)*r, az=A.z+Math.cos(a)*r;
        const m=new THREE.Mesh(fallArrowGeo,matChar); m.position.set(ax,getH(ax,az)+12,az); m.userData.g=getH(ax,az)+0.35; m.userData.v=AR(26,32); scene.add(m); A.objs.push(m); }
      for(let i=A.objs.length-1;i>=0;i--){ const m=A.objs[i]; if(m.userData.stuck!==undefined){ m.userData.stuck-=dt; if(m.userData.stuck<=0){ scene.remove(m); A.objs.splice(i,1); } continue; }
        m.position.y-=m.userData.v*dt; if(m.position.y<=m.userData.g){ m.position.y=m.userData.g; m.userData.stuck=0.6; } }
      if(SND.ready && Math.random()<dt*14){ const s=spatial(A.x,A.z,10,60); if(s) noiseHit({bus:'ui',filter:'highpass',ff:4200,dur:0.04,vol:0.06*s.gain,pan:s.pan}); }
    }
  }
  for(let i=BOLTS.length-1;i>=0;i--){ const b=BOLTS[i]; b.t+=dt; b.o.material.opacity=1-b.t/b.life; if(b.t>=b.life){ scene.remove(b.o); b.o.geometry.dispose(); b.o.material.dispose(); BOLTS.splice(i,1); } }
  if(CB.dash){ const d=CB.dash; d.t+=dt; const f=Math.min(1,d.t/d.dur), e=f*(2-f); P.x=d.fx+(d.tx-d.fx)*e; P.z=d.fz+(d.tz-d.fz)*e; P.y=Math.max(P.y,getH(P.x,P.z)); P.vx=P.vz=0; if(f>=1) CB.dash=null; }
}
// Charge: dash to the target (or 8 m ahead) right away; the server lands the blow
function startCharge(T){
  let tx,tz;
  if(T&&!T.dead&&Math.hypot(T.x-P.x,T.z-P.z)<=SKILLS.charge.range+2){ const dx=T.x-P.x, dz=T.z-P.z, d=Math.hypot(dx,dz)||1, o=T.T.rad*T.s+0.9; tx=T.x-dx/d*o; tz=T.z-dz/d*o; }
  else { tx=P.x-Math.sin(P.face)*8; tz=P.z-Math.cos(P.face)*8; }
  const lim=HALF-14; CB.dash={fx:P.x,fz:P.z,tx:clamp(tx,-lim,lim),tz:clamp(tz,-lim,lim),t:0,dur:0.26};
  if(SND.ready){ noiseHit({bus:'ui',filter:'bandpass',ff:500,ff2:1500,dur:0.3,vol:0.12}); }
}
