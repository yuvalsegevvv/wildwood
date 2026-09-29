//@ Main loop (frame) and boot; the start card and loading progress are in ui/start-screen.js
/* ---------- loop ---------- */
const clock=new THREE.Clock();
let t=0, acc=0, frames=0;
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),0.05);
  t+=dt; timeU.value=t;
  // stream the world: generous budget on the loading screen, a thin slice while playing
  const busy=!Stream.terrainDone || Stream.pending.length || Stream.job;
  if(busy){
    streamPump(started ? (LOW?4:6) : (LOW?28:40));
    if(!Stream.terrainDone && Stream.tp!==undefined){ barEl.style.width=(35*Stream.tp).toFixed(0)+'%'; }
  }
  if(Stream.terrainDone){
    if(started && !customizing && !PL.dead) updatePlayer(dt);
    else if(!started && !customizing) P.yaw+=dt*0.04;
    animateHiker(dt);
    updateMotes(dt,t); updatePetals(dt,t);
    updateAnimals(dt);
    updateVillage(dt); updateVale(dt); updateHoarfrost(dt); updateNodes(); updateLoreProps();
    updateNPCs(dt);
    updateNpcLabels();
    updateRemotes(dt);
    updateMonsters(dt);
    updateCombat(dt);
    netTick(dt);
    soundTick(dt);
  }
  updateMap(dt);
  updateWeather(dt); updateAurora();
  updateChat();
  updateEnv(dt);
  cullChunks(dt);
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
