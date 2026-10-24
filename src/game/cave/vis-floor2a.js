//@ Drawings of five Deep Cave floor-2 set skills: Tansy's Threshing Floor, Sazanka's Shadow Step, Torgeir's Shield-Wall, Corvin's Lighthouse and Sabir's Cut and Run, in their outfits' colours and motifs
/* Agent map. Plan: docs/CAVE.md section 16 (C5). Built on the plumbing in vis-floor1.js and the sets' look engine (game/skillsets/looks.js: SSL.looks.<set>, sslDecal, sslBurst, sslLine, sslRingMotes, sslSector, ssEmit, ssPart, sslFlash);
   a look that failed to define is skipped (the pool effects still draw). Palettes: Tansy wheat 0xe0b95a / 0xf2d98a, Sazanka ink 0x1b1f2a + violet 0x7a6cf0 + white-blue 0xdfe8ff, Torgeir slate 0x3f5668 + bone 0xe3dccb + lichen 0x7d8c5a,
   Corvin brass 0xc9a13a + lamp white 0xfff1c9, Sabir crimson 0xa8322a + ember 0xff8a3a. Test: client-smoke.
   Threshing Floor: the field closes in (a wheat ring and chaff moving inward), a flail lands, then a twine ring contracts for the 4 seconds in which a kill refunds charge.
   Shadow Step: ink and crossed crescents where you vanish (wind-up, at the press), an ink streak and a landing, then crescents orbit you for the 2 seconds in which every hit counts from behind.
   Shield-Wall: slabs rise in an arc in front of you for the 6 seconds, the ground behind the line (where allies are covered) is tinted lichen-green, a stone ring goes out with each taunt.
   Lighthouse: the zone event (claimed through CVV_AREAS) becomes a brass lantern with a beam that sweeps the circle; monsters flare as the beam crosses them (the Glare).
   Cut and Run: a flame cut, then (cvfx 'retreat') an ember streak back along the dash and a crimson guard shimmer for its 3 seconds. */
const cvvSL=id=>SSL.looks[id]||null;
CVG.can=new THREE.CylinderGeometry(1,1,1,8).translate(0,0.5,0); CVG.half=new THREE.CircleGeometry(1,32,0,Math.PI).rotateX(-Math.PI/2); CVG.boxEdges=new THREE.EdgesGeometry(CVG.box);
{ const w=new THREE.CircleGeometry(1,14,0,0.42).rotateX(-Math.PI/2), n=w.attributes.position.count, c=new Float32Array(n*3); for(let i=0;i<n;i++){ const v=i===0?1:0.08; c[i*3]=c[i*3+1]=c[i*3+2]=v; } w.setAttribute('color',new THREE.BufferAttribute(c,3)); CVG.wedge=w; }   // a beam of light: bright at the lamp, dim at the rim
// ---- Tansy: Threshing Floor ----
caveVisDef('threshing',{cast(p,ab){
  const L=cvvSL('tansy'), pid=cvvPid(p), x=p.x, z=p.z, y=cvvY(p), R=ab.fx.cvstrike.r, hot=L?L.hot:0xf2d98a, hot2=L?L.hot2:0xd9754a;
  if(L){ sslDecal(L,x,z,R,{life:1.0,r0:1,inward:true,spin:-1.4,op:0.8}); sslRingMotes(L,x,z,R,46,{},true); }   // the field closes in
  spawnRingAt(x,y,z,R,hot2,true); spawnRingAt(x,y+0.3,z,R*0.6,hot,true);
  let n=0; for(const m of MONS){ if(m.dead||!m.g.visible||Math.hypot(m.x-x,m.z-z)>R+m.T.rad*m.s) continue; if(L) sslBurst(L,m.x,m.y+m.T.height*m.s*0.5,m.z,4,3); if(++n>=8) break; }   // chaff flies off everything it drags
  fxpLater(0.28,()=>{ const o=cvvWho(pid); if(!o) return; const ox=o.x, oz=o.z, oy=cvvY(o);   // the flail comes down
    spawnRingAt(ox,oy,oz,R*0.35,hot); fxxDust(ox,oy,oz,fxpN(10),3,0xb89a5a); fxpSparks(ox,oy+0.6,oz,hot,fxpN(24),9,{up:4,size:0.2,life:0.7}); if(L) sslBurst(L,ox,oy+0.6,oz,20,5);
    if(o===P) camShake=Math.max(camShake,0.3); cvvSnd(ox,oz,s=>{ noiseHit({bus:'ui',filter:'lowpass',ff:500,ff2:200,dur:0.3,vol:0.18*s.gain,pan:s.pan}); tone({bus:'ui',type:'triangle',freq:220,freq2:90,dur:0.25,vol:0.1*s.gain,pan:s.pan}); }); });
  const F=cvvAdd('thr'+pid,ab.fx.refund.secs,(F,dt,k)=>{   // the refund window: a twine ring pulled tight round your feet
    const o=cvvWho(pid); if(!o){ F.t=F.life; return; } const sc=cvvScale(o), gy=cvvY(o), r=(2.4*(1-k)+0.3)*sc;
    F.data.ring.position.set(o.x,gy+0.1,o.z); F.data.ring.scale.setScalar(r); F.data.ring.material.opacity=0.75*(1-0.5*k); F.data.ring.rotation.y+=dt*1.5;
    if(Math.random()<dt*14*FXP_K){ const a=AR(0,TAU); fxpRise(o.x+Math.sin(a)*r,gy+0.15,o.z+Math.cos(a)*r,hot,0.13,AR(0.6,1)); } });
  F.data.ring=new THREE.Mesh(CVG.ring,cvvMat(F,hot,0.75)); F.g.add(F.data.ring);
  F.end=()=>{ const o=cvvWho(pid); if(o){ spawnRingAt(o.x,cvvY(o),o.z,1.2,hot2,true); if(L) sslBurst(L,o.x,cvvY(o)+0.5,o.z,6,2); } };   // the twine is tied
}});
// ---- Sazanka: Shadow Step ----
caveVisDef('shadowstep',{
  wind(p,ab){   // the press: she is already going, ink and crossed crescents where she stood
    const L=cvvSL('sazanka'), x=p.x, z=p.z, y=cvvY(p), sc=cvvScale(p);
    if(L){ sslBurst(L,x,y+1,z,12,3.4); sslDecal(L,x,z,2.4,{life:1.0,op:0.7}); }
    spawnArcAt(x,y+1.0*sc,z,p.face+0.5,0xdfe8ff,1.1); spawnArcAt(x,y+0.9*sc,z,p.face-0.5,0x7a6cf0,1.1);
    for(let i=0,n=fxpN(4);i<n;i++) fxpSmoke(x+AR(-0.4,0.4),y+AR(0.4,1.6),z+AR(-0.4,0.4),AR(-0.5,0.5),AR(0.3,1),AR(-0.5,0.5),0x1b1f2a,0.9,AR(0.6,1),{grow:1.6});
    cvvSnd(x,z,s=>noiseHit({bus:'ui',filter:'bandpass',ff:1800,ff2:500,dur:0.25,vol:0.12*s.gain,pan:s.pan}));
  },
  cast(p,ab){
    const L=cvvSL('sazanka'), pid=cvvPid(p), x=p.x, z=p.z, y=cvvY(p), sc=cvvScale(p), r0=cvvRecent(pid,'shadowstep'), fx=-Math.sin(p.face), fz=-Math.cos(p.face);
    if(r0&&Math.hypot(r0.x-x,r0.z-z)>1.5){ if(L) sslLine(L,r0.x,y+0.9,r0.z,x,y+0.9,z,28); for(let i=0;i<=fxpN(10);i++){ const f=i/fxpN(10); fxpAdd(r0.x+(x-r0.x)*f,y+0.9,r0.z+(z-r0.z)*f,0,AR(0.3,1),0,i%2?0x7a6cf0:0xdfe8ff,0.22,AR(0.3,0.5),{white:0.3}); } }   // the ink streak she left
    if(L){ spawnArcAt(x,y+1.0*sc,z,p.face+0.45,L.arcCol,1.4); spawnArcAt(x,y+0.9*sc,z,p.face-0.45,L.hot,1.4); sslBurst(L,x,y+0.8,z,10,3); spawnRingAt(x,y,z,2.4,L.hot);
      ssPart('tag',0x9a6a3a,x+fx*0.4,y+1.2,z+fz*0.4,{v:[fx*1.2,2.2,fz*1.2],g:-9,life:0.8,s:0.26,spin:5,floor:true}); }   // the delivery tag
    const win=ab.fx.behindWin, F=cvvAdd('ssw'+pid,win,(F,dt,k)=>{   // the window: three crescents of moon-grey and violet turn round her, ink at her feet
      const o=cvvWho(pid); if(!o||o.dead){ F.t=F.life; return; } const s2=cvvScale(o), gy=cvvY(o), fade=Math.min(1,(F.life-F.t)/0.3,F.t/0.12+0.2);
      F.data.cr.forEach((m,i)=>{ const a=F.t*(4+i*0.8)+i/3*TAU; m.position.set(o.x+Math.sin(a)*0.8*s2,gy+(0.9+0.35*i+0.06*Math.sin(F.t*7+i))*s2,o.z+Math.cos(a)*0.8*s2); m.rotation.y=a+Math.PI/2; m.rotation.z=0.5*(i-1); m.scale.setScalar(s2*fade); m.material.opacity=0.85*fade; });
      if(L&&Math.random()<dt*12*FXP_K) ssEmit(L,o.x+AR(-0.4,0.4),gy+AR(0.05,0.5),o.z+AR(-0.4,0.4),{v:[0,AR(0.4,1.1),0],life:0.9}); });
    F.data.cr=[0,1,2].map(i=>{ const m=new THREE.Mesh(CVG.crescent||(CVG.crescent=new THREE.RingGeometry(0.5,0.58,12,1,0,1.5)),cvvMat(F,i===1?0x7a6cf0:0xdfe8ff,0.85)); F.g.add(m); return m; });
    F.end=()=>{ const o=cvvWho(pid); if(o&&L) sslBurst(L,o.x,cvvY(o)+1,o.z,10,3); };
    cvvSnd(x,z,s=>{ noiseHit({bus:'ui',filter:'highpass',ff:3200,dur:0.12,vol:0.1*s.gain,pan:s.pan}); tone({bus:'ui',type:'triangle',freq:900,freq2:300,dur:0.2,vol:0.05*s.gain,pan:s.pan}); });
  }});
// ---- Torgeir: Shield-Wall ----
caveVisDef('shieldwall',{cast(p,ab){
  const L=cvvSL('torgeir'), pid=cvvPid(p), x=p.x, z=p.z, y=cvvY(p), W=ab.fx.wall, ang=p.face, N=7, hot=L?L.hot:0xcdbf8a, hot2=L?L.hot2:0x9fb06a;
  if(L){ sslFlash(L,x,y+1.0,z,ang,1.8,0.9,0x3f5668,0xe3dccb); sslBurst(L,x-Math.sin(ang)*2.4,y+0.8,z-Math.cos(ang)*2.4,16,4); }
  spawnRingAt(x,y,z,W.r*0.6,hot2); if(p===P) camShake=Math.max(camShake,0.35);
  const F=cvvAdd('wall'+pid,W.dur,(F,dt)=>{
    const c=F.data, left=F.life-F.t, flick=left<0.7?(Math.sin(F.t*40)>0?1:0.55):1;
    c.slabs.forEach((s,i)=>{ const rise=Math.min(1,F.t/(0.2+0.03*Math.abs(i-(N-1)/2))), e=1-Math.pow(1-rise,3), sink=left<0.5?left/0.5:1;
      s.m.position.y=c.y+(-2.2+2.2*e)*sink; s.m.visible=true; s.edge.material.opacity=0.9*flick; });
    c.area.material.opacity=(0.12+0.04*Math.sin(F.t*2))*Math.min(1,F.t/0.3,left/0.5); c.line.material.opacity=0.4*Math.min(1,F.t/0.3,left/0.5)*flick;
    if(F.t>=c.pulse){ c.pulse+=2; if(L) sslSlabs(L,x,z,3.4,5,0x6a6e74); spawnRingAt(x,c.y,z,W.r*0.9,hot); fxpSparks(x,c.y+0.5,z,hot,fxpN(10),5,{up:2,size:0.16,life:0.5});   // a taunt goes out
      cvvSnd(x,z,s=>tone({bus:'ui',type:'triangle',freq:150,freq2:110,dur:0.3,vol:0.09*s.gain,pan:s.pan})); } });
  const c=F.data; c.y=y; c.pulse=2; c.slabs=[];
  for(let i=0;i<N;i++){ const a=ang+(i-(N-1)/2)*0.34, m=new THREE.Mesh(CVG.box,cvvMat(F,0x5d6168,1,'lit')); m.scale.set(1.2,2.1,0.34); m.position.set(x-Math.sin(a)*2.6,y-2.2,z-Math.cos(a)*2.6); m.rotation.y=a; m.visible=false;
    const em=new THREE.LineBasicMaterial({color:0xcdbf8a,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false}); F.mats.push(em); const edge=new THREE.LineSegments(CVG.boxEdges,em); m.add(edge); F.g.add(m); c.slabs.push({m,edge}); }
  c.area=new THREE.Mesh(CVG.half,cvvMat(F,0x7d8c5a,0.12)); c.area.position.set(x,y+0.07,z); c.area.scale.setScalar(W.r); c.area.rotation.y=ang+Math.PI;   // the ground behind the line: where allies are covered
  const px=Math.cos(ang), pz=-Math.sin(ang); c.line=new THREE.Mesh(CVG.rod,cvvMat(F,0xe3dccb,0.4)); cvvRod(c.line,x-px*W.r,y+0.12,z-pz*W.r,x+px*W.r,y+0.12,z+pz*W.r,0.05);
  F.g.add(c.area,c.line);
  F.end=()=>{ if(L) sslBurst(L,x,y+0.6,z,12,3); };
  cvvSnd(x,z,s=>{ noiseHit({bus:'ui',filter:'lowpass',ff:600,ff2:200,dur:0.35,vol:0.2*s.gain,pan:s.pan}); tone({bus:'ui',type:'triangle',freq:130,freq2:70,dur:0.4,vol:0.12*s.gain,pan:s.pan}); });
}});
// ---- Corvin: Lighthouse ----
function cvvLantern(x,z,r,dur,owner){
  const L=cvvSL('corvin'), gy=getH(x,z), hot=L?L.hot:0xfff1c9;
  const F=cvvAdd('lh'+owner,dur,(F,dt)=>{
    const c=F.data, left=F.life-F.t, grow=Math.min(1,F.t/0.3), fade=Math.min(1,left/0.5), drop=Math.max(0,1-F.t/0.25), ph=F.t*2.4;
    c.root.position.y=gy+drop*drop*1.2; c.root.scale.setScalar(grow); c.beam.rotation.y=ph; c.beam.position.y=gy+1.1; c.beam.scale.setScalar(r*grow); c.beam.material.opacity=0.55*fade; c.floor.rotation.y=ph; c.floor.scale.setScalar(r*grow); c.floor.material.opacity=0.38*fade;
    fxpFlare(x,gy+1.1,z,hot,(1.7+0.3*Math.sin(F.t*9))*fade,0.09);
    if(Math.random()<dt*10*FXP_K) fxpAdd(x+AR(-0.3,0.3),gy+AR(0.5,1.3),z+AR(-0.3,0.3),AR(-0.6,0.6),AR(0.4,1.2),AR(-0.6,0.6),0xe6c86a,0.1,0.8,{white:0.3});
    const beamA=ph+0.21;   // the beam's middle in the ground's own angle (x forward, z flipped)
    for(const m of MONS){ if(m.dead||!m.g.visible) continue; const dx=m.x-x, dz=m.z-z, d=Math.hypot(dx,dz); if(d>r+m.T.rad*m.s) continue;
      let da=Math.atan2(-dz,dx)-beamA; da=Math.atan2(Math.sin(da),Math.cos(da)); if(Math.abs(da)>0.22) continue;
      const last=c.seen.get(m.id)||-9; if(F.t-last<0.7) continue; c.seen.set(m.id,F.t); const hy=m.y+m.T.height*m.s*0.6;   // the Glare: the beam crosses it
      fxpFlare(m.x,hy,m.z,0xfff1c9,2,0.3); fxpSparks(m.x,hy,m.z,0xffffff,fxpN(5),3,{size:0.15,life:0.35}); } });
  const c=F.data; c.seen=new Map(); c.root=new THREE.Group(); c.root.position.set(x,gy,z);
  const brass=cvvMat(F,0xc9a13a,1,'lit'), base=new THREE.Mesh(CVG.can,brass), glass=new THREE.Mesh(CVG.can,cvvMat(F,0xfff1c9,0.9)), cap=new THREE.Mesh(CVG.cone,brass);
  base.scale.set(0.3,0.14,0.3); glass.scale.set(0.22,0.55,0.22); glass.position.y=0.14; cap.scale.set(0.34,0.26,0.34); cap.position.y=0.69; c.root.add(base,glass,cap);
  c.beam=new THREE.Mesh(CVG.wedge,cvvMat(F,0xfff1c9,0.55)); c.beam.material.vertexColors=true; c.floor=new THREE.Mesh(CVG.wedge,cvvMat(F,0xe6c86a,0.38)); c.floor.material.vertexColors=true; c.floor.position.set(x,gy+0.12,z); c.beam.position.set(x,gy+1.1,z);
  F.g.add(c.root,c.beam,c.floor);
  if(L){ sslDecal(L,x,z,r,{life:dur,r0:1,op:0.5,spin:0.4,keep:true}); sslBurst(L,x,gy+0.4,z,10,3); }
  spawnRingAt(x,gy,z,r,hot); fxpFlare(x,gy+0.6,z,hot,4,0.4);
  cvvSnd(x,z,s=>{ tone({bus:'ui',type:'triangle',freq:880,dur:0.4,vol:0.06*s.gain,pan:s.pan,verb:true}); noiseHit({bus:'ui',filter:'highpass',ff:2600,dur:0.15,vol:0.07*s.gain,pan:s.pan}); });
}
CVV_AREAS.push((id,x,z,r,dur,owner,flags)=>{ if(!(flags&1)&&cvvRecent(owner,'lighthouse')) cvvLantern(x,z,r,dur,owner); });
caveVisDef('lighthouse',{cast(p,ab){   // the lantern is set down (the zone event raises it where it stands): brass dust at the hands
  const L=cvvSL('corvin'), x=p.x, y=cvvY(p), z=p.z; fxpFlare(x,y+1.2,z,0xfff1c9,2.4,0.3); if(L) sslBurst(L,x,y+1,z,8,2.4); spawnRingAt(x,y,z,2.6,0xe6c86a);
}});
// ---- Sabir: Cut and Run ----
caveVisDef('cutandrun',{
  cast(p,ab){   // the burning cut, then the guard shimmer of the three seconds after it
    const L=cvvSL('sabir'), pid=cvvPid(p), x=p.x, z=p.z, y=cvvY(p), sc=cvvScale(p), face=p.face, C=ab.fx.cvstrike, ember=L?L.hot:0xff8a3a, gold=L?L.hot2:0xffd070;
    spawnArcAt(x,y+1.0*sc,z,face,ember,C.r/2.6*1.2); spawnArcAt(x,y+0.8*sc,z,face+0.4,gold,C.r/2.6); spawnArcAt(x,y+1.2*sc,z,face-0.4,0xa8322a,C.r/2.6);
    if(L){ sslSector(L,x,y+0.4*sc,z,face,C.arc,C.r,26); sslDecal(L,x,z,C.r,{life:0.8,op:0.55}); }
    fxpSparks(x-Math.sin(face)*2.2,y+1,z-Math.cos(face)*2.2,ember,fxpN(18),8,{up:1.5,size:0.2,life:0.5});
    const F=cvvAdd('cnr'+pid,ab.fx.ally.dur,(F,dt)=>{
      const o=cvvWho(pid); if(!o||o.dead){ F.t=F.life; return; } const s2=cvvScale(o), gy=cvvY(o), fade=Math.min(1,(F.life-F.t)/0.5,F.t/0.15+0.2);
      F.data.ring.position.set(o.x,gy+0.1,o.z); F.data.ring.scale.setScalar((1.0+0.08*Math.sin(F.t*7))*s2); F.data.ring.material.opacity=0.5*fade; F.data.ring.rotation.y+=dt;
      if(L&&Math.random()<dt*14*FXP_K) ssEmit(L,o.x+AR(-0.5,0.5),gy+AR(0.1,0.6),o.z+AR(-0.5,0.5),{v:[0,AR(0.8,1.8),0],life:1}); });
    F.data.ring=new THREE.Mesh(CVG.ring,cvvMat(F,0xa8322a,0.5)); F.g.add(F.data.ring);
    cvvSnd(x,z,s=>{ noiseHit({bus:'ui',filter:'bandpass',ff:1200,ff2:3500,dur:0.2,vol:0.14*s.gain,pan:s.pan}); tone({bus:'ui',type:'sawtooth',freq:300,freq2:1100,dur:0.18,vol:0.06*s.gain,pan:s.pan,filter:'lowpass',ff:2200}); });
  },
  event(e){   // cvfx [pid, 'retreat']: the dash back is done; draw the streak from where the cut began to where you stand
    if(e[0]!=='cvfx'||e[2]!=='retreat') return; const pid=e[1], r0=cvvRecent(pid,'cutandrun'); if(!r0) return; const L=cvvSL('sabir');
    fxpLater(0.15,()=>{ const o=cvvWho(pid); if(!o) return; const y=cvvY(o), ox=r0.x, oz=r0.z, ex=o.x, ez=o.z;
      if(L) sslLine(L,ox,y+0.9,oz,ex,y+0.9,ez,30);
      for(let i=0,n=fxpN(14);i<=n;i++){ const f=i/n; fxpAdd(ox+(ex-ox)*f,y+0.7+AR(0,0.5),oz+(ez-oz)*f,AR(-0.5,0.5),AR(0.5,1.5),AR(-0.5,0.5),i%3?0xff8a3a:0xffd070,0.2,AR(0.4,0.8),{g:-1,white:0.2,grow:0.2}); }
      for(let i=0,n=fxpN(4);i<n;i++) fxpSmoke(ox+AR(-0.5,0.5),y+AR(0.3,1.4),oz+AR(-0.5,0.5),AR(-0.4,0.4),AR(0.4,1),AR(-0.4,0.4),0x3a2a24,0.9,AR(0.6,1),{grow:1.6});
      spawnRingAt(ex,y,ez,2.2,0xff8a3a); fxpSparks(ex,y+0.8,ez,0xffd070,fxpN(14),6,{up:2,size:0.18,life:0.5});
      cvvSnd(ex,ez,s=>noiseHit({bus:'ui',filter:'highpass',ff:2000,dur:0.18,vol:0.1*s.gain,pan:s.pan})); });
  }});
