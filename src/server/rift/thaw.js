//@ Rift mode Thaw (the Rime Rift): frost creeps over you (full in RIFT_FROST_S s), every kill melts some, at full frost it bites (5% of your health a second); waves on a clock; after RIFT_THAW_S the Rimecaller comes; its death wins
/* agent map: one RIFT_MODE_KITS entry. Stages: the clock (one per RIFT_THAW_S / 10 s, up to 9), the Rimecaller's death the 10th. Test: tools/rift-smoke.js */
const RIFT_THAW_S=360, RIFT_FROST_S=45, RIFT_FROST_KILL=8, RIFT_FROST_BITE=0.05, RIFT_THAW_POUR_S=24;
RIFT_MODE_KITS.thaw={
  setup(run){ Object.assign(run.k,{fr:0,bt:0,pt:RIFT_COUNT_S,herald:0}); RIFT_MODE_KITS.thaw.hud(run); },
  tick(run,dt){ const k=run.k, t=run.t;
    if(k.herald===2){ riftWonS(run); return; }
    k.fr=Math.min(100,k.fr+dt*100/RIFT_FROST_S);
    if(k.fr>=100){ k.bt+=dt; if(k.bt>=1){ k.bt=0; for(const p of dgPresentS(run)) dgHurtPctS(p,RIFT_FROST_BITE); } } else k.bt=0;
    const stage=Math.min(9,Math.floor(t/(RIFT_THAW_S/RIFT_WAVES))); riftStageS(run,stage);
    if(!k.herald){ k.pt-=dt; if(k.pt<=0){ k.pt=RIFT_THAW_POUR_S; riftQueueS(run,10+2*(stage+1),8,stage+1,''); }
      if(t>=RIFT_THAW_S){ k.herald=1; riftQueueHeraldS(run,t,10); toastTo(null,'The Rimecaller tears through the glass!','bad'); } }
    riftPourS(run); RIFT_MODE_KITS.thaw.hud(run); },
  onKill(run,m){ const k=run.k; k.fr=Math.max(0,k.fr-RIFT_FROST_KILL); if(m.dgRole==='herald') k.herald=2; },
  hud(run){ const k=run.k; riftHudS(run,k.st,Math.max(0,RIFT_THAW_S-run.t),k.fr,0); },
};
