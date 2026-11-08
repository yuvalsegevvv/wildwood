//@ Rift mode Quarry (the Stone Rift): a stone colossus (the Herald, x RIFT_COLOSSUS_HP more) walks the platforms, immune while its four glass pylons stand; each pylon has three guards; break a pylon with a 3 s channel; all four broken open the colossus; its death wins
/* agent map: one RIFT_MODE_KITS entry; objectives 'pylon' (v = 0, st 2 = broken); the colossus is m.immune until then. Stages: 2 a pylon, 9 at half its health, 10 its death. Test: tools/rift-smoke.js */
const RIFT_COLOSSUS_HP=2.5, RIFT_PYLON_S=3, RIFT_QUARRY_POUR_S=26;
RIFT_MODE_KITS.quarry={
  setup(run){ const k=run.k, isles=riftBigIslesS(run,5), far=isles[0], R=RIFT_DEFS[run.rift];
    k.col=riftSpawnS(run,R.herald,far.x,far.z,true); if(k.col){ k.col.maxHp=k.col.hp=k.col.maxHp*RIFT_COLOSSUS_HP; k.col.immune=true; k.col.riftCol=true; }
    k.py=(isles.length>4?isles.slice(1):isles).slice(0,4).map(c=>{ const ob=dgObjS(run,'pylon',c.x,c.z,{r:2,v:0}); riftGuardsS(run,ob,3,1); return ob; });
    k.broken=0; k.pt=RIFT_QUARRY_POUR_S; k.dead=false; RIFT_MODE_KITS.quarry.hud(run); },
  tick(run,dt){ const k=run.k;
    if(k.dead){ riftWonS(run); return; }
    if(k.col&&!k.col.immune&&k.col.hp<=k.col.maxHp/2) riftStageS(run,9);
    k.pt-=dt; if(k.pt<=0){ k.pt=RIFT_QUARRY_POUR_S; riftQueueS(run,5+2*k.broken,5,1+2*k.broken,''); }
    riftPourS(run); RIFT_MODE_KITS.quarry.hud(run); },
  onKill(run,m){ if(m.riftCol) run.k.dead=true; },
  onUse(run,p,ob){ const k=run.k; if(ob.kind!=='pylon'||ob.st!==1) return;
    dgChannelS(run,p,ob,RIFT_PYLON_S,()=>{ if(ob.st!==1||run.endT) return; dgObjSetS(run,ob,2,0); k.broken++; riftStageS(run,Math.round(8*k.broken/k.py.length));
      if(k.broken>=k.py.length){ if(k.col) k.col.immune=false; toastTo(null,'The last pylon shatters: the colossus can be hurt!','good'); } else toastTo(null,'A pylon shatters: '+(k.py.length-k.broken)+' to go.','good'); }); },
  hud(run){ const k=run.k, c=k.col; riftHudS(run,k.st,0,k.py.filter(o=>o.st===1).length,c&&!c.dead?Math.ceil(100*c.hp/c.maxHp):0); },
};
