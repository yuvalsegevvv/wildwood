//@ Main loop (frame) and boot; the start card and loading progress are in ui/start-screen.js
/* ---------- loop ---------- */
const clock=new THREE.Clock();
let t=0, acc=0, frames=0;
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),0.05);
  t+=dt; timeU.value=t;
  // stream the world: generous budget on the loading screen, a thin slice while playing
  const busy=!Stream.terrainDone || Stream.pending.length || Stream.job || Stream.lazy>0 || NPC_DEFER.length || cvNeed();   // caves: a site's mesh still to build
  if(busy){
    streamPump(started ? (terrainHot()?(LOW?14:24):(LOW?4:6)) : (LOW?28:40));   // (a bigger slice while ground next to you waits for its colours, e.g. just after a teleport)
    if(!Stream.terrainDone && Stream.tp!==undefined){ barEl.style.width=(35*Stream.tp).toFixed(0)+'%'; }
  }
  if(Stream.terrainDone){
    if(started && !customizing && !PL.dead){ updatePlayer(dt); updateFootFx(dt); }
    else if(!started && !customizing) P.yaw+=dt*0.04;
    animateHiker(dt);
    updateMotes(dt,t); updatePetals(dt,t); updateAmbient(dt,t); updateVillageSmoke(dt); updateZoneFire(dt); updateQuestGuide(dt);
    updateAnimals(dt); updateFish(dt); updateDragonflies(dt);
    cvUpdate(dt);   // caves: sites out of sight are hidden, the cave's darkness is sampled (world/caves.js)
    chamoisUpdate(dt);   // chamois: the Greyspine's harmless mountain goats (wildlife/chamois.js)
    updateVillage(dt); updateVale(dt); updateHoarfrost(dt); updateGreyspine(dt); updateGloamhorn(dt); updateNodes(dt); updateLoreProps();
    updateNPCs(dt);
    troomUpdate(dt); pzUpdate(dt);   // puzzles: the stones' glow   // testroom: the counter on the screen
    dgEntUpdate(dt);   // dungeons: the doors' sealed look and animation
    updateNpcLabels();
    updateRemotes(dt);
    updateMonsters(dt);
    updateCombat(dt); updatePotBar();
    netTick(dt);
    soundTick(dt);
  }
  updateMap(dt);
  updateWeather(dt); updateAurora();
  updateChat();
  updateEnv(dt);
  cullChunks(dt);
  rdFrame(dt);   // raids: the strip near a stronghold, the far ruins hidden
  caveFrame(dt);   // cave: a floor's view, light and lift (cave/zone.js)
  dgFrame(dt);   // dungeons: a run's view, light and HUD, the party's prompts (dungeon/run.js)
  updateCamera(dt); updateShadow();
  sky.position.copy(camera.position);
  renderer.render(scene,camera);
  if(!busy){
    acc+=dt; frames++;
    if(acc>2){ const avg=acc/frames; if(avg>1/38 && pr>0.8){ pr=Math.max(0.75,pr-0.25); renderer.setPixelRatio(pr); } acc=0; frames=0; }
  }
}
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });

buildGeometries();
statusEl.textContent='Shaping the hills…';
frame();
