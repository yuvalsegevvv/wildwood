//@ Dungeon mission kit Defense ("Hold the Ward Stone"): the stone in the round hall (the hub) against 2 rotations of 3 waves from the monster mouths 2 tiles out; breakers go for the stone; a reward chest after each rotation; the stone broken = lost; then the boss comes into the same hall
/* agent map
   exports: nothing (one dgDefineKit call, no top-level names; its helpers are fields of the kit: DG_KITS.defense.wave / spawn / cleared / hud)
   uses: dgObjS, dgBossS (kits.js), dgSpawnS (mobs.js), fx.js (dgObjHpS, dgObjHurtS, dgObjHealS, dgObjHitS, dgWalkS, dgSwingS, dgMouthsS, dgHallTileS, dgFreeNearS, dgChestS,
         dgChestOpenS, dgCountS, dgPickWalkerS), dgLoseS (runs.js)
   test: tools/dungeon-missions-smoke.js (won through the boss on two themes; lost when the stone breaks; party health; the chests)
   run.k = {stone (the objective 'stone': hp, max), rot 0..2, wave 0..2, state 'break' | 'wave' | 'done', t (seconds left of the break), queue [{role, elite}] (this wave, still
            to come), spawnT, mouths (S marks), mi (the next mouth)}
   HUD (run.hud): [rotation 1-2, wave 1-3, stone health %, monsters left in the wave (alive + still to come), seconds to the next wave (0 while one is on)]
   Numbers (docs/DUNGEONS.md sections 4 and 12): 2 rotations of 3 waves, 6 + 2 x rotation + 2 x wave monsters a wave counting both from 0 (6 8 10, then 8 10 12: 54 a run,
   inside the doc's 60), x DG_PARTY.count; at most DG_WAVE_ALIVE (40) alive; a quarter of each wave (at least 1) are breakers (they ignore you and walk to the stone: m.dgOwn);
   the last wave of each rotation brings an elite; groups of up to 3 every 1.5 s from the mouths 2 doors from the hall (the nearest there are if none); 12 s before the first wave,
   8 s between waves, 20 s after a rotation (its chest: dgChestS, the n-th at least rarity n - 1); the stone: DG_STONE_HITS (80) swings of the theme's average walker x
   DG_PARTY.obj, 6 m south of the boss's spot, heals 5% after each wave. After the second rotation the boss comes into the same hall; the stone still stands and still loses
   the run if the breakers left over break it. */
dgDefineKit('defense',{
  setup(run){
    const H=run.B.boss, at=dgFreeNearS(run,H.x,H.z+6,1.5), max=dgObjHpS(run,DG_STONE_HITS);
    run.k={stone:dgObjS(run,'stone',at.x,at.z,{r:2.5,v:100,hp:max,max}),rot:0,wave:0,state:'break',t:12,queue:[],spawnT:0,mouths:dgMouthsS(run,dgHallTileS(run),2,2),mi:0};
    toastTo(null,'Hold the ward stone in the round hall: the first wave comes in 12 s.','');
    DG_KITS.defense.hud(run);
  },
  tick(run,dt){
    const k=run.k, st=k.stone, D=DG_KITS.defense, L=dgLocalS(run,st.x,st.z);
    for(const m of run.mons){
      if(m.dgRole!=='breaker'||m.dead||m.remove) continue;
      const reach=m.T.rad+2.2, d=dgWalkS(run,m,L.x,L.z,dt,m.T.speed,reach);
      if(dgSwingS(m,dt,d<=reach+0.6)&&dgObjHurtS(run,st,dgObjHitS(m))){ dgLoseS(run,'the ward stone was broken.'); return; }
    }
    if(k.state==='break'){ k.t-=dt; if(k.t<=0) D.wave(run); }
    else if(k.state==='wave'){
      k.spawnT-=dt; if(k.spawnT<=0&&k.queue.length){ k.spawnT=1.5; D.spawn(run); }
      if(!k.queue.length&&!dgCountS(run,['wave','breaker'])) D.cleared(run);
    }
    D.hud(run);
  },
  onUse(run,p,ob){ if(ob.kind==='chest') dgChestOpenS(run,ob,p); },
  // a wave starts: its monsters queued (a quarter breakers, an elite in the last wave of a rotation), shuffled
  wave(run){
    const k=run.k, n=Math.round((6+2*k.rot+2*k.wave)*dgParty(Math.max(1,dgPresentS(run).length)).count), b=Math.max(1,Math.round(n/4)), q=[];
    for(let i=0;i<n;i++) q.push({role:i<b?'breaker':'wave',elite:k.wave===2&&i===b});
    for(let i=q.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [q[i],q[j]]=[q[j],q[i]]; }
    k.queue=q; k.state='wave'; k.spawnT=0;
    toastTo(null,'Wave '+(k.wave+1)+' of 3 (rotation '+(k.rot+1)+' of 2): '+n+' come for the stone.','bad');
  },
  spawn(run){
    const k=run.k; let room=Math.min(3,DG_WAVE_ALIVE-dgCountS(run,['wave','breaker']));
    while(room-->0&&k.queue.length){
      const e=k.queue.shift(), s=k.mouths[k.mi++%k.mouths.length], a=Math.random()*TAU, r=1+Math.random()*2;
      const m=dgSpawnS(run,dgPickWalkerS(run),s.x+Math.sin(a)*r,s.z+Math.cos(a)*r,{role:e.role,elite:e.elite,hunt:e.role==='wave'});
      if(m&&e.role==='breaker') m.dgOwn=true;
    }
  },
  // a wave is dead: the stone heals 5%; after the third of a rotation its chest, after the second rotation the boss
  cleared(run){
    const k=run.k, st=k.stone, H=run.B.boss;
    dgObjHealS(run,st,st.max*0.05); k.wave++;
    if(k.wave<3){ k.state='break'; k.t=8; toastTo(null,'The wave is broken. The next comes in 8 s.','good'); return; }
    k.rot++; k.wave=0; dgChestS(run,H.x+(k.rot===1?-6:6),H.z,k.rot);
    if(k.rot>=2){ k.state='done'; dgBossS(run); }
    else { k.state='break'; k.t=20; toastTo(null,'The first rotation is held. The second begins in 20 s.','good'); }
  },
  hud(run){
    const k=run.k, done=k.state==='done';
    run.hud=[done?2:k.rot+1,done?3:k.wave+1,k.stone.v,k.queue.length+dgCountS(run,['wave','breaker']),k.state==='break'?Math.ceil(k.t):0];
  }
});
