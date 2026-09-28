//@ Lucky drops and forging: light beam, sparkles, banner and a bright jingle for epic, unique and legendary items
/* luckyFx(x,y,z,rar,mine,item) plays when an epic or better item drops (for you: beam + banner + jingle;
   for another player nearby: the beam and a quieter jingle). forgeFx(item) plays when Greta merges your items. */
const LUCKY=[], RAR_HEX=[0xd6d8cf,0x5b9cf0,0xb77cf5,0xf0cd45,0x62d66e];
const beamGeo=new THREE.CylinderGeometry(0.3,0.95,1,24,1,true).translate(0,0.5,0), sparkGeo=new THREE.OctahedronGeometry(0.1,0);
function luckyFx(x,y,z,rar,mine,item){
  const col=RAR_HEX[rar];
  const beam=new THREE.Mesh(beamGeo,fxMat(col,0.5)), core=new THREE.Mesh(beamGeo,fxMat(0xffffff,0.4));
  beam.position.set(x,y,z); core.position.set(x,y,z); beam.scale.set(1,0.01,1); core.scale.set(0.35,0.01,0.35); scene.add(beam,core);
  const sparks=[];
  for(let i=0;i<10+rar*8;i++){
    const s=new THREE.Mesh(sparkGeo,fxMat(i%3?col:0xffffff,0.95)), a=AR(0,TAU), r=AR(0.2,1.2);
    s.position.set(x+Math.sin(a)*r,y+AR(0.2,1.5),z+Math.cos(a)*r); s.userData.v=new THREE.Vector3(Math.sin(a)*AR(0.5,2),AR(2.5,6+rar),Math.cos(a)*AR(0.5,2));
    scene.add(s); sparks.push(s);
  }
  LUCKY.push({beam,core,sparks,t:0,life:2.6+rar*0.5,h:10+rar*4});
  spawnRingAt(x,y,z,3+rar,col); spawnRingAt(x,y+0.8,z,2+rar,0xffffff);
  if(mine){ luckyBanner(rar,item); luckySound(rar,1,0); camShake=Math.max(camShake,0.15+rar*0.05); }
  else { const s=spatial(x,z,15,90); if(s) luckySound(rar,0.5*s.gain,s.pan); }
}
function updateLucky(dt){
  for(let i=LUCKY.length-1;i>=0;i--){
    const L=LUCKY[i]; L.t+=dt; const k=L.t/L.life, fade=1-smoothstep(0.55,1,k), grow=Math.min(1,L.t*3);
    L.beam.scale.set(1+0.08*Math.sin(L.t*9),L.h*grow,1+0.08*Math.sin(L.t*9)); L.core.scale.set(0.35,L.h*grow,0.35);
    L.beam.rotation.y+=dt*1.5; L.beam.material.opacity=0.5*fade; L.core.material.opacity=0.4*fade;
    for(const s of L.sparks){ const v=s.userData.v; v.y-=1.6*dt; s.position.addScaledVector(v,dt); s.rotation.x+=dt*5; s.rotation.y+=dt*4; s.material.opacity=0.95*fade; }
    if(L.t>=L.life){ for(const o of [L.beam,L.core,...L.sparks]){ scene.remove(o); o.material.dispose(); } LUCKY.splice(i,1); }
  }
}
function luckyBanner(rar,item){
  const el=$('#lucky'); el.style.setProperty('--c',RAR_COL[rar]);
  el.innerHTML=`<small>${RARITY[rar]} ${rar>=4?'drop!!!':rar>=3?'drop!!':'drop!'}</small><b>${item?item.name:''}</b>`;
  el.className=''; void el.offsetWidth; el.className='show r'+rar;
}
// bright rising arpeggio, a bell chord and a shimmer on top; longer and higher the rarer it is
function luckySound(rar,gain,pan){
  if(!SND.ready||gain<=0) return; const n=SND.ctx.currentTime;
  const notes=[523.25,659.25,783.99,1046.5,1318.5,1568,2093,2637], cnt=4+rar;
  tone({bus:'ui',type:'sine',freq:110,freq2:330,dur:0.7,vol:0.1*gain,when:n,pan});
  for(let i=0;i<cnt;i++){ tone({bus:'ui',type:'triangle',freq:notes[i],dur:0.45,vol:0.07*gain,when:n+i*0.075,pan}); tone({bus:'ui',type:'sine',freq:notes[i]*2,dur:0.3,vol:0.025*gain,when:n+i*0.075,pan}); }
  const end=n+cnt*0.075, chord=rar>=4?[1046.5,1318.5,1568,2093]:rar>=3?[880,1108.7,1318.5]:[783.99,987.77,1174.7];
  chord.forEach(f=>tone({bus:'ui',type:'sine',freq:f,dur:1.3+rar*0.35,vol:0.05*gain,when:end,pan}));
  if(rar>=4) chord.forEach(f=>tone({bus:'ui',type:'triangle',freq:f*1.5,dur:1.6,vol:0.03*gain,when:end+0.35,pan}));
  for(let i=0;i<10+rar*4;i++) noiseHit({bus:'ui',filter:'highpass',ff:6500,dur:0.04,vol:0.045*gain,when:n+0.05+i*0.055,pan});
}
// a boss dropped one of its skills for you (server event 'skilldrop'): the beam and jingle of a unique item, with the skill's name on the banner
function onSkillDrop(id){
  const s=SKILLS[id]; if(!s) return;
  luckyFx(P.x,P.y,P.z,3,true,{name:s.name});
  $('#lucky').innerHTML=`<small>Boss skill!</small><b>${s.name}</b>`;
}
function forgeFx(item){
  if(SND.ready){ const n=SND.ctx.currentTime;
    for(let k=0;k<3;k++){ noiseHit({bus:'ui',filter:'bandpass',ff:3200,dur:0.1,vol:0.2,when:n+k*0.3}); tone({bus:'ui',type:'square',freq:1250,freq2:1170,dur:0.28,vol:0.035,when:n+k*0.3,filter:'lowpass',ff:3000}); tone({bus:'ui',type:'sine',freq:2480,dur:0.5,vol:0.03,when:n+k*0.3}); } }
  const at=npcById&&npcById('greta'), x=at?at.x:P.x, z=at?at.z:P.z;
  setTimeout(()=>{
    if(item.rar>=2) luckyFx(P.x,P.y,P.z,item.rar,true,item);
    else { spawnRingAt(P.x,P.y,P.z,2.5,RAR_HEX[item.rar]); spawnBurst(new THREE.Vector3(x,getH(x,z)+1.1,z),0xffa040,0.5); luckyBanner(item.rar,item); UI_SFX.success(); }
  },900);
}
