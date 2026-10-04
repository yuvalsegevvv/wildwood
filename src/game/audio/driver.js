//@ Per-frame sound driver (soundTick): beds, random events, NPC steps
/* ---------- per-frame driver ---------- */
let sTick=0, lastStepI=0, wasGround=true, waterNear=0, fdNear=0.5;
const deerStep=new Map();
function soundTick(dt){
  if(!SND.ready || SND.ctx.state!=='running') return;
  musicTick();
  const c=SND.ctx, now=c.currentTime, night=envCur.night, day=1-night;
  // player footsteps + landing
  if(started && !customizing){
    const sp=Math.hypot(P.vx,P.vz), idx=Math.floor(P.walk/Math.PI);
    if(P.ground && sp>0.6 && idx!==lastStepI) footstep(surfaceAt(P.x,P.z),Math.min(1,sp/7),0,1);
    lastStepI=idx;
    if(P.ground && !wasGround){ noiseHit({filter:'lowpass',ff:220,dur:0.16,vol:0.18}); footstep(surfaceAt(P.x,P.z),1,0,0.8); }
    wasGround=P.ground;
  }
  sTick+=dt; if(sTick<0.1) return; const T=sTick; sTick=0;
  if(dgIn()){ dgAmbience(T); return; }   // dungeons: a run's sounds instead of the forest's (dungeon/look.js)
  // measure surroundings
  if(Math.random()<0.4){
    let best=99; for(let r=4;r<=36;r+=8) for(let k=0;k<8;k++){ const a=k/8*TAU; if(getH(P.x+Math.sin(a)*r,P.z+Math.cos(a)*r)<WATER) best=Math.min(best,r); }
    if(getH(P.x,P.z)<WATER) best=0; waterNear=best>36?0:1-best/40;
    fdNear=forestDensity(P.x,P.z);
  }
  waterNear=Math.max(waterNear,dgEntWater(P.x,P.z));   // dungeons: the Falls Door's cascade roars through the water loop
  const L=SND.loops, set=(g,v)=>g.gain.setTargetAtTime(v,now,0.4);
  const gust=0.6+0.4*Math.sin(t*0.23)*Math.sin(t*0.61), cold=inHoar(P.x,P.z)?1:0;   // (cold: the Hoarfrost Reach, more wind, no birds, crickets or frogs)
  set(L.wind.g,(0.05+0.09*smoothstep(8,40,P.y)+0.05*cold)*gust*(0.7+0.3*day));
  L.wind.f.frequency.setTargetAtTime(380+gust*380*(1+0.3*cold),now,0.5);
  set(L.leaves.g,0.012*fdNear*gust*(vDist(P.x,P.z)<VIL.r?0.3:1)*(1-cold));
  set(L.water.g,0.16*waterNear*waterNear);
  const FV=vilAt(P.x,P.z), fd=FV.fire?Math.hypot(P.x-FV.fire.x,P.z-FV.fire.z):99;
  set(L.fire.g,fd<16?0.1*(1-fd/16)*(0.5+night*0.5):0);
  const k=T/0.1; // events per tick scale
  const r=p=>Math.random()<p*k;
  const around=(rmin,rmax)=>{ const a=AR(0,TAU), d=AR(rmin,rmax); return spatial(P.x+Math.sin(a)*d,P.z+Math.cos(a)*d,10,80); };
  if(r(0.05*day*(0.3+fdNear)*(1-cold))){ const s=around(8,40); if(s) birdSong(s.pan,s.gain*1.6); }
  if(r(0.5*night*(1-cold))){ const s=around(4,25); if(s) cricket(s.pan,s.gain*1.4); }
  if(r(0.005*night*(1-cold))){ const s=around(20,50); if(s) owl(s.pan,s.gain*2); }
  if(r(0.004*night*cold)){ const s=around(60,160); if(s) wolfHowl(s.pan,s.gain*2.2); }   // a wolf, far off, on the long nights
  if(r(0.08*night*waterNear*(1-cold))){ const s=around(5,20); if(s) frog(s.pan,s.gain*1.5); }
  if(fd<18 && r(0.45*(1-fd/18))){ const s=spatial(FV.fire.x,FV.fire.z,4,20); if(s) crackle(s.pan,s.gain); }
  dgEntSounds(r,spatial);   // dungeons: drips at the Elder, the Barrow's hum
  if(W.ready){
    for(const d of W.duck){ if(r(0.004)){ const s=spatial(d.x,d.z,8,35); if(s) quack(s.pan,s.gain); } }
    if(day>0.5) for(const f of W.flocks){ if(r(0.004)){ const s=spatial(f.ax,f.az,20,90); if(s) crowCaw(s.pan,s.gain*1.5); } }
    for(const a of W.deer){ if(a.state!=='flee') continue; const i=Math.floor(a.phase/Math.PI); if(deerStep.get(a)!==i){ deerStep.set(a,i); const s=spatial(a.x,a.z,6,35); if(s) hoof(s.pan,s.gain); } }
  }
  // villagers: footsteps and murmured chats
  for(const n of NPCs){
    if(n.inside || !n.g.visible) continue;
    const i=Math.floor(n.walk/Math.PI);
    if(n.stepI!==i){ n.stepI=i; if(Math.hypot(n.vx,n.vz)>0.4){ const s=spatial(n.x,n.z,4,16); if(s) footstep(surfaceAt(n.x,n.z),0.4,s.pan,s.gain*0.7); } }
    if(n.state==='chat' && n.leader && !n.speaking && !(n.partner&&n.partner.speaking) && r(0.12) && SND.voiceMode!=='off'){
      const who=Math.random()<0.5?n:(n.partner||n); babble(who,'x'.repeat(Math.floor(AR(12,30))),0.3);
    }
  }
}

