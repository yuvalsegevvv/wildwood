//@ Drawings of the Deep Cave's floor-1 skills Echo, Flare, Overdrive and Lantern Ward, and the plumbing the floor 1-2 drawings share (timed effects, press-time wind-ups, area claims)
/* Agent map. Plan: docs/CAVE.md section 16 (C5). Contract: vis.js (caveVisDef: cast / event; here also an optional wind(p, ab) called when the cast BEGINS, see below). Cave theme: glowworm cyan 0x7fe8ff / 0xc8fff6, lantern amber 0xffd27a.
   exports: CVV (state: list of timed effects F, recent = the cave skill each player just began), cvvAdd(key, life, step, end) -> F {t, life, g (a Group in the scene), mats, data}, cvvMat(F, col, op, kind), CVG (shared geometries),
            cvvWho(pid), cvvY(o), cvvHand(o, out), cvvAct(o), cvvLvK(p, ab), cvvRecent(pid, id), cvvSnd(x, z, fn), cvvRod(mesh, a..b, width), cvv1Wind(ab, p), cvv1Tick(dt), cvv1Area(...).
   Hooks (`// cave:`): caveDoAttack (slot.js) and remoteAct (net/remote.js) call cvv1Wind; updateSkillFx (skill-fx.js) calls cvv1Tick; onArea (skill-fx.js) calls cvv1Area (a zone that belongs to the cave skill its owner just began).
   Rules: every mesh of an effect is a child of F.g (removed with it) and every material is made through cvvMat (disposed with it); geometries are shared and never disposed; counts are scaled by fxpN / SSL_Q for phones; particles go through the pool (fx-pool.js).
   Effects that last are driven by cvv1Tick from updateSkillFx; Overdrive and Lantern Ward follow their owner. Test: client-smoke. */
const CVV={list:[],recent:Object.create(null)}, CVV_COL={echo:0x7fe8ff,glow:0xc8fff6,lamp:0xffd27a};
const CVG={   // shared geometries (never disposed)
  dome:new THREE.SphereGeometry(1,20,14), mound:new THREE.SphereGeometry(1,12,6,0,TAU,0,Math.PI/2), disc:new THREE.CircleGeometry(1,32).rotateX(-Math.PI/2),
  ring:new THREE.RingGeometry(0.93,1,48).rotateX(-Math.PI/2), rod:new THREE.CylinderGeometry(1,1,1,6,1,true).translate(0,0.5,0), tube:new THREE.CylinderGeometry(1,1,1,16,1,true).translate(0,0.5,0),
  rock:new THREE.IcosahedronGeometry(1,0), gem:new THREE.OctahedronGeometry(1,0), cone:new THREE.ConeGeometry(1,1,5).translate(0,0.5,0), box:new THREE.BoxGeometry(1,1,1).translate(0,0.5,0)
};
{ const sp=new THREE.BufferGeometry(); sp.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0, -0.07,0,-1, 0.07,0,-1],3)); CVG.spoke=sp; }   // a thin ray lying on the ground, pointing to -Z
const cvvPid=p=>p===P?NET.pid:p.id;
const cvvWho=pid=>pid===NET.pid?P:(REMOTES.get(pid)||null);
const cvvY=o=>o.y!==undefined?o.y:getH(o.x,o.z);
const cvvAct=o=>o===P?CB.act:o.act;
const cvvScale=o=>o===P?hiker.scale:(o.scale||1);
const cvvLvK=(p,ab)=>p===P?caveLevelK(caveLevelOf(ab.id)):1.1;   // the level scale of the skill (your own level; another hiker's is not known here)
function cvvHand(o,out){ const sc=cvvScale(o); return out.set(o.x-Math.sin(o.face)*0.4,cvvY(o)+1.3*sc,o.z-Math.cos(o.face)*0.4); }
function cvvSnd(x,z,fn){ if(!SND.ready) return; const s=spatial(x,z,12,80); if(s) fn(s); }
function cvvRecent(pid,id){ const r=CVV.recent[pid]; return r&&r.id===id&&performance.now()-r.t<1800?r:null; }
const _cvvA=new THREE.Vector3(), _cvvUp=new THREE.Vector3(0,1,0);
function cvvRod(m,ax,ay,az,bx,by,bz,w){   // a unit rod (CVG.rod) stretched from a to b
  _cvvA.set(bx-ax,by-ay,bz-az); const L=_cvvA.length()||0.01; m.position.set(ax,ay,az); m.quaternion.setFromUnitVectors(_cvvUp,_cvvA.divideScalar(L)); m.scale.set(w,L,w);
}
function cvvMat(F,col,op,kind){   // kind: 'add' (glowing, default), 'norm' (normal blending), 'lit' (a lit surface: rock, brass)
  const m=kind==='lit'?new THREE.MeshLambertMaterial({color:col,transparent:op<1,opacity:op}):new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false,blending:kind==='norm'?THREE.NormalBlending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  F.mats.push(m); return m;
}
function cvvEnd(F){ scene.remove(F.g); for(const m of F.mats) m.dispose(); if(F.end){ try{ F.end(F); }catch(_){} } }
function cvvAdd(key,life,step,end){   // a timed effect: step(F, dt, k) every frame (k 0..1) until life seconds are up; a second effect with the same key replaces the first
  if(key) for(let i=CVV.list.length-1;i>=0;i--) if(CVV.list[i].key===key){ cvvEnd(CVV.list[i]); CVV.list.splice(i,1); }
  const F={key,t:0,life,step,end,g:new THREE.Group(),mats:[],data:{}}; scene.add(F.g); CVV.list.push(F); return F;
}
function cvv1Tick(dt){
  for(let i=CVV.list.length-1;i>=0;i--){ const F=CVV.list[i]; F.t+=dt;
    try{ if(F.step) F.step(F,dt,Math.min(1,F.t/F.life)); }catch(e){ F.t=F.life; caveVisWarn(F.key||'fx',e); }
    if(F.t>=F.life){ cvvEnd(F); CVV.list.splice(i,1); } }
}
function cvv1Wind(ab,p){   // the cast begins (your press, or another hiker's pact event): remember it, and let the drawing wind up
  if(!ab||!ab.cave||!p) return; CVV.recent[cvvPid(p)]={id:ab.id,x:p.x,z:p.z,t:performance.now()};
  const v=CAVE_VIS[ab.id]; if(v&&v.wind) try{ v.wind(p,ab); }catch(e){ caveVisWarn(ab.id,e); }
}
const CVV_AREAS=[];   // claims: fn(id, x, z, r, dur, owner, flags) for a zone event; the drawing checks cvvRecent(owner, its id)
function cvv1Area(id,kind,x,z,r,dur,owner,flags){ if(kind!=='zone') return; for(const f of CVV_AREAS){ try{ f(id,x,z,r,dur,owner,flags); }catch(e){ caveVisWarn('area',e); } } }
const CVV_BASIC=new Set(); for(const c in ACTS) CVV_BASIC.add(ACTS[c].basic[0]);   // the attack kinds of basic attacks (Overdrive counts them)
// ---- Echo: the cast rings out three times, each smaller and paler, and a ghost column of cyan light stands where you cast ----
caveVisDef('echo',{cast(p,ab){
  const pid=cvvPid(p), x=p.x, z=p.z, y=cvvY(p), r=ab.fx.vis.r;
  for(let i=0;i<3;i++) fxpLater(i*0.17,()=>{ const o=cvvWho(pid); if(!o) return; spawnRingAt(o.x,cvvY(o),o.z,r*(1-i*0.22),i?0xbff6ff:0xffffff); fxpFlare(o.x,cvvY(o)+1.2,o.z,CVV_COL.echo,3-i*0.7,0.3); });
  const F=cvvAdd(null,1.0,(F,dt,k)=>{   // the ghost: a see-through column that swells and thins, with three halos stepping up it
    const c=F.data; c.col.scale.set(0.5+k*0.9,2.3,0.5+k*0.9); c.col.material.opacity=0.38*(1-k);
    for(let i=0;i<3;i++){ const kk=Math.max(0,Math.min(1,(k-i*0.12)/0.6)), h=c.halo[i]; h.scale.setScalar(0.4+kk*(r*0.8)); h.material.opacity=0.7*(1-kk)*(kk>0?1:0); } });
  F.data.col=new THREE.Mesh(CVG.tube,cvvMat(F,CVV_COL.echo,0.38)); F.data.col.position.set(x,y,z); F.g.add(F.data.col);
  F.data.halo=[0,1,2].map(i=>{ const h=new THREE.Mesh(CVG.ring,cvvMat(F,i?0xbff6ff:0xffffff,0)); h.position.set(x,y+0.15+i*0.85,z); F.g.add(h); return h; });
  for(let i=0,n=fxpN(14);i<n;i++){ const a=i/n*TAU; fxpAdd(x+Math.sin(a)*0.5,y+0.2,z+Math.cos(a)*0.5,Math.sin(a)*2.6,AR(0.6,2),Math.cos(a)*2.6,CVV_COL.glow,0.2,AR(0.5,0.9),{drag:1.5,white:0.4,grow:0.2}); }
  cvvSnd(x,z,s=>{ const n=SND.ctx.currentTime; for(let i=0;i<3;i++) tone({bus:'ui',type:'sine',freq:760-i*90,freq2:700-i*90,dur:0.3,vol:0.07*s.gain*(1-i*0.3),pan:s.pan,when:n+i*0.17,verb:true}); });
}});
// ---- Flare: a white orb gathers over the hand, then bursts: a star on the ground, spokes of light, a dome; the monsters it blinds sparkle for the seconds they miss ----
caveVisDef('flare',{cast(p,ab){
  const pid=cvvPid(p), R=ab.fx.ring.r, L=cvvLvK(p,ab), FL=ab.fx.flare, hand=new THREE.Vector3();
  const F=cvvAdd(null,2.4+FL.bossDur*0.25,(F,dt)=>{
    const o=cvvWho(pid), c=F.data; if(!c.rel){   // wind-up: motes pulled into the hand, an orb that swells
      if(!o){ F.t=F.life; return; } cvvHand(o,hand); hand.y+=0.5; fxpFlare(hand.x,hand.y,hand.z,0xffffff,0.5+F.t*7,0.09);
      for(let i=0,n=fxpN(2);i<n;i++){ const a=AR(0,TAU), d=AR(0.8,1.4); fxpAdd(hand.x+Math.sin(a)*d,hand.y+AR(-0.5,0.5),hand.z+Math.cos(a)*d,-Math.sin(a)*6,0,-Math.cos(a)*6,CVV_COL.glow,0.17,0.2,{white:0.5}); }
      if(F.t<0.2) return; c.rel=true; c.x=o.x; c.z=o.z; c.y=cvvY(o); const x=c.x, y=c.y, z=c.z;
      fxpFlare(hand.x,hand.y,hand.z,0xffffff,R*0.7,0.5); spawnRingAt(x,y,z,R,0xffffff); spawnRingAt(x,y+0.3,z,R*0.65,CVV_COL.glow);
      fxxDome(x,y,z,R,0xfff0c0); fxpSparks(hand.x,hand.y,hand.z,0xfff6d0,fxpN(28),12,{up:2,size:0.24,life:0.7});
      if(o===P||Math.hypot(P.x-x,P.z-z)<R+4) fxxFlash(0xffffff,o===P?0.5:0.3);
      c.star=new THREE.Mesh(CVG.disc,cvvMat(F,0xfff6d0,0)); c.star.material.map=fxdTex('star'); c.star.material.needsUpdate=true; c.star.position.set(x,y+0.08,z); F.g.add(c.star);
      c.spokes=[]; for(let i=0,n=LOW?8:14;i<n;i++){ const s=new THREE.Mesh(CVG.spoke,cvvMat(F,i%2?0xfff0c0:0xffffff,0.75)); s.position.set(x,y+0.12,z); s.rotation.y=i/n*TAU+AR(-0.05,0.05); F.g.add(s); c.spokes.push(s); }
      c.blind=[]; for(const m of MONS){ if(m.dead||!m.g.visible||Math.hypot(m.x-x,m.z-z)>R+m.T.rad*m.s) continue; c.blind.push({m,until:F.t+(m.boss?FL.bossDur:FL.blind*L),next:0}); if(c.blind.length>=8) break; }
      cvvSnd(x,z,s=>{ tone({bus:'ui',type:'sine',freq:420,freq2:1900,dur:0.35,vol:0.12*s.gain,pan:s.pan}); noiseHit({bus:'ui',filter:'highpass',ff:3000,dur:0.4,vol:0.1*s.gain,pan:s.pan}); });
      return; }
    const k=Math.min(1,(F.t-0.2)/0.45); c.star.scale.setScalar(Math.max(0.1,R*(0.2+0.85*k))); c.star.rotation.y+=dt*1.5; c.star.material.opacity=0.9*Math.pow(1-k,1.3);
    for(const s of c.spokes){ s.scale.set(1,1,Math.max(0.1,R*1.05*Math.min(1,k*2.2))); s.material.opacity=0.8*(1-k); }
    if(F.t<1.8&&Math.random()<dt*22*FXP_K){ const a=AR(0,TAU), d=Math.sqrt(Math.random())*R; fxpAdd(c.x+Math.sin(a)*d,c.y+AR(2,5),c.z+Math.cos(a)*d,0,-AR(0.4,1),0,0xfff6d0,0.2,AR(0.8,1.4),{white:0.5}); }   // glints drifting down
    for(const b of c.blind){ if(b.m.dead||F.t>b.until||F.t<b.next) continue; b.next=F.t+0.2;   // a blinded monster: stars over its head while it swings at nothing
      const m=b.m, hy=m.y+m.T.height*m.s+0.3; fxpFlare(m.x,hy,m.z,m.boss?0xffd9a0:0xfff6c0,1.1,0.22); if(Math.random()<0.5) fxpSparks(m.x,hy,m.z,0xffffff,2,2.2,{size:0.14,life:0.3}); } });
}});
// ---- Overdrive: three charged diamonds orbit you; each basic attack you swing breaks one in a crackle of gold ----
caveVisDef('overdrive',{cast(p,ab){
  const pid=cvvPid(p), x=p.x, y=cvvY(p), z=p.z, n=ab.fx.overdrive.n, life=ab.fx.overdrive.sec*cvvLvK(p,ab), hand=new THREE.Vector3();
  spawnRingAt(x,y,z,ab.fx.vis.r,0xffd34d); spawnRingAt(x,y+0.5,z,ab.fx.vis.r*0.6,0xffffff); fxpFlare(x,y+1.1,z,0xffe08a,3.5,0.35); fxpSparks(x,y+1,z,0xffd34d,fxpN(22),9,{up:2,size:0.2,life:0.6});
  const F=cvvAdd('od'+pid,life,(F,dt)=>{
    const o=cvvWho(pid), c=F.data; if(!o||o.dead){ F.t=F.life; return; } const sc=cvvScale(o), gy=cvvY(o);
    const a=cvvAct(o); if(a&&a!==c.seen){ c.seen=a; if(F.t>0.1&&CVV_BASIC.has(a.sk)&&c.live>0){ const i=--c.live, pip=c.pips[i], q=pip.position;   // a basic attack: the next diamond breaks, a bolt jumps to the hand
        cvvHand(o,hand); fxpFlare(q.x,q.y,q.z,0xfff0b0,2,0.25); fxpSparks(q.x,q.y,q.z,0xffd34d,fxpN(12),7,{size:0.18,life:0.4}); fxxBolt([q.x,q.y,q.z],[hand.x,hand.y,hand.z],0xffe08a,0.7); pip.visible=false;
        cvvSnd(o.x,o.z,s=>tone({bus:'ui',type:'square',freq:1500,freq2:400,dur:0.12,vol:0.05*s.gain,pan:s.pan})); if(c.live===0) F.t=Math.max(F.t,F.life-0.4); } }
    const fade=F.life-F.t<0.4?(F.life-F.t)/0.4:1;
    for(let i=0;i<c.live;i++){ const pip=c.pips[i], ang=F.t*3.2+i/n*TAU, rad=Math.min(1,F.t*5)*0.95*sc;
      pip.position.set(o.x+Math.sin(ang)*rad,gy+(1.0+0.12*Math.sin(F.t*6+i))*sc,o.z+Math.cos(ang)*rad); pip.rotation.y+=dt*5; pip.scale.setScalar(0.26*sc*fade);
      if(Math.random()<dt*30*FXP_K) fxpTrail(pip.position.x,pip.position.y,pip.position.z,0xffd34d,0.3,0.25); }
    if(Math.random()<dt*10*FXP_K) fxpAdd(o.x+AR(-0.4,0.4),gy+AR(0.2,1.8)*sc,o.z+AR(-0.4,0.4),AR(-1,1),AR(0.5,1.5),AR(-1,1),0xfff0b0,0.13,0.3,{white:0.6}); });   // the crackle off the skin
  F.data.live=n; F.data.pips=[]; for(let i=0;i<n;i++){ const g=new THREE.Mesh(CVG.gem,cvvMat(F,i%2?0xff9a1a:0xffc62e,1,'norm')); g.scale.setScalar(0.01); F.g.add(g); F.data.pips.push(g); }
  cvvSnd(x,z,s=>{ tone({bus:'ui',type:'sawtooth',freq:200,freq2:900,dur:0.3,vol:0.07*s.gain,pan:s.pan,filter:'lowpass',ff:2400}); });
}});
// ---- Lantern Ward: a lamp-light blooms out to the reach of the ward; the server's cvfx 'ward' puts a lantern dome (full on you, half on an ally) round every hiker it shields ----
function cvvHexTex(){
  if(CVV.hex) return CVV.hex;
  const c=document.createElement('canvas'); c.width=c.height=128; try{ const g=c.getContext('2d'); g.strokeStyle='#fff'; g.lineWidth=2.4; g.globalAlpha=0.9;
    for(let row=0;row<5;row++) for(let col=0;col<5;col++){ const cx=col*30+(row%2?15:0), cy=row*26; g.beginPath(); for(let i=0;i<=6;i++){ const a=i/6*TAU+TAU/12; g[i?'lineTo':'moveTo'](cx+Math.cos(a)*17,cy+Math.sin(a)*17); } g.stroke(); } }catch(_){}
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,2); return (CVV.hex=t);
}
function cvvDome(pid,dur,share){
  const o0=cvvWho(pid); if(!o0) return; const full=share>=1, r=full?1.25:0.95, life=Math.max(0.5,+dur||6);
  const F=cvvAdd('ward'+pid,life,(F,dt)=>{
    const o=cvvWho(pid), c=F.data; if(!o||o.dead){ F.t=F.life; return; } const sc=cvvScale(o), gy=cvvY(o), left=F.life-F.t, grow=Math.min(1,F.t/0.25), fl=left<0.9?0.5+0.5*Math.sin(F.t*34):1;
    c.dome.position.set(o.x,gy+0.95*sc,o.z); c.dome.scale.set(r*sc*grow,r*1.3*sc*grow,r*sc*grow); c.dome.rotation.y+=dt*0.4; c.dome.material.opacity=(full?0.34:0.22)*(0.8+0.2*Math.sin(F.t*3))*fl;
    c.rim.position.set(o.x,gy+0.08,o.z); c.rim.scale.setScalar(r*sc*grow*1.1); c.rim.material.opacity=0.6*fl; c.gem.position.set(o.x,gy+(2.45+0.08*Math.sin(F.t*3))*sc,o.z); c.gem.rotation.y+=dt*2; c.gem.scale.setScalar(0.13*sc*grow*fl);
    if(Math.random()<dt*9*FXP_K){ const a=AR(0,TAU), e=AR(0.1,1.2); fxpRise(o.x+Math.sin(a)*Math.cos(e)*r*sc,gy+(0.95+Math.sin(e)*r*1.3)*sc,o.z+Math.cos(a)*Math.cos(e)*r*sc,CVV_COL.lamp,0.14,AR(0.6,1)); } });
  const dm=cvvMat(F,full?0xffa733:0xffc266,0.3,'norm'); dm.map=cvvHexTex(); const c=F.data; c.dome=new THREE.Mesh(CVG.dome,dm); c.rim=new THREE.Mesh(CVG.ring,cvvMat(F,0xffd27a,0.6)); c.gem=new THREE.Mesh(CVG.gem,cvvMat(F,0xfff0c0,0.95));
  F.g.add(c.dome,c.rim,c.gem); fxpFlare(o0.x,cvvY(o0)+1,o0.z,CVV_COL.lamp,full?4:2.6,0.4);
}
caveVisDef('lanternward',{cast(p,ab){
  const x=p.x, y=cvvY(p), z=p.z, R=ab.fx.ward.r;
  spawnRingAt(x,y,z,R,CVV_COL.lamp); spawnRingAt(x,y+0.4,z,R*0.55,0xffffff); fxpFlare(x,y+1.2,z,CVV_COL.lamp,5,0.5);
  const F=cvvAdd(null,0.9,(F,dt,k)=>{ const m=F.data.m; m.scale.setScalar(Math.max(0.1,R*(0.15+0.85*Math.min(1,k*1.5)))); m.material.opacity=0.55*(1-k)*(1-k); });   // a star of lamp light spreads over the ground to the ward's reach
  const m=new THREE.Mesh(CVG.disc,cvvMat(F,0xffe2a0,0.55)); m.material.map=fxdTex('star'); m.material.needsUpdate=true; m.position.set(x,y+0.08,z); F.g.add(m); F.data.m=m;
  for(let i=0,n=fxpN(16);i<n;i++){ const a=i/n*TAU; fxpAdd(x+Math.sin(a)*R*0.9,y+0.2,z+Math.cos(a)*R*0.9,-Math.sin(a)*3.5,AR(0.8,2),-Math.cos(a)*3.5,CVV_COL.lamp,0.2,AR(0.5,0.9),{white:0.4}); }   // lamp-light motes drawn in to the one who casts
  cvvSnd(x,z,s=>{ tone({bus:'ui',type:'sine',freq:523,dur:0.5,vol:0.07*s.gain,pan:s.pan,verb:true}); tone({bus:'ui',type:'sine',freq:784,dur:0.6,vol:0.05*s.gain,pan:s.pan,when:SND.ctx.currentTime+0.08,verb:true}); });
},event(e){ if(e[0]==='cvfx'&&e[2]==='ward') cvvDome(e[1],e[3],e[4]); }});
