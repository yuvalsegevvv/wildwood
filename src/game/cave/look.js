//@ A cave floor's look and sound: the sky, sun shadow, water and weather off, the floor's fog and flat light (time of day cannot tint it), a lantern on you and point lights moved to the nearest lamps, the floor's music and ambience; all given back exactly on leaving
/* Agent map. Doc: docs/CAVE.md section 14. Test: tools/client-smoke.js (fog, lights, sky and camera far switched and given back).
   exports: caveLookEnter(R) / caveLookLeave() (zone.js), caveLookEnv(s) (world/time-of-day.js updateEnv, before the dungeons' own: it overwrites the sky state with the floor's), caveLookTick(dt) (zone.js caveFrame:
            the lantern follows you and flickers, the pooled lamps move), caveMusicTheme() (audio/music.js musicThemeHere), caveAmbience(T) (audio/driver.js soundTick), caveZoneText() (the zone label), CAVE_LOOK
   users: the hooks above; reads CAVE_RUN, CAVE_VIEW.lamps (view.js: the floor's lamp emitters in floor-local metres)
   Same recipe as the dungeons' (dungeon/look.js): the fog colour is the floor's (look.fog) and its far end look.far (40-52 m), the hemisphere light is white and flat (the light is in the vertex colours), the sun is off,
   the camera's far plane 140 m (the world is 3 km away: nothing of it is drawn). Point lights: the lantern on you everywhere (the colour of the floor's look.torch), two more on a desktop that move to the nearest
   lamps every quarter second; their count never changes while a floor is up (a new count recompiles every material). Shadows are off. */
const CAVE_LOOK={on:false,save:null,torch:null,pool:[],poolT:0,far:46,near:3,fog:new THREE.Color(),hs:new THREE.Color(0xffffff),hg:new THREE.Color(0xffffff),sun:new THREE.Color(0xffffff),hi:0.95,sunI:0};
function caveLookEnter(R){
  const L=CAVE_LOOK, K=R.K;
  if(!L.save) L.save={far:camera.far,near:scene.fog.near,sky:sky.visible,water:water?water.visible:true,cast:sun.castShadow,motes:motes.visible};
  camera.far=140; camera.updateProjectionMatrix();
  sky.visible=false; if(water) water.visible=false; sun.castShadow=false;
  L.fog.setHex(K.fog); L.hi=K.hi===undefined?0.95:K.hi; L.far=K.far||46; L.on=true;
  if(!L.torch){ L.torch=new THREE.PointLight(0xffd8a8,1.35,20,2); L.torch.name='caveTorch'; }
  L.torch.color.setHex(K.torch===undefined?0xffd8a8:K.torch); scene.add(L.torch);
  if(!L.pool.length) for(let i=0;i<(LOW||LITE?0:2);i++){ const p=new THREE.PointLight(0xffffff,0,12,2); p.name='caveLamp'; L.pool.push(p); }
  for(const p of L.pool){ p.intensity=0; scene.add(p); }
  L.poolT=0;
}
function caveLookLeave(){
  const L=CAVE_LOOK, s=L.save; L.on=false;
  if(L.torch) scene.remove(L.torch); for(const p of L.pool) scene.remove(p);
  if(!s) return;
  camera.far=s.far; camera.updateProjectionMatrix(); scene.fog.near=s.near; sky.visible=s.sky; if(water) water.visible=s.water; sun.castShadow=s.cast; motes.visible=s.motes;
  L.save=null;
}
// the sky state updateEnv is about to apply: the floor's fog and light, whatever the hour or the weather
function caveLookEnv(s){
  const L=CAVE_LOOK; if(!CAVE_RUN||!L.on) return;
  s.fog.copy(L.fog); s.sky.copy(L.fog); s.hor.copy(L.fog); s.cloud.copy(L.fog); s.hs.copy(L.hs); s.hg.copy(L.hg); s.sun.copy(L.sun);
  s.hi=L.hi; s.sunI=L.sunI; s.night=0; s.elev=78; s.azim=40; s.sE=78; s.sA=40; s.mE=-90; s.lk=1; s.far=L.far;
  scene.fog.near=L.near;
}
function caveLookTick(dt){
  const L=CAVE_LOOK, R=CAVE_RUN; if(!R||!L.on) return;
  for(const m of AURORA) m.visible=false; petals.visible=false; motes.visible=false;
  if(L.torch){ L.torch.position.set(P.x,P.y+2.4,P.z); const hot=R.F.theme==='magma'; L.torch.intensity=(hot?1.05:1.35)*(0.94+0.06*Math.sin(t*9.1)*Math.sin(t*5.3)); }
  if((L.poolT-=dt)>0||!L.pool.length) return;
  L.poolT=0.25;
  const lx=P.x-R.ox, lz=P.z-R.oz, near=CAVE_VIEW.lamps.map(a=>[a,Math.hypot(a.x-lx,a.z-lz)]).filter(q=>q[1]<q[0].r*2).sort((p,q)=>p[1]-q[1]);
  L.pool.forEach((p,i)=>{ const q=near[i]; if(!q){ p.intensity=0; return; } const a=q[0]; p.position.set(a.x+R.ox,R.y+caveGroundY(a.x+R.ox,a.z+R.oz)-R.y+2.2,a.z+R.oz); p.color.setHex(a.col); p.distance=a.r+2; p.intensity=0.9*a.i+0.2; });
}
const caveMusicTheme=()=>CAVE_RUN&&CAVE_RUN.K.music||'wild3';
const caveZoneText=()=>{ const R=CAVE_RUN; return R.F.name+' (Lv '+R.F.lv[0]+'-'+R.F.lv[1]+')'; };
// every 0.1 s instead of the forest's beds: wind and drips in the grotto, chimes in the Hollows, a river's roar below, the fire's low roar at the Heart
function caveAmbience(T){
  if(!SND.ready||!CAVE_RUN) return;
  const th=CAVE_RUN.F.theme, c=SND.ctx, now=c.currentTime, L=SND.loops, set=(g,v)=>g.gain.setTargetAtTime(v,now,0.5), r=p=>Math.random()<p*T/0.1;
  set(L.wind.g,th==='magma'?0.05:0.03); L.wind.f.frequency.setTargetAtTime(th==='magma'?260:380,now,0.5);
  set(L.leaves.g,0); set(L.water.g,th==='drowned'?0.09:th==='grotto'?0.02:0); set(L.fire.g,th==='magma'?0.07:0);
  const around=(a,b)=>{ const ang=AR(0,TAU), d=AR(a,b); return spatial(P.x+Math.sin(ang)*d,P.z+Math.cos(ang)*d,4,40); };
  if((th==='grotto'||th==='drowned')&&r(0.16)){ const s=around(3,18); if(s) dgEntDrip(s.pan,s.gain*1.4); }
  if(th==='prism'&&r(0.05)){ const s=around(4,20); if(s){ const f=AR(1500,2600); tone({freq:f,freq2:f*1.5,dur:1.4,attack:0.02,vol:0.025*s.gain,pan:s.pan,verb:true}); } }
  if(th==='magma'&&r(0.05)){ const s=around(5,22); if(s) noiseHit({filter:'lowpass',ff:AR(120,260),dur:0.5,vol:0.06*s.gain}); }
}
