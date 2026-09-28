//@ Main loop (frame), loading progress, start button, boot
/* ---------- loop ---------- */
const clock=new THREE.Clock();
let t=0, acc=0, frames=0, canStart=false;
const growEl=$('#grow'), barEl=$('#barFill');
function onStreamProgress(){
  if(!Stream.terrainDone) return;
  const nearTotal=Math.max(1,[...Array(NCH).keys()].filter(i=>distToChunk(i,spawn.x,spawn.z)<NEAR_R).length);
  const nearDone=nearTotal-Stream.needed.size;
  if(!canStart){
    barEl.style.width=(35+65*nearDone/nearTotal).toFixed(0)+'%';
    statusEl.textContent='Planting the forest around you… '+nearDone+' of '+nearTotal+' nearby areas';
    if(Stream.needed.size===0){
      canStart=true;
      barEl.style.width='100%';
      statusEl.textContent=growLeft()?'Ready. The rest of the forest keeps growing while you walk.':'The forest is ready.';
      $('#go').disabled=false; $('#custom').disabled=false; $('#go').focus({preventScroll:true});
    }
  }
  const left=growLeft();
  if(left){ growEl.textContent='Growing distant areas: '+left+' left'; growEl.hidden=false; }
  else growEl.hidden=true;
}
// chunks still to grow within reach (the far side of the mountains grows only when you get there)
function growLeft(){ return Stream.pending.filter(i=>distToChunk(i,P.x,P.z)<=FAR_R).length+(Stream.job&&Stream.job.kind==='c'?1:0); }
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
    updateVillage(dt); updateVale(dt);
    updateNPCs(dt);
    updateNpcLabels();
    updateRemotes(dt);
    updateMonsters(dt);
    updateCombat(dt);
    netTick(dt);
    soundTick(dt);
  }
  updateMap(dt);
  updateWeather(dt);
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

const hint=$('#hint');
/* ---- choosing a world and connecting ---- */
let worldMode=window.WILDWOOD_WS?'ws':'solo', connecting=false;
if(window.claude&&typeof window.claude.use==='function') $('[data-world="room"]').hidden=false;
if(window.WILDWOOD_WS) $('[data-world="ws"]').hidden=false;
function syncWorldChips(){ document.querySelectorAll('[data-world]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.world===worldMode)); $('#worldNote').textContent=WORLD_NOTES[worldMode]; syncAcctPick(); }
const WORLD_NOTES={solo:'Just you. The world server runs in this tab.',room:'Play with everyone who has this page open. One player\'s tab hosts the world.',ws:'Play on the world server this page came from.'};
document.querySelectorAll('[data-world]').forEach(b=>b.addEventListener('click',()=>{ worldMode=b.dataset.world; syncWorldChips(); }));
$('#pname').value=playerName()||('Hiker '+Math.floor(100+Math.random()*900));
$('#setName').value=$('#pname').value;
$('#pname').addEventListener('change',()=>{ try{ localStorage.setItem('wildwood-name',$('#pname').value.trim().slice(0,16)); }catch(_){} });
syncWorldChips();
NET.onStatus=text=>{ if(started) toast(text,''); else statusEl.textContent=text; };
$('#go').addEventListener('click',async()=>{
  if(!canStart||connecting) return;
  const loginErr=prepareLogin(); if(loginErr){ statusEl.textContent=loginErr; return; }
  audioInit();
  connecting=true; $('#go').disabled=true;
  NET.name=($('#pname').value.trim()||'Hiker').slice(0,16);
  try{ localStorage.setItem('wildwood-name',NET.name); }catch(_){}
  NET.onReady=()=>{ connecting=false; beginPlay(); };
  try{
    if(worldMode==='room') await startRoom(NET.name);
    else if(worldMode==='ws'){ statusEl.textContent='Connecting to the world server…'; await startWS(); }
    else startSolo();
  }catch(e){ statusEl.textContent=e.message; connecting=false; $('#go').disabled=false; NET.onReady=null; }
});
function beginPlay(){
  started=true;
  $('#start').classList.add('hide');
  document.body.classList.add('playing');
  renderQlog();
  hint.textContent=isTouch?'Drag on the left to walk, on the right to look around. Tap the minimap for the world map.':'WASD to walk, Shift to run, Space to jump, F or click to attack, Q for your skill, E to talk, I for your inventory, N for the map. Click to look with the mouse; T skips ahead in the day, V switches the camera.';
  if(LITE) hint.textContent+=' Running in light mode for this phone.';
  hint.classList.add('show'); setTimeout(()=>hint.classList.remove('show'),9000);
  if(!isTouch && canvas.requestPointerLock){ try{ const r=canvas.requestPointerLock(); if(r && r.catch) r.catch(()=>{}); }catch(_){} }
}

buildGeometries();
statusEl.textContent='Shaping the hills…';
frame();
