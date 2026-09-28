//@ The bosses, client side (Rootwarden, Akaoni, Kyuubi): telegraph visuals, root spikes, slam waves, shield bubble, roars, boss bar
/* The fight itself runs on the world server (src/server/boss.js). The client draws what it is told:
   'tele' events open a telegraph (pink cone = cleave, red circle = roots, orange circle = slam),
   'tend' closes it (with spikes or a shock wave if it went off), and each snapshot carries every boss's state
   (kept on its view as m.bs). BOSS.m is the boss nearest to you; the boss bar and the shield follow that one. */
const BOSS={m:null,list:[],tele:new Map(),fx:[],shield:null,engaged:false,phase:1,immune:false,enraged:false,stunned:false,totems:0};
const teleFill=new THREE.CircleGeometry(1,40).rotateX(-Math.PI/2), teleEdge=new THREE.RingGeometry(0.94,1,56).rotateX(-Math.PI/2);
const spikeGeo=merge([pc(new THREE.ConeGeometry(0.22,1.6,6).translate(0,0.8,0),(x,y,z,c)=>c.set(0x3a2a1e).lerp(_tint.set(0x7a4a8a),clamp(y/1.6)))]);
BOSS.shield=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),fxMat(0x7af0a0,0.2)); BOSS.shield.visible=false; scene.add(BOSS.shield);
function applyBossState(b){
  if(!Array.isArray(b)) return;
  for(const a of b){ const m=MON_BY_ID.get(a[0]); if(m) m.bs={engaged:!!a[1],phase:a[2],immune:!!a[3],enraged:!!a[4],stunned:!!a[5],totems:a[6]}; }
  pickBoss();
}
const bossInfo=m=>BOSS_DEFS.find(b=>b.def===m.def);
const arenaOf=m=>{ const bd=bossInfo(m); return ARENAS.find(A=>A.key===(bd?bd.arena:'boss'))||ARENA; };
// the boss you are closest to drives the boss bar and the shared flags below
function pickBoss(){
  let best=null,bd=1e9; for(const m of BOSS.list){ const d=Math.hypot(m.x-P.x,m.z-P.z); if(d<bd){ bd=d; best=m; } }
  BOSS.m=best; const s=best&&best.bs||{};
  BOSS.engaged=!!s.engaged; BOSS.phase=s.phase||1; BOSS.immune=!!s.immune; BOSS.enraged=!!s.enraged; BOSS.stunned=!!s.stunned; BOSS.totems=s.totems||0;
}
function addTele(id,kind,x,z,r,dur,face,half){
  if(BOSS.tele.has(id)) return;
  const col=kind==='slam'?0xff9a2a:kind==='cleave'?0xff5a8a:0xff3a2a;
  let fg=teleFill, eg=teleEdge;
  if(kind==='cleave'){ const ph=face+Math.PI/2; fg=new THREE.CircleGeometry(1,24,ph-half,half*2).rotateX(-Math.PI/2); eg=new THREE.RingGeometry(0.9,1,24,1,ph-half,half*2).rotateX(-Math.PI/2); }
  const fill=new THREE.Mesh(fg,fxMat(col,0.28)), edge=new THREE.Mesh(eg,fxMat(col,0.9));
  const y=getH(x,z)+0.08; fill.position.set(x,y,z); edge.position.set(x,y+0.01,z); edge.scale.setScalar(r); fill.scale.setScalar(0.01);
  scene.add(fill,edge); BOSS.tele.set(id,{x,z,r,t:0,dur,kind,fill,edge,own:kind==='cleave'});
  if(SND.ready){ const s=spatial(x,z,10,60); if(s) noiseHit({bus:'ui',filter:'lowpass',ff:160,dur:0.6,vol:0.18*s.gain,pan:s.pan}); }
}
function disposeTele(e){ scene.remove(e.fill,e.edge); e.fill.material.dispose(); e.edge.material.dispose(); if(e.own){ e.fill.geometry.dispose(); e.edge.geometry.dispose(); } }
function endTele(id,fired){
  const e=BOSS.tele.get(id); if(!e) return; BOSS.tele.delete(id); disposeTele(e);
  if(!fired) return;
  if(e.kind==='cleave'){ cSfx.swing(true); return; }
  if(e.kind==='root'){
    const grp=new THREE.Group(); grp.position.set(e.x,getH(e.x,e.z),e.z);
    for(let i=0;i<7;i++){ const s=new THREE.Mesh(spikeGeo,matChar); const a=AR(0,TAU), r=i?AR(0.3,e.r*0.85):0; s.position.set(Math.sin(a)*r,0,Math.cos(a)*r); s.rotation.set(AR(-0.3,0.3),0,AR(-0.3,0.3)); s.scale.setScalar(AR(0.7,1.3)); grp.add(s); }
    scene.add(grp); BOSS.fx.push({o:grp,t:0,life:0.9,kind:'spikes'});
    if(SND.ready){ const s=spatial(e.x,e.z,10,60); if(s){ noiseHit({bus:'ui',filter:'bandpass',ff:900,ff2:300,dur:0.35,vol:0.22*s.gain,pan:s.pan}); for(let i=0;i<4;i++) noiseHit({bus:'ui',filter:'highpass',ff:2500,dur:0.03,vol:0.1*s.gain,pan:s.pan,when:SND.ctx.currentTime+i*0.04}); } }
  } else {
    const ring=new THREE.Mesh(new THREE.RingGeometry(0.8,1,48).rotateX(-Math.PI/2),fxMat(0xffb04a,0.8));
    ring.position.set(e.x,getH(e.x,e.z)+0.2,e.z); scene.add(ring); BOSS.fx.push({o:ring,t:0,life:0.6,kind:'wave',r:e.r});
    cSfx.boom({x:e.x,z:e.z}); if(Math.hypot(P.x-e.x,P.z-e.z)<25) camShake=Math.max(camShake,0.4);
  }
}
function clearBossVisuals(){ [...BOSS.tele.keys()].forEach(id=>endTele(id,false)); }
function bossRoar(id){ const m=(id!=null&&MON_BY_ID.get(id))||BOSS.m; if(!SND.ready||!m) return; const s=spatial(m.x,m.z,20,120); if(!s) return; tone({bus:'ui',type:'sawtooth',freq:70,freq2:42,dur:1.6,vol:0.16*s.gain,filter:'lowpass',ff:500,pan:s.pan}); tone({bus:'ui',type:'sawtooth',freq:105,freq2:60,dur:1.4,vol:0.08*s.gain,filter:'lowpass',ff:700,pan:s.pan}); }
function updateBossFx(dt){
  for(let i=BOSS.fx.length-1;i>=0;i--){ const f=BOSS.fx[i]; f.t+=dt; const k=f.t/f.life;
    if(f.kind==='spikes') f.o.scale.set(1,k<0.2?k/0.2:Math.max(0.01,1-(k-0.6)/0.4),1);
    else { f.o.scale.setScalar(0.5+k*f.r); f.o.material.opacity=0.8*(1-k); }
    if(f.t>=f.life){ scene.remove(f.o); if(f.kind==='wave'){ f.o.geometry.dispose(); f.o.material.dispose(); } BOSS.fx.splice(i,1); } }
  for(const e of BOSS.tele.values()){ e.t+=dt; const k=Math.min(1,e.t/e.dur); e.fill.scale.setScalar(Math.max(0.01,k*e.r)); e.edge.material.opacity=0.55+0.4*Math.sin(t*14); }
  const m=BOSS.m;
  BOSS.shield.visible=!!(m&&!m.dead&&m.g.visible&&BOSS.immune);
  if(BOSS.shield.visible){ BOSS.shield.position.set(m.x,m.y+m.T.height*0.5,m.z); BOSS.shield.scale.setScalar(m.T.height*0.62*(1+Math.sin(t*3)*0.03)); }
}
function bossVisual(m,dt){
  const bs=m.bs||{}, gl=m.mat.userData.glow, en=bs.enraged?(0.25+0.2*Math.sin(t*6)):0, st=bs.stunned?0.25:0;
  m.mat.emissive.setRGB(gl.r+m.flash*0.9+en+st,gl.g+m.flash*0.35+st,gl.b+m.flash*0.3+st);
}
function updateBossUI(){
  const m=BOSS.m, bb=$('#bossbar');
  if(!m||!BOSS.engaged||m.dead||!started){ bb.hidden=true; return false; }
  const A=arenaOf(m); if(Math.hypot(P.x-A.x,P.z-A.z)>A.r+40){ bb.hidden=true; return false; }
  bb.hidden=false; $('#bbHp').style.width=(m.hp/m.maxHp*100)+'%';
  if(BOSS.shown!==m){ BOSS.shown=m; $('#bbName').textContent=m.def.name; $('#bbLv').textContent='Lv '+m.def.level+' boss'; }
  $('#bbPhase').textContent=BOSS.immune?'Shielded: break the '+((bossInfo(m)||{}).totems||'totems')+' ('+BOSS.totems+' left)':BOSS.stunned?'Stunned!':BOSS.enraged?'Enraged':'';
  return true;
}
