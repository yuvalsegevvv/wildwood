//@ The volcano's live look: a smoke plume and embers over the crater, glowing cracks on the crater floor, and the eruption's ash and ember rain while Pyrrhax is in part 3. Client only, nothing synced.
/* Agent map (docs/VOLCANO.md). updateVolcanoFx(dt) is called from main/loop.js each frame: it does nothing unless the camera is within VFX_NEAR metres of the crater, then feeds the shared particle pool (fxpSmoke / fxpAdd,
   combat/fx-pool.js). The ground's own lava cracks are painted by ewColor (terrain-color-isles.js); the far view's plume is far-lands.js. The eruption is read from the boss monster's view state (m.bs: engaged, phase).
   Uses: VG (shared/volcano-ground.js), MONS, camera. Phones (LITE / LOW) get fewer particles. Test: client-smoke (the loop runs it). Names: vfx..., VFX_... */
const VFX_NEAR=LITE?260:(LOW?340:460);
const VFX={t:0,acc:0,acc2:0,acc3:0};
function vfxErupting(){
  for(const m of MONS) if(m.def&&m.def.id==='sinkwarden'&&m.bs&&m.bs.engaged&&m.bs.phase===3) return true;
  return false;
}
function updateVolcanoFx(dt){
  if(!started||customizing||dgIn()||caveIn()) return;
  const cx=camera.position.x, cz=camera.position.z, d=Math.hypot(cx-VG.x,cz-VG.z);
  if(d>VFX_NEAR) return;
  VFX.t-=dt; if(VFX.t>0) return; const T=0.1-VFX.t; VFX.t=0.1;
  const big=vfxErupting(), rate=(LOW?0.55:1)*(big?2.4:1), wind=0.6+0.4*Math.sin(t*0.13);
  // the plume: grey-brown smoke climbing out of the crater and leaning with the wind
  VFX.acc+=T*5*rate; while(VFX.acc>=1){ VFX.acc-=1; const a=AR(0,TAU), r=AR(0,VG.floorR*0.7);
    fxpSmoke(VG.x+Math.sin(a)*r,VG.floor+AR(0,6),VG.z+Math.cos(a)*r,wind*AR(2,5),AR(7,12)*(big?1.5:1),wind*AR(-1.5,2),big?0x2a2420:0x4a4440,AR(5,9),AR(6,9),{drag:0.12,grow:5.5,a:big?0.5:0.34}); }
  // embers lifted out of the crater
  VFX.acc2+=T*(big?26:9)*rate; while(VFX.acc2>=1){ VFX.acc2-=1; const a=AR(0,TAU), r=AR(0,VG.floorR);
    fxpAdd(VG.x+Math.sin(a)*r,VG.floor+AR(0.5,3),VG.z+Math.cos(a)*r,AR(-2,2)+wind*2,AR(6,16),AR(-2,2),Math.random()<0.5?0xff7a20:0xffb040,AR(0.25,0.5),AR(1.6,3.2),{g:-2.2,drag:0.2,white:0.2,grow:0.1,a:0.95}); }
  // the glow of the lava over the floor, flickering
  VFX.acc3+=T*6*rate; while(VFX.acc3>=1){ VFX.acc3-=1; const a=AR(0,TAU), r=AR(2,VG.floorR);
    fxpAdd(VG.x+Math.sin(a)*r,VG.floor+0.4,VG.z+Math.cos(a)*r,0,0.2,0,0xff6a18,AR(3,6),0.5,{grow:1.2,a:0.18+0.1*Math.sin(t*5+a*3)}); }
  // the eruption: ash and burning rock falling over the rim for everyone nearby
  if(big&&d<VG.rimR+60){ for(let i=0;i<(LOW?2:4);i++){ const a=AR(0,TAU), r=AR(10,VG.rimR);
    fxpAdd(VG.x+Math.sin(a)*r,VG.floor+AR(24,40),VG.z+Math.cos(a)*r,AR(-1,1),AR(-14,-8),AR(-1,1),0xff6a20,AR(0.4,0.8),AR(1.2,2),{g:6,drag:0.05,white:0.25,grow:0.1,a:0.9}); } }
}
