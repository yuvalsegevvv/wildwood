//@ Dungeon mission kit Survival ("The Long Night"): a lantern in the round hall is the clock (kills and flasks feed it), spawns thicken with time, reward chests at 5:00 and 10:00; in the dark everyone loses 4% of their health a second; at 10:00 the lantern is topped up and the boss comes
/* agent map
   exports: nothing (one dgDefineKit call, no top-level names; its helpers are fields of the kit: DG_KITS.survival.spawn / take / hud)
   uses: dgObjS, dgObjSetS, dgObjDelS, dgBossS (kits.js), dgSpawnS (mobs.js), fx.js (dgHurtPctS, dgMouthsS, dgHallTileS, dgFreeNearS, dgChestS, dgChestOpenS, dgAliveS, dgPickWalkerS)
   test: tools/dungeon-missions-smoke.js (won through the boss on two themes; lost in the dark with everyone down; kills and flasks feed the light; the marks' chests)
   run.k = {lantern (the objective 'lantern', v = its light in whole seconds, sent every 5 s and when it goes out or is lit), light (seconds), marks 0..2, spawnT, eliteT, dark,
            darkT, stop (the 10:00 mark: no more draining or spawning), mouths, mi, sentT}
   HUD (run.hud): [light in seconds (rounded up), marks reached 0-2]   (the time is the snapshot's own seconds since setup, dg[1]: the marks are at 300 and 600)
   Numbers (docs/DUNGEONS.md sections 4 and 12): the light starts at 120 s, drains 1 s a second, at most 300 s (the kit's max: the doc names no cap); a kill +2 s, an elite +10;
   a kill drops a flask 10% of the time (an elite always): +30 s, picked up by walking within 1.8 m or with use, gone after 40 s; a group of 2 + 1 per 2:30 elapsed (at most 5)
   every max(2.5, 8 - t/100) s at a mouth 1-3 doors from the hall, coming for you, an elite walker every 60 s, at most 40 alive; in the dark (0 light) every living member loses
   4% of max health a second (dgHurtPctS: no armour) until a kill or a flask relights it; at 5:00 a chest, at 10:00 a chest, the lantern topped up to at least 120 s and
   stopped, the spawning stopped and the boss in the same hall. Lose: everyone down (the foundation's rule). */
dgDefineKit('survival',{
  max:300,
  setup(run){
    const H=run.B.boss, at=dgFreeNearS(run,H.x,H.z+6,1.2);
    run.k={lantern:dgObjS(run,'lantern',at.x,at.z,{r:2,v:120}),light:120,marks:0,spawnT:6,eliteT:60,dark:false,darkT:0,stop:false,mouths:dgMouthsS(run,dgHallTileS(run),1,3),mi:0,sentT:5};
    toastTo(null,'Keep the lantern lit: every kill feeds it. Hold out to 10:00.','');
    DG_KITS.survival.hud(run);
  },
  tick(run,dt){
    const k=run.k, V=DG_KITS.survival;
    for(const ob of [...run.objs]){
      if(ob.kind!=='flask'||ob.st!==1) continue;
      if(S.t>=ob.until){ dgObjDelS(run,ob); continue; }
      const p=dgMembersS(run).find(q=>Math.hypot(q.x-ob.x,q.z-ob.z)<1.8); if(p) V.take(run,p,ob);
    }
    if(!k.stop){
      k.light=Math.max(0,k.light-dt);
      if(k.light<=0){
        if(!k.dark){ k.dark=true; k.darkT=0; dgObjSetS(run,k.lantern,1,0); toastTo(null,'The lantern is out! The dark bites: kill to relight it.','bad'); }
        k.darkT-=dt; if(k.darkT<=0){ k.darkT=1; for(const p of dgMembersS(run)) dgHurtPctS(p,0.04); }
      } else if(k.dark){ k.dark=false; dgObjSetS(run,k.lantern,1,Math.ceil(k.light)); toastTo(null,'The lantern burns again.','good'); }
      k.spawnT-=dt; if(k.spawnT<=0){ k.spawnT=Math.max(2.5,8-run.t/100); V.spawn(run,Math.min(5,2+Math.floor(run.t/150)),false); }
      k.eliteT-=dt; if(k.eliteT<=0){ k.eliteT=60; V.spawn(run,1,true); }
      k.sentT-=dt; if(k.sentT<=0&&!k.dark){ k.sentT=5; dgObjSetS(run,k.lantern,1,Math.ceil(k.light)); }
      const H=run.B.boss;
      if(run.t>=300&&k.marks<1){ k.marks=1; dgChestS(run,H.x-6,H.z,1); toastTo(null,'Five minutes! The night is half gone.','good'); }
      if(run.t>=600&&k.marks<2){
        k.marks=2; k.stop=true; k.dark=false; k.light=Math.max(k.light,120); dgObjSetS(run,k.lantern,2,Math.ceil(k.light));
        dgChestS(run,H.x+6,H.z,2); toastTo(null,'Ten minutes! The lantern blazes up and holds.','good'); dgBossS(run);
      }
    }
    V.hud(run);
  },
  onKill(run,m){
    const k=run.k; if(k.stop||m.boss) return;
    k.light=Math.min(DG_KITS.survival.max,k.light+(m.elite?10:2));
    if(m.elite||Math.random()<0.1){ const L=dgLocalS(run,m.x,m.z), at=dgFreeNearS(run,L.x,L.z,0.5); dgObjS(run,'flask',at.x,at.z,{r:1.2,v:30,until:S.t+40}); }
  },
  onUse(run,p,ob){ if(ob.kind==='flask') DG_KITS.survival.take(run,p,ob); else if(ob.kind==='chest') dgChestOpenS(run,ob,p); },
  take(run,p,ob){
    const k=run.k; if(ob.st!==1) return;
    dgObjDelS(run,ob); if(k.stop) return;
    k.light=Math.min(DG_KITS.survival.max,k.light+30); toastTo(null,p.name+' poured a flask: +30 s of light.','good');
  },
  spawn(run,n,elite){
    const k=run.k; n=Math.min(n,DG_WAVE_ALIVE-dgAliveS(run));
    for(let i=0;i<n;i++){ const s=k.mouths[k.mi++%k.mouths.length], a=Math.random()*TAU, r=1+Math.random()*2; dgSpawnS(run,dgPickWalkerS(run),s.x+Math.sin(a)*r,s.z+Math.cos(a)*r,{role:'night',elite,hunt:true}); }
  },
  hud(run){ run.hud=[Math.ceil(run.k.light),run.k.marks]; }
});
