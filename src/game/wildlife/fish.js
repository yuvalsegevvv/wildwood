//@ Fish that leap out of lakes, rivers and the sea near you: an arc, a ring of ripples where they rise and a splash where they fall
/* Agent map. updateFish(dt) (main/loop.js, after updateAnimals) picks, every few seconds, a deep spot of water 5-24 m from the camera (getH below waterSurf, so the sea, the lakes, the
   rivers and the Greyspine's tarns all count; frozen lakes are ground and do not) and sends one of FISH_N pooled fish over it along a parabola. The ripples and drops are particles
   (fxpSmoke / fxpAdd, combat/fx-pool.js); the fish are merged meshes built with the monster helpers (moEll, moCone: combat/monster-parts.js) and hidden when idle. A small plop
   is played when the audio runs. Nothing here is synced or saved; phones get fewer fish. Test: client-smoke (the loop runs it). */
const FISH_N=LITE?1:(LOW?2:4);
const FISH={list:[],geo:null,mat:null,wait:3};
function fishGeo(){
  if(FISH.geo) return FISH.geo;
  const sk=(x,y,z,c)=>{ c.set(0x5a7a92).lerp(_tint.set(0xe8eef2),clamp(0.55-y*5.5)).multiplyScalar(0.85+0.3*moNoise(x,y,z,30)); if(z<-0.1&&y>0.02) c.multiplyScalar(0.8); };   // slate back, pale belly
  FISH.geo=moMerge([moEll(0.065,0.085,0.24,0,0,0,sk,null,8),moEll(0.012,0.1,0.075,0,0,-0.27,0x6a8aa2,[0.3,0,0],6),moEll(0.008,0.055,0.07,0,0.085,-0.02,0x4a6a82,[0.4,0,0],6),
    moEll(0.012,0.04,0.055,0.05,-0.05,0.07,0x8aa2b4,[0,0,0.5],5),moEll(0.012,0.04,0.055,-0.05,-0.05,0.07,0x8aa2b4,[0,0,-0.5],5)]);   // body, tail, back fin, side fins
  FISH.mat=new THREE.MeshLambertMaterial({vertexColors:true});
  return FISH.geo;
}
function fishRipple(x,y,z,k){   // a ring of faint foam spreading over the water
  const n=fxpN(10);
  for(let i=0;i<n;i++){ const a=i/n*TAU; fxpSmoke(x+Math.cos(a)*0.1*k,y+0.03,z+Math.sin(a)*0.1*k,Math.cos(a)*0.7*k,0.02,Math.sin(a)*0.7*k,0xe8f4fa,0.2*k,0.9,{drag:1.6,grow:1.5,a:0.3}); }
}
function fishSplash(x,y,z,k){
  const n=fxpN(7);
  for(let i=0;i<n;i++){ const a=AR(0,TAU), v=AR(0.2,0.9); fxpAdd(x,y+0.03,z,Math.cos(a)*v,AR(1.6,3.2)*k,Math.sin(a)*v,0xd8ecf8,0.09*k,0.5,{g:9,drag:0.4,white:0.5,grow:0.3,a:0.85}); }
  fishRipple(x,y,z,k);
  if(typeof SND!=='undefined'&&SND.ready&&SND.ctx.state==='running'){ const s=spatial(x,z,6,40); if(s){ noiseHit({filter:'bandpass',ff:700+AR(0,500),dur:0.11,vol:0.07*s.gain,pan:s.pan}); tone({freq:380,freq2:150,dur:0.1,vol:0.035*s.gain,pan:s.pan}); } }
}
function fishSpot(){   // deep open water within sight, not in a dungeon's far-off slot
  for(let i=0;i<14;i++){
    const a=AR(0,TAU), r=AR(5,24), x=camera.position.x+Math.sin(a)*r, z=camera.position.z+Math.cos(a)*r, w=waterSurf(x,z);
    if(!dgInSlots(x)&&getH(x,z)<w-0.7&&bridgeDeck(x,z)<w) return [x,w,z];
  }
  return null;
}
function updateFish(dt){
  if(!started||customizing||dgIn()) return;
  if(!FISH.list.length){ for(let i=0;i<FISH_N;i++){ const m=new THREE.Mesh(fishGeo(),FISH.mat); m.visible=false; scene.add(m); FISH.list.push({m,t:-1,dur:1,vx:0,vy:0,vz:0,y0:0,k:1}); } }
  FISH.wait-=dt;
  if(FISH.wait<=0){
    FISH.wait=AR(2.5,6.5)*(WX.inten>0.3?0.5:1)*(1+envCur.night*0.5);
    const f=FISH.list.find(q=>q.t<0), s=f&&fishSpot();
    if(s){ const a=AR(0,TAU), hv=AR(0.9,2.1), k=AR(0.8,1.5); f.k=k; f.vx=Math.sin(a)*hv; f.vz=Math.cos(a)*hv; f.vy=AR(3.4,5); f.dur=2*f.vy/9.8; f.t=0; f.y0=s[1];
      f.m.position.set(s[0],s[1],s[2]); f.m.scale.setScalar(k); f.m.visible=true; fishSplash(s[0],s[1],s[2],0.6*k); }
  }
  for(const f of FISH.list){
    if(f.t<0) continue;
    f.t+=dt; const m=f.m, vy=f.vy-9.8*f.t;
    if(f.t>=f.dur){ f.t=-1; m.visible=false; fishSplash(m.position.x,f.y0,m.position.z,0.6*f.k); continue; }
    m.position.x+=f.vx*dt; m.position.z+=f.vz*dt; m.position.y=f.y0+f.vy*f.t-4.9*f.t*f.t;
    m.lookAt(m.position.x+f.vx,m.position.y+vy*0.5,m.position.z+f.vz); m.rotateZ(Math.sin(f.t*30)*0.3);   // it thrashes as it flies
  }
}
