//@ Rift mode Lanterns (the Long-night Rift): a dark void (the client's look); four shadow cores on the platforms, each shielded while its three wardens live; break an open core with a 2 s channel (the talk key); a small wave every RIFT_LANTERN_POUR_S; all cores broken call the Night Herald; its death wins
/* agent map: one RIFT_MODE_KITS entry; objectives 'core' (v = wardens left, 0 = open; st 2 = broken). Stages: 2 a core, the Herald's death the 10th. Test: tools/rift-smoke.js */
const RIFT_LANTERN_POUR_S=22, RIFT_WARDENS=3;
RIFT_MODE_KITS.lanterns={
  setup(run){ const k=run.k; k.cores=riftBigIslesS(run,4).map(c=>{ const ob=dgObjS(run,'core',c.x,c.z,{r:2,v:RIFT_WARDENS}); riftGuardsS(run,ob,RIFT_WARDENS,2); return ob; });
    k.broken=0; k.pt=RIFT_LANTERN_POUR_S; k.herald=0; RIFT_MODE_KITS.lanterns.hud(run); },
  tick(run,dt){ const k=run.k;
    if(k.herald===2){ riftWonS(run); return; }
    if(!k.herald){ k.pt-=dt; if(k.pt<=0){ k.pt=RIFT_LANTERN_POUR_S; riftQueueS(run,5+2*k.broken,5,1+2*k.broken,''); } }
    riftPourS(run); RIFT_MODE_KITS.lanterns.hud(run); },
  onKill(run,m){ const k=run.k; if(m.dgRole==='herald'){ k.herald=2; return; }
    const ob=m.riftGuard&&k.cores.find(o=>o.id===m.riftGuard); if(ob&&ob.st===1&&ob.v>0){ dgObjSetS(run,ob,1,ob.v-1); if(!ob.v) toastTo(null,'A shadow core is open: hold the talk key on it to break it.','good'); } },
  onUse(run,p,ob){ const k=run.k; if(ob.kind!=='core'||ob.st!==1) return; if(ob.v>0){ toastTo(p.id,'Its wardens still shield it: '+ob.v+' left.','bad'); return; }
    dgChannelS(run,p,ob,2,()=>{ if(ob.st!==1||run.endT) return; dgObjSetS(run,ob,2,0); k.broken++; riftStageS(run,Math.round(8*k.broken/k.cores.length));
      if(k.broken>=k.cores.length){ k.herald=1; riftQueueHeraldS(run,run.t+1.5,9); toastTo(null,'The last core breaks. The Night Herald comes!','bad'); } else toastTo(null,'A shadow core breaks: '+(k.cores.length-k.broken)+' to go.','good'); }); },
  hud(run){ const k=run.k; riftHudS(run,k.st,0,k.broken,k.cores.filter(o=>o.st===1&&o.v>0).length); },
};
