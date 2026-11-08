//@ Rift mode Heartwood (the Taproot): a root heart on the hub; ten waves, a quarter of each are breakers that walk to the heart and swing at it; it heals 5% a wave; broken = the run is lost
/* agent map: one RIFT_MODE_KITS entry; the heart is objective 'riftheart' (v = health %), RIFT_HEART_HITS swings of the rift's average monster at the tier. Test: tools/rift-smoke.js */
const RIFT_HEART_HITS=140, RIFT_HEART_BREAK=0.25;
RIFT_MODE_KITS.heart={
  setup(run){ Object.assign(run.k,{w:0,start:0,size:0,dead:0}); const st=run.B.start, max=riftObjHpS(run,RIFT_HEART_HITS); run.k.heart=dgObjS(run,'riftheart',st.x,st.z-6,{r:2.5,v:100,hp:max,max}); RIFT_MODE_KITS.heart.hud(run); },
  tick(run,dt){ const k=run.k;
    if(riftBreakersS(run,k.heart,dt)){ dgLoseS(run,'the heartwood was broken.'); return; }
    if(riftWaveStepS(run,RIFT_HEART_BREAK,()=>dgObjHealS(run,k.heart,k.heart.max*0.05))==='won'){ riftWonS(run); return; }
    RIFT_MODE_KITS.heart.hud(run); },
  onKill(run,m){ if(m.riftW===run.k.w) run.k.dead++; },
  hud(run){ const h=run.k.heart; riftHudS(run,run.k.w|0,riftWaveClockS(run),h?Math.ceil(100*h.hp/h.max):0,0); },
};
