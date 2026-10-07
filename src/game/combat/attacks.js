//@ Targeting and attacks (sent to the server), plus the visuals for server combat events: damage, kills, projectiles
/* Pressing attack plays your swing and its sounds straight away and tells the server; the server decides
   what gets hit and sends back 'dmg' / 'kill' / 'proj' / 'pend' events, which are drawn here. */
function pickTarget(range){
  const fx=-Math.sin(P.yaw), fz=-Math.cos(P.yaw); let best=null, bs=1e9;
  for(const m of MONS){
    if(m.dead||!m.g.visible) continue;
    const dx=m.x-P.x, dz=m.z-P.z, d=Math.hypot(dx,dz); if(d>range) continue;
    const ang=Math.acos(clamp((dx*fx+dz*fz)/(d||1),-1,1));
    if(ang>1.25 && d>3.5) continue;
    const s=d+ang*7; if(s<bs){ bs=s; best=m; }
  }
  return best;
}
function cycleTarget(){
  const list=MONS.filter(m=>!m.dead&&m.g.visible&&Math.hypot(m.x-P.x,m.z-P.z)<32).sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z));
  if(!list.length){ CB.target=null; return; }
  const i=list.indexOf(CB.target); CB.target=list[(i+1)%list.length];
}
function doAttack(kind){
  if(!started||!NET.ready||uiOpen()||PL.dead||CB.act||CB.cd[kind]>0) return;
  const c=clsOf(), ab=abilityOf(c,kind,GEAR.skills,PL.level);
  if(!ab){ // the slot is locked or empty
    if(PL.level<slotLv(kind)){ toast('Your '+kind+' slot opens at level '+slotLv(kind),'bad'); UI_SFX.error(); }
    else openSkills(null,kind);
    return;
  }
  const tgtOK=CB.target&&!CB.target.dead&&Math.hypot(CB.target.x-P.x,CB.target.z-P.z)<=ab.range+3;
  if(!tgtOK){ const t2=pickTarget(Math.max(ab.range+2,8)); if(t2) CB.target=t2; }
  const [k,dur,hitAt]=ab.act;
  CB.act={kind:ANIM_OF[k]||k,sk:k,t:0,dur,hitAt,done:false,skill:kind==='skill'};
  CB.cd[kind]=abilityCd(ab,GEAR.skills,PL.level,c)*(kind==='basic'&&CB.buff?CB.buff.cd:1)*(1-ssHasteK());   // skillsets: the class the bonuses are read for
  const T=CB.target;
  if(T && !T.dead && Math.hypot(T.x-P.x,T.z-P.z)<ab.range+6) P.face=Math.atan2(-(T.x-P.x),-(T.z-P.z));
  else P.face=P.yaw;
  const a=aimDir();
  netSend({t:'atk',k:kind,tg:T&&!T.dead?T.id:null,face:Math.round(P.face*1000)/1000,aim:[a.x,a.y,a.z].map(v=>Math.round(v*1000)/1000)});
  if(k==='charge') startCharge(T);
  else if(ACT_SKILL[k]&&ACT_SKILL[k].fx&&ACT_SKILL[k].fx.dash) startCharge(T,ACT_SKILL[k].range,ACT_SKILL[k].fx.dash.ahead);
  if(k==='quake'||k==='inferno'||k==='bladestorm'||k==='berserk') cSfx.swing(true);
  if(k==='hail'||k==='snipe'||k==='focus') cSfx.draw();
  if(k==='shard'||k==='missiles'||k==='blizzard'||k==='surge') cSfx.charge(k!=='shard');
  if(k==='slash'||k==='spin'||k==='bash'||k==='charge') cSfx.swing(k!=='slash');
  if(k==='shoot'||k==='volley'||k==='pierce'||k==='rain') cSfx.draw();
  if(k==='cast'||k==='nova'||k==='chain'||k==='meteor') cSfx.charge(k==='nova'||k==='meteor');
}
// local swing visuals at the moment the blow lands (the damage itself comes from the server)
function attackVisuals(a,who){
  const x=who?who.x:P.x, y=who?who.y:P.y, z=who?who.z:P.z, face=who?who.face:P.face, sc=who?who.scale:hiker.scale, mine=!who, k=a.sk||a.kind;
  const gs=ACT_SKILL[k]; if(gs&&gs.fx){ fxVisuals(gs,x,y,z,face,sc,mine); return; }   // a skill with generic effects (the boss skills)
  if(k==='bash'){ spawnArcAt(x,y+0.9*sc,z,face); const fx=x-Math.sin(face)*1.6, fz=z-Math.cos(face)*1.6; spawnRingAt(fx,getH(fx,fz),fz,2.4,0xffe08a);
    if(mine&&SND.ready){ noiseHit({bus:'ui',filter:'lowpass',ff:420,dur:0.22,vol:0.3}); tone({bus:'ui',type:'triangle',freq:180,freq2:90,dur:0.2,vol:0.08}); } }
  else if(k==='charge'){ spawnRingAt(x,y,z,3.2,0xffc070); spawnBurst(new THREE.Vector3(x,y+0.3,z),0xd8b07a,1.2); if(mine){ cSfx.boom({x,z}); camShake=Math.max(camShake,0.3); } }
  else if(k==='quake'){ for(let i=0;i<3;i++) spawnRingAt(x,getH(x,z),z,3+i*2.3,i?0xd8b07a:0xfff0c0); spawnBurst(new THREE.Vector3(x,y+0.2,z),0x8a6a44,2.2);
    for(let i=0;i<10;i++){ const a=i/10*TAU+AR(-0.2,0.2), r=AR(2,6.5); spawnBurst(new THREE.Vector3(x+Math.sin(a)*r,getH(x+Math.sin(a)*r,z+Math.cos(a)*r)+0.2,z+Math.cos(a)*r),0x6a5030,0.5); }
    cSfx.boom({x,z}); if(mine||Math.hypot(P.x-x,P.z-z)<25) camShake=Math.max(camShake,0.55); }
  else if(k==='inferno'){ for(let i=0;i<3;i++) spawnRingAt(x,y+0.3*i,z,3+i*2.2,[0xff5a1a,0xffa040,0xfff0b0][i]); spawnBurst(new THREE.Vector3(x,y+0.8,z),0xff7a2a,3);
    for(let i=0;i<14;i++){ const a=i/14*TAU, r=AR(3,6.5); spawnBurst(new THREE.Vector3(x+Math.sin(a)*r,y+0.6,z+Math.cos(a)*r),0xff8a3a,0.7); }
    cSfx.boom({x,z}); if(mine) camShake=Math.max(camShake,0.45); }
  else if(k==='berserk'||k==='focus'||k==='surge'){ const col=k==='berserk'?0xff4a3a:k==='focus'?0x9fe08a:0xb08aff; spawnRingAt(x,y,z,2.6,col); spawnRingAt(x,y+1.2,z,1.6,col); }
  else if(k==='pierce'||k==='rain'||k==='hail'||k==='snipe'){ if(mine) cSfx.twang(); }
  else if(k==='chain'||k==='meteor'||k==='shard'||k==='missiles'||k==='blizzard'){ if(mine) cSfx.whoosh(); }
  else if(a.kind==='slash') spawnArcAt(x,y+1.0*sc,z,face);
  else if(a.kind==='spin') spawnRingAt(x,y+0.8,z,3.4,0xeef4ff);
  else if(a.kind==='nova'){ spawnRingAt(x,y,z,5.5,0x9fd8ff); spawnRingAt(x,y+0.6,z,4,0xe8f6ff); if(mine) cSfx.nova(); }
  else if(mine && (a.kind==='shoot'||a.kind==='volley')) cSfx.twang();
  else if(mine && a.kind==='cast') cSfx.whoosh();
}
function spawnBurst(pos,color,size){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(0.5,12,8),fxMat(color,0.6));
  mesh.position.copy(pos); scene.add(mesh);
  CB.fx.push({mesh,life:0.45,max:0.45,grow:size*3,own:true});
}
function spawnRingAt(x,y,z,radius,color,inward){   // inward: shrinks to the middle instead of growing (a pull)
  const mesh=new THREE.Mesh(new THREE.RingGeometry(0.8,1,48).rotateX(-Math.PI/2),fxMat(color,0.8));
  mesh.position.set(x,y+0.15,z); scene.add(mesh);
  CB.fx.push({mesh,life:0.5,max:0.5,grow:radius,ring:true,own:true,inward:!!inward});
}
function spawnRing(radius,color,y){ spawnRingAt(P.x,y||P.y,P.z,radius,color); }
function spawnArcAt(x,y,z,face,col,size){   // col, size (x the normal reach): for skills with a longer reach or an element
  const mesh=new THREE.Mesh(new THREE.RingGeometry(1.2,2.6,24,1,-Math.PI*0.35,Math.PI*0.7).rotateX(-Math.PI/2),fxMat(col||0xeef4ff,0.45));
  mesh.position.set(x,y,z); mesh.rotation.y=face+Math.PI/2; if(size) mesh.scale.setScalar(size); scene.add(mesh);
  CB.fx.push({mesh,life:0.18,max:0.18,grow:0,own:true});
}
/* ---- server combat events ---- */
function onMonDmg(id,v,crit,by,fx){
  const m=MON_BY_ID.get(id); if(!m) return;
  m.flash=1; m.hp=Math.max(0,m.hp-v);
  // your own hits show whether the element helped (an arrow up) or hurt (down): your soul and the monster's element
  const mine=by===NET.pid&&fx, c=monCenter(m); popText(c.x,c.y+m.T.height*0.5*m.s,c.z,String(v)+(mine?(fx>0?'▲':'▼'):''),(crit?'crit':(by===NET.pid?'':'other'))+(mine?(fx>0?' up':' down'):''));
  if(by===NET.pid){ cSfx.hit(m,crit); if(!CB.target||CB.target.dead) CB.target=m; }
  else if(Math.random()<0.5) cSfx.hit(m,crit);
  if(Math.random()<0.4) monSound(m,'hurt');
}
// a monster left one of its materials for you (server event 'drop'): a small note floats up from it
function onDrop(pid,mat,n,monId){
  if(pid!==NET.pid||!MATS[mat]) return;
  const m=MON_BY_ID.get(monId), c=m?monCenter(m):{x:P.x,y:P.y+1,z:P.z};
  popText(c.x-0.4,c.y+(m?m.T.height*0.2*m.s:0),c.z,'+'+n+' '+MATS[mat].name,'drop'); UI_SFX.hover();
}
function onMonImmune(id){ const m=MON_BY_ID.get(id); if(!m) return; const c=monCenter(m); popText(c.x,c.y+m.T.height*0.3,c.z,'Immune','hurt'); }
function onMonKill(id){
  const m=MON_BY_ID.get(id); if(!m) return;
  m.dead=true; m.deadT=0; m.hp=0; m.act=null;
  monSound(m,'die'); spawnBurst(monCenter(m),m.T.color,1.1*m.T.scale);
  if(CB.target===m) CB.target=null;
  if(m.boss){ clearBossVisuals(); }
}
function onMonAct(id,dur){
  const m=MON_BY_ID.get(id); if(!m||m.dead) return;
  if(!m.boss) m.lunge=0.5;
  m.act={kind:'slash',t:0,dur:dur||0.6,slam:dur>2};
  monSound(m,'attack');
}
const arrowOf=()=>new THREE.Mesh(arrowGeo,matChar), orbGeo=new THREE.SphereGeometry(0.4,12,9), orbGlowGeo=new THREE.SphereGeometry(0.75,12,9);
const shardGeo=new THREE.ConeGeometry(0.09,0.7,5).rotateX(Math.PI/2);
function onProj(id,kind,x,y,z,vx,vy,vz,tg){
  let mesh;
  if(kind==='shard'){ mesh=new THREE.Mesh(shardGeo,fxMat(0xbfe8ff,0.95)); }
  else if(kind==='missile'){ mesh=new THREE.Mesh(coreGeo,fxMat(0xd8b0ff,1)); mesh.scale.setScalar(1.6); mesh.add(new THREE.Mesh(boltGeo,fxMat(0x9a6aff,0.55))); }
  else if(kind==='snipe'){ mesh=arrowOf(); mesh.scale.setScalar(2.2); const glow=new THREE.Mesh(coreGeo,fxMat(0xfff0a0,0.9)); glow.scale.set(1.6,1.6,6); mesh.add(glow); }
  else if(kind==='pierce'){ mesh=arrowOf(); mesh.scale.setScalar(1.8); const glow=new THREE.Mesh(coreGeo,fxMat(0xbfe8ff,0.8)); glow.scale.set(1.2,1.2,4); mesh.add(glow); }
  else if(kind==='spore'||kind==='ember'){ mesh=arrowOf(); mesh.scale.setScalar(1.3); const glow=new THREE.Mesh(coreGeo,fxMat(GEN_PROJ[kind],0.85)); glow.scale.set(1.5,1.5,kind==='ember'?5:3); mesh.add(glow); }
  else if(kind==='thorn'){ mesh=new THREE.Mesh(shardGeo,fxMat(GEN_PROJ.thorn,0.95)); mesh.scale.setScalar(1.1); }
  else if(kind==='frost'){ mesh=new THREE.Mesh(shardGeo,fxMat(GEN_PROJ.frost,0.95)); mesh.scale.setScalar(1.3); mesh.add(new THREE.Mesh(coreGeo,fxMat(0xffffff,0.6))); }
  else if(kind==='foxfire'){ mesh=new THREE.Mesh(orbGeo,fxMat(0xbfefff,1)); mesh.add(new THREE.Mesh(orbGlowGeo,fxMat(0x7ac8ff,0.45))); }   // a boss's orb: big and pale blue (Kyuubi)
  else if(kind==='spirit'){ mesh=new THREE.Mesh(coreGeo,fxMat(GEN_PROJ.spirit,1)); mesh.scale.setScalar(2.2); mesh.add(new THREE.Mesh(boltGeo,fxMat(0xffb060,0.5))); }
  else if(kind==='arrow') mesh=arrowOf(); else { mesh=new THREE.Mesh(boltGeo,boltMat); mesh.add(new THREE.Mesh(coreGeo,boltCore)); }
  scene.add(mesh);
  CB.projs.push({id,kind,mesh,pos:new THREE.Vector3(x,y,z),vel:new THREE.Vector3(vx,vy,vz),target:tg!=null?MON_BY_ID.get(tg):null,life:2.2,turn:({arrow:10,shard:8,missile:9,snipe:14,spore:8,ember:9,spirit:9,thorn:0})[kind]||6,emberT:0});
}
function onProjEnd(id,x,y,z,hit){
  const i=CB.projs.findIndex(p=>p.id===id); if(i<0) return;
  const p=CB.projs[i]; scene.remove(p.mesh); CB.projs.splice(i,1);
  const pos=new THREE.Vector3(x,y,z);
  if(p.kind==='bolt'){ cSfx.boom(pos); spawnBurst(pos,0xff8a3a,0.9); }
  else if(p.kind==='shard'){ spawnBurst(pos,0xbfe8ff,0.5); }
  else if(p.kind==='missile'){ spawnBurst(pos,0xb08aff,0.6); }
  else if(p.kind==='snipe'){ spawnBurst(pos,0xfff0a0,1.1); cSfx.boom(pos); }
  else if(p.kind==='ember'){ spawnBurst(pos,0xff8a3a,1.1); spawnRingAt(pos.x,pos.y,pos.z,2.8,0xffa040); cSfx.boom(pos); }
  else if(p.kind==='spore'){ spawnBurst(pos,GEN_PROJ.spore,0.8); spawnRingAt(pos.x,pos.y,pos.z,3.5,GEN_PROJ.spore); }
  else if(p.kind==='thorn'||p.kind==='spirit'){ spawnBurst(pos,GEN_PROJ[p.kind],0.4); }
  else if(p.kind==='foxfire'){ spawnBurst(pos,0x9fe0ff,0.8); spawnRingAt(pos.x,pos.y,pos.z,2.2,0xdff8ff); }
  else if(p.kind==='frost'){ spawnBurst(pos,GEN_PROJ.frost,0.8); spawnRingAt(pos.x,pos.y,pos.z,2.6,GEN_PROJ.frost); }
  else if(hit==null) cSfx.thunk(pos);
}
const _pv2=new THREE.Vector3();
function updateCombat(dt){
  for(const k in CB.cd) CB.cd[k]=Math.max(0,CB.cd[k]-dt);
  if(CB.buff&&performance.now()>CB.buff.until) CB.buff=null;
  if(CB.target && (CB.target.dead || !CB.target.g.visible || Math.hypot(CB.target.x-P.x,CB.target.z-P.z)>45)) CB.target=null;
  if(CB.act){
    const a=CB.act; a.t+=dt;
    if(CB.target && a.kind!=='spin') P.face=angLerp(P.face,Math.atan2(-(CB.target.x-P.x),-(CB.target.z-P.z)),1-Math.exp(-14*dt));
    if(!a.done && a.t>=a.dur*a.hitAt){ a.done=true; attackVisuals(a); }
    if(a.t>=a.dur) CB.act=null;
  }
  // projectiles: drawn locally, flying toward their target; the server says where they ended
  for(let i=CB.projs.length-1;i>=0;i--){
    const p=CB.projs[i]; p.life-=dt;
    if(p.life<=0){ scene.remove(p.mesh); CB.projs.splice(i,1); continue; }
    if(p.target && !p.target.dead){ const want=monCenter(p.target).sub(p.pos).normalize().multiplyScalar(p.vel.length()); p.vel.lerp(want,Math.min(1,p.turn*dt)); }
    else if(p.kind==='arrow') p.vel.y-=4*dt;
    p.pos.addScaledVector(p.vel,dt);
    if(p.kind==='pierce') p.pos.y=getH(p.pos.x,p.pos.z)+1.1;
    if(p.target && !p.target.dead && monCenter(p.target).distanceTo(p.pos)<0.5) p.pos.copy(monCenter(p.target));
    p.mesh.position.copy(p.pos);
    if(p.kind==='arrow'||p.kind==='pierce'||p.kind==='snipe'||p.kind==='shard'||p.kind==='spore'||p.kind==='ember'||p.kind==='thorn'){ _pv2.copy(p.pos).add(p.vel); p.mesh.lookAt(_pv2); }
    else { p.mesh.scale.setScalar(1+Math.sin(t*30)*0.12); p.emberT-=dt; if(p.emberT<=0){ p.emberT=0.025; const e=new THREE.Mesh(emberGeo,emberMat); e.position.copy(p.pos); scene.add(e); CB.fx.push({mesh:e,life:0.35,max:0.35,shrink:true}); } }
  }
  for(let i=CB.fx.length-1;i>=0;i--){
    const f=CB.fx[i]; f.life-=dt; const k=1-f.life/f.max;
    if(f.shrink) f.mesh.scale.setScalar(Math.max(0.01,1-k));
    else if(f.ring){ f.mesh.scale.setScalar(f.inward?0.3+(1-k)*f.grow:0.3+k*f.grow); f.mesh.material.opacity=0.8*(1-k); }
    else if(f.grow){ f.mesh.scale.setScalar(0.3+k*f.grow); f.mesh.material.opacity=0.6*(1-k); }
    else f.mesh.material.opacity=0.45*(1-k);
    if(f.life<=0){ scene.remove(f.mesh); if(f.own){ f.mesh.geometry.dispose(); f.mesh.material.dispose(); } CB.fx.splice(i,1); }
  }
  updateLucky(dt); updateSkillFx(dt);
  const T=CB.target;
  updatePlayerStats(dt);
  updateQuests(dt);
  if(T){ targetRing.visible=true; targetRing.position.set(T.x,T.y+0.06,T.z); targetRing.scale.setScalar(T.T.rad*1.4*T.s+0.3); targetRing.rotation.y+=dt; }
  else targetRing.visible=false;
  updateCombatUI(dt);
}
