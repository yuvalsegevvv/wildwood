//@ Dungeon mission kit Escort: free the captive in the far site room (a 5 s channel, six jailers on guard), then they follow the nearest member at 90% of a hiker's run; monsters go for them 30% of the time; stepping into the round hall with them wakes the boss, and they must live through the fight
/* agent map
   exports: nothing (one dgDefineKit call, no top-level names; its helpers are fields of the kit: DG_KITS.escort.free / follow / pick / hud)
   uses: dgObjS, dgObjSetS, dgBossS (kits.js), dgSpawnS, dgFlowToS (mobs.js), fx.js (dgChannelS, dgObjHpS, dgObjHurtS, dgObjHitS, dgObjMoveS, dgWalkS, dgSwingS, dgPacksS,
         dgGuardiansS, dgFreeNearS, dgInHallS, dgWalkersS), dgLoseS (runs.js)
   test: tools/dungeon-missions-smoke.js (won through the boss on two themes: freed, led, the hall wakes the boss; lost when the captive dies)
   THE CAPTIVE IS AN OBJECTIVE, NOT A MONSTER (kind 'captive', v = its health %): players' attacks cannot touch it, the walkers' AI never sees it, and the clients draw it
   from dgo events (it moves: a dgo with its new x, z when it has gone 0.75 m since the last one sent, at most 5 a second: the client glides it between them).
   run.k = {cap (the objective: hp, max), state 0 caged | 1 following | 2 in the hall (the boss is up), lx, lz (its place, local), sentX, sentZ, sentT (the last dgo sent), pickT, hall {x, z, r} (local)}
   HUD (run.hud): [state 0 caged | 1 following | 2 at the hall, its health %, metres from it to the hall's circle (0 inside)]
   Numbers (docs/DUNGEONS.md sections 4 and 12): six jailers round it (2.5-5 m) that fight like any walker; freeing: dg{a:'use'} within 1.5 + 1.5 m, a 5 s channel (the cast bar);
   it cannot be hurt while caged. Free, it follows the nearest living member when more than 3 m away, along the flow field, at DG_KITS.escort.speed = 8.5 m/s (90% of a
   hiker's 9.5 run); health DG_CAPTIVE_HITS (20) swings of the theme's average walker x DG_PARTY.obj. Every run monster (the boss's adds too, not the boss) that comes within
   18 m of it in sight decides once: 30% go for the captive (m.dgOwn: the kit walks them to it and their swings take its health), the rest keep to the players. When it is
   within the hall's circle (r - 3) with a living member in the circle too, the boss appears; lose "the captive died." the moment its health is 0, boss or not. The rest:
   packs of 1-2 walkers at 40% of the mouths outside its room, the room guardians. */
dgDefineKit('escort',{
  speed:8.5, pickR:18, pickP:0.3,
  setup(run){
    const walk=dgWalkersS(run), rng=mulberry32((run.seed|0)^0xe5c0e7), o=run.B.marks.O.find(m=>m.role==='site')||{x:run.B.start.x,z:run.B.start.z,tile:run.B.layout.start};
    const at=dgFreeNearS(run,o.x,o.z,0.5), max=dgObjHpS(run,DG_CAPTIVE_HITS), H=run.B.boss;
    run.k={cap:dgObjS(run,'captive',at.x,at.z,{r:1.5,v:100,hp:max,max}),state:0,lx:at.x,lz:at.z,sentX:at.x,sentZ:at.z,sentT:0,pickT:0,hall:{x:H.x,z:H.z,r:H.r}};
    for(let i=0;i<6&&walk.length;i++){ const a=i/6*TAU+rng()*0.5, r=2.5+rng()*2.5; dgSpawnS(run,walk[Math.floor(rng()*walk.length)],at.x+Math.sin(a)*r,at.z+Math.cos(a)*r,{role:'jailer'}); }
    dgPacksS(run,{p:0.4,min:1,max:2,role:'roam',salt:0x3c,skip:[o.tile]});
    dgGuardiansS(run,{sites:false,rooms:true,role:'guard'});
    toastTo(null,'Free the captive (use, 5 s) and lead them to the round hall.','');
    DG_KITS.escort.hud(run);
  },
  onUse(run,p,ob){
    if(ob.kind!=='captive'||run.k.state!==0) return;
    dgChannelS(run,p,ob,5,q=>{ if(run.k.state!==0||run.endT) return; run.k.state=1; toastTo(null,q.name+' freed the captive: lead them to the round hall!','good'); DG_KITS.escort.hud(run); });
  },
  tick(run,dt){
    const k=run.k, E=DG_KITS.escort, cap=k.cap;
    if(k.state>0){
      E.follow(run,dt);
      k.pickT-=dt; if(k.pickT<=0){ k.pickT=0.5; E.pick(run); }
      for(const m of run.mons){
        if(!m.dgTake||m.dead||m.remove) continue;
        const reach=m.T.rad+1.2, d=dgWalkS(run,m,k.lx,k.lz,dt,m.T.speed,reach);
        if(dgSwingS(m,dt,d<=reach+0.6)&&dgObjHurtS(run,cap,dgObjHitS(m))){ dgLoseS(run,'the captive died.'); return; }
      }
      if(k.state===1&&dgInHallS(run,k.lx,k.lz,-3)&&dgMembersS(run).some(p=>dgInHallS(run,p.x-run.ox,p.z-run.oz,-1))){
        k.state=2; dgObjSetS(run,cap,2,cap.v); toastTo(null,'The captive is in the round hall: keep them alive!','good'); dgBossS(run);
      }
    }
    E.hud(run);
  },
  // the captive walks after the nearest living member (more than 3 m away), round walls by the flow field; clients hear of it every 0.75 m, at most 5 times a second
  follow(run,dt){
    const k=run.k, B=run.B; let p=null, bd=1e9;
    for(const q of dgMembersS(run)){ const d=Math.hypot(q.x-run.ox-k.lx,q.z-run.oz-k.lz); if(d<bd){ bd=d; p=q; } }
    if(!p||bd<=3) return;
    const tx=p.x-run.ox, tz=p.z-run.oz, st=Math.min(dt,0.1);
    let dir=bd<10&&dgLos(B,k.lx,k.lz,tx,tz)?[(tx-k.lx)/bd,(tz-k.lz)/bd]:dgStep(B,dgFlowToS(run,tx,tz),k.lx,k.lz);
    if(!dir) return;
    const s=dgSlide(B,k.lx,k.lz,k.lx+dir[0]*DG_KITS.escort.speed*st,k.lz+dir[1]*DG_KITS.escort.speed*st,0.4); k.lx=s[0]; k.lz=s[1];
    if(Math.hypot(k.lx-k.sentX,k.lz-k.sentZ)>=0.75&&S.t-k.sentT>=0.2){ k.sentX=k.lx; k.sentZ=k.lz; k.sentT=S.t; dgObjMoveS(run,k.cap,k.lx,k.lz); }
    else { const W=dgWorldS(run,k.lx,k.lz); k.cap.x=W.x; k.cap.z=W.z; }
  },
  // monsters that come near the captive decide once whether they go for it
  pick(run){
    const k=run.k, E=DG_KITS.escort;
    for(const m of run.mons){
      if(m.boss||m.dead||m.remove||m.dgPick!==undefined||m.dgGuard||m.dgOwn) continue;
      const lx=m.x-run.ox, lz=m.z-run.oz;
      if(Math.hypot(lx-k.lx,lz-k.lz)>E.pickR||!dgLos(run.B,lx,lz,k.lx,k.lz)) continue;
      m.dgPick=Math.random()<E.pickP;
      if(m.dgPick){ m.dgTake=true; m.dgOwn=true; m.aggro=true; m.tgt=null; }
    }
  },
  hud(run){
    const k=run.k, H=k.hall, d=Math.max(0,Math.hypot(k.lx-H.x,k.lz-H.z)-(H.r-3));
    run.hud=[k.state,k.cap.v,Math.round(d)];
  }
});
