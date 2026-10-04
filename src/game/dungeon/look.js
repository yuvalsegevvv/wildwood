//@ A run's look and sound: the sky, sun shadow, water and weather off, the theme's fog and light (time of day cannot tint it), a torch on you and a few point lights moved to the nearest light props, the Barrow's gloom, the run's music and ambience; all given back exactly on leaving
/* agent map
   exports: dgLookEnter(R) / dgLookLeave() (run.js), dgLookEnv(s) (world/time-of-day.js updateEnv, before the boss gloom: it overwrites the sky state with the run's), dgLookTick(dt) (run.js dgFrame:
            the lights follow you, the gloom), dgMusicTheme() (audio/music.js musicThemeHere: a boss in its hall still wins), dgAmbience(T) (audio/driver.js soundTick), DG_LOOK
   users: the hooks above; reads DG_RUN, DG_VIEW.anchors (view.js)
   test: tools/client-smoke.js (fog, lights, sky and camera far switched and given back), tools/dungeon-client-smoke.js
   Numbers: sight (the fog's far end) 42 m, 36 m in the Barrow, 16-34 m there by how near a brazier is (its gloom, client-only, docs/DUNGEON-THEMES.md section 3); the camera's far plane 140 m while
   in a run (the world is 1.5 km away: nothing of it is drawn); point lights: a torch on you everywhere, two more on a desktop that go to the nearest light props every quarter second (their count
   never changes inside a run: a new count recompiles every material). Shadows are off in a run. */
const DG_LOOK={on:false,save:null,torch:null,pool:[],poolT:0,far:42,farNow:42,near:3,fog:new THREE.Color(),hs:new THREE.Color(),hg:new THREE.Color(),sun:new THREE.Color(),hi:0.8,sunI:0.3,gloom:false};
function dgLookEnter(R){
  const L=DG_LOOK, pal=dgPalOf(R.T), barrow=R.T&&R.T.id==='bonefrostbarrow';
  if(!L.save) L.save={far:camera.far,near:scene.fog.near,sky:sky.visible,water:water?water.visible:true,cast:sun.castShadow,motes:motes.visible};
  camera.far=140; camera.updateProjectionMatrix();
  sky.visible=false; if(water) water.visible=false; sun.castShadow=false;
  L.fog.setHex(pal.fog); L.sun.setHex(pal.light); L.hs.setHex(pal.light).lerp(new THREE.Color(0xffffff),0.3).multiplyScalar(0.55); L.hg.setHex(pal.floor).multiplyScalar(1.4);
  L.hi=barrow?0.62:0.85; L.sunI=barrow?0.18:0.32; L.far=L.farNow=barrow?36:42; L.gloom=barrow; L.on=true;
  if(!L.torch){ L.torch=new THREE.PointLight(0xffd8a8,1.1,15,2); L.torch.name='dgTorch'; }
  L.torch.color.setHex(barrow?0xcfdcff:0xffd8a8); scene.add(L.torch);
  if(!L.pool.length) for(let i=0;i<(LOW||LITE?0:2);i++){ const p=new THREE.PointLight(0xffffff,0,11,2); p.name='dgLamp'; L.pool.push(p); }
  for(const p of L.pool){ p.intensity=0; scene.add(p); }
  L.poolT=0;
}
function dgLookLeave(){
  const L=DG_LOOK, s=L.save; L.on=false;
  if(L.torch) scene.remove(L.torch); for(const p of L.pool) scene.remove(p);
  if(!s) return;
  camera.far=s.far; camera.updateProjectionMatrix(); scene.fog.near=s.near; sky.visible=s.sky; if(water) water.visible=s.water; sun.castShadow=s.cast; motes.visible=s.motes;
  L.save=null;
}
// the sky state updateEnv is about to apply: the run's fog, light and sight, whatever the hour or the weather
function dgLookEnv(s){
  const L=DG_LOOK; if(!DG_RUN||!L.on) return;
  s.fog.copy(L.fog); s.sky.copy(L.fog); s.hor.copy(L.fog); s.cloud.copy(L.fog); s.hs.copy(L.hs); s.hg.copy(L.hg); s.sun.copy(L.sun);
  s.hi=L.hi; s.sunI=L.sunI; s.night=0; s.elev=78; s.azim=40; s.far=L.farNow;
  scene.fog.near=L.near;
}
function dgLookTick(dt){
  const L=DG_LOOK, R=DG_RUN; if(!R||!L.on) return;
  for(const m of AURORA) m.visible=false; petals.visible=false; motes.visible=false;   // (their own updates switch them on over the Reach and the vale, where the slots lie)
  if(L.torch){ L.torch.position.set(P.x,P.y+2.4,P.z); L.torch.intensity=(L.gloom?0.9:1.1)*(0.94+0.06*Math.sin(t*9.1)*Math.sin(t*5.3)); }
  const A=DG_VIEW.anchors, lx=P.x-R.ox, lz=P.z-R.oz;
  if(L.gloom){   // the Barrow: sight shrinks away from the braziers
    let nb=99; for(const a of A) if(a.dyn&&a.skip>0){ const d=Math.hypot(a.x-lx,a.z-lz); if(d<nb) nb=d; }
    const want=lerp(16,34,smoothstep(16,5,nb)); L.farNow+=(want-L.farNow)*Math.min(1,dt*1.5);
  } else L.farNow=L.far;
  if((L.poolT-=dt)>0||!L.pool.length) return;
  L.poolT=0.25;
  const near=A.filter(a=>a.dyn).map(a=>[a,Math.hypot(a.x-lx,a.z-lz)]).filter(q=>q[1]<dgLookReach(q[0])).sort((p,q)=>p[1]-q[1]);
  L.pool.forEach((p,i)=>{ const q=near[i]; if(!q){ p.intensity=0; return; } const a=q[0]; p.position.set(a.x+R.ox,R.y+a.y,a.z+R.oz); p.color.setHex(a.col); p.distance=a.r+2; p.intensity=0.9*a.i+0.3; });
}
const dgLookReach=a=>a.r*2.2;   // (a light is worth a point light while you are within twice its reach)
function dgMusicTheme(){ return DG_RUN&&DG_RUN.T&&DG_RUN.T.music||'wild3'; }
// every 0.1 s instead of the forest's beds: a low wind in the passages, water in the grottoes, drips under the roots, the Barrow's hum; nothing else of the world
function dgAmbience(T){
  if(!SND.ready||!DG_RUN) return;
  const id=DG_RUN.T&&DG_RUN.T.id, c=SND.ctx, now=c.currentTime, L=SND.loops, set=(g,v)=>g.gain.setTargetAtTime(v,now,0.5), r=p=>Math.random()<p*T/0.1;
  set(L.wind.g,id==='bonefrostbarrow'?0.06:0.025); L.wind.f.frequency.setTargetAtTime(id==='bonefrostbarrow'?300:420,now,0.5);
  set(L.leaves.g,0); set(L.water.g,id==='jadesprings'?0.07:0); set(L.fire.g,0);
  const around=(a,b)=>{ const ang=AR(0,TAU), d=AR(a,b); return spatial(P.x+Math.sin(ang)*d,P.z+Math.cos(ang)*d,4,40); };
  if(id!=='bonefrostbarrow'&&r(0.12)){ const s=around(3,18); if(s) dgEntDrip(s.pan,s.gain*1.4); }
  if(id==='bonefrostbarrow'&&r(0.02)){ const s=around(6,20); if(s) dgEntHum(s.pan,s.gain*1.6,false); }
}
