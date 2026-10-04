//@ The bosses, client side: telegraph visuals (circle, cone, line, donut, marks) and how each ends, root spikes, slam waves, shield bubble, roars, boss bar, a boss's look in each mode
/* The fight itself runs on the world server (src/server/boss.js, boss-fx.js). The client draws what it is told:
   'tele' events open a telegraph (kinds: cleave breath and rake are cones, root slam icefall geyser gust swoop rockfall quake mark prison are circles, and so are the dungeon bosses' spore puff pulse vent wail snuff, line a strip, donut a ring;
   mark and prison follow a player), 'tend' closes it (spikes, a shock wave, a flash... if it went off), and each snapshot carries every boss's state
   (kept on its view as m.bs: engaged, phase, immune, enraged, stunned, aux a number for the bar, mode 0 normal / 1 airborne / 2 hidden / 3 shielded /
   4 whiteout / 5 blizzard). BOSS.m is the boss nearest to you; the boss bar and the shield follow that one. Zones, waves and what happens to you
   (frozen, slowed, shoved) are in boss-fx.js. */
const BOSS={m:null,list:[],tele:new Map(),fx:[],shield:null,engaged:false,phase:1,immune:false,enraged:false,stunned:false,aux:0,mode:0};
const teleFill=new THREE.CircleGeometry(1,40).rotateX(-Math.PI/2), teleEdge=new THREE.RingGeometry(0.94,1,56).rotateX(-Math.PI/2);
const teleLine=new THREE.PlaneGeometry(2,1).translate(0,0.5,0).rotateX(-Math.PI/2);   // a strip of half-width 1 running from the origin along -z: scale x = half-width, z = length; rotation.y = face
const spikeGeo=merge([pc(new THREE.ConeGeometry(0.22,1.6,6).translate(0,0.8,0),(x,y,z,c)=>c.set(0x3a2a1e).lerp(_tint.set(0x7a4a8a),clamp(y/1.6)))]);
const iceSpikeMat=new THREE.MeshBasicMaterial({color:0xcdf1ff,transparent:true,opacity:0.92}), dustMat=fxMat(0xd8c090,0.8), columnGeo=new THREE.CylinderGeometry(0.9,1.3,1,10,1,true).translate(0,0.5,0);
BOSS.shield=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),fxMat(0x7af0a0,0.2)); BOSS.shield.visible=false; scene.add(BOSS.shield);
function applyBossState(b){
  if(!Array.isArray(b)) return;
  for(const a of b){ const m=MON_BY_ID.get(a[0]); if(m) m.bs={engaged:!!a[1],phase:a[2],immune:!!a[3],enraged:!!a[4],stunned:!!a[5],aux:a[6]||0,mode:a[7]||0}; }
  pickBoss();
}
const bossInfo=m=>BOSS_DEFS.find(b=>b.def===m.def)||DG_BOSS_DEFS[m.def.id];   // dungeons: a dungeon boss's row (shared/dungeons/bosses.js)
const arenaOf=m=>{ const bd=bossInfo(m); if(bd&&bd.dungeon) return {x:m.camp.x,z:m.camp.z,r:DG_BOSS_R}; return ARENAS.find(A=>A.key===(bd?bd.arena:'boss'))||ARENA; };   // dungeons: a dungeon boss's arena is its hall (its camp is the hall's middle)
// the boss you are closest to drives the boss bar and the shared flags below
function pickBoss(){
  let best=null,bd=1e9; for(const m of BOSS.list){ const d=Math.hypot(m.x-P.x,m.z-P.z); if(d<bd){ bd=d; best=m; } }
  BOSS.m=best; const s=best&&best.bs||{};
  BOSS.engaged=!!s.engaged; BOSS.phase=s.phase||1; BOSS.immune=!!s.immune; BOSS.enraged=!!s.enraged; BOSS.stunned=!!s.stunned; BOSS.aux=s.aux||0; BOSS.mode=s.mode||0;
}
const TELE_COL={cleave:0xff5a8a,breath:0x8fdcff,root:0xff3a2a,slam:0xff9a2a,icefall:0x9fe0ff,geyser:0x3ac8e8,gust:0xc8f0ff,line:0xfff07a,mark:0xff4a2a,prison:0x7fd8ff,rake:0xffc04a,swoop:0xffe08a,rockfall:0xb8905a,quake:0xc8a060,
  spore:0xa8e060,puff:0xe0f0a0,pulse:0x9ae050,vent:0xeaf6f0,wail:0xb8c8f0,snuff:0x5a6a90};   // the last six: the dungeon bosses' circles (a cloud's warning, a puffball, Amanita's pulse, a steam vent, Haugbui's wail, a lamp going dark)
function addTele(id,kind,x,z,r,dur,face,half){
  if(BOSS.tele.has(id)) return;
  const el=BOSS.m&&BOSS.m.def.el, col=kind==='donut'?(el==='fire'?0xff7a2a:0x8fdcff):TELE_COL[kind]||0xff3a2a, own=[];
  let fg=teleFill, eg=teleEdge, follow=null;
  if(kind==='cleave'||kind==='breath'||kind==='rake'){ const ph=face+Math.PI/2; fg=new THREE.CircleGeometry(1,24,ph-half,half*2).rotateX(-Math.PI/2); eg=new THREE.RingGeometry(0.9,1,24,1,ph-half,half*2).rotateX(-Math.PI/2); own.push(fg,eg); }
  else if(kind==='line'){ fg=eg=teleLine; }
  else if(kind==='donut'){ fg=new THREE.RingGeometry(half/r,1,56).rotateX(-Math.PI/2); own.push(fg); }
  else if(kind==='mark'||kind==='prison') follow=String(half);
  const fill=new THREE.Mesh(fg,fxMat(col,kind==='donut'?0.1:0.28)), edge=new THREE.Mesh(eg,fxMat(col,kind==='line'?0.35:0.9));
  const y=getH(x,z)+0.08; fill.position.set(x,y,z); edge.position.set(x,y+0.01,z);
  if(kind==='line'){ fill.rotation.y=edge.rotation.y=face; fill.scale.set(half,1,0.01); edge.scale.set(half,1,r); }
  else { edge.scale.setScalar(r); fill.scale.setScalar(kind==='donut'?r:0.01); }
  scene.add(fill,edge); BOSS.tele.set(id,{x,z,r,t:0,dur,kind,fill,edge,half,follow,own});
  if(SND.ready){ const s=spatial(x,z,10,60); if(s) noiseHit({bus:'ui',filter:'lowpass',ff:160,dur:0.6,vol:0.18*s.gain,pan:s.pan}); }
}
function disposeTele(e){ scene.remove(e.fill,e.edge); e.fill.material.dispose(); e.edge.material.dispose(); for(const g of e.own) g.dispose(); }
const bossFxAdd=f=>{ BOSS.fx.push(f); return f; };
function endTele(id,fired,x,z){
  const e=BOSS.tele.get(id); if(!e) return; BOSS.tele.delete(id);
  if(!fired){ disposeTele(e); return; }
  if(x!==undefined){ e.x=x; e.z=z; }
  const y=getH(e.x,e.z), c=new THREE.Vector3(e.x,y+0.6,e.z), near=Math.hypot(P.x-e.x,P.z-e.z);
  const boom=(vol)=>{ if(SND.ready){ const s=spatial(e.x,e.z,10,60); if(s) noiseHit({bus:'ui',filter:'bandpass',ff:900,ff2:300,dur:0.35,vol:vol*s.gain,pan:s.pan}); } };
  if(e.kind==='line'||e.kind==='donut'||e.kind==='breath'){   // the warning flashes bright and fades where it stood
    scene.remove(e.edge); e.edge.material.dispose(); e.fill.material.opacity=0.9; bossFxAdd({o:e.fill,t:0,life:0.35,kind:'flash',dispose:()=>{ scene.remove(e.fill); e.fill.material.dispose(); for(const g of e.own) g.dispose(); }});
    if(e.kind==='breath'){ spawnBurst(c,0xdff4ff,1.6); cSfx.boom(c); } else boom(0.16);
    if(e.kind==='donut'){ spawnRingAt(e.x,y,e.z,e.r,e.fill.material.color.getHex()); if(near<25) camShake=Math.max(camShake,0.3); }
    return;
  }
  disposeTele(e);
  if(e.kind==='cleave'||e.kind==='rake'){ cSfx.swing(true); return; }
  if(e.kind==='root'||e.kind==='icefall'||e.kind==='rockfall'){
    const ice=e.kind==='icefall', grp=new THREE.Group(); grp.position.set(e.x,y,e.z);
    for(let i=0;i<7;i++){ const s=new THREE.Mesh(spikeGeo,ice?iceSpikeMat:matChar), a=AR(0,TAU), r=i?AR(0.3,e.r*0.85):0; s.position.set(Math.sin(a)*r,0,Math.cos(a)*r); s.rotation.set(AR(-0.3,0.3),0,AR(-0.3,0.3)); s.scale.setScalar(AR(0.7,1.3)*(ice?1.5:1)); grp.add(s); }
    scene.add(grp); bossFxAdd({o:grp,t:0,life:0.9,kind:'spikes',dispose:()=>scene.remove(grp)});
    if(ice) spawnBurst(c,0xdff4ff,0.8);
    if(SND.ready){ const s=spatial(e.x,e.z,10,60); if(s){ noiseHit({bus:'ui',filter:ice?'highpass':'bandpass',ff:ice?1800:900,ff2:300,dur:0.35,vol:0.22*s.gain,pan:s.pan}); for(let i=0;i<4;i++) noiseHit({bus:'ui',filter:'highpass',ff:2500,dur:0.03,vol:0.1*s.gain,pan:s.pan,when:SND.ctx.currentTime+i*0.04}); } }
  } else if(e.kind==='geyser'){
    const col=new THREE.Mesh(columnGeo,fxMat(0x8fe4ff,0.6)); col.position.set(e.x,y,e.z); col.scale.set(e.r*0.4,1,e.r*0.4); scene.add(col);
    bossFxAdd({o:col,t:0,life:0.7,kind:'column',dispose:()=>{ scene.remove(col); col.material.dispose(); }});
    spawnRingAt(e.x,y,e.z,e.r,0x8fe4ff); spawnBurst(c,0xdff8ff,0.7); boom(0.2);
  } else if(e.kind==='vent'){   // a steam vent: a white column of steam
    const col=new THREE.Mesh(columnGeo,fxMat(0xf2fbf6,0.5)); col.position.set(e.x,y,e.z); col.scale.set(e.r*0.45,1,e.r*0.45); scene.add(col);
    bossFxAdd({o:col,t:0,life:0.9,kind:'column',dispose:()=>{ scene.remove(col); col.material.dispose(); }}); spawnBurst(c,0xffffff,0.9); boom(0.16);
  } else if(e.kind==='spore'||e.kind==='puff'){ spawnBurst(c,0xc8f080,e.kind==='puff'?2.2:1); spawnRingAt(e.x,y,e.z,e.r,0xb8e070); boom(e.kind==='puff'?0.22:0.12); }   // a burst of spores (the cloud is a zone)
  else if(e.kind==='pulse'||e.kind==='wail'){ const col=e.kind==='pulse'?0xa8f060:0xc8d8ff; spawnRingAt(e.x,y,e.z,e.r,col); spawnRingAt(e.x,y+0.6,e.z,e.r*0.6,col); boom(0.26); if(near<e.r+5) camShake=Math.max(camShake,0.35); }   // the hall-wide hits
  else if(e.kind==='snuff'){ spawnBurst(c,0x202838,1.4); spawnRingAt(e.x,y,e.z,e.r,0x5a6a90); boom(0.14); }
  else if(e.kind==='mark'){ spawnBurst(c,0xff8a3a,2.2); spawnBurst(c,0xffffff,0.9); spawnRingAt(e.x,y,e.z,e.r,0xff7a2a); cSfx.boom(c); if(near<30) camShake=Math.max(camShake,0.4); }
  else if(e.kind==='prison'){ spawnBurst(c,0xcdf1ff,1.1); spawnRingAt(e.x,y,e.z,e.r,0x9fe8ff); boom(0.2); }
  else if(e.kind==='gust'){ spawnRingAt(e.x,y,e.z,e.r,0xdff4ff); spawnRingAt(e.x,y+0.5,e.z,e.r*0.6,0xffffff); cSfx.boom(c); if(near<30) camShake=Math.max(camShake,0.35); }
  else {   // slam
    const ring=new THREE.Mesh(new THREE.RingGeometry(0.8,1,48).rotateX(-Math.PI/2),fxMat(0xffb04a,0.8));
    ring.position.set(e.x,y+0.2,e.z); scene.add(ring); bossFxAdd({o:ring,t:0,life:0.6,kind:'wave',r:e.r,dispose:()=>{ scene.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }});
    cSfx.boom({x:e.x,z:e.z}); if(near<25) camShake=Math.max(camShake,0.4);
  }
}
function clearBossVisuals(){ [...BOSS.tele.keys()].forEach(id=>endTele(id,false)); clearBossZones(); }
function bossRoar(id){ const m=(id!=null&&MON_BY_ID.get(id))||BOSS.m; if(!SND.ready||!m) return; const s=spatial(m.x,m.z,20,120); if(!s) return; tone({bus:'ui',type:'sawtooth',freq:70,freq2:42,dur:1.6,vol:0.16*s.gain,filter:'lowpass',ff:500,pan:s.pan}); tone({bus:'ui',type:'sawtooth',freq:105,freq2:60,dur:1.4,vol:0.08*s.gain,filter:'lowpass',ff:700,pan:s.pan}); }
function updateBossFx(dt){
  for(let i=BOSS.fx.length-1;i>=0;i--){ const f=BOSS.fx[i]; f.t+=dt; const k=f.t/f.life;
    if(f.kind==='spikes') f.o.scale.set(1,k<0.2?k/0.2:Math.max(0.01,1-(k-0.6)/0.4),1);
    else if(f.kind==='wave'){ f.o.scale.setScalar(0.5+k*f.r); f.o.material.opacity=0.8*(1-k); }
    else if(f.kind==='flash') f.o.material.opacity=0.9*(1-k);
    else if(f.kind==='column'){ f.o.scale.y=Math.min(1,k*5)*6; f.o.material.opacity=0.6*(1-k*k); }
    if(f.t>=f.life){ f.dispose(); BOSS.fx.splice(i,1); } }
  for(const e of BOSS.tele.values()){
    e.t+=dt; const k=Math.min(1,e.t/e.dur);
    if(e.follow){ const q=e.follow===NET.pid?P:REMOTES.get(e.follow); if(q){ e.x=q.x; e.z=q.z; const y=getH(e.x,e.z)+0.08; e.fill.position.set(e.x,y,e.z); e.edge.position.set(e.x,y+0.01,e.z); } }
    if(e.kind==='line') e.fill.scale.z=Math.max(0.01,k*e.r);
    else if(e.kind==='donut') e.fill.material.opacity=0.1+0.3*k;
    else e.fill.scale.setScalar(Math.max(0.01,k*e.r));
    e.edge.material.opacity=(e.kind==='line'?0.25:0.55)+0.4*Math.sin(t*14)*(e.kind==='line'?0.5:1);
  }
  updateBossZones(dt);
  const m=BOSS.m;
  BOSS.shield.visible=!!(m&&!m.dead&&m.g.visible&&BOSS.mode===3);
  if(BOSS.shield.visible){
    const bd=bossInfo(m); if(bd&&bd.totem&&BOSS.shieldFor!==bd){ BOSS.shieldFor=bd; BOSS.shield.material.color.setHex(bd.totem.pal.crystal||0x7af0a0); } BOSS.shield.position.set(m.x,m.y+m.T.height*0.5,m.z); BOSS.shield.scale.setScalar(m.T.height*0.62*(1+Math.sin(t*3)*0.03)); }
}
// what a boss looks like right now: the flash of a hit, the enraged glow, and its mode: airborne (a leap, a wyrm in flight) lifts it off the ground, hidden (burrowed, vanished) hides it in a puff
function bossVisual(m,dt){
  const bs=m.bs||{}, gl=m.mat.userData.glow, en=bs.enraged?(0.25+0.2*Math.sin(t*6)):0, st=bs.stunned?0.25:0, mode=bs.mode||0;
  m.mat.emissive.setRGB(gl.r+m.flash*0.9+en+st,gl.g+m.flash*0.35+st,gl.b+m.flash*0.3+st);
  m.lift=(m.lift||0)+((mode===1?(m.model==='wyrm'?6:4.5):0)-(m.lift||0))*(1-Math.exp(-5*dt));
  m.g.position.y+=m.lift;
  const hid=mode===2;
  if(hid!==!!m.hid){ m.hid=hid; const c=monCenter(m); spawnBurst(c,m.def.el==='light'?0xfff0c0:0xd8c090,1.5*m.T.scale*0.5); if(SND.ready){ const s=spatial(m.x,m.z,10,80); if(s) noiseHit({bus:'ui',filter:'lowpass',ff:500,dur:0.5,vol:0.2*s.gain,pan:s.pan}); } }
  if(hid){ m.g.visible=false; if(Math.random()<dt*14){ const e=new THREE.Mesh(emberGeo,dustMat); e.position.set(m.x+AR(-1,1),m.y+0.2,m.z+AR(-1,1)); scene.add(e); CB.fx.push({mesh:e,life:0.6,max:0.6,shrink:true}); } }
}
function updateBossUI(){
  const m=BOSS.m, bb=$('#bossbar');
  if(!m||!BOSS.engaged||m.dead||!started){ bb.hidden=true; return false; }
  const A=arenaOf(m); if(Math.hypot(P.x-A.x,P.z-A.z)>A.r+40){ bb.hidden=true; return false; }
  bb.hidden=false; $('#bbHp').style.width=(m.hp/m.maxHp*100)+'%';
  if(BOSS.shown!==m){ BOSS.shown=m; $('#bbName').textContent=m.def.name; }
  const bbLv='Lv '+monTierK(m).lv+' boss'; if($('#bbLv').textContent!==bbLv) $('#bbLv').textContent=bbLv;
  const bd=bossInfo(m)||{}, bar=bd.bar||{};
  $('#bbPhase').textContent=BOSS.mode===3?'Shielded: break the '+(bd.totems||'totems')+' ('+BOSS.aux+' left)':BOSS.stunned?(bar.stun||'Stunned!'):bar[BOSS.mode]||(BOSS.enraged?'Enraged':'');
  const dgBar=dgBossBarText(bd,bar); if(dgBar) $('#bbPhase').textContent=dgBar;   // dungeons: what a dungeon boss's number means (its dish, its puffballs, its lamps)
  return true;
}
