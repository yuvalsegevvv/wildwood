//@ Drawings of the Deep Cave's floor-1 skills Burrow, Cave-in, Grapple Line and Second Wind: a mound that carries you under the ground, a rock fall with shadows, a hook and a taut line, a green breath that heals
/* Agent map. Plan: docs/CAVE.md section 16 (C5). Built on the plumbing in vis-floor1.js (cvvAdd, cvvMat, CVG, cvvWho...). Test: client-smoke.
   Burrow: the avatar's group is lowered below the ground (our tick runs after the pose code has placed it) while a dirt mound travels with it; the eruption at the end throws dust and chunks.
   Cave-in: the server's zone (area event, claimed through CVV_AREAS because its owner just began the skill) is the telegraph; this adds the rocks that fall on it, each with a growing shadow, landing at the zone's end.
   Grapple Line: wind(p, ab) at the press draws the hook, the line and the pull (the dash itself is the generic one); cast() at the blow leaves the "next hit +30%" glint on the weapon hand until you strike.
   Second Wind: a green aura, two spirals of motes and a heal pulse every second for the 6 seconds of the regeneration. */
// ---- Burrow ----
caveVisDef('burrow',{cast(p,ab){
  const pid=cvvPid(p), life=ab.fx.burrow.sec*cvvLvK(p,ab), x=p.x, z=p.z, y=cvvY(p), dirt=0x6b5a45;
  fxxDust(x,y,z,fxpN(12),1.8,dirt); fxxDebris(x,y,z,fxpN(8),5,dirt); spawnRingAt(x,y,z,2.6,0xc9a56a); fxpSparks(x,y+0.3,z,0xd8b07a,fxpN(14),5,{up:3,size:0.18,life:0.5});
  cvvSnd(x,z,s=>{ noiseHit({bus:'ui',filter:'lowpass',ff:500,ff2:160,dur:0.5,vol:0.16*s.gain,pan:s.pan}); tone({bus:'ui',type:'sine',freq:120,freq2:50,dur:0.5,vol:0.1*s.gain,pan:s.pan}); });
  const F=cvvAdd('bur'+pid,life,(F,dt)=>{
    const o=cvvWho(pid), c=F.data; if(!o){ F.t=F.life; return; } const sc=cvvScale(o), gy=cvvY(o), left=F.life-F.t;
    const sink=Math.min(1,F.t/0.22,left/0.25);   // down in a fifth of a second, up in the last quarter
    const body=o===P?hiker.g:o.g; if(body) body.position.y-=sink*2.3*sc;
    c.mound.visible=sink>0.05; c.mound.position.set(o.x,gy,o.z); c.mound.scale.set(0.95*sc,(0.12+0.4*sink+0.05*Math.sin(F.t*30))*sc,0.95*sc); c.mound.rotation.y=F.t*2;
    c.lx=o.x; c.ly=gy; c.lz=o.z;
    if(Math.hypot(o.x-c.px,o.z-c.pz)>0.45){ c.px=o.x; c.pz=o.z; fxpSmoke(o.x+AR(-0.4,0.4),gy+0.2,o.z+AR(-0.4,0.4),AR(-0.4,0.4),AR(0.4,1),AR(-0.4,0.4),0x7a6a55,0.7,AR(0.6,1),{grow:1.8}); fxpAdd(o.x+AR(-0.5,0.5),gy+0.3,o.z+AR(-0.5,0.5),AR(-2,2),AR(1,3),AR(-2,2),0x9a8a70,0.14,0.45,{g:8,drag:0.6}); }
    if(Math.random()<dt*8*FXP_K) fxpAdd(o.x+AR(-0.6,0.6),gy+0.1,o.z+AR(-0.6,0.6),0,AR(0.5,1.5),0,0xd8b07a,0.12,0.5,{grow:0.2}); });
  F.data.mound=new THREE.Mesh(CVG.mound,cvvMat(F,0x6b5a45,1,'lit')); F.data.mound.visible=false; F.g.add(F.data.mound); F.data.px=x; F.data.pz=z; F.data.lx=x; F.data.ly=y; F.data.lz=z;
  F.end=F=>{ const c=F.data; fxxDust(c.lx,c.ly,c.lz,fxpN(14),2.2,dirt); fxxDebris(c.lx,c.ly,c.lz,fxpN(10),7,dirt); spawnRingAt(c.lx,c.ly,c.lz,3,0xc9a56a); fxpFlare(c.lx,c.ly+0.6,c.lz,0xd8b07a,3,0.3);   // up out of the ground
    fxpSparks(c.lx,c.ly+0.3,c.lz,0xd8b07a,fxpN(18),6,{up:4,size:0.2,life:0.6}); if(pid===NET.pid) camShake=Math.max(camShake,0.25); cvvSnd(c.lx,c.lz,s=>noiseHit({bus:'ui',filter:'lowpass',ff:700,ff2:250,dur:0.35,vol:0.14*s.gain,pan:s.pan})); };
}});
// ---- Cave-in ----
function cvvRocks(x,z,r,dur,owner){
  const gy=getH(x,z), FALL=0.34, n=LOW?8:15, rocks=[];
  const F=cvvAdd(null,dur+0.6,(F,dt)=>{
    const c=F.data, mine=Math.hypot(P.x-x,P.z-z)<r*3;
    if(F.t<dur&&Math.random()<dt*24*FXP_K){ const a=AR(0,TAU), d=Math.sqrt(Math.random())*r; fxpSmoke(x+Math.sin(a)*d,gy+AR(7,11),z+Math.cos(a)*d,AR(-0.3,0.3),-AR(3,5),AR(-0.3,0.3),0x7a6e5e,0.5,AR(0.5,0.9),{grow:1.2}); }   // grit sifting from the ceiling
    for(const k of rocks){ const tt=F.t-(k.at-FALL), m=k.m, sh=k.sh;
      if(tt<0||k.gone){ continue; }
      if(tt<FALL){ const f=tt/FALL; m.visible=true; m.position.set(k.x,k.y0+(gy-k.y0)*f*f+k.sz*0.5,k.z); m.rotation.x+=dt*k.spin; m.rotation.z+=dt*k.spin*0.7;
        sh.visible=true; sh.position.set(k.x,getH(k.x,k.z)+0.09,k.z); sh.scale.setScalar(k.sz*(0.4+1.3*f)); sh.material.opacity=0.55*f; }
      else { k.gone=true; m.visible=false; sh.visible=false; const lx=k.x, lz=k.z, ly=getH(lx,lz);   // it lands and bursts
        fxxDust(lx,ly,lz,k.big?fxpN(14):fxpN(3),k.sz*1.8,0x7a6e5e); fxxDebris(lx,ly,lz,k.big?fxpN(14):fxpN(3),k.big?9:5,0x6a5a48); fxpSparks(lx,ly+0.2,lz,0xc9b48a,fxpN(k.big?20:5),k.big?9:4,{up:3,size:0.16,life:0.45});
        if(k.big){ spawnRingAt(lx,ly,lz,r*0.8,0xc9a56a); if(mine) camShake=Math.max(camShake,0.5); cvvSnd(lx,lz,s=>{ noiseHit({bus:'ui',filter:'lowpass',ff:420,ff2:120,dur:0.7,vol:0.26*s.gain,pan:s.pan}); tone({bus:'ui',type:'sine',freq:90,freq2:35,dur:0.8,vol:0.2*s.gain,pan:s.pan}); }); }
        else if(Math.random()<0.5) cvvSnd(lx,lz,s=>noiseHit({bus:'ui',filter:'lowpass',ff:900,ff2:300,dur:0.18,vol:0.09*s.gain,pan:s.pan})); } } });
  const mats=[cvvMat(F,0x8a7e6c,1,'lit'),cvvMat(F,0x5a5048,1,'lit')], shMat=cvvMat(F,0x000000,0.5,'norm');
  for(let i=0;i<n;i++){ const big=i===n-1, a=AR(0,TAU), d=big?0:Math.sqrt(Math.random())*r*0.9, kx=x+Math.sin(a)*d, kz=z+Math.cos(a)*d, sz=big?1.7:AR(0.35,0.85);
    const m=new THREE.Mesh(CVG.rock,mats[i%2]); m.scale.set(sz,sz*AR(0.7,1),sz*AR(0.8,1.1)); m.visible=false; const sh=new THREE.Mesh(CVG.disc,shMat.clone()); F.mats.push(sh.material); sh.visible=false; F.g.add(m,sh);
    rocks.push({m,sh,x:kx,z:kz,sz,big,spin:AR(2,6),y0:gy+AR(11,15),at:big?dur-0.03:AR(FALL+0.02,Math.max(FALL+0.1,dur-0.12)),gone:false}); }
  if(Math.hypot(P.x-x,P.z-z)<r*4) cvvSnd(x,z,s=>noiseHit({bus:'ui',filter:'lowpass',ff:200,dur:dur,vol:0.14*s.gain,pan:s.pan}));   // the rumble under the fall
}
CVV_AREAS.push((id,x,z,r,dur,owner,flags)=>{ if((flags&1)&&cvvRecent(owner,'cavein')) cvvRocks(x,z,r,dur,owner); });
caveVisDef('cavein',{cast(p,ab){   // the hand comes down: the rumble starts at the caster's feet (the rocks follow the server's zone)
  const x=p.x, y=cvvY(p), z=p.z; fxxDust(x,y,z,fxpN(8),2.4,0x6a5a48); spawnRingAt(x,y,z,3.2,0xd8b07a); fxpSparks(x,y+0.4,z,0xd8b07a,fxpN(12),5,{up:2,size:0.16,life:0.5});
  if(p===P) camShake=Math.max(camShake,0.2);
  cvvSnd(x,z,s=>tone({bus:'ui',type:'sine',freq:110,freq2:60,dur:0.4,vol:0.1*s.gain,pan:s.pan}));
}});
// ---- Grapple Line ----
caveVisDef('grapple',{
  wind(p,ab){   // the press: the hook flies to its anchor and the line pulls you in
    const pid=cvvPid(p), dx=-Math.sin(p.face), dz=-Math.cos(p.face); let ax=p.x+dx*ab.fx.dash.ahead, az=p.z+dz*ab.fx.dash.ahead;
    if(p===P&&CB.dash){ ax=CB.dash.tx; az=CB.dash.tz; }
    else { let best=null,bd=ab.range+2; for(const m of MONS){ if(m.dead||!m.g.visible) continue; const ex=m.x-p.x, ez=m.z-p.z, d=Math.hypot(ex,ez); if(d<bd&&(ex*dx+ez*dz)/(d||1)>0.85){ bd=d; best=m; } } if(best){ ax=best.x; az=best.z; } }
    const ay=getH(ax,az)+1.1, hand=new THREE.Vector3(), hp=new THREE.Vector3();
    const F=cvvAdd('grl'+pid,1.1,(F,dt)=>{
      const o=cvvWho(pid), c=F.data; if(!o){ F.t=F.life; return; } cvvHand(o,hand);
      const f=Math.min(1,F.t/0.1), arrive=Math.hypot(o.x-ax,o.z-az)<2.2&&F.t>0.15, fade=c.done!==undefined?Math.max(0,1-(F.t-c.done)/0.15):1;
      if(arrive&&c.done===undefined){ c.done=F.t; F.life=Math.min(F.life,F.t+0.15); fxpFlare(ax,ay,az,0xffe9b0,2.2,0.3); fxpSparks(ax,ay,az,0xffd27a,fxpN(14),6,{size:0.16,life:0.4}); }
      hp.set(hand.x+(ax-hand.x)*f,hand.y+(ay-hand.y)*f,hand.z+(az-hand.z)*f);
      cvvRod(c.rope,hand.x,hand.y,hand.z,hp.x,hp.y,hp.z,0.05+0.015*Math.sin(F.t*40)); c.rope.material.opacity=0.95*fade; c.hook.position.copy(hp); c.hook.rotation.y+=dt*8; c.hook.scale.set(0.1,0.18,0.1); c.hook.material.opacity=fade;
      if(Math.random()<dt*30*FXP_K){ const q=Math.random(); fxpAdd(hand.x+(hp.x-hand.x)*q,hand.y+(hp.y-hand.y)*q,hand.z+(hp.z-hand.z)*q,(hand.x-hp.x)*0.5,0,(hand.z-hp.z)*0.5,0xffe9b0,0.12,0.25,{white:0.5}); } });
    F.data.rope=new THREE.Mesh(CVG.rod,cvvMat(F,0x16b8c8,0.95,'norm')); F.data.hook=new THREE.Mesh(CVG.gem,cvvMat(F,0x0e8fa0,1,'norm')); F.g.add(F.data.rope,F.data.hook);
    cvvSnd(p.x,p.z,s=>{ noiseHit({bus:'ui',filter:'highpass',ff:2400,dur:0.12,vol:0.1*s.gain,pan:s.pan}); tone({bus:'ui',type:'triangle',freq:300,freq2:1300,dur:0.14,vol:0.06*s.gain,pan:s.pan}); });
  },
  cast(p,ab){   // landed: the next blow within the seconds carries the hook's weight, a glint on the hand and chevrons rising
    const pid=cvvPid(p), hand=new THREE.Vector3(), x=p.x, y=cvvY(p), z=p.z;
    spawnRingAt(x,y,z,2.2,0xffd27a); fxpFlare(x,y+1,z,0xffe9b0,2.6,0.3);
    const F=cvvAdd('grp'+pid,ab.fx.grapple.sec,(F,dt)=>{
      const o=cvvWho(pid), c=F.data; if(!o){ F.t=F.life; return; } const sc=cvvScale(o), gy=cvvY(o), a=cvvAct(o), fade=Math.min(1,(F.life-F.t)/0.3);
      if(a&&a!==c.seen){ c.seen=a; if(F.t>0.12){ cvvHand(o,hand); fxpFlare(hand.x,hand.y,hand.z,0xffe9b0,2.4,0.25); fxpSparks(hand.x,hand.y,hand.z,0xffd27a,fxpN(10),6,{size:0.16,life:0.35}); F.t=F.life; return; } }   // the blow is struck: the weight is spent
      cvvHand(o,hand); fxpFlare(hand.x,hand.y,hand.z,0xffd27a,(0.7+0.2*Math.sin(F.t*14))*fade,0.08);
      c.ring.position.set(o.x,gy+0.08,o.z); c.ring.scale.setScalar((0.9+0.08*Math.sin(F.t*8))*sc); c.ring.material.opacity=0.5*fade;
      c.ch.forEach((m,i)=>{ const q=(F.t*0.9+i/3)%1; m.position.set(o.x+Math.sin(i*2.1)*0.5*sc,gy+(0.3+q*1.9)*sc,o.z+Math.cos(i*2.1)*0.5*sc); m.scale.set(0.16*sc,0.16*sc,0.16*sc); m.material.opacity=Math.sin(q*Math.PI)*0.9*fade; }); });
    F.data.ring=new THREE.Mesh(CVG.ring,cvvMat(F,0xffd27a,0.5)); F.data.ch=[0,1,2].map(()=>{ const m=new THREE.Mesh(CVG.cone,cvvMat(F,0xff9a1a,0,'norm')); F.g.add(m); return m; }); F.g.add(F.data.ring);
  }});
// ---- Second Wind ----
function cvvPlus(F,x,y,z){   // a little cross that faces the camera and rises
  const g=new THREE.Group(), m=cvvMat(F,0x1fb85c,0.95,'norm'); g.add(new THREE.Mesh(CVG.box,m),new THREE.Mesh(CVG.box,m)); g.children[0].scale.set(0.3,0.09,0.02); g.children[1].scale.set(0.09,0.3,0.02); g.children[0].position.y=0.105; g.position.set(x,y,z); F.g.add(g);
  (F.data.plus||(F.data.plus=[])).push({g,m,t:0}); if(F.data.plus.length>10){ const o=F.data.plus.shift(); F.g.remove(o.g); }
}
caveVisDef('secondwind',{cast(p,ab){
  const pid=cvvPid(p), life=ab.fx.wind.sec, x=p.x, y=cvvY(p), z=p.z;
  spawnRingAt(x,y,z,3.2,0x8cf2b0); fxpFlare(x,y+1.1,z,0xbaffd0,3.4,0.4);
  for(let i=0,n=fxpN(18);i<n;i++){ const a=i/n*TAU; fxpAdd(x+Math.sin(a)*0.4,y+0.2+i*0.1,z+Math.cos(a)*0.4,Math.cos(a)*2.4,AR(1.5,3),-Math.sin(a)*2.4,0xbaffd0,0.18,AR(0.7,1.1),{drag:1.2,white:0.4,grow:0.2}); }   // the exhale: a spiral that rises
  const F=cvvAdd('wind'+pid,life,(F,dt)=>{
    const o=cvvWho(pid), c=F.data; if(!o||o.dead){ F.t=F.life; return; } const sc=cvvScale(o), gy=cvvY(o), left=F.life-F.t, fade=Math.min(1,left/0.6,F.t/0.2+0.3);
    c.aura.position.set(o.x,gy+0.09,o.z); c.aura.scale.setScalar((1.35+0.12*Math.sin(F.t*2.5))*sc); c.aura.rotation.y+=dt*0.5; c.aura.material.opacity=(0.4+0.12*Math.sin(F.t*2.5))*fade;
    for(let s=0;s<2;s++){ const ang=F.t*2.6+s*Math.PI, h=((F.t*0.6+s*0.5)%1)*2*sc; if(Math.random()<dt*26*FXP_K) fxpRise(o.x+Math.sin(ang)*0.75*sc,gy+h,o.z+Math.cos(ang)*0.75*sc,s?0x8cf2b0:0xd8ffe4,0.15,AR(0.6,1)); }
    if(F.t>=c.beat){ c.beat+=1; const hy=gy+1.1*sc; fxpFlare(o.x,hy,o.z,0xbaffd0,2,0.35); c.pulse.t=0.0001;   // a heal beat each second: a ring drawn in to the heart and two crosses lifting off
      cvvPlus(F,o.x+AR(-0.35,0.35),gy+1.9*sc,o.z+AR(-0.35,0.35)); if(!LOW) cvvPlus(F,o.x+AR(-0.35,0.35),gy+1.5*sc,o.z+AR(-0.35,0.35)); }
    if(c.pulse.t>0){ c.pulse.t+=dt; const k=c.pulse.t/0.5; if(k>=1){ c.pulse.t=0; c.pulse.m.visible=false; } else { c.pulse.m.visible=true; c.pulse.m.position.set(o.x,gy+1.1*sc,o.z); c.pulse.m.scale.setScalar((1.5-1.1*k)*sc); c.pulse.m.material.opacity=0.7*(1-k); } }
    for(let i=c.plus.length-1;i>=0;i--){ const q=c.plus[i]; q.t+=dt; q.g.position.y+=dt*0.9; q.g.quaternion.copy(camera.quaternion); q.m.opacity=Math.max(0,1-q.t/1.1); if(q.t>1.1){ F.g.remove(q.g); c.plus.splice(i,1); } } });
  const c=F.data; c.beat=0.15; c.plus=[]; c.aura=fxdMesh('leaf',0x8cf2b0,0.4); F.mats.push(c.aura.material); F.g.add(c.aura);
  c.pulse={t:0,m:new THREE.Mesh(CVG.ring,cvvMat(F,0xbaffd0,0))}; c.pulse.m.visible=false; F.g.add(c.pulse.m);
  F.end=F=>{ const o=cvvWho(pid); if(o) { spawnRingAt(o.x,cvvY(o),o.z,2,0x8cf2b0); fxpSparks(o.x,cvvY(o)+1,o.z,0xbaffd0,fxpN(8),3,{size:0.14,life:0.5}); } };
  cvvSnd(x,z,s=>{ noiseHit({bus:'ui',filter:'bandpass',ff:600,ff2:1400,dur:0.6,vol:0.1*s.gain,pan:s.pan}); tone({bus:'ui',type:'sine',freq:392,freq2:523,dur:0.6,vol:0.06*s.gain,pan:s.pan,verb:true}); });
}});
