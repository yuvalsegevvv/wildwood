//@ The forge keepers at work: a hammer in their hand, three blows then a pause, a spark shower and a clang at each blow when you are near
/* Agent map. Every VILLAGERS row with role 'forge' (Greta, Tetsuo, Ulfhild, Hilda, Karim, Corwin; villagers.js) gets a hammer on its right wrist anchor (smithAttach, called where the NPC is built)
   and, while it stands idle at its stall and nobody talks to it, smithAct(n,dt) (called from updateNPCs) returns the act poseRig plays ('hammer', character/pose.js) and fires the blow: sparks
   (fxpAdd, combat/fx-pool.js) over the anvil, in front of the smith, and a clang when the audio runs and you are within SMITH_NEAR metres. Nothing here is synced or saved. Test: client-smoke. */
const SMITH_NEAR=34, SMITH_CYCLE=3.4, SMITH_BEAT=0.62, SMITH_BLOWS=3;
function smithAttach(n){
  const w=n.rig&&n.rig.anchors&&n.rig.anchors.wristR; if(!w) return;
  const wood=(x,y,z,c)=>{ c.set(0x6a4a30).multiplyScalar(0.85+0.3*h3(x*40,y*40,z*40)); }, iron=(x,y,z,c)=>{ c.set(0x56585e).multiplyScalar(0.8+0.3*h3(x*30,y*30,z*30)); };
  const g=merge([pc(cyl(0.022,0.026,0.4,6).translate(0,-0.19,0),wood),pc(new THREE.BoxGeometry(0.15,0.075,0.075).translate(0,-0.4,0),iron),pc(new THREE.BoxGeometry(0.05,0.05,0.05).translate(0.1,-0.4,0),iron)]);
  const m=new THREE.Mesh(g,matChar); m.position.set(0,-0.07,0); m.rotation.x=0.5; w.add(m); n.hammer=m;
}
function smithBlow(n){   // the hammer comes down on the anvil in front of the smith
  const sx=Math.sin(n.face), sz=Math.cos(n.face), x=n.x+sx*0.55, z=n.z+sz*0.55, y=n.y+0.98;
  fxpSparks(x,y,z,0xffb050,5,2.2,{up:1.2,g:9,size:0.12,life:0.45,drag:1});
  fxpAdd(x,y,z,0,0.1,0,0xffe0a0,0.7,0.12,{grow:1.2,a:0.5});
  if(typeof SND!=='undefined'&&SND.ready&&SND.ctx.state==='running'){ const s=spatial(n.x,n.z,6,SMITH_NEAR+6); if(s){
    tone({type:'square',freq:1900+AR(-120,160),freq2:1450,dur:0.1,vol:0.045*s.gain,pan:s.pan,filter:'highpass',ff:900});
    tone({freq:640,freq2:520,dur:0.18,vol:0.03*s.gain,pan:s.pan,verb:true}); noiseHit({filter:'highpass',ff:2500,dur:0.03,vol:0.07*s.gain,pan:s.pan}); } }
}
function smithAct(n,dt,dp){   // the act to play this frame (or null), and the blow at the moment the hammer lands
  n.hamT=(n.hamT===undefined?AR(0,SMITH_CYCLE):n.hamT)+dt;
  const cyc=n.hamT%SMITH_CYCLE, k=Math.floor(cyc/SMITH_BEAT); if(k>=SMITH_BLOWS) return null;
  const p=(cyc-k*SMITH_BEAT)/SMITH_BEAT, id=Math.floor(n.hamT/SMITH_CYCLE)*10+k;
  if(p>=0.5&&n.hamId!==id){ n.hamId=id; if(dp<SMITH_NEAR) smithBlow(n); }
  return {kind:'hammer',t:p*SMITH_BEAT,dur:SMITH_BEAT};
}
