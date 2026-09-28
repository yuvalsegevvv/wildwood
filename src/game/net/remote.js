//@ Other players: avatars built from their look and gear, smoothed movement, attack animations, name tags
const REMOTES=new Map();
const ACT_OF={}; for(const c in ACTS){ const a=ACTS[c].basic; ACT_OF[a[0]]={dur:a[1],hitAt:a[2]}; } for(const id in SKILLS){ const a=SKILLS[id].act; ACT_OF[a[0]]={dur:a[1],hitAt:a[2]}; }
const tagPool=[];
function remoteAdd(info){
  if(!info||REMOTES.has(info.id)||info.id===NET.pid) return;
  const r={id:info.id,name:String(info.name||'Hiker').slice(0,20),look:Object.assign({},LOOK_M,info.look||{}),eq:info.eq||{},level:info.level||1,
    x:0,y:0,z:0,face:0,tx:null,ty:0,tz:0,tface:0,walk:0,act:null,hp:1,maxHp:1,dead:false,g:new THREE.Group(),rig:null,scale:1};
  scene.add(r.g); remoteBuild(r); REMOTES.set(r.id,r);
}
function remoteBuild(r){
  if(r.rig){ r.g.remove(r.rig.root); r.rig.root.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
  r.rig=buildCharacter(effectiveLookOf(r.look,{eq:r.eq}));
  r.scale=(r.look.height||1)*(r.look.sex==='female'?0.95:1);
  r.rig.root.scale.setScalar(r.scale); r.g.add(r.rig.root);
  weaponsOn(r.rig,r.eq.weapon,r.look.build||1);
}
function remoteRemove(id){ const r=REMOTES.get(id); if(!r) return; scene.remove(r.g); r.rig.root.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); REMOTES.delete(id); }
function clearRemotes(){ [...REMOTES.keys()].forEach(remoteRemove); }
function remoteSnap(a){ // [id,x,y,z,face,hp,maxHp,level,dead]
  const r=REMOTES.get(a[0]); if(!r) return;
  if(r.tx===null){ r.x=a[1]; r.y=a[2]; r.z=a[3]; r.face=a[4]; }
  r.tx=a[1]; r.ty=a[2]; r.tz=a[3]; r.tface=a[4]; r.hp=a[5]; r.maxHp=a[6]; r.level=a[7]; r.dead=!!a[8];
}
function remoteAct(id,kind,face){ const r=REMOTES.get(id); if(!r) return; const A=ACT_OF[kind]||{dur:0.5,hitAt:0.5}; r.act={kind:ANIM_OF[kind]||kind,sk:kind,t:0,dur:A.dur,hitAt:A.hitAt,done:false}; if(face!=null){ r.tface=face; r.face=face; } }
function remoteGear(id,eq){ const r=REMOTES.get(id); if(!r) return; r.eq=eq; remoteBuild(r); }
function remoteLook(id,look){ const r=REMOTES.get(id); if(!r) return; r.look=Object.assign({},LOOK_M,look); remoteBuild(r); }
function remoteHurt(id,v){ const r=REMOTES.get(id); if(r&&r.g.visible) popText(r.x,r.y+2*r.scale,r.z,'-'+v,'other'); }
function remoteDown(id,down){ const r=REMOTES.get(id); if(r) r.dead=down; }
function remoteLevelUp(id,lv){ const r=REMOTES.get(id); if(!r) return; r.level=lv; if(r.g.visible){ spawnRingAt(r.x,r.y,r.z,3,0xffd34d); popText(r.x,r.y+2.3*r.scale,r.z,'Level '+lv,'xp'); } }
function updateRemotes(dt){
  let ti=0;
  for(const r of REMOTES.values()){
    if(r.tx===null) continue;
    const ox=r.x, oz=r.z, k=1-Math.exp(-12*dt);
    r.x+=(r.tx-r.x)*k; r.z+=(r.tz-r.z)*k; r.y+=(r.ty-r.y)*k;
    if(Math.hypot(r.tx-r.x,r.tz-r.z)>15){ r.x=r.tx; r.z=r.tz; r.y=r.ty; }
    r.face=angLerp(r.face,r.tface,1-Math.exp(-12*dt));
    const sp=Math.min(12,Math.hypot(r.x-ox,r.z-oz)/Math.max(dt,1e-3));
    r.walk+=Math.sqrt(sp)*dt*3.3;
    const d=Math.hypot(r.x-P.x,r.z-P.z); r.g.visible=d<150;
    if(!r.g.visible) continue;
    if(r.act){ r.act.t+=dt; if(!r.act.done&&r.act.t>=r.act.dur*r.act.hitAt){ r.act.done=true; attackVisuals(r.act,r); } if(r.act.t>=r.act.dur) r.act=null; }
    r.g.position.set(r.x,r.y,r.z);
    r.g.rotation.set(0,r.face+(r.act&&r.act.kind==='spin'?clamp(r.act.t/r.act.dur)*TAU*2:0),r.dead?1.4:0);
    poseRig(r.rig,dt,{sp,ph:r.walk,act:r.act,hold:CLASS_OF[(ITEM[r.eq.weapon]||{}).slot]==='warrior'?'sword':null});
    const talking=CHAT.bubbles.has(r.id)&&performance.now()<CHAT.bubbles.get(r.id).until;
    if(started && (d<45||(talking&&d<90))){
      const s=toScreen(r.x,r.y+2.25*r.scale,r.z); if(!s) continue;
      let tag=tagPool[ti]; if(!tag){ tag=document.createElement('div'); tag.className='ntag'; tag.innerHTML='<q hidden></q><b></b><span></span><i><i></i></i>'; document.body.append(tag); tagPool.push(tag); }
      ti++; tag.hidden=false; tag.style.transform=`translate(${s[0]}px,${s[1]}px) translate(-50%,-100%)`;
      const say=CHAT.bubbles.get(r.id), q=tag.children[0], on=!!(say&&performance.now()<say.until); q.hidden=!on; if(on&&q.textContent!==say.text) q.textContent=say.text;
      tag.children[1].textContent=r.name; tag.children[2].textContent='Lv '+r.level; tag.children[3].firstChild.style.width=(r.hp/Math.max(1,r.maxHp)*100)+'%';
    }
  }
  for(;ti<tagPool.length;ti++) tagPool[ti].hidden=true;
}
