//@ Dungeon mission kit Sabotage ("The Heartroots"): three heartroots in the three site rooms, each shielded until its warden pack is dead, then broken by a 2 s channel (use); the third broken calls the boss that guarded them
/* agent map
   exports: nothing (one dgDefineKit call, no top-level names; its helper is a field of the kit: DG_KITS.sabotage.hud)
   uses: dgObjS, dgObjSetS, dgBossS (kits.js), dgSpawnS (mobs.js), fx.js (dgChannelS, dgGuardiansS, dgPacksS, dgFreeNearS, dgWalkersS)
   test: tools/dungeon-missions-smoke.js (won through the boss on two themes; a shielded root refuses; the channel breaks when you walk off; lost = everyone down, the foundation's)
   run.k = {roots [the three objectives 'heartroot': v = its wardens still standing (0 = the shield is down), st 1 standing | 2 broken], done 0..3}
   HUD (run.hud): [heartroots broken 0-3, how many 3, unshielded and still standing]
   Numbers: each root's pack is 4 walkers round it (3-6 m) and the guardian at the site's post (the Ancient Treant in the Heartwood Knot: it keeps to the room, dgGuardS),
   or, where the site has no post (the springs, the barrow), an elite walker; a root's monsters carry m.dgOb = its id. Breaking: dg{a:'use'} within 2 + 1.5 m once the shield
   is down starts a 2 s channel (the cast bar: cast [pid, -2, 2, id]; walking 1.5 m off or being downed breaks it). The rest of the map: a pack of 1-2 walkers at 40% of
   the other mouths, and the room guardians at their posts. Sites: the layout's three site tiles (>= 3 tiles apart, docs/DUNGEONS.md section 4). */
dgDefineKit('sabotage',{
  setup(run){
    const walk=dgWalkersS(run), rng=mulberry32((run.seed|0)^0x5ab07a6e), sites=run.B.marks.O.filter(o=>o.role==='site').slice(0,3), roots=[];
    const wards=dgGuardiansS(run,{sites:true,rooms:true,role:'guard'});
    for(const o of sites){
      const at=dgFreeNearS(run,o.x,o.z,1), ob=dgObjS(run,'heartroot',at.x,at.z,{r:2,v:0,tile:o.tile}); roots.push(ob);
      const pack=[];
      for(let i=0;i<4&&walk.length;i++){ const a=rng()*TAU, r=3+rng()*3, m=dgSpawnS(run,walk[Math.floor(rng()*walk.length)],o.x+Math.sin(a)*r,o.z+Math.cos(a)*r,{role:'warden'}); if(m) pack.push(m); }
      const g=wards.filter(m=>m.dgGuard.tile[0]===o.tile[0]&&m.dgGuard.tile[1]===o.tile[1]);
      if(g.length) for(const m of g){ m.dgRole='warden'; pack.push(m); }
      else if(walk.length){ const m=dgSpawnS(run,walk[Math.floor(rng()*walk.length)],o.x+2,o.z+2,{role:'warden',elite:true}); if(m) pack.push(m); }
      for(const m of pack) m.dgOb=ob.id;
      dgObjSetS(run,ob,1,pack.length);
    }
    dgPacksS(run,{p:0.4,min:1,max:2,role:'roam',salt:0x2b,skip:sites.map(o=>o.tile)});
    run.k={roots,done:0};
    toastTo(null,'Break the '+roots.length+' heartroots: kill each one\'s wardens to drop its shield.','');
    DG_KITS.sabotage.hud(run);
    if(!roots.length) dgBossS(run);
  },
  onKill(run,m){
    if(m.dgRole!=='warden') return;
    const ob=run.k.roots.find(o=>o.id===m.dgOb); if(!ob||ob.st!==1||ob.v<=0) return;
    dgObjSetS(run,ob,1,ob.v-1);
    if(!ob.v) toastTo(null,'A heartroot\'s shield is down: break it (use it for 2 s).','good');
    DG_KITS.sabotage.hud(run);
  },
  onUse(run,p,ob){
    if(ob.kind!=='heartroot'||ob.st!==1) return;
    if(ob.v>0){ toastTo(p.id,'It is shielded: '+ob.v+(ob.v>1?' wardens still stand.':' warden still stands.'),'bad'); return; }
    dgChannelS(run,p,ob,2,(q,o)=>{
      if(o.st!==1||run.endT) return;
      const k=run.k; dgObjSetS(run,o,2,0); k.done++;
      toastTo(null,q.name+' broke a heartroot ('+k.done+' of '+k.roots.length+').','good');
      DG_KITS.sabotage.hud(run);
      if(k.done>=k.roots.length) dgBossS(run);
    });
  },
  hud(run){ const k=run.k; run.hud=[k.done,k.roots.length,k.roots.filter(o=>o.st===1&&o.v<=0).length]; }
});
