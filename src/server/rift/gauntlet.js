//@ Rift mode Gauntlet (the Forge Rift): no waves; five forge champions one after another (a Herald-sized elite of the rift's kinds, tougher each time, with a few adds), fire vents flaring under you (a glowing ring, RIFT_VENT_WARN s, a fifth of your health), a RIFT_GAUNT_S clock: out of time = lost
/* agent map: one RIFT_MODE_KITS entry; objectives 'vent' (removed when it flares). Stages: 2 a champion. Test: tools/rift-smoke.js */
const RIFT_GAUNT_S=600, RIFT_CHAMPS=5, RIFT_VENT_WARN=1.5, RIFT_VENT_HURT=0.2, RIFT_VENT_R=3.5;
RIFT_MODE_KITS.gauntlet={
  setup(run){ Object.assign(run.k,{c:0,champ:null,next:RIFT_COUNT_S,vt:6,vents:[]}); RIFT_MODE_KITS.gauntlet.hud(run); },
  tick(run,dt){ const k=run.k, G=RIFT_MODE_KITS.gauntlet;
    if(k.c>=RIFT_CHAMPS){ for(const v of k.vents) dgObjDelS(run,v.ob); k.vents=[]; riftWonS(run); return; }
    if(run.t>=RIFT_GAUNT_S){ dgLoseS(run,'the forge\'s clock ran out.'); return; }
    if(!k.champ&&run.t>=k.next) G.champion(run);
    if(k.c||k.champ){ k.vt-=dt; if(k.vt<=0){ k.vt=Math.max(2.5,5-0.5*k.c); G.vent(run); } }
    for(const v of [...k.vents]){ v.t-=dt; if(v.t>0) continue;
      for(const p of dgPresentS(run)) if(!p.dead&&Math.hypot(p.x-v.ob.x,p.z-v.ob.z)<=RIFT_VENT_R) dgHurtPctS(p,RIFT_VENT_HURT);
      dgObjDelS(run,v.ob); k.vents.splice(k.vents.indexOf(v),1); }
    riftPourS(run); G.hud(run); },
  // champion i (0-4): one of the rift's kinds as a Herald-sized elite, x (0.6 + 0.25 i) more health, on the farthest platform, with 3 + i adds through the tears
  champion(run){ const k=run.k, R=RIFT_DEFS[run.rift], far=riftBigIslesS(run,1)[0], id=R.kinds[(k.c+1)%R.kinds.length].id;
    const m=riftSpawnS(run,id,far.x,far.z,true); if(!m) return; m.maxHp=m.hp=m.maxHp*(0.6+0.25*k.c); m.riftChamp=true; k.champ=m;
    riftQueueS(run,3+k.c,4,1+2*k.c,''); toastTo(null,'Forge champion '+(k.c+1)+' of '+RIFT_CHAMPS+': '+m.name+'!','bad'); },
  vent(run){ const k=run.k, p=dgPresentS(run).find(q=>!q.dead); if(!p) return; const a=Math.random()*TAU, r=Math.random()*2, L=dgLocalS(run,p.x+Math.sin(a)*r,p.z+Math.cos(a)*r);
    k.vents.push({t:RIFT_VENT_WARN,ob:dgObjS(run,'vent',L.x,L.z,{r:RIFT_VENT_R,v:0})}); },
  onKill(run,m){ const k=run.k; if(!m.riftChamp) return; k.c++; k.champ=null; k.next=run.t+3; riftStageS(run,2*k.c); },
  hud(run){ const k=run.k; riftHudS(run,k.st,RIFT_GAUNT_S-run.t,Math.min(RIFT_CHAMPS,k.c+1),0); },
};
