//@ Rift mode Beacons (the Sunlit Rift): three sun beacons on the far platforms; stand in one's circle to light it (RIFT_BEACON_S s) while monsters pour in steadily; a lit beacon heals who stands in it; all three lit call the Radiant Herald; its death wins
/* agent map: one RIFT_MODE_KITS entry; objectives 'beacon' (v = lit %, st 2 = lit). Stages: the lit share of all three x 9, the Herald's death the 10th. Test: tools/rift-smoke.js */
const RIFT_BEACON_S=22, RIFT_BEACON_POUR_S=14, RIFT_BEACON_HEAL=0.03;
RIFT_MODE_KITS.beacons={
  setup(run){ const k=run.k; k.bs=riftBigIslesS(run,3).map(c=>dgObjS(run,'beacon',c.x,c.z,{r:5,v:0,fill:0})); k.lit=0; k.pt=RIFT_COUNT_S; k.cur=0; k.herald=0; RIFT_MODE_KITS.beacons.hud(run); },
  tick(run,dt){ const k=run.k, pl=dgPresentS(run).filter(p=>!p.dead);
    if(k.herald===2){ riftWonS(run); return; }
    k.cur=0;
    for(const b of k.bs){ const inside=pl.filter(p=>Math.hypot(p.x-b.x,p.z-b.z)<=b.r);
      if(b.st===2){ for(const p of inside) p.hp=Math.min(p.maxHp,p.hp+p.maxHp*RIFT_BEACON_HEAL*dt); continue; }
      if(!inside.length) continue;
      b.fill=Math.min(100,b.fill+dt*100/RIFT_BEACON_S); k.cur=Math.max(k.cur,b.fill); const v=Math.floor(b.fill/5)*5;
      if(b.fill>=100){ dgObjSetS(run,b,2,100); k.lit++; toastTo(null,k.lit<3?'A beacon burns! '+(3-k.lit)+' to go.':'All three beacons burn: the Radiant Herald comes!','good'); }
      else if(v!==b.v) dgObjSetS(run,b,1,v); }
    riftStageS(run,Math.min(9,Math.floor(k.bs.reduce((s,b)=>s+b.fill,0)/(100*k.bs.length)*9)));
    if(k.lit>=k.bs.length&&!k.herald){ k.herald=1; riftQueueHeraldS(run,run.t+1,9); }
    if(!k.herald){ k.pt-=dt; if(k.pt<=0){ k.pt=RIFT_BEACON_POUR_S; riftQueueS(run,8+3*k.lit,6,1+3*k.lit,''); } }
    riftPourS(run); RIFT_MODE_KITS.beacons.hud(run); },
  onKill(run,m){ if(m.dgRole==='herald') run.k.herald=2; },
  hud(run){ const k=run.k; riftHudS(run,k.st,0,k.lit,k.cur); },
};
