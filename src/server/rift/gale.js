//@ Rift mode Gale (the Petal Rift): ten waves, and every RIFT_GUST_S a gust: one platform glows (most often the one you stand on), RIFT_GUST_WARN s later the wind throws whoever is on it (a third of their health; monsters lose half)
/* agent map: one RIFT_MODE_KITS entry; the warning is objective 'gust' (removed when it blows). Test: tools/rift-smoke.js */
const RIFT_GUST_S=16, RIFT_GUST_WARN=3, RIFT_GUST_HURT=0.33;
RIFT_MODE_KITS.gale={
  setup(run){ Object.assign(run.k,{w:0,start:0,size:0,dead:0}); run.k.gt=RIFT_GUST_S; run.k.gust=null; RIFT_MODE_KITS.gale.hud(run); },
  tick(run,dt){ const k=run.k, G=RIFT_MODE_KITS.gale;
    if(riftWaveStepS(run,0)==='won'){ if(k.gust) dgObjDelS(run,k.gust.ob); riftWonS(run); return; }
    if(k.w>0){ if(!k.gust){ k.gt-=dt; if(k.gt<=0) G.warn(run); } else { k.gust.t-=dt; if(k.gust.t<=0) G.blow(run); } }
    G.hud(run); },
  // which platform: the one a hiker stands on 2 times in 3, else any
  warn(run){ const k=run.k, isles=run.lay.isles, p=dgPresentS(run)[0], L=p&&dgLocalS(run,p.x,p.z);
    const on=L&&isles.find(c=>Math.hypot(L.x-c.x,L.z-c.z)<=c.r+1), c=on&&Math.random()<0.67?on:isles[Math.floor(Math.random()*isles.length)];
    k.gust={c,t:RIFT_GUST_WARN,ob:dgObjS(run,'gust',c.x,c.z,{r:c.r,v:0})}; for(const q of dgPresentS(run)) toastTo(q.id,'A gust is coming: get off the glowing platform!','bad'); },
  blow(run){ const k=run.k, c=k.gust.c, on=(x,z)=>{ const L=dgLocalS(run,x,z); return Math.hypot(L.x-c.x,L.z-c.z)<=c.r+1; }, pl=dgPresentS(run);
    for(const p of pl) if(!p.dead&&on(p.x,p.z)){ dgHurtPctS(p,RIFT_GUST_HURT); toastTo(p.id,'The gust throws you across the glass!','bad'); }
    for(const m of [...run.mons]) if(!m.dead&&!m.remove&&!m.elite&&on(m.x,m.z)){ m.hp-=m.maxHp*0.5; if(m.hp<=0&&pl[0]){ m.hp=0; killMonsterS(m,pl[0]); } }
    dgObjDelS(run,k.gust.ob); k.gust=null; k.gt=RIFT_GUST_S; },
  onKill(run,m){ if(m.riftW===run.k.w) run.k.dead++; },
  hud(run){ const k=run.k; riftHudS(run,k.w|0,riftWaveClockS(run),k.gust?Math.ceil(k.gust.t):Math.ceil(k.gt||0),k.gust?1:0); },
};
