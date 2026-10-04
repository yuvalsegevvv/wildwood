//@ Dungeon mission kit Purge: packs wait at the monster mouths of every room; kill them all and the boss of the round hall appears; its death clears the run
/* agent map
   exports: nothing (one dgDefineKit call, no top-level names)
   uses: dgSpawnS, dgBossS (server/dungeons/mobs.js, kits.js), run.B.marks.S (the monster mouths), run.theme.mobs.walkers
   test: tools/dungeon-runs-smoke.js (a purge run won through its boss)
   run.k = {need, killed}; HUD (run.hud, the snapshot's dg after the first three numbers): [killed, needed].
   First-guess numbers: 2-3 walkers at every monster mouth outside the entrance and the boss hall (a 4 x 4 purge of the bare set: about 6 mouths, 15 monsters).
   Guardians (the theme's big monsters, which need wider doors) are not used yet. A theme without walkers (the bare test set) fights slimes, mushrooms and beetles. */
dgDefineKit('purge',{
  setup(run){
    const T=run.theme, walk=((T.mobs&&T.mobs.walkers)||['slime','shroom','beetle']).filter(id=>DEF_BY_ID[id]), rng=mulberry32((run.seed|0)^0x2f1e6d);
    run.k={need:0,killed:0};
    if(walk.length) for(const s of run.B.marks.S){
      if(s.role==='start'||s.role==='boss') continue;
      const n=2+(rng()<0.5?1:0);
      for(let i=0;i<n;i++){ const a=rng()*TAU, r=1+rng()*2.5; if(dgSpawnS(run,walk[Math.floor(rng()*walk.length)],s.x+Math.sin(a)*r,s.z+Math.cos(a)*r,{role:'purge'})) run.k.need++; }
    }
    run.hud=[0,run.k.need];
    if(!run.k.need) dgBossS(run);
  },
  onKill(run,m){
    if(m.dgRole!=='purge') return;
    run.k.killed++; run.hud=[run.k.killed,run.k.need];
    if(run.k.killed>=run.k.need) dgBossS(run);
  }
});
