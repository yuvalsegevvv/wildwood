//@ The Deep Cave's skill drawings, the kit and floor 2's Marionette: a manager for timed effects (cvbRun), shared helpers, and the hooks for zones, the lift and the lane's speed
/* Agent map. Registry and routes: cave/vis.js (caveVisDef). This file is loaded before vis-floor3.js and vis-floor4.js, which use its helpers (every name here starts with cvb).
   cvbRun(dur,tick,end) -> a handle h {t,dur,objs,area?,data}: add meshes with cvbAdd(h,mesh) (they are removed, and the materials flagged own disposed, when it ends); tick(h,dt,k) each frame, end(h) once.
   h.area=A (an AREA_FX entry) ends the effect with the zone. At most CVB_MAX run at once (the oldest is ended first). Particles go through the spark pool (fxp*) and the set looks (ssEmit, sslDecal, sslBurst).
   cvbDef(id,{cast,event,zone?,wind?}) registers a skill: zone(A) dresses its ground zone (the area event of a cave skill carries the src "<set>_<skill id>", server/skillsets.js ssSrc, so the set's look
   already lays its ground pattern and motes; zone() adds the skill's own things), wind(who,ab,act) is drawn once when the cast animation starts (default: motes gathering into the hand).
   Hooks (grep "// cave:"): onArea (cvbArea), updateSkillFx (cvbFrame), the hiker's and the remotes' position (cvbLift: Eagle's Perch), the walking speed (cvbSpeedK: Black Ice's lane), the boss ice clear (cleanse).
   Used by: vis-floor3.js, vis-floor4.js, combat/skill-fx.js, character/pose.js, net/remote.js, player/movement.js. Test: client-smoke. */
const CVB_FX=[], CVB_MAX=LOW?10:26, CVB_ZONE=Object.create(null), CVB_WIND=Object.create(null), CVB_LIFT=new Map(), CVB_LANE={until:0,k:0}, CVB_LAST={pid:0,x:0,y:0,z:0,at:0,id:''};
const cvbWho=pid=>pid===NET.pid?P:(REMOTES.get(pid)||null);
const cvbPid=p=>p===P?NET.pid:p.id;
const cvbSc=p=>p===P?hiker.scale:(p.scale||1);
const cvbGy=p=>p.y!==undefined?p.y:getH(p.x,p.z);
const cvbLook=id=>SSL.looks[id]||null;
function cvbHand(p){ const sc=cvbSc(p); return {x:p.x-Math.sin(p.face)*0.6,y:cvbGy(p)+1.1*sc,z:p.z-Math.cos(p.face)*0.6}; }
function cvbFoe(p,range,tgt){   // your own target, else the nearest monster in front of p within range (what the server picks for a hiker who aims at nothing)
  if(tgt&&!tgt.dead) return tgt;
  let best=null, bd=1e9; const fx=-Math.sin(p.face), fz=-Math.cos(p.face);
  for(const m of MONS){ if(m.dead||!m.g.visible) continue; const dx=m.x-p.x, dz=m.z-p.z, d=Math.hypot(dx,dz); if(d>range+2||d<0.3) continue; if((dx*fx+dz*fz)/d<0.8) continue; if(d<bd){ bd=d; best=m; } }
  return best;
}
function cvbAim(p,foe,range,ahead){ return foe&&Math.hypot(foe.x-p.x,foe.z-p.z)<=range+3?{x:foe.x,z:foe.z}:{x:p.x-Math.sin(p.face)*ahead,z:p.z-Math.cos(p.face)*ahead}; }   // the server's aimPoint
function cvbAllies(pid,r){   // the caster and the party members I can see within r of it: [{pid,o}]
  const c=cvbWho(pid); if(!c) return []; const out=[{pid,o:c}], mine=pid===NET.pid, inP=mine||dgPtyMember(pid);
  if(!inP) return out;
  if(!mine&&Math.hypot(P.x-c.x,P.z-c.z)<=r) out.push({pid:NET.pid,o:P});
  for(const q of REMOTES.values()) if(q.id!==pid&&dgPtyMember(q.id)&&Math.hypot(q.x-c.x,q.z-c.z)<=r) out.push({pid:q.id,o:q});
  return out;
}
function cvbTone(x,z,o){ if(!SND.ready) return; const s=spatial(x,z,15,90); if(!s) return; o.bus='ui'; o.vol=(o.vol||0.06)*s.gain; o.pan=s.pan; tone(o); }
function cvbNoise(x,z,o){ if(!SND.ready) return; const s=spatial(x,z,15,90); if(!s) return; o.bus='ui'; o.vol=(o.vol||0.08)*s.gain; o.pan=s.pan; noiseHit(o); }
// ---- timed effects ----
function cvbRun(dur,tick,end){
  while(CVB_FX.length>=CVB_MAX) cvbStop(CVB_FX[0]);
  const h={t:0,dur,tick:tick||null,end:end||null,objs:[],area:null,data:{}}; CVB_FX.push(h); return h;
}
function cvbMesh(geo,mat){ const m=new THREE.Mesh(geo,mat); m.userData.own=true; return m; }   // its material is its own: disposed with the effect (the geometry is shared)
function cvbAdd(h,o){ scene.add(o); h.objs.push(o); return o; }
function cvbDrop(o){ scene.remove(o); o.traverse(c=>{ if(c.userData.own&&c.material) c.material.dispose(); if(c.userData.geo&&c.geometry) c.geometry.dispose(); }); }
function cvbStop(h){
  const i=CVB_FX.indexOf(h); if(i<0) return; CVB_FX.splice(i,1);
  try{ if(h.end) h.end(h); }catch(err){ console.error('cave vis end',err); }
  for(const o of h.objs) cvbDrop(o);
  h.objs.length=0;
}
function cvbFrame(dt){   // updateSkillFx calls it every frame
  for(let i=CVB_FX.length-1;i>=0;i--){ const h=CVB_FX[i]; if(!h) continue; h.t+=dt;
    if(h.t>=h.dur||(h.area&&!AREA_FX.has(h.area.id))){ cvbStop(h); continue; }
    try{ if(h.tick) h.tick(h,dt,h.t/h.dur); }catch(err){ console.error('cave vis tick',err); cvbStop(h); } }
  for(const [pid,s] of CVB_LIFT){ s.t+=dt; if(s.t>=s.dur) CVB_LIFT.delete(pid); }
  cvbWindScan();
}
function cvbDef(id,D){
  const V=caveVisDef(id,{cast:D.cast,event:D.event}); if(!V) return;
  CVB_WIND[id]=D.wind||cvbGather; if(D.zone) CVB_ZONE[id]=D.zone;
}
function cvbArea(A,src){   // onArea calls it with the event's last field: "<set>_<cave skill id>" for a cave skill's zone
  const id=typeof src==='string'?src.split('_')[1]:''; if(!id||!CVB_ZONE[id]) return;
  try{ CVB_ZONE[id](A); }catch(err){ console.error('cave vis zone',id,err); }
}
function cvbWindScan(){   // the start of a cast animation of one of these skills: its wind-up is drawn once
  if(CB.act&&!CB.act.cvw) cvbWindStart(P,CB.act);
  for(const r of REMOTES.values()) if(r.act&&!r.act.cvw) cvbWindStart(r,r.act);
}
function cvbWindStart(who,act){
  act.cvw=1; const ab=ACT_SKILL[act.sk]; if(!ab||!ab.cave||act.done) return;
  const W=CVB_WIND[ab.id]; if(W) try{ W(who,ab,act); }catch(err){ console.error('cave vis wind',ab.id,err); }
}
function cvbGather(who,ab,act){   // the default wind-up: motes in the set's colours drawn into the hand as the cast comes to its release
  const L=cvbLook(ab.set), T=Math.max(0.12,act.dur*act.hitAt-act.t), hd=cvbHand(who); if(!L) return;
  for(let i=0,n=sslN(9);i<n;i++){ const a=i/n*TAU+AR(0,0.6), r=AR(1.3,2.0), x=hd.x+Math.sin(a)*r, z=hd.z+Math.cos(a)*r, y=hd.y+AR(-0.5,0.6);
    ssEmit(L,x,y,z,{v:[(hd.x-x)/T,(hd.y-y)/T,(hd.z-z)/T],life:T,drag:0,g:0,sway:0,fin:0.05,fout:0.2}); }
}
// ---- lines, strings and curves ----
function cvbLine(n,col,op){
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));
  const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false})); l.frustumCulled=false; l.userData.own=l.userData.geo=true; return l;
}
function cvbSag(l,ax,ay,az,bx,by,bz,sag,wob,ph){   // fills a line with a hanging curve from a to b (sag metres at the middle, wob a sideways sway)
  const arr=l.geometry.attributes.position.array, n=arr.length/3;
  for(let i=0;i<n;i++){ const f=i/(n-1), w=Math.sin(f*Math.PI)*(wob||0)*Math.sin((ph||0)+f*5);
    arr[i*3]=ax+(bx-ax)*f+w; arr[i*3+1]=ay+(by-ay)*f-sag*4*f*(1-f); arr[i*3+2]=az+(bz-az)*f+w*0.7; }
  l.geometry.attributes.position.needsUpdate=true;
}
const CVB_TUBE=new THREE.CylinderGeometry(1,1,1,7,1,true), CVB_UP=new THREE.Vector3(0,1,0), _cvbD=new THREE.Vector3();
function cvbSeg(m,ax,ay,az,bx,by,bz,r){   // stands a unit tube between two points
  _cvbD.set(bx-ax,by-ay,bz-az); const len=_cvbD.length()||0.001; m.position.set((ax+bx)/2,(ay+by)/2,(az+bz)/2);
  m.quaternion.setFromUnitVectors(CVB_UP,_cvbD.multiplyScalar(1/len)); m.scale.set(r,len,r);
}
const cvbRingMesh=(col,op)=>cvbMesh(teleEdge,fxMat(col,op));
const cvbDiscMesh=(col,op)=>cvbMesh(teleFill,fxMat(col,op));
function cvbFlat(m,x,z,r,dy){ m.position.set(x,getH(x,z)+(dy||0.1),z); m.scale.setScalar(r); }
// ---- hooks ----
function cvbLift(pid){   // Eagle's Perch: how high a player is carried now (the hiker's and the remotes' models are raised by it)
  const s=CVB_LIFT.size&&CVB_LIFT.get(pid); if(!s) return 0;
  const up=Math.min(1,s.t/0.45), down=Math.min(1,Math.max(0,(s.dur-s.t)/0.6)), e=Math.min(up,down);
  return 4*e*(2-e);
}
function cvbSpeedK(){ return performance.now()<CVB_LANE.until?1+CVB_LANE.k:1; }   // Black Ice's lane: the walking speed
for(const id of CAVE_SKILL_IDS){ const a=CAVE_SKILLS[id].act; if(!ACT_OF[a[0]]) ACT_OF[a[0]]={dur:a[1],hitAt:a[2]}; }   // (another player's cast of a cave skill takes its own time to come to the release)

/* ---- floor 2: Ottoline's Marionette (dark): strings from the hand, a crossbar over the puppet, its lashes at its neighbours; a boss gets threads and a weakness ---- */
const CVB_BAR=new THREE.BoxGeometry(1.5,0.08,0.08), CVB_BAR2=new THREE.BoxGeometry(0.08,0.08,1.0);
function cvbPuppet(m,dur){
  const L=cvbLook('ottoline'), H=m.T.height*m.s, w=Math.max(0.45,m.T.rad*m.s), h=cvbRun(dur+0.2,null,null);
  const bar=new THREE.Group(), mat=new THREE.MeshBasicMaterial({color:0xf3eee8}); bar.userData.own=true;
  const b1=new THREE.Mesh(CVB_BAR,mat), b2=new THREE.Mesh(CVB_BAR2,mat); b1.userData.own=true; bar.add(b1,b2); cvbAdd(h,bar);
  const glow=cvbRingMesh(0xb06ad8,0.7), ring2=cvbRingMesh(0xc2336a,0.5); cvbAdd(h,glow); cvbAdd(h,ring2);
  const str=[]; for(let i=0;i<5;i++){ const l=cvbLine(8,i<3?0xe9d7ff:0xc58cf0,0.8); cvbAdd(h,l); str.push(l); }
  if(L) sslDecal(L,m.x,m.z,w+2,{life:dur,keep:true,op:0.7,r0:0.3,spin:0.9,follow:()=>m});
  h.data.lash=0.5;
  h.tick=(h,dt,k)=>{
    if(m.dead||m.g.visible===false){ cvbStop(h); return; }
    const a=m.face+Math.sin(h.t*2.2)*0.5, ca=Math.cos(a), sa=Math.sin(a), rise=Math.min(1,h.t/0.25), by=m.y+H+0.9+rise*0.5+Math.sin(h.t*5)*0.08;
    bar.position.set(m.x,by,m.z); bar.rotation.y=a; bar.rotation.z=Math.sin(h.t*6)*0.22;
    const ex=ca*0.7, ez=-sa*0.7, fx=sa*0.5, fz=ca*0.5, dn=Math.sin(h.t*9)*0.25, dn2=Math.cos(h.t*9)*0.25;
    const A=[[m.x,by,m.z,m.x,m.y+H*0.96,m.z],[m.x-ex,by,m.z-ez,m.x-w*0.9-dn2,m.y+H*0.55+dn,m.z],[m.x+ex,by,m.z+ez,m.x+w*0.9+dn2,m.y+H*0.55-dn,m.z],
      [m.x+fx,by,m.z+fz,m.x-w*0.4,m.y+H*0.08+Math.max(0,dn)*0.6,m.z],[m.x-fx,by,m.z-fz,m.x+w*0.4,m.y+H*0.08+Math.max(0,-dn)*0.6,m.z]];
    for(let i=0;i<5;i++){ const q=A[i]; cvbSag(str[i],q[0],q[1],q[2],q[3],q[4],q[5],0.06,0.05,h.t*3+i); }
    cvbFlat(glow,m.x,m.z,w+0.9+Math.sin(h.t*6)*0.12,0.12); cvbFlat(ring2,m.x,m.z,w+1.5+Math.cos(h.t*5)*0.15,0.13);
    if(L&&Math.random()<dt*9) ssEmit(L,m.x+AR(-w,w),m.y+AR(0.2,H),m.z+AR(-w,w),{v:[0,AR(0.6,1.4),0],life:AR(0.8,1.3)});
    h.data.lash-=dt;
    if(h.data.lash<=0){ h.data.lash=0.8; let best=null, bd=8;   // the lash: the server has it strike the nearest neighbour within 8 m every 0.8 s
      for(const n of MONS){ if(n===m||n.dead||!n.g.visible) continue; const d=Math.hypot(n.x-m.x,n.z-m.z); if(d<bd){ bd=d; best=n; } }
      if(best){ const y1=m.y+H*0.6, y2=best.y+best.T.height*best.s*0.55;
        fxpLine(m.x,y1,m.z,best.x,y2,best.z,0xc58cf0,14,0.3); fxpFlare(m.x,y1,m.z,0xb06ad8,1.2,0.2); fxpFlare(best.x,y2,best.z,0xe9d7ff,1.8,0.25); spawnRingAt(best.x,best.y,best.z,1.6,0xb06ad8);
        if(L) sslBurst(L,best.x,y2,best.z,5,2.4);
        cvbTone(m.x,m.z,{type:'triangle',freq:520,freq2:240,dur:0.14,vol:0.05}); } }
  };
  return h;
}
function cvbBossThreads(m,dur){   // a boss cannot be puppeted: threads settle round it and it is weakened
  const L=cvbLook('ottoline'), H=m.T.height*m.s, w=Math.max(1,m.T.rad*m.s), h=cvbRun(dur+0.2,null,null), n=LOW?4:7;
  const str=[]; for(let i=0;i<n;i++){ const l=cvbLine(8,i%2?0xe9d7ff:0xc58cf0,0.75); cvbAdd(h,l); str.push({l,a:i/n*TAU,r:w*AR(0.6,1.0),ph:AR(0,TAU)}); }
  const glow=cvbRingMesh(0xb06ad8,0.7); cvbAdd(h,glow);
  if(L) sslDecal(L,m.x,m.z,w+3,{life:dur,keep:true,op:0.6,r0:0.3,spin:-0.5,follow:()=>m});
  h.tick=(h,dt,k)=>{
    if(m.dead){ cvbStop(h); return; }
    const fall=Math.min(1,h.t/0.4);
    for(const s of str){ const x=m.x+Math.sin(s.a)*s.r, z=m.z+Math.cos(s.a)*s.r, topY=m.y+H+10-fall*7.5;
      cvbSag(s.l,x,topY,z,x,m.y+H*(0.35+0.4*Math.sin(s.ph)*Math.sin(s.ph)),z,0.4*(1-fall)+0.1,0.15,h.t*2+s.ph); }
    cvbFlat(glow,m.x,m.z,w+1.2+Math.sin(h.t*4)*0.2,0.12);
    if(L&&Math.random()<dt*10) ssEmit(L,m.x+AR(-w,w),m.y+H*AR(0.2,1),m.z+AR(-w,w),{v:[0,-AR(0.3,1),0],life:AR(0.9,1.4),g:-0.3});
  };
  fxpFlare(m.x,m.y+H*0.5,m.z,0xb06ad8,Math.max(3,w*2),0.5);
}
cvbDef('marionette',{
  cast(p,ab,tgt){
    const hd=cvbHand(p), foe=cvbFoe(p,ab.range,tgt), L=cvbLook('ottoline'), VIO=0xb06ad8;
    let ex,ey,ez; if(foe){ ex=foe.x; ez=foe.z; ey=foe.y+foe.T.height*foe.s*0.75; } else { ex=hd.x-Math.sin(p.face)*8; ez=hd.z-Math.cos(p.face)*8; ey=hd.y; }
    spawnRingAt(p.x,getH(p.x,p.z),p.z,2.2,VIO); fxpFlare(hd.x,hd.y,hd.z,VIO,1.6,0.35);
    if(L){ sslBurst(L,hd.x,hd.y,hd.z,6,2.2); sslDecal(L,ex,ez,2.8,{life:0.7,spin:1.4,r0:0.4}); }
    const h=cvbRun(0.6,null,null), cols=[0xe9d7ff,0xc58cf0,0xc2336a], ls=cols.map(c=>cvbAdd(h,cvbLine(14,c,0.9)));
    fxpLine(hd.x,hd.y,hd.z,ex,ey,ez,0xc58cf0,18,0.3); spawnBurst(new THREE.Vector3(ex,ey,ez),VIO,0.8); spawnRingAt(ex,getH(ex,ez),ez,1.8,VIO);
    h.tick=(h,dt,k)=>{ const f=Math.min(1,h.t/0.18);   // the strings fly out from the fingertips, then slacken and fade
      ls.forEach((l,i)=>{ cvbSag(l,hd.x,hd.y,hd.z,hd.x+(ex-hd.x)*f,hd.y+(ey-hd.y)*f,hd.z+(ez-hd.z)*f,0.15+k*1.4,0.25*(1-k),h.t*6+i*2); l.material.opacity=0.9*(1-k*k); }); };
    cvbTone(p.x,p.z,{type:'triangle',freq:440,freq2:880,dur:0.2,vol:0.05}); cvbTone(p.x,p.z,{type:'sine',freq:660,freq2:330,dur:0.4,vol:0.04});
  },
  event(e){
    if(e[0]!=='cvfx') return;
    const m=e[2]==='puppet'||e[2]==='weak'?MON_BY_ID.get(e[3]):null; if(!m||m.dead) return;
    if(e[2]==='puppet') cvbPuppet(m,e[4]||4); else cvbBossThreads(m,e[4]||4);
  }
});
